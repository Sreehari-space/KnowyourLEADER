/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * MLA Watch — the 234 sitting members, and what has been recorded about each
 * since the election.
 *
 * The timelines are produced by the nightly Gemini pipeline. When that pipeline
 * has not run with working API keys every timeline is empty, so this page reads
 * the generated index up front and says so plainly: cards show an activity
 * count, and a banner appears when nothing has been recorded at all. Sending
 * people to click through 234 cards into empty modals would be worse than
 * admitting the feature has no data yet.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDocumentMeta } from '../utils/documentMeta';
import { Search, AlertCircle, ChevronLeft, ChevronRight, Loader2, Activity, X } from 'lucide-react';
import { Candidate, FontSizeSetting, LanguageSetting } from '../types';
import MlaTimelineModal from '../components/MlaTimelineModal';
import { resolveMlas, ResolvedMla, ElectionResult } from '../utils/winners';

interface MlaWatchProps {
  candidates: Candidate[];
  lang: LanguageSetting;
  fontSize: FontSizeSetting;
}

const ITEMS_PER_PAGE = 24;

const routeKeyFor = (mla: ResolvedMla<Candidate>) =>
  mla.candidate ? mla.candidate.id : `seat-${mla.constituencyNo}`;

const PARTY_TINT: Record<string, string> = {
  DMK: 'bg-red-600', AIADMK: 'bg-emerald-600', BJP: 'bg-amber-500',
  NTK: 'bg-yellow-500', INC: 'bg-blue-600', TVK: 'bg-violet-600',
  VCK: 'bg-purple-700', PMK: 'bg-yellow-600', IND: 'bg-teal-600',
};
const tintFor = (party: string) => {
  const p = (party || '').toUpperCase();
  for (const [k, v] of Object.entries(PARTY_TINT)) if (p === k || p.includes(k)) return v;
  return 'bg-neutral-800';
};

interface WatchIndexRow { mla_id: string; event_count: number; latest_event_date: string | null }

