import fs from 'fs';
const path = 'd:/New folder/public/merged_candidates.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

let i = 0;
data.forEach(c => {
    if (c.pendingCasesDetails && c.pendingCasesDetails.length > 0) {
        if (i < 2) console.log(c.name, JSON.stringify(c.pendingCasesDetails, null, 2));
        i++;
    }
});
