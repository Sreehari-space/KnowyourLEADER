/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Flag internal problems in Form 26 declarations.
 *
 *   node scripts/findDeclarationFlags.cjs [--out report.md]
 *
 * Companion to findPropertyLinks.cjs. That script looks for links *between*
 * candidates; this one looks for a declaration that is at odds with itself.
 *
 * Three checks, in descending order of how defensible they are:
 *
 *   A. Gold valued inconsistently WITHIN one affidavit.
 *      The candidate values gold at two wildly different rates per gram in the
 *      same filing. Needs no outside knowledge — it is the document against
 *      itself — which makes it the only gold check that is safe to publish
 *      without stating a market assumption.
 *
 *   B. Gold valued below an absolute floor.
 *      Requires an assumption, so the floor is deliberately far below any real
 *      historical price and is printed in the report. Only applied where check A
 *      cannot run (a single gold line).
 *
 *   C. Assets without an income-tax filing, and property bought for a token sum.
 *      Straight readings of declared fields.
 *
 * Materials matter. The jewellery head mixes gold, silver, platinum and
 * diamonds, and silver legitimately costs a fraction of gold. Only lines that
 * name gold explicitly are considered; unlabelled weights are skipped, because
 * "220 Grams 6,600" may well be silver and calling it gold would be wrong.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { extractProperties, splitItems } = require('./lib/propertyRecords.cjs');

const ROOT = path.resolve(__dirname, '..');
const DATA = path.join(ROOT, 'public', 'data');

