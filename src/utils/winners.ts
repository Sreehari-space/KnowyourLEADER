/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Authoritative resolution of the 234 sitting MLAs.
 *
 * The candidate index carries an `isWinner` flag, but it is absent for 75 of
 * the 234 constituencies. Code that picked "the best-looking candidate in this
 * seat" therefore named the wrong person as the sitting member roughly a third
 * of the time.
 *
 * `results.json` declares the winner for every seat, so that is the source of
 * truth here. The affidavit record is attached where it can be matched with
 * confidence, and left null otherwise — a seat is never filled with a guess.
 *
 * The two datasets spell things differently ("Thoothukkudi"/"Thoothukudi",
 * "M. S. Ravi"/"DR.RAVI.M.S"), so both a constituency matcher and a person-name
 * matcher are needed.
 */

export interface ElectionResult {
  constituency_no: number;
  district?: string;
  constituency: string;
  winner?: { candidate: string; party: string; votes: number; vote_percent: number };
  runner_up?: { candidate: string; party: string; votes: number; vote_percent: number };
  margin?: number;
}

export interface ResolvedMla<C extends { id: string; name: string; constituency: string; party: string }> {
  constituencyNo: number;
  /** Seat name as spelled in the affidavit index when matched, else the result file. */
  constituency: string;
  district: string;
  name: string;
  party: string;
  votes: number;
  votePercent: number;
  margin: number;
  runnerUp: string | null;
  runnerUpParty: string | null;
  /** The affidavit record, when it could be matched unambiguously. */
  candidate: C | null;
}

// ─── Text normalisation ─────────────────────────────────────────────────

export function normalizeKey(name: string | undefined | null): string {
  if (!name) return '';
  return String(name).split('(')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
}

const RESERVATION_MARKER = /^(sc|st)$/i;
const DIRECTION_MARKER = /^(north|south|east|west|central)$/i;

/**
 * "SALEM (WEST)  (SALEM)" → { name: 'SALEM WEST', district: 'SALEM' }
 * "Nilakottai (SC)"       → { name: 'Nilakottai',  district: ''      }
 */
export function parseConstituency(raw: string | undefined | null) {
  const s = String(raw || '');
  const groups = [...s.matchAll(/\(([^)]*)\)/g)].map(m => m[1].trim());
  const nameParts = [s.split('(')[0].trim()];
  let district = '';

  for (const g of groups) {
    if (RESERVATION_MARKER.test(g)) continue;
    if (DIRECTION_MARKER.test(g)) nameParts.push(g);
    else district = g;
  }
  return { name: nameParts.filter(Boolean).join(' '), district };
}

/** Collapses the transliteration variants that differ between the two files. */
export function phoneticKey(name: string | undefined | null): string {
  return normalizeKey(name)
    .replace(/zh/g, 'l')
    .replace(/dh/g, 'd')
    .replace(/th/g, 't')
    .replace(/sh/g, 's')
    .replace(/b/g, 'p')
    .replace(/y/g, 'i')
    .replace(/([a-z])\1+/g, '$1');
}

// Seats the two datasets name differently rather than merely spell differently.
const CONSTITUENCY_ALIASES: Record<string, string> = {
  rknagar: 'drradhakrishnannagar',
  virudhachalam: 'vridhachalam',
};

// ─── Person names ───────────────────────────────────────────────────────

const HONORIFICS = new Set(['dr', 'mr', 'mrs', 'ms', 'thiru', 'tmt', 'selvi', 'prof', 'adv', 'er']);

/**
 * The result file writes "M. S. Ravi"; the affidavit index writes
 * "DR.RAVI.M.S". Separate honorifics and initials from the substantive words so
 * the two can be compared regardless of order.
 */
function nameParts(name: string | undefined | null) {
  const tokens = String(name || '').toLowerCase().split(/[^a-z]+/).filter(Boolean);
  const words = new Set<string>();
  const initials = new Set<string>();
  for (const token of tokens) {
    if (HONORIFICS.has(token)) continue;
    if (token.length === 1) initials.add(token);
    else words.add(token);
  }
  return { words, initials };
}

const sameSet = (a: Set<string>, b: Set<string>) => a.size === b.size && [...a].every(x => b.has(x));

/**
 * Find the one record in `pool` naming this person. Returns null when nothing
 * matches, or when two records match equally well — a wrong dossier link is
 * worse than no link.
 */
