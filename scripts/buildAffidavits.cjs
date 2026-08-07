/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * buildAffidavits.cjs
 *
 * Builds the *complete* Form 26 record for every candidate into lazily-loaded
 * chunks, so the dossier can show every declared field rather than the handful
 * that merged_candidates.json carries.
 *
 * The site's existing detail chunks only carry vehicles, jewellery, real estate
 * and pending cases. The source affidavits also declare cash, bank deposits,
 * shares, postal savings, insurance, loans given, other assets, sixteen
 * separate liability heads, six categories of government/company contracts,
 * income sources, income-tax filings for spouse/HUF/dependants, and convicted
 * cases. All of that is preserved here.
 *
 * Input : <AFFIDAVIT_DIR>/<jsonFile>            (defaults to the sibling dataset)
 * Output: public/data/affidavit_manifest.json
 *         public/data/affidavit_chunk_N.json
 *
 * Usage: node scripts/buildAffidavits.cjs [affidavitDir]
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MERGED = path.join(ROOT, 'public', 'merged_candidates.json');
const OUT_DIR = path.join(ROOT, 'public', 'data');
const CHUNK_SIZE = 100;

const AFFIDAVIT_DIR =
  process.argv[2] ||
  process.env.AFFIDAVIT_DIR ||
  path.resolve(ROOT, '..', 'website', 'cleaned_source_data', 'json');

// ─── Helpers ────────────────────────────────────────────────────────────

// "nil" is overwhelmingly standard in this dataset, but a handful of affidavits
// use spelling variants. Only exact matches count — "SBI 0" is a real
// declaration of a zero-balance account and must be preserved.
const NIL_PATTERN = /^(?:nil+|none|n\/?a|n\.a\.?|not\s*applicable|no|-+|0+(?:\.0+)?)$/i;

function isNil(value) {
  if (value === null || value === undefined) return true;
  return NIL_PATTERN.test(String(value).trim());
}

/** Keep only relations that actually declared something. */
function compactRelations(categoryValue) {
  if (!categoryValue || typeof categoryValue !== 'object') {
    return isNil(categoryValue) ? null : { self: String(categoryValue) };
  }
  const out = {};
  for (const [relation, value] of Object.entries(categoryValue)) {
    if (!isNil(value)) out[relation] = String(value).trim();
  }
  return Object.keys(out).length ? out : null;
}

/**
 * Reduce a section to { categoryIndex: {relation: value} }, dropping wholly
 * undeclared categories. The category names live once in the manifest schema.
 */
function compactSection(section, schema) {
  if (!section || typeof section !== 'object') return null;
  const out = {};
  for (const [category, value] of Object.entries(section)) {
    const idx = schema.indexOf(category);
    if (idx === -1) continue;
    const relations = compactRelations(value);
    if (relations) out[idx] = relations;
  }
  return Object.keys(out).length ? out : null;
}

/**
 * "2024 - 2025: Rs 9,82,44,850 | 2023 - 2024: Rs 1,02,05,660" → [{year, amount}]
 *
 * Some affidavits omit the year labels and declare bare amounts
 * ("Rs 4,91,830 | Rs 4,98,240 | …"). Those are kept with a null year rather
 * than discarded — an unlabelled declaration is still a declaration.
 */
function parseIncomeSeries(income) {
  if (isNil(income)) return [];
  const labelled = [];
  const unlabelled = [];

  for (const part of String(income).split('|')) {
    const amountMatch = part.match(/Rs\.?\s*([\d,]+)/i) || part.match(/([\d][\d,]{2,})/);
    if (!amountMatch) continue;
    const amount = parseInt(amountMatch[1].replace(/,/g, ''), 10) || 0;

    const yearMatch = part.match(/(\d{4})\s*-\s*(\d{4})/);
    if (yearMatch) labelled.push({ year: `${yearMatch[1]}-${yearMatch[2]}`, amount });
    else unlabelled.push({ year: null, amount });
  }

  labelled.sort((a, b) => a.year.localeCompare(b.year));
  return [...labelled, ...unlabelled];
}

function compactPlainMap(obj) {
  if (!obj || typeof obj !== 'object') return null;
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (!isNil(v)) out[k] = String(v).trim();
  }
  return Object.keys(out).length ? out : null;
}

/** Preserve every declared field of a case record. */
function compactCase(record) {
  const out = {};
  for (const [k, v] of Object.entries(record || {})) {
    if (k === 'ipc_sections') {
      if (Array.isArray(v)) {
        if (v.length) out.ipcSections = v;
      } else if (!isNil(v)) {
        out.ipcSections = String(v).trim();
      }
      continue;
    }
    if (!isNil(v)) out[k] = typeof v === 'string' ? v.trim() : v;
  }
  return Object.keys(out).length ? out : null;
}

// ─── Schema discovery ───────────────────────────────────────────────────

function discoverSchema(files) {
  const order = { movable_assets: [], immovable_assets: [], liabilities: [], contracts: [] };
  const seen = { movable_assets: new Set(), immovable_assets: new Set(), liabilities: new Set(), contracts: new Set() };

  // Every affidavit uses the same Form 26 headings; scan a slice for order and
  // then confirm across the rest so a rare extra heading is not dropped.
  for (const file of files) {
    let data;
    try {
      data = JSON.parse(fs.readFileSync(path.join(AFFIDAVIT_DIR, file), 'utf8'));
    } catch {
      continue;
    }
    for (const section of Object.keys(order)) {
      const obj = data[section];
      if (!obj || typeof obj !== 'object') continue;
      for (const key of Object.keys(obj)) {
        if (!seen[section].has(key)) {
          seen[section].add(key);
          order[section].push(key);
        }
      }
    }
  }
  return order;
}

