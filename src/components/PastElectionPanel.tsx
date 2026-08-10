/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * What this candidate declared in 2021, next to 2026.
 *
 * Renders nothing unless a 2021 counterpart was established — only 338 of the
 * 1,799 candidates have one, since most did not stand in 2021.
 *
 * The framing matters here. A rise in declared assets between two elections is
 * a fact about two sworn filings, not evidence of anything, and the panel says
 * so. Five years of ordinary income, inheritance, or a property revaluation all
 * produce the same arrow.
 */

import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus, History } from 'lucide-react';
import { Candidate } from '../types';
import { FORMAT_CURRENCY } from '../data/candidates';
import { loadPastDeclaration, growth, PastCandidate, ElectionLink } from '../utils/pastElection';

interface Props {
  candidate: Candidate;
  lang: 'en' | 'ta';
}

const pct = (n: number) => `${n > 0 ? '+' : ''}${n.toFixed(0)}%`;

const Row: React.FC<{
  label: string; then: number; now: number; lang: 'en' | 'ta'; tone?: 'debt';
}> = ({ label, then, now, lang, tone }) => {
  const g = growth(then, now);
  const up = now > then;
  const flat = now === then;
  const Icon = flat ? Minus : up ? TrendingUp : TrendingDown;
  // For liabilities a rise is not "good news", so the arrow is coloured by
  // direction only and never used to imply a verdict.
  const colour = flat ? 'text-neutral-400' : tone === 'debt'
    ? (up ? 'text-rose-600' : 'text-emerald-600')
    : (up ? 'text-indigo-600' : 'text-neutral-500');

  return (
    <div className="grid grid-cols-[1fr_auto_auto] items-baseline gap-3 py-3 border-t border-neutral-100 first:border-t-0">
      <span className="text-[11px] font-mono font-bold text-neutral-400 uppercase tracking-widest">{label}</span>
      <span className="text-[13px] font-mono text-neutral-500 tabular-nums text-right">
        {FORMAT_CURRENCY(then, lang)}
      </span>
      <span className={`text-[13px] font-mono font-black tabular-nums text-right flex items-center gap-1.5 justify-end ${colour}`}>
        <Icon className="w-3.5 h-3.5 shrink-0" />
        <span className="text-neutral-900">{FORMAT_CURRENCY(now, lang)}</span>
        {g !== null && !flat && <span className={`text-[11px] ${colour}`}>{pct(g)}</span>}
      </span>
    </div>
  );
};

export default function PastElectionPanel({ candidate, lang }: Props) {
  const [data, setData] = useState<{ past: PastCandidate; basis: ElectionLink['basis'] } | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadPastDeclaration(candidate.id).then(r => { if (!cancelled) setData(r); });
    return () => { cancelled = true; };
  }, [candidate.id]);

  if (!data) return null;
  const { past, basis } = data;

  return (
    <section className="mb-8">
      <div className="mb-4">
        <h4 className="text-base md:text-lg font-display font-black text-slate-900 tracking-tight flex items-center gap-2">
          <span className="text-indigo-600"><History className="w-5 h-5" /></span>
          <span>{lang === 'en' ? 'Compared with 2021' : '2021 உடன் ஒப்பீடு'}</span>
        </h4>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          {lang === 'en'
            ? 'The same candidate’s declaration at the previous assembly election. A change between two filings is a fact about the filings, not evidence of anything on its own.'
            : 'கடந்த சட்டமன்றத் தேர்தலில் இதே வேட்பாளர் அளித்த அறிவிப்பு. இரு அறிவிப்புகளுக்கு இடையிலான மாற்றம் என்பது ஒரு தகவல் மட்டுமே.'}
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
        <div className="grid grid-cols-[1fr_auto_auto] gap-3 pb-2 mb-1 border-b border-slate-100">
          <span />
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest text-right">2021</span>
          <span className="text-[10px] font-mono font-bold text-slate-900 uppercase tracking-widest text-right">2026</span>
        </div>

        <Row label={lang === 'en' ? 'Declared assets' : 'சொத்துக்கள்'} then={past.assets} now={candidate.assets} lang={lang} />
        <Row label={lang === 'en' ? 'Liabilities' : 'கடன்கள்'} then={past.liabilities} now={candidate.liabilities} lang={lang} tone="debt" />
        <Row label={lang === 'en' ? 'Net worth' : 'நிகர சொத்து'} then={past.netWorth} now={candidate.netWorth} lang={lang} />

        <div className="grid grid-cols-[1fr_auto_auto] items-baseline gap-3 py-3 border-t border-neutral-100">
          <span className="text-[11px] font-mono font-bold text-neutral-400 uppercase tracking-widest">
            {lang === 'en' ? 'Declared cases' : 'அறிவிக்கப்பட்ட வழக்குகள்'}
          </span>
          <span className="text-[13px] font-mono text-neutral-500 tabular-nums text-right">{past.caseCount}</span>
          <span className="text-[13px] font-mono font-black text-neutral-900 tabular-nums text-right">{candidate.caseCount}</span>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] text-slate-400">
            {lang === 'en' ? 'Stood in 2021 as ' : '2021-ல் போட்டியிட்டது: '}
            <span className="font-bold text-slate-600">{past.party}</span>
            {past.constituency !== candidate.constituency && (
              <> · <span className="font-bold text-slate-600">{String(past.constituency).split('(')[0].trim()}</span></>
            )}
          </span>
          <span className="text-[10px] font-mono text-slate-400 bg-slate-50 border border-slate-200 rounded px-2 py-0.5">
            {basis === 'same-seat-name'
              ? (lang === 'en' ? 'matched by seat + name' : 'தொகுதி + பெயர்')
              : (lang === 'en' ? 'matched by name + father/husband' : 'பெயர் + தந்தை/கணவர்')}
          </span>
        </div>
      </div>
    </section>
  );
}
