/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { LayoutGrid, BarChart3, GitCompare, Globe, Baseline, Menu, X, ChevronDown, History } from 'lucide-react';
import { FontSizeSetting, LanguageSetting } from '../types';

interface HeaderProps {
  lang: LanguageSetting;
  fontSize: FontSizeSetting;
  onToggleLanguage: () => void;
  onFontSizeChange: (size: FontSizeSetting) => void;
}

export default function Header({
  lang,
  fontSize,
  onToggleLanguage,
  onFontSizeChange
}: HeaderProps) {
  const location = useLocation();
  const headerRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    gsap.fromTo(headerRef.current, { y: '-100%' }, { y: '0%', duration: 0.6, ease: 'power3.out' });
  }, { scope: headerRef });
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const SvgHome = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
    </svg>
  );

  const SvgAffidavit = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
    </svg>
  );

  const SvgDashboard = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
    </svg>
  );

  const SvgCompare = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M9.01 14H2v2h7.01v3L13 15l-3.99-4v3zm5.98-1v-3H22V8h-7.01V5L11 9l3.99 4z" />
    </svg>
  );

  const SvgWatch = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
    </svg>
  );

  const navTabs = [
    {
      path: '/',
      labelEn: 'Home',
      labelTa: 'முகப்பு',
      icon: SvgHome,
    },
    {
      path: '/affidavits',
      labelEn: 'Affidavit Directory',
      labelTa: 'பிரமாணப் பத்திரப் பட்டியல்',
      icon: SvgAffidavit,
    },
    {
      path: '/dashboard',
      labelEn: 'Dashboard',
      labelTa: 'புள்ளிவிவரம்',
      icon: SvgDashboard,
    },
    {
      path: '/compare',
      labelEn: 'Compare',
      labelTa: 'ஒப்பிடு',
      icon: SvgCompare,
    },
    {
      path: '/mla-watch',
      labelEn: 'MLA Watch',
      labelTa: 'எம்எல்ஏ கண்காணிப்பு',
      icon: SvgWatch,
    },
  ];

  const fontSizes: { key: FontSizeSetting; label: string }[] = [
    { key: 'small', label: 'A-' },
    { key: 'regular', label: 'A' },
    { key: 'large', label: 'A+' },
    { key: 'xlarge', label: 'A++' },
  ];

  return (
    <header
      ref={headerRef}
      className={`site-header sticky top-0 z-40 w-full select-none transition-all duration-300 ${
        isScrolled
          ? 'bg-white/85 backdrop-blur-xl border-b border-neutral-200/60 shadow-[0_1px_12px_rgba(0,0,0,0.03)]'
          : 'bg-[#FCFBF9]/95 backdrop-blur-sm border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Left: Logo / Brand */}
          <Link to="/" className="flex items-center space-x-3 shrink-0 group cursor-pointer">
            {/* Brand Mark */}
            <img src="/logo.png" alt="KnowyourLeader Logo" className="w-8 h-8 object-contain rounded-xl shadow-sm bg-black p-1 transition-transform group-hover:scale-105" />
            <div className="hidden sm:flex sm:flex-col justify-center">
              <span className="font-display font-bold text-neutral-900 text-[15px] tracking-tight leading-none mb-[1px]">
                KnowyourLeader
              </span>
              <span className="block text-[9px] font-mono text-neutral-400 tracking-wider uppercase font-bold leading-none">
                {lang === 'en' ? 'Transparency Portal' : 'வெளிப்படைத்தன்மை தளம்'}
              </span>
            </div>
          </Link>

          {/* Center: Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1" id="navigation-anchor">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = location.pathname === tab.path;
              return (
                <Link
                  key={tab.path}
                  to={tab.path}
                  className={`relative flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-neutral-900 text-white shadow-sm nav-tab-active'
                      : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{lang === 'en' ? tab.labelEn : tab.labelTa}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right: Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Font Size Controls — Desktop only */}
            <div className="hidden lg:flex items-center space-x-1.5">
              <Baseline className="w-3 h-3 text-neutral-400" />
              <div className="bg-neutral-100 rounded-lg p-0.5 flex space-x-0.5 border border-neutral-200/60">
                {fontSizes.map((fs) => (
                  <button
                    key={fs.key}
                    onClick={() => onFontSizeChange(fs.key)}
                    className={`px-2 py-1 rounded-md text-[10px] font-bold cursor-pointer transition-all ${
                      fontSize === fs.key
                        ? 'bg-neutral-900 text-white shadow-sm'
                        : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-200/50'
                    }`}
                  >
                    {fs.label}
                  </button>
                ))}
              </div>
            </div>


            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-neutral-600 hover:bg-neutral-100 rounded-xl transition-all cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-neutral-200/60 py-3 space-y-1 animate-fade-in">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = location.pathname === tab.path;
              return (
                <Link
                  key={tab.path}
                  to={tab.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-neutral-900 text-white'
                      : 'text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{lang === 'en' ? tab.labelEn : tab.labelTa}</span>
                </Link>
              );
            })}

            {/* Mobile Font Size Controls */}
            <div className="flex items-center space-x-2 px-4 py-3">
              <Baseline className="w-3.5 h-3.5 text-neutral-400" />
              <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest font-bold">
                {lang === 'en' ? 'Text Size' : 'எழுத்துரு'}
              </span>
              <div className="bg-neutral-100 rounded-lg p-0.5 flex space-x-0.5 border border-neutral-200/60 ml-auto">
                {fontSizes.map((fs) => (
                  <button
                    key={fs.key}
                    onClick={() => onFontSizeChange(fs.key)}
                    className={`px-2.5 py-1.5 rounded-md text-[11px] font-bold cursor-pointer transition-all ${
                      fontSize === fs.key
                        ? 'bg-neutral-900 text-white shadow-sm'
                        : 'text-neutral-500 hover:bg-neutral-200/50'
                    }`}
                  >
                    {fs.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
