/**
 * I03c MARACAS — the technical truth (charter §2 layer 1). Keys point into
 * docs/labs/miking/maracas/SOURCES.md and shaker/SOURCES.md §0; geometry from
 * maracas/GEOMETRY_PROPOSAL.md on the small-percussion family (§A).
 *
 * FRAME H (smallperc/geom.ts). A matched PAIR, one in each hand, heads up
 * (GRIN-MAR: "one in each hand held by their handles"); the hands either side
 * of the playing area. Overall length 284.48 mm (GRIN-MAR, 11.2 in) — the
 * head/handle split and the head's size are drawing defaults.
 *
 * TWO STATES: the PAIR on its own, and a SINGER WITH MARACAS — the same pair
 * with the player's vocal mic at the mouth (the lesson's singer scenario).
 */
import type { Dim, DocumentedZone, Vec3, VariantId } from '../../engine/model/types.ts';
import { armTo, drawingDefault, IN, src, targetZone, v3, type Arm } from '../shared/smallperc/geom.ts';

export const MAR_DIMS = {
  /** Overall length: GRIN-MAR "11.2 in. length (right pair)". */
  len: { mm: 11.2 * IN, prov: src('GRIN-MAR', '11.2 in. length (right pair)') } as Dim,
  headW: drawingDefault(75, 'maraca head width (no size is printed)'),
  headH: drawingDefault(95, 'maraca head height'),
  handleD: drawingDefault(25, 'maraca handle diameter'),
  /** Hands either side of the playing area. */
  pairZ: drawingDefault(200, 'the hands either side of the playing area (±200 mm)'),
  /** The head's arc: a wrist pivot 170 mm below the head, ±35°, plus a 40 mm
   *  circular-wrist ring (proposal). */
  pivot: drawingDefault(170, 'wrist pivot below the head centre'),
  stroke: drawingDefault(35, 'the up/down stroke, ± degrees about the wrist'),
  ring: drawingDefault(40, 'the circular-wrist ring’s radius'),
  near: { mm: 400, prov: { kind: 'trial', src: 'LESSON-MARACAS', note: 'A practical 40–80 cm (roughly 16–32 in.) from the midpoint of the two-head playing area' } } as Dim,
  far: { mm: 800, prov: { kind: 'trial', src: 'LESSON-MARACAS', note: 'A practical 40–80 cm (roughly 16–32 in.) from the midpoint of the two-head playing area' } } as Dim,
} as const;

/** The handle's length: the overall length less the head (drawing split). */
export const HANDLE = MAR_DIMS.len.mm - MAR_DIMS.headH.mm;
/** The heads' height (the playing area's middle, ILLUSTRATIVE). */
export const HEAD_Y = -1240;
/** P0 for the maracas: the midpoint of the two heads. */
export const PM: Vec3 = v3(0, HEAD_Y, 0);

export type Maraca = { side: 'R' | 'L'; head: Vec3; arm: Arm };
export type MarState = { id: 'pair' | 'singer'; m: Maraca[] };

// The left hand a little back and lower (a drawing default) so the two read
// apart from the side.
function maraca(side: 'R' | 'L'): Maraca {
  const s = side === 'R' ? 1 : -1;
  const dx = side === 'L' ? -30 : 0;
  const dy = side === 'L' ? 30 : 0;
  const head = v3(dx, HEAD_Y + dy, s * MAR_DIMS.pairZ.mm);
  const grip = v3(dx, HEAD_Y + dy + MAR_DIMS.headH.mm / 2 + 70, head.z);
  return { side, head, arm: armTo(side, v3(dx - 88, grip.y + 8, head.z + s * 20), grip) };
}

export const STATES: Readonly<Record<'pair' | 'singer', MarState>> = {
  pair: { id: 'pair', m: [maraca('R'), maraca('L')] },
  singer: { id: 'singer', m: [maraca('R'), maraca('L')] },
};
export const stateOf = (v: VariantId): MarState => STATES[v === 'singer' ? 'singer' : 'pair'];

/** The pair's motion: a capsule across both heads, wide enough for each
 *  head's ±35° arc (± 97 mm) and its circular ring. */
export function motionOf(s: MarState): { a: Vec3; b: Vec3; r: number } {
  const arc = MAR_DIMS.pivot.mm * Math.sin((MAR_DIMS.stroke.mm * Math.PI) / 180);
  const r = arc + MAR_DIMS.ring.mm;
  const R = s.m.find((x) => x.side === 'R')!.head;
  const L = s.m.find((x) => x.side === 'L')!.head;
  return { a: v3((R.x + L.x) / 2, (R.y + L.y) / 2 + 15, L.z), b: v3((R.x + L.x) / 2, (R.y + L.y) / 2 + 15, R.z), r };
}

