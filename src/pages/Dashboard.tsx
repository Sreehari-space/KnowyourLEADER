/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { useDocumentMeta } from '../utils/documentMeta';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { Candidate, FontSizeSetting, LanguageSetting } from '../types';
import MetricsDashboard from '../components/MetricsDashboard';
import { TRANSLATIONS } from '../data/translations';

interface DashboardProps {
  candidates: Candidate[];
  lang: LanguageSetting;
  fontSize: FontSizeSetting;
}

export default function Dashboard({ candidates, lang, fontSize }: DashboardProps) {
  const containerRef = useRef<HTMLElement>(null);
  useGSAP(() => {
    gsap.fromTo(containerRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' });
  }, { scope: containerRef });

  /**
   * Which election the analytics describe.
   *
   * Every figure on this page is an aggregate — total assets, average cases,
   * education mix, wealthiest five — so the two elections cannot simply be
   * poured together: a total across 2026 and 2021 is not a fact about either.
   * The selector scopes them, and 2021 stops being unreachable from here.
   */
  const [year, setYear] = React.useState<'2026' | '2021' | 'ALL'>('2026');

  const yearOf = (c: Candidate) => c.election ?? '2026';
  const n2026 = candidates.filter(c => yearOf(c) === '2026').length;
  const n2021 = candidates.filter(c => yearOf(c) === '2021').length;
  const scoped = year === 'ALL' ? candidates : candidates.filter(c => yearOf(c) === year);

  const options: Array<{ key: '2026' | '2021' | 'ALL'; label: string; n: number }> = [
    { key: '2026', label: '2026', n: n2026 },
    { key: '2021', label: lang === 'en' ? '2021 only' : '2021 மட்டும்', n: n2021 },
    { key: 'ALL', label: lang === 'en' ? 'Both' : 'இரண்டும்', n: candidates.length },
  ];

  const pageTitle = lang === 'en'
    ? 'Electoral Analytics Dashboard | TN Leaders'
    : 'புள்ளிவிவரத் தரவு | TN Leaders';
  const pageDesc = lang === 'en' 
    ? 'Data-driven visual insights on candidate net worth, education profiles, and criminal record distributions.'
    : 'வேட்பாளர்களின் சொத்துக்கள் மற்றும் கிரிமினல் வழக்குகளின் புள்ளிவிவர தரவு.';

  useDocumentMeta({ title: pageTitle, description: pageDesc, canonical: 'https://tn-leaders.pages.dev/dashboard' });

  return (
    <>
      <main ref={containerRef} className="max-w-7xl mx-auto px-4 md:px-8 py-6 sm:py-12 min-h-[]">
        {n2021 > 0 && (
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest">
              {lang === 'en' ? 'Election' : 'தேர்தல்'}
            </span>
            <div className="inline-flex flex-wrap items-center gap-1 bg-neutral-100 border border-neutral-200 rounded-xl p-1">
              {options.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setYear(opt.key)}
                  aria-pressed={year === opt.key}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    year === opt.key ? 'bg-neutral-900 text-white shadow-sm' : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  {opt.label}
                  <span className="ml-1.5 font-mono text-neutral-400">{opt.n}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        <MetricsDashboard candidates={scoped} lang={lang} fontSize={fontSize} />
      </main>
    </>
  );
}
