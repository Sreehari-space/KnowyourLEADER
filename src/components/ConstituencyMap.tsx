/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { LanguageSetting, Candidate } from '../types';
import { MapPin, Loader, MousePointerClick, ShieldAlert, ShieldCheck, Landmark, Users, Trophy, X } from 'lucide-react';
import { FORMAT_CURRENCY } from '../data/candidates';

interface GeoJSONFeature {
  type: string;
  properties: {
    AC_NO: number;
    AC_NAME: string;
    DIST_NAME: string;
    PC_NAME: string;
    PC_NO: number;
  };
  geometry: {
    type: string;
    coordinates: number[][][][];
  };
}

interface GeoJSONData {
  type: string;
  features: GeoJSONFeature[];
}

interface TooltipData {
  x: number;
  y: number;
  acName: string;
  distName: string;
  pcName: string;
  acNo: number;
}

interface ConstituencyDetail {
  acName: string;
  distName: string;
  pcName: string;
  acNo: number;
  candidates: Candidate[];
  totalAssets: number;
  totalCases: number;
  richest?: Candidate;
  winner?: Candidate;
}

interface ConstituencyMapProps {
  lang: LanguageSetting;
  candidates: Candidate[];
  onConstituencyClick?: (constituencyName: string) => void;
  onSelectCandidate?: (candidate: Candidate) => void;
}

