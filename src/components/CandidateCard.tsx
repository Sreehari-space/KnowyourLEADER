/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * CandidateCard — the poster and the record, on one card.
 *
 * The card is two surfaces, and the split is the point. The top is the claim:
 * the candidate's face and name printed on their party's flag, the way a
 * campaign poster works. The bottom is the record: what they swore to on their
 * Form 26 affidavit, set as a quiet ruled table on paper. Holding those two
 * against each other is what this whole site is for, so the card is built out
 * of that rather than out of a card library.
 *
 * The flag is a slot, not a dependency
 * ------------------------------------
 * Only 13 of 104 parties have flag artwork — 861 of 1,799 candidates, 47.9% —
 * and the largest party on the ballot (NTK, 234 candidates) is not one of them.
 * A design that leans on the flag would be a hole on half the directory, so the
 * slot has a designed fallback: the party's colour carrying its short code as a
 * ghosted wordmark. Same shape, same weight, equally deliberate.
 *
 * Legibility does not depend on the artwork
 * -----------------------------------------
 * Party colours run from near-black to amber and flag artwork is arbitrary, so
 * the scrim carries the contrast rather than the image: at 0.78 alpha over even
 * pure white the ground is no lighter than #404040, which holds white text at
 * about 10:1. The text is safe whatever flag lands behind it.
 *
 * Assets and liabilities, not just net worth
 * -------------------------------------------
 * 1,242 of 1,799 candidates (69%) declare liabilities, at a median of 22% of
 * their assets. Net worth alone made ₹100 Cr owing ₹95 Cr look exactly like
 * ₹100 Cr owing nothing, so the two are stated and drawn against each other.
 */

import React from 'react';
import { Candidate, FontSizeSetting } from '../types';
import { FORMAT_NET_WORTH } from '../data/candidates';
import { TRANSLATIONS } from '../data/translations';
import { partyColour, partyShort, partyFlag } from '../data/parties';
import { ShieldCheck, GraduationCap, ArrowRight, AlertCircle, Trophy, History } from 'lucide-react';

interface CandidateCardProps {
  key?: React.Key;
  candidate: Candidate;
  lang: 'en' | 'ta';
  fontSize: FontSizeSetting;
  onOpenDetails: (candidate: Candidate) => void;
  onAddToCompare: (candidate: Candidate) => void;
  isComparing: boolean;
}

/** The card's own ground, reused as the divider inside the bar. */
const PAPER = '#FCFBF8';
/** Ink for declared assets, rose for what is owed against them. */
const ASSET_INK = '#292524';
const LIABILITY_INK = '#e11d48';

/**
 * The caption bar under the flag.
 *
 * A gradient across the whole poster muted the artwork badly — the flag is the
 * thing a reader recognises, so it is left alone and the name gets a solid band
 * instead, the way a poster carries its title block. The band is 0.90 alpha:
 * over even pure white it lands no lighter than #2b2926, which holds white text
 * at about 13:1, so legibility never depends on which flag is behind it. The
 * short fade above it stops the band from reading as a hard-cut sticker.
 */
const CAPTION = 'linear-gradient(to top, rgba(12,10,9,0.94) 0%, rgba(12,10,9,0.90) 72%, rgba(12,10,9,0) 100%)';

