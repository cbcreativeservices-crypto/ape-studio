/**
 * MALLET-BAR FAMILY — the engine model a mallet lesson compiles to (charter
 * §2 layer 2): parts with their solids, the keep-out envelopes, the reference
 * surface, the radiating regions and the views, BUILT from malletSpec.ts so
 * the art, the hit areas, the collision and the readouts agree.
 *
 * Frame: malletSpec.ts (x toward the low end, y down, z toward the audience).
 * Every variant keeps ONE bar plane (y = −hBars of the lesson's default
 * row): a variant whose bars stand at another height (the case glockenspiel
 * on a table) moves the floor instead (InstrumentModel.floorByVariant), so a
 * zone measured from the bars means the same in every variant.
 *
 * Collision is kept cheap (the drag runs it per sub-step): the bars of a row
 * are one box, the resonators are boxes of six neighbouring tubes, the frame
 * is its two end assemblies and the low stretcher.
 */
import type { DocumentedZone, Envelope, InstrumentModel, Part, Provenance, RadiatingRegion, ReferenceSurface, Shape3, Vec3, VariantId, ViewBox, ZoneDraw } from '../../../engine/model/types.ts';
import { CASE, drawingDefault, ill, layoutOf, type Layout, type MalletRow, NODE_FRAC, src } from './malletSpec.ts';

export const UP: Vec3 = { x: 0, y: -1, z: 0 };
export const DOWN: Vec3 = { x: 0, y: 1, z: 0 };
const DRAW = ill('a drawing default (vibraphone/GEOMETRY_PROPOSAL.md §A: frame, rails and legs are not printed by any maker)');

export function box(a: Vec3, b: Vec3): Shape3 {
  return { kind: 'box', min: { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), z: Math.min(a.z, b.z) }, max: { x: Math.max(a.x, b.x), y: Math.max(a.y, b.y), z: Math.max(a.z, b.z) } };
}

export type MalletVariant = { row: MalletRow; label: string; blurb: string; phrase: string };
export type MalletFamily = {
  /** Part-id prefix ("vb", "mr", "xy", "gl"). */
  p: string;
  name: string;
  variants: readonly MalletVariant[];
  /** Words for the parts (per instrument). */
  roles: { naturals: string; accidentals: string; resonators?: string; cords: string; frame: string; damper?: string; pedal?: string; motor?: string; fans?: string; case?: string; lid?: string; table?: string };
};

/** The family's geometry, per variant (bars on ONE plane). */
export type MalletGeom = {
  fam: MalletFamily;
  /** y of the naturals' top in every variant. */
  barY: number;
  layouts: Record<VariantId, Layout>;
  floor: Record<VariantId, number>;
  /** How far a stand's boom reaches toward the audience. */
  boom: number;
  /** Damper bar, pedal and motor boxes per variant (when present). */
  extras: Record<VariantId, { damper?: Shape3; pedal?: Shape3; motor?: Shape3; caseBase?: Shape3; lid?: Shape3; table?: Shape3 }>;
  views: Record<VariantId, { side: ViewBox; top: ViewBox }>;
};

const geomCache = new Map<string, MalletGeom>();

