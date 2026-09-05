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
import { ShieldCheck, GraduationCap, Landmark, ArrowRight, AlertCircle, Briefcase, MapPin, Trophy, History } from 'lucide-react';

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
        
        {/* Party banner.
            64px, not 96/112. It carries the party's flag and nothing else, and
            at the old height it was the single largest block on a card whose
            job is to show six facts. */}
        <div className="h-16 w-full relative overflow-hidden" style={partyStyle.bgStyle}>
          {partyFlag(partyName) ? (
            <div
              className="absolute inset-0 z-0 bg-no-repeat bg-center bg-cover transition-transform duration-700 group-hover:scale-105"
              style={{ backgroundImage: `url('${partyFlag(partyName)}')`, opacity: 0.85 }}
            />
          ) : (
            <>
              <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]"></div>
              <div className="absolute -right-4 -top-8 opacity-20 transform rotate-12 scale-125 text-white mix-blend-overlay transition-transform duration-700 group-hover:rotate-45">
                <svg width="140" height="140" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 22h20L12 2zm0 4.5l6.5 13h-13L12 6.5z"/>
                </svg>
              </div>
            </>
          )}
        </div>

        {/* Avatar and status badges share one baseline.
            The badges used to stack vertically, so a winner who also stood in
            2021 pushed the card 28px taller than one who did not. In a row they
            cost the same height whatever a candidate carries. */}
        <div className="px-4 flex justify-between items-end gap-2 -mt-7 relative z-10">
          <div
            className="w-14 h-14 shrink-0 rounded-xl overflow-hidden border-[3px] border-white bg-white shadow-lg flex items-center justify-center text-xl font-bold transform transition-transform duration-500 group-hover:scale-105 ring-1 ring-black/5"
            style={partyStyle.textStyle}
          >
            {candidate.photo ? (
              <img src={candidate.photo.replace('images/', '/candidates/')} alt={candidate.name.replace(/\s*\(Winner\)/i, '').trim()} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            ) : (
              candidate.name.replace(/\s*\(Winner\)/i, '').trim().charAt(0)
            )}
          </div>

          <div className="flex items-center gap-1.5 mb-1 min-w-0">
            {isPast && (
              <span className="px-2 py-1 bg-slate-800 text-white font-black text-[9px] tracking-widest uppercase rounded-md shadow-sm flex items-center gap-1 whitespace-nowrap">
                <History className="w-3 h-3" />
                {lang === 'en' ? '2021' : '2021'}
              </span>
            )}
            {isActualWinner && (
              <span className="px-2 py-1 bg-gradient-to-r from-amber-400 to-yellow-500 text-yellow-950 font-black text-[9px] tracking-widest uppercase rounded-md shadow-sm flex items-center gap-1 border border-yellow-300 whitespace-nowrap">
                <Trophy className="w-3 h-3" />
                {isPast
                  ? (lang === 'en' ? 'Won' : 'வெற்றி')
                  : (lang === 'en' ? 'Winner' : 'வெற்றி')}
              </span>
            )}
            {/* Chrome: partyShort abbreviates, and shortens an unregistered
                party to nine characters plus an ellipsis. The full name is on
                the title and in the dossier, so nothing is lost here. */}
            <span
              data-chrome
              title={candidate.party}
              className={`px-2 py-1 rounded-md text-[10px] font-black tracking-wider uppercase whitespace-nowrap ${partyStyle.badge}`}
              style={partyStyle.badgeStyle}
            >
              {partyShort(partyName)}
            </span>
          </div>
        </div>

        {/* One 12px rhythm throughout. The old card mixed mb-4/mb-5, mt-2.5/mt-3
            and mt-4/mt-5, so nothing lined up against anything else. */}
        <div className="px-4 pt-3 pb-4 flex-1 flex flex-col gap-3 relative z-20 bg-white">
          <div>
            {/* Chrome: the constituency also appears in full in the dossier,
                so clipping the label here loses nothing. Marked so the layout
                audit allows it — see scripts/auditLayout.mjs. */}
            <div data-chrome className="flex items-center gap-1.5 text-neutral-400">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="text-[10px] font-mono font-bold tracking-widest uppercase truncate">
                {constituencyClean}
              </span>
            </div>
            <h3 className={`${nameSize()} font-display font-black text-neutral-900 tracking-tight mt-0.5 line-clamp-2`}>
              {candidate.name.replace(/\s*\(Winner\)/i, '').trim()}
            </h3>
            {/* items-start, not items-center: the profession clamps to two
                lines, and centring left the age pill floating against the gap
                between them instead of sitting on the first line. */}
            <div className="flex items-start gap-2 mt-1.5 min-w-0">
              <span className="shrink-0 whitespace-nowrap text-[10px] font-bold text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded">
                {candidate.age} {t.years}
              </span>
              {/* Declared data. `truncate` here hid up to 667px of a
                  candidate's stated occupation behind an ellipsis with no way
                  to read it — on a site whose purpose is disclosure. Clamped
                  to two lines instead, which shows most of it and never
                  silently drops the rest. */}
              {candidate.selfProfession && (
                <span className="flex items-start gap-1 text-[11px] font-medium text-neutral-500 min-w-0">
                  <Briefcase className="w-3 h-3 shrink-0 mt-0.5" />
                  <span className="line-clamp-2" title={candidate.selfProfession}>
                    {candidate.selfProfession}
                  </span>
                </span>
              )}
            </div>
          </div>

          {/* The three declared facts in one panel.
              These were three separate bordered cards, each with its own
              padding, its own icon chip and — on two of them — a decorative
              gradient blob. That is a lot of chrome around six words. One
              panel with dividers gives the same grouping for a third of the
              height, and the figures now share a baseline. */}
          <div className="mt-auto rounded-xl border border-neutral-200 bg-neutral-50/60 overflow-hidden">
            <div className="grid grid-cols-2 divide-x divide-neutral-200">
              <div className="p-2.5 min-w-0">
                <div className="flex items-center gap-1 text-neutral-400">
                  <Landmark className="w-3 h-3 shrink-0 text-emerald-600" />
                  <span className="text-[9px] font-bold uppercase tracking-wider truncate">{t.netWorth}</span>
                </div>
                {/* No truncate on the figure. A negative net worth carries a
                    minus sign and the longer "Lakh" unit, which pushed it past
                    the box and clipped the last digit — a declared figure shown
                    wrong is worse than one that wraps. */}
                <p
                  className={`mt-0.5 text-sm font-black font-mono tabular-nums ${
                    candidate.netWorthPositive === false ? 'text-rose-700' : 'text-neutral-800'
                  }`}
                  title={FORMAT_NET_WORTH(candidate)}
                >
                  {FORMAT_NET_WORTH(candidate)}
                </p>
              </div>

              <div className="p-2.5 min-w-0">
                <div className="flex items-center gap-1 text-neutral-400">
                  {candidate.caseCount > 0 ? (
                    <AlertCircle className="w-3 h-3 shrink-0 text-rose-600" />
                  ) : (
                    <ShieldCheck className="w-3 h-3 shrink-0 text-teal-600" />
                  )}
                  <span className="text-[9px] font-bold uppercase tracking-wider truncate">{t.criminalCases}</span>
                </div>
                <p className={`mt-0.5 text-sm font-black font-mono tabular-nums ${candidate.caseCount > 0 ? 'text-rose-700' : 'text-teal-700'}`}>
                  {/* caseCount is the total declared in the affidavit; the
                      pending/convicted split is only known for a small subset,
                      so this must not be labelled "Pending". */}
                  {candidate.caseCount > 0 ? `${candidate.caseCount} ${lang === 'en' ? 'Declared' : 'அறிவிக்கப்பட்டது'}` : (lang === 'en' ? 'Clean Record' : 'சுத்தம்')}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2 p-2.5 border-t border-neutral-200 min-w-0">
              <GraduationCap className="w-3 h-3 shrink-0 text-indigo-600 mt-0.5" />
              {/* Declared data. This was the worst offender on the directory:
                  1,343px of one candidate's education — two degrees, two
                  universities, two years — replaced by an ellipsis. */}
              <span className="text-[11px] font-semibold text-neutral-700 line-clamp-2 min-w-0" title={candidate.education.split('Category: ')[1] || candidate.education}>
                {candidate.education.split('Category: ')[1] || candidate.education}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); onAddToCompare(candidate); }}
              className={`py-2 rounded-lg text-[11px] font-bold transition-all duration-300 ${
                isComparing
                  ? 'bg-neutral-900 text-white ring-2 ring-neutral-900 ring-offset-1'
                  : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 hover:border-neutral-300 active:scale-95'
              }`}
            >
              {isComparing ? (lang === 'en' ? 'Selected' : 'தேர்ந்தெடுக்கப்பட்டது') : (lang === 'en' ? 'Compare' : 'ஒப்பிடுக')}
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); onOpenDetails(candidate); }}
              className="py-2 rounded-lg text-[11px] font-black transition-all duration-300 bg-neutral-900 text-white hover:bg-neutral-800 flex items-center justify-center gap-1.5 group/btn active:scale-95"
            >
              <span>{lang === 'en' ? 'View Profile' : 'விவரங்கள்'}</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover/btn:translate-x-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
