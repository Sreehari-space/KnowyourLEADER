/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Candidate, FontSizeSetting } from '../types';
import { TRANSLATIONS } from '../data/translations';
import { X, ShieldCheck, ShieldAlert, FileText, Sparkles, Printer, ArrowRight, Share2, Check, AlertTriangle, Send, Info } from 'lucide-react';

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
          description: description,
          sourceUrl: sourceUrl,
          contactEmail: contactEmail,
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

  // Font sizing styles
  const getContainerTextClass = () => {
    if (fontSize === 'xlarge') return 'text-xl leading-relaxed';
    if (fontSize === 'large') return 'text-lg leading-relaxed';
    return 'text-sm leading-normal';
  };

  const getHeadingClass = (level: 1 | 2 | 3) => {
    if (level === 1) {
      if (fontSize === 'xlarge') return 'text-3xl font-black text-slate-900';
      if (fontSize === 'large') return 'text-2xl font-bold text-slate-900';
      return 'text-xl font-bold text-slate-900';
    }
    if (level === 2) {
      if (fontSize === 'xlarge') return 'text-2xl font-bold text-slate-800';
      return 'text-lg font-bold text-slate-800';
    }
    if (fontSize === 'xlarge') return 'text-xl font-bold text-slate-700';
    return 'text-base font-semibold text-slate-700';
  };

  const handlePrint = () => {
    window.print();
  };

  // Convert Easy Read Template Strings dynamically
  const getEasyReadText = () => {
    const rawTemplate = t.easyReadFinancials;
    
    // Replace properties
    let text = rawTemplate
      .replace('{movable}', candidate.assetsFormatted) // We don't have movable/immovable split anymore
      .replace('{immovable}', '0')
      .replace('{liabilities}', candidate.liabilitiesFormatted)
      .replace('{networth}', candidate.netWorthFormatted);

    // Append vehicle and land summary if available
    const extraInfo = [];
    if (candidate.vehicles && candidate.vehicles !== 'Nil') extraInfo.push(`Vehicles: ${candidate.vehicles}`);
    if (candidate.land && candidate.land !== 'Nil') extraInfo.push(`Land: ${candidate.land}`);
    
    if (extraInfo.length > 0) {
      text += ` (${extraInfo.join('. ')})`;
    }

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

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in unique-candidate-modal" id="cand-modal-container">
      <div 
        className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[] border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Block with Candidate Brand Colors */}
        <div className="bg-neutral-950 text-white p-6 relative flex flex-col md:flex-row justify-between md:items-center space-y-4 md:space-y-0">
          <div className="flex items-center space-x-6">
            {/* Modal Avatar */}
            <div className={`hidden sm:flex shrink-0 w-20 h-20 rounded-full overflow-hidden items-center justify-center text-white font-display font-medium text-4xl shadow-xs ring-4 ring-white/10 ${getPartyBg(candidate.party)}`}>
              {candidate.photo ? (
                 <img src={candidate.photo.replace('images/', '/candidates/')} alt={candidate.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              ) : (
                 candidate.name.charAt(0)
              )}
            </div>
            
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-neutral-300 text-[10px] uppercase font-mono tracking-widest font-bold px-3 py-1 bg-white/10 rounded border border-white/10">
                  {candidate.party}
                </span>
                <span className="text-neutral-500 font-mono text-[10px] tracking-widest uppercase">ID: {candidate.id.substring(0,8)}</span>
              </div>
              <h2 className={`${getHeadingClass(1)} font-display tracking-tight text-white`} style={{ color: 'white' }}>
                {candidate.name}
              </h2>
              <p className="text-neutral-400 text-xs font-mono tracking-tight mt-1">
                {t.constituency}: <span className="text-white font-bold">{extractConstituency(candidate.constituency)}</span> &middot; {t.district}: <span className="text-white font-bold">{extractDistrict(candidate.constituency)}</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Share candidate button */}
            <button 
              onClick={handleShare}
              className={`p-2.5 rounded-xl transition-all flex items-center space-x-2 text-xs font-bold cursor-pointer border ${
                copied 
                  ? 'bg-emerald-600/30 border-emerald-500/20 text-emerald-300' 
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/5'
              }`}
              title={lang === 'en' ? 'Copy Shareable Profile Link' : 'பகிர்வதற்கான இணைப்பை நகலெடு'}
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400 animate-pulse" /> : <Share2 className="w-4 h-4" />}
              <span>
                {copied 
                  ? (lang === 'en' ? 'Copied!' : 'நகலெடுக்கப்பட்டது!') 
                  : (lang === 'en' ? 'Share' : 'பகிர்')}
              </span>
            </button>

            {/* Print Friendly button */}
            <button 
              onClick={handlePrint}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all flex items-center space-x-2 text-xs font-bold border border-white/5 cursor-pointer"
              title="Print Affidavit Sheet"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print</span>
            </button>

            {/* Close Button */}
            <button 
              onClick={onClose}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all cursor-pointer border border-white/5"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* View Mode Accessibility Toggle Block */}
        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200/80 flex items-center justify-between">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {lang === 'en' ? 'Accessibility View Mode' : 'அணுகல் பார்வை முறை'}
          </p>

          <div className="bg-slate-200/60 p-1 rounded-xl flex space-x-1.5 border border-slate-200">
            <button
              onClick={() => setViewMode('standard')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center space-x-1.5 cursor-pointer ${
                viewMode === 'standard'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{t.easyReadStandardView}</span>
            </button>

            <button
              onClick={() => setViewMode('easy')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center space-x-1.5 cursor-pointer ${
                viewMode === 'easy'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t.easyReadToggleOn}</span>
            </button>
          </div>
        </div>

        {/* Scrollable Content Pane */}
        <div className={`p-6 overflow-y-auto flex-1 bg-slate-50/50 ${getContainerTextClass()}`}>
          {showReportForm ? (
            /* DISCREPANCY REPORT FORM MODULE */
            <div className="space-y-6 max-w-2xl mx-auto animate-fade-in py-2">
              {isSubmitted ? (
                /* SUCCESS FLOW */
                <div className="text-center py-12 px-6 bg-emerald-50/50 rounded-3xl border border-emerald-100/85 space-y-4 shadow-xs">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                    <ShieldCheck className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-bold font-display text-emerald-950">
                    {formTranslations[lang].successTitle}
                  </h3>
                  <p className="text-sm text-emerald-800/95 leading-relaxed max-w-md mx-auto">
                    {formTranslations[lang].successMessage}
                  </p>
                  <div className="pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowReportForm(false);
                        setIsSubmitted(false);
                      }}
                      className="py-2.5 px-6 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                    >
                      {lang === 'en' ? 'Return to Candidate Profile' : 'சுயவிவரப் பக்கத்திற்குத் திரும்புக'}
                    </button>
                  </div>
                </div>
              ) : (
                /* FORM FILL FLOW */
                <form onSubmit={handleFormSubmit} className="space-y-5">
                  <div className="bg-amber-50/60 border border-amber-200/60 p-4 rounded-2xl flex items-start space-x-3 text-amber-900">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-xs uppercase font-mono tracking-wider text-amber-950">
                        {formTranslations[lang].reportTitle}
                      </h4>
                      <p className="text-xs text-amber-900/80 leading-relaxed mt-1">
                        {formTranslations[lang].reportSubtitle}
                      </p>
                    </div>
                  </div>

                  {formError && (
                    <div className="bg-rose-50 border border-rose-100 text-rose-800 p-3.5 rounded-xl text-xs font-bold flex items-center space-x-2">
                      <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  {/* Discrepancy Category select box */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
                      {formTranslations[lang].categoryLabel} <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {[
                        { id: 'asset', label: formTranslations[lang].catAsset },
                        { id: 'criminal', label: formTranslations[lang].catCriminal },
                        { id: 'education_occupation', label: formTranslations[lang].catEduOcc },
                        { id: 'other', label: formTranslations[lang].catOther },
                      ].map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setCategory(cat.id)}
                          className={`p-3.5 rounded-xl text-left text-xs font-semibold cursor-pointer border transition-all ${
                            category === cat.id
                              ? 'bg-indigo-50 border-indigo-500 text-indigo-900 shadow-xs'
                              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name="category"
                              checked={category === cat.id}
                              onChange={() => {}} 
                              className="accent-indigo-600 cursor-pointer text-xs"
                            />
                            <span>{cat.label}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Details Section */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono flex justify-between">
                      <span>{formTranslations[lang].detailsLabel} <span className="text-rose-500">*</span></span>
                      <span className="text-[10px] text-slate-400 font-normal normal-case">
                        {description.length} / 1000
                      </span>
                    </label>
                    <textarea
                      rows={4}
                      maxLength={1000}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder={formTranslations[lang].detailsPlaceholder}
                      className="w-full bg-white border border-slate-200 p-4 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 transition-all rounded-2xl shadow-xs"
                    />
                  </div>

                  {/* Web Source proof */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center space-x-1">
                      <Info className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formTranslations[lang].sourceLabel}</span>
                    </label>
                    <input
                      type="text"
                      value={sourceUrl}
                      onChange={(e) => setSourceUrl(e.target.value)}
                      placeholder={formTranslations[lang].sourcePlaceholder}
                      className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 transition-all shadow-xs"
                    />
                  </div>

                  {/* Reporter Contact email */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
                      {formTranslations[lang].emailLabel}
                    </label>
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder={formTranslations[lang].emailPlaceholder}
                      className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 transition-all shadow-xs"
                    />
                  </div>

                  {/* Form actions row */}
                  <div className="flex items-center space-x-3 pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="py-3 px-6 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-2 shadow-sm disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>{formTranslations[lang].submitting}</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>{formTranslations[lang].submitBtn}</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowReportForm(false)}
                      className="py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      {formTranslations[lang].cancelBtn}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : viewMode === 'easy' ? (
            /* CONVERSATIONAL ACCESSIBLE EASY READ MODE */
            <div className="space-y-6 max-w-3xl mx-auto animate-fade-in">
              <div className="bg-indigo-50/50 border border-indigo-100 p-6 rounded-3xl relative overflow-hidden">
                <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-5 pointer-events-none">
                  <Sparkles className="w-48 h-48 text-indigo-600" />
                </div>
                
                <h3 className="text-lg font-extrabold text-indigo-800 mb-2 flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-indigo-500 animate-spin-slow" />
                  <span>{t.easyReadTitle}</span>
                </h3>
                <p className="text-sm font-semibold text-indigo-600/80 mb-4">{t.easyReadIntro}</p>

                {/* Substantially larger, simplified paragraph explanations */}
                <div className="space-y-5 text-slate-800">
                  <p className="font-medium bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex items-start space-x-3">
                    <span className="p-1 bg-slate-100 rounded text-slate-500 font-bold">1</span>
                    <span>
                      {t.easyReadAgeEdu
                        .replace('{name}', candidate.name)
                        .replace('{age}', candidate.age.toString())
                        .replace('{edu}', candidate.education)
                        .replace('{occ}', candidate.selfProfession || '')}
                    </span>
                  </p>

                  <p className={`p-4 rounded-xl border shadow-xs flex items-start space-x-3 ${
                    candidate.caseCount === 0 
                      ? 'bg-teal-50 border-teal-100 text-teal-800' 
                      : 'bg-rose-50 border-rose-100 text-rose-800'
                  }`}>
                    <span className="p-1 bg-black/5 rounded font-bold">2</span>
                    {candidate.caseCount === 0 ? (
                      <span className="font-semibold">{t.easyReadNoCases.replace('{name}', candidate.name)}</span>
                    ) : (
                      <span className="font-semibold">
                        {t.easyReadCasesCount
                          .replace('{name}', candidate.name)
                          .replace('{count}', candidate.caseCount.toString())}
                      </span>
                    )}
                  </p>

                  <p className="font-medium bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex items-start space-x-3">
                    <span className="p-1 bg-slate-100 rounded text-slate-500 font-bold">3</span>
                    <span>{getEasyReadText().replace('{name}', candidate.name)}</span>
                  </p>
                </div>
              </div>

              {/* High Contrast visual grid breakdown inside Easy read mode */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200 p-5 rounded-2xl text-center shadow-xs">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">{t.assets}</span>
                  <p className="text-2xl font-black text-emerald-600 font-mono">
                    {candidate.assetsFormatted}
                  </p>
                </div>

                <div className="bg-white border border-slate-200 p-5 rounded-2xl text-center shadow-xs">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">{t.liabilities}</span>
                  <p className="text-2xl font-black text-red-600 font-mono">
                    {candidate.liabilitiesFormatted}
                  </p>
                </div>

                <div className="bg-white border border-slate-200 p-5 rounded-2xl text-center shadow-xs">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">{t.netWorth}</span>
                  <p className="text-2xl font-black text-indigo-600 font-mono">
                    {candidate.netWorthFormatted}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* DETAILED LEDGER STANDARD VIEW */
            <div className="space-y-6">
              {/* Profile Bio segment */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">{lang === 'en' ? 'Candidate Age' : 'வேட்பாளர் வயது'}</span>
                  <p className="text-base font-bold text-slate-800">{candidate.age} {lang === 'en' ? 'Years' : 'வயது'}</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">{t.education}</span>
                  <p className="text-base font-bold text-slate-800 md:truncate" title={candidate.education}>
                    {candidate.education.split('Category: ')[1] || candidate.education}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">{t.occupation}</span>
                  <p className="text-base font-bold text-slate-800 md:truncate">
                    {candidate.selfProfession}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">{lang === 'en' ? 'Affidavit Source' : 'அத்தாட்சி மூலம்'}</span>
                  <a 
                    href={'https://affidavit.eci.gov.in/'} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-indigo-600 text-sm font-bold flex items-center space-x-1 hover:underline mt-1 cursor-pointer"
                  >
                    <span>Election Comm.</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Detailed Financial Ledger Section */}
              <div className="space-y-3">
                <h3 className={getHeadingClass(2)}>{lang === 'en' ? 'Financials' : 'நிதி நிலைமைகள்'}</h3>
                
                <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600 text-xs font-bold border-b border-slate-200">
                        <th className="p-4">{lang === 'en' ? 'Category / Details' : 'பிரிவு / விவரங்கள்'}</th>
                        <th className="p-4 text-right font-mono">{lang === 'en' ? 'Declared Value' : 'அறிவிக்கப்பட்ட மதிப்பு'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {/* Asset Section */}
                      <tr>
                        <td className="p-4 pl-8 text-slate-600">{lang === 'en' ? 'Total Assets' : 'மொத்த சொத்துக்கள்'}</td>
                        <td className="p-4 text-right font-mono font-medium">{candidate.assetsFormatted}</td>
                      </tr>
                      {/* Vehicle Section */}
                      <tr>
                        <td className="p-4 pl-8 text-slate-600 border-t border-slate-100">{lang === 'en' ? '↳ Motor Vehicles' : '↳ மோட்டார் வாகனங்கள்'}</td>
                        <td className="p-4 text-right font-mono text-xs border-t border-slate-100 max-w-[200px] truncate" title={candidate.vehicles || 'Nil'}>{candidate.vehicles || 'Nil'}</td>
                      </tr>
                      {/* Land Section */}
                      <tr>
                        <td className="p-4 pl-8 text-slate-600 border-t border-slate-100">{lang === 'en' ? '↳ Land & Properties' : '↳ நிலம் மற்றும் சொத்துகள்'}</td>
                        <td className="p-4 text-right font-mono text-xs border-t border-slate-100 max-w-[200px] truncate" title={candidate.land || 'Nil'}>{candidate.land || 'Nil'}</td>
                      </tr>
                      {/* Liabilities Section */}
                      <tr>
                        <td className="p-4 pl-8 text-slate-600">{lang === 'en' ? 'Total Liabilities & Debts' : 'மொத்த கடன்கள்'}</td>
                        <td className="p-4 text-right font-mono font-semibold text-rose-600">{candidate.liabilitiesFormatted}</td>
                      </tr>
                      {/* Total Highlights */}
                      <tr className="bg-slate-100 font-extrabold text-slate-950 border-t border-slate-200">
                        <td className="p-4">{t.netWorth} ({lang === 'en' ? 'Net Assets - Liabilities' : 'நிகர சொத்துக்கள் - கடன்கள்'})</td>
                        <td className="p-4 text-right font-mono text-emerald-600 text-base">{candidate.netWorthFormatted}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tax Years */}
              {candidate.taxYears && candidate.taxYears.length > 0 && (
                <div className="space-y-3">
                  <h3 className={getHeadingClass(2)}>{lang === 'en' ? 'Tax History' : 'வரி வரலாறு'}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {candidate.taxYears.map((tax, idx) => (
                       <div key={idx} className="bg-white border border-slate-200 p-3 rounded-xl text-center shadow-xs">
                          <span className="text-xs font-bold text-slate-500 mb-1 block">{tax.year}</span>
                          <span className="font-mono text-slate-800 font-bold">₹{(tax.amount / 100000).toFixed(2)}L</span>
                       </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Criminal Case Register Sheet if any exist */}
              <div className="space-y-3">
                <h3 className={getHeadingClass(3)}>
                  {t.criminalCases} ({candidate.caseCount})
                </h3>

                {candidate.caseCount === 0 ? (
                  <div className="bg-teal-50 border border-teal-100 p-5 rounded-2xl flex items-center space-x-3 text-teal-800">
                    <ShieldCheck className="w-6 h-6 text-teal-500 shrink-0" />
                    <div>
                      <h4 className="font-bold text-teal-900">{t.noCasesFound}</h4>
                      <p className="text-xs text-teal-700/80 mt-1">
                        {lang === 'en'
                          ? 'No pending first information reports or charge-sheets listed in Form 26.'
                          : 'பிரமாணப் பத்திரத்தின்படி நிலுவையில் குற்ற வழக்குகள் எதுவும் பதிவு செய்யப்படவில்லை.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-rose-50/50 border border-rose-100 p-5 rounded-2xl shadow-xs space-y-3">
                     <p className="text-sm font-bold text-rose-800">
                        {candidate.caseSummary}
                     </p>
                     {candidate.caseCategories && candidate.caseCategories.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                           {candidate.caseCategories.map((c, i) => (
                              <span key={i} className="text-xs bg-rose-100 text-rose-800 px-2 py-1 rounded-full font-bold border border-rose-200">
                                {c}
                              </span>
                           ))}
                        </div>
                     )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="bg-white border-t border-slate-200 p-4 flex justify-between items-center">
          <div>
            {!showReportForm ? (
              <button
                type="button"
                onClick={() => {
                  setShowReportForm(true);
                  setIsSubmitted(false);
                  setFormError('');
                  setDescription('');
                  setSourceUrl('');
                }}
                className="py-2.5 px-4 bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-700 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{formTranslations[lang].reportButton}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowReportForm(false)}
                className="py-2.5 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs"
              >
                <span>&larr; {lang === 'en' ? 'Back to Details' : 'விவரங்களுக்குத் திரும்பவும்'}</span>
              </button>
            )}
          </div>
          
          <button 
            onClick={onClose}
            className="py-2.5 px-6 bg-slate-900 border border-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
          >
            {t.closeBtn}
          </button>
        </div>
      </div>
    </div>
  );
}
