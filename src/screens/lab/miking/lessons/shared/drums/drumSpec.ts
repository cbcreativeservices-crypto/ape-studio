/**
 * THE SHARED DRUM FAMILY — the technical truth (charter §2 layer 1) for every
 * drum Lab 1 draws: shell, heads, hoops, lugs and tension rods, snare wires
 * and strainer, tom mounts, floor-tom legs, stands. Pure (no React Native):
 * the tests and every lesson's geometry read it directly.
 *
 * SIZES are the sourced 5-piece kit (docs/labs/miking/kit/SOURCES.md §a,
 * snare/SOURCES.md, toms/SOURCES.md). Everything no source gives is a
 * DRAWING DEFAULT (`placeholder: true` on the Dim; the geometry proposals
 * list each one) — drawn, never a readout reference.
 *
 * FRAME of one drum (its own): origin = the BATTER-HEAD CENTRE; `axis` = the
 * unit direction INTO the drum (an upright drum: +y, down); `e1` = the head
 * plane's "θ = 0" direction (toward the audience, +x, tipped with the tilt);
 * `e2` = +z (the drummer's right). A point at plan angle θ (from e1 toward
 * e2), radius r and depth s below the batter plane is
 *     P = c + r·(cos θ·e1 + sin θ·e2) + s·axis.
 * TILT (deg) turns the drum about +z so its head faces the drummer (−x): the
 * head normal (out of the batter) is n = (−sin t, −cos t, 0) — the toms'
 * GEOMETRY_PROPOSAL §2 convention. Kit frame: kit/GEOMETRY_PROPOSAL.md §1
 * (origin the kick's batter centre, +x audience, +y down, +z drummer's right).
 */
import type { Dim, Provenance, Shape3, Vec3 } from '../../../engine/model/types.ts';

const IN = 25.4;
const src = (s: string, quote: string): Provenance => ({ kind: 'sourced', src: s, quote });
const trial = (s: string, note: string): Provenance => ({ kind: 'trial', src: s, note });
const unk = (needed: string): Provenance => ({ kind: 'unknown', needed });
/** A drawing default: the picture needs a number no source gives. */
const dd = (mm: number, needed: string): Dim => ({ mm, prov: unk(needed), placeholder: true });

export type HoopKind = 'triple' | 'wood';
export type HeadFinish = 'coated' | 'clear' | 'ebony' | 'snareSide';

export type DrumSpec = {
  id: string;
  /** What the learner reads ("14 × 5.5 in snare drum"). */
  name: string;
  d: Dim;
  depth: Dim;
  tShell: Dim;
  plies: number;
  hoop: { kind: HoopKind; t: Dim; above: Dim; below: Dim; gap: Dim };
  rods: { n: Dim; phaseDeg: Dim };
  /** One lug per rod per head (two-piece lugs), drawn on the shell. */
  lug: { len: Dim; out: Dim; inset: Dim };
  batter: HeadFinish;
  reso: HeadFinish | null;
  /** Snare wires under the resonant (snare-side) head. */
  wires?: { strands: Dim; width: Dim; length: Dim; strainerDeg: Dim; buttDeg: Dim; dropOff: Dim };
  /** Floor-tom legs. */
  legs?: { n: Dim; phaseDeg: Dim; spread: Dim; r: Dim };
};

/* ── the sourced sizes, with every drawing default named ── */

const tripleHoop = (t: Dim): DrumSpec['hoop'] => ({
  kind: 'triple',
  t,
  above: dd(10, 'hoop height above the head (h_hoop)'),
  below: dd(14, 'how far a triple-flange hoop runs down past the head (its skirt)'),
  gap: dd(3, 'gap between the shell and the hoop'),
});
const twoPieceLug = (): DrumSpec['lug'] => ({ len: dd(30, 'lug length along the shell'), out: dd(24, 'how far a lug stands off the shell'), inset: dd(8, 'lug distance from the shell edge') });

/** The 14 × 5.5 in snare (YMH-SCB SBS-1455, YMH-TCS TMS-1455, YMH-RCS RBS-1455). */
export const SNARE_14x55: DrumSpec = {
  id: 'snare',
  name: '14 × 5.5 in snare drum',
  d: { mm: 14 * IN, prov: src('YMH-TCS', 'TMS-1455 14"×5.5"') },
  depth: { mm: 5.5 * IN, prov: trial('YMH-TCS', '5.5 in nominal depth; heads drawn as flat planes at the shell ends') },
  tShell: { mm: 5.6, prov: src('YMH-TCS', '6-Ply, 5.6 mm') },
  plies: 6,
  hoop: tripleHoop({ mm: 2.3, prov: trial('YMH-TC', 'TT / FT : 2.3 mm — a Tour Custom tom hoop, not the snare’s own figure') }),
  rods: { n: { mm: 10, prov: src('YMH-TCS', 'Inverse DynaHoop (10 hole)') }, phaseDeg: dd(18, 'tension-rod phase on the snare') },
  lug: twoPieceLug(),
  batter: 'coated',
  reso: 'snareSide',
  wires: {
    strands: { mm: 20, prov: src('YMH-TCS', '20-Strand/high-carbon steel') },
    width: dd(75, 'snare-wire set width'),
    length: dd(320, 'snare-wire set length (0.9 × the diameter)'),
    // Drawing default: the strainer on the player's side, the wires along x,
    // so the side cutaway shows them full length (the proposal's 270° is
    // equally a default; no source gives the side).
    strainerDeg: dd(180, 'which side the strainer (throw-off) sits on'),
    buttDeg: dd(0, 'which side the butt plate sits on'),
    dropOff: dd(6, 'how far released wires hang below the head'),
  },
};

