/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Phase 1 — turn Form 26 immovable-property declarations into structured records.
 *
 * The ECI export concatenates every property a candidate declared into one
 * string per head, each item ending with its value and a rounded magnitude hint:
 *
 *   "Chinnavedampatti Village, Coimbatore S.F No. 193 Total Area 1 Acres
 *    Whether Inherited N Purchase Date 2016-03-10 Purchase Cost 11763300.00
 *    Development Cost 1660717.00 4,74,80,400 4 Crore+  <next property…>"
 *
 * That trailing magnitude marker is the only reliable record separator, so it is
 * what the splitter keys on. Everything after that is labelled sub-fields, which
 * makes this head far more tractable than the free-text ones.
 *
 * Field coverage measured across all 11,107 declared properties:
 *   Total Area, Purchase Date, Purchase Cost   100%
 *   a real purchase date (not 0000-00-00)       71%
 *   a survey / plot identifier                  42%
 *
 * This module only reads and parses. It makes no claims about what a record
 * means; see findPropertyLinks.cjs for the matching layer.
 */

'use strict';

const ITEM_BOUNDARY = /(?:([\d][\d,.]*)\s+)?([\d][\d,.]*)\s*(Hund|Thou|Lacs?|Lakhs?|Crores?|Cr)\+/gi;

const MAGNITUDE = {
  hund: 100, thou: 1000, lac: 1e5, lacs: 1e5,
  lakh: 1e5, lakhs: 1e5, crore: 1e7, crores: 1e7, cr: 1e7,
};

const HEADS = {
  0: 'Agricultural land',
  1: 'Non-agricultural land',
  2: 'Commercial buildings',
  3: 'Residential buildings',
  4: 'Other property',
};

/**
 * Survey identifiers appear under at least a dozen spellings — SURVEYNO.,
 * SFNO., S.F.NO., T.S.NO., PLOTNO., "Old S.No", "New S.No" and so on. They are
 * all folded to a single prefix so that S.F No. 193 and "Survey No 193" compare
 * equal; the distinction between survey/town-survey/plot is not reliable enough
 * in this data to be worth preserving as separate namespaces.
 */
/*
 * The identifier itself is a comma/ampersand separated list of tokens, each
 * starting with a digit: "777, 778", "58/3A", "148/5,136/1B", "9 & 12". Tokens
 * may not contain spaces, which is what stops the capture running on into the
 * labelled fields that follow ("S.F No. 58/3A Total Area 0.7111 Acres…").
 */
const SURVEY_TOKEN = String.raw`\d[\dA-Za-z/\-]*`;
const SURVEY_RE = new RegExp(
  String.raw`\b(?:old|new)?\s*(?:s\.?\s*f|t\.?\s*s|r\.?\s*s|survey|patta|plot|door)\.?\s*(?:nos?\.?)?\s*` +
    String.raw`(${SURVEY_TOKEN}(?:\s*[,&]\s*${SURVEY_TOKEN})*)`,
  'gi'
);

/** Labelled numeric/enum sub-fields, in the order the ECI emits them. */
const FIELDS = [
  ['totalArea', /Total Area\s+([^]*?)(?=Built Up Area|Whether Inherited|Purchase Date|Purchase Cost|Development Cost|$)/i],
  ['builtUpArea', /Built Up Area\s+([^]*?)(?=Whether Inherited|Purchase Date|Purchase Cost|Development Cost|$)/i],
  ['inherited', /Whether Inherited\s+([YN])\b/i],
  ['purchaseDate', /Purchase Date\s+([\d]{4}-[\d]{2}-[\d]{2})/i],
  ['purchaseCost', /Purchase Cost\s+([\d.,]+)/i],
  ['developmentCost', /Development Cost\s+([\d.,]+)/i],
];

/** Split one declaration string into individual property items. */
function splitItems(raw) {
  const s = String(raw || '').replace(/\s+/g, ' ').trim();
  if (!s || /^nil$/i.test(s)) return [];
  const out = [];
  let cursor = 0;
  ITEM_BOUNDARY.lastIndex = 0;
  for (const m of s.matchAll(ITEM_BOUNDARY)) {
    const head = s.slice(cursor, m.index).trim();
    const value = parseAmount(m[1], m[2], m[3]);
    if (head) out.push({ text: head, declaredValue: value });
    cursor = (m.index ?? 0) + m[0].length;
  }
  const tail = s.slice(cursor).trim();
  if (tail) out.push({ text: tail, declaredValue: null });
  return out;
}

