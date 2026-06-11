import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '..');
const MERGED_JSON_PATH = path.join(ROOT_DIR, 'src', 'data', 'all_candidates.json');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const OUTPUT_JSON_PATH = path.join(PUBLIC_DIR, 'merged_candidates.json');
const RAW_JSON_DIR = 'd:\\\\source\\\\candidates_json_data';

console.log('Loading existing merged candidates...');
const candidates = JSON.parse(fs.readFileSync(MERGED_JSON_PATH, 'utf-8'));

let matchCount = 0;

const cleanValue = (val) => {
  if (!val || val === 'Nil' || val === 'NA' || val === 'Not Applicable') return '';
  return val.trim();
};

const getOwnershipData = (categoryObj) => {
  if (!categoryObj) return { self: '', spouse: '', huf: '', dependents: [] };
  const getClean = (key) => cleanValue(categoryObj[key]);
  
  const self = getClean('self');
  const spouse = getClean('spouse');
  const huf = getClean('huf');
  const dep1 = getClean('dependent1');
  const dep2 = getClean('dependent2');
  const dep3 = getClean('dependent3');
  
  const dependents = [];
  if (dep1) dependents.push(dep1);
  if (dep2) dependents.push(dep2);
  if (dep3) dependents.push(dep3);
  
  return { self, spouse, huf, dependents };
};

console.log(`Processing ${candidates.length} candidates...`);

