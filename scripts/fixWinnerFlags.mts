/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Recompute `isWinner` on every candidate from the declared results.
 *
 *   node scripts/fixWinnerFlags.mts [--dry]
 *
 * Requires Node 22+, which strips the TypeScript types from the imported
 * resolver without a build step.
 *
 * Why this exists
 * ---------------
 * The `isWinner` flag arrives from the upstream pipeline and does not agree
 * with results.json, which is the authoritative record of who holds each seat:
 *
 *   - only 159 of 234 seats had a candidate carrying the flag, so roughly a
 *     third of sitting members never showed the "Winner" badge;
 *   - one candidate was flagged in a seat he did not win. S. Inigo Irudayaraj
 *     is recorded in Tiruchirappalli (East) — won by C. Joseph Vijay with
 *     91,381 votes — while carrying 88,235 votes, which is the figure for
 *     K. N. Nehru in Tiruchirappalli (West).
 *
 * Rather than trust the flag, this derives it using the same resolver MLA Watch
 * already uses: constituency aliases, phonetic seat matching and fuzzy person
 * matching. It links 223 of the 234 declared winners. The remaining 11 cannot
 * be matched confidently, so their seats are left without a flagged winner
 * rather than guessed at.
 *
 * Run after any refresh of merged_candidates.json, then regenerate the derived
 * data with splitCandidates.cjs and buildAffidavits.cjs.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveMlas } from '../src/utils/winners.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MERGED = path.join(ROOT, 'public', 'merged_candidates.json');
const RESULTS = path.join(ROOT, 'public', 'results.json');
const DRY = process.argv.includes('--dry');

const candidates: any[] = JSON.parse(fs.readFileSync(MERGED, 'utf8'));
const results = JSON.parse(fs.readFileSync(RESULTS, 'utf8'));

const mlas = resolveMlas(candidates as any, results);
const linked = mlas.filter((m) => m.candidate);
const shouldWin = new Set(linked.map((m) => m.candidate!.id));

let added = 0;
let cleared = 0;
const clearedRows: string[] = [];

for (const c of candidates) {
  const wins = shouldWin.has(c.id);
  if (wins && !c.isWinner) added++;
  if (!wins && c.isWinner) {
    cleared++;
    clearedRows.push(`${c.name} — ${c.party}, ${c.constituency}`);
  }
  c.isWinner = wins;
}

console.log(`declared seats            : ${mlas.length}`);
console.log(`resolved to a candidate   : ${linked.length}`);
console.log(`could not be resolved     : ${mlas.length - linked.length}`);
console.log(`flags added               : ${added}`);
console.log(`flags cleared             : ${cleared}`);
for (const row of clearedRows) console.log(`  cleared -> ${row}`);

if (DRY) {
  console.log('\n--dry: nothing written');
} else {
  fs.writeFileSync(MERGED, JSON.stringify(candidates), 'utf8');
  console.log(`\nwrote ${MERGED}`);
  console.log('now run: node scripts/splitCandidates.cjs && node scripts/buildAffidavits.cjs');
}
