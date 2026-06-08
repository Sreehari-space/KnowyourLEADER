const fs = require('fs');
const path = require('path');

const candidatesPath = 'd:/New folder/src/data/all_candidates.json';
const candidates = JSON.parse(fs.readFileSync(candidatesPath, 'utf8'));

const discrepancyDir = 'd:/New folder/discrepancy_reports';
const files = fs.readdirSync(discrepancyDir).filter(f => f.endsWith('_discrepancy.json'));

const normalize = (s) => s ? s.toLowerCase().replace(/[^a-z0-9]/g, '') : '';

let matchedCount = 0;

for (const file of files) {
  const data = JSON.parse(fs.readFileSync(path.join(discrepancyDir, file), 'utf8'));
  const discDetails = data.candidate_details;
  const discrepancies = data.discrepancies || [];
  
  if (discrepancies.length === 0) continue;
  
  const normName = normalize(discDetails.candidate_name);
  const normNameJson = normalize(discDetails.candidate_name_json);
  const party = normalize(discDetails.party);
  
  // Try matching by name and party first
  let match = candidates.find(c => {
    const cName = normalize(c.name);
    return (cName === normName || cName === normNameJson);
  });
  
  if (!match) {
     // Fallback to substring matching
     match = candidates.find(c => {
       const cName = normalize(c.name);
       return (cName.includes(normName) || normName.includes(cName));
     });
  }
  
  if (match) {
    matchedCount++;
    match.discrepancies = discrepancies.map(d => ({
      severity: d.severity,
      title: d.title,
      description: d.description
    }));
  }
}

fs.writeFileSync(candidatesPath, JSON.stringify(candidates, null, 2));

const publicPath = 'd:/New folder/public/merged_candidates.json';
if (fs.existsSync(publicPath)) {
  // Let's also update public/merged_candidates.json because that's often what's fetched by the frontend
  const publicCandidates = JSON.parse(fs.readFileSync(publicPath, 'utf8'));
  for (const pc of publicCandidates) {
    const matchedOriginal = candidates.find(c => c.id === pc.id);
    if (matchedOriginal && matchedOriginal.discrepancies) {
      pc.discrepancies = matchedOriginal.discrepancies;
    }
  }
  fs.writeFileSync(publicPath, JSON.stringify(publicCandidates, null, 2));
}

console.log(`Discrepancies merged successfully. Matched ${matchedCount} candidates.`);
