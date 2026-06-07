import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '..');
const MERGED_JSON_PATH = path.join(ROOT_DIR, 'src', 'data', 'all_candidates.json');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const OUTPUT_JSON_PATH = path.join(PUBLIC_DIR, 'merged_candidates.json');
const RAW_JSON_DIR = path.join(ROOT_DIR, 'source', 'candidates_json_data');

console.log('Loading existing merged candidates...');
const candidates = JSON.parse(fs.readFileSync(MERGED_JSON_PATH, 'utf-8'));

let matchCount = 0;

const cleanValue = (val) => {
  if (!val || val === 'Nil' || val === 'NA' || val === 'Not Applicable') return '';
  return val.trim();
};

console.log(`Processing ${candidates.length} candidates...`);

const updatedCandidates = candidates.map(c => {
  let vehicles = '';
  let jewelry = '';
  let land = '';
  let immovableAssetsDetails = {
    agricultural: '',
    nonAgricultural: '',
    commercial: '',
    residential: '',
    others: ''
  };
  let pendingCasesDetails = [];

  if (c.sourceJsonFile) {
    const rawPath = path.join(RAW_JSON_DIR, c.sourceJsonFile);
    if (fs.existsSync(rawPath)) {
      try {
        const rawData = JSON.parse(fs.readFileSync(rawPath, 'utf-8'));
        
        // Extract vehicles
        if (rawData.movable_assets && rawData.movable_assets["Motor Vehicles (details of make, etc.)"]) {
          vehicles = cleanValue(rawData.movable_assets["Motor Vehicles (details of make, etc.)"].self);
        }

        // Extract jewelry
        if (rawData.movable_assets && rawData.movable_assets["Jewellery (give details weight value)"]) {
          let rawJewelry = cleanValue(rawData.movable_assets["Jewellery (give details weight value)"].self);
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
          const agri = cleanValue(rawData.immovable_assets["Agricultural Land"]?.self);
          const nonAgri = cleanValue(rawData.immovable_assets["Non Agricultural Land"]?.self);
          const commercial = cleanValue(rawData.immovable_assets["Commercial Buildings"]?.self);
          const residential = cleanValue(rawData.immovable_assets["Residential Buildings"]?.self);
          const others = cleanValue(rawData.immovable_assets["Others"]?.self);
          
          if (agri) landArr.push(`Agri: ${agri}`);
          if (nonAgri) landArr.push(`Non-Agri: ${nonAgri}`);

          immovableAssetsDetails = {
            agricultural: agri,
            nonAgricultural: nonAgri,
            commercial: commercial,
            residential: residential,
            others: others
          };
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
