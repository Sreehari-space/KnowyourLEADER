import React, { useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { Helmet } from 'react-helmet-async';
import { Candidate, FontSizeSetting, LanguageSetting } from '../types';
import CandidateCard from '../components/CandidateCard';
import { FORMAT_CURRENCY } from '../data/candidates';
import { ArrowLeft, Users, Landmark, ShieldAlert, Trophy } from 'lucide-react';
import { TRANSLATIONS } from '../data/translations';
import { isPartyMatch } from '../utils/partyMatch';
import AnimatedCandidateModal from '../components/AnimatedCandidateModal';
interface PartyDetailsProps {
  candidates: Candidate[];
  lang: LanguageSetting;
  fontSize: FontSizeSetting;
}

export default function PartyDetails({ candidates, lang, fontSize }: PartyDetailsProps) {
  const { partyId } = useParams<{ partyId: string }>();
  const navigate = useNavigate();
  const t = TRANSLATIONS[lang];
  const containerRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [selectedCandidate, setSelectedCandidate] = React.useState<Candidate | null>(null);

  useGSAP(() => {
    const tl = gsap.timeline();
    if (headerRef.current) {
      tl.fromTo(headerRef.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' });
    }
    if (gridRef.current && gridRef.current.children.length > 0) {
      tl.fromTo(gridRef.current.children, 
        { y: 30, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: 'power2.out' },
        '-=0.2'
      );
    }
  }, { scope: containerRef });

  // Map partyId if we need custom names, otherwise just use it
  const partyKey = partyId?.toUpperCase() || '';
  
  // Filter candidates for this party using the utility function
  const partyCandidates = candidates.filter(c => isPartyMatch(c.party, partyKey));

  // Compute Stats
  const totalAssets = partyCandidates.reduce((sum, c) => sum + c.netWorth, 0);
  const totalCases = partyCandidates.reduce((sum, c) => sum + c.caseCount, 0);
  const totalWinners = partyCandidates.filter(c => c.isWinner || /\(Winner\)/i.test(c.name)).length;

  const getGlobalFontSizeClass = () => {
    switch (fontSize) {
      case 'small': return 'text-sm';
      case 'large': return 'text-lg leading-relaxed';
      case 'xlarge': return 'text-xl leading-loose font-medium';
      default: return 'text-base';
    }
  };

  const pageTitle = `${partyKey} Candidates & Assets 2026 | TN Leaders`;
  const pageDescription = lang === 'en' 
    ? `View ${partyCandidates.length} candidate declarations for ${partyKey}. Total declared assets: ${FORMAT_CURRENCY(totalAssets, lang)}.` 
    : `${partyKey} கட்சியின் வேட்பாளர்கள் மற்றும் சொத்து விவரங்கள்.`;

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={`https://tn-leaders.pages.dev/party/${partyKey}`} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={`https://tn-leaders.pages.dev/party/${partyKey}`} />
      </Helmet>
      <main ref={containerRef} className={`max-w-7xl mx-auto px-4 md:px-8 py-8 sm:py-12 min-h-[] ${getGlobalFontSizeClass()}`}>
        {/* Back Button */}
      <button 
        onClick={() => navigate(-1)}
        className="mb-8 flex items-center space-x-2 text-neutral-500 hover:text-neutral-900 transition-colors font-bold text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{lang === 'en' ? 'Back' : 'திரும்பிச் செல்'}</span>
      </button>

      {/* Header Section */}
      <div ref={headerRef} className="bg-white rounded-3xl p-6 sm:p-10 border border-neutral-200/60 shadow-sm mb-10" style={{ opacity: 0 }}>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-neutral-900 mb-2 uppercase">
              {partyKey}
            </h1>
            <p className="text-neutral-500 font-medium text-lg">
              {lang === 'en' ? 'Party Overview & Candidate Declarations' : 'கட்சி கண்ணோட்டம் & வேட்பாளர் பிரமாணப் பத்திரங்கள்'}
            </p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8">
            <div className="space-y-1">
              <div className="flex items-center space-x-1.5 text-neutral-400">
                <Users className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-widest">{lang === 'en' ? 'Candidates' : 'வேட்பாளர்கள்'}</span>
              </div>
              <p className="text-2xl font-black text-neutral-900">{partyCandidates.length}</p>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center space-x-1.5 text-neutral-400">
                <Landmark className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-widest">{lang === 'en' ? 'Total Assets' : 'மொத்த சொத்து'}</span>
              </div>
              <p className="text-2xl font-black text-neutral-900">{FORMAT_CURRENCY(totalAssets, lang)}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center space-x-1.5 text-neutral-400">
                <ShieldAlert className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-widest">{lang === 'en' ? 'Pending Cases' : 'நிலுவை வழக்குகள்'}</span>
              </div>
              <p className="text-2xl font-black text-neutral-900">{totalCases}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center space-x-1.5 text-neutral-400">
                <Trophy className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-widest">{lang === 'en' ? 'Winners' : 'வெற்றியாளர்கள்'}</span>
              </div>
              <p className="text-2xl font-black text-neutral-900">{totalWinners}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Candidates List */}
      <div>
        <h2 className="text-2xl font-bold text-neutral-900 mb-6">
          {lang === 'en' ? 'Candidate Profiles' : 'வேட்பாளர் விவரங்கள்'}
        </h2>
        
        {partyCandidates.length === 0 ? (
           <div className="bg-white border border-slate-200 py-16 text-center rounded-3xl space-y-3">
             <p className="text-slate-400 font-bold text-lg">
               {lang === 'en' ? `No candidates found for ${partyKey}.` : `${partyKey} கட்சிக்கு வேட்பாளர்கள் இல்லை.`}
             </p>
           </div>
        ) : (
          <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {partyCandidates.map((cand) => (
              <CandidateCard
                key={cand.id}
                candidate={cand}
                lang={lang}
                fontSize={fontSize}
                onOpenDetails={(c) => setSelectedCandidate(c)}
                onAddToCompare={() => {}}
                isComparing={false}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* ===== CANDIDATE MODAL ===== */}
      {selectedCandidate && (
        <AnimatedCandidateModal
          candidate={selectedCandidate}
          lang={lang}
          fontSize={fontSize}
          onClose={() => setSelectedCandidate(null)}
        />
      )}
    </main>
    </>
  );
}
