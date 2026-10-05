/**
 * I03b EGG SHAKER — the technical truth (charter §2 layer 1). Keys point into
 * docs/labs/miking/egg_shaker/SOURCES.md and shaker/SOURCES.md §0; geometry
 * from egg_shaker/GEOMETRY_PROPOSAL.md on the small-percussion family (§A).
 *
 * FRAME H (smallperc/geom.ts). THREE STATES: ONE EGG in the right hand; TWO
 * EGGS close together (hands either side of P0, the mic aimed between them);
 * HANDS APART (the hands more than 40 cm apart, playing their own parts). Each
 * egg is shaken with the wrist, toward and away (along x) — the lesson names
 * no direction; the proposal's envelope is ±120 along it.
 */
import type { Dim, DocumentedZone, Vec3, VariantId } from '../../engine/model/types.ts';
import { armTo, drawingDefault, IN, P0, src, targetZone, v3, type Arm } from '../shared/smallperc/geom.ts';

export const EGG_DIMS = {
  /** An egg 58 × 45 mm (size UNKNOWN: no maker prints one). */
  len: drawingDefault(58, 'egg shaker length (no maker prints a size)'),
  d: drawingDefault(45, 'egg shaker width'),
  sweep: drawingDefault(120, 'one egg’s reach along the shake (±120 mm)'),
  across: drawingDefault(50, 'the egg’s envelope across the shake (±50 mm)'),
  pairZ: drawingDefault(180, 'two eggs: the hands either side of the playing area (±180 mm)'),
  apartZ: drawingDefault(260, 'hands apart: each hand 260 mm from the middle (over 40 cm apart)'),
  near: { mm: 300, prov: { kind: 'trial', src: 'LESSON-EGG', note: 'around 30–60 cm (1–2 ft) from the middle of the usual playing area' } } as Dim,
  far: { mm: 600, prov: { kind: 'trial', src: 'LESSON-EGG', note: 'around 30–60 cm (1–2 ft) from the middle of the usual playing area' } } as Dim,
  floor: { mm: 12 * IN, prov: src('S-HOME', 'Percussion – Aim the mic directly at the instrument, with a gap of at least 12” / 30cm.') } as Dim,
} as const;

export type EggId = 'one' | 'two' | 'apart';
export type Egg = { c: Vec3; side: 'R' | 'L'; arm: Arm };
export type EggState = { id: EggId; eggs: Egg[] };

// The left hand sits a little back and lower than the right (a drawing
// default), so the two hands read apart from the side.
const egg = (side: 'R' | 'L', z: number): Egg => {
  const dx = side === 'L' ? -40 : 0;
  const dy = side === 'L' ? 25 : 0;
  const c = v3(dx, P0.y + dy, z);
  const s = side === 'R' ? 1 : -1;
  return { c, side, arm: armTo(side, v3(dx - 92, P0.y + dy - 18, z + s * 22), v3(dx - 6, P0.y + dy, z + s * 4)) };
};

export const STATES: Readonly<Record<EggId, EggState>> = {
  one: { id: 'one', eggs: [egg('R', 0)] },
  two: { id: 'two', eggs: [egg('R', EGG_DIMS.pairZ.mm), egg('L', -EGG_DIMS.pairZ.mm)] },
  apart: { id: 'apart', eggs: [egg('R', EGG_DIMS.apartZ.mm), egg('L', -EGG_DIMS.apartZ.mm)] },
};
export const stateOf = (v: VariantId): EggState => STATES[(v === 'two' || v === 'apart' ? v : 'one') as EggId];

/** One egg's motion envelope: a capsule along x through its centre. */
export function motionOf(e: Egg): { a: Vec3; b: Vec3; r: number } {
  const k = EGG_DIMS.sweep.mm - EGG_DIMS.across.mm;
  return { a: v3(e.c.x - k, e.c.y, e.c.z), b: v3(e.c.x + k, e.c.y, e.c.z), r: EGG_DIMS.across.mm };
}

const BOTH = ['orchSdc', 'smallDynCard'];
const NEAR = EGG_DIMS.near.mm;
const FAR = EGG_DIMS.far.mm;
const BAND = 'Start about 30–60 cm (1–2 ft) from the middle of the usual playing area';

