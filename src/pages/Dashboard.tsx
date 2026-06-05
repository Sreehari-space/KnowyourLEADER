/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Candidate, FontSizeSetting, LanguageSetting } from '../types';
import MetricsDashboard from '../components/MetricsDashboard';
import { TRANSLATIONS } from '../data/translations';

interface DashboardProps {
  candidates: Candidate[];
  lang: LanguageSetting;
  fontSize: FontSizeSetting;
}

export default function Dashboard({ candidates, lang, fontSize }: DashboardProps) {
  const pageTitle = lang === 'en'
    ? 'Electoral Analytics Dashboard | KnowyourLeader'
    : 'புள்ளிவிவரத் தரவு | KnowyourLeader';
  const pageDesc = lang === 'en' 
    ? 'Data-driven visual insights on candidate net worth, education profiles, and criminal record distributions.'
    : 'வேட்பாளர்களின் சொத்துக்கள் மற்றும் கிரிமினல் வழக்குகளின் புள்ளிவிவர தரவு.';

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        <link rel="canonical" href="https://knowyourleader.in/dashboard" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDesc} />
        <meta property="og:url" content="https://knowyourleader.in/dashboard" />
      </Helmet>
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-10 sm:py-16 min-h-[70vh]">
        <MetricsDashboard candidates={candidates} lang={lang} fontSize={fontSize} />
      </main>
    </>
  );
}
