/**
 * THE LOW-BRASS PLAYER'S HANDS ON THE INSTRUMENT (figure pass 3, owner
 * 2026-10-15: "check that the hand is correctly positioned, placed, bent,
 * fingers and digits accounted for"). The shared hand model
 * (players/handModel.ts) posed in the LESSON frame (+x the audience, +y DOWN,
 * +z the player's right) on what each hand plays:
 *
 *   HORN, left hand — index, middle and ring pads on the three rotary-valve
 *     levers (valves 1–3), the little finger resting in the finger hook, the
 *     thumb on the thumb (change) valve's lever; the palm toward the levers,
 *     the wrist straight-ish with the forearm.
 *   HORN, right hand — IN the bell: cupped, the fingers together, the thumb
 *     along the index, the back of the hand against the bell's far wall (the
 *     side away from the player's body, a little toward the top), the wrist
 *     at the rim.
 *   TUBA / EUPHONIUM, right hand — from the player's right, over the top-action
 *     pistons: the fingers arched DOWN onto the pearl buttons (index valve 1,
 *     the player's side … the tuba's little finger on valve 4; the
 *     euphonium's little finger free), the thumb in the thumb ring on the
 *     player's side of valve 1.
 *   TUBA, left hand — flat on the left of the bell branch, the fingers round
 *     its front; EUPHONIUM, left hand — the index on the side (4th) valve's
 *     button, the other fingers resting curled, the thumb free.
 *
 * Every wrist is the scene's own (J.wrist*): the hand turns about it until
 * its pads land (fitHand), so the arms' keep-outs and the drawing agree. Pure
 * (no React, no Skia): the anatomy test measures these very hands
 * (handCases).
 */
import type { Vec3 } from '../../../engine/model/types.ts';
import { curled, fitHand, h3, handFrame, handOn, v3, type HandSkeleton, type ThumbPose, type V3 } from '../players/handModel.ts';
import { brassScene, hornBellHold, type BrassScene, type Tube } from './lowBrassScene.ts';
import { EUPH, HORN, TUBA } from './lowBrassSpec.ts';

/** One posed hand and its arm. `contact`: the digits (0 index … 3 little,
 *  4 thumb) whose pads are ON what they play. */
export type PosedHand = { sk: HandSkeleton; shoulder: V3; elbow: V3; contact: number[]; thumb: 'lever' | 'ring' | 'free' | 'along' };
export type LowBrassHands = { L: PosedHand; R: PosedHand };

/** A pad's centre ≈ 8 mm off the surface it presses (the pad ≈ 8 mm round). */
const PAD = 8;

/** The point of a tube's drawn surface at height `y`, `phi` round its axis in
 *  the level plane (0 = +x the audience side, −π/2 = −z the player's left),
 *  `off` mm outside the metal. */
export function onTube(t: Tube, y: number, phi: number, off = PAD): V3 {
  const P = t.pts;
  let best = 0;
  for (let i = 1; i < P.length; i++) if (Math.abs(P[i].y - y) < Math.abs(P[best].y - y)) best = i;
  const i0 = Math.max(0, Math.min(P.length - 2, P[best].y > y === P[Math.min(P.length - 1, best + 1)].y > y ? best - 1 : best));
  const a = P[i0];
  const b = P[i0 + 1];
  const k = Math.abs(b.y - a.y) > 1e-6 ? Math.max(0, Math.min(1, (y - a.y) / (b.y - a.y))) : 0;
  const c = h3.add(a, h3.mul(h3.sub(b, a), k));
  const frac = (i0 + k) / (P.length - 1);
  const r = t.rr ? t.rr[0] + (t.rr[1] - t.rr[0]) * frac : t.r;
  return v3(c.x + Math.cos(phi) * (r + off), c.y, c.z + Math.sin(phi) * (r + off));
}

/* ── the horn ── */

/** The horn's left hand: the pads on the levers' spatulas (approached from
 *  the player's left), the little finger in the hook, the thumb on the
 *  thumb valve's spatula. */
function hornLeft(s: BrassScene): PosedHand {
  const J = s.J;
  const spat = (i: number) => h3.add(s.valves[i].c, s.valves[i].lever!);
  const onSpat = (p: Vec3) => h3.add(p, v3(-3, 0, -PAD));
  const pads = [onSpat(spat(1)), onSpat(spat(2)), onSpat(spat(3)), onSpat(s.hook!)];
  const thumb = onSpat(spat(0));
  // The palm toward the levers (+z), the back of the hand to the player's
  // left and a little up and back; index on top, the thumb above it.
  const D = h3.unit(v3(-0.25, -0.25, -1));
  const start = handFrame(J.wristL, v3(0.61, -0.61, 0.5), D, v3(0, -1, 0));
  const sk = fitHand(start, pads, thumb, { elbow: J.elbowL, maxWrist: 62, curl: 1.0, keep: (f) => 600 * (1 - h3.dot(f.z, D)) });
  return { sk, shoulder: J.shoulderL, elbow: J.elbowL, contact: [0, 1, 2, 3, 4], thumb: 'lever' };
}

/** The horn's right hand in the bell: cupped, fingers together, the thumb
 *  along the index, the back of the hand on the far wall. */
