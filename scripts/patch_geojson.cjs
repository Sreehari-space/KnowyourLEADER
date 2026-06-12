const fs = require('fs');
const path = require('path');

const geojsonPath = path.join(__dirname, '../public/tn_ac_2021_constituencies.geojson');
const geoData = JSON.parse(fs.readFileSync(geojsonPath, 'utf8'));

// Map AC_NO to the exactly expected candidate normalized string
const AC_PATCHES = {
  70: "Gingee",
  50: "Tirupattur",
  185: "Tiruppathur",
  141: "Tiruchirappalli (East)",
  140: "Tiruchirappalli (West)",
  39: "Sholinghur",
  152: "Vridhachalam",
  74: "Villupuram",
  27: "Sholinganallur",
  200: "Bodinayakkanur",
  111: "Mettupalayam",
  9: "Madhavaram",
  57: "Palacode",
  165: "Vedharanyam",
  19: "Chepauk-Thiruvallikeni",
  212: "Mudukulathur",
  95: "Paramathivelur",
  7: "Madhuravoyal",
  214: "Thoothukudi",
  60: "Pappireddipatti",
  11: "Dr.Radhakrishnan Nagar",
  56: "Thally",
  10: "Thiruvottiyur",
  231: "Colachal",
  207: "Aruppukottai",
  178: "Gandarvakottai"
};

let patchedCount = 0;

geoData.features.forEach(feature => {
  const acNo = feature.properties.AC_NO;
  if (AC_PATCHES[acNo]) {
    console.log(`Patching AC_NO ${acNo}: ${feature.properties.AC_NAME} -> ${AC_PATCHES[acNo]}`);
    feature.properties.AC_NAME = AC_PATCHES[acNo];
    patchedCount++;
  }
});

console.log(`Successfully patched ${patchedCount} features.`);

fs.writeFileSync(geojsonPath, JSON.stringify(geoData, null, 2), 'utf8');
console.log('Saved patched GeoJSON!');
