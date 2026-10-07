/**
 * CLOSE AND SHARED MICS ON A SECTION'S PLAYERS (group 5: the horn section,
 * the big band, the percussion stations). Pure; tested
 * (test/mikingLab5Sections.test.ts). Frame S (frameS.ts).
 *
 * Every spot is a POSE (the mic's front, aimed at its target) built from a
 * seat: its TARGET (a bell, the third of the way up a sax, the gap between
 * two conga heads, the middle of two players), an APPROACH direction in the
 * player's own frame (ahead, to the player's right, up) and a distance. The
 * distances are the research's (DPA-TPT 30–50 cm, ROY-BRASS 1–2 ft, the
 * lesson's 30–60 cm sax trial and 0.8–1.2 m shared trial, S-REC's "just
 * above" the conga heads); the approach directions are drawing defaults
 * (CORRECTIONS_LOG.md G5-OR-*): slightly off the bell's axis, beside the sax
 * on the player's right, above and beside a trombone's slide.
 */
import type { MicPose, Vec3 } from '../../../engine/model/types.ts';
import { add, aimOf, DEG, dist, mul, planDir, sub, unit, v3 } from './frameS.ts';
import { KIND, soundPoint, STAND_LIFT, type Seat } from './seating.ts';

/** A seat's frame: ahead, to the player's right, up (unit vectors, frame S). */
export function frameOf(s: Seat): { fwd: Vec3; right: Vec3; up: Vec3 } {
  return { fwd: planDir(s.face), right: v3(Math.cos(s.face * DEG), 0, Math.sin(s.face * DEG)), up: v3(0, -1, 0) };
}
/** A direction in the player's frame (ahead, right, up), as a unit vector. */
export function inFrame(s: Seat, ahead: number, right: number, up: number): Vec3 {
  const f = frameOf(s);
  return unit(add(add(mul(f.fwd, ahead), mul(f.right, right)), mul(f.up, up)));
}
/** How high a seat's instrument is lifted when the player stands (big-band trumpets). */
export const liftOf = (s: Seat): number => (s.posture === 'standing' && KIND[s.kind].posture === 'seated' ? STAND_LIFT : 0);

/** The BELL a mic is placed from: a trumpet's (on its axis, ahead); a
 *  trombone's beside the player's head, to the left of the slide (the drawn
 *  bell: 520 mm ahead, 75 mm to the left — SeatingArt); a tuba's, up. */
export function bellOf(s: Seat): Vec3 {
  if (s.kind === 'trombone') {
    const f = frameOf(s);
    return add(add(add(s.p, mul(f.fwd, 520)), mul(f.right, -75)), v3(0, -(KIND.trombone.sound + liftOf(s)), 0));
  }
  if (s.kind === 'tuba') {
    // The drawn bell's mouth: 120 mm ahead, 70 mm to the right, 1.5 m up (SeatingArt).
    const f = frameOf(s);
    return add(add(add(s.p, mul(f.fwd, 120)), mul(f.right, 70)), v3(0, -1500, 0));
  }
  return soundPoint(s);
}

/** A spot `d` mm from `target`, approached along `dir` (unit, from the
 *  target toward the mic), aimed at the target. */
export function spotAt(target: Vec3, dir: Vec3, d: number): { pose: MicPose; p: Vec3; aim: Vec3; target: Vec3; dir: Vec3 } {
  const p = add(target, mul(dir, d));
  const aim = unit(sub(target, p));
  return { pose: { p, ...aimOf(aim) }, p, aim, target, dir };
}

/** The mean of some points. */
export function meanOf(pts: readonly Vec3[]): Vec3 {
  return mul(pts.reduce((a, b) => add(a, b), v3(0, 0, 0)), 1 / Math.max(1, pts.length));
}

/** The 3-to-1 ratio between two separate spots (mic-to-mic ÷ the larger
 *  mic-to-source distance; ≥ 3 meets it). Lab 5's one definition. */
export function ratio31(a: { p: Vec3; target: Vec3 }, b: { p: Vec3; target: Vec3 }): number {
  return dist(a.p, b.p) / Math.max(dist(a.p, a.target), dist(b.p, b.target));
}

/** The angle (degrees) between a spot's front and a point: how far off its axis a neighbour's bell arrives. */
export function offAxis(spot: { p: Vec3; aim: Vec3 }, q: Vec3): number {
  const d = unit(sub(q, spot.p));
  const c = d.x * spot.aim.x + d.y * spot.aim.y + d.z * spot.aim.z;
  return Math.acos(Math.max(-1, Math.min(1, c))) / DEG;
}
