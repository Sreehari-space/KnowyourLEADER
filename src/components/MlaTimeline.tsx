/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Trophy, 
  Landmark, 
  Mic2, 
  Scale, 
  AlertTriangle, 
  Newspaper, 
  Banknote, 
  Building2, 
  Handshake, 
  Pin 
} from 'lucide-react';
import { LanguageSetting } from '../types';

export interface MlaEvent {
  id: string;
  event_date: string;
  event_type: string;
  summary_en: string;
  summary_ta: string | null;
  severity: string;
  source_url: string;
  source_domain: string;
  ai_curated: boolean;
}

interface MlaTimelineProps {
  events: MlaEvent[];
  lastUpdated: string;
  lang: LanguageSetting;
}

const getEventIcon = (type: string) => {
  switch (type) {
    case 'ELECTION': return <Trophy className="w-5 h-5" />;
    case 'SWORN_IN': return <Landmark className="w-5 h-5" />;
    case 'ASSEMBLY': return <Mic2 className="w-5 h-5" />;
    case 'LEGAL': return <Scale className="w-5 h-5" />;
    case 'CONTROVERSY': return <AlertTriangle className="w-5 h-5" />;
    case 'STATEMENT': return <Newspaper className="w-5 h-5" />;
    case 'FINANCIAL': return <Banknote className="w-5 h-5" />;
    case 'DEVELOPMENT': return <Building2 className="w-5 h-5" />;
    case 'PARTY': return <Handshake className="w-5 h-5" />;
    default: return <Pin className="w-5 h-5" />;
  }
};

const getSeverityStyles = (severity: string) => {
  switch (severity) {
    case 'NOTABLE': return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', iconBg: 'bg-blue-100' };
    case 'HIGH': return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', iconBg: 'bg-amber-100' };
    case 'CRITICAL': return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', iconBg: 'bg-red-100' };
    case 'INFO':
    default: return { bg: 'bg-neutral-50', text: 'text-neutral-700', border: 'border-neutral-200', iconBg: 'bg-neutral-100' };
  }
};

export default function MlaTimeline({ events, lastUpdated, lang }: MlaTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 bg-neutral-50 rounded-2xl border border-neutral-100">
        <Pin className="w-12 h-12 text-neutral-300 mb-4" />
        <p className="text-neutral-500 font-medium">
          {lang === 'en' ? 'No events tracked yet for this representative.' : 'இந்த பிரதிநிதிக்கான நிகழ்வுகள் எதுவும் இதுவரை பதிவு செய்யப்படவில்லை.'}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto py-6">
      <div className="flex justify-between items-center mb-8 px-2">
        <h3 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
          {lang === 'en' ? 'Event Timeline' : 'நிகழ்வுகள்'}
        </h3>
        <span className="text-xs sm:text-sm font-mono text-neutral-500 bg-neutral-100 px-3 py-1.5 rounded-full">
          {lang === 'en' ? 'Updated:' : 'புதுப்பிக்கப்பட்டது:'} {new Date(lastUpdated).toLocaleDateString(lang === 'en' ? 'en-IN' : 'ta-IN', {
            day: 'numeric', month: 'short', year: 'numeric'
          })}
        </span>
      </div>

      <div className="relative border-l-2 border-neutral-200 ml-4 sm:ml-6 md:ml-8 space-y-10 pb-4">
        {events.map((event, idx) => {
          const styles = getSeverityStyles(event.severity);
          
          return (
            <div key={event.id} className="relative pl-6 sm:pl-8 md:pl-10">
              {/* Timeline Dot */}
              <div className={`absolute -left-[11px] top-1.5 w-5 h-5 rounded-full border-4 border-white shadow-sm flex items-center justify-center ${styles.bg}`}>
                <div className={`w-2 h-2 rounded-full ${styles.bg.replace('50', '500')}`} />
              </div>

              {/* Date */}
              <div className="mb-2">
                <span className="text-xs sm:text-sm font-bold text-neutral-500 tracking-wider uppercase bg-white/80 backdrop-blur-sm pr-4 py-1">
                  {new Date(event.event_date).toLocaleDateString(lang === 'en' ? 'en-IN' : 'ta-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              </div>

              {/* Event Card */}
              <div className={`relative overflow-hidden rounded-2xl border ${styles.border} ${styles.bg} p-5 sm:p-6 transition-all hover:shadow-md group`}>
                <div className="flex items-start justify-between mb-3 gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${styles.iconBg} ${styles.text}`}>
                      {getEventIcon(event.event_type)}
                    </div>
                    <div>
                      <h4 className={`text-sm font-bold tracking-wide uppercase ${styles.text}`}>
                        {event.event_type.replace('_', ' ')}
                      </h4>
                      {event.ai_curated && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full mt-1 border border-indigo-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                          AI Curated
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <p className="text-base sm:text-lg text-neutral-800 font-medium leading-relaxed mb-4">
                  {lang === 'ta' && event.summary_ta ? event.summary_ta : event.summary_en}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-black/5">
                  <a
                    href={event.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs sm:text-sm font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors group-hover:underline underline-offset-4"
                  >
                    {event.source_domain}
                    <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
