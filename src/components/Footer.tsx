/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { LanguageSetting } from '../types';
import { FolderLock, LayoutGrid, BarChart3, GitCompare, ArrowUpRight, Github, Twitter, Mail } from 'lucide-react';

interface FooterProps {
  lang: LanguageSetting;
}

export default function Footer({ lang }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#050505] text-neutral-400 select-none border-t border-white/5 relative overflow-hidden" id="site-footer">
      
      {/* Subtle Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 max-w-2xl h-[200px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-20 pb-10 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8 lg:gap-12 mb-16">

          {/* Brand Identity */}
          <div className="md:col-span-5 space-y-6">
            <div className="flex items-center space-x-3">
              <div className="p-1.5 bg-white/5 rounded-xl border border-white/10 shadow-lg backdrop-blur-sm group-hover:border-white/20 transition-all">
                <img src="/logo.png" alt="KnowyourLeader Logo" className="w-8 h-8 object-contain bg-black rounded-lg" />
              </div>
              <div>
                <span className="font-display font-black text-white text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                  KnowyourLeader
                </span>
                <span className="block text-[9px] font-mono text-indigo-400/90 tracking-widest uppercase font-bold mt-0.5">
                  {lang === 'en' ? 'Tamil Nadu · Transparency Portal' : 'தமிழ்நாடு · வெளிப்படைத்தன்மை தளம்'}
                </span>
              </div>
            </div>

            <p className="text-sm text-neutral-400/80 leading-relaxed max-w-md font-medium">
              {lang === 'en'
                ? 'Empowering citizens by delivering raw, parsed, and verified affidavit information directly from original ECI filings — transparent, non-partisan, and completely accessible.'
                : 'எந்தவொரு அரசியல் சார்புமின்றி வேட்பாளர்கள் தாக்கல் செய்த அசல் பிரமாணப் பத்திரங்களின் விவரங்களை வாக்காளர்கள் அறிந்து கொள்ளும் வகையில் எளிமைப்படுத்துகிறோம்.'}
            </p>

            <div className="flex items-center space-x-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition-all hover:scale-105 active:scale-95">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition-all hover:scale-105 active:scale-95">
                <Github className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition-all hover:scale-105 active:scale-95">
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="md:col-span-3 space-y-5">
            <h4 className="text-white font-bold uppercase tracking-widest text-[11px]">
              {lang === 'en' ? 'Platform' : 'தளம்'}
            </h4>
            <ul className="space-y-3.5">
              {[
                { path: '/', en: 'Home', ta: 'முகப்பு', icon: LayoutGrid },
                { path: '/affidavits', en: 'Affidavit Directory', ta: 'பிரமாணப் பத்திரப் பட்டியல்', icon: LayoutGrid },
                { path: '/dashboard', en: 'Visual Dashboard', ta: 'விளக்கப்பட புள்ளிவிவரம்', icon: BarChart3 },
                { path: '/compare', en: 'Candidate Compare', ta: 'வேட்பாளர் ஒப்பீடு', icon: GitCompare },
              ].map((link) => {
                const Icon = link.icon;
                return (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                      className="flex items-center space-x-3 text-sm text-neutral-400/80 hover:text-white transition-colors cursor-pointer group w-fit"
                    >
                      <Icon className="w-4 h-4 text-neutral-500 group-hover:text-indigo-400 transition-colors" />
                      <span className="font-medium">{lang === 'en' ? link.en : link.ta}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* External Links */}
          <div className="md:col-span-4 space-y-5">
            <h4 className="text-white font-bold uppercase tracking-widest text-[11px]">
              {lang === 'en' ? 'Resources & Data' : 'ஆதாரங்கள் & தரவு'}
            </h4>
            <ul className="space-y-3.5">
              <li>
                <a
                  href="https://affidavit.eci.gov.in/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center space-x-3 text-sm text-neutral-400/80 hover:text-white transition-colors group w-fit"
                >
                  <ArrowUpRight className="w-4 h-4 text-neutral-500 group-hover:text-indigo-400 transition-colors" />
                  <span className="font-medium">{lang === 'en' ? 'ECI Official Portal' : 'தேர்தல் ஆணைய போர்டல்'}</span>
                </a>
              </li>
              <li className="flex items-start space-x-3 pt-2">
                <div className="bg-white/5 border border-white/10 p-2 rounded-lg mt-0.5 shrink-0">
                  <FolderLock className="w-4 h-4 text-indigo-400" />
                </div>
                <p className="text-xs text-neutral-500 leading-relaxed pr-4">
                  {lang === 'en' 
                    ? 'All data is publicly sourced. This platform does not independently verify the authenticity of the candidates\' declarations.' 
                    : 'அனைத்து தரவுகளும் பொதுவானவை. வேட்பாளர்களின் அறிவிப்புகளை இந்த தளம் சுயாதீனமாக சரிபார்க்கவில்லை.'}
                </p>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-neutral-500 font-medium">
            © {currentYear} KnowyourLeader. {lang === 'en' ? 'All rights reserved.' : 'அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.'}
          </p>
          
          <div className="flex items-center space-x-6 text-xs font-medium text-neutral-500">
            <a href="#" className="hover:text-white transition-colors">
              {lang === 'en' ? 'Privacy Policy' : 'தனியுரிமை கொள்கை'}
            </a>
            <a href="#" className="hover:text-white transition-colors">
              {lang === 'en' ? 'Terms of Service' : 'சேவை விதிமுறைகள்'}
            </a>
            <a href="#" className="hover:text-white transition-colors">
              {lang === 'en' ? 'Data Sources' : 'தரவு ஆதாரங்கள்'}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
