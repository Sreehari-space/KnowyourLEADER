/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Candidate } from '../types';

// Data is now loaded asynchronously from public/merged_candidates.json
export const INITIAL_CANDIDATES: Candidate[] = [];

export const FORMAT_CURRENCY = (value: number, lang: 'en' | 'ta' = 'en'): string => {
  if (value === 0) return lang === 'en' ? 'Nil' : 'ஏதுமில்லை';
  
  if (lang === 'ta') {
    // Tamil style currency notation (Crores - கோடி, Lakhs - லட்சம்)
    if (value >= 10000000) {
      const cr = (value / 10000000).toFixed(2);
      return `₹${cr} கோடி`;
    } else if (value >= 100000) {
      const lk = (value / 100000).toFixed(2);
      return `₹${lk} லட்சம்`;
    } else {
      return `₹${value.toLocaleString('en-IN')}`;
    }
  } else {
    // English Indian notation
    if (value >= 10000000) {
      const cr = (value / 10000000).toFixed(2);
      return `₹${cr} Cr`;
    } else if (value >= 100000) {
      const lk = (value / 100000).toFixed(2);
      return `₹${lk} Lakh`;
    } else {
      return `₹${value.toLocaleString('en-IN')}`;
    }
  }
};
