/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FullAffidavit — the complete Form 26 declaration for one candidate.
 *
 * The summary cards above this component show headline figures. This shows
 * everything else the candidate actually swore to: every movable and immovable
 * asset head, all sixteen liability heads, contracts held with government and
 * companies, declared income sources, income-tax filings for the whole family,
 * and the full case records.
 *
 * Two principles drive the layout:
 *   1. Nothing is dropped. A head the candidate declared "Nil" against is still
 *      reported as Nil rather than silently omitted — a nil declaration is
 *      itself information.
 *   2. Declared values are shown verbatim. These are sworn statements; the text
 *      is presented as filed, without paraphrase.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  Loader2, FileText, Users, Landmark, Home, Scale, Receipt, Briefcase,
  ChevronDown, AlertCircle, Gavel,
} from 'lucide-react';
import {
  loadFullAffidavit, FullAffidavit as FullAffidavitData, AffidavitSchema,
  AffidavitSection, AffidavitCase,
} from '../utils/affidavitLoader';
import { loadPastAffidavit, PastCandidate, ElectionLink } from '../utils/pastElection';

interface Props {
  candidateId: string;
  lang: 'en' | 'ta';
  /**
   * The same person's 2021 record, when one can be identified. Supplied by the
   * dossier, which resolves the link once and shares it with the totals panel.
   * Absent for the ~81% who did not stand in 2021, and the declaration then
   * renders exactly as it did before.
   */
  past?: { record: PastCandidate; basis: ElectionLink['basis'] } | null;
  /**
   * Which election this candidate's own declaration belongs to. A 2021-only
   * candidate's filing lives in the 2021 chunks, keyed by their 2021 id, so
   * the loader has to be told which set to look in.
   */
  election?: '2026' | '2021';
}

/** Which part of the declaration the reader has chosen to see. */
type Section = 'all' | 'identity' | 'movable' | 'immovable' | 'liabilities' | 'contracts' | 'tax' | 'cases';

const T = {
  en: {
    title: 'Complete Form 26 Declaration',
    subtitle: 'Every field the candidate declared on oath to the Election Commission. Values are shown exactly as filed.',
    loading: 'Loading the full declaration…',
    unavailable: 'The full declaration is not available for this candidate.',
    identity: 'Identity & Electoral Record',
    relative: "Father's / Husband's name",
    voterInfo: 'Registered as a voter',
    profession: 'Declared profession',
    incomeSource: 'Sources of income',
    movable: 'Movable Assets',
    immovable: 'Immovable Assets',
    liabilities: 'Liabilities & Dues',
    contracts: 'Contracts with Government & Companies',
    contractsNote: 'Contracts declared under Form 26 by the candidate, spouse, dependants, HUF, partnership firms and private companies.',
    tax: 'Income Tax Filings',
    taxNote: 'Declared income by financial year, for every family member named in the affidavit.',
    cases: 'Criminal Cases',
    pendingCases: 'Pending cases',
    convictedCases: 'Convicted cases',
    noCases: 'No criminal cases declared.',
    declaredNil: 'Declared Nil',
    nilNote: 'The candidate declared nothing under these heads.',
    pan: 'PAN',
    panYes: 'PAN given',
    panNo: 'No PAN given',
    latestFiling: 'Latest filing',
    noFilings: 'No income-tax filing declared.',
    showAll: 'Show all',
    hide: 'Hide',
    heads: 'heads',
    declared: 'declared',
    items: 'items',
    yearNotStated: 'Year not stated',
    filterLabel: 'Show section',
    filterAll: 'All sections',
    now: '2026',
    past: '2021',
    bothYears: 'This candidate also stood in 2021',
    bothYearsNote:
      'Both declarations are shown together below, head by head. Where a head appears for one year only, the candidate declared nothing against it in the other.',
    pastOnly: 'Declared in 2021 only',
    nowOnly: 'Declared in 2026 only',
    declaredBy: 'Declared by',
    nothingDeclared: 'Nothing declared',
    // Covers both cases: a dozen bank accounts to break down, and one property
    // whose description is the whole point of opening it.
    breakdown: 'Show details',
    hideBreakdown: 'Hide details',
    pastCases: 'Declared in the 2021 affidavit',
    pastNoCases: 'No criminal cases declared in 2021.',
    pastSource: 'View the 2021 affidavit on the ECI site',
    linkedOnSeat: 'Matched on name and constituency',
    linkedOnRelative: 'Matched on name and father’s / husband’s name',
    linkCaveat:
      'The two filings are matched, not officially linked. A match is our identification, and could be wrong.',
    pastOnlyTitle: 'This is a 2021 record',
    pastOnlyNote:
      'This candidate stood in the 2021 election and does not appear among the 2026 candidates. Everything below is what they declared on oath in 2021 — it is a historical record, not a current one.',
  },
  ta: {
    title: 'முழு படிவம் 26 அறிவிப்பு',
    subtitle: 'தேர்தல் ஆணையத்திடம் வேட்பாளர் சத்தியப்பிரமாணமாக அளித்த ஒவ்வொரு விவரமும். தாக்கல் செய்தபடியே காட்டப்படுகிறது.',
    loading: 'முழு அறிவிப்பு ஏற்றப்படுகிறது…',
    unavailable: 'இந்த வேட்பாளருக்கான முழு அறிவிப்பு கிடைக்கவில்லை.',
    identity: 'அடையாளம் மற்றும் வாக்காளர் பதிவு',
    relative: 'தந்தை / கணவர் பெயர்',
    voterInfo: 'வாக்காளர் பதிவு',
    profession: 'அறிவிக்கப்பட்ட தொழில்',
    incomeSource: 'வருமான ஆதாரங்கள்',
    movable: 'அசையும் சொத்துக்கள்',
    immovable: 'அசையா சொத்துக்கள்',
    liabilities: 'கடன்கள் மற்றும் நிலுவைகள்',
    contracts: 'அரசு மற்றும் நிறுவன ஒப்பந்தங்கள்',
    contractsNote: 'வேட்பாளர், மனைவி/கணவர், சார்ந்தோர், கூட்டுக் குடும்பம், கூட்டாண்மை நிறுவனங்கள் மற்றும் தனியார் நிறுவனங்கள் மூலம் அறிவிக்கப்பட்ட ஒப்பந்தங்கள்.',
    tax: 'வருமான வரி தாக்கல்',
    taxNote: 'பிரமாணப் பத்திரத்தில் குறிப்பிடப்பட்ட ஒவ்வொரு குடும்ப உறுப்பினருக்கும் நிதியாண்டு வாரியான வருமானம்.',
    cases: 'குற்ற வழக்குகள்',
    pendingCases: 'நிலுவையில் உள்ள வழக்குகள்',
    convictedCases: 'தண்டனை பெற்ற வழக்குகள்',
    noCases: 'குற்ற வழக்குகள் எதுவும் அறிவிக்கப்படவில்லை.',
    declaredNil: 'ஏதுமில்லை என அறிவிப்பு',
    nilNote: 'இந்தத் தலைப்புகளின் கீழ் வேட்பாளர் எதையும் அறிவிக்கவில்லை.',
    pan: 'நிரந்தர கணக்கு எண்',
    panYes: 'PAN வழங்கப்பட்டது',
    panNo: 'PAN வழங்கப்படவில்லை',
    latestFiling: 'சமீபத்திய தாக்கல்',
    noFilings: 'வருமான வரி தாக்கல் அறிவிக்கப்படவில்லை.',
    showAll: 'அனைத்தையும் காட்டு',
    hide: 'மறை',
    heads: 'தலைப்புகள்',
    declared: 'அறிவிக்கப்பட்டது',
    items: 'உருப்படிகள்',
    yearNotStated: 'ஆண்டு குறிப்பிடப்படவில்லை',
    filterLabel: 'பிரிவைத் தேர்வுசெய்க',
    filterAll: 'அனைத்துப் பிரிவுகளும்',
    now: '2026',
    past: '2021',
    bothYears: 'இந்த வேட்பாளர் 2021-லும் போட்டியிட்டார்',
    bothYearsNote:
      'இரண்டு அறிவிப்புகளும் ஒவ்வொரு தலைப்பாகக் கீழே ஒன்றாகக் காட்டப்படுகின்றன. ஒரு தலைப்பு ஒரு ஆண்டுக்கு மட்டும் இருந்தால், மற்றொரு ஆண்டில் அதற்கு எதுவும் அறிவிக்கப்படவில்லை.',
    pastOnly: '2021-ல் மட்டும் அறிவிப்பு',
    nowOnly: '2026-ல் மட்டும் அறிவிப்பு',
    declaredBy: 'அறிவித்தவர்',
    nothingDeclared: 'எதுவும் அறிவிக்கப்படவில்லை',
    breakdown: 'விவரங்களைக் காட்டு',
    hideBreakdown: 'விவரங்களை மறை',
    pastCases: '2021 பிரமாணப் பத்திரத்தில் அறிவிக்கப்பட்டது',
    pastNoCases: '2021-ல் குற்ற வழக்குகள் எதுவும் அறிவிக்கப்படவில்லை.',
    pastSource: '2021 பிரமாணப் பத்திரத்தை ECI தளத்தில் பார்க்க',
    linkedOnSeat: 'பெயர் மற்றும் தொகுதி மூலம் பொருத்தப்பட்டது',
    linkedOnRelative: 'பெயர் மற்றும் தந்தை / கணவர் பெயர் மூலம் பொருத்தப்பட்டது',
    linkCaveat:
      'இரு அறிவிப்புகளும் எங்களால் பொருத்தப்பட்டவை; அதிகாரப்பூர்வமாக இணைக்கப்பட்டவை அல்ல. இது தவறாகவும் இருக்கலாம்.',
    pastOnlyTitle: 'இது 2021 பதிவு',
    pastOnlyNote:
      'இந்த வேட்பாளர் 2021 தேர்தலில் போட்டியிட்டார்; 2026 வேட்பாளர் பட்டியலில் இல்லை. கீழே உள்ள அனைத்தும் 2021-ல் சத்தியப்பிரமாணமாக அளித்த விவரங்கள் — இது ஒரு வரலாற்றுப் பதிவு, தற்போதையது அல்ல.',
  },
};

