/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * The same candidate's 2021 declaration, where one can be identified.
 *
 * 2021 is kept as a separate dataset with a link table rather than merged into
 * the 2026 records. Only 338 of 1,799 candidates have a 2021 counterpart that
 * can be established with confidence — most simply did not stand in 2021, and
 * a name alone is not identity in this data. Keeping them apart means a link
 * that turns out to be wrong is one entry to delete, not two people's finances
 * silently fused together.
 *
 * The 1,520 people who stood in 2021 and not in 2026 are listed in their own
 * right — see toDirectoryCandidates below. The 338 who stood in both are not
 * listed twice: their 2021 filing is merged into their 2026 dossier instead, so
 * one person is one entry.
 *
 * See scripts/linkElections.mts for how links are established.
 */

import type { FullAffidavit, AffidavitSchema } from './affidavitLoader';
import type { Candidate } from '../types';
import { FORMAT_CURRENCY } from '../data/candidates';
import { isIndependent, withoutIndependents } from './independents';

export interface PastCandidate {
  id: string;
  name: string;
  party: string;
  constituency: string;
  age: string;
  education: string;
  relative: string;
  assets: number;
  liabilities: number;
  netWorth: number;
  caseCount: number;
  isWinner: boolean;
  sourceUrl: string;
}

export interface ElectionLink {
  id2021: string;
  basis: 'same-seat-name' | 'name-and-relative';
}

let linkPromise: Promise<Record<string, ElectionLink>> | null = null;
let indexPromise: Promise<Map<string, PastCandidate>> | null = null;

function loadLinks() {
  if (!linkPromise) {
    linkPromise = fetch('/data/election_links.json')
      .then(r => (r.ok ? r.json() : {}))
      .catch(() => ({}));
  }
  return linkPromise;
}

function loadPastIndex() {
  if (!indexPromise) {
    indexPromise = fetch('/data/candidates2021_index.json')
      .then(r => (r.ok ? r.json() : []))
      .then((rows: PastCandidate[]) => new Map(rows.map(r => [r.id, r])))
      .catch(() => new Map<string, PastCandidate>());
  }
  return indexPromise;
}

/**
 * The 2021 record for a 2026 candidate, or null when no link is established.
 *
 * A 2021 record for someone who stood as an independent that year is not
 * returned: the site shows party candidates only, in both elections. The 2026
 * dossier still renders in full — only the older filing is withheld.
 */
export async function loadPastDeclaration(
  candidateId: string
): Promise<{ past: PastCandidate; basis: ElectionLink['basis'] } | null> {
  const [links, index] = await Promise.all([loadLinks(), loadPastIndex()]);
  const link = links[candidateId];
  if (!link) return null;
  const past = index.get(link.id2021);
  if (!past || isIndependent(past.party)) return null;
  return { past, basis: link.basis };
}

/**
 * Growth between the two declarations.
 *
 * Returns null when the earlier figure is zero or negative — a percentage
 * against nothing is not meaningful, and printing "∞%" would be worse than
 * printing the two numbers and letting the reader draw the comparison.
 */
export function growth(then: number, now: number): number | null {
  if (!(then > 0)) return null;
  return ((now - then) / then) * 100;
}

/**
 * The 2021 candidates who do not appear in 2026, as directory entries.
 *
 * Anyone linked to a 2026 candidate is left out: their 2021 declaration is
 * already merged into that person's dossier, and listing them again would show
 * one human being as two candidates.
 *
 * The 2021 index carries fewer fields than the 2026 one — no photograph, and
 * no pending/convicted split on the case count, only the total. Those are left
 * empty rather than guessed at: the card falls back to an initial, and the
 * dossier shows the total it actually has.
 */
