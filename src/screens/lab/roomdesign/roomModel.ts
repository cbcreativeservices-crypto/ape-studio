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

/** A length for display: "3.66 m" / "66 cm", or "12′ 0″" / "6.5″".
 *  `small` prefers the small unit (cm / inches) — but only below 1 m, so a
 *  7.31 m wall never reads "731 cm" (cognitive review 12). Imperial rounds
 *  the inches FIRST and carries 12 → 1 ft, so "1′ 12″" and "12.0″" cannot
 *  appear (audio review 11). */
export function fmtLen(m: number, units: Units, opts: { small?: boolean } = {}): string {
  if (!Number.isFinite(m)) return '—';
  const sign = m < 0 ? '-' : '';
  const abs = Math.abs(m);
  if (units === 'metric') {
    if (abs < 1) return `${sign}${Math.round(abs * 100)} cm`;
    return `${sign}${abs.toFixed(2)} m`;
  }
  const inches = abs / IN;
  const tenths = Math.round(inches * 10) / 10;
  // Inches alone while they stay under a foot after rounding (or while the
  // caller prefers the small unit and the length is under a metre).
  if (tenths < 12 || (opts.small && abs < 1)) return `${sign}${tenths.toFixed(1)}″`;
  const whole = Math.round(inches);
  const ft = Math.floor(whole / 12);
  const rem = whole - ft * 12;
  return `${sign}${ft}′ ${rem}″`;
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
  carpet: { label: 'Carpet', short: 'CARPET', alpha: MATERIALS.carpet.alpha, blurb: 'Thin porous absorption — good above 500 Hz, useless for bass. A carpeted room can still boom.' },
  hardwood: { label: 'Hardwood', short: 'WOOD', alpha: MATERIALS.wood.alpha, blurb: 'Mostly reflective with a little low-end flex — the warm-sounding hard floor.' },
  concrete: { label: 'Concrete', short: 'CONCRETE', alpha: MATERIALS.concrete.alpha, blurb: 'Reflects almost everything at every frequency. Whatever hits it comes back.' },
  tile: { label: 'Tile', short: 'TILE', alpha: EXTRA_ALPHA.tile, blurb: 'As hard as concrete: a tiled floor reflects nearly everything. Add a rug under the desk and listener.' },
  drywall: { label: 'Drywall', short: 'DRYWALL', alpha: MATERIALS.drywall.alpha, blurb: 'A light wall that vibrates: absorbs some lows, reflects the mids and highs.' },
  glass: { label: 'Glass', short: 'GLASS', alpha: MATERIALS.glass.alpha, blurb: 'Hard for mids and highs; the pane flexes at low frequencies and eats a little bass. A window is also a weak point for isolation.' },
  curtain: { label: 'Curtains', short: 'CURTAIN', alpha: MATERIALS.curtain.alpha, blurb: 'Soft and porous: eats mids and highs, but the lows sail straight through the fabric.' },
  wood: { label: 'Wood panel', short: 'PANEL', alpha: MATERIALS.wood.alpha, blurb: 'Mostly reflective with a little low-end flex.' },
  acoustictile: { label: 'Acoustic ceiling tile', short: 'AC TILE', alpha: EXTRA_ALPHA.acoustictile, blurb: 'A drop ceiling of mineral-fibre tile: moderate broadband absorption, more than drywall, less than a thick cloud.' },
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

/** The baseline slot's name: "START" is where the positions began; Option A
 *  and B are the alternatives kept beside it (cognitive review 5 — "Current"
 *  read as both the slot and "what I am editing"). */
export const START_LAYOUT = 'Start';

export function defaultLayout(room: Room, name = START_LAYOUT): Layout {
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
    layouts: [defaultLayout(room, START_LAYOUT)],
    active: 0,
    treatment: [],
    measured: {},
    createdAt: now,
    updatedAt: now,
  };
}

/** A saved design read back from the device, made safe to LOAD and COMPARE
 *  (toddler pass 2026-10-01). The store keeps any record with a plan and a
 *  layout list, but a damaged or version-skewed record (no openings, a
 *  speaker list that is not a list, an unknown material) crashed analyze()
 *  the moment it was compared or loaded. Missing parts take the defaults,
 *  unusable entries are dropped, a record with no usable plan returns null.
 *  A healthy design comes back equal. */
export function repairDesign(raw: unknown): RoomDesign | null {
  if (!raw || typeof raw !== 'object') return null;
  const d = raw as Record<string, unknown>;
  const r = d.room as Record<string, unknown> | undefined;
  if (typeof d.id !== 'string' || !r || typeof r !== 'object' || !Array.isArray(r.vertices)) return null;
  const num = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);
  const obj = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object';
  const oneOf = <T extends string>(x: unknown, opts: readonly T[], dflt: T): T => ((opts as readonly unknown[]).includes(x) ? (x as T) : dflt);
  const vertices = (r.vertices as unknown[]).filter((p): p is Pt => obj(p) && num(p.x) && num(p.y)).map((p) => ({ x: p.x, y: p.y }));
  if (vertices.length !== (r.vertices as unknown[]).length || !polygonIsValidRoom(vertices)) return null;
  const base = defaultRoom();
  const surfaces = Object.keys(SURFACES) as SurfaceKey[];
  const height = num(r.height) ? Math.max(2, Math.min(6, r.height)) : base.height;
  const room: Room = {
    units: oneOf(r.units, ['metric', 'imperial'] as const, 'metric'),
    shape: oneOf(r.shape, ['rect', 'angled', 'irregular', 'curved'] as const, 'irregular'),
    vertices,
    ...(num(r.curvedWall) ? { curvedWall: r.curvedWall } : {}),
    height,
    ceiling: oneOf(r.ceiling, ['flat', 'sloped', 'vaulted', 'mixed'] as const, 'flat'),
    heightLow: num(r.heightLow) ? Math.max(Math.min(1.8, height - 0.1), Math.min(height - 0.1, r.heightLow)) : Math.min(base.heightLow, height - 0.1),
    floor: oneOf(r.floor, surfaces, base.floor),
    walls: oneOf(r.walls, surfaces, base.walls),
    ceilingMat: oneOf(r.ceilingMat, surfaces, base.ceilingMat),
    openings: (Array.isArray(r.openings) ? r.openings : []).filter(
      (o): o is Opening => obj(o) && typeof o.id === 'string' && ['door', 'window', 'opening'].includes(o.kind as string) && num(o.wall) && num(o.pos) && num(o.width) && num(o.height) && num(o.sill),
    ),
    features: (Array.isArray(r.features) ? r.features : []).filter(
      (f): f is Feature => obj(f) && typeof f.id === 'string' && ['desk', 'sofa', 'bookshelf', 'rack'].includes(f.kind as string) && num(f.x) && num(f.y) && num(f.w) && num(f.d) && num(f.h),
    ),
    tempC: num(r.tempC) ? r.tempC : base.tempC,
  };
  const roles = ['L', 'R', 'C', 'LS', 'RS', 'SUB'];
  const layouts: Layout[] = (Array.isArray(d.layouts) ? d.layouts : [])
    .filter((l): l is Record<string, unknown> => obj(l) && obj(l.listener) && num(l.listener.x) && num(l.listener.y) && num(l.listener.earZ))
    .map((l) => ({
      name: typeof l.name === 'string' ? l.name : START_LAYOUT,
      speakers: (Array.isArray(l.speakers) ? l.speakers : []).filter(
        (s): s is Speaker => obj(s) && roles.includes(s.role as string) && num(s.x) && num(s.y) && num(s.z) && num(s.toeDeg),
      ),
      listener: l.listener as Listener,
    }));
  if (layouts.length === 0) layouts.push(defaultLayout(room));
  const mon = obj(d.monitoring) ? d.monitoring : {};
  const meas = obj(d.measured) ? d.measured : {};
  const kinds = ['absorber', 'basstrap', 'cloud', 'diffuser', 'rug', 'gobo'];
  const treatment = (Array.isArray(d.treatment) ? d.treatment : []).filter(
    (t): t is Treatment =>
      obj(t) && typeof t.id === 'string' && kinds.includes(t.kind as string) && num(t.width) && num(t.height) && num(t.thickness) && num(t.z) && typeof t.enabled === 'boolean' && [t.wall, t.pos, t.x, t.y].every((k) => k == null || num(k)),
  );
  const repaired: RoomDesign = {
    id: d.id,
    name: typeof d.name === 'string' ? d.name : 'My room',
    room,
    monitoring: {
      config: oneOf(mon.config, ['stereo', 'stereo_sub', 'multichannel'] as const, 'stereo'),
      field: oneOf(mon.field, ['nearfield', 'midfield', 'other'] as const, 'nearfield'),
      model: typeof mon.model === 'string' ? mon.model.slice(0, 40) : '',
    },
    layouts,
    active: num(d.active) && Number.isInteger(d.active) && d.active >= 0 && d.active < layouts.length ? d.active : 0,
    treatment,
    measured: { ...(num(meas.rt60Mid) ? { rt60Mid: meas.rt60Mid } : {}), ...(num(meas.modeHz) ? { modeHz: meas.modeHz } : {}) },
    createdAt: num(d.createdAt) ? d.createdAt : 0,
    updatedAt: num(d.updatedAt) ? d.updatedAt : 0,
  };
  return keepDesignInside(repaired);
}

