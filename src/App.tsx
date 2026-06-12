/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Candidate, FontSizeSetting, LanguageSetting } from './types';
import Header from './components/Header';
import Footer from './components/Footer';
import Disclaimer from './components/Disclaimer';
import ScrollToTop from './components/ScrollToTop';
import { Loader2 } from 'lucide-react';

const Home = React.lazy(() => import('./pages/Home'));
const Affidavits = React.lazy(() => import('./pages/Affidavits'));
const PartyDetails = React.lazy(() => import('./pages/PartyDetails'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Compare = React.lazy(() => import('./pages/Compare'));
const MlaWatch = React.lazy(() => import('./pages/MlaWatch'));

export default function App() {
  // Global State
  const [lang, setLang] = useState<LanguageSetting>('en');
  const [fontSize, setFontSize] = useState<FontSizeSetting>('regular');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState<boolean>(false);

  // Load custom candidates and fetch merged JSON
  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch('/merged_candidates.json');
        let initialCandidates = await response.json();
        
        const cached = localStorage.getItem('tn_election_custom_candidates_2026');
        if (cached) {
          try {
            const parsed = JSON.parse(cached) as Candidate[];
            const uniqueInitial = initialCandidates.filter((ic: Candidate) => !parsed.some(pc => pc.id === ic.id));
            initialCandidates = [...uniqueInitial, ...parsed];
          } catch (err) {
            console.error('Failed reading candidate local cache databases', err);
          }
        }
        setCandidates(initialCandidates);
      } catch (e) {
        console.error("Failed to load candidates data:", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const toggleLanguage = () => setLang(prev => prev === 'en' ? 'ta' : 'en');

  const getGlobalFontSizeClass = () => {
    switch (fontSize) {
      case 'small': return 'text-sm';
      case 'large': return 'text-lg leading-relaxed';
      case 'xlarge': return 'text-xl leading-loose font-medium';
      default: return 'text-base';
    }
  };

  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className={`font-sans tracking-normal antialiased bg-[#FCFBF9] text-neutral-800 selection:bg-indigo-500 selection:text-white ${getGlobalFontSizeClass()}`} id="main-root-workspace">
        <Header
          lang={lang}
          fontSize={fontSize}
          onToggleLanguage={toggleLanguage}
          onFontSizeChange={setFontSize}
        />
        
        {!disclaimerAccepted && (
          <Disclaimer lang={lang} onAccept={() => setDisclaimerAccepted(true)} />
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[] space-y-4">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
            <p className="text-neutral-500 font-mono text-sm tracking-wide">
              {lang === 'en' ? 'Loading candidate database...' : 'வேட்பாளர் தரவுத்தளம் ஏற்றப்படுகிறது...'}
            </p>
          </div>
        ) : (
          <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-[]">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
            </div>
          }>
            <Routes>
              <Route 
                path="/" 
                element={
                  <Home 
                    candidates={candidates} 
                    lang={lang} 
                    fontSize={fontSize} 
                  />
                } 
              />
              <Route 
                path="/affidavits" 
                element={
                  <Affidavits 
                    candidates={candidates} 
                    lang={lang} 
                    fontSize={fontSize} 
                  />
                } 
              />
              <Route 
                path="/dashboard" 
                element={<Dashboard candidates={candidates} lang={lang} fontSize={fontSize} />} 
              />
              <Route 
                path="/compare" 
                element={<Compare candidates={candidates} lang={lang} fontSize={fontSize} />} 
              />
              <Route 
                path="/party/:partyId" 
                element={
                  <PartyDetails 
                    candidates={candidates} 
                    lang={lang} 
                    fontSize={fontSize} 
                  />
                } 
              />
              <Route 
                path="/mla-watch" 
                element={
                  <MlaWatch 
                    candidates={candidates} 
                    lang={lang} 
                    fontSize={fontSize} 
                  />
                } 
              />
              <Route 
                path="/mla-watch/:id" 
                element={
                  <MlaWatch 
                    candidates={candidates} 
                    lang={lang} 
                    fontSize={fontSize} 
                  />
                } 
              />
            </Routes>
          </Suspense>
        )}

        <Footer lang={lang} />
      </div>
    </BrowserRouter>
  );
}
