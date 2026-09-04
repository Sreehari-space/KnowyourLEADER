/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * LandAssetMap — where a candidate's declared immovable property sits.
 *
 * Form 26 records a property as a line of text: a village, a taluk, a survey
 * number, an area, a purchase date, a value. This reads those lines back and
 * puts each one on a map of Tamil Nadu, so a reader can see at a glance whether
 * a candidate's declared land sits in one taluk or is spread across ten
 * districts — something no amount of scrolling through the text cards shows.
 *
 * What the markers mean, and what they do not
 * -------------------------------------------
 * A marker sits at the centre of the constituency or district named in the
 * declaration. It is not the plot. Survey-number geometry lives in the state's
 * land records and is not public data, so drawing a boundary here would be
 * inventing one. That limit is stated on screen rather than left for the reader
 * to discover, and every property that could not be located is listed in full
 * instead of quietly dropped — hiding a declaration is the one thing this site
 * must never do.
 *
 * Geography comes from public/data/property_map.json, built by
 * scripts/buildPropertyMap.cjs out of the 234 constituency polygons the
 * repository already ships. It is fetched only when a reader opens the map.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MapPin, Loader2, AlertCircle, ChevronDown } from 'lucide-react';
import { AffidavitSection } from '../utils/affidavitLoader';
import { itemizeDeclaration, formatINR } from '../utils/declarationItems';

// ─── The generated geography ────────────────────────────────────────────

interface Place {
  cx: number;
  cy: number;
  tier: 'ac' | 'district';
  district: string;
  label: string;
}

interface PropertyMapData {
  viewBox: string;
  acs: Array<{ name: string; district: string; d: string; cx: number; cy: number }>;
  places: Record<string, Place>;
  aliases: Record<string, string>;
  matchOrder: string[];
  outsideTn: string[];
}

/** Sentinel for a property that names a real place outside Tamil Nadu. The
    leading space keeps it out of the namespace of real place keys. */
const OUTSIDE_TN = ' outside-tn';

let mapDataRequest: Promise<PropertyMapData> | null = null;

function loadPropertyMap(): Promise<PropertyMapData> {
  if (!mapDataRequest) {
    mapDataRequest = fetch('/data/property_map.json')
      .then(response => {
        if (!response.ok) throw new Error(`property_map.json — HTTP ${response.status}`);
        return response.json() as Promise<PropertyMapData>;
      })
      .catch(error => {
        // Clear the cache so opening the map again retries, rather than
        // replaying one failure for the rest of the session.
        mapDataRequest = null;
        throw error;
      });
  }
  return mapDataRequest;
}

/**
 * Resolve one declaration's location text to a place on the map.
 *
 * The same rules run in scripts/buildPropertyMap.cjs, which reports how many
 * records they place; the two must stay in step. Names are tried longest first
 * so a two-word name is never beaten by one of its own words, and a
 * constituency wins over a district of the same name because it is the
 * smaller, more specific answer.
 */
function resolvePlace(location: string, data: PropertyMapData): string | null {
  const text = ` ${location.toUpperCase().replace(/[^A-Z ]+/g, ' ').replace(/\s+/g, ' ')} `;
  for (const name of data.matchOrder) {
    if (text.includes(` ${name} `)) return data.places[name] ? name : data.aliases[name];
  }
  for (const name of data.outsideTn) {
    if (text.includes(` ${name} `)) return OUTSIDE_TN;
  }
  return null;
}

// ─── Categories ─────────────────────────────────────────────────────────

/**
 * The five Form 26 immovable heads, grouped into three for the map only.
 *
 * Three is not an aesthetic choice. A validated categorical palette clears the
 * colour-blind separation floors for three slots when any pair can appear
 * together — as they do on a map, where every mark neighbours every other — and
 * fails at four. The head a property was actually declared under is never lost:
 * it is named on every list row beneath the map.
 */
type GroupKey = 'land' | 'building' | 'other';

const HEAD_GROUP: Record<number, GroupKey> = {
  0: 'land', 1: 'land', 2: 'building', 3: 'building', 4: 'other',
};

const GROUPS: Record<GroupKey, {
  colour: string; shape: 'circle' | 'square' | 'diamond'; en: string; ta: string;
}> = {
  land: { colour: '#2a78d6', shape: 'circle', en: 'Land', ta: 'நிலம்' },
  building: { colour: '#eb6834', shape: 'square', en: 'Buildings', ta: 'கட்டிடங்கள்' },
  other: { colour: '#1baf7a', shape: 'diamond', en: 'Other property', ta: 'பிற சொத்து' },
};

