/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * buildPropertyMap.cjs
 *
 * Builds the geography the dossier's land-assets map draws on, from the one
 * piece of real geometry this repository has: the 234 assembly-constituency
 * polygons in tn_ac_2021_constituencies.geojson.
 *
 * Two things come out of it:
 *
 *   1. Constituency outlines, already projected into SVG coordinates, so the
 *      component does no projection arithmetic and never has to fetch the
 *      2.4 MB GeoJSON. Districts are not emitted as separate paths — every
 *      constituency carries its district name, so the map colours a district
 *      by filling its members, which costs nothing extra.
 *
 *   2. A place index: every name a declaration might use — constituency,
 *      district, and a short table of real name variants — pointing at the
 *      centroid to plot it at.
 *
 * What this deliberately does NOT do is invent coordinates. Tamil Nadu's taluk
 * and village boundaries are not in this repository and no geocoding service is
 * reachable from the build, so a place that cannot be resolved against real
 * geometry is left unresolved and reported as such. Most TN taluk names are
 * also constituency names, which is why taluk-level text resolves as well as it
 * does; the UI says plainly that a marker sits at the centre of that
 * constituency or district, not on the surveyed plot.
 *
 * Input : public/tn_ac_2021_constituencies.geojson
 *         public/data/affidavit_chunk_*.json      (for the coverage report)
 *         public/data/affidavit2021_chunk_*.json
 * Output: public/data/property_map.json
 *
 * Usage: node scripts/buildPropertyMap.cjs
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { extractProperties } = require('./lib/propertyRecords.cjs');

const ROOT = path.resolve(__dirname, '..');
const GEOJSON = path.join(ROOT, 'public', 'tn_ac_2021_constituencies.geojson');
const DATA_DIR = path.join(ROOT, 'public', 'data');
const OUT = path.join(DATA_DIR, 'property_map.json');

/** Width of the projected map in SVG units; height follows the real aspect. */
const MAP_WIDTH = 1000;

/**
 * Douglas–Peucker tolerance in degrees. At 0.01 the 234 rings drop from 21,929
 * points to 7,397 — a third of the vertices — with no visible change at the
 * size this map is ever drawn. Raising it starts eating coastline.
 */
const SIMPLIFY_EPSILON = 0.01;

/** Tamil Nadu's real extent, used as an assertion rather than as data. */
const TN_BBOX = { minLon: 76.0, maxLon: 80.6, minLat: 7.9, maxLat: 13.8 };

// ─── Geometry ───────────────────────────────────────────────────────────

/**
 * Web Mercator's y term, returned in the same units as x — degrees.
 *
 * The bare expression is in radians while longitude stays in degrees, and
 * mixing the two silently flattens the map: the first run of this script
 * produced a viewBox of "0 0 1000 24" for a state taller than it is wide. The
 * 180/PI factor is what keeps the aspect ratio true.
 */
const mercatorY = (lat) => (180 / Math.PI) * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 180 / 2));

/** Perpendicular distance from a point to the segment a→b. */
function pointToSegment(p, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  if (dx === 0 && dy === 0) return Math.hypot(p[0] - a[0], p[1] - a[1]);
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}

/**
 * Douglas–Peucker, iterative rather than recursive: a few of these rings are
 * long enough that the recursive form overflows the stack.
 */
function simplify(points, epsilon) {
  if (points.length < 3) return points.slice();
  const keep = new Uint8Array(points.length);
  keep[0] = 1;
  keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];

  while (stack.length) {
    const [first, last] = stack.pop();
    let worst = 0;
    let index = -1;
    for (let i = first + 1; i < last; i++) {
      const d = pointToSegment(points[i], points[first], points[last]);
      if (d > worst) {
        worst = d;
        index = i;
      }
    }
    if (index !== -1 && worst > epsilon) {
      keep[index] = 1;
      stack.push([first, index], [index, last]);
    }
  }

  const out = [];
  for (let i = 0; i < points.length; i++) if (keep[i]) out.push(points[i]);
  return out;
}

