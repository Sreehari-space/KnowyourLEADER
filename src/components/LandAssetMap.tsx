/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * LandAssetMap — where a candidate's declared immovable property sits, on a
 * real, zoomable map.
 *
 * Form 26 records a property as a line of text: a village, a taluk, a survey
 * number, an area, a purchase date, a value. This reads those lines back and
 * puts each one on OpenStreetMap, so a reader can see whether a candidate's
 * declared land sits in one taluk or is spread across ten districts, and can
 * zoom in far enough to recognise the place.
 *
 * Areas, not pins — and why
 * -------------------------
 * The declarations resolve only as far as a constituency or a district. On a
 * zoomable map a pin would be a lie: at close zoom it would sit on somebody's
 * roof and read as "this is their house". So the located thing is drawn as the
 * whole shaded constituency or district — real boundary geometry — and the
 * mark at its centre is a label for that area, not a position. Zoom in and the
 * shading spreads across a whole taluk, which is exactly as precise as the
 * data really is. Survey-number geometry lives in the state's land records and
 * is not public, so a plot boundary is never drawn.
 *
 * Every property that could not be located is listed in full rather than
 * dropped — hiding a declaration is the one thing this site must never do.
 *
 * Geometry comes from public/data/property_map.json, built by
 * scripts/buildPropertyMap.cjs out of the 234 constituency polygons the
 * repository already ships. Tiles and the map data are fetched only when a
 * reader opens the map.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Loader2, AlertCircle, ChevronDown, Maximize2 } from 'lucide-react';
import { AffidavitSection } from '../utils/affidavitLoader';
import { itemizeDeclaration, formatINR } from '../utils/declarationItems';

// ─── Base map ───────────────────────────────────────────────────────────

/**
 * The tile source, in one place.
 *
 * OpenStreetMap's own servers carry a usage policy — attribution is required,
 * and heavy or app-distributed use is meant to ask first. Keeping the template
 * and its attribution together in one constant means moving to a keyed
 * provider later is this object and nothing else.
 */
const BASEMAP = {
  url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxZoom: 19,
};

// ─── The generated geography ────────────────────────────────────────────

interface Place {
  lat: number;
  lon: number;
  tier: 'ac' | 'district';
  district: string;
  label: string;
}

interface Constituency {
  name: string;
  district: string;
  /** Closed rings as [lat, lon] — the order Leaflet takes. */
  rings: Array<Array<[number, number]>>;
  lat: number;
  lon: number;
}

