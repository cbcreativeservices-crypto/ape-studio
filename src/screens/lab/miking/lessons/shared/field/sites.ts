/**
 * FIELD SITES (Lab 6 group 2; field_ambience/GEOMETRY_PROPOSAL.md §2): the
 * illustrated real places the field lessons happen in, as DATA in frame G
 * (frameG.ts: the listening point at the origin, +x toward the scene, +z the
 * array's right, mm). Pure; tested. SiteArt.tsx draws them; the lessons'
 * models take their keep-outs and sound sources from here.
 *
 *   ambWoods    F06 natural: a woodland stream ahead, a walking path behind
 *               the listening point, trees with birds in the canopy
 *   plaza       F06 urban: a paved square, a building's facade behind (a
 *               reflector), a café's tables, a walkway across, the sidewalk
 *               and a two-lane road ahead (lanes, walking paths and access
 *               routes are keep-outs — the sidewalk preset lives here, at the
 *               plaza's street edge)
 *   woodEdge    F07: a woodland edge, one bird calling in a canopy 26 m away,
 *               its 25-yard setback ring; the trail behind the recordist
 *   meadow      F07: open grassland, a hedgerow, a flock crossing 28 m out
 *   bisonMeadow F07: a low-voiced animal 70 m across open ground
 *   route       F08: a closed, traffic-free paved path through a park, the
 *               walker's line 3 m from the listening point, cones at the
 *               approach, the closest point and the departure
 *   closedRoute F08 PAPER PLAN: a closed, permitted vehicle route 9 m away,
 *               its envelope, the crew's setback line and barrier
 *
 * EVERY size and position here is a DRAWING DEFAULT (no source gives a site);
 * the sourced numbers are the setback rings (NPS-WILD, US parks, via
 * safety.ts) and the 1.5 m mic height is a drawing default too (O-8 list).
 */
import type { Envelope, Provenance, Vec3 } from '../../../engine/model/types.ts';
import { SETBACK } from './safety.ts';

export type XZ = readonly [number, number];
export type GroundKind = 'forest' | 'meadow' | 'lawn' | 'paving' | 'asphalt';

export type SiteFeature =
  | { kind: 'ground'; ground: GroundKind; x0: number; x1: number; z0: number; z1: number }
  | { kind: 'tree'; c: XZ; canopy: number; h: number; trunk: number }
  | { kind: 'stream'; pts: readonly XZ[]; width: number }
  | { kind: 'path'; pts: readonly XZ[]; width: number; surface: 'gravel' | 'paved' }
  | { kind: 'road'; x0: number; x1: number; lanes: readonly (1 | -1)[] }
  | { kind: 'sidewalk'; x0: number; x1: number }
  | { kind: 'building'; x0: number; x1: number; z0: number; z1: number; h: number; door?: number }
  | { kind: 'cafe'; x0: number; x1: number; z0: number; z1: number; tables: readonly XZ[] }
  | { kind: 'hedge'; pts: readonly XZ[]; width: number; h: number }
  | { kind: 'bench'; c: XZ; len: number }
  | { kind: 'cone'; c: XZ }
  | { kind: 'barrier'; x: number; z0: number; z1: number }
  | { kind: 'person'; c: XZ; heading: number; role?: 'walker' | 'crew' | 'public' | 'recordist' }
  | { kind: 'car'; c: XZ; heading: number }
  | { kind: 'bus'; c: XZ; heading: number }
  | { kind: 'bird'; c: XZ; h: number; heading: number; calling?: boolean }
  | { kind: 'flock'; c: XZ; h: number; heading: number }
  | { kind: 'bison'; c: XZ; heading: number }
  | { kind: 'ring'; c: XZ; r: number };

export type SiteSource = { id: string; label: string; p: Vec3; kind: 'water' | 'bird' | 'leaves' | 'traffic' | 'voices' | 'steps' | 'animal' | 'reflection' };

export type FieldSite = {
  id: string;
  label: string;
  features: readonly SiteFeature[];
  sources: readonly SiteSource[];
  /** The keep-outs as engine envelopes (prisms in plan, ground to 3 m up). */
  keepOuts: readonly Envelope[];
  /** The site's plan extent (mm). */
  box: { x0: number; x1: number; z0: number; z1: number };
};

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const SITE = ill('a drawing default: the site is illustrated, not measured (field_ambience/GEOMETRY_PROPOSAL.md §2)');
/** How high a keep-out reaches (mm): a person's height and a stand's. */
const KEEP_H = 3000;

