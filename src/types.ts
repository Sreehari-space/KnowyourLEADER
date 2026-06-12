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
  ipc_sections: any;
  other_details: string;
}

export interface AssetOwnership {
  self: string;
  spouse: string;
  huf: string;
  dependents: string[];
}

export interface ImmovableAssetsDetails {
  agricultural: AssetOwnership | string;
  nonAgricultural: AssetOwnership | string;
  commercial: AssetOwnership | string;
  residential: AssetOwnership | string;
  others: AssetOwnership | string;
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
  jewelry?: string;
  vehiclesData?: AssetOwnership;
  jewelryData?: AssetOwnership;
  immovableAssetsDetails?: ImmovableAssetsDetails;
  pendingCasesDetails?: PendingCase[];
  taxYearsSpouse?: TaxYear[];
  taxYearsDependent?: TaxYear[];
  isWinner?: boolean;
  isRunnerUp?: boolean;
  votes?: number;
  votePercent?: number;
  voteMargin?: number;
  discrepancies?: {
    severity: string;
    title: string;
    description: string;
  }[];
}

export type FontSizeSetting = 'small' | 'regular' | 'large' | 'xlarge';
export type LanguageSetting = 'en' | 'ta';
