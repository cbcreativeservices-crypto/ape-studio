/**
 * I03a HANDHELD SHAKER — the technical truth (charter §2 layer 1). Keys point
 * into docs/labs/miking/shaker/SOURCES.md (§0 holds the rows every small-
 * percussion lesson shares); geometry from shaker/GEOMETRY_PROPOSAL.md §A–§B.
 *
 * FRAME H (smallperc/geom.ts): origin on the floor under the playing-zone
 * centre P0 (h 1150); +x toward the audience and the mic; +y DOWN; +z the
 * player's right. The player stands at −x and holds the shaker in the right
 * hand, its middle at P0.
 *
 * TWO STATES (the motion-direction choice, YMH-REC3): TOWARD — shaken
 * toward and away from the mic (the shell along x); SIDE TO SIDE — shaken
 * across it (the shell along z). The same grip, the same P0: only the
 * direction of the motion changes, which is the lesson's point.
 *
 * Owner ruling 2026-10-04: `src`, `quote`, every `prov` and the unknowns are
 * the internal record; the learner sees starting points only.
 */
import type { Dim, DocumentedZone, Vec3, VariantId } from '../../engine/model/types.ts';
import { armTo, drawingDefault, IN, P0, src, targetZone, v3, type Arm } from '../shared/smallperc/geom.ts';

export const SHK_DIMS = {
  /** Shell: a cylinder Ø 45 × 160 (small); the maker prints no size. */
  d: drawingDefault(45, 'shaker shell diameter (the maker prints no size)'),
  len: drawingDefault(160, 'shaker shell length'),
  /** The motion envelope: ±150 along the shake, ±60 across (proposal §B). */
  sweep: drawingDefault(150, 'the shake’s reach along its axis (±150 mm)'),
  across: drawingDefault(60, 'the motion envelope across the shake (±60 mm)'),
  /** The lesson's audition range, from the centre of the playing arc. */
  near: { mm: 300, prov: { kind: 'trial', src: 'LESSON-SHAKER', note: 'roughly 30–60 cm (1–2 ft) from the center of the playing arc' } } as Dim,
  far: { mm: 600, prov: { kind: 'trial', src: 'LESSON-SHAKER', note: 'roughly 30–60 cm (1–2 ft) from the center of the playing arc' } } as Dim,
  /** The maker's floor: "a gap of at least 12” / 30cm". */
  floor: { mm: 12 * IN, prov: src('S-HOME', 'Percussion – Aim the mic directly at the instrument, with a gap of at least 12” / 30cm.') } as Dim,
} as const;

export const R_SHELL = SHK_DIMS.d.mm / 2;
export const HALF = SHK_DIMS.len.mm / 2;

export type ShakerState = { id: 'toward' | 'side'; axis: Vec3; arm: Arm };

/** The right hand's grip and wrist per state (ILLUSTRATIVE posture). */
export const STATES: Readonly<Record<'toward' | 'side', ShakerState>> = {
  // The shell along x, held from its right side; the forearm from behind.
  toward: { id: 'toward', axis: v3(1, 0, 0), arm: armTo('R', v3(-88, -1128, 64), v3(0, -1146, 18)) },
  // The shell along z, held from above; the forearm points forward.
  side: { id: 'side', axis: v3(0, 0, 1), arm: armTo('R', v3(-96, -1166, 24), v3(-4, -1150, 0)) },
};
export const stateOf = (v: VariantId): ShakerState => STATES[v === 'toward' ? 'toward' : 'side'];

/** The motion envelope E as a capsule round the shake axis through P0. */
export function motionOf(s: ShakerState): { a: Vec3; b: Vec3; r: number } {
  const k = SHK_DIMS.sweep.mm - SHK_DIMS.across.mm;
  return { a: v3(P0.x - s.axis.x * k, P0.y, P0.z - s.axis.z * k), b: v3(P0.x + s.axis.x * k, P0.y, P0.z + s.axis.z * k), r: SHK_DIMS.across.mm };
}

const BOTH = ['orchSdc', 'smallDynCard'];
const NEAR = SHK_DIMS.near.mm;
const FAR = SHK_DIMS.far.mm;

function zonesFor(v: 'toward' | 'side'): DocumentedZone[] {
  const tag = v === 'toward' ? ' (shaken toward the mic)' : ' (shaken side to side)';
  return [
    targetZone({
      id: `shk.front.${v}`,
      label: `In front of the playing area${tag}`,
      band: 'Start about 30–60 cm (1–2 ft) from the middle of the playing area, in front of it and roughly level, facing where most strokes happen.',
      kind: 'trial',
      src: 'LESSON-SHAKER',
      quote: 'a small diaphragm condenser on a stand roughly 30–60 cm (1–2 ft) from the center of the playing arc is a practical audition range',
      surface: `p0.${v}`,
      c: P0,
      n: v3(1, 0, 0),
      side: v3(0, -1, 0),
      d: [NEAR, FAR],
      a: [0, 25],
      aimTol: 30,
      startD: 450,
      startA: 8,
      variants: [v],
      micTypeIds: BOTH,
      clear: { line: `clear.${v}`, min: 120 },
      tendency: v === 'toward' ? 'The pulse, with each forward stroke jumping out: the shaker comes closer on every accent. Listen for that level jump before you change anything else.' : 'A steadier level: the shaker stays about the same distance away through each stroke. Listen for the balance of the attack and the wash.',
      checks: ['The whole pattern, loudest and quietest gestures', 'Level jumps between strokes', 'Hand and grip noise; spill from neighbours'],
    }),
    targetZone({
      id: `shk.above.${v}`,
      label: `Higher, angled down into the arc${tag}`,
      band: 'Start about 30–60 cm from the middle of the playing area, higher than the shaker and angled down into the arc — clear of the arm, the face and the head.',
      kind: 'trial',
      src: 'LESSON-SHAKER',
      quote: 'Alter height and angle to change the balance of direct rattle, hand noise and neighboring instruments; the effect depends on the particular shaker and microphone.',
      surface: `p0.${v}`,
      c: P0,
      n: v3(1, 0, 0),
      side: v3(0, -1, 0),
      d: [NEAR, FAR],
      a: [30, 55],
      aimTol: 30,
      startD: 420,
      startA: 42,
      variants: [v],
      micTypeIds: BOTH,
      clear: { line: `clear.${v}`, min: 120 },
      tendency: 'A different balance of direct rattle, hand noise and neighbours than the level position — compare the two by ear with the same pattern.',
      checks: ['Hand and grip noise from above', 'Neighbours the mic now faces', 'The arm, face and head stay clear'],
    }),
  ];
}

/* ── RECOMMENDED STARTING POINTS (lesson L19-L24; corrections SH-xx). ── */
export const SHK_ZONES: DocumentedZone[] = [...zonesFor('toward'), ...zonesFor('side')];