/** A band round a polyline (plan), as an extruded prism: half-width `hw`. */
export function bandPolygon(pts: readonly XZ[], hw: number): [number, number][] {
  const left: [number, number][] = [];
  const right: [number, number][] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b[0] - a[0];
    const dz = b[1] - a[1];
    const l = Math.hypot(dx, dz) || 1;
    const nx = -dz / l;
    const nz = dx / l;
    left.push([pts[i][0] + nx * hw, pts[i][1] + nz * hw]);
    right.push([pts[i][0] - nx * hw, pts[i][1] - nz * hw]);
  }
  return [...left, ...right.reverse()];
}

function bandKeepOut(id: string, label: string, pts: readonly XZ[], hw: number, variants?: string[]): Envelope {
  return { id, label, shape: { kind: 'prism', pts: bandPolygon(pts, hw), y0: -KEEP_H, y1: 0 }, prov: SITE, ...(variants ? { variants } : {}) };
}
function boxKeepOut(id: string, label: string, x0: number, x1: number, z0: number, z1: number, variants?: string[]): Envelope {
  return { id, label, shape: { kind: 'box', min: { x: x0, y: -KEEP_H, z: z0 }, max: { x: x1, y: 0, z: z1 } }, prov: SITE, ...(variants ? { variants } : {}) };
}
/** A setback ring as a keep-out: an upright cylinder round the animal. */
function ringKeepOut(id: string, label: string, c: XZ, r: number, prov: Provenance, variants?: string[]): Envelope {
  return { id, label, shape: { kind: 'cyl', a: { x: c[0], y: 0, z: c[1] }, b: { x: c[0], y: -12000, z: c[1] }, r }, prov, ...(variants ? { variants } : {}) };
}
const at = (c: XZ, h: number): Vec3 => ({ x: c[0], y: -h, z: c[1] });

/** The nearest point of a polyline to p, in plan (the stream's "nearest water"). */
export function nearestOnPolyline(pts: readonly XZ[], p: Vec3, h = 0): Vec3 {
  let best: { d: number; q: XZ } = { d: Infinity, q: pts[0] };
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const dx = b[0] - a[0];
    const dz = b[1] - a[1];
    const dd = dx * dx + dz * dz;
    const t = dd > 0 ? Math.max(0, Math.min(1, ((p.x - a[0]) * dx + (p.z - a[1]) * dz) / dd)) : 0;
    const q: XZ = [a[0] + dx * t, a[1] + dz * t];
    const d = Math.hypot(q[0] - p.x, q[1] - p.z);
    if (d < best.d) best = { d, q };
  }
  return { x: best.q[0], y: -h, z: best.q[1] };
}

/* ── F06 natural: a woodland stream ─────────────────────────────────── */

export const STREAM_PTS: readonly XZ[] = [
  [7800, -15000],
  [7000, -8000],
  [7700, 0],
  [8600, 6500],
  [8000, 15000],
];
export const STREAM_W = 2400;
/** The near bank in front of the listening point (x at z = 0). */
export const STREAM_BANK_X = 7700 - STREAM_W / 2;
export const WOODS_PATH: readonly XZ[] = [
  [-1600, -15000],
  [-1500, -5000],
  [-1700, 5000],
  [-1500, 15000],
];
export const WOODS_PATH_W = 1500;
export const WOODS_BIRDS = { a: { c: [12000, -5200] as XZ, h: 9000 }, b: { c: [14500, 6800] as XZ, h: 8000 } } as const;

