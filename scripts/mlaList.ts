// scripts/mlaList.ts
//
// The list of sitting MLAs used by the news pipeline.
//
// This previously grouped candidates by constituency and took whichever record
// sorted first. `isWinner` is missing for 75 of the 234 seats, so that picked a
// losing candidate roughly a third of the time — and the pipeline then fetched
// and published news about the wrong person under that seat.
//
// The declared results are the source of truth. Seats whose winner cannot be
// matched to an affidavit record are still returned (so they are visible), but
// with a null id so downstream code can skip them rather than guess.

import fs from 'fs';
import path from 'path';
import { resolveMlas, ElectionResult } from '../src/utils/winners.js';

export interface Mla {
  id: string | null;
  name: string;
  constituency: string;
  party: string;
  constituencyNo: number;
}

export function getMlaList(): Mla[] {
  const root = process.cwd();
  const candidates = JSON.parse(
    fs.readFileSync(path.join(root, 'src', 'data', 'all_candidates.json'), 'utf-8')
  );
  const results: ElectionResult[] = JSON.parse(
    fs.readFileSync(path.join(root, 'public', 'results.json'), 'utf-8')
  );

  const resolved = resolveMlas(candidates, results);

  const unmatched = resolved.filter(m => !m.candidate).length;
  if (unmatched) {
    console.warn(`[mlaList] ${unmatched} of ${resolved.length} winners could not be matched to an affidavit record.`);
  }

  return resolved.map(m => ({
    id: m.candidate ? m.candidate.id : null,
    name: m.name,
    constituency: m.constituency,
    party: m.party || 'IND',
    constituencyNo: m.constituencyNo,
  }));
}
