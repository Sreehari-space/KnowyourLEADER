/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Candidate, FontSizeSetting, LanguageSetting } from '../types';
import { FORMAT_CURRENCY } from '../data/candidates';
import { TRANSLATIONS } from '../data/translations';
import CandidateCard from '../components/CandidateCard';
import CandidateModal from '../components/CandidateModal';
import ConstituencyMap from '../components/ConstituencyMap';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  ChevronDown,
  Sparkles,
  Users,
  Landmark,
  ShieldAlert,
  GraduationCap,
  SlidersHorizontal,
  X
} from 'lucide-react';

interface HomeProps {
  candidates: Candidate[];
  lang: LanguageSetting;
  fontSize: FontSizeSetting;
}

export default function Home({ candidates, lang, fontSize }: HomeProps) {
  const navigate = useNavigate();

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterParty, setFilterParty] = useState<string>('ALL');
  const [filterEducation, setFilterEducation] = useState<string>('ALL');
  const [filterCriminal, setFilterCriminal] = useState<'ALL' | 'CLEAN' | 'HAS_CASES'>('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'assets_high' | 'assets_low' | 'cases_high' | 'age'>('name');
  const [showFilters, setShowFilters] = useState(false);

  // Compare


  // Modal
  const [activeDetailedCandidate, setActiveDetailedCandidate] = useState<Candidate | null>(null);

  // Hero
  const [activeHero, setActiveHero] = useState<string | null>(null);

  const t = TRANSLATIONS[lang];

  // No local candidates state logic needed, passed via props

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const candidateQuery = params.get('candidate');

    if (candidateQuery) {
      const match = candidates.find(c => c.id === candidateQuery);
      if (match) setActiveDetailedCandidate(match);
    }
  }, []);



  // Dynamic SEO
  useEffect(() => {
    let title = '';
    let description = '';
    let keywords = '';
    let canonical = 'https://knowyourleader.in';
    let schemaJson: any = null;
    const url = new URL(window.location.href);

    if (activeDetailedCandidate) {
      const cName = activeDetailedCandidate.name;
      const cParty = activeDetailedCandidate.party;
      const cConst = activeDetailedCandidate.constituency.split('(')[0]?.trim() || activeDetailedCandidate.constituency;
      const cWorth = activeDetailedCandidate.netWorth;
      let cWorthStr = activeDetailedCandidate.netWorthFormatted;
      const cCases = activeDetailedCandidate.caseCount;

      url.searchParams.set('candidate', activeDetailedCandidate.id);
      url.searchParams.delete('tab');
      canonical = `https://knowyourleader.in/?candidate=${activeDetailedCandidate.id}`;

      if (lang === 'en') {
        title = `${cName} (${cParty}) - Net Worth, Assets & Criminal Cases | KnowyourLeader`;
        description = `View verified ECI Form 26 self-declarations for ${cName} (${cParty}), candidate in ${cConst}, Tamil Nadu. Net Worth: ${cWorthStr}, Pending Cases: ${cCases}.`;
        keywords = `${cName} net worth, ${cName} assets, ${cName} criminal cases, ${cName} affidavit`;
      } else {
        title = `${cName} (${cParty}) - சொத்து மதிப்பு & நிலுவை வழக்குகள் | KnowyourLeader`;
        description = `${cConst} தொகுதி வேட்பாளர் ${cName} (${cParty}) அவர்களின் சொத்து விவரங்கள் மற்றும் ${cCases} நிலுவையில் கிரிமினல் வழக்குகள்.`;
        keywords = `${cName} சொத்துக்கள் 2026, ${cName} கிரிமினல் வழக்கு`;
      }

      schemaJson = {
        "@context": "https://schema.org",
        "@type": "Person",
        "name": cName,
        "jobTitle": "Political Candidate for Legislative Assembly",
        "memberOf": { "@type": "Organization", "name": cParty },
        "description": description,
        "mainEntityOfPage": canonical,
      };
    } else {
      url.searchParams.delete('candidate');
      canonical = 'https://knowyourleader.in';
      title = lang === 'en'
        ? 'KnowyourLeader — Tamil Nadu Candidate Transparency Portal 2026'
        : 'KnowyourLeader — தமிழ்நாடு வேட்பாளர் வெளிப்படைத்தன்மை தளம் 2026';
      description = t.appSubtitle;
      keywords = 'Tamil Nadu election 2026, candidate affidavits, political assets database';
    }

    window.history.replaceState({}, '', url.toString());
    document.title = title;

    const syncMeta = (selector: string, attr: string, value: string) => {
      let node = document.querySelector(selector);
      if (node) { node.setAttribute(attr, value); }
      else {
        const el = document.createElement('meta');
        if (selector.startsWith('meta[name=')) el.setAttribute('name', selector.slice(10, -1));
        else if (selector.startsWith('meta[property=')) el.setAttribute('property', selector.slice(14, -1));
        el.setAttribute(attr, value);
        document.head.appendChild(el);
      }
    };

    syncMeta('meta[name="description"]', 'content', description);
    syncMeta('meta[name="keywords"]', 'content', keywords);
    syncMeta('meta[property="og:title"]', 'content', title);
    syncMeta('meta[property="og:description"]', 'content', description);
    syncMeta('meta[property="og:url"]', 'content', url.toString());
    syncMeta('meta[property="twitter:title"]', 'content', title);
    syncMeta('meta[property="twitter:description"]', 'content', description);

    let linkCanonical = document.querySelector('link[rel="canonical"]');
    if (linkCanonical) linkCanonical.setAttribute('href', canonical);
    else {
      const link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      link.setAttribute('href', canonical);
      document.head.appendChild(link);
    }

    let schemaNode = document.getElementById('seo-schema');
    if (schemaNode) {
      schemaNode.innerHTML = JSON.stringify(schemaJson || {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "KnowyourLeader",
        "description": "Public transparency portal for Tamil Nadu candidate data.",
        "areaServed": "Tamil Nadu, India"
      }, null, 2);
    }
  }, [activeDetailedCandidate, lang]);

  // Handlers
  const handleSaveCandidate = (newCand: Candidate) => {
    // Optional: implement if needed in the future
  };

  const handleAddCandidateToCompare = (cand: Candidate) => {
    navigate(`/compare?left=${cand.id}`);
  };

  // global font size class removed from here, handled in App.tsx

  // Top 20 Candidates for Showcase
  const topCandidates = [...candidates]
    .sort((a, b) => b.netWorth - a.netWorth)
    .slice(0, 20);

  // Stats for ticker
  const totalNetWorth = candidates.reduce((s, c) => s + c.netWorth, 0);
  const totalCases = candidates.reduce((s, c) => s + c.caseCount, 0);
  const cleanCount = candidates.filter(c => c.caseCount === 0).length;

  // Hero figures data with party mapping
  const heroFigures = [
    { key: 'Kadaar', src: '/KADAAR.png', alt: 'Kadaar', party: 'MNM', zBase: 10, offset: 'left-0 sm:left-[45px] md:left-[60px]', opacityBase: 0.55 },
    { key: 'Rahul', src: '/rahul.png', alt: 'Rahul', party: 'INC', zBase: 10, offset: 'left-0 sm:left-[30px] md:left-[40px]', opacityBase: 0.55 },
    { key: 'Edappadi', src: '/edappadi.png', alt: 'Edappadi', party: 'AIADMK', zBase: 20, offset: 'left-0 sm:left-[15px] md:left-[20px]', opacityBase: 0.7 },
    { key: 'Vijay', src: '/vijay.png', alt: 'Vijay', party: 'TVK', zBase: 30, offset: '', opacityBase: 0.85 },
    { key: 'Stalin', src: '/stalin.png', alt: 'Stalin', party: 'DMK', zBase: 20, offset: 'right-0 sm:right-[15px] md:right-[20px]', opacityBase: 0.7 },
    { key: 'Thiruma', src: '/thiruma.png', alt: 'Thiruma', party: 'VCK', zBase: 10, offset: 'right-0 sm:right-[30px] md:right-[40px]', opacityBase: 0.55 },
    { key: 'Anbumani', src: '/ANBUMANI-Photoroom.png', alt: 'Anbumani', party: 'PMK', zBase: 10, offset: 'right-0 sm:right-[45px] md:right-[60px]', opacityBase: 0.55 },
  ];

  // Map click handler
  const handleConstituencyClick = (constituencyName: string) => {
    // Intentionally left blank to keep user on the map view
    // Information is displayed on the right panel within the ConstituencyMap component
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/affidavits?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate(`/affidavits`);
    }
  };

  return (
    <div className="w-full">

      {/* ===== HERO SECTION ===== */}
      <header className="hero-section-wrapper px-4 md:px-8 max-w-7xl mx-auto select-none pt-8 sm:pt-16 pb-4 sm:pb-10">
        {/* Hero Title */}
        <div className="text-center animate-slide-up">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-[3.5rem] leading-[1.1] m-0 p-0 select-none">
            {lang === 'en' ? (
              <span className="font-serif italic font-light text-neutral-800">
                Do you really know{" "}
                <span className="font-chunky text-neutral-950 font-black uppercase text-[1.1em] tracking-tight relative inline-block mx-1">
                  WHO
                </span>{" "}
                you voted for{" "}
                <span className="font-chunky text-neutral-950 text-[1.1em] inline-block ml-1">
                  ?
                </span>
              </span>
            ) : (
              <span className="font-serif italic font-light text-neutral-800">
                நீங்கள்{" "}
                <span className="font-sans font-black text-neutral-950 text-[1.1em] tracking-tight inline-block mx-1">
                  யாருக்கு
                </span>{" "}
                வாக்களித்தீர்கள் என்று உங்களுக்கு உண்மையிலேயே தெரியுமா{" "}
                <span className="font-sans font-black text-neutral-950 text-[1.1em] inline-block ml-1">
                  ?
                </span>
              </span>
            )}
          </h1>
        </div>

        {/* Hero Figures */}
        <div className="hero-figures-container w-full max-w-6xl mx-auto h-[200px] sm:h-[320px] md:h-[420px] mt-8 sm:mt-12">
          {heroFigures.map((fig, idx) => (
            <div
              key={fig.key}
              onClick={() => navigate(`/party/${fig.party}`)}
              className={`hero-figure-item relative group transition-transform duration-500 hover:scale-110 hover:z-50 origin-bottom ${fig.offset} ${
                activeHero === fig.key ? 'scale-110 z-50' : `z-${fig.zBase}`
              }`}
              style={{ animationDelay: `${idx * 80}ms` }}
            >

              <img 
                src={fig.src} 
                alt={fig.alt} 
                className={`h-[180px] sm:h-[280px] md:h-[380px] w-auto max-w-none object-bottom object-contain drop-shadow-lg cursor-pointer transition-all duration-500 ${
                  activeHero === fig.key 
                    ? 'grayscale-0 opacity-100' 
                    : `grayscale opacity-[${fig.opacityBase}] group-hover:grayscale-0 group-hover:opacity-100`
                }`}
                style={{
                  filter: activeHero === fig.key ? 'grayscale(0)' : `grayscale(1) opacity(${fig.opacityBase})`,
                  opacity: activeHero === fig.key ? 1 : fig.opacityBase,
                  transition: 'filter 0.5s, opacity 0.5s, transform 0.5s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.filter = 'grayscale(0)';
                  e.currentTarget.style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                  if (activeHero !== fig.key) {
                    e.currentTarget.style.filter = `grayscale(1)`;
                    e.currentTarget.style.opacity = String(fig.opacityBase);
                  }
                }}
              />
            </div>
          ))}
        </div>

        {/* Stats Ticker */}
        <div className="max-w-3xl mx-auto mt-6 sm:mt-10">
          <div className="flex items-center justify-start sm:justify-center flex-nowrap overflow-x-auto pb-2 sm:pb-0 gap-3 sm:gap-6 text-[10px] sm:text-xs font-mono font-bold text-neutral-400 tracking-tight scrollbar-hide px-4 whitespace-nowrap">
            <div className="flex items-center space-x-1.5 shrink-0">
              <Users className="w-3.5 h-3.5 text-neutral-400" />
              <span>4023 {lang === 'en' ? 'candidates' : 'வேட்பாளர்கள்'}</span>
            </div>
            <span className="w-1 h-1 rounded-full bg-neutral-300 shrink-0" />
            <div className="flex items-center space-x-1.5 shrink-0">
              <Landmark className="w-3.5 h-3.5 text-neutral-400" />
              <span>{FORMAT_CURRENCY(totalNetWorth, lang)} {lang === 'en' ? 'Declared' : 'சொத்து'}</span>
            </div>
            <span className="w-1 h-1 rounded-full bg-neutral-300 shrink-0" />
            <div className="flex items-center space-x-1.5 shrink-0">
              <ShieldAlert className="w-3.5 h-3.5 text-neutral-400" />
              <span>{totalCases} {lang === 'en' ? 'Cases' : 'வழக்குகள்'}</span>
            </div>
          </div>
        </div>

        {/* Scroll CTA */}
        <div className="text-center mt-6 sm:mt-8">
          <button
            onClick={() => document.getElementById('main-content')?.scrollIntoView({ behavior: 'smooth' })}
            className="text-neutral-400 hover:text-neutral-600 transition-colors cursor-pointer animate-gentle-bounce inline-flex flex-col items-center space-y-1"
          >
            <span className="text-[10px] font-mono uppercase tracking-widest font-bold">{lang === 'en' ? 'Explore Data' : 'தரவை ஆராயுங்கள்'}</span>
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ===== CONSTITUENCY MAP ===== */}
      <ConstituencyMap
        lang={lang}
        candidates={candidates}
        onConstituencyClick={handleConstituencyClick}
        onSelectCandidate={setActiveDetailedCandidate}
      />

      {/* ===== MAIN CONTENT ===== */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 pt-4 pb-10 sm:py-10 min-h-[60vh] space-y-10" id="main-content">
          <div className="space-y-8 animate-fade-in" id="affidavit-list-module">
            {/* Editorial Header + Search */}
            <div className="w-full max-w-4xl mx-auto py-6 sm:py-10 space-y-8 select-none">
              
              {/* Title & Subtitle */}
              <div className="text-center space-y-4 px-2">
                <h2 className="font-serif italic font-normal text-slate-800 text-2xl sm:text-4xl md:text-[3rem] leading-tight tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">
                  {lang === 'en' ? 'You have the right to know' : 'உங்களுக்குத் தெரிந்துகொள்ள உரிமை உண்டு'}
                </h2>
                <p className="font-sans font-normal text-neutral-700 text-sm sm:text-lg md:text-[1.35rem] leading-relaxed max-w-3xl mx-auto tracking-normal">
                  {lang === 'en' 
                    ? 'This archive exists because we deserve to know what our representative declared before we elected them.' 
                    : 'தேர்தலில் நாம் வாக்களிக்கும் முன், நமது பிரதிநிதிகள் சமர்ப்பித்த சுயவிவரங்களை அறியும் உரிமை நமக்கு உள்ளது என்பதாலேயே இந்தத் தளம் இயங்குகிறது.'}
                </p>
              </div>

              {/* Search Capsule */}
              <form onSubmit={handleSearchSubmit} className="relative max-w-2xl sm:max-w-3xl mx-auto shadow-xs">
                <input
                  type="text"
                  className="w-full bg-[#dbe0e3] sm:bg-[#e0e4e6] border border-neutral-800 rounded-full pl-8 pr-16 py-4 sm:py-5 font-semibold text-neutral-800 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 text-sm sm:text-base md:text-lg transition-all"
                  placeholder={lang === 'en' ? 'Search candidate, constituency or party...' : 'வேட்பாளர் பெயர், தொகுதி, அல்லது கட்சி தேடவும்...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1.5 sm:top-2 w-11 h-11 sm:w-12 sm:h-12 bg-neutral-900 rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-transform cursor-pointer"
                  title={lang === 'en' ? 'Search' : 'தேடு'}
                >
                  <Search className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </button>
              </form>
            </div>

            {/* Results count */}
            <div className="flex items-center justify-between max-w-4xl mx-auto px-1">
              <h3 className="text-xl sm:text-2xl font-display font-black text-neutral-900 tracking-tight">
                {lang === 'en' ? 'Top 20 Declared Candidates' : 'முதல் 20 அறிவிக்கப்பட்ட வேட்பாளர்கள்'}
              </h3>
              <button 
                onClick={() => navigate('/affidavits')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline underline-offset-2"
              >
                {lang === 'en' ? 'View All Affidavits' : 'அனைத்தையும் பார்க்கவும்'}
              </button>
            </div>

            {/* Candidate Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {topCandidates.map((cand) => (
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
            
            <div className="text-center pt-8">
              <button
                onClick={() => navigate('/affidavits')}
                className="px-8 py-4 bg-white border border-neutral-200 hover:border-indigo-200 text-neutral-800 hover:text-indigo-600 font-extrabold text-sm rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer inline-flex items-center space-x-2"
              >
                <span>{lang === 'en' ? 'Explore Full Directory' : 'முழு பட்டியலையும் ஆராயுங்கள்'}</span>
              </button>
            </div>
          </div>
      </main>

      {/* ===== CANDIDATE MODAL ===== */}
      {activeDetailedCandidate && (
        <ErrorBoundary 
          fallbackMessage={lang === 'en' ? 'There was an issue rendering this candidate profile.' : 'இந்த வேட்பாளர் விவரத்தை காட்டுவதில் சிக்கல் ஏற்பட்டது.'}
          onRecover={() => setActiveDetailedCandidate(null)}
        >
          <CandidateModal
            candidate={activeDetailedCandidate}
            lang={lang}
            fontSize={fontSize}
            onClose={() => setActiveDetailedCandidate(null)}
          />
        </ErrorBoundary>
      )}

    </div>
  );
}
