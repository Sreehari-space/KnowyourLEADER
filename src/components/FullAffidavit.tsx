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

interface Props {
  candidateId: string;
  lang: 'en' | 'ta';
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
    totals: 'Declared Totals',
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
    totalsNote: 'The totals the candidate swore to, as filed. Net worth is derived from them.',
    assetsLabel: 'Total declared assets',
    liabilitiesLabel: 'Total declared liabilities',
    netWorthLabel: 'Net worth',
    netWorthNote: 'Assets minus liabilities',
    netWorthNegative: 'Declared liabilities exceed declared assets',
    nilLiabilities: 'None declared',
    asFiled: 'As filed',
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
    totals: 'அறிவிக்கப்பட்ட மொத்தம்',
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
    totalsNote: 'வேட்பாளர் சத்தியப்பிரமாணமாக அளித்த மொத்த மதிப்புகள். நிகர சொத்து இவற்றிலிருந்து கணக்கிடப்பட்டது.',
    assetsLabel: 'மொத்த சொத்துக்கள்',
    liabilitiesLabel: 'மொத்தக் கடன்கள்',
    netWorthLabel: 'நிகர சொத்து',
    netWorthNote: 'சொத்துக்கள் கழித்தல் கடன்கள்',
    netWorthNegative: 'அறிவிக்கப்பட்ட கடன்கள் சொத்துக்களை விட அதிகம்',
    nilLiabilities: 'ஏதுமில்லை',
    asFiled: 'தாக்கல் செய்தபடி',
  },
};

const RELATION_LABELS: Record<string, { en: string; ta: string }> = {
  self: { en: 'Self', ta: 'தான்' },
  spouse: { en: 'Spouse', ta: 'மனைவி / கணவர்' },
  huf: { en: 'Hindu Undivided Family', ta: 'கூட்டுக் குடும்பம்' },
  dependent1: { en: 'Dependant 1', ta: 'சார்ந்தவர் 1' },
  dependent2: { en: 'Dependant 2', ta: 'சார்ந்தவர் 2' },
  dependent3: { en: 'Dependant 3', ta: 'சார்ந்தவர் 3' },
  dependent4: { en: 'Dependant 4', ta: 'சார்ந்தவர் 4' },
  dependent5: { en: 'Dependant 5', ta: 'சார்ந்தவர் 5' },
};

const RELATION_ORDER = ['self', 'spouse', 'huf', 'dependent1', 'dependent2', 'dependent3', 'dependent4', 'dependent5'];

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
 * Summary totals arrive as "Rs 6,48,85,90,407 ~648 Crore+" — an exact figure
 * followed by a rounded magnitude hint. Take the exact figure; the hint is a
 * restatement. Returns null when the shape is unrecognised, in which case the
 * caller falls back to showing the string as filed.
 */
