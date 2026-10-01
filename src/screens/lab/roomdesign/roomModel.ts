/**
 * roomModel — the PURE model behind the Room Design & Monitoring Lab (owner
 * spec 2026-10-01). No React, no Skia, no RN: everything here is node-tested
 * (test/roomDesignLabModel.test.ts) and every display in the lab reads its
 * numbers from one `analyze()` call.
 *
 * It expands the Wave Physics lab's Room Builder (wave/waveEngine.ts) from a
 * 2-D teaching room into a 3-D room PLAN: a polygon floor plan in METRES, a
 * ceiling, surface materials, openings, furniture, a monitoring layout
 * (speakers, a subwoofer, the listening position) and treatment objects.
 *
 * THE HONESTY BOUNDARY (owner, must be visible in the UI — every result
 * carries its tier):
 *   CALCULATED  dimensions, coordinates, distances, idealized room-mode
 *               frequencies for a rectangular room — exact arithmetic.
 *   ESTIMATED   reflection behaviour and likely acoustic effects from
 *               simplified material assumptions (image-source first order,
 *               broadband absorption, Sabine/Eyring in a small room).
 *   MEASURED    numbers the user typed in from a real measurement.
 *
 * The formulas are the ones the app's calculators already ratify
 * (calc/workspaces/roomsMusic.ts, roomsAdvanced.ts): c = 331.3·√(1 + T/273.15),
 * axial f = n·c/(2L), Rayleigh f = (c/2)·√((nx/Lx)² + (ny/Ly)² + (nz/Lz)²),
 * Sabine RT60 = 0.161·V/A, Eyring RT60 = 0.161·V/(−S·ln(1−ā)). Material α
 * tables are the Wave lab's (textbook teaching values, not ISO 354 data).
 */
import { speedOfSoundAir } from '../calc/calcUnits.ts';
import { MATERIALS, type MaterialKey } from '../wave/waveEngine.ts';

/* ────────────────────────────── honesty tiers ───────────────────────────── */

export type Tier = 'CALCULATED' | 'ESTIMATED' | 'MEASURED';
export const TIER_NOTE: Record<Tier, string> = {
  CALCULATED: 'exact arithmetic from the dimensions and coordinates you entered',
  ESTIMATED: 'a simplified model — real rooms differ; measure to know',
  MEASURED: 'a value you measured in the real room',
};

/* ───────────────────────────────── units ────────────────────────────────── */

export type Units = 'metric' | 'imperial';
export const FT = 0.3048; // exact, by definition
export const IN = 0.0254; // exact, by definition

export function toMetres(v: number, units: Units): number {
  return units === 'imperial' ? v * FT : v;
}
export function fromMetres(m: number, units: Units): number {
  return units === 'imperial' ? m / FT : m;
}

/** A length for display: "3.66 m" / "366 cm", or "12′ 0″" / "6.5″". */
export function fmtLen(m: number, units: Units, opts: { small?: boolean } = {}): string {
  if (!Number.isFinite(m)) return '—';
  if (units === 'metric') {
    if (opts.small || Math.abs(m) < 1) return `${Math.round(m * 100)} cm`;
    return `${m.toFixed(2)} m`;
  }
  const inches = m / IN;
  if (opts.small || Math.abs(inches) < 12) return `${inches.toFixed(1)}″`;
  const ft = Math.floor(Math.abs(inches) / 12);
  const rem = Math.abs(inches) - ft * 12;
  const sign = m < 0 ? '-' : '';
  return `${sign}${ft}′ ${rem.toFixed(0)}″`;
}

/** Signed difference for symmetry readouts: "+12 cm" / "−0.4″". */
export function fmtDelta(m: number, units: Units): string {
  const s = m > 0 ? '+' : m < 0 ? '−' : '';
  return `${s}${fmtLen(Math.abs(m), units, { small: true })}`;
}

export function fmtHz(f: number): string {
  if (!Number.isFinite(f)) return '—';
  return f >= 1000 ? `${(f / 1000).toFixed(2)} kHz` : `${f.toFixed(1)} Hz`;
}

/* ──────────────────────────────── surfaces ──────────────────────────────── */

/** Surface materials the room editor offers. Most are the Wave lab's table
 *  (textbook teaching values, disclosed); tile and acoustic ceiling tile are
 *  added here with the same six-band shape. */
export type SurfaceKey = 'carpet' | 'hardwood' | 'concrete' | 'tile' | 'drywall' | 'glass' | 'curtain' | 'wood' | 'acoustictile' | 'open';

export const BANDS = [125, 250, 500, 1000, 2000, 4000] as const;

const EXTRA_ALPHA: Record<'tile' | 'acoustictile', number[]> = {
  tile: [0.01, 0.01, 0.01, 0.01, 0.02, 0.02],
  acoustictile: [0.5, 0.7, 0.6, 0.7, 0.7, 0.7],
};

export const SURFACES: Record<SurfaceKey, { label: string; short: string; alpha: number[]; blurb: string }> = {
  carpet: { label: 'Carpet', short: 'CARPT', alpha: MATERIALS.carpet.alpha, blurb: 'Thin porous absorption — good above 500 Hz, useless for bass. A carpeted room can still boom.' },
  hardwood: { label: 'Hardwood', short: 'WOOD', alpha: MATERIALS.wood.alpha, blurb: 'Mostly reflective with a little low-end flex — the warm-sounding hard floor.' },
  concrete: { label: 'Concrete', short: 'CONC', alpha: MATERIALS.concrete.alpha, blurb: 'Reflects almost everything at every frequency. Whatever hits it comes back.' },
  tile: { label: 'Tile', short: 'TILE', alpha: EXTRA_ALPHA.tile, blurb: 'As hard as concrete: a tiled floor reflects nearly everything. Add a rug under the desk and listener.' },
  drywall: { label: 'Drywall', short: 'DRYWL', alpha: MATERIALS.drywall.alpha, blurb: 'A light wall that vibrates: absorbs some lows, reflects the mids and highs.' },
  glass: { label: 'Glass', short: 'GLASS', alpha: MATERIALS.glass.alpha, blurb: 'Hard for mids and highs; the pane flexes at low frequencies and eats a little bass. A window is also a weak point for isolation.' },
  curtain: { label: 'Curtains', short: 'CURT', alpha: MATERIALS.curtain.alpha, blurb: 'Soft and porous: eats mids and highs, but the lows sail straight through the fabric.' },
  wood: { label: 'Wood panel', short: 'PANEL', alpha: MATERIALS.wood.alpha, blurb: 'Mostly reflective with a little low-end flex.' },
  acoustictile: { label: 'Acoustic ceiling tile', short: 'ACTIL', alpha: EXTRA_ALPHA.acoustictile, blurb: 'A drop ceiling of mineral-fibre tile: moderate broadband absorption, more than drywall, less than a thick cloud.' },
  open: { label: 'Opening', short: 'OPEN', alpha: MATERIALS.open.alpha, blurb: 'No surface at all: everything leaves and nothing returns.' },
};

export const FLOOR_OPTIONS: SurfaceKey[] = ['carpet', 'hardwood', 'concrete', 'tile'];
export const WALL_OPTIONS: SurfaceKey[] = ['drywall', 'concrete', 'glass', 'wood', 'curtain'];
export const CEILING_OPTIONS: SurfaceKey[] = ['drywall', 'concrete', 'wood', 'acoustictile'];

/** α of a surface at one of the six bands (index 0..5). */
export function surfaceAlpha(key: SurfaceKey, band: number): number {
  const a = SURFACES[key].alpha;
  return a[Math.max(0, Math.min(5, band))] ?? 0;
}

/** Re-exported so the UI can show the Wave lab's photos for its materials. */
export type { MaterialKey };

/* ───────────────────────────── the room model ───────────────────────────── */

export type Pt = { x: number; y: number };

export type WallShape = 'rect' | 'angled' | 'irregular' | 'curved';
export type CeilingType = 'flat' | 'sloped' | 'vaulted' | 'mixed';
export type OpeningKind = 'door' | 'window' | 'opening';
export type FeatureKind = 'desk' | 'sofa' | 'bookshelf' | 'rack';