const GROUP_ORDER: GroupKey[] = ['land', 'building', 'other'];

/** A single-hue sequential ramp, light to dark, for district totals. It stays
    at the pale end of indigo so the markers on top remain the figure. */
const DISTRICT_RAMP = ['#eef2ff', '#e0e7ff', '#c7d2fe', '#a5b4fc', '#818cf8'];
const DISTRICT_EMPTY = '#f8fafc';

const RELATION_LABELS: Record<string, { en: string; ta: string }> = {
  self: { en: 'Self', ta: 'தாமே' },
  spouse: { en: 'Spouse', ta: 'வாழ்க்கைத் துணை' },
  huf: { en: 'HUF', ta: 'கூட்டுக் குடும்பம்' },
  dependent1: { en: 'Dependent 1', ta: 'சார்ந்தோர் 1' },
  dependent2: { en: 'Dependent 2', ta: 'சார்ந்தோர் 2' },
  dependent3: { en: 'Dependent 3', ta: 'சார்ந்தோர் 3' },
};

const T = {
  en: {
    title: 'Where the declared property is',
    loading: 'Loading map',
    failed: 'The map could not be loaded. The declarations below are unaffected.',
    caption:
      'Approximate. Each marker sits at the centre of the constituency or district named in the declaration — not on the surveyed plot. Survey-number boundaries are not public data.',
    mapped: 'mapped',
    properties: 'properties',
    property: 'property',
    unlocatedTitle: 'Not on the map',
    unlocatedNote:
      'These were declared but name no place this map can locate. They are listed here in full.',
    outsideTn: 'outside Tamil Nadu',
    noPlace: 'no matching place name',
    nothingPlaced:
      'None of the declared properties name a place this map can locate. Every one of them is listed below.',
    selectHint: 'Select a marker to list what was declared there.',
    allProperties: 'All mapped properties',
    area: 'Area',
    past: '2021',
    pastNote: 'Hollow marks are from the 2021 declaration.',
    district: 'district',
    constituency: 'constituency',
    plottedAt: 'plotted at',
  },
  ta: {
    title: 'அறிவிக்கப்பட்ட சொத்து எங்கே',
    loading: 'வரைபடம் ஏற்றப்படுகிறது',
    failed: 'வரைபடத்தை ஏற்ற முடியவில்லை. கீழே உள்ள அறிவிப்புகள் பாதிக்கப்படவில்லை.',
    caption:
      'தோராயமானது. ஒவ்வொரு குறியும் அறிவிப்பில் குறிப்பிடப்பட்ட தொகுதி அல்லது மாவட்டத்தின் மையத்தில் உள்ளது — அளக்கப்பட்ட நிலத்தில் அல்ல. புல எண் எல்லைகள் பொதுத் தரவு அல்ல.',
    mapped: 'வரைபடத்தில்',
    properties: 'சொத்துகள்',
    property: 'சொத்து',
    unlocatedTitle: 'வரைபடத்தில் இல்லை',
    unlocatedNote:
      'இவை அறிவிக்கப்பட்டவை, ஆனால் இந்த வரைபடம் கண்டறியக்கூடிய இடப்பெயர் இல்லை. அனைத்தும் இங்கே முழுமையாக உள்ளன.',
    outsideTn: 'தமிழ்நாட்டிற்கு வெளியே',
    noPlace: 'பொருந்தும் இடப்பெயர் இல்லை',
    nothingPlaced:
      'அறிவிக்கப்பட்ட சொத்துகளில் எதிலும் இந்த வரைபடம் கண்டறியக்கூடிய இடப்பெயர் இல்லை. அனைத்தும் கீழே பட்டியலிடப்பட்டுள்ளன.',
    selectHint: 'அங்கு அறிவிக்கப்பட்டதைப் பார்க்க ஒரு குறியைத் தேர்ந்தெடுக்கவும்.',
    allProperties: 'வரைபடத்தில் உள்ள அனைத்துச் சொத்துகளும்',
    area: 'பரப்பளவு',
    past: '2021',
    pastNote: 'உள்ளீடற்ற குறிகள் 2021 அறிவிப்பிலிருந்து.',
    district: 'மாவட்டம்',
    constituency: 'தொகுதி',
    plottedAt: 'இடம்',
  },
};