export const AMB_WOODS: FieldSite = {
  id: 'ambWoods',
  label: 'a woodland stream',
  box: { x0: -9000, x1: 22000, z0: -15000, z1: 15000 },
  features: [
    { kind: 'ground', ground: 'forest', x0: -9000, x1: 22000, z0: -15000, z1: 15000 },
    { kind: 'stream', pts: STREAM_PTS, width: STREAM_W },
    { kind: 'path', pts: WOODS_PATH, width: WOODS_PATH_W, surface: 'gravel' },
    { kind: 'tree', c: [3800, -9500], canopy: 3200, h: 14000, trunk: 260 },
    { kind: 'tree', c: [12000, -5200], canopy: 3800, h: 16000, trunk: 320 },
    { kind: 'tree', c: [14500, 6800], canopy: 3500, h: 15000, trunk: 300 },
    { kind: 'tree', c: [3200, 9800], canopy: 3000, h: 13000, trunk: 240 },
    { kind: 'tree', c: [-5800, -8600], canopy: 3000, h: 13000, trunk: 250 },
    { kind: 'tree', c: [-5200, 8400], canopy: 3300, h: 14000, trunk: 270 },
    { kind: 'tree', c: [19200, -11500], canopy: 3600, h: 15000, trunk: 300 },
    { kind: 'tree', c: [19800, 1500], canopy: 3800, h: 16000, trunk: 320 },
    { kind: 'tree', c: [11000, 13000], canopy: 3000, h: 13000, trunk: 240 },
    { kind: 'tree', c: [-7800, 1200], canopy: 2400, h: 11000, trunk: 200 },
    { kind: 'bird', c: WOODS_BIRDS.a.c, h: WOODS_BIRDS.a.h, heading: 200, calling: true },
    { kind: 'bird', c: WOODS_BIRDS.b.c, h: WOODS_BIRDS.b.h, heading: 160, calling: true },
  ],
  sources: [
    { id: 'water', label: 'the stream', p: { x: STREAM_BANK_X + STREAM_W / 2, y: 0, z: 0 }, kind: 'water' },
    { id: 'birdA', label: 'a bird to the left', p: at(WOODS_BIRDS.a.c, WOODS_BIRDS.a.h), kind: 'bird' },
    { id: 'birdB', label: 'a bird to the right', p: at(WOODS_BIRDS.b.c, WOODS_BIRDS.b.h), kind: 'bird' },
    { id: 'leaves', label: 'leaves in the canopy', p: at([19800, 1500], 12000), kind: 'leaves' },
  ],
  keepOuts: [
    bandKeepOut('env.path', 'the walking path', WOODS_PATH, WOODS_PATH_W / 2 + 300),
    bandKeepOut('env.water', 'the stream and its bank', STREAM_PTS, STREAM_W / 2 + 400),
  ],
};

/* ── F06 urban: a city plaza by a road ──────────────────────────────── */

export const PLAZA_KERB_X = 9000;
export const PLAZA = {
  facadeX: -9000,
  sidewalk: { x0: 6000, x1: PLAZA_KERB_X },
  road: { x0: PLAZA_KERB_X, x1: 16000 },
  walkway: { x0: -9000, x1: 6000, z0: -5200, z1: -3400 },
  cafe: { x0: -3200, x1: 3600, z0: -13000, z1: -7600 },
} as const;

