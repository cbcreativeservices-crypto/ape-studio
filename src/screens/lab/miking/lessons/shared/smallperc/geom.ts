/**
 * SMALL-PERCUSSION FAMILY — the shared technical model (charter §2 layers 1–2)
 * for Lab 2's hand percussion: shakers, egg shakers, maracas, the headless
 * tambourine, cowbell, claves, woodblock and güiro (the cajón uses the same
 * helpers with its own seated player). Pure TypeScript: the tests reach it.
 *
 * FRAME H (docs/labs/miking/shaker/GEOMETRY_PROPOSAL.md §A, after congas/):
 * mm; origin on the floor under the instrument's normal playing position;
 * +x toward the audience and the mic side; +y DOWN (a height h is y = −h);
 * +z the player's right. The player stands at −x, facing +x.
 *
 *   P0        the playing-zone centre (0, h 1150, 0): where the instrument
 *             spends most of its time — the lessons measure "from the center
 *             of the playing arc / area" (ILLUSTRATIVE height).
 *   player    chest front plane x = −250, shoulders h 1400 (ILLUSTRATIVE).
 *   E         each instrument's motion envelope: the volume the instrument and
 *             the hands sweep (DRAWING DEFAULT — no source gives one).
 *
 * Every number no source gives is a DRAWING DEFAULT, listed in the lesson's
 * unknowns; the learner sees starting points only (owner ruling 2026-10-04).
 */
import type { Dim, DocumentedZone, Envelope, MicPose, Provenance, RefLine, ReferenceSurface, Vec3, VariantId } from '../../../engine/model/types.ts';
import { add, aimTo, approachPose, DEG, dotp, length, mul, sectorPolys, sub, unit, v3 } from '../handGeom.ts';

export { add, aimTo, approachPose, DEG, dotp, length, mul, sectorPolys, sub, unit, v3 };

export const IN = 25.4;
export const src = (s: string, quote: string): Provenance => ({ kind: 'sourced', src: s, quote });
export const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
export const unk = (needed: string): Provenance => ({ kind: 'unknown', needed });
/** A DRAWING DEFAULT: a value the picture needs that no source gives. */
export const drawingDefault = (mm: number, needed: string): Dim => ({ mm, prov: unk(needed), placeholder: true });

/** The playing-zone centre (h 1150; proposal §A). */
export const P0: Vec3 = v3(0, -1150, 0);

/** The standing player (ILLUSTRATIVE, proposal §A). */
export const PLAYER = {
  chestX: -250,
  backX: -470,
  shoulderH: 1400,
  /** The shoulder joints: behind the chest plane, either side. */
  shoulderX: -360,
  shoulderZ: 190,
  /** Arm segments (drawing defaults: typical adult proportions). */
  upperArm: 300,
  forearm: 265,
  hand: 180,
} as const;
export const SHOULDER_R: Vec3 = v3(PLAYER.shoulderX, -PLAYER.shoulderH, PLAYER.shoulderZ);
export const SHOULDER_L: Vec3 = v3(PLAYER.shoulderX, -PLAYER.shoulderH, -PLAYER.shoulderZ);

/**
 * The elbow of a two-link arm from shoulder S to wrist W (lengths L1, L2),
 * bent toward `hint` (down and out for a relaxed arm). When W is out of reach
 * the arm is straight toward it.
 */
