import fs from 'fs';

const completeIpcPath = 'd:/New folder/ipc_complete_sections.json';
const completeIpc = JSON.parse(fs.readFileSync(completeIpcPath, 'utf8'));

// Build dictionary for fast lookup. e.g. "126" -> {...}
const ipcDict = {};
completeIpc.sections.forEach(s => {
    // some sections are "IPC 126", we want just the number/letter part
    const match = s.section.match(/IPC\s+([\w\d]+)/i);
    if (match) {
        ipcDict[match[1].toUpperCase()] = s;
    }
});

function parseIpcString(ipcStr) {
    if (!ipcStr || ipcStr === 'Nil') return ipcStr;
    
    // Split by comma
    const parts = ipcStr.split(',').map(s => s.trim().toUpperCase());
    const result = [];
    
    parts.forEach(p => {
        // e.g. "126(2)" -> base is "126"
        const baseMatch = p.match(/^([\d]+[A-Z]?)/);
        let base = baseMatch ? baseMatch[1] : p;
        
        if (ipcDict[base]) {
            // Include original string as "raw_section" maybe, but let's just use the section
            const mapped = { ...ipcDict[base] };
            mapped.section = p.includes('IPC') ? p : `IPC ${p}`;
            result.push(mapped);
        } else if (ipcDict[p]) {
            result.push(ipcDict[p]);
        } else {
            result.push({
                section: p,
                title: "Various Offenses / Other Clauses",
                description: "Details not explicitly found in standard directory."
            });
        }
    });
    
    return result;
}

const paths = [
    'd:/New folder/src/data/all_candidates.json',
    'd:/New folder/public/merged_candidates.json'
];

paths.forEach(path => {
    if (fs.existsSync(path)) {
        let modifiedCount = 0;
        const data = JSON.parse(fs.readFileSync(path, 'utf8'));
        data.forEach(c => {
            if (c.pendingCasesDetails && Array.isArray(c.pendingCasesDetails)) {
                c.pendingCasesDetails.forEach(pc => {
                    if (typeof pc.ipc_sections === 'string' && pc.ipc_sections !== 'Nil') {
                        pc.ipc_sections = parseIpcString(pc.ipc_sections);
                        modifiedCount++;
                    }
                });
            }
        });
        if (modifiedCount > 0) {
            fs.writeFileSync(path, JSON.stringify(data, null, 2));
            console.log(`Updated ${path} - modified ${modifiedCount} cases.`);
        } else {
            console.log(`No changes needed in ${path}`);
        }
    }
});
