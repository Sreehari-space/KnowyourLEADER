/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Check that every affidavit chunk has the shape the renderer expects.
 *
 *   npm run verify:shape
 *
 * Exists because a whole dataset shipped in the wrong shape and nothing
 * noticed. The 2021 build wrote the contracts section as `headIndex -> value`
 * instead of `headIndex -> { relation: value }`, so a string spread into an
 * object and 1,858 candidates showed three rows labelled 0, 1, 2 spelling out
 * "Nil". Type-checking cannot catch it: the JSON is loaded as `any` at runtime,
 * and {"0":"N"} satisfies Record<string, string> perfectly well.
 *
 * The checks are about shape, not content:
 *
 *   1. section[headIndex] must be an object, never a string or array.
 *   2. Its keys must be relation names, never 0,1,2… — numeric keys mean a
 *      string was spread character by character.
 *   3. Its values must be strings.
 *   4. Head indices must be numeric strings within the schema's range, or the
 *      head has no heading to render under.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA = path.join(ROOT, 'public', 'data');

const GROUPS = ['movable', 'immovable', 'liabilities', 'contracts'];
const KNOWN_RELATIONS = /^(declared|self|spouse|huf|dependent[1-9])$/i;

const problems = [];
let affidavits = 0, heads = 0;

function checkSet(chunkPattern, manifestFile, label) {
  const manifest = JSON.parse(fs.readFileSync(path.join(DATA, manifestFile), 'utf8'));
  const schema = manifest.schema || {};

  for (const file of fs.readdirSync(DATA).filter(f => chunkPattern.test(f))) {
    const chunk = JSON.parse(fs.readFileSync(path.join(DATA, file), 'utf8'));

    for (const [id, affidavit] of Object.entries(chunk)) {
      affidavits++;

      for (const group of GROUPS) {
        const section = affidavit[group];
        if (section === undefined) continue;

        if (typeof section !== 'object' || Array.isArray(section)) {
          problems.push(`${label} ${id} ${group}: section is ${Array.isArray(section) ? 'an array' : typeof section}`);
          continue;
        }

        const headingCount = (schema[group] || []).length;

        for (const [headIndex, head] of Object.entries(section)) {
          heads++;

          if (!/^\d+$/.test(headIndex)) {
            problems.push(`${label} ${id} ${group}: head key "${headIndex}" is not an index`);
            continue;
          }
          if (headingCount && Number(headIndex) >= headingCount) {
            problems.push(`${label} ${id} ${group}[${headIndex}]: no heading at that index (schema has ${headingCount})`);
          }
          if (head === null || typeof head !== 'object' || Array.isArray(head)) {
            problems.push(`${label} ${id} ${group}[${headIndex}]: head is ${Array.isArray(head) ? 'an array' : typeof head}, expected { relation: value }`);
            continue;
          }

          const keys = Object.keys(head);
          if (keys.length && keys.every(k => /^\d+$/.test(k))) {
            const spelled = keys.sort((a, b) => Number(a) - Number(b)).map(k => head[k]).join('');
            problems.push(`${label} ${id} ${group}[${headIndex}]: numeric keys — a string was spread, spelling ${JSON.stringify(spelled.slice(0, 40))}`);
            continue;
          }
          for (const [relation, value] of Object.entries(head)) {
            if (!KNOWN_RELATIONS.test(relation)) {
              problems.push(`${label} ${id} ${group}[${headIndex}]: unknown relation "${relation}"`);
            }
            if (typeof value !== 'string') {
              problems.push(`${label} ${id} ${group}[${headIndex}].${relation}: value is ${typeof value}, expected string`);
            }
          }
        }
      }
    }
  }
}

checkSet(/^affidavit_chunk_\d+\.json$/, 'affidavit_manifest.json', '2026');
checkSet(/^affidavit2021_chunk_\d+\.json$/, 'affidavit2021_manifest.json', '2021');

console.log(`affidavits checked : ${affidavits}`);
console.log(`heads checked      : ${heads}`);

if (!problems.length) {
  console.log('PASS — every section is headIndex -> { relation: value }');
  process.exit(0);
}

// Group identical problems so one systemic fault does not print 11,000 lines.
const grouped = {};
for (const p of problems) {
  const key = p.replace(/^(\S+) \S+ /, '$1 … ').replace(/\[\d+\]/, '[n]');
  (grouped[key] ||= []).push(p);
}

console.log(`\nFAIL — ${problems.length} problem(s), ${Object.keys(grouped).length} distinct:\n`);
for (const [key, list] of Object.entries(grouped).sort((a, b) => b[1].length - a[1].length)) {
  console.log(`  ${String(list.length).padStart(6)} ×  ${key}`);
  console.log(`           e.g. ${list[0]}`);
}
process.exit(1);
