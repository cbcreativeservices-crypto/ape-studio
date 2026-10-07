/**
 * THE STEREO-ARRAY TOOL — one model for every main pair and tree in Lab 5
 * (E04, E05, E06, E08, E11–E16). Pure; tested (test/mikingLab5Arrays.test.ts).
 * Research: docs/labs/miking/full_orchestra/SOURCES.md §A (the register),
 * GEOMETRY_PROPOSAL.md §2. Learner words carry no source names (owner ruling
 * 2026-10-04); every number keeps its `prov` here, internally.
 *
 * HOW A LESSON USES IT
 *   const caps = arrayCapsules('ortf', {}, { c: v3(0, -3200, 1400), face: 0, tilt: 30 });
 *   // → two cardioid capsules, 170 mm apart, 110° between their axes,
 *   //   aimed upstage and 30° down, in frame S (frameS.ts)
 *   ARRAYS.ortf.recordingAngle            // 95 (the angle the ensemble fills)
 *   dtLR(caps, someSource)                // ms, + = the right capsule hears it later
 *   treeSpacings(arrayCapsules('tree'))   // every pair ≥ 1.5 m (TREE_MIN_GAP)
 * Draw it with ArrayArt.tsx (<ArrayRig/>, <ArrayDetail/>); place it in a
 * lesson through ensembleModel.ts (a zone holds the array's centre).
 *
 * THE ARRAY FRAME: +u FORWARD (the way the array faces, in plan), +w to the
 * ARRAY's LEFT (the left channel's side, facing forward), +h UP. `face` is
 * the plan direction in degrees from upstage (frameS.planDir: 0 = facing
 * the ensemble from the podium); `tilt` turns every capsule's aim DOWN by
 * that many degrees (the bar itself stays level). The array's reference
 * point `c` is the centre of the pair's capsules (a tree: the middle of
 * its rear bar, between L and R).
 *
 * RULES
 *   • ORTF, NOS and DIN are LOCKED (their spacing and angle define them).
 *   • 3:1 never applies between the capsules of one array (lead ruling,
 *     lead_vocal/SOURCES.md §0.2): `threeToOne` is for separate mics.
 *   • The tree keeps every capsule pair ≥ 1.5 m apart (one maker's example);
 *     the compact tree is a practice variant that does not (logged, D-DT1).
 *   • No recording angle is invented: only ORTF has one (95°).
 */
import type { PatternId, Provenance, Vec3 } from '../../../engine/model/types.ts';
import { deltaTms } from '../../../engine/physics/twoMic.ts';
import { add, DEG, dist, mul, planDir, sub, unit, v3 } from './frameS.ts';

export type ArrayPresetId = 'xy' | 'ortf' | 'nos' | 'din' | 'ms' | 'ab' | 'tree' | 'treeCompact';
export const ARRAY_IDS: readonly ArrayPresetId[] = ['xy', 'ortf', 'nos', 'din', 'ms', 'ab', 'tree', 'treeCompact'];
export type ArrayFamily = 'coincident' | 'near' | 'spaced' | 'tree';
export type CapsuleId = 'L' | 'R' | 'C' | 'M' | 'S' | 'OL' | 'OR';
/** Where a capsule is routed: a side, both sides (the tree's centre), or the
 *  M/S matrix's Mid and Side inputs. */
export type Route = 'L' | 'R' | 'LR' | 'M' | 'S';

export type ArrayParams = {
  /** X/Y included angle (deg). */
  angle?: number;
  /** A/B spacing between the capsules (mm). */
  spacing?: number;
  /** A tree's outward turn of L and R (deg, 0–45). */
  turn?: number;
  /** M/S: the Side level against the Mid (dB) — the width set in the matrix. */
  sideDb?: number;
  /** A tree's centre feed into each side (dB, −5 to −4 in one maker's example). */
  centreDb?: number;
  /** Two omni OUTRIGGERS, one each side (a tree or a spaced pair). */
  outriggers?: boolean;
  /** Outriggers: their span (mm between them), their forward offset from the
   *  array's reference point (mm, along u) and their own downward tilt. */
  outSpan?: number;
  outU?: number;
  outTilt?: number;
};
export type ArrayPlacement = { c: Vec3; face?: number; tilt?: number };
export type Capsule = { id: CapsuleId; label: string; p: Vec3; dir: Vec3; pattern: PatternId; route: Route; levelDb: number };

