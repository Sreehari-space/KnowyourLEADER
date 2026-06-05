import xlsx from 'xlsx';

const workbook = xlsx.readFile('./source/TN_2026_Election_Candidates_Cleaned.xlsx');
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(sheet);

console.log("Headers:");
if (data.length > 0) {
    console.log(Object.keys(data[0]));
}
console.log("\nRows 1 to 5:");
console.log(data.slice(0, 5));
