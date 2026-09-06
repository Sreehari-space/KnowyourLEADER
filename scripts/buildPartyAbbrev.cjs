/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * buildPartyAbbrev.cjs
 *
 * Gives every party on the site a short badge code.
 *
 * 24 parties are in the registry with a verified abbreviation — TVK, DMK,
 * AIADMK and the rest. The other 87 fell through partyShort's last line, which
 * cuts the name mid-word: "Tamizhaga…", "Aanaithin…", "Thakkam K…". This
 * generates a real abbreviation for those instead.
 *
 * Why this is generated rather than derived in the component
 * ----------------------------------------------------------
 * Initials collide. Measured across the 105 party strings in the data, naive
 * initials produce 9 collisions covering 20 parties — and the worst is
 * "Tamizhaga Vaazhvurimai Katchi" (162 candidates) landing on TVK, which
 * already belongs to Tamilaga Vettri Kazhagam (230 candidates). Two parties
 * under one badge is a factual error on a disclosure site: it is the same class
 * of bug as the substring matching that once put 128 candidates on the wrong
 * party page.
 *
 * Uniqueness cannot be decided from one name in isolation, so it is decided
 * here, over the whole set, once, and committed.
 *
 * These are abbreviations of a name the site already displays — not claims
 * about a party's official acronym. A registered party always keeps its
 * verified code, and every badge carries the full name on its title.
 *
 * Input : src/data/all_candidates.json, public/merged_candidates.json
 *         src/data/parties.ts        (the registry)
 * Output: src/data/partyAbbrev.ts
 *
 * Usage: node scripts/buildPartyAbbrev.cjs
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PARTIES_TS = path.join(ROOT, 'src', 'data', 'parties.ts');
const OUT = path.join(ROOT, 'src', 'data', 'partyAbbrev.ts');
/**
 * Every dataset a party name can reach the UI from.
 *
 * The 2021 index was missed on the first pass, and "My India Party" — which
 * appears only there — went on rendering as "My India …" while every other
 * badge was fixed. A generator that reads a subset of the data silently does a
 * subset of the job, so this globs rather than lists.
 */
const SOURCES = [
  path.join(ROOT, 'src', 'data', 'all_candidates.json'),
  path.join(ROOT, 'public', 'merged_candidates.json'),
  ...fs.readdirSync(path.join(ROOT, 'public', 'data'))
    .filter((f) => /^candidates.*index\.json$/.test(f))
    .map((f) => path.join(ROOT, 'public', 'data', f)),
];

/** Must match normaliseParty in src/data/parties.ts. */
const normalise = (name) => String(name || '').toLowerCase().replace(/[^a-z0-9]/g, '');

/** Words that carry no identity and would only pad an abbreviation. */
const NOISE = new Set(['OF', 'THE', 'FOR', 'AND', 'A', 'AN']);

/** Longest sensible badge. Past this it stops being an abbreviation. */
const MAX_LENGTH = 6;

// ─── The registry ───────────────────────────────────────────────────────

/**
 * Read the registry out of parties.ts rather than importing it.
 *
 * The table is TypeScript and this script runs on bare node. Parsing the
 * literal keeps the script dependency-free; the assertions at the end catch
 * any drift if the table's shape changes.
 */
