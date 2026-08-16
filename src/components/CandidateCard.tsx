/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { gsap } from 'gsap';
import { Candidate, FontSizeSetting } from '../types';
import { FORMAT_NET_WORTH } from '../data/candidates';
import { TRANSLATIONS } from '../data/translations';
import { partyColour, partyShort, partyFlag } from '../data/parties';
import { ShieldCheck, GraduationCap, Landmark, ArrowRight, AlertCircle, Briefcase, MapPin, Scale, Eye, Plus, Trophy, History } from 'lucide-react';

interface CandidateCardProps {
  key?: React.Key;
  candidate: Candidate;
  lang: 'en' | 'ta';
  fontSize: FontSizeSetting;
  onOpenDetails: (candidate: Candidate) => void;
  onAddToCompare: (candidate: Candidate) => void;
  isComparing: boolean;
}

export default function CandidateCard({
  candidate,
  lang,
  fontSize,
  onOpenDetails,
  onAddToCompare,
  isComparing
}: CandidateCardProps) {
  const t = TRANSLATIONS[lang];
  const desktopCardRef = useRef<HTMLDivElement>(null);

  // Touch browsers synthesise mouseenter on tap, which left the card lifted and
  // scaled with no matching mouseleave. Only run the lift on real pointers.
  const canHover = () =>
    typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches;

  const handleMouseEnter = (ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current && canHover()) gsap.to(ref.current, { y: -8, scale: 1.02, duration: 0.4, ease: 'back.out(2)' });
  };
  const handleMouseLeave = (ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current && canHover()) gsap.to(ref.current, { y: 0, scale: 1, duration: 0.4, ease: 'power2.out' });
  };

  /**
   * Party presentation, derived from the one registry entry.
   *
   * This was a 115-line table of substring rules, plus a second colour table
   * below it that was never called, plus an abbreviation table and a flag
   * table — four copies in this file alone, and they disagreed with the map:
   * BSP and IUML had colours there and fell through to grey here.
   *
   * The gradient is built from the registry hex so a party cannot be one
   * colour on the card and another on the map.
   */
  const partyName = candidate.party;
  const colour = partyColour(partyName);

  const getPartyStyles = (_partyName: string) => ({
    bg: '',
    bgStyle: { backgroundImage: `linear-gradient(135deg, ${colour} 0%, ${colour}cc 55%, ${colour}99 100%)` },
    badge: 'bg-white/90 shadow-sm ring-1 ring-black/5',
    badgeStyle: { color: colour },
    text: '',
    textStyle: { color: colour },
    glow: '',
  });

  const partyStyle = getPartyStyles(candidate.party);

  const nameSize = () => {
    if (fontSize === 'xlarge') return 'text-2xl leading-tight';
    if (fontSize === 'large') return 'text-xl leading-tight';
    return 'text-xl sm:text-2xl leading-snug';
  };

  const constituencyClean = candidate.constituency.split('(')[0]?.trim() || candidate.constituency;

  const isActualWinner = candidate.isWinner || /\(Winner\)/i.test(candidate.name);

  // A 2021 entry is someone who did not stand in 2026. Without a mark on the
  // card a reader takes every result for a current candidate, so the badge is
  // not decoration — it is the difference between a record and a claim.
  const isPast = candidate.election === '2021';

  return (
    <div className="h-full w-full">
      {/* ================= UNIFIED RESPONSIVE LAYOUT ================= */}
      <div 
        ref={desktopCardRef}
        className={`flex group relative bg-white rounded-3xl overflow-hidden border ${isActualWinner ? 'border-amber-400 ring-2 ring-amber-400/50 shadow-[0_4px_20px_rgba(251,191,36,0.3)]' : 'border-neutral-100 shadow-[0_4px_20px_rgba(0,0,0,0.04)]'} flex-col h-full cursor-pointer ${partyStyle.glow}`}
        onClick={() => onOpenDetails(candidate)}
        onMouseEnter={() => handleMouseEnter(desktopCardRef)}
        onMouseLeave={() => handleMouseLeave(desktopCardRef)}
      >
        
        {/* Premium Top Banner with Glass & Gradients */}
        <div className="h-24 sm:h-28 w-full relative overflow-hidden" style={partyStyle.bgStyle}>
          {partyFlag(partyName) ? (
            <div
              className="absolute inset-0 z-0 bg-no-repeat bg-center bg-cover transition-transform duration-700 group-hover:scale-110"
              style={{ backgroundImage: `url('${partyFlag(partyName)}')`, opacity: 0.85 }}
            />
          ) : (
            <>
              <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]"></div>
              {/* Dynamic Abstract Geometry */}
              <div className="absolute -right-4 -top-8 opacity-20 transform rotate-12 scale-150 text-white mix-blend-overlay transition-transform duration-700 group-hover:rotate-45 group-hover:scale-[1.7]">
                <svg width="180" height="180" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 22h20L12 2zm0 4.5l6.5 13h-13L12 6.5z"/>
                </svg>
              </div>
              <div className="absolute -left-12 -bottom-12 opacity-10 transform -rotate-12 scale-150 text-white mix-blend-overlay transition-transform duration-700 group-hover:-rotate-45 group-hover:scale-[1.7]">
                <svg width="180" height="180" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="10" />
                </svg>
              </div>
            </>
          )}
        </div>

        {/* Avatar & Floating Badges */}
        <div className="px-4 sm:px-6 flex justify-between items-end gap-3 -mt-10 sm:-mt-12 relative z-10">
          <div
            className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-2xl overflow-hidden border-[4px] border-white bg-white shadow-xl flex items-center justify-center text-2xl sm:text-3xl font-bold transform transition-transform duration-500 group-hover:scale-105 group-hover:-rotate-2 ring-1 ring-black/5"
            style={partyStyle.textStyle}
          >
            {candidate.photo ? (
              <img src={candidate.photo.replace('images/', '/candidates/')} alt={candidate.name.replace(/\s*\(Winner\)/i, '').trim()} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            ) : (
              candidate.name.replace(/\s*\(Winner\)/i, '').trim().charAt(0)
            )}
          </div>
          
          <div className="flex flex-col items-end space-y-1.5 mb-1.5 min-w-0">
            <div
              title={candidate.party}
              className={`px-3 py-1 rounded-lg text-[11px] font-black tracking-wider uppercase whitespace-nowrap backdrop-blur-md ${partyStyle.badge}`}
              style={partyStyle.badgeStyle}
            >
              {partyShort(partyName)}
            </div>
            {isPast && (
              <div className="px-2.5 py-1 bg-slate-800 text-white font-black text-[9px] tracking-widest uppercase rounded-lg shadow-md flex items-center space-x-1 whitespace-nowrap">
                <History className="w-3 h-3" />
                <span>{lang === 'en' ? '2021 only' : '2021 மட்டும்'}</span>
              </div>
            )}
            {isActualWinner && (
              <div className="px-2.5 py-1 bg-gradient-to-r from-amber-400 to-yellow-500 text-yellow-950 font-black text-[9px] tracking-widest uppercase rounded-lg shadow-md flex items-center space-x-1 border border-yellow-300 whitespace-nowrap">
                <Trophy className="w-3 h-3" />
                <span>
                  {isPast
                    ? (lang === 'en' ? 'Won 2021' : '2021 வெற்றி')
                    : (lang === 'en' ? 'Winner' : 'வெற்றியாளர்')}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="px-4 sm:px-6 pt-4 sm:pt-5 pb-5 sm:pb-6 flex-1 flex flex-col relative z-20 bg-gradient-to-b from-white to-neutral-50/50">
          {/* Candidate Identity */}
          <div className="mb-4 sm:mb-5">
            {/* Chrome: the constituency also appears in full in the dossier,
                so clipping the label here loses nothing. Marked so the layout
                audit allows it — see scripts/auditLayout.mjs. */}
            <div data-chrome className="flex items-center space-x-1.5 mb-1.5 text-neutral-400">
              <MapPin className="w-3.5 h-3.5" />
              <span className="text-[11px] font-mono font-bold tracking-widest uppercase truncate max-w-full block">
                {constituencyClean}
              </span>
            </div>
            <h3 className={`${nameSize()} font-display font-black text-neutral-900 tracking-tight group-hover:text-neutral-800 transition-colors line-clamp-2`}>
              {candidate.name.replace(/\s*\(Winner\)/i, '').trim()}
            </h3>
            {/* min-w-0 + shrink-0 keep the age pill on one line; without them
                the truncating profession squeezes it into three lines. */}
            <div className="flex items-center gap-2 sm:gap-3 mt-2 min-w-0">
              <span className="shrink-0 whitespace-nowrap text-[11px] sm:text-xs font-bold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-md">
                {candidate.age} {t.years}
              </span>
              {/* Declared data. `truncate` here hid up to 667px of a
                  candidate's stated occupation behind an ellipsis with no way
                  to read it — on a site whose purpose is disclosure. Clamped
                  to two lines instead, which shows most of it and never
                  silently drops the rest. */}
              {candidate.selfProfession && (
                <div className="flex items-start space-x-1 text-[11px] sm:text-xs font-medium text-neutral-500 min-w-0">
                  <Briefcase className="w-3 h-3 shrink-0 mt-0.5" />
                  <span className="line-clamp-2" title={candidate.selfProfession}>
                    {candidate.selfProfession}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Wealth & Legal Metrics */}
          {/* flex-col + mt-auto on the value keeps both readouts on the same
              baseline even when one label wraps to two lines. */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 mt-auto">
            {/* Net Worth Glass Card */}
            <div className="flex flex-col bg-white/60 backdrop-blur-sm rounded-2xl p-3 sm:p-4 border border-neutral-100 shadow-[0_2px_10px_rgba(0,0,0,0.01)] group-hover:bg-white group-hover:border-emerald-100 group-hover:shadow-[0_8px_20px_rgba(16,185,129,0.06)] transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-emerald-100/50 to-transparent rounded-bl-full transform translate-x-4 -translate-y-4"></div>
              <div className="flex items-center gap-1.5 sm:gap-2 mb-2 relative z-10">
                <div className="bg-emerald-50 p-1.5 rounded-lg text-emerald-600 shrink-0">
                  <Landmark className="w-3.5 h-3.5" />
                </div>
                <span className="text-[9px] sm:text-[10px] font-bold text-neutral-400 uppercase tracking-wider leading-tight">{t.netWorth}</span>
              </div>
              {/* No truncate on the figure. A negative net worth carries a
                  minus sign and the longer "Lakh" unit, which pushed it past
                  the box and clipped the last digit — a declared figure shown
                  wrong is worse than one that wraps. */}
              <p
                className={`mt-auto text-sm sm:text-base font-black font-mono relative z-10 tabular-nums ${
                  candidate.netWorthPositive === false ? 'text-rose-700' : 'text-neutral-800'
                }`}
                title={FORMAT_NET_WORTH(candidate)}
              >
                {FORMAT_NET_WORTH(candidate)}
              </p>
            </div>

            {/* Cases Glass Card */}
            <div className={`flex flex-col ${candidate.caseCount > 0 ? 'bg-white/60 border-rose-100 group-hover:border-rose-200 group-hover:shadow-[0_8px_20px_rgba(225,29,72,0.06)]' : 'bg-white/60 border-teal-100 group-hover:border-teal-200 group-hover:shadow-[0_8px_20px_rgba(13,148,136,0.06)]'} backdrop-blur-sm rounded-2xl p-3 sm:p-4 border shadow-[0_2px_10px_rgba(0,0,0,0.01)] group-hover:bg-white transition-all duration-300 relative overflow-hidden`}>
              <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl ${candidate.caseCount > 0 ? 'from-rose-100/50' : 'from-teal-100/50'} to-transparent rounded-bl-full transform translate-x-4 -translate-y-4`}></div>
              <div className="flex items-center gap-1.5 sm:gap-2 mb-2 relative z-10">
                <div className={`${candidate.caseCount > 0 ? 'bg-rose-50 text-rose-600' : 'bg-teal-50 text-teal-600'} p-1.5 rounded-lg shrink-0`}>
                  {candidate.caseCount > 0 ? (
                    <AlertCircle className="w-3.5 h-3.5" />
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5" />
                  )}
                </div>
                <span className="text-[9px] sm:text-[10px] font-bold text-neutral-400 uppercase tracking-wider leading-tight">{t.criminalCases}</span>
              </div>
              <p className={`mt-auto text-sm sm:text-base font-black font-mono relative z-10 ${candidate.caseCount > 0 ? 'text-rose-700' : 'text-teal-700'}`}>
                {/* caseCount is the total declared in the affidavit; the
                    pending/convicted split is only known for a small subset,
                    so this must not be labelled "Pending". */}
                {candidate.caseCount > 0 ? `${candidate.caseCount} ${lang === 'en' ? 'Declared' : 'அறிவிக்கப்பட்டது'}` : (lang === 'en' ? 'Clean Record' : 'சுத்தம்')}
              </p>
            </div>
          </div>

          {/* Education Row */}
          <div className="mt-2.5 sm:mt-3 bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-neutral-100 flex items-center group-hover:bg-white group-hover:border-indigo-100 transition-all duration-300 shadow-[0_2px_10px_rgba(0,0,0,0.01)]">
            <div className="flex items-center gap-2.5 sm:gap-3 w-full min-w-0">
              <div className="bg-indigo-50 p-1.5 rounded-lg text-indigo-600 shrink-0">
                <GraduationCap className="w-3.5 h-3.5" />
              </div>
              {/* Declared data. This was the worst offender on the directory:
                  1,343px of one candidate's education — two degrees, two
                  universities, two years — replaced by an ellipsis. */}
              <span className="text-[11px] sm:text-xs font-bold text-neutral-700 line-clamp-2 flex-1" title={candidate.education.split('Category: ')[1] || candidate.education}>
                {candidate.education.split('Category: ')[1] || candidate.education}
              </span>
            </div>
          </div>

          {/* Interactive Actions */}
          <div className="mt-4 sm:mt-5 grid grid-cols-2 gap-2.5 sm:gap-3">
            <button
              onClick={(e) => { e.stopPropagation(); onAddToCompare(candidate); }}
              className={`py-3 rounded-xl text-xs font-bold transition-all duration-300 shadow-sm ${
                isComparing 
                  ? 'bg-neutral-900 text-white ring-2 ring-neutral-900 ring-offset-2' 
                  : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 hover:border-neutral-300 active:scale-95'
              }`}
            >
              {isComparing ? (lang === 'en' ? 'Selected' : 'தேர்ந்தெடுக்கப்பட்டது') : (lang === 'en' ? 'Compare' : 'ஒப்பிடுக')}
            </button>
            
            <button 
              onClick={(e) => { e.stopPropagation(); onOpenDetails(candidate); }}
              className="py-3 rounded-xl text-xs font-black transition-all duration-300 bg-neutral-900 text-white hover:bg-neutral-800 hover:shadow-lg hover:shadow-neutral-900/20 flex items-center justify-center gap-1.5 group/btn active:scale-95"
            >
              <span>{lang === 'en' ? 'View Profile' : 'விவரங்கள்'}</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