function hornRight(s: BrassScene): PosedHand {
  const J = s.J;
  const h = hornBellHold(s.bell);
  const f = handFrame(h.wrist, h.along, h.dorsal, h.thumbSide);
  const cup = HORN_CUP;
  const sk = handOn(f, [0, 1, 2, 3].map((i) => curled(cup, (1.5 - i) * 0.015)), HORN_THUMB);
  return { sk, shoulder: J.shoulderR, elbow: J.elbowR, contact: [], thumb: 'along' };
}
/** How far the bell hand's fingers curl (0 straight … 1 a loose fist): a cup. */
export const HORN_CUP = 0.2;
/** The bell hand's thumb: close along the index, barely bent. */
const HORN_THUMB: ThumbPose = { yaw: 0.22, pitch: 0.1, mcp: 0.1, ip: 0.12 };

/* ── the tuba and the euphonium ── */

/** The right hand over the top-action pistons, the thumb in its ring. */
function pistonRight(s: BrassScene): PosedHand {
  const J = s.J;
  const top = s.valves.filter((q) => q.axis.y < -0.9);
  const btop = (q: (typeof top)[number]) => q.c.y - q.h / 2 - 34;
  const pads: (V3 | { curl: number })[] = top.map((q) => v3(q.c.x, btop(q) - PAD, q.c.z));
  while (pads.length < 4) pads.push({ curl: 0.55 });
  // The back of the hand up and out to the player's right; the thumb toward the player.
  const D = h3.unit(v3(0, -1, 0.5));
  const start = handFrame(J.wristR, s.spec.id === 'tuba' ? v3(0.57, -0.04, -0.82) : v3(0.21, -0.36, -0.91), D, v3(-1, 0, 0));
  const sk = fitHand(start, pads, s.thumbRing!, { elbow: J.elbowR, maxWrist: 62, curl: 1.0, keep: (f) => 500 * (1 - h3.dot(f.z, D)) });
  return { sk, shoulder: J.shoulderR, elbow: J.elbowR, contact: top.length >= 4 ? [0, 1, 2, 3, 4] : [0, 1, 2, 4], thumb: 'ring' };
}

/** The left hand: the tuba's flat on the bell branch, the fingers round its
 *  front; the euphonium's index on the side valve. */
function uprightLeft(s: BrassScene): PosedHand {
  const J = s.J;
  const side = s.valves.find((q) => q.axis.z < -0.9);
  if (side) {
    // The euphonium: the index pad on the 4th valve's button (it faces the
    // player's left), the other fingers resting curled, the thumb free.
    const btn = h3.add(side.c, h3.mul(side.axis, side.h / 2 + 34 + PAD));
    const D = h3.unit(v3(-0.1, -0.2, -1));
    const start = handFrame(J.wristL, h3.sub(btn, J.wristL), D, v3(0, -1, 0));
    const goals = [btn, { curl: 0.5 }, { curl: 0.58 }, { curl: 0.66 }];
    const thumb: ThumbPose = { yaw: 0.6, pitch: 0.5, mcp: 0.2, ip: 0.25 };
    const sk = fitHand(start, goals, thumb, { elbow: J.elbowL, maxWrist: 62, curl: 0.5, keep: (f) => 1500 * (1 - h3.dot(f.z, D)) });
    return { sk, shoulder: J.shoulderL, elbow: J.elbowL, contact: [0], thumb: 'free' };
  }
  // The tuba: the pads round the front-left of the bell branch, index on top.
  const branch = s.tubes.find((t) => t.id === 'branchArt')!;
  const ys = TUBA_LEFT.ys;
  const pads = TUBA_LEFT.phis.map((phi, i) => onTube(branch, ys[i], phi));
  const D = h3.unit(v3(-0.3, -0.2, -1));
  const start = handFrame(J.wristL, v3(0.56, -0.44, 0.7), D, v3(0, -1, 0));
  const sk = fitHand(start, pads, TUBA_LEFT.thumb, { elbow: J.elbowL, maxWrist: 62, curl: 0.8, keep: (f) => 600 * (1 - h3.dot(f.z, D)) });
  return { sk, shoulder: J.shoulderL, elbow: J.elbowL, contact: [0, 1, 2, 3], thumb: 'free' };
}
/** The tuba's left hand on the bell branch: each pad's height and its angle
 *  round the branch (0 = the front); the thumb lies along the branch's side,
 *  clear of the metal (≈ 15 mm off it). */
export const TUBA_LEFT: { ys: number[]; phis: number[]; thumb: ThumbPose } = { ys: [-958, -936, -914, -893], phis: [-0.35, -0.3, -0.28, -0.3], thumb: { yaw: 0.4, pitch: -0.25, mcp: 0.15, ip: 0.15 } };

const memo = new WeakMap<BrassScene, LowBrassHands>();
/** Both posed hands for a scene (memoised). */
export function lowBrassHands(s: BrassScene): LowBrassHands {
  const hit = memo.get(s);
  if (hit) return hit;
  const out: LowBrassHands = s.spec.id === 'horn' ? { L: hornLeft(s), R: hornRight(s) } : { L: uprightLeft(s), R: pistonRight(s) };
  memo.set(s, out);
  return out;
}

/** Every posed hand of the family, for the anatomy test (the tuba and the
 *  euphonium hold the same hands whichever way the bell points: one case each). */
export function handCases(): { name: string; sk: HandSkeleton; elbow: V3; contact: number[]; thumb?: 'behind' | 'free' | string }[] {
  const out: { name: string; sk: HandSkeleton; elbow: V3; contact: number[]; thumb?: string }[] = [];
  for (const [spec, o] of [[HORN, 'back'], [TUBA, 'up'], [EUPH, 'up']] as const) {
    const h = lowBrassHands(brassScene(spec, o));
    for (const side of ['L', 'R'] as const) out.push({ name: `${spec.id}.${side}`, sk: h[side].sk, elbow: h[side].elbow, contact: h[side].contact, thumb: h[side].thumb });
  }
  return out;
}