const args = process.argv.slice(2);
const argOf = (f, d) => { const i = args.indexOf(f); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const OUT = path.resolve(ROOT, argOf('--out', 'declaration_flags_report.md'));

/** Assumptions, stated here and reprinted in the report. */
const GOLD_FLOOR_PER_GRAM = 1000;   // far below any Indian gold price in living memory
const GOLD_RATIO = 5;               // within one affidavit, an unexplained 5x spread
const TOKEN_COST_MAX = 100;         // "sold" for a nominal sum
const TOKEN_VALUE_MIN = 1e6;        // but declared worth at least Rs 10 lakh
const NO_TAX_NETWORTH_MIN = 5e7;    // Rs 5 crore

// ─── Load ───────────────────────────────────────────────────────────────
const affidavits = new Map();
for (const f of fs.readdirSync(DATA).filter((f) => /^affidavit_chunk_\d+\.json$/.test(f)))
  for (const [id, a] of Object.entries(JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8'))))
    affidavits.set(id, a);

const rawIdx = JSON.parse(fs.readFileSync(path.join(DATA, 'candidates_index.json'), 'utf8'));
const meta = new Map((Array.isArray(rawIdx) ? rawIdx : Object.values(rawIdx)).map((c) => [c.id, c]));
const label = (id) => {
  const m = meta.get(id);
  return m ? `${m.name} — ${m.party}, ${String(m.constituency).split('(')[0].trim()}` : id;
};

const inr = (n) =>
  n >= 1e7 ? `Rs ${(n / 1e7).toFixed(2)} Cr`
  : n >= 1e5 ? `Rs ${(n / 1e5).toFixed(2)} L`
  : `Rs ${Math.round(n).toLocaleString('en-IN')}`;

/**
 * Gold lines only: the text must name gold, must not name another material
 * (a "Gold and Silver" line cannot be attributed), and must be weighed in
 * grams rather than carats.
 */
function goldLines(affidavit) {
  const out = [];
  for (const [relation, raw] of Object.entries((affidavit.movable || {})['7'] || {})) {
    if (!raw || raw === 'Nil') continue;
    for (const { text, declaredValue } of splitItems(raw)) {
      const t = text.toUpperCase();
      if (!/\bGOLD\b/.test(t)) continue;
      if (/\bSILVER\b|\bPLATINUM\b|\bDIAMOND\b/.test(t)) continue;
      if (/\bCT\b|CARAT/.test(t)) continue;
      const g = t.match(/([\d][\d,.]*)\s*(?:GRAMS?|GRMS?|GMS?|G\b)/);
      if (!g || !declaredValue) continue;
      const grams = parseFloat(g[1].replace(/,/g, ''));
      if (!(grams > 0) || !(declaredValue > 0)) continue;
      out.push({ relation, text: text.replace(/\s+/g, ' ').trim(), grams, value: declaredValue, perGram: declaredValue / grams });
    }
  }
  return out;
}

const A = [], B = [], C = [], D = [];

for (const [id, a] of affidavits) {
  const m = meta.get(id);

  // A / B — gold
  const gold = goldLines(a);
  if (gold.length >= 2) {
    const lo = gold.reduce((x, y) => (x.perGram < y.perGram ? x : y));
    const hi = gold.reduce((x, y) => (x.perGram > y.perGram ? x : y));
    if (hi.perGram / lo.perGram >= GOLD_RATIO) A.push({ id, lo, hi, ratio: hi.perGram / lo.perGram });
  } else if (gold.length === 1 && gold[0].perGram < GOLD_FLOOR_PER_GRAM) {
    B.push({ id, line: gold[0] });
  }

  // C — assets but no income-tax filing declared
  const tax = a.tax || [];
  const years = tax.reduce((n, t) => n + (t.years || []).length, 0);
  if (m && m.netWorth > NO_TAX_NETWORTH_MIN && years === 0) {
    const pans = tax.map((t) => `${t.relation}: ${t.pan === 'Y' ? 'PAN given' : 'no PAN'}`);
    C.push({ id, netWorth: m.netWorth, pans });
  }

  // D — property acquired for a token sum
  for (const p of extractProperties(a)) {
    if (p.purchaseCost > 0 && p.purchaseCost <= TOKEN_COST_MAX && (p.declaredValue || 0) >= TOKEN_VALUE_MIN)
      D.push({ id, p });
  }
}

// ─── Report ─────────────────────────────────────────────────────────────
const L = [];
L.push('# Declaration flags');
L.push('');
L.push(`Generated ${new Date().toISOString().slice(0, 10)} from ${affidavits.size} Form 26 affidavits.`);
L.push('');
L.push('**Leads, not findings.** Every flag below is a question to put to the');
L.push('candidate, not an allegation. Nominal-consideration deeds are lawful, gold can');
L.push('be valued at cost of acquisition decades ago, and a blank tax section may mean');
L.push('income below the filing threshold. Read the filing before repeating anything.');
L.push('');
L.push('## Assumptions used');
L.push('');
L.push('| Check | Assumption |');
L.push('|---|---|');
L.push(`| Gold, inconsistent | An unexplained ${GOLD_RATIO}x spread in rate per gram inside one affidavit |`);
L.push(`| Gold, absolute | Below Rs ${GOLD_FLOOR_PER_GRAM.toLocaleString('en-IN')}/gram — far under any real historical price |`);
L.push(`| Token consideration | Cost <= Rs ${TOKEN_COST_MAX} but declared worth >= ${inr(TOKEN_VALUE_MIN)} |`);
L.push(`| No tax filing | Net worth > ${inr(NO_TAX_NETWORTH_MIN)} with zero filing years declared |`);
L.push('');
L.push('Only lines naming gold explicitly are counted. Silver, platinum, diamond and');
L.push('unlabelled weights are skipped: silver is legitimately cheap, and "220 Grams');
L.push('6,600" names no metal at all.');
L.push('');

L.push(`## A. Gold valued inconsistently within one affidavit — ${A.length}`);
L.push('');
L.push('The strongest check here: the document contradicts itself, so no view on market');
L.push('prices is required.');
L.push('');
A.sort((x, y) => y.ratio - x.ratio);
for (const x of A) {
  L.push(`**${label(x.id)}** — ${Math.round(x.ratio)}x spread`);
  L.push('');
  L.push('| | Weight | Declared | Rate |');
  L.push('|---|---|---|---|');
  L.push(`| ${x.lo.relation} | ${x.lo.grams.toLocaleString('en-IN')} g | ${inr(x.lo.value)} | **Rs ${Math.round(x.lo.perGram).toLocaleString('en-IN')}/g** |`);
  L.push(`| ${x.hi.relation} | ${x.hi.grams.toLocaleString('en-IN')} g | ${inr(x.hi.value)} | Rs ${Math.round(x.hi.perGram).toLocaleString('en-IN')}/g |`);
  L.push('');
  L.push(`> as filed: \`${x.lo.text.slice(0, 90)}\``);
  L.push('');
}

L.push(`## B. Gold below Rs ${GOLD_FLOOR_PER_GRAM.toLocaleString('en-IN')}/gram (single line, no internal comparison possible) — ${B.length}`);
L.push('');
L.push('| Candidate | Weight | Declared | Rate | As filed |');
L.push('|---|---|---|---|---|');
B.sort((x, y) => x.line.perGram - y.line.perGram);
for (const x of B)
  L.push(`| ${label(x.id)} | ${x.line.grams.toLocaleString('en-IN')} g | ${inr(x.line.value)} | Rs ${Math.round(x.line.perGram).toLocaleString('en-IN')}/g | ${x.line.text.slice(0, 40).replace(/\|/g, '/')} |`);
L.push('');

L.push(`## C. Net worth over ${inr(NO_TAX_NETWORTH_MIN)}, no income-tax filing declared — ${C.length}`);
L.push('');
L.push('| Candidate | Declared net worth | PAN status as filed |');
L.push('|---|---|---|');
C.sort((x, y) => y.netWorth - x.netWorth);
for (const x of C) L.push(`| ${label(x.id)} | ${inr(x.netWorth)} | ${x.pans.length ? x.pans.join('; ') : 'no tax section filed'} |`);
L.push('');

L.push(`## D. Property acquired for a token sum — ${D.length}`);
L.push('');
L.push('Nominal consideration is normal in gift and family-settlement deeds. Shown so a');
L.push('reader can see it rather than have it averaged into a total.');
L.push('');
L.push('| Candidate | Cost | Declared value | Inherited? | Location as filed |');
L.push('|---|---|---|---|---|');
D.sort((x, y) => (y.p.declaredValue || 0) - (x.p.declaredValue || 0));
for (const x of D)
  L.push(`| ${label(x.id)} | Rs ${x.p.purchaseCost} | ${inr(x.p.declaredValue)} | ${x.p.inherited === null ? '—' : x.p.inherited ? 'yes' : 'no'} | ${String(x.p.location).slice(0, 46).replace(/\|/g, '/')} |`);
L.push('');

fs.writeFileSync(OUT, L.join('\n'), 'utf8');

console.log(`gold, self-contradictory : ${A.length}`);
console.log(`gold, below floor        : ${B.length}`);
console.log(`assets but no ITR        : ${C.length}`);
console.log(`token consideration      : ${D.length}`);
console.log(`report                   : ${OUT}`);
