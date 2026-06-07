/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { Candidate, FontSizeSetting, LanguageSetting } from '../types';
import { TRANSLATIONS } from '../data/translations';
import CandidateCard from '../components/CandidateCard';
import AnimatedCandidateModal from '../components/AnimatedCandidateModal';
import { 
  Search, 
  ArrowUpDown, 
  ChevronDown,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface AffidavitsProps {
  candidates: Candidate[];
  lang: LanguageSetting;
  fontSize: FontSizeSetting;
}

export default function Affidavits({ candidates, lang, fontSize }: AffidavitsProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // Header entrance
    if (headerRef.current) {
      gsap.fromTo(headerRef.current.children, 
        { y: 30, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power3.out' }
      );
    }
  }, { scope: containerRef });

  // Grid update stagger
  useGSAP(() => {
    if (gridRef.current && gridRef.current.children.length > 0) {
      gsap.fromTo(gridRef.current.children,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: 'power2.out', clearProps: 'all' }
      );
    }
  }, { dependencies: [currentPage, searchQuery, filterParty, filterEducation, filterCriminal, sortBy], scope: containerRef });

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterParty, setFilterParty] = useState<string>('ALL');
  const [filterEducation, setFilterEducation] = useState<string>('ALL');
  const [filterCriminal, setFilterCriminal] = useState<'ALL' | 'CLEAN' | 'HAS_CASES'>('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'assets_high' | 'assets_low' | 'cases_high' | 'age'>('name');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Modal
  const [activeDetailedCandidate, setActiveDetailedCandidate] = useState<Candidate | null>(null);

  const t = TRANSLATIONS[lang];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const candidateQuery = params.get('candidate');
    const qQuery = params.get('q');

    if (candidateQuery) {
      const match = candidates.find(c => c.id === candidateQuery);
      if (match) setActiveDetailedCandidate(match);
    }
    
    if (qQuery) {
      setSearchQuery(qQuery);
    }
  }, [candidates]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterParty, filterEducation, filterCriminal, sortBy]);

  // Handlers
  const handleAddCandidateToCompare = (cand: Candidate) => {
    navigate(`/compare?left=${cand.id}`);
  };

  // Filter pipeline
  const getEduCategory = (edu: string) => {
    const e = edu.toLowerCase();
    if (e.includes('doctor') || e.includes('phd') || e.includes('ph.d')) return 'Doctorate';
    if (e.includes('post grad') || e.includes('m.a') || e.includes('m.sc') || e.includes('master')) return 'Post Graduate';
    if (e.includes('grad') || e.includes('b.a') || e.includes('b.sc') || e.includes('b.com') || e.includes('b.e')) return 'Graduate';
    if (e.includes('law') || e.includes('prof') || e.includes('llb') || e.includes('md') || e.includes('mbbs')) return 'Professional';
    return 'School';
  };

  const filteredCandidates = candidates.filter((cand) => {
    const matchSearch = 
      cand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cand.constituency.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cand.party.toLowerCase().includes(searchQuery.toLowerCase());

    const matchParty = filterParty === 'ALL' || cand.party === filterParty;
    const matchEdu = filterEducation === 'ALL' || getEduCategory(cand.education) === filterEducation;
    const matchCriminal = 
      filterCriminal === 'ALL' ||
      (filterCriminal === 'CLEAN' && cand.caseCount === 0) ||
      (filterCriminal === 'HAS_CASES' && cand.caseCount > 0);

    return matchSearch && matchParty && matchEdu && matchCriminal;
  });

  // Sort pipeline
  const sortedCandidates = [...filteredCandidates].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'assets_high') return b.netWorth - a.netWorth;
    if (sortBy === 'assets_low') return a.netWorth - b.netWorth;
    if (sortBy === 'cases_high') return b.caseCount - a.caseCount;
    if (sortBy === 'age') return parseInt(a.age) - parseInt(b.age);
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedCandidates.length / itemsPerPage);
  const paginatedCandidates = sortedCandidates.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const allPartiesList = Array.from(new Set(candidates.map(c => c.party)));
  const activeFilterCount = [filterParty !== 'ALL', filterEducation !== 'ALL', filterCriminal !== 'ALL'].filter(Boolean).length;

  const pageTitle = lang === 'en' ? 'Affidavit Directory - KnowyourLeader' : 'பிரமாணப் பத்திரப் பட்டியல் - KnowyourLeader';
  const pageDescription = lang === 'en' ? 'Explore and filter the complete database of candidate declarations, net worth, and criminal cases.' : 'வேட்பாளர்களின் சொத்துக்கள் மற்றும் கிரிமினல் வழக்குகளின் முழுமையான தரவுத்தளத்தை ஆராயுங்கள்.';

  return (
    <div ref={containerRef} className="w-full">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href="https://know-your-leader.pages.dev/affidavits" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content="https://know-your-leader.pages.dev/affidavits" />
      </Helmet>
      <main className="max-w-7xl mx-auto px-4 md:px-8 pt-10 pb-16 min-h-[80vh] space-y-10">
        <div className="space-y-8">
          {/* Header & Search */}
          <div ref={headerRef} className="w-full max-w-4xl mx-auto space-y-8 select-none">
            
            <div className="text-center space-y-4">
              <h1 className="font-serif italic font-normal text-slate-800 text-3xl sm:text-5xl leading-tight tracking-tight">
                {lang === 'en' ? 'Affidavit Directory' : 'பிரமாணப் பத்திரப் பட்டியல்'}
              </h1>
              <p className="font-sans text-neutral-600 text-sm sm:text-base">
                {lang === 'en' 
                  ? 'Search and filter through the complete database of candidate declarations.' 
                  : 'வேட்பாளர் விவரங்களை தேடவும் வடிகட்டவும்.'}
              </p>
            </div>

            {/* Search Capsule */}
            <div className="relative max-w-2xl sm:max-w-3xl mx-auto shadow-xs">
              <input
                type="text"
                className="w-full bg-[#dbe0e3] sm:bg-[#e0e4e6] border border-neutral-800 rounded-full pl-8 pr-16 py-4 sm:py-5 font-semibold text-neutral-800 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 text-sm sm:text-base md:text-lg transition-all"
                placeholder={lang === 'en' ? 'Search candidate, constituency or party...' : 'வேட்பாளர் பெயர், தொகுதி, அல்லது கட்சி தேடவும்...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-2 top-1.5 sm:top-2 w-11 h-11 sm:w-12 sm:h-12 bg-white rounded-full flex items-center justify-center border border-neutral-300 shadow-sm active:scale-95 transition-transform cursor-pointer"
                onClick={() => setSearchQuery('')}
                title={lang === 'en' ? 'Clear search' : 'தேடலை அழிக்கவும்'}
              >
                {searchQuery ? (
                  <X className="w-4 h-4 text-neutral-500" />
                ) : (
                  <Search className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-800" />
                )}
              </button>
            </div>

            {/* Filter & Sort Controls */}
            <div className="max-w-2xl sm:max-w-3xl mx-auto">
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center space-x-2 text-xs font-bold text-neutral-500 hover:text-neutral-800 transition-colors cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>{lang === 'en' ? 'Filters & Sort' : 'வடிப்பான்கள் & வரிசை'}</span>
                  {activeFilterCount > 0 && (
                    <span className="bg-neutral-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{activeFilterCount}</span>
                  )}
                  <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </button>

                <div className="flex items-center space-x-2">
                  <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-transparent text-xs font-bold text-neutral-600 cursor-pointer focus:outline-none border-none"
                  >
                    <option value="name">{t.sortName}</option>
                    <option value="assets_high">{t.sortAssetsHigh}</option>
                    <option value="assets_low">{t.sortAssetsLow}</option>
                    <option value="cases_high">{t.sortCasesHigh}</option>
                    <option value="age">{t.sortAge}</option>
                  </select>
                </div>
              </div>

              {showFilters && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 animate-fade-in bg-white border border-neutral-200/60 rounded-2xl p-4 shadow-xs">
                  {/* Party filter */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest">{t.filterParty}</label>
                    <select
                      value={filterParty}
                      onChange={(e) => setFilterParty(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-neutral-700 focus:outline-none focus:border-neutral-400 cursor-pointer transition-all"
                    >
                      <option value="ALL">{t.allParties}</option>
                      {allPartiesList.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>

                  {/* Education filter */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest">{t.filterEducation}</label>
                    <select
                      value={filterEducation}
                      onChange={(e) => setFilterEducation(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-neutral-700 focus:outline-none focus:border-neutral-400 cursor-pointer transition-all"
                    >
                      <option value="ALL">{t.allEducation}</option>
                      <option value="School">{lang === 'en' ? 'School' : 'பள்ளிக்கல்வி'}</option>
                      <option value="Graduate">{lang === 'en' ? 'Graduate' : 'பட்டதாரி'}</option>
                      <option value="Post Graduate">{lang === 'en' ? 'Post Graduate' : 'முதுகலை'}</option>
                      <option value="Professional">{lang === 'en' ? 'Professional' : 'தொழில்முறை'}</option>
                      <option value="Doctorate">{lang === 'en' ? 'Doctorate' : 'முனைவர்'}</option>
                    </select>
                  </div>

                  {/* Criminal filter */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest">{t.filterCriminal}</label>
                    <select
                      value={filterCriminal}
                      onChange={(e) => setFilterCriminal(e.target.value as any)}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-neutral-700 focus:outline-none focus:border-neutral-400 cursor-pointer transition-all"
                    >
                      <option value="ALL">{t.allCriminal}</option>
                      <option value="CLEAN">{t.noCriminal}</option>
                      <option value="HAS_CASES">{t.hasCriminal}</option>
                    </select>
                  </div>

                  {activeFilterCount > 0 && (
                    <div className="sm:col-span-3 flex justify-end">
                      <button
                        onClick={() => { setFilterParty('ALL'); setFilterEducation('ALL'); setFilterCriminal('ALL'); }}
                        className="text-[10px] font-bold text-neutral-400 hover:text-neutral-600 cursor-pointer transition-colors underline underline-offset-2"
                      >
                        {lang === 'en' ? 'Reset all filters' : 'அனைத்தையும் மீட்டமை'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between max-w-4xl mx-auto px-1">
            <p className="text-[11px] font-mono font-bold text-neutral-400 uppercase tracking-widest">
              {sortedCandidates.length} {lang === 'en' ? 'candidates' : 'வேட்பாளர்கள்'}
              {searchQuery && <span className="text-neutral-300"> · "{searchQuery}"</span>}
            </p>
          </div>

          {/* Candidate Grid */}
          {sortedCandidates.length === 0 ? (
            <div className="bg-white border border-slate-200 py-16 text-center rounded-3xl space-y-3">
              <p className="text-slate-400 font-bold text-lg">
                {lang === 'en' ? 'No candidates meet your criteria.' : 'தேர்வுப் பிரிவுக்கு ஏற்ப வேட்பாளர்கள் யாரும் இல்லை.'}
              </p>
              <button
                onClick={() => { setSearchQuery(''); setFilterParty('ALL'); setFilterEducation('ALL'); setFilterCriminal('ALL'); }}
                className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-extrabold text-xs rounded-xl shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                {lang === 'en' ? 'Reset Filters' : 'வடிப்பான்களை மீட்டமைக்கவும்'}
              </button>
            </div>
          ) : (
            <div className="space-y-10">
              <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedCandidates.map((cand) => (
                  <CandidateCard
                    key={cand.id}
                    candidate={cand}
                    lang={lang}
                    fontSize={fontSize}
                    onOpenDetails={(c) => setActiveDetailedCandidate(c)}
                    onAddToCompare={handleAddCandidateToCompare}
                    isComparing={false}
                  />
                ))}
              </div>
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center space-x-4 pt-6 border-t border-neutral-200/60">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-xl bg-white border border-neutral-200 text-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-sm font-bold text-neutral-700">
                    {lang === 'en' ? `Page ${currentPage} of ${totalPages}` : `பக்கம் ${currentPage} / ${totalPages}`}
                  </span>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-xl bg-white border border-neutral-200 text-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* ===== CANDIDATE MODAL ===== */}
      {activeDetailedCandidate && (
        <AnimatedCandidateModal
          candidate={activeDetailedCandidate}
          lang={lang}
          fontSize={fontSize}
          onClose={() => setActiveDetailedCandidate(null)}
        />
      )}
    </div>
  );
}