export function elbowOf(S: Vec3, W: Vec3, hint: Vec3, L1: number = PLAYER.upperArm, L2: number = PLAYER.forearm): Vec3 {
  const d0 = length(sub(W, S));
  const d = Math.min(d0, L1 + L2 - 1e-6);
  const u = unit(sub(W, S));
  const a = (L1 * L1 - L2 * L2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
  const hv = unit(sub(hint, mul(u, dotp(hint, u))));
  return add(add(S, mul(u, a)), mul(hv, h));
}

/** One arm, shoulder → elbow → wrist, and its hand's grip point. */
export type Arm = { S: Vec3; E: Vec3; W: Vec3; G: Vec3 };

/** An arm reaching from a shoulder to a wrist (the elbow solved). */
export function armTo(side: 'R' | 'L', W: Vec3, G: Vec3, hint?: Vec3): Arm {
  const S = side === 'R' ? SHOULDER_R : SHOULDER_L;
  const out = side === 'R' ? 0.45 : -0.45;
  return { S, E: elbowOf(S, W, hint ?? v3(0.1, 1, out)), W, G };
}

/** The keep-outs of one arm: upper arm, forearm and hand (capsules), with an
 *  extra `sweep` (mm) for an arm that moves while it plays. ILLUSTRATIVE. */
export function armEnvelopes(id: string, label: string, a: Arm, variants: VariantId[], sweep = 0): Envelope[] {
  const why = ill('the player’s arm and hand, drawn from the posture; no source gives a clearance');
  return [
    { id: `${id}.upper`, label: `the player’s ${label} upper arm`, shape: { kind: 'capsule', a: a.S, b: a.E, r: 55 }, prov: why, variants },
    { id: `${id}.fore`, label: `the player’s ${label} forearm`, shape: { kind: 'capsule', a: a.E, b: a.W, r: 45 + sweep * 0.5 }, prov: why, variants },
    { id: `${id}.hand`, label: `the player’s ${label} hand`, shape: { kind: 'capsule', a: a.W, b: a.G, r: 55 + sweep }, prov: why, variants },
  ];
}

/** The standing player's body (ILLUSTRATIVE): torso and legs behind the
 *  chest plane, the head above. */
export function standingBody(variants?: VariantId[]): Envelope {
  return { id: 'env.player', label: 'the player', shape: { kind: 'box', min: v3(-520, -1780, -250), max: v3(PLAYER.chestX, 0, 250) }, prov: ill('a standing player behind the instrument (proposal §A)'), ...(variants ? { variants } : {}) };
}

/** A TARGET reference point (distance = |p − point|; aim measured toward it). */
export function targetSurface(id: string, partId: string, label: string, point: Vec3, normal: Vec3, variants: VariantId[]): ReferenceSurface {
  return { id, partId, label, point, normal: unit(normal), target: true, variants };
}

/** The CLEARANCE readout (LESSON_JOURNEY: "nearest stroke"): the distance
 *  from the motion envelope's capsule (segment a–b, radius r), signed. */
export function clearLine(id: string, label: string, a: Vec3, b: Vec3, r: number, variants: VariantId[]): RefLine {
  const mid = mul(add(a, b), 0.5);
  const half = length(sub(b, a)) / 2;
  return { id, label, point: mid, dir: half > 1e-9 ? unit(sub(b, a)) : v3(1, 0, 0), segment: half, offset: r, words: { plus: 'clear of', minus: 'inside', keyPlus: 'CLEAR', keyMinus: '✕ INSIDE' }, variants };
}

/**
 * A suggested starting point measured from a TARGET point `c` (the centre
 * of the playing area, a strike spot, a port): every point dMin–dMax from it,
 * aMin–aMax degrees off the direction `n`, the mic facing back at `c` within
 * `aimTol`. Drawn as the same sector (sectorPolys) in both views; its start
 * pose sits at the band's middle, toward `side`.
 */
export type TargetZoneSpec = {
  id: string;
  label: string;
  band: string;
  kind: 'sourced' | 'trial';
  src: string;
  quote: string;
  surface: string;
  c: Vec3;
  n: Vec3;
  side: Vec3;
  d: [number, number];
  a: [number, number];
  aimTol: number;
  /** Where the start sits inside the band (defaults: the middles). */
  startD?: number;
  startA?: number;
  /** Aim the start at this point instead of c (still inside aimTol). */
  aimAt?: Vec3;
  variants: VariantId[];
  micTypeIds: string[];
  mount?: 'stand' | 'clip';
  /** Keep the mic outside the motion: a clearance line and its minimum. */
  clear?: { line: string; min: number };
  bandProv?: Provenance;
  tendency: string;
  checks: string[];
};

export function targetZone(z: TargetZoneSpec): DocumentedZone {
  const dMid = z.startD ?? (z.d[0] + z.d[1]) / 2;
  const aMid = z.startA ?? (z.a[0] + z.a[1]) / 2;
  const start: MicPose = approachPose(z.c, unit(z.n), z.side, dMid, aMid, z.aimAt ?? z.c);
  const draw = sectorPolys(z.c, unit(z.n), z.side, z.d[0], z.d[1], z.a[0], z.a[1]);
  return {
    id: z.id,
    label: z.label,
    band: z.band,
    kind: z.kind,
    src: z.src,
    quote: z.quote,
    refSurface: z.surface,
    side: 'outside',
    distance: { min: z.d[0], max: z.d[1] },
    ...(z.bandProv ? { bandProv: z.bandProv } : {}),
    cone: { min: z.a[0], max: z.a[1], prov: ill('the zone’s approach angles: the lab’s band round the source’s words') },
    aim: { maxOffAxis: z.aimTol, prov: ill(`facing the playing area: the lab counts within ${z.aimTol}°`) },
    ...(z.clear ? { radial: { line: z.clear.line, min: z.clear.min, prov: ill('outside the motion envelope (a drawing default)') } } : {}),
    requires: { variants: z.variants, micTypeIds: z.micTypeIds, ...(z.mount ? { mount: z.mount } : {}) },
    draw: { side: draw.side, top: draw.top },
    start: { p: start.p, az: Math.round(start.az * 10) / 10, el: Math.round(start.el * 10) / 10 },
    tendency: z.tendency,
    checks: z.checks,
  };
}

/** The family's mount rule: a level boom away from the mic's tail, so a mic
 *  aimed down into the playing area hangs from a boom beside it. */
export const LEVEL_BOOM = { boom: 'level' as const, fallback: v3(1, 0, 0), length: 300 };

/** Round a pose for display-stable data. */
export function roundPose(p: MicPose): MicPose {
  const r = (x: number) => Math.round(x * 10) / 10;
  return { p: v3(r(p.p.x), r(p.p.y), r(p.p.z)), az: r(p.az), el: r(p.el) };
}

/** Degrees → a unit vector in the x–y plane, from +x toward −y (UP). */
export function upFrom(deg: number): Vec3 {
  return v3(Math.cos(deg * DEG), -Math.sin(deg * DEG), 0);
}
