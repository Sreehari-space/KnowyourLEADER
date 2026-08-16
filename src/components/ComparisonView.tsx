/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Head-to-head comparison of two candidates' Form 26 declarations.
 *
 * Two things drove the rebuild:
 *
 *   1. Candidate selection was a native <select> holding 3,990 options. There is
 *      no way to find anyone in that. It is now a filtering combobox.
 *
 *   2. The old summary framed the richer candidate as having a "wealth
 *      advantage". This site reports what people declared after an election; it
 *      does not score them. Rows now state the gap and who declared more,
 *      without implying that more is better.
 */

import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Candidate, FontSizeSetting } from '../types';
import { TRANSLATIONS } from '../data/translations';
import { FORMAT_CURRENCY, FORMAT_NET_WORTH } from '../data/candidates';
import { ShieldCheck, Search, X, Users, ArrowLeftRight } from 'lucide-react';

interface ComparisonViewProps {
  candidates: Candidate[];
  lang: 'en' | 'ta';
  fontSize: FontSizeSetting;
  selectedLeftId: string;
  selectedRightId: string;
  onChangeLeft: (id: string) => void;
  onChangeRight: (id: string) => void;
}

const PARTY_TINT: Record<string, string> = {
  DMK: 'bg-red-600', AIADMK: 'bg-emerald-600', BJP: 'bg-amber-500',
  NTK: 'bg-yellow-500', INC: 'bg-blue-600', TVK: 'bg-violet-600',
  VCK: 'bg-purple-700', PMK: 'bg-yellow-600', IND: 'bg-teal-600',
};
const tintFor = (party: string) => {
  const p = (party || '').toUpperCase();
  for (const [k, v] of Object.entries(PARTY_TINT)) if (p === k || p.includes(k)) return v;
  return 'bg-neutral-800';
};

const seatOf = (s: string) => String(s || '').split('(')[0]?.trim() || s;
const photoOf = (c?: Candidate) => c?.photo?.replace('images/', '/candidates/');