/**
 * Centroid of a closed ring by the shoelace formula — the centre of the area,
 * not the average of the vertices, which drifts towards whichever edge was
 * drawn in most detail.
 */
function ringCentroid(ring) {
  let twiceArea = 0;
  let x = 0;
  let y = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const [x0, y0] = ring[i];
    const [x1, y1] = ring[i + 1];
    const cross = x0 * y1 - x1 * y0;
    twiceArea += cross;
    x += (x0 + x1) * cross;
    y += (y0 + y1) * cross;
  }
  if (Math.abs(twiceArea) < 1e-12) {
    const sx = ring.reduce((s, p) => s + p[0], 0);
    const sy = ring.reduce((s, p) => s + p[1], 0);
    return [sx / ring.length, sy / ring.length];
  }
  const area = twiceArea / 2;
  return [x / (6 * area), y / (6 * area)];
}

// ─── Names ──────────────────────────────────────────────────────────────

/** "GUMMIDIPOONDI (SC)" and "Gummidipoondi" must compare equal. */
const normaliseName = (name) =>
  String(name || '').toUpperCase().replace(/\s*\((?:SC|ST)\)\s*/g, ' ').replace(/\s+/g, ' ').trim();

/** Title case for display: the source data is shouted, the UI is not. */
const titleCase = (name) =>
  normaliseName(name).toLowerCase().replace(/(^|[\s(\-/])([a-z])/g, (_, lead, ch) => lead + ch.toUpperCase());

/**
 * Name variants that appear in declarations but not in the constituency data.
 *
 * Every entry is a real, checkable Tamil Nadu name — an older spelling, an
 * anglicisation, or the short form people actually write — never a guess at
 * where somewhere might be. The count is how many 2026 property records the
 * variant appears in, measured before this table existed.
 */
const NAME_VARIANTS = {
  CHENGALPET: 'CHENGALPATTU',        // 79 records
  KANCHIPURAM: 'KANCHEEPURAM',       // 59
  TRICHY: 'TIRUCHIRAPPALLI',         // 52
  TIRUCHY: 'TIRUCHIRAPPALLI',
  TIRUCHIRAPALLI: 'TIRUCHIRAPPALLI',
  KANYAKUMARI: 'KANNIYAKUMARI',      // 32
  TIRUPUR: 'TIRUPPUR',
  TIRUPPUR: 'TIRUPPUR',
  COVAI: 'COIMBATORE',
  KOVAI: 'COIMBATORE',
  MADRAS: 'CHENNAI',
  TUTICORIN: 'THOOTHUKUDI',
  THOOTHUKKUDI: 'THOOTHUKUDI',
  NELLAI: 'TIRUNELVELI',
  TIRUNELVELLI: 'TIRUNELVELI',
  VELLORE: 'VELLORE',
  NAGERCOIL: 'NAGERCOIL',
};

/**
 * Places outside Tamil Nadu, named often enough in declarations to be worth
 * telling a reader about rather than silently dropping. A property here is not
 * a failure to match — it is genuinely off this map.
 */
const OUTSIDE_TN = [
  'NEW DELHI', 'DELHI', 'KERALA', 'KARNATAKA', 'BANGALORE', 'BENGALURU', 'MYSORE',
  'MUMBAI', 'MAHARASHTRA', 'ANDHRA PRADESH', 'TELANGANA', 'HYDERABAD', 'GUJARAT',
  'PUDUCHERRY', 'PONDICHERRY', 'GOA', 'NOIDA', 'GURGAON', 'KOLKATA', 'ERNAKULAM',
  'TRIVANDRUM', 'THIRUVANANTHAPURAM', 'KOCHI', 'COCHIN', 'PALAKKAD', 'IDUKKI',
];

// ─── Build ──────────────────────────────────────────────────────────────

function buildGeography() {
  const geo = JSON.parse(fs.readFileSync(GEOJSON, 'utf8'));

  // Bounds first: everything else is expressed relative to them.
  let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
  for (const feature of geo.features) {
    for (const polygon of feature.geometry.coordinates) {
      for (const ring of polygon) {
        for (const [lon, lat] of ring) {
          if (lon < minLon) minLon = lon;
          if (lon > maxLon) maxLon = lon;
          if (lat < minLat) minLat = lat;
          if (lat > maxLat) maxLat = lat;
        }
      }
    }
  }

  const minY = mercatorY(minLat);
  const maxY = mercatorY(maxLat);
  const scale = MAP_WIDTH / (maxLon - minLon);
  const height = (maxY - minY) * scale;

  const projectX = (lon) => (lon - minLon) * scale;
  const projectY = (lat) => (maxY - mercatorY(lat)) * scale;

  const acs = [];
  const places = Object.create(null);
  const districtCentroids = new Map();

  for (const feature of geo.features) {
    const name = normaliseName(feature.properties.AC_NAME);
    const district = normaliseName(feature.properties.DIST_NAME);

    // Every ring is drawn — islands and enclaves are part of the shape — but
    // the centroid comes from the largest, which is the mainland body.
    const subpaths = [];
    let largest = [];
    for (const polygon of feature.geometry.coordinates) {
      for (const ring of polygon) {
        const simplified = simplify(ring, SIMPLIFY_EPSILON);
        if (simplified.length < 4) continue;
        const d = simplified
          .map(([lon, lat], i) => `${i ? 'L' : 'M'}${projectX(lon).toFixed(1)} ${projectY(lat).toFixed(1)}`)
          .join(' ');
        subpaths.push(`${d}Z`);
        if (ring.length > largest.length) largest = ring;
      }
    }
    if (!subpaths.length) continue;

    const [lon, lat] = ringCentroid(largest);
    if (lon < TN_BBOX.minLon || lon > TN_BBOX.maxLon || lat < TN_BBOX.minLat || lat > TN_BBOX.maxLat) {
      throw new Error(`${name} centroid ${lon.toFixed(3)},${lat.toFixed(3)} falls outside Tamil Nadu — check the geometry`);
    }

    const cx = Number(projectX(lon).toFixed(1));
    const cy = Number(projectY(lat).toFixed(1));

    acs.push({ name, district, d: subpaths.join(' '), cx, cy });

    // A constituency name wins over a district of the same name: it is the
    // smaller, more specific area, so it is the better answer when a
    // declaration names it.
    places[name] = { cx, cy, tier: 'ac', district, label: titleCase(name) };

    if (!districtCentroids.has(district)) districtCentroids.set(district, []);
    districtCentroids.get(district).push([cx, cy]);
  }

  for (const [district, points] of districtCentroids) {
    if (places[district]) continue;
    const cx = Number((points.reduce((s, p) => s + p[0], 0) / points.length).toFixed(1));
    const cy = Number((points.reduce((s, p) => s + p[1], 0) / points.length).toFixed(1));
    places[district] = { cx, cy, tier: 'district', district, label: titleCase(district) };
  }

  const aliases = Object.create(null);
  for (const [variant, canonical] of Object.entries(NAME_VARIANTS)) {
    if (places[variant]) continue;          // already a real name; no alias needed
    if (places[canonical]) aliases[variant] = canonical;
  }

  // Longest first, so "TIRUCHIRAPPALLI" is tried before "TIRU…" prefixes and
  // a two-word name is never beaten by one of its own words.
  const matchOrder = [...Object.keys(places), ...Object.keys(aliases)]
    .sort((a, b) => b.length - a.length || a.localeCompare(b));

  return {
    viewBox: `0 0 ${MAP_WIDTH} ${Math.ceil(height)}`,
    acs,
    places,
    aliases,
    matchOrder,
    outsideTn: OUTSIDE_TN.slice().sort((a, b) => b.length - a.length),
  };
}

// ─── Coverage report ────────────────────────────────────────────────────

/** The same resolution the component performs, run here to report on it. */
function resolve(location, geography) {
  const text = ` ${String(location).toUpperCase().replace(/[^A-Z ]+/g, ' ').replace(/\s+/g, ' ')} `;
  for (const name of geography.matchOrder) {
    if (text.includes(` ${name} `)) {
      return geography.places[name] ? name : geography.aliases[name];
    }
  }
  for (const name of geography.outsideTn) {
    if (text.includes(` ${name} `)) return 'OUTSIDE_TN';
  }
  return null;
}

function blankStats() {
  return {
    records: 0, placed: 0, outsideTn: 0, unmatched: 0,
    byTier: { ac: 0, district: 0 },
    candidatesWithProperty: 0, candidatesWithMarker: 0,
  };
}

function report(geography) {
  const files = fs.readdirSync(DATA_DIR).filter((f) => /^affidavit(?:2021)?_chunk_\d+\.json$/.test(f));
  const stats = { y2026: blankStats(), y2021: blankStats() };

  for (const file of files) {
    const into = stats[file.startsWith('affidavit2021') ? 'y2021' : 'y2026'];
    const chunk = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8'));
    for (const affidavit of Object.values(chunk)) {
      const records = extractProperties(affidavit);
      if (!records.length) continue;
      into.candidatesWithProperty++;
      let placedHere = 0;
      for (const record of records) {
        into.records++;
        const hit = resolve(record.location, geography);
        if (!hit) into.unmatched++;
        else if (hit === 'OUTSIDE_TN') into.outsideTn++;
        else {
          into.placed++;
          placedHere++;
          into.byTier[geography.places[hit].tier]++;
        }
      }
      if (placedHere) into.candidatesWithMarker++;
    }
  }
  return stats;
}

// ─── Main ───────────────────────────────────────────────────────────────

function main() {
  const geography = buildGeography();
  const stats = report(geography);

  // No build timestamp: this file is committed, and a clock reading in it
  // would put a spurious diff in every rebuild. The same inputs must give the
  // same bytes.
  const payload = {
    source: 'public/tn_ac_2021_constituencies.geojson',
    note: 'Marker positions are constituency or district centroids, not surveyed plot locations.',
    viewBox: geography.viewBox,
    acs: geography.acs,
    places: geography.places,
    aliases: geography.aliases,
    matchOrder: geography.matchOrder,
    outsideTn: geography.outsideTn,
    stats,
  };

  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(payload));

  const kb = (fs.statSync(OUT).size / 1024).toFixed(0);
  console.log(`constituencies   ${geography.acs.length}`);
  console.log(`places indexed   ${Object.keys(geography.places).length} (+${Object.keys(geography.aliases).length} name variants)`);
  console.log(`viewBox          ${geography.viewBox}`);

  for (const [year, s] of Object.entries(stats)) {
    const pct = (n) => `${((n / s.records) * 100).toFixed(1)}%`.padStart(6);
    console.log('');
    console.log(`${year.slice(1)}  ${s.records} property records from ${s.candidatesWithProperty} candidates`);
    console.log(`      placed     ${String(s.placed).padStart(5)} ${pct(s.placed)}   ${s.byTier.ac} constituency, ${s.byTier.district} district`);
    console.log(`      outside TN ${String(s.outsideTn).padStart(5)} ${pct(s.outsideTn)}`);
    console.log(`      unmatched  ${String(s.unmatched).padStart(5)} ${pct(s.unmatched)}`);
    console.log(`      ${s.candidatesWithMarker}/${s.candidatesWithProperty} candidates get at least one marker`);
  }
  console.log('');
  console.log(`wrote ${path.relative(ROOT, OUT)} (${kb} KB)`);
}

main();
