/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * The party registry — one source of truth for party identity.
 *
 * ─── Why this exists ────────────────────────────────────────────────────
 *
 * Party identity was expressed as substring rules, separately, in six files:
 * a matcher for /party/:id, colour lookups in the map, the dashboard and the
 * card, an abbreviation lookup in two of those, and a flag lookup in a third.
 * They disagreed with each other and, more seriously, with the data.
 *
 * Substring containment cannot express identity. "Anna Puratchi Thalaivar Amma
 * Dravida Munnetra Kazhagam" contains "Dravida Munnetra Kazhagam" and is not
 * the DMK. That single rule put 36 AMMK-splinter candidates and 2 Anna MGR DMK
 * candidates onto /party/DMK. Across the whole site, 6 of 108 reachable party
 * keys returned people from other parties — 128 misplacements in total:
 *
 *   /party/DMK   304 shown,  38 wrong      /party/CPI   43 shown, 36 wrong
 *   /party/MAKKAL SAKTHI KATCHI 28, 26     Republican Party of India 20, 19
 *   /party/Makkal Munnetra Katchi 9, 7     /party/IUML   5, 2 (same party, two spellings)
 *
 * The DMK rule is worth calling out: the data stores the party as "DMK", so
 * the exact-match branch was already returning all 266 of them. The full-name
 * branch never matched a single real DMK candidate — every candidate it ever
 * contributed came from a different party.
 *
 * ─── How identity works now ─────────────────────────────────────────────
 *
 * A party is identified by its exact name, normalised for case, punctuation
 * and spacing. Names that are genuinely the same party under different
 * spellings are listed together in one entry. A party with no entry here is
 * simply itself: it cannot absorb another party, and it cannot be absorbed.
 *
 * Adding an entry is a claim that two strings name the same organisation. Make
 * that claim only when it is true — the whole class of bug above came from
 * inferring it from shared words. Checked against the data: of 163 distinct
 * names across both elections, exactly one pair differs only by punctuation.
 */

export interface Party {
  /** Canonical key. Used in /party/:partyId URLs. */
  code: string;
  /** Badge abbreviation. Full names shout louder than the candidate's name. */
  short: string;
  /** Hex, for map fills and avatar grounds. */
  colour: string;
  /** Path under public/flags, where artwork exists. */
  flag?: string;
  /** Every exact spelling that appears in the data for this party. */
  names: string[];
}

/** Case, punctuation and spacing are not identity. Word order is. */
import { PARTY_ABBREV } from './partyAbbrev';

export const normaliseParty = (name: string): string =>
  (name || '').toLowerCase().replace(/[^a-z0-9]/g, '');

const NEUTRAL = '#94A3B8';

/**
 * Registered parties.
 *
 * Colours are carried over from the map implementation, which was the most
 * complete of the five. Everything not listed renders neutral — 145 of 163
 * names today, which is a real gap but an honest one: inventing a colour per
 * party would imply a distinction the site cannot support.
 */
