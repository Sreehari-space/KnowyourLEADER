/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * splitCandidates.cjs
 * 
 * Build-time script to split merged_candidates.json into:
 *   1. candidates_index.json  — lightweight listing data (~4MB, ~500KB gzipped)
 *   2. detail_chunk_N.json    — heavy detail data in chunks of CHUNK_SIZE candidates
 * 
 * Usage: node scripts/splitCandidates.cjs
 */

const fs = require('fs');
const path = require('path');

const SOURCE = path.resolve(__dirname, '..', 'public', 'merged_candidates.json');
const OUT_DIR = path.resolve(__dirname, '..', 'public', 'data');
const CHUNK_SIZE = 200; // candidates per detail chunk

// Fields that go into the lightweight listing index
const LISTING_FIELDS = [
  'id', 'name', 'party', 'constituency', 'age', 'education',
  'selfProfession', 'spouseProfession',
  'assets', 'assetsFormatted', 'liabilities', 'liabilitiesFormatted',
  'netWorth', 'netWorthFormatted', 'netWorthPositive',
  'caseCount', 'pendingCount', 'convictedCount',
  'severityTier', 'caseCategories',
  'taxYears', 'reviewScore', 'reviewTier', 'reviewCategories',
  'indicatorCodes', 'photo', 'cartoonImage',
  'jsonFile', 'sourceJsonFile',
  'isWinner', 'isRunnerUp', 'votes', 'votePercent', 'voteMargin',
  'district'
];

// Fields that go into detail chunks (loaded on-demand)
const DETAIL_FIELDS = [
  'vehicles', 'jewelry', 'land',
  'vehiclesData', 'jewelryData',
  'immovableAssetsDetails',
  'pendingCasesDetails',
  'caseSummary',
  'discrepancies',
  'taxYearsSpouse', 'taxYearsDependent'
];

function main() {
  console.log('📦 Reading source file:', SOURCE);
  const raw = fs.readFileSync(SOURCE, 'utf-8');
  const candidates = JSON.parse(raw);
  console.log(`   Found ${candidates.length} candidates (${(Buffer.byteLength(raw) / 1024 / 1024).toFixed(2)} MB)`);

  // Ensure output directory exists
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  // Clean old chunk files
  const existingFiles = fs.readdirSync(OUT_DIR);
  existingFiles.forEach(f => {
    if (f.startsWith('detail_chunk_') || f === 'candidates_index.json' || f === 'candidates_manifest.json') {
      fs.unlinkSync(path.join(OUT_DIR, f));
    }
  });

  // ---- 1. Build listing index ----
  const listingIndex = candidates.map(c => {
    const entry = {};
    LISTING_FIELDS.forEach(key => {
      if (c[key] !== undefined) {
        entry[key] = c[key];
      }
    });
    return entry;
  });

  const indexPath = path.join(OUT_DIR, 'candidates_index.json');
  const indexJson = JSON.stringify(listingIndex);
  fs.writeFileSync(indexPath, indexJson);
  console.log(`✅ Listing index: ${(Buffer.byteLength(indexJson) / 1024 / 1024).toFixed(2)} MB → ${indexPath}`);

  // ---- 2. Build detail chunks ----
  // Map: candidate.id → detail data, split into chunks
  const totalChunks = Math.ceil(candidates.length / CHUNK_SIZE);
  const chunkFiles = [];

  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, candidates.length);
    const chunkData = {};

    for (let j = start; j < end; j++) {
      const c = candidates[j];
      const detail = {};
      let hasDetail = false;
      DETAIL_FIELDS.forEach(key => {
        if (c[key] !== undefined && c[key] !== null) {
          detail[key] = c[key];
          hasDetail = true;
        }
      });
      if (hasDetail) {
        chunkData[c.id] = detail;
      }
    }

    const chunkName = `detail_chunk_${i}.json`;
    const chunkPath = path.join(OUT_DIR, chunkName);
    const chunkJson = JSON.stringify(chunkData);
    fs.writeFileSync(chunkPath, chunkJson);
    chunkFiles.push(chunkName);
    console.log(`   Chunk ${i}: ${end - start} candidates, ${(Buffer.byteLength(chunkJson) / 1024).toFixed(0)} KB`);
  }

  // ---- 3. Build manifest ----
  // The manifest maps candidate ID ranges to chunk files for efficient lookup
  const manifest = {
    version: 2,
    totalCandidates: candidates.length,
    chunkSize: CHUNK_SIZE,
    chunks: chunkFiles,
    // Build an ID-to-chunk-index map for O(1) lookup
    idMap: {}
  };

  candidates.forEach((c, idx) => {
    manifest.idMap[c.id] = Math.floor(idx / CHUNK_SIZE);
  });

  const manifestPath = path.join(OUT_DIR, 'candidates_manifest.json');
  const manifestJson = JSON.stringify(manifest);
  fs.writeFileSync(manifestPath, manifestJson);
  console.log(`✅ Manifest: ${(Buffer.byteLength(manifestJson) / 1024).toFixed(0)} KB → ${manifestPath}`);

  // ---- Summary ----
  const totalSplitSize = Buffer.byteLength(indexJson) + chunkFiles.reduce((sum, f) => {
    return sum + fs.statSync(path.join(OUT_DIR, f)).size;
  }, 0) + Buffer.byteLength(manifestJson);

  console.log('\n📊 Summary:');
  console.log(`   Original: ${(Buffer.byteLength(raw) / 1024 / 1024).toFixed(2)} MB (single file)`);
  console.log(`   Split total: ${(totalSplitSize / 1024 / 1024).toFixed(2)} MB across ${chunkFiles.length + 2} files`);
  console.log(`   Initial load: ~${(Buffer.byteLength(indexJson) / 1024 / 1024).toFixed(2)} MB (index only)`);
  console.log(`   Detail chunks: ${chunkFiles.length} files, loaded on demand`);
  console.log('\n✅ Done! Run your build as usual.');
}

main();
