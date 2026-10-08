/**
 * I04 HEADLESS TAMBOURINE AND JINGLES — the technical truth (charter §2 layer
 * 1). Keys point into docs/labs/miking/headless_tambourine/SOURCES.md and
 * shaker/SOURCES.md §0; geometry from headless_tambourine/GEOMETRY_PROPOSAL.md:
 * the M08 scene (frame H, the held centre (0, h 1150, 0), the 45° hold) with
 * NO head, a ring / crescent switch, and the small-percussion family rules.
 *
 * FOUR STATES, each a POSE of one instrument (a centre, the ring's normal n,
 * the in-plane direction e1 toward the audience-and-down): SHAKEN (the ring,
 * side to side); STRUCK into the other hand; the CRESCENT, shaken; MOUNTED on a
 * stand clamp, struck with a stick.
 *
 * REFERENCE (BATCH2 §2, the survey flag closed): distances are "from the
 * instrument" at its normal playing position — its nearest frame point (the
 * maker's words, in both booklets); the lesson's "nearest stroke" is the
 * separate CLEAR readout, measured from the motion envelope.
 */
import type { Dim, DocumentedZone, Vec3, VariantId } from '../../engine/model/types.ts';
import { add, armTo, drawingDefault, IN, ill, mul, src, targetZone, v3, type Arm } from '../shared/smallperc/geom.ts';

export const TMB_DIMS = {
  d: { mm: 10 * IN, prov: src('MEINL-MTA1', 'Diameter: 10″') } as Dim,
  depth: drawingDefault(45, 'the ring’s frame depth'),
  frameT: drawingDefault(7, 'the frame’s thickness'),
  slots: drawingDefault(8, 'jingle slots in the single row'),
  jingleD: drawingDefault(50, 'jingle disc diameter'),
  crescentR: drawingDefault(140, 'the crescent’s outer radius'),
  crescentW: drawingDefault(40, 'the crescent frame’s width'),
  holdH: drawingDefault(1150, 'the held instrument’s height in front of the player'),
  mountH: drawingDefault(1000, 'a mounted ring’s height'),
  shake: { mm: 150, prov: ill('shake travel ±150 mm lateral (proposal)') } as Dim,
  strike: { mm: 200, prov: ill('a strike into the other hand: up to 200 mm toward it (proposal)') } as Dim,
  /** "One microphone placed 6 to 12 inches from instrument" (both booklets). */
  near: { mm: 6 * IN, prov: src('S-RECBK', 'Tambourine: One microphone placed 6 to 12 inches from instrument') } as Dim,
  far: { mm: 12 * IN, prov: src('S-RECBK', 'Tambourine: One microphone placed 6 to 12 inches from instrument') } as Dim,
} as const;

export const R = TMB_DIMS.d.mm / 2;
/** The jingles stand out past the frame this far (drawing default). */
export const JOUT = 12;

export type Pose = { c: Vec3; n: Vec3; e1: Vec3 };
const k = Math.SQRT1_2;
export type TmbId = 'shaken' | 'struck' | 'crescent' | 'mounted';
export type TmbState = { id: TmbId; pose: Pose; crescent: boolean; grip: Vec3; arm: Arm; off?: Arm; stick?: { a: Vec3; b: Vec3 } };

const HELD: Pose = { c: v3(0, -TMB_DIMS.holdH.mm, 0), n: v3(k, -k, 0), e1: v3(k, k, 0) };
const MOUNT: Pose = { c: v3(0, -TMB_DIMS.mountH.mm, 0), n: v3(0, -1, 0), e1: v3(1, 0, 0) };
/** The grip: the frame's player-side edge (the top-back of the 45° hold). */
const gripOf = (p: Pose, r: number): Vec3 => add(p.c, mul(p.e1, -(r - 8)));

function held(id: TmbId, crescent: boolean): TmbState {
  const r = crescent ? TMB_DIMS.crescentR.mm : R;
  const grip = gripOf(HELD, r);
  const arm = armTo('R', v3(grip.x - 92, grip.y + 12, grip.z + 30), grip);
  if (id !== 'struck') return { id, pose: HELD, crescent, grip, arm };
  // Struck into the other (left) hand: the open palm waits in front of the
  // ring's face, a little to the left.
  const palm = add(HELD.c, mul(HELD.n, 150));
  const off = armTo('L', v3(palm.x - 120, palm.y + 40, -150), v3(palm.x - 20, palm.y + 10, -70));
  return { id, pose: HELD, crescent, grip, arm, off };
}

export const STATES: Readonly<Record<TmbId, TmbState>> = {
  shaken: held('shaken', false),
  struck: held('struck', false),
  crescent: held('crescent', true),
  mounted: (() => {
    // The stick in the right hand, over the ring's player-side half.
    const tip = v3(-40, MOUNT.c.y - 6, 30);
    const hand = v3(-300, MOUNT.c.y - 230, 120);
    return { id: 'mounted' as const, pose: MOUNT, crescent: false, grip: hand, arm: armTo('R', v3(hand.x - 70, hand.y + 30, hand.z + 30), hand), stick: { a: hand, b: tip } };
  })(),
};
export const stateOf = (v: VariantId): TmbState => STATES[(['struck', 'crescent', 'mounted'].includes(v) ? v : 'shaken') as TmbId];

/** The instrument's front-most x (the frame and jingles toward the mic). */
export function frontX(s: TmbState): number {
  const r = s.crescent ? TMB_DIMS.crescentR.mm : R;
  return s.pose.c.x + (r + JOUT) * Math.abs(s.pose.e1.x) + (s.id === 'mounted' ? 0 : (TMB_DIMS.depth.mm / 2) * Math.abs(s.pose.n.x));
}
/** The instrument's top-most y (its highest frame point). */
export function topY(s: TmbState): number {
  const r = s.crescent ? TMB_DIMS.crescentR.mm : R;
  return s.pose.c.y - (r + JOUT) * Math.abs(s.pose.e1.y) - (TMB_DIMS.depth.mm / 2) * Math.abs(s.pose.n.y);
}

