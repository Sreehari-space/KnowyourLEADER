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
  // "(Winner)" is an annotation, not part of anybody's name. Left in, it becomes
  // a substantive word and stops two DMK winners matching their own records.
  const tokens = cleanDisplayName(String(name || '')).toLowerCase().split(/[^a-z]+/).filter(Boolean);
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

/** Levenshtein distance, capped — only small values are of any interest here. */
function editDistance(a: string, b: string, cap: number): number {
  if (Math.abs(a.length - b.length) > cap) return cap + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + cost);
      best = Math.min(best, row[j]);
    }
    if (best > cap) return cap + 1;
    prev = row;
  }
  return prev[b.length];
}

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

  /*
   * One file carries an extra middle name: "Sattur Ramachandran" against
   * "RAMACHANDRAN. K.K.S.S.R".
   *
   * When the overlap is a single word it has to be a distinctive one. Matching
   * on one short given name is not evidence of identity — "C. Joseph Vijay"
   * was being linked to an unrelated "VIJAY .K" from another party on the
   * strength of "vijay" alone.
   */
  const partial = pool.filter(r => {
    const w = nameParts(getName(r)).words;
    if (!w.size) return false;
    const [small, large] = w.size <= target.words.size ? [w, target.words] : [target.words, w];
    if (![...small].every(x => large.has(x))) return false;
    if (small.size === 1 && [...small][0].length < 7) return false;
    return true;
  });
  if (partial.length === 1) return partial[0];

  // Fold spelling variants and word breaks: "P K SEKARBABU" ↔ "P. K. Sekar Babu".
  const soundOf = (words: Set<string>) => phoneticKey([...words].join('')).split('').sort().join('');
  const targetSound = soundOf(target.words);
  if (!targetSound) return null;
  const sounded = pool.filter(r => soundOf(nameParts(getName(r)).words) === targetSound);
  if (sounded.length === 1) return sounded[0];

  /*
   * Last resort: the two files transliterate the same Tamil name slightly
   * differently, so even the phonetic key differs by a character or two —
   * "Thendral"/"Thenral", "Vilvanathan"/"Vilwanathan", "Lakshman"/"Lakshmanan".
   * An anagram comparison cannot bridge that because the letter multiset is not
   * equal, so allow a small edit distance instead.
   *
   * The tolerance stays tight and, as everywhere else here, an ambiguous result
   * returns null: a wrong dossier link is worse than no link.
   */
  /*
   * Compare word by word rather than as one joined string. Joining and sorting
   * is order-unstable across spelling variants: "Sethupathi/Srinivasa" sorts one
   * way and "Seenivasa/Sethupathy" the other, so two renderings of the same name
   * end up looking nothing alike.
   */
  const wordCost = (w: string) => (w.length >= 7 ? 2 : 1);
  const fuzzyEqual = (a: Set<string>, b: Set<string>) => {
    if (a.size !== b.size || !a.size) return false;
    const theirs = [...b].map(phoneticKey);
    const taken = new Array(theirs.length).fill(false);
    for (const word of [...a].map(phoneticKey)) {
      const tol = wordCost(word);
      const i = theirs.findIndex((t, k) => !taken[k] && editDistance(word, t, tol) <= tol);
      if (i < 0) return false;
      taken[i] = true;
    }
    return true;
  };

  const near = pool.filter(r => fuzzyEqual(target.words, nameParts(getName(r)).words));
  return near.length === 1 ? near[0] : null;
}

/**
 * The two files name parties differently — "TVK" against "Tamilaga Vettri
 * Kazhagam", "AMMK" against "Amma Makkal Munnettra Kazagam". Compare on the
 * initials of the full name as well as the name itself.
 */
export function partyMatches(a: string | undefined, b: string | undefined): boolean {
  const A = normalizeKey(a);
  const B = normalizeKey(b);
  if (!A || !B) return false;
  if (A === B) return true;
  const initials = (s: string | undefined) =>
    String(s || '').split(/[^A-Za-z]+/).filter(Boolean).map(w => w[0].toLowerCase()).join('');
  return A === initials(b) || B === initials(a) || phoneticKey(a) === phoneticKey(b);
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

      /*
       * Second pass, restricted to the party the winner actually stood for.
       * Two candidates can share a name in one seat — Mannargudi runs a
       * "Kamaraj. S" for AMMK and a "Kamaraj.S" for BSP — and the matcher
       * rightly refuses to choose between them. The declared party settles it,
       * and shrinking the pool this way also removes the ambiguity that was
       * blocking looser spelling matches elsewhere.
       */
      if (!candidate) {
        const declaredParty = result.winner!.party;
        for (const option of seats) {
          const sameParty = (pools.get(option) || []).filter(c => partyMatches(c.party, declaredParty));
          if (!sameParty.length) continue;
          // The name must still match. Narrowing by party is only allowed to
          // break a tie, never to make the match on its own: abbreviations
          // collide, and "TVK" is both Tamilaga Vettri Kazhagam and Tamizhaga
          // Vaazhvurimai Katchi. Accepting on party alone linked Thiruvallur's
          // declared winner to an unrelated candidate from the other party.
          const hit = matchPersonName(winnerName, sameParty, c => c.name);
          if (hit) {
            seat = option;
            candidate = hit;
            break;
          }
        }
      }

      if (!seat && seats.length === 1) seat = seats[0];

      /*
       * Fall back to a flagged winner in the resolved seat — but only one whose
       * party agrees with the declared result.
       *
       * The flag is not independent evidence: scripts/fixWinnerFlags.mts sets it
       * from this very function, so an incorrect flag would otherwise reassert
       * itself on every run. That is how Tiruchirappalli (East) came to link its
       * declared TVK winner to a candidate from All India Jananayaka Makkal
       * Kazhagam. Requiring the party to agree breaks the loop.
       */
      if (seat && !candidate) {
        const flagged = (pools.get(seat) || [])
          .filter(c => c.isWinner && partyMatches(c.party, result.winner!.party));
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
