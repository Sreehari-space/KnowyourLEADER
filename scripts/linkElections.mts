/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Link 2026 candidates to their 2021 record.
 *
 *   node scripts/linkElections.mts [--dry]
 *
 * Requires Node 22+ for TypeScript stripping on the imported matcher.
 *
 * Only two rules produce a link, both requiring corroboration beyond the name:
 *
 *   1. same constituency + fuzzy name match
 *   2. fuzzy name match anywhere + the same father's/husband's name
 *
 * A statewide name match on its own is deliberately rejected. It looks
 * productive — it "matches" 475 more candidates — but almost all of them are
 * wrong. Measured against the real data it paired "A.SUBETHAR" of Kulithalai
 * with "SURENTHAR. K" of Kilvelur, and "A.PANDIAN" of Gangavalli with
 * "PANDIAN. K.A" of Chidambaram. Tamil given names repeat heavily, so a name
 * alone is not identity, and merging two people's declared finances is not a
 * mistake that can be spotted downstream.
 *
 * Writes public/data/election_links.json: { "<2026 id>": { id2021, basis } }.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { matchPersonName, phoneticKey } from '../src/utils/winners.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'public', 'data');
const DRY = process.argv.includes('--dry');

const cur: any[] = JSON.parse(fs.readFileSync(path.join(DATA, 'candidates_index.json'), 'utf8'));
const past: any[] = JSON.parse(fs.readFileSync(path.join(DATA, 'candidates2021_index.json'), 'utf8'));

// The 2026 index has no father's/husband's name; it lives in the affidavits.
const relative2026 = new Map<string, string>();
for (const f of fs.readdirSync(DATA).filter(f => /^affidavit_chunk_\d+\.json$/.test(f))) {
  const chunk = JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8'));
  for (const [id, a] of Object.entries<any>(chunk)) if (a.relative) relative2026.set(id, a.relative);
}

const seatOf = (s: string) => String(s || '').split('(')[0].trim().toUpperCase();
const relKey = (s: string) => phoneticKey(String(s || '').toUpperCase().replace(/[^A-Z]/g, ''));

const bySeat = new Map<string, any[]>();
for (const p of past) {
  const k = seatOf(p.constituency);
  if (!bySeat.has(k)) bySeat.set(k, []);
  bySeat.get(k)!.push(p);
}

const links: Record<string, { id2021: string; basis: string }> = {};
const taken = new Set<string>();
let bySeatName = 0;
let byRelative = 0;
const samples: string[] = [];

for (const c of cur) {
  // Rule 1 — same seat, fuzzy name.
  const pool = (bySeat.get(seatOf(c.constituency)) || []).filter(p => !taken.has(p.id));
  const hit = pool.length ? matchPersonName(c.name, pool, (p: any) => p.name) : null;
  if (hit) {
    links[c.id] = { id2021: hit.id, basis: 'same-seat-name' };
    taken.add(hit.id);
    bySeatName++;
    if (samples.length < 6) samples.push(`${c.name} (${c.party}) ~ ${hit.name} (${hit.party}) — ${seatOf(c.constituency)}`);
    continue;
  }

  // Rule 2 — name anywhere, corroborated by the father's/husband's name.
  const rel = relKey(relative2026.get(c.id) || '');
  if (!rel || rel.length < 4) continue;
  const candidates = past.filter(p => !taken.has(p.id) && relKey(p.relative) === rel);
  if (!candidates.length) continue;
  const hit2 = matchPersonName(c.name, candidates, (p: any) => p.name);
  if (hit2) {
    links[c.id] = { id2021: hit2.id, basis: 'name-and-relative' };
    taken.add(hit2.id);
    byRelative++;
  }
}

console.log(`2026 candidates            : ${cur.length}`);
console.log(`2021 candidates            : ${past.length}`);
console.log(`linked, same seat + name   : ${bySeatName}`);
console.log(`linked, name + relative    : ${byRelative}`);
console.log(`TOTAL LINKED               : ${Object.keys(links).length}`);
console.log('\nsamples:');
samples.forEach(s => console.log('  ' + s));

if (DRY) {
  console.log('\n--dry: nothing written');
} else {
  fs.writeFileSync(path.join(DATA, 'election_links.json'), JSON.stringify(links), 'utf8');
  console.log(`\nwrote public/data/election_links.json`);
}