export function malletGeom(fam: MalletFamily): MalletGeom {
  const hit = geomCache.get(fam.p);
  if (hit) return hit;
  const barY = -fam.variants[0].row.hBars.mm;
  const layouts: Record<VariantId, Layout> = {};
  const floor: Record<VariantId, number> = {};
  const extras: MalletGeom['extras'] = {};
  const views: MalletGeom['views'] = {};
  let boom = 0;
  for (const v of fam.variants) {
    const L = layoutOf(v.row, barY);
    layouts[v.row.id] = L;
    floor[v.row.id] = barY + v.row.hBars.mm;
    boom = Math.max(boom, Math.max(L.halfDepth(L.xLow), L.zFar) + 260);
  }
  for (const v of fam.variants) {
    const L = layouts[v.row.id];
    const r = v.row;
    const yF = floor[r.id];
    const e: MalletGeom['extras'][string] = {};
    const tNat = Math.max(...L.naturals.map((b) => b.t));
    if (r.extras.damper === 'pedal') {
      // The felt damper bar under the bars along the centre line, touching
      // them while the pedal is up (YMH-HUB-VIBE; position DRAWING DEFAULT).
      e.damper = box({ x: L.span.lo + 20, y: L.yNat + tNat, z: -14 }, { x: L.span.hi - 20, y: L.yNat + tNat + 24, z: 14 });
      // The pedal: the centre of the player side, on the floor (A5: 300 × 120 × 100).
      const zEdge = -L.halfDepth(0);
      e.pedal = box({ x: -150, y: yF - 100, z: zEdge - 70 }, { x: 150, y: yF, z: zEdge + 50 });
    }
    if (r.extras.motor) {
      // The motor box under the low end (DRAWING DEFAULT 160 × 120 × 140).
      e.motor = box({ x: L.xLow - 230, y: L.yNat + 70, z: -70 }, { x: L.xLow - 70, y: L.yNat + 190, z: 70 });
    }
    if (r.stand === 'case') {
      const hx = r.Lframe.mm / 2;
      const hz = r.Dlow.mm / 2;
      e.caseBase = box({ x: -hx, y: L.yNat + 2, z: -hz }, { x: hx, y: L.yNat + CASE.base, z: hz });
      // The lid, hinged on the far (audience) side and open 90° (DRAWING DEFAULT).
      e.lid = box({ x: -hx, y: L.yNat - 2 * hz, z: hz }, { x: hx, y: L.yNat + 2, z: hz + CASE.lid });
      e.table = box({ x: -hx - 80, y: L.yNat + CASE.base, z: -hz - 80 }, { x: hx + 80, y: L.yNat + CASE.base + 40, z: hz + 80 });
    }
    extras[r.id] = e;
    const xPad = 170;
    const sideTop = L.yNat - 1250;
    views[r.id] = {
      side: { u0: L.xHigh - xPad, u1: L.xLow + xPad, v0: sideTop, v1: yF + 40 },
      top: { u0: L.xHigh - xPad, u1: L.xLow + xPad, v0: L.zPlayer - 60, v1: boom + 160 },
    };
  }
  const g: MalletGeom = { fam, barY, layouts, floor, boom, extras, views };
  geomCache.set(fam.p, g);
  return g;
}

/** Groups of `n` neighbouring items. */
function chunks<T>(xs: readonly T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < xs.length; i += n) out.push(xs.slice(i, i + n));
  return out;
}

/** The end assemblies (end board, legs, casters) as one box per end. */
export function frameEnds(L: Layout, yFloor: number): { low: Shape3; high: Shape3; stretcher: Shape3 } {
  const tNat = Math.max(...L.naturals.map((b) => b.t));
  const top = L.yNat + tNat + 30;
  const end = (x0: number, x1: number, hz: number) => box({ x: x0, y: top, z: -hz }, { x: x1, y: yFloor, z: hz });
  return {
    low: end(L.xLow - 55, L.xLow, L.halfDepth(L.xLow) - 10),
    high: end(L.xHigh, L.xHigh + 55, L.halfDepth(L.xHigh) - 10),
    stretcher: box({ x: L.xHigh + 55, y: yFloor - 150, z: -18 }, { x: L.xLow - 55, y: yFloor - 110, z: 18 }),
  };
}

