/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * CandidateCard — one candidate's sworn Form 26 declaration, as a filed record.
 *
 * The card is laid out as a document rather than a profile: a record line, an
 * identity block, then the declaration itself set as a small ruled table. That
 * is what this card is, and it is why the type does the work here while the
 * decoration stays out of the way.
 *
 * The party is a spine, not a banner
 * ----------------------------------
 * A 64px flag banner was the tallest thing on a card carrying six facts, and it
 * told a reader nothing they could use. The party is now a 4px stripe down the
 * left edge, taken from the same registry colour the map uses — which costs no
 * height and colour-codes a whole directory page at a glance.
 *
 * Assets and liabilities, not just net worth
 * -------------------------------------------
 * 1,242 of 1,799 candidates (69%) declare liabilities, at a median of 22% of
 * their assets. Showing net worth alone made ₹100 Cr owing ₹95 Cr look exactly
 * like ₹100 Cr owing nothing. The bar shows the two against each other, so the
 * shape of a declaration is visible and not only its total.
 */

import React from 'react';
import { Candidate, FontSizeSetting } from '../types';
import { FORMAT_NET_WORTH } from '../data/candidates';
import { TRANSLATIONS } from '../data/translations';
import { partyColour, partyShort } from '../data/parties';
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

export default function CandidateCard({
  candidate,
  lang,
  fontSize,
  onOpenDetails,
  onAddToCompare,
  isComparing,
}: CandidateCardProps) {
  const t = TRANSLATIONS[lang];

  /**
   * Party colour, from the one registry entry — the same hex the map fills
   * with, so a party cannot be one colour here and another there.
   *
   * It is used for the spine only. Registry colours run from near-black to
   * amber, and amber text on this ground sits near 3:1, so the party never
   * carries text: the badge is ink and the colour stays a graphic.
   */
  const colour = partyColour(candidate.party);

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
   * run out of its track. Candidates who declare nothing at all give a total of
   * zero, so the shares stay at zero and the track renders empty.
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
        className="@container group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-[#FCFBF8] shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-[0_10px_30px_rgba(15,23,42,0.09)]"
        onClick={() => onOpenDetails(candidate)}
      >
        {/* The party, as a spine. */}
        <span aria-hidden className="absolute inset-y-0 left-0 w-1" style={{ background: colour }} />

        <div className="flex flex-1 flex-col gap-3 py-4 pl-5 pr-4">
          {/* ── Record line ─────────────────────────────────────────── */}
          {/* Chrome: constituency and party both appear in full in the
              dossier, so clipping the label here loses nothing. Marked so the
              layout audit allows it — see scripts/auditLayout.mjs. */}
          <div className="flex items-center justify-between gap-2">
            <span
              data-chrome
              className="truncate font-mono text-[10px] uppercase tracking-[0.14em] text-neutral-500"
            >
              {constituencyClean}
            </span>
            <span
              data-chrome
              title={candidate.party}
              className="shrink-0 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-neutral-700"
            >
              {partyShort(candidate.party)}
            </span>
          </div>

          {/* ── Identity ────────────────────────────────────────────── */}
          <div className="flex items-start gap-3">
            <div className="h-[52px] w-[52px] shrink-0 overflow-hidden rounded-lg bg-white ring-1 ring-neutral-200">
              {candidate.photo ? (
                <img
                  src={candidate.photo.replace('images/', '/candidates/')}
                  alt={cleanName}
                  className="h-full w-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                <span
                  className="flex h-full w-full items-center justify-center font-display text-xl font-bold"
                  style={{ color: colour }}
                >
                  {cleanName.charAt(0)}
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h3 className={`${nameSize()} font-display font-bold tracking-tight text-neutral-900 line-clamp-2`}>
                {cleanName}
              </h3>
              {/* Declared data. `truncate` here hid up to 667px of a
                  candidate's stated occupation behind an ellipsis with no way
                  to read it — on a site whose purpose is disclosure. Clamped
                  to two lines instead, which shows most of it and never
                  silently drops the rest. */}
              <p
                className="mt-0.5 text-[11px] leading-snug text-neutral-500 line-clamp-2"
                title={candidate.selfProfession || undefined}
              >
                <span className="tabular-nums">{candidate.age}</span> {t.years}
                {candidate.selfProfession ? ` · ${candidate.selfProfession}` : ''}
              </p>
            </div>

            {(isActualWinner || isPast) && (
              <div className="flex shrink-0 flex-col items-end gap-1">
                {isActualWinner && (
                  <span className="flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-amber-900">
                    <Trophy className="h-2.5 w-2.5" />
                    {isPast ? (lang === 'en' ? 'Won' : 'வெற்றி') : (lang === 'en' ? 'Winner' : 'வெற்றி')}
                  </span>
                )}
                {isPast && (
                  <span className="flex items-center gap-1 rounded bg-neutral-200 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-neutral-700">
                    <History className="h-2.5 w-2.5" />
                    2021
                  </span>
                )}
              </div>
            )}
          </div>

          {/* ── The declaration ─────────────────────────────────────── */}
          <div className="mt-auto border-t border-neutral-200 pt-3">
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

            <div className="mt-2.5 flex items-baseline justify-between gap-3">
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

          {/* ── Declared cases ──────────────────────────────────────── */}
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

          {/* ── Education ───────────────────────────────────────────── */}
          <div className="flex items-start gap-2 border-t border-neutral-200 pt-2.5">
            <GraduationCap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400" />
            {/* Declared data. This was the worst offender on the directory:
                1,343px of one candidate's education — two degrees, two
                universities, two years — replaced by an ellipsis. */}
            <span className="min-w-0 text-[11px] leading-snug text-neutral-700 line-clamp-2" title={education}>
              {education}
            </span>
          </div>

          {/* ── Actions ─────────────────────────────────────────────── */}
          <div className="flex items-center justify-between gap-3 border-t border-neutral-200 pt-3">
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
