/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Independent candidates are excluded from the site.
 *
 * Only candidates standing on a party ticket are shown, in both elections. The
 * rule is applied at the two points where candidate data enters the app — the
 * 2026 index on load, and the 2021 link lookup — so there is no path by which
 * an independent reaches a listing, a dossier or a comparison.
 *
 * Worth knowing before debugging this: against the data currently shipped it
 * removes nobody. All 1,799 records in candidates_index.json and all 1,858 in
 * candidates2021_index.json carry a named registered party — 104 parties in
 * 2026 and 113 in 2021, with no "IND", no "Independent" and no blank party
 * field in either year. The filter exists so that a future data refresh that
 * does contain independents cannot quietly put them back on the site.
 */

/**
 * True when a party label denotes no party at all.
 *
 * A blank counts: standing without a party is what being an independent means,
 * and the ECI exports leave the field empty for them. The exact-token test for
 * "IND" is deliberately anchored — "INC", "IUML" and the several dozen party
 * names beginning "India…" must not match.
 */
export function isIndependent(party?: string | null): boolean {
  const p = (party ?? '').trim();
  if (!p) return true;
  if (/^inds?\.?$/i.test(p)) return true;
  if (/independent/i.test(p)) return true;
  if (/சுயேச்ச|சுயேட்ச/.test(p)) return true;
  return false;
}

/** The same list with any independent removed. */
export function withoutIndependents<T extends { party?: string | null }>(rows: T[]): T[] {
  return rows.filter(row => !isIndependent(row.party));
}