const RELATION_LABELS: Record<string, { en: string; ta: string }> = {
  /**
   * Contracts carry no relation of their own — the head already names the
   * party ("entered into by SPOUSE", "…by HUF or Trust"), so attributing the
   * value to `self` would put a spouse's contract on the candidate.
   */
  declared: { en: 'As declared', ta: 'அறிவிக்கப்பட்டபடி' },
  self: { en: 'Self', ta: 'தான்' },
  spouse: { en: 'Spouse', ta: 'மனைவி / கணவர்' },
  huf: { en: 'Hindu Undivided Family', ta: 'கூட்டுக் குடும்பம்' },
  dependent1: { en: 'Dependant 1', ta: 'சார்ந்தவர் 1' },
  dependent2: { en: 'Dependant 2', ta: 'சார்ந்தவர் 2' },
  dependent3: { en: 'Dependant 3', ta: 'சார்ந்தவர் 3' },
  dependent4: { en: 'Dependant 4', ta: 'சார்ந்தவர் 4' },
  dependent5: { en: 'Dependant 5', ta: 'சார்ந்தவர் 5' },
};

const RELATION_ORDER = ['declared', 'self', 'spouse', 'huf', 'dependent1', 'dependent2', 'dependent3', 'dependent4', 'dependent5'];

/**
 * Guard against a head that is a string rather than a map of relations.
 *
 * The 2021 build wrote the contracts section as `headIndex -> value`, and a
 * string spread into an object becomes {"0":"N","1":"i","2":"l"}. Every one of
 * the 1,858 candidates in that dataset rendered three relation rows labelled
 * 0, 1 and 2 holding the letters of "Nil" — 11,148 head cards in total.
 *
 * The data is repaired (scripts/repairAffidavit2021Contracts.cjs) and a shape
 * check now guards the build, but this stays as the last line of defence: a
 * regenerated chunk must never be able to put character soup in front of a
 * reader again. Reassembling is strictly better than rendering the spread.
 */
function normaliseHead(head: Record<string, string> | undefined): Record<string, string> | undefined {
  if (!head) return head;
  const keys = Object.keys(head);
  if (!keys.length || !keys.every(k => /^\d+$/.test(k))) return head;
  const value = keys.sort((a, b) => Number(a) - Number(b)).map(k => head[k]).join('').trim();
  return value ? { declared: value } : undefined;
}