/** Rack tom 1, 10 × 7 in (SBT-1007 / TMT-1007 / RBT-1007; TAMA "10"x7""). */
export const TOM_10x7: DrumSpec = {
  id: 'tom1',
  name: '10 × 7 in rack tom',
  d: { mm: 10 * IN, prov: src('YMH-TC', 'TMT-1007 10"×7"') },
  depth: { mm: 7 * IN, prov: trial('YMH-TC', '7 in nominal depth') },
  tShell: { mm: 5.6, prov: src('YMH-TC', 'Maple (6-ply), 5.6 mm') },
  plies: 6,
  hoop: tripleHoop({ mm: 2.3, prov: src('YMH-TC', 'TT / FT : 2.3 mm') }),
  rods: { n: dd(6, 'rack-tom tension rods per head (the maker table is unusable, D-T2)'), phaseDeg: dd(30, 'rack-tom rod phase') },
  lug: twoPieceLug(),
  batter: 'coated',
  reso: 'clear',
};

/** Rack tom 2, 12 × 8 in (SBT-1208 / TMT-1208 / RBT-1208; TAMA "12"x8""). */
export const TOM_12x8: DrumSpec = {
  ...TOM_10x7,
  id: 'tom2',
  name: '12 × 8 in rack tom',
  d: { mm: 12 * IN, prov: src('YMH-TC', 'TMT-1208 12"×8"') },
  depth: { mm: 8 * IN, prov: trial('YMH-TC', '8 in nominal depth') },
};

/** Floor tom, 16 × 16 in (TAMA-SSC "16"x16" Floor Tom"). */
export const FLOOR_16x16: DrumSpec = {
  ...TOM_10x7,
  id: 'floorTom',
  name: '16 × 16 in floor tom',
  d: { mm: 16 * IN, prov: src('TAMA-SSC', '16"x16" Floor Tom') },
  depth: { mm: 16 * IN, prov: trial('TAMA-SSC', '16 in nominal depth') },
  rods: { n: { mm: 8, prov: src('YMH-RC', 'RBF-1615 tuning bolts 8 (read per head)') }, phaseDeg: dd(22.5, 'floor-tom rod phase') },
  legs: { n: dd(3, 'floor-tom leg count'), phaseDeg: dd(30, 'floor-tom leg angles'), spread: dd(120, 'how far a leg foot stands out past the shell'), r: dd(6.5, 'leg radius') },
};

/** The 22 × 18 in kick (M01's own numbers: kick/SOURCES.md, m01Kick/model.ts),
 *  as a neighbour in the other drum lessons: wood hoops, 10 rods per head. */
export const KICK_22x18: DrumSpec = {
  id: 'kick',
  name: '22 × 18 in kick drum',
  d: { mm: 22 * IN, prov: src('YMH-RC', 'RBB-2218 22"×18"') },
  depth: { mm: 18 * IN, prov: trial('YMH-RC', '18 in nominal depth') },
  tShell: { mm: 7, prov: src('TAMA-SSC', 'Bass Drum : 8ply, 7mm') },
  plies: 8,
  hoop: { kind: 'wood', t: { mm: 8, prov: trial('YMH-TC', 'BD : 8.0 mm') }, above: dd(19, 'kick hoop past the head (M01: 25 − 6)'), below: dd(6, 'kick hoop inset (M01)'), gap: dd(3, 'kick hoop gap (M01)') },
  rods: { n: { mm: 10, prov: src('YMH-RC', 'No. of Tuning Bolts 10 (per head; owner-confirmed 2026-10-04)') }, phaseDeg: dd(18, 'kick rod phase (M01)') },
  lug: twoPieceLug(),
  batter: 'coated',
  reso: 'ebony',
};

/* ── a placed drum: the frame ── */

export type PlacedDrum = { spec: DrumSpec; c: Vec3; tiltDeg: number };
export type DrumFrame = { c: Vec3; axis: Vec3; n: Vec3; e1: Vec3; e2: Vec3; R: number; depth: number };

const DEG = Math.PI / 180;

