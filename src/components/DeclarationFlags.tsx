/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Questions raised by a candidate's own filing.
 *
 * This replaces a panel headed "Discrepancies Found" that carried severity
 * badges reading CRITICAL and titles naming offences — "Tax/Duty Evasion",
 * "Parking Illicit Funds" — against 1,019 of 1,799 named living people. Most
 * of it was false. See scripts/buildDeclarationFlags.cjs for the post-mortem.
 *
 * The design here follows from that. There are no severity tiers, because we
 * cannot rank the seriousness of something we are not alleging. Every flag
 * shows the declared figures behind it, the assumption it rests on, and the
 * ordinary innocent explanation, given equal weight and equal type size. A
 * reader who takes nothing on trust should be able to check each one against
 * the affidavit printed further down the same page.
 */

import React, { useEffect, useState } from 'react';
import { HelpCircle, FileSearch } from 'lucide-react';
import { DeclarationFlag, loadDeclarationFlags } from '../utils/declarationFlags';

interface Props {
  candidateId: string;
  lang: 'en' | 'ta';
}

const T = {
  en: {
    heading: 'Questions raised by this filing',
    lede:
      'Points where this affidavit is worth a second look. These are questions to put to the candidate, not findings against them, and each one has an ordinary explanation that may well be the right one.',
    asFiled: 'As filed',
    basis: 'What this check assumes',
    innocent: 'Also explained by',
    none: 'Nothing in this affidavit met the checks described below.',
    method: 'How this is determined',
  },
  ta: {
    heading: 'இந்த அறிவிப்பு எழுப்பும் கேள்விகள்',
    lede:
      'இந்தப் பிரமாணப் பத்திரத்தில் மேலும் கவனிக்கத்தக்க இடங்கள். இவை வேட்பாளரிடம் கேட்க வேண்டிய கேள்விகள்; குற்றச்சாட்டுகள் அல்ல. ஒவ்வொன்றுக்கும் சாதாரணமான விளக்கம் உண்டு — அதுவே சரியாக இருக்கலாம்.',
    asFiled: 'தாக்கல் செய்தபடி',
    basis: 'இந்தச் சோதனையின் அனுமானம்',
    innocent: 'இதற்கான சாதாரண விளக்கம்',
    none: 'கீழே விவரிக்கப்பட்ட சோதனைகளில் எதுவும் இந்த அறிவிப்பில் பொருந்தவில்லை.',
    method: 'இது எப்படித் தீர்மானிக்கப்படுகிறது',
  },
};

export default function DeclarationFlags({ candidateId, lang }: Props) {
  const t = T[lang];
  const [flags, setFlags] = useState<DeclarationFlag[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    setFlags(null);
    loadDeclarationFlags(candidateId)
      .then(f => { if (!cancelled) setFlags(f); })
      .catch(() => { if (!cancelled) setFlags([]); });
    return () => { cancelled = true; };
  }, [candidateId]);

  // Nothing is rendered while loading, and nothing is rendered for a candidate
  // with no flags. An empty "no problems found" panel on 1,736 dossiers would
  // imply the other 63 had been found guilty of something.
  if (!flags || flags.length === 0) return null;

  return (
    <section className="pt-2">
      <div className="flex items-start gap-2.5 mb-1.5">
        <FileSearch className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <h3 className="text-lg md:text-xl font-display font-black text-slate-900 tracking-tight">
          {t.heading}
        </h3>
      </div>
      <p className="text-[13px] text-slate-600 leading-relaxed mb-4 max-w-2xl">{t.lede}</p>

      <div className="space-y-3">
        {flags.map((flag, i) => (
          <article
            key={`${flag.code}-${i}`}
            className="bg-white border border-amber-200/80 rounded-2xl overflow-hidden shadow-xs"
          >
            <div className="bg-amber-50/60 border-b border-amber-100 px-4 py-3">
              <h4 className="text-[14px] font-bold text-slate-900 leading-snug">{flag.title}</h4>
              <p className="text-[13px] text-slate-700 leading-relaxed mt-1">{flag.detail}</p>
            </div>

            <div className="p-4 space-y-3">
              {flag.evidence.length > 0 && (
                <dl className="grid gap-x-4 gap-y-2 [grid-template-columns:repeat(auto-fit,minmax(16rem,1fr))]">
                  {flag.evidence.map(row => (
                    <div key={row.label} className="flex items-baseline justify-between gap-3 border-b border-slate-100 pb-1">
                      <dt className="text-[11px] text-slate-500 leading-snug">{row.label}</dt>
                      <dd className="text-[13px] font-mono font-semibold text-slate-900 tabular-nums shrink-0">
                        {row.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}

              {flag.asFiled && (
                <div>
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                    {t.asFiled}
                  </span>
                  <p className="text-[12px] font-mono text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 mt-1 break-words">
                    {flag.asFiled}
                  </p>
                </div>
              )}

              {/* The innocent reading sits level with the flag, not beneath it in
                  smaller print. It is as likely to be the true one. */}
              <div className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-xl p-3">
                <HelpCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                    {t.innocent}
                  </span>
                  <p className="text-[12.5px] text-slate-600 leading-relaxed mt-0.5">{flag.alsoExplainedBy}</p>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                <span className="font-bold uppercase tracking-widest font-mono">{t.basis}:</span>{' '}
                {flag.assumption}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