// ─── Reading the declarations ───────────────────────────────────────────

interface PropertyRecord {
  head: number;
  headLabel: string;
  group: GroupKey;
  relation: string;
  description: string;
  area: string | null;
  value: number | null;
  past: boolean;
  placeKey: string | null;
}

/** Every property in one immovable section, resolved against the map. */
function readSection(
  section: AffidavitSection | undefined,
  headings: string[],
  data: PropertyMapData,
  past: boolean,
): PropertyRecord[] {
  if (!section) return [];
  const out: PropertyRecord[] = [];

  for (const [headIndex, relations] of Object.entries(section)) {
    const head = Number(headIndex);
    if (!Number.isFinite(head) || !relations || typeof relations !== 'object') continue;

    for (const [relation, raw] of Object.entries(relations as Record<string, string>)) {
      if (typeof raw !== 'string' || !raw.trim()) continue;

      for (const item of itemizeDeclaration(raw)) {
        const description = item.description.trim();
        if (!description) continue;
        out.push({
          head,
          headLabel: headings[head] || `Head ${head + 1}`,
          group: HEAD_GROUP[head] ?? 'other',
          relation,
          description,
          area: item.attributes.find(a => a.label === 'Total area')?.value ?? null,
          value: item.amount,
          past,
          placeKey: resolvePlace(description, data),
        });
      }
    }
  }
  return out;
}

// ─── Marks ──────────────────────────────────────────────────────────────

/**
 * Marker radius in viewBox units.
 *
 * Area is proportional to declared value — hence a square-root radius. A radius
 * proportional to value makes a large holding look several times more dominant
 * than it is. The floor keeps a modest property big enough to hit with a
 * finger; the ceiling stops one enormous holding covering a district.
 */
function markerRadius(value: number, largest: number): number {
  if (!largest || value <= 0) return 17;
  return 17 + Math.sqrt(value / largest) * 20;
}

/** How far a mark may be nudged off its true point, in viewBox units — about
    2% of the state's width, so a mark never drifts out of its own region. */
const MAX_NUDGE = 26;

/**
 * Separate marks that would otherwise pile up.
 *
 * Two places a few kilometres apart — Anna Nagar and Sholinganallur, say —
 * project to points closer together than the marks drawn on them, and the
 * result is one unreadable blob where the smaller mark looks broken rather than
 * merely behind. This pushes overlapping pairs apart by the smallest amount
 * that separates them, then clamps the total displacement: a mark that has been
 * moved is drawn with a leader line back to the point it belongs to, so the
 * adjustment is visible rather than a quiet lie about where something is.
 */