export function malletModel(fam: MalletFamily): InstrumentModel {
  const G = malletGeom(fam);
  const p = fam.p;
  const parts: Part[] = [];
  const regions: RadiatingRegion[] = [];
  const envelopes: Envelope[] = [];
  const R = fam.roles;
  for (const v of fam.variants) {
    const r = v.row;
    const id = r.id;
    const L = G.layouts[id];
    const yF = G.floor[id];
    const only = [id];
    const rowBox = (bars: Layout['bars']) =>
      box({ x: Math.min(...bars.map((b) => b.x - b.w / 2)), y: bars[0].yTop, z: Math.min(...bars.map((b) => b.z - b.L / 2)) }, { x: Math.max(...bars.map((b) => b.x + b.w / 2)), y: bars[0].yTop + Math.max(...bars.map((b) => b.t)), z: Math.max(...bars.map((b) => b.z + b.L / 2)) });
    parts.push({ id: `${p}.nat.${id}`, label: 'natural bars (the near row)', short: 'NATURALS', role: R.naturals, moving: true, prov: r.prov.range, variants: only, solid: rowBox(L.naturals), clearance: { mm: 8, prov: ill('a struck bar moves: no source gives a clearance') } });
    parts.push({ id: `${p}.acc.${id}`, label: 'accidental bars (the far row, raised)', short: 'ACCIDENTALS', role: R.accidentals, moving: true, prov: r.prov.range, variants: only, solid: rowBox(L.accidentals), clearance: { mm: 8, prov: ill('a struck bar moves: no source gives a clearance') } });
    const resRole = R.resonators;
    if (L.tubes.length && resRole) {
      parts.push({ id: `${p}.res.${id}`, label: 'resonators', short: 'RESONATORS', role: resRole, prov: r.res.prov, variants: only });
      for (const [side, list] of [['n', L.tubes.filter((t) => t.z < 0)], ['a', L.tubes.filter((t) => t.z > 0)]] as const) {
        chunks([...list].sort((a, b) => b.x - a.x), 6).forEach((grp, i) => {
          const half = (t: (typeof grp)[number]) => (t.kind === 'helmholtz' ? (t.depth ?? 150) / 2 : t.d / 2);
          parts.push({
            id: `${p}.res.${id}.${side}${i}`,
            label: 'resonators',
            short: 'RESONATORS',
            role: resRole,
            prov: r.res.prov,
            variants: only,
            listIn: [],
            solid: box({ x: Math.min(...grp.map((t) => t.x - t.d / 2)), y: Math.min(...grp.map((t) => t.yTop)), z: Math.min(...grp.map((t) => t.z - half(t))) }, { x: Math.max(...grp.map((t) => t.x + t.d / 2)), y: Math.max(...grp.map((t) => t.yBot)), z: Math.max(...grp.map((t) => t.z + half(t))) }),
          });
        });
      }
    }
    parts.push({ id: `${p}.cords.${id}`, label: 'cords and bar posts', short: 'CORDS', role: R.cords, prov: { kind: 'sourced', src: 'YMH-CORDS', quote: 'The metal fixtures that hold tone plates in place are called bar posts.' }, variants: only });
    const ex = G.extras[id];
    if (r.stand === 'frame') {
      const fr = frameEnds(L, yF);
      parts.push({ id: `${p}.frame.${id}`, label: 'frame, legs and casters', short: 'FRAME', role: R.frame, prov: DRAW, variants: only, solid: fr.stretcher });
      parts.push({ id: `${p}.endLow.${id}`, label: 'frame (low end)', short: 'FRAME', role: R.frame, prov: DRAW, variants: only, listIn: [], solid: fr.low });
      parts.push({ id: `${p}.endHigh.${id}`, label: 'frame (high end)', short: 'FRAME', role: R.frame, prov: DRAW, variants: only, listIn: [], solid: fr.high });
    }
    if (ex.damper && R.damper) parts.push({ id: `${p}.damper.${id}`, label: 'damper bar (felt)', short: 'DAMPER', role: R.damper, moving: true, prov: src('YMH-HUB-VIBE', 'The pedal operates a felt-covered damper bar'), variants: only, solid: ex.damper });
    if (ex.pedal && R.pedal) parts.push({ id: `${p}.pedal.${id}`, label: 'damper pedal', short: 'PEDAL', role: R.pedal, moving: true, prov: src('YMH-HUB-VIBE', 'When the pedal is down, the damper is pushed away, and the tone bars ring out'), variants: only, solid: ex.pedal });
    if (ex.motor && R.motor) parts.push({ id: `${p}.motor.${id}`, label: 'motor', short: 'MOTOR', role: R.motor, moving: true, prov: src('ADAMS-VIBC', 'Motor : Yes, 12V variable speed (25-150 rmp)'), variants: only, solid: ex.motor });
    if (r.extras.fans && R.fans) parts.push({ id: `${p}.fans.${id}`, label: 'fans on their shafts', short: 'FANS', role: R.fans, moving: true, prov: src('YMH-FANS', 'Above the resonator pipes runs an axis with numerous fans attached.'), variants: only });
    if (ex.caseBase && R.case) parts.push({ id: `${p}.case.${id}`, label: 'case', short: 'CASE', role: R.case, prov: r.prov.footprint, variants: only, solid: ex.caseBase });
    if (ex.lid && R.lid) parts.push({ id: `${p}.lid.${id}`, label: 'lid (open)', short: 'LID', role: R.lid, prov: ill('the lid open 90° on its far-side hinge is a drawing default'), variants: only, solid: ex.lid });
    if (ex.table && R.table) parts.push({ id: `${p}.table.${id}`, label: 'table', short: 'TABLE', role: R.table, prov: ill('the table and its height are a drawing default'), variants: only, solid: ex.table });

    // WHERE SOUND COMES FROM: the bars (struck) and the tube mouths.
    const lowBar = L.naturals[0];
    const highBar = L.naturals[L.naturals.length - 1];
    const midBar = L.naturals[Math.floor(L.naturals.length / 2)];
    const top = (b: Layout['bars'][number]): Vec3 => ({ x: b.x, y: b.yTop, z: b.z });
    regions.push({ id: `r.low.${id}`, partId: `${p}.nat.${id}`, label: `lowest bar (${lowBar.note})`, anchor: top(lowBar), prov: r.prov.range, variants: only, note: 'The lowest note: the longest, widest bar, at the right-hand end as the audience sees it.' });
    regions.push({ id: `r.mid.${id}`, partId: `${p}.nat.${id}`, label: `a middle bar (${midBar.note})`, anchor: top(midBar), prov: r.prov.range, variants: only, note: 'A bar near the middle of the keyboard.' });
    regions.push({ id: `r.high.${id}`, partId: `${p}.nat.${id}`, label: `highest bar (${highBar.note})`, anchor: top(highBar), prov: r.prov.range, variants: only, note: 'The highest note: the shortest bar, at the left-hand end as the audience sees it.' });
    if (L.tubes.length && R.resonators) {
      const t = L.tubes.find((q) => q.key === midBar.key) ?? L.tubes[Math.floor(L.tubes.length / 2)];
      regions.push({ id: `r.res.${id}`, partId: `${p}.res.${id}`, label: 'a resonator’s mouth', anchor: { x: t.x, y: t.yTop, z: t.z }, prov: r.res.prov, variants: only, note: 'Each tube’s open top, just under its bar: the air in the tube rings with the bar and leaves here.' });
    }
    regions.push({ id: `r.cords.${id}`, partId: `${p}.cords.${id}`, label: 'a cord (still point)', anchor: { x: midBar.x, y: midBar.yTop, z: midBar.z - midBar.L / 2 + NODE_FRAC * midBar.L }, prov: r.prov.range, variants: only, note: 'The cord passes through each bar where its lowest shape stays still, so the bar rings freely.' });
    if (ex.motor) regions.push({ id: `r.motor.${id}`, partId: `${p}.motor.${id}`, label: 'the motor', anchor: { x: L.xLow - 150, y: L.yNat + 130, z: 0 }, prov: src('ADAMS-VIBC', 'Motor : Yes'), variants: only, note: 'It turns the fan shafts. Its own hum is a mechanical noise to listen for, not part of the note.' });
    if (ex.pedal) regions.push({ id: `r.pedal.${id}`, partId: `${p}.pedal.${id}`, label: 'the damper pedal', anchor: { x: 0, y: yF - 60, z: -L.halfDepth(0) }, prov: src('YMH-HUB-VIBE', 'The pedal operates a felt-covered damper bar'), variants: only, note: 'Pressed, the damper leaves the bars and the notes ring; released, the felt stops them. Its thump can reach a mic through the floor and stand.' });

    // KEEP CLEAR: the mallets' whole travel over the played span (A5).
    envelopes.push({
      id: `env.mallets.${id}`,
      label: 'the mallets’ travel',
      shape: box({ x: L.span.lo - 150, y: L.yNat - r.malletH.mm, z: L.zPlayer + 150 }, { x: L.span.hi + 150, y: L.yNat, z: L.zFar + 50 }),
      prov: r.malletH.prov,
      variants: only,
      clearance: 10,
    });
  }
  const v0 = fam.variants[0].row.id;
  const viewsByVariant: InstrumentModel['viewsByVariant'] = {};
  for (const v of fam.variants) viewsByVariant[v.row.id] = G.views[v.row.id];
  const floorByVariant: Record<string, number> = {};
  for (const v of fam.variants) floorByVariant[v.row.id] = G.floor[v.row.id];
  const surfaces: ReferenceSurface[] = [
    { id: 'bars', partId: `${p}.nat.${v0}`, label: 'the bars', point: { x: 0, y: G.barY, z: 0 }, normal: UP, plus: { words: 'above', key: 'ABOVE' }, minus: { words: 'below', key: 'BELOW' } },
    // The middle of the played span at bar height, as a POINT (distances "from the bars" on a slant).
    { id: 'span', partId: `${p}.nat.${v0}`, label: 'the middle of the keyboard', point: { x: 0, y: G.barY, z: 0 }, normal: UP, target: true },
  ];
  // The surfaces name the default variant's bars; each variant has its own part id.
  for (const s of surfaces) s.partId = `${p}.nat.${v0}`;
  return {
    id: `mallet.${p}`,
    name: fam.name,
    parts,
    regions,
    surfaces,
    lines: [{ id: 'centre', label: 'the keyboard’s centre line', point: { x: 0, y: G.barY, z: 0 }, dir: DOWN }],
    envelopes,
    variants: fam.variants.map((v) => ({ id: v.row.id, label: v.label, blurb: v.blurb, phrase: v.phrase })),
    defaultVariant: v0,
    views: G.views[v0],
    viewsByVariant,
    viewTags: { side: 'FRONT · FROM THE AUDIENCE', top: 'FROM ABOVE · AUDIENCE BELOW' },
    aimAzLimit: 180,
    yFloor: { mm: 0, prov: ill('the floor is the frame’s origin; the bar height above it is a drawing default') },
    floorByVariant,
    // No inside: a mallet keyboard is open (the interior is out of reach).
    interior: { x0: 0, x1: 1, rIn: 1, c: { x: 0, y: 1e6, z: 0 } },
    ports: Object.fromEntries(fam.variants.map((v) => [v.row.id, null])),
    // Stands stand on the AUDIENCE side, booms reaching back over the keyboard.
    mountRule: { boom: 'level', fallback: { x: 0, y: 0, z: 1 }, length: G.boom, fixed: true },
  };
}

