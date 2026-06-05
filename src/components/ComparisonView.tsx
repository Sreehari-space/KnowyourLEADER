/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Candidate, FontSizeSetting } from '../types';
import { TRANSLATIONS } from '../data/translations';
import { FORMAT_CURRENCY } from '../data/candidates';
import { ShieldAlert, ShieldCheck, Landmark, GraduationCap, Briefcase, Plus, TrendingDown, TrendingUp, Users } from 'lucide-react';

interface ComparisonViewProps {
  candidates: Candidate[];
  lang: 'en' | 'ta';
  fontSize: FontSizeSetting;
  selectedLeftId: string;
  selectedRightId: string;
  onChangeLeft: (id: string) => void;
  onChangeRight: (id: string) => void;
}

export default function ComparisonView({
  candidates,
  lang,
  fontSize,
  selectedLeftId,
  selectedRightId,
  onChangeLeft,
  onChangeRight
}: ComparisonViewProps) {
  const t = TRANSLATIONS[lang];

  const candA = candidates.find(c => c.id === selectedLeftId) || candidates[0];
  const candB = candidates.find(c => c.id === selectedRightId) || candidates[1];

  const netWorthDiff = Math.abs((candA?.netWorth || 0) - (candB?.netWorth || 0));
  const criminalCasesDiff = Math.abs((candA?.caseCount || 0) - (candB?.caseCount || 0));

  const valSize = () => {
    if (fontSize === 'xlarge') return 'text-xl font-bold font-mono';
    return 'text-sm font-bold font-mono';
  };

  const sectionHeadingClass = () => {
    if (fontSize === 'xlarge') return 'text-xl font-black text-slate-800';
    return 'text-sm font-bold text-slate-500 uppercase tracking-widest';
  };

  const extractConstituency = (str: string) => {
    return str.split('(')[0]?.trim() || str;
  };

  return (
    <div className="space-y-8 animate-fade-in unique-comparison-view">
      {/* Search selection block */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm">
        {/* Candidate Selector A */}
        <div className="space-y-2">
          <label className="text-xs font-extrabold text-slate-400 uppercase tracking-widest block">
            {t.selectLeft}
          </label>
          <select
            value={selectedLeftId}
            onChange={(e) => onChangeLeft(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-slate-800 font-semibold focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
          >
            {candidates.map(c => (
              <option key={c.id} value={c.id} disabled={c.id === selectedRightId}>
                {c.name} ({c.party} - {extractConstituency(c.constituency)})
              </option>
            ))}
          </select>
        </div>

        {/* Candidate Selector B */}
        <div className="space-y-2">
          <label className="text-xs font-extrabold text-slate-400 uppercase tracking-widest block">
            {t.selectRight}
          </label>
          <select
            value={selectedRightId}
            onChange={(e) => onChangeRight(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-slate-800 font-semibold focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
          >
            {candidates.map(c => (
              <option key={c.id} value={c.id} disabled={c.id === selectedLeftId}>
                {c.name} ({c.party} - {extractConstituency(c.constituency)})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Side-by-Side Comparison Information Grid */}
      {candA && candB ? (
        <div className="space-y-6">
          {/* Difference Summary Alert Boxes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Wealth Comparison Difference Box */}
            <div className="bg-emerald-50/50 border border-emerald-100 p-5 rounded-2xl flex items-center space-x-3.5">
              <Landmark className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="text-xs font-bold text-emerald-800/60 uppercase tracking-wider block mb-0.5">
                  {lang === 'en' ? 'Wealth Advantage' : 'நிதி நிலை ஒப்பீடு'}
                </span>
                <p className="text-sm font-extrabold text-emerald-950">
                  {candA.netWorth > candB.netWorth
                    ? t.moreWealth.replace('{name}', candA.name).replace('{diff}', FORMAT_CURRENCY(netWorthDiff, lang))
                    : candB.netWorth > candA.netWorth
                    ? t.moreWealth.replace('{name}', candB.name).replace('{diff}', FORMAT_CURRENCY(netWorthDiff, lang))
                    : t.equalRich}
                </p>
              </div>
            </div>

            {/* Cases Comparison Difference Box */}
            <div className={`p-5 rounded-2xl flex items-center space-x-3.5 border ${
              criminalCasesDiff > 0 ? 'bg-rose-50/50 border-rose-100' : 'bg-slate-50/50 border-slate-200'
            }`}>
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <span className="text-xs font-bold text-rose-800/60 uppercase tracking-widest block mb-0.5">
                  {lang === 'en' ? 'Judicial Contrast' : 'நீதிமன்ற வழக்கு முரண்பாடு'}
                </span>
                <p className="text-sm font-extrabold text-slate-800">
                  {candA.caseCount > candB.caseCount
                    ? t.moreCases.replace('{name}', candA.name).replace('{diff}', criminalCasesDiff.toString())
                    : candB.caseCount > candA.caseCount
                    ? t.moreCases.replace('{name}', candB.name).replace('{diff}', criminalCasesDiff.toString())
                    : t.equalCases}
                </p>
              </div>
            </div>
          </div>

          {/* Matrix Ledger */}
          <div className="bg-white border border-neutral-200/80 rounded-3xl overflow-hidden shadow-xs">
            <div className="grid grid-cols-3 bg-neutral-50/50 border-b border-neutral-200/80 p-4 font-bold text-xs text-neutral-500 uppercase tracking-widest items-center">
              <div>{t.comparativeAnalysis}</div>
              <div className="text-center flex flex-col items-center space-y-3">
                <div className={`w-12 h-12 rounded-full flex overflow-hidden shrink-0 items-center justify-center text-white font-display font-medium text-xl shadow-xs ring-2 ring-white/10 ${
                  candA.party === 'DMK' ? 'bg-red-600' :
                  candA.party === 'AIADMK' ? 'bg-emerald-600' :
                  candA.party === 'BJP' ? 'bg-amber-500' :
                  candA.party === 'NTK' ? 'bg-yellow-500' :
                  candA.party === 'INC' ? 'bg-blue-600' :
                  candA.party === 'IND' ? 'bg-teal-600' : 'bg-neutral-800'
                }`}>
                  {candA.photo ? (
                    <img src={candA.photo.replace('images/', '/candidates/')} alt={candA.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    candA.name.charAt(0)
                  )}
                </div>
                <span className="font-display font-black text-neutral-900">{candA.name}</span>
              </div>
              <div className="text-center flex flex-col items-center space-y-3">
                <div className={`w-12 h-12 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-white font-display font-medium text-xl shadow-xs ring-2 ring-white/10 ${
                  candB.party === 'DMK' ? 'bg-red-600' :
                  candB.party === 'AIADMK' ? 'bg-emerald-600' :
                  candB.party === 'BJP' ? 'bg-amber-500' :
                  candB.party === 'NTK' ? 'bg-yellow-500' :
                  candB.party === 'INC' ? 'bg-blue-600' :
                  candB.party === 'IND' ? 'bg-teal-600' : 'bg-neutral-800'
                }`}>
                  {candB.photo ? (
                    <img src={candB.photo.replace('images/', '/candidates/')} alt={candB.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    candB.name.charAt(0)
                  )}
                </div>
                <span className="font-display font-black text-neutral-900">{candB.name}</span>
              </div>
            </div>

            <div className="divide-y divide-neutral-100 text-sm">
              {/* Category Header Profile */}
              <div className="bg-slate-50/30 p-3 font-bold text-slate-800">
                <span className={sectionHeadingClass()}>{lang === 'en' ? '1. General Bio' : '1. பொது விவரங்கள்'}</span>
              </div>

              {/* Party comparison */}
              <div className="grid grid-cols-3 p-4 items-center">
                <span className="font-bold text-slate-500">{t.party}</span>
                <div className="text-center">
                  <span className="bg-slate-100 font-extrabold text-slate-800 text-xs px-2.5 py-1 rounded-md border border-slate-200 uppercase">
                    {candA.party}
                  </span>
                </div>
                <div className="text-center">
                  <span className="bg-slate-100 font-extrabold text-slate-800 text-xs px-2.5 py-1 rounded-md border border-slate-200 uppercase">
                    {candB.party}
                  </span>
                </div>
              </div>

              {/* Constituency comparison */}
              <div className="grid grid-cols-3 p-4 items-center">
                <span className="font-bold text-slate-500">{t.constituency}</span>
                <div className="text-center font-semibold text-slate-800">{extractConstituency(candA.constituency)}</div>
                <div className="text-center font-semibold text-slate-800">{extractConstituency(candB.constituency)}</div>
              </div>

              {/* Age comparison */}
              <div className="grid grid-cols-3 p-4 items-center">
                <span className="font-bold text-slate-500">{t.age}</span>
                <div className="text-center font-bold text-slate-800">{candA.age} {lang === 'en' ? 'Years' : 'வயது'}</div>
                <div className="text-center font-bold text-slate-800">{candB.age} {lang === 'en' ? 'Years' : 'வயது'}</div>
              </div>

              {/* Education Categorized comparison */}
              <div className="grid grid-cols-3 p-4 items-center">
                <span className="font-bold text-slate-500">{t.education}</span>
                <div className="text-center text-slate-700 font-semibold">{candA.education.split('Category: ')[1] || candA.education}</div>
                <div className="text-center text-slate-700 font-semibold">{candB.education.split('Category: ')[1] || candB.education}</div>
              </div>

              {/* Occupation comparison */}
              <div className="grid grid-cols-3 p-4 items-center">
                <span className="font-bold text-slate-500">{t.occupation}</span>
                <div className="text-center text-slate-700 font-semibold">{candA.selfProfession}</div>
                <div className="text-center text-slate-700 font-semibold">{candB.selfProfession}</div>
              </div>

              {/* Category Header Finances */}
              <div className="bg-slate-50/30 p-3 font-bold text-slate-800">
                <span className={sectionHeadingClass()}>{lang === 'en' ? '2. Declared Financial Profiles' : '2. பொருளாதார பிரகடனம்'}</span>
              </div>

              {/* Assets comparison */}
              <div className="grid grid-cols-3 p-4 items-center">
                <span className="font-bold text-slate-500">{lang === 'en' ? 'Total Assets' : 'மொத்த சொத்துக்கள்'}</span>
                <div className="text-center font-semibold text-slate-700 font-mono">
                  {candA.assetsFormatted}
                </div>
                <div className="text-center font-semibold text-slate-700 font-mono">
                  {candB.assetsFormatted}
                </div>
              </div>

              {/* Declared Debts comparison */}
              <div className="grid grid-cols-3 p-4 items-center">
                <span className="font-bold text-slate-500">{t.liabilities}</span>
                <div className="text-center font-semibold text-rose-600 font-mono">
                  {candA.liabilitiesFormatted}
                </div>
                <div className="text-center font-semibold text-rose-600 font-mono">
                  {candB.liabilitiesFormatted}
                </div>
              </div>

              {/* Clean Net Worth comparison */}
              <div className="grid grid-cols-3 p-4 items-center bg-emerald-50/10">
                <span className="font-extrabold text-slate-900">{t.netWorth}</span>
                <div className="text-center font-black text-emerald-600 font-mono text-[15px]">
                  {candA.netWorthFormatted}
                </div>
                <div className="text-center font-black text-emerald-600 font-mono text-[15px]">
                  {candB.netWorthFormatted}
                </div>
              </div>

              {/* Category Header Legal/Criminal Profiles */}
              <div className="bg-slate-50/30 p-3 font-bold text-slate-800">
                <span className={sectionHeadingClass()}>{lang === 'en' ? '3. Judicial / Legal Declarations' : '3. வழக்கு விவரங்கள் ஒப்பீடு'}</span>
              </div>

              {/* Cases listed comparison */}
              <div className="grid grid-cols-3 p-4 items-center">
                <span className="font-bold text-slate-500">{lang === 'en' ? 'Pending Court Cases' : 'நிலுவையில் உள்ள வழக்கு எண்'}</span>
                <div className="text-center">
                  {candA.caseCount > 0 ? (
                    <span className="text-xs bg-rose-50 border border-rose-200 text-rose-800 px-3 py-1 font-black rounded-full font-sans">
                      {candA.caseCount} {lang === 'en' ? 'Cases Declared' : 'வழக்குகள்'}
                    </span>
                  ) : (
                    <span className="text-xs bg-teal-50 border border-teal-200 text-teal-800 px-3 py-1 font-black rounded-full font-sans flex items-center justify-center space-x-1 max-w-[120px] mx-auto">
                      <ShieldCheck className="w-3.5 h-3.5 text-teal-500" />
                      <span>{lang === 'en' ? 'Clean' : 'சுத்தம்'}</span>
                    </span>
                  )}
                </div>
                <div className="text-center">
                  {candB.caseCount > 0 ? (
                    <span className="text-xs bg-rose-50 border border-rose-200 text-rose-800 px-3 py-1 font-black rounded-full font-sans">
                      {candB.caseCount} {lang === 'en' ? 'Cases Declared' : 'வழக்குகள்'}
                    </span>
                  ) : (
                    <span className="text-xs bg-teal-50 border border-teal-200 text-teal-800 px-3 py-1 font-black rounded-full font-sans flex items-center justify-center space-x-1 max-w-[120px] mx-auto">
                      <ShieldCheck className="w-3.5 h-3.5 text-teal-500" />
                      <span>{lang === 'en' ? 'Clean' : 'சுத்தம்'}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 py-12 rounded-3xl text-center space-y-2 text-slate-400">
          <Users className="w-12 h-12 mx-auto stroke-slate-300" />
          <p className="font-bold">{lang === 'en' ? 'Choose candidates' : 'வேட்பாளர்களைத் தேர்ந்தெடுக்கவும்'}</p>
        </div>
      )}
    </div>
  );
}
