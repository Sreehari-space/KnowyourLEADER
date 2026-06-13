/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { Helmet } from 'react-helmet-async';
import { Candidate, FontSizeSetting, LanguageSetting } from '../types';
import ComparisonView from '../components/ComparisonView';

interface CompareProps {
  candidates: Candidate[];
  lang: LanguageSetting;
  fontSize: FontSizeSetting;
}

export default function Compare({ candidates, lang, fontSize }: CompareProps) {
  const containerRef = useRef<HTMLElement>(null);
  useGSAP(() => {
    gsap.fromTo(containerRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' });
  }, { scope: containerRef });

  const [searchParams, setSearchParams] = useSearchParams();
  const leftParam = searchParams.get('left');
  const rightParam = searchParams.get('right');

  const [compareLeftId, setCompareLeftId] = useState<string>('');
  const [compareRightId, setCompareRightId] = useState<string>('');

  const pageTitle = lang === 'en'
    ? 'Candidate Comparison | TN Leaders'
    : 'வேட்பாளர் ஒப்பீடு | TN Leaders';
  const pageDesc = lang === 'en'
    ? 'Side-by-side comparison of candidate profiles, assets, and liabilities.'
    : 'வேட்பாளர்களின் சொத்துக்கள் மற்றும் கடன்களின் நேரடி ஒப்பீடு.';
  useEffect(() => {
    let newLeftId = leftParam || compareLeftId;
    let newRightId = rightParam || compareRightId;

    if (candidates.length >= 2) {
      if (!newLeftId || !candidates.some(c => c.id === newLeftId)) newLeftId = candidates[0].id;
      if (!newRightId || !candidates.some(c => c.id === newRightId)) newRightId = candidates[1].id;
      
      // Prevent selecting the same candidate for both sides initially if possible
      if (newLeftId === newRightId && candidates.length > 1) {
        newRightId = candidates.find(c => c.id !== newLeftId)?.id || newRightId;
      }
    }

    setCompareLeftId(newLeftId);
    setCompareRightId(newRightId);
  }, [candidates, leftParam, rightParam]);

  const handleLeftChange = (id: string) => {
    setCompareLeftId(id);
    setSearchParams(prev => { prev.set('left', id); return prev; });
  };

  const handleRightChange = (id: string) => {
    setCompareRightId(id);
    setSearchParams(prev => { prev.set('right', id); return prev; });
  };

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        <link rel="canonical" href="https://tn-leaders.pages.dev/compare" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDesc} />
        <meta property="og:url" content="https://tn-leaders.pages.dev/compare" />
      </Helmet>
      <main ref={containerRef} className="max-w-7xl mx-auto px-4 md:px-8 py-10 sm:py-16 min-h-[60vh]">
        <ComparisonView
          candidates={candidates}
          lang={lang}
          fontSize={fontSize}
          selectedLeftId={compareLeftId}
          selectedRightId={compareRightId}
          onChangeLeft={handleLeftChange}
          onChangeRight={handleRightChange}
        />
      </main>
    </>
  );
}
