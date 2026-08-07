/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Candidate } from '../types';

// Data is now loaded asynchronously from public/merged_candidates.json
export const INITIAL_CANDIDATES: Candidate[] = [];

export const FORMAT_CURRENCY = (value: number, lang: 'en' | 'ta' = 'en'): string => {
  if (value === 0) return lang === 'en' ? 'Nil' : 'ஏதுமில்லை';

  // Sign is handled separately from magnitude. Comparing a negative against the
  // Crore/Lakh thresholds fell through to the unabbreviated branch, so a
  // candidate worth -6.09 Cr rendered as "₹-6,09,47,712".
  const sign = value < 0 ? '-' : '';
  const v = Math.abs(value);

  if (lang === 'ta') {
    // Tamil style currency notation (Crores - கோடி, Lakhs - லட்சம்)
    if (v >= 10000000) {
      const cr = (v / 10000000).toFixed(2);
      return `${sign}₹${cr} கோடி`;
    } else if (v >= 100000) {
      const lk = (v / 100000).toFixed(2);
      return `${sign}₹${lk} லட்சம்`;
    } else {
      return `${sign}₹${v.toLocaleString('en-IN')}`;
    }
  } else {
    // English Indian notation
    if (v >= 10000000) {
      const cr = (v / 10000000).toFixed(2);
      return `${sign}₹${cr} Cr`;
    } else if (v >= 100000) {
      const lk = (v / 100000).toFixed(2);
      return `${sign}₹${lk} Lakh`;
    } else {
      return `${sign}₹${v.toLocaleString('en-IN')}`;
    }
  }
};

/**
 * Net worth, with its sign.
 *
 * `netWorthFormatted` is built by app/build-index.mjs as
 * `formatCurrency(Math.abs(netWorth))` — deliberately the magnitude only, with
 * the sign carried separately in `netWorthPositive`. Rendering the formatted
 * string on its own therefore shows 174 candidates who declared more debt than
 * assets as though they were solvent: S.P. Velumani declared assets of
 * ₹13.11 Cr against liabilities of ₹19.20 Cr and displayed as "₹6.1 Cr".
 *
 * Always use this rather than reading `netWorthFormatted` directly.
 */
export const FORMAT_NET_WORTH = (
  candidate: Pick<Candidate, 'netWorthFormatted' | 'netWorthPositive'>
): string => `${candidate.netWorthPositive === false ? '-' : ''}${candidate.netWorthFormatted}`;
