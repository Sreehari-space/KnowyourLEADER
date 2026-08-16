/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Repair the contracts section of the 2021 affidavit chunks.
 *
 *   node scripts/repairAffidavit2021Contracts.cjs [--dry]
 *
 * ─── The bug ────────────────────────────────────────────────────────────
 *
 * Every section in an affidavit chunk is `headIndex -> { relation: value }`.
 * The 2021 build wrote the contracts section as `headIndex -> value`, and
 * because the value is a string, JSON serialisation spread it character by
 * character: "Nil" became {"0":"N","1":"i","2":"l"}.
 *
 * The renderer then did exactly what it was told and drew three relation rows
 * labelled 0, 1 and 2 holding N, i and l. Every one of the 1,858 candidates in
 * the 2021 dataset was affected — 11,148 head cards. The 2026 chunks are clean.
 *
 * ─── The repair ─────────────────────────────────────────────────────────
 *
 * Reassemble the characters, then:
 *
 *   - A nil-equivalent ("NIL", "NA", "Not Applicable", "Nothing", …) becomes
 *     an absent head. That is how the renderer already represents nothing
 *     declared: the head appears under "Declared Nil", which keeps the nil
 *     visible without pretending it is a contract. ~11,105 heads.
 *
 *   - Anything else is a real declaration and is kept, under the relation key
 *     `declared`. Not `self`: the contracts heads already name the party in
 *     the heading itself — "entered into by SPOUSE", "…by HUF or Trust" — so
 *     the relation dimension is redundant here, and asserting `self` would
 *     attribute a spouse's contract to the candidate. ~43 heads, including
 *     lease agreements with district collectors and government road contracts
 *     that were until now unreadable.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA = path.join(ROOT, 'public', 'data');
const DRY = process.argv.includes('--dry');

/** Values that mean "nothing declared here". */
const NIL = /^(nil+|n\/?a\.?|n\.a\.|no|none|nothing|null|ni|not\s*applicable)$/i;

/** True when a head's keys are 0,1,2… — a string that was spread. */
const isSpreadString = head => {
  const keys = Object.keys(head || {});
  return keys.length > 0 && keys.every(k => /^\d+$/.test(k));
};

const reassemble = head =>
  Object.keys(head)
    .sort((a, b) => Number(a) - Number(b))
    .map(k => head[k])
    .join('');

let files = 0, repaired = 0, nilled = 0, kept = 0;
const keptSamples = [];

for (const file of fs.readdirSync(DATA).filter(f => /^affidavit2021_chunk_\d+\.json$/.test(f))) {
  const full = path.join(DATA, file);
  const chunk = JSON.parse(fs.readFileSync(full, 'utf8'));
  let touched = false;

  for (const [id, affidavit] of Object.entries(chunk)) {
    const contracts = affidavit.contracts;
    if (!contracts) continue;

    for (const [headIndex, head] of Object.entries(contracts)) {
      if (!isSpreadString(head)) continue;

      const value = reassemble(head).trim();
      repaired++;
      touched = true;

      if (!value || NIL.test(value)) {
        delete contracts[headIndex];
        nilled++;
      } else {
        contracts[headIndex] = { declared: value };
        kept++;
        if (keptSamples.length < 5) {
          keptSamples.push(`${id.slice(0, 34)} [${headIndex}] ${value.slice(0, 72)}`);
        }
      }
    }

    // A section left with no heads at all is dropped, so the renderer treats
    // it the same as a candidate who declared no contracts in the first place.
    if (Object.keys(contracts).length === 0) delete affidavit.contracts;
  }

  if (touched && !DRY) fs.writeFileSync(full, JSON.stringify(chunk), 'utf8');
  if (touched) files++;
}

console.log(`${DRY ? '[dry run] ' : ''}chunk files touched : ${files}`);
console.log(`heads repaired               : ${repaired}`);
console.log(`  became "declared nil"      : ${nilled}`);
console.log(`  real declarations recovered: ${kept}`);
if (keptSamples.length) {
  console.log('\nrecovered declarations, sample:');
  for (const s of keptSamples) console.log(`  ${s}`);
}
