import * as fs from 'fs';
import * as path from 'path';
import xlsx from 'xlsx';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '..');
const SOURCE_DIR = path.join(ROOT_DIR, 'source');
const JSON_DIR = path.join(SOURCE_DIR, 'candidates_json_data');
const IMAGES_DIR = path.join(SOURCE_DIR, 'Candidate images');
const PUBLIC_CANDIDATES_DIR = path.join(ROOT_DIR, 'public', 'candidates');
const EXCEL_FILE = path.join(SOURCE_DIR, 'TN_2026_Election_Candidates_Cleaned.xlsx');
const RESULTS_FILE = path.join(SOURCE_DIR, 'refined_tn_2026_results(1).json');
const OUTPUT_FILE = path.join(ROOT_DIR, 'src', 'data', 'all_candidates.json');

// Ensure public candidates dir exists
if (!fs.existsSync(PUBLIC_CANDIDATES_DIR)) {
  fs.mkdirSync(PUBLIC_CANDIDATES_DIR, { recursive: true });
}

// 1. Read Results
let winners = new Set<string>();
try {
  const resultsData = JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf-8'));
  resultsData.forEach((result: any) => {
    if (result.winner && result.winner.candidate) {
      // Normalize winner name for matching
      winners.add(result.winner.candidate.trim().toLowerCase());
    }
  });
} catch (e) {
  console.error("Error reading results:", e);
}

// 2. Read Excel
const workbook = xlsx.readFile(EXCEL_FILE);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const excelRaw = xlsx.utils.sheet_to_json(sheet);

// The actual headers are on row index 1 (the 2nd row)
const excelData = excelRaw.slice(1).map((row: any) => {
  return {
    id: row['TAMIL NADU 2026 ELECTION — CANDIDATE AFFIDAVIT MASTER DATA'],
    name: row['__EMPTY']?.trim() || '',
    age: row['__EMPTY_1'],
    constituency: row['__EMPTY_2']?.trim() || '',
    party: row['__EMPTY_3']?.trim() || '',
    movableAssetsSelf: row['__EMPTY_11'] || 0,
    movableAssetsSpouse: row['__EMPTY_12'] || 0,
    immovableAssetsSelf: row['__EMPTY_13'] || 0,
    immovableAssetsSpouse: row['__EMPTY_14'] || 0,
    totalAssets: row['__EMPTY_15'] || 0,
    totalLiabilities: row['__EMPTY_16'] || 0,
    netWorth: row['__EMPTY_17'] || 0,
    cash: row['__EMPTY_18'] || 0,
    education: row['__EMPTY_23']?.trim() || '',
    profession: row['__EMPTY_24']?.trim() || ''
  };
});

// Helper to normalize strings for matching
const normalizeString = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');

// Create Excel lookup map
const excelMap = new Map();
excelData.forEach(row => {
  if (row.name) {
    excelMap.set(normalizeString(row.name), row);
  }
});

// 3. Process Images
const imageFiles = fs.readdirSync(IMAGES_DIR);
const imageMap = new Map();
imageFiles.forEach(file => {
  // Try to match candidate name from image filename: e.g. A.ALAPPAN-Independent-NILAKKOTTAI.jpg
  const namePart = file.split('-')[0];
  if (namePart) {
    imageMap.set(normalizeString(namePart), file);
  }
});

// 4. Process JSON files
const jsonFiles = fs.readdirSync(JSON_DIR).filter(f => f.endsWith('.json'));

let combinedCandidates: any[] = [];
let idCounter = 1;

