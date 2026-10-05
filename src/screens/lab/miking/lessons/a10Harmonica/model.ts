/**
 * A10 HARMONICA (acoustic and amplified) — the technical truth (charter §2
 * layer 1): where everything is, as numbers with their provenance. The
 * learner sees starting points only (owner ruling 2026-10-04); `src`,
 * `quote` and every `prov` are the internal record
 * (docs/labs/miking/harmonica/SOURCES.md, GEOMETRY_PROPOSAL.md).
 *
 * ONE WORLD, TWO PLACES ON ONE STAGE. The lesson compares separate signal
 * paths (lesson L8): a stand mic at the acoustic harmonica, and a mic on the
 * harp AMP's speaker. The amp is the speaker family's guitar-type combo
 * (shared/speakers/ampModel.ts, the proposal's default amp), reused
 * UNCHANGED in its own frame C — so the WORLD frame IS frame C: origin at the
 * speaker's centre on the baffle's front plane, +x out of the amp toward the
 * audience, +y DOWN, +z to the right of a player facing +x (the engine's
 * convention). The player stands in front of the amp and off its axis (so
 * the amp is heard without pointing at the cupped mic, lesson L37), facing
 * the audience (+x).
 *
 * FRAME H (the proposal's harmonica frame), placed in the world: origin H0 =
 * the centre of the harmonica's hole face (the mouth side), +x out of the
 * back of the harmonica toward the hands and a mic, +z along the comb
 * toward hole 10 (the player's right). The proposal's +y is the same. The
 * mouth is a drawing default above the shared floor.
 */
import type { Dim, Provenance, Vec3 } from '../../engine/model/types.ts';
import { cabDraw } from '../shared/speakers/cabGeometry.ts';
import { HARMONICA } from '../shared/freereed/freeReedSpec.ts';
import type { ProfilePose } from '../shared/freereed/PlayerProfile';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const placeholder = (mm: number, needed: string): Dim => ({ mm, prov: { kind: 'unknown', needed }, placeholder: true });

/** The combo amp's drawing (frame C): its box and the floor it stands on. */
export const AMP = cabDraw('combo12', 'open');
export const FLOOR_Y = AMP.floorY;

/** Where the player stands on the stage, in front of the amp and off its axis. */
export const STAGE = {
  /** H0's distance in front of the amp's baffle (x) and to its left (z). */
  x: placeholder(1350, 'where the player stands: 1.35 m in front of the amp (a drawing default)'),
  z: placeholder(-750, 'where the player stands: 0.75 m to the amp’s left, off its axis (a drawing default)'),
  /** The floor wedge downstage of the player, facing back at them. */
  wedgeX: placeholder(2100, 'the floor wedge 0.75 m downstage of the player (a drawing default)'),
} as const;

/** H0, the centre of the harmonica's hole face, in the world. */
export const H0: Vec3 = { x: STAGE.x.mm, y: FLOOR_Y - HARMONICA.mouthH.mm, z: STAGE.z.mm };
/** The harmonica's own sizes. */
export const HL = HARMONICA.length.mm;
export const HD = HARMONICA.depth.mm;
export const HH = HARMONICA.height.mm;

/** Hand chamber states (the sound page; the drawing changes, nothing else). */
export type HandState = 'open' | 'half' | 'cupped' | 'mic';
export const HAND_STATES: readonly { id: HandState; label: string; short: string; text: string }[] = [
  { id: 'open', label: 'OPEN HANDS', short: 'OPEN', text: 'The hands hold the harmonica loosely and open toward the front: the sound from the back of the cover plates goes straight out.' },
  { id: 'half', label: 'PARTLY CUPPED', short: 'PARTLY', text: 'The hands close round the back of the harmonica, leaving an opening at the front: a small chamber the sound passes through.' },
  { id: 'cupped', label: 'FULLY CUPPED', short: 'CUPPED', text: 'The hands close the chamber almost completely. Opening and closing it as they play is the “hand wah” — part of the player’s sound.' },
  { id: 'mic', label: 'CUPPED ROUND A HARP MIC', short: 'HARP MIC', text: 'A bullet-shaped harp mic is held against the back of the harmonica and the hands close round both: one chamber, harmonica and mic together. That chamber is part of the amplified sound.' },
];

/**
 * The player in profile (the side view, u = x, v = y), every joint a
 * drawing default (no source gives a player's geometry), placed so the lips
 * meet the hole face at H0 and the hands fit inside the hands' envelope.
 */
export function profilePose(): ProfilePose {
  const P = (u: number, v: number) => ({ u: H0.x + u, v: H0.y + v });
  return {
    head: { c: P(-90, -41), r: 110 },
    neck: P(-128, 78),
    shoulder: P(-146, 138),
    elbowNear: P(-76, 392),
    wristNear: P(8, 150),
    elbowFar: P(-104, 380),
    wristFar: P(-6, 146),
    hip: P(-160, 600),
    kneeNear: P(-128, 1040),
    ankleNear: P(-142, 1478),
    kneeFar: P(-176, 1036),
    ankleFar: P(-196, 1478),
    floor: FLOOR_Y,
  };
}

/** The joints the collision solids follow (the same drawing defaults). */
export const BODY = {
  headC: { x: H0.x - 90, y: H0.y - 41, z: H0.z },
  shoulderY: H0.y + 138,
  hipY: H0.y + 600,
  backX: H0.x - 270,
  chestX: H0.x - 20,
  halfW: 200,
  prov: ill('a standing adult’s proportions round the drawn player (a drawing default)'),
} as const;

/** The breath stream leaving the back of the harmonica (drawn, never a keep-out). */
export const BREATH = { half: HARMONICA.breathHalf.mm, len: HARMONICA.breathLen.mm };