export type Opening = {
  id: string;
  kind: OpeningKind;
  /** Edge index of the wall it sits in (edge i runs vertex i → i+1). */
  wall: number;
  /** Position of its centre along that edge, 0..1. */
  pos: number;
  /** Width along the wall and height, metres. */
  width: number;
  height: number;
  /** Bottom edge above the floor (a window sill), metres. */
  sill: number;
};

export type Feature = {
  id: string;
  kind: FeatureKind;
  /** Centre, metres. */
  x: number;
  y: number;
  /** Footprint, metres. */
  w: number;
  d: number;
  h: number;
};

export type Room = {
  units: Units;
  shape: WallShape;
  /** Floor plan in metres, counter-clockwise, front wall first (speakers face
   *  +y; the front wall is the edge from vertex 0 to vertex 1 at y = 0). */
  vertices: Pt[];
  /** Index of the edge drawn/treated as a curved section ('curved' shape). */
  curvedWall?: number;
  /** Ceiling height, metres (the high point for sloped/vaulted/mixed). */
  height: number;
  ceiling: CeilingType;
  /** Low point of a sloped / mixed / vaulted-edge ceiling, metres. */
  heightLow: number;
  floor: SurfaceKey;
  walls: SurfaceKey;
  ceilingMat: SurfaceKey;
  openings: Opening[];
  features: Feature[];
  tempC: number;
};

export type SpeakerRole = 'L' | 'R' | 'C' | 'LS' | 'RS' | 'SUB';

export type Speaker = {
  role: SpeakerRole;
  x: number;
  y: number;
  /** Acoustic centre (tweeter) height, metres; a sub's driver height. */
  z: number;
  /** Toe-in: degrees the speaker turns toward the room's centre line (0 = straight ahead). */
  toeDeg: number;
};

export type Listener = { x: number; y: number; earZ: number };

export type Layout = {
  name: string;
  speakers: Speaker[];
  listener: Listener;
};

export type MonitoringConfig = 'stereo' | 'stereo_sub' | 'multichannel';
export type MonitoringField = 'nearfield' | 'midfield' | 'other';

export type TreatmentKind = 'absorber' | 'basstrap' | 'cloud' | 'diffuser' | 'rug' | 'gobo';

export type Treatment = {
  id: string;
  kind: TreatmentKind;
  /** Wall edge for absorber/diffuser; corner VERTEX index for a bass trap. */
  wall?: number;
  /** Position along the wall edge 0..1 (absorber/diffuser), or the item's
   *  centre in metres (cloud/rug/gobo use x,y). */
  pos?: number;
  x?: number;
  y?: number;
  /** Face size, metres. */
  width: number;
  height: number;
  /** Thickness, metres (porous depth; a trap's effective depth). */
  thickness: number;
  /** Centre height above the floor for wall items, metres. */
  z: number;
  /** A/B: left in the model but switched off. */
  enabled: boolean;
};

export type RoomDesign = {
  id: string;
  name: string;
  room: Room;
  monitoring: { config: MonitoringConfig; field: MonitoringField; model: string };
  layouts: Layout[];
  /** Index of the layout being edited / shown. */
  active: number;
  treatment: Treatment[];
  /** Optional numbers the user measured in the real room. */
  measured: { rt60Mid?: number; modeHz?: number };
  createdAt: number;
  updatedAt: number;
};

/* ────────────────────────────── construction ────────────────────────────── */

let idSeq = 0;
export function newId(prefix = 'rd'): string {
  idSeq += 1;
  return `${prefix}_${Date.now().toString(36)}_${idSeq.toString(36)}`;
}

/** The plan outline for a shape at a given bounding box. */
export function shapeVertices(shape: WallShape, width: number, length: number): Pt[] {
  const W = width;
  const L = length;
  switch (shape) {
    case 'rect':
      return [{ x: 0, y: 0 }, { x: W, y: 0 }, { x: W, y: L }, { x: 0, y: L }];
    case 'angled': {
      // Splayed front: the front corners pulled in, so the side walls angle
      // out toward the rear (the classic control-room splay).
      const a = Math.min(W * 0.14, 1.2);
      return [{ x: a, y: 0 }, { x: W - a, y: 0 }, { x: W, y: L }, { x: 0, y: L }];
    }
    case 'irregular': {
      // An alcove in the rear-right corner — a wardrobe, a chimney breast.
      return [
        { x: 0, y: 0 },
        { x: W, y: 0 },
        { x: W, y: L * 0.62 },
        { x: W * 0.74, y: L * 0.62 },
        { x: W * 0.74, y: L },
        { x: 0, y: L },
      ];
    }
    case 'curved':
      // A rectangle whose REAR wall is a curved section (edge 2, bulging out).
      return [{ x: 0, y: 0 }, { x: W, y: 0 }, { x: W, y: L }, { x: 0, y: L }];
  }
}

export function defaultRoom(units: Units = 'metric'): Room {
  const W = 4;
  const L = 5;
  return {
    units,
    shape: 'rect',
    vertices: shapeVertices('rect', W, L),
    height: 2.5,
    ceiling: 'flat',
    heightLow: 2.2,
    floor: 'carpet',
    walls: 'drywall',
    ceilingMat: 'drywall',
    openings: [
      { id: 'door1', kind: 'door', wall: 2, pos: 0.78, width: 0.9, height: 2.05, sill: 0 },
      { id: 'win1', kind: 'window', wall: 1, pos: 0.55, width: 1.2, height: 1.1, sill: 0.95 },
    ],
    features: [{ id: 'desk1', kind: 'desk', x: W / 2, y: 1.55, w: 1.5, d: 0.7, h: 0.74 }],
    tempC: 20,
  };
}

export function defaultLayout(room: Room, name = 'Current'): Layout {
  const { width: W } = bounds(room);
  const spread = 1.6;
  const front = 0.9;
  return {
    name,
    speakers: [
      { role: 'L', x: W / 2 - spread / 2, y: front, z: 1.2, toeDeg: 30 },
      { role: 'R', x: W / 2 + spread / 2, y: front, z: 1.2, toeDeg: 30 },
    ],
    listener: { x: W / 2, y: front + spread * Math.sqrt(3) / 2, earZ: 1.2 },
  };
}

export function defaultDesign(units: Units = 'metric'): RoomDesign {
  const room = defaultRoom(units);
  const now = Date.now();
  return {
    id: newId('design'),
    name: 'My room',
    room,
    monitoring: { config: 'stereo', field: 'nearfield', model: '' },
    layouts: [defaultLayout(room, 'Current')],
    active: 0,
    treatment: [],
    measured: {},
    createdAt: now,
    updatedAt: now,
  };
}

/* ─────────────────────────────── geometry ───────────────────────────────── */

export type Bounds = { minX: number; minY: number; maxX: number; maxY: number; width: number; length: number };

export function bounds(room: Pick<Room, 'vertices'>): Bounds {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const v of room.vertices) {
    minX = Math.min(minX, v.x);
    minY = Math.min(minY, v.y);
    maxX = Math.max(maxX, v.x);
    maxY = Math.max(maxY, v.y);
  }
  if (!Number.isFinite(minX)) return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, length: 0 };
  return { minX, minY, maxX, maxY, width: maxX - minX, length: maxY - minY };
}

/** Shoelace area, metres². */
export function polygonArea(v: Pt[]): number {
  let a = 0;
  for (let i = 0; i < v.length; i++) {
    const p = v[i];
    const q = v[(i + 1) % v.length];
    a += p.x * q.y - q.x * p.y;
  }
  return Math.abs(a) / 2;
}

export function pointInPolygon(p: Pt, v: Pt[]): boolean {
  let inside = false;
  for (let i = 0, j = v.length - 1; i < v.length; j = i++) {
    const a = v[i];
    const b = v[j];
    const cross = a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x;
    if (cross) inside = !inside;
  }
  return inside;
}

export function edgeLength(v: Pt[], i: number): number {
  const a = v[i];
  const b = v[(i + 1) % v.length];
  return Math.hypot(b.x - a.x, b.y - a.y);
}