/* ── the starting points (zones), built from the same numbers ── */
export type ZoneWords = { label: string; band: string; tendency: string; checks: string[] };

const drawRect = (u0: number, u1: number, v0: number, v1: number): ZoneDraw => ({ u0, u1, v0, v1 });

/** One mic above the middle of the played span, aimed down (a lesson trial). */
export function oneMicZone(fam: MalletFamily, o: { id: string; min: number; max: number; srcKey: string; quote: string; micTypeIds: string[]; words: ZoneWords; half?: number }): DocumentedZone {
  const G = malletGeom(fam);
  const half = o.half ?? 300;
  const mid = (o.min + o.max) / 2;
  return {
    id: o.id,
    ...o.words,
    kind: 'trial',
    src: o.srcKey,
    quote: o.quote,
    refSurface: 'bars',
    side: 'outside',
    distance: { min: o.min, max: o.max },
    box: { min: { x: -half, y: -1e5, z: -half }, max: { x: half, y: 1e5, z: half }, prov: ill('"over the middle of the played span": within 30 cm either way is the lab’s drawing of it') },
    aim: { maxOffAxis: 30, dir: DOWN, prov: ill('"aimed down": within 30° of straight down is the lab’s tolerance') },
    requires: { micTypeIds: o.micTypeIds },
    drawn: { side: drawRect(-half, half, G.barY - o.max, G.barY - o.min), top: drawRect(-half, half, -half, half) },
    start: { p: { x: 0, y: G.barY - mid, z: 0 }, az: 0, el: -80 },
  };
}