function relationLabel(key: string, lang: 'en' | 'ta') {
  const entry = RELATION_LABELS[key.toLowerCase()];
  if (entry) return entry[lang];
  return key.replace(/(\d)/, ' $1').replace(/^\w/, c => c.toUpperCase());
}

function orderRelations(relations: Record<string, string>) {
  return Object.keys(relations).sort((a, b) => {
    const ia = RELATION_ORDER.indexOf(a.toLowerCase());
    const ib = RELATION_ORDER.indexOf(b.toLowerCase());
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });
}

function tidy(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

/**
 * Sign is handled separately from magnitude: 173 candidates declare liabilities
 * greater than assets, and a raw negative fell through the Cr/L branches to an
 * unabbreviated "₹-16,54,70,630".
 */
const formatINR = (n: number) => {
  const sign = n < 0 ? '-' : '';
  const v = Math.abs(n);
  if (v >= 10000000) return `${sign}₹${(v / 10000000).toFixed(2)} Cr`;
  if (v >= 100000) return `${sign}₹${(v / 100000).toFixed(2)} L`;
  return `${sign}₹${v.toLocaleString('en-IN')}`;
};

/**
 * The ECI export concatenates every line item into one string, each ending with
 * its value and a rounded magnitude hint:
 *
 *   "Axis Bank Avinashi Branch 52,829 52 Thou+ BOB Nanjappa Road 24,93,713 24 Lacs+ …"
 *
 * That boundary is the only reliable separator, and it holds for ~98% of
 * declared values. Anything that does not match is left intact rather than
 * guessed at.
 */
const ITEM_BOUNDARY = /(?:([\d][\d,.]*)\s+)?([\d][\d,.]*)\s*(Hund|Thou|Lacs?|Lakhs?|Crores?|Cr)\+/gi;

const MAGNITUDE: Record<string, number> = {
  hund: 100, thou: 1000, lac: 100000, lacs: 100000,
  lakh: 100000, lakhs: 100000, crore: 10000000, crores: 10000000, cr: 10000000,
};

/** Labelled sub-fields the ECI embeds in property declarations. */
const PROPERTY_FIELDS: Array<[string, RegExp]> = [
  ['Total area', /Total Area\s+([^]*?)(?=Built Up Area|Whether Inherited|Purchase Date|Purchase Cost|Development Cost|$)/i],
  ['Built-up area', /Built Up Area\s+([^]*?)(?=Whether Inherited|Purchase Date|Purchase Cost|Development Cost|$)/i],
  ['Inherited', /Whether Inherited\s+([YN])\b/i],
  ['Purchase date', /Purchase Date\s+([\d-]+)/i],
  ['Purchase cost', /Purchase Cost\s+([\d.,]+)/i],
  ['Development cost', /Development Cost\s+([\d.,]+)/i],
];

export interface DeclaredItem {
  description: string;
  amount: number | null;
  amountText: string | null;
  attributes: Array<{ label: string; value: string }>;
}

function parseAmount(exact?: string, rounded?: string, magnitude?: string): number | null {
  if (exact) {
    const n = parseFloat(exact.replace(/,/g, ''));
    if (Number.isFinite(n)) return n;
  }
  if (rounded && magnitude) {
    const n = parseFloat(rounded.replace(/,/g, ''));
    const mult = MAGNITUDE[magnitude.toLowerCase()];
    if (Number.isFinite(n) && mult) return n * mult;
  }
  return null;
}

function extractAttributes(text: string): { description: string; attributes: DeclaredItem['attributes'] } {
  const attributes: DeclaredItem['attributes'] = [];
  let description = text;

  for (const [label, pattern] of PROPERTY_FIELDS) {
    const match = description.match(pattern);
    if (!match) continue;
    const value = (match[1] || '').trim();
    if (value && !/^0*(\.0+)?$/.test(value)) {
      let display = value;
      if (label === 'Inherited') {
        display = value.toUpperCase() === 'Y' ? 'Yes' : 'No';
      } else if (label.endsWith('cost')) {
        const n = parseFloat(value.replace(/,/g, ''));
        if (Number.isFinite(n)) display = formatINR(n);
      }
      attributes.push({ label, value: display });
    }
    description = description.replace(match[0], ' ');
  }

  return { description: tidy(description), attributes };
}

export function itemizeDeclaration(raw: string): DeclaredItem[] {
  const source = tidy(raw);
  if (!source) return [];

  const items: DeclaredItem[] = [];
  let cursor = 0;

  ITEM_BOUNDARY.lastIndex = 0;
  for (const match of source.matchAll(ITEM_BOUNDARY)) {
    const index = match.index ?? 0;
    const head = source.slice(cursor, index);
    const { description, attributes } = extractAttributes(head);
    items.push({
      description,
      amount: parseAmount(match[1], match[2], match[3]),
      amountText: match[0].trim(),
      attributes,
    });
    cursor = index + match[0].length;
  }

  const tail = source.slice(cursor).trim();
  if (tail) {
    const { description, attributes } = extractAttributes(tail);
    if (description || attributes.length) {
      items.push({ description, amount: null, amountText: null, attributes });
    }
  }

  // A single unsplittable blob is not worth dressing up as a list.
  if (items.length === 1 && items[0].amount === null && !items[0].attributes.length) return [];
  return items;
}

// ─── Building blocks ────────────────────────────────────────────────────

const SectionHeading: React.FC<{
  icon: React.ReactNode; title: string; count?: string; note?: string;
}> = ({ icon, title, count, note }) => (
  <div className="mb-4">
    <h4 className="text-base md:text-lg font-display font-black text-slate-900 tracking-tight flex items-center gap-2">
      <span className="text-indigo-600">{icon}</span>
      <span>{title}</span>
      {count && (
        <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
          {count}
        </span>
      )}
    </h4>
    {note && <p className="text-xs text-slate-500 mt-1 leading-relaxed">{note}</p>}
  </div>
);

/**
 * One year's declaration for one relation, split into line items where possible.
 *
 * `year` is set only when the same relation has something to show for both
 * elections; a lone year tag on a candidate who only ever filed once would be
 * noise. The 2021 body is muted so the current declaration stays the thing the
 * eye lands on — the older filing is context, not the headline.
 */
const DeclarationBody: React.FC<{
  raw: string; lang: 'en' | 'ta'; year?: string; past?: boolean;
}> = ({ raw, lang, year, past }) => {
  const t = T[lang];
  const items = useMemo(() => itemizeDeclaration(raw), [raw]);
  const total = items.reduce((sum, item) => sum + (item.amount || 0), 0);

  const bodyText = past ? 'text-slate-500' : 'text-slate-700';
  const amountText = past ? 'text-slate-500' : 'text-slate-900';

  return (
    <div className={past ? 'mt-2 pt-2 border-t border-dashed border-slate-200' : ''}>
      {(year || (items.length > 1 && total > 0)) && (
        <div className="flex items-baseline justify-between gap-3 mb-1.5">
          {year ? (
            <span
              className={`text-[9px] font-mono font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${
                past ? 'bg-slate-100 text-slate-500' : 'bg-indigo-50 text-indigo-700'
              }`}
            >
              {year}
            </span>
          ) : (
            <span />
          )}
          {items.length > 1 && total > 0 && (
            <span className={`text-[11px] font-mono font-bold shrink-0 ${amountText}`}>
              {items.length} {t.items} · {formatINR(total)}
            </span>
          )}
        </div>
      )}

      {items.length > 0 ? (
        <ol className="space-y-1">
          {items.map((item, i) => (
            <li key={i} className="flex items-start justify-between gap-3 py-1">
              <div className="min-w-0 flex-1">
                <span className={`text-[13px] leading-snug break-words ${bodyText}`}>
                  {items.length > 1 && (
                    <span className="text-[10px] font-mono text-slate-400 mr-1.5">{i + 1}.</span>
                  )}
                  {item.description || '—'}
                </span>
                {item.attributes.length > 0 && (
                  <span className="flex flex-wrap gap-1 mt-1">
                    {item.attributes.map(attr => (
                      <span
                        key={attr.label}
                        className="text-[10px] text-slate-600 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5"
                      >
                        <span className="text-slate-400">{attr.label}:</span> {attr.value}
                      </span>
                    ))}
                  </span>
                )}
              </div>
              {item.amount !== null && (
                <span className={`text-[13px] font-mono font-semibold shrink-0 tabular-nums ${amountText}`}>
                  {formatINR(item.amount)}
                </span>
              )}
            </li>
          ))}
        </ol>
      ) : (
        <p className={`text-[13px] leading-relaxed break-words whitespace-pre-wrap ${bodyText}`}>
          {tidy(raw)}
        </p>
      )}
    </div>
  );
};

/** One relation's declaration, with the 2021 filing beneath it where there is one. */
const RelationDeclaration: React.FC<{
  relation: string; raw?: string; pastRaw?: string; showYears?: boolean; lang: 'en' | 'ta';
}> = ({ relation, raw, pastRaw, showYears, lang }) => {
  const t = T[lang];

  // Tag the years only when this relation actually has both filings. A head
  // declared in one year alone gets an explicit "2026 only" / "2021 only" note
  // instead, so an absence never reads as an omission on our part.
  const both = raw !== undefined && pastRaw !== undefined;
  const soleYear = !both && showYears
    ? (raw !== undefined ? t.nowOnly : t.pastOnly)
    : null;

  return (
    <div className="border-t border-slate-100 first:border-t-0 pt-3 first:pt-0">
      <div className="flex items-baseline justify-between gap-3 mb-2">
        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest font-mono">
          {relationLabel(relation, lang)}
        </span>
        {soleYear && (
          <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-400 shrink-0">
            {soleYear}
          </span>
        )}
      </div>

      {raw !== undefined && (
        <DeclarationBody raw={raw} lang={lang} year={both ? t.now : undefined} />
      )}
      {pastRaw !== undefined && (
        <DeclarationBody raw={pastRaw} lang={lang} year={both ? t.past : undefined} past />
      )}
    </div>
  );
};

/** A declaration reduced to what a comparison row needs. */
interface DeclarationSummary {
  items: DeclaredItem[];
  total: number | null;
  text: string;
  /** True when there is something to read beyond the figure itself. */
  detailed: boolean;
}

function summarise(raw?: string): DeclarationSummary | null {
  if (raw === undefined) return null;
  const items = itemizeDeclaration(raw);
  const total = items.length ? items.reduce((sum, i) => sum + (i.amount || 0), 0) : null;

  /**
   * Whether this declaration has detail worth opening.
   *
   * Not simply "more than one item". A single declared property is one item,
   * and its description is the whole substance of it — the village, the survey
   * number, the area, whether it was inherited, what it cost. Gating the
   * control on item count hid that on 9,229 of 20,706 declarations, nearly
   * half, leaving a bare rupee figure and no way to see what it was for.
   *
   * A bare cash amount, by contrast, genuinely has nothing behind it: the
   * total is the entire declaration and a disclosure control would open onto
   * a repeat of the number already shown.
   */
  const detailed =
    items.length > 1 ||
    items.some(i => i.description.trim().length >= 8 || i.attributes.length > 0);

  return { items, total, text: tidy(raw), detailed };
}

/**
 * Whether a declaration reduces to a single figure.
 *
 * An absent year counts as fine — the row just shows a dash for it. Only a
 * declaration that resists itemising (a property description, say, where the
 * value is prose rather than a sum) forces the head out of table form.
 */
const isCountable = (s: DeclarationSummary | null) =>
  !s || (s.total !== null && s.total > 0);

/** One relation's figures for both years, with the line items a click away. */
const ComparisonRow: React.FC<{
  relation: string;
  now: DeclarationSummary | null;
  then: DeclarationSummary | null;
  showPast: boolean;
  lang: 'en' | 'ta';
}> = ({ relation, now, then, showPast, lang }) => {
  const t = T[lang];
  const [open, setOpen] = useState(false);
  const expandable = Boolean(now?.detailed || then?.detailed);

  const cell = (s: DeclarationSummary | null, muted?: boolean) => {
    if (!s) return <span className="text-slate-300">—</span>;
    return (
      <span className="inline-flex flex-col items-end">
        <span className={`font-mono font-semibold tabular-nums ${muted ? 'text-slate-500' : 'text-slate-900'}`}>
          {s.total !== null ? formatINR(s.total) : '—'}
        </span>
        {s.items.length > 1 && (
          <span className="text-[10px] text-slate-400 font-mono">{s.items.length} {t.items}</span>
        )}
      </span>
    );
  };

  return (
    <>
      <tr className="border-t border-slate-100">
        <td className="py-2 pr-2 align-top">
          <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wide">
            {relationLabel(relation, lang)}
          </span>
          {expandable && (
            <button
              type="button"
              onClick={() => setOpen(o => !o)}
              aria-expanded={open}
              className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-slate-700 transition-colors mt-0.5"
            >
              <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
              <span>{open ? t.hideBreakdown : t.breakdown}</span>
            </button>
          )}
        </td>
        <td className="py-2 pl-2 text-right align-top text-[13px] whitespace-nowrap">{cell(now)}</td>
        {showPast && (
          <td className="py-2 pl-3 text-right align-top text-[13px] whitespace-nowrap">{cell(then, true)}</td>
        )}
      </tr>

      {open && (
        <tr>
          <td colSpan={showPast ? 3 : 2} className="pb-3">
            {/* The measure floor. `sm:grid-cols-2` split this in two whenever
                the *window* passed 640px — but the cell it sits in is a
                fraction of that, and the two halves came out at 124px, which
                is where words started breaking mid-syllable. auto-fit asks the
                container instead: below 2 × 16rem it stays one column, with no
                breakpoint to keep in sync. */}
            <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(16rem,1fr))] bg-slate-50 border border-slate-200 rounded-xl p-3">
              {now && (
                <DeclarationBody raw={now.text} lang={lang} year={showPast ? t.now : undefined} />
              )}
              {showPast && then && (
                <DeclarationBody raw={then.text} lang={lang} year={t.past} past />
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

/**
 * One declared head, broken out by the relation that declared it.
 *
 * Heads whose every figure is a sum render as a table — relation down the side,
 * one column per election. That is the shape the data actually has, it lets a
 * reader compare the two years along a row instead of scrolling between two
 * stacked blocks, and it collapses a head to a few lines instead of a few
 * dozen. Heads carrying prose rather than sums (property descriptions, mostly)
 * keep the block layout, where the text has room to breathe.
 */
const DeclaredHead: React.FC<{
  heading: string;
  relations?: Record<string, string>;
  pastRelations?: Record<string, string>;
  showYears?: boolean;
  lang: 'en' | 'ta';
}> = ({ heading, relations, pastRelations, showYears, lang }) => {
  const t = T[lang];

  // The union, so a relation that declared in only one of the two years still
  // gets a row rather than being dropped for not appearing in both.
  const keys = orderRelations({ ...(pastRelations || {}), ...(relations || {}) });

  const rows = keys.map(rel => ({
    rel,
    now: summarise(relations?.[rel]),
    then: summarise(pastRelations?.[rel]),
  }));

  const tabular = rows.every(r => isCountable(r.now) && isCountable(r.then));

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs break-inside-avoid mb-3">
      <h5 className="text-[11px] font-bold text-slate-800 uppercase tracking-wide leading-snug mb-2">
        {heading}
      </h5>

      {tabular ? (
        <table className="w-full text-[13px]">
          {showYears && (
            <thead>
              <tr className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-400">
                <th className="text-left font-bold pb-1">{t.declaredBy}</th>
                <th className="text-right font-bold pb-1 pl-2">{t.now}</th>
                <th className="text-right font-bold pb-1 pl-3">{t.past}</th>
              </tr>
            </thead>
          )}
          <tbody>
            {rows.map(r => (
              <ComparisonRow
                key={r.rel}
                relation={r.rel}
                now={r.now}
                then={r.then}
                showPast={Boolean(showYears)}
                lang={lang}
              />
            ))}
          </tbody>
        </table>
      ) : (
        <div className="space-y-3">
          {keys.map(rel => (
            <RelationDeclaration
              key={rel}
              relation={rel}
              raw={relations?.[rel]}
              pastRaw={pastRelations?.[rel]}
              showYears={showYears}
              lang={lang}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/** Heads the candidate declared nothing against — kept visible, kept compact. */
const NilHeads: React.FC<{ headings: string[]; lang: 'en' | 'ta' }> = ({ headings, lang }) => {
  const [open, setOpen] = useState(false);
  const t = T[lang];
  if (!headings.length) return null;

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 text-left"
      >
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
          {t.declaredNil} · {headings.length} {t.heads}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <>
          <p className="text-xs text-slate-500 mt-3 mb-2">{t.nilNote}</p>
          <ul className="flex flex-wrap gap-1.5">
            {headings.map(h => (
              <li key={h} className="text-[11px] text-slate-600 bg-white border border-slate-200 rounded-full px-2.5 py-1">
                {h}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

/**
 * Renders a whole Form 26 section against its schema of headings.
 *
 * The 2021 schema is identical to the 2026 one — same heads, same order — so a
 * head index means the same thing in both years and the two can be merged
 * head by head rather than shown as two separate documents.
 */
const SchemaSection: React.FC<{
  icon: React.ReactNode; title: string; note?: string;
  section: AffidavitSection | undefined;
  pastSection?: AffidavitSection;
  headings: string[]; lang: 'en' | 'ta';
}> = ({ icon, title, note, section, pastSection, headings, lang }) => {
  const t = T[lang];
  const showYears = Boolean(pastSection);

  const at = (s: AffidavitSection | undefined, i: number) => normaliseHead(s?.[String(i)]);

  const has = (s: AffidavitSection | undefined, i: number) => {
    const entry = at(s, i);
    return Boolean(entry && Object.keys(entry).length);
  };

  const declared = headings
    .map((heading, index) => ({
      heading,
      relations: at(section, index),
      pastRelations: at(pastSection, index),
      any: has(section, index) || has(pastSection, index),
    }))
    .filter(entry => entry.any);

  // Nil only when nothing was declared against the head in either year.
  const nil = headings.filter((_, index) => !has(section, index) && !has(pastSection, index));

  return (
    <section className="mb-8">
      <SectionHeading
        icon={icon}
        title={title}
        note={note}
        count={`${declared.length}/${headings.length} ${t.declared}`}
      />
      {/* Columns rather than a grid. In a grid every row is as tall as its
          tallest card, so a two-line head sitting beside a thirty-line one left
          a column of dead space below it — the gaps that made this section look
          broken. Columns let the cards pack against each other instead.
          @2xl (42rem) not lg: the split must depend on this pane's width, and
          two columns only earn their place once each clears ~20rem. */}
      {declared.length > 0 && (
        <div className="columns-1 @2xl:columns-2 gap-3 mb-3">
          {declared.map(entry => (
            <DeclaredHead
              key={entry.heading}
              heading={entry.heading}
              relations={entry.relations}
              pastRelations={entry.pastRelations}
              showYears={showYears}
              lang={lang}
            />
          ))}
        </div>
      )}
      <NilHeads headings={nil} lang={lang} />
    </section>
  );
};

const CaseRecord: React.FC<{
  record: AffidavitCase; index: number; lang: 'en' | 'ta'; convicted?: boolean;
}> = ({ record, index, lang, convicted }) => {
  const fieldLabels: Record<string, { en: string; ta: string }> = {
    serial_no: { en: 'Serial no.', ta: 'வரிசை எண்' },
    fir_no: { en: 'FIR no.', ta: 'எஃப்.ஐ.ஆர் எண்' },
    case_no: { en: 'Case no.', ta: 'வழக்கு எண்' },
    court: { en: 'Court', ta: 'நீதிமன்றம்' },
    law_type: { en: 'Law / Act', ta: 'சட்டம்' },
    charges_framed: { en: 'Charges framed', ta: 'குற்றச்சாட்டு பதிவு' },
    charges_date: { en: 'Date charges framed', ta: 'குற்றச்சாட்டு தேதி' },
    appeal_filed: { en: 'Appeal filed', ta: 'மேல்முறையீடு' },
    appeal_status: { en: 'Appeal status', ta: 'மேல்முறையீட்டு நிலை' },
    punishment: { en: 'Punishment', ta: 'தண்டனை' },
    conviction_date: { en: 'Date of conviction', ta: 'தண்டனை தேதி' },
    other_details: { en: 'Other details', ta: 'மற்ற விவரங்கள்' },
  };

  const sections = Object.entries(fieldLabels)
    .filter(([key]) => record[key as keyof AffidavitCase])
    .map(([key, label]) => ({ key, label: label[lang], value: String(record[key as keyof AffidavitCase]) }));

  const ipc = record.ipcSections;

  return (
    <div className={`border rounded-2xl p-4 ${convicted ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-200'}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${convicted ? 'bg-rose-600 text-white' : 'bg-slate-800 text-white'}`}>
          #{index + 1}
        </span>
        {record.law_type && (
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{record.law_type}</span>
        )}
      </div>

      <dl className="grid gap-x-4 gap-y-2.5 [grid-template-columns:repeat(auto-fit,minmax(16rem,1fr))]">
        {sections.map(field => (
          <div key={field.key} className={field.key === 'other_details' ? 'sm:col-span-2' : ''}>
            <dt className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">{field.label}</dt>
            <dd className="text-[13px] text-slate-800 leading-relaxed break-words">{field.value}</dd>
          </div>
        ))}
      </dl>

      {ipc && (
        <div className="mt-3 pt-3 border-t border-slate-200">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
            {lang === 'en' ? 'Sections charged' : 'பிரிவுகள்'}
          </span>
          <p className="text-[13px] text-slate-800 mt-1 break-words">
            {Array.isArray(ipc)
              ? ipc.map(s => (typeof s === 'string' ? s : s.section || s.title)).filter(Boolean).join(', ')
              : String(ipc)}
          </p>
        </div>
      )}
    </div>
  );
};

/** One election's case records: pending, then convicted, then nothing to show. */
const CaseSet: React.FC<{
  cases: FullAffidavitData['cases'];
  lang: 'en' | 'ta';
  year?: string;
  muted?: boolean;
}> = ({ cases, lang, year, muted }) => {
  const t = T[lang];
  const pending = cases?.pending || [];
  const convicted = cases?.convicted || [];

  if (!pending.length && !convicted.length) {
    return (
      <p className={`text-sm ${muted ? 'text-slate-400' : 'text-slate-500'}`}>
        {muted ? t.pastNoCases : t.noCases}
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {year && !muted && (
        <span className="inline-block text-[9px] font-mono font-bold uppercase tracking-widest bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded">
          {year}
        </span>
      )}
      {pending.length > 0 && (
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
            {t.pendingCases} · {pending.length}
          </span>
          <div className="grid grid-cols-1 gap-3 mt-2">
            {pending.map((record, i) => (
              <CaseRecord key={i} record={record} index={i} lang={lang} />
            ))}
          </div>
        </div>
      )}
      {convicted.length > 0 && (
        <div>
          <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest font-mono">
            {t.convictedCases} · {convicted.length}
          </span>
          <div className="grid grid-cols-1 gap-3 mt-2">
            {convicted.map((record, i) => (
              <CaseRecord key={i} record={record} index={i} lang={lang} convicted />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Component ──────────────────────────────────────────────────────────

export default function FullAffidavit({ candidateId, lang, past, election = '2026' }: Props) {
  const pastCandidateId = past?.record.id;
  const isPastCandidate = election === '2021';
  const t = T[lang];
  const [data, setData] = useState<{ affidavit: FullAffidavitData; schema: AffidavitSchema } | null>(null);
  const [pastData, setPastData] = useState<{ affidavit: FullAffidavitData } | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'missing'>('loading');
  const [section, setSection] = useState<Section>('all');

  useEffect(() => {
    let cancelled = false;
    setState('loading');
    setData(null);

    // A 2021-only candidate's declaration is in the 2021 chunks, under their
    // 2021 id. Same shape, same schema — only the manifest differs.
    const source = isPastCandidate
      ? loadPastAffidavit(candidateId)
      : loadFullAffidavit(candidateId);

    source
      .then(result => {
        if (cancelled) return;
        if (result) {
          setData(result);
          setState('ready');
        } else {
          setState('missing');
        }
      })
      .catch(() => {
        if (!cancelled) setState('missing');
      });

    return () => { cancelled = true; };
  }, [candidateId, isPastCandidate]);

  // The 2021 declaration loads independently of the 2026 one. If it fails or is
  // absent the dossier is still complete for 2026 — the merge is additive, and
  // never a precondition for showing the current filing.
  useEffect(() => {
    let cancelled = false;
    setPastData(null);
    if (!pastCandidateId) return;

    loadPastAffidavit(pastCandidateId)
      .then(result => { if (!cancelled && result) setPastData({ affidavit: result.affidavit }); })
      .catch(() => { /* 2026 stands on its own. */ });

    return () => { cancelled = true; };
  }, [pastCandidateId]);

  const p = pastData?.affidavit;

  const identityRows = useMemo(() => {
    if (!data) return [];
    const a = data.affidavit;
    const rows: Array<{ label: string; value: string; past?: string }> = [];

    // Paired against the 2021 value where the same field was declared then, so
    // a change of name, seat or stated profession is visible in one place.
    const pair = (label: string, value?: string, pastValue?: string) => {
      if (!value && !pastValue) return;
      rows.push({
        label,
        value: value || '—',
        past: pastValue && pastValue !== value ? pastValue : undefined,
      });
    };

    pair(t.relative, a.relative, p?.relative);
    pair(t.voterInfo, a.voterInfo, p?.voterInfo);

    const professions = { ...(p?.professions || {}), ...(a.professions || {}) };
    for (const who of Object.keys(professions)) {
      pair(`${t.profession} — ${relationLabel(who, lang)}`, a.professions?.[who], p?.professions?.[who]);
    }

    const incomes = { ...(p?.incomeSources || {}), ...(a.incomeSources || {}) };
    for (const who of Object.keys(incomes)) {
      pair(`${t.incomeSource} — ${relationLabel(who, lang)}`, a.incomeSources?.[who], p?.incomeSources?.[who]);
    }

    return rows;
  }, [data, p, lang, t]);

  /**
   * Income-tax filings keyed by relation, merged across the two elections.
   *
   * Both years key these by lowercase relation ('self', 'spouse', 'huf',
   * 'dependent1'…), so the two sets line up without normalising. A relation
   * that filed in only one of the two years still gets a card.
   */
  const taxRows = useMemo(() => {
    const now = data?.affidavit.tax || [];
    const then = p?.tax || [];
    const keys = orderRelations(
      Object.fromEntries([...then, ...now].map(e => [e.relation, ''])) as Record<string, string>
    );
    return keys.map(relation => ({
      relation,
      entry: now.find(e => e.relation === relation),
      pastEntry: then.find(e => e.relation === relation),
    }));
  }, [data, p]);

  if (state === 'loading') {
    return (
      <div className="flex items-center justify-center gap-3 py-10 bg-white border border-slate-200 rounded-3xl shadow-sm">
        <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
        <span className="text-sm font-semibold text-slate-500">{t.loading}</span>
      </div>
    );
  }

  if (state === 'missing' || !data) {
    return (
      <div className="flex items-center justify-center gap-3 py-8 bg-slate-50 border border-slate-200 rounded-3xl">
        <AlertCircle className="w-5 h-5 text-slate-400" />
        <span className="text-sm text-slate-500">{t.unavailable}</span>
      </div>
    );
  }

  const { affidavit: a, schema } = data;
  const cases = a.cases;

  // The declaration runs long. `section` narrows it to one head at a time;
  // 'all' keeps the full document, which stays the default so nothing is
  // hidden from a reader who does not touch the control.
  const sections: Array<{ key: Section; label: string }> = [
    { key: 'all', label: t.filterAll },
    ...(identityRows.length > 0 ? [{ key: 'identity' as Section, label: t.identity }] : []),
    { key: 'movable', label: t.movable },
    { key: 'immovable', label: t.immovable },
    { key: 'liabilities', label: t.liabilities },
    { key: 'contracts', label: t.contracts },
    { key: 'tax', label: t.tax },
    { key: 'cases', label: t.cases },
  ];
  const shows = (key: Section) => section === 'all' || section === key;

  return (
    <div className="pt-4">
      {/* The headline totals are rendered once, by DeclaredTotalsPanel above
          this section, so that a candidate who also stood in 2021 gets the
          two-year comparison instead of a second copy of the same figures.
          What follows is the heads those totals were summed from. */}
      {/* Stays stacked until the pane can actually hold a heading beside a
          select. At sm: the two sat side by side in a pane a third the width
          of the window, squeezing the standfirst to 152px. */}
      <div className="mb-6 flex flex-col @xl:flex-row @xl:items-end @xl:justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-xl md:text-2xl font-display font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-600" />
            <span>{t.title}</span>
          </h3>
          <p className="text-sm text-slate-500 mt-1.5 leading-relaxed max-w-3xl">{t.subtitle}</p>
        </div>

        <label className="shrink-0 flex flex-col gap-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
            {t.filterLabel}
          </span>
          <select
            data-chrome
            value={section}
            onChange={e => setSection(e.target.value as Section)}
            className="bg-white border border-slate-300 rounded-xl px-3 py-2 pr-8 text-[13px] font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 cursor-pointer max-w-full sm:max-w-[15rem] truncate"
          >
            {sections.map(s => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
        </label>
      </div>

      {/* A 2021-only candidate. Stated before any figure, because everything
          under it describes an election that is five years gone. */}
      {isPastCandidate && (
        <div className="mb-6 bg-slate-100 border border-slate-300 rounded-2xl p-4">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest bg-slate-800 text-white px-1.5 py-0.5 rounded">
              2021
            </span>
            <span className="text-[13px] font-bold text-slate-800">{t.pastOnlyTitle}</span>
          </div>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">{t.pastOnlyNote}</p>
        </div>
      )}

      {/* Why 2021 rows appear below, and on what basis the two filings were
          matched. The match is ours, not the Commission's, and the reader is
          told so here rather than in a footnote they will not reach. */}
      {past && p && (
        <div className="mb-6 bg-slate-50 border border-slate-200 rounded-2xl p-4">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
              {t.past}
            </span>
            <span className="text-[13px] font-bold text-slate-800">{t.bothYears}</span>
          </div>

          <p className="text-[13px] text-slate-600 mt-2 leading-relaxed">
            {past.record.party}
            {' · '}
            {String(past.record.constituency).split('(')[0].trim()}
            {past.record.isWinner && (
              <span className="ml-1.5 text-[10px] font-mono font-bold uppercase tracking-widest text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                {lang === 'en' ? 'Won' : 'வெற்றி'}
              </span>
            )}
          </p>

          <p className="text-xs text-slate-500 mt-2 leading-relaxed">{t.bothYearsNote}</p>

          <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
            {past.basis === 'name-and-relative' ? t.linkedOnRelative : t.linkedOnSeat}
            {'. '}
            {t.linkCaveat}
          </p>

          {past.record.sourceUrl && (
            <a
              href={past.record.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-block text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline underline-offset-2 mt-2"
            >
              {t.pastSource}
            </a>
          )}
        </div>
      )}

      {/* Identity & electoral record */}
      {shows('identity') && identityRows.length > 0 && (
        <section className="mb-8">
          <SectionHeading icon={<Users className="w-5 h-5" />} title={t.identity} />
          <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100">
            {/* minmax(0,210px) rather than a flat 210px: a fixed track will not
                shrink, so on a narrow pane the value column was pushed below
                its own floor. */}
            {identityRows.map(row => (
              <div key={row.label} className="grid grid-cols-1 sm:[grid-template-columns:minmax(0,210px)_minmax(16rem,1fr)] gap-1 sm:gap-4 p-4">
                <dt className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono pt-0.5">
                  {row.label}
                </dt>
                <dd className="text-[13px] text-slate-800 leading-relaxed break-words">
                  {row.value}
                  {row.past && (
                    <span className="flex items-baseline gap-1.5 mt-1">
                      <span className="text-[9px] font-mono font-bold uppercase tracking-widest bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded shrink-0">
                        {t.past}
                      </span>
                      <span className="text-[12px] text-slate-500 break-words">{row.past}</span>
                    </span>
                  )}
                </dd>
              </div>
            ))}
          </div>
        </section>
      )}

      {shows('movable') && <SchemaSection
        icon={<Landmark className="w-5 h-5" />}
        title={t.movable}
        section={a.movable}
        pastSection={p?.movable}
        headings={schema.movable}
        lang={lang}
      />}

      {shows('immovable') && <SchemaSection
        icon={<Home className="w-5 h-5" />}
        title={t.immovable}
        section={a.immovable}
        pastSection={p?.immovable}
        headings={schema.immovable}
        lang={lang}
      />}

      {shows('liabilities') && <SchemaSection
        icon={<Scale className="w-5 h-5" />}
        title={t.liabilities}
        section={a.liabilities}
        pastSection={p?.liabilities}
        headings={schema.liabilities}
        lang={lang}
      />}

      {shows('contracts') && <SchemaSection
        icon={<Briefcase className="w-5 h-5" />}
        title={t.contracts}
        note={t.contractsNote}
        section={a.contracts}
        pastSection={p?.contracts}
        headings={schema.contracts}
        lang={lang}
      />}

      {/* Income tax, every relation */}
      {shows('tax') && (
      <section className="mb-8">
        <SectionHeading icon={<Receipt className="w-5 h-5" />} title={t.tax} note={t.taxNote} />
        {taxRows.length > 0 ? (
          <div className="grid gap-3 items-start [grid-template-columns:repeat(auto-fit,minmax(18rem,1fr))]">
            {taxRows.map(({ relation, entry, pastEntry }) => (
              <div key={relation} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">
                    {relationLabel(relation, lang)}
                  </span>
                  {entry && (
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                        entry.pan === 'Y'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-50 text-slate-500 border-slate-200'
                      }`}
                    >
                      {entry.pan === 'Y' ? t.panYes : t.panNo}
                    </span>
                  )}
                </div>

                {/* Filings from both affidavits, each under its own year tag.
                    The two sets are kept apart rather than concatenated: the
                    2021 filing is what was sworn in 2021, and a candidate can
                    restate the same financial year differently five years on. */}
                {entry && (
                  <>
                    {pastEntry && (
                      <span className="inline-block text-[9px] font-mono font-bold uppercase tracking-widest bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded mb-1.5">
                        {t.now}
                      </span>
                    )}
                    {entry.years.length > 0 ? (
                      <ul className="space-y-1.5">
                        {entry.years.map((y, i) => (
                          <li key={`now-${y.year ?? 'unlabelled'}-${i}`} className="flex items-center justify-between gap-3 text-[13px]">
                            <span className={`font-mono ${y.year ? 'text-slate-500' : 'text-slate-400 italic'}`}>
                              {y.year ?? t.yearNotStated}
                            </span>
                            <span className="font-mono font-bold text-slate-900">{formatINR(y.amount)}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-[13px] text-slate-500">{t.noFilings}</p>
                    )}
                  </>
                )}

                {pastEntry && (
                  <div className={entry ? 'mt-3 pt-3 border-t border-dashed border-slate-200' : ''}>
                    <span className="inline-block text-[9px] font-mono font-bold uppercase tracking-widest bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded mb-1.5">
                      {t.past}
                    </span>
                    {pastEntry.years.length > 0 ? (
                      <ul className="space-y-1.5">
                        {pastEntry.years.map((y, i) => (
                          <li key={`past-${y.year ?? 'unlabelled'}-${i}`} className="flex items-center justify-between gap-3 text-[13px]">
                            <span className={`font-mono ${y.year ? 'text-slate-400' : 'text-slate-300 italic'}`}>
                              {y.year ?? t.yearNotStated}
                            </span>
                            <span className="font-mono font-semibold text-slate-500">{formatINR(y.amount)}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-[13px] text-slate-400">{t.noFilings}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">{t.noFilings}</p>
        )}
      </section>
      )}

      {/* Criminal cases, complete records */}
      {shows('cases') && (
      <section className="mb-8">
        <SectionHeading
          icon={<Gavel className="w-5 h-5" />}
          title={t.cases}
          count={cases?.count ? String(cases.count) : undefined}
        />
        {/* The two years are deliberately not pooled into one list. A case
            pending in 2021 may be the same case pending in 2026, disposed of,
            or a different matter entirely — the affidavits give no case
            identity that would let us tell. Summing them would invent a number
            neither filing supports. */}
        <CaseSet cases={cases} lang={lang} year={p ? t.now : undefined} />

        {p && (
          <div className="mt-6 pt-5 border-t border-dashed border-slate-300">
            <span className="inline-block text-[10px] font-mono font-bold uppercase tracking-widest bg-slate-100 text-slate-500 px-2 py-0.5 rounded mb-3">
              {t.pastCases}
            </span>
            <CaseSet cases={p.cases} lang={lang} year={t.past} muted />
          </div>
        )}
      </section>
      )}

    </div>
  );
}
