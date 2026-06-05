/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { Candidate, FontSizeSetting, LanguageSetting } from '../types';
import MetricsDashboard from '../components/MetricsDashboard';
import { TRANSLATIONS } from '../data/translations';

interface DashboardProps {
  candidates: Candidate[];
  lang: LanguageSetting;
  fontSize: FontSizeSetting;
}

export default function Dashboard({ candidates, lang, fontSize }: DashboardProps) {
  useEffect(() => {
    document.title = lang === 'en'
      ? 'Electoral Analytics Dashboard | KnowyourLeader'
      : 'புள்ளிவிவரத் தரவு | KnowyourLeader';
  }, [lang]);

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-8 py-10 sm:py-16 min-h-[70vh]">
      <MetricsDashboard candidates={candidates} lang={lang} fontSize={fontSize} />
    </main>
  );
}