jsonFiles.forEach(file => {
  const filePath = path.join(JSON_DIR, file);
  const jsonContent = fs.readFileSync(filePath, 'utf-8');
  let candidateData: any;
  try {
    candidateData = JSON.parse(jsonContent);
  } catch (e) {
    console.error("Error parsing JSON:", file);
    return;
  }

  const name = candidateData.candidate_name || '';
  const partyRaw = candidateData.party || '';
  const normName = normalizeString(name);
  
  // Find Excel data
  const excelRow = excelMap.get(normName) || {};

  // Party normalization
  let party = partyRaw;
  const knownParties = ['DMK', 'AIADMK', 'BJP', 'NTK', 'INC', 'IND', 'TVK'];
  if (!knownParties.includes(party)) {
    if (party.toLowerCase() === 'independent' || party.toLowerCase() === 'ind') party = 'IND';
    else if (party.toLowerCase() === 'tamilaga vettri kazhagam') party = 'TVK';
    else if (party.toLowerCase() === 'naam tamilar katchi') party = 'NTK';
    else party = 'OTHERS'; // Fallback to OTHERS for types
  }

  // Find Image
  let imageUrl = '/candidates/default-avatar.png'; // Placeholder if needed
  const imageFileName = imageMap.get(normName);
  if (imageFileName) {
    // Copy image
    const sourceImage = path.join(IMAGES_DIR, imageFileName);
    const destImage = path.join(PUBLIC_CANDIDATES_DIR, imageFileName);
    try {
      fs.copyFileSync(sourceImage, destImage);
      imageUrl = `/candidates/${imageFileName}`;
    } catch (e) {
      console.error("Error copying image:", imageFileName);
    }
  }

  // Parse Criminal Cases
  let criminalCasesCount = 0;
  let criminalCasesList: any[] = [];
  
  if (candidateData.criminal_cases) {
    criminalCasesCount = parseInt(candidateData.criminal_cases.count) || 0;
    if (candidateData.criminal_cases.pending_cases && Array.isArray(candidateData.criminal_cases.pending_cases)) {
      criminalCasesList = candidateData.criminal_cases.pending_cases.map((c: any) => ({
        caseNumber: c.case_no || c.fir_no || 'Unknown',
        charges: [c.law_type || 'IPC'],
        ipcSections: c.ipc_sections || 'Nil',
        court: c.court || 'Unknown Court',
        status: 'Pending',
        description: {
          en: `Charges framed: ${c.charges_framed}. ${c.other_details !== 'Nil' ? c.other_details : ''}`,
          ta: `Charges framed: ${c.charges_framed}`
        }
      }));
    }
  }

  const isWinner = winners.has(name.trim().toLowerCase());

  // Determine Education Category roughly
  let educationCategory = 'School';
  const eduLower = (candidateData.education || excelRow.education || '').toLowerCase();
  if (eduLower.includes('post graduate') || eduLower.includes('master')) educationCategory = 'Post Graduate';
  else if (eduLower.includes('graduate') || eduLower.includes('bachelor') || eduLower.includes('b.e') || eduLower.includes('b.sc') || eduLower.includes('b.a')) educationCategory = 'Graduate';
  else if (eduLower.includes('doctorate') || eduLower.includes('ph.d')) educationCategory = 'Doctorate';
  else if (eduLower.includes('law') || eduLower.includes('mbbs') || eduLower.includes('professional')) educationCategory = 'Professional';

  const candidate = {
    id: excelRow.id || `cand-${idCounter++}`,
    name: {
      en: name,
      ta: name
    },
    age: parseInt(candidateData.age || excelRow.age) || 0,
    party: party,
    partyFullName: {
      en: candidateData.party || excelRow.party || party,
      ta: candidateData.party || excelRow.party || party
    },
    constituency: {
      en: (candidateData.constituency || excelRow.constituency || '').replace(/\\(.*\\)/, '').trim(),
      ta: (candidateData.constituency || excelRow.constituency || '').replace(/\\(.*\\)/, '').trim()
    },
    district: {
      en: (candidateData.constituency || '').split('(')[2]?.replace(')', '')?.trim() || 'Tamil Nadu',
      ta: (candidateData.constituency || '').split('(')[2]?.replace(')', '')?.trim() || 'Tamil Nadu'
    },
    education: {
      en: candidateData.education || excelRow.education || 'Nil',
      ta: candidateData.education || excelRow.education || 'Nil'
    },
    educationCategory: educationCategory,
    occupation: {
      en: candidateData.self_profession || excelRow.profession || 'Nil',
      ta: candidateData.self_profession || excelRow.profession || 'Nil'
    },
    assets: {
      movable: {
        cash: excelRow.cash || 0,
        bankBalances: 0,
        jewelryValue: 0,
        vehiclesValue: 0,
        sharesInvestments: 0,
        otherMovable: excelRow.movableAssetsSelf || 0
      },
      immovable: {
        agriculturalLand: 0,
        commercialProperties: 0,
        residentialProperties: 0,
        otherImmovable: excelRow.immovableAssetsSelf || 0
      },
      liabilities: {
        bankLoans: 0,
        governmentDues: 0,
        otherLiabilities: excelRow.totalLiabilities || 0
      }
    },
    totalAssets: excelRow.totalAssets || 0,
    totalLiabilities: excelRow.totalLiabilities || 0,
    netWorth: excelRow.netWorth || 0,
    criminalCasesCount: criminalCasesCount,
    criminalCasesList: criminalCasesList,
    imageUrl: imageUrl,
    sourceAffidavitUrl: 'https://affidavit.eci.gov.in/',
    isWinner: isWinner
  };

  combinedCandidates.push(candidate);
});

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(combinedCandidates, null, 2));
console.log(`Merged ${combinedCandidates.length} candidates. Output saved to ${OUTPUT_FILE}`);
