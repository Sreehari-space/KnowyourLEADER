import fs from 'fs';

const completeIpcPath = 'd:/New folder/ipc_complete_sections.json';
const completeIpc = JSON.parse(fs.readFileSync(completeIpcPath, 'utf8'));
const ipcDict = {};
completeIpc.sections.forEach(s => {
    const key = s.section.replace(/IPC\s+/i, '').trim().toUpperCase();
    ipcDict[key] = s;
});

const tnIpcPath = 'd:/New folder/src/data/tn_ipc_sections.json';
const tnIpc = JSON.parse(fs.readFileSync(tnIpcPath, 'utf8'));
const specialActs = tnIpc.special_acts_reference ? tnIpc.special_acts_reference.acts : [];

function parseIpcString(ipcStr) {
    if (!ipcStr || ipcStr === 'Nil') return [];
    
    const parts = ipcStr.split(',').map(s => s.trim().toUpperCase());
    const result = [];
    
    parts.forEach(p => {
        if (ipcDict[p]) {
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

console.log(parseIpcString("126(2), 189(2), 223, 294A, 420"));