// Mercator projection helper
function projectPoint(lon: number, lat: number, bounds: { minLon: number; maxLon: number; minLat: number; maxLat: number }, width: number, height: number): [number, number] {
  const x = ((lon - bounds.minLon) / (bounds.maxLon - bounds.minLon)) * width;
  const y = height - ((lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * height;
  return [x, y];
}

// Convert coordinates to SVG path
function coordsToPath(coords: number[][], bounds: { minLon: number; maxLon: number; minLat: number; maxLat: number }, width: number, height: number): string {
  if (!coords || coords.length < 2) return '';
  const points = coords.map(([lon, lat]) => projectPoint(lon, lat, bounds, width, height));
  let path = `M ${points[0][0].toFixed(2)} ${points[0][1].toFixed(2)}`;
  for (let i = 1; i < points.length; i++) {
    path += ` L ${points[i][0].toFixed(2)} ${points[i][1].toFixed(2)}`;
  }
  path += ' Z';
  return path;
}

// Get centroid of a polygon ring
function getCentroid(coords: number[][], bounds: { minLon: number; maxLon: number; minLat: number; maxLat: number }, width: number, height: number): [number, number] {
  if (!coords || coords.length === 0) return [0, 0];
  let sumX = 0, sumY = 0;
  const projected = coords.map(([lon, lat]) => projectPoint(lon, lat, bounds, width, height));
  projected.forEach(([x, y]) => { sumX += x; sumY += y; });
  return [sumX / projected.length, sumY / projected.length];
}

// Party color mapping — supports both abbreviated and full party names
function getPartyFill(party: string): string {
  const p = party?.toUpperCase() || '';
  // TVK / Tamilaga Vettri Kazhagam
  if (p === 'TVK' || p.includes('TAMILAGA VETTRI') || p.includes('VETTRI KAZHAGAM')) return '#7C3AED';
  // DMK
  if (p === 'DMK' || p.includes('DRAVIDA MUNNETRA KAZHAGAM')) return '#DC2626';
  // AIADMK
  if (p === 'AIADMK' || p.includes('ALL INDIA ANNA DRAVIDA')) return '#059669';
  // BJP
  if (p === 'BJP' || p.includes('BHARATIYA JANATA')) return '#D97706';
  // INC (Congress)
  if (p === 'INC' || p.includes('INDIAN NATIONAL CONGRESS')) return '#2563EB';
  // NTK (Naam Tamilar Katchi)
  if (p === 'NTK' || p.includes('NAAM TAMILAR')) return '#EAB308';
  // VCK (Viduthalai Chiruthaigal Katchi)
  if (p === 'VCK' || p.includes('VIDUTHALAI CHIRUTHAIGAL')) return '#7E22CE';
  // PMK (Pattali Makkal Katchi)
  if (p === 'PMK' || p.includes('PATTALI MAKKAL')) return '#CA8A04';
  // CPI(M)
  if (p === 'CPI(M)' || p === 'CPIM' || p.includes('COMMUNIST PARTY OF INDIA (MARXIST)')) return '#B91C1C';
  // CPI
  if (p === 'CPI' || p.includes('COMMUNIST PARTY OF INDIA')) return '#991B1B';
  // DMDK
  if (p === 'DMDK' || p.includes('DESIYA MURPOKKU')) return '#0E7490';
  // BSP
  if (p === 'BSP' || p.includes('BAHUJAN SAMAJ')) return '#1D4ED8';
  // IUML (Indian Union Muslim League)
  if (p === 'IUML' || p.includes('MUSLIM LEAGUE')) return '#16A34A'; // Green
  // AMMK (Amma Makkal Munnettra Kazagam)
  if (p.includes('AMMA MAKKAL')) return '#0D9488';
  // IND (Independents)
  if (p === 'IND' || p === 'INDEPENDENT') return '#6B7280';
  // Fallback
  return '#94A3B8';
}

// Get short party display name for legend
function getPartyShortName(party: string): string {
  const p = party?.toUpperCase() || '';
  if (p.includes('TAMILAGA VETTRI') || p.includes('VETTRI KAZHAGAM')) return 'TVK';
  if (p.includes('DRAVIDA MUNNETRA KAZHAGAM') && !p.includes('DESIYA') && !p.includes('ALL INDIA')) return 'DMK';
  if (p.includes('ALL INDIA ANNA DRAVIDA')) return 'AIADMK';
  if (p.includes('BHARATIYA JANATA')) return 'BJP';
  if (p.includes('INDIAN NATIONAL CONGRESS')) return 'INC';
  if (p.includes('NAAM TAMILAR')) return 'NTK';
  if (p.includes('VIDUTHALAI CHIRUTHAIGAL')) return 'VCK';
  if (p.includes('PATTALI MAKKAL')) return 'PMK';
  if (p.includes('COMMUNIST PARTY') && p.includes('MARXIST')) return 'CPI(M)';
  if (p.includes('COMMUNIST PARTY')) return 'CPI';
  if (p.includes('DESIYA MURPOKKU')) return 'DMDK';
  if (p.includes('AMMA MAKKAL')) return 'AMMK';
  if (p.length > 8) return p.substring(0, 7) + '…';
  return party;
}

// Normalize constituency name for matching
function normalizeConstName(name: string): string {
  // Strip out (SC), (ST)
  let clean = name.toUpperCase().replace(/\s*\(SC\)\s*|\s*\(ST\)\s*/gi, '').trim();
  // Strip out the district name in parentheses (e.g. from "LALGUDI  (TIRUCHIRAPPALLI)")
  clean = clean.split('(')[0].trim();
  return clean;
}

export default function ConstituencyMap({ lang, candidates, onConstituencyClick, onSelectCandidate }: ConstituencyMapProps) {
  const [geoData, setGeoData] = useState<GeoJSONData | null>(null);
  const [resultsData, setResultsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [hoveredAC, setHoveredAC] = useState<number | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<ConstituencyDetail | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    if (!loading && sectionRef.current) {
      gsap.fromTo(sectionRef.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', scrollTrigger: { trigger: sectionRef.current, start: 'top 80%' } });
    }
  }, { dependencies: [loading], scope: sectionRef });

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Build constituency → candidate(s) lookup
  const constituencyMap = useMemo(() => {
    const map = new Map<string, Candidate[]>();
    candidates.forEach(c => {
      const key = normalizeConstName(c.constituency);
      const existing = map.get(key) || [];
      existing.push(c);
      map.set(key, existing);
    });
    return map;
  }, [candidates]);

  // Load GeoJSON data and Results
  useEffect(() => {
    Promise.all([
      fetch('/tn_ac_2021_constituencies.geojson').then(res => res.json()),
      fetch('/results.json').then(res => res.json())
    ])
      .then(([geo, resData]) => {
        setGeoData(geo);
        setResultsData(resData);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading map data:", err);
        setLoading(false);
      });
  }, []);

  // Calculate bounds
  const bounds = useMemo(() => {
    if (!geoData) return { minLon: 0, maxLon: 1, minLat: 0, maxLat: 1 };
    let minLon = Infinity, maxLon = -Infinity;
    let minLat = Infinity, maxLat = -Infinity;
    geoData.features.forEach(feature => {
      feature.geometry.coordinates.forEach(polygon => {
        polygon.forEach(ring => {
          ring.forEach(([lon, lat]) => {
            minLon = Math.min(minLon, lon);
            maxLon = Math.max(maxLon, lon);
            minLat = Math.min(minLat, lat);
            maxLat = Math.max(maxLat, lat);
          });
        });
      });
    });
    const lonPad = (maxLon - minLon) * 0.02;
    const latPad = (maxLat - minLat) * 0.02;
    return {
      minLon: minLon - lonPad, maxLon: maxLon + lonPad,
      minLat: minLat - latPad, maxLat: maxLat + latPad,
    };
  }, [geoData]);

  const svgWidth = 500;
  const lonRange = bounds.maxLon - bounds.minLon;
  const latRange = bounds.maxLat - bounds.minLat;
  const svgHeight = lonRange > 0 ? (latRange / lonRange) * svgWidth : svgWidth;

  // Build paths from GeoJSON
  const paths = useMemo(() => {
    if (!geoData) return [];
    return geoData.features.map((feature) => {
      const pathStrings: string[] = [];
      let mainRing: number[][] = [];

      feature.geometry.coordinates.forEach(polygon => {
        polygon.forEach(ring => {
          const p = coordsToPath(ring, bounds, svgWidth, svgHeight);
          if (p) pathStrings.push(p);
          if (ring.length > mainRing.length) mainRing = ring;
        });
      });

      const combinedPath = pathStrings.join(' ');
      const acNameNorm = normalizeConstName(feature.properties.AC_NAME || '');
      const matchedCandidates = constituencyMap.get(acNameNorm) || [];
      const winnerCandidate = matchedCandidates.find(c => c.name.includes('Winner') || (c as any).isWinner) || matchedCandidates[0];
      const party = winnerCandidate ? winnerCandidate.party : undefined;
      const centroid = getCentroid(mainRing, bounds, svgWidth, svgHeight);

      return {
        path: combinedPath,
        acNo: feature.properties.AC_NO,
        acName: feature.properties.AC_NAME,
        distName: feature.properties.DIST_NAME,
        pcName: feature.properties.PC_NAME,
        party,
        candidates: matchedCandidates,
        centroid,
      };
    });
  }, [geoData, bounds, svgWidth, svgHeight, constituencyMap]);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGPathElement>, feature: typeof paths[0]) => {
    if (isMobile || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setTooltip({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top - 12,
      acName: feature.acName,
      distName: feature.distName,
      pcName: feature.pcName,
      acNo: feature.acNo,
    });
    setHoveredAC(feature.acNo);
    // Update right panel on desktop hover
    if (feature.candidates.length > 0) {
      const totalAssets = feature.candidates.reduce((sum, c) => sum + c.netWorth, 0);
      const totalCases = feature.candidates.reduce((sum, c) => sum + c.caseCount, 0);
      const richest = [...feature.candidates].sort((a, b) => b.netWorth - a.netWorth)[0];
      const sortedCandidates = [...feature.candidates].sort((a, b) => {
        const aWinner = a.name.includes('Winner') || (a as any).isWinner;
        const bWinner = b.name.includes('Winner') || (b as any).isWinner;
        if (aWinner && !bWinner) return -1;
        if (!aWinner && bWinner) return 1;
        
        const aRunner = (a as any).isRunnerUp;
        const bRunner = (b as any).isRunnerUp;
        if (aRunner && !bRunner) return -1;
        if (!aRunner && bRunner) return 1;
        
        return 0;
      });
      const winner = sortedCandidates[0];
      
      setSelectedDetail({
        acName: feature.acName,
        distName: feature.distName,
        pcName: feature.pcName,
        acNo: feature.acNo,
        candidates: sortedCandidates,
        totalAssets,
        totalCases,
        richest,
        winner,
      });
    }
  }, [isMobile]);

  const handleMouseLeave = useCallback(() => {
    setTooltip(null);
    setHoveredAC(null);
  }, []);

  const handleClick = useCallback((feature: typeof paths[0]) => {
    if (feature.candidates.length > 0) {
      const totalAssets = feature.candidates.reduce((sum, c) => sum + c.netWorth, 0);
      const totalCases = feature.candidates.reduce((sum, c) => sum + c.caseCount, 0);
      const richest = [...feature.candidates].sort((a, b) => b.netWorth - a.netWorth)[0];
      const sortedCandidates = [...feature.candidates].sort((a, b) => {
        const aWinner = a.name.includes('Winner') || (a as any).isWinner;
        const bWinner = b.name.includes('Winner') || (b as any).isWinner;
        if (aWinner && !bWinner) return -1;
        if (!aWinner && bWinner) return 1;
        
        const aRunner = (a as any).isRunnerUp;
        const bRunner = (b as any).isRunnerUp;
        if (aRunner && !bRunner) return -1;
        if (!aRunner && bRunner) return 1;
        
        return 0;
      });
      const winner = sortedCandidates[0];
      
      setSelectedDetail({
        acName: feature.acName,
        distName: feature.distName,
        pcName: feature.pcName,
        acNo: feature.acNo,
        candidates: sortedCandidates,
        totalAssets,
        totalCases,
        richest,
        winner,
      });
    }
    if (onConstituencyClick) {
      onConstituencyClick(feature.acName);
    }
  }, [onConstituencyClick]);

  // Party legend with seat counts (winners only)
  const legendEntries = useMemo(() => {
    const partySeats = new Map<string, number>();
    
    if (resultsData.length > 0) {
      resultsData.forEach(result => {
        const party = result.winner?.party;
        if (party) {
          const shortName = getPartyShortName(party);
          partySeats.set(shortName, (partySeats.get(shortName) || 0) + 1);
        }
      });
    } else {
      paths.forEach(p => {
        if (p.party) {
          const shortName = getPartyShortName(p.party);
          partySeats.set(shortName, (partySeats.get(shortName) || 0) + 1);
        }
      });
    }
    
    // Sort by seat count descending
    return Array.from(partySeats.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, seats]) => ({ name, seats, color: getPartyFill(name) }));
  }, [paths, resultsData]);

  // Mobile floating badges: only constituencies with candidates
  const mobileBadges = useMemo(() => {
    if (!isMobile) return [];
    return paths.filter(p => p.candidates.length > 0).map(p => ({
      x: p.centroid[0],
      y: p.centroid[1],
      name: p.candidates[0].name,
      party: p.candidates[0].party,
      acName: p.acName,
      acNo: p.acNo,
      candidates: p.candidates,
    }));
  }, [paths, isMobile, lang]);

  if (loading) {
    return (
      <section className="py-16 text-center space-y-4 map-section">
        <Loader className="w-8 h-8 text-neutral-400 animate-spin mx-auto" />
        <p className="text-sm text-neutral-400 font-medium">
          {lang === 'en' ? 'Loading constituency map...' : 'தொகுதி வரைபடம் ஏற்றப்படுகிறது...'}
        </p>
      </section>
    );
  }

  if (!geoData) return null;

  return (
    <section ref={sectionRef} className="py-12 sm:py-16 map-section" id="constituency-map">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Section Header */}
        <div className="text-center space-y-3 mb-10">
          <div className="inline-flex items-center space-x-2 bg-neutral-100 border border-neutral-200/60 text-neutral-600 px-3 py-1.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest">
            <MapPin className="w-3 h-3" />
            <span>{lang === 'en' ? '234 Constituencies' : '234 தொகுதிகள்'}</span>
          </div>
          <h2 className="font-serif italic font-normal text-neutral-800 text-3xl sm:text-4xl md:text-5xl tracking-tight">
            {lang === 'en' ? 'Explore by Constituency' : 'தொகுதி வாரியாக ஆராயுங்கள்'}
          </h2>
          <p className="text-neutral-500 text-sm sm:text-base max-w-xl mx-auto">
            {lang === 'en'
              ? 'Interactive map of all Tamil Nadu assembly constituencies. Highlighted areas show where profiled candidates are contesting.'
              : 'தமிழ்நாடு சட்டமன்றத் தொகுதிகளின் ஊடாடும் வரைபடம். நிறம் கொடுக்கப்பட்ட பகுதிகள் நமது வேட்பாளர்கள் போட்டியிடும் தொகுதிகள்.'}
          </p>
        </div>

        {/* Map + Detail Panel Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Map */}
          <div
            ref={containerRef}
            className="lg:col-span-8 relative bg-gradient-to-br from-neutral-50 to-neutral-100/50 border border-neutral-200/60 rounded-3xl p-4 sm:p-6 overflow-hidden"
          >
            <svg
              ref={svgRef}
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto"
              style={{ maxHeight: '600px' }}
            >
              {paths.map((feature, idx) => (
                <path
                  key={`${feature.acNo}-${idx}`}
                  d={feature.path}
                  className="constituency-path cursor-pointer"
                  fill={
                    (hoveredAC === feature.acNo || selectedDetail?.acNo === feature.acNo)
                      ? (feature.party ? getPartyFill(feature.party) : '#94A3B8')
                      : feature.party
                        ? getPartyFill(feature.party)
                        : '#E2E8F0'
                  }
                  fillOpacity={
                    (hoveredAC === feature.acNo || selectedDetail?.acNo === feature.acNo)
                      ? 0.95
                      : feature.party ? 0.65 : 0.45
                  }
                  stroke={
                    (hoveredAC === feature.acNo || selectedDetail?.acNo === feature.acNo)
                      ? '#1E293B' : '#CBD5E1'
                  }
                  strokeWidth={
                    (hoveredAC === feature.acNo || selectedDetail?.acNo === feature.acNo)
                      ? 1.8 : 0.4
                  }
                  onMouseMove={(e) => handleMouseMove(e, feature)}
                  onMouseLeave={handleMouseLeave}
                  onClick={() => handleClick(feature)}
                />
              ))}
            </svg>

            {/* Desktop Tooltip */}
            {!isMobile && tooltip && (
              <div
                className="map-tooltip absolute z-50 bg-neutral-900 text-white px-4 py-3 rounded-xl shadow-xl text-xs pointer-events-none border border-neutral-700/50"
                style={{
                  left: Math.min(tooltip.x, (containerRef.current?.clientWidth || 400) - 200),
                  top: Math.max(tooltip.y - 70, 10),
                }}
              >
                <p className="font-bold text-sm text-white leading-tight">{tooltip.acName}</p>
                <div className="flex items-center space-x-2 mt-1.5 text-neutral-300">
                  <span className="font-mono text-[10px] bg-white/10 px-1.5 py-0.5 rounded">AC #{tooltip.acNo}</span>
                  <span className="font-medium">{tooltip.distName}</span>
                </div>
                <p className="text-neutral-400 text-[10px] mt-1 font-mono">PC: {tooltip.pcName}</p>
              </div>
            )}

            {/* Mobile Top-Left Floating Elements */}
            {isMobile && (
              <div className="absolute top-3 left-3 flex flex-col items-start space-y-2 z-20 pointer-events-none max-w-[85%]">
                {/* Mobile: Compact Party Legend */}
                {legendEntries.length > 0 && (
                  <div className="bg-white/95 backdrop-blur-md border border-neutral-200/80 rounded-full px-3 py-1.5 shadow-sm inline-block">
                    <div className="flex flex-wrap gap-x-2.5 gap-y-0.5">
                      {legendEntries.slice(0, 5).map((entry) => (
                        <span key={entry.name} className="inline-flex items-center space-x-1">
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                          <span className="text-[8px] font-bold text-neutral-600 tracking-tight">{entry.name} {entry.seats}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {/* Mobile Interaction hint */}
                <div className="flex items-center space-x-1.5 text-[9px] font-mono font-medium text-neutral-400 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full border border-neutral-200/80 shadow-sm inline-block">
                  <MousePointerClick className="w-2.5 h-2.5 inline-block mr-1 -mt-0.5" />
                  <span>{lang === 'en' ? 'Tap a badge to see details' : '\u0bb5\u0bbf\u0bb5\u0bb0\u0b99\u0bcd\u0b95\u0bb3\u0bcd \u0b95\u0bbe\u0ba3 \u0baa\u0bc7\u0b9f\u0bcd\u0b9c\u0bc8 \u0ba4\u0b9f\u0bcd\u0b9f\u0bc1\u0b95'}</span>
                </div>
              </div>
            )}

            {/* Desktop Interaction hint */}
            {!isMobile && (
              <div className="absolute bottom-3 right-3 flex items-center space-x-1.5 text-[10px] font-mono text-neutral-400 bg-white/80 backdrop-blur-sm px-2.5 py-1.5 rounded-lg border border-neutral-200/60 z-20">
                <MousePointerClick className="w-3 h-3" />
                <span>{lang === 'en' ? 'Hover or click a constituency' : '\u0ba4\u0bca\u0b95\u0bc1\u0ba4\u0bbf\u0baf\u0bbf\u0ba9\u0bcd \u0bae\u0bc0\u0ba4\u0bc1 \u0b9a\u0bc1\u0b9f\u0bcd\u0b9f\u0bbf\u0baf\u0bc8 \u0ba8\u0b95\u0bb0\u0bcd\u0ba4\u0bcd\u0ba4\u0bb5\u0bc1\u0bae\u0bcd'}</span>
              </div>
            )}

            {/* Mobile Floating Candidate Card */}
            {isMobile && selectedDetail && selectedDetail.candidates.length > 0 && (
              <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-md border border-neutral-200/80 rounded-2xl p-3.5 shadow-xl flex items-center justify-between animate-fade-in z-30">
                <div className="flex items-center space-x-3 max-w-[65%]">
                  {/* Floating Icon: Candidate Image / Party Circle */}
                  <div 
                    className="w-11 h-11 rounded-full overflow-hidden flex items-center justify-center text-white font-bold text-xs shrink-0 border-2 border-white shadow-md"
                    style={{ backgroundColor: getPartyFill(selectedDetail.candidates[0].party) }}
                  >
                    {selectedDetail.candidates[0].photo ? (
                      <img src={selectedDetail.candidates[0].photo.replace('images/', '/candidates/')} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    ) : (
                      selectedDetail.candidates[0].name.charAt(0)
                    )}
                  </div>
                  <div className="truncate">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[9px] font-mono font-bold text-white px-1.5 py-0.5 rounded" style={{ backgroundColor: getPartyFill(selectedDetail.candidates[0].party) }}>
                        {selectedDetail.candidates[0].party}
                      </span>
                      <span className="text-[10px] font-mono text-neutral-400 font-bold truncate">
                        {selectedDetail.acName}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-neutral-800 leading-tight mt-1 truncate">
                      {selectedDetail.candidates[0].name}
                    </h4>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSelectCandidate) {
                        onSelectCandidate(selectedDetail.candidates[0]);
                      }
                    }}
                    className="bg-neutral-900 hover:bg-neutral-800 active:scale-95 text-white font-mono text-[9px] font-bold px-3 py-2 rounded-xl shadow-sm transition-transform cursor-pointer"
                  >
                    {lang === 'en' ? 'CLICK HERE' : 'விவரங்கள்'}
                  </button>
                  <button
                    onClick={() => setSelectedDetail(null)}
                    className="w-6 h-6 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-400 hover:text-neutral-600 transition-colors active:scale-90"
                    title={lang === 'en' ? 'Close' : 'மூடு'}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel: Constituency Detail + Legend */}
          <div className="lg:col-span-4 space-y-4">
            {/* Active Constituency Detail Panel */}
            {selectedDetail ? (
              <div className="bg-white border border-neutral-200/60 rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.02)] animate-fade-in">
                {/* Detail Header */}
                <div className="bg-neutral-900 text-white p-5">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-[9px] font-mono bg-white/15 px-2 py-0.5 rounded tracking-wider uppercase">
                      AC #{selectedDetail.acNo}
                    </span>
                    <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-wider">
                      {selectedDetail.distName}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-lg leading-tight tracking-tight">
                    {selectedDetail.acName}
                  </h3>
                  <p className="text-neutral-400 text-[10px] font-mono mt-1">
                    PC: {selectedDetail.pcName}
                  </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-px bg-neutral-100">
                  <div className="bg-white p-4 text-center">
                    <Users className="w-4 h-4 text-neutral-400 mx-auto mb-1.5" />
                    <p className="text-lg font-black font-mono text-neutral-900">{selectedDetail.candidates.length}</p>
                    <p className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest mt-0.5">
                      {lang === 'en' ? 'Candidates' : 'வேட்பாளர்கள்'}
                    </p>
                  </div>
                  <div className="bg-white p-4 text-center">
                    <Landmark className="w-4 h-4 text-neutral-400 mx-auto mb-1.5" />
                    <p className="text-sm font-black font-mono text-neutral-900">{FORMAT_CURRENCY(selectedDetail.totalAssets, lang)}</p>
                    <p className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest mt-0.5">
                      {lang === 'en' ? 'Total Assets' : 'மொத்த சொத்து'}
                    </p>
                  </div>
                  <div className="bg-white p-4 text-center">
                    {selectedDetail.totalCases > 0 ? (
                      <ShieldAlert className="w-4 h-4 text-red-500 mx-auto mb-1.5" />
                    ) : (
                      <ShieldCheck className="w-4 h-4 text-emerald-500 mx-auto mb-1.5" />
                    )}
                    <p className={`text-lg font-black font-mono ${selectedDetail.totalCases > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {selectedDetail.totalCases}
                    </p>
                    <p className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest mt-0.5">
                      {lang === 'en' ? 'Pending Cases' : 'நிலுவை வழக்கு'}
                    </p>
                  </div>
                  <div className="bg-white p-4 text-center">
                    <Trophy className="w-4 h-4 text-amber-500 mx-auto mb-1.5" />
                    <p className="text-xs font-bold text-neutral-900 leading-tight truncate" title={selectedDetail.winner ? `${selectedDetail.winner.name} (${selectedDetail.winner.party})` : '—'}>
                      {selectedDetail.winner ? `${selectedDetail.winner.name} (${selectedDetail.winner.party})` : '—'}
                    </p>
                    <p className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest mt-0.5">
                      {lang === 'en' ? 'Winner' : 'வெற்றியாளர்'}
                    </p>
                  </div>
                </div>

                {/* Winner & Runner Up (Replaces Candidate List) */}
                <div className="p-4 space-y-3 border-t border-neutral-100">
                  <h4 className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest">
                    {lang === 'en' ? 'Election Results' : 'தேர்தல் முடிவுகள்'}
                  </h4>
                  
                  {selectedDetail.candidates.length > 0 ? (
                    <div className="flex flex-col space-y-3">
                      {/* Winner */}
                      <div className="flex items-center justify-between bg-emerald-50/50 rounded-xl p-3 border border-emerald-100/80">
                        <div className="flex items-center space-x-3">
                           <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 border-2 border-white shadow-sm overflow-hidden" style={{ backgroundColor: getPartyFill(selectedDetail.candidates[0].party) }}>
                             {selectedDetail.candidates[0].photo ? (
                               <img src={selectedDetail.candidates[0].photo.replace('images/', '/candidates/')} alt={selectedDetail.candidates[0].name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                             ) : (
                               selectedDetail.candidates[0].name.charAt(0)
                             )}
                           </div>
                           <div>
                             <p className="text-[9px] font-mono font-bold text-emerald-600 uppercase tracking-widest mb-0.5">{lang === 'en' ? 'Winner' : 'வெற்றியாளர்'}</p>
                             <p className="text-xs font-bold text-neutral-900 leading-tight">{selectedDetail.candidates[0].name}</p>
                             <p className="text-[9px] text-neutral-500 font-mono mt-0.5">{selectedDetail.candidates[0].party}</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="text-xs font-bold font-mono text-neutral-800">{selectedDetail.candidates[0].votes?.toLocaleString('en-IN') || 'TBA'}</p>
                           <p className="text-[8px] text-neutral-400 uppercase tracking-widest">{lang === 'en' ? 'Votes' : 'வாக்குகள்'}</p>
                        </div>
                      </div>

                      {/* Runner Up */}
                      {selectedDetail.candidates.length > 1 && (
                        <div className="flex items-center justify-between bg-neutral-50 rounded-xl p-3 border border-neutral-200/80">
                          <div className="flex items-center space-x-3">
                             <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 border-2 border-white shadow-sm overflow-hidden" style={{ backgroundColor: getPartyFill(selectedDetail.candidates[1].party) }}>
                               {selectedDetail.candidates[1].photo ? (
                                 <img src={selectedDetail.candidates[1].photo.replace('images/', '/candidates/')} alt={selectedDetail.candidates[1].name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                               ) : (
                                 selectedDetail.candidates[1].name.charAt(0)
                               )}
                             </div>
                             <div>
                               <p className="text-[9px] font-mono font-bold text-neutral-500 uppercase tracking-widest mb-0.5">{lang === 'en' ? 'Runner Up' : 'இரண்டாம் இடம்'}</p>
                               <p className="text-xs font-bold text-neutral-900 leading-tight">{selectedDetail.candidates[1].name}</p>
                               <p className="text-[9px] text-neutral-500 font-mono mt-0.5">{selectedDetail.candidates[1].party}</p>
                             </div>
                          </div>
                          <div className="text-right">
                             <p className="text-xs font-bold font-mono text-neutral-800">{selectedDetail.candidates[1].votes?.toLocaleString('en-IN') || 'TBA'}</p>
                             <p className="text-[8px] text-neutral-400 uppercase tracking-widest">{lang === 'en' ? 'Votes' : 'வாக்குகள்'}</p>
                          </div>
                        </div>
                      )}

                      {/* Vote Margin */}
                      {selectedDetail.candidates.length > 1 && (
                        <div className="flex items-center justify-between bg-indigo-50/50 rounded-xl p-3 border border-indigo-100">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-700">{lang === 'en' ? 'Vote Margin' : 'வாக்கு வித்தியாசம்'}</span>
                          <span className="text-xs font-black font-mono text-indigo-900">
                            {selectedDetail.candidates[0].voteMargin ? Math.abs(selectedDetail.candidates[0].voteMargin).toLocaleString('en-IN') : 'TBA'}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                     <p className="text-xs text-neutral-500">{lang === 'en' ? 'Results pending' : 'முடிவுகள் நிலுவையில் உள்ளன'}</p>
                  )}
                </div>
              </div>
            ) : (
              /* Empty state — no constituency selected */
              <div className="bg-white border border-neutral-200/60 rounded-2xl p-8 text-center shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
                <MapPin className="w-10 h-10 text-neutral-200 mx-auto mb-3" />
                <h4 className="font-display font-bold text-neutral-800 text-sm mb-1">
                  {lang === 'en' ? 'Select a Constituency' : 'ஒரு தொகுதியை தேர்வுசெய்க'}
                </h4>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  {lang === 'en'
                    ? 'Hover over or click any highlighted constituency on the map to see candidate details, total assets, and pending cases.'
                    : 'வேட்பாளர் விவரங்கள், மொத்த சொத்துக்கள், நிலுவை வழக்குகளைப் பார்க்க வரைபடத்தில் ஒரு தொகுதியை கிளிக் செய்யுங்கள்.'}
                </p>
              </div>
            )}

            {/* Party Color Legend */}
            {legendEntries.length > 0 && (
              <div className="hidden sm:block bg-white border border-neutral-200/60 rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
                <h4 className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest mb-3">
                  {lang === 'en' ? 'Party Seats Won' : 'கட்சி வாரியாக இடங்கள்'}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {legendEntries.map((entry) => (
                    <div
                      key={entry.name}
                      className="flex items-center space-x-1.5 bg-neutral-50 border border-neutral-100 rounded-lg px-2.5 py-1.5"
                    >
                      <div
                        className="w-3 h-3 rounded-sm shrink-0"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-[10px] font-bold text-neutral-700">{entry.name}</span>
                      <span className="text-[10px] font-mono font-bold text-neutral-400">{entry.seats}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </section>
  );
}
