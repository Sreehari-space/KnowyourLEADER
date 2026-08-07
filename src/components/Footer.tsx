/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { Candidate, LanguageSetting } from '../types';
import { FORMAT_CURRENCY } from '../data/candidates';
import { SITE_LINKS } from '../data/siteLinks';
import { ArrowUpRight, Github, Twitter, Mail } from 'lucide-react';

interface FooterProps {
  lang: LanguageSetting;
  candidates?: Candidate[];
}

export default function Footer({ lang, candidates = [] }: FooterProps) {
  const currentYear = new Date().getFullYear();
  const footerRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    if (footerRef.current) {
      gsap.fromTo(
        footerRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', scrollTrigger: { trigger: footerRef.current, start: 'top 95%' } }
      );
    }
  }, { scope: footerRef });

  // Derived, never hardcoded — the footer is the last thing a sceptic reads.
  const totalNetWorth = candidates.reduce((s, c) => s + (c.netWorth || 0), 0);
  const totalCases = candidates.reduce((s, c) => s + (c.caseCount || 0), 0);

  const stats = [
    { value: candidates.length.toLocaleString('en-IN'), labelEn: 'candidates', labelTa: 'வேட்பாளர்' },
    { value: FORMAT_CURRENCY(totalNetWorth, lang), labelEn: 'declared', labelTa: 'அறிவிப்பு' },
    { value: totalCases.toLocaleString('en-IN'), labelEn: 'cases declared', labelTa: 'வழக்குகள்' },
    { value: '234', labelEn: 'constituencies', labelTa: 'தொகுதிகள்' },
  ];

  // Only render links that have actually been configured in siteLinks.ts.
  // Shipping `href="#"` placeholders on a transparency site costs more
  // credibility than simply not showing the icon.
  const socials = [
    { Icon: Twitter, label: 'X', href: SITE_LINKS.x },
    { Icon: Github, label: 'GitHub', href: SITE_LINKS.github },
    { Icon: Mail, label: 'Email', href: SITE_LINKS.email },
  ].filter((s) => s.href.trim().length > 0);

  const legalLinks = [
    { label: lang === 'en' ? 'Privacy' : 'தனியுரிமை', href: SITE_LINKS.privacy },
    { label: lang === 'en' ? 'Terms' : 'விதிமுறைகள்', href: SITE_LINKS.terms },
    { label: lang === 'en' ? 'Data sources' : 'தரவு ஆதாரங்கள்', href: SITE_LINKS.dataSources },
  ].filter((l) => l.href.trim().length > 0);

  const navLinks = [
    { path: '/', en: 'Home', ta: 'முகப்பு' },
    { path: '/affidavits', en: 'Affidavits', ta: 'பிரமாணப் பத்திரம்' },
    { path: '/dashboard', en: 'Dashboard', ta: 'புள்ளிவிவரம்' },
    { path: '/compare', en: 'Compare', ta: 'ஒப்பீடு' },
    { path: '/mla-watch', en: 'MLA Watch', ta: 'எம்எல்ஏ கண்காணிப்பு' },
  ];

  return (
    <footer
      ref={footerRef}
      className="bg-[#050505] text-neutral-400 select-none border-t border-white/5 relative overflow-hidden"
      id="site-footer"
    >
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-3/4 max-w-2xl h-[280px] bg-gradient-to-r from-indigo-500/20 via-fuchsia-500/10 to-amber-400/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-14 sm:pt-20 pb-8 relative z-10">
        {/* Headline */}
        <div className="max-w-2xl space-y-4 mb-10 sm:mb-14">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-widest text-indigo-300 bg-indigo-500/10 border border-indigo-400/20 rounded-full px-3 py-1.5">
            {lang === 'en' ? 'receipts, not vibes' : 'ஆதாரம் மட்டும்'}
          </span>
          <h2 className="text-3xl sm:text-5xl font-display font-black text-white tracking-tight leading-[1.05]">
            {lang === 'en' ? (
              <>
                know who you&apos;re
                <br />
                voting for.{' '}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-amber-300">
                  actually.
                </span>
              </>
            ) : (
              <>
                யாருக்கு வாக்களிக்கிறீர்கள்
                <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-amber-300">
                  தெரிஞ்சுக்கோங்க.
                </span>
              </>
            )}
          </h2>
          <p className="text-sm text-neutral-400 leading-relaxed max-w-lg">
            {lang === 'en'
              ? 'Every figure on this site is lifted straight from the candidate’s own ECI Form 26 filing. No spin, no edits, no party money.'
              : 'இந்த தளத்துல இருக்குற ஒவ்வொரு தகவலும் வேட்பாளரோட ECI படிவம் 26-ல இருந்து நேரடியா. எடிட் இல்ல, கட்சி பணம் இல்ல.'}
          </p>
        </div>

        {/* Live stat strip */}
        {candidates.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mb-10 sm:mb-14">
            {stats.map((s) => (
              <div
                key={s.labelEn}
                className="bg-white/[0.03] border border-white/10 rounded-2xl p-3.5 sm:p-4 hover:border-white/20 transition-colors"
              >
                <p className="text-xl sm:text-2xl font-black font-mono text-white tracking-tight tabular-nums truncate">
                  {s.value}
                </p>
                <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-500 mt-1">
                  {lang === 'en' ? s.labelEn : s.labelTa}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Nav pills + socials */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-10 sm:pb-14">
          <nav className="flex flex-wrap gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="text-xs font-bold text-neutral-300 bg-white/5 border border-white/10 rounded-full px-4 py-2 hover:bg-white/10 hover:text-white hover:border-white/20 transition-all active:scale-95"
              >
                {lang === 'en' ? link.en : link.ta}
              </Link>
            ))}
            <a
              href="https://affidavit.eci.gov.in/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-bold text-indigo-300 bg-indigo-500/10 border border-indigo-400/20 rounded-full px-4 py-2 hover:bg-indigo-500/20 transition-all active:scale-95"
            >
              {lang === 'en' ? 'ECI source' : 'ECI ஆதாரம்'}
              <ArrowUpRight className="w-3 h-3" />
            </a>
          </nav>

          {socials.length > 0 && (
            <div className="flex items-center gap-2.5 shrink-0">
              {socials.map(({ Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  {...(href.startsWith('http') ? { target: '_blank', rel: 'noreferrer' } : {})}
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition-all hover:scale-105 active:scale-95"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Oversized wordmark */}
        <div className="border-t border-white/10 pt-8 sm:pt-10">
          <p
            aria-hidden="true"
            className="font-display font-black tracking-tighter leading-none bg-clip-text text-transparent bg-gradient-to-b from-white/[0.14] to-white/[0.02] whitespace-nowrap select-none"
            style={{ fontSize: 'clamp(2.75rem, 15vw, 11rem)' }}
          >
            TN LEADERS
          </p>
        </div>

        {/* Legal */}
        <div className="pt-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <p className="text-[11px] text-neutral-500 font-medium">
              © {currentYear} TN Leaders. {lang === 'en' ? 'Non-partisan. Not affiliated with any party or the ECI.' : 'சார்பற்றது. எந்த கட்சியுடனும் தொடர்பில்லை.'}
            </p>
            <p className="text-[11px] text-neutral-600 leading-relaxed max-w-2xl">
              {lang === 'en'
                ? 'Data is reproduced as filed and is not independently verified. A declared case is not a conviction.'
                : 'தரவு தாக்கல் செய்தபடியே காட்டப்படுகிறது; சுயாதீனமாக சரிபார்க்கப்படவில்லை. அறிவிக்கப்பட்ட வழக்கு என்பது தண்டனை அல்ல.'}
            </p>
          </div>

          {legalLinks.length > 0 && (
            <div className="flex items-center gap-5 text-[11px] font-medium text-neutral-500 shrink-0">
              {legalLinks.map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  {...(href.startsWith('http') ? { target: '_blank', rel: 'noreferrer' } : {})}
                  className="hover:text-white transition-colors"
                >
                  {label}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