const updatedCandidates = candidates.map(c => {
  let vehicles = '';
  let jewelry = '';
  let land = '';
  let vehiclesData = { self: '', spouse: '', huf: '', dependents: [] };
  let jewelryData = { self: '', spouse: '', huf: '', dependents: [] };
  let immovableAssetsDetails = {
    agricultural: { self: '', spouse: '', huf: '', dependents: [] },
    nonAgricultural: { self: '', spouse: '', huf: '', dependents: [] },
    commercial: { self: '', spouse: '', huf: '', dependents: [] },
    residential: { self: '', spouse: '', huf: '', dependents: [] },
    others: { self: '', spouse: '', huf: '', dependents: [] }
  };
  let pendingCasesDetails = [];

  if (c.sourceJsonFile) {
    const rawPath = path.join(RAW_JSON_DIR, c.sourceJsonFile);
    if (fs.existsSync(rawPath)) {
      try {
        const rawData = JSON.parse(fs.readFileSync(rawPath, 'utf-8'));
        
        // Extract vehicles
        if (rawData.movable_assets && rawData.movable_assets["Motor Vehicles (details of make, etc.)"]) {
          vehiclesData = getOwnershipData(rawData.movable_assets["Motor Vehicles (details of make, etc.)"]);
          vehicles = vehiclesData.self;
        }

        // Extract jewelry
        if (rawData.movable_assets && rawData.movable_assets["Jewellery (give details weight value)"]) {
          jewelryData = getOwnershipData(rawData.movable_assets["Jewellery (give details weight value)"]);
          let rawJewelry = jewelryData.self;
          if (rawJewelry) {
            let cleaned = rawJewelry.replace(/(?:Rs\.?\/?-?\s*)?[\d,.]+\s*(?:Lacs?\+?|Crores?\+?|Cr|Lakhs?|Lakh|Thou\+?|Thousand\+?)\b/gi, '');
            cleaned = cleaned.replace(/(?:Rs\.?\/?-?\s*)[\d,.]+\b/gi, '');
            cleaned = cleaned.replace(/\b\d{5,}\b/g, ''); 
            cleaned = cleaned.replace(/\b\d{1,3}(?:,\d{2,3})+\b/g, '');

            cleaned = cleaned.replace(/[,-]/g, ' ');
            cleaned = cleaned.replace(/\bof\b/gi, ' ');
            cleaned = cleaned.replace(/\band\b/gi, ' ');
            cleaned = cleaned.replace(/\bitems?\b/gi, ' ');
            cleaned = cleaned.replace(/\barticles?\b/gi, ' ');
            cleaned = cleaned.replace(/\b(gold|silver|diamond|platinum)\s+(?:jeweller[a-z]*|jewelry|jewels?)\b/gi, '$1');

            const regex = /((?:\d+[.,]?\d*\s*(?:grams?|gms?|kg|soverigns?|sovereigns?|ct|carrots?|carats?|pounds?|pouns?)\s*)?(?:gold|silver|diamond|platinum|jeweller[a-z]*|jewel|vairam|thangam)\s*(?:\d+[.,]?\d*\s*(?:grams?|gms?|kg|soverigns?|sovereigns?|ct|carrots?|carats?|pounds?|pouns?))?)/gi;
            const matches = cleaned.match(regex);
            
            if (matches) {
              jewelry = matches.map((m, i) => {
                let text = m.trim();
                let materialMatch = text.match(/(gold|silver|diamond|platinum|jeweller[a-z]*|jewel)/i);
                let material = materialMatch ? materialMatch[0].toUpperCase() : 'JEWELRY';
                
                let weightMatch = text.match(/(\d+[.,]?\d*)\s*(grams?|gms?|kg|soverigns?|sovereigns?|ct|carrots?|carats?|pounds?|pouns?)/i);
                let weight = weightMatch ? `${weightMatch[1]}${weightMatch[2].toLowerCase()}` : '';
                
                return weight ? `${i + 1}. ${material} - ${weight}` : `${i + 1}. ${material}`;
              }).join(' ');
            } else {
              let fallbackMatch = cleaned.match(/(\d+[.,]?\d*)\s*(grams?|gms?|kg|soverigns?|sovereigns?|ct|carrots?|carats?|pounds?|pouns?)/i);
              if (fallbackMatch) {
                jewelry = `1. JEWELRY - ${fallbackMatch[1]}${fallbackMatch[2].toLowerCase()}`;
              } else {
                jewelry = rawJewelry;
              }
            }
          }
        }

        // Extract land & properties
        let landArr = [];
        if (rawData.immovable_assets) {
          immovableAssetsDetails = {
            agricultural: getOwnershipData(rawData.immovable_assets["Agricultural Land"]),
            nonAgricultural: getOwnershipData(rawData.immovable_assets["Non Agricultural Land"]),
            commercial: getOwnershipData(rawData.immovable_assets["Commercial Buildings"]),
            residential: getOwnershipData(rawData.immovable_assets["Residential Buildings"]),
            others: getOwnershipData(rawData.immovable_assets["Others"])
          };
          
          if (immovableAssetsDetails.agricultural.self) landArr.push(`Agri: ${immovableAssetsDetails.agricultural.self}`);
          if (immovableAssetsDetails.nonAgricultural.self) landArr.push(`Non-Agri: ${immovableAssetsDetails.nonAgricultural.self}`);
        }
        land = landArr.join(' | ');

        // Extract detailed pending cases
        if (rawData.criminal_cases && rawData.criminal_cases.pending_cases) {
          pendingCasesDetails = rawData.criminal_cases.pending_cases.map(pc => ({
            fir_no: pc.fir_no || '',
            case_no: pc.case_no || '',
            court: pc.court || '',
            ipc_sections: pc.ipc_sections || '',
            other_details: pc.other_details || ''
          }));
        }

        matchCount++;
      } catch (e) {
        console.error(`Error reading ${c.sourceJsonFile}:`, e.message);
      }
    } else {
        console.warn(`File not found: ${c.sourceJsonFile}`);
    }
  }

  return {
    ...c,
    vehicles: vehicles || 'Nil',
    jewelry: jewelry || 'Nil',
    land: land || 'Nil',
    vehiclesData,
    jewelryData,
    immovableAssetsDetails,
    pendingCasesDetails
  };
});

if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

fs.writeFileSync(OUTPUT_JSON_PATH, JSON.stringify(updatedCandidates, null, 2));

console.log(`Successfully added asset details for ${matchCount} candidates.`);
console.log(`Wrote augmented data to ${OUTPUT_JSON_PATH}`);