export const PARTIES: Party[] = [
  { code: 'DMK', short: 'DMK', colour: '#DC2626', flag: '/flags/DMK_Flag.svg', names: ['DMK', 'Dravida Munnetra Kazhagam'] },
  { code: 'AIADMK', short: 'AIADMK', colour: '#059669', flag: '/flags/AIADMK_Flag.svg', names: ['AIADMK', 'All India Anna Dravida Munnetra Kazhagam'] },
  { code: 'TVK', short: 'TVK', colour: '#7C3AED', flag: '/flags/Tamilaga_Vettri_Kazhagam_(TVK)_Flag.png', names: ['TVK', 'Tamilaga Vettri Kazhagam'] },
  { code: 'BJP', short: 'BJP', colour: '#D97706', flag: '/flags/BJP_Flag.svg', names: ['BJP', 'Bharatiya Janata Party'] },
  { code: 'INC', short: 'INC', colour: '#2563EB', flag: '/flags/Indian_National_Congress_Flag.svg', names: ['INC', 'Indian National Congress'] },
  { code: 'NTK', short: 'NTK', colour: '#EAB308', names: ['NTK', 'Naam Tamilar Katchi'] },
  { code: 'VCK', short: 'VCK', colour: '#7E22CE', flag: '/flags/Viduthalai_Chiruthaigal_Katchi_banner.png', names: ['VCK', 'Viduthalai Chiruthaigal Katchi'] },
  { code: 'PMK', short: 'PMK', colour: '#CA8A04', flag: '/flags/PMK.svg', names: ['PMK', 'Pattali Makkal Katchi'] },
  { code: 'DMDK', short: 'DMDK', colour: '#0E7490', flag: '/flags/Flag_DMDK.png', names: ['DMDK', 'Desiya Murpokku Dravida Kazhagam'] },
  { code: 'MDMK', short: 'MDMK', colour: '#B91C1C', flag: '/flags/MDMK.svg', names: ['MDMK', 'Marumalarchi Dravida Munnetra Kazhagam'] },
  { code: 'AMMK', short: 'AMMK', colour: '#0D9488', names: ['AMMK', 'Amma Makkal Munnettra Kazagam'] },

  // The communist parties are four separate organisations whose names share a
  // prefix. The old `\bCPI\b` fallback matched all four from /party/CPI.
  { code: 'CPI', short: 'CPI', colour: '#991B1B', flag: '/flags/CPI-banner.svg', names: ['CPI', 'Communist Party of India'] },
  { code: 'CPI(M)', short: 'CPI(M)', colour: '#B91C1C', flag: '/flags/CPI-M-flag.svg', names: ['CPI(M)', 'CPIM', 'Communist Party of India (Marxist)'] },
  { code: 'CPI(ML)(L)', short: 'CPI(ML)', colour: '#7F1D1D', names: ['CPI(ML)(L)'] },
  { code: 'CPI(ML)-RS', short: 'CPI(ML)RS', colour: '#7F1D1D', names: ['CPI(ML) Red Star'] },

  { code: 'BSP', short: 'BSP', colour: '#1D4ED8', flag: '/flags/BSP_Flag.png', names: ['BSP', 'Bahujan Samaj Party'] },
  // Two spellings of one party, verified against the data: 3 as the
  // abbreviation, 2 written out.
  { code: 'IUML', short: 'IUML', colour: '#16A34A', flag: '/flags/Flag_of_the_Indian_Union_Muslim_League.svg', names: ['IUML', 'Indian Union Muslim League'] },
  { code: 'SDPI', short: 'SDPI', colour: '#166534', flag: '/flags/SDPI_Flag.jpg', names: ['SDPI', 'Social Democratic Party of India'] },
  { code: 'MNM', short: 'MNM', colour: '#0891B2', names: ['MNM', 'Makkal Needhi Maiam'] },
  { code: 'PT', short: 'PT', colour: '#0F766E', flag: '/flags/Puthiya_Tamilagam_Party_Flag.jpg', names: ['PT', 'Puthiya Tamilagam'] },

  // Athawale's faction appears under three spellings across the two elections.
  // The plain "Republican Party of India" and the Sivaraj faction are separate
  // organisations and are deliberately NOT folded in here.
  { code: 'RPI(A)', short: 'RPI(A)', colour: '#1E40AF', names: ['RPI(A)', 'Republican Party of India (Athawale)', 'Republican Party of India (A)'] },

  // Differs only by an apostrophe and case. The one true alias pair in 163 names.
  { code: 'ALL PENSIONERS PARTY', short: 'Pensioners', colour: NEUTRAL, names: ['ALL PENSIONERS PARTY', 'All Pensioner’s Party'] },

  // A candidate's name was concatenated onto the party in one 2026 record.
  { code: 'Anaithu Makkal Puratchi Katchi', short: 'AMPK', colour: NEUTRAL, names: ['Anaithu Makkal Puratchi Katchi', 'Anaithu Makkal Puratchi KatchiRAMESH.R'] },

  // Same party, one record missing the trailing word.
  { code: 'Veerath Thiyagi Viswanathadoss Thozhilalarkal Katchi', short: 'VTVTK', colour: NEUTRAL, names: ['Veerath Thiyagi Viswanathadoss Thozhilalarkal Katchi', 'Veerath Thiyagi Viswanathadoss Thozhilalarkal'] },
];

/** name → entry, and code → entry, both on the normalised form. */
const BY_KEY = new Map<string, Party>();
for (const party of PARTIES) {
  BY_KEY.set(normaliseParty(party.code), party);
  for (const name of party.names) BY_KEY.set(normaliseParty(name), party);
}

/** The registry entry for a party name or code, or null when unregistered. */
export const resolveParty = (nameOrCode: string): Party | null =>
  BY_KEY.get(normaliseParty(nameOrCode)) ?? null;

/**
 * The canonical identity of a party name.
 *
 * Unregistered parties are their own identity, normalised. That is the safe
 * default: an unknown party can neither absorb another nor be absorbed.
 */
export const partyCode = (name: string): string => {
  const entry = resolveParty(name);
  return entry ? normaliseParty(entry.code) : normaliseParty(name);
};

/**
 * Do a candidate's party and a URL key name the same organisation?
 *
 * Exact identity only. No containment, no word-boundary fallback — those are
 * what put 128 candidates on the wrong party page.
 */
export const isPartyMatch = (candidateParty: string, searchKey: string): boolean => {
  if (!candidateParty || !searchKey) return false;
  return partyCode(candidateParty) === partyCode(searchKey);
};

/** Map fill and avatar ground. Neutral for unregistered parties. */
export const partyColour = (name: string): string => resolveParty(name)?.colour ?? NEUTRAL;

/**
 * Badge abbreviation.
 *
 * A registered party's own code wins. Failing that, the generated table gives
 * the other 84 parties a real short form: this used to cut the name mid-word
 * at nine characters, so 676 candidates wore badges reading "Tamizhaga…",
 * "Aanaithin…", "Thakkam K…". Codes in the table are unique across the whole
 * set and none can equal a registered party's, so no two parties share a
 * badge — see scripts/buildPartyAbbrev.cjs.
 *
 * The elision stays as the last resort, for a party string that reaches the UI
 * without being in either (a new filing between data builds, say). Better a
 * clipped name than a blank badge.
 */
export const partyShort = (name: string): string => {
  const entry = resolveParty(name);
  if (entry) return entry.short;

  const generated = PARTY_ABBREV[normaliseParty(name)];
  if (generated) return generated;

  const raw = (name || '').trim();
  return raw.length > 10 ? `${raw.slice(0, 9)}…` : raw;
};

/** Flag artwork, where the project has it. */
export const partyFlag = (name: string): string | null => resolveParty(name)?.flag ?? null;
