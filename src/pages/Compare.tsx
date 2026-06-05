/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Candidate, FontSizeSetting, LanguageSetting } from '../types';
import ComparisonView from '../components/ComparisonView';

interface CompareProps {
  candidates: Candidate[];
  lang: LanguageSetting;
  fontSize: FontSizeSetting;
}

export default function Compare({ candidates, lang, fontSize }: CompareProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const leftParam = searchParams.get('left');
  const rightParam = searchParams.get('right');

  const [compareLeftId, setCompareLeftId] = useState<string>('');
  const [compareRightId, setCompareRightId] = useState<string>('');

  useEffect(() => {
    document.title = lang === 'en'
      ? 'Candidate Comparison | KnowyourLeader'
      : 'வேட்பாளர் ஒப்பீடு | KnowyourLeader';
  }, [lang]);

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
    <main className="max-w-7xl mx-auto px-4 md:px-8 py-10 sm:py-16 min-h-[70vh]">
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
  );
}