/** The saved design a SAVE will push out of a full library (the store keeps
 *  `max` and drops the oldest-updated first), or null. A 25th save used to
 *  remove the oldest design without a word while the lab said "Saved"
 *  (toddler pass 2026-10-01) — the save message now names it. */
export function evictedBySave(saved: readonly RoomDesign[], design: Pick<RoomDesign, 'id'>, max: number): RoomDesign | null {
  if (saved.length < max || saved.some((d) => d.id === design.id)) return null;
  return saved.reduce((o, d) => (d.updatedAt < o.updatedAt ? d : o), saved[0]);
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

/** The plan is a rectangle (axis-aligned, four right angles). */
export function planIsRectangular(room: Pick<Room, 'vertices' | 'shape' | 'curvedWall'>): boolean {
  if (room.shape === 'curved' || room.curvedWall != null) return false;
  const v = room.vertices;
  if (v.length !== 4) return false;
  const b = bounds(room);
  const tol = 1e-6;
  return v.every((p) => (Math.abs(p.x - b.minX) < tol || Math.abs(p.x - b.maxX) < tol) && (Math.abs(p.y - b.minY) < tol || Math.abs(p.y - b.maxY) < tol));
}

/** The ROOM is a rectangular box — a rectangular plan under a FLAT ceiling —
 *  the only shape whose modes the idealized equation describes. A sloped,
 *  vaulted or mixed ceiling takes the ESTIMATED path (mean ceiling height,
 *  less reliable) even over a rectangular plan (audio review 6). */
export function isRectangular(room: Pick<Room, 'vertices' | 'shape' | 'curvedWall' | 'ceiling'>): boolean {
  return planIsRectangular(room) && room.ceiling === 'flat';
}

/** The plan's size ceiling, metres (the lane's range; corners clamp to it). */
export const ROOM_MAX_M = 15;
/** Below this plan area a corner drag is refused (safety review 5). */
export const ROOM_MIN_AREA = 1;

/** Do segments a→b and c→d cross strictly inside both (shared endpoints and
 *  touching do not count)? */
function segmentsCross(a: Pt, b: Pt, c: Pt, d: Pt): boolean {
  const r = { x: b.x - a.x, y: b.y - a.y };
  const s = { x: d.x - c.x, y: d.y - c.y };
  const denom = r.x * s.y - r.y * s.x;
  if (Math.abs(denom) < 1e-12) return false;
  const qp = { x: c.x - a.x, y: c.y - a.y };
  const u = (qp.x * s.y - qp.y * s.x) / denom;
  const t = (qp.x * r.y - qp.y * r.x) / denom;
  const eps = 1e-9;
  return u > eps && u < 1 - eps && t > eps && t < 1 - eps;
}

/** A simple polygon: no two non-adjacent edges cross (no bow-tie). */
export function polygonIsSimple(v: Pt[]): boolean {
  const n = v.length;
  if (n < 3) return false;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (j === i + 1 || (i === 0 && j === n - 1)) continue; // adjacent edges share a vertex
      if (segmentsCross(v[i], v[(i + 1) % n], v[j], v[(j + 1) % n])) return false;
    }
  }
  return true;
}

/** Would this outline be accepted as a room? Simple, at least ROOM_MIN_AREA,
 *  every corner inside [0, ROOM_MAX_M]. */
export function polygonIsValidRoom(v: Pt[]): boolean {
  return polygonIsSimple(v) && polygonArea(v) >= ROOM_MIN_AREA && v.every((p) => p.x >= 0 && p.y >= 0 && p.x <= ROOM_MAX_M && p.y <= ROOM_MAX_M);
}

/** Scale the plan so its bounding box becomes (width, length), keeping shape.
 *  Features scale with it; the layouts are scaled by `resizeDesign`. */
export function resizeRoom(room: Room, width: number, length: number): Room {
  const b = bounds(room);
  const sx = b.width > 0 ? width / b.width : 1;
  const sy = b.length > 0 ? length / b.length : 1;
  const vertices = room.vertices.map((p) => ({ x: b.minX + (p.x - b.minX) * sx, y: b.minY + (p.y - b.minY) * sy }));
  const features = room.features.map((f) => ({ ...f, x: b.minX + (f.x - b.minX) * sx, y: b.minY + (f.y - b.minY) * sy }));
  return { ...room, vertices, features };
}

/** Resize the WHOLE design: the plan, the furniture, every layout's speakers
 *  and listener and the free-standing treatment scale by the same sx / sy,
 *  then everything is pushed back inside the polygon (cognitive review 1 —
 *  LENGTH 5 → 12.4 m used to leave the desk behind the listener). */
export function resizeDesign(d: RoomDesign, width: number, length: number): RoomDesign {
  const b = bounds(d.room);
  const sx = b.width > 0 ? width / b.width : 1;
  const sy = b.length > 0 ? length / b.length : 1;
  // The plan grows from its own corner — but never past ROOM_MAX_M (toddler
  // pass 2, 2026-10-01): with the left or front wall dragged in, WIDTH or
  // LENGTH at full scale put the far wall beyond 15 m. Every corner drag was
  // then refused (polygonIsValidRoom), and a SAVE of that room vanished from
  // SAVED DESIGNS (repairDesign drops a plan outside the range). The whole
  // design slides back toward the origin just enough to fit.
  const ox = Math.max(0, Math.min(b.minX, ROOM_MAX_M - width));
  const oy = Math.max(0, Math.min(b.minY, ROOM_MAX_M - length));
  const sc = (p: Pt): Pt => ({ x: ox + (p.x - b.minX) * sx, y: oy + (p.y - b.minY) * sy });
  const scaled = resizeRoom(d.room, width, length);
  const shift = (p: Pt): Pt => ({ x: p.x - b.minX + ox, y: p.y - b.minY + oy });
  const room = ox === b.minX && oy === b.minY ? scaled : { ...scaled, vertices: scaled.vertices.map(shift), features: scaled.features.map((f) => ({ ...f, ...shift(f) })) };
  const layouts = d.layouts.map((l) => ({
    ...l,
    speakers: l.speakers.map((s) => ({ ...s, ...sc(s) })),
    listener: { ...l.listener, ...sc(l.listener) },
  }));
  const treatment = d.treatment.map((t) => (t.x != null && t.y != null ? { ...t, ...sc({ x: t.x, y: t.y }) } : t));
  return keepDesignInside({ ...d, room, layouts, treatment });
}

/** The nearest point INSIDE the polygon to p: p itself when it is already
 *  inside, otherwise the closest point on the outline pushed `margin` in
 *  along the inward normal (the centroid when even that fails, e.g. a plan
 *  thinner than 2 × margin). */
export function pushInside(p: Pt, v: Pt[], margin = 0.15): Pt {
  if (v.length < 3) return p;
  if (pointInPolygon(p, v)) return p;
  let best: { d: number; q: Pt; i: number } | null = null;
  for (let i = 0; i < v.length; i++) {
    const e = distToEdge(p, v, i);
    const t = Math.max(0, Math.min(1, e.t));
    const q = edgePoint(v, i, t);
    const d = Math.hypot(p.x - q.x, p.y - q.y);
    if (!best || d < best.d) best = { d, q, i };
  }
  if (!best) return p;
  const a = v[best.i];
  const b = v[(best.i + 1) % v.length];
  const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  const n = { x: -(b.y - a.y) / len, y: (b.x - a.x) / len };
  for (const sgn of [1, -1]) {
    const c = { x: best.q.x + n.x * margin * sgn, y: best.q.y + n.y * margin * sgn };
    if (pointInPolygon(c, v)) return c;
  }
  let cx = 0;
  let cy = 0;
  for (const q of v) {
    cx += q.x;
    cy += q.y;
  }
  return { x: cx / v.length, y: cy / v.length };
}

/** Keep a speaker/listener inside the plan while it is dragged or ridden on
 *  a lane: clamp to the bounding box, then push a point outside the polygon
 *  to the nearest inside point (it slides along the wall rather than
 *  stopping dead). `prev` is the fallback for a degenerate plan. */