type Range = { min: number; max: number; def: number };
export type ArrayDef = {
  id: ArrayPresetId;
  /** On screen (plain words, no source names). */
  name: string;
  short: string;
  family: ArrayFamily;
  locked: boolean;
  /** The capsules' pattern (the tree, A/B: omni; X/Y, ORTF: cardioid). */
  pattern: PatternId;
  spacing?: Range;
  angle?: Range;
  turn?: Range;
  /** The angle the ensemble should fill (deg), where one is given. */
  recordingAngle: number | null;
  /** What it is, in words. */
  what: string;
  /** What it tends to give (a tendency to check by ear). */
  tends: string;
  /** What to check before choosing it. */
  check: string;
  /** INTERNAL record (never shown). */
  prov: Provenance;
};

const src = (s: string, quote: string): Provenance => ({ kind: 'sourced', src: s, quote });

/** A/B: the orchestral example's usual range, and the spacing past which a
 *  hole opens in the middle of the image (DPA-AB-ORCH). */
export const AB_USUAL = { min: 400, max: 600 } as const;
export const AB_HOLE_FROM = 1000;
/** A wider school for ensembles on a live stage: 3–10 ft (S-LIVE), mm. */
export const AB_ENSEMBLE = { min: 914.4, max: 3048 } as const;
/** The tree (one maker's example, SCH-SURR p.12): 2 m wide, the centre mic
 *  1.5 m forward, no two capsules closer than 1.5 m, L/R turned out 0–45°. */
export const TREE = { width: 2000, forward: 1500, minGap: 1500, turnMax: 45 } as const;
export const TREE_MIN_GAP = TREE.minGap;
/** A compact tree from practice (PELLOWE: "2.5 feet back and 5 feet apart"). */
export const TREE_COMPACT = { width: 1524, forward: 762 } as const;
/** The centre's feed into each side in that example: −4 to −5 dB. */
export const TREE_CENTRE_DB = { min: -5, max: -4 } as const;
/** Outriggers from practice (PELLOWE; ARI-DECCA): about 20 ft (6.1 m)
 *  apart, about 5 ft (1.5 m) in front of the strings, the tree's height. No
 *  maker gives a dimension: a drawing default, labelled as practice. */
export const OUTRIGGERS = { span: 6096, front: 1524 } as const;
/** The main array's height over the podium (practice 3.2 m, inside the
 *  orchestral example's 3–4 m). */
export const MAIN_HEIGHT = { def: 3200, min: 3000, max: 4000 } as const;
/** Two pencil capsules stacked for a coincident pair (mm apart, vertical). */
const STACK = 26;

