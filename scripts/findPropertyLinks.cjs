/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Phase 2 — find candidates whose declared properties match each other's.
 *
 *   node scripts/findPropertyLinks.cjs [--out report.md] [--min 1]
 *
 * Two independent join keys, because neither alone covers the corpus:
 *
 *   A. purchaseDate + purchaseCost   exact, ~71% of properties.
 *      Two people declaring a property bought on the same day for the identical
 *      rupee cost is a strong signal and needs no normalisation.
 *
 *   B. surveyId + area               exact, ~42% of properties.
 *      Covers inherited property, where the date is 0000-00-00 and the cost is
 *      zero, so key A cannot see it — and inherited property is exactly where
 *      family links concentrate. A bare survey number is not enough on its own
 *      (numbers repeat in every village), so it is paired with the declared area.
 *
 * Location text is deliberately NOT a key. The same village appears as
 * "Sanapratty", "Sanapiratti" and "Sanarpratti" in three affidavits for what is
 * demonstrably one plot. It is recorded as corroboration and shown in the
 * report, but never used to establish a match.
 *
 * OUTPUT IS AN INVESTIGATIVE LEAD, NOT A FINDING. A match means two
 * declarations describe a property with identical attributes. Co-ownership,
 * inheritance, a shared family, a copied filing and a data-entry error all
 * produce the same signature. Every pair needs reading before it is repeated
 * anywhere.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { extractProperties } = require('./lib/propertyRecords.cjs');

const ROOT = path.resolve(__dirname, '..');
const DATA = path.join(ROOT, 'public', 'data');

const args = process.argv.slice(2);
const argOf = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const OUT = path.resolve(ROOT, argOf('--out', 'property_links_report.md'));
const MIN_MATCHES = parseInt(argOf('--min', '1'), 10);

// ─── Load ───────────────────────────────────────────────────────────────
function loadAffidavits() {
  const out = new Map();
  for (const f of fs.readdirSync(DATA).filter((f) => /^affidavit_chunk_\d+\.json$/.test(f))) {
    const chunk = JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8'));
    for (const [id, a] of Object.entries(chunk)) out.set(id, a);
  }
  return out;
}

function loadMeta() {
  const raw = JSON.parse(fs.readFileSync(path.join(DATA, 'candidates_index.json'), 'utf8'));
  const list = Array.isArray(raw) ? raw : Object.values(raw);
  return new Map(list.map((c) => [c.id, c]));
}

const affidavits = loadAffidavits();
const meta = loadMeta();

const seatOf = (id) => String(meta.get(id)?.constituency || '').split('(')[0].trim();
const label = (id) => {
  const m = meta.get(id);
  if (!m) return id;
  return `${m.name} — ${m.party}, ${seatOf(id)}`;
};

// ─── Extract (Phase 1) ──────────────────────────────────────────────────
const byCandidate = new Map();
let propertyCount = 0;
for (const [id, a] of affidavits) {
  const recs = extractProperties(a);
  if (recs.length) {
    byCandidate.set(id, recs);
    propertyCount += recs.length;
  }
}

// ─── Index on both keys ─────────────────────────────────────────────────
/** key -> Map(candidateId -> record[]) */
const indexA = new Map();
const indexB = new Map();

const push = (index, key, id, rec) => {
  if (!index.has(key)) index.set(key, new Map());
  const m = index.get(key);
  if (!m.has(id)) m.set(id, []);
  m.get(id).push(rec);
};

for (const [id, recs] of byCandidate) {
  for (const rec of recs) {
    if (rec.purchaseDate && rec.purchaseCost > 0) {
      push(indexA, `${rec.purchaseDate}|${rec.purchaseCost.toFixed(2)}`, id, rec);
    }
    if (rec.surveyIds.length && rec.areaSqft) {
      // Round the area to absorb unit-conversion drift between filings.
      const area = Math.round(rec.areaSqft);
      for (const sid of rec.surveyIds) push(indexB, `${sid}|${area}`, id, rec);
    }
  }
}

// ─── Pair up ────────────────────────────────────────────────────────────
/** pairKey -> { a, b, matches: [{key, kind, recA, recB}] } */
const pairs = new Map();

function harvest(index, kind) {
  for (const [key, holders] of index) {
    if (holders.size < 2) continue;
    const ids = [...holders.keys()];
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const [a, b] = [ids[i], ids[j]].sort();
        const pk = `${a}~${b}`;
        if (!pairs.has(pk)) pairs.set(pk, { a, b, matches: [] });
        pairs.get(pk).matches.push({
          key, kind,
          recA: holders.get(a)[0],
          recB: holders.get(b)[0],
        });
      }
    }
  }
}
harvest(indexA, 'date+cost');
harvest(indexB, 'survey+area');