export function clampInside(p: Pt, room: Pick<Room, 'vertices'>, prev: Pt, margin = 0.15): Pt {
  const b = bounds(room);
  if (!(b.width > 2 * margin) || !(b.length > 2 * margin)) return prev;
  const c = {
    x: Math.max(b.minX + margin, Math.min(b.maxX - margin, p.x)),
    y: Math.max(b.minY + margin, Math.min(b.maxY - margin, p.y)),
  };
  const r = pushInside(c, room.vertices, margin);
  return Number.isFinite(r.x) && Number.isFinite(r.y) ? r : prev;
}

/** Every speaker and listener of every layout inside the polygon and under
 *  the ceiling; free-standing treatment likewise. Run after a corner drag, a
 *  SHAPE preset, a resize, a lane write and a configuration change. */
export function keepDesignInside(d: RoomDesign): RoomDesign {
  const room0 = d.room;
  const n = room0.vertices.length;
  const fix = (p: Pt) => clampInside(p, room0, p);
  // Wall and corner indices back onto the plan (toddler pass 2026-10-01):
  // SHAPE → RECTANGLE after IRREGULAR left a panel on "wall 6" of a
  // four-wall plan — the glyph read v[5].x (a TypeError, a red screen in
  // EXPLORE / TREATMENT / REVIEW) and an opening drawn on wall n % 4 was
  // dropped from the absorption sum. Wrapped the way the plan already draws
  // an opening, so the picture and the model agree.
  const wrap = (w: number) => (n > 0 ? ((Math.round(w) % n) + n) % n : 0);
  const openings = room0.openings.some((o) => o.wall !== wrap(o.wall)) ? room0.openings.map((o) => ({ ...o, wall: wrap(o.wall) })) : room0.openings;
  // Furniture too (toddler pass): a desk dragged off the glass landed outside
  // the walls, beyond the plan's frame, where no finger could reach it again.
  const features = room0.features.map((f) => {
    const q = fix(f);
    return q.x === f.x && q.y === f.y ? f : { ...f, x: q.x, y: q.y };
  });
  const room = openings === room0.openings && features.every((f, i) => f === room0.features[i]) ? room0 : { ...room0, openings, features };
  // Under the ceiling that is THERE (toddler pass): the old cap was
  // min(height, heightLow) everywhere — under a FLAT 2.5 m ceiling a 2.3 m
  // tweeter was pulled to 2.1 m by the unused low-point value, and a lane
  // could leave a tweeter above a vaulted ceiling's low front.
  const layouts = d.layouts.map((l) => ({
    ...l,
    speakers: l.speakers.map((s) => {
      const q = fix(s);
      return { ...s, ...q, z: Math.min(s.z, zCapAt(room, q.y)) };
    }),
    listener: (() => {
      const q = fix(l.listener);
      return { ...l.listener, ...q, earZ: Math.min(l.listener.earZ, zCapAt(room, q.y)) };
    })(),
  }));
  const treatment = d.treatment.map((t) => {
    let u = t;
    if (u.wall != null && u.wall !== wrap(u.wall)) u = { ...u, wall: wrap(u.wall) };
    if (u.x != null && u.y != null) u = { ...u, ...fix({ x: u.x, y: u.y }) };
    return u;
  });
  return { ...d, room, layouts, treatment };
}

/** The highest a speaker or the ears may go at a point along the room: the
 *  LOCAL ceiling less 10 cm (a sloped / vaulted / mixed ceiling is low at one
 *  end). Every height write — side-view drag, HEIGHT lane, a room edit —
 *  goes through this one cap. */
export function zCapAt(room: Room, y: number): number {
  return Math.max(0.2, ceilingHeightAt(room, y) - 0.1);
}

/** Every speaker and the ears of one layout under the LOCAL ceiling where
 *  they now stand. Run after any write that moves them ALONG the room — a
 *  plan drag, the FRONT and LISTENER lanes (toddler pass 2, 2026-10-01: pass
 *  1 capped the side drag, the HEIGHT lane and room edits, but a plan drag
 *  carried a 2.3 m tweeter from under a sloped ceiling's 2.5 m front to its
 *  2.2 m rear — above the drawn ceiling, its ceiling bounce gone from the
 *  model). A layout already under the ceiling comes back unchanged. */
export function capLayoutHeights(l: Layout, room: Room): Layout {
  let changed = false;
  const speakers = l.speakers.map((s) => {
    const cap = zCapAt(room, s.y);
    if (s.z <= cap) return s;
    changed = true;
    return { ...s, z: cap };
  });
  const earCap = zCapAt(room, l.listener.y);
  const listener = l.listener.earZ <= earCap ? l.listener : ((changed = true), { ...l.listener, earZ: earCap });
  return changed ? { ...l, speakers, listener } : l;
}

/** The centre height a ceiling cloud is DRAWN at: its own z, but hung under
 *  the LOCAL ceiling (toddler pass 2, 2026-10-01). A cloud is placed at the
 *  high point less 25 cm and keeps that z when dragged or when the ceiling
 *  changes, so under a sloped or vaulted ceiling — or after CEILING was
 *  lowered — the side view drew it floating above the ceiling line with its
 *  hangers running down to it. The model never reads a cloud's z (it covers
 *  the ceiling bounce by its plan footprint), so only the picture moves. */
export function cloudHangZ(room: Room, t: Pick<Treatment, 'y' | 'z' | 'thickness'>): number {
  const top = ceilingHeightAt(room, t.y ?? 0);
  return Math.max(0.2, Math.min(t.z, top - 0.1 - t.thickness / 2));
}

/** A TREATMENT drag to a point in metres: a wall panel slides along its
 *  wall, a bass trap snaps to the nearest corner, and a free-standing item
 *  (rug, cloud, gobo) stays inside the walls — it used to follow the finger
 *  off the plan and out of reach (toddler pass 2026-10-01). */
export function moveTreatment(t: Treatment, p: Pt, room: Pick<Room, 'vertices'>): Treatment {
  const v = room.vertices;
  if (t.kind === 'absorber' || t.kind === 'diffuser') {
    if (t.wall == null || v.length < 2) return t;
    const e = distToEdge(p, v, ((t.wall % v.length) + v.length) % v.length);
    return Number.isFinite(e.t) ? { ...t, pos: Math.max(0.05, Math.min(0.95, e.t)) } : t;
  }
  if (t.kind === 'basstrap') {
    let best = t.wall ?? 0;
    let bd = Infinity;
    v.forEach((q, i) => {
      const d = Math.hypot(q.x - p.x, q.y - p.y);
      if (d < bd) {
        bd = d;
        best = i;
      }
    });
    return { ...t, wall: best };
  }
  const q = clampInside(p, room, { x: t.x ?? p.x, y: t.y ?? p.y });
  return { ...t, x: q.x, y: q.y };
}

/** The first free slot for a new opening: the preferred wall first, then
 *  the others; positions 0.2 … 0.8; no overlap with an opening already on
 *  that wall and the width must fit the wall (cognitive review 9 — "+ WINDOW"
 *  used to land on the existing window). */
