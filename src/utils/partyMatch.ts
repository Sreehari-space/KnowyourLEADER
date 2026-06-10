export const isPartyMatch = (candidateParty: string, searchKey: string): boolean => {
  if (!candidateParty || !searchKey) return false;
  const p = candidateParty.trim().toUpperCase();
  const s = searchKey.trim().toUpperCase();

  // Exact match
  if (p === s) return true;

  // Specific Party Overrides
  if (s === 'TVK' && (p.includes('TAMILAGA VETTRI') || p.includes('VETTRI KAZHAGAM'))) return true;
  
  if (s === 'AIADMK' && p.includes('ALL INDIA ANNA DRAVIDA')) return true;
  
  // Ensure DMK doesn't accidentally match AIADMK (All India Anna Dravida Munnetra Kazhagam)
  if (s === 'DMK' && p.includes('DRAVIDA MUNNETRA KAZHAGAM') && !p.includes('ALL INDIA')) return true;

  if (s === 'BJP' && p.includes('BHARATIYA JANATA')) return true;
  if (s === 'INC' && p.includes('INDIAN NATIONAL CONGRESS')) return true;
  if (s === 'NTK' && p.includes('NAAM TAMILAR')) return true;
  if (s === 'VCK' && p.includes('VIDUTHALAI CHIRUTHAIGAL')) return true;
  if (s === 'PMK' && p.includes('PATTALI MAKKAL')) return true;
  if (s === 'IUML' && p.includes('MUSLIM LEAGUE')) return true;

  // Ensure CPI(M) and CPI don't collide
  if ((s === 'CPI(M)' || s === 'CPIM') && (p === 'CPI(M)' || p === 'CPIM' || p.includes('MARXIST'))) return true;
  if (s === 'CPI' && p.includes('COMMUNIST PARTY OF INDIA') && !p.includes('MARXIST')) return true;

  if (s === 'DMDK' && p.includes('DESIYA MURPOKKU')) return true;
  
  // Fallback: check if the search key exists as an isolated word (prevents 'DMK' matching inside 'AIADMK')
  // We use word boundaries \b, but since parentheses might break \b, we wrap it safely.
  try {
    const regex = new RegExp(`\\b${s}\\b`, 'i');
    if (regex.test(p)) return true;
  } catch (e) {
    // Ignore invalid regex
  }

  return false;
};