/** Filtering combobox. A 3,990-option native select is not navigable. */
function CandidatePicker({
  candidates, value, exclude, onChange, label, lang,
}: {
  candidates: Candidate[]; value: string; exclude: string;
  onChange: (id: string) => void; label: string; lang: 'en' | 'ta';
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const selected = candidates.find((c) => c.id === value);

  useEffect(() => {
    const away = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', away);
    return () => document.removeEventListener('mousedown', away);
  }, []);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool = candidates.filter((c) => c.id !== exclude);
    if (!q) return pool.slice(0, 40);
    return pool
      .filter((c) =>
        c.name.toLowerCase().includes(q) ||
        c.party.toLowerCase().includes(q) ||
        c.constituency.toLowerCase().includes(q))
      .slice(0, 40);
  }, [query, candidates, exclude]);

  return (
    <div className="space-y-2" ref={boxRef}>
      <label className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest block">
        {label}
      </label>

      <div className="relative">
        <button
          type="button"
          onClick={() => { setOpen((o) => !o); setQuery(''); }}
          className="w-full flex items-center gap-3 bg-white border border-neutral-200 hover:border-neutral-300 rounded-2xl p-3 text-left transition-colors"
        >
          <span className={`w-10 h-10 rounded-xl overflow-hidden shrink-0 flex items-center justify-center text-white font-black ${tintFor(selected?.party || '')}`}>
            {photoOf(selected)
              ? <img src={photoOf(selected)} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              : (selected?.name || '?').charAt(0)}
          </span>
          {/* Chrome: the picker trigger. Both values are shown in full in the
              comparison below once a candidate is chosen. */}
          <span data-chrome className="min-w-0 flex-1">
            <span className="block font-black text-neutral-900 text-sm truncate">
              {selected?.name || (lang === 'en' ? 'Choose a candidate' : 'வேட்பாளரைத் தேர்வுசெய்க')}
            </span>
            <span className="block text-[11px] text-neutral-500 truncate">
              {selected ? `${selected.party} · ${seatOf(selected.constituency)}` : '—'}
            </span>
          </span>
          <Search className="w-4 h-4 text-neutral-400 shrink-0" />
        </button>

        {open && (
          <div className="absolute z-30 mt-2 w-full bg-white border border-neutral-200 rounded-2xl shadow-xl overflow-hidden">
            <div className="p-2 border-b border-neutral-100 flex items-center gap-2">
              <Search className="w-4 h-4 text-neutral-400 shrink-0 ml-1" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={lang === 'en' ? 'Name, party or constituency…' : 'பெயர், கட்சி அல்லது தொகுதி…'}
                className="flex-1 text-sm bg-transparent outline-none py-1.5"
              />
              {query && (
                <button type="button" onClick={() => setQuery('')} className="text-neutral-400 hover:text-neutral-700">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <ul className="max-h-72 overflow-y-auto custom-scrollbar">
              {matches.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => { onChange(c.id); setOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-neutral-50 transition-colors ${c.id === value ? 'bg-indigo-50/60' : ''}`}
                  >
                    <span className={`w-8 h-8 rounded-lg overflow-hidden shrink-0 flex items-center justify-center text-white text-xs font-black ${tintFor(c.party)}`}>
                      {photoOf(c)
                        ? <img src={photoOf(c)} alt="" loading="lazy" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        : c.name.charAt(0)}
                    </span>
                    {/* Chrome: search result row in the picker dropdown. */}
                    <span data-chrome className="min-w-0">
                      <span className="block text-[13px] font-bold text-neutral-900 truncate">{c.name}</span>
                      <span className="block text-[11px] text-neutral-500 truncate">{c.party} · {seatOf(c.constituency)}</span>
                    </span>
                  </button>
                </li>
              ))}
              {matches.length === 0 && (
                <li className="px-4 py-6 text-center text-sm text-neutral-400">
                  {lang === 'en' ? 'Nobody matches that' : 'பொருத்தம் இல்லை'}
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

/** One comparison row. Numeric rows get a proportional bar; text rows do not. */
function Row({
  label, a, b, numericA, numericB, tone = 'neutral', hint,
}: {
  label: string; a: React.ReactNode; b: React.ReactNode;
  numericA?: number; numericB?: number;
  tone?: 'neutral' | 'debt'; hint?: string;
}) {
  const showBar = typeof numericA === 'number' && typeof numericB === 'number';
  const max = showBar ? Math.max(Math.abs(numericA!), Math.abs(numericB!)) : 0;
  const pct = (n: number) => (max > 0 ? Math.max(2, (Math.abs(n) / max) * 100) : 0);
  const bar = tone === 'debt' ? 'bg-rose-400' : 'bg-indigo-500';

  return (
    <div className="px-4 py-3.5 border-t border-neutral-100 first:border-t-0">
      <div className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest mb-2">
        {label}
      </div>
      {/* Numeric rows stay two-up at every width — the figures are short and
          the bars only mean something side by side. Prose rows (education,
          occupation) stack on a phone: two 156px columns of a declared
          qualification is three words a line, and a comparison nobody can read
          is not a comparison. From sm: up they go two-up like the rest. */}
      <div className={`grid gap-3 sm:gap-6 items-start ${showBar ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'}`}>
        {[{ v: a, n: numericA }, { v: b, n: numericB }].map((side, i) => (
          <div key={i} className="min-w-0">
            {!showBar && (
              <span className="sm:hidden block text-[9px] font-mono font-bold uppercase tracking-widest text-neutral-400 mb-0.5">
                {i === 0 ? 'A' : 'B'}
              </span>
            )}
            <div className="text-[13px] sm:text-sm font-bold text-neutral-900 break-words">{side.v}</div>
            {showBar && (
              <div className="mt-2 h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                <div className={`h-full rounded-full ${bar} transition-all duration-500`} style={{ width: `${pct(side.n as number)}%` }} />
              </div>
            )}
          </div>
        ))}
      </div>
      {hint && <p className="text-[11px] text-neutral-400 mt-2">{hint}</p>}
    </div>
  );
}

export default function ComparisonView({
  candidates, lang, fontSize, selectedLeftId, selectedRightId, onChangeLeft, onChangeRight,
}: ComparisonViewProps) {
  const t = TRANSLATIONS[lang];
  const candA = candidates.find((c) => c.id === selectedLeftId) || candidates[0];
  const candB = candidates.find((c) => c.id === selectedRightId) || candidates[1];

  if (!candA || !candB) {
    return (
      <div className="bg-white border-2 border-dashed border-neutral-200 py-16 rounded-3xl text-center space-y-3 text-neutral-400">
        <Users className="w-12 h-12 mx-auto stroke-neutral-300" />
        <p className="font-bold">{lang === 'en' ? 'Pick two candidates to compare' : 'ஒப்பிட இரு வேட்பாளர்களைத் தேர்வுசெய்க'}</p>
      </div>
    );
  }

  const worthGap = Math.abs((candA.netWorth || 0) - (candB.netWorth || 0));
  const caseGap = Math.abs((candA.caseCount || 0) - (candB.caseCount || 0));
  const richer = candA.netWorth === candB.netWorth ? null : candA.netWorth > candB.netWorth ? candA : candB;
  const moreCases = candA.caseCount === candB.caseCount ? null : candA.caseCount > candB.caseCount ? candA : candB;

  const eduOf = (c: Candidate) => c.education.split('Category: ')[1] || c.education;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Pickers */}
      <div className="relative grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-10 bg-white border border-neutral-200/80 p-4 sm:p-6 rounded-3xl shadow-sm">
        <CandidatePicker candidates={candidates} value={candA.id} exclude={candB.id} onChange={onChangeLeft} label={t.selectLeft} lang={lang} />
        <CandidatePicker candidates={candidates} value={candB.id} exclude={candA.id} onChange={onChangeRight} label={t.selectRight} lang={lang} />
        <button
          type="button"
          onClick={() => { const a = candA.id; onChangeLeft(candB.id); onChangeRight(a); }}
          aria-label={lang === 'en' ? 'Swap sides' : 'இடம் மாற்று'}
          className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 translate-y-1 w-9 h-9 rounded-full bg-neutral-900 text-white items-center justify-center shadow-lg hover:bg-neutral-800 active:scale-95 transition-all"
        >
          <ArrowLeftRight className="w-4 h-4" />
        </button>
      </div>

      {/* Head-to-head banner */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {[candA, candB].map((c, i) => (
          <div key={i} className="relative bg-white border border-neutral-200/80 rounded-3xl overflow-hidden shadow-sm">
            <div className={`h-1.5 w-full ${tintFor(c.party)}`} />
            <div className="p-4 sm:p-5 flex flex-col items-center text-center gap-2">
              <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden ring-4 ring-white shadow-md flex items-center justify-center text-white text-2xl font-black ${tintFor(c.party)}`}>
                {photoOf(c)
                  ? <img src={photoOf(c)} alt={c.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  : c.name.charAt(0)}
              </div>
              <h3 className="font-display font-black text-neutral-900 text-sm sm:text-lg leading-tight tracking-tight break-words">
                {c.name.replace(/\s*\(Winner\)/i, '').trim()}
              </h3>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-500 bg-neutral-100 rounded-full px-2.5 py-1">
                {c.party}
              </span>
              <span className="text-[11px] text-neutral-500">{seatOf(c.constituency)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Gaps, stated neutrally */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-white border border-neutral-200/80 rounded-2xl p-4">
          <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest">
            {lang === 'en' ? 'Difference in declared net worth' : 'நிகர சொத்து வித்தியாசம்'}
          </span>
          <p className="text-xl font-black font-mono text-neutral-900 mt-1 tabular-nums">
            {worthGap === 0 ? (lang === 'en' ? 'Identical' : 'சமம்') : FORMAT_CURRENCY(worthGap, lang)}
          </p>
          {richer && (
            <p className="text-[11px] text-neutral-500 mt-1">
              {lang === 'en' ? 'declared by ' : 'அதிகம் அறிவித்தவர்: '}<span className="font-bold text-neutral-700">{richer.name}</span>
            </p>
          )}
        </div>
        <div className="bg-white border border-neutral-200/80 rounded-2xl p-4">
          <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest">
            {lang === 'en' ? 'Difference in declared cases' : 'வழக்கு வித்தியாசம்'}
          </span>
          <p className={`text-xl font-black font-mono mt-1 tabular-nums ${caseGap > 0 ? 'text-rose-700' : 'text-neutral-900'}`}>
            {caseGap === 0 ? (lang === 'en' ? 'Identical' : 'சமம்') : `${caseGap}`}
          </p>
          {moreCases && (
            <p className="text-[11px] text-neutral-500 mt-1">
              {lang === 'en' ? 'declared by ' : 'அதிகம் அறிவித்தவர்: '}<span className="font-bold text-neutral-700">{moreCases.name}</span>
            </p>
          )}
        </div>
      </div>

      {/* Detail */}
      <div className="bg-white border border-neutral-200/80 rounded-3xl overflow-hidden shadow-sm">
        <SectionBar>{lang === 'en' ? 'Profile' : 'பொது விவரங்கள்'}</SectionBar>
        <Row label={t.constituency} a={seatOf(candA.constituency)} b={seatOf(candB.constituency)} />
        <Row label={t.age} a={`${candA.age} ${lang === 'en' ? 'years' : 'வயது'}`} b={`${candB.age} ${lang === 'en' ? 'years' : 'வயது'}`} />
        <Row label={t.education} a={eduOf(candA)} b={eduOf(candB)} />
        <Row label={t.occupation} a={candA.selfProfession || '—'} b={candB.selfProfession || '—'} />

        <SectionBar>{lang === 'en' ? 'Declared finances' : 'அறிவிக்கப்பட்ட நிதி விவரங்கள்'}</SectionBar>
        <Row
          label={lang === 'en' ? 'Total declared assets' : 'மொத்த சொத்துக்கள்'}
          a={candA.assetsFormatted} b={candB.assetsFormatted}
          numericA={candA.assets} numericB={candB.assets}
        />
        <Row
          label={t.liabilities} tone="debt"
          a={<span className="text-rose-700">{candA.liabilitiesFormatted}</span>}
          b={<span className="text-rose-700">{candB.liabilitiesFormatted}</span>}
          numericA={candA.liabilities} numericB={candB.liabilities}
        />
        <Row
          label={t.netWorth}
          a={<span className={candA.netWorthPositive === false ? 'text-rose-700' : ''}>{FORMAT_NET_WORTH(candA)}</span>}
          b={<span className={candB.netWorthPositive === false ? 'text-rose-700' : ''}>{FORMAT_NET_WORTH(candB)}</span>}
          numericA={candA.netWorth} numericB={candB.netWorth}
          hint={candA.netWorthPositive === false || candB.netWorthPositive === false
            ? (lang === 'en' ? 'A negative figure means declared liabilities exceed declared assets.' : 'எதிர்மறை எண் என்பது கடன்கள் சொத்துக்களை விட அதிகம் என்பதாகும்.')
            : undefined}
        />

        <SectionBar>{lang === 'en' ? 'Declared criminal cases' : 'அறிவிக்கப்பட்ட வழக்குகள்'}</SectionBar>
        <Row
          label={lang === 'en' ? 'Cases declared in the affidavit' : 'பிரமாணப் பத்திரத்தில் அறிவிக்கப்பட்டவை'}
          a={<CaseChip n={candA.caseCount} lang={lang} />}
          b={<CaseChip n={candB.caseCount} lang={lang} />}
          numericA={candA.caseCount} numericB={candB.caseCount}
          hint={lang === 'en'
            ? 'A declared case is not a conviction. Most are pending.'
            : 'அறிவிக்கப்பட்ட வழக்கு என்பது தண்டனை அல்ல.'}
        />
      </div>
    </div>
  );
}

const SectionBar: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="bg-neutral-50 border-t border-neutral-100 px-4 py-2.5">
    <span className="text-[10px] font-mono font-black text-neutral-500 uppercase tracking-widest">{children}</span>
  </div>
);

const CaseChip: React.FC<{ n: number; lang: 'en' | 'ta' }> = ({ n, lang }) =>
  n > 0 ? (
    <span className="inline-block text-[11px] bg-rose-50 border border-rose-200 text-rose-800 px-2.5 py-1 font-black rounded-full">
      {n} {lang === 'en' ? 'declared' : 'வழக்குகள்'}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[11px] bg-teal-50 border border-teal-200 text-teal-800 px-2.5 py-1 font-black rounded-full">
      <ShieldCheck className="w-3.5 h-3.5" />
      {lang === 'en' ? 'None declared' : 'ஏதுமில்லை'}
    </span>
  );