export const ARRAYS: Readonly<Record<ArrayPresetId, ArrayDef>> = {
  xy: {
    id: 'xy',
    name: 'Coincident pair (X/Y)',
    short: 'X/Y',
    family: 'coincident',
    locked: false,
    pattern: 'cardioid',
    angle: { min: 90, max: 135, def: 90 },
    recordingAngle: null,
    what: 'Two cardioids with their capsules together, one above the other, splayed 90° to start (try up to 135°).',
    tends: 'A compact, stable image and a dependable mono sum; it can sound less spacious than a well-chosen spaced pair.',
    check: 'Width, the tone of the players at the edges, and the room.',
    prov: src('DPA-STEREO', 'a pair of first-order cardioid microphones is arranged at a 90° angle (±45°); S-REC "90 - 135 degrees"'),
  },
  ortf: {
    id: 'ortf',
    name: 'Near-coincident pair (ORTF)',
    short: 'ORTF',
    family: 'near',
    locked: true,
    pattern: 'cardioid',
    recordingAngle: 95,
    what: 'Two cardioids 17 cm (6.7 in) apart, 110° between their axes — a fixed geometry: move the whole pair, never the spacing.',
    tends: 'Width from both time and level differences, with more rejection of the room behind than omnis.',
    check: 'The mono sum, the players at the edges, and whether the ensemble fills its 95° recording angle.',
    prov: src('SCH-MSTC74', 'arranged at a distance of 170 mm at an angle of 110° to each other, as required for the ORTF method; Recording angle 95°'),
  },
  nos: {
    id: 'nos',
    name: 'Near-coincident pair (30 cm, 90°)',
    short: '30 CM 90°',
    family: 'near',
    locked: true,
    pattern: 'cardioid',
    recordingAngle: null,
    what: 'Two cardioids 30 cm apart, 90° between their axes — a fixed geometry.',
    tends: 'A little wider than the 17 cm pair, with more time difference between the sides.',
    check: 'The mono sum and the centre.',
    prov: src('DPA-STEREO', 'NOS 30 cm / 90°'),
  },
  din: {
    id: 'din',
    name: 'Near-coincident pair (20 cm, 90°)',
    short: '20 CM 90°',
    family: 'near',
    locked: true,
    pattern: 'cardioid',
    recordingAngle: null,
    what: 'Two cardioids 20 cm apart, 90° between their axes — a fixed geometry.',
    tends: 'Between a coincident pair and the 17 cm pair in width.',
    check: 'The mono sum and the edges.',
    prov: src('DPA-STEREO', 'DIN 20 cm / 90°'),
  },
  ms: {
    id: 'ms',
    name: 'Mid-Side pair (M/S)',
    short: 'M/S',
    family: 'coincident',
    locked: false,
    pattern: 'cardioid',
    recordingAngle: null,
    what: 'A forward-facing cardioid (Mid) with a sideways figure-8 (Side) right above it. Left = Mid + Side, Right = Mid − Side.',
    tends: 'Width you can set after recording, in the matrix; summed to mono the Side cancels and the Mid remains.',
    check: 'The matrix, the Side’s polarity and orientation, and the room it hears behind.',
    prov: src('UA-MS', 'L = M + S, R = M − S; mono removes S'),
  },
  ab: {
    id: 'ab',
    name: 'Spaced pair (A/B)',
    short: 'A/B',
    family: 'spaced',
    locked: false,
    pattern: 'omni',
    spacing: { min: 400, max: 2500, def: 500 },
    recordingAngle: null,
    what: 'Two omnis side by side, 40–60 cm apart to start for an orchestra.',
    tends: 'A broad view of the ensemble and the hall; very wide spacing can open a hole in the middle.',
    check: 'The centre, the mono sum and the low end, at each spacing and height you try.',
    prov: src('DPA-AB-ORCH', 'Normally the spacing is adjusted between 40 and 60 cm; 1-2.5 meters → a hole will start to appear in the middle'),
  },
  tree: {
    id: 'tree',
    name: 'Three-omni tree',
    short: 'TREE',
    family: 'tree',
    locked: false,
    pattern: 'omni',
    turn: { min: 0, max: 45, def: 0 },
    recordingAngle: null,
    what: 'Three omnis in a triangle: left and right 2 m apart, the centre 1.5 m forward of them, no two closer than 1.5 m. The centre is fed to both sides a few dB down.',
    tends: 'A broad, stable picture with a filled-in centre; it needs room, a safe mount and careful centre balance.',
    check: 'The centre’s level (raise it from silence), the edges, and the mono sum.',
    prov: src('SCH-SURR', 'L–R "e.g. 2 meters", C forward "e.g. 1.5 meters", "not less than 1.5 meters", L/R turned 0–45°, centre "reduced 4 - 5 dB … mixed equally into the left and right channels"'),
  },
  treeCompact: {
    id: 'treeCompact',
    name: 'Compact three-omni tree',
    short: 'SMALL TREE',
    family: 'tree',
    locked: false,
    pattern: 'omni',
    turn: { min: 0, max: 45, def: 0 },
    recordingAngle: null,
    what: 'A smaller tree some engineers have used: left and right about 1.5 m apart, the centre about 0.75 m ahead — closer together than the wider tree’s 1.5 m.',
    tends: 'Less spread between the three omnis: a narrower, more centred picture than the wider tree.',
    check: 'The same as the wider tree: centre level, edges, mono.',
    prov: src('PELLOWE', 'maybe 2.5 feet back and 5 feet apart you would have 2 more (Decca practice, 1997 interview)'),
  },
};

/** The plan direction of an array facing `faceDeg`, its left, and a capsule
 *  aim turned `phi` toward the left and tilted `tilt` down. */
function frameOf(faceDeg: number) {
  const f = planDir(faceDeg);
  const left = v3(-Math.cos(faceDeg * DEG), 0, -Math.sin(faceDeg * DEG));
  return { f, left };
}
/** A capsule's aim: `phi` toward the array's left in the array's own plane,
 *  the whole plane pitched `tilt` down about the bar (the left axis) — so the
 *  angle between two capsules is kept whatever the tilt (110° stays 110°). */
function aim(faceDeg: number, phi: number, tilt: number): Vec3 {
  const { f, left } = frameOf(faceDeg);
  const fwd = add(mul(f, Math.cos(tilt * DEG)), v3(0, Math.sin(tilt * DEG), 0));
  return unit(add(mul(fwd, Math.cos(phi * DEG)), mul(left, Math.sin(phi * DEG))));
}
/** A point in the array frame (u forward, w left, h up) in frame S. */
export function arrayPoint(place: ArrayPlacement, u: number, w: number, h = 0): Vec3 {
  const { f, left } = frameOf(place.face ?? 0);
  return add(add(add(place.c, mul(f, u)), mul(left, w)), v3(0, -h, 0));
}

