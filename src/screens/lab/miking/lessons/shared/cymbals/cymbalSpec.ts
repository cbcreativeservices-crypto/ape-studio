/**
 * THE SHARED CYMBAL FAMILY — the technical truth (charter §2 layer 1) for
 * every cymbal Lab 1 draws: the 14 in hi-hat pair (its clutch, pull rod,
 * stand and pedal), the 16 and 18 in crashes, the 20 in ride, each on its
 * stand with felts, sleeve, wing nut and tilter, and the swing envelope a mic
 * keeps clear of. Pure (no React Native): the tests and every lesson's
 * geometry read it directly; CymbalArt.tsx draws from it.
 *
 * SIZES are sourced (kit/SOURCES.md §a: a maker's four-piece pack — 14 in
 * hi-hats, 16 and 18 in crashes, 20 in ride). Every other number is a
 * DRAWING DEFAULT (`placeholder: true`; kit/GEOMETRY_PROPOSAL.md §3 for the
 * profile, the bell, the swing and the hi-hat's air-burst ring; the hardware
 * sizes are this family's own drawing defaults, listed in
 * CYMBAL_DRAWING_DEFAULTS) — drawn, never a readout reference. The open
 * hi-hat gap is a TRIAL reading (12.7 mm, kit/SOURCES.md §a).
 *
 * FRAME of one cymbal: origin = the centre of its EDGE PLANE (the plane the
 * rim lies in); TILT (deg) turns it about +z so its top face looks toward
 * the drummer (−x), the drum family's convention (drums/drumSpec.ts):
 *     n  = (−sin t, −cos t, 0)   the top face's normal (up, toward the player)
 *     e1 = ( cos t, −sin t, 0)   in the plane, toward the audience
 *     e2 = (0, 0, 1)             in the plane, the drummer's right
 * A point at radius r, plan angle θ (from e1 toward e2) and height h above
 * the edge plane is  P = c + r(cos θ e1 + sin θ e2) + h n.
 * Kit frame: kit/GEOMETRY_PROPOSAL.md §1 (origin the kick's batter centre,
 * +x audience, +y down, +z the drummer's right; floor y = 290.4).
 */
import type { Dim, Provenance, Shape3, Vec3 } from '../../../engine/model/types.ts';
import { CYMBAL_PROFILE, KIT_CYMBALS, KIT_FLOOR_Y, type KitCymbalId } from '../kitPlanModel.ts';

const IN = 25.4;
const DEG = Math.PI / 180;
const src = (s: string, quote: string): Provenance => ({ kind: 'sourced', src: s, quote });
const trial = (s: string, note: string): Provenance => ({ kind: 'trial', src: s, note });
const unk = (needed: string): Provenance => ({ kind: 'unknown', needed });
/** A drawing default: the picture needs a number no source gives. */
const dd = (mm: number, needed: string): Dim => ({ mm, prov: unk(needed), placeholder: true });

export type CymbalKind = 'hihat' | 'crash' | 'ride';

export type CymbalSpec = {
  id: string;
  kind: CymbalKind;
  /** What the learner reads ("16 in crash"). */
  name: string;
  d: Dim;
  /** Edge plane to the top of the bell (8 % of the diameter). */
  rise: Dim;
  /** Bell diameter (20 % of the diameter). */
  bellD: Dim;
  /** Where the EDGE band starts, as a fraction of the radius (words only:
   *  "the edge" is the outer band a stick crashes on). */
  edgeFrac: Dim;
  /** The drawn plate thickness — a line weight so the profile reads at phone
   *  size (a cymbal's real thickness is UNKNOWN; kit proposal §3). */
  drawT: Dim;
};

