/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Candidate, FontSizeSetting } from '../types';
import { TRANSLATIONS } from '../data/translations';
import { FORMAT_CURRENCY } from '../data/candidates';
import { ShieldAlert, Landmark, GraduationCap, Coins, Users, CheckCircle } from 'lucide-react';

interface MetricsDashboardProps {
  candidates: Candidate[];
  lang: 'en' | 'ta';
  fontSize: FontSizeSetting;
}

export default function MetricsDashboard({ candidates, lang, fontSize }: MetricsDashboardProps) {
  const t = TRANSLATIONS[lang];
  const [activeChart, setActiveChart] = useState<'assets' | 'education' | 'cases'>('assets');

  // Calculations
  const totalCount = candidates.length;
  const totalAssetsSum = candidates.reduce((sum, c) => sum + c.netWorth, 0);
  const avgAssets = totalCount > 0 ? totalAssetsSum / totalCount : 0;
  
  const totalCasesSum = candidates.reduce((sum, c) => sum + c.caseCount, 0);
  const avgCases = totalCount > 0 ? Number((totalCasesSum / totalCount).toFixed(1)) : 0;
  
  const crorepatis = candidates.filter(c => c.netWorth >= 10000000).length;
  const cleanRecords = candidates.filter(c => c.caseCount === 0).length;
  const cleanPct = totalCount > 0 ? Math.round((cleanRecords / totalCount) * 100) : 0;

  // Party-wise consolidation
  const partyWiseData: { [key: string]: { assets: number; cases: number; count: number } } = {};
  candidates.forEach(c => {
    if (!partyWiseData[c.party]) {
      partyWiseData[c.party] = { assets: 0, cases: 0, count: 0 };
    }
    partyWiseData[c.party].assets += c.netWorth;
    partyWiseData[c.party].cases += c.caseCount;
    partyWiseData[c.party].count += 1;
  });

  const getEduCategory = (edu: string) => {
    const e = edu.toLowerCase();
    if (e.includes('doctor') || e.includes('phd') || e.includes('ph.d')) return 'Doctorate';
    if (e.includes('post grad') || e.includes('m.a') || e.includes('m.sc') || e.includes('master')) return 'Post Graduate';
    if (e.includes('grad') || e.includes('b.a') || e.includes('b.sc') || e.includes('b.com') || e.includes('b.e')) return 'Graduate';
    if (e.includes('law') || e.includes('prof') || e.includes('llb') || e.includes('md') || e.includes('mbbs')) return 'Professional';
    return 'School';
  };

  const eduCounts: { [key: string]: number } = {
    School: 0,
    Graduate: 0,
    'Post Graduate': 0,
    Professional: 0,
    Doctorate: 0,
  };
  candidates.forEach(c => {
    const cat = getEduCategory(c.education);
    if (eduCounts[cat] !== undefined) {
      eduCounts[cat] += 1;
    }
  });

  // Sorted candidates for Wealth comparison (Top 5)
  const topWealthy = [...candidates]
    .sort((a, b) => b.netWorth - a.netWorth)
    .slice(0, Math.min(5, candidates.length));

  // Party colors matching TN political spectrum
  const getPartyStyles = (partyName: string) => {
    const p = partyName?.toUpperCase() || '';
    
    if (p === 'TVK' || p.includes('TAMILAGA VETTRI') || p.includes('VETTRI KAZHAGAM')) {
      return { bg: 'bg-violet-600', border: 'border-violet-600', text: 'text-violet-600', fill: '#7C3AED' };
    }
    if (p === 'DMK' || p.includes('DRAVIDA MUNNETRA KAZHAGAM')) {
      return { bg: 'bg-red-600', border: 'border-red-600', text: 'text-red-600', fill: '#DC2626' };
    }
    if (p === 'AIADMK' || p.includes('ALL INDIA ANNA DRAVIDA')) {
      return { bg: 'bg-emerald-600', border: 'border-emerald-600', text: 'text-emerald-600', fill: '#059669' };
    }
    if (p === 'BJP' || p.includes('BHARATIYA JANATA')) {
      return { bg: 'bg-amber-600', border: 'border-amber-600', text: 'text-amber-600', fill: '#D97706' };
    }
    if (p === 'NTK' || p.includes('NAAM TAMILAR')) {
      return { bg: 'bg-yellow-500', border: 'border-yellow-500', text: 'text-yellow-600', fill: '#EAB308' };
    }
    if (p === 'INC' || p.includes('INDIAN NATIONAL CONGRESS')) {
      return { bg: 'bg-blue-600', border: 'border-blue-600', text: 'text-blue-600', fill: '#2563EB' };
    }
    if (p === 'VCK' || p.includes('VIDUTHALAI CHIRUTHAIGAL')) {
      return { bg: 'bg-purple-700', border: 'border-purple-700', text: 'text-purple-700', fill: '#7E22CE' };
    }
    if (p === 'PMK' || p.includes('PATTALI MAKKAL')) {
      return { bg: 'bg-yellow-600', border: 'border-yellow-600', text: 'text-yellow-700', fill: '#CA8A04' };
    }
    if (p === 'CPI(M)' || p === 'CPIM' || p.includes('COMMUNIST PARTY OF INDIA (MARXIST)')) {
      return { bg: 'bg-red-700', border: 'border-red-700', text: 'text-red-700', fill: '#B91C1C' };
    }
    if (p === 'CPI' || p.includes('COMMUNIST PARTY OF INDIA')) {
      return { bg: 'bg-red-800', border: 'border-red-800', text: 'text-red-800', fill: '#991B1B' };
    }
    if (p === 'DMDK' || p.includes('DESIYA MURPOKKU')) {
      return { bg: 'bg-cyan-700', border: 'border-cyan-700', text: 'text-cyan-700', fill: '#0E7490' };
    }
    if (p.includes('AMMA MAKKAL')) {
      return { bg: 'bg-teal-700', border: 'border-teal-700', text: 'text-teal-700', fill: '#0D9488' };
    }
    if (p === 'IND' || p === 'INDEPENDENT') {
      return { bg: 'bg-teal-600', border: 'border-teal-600', text: 'text-teal-600', fill: '#0D9488' };
    }
    
    return { bg: 'bg-slate-500', border: 'border-slate-500', text: 'text-slate-500', fill: '#64748B' };
  };

  const textClass = (step: number) => {
    if (fontSize === 'xlarge') return `text-2xl font-bold`;
    if (fontSize === 'large') return `text-xl font-bold`;
    return `text-lg font-bold`;
  };

  const labelClass = () => {
    if (fontSize === 'xlarge') return 'text-lg text-slate-600 font-medium';
    return 'text-sm text-slate-500 font-medium';
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Dynamic Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* KPI 1 */}
        <div className="bg-white border border-slate-200/80 p-5 sm:p-6 rounded-3xl flex items-center space-x-4 shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-all hover:shadow-md hover:border-slate-300">
          <div className="p-3 bg-slate-50 text-slate-800 rounded-2xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className={labelClass()}>{t.totalCandidates}</p>
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight font-sans">
              {totalCount}
            </h3>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white border border-slate-200/80 p-5 sm:p-6 rounded-3xl flex items-center space-x-4 shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-all hover:shadow-md hover:border-slate-300">
          <div className="p-3 bg-slate-50 text-slate-800 rounded-2xl">
            <Landmark className="w-5 h-5" />
          </div>
          <div className="overflow-hidden">
            <p className={labelClass()}>{t.totalAssetsSum}</p>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight font-mono truncate">
              {FORMAT_CURRENCY(totalAssetsSum, lang)}
            </h3>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white border border-slate-200/80 p-5 sm:p-6 rounded-3xl flex items-center space-x-4 shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-all hover:shadow-md hover:border-slate-300">
          <div className="p-3 bg-red-50 text-[#D9383A] rounded-2xl">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <p className={labelClass()}>{t.totalCasesSum}</p>
            <h3 className="text-2xl font-extrabold text-[#D9383A] tracking-tight font-sans">
              {totalCasesSum} <span className="text-xs font-normal text-slate-400">({avgCases} avg)</span>
            </h3>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white border border-slate-200/80 p-5 sm:p-6 rounded-3xl flex items-center space-x-4 shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-all hover:shadow-md hover:border-slate-300">
          <div className="p-3 bg-emerald-50 text-[#0F8A5F] rounded-2xl">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className={labelClass()}>{t.percentClean}</p>
            <h3 className="text-2xl font-extrabold text-[#0F8A5F] tracking-tight font-sans">
              {cleanPct}% <span className="text-xs font-normal text-slate-400">({cleanRecords} cand.)</span>
            </h3>
          </div>
        </div>
      </div>

      {/* Interactive Charts Matrix Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Column */}
        <div className="lg:col-span-3 flex flex-col sm:flex-row lg:flex-col gap-3">
          <button
            onClick={() => setActiveChart('assets')}
            className={`flex-1 text-left px-4 py-3 sm:py-4 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
              activeChart === 'assets'
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center space-x-2 sm:space-x-3 text-xs font-bold font-mono tracking-tight">
              <Coins className="w-4 h-4 shrink-0" />
              <span className="truncate">{lang === 'en' ? 'Wealthiest Candidates' : 'செல்வந்த வேட்பாளர்கள்'}</span>
            </div>
            <span className="hidden sm:inline-block text-[9px] px-1.5 py-0.5 bg-slate-100 text-slate-800 rounded font-mono font-bold ml-2">TOP 5</span>
          </button>

          <button
            onClick={() => setActiveChart('education')}
            className={`flex-1 text-left px-4 py-3 sm:py-4 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
              activeChart === 'education'
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center space-x-2 sm:space-x-3 text-xs font-bold font-mono tracking-tight">
              <GraduationCap className="w-4 h-4 shrink-0" />
              <span className="truncate">{t.filterEducation}</span>
            </div>
          </button>

          <button
            onClick={() => setActiveChart('cases')}
            className={`flex-1 text-left px-4 py-3 sm:py-4 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
              activeChart === 'cases'
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center space-x-2 sm:space-x-3 text-xs font-bold font-mono tracking-tight">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span className="truncate">{lang === 'en' ? 'Cases by Party' : 'கட்சி வாரியாக வழக்குகள்'}</span>
            </div>
          </button>

          <div className="hidden lg:block bg-slate-50 border border-slate-200/60 p-5 rounded-2xl mt-4">
            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-mono">
              {lang === 'en' ? 'Civic Responsibility' : 'குடிமைப் பொறுப்பு'}
            </h5>
            <p className="text-xs text-slate-500 leading-normal font-sans">
              {lang === 'en' 
                ? 'This portal aggregates values declared directly in the Form 26 affidavits submitted to the Election Commission of India.' 
                : 'இந்த போர்டல் இந்திய தேர்தல் ஆணையத்திடம் தாக்கல் செய்த வாக்குமூலங்களில் உள்ள தகவல்களின் அடிப்படையில் தொகுக்கப்பட்டுள்ளது.'}
            </p>
          </div>
        </div>

        {/* Dynamic Display SVG Panel */}
        <div className="lg:col-span-9 bg-white border border-slate-200/80 p-4 sm:p-6 rounded-2xl shadow-sm min-h-[380px] flex flex-col justify-between">
          <div>
            <h4 className="text-base sm:text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-5 sm:mb-6">
              {activeChart === 'assets' && (lang === 'en' ? 'Asset Declared Value Comparison (Highest Net Worth)' : 'சொத்து பிரகடன மதிப்பு ஒப்பீடு (அதிக நிகர மதிப்பு)')}
              {activeChart === 'education' && (lang === 'en' ? 'Education Background Stats' : 'கல்வி பின்னணி புள்ளிவிவரங்கள்')}
              {activeChart === 'cases' && (lang === 'en' ? 'Overall Sum of Judicial Criminal Cases by Party' : 'கட்சி வாரியாக நீதிமன்ற கிரிமினல் வழக்குகள்')}
            </h4>
          </div>

          <div className="flex-1 flex flex-col justify-center w-full">
            {/* Asset Horizontal Interactive SVG Chart */}
            {activeChart === 'assets' && (
              <div className="space-y-4 sm:space-y-4">
                {topWealthy.map((cand, idx) => {
                  const maxNetWorth = topWealthy[0]?.netWorth || 1;
                  const percent = Math.max(12, (cand.netWorth / maxNetWorth) * 100);
                  const styles = getPartyStyles(cand.party);
                  
                  return (
                    <div key={cand.id} className="group flex flex-col sm:flex-row sm:items-center space-y-1.5 sm:space-y-0 sm:space-x-4">
                      {/* Name Label */}
                      <div className="w-full sm:w-48 text-sm font-semibold text-slate-800 truncate">
                        {idx + 1}. {cand.name} 
                        <span className="ml-1.5 text-xs text-slate-400">({cand.party})</span>
                      </div>
                      
                      {/* SVG representation bar */}
                      <div className="w-full sm:flex-1 bg-slate-50 h-8 rounded-lg relative overflow-hidden flex items-center border border-slate-100/50">
                        <div 
                          className={`h-full transition-all duration-700 shadow-sm flex items-center px-3 ${styles.bg}`}
                          style={{ width: `${percent}%` }}
                        >
                          {/* Inner Bar Label (inside if space permits, or above) */}
                          {percent > 35 && (
                            <span className="text-white text-[10px] sm:text-xs font-bold font-mono truncate">
                              {FORMAT_CURRENCY(cand.netWorth, lang)}
                            </span>
                          )}
                        </div>
                        {percent <= 35 && (
                          <span className="absolute left-3 text-slate-700 text-[10px] sm:text-xs font-bold font-mono pl-2 truncate" style={{ left: `${percent}%` }}>
                            {FORMAT_CURRENCY(cand.netWorth, lang)}
                          </span>
                        )}
                      </div>

                      {/* Constituency Tag */}
                      <div className="hidden md:block w-36 text-right text-xs font-medium text-slate-400 font-mono truncate">
                        {cand.constituency.split('(')[0]?.trim() || cand.constituency}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Education Donut Grid Bar */}
            {activeChart === 'education' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
                {Object.keys(eduCounts).map((eduCat) => {
                  const count = eduCounts[eduCat];
                  const percentage = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
                  
                  return (
                    <div 
                      key={eduCat} 
                      className="bg-slate-50/50 p-3 sm:p-4 rounded-xl border border-slate-100 flex flex-col items-center justify-center text-center hover:border-slate-200 hover:bg-slate-50/80 transition-all"
                    >
                      <GraduationCap className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-500 mb-2" />
                      <span className="text-xl sm:text-2xl font-black text-slate-800 font-sans">{count}</span>
                      <span className="text-[10px] sm:text-xs text-slate-400 font-semibold uppercase mt-1">
                        {eduCat === 'School' && (lang === 'en' ? 'Schooling' : 'பள்ளிக்கல்வி')}
                        {eduCat === 'Graduate' && (lang === 'en' ? 'Graduate' : 'பட்டதாரி')}
                        {eduCat === 'Post Graduate' && (lang === 'en' ? 'Post Graduate' : 'முதுகலை')}
                        {eduCat === 'Professional' && (lang === 'en' ? 'Law/Prof' : 'சட்டம்')}
                        {eduCat === 'Doctorate' && (lang === 'en' ? 'Doctorate' : 'முனைவர்')}
                      </span>
                      <span className="text-[10px] sm:text-xs font-mono font-bold text-indigo-600 mt-2 bg-indigo-50/50 px-2 py-0.5 rounded-full">
                        {percentage}%
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Parties Case count custom bar */}
            {activeChart === 'cases' && (
              <div className="space-y-4">
                {Object.keys(partyWiseData).map((party) => {
                  const data = partyWiseData[party];
                  const maxCases = Math.max(...Object.values(partyWiseData).map(d => d.cases)) || 1;
                  const ratio = Math.max(15, (data.cases / maxCases) * 100);
                  const styles = getPartyStyles(party);

                  return (
                    <div key={party} className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4">
                      {/* Party tag */}
                      <div className="w-full sm:w-24 text-sm font-bold text-slate-800">{party}</div>
                      
                      {/* Bar indicator */}
                      <div className="w-full sm:flex-1 bg-slate-50 h-8 rounded-lg relative overflow-hidden flex items-center border border-slate-100/50">
                        <div 
                          className={`h-full transition-all duration-700 flex items-center px-3 ${data.cases > 0 ? styles.bg : 'bg-slate-200'}`}
                          style={{ width: `${ratio}%` }}
                        >
                          {ratio > 30 && (
                            <span className="text-white text-[10px] sm:text-xs font-bold truncate">
                              {data.cases} {lang === 'en' ? 'Cases' : 'வழக்குகள்'} ({data.count} {lang === 'en' ? 'cand.' : 'வேட்பாளர்'})
                            </span>
                          )}
                        </div>
                        {ratio <= 30 && (
                          <span className="absolute left-3 text-slate-700 text-[10px] sm:text-xs font-bold pl-2 truncate" style={{ left: `${ratio}%` }}>
                            {data.cases} {lang === 'en' ? 'Cases' : 'வழக்குகள்'} ({data.count} {lang === 'en' ? 'cand.' : 'வேட்பாளர்'})
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 pt-4 mt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs text-slate-400 space-y-2 sm:space-y-0">
            <span>{t.sourceECI}</span>
            <span>2026 Tamil Nadu Legislative Assembly Elections</span>
          </div>
        </div>
      </div>
    </div>
  );
}
