import * as fs from 'fs';
import * as path from 'path';

// Our data
const ourDataPath = path.resolve('src/data/all_candidates.json');
const ourData = JSON.parse(fs.readFileSync(ourDataPath, 'utf8'));

// Their data
const theirDataPath = path.resolve('D:/TN custom website/website/data/site-index.json');
let theirData: any[] = [];
try {
  theirData = JSON.parse(fs.readFileSync(theirDataPath, 'utf8'));
} catch (e) {
  console.error('Failed to read their data:', e);
  process.exit(1);
}

console.log(`Our data count: ${ourData.length}`);
console.log(`Their data count: ${theirData.length}`);

// Normalize helper
const normalizeString = (str: string) => str ? str.toLowerCase().replace(/[^a-z0-9]/g, '') : '';

// Create map for our data
const ourMap = new Map();
ourData.forEach((c: any) => {
  ourMap.set(normalizeString(c.name.en), c);
});

// Compare
let matchedCount = 0;
let missingInOurs = 0;
let missingInTheirs = 0;

let differences: any[] = [];

theirData.forEach(theirCand => {
  const normName = normalizeString(theirCand.name);
  const ourCand = ourMap.get(normName);
  
  if (ourCand) {
    matchedCount++;
    // Check some key fields for differences
    if (theirCand.party && ourCand.partyFullName.en && !ourCand.partyFullName.en.toLowerCase().includes(theirCand.party.toLowerCase()) && !theirCand.party.toLowerCase().includes(ourCand.partyFullName.en.toLowerCase())) {
        // Party mismatch
    }
    
    // Check total assets roughly (they might be formatted differently, but their assets is a number)
    const ourAssets = ourCand.totalAssets;
    const theirAssets = theirCand.assets;
    if (Math.abs(ourAssets - theirAssets) > 1000) { // allow small rounding differences
       differences.push({
           name: theirCand.name,
           field: 'assets',
           ours: ourAssets,
           theirs: theirAssets
       });
    }

    if (ourCand.criminalCasesCount !== theirCand.caseCount) {
        differences.push({
           name: theirCand.name,
           field: 'cases',
           ours: ourCand.criminalCasesCount,
           theirs: theirCand.caseCount
       });
    }
  } else {
    missingInOurs++;
  }
});

ourData.forEach((ourCand: any) => {
   // check if in their data
   const normName = normalizeString(ourCand.name.en);
   const found = theirData.find(c => normalizeString(c.name) === normName);
   if (!found) {
       missingInTheirs++;
   }
});

console.log(`Matched: ${matchedCount}`);
console.log(`Missing in Ours: ${missingInOurs}`);
console.log(`Missing in Theirs: ${missingInTheirs}`);
console.log(`Total Differences found (Assets & Cases): ${differences.length}`);

if (differences.length > 0) {
    console.log("Sample Differences (First 10):");
    console.log(differences.slice(0, 10));
}

// Write full differences to a report
fs.writeFileSync('verification_report.json', JSON.stringify({
    summary: {
        ourCount: ourData.length,
        theirCount: theirData.length,
        matched: matchedCount,
        missingInOurs,
        missingInTheirs,
        totalDifferences: differences.length
    },
    sampleDifferences: differences.slice(0, 100)
}, null, 2));

console.log('Report saved to verification_report.json');