/* ── the sourced sizes ── */
const profile = (d: number): Pick<CymbalSpec, 'rise' | 'bellD' | 'edgeFrac' | 'drawT'> => ({
  rise: dd(CYMBAL_PROFILE.rise * d, 'cymbal profile height (8 % of the diameter)'),
  bellD: dd(CYMBAL_PROFILE.bell * d, 'bell diameter (20 % of the diameter)'),
  edgeFrac: dd(0.85, 'where the edge band starts (85 % of the radius)'),
  drawT: dd(4, 'the drawn plate thickness (a line weight; the real thickness is unknown)'),
});

export const HIHAT_14: CymbalSpec = { id: 'hihat', kind: 'hihat', name: '14 in hi-hats', d: { mm: 14 * IN, prov: src('ZIL-K', '14" HiHats') }, ...profile(14 * IN) };
export const CRASH_16: CymbalSpec = { id: 'crash1', kind: 'crash', name: '16 in crash', d: { mm: 16 * IN, prov: src('ZIL-K', '16" Dark Crash Thin') }, ...profile(16 * IN) };
export const CRASH_18: CymbalSpec = { id: 'crash2', kind: 'crash', name: '18 in crash', d: { mm: 18 * IN, prov: src('ZIL-K', '18" Dark Crash Thin - Added Value') }, ...profile(18 * IN) };
export const RIDE_20: CymbalSpec = { id: 'ride', kind: 'ride', name: '20 in ride', d: { mm: 20 * IN, prov: src('ZIL-K', '20" Ride') }, ...profile(20 * IN) };

export const CYMBAL_SPECS: Readonly<Record<KitCymbalId, CymbalSpec>> = { hihat: HIHAT_14, crash1: CRASH_16, crash2: CRASH_18, ride: RIDE_20 };

/** The swing a struck cymbal makes on its felts, at the edge (kit proposal
 *  §3: ± 60 mm, a drawing default) — the keep-out a mic stays clear of. */
export const CYMBAL_SWING = dd(CYMBAL_PROFILE.swing, 'how far a struck cymbal swings at its edge (± 60 mm)');

/** The mounting hardware on a cymbal stand's tilter, in the order it stacks
 *  up the stand's rod: tilter, bottom felt, cymbal (on its sleeve), top felt,
 *  wing nut. Drawing defaults (no source gives the sizes). */
export const CYMBAL_HARDWARE = {
  hole: dd(13, 'the cymbal’s centre hole'),
  rod: dd(8, 'the tilter rod'),
  sleeve: dd(11, 'the sleeve round the rod (outside diameter)'),
  feltD: dd(38, 'felt washer diameter'),
  feltT: dd(9, 'felt washer thickness'),
  wingW: dd(42, 'wing nut width'),
  wingH: dd(20, 'wing nut height'),
  tilterD: dd(30, 'tilter body diameter'),
  tilterH: dd(46, 'tilter body height'),
} as const;

/** The hi-hat: the pair, the clutch on the pull rod, the stand and pedal. */
export const HIHAT_HARDWARE = {
  /** Closed: the two edges meet. Open: a TRIAL reading of a maker's
   *  "spaced 1/2" apart" (12.7 mm). */
  closedGap: { mm: 0, prov: { kind: 'illustrative', reason: 'a closed pair: the edges touch' } } as Dim,
  openGap: { mm: 12.7, prov: trial('S-LIVE', '"use small cymbals vertically spaced 1/2" apart" — a leakage tip, read as an open gap') } as Dim,
  clutchD: dd(26, 'hi-hat clutch diameter'),
  clutchH: dd(70, 'hi-hat clutch height'),
  pullRod: dd(7, 'hi-hat pull-rod diameter'),
  upperTube: dd(24, 'hi-hat stand upper tube'),
  lowerTube: dd(30, 'hi-hat stand lower tube'),
  /** The bottom cymbal's seat sits this far under the bottom cymbal's edge plane. */
  seat: dd(26, 'the seat cup under the bottom cymbal'),
  legSpread: dd(288, 'hi-hat tripod leg reach (the kit plan’s)'),
  /** The air-burst ring round the pair's edge (kit proposal §3; DPA's "air
   *  pressure moving out from the sides"): 60 mm wide, from the bottom
   *  cymbal to 30 mm above the top one. */
  airWidth: dd(60, 'the hi-hat air-burst ring’s width'),
  airAbove: dd(30, 'how far the air-burst ring reaches above the top cymbal'),
} as const;