/** One mic of Shure's spaced pair: 457.2 above, 609.6 apart (S-LIVE). */
export const SHURE_H = 18 * 25.4;
export const SHURE_SPACING = 24 * 25.4;
export function spacedMemberZone(fam: MalletFamily, o: { id: string; side: 'low' | 'high'; micTypeIds: string[]; words: ZoneWords }): DocumentedZone {
  const G = malletGeom(fam);
  const x = (o.side === 'low' ? 1 : -1) * (SHURE_SPACING / 2);
  return {
    id: o.id,
    ...o.words,
    kind: 'sourced',
    src: 'S-LIVE',
    quote: 'Two microphones aiming down toward instrument, about 1 1/2 feet above it, spaced 2 feet apart, or angled 135° apart with grilles touching',
    refSurface: 'bars',
    side: 'outside',
    distance: { min: SHURE_H - 50, max: SHURE_H + 50 },
    bandProv: ill('"about 1 1/2 feet": ±5 cm is the lab’s drawing tolerance'),
    box: { min: { x: x - 60, y: -1e5, z: -150 }, max: { x: x + 60, y: 1e5, z: 150 }, prov: ill('"spaced 2 feet apart" about the middle: each mic within 6 cm of its place along the keyboard is the lab’s tolerance') },
    aim: { maxOffAxis: 30, dir: DOWN, prov: ill('"aiming down": within 30° of straight down is the lab’s tolerance') },
    requires: { micTypeIds: o.micTypeIds },
    drawn: { side: drawRect(x - 60, x + 60, G.barY - SHURE_H - 50, G.barY - SHURE_H + 50), top: drawRect(x - 60, x + 60, -150, 150) },
    start: { p: { x, y: G.barY - SHURE_H, z: 0 }, az: 0, el: -90 },
  };
}