function parseAmount(exact, rounded, magnitude) {
  if (exact) {
    const n = parseFloat(String(exact).replace(/,/g, ''));
    if (Number.isFinite(n)) return n;
  }
  if (rounded && magnitude) {
    const n = parseFloat(String(rounded).replace(/,/g, ''));
    const mult = MAGNITUDE[String(magnitude).toLowerCase()];
    if (Number.isFinite(n) && mult) return n * mult;
  }
  return null;
}

const num = (v) => {
  if (v == null) return null;
  const n = parseFloat(String(v).replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
};

/**
 * Areas are declared in acres, cents, sq ft, sq m and hectares. Normalising to
 * square feet makes two declarations of the same plot comparable even when the
 * owners chose different units.
 */
function areaToSqft(raw) {
  if (!raw) return null;
  const s = String(raw).trim();
  const n = parseFloat(s.replace(/,/g, ''));
  if (!Number.isFinite(n) || n <= 0) return null;
  if (/hect/i.test(s)) return n * 107639.1;
  if (/\bacre/i.test(s)) return n * 43560;
  if (/\bcent/i.test(s)) return n * 435.6;
  if (/sq\.?\s*m|sqm|square\s*met/i.test(s)) return n * 10.7639;
  return n; // sq ft is the unmarked default in this dataset
}

/** Pull every survey/plot identifier out of an item, normalised for comparison. */
function surveyIds(text) {
  const ids = new Set();
  SURVEY_RE.lastIndex = 0;
  for (const m of String(text).matchAll(SURVEY_RE)) {
    // A capture may hold several numbers: "777, 778", "9 & 12", "148/5,136/1B".
    for (const part of m[1].split(/[,&]/)) {
      const id = part.replace(/\s+/g, '').replace(/\.$/, '').toUpperCase();
      if (/^\d/.test(id) && id.length >= 1 && id.length <= 20) ids.add(id);
    }
  }
  return [...ids];
}

/**
 * The descriptive text before the first labelled field — village, town, street.
 *
 * Survey numbers are deliberately left in. Many filings open with the
 * identifier ("Plot No.89, New No.1, Baskar Colony…"), so stripping it first
 * left the location empty for exactly the records where it was most useful.
 */
function locationOf(text) {
  return String(text)
    .split(/Total Area|Built Up Area|Whether Inherited|Purchase Date|Purchase Cost/i)[0]
    .replace(/\s+/g, ' ')
    .replace(/[,\s]+$/, '')
    .trim();
}

/** Comparison tokens for a location: long alphabetic words only. */
function locationTokens(location) {
  return new Set(
    String(location)
      .toUpperCase()
      .replace(/[^A-Z ]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 5 && !/^(VILLAGE|DISTRICT|TALUK|STREET|ROAD|NAGAR|COLONY|NORTH|SOUTH)$/.test(w))
  );
}

/**
 * Extract every property one candidate declared.
 * @returns {Array<object>} one record per declared property
 */
function extractProperties(affidavit) {
  const records = [];
  const immovable = affidavit && affidavit.immovable;
  if (!immovable) return records;

  for (const [headIdx, relations] of Object.entries(immovable)) {
    const head = HEADS[headIdx] || `Head ${headIdx}`;
    for (const [relation, raw] of Object.entries(relations || {})) {
      for (const { text, declaredValue } of splitItems(raw)) {
        const rec = { head, relation, raw: text, declaredValue };
        for (const [name, re] of FIELDS) {
          const m = text.match(re);
          rec[name] = m ? m[1].trim() : null;
        }
        rec.purchaseCost = num(rec.purchaseCost);
        rec.developmentCost = num(rec.developmentCost);
        rec.inherited = rec.inherited ? rec.inherited.toUpperCase() === 'Y' : null;
        if (rec.purchaseDate === '0000-00-00') rec.purchaseDate = null;
        rec.areaSqft = areaToSqft(rec.totalArea);
        rec.surveyIds = surveyIds(text);
        rec.location = locationOf(text);
        rec.locationTokens = locationTokens(rec.location);
        records.push(rec);
      }
    }
  }
  return records;
}

module.exports = { extractProperties, splitItems, areaToSqft, surveyIds, locationTokens, HEADS };