/** The singer's vocal mic (ILLUSTRATIVE): its front at the mouth, its body
 *  angled down and forward, on a boom. */
export const VOCAL = { front: v3(-200, -1585, 0), tail: v3(-128, -1520, 0), boomEnd: v3(160, -1500, 0) } as const;

const BOTH = ['orchSdc', 'smallDynCard'];
const NEAR = MAR_DIMS.near.mm;
const FAR = MAR_DIMS.far.mm;

export const MAR_ZONES: DocumentedZone[] = [
  targetZone({
    id: 'mar.centre.pair',
    label: 'One mic, centred in front of the pair',
    band: 'Start about 40–80 cm (16–32 in) from the midpoint between the two heads, centred in front of them and facing that midpoint.',
    kind: 'trial',
    src: 'LESSON-MARACAS',
    quote: 'A practical 40–80 cm (roughly 16–32 in.) from the midpoint of the two-head playing area gives room to test coverage',
    surface: 'p0.pair',
    c: PM,
    n: v3(1, 0, 0),
    side: v3(0, -1, 0),
    d: [NEAR, FAR],
    a: [0, 25],
    aimTol: 25,
    startD: 560,
    startA: 6,
    variants: ['pair'],
    micTypeIds: BOTH,
    clear: { line: 'clear.pair', min: 120 },
    tendency: 'Both hands in one channel, a stable mono part — check each hand in turn, then together; the nearer head can leap in level on every stroke.',
    checks: ['Each hand alone, then both', 'Up and down strokes', 'Stand, cable and clothing noise'],
  }),
  targetZone({
    id: 'mar.right.pair',
    label: 'A spot on the right-hand head',
    band: 'If one hand disappears in a single mic, a spot per head — start about 30–60 cm from that head’s working area, facing it.',
    kind: 'trial',
    src: 'LESSON-MARACAS',
    quote: 'audition two spots: one aimed at the working area of each head',
    surface: 'head.R.pair',
    c: STATES.pair.m[0].head,
    n: v3(1, 0, 0),
    side: v3(0, -1, 0),
    d: [300, 600],
    a: [0, 25],
    aimTol: 25,
    startD: 420,
    startA: 8,
    variants: ['pair'],
    micTypeIds: BOTH,
    bandProv: { kind: 'unknown', needed: 'the lesson gives no number for a per-head spot; 300–600 mm is the proposal’s drawing default' },
    tendency: 'One hand on its own channel — at the cost of a second stand and the other head arriving a little later in this mic. Check the two spots together, in mono.',
    checks: ['Both spots together, in mono', 'The other head’s spill', 'Stands outside both arcs'],
  }),
  targetZone({
    id: 'mar.left.pair',
    label: 'A spot on the left-hand head',
    band: 'If one hand disappears in a single mic, a spot per head — start about 30–60 cm from that head’s working area, facing it.',
    kind: 'trial',
    src: 'LESSON-MARACAS',
    quote: 'audition two spots: one aimed at the working area of each head',
    surface: 'head.L.pair',
    c: STATES.pair.m[1].head,
    n: v3(1, 0, 0),
    side: v3(0, -1, 0),
    d: [300, 600],
    a: [0, 25],
    aimTol: 25,
    startD: 420,
    startA: 8,
    variants: ['pair'],
    micTypeIds: BOTH,
    bandProv: { kind: 'unknown', needed: 'the lesson gives no number for a per-head spot; 300–600 mm is the proposal’s drawing default' },
    tendency: 'The left hand on its own channel — check that it does not simply repeat the right-hand mic’s maraca, later.',
    checks: ['Both spots together, in mono', 'The other head’s spill', 'Stands outside both arcs'],
  }),
  targetZone({
    id: 'mar.centre.singer',
    label: 'Centred in front, a little above the heads (singer)',
    band: 'Start about 40–80 cm from the midpoint between the heads, centred in front, a little higher and angled down to the heads — which puts the singer’s mouth farther off the mic’s front than a low mic would.',
    kind: 'trial',
    src: 'LESSON-MARACAS',
    quote: 'Place the two microphones and performer to reduce unwanted pickup without asking the singer to sacrifice vocal mic technique.',
    surface: 'p0.singer',
    c: PM,
    n: v3(1, 0, 0),
    side: v3(0, -1, 0),
    d: [NEAR, FAR],
    a: [10, 35],
    aimTol: 25,
    startD: 560,
    startA: 22,
    variants: ['singer'],
    micTypeIds: BOTH,
    clear: { line: 'clear.singer', min: 120 },
    tendency: 'A cleaner maraca channel than the vocal mic gives — but the vocal mic still hears the maracas. Check vocal intelligibility and the two mics together.',
    checks: ['The vocal mic’s maraca spill', 'Both mics together, in mono', 'The singer’s real movements'],
  }),
];
