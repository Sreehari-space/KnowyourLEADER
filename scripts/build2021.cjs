/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Ingest the 2021 affidavit dump into the same shape the 2026 data uses.
 *
 *   node scripts/build2021.cjs [sourceDir]
 *
 * The scraped 2021 records are structurally identical to the 2026 affidavits —
 * the same {self, spouse, huf, dependentN} map per head, the same
 * "1,00,000 1 Lacs+" value encoding, the same criminal-case and summary shapes.
 * The one difference is that 2021 keys each head by its full name ("Cash",
 * "Agricultural Land") while the 2026 chunks key by position against a schema.
 * Since the head names are byte-identical between the two years, remapping is a
 * direct lookup and nothing has to be re-parsed.
 *
 * Independents are dropped on the way in, matching the 2026 dataset.
 *
 * Writes public/data/affidavit2021_chunk_*.json, candidates2021_index.json and
 * affidavit2021_manifest.json.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'public', 'data');
const SRC = process.argv[2] || path.resolve(ROOT, '..', 'candidates_data_TamilNadu2021');
const CHUNK_SIZE = 100;

const schema = JSON.parse(
  fs.readFileSync(path.join(OUT_DIR, 'affidavit_manifest.json'), 'utf8')
).schema;

/** Head name → index, per section, taken from the 2026 schema. */
const headIndex = {};
for (const [section, heads] of Object.entries(schema)) {
  headIndex[section] = new Map(heads.map((h, i) => [h.trim().toLowerCase(), String(i)]));
}

const isIndependent = (party) => /^ind$|^independent$/i.test(String(party || '').trim());

const num = (v) => {
  const n = parseFloat(String(v || '').replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? n : 0;
};

/** "Rs 67,59,267 ~67 Lacs+" → 6759267 */
function parseTotal(value) {
  const m = String(value || '').match(/Rs\.?\s*([\d,]+(?:\.\d+)?)/i);
  if (!m) return 0;
  const n = parseFloat(m[1].replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
}

/** Remap a head-name-keyed section onto the schema's positional keys. */
function remap(section, source) {
  const out = {};
  const lookup = headIndex[section];
  if (!lookup || !source) return out;
  for (const [head, relations] of Object.entries(source)) {
    const idx = lookup.get(String(head).trim().toLowerCase());
    if (idx === undefined) continue;
    // Keep only relations that actually declared something.
    const kept = {};
    for (const [rel, val] of Object.entries(relations || {})) {
      if (val && !/^nil$/i.test(String(val).trim())) kept[rel] = val;
    }
    if (Object.keys(kept).length) out[idx] = kept;
  }
  return out;
}

const slug = (s) =>
  String(s || '').toLowerCase().replace(/\(winner\)/g, '').replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '').slice(0, 60);

// ─── Read ───────────────────────────────────────────────────────────────
if (!fs.existsSync(SRC)) {
  console.error(`✖ 2021 source directory not found: ${SRC}`);
  process.exit(1);
}

const files = fs.readdirSync(SRC).filter((f) => f.endsWith('.json'));
console.log(`📂 source: ${SRC} (${files.length} files)`);

const index = [];
const affidavits = {};
let dropped = 0;
let skipped = 0;

for (const file of files) {
  let d;
  try {
    d = JSON.parse(fs.readFileSync(path.join(SRC, file), 'utf8'));
  } catch {
    skipped++;
    continue;
  }
  if (!d || !d.candidate_name) { skipped++; continue; }
  if (isIndependent(d.party)) { dropped++; continue; }

  const name = String(d.candidate_name).replace(/\s*\(winner\)/gi, '').trim();
  const isWinner = /\(winner\)/i.test(d.candidate_name);
  const id = `${slug(name)}-${slug(d.party)}-${slug(String(d.constituency).split('(')[0])}-${d.candidate_id}`;

  const assets = parseTotal(d.asset_liability_summary && d.asset_liability_summary['Assets:']);
  const liabilities = parseTotal(d.asset_liability_summary && d.asset_liability_summary['Liabilities:']);

  index.push({
    id,
    candidateId: String(d.candidate_id || ''),
    name,
    party: d.party || '',
    constituency: d.constituency || '',
    age: d.age || '',
    education: d.education || '',
    selfProfession: d.self_profession || '',
    relative: d.relative || '',
    assets,
    liabilities,
    netWorth: assets - liabilities,
    caseCount: num(d.criminal_cases && d.criminal_cases.count),
    isWinner,
    sourceUrl: d.source_url || '',
  });

  affidavits[id] = {
    relative: d.relative || '',
    voterInfo: d.voter_info || '',
    professions: d.detailed_profession || {},
    incomeSources: d.income_sources || {},
    movable: remap('movable', d.movable_assets),
    immovable: remap('immovable', d.immovable_assets),
    liabilities: remap('liabilities', d.liabilities),
    contracts: remap('contracts', d.contracts),
    tax: (d.income_tax_details || []).reduce((acc, row) => {
      let entry = acc.find((x) => x.relation === row.relation);
      if (!entry) { entry = { relation: row.relation, pan: row.pan_given, years: [] }; acc.push(entry); }
      if (row.income && !/^nil$/i.test(row.income)) {
        entry.years.push({ year: row.year === 'None' ? null : row.year, amount: parseTotal(row.income) || num(row.income) });
      }
      return acc;
    }, []),
    cases: {
      count: num(d.criminal_cases && d.criminal_cases.count),
      pending: (d.criminal_cases && d.criminal_cases.pending_cases) || [],
      convicted: (d.criminal_cases && d.criminal_cases.convicted_cases) || [],
    },
    summary: d.asset_liability_summary || {},
  };
}

// ─── Write ──────────────────────────────────────────────────────────────
for (const f of fs.readdirSync(OUT_DIR).filter((f) => /^affidavit2021_chunk_\d+\.json$/.test(f))) {
  fs.unlinkSync(path.join(OUT_DIR, f));
}

const ids = Object.keys(affidavits);
const chunks = [];
const idMap = {};
for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
  const slice = ids.slice(i, i + CHUNK_SIZE);
  const n = chunks.length;
  const chunk = {};
  for (const id of slice) { chunk[id] = affidavits[id]; idMap[id] = n; }
  const fname = `affidavit2021_chunk_${n}.json`;
  fs.writeFileSync(path.join(OUT_DIR, fname), JSON.stringify(chunk), 'utf8');
  chunks.push(fname);
}

fs.writeFileSync(path.join(OUT_DIR, 'candidates2021_index.json'), JSON.stringify(index), 'utf8');
fs.writeFileSync(
  path.join(OUT_DIR, 'affidavit2021_manifest.json'),
  JSON.stringify({ election: 'TamilNadu2021', generatedAt: new Date().toISOString().slice(0, 10), total: ids.length, chunkSize: CHUNK_SIZE, chunks, idMap, schema }),
  'utf8'
);

const mb = (n) => (n / 1024 / 1024).toFixed(2);
const total = chunks.reduce((s, f) => s + fs.statSync(path.join(OUT_DIR, f)).size, 0);
console.log(`⏭  dropped independents : ${dropped}`);
if (skipped) console.log(`⚠  unreadable / no name : ${skipped}`);
console.log(`✅ ${ids.length} candidates across ${chunks.length} chunks (${mb(total)} MB)`);
console.log(`   index: candidates2021_index.json`);