/** Under the instrument, aimed up at the resonators (a deliberate alternative). */
export function underZone(fam: MalletFamily, o: { id: string; srcKey: string; quote: string; micTypeIds: string[]; words: ZoneWords; variants?: string[] }): DocumentedZone {
  const G = malletGeom(fam);
  // Under the high third of the keyboard, where the tubes are short; from
  // 25 cm above the floor to 12 cm under the lowest tube end there.
  const vs = o.variants ?? Object.keys(G.layouts);
  let x0 = -1e9;
  let x1 = 1e9;
  let yTop = -1e9;
  let yBot = 1e9;
  for (const v of vs) {
    const L = G.layouts[v];
    const third = (L.span.hi - L.span.lo) / 3;
    x0 = Math.max(x0, L.span.lo + 80);
    x1 = Math.min(x1, L.span.lo + third);
    const tubes = L.tubes.filter((t) => t.x >= L.span.lo && t.x <= L.span.lo + third + 60);
    yTop = Math.max(yTop, Math.max(...tubes.map((t) => t.yBot)) + 120);
    yBot = Math.min(yBot, G.floor[v] - 250);
  }
  const yMid = (yTop + yBot) / 2;
  return {
    id: o.id,
    ...o.words,
    kind: 'trial',
    src: o.srcKey,
    quote: o.quote,
    refSurface: 'bars',
    side: 'outside',
    distance: { min: G.barY - yBot, max: G.barY - yTop },
    bandProv: ill('no number in the lesson: under the high third, from 25 cm above the floor to 12 cm below the tube ends, is the lab’s drawing'),
    box: { min: { x: x0, y: -1e5, z: -120 }, max: { x: x1, y: 1e5, z: 120 }, prov: ill('between the two rows of tubes, under the high third: the lab’s drawing') },
    aim: { maxOffAxis: 30, dir: UP, prov: ill('aimed up at the tubes: within 30° of straight up is the lab’s tolerance') },
    requires: { micTypeIds: o.micTypeIds, ...(o.variants ? { variants: o.variants } : {}) },
    drawn: { side: drawRect(x0, x1, yTop, yBot), top: drawRect(x0, x1, -120, 120) },
    start: { p: { x: (x0 + x1) / 2, y: yMid, z: 0 }, az: 0, el: 90 },
  };
}

/** A slant from the middle of the keyboard toward the audience: distance
 *  from the 'span' point, angle from straight up (cone), aimed at the point. */