export function matchPersonName<T>(
  name: string,
  pool: T[],
  getName: (item: T) => string = (item: any) => item.name
): T | null {
  if (!name || !pool || !pool.length) return null;
  const target = nameParts(name);
  if (!target.words.size) return null;

  const exact = pool.filter(r => sameSet(nameParts(getName(r)).words, target.words));
  if (exact.length === 1) return exact[0];
  if (exact.length > 1) {
    const byInitials = exact.filter(r => sameSet(nameParts(getName(r)).initials, target.initials));
    return byInitials.length === 1 ? byInitials[0] : null;
  }

  // One file carries an extra middle name.
  const partial = pool.filter(r => {
    const w = nameParts(getName(r)).words;
    if (!w.size) return false;
    const [small, large] = w.size <= target.words.size ? [w, target.words] : [target.words, w];
    return [...small].every(x => large.has(x));
  });
  if (partial.length === 1) return partial[0];

  // Fold spelling variants and word breaks: "P K SEKARBABU" ↔ "P. K. Sekar Babu".
  const soundOf = (words: Set<string>) => phoneticKey([...words].join('')).split('').sort().join('');
  const targetSound = soundOf(target.words);
  if (!targetSound) return null;
  const sounded = pool.filter(r => soundOf(nameParts(getName(r)).words) === targetSound);
  return sounded.length === 1 ? sounded[0] : null;
}

/** Names in the source data sometimes carry a "(Winner)" annotation. */
export function cleanDisplayName(name: string): string {
  return String(name || '').replace(/\s*\(\s*winner\s*\)/gi, '').trim();
}

// ─── Resolution ─────────────────────────────────────────────────────────

/**
 * Match every declared result to the pool of candidates who contested that
 * seat. Where a seat name is ambiguous across districts (there are two
 * "Tiruppattur" constituencies), the tie is broken by asking which pool
 * actually contains the declared winner.
 */
export function resolveMlas<C extends { id: string; name: string; constituency: string; party: string; isWinner?: boolean; photo?: string }>(
  candidates: C[],
  results: ElectionResult[]
): ResolvedMla<C>[] {
  const pools = new Map<string, C[]>();
  for (const c of candidates) {
    if (!pools.has(c.constituency)) pools.set(c.constituency, []);
    pools.get(c.constituency)!.push(c);
  }

  const exactIndex = new Map<string, string[]>();
  const phoneticIndex = new Map<string, string[]>();
  for (const seat of pools.keys()) {
    const { name } = parseConstituency(seat);
    const push = (map: Map<string, string[]>, key: string) => {
      if (!key) return;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(seat);
    };
    push(exactIndex, normalizeKey(name));
    push(phoneticIndex, phoneticKey(name));
  }

  const findPools = (resultConstituency: string): string[] => {
    const { name } = parseConstituency(resultConstituency);
    const alias = CONSTITUENCY_ALIASES[normalizeKey(name)];
    const attempts: Array<[Map<string, string[]>, string]> = [
      [exactIndex, normalizeKey(name)],
      [phoneticIndex, phoneticKey(name)],
    ];
    if (alias) attempts.unshift([exactIndex, alias], [phoneticIndex, phoneticKey(alias)]);

    for (const [map, key] of attempts) {
      const hit = map.get(key);
      if (hit && hit.length) return hit;
    }
    return [];
  };

  return results
    .filter(r => r && r.winner)
    .map(result => {
      const winnerName = cleanDisplayName(result.winner!.candidate);
      const seats = findPools(result.constituency);

      // Prefer the seat whose field actually contains the declared winner.
      let seat: string | null = null;
      let candidate: C | null = null;

      for (const option of seats) {
        const hit = matchPersonName(winnerName, pools.get(option)!, c => c.name);
        if (hit) {
          seat = option;
          candidate = hit;
          break;
        }
      }
      if (!seat && seats.length === 1) seat = seats[0];

      // Fall back to a flagged winner in the resolved seat.
      if (seat && !candidate) {
        const flagged = (pools.get(seat) || []).filter(c => c.isWinner);
        if (flagged.length === 1) candidate = flagged[0];
      }

      return {
        constituencyNo: result.constituency_no,
        constituency: seat || result.constituency,
        district: parseConstituency(seat || '').district || result.district || '',
        name: winnerName,
        party: result.winner!.party,
        votes: Number(result.winner!.votes) || 0,
        votePercent: Number(result.winner!.vote_percent) || 0,
        margin: Number(result.margin) || 0,
        runnerUp: result.runner_up ? cleanDisplayName(result.runner_up.candidate) : null,
        runnerUpParty: result.runner_up ? result.runner_up.party : null,
        candidate,
      };
    })
    .sort((a, b) => a.constituencyNo - b.constituencyNo);
}
