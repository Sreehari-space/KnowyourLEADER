/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Search, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Candidate, FontSizeSetting, LanguageSetting } from '../types';
import MlaTimelineModal from '../components/MlaTimelineModal';

interface MlaWatchProps {
  candidates: Candidate[];
  lang: LanguageSetting;
  fontSize: FontSizeSetting;
}

const ITEMS_PER_PAGE = 24;

export default function MlaWatch({ candidates, lang, fontSize }: MlaWatchProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Find active MLA based on URL params
  const activeMla = useMemo(() => {
    if (!id || candidates.length === 0) return null;
    return candidates.find(c => c.id === id) || null;
  }, [id, candidates]);

  const handleOpenMla = (mla: Candidate) => {
    navigate(`/mla-watch/${mla.id}`);
  };

  const handleCloseModal = () => {
    navigate('/mla-watch');
  };

  // Reset to first page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Determine the 234 winners by grouping candidates by constituency
  const winnerCandidates = useMemo(() => {
    if (candidates.length === 0) return [];
    
    // Group by constituency
    const map = new Map<string, Candidate[]>();
    candidates.forEach(c => {
      const k = c.constituency;
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(c);
    });

    const winners: Candidate[] = [];
    map.forEach(cands => {
      // Sort to find the winner for this constituency
      cands.sort((a, b) => {
        const aWinner = a.name.includes('Winner') || (a as any).isWinner;
        const bWinner = b.name.includes('Winner') || (b as any).isWinner;
        if (aWinner && !bWinner) return -1;
        if (!aWinner && bWinner) return 1;
        
        // Fallback to runner up or raw votes
        const aRunner = (a as any).isRunnerUp;
        const bRunner = (b as any).isRunnerUp;
        if (aRunner && !bRunner) return -1;
        if (!aRunner && bRunner) return 1;

        const aVotes = a.votes || 0;
        const bVotes = b.votes || 0;
        return bVotes - aVotes;
      });
      winners.push(cands[0]);
    });
    
    return winners;
  }, [candidates]);

  // Filter the 234 winners based on search query
  const filteredMlas = useMemo(() => {
    return winnerCandidates.filter(mla => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        (mla.name?.toLowerCase().includes(q)) ||
        (mla.constituency?.toLowerCase().includes(q)) ||
        (mla.party?.toLowerCase().includes(q))
      );
    });
  }, [winnerCandidates, searchQuery]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredMlas.length / ITEMS_PER_PAGE);
  const currentMlas = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredMlas.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredMlas, currentPage]);

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  return (
    <div className="w-full min-h-screen bg-[#FCFBF9]">
      <Helmet>
        <title>{lang === 'en' ? 'MLA Watch - TN Leaders' : 'எம்எல்ஏ கண்காணிப்பு - TN Leaders'}</title>
      </Helmet>

      {/* Header Section */}
      <div className="bg-neutral-900 text-white pt-24 pb-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center space-y-6">
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight mt-4">
            {lang === 'en' ? 'MLA Watch' : 'எம்எல்ஏ கண்காணிப்பு'}
          </h1>
          <p className="text-neutral-400 max-w-2xl text-lg sm:text-xl">
            {lang === 'en' 
              ? 'Track the major events, statements, and developments of our Assembly Members after the elections.'
              : 'தேர்தலுக்குப் பிறகு சட்டமன்ற உறுப்பினர்களின் முக்கிய நிகழ்வுகள், அறிக்கைகள் மற்றும் முன்னேற்றங்களைக் கண்காணிக்கவும்.'}
          </p>
          
          <div className="w-full max-w-2xl mt-8 relative">
            <input
              type="text"
              placeholder={lang === 'en' ? 'Search MLA name, constituency, or party...' : 'எம்.எல்.ஏ பெயர், தொகுதி அல்லது கட்சியைத் தேடுங்கள்...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-800 border-none rounded-full py-4 pl-12 pr-6 text-base sm:text-sm text-white placeholder:text-neutral-500 focus:ring-2 focus:ring-indigo-500 transition-all"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
          </div>
        </div>
      </div>

      {/* Grid Section */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <div className="mb-6 flex justify-between items-center px-2">
          <h2 className="text-xl font-bold text-neutral-800 flex items-center">
            {lang === 'en' ? 'All 234 Representatives' : 'அனைத்து 234 பிரதிநிதிகள்'}
            <span className="ml-3 text-sm font-normal text-neutral-500 bg-neutral-100 px-3 py-1 rounded-full">
              {filteredMlas.length} {lang === 'en' ? 'found' : 'முடிவுகள்'}
            </span>
          </h2>
          
          {/* Top Pagination Controls */}
          {totalPages > 1 && (
            <div className="hidden sm:flex items-center space-x-2">
              <button 
                onClick={handlePrevPage} 
                disabled={currentPage === 1}
                className="p-2 rounded-full border border-neutral-200 text-neutral-600 disabled:opacity-30 hover:bg-neutral-100 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium text-neutral-500">
                {currentPage} / {totalPages}
              </span>
              <button 
                onClick={handleNextPage} 
                disabled={currentPage === totalPages}
                className="p-2 rounded-full border border-neutral-200 text-neutral-600 disabled:opacity-30 hover:bg-neutral-100 transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {filteredMlas.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <AlertCircle className="w-12 h-12 text-neutral-300 mb-4" />
            <h3 className="text-xl font-bold text-neutral-700 mb-2">
              {lang === 'en' ? 'No candidates found' : 'எந்த வேட்பாளரும் கிடைக்கவில்லை'}
            </h3>
            <p className="text-neutral-500 max-w-md">
              {lang === 'en' ? 'Try adjusting your search criteria.' : 'உங்கள் தேடல் அளவுகோலை சரிசெய்ய முயற்சிக்கவும்.'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {currentMlas.map(mla => (
                <div 
                  key={mla.id}
                  onClick={() => handleOpenMla(mla)}
                  className="bg-white rounded-2xl border border-neutral-100 p-5 hover:border-indigo-200 hover:shadow-lg transition-all cursor-pointer group flex flex-col items-center text-center"
                >
                  <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-neutral-50 mb-4 group-hover:border-indigo-50 transition-colors flex items-center justify-center bg-neutral-100 text-neutral-400 font-bold text-2xl">
                    {mla.photo ? (
                      <img 
                        src={mla.photo.replace('images/', '/candidates/')} 
                        alt={mla.name} 
                        className="w-full h-full object-cover" 
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} 
                      />
                    ) : (
                      mla.name.charAt(0)
                    )}
                  </div>
                  <h3 className="text-lg font-black text-neutral-900 leading-tight mb-1 group-hover:text-indigo-600 transition-colors">
                    {mla.name}
                  </h3>
                  <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
                    {mla.party}
                  </span>
                  <div className="w-full bg-neutral-50 rounded-lg py-2 mt-auto">
                    <span className="text-sm font-medium text-neutral-600">{mla.constituency}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-10 flex justify-center items-center space-x-6">
                <button 
                  onClick={handlePrevPage} 
                  disabled={currentPage === 1}
                  className="px-6 py-3 rounded-xl border border-neutral-200 text-neutral-600 font-bold disabled:opacity-30 hover:bg-neutral-100 hover:text-neutral-900 transition-all flex items-center space-x-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>{lang === 'en' ? 'Previous' : 'முந்தைய'}</span>
                </button>
                <span className="text-sm font-medium text-neutral-500 hidden sm:block">
                  Page {currentPage} of {totalPages}
                </span>
                <button 
                  onClick={handleNextPage} 
                  disabled={currentPage === totalPages}
                  className="px-6 py-3 rounded-xl border border-neutral-200 text-neutral-600 font-bold disabled:opacity-30 hover:bg-neutral-100 hover:text-neutral-900 transition-all flex items-center space-x-2"
                >
                  <span>{lang === 'en' ? 'Next' : 'அடுத்த'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal */}
      {activeMla && (
        <MlaTimelineModal
          candidate={activeMla}
          lang={lang}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