/** The motion envelope E (a capsule): the shake across, the strike toward
 *  the other hand, or the stick's reach over a mounted ring. */
export function motionOf(s: TmbState): { a: Vec3; b: Vec3; r: number } {
  const c = s.pose.c;
  const r = (s.crescent ? TMB_DIMS.crescentR.mm : R) + JOUT + 10;
  if (s.id === 'struck') return { a: c, b: add(c, mul(s.pose.n, TMB_DIMS.strike.mm)), r };
  if (s.id === 'mounted') return { a: v3(c.x - 90, c.y - 120, c.z - 40), b: v3(c.x - 90, c.y - 120, c.z + 40), r: R + 60 };
  return { a: v3(c.x, c.y, -TMB_DIMS.shake.mm), b: v3(c.x, c.y, TMB_DIMS.shake.mm), r };
}

const BOTH = ['orchSdc', 'smallDynCard'];
const NEAR = TMB_DIMS.near.mm;
const FAR = TMB_DIMS.far.mm;
const BAND = 'Start about 15–30 cm (6–12 in) from the tambourine itself, as it is played';

function zonesFor(s: TmbState): DocumentedZone[] {
  const v = s.id;
  const tag = { shaken: ' (shaken)', struck: ' (struck into the hand)', crescent: ' (crescent)', mounted: ' (mounted)' }[v];
  const fx = frontX(s);
  const ty = topY(s);
  const front = targetZone({
    id: `tmb.front.${v}`,
    label: `In front, facing the jingles${tag}`,
    band: `${BAND}, in front of it and roughly level, facing the jingles — outside the whole motion.`,
    kind: 'sourced',
    src: 'S-RECBK',
    quote: 'Tambourine: One microphone placed 6 to 12 inches from instrument',
    surface: `front.${v}`,
    c: v3(fx, s.pose.c.y, 0),
    n: v3(1, 0, 0),
    side: v3(0, -1, 0),
    d: [NEAR, FAR],
    a: [0, 30],
    aimTol: 35,
    startD: (NEAR + FAR) / 2,
    startA: 5,
    variants: [v],
    micTypeIds: BOTH,
    clear: { line: `clear.${v}`, min: 30 },
    tendency: 'The jingles’ sparkle and attack, focused. Check every accent and both ends of the swing — and, if it is too bright, try more distance or a different angle.',
    checks: ['The loudest accent and the whole swing', 'Brightness on the hardest strokes', 'Peaks on a peak meter'],
  });
  const above = targetZone({
    id: `tmb.above.${v}`,
    label: `Slightly above the playing zone${tag}`,
    band: `${BAND}, slightly above it and a little in front, looking down at the jingles — so a side-to-side motion changes the distance less.`,
    kind: 'trial',
    src: 'LESSON-TAMB-HL',
    quote: 'Place one mic slightly above or to the side of the normal playing zone, with the capsule facing the moving jingles',
    surface: `top.${v}`,
    c: v3(s.pose.c.x + (v === 'mounted' ? 60 : 0), ty, 0),
    n: v3(0, -1, 0),
    side: v3(1, 0, 0),
    d: [NEAR, FAR],
    a: v === 'mounted' ? [20, 45] : [25, 55],
    aimTol: 35,
    startD: (NEAR + FAR) / 2 + 20,
    startA: v === 'mounted' ? 32 : 40,
    aimAt: v3(s.pose.c.x, ty, 0),
    variants: [v],
    micTypeIds: BOTH,
    clear: { line: `clear.${v}`, min: 30 },
    tendency: 'A view down onto the jingles that a lateral shake passes under — the distance tends to change less than from the front. Check the hand and the arm stay clear.',
    checks: ['The arm and the hand below it', 'The level through a side-to-side shake', 'Peaks on the hardest strokes'],
  });
  if (v !== 'struck') return [front, above];
  // Struck into the hand, the space above and in front is the strike's own
  // path (toward the other hand): the lesson's other option, "to the side of
  // the normal playing zone", on the player's right, is used instead.
  const r = R + JOUT;
  const side = targetZone({
    id: 'tmb.side.struck',
    label: 'To the side of the playing zone (struck into the hand)',
    band: `${BAND}, to the side of the playing zone on the player’s right, facing the jingles — away from the strike’s path.`,
    kind: 'trial',
    src: 'LESSON-TAMB-HL',
    quote: 'Place one mic slightly above or to the side of the normal playing zone, with the capsule facing the moving jingles',
    surface: 'side.struck',
    c: v3(s.pose.c.x, s.pose.c.y, r),
    n: v3(0, 0, 1),
    side: v3(1, 0, 0),
    d: [NEAR, FAR],
    a: [0, 40],
    aimTol: 35,
    startD: (NEAR + FAR) / 2,
    startA: 20,
    variants: ['struck'],
    micTypeIds: BOTH,
    clear: { line: 'clear.struck', min: 30 },
    tendency: 'The jingles from the side, away from the strike toward the other hand — compare it with the front for brightness and steadiness.',
    checks: ['The right arm and the grip beside it', 'The strike’s path stays clear', 'Brightness against the front position'],
  });
  return [front, side];
}

/* ── SUGGESTED STARTING POINTS (lesson L12-L17; corrections HT-xx). ── */
export const TMB_ZONES: DocumentedZone[] = (['shaken', 'struck', 'crescent', 'mounted'] as const).flatMap((v) => zonesFor(STATES[v]));