const clampR = (r: Range | undefined, v: number | undefined) => (r ? Math.max(r.min, Math.min(r.max, v ?? r.def)) : 0);

/** The capsules of an array, in frame S. */
export function arrayCapsules(id: ArrayPresetId, params: ArrayParams = {}, place: ArrayPlacement = { c: v3(0, -MAIN_HEIGHT.def, 0) }): Capsule[] {
  const def = ARRAYS[id];
  const face = place.face ?? 0;
  const tilt = place.tilt ?? 0;
  const cap = (cid: CapsuleId, label: string, u: number, w: number, h: number, phi: number, pattern: PatternId, route: Route, levelDb = 0, ownTilt = tilt): Capsule => ({ id: cid, label, p: arrayPoint(place, u, w, h), dir: aim(face, phi, ownTilt), pattern, route, levelDb });
  const out: Capsule[] = [];
  switch (id) {
    case 'xy': {
      const a = clampR(def.angle, params.angle);
      out.push(cap('L', 'LEFT', 0, 0, STACK / 2, a / 2, 'cardioid', 'L'), cap('R', 'RIGHT', 0, 0, -STACK / 2, -a / 2, 'cardioid', 'R'));
      break;
    }
    case 'ortf':
    case 'nos':
    case 'din': {
      const [s, a] = id === 'ortf' ? [170, 110] : id === 'nos' ? [300, 90] : [200, 90];
      out.push(cap('L', 'LEFT', 0, s / 2, 0, a / 2, 'cardioid', 'L'), cap('R', 'RIGHT', 0, -s / 2, 0, -a / 2, 'cardioid', 'R'));
      break;
    }
    case 'ms': {
      const sDb = params.sideDb ?? 0;
      out.push(cap('M', 'MID', 0, 0, STACK / 2, 0, 'cardioid', 'M'), { ...cap('S', 'SIDE', 0, 0, -STACK / 2, 90, 'figure8', 'S', sDb), dir: aim(face, 90, 0) });
      break;
    }
    case 'ab': {
      const s = clampR(def.spacing, params.spacing);
      out.push(cap('L', 'LEFT', 0, s / 2, 0, 0, 'omni', 'L'), cap('R', 'RIGHT', 0, -s / 2, 0, 0, 'omni', 'R'));
      break;
    }
    case 'tree':
    case 'treeCompact': {
      const g = id === 'tree' ? TREE : TREE_COMPACT;
      const b = clampR(def.turn, params.turn);
      const cDb = Math.max(TREE_CENTRE_DB.min, Math.min(TREE_CENTRE_DB.max, params.centreDb ?? -4.5));
      out.push(cap('L', 'LEFT', 0, g.width / 2, 0, b, 'omni', 'L'), cap('R', 'RIGHT', 0, -g.width / 2, 0, -b, 'omni', 'R'), cap('C', 'CENTRE', g.forward, 0, 0, 0, 'omni', 'LR', cDb));
      break;
    }
  }
  if (params.outriggers && (def.family === 'tree' || def.family === 'spaced')) {
    const span = params.outSpan ?? OUTRIGGERS.span;
    const u = params.outU ?? 0;
    const t = params.outTilt ?? 35;
    out.push(cap('OL', 'OUTRIGGER L', u, span / 2, 0, 0, 'omni', 'L', 0, t), cap('OR', 'OUTRIGGER R', u, -span / 2, 0, 0, 'omni', 'R', 0, t));
  }
  return out;
}

const byId = (caps: readonly Capsule[], id: CapsuleId) => caps.find((c) => c.id === id);

/** The distance between the left and right capsules (mm); a coincident
 *  pair's capsules are stacked, so this is their vertical gap. */
export function pairSpacing(caps: readonly Capsule[]): number {
  const L = byId(caps, 'L') ?? byId(caps, 'M');
  const R = byId(caps, 'R') ?? byId(caps, 'S');
  return L && R ? dist(L.p, R.p) : 0;
}
/** The angle between the left and right capsules' axes (deg). */
export function includedAngle(caps: readonly Capsule[]): number {
  const L = byId(caps, 'L');
  const R = byId(caps, 'R');
  if (!L || !R) return 0;
  const c = L.dir.x * R.dir.x + L.dir.y * R.dir.y + L.dir.z * R.dir.z;
  return Math.acos(Math.max(-1, Math.min(1, c))) / DEG;
}
/** The plan angle between the axes (the splay as drawn from above). */
export function planAngle(caps: readonly Capsule[]): number {
  const L = byId(caps, 'L');
  const R = byId(caps, 'R');
  if (!L || !R) return 0;
  const a = Math.atan2(L.dir.x, -L.dir.z);
  const b = Math.atan2(R.dir.x, -R.dir.z);
  let d = Math.abs(a - b) / DEG;
  if (d > 180) d = 360 - d;
  return d;
}