/** Point along edge i at parameter t (0..1). */
export function edgePoint(v: Pt[], i: number, t: number): Pt {
  const a = v[i];
  const b = v[(i + 1) % v.length];
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

/** Perpendicular distance from p to the infinite line of edge i, and the
 *  parameter of the foot of the perpendicular along the edge. */
export function distToEdge(p: Pt, v: Pt[], i: number): { dist: number; t: number; foot: Pt } {
  const a = v[i];
  const b = v[(i + 1) % v.length];
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy || 1e-9;
  const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
  const foot = { x: a.x + dx * t, y: a.y + dy * t };
  return { dist: Math.hypot(p.x - foot.x, p.y - foot.y), t, foot };
}

/** The room is a rectangle (axis-aligned, four right angles) — the only shape
 *  whose modes the idealized equation describes. */
export function isRectangular(room: Pick<Room, 'vertices' | 'shape' | 'curvedWall'>): boolean {
  if (room.shape === 'curved' || room.curvedWall != null) return false;
  const v = room.vertices;
  if (v.length !== 4) return false;
  const b = bounds(room);
  const tol = 1e-6;
  return v.every((p) => (Math.abs(p.x - b.minX) < tol || Math.abs(p.x - b.maxX) < tol) && (Math.abs(p.y - b.minY) < tol || Math.abs(p.y - b.maxY) < tol));
}

/** Scale the plan so its bounding box becomes (width, length), keeping shape. */
export function resizeRoom(room: Room, width: number, length: number): Room {
  const b = bounds(room);
  const sx = b.width > 0 ? width / b.width : 1;
  const sy = b.length > 0 ? length / b.length : 1;
  const vertices = room.vertices.map((p) => ({ x: b.minX + (p.x - b.minX) * sx, y: b.minY + (p.y - b.minY) * sy }));
  const features = room.features.map((f) => ({ ...f, x: b.minX + (f.x - b.minX) * sx, y: b.minY + (f.y - b.minY) * sy }));
  return { ...room, vertices, features };
}

/** Keep a speaker/listener inside the plan: clamp to the bounding box, then
 *  reject a point outside the polygon (the previous point stands). */
export function clampInside(p: Pt, room: Pick<Room, 'vertices'>, prev: Pt, margin = 0.15): Pt {
  const b = bounds(room);
  const c = {
    x: Math.max(b.minX + margin, Math.min(b.maxX - margin, p.x)),
    y: Math.max(b.minY + margin, Math.min(b.maxY - margin, p.y)),
  };
  return pointInPolygon(c, room.vertices) ? c : prev;
}

/** Local ceiling height at a point (flat / sloped front→rear / vaulted /
 *  mixed = a step at mid-length). */
export function ceilingHeightAt(room: Room, y: number): number {
  const b = bounds(room);
  const t = b.length > 0 ? Math.max(0, Math.min(1, (y - b.minY) / b.length)) : 0;
  switch (room.ceiling) {
    case 'flat':
      return room.height;
    case 'sloped':
      return room.heightLow + (room.height - room.heightLow) * (1 - t); // high at the front
    case 'vaulted':
      return room.heightLow + (room.height - room.heightLow) * Math.sin(Math.PI * t);
    case 'mixed':
      return t < 0.5 ? room.height : room.heightLow;
  }
}

export function roomVolume(room: Room): number {
  // Integrate the ceiling profile along the length (20 slices) × plan area.
  const area = polygonArea(room.vertices);
  const b = bounds(room);
  let sum = 0;
  const N = 20;
  for (let i = 0; i < N; i++) sum += ceilingHeightAt(room, b.minY + ((i + 0.5) / N) * b.length);
  return area * (sum / N);
}

/** Mean ceiling height (the modal "height" of a non-flat ceiling). */
export function meanHeight(room: Room): number {
  const area = polygonArea(room.vertices);
  return area > 0 ? roomVolume(room) / area : room.height;
}

/* ─────────────────────────────── room modes ─────────────────────────────── */

export type ModeKind = 'axial' | 'tangential' | 'oblique';
export type RoomMode = { nx: number; ny: number; nz: number; f: number; kind: ModeKind; axis?: 'L' | 'W' | 'H' };

/** Speed of sound — the calculator's own function (331.3·√(1 + T/273.15)). */
export const speedOfSound = speedOfSoundAir;

/** Rayleigh: f = (c/2)·√((nx/L)² + (ny/W)² + (nz/H)²). Axial when one index
 *  is non-zero, tangential for two, oblique for three. */
export function modeFrequency(c: number, L: number, W: number, H: number, nx: number, ny: number, nz: number): number {
  return (c / 2) * Math.sqrt((nx / L) ** 2 + (ny / W) ** 2 + (nz / H) ** 2);
}

/** Every mode with indices ≤ `maxOrder` below `maxHz`, ascending. */
export function roomModes(c: number, L: number, W: number, H: number, maxOrder = 4, maxHz = 300): RoomMode[] {
  const out: RoomMode[] = [];
  if (!(L > 0) || !(W > 0) || !(H > 0) || !(c > 0)) return out;
  for (let nx = 0; nx <= maxOrder; nx++) {
    for (let ny = 0; ny <= maxOrder; ny++) {
      for (let nz = 0; nz <= maxOrder; nz++) {
        if (nx + ny + nz === 0) continue;
        const f = modeFrequency(c, L, W, H, nx, ny, nz);
        if (f > maxHz) continue;
        const nonZero = (nx ? 1 : 0) + (ny ? 1 : 0) + (nz ? 1 : 0);
        const kind: ModeKind = nonZero === 1 ? 'axial' : nonZero === 2 ? 'tangential' : 'oblique';
        const axis = kind === 'axial' ? (nx ? 'L' : ny ? 'W' : 'H') : undefined;
        out.push({ nx, ny, nz, f, kind, axis });
      }
    }
  }
  return out.sort((a, b) => a.f - b.f);
}

/** Modal pressure magnitude (0..1) at a point in a rectangular room:
 *  |cos(nxπx/L)·cos(nyπy/W)·cos(nzπz/H)| — 1 at every boundary and corner,
 *  0 on the nodal planes. x along the length, y across the width. */
export function modePressure(L: number, W: number, H: number, m: Pick<RoomMode, 'nx' | 'ny' | 'nz'>, x: number, y: number, z: number): number {
  return Math.abs(Math.cos((m.nx * Math.PI * x) / L) * Math.cos((m.ny * Math.PI * y) / W) * Math.cos((m.nz * Math.PI * z) / H));
}

/** Pairs of modes within 5 % of each other (the calculator's own rule):
 *  coincident modes pile up at one frequency. */
export function coincidentModes(modes: RoomMode[], tol = 0.05): [RoomMode, RoomMode][] {
  const out: [RoomMode, RoomMode][] = [];
  for (let i = 1; i < modes.length; i++) {
    const a = modes[i - 1];
    const b = modes[i];
    if (a.f > 0 && (b.f - a.f) / a.f < tol) out.push([a, b]);
  }
  return out;
}

/** Schroeder frequency ≈ 2000·√(RT60/V): above it the room is dense enough
 *  to treat statistically; below it individual modes rule. */
export function schroederHz(rt60: number, volume: number): number {
  return volume > 0 && rt60 > 0 ? 2000 * Math.sqrt(rt60 / volume) : NaN;
}

/* ────────────────────────────── reflections ─────────────────────────────── */

export type ReflectionSurface = { kind: 'wall'; edge: number } | { kind: 'floor' } | { kind: 'ceiling' };

export type Reflection = {
  speaker: SpeakerRole;
  surface: ReflectionSurface;
  /** The reflection point on the surface (metres; z for floor/ceiling). */
  point: { x: number; y: number; z: number };
  /** Path length speaker → surface → listener, and the direct path. */
  pathLen: number;
  directLen: number;
  /** Arrival after the direct sound, ms (1 ms ≈ 0.343 m at 20 °C). */
  delayMs: number;
  /** Rough level relative to the direct sound, dB: distance ratio plus the
   *  surface's broadband reflection loss. ESTIMATED. */
  levelDb: number;
  /** The surface this reflection meets is covered by an enabled treatment. */
  treatedBy?: string;
};

/** Mirror a point across the infinite line through edge i. */
export function mirrorAcrossEdge(p: Pt, v: Pt[], i: number): Pt {
  const { foot } = distToEdge(p, v, i);
  return { x: 2 * foot.x - p.x, y: 2 * foot.y - p.y };
}

/** Segment a→b meets edge i at parameter t along the edge (0..1) and u along
 *  the segment (0..1); null when they miss. */
function segmentHitsEdge(a: Pt, b: Pt, v: Pt[], i: number): { t: number; u: number; p: Pt } | null {
  const c = v[i];
  const d = v[(i + 1) % v.length];
  const r = { x: b.x - a.x, y: b.y - a.y };
  const s = { x: d.x - c.x, y: d.y - c.y };
  const denom = r.x * s.y - r.y * s.x;
  if (Math.abs(denom) < 1e-12) return null;
  const qp = { x: c.x - a.x, y: c.y - a.y };
  const u = (qp.x * s.y - qp.y * s.x) / denom;
  const t = (qp.x * r.y - qp.y * r.x) / denom;
  if (u < 0 || u > 1 || t < 0 || t > 1) return null;
  return { t, u, p: { x: a.x + r.x * u, y: a.y + r.y * u } };
}

/** Broadband (500 Hz–2 kHz mean) absorption of a surface, for the reflection
 *  level estimate. */
export function broadbandAlpha(key: SurfaceKey): number {
  const a = SURFACES[key].alpha;
  return (a[2] + a[3] + a[4]) / 3;
}

/** The same 500 Hz–2 kHz mean for a treatment item. */
export function treatmentBroadbandAlpha(t: Pick<Treatment, 'kind' | 'thickness'>): number {
  return (treatmentAlpha(t, 2) + treatmentAlpha(t, 3) + treatmentAlpha(t, 4)) / 3;
}

/** First-order image-source reflections from one speaker to the listener:
 *  every wall edge whose image path crosses it, plus the floor and ceiling.
 *  ESTIMATED: specular reflection off a flat surface; a curved section is
 *  treated as its chord. */
export function firstReflections(room: Room, spk: Speaker, lis: Listener, c: number, treatment: Treatment[] = []): Reflection[] {
  const v = room.vertices;
  const out: Reflection[] = [];
  const S = { x: spk.x, y: spk.y };
  const Lp = { x: lis.x, y: lis.y };
  const dh = Math.hypot(Lp.x - S.x, Lp.y - S.y);
  const directLen = Math.hypot(dh, lis.earZ - spk.z);
  const dz = lis.earZ - spk.z;
  for (let i = 0; i < v.length; i++) {
    const img = mirrorAcrossEdge(S, v, i);
    const hit = segmentHitsEdge(img, Lp, v, i);
    if (!hit) continue;
    const pathH = Math.hypot(Lp.x - img.x, Lp.y - img.y);
    const pathLen = Math.hypot(pathH, dz);
    // Height of the reflection point: the ray climbs linearly along the path.
    const z = spk.z + dz * (1 - hit.u);
    const treated = treatment.find((t) => t.enabled && (t.kind === 'absorber' || t.kind === 'diffuser') && t.wall === i && coversWallPoint(t, v, i, hit.t, z));
    // The bounce loses what the surface it meets absorbs: the panel's α where
    // a panel covers the point, the wall's (or an opening's) otherwise.
    const alpha = treated ? treatmentBroadbandAlpha(treated) : broadbandAlpha(wallMaterialAt(room, i, hit.t));
    out.push({
      speaker: spk.role,
      surface: { kind: 'wall', edge: i },
      point: { x: hit.p.x, y: hit.p.y, z },
      pathLen,
      directLen,
      delayMs: ((pathLen - directLen) / c) * 1000,
      levelDb: 20 * Math.log10(directLen / pathLen) + 10 * Math.log10(Math.max(0.01, 1 - alpha)),
      treatedBy: treated?.id,
    });
  }
  // Floor: image at −z. Reflection point where the straight line from the
  // image reaches z = 0: fraction zs/(zs+ze) of the horizontal run from the speaker.
  if (spk.z > 0 && lis.earZ > 0) {
    const sum = spk.z + lis.earZ;
    const f = spk.z / sum;
    const pathLen = Math.hypot(dh, sum);
    const px = S.x + (Lp.x - S.x) * f;
    const py = S.y + (Lp.y - S.y) * f;
    const rug = treatment.find((t) => t.enabled && t.kind === 'rug' && coversPlanPoint(t, px, py));
    const alpha = rug ? treatmentBroadbandAlpha(rug) : broadbandAlpha(room.floor);
    out.push({
      speaker: spk.role,
      surface: { kind: 'floor' },
      point: { x: px, y: py, z: 0 },
      pathLen,
      directLen,
      delayMs: ((pathLen - directLen) / c) * 1000,
      levelDb: 20 * Math.log10(directLen / pathLen) + 10 * Math.log10(Math.max(0.01, 1 - alpha)),
      treatedBy: rug?.id,
    });
  }
  // Ceiling: local height at the midpoint of the run (a sloped ceiling is
  // approximated by its height there — ESTIMATED).
  const H = ceilingHeightAt(room, (S.y + Lp.y) / 2);
  if (H > spk.z && H > lis.earZ) {
    const up = H - spk.z;
    const down = H - lis.earZ;
    const f = up / (up + down);
    const pathLen = Math.hypot(dh, up + down);
    const px = S.x + (Lp.x - S.x) * f;
    const py = S.y + (Lp.y - S.y) * f;
    const cloud = treatment.find((t) => t.enabled && t.kind === 'cloud' && coversPlanPoint(t, px, py));
    const alpha = cloud ? treatmentBroadbandAlpha(cloud) : broadbandAlpha(room.ceilingMat);
    out.push({
      speaker: spk.role,
      surface: { kind: 'ceiling' },
      point: { x: px, y: py, z: H },
      pathLen,
      directLen,
      delayMs: ((pathLen - directLen) / c) * 1000,
      levelDb: 20 * Math.log10(directLen / pathLen) + 10 * Math.log10(Math.max(0.01, 1 - alpha)),
      treatedBy: cloud?.id,
    });
  }
  return out.sort((a, b) => a.delayMs - b.delayMs);
}

/** The material at a point on a wall: an opening there overrides the wall. */
export function wallMaterialAt(room: Room, edge: number, t: number): SurfaceKey {
  const len = edgeLength(room.vertices, edge);
  for (const o of room.openings) {
    if (o.wall !== edge || len <= 0) continue;
    const half = o.width / 2 / len;
    if (Math.abs(t - o.pos) <= half) return o.kind === 'window' ? 'glass' : o.kind === 'door' ? 'wood' : 'open';
  }
  return room.walls;
}

function coversWallPoint(t: Treatment, v: Pt[], edge: number, u: number, z: number): boolean {
  const len = edgeLength(v, edge);
  if (len <= 0 || t.pos == null) return false;
  const halfU = t.width / 2 / len;
  return Math.abs(u - t.pos) <= halfU && Math.abs(z - t.z) <= t.height / 2;
}

function coversPlanPoint(t: Treatment, x: number, y: number): boolean {
  if (t.x == null || t.y == null) return false;
  return Math.abs(x - t.x) <= t.width / 2 && Math.abs(y - t.y) <= t.height / 2;
}

/* ────────────────────────────────── SBIR ────────────────────────────────── */

export type Sbir = { speaker: SpeakerRole; surface: string; distance: number; notchHz: number };

/** Speaker-boundary interference: the reflection from a nearby boundary
 *  arrives half a wavelength late at f = c/(4d) and cancels. One notch per
 *  boundary (front wall, nearest side wall, floor). ESTIMATED. */
export function sbirNotches(room: Room, spk: Speaker, c: number): Sbir[] {
  const v = room.vertices;
  const out: Sbir[] = [];
  // Nearest wall behind / beside: every edge, labelled by its role.
  const edges = v.map((_, i) => ({ i, ...distToEdge({ x: spk.x, y: spk.y }, v, i) })).filter((e) => e.t >= -0.05 && e.t <= 1.05);
  edges.sort((a, b) => a.dist - b.dist);
  for (const e of edges.slice(0, 2)) {
    if (e.dist <= 0.02) continue;
    out.push({ speaker: spk.role, surface: e.i === 0 ? 'front wall' : `wall ${e.i + 1}`, distance: e.dist, notchHz: c / (4 * e.dist) });
  }
  if (spk.z > 0.02) out.push({ speaker: spk.role, surface: 'floor', distance: spk.z, notchHz: c / (4 * spk.z) });
  return out.sort((a, b) => a.notchHz - b.notchHz);
}

/* ─────────────────────────────── stereo geometry ────────────────────────── */

export type StereoGeometry = {
  distL: number;
  distR: number;
  /** |distL − distR| in metres; the lab flags it above `SYM_TOL`. */
  pathDiff: number;
  /** Angle subtended at the listener by L and R, degrees. */
  angleDeg: number;
  /** Listener offset from the plan's centre line, metres (signed, + = right). */
  axisOffset: number;
  /** Each speaker's distance to its nearest side wall and to the front wall. */
  wallL: { side: number; front: number };
  wallR: { side: number; front: number };
  /** Listener's distance to the rear wall and the nearest side wall. */
  listenerRear: number;
  listenerSide: number;
  /** Tweeter height minus ear height (mean of L/R), metres. */
  heightDiff: number;
  spread: number;
};

export const SYM_TOL = 0.05; // 5 cm ≈ 2 in: beyond this the image starts to pull

export function stereoGeometry(room: Room, lay: Layout): StereoGeometry | null {
  const L = lay.speakers.find((s) => s.role === 'L');
  const R = lay.speakers.find((s) => s.role === 'R');
  if (!L || !R) return null;
  const lis = lay.listener;
  const d3 = (s: Speaker) => Math.hypot(s.x - lis.x, s.y - lis.y, s.z - lis.earZ);
  const distL = d3(L);
  const distR = d3(R);
  const ax = L.x - lis.x;
  const ay = L.y - lis.y;
  const bx = R.x - lis.x;
  const by = R.y - lis.y;
  const dot = ax * bx + ay * by;
  const mag = Math.hypot(ax, ay) * Math.hypot(bx, by) || 1e-9;
  const angleDeg = (Math.acos(Math.max(-1, Math.min(1, dot / mag))) * 180) / Math.PI;
  const b = bounds(room);
  const centre = (b.minX + b.maxX) / 2;
  const v = room.vertices;
  const sideDist = (p: Pt) => {
    // Nearest non-front, non-rear edge (walls whose direction is mostly along y).
    let best = Infinity;
    for (let i = 0; i < v.length; i++) {
      const a = v[i];
      const q = v[(i + 1) % v.length];
      if (Math.abs(q.y - a.y) < Math.abs(q.x - a.x)) continue; // a front/rear-ish wall
      const e = distToEdge(p, v, i);
      if (e.t >= 0 && e.t <= 1) best = Math.min(best, e.dist);
    }
    return Number.isFinite(best) ? best : Math.min(p.x - b.minX, b.maxX - p.x);
  };
  const frontDist = (p: Pt) => distToEdge(p, v, 0).dist;
  const rearDist = (p: Pt) => {
    let best = Infinity;
    for (let i = 1; i < v.length; i++) {
      const a = v[i];
      const q = v[(i + 1) % v.length];
      if (Math.abs(q.y - a.y) >= Math.abs(q.x - a.x)) continue; // side-ish
      const e = distToEdge(p, v, i);
      if (e.t >= 0 && e.t <= 1 && e.foot.y > p.y) best = Math.min(best, e.dist);
    }
    return Number.isFinite(best) ? best : b.maxY - p.y;
  };
  return {
    distL,
    distR,
    pathDiff: Math.abs(distL - distR),
    angleDeg,
    axisOffset: lis.x - centre,
    wallL: { side: sideDist(L), front: frontDist(L) },
    wallR: { side: sideDist(R), front: frontDist(R) },
    listenerRear: rearDist(lis),
    listenerSide: sideDist(lis),
    heightDiff: (L.z + R.z) / 2 - lis.earZ,
    spread: Math.hypot(R.x - L.x, R.y - L.y),
  };
}

/* ────────────────────────────── absorption / RT60 ───────────────────────── */

/** Absorption of a treatment item at a band, from its kind and thickness.
 *  A porous panel absorbs the highs at any thickness and the lows only when it
 *  is thick: the low bands scale with (thickness ÷ 10 cm). Teaching model,
 *  ESTIMATED — a datasheet's ISO 354 numbers replace this in real planning. */
export function treatmentAlpha(t: Pick<Treatment, 'kind' | 'thickness'>, band: number): number {
  const b = Math.max(0, Math.min(5, band));
  const base = MATERIALS.fiberglass.alpha; // [0.29, 0.6, 0.98, 0.99, 0.99, 0.99] at ~10 cm
  const tcm = Math.max(1, t.thickness * 100);
  const thick = (k: number) => Math.min(1, Math.pow(tcm / 10, k));
  switch (t.kind) {
    case 'absorber':
    case 'gobo':
      return [base[0] * thick(1.4), base[1] * thick(1), base[2] * thick(0.5), base[3], base[4], base[5]][b];
    case 'cloud':
      // Hung with an air gap: the gap adds to the effective depth down low.
      return [Math.min(0.99, base[0] * thick(1.4) * 1.4), Math.min(0.99, base[1] * thick(1) * 1.2), base[2], base[3], base[4], base[5]][b];
    case 'basstrap':
      // A corner trap works on the pressure maximum: strong down low for its depth.
      return [Math.min(0.99, 0.55 * thick(1)), Math.min(0.99, 0.8 * thick(0.6)), 0.95, 0.95, 0.9, 0.9][b];
    case 'diffuser':
      return [0.1, 0.15, 0.2, 0.2, 0.2, 0.2][b];
    case 'rug':
      return MATERIALS.carpet.alpha[b];
  }
}

export type SurfaceLine = { label: string; area: number; alpha: number[]; tier: Tier };

/** Every surface the Sabine sum sees: floor, ceiling, each wall (less its
 *  openings), the openings themselves, and the treatment (which REPLACES the
 *  surface it covers rather than adding to it). */
export function surfaceList(room: Room, treatment: Treatment[]): SurfaceLine[] {
  const v = room.vertices;
  const area = polygonArea(v);
  const lines: SurfaceLine[] = [];
  const alphaOf = (k: SurfaceKey) => [...SURFACES[k].alpha];
  const treatAlpha = (t: Treatment) => BANDS.map((_, b) => treatmentAlpha(t, b));
  const live = treatment.filter((t) => t.enabled);

  // Floor, minus rugs.
  const rugArea = live.filter((t) => t.kind === 'rug').reduce((s, t) => s + t.width * t.height, 0);
  lines.push({ label: `Floor · ${SURFACES[room.floor].label}`, area: Math.max(0, area - rugArea), alpha: alphaOf(room.floor), tier: 'ESTIMATED' });
  for (const t of live.filter((t) => t.kind === 'rug')) lines.push({ label: 'Rug', area: t.width * t.height, alpha: treatAlpha(t), tier: 'ESTIMATED' });

  // Ceiling, minus clouds.
  const cloudArea = live.filter((t) => t.kind === 'cloud').reduce((s, t) => s + t.width * t.height, 0);
  lines.push({ label: `Ceiling · ${SURFACES[room.ceilingMat].label}`, area: Math.max(0, area - cloudArea), alpha: alphaOf(room.ceilingMat), tier: 'ESTIMATED' });
  for (const t of live.filter((t) => t.kind === 'cloud')) lines.push({ label: 'Ceiling cloud', area: t.width * t.height, alpha: treatAlpha(t), tier: 'ESTIMATED' });

  // Walls: each edge × the local mean height, minus its openings and panels.
  const Hmean = meanHeight(room);
  for (let i = 0; i < v.length; i++) {
    const len = edgeLength(v, i);
    let wallArea = len * Hmean;
    for (const o of room.openings.filter((o) => o.wall === i)) {
      const oa = Math.min(wallArea, o.width * o.height);
      wallArea -= oa;
      const key: SurfaceKey = o.kind === 'window' ? 'glass' : o.kind === 'door' ? 'wood' : 'open';
      lines.push({ label: `${o.kind[0].toUpperCase()}${o.kind.slice(1)} on wall ${i + 1}`, area: oa, alpha: alphaOf(key), tier: 'ESTIMATED' });
    }
    for (const t of live.filter((t) => (t.kind === 'absorber' || t.kind === 'diffuser') && t.wall === i)) {
      const ta = Math.min(wallArea, t.width * t.height);
      wallArea -= ta;
      lines.push({ label: `${t.kind === 'absorber' ? 'Absorber' : 'Diffuser'} on wall ${i + 1}`, area: ta, alpha: treatAlpha(t), tier: 'ESTIMATED' });
    }
    lines.push({ label: `Wall ${i + 1} · ${SURFACES[room.walls].label}`, area: Math.max(0, wallArea), alpha: alphaOf(room.walls), tier: 'ESTIMATED' });
  }
  // Bass traps straddle a corner: their face area replaces nothing (it hangs
  // across the corner) and is added. Gobos are free-standing: both faces count.
  for (const t of live.filter((t) => t.kind === 'basstrap')) lines.push({ label: 'Bass trap', area: t.width * t.height, alpha: treatAlpha(t), tier: 'ESTIMATED' });
  for (const t of live.filter((t) => t.kind === 'gobo')) lines.push({ label: 'Gobo (both faces)', area: 2 * t.width * t.height, alpha: treatAlpha(t), tier: 'ESTIMATED' });
  return lines;
}

export type Rt60Band = { hz: number; sabine: number; eyring: number; absorption: number; meanAlpha: number };

export const SABINE_K = 0.161; // metric Sabine constant, the calculator's own

/** Sabine and Eyring RT60 per band from the surface list — the calculators'
 *  formulas exactly (roomsMusic.ts WS_SABINE, roomsAdvanced.ts EYRING).
 *  ESTIMATED: small rooms are not diffuse fields below the Schroeder
 *  frequency, so these are approximations there. */
export function rt60Bands(room: Room, treatment: Treatment[]): Rt60Band[] {
  const V = roomVolume(room);
  const lines = surfaceList(room, treatment);
  const S = lines.reduce((s, l) => s + l.area, 0);
  return BANDS.map((hz, b) => {
    const A = lines.reduce((s, l) => s + l.area * (l.alpha[b] ?? 0), 0);
    const meanAlpha = S > 0 ? Math.min(0.999, A / S) : 0;
    const sabine = A > 0 ? (SABINE_K * V) / A : NaN;
    const eyring = S > 0 && meanAlpha > 0 ? (SABINE_K * V) / (-S * Math.log(1 - meanAlpha)) : NaN;
    return { hz, sabine, eyring, absorption: A, meanAlpha };
  });
}

/* ───────────────────────────── the analysis bundle ──────────────────────── */

export type ListenerModeZone = { mode: RoomMode; pressure: number; zone: 'peak' | 'null' | 'between' };

export type Analysis = {
  c: number;
  bounds: Bounds;
  rectangular: boolean;
  /** Dimensions the mode estimate used (bounding box for a non-rectangle). */
  modalDims: { L: number; W: number; H: number };
  area: number;
  volume: number;
  modes: RoomMode[];
  coincident: [RoomMode, RoomMode][];
  /** The listener against the three lowest axial modes. */
  listenerZones: ListenerModeZone[];
  reflections: Reflection[];
  sbir: Sbir[];
  stereo: StereoGeometry | null;
  rt60: Rt60Band[];
  rt60Mid: number;
  schroeder: number;
  suggestions: Suggestion[];
};

export type Suggestion = { tier: Tier; level: 'try' | 'check' | 'ok'; text: string };

export function activeLayout(d: RoomDesign): Layout {
  return d.layouts[Math.max(0, Math.min(d.layouts.length - 1, d.active))] ?? d.layouts[0];
}

export function analyze(d: RoomDesign, layoutIndex = d.active): Analysis {
  const room = d.room;
  const lay = d.layouts[layoutIndex] ?? activeLayout(d);
  const c = speedOfSound(room.tempC);
  const b = bounds(room);
  const rectangular = isRectangular(room);
  const H = meanHeight(room);
  const modalDims = { L: b.length, W: b.width, H };
  const modes = roomModes(c, modalDims.L, modalDims.W, modalDims.H);
  const axial = modes.filter((m) => m.kind === 'axial').slice(0, 3);
  const lis = lay.listener;
  const listenerZones: ListenerModeZone[] = axial.map((mode) => {
    const p = modePressure(modalDims.L, modalDims.W, modalDims.H, mode, lis.y - b.minY, lis.x - b.minX, lis.earZ);
    return { mode, pressure: p, zone: p > 0.8 ? 'peak' : p < 0.2 ? 'null' : 'between' };
  });
  const reflections = lay.speakers.filter((s) => s.role !== 'SUB').flatMap((s) => firstReflections(room, s, lis, c, d.treatment));
  const sbir = lay.speakers.flatMap((s) => sbirNotches(room, s, c));
  const stereo = stereoGeometry(room, lay);
  const rt60 = rt60Bands(room, d.treatment);
  const mid = rt60.find((r) => r.hz === 500);
  const rt60Mid = mid ? mid.sabine : NaN;
  const volume = roomVolume(room);
  const a: Omit<Analysis, 'suggestions'> = {
    c,
    bounds: b,
    rectangular,
    modalDims,
    area: polygonArea(room.vertices),
    volume,
    modes,
    coincident: coincidentModes(modes),
    listenerZones,
    reflections,
    sbir,
    stereo,
    rt60,
    rt60Mid,
    schroeder: schroederHz(rt60Mid, volume),
  };
  return { ...a, suggestions: suggest(d, a) };
}

/* ─────────────────────────────── suggestions ────────────────────────────── */

/** Specific observations and things worth testing — never a single score and
 *  never "the optimum". Each carries the tier of the number it rests on. */
export function suggest(d: RoomDesign, a: Omit<Analysis, 'suggestions'>): Suggestion[] {
  const out: Suggestion[] = [];
  const u = d.room.units;
  const s = a.stereo;
  const len = (m: number) => fmtLen(m, u);
  if (s) {
    if (Math.abs(s.axisOffset) > 0.1) {
      out.push({ tier: 'CALCULATED', level: 'try', text: `The listening position sits ${fmtLen(Math.abs(s.axisOffset), u, { small: true })} ${s.axisOffset > 0 ? 'right' : 'left'} of the room's centre line. Try it on the centre line and compare — matched left/right geometry is the usual starting point.` });
    } else {
      out.push({ tier: 'CALCULATED', level: 'ok', text: 'The listening position is on the room’s centre line.' });
    }
    if (s.pathDiff > SYM_TOL) {
      out.push({ tier: 'CALCULATED', level: 'check', text: `Left and right speakers are ${fmtLen(s.pathDiff, u, { small: true })} apart in distance to the ears (${len(s.distL)} vs ${len(s.distR)}). Above about ${fmtLen(SYM_TOL, u, { small: true })} the centre image starts to pull toward the nearer speaker.` });
    }
    const sideDiff = Math.abs(s.wallL.side - s.wallR.side);
    if (sideDiff > 0.15) {
      out.push({ tier: 'CALCULATED', level: 'check', text: `The left speaker is ${len(s.wallL.side)} from its side wall and the right is ${len(s.wallR.side)}: the side-wall reflections will arrive at different times and levels on each side. Equal wall distances are worth testing.` });
    }
    if (s.angleDeg < 50 || s.angleDeg > 70) {
      out.push({ tier: 'CALCULATED', level: 'try', text: `The listening angle is ${s.angleDeg.toFixed(0)}°. The classic equilateral triangle gives 60° — a starting point, not a law; try it and compare the width of the image.` });
    }
    if (Math.abs(s.heightDiff) > 0.1) {
      out.push({ tier: 'CALCULATED', level: 'try', text: `The tweeters sit ${fmtLen(Math.abs(s.heightDiff), u, { small: true })} ${s.heightDiff > 0 ? 'above' : 'below'} ear height. Most monitor makers suggest the tweeter at or just above ear height; tilt or raise to test.` });
    }
    if (s.listenerRear < 1) {
      out.push({ tier: 'ESTIMATED', level: 'check', text: `The listener is ${len(s.listenerRear)} from the rear wall — the rear reflection arrives early and strong, and the pressure peak at the wall colours the bass. Moving forward, or treating the rear wall, is worth comparing.` });
    }
    for (const side of [{ n: 'left', w: s.wallL }, { n: 'right', w: s.wallR }]) {
      const notch = a.c / (4 * side.w.front);
      if (side.w.front > 0.4 && side.w.front < 1.4) {
        out.push({ tier: 'ESTIMATED', level: 'try', text: `The ${side.n} speaker is ${len(side.w.front)} from the front wall; the front-wall bounce estimates a cancellation near ${fmtHz(notch)}, in the bass. Either closer to the wall (pushing the notch higher, where it is easier to absorb) or well away from it is worth testing.` });
      }
    }
  }
  for (const z of a.listenerZones) {
    const name = `${z.mode.axis}-axis mode ${fmtHz(z.mode.f)}`;
    if (z.zone === 'peak') out.push({ tier: a.rectangular ? 'CALCULATED' : 'ESTIMATED', level: 'check', text: `The listener sits at a pressure maximum of the ${name}: bass at that frequency will sound heavy there. Try moving along that axis and compare.` });
    if (z.zone === 'null') out.push({ tier: a.rectangular ? 'CALCULATED' : 'ESTIMATED', level: 'check', text: `The listener sits near a null of the ${name}: that frequency nearly disappears at the seat. No EQ fixes a null — move the position or the speakers and compare.` });
  }
  if (!a.rectangular) {
    out.push({ tier: 'ESTIMATED', level: 'check', text: 'This room is not a rectangle, so the idealized mode equation does not strictly apply. The frequencies shown use the bounding-box dimensions and are LESS reliable — treat them as a rough guide and measure.' });
  }
  if (a.coincident.length > 0) {
    const [m1, m2] = a.coincident[0];
    out.push({ tier: a.rectangular ? 'CALCULATED' : 'ESTIMATED', level: 'check', text: `Two modes land together near ${fmtHz(m1.f)} and ${fmtHz(m2.f)} — a buildup at one frequency. Dimension ratios near 1:1 or 2:1 do this; nothing moves the walls, but bass trapping and position both change what you hear.` });
  }
  const live = d.treatment.filter((t) => t.enabled);
  const untreatedSide = a.reflections.filter((r) => r.surface.kind === 'wall' && !r.treatedBy && r.delayMs < 15 && r.levelDb > -12);
  if (untreatedSide.length > 0) {
    out.push({ tier: 'ESTIMATED', level: 'try', text: `${untreatedSide.length} early wall reflection${untreatedSide.length === 1 ? '' : 's'} within 15 ms of the direct sound reach the listener untreated. Test absorbers at the marked reflection points — the model places them where the speaker and listener positions put them.` });
  }
  const ceilingUntreated = a.reflections.some((r) => r.surface.kind === 'ceiling' && !r.treatedBy && r.delayMs < 15);
  if (ceilingUntreated) out.push({ tier: 'ESTIMATED', level: 'try', text: 'The ceiling reflection arrives within 15 ms untreated. A ceiling cloud over the listening position is the usual thing to test — mounted into structure with rated hardware, never into drywall alone.' });
  const lowModes = a.modes.filter((m) => m.kind === 'axial' && m.f < 80).length;
  if (lowModes > 0 && !live.some((t) => t.kind === 'basstrap')) out.push({ tier: 'ESTIMATED', level: 'try', text: `There are ${lowModes} axial mode${lowModes === 1 ? '' : 's'} below 80 Hz and no bass traps. Corner traps act on the pressure maxima every mode shares — compare with and without.` });
  if (Number.isFinite(a.rt60Mid)) {
    if (a.rt60Mid > 0.5) out.push({ tier: 'ESTIMATED', level: 'try', text: `The mid-band RT60 estimate is ${a.rt60Mid.toFixed(2)} s — a lively room. Small mix rooms usually aim for roughly 0.2–0.4 s; broadband absorption brings it down. Sabine is an approximation in a small room, so measure before buying.` });
    else if (a.rt60Mid < 0.15) out.push({ tier: 'ESTIMATED', level: 'check', text: `The mid-band RT60 estimate is ${a.rt60Mid.toFixed(2)} s — very dead. A room this absorbent can be fatiguing and makes mixes sound dry elsewhere; keep some liveliness (diffusion rather than more absorption).` });
    else out.push({ tier: 'ESTIMATED', level: 'ok', text: `The mid-band RT60 estimate is ${a.rt60Mid.toFixed(2)} s, inside the range small mix rooms usually aim for.` });
  }
  out.push({ tier: 'MEASURED', level: 'try', text: 'Measure the real room — a sweep or a clap test with a measurement app or analyzer — and compare the modal frequencies and decay with this model. The model shows where problems are LIKELY; only a measurement shows what the room does.' });
  return out;
}

/* ─────────────────────────── layout comparison ──────────────────────────── */

export type LayoutDiffLine = { tier: Tier; text: string };

/** What changed between two layouts of the same room, in plain words. */
export function diffLayouts(d: RoomDesign, fromIdx: number, toIdx: number): LayoutDiffLine[] {
  const from = d.layouts[fromIdx];
  const to = d.layouts[toIdx];
  const out: LayoutDiffLine[] = [];
  if (!from || !to) return out;
  const u = d.room.units;
  const moved = (a: Pt, b: Pt) => Math.hypot(b.x - a.x, b.y - a.y);
  for (const s of to.speakers) {
    const prev = from.speakers.find((p) => p.role === s.role);
    if (!prev) {
      out.push({ tier: 'CALCULATED', text: `${s.role} speaker added in "${to.name}".` });
      continue;
    }
    const dm = moved(prev, s);
    const dz = s.z - prev.z;
    if (dm > 0.01 || Math.abs(dz) > 0.01) out.push({ tier: 'CALCULATED', text: `${s.role} speaker moved ${fmtLen(dm, u, { small: true })}${Math.abs(dz) > 0.01 ? ` and ${fmtDelta(dz, u)} in height` : ''}.` });
  }
  for (const p of from.speakers) if (!to.speakers.some((s) => s.role === p.role)) out.push({ tier: 'CALCULATED', text: `${p.role} speaker removed in "${to.name}".` });
  const lm = moved(from.listener, to.listener);
  if (lm > 0.01) out.push({ tier: 'CALCULATED', text: `Listening position moved ${fmtLen(lm, u, { small: true })} (${fmtDelta(to.listener.x - from.listener.x, u)} across, ${fmtDelta(to.listener.y - from.listener.y, u)} along the room).` });
  if (Math.abs(to.listener.earZ - from.listener.earZ) > 0.01) out.push({ tier: 'CALCULATED', text: `Ear height ${fmtDelta(to.listener.earZ - from.listener.earZ, u)}.` });
  const a = analyze(d, fromIdx);
  const b = analyze(d, toIdx);
  if (a.stereo && b.stereo) {
    if (Math.abs(a.stereo.angleDeg - b.stereo.angleDeg) > 0.5) out.push({ tier: 'CALCULATED', text: `Listening angle ${a.stereo.angleDeg.toFixed(0)}° → ${b.stereo.angleDeg.toFixed(0)}°.` });
    if (Math.abs(a.stereo.pathDiff - b.stereo.pathDiff) > 0.005) out.push({ tier: 'CALCULATED', text: `Left/right path difference ${fmtLen(a.stereo.pathDiff, u, { small: true })} → ${fmtLen(b.stereo.pathDiff, u, { small: true })}.` });
    if (Math.abs(a.stereo.axisOffset - b.stereo.axisOffset) > 0.01) out.push({ tier: 'CALCULATED', text: `Offset from the centre line ${fmtLen(Math.abs(a.stereo.axisOffset), u, { small: true })} → ${fmtLen(Math.abs(b.stereo.axisOffset), u, { small: true })}.` });
  }
  for (let i = 0; i < Math.min(a.listenerZones.length, b.listenerZones.length); i++) {
    const za = a.listenerZones[i];
    const zb = b.listenerZones[i];
    if (za.zone !== zb.zone) out.push({ tier: a.rectangular ? 'CALCULATED' : 'ESTIMATED', text: `At the ${za.mode.axis}-axis mode ${fmtHz(za.mode.f)} the listener moves from a ${zoneWord(za.zone)} to a ${zoneWord(zb.zone)}.` });
  }
  const earlyA = a.reflections.filter((r) => r.delayMs < 15).length;
  const earlyB = b.reflections.filter((r) => r.delayMs < 15).length;
  if (earlyA !== earlyB) out.push({ tier: 'ESTIMATED', text: `Early reflections inside 15 ms: ${earlyA} → ${earlyB}.` });
  if (out.length === 0) out.push({ tier: 'CALCULATED', text: `"${from.name}" and "${to.name}" are the same layout.` });
  return out;
}

function zoneWord(z: ListenerModeZone['zone']): string {
  return z === 'peak' ? 'pressure peak' : z === 'null' ? 'null' : 'point between peak and null';
}

/* ─────────────────────────── treatment placement ────────────────────────── */

/** A treatment item sized and placed at a modelled reflection point. */
export function treatmentAtReflection(r: Reflection, room: Room): Treatment {
  const id = newId('tr');
  if (r.surface.kind === 'wall') {
    const t = distToEdge({ x: r.point.x, y: r.point.y }, room.vertices, r.surface.edge).t;
    return { id, kind: 'absorber', wall: r.surface.edge, pos: Math.max(0.05, Math.min(0.95, t)), width: 0.6, height: 1.2, thickness: 0.1, z: Math.max(0.6, Math.min(room.height - 0.6, r.point.z)), enabled: true };
  }
  if (r.surface.kind === 'ceiling') return { id, kind: 'cloud', x: r.point.x, y: r.point.y, width: 1.2, height: 1.2, thickness: 0.1, z: r.point.z - 0.15, enabled: true };
  return { id, kind: 'rug', x: r.point.x, y: r.point.y, width: 1.6, height: 1.2, thickness: 0.01, z: 0, enabled: true };
}

/** A corner bass trap at vertex i. */
export function basstrapAt(room: Room, vertex: number): Treatment {
  return { id: newId('tr'), kind: 'basstrap', wall: vertex, width: 0.6, height: Math.min(2.4, room.height), thickness: 0.3, z: Math.min(2.4, room.height) / 2, enabled: true };
}

export const TREATMENT_INFO: Record<TreatmentKind, { label: string; short: string; blurb: string; safety: string }> = {
  absorber: { label: 'Absorber panel', short: 'PANEL', blurb: 'A porous panel (mineral wool or fiberglass) at a first-reflection point. Thickness decides how low it works: 5 cm treats the highs, 10 cm reaches the mids, more reaches the bass.', safety: 'Use a fire-rated core and fabric. Hang on wall anchors rated for the weight; keep it clear of heaters and the exit.' },
  basstrap: { label: 'Bass trap', short: 'TRAP', blurb: 'A thick absorber across a corner, where every mode has a pressure maximum. Depth is what counts: a thin corner panel is not a bass trap.', safety: 'A full-height trap is heavy — fix it into studs or masonry with rated hardware, not into drywall alone, and never where it could fall on a seat.' },
  cloud: { label: 'Ceiling cloud', short: 'CLOUD', blurb: 'An absorber hung below the ceiling over the listening position, treating the ceiling reflection; the air gap helps it absorb lower.', safety: 'Overhead loads must go into the structure (joists) with rated hangers and a safety cable. Never into drywall or a drop-ceiling grid alone.' },
  diffuser: { label: 'Diffuser', short: 'DIFF', blurb: 'Scatters a reflection instead of absorbing it — keeps the room alive while breaking up a strong rear-wall bounce. Needs a few metres of distance to work.', safety: 'Wood diffusers are heavy; mount into structure with rated hardware.' },
  rug: { label: 'Rug / floor', short: 'RUG', blurb: 'A thick rug between the speakers and the chair treats the floor reflection for the mids and highs; it does nothing for bass.', safety: 'Use a non-slip underlay so it is not a trip hazard, and keep it clear of cables and the door swing.' },
  gobo: { label: 'Freestanding panel', short: 'GOBO', blurb: 'A movable absorber on a stand — the flexible way to test a reflection point before drilling anything.', safety: 'A tall panel must have a wide, stable base; never block the exit or a ventilation grille.' },
};

/* ─────────────────────────── measured comparison ────────────────────────── */

export type MeasuredCompare = { tier: 'MEASURED'; text: string }[];

/** The user's measured numbers against the model, plainly. */
export function compareMeasured(d: RoomDesign, a: Analysis): MeasuredCompare {
  const out: MeasuredCompare = [];
  const m = d.measured;
  if (m.rt60Mid != null && Number.isFinite(m.rt60Mid) && Number.isFinite(a.rt60Mid)) {
    const ratio = m.rt60Mid / a.rt60Mid;
    out.push({ tier: 'MEASURED', text: `Measured mid-band RT60 ${m.rt60Mid.toFixed(2)} s vs the Sabine estimate ${a.rt60Mid.toFixed(2)} s (${ratio > 1 ? 'the room is more live' : 'the room is deader'} than the model by ${Math.abs(ratio - 1) * 100 < 1 ? 'under 1' : (Math.abs(ratio - 1) * 100).toFixed(0)} %). A gap means the surfaces absorb differently from the teaching table — the measurement wins.` });
  }
  if (m.modeHz != null && Number.isFinite(m.modeHz) && a.modes.length > 0) {
    const nearest = a.modes.reduce((best, mode) => (Math.abs(mode.f - m.modeHz!) < Math.abs(best.f - m.modeHz!) ? mode : best), a.modes[0]);
    const diff = m.modeHz - nearest.f;
    out.push({ tier: 'MEASURED', text: `Measured resonance ${fmtHz(m.modeHz)}: the nearest modelled mode is ${nearest.kind} (${nearest.nx},${nearest.ny},${nearest.nz}) at ${fmtHz(nearest.f)}, ${Math.abs(diff).toFixed(1)} Hz ${diff > 0 ? 'below' : 'above'} what you measured. ${Math.abs(diff) < 3 ? 'That is a close match for a simple model.' : 'A larger gap often means the real boundaries are not where the plan says (a soft wall, an alcove, furniture) or the room is not rectangular.'}` });
  }
  return out;
}

/* ───────────────────────────── placement conflicts ──────────────────────── */

export type Conflict = { tier: Tier; text: string };

/** Clear placement conflicts — things the drawing shows but a learner may
 *  not read off it: a speaker in the furniture, a listener behind the
 *  speakers, a speaker hard against a wall, a sub in the middle of the room. */
export function placementConflicts(d: RoomDesign, a: Analysis): Conflict[] {
  const out: Conflict[] = [];
  const lay = activeLayout(d);
  const u = d.room.units;
  const v = d.room.vertices;
  const lis = lay.listener;
  for (const s of lay.speakers) {
    for (const f of d.room.features) {
      if (Math.abs(s.x - f.x) <= f.w / 2 && Math.abs(s.y - f.y) <= f.d / 2 && s.z < f.h + 0.05 && s.role !== 'SUB') {
        out.push({ tier: 'CALCULATED', text: `${s.role} speaker stands inside the ${f.kind}'s footprint below its top (${fmtLen(f.h, u)}). On the desk itself the desk becomes a reflector — stands behind it, or isolation pads, are worth testing.` });
      }
    }
    let nearest = Infinity;
    for (let i = 0; i < v.length; i++) {
      const e = distToEdge(s, v, i);
      if (e.t >= 0 && e.t <= 1) nearest = Math.min(nearest, e.dist);
    }
    if (s.role !== 'SUB' && nearest < 0.2) out.push({ tier: 'CALCULATED', text: `${s.role} speaker is ${fmtLen(nearest, u, { small: true })} from a wall — a rear port or the cabinet may touch it; boundary gain lifts the bass.` });
    if (s.role !== 'SUB' && s.role !== 'LS' && s.role !== 'RS' && s.y > lis.y - 0.3) out.push({ tier: 'CALCULATED', text: `${s.role} speaker is level with or behind the listening position — the stereo triangle has collapsed.` });
    if (s.role === 'SUB') {
      const b = a.bounds;
      const midX = Math.abs(s.x - (b.minX + b.maxX) / 2) < b.width * 0.15;
      const midY = Math.abs(s.y - (b.minY + b.maxY) / 2) < b.length * 0.15;
      if (midX && midY) out.push({ tier: 'ESTIMATED', text: 'The subwoofer sits near the middle of the room, where the first modes have nulls: it drives them weakly and the bass will be uneven. Near a wall or corner it couples to every mode — then move the listener to even it out.' });
    }
  }
  if (a.stereo && a.stereo.listenerRear < 0.6) out.push({ tier: 'CALCULATED', text: `The listener is ${fmtLen(a.stereo.listenerRear, u, { small: true })} from the rear wall — inside the strongest pressure zone of the length modes and the rear reflection.` });
  if (a.stereo && Math.abs(a.stereo.heightDiff) > 0.25) out.push({ tier: 'CALCULATED', text: `Tweeters are ${fmtLen(Math.abs(a.stereo.heightDiff), u, { small: true })} ${a.stereo.heightDiff > 0 ? 'above' : 'below'} the ears — well off the design axis of most monitors.` });
  return out;
}
