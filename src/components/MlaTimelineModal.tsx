/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { Candidate, LanguageSetting } from '../types';
import MlaTimeline, { MlaEvent } from './MlaTimeline';

interface MlaTimelineModalProps {
  candidate: Candidate;
  lang: LanguageSetting;
  onClose: () => void;
}

interface MlaData {
  mla_id: string;
  mla_name: string;
  constituency: string;
  party: string;
  last_updated: string;
  events: MlaEvent[];
}

export default function MlaTimelineModal({ candidate, lang, onClose }: MlaTimelineModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [mlaData, setMlaData] = useState<MlaData | null>(null);
  const [error, setError] = useState(false);

  // Animation In using GSAP's React hook
  useGSAP(() => {
    if (overlayRef.current && modalRef.current) {
      gsap.fromTo(overlayRef.current, 
        { opacity: 0, backdropFilter: 'blur(0px)' }, 
        { opacity: 1, backdropFilter: 'blur(12px)', duration: 0.4, ease: 'power2.out' }
      );
      gsap.fromTo(modalRef.current, 
        { y: '100%', opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out', delay: 0.1 }
      );
    }
  }, { dependencies: [candidate.id], scope: overlayRef });

  useEffect(() => {
    // Prevent background scrolling
    document.body.style.overflow = 'hidden';

    // Fetch data
    const fetchData = async () => {
      setLoading(true);
      setError(false);
      try {
        const response = await fetch(`/data/mla-watch/${candidate.id}.json`);
        if (!response.ok) {
          throw new Error('Not found');
        }
        const data: MlaData = await response.json();
        setMlaData(data);
      } catch (e) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [candidate.id]);

  const handleClose = () => {
    if (overlayRef.current && modalRef.current) {
      gsap.to(overlayRef.current, { opacity: 0, backdropFilter: 'blur(0px)', duration: 0.3 });
      gsap.to(modalRef.current, { 
        y: '100%', 
        opacity: 0, 
        duration: 0.3, 
        ease: 'power3.in',
        onComplete: onClose
      });
    } else {
      onClose();
    }
  };

  return (
    <div 
      ref={overlayRef}
      className="fixed inset-0 z-[100] bg-neutral-900/40 flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6"
      onClick={(e) => {
        if (e.target === overlayRef.current) handleClose();
      }}
    >
      <div 
        ref={modalRef}
        className="w-full max-w-4xl h-[90vh] sm:h-[85vh] bg-white sm:rounded-[2rem] rounded-t-[2rem] shadow-2xl flex flex-col overflow-hidden relative"
      >
        {/* Header */}
        <div className="flex-shrink-0 px-6 sm:px-8 py-5 border-b border-neutral-100 flex items-center justify-between bg-white/80 backdrop-blur-md z-10 sticky top-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-neutral-100 shrink-0 flex items-center justify-center bg-neutral-100 text-neutral-400 font-bold text-xl">
              {candidate.photo ? (
                <img 
                  src={candidate.photo.replace('images/', '/candidates/')} 
                  alt={candidate.name} 
                  className="w-full h-full object-cover" 
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                candidate.name.charAt(0)
              )}
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight leading-none mb-1">
                {candidate.name}
              </h2>
              <p className="text-sm font-medium text-neutral-500">
                {candidate.constituency} • {candidate.party}
              </p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="w-10 h-10 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition-colors text-neutral-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 bg-[#FCFBF9]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              <p className="text-neutral-500 font-medium">
                {lang === 'en' ? 'Loading timeline...' : 'நிகழ்வுகள் ஏற்றப்படுகிறது...'}
              </p>
            </div>
          ) : error || !mlaData ? (
            <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto text-center space-y-4">
              <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center">
                <X className="w-8 h-8 text-neutral-400" />
              </div>
              <h3 className="text-xl font-bold text-neutral-800">
                {lang === 'en' ? 'No Data Available' : 'தரவு இல்லை'}
              </h3>
              <p className="text-neutral-500">
                {lang === 'en' 
                  ? 'We currently do not have tracking data for this candidate in the MLA Watch database.' 
                  : 'இந்த வேட்பாளருக்கான கண்காணிப்பு தரவுகள் தற்போது எங்களிடம் இல்லை.'}
              </p>
            </div>
          ) : (
            <MlaTimeline 
              events={mlaData.events} 
              lastUpdated={mlaData.last_updated} 
              lang={lang} 
            />
          )}
        </div>
      </div>
    </div>
  );
}
