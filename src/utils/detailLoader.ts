/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Utility to lazily load candidate detail data from chunked files.
 * 
 * Strategy:
 *   1. App loads lightweight index (candidates_index.json) at startup (~4MB, ~500KB gzipped)
 *   2. When a candidate modal opens, this module fetches the relevant detail chunk
 *   3. Detail chunks are cached in memory after first load
 *   4. Falls back gracefully if chunk loading fails
 */

import { Candidate } from '../types';

// In-memory cache of loaded detail chunks (chunk index → detail map)
const chunkCache: Map<number, Record<string, Partial<Candidate>>> = new Map();

// Manifest cache
let manifestCache: {
  version: number;
  totalCandidates: number;
  chunkSize: number;
  chunks: string[];
  idMap: Record<string, number>;
} | null = null;

let manifestLoading: Promise<typeof manifestCache> | null = null;

/**
 * Load the manifest file (cached after first call)
 */
async function loadManifest() {
  if (manifestCache) return manifestCache;
  
  if (manifestLoading) return manifestLoading;

  manifestLoading = (async () => {
    try {
      const response = await fetch('/data/candidates_manifest.json');
      if (!response.ok) throw new Error(`Manifest fetch failed: ${response.status}`);
      manifestCache = await response.json();
      return manifestCache;
    } catch (err) {
      console.error('[DetailLoader] Failed to load manifest:', err);
      manifestLoading = null;
      return null;
    }
  })();

  return manifestLoading;
}

/**
 * Load a specific detail chunk by index (cached after first call)
 */
async function loadChunk(chunkIndex: number): Promise<Record<string, Partial<Candidate>> | null> {
  // Return from cache if available
  if (chunkCache.has(chunkIndex)) {
    return chunkCache.get(chunkIndex)!;
  }

  const manifest = await loadManifest();
  if (!manifest || chunkIndex < 0 || chunkIndex >= manifest.chunks.length) {
    return null;
  }

  const chunkFile = manifest.chunks[chunkIndex];
  try {
    const response = await fetch(`/data/${chunkFile}`);
    if (!response.ok) throw new Error(`Chunk fetch failed: ${response.status}`);
    const data = await response.json();
    chunkCache.set(chunkIndex, data);
    return data;
  } catch (err) {
    console.error(`[DetailLoader] Failed to load chunk ${chunkIndex}:`, err);
    return null;
  }
}

/**
 * Load detail data for a specific candidate by ID.
 * Returns partial candidate data with detail fields, or null if unavailable.
 */
export async function loadCandidateDetails(candidateId: string): Promise<Partial<Candidate> | null> {
  const manifest = await loadManifest();
  if (!manifest) return null;

  const chunkIndex = manifest.idMap[candidateId];
  if (chunkIndex === undefined) {
    console.warn(`[DetailLoader] Candidate ${candidateId} not found in manifest`);
    return null;
  }

  const chunkData = await loadChunk(chunkIndex);
  if (!chunkData) return null;

  return chunkData[candidateId] || null;
}

/**
 * Merge detail data into a candidate object.
 * Returns a new candidate object with detail fields populated.
 */
export function mergeDetails(candidate: Candidate, details: Partial<Candidate> | null): Candidate {
  if (!details) return candidate;
  return { ...candidate, ...details };
}

/**
 * Preload all detail chunks in the background (optional, for faster subsequent access).
 * Call this after initial page load to warm up the cache.
 */
export async function preloadAllChunks(): Promise<void> {
  const manifest = await loadManifest();
  if (!manifest) return;

  // Load chunks in parallel with concurrency limit
  const CONCURRENCY = 3;
  const chunks = [...manifest.chunks.keys()];
  
  for (let i = 0; i < chunks.length; i += CONCURRENCY) {
    const batch = chunks.slice(i, i + CONCURRENCY);
    await Promise.allSettled(batch.map(idx => loadChunk(idx)));
  }
}

/**
 * Check if detail data is already cached for a candidate
 */
export function isDetailCached(candidateId: string): boolean {
  if (!manifestCache) return false;
  const chunkIndex = manifestCache.idMap[candidateId];
  if (chunkIndex === undefined) return false;
  return chunkCache.has(chunkIndex);
}
