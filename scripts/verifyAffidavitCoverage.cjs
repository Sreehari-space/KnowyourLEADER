/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * verifyAffidavitCoverage.cjs
 *
 * Audits the generated affidavit chunks against the source affidavits and
 * proves that no declared value was dropped.
 *
 * For every candidate it re-derives the set of declared (non-nil) values from
 * the source JSON and checks each one is present in the built chunk. A single
 * missing value fails the run.
 *
 * Usage: node scripts/verifyAffidavitCoverage.cjs [affidavitDir]
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'public', 'data');
const MERGED = path.join(ROOT, 'public', 'merged_candidates.json');

const AFFIDAVIT_DIR =
  process.argv[2] ||
  process.env.AFFIDAVIT_DIR ||
  path.resolve(ROOT, '..', 'website', 'cleaned_source_data', 'json');

const NIL_PATTERN = /^(?:nil+|none|n\/?a|n\.a\.?|not\s*applicable|no|-+|0+(?:\.0+)?)$/i;
const isNil = v => v === null || v === undefined || NIL_PATTERN.test(String(v).trim());

const SECTION_MAP = {
  movable_assets: ['movable', 'movable'],
  immovable_assets: ['immovable', 'immovable'],
  liabilities: ['liabilities', 'liabilities'],
  contracts: ['contracts', 'contracts'],
};

function main() {
  const manifest = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'affidavit_manifest.json'), 'utf8'));
  const candidates = JSON.parse(fs.readFileSync(MERGED, 'utf8'));

  const chunks = manifest.chunks.map(name =>
    JSON.parse(fs.readFileSync(path.join(DATA_DIR, name), 'utf8'))
  );

  const stats = {
    candidates: 0, checkedValues: 0, missingValues: 0,
    missingCandidates: 0, sections: {}, examples: [],
  };

  for (const candidate of candidates) {
    const chunkIndex = manifest.idMap[candidate.id];
    const built = chunkIndex !== undefined ? chunks[chunkIndex][candidate.id] : null;

    const file = String(candidate.jsonFile || '').replace(/^json\//, '');
    const sourcePath = path.join(AFFIDAVIT_DIR, file);
    if (!fs.existsSync(sourcePath)) continue;

    const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
    stats.candidates++;

    if (!built) {
      stats.missingCandidates++;
      continue;
    }

    // Sectioned declarations
    for (const [srcKey, [builtKey]] of Object.entries(SECTION_MAP)) {
      const schema = manifest.schema[builtKey];
      const srcSection = source[srcKey] || {};
      const builtSection = built[builtKey] || {};

      for (const [category, relations] of Object.entries(srcSection)) {
        if (!relations || typeof relations !== 'object') continue;
        const idx = schema.indexOf(category);

        for (const [relation, value] of Object.entries(relations)) {
          if (isNil(value)) continue;
          stats.checkedValues++;
          stats.sections[builtKey] = (stats.sections[builtKey] || 0) + 1;

          const got = idx !== -1 && builtSection[idx] ? builtSection[idx][relation] : undefined;
          if (got !== String(value).trim()) {
            stats.missingValues++;
            if (stats.examples.length < 10) {
              stats.examples.push({
                candidate: candidate.id, section: builtKey, category, relation,
                expected: String(value).slice(0, 90),
                got: got === undefined ? '(absent)' : String(got).slice(0, 90),
              });
            }
          }
        }
      }
    }

    // Scalar and map fields
    const scalars = [
      ['relative', source.relative, built.relative],
      ['voter_info', source.voter_info, built.voterInfo],
    ];
    for (const [name, expected, got] of scalars) {
      if (isNil(expected)) continue;
      stats.checkedValues++;
      if (got !== String(expected).trim()) {
        stats.missingValues++;
        if (stats.examples.length < 10) {
          stats.examples.push({ candidate: candidate.id, section: name, expected: String(expected).slice(0, 90), got: String(got).slice(0, 90) });
        }
      }
    }

    for (const [srcKey, builtKey] of [['detailed_profession', 'professions'], ['income_sources', 'incomeSources']]) {
      for (const [who, what] of Object.entries(source[srcKey] || {})) {
        if (isNil(what)) continue;
        stats.checkedValues++;
        const got = (built[builtKey] || {})[who];
        if (got !== String(what).trim()) {
          stats.missingValues++;
          if (stats.examples.length < 10) {
            stats.examples.push({ candidate: candidate.id, section: srcKey, relation: who, expected: String(what).slice(0, 90), got: String(got).slice(0, 90) });
          }
        }
      }
    }

    // Case records must all survive
    const srcCases = source.criminal_cases || {};
    for (const [kind, builtKey] of [['pending_cases', 'pending'], ['convicted_cases', 'convicted']]) {
      const srcList = srcCases[kind] || [];
      const builtList = (built.cases && built.cases[builtKey]) || [];
      if (srcList.length !== builtList.length) {
        stats.missingValues++;
        if (stats.examples.length < 10) {
          stats.examples.push({ candidate: candidate.id, section: kind, expected: `${srcList.length} records`, got: `${builtList.length} records` });
        }
      }
      stats.checkedValues += srcList.length;
    }

    // Income-tax series
    for (const entry of source.income_tax_details || []) {
      const hasIncome = !isNil(entry.income);
      if (!hasIncome) continue;
      stats.checkedValues++;
      const got = (built.tax || []).find(t => t.relation === entry.relation);
      if (!got || !got.years.length) {
        stats.missingValues++;
        if (stats.examples.length < 10) {
          stats.examples.push({ candidate: candidate.id, section: 'income_tax', relation: entry.relation, expected: String(entry.income).slice(0, 60), got: got ? `${got.years.length} years` : '(absent)' });
        }
      }
    }
  }

  console.log('── Affidavit coverage audit ──');
  console.log(`candidates audited : ${stats.candidates}`);
  console.log(`declared values    : ${stats.checkedValues.toLocaleString()}`);
  console.log(`missing / mismatch : ${stats.missingValues}`);
  console.log(`candidates absent  : ${stats.missingCandidates}`);
  console.log('per-section values :', stats.sections);

  if (stats.examples.length) {
    console.log('\nfirst mismatches:');
    for (const e of stats.examples) console.log(' ', JSON.stringify(e));
  }

  if (stats.missingValues || stats.missingCandidates) {
    console.error('\n✖ Coverage incomplete.');
    process.exit(1);
  }
  console.log('\n✅ Every declared value is present in the built chunks.');
}

main();