export default function CandidateCard({
  candidate,
  lang,
  fontSize,
  onOpenDetails,
  onAddToCompare,
  isComparing,
}: CandidateCardProps) {
  const t = TRANSLATIONS[lang];

  // Colour and flag both come from the one registry entry, so a party cannot
  // be one colour here and another on the map.
  const colour = partyColour(candidate.party);
  const flag = partyFlag(candidate.party);
  const short = partyShort(candidate.party);

  const nameSize = () => {
    if (fontSize === 'xlarge') return 'text-2xl leading-tight';
    if (fontSize === 'large') return 'text-xl leading-tight';
    return 'text-lg @sm:text-xl leading-tight';
  };

  const cleanName = candidate.name.replace(/\s*\(Winner\)/i, '').trim();
  const constituencyClean = candidate.constituency.split('(')[0]?.trim() || candidate.constituency;
  const education = candidate.education.split('Category: ')[1] || candidate.education;

  const isActualWinner = candidate.isWinner || /\(Winner\)/i.test(candidate.name);

  // A 2021 entry is someone who did not stand in 2026. Without a mark on the
  // card a reader takes every result for a current candidate, so this is not
  // decoration — it is the difference between a record and a claim.
  const isPast = candidate.election === '2021';

  /**
   * The two segments, as shares of what they add up to.
   *
   * Normalised against the pair's total and never against assets: liabilities
   * routinely exceed assets — one candidate declares ₹10,000 of assets against
   * ₹9.68 lakh of debt, a ratio of 9,678% — and a bar scaled to assets would
   * run out of its track. Candidates who declare nothing give a total of zero,
   * so the shares stay at zero and the track renders empty.
   */
  const assets = Math.max(0, candidate.assets || 0);
  const liabilities = Math.max(0, candidate.liabilities || 0);
  const declaredTotal = assets + liabilities;
  const assetShare = declaredTotal > 0 ? (assets / declaredTotal) * 100 : 0;
  const liabilityShare = declaredTotal > 0 ? 100 - assetShare : 0;
  // The 2px divider is only a divider when there is something on both sides of
  // it; against a single full segment it would read as a notch cut out of it.
  const showsBothSegments = assets > 0 && liabilities > 0;

  const hasCases = candidate.caseCount > 0;

  return (
    <div className="h-full w-full">
      <div
        data-candidate-card
        className="@container group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-[#FCFBF8] shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-[0_12px_32px_rgba(15,23,42,0.12)]"
        onClick={() => onOpenDetails(candidate)}
      >
        {/* ══ The poster ══════════════════════════════════════════════ */}
        <div className="relative h-[132px] shrink-0 overflow-hidden" style={{ background: colour }}>
          {flag ? (
            // Decorative: the party is named in text just below, so the
            // artwork carries no information a screen reader would miss.
            <img
              src={flag}
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            // The 52% with no flag get the party's own short code, big and
            // ghosted, on its colour — a designed slot rather than a gap.
            <span
              aria-hidden
              className="absolute inset-0 flex items-start justify-end p-3 font-display text-[52px] font-black leading-none tracking-tighter text-white/25"
            >
              {short}
            </span>
          )}

          {/* Only the caption band is darkened; the flag above it is untouched. */}
          <span aria-hidden className="absolute inset-x-0 bottom-0 h-[74px]" style={{ background: CAPTION }} />

          {(isActualWinner || isPast) && (
            <div className="absolute right-3 top-3 flex flex-col items-end gap-1">
              {isActualWinner && (
                <span className="flex items-center gap-1 rounded bg-amber-300 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-amber-950">
                  <Trophy className="h-2.5 w-2.5" />
                  {isPast ? (lang === 'en' ? 'Won' : 'வெற்றி') : (lang === 'en' ? 'Winner' : 'வெற்றி')}
                </span>
              )}
              {isPast && (
                <span className="flex items-center gap-1 rounded bg-white/90 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-neutral-900">
                  <History className="h-2.5 w-2.5" />
                  2021
                </span>
              )}
            </div>
          )}

          <div className="absolute inset-x-0 bottom-0 flex items-end gap-3 p-3">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-white ring-2 ring-white/90">
              {candidate.photo ? (
                <img
                  src={candidate.photo.replace('images/', '/candidates/')}
                  alt={cleanName}
                  className="h-full w-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                <span
                  className="flex h-full w-full items-center justify-center font-display text-xl font-black"
                  style={{ color: colour }}
                >
                  {cleanName.charAt(0)}
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1 pb-0.5">
              <h3 className={`${nameSize()} font-display font-bold tracking-tight text-white line-clamp-2`}>
                {cleanName}
              </h3>
              {/* Chrome: constituency and party both appear in full in the
                  dossier, so clipping here loses nothing. Marked so the layout
                  audit allows it — see scripts/auditLayout.mjs. */}
              <p data-chrome className="mt-0.5 truncate font-mono text-[10px] uppercase tracking-[0.12em] text-white/75">
                <span title={candidate.party}>{short}</span>
                <span className="px-1 text-white/40">·</span>
                {constituencyClean}
              </p>
            </div>
          </div>
        </div>

        {/* ══ The record ══════════════════════════════════════════════ */}
        <div className="flex flex-1 flex-col gap-2.5 px-4 py-3.5">
          {/* Declared data. `truncate` here hid up to 667px of a candidate's
              stated occupation behind an ellipsis with no way to read it — on a
              site whose purpose is disclosure. Clamped to two lines instead,
              which shows most of it and never silently drops the rest. */}
          <p
            className="text-[11px] leading-snug text-neutral-500 line-clamp-2"
            title={candidate.selfProfession || undefined}
          >
            <span className="tabular-nums">{candidate.age}</span> {t.years}
            {candidate.selfProfession ? ` · ${candidate.selfProfession}` : ''}
          </p>

          <div className="border-t border-neutral-200 pt-2.5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-neutral-500">
                {t.assets}
              </span>
              {/* No truncate and no break-words on a figure: break-words split
                  "₹304.0 Cr" mid-number at 118px, and a declared figure shown
                  wrong is worse than one that wraps. */}
              <span className="shrink-0 font-mono text-[13px] font-semibold tabular-nums text-neutral-900">
                {candidate.assetsFormatted}
              </span>
            </div>

            <div className="mt-1 flex items-baseline justify-between gap-3">
              <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-neutral-500">
                {t.liabilities}
              </span>
              <span className="shrink-0 font-mono text-[13px] font-semibold tabular-nums text-neutral-600">
                {candidate.liabilitiesFormatted}
              </span>
            </div>

            {/* Both figures are named directly above, so the bar never has to
                carry identity by colour alone. */}
            <div
              role="img"
              aria-label={`${t.assets} ${candidate.assetsFormatted}, ${t.liabilities} ${candidate.liabilitiesFormatted}`}
              className="mt-2 flex h-1.5 w-full overflow-hidden rounded-full bg-neutral-200"
            >
              <span className="h-full" style={{ width: `${assetShare}%`, background: ASSET_INK }} />
              {showsBothSegments && (
                <span className="h-full w-0.5 shrink-0" style={{ background: PAPER }} />
              )}
              <span className="h-full" style={{ width: `${liabilityShare}%`, background: LIABILITY_INK }} />
            </div>

            <div className="mt-2 flex items-baseline justify-between gap-3">
              <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-neutral-500">
                {t.netWorth}
              </span>
              {/* FORMAT_NET_WORTH, never netWorthFormatted: the sign is carried
                  separately, and 174 candidates who declared more debt than
                  assets rendered as though they were solvent without it. */}
              <span
                className={`shrink-0 font-display text-lg font-bold tabular-nums ${
                  candidate.netWorthPositive === false ? 'text-rose-700' : 'text-neutral-900'
                }`}
              >
                {FORMAT_NET_WORTH(candidate)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 border-t border-neutral-200 pt-2.5">
            {hasCases ? (
              <AlertCircle className="h-3.5 w-3.5 shrink-0 text-rose-600" />
            ) : (
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-teal-700" />
            )}
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-neutral-500">
              {t.criminalCases}
            </span>
            {/* caseCount is the total declared in the affidavit; the
                pending/convicted split is only known for a small subset, so
                this must not be labelled "Pending". */}
            <span
              className={`ml-auto shrink-0 font-mono text-[12px] font-bold tabular-nums ${
                hasCases ? 'text-rose-700' : 'text-teal-700'
              }`}
            >
              {hasCases
                ? `${candidate.caseCount} ${lang === 'en' ? 'declared' : 'அறிவிக்கப்பட்டது'}`
                : (lang === 'en' ? 'None declared' : 'எதுவும் இல்லை')}
            </span>
          </div>

          <div className="flex items-start gap-2 border-t border-neutral-200 pt-2.5">
            <GraduationCap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400" />
            {/* Declared data. This was the worst offender on the directory:
                1,343px of one candidate's education — two degrees, two
                universities, two years — replaced by an ellipsis. */}
            <span className="min-w-0 text-[11px] leading-snug text-neutral-700 line-clamp-2" title={education}>
              {education}
            </span>
          </div>

          <div className="mt-auto flex items-center justify-between gap-3 border-t border-neutral-200 pt-3">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onAddToCompare(candidate); }}
              className={`font-mono text-[10px] font-bold uppercase tracking-[0.14em] transition-colors ${
                isComparing ? 'text-indigo-700' : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              {isComparing
                ? (lang === 'en' ? 'Selected' : 'தேர்ந்தெடுக்கப்பட்டது')
                : (lang === 'en' ? 'Compare' : 'ஒப்பிடுக')}
            </button>

            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onOpenDetails(candidate); }}
              className="group/btn flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-indigo-700 transition-colors hover:text-indigo-900"
            >
              {lang === 'en' ? 'View record' : 'விவரங்கள்'}
              <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover/btn:translate-x-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