/** Arrival time at each capsule from a source (ms, speed of sound from the
 *  calculator at 20 °C), and each one's lead/lag on the first to hear it. */
export function arrivals(caps: readonly Capsule[], srcP: Vec3): { id: CapsuleId; ms: number; late: number }[] {
  const t = caps.map((c) => ({ id: c.id, ms: deltaTms(dist(c.p, srcP)) }));
  const first = Math.min(...t.map((q) => q.ms));
  return t.map((q) => ({ ...q, late: q.ms - first }));
}
/** Δt right − left for a source (ms): + means the RIGHT capsule hears it later. */
export function dtLR(caps: readonly Capsule[], srcP: Vec3): number {
  const L = byId(caps, 'L') ?? byId(caps, 'M');
  const R = byId(caps, 'R') ?? byId(caps, 'S');
  if (!L || !R) return 0;
  return deltaTms(dist(R.p, srcP) - dist(L.p, srcP));
}
/** The largest left–right time difference over a set of sources (ms): how
 *  much timing the pair adds across the ensemble's width. */
export function dtSpread(caps: readonly Capsule[], sources: readonly Vec3[]): number {
  return sources.reduce((m, s) => Math.max(m, Math.abs(dtLR(caps, s))), 0);
}

/** A tree's capsule spacings (mm) and whether every pair keeps the 1.5 m gap. */
export function treeSpacings(caps: readonly Capsule[]): { LR: number; LC: number; RC: number; min: number; ok: boolean } {
  const L = byId(caps, 'L')!;
  const R = byId(caps, 'R')!;
  const C = byId(caps, 'C')!;
  const LR = dist(L.p, R.p);
  const LC = dist(L.p, C.p);
  const RC = dist(R.p, C.p);
  const min = Math.min(LR, LC, RC);
  return { LR, LC, RC, min, ok: min >= TREE_MIN_GAP - 0.5 };
}

/** Is a source inside the array's recording angle (seen from above)? Null
 *  where the preset gives none (only ORTF's 95° is drawn and read). */
export function insideRecordingAngle(id: ArrayPresetId, place: ArrayPlacement, srcP: Vec3): boolean | null {
  const ra = ARRAYS[id].recordingAngle;
  if (ra == null) return null;
  const f = planDir(place.face ?? 0);
  const d = sub(srcP, place.c);
  const ang = Math.abs(Math.atan2(d.x * f.z - d.z * f.x, d.x * f.x + d.z * f.z)) / DEG;
  return ang <= ra / 2 + 1e-9;
}

/** The level difference (dB) between a near and a far source at the array —
 *  free field, inverse square, calculated from the drawing (a FRONT-ROW BIAS
 *  readout: how much louder the nearest players arrive than the farthest). */
export function frontBackDb(c: Vec3, near: Vec3, far: Vec3): number {
  return 20 * Math.log10(Math.max(1, dist(c, far)) / Math.max(1, dist(c, near)));
}

/** 3:1 between SEPARATE mics (lead ruling, lead_vocal/SOURCES.md §0.2):
 *  mic-to-mic ≥ 3 × the larger mic-to-source distance. Never inside one array. */
export function threeToOne(micA: Vec3, srcA: Vec3, micB: Vec3, srcB: Vec3): { ratio: number; ok: boolean } {
  const r = Math.max(dist(micA, srcA), dist(micB, srcB));
  const ratio = dist(micA, micB) / Math.max(1, r);
  return { ratio, ok: ratio >= 3 };
}

/** A support or spot mic's path difference to the main array for one source
 *  (mm and ms): the spot hears it first; the main later by Δt. */
export function spotLead(mainC: Vec3, spot: Vec3, srcP: Vec3): { dMm: number; ms: number } {
  const dMm = dist(mainC, srcP) - dist(spot, srcP);
  return { dMm, ms: deltaTms(dMm) };
}
/** Above this main-to-support distance a delay is worth considering (DPA-MULTI: "larger than 4 meters"). */
export const SUPPORT_DELAY_FROM = 4000;