function parseDeclaredTotal(value: string): number | null {
  const match = value.match(/Rs\.?\s*([\d,]+(?:\.\d+)?)/i) || value.match(/([\d,]{4,}(?:\.\d+)?)/);
  if (!match) return null;
  const n = parseFloat(match[1].replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}

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

/** One relation's declaration, split into line items where possible. */
const RelationDeclaration: React.FC<{
  relation: string; raw: string; lang: 'en' | 'ta';
}> = ({ relation, raw, lang }) => {
  const t = T[lang];
  const items = useMemo(() => itemizeDeclaration(raw), [raw]);
  const total = items.reduce((sum, item) => sum + (item.amount || 0), 0);

  return (
    <div className="border-t border-slate-100 first:border-t-0 pt-3 first:pt-0">
      <div className="flex items-baseline justify-between gap-3 mb-2">
        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest font-mono">
          {relationLabel(relation, lang)}
        </span>
        {items.length > 1 && total > 0 && (
          <span className="text-[11px] font-mono font-bold text-slate-900 shrink-0">
            {items.length} {t.items} · {formatINR(total)}
          </span>
        )}
      </div>

      {items.length > 0 ? (
        <ol className="space-y-1">
          {items.map((item, i) => (
            <li key={i} className="flex items-start justify-between gap-3 py-1">
              <div className="min-w-0 flex-1">
                <span className="text-[13px] text-slate-700 leading-snug break-words">
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
                <span className="text-[13px] font-mono font-semibold text-slate-900 shrink-0 tabular-nums">
                  {formatINR(item.amount)}
                </span>
              )}
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-[13px] text-slate-700 leading-relaxed break-words whitespace-pre-wrap">
          {tidy(raw)}
        </p>
      )}

    </div>
  );
};

/** One declared head, broken out by the relation that declared it. */
const DeclaredHead: React.FC<{
  heading: string; relations: Record<string, string>; lang: 'en' | 'ta';
}> = ({ heading, relations, lang }) => (
  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
    <h5 className="text-[11px] font-bold text-slate-800 uppercase tracking-wide leading-snug mb-3">
      {heading}
    </h5>
    <div className="space-y-3">
      {orderRelations(relations).map(rel => (
        <RelationDeclaration key={rel} relation={rel} raw={relations[rel]} lang={lang} />
      ))}
    </div>
  </div>
);

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

/** Renders a whole Form 26 section against its schema of headings. */
const SchemaSection: React.FC<{
  icon: React.ReactNode; title: string; note?: string;
  section: AffidavitSection | undefined; headings: string[]; lang: 'en' | 'ta';
}> = ({ icon, title, note, section, headings, lang }) => {
  const t = T[lang];
  const declared = headings
    .map((heading, index) => ({ heading, relations: section?.[String(index)] }))
    .filter(entry => entry.relations && Object.keys(entry.relations).length);
  const nil = headings.filter((_, index) => !section?.[String(index)]);

  return (
    <section className="mb-8">
      <SectionHeading
        icon={icon}
        title={title}
        note={note}
        count={`${declared.length}/${headings.length} ${t.declared}`}
      />
      {declared.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
          {declared.map(entry => (
            <DeclaredHead
              key={entry.heading}
              heading={entry.heading}
              relations={entry.relations!}
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

      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5">
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

/**
 * The declared totals: assets and liabilities as sworn, plus the net worth they
 * imply. This is the headline of the whole document, so it reads as a figure
 * block rather than the label/value row it used to be.
 *
 * Both forms of each number are kept — the rounded one to be read, the exact
 * one because these are sworn figures and precision is the point. Anything the
 * parser cannot recognise is shown verbatim rather than guessed at, and any
 * summary key beyond assets/liabilities is still listed.
 */
const DeclaredTotals: React.FC<{ summary: Record<string, string>; lang: 'en' | 'ta' }> = ({ summary, lang }) => {
  const t = T[lang];
  const entries = Object.entries(summary);

  const assetsEntry = entries.find(([k]) => /asset/i.test(k));
  const liabilitiesEntry = entries.find(([k]) => /liabilit/i.test(k));
  const otherEntries = entries.filter(([k]) => !/asset|liabilit/i.test(k));

  const assets = assetsEntry ? parseDeclaredTotal(assetsEntry[1]) : null;
  // A missing liabilities key means none were declared, which is a real zero.
  const liabilities = liabilitiesEntry ? parseDeclaredTotal(liabilitiesEntry[1]) : 0;
  const netWorth = assets !== null && liabilities !== null ? assets - liabilities : null;

  const Figure = ({ label, amount, filed, tone }: {
    label: string; amount: number | null; filed?: string; tone: 'assets' | 'liabilities';
  }) => (
    <div className="bg-white border border-slate-200 rounded-2xl p-4">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
        {label}
      </span>
      <p className={`text-2xl md:text-3xl font-black font-mono tracking-tighter mt-1.5 tabular-nums ${
        tone === 'liabilities' ? 'text-rose-600' : 'text-slate-900'
      }`}>
        {amount !== null ? formatINR(amount) : (filed || '—')}
      </p>
      {amount !== null && (
        <p className="text-[11px] font-mono text-slate-400 mt-1 break-words">
          {filed ? `${t.asFiled}: ${tidy(filed)}` : t.nilLiabilities}
        </p>
      )}
    </div>
  );

  return (
    <section className="mb-8">
      <SectionHeading icon={<FileText className="w-5 h-5" />} title={t.totals} note={t.totalsNote} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Figure
          label={t.assetsLabel}
          amount={assets}
          filed={assetsEntry?.[1]}
          tone="assets"
        />
        <Figure
          label={t.liabilitiesLabel}
          amount={liabilities}
          filed={liabilitiesEntry?.[1]}
          tone="liabilities"
        />
      </div>

      {netWorth !== null && (
        <div className={`mt-3 rounded-2xl p-5 md:p-6 text-white relative overflow-hidden ${
          netWorth < 0 ? 'bg-rose-700' : 'bg-indigo-600'
        }`}>
          <div className={`absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l to-transparent pointer-events-none ${
            netWorth < 0 ? 'from-rose-600' : 'from-indigo-500'
          }`} />
          <div className="relative flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <span className={`text-[10px] font-bold uppercase tracking-widest font-mono ${
                netWorth < 0 ? 'text-rose-200' : 'text-indigo-200'
              }`}>
                {t.netWorthLabel}
              </span>
              <p className="text-3xl md:text-4xl font-black font-mono tracking-tighter mt-1 tabular-nums break-words">
                {formatINR(netWorth)}
              </p>
              <p className={`text-[11px] font-mono mt-1 tabular-nums ${
                netWorth < 0 ? 'text-rose-200/80' : 'text-indigo-200/80'
              }`}>
                {netWorth < 0 ? '-' : ''}₹{Math.abs(netWorth).toLocaleString('en-IN')}
              </p>
            </div>
            <span className="text-[10px] font-bold font-mono tracking-widest bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 max-w-full">
              {netWorth < 0 ? t.netWorthNegative : t.netWorthNote}
            </span>
          </div>
        </div>
      )}

      {otherEntries.length > 0 && (
        <div className="mt-3 bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100">
          {otherEntries.map(([label, value]) => (
            <div key={label} className="flex flex-wrap items-baseline justify-between gap-2 p-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                {label.replace(/:$/, '')}
              </span>
              <span className="text-[13px] font-mono font-bold text-slate-900">{value}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

// ─── Component ──────────────────────────────────────────────────────────

export default function FullAffidavit({ candidateId, lang }: Props) {
  const t = T[lang];
  const [data, setData] = useState<{ affidavit: FullAffidavitData; schema: AffidavitSchema } | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'missing'>('loading');
  const [section, setSection] = useState<Section>('all');

  useEffect(() => {
    let cancelled = false;
    setState('loading');
    setData(null);

    loadFullAffidavit(candidateId)
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
  }, [candidateId]);

  const identityRows = useMemo(() => {
    if (!data) return [];
    const a = data.affidavit;
    const rows: Array<{ label: string; value: string }> = [];
    if (a.relative) rows.push({ label: t.relative, value: a.relative });
    if (a.voterInfo) rows.push({ label: t.voterInfo, value: a.voterInfo });
    for (const [who, what] of Object.entries<string>(a.professions || {})) {
      rows.push({ label: `${t.profession} — ${relationLabel(who, lang)}`, value: what });
    }
    for (const [who, what] of Object.entries<string>(a.incomeSources || {})) {
      rows.push({ label: `${t.incomeSource} — ${relationLabel(who, lang)}`, value: what });
    }
    return rows;
  }, [data, lang, t]);

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
      {/* Totals lead: the headline figures first, the heads they came from below. */}
      {a.summary && <DeclaredTotals summary={a.summary} lang={lang} />}

      <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
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

      {/* Identity & electoral record */}
      {shows('identity') && identityRows.length > 0 && (
        <section className="mb-8">
          <SectionHeading icon={<Users className="w-5 h-5" />} title={t.identity} />
          <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100">
            {identityRows.map(row => (
              <div key={row.label} className="grid grid-cols-1 sm:grid-cols-[210px_1fr] gap-1 sm:gap-4 p-4">
                <dt className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono pt-0.5">
                  {row.label}
                </dt>
                <dd className="text-[13px] text-slate-800 leading-relaxed break-words">{row.value}</dd>
              </div>
            ))}
          </div>
        </section>
      )}

      {shows('movable') && <SchemaSection
        icon={<Landmark className="w-5 h-5" />}
        title={t.movable}
        section={a.movable}
        headings={schema.movable}
        lang={lang}
      />}

      {shows('immovable') && <SchemaSection
        icon={<Home className="w-5 h-5" />}
        title={t.immovable}
        section={a.immovable}
        headings={schema.immovable}
        lang={lang}
      />}

      {shows('liabilities') && <SchemaSection
        icon={<Scale className="w-5 h-5" />}
        title={t.liabilities}
        section={a.liabilities}
        headings={schema.liabilities}
        lang={lang}
      />}

      {shows('contracts') && <SchemaSection
        icon={<Briefcase className="w-5 h-5" />}
        title={t.contracts}
        note={t.contractsNote}
        section={a.contracts}
        headings={schema.contracts}
        lang={lang}
      />}

      {/* Income tax, every relation */}
      {shows('tax') && (
      <section className="mb-8">
        <SectionHeading icon={<Receipt className="w-5 h-5" />} title={t.tax} note={t.taxNote} />
        {a.tax && a.tax.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {a.tax.map(entry => (
              <div key={entry.relation} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">
                    {relationLabel(entry.relation, lang)}
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                      entry.pan === 'Y'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-50 text-slate-500 border-slate-200'
                    }`}
                  >
                    {entry.pan === 'Y' ? t.panYes : t.panNo}
                  </span>
                </div>

                {entry.years.length > 0 ? (
                  <ul className="space-y-1.5">
                    {entry.years.map((y, i) => (
                      <li key={`${y.year ?? 'unlabelled'}-${i}`} className="flex items-center justify-between gap-3 text-[13px]">
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
        {cases && (cases.pending?.length || cases.convicted?.length) ? (
          <div className="space-y-5">
            {cases.pending && cases.pending.length > 0 && (
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                  {t.pendingCases} · {cases.pending.length}
                </span>
                <div className="grid grid-cols-1 gap-3 mt-2">
                  {cases.pending.map((record, i) => (
                    <CaseRecord key={i} record={record} index={i} lang={lang} />
                  ))}
                </div>
              </div>
            )}
            {cases.convicted && cases.convicted.length > 0 && (
              <div>
                <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest font-mono">
                  {t.convictedCases} · {cases.convicted.length}
                </span>
                <div className="grid grid-cols-1 gap-3 mt-2">
                  {cases.convicted.map((record, i) => (
                    <CaseRecord key={i} record={record} index={i} lang={lang} convicted />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-500">{t.noCases}</p>
        )}
      </section>
      )}

    </div>
  );
}
