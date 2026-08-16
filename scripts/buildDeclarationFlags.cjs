/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Build the declaration flags shown on each candidate's dossier.
 *
 *   node scripts/buildDeclarationFlags.cjs
 *
 * Writes public/data/declaration_flags.json, keyed by 2026 candidate id.
 *
 * ─── What replaced what, and why ────────────────────────────────────────
 *
 * The previous `discrepancies` field attached accusations to 1,019 of 1,799
 * candidates — 943 of them marked CRITICAL, with titles asserting "Tax/Duty
 * Evasion" and "Parking Illicit Funds". It was wrong, and wrong in ways that
 * were structural rather than incidental:
 *
 *   - Gold checks summed gold, silver, diamond and platinum weights together
 *     and divided by the gold-only value. Leemarose Martin declares gold at
 *     Rs 13,670/g — an ordinary rate — and was published as declaring it at
 *     Rs 1,143/g under the heading "Tax/Duty Evasion".
 *   - "Mathematical Mismatch" compared our own parse of the itemised heads
 *     against the total the candidate declared. The parser recovers ~98% of
 *     values on a good record and far less on a long one, so the check mostly
 *     measured our own failure rate and billed the candidate for it. It was
 *     the single most common accusation on the site (708 people).
 *   - Property "overvaluation" flagged candidates for declaring land above its
 *     inflation-indexed 2008 purchase price. That is what appreciation is; the
 *     check penalised honest valuation.
 *   - "Net worth vs 5-year income" compared a career's accumulated assets,
 *     inheritance included, against five years of declared income.
 *   - Owning unlisted shares, and declaring negative net worth, were both
 *     flagged. Both are lawful and ordinary.
 *
 * Records were also attached to candidates by fuzzy substring name match, so a
 * flag could land on the wrong person entirely.
 *
 * ─── Rules this generator follows ───────────────────────────────────────
 *
 *   1. No check asserts a crime, or names one. These are questions to put to a
 *      candidate, not findings against them. The UI says so too.
 *   2. No check may fail because of our parsing. Where a value cannot be read
 *      with confidence, the candidate is skipped rather than flagged.
 *   3. Prefer the document against itself. A check needing an outside
 *      assumption must state that assumption in the published output.
 *   4. Every flag carries the declared figures it was derived from, so a
 *      reader can check our arithmetic against the affidavit.
 *   5. Flags attach by candidate id, never by name.
 *   6. Every flag carries the ordinary innocent explanation, in the same
 *      breath as the flag itself.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { extractProperties, splitItems } = require('./lib/propertyRecords.cjs');

const ROOT = path.resolve(__dirname, '..');
const DATA = path.join(ROOT, 'public', 'data');
const OUT = path.join(DATA, 'declaration_flags.json');

/** Assumptions. Every one of these is published alongside the flags. */
const GOLD_RATIO = 5;          // unexplained spread in rate/gram inside one filing
const GOLD_FLOOR_PER_GRAM = 1000;
const TOKEN_COST_MAX = 100;
const TOKEN_VALUE_MIN = 1e6;
const NO_TAX_NETWORTH_MIN = 5e7;

/**
 * Rs 1 crore of dependant-held assets.
 *
 * Chosen from the distribution, not picked round. Across the 471 candidates
 * who declare any dependant assets with no dependant filing, the median is
 * Rs 6.19 lakh and the 90th percentile Rs 79.69 lakh — a child or elderly
 * parent holding a small piece of family property is the ordinary case, and a
 * threshold in lakhs flags the median family for nothing. Rs 1 crore sits
 * above the 90th percentile and leaves 38 candidates.
 */
const DEPENDENT_ASSET_MIN = 1e7;

// ─── Load ───────────────────────────────────────────────────────────────