/** A boom cymbal stand (drawing defaults; kit proposal §2 "tripods; boom
 *  arms to each cymbal"; Yamaha's ranges bound the heights). */
export const BOOM_STAND = {
  tube: dd(25, 'cymbal stand tube'),
  boom: dd(19, 'cymbal boom arm'),
  /** The stand's tube stops this far under the cymbal; the boom runs from
   *  there up to the tilter. */
  drop: dd(250, 'how far below the cymbal the boom joint sits'),
  legReach: dd(120, 'tripod leg reach (the kit plan’s)'),
  counterweight: dd(48, 'the boom’s counterweight (diameter)'),
} as const;

/** Where each boom stand's tripod stands on the floor (plan u = x, v = z).
 *  THE SAME numbers as KitPlan.tsx's PLAN_HARDWARE.booms (the setting
 *  page's plan) — a test reads that file and checks they agree. */
export const BOOM_FEET: Readonly<Record<'crash1' | 'crash2' | 'ride', { u: number; v: number }>> = {
  crash1: { u: -230, v: -800 },
  crash2: { u: 540, v: 560 },
  ride: { u: -40, v: 880 },
};

/** The family's drawing defaults, by name (for the lessons' unknowns). */
export const CYMBAL_DRAWING_DEFAULTS: readonly string[] = [
  'cymbal profile (8 % rise), bell (20 % of the diameter), edge band and drawn thickness',
  'felts, sleeve, wing nut, tilter and centre-hole sizes',
  'hi-hat clutch, pull rod, seat, stand tubes and tripod reach',
  'cymbal boom-stand tubes, boom joint height, counterweight and tripod reach',
  'the swing envelope (± 60 mm at the edge) and the hi-hat air-burst ring (60 mm wide)',
];

/* ── a placed cymbal ── */

export type PlacedCymbal = { spec: CymbalSpec; c: Vec3; tiltDeg: number; pair?: boolean };
export type CymbalFrame = { c: Vec3; n: Vec3; e1: Vec3; e2: Vec3; R: number };

export function placedCymbal(id: KitCymbalId): PlacedCymbal {
  const k = KIT_CYMBALS[id];
  return { spec: CYMBAL_SPECS[id], c: k.c, tiltDeg: k.tiltDeg, pair: k.pair };
}

export const KIT_PLACED_CYMBALS: Readonly<Record<KitCymbalId, PlacedCymbal>> = {
  hihat: placedCymbal('hihat'),
  crash1: placedCymbal('crash1'),
  crash2: placedCymbal('crash2'),
  ride: placedCymbal('ride'),
};

export function cymbalFrame(p: PlacedCymbal): CymbalFrame {
  const t = p.tiltDeg * DEG;
  return { c: p.c, n: { x: -Math.sin(t), y: -Math.cos(t), z: 0 }, e1: { x: Math.cos(t), y: -Math.sin(t), z: 0 }, e2: { x: 0, y: 0, z: 1 }, R: p.spec.d.mm / 2 };
}

/** P = c + r(cos θ e1 + sin θ e2) + h n (θ in degrees). */
export function cymbalPoint(f: CymbalFrame, r: number, thetaDeg: number, h: number): Vec3 {
  const a = thetaDeg * DEG;
  const cx = Math.cos(a) * r;
  const sz = Math.sin(a) * r;
  return { x: f.c.x + cx * f.e1.x + sz * f.e2.x + h * f.n.x, y: f.c.y + cx * f.e1.y + sz * f.e2.y + h * f.n.y, z: f.c.z + cx * f.e1.z + sz * f.e2.z + h * f.n.z };
}