export default function MlaWatch({ candidates, lang }: MlaWatchProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [results, setResults] = useState<ElectionResult[] | null>(null);
  const [resultsError, setResultsError] = useState(false);
  const [watchIndex, setWatchIndex] = useState<Map<string, WatchIndexRow>>(new Map());

  useEffect(() => {
    let cancelled = false;
    fetch('/results.json')
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((data) => { if (!cancelled) setResults(data); })
      .catch((err) => {
        console.error('[MlaWatch] Could not load results.json:', err);
        if (!cancelled) setResultsError(true);
      });
    return () => { cancelled = true; };
  }, []);

  // Activity counts, so a card can say whether there is anything behind it.
  useEffect(() => {
    let cancelled = false;
    fetch('/data/mla-watch/_index.json')
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: WatchIndexRow[]) => {
        if (!cancelled && Array.isArray(rows)) {
          setWatchIndex(new Map(rows.map((r) => [r.mla_id, r])));
        }
      })
      .catch(() => { /* activity counts are a nicety; the roster still renders */ });
    return () => { cancelled = true; };
  }, []);

  const mlas = useMemo(() => {
    if (!results || candidates.length === 0) return [];
    return resolveMlas(candidates, results);
  }, [candidates, results]);

  const activeMla = useMemo(() => {
    if (!id || !mlas.length) return null;
    return mlas.find((m) => routeKeyFor(m) === id) || null;
  }, [id, mlas]);

  const eventsFor = (mla: ResolvedMla<Candidate>) =>
    watchIndex.get(routeKeyFor(mla))?.event_count ?? 0;

  const totalEvents = useMemo(
    () => [...watchIndex.values()].reduce((n, r) => n + (r.event_count || 0), 0),
    [watchIndex]
  );

  useEffect(() => { setCurrentPage(1); }, [searchQuery]);

  const filteredMlas = useMemo(() => {
    if (!searchQuery) return mlas;
    const q = searchQuery.toLowerCase();
    return mlas.filter((m) =>
      m.name.toLowerCase().includes(q) ||
      m.constituency.toLowerCase().includes(q) ||
      m.district.toLowerCase().includes(q) ||
      m.party.toLowerCase().includes(q));
  }, [mlas, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredMlas.length / ITEMS_PER_PAGE));
  const currentMlas = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredMlas.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredMlas, currentPage]);

  const goPage = (n: number) => {
    setCurrentPage(Math.min(totalPages, Math.max(1, n)));
    window.scrollTo({ top: 320, behavior: 'smooth' });
  };

  const loading = !results && !resultsError;

  useDocumentMeta({
    title: lang === 'en' ? 'MLA Watch - TN Leaders' : 'எம்எல்ஏ கண்காணிப்பு - TN Leaders',
    description: lang === 'en'
      ? 'The 234 members elected to the Tamil Nadu assembly, with what has been recorded about each since the result.'
      : 'தமிழ்நாடு சட்டமன்றத்திற்குத் தேர்ந்தெடுக்கப்பட்ட 234 உறுப்பினர்கள் மற்றும் அவர்களைப் பற்றி பதிவான தகவல்கள்.',
    canonical: 'https://tn-leaders.pages.dev/mla-watch',
  });

  return (
    <div className="w-full min-h-screen bg-[#FCFBF9]">
      {/* Hero */}
      <div className="bg-[#050505] text-white relative overflow-hidden">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-3/4 max-w-2xl h-[280px] bg-gradient-to-r from-indigo-500/20 via-fuchsia-500/10 to-amber-400/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 md:px-8 pt-10 pb-10 sm:pt-14 sm:pb-14 relative z-10">
          <div className="max-w-2xl space-y-4">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-widest text-indigo-300 bg-indigo-500/10 border border-indigo-400/20 rounded-full px-3 py-1.5">
              {lang === 'en' ? 'after the result' : 'முடிவுக்குப் பிறகு'}
            </span>
            <h1 className="text-3xl sm:text-5xl font-display font-black tracking-tight leading-[1.05]">
              {lang === 'en' ? (
                <>who actually{' '}
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-amber-300">won.</span>
                </>
              ) : (
                <>யார் <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-amber-300">வென்றார்கள்.</span></>
              )}
            </h1>
            <p className="text-sm sm:text-base text-neutral-400 leading-relaxed">
              {lang === 'en'
                ? 'All 234 members of the Tamil Nadu assembly, the seat each holds and the margin they won it by — with anything recorded about them since.'
                : 'தமிழ்நாடு சட்டமன்றத்தின் 234 உறுப்பினர்கள், அவர்களின் தொகுதி மற்றும் வெற்றி வித்தியாசம்.'}
            </p>
          </div>

          {/* Stat strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 mt-8">
            {[
              { v: '234', l: lang === 'en' ? 'seats' : 'தொகுதிகள்' },
              { v: mlas.length ? String(new Set(mlas.map((m) => m.party)).size) : '—', l: lang === 'en' ? 'parties represented' : 'கட்சிகள்' },
              { v: totalEvents.toLocaleString('en-IN'), l: lang === 'en' ? 'events recorded' : 'பதிவான நிகழ்வுகள்' },
            ].map((s) => (
              <div key={s.l} className="bg-white/[0.03] border border-white/10 rounded-2xl p-3.5 sm:p-4">
                <p className="text-xl sm:text-2xl font-black font-mono tracking-tight tabular-nums">{s.v}</p>
                <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-500 mt-1">{s.l}</p>
              </div>
            ))}
          </div>

          {/* Search */}
          <div className="w-full max-w-xl mt-6 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              placeholder={lang === 'en' ? 'Search name, seat, district or party…' : 'பெயர், தொகுதி அல்லது கட்சியைத் தேடுங்கள்…'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/[0.06] border border-white/10 rounded-2xl py-3 pl-11 pr-10 text-base sm:text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/25 transition-colors"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} aria-label="Clear" className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 sm:py-10">
        {/* No timelines yet — say so rather than let people click into nothing. */}
        {!loading && !resultsError && watchIndex.size > 0 && totalEvents === 0 && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <Activity className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-black text-amber-900 text-sm">
                {lang === 'en' ? 'No activity recorded yet' : 'இதுவரை நிகழ்வுகள் பதிவாகவில்லை'}
              </h3>
              <p className="text-[13px] text-amber-800/90 leading-relaxed mt-0.5">
                {lang === 'en'
                  ? 'The roster below is complete and accurate. The news timelines are built by a nightly job that has not produced any entries yet, so every timeline is currently empty.'
                  : 'கீழே உள்ள பட்டியல் முழுமையானது. செய்திக் காலவரிசைகள் இரவு வேலையால் உருவாக்கப்படுகின்றன; இதுவரை எதுவும் பதிவாகவில்லை.'}
              </p>
            </div>
          </div>
        )}

        <div className="mb-4 sm:mb-6 flex justify-between items-center gap-3">
          <h2 className="text-lg sm:text-xl font-display font-black text-neutral-900 flex items-center flex-wrap gap-2">
            {lang === 'en' ? 'Sitting members' : 'சட்டமன்ற உறுப்பினர்கள்'}
            <span className="text-xs font-mono font-bold text-neutral-500 bg-neutral-100 px-2.5 py-1 rounded-full">
              {filteredMlas.length}
            </span>
          </h2>
          {totalPages > 1 && (
            <div className="hidden sm:flex items-center gap-2 shrink-0">
              <button onClick={() => goPage(currentPage - 1)} disabled={currentPage === 1} aria-label={lang === 'en' ? 'Previous page' : 'முந்தைய'}
                className="p-2 rounded-full border border-neutral-200 text-neutral-600 disabled:opacity-30 hover:bg-neutral-100 transition-all">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono text-neutral-500 tabular-nums">{currentPage} / {totalPages}</span>
              <button onClick={() => goPage(currentPage + 1)} disabled={currentPage === totalPages} aria-label={lang === 'en' ? 'Next page' : 'அடுத்த'}
                className="p-2 rounded-full border border-neutral-200 text-neutral-600 disabled:opacity-30 hover:bg-neutral-100 transition-all">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-center space-y-4">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            <p className="text-neutral-500 font-medium">{lang === 'en' ? 'Loading members…' : 'உறுப்பினர்கள் ஏற்றப்படுகிறது…'}</p>
          </div>
        ) : resultsError ? (
          <EmptyState
            title={lang === 'en' ? 'Could not load election results' : 'தேர்தல் முடிவுகளை ஏற்ற முடியவில்லை'}
            body={lang === 'en'
              ? 'The list of sitting members is built from the declared results, which failed to load. Please refresh.'
              : 'அறிவிக்கப்பட்ட முடிவுகளிலிருந்து பட்டியல் உருவாக்கப்படுகிறது. பக்கத்தைப் புதுப்பிக்கவும்.'}
            tone="error"
          />
        ) : filteredMlas.length === 0 ? (
          <EmptyState
            title={lang === 'en' ? 'Nobody matches that search' : 'பொருத்தமான முடிவுகள் இல்லை'}
            body={lang === 'en' ? 'Try a different name, seat or party.' : 'வேறு பெயர் அல்லது கட்சியை முயற்சிக்கவும்.'}
          />
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {currentMlas.map((mla) => {
                const photo = mla.candidate?.photo?.replace('images/', '/candidates/');
                const events = eventsFor(mla);
                return (
                  <button
                    type="button"
                    key={routeKeyFor(mla)}
                    onClick={() => navigate(`/mla-watch/${routeKeyFor(mla)}`)}
                    className="group bg-white rounded-3xl border border-neutral-200/80 overflow-hidden hover:border-neutral-300 hover:shadow-lg transition-all text-left focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  >
                    <div className={`h-1.5 w-full ${tintFor(mla.party)}`} />
                    <div className="p-3.5 sm:p-5 flex flex-col items-center text-center">
                      <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden ring-4 ring-white shadow-md mb-3 flex items-center justify-center text-white text-xl font-black shrink-0 ${tintFor(mla.party)}`}>
                        {photo ? (
                          <img src={photo} alt={mla.name} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        ) : mla.name.charAt(0)}
                      </div>
                      <h3 className="text-[13px] sm:text-base font-display font-black text-neutral-900 leading-tight tracking-tight break-words">
                        {mla.name}
                      </h3>
                      <span className="mt-1.5 text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-500 bg-neutral-100 rounded-full px-2 py-0.5">
                        {mla.party}
                      </span>
                      <span className="mt-2 text-[11px] sm:text-xs font-semibold text-neutral-600 break-words">
                        {mla.constituency}
                      </span>
                      <span className="mt-1 text-[10px] font-mono text-neutral-400 tabular-nums">
                        +{mla.margin.toLocaleString('en-IN')} {lang === 'en' ? 'votes' : 'வாக்குகள்'}
                      </span>
                      <span className={`mt-3 inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-widest rounded-full px-2 py-1 ${
                        events > 0 ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-neutral-50 text-neutral-400 border border-neutral-100'
                      }`}>
                        <Activity className="w-3 h-3" />
                        {events > 0
                          ? `${events} ${lang === 'en' ? 'recorded' : 'நிகழ்வு'}`
                          : (lang === 'en' ? 'no activity' : 'பதிவில்லை')}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="mt-8 sm:mt-10 flex justify-center items-center gap-3 sm:gap-6">
                <button onClick={() => goPage(currentPage - 1)} disabled={currentPage === 1}
                  className="px-5 py-3 rounded-2xl border border-neutral-200 text-neutral-700 font-bold text-sm disabled:opacity-30 hover:bg-neutral-100 transition-all flex items-center gap-2">
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">{lang === 'en' ? 'Previous' : 'முந்தைய'}</span>
                </button>
                <span className="text-xs font-mono text-neutral-500 tabular-nums">{currentPage} / {totalPages}</span>
                <button onClick={() => goPage(currentPage + 1)} disabled={currentPage === totalPages}
                  className="px-5 py-3 rounded-2xl border border-neutral-200 text-neutral-700 font-bold text-sm disabled:opacity-30 hover:bg-neutral-100 transition-all flex items-center gap-2">
                  <span className="hidden sm:inline">{lang === 'en' ? 'Next' : 'அடுத்த'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {activeMla && (
        <MlaTimelineModal mla={activeMla} lang={lang} onClose={() => navigate('/mla-watch')} />
      )}
    </div>
  );
}

const EmptyState: React.FC<{ title: string; body: string; tone?: 'error' }> = ({ title, body, tone }) => (
  <div className="py-16 sm:py-20 flex flex-col items-center justify-center text-center">
    <AlertCircle className={`w-12 h-12 mb-4 ${tone === 'error' ? 'text-rose-300' : 'text-neutral-300'}`} />
    <h3 className="text-lg font-display font-black text-neutral-800 mb-1.5">{title}</h3>
    <p className="text-sm text-neutral-500 max-w-md leading-relaxed">{body}</p>
  </div>
);
