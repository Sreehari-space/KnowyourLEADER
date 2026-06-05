/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TranslationSet {
  en: string;
  ta: string;
}

export interface TaxYear {
  year: string;
  amount: number;
}

export interface PendingCase {
  fir_no: string;
  case_no: string;
  court: string;
  ipc_sections: string;
  other_details: string;
}

export interface ImmovableAssetsDetails {
  agricultural: string;
  nonAgricultural: string;
  commercial: string;
  residential: string;
  others: string;
}

export interface Candidate {
  id: string;
  name: string;
  party: string;
  constituency: string;
  age: string;
  education: string;
  selfProfession: string;
  spouseProfession: string;
  assets: number;
  assetsFormatted: string;
  liabilities: number;
  liabilitiesFormatted: string;
  netWorth: number;
  netWorthFormatted: string;
  netWorthPositive: boolean;
  caseCount: number;
  pendingCount: number;
  convictedCount: number;
  severityTier: string;
  caseCategories: string[];
  caseSummary: string;
  taxYears: TaxYear[];
  reviewScore: number;
  reviewTier: string | null;
  reviewCategories: string[];
  indicatorCodes: string[];
  photo: string;
  cartoonImage: string | null;
  jsonFile: string;
  sourceJsonFile: string;
  vehicles?: string;
  land?: string;
  immovableAssetsDetails?: ImmovableAssetsDetails;
  pendingCasesDetails?: PendingCase[];
  isWinner?: boolean;
  isRunnerUp?: boolean;
  votes?: number;
  votePercent?: number;
  voteMargin?: number;
}

export type FontSizeSetting = 'small' | 'regular' | 'large' | 'xlarge';
export type LanguageSetting = 'en' | 'ta';
