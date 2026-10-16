/**
 * I05a COWBELL — the technical truth (charter §2 layer 1). Keys point into
 * docs/labs/miking/cowbell/SOURCES.md and shaker/SOURCES.md §0; geometry from
 * cowbell/GEOMETRY_PROPOSAL.md on the small-percussion family (§A).
 *
 * FRAME H (smallperc/geom.ts). TWO STATES: MOUNTED on a percussion stand's
 * clamp, the mouth toward the player (a drawing default, as on a kit), struck
 * on its top near the mouth with a stick; HANDHELD, held in the left palm by
 * the closed end, the mouth away from the player, struck with a stick in the
 * right hand. The bell's length 177.8 mm is the maker's "Height: 7″"; the
 * mouth and closed-end sections are drawing defaults.
 */
import type { Dim, DocumentedZone, Vec3, VariantId } from '../../engine/model/types.ts';
import { add, drawingDefault, IN, mul, src, targetZone, v3, type Arm } from '../shared/smallperc/geom.ts';
import { armFor, cradleHand, stickHand } from '../shared/smallperc/percGrip.ts';
import type { HandSkeleton } from '../shared/players/handModel.ts';

export const BELL_DIMS = {
  len: { mm: 7 * IN, prov: src('MEINL-SCL70B', 'Height: 7″') } as Dim,
  mouthW: drawingDefault(100, 'the mouth’s width'),
  mouthH: drawingDefault(60, 'the mouth’s height'),
  endW: drawingDefault(70, 'the closed end’s width'),
  endH: drawingDefault(40, 'the closed end’s height'),
  stick: { mm: 16 * IN, prov: src('VF-5A', 'a 16 in stick (the cymbal family’s stick envelope)') } as Dim,
  rise: drawingDefault(300, 'the stick’s rise above the bell between strokes'),
  mountH: drawingDefault(1000, 'a mounted bell’s height'),
  near: { mm: 200, prov: { kind: 'trial', src: 'LESSON-COWBELL', note: 'roughly 20–40 cm (8–16 in.) from a useful side/top view of the bell' } } as Dim,
  far: { mm: 400, prov: { kind: 'trial', src: 'LESSON-COWBELL', note: 'roughly 20–40 cm (8–16 in.) from a useful side/top view of the bell' } } as Dim,
  floor: { mm: 12 * IN, prov: src('S-HOME', 'Percussion – Aim the mic directly at the instrument, with a gap of at least 12” / 30cm.') } as Dim,
} as const;

export type BellId = 'mounted' | 'handheld';
export type BellState = {
  id: BellId;
  /** The bell's centre, and the unit vector from its closed end to its mouth. */
  c: Vec3;
  ax: Vec3;
  /** The stick: where it passes through the right hand, and the tip on the bell's top. */
  stick: { hand: Vec3; tip: Vec3 };
  arm: Arm;
  /** The left hand round the closed end (handheld). */
  holder?: Arm;
  /** The posed hands (figure pass 3): the stick hand, the holding hand. */
  hands: { stick: HandSkeleton; holder?: HandSkeleton };
};

const L = BELL_DIMS.len.mm;

/**
 * THE HANDS AND ARMS (figure pass 3, owner 2026-10-15; keep-outs re-derived
 * with the anatomy, owner decisions A): the stick held between the thumb and
 * the index finger, the other fingers wrapped, the palm down; the arm solved
 * back from that hand with the elbow hanging beside the body — so the
 * forearm reaches FORWARD in front of the chest (the wrists sat 80 mm behind
 * the chest's front, the forearm folded under the upper arm from above).
 * The grip is chosen so the stick reaches the same tip on the bell (≈ 250 mm
 * from the hand, the butt ≈ 110 mm behind it) with the wrist bent ≤ 40°.
 */
const STICK_GRIP: Record<BellId, { grip: Vec3; back: Vec3 }> = {
  mounted: { grip: v3(-90, -1110, 220), back: v3(0.3, -1, 0) },
  handheld: { grip: v3(-80, -1220, 190), back: v3(0, -1, -0.2) },
};

