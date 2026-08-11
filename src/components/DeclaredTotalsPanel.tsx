/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * The three headline totals at the top of a candidate's dossier.
 *
 * Where the same person can be identified in the 2021 election, each figure is
 * shown for both years with the change between them. Where they cannot — most
 * candidates, who simply did not stand in 2021 — the 2026 figure is shown on
 * its own and nothing hints that anything is missing.
 *
 * A change between two declarations is a fact about the two filings and not
 * evidence of anything by itself: five years of income, an inheritance or a
 * revaluation all produce the same arrow. The panel says so.
 */

import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Candidate } from '../types';
import { FORMAT_CURRENCY, FORMAT_NET_WORTH } from '../data/candidates';
import { loadPastDeclaration, growth, PastCandidate, ElectionLink } from '../utils/pastElection';

interface Props {
  candidate: Candidate;
  lang: 'en' | 'ta';
}

type Tone = 'assets' | 'debt' | 'net';

const Card: React.FC<{
  label: string;
  now: string;
  nowValue: number;
  then?: number;
  lang: 'en' | 'ta';
  tone: Tone;
}> = ({ label, now, nowValue, then, lang, tone }) => {
  const hasPast = typeof then === 'number';
  const g = hasPast ? growth(then!, nowValue) : null;
  const flat = hasPast && then === nowValue;
  const up = hasPast && nowValue > then!;
  const Icon = flat ? Minus : up ? TrendingUp : TrendingDown;

  // Direction only. A rise in liabilities is not "bad" and a rise in assets is
  // not "good" — the colour marks which way the figure moved, nothing more.
  const arrow = flat
    ? 'text-slate-400'
    : tone === 'debt'
      ? (up ? 'text-rose-600' : 'text-emerald-600')
      : (up ? 'text-indigo-600' : 'text-slate-500');

  const value =
    tone === 'debt' ? 'text-rose-600' : tone === 'net' ? 'text-white' : 'text-slate-900';

  const shell =
    tone === 'net'
      ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20'
      : 'bg-white border border-slate-200 shadow-sm';

  return (
    <div className={`rounded-3xl p-5 sm:p-6 relative overflow-hidden ${shell}`}>
      {tone === 'net' && (
        <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-indigo-500 to-transparent pointer-events-none" />
      )}
      <div className="relative z-10">
        <span
          className={`text-[10px] font-mono font-bold uppercase tracking-widest ${
            tone === 'net' ? 'text-indigo-200' : 'text-slate-500'
          }`}
        >
          {label}
        </span>

        <p className={`text-2xl sm:text-4xl font-black font-mono tracking-tighter mt-2 tabular-nums break-words ${value}`}>
          {now}
        </p>

        {hasPast && (
          <div
            className={`mt-3 pt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1 border-t ${
              tone === 'net' ? 'border-white/20' : 'border-slate-100'
            }`}
          >
            <span
              className={`text-[10px] font-mono font-bold uppercase tracking-widest ${
                tone === 'net' ? 'text-indigo-200' : 'text-slate-400'
              }`}
            >
              2021
            </span>
            <span
              className={`text-[13px] font-mono tabular-nums ${
                tone === 'net' ? 'text-indigo-100' : 'text-slate-600'
              }`}
            >
              {FORMAT_CURRENCY(then!, lang)}
            </span>
            {!flat && (
              <span className={`text-[12px] font-mono font-black inline-flex items-center gap-1 ${tone === 'net' ? 'text-white' : arrow}`}>
                <Icon className="w-3.5 h-3.5 shrink-0" />
                {g !== null && <span>{g > 0 ? '+' : ''}{g.toFixed(0)}%</span>}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default function DeclaredTotalsPanel({ candidate, lang }: Props) {
  const [past, setPast] = useState<{ past: PastCandidate; basis: ElectionLink['basis'] } | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadPastDeclaration(candidate.id).then(r => { if (!cancelled) setPast(r); });
    return () => { cancelled = true; };
  }, [candidate.id]);

  const p = past?.past;

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card
          label={lang === 'en' ? 'Total Declared Assets' : 'மொத்த சொத்துக்கள்'}
          now={candidate.assetsFormatted}
          nowValue={candidate.assets}
          then={p?.assets}
          lang={lang}
          tone="assets"
        />
        <Card
          label={lang === 'en' ? 'Liabilities & Debts' : 'கடன்கள்'}
          now={candidate.liabilitiesFormatted}
          nowValue={candidate.liabilities}
          then={p?.liabilities}
          lang={lang}
          tone="debt"
        />
      </div>

      <Card
        label={lang === 'en' ? 'Calculated Net Worth' : 'நிகர சொத்துக்கள்'}
        now={FORMAT_NET_WORTH(candidate)}
        nowValue={candidate.netWorth}
        then={p?.netWorth}
        lang={lang}
        tone="net"
      />

      {p && (
        <p className="text-[11px] text-slate-400 leading-relaxed">
          {lang === 'en' ? 'Compared with the same candidate’s 2021 declaration' : '2021 அறிவிப்புடன் ஒப்பீடு'}
          {' — '}
          <span className="font-bold text-slate-500">{p.party}</span>
          {String(p.constituency).split('(')[0].trim() !==
            String(candidate.constituency).split('(')[0].trim() && (
            <>, {String(p.constituency).split('(')[0].trim()}</>
          )}
          {'. '}
          {lang === 'en'
            ? 'A change between two filings is a fact about the filings, not evidence of anything on its own.'
            : 'இரு அறிவிப்புகளுக்கு இடையிலான மாற்றம் என்பது ஒரு தகவல் மட்டுமே.'}
        </p>
      )}
    </section>
  );
}
