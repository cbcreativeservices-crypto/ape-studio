/**
 * THE PICKING HAND, PER INSTRUMENT (figure V2, wave 3 set 3c of D78,
 * 2026-11-24). Pure: no React, no Skia. The guitar family's right hand posed
 * bone by bone on the shared adult hand (players/handModel.ts), in the
 * instrument's frame G (x along the strings toward the neck, y across — the
 * bass side −y —, z off the top toward the audience), at the place the
 * lesson's model already puts the picking hand (guitarPlayer: the forearm on
 * the lower bout's upper edge, the hand over the strings at the arm
 * envelope's far end). How each is played (researched):
 *   flat        steel-string guitar, twelve-string, mandolin: a flat pick
 *               held between the thumb's pad and the side of the index's
 *               last joint, its point on the strings, the other fingers
 *               loosely curled (handPoses.pickFront, as passed);
 *   classical   nylon-string guitar, fingerstyle: the wrist arched over the
 *               strings, the index, middle and ring on the three treble
 *               strings, the thumb on a bass string AHEAD of them (toward
 *               the neck), the little finger relaxed beside the ring;
 *   fingerpicks round-neck resonator (bluegrass and blues fingerpicking):
 *               a thumb pick on a bass string, finger picks on the index and
 *               middle over the treble strings, the ring and little fingers
 *               planted on the top below the strings to steady the hand;
 *   banjo       five-string banjo (three-finger style): thumb and finger
 *               picks as above, the ring and little fingers planted on the
 *               head near the bridge;
 *   uke         ukulele strum: the hand loosely curled, the index finger a
 *               little out from the others, the back of its tip (the nail)
 *               brushing down across the strings where the neck meets the
 *               body, the thumb resting along the index's side;
 *   bass        acoustic bass guitar: the index and middle alternate
 *               plucking (a rest stroke: the index has plucked and rests on
 *               the next string toward the thumb), the thumb anchored on the
 *               lowest string toward the neck, ring and little relaxed.
 * Each hand's pads land on their strings (the tests read the misses).
 */
import { fitHand, h3, handFrame, v3, type HandSkeleton, type V3 } from '../players/handModel.ts';
import type { PlayerPose } from '../players/playerPose.ts';
import { solveArm3 } from '../figureV2/playersPlan.ts';
import type { GuitarScene } from './guitarModel.ts';

export type PickStyle = 'flat' | 'classical' | 'fingerpicks' | 'banjo' | 'uke' | 'bass';

/** A hand with what it plays: the flat pick's outline points, or the thumb pick and finger picks' pads. */
export type PickHand = { style: PickStyle; sk: HandSkeleton; pick: { a: V3; b: V3; tip: V3 } | null; picks: V3[]; /** the elbow in 3-D (the side picture's elbow, at the depth that gives an adult forearm) */ elbow: V3 };

/** A pad on a string: the pad's centre this far in front of the strings' plane. */
const PAD_OVER = 7;

const cache = new Map<string, PickHand>();