export const EGG_ZONES: DocumentedZone[] = [
  targetZone({
    id: 'egg.front.one',
    label: 'In front of the playing area (one egg)',
    band: `${BAND}, in front of it and roughly level, facing where the egg spends most of its time.`,
    kind: 'trial',
    src: 'LESSON-EGG',
    quote: 'audition a suitable condenser with its capsule around 30–60 cm (1–2 ft) from the middle of the usual playing area, aimed into that area',
    surface: 'p0.one',
    c: P0,
    n: v3(1, 0, 0),
    side: v3(0, -1, 0),
    d: [NEAR, FAR],
    a: [0, 25],
    aimTol: 30,
    startD: 430,
    startA: 8,
    variants: ['one'],
    micTypeIds: BOTH,
    clear: { line: 'clear.one', min: 100 },
    tendency: 'The egg’s pulse with its grip and hand sounds; a stroke that passes very close jumps out. Listen to the whole phrase.',
    checks: ['The largest gesture and the closest approach', 'Grip, hand and clothing sounds', 'Room or band spill if you move back'],
  }),
  targetZone({
    id: 'egg.above.one',
    label: 'Higher, angled down into the playing area (one egg)',
    band: `${BAND}, a little higher, angled down into the playing area — clear of the arm, the face and the head.`,
    kind: 'trial',
    src: 'LESSON-EGG',
    quote: 'A slightly different height or angle can change the balance of the egg, hand noise and spill, but do not assert the same tonal effect for all models.',
    surface: 'p0.one',
    c: P0,
    n: v3(1, 0, 0),
    side: v3(0, -1, 0),
    d: [NEAR, FAR],
    a: [30, 55],
    aimTol: 30,
    startD: 420,
    startA: 42,
    variants: ['one'],
    micTypeIds: BOTH,
    clear: { line: 'clear.one', min: 100 },
    tendency: 'A different balance of egg, hand noise and spill than the level spot — compare by ear, with the same grip and phrase.',
    checks: ['The palm shielding the egg from this angle', 'Neighbours the mic now faces', 'The arm, face and head stay clear'],
  }),
  targetZone({
    id: 'egg.between.two',
    label: 'One mic aimed between the two eggs',
    band: `${BAND}, aimed between the eggs’ usual positions and far enough back to take in both.`,
    kind: 'trial',
    src: 'LESSON-EGG',
    quote: 'If both hands occupy a reasonably compact area, start with one mic aimed between their usual positions, far enough back to encompass both',
    surface: 'p0.two',
    c: P0,
    n: v3(1, 0, 0),
    side: v3(0, -1, 0),
    d: [NEAR, FAR],
    a: [0, 25],
    aimTol: 25,
    startD: 470,
    startA: 8,
    variants: ['two'],
    micTypeIds: BOTH,
    clear: { line: 'clear.two', min: 100 },
    tendency: 'Both eggs together in one channel; compare hand to hand — level and timbre — and move the mic toward the quieter one if the balance needs it.',
    checks: ['Each hand alone, then both', 'One egg hidden by a palm', 'Spill from the band'],
  }),
  targetZone({
    id: 'egg.right.apart',
    label: 'A spot on the right-hand egg (hands apart)',
    band: 'With the hands wide apart, one spot per hand — start about 30–60 cm from that egg’s usual position, facing it.',
    kind: 'trial',
    src: 'LESSON-EGG',
    quote: 'If the hands separate widely or intentionally play different parts, consider a separate spot for each hand or a well-positioned area mic.',
    surface: 'egg.R.apart',
    c: STATES.apart.eggs[0].c,
    n: v3(1, 0, 0),
    side: v3(0, -1, 0),
    d: [NEAR, FAR],
    a: [0, 25],
    aimTol: 25,
    startD: 400,
    startA: 8,
    variants: ['apart'],
    micTypeIds: BOTH,
    bandProv: { kind: 'unknown', needed: 'the lesson gives no number for the split; the 30–60 cm band is reused (proposal drawing default)' },
    tendency: 'Its own control of one hand — at the cost of a second stand, more spill and a second arrival of each egg. Check the pair together, in mono.',
    checks: ['Both spots together, in mono', 'Timing between the hands', 'Spill and stands'],
  }),
  targetZone({
    id: 'egg.left.apart',
    label: 'A spot on the left-hand egg (hands apart)',
    band: 'With the hands wide apart, one spot per hand — start about 30–60 cm from that egg’s usual position, facing it.',
    kind: 'trial',
    src: 'LESSON-EGG',
    quote: 'If the hands separate widely or intentionally play different parts, consider a separate spot for each hand or a well-positioned area mic.',
    surface: 'egg.L.apart',
    c: STATES.apart.eggs[1].c,
    n: v3(1, 0, 0),
    side: v3(0, -1, 0),
    d: [NEAR, FAR],
    a: [0, 25],
    aimTol: 25,
    startD: 400,
    startA: 8,
    variants: ['apart'],
    micTypeIds: BOTH,
    bandProv: { kind: 'unknown', needed: 'the lesson gives no number for the split; the 30–60 cm band is reused (proposal drawing default)' },
    tendency: 'The left hand on its own channel — check that it does not simply repeat the right-hand mic’s egg, a little later.',
    checks: ['Both spots together, in mono', 'Timing between the hands', 'Spill and stands'],
  }),
];