export function frameOf(d: PlacedDrum): DrumFrame {
  const t = d.tiltDeg * DEG;
  return {
    c: d.c,
    axis: { x: Math.sin(t), y: Math.cos(t), z: 0 },
    n: { x: -Math.sin(t), y: -Math.cos(t), z: 0 },
    e1: { x: Math.cos(t), y: -Math.sin(t), z: 0 },
    e2: { x: 0, y: 0, z: 1 },
    R: d.spec.d.mm / 2,
    depth: d.spec.depth.mm,
  };
}

/** P = c + r(cos θ e1 + sin θ e2) + s·axis (θ in degrees). */
export function pointOn(f: DrumFrame, r: number, thetaDeg: number, s: number): Vec3 {
  const a = thetaDeg * DEG;
  const cx = Math.cos(a) * r;
  const sz = Math.sin(a) * r;
  return {
    x: f.c.x + cx * f.e1.x + sz * f.e2.x + s * f.axis.x,
    y: f.c.y + cx * f.e1.y + sz * f.e2.y + s * f.axis.y,
    z: f.c.z + cx * f.e1.z + sz * f.e2.z + s * f.axis.z,
  };
}

/** Rod / lug angles (deg): phase + k·360/n. */
export function rodAngles(spec: DrumSpec): number[] {
  const n = spec.rods.n.mm;
  return Array.from({ length: n }, (_, k) => spec.rods.phaseDeg.mm + (k * 360) / n);
}

/** Radii of the hoop (inside, outside). */
export function hoopRadii(spec: DrumSpec): { rIn: number; rOut: number } {
  const rIn = spec.d.mm / 2 + spec.hoop.gap.mm;
  return { rIn, rOut: rIn + spec.hoop.t.mm };
}

/** The lowest point of a placed drum above the floor (the toms' clearance check). */
export function lowestHeight(d: PlacedDrum, floorY: number): number {
  const f = frameOf(d);
  let lo = -Infinity;
  for (let k = 0; k < 72; k++) {
    const p = pointOn(f, f.R, k * 5, f.depth);
    lo = Math.max(lo, p.y);
  }
  return floorY - lo;
}

/* ── solids (collision) for a placed drum: the engine's axis cylinders ── */

export type DrumSolids = { shell: Shape3; batter: Shape3; reso: Shape3 | null; hoopTop: Shape3; hoopBottom: Shape3 | null; lugs: Shape3 };

/** The drum's solids in the frame of `c` (any frame: c is where it is). */
export function drumSolids(d: PlacedDrum, opts: { reso?: boolean } = {}): DrumSolids {
  const f = frameOf(d);
  const s = d.spec;
  const R = f.R;
  const { rIn, rOut } = hoopRadii(s);
  const ax = f.axis;
  const withReso = opts.reso ?? s.reso != null;
  return {
    shell: { kind: 'tube', c: f.c, axis: ax, rIn: R - s.tShell.mm, rOut: R, x0: 0, x1: f.depth },
    batter: { kind: 'slab', c: f.c, axis: ax, r: R, x0: -0.5, x1: 0.5 },
    reso: withReso ? { kind: 'slab', c: f.c, axis: ax, r: R, x0: f.depth - 0.5, x1: f.depth + 0.5 } : null,
    hoopTop: { kind: 'tube', c: f.c, axis: ax, rIn, rOut, x0: -s.hoop.above.mm, x1: s.hoop.below.mm },
    hoopBottom: withReso ? { kind: 'tube', c: f.c, axis: ax, rIn, rOut, x0: f.depth - s.hoop.below.mm, x1: f.depth + s.hoop.above.mm } : null,
    // The lug ring: one band standing off the shell between the hoops (the
    // lugs' envelope; a mic between two lugs is not a starting point).
    lugs: { kind: 'tube', c: f.c, axis: ax, rIn: R, rOut: R + s.lug.out.mm, x0: s.lug.inset.mm, x1: f.depth - s.lug.inset.mm },
  };
}

/** The rim a clamp can grip: the batter hoop's top edge (or the bottom hoop's). */
export function rimOf(d: PlacedDrum, which: 'top' | 'bottom'): { c: Vec3; axis: Vec3; r: number } {
  const f = frameOf(d);
  const { rOut } = hoopRadii(d.spec);
  const s = which === 'top' ? -d.spec.hoop.above.mm : f.depth + d.spec.hoop.above.mm;
  return { c: { x: f.c.x + s * f.axis.x, y: f.c.y + s * f.axis.y, z: f.c.z + s * f.axis.z }, axis: f.axis, r: rOut };
}

/** The drawing defaults this family uses, by name (for the lessons' unknowns). */
export const DRUM_DRAWING_DEFAULTS: readonly string[] = [
  'hoop height above the head, hoop skirt, shell-to-hoop gap',
  'lug size and position',
  'rack-tom rod count and every rod phase',
  'snare-wire set size, strainer side, released-wire drop',
  'floor-tom leg count, angles and spread',
];
