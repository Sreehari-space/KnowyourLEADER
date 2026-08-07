/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Lazily loads the complete Form 26 record for a candidate.
 *
 * These chunks carry every declared field — all nine movable-asset heads, all
 * sixteen liability heads, contracts, income sources, and income-tax filings
 * for every relation — so the dossier can show the full declaration rather than
 * a summary. They are fetched only when a dossier is opened, never preloaded.
 */

export interface AffidavitCase {
  serial_no?: string;
  fir_no?: string;
  case_no?: string;
  court?: string;
  law_type?: string;
  ipcSections?: string | Array<{ section?: string; title?: string; description?: string; punishment?: string }>;
  charges_framed?: string;
  charges_date?: string;
  appeal_filed?: string;
  appeal_status?: string;
  punishment?: string;
  conviction_date?: string;
  other_details?: string;
}

export interface AffidavitTaxEntry {
  relation: string;
  pan: string | null;
  latestYear: string | null;
  /** `year` is null where the affidavit declared an amount with no year label. */
  years: Array<{ year: string | null; amount: number }>;
}

/** Category index → { relation: declared value }. */
export type AffidavitSection = Record<string, Record<string, string>>;

export interface FullAffidavit {
  relative?: string;
  voterInfo?: string;
  professions?: Record<string, string>;
  incomeSources?: Record<string, string>;
  contracts?: AffidavitSection;
  movable?: AffidavitSection;
  immovable?: AffidavitSection;
  liabilities?: AffidavitSection;
  tax?: AffidavitTaxEntry[];
  cases?: {
    count: number;
    summary?: string | null;
    ipcCharges?: unknown[] | null;
    pending?: AffidavitCase[] | null;
    convicted?: AffidavitCase[] | null;
  };
  summary?: Record<string, string>;
}

export interface AffidavitSchema {
  movable: string[];
  immovable: string[];
  liabilities: string[];
  contracts: string[];
}

interface AffidavitManifest {
  version: number;
  totalCandidates: number;
  withAffidavit: number;
  chunkSize: number;
  chunks: string[];
  schema: AffidavitSchema;
  idMap: Record<string, number>;
}

const chunkCache = new Map<number, Record<string, FullAffidavit>>();
const chunkLoading = new Map<number, Promise<Record<string, FullAffidavit> | null>>();

let manifestCache: AffidavitManifest | null = null;
let manifestLoading: Promise<AffidavitManifest | null> | null = null;

async function loadManifest(): Promise<AffidavitManifest | null> {
  if (manifestCache) return manifestCache;
  if (manifestLoading) return manifestLoading;

  manifestLoading = (async () => {
    try {
      const response = await fetch('/data/affidavit_manifest.json');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      manifestCache = (await response.json()) as AffidavitManifest;
      return manifestCache;
    } catch (err) {
      console.warn('[AffidavitLoader] Manifest unavailable:', err);
      manifestLoading = null;
      return null;
    }
  })();

  return manifestLoading;
}

async function loadChunk(index: number): Promise<Record<string, FullAffidavit> | null> {
  if (chunkCache.has(index)) return chunkCache.get(index)!;
  if (chunkLoading.has(index)) return chunkLoading.get(index)!;

  const manifest = await loadManifest();
  if (!manifest || index < 0 || index >= manifest.chunks.length) return null;

  const promise = (async () => {
    try {
      const response = await fetch(`/data/${manifest.chunks[index]}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = (await response.json()) as Record<string, FullAffidavit>;
      chunkCache.set(index, data);
      return data;
    } catch (err) {
      console.warn(`[AffidavitLoader] Chunk ${index} failed:`, err);
      chunkLoading.delete(index);
      return null;
    }
  })();

  chunkLoading.set(index, promise);
  return promise;
}

export async function getAffidavitSchema(): Promise<AffidavitSchema | null> {
  const manifest = await loadManifest();
  return manifest ? manifest.schema : null;
}

/** Full declaration for one candidate, or null when unavailable. */
export async function loadFullAffidavit(
  candidateId: string
): Promise<{ affidavit: FullAffidavit; schema: AffidavitSchema } | null> {
  const manifest = await loadManifest();
  if (!manifest) return null;

  const index = manifest.idMap[candidateId];
  if (index === undefined) return null;

  const chunk = await loadChunk(index);
  const affidavit = chunk ? chunk[candidateId] : null;
  return affidavit ? { affidavit, schema: manifest.schema } : null;
}
