/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutGrid, BarChart3, GitCompare, Globe, Baseline, Menu, X, ChevronDown } from 'lucide-react';
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
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navTabs = [
    {
      path: '/',
      labelEn: 'Home',
      labelTa: 'முகப்பு',
      icon: LayoutGrid,
    },
    {
      path: '/affidavits',
      labelEn: 'Affidavit Directory',
      labelTa: 'பிரமாணப் பத்திரப் பட்டியல்',
      icon: LayoutGrid,
    },
    {
      path: '/dashboard',
      labelEn: 'Dashboard',
      labelTa: 'புள்ளிவிவரம்',
      icon: BarChart3,
    },
    {
      path: '/compare',
      labelEn: 'Compare',
      labelTa: 'ஒப்பிடு',
      icon: GitCompare,
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
      className={`site-header sticky top-0 z-40 w-full select-none transition-all duration-300 ${
        isScrolled
          ? 'bg-white/85 backdrop-blur-xl border-b border-neutral-200/60 shadow-[0_1px_12px_rgba(0,0,0,0.03)]'
          : 'bg-[#FCFBF9]/95 backdrop-blur-sm border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Left: Logo / Brand */}
          <div className="flex items-center space-x-3 shrink-0">
            {/* Brand Mark */}
            <img src="/logo.png" alt="KnowyourLeader Logo" className="w-8 h-8 object-contain rounded-xl shadow-sm bg-black p-1" />
            <div className="hidden sm:block">
              <span className="font-display font-bold text-neutral-900 text-[15px] tracking-tight leading-none">
                KnowyourLeader
              </span>
              <span className="block text-[9px] font-mono text-neutral-400 tracking-wider uppercase font-bold leading-tight mt-0.5">
                {lang === 'en' ? 'Tamil Nadu · Transparency Portal' : 'தமிழ்நாடு · வெளிப்படைத்தன்மை தளம்'}
              </span>
            </div>
          </div>

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

            {/* Language Toggle */}
            <button
              onClick={onToggleLanguage}
              className="flex items-center space-x-1.5 bg-neutral-100 hover:bg-neutral-200/70 text-neutral-700 font-bold px-3 py-2 rounded-xl border border-neutral-200/60 transition-all text-[11px] cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-neutral-500" />
              <span>{lang === 'en' ? 'தமிழ்' : 'English'}</span>
            </button>

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
