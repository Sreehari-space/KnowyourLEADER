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
 * See scripts/linkElections.mts for how links are established.
 */

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

/** The 2021 record for a 2026 candidate, or null when no link is established. */
export async function loadPastDeclaration(
  candidateId: string
): Promise<{ past: PastCandidate; basis: ElectionLink['basis'] } | null> {
  const [links, index] = await Promise.all([loadLinks(), loadPastIndex()]);
  const link = links[candidateId];
  if (!link) return null;
  const past = index.get(link.id2021);
  return past ? { past, basis: link.basis } : null;
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
