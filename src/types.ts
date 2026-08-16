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
  /**
   * Which election this record is from.
   *
   * Defaults to '2026' when absent, because the 2026 index predates the field.
   * A 2021 entry is a historical record of someone who did not stand in 2026 —
   * the UI must say so wherever one appears, or a reader will take it for a
   * current candidate.
   */
  election?: '2026' | '2021';
  /** The ECI/MyNeta page this record was taken from. 2021 records only. */
  sourceUrl?: string;
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
  /**
   * `discrepancies` was removed. It carried severity-tiered accusations —
   * "Tax/Duty Evasion", "Parking Illicit Funds" — against 1,019 of 1,799 named
   * people, most of them produced by bugs: the gold checks summed silver,
   * diamond and platinum weights in with the gold, and the arithmetic check
   * compared our own parse against the candidate's declared total and blamed
   * them for the gap. Flags now come from public/data/declaration_flags.json
   * via src/utils/declarationFlags.ts. See scripts/buildDeclarationFlags.cjs.
   */
}

export type FontSizeSetting = 'small' | 'regular' | 'large' | 'xlarge';
export type LanguageSetting = 'en' | 'ta';