export const PLAZA_SITE: FieldSite = {
  id: 'plaza',
  label: 'a city plaza',
  box: { x0: -11000, x1: 19000, z0: -15000, z1: 15000 },
  features: [
    { kind: 'ground', ground: 'paving', x0: -11000, x1: PLAZA.sidewalk.x0, z0: -15000, z1: 15000 },
    { kind: 'building', x0: -14000, x1: PLAZA.facadeX, z0: -15000, z1: 15000, h: 12000, door: -4300 },
    { kind: 'sidewalk', x0: PLAZA.sidewalk.x0, x1: PLAZA.sidewalk.x1 },
    { kind: 'road', x0: PLAZA.road.x0, x1: PLAZA.road.x1, lanes: [1, -1] },
    { kind: 'sidewalk', x0: PLAZA.road.x1, x1: 19000 },
    { kind: 'path', pts: [[PLAZA.walkway.x0, (PLAZA.walkway.z0 + PLAZA.walkway.z1) / 2], [PLAZA.walkway.x1, (PLAZA.walkway.z0 + PLAZA.walkway.z1) / 2]], width: PLAZA.walkway.z1 - PLAZA.walkway.z0, surface: 'paved' },
    { kind: 'cafe', ...PLAZA.cafe, tables: [[-1800, -11800], [600, -12000], [2600, -11600], [-1200, -9200], [1500, -9000]] },
    { kind: 'tree', c: [-5200, 8600], canopy: 2300, h: 9000, trunk: 200 },
    { kind: 'tree', c: [2600, 9800], canopy: 2300, h: 9000, trunk: 200 },
    { kind: 'bench', c: [-4200, 4300], len: 1800 },
    { kind: 'person', c: [-1500, -11200], heading: 90, role: 'public' },
    { kind: 'person', c: [1900, -8600], heading: 180, role: 'public' },
    { kind: 'person', c: [-3000, -4300], heading: 0, role: 'public' },
    { kind: 'person', c: [7300, -6500], heading: 90, role: 'public' },
    { kind: 'person', c: [7700, 5200], heading: -90, role: 'public' },
    { kind: 'car', c: [10750, -7000], heading: 90 },
    { kind: 'car', c: [14250, 4200], heading: -90 },
    { kind: 'bus', c: [14250, -9500], heading: -90 },
  ],
  sources: [
    { id: 'trafficNear', label: 'the near lane’s traffic', p: { x: 10750, y: -600, z: 0 }, kind: 'traffic' },
    { id: 'trafficFar', label: 'the far lane’s traffic', p: { x: 14250, y: -600, z: 0 }, kind: 'traffic' },
    { id: 'voices', label: 'voices at the café', p: { x: 200, y: -1500, z: -10400 }, kind: 'voices' },
    { id: 'steps', label: 'steps on the walkway', p: { x: -1000, y: -200, z: -4300 }, kind: 'steps' },
    { id: 'facade', label: 'the facade behind', p: { x: PLAZA.facadeX, y: -3000, z: 0 }, kind: 'reflection' },
  ],
  keepOuts: [
    boxKeepOut('env.road', 'the road’s lanes', PLAZA.road.x0, PLAZA.road.x1, -15000, 15000),
    boxKeepOut('env.sidewalk', 'the sidewalk (a walking path)', PLAZA.sidewalk.x0, PLAZA.sidewalk.x1, -15000, 15000),
    boxKeepOut('env.walkway', 'the walkway to the building’s door (an access route)', PLAZA.walkway.x0, PLAZA.walkway.x1, PLAZA.walkway.z0, PLAZA.walkway.z1),
    boxKeepOut('env.cafe', 'the café’s tables', PLAZA.cafe.x0, PLAZA.cafe.x1, PLAZA.cafe.z0, PLAZA.cafe.z1),
  ],
};

/* ── F07: a bird at a woodland edge ──────────────────────────────────── */

const RING_PROV: Provenance = { kind: 'sourced', src: 'NPS-WILD', quote: '25 yards from most wildlife and 100 yards from predators like bears and wolves — a US national-park example; local rules first' };
export const EDGE_BIRD = { c: [26000, 0] as XZ, h: 9000 };
export const EDGE_TRAIL: readonly XZ[] = [
  [-3600, -26000],
  [-3400, -8000],
  [-3700, 8000],
  [-3500, 26000],
];