/** The right hand for a scene, the style the instrument is played with; `F` the scene's side pose (its posed pick hand). */
export function pickHandOf(sc: GuitarScene, style: PickStyle, F: PlayerPose): PickHand {
  const key = `${sc.variant.spec.id}|${sc.variant.id}|${sc.variant.posture}|${style}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const out = build(sc, style, F);
  cache.set(key, out);
  return out;
}

/** An adult forearm (mm, elbow to wrist). */
export const FOREARM = 255;
/** The elbow behind its picture point at the depth that gives the wrist an adult forearm (the forearm reaches
 *  forward from beside the body over the bout's edge to the strings: the picture shows it foreshortened); never
 *  farther back than `zMin` (the back of the body). */
export function elbowFor(e2: { u: number; v: number }, wrist: V3, zMin: number): V3 {
  const dxy = Math.hypot(wrist.x - e2.u, wrist.y - e2.v);
  const dz = Math.sqrt(Math.max(0, FOREARM * FOREARM - dxy * dxy));
  return v3(e2.u, e2.v, Math.max(zMin, wrist.z - dz));
}

/** How far the wrist stands from the middle of what the hand plays (mm): a hand that reaches its strings with
 *  the fingers gently curved, not clenched (a straight adult hand is ≈ 190 mm wrist to fingertip). */
const REACH: Record<PickStyle, number> = { flat: 112, classical: 128, fingerpicks: 124, banjo: 124, uke: 118, bass: 130 };
/** Each style's finger curl (the middle joints' natural bend) and how far the wrist may bend from the forearm. */
const CURL: Record<PickStyle, number> = { flat: 0.9, classical: 0.75, fingerpicks: 0.8, banjo: 0.8, uke: 0.85, bass: 0.7 };
const MAX_WRIST = 26;

function build(sc: GuitarScene, style: PickStyle, F: PlayerPose): PickHand {
  const g = sc.g;
  const f = sc.fit;
  const n = Math.max(2, g.spec.strings.courses);
  const zMin = f.head.c.z - 60;
  // where the hand plays (the arm envelope's far end, as the passed pick hand), the strings there
  const xp = Math.max(30, Math.min(f.arm.b.x + (style === 'uke' ? 0 : -10), g.edge - 40));
  const zs = g.h(xp) + 1.5;
  const half = Math.max(14, g.boardHalf(g.boardEnd) * 1.05);
  const sy = (s: number) => -half * 0.84 + (Math.round(s * (n - 1)) / (n - 1)) * half * 1.68;
  const onString = (x: number, s: number, lift = 0) => v3(x, sy(s), zs + PAD_OVER + lift);
  let pads: (V3 | { curl: number; abd?: number })[];
  let thumb: V3;
  let picks: V3[] = [];
  let pick: PickHand['pick'] = null;
  // THE PLAYING POINTS (researched; see the head of the file). The resting fingers are LOOSELY curled and
  // fanned a little (never clenched into a fist): their shapes and the knuckle row read from the audience.
  if (style === 'flat') {
    // the pick's point on the strings at their middle; pinched ≈ 14 mm above its point between the thumb's pad
    // (toward the audience) and the side of the index's last joint (behind it, toward the top)
    const C = v3(xp, sy(0.5), zs + 14);
    pads = [v3(C.x + 4, C.y + 6, C.z - 9), { curl: 0.55, abd: 0.08 }, { curl: 0.62, abd: 0.16 }, { curl: 0.7, abd: 0.26 }];
    thumb = v3(C.x + 2, C.y - 2, C.z + 9);
    // the pick: its face across the strings' way (it strikes them as the hand strums across), turned a little
    const w = h3.unit(v3(0.9, -0.42, 0));
    pick = { a: h3.add(C, h3.mul(w, -10)), b: h3.add(C, h3.mul(w, 10)), tip: v3(C.x, C.y, zs - 1) };
  } else if (style === 'classical') {
    pads = [onString(xp, 3 / 5), onString(xp - 4, 4 / 5), onString(xp - 10, 1), { curl: 0.55, abd: 0.12 }];
    thumb = onString(xp + 34, 0);
  } else if (style === 'fingerpicks' || style === 'banjo') {
    // (the planted fingers on the top/head, just below the treble strings, nearer the bridge)
    const plant = (dx: number, dy: number) => v3(xp + dx, half + dy, 8.5);
    pads = [onString(xp + 2, style === 'banjo' ? 0.75 : 0.6), onString(xp - 6, 1), plant(-22, 14), plant(-36, 22)];
    thumb = onString(xp + 30, style === 'banjo' ? 0.25 : 0.1);
  } else if (style === 'bass') {
    // (the index has plucked the D string and rests on the A; the middle comes over the D next)
    pads = [onString(xp - 2, 1 / 3), onString(xp - 8, 2 / 3, 6), { curl: 0.6, abd: 0.1 }, { curl: 0.7, abd: 0.2 }];
    thumb = onString(xp + 38, 0);
  } else {
    // uke: the index's tip brushing the middle strings (its back to them on the way down), the others curled
    // loosely behind it, the thumb along the index's side
    pads = [onString(xp, 0.5, 2), { curl: 0.85, abd: 0.04 }, { curl: 0.95, abd: 0.1 }, { curl: 1.05, abd: 0.18 }];
    thumb = onString(xp + 24, 0.2, 16);
  }
  // THE WRIST IN LINE WITH THE FOREARM: the hand reaches its playing points from the forearm's own line (the
  // forearm over the bout's edge from the elbow beside the body), the wrist bent no more than MAX_WRIST; of the
  // reaches that do it, the one whose pads land best (every pad on its string), the fingers least clenched.
  const targets = [...pads.filter((q): q is V3 => (q as V3).z !== undefined), thumb];
  const C0 = h3.mul(targets.reduce((a, b) => h3.add(a, b), v3(0, 0, 0)), 1 / targets.length);
  // THE ELBOW: an adult two-bone arm from the right shoulder (behind the instrument, at the head's depth) to
  // the wrist, the upper arm hanging down and a little back from the shoulder; the forearm then comes in over
  // the bout to the hand as a player's does. (It was solved toward the viewer from a picture point close to the
  // hand, so the arm came straight at the audience and the hand sat on a disc of sleeve.)
  const shoulder = v3(F.shoulderR.u, F.shoulderR.v, f.head.c.z);
  // (bent toward the lesson's own forearm envelope's start, where the forearm crosses the bout's edge)
  // (preferably lower, the upper arm hanging well down; a higher elbow only where the hand needs it)
  const HINTS = [v3(f.arm.a.x - 40, f.arm.a.y + 160, f.arm.a.z - 40), v3(f.arm.a.x - 80, f.arm.a.y + 60, f.arm.a.z)];
  let hint = HINTS[0];
  const elbowAt = (wrist: V3) => solveArm3(shoulder, wrist, hint).elbow;
  const solve = (reach: number) => {
    let wrist = v3(C0.x - 30, C0.y - half - 60, C0.z + 80);
    let elbow = elbowAt(wrist);
    for (let i = 0; i < 6; i++) {
      const u = h3.unit(h3.sub(C0, elbow));
      // (the hand over the strings, never through the top: the wrist at least ≈ 6 cm off it)
      wrist = h3.sub(C0, h3.mul(u, reach));
      if (wrist.z < zs + 58) wrist = v3(wrist.x, wrist.y, zs + 58);
      elbow = elbowAt(wrist);
    }
    const along = h3.unit(h3.sub(C0, wrist));
    // the back of the hand toward the audience and up (the fit turns it until every pad lands); the thumb
    // toward the neck (+x)
    const up = v3(0, -0.45, 1);
    const dorsal = h3.unit(h3.sub(up, h3.mul(along, h3.dot(up, along))));
    const f0 = handFrame(wrist, along, dorsal, v3(1, 0, 0));
    const sk = fitHand(f0, pads, thumb, { elbow, slide: 40, curl: CURL[style], maxWrist: MAX_WRIST, keep: (q) => (q.z.z < 0.3 ? 3000 * (0.3 - q.z.z) ** 2 : 0) });
    const miss = sk.miss.reduce((a, m) => a + m * m, 0);
    // (the elbow hangs: never raised out to the side toward the shoulder's height)
    const lift = Math.max(0, shoulder.y + 200 - elbow.y);
    // (nor swung far out to the side: the upper arm hangs near the body)
    const out = Math.max(0, shoulder.x - elbow.x - 110);
    const clench = sk.fingers.reduce((a, d) => a + Math.max(0, d.joints.length ? 0 : 0), 0);
    return { sk, elbow, cost: miss + clench + 0.02 * (reach - REACH[style]) ** 2 + (style === 'banjo' ? 0.01 : 0.04) * lift * lift + 0.02 * out * out };
  };
  let best = solve(REACH[style]);
  for (const [hi, h] of HINTS.entries()) {
    hint = h;
    for (let r = 84; r <= 172; r += 6) {
      const t = solve(r);
      t.cost += hi * 40;
      if (t.cost < best.cost) best = t;
    }
  }
  const sk = best.sk;
  if (style === 'fingerpicks' || style === 'banjo') picks = [sk.thumb.joints[3], sk.fingers[0].joints[3], sk.fingers[1].joints[3]];
  return { style, sk, pick, picks, elbow: best.elbow };
}

/** How far each pad that should touch a string misses it (mm), for the tests. */
export function pickMisses(h: PickHand): number[] {
  return h.sk.miss;
}