/**
 * The TOP surface's height above the edge plane at radius r (mm): a gentle
 * bow rising from the edge to the bell's foot, then the bell's dome. The
 * split (55 % of the rise in the bow, 45 % in the bell) is part of the
 * profile drawing default.
 */
export function surfaceHeight(spec: CymbalSpec, r: number): number {
  const R = spec.d.mm / 2;
  const bellR = spec.bellD.mm / 2;
  const bow = spec.rise.mm * 0.55;
  const bell = spec.rise.mm - bow;
  const a = Math.min(R, Math.max(0, Math.abs(r)));
  if (a >= bellR) return bow * Math.pow(1 - (a - bellR) / (R - bellR), 1.35);
  const q = a / bellR;
  return bow + bell * Math.pow(Math.max(0, 1 - q * q), 0.75);
}

/** The three playing areas, as radii (mm): bell, bow, edge (words: the bell
 *  is the raised centre, the bow the wide middle, the edge the outer band). */
export function cymbalAreas(spec: CymbalSpec): { bell: [number, number]; bow: [number, number]; edge: [number, number] } {
  const R = spec.d.mm / 2;
  const bellR = spec.bellD.mm / 2;
  const e = spec.edgeFrac.mm * R;
  return { bell: [0, bellR], bow: [bellR, e], edge: [e, R] };
}

/* ── solids and keep-outs (collision: the engine's axis cylinders) ── */

/**
 * A cymbal as a solid: a disc (a slab with its axis along −n, from the top
 * of the bell to just under the edge plane), with the SWING as its
 * clearance — so a mic keeps the swing envelope's distance from the plate on
 * every side. A hi-hat pair spans from the top cymbal's bell to the bottom
 * cymbal's (inverted) bell, its clearance the pair's opening.
 */
export function cymbalSolid(p: PlacedCymbal, open = false): { shape: Shape3; clearance: number } {
  const f = cymbalFrame(p);
  const axis = { x: -f.n.x, y: -f.n.y, z: -f.n.z };
  const rise = p.spec.rise.mm;
  if (p.pair) {
    const gap = open ? HIHAT_HARDWARE.openGap.mm : HIHAT_HARDWARE.closedGap.mm;
    // A hi-hat pair on its clutch does not swing like a crash: its keep-outs
    // are its opening travel (the clearance) and the air-burst ring.
    return { shape: { kind: 'slab', c: f.c, axis, r: f.R, x0: -rise, x1: gap + rise }, clearance: HIHAT_HARDWARE.openGap.mm };
  }
  return { shape: { kind: 'slab', c: f.c, axis, r: f.R, x0: -rise, x1: p.spec.drawT.mm }, clearance: CYMBAL_SWING.mm };
}

/** The hi-hat's air-burst ring (DPA: air "moving out from the sides" as the
 *  pair closes): a band round the pair's edge — a keep-out envelope. */
export function hihatAirRing(p: PlacedCymbal): Shape3 {
  const f = cymbalFrame(p);
  const axis = { x: -f.n.x, y: -f.n.y, z: -f.n.z };
  return { kind: 'tube', c: f.c, axis, rIn: f.R, rOut: f.R + HIHAT_HARDWARE.airWidth.mm, x0: -HIHAT_HARDWARE.airAbove.mm, x1: HIHAT_HARDWARE.openGap.mm + p.spec.rise.mm * 0.5 };
}

/** Height above the floor → y (the kit frame). */
const yAt = (h: number) => KIT_FLOOR_Y - h;

/**
 * A boom cymbal stand, as three points: the tripod's hub on the floor, the
 * boom joint at the top of the tube, and the tilter under the cymbal's
 * centre. The cymbal's centre and the stand's foot are the kit plan's.
 */
