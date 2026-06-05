import fs from 'fs';
import path from 'path';

// Define paths
const PUBLIC_DIR = path.resolve(process.cwd(), 'public');
const SITEMAP_PATH = path.join(PUBLIC_DIR, 'sitemap.xml');
const CANDIDATES_PATH = path.join(PUBLIC_DIR, 'merged_candidates.json');
const BASE_URL = 'https://know-your-leader.pages.dev';

// Read candidate data
console.log('Generating dynamic sitemap...');
const candidatesRaw = fs.readFileSync(CANDIDATES_PATH, 'utf-8');
const candidates = JSON.parse(candidatesRaw);

// Extract unique parties
const parties = Array.from(new Set(candidates.map(c => c.party).filter(Boolean)));

// Current date for lastmod
const today = new Date().toISOString().split('T')[0];

// XML Structure
let xml = `<?xml version="1.0" encoding="UTF-8"?>
<!-- AUTO-GENERATED SITEMAP. DO NOT EDIT MANUALLY. -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

// Helper to add URL
const addUrl = (urlPath, priority = '0.5', changefreq = 'weekly') => {
  // Ensure urlPath starts with / if not empty, but avoid double slashes
  const cleanPath = urlPath.startsWith('/') ? urlPath : `/${urlPath}`;
  const fullUrl = urlPath === '' ? BASE_URL + '/' : BASE_URL + cleanPath;
  
  xml += `  <url>\n`;
  xml += `    <loc>${fullUrl.replace(/&/g, '&amp;')}</loc>\n`;
  xml += `    <lastmod>${today}</lastmod>\n`;
  xml += `    <changefreq>${changefreq}</changefreq>\n`;
  xml += `    <priority>${priority}</priority>\n`;
  xml += `  </url>\n`;
};

// Core Pages
addUrl('', '1.0', 'daily');
addUrl('/affidavits', '0.9', 'daily');
addUrl('/dashboard', '0.8', 'weekly');
addUrl('/compare', '0.8', 'weekly');

// Party Pages
parties.forEach(party => {
  addUrl(`/party/${encodeURIComponent(party)}`, '0.7', 'weekly');
});

// Candidate Profiles
candidates.forEach(candidate => {
  if (candidate.id) {
    addUrl(`/?candidate=${encodeURIComponent(candidate.id)}`, '0.9', 'monthly');
  }
});

xml += `</urlset>\n`;

// Write to sitemap.xml
fs.writeFileSync(SITEMAP_PATH, xml, 'utf-8');
console.log(`Successfully generated sitemap with ${4 + parties.length + candidates.length} URLs at ${SITEMAP_PATH}`);
