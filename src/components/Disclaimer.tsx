/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * The tone here is deliberately casual, but every substantive point from the
 * original legal notice is still made: the data is unverified and reproduced as
 * filed, the MLA Watch summaries are AI-generated and may be wrong, declared
 * cases are not convictions, and the project accepts no liability. Rewrite the
 * voice freely; do not drop any of those four claims.
 */

import React, { useState, useEffect } from 'react';
import { LanguageSetting } from '../types';
import { ArrowRight, Scale, Bot, FileText } from 'lucide-react';

interface DisclaimerProps {
  lang: LanguageSetting;
  onAccept: () => void;
}

export default function Disclaimer({ lang, onAccept }: DisclaimerProps) {
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const hasAccepted = localStorage.getItem('tn_election_disclaimer_accepted');
    if (hasAccepted === 'true') {
      onAccept();
    }
  }, [onAccept]);

  const handleAccept = () => {
    setIsFadingOut(true);
    localStorage.setItem('tn_election_disclaimer_accepted', 'true');
    setTimeout(() => {
      onAccept();
    }, 400);
  };

  const points = [
    {
      icon: <FileText className="w-4 h-4" />,
      tint: 'bg-indigo-100 text-indigo-700',
      titleEn: 'straight from the affidavits 🧾',
      titleTa: 'நேரடியா அஃபிடவிட்-ல இருந்து 🧾',
      bodyEn:
        'Every number here is what the candidate themselves filed with the Election Commission. We did not verify it — we just made it readable. If it is wrong, it is wrong on the original too.',
      bodyTa:
        'இங்க இருக்குற எல்லா தகவலும் வேட்பாளர் தேர்தல் ஆணையத்துல தானே கொடுத்தது. நாங்க செக் பண்ணல — படிக்க easy-ஆ மட்டும் மாத்திருக்கோம்.',
    },
    {
      icon: <Bot className="w-4 h-4" />,
      tint: 'bg-amber-100 text-amber-700',
      titleEn: 'AI wrote the MLA Watch recaps 🤖',
      titleTa: 'MLA Watch summary-ஆ AI தான் எழுதுது 🤖',
      bodyEn:
        'Good, not perfect. It can miss context or read a headline wrong. Tap through to the original source before you quote it anywhere.',
      bodyTa:
        'நல்லா இருக்கும், ஆனா 100% சரி-ன்னு சொல்ல முடியாது. எங்கயாவது quote பண்ணுறதுக்கு முன்ன அசல் செய்தியை ஒரு தடவ பாருங்க.',
    },
    {
      icon: <Scale className="w-4 h-4" />,
      tint: 'bg-emerald-100 text-emerald-700',
      titleEn: 'no sides, no sponsors ⚖️',
      titleTa: 'யாரு பக்கமும் இல்ல ⚖️',
      bodyEn:
        'No party funds this and nobody paid for placement. Also important: a declared case is not a conviction. Read it as filed, make up your own mind — we are not liable for what you do with it.',
      bodyTa:
        'எந்த கட்சியும் இதுக்கு பணம் கொடுக்கல. முக்கியமா: வழக்கு அறிவிச்சிருக்காங்க-ங்கறது தண்டனை கிடையாது. நீங்களே முடிவு பண்ணுங்க — அதுக்கு நாங்க பொறுப்பு இல்ல.',
    },
  ];

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-md transition-opacity duration-400 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="bg-white rounded-[28px] w-full max-w-lg overflow-hidden shadow-2xl border border-white/10 animate-fade-in relative max-h-[90vh] flex flex-col">
        <div className="h-1.5 w-full shrink-0 bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-amber-400" />

        <div className="p-5 sm:p-7 space-y-5 overflow-y-auto custom-scrollbar">
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-full px-2.5 py-1">
              {lang === 'en' ? 'no cap · receipts only' : 'ஃபுல் ட்ரான்ஸ்பரன்சி'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-display font-black text-neutral-900 tracking-tight leading-tight">
              {lang === 'en' ? 'ok real quick 👀' : 'ஒரு நிமிஷம் 👀'}
            </h2>
            <p className="text-sm text-neutral-500 leading-relaxed">
              {lang === 'en'
                ? 'Three things before you scroll. Takes 10 seconds, then we are out of your way.'
                : 'ஸ்க்ரோல் பண்றதுக்கு முன்ன மூணு விஷயம். 10 விநாடி, அவ்ளோதான்.'}
            </p>
          </div>

          <div className="space-y-2.5">
            {points.map((p, i) => (
              <div
                key={i}
                className="bg-neutral-50 border border-neutral-200/70 rounded-2xl p-3.5 flex items-start gap-3"
              >
                <div className={`${p.tint} p-2 rounded-xl shrink-0`}>{p.icon}</div>
                <div className="min-w-0">
                  <h4 className="font-black text-neutral-900 text-sm mb-1 tracking-tight">
                    {lang === 'en' ? p.titleEn : p.titleTa}
                  </h4>
                  <p className="text-neutral-600 text-[12.5px] leading-relaxed">
                    {lang === 'en' ? p.bodyEn : p.bodyTa}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 sm:p-5 border-t border-neutral-100 bg-neutral-50/80 flex items-center justify-between gap-3 shrink-0">
          <span className="text-[11px] text-neutral-400 font-medium hidden sm:block">
            {lang === 'en' ? 'source: ECI Form 26' : 'ஆதாரம்: ECI படிவம் 26'}
          </span>
          <button
            onClick={handleAccept}
            className="bg-neutral-900 text-white hover:bg-neutral-800 transition-all px-6 py-3 rounded-2xl font-black flex items-center gap-2 text-sm active:scale-95 shadow-lg shadow-neutral-900/20 w-full sm:w-auto justify-center"
          >
            <span>{lang === 'en' ? 'bet, let me in' : 'சரி, உள்ள விடுங்க'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
