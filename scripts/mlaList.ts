// scripts/mlaList.ts
import fs from 'fs';
import path from 'path';

export interface Mla {
  id: string;
  name: string;
  constituency: string;
  party: string;
}

export function getMlaList(): Mla[] {
  const filePath = path.join(process.cwd(), 'src', 'data', 'all_candidates.json');
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  
  const map = new Map<string, any[]>();
  data.forEach((c: any) => {
    const k = c.constituency;
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(c);
  });

  const winners: Mla[] = [];
  map.forEach(cands => {
    cands.sort((a, b) => {
      const aWinner = a.name.includes('Winner') || a.isWinner;
      const bWinner = b.name.includes('Winner') || b.isWinner;
      if (aWinner && !bWinner) return -1;
      if (!aWinner && bWinner) return 1;
      
      const aRunner = a.isRunnerUp;
      const bRunner = b.isRunnerUp;
      if (aRunner && !bRunner) return -1;
      if (!aRunner && bRunner) return 1;

      const aVotes = a.votes || 0;
      const bVotes = b.votes || 0;
      return bVotes - aVotes;
    });
    
    const top = cands[0];
    winners.push({
      id: top.id,
      name: top.name,
      constituency: top.constituency,
      party: top.party || 'IND'
    });
  });
  
  return winners;
}