interface PropertyMapData {
  acs: Constituency[];
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
 * together — as they do on a map, where every mark neighbours every other —
 * and fails at four. The head a property was actually declared under is never
 * lost: it is named on every list row beneath the map.
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
      'Approximate. The shaded area is the whole constituency or district named in the declaration — the property is somewhere inside it, not at the marker. Survey-number boundaries are not public data, so no plot is drawn.',
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
    selectHint: 'Select an area to zoom to it and list what was declared there.',
    allProperties: 'All mapped properties',
    area: 'Area',
    past: '2021',
    pastNote: 'Hollow marks are from the 2021 declaration.',
    district: 'district',
    constituency: 'constituency',
    shadedArea: 'shaded area',
    resetView: 'Show all',
    scrollHint: 'Click the map to zoom with the wheel',
  },
  ta: {
    title: 'அறிவிக்கப்பட்ட சொத்து எங்கே',
    loading: 'வரைபடம் ஏற்றப்படுகிறது',
    failed: 'வரைபடத்தை ஏற்ற முடியவில்லை. கீழே உள்ள அறிவிப்புகள் பாதிக்கப்படவில்லை.',
    caption:
      'தோராயமானது. நிழலிடப்பட்ட பகுதி அறிவிப்பில் குறிப்பிடப்பட்ட முழுத் தொகுதி அல்லது மாவட்டம் — சொத்து அதற்குள் எங்கோ உள்ளது, குறியில் அல்ல. புல எண் எல்லைகள் பொதுத் தரவு அல்ல, எனவே நிலம் வரையப்படவில்லை.',
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
    selectHint: 'ஒரு பகுதியைத் தேர்ந்தெடுத்தால் அங்கே பெரிதாக்கி, அறிவிக்கப்பட்டதைக் காட்டும்.',
    allProperties: 'வரைபடத்தில் உள்ள அனைத்துச் சொத்துகளும்',
    area: 'பரப்பளவு',
    past: '2021',
    pastNote: 'உள்ளீடற்ற குறிகள் 2021 அறிவிப்பிலிருந்து.',
    district: 'மாவட்டம்',
    constituency: 'தொகுதி',
    shadedArea: 'நிழலிட்ட பகுதி',
    resetView: 'அனைத்தையும் காட்டு',
    scrollHint: 'சக்கரத்தால் பெரிதாக்க வரைபடத்தை சொடுக்கவும்',
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

interface MapArea {
  key: string;
  place: Place;
  items: PropertyRecord[];
  value: number;
  past: boolean;
  group: GroupKey;
  rings: Array<Array<[number, number]>>;
}

/**
 * A mark drawn in HTML rather than as a Leaflet image marker.
 *
 * divIcon sidesteps the classic bundler trap where Leaflet's default icon
 * resolves its PNGs relative to the CSS and silently 404s, and it lets each
 * category keep its own shape — identity never rests on colour alone.
 */
function markIcon(area: MapArea, active: boolean): L.DivIcon {
  const { colour, shape } = GROUPS[area.group];
  const count = area.items.length;
  const size = count > 99 ? 40 : count > 1 ? 34 : 26;
  const radius = shape === 'circle' ? '9999px' : '3px';
  const rotate = shape === 'diamond' ? 'rotate(45deg)' : 'none';

  return L.divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `
      <div style="
        width:${size}px;height:${size}px;
        background:${area.past ? '#ffffff' : colour};
        border:${area.past ? `2px dashed ${colour}` : `2px solid #ffffff`};
        outline:${active ? `3px solid ${colour}` : 'none'};
        border-radius:${radius};transform:${rotate};
        box-shadow:0 1px 4px rgba(15,23,42,.4);
        display:flex;align-items:center;justify-content:center;">
        <span style="
          transform:${shape === 'diamond' ? 'rotate(-45deg)' : 'none'};
          color:${area.past ? colour : '#ffffff'};
          font:700 ${count > 99 ? 12 : 13}px system-ui,sans-serif;
          font-variant-numeric:tabular-nums;">${count > 1 ? count : ''}</span>
      </div>`,
  });
}

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
  const [showUnlocated, setShowUnlocated] = useState(false);
  const [wheelEnabled, setWheelEnabled] = useState(false);

  const holder = useRef<HTMLDivElement | null>(null);
  const map = useRef<L.Map | null>(null);
  const layers = useRef<L.LayerGroup | null>(null);
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
   * Properties collapse to one area per place, so a candidate with 118
   * holdings around Coimbatore gets one shaded district carrying a count,
   * rather than 118 marks on a single point.
   */
  const areas = useMemo<MapArea[]>(() => {
    if (!data) return [];
    const byPlace = new Map<string, MapArea>();

    for (const record of records) {
      if (!record.placeKey || record.placeKey === OUTSIDE_TN) continue;
      const place = data.places[record.placeKey];
      if (!place) continue;
      let entry = byPlace.get(record.placeKey);
      if (!entry) {
        // A constituency shades its own polygon; a district shades every
        // constituency inside it, which is the same outline drawn in parts.
        const rings = place.tier === 'ac'
          ? (data.acs.find(ac => ac.name === record.placeKey)?.rings ?? [])
          : data.acs.filter(ac => ac.district === place.district).flatMap(ac => ac.rings);
        entry = {
          key: record.placeKey, place, items: [], value: 0, past: true,
          group: 'land', rings,
        };
        byPlace.set(record.placeKey, entry);
      }
      entry.items.push(record);
      entry.value += record.value || 0;
      if (!record.past) entry.past = false;
    }

    for (const entry of byPlace.values()) {
      // The area takes the colour of whichever group holds most there; the
      // list beneath spells out the rest.
      const weight = new Map<GroupKey, number>();
      for (const item of entry.items) {
        weight.set(item.group, (weight.get(item.group) || 0) + (item.value || 0) + 1);
      }
      entry.group = [...weight.entries()].sort((a, b) => b[1] - a[1])[0][0];
    }

    return [...byPlace.values()].sort((a, b) => b.value - a.value);
  }, [records, data]);

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
  const hasPast = useMemo(() => areas.some(area => area.past), [areas]);
  const activeArea = areas.find(area => area.key === selected) || null;
  const listed = activeArea
    ? activeArea.items
    : records.filter(record => record.placeKey && record.placeKey !== OUTSIDE_TN);

  /** Every shaded area, for the default view. */
  const allBounds = useMemo(() => {
    const points = areas.flatMap(area => area.rings.flat());
    return points.length ? L.latLngBounds(points as L.LatLngExpression[]) : null;
  }, [areas]);

  // ── The map itself ────────────────────────────────────────────────────

  useEffect(() => {
    if (state !== 'ready' || !holder.current || map.current || !areas.length) return;

    const instance = L.map(holder.current, {
      // The dossier is a scrolling pane. A map that grabs the wheel traps the
      // reader, so the wheel is off until they click into the map.
      scrollWheelZoom: false,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer(BASEMAP.url, {
      attribution: BASEMAP.attribution,
      maxZoom: BASEMAP.maxZoom,
    }).addTo(instance);

    layers.current = L.layerGroup().addTo(instance);
    map.current = instance;

    instance.on('click', () => {
      instance.scrollWheelZoom.enable();
      setWheelEnabled(true);
    });
    instance.on('mouseout', () => {
      instance.scrollWheelZoom.disable();
      setWheelEnabled(false);
    });

    // The pane is inside a modal that animates open; Leaflet measures a
    // container that has not settled unless told to look again.
    const settle = window.setTimeout(() => instance.invalidateSize(), 250);

    return () => {
      window.clearTimeout(settle);
      instance.remove();
      map.current = null;
      layers.current = null;
    };
  }, [state, areas.length]);

  /** Draw the areas, and redraw when the selection changes. */
  useEffect(() => {
    const instance = map.current;
    const group = layers.current;
    if (!instance || !group) return;

    group.clearLayers();

    for (const area of areas) {
      const { colour } = GROUPS[area.group];
      const active = area.key === selected;

      if (area.rings.length) {
        L.polygon(area.rings as L.LatLngExpression[][], {
          color: colour,
          weight: active ? 2.5 : 1.5,
          opacity: active ? 0.95 : 0.7,
          fillColor: colour,
          fillOpacity: active ? 0.22 : 0.12,
          interactive: true,
        })
          .on('click', () => setSelected(current => (current === area.key ? null : area.key)))
          .addTo(group);
      }

      const count = area.items.length;
      L.marker([area.place.lat, area.place.lon], {
        icon: markIcon(area, active),
        keyboard: true,
        title: `${area.place.label} — ${count} ${count === 1 ? t.property : t.properties}, ${formatINR(area.value)}`,
        alt: area.place.label,
      })
        .on('click', () => setSelected(current => (current === area.key ? null : area.key)))
        .addTo(group);
    }
  }, [areas, selected, t]);

  /** Frame the selection, or everything when there is none. */
  useEffect(() => {
    const instance = map.current;
    if (!instance) return;
    const bounds = activeArea && activeArea.rings.length
      ? L.latLngBounds(activeArea.rings.flat() as L.LatLngExpression[])
      : allBounds;
    if (bounds) instance.fitBounds(bounds, { padding: [24, 24], maxZoom: 12, animate: true });
  }, [activeArea, allBounds]);

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

      {areas.length === 0 ? (
        <p className="text-[13px] text-slate-600 leading-relaxed">{t.nothingPlaced}</p>
      ) : (
        /* The map takes the full width of the pane rather than sharing a row
           with the list. Split side by side it came out 317px wide, which is
           too cramped to pan and zoom in; the list reads perfectly well
           beneath it. */
        <div>
          <div className="min-w-0">
            <div
              ref={holder}
              className="h-[26rem] w-full rounded-xl border border-slate-200 overflow-hidden bg-slate-100 z-0"
            />

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2">
              {GROUP_ORDER.filter(key => groupCounts[key] > 0).map(key => (
                <span key={key} className="flex items-center gap-1.5 text-[11px] text-slate-600">
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
                </span>
              ))}
              {hasPast && <span className="text-[11px] text-slate-500">{t.pastNote}</span>}
              {!wheelEnabled && (
                <span className="text-[11px] text-slate-400">{t.scrollHint}</span>
              )}
              {activeArea && (
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="ml-auto inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  <Maximize2 className="w-3 h-3" />
                  {t.resetView}
                </button>
              )}
            </div>
          </div>

          <div className="min-w-0 mt-4 pt-3 border-t border-slate-100">
            <div className="flex items-baseline justify-between gap-2 mb-2">
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest font-mono">
                {activeArea ? activeArea.place.label : t.allProperties}
              </span>
              {activeArea && (
                <span className="text-[10px] font-mono text-slate-400 shrink-0">
                  {t.shadedArea}: {activeArea.place.tier === 'ac' ? t.constituency : t.district}
                </span>
              )}
            </div>

            {/* Now the list has the full width, auto-fit keeps each row at a
                readable measure instead of one very long line. */}
            <ol className="grid gap-x-5 items-start [grid-template-columns:repeat(auto-fit,minmax(18rem,1fr))] max-h-[22rem] overflow-y-auto pr-1">
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

            {!activeArea && areas.length > 1 && (
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