export function slantZone(fam: MalletFamily, o: { id: string; min: number; max: number; aMin: number; aMax: number; kind: 'trial'; srcKey: string; quote: string; micTypeIds: string[]; words: ZoneWords; variants?: string[]; /** The start pose's distance and angle (default: the band's middle). */ start?: { r: number; a: number } }): DocumentedZone {
  const G = malletGeom(fam);
  const rMid = o.start?.r ?? (o.min + o.max) / 2;
  const aMid = ((o.start?.a ?? (o.aMin + o.aMax) / 2) * Math.PI) / 180;
  const p = { x: 0, y: G.barY - rMid * Math.cos(aMid), z: rMid * Math.sin(aMid) };
  // Aim at the point: from p toward (0, barY, 0).
  const dz = -p.z;
  const dy = G.barY - p.y;
  // aimVec(az, el) = (−cos az cos el, −sin el, sin az cos el): az = −90 points −z.
  const el = -(Math.atan2(dy, Math.abs(dz)) * 180) / Math.PI;
  const rad = (d: number) => (d * Math.PI) / 180;
  // Seen from the front: a height band over the middle; from above: a band
  // toward the audience. Both from the same distances and angles.
  const yHi = G.barY - o.max * Math.cos(rad(o.aMin));
  const yLo = G.barY - o.min * Math.cos(rad(o.aMax));
  const zNear = o.min * Math.sin(rad(o.aMin));
  const zFarZ = o.max * Math.sin(rad(o.aMax));
  return {
    id: o.id,
    ...o.words,
    kind: o.kind,
    src: o.srcKey,
    quote: o.quote,
    refSurface: 'span',
    side: 'outside',
    distance: { min: o.min, max: o.max },
    cone: { min: o.aMin, max: o.aMax, toward: { x: 0, y: 0, z: 1 }, prov: ill('"above and slightly toward the audience side": the angle band from straight up is the lab’s drawing') },
    box: { min: { x: -200, y: -1e5, z: -1e5 }, max: { x: 200, y: 1e5, z: 1e5 }, prov: ill('over the middle of the played span (within 20 cm along the keyboard)') },
    aim: { maxOffAxis: 30, prov: ill('aimed at the middle of the keyboard: within 30° is the lab’s tolerance') },
    requires: { micTypeIds: o.micTypeIds, ...(o.variants ? { variants: o.variants } : {}) },
    drawn: { side: drawRect(-200, 200, yHi, yLo), top: drawRect(-200, 200, zNear, zFarZ) },
    start: { p, az: -90, el },
  };
}

/** The family's drawing defaults in words, for a lesson's unknowns. */
export const FAMILY_UNKNOWNS: { text: string; dims: string[] }[] = [
  { text: 'Bar lengths: no maker prints them. Drawn by a halving-per-two-octaves rule from a longest bar (the marimba’s from a maker’s “around 620 mm”; the others 0.6 × the low-end depth, 0.4 for the glockenspiel), never shorter than a floor length — a drawing default.', dims: ['LbarLow', 'LbarMin'] },
  { text: 'The row layout: the two rows’ lines (0.22 × the mean depth, held so the longest bar stays inside the frame), the 15 mm rise of the far row, the 6 mm gaps and each far-row bar centred on its gap — drawing defaults.', dims: [] },
  { text: 'The bar height above the floor (inside each maker’s printed range) — a drawing default.', dims: ['hBars'] },
  { text: 'Resonator pipes: the acoustic lengths are DERIVED (a quarter wavelength, L = c ÷ 4f, at A = 442 Hz and 20 °C); the diameters, the end correction (0.6 × radius), the 22 mm gap under each bar and the Helmholtz boxes’ size are drawing defaults. A real pipe’s visible length is not a pitch readout: some are closed midway or added for looks.', dims: [] },
  { text: 'The cords pass through each bar at 0.224 of its length from each end — the plain bar’s still points; tuned bars differ a little.', dims: [] },
  { text: 'How high the mallets rise above the bars (35 cm; 25 cm on the glockenspiel) and the player’s place — drawing defaults. No source gives a mallet clearance.', dims: ['malletH'] },
  { text: 'The frame, rails, legs, casters and the stretcher; where stands stand (the audience side) and their boom length — drawing defaults.', dims: [] },
];

/** A provenance that says a value is a drawing default (used in tests). */
export const DRAWING = drawingDefault;
