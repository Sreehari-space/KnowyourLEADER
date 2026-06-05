/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Candidate, FontSizeSetting } from '../types';
import { TRANSLATIONS } from '../data/translations';
import { ShieldCheck, GraduationCap, Landmark, ArrowRight, AlertCircle, Briefcase, MapPin, Scale, Eye, Plus } from 'lucide-react';

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

  // Upgraded Party Styles with richer gradients and softer shadows
  const getPartyStyles = (partyName: string) => {
    const p = partyName?.toUpperCase() || '';
    
    if (p === 'TVK' || p.includes('TAMILAGA VETTRI') || p.includes('VETTRI KAZHAGAM')) {
      return { 
        bg: 'bg-gradient-to-br from-violet-600 via-violet-500 to-purple-600', 
        badge: 'bg-white/90 text-violet-700 shadow-sm ring-1 ring-violet-100', 
        text: 'text-violet-600',
        glow: 'hover:shadow-[0_8px_30px_rgba(124,58,237,0.2)]'
      };
    }
    if (p === 'DMK' || p.includes('DRAVIDA MUNNETRA KAZHAGAM')) {
      return { 
        bg: 'bg-gradient-to-br from-red-600 via-red-500 to-rose-600', 
        badge: 'bg-white/90 text-red-700 shadow-sm ring-1 ring-red-100', 
        text: 'text-red-600',
        glow: 'hover:shadow-[0_8px_30px_rgba(220,38,38,0.2)]'
      };
    }
    if (p === 'AIADMK' || p.includes('ALL INDIA ANNA DRAVIDA')) {
      return { 
        bg: 'bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-600', 
        badge: 'bg-white/90 text-emerald-700 shadow-sm ring-1 ring-emerald-100', 
        text: 'text-emerald-600',
        glow: 'hover:shadow-[0_8px_30px_rgba(5,150,105,0.2)]'
      };
    }
    if (p === 'BJP' || p.includes('BHARATIYA JANATA')) {
      return { 
        bg: 'bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500', 
        badge: 'bg-white/90 text-amber-700 shadow-sm ring-1 ring-amber-100', 
        text: 'text-amber-600',
        glow: 'hover:shadow-[0_8px_30px_rgba(245,158,11,0.2)]'
      };
    }
    if (p === 'NTK' || p.includes('NAAM TAMILAR')) {
      return { 
        bg: 'bg-gradient-to-br from-yellow-500 via-yellow-400 to-amber-500', 
        badge: 'bg-white/90 text-yellow-800 shadow-sm ring-1 ring-yellow-200', 
        text: 'text-yellow-600',
        glow: 'hover:shadow-[0_8px_30px_rgba(234,179,8,0.2)]'
      };
    }
    if (p === 'INC' || p.includes('INDIAN NATIONAL CONGRESS')) {
      return { 
        bg: 'bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600', 
        badge: 'bg-white/90 text-blue-700 shadow-sm ring-1 ring-blue-100', 
        text: 'text-blue-600',
        glow: 'hover:shadow-[0_8px_30px_rgba(37,99,235,0.2)]'
      };
    }
    if (p === 'VCK' || p.includes('VIDUTHALAI CHIRUTHAIGAL')) {
      return { 
        bg: 'bg-gradient-to-br from-purple-700 via-purple-600 to-fuchsia-700', 
        badge: 'bg-white/90 text-purple-800 shadow-sm ring-1 ring-purple-200', 
        text: 'text-purple-700',
        glow: 'hover:shadow-[0_8px_30px_rgba(126,34,206,0.2)]'
      };
    }
    if (p === 'PMK' || p.includes('PATTALI MAKKAL')) {
      return { 
        bg: 'bg-gradient-to-br from-yellow-600 via-amber-600 to-yellow-700', 
        badge: 'bg-white/90 text-yellow-800 shadow-sm ring-1 ring-yellow-200', 
        text: 'text-yellow-700',
        glow: 'hover:shadow-[0_8px_30px_rgba(202,138,4,0.2)]'
      };
    }
    if (p === 'CPI(M)' || p === 'CPIM' || p.includes('COMMUNIST PARTY OF INDIA (MARXIST)')) {
      return { 
        bg: 'bg-gradient-to-br from-red-700 via-red-600 to-rose-700', 
        badge: 'bg-white/90 text-red-800 shadow-sm ring-1 ring-red-200', 
        text: 'text-red-700',
        glow: 'hover:shadow-[0_8px_30px_rgba(185,28,28,0.2)]'
      };
    }
    if (p === 'CPI' || p.includes('COMMUNIST PARTY OF INDIA')) {
      return { 
        bg: 'bg-gradient-to-br from-red-800 via-red-700 to-rose-800', 
        badge: 'bg-white/90 text-red-900 shadow-sm ring-1 ring-red-200', 
        text: 'text-red-800',
        glow: 'hover:shadow-[0_8px_30px_rgba(153,27,27,0.2)]'
      };
    }
    if (p === 'DMDK' || p.includes('DESIYA MURPOKKU')) {
      return { 
        bg: 'bg-gradient-to-br from-cyan-700 via-cyan-600 to-sky-700', 
        badge: 'bg-white/90 text-cyan-800 shadow-sm ring-1 ring-cyan-200', 
        text: 'text-cyan-700',
        glow: 'hover:shadow-[0_8px_30px_rgba(14,116,144,0.2)]'
      };
    }
    if (p.includes('AMMA MAKKAL')) {
      return { 
        bg: 'bg-gradient-to-br from-teal-700 via-teal-600 to-cyan-700', 
        badge: 'bg-white/90 text-teal-800 shadow-sm ring-1 ring-teal-200', 
        text: 'text-teal-700',
        glow: 'hover:shadow-[0_8px_30px_rgba(15,118,110,0.2)]'
      };
    }
    if (p === 'IND' || p === 'INDEPENDENT') {
      return { 
        bg: 'bg-gradient-to-br from-teal-600 via-teal-500 to-cyan-600', 
        badge: 'bg-white/90 text-teal-700 shadow-sm ring-1 ring-teal-100', 
        text: 'text-teal-600',
        glow: 'hover:shadow-[0_8px_30px_rgba(13,148,136,0.2)]'
      };
    }
    
    return { 
      bg: 'bg-gradient-to-br from-slate-600 via-slate-500 to-gray-600', 
      badge: 'bg-white/90 text-slate-700 shadow-sm ring-1 ring-slate-200', 
      text: 'text-slate-600',
      glow: 'hover:shadow-[0_8px_30px_rgba(100,116,139,0.2)]'
    };
  };

  const getPartyColor = (partyName: string): string => {
    const p = partyName?.toUpperCase() || '';
    if (p === 'TVK' || p.includes('TAMILAGA VETTRI') || p.includes('VETTRI KAZHAGAM')) return '#7C3AED';
    if (p === 'DMK' || p.includes('DRAVIDA MUNNETRA KAZHAGAM')) return '#DC2626';
    if (p === 'AIADMK' || p.includes('ALL INDIA ANNA DRAVIDA')) return '#059669';
    if (p === 'BJP' || p.includes('BHARATIYA JANATA')) return '#D97706';
    if (p === 'INC' || p.includes('INDIAN NATIONAL CONGRESS')) return '#2563EB';
    if (p === 'NTK' || p.includes('NAAM TAMILAR')) return '#EAB308';
    if (p === 'VCK' || p.includes('VIDUTHALAI CHIRUTHAIGAL')) return '#7E22CE';
    if (p === 'PMK' || p.includes('PATTALI MAKKAL')) return '#CA8A04';
    if (p === 'CPI(M)' || p === 'CPIM' || p.includes('COMMUNIST PARTY OF INDIA (MARXIST)')) return '#B91C1C';
    if (p === 'CPI' || p.includes('COMMUNIST PARTY OF INDIA')) return '#991B1B';
    if (p === 'DMDK' || p.includes('DESIYA MURPOKKU')) return '#0E7490';
    if (p === 'IND' || p === 'INDEPENDENT') return '#6B7280';
    return '#94A3B8';
  };

  const getPartyFlagUrl = (partyName: string) => {
    const p = partyName?.toUpperCase() || '';
    if (p === 'IND' || p === 'INDEPENDENT') return null;
    
    if (p === 'TVK' || p.includes('TAMILAGA VETTRI') || p.includes('VETTRI KAZHAGAM')) return '/flags/Tamilaga_Vettri_Kazhagam_(TVK)_Flag.png';
    if (p === 'DMK' || p.includes('DRAVIDA MUNNETRA KAZHAGAM')) return '/flags/DMK_Flag.svg';
    if (p === 'AIADMK' || p.includes('ALL INDIA ANNA DRAVIDA')) return '/flags/AIADMK_Flag.svg';
    if (p === 'BJP' || p.includes('BHARATIYA JANATA')) return '/flags/BJP_Flag.svg';
    if (p === 'INC' || p.includes('INDIAN NATIONAL CONGRESS')) return '/flags/Indian_National_Congress_Flag.svg';
    if (p === 'VCK' || p.includes('VIDUTHALAI CHIRUTHAIGAL')) return '/flags/Viduthalai_Chiruthaigal_Katchi_banner.png';
    if (p === 'PMK' || p.includes('PATTALI MAKKAL')) return '/flags/PMK.svg';
    if (p === 'CPI(M)' || p === 'CPIM' || p.includes('COMMUNIST PARTY OF INDIA (MARXIST)')) return '/flags/CPI-M-flag.svg';
    if (p === 'CPI' || p.includes('COMMUNIST PARTY OF INDIA')) return '/flags/CPI-banner.svg';
    if (p === 'DMDK' || p.includes('DESIYA MURPOKKU')) return '/flags/Flag_DMDK.png';
    if (p === 'MDMK' || p.includes('MARUMALARCHI DRAVIDA')) return '/flags/MDMK.svg';
    if (p === 'BSP' || p.includes('BAHUJAN SAMAJ')) return '/flags/BSP_Flag.png';
    if (p.includes('IJK') || p.includes('INDHIYA JANANAYAGA KATCHI')) return '/flags/IJK_Party_Flag.jpg';
    if (p.includes('MANITHANEYA')) return '/flags/Manithaneya_Jananayaga_Katchi_flag.jpg';
    if (p.includes('PUTHIYA TAMILAGAM')) return '/flags/Puthiya_Tamilagam_Party_Flag.jpg';
    if (p.includes('SDPI') || p.includes('SOCIAL DEMOCRATIC')) return '/flags/SDPI_Flag.jpg';
    if (p.includes('MUSLIM LEAGUE')) return '/flags/Flag_of_the_Indian_Union_Muslim_League.svg';
    return null;
  };

  const partyStyle = getPartyStyles(candidate.party);

  const nameSize = () => {
    if (fontSize === 'xlarge') return 'text-2xl leading-tight';
    if (fontSize === 'large') return 'text-xl leading-tight';
    return 'text-xl sm:text-2xl leading-snug';
  };

  const constituencyClean = candidate.constituency.split('(')[0]?.trim() || candidate.constituency;

  return (
    <div className="h-full w-full">
      {/* ================= MOBILE LAYOUT (Compact Horizontal) ================= */}
      <div 
        className={`sm:hidden group relative bg-white rounded-2xl overflow-hidden border border-neutral-100 shadow-sm active:scale-[0.98] transition-all duration-300 flex flex-row cursor-pointer ${partyStyle.glow}`}
        onClick={() => onOpenDetails(candidate)}
      >
        {/* Left Side: Photo & Party Block */}
        <div className="w-[110px] shrink-0 relative overflow-hidden flex flex-col items-center justify-center p-3 bg-white">
          {getPartyFlagUrl(candidate.party) && (
            <img 
              src={getPartyFlagUrl(candidate.party)!}
              alt={candidate.party}
              className="absolute inset-0 w-full h-full object-cover opacity-80 pointer-events-none"
            />
          )}
          <div className={`w-16 h-16 rounded-full overflow-hidden border-[3px] shadow-md relative z-10 flex items-center justify-center text-xl font-bold bg-white ${partyStyle.text}`} style={{ borderColor: getPartyColor(candidate.party) }}>
            {candidate.photo ? (
              <img src={candidate.photo.replace('images/', '/candidates/')} alt={candidate.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            ) : (
              candidate.name.charAt(0)
            )}
          </div>
          <div className="relative z-10 mt-1 px-2 py-0.5 rounded text-[9px] font-black tracking-widest uppercase shadow-sm truncate max-w-full text-center text-white" style={{ backgroundColor: getPartyColor(candidate.party) }}>
            {candidate.party}
          </div>
        </div>

        {/* Right Side: Info & Stats */}
        <div className="flex-1 flex flex-col justify-center p-3.5 bg-gradient-to-r from-white to-neutral-50/50 min-w-0">
          <div className="flex items-center space-x-1 mb-0.5 text-neutral-400">
            <MapPin className="w-2.5 h-2.5 shrink-0" />
            <span className="text-[9px] font-mono font-bold tracking-widest uppercase truncate">
              {constituencyClean}
            </span>
          </div>
          <h3 className="text-sm font-display font-black text-neutral-900 leading-tight truncate mb-1.5">
            {candidate.name}
          </h3>
          
          <div className="flex flex-col space-y-1">
            <div className="flex items-center justify-between bg-neutral-50 rounded-lg p-1 border border-neutral-100">
              <div className="flex items-center space-x-1.5">
                <Landmark className="w-3 h-3 text-emerald-600" />
                <span className="text-[10px] font-mono font-black text-neutral-800 truncate" title={candidate.netWorthFormatted}>
                  {candidate.netWorthFormatted}
                </span>
              </div>
            </div>
            
            <div className={`flex items-center justify-between rounded-lg p-1 border ${candidate.caseCount > 0 ? 'bg-rose-50 border-rose-100' : 'bg-teal-50 border-teal-100'}`}>
              <div className="flex items-center space-x-1.5">
                {candidate.caseCount > 0 ? (
                  <AlertCircle className="w-3 h-3 text-rose-600 shrink-0" />
                ) : (
                  <ShieldCheck className="w-3 h-3 text-teal-600 shrink-0" />
                )}
                <span className={`text-[10px] font-mono font-bold truncate ${candidate.caseCount > 0 ? 'text-rose-700' : 'text-teal-700'}`}>
                  {candidate.caseCount > 0 ? `${candidate.caseCount} ${lang === 'en' ? 'Cases' : 'வழக்கு'}` : (lang === 'en' ? 'Clean' : 'சுத்தம்')}
                </span>
              </div>
            </div>
          </div>
          
          {/* Quick Actions overlay on hover/active */}
          <div className="absolute top-2 right-2 flex space-x-1">
             <button 
                onClick={(e) => { e.stopPropagation(); onAddToCompare(candidate); }}
                className={`w-7 h-7 rounded-full flex items-center justify-center shadow-sm border ${isComparing ? 'bg-neutral-900 text-white border-neutral-900' : 'bg-white text-neutral-400 border-neutral-200 active:bg-neutral-100'}`}
             >
               <Plus className={`w-3.5 h-3.5 ${isComparing ? 'rotate-45' : ''} transition-transform`} />
             </button>
          </div>
        </div>
      </div>


      {/* ================= DESKTOP LAYOUT (Full Vertical Card) ================= */}
      <div 
        className={`hidden sm:flex group relative bg-white rounded-3xl overflow-hidden border border-neutral-100 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:-translate-y-2 transition-all duration-500 flex-col h-full cursor-pointer ${partyStyle.glow}`}
        onClick={() => onOpenDetails(candidate)}
      >
        
        {/* Premium Top Banner with Glass & Gradients */}
        <div className={`h-28 w-full relative overflow-hidden ${partyStyle.bg}`}>
          {getPartyFlagUrl(candidate.party) ? (
            <div 
              className="absolute inset-0 z-0 bg-no-repeat bg-center bg-contain transition-transform duration-700 group-hover:scale-110" 
              style={{ backgroundImage: `url('${getPartyFlagUrl(candidate.party)}')`, opacity: 0.85 }} 
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
        <div className="px-6 flex justify-between items-end -mt-12 relative z-10">
          <div className={`w-24 h-24 rounded-2xl overflow-hidden border-[4px] border-white bg-white shadow-xl flex items-center justify-center text-3xl font-bold ${partyStyle.text} transform transition-transform duration-500 group-hover:scale-105 group-hover:-rotate-2 ring-1 ring-black/5`}>
            {candidate.photo ? (
              <img src={candidate.photo.replace('images/', '/candidates/')} alt={candidate.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            ) : (
              candidate.name.charAt(0)
            )}
          </div>
          
          <div className="flex flex-col items-end space-y-2 mb-2">
            <div className={`px-4 py-1.5 rounded-xl text-xs font-black tracking-widest uppercase backdrop-blur-md ${partyStyle.badge}`}>
              {candidate.party}
            </div>
          </div>
        </div>

        <div className="px-6 pt-5 pb-6 flex-1 flex flex-col relative z-20 bg-gradient-to-b from-white to-neutral-50/50">
          {/* Candidate Identity */}
          <div className="mb-6">
            <div className="flex items-center space-x-1.5 mb-2 text-neutral-400">
              <MapPin className="w-3.5 h-3.5" />
              <span className="text-[11px] font-mono font-bold tracking-widest uppercase truncate max-w-full block">
                {constituencyClean}
              </span>
            </div>
            <h3 className={`${nameSize()} font-display font-black text-neutral-900 tracking-tight group-hover:text-neutral-800 transition-colors line-clamp-2`}>
              {candidate.name}
            </h3>
            <div className="flex items-center space-x-3 mt-2">
              <span className="text-xs font-bold text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-md">
                {candidate.age} {t.years}
              </span>
              {candidate.selfProfession && (
                <div className="flex items-center space-x-1 text-xs font-medium text-neutral-500 truncate">
                  <Briefcase className="w-3 h-3 shrink-0" />
                  <span className="truncate">{candidate.selfProfession}</span>
                </div>
              )}
            </div>
          </div>

          {/* Wealth & Legal Metrics */}
          <div className="grid grid-cols-2 gap-3 mt-auto">
            {/* Net Worth Glass Card */}
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-neutral-100 shadow-[0_2px_10px_rgba(0,0,0,0.01)] group-hover:bg-white group-hover:border-emerald-100 group-hover:shadow-[0_8px_20px_rgba(16,185,129,0.06)] transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-emerald-100/50 to-transparent rounded-bl-full transform translate-x-4 -translate-y-4"></div>
              <div className="flex items-center space-x-2 mb-2 relative z-10">
                <div className="bg-emerald-50 p-1.5 rounded-lg text-emerald-600">
                  <Landmark className="w-3.5 h-3.5" />
                </div>
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{t.netWorth}</span>
              </div>
              <p className="text-[15px] sm:text-base font-black font-mono text-neutral-800 truncate relative z-10" title={candidate.netWorthFormatted}>
                {candidate.netWorthFormatted}
              </p>
            </div>

            {/* Cases Glass Card */}
            <div className={`${candidate.caseCount > 0 ? 'bg-white/60 border-rose-100 group-hover:border-rose-200 group-hover:shadow-[0_8px_20px_rgba(225,29,72,0.06)]' : 'bg-white/60 border-teal-100 group-hover:border-teal-200 group-hover:shadow-[0_8px_20px_rgba(13,148,136,0.06)]'} backdrop-blur-sm rounded-2xl p-4 border shadow-[0_2px_10px_rgba(0,0,0,0.01)] group-hover:bg-white transition-all duration-300 relative overflow-hidden`}>
              <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl ${candidate.caseCount > 0 ? 'from-rose-100/50' : 'from-teal-100/50'} to-transparent rounded-bl-full transform translate-x-4 -translate-y-4`}></div>
              <div className="flex items-center space-x-2 mb-2 relative z-10">
                <div className={`${candidate.caseCount > 0 ? 'bg-rose-50 text-rose-600' : 'bg-teal-50 text-teal-600'} p-1.5 rounded-lg`}>
                  {candidate.caseCount > 0 ? (
                    <AlertCircle className="w-3.5 h-3.5" />
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5" />
                  )}
                </div>
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{t.criminalCases}</span>
              </div>
              <p className={`text-[15px] sm:text-base font-black font-mono relative z-10 ${candidate.caseCount > 0 ? 'text-rose-700' : 'text-teal-700'}`}>
                {candidate.caseCount > 0 ? `${candidate.caseCount} ${lang === 'en' ? 'Pending' : 'நிலுவையில்'}` : (lang === 'en' ? 'Clean Record' : 'சுத்தம்')}
              </p>
            </div>
          </div>

          {/* Education Row */}
          <div className="mt-3 bg-white/60 backdrop-blur-sm rounded-xl p-3.5 border border-neutral-100 flex items-center group-hover:bg-white group-hover:border-indigo-100 transition-all duration-300 shadow-[0_2px_10px_rgba(0,0,0,0.01)]">
            <div className="flex items-center space-x-3 w-full">
              <div className="bg-indigo-50 p-1.5 rounded-lg text-indigo-600 shrink-0">
                <GraduationCap className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-neutral-700 truncate flex-1" title={candidate.education.split('Category: ')[1] || candidate.education}>
                {candidate.education.split('Category: ')[1] || candidate.education}
              </span>
            </div>
          </div>

          {/* Interactive Actions */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button 
              onClick={(e) => { e.stopPropagation(); onAddToCompare(candidate); }}
              className={`py-3.5 rounded-xl text-xs font-bold transition-all duration-300 shadow-sm ${
                isComparing 
                  ? 'bg-neutral-900 text-white ring-2 ring-neutral-900 ring-offset-2' 
                  : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 hover:border-neutral-300 active:scale-95'
              }`}
            >
              {isComparing ? (lang === 'en' ? 'Selected' : 'தேர்ந்தெடுக்கப்பட்டது') : (lang === 'en' ? 'Compare' : 'ஒப்பிடுக')}
            </button>
            
            <button 
              onClick={(e) => { e.stopPropagation(); onOpenDetails(candidate); }}
              className="py-3.5 rounded-xl text-xs font-black transition-all duration-300 bg-neutral-900 text-white hover:bg-neutral-800 hover:shadow-lg hover:shadow-neutral-900/20 flex items-center justify-center space-x-2 group/btn active:scale-95"
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
