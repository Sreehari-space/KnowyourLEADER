/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Candidate, FontSizeSetting } from '../types';
import { TRANSLATIONS } from '../data/translations';
import { getIpcDescription, getIpcDetails } from '../data/criminalCodes';
import { X, ShieldCheck, ShieldAlert, FileText, Sparkles, Printer, ArrowRight, Share2, Check, AlertTriangle, Send, Info, User, Landmark, Scale, Briefcase, GraduationCap, Building, Map } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

interface CandidateModalProps {
  candidate: Candidate;
  lang: 'en' | 'ta';
  fontSize: FontSizeSetting;
  onClose: () => void;
}

const formTranslations = {
  en: {
    reportButton: 'Report Discrepancy',
    reportTitle: 'Report Data Discrepancy',
    reportSubtitle: 'Help us maintain the accuracy & integrity of public election data. If you noticed a mismatch from the official ECI Form 26 database, please file a report below.',
    categoryLabel: 'Discrepancy Category',
    catAsset: 'Asset/Investment Value Mismatch',
    catCriminal: 'Criminal Record / Court Case missing or wrong',
    catEduOcc: 'Education Qualifications or Occupation discrepancy',
    catOther: 'Other inaccuracies in metadata',
    detailsLabel: 'Corrected Information & Details',
    detailsPlaceholder: 'Describe the inaccuracy with precise details. Provide correct values if you know them...',
    sourceLabel: 'Verification Source / Evidence URL (Optional)',
    sourcePlaceholder: 'e.g., https://affidavit.eci.gov.in/... or court reference number',
    emailLabel: 'Your Email (Optional, for future updates)',
    emailPlaceholder: 'e.g., citizen@example.com',
    submitBtn: 'Submit Discrepancy Report',
    submitting: 'Submitting Report...',
    cancelBtn: 'Cancel',
    successTitle: 'Report Received!',
    successMessage: 'Thank you for your response. Your report has been stored securely in the app cache for future administrator review verification.',
    errorRequired: 'Please describe the discrepancy details before submitting.',
    errorCategory: 'Please select a valid discrepancy category.'
  },
  ta: {
    reportButton: 'முரண்பாட்டைப் புகார் செய்',
    reportTitle: 'தகவல் முரண்பாடு அறிக்கை',
    reportSubtitle: 'தேர்தல் பற்றிய பொதுத் தகவல்களின் உண்மைத்தன்மை மற்றும் நம்பகத்தன்மையை உறுதி செய்ய உதவுங்கள். இ.சி.ஐ படிவம் 26 முரண்பாடுகளைக் கண்டறிந்தால் கீழே புகாரளிக்கவும்.',
    categoryLabel: 'முரண்பாட்டின் வகை',
    catAsset: 'அசையும்/அசையா சொத்து மற்றும் கடன் விவரங்கள் தவறு',
    catCriminal: 'கிரிமினல் வழக்கு / நீதிமன்ற வழக்கு விவரங்கள் விடுபட்டுள்ளது',
    catEduOcc: 'கல்வித் தகுதி அல்லது தொழில் விவரங்கள் தவறு',
    catOther: 'இதர விவரக் குறிப்பீடுகள் தவறு',
    detailsLabel: 'சரியான தகவல்கள் மற்றும் விளக்கங்கள்',
    detailsPlaceholder: 'உண்மைக்குப் புறம்பான தகவல் யாது என்பதைத் தெளிவான ஆதாரங்களுடன் விளக்கவும்...',
    sourceLabel: 'சரிபார்ப்பு சான்று / இணைய இணைப்பு (விருப்பப்படி)',
    sourcePlaceholder: 'உதாரணமாக, https://affidavit.eci.gov.in/ அல்லது நீதிமன்ற வழக்கு எண்',
    emailLabel: 'தங்கள் மின்னஞ்சல் முகவரி (விருப்பப்படி)',
    emailPlaceholder: 'உதாரணமாக, citizen@example.com',
    submitBtn: 'புகாரை சமர்ப்பி',
    submitting: 'சமர்ப்பிக்கப்படுகிறது...',
    cancelBtn: 'ரத்து செய்',
    successTitle: 'புகார் பெறப்பட்டது!',
    successMessage: 'உங்கள் அறிக்கை வெற்றிகரமாகப் பெறப்பட்டது. எதிர்கால நிர்வாகி ஆய்விற்காக இது உள்ளூர் சேமிப்பகத்தில் பாதுகாப்பாக பதிவேற்றப்பட்டுள்ளது.',
    errorRequired: 'புகார் பற்றிய விளக்கங்களை உள்ளீடு செய்யவும்.',
    errorCategory: 'முரண்பாட்டின் வகையைத் தேர்வு செய்யவும்.'
  }
};