// ─── Main ───────────────────────────────────────────────────────────────

function main() {
  if (!fs.existsSync(AFFIDAVIT_DIR)) {
    console.error(`✖ Affidavit source directory not found: ${AFFIDAVIT_DIR}`);
    console.error('  Pass it explicitly: node scripts/buildAffidavits.cjs <dir>');
    process.exit(1);
  }

  const candidates = JSON.parse(fs.readFileSync(MERGED, 'utf8'));
  const available = new Set(fs.readdirSync(AFFIDAVIT_DIR));
  console.log(`📂 Affidavit source: ${AFFIDAVIT_DIR} (${available.size} files)`);
  console.log(`👥 Candidates: ${candidates.length}`);

  const schema = discoverSchema([...available]);
  console.log(
    `🧾 Schema — movable ${schema.movable_assets.length}, immovable ${schema.immovable_assets.length}, ` +
    `liabilities ${schema.liabilities.length}, contracts ${schema.contracts.length}`
  );

  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const f of fs.readdirSync(OUT_DIR)) {
    if (f.startsWith('affidavit_chunk_') || f === 'affidavit_manifest.json') {
      fs.unlinkSync(path.join(OUT_DIR, f));
    }
  }

  const records = new Map();
  let missing = 0;

  for (const candidate of candidates) {
    const file = String(candidate.jsonFile || '').replace(/^json\//, '');
    if (!file || !available.has(file)) {
      missing++;
      continue;
    }

    let data;
    try {
      data = JSON.parse(fs.readFileSync(path.join(AFFIDAVIT_DIR, file), 'utf8'));
    } catch {
      missing++;
      continue;
    }

    const cases = data.criminal_cases || {};
    const pending = (cases.pending_cases || []).map(compactCase).filter(Boolean);
    const convicted = (cases.convicted_cases || []).map(compactCase).filter(Boolean);

    const tax = (data.income_tax_details || [])
      .map(entry => {
        const years = parseIncomeSeries(entry.income);
        const panGiven = isNil(entry.pan_given) ? null : String(entry.pan_given).trim().toUpperCase();
        if (!years.length && !panGiven) return null;
        return {
          relation: entry.relation,
          pan: panGiven,
          latestYear: isNil(entry.year) ? null : String(entry.year).trim(),
          years,
        };
      })
      .filter(Boolean);

    const record = {
      relative: isNil(data.relative) ? null : String(data.relative).trim(),
      voterInfo: isNil(data.voter_info) ? null : String(data.voter_info).trim(),
      professions: compactPlainMap(data.detailed_profession),
      incomeSources: compactPlainMap(data.income_sources),
      contracts: compactSection(data.contracts, schema.contracts),
      movable: compactSection(data.movable_assets, schema.movable_assets),
      immovable: compactSection(data.immovable_assets, schema.immovable_assets),
      liabilities: compactSection(data.liabilities, schema.liabilities),
      tax: tax.length ? tax : null,
      cases: {
        count: parseInt(cases.count, 10) || 0,
        summary: isNil(cases.summary) ? null : String(cases.summary).trim(),
        ipcCharges: Array.isArray(cases.ipc_charges) && cases.ipc_charges.length ? cases.ipc_charges : null,
        pending: pending.length ? pending : null,
        convicted: convicted.length ? convicted : null,
      },
      summary: compactPlainMap(data.asset_liability_summary),
    };

    // Drop null keys to keep the payload small.
    for (const key of Object.keys(record)) {
      if (record[key] === null) delete record[key];
    }
    if (!record.cases.count && !record.cases.pending && !record.cases.convicted) delete record.cases;

    records.set(candidate.id, record);
  }

  // ---- Write chunks ----
  const ids = candidates.map(c => c.id);
  const chunks = [];
  const idMap = {};
  let totalBytes = 0;

  for (let i = 0; i * CHUNK_SIZE < ids.length; i++) {
    const slice = ids.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
    const payload = {};
    for (const id of slice) {
      if (records.has(id)) payload[id] = records.get(id);
      idMap[id] = i;
    }
    const name = `affidavit_chunk_${i}.json`;
    const json = JSON.stringify(payload);
    fs.writeFileSync(path.join(OUT_DIR, name), json);
    totalBytes += Buffer.byteLength(json);
    chunks.push(name);
  }

  const manifest = {
    version: 1,
    generatedAt: new Date().toISOString(),
    totalCandidates: ids.length,
    withAffidavit: records.size,
    chunkSize: CHUNK_SIZE,
    chunks,
    schema: {
      movable: schema.movable_assets,
      immovable: schema.immovable_assets,
      liabilities: schema.liabilities,
      contracts: schema.contracts,
    },
    idMap,
  };
  fs.writeFileSync(path.join(OUT_DIR, 'affidavit_manifest.json'), JSON.stringify(manifest));

  console.log(`✅ ${records.size} full affidavits across ${chunks.length} chunks`);
  console.log(`   ${(totalBytes / 1024 / 1024).toFixed(2)} MB total, ~${(totalBytes / chunks.length / 1024).toFixed(0)} KB per chunk`);
  if (missing) console.warn(`⚠  ${missing} candidates had no matching affidavit file`);
}

main();
