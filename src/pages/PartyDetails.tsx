import React, { useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { useDocumentMeta } from '../utils/documentMeta';
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

  const partyKey = partyId ? decodeURIComponent(partyId) : '';

  const [year, setYear] = React.useState<'ALL' | '2026' | '2021'>('ALL');

  // Identity is exact, via the party registry — see src/data/parties.ts.
  const allForParty = candidates.filter(c => isPartyMatch(c.party, partyKey));

  const yearOf = (c: Candidate) => c.election ?? '2026';
  const count2026 = allForParty.filter(c => yearOf(c) === '2026').length;
  const count2021 = allForParty.filter(c => yearOf(c) === '2021').length;

  /**
   * Stats follow the year selection rather than blending the two elections.
   *
   * A party page previously received the 2026 list only, so /party/DMK showed
   * 175 of the 266 DMK candidates on the site — the 91 who stood in 2021 and
   * not in 2026 were unreachable from here. Adding them naively would have
   * summed assets across two elections five years apart, which is not a figure
   * about anything. The selector makes the scope explicit instead.
   */
  const partyCandidates = year === 'ALL' ? allForParty : allForParty.filter(c => yearOf(c) === year);

  const totalAssets = partyCandidates.reduce((sum, c) => sum + c.netWorth, 0);
  const totalCases = partyCandidates.reduce((sum, c) => sum + c.caseCount, 0);
  const totalWinners = partyCandidates.filter(c => c.isWinner || /\(Winner\)/i.test(c.name)).length;

  const yearOptions: Array<{ key: 'ALL' | '2026' | '2021'; label: string; n: number }> = [
    { key: 'ALL', label: lang === 'en' ? 'Both' : 'இரண்டும்', n: allForParty.length },
    { key: '2026', label: '2026', n: count2026 },
    { key: '2021', label: lang === 'en' ? '2021 only' : '2021 மட்டும்', n: count2021 },
  ];

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

  useDocumentMeta({ title: pageTitle, description: pageDescription, canonical: `https://tn-leaders.pages.dev/party/${partyKey}` });

  return (
    <>
      <main ref={containerRef} className={`max-w-7xl mx-auto px-4 md:px-8 py-6 sm:py-10 min-h-[] ${getGlobalFontSizeClass()}`}>
        {/* Back Button */}
      <button 
        onClick={() => navigate(-1)}
        className="mb-5 sm:mb-8 flex items-center space-x-2 text-neutral-500 hover:text-neutral-900 transition-colors font-bold text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{lang === 'en' ? 'Back' : 'திரும்பிச் செல்'}</span>
      </button>

      {/* Header Section */}
      <div ref={headerRef} className="bg-white rounded-3xl p-5 sm:p-10 border border-neutral-200/60 shadow-sm mb-6 sm:mb-10" style={{ opacity: 0 }}>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6">
          {/* min-w-0 so the title can shrink. Without it a 44-character party
              name set at 6xl pushed the whole page into a sideways scroll at
              tablet width — a flex child defaults to min-width:auto and will
              not go below its content. */}
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-neutral-900 mb-2 uppercase [overflow-wrap:anywhere]">
              {partyKey}
            </h1>
            <p className="text-neutral-500 font-medium text-lg">
              {lang === 'en' ? 'Party Overview & Candidate Declarations' : 'கட்சி கண்ணோட்டம் & வேட்பாளர் பிரமாணப் பத்திரங்கள்'}
            </p>

            {/* Which election the figures below describe. Shown next to them,
                not buried in a filter panel, because every stat changes with it. */}
            {count2021 > 0 && (
              <div className="mt-4 inline-flex flex-wrap items-center gap-1 bg-neutral-100 border border-neutral-200 rounded-xl p-1">
                {yearOptions.map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => setYear(opt.key)}
                    aria-pressed={year === opt.key}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      year === opt.key
                        ? 'bg-neutral-900 text-white shadow-sm'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    {opt.label}
                    <span className={`ml-1.5 font-mono ${year === opt.key ? 'text-neutral-400' : 'text-neutral-400'}`}>
                      {opt.n}
                    </span>
                  </button>
                ))}
              </div>
            )}
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
                <span className="text-xs font-bold uppercase tracking-widest">{lang === 'en' ? 'Declared Cases' : 'அறிவிக்கப்பட்ட வழக்குகள்'}</span>
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