export default function CandidateModal({ candidate, lang, fontSize, onClose }: CandidateModalProps) {
  const t = TRANSLATIONS[lang];
  const [viewMode, setViewMode] = useState<'standard' | 'easy'>('standard');
  const [copied, setCopied] = useState(false);

  const [showReportForm, setShowReportForm] = useState(false);
  const [category, setCategory] = useState('asset');
  const [description, setDescription] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formError, setFormError] = useState('');

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setFormError(formTranslations[lang].errorRequired);
      return;
    }
    
    setIsSubmitting(true);
    setFormError('');

    setTimeout(() => {
      try {
        const existingReportsRaw = localStorage.getItem('candidate_discrepancy_reports');
        const existingReports = existingReportsRaw ? JSON.parse(existingReportsRaw) : [];
        
        const newReport = {
          id: 'rep_' + Math.random().toString(36).substr(2, 9),
          candidateId: candidate.id,
          candidateName: candidate.name,
          category,
          description,
          sourceUrl,
          contactEmail,
          timestamp: new Date().toISOString()
        };
        
        existingReports.push(newReport);
        localStorage.setItem('candidate_discrepancy_reports', JSON.stringify(existingReports));
        
        setIsSubmitting(false);
        setIsSubmitted(true);
      } catch (err) {
        console.error(err);
        setIsSubmitting(false);
        setFormError(lang === 'en' ? 'Failed to save your report. Please try again.' : 'உங்கள் புகாரைச் சேமிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.');
      }
    }, 900);
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/?candidate=${candidate.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  };

  const handlePrint = () => {
    window.print();
  };

  // Convert Easy Read Template Strings dynamically
  const getEasyReadText = () => {
    const rawTemplate = t.easyReadFinancials;
    
    let text = rawTemplate
      .replace('{movable}', candidate.assetsFormatted)
      .replace('{immovable}', '0')
      .replace('{liabilities}', candidate.liabilitiesFormatted)
      .replace('{networth}', candidate.netWorthFormatted);

    return text;
  };

  const extractConstituency = (str: string) => {
    const parts = str.split('(');
    return parts[0]?.trim() || str;
  };

  const extractDistrict = (str: string) => {
    const match = str.match(/\((.*?)\)/);
    return match ? match[1] : '';
  };

  const getPartyBg = (partyName: string) => {
    const p = partyName?.toUpperCase() || '';
    if (p === 'TVK' || p.includes('TAMILAGA VETTRI') || p.includes('VETTRI KAZHAGAM')) return 'bg-violet-600';
    if (p === 'DMK' || p.includes('DRAVIDA MUNNETRA KAZHAGAM')) return 'bg-red-600';
    if (p === 'AIADMK' || p.includes('ALL INDIA ANNA DRAVIDA')) return 'bg-emerald-600';
    if (p === 'BJP' || p.includes('BHARATIYA JANATA')) return 'bg-amber-500';
    if (p === 'NTK' || p.includes('NAAM TAMILAR')) return 'bg-yellow-500';
    if (p === 'INC' || p.includes('INDIAN NATIONAL CONGRESS')) return 'bg-blue-600';
    if (p === 'VCK' || p.includes('VIDUTHALAI CHIRUTHAIGAL')) return 'bg-purple-700';
    if (p === 'PMK' || p.includes('PATTALI MAKKAL')) return 'bg-yellow-600';
    if (p === 'CPI(M)' || p === 'CPIM' || p.includes('COMMUNIST PARTY OF INDIA (MARXIST)')) return 'bg-red-700';
    if (p === 'CPI' || p.includes('COMMUNIST PARTY OF INDIA')) return 'bg-red-800';
    if (p === 'DMDK' || p.includes('DESIYA MURPOKKU')) return 'bg-cyan-700';
    if (p.includes('AMMA MAKKAL')) return 'bg-teal-700';
    if (p === 'IND' || p === 'INDEPENDENT') return 'bg-teal-600';
    return 'bg-neutral-800';
  };

  const formatVehicleData = (rawText?: string) => {
    if (!rawText || rawText.toLowerCase() === 'nil' || rawText === 'Not Applicable') return lang === 'en' ? 'None Declared' : 'ஏதுமில்லை';
    
    let cleaned = rawText.replace(/[A-Z]{2}\s?-?\d{1,2}\s?-?[A-Z]{1,2}\s?-?\d{1,4}/gi, '');
    cleaned = cleaned.replace(/\b[\d,.]+\b/g, '  ');
    cleaned = cleaned.replace(/\b(?:Thou\+|Lacs?\+?|Crores?\+?|Cr|Lakhs?|Lakh|Rs\.?)(?:\s|$)/gi, '  ');
    cleaned = cleaned.replace(/\*?\(?Value Not Given\)?/gi, '  ');
    cleaned = cleaned.replace(/Purchase Date.*?(?=\s|[A-Z]|$)/i, '  ');
    cleaned = cleaned.replace(/Value\s*\d*/gi, '  ');
    
    let vehicles = cleaned.split(/\s{2,}/).map(s => s.replace(/[-*0:;+]+/g, '').trim()).filter(s => s.length > 2);
    
    return vehicles.length > 0 ? vehicles.join(' • ') : (lang === 'en' ? 'None Declared' : 'ஏதுமில்லை');
  };

  const formatLandData = (rawInput?: string | import('../types').AssetOwnership) => {
    if (!rawInput || rawInput === 'Nil') return lang === 'en' ? 'Nil' : 'ஏதுமில்லை';
    
    let rawText = '';
    if (typeof rawInput === 'object') {
       if (rawInput.self && rawInput.self !== 'Nil') rawText += rawInput.self + ' ';
       if (rawInput.spouse && rawInput.spouse !== 'Nil') rawText += rawInput.spouse + ' ';
       if (rawInput.huf && rawInput.huf !== 'Nil') rawText += rawInput.huf + ' ';
       if (rawInput.dependents) {
         rawInput.dependents.forEach(d => { if (d && d !== 'Nil') rawText += d + ' '});
       }
       rawText = rawText.trim();
    } else {
       rawText = rawInput;
    }

    if (!rawText || rawText.toLowerCase() === 'nil') return lang === 'en' ? 'Nil' : 'ஏதுமில்லை';
    const entries = rawText.split(/(?:Thou\+|Lacs\+|Crore\+|Crores\+)/i);
    const parsed = entries.map(entry => {
      if (!entry.trim()) return null;
      const totalAreaMatch = entry.match(/Total Area\s+([^\s]+\s+[a-zA-Z.]+)/i);
      const area = totalAreaMatch ? totalAreaMatch[1] : '';
      let location = entry.split(/Total Area/i)[0].trim();
      
      // Remove leading junk
      location = location.replace(/^\s*[\d,]+\s*/, '').replace(/^[A-Za-z0-9.]+:\s*/, '').trim();
      
      // Strip survey, plot, block, ward numbers
      location = location.replace(/\b(?:S\.?F\.?\s*No\.?|S\.?No\.?|Plot\s*No\.?|Block\s*No\.?|Ward\s*No\.?|TS\s*No\.?|Patta\s*No\.?).*$/i, '');
      
      // Clean up trailing commas, hyphens, and spaces
      location = location.replace(/[,-\s]+$/, '').trim();
      
      if (!location) return null;
      return area ? `${location} (Area: ${area})` : location;
    }).filter(Boolean);
    
    if (parsed.length === 0) return rawText;
    
    return (
      <span className="flex flex-col space-y-1 mt-1">
        {parsed.map((item, index) => (
          <span key={index} className="block leading-snug">
            <span className="font-bold opacity-70 mr-1">{index + 1}.</span>
            {item}
          </span>
        ))}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 md:p-6 overflow-hidden animate-fade-in print:p-0 print:bg-white" id="cand-modal-container">
      <div 
        className="w-full h-full md:max-h-[] max-w-6xl mx-auto bg-white flex flex-col md:flex-row md:rounded-3xl shadow-2xl overflow-y-auto md:overflow-hidden relative print:h-auto print:shadow-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Sticky Header (Hidden on Desktop) */}
        <div className="md:hidden sticky top-0 z-20 bg-neutral-950 text-white p-4 flex justify-between items-center shadow-md">
          <div className="flex items-center space-x-3">
             <div className={`w-10 h-10 rounded-full overflow-hidden flex items-center justify-center text-white font-bold text-lg border border-white/20 ${getPartyBg(candidate.party)}`}>
              {candidate.photo ? (
                 <img src={candidate.photo.replace('images/', '/candidates/')} alt={candidate.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              ) : (
                 candidate.name.charAt(0)
              )}
            </div>
            <div>
              <h2 className="font-display font-bold leading-tight line-clamp-1">{candidate.name}</h2>
              <span className="text-xs text-neutral-400 font-mono tracking-widest uppercase">{candidate.party}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* ================= LEFT SIDEBAR ================= */}
        <div className="w-full md:w-[35%] bg-neutral-950 text-white flex flex-col shrink-0 overflow-visible md:overflow-y-auto print:hidden">
          {/* Cover Photo / Header */}
          <div className="p-8 pb-6 flex-1 flex flex-col items-center text-center">
            
            {/* Desktop Close Button */}
            <div className="w-full hidden md:flex justify-end mb-4">
              <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className={`w-32 h-32 md:w-48 md:h-48 rounded-full overflow-hidden mb-6 flex items-center justify-center text-white font-display font-medium text-6xl shadow-2xl ring-4 ring-white/10 ${getPartyBg(candidate.party)}`}>
              {candidate.photo ? (
                 <img src={candidate.photo.replace('images/', '/candidates/')} alt={candidate.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              ) : (
                 candidate.name.charAt(0)
              )}
            </div>
            
            <div className="inline-flex items-center space-x-2 mb-3">
              <span className={`px-3 py-1 rounded text-xs font-mono font-bold tracking-widest shadow-sm ${getPartyBg(candidate.party)}`}>
                {candidate.party}
              </span>
              <span className="text-xs font-mono text-neutral-500 uppercase tracking-widest">ID: {candidate.id.substring(0,6)}</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight mb-2">
              {candidate.name}
            </h1>
            
            <div className="flex flex-col items-center justify-center space-y-1 mt-2 text-neutral-300">
              <p className="text-sm font-semibold tracking-wide flex items-center">
                <Building className="w-4 h-4 mr-1.5 opacity-70" />
                {extractConstituency(candidate.constituency)}
              </p>
              <p className="text-xs text-neutral-500 uppercase tracking-widest">{extractDistrict(candidate.constituency)}</p>
            </div>

            <div className="w-full h-px bg-white/10 my-8"></div>

            {/* Quick Metadata */}
            <div className="w-full space-y-4 text-left">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-white/5 rounded-lg text-neutral-400 mt-0.5"><User className="w-4 h-4" /></div>
                <div>
                  <p className="text-[10px] text-neutral-500 font-mono uppercase tracking-widest">{lang === 'en' ? 'Age' : 'வயது'}</p>
                  <p className="text-sm font-semibold">{candidate.age} {lang === 'en' ? 'Years' : 'வயது'}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-white/5 rounded-lg text-neutral-400 mt-0.5"><GraduationCap className="w-4 h-4" /></div>
                <div>
                  <p className="text-[10px] text-neutral-500 font-mono uppercase tracking-widest">{t.education}</p>
                  <p className="text-sm font-semibold line-clamp-2" title={candidate.education}>{candidate.education.split('Category: ')[1] || candidate.education}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-white/5 rounded-lg text-neutral-400 mt-0.5"><Briefcase className="w-4 h-4" /></div>
                <div>
                  <p className="text-[10px] text-neutral-500 font-mono uppercase tracking-widest">{t.occupation}</p>
                  <p className="text-sm font-semibold line-clamp-2">{candidate.selfProfession}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons Sticky Bottom */}
          <div className="p-6 pt-4 bg-neutral-900 border-t border-white/5 grid grid-cols-2 gap-3">
            <button 
              onClick={handleShare}
              className={`py-3 rounded-xl transition-all flex justify-center items-center space-x-2 text-xs font-bold border ${
                copied ? 'bg-emerald-600/20 border-emerald-500/30 text-emerald-400' : 'bg-white/5 hover:bg-white/10 border-transparent text-white'
              }`}
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              <span>{copied ? (lang === 'en' ? 'Copied' : 'நகலெடுக்கப்பட்டது') : (lang === 'en' ? 'Share' : 'பகிர்')}</span>
            </button>
            <button 
              onClick={handlePrint}
              className="py-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all flex justify-center items-center space-x-2 text-xs font-bold text-white"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
            <button
              onClick={() => { setShowReportForm(true); setIsSubmitted(false); }}
              className="col-span-2 py-3 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 rounded-xl text-xs font-bold transition-all flex justify-center items-center space-x-2"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>{formTranslations[lang].reportButton}</span>
            </button>
          </div>
        </div>

        {/* ================= RIGHT MAIN CONTENT ================= */}
        <div className="w-full md:w-[65%] flex flex-col bg-slate-50 relative h-auto md:h-full overflow-visible md:overflow-hidden">
          
          {/* Top Actions & Toggle */}
          <div className="absolute top-0 right-0 left-0 p-4 md:p-6 flex justify-between md:justify-end items-center z-10 bg-gradient-to-b from-slate-50 to-transparent pointer-events-none">
            <div className="pointer-events-auto bg-white/80 backdrop-blur-md p-1 rounded-full border border-slate-200 shadow-sm flex items-center ml-auto hidden md:flex">
              <button
                onClick={() => setViewMode('standard')}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center space-x-1.5 ${viewMode === 'standard' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Standard</span>
              </button>
              <button
                onClick={() => setViewMode('easy')}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center space-x-1.5 ${viewMode === 'easy' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Easy Read</span>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-visible md:overflow-y-auto p-4 md:p-8 pt-6 md:pt-20">
            {showReportForm ? (
              /* --- DISCREPANCY FORM --- */
              <div className="max-w-2xl mx-auto space-y-6">
                <button onClick={() => setShowReportForm(false)} className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center space-x-1 mb-6">
                  <ArrowRight className="w-4 h-4 rotate-180" />
                  <span>{lang === 'en' ? 'Back to Dossier' : 'திரும்பிச் செல்'}</span>
                </button>

                {isSubmitted ? (
                  <div className="text-center py-16 px-6 bg-white rounded-3xl border border-emerald-100 shadow-sm space-y-4">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-inner">
                      <ShieldCheck className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-display font-bold text-slate-900">{formTranslations[lang].successTitle}</h3>
                    <p className="text-slate-600 max-w-md mx-auto">{formTranslations[lang].successMessage}</p>
                  </div>
                ) : (
                  <form onSubmit={handleFormSubmit} className="space-y-6 bg-white p-6 md:p-8 rounded-3xl shadow-xs border border-slate-200">
                    <div>
                      <h3 className="text-xl font-display font-bold text-slate-900">{formTranslations[lang].reportTitle}</h3>
                      <p className="text-sm text-slate-500 mt-1">{formTranslations[lang].reportSubtitle}</p>
                    </div>

                    {formError && (
                      <div className="bg-rose-50 border border-rose-100 text-rose-800 p-3.5 rounded-xl text-xs font-bold flex items-center space-x-2">
                        <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>{formError}</span>
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{formTranslations[lang].categoryLabel}</label>
                      <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-base sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-indigo-500">
                        <option value="asset">{formTranslations[lang].catAsset}</option>
                        <option value="criminal">{formTranslations[lang].catCriminal}</option>
                        <option value="education_occupation">{formTranslations[lang].catEduOcc}</option>
                        <option value="other">{formTranslations[lang].catOther}</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex justify-between">
                        <span>{formTranslations[lang].detailsLabel} <span className="text-rose-500">*</span></span>
                        <span className="text-slate-400 font-normal">{description.length} / 1000</span>
                      </label>
                      <textarea
                        rows={4} maxLength={1000} value={description} onChange={(e) => setDescription(e.target.value)}
                        placeholder={formTranslations[lang].detailsPlaceholder}
                        className="w-full bg-slate-50 border border-slate-200 p-4 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 rounded-xl"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{formTranslations[lang].sourceLabel}</label>
                      <input
                        type="text" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)}
                        placeholder={formTranslations[lang].sourcePlaceholder}
                        className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{formTranslations[lang].emailLabel}</label>
                      <input
                        type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)}
                        placeholder={formTranslations[lang].emailPlaceholder}
                        className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="pt-2">
                      <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-sm flex items-center justify-center space-x-2 disabled:opacity-50 transition-colors">
                        {isSubmitting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
                        <span>{isSubmitting ? formTranslations[lang].submitting : formTranslations[lang].submitBtn}</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : viewMode === 'easy' ? (
              /* --- EASY READ MODE --- */
              <div className="max-w-2xl mx-auto space-y-6 mt-4">
                <div className="bg-white border border-indigo-100 p-6 md:p-8 rounded-3xl shadow-xl shadow-indigo-100/20 relative overflow-hidden">
                  <div className="absolute top-0 right-0 -mr-6 -mt-6">
                    <Sparkles className="w-32 h-32 text-indigo-50 opacity-50 rotate-12" />
                  </div>
                  
                  <h3 className="text-2xl font-display font-black text-indigo-950 mb-6 flex items-center space-x-2">
                    <Sparkles className="w-6 h-6 text-indigo-500" />
                    <span>{t.easyReadTitle}</span>
                  </h3>
                  
                  <div className="prose prose-indigo max-w-none prose-p:leading-relaxed text-indigo-900/80 font-medium">
                    <p>{getEasyReadText().replace('{name}', candidate.name)}</p>
                  </div>
                  
                  <div className="mt-6 space-y-4">
                    <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100">
                      <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2 flex items-center space-x-2">
                        <span>🚗</span> <span>{lang === 'en' ? 'Vehicles' : 'மோட்டார் வாகனங்கள்'}</span>
                      </h4>
                      <p className="text-sm text-indigo-900 font-semibold leading-relaxed">{formatVehicleData(candidate.vehicles)}</p>
                    </div>

                    <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100">
                      <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2 flex items-center space-x-2">
                        <Map className="w-3 h-3 text-indigo-500" /> <span>{lang === 'en' ? 'Land & Properties' : 'ரியல் எஸ்டேட்'}</span>
                      </h4>
                      <p className="text-sm text-indigo-900 font-semibold leading-relaxed">
                        {candidate.land ? formatLandData(candidate.land) : (lang === 'en' ? 'Nil' : 'ஏதுமில்லை')}
                      </p>
                    </div>
                    <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100">
                      <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2 flex items-center space-x-2">
                        <span>💎</span> <span>{lang === 'en' ? 'Jewelry & Gold' : 'நகைகள்'}</span>
                      </h4>
                      <p className="text-sm text-indigo-900 font-semibold leading-relaxed">
                        {candidate.jewelry && candidate.jewelry !== 'Nil' ? candidate.jewelry : (lang === 'en' ? 'Nil' : 'ஏதுமில்லை')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-6 relative z-10 mt-6">
                    <p className="text-lg text-slate-800 leading-relaxed font-medium bg-slate-50/80 p-5 rounded-2xl border border-slate-100">
                      {t.easyReadAgeEdu
                        .replace('{name}', candidate.name)
                        .replace('{age}', candidate.age.toString())
                        .replace('{edu}', candidate.education)
                        .replace('{occ}', candidate.selfProfession || '')}
                    </p>

                    <p className={`text-lg leading-relaxed font-bold p-5 rounded-2xl border ${
                      candidate.caseCount === 0 
                        ? 'bg-teal-50 border-teal-100 text-teal-900' 
                        : 'bg-rose-50 border-rose-200 text-rose-900'
                    }`}>
                      {candidate.caseCount === 0 
                        ? t.easyReadNoCases.replace('{name}', candidate.name)
                        : t.easyReadCasesCount
                            .replace('{name}', candidate.name)
                            .replace('{count}', candidate.caseCount.toString())}
                    </p>

                    <p className="text-lg text-slate-800 leading-relaxed font-medium bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100">
                      {getEasyReadText().replace('{name}', candidate.name)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.assets}</span>
                    <p className="text-2xl font-black text-slate-900 font-mono mt-1">{candidate.assetsFormatted}</p>
                  </div>
                  <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.liabilities}</span>
                    <p className="text-2xl font-black text-rose-600 font-mono mt-1">{candidate.liabilitiesFormatted}</p>
                  </div>
                  <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm text-center bg-gradient-to-b from-indigo-50 to-white">
                    <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{t.netWorth}</span>
                    <p className="text-2xl font-black text-indigo-700 font-mono mt-1">{candidate.netWorthFormatted}</p>
                  </div>
                </div>
              </div>
            ) : (
              /* --- STANDARD DOSSIER VIEW --- */
              <div className="max-w-3xl mx-auto space-y-6 md:space-y-8">
                
                {/* Mobile-only toggle */}
                <div className="md:hidden flex justify-center mb-6">
                   <div className="bg-white p-1 rounded-full border border-slate-200 shadow-sm flex items-center w-full">
                    <button onClick={() => setViewMode('standard')} className={`flex-1 py-2 rounded-full text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${(viewMode as string) === 'standard' ? 'bg-slate-900 text-white' : 'text-slate-500'}`}>
                      <FileText className="w-3.5 h-3.5" />
                      <span>Standard</span>
                    </button>
                    <button onClick={() => setViewMode('easy')} className={`flex-1 py-2 rounded-full text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${(viewMode as string) === 'easy' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Easy Read</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <h3 className="text-xl md:text-2xl font-display font-black text-slate-900 tracking-tight flex items-center space-x-2">
                    <Landmark className="w-6 h-6 text-indigo-600" />
                    <span>{lang === 'en' ? 'Financial Dashboard' : 'நிதி நிலைமைகள்'}</span>
                  </h3>
                  <a href={'https://affidavit.eci.gov.in/'} target="_blank" rel="noreferrer" className="hidden sm:flex text-xs font-bold text-indigo-600 hover:text-indigo-800 items-center space-x-1 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">
                    <span>Source: ECI Form 26</span>
                    <ArrowRight className="w-3 h-3" />
                  </a>
                </div>

                {/* Hero Financial Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Total Assets Card */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{lang === 'en' ? 'Total Declared Assets' : 'மொத்த சொத்துக்கள்'}</span>
                    <p className="text-4xl md:text-5xl font-black text-slate-900 font-mono tracking-tighter mt-3 mb-1">
                      {candidate.assetsFormatted}
                    </p>
                  </div>

                  {/* Liabilities Card */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-50 rounded-full opacity-50"></div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest relative z-10">{lang === 'en' ? 'Liabilities & Debts' : 'கடன்கள்'}</span>
                    <p className="text-3xl md:text-4xl font-black text-rose-600 font-mono tracking-tighter mt-3 relative z-10">
                      {candidate.liabilitiesFormatted}
                    </p>
                  </div>
                </div>

                {/* Net Worth Highlight */}
                <div className="bg-indigo-600 rounded-3xl p-6 md:p-8 shadow-xl shadow-indigo-600/20 text-white relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between">
                  <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-indigo-500 to-transparent"></div>
                  <div className="relative z-10">
                    <span className="text-xs font-bold text-indigo-200 uppercase tracking-widest">{lang === 'en' ? 'Calculated Net Worth' : 'நிகர சொத்துக்கள்'}</span>
                    <p className="text-4xl md:text-6xl font-black font-mono tracking-tighter mt-2">{candidate.netWorthFormatted}</p>
                  </div>
                  <div className="relative z-10 mt-4 md:mt-0 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20">
                    <span className="text-xs font-bold font-mono tracking-widest">ASSETS - DEBTS</span>
                  </div>
                </div>

                {/* Additional Asset Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center space-x-1.5">
                      <span>🚗</span> <span>{lang === 'en' ? 'Motor Vehicles' : 'மோட்டார் வாகனங்கள்'}</span>
                    </p>
                    <p className="text-base sm:text-sm font-semibold text-slate-800 leading-snug">{formatVehicleData(candidate.vehicles)}</p>
                  </div>
                  {/* Immovable Assets (Land & Properties) */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                    <div className="flex items-start justify-between">
                      <div className="w-full">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center space-x-2">
                          <Map className="w-4 h-4 text-teal-600" />
                          <span>{lang === 'en' ? 'Real Estate Portfolio' : '\u0bb0\u0bbf\u0baf\u0bb2\u0bcd \u0b8e\u0bb8\u0bcd\u0b9f\u0bc7\u0b9f\u0bcd \u0baa\u0bcb\u0bb0\u0bcd\u0b9f\u0bcd\u0b83\u0baa\u0bcb\u0bb2\u0bbf\u0baf\u0bcb'}</span>
                        </h4>
                        
                        {candidate.immovableAssetsDetails ? (
                          <div className="flex flex-col gap-3">
                            {candidate.immovableAssetsDetails.agricultural && candidate.immovableAssetsDetails.agricultural !== 'Nil' && (
                              <div className="bg-white p-3 rounded-xl border border-teal-100 shadow-sm">
                                <span className="text-[10px] font-bold text-teal-500 uppercase tracking-widest flex items-center mb-1">
                                  🌾 {lang === 'en' ? 'Agricultural Land' : '\u0bb5\u0bbf\u0bb5\u0b9a\u0bbe\u0baf \u0ba8\u0bbf\u0bb2\u0bae\u0bcd'}
                                </span>
                                <p className="text-sm text-teal-800 font-medium leading-relaxed">{formatLandData(candidate.immovableAssetsDetails.agricultural)}</p>
                              </div>
                            )}
                            {candidate.immovableAssetsDetails.nonAgricultural && candidate.immovableAssetsDetails.nonAgricultural !== 'Nil' && (
                              <div className="bg-white p-3 rounded-xl border border-teal-100 shadow-sm">
                                <span className="text-[10px] font-bold text-teal-500 uppercase tracking-widest flex items-center mb-1">
                                  🏗️ {lang === 'en' ? 'Non-Agricultural Land' : '\u0bb5\u0bbf\u0bb5\u0b9a\u0bbe\u0baf\u0bae\u0bcd \u0b85\u0bb2\u0bcd\u0bb2\u0bbe\u0ba4 \u0ba8\u0bbf\u0bb2\u0bae\u0bcd'}
                                </span>
                                <p className="text-sm text-teal-800 font-medium leading-relaxed">{formatLandData(candidate.immovableAssetsDetails.nonAgricultural)}</p>
                              </div>
                            )}
                            {candidate.immovableAssetsDetails.commercial && candidate.immovableAssetsDetails.commercial !== 'Nil' && (
                              <div className="bg-white p-3 rounded-xl border border-teal-100 shadow-sm">
                                <span className="text-[10px] font-bold text-teal-500 uppercase tracking-widest flex items-center mb-1">
                                  🏢 {lang === 'en' ? 'Commercial Buildings' : '\u0bb5\u0ba3\u0bbf\u0b95 \u0b95\u0b9f\u0bcd\u0b9f\u0bbf\u0b9f\u0b99\u0bcd\u0b95\u0bb3\u0bcd'}
                                </span>
                                <p className="text-sm text-teal-800 font-medium leading-relaxed">{formatLandData(candidate.immovableAssetsDetails.commercial)}</p>
                              </div>
                            )}
                            {candidate.immovableAssetsDetails.residential && candidate.immovableAssetsDetails.residential !== 'Nil' && (
                              <div className="bg-white p-3 rounded-xl border border-teal-100 shadow-sm">
                                <span className="text-[10px] font-bold text-teal-500 uppercase tracking-widest flex items-center mb-1">
                                  🏠 {lang === 'en' ? 'Residential Buildings' : '\u0b95\u0bc1\u0b9f\u0bbf\u0baf\u0bbf\u0bb0\u0bc1\u0baa\u0bcd\u0baa\u0bc1 \u0b95\u0b9f\u0bcd\u0b9f\u0bbf\u0b9f\u0b99\u0bcd\u0b95\u0bb3\u0bcd'}
                                </span>
                                <p className="text-sm text-teal-800 font-medium leading-relaxed">{formatLandData(candidate.immovableAssetsDetails.residential)}</p>
                              </div>
                            )}
                            {candidate.immovableAssetsDetails.others && candidate.immovableAssetsDetails.others !== 'Nil' && (
                              <div className="bg-white p-3 rounded-xl border border-teal-100 shadow-sm">
                                <span className="text-[10px] font-bold text-teal-500 uppercase tracking-widest flex items-center mb-1">
                                  📦 {lang === 'en' ? 'Other Assets' : '\u0baa\u0bbf\u0bb1 \u0b9a\u0bca\u0ba4\u0bcd\u0ba4\u0bc1\u0b95\u0bcd\u0b95\u0bb3\u0bcd'}
                                </span>
                                <p className="text-sm text-teal-800 font-medium leading-relaxed">{formatLandData(candidate.immovableAssetsDetails.others)}</p>
                              </div>
                            )}
                            {(!candidate.immovableAssetsDetails.agricultural || candidate.immovableAssetsDetails.agricultural === 'Nil') &&
                             (!candidate.immovableAssetsDetails.nonAgricultural || candidate.immovableAssetsDetails.nonAgricultural === 'Nil') &&
                             (!candidate.immovableAssetsDetails.commercial || candidate.immovableAssetsDetails.commercial === 'Nil') &&
                             (!candidate.immovableAssetsDetails.residential || candidate.immovableAssetsDetails.residential === 'Nil') &&
                             (!candidate.immovableAssetsDetails.others || candidate.immovableAssetsDetails.others === 'Nil') && (
                              <p className="text-sm text-teal-700 italic">{lang === 'en' ? 'Nil' : '\u0b8f\u0ba4\u0bc1\u0bae\u0bbf\u0bb2\u0bcd\u0bb2\u0bc8'}</p>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-teal-700 mt-2 leading-relaxed">
                            {formatLandData(candidate.land)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Jewelry */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs md:col-span-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center space-x-1.5">
                      <span>💎</span> <span>{lang === 'en' ? 'Jewelry & Gold' : '\u0ba8\u0b95\u0bc8\u0b95\u0bb3\u0bcd'}</span>
                    </p>
                    <p className="text-base sm:text-sm font-semibold text-slate-800 leading-snug">
                      {candidate.jewelry && candidate.jewelry !== 'Nil' ? candidate.jewelry : (lang === 'en' ? 'Nil' : 'ஏதுமில்லை')}
                    </p>
                  </div>
                </div>

                {/* Criminal Record */}
                <div className="pt-4">
                  <h3 className="text-xl font-display font-black text-slate-900 tracking-tight flex items-center space-x-2 mb-4">
                    <Scale className="w-5 h-5 text-slate-600" />
                    <span>{t.criminalCases}</span>
                  </h3>

                  {candidate.caseCount === 0 ? (
                    <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-3xl flex items-center space-x-4 shadow-sm">
                      <div className="bg-emerald-100 p-3 rounded-full text-emerald-600 shadow-inner">
                        <ShieldCheck className="w-8 h-8" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-emerald-900">{t.noCasesFound}</h4>
                        <p className="text-sm text-emerald-700/80 mt-1">
                          {lang === 'en' ? 'No pending FIRs or charge-sheets declared in the official ECI affidavit.' : 'நிலுவையில் உள்ள குற்ற வழக்குகள் எதுவும் இல்லை.'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-rose-50 border border-rose-200 p-6 rounded-3xl shadow-sm space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="w-full">
                          <h4 className="text-xl font-bold text-rose-900 flex items-center space-x-2">
                            <AlertTriangle className="w-6 h-6 text-rose-600" />
                            <span>{candidate.caseCount} {lang === 'en' ? 'Declared Cases' : 'நிலுவையில் உள்ள வழக்குகள்'}</span>
                          </h4>
                          <div className="bg-white/60 p-4 rounded-xl border border-rose-100 mt-4 mb-4">
                            <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest block mb-1">
                              {lang === 'en' ? 'Case Summary' : 'வழக்கு சுருக்கம்'}
                            </span>
                            <p className="text-sm text-rose-800 font-medium leading-relaxed">
                              {candidate.caseSummary}
                            </p>
                          </div>

                          {candidate.pendingCasesDetails && candidate.pendingCasesDetails.length > 0 && (
                            <div className="bg-rose-50/50 border border-rose-200 rounded-3xl p-6 shadow-sm mt-6">
                              <div className="flex items-center space-x-2 mb-4">
                                <Scale className="w-5 h-5 text-rose-600" />
                                <h4 className="text-lg font-bold text-rose-900">
                                  {lang === 'en' ? 'Detailed Case & FIR Records' : 'விரிவான வழக்கு பதிவுகள்'}
                                </h4>
                              </div>
                              <div className="space-y-4 max-h-[32rem] overflow-y-auto pr-2 custom-scrollbar">
                                {candidate.pendingCasesDetails.map((pc, idx) => (
                                  <div key={idx} className="bg-white p-5 rounded-2xl border border-rose-200 shadow-sm text-sm flex flex-col space-y-4">
                                    <div className="flex justify-between items-start border-b border-rose-100 pb-3">
                                      <div>
                                        <span className="text-[10px] text-rose-400 font-bold uppercase tracking-widest block">FIR No</span>
                                        <span className="font-semibold text-rose-900 leading-snug">{pc.fir_no || 'N/A'}</span>
                                      </div>
                                      {pc.court && pc.court !== 'Nil' && (
                                        <div className="text-right">
                                          <span className="text-[10px] text-rose-400 font-bold uppercase tracking-widest block">Court / Jurisdiction</span>
                                          <span className="text-[10px] font-mono bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full mt-1 inline-block">{pc.court}</span>
                                        </div>
                                      )}
                                    </div>
                                    
                                    {pc.case_no && pc.case_no !== 'Nil' && (
                                      <div>
                                        <span className="text-[10px] text-rose-400 font-bold uppercase tracking-widest block">Case No</span>
                                        <span className="font-semibold text-rose-900">{pc.case_no}</span>
                                      </div>
                                    )}

                                    {pc.other_details && pc.other_details !== 'Nil' && (
                                      <div>
                                        <span className="text-[10px] text-rose-400 font-bold uppercase tracking-widest block">Additional Details</span>
                                        <span className="font-medium text-rose-800">{pc.other_details}</span>
                                      </div>
                                    )}

                                    <div className="pt-2">
                                      <span className="text-[10px] text-rose-400 font-bold uppercase tracking-widest block mb-2">Detailed Charges (IPC Sections)</span>
                                      <div className="space-y-3">
                                        {pc.ipc_sections ? (Array.isArray(pc.ipc_sections) ? pc.ipc_sections : pc.ipc_sections.split(',').map((code: string) => getIpcDetails(code.trim()) || { section: code.trim() })).map((details: any, i: number) => {
                                          if (!details) return null;
                                          return (
                                            <div key={i} className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                              <div className="flex items-start justify-between">
                                                <h5 className="font-black text-rose-900 text-sm">{details.section || details.act || details.title}</h5>
                                                {details.bailable !== undefined && (
                                                  <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${details.bailable ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                                                    {details.bailable ? 'Bailable' : 'Non-Bailable'}
                                                  </span>
                                                )}
                                              </div>
                                              {details.title && details.section && <p className="text-xs font-bold text-slate-700 mt-1">{details.title}</p>}
                                              <p className="text-xs text-slate-600 mt-2 leading-relaxed">{details.description}</p>
                                              {details.max_punishment && (
                                                <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between">
                                                  <span className="text-[10px] text-slate-500 font-mono">Max Punishment:</span>
                                                  <span className="text-[10px] font-bold text-rose-800 bg-rose-100/50 px-2 py-0.5 rounded">{details.max_punishment}</span>
                                                </div>
                                              )}
                                            </div>
                                          );
                                        }) : <span className="text-xs text-slate-500">Not Specified</span>}
                                      </div>
                                    </div>
                                    
                                    <p className="text-[10px] text-slate-400 italic text-right mt-2">
                                      Raw Reference: {Array.isArray(pc.ipc_sections) ? pc.ipc_sections.map((s: any) => s.section).join(', ') : pc.ipc_sections}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {candidate.caseCategories && candidate.caseCategories.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-rose-200/50">
                          {candidate.caseCategories.map((c, i) => (
                            <span key={i} className="text-xs bg-white text-rose-800 px-3 py-1.5 rounded-full font-bold border border-rose-200 shadow-xs">
                              {c}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Tax History */}
                {((candidate.taxYears && candidate.taxYears.length > 0) || (candidate.taxYearsSpouse && candidate.taxYearsSpouse.length > 0) || (candidate.taxYearsDependent && candidate.taxYearsDependent.length > 0)) && (
                  <div className="pt-4 pb-8">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">
                      {lang === 'en' ? 'Income Tax Filings' : '\u0bb5\u0bb0\u0bc1\u0bae\u0bbe\u0ba9 \u0bb5\u0bb0\u0bbf'}
                    </h3>
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={
                              (candidate.taxYears || []).map((t, i) => {
                                const spouseTax = candidate.taxYearsSpouse?.[i]?.amount || 0;
                                const depTax = candidate.taxYearsDependent?.[i]?.amount || 0;
                                return {
                                  name: t.year,
                                  Self: parseFloat((t.amount / 100000).toFixed(2)),
                                  ...(spouseTax > 0 && { Spouse: parseFloat((spouseTax / 100000).toFixed(2)) }),
                                  ...(depTax > 0 && { Dependent: parseFloat((depTax / 100000).toFixed(2)) })
                                };
                              })
                            }
                            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => `\u20B9${val}L`} />
                            <RechartsTooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }} formatter={(val) => [`\u20B9${val} Lakhs`]} />
                            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                            <Bar dataKey="Self" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={20} />
                            {(candidate.taxYearsSpouse && candidate.taxYearsSpouse.length > 0) && <Bar dataKey="Spouse" fill="#ec4899" radius={[4, 4, 0, 0]} barSize={20} />}
                            {(candidate.taxYearsDependent && candidate.taxYearsDependent.length > 0) && <Bar dataKey="Dependent" fill="#14b8a6" radius={[4, 4, 0, 0]} barSize={20} />}
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )}
                
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