export async function toDirectoryCandidates(): Promise<Candidate[]> {
  const [links, index] = await Promise.all([loadLinks(), loadPastIndex()]);

  const linkedTo2026 = new Set(Object.values(links).map(l => l.id2021));

  const rows: Candidate[] = [];
  for (const past of index.values()) {
    if (linkedTo2026.has(past.id)) continue;

    const positive = past.netWorth >= 0;
    rows.push({
      id: past.id,
      election: '2021',
      name: past.name,
      party: past.party,
      constituency: past.constituency,
      age: past.age,
      education: past.education,
      selfProfession: (past as PastCandidate & { selfProfession?: string }).selfProfession || '',
      spouseProfession: '',
      assets: past.assets,
      assetsFormatted: FORMAT_CURRENCY(past.assets),
      liabilities: past.liabilities,
      liabilitiesFormatted: FORMAT_CURRENCY(past.liabilities),
      netWorth: past.netWorth,
      // Magnitude only, with the sign carried in netWorthPositive — the same
      // convention the 2026 index uses. See FORMAT_NET_WORTH.
      netWorthFormatted: FORMAT_CURRENCY(Math.abs(past.netWorth)),
      netWorthPositive: positive,
      caseCount: past.caseCount,
      pendingCount: 0,
      convictedCount: 0,
      severityTier: '',
      caseCategories: [],
      caseSummary: '',
      taxYears: [],
      reviewScore: 0,
      reviewTier: null,
      reviewCategories: [],
      indicatorCodes: [],
      photo: '',
      cartoonImage: null,
      jsonFile: '',
      sourceJsonFile: '',
      isWinner: past.isWinner,
      sourceUrl: past.sourceUrl,
    });
  }

  return withoutIndependents(rows);
}

// ─── The full 2021 Form 26 declaration ──────────────────────────────────
//
// The 2021 affidavits are chunked exactly as the 2026 ones are, and against an
// identical schema: the same nine movable heads, five immovable, sixteen
// liability and six contract heads, in the same order. That is what makes a
// head-by-head merge possible rather than two documents shown side by side.
//
// Keyed by the 2021 candidate id, so a caller has to have resolved a link
// first — see loadPastDeclaration above.

interface PastAffidavitManifest {
  election: string;
  chunkSize: number;
  chunks: string[];
  idMap: Record<string, number>;
  schema: AffidavitSchema;
}

const pastChunkCache = new Map<number, Record<string, FullAffidavit>>();
const pastChunkLoading = new Map<number, Promise<Record<string, FullAffidavit> | null>>();

let pastManifestCache: PastAffidavitManifest | null = null;
let pastManifestLoading: Promise<PastAffidavitManifest | null> | null = null;

function loadPastManifest(): Promise<PastAffidavitManifest | null> {
  if (pastManifestCache) return Promise.resolve(pastManifestCache);
  if (pastManifestLoading) return pastManifestLoading;

  pastManifestLoading = fetch('/data/affidavit2021_manifest.json')
    .then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then((m: PastAffidavitManifest) => {
      pastManifestCache = m;
      return m;
    })
    .catch(err => {
      console.warn('[PastAffidavit] Manifest unavailable:', err);
      pastManifestLoading = null;
      return null;
    });

  return pastManifestLoading;
}

/** In-flight requests are shared, so two panels opening at once fetch once. */
function loadPastChunk(index: number): Promise<Record<string, FullAffidavit> | null> {
  const cached = pastChunkCache.get(index);
  if (cached) return Promise.resolve(cached);

  const inFlight = pastChunkLoading.get(index);
  if (inFlight) return inFlight;

  const promise = loadPastManifest()
    .then(manifest => {
      if (!manifest || index < 0 || index >= manifest.chunks.length) return null;
      return fetch(`/data/${manifest.chunks[index]}`).then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      });
    })
    .then((data: Record<string, FullAffidavit> | null) => {
      if (data) pastChunkCache.set(index, data);
      return data;
    })
    .catch(err => {
      console.warn(`[PastAffidavit] Chunk ${index} failed:`, err);
      pastChunkLoading.delete(index);
      return null;
    });

  pastChunkLoading.set(index, promise);
  return promise;
}

/**
 * The complete 2021 declaration for a 2021 candidate id, or null.
 *
 * The schema comes back alongside it for symmetry with loadFullAffidavit, but
 * it is the same schema the 2026 manifest carries.
 */
export async function loadPastAffidavit(
  id2021: string
): Promise<{ affidavit: FullAffidavit; schema: AffidavitSchema } | null> {
  const manifest = await loadPastManifest();
  if (!manifest) return null;

  const index = manifest.idMap[id2021];
  if (index === undefined) return null;

  const chunk = await loadPastChunk(index);
  const affidavit = chunk ? chunk[id2021] : null;
  return affidavit ? { affidavit, schema: manifest.schema } : null;
}
