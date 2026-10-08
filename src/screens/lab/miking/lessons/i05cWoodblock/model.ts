/**
 * I05c WOODBLOCK — the technical truth (charter §2 layer 1). Keys point into
 * docs/labs/miking/woodblock/SOURCES.md (and claves/ for PAS-ECV02) and
 * shaker/SOURCES.md §0; geometry from woodblock/GEOMETRY_PROPOSAL.md on the
 * small-percussion family (§A).
 *
 * FRAME H (smallperc/geom.ts). A slotted block, its length across the player
 * (z), its OPENING facing the audience (+x: PAS-ECV02 "The opening of the
 * wood block should face towards the audience when possible"). TWO STATES:
 * ON A TABLE — on a foam pad on a trap table (space underneath so it is not
 * muffled); HELD — in the left palm. The strike spot P is on the top face
 * "just off center of the middle of the wood block towards the opening".
 * Every size is a drawing default (no maker prints one).
 */
import type { Dim, DocumentedZone, Vec3, VariantId } from '../../engine/model/types.ts';
import { armTo, drawingDefault, IN, src, targetZone, v3, type Arm } from '../shared/smallperc/geom.ts';

export const WB_DIMS = {
  len: drawingDefault(190, 'woodblock length (no maker prints a size)'),
  depth: drawingDefault(65, 'woodblock depth'),
  h: drawingDefault(70, 'woodblock height'),
  slotLen: drawingDefault(140, 'the slot’s length'),
  slotT: drawingDefault(8, 'the slot’s height'),
  slotDepth: drawingDefault(45, 'how far the slot runs into the block'),
  foamT: drawingDefault(25, 'the foam pad’s thickness'),
  tableH: drawingDefault(900, 'the trap table’s height'),
  mallet: drawingDefault(350, 'the mallet’s length'),
  near: { mm: 250, prov: { kind: 'trial', src: 'LESSON-WOODBLOCK', note: 'around 25–50 cm (10–20 in.) from the block' } } as Dim,
  far: { mm: 500, prov: { kind: 'trial', src: 'LESSON-WOODBLOCK', note: 'around 25–50 cm (10–20 in.) from the block' } } as Dim,
  floor: { mm: 12 * IN, prov: src('S-HOME', 'Percussion – Aim the mic directly at the instrument, with a gap of at least 12” / 30cm.') } as Dim,
} as const;

export type WbId = 'table' | 'held';
export type WbState = {
  id: WbId;
  /** The block's centre. */
  c: Vec3;
  /** The strike spot on the top face, and the slot's mouth on the front. */
  spot: Vec3;
  slot: Vec3;
  /** The mallet: hand and head. */
  mallet: { hand: Vec3; head: Vec3 };
  arm: Arm;
  holder?: Arm;
};

const H = WB_DIMS.h.mm;
const DP = WB_DIMS.depth.mm;
const HEAD_R = 15;

function state(id: WbId): WbState {
  const cy = id === 'table' ? -(WB_DIMS.tableH.mm + WB_DIMS.foamT.mm + H / 2) : -1150;
  const cz = id === 'table' ? 0 : -10;
  const c = v3(0, cy, cz);
  const spot = v3(10, cy - H / 2, cz);
  const slot = v3(DP / 2, cy - 0.18 * H, cz);
  const head = v3(spot.x - 4, spot.y - HEAD_R, cz + 10);
  const hand = v3(head.x - 230, head.y - 190, 95);
  const out: WbState = { id, c, spot, slot, mallet: { hand, head }, arm: armTo('R', v3(hand.x - 82, hand.y + 30, hand.z + 25), hand) };
  if (id === 'held') out.holder = armTo('L', v3(-120, cy + 75, cz - 40), v3(-14, cy + H / 2 + 14, cz - 10));
  return out;
}

export const STATES: Readonly<Record<WbId, WbState>> = { table: state('table'), held: state('held') };
export const stateOf = (v: VariantId): WbState => STATES[v === 'held' ? 'held' : 'table'];

/** The mallet's stroke, rebound and a missed stroke (proposal: ±30° from the
 *  wrist, a 60 mm margin): a capsule from the strike spot up toward the hand. */
export function motionOf(s: WbState): { a: Vec3; b: Vec3; r: number } {
  return { a: v3(s.spot.x, s.spot.y - 20, s.spot.z), b: v3(s.spot.x - 130, s.spot.y - 280, s.spot.z + 60), r: 60 };
}

const BOTH = ['orchSdc', 'smallDynCard'];
const NEAR = WB_DIMS.near.mm;
const FAR = WB_DIMS.far.mm;
const BAND = 'Start about 25–50 cm (10–20 in) from the block';

function zonesFor(s: WbState): DocumentedZone[] {
  const v = s.id;
  const tag = v === 'table' ? ' (on a table)' : ' (held)';
  return [
    targetZone({
      id: `wb.surface.${v}`,
      label: `Above, looking at the playing surface${tag}`,
      band: `${BAND}, above and a little in front of it, looking down at the playing surface — outside the mallet’s whole path (the near end only where clearance allows).`,
      kind: 'trial',
      src: 'LESSON-WOODBLOCK',
      quote: 'audition a cardioid condenser or dynamic mic around 25–50 cm (10–20 in.) from the block, positioned to hear its body and playing surface while remaining outside the full beater path',
      surface: `surf.${v}`,
      c: s.spot,
      n: v3(0, -1, 0),
      side: v3(1, 0, 0),
      d: [NEAR, FAR],
      a: [20, 50],
      aimTol: 30,
      startD: 360,
      startA: 36,
      variants: [v],
      micTypeIds: BOTH,
      clear: { line: `clear.${v}`, min: 60 },
      tendency: 'More of the strike and the playing surface; check the mallet’s rebound and a missed stroke stay clear.',
      checks: ['The mallet’s rebound and a missed stroke', 'Attack against the hollow body', 'Adjacent clicks and spill'],
    }),
    targetZone({
      id: `wb.opening.${v}`,
      label: `In front, toward the opening${tag}`,
      band: `${BAND}, in front of it on the audience side, looking toward the opening — never into the slot.`,
      kind: 'trial',
      src: 'LESSON-WOODBLOCK',
      quote: 'compare a line of sight toward the playing surface with a line of sight more toward the opening',
      surface: `slot.${v}`,
      c: s.slot,
      n: v3(1, 0, 0),
      side: v3(0, -1, 0),
      d: [NEAR, FAR],
      a: [0, 25],
      aimTol: 30,
      startD: 360,
      startA: 6,
      variants: [v],
      micTypeIds: BOTH,
      clear: { line: `clear.${v}`, min: 60 },
      tendency: 'A different balance of attack, hollow body, room and neighbours than from above — not a rule that the opening sounds fuller; compare by ear.',
      checks: ['Attack against the hollow resonance', 'Neighbours the mic now faces', 'The mount’s own noises'],
    }),
  ];
}

/* ── SUGGESTED STARTING POINTS (lesson L20-L23; corrections WB-xx). ── */
export const WB_ZONES: DocumentedZone[] = [...zonesFor(STATES.table), ...zonesFor(STATES.held)];