/** Shared long words between the two location strings — corroboration only. */
function locationAgreement(matches) {
  let agree = 0;
  for (const m of matches) {
    for (const t of m.recA.locationTokens) {
      if (m.recB.locationTokens.has(t)) { agree++; break; }
    }
  }
  return matches.length ? agree / matches.length : 0;
}

const results = [...pairs.values()]
  .map((p) => {
    const sameSeat = seatOf(p.a) === seatOf(p.b);
    const kinds = new Set(p.matches.map((m) => m.kind));
    const agreement = locationAgreement(p.matches);
    const totalValue = p.matches.reduce((s, m) => s + (m.recA.declaredValue || 0), 0);
    // Rank by weight of evidence: how many properties, whether both independent
    // keys agree, whether the location text corroborates, and co-location.
    const score =
      p.matches.length * 10 +
      (kinds.size > 1 ? 25 : 0) +
      Math.round(agreement * 20) +
      (sameSeat ? 50 : 0);
    return { ...p, sameSeat, kinds: [...kinds], agreement, totalValue, score };
  })
  .filter((p) => p.matches.length >= MIN_MATCHES)
  .sort((x, y) => y.score - x.score);

// ─── Report ─────────────────────────────────────────────────────────────
const inr = (n) =>
  n >= 1e7 ? `Rs ${(n / 1e7).toFixed(2)} Cr` : n >= 1e5 ? `Rs ${(n / 1e5).toFixed(2)} L` : `Rs ${Math.round(n).toLocaleString('en-IN')}`;

const L = [];
L.push('# Declared-property links between candidates');
L.push('');
L.push(`Generated ${new Date().toISOString().slice(0, 10)} from ${affidavits.size} Form 26 affidavits.`);
L.push('');
L.push('**These are leads, not findings.** A match means two declarations describe a');
L.push('property with identical attributes. Co-ownership, inheritance, a shared family,');
L.push('a copied filing and a data-entry error all produce the same signature. Read each');
L.push('pair before repeating it anywhere.');
L.push('');
L.push('## Coverage');
L.push('');
L.push('| | |');
L.push('|---|---|');
L.push(`| Candidates declaring property | ${byCandidate.size} of ${affidavits.size} |`);
L.push(`| Properties extracted | ${propertyCount} |`);
L.push(`| Indexed on purchase date + cost | ${indexA.size} distinct keys |`);
L.push(`| Indexed on survey id + area | ${indexB.size} distinct keys |`);
L.push(`| **Candidate pairs linked** | **${results.length}** |`);
L.push(`| — in the same constituency | ${results.filter((r) => r.sameSeat).length} |`);
L.push(`| — corroborated by both keys | ${results.filter((r) => r.kinds.length > 1).length} |`);
L.push(`| — with 3+ shared properties | ${results.filter((r) => r.matches.length >= 3).length} |`);
L.push('');
L.push('## Pairs, strongest evidence first');
L.push('');

for (const r of results) {
  L.push(`### ${label(r.a)}`);
  L.push(`### ${label(r.b)}`);
  const flags = [];
  if (r.sameSeat) flags.push('**same constituency**');
  if (r.kinds.length > 1) flags.push('**matched on both keys independently**');
  L.push('');
  L.push(
    `${r.matches.length} shared propert${r.matches.length === 1 ? 'y' : 'ies'} · ` +
    `keys: ${r.kinds.join(', ')} · ` +
    `location text agrees on ${Math.round(r.agreement * 100)}% · ` +
    `combined declared value ${inr(r.totalValue)}` +
    (flags.length ? `\n\n> ${flags.join(' · ')}` : '')
  );
  L.push('');
  L.push('| Matched on | A: location as filed | B: location as filed | Area | Declared |');
  L.push('|---|---|---|---|---|');
  for (const m of r.matches.slice(0, 12)) {
    const on = m.kind === 'date+cost'
      ? `bought ${m.key.split('|')[0]} for ${inr(parseFloat(m.key.split('|')[1]))}`
      : `survey ${m.key.split('|')[0]}, ${m.key.split('|')[1]} sqft`;
    const cell = (s) => String(s || '—').replace(/\|/g, '/').slice(0, 46);
    L.push(`| ${on} | ${cell(m.recA.location)} | ${cell(m.recB.location)} | ${cell(m.recA.totalArea)} | ${m.recA.declaredValue ? inr(m.recA.declaredValue) : '—'} |`);
  }
  if (r.matches.length > 12) L.push(`| … ${r.matches.length - 12} more | | | | |`);
  L.push('');
}

fs.writeFileSync(OUT, L.join('\n'), 'utf8');

console.log(`properties extracted : ${propertyCount} from ${byCandidate.size} candidates`);
console.log(`pairs linked         : ${results.length}  (${results.filter((r) => r.sameSeat).length} same-seat, ${results.filter((r) => r.kinds.length > 1).length} on both keys)`);
console.log(`report               : ${OUT}`);
