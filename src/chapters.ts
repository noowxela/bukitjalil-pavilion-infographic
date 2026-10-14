// Chapter definitions for Bukit Jalil Sports City (map-assets spot "bukit-jalil").
// Every figure is computed from the processed data in map-assets or quoted from its cited facts.json (see the source
// lines); numbers that are not sourced are labelled illustrative or estimate. All text comes from ./i18n.
import { climate, sunPosition, mytDate, solarNoon, compassIndex, groundSamples, type Area, type XY, type Route, type Building, type Share, type Fact } from '@map-assets';
import { fmt } from './format';
import { linePill } from './linePill';
import type { SceneMode, View, World } from './scene';
import { t } from './i18n';

export interface PinDef { id: string; title: string; value?: string; at: [number, number, number]; kind: 'station' | 'major' | 'minor'; color?: string; accent?: string; icon?: string /* trusted inline SVG */ }
export interface StatDef { fig: string; unit?: string; cap: string; swatch?: string }
export interface Chapter {
  id: number; label: string; tab: string; title: string[]; lead: string; stats: StatDef[]; hint?: string; source: string;
  legend?: { title: string; items: { swatch: string; label: string; desc: string }[] };
  view: View; mode: Partial<SceneMode>; pins: PinDef[]; turntable?: boolean; ghosts?: boolean; park?: boolean; credit?: boolean; crowd?: boolean;
  panel?: (el: HTMLElement, world: World, ctx: PanelCtx) => void;
}
export interface PanelCtx { flyTo: (v: View) => void; chapterView: View; onCleanup: (f: () => void) => void }

const D = (n: XY, y = 0): [number, number, number] => [n[0], y, -n[1]];
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const LRT = 'var(--c-lrt)';
const ZONES4 = ['pavilion', 'sports', 'city', 'park'] as const;