/** A brook behind the recordist: the background a position can move away from (drawing default). */
export const EDGE_BROOK: readonly XZ[] = [
  [-8200, -26000],
  [-7600, -9000],
  [-8300, 6000],
  [-7700, 26000],
];
export const WOOD_EDGE: FieldSite = {
  id: 'woodEdge',
  label: 'a woodland edge',
  box: { x0: -11000, x1: 50000, z0: -26000, z1: 26000 },
  features: [
    { kind: 'ground', ground: 'meadow', x0: -11000, x1: 20000, z0: -26000, z1: 26000 },
    { kind: 'stream', pts: EDGE_BROOK, width: 1600 },
    { kind: 'ground', ground: 'forest', x0: 20000, x1: 50000, z0: -26000, z1: 26000 },
    { kind: 'path', pts: EDGE_TRAIL, width: 1500, surface: 'gravel' },
    { kind: 'tree', c: [26000, 0], canopy: 4600, h: 17000, trunk: 380 },
    { kind: 'tree', c: [24000, -12500], canopy: 4200, h: 16000, trunk: 340 },
    { kind: 'tree', c: [25500, 13500], canopy: 4400, h: 16000, trunk: 340 },
    { kind: 'tree', c: [34000, -5500], canopy: 4800, h: 18000, trunk: 380 },
    { kind: 'tree', c: [35500, 8000], canopy: 4600, h: 17000, trunk: 360 },
    { kind: 'tree', c: [43000, -16000], canopy: 4800, h: 18000, trunk: 380 },
    { kind: 'tree', c: [44000, 17000], canopy: 4800, h: 18000, trunk: 380 },
    { kind: 'tree', c: [33000, 21000], canopy: 4200, h: 16000, trunk: 340 },
    { kind: 'tree', c: [33500, -22000], canopy: 4200, h: 16000, trunk: 340 },
    { kind: 'ring', c: EDGE_BIRD.c, r: SETBACK.most.mm },
    { kind: 'bird', c: EDGE_BIRD.c, h: EDGE_BIRD.h, heading: 180, calling: true },
  ],
  sources: [
    { id: 'bird', label: 'the bird in the canopy', p: at(EDGE_BIRD.c, EDGE_BIRD.h), kind: 'bird' },
    { id: 'brook', label: 'the brook behind you', p: { x: -7900, y: 0, z: 0 }, kind: 'water' },
  ],
  keepOuts: [
    ringKeepOut('env.ring', 'the bird’s setback ring (25 yd, about 23 m)', EDGE_BIRD.c, SETBACK.most.mm, RING_PROV, ['bird']),
    bandKeepOut('env.trail', 'the trail', EDGE_TRAIL, 1050, ['bird']),
    bandKeepOut('env.brook', 'the brook and its bank', EDGE_BROOK, 1200, ['bird']),
  ],
};

/* ── F07: a flock crossing a meadow ──────────────────────────────────── */

export const FLOCK_LINE = { x: 30000, z0: -30000, z1: 30000, h: 6000 };
export const MEADOW: FieldSite = {
  id: 'meadow',
  label: 'open grassland',
  box: { x0: -8000, x1: 44000, z0: -30000, z1: 30000 },
  features: [
    { kind: 'ground', ground: 'meadow', x0: -8000, x1: 44000, z0: -30000, z1: 30000 },
    { kind: 'hedge', pts: [[38000, -30000], [37200, -10000], [38400, 8000], [37600, 30000]], width: 2200, h: 2500 },
    { kind: 'path', pts: [[-3600, -30000], [-3500, 30000]], width: 1500, surface: 'gravel' },
    { kind: 'tree', c: [41000, -21000], canopy: 3800, h: 13000, trunk: 300 },
    { kind: 'tree', c: [40000, 19000], canopy: 3600, h: 12000, trunk: 280 },
    { kind: 'flock', c: [FLOCK_LINE.x, 0], h: FLOCK_LINE.h, heading: 90 },
  ],
  sources: [{ id: 'flock', label: 'the flock', p: { x: FLOCK_LINE.x, y: -FLOCK_LINE.h, z: 0 }, kind: 'bird' }],
  keepOuts: [bandKeepOut('env.trail', 'the trail', [[-3600, -30000], [-3500, 30000]], 1050, ['flock'])],
};

/* ── F07: a low-voiced animal across open ground ─────────────────────── */

export const BISON = { c: [70000, 0] as XZ };
export const BISON_MEADOW: FieldSite = {
  id: 'bisonMeadow',
  label: 'open ground, a large animal far off',
  box: { x0: -10000, x1: 100000, z0: -40000, z1: 40000 },
  features: [
    { kind: 'ground', ground: 'meadow', x0: -10000, x1: 100000, z0: -40000, z1: 40000 },
    { kind: 'path', pts: [[-4000, -40000], [-3800, 40000]], width: 1800, surface: 'gravel' },
    { kind: 'tree', c: [88000, -30000], canopy: 5000, h: 14000, trunk: 380 },
    { kind: 'tree', c: [92000, 26000], canopy: 5400, h: 15000, trunk: 400 },
    { kind: 'ring', c: BISON.c, r: SETBACK.most.mm },
    { kind: 'bison', c: BISON.c, heading: 200 },
  ],
  sources: [{ id: 'animal', label: 'the animal’s low call', p: at(BISON.c, 1500), kind: 'animal' }],
  keepOuts: [ringKeepOut('env.ring', 'the animal’s setback ring (25 yd, about 23 m)', BISON.c, SETBACK.most.mm, RING_PROV, ['distant'])],
};