const affidavits = new Map();
for (const f of fs.readdirSync(DATA).filter(f => /^affidavit_chunk_\d+\.json$/.test(f)))
  for (const [id, a] of Object.entries(JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8'))))
    affidavits.set(id, a);

const rawIdx = JSON.parse(fs.readFileSync(path.join(DATA, 'candidates_index.json'), 'utf8'));
const meta = new Map((Array.isArray(rawIdx) ? rawIdx : Object.values(rawIdx)).map(c => [c.id, c]));

const inr = n =>
  n >= 1e7 ? `₹${(n / 1e7).toFixed(2)} Cr`
  : n >= 1e5 ? `₹${(n / 1e5).toFixed(2)} L`
  : `₹${Math.round(n).toLocaleString('en-IN')}`;

/**
 * Gold lines only.
 *
 * The jewellery head mixes metals and stones in one string. A line counts only
 * if it names gold, names nothing else, and is weighed in grams. "220 Grams
 * 6,600" names no metal and is skipped — treating it as gold is exactly the
 * error that produced the old tax-evasion accusations.
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
      out.push({
        relation,
        text: text.replace(/\s+/g, ' ').trim().slice(0, 120),
        grams,
        value: declaredValue,
        perGram: declaredValue / grams,
      });
    }
  }
  return out;
}

/** Sum a whole head across relations, or null when nothing parses cleanly. */
function headTotal(affidavit, group, index) {
  const head = (affidavit[group] || {})[String(index)];
  if (!head) return null;
  let total = 0;
  let parsed = false;
  for (const raw of Object.values(head)) {
    if (!raw || raw === 'Nil') continue;
    for (const { declaredValue } of splitItems(raw)) {
      if (declaredValue > 0) { total += declaredValue; parsed = true; }
    }
  }
  return parsed ? total : null;
}

const flags = {};
const add = (id, flag) => { (flags[id] ||= []).push(flag); };

const counts = {};
const tally = code => { counts[code] = (counts[code] || 0) + 1; };

for (const [id, a] of affidavits) {
  const m = meta.get(id);
  if (!m) continue;

  // ── 1. Gold valued inconsistently within the same affidavit ──────────
  // The strongest check available: the document contradicts itself, so no
  // view on market prices is needed and no outside data is used.
  const gold = goldLines(a);
  if (gold.length >= 2) {
    const lo = gold.reduce((x, y) => (x.perGram < y.perGram ? x : y));
    const hi = gold.reduce((x, y) => (x.perGram > y.perGram ? x : y));
    const ratio = hi.perGram / lo.perGram;
    if (ratio >= GOLD_RATIO) {
      add(id, {
        code: 'gold-inconsistent',
        title: 'Gold valued at two very different rates in the same affidavit',
        detail: `Two gold entries in this filing imply rates ${Math.round(ratio)}× apart.`,
        evidence: [
          { label: `${lo.relation} — ${lo.grams.toLocaleString('en-IN')} g`, value: `${inr(lo.value)} · ₹${Math.round(lo.perGram).toLocaleString('en-IN')}/g` },
          { label: `${hi.relation} — ${hi.grams.toLocaleString('en-IN')} g`, value: `${inr(hi.value)} · ₹${Math.round(hi.perGram).toLocaleString('en-IN')}/g` },
        ],
        asFiled: lo.text,
        assumption: `An unexplained ${GOLD_RATIO}× spread in rate per gram within one filing.`,
        alsoExplainedBy: 'Gold held for decades is often declared at its cost of acquisition rather than today’s price, which can differ by this much on its own.',
      });
      tally('gold-inconsistent');
    }
  } else if (gold.length === 1 && gold[0].perGram < GOLD_FLOOR_PER_GRAM) {
    const g = gold[0];
    add(id, {
      code: 'gold-below-floor',
      title: 'Gold valued below ₹1,000 a gram',
      detail: `A single gold entry implies ₹${Math.round(g.perGram).toLocaleString('en-IN')} per gram.`,
      evidence: [
        { label: `${g.relation} — ${g.grams.toLocaleString('en-IN')} g`, value: inr(g.value) },
      ],
      asFiled: g.text,
      assumption: `₹${GOLD_FLOOR_PER_GRAM.toLocaleString('en-IN')}/gram — set far below any Indian gold price in living memory, so the floor itself is not in dispute.`,
      alsoExplainedBy: 'A transcription slip in the affidavit, or a weight recorded in the wrong unit, produces the same figure.',
    });
    tally('gold-below-floor');
  }

  // ── 2. Substantial assets, no income-tax filing declared ─────────────
  const tax = a.tax || [];
  const filingYears = tax.reduce((n, t) => n + (t.years || []).length, 0);
  if (m.netWorth > NO_TAX_NETWORTH_MIN && filingYears === 0) {
    add(id, {
      code: 'no-tax-filing',
      title: 'No income-tax filing declared',
      detail: `Declared net worth is ${inr(m.netWorth)}, and the affidavit's income-tax section lists no filing for any year.`,
      evidence: [
        { label: 'Declared net worth', value: inr(m.netWorth) },
        { label: 'Filing years declared', value: 'None' },
        ...tax.map(t => ({ label: `PAN — ${t.relation}`, value: t.pan === 'Y' ? 'Given' : 'Not given' })),
      ],
      assumption: `Applied above a net worth of ${inr(NO_TAX_NETWORTH_MIN)}.`,
      alsoExplainedBy: 'Wealth held as land or inherited property can generate income below the filing threshold. A blank section may also mean the field was left unfilled.',
    });
    tally('no-tax-filing');
  }

  // ── 3. Property acquired for a token sum ─────────────────────────────
  for (const p of extractProperties(a)) {
    if (p.purchaseCost > 0 && p.purchaseCost <= TOKEN_COST_MAX && (p.declaredValue || 0) >= TOKEN_VALUE_MIN) {
      add(id, {
        code: 'token-consideration',
        title: 'Property recorded as acquired for a nominal sum',
        detail: `Declared worth ${inr(p.declaredValue)}, recorded as acquired for ₹${p.purchaseCost}.`,
        evidence: [
          { label: 'Purchase cost as filed', value: `₹${p.purchaseCost}` },
          { label: 'Declared present value', value: inr(p.declaredValue) },
          { label: 'Inherited', value: p.inherited === null ? 'Not stated' : p.inherited ? 'Yes' : 'No' },
        ],
        asFiled: String(p.location || '').slice(0, 120),
        assumption: `Cost ≤ ₹${TOKEN_COST_MAX} with a declared value ≥ ${inr(TOKEN_VALUE_MIN)}.`,
        alsoExplainedBy: 'Nominal consideration is normal and lawful in gift deeds and family settlements. Shown so it is visible rather than averaged into a total.',
      });
      tally('token-consideration');
    }
  }

  // A vehicle-loan-exceeds-vehicle-value check was written here and removed.
  // Across the 206 candidates declaring both, the median loan is already 1.91x
  // the declared vehicle value — being under water on a car loan is the normal
  // state, not a signal, because vehicles depreciate faster than a loan
  // amortises. Worse, an unparsed vehicle line inflates the ratio, so the check
  // could not clear rule 2 above: its failure mode was our own parsing.

  // ── 4. Dependants holding assets against nil declared income ─────────
  const dependentRelations = ['dependent1', 'dependent2', 'dependent3', 'dependent4', 'dependent5'];
  let dependentAssets = 0;
  for (const group of ['movable', 'immovable']) {
    for (const head of Object.values(a[group] || {})) {
      for (const [rel, raw] of Object.entries(head || {})) {
        if (!dependentRelations.includes(rel.toLowerCase())) continue;
        if (!raw || raw === 'Nil') continue;
        for (const { declaredValue } of splitItems(raw)) {
          if (declaredValue > 0) dependentAssets += declaredValue;
        }
      }
    }
  }
  const dependentTaxYears = tax
    .filter(t => dependentRelations.includes(String(t.relation).toLowerCase()))
    .reduce((n, t) => n + (t.years || []).length, 0);

  if (dependentAssets >= DEPENDENT_ASSET_MIN && dependentTaxYears === 0) {
    add(id, {
      code: 'dependent-assets-no-income',
      title: 'Dependants hold assets with no income declared for them',
      detail: `Assets of ${inr(dependentAssets)} are declared in dependants' names, with no income-tax filing declared for any dependant.`,
      evidence: [
        { label: 'Assets held by dependants', value: inr(dependentAssets) },
        { label: 'Dependant filing years declared', value: 'None' },
      ],
      assumption: `Applied above ${inr(DEPENDENT_ASSET_MIN)} in dependant-held assets.`,
      alsoExplainedBy: 'Dependants are frequently children or elderly parents holding gifted or inherited property, with no income of their own to file against. This is ordinary.',
    });
    tally('dependent-assets-no-income');
  }
}

// ─── Write ──────────────────────────────────────────────────────────────

const payload = {
  generatedAt: new Date().toISOString().slice(0, 10),
  source: 'ECI Form 26 affidavits as published, parsed from public/data/affidavit_chunk_*.json',
  candidatesExamined: affidavits.size,
  candidatesFlagged: Object.keys(flags).length,
  assumptions: {
    goldRatio: GOLD_RATIO,
    goldFloorPerGram: GOLD_FLOOR_PER_GRAM,
    tokenCostMax: TOKEN_COST_MAX,
    tokenValueMin: TOKEN_VALUE_MIN,
    noTaxNetWorthMin: NO_TAX_NETWORTH_MIN,
    dependentAssetMin: DEPENDENT_ASSET_MIN,
  },
  flags,
};

fs.writeFileSync(OUT, JSON.stringify(payload), 'utf8');

const total = Object.values(flags).reduce((n, l) => n + l.length, 0);
console.log(`examined  : ${affidavits.size} affidavits`);
console.log(`flagged   : ${Object.keys(flags).length} candidates, ${total} flags`);
for (const [code, n] of Object.entries(counts).sort((a, b) => b[1] - a[1]))
  console.log(`  ${code.padEnd(28)} ${n}`);
console.log(`written   : ${path.relative(ROOT, OUT)}`);
