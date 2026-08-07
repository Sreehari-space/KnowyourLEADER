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
        <MetricsDashboard candidates={candidates} lang={lang} fontSize={fontSize} />
      </main>
    </>
  );
}