/* ── F08: a traffic-free walking route, and the vehicle paper plan ──── */

export const ROUTE_X = 3000;
export const ROUTE_HALF = 15000;
/** The walker's sound, about hip height (a drawing default). */
export const WALK_SOURCE_H = 1000;
export const ROUTE_ENVELOPE = 1500;
export const ROUTE_SITE: FieldSite = {
  id: 'route',
  label: 'a park path closed to traffic',
  box: { x0: -7000, x1: 12000, z0: -17000, z1: 17000 },
  features: [
    { kind: 'ground', ground: 'lawn', x0: -7000, x1: 12000, z0: -17000, z1: 17000 },
    { kind: 'path', pts: [[ROUTE_X, -17000], [ROUTE_X, 17000]], width: 2000, surface: 'paved' },
    { kind: 'cone', c: [ROUTE_X - 1200, -12000] },
    { kind: 'cone', c: [ROUTE_X - 1200, 0] },
    { kind: 'cone', c: [ROUTE_X - 1200, 12000] },
    { kind: 'tree', c: [9000, -12500], canopy: 3000, h: 12000, trunk: 260 },
    { kind: 'tree', c: [9800, 6000], canopy: 3200, h: 13000, trunk: 280 },
    { kind: 'tree', c: [-5200, -11000], canopy: 2600, h: 11000, trunk: 220 },
    { kind: 'tree', c: [-5600, 12000], canopy: 2800, h: 11000, trunk: 240 },
    { kind: 'bench', c: [-4200, 3000], len: 1800 },
    { kind: 'person', c: [ROUTE_X, -9000], heading: 90, role: 'walker' },
  ],
  sources: [{ id: 'walker', label: 'the walker', p: { x: ROUTE_X, y: -WALK_SOURCE_H, z: 0 }, kind: 'steps' }],
  keepOuts: [boxKeepOut('env.path', 'the path and the walker’s envelope', ROUTE_X - ROUTE_ENVELOPE, ROUTE_X + ROUTE_ENVELOPE, -17000, 17000, ['walk'])],
};

export const VEH_X = 9000;
export const VEH_ENVELOPE = 3000;
/** The crew's setback line in the paper plan: x ≤ this (a drawing default). */
export const CREW_LINE_X = 4500;
export const CLOSED_ROUTE: FieldSite = {
  id: 'closedRoute',
  label: 'a closed, permitted vehicle route (a paper plan)',
  box: { x0: -7000, x1: 16000, z0: -24000, z1: 24000 },
  features: [
    { kind: 'ground', ground: 'lawn', x0: -7000, x1: 16000, z0: -24000, z1: 24000 },
    { kind: 'road', x0: VEH_X - 3000, x1: VEH_X + 3000, lanes: [1] },
    { kind: 'barrier', x: CREW_LINE_X, z0: -22000, z1: 22000 },
    { kind: 'car', c: [VEH_X, -14000], heading: 90 },
    { kind: 'person', c: [-1800, -2200], heading: 0, role: 'crew' },
    { kind: 'person', c: [-2600, 4200], heading: 0, role: 'crew' },
  ],
  sources: [{ id: 'vehicle', label: 'the vehicle', p: { x: VEH_X, y: -600, z: 0 }, kind: 'traffic' }],
  keepOuts: [
    boxKeepOut('env.route', 'the route and its envelope', VEH_X - VEH_ENVELOPE, VEH_X + VEH_ENVELOPE, -24000, 24000, ['vehicle']),
    boxKeepOut('env.crew', 'beyond the crew’s setback line', CREW_LINE_X, VEH_X - VEH_ENVELOPE, -24000, 24000, ['vehicle']),
  ],
};

export const FIELD_SITES = { ambWoods: AMB_WOODS, plaza: PLAZA_SITE, woodEdge: WOOD_EDGE, meadow: MEADOW, bisonMeadow: BISON_MEADOW, route: ROUTE_SITE, closedRoute: CLOSED_ROUTE } as const;
export type FieldSiteId = keyof typeof FIELD_SITES;

/** A site's keep-outs for one variant (the site's own envelopes, retagged). */
export function siteKeepOuts(site: FieldSite, variant: string): Envelope[] {
  return site.keepOuts.map((e) => ({ ...e, variants: [variant] }));
}
