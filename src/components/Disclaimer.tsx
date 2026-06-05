/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { LanguageSetting } from '../types';
import { AlertTriangle, ShieldCheck, ArrowRight } from 'lucide-react';

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
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-neutral-200 animate-fade-in relative">
        <div className="bg-indigo-600 h-2 w-full"></div>
        <div className="p-8 sm:p-10 space-y-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-display text-neutral-900 tracking-tight">
                {lang === 'en' ? 'Welcome to KnowyourLeader' : 'KnowyourLeader-க்கு வரவேற்கிறோம்'}
              </h2>
              <p className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-widest mt-1">
                {lang === 'en' ? 'Civic Transparency Portal' : 'குடிமை வெளிப்படைத்தன்மை தளம்'}
              </p>
            </div>
          </div>
          
          <div className="space-y-4 text-neutral-600 text-sm sm:text-base leading-relaxed">
            <p>
              {lang === 'en' 
                ? 'This platform is designed to provide transparent, publicly available data regarding candidates contesting in the 2026 Tamil Nadu Legislative Assembly Elections.' 
                : 'இந்த தளம் 2026 தமிழ்நாடு சட்டமன்றத் தேர்தலில் போட்டியிடும் வேட்பாளர்கள் தொடர்பான வெளிப்படையான, பொதுத் தரவுகளை வழங்குவதற்காக வடிவமைக்கப்பட்டுள்ளது.'}
            </p>
            
            <div className="bg-amber-50 border border-amber-200/60 rounded-2xl p-5 flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-2">
                <h4 className="font-bold text-amber-900 text-sm">
                  {lang === 'en' ? 'Data Source & Disclaimer' : 'தரவு ஆதாரம் & மறுப்பு'}
                </h4>
                <p className="text-amber-800/80 text-xs sm:text-sm">
                  {lang === 'en'
                    ? 'All information presented is aggregated directly from the Form 26 affidavits officially submitted to the Election Commission of India. We do not independently verify this data and hold no liability for inaccuracies. This is a non-partisan civic initiative.'
                    : 'வழங்கப்படும் அனைத்துத் தகவல்களும் இந்திய தேர்தல் ஆணையத்திடம் அதிகாரப்பூர்வமாக சமர்ப்பிக்கப்பட்ட படிவம் 26 வாக்குமூலங்களில் இருந்து நேரடியாகத் தொகுக்கப்பட்டவை. இந்த தரவை நாங்கள் சுயாதீனமாக சரிபார்க்கவில்லை மற்றும் தவறுகளுக்கு பொறுப்பேற்க மாட்டோம்.'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="pt-4 flex justify-end">
            <button
              onClick={handleAccept}
              className="bg-neutral-900 text-white hover:bg-neutral-800 transition-colors px-6 py-3 rounded-xl font-bold flex items-center space-x-2 text-sm sm:text-base active:scale-95"
            >
              <span>{lang === 'en' ? 'I Understand & Accept' : 'நான் புரிந்துகொண்டு ஏற்கிறேன்'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