// ---------- helpers ----------
const lenOf = (pts: XY[]) => pts.reduce((s, p, i) => (i ? s + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0), 0);
const longestNamed = <T extends { name: string | null; pts: XY[] }>(arr: T[], name: string) => {
  const cand = arr.filter((a) => a.name === name); if (!cand.length) return null;
  const best = cand.sort((a, b) => lenOf(b.pts) - lenOf(a.pts))[0]; return best.pts[Math.floor(best.pts.length / 2)];
};
const ringArea = (ring: XY[]) => Math.abs(ring.reduce((s, p, i) => { const q = ring[(i + 1) % ring.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0)) / 2;
const nn = <T,>(a: (T | null | undefined)[]) => a.filter((x): x is T => !!x);
const h = (tag: string, attrs: Record<string, string> = {}, html = '') => { const e = document.createElement(tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); e.innerHTML = html; return e; };
function toggle(parent: HTMLElement, label: string, checked: boolean, onChange: (v: boolean) => void, swatch?: string) {
  const l = h('label', { class: 'toggle' }); const i = h('input', { type: 'checkbox', role: 'switch' }) as HTMLInputElement; i.checked = checked;
  i.addEventListener('change', () => onChange(i.checked)); l.append(i);
  if (swatch) l.append(h('span', { class: 'swatch', style: `background:${swatch}` }));
  l.append(document.createTextNode(label)); parent.append(l); return i;
}
const boundsView = (pts: XY[], minD = 520): View => {
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2; const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
  return { target: [cx, 0, -cy], azimuth: 0.2, polar: 0.78, distance: Math.max(minD, span * 2.6) };
};
const routePts = (r: Route) => r.segments.flatMap((s) => s.pts);
const srcShort = (url: string) => (/wikipedia/.test(url) ? 'Wikipedia' : /edgeprop/.test(url) ? 'EdgeProp' : /propertyguru/.test(url) ? 'PropertyGuru' : /exsim/.test(url) ? 'EXSIM' : /parkgreen/.test(url) ? 'Malton' : 'source');
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);
const SHARE_ORDER: Share[] = ['bridge', 'indoor', 'covered', 'open'];
const sheltered = (r: { byShare: Partial<Record<Share, number>> }) => (r.byShare.bridge || 0) + (r.byShare.indoor || 0) + (r.byShare.covered || 0);
const num = (f: Fact | undefined, k: string) => (f && typeof f[k] === 'number' ? (f[k] as number) : null);
const str = (f: Fact | undefined, k: string) => (f && f[k] != null ? String(f[k]) : '');
const fmtDate = (iso: string) => { const d = new Date(`${iso}T00:00:00Z`); return isNaN(+d) ? iso : `${d.getUTCDate()} ${t().monthsLong[d.getUTCMonth()]} ${d.getUTCFullYear()}`; };

export function heightLabel(b: Pick<Building, 'height' | 'heightSource' | 'levels' | 'heightRef'>, planned = false) {
  const T = t().heights; const r = b.heightRef;
  if (b.heightSource === 'cited' && r) {
    if (planned && r.floors) return T.planned(b.height, r.floors, srcShort(r.url));
    if (r.unit === 'floors' && r.storeyHeight) return T.citedFloors(b.height, r.value, r.storeyHeight, srcShort(r.url));
    return T.citedM(b.height, srcShort(r.url));
  }
  return b.heightSource === 'osm' ? T.osm(b.height) : b.heightSource === 'levels' ? T.levels(b.height, b.levels) : T.estimate(b.height);
}
function shareBar(r: { byShare: Partial<Record<Share, number>>; length: number }) {
  const T = t();
  const bar = h('div', { class: 'share-bar', role: 'img', 'aria-label': SHARE_ORDER.map((k) => `${T.shares[k]} ${fmt(r.byShare[k] || 0)} m`).join(', ') });
  for (const k of SHARE_ORDER) { const v = r.byShare[k] || 0; if (v > 0) bar.append(h('span', { class: `share-${k}`, style: `width:${(v / r.length) * 100}%` })); }
  const legend = h('div', { class: 'share-legend' });
  for (const k of SHARE_ORDER) legend.append(h('div', { class: 'legend-row' }, `<span class="swatch box share-${k}"></span><span class="lg-name">${T.shares[k]}</span><span class="lg-val">${fmt(r.byShare[k] || 0)} m · ${pct(r.byShare[k] || 0, r.length)}%</span>`));
  return [bar, legend];
}

const SUN_YEAR = 2026;
const PRESETS = { mar: [3, 20], jun: [6, 21], dec: [12, 21] } as const;
type PresetKey = keyof typeof PRESETS;

// ---------- chapters (rebuilt on language change) ----------
export function buildChapters(A: Area): Chapter[] {
  const T = t(); const N = T.names; const U = T.units;
  const { meta, stats, facts, routes, walks, anchors, lines, areas, facilities, buildings } = A;
  const F = facts;
  const factsDate = A.factsFetched ?? '';
  const plannedNames = new Set(((F.planned as unknown as { osmName: string }[] | undefined) ?? []).map((p) => p.osmName));
  const isPlanned = (b: Building) => !!b.name && plannedNames.has(b.name);
  const zs = meta.zones;
  const stCode = ['SP17', 'SP19', 'SP20'];
  const stName: Record<string, string> = { SP17: N.sp17, SP18: N.sp18, SP19: N.sp19, SP20: N.sp20 };
  const pill = linePill(4, N.line4);
  const stationPin = (ref: string, value?: string): PinDef | null => {
    const s = A.station(ref); if (!s) return null;
    return { id: `st-${ref}`, title: stName[ref] ?? s.name, value: value ?? ref, at: D(s.c, 13), kind: 'station', color: LRT, icon: pill };
  };
  const placePin = (name: string, title = name, value?: string, kind: PinDef['kind'] = 'major', accent?: string): PinDef | null => {
    const p = A.findPlace(name); if (!p) return null;
    return { id: `pl-${name}`, title, value, at: D(p.c, p.height + 3), kind, accent };
  };
  const anchorPin = (id: string, title: string, value?: string, y = 30, accent?: string): PinDef | null => { const a = anchors[id]; return a ? { id: `an-${id}`, title, value, at: D(a.pt, y), kind: 'major', accent } : null; };
  const textPin = (id: string, title: string, at: XY | null, y = 2, value?: string): PinDef | null => (at ? { id, title, value, at: D(at, y), kind: 'minor' } : null);
  const park = areas.green.find((g) => g.name === 'Taman Rekreasi Bukit Jalil');
  const parkHa = park ? ringArea(park.ring) / 10000 : null;
  const parkC: XY | null = park ? [park.ring.reduce((s, p) => s + p[0], 0) / park.ring.length, park.ring.reduce((s, p) => s + p[1], 0) / park.ring.length] : null;
  const zoneColor = (z: string) => `var(--z-${z})`;
  const zoneRows = () => ZONES4.map((z) => ({ swatch: zoneColor(z), label: T.zones[z], desc: T.zoneDesc[z] }));

  // figures
  const stadium = F.stadium, arena = F.arena, pav = F.pavilion, line4 = F.line4;
  const complexKm2 = num(F.complexAreaKm2, 'value');
  const cap = num(stadium, 'capacity'); const rec = num(stadium, 'recordAttendance');
  const arenaCap = num(arena, 'capacitySports');
  const leg1 = routes.find((r) => r.id === 'leg1'); const legMall = routes.find((r) => r.id === 'leg3');
  const legsTotal = routes.reduce((s, r) => s + r.length, 0); const legsSheltered = routes.reduce((s, r) => s + sheltered(r), 0);
  const walkTotal = walks.reduce((s, r) => s + r.length, 0); const walkShelt = walks.reduce((s, r) => s + sheltered(r), 0);
  const named = (() => { const seen = new Set<string>(); const out: Building[] = []; for (const b of [...buildings].filter((b) => b.name && b.heightSource !== 'estimate' && !b.station).sort((a, b) => b.height - a.height)) { if (seen.has(b.name!)) continue; seen.add(b.name!); out.push(b); } return out.slice(0, 10); })();
  const citedNow = buildings.filter((b) => b.heightSource === 'cited' && !isPlanned(b)).sort((a, b) => b.height - a.height)[0];
  const noon = Object.fromEntries((Object.keys(PRESETS) as PresetKey[]).map((k) => [k, solarNoon(SUN_YEAR, PRESETS[k][0], PRESETS[k][1], meta.center.lat, meta.center.lon)])) as Record<PresetKey, ReturnType<typeof solarNoon>>;
  const noonDir = (k: PresetKey): 'N' | 'S' => (Math.cos((noon[k].pos.azimuth * Math.PI) / 180) > 0 ? 'N' : 'S');
  const wettestIdx = climate.precipitationMm.indexOf(Math.max(...climate.precipitationMm));
  const greens = areas.green.map((g) => ({ name: g.name, ha: ringArea(g.ring) / 10000 })).sort((a, b) => b.ha - a.ha);
  const greenHa = greens.reduce((s, g) => s + g.ha, 0);
  const busRoutes = (() => { const m = new Map<string, number>(); for (const b of facilities.busStops) for (const r of b.routes) m.set(r, (m.get(r) || 0) + 1); return [...m.entries()].sort((a, b) => b[1] - a[1]); })();
  const busWithRoutes = facilities.busStops.filter((b) => b.routes.length).length;
  const parkCap = facilities.parking.reduce((s, p) => s + (p.capacity ?? 0), 0);
  const groundPts = groundSamples(A);
  const roadPin = (id: string, local: string, title: string) => textPin(id, title, longestNamed(lines.roads, local), 2, title === local ? undefined : local);
  const pts = (r?: Route) => (r ? routePts(r) : []);
  const overviewMode: Partial<SceneMode> = { rails: { lrt: 'highlight', ktm: 'hidden', erl: 'hidden', py: 'hidden', mr: 'hidden' }, footways: 'hidden', routeSet: 'none', xray: false, buildingStyle: 'zone', precincts: false };
  const ctxRails = { lrt: 'context', ktm: 'hidden', erl: 'hidden', py: 'hidden', mr: 'hidden' } as const;

  return [
    // ---------------- 00 overview: text panel, 4 zones coloured, slow 360° orbit; the OSM credit shows here only ----------------
    {
      id: 0, label: T.ch0.label, tab: T.ch0.tab, title: T.ch0.title, lead: T.ch0.lead, hint: T.ch0.hint,
      stats: [],
      source: T.ch0.source(T.common.osmSrc(stats.fetchedDate)),
      view: { target: [-60, 0, 60], azimuth: -0.6, polar: 1.0, distance: 3900 },
      turntable: true, park: true, ghosts: true, credit: true,
      mode: overviewMode,
      pins: [],
      panel: (el) => {
        const s = h('section', { class: 'ov-legend' }); s.append(h('h3', {}, T.ch0.legendTitle));
        for (const r of zoneRows()) s.append(h('div', { class: 'ov-legend-row' }, `<span class="swatch box" style="background:${r.swatch}"></span><div><div class="lg-label">${r.label}</div><div class="lg-desc">${r.desc}</div></div>`));
        const ds = h('section', { class: 'ov-data' }); ds.append(h('h3', {}, T.ch0.dataTitle), h('div', { class: 'small' }, T.ch0.dataNote()));
        el.append(s, ds);
      },
    },
    // ---------------- 01 landmarks ----------------
    {
      id: 1, label: T.lm.label, tab: T.lm.tab, title: T.lm.title, lead: T.lm.lead(cap ? fmt(cap) : '—', fmtDate(str(stadium, 'opened'))),
      stats: nn([
        cap ? { fig: fmt(cap), cap: T.lm.statStadium, swatch: zoneColor('sports') } : null,
        num(arena, 'capacitySports') ? { fig: fmt(num(arena, 'capacitySports')!), cap: T.lm.statArena, swatch: zoneColor('sports') } : null,
        num(pav, 'floorAreaM2') ? { fig: fmt(num(pav, 'floorAreaM2')!), cap: T.lm.statPavilion, swatch: zoneColor('pavilion') } : null,
      ]),
      source: T.lm.source(factsDate),
      view: { target: [500, 0, 180], azimuth: -0.35, polar: 0.9, distance: 3000 },
      park: true, ghosts: true,
      mode: overviewMode,
      pins: nn([
        anchorPin('STADIUM', N.stadium, cap ? T.lm.pinStadium(fmt(cap)) : undefined, 45, zoneColor('sports')),
        placePin('Unifi Arena', N.arena, heightLabel(A.findPlace('Unifi Arena')?.building ?? { height: 0, heightSource: 'estimate', levels: null }), 'major', zoneColor('sports')),
        placePin('Stadium Hoki Nasional Malaysia', N.hockey, undefined, 'minor', zoneColor('sports')),
        placePin('Pavilion Bukit Jalil', N.pavilion, A.findPlace('Pavilion Bukit Jalil')?.building ? heightLabel(A.findPlace('Pavilion Bukit Jalil')!.building!) : undefined, 'major', zoneColor('pavilion')),
        placePin('The Park Bukit Jalil', 'The Park Bukit Jalil', A.findPlace('The Park Bukit Jalil')?.building ? heightLabel(A.findPlace('The Park Bukit Jalil')!.building!) : undefined, 'minor', zoneColor('city')),
        parkC ? textPin('lbl-park', N.park, parkC, 4, parkHa ? `${fmt(parkHa, 1)} ${U.ha} · OSM` : undefined) : null,
      ]),
      panel: (el) => {
        const s = h('section'); s.append(h('h3', {}, T.lm.listTitle));
        const rows: [string, string][] = [[N.stadium, T.lm.noHeight]];
        for (const [name, label] of [['Unifi Arena', N.arena], ['Pavilion Bukit Jalil', N.pavilion], ['Hyatt Place', 'Hyatt Place'], ['The Park Bukit Jalil', 'The Park Bukit Jalil'], ['The Link 2', 'The Link 2'], ['Stadium Hoki Nasional Malaysia', N.hockey]] as const) {
          const b = A.findPlace(name)?.building; if (b) rows.push([label, heightLabel(b)]);
        }
        const ul = h('ul', { class: 'station-list' });
        for (const [a, b] of rows) ul.append(h('li', {}, `<div><div>${a}</div><div class="small">${b}</div></div>`));
        s.append(ul);
        const z = h('section', { class: 'ov-legend' });
        for (const r of zoneRows()) z.append(h('div', { class: 'ov-legend-row' }, `<span class="swatch box" style="background:${r.swatch}"></span><div><div class="lg-label">${r.label}</div><div class="lg-desc">${zs[r.label] ? '' : ''}${r.desc}</div></div>`));
        el.append(s, z);
      },
    },
    // ---------------- 02 sports complex ----------------
    {
      id: 2, label: T.sc.label, tab: T.sc.tab, title: T.sc.title, lead: T.sc.lead(complexKm2 != null ? fmt(complexKm2, 1) : '—'),
      stats: nn([
        cap ? { fig: fmt(cap), cap: T.sc.statStadium, swatch: zoneColor('sports') } : null,
        arenaCap ? { fig: fmt(arenaCap), cap: T.sc.statArena, swatch: zoneColor('sports') } : null,
        complexKm2 != null ? { fig: fmt(complexKm2, 1), cap: T.sc.statArea, swatch: zoneColor('sports') } : null,
      ]),
      source: T.sc.source(factsDate),
      // Wider framing so Car Parks A–D and the sports-zone roof field read together.
      view: { target: [1500, 0, 40], azimuth: -0.45, polar: 0.92, distance: 2100 },
      mode: { ...overviewMode, facilities: { hotels: false, parking: true, bus: false, entrances: false } },
      pins: (() => {
        // Curated label pins (no invented massing). XY uses the same equirectangular project as map-assets process-osm.
        const K = Math.PI / 180, R = 6378137, cosLat = Math.cos(meta.center.lat * K);
        const xy = (lat: number, lon: number): XY => [(lon - meta.center.lon) * K * R * cosLat, (lat - meta.center.lat) * K * R];
        const aquatic = xy(3.055384, 101.692967); // Perbadanan Stadium Malaysia / Moovit
        const track = xy(3.054624, 101.691276); // stadium.gov.my TM Stadium Nasional map pin
        // OSM leisure=track relation/9074520 (athletics oval east of MSN Mini Stadium); fallback soccer pitch way/618954828
        const msnTrackGreen = areas.green.find((g) => g.id === 'relation/9074520')
          ?? areas.green.find((g) => g.id === 'way/618954828');
        const msnField: XY | null = msnTrackGreen
          ? [msnTrackGreen.ring.reduce((s, p) => s + p[0], 0) / msnTrackGreen.ring.length,
            msnTrackGreen.ring.reduce((s, p) => s + p[1], 0) / msnTrackGreen.ring.length]
          : xy(3.052087, 101.690789);
        const squashFallback = xy(3.052376, 101.69475); // Moovit; used only if OSM outline missing
        const msn = A.findPlace('Majlis Sukan Negara Malaysia')?.c;
        const gym: XY | null = msn ? [msn[0] + 40, msn[1] + 70] : null; // Gimnasium 3 at Kompleks MSN (KBS); offset from MSN HQ
        const squashB = A.findPlace('National Squash Centre')?.building;
        const squashPin = squashB
          ? placePin('National Squash Centre', N.squash, heightLabel(squashB), 'major', zoneColor('sports'))
          : textPin('pin-squash', N.squash, squashFallback, 12, T.sc.squashNote);
        const carNames = ['Car Park A', 'Car Park B', 'Car Park C', 'Car Park D', 'Car Park F'] as const;
        const cars = carNames.map((name) => {
          const p = facilities.parking.find((x) => x.name === name); if (!p) return null;
          const capN = p.capacity != null ? T.sc.parkingCap(fmt(p.capacity)) : undefined;
          return textPin(`pk-${name}`, name, p.c, 3, capN);
        });
        return nn([
          stationPin('SP17', `SP17 · ${N.line}`),
          anchorPin('STADIUM', N.stadium, cap ? T.sc.pinStadium(fmt(cap)) : undefined, 45, zoneColor('sports')),
          textPin('pin-track', N.track, track, 8, T.sc.trackNote),
          textPin('pin-aquatic', N.aquatic, aquatic, 12, T.sc.aquaticNote),
          placePin('Unifi Arena', N.arena, arenaCap ? T.sc.pinArena(fmt(arenaCap)) : heightLabel(A.findPlace('Unifi Arena')?.building ?? { height: 0, heightSource: 'estimate', levels: null }), 'major', zoneColor('sports')),
          squashPin,
          placePin('Stadium Hoki Nasional Malaysia', N.hockey, undefined, 'major', zoneColor('sports')),
          placePin('Majlis Sukan Negara Malaysia', N.msn, undefined, 'minor', zoneColor('sports')),
          textPin('pin-gym', N.gym, gym, 10, T.sc.gymNote),
          textPin('pin-msn-field', N.msnField, msnField, 4, T.sc.msnFieldNote),
          ...cars,
        ]);
      })(),
      panel: (el, world) => {
        const squashB = A.findPlace('National Squash Centre')?.building;
        const s = h('section'); s.append(h('h3', {}, T.sc.listTitle));
        const rows: [string, string][] = [
          [N.stadium, T.sc.noHeight],
          [N.track, T.sc.trackNote],
          [N.aquatic, T.sc.pinOnly],
          [N.squash, squashB ? heightLabel(squashB) : T.sc.squashNote],
          [N.gym, T.sc.pinOnly],
          [N.msnField, T.sc.msnFieldNote],
        ];
        for (const [name, label] of [['Unifi Arena', N.arena], ['Stadium Hoki Nasional Malaysia', N.hockey], ['Majlis Sukan Negara Malaysia', N.msn]] as const) {
          const b = A.findPlace(name)?.building; if (b) rows.push([label, heightLabel(b)]);
        }
        const ul = h('ul', { class: 'station-list' });
        for (const [a, b] of rows) ul.append(h('li', {}, `<div><div>${a}</div><div class="small">${b}</div></div>`));
        s.append(ul);
        const pk = h('section'); pk.append(h('h3', {}, T.sc.parkingTitle));
        const pl = h('ul', { class: 'station-list' });
        for (const name of ['Car Park A', 'Car Park B', 'Car Park C', 'Car Park D', 'Car Park F']) {
          const p = facilities.parking.find((x) => x.name === name); if (!p) continue;
          pl.append(h('li', {}, `<div><div>${name}</div><div class="small">${p.capacity != null ? T.sc.parkingCap(fmt(p.capacity)) : T.common.osm}</div></div>`));
        }
        pk.append(pl);
        const layers = h('section'); layers.append(h('h3', {}, T.common.layers));
        toggle(layers, T.sc.parking, true, (v) => world.setMode({ facilities: { parking: v } }), 'var(--c-parking, #2f6fd0)');
        const g = h('section'); g.append(h('h3', {}, T.sc.gapsTitle), h('div', { class: 'small' }, T.sc.gaps));
        el.append(s, pk, layers, g);
      },
    },
    // ---------------- 03 transit hub ----------------
    {
      id: 3, label: T.tr.label, tab: T.tr.tab, title: T.tr.title, lead: T.tr.lead,
      stats: [
        { fig: fmt(stCode.filter((c) => A.station(c)).length), unit: U.stations, cap: T.tr.statStations(stCode.filter((c) => A.station(c)).join(' · ')) },
        ...(meta.railLengthsM.lrt ? [{ fig: fmt(meta.railLengthsM.lrt), unit: U.m, cap: T.tr.statTrack }] : []),
        { fig: fmt(facilities.busStops.length), unit: U.stops, cap: T.tr.statBus(busWithRoutes) },
      ],
      source: T.tr.source(factsDate),
      view: { target: [-120, 0, -440], azimuth: 0.05, polar: 0.82, distance: 3500 },
      mode: { ...overviewMode, buildingStyle: 'default', facilities: { hotels: false, parking: false, bus: true, entrances: true } },
      pins: nn([...stCode.map((c) => stationPin(c, `${c} · ${N.line}`)), stationPin('SP18', `SP18 · ${T.tr.edge}`)]),
      panel: (el, world) => {
        const s1 = h('section'); s1.append(h('h3', {}, T.tr.stationsTitle));
        const ul = h('ul', { class: 'station-list' });
        const opened: Record<string, string> = { SP17: str(line4, 'sp17Opened'), SP19: str(line4, 'sp19Opened'), SP20: str(line4, 'sp19Opened') };
        for (const c of ['SP17', 'SP18', 'SP19', 'SP20']) { const s = A.station(c); if (!s) continue;
          ul.append(h('li', {}, `<span class="st-ids"><span class="badge" style="background:${LRT}">${c}</span>${pill}</span><div><div>${stName[c] ?? s.name}</div><div class="small">${c === 'SP18' ? T.tr.edge : opened[c] ? T.tr.opened(fmtDate(opened[c])) : ''}</div></div>`)); }
        s1.append(ul);
        const s2 = h('section'); s2.append(h('h3', {}, T.tr.trainsTitle));
        if (num(line4, 'trainCars') && num(line4, 'trainLengthM')) s2.append(h('div', { class: 'small' }, T.tr.trainsText(num(line4, 'trainCars')!, fmt(num(line4, 'trainLengthM')!, 1))));
        const s3 = h('section'); s3.append(h('h3', {}, T.tr.busTitle));
        const bl = h('ul', { class: 'station-list' });
        for (const [r, k] of busRoutes) bl.append(h('li', {}, `<span class="st-ids"><span class="badge" style="background:var(--c-bus)">${r}</span></span><div><div class="small">${T.tr.busRow(k)}</div></div>`));
        s3.append(bl, h('div', { class: 'small' }, T.tr.busNote));
        const s4 = h('section'); s4.append(h('h3', {}, T.common.layers));
        toggle(s4, N.line, true, (v) => world.setMode({ rails: { lrt: v ? 'highlight' : 'hidden' } })).insertAdjacentHTML('afterend', `<span class="pills">${pill}</span>`);
        toggle(s4, T.tr.showBus, true, (v) => world.setMode({ facilities: { bus: v } }), 'var(--c-bus)');
        el.append(s1, s2, s3, s4);
      },
    },
    // ---------------- 04 location + roads ----------------
    {
      id: 4, label: T.loc.label, tab: T.loc.tab, title: T.loc.title, lead: T.loc.lead,
      stats: nn([
        { fig: fmt((meta.halfSizeM * 2) / 1000, 1), unit: `× ${fmt((meta.halfSizeM * 2) / 1000, 1)}`, cap: T.loc.statSquare },
        A.stationDistance('SP17', 'SP19') ? { fig: fmt(A.stationDistance('SP17', 'SP19')!), unit: U.m, cap: T.loc.statSp17Sp19 } : null,
        A.stationDistance('SP19', 'SP20') ? { fig: fmt(A.stationDistance('SP19', 'SP20')!), unit: U.m, cap: T.loc.statSp19Sp20 } : null,
      ]),
      source: T.loc.source(),
      view: { target: [0, 0, 0], azimuth: 0, polar: 0.55, distance: 4300 },
      mode: { ...overviewMode, buildingStyle: 'default', facilities: { hotels: false, parking: true, bus: false, entrances: false } },
      pins: nn([
        roadPin('lbl-bj', 'Lebuhraya Bukit Jalil', N.bjHwy),
        roadPin('lbl-mex', 'Lebuhraya Maju', N.mex),
        roadPin('lbl-kesas', 'Lebuhraya Shah Alam', N.kesas),
        textPin('lbl-sgbesi', `${N.sgBesi} →`, [meta.halfSizeM - 60, 0], 2, T.loc.sgBesiPin),
        stationPin('SP17'), stationPin('SP19'), stationPin('SP20'),
      ]),
      panel: (el, world) => {
        const s1 = h('section'); s1.append(h('h3', {}, T.loc.roads));
        const ul = h('ul', { class: 'station-list' });
        for (const [a, b] of [[N.bjHwy, N.bjHwyLocal], [N.mex, N.mexLocal], [N.kesas, N.kesasLocal], [N.sgBesi, T.loc.sgBesiPin]]) ul.append(h('li', {}, `<div><div>${a}</div><div class="small">${b}</div></div>`));
        s1.append(ul);
        const s2 = h('section'); s2.append(h('h3', {}, T.loc.parking));
        s2.append(h('div', { class: 'small' }, T.loc.parkingNote(facilities.parking.length, fmt(parkCap))));
        toggle(s2, T.loc.parking, true, (v) => world.setMode({ facilities: { parking: v } }), 'var(--grey-2)');
        el.append(s1, s2);
      },
    },
    // ---------------- 05 massing ----------------
    {
      id: 5, label: T.ms4.label, tab: T.ms4.tab, title: T.ms4.title, lead: T.ms4.lead,
      stats: nn([
        citedNow ? { fig: fmt(citedNow.height), unit: U.m, cap: T.ms4.statTallest(citedNow.name ?? '') } : null,
        { fig: fmt(stats.heightCited), unit: U.blocks, cap: T.ms4.statCited(buildings.filter(isPlanned).length) },
        { fig: fmt(stats.heightEstimate), unit: U.blocks, cap: T.ms4.statEstimate },
      ]),
      source: T.ms4.source(meta.heightSourcesFetched ?? ''),
      view: { target: [-700, 60, 420], azimuth: -0.5, polar: 1.12, distance: 2100 },
      ghosts: true,
      mode: { rails: ctxRails, footways: 'hidden', routeSet: 'none', xray: false, buildingStyle: 'default', precincts: false },
      pins: nn(named.filter((b) => b.heightSource === 'cited').slice(0, 7).map((b) => placePin(b.name!, b.name!, heightLabel(b, isPlanned(b)), isPlanned(b) ? 'minor' : 'major', isPlanned(b) ? 'var(--ghost)' : undefined))),
      panel: (el, world) => {
        const s1 = h('section'); s1.append(h('h3', {}, T.ms4.display));
        const legend = h('div', { class: 'src-legend', style: 'display:none' });
        for (const [k, txt] of [['cited', T.ms4.legendCited(stats.heightCited)], ['osm', T.ms4.legendOsm(stats.heightOsm)], ['levels', T.ms4.legendLevels(stats.heightLevels)], ['estimate', T.ms4.legendEstimate(stats.heightEstimate)]] as const)
          legend.append(h('div', { class: 'legend-row' }, `<span class="swatch box" style="background:var(--src-${k})"></span>${txt}`));
        const src = toggle(s1, T.ms4.colourBySource, false, (v) => { legend.style.display = v ? 'block' : 'none'; world.setMode({ buildingStyle: v ? 'source' : 'default' }); });
        src.id = 'src-toggle';
        s1.append(legend);
        toggle(s1, T.ms4.ghosts, true, (v) => world.setGhosts(v), 'var(--ghost)');
        const s2 = h('section'); s2.append(h('h3', {}, T.ms4.tallest));
        const max = named[0]?.height || 1; const bars = h('div', { class: 'bars' });
        for (const b of named) bars.append(h('span', { class: 'name', title: b.name! }, b.name!), h('span', {}, `<div class="bar ${b.heightSource}${isPlanned(b) ? ' planned' : ''}" style="width:${(b.height / max) * 100}%"></div>`), h('span', { class: 'val' }, `${b.heightSource === 'osm' ? '' : '≈'}${fmt(b.height)} m`));
        s2.append(bars, h('div', { class: 'small', style: 'margin-top:10px' }, T.ms4.barsNote));
        if (buildings.some((b) => b.name === 'The Park Bukit Jalil' && b.heightSource === 'cited')) s2.append(h('div', { class: 'small warn', style: 'margin-top:8px' }, T.ms4.assumed));
        el.append(s1, s2);
      },
    },
    // ---------------- 06 connections ----------------
    {
      id: 6, label: T.cn.label, tab: T.cn.tab, title: T.cn.title, lead: T.cn.lead(fmt(legsTotal)),
      stats: nn([
        { fig: fmt(legsTotal), unit: U.m, cap: T.cn.statLength },
        { fig: fmt(pct(legsSheltered, legsTotal)), unit: U.pct, cap: T.cn.statSheltered },
        legMall ? { fig: fmt(legMall.length), unit: U.m, cap: T.cn.statMall } : null,
      ]),
      source: T.cn.source(),
      view: { target: [380, 0, -40], azimuth: 0.1, polar: 0.7, distance: 3300 },
      mode: { rails: ctxRails, footways: 'faint', routeSet: 'legs', routeFocus: null, xray: true, buildingStyle: 'default', precincts: false },
      pins: nn([stationPin('SP17'), stationPin('SP19'), anchorPin('STADIUM', N.stadium, leg1 ? `${fmt(leg1.length)} m` : undefined, 40), placePin('Unifi Arena', N.arena), placePin('Pavilion Bukit Jalil', N.pavilion, legMall ? `${fmt(legMall.length)} m` : undefined)]),
      panel: (el, world, ctx) => {
        const s1 = h('section'); s1.append(h('h3', {}, T.cn.steps));
        const ol = h('ol', { class: 'step-list' });
        routes.forEach((r, i) => {
          const desc = Object.entries(r.byClass).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${fmt(v)} m ${T.cn.cls[k] || k}`).join(', ') + '.';
          const li = h('li', { tabindex: '0', role: 'button', 'aria-label': T.common.focusStep(i + 1) }, `<span class="step-n">${i + 1}</span><div><div class="step-title">${T.anchor[r.from] ?? r.from} → ${T.anchor[r.to] ?? r.to}</div><div class="step-meta">${fmt(r.length)} m · ≈${fmt(r.minutes, 1)} min</div><div class="step-desc">${desc}</div></div>`);
          const act = () => { const on = !li.classList.contains('active'); ol.querySelectorAll('li').forEach((x) => x.classList.remove('active')); if (on) li.classList.add('active'); world.setMode({ routeFocus: on ? i : null }); ctx.flyTo(on ? boundsView(routePts(r)) : ctx.chapterView); };
          li.addEventListener('click', act); li.addEventListener('keydown', (e) => { if ((e as KeyboardEvent).key === 'Enter') act(); });
          ol.append(li);
        });
        s1.append(ol);
        if (leg1) s1.append(h('div', { class: 'small', style: 'margin-top:8px' }, T.cn.snapNote(Math.round(leg1.snapTo))));
        const s2 = h('section'); s2.append(h('h3', {}, T.common.layers));
        toggle(s2, T.cn.allFootways, false, (v) => world.setMode({ footways: v ? 'show' : 'faint' }), 'var(--ink)');
        toggle(s2, T.cn.xray, true, (v) => world.setMode({ xray: v }));
        el.append(s1, s2);
      },
    },
    // ---------------- 07 event day (illustrative crowd) ----------------
    {
      id: 7, label: T.ev.label, tab: T.ev.tab, title: T.ev.title, lead: T.ev.lead(cap ? fmt(cap) : '—', rec ? fmt(rec) : '—'),
      stats: nn([
        cap ? { fig: fmt(cap), unit: U.seats, cap: T.ev.statCap } : null,
        leg1 ? { fig: `≈${fmt(leg1.minutes, 1)}`, unit: U.min, cap: T.ev.statWalk } : null,
        { fig: '50', unit: U.pct, cap: T.ev.statShare },
      ]),
      source: T.ev.source(factsDate),
      view: { target: [1560, 0, -60], azimuth: 0.35, polar: 0.85, distance: 1250 },
      crowd: true,
      mode: { rails: { ...ctxRails, lrt: 'highlight' }, footways: 'faint', routeSet: 'legs', routeFocus: 0, xray: true, buildingStyle: 'default', precincts: false },
      pins: nn([stationPin('SP17', `SP17 · ${N.line}`), anchorPin('STADIUM', N.stadium, cap ? `${fmt(cap)} ${U.seats}` : undefined, 45), { id: 'illus', title: T.common.illustrative, value: T.ev.flow, at: leg1 ? D(routePts(leg1)[Math.floor(routePts(leg1).length / 2)], 8) : [0, 0, 0], kind: 'minor', accent: 'var(--c-route)' }]),
      panel: (el, world, ctx) => {
        const E = T.ev;
        if (leg1) world.setCrowd(pts(leg1), 700);
        ctx.onCleanup(() => world.setCrowd(null));
        const s1 = h('section'); s1.append(h('div', { class: 'tag-illus mono' }, T.common.illustrative));
        const mk = (id: string, label: string, aria: string, min: number, max: number, step: number, val: number) => {
          const d = h('div', { class: 'slider', style: 'margin-top:12px' });
          d.innerHTML = `<label for="${id}">${label}</label><output id="${id}-out"></output><input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${val}" aria-label="${aria}"/>`;
          s1.append(d); return [d.querySelector('input') as HTMLInputElement, d.querySelector('output')!] as const;
        };
        const [share, shareOut] = mk('ev-share', E.sliderLabel, E.sliderAria, 10, 90, 5, 50);
        const [load, loadOut] = mk('ev-load', E.perTrainLabel, E.perTrainLabel, 400, 1200, 50, 800);
        const kv = h('dl', { class: 'kv' }); s1.append(kv, h('div', { class: 'small warn', style: 'margin-top:10px' }, E.illusNote));
        const upd = () => {
          const p = +share.value, l = +load.value; shareOut.textContent = `${p}%`; loadOut.textContent = fmt(l);
          const people = cap ? Math.round((cap * p) / 100) : 0;
          kv.innerHTML = ''; kv.append(h('dt', {}, E.flow), h('dd', {}, E.people(fmt(people))), h('dt', {}, E.trainsLabel), h('dd', {}, E.trainsNeeded(fmt(Math.ceil(people / l)))));
          if (leg1) world.setCrowd(pts(leg1), Math.round(200 + p * 12));
        };
        share.addEventListener('input', upd); load.addEventListener('input', upd); upd();
        el.append(s1);
      },
    },
    // ---------------- 08 walking routes ----------------
    {
      id: 8, label: T.wk.label, tab: T.wk.tab, title: T.wk.title, lead: T.wk.lead,
      stats: walks.length ? [
        { fig: fmt(walks.length), unit: U.routes, cap: T.wk.statCount },
        { fig: `${fmt(Math.min(...walks.map((w) => w.length)))}–${fmt(Math.max(...walks.map((w) => w.length)))}`, unit: U.m, cap: T.wk.statRange },
        { fig: fmt(pct(walkShelt, walkTotal)), unit: U.pct, cap: T.wk.statShare },
      ] : [],
      source: T.wk.source(),
      view: { target: [300, 0, 150], azimuth: 0.15, polar: 0.72, distance: 3600 },
      mode: { rails: ctxRails, footways: 'faint', routeSet: 'walks', walkFocus: walks[0]?.id ?? null, xray: true, buildingStyle: 'default', precincts: false },
      pins: nn([stationPin('SP17'), stationPin('SP19'), stationPin('SP20'), placePin('Unifi Arena', N.arena), placePin('Pavilion Bukit Jalil', N.pavilion), anchorPin('STADIUM', N.stadium, undefined, 40)]),
      panel: (el, world, ctx) => {
        const W = T.wk;
        const s1 = h('section'); s1.append(h('h3', {}, W.pick));
        const list = h('div', { class: 'route-pick', role: 'radiogroup', 'aria-label': W.pickAria });
        const detail = h('div', { class: 'route-detail' });
        const name = (r: Route) => `${T.anchor[r.from] ?? r.from} → ${T.anchor[r.to] ?? r.to}`;
        const show = (r: Route, fly: boolean) => {
          list.querySelectorAll('button').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.id === r.id)));
          world.setMode({ walkFocus: r.id }); world.replayWalk();
          if (fly) ctx.flyTo(boundsView(routePts(r), 900));
          detail.innerHTML = '';
          const kv = h('dl', { class: 'kv' });
          for (const [k, v] of [[W.length, `${fmt(r.length)} m`], [W.time, `≈${fmt(r.minutes, 1)} min`], [W.straight, `${fmt(r.straightLine)} m`], [W.detour, `× ${fmt(r.length / r.straightLine, 2)}`]] as const) kv.append(h('dt', {}, k), h('dd', {}, v));
          const play = h('button', { class: 'text-btn mono play-btn', type: 'button' }, `↻ ${W.replay}`);
          play.addEventListener('click', () => world.replayWalk());
          detail.append(kv, h('h3', { style: 'margin-top:16px' }, W.shareHead), ...shareBar(r), play);
        };
        for (const r of walks) {
          const b = h('button', { type: 'button', role: 'radio', 'aria-checked': 'false', class: 'route-btn', 'data-id': r.id }, `<span class="rb-name">${name(r)}</span><span class="rb-val">${fmt(r.length)} m</span>`);
          b.addEventListener('click', () => show(r, true)); list.append(b);
        }
        s1.append(list);
        const s2 = h('section'); s2.append(detail);
        const s3 = h('section'); s3.append(h('div', { class: 'small' }, W.notModelled));
        el.append(s1, s2, s3);
        if (walks[0]) show(walks[0], false);
      },
    },
    // ---------------- 09 green & shade ----------------
    {
      id: 9, label: T.gr.label, tab: T.gr.tab, title: T.gr.title,
      lead: T.gr.lead(meta.center.lat.toFixed(1), fmt(noon.jun.pos.altitude, 1), fmt(noon.dec.pos.altitude, 1)),
      stats: nn([
        parkHa ? { fig: fmt(parkHa, 1), unit: U.ha, cap: T.gr.statPark, swatch: zoneColor('park') } : null,
        { fig: fmt(greenHa, 0), unit: U.ha, cap: T.gr.statGreen, swatch: 'var(--c-green)' },
        { fig: fmt(noon.dec.pos.altitude, 1), unit: U.deg, cap: T.gr.statNoon(T.gr.presetDates.dec, T.gr.dir[noonDir('dec')]) },
      ]),
      source: T.gr.source(meta.center.lat.toFixed(4), meta.center.lon.toFixed(4), groundPts.length),
      view: { target: [-300, 0, 500], azimuth: -0.35, polar: 0.78, distance: 2900 },
      park: true,
      mode: { rails: ctxRails, footways: 'hidden', routeSet: 'none', xray: false, buildingStyle: 'default', precincts: false, shadeDots: true, muteWater: true, sun: null },
      pins: nn([parkC ? textPin('lbl-park', N.park, parkC, 4, parkHa ? `${fmt(parkHa, 1)} ${U.ha}` : undefined) : null, textPin('lbl-komanwel', 'Bukit Komanwel', (() => { const g = areas.green.find((x) => x.name === 'Bukit Komanwel'); return g ? [g.ring.reduce((s, p) => s + p[0], 0) / g.ring.length, g.ring.reduce((s, p) => s + p[1], 0) / g.ring.length] as XY : null; })(), 4)]),
      panel: (el, world, ctx) => {
        const S = T.gr;
        let preset: PresetKey = 'jun'; let minutes = 9 * 60; let playing = false; let raf = 0; let lastShade = 0; let pending = 0;
        world.setShadeSamples(groundPts);
        const s1 = h('section'); s1.append(h('h3', {}, S.date));
        const seg = h('div', { class: 'seg', role: 'radiogroup', 'aria-label': S.date });
        for (const k of Object.keys(PRESETS) as PresetKey[]) {
          const b = h('button', { type: 'button', role: 'radio', 'aria-checked': String(k === preset), 'data-k': k }, `${S.presets[k]}<small>${S.presetDates[k]}</small>`);
          b.addEventListener('click', () => { preset = k; seg.querySelectorAll('button').forEach((x) => x.setAttribute('aria-checked', String(x.dataset.k === k))); update(true); });
          seg.append(b);
        }
        s1.append(seg);
        const slider = h('div', { class: 'slider', style: 'margin-top:14px' });
        slider.innerHTML = `<label for="sun-time">${S.time}</label><output id="sun-time-out"></output><input id="sun-time" type="range" min="${7 * 60}" max="${19 * 60}" step="5" value="${minutes}" aria-label="${S.timeAria}"/>`;
        const inp = slider.querySelector('input') as HTMLInputElement; const out = slider.querySelector('output')!;
        const playBtn = h('button', { type: 'button', class: 'text-btn mono play-btn', 'aria-pressed': 'false' }, `▶ ${S.play}`);
        s1.append(slider, playBtn);
        const s2 = h('section'); const kv = h('dl', { class: 'kv' }); s2.append(kv);
        const s3 = h('section'); s3.append(h('h3', {}, S.sidewalkShade));
        const big = h('div', { class: 'big-num' }); const bigBar = h('div', { class: 'meter' }, '<span></span>');
        const head = h('div', { class: 'shade-head' }); head.append(big, h('div', {}, `<div class="legend-row"><span class="swatch box" style="background:var(--c-amber)"></span>${S.dotsLegend.lit}</div><div class="legend-row"><span class="swatch box" style="background:var(--c-shade)"></span>${S.dotsLegend.shade}</div>`));
        s3.append(head, bigBar, h('div', { class: 'small' }, S.sidewalkNote(groundPts.length)));
        const s4 = h('section'); s4.append(h('h3', {}, S.greenTitle));
        const gl = h('div', { class: 'mini-bars' }); const gmax = greens[0]?.ha || 1;
        for (const g of greens.filter((g) => g.name).slice(0, 5)) gl.append(h('div', { class: 'mb-row' }, `<span class="mb-name" title="${g.name}">${g.name}</span><span class="meter sm"><span style="width:${(g.ha / gmax) * 100}%"></span></span><span class="mb-val">${fmt(g.ha, 1)} ha</span>`));
        s4.append(gl);
        el.append(s1, s2, s3, s4);
        const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
        function shade(alt: number, az: number) {
          const g = world.shadeTest(groundPts, alt, az); world.setShadeResult(g);
          const p = pct(g.filter(Boolean).length, g.length);
          big.innerHTML = alt > 0 ? `${fmt(p)}<span class="unit">%</span>` : `<span class="small">${S.belowHorizon}</span>`;
          (bigBar.firstElementChild as HTMLElement).style.width = `${alt > 0 ? p : 0}%`;
          lastShade = performance.now();
        }
        function update(forceShade = false) {
          const [mo, d] = PRESETS[preset];
          const pos = sunPosition(mytDate(SUN_YEAR, mo, d, minutes), meta.center.lat, meta.center.lon);
          world.setMode({ sun: { altitude: pos.altitude, azimuth: pos.azimuth } });
          out.textContent = `${hhmm(minutes)} · ${S.presetDates[preset]}`; inp.value = String(minutes);
          const up = pos.altitude > 0; kv.innerHTML = '';
          for (const [k, v] of [[S.altitude, `${fmt(pos.altitude, 1)}°${up ? '' : ` (${S.belowHorizon})`}`], [S.azimuth, `${fmt(pos.azimuth, 0)}° ${T.compass16[compassIndex(pos.azimuth)]}`]] as [string, string][]) kv.append(h('dt', {}, k), h('dd', {}, v));
          clearTimeout(pending);
          if (forceShade || performance.now() - lastShade > 180) shade(pos.altitude, pos.azimuth);
          else pending = window.setTimeout(() => shade(pos.altitude, pos.azimuth), 200);
        }
        inp.addEventListener('input', () => { minutes = +inp.value; update(); });
        inp.addEventListener('change', () => { minutes = +inp.value; update(true); });
        const stop = () => { playing = false; cancelAnimationFrame(raf); clearTimeout(raf); playBtn.setAttribute('aria-pressed', 'false'); playBtn.textContent = `▶ ${S.play}`; };
        playBtn.addEventListener('click', () => {
          if (playing) { stop(); update(true); return; }
          playing = true; playBtn.setAttribute('aria-pressed', 'true'); playBtn.textContent = `❚❚ ${S.pause}`;
          if (minutes >= 19 * 60) minutes = 7 * 60;
          if (reduced()) { const step = () => { if (!playing) return; minutes = Math.min(19 * 60, minutes + 30); update(true); if (minutes >= 19 * 60) stop(); else raf = window.setTimeout(step, 1200); }; raf = window.setTimeout(step, 600); }
          else { let last = performance.now(); const tick = (now: number) => { if (!playing) return; minutes = Math.round(Math.min(19 * 60, minutes + ((now - last) / 1000) * 30)); last = now; update(); if (minutes >= 19 * 60) { stop(); update(true); } else raf = requestAnimationFrame(tick); }; raf = requestAnimationFrame(tick); }
        });
        ctx.onCleanup(() => { stop(); clearTimeout(pending); });
        update(true);
      },
    },
    // ---------------- 10 rain & monsoon ----------------
    {
      id: 10, label: T.rn.label, tab: T.rn.tab, title: T.rn.title,
      lead: T.rn.lead(fmt(climate.yearPrecipitationMm), fmt(climate.yearPrecipitationDays, 1), T.monthsLong[wettestIdx]),
      stats: [
        { fig: fmt(stats.shelteredFootPct), unit: U.pct, cap: T.rn.statFoot(stats.shelteredFootM, stats.footwayM) },
        { fig: fmt(pct(legsSheltered, legsTotal)), unit: U.pct, cap: T.rn.statLegs },
        { fig: fmt(climate.yearPrecipitationMm), unit: U.mm, cap: T.rn.statRain(T.rn.station) },
      ],
      source: T.rn.source(T.rn.station, climate.period, climate.fetched),
      view: { target: [300, 0, 150], azimuth: 0.12, polar: 0.66, distance: 3600 },
      mode: { rails: ctxRails, footways: 'rain', routeSet: 'walks', walkFocus: null, routeStyle: 'rain', muteWater: true, xray: true, buildingStyle: 'default', precincts: false },
      pins: nn([stationPin('SP17'), stationPin('SP19'), placePin('Pavilion Bukit Jalil', N.pavilion), anchorPin('STADIUM', N.stadium, undefined, 40)]),
      panel: (el, world, ctx) => {
        const R = T.rn;
        const s1 = h('section'); s1.append(h('h3', {}, R.routes));
        s1.append(h('div', { class: 'legend-row' }, `<span class="swatch box" style="background:var(--c-covered)"></span>${R.legendCovered}<span class="swatch box" style="background:var(--c-open);margin-left:14px"></span>${R.legendOpen}`));
        const list = h('div', { class: 'route-pick rain', role: 'radiogroup', 'aria-label': R.pickAria });
        const name = (r: Route) => `${T.anchor[r.from] ?? r.from} → ${T.anchor[r.to] ?? r.to}`;
        const items = [
          { id: 'legs', name: R.legsName, cov: legsSheltered, all: legsTotal, apply: () => { world.setMode({ routeSet: 'legs', walkFocus: null }); ctx.flyTo(boundsView(routes.flatMap(routePts), 700)); } },
          ...walks.map((w) => ({ id: w.id, name: name(w), cov: sheltered(w), all: w.length, apply: () => { world.setMode({ routeSet: 'walks', walkFocus: w.id }); ctx.flyTo(boundsView(routePts(w), 700)); } })),
        ];
        for (const it of items) {
          const p = pct(it.cov, it.all);
          const b = h('button', { type: 'button', role: 'radio', 'aria-checked': 'false', class: 'route-btn', 'data-id': it.id }, `<span class="rb-name">${it.name}</span><span class="rb-val">${p}%</span><span class="cov-bar"><span style="width:${p}%"></span></span><span class="rb-sub">${R.coveredOf(Math.round(it.cov), it.all)}</span>`);
          b.addEventListener('click', () => {
            const on = b.getAttribute('aria-checked') !== 'true';
            list.querySelectorAll('button').forEach((x) => x.setAttribute('aria-checked', 'false'));
            if (on) { b.setAttribute('aria-checked', 'true'); it.apply(); } else { world.setMode({ routeSet: 'walks', walkFocus: null }); ctx.flyTo(ctx.chapterView); }
          });
          list.append(b);
        }
        s1.append(list);
        const s2 = h('section'); s2.append(h('h3', {}, R.climate));
        const max = Math.max(...climate.precipitationMm); const chart = h('div', { class: 'rain-chart', role: 'img', 'aria-label': climate.precipitationMm.map((v, i) => `${T.months[i]} ${fmt(v, 1)} mm`).join(', ') });
        climate.precipitationMm.forEach((v, i) => {
          const mon = climate.monsoonMonths.includes(i + 1);
          chart.append(h('div', { class: `rc-col${mon ? ' monsoon' : ''}`, title: `${T.months[i]}: ${fmt(v, 1)} mm · ${fmt(climate.precipitationDays[i], 1)} ${U.days}` }, `<span class="rc-val">${fmt(v)}</span><span class="rc-bar" style="height:${(v / max) * 100}%"></span><span class="rc-m">${T.months[i]}</span>`));
        });
        s2.append(chart, h('div', { class: 'small', style: 'margin-top:8px' }, R.climateNote(R.station, climate.period, fmt(climate.yearPrecipitationDays, 1))));
        const s3 = h('section'); s3.append(h('h3', {}, T.common.layers));
        toggle(s3, R.allWays, true, (v) => world.setMode({ footways: v ? 'rain' : 'hidden' }), 'var(--c-covered)');
        toggle(s3, R.xray, true, (v) => world.setMode({ xray: v }));
        el.append(s1, s2, s3);
      },
    },
  ];
}