function relax<T extends { x: number; y: number; trueX: number; trueY: number; r: number }>(marks: T[]): T[] {
  const PADDING = 3;
  for (let pass = 0; pass < 60; pass++) {
    let moved = false;
    for (let i = 0; i < marks.length; i++) {
      for (let j = i + 1; j < marks.length; j++) {
        const a = marks[i];
        const b = marks[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const wanted = a.r + b.r + PADDING;
        const distance = Math.hypot(dx, dy) || 0.01;
        if (distance >= wanted) continue;

        const push = (wanted - distance) / 2;
        // Coincident points have no axis to separate along; give them one.
        const ux = distance < 0.05 ? Math.cos(i * 2.4) : dx / distance;
        const uy = distance < 0.05 ? Math.sin(i * 2.4) : dy / distance;
        a.x -= ux * push;
        a.y -= uy * push;
        b.x += ux * push;
        b.y += uy * push;
        moved = true;
      }
    }
    if (!moved) break;
  }

  for (const mark of marks) {
    const dx = mark.x - mark.trueX;
    const dy = mark.y - mark.trueY;
    const drift = Math.hypot(dx, dy);
    if (drift > MAX_NUDGE) {
      mark.x = mark.trueX + (dx / drift) * MAX_NUDGE;
      mark.y = mark.trueY + (dy / drift) * MAX_NUDGE;
    }
  }
  return marks;
}

const Marker: React.FC<{
  shape: 'circle' | 'square' | 'diamond';
  cx: number; cy: number; r: number;
  colour: string; past: boolean; active: boolean;
}> = ({ shape, cx, cy, r, colour, past, active }) => {
  // A 2px surface ring keeps overlapping marks legible where holdings cluster.
  const common = {
    fill: past ? '#ffffff' : colour,
    stroke: past ? colour : '#ffffff',
    strokeWidth: active ? 6 : 2,
    strokeDasharray: past ? '7 5' : undefined,
    style: { pointerEvents: 'none' as const },
  };

  if (shape === 'square') {
    const side = r * 1.72;
    return <rect x={cx - side / 2} y={cy - side / 2} width={side} height={side} rx={r * 0.28} {...common} />;
  }
  if (shape === 'diamond') {
    const d = r * 1.28;
    return <polygon points={`${cx},${cy - d} ${cx + d},${cy} ${cx},${cy + d} ${cx - d},${cy}`} {...common} />;
  }
  return <circle cx={cx} cy={cy} r={r} {...common} />;
};

// ─── Component ──────────────────────────────────────────────────────────

interface Props {
  section: AffidavitSection | undefined;
  pastSection?: AffidavitSection;
  headings: string[];
  lang: 'en' | 'ta';
}

const LandAssetMap: React.FC<Props> = ({ section, pastSection, headings, lang }) => {
  const t = T[lang];
  const [data, setData] = useState<PropertyMapData | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [showUnlocated, setShowUnlocated] = useState(false);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    loadPropertyMap()
      .then(loaded => {
        if (!alive.current) return;
        setData(loaded);
        setState('ready');
      })
      .catch(() => {
        if (alive.current) setState('failed');
      });
    return () => { alive.current = false; };
  }, []);

  const records = useMemo(() => {
    if (!data) return [];
    return [
      ...readSection(section, headings, data, false),
      ...readSection(pastSection, headings, data, true),
    ];
  }, [data, section, pastSection, headings]);

  /**
   * Properties collapse to one marker per place, so a candidate with forty
   * holdings in one taluk gets one legible mark carrying a count, rather than
   * forty identical marks stacked on a single point.
   */
  const markers = useMemo(() => {
    if (!data) return [];
    const byPlace = new Map<string, {
      place: Place; key: string; items: PropertyRecord[]; value: number; past: boolean;
    }>();

    for (const record of records) {
      if (!record.placeKey || record.placeKey === OUTSIDE_TN) continue;
      const place = data.places[record.placeKey];
      if (!place) continue;
      let entry = byPlace.get(record.placeKey);
      if (!entry) {
        entry = { place, key: record.placeKey, items: [], value: 0, past: true };
        byPlace.set(record.placeKey, entry);
      }
      entry.items.push(record);
      entry.value += record.value || 0;
      if (!record.past) entry.past = false;
    }

    const largest = Math.max(...[...byPlace.values()].map(entry => entry.value), 0);

    const marks = [...byPlace.values()]
      .map(entry => {
        // The mark takes the shape of whichever group holds the most there;
        // the list beneath spells out the rest.
        const weight = new Map<GroupKey, number>();
        for (const item of entry.items) {
          weight.set(item.group, (weight.get(item.group) || 0) + (item.value || 0) + 1);
        }
        const group = [...weight.entries()].sort((a, b) => b[1] - a[1])[0][0];
        return {
          ...entry,
          group,
          r: markerRadius(entry.value, largest),
          x: entry.place.cx, y: entry.place.cy,
          trueX: entry.place.cx, trueY: entry.place.cy,
        };
      })
      // Biggest first in document order, so the smallest paint last and stay
      // reachable where marks overlap.
      .sort((a, b) => b.r - a.r);

    return relax(marks);
  }, [records, data]);

  /** District totals drive the choropleth beneath the markers. */
  const districtFill = useMemo(() => {
    const totals = new Map<string, number>();
    for (const marker of markers) {
      totals.set(marker.place.district, (totals.get(marker.place.district) || 0) + marker.value);
    }
    const largest = Math.max(...totals.values(), 0);
    const fill = new Map<string, string>();
    for (const [district, total] of totals) {
      const step = largest > 0
        ? Math.min(DISTRICT_RAMP.length - 1, Math.floor((total / largest) * DISTRICT_RAMP.length))
        : 0;
      fill.set(district, DISTRICT_RAMP[step]);
    }
    return fill;
  }, [markers]);

  const unlocated = useMemo(
    () => records.filter(record => !record.placeKey || record.placeKey === OUTSIDE_TN),
    [records],
  );

  const groupCounts = useMemo(() => {
    const counts: Record<GroupKey, number> = { land: 0, building: 0, other: 0 };
    for (const record of records) {
      if (record.placeKey && record.placeKey !== OUTSIDE_TN) counts[record.group]++;
    }
    return counts;
  }, [records]);

  const placedCount = records.length - unlocated.length;
  const hasPast = useMemo(() => markers.some(marker => marker.past), [markers]);
  const active = selected || hovered;
  const activeMarker = markers.find(marker => marker.key === active) || null;
  const listed = activeMarker
    ? activeMarker.items
    : records.filter(record => record.placeKey && record.placeKey !== OUTSIDE_TN);

  if (state === 'loading') {
    return (
      <div className="flex items-center justify-center gap-3 py-10 bg-slate-50 border border-slate-200 rounded-2xl mb-6">
        <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
        <span className="text-[13px] font-semibold text-slate-500">{t.loading}</span>
      </div>
    );
  }

  if (state === 'failed' || !data) {
    return (
      <div className="flex items-start gap-2.5 p-4 bg-slate-50 border border-slate-200 rounded-2xl mb-6">
        <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <span className="text-[13px] text-slate-600 leading-relaxed">{t.failed}</span>
      </div>
    );
  }

  return (
    <div className="mb-6 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
      <div className="flex items-baseline justify-between gap-3 flex-wrap mb-3">
        <h5 className="text-[11px] font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-indigo-600" />
          {t.title}
        </h5>
        <span className="text-[11px] font-mono font-semibold text-slate-500 tabular-nums">
          {placedCount}/{records.length} {t.mapped}
        </span>
      </div>

      {markers.length === 0 ? (
        <p className="text-[13px] text-slate-600 leading-relaxed">{t.nothingPlaced}</p>
      ) : (
        /* auto-fit, not a viewport breakpoint: this pane is a fraction of the
           window, so the map and its list sit side by side only once this box
           can actually hold two 16rem columns. */
        <div className="grid gap-4 items-start [grid-template-columns:repeat(auto-fit,minmax(16rem,1fr))]">
          <div className="min-w-0">
            <svg
              viewBox={data.viewBox}
              className="w-full h-auto max-h-[26rem] block"
              // group, not img: an image role makes the markers inside it
              // presentational, and they are the interactive part.
              role="group"
              aria-label={`${placedCount} declared properties across ${districtFill.size} districts of Tamil Nadu`}
            >
              {data.acs.map(ac => (
                <path
                  key={ac.name}
                  d={ac.d}
                  fill={districtFill.get(ac.district) || DISTRICT_EMPTY}
                  stroke="#cbd5e1"
                  strokeWidth={1}
                  vectorEffect="non-scaling-stroke"
                />
              ))}

              {markers.map(marker => {
                const group = GROUPS[marker.group];
                const count = marker.items.length;
                return (
                  <g
                    key={marker.key}
                    role="button"
                    tabIndex={0}
                    aria-label={`${marker.place.label} — ${count} ${count === 1 ? t.property : t.properties}, ${formatINR(marker.value)}`}
                    className="cursor-pointer"
                    onMouseEnter={() => setHovered(marker.key)}
                    onMouseLeave={() => setHovered(null)}
                    onFocus={() => setHovered(marker.key)}
                    onBlur={() => setHovered(null)}
                    onClick={() => setSelected(current => (current === marker.key ? null : marker.key))}
                    onKeyDown={event => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelected(current => (current === marker.key ? null : marker.key));
                      }
                    }}
                  >
                    {/* Where a mark had to be nudged clear of its neighbours, a
                        leader line keeps the point it belongs to visible. */}
                    {Math.hypot(marker.x - marker.trueX, marker.y - marker.trueY) > 4 && (
                      <line
                        x1={marker.trueX} y1={marker.trueY} x2={marker.x} y2={marker.y}
                        stroke={group.colour} strokeWidth={2} strokeOpacity={0.55}
                      />
                    )}
                    {/* A generous invisible hit area: the drawn mark may be
                        small, but the target should not be. */}
                    <circle cx={marker.x} cy={marker.y} r={Math.max(marker.r, 26)} fill="transparent" />
                    <Marker
                      shape={group.shape}
                      cx={marker.x}
                      cy={marker.y}
                      r={marker.r}
                      colour={group.colour}
                      past={marker.past}
                      active={active === marker.key}
                    />
                    {count > 1 && (
                      <text
                        x={marker.x}
                        y={marker.y + marker.r * 0.34}
                        textAnchor="middle"
                        // Three digits will not fit at the width one does.
                        fontSize={marker.r * (count >= 100 ? 0.58 : count >= 10 ? 0.78 : 0.95)}
                        fontWeight="700"
                        fill={marker.past ? group.colour : '#ffffff'}
                        style={{ pointerEvents: 'none' }}
                      >
                        {count}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Identity never rests on colour alone: each group carries its own
                shape, and its count is written out. */}
            <ul className="flex flex-wrap gap-x-3 gap-y-1.5 mt-3">
              {GROUP_ORDER.filter(key => groupCounts[key] > 0).map(key => (
                <li key={key} className="flex items-center gap-1.5 text-[11px] text-slate-600">
                  <span
                    className="inline-block w-2.5 h-2.5 shrink-0"
                    style={{
                      background: GROUPS[key].colour,
                      borderRadius: GROUPS[key].shape === 'circle' ? '9999px' : '2px',
                      transform: GROUPS[key].shape === 'diamond' ? 'rotate(45deg)' : undefined,
                    }}
                  />
                  <span>{GROUPS[key][lang]}</span>
                  <span className="font-mono font-semibold text-slate-500 tabular-nums">{groupCounts[key]}</span>
                </li>
              ))}
              {hasPast && <li className="text-[11px] text-slate-500">{t.pastNote}</li>}
            </ul>
          </div>

          <div className="min-w-0">
            <div className="flex items-baseline justify-between gap-2 mb-2">
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest font-mono">
                {activeMarker ? activeMarker.place.label : t.allProperties}
              </span>
              {activeMarker && (
                <span className="text-[10px] font-mono text-slate-400 shrink-0">
                  {t.plottedAt} {activeMarker.place.tier === 'ac' ? t.constituency : t.district}
                </span>
              )}
            </div>

            <ol className="space-y-2 max-h-[24rem] overflow-y-auto pr-1">
              {listed.map((record, index) => (
                <li
                  key={`${record.head}-${record.relation}-${index}`}
                  className="border-t border-slate-100 first:border-t-0 pt-2 first:pt-0"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[12px] text-slate-700 leading-snug break-words min-w-0">
                      {record.description}
                    </span>
                    {record.value !== null && (
                      <span className="text-[12px] font-mono font-semibold text-slate-900 shrink-0 tabular-nums">
                        {formatINR(record.value)}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <span className="text-[10px] text-slate-600 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5">
                      {record.headLabel}
                    </span>
                    <span className="text-[10px] text-slate-600 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5">
                      {RELATION_LABELS[record.relation.toLowerCase()]?.[lang] || record.relation}
                    </span>
                    {record.area && (
                      <span className="text-[10px] text-slate-600 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5">
                        <span className="text-slate-400">{t.area}:</span> {record.area}
                      </span>
                    )}
                    {record.past && (
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5">
                        {t.past}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ol>

            {!activeMarker && markers.length > 1 && (
              <p className="text-[11px] text-slate-400 mt-2">{t.selectHint}</p>
            )}
          </div>
        </div>
      )}

      <p className="text-[11px] text-slate-500 leading-relaxed mt-3 pt-3 border-t border-slate-100">
        {t.caption}
      </p>

      {unlocated.length > 0 && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setShowUnlocated(open => !open)}
            aria-expanded={showUnlocated}
            className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showUnlocated ? 'rotate-180' : ''}`} />
            <span>
              {t.unlocatedTitle} · <span className="font-mono tabular-nums">{unlocated.length}</span>
            </span>
          </button>

          {showUnlocated && (
            <div className="mt-2">
              <p className="text-[11px] text-slate-500 mb-2 leading-relaxed">{t.unlocatedNote}</p>
              <ul className="space-y-1.5">
                {unlocated.map((record, index) => (
                  <li key={index} className="flex items-start justify-between gap-2">
                    <span className="text-[12px] text-slate-700 leading-snug break-words min-w-0">
                      {record.description}
                      <span className="text-[10px] text-slate-400 ml-1.5">
                        ({record.placeKey === OUTSIDE_TN ? t.outsideTn : t.noPlace})
                      </span>
                    </span>
                    {record.value !== null && (
                      <span className="text-[12px] font-mono font-semibold text-slate-700 shrink-0 tabular-nums">
                        {formatINR(record.value)}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LandAssetMap;