function readRegistry() {
  const src = fs.readFileSync(PARTIES_TS, 'utf8');
  const entries = [...src.matchAll(/\{\s*code:\s*'([^']+)',\s*short:\s*'([^']+)',[\s\S]*?names:\s*\[([^\]]+)\]/g)];
  if (!entries.length) throw new Error('No registry entries parsed from parties.ts — has the table changed shape?');

  const shorts = new Set();
  const registered = new Set();
  for (const [, code, short, names] of entries) {
    shorts.add(short.toUpperCase());
    registered.add(normalise(code));
    for (const raw of names.split(',')) {
      const name = raw.trim().replace(/^['"]|['"]$/g, '');
      if (name) registered.add(normalise(name));
    }
  }
  return { shorts, registered, count: entries.length };
}

// ─── Deriving a code ────────────────────────────────────────────────────

const significantWords = (name) =>
  String(name).toUpperCase().replace(/[^A-Z0-9 ]+/g, ' ').split(/\s+/).filter((w) => w && !NOISE.has(w));

/**
 * Build a code at a given level of detail.
 *
 * Level 0 is plain initials. Each level after that lets one more word from the
 * front contribute two letters, so a collision is broken by saying more about
 * the part of the name that distinguishes it:
 *
 *   Tamizhaga Vaazhvurimai Katchi  ->  TVK (taken) -> TAVK -> TAVAK
 */
function codeAtLevel(words, level) {
  return words
    .map((word, i) => word.slice(0, i < level ? 2 : 1))
    .join('')
    .slice(0, MAX_LENGTH);
}

// ─── Build ──────────────────────────────────────────────────────────────

function main() {
  const { shorts, registered, count } = readRegistry();

  const counts = new Map();
  for (const file of SOURCES) {
    if (!fs.existsSync(file)) continue;
    for (const candidate of JSON.parse(fs.readFileSync(file, 'utf8'))) {
      const party = candidate && candidate.party;
      if (party) counts.set(party, (counts.get(party) || 0) + 1);
    }
  }

  const unregistered = [...counts.keys()].filter((name) => !registered.has(normalise(name)));

  /**
   * Biggest party first, then alphabetical.
   *
   * Order decides who keeps the cleanest code when two names want it, so the
   * party more readers will meet gets the plainer badge — and sorting makes
   * the output identical on every run.
   */
  unregistered.sort((a, b) => (counts.get(b) - counts.get(a)) || a.localeCompare(b));

  // Registered codes are reserved before anything is derived: a generated
  // badge must never impersonate a real party's abbreviation.
  const taken = new Set(shorts);
  const table = [];
  let lengthened = 0;
  const unresolved = [];

  for (const name of unregistered) {
    const words = significantWords(name);
    if (!words.length) { unresolved.push(name); continue; }

    /**
     * A name that is already short is already an abbreviation.
     *
     * "IND" — 2,191 independents — has one word, so initials reduced it to a
     * bare "I". It never hit the old ellipsis in the first place; it was
     * rendering correctly and only needed leaving alone.
     */
    const bare = name.trim();
    if (bare.length <= MAX_LENGTH && !/\s/.test(bare)) {
      const verbatim = bare.toUpperCase();
      if (!taken.has(verbatim)) {
        taken.add(verbatim);
        table.push({ key: normalise(name), code: verbatim, name, candidates: counts.get(name) });
        continue;
      }
    }

    let code = null;
    for (let level = 0; level <= Math.min(words.length, 4); level++) {
      const candidate = codeAtLevel(words, level);
      if (!candidate || taken.has(candidate)) continue;
      code = candidate;
      if (level > 0) lengthened++;
      break;
    }

    if (!code) { unresolved.push(name); continue; }
    taken.add(code);
    table.push({ key: normalise(name), code, name, candidates: counts.get(name) });
  }

  // ── Assertions. A duplicate or an impersonated code is the whole risk here.
  const seen = new Map();
  for (const row of table) {
    if (seen.has(row.code)) {
      throw new Error(`Duplicate badge code ${row.code}: "${row.name}" and "${seen.get(row.code)}"`);
    }
    seen.set(row.code, row.name);
    if (shorts.has(row.code)) {
      throw new Error(`Generated code ${row.code} for "${row.name}" collides with a registered party`);
    }
    if (!row.code.trim()) throw new Error(`Empty code for "${row.name}"`);
  }

  const rows = [...table].sort((a, b) => a.key.localeCompare(b.key));
  const body = rows.map((r) => `  '${r.key}': '${r.code}',   // ${r.name}`).join('\n');

  fs.writeFileSync(OUT, `/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GENERATED FILE — do not edit by hand.
 * Run \`npm run build:partyabbrev\` (scripts/buildPartyAbbrev.cjs).
 *
 * Badge abbreviations for parties that are not in the registry in parties.ts.
 * A registered party keeps its own verified short code and never appears here.
 *
 * These are abbreviations of the party name as the data states it, not claims
 * about an official acronym. Codes are unique across the whole set and none of
 * them can equal a registered party's code, so no two parties can ever share a
 * badge. Every badge shows the full name on its title.
 *
 * Keyed by normaliseParty(name) — lowercase, alphanumerics only.
 */

export const PARTY_ABBREV: Record<string, string> = {
${body}
};
`);

  console.log(`registry entries        ${count}`);
  console.log(`party strings in data   ${counts.size}`);
  console.log(`abbreviations generated ${table.length}  (${lengthened} lengthened to break a collision)`);
  console.log(`left on the fallback    ${unresolved.length}${unresolved.length ? ` — ${unresolved.join(', ')}` : ''}`);
  console.log(`\nwrote ${path.relative(ROOT, OUT)}`);
}

main();