export function boomStandPoints(id: 'crash1' | 'crash2' | 'ride'): { foot: Vec3; joint: Vec3; tilter: Vec3 } {
  const p = KIT_PLACED_CYMBALS[id];
  const f = cymbalFrame(p);
  const foot = BOOM_FEET[id];
  const hC = KIT_FLOOR_Y - p.c.y;
  const tilter = cymbalPoint(f, 0, 0, -(CYMBAL_HARDWARE.feltT.mm + CYMBAL_HARDWARE.tilterH.mm * 0.5));
  return { foot: { x: foot.u, y: KIT_FLOOR_Y, z: foot.v }, joint: { x: foot.u, y: yAt(hC - BOOM_STAND.drop.mm), z: foot.v }, tilter };
}

/** The hi-hat stand: the hub on the floor and the top of the upper tube
 *  under the seat (the pull rod runs on up through the pair). */
export function hihatStandPoints(): { foot: Vec3; seat: Vec3; rodTop: Vec3 } {
  const p = KIT_PLACED_CYMBALS.hihat;
  const seatY = p.c.y + p.spec.rise.mm + HIHAT_HARDWARE.seat.mm;
  return { foot: { x: p.c.x, y: KIT_FLOOR_Y, z: p.c.z }, seat: { x: p.c.x, y: seatY, z: p.c.z }, rodTop: { x: p.c.x, y: p.c.y - p.spec.rise.mm - HIHAT_HARDWARE.clutchH.mm - 30, z: p.c.z } };
}

/** The collision solids of the cymbals and their stands (in the kit frame). */
export function cymbalSolids(open = false): { id: string; label: string; shape: Shape3; clearance: number }[] {
  const out: { id: string; label: string; shape: Shape3; clearance: number }[] = [];
  for (const id of ['hihat', 'crash1', 'crash2', 'ride'] as const) {
    const p = KIT_PLACED_CYMBALS[id];
    const s = cymbalSolid(p, open);
    out.push({ id: `cym.${id}`, label: id === 'hihat' ? 'hi-hats' : p.spec.name, shape: s.shape, clearance: s.clearance });
  }
  for (const id of ['crash1', 'crash2', 'ride'] as const) {
    const s = boomStandPoints(id);
    out.push({ id: `stand.${id}`, label: `${KIT_PLACED_CYMBALS[id].spec.name} stand`, shape: { kind: 'capsule', a: s.foot, b: s.joint, r: BOOM_STAND.tube.mm / 2 }, clearance: 0 });
    out.push({ id: `boom.${id}`, label: `${KIT_PLACED_CYMBALS[id].spec.name} boom`, shape: { kind: 'capsule', a: s.joint, b: s.tilter, r: BOOM_STAND.boom.mm / 2 }, clearance: 0 });
  }
  const h = hihatStandPoints();
  out.push({ id: 'stand.hihat', label: 'hi-hat stand', shape: { kind: 'capsule', a: h.foot, b: h.rodTop, r: HIHAT_HARDWARE.lowerTube.mm / 2 }, clearance: 0 });
  return out;
}

/** Anchors a lesson can read from (sound sources, labels): each cymbal's
 *  bell top and a point on its bow toward the drummer (where a stick plays). */
export function cymbalAnchors(id: KitCymbalId): { bell: Vec3; bow: Vec3; edge: Vec3; centre: Vec3 } {
  const p = KIT_PLACED_CYMBALS[id];
  const f = cymbalFrame(p);
  const a = cymbalAreas(p.spec);
  const bowR = (a.bow[0] + a.bow[1]) / 2;
  const edgeR = (a.edge[0] + a.edge[1]) / 2;
  return {
    centre: f.c,
    bell: cymbalPoint(f, 0, 0, p.spec.rise.mm),
    bow: cymbalPoint(f, bowR, 180, surfaceHeight(p.spec, bowR)),
    edge: cymbalPoint(f, edgeR, 180, surfaceHeight(p.spec, edgeR)),
  };
}
