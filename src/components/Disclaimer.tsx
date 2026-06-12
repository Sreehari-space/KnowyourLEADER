/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { LanguageSetting } from '../types';
import { ShieldCheck, ArrowRight, Scale, Bot, FileText } from 'lucide-react';

interface DisclaimerProps {
  lang: LanguageSetting;
  onAccept: () => void;
}

export default function Disclaimer({ lang, onAccept }: DisclaimerProps) {
  const [isAccepted, setIsAccepted] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Check if user has already accepted the disclaimer
    const hasAccepted = localStorage.getItem('tn_election_disclaimer_accepted');
    if (hasAccepted === 'true') {
      onAccept();
    }
  }, [onAccept]);

  const handleAccept = () => {
    setIsFadingOut(true);
    localStorage.setItem('tn_election_disclaimer_accepted', 'true');
    // Allow animation to play out before notifying parent
    setTimeout(() => {
      onAccept();
    }, 400);
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/90 backdrop-blur-md transition-opacity duration-400 ${isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      <div className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl border border-neutral-200 animate-fade-in relative max-h-[] flex flex-col">
        <div className="bg-indigo-600 h-2 w-full shrink-0"></div>
        
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto custom-scrollbar">
          <div className="flex items-center space-x-4 shrink-0">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold font-display text-neutral-900 tracking-tight">
                {lang === 'en' ? 'Welcome to TN Leaders' : 'TN Leaders-க்கு வரவேற்கிறோம்'}
              </h2>
              <p className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest mt-0.5">
                {lang === 'en' ? 'Civic Transparency Portal' : 'குடிமை வெளிப்படைத்தன்மை தளம்'}
              </p>
            </div>
          </div>
          
          <div className="space-y-3 text-neutral-600 text-sm leading-relaxed">
            <p className="pb-1 text-xs sm:text-sm">
              {lang === 'en' 
                ? 'Please review the scope of data provided on this platform:' 
                : 'இந்த தளத்தில் வழங்கப்படும் தரவுகளின் வரம்புகளை மதிப்பாய்வு செய்யவும்:'}
            </p>
            
            <div className="space-y-2">
              {/* Point 1 */}
              <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3 flex items-start space-x-3">
                <div className="bg-white p-1.5 rounded-lg border border-slate-100 shadow-sm shrink-0">
                  <FileText className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-xs sm:text-sm mb-0.5">
                    {lang === 'en' ? '1. Unverified Data' : '1. சரிபார்க்கப்படாத தரவு'}
                  </h4>
                  <p className="text-slate-600 text-[11px] sm:text-xs leading-snug">
                    {lang === 'en'
                      ? 'Financial & criminal records are aggregated from ECI Form 26 and not independently verified.'
                      : 'தேர்தல் ஆணையத்தின் படிவம் 26 இலிருந்து நேரடியாகத் தொகுக்கப்பட்டவை. நாங்கள் இவற்றை சரிபார்க்கவில்லை.'}
                  </p>
                </div>
              </div>

              {/* Point 2 */}
              <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3 flex items-start space-x-3">
                <div className="bg-white p-1.5 rounded-lg border border-slate-100 shadow-sm shrink-0">
                  <Bot className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-xs sm:text-sm mb-0.5">
                    {lang === 'en' ? '2. AI News Summaries' : '2. AI செய்திகள்'}
                  </h4>
                  <p className="text-slate-600 text-[11px] sm:text-xs leading-snug">
                    {lang === 'en'
                      ? '"MLA Watch" uses AI which may occasionally misinterpret context. Verify with original sources.'
                      : '"எம்எல்ஏ கண்காணிப்பு" பகுதி AI-ஐ பயன்படுத்துகிறது. தவறுகள் நேரிடலாம், அசல் செய்திகளை சரிபார்க்கவும்.'}
                  </p>
                </div>
              </div>

              {/* Point 3 */}
              <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3 flex items-start space-x-3">
                <div className="bg-white p-1.5 rounded-lg border border-slate-100 shadow-sm shrink-0">
                  <Scale className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-xs sm:text-sm mb-0.5">
                    {lang === 'en' ? '3. No Liability' : '3. பொறுப்பு துறப்பு'}
                  </h4>
                  <p className="text-slate-600 text-[11px] sm:text-xs leading-snug">
                    {lang === 'en'
                      ? 'This is a non-partisan civic tool. We hold no liability for errors or actions taken based on this data.'
                      : 'இது ஒரு சார்பற்ற தளம். இதில் உள்ள பிழைகளுக்கோ அல்லது இதன் அடிப்படையில் எடுக்கப்படும் முடிவுகளுக்கோ நாங்கள் பொறுப்பேற்க மாட்டோம்.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Sticky Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
          <button
            onClick={handleAccept}
            className="bg-neutral-900 text-white hover:bg-neutral-800 transition-colors px-6 py-2.5 rounded-xl font-bold flex items-center space-x-2 text-sm active:scale-95 shadow-sm"
          >
            <span>{lang === 'en' ? 'I Understand & Accept' : 'நான் புரிந்துகொண்டு ஏற்கிறேன்'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
