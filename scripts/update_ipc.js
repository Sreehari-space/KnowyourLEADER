import fs from 'fs';

const completeIpcPath = 'd:/New folder/ipc_complete_sections.json';
const tnIpcPath = 'd:/New folder/src/data/tn_ipc_sections.json';

const completeIpc = JSON.parse(fs.readFileSync(completeIpcPath, 'utf8'));
const tnIpc = JSON.parse(fs.readFileSync(tnIpcPath, 'utf8'));

tnIpc.ipc_sections_reference = {
    description: completeIpc.description,
    total_sections: completeIpc.total_sections,
    sections: completeIpc.sections
};

fs.writeFileSync(tnIpcPath, JSON.stringify(tnIpc, null, 2));
console.log('Successfully replaced IPC sections in tn_ipc_sections.json');
