/**
 * FIGURE V2 — PLAN MARKERS (wave 6 of D78, 2026-11-24): the poses the setting
 * plans' small people take in the approved top view. Pure: no React, no Skia.
 *   • `standingAbovePose`: a standing person from above (the arms hanging, so
 *     only the shoulders, back and head show), the neck at the origin, facing
 *     +v — the old "shoulders and a head" marker's replacement (a singer at a
 *     mic, an accompanist, a neighbour on a stage plan);
 *   • players with their hands on the instrument, in each plan's own frame
 *     (the hands where the old marker's arms ended; nothing the learner reads
 *     moves): the hand drummer, the keyboard player, the clavinet player, the
 *     steel guitarist.
 * Hands on keys or drumheads are the approved relaxed hand from above
 * ('restTop': the back of the hand, the fingers gently curled onto the
 * surface); a hand round a bar is the approved fist from above ('backTop').
 */
import type { PlayerPose, Pt } from '../players/playerPose.ts';
import type { TopPlayer } from './elsewhereTop';
import { CAST, type CastId, type CastMember } from './cast';

const P = (u: number, v: number): Pt => ({ u, v });

const standing = new Map<string, PlayerPose>();
/** A standing 'above' pose round the neck at the origin, facing +v; `narrow`: shoulders 300 mm apart. */
export function standingAbovePose(narrow = false): PlayerPose {
  const key = narrow ? 'n' : 's';
  const hit = standing.get(key);
  if (hit) return hit;
  const sh = narrow ? 150 : 176;
  const L = (right: number, fwd: number): Pt => P(-right, fwd);
  const pose: PlayerPose = {
    view: 'above',
    posture: 'standing',
    facing: Math.PI / 2,
    head: { c: L(0, 18), r: 110 },
    neck: L(0, 0),
    shoulderR: L(sh, -6),
    shoulderL: L(-sh, -6),
    elbowR: L(sh + 20, -8),
    elbowL: L(-sh - 20, -8),
    handR: { wrist: L(sh + 22, -6), dir: Math.PI / 2, kind: 'rest' },
    handL: { wrist: L(-sh - 22, -6), dir: Math.PI / 2, kind: 'rest' },
    hipR: L(106, -6),
    hipL: L(-106, -6),
    kneeR: L(110, 6),
    kneeL: L(-110, 6),
    footR: L(104, 70),
    footL: L(-104, 70),
    floor: null,
  };
  standing.set(key, pose);
  return pose;
}

/** Players facing +u (the old markers' frame: the head at the marker's point, the player's left toward −v). */
const memo = new Map<string, TopPlayer>();
const keep = (key: string, make: () => TopPlayer): TopPlayer => {
  const hit = memo.get(key);
  if (hit) return hit;
  const p = make();
  memo.set(key, p);
  return p;
};

/** The hand-drum family's plan player (HandPlan 'player', PLAYER_TOP): standing behind the drums, both hands
 *  flat on the heads where the old marker's arms reached (u + 300, ±150). `u, v`: the marker's point. */
export const handDrumPlayer = (u: number, v: number): TopPlayer =>
  keep(`hd${u},${v}`, () => ({
    neck: P(u - 8, v),
    facing: 0,
    R: { elbow: P(u + 110, v + 240), at: P(u + 330, v + 150), along: P(1, -0.12), thumb: -1, kind: 'rest' },
    L: { elbow: P(u + 110, v - 240), at: P(u + 330, v - 150), along: P(1, 0.12), thumb: 1, kind: 'rest' },
  }));

/** A player at a keyboard (the keys plan, the clavinet): the head at the origin, seated (no legs drawn: the
 *  marker shows the upper body over the bench), the hands flat on the keys `front` mm ahead (the keybed's
 *  front edge), `half` either side of the keyboard's center line `cv`. */
export const keysPlayer = (front: number, cv: number, half = 190): TopPlayer =>
  keep(`k${front},${cv},${half}`, () => ({
    neck: P(-18, 0),
    facing: 0,
    R: { elbow: P(70, 235), at: P(front + 70, cv + half), along: P(1, -0.15), thumb: -1, kind: 'rest' },
    L: { elbow: P(70, -235), at: P(front + 70, cv - half), along: P(1, 0.15), thumb: 1, kind: 'rest' },
  }));

/** The steel guitarist (BacklinePlan 'steel'): seated, the left hand's fist round the bar across the strings,
 *  the right hand's picking fingers over them (the old marker's hands at u 400, v −215 / +205). */
export const STEEL_TOP_PLAYER: TopPlayer = {
  neck: P(-18, 0),
  facing: 0,
  seated: true,
  R: { elbow: P(190, 245), at: P(420, 190), along: P(1, -0.2), thumb: -1, kind: 'rest' },
  L: { elbow: P(190, -245), at: P(400, -215), along: P(1, 0), thumb: 1, sx: 0.8 },
};

/* ── who stands where a screen places people itself ── */

/** People a screen places by number (a choir on a riser, the performers a learner puts on a stage plot):
 *  the cast in a fixed turn — women and men alternating, neighbours always two people — so the same
 *  place is always the same person. */
export const CAST_IN_TURN: readonly CastId[] = ['ana', 'kofi', 'mei', 'drummer', 'ruth'];
export const castInTurn = (i: number): CastMember => CAST[CAST_IN_TURN[((i % CAST_IN_TURN.length) + CAST_IN_TURN.length) % CAST_IN_TURN.length]];
/** The person for a learner's own object (by its id: the same object, the same person, every time). */
export function castForKey(key: string): CastMember {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  return castInTurn(Math.abs(h));
}