export function freeOpeningSlot(room: Pick<Room, 'vertices' | 'openings'>, preferredWall: number, width: number): { wall: number; pos: number } {
  const v = room.vertices;
  const n = v.length;
  const positions = [0.5, 0.3, 0.7, 0.2, 0.8, 0.4, 0.6];
  for (let k = 0; k < n; k++) {
    const wall = (preferredWall + k) % n;
    const len = edgeLength(v, wall);
    if (len < width + 0.2) continue;
    const here = room.openings.filter((o) => o.wall === wall);
    for (const pos of positions) {
      const lo = pos * len - width / 2;
      const hi = pos * len + width / 2;
      if (lo < 0.1 || hi > len - 0.1) continue;
      const clash = here.some((o) => Math.abs(o.pos * len - pos * len) < (o.width + width) / 2 + 0.1);
      if (!clash) return { wall, pos };
    }
  }
  return { wall: preferredWall % n, pos: 0.5 };
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

/** Every mode below `maxHz`, ascending. The index ceiling is PER AXIS,
 *  nMax = ceil(2·dim·maxHz / c), so the list is complete up to maxHz (audio
 *  review 9 — a flat order-4 cap lost modes above ~140 Hz). `maxOrder`, when
 *  given, caps every axis as well (the calculator-parity test). */
export function roomModes(c: number, L: number, W: number, H: number, maxOrder?: number, maxHz = 300): RoomMode[] {
  // The last answer is kept (toddler pass 2, 2026-10-01): a drag of a speaker
  // or the listener re-runs analyze() every frame with the room unchanged, and
  // a 15 × 15 × 6 m room lists ~4,300 modes — about 6 ms a call in an
  // interpreter (node --jitless), most of the analysis. Same inputs → the same
  // (read-only) list, which also keeps the plan's heat-map memo warm.
  const key = `${c}|${L}|${W}|${H}|${maxOrder}|${maxHz}`;
  if (modeCache && modeCache.key === key) return modeCache.modes;
  const modes = computeRoomModes(c, L, W, H, maxOrder, maxHz);
  modeCache = { key, modes };
  return modes;
}
let modeCache: { key: string; modes: RoomMode[] } | null = null;

function computeRoomModes(c: number, L: number, W: number, H: number, maxOrder: number | undefined, maxHz: number): RoomMode[] {
  const out: RoomMode[] = [];
  if (!(L > 0) || !(W > 0) || !(H > 0) || !(c > 0)) return out;
  const nMax = (dim: number) => {
    const n = Math.ceil((2 * dim * maxHz) / c);
    return Math.max(1, Math.min(maxOrder ?? 64, n));
  };
  const nxMax = nMax(L);
  const nyMax = nMax(W);
  const nzMax = nMax(H);
  for (let nx = 0; nx <= nxMax; nx++) {
    for (let ny = 0; ny <= nyMax; ny++) {
      for (let nz = 0; nz <= nzMax; nz++) {
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
 *  coincident modes pile up at one frequency. Restricted the way the
 *  calculator restricts it (audio review 10): at least one of the pair is
 *  AXIAL and both sit at or below `maxHz` (≈150 Hz) — above that the modes
 *  are dense everywhere and "near-coincident" would flag nearly all of them. */
export function coincidentModes(modes: RoomMode[], tol = 0.05, maxHz = 150): [RoomMode, RoomMode][] {
  const out: [RoomMode, RoomMode][] = [];
  const sorted = [...modes].sort((a, b) => a.f - b.f);
  for (let i = 1; i < sorted.length; i++) {
    const a = sorted[i - 1];
    const b = sorted[i];
    if (a.f <= 0 || b.f > maxHz) continue;
    if (a.kind !== 'axial' && b.kind !== 'axial') continue;
    if ((b.f - a.f) / a.f < tol) out.push([a, b]);
  }
  return out;
}

/** Schroeder frequency ≈ 2000·√(RT60/V): above it the room is dense enough
 *  to treat statistically; below it individual modes rule. */
export function schroederHz(rt60: number, volume: number): number {
  return volume > 0 && rt60 > 0 ? 2000 * Math.sqrt(rt60 / volume) : NaN;
}

/* ────────────────────────────── reflections ─────────────────────────────── */

export type ReflectionSurface = { kind: 'wall'; edge: number } | { kind: 'floor' } | { kind: 'ceiling' } | { kind: 'desk'; id: string };

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
  /** Rough mid-band level relative to the direct sound, dB: the distance
   *  ratio, the surface's broadband reflection loss and the speaker's
   *  directivity at the departure angle (D(θ) below). ESTIMATED. */
  levelDb: number;
  /** Departure angle off the speaker's aim, degrees (0 = straight ahead). */
  offAxisDeg: number;
  /** The surface this reflection meets is covered by an enabled treatment. */
  treatedBy?: string;
};

/** A simple mid-band directivity curve, dB against the angle off the
 *  speaker's aim (audio review 5): 0 to 30°, −3 at 60°, −6 at 90°, −12 at
 *  135°, −15 at 180°, piecewise-linear between. Speaker data replaces it. */
export function directivityDb(thetaDeg: number): number {
  const t = Math.max(0, Math.min(180, Math.abs(thetaDeg)));
  const pts: [number, number][] = [
    [0, 0],
    [30, 0],
    [60, -3],
    [90, -6],
    [135, -12],
    [180, -15],
  ];
  for (let i = 1; i < pts.length; i++) {
    const [a, da] = pts[i - 1];
    const [b, db] = pts[i];
    if (t <= b) return da + ((db - da) * (t - a)) / (b - a);
  }
  return -15;
}

/** The speaker's aim as a unit vector in the plan: straight ahead is +y
 *  (toward the listener) for L / R / C, −y for the surrounds; toe-in turns
 *  the left-hand speakers toward +x and the right-hand ones toward −x, i.e.
 *  toward the centre line. */
export function speakerAim(spk: Pick<Speaker, 'role' | 'toeDeg'>): Pt {
  const rad = (spk.toeDeg * Math.PI) / 180;
  const left = spk.role === 'L' || spk.role === 'LS';
  const right = spk.role === 'R' || spk.role === 'RS';
  const sx = left ? Math.sin(rad) : right ? -Math.sin(rad) : 0;
  const back = spk.role === 'LS' || spk.role === 'RS';
  return { x: sx, y: (back ? -1 : 1) * Math.cos(rad) };
}

/** Angle between the aim (horizontal) and a 3-D departure vector, degrees. */
export function offAxisDeg(spk: Pick<Speaker, 'role' | 'toeDeg'>, dx: number, dy: number, dz: number): number {
  const aim = speakerAim(spk);
  const len = Math.hypot(dx, dy, dz) || 1e-9;
  const cos = (aim.x * dx + aim.y * dy) / len;
  return (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI;
}

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

/** Does the plan segment a→b cross any wall edge other than `except`
 *  (strictly inside the segment)? A non-convex plan — the alcove — can put
 *  another wall in the way of an image path (audio review 18). */
function pathCrossesWall(a: Pt, b: Pt, v: Pt[], except: number): boolean {
  for (let j = 0; j < v.length; j++) {
    if (j === except) continue;
    const h = segmentHitsEdge(a, b, v, j);
    if (h && h.u > 1e-6 && h.u < 1 - 1e-6 && h.t > 1e-6 && h.t < 1 - 1e-6) return true;
  }
  return false;
}

/** First-order image-source reflections from one speaker to the listener:
 *  every wall edge whose image path crosses it (and no other wall), the
 *  floor, the ceiling and the desk top when the bounce lands on it.
 *  ESTIMATED: specular reflection off a flat surface; a curved section is
 *  treated as its chord. Level = distance ratio + surface loss + the
 *  directivity curve at the departure angle, relative to the direct sound. */
export function firstReflections(room: Room, spk: Speaker, lis: Listener, c: number, treatment: Treatment[] = []): Reflection[] {
  const v = room.vertices;
  const out: Reflection[] = [];
  const S = { x: spk.x, y: spk.y };
  const Lp = { x: lis.x, y: lis.y };
  const dh = Math.hypot(Lp.x - S.x, Lp.y - S.y);
  const dz = lis.earZ - spk.z;
  const directLen = Math.hypot(dh, dz);
  // The direct sound's own off-axis loss: the reflections are RELATIVE to it.
  const directDir = directivityDb(offAxisDeg(spk, Lp.x - S.x, Lp.y - S.y, dz));
  const level = (pathLen: number, alpha: number, depart: { dx: number; dy: number; dz: number }) => {
    const theta = offAxisDeg(spk, depart.dx, depart.dy, depart.dz);
    return {
      levelDb: 20 * Math.log10(directLen / pathLen) + 10 * Math.log10(Math.max(0.01, 1 - alpha)) + directivityDb(theta) - directDir,
      offAxisDeg: theta,
    };
  };
  for (let i = 0; i < v.length; i++) {
    const img = mirrorAcrossEdge(S, v, i);
    const hit = segmentHitsEdge(img, Lp, v, i);
    if (!hit) continue;
    // The leg to the wall and the leg from it must not pass through another wall.
    if (pathCrossesWall(S, hit.p, v, i) || pathCrossesWall(hit.p, Lp, v, i)) continue;
    const pathH = Math.hypot(Lp.x - img.x, Lp.y - img.y);
    const pathLen = Math.hypot(pathH, dz);
    // Height of the reflection point: the ray climbs linearly along the
    // image path, and the wall sits at fraction u of it from the image
    // (= from the speaker) — audio review 12.
    const z = spk.z + dz * hit.u;
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
      ...level(pathLen, alpha, { dx: hit.p.x - S.x, dy: hit.p.y - S.y, dz: z - spk.z }),
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
      ...level(pathLen, alpha, { dx: px - S.x, dy: py - S.y, dz: -spk.z }),
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
      ...level(pathLen, alpha, { dx: px - S.x, dy: py - S.y, dz: up }),
      treatedBy: cloud?.id,
    });
  }
  // The desk top (audio review 4): the strongest early reflection in most
  // nearfield setups. Image at 2·h − z (the floor split rule at the desk's
  // height); the bounce counts when it lands on the desk's footprint and
  // both the speaker and the ears are above the top. Wood, untreatable here.
  for (const f of room.features) {
    if (f.kind !== 'desk' || !(spk.z > f.h) || !(lis.earZ > f.h)) continue;
    const down = spk.z - f.h;
    const up = lis.earZ - f.h;
    const frac = down / (down + up);
    const px = S.x + (Lp.x - S.x) * frac;
    const py = S.y + (Lp.y - S.y) * frac;
    if (Math.abs(px - f.x) > f.w / 2 || Math.abs(py - f.y) > f.d / 2) continue;
    const pathLen = Math.hypot(dh, down + up);
    const alpha = broadbandAlpha('wood');
    out.push({
      speaker: spk.role,
      surface: { kind: 'desk', id: f.id },
      point: { x: px, y: py, z: f.h },
      pathLen,
      directLen,
      delayMs: ((pathLen - directLen) / c) * 1000,
      ...level(pathLen, alpha, { dx: px - S.x, dy: py - S.y, dz: -down }),
    });
  }
  return out.sort((a, b) => a.delayMs - b.delayMs);
}

/** A reflection's surface in words: "wall 2", "floor", "ceiling", "desk". */
export function reflectionSurfaceName(r: Pick<Reflection, 'surface'>): string {
  return r.surface.kind === 'wall' ? `wall ${r.surface.edge + 1}` : r.surface.kind;
}

/** A reflection's identity that survives a re-analysis: speaker + surface.
 *  The list is sorted by delay, so an INDEX names a different path as soon
 *  as a drag reorders it (toddler pass 2, 2026-10-01: EXPLORE's "Traced:"
 *  line and the pulse described another speaker's bounce after a drag). */
export function reflectionKey(r: Pick<Reflection, 'speaker' | 'surface'>): string {
  const s = r.surface;
  return `${r.speaker}:${s.kind === 'wall' ? `w${s.edge}` : s.kind === 'desk' ? `desk-${s.id}` : s.kind}`;
}

/** The reflection paths the plan DRAWS: every one in stereo; in multichannel
 *  the L and R paths plus the selected speaker's own (cognitive review 19).
 *  TRACE cycles through these only — it used to run a pulse along a
 *  surround's path the plan was not drawing. */
export function planReflections(reflections: Reflection[], speakers: Pick<Speaker, 'role'>[], selected?: string | null): Reflection[] {
  const multi = speakers.filter((s) => s.role !== 'SUB').length > 2;
  return multi ? reflections.filter((r) => r.speaker === 'L' || r.speaker === 'R' || r.speaker === selected) : reflections;
}

/** TRACE: the path after `current` (by key) in the drawn list, wrapping; the
 *  first one when `current` is gone or null; null when nothing is drawn. */
export function nextTraceKey(shown: Reflection[], current: string | null): string | null {
  if (shown.length === 0) return null;
  const i = current == null ? -1 : shown.findIndex((r) => reflectionKey(r) === current);
  return reflectionKey(shown[(i + 1) % shown.length]);
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

export type Sbir = {
  speaker: SpeakerRole;
  surface: string;
  /** Perpendicular distance from the woofer/baffle to the boundary, metres. */
  distance: number;
  /** Image-source path difference at the listening position, metres. */
  pathDiff: number;
  /** First cancellation at the listening position, Hz (higher nulls at odd multiples). */
  notchHz: number;
};

/** Notches above this are not shown: there the woofer stops radiating in
 *  every direction and the simple boundary picture no longer holds. */
export const SBIR_MAX_HZ = 300;

/** Speaker-boundary interference AT THE LISTENING POSITION: the first-order
 *  bounce from each nearby boundary arrives Δ = path − direct late and
 *  cancels where Δ is half a wavelength, f = c / (2·Δ) (audio review 2).
 *  c/(4d) is the special case on the wall's normal. Front wall, nearest side
 *  wall, floor and ceiling; capped at SBIR_MAX_HZ; never the sub (a floor
 *  sub gets boundary GAIN, not a notch — audio review 3). ESTIMATED, woofer
 *  band; the distance is from the woofer/baffle, not the cabinet's back. */
export function sbirNotches(room: Room, spk: Speaker, lis: Listener, c: number): Sbir[] {
  if (spk.role === 'SUB') return [];
  const v = room.vertices;
  const refl = firstReflections(room, spk, lis, c);
  const out: Sbir[] = [];
  const wallDist = (i: number) => distToEdge({ x: spk.x, y: spk.y }, v, i).dist;
  // Front wall (edge 0), the nearest other wall, floor, ceiling.
  const walls = refl.filter((r): r is Reflection & { surface: { kind: 'wall'; edge: number } } => r.surface.kind === 'wall');
  const front = walls.find((r) => r.surface.edge === 0);
  const side = walls.filter((r) => r.surface.edge !== 0).sort((a, b) => wallDist(a.surface.edge) - wallDist(b.surface.edge))[0];
  const push = (r: Reflection | undefined, surface: string, distance: number) => {
    if (!r) return;
    const d = r.pathLen - r.directLen;
    if (!(d > 0.01) || !(distance > 0.02)) return;
    const notchHz = c / (2 * d);
    if (notchHz > SBIR_MAX_HZ) return;
    out.push({ speaker: spk.role, surface, distance, pathDiff: d, notchHz });
  };
  push(front, 'front wall', front ? wallDist(0) : 0);
  push(side, side ? `wall ${side.surface.edge + 1}` : '', side ? wallDist(side.surface.edge) : 0);
  push(refl.find((r) => r.surface.kind === 'floor'), 'floor', spk.z);
  const ceil = refl.find((r) => r.surface.kind === 'ceiling');
  push(ceil, 'ceiling', ceil ? ceil.point.z - spk.z : 0);
  return out.sort((a, b) => a.notchHz - b.notchHz);
}

/** A subwoofer's boundary gain (audio review 3): every boundary within a
 *  quarter wavelength (λ/4 at ~190 Hz ≈ 0.45 m) adds about +6 dB below that
 *  frequency. Walls within reach and the floor. */
export function subBoundaries(room: Room, sub: Speaker, within = 0.45): { count: number; names: string[] } {
  const v = room.vertices;
  const names: string[] = [];
  for (let i = 0; i < v.length; i++) {
    const e = distToEdge({ x: sub.x, y: sub.y }, v, i);
    if (e.t >= -0.05 && e.t <= 1.05 && e.dist <= within) names.push(i === 0 ? 'front wall' : `wall ${i + 1}`);
  }
  if (sub.z <= within) names.push('floor');
  return { count: names.length, names };
}

/* ─────────────────────────── multichannel geometry ──────────────────────── */

export type ChannelGeometry = { role: SpeakerRole; angleDeg: number; side: 'L' | 'R' | 'C'; distance: number; flags: string[] };

/** ITU-R BS.775 placement check: each speaker's angle from the listener's
 *  forward direction (−y, toward the front wall) and its distance to the
 *  ears, with a flag for a surround outside 100–120°, a centre off 0° or a
 *  distance that differs from L by more than SYM_TOL (audio review 8). */
export function channelGeometry(lay: Layout): ChannelGeometry[] {
  const lis = lay.listener;
  const L = lay.speakers.find((s) => s.role === 'L');
  const refDist = L ? Math.hypot(L.x - lis.x, L.y - lis.y, L.z - lis.earZ) : NaN;
  return lay.speakers
    .filter((s) => s.role !== 'SUB')
    .map((s) => {
      const dx = s.x - lis.x;
      const dy = s.y - lis.y;
      // forward = (0, −1); the angle from it, unsigned, and which side.
      const dist2 = Math.hypot(dx, dy) || 1e-9;
      const angleDeg = (Math.acos(Math.max(-1, Math.min(1, -dy / dist2))) * 180) / Math.PI;
      const side: 'L' | 'R' | 'C' = Math.abs(dx) < 0.01 ? 'C' : dx < 0 ? 'L' : 'R';
      const distance = Math.hypot(dx, dy, s.z - lis.earZ);
      const flags: string[] = [];
      if ((s.role === 'LS' || s.role === 'RS') && (angleDeg < 100 || angleDeg > 120)) flags.push('outside 100–120°');
      if (s.role === 'C' && angleDeg > 5) flags.push('off the centre');
      if ((s.role === 'L' || s.role === 'R') && (angleDeg < 25 || angleDeg > 35)) flags.push('outside 25–35°');
      if (Number.isFinite(refDist) && s.role !== 'L' && Math.abs(distance - refDist) > SYM_TOL) flags.push(`${fmtLen(Math.abs(distance - refDist), 'metric', { small: true })} ${distance > refDist ? 'further' : 'nearer'} than L`);
      return { role: s.role, angleDeg, side, distance, flags };
    });
}

/** Where a surround belongs on the BS.775 circle: on the L/R radius at
 *  ±110°, behind the seat (y grows toward the rear wall), pushed inside the
 *  room when the circle leaves it. */
export function surroundPosition(room: Room, lay: Layout, role: 'LS' | 'RS'): Pt {
  const lis = lay.listener;
  const L = lay.speakers.find((s) => s.role === 'L');
  const R = lay.speakers.find((s) => s.role === 'R');
  const ref = L ?? R;
  const r = ref ? Math.hypot(ref.x - lis.x, ref.y - lis.y) : 1.6;
  const a = (110 * Math.PI) / 180;
  const p = { x: lis.x + (role === 'LS' ? -1 : 1) * r * Math.sin(a), y: lis.y - r * Math.cos(a) };
  return clampInside(p, room, { x: lis.x, y: lis.y });
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

/** A thick rug WITH underlay (audio review 17): more than bare carpet in the
 *  lows and mids, still nothing for the bass. Six bands. */
export const RUG_ALPHA = [0.14, 0.37, 0.6, 0.65, 0.7, 0.72];

/** Absorption of a treatment item at a band, from its kind and thickness.
 *  A porous panel absorbs the highs at any thickness and the lows only when it
 *  is thick: the low bands scale with (thickness ÷ 10 cm)^k and the PRODUCT
 *  is capped at 0.99 (audio review 1 — capping the multiplier froze every
 *  panel over 10 cm at the 10 cm value). 5 cm → α ≈ 0.11 / 0.30 / 0.69 at
 *  125 / 250 / 500 Hz; 10 cm → 0.29 / 0.60 / 0.98; 20 cm → 0.77 / 0.99 /
 *  0.99. Teaching model, ESTIMATED — a datasheet's ISO 354 numbers replace
 *  this in real planning. */
export function treatmentAlpha(t: Pick<Treatment, 'kind' | 'thickness'>, band: number): number {
  const b = Math.max(0, Math.min(5, band));
  const base = MATERIALS.fiberglass.alpha; // [0.29, 0.6, 0.98, 0.99, 0.99, 0.99] at ~10 cm
  const tcm = Math.max(1, t.thickness * 100);
  const cap = (x: number) => Math.min(0.99, x);
  const r = tcm / 10;
  switch (t.kind) {
    case 'absorber':
    case 'gobo':
      return [cap(base[0] * Math.pow(r, 1.4)), cap(base[1] * r), cap(base[2] * Math.pow(r, 0.5)), base[3], base[4], base[5]][b];
    case 'cloud':
      // Hung with an air gap: the gap adds to the effective depth down low.
      return [cap(base[0] * Math.pow(r, 1.4) * 1.4), cap(base[1] * r * 1.2), cap(base[2] * Math.pow(r, 0.5)), base[3], base[4], base[5]][b];
    case 'basstrap':
      // A corner trap works on the pressure maximum: strong down low for its depth.
      return [cap(0.55 * r), cap(0.8 * Math.pow(r, 0.6)), 0.95, 0.95, 0.9, 0.9][b];
    case 'diffuser':
      return [0.1, 0.15, 0.2, 0.2, 0.2, 0.2][b];
    case 'rug':
      return RUG_ALPHA[b];
  }
}

/** Where a porous depth (or a diffuser's well depth) stops working:
 *  ≈ c / (4 × depth) — the quarter-wavelength rule. */
export function depthLimitHz(depthM: number, c: number): number {
  return depthM > 0 ? c / (4 * depthM) : NaN;
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

  // Floor, minus rugs. Rugs (and clouds below) never count more area than
  // the floor (ceiling) has (toddler pass 2026-10-01): SIZE 2.4 m in a small
  // room summed a rug larger than the floor, and the RT60 came out short.
  const rugArea = live.filter((t) => t.kind === 'rug').reduce((s, t) => s + t.width * t.height, 0);
  const rugScale = rugArea > area && rugArea > 0 ? area / rugArea : 1;
  lines.push({ label: `Floor · ${SURFACES[room.floor].label}`, area: Math.max(0, area - rugArea * rugScale), alpha: alphaOf(room.floor), tier: 'ESTIMATED' });
  for (const t of live.filter((t) => t.kind === 'rug')) lines.push({ label: 'Thick rug with underlay', area: t.width * t.height * rugScale, alpha: treatAlpha(t), tier: 'ESTIMATED' });

  // Ceiling, minus clouds.
  const cloudArea = live.filter((t) => t.kind === 'cloud').reduce((s, t) => s + t.width * t.height, 0);
  const cloudScale = cloudArea > area && cloudArea > 0 ? area / cloudArea : 1;
  lines.push({ label: `Ceiling · ${SURFACES[room.ceilingMat].label}`, area: Math.max(0, area - cloudArea * cloudScale), alpha: alphaOf(room.ceilingMat), tier: 'ESTIMATED' });
  for (const t of live.filter((t) => t.kind === 'cloud')) lines.push({ label: 'Ceiling cloud', area: t.width * t.height * cloudScale, alpha: treatAlpha(t), tier: 'ESTIMATED' });

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

/** `check` = look at this; `try` = worth testing; `ok` = as it should be;
 *  `info` = normal, not a reason to move anything (an ⓘ row). */
export type SuggestionLevel = 'check' | 'try' | 'ok' | 'info';
export type Suggestion = { tier: Tier; level: SuggestionLevel; text: string };
export const SUGGESTION_ORDER: Record<SuggestionLevel, number> = { check: 0, try: 1, ok: 2, info: 3 };

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
  // The FIRST mode of each axis (L1, W1, H1) — one zone per axis, so a long
  // room never shows three length modes and no width or height one.
  const axial = (['L', 'W', 'H'] as const).map((axis) => modes.find((m) => m.kind === 'axial' && m.axis === axis)).filter((m): m is RoomMode => !!m);
  const lis = lay.listener;
  const listenerZones: ListenerModeZone[] = axial.map((mode) => {
    const p = modePressure(modalDims.L, modalDims.W, modalDims.H, mode, lis.y - b.minY, lis.x - b.minX, lis.earZ);
    return { mode, pressure: p, zone: p > 0.8 ? 'peak' : p < 0.2 ? 'null' : 'between' };
  });
  const reflections = lay.speakers.filter((s) => s.role !== 'SUB').flatMap((s) => firstReflections(room, s, lis, c, d.treatment));
  const sbir = lay.speakers.flatMap((s) => sbirNotches(room, s, lis, c));
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
    // The front-wall notch at the seat (image-source, audio review 2), merged
    // into one line when the two speakers stand at the same distance
    // (cognitive review 15). Measured from the woofer/baffle (audio 17).
    const frontNotch = (role: SpeakerRole) => a.sbir.find((n) => n.speaker === role && n.surface === 'front wall');
    const nL = frontNotch('L');
    const nR = frontNotch('R');
    const sbirText = (who: string, dist: number, hz: string) => `${who} ${len(dist)} from the front wall (measured to the woofer, not the back of the cabinet); the front-wall bounce estimates a first cancellation at the seat near ${hz}, in the bass. Either tight to the wall (under about 0.5 m — the notch moves up, where directivity and ordinary panels tame it) or well away (over about 2 m) is worth testing.`;
    const inBand = (w: { front: number }) => w.front > 0.4 && w.front < 1.4;
    if (inBand(s.wallL) && inBand(s.wallR) && Math.abs(s.wallL.front - s.wallR.front) < 0.05 && nL && nR) {
      out.push({ tier: 'ESTIMATED', level: 'try', text: sbirText('Both speakers are', s.wallL.front, Math.abs(nL.notchHz - nR.notchHz) < 1 ? fmtHz(nL.notchHz) : `${fmtHz(Math.min(nL.notchHz, nR.notchHz))}–${fmtHz(Math.max(nL.notchHz, nR.notchHz))}`) });
    } else {
      for (const side of [{ n: 'The left speaker is', w: s.wallL, notch: nL }, { n: 'The right speaker is', w: s.wallR, notch: nR }]) {
        if (inBand(side.w) && side.notch) out.push({ tier: 'ESTIMATED', level: 'try', text: sbirText(side.n, side.w.front, fmtHz(side.notch.notchHz)) });
      }
    }
  }
  // Modal zones at the seat, PER AXIS (audio review 7, safety review 1,
  // cognitive review 3): only the LENGTH axis asks for a move. On the centre
  // line the width null is the accepted trade; at seated ear height the
  // height null is normal. The map shows mode SHAPE, not what the speakers
  // excite.
  const onCentre = !s || Math.abs(s.axisOffset) < 0.1;
  const zoneTier: Tier = a.rectangular ? 'CALCULATED' : 'ESTIMATED';
  for (const z of a.listenerZones) {
    const name = `${z.mode.axis}-axis mode ${fmtHz(z.mode.f)}`;
    if (z.mode.axis === 'L') {
      if (z.zone === 'peak') out.push({ tier: zoneTier, level: 'check', text: `The listener sits at a pressure maximum of the ${name}: bass at that frequency will sound heavy there. Move fore/aft — try the seat at roughly 35–40 % of the room length and compare.` });
      if (z.zone === 'null') out.push({ tier: zoneTier, level: 'check', text: `The listener sits near a null of the ${name}: that frequency nearly disappears at the seat, and no EQ fixes a null. Move fore/aft — try the seat at roughly 35–40 % of the room length and compare.` });
    } else if (z.mode.axis === 'W') {
      if (z.zone === 'null' && onCentre) out.push({ tier: zoneTier, level: 'ok', text: `On the centre line you sit in the null of every odd width mode (here ${fmtHz(z.mode.f)}). That is true of every symmetrical room and is the accepted trade — a centred stereo pair barely drives those modes. Keep the symmetry; only the sub's position and the width-mode peaks at the side walls are worth working.` });
      else if (z.zone === 'null') out.push({ tier: zoneTier, level: 'info', text: `The seat sits near a null of the ${name} — expected near the centre line, where every odd width mode nulls. Keep left/right symmetry rather than chasing it.` });
      else if (z.zone === 'peak') out.push({ tier: zoneTier, level: 'try', text: `The listener sits near a pressure maximum of the ${name} — close to a side wall, where the width modes pile up. The centre line is the usual answer; compare.` });
    } else {
      if (z.zone === 'null') out.push({ tier: zoneTier, level: 'info', text: `Seated ears sit near the null of the first height mode (${fmtHz(z.mode.f)}) — ear height near mid-height does this in every room of this height. Normal, not a reason to move; raising or lowering the chair a few cm is the only lever.` });
      else if (z.zone === 'peak') out.push({ tier: zoneTier, level: 'try', text: `The ears sit near a pressure maximum of the ${name} — close to the floor or the ceiling. A few cm of chair height changes it; compare.` });
    }
  }
  out.push({ tier: 'ESTIMATED', level: 'info', text: 'The pressure map and the zones above show the SHAPE of each mode, not how strongly the speakers excite it — a symmetric pair on the centre line barely drives the odd width modes at all. Measure to know.' });
  if (!a.rectangular) {
    const planRect = planIsRectangular(d.room);
    out.push({
      tier: 'ESTIMATED',
      level: 'check',
      text: planRect
        ? `This room has a ${d.room.ceiling} ceiling, so the idealized mode equation does not strictly apply. The frequencies shown use the mean ceiling height (${len(a.modalDims.H)}) and are LESS reliable — treat them as a rough guide and measure.`
        : `This room is not a rectangle, so the idealized mode equation does not strictly apply. The frequencies shown use the bounding-box dimensions${d.room.ceiling === 'flat' ? '' : ' and the mean ceiling height'} and are LESS reliable — treat them as a rough guide and measure.`,
    });
  }
  if (a.coincident.length > 0) {
    const [m1, m2] = a.coincident[0];
    const dims = { L: a.modalDims.L, W: a.modalDims.W, H: a.modalDims.H };
    const word = { L: 'length', W: 'width', H: 'height' } as const;
    let why = 'Dimension ratios near 1:1 or 2:1 do this';
    if (Math.abs(m1.f - m2.f) < 0.1 && m1.axis && m2.axis && m1.axis !== m2.axis) {
      const big = dims[m1.axis] >= dims[m2.axis] ? m1.axis : m2.axis;
      const small = big === m1.axis ? m2.axis : m1.axis;
      const ratio = dims[big] / dims[small];
      why = `the ${len(dims[big])} ${word[big]} is ${Math.abs(ratio - Math.round(ratio)) < 0.02 ? `exactly ${Math.round(ratio)} ×` : `${ratio.toFixed(2)} ×`} the ${len(dims[small])} ${word[small]}`;
    }
    const where = Math.abs(m1.f - m2.f) < 0.1 ? `${m1.kind} (${m1.nx},${m1.ny},${m1.nz}) and ${m2.kind} (${m2.nx},${m2.ny},${m2.nz}) both land at ${fmtHz(m1.f)}` : `Two modes land together near ${fmtHz(m1.f)} and ${fmtHz(m2.f)}`;
    out.push({ tier: a.rectangular ? 'CALCULATED' : 'ESTIMATED', level: 'check', text: `${where} — a buildup at one frequency; ${why}. Nothing moves the walls, but bass trapping and position both change what you hear.` });
  }
  const live = d.treatment.filter((t) => t.enabled);
  const untreatedSide = a.reflections.filter((r) => r.surface.kind === 'wall' && !r.treatedBy && r.delayMs < 15 && r.levelDb > -12);
  if (untreatedSide.length > 0) {
    out.push({ tier: 'ESTIMATED', level: 'try', text: `${untreatedSide.length} early wall reflection${untreatedSide.length === 1 ? '' : 's'} within 15 ms of the direct sound reach the listener untreated. Test absorbers at the marked reflection points — the model places them where the speaker and listener positions put them.` });
  }
  const ceilingUntreated = a.reflections.some((r) => r.surface.kind === 'ceiling' && !r.treatedBy && r.delayMs < 15);
  if (ceilingUntreated) out.push({ tier: 'ESTIMATED', level: 'try', text: 'The ceiling reflection arrives within 15 ms untreated. A ceiling cloud over the listening position is the usual thing to test — mounted into structure with rated hardware, never into drywall alone.' });
  const deskBounce = a.reflections.find((r) => r.surface.kind === 'desk');
  if (deskBounce) out.push({ tier: 'ESTIMATED', level: 'try', text: `The desk top bounces the sound to the ears only +${deskBounce.delayMs.toFixed(1)} ms after the direct path — the strongest early reflection in most nearfield setups. Raising the monitors on stands behind the desk, or tilting them so the bounce misses the ears, is worth testing; a thin panel on the desk does little.` });
  const lowModes = a.modes.filter((m) => m.kind === 'axial' && m.f < 80).length;
  if (lowModes > 0 && !live.some((t) => t.kind === 'basstrap')) out.push({ tier: 'ESTIMATED', level: 'try', text: `There are ${lowModes} axial mode${lowModes === 1 ? '' : 's'} below 80 Hz and no bass traps. Corner traps act on the pressure maxima every mode shares — compare with and without.` });
  if (Number.isFinite(a.rt60Mid)) {
    if (a.rt60Mid > 0.5) out.push({ tier: 'ESTIMATED', level: 'try', text: `The mid-band RT60 estimate is ${a.rt60Mid.toFixed(2)} s — a lively room. Small mix rooms usually aim for roughly 0.2–0.4 s; broadband absorption brings it down. Sabine is an approximation in a small room, so measure before buying.` });
    else if (a.rt60Mid < 0.15) out.push({ tier: 'ESTIMATED', level: 'check', text: `The mid-band RT60 estimate is ${a.rt60Mid.toFixed(2)} s — very dead. A room this absorbent can be fatiguing and makes mixes sound dry elsewhere; keep some liveliness (diffusion rather than more absorption).` });
    else out.push({ tier: 'ESTIMATED', level: 'ok', text: `The mid-band RT60 estimate is ${a.rt60Mid.toFixed(2)} s, inside the range small mix rooms usually aim for.` });
  }
  // Bass/treble imbalance (safety review 3): thin material deadens the top
  // and leaves the boom.
  const imb = rtImbalance(a.rt60);
  if (imb && imb.ratio > 1.5 && Number.isFinite(a.rt60Mid) && a.rt60Mid <= 0.4) {
    out.push({ tier: 'ESTIMATED', level: 'check', text: `The bass decays about ${imb.ratio.toFixed(1)}× longer than the highs (125 Hz ${imb.low.toFixed(2)} s vs 2 kHz ${imb.high.toFixed(2)} s). Thin absorption has deadened the top while the boom is untouched — the usual sign of too much thin material. Add depth (corner traps, thicker panels), not more thin panels.` });
  }
  // "!" first, then "▸", then "✓", then ⓘ (cognitive review 16); the call
  // to measure always closes the list.
  out.sort((x, y) => SUGGESTION_ORDER[x.level] - SUGGESTION_ORDER[y.level]);
  out.push({ tier: 'MEASURED', level: 'try', text: 'Measure the real room — a sweep or a clap test with a measurement app or analyzer — and compare the modal frequencies and decay with this model. The model shows where problems are LIKELY; only a measurement shows what the room does.' });
  return out;
}

/** RT60 at 125 Hz against 2 kHz (Sabine): the bass/treble balance of the
 *  decay. Null when either band has no finite estimate. */
export function rtImbalance(rt60: Rt60Band[]): { low: number; high: number; ratio: number } | null {
  const low = rt60.find((r) => r.hz === 125)?.sabine ?? NaN;
  const high = rt60.find((r) => r.hz === 2000)?.sabine ?? NaN;
  if (!Number.isFinite(low) || !Number.isFinite(high) || high <= 0) return null;
  return { low, high, ratio: low / high };
}

/* ─────────────────────────── layout comparison ──────────────────────────── */

export type LayoutDiffLine = { tier: Tier; text: string };

/** What changed between two layouts of the same room, in plain words. */
export function diffLayouts(d: RoomDesign, fromIdx: number, toIdx: number, pre: { from?: Analysis; to?: Analysis } = {}): LayoutDiffLine[] {
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
  // A caller that already holds either analysis passes it in (EXPLORE: the
  // host's analysis IS layout `toIdx`; START's is memoised across a drag) —
  // two fresh analyses per render made three per drag frame (toddler pass 2).
  const a = pre.from ?? analyze(d, fromIdx);
  const b = pre.to ?? analyze(d, toIdx);
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

/** A treatment item sized and placed at a modelled reflection point; null
 *  for the desk bounce (nothing in the kit treats a desk top — move or tilt
 *  the monitors instead). */
export function treatmentAtReflection(r: Reflection, room: Room): Treatment | null {
  if (r.surface.kind === 'desk') return null;
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
  absorber: { label: 'Absorber panel', short: 'PANEL', blurb: 'A porous panel (mineral wool or fiberglass) at a first-reflection point. Thickness decides how low it works: 5 cm treats the highs, 10 cm reaches the mids, more reaches the bass — it works down to about c ÷ (4 × thickness). Open-cell foam is a serious fire load unless it carries a fire rating (Class A / UL 94) — mineral wool or fiberglass is the safer core.', safety: 'Use a fire-rated core and fabric. Hang on wall anchors rated for the weight; keep it clear of heaters, sockets, lights and the exit. Cut mineral wool or fibreglass with gloves, an FFP2/N95 mask and eye protection, outdoors or with ventilation, and wrap it fully in fabric so no fibre is exposed in the room.' },
  basstrap: { label: 'Bass trap', short: 'TRAP', blurb: 'A thick absorber across a corner, where every mode has a pressure maximum. Depth is what counts: a thin corner panel is not a bass trap.', safety: 'A full-height trap is heavy — fix it into studs or masonry with rated hardware, not into drywall alone, and never where it could fall on a seat. Cut mineral wool or fibreglass with gloves, an FFP2/N95 mask and eye protection, outdoors or with ventilation, and wrap it fully in fabric so no fibre is exposed in the room.' },
  cloud: { label: 'Ceiling cloud', short: 'CLOUD', blurb: 'An absorber hung below the ceiling over the listening position, treating the ceiling reflection; the air gap helps it absorb lower.', safety: 'Overhead loads must go into the structure (joists) with rated hangers and a safety cable. Never into drywall or a drop-ceiling grid alone, and never under or over a smoke detector, sprinkler head or light fitting.' },
  diffuser: { label: 'Diffuser', short: 'DIFF', blurb: 'Scatters a reflection instead of absorbing it — the energy is scattered, not absorbed — keeps the room alive while breaking up a strong rear-wall bounce. Diffuses down to about c ÷ (4 × well depth); needs a few metres of distance to work.', safety: 'Wood diffusers are heavy; mount into structure with rated hardware.' },
  rug: { label: 'Rug / floor', short: 'RUG', blurb: 'A thick rug with underlay between the speakers and the chair treats the floor reflection for the mids and highs; it does nothing for bass.', safety: 'Use a non-slip underlay so it is not a trip hazard, and keep it clear of cables and the door swing.' },
  gobo: { label: 'Freestanding panel', short: 'GOBO', blurb: 'A movable absorber on a stand — the flexible way to test a reflection point before drilling anything.', safety: 'A tall panel must have a wide, stable base; never block the exit or a ventilation grille. If it ends up fixed to a wall, check for pipes and wiring before drilling.' },
};

/* ─────────────────────────── measured comparison ────────────────────────── */

export type MeasuredCompare = { tier: 'MEASURED'; text: string }[];

/** The user's measured numbers against the model, plainly. */
export function compareMeasured(d: RoomDesign, a: Analysis): MeasuredCompare {
  const out: MeasuredCompare = [];
  const m = d.measured;
  if (m.rt60Mid != null && Number.isFinite(m.rt60Mid) && !measuredInRange('rt60Mid', m.rt60Mid)) {
    out.push({ tier: 'MEASURED', text: `Measured RT60 ${m.rt60Mid} s — ${MEASURED_OUT_OF_RANGE} (${MEASURED_RANGE.rt60Mid.min}–${MEASURED_RANGE.rt60Mid.max} s). Check the reading, or the units.` });
  } else if (m.rt60Mid != null && Number.isFinite(m.rt60Mid) && Number.isFinite(a.rt60Mid)) {
    const ratio = m.rt60Mid / a.rt60Mid;
    out.push({ tier: 'MEASURED', text: `Measured mid-band RT60 ${m.rt60Mid.toFixed(2)} s vs the Sabine estimate ${a.rt60Mid.toFixed(2)} s (${ratio > 1 ? 'the room is more live' : 'the room is deader'} than the model by ${Math.abs(ratio - 1) * 100 < 1 ? 'under 1' : (Math.abs(ratio - 1) * 100).toFixed(0)} %). A gap means the surfaces absorb differently from the teaching table — the measurement wins.` });
  }
  if (m.modeHz != null && Number.isFinite(m.modeHz) && !measuredInRange('modeHz', m.modeHz)) {
    out.push({ tier: 'MEASURED', text: `Resonance ${m.modeHz} Hz — ${MEASURED_OUT_OF_RANGE} (${MEASURED_RANGE.modeHz.min}–${MEASURED_RANGE.modeHz.max} Hz, where room modes live).` });
  } else if (m.modeHz != null && Number.isFinite(m.modeHz) && a.modes.length > 0) {
    const nearest = a.modes.reduce((best, mode) => (Math.abs(mode.f - m.modeHz!) < Math.abs(best.f - m.modeHz!) ? mode : best), a.modes[0]);
    const diff = m.modeHz - nearest.f;
    out.push({ tier: 'MEASURED', text: `Measured resonance ${fmtHz(m.modeHz)}: the nearest modelled mode is ${nearest.kind} (${nearest.nx},${nearest.ny},${nearest.nz}) at ${fmtHz(nearest.f)}, ${Math.abs(diff).toFixed(1)} Hz ${diff > 0 ? 'below' : 'above'} what you measured. ${Math.abs(diff) < 3 ? 'That is a close match for a simple model.' : 'A larger gap often means the real boundaries are not where the plan says (a soft wall, an alcove, furniture) or the room is not rectangular.'}` });
  }
  return out;
}

/** The ranges the measured-entry fields accept (safety review 14): a
 *  decay of 0.05–3 s, a resonance of 20–300 Hz. Outside them the model has
 *  nothing to compare with, and the lab says so instead of guessing. */
export const MEASURED_RANGE = { rt60Mid: { min: 0.05, max: 3 }, modeHz: { min: 20, max: 300 } } as const;

export function measuredInRange(key: keyof typeof MEASURED_RANGE, v: number): boolean {
  const r = MEASURED_RANGE[key];
  return Number.isFinite(v) && v >= r.min && v <= r.max;
}

export const MEASURED_OUT_OF_RANGE = 'that is outside the range this model covers';

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
  // Outside the outline (safety review 5, cognitive review 2): the drawing
  // shows it, but the green "no conflicts" line must never appear over it.
  if (!pointInPolygon(lis, v)) out.push({ tier: 'CALCULATED', text: 'The listening position is outside the room outline — drag it back inside the walls.' });
  for (const s of lay.speakers) {
    if (!pointInPolygon(s, v)) out.push({ tier: 'CALCULATED', text: `${s.role} speaker is outside the room outline — drag it back inside the walls.` });
    for (const f of d.room.features) {
      const inFootprint = Math.abs(s.x - f.x) <= f.w / 2 && Math.abs(s.y - f.y) <= f.d / 2;
      if (!inFootprint || s.role === 'SUB') continue;
      if (s.z > f.h && s.z - f.h < 0.6) {
        out.push({ tier: 'CALCULATED', text: `${s.role} speaker stands on the ${f.kind} (tweeter ${fmtLen(s.z - f.h, u, { small: true })} above its ${fmtLen(f.h, u)} top). The ${f.kind} top becomes a reflector — the model now draws that bounce; stands behind it, or isolation pads and a tilt, are worth testing.` });
      } else if (s.z <= f.h) {
        out.push({ tier: 'CALCULATED', text: `${s.role} speaker sits inside the ${f.kind}'s footprint BELOW its top (${fmtLen(f.h, u)}) — the drawing has it under the ${f.kind}. Raise it or move it.` });
      }
    }
    let nearest = Infinity;
    for (let i = 0; i < v.length; i++) {
      const e = distToEdge(s, v, i);
      if (e.t >= 0 && e.t <= 1) nearest = Math.min(nearest, e.dist);
    }
    if (s.role !== 'SUB' && nearest < 0.2) out.push({ tier: 'CALCULATED', text: `${s.role} speaker is ${fmtLen(nearest, u, { small: true })} from a wall — a rear port or the cabinet may touch it, and boundary gain lifts the bass. Leave the clearance the maker specifies behind a rear port, and use the monitor's wall/desk boundary switch if it has one.` });
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