function state(id: BellId): BellState {
  if (id === 'mounted') {
    const c = v3(70, -BELL_DIMS.mountH.mm, 0);
    const ax = v3(-1, 0, 0); // the mouth toward the player
    const mouth = add(c, mul(ax, L / 2));
    const tip = v3(mouth.x + 26, c.y - BELL_DIMS.mouthH.mm / 2 - 4, 12);
    const { grip, back } = STICK_GRIP.mounted;
    const sk = stickHand(grip, tip, back);
    return { id, c, ax, stick: { hand: grip, tip }, arm: armFor('R', sk, grip), hands: { stick: sk } };
  }
  const c = v3(50, -1150, -40);
  const ax = v3(1, 0, 0); // the mouth away from the player
  const closed = add(c, mul(ax, -L / 2));
  const mouth = add(c, mul(ax, L / 2));
  const tip = v3(mouth.x - 30, c.y - BELL_DIMS.mouthH.mm / 2 - 4, c.z + 8);
  const { grip, back } = STICK_GRIP.handheld;
  const sk = stickHand(grip, tip, back);
  // The left hand under the closed end, palm up, pointing forward and across:
  // the fingers curled up the bell's right wall, the thumb on its left wall.
  const half = (x: number, a: number, b: number) => a + ((x - closed.x) / L) * (b - a);
  const hh = (x: number) => half(x, BELL_DIMS.endH.mm / 2, BELL_DIMS.mouthH.mm / 2);
  const hw = (x: number) => half(x, BELL_DIMS.endW.mm / 2, BELL_DIMS.mouthW.mm / 2);
  const pads = [22, 4, -14, -30].map((x) => v3(x, c.y + 2, c.z + hw(x) + 8.5));
  const rest = v3(-6, c.y + hh(-6), c.z - 25);
  const holderSk = cradleHand(rest, v3(0.6, 0, 0.8), pads, v3(6, c.y - 14, c.z - hw(6) - 9));
  return {
    id,
    c,
    ax,
    stick: { hand: grip, tip },
    arm: armFor('R', sk, grip),
    holder: armFor('L', holderSk, rest),
    hands: { stick: sk, holder: holderSk },
  };
}

export const STATES: Readonly<Record<BellId, BellState>> = { mounted: state('mounted'), handheld: state('handheld') };
export const stateOf = (v: VariantId): BellState => STATES[v === 'handheld' ? 'handheld' : 'mounted'];

/** The stick's envelope: from the tip on the bell up to its highest rise
 *  (toward the player), a capsule (sector ±20° and 300 above, proposal). */
export function motionOf(s: BellState): { a: Vec3; b: Vec3; r: number } {
  const up = v3(s.stick.tip.x - 70, s.stick.tip.y - BELL_DIMS.rise.mm, s.stick.tip.z + 40);
  return { a: s.stick.tip, b: up, r: 70 };
}

const BOTH = ['orchSdc', 'smallDynCard'];
const NEAR = BELL_DIMS.near.mm;
const FAR = BELL_DIMS.far.mm;
const BAND = 'Start about 20–40 cm (8–16 in) from the bell';

function zonesFor(s: BellState): DocumentedZone[] {
  const v = s.id;
  const tag = v === 'mounted' ? ' (mounted)' : ' (handheld)';
  return [
    targetZone({
      id: `bell.side.${v}`,
      label: `From the side, level with the bell${tag}`,
      band: `${BAND}, from the side away from the stick, level with it and facing it — outside every stroke and rebound.`,
      kind: 'trial',
      src: 'LESSON-COWBELL',
      quote: 'try a cardioid dynamic or condenser with its capsule roughly 20–40 cm (8–16 in.) from a useful side/top view of the bell',
      surface: `bellside.${v}`,
      c: s.c,
      n: v3(0, 0, -1),
      side: v3(1, 0, 0),
      d: [NEAR, FAR],
      a: [0, 35],
      aimTol: 30,
      startD: 300,
      startA: 12,
      variants: [v],
      micTypeIds: BOTH,
      clear: { line: `clear.${v}`, min: 60 },
      tendency: 'A view of the body and its ring with the stick’s attack a little to one side — closer tends to bring more attack and less room; farther, more of the decay.',
      checks: ['The stick and its rebound', 'Snare and cymbal spill', 'The hardest hit’s headroom'],
    }),
    targetZone({
      id: `bell.top.${v}`,
      label: `Above, looking down at the top face${tag}`,
      band: `${BAND}, above it and toward the side away from the player, looking down at the top face — clear of the stick’s rise.`,
      kind: 'trial',
      src: 'LESSON-COWBELL',
      quote: 'try a cardioid dynamic or condenser with its capsule roughly 20–40 cm (8–16 in.) from a useful side/top view of the bell',
      surface: `bell.${v}`,
      c: s.c,
      n: v3(0, -1, 0),
      side: v3(1, 0, 0),
      d: [NEAR, FAR],
      a: [25, 55],
      aimTol: 30,
      startD: 320,
      startA: 42,
      variants: [v],
      micTypeIds: BOTH,
      clear: { line: `clear.${v}`, min: 60 },
      tendency: 'More of the struck top face and the attack; check that the stick’s rise and every fill stay clear.',
      checks: ['The stick’s highest rise', 'The attack against the ring', 'Cymbals the mic now faces'],
    }),
  ];
}

/* ── SUGGESTED STARTING POINTS (lesson L19-L22; corrections CB-xx). ── */
export const BELL_ZONES: DocumentedZone[] = [...zonesFor(STATES.mounted), ...zonesFor(STATES.handheld)];
