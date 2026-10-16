/**
 * FREE REEDS — THE HANDS ON THE INSTRUMENT (figure pass 3, owner 2026-10-15:
 * "check that the hand is correctly positioned, placed, bent, fingers and
 * digits accounted for"). Pure: the art draws these very skeletons
 * (PlayerFigure.drawHand3) and the tests measure them (handCases).
 *
 * THE ACCORDION (A11, frame A: +x out of the chest toward the audience, +y
 * DOWN, +z the player's right; a LEFT-handed frame):
 *   • the RIGHT hand on the treble keyboard: the forearm along the treble
 *     side, the wrist near-straight and level with the keys, the back of the
 *     hand out to the right, the fingers pointing forward and curved down,
 *     every pad on a key of a chord (thumb C, index E, middle G, ring A,
 *     little the C above: a C6 voicing an octave wide), the thumb's knuckle a
 *     little above the keyboard's plane, its pad on the lowest key;
 *   • the LEFT hand through the bass strap: the strap across the back of the
 *     wrist, the palm on the bass side's end, the fingers pointing forward
 *     round toward the front corner, the index, middle and ring pads on the
 *     bass buttons, the little finger and the thumb resting (the thumb plays
 *     no bass button); the forearm works the bellows.
 * THE HARMONICA (A10, frame H round H0, the hole face's centre: +x out of
 * the back toward the hands, +y down, +z toward hole 10, the player's
 * right): the LEFT hand holds it — the thumb's pad under it, the index's pad
 * on top at the low end, the other fingers closed over the back of the cover
 * plates; the RIGHT hand cups round behind the left, the heel of the hand
 * against the left hand's heel, the fingers together over the left hand's
 * fingers. The cup opens and closes (open … fully cupped, round a harp mic).
 */
import { fitHand, h3, handFrame, handOn, v3, wristBendDeg, type HandFrame, type HandSkeleton, type V3 } from '../players/handModel.ts';
import { bassBoxAt, BODY, KEYS, TREBLE } from '../../a11Accordion/model.ts';
import { BULLET, HARMONICA } from './freeReedSpec.ts';

const { add, sub, mul, dot, unit, len } = h3;
const cross = (a: V3, b: V3): V3 => v3(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);

/** An adult arm (mm): upper arm, forearm (the house figure's). */
export const ARM3 = { upper: 300, fore: 255 } as const;

/** The elbow of a two-link arm from S to W, bent toward `pole`. */
export function elbow3(S: V3, W: V3, pole: V3, U: number = ARM3.upper, F: number = ARM3.fore): V3 {
  const d = sub(W, S);
  const L = Math.min(len(d), U + F - 1);
  const u = unit(d);
  const a = (U * U - F * F + L * L) / (2 * L);
  const hh = Math.sqrt(Math.max(0, U * U - a * a));
  const q = unit(sub(pole, mul(u, dot(pole, u))));
  return add(add(S, mul(u, a)), mul(q, hh));
}

export type PosedArm = { sk: HandSkeleton; S: V3; E: V3; W: V3 };

/**
 * A natural elbow for a hand raised to the mouth: the place round the
 * shoulder–wrist axis nearest a preferred elbow — down in front of the chest
 * and a little out to the arm's side, the forearm rising to the hand (as a
 * cup is held to the lips).
 */
export const HM_ELBOW = { L: v3(30, 330, -150), R: v3(60, 340, 140) } as const;
export function elbowNatural(S: V3, W: V3, side: 1 | -1): V3 {
  return elbow3(S, W, sub(side > 0 ? HM_ELBOW.R : HM_ELBOW.L, S));
}

/* ═══════════════ THE ACCORDION ═══════════════ */

/** The keys' pitch and a white key's centre (y), 0 = the top (lowest) key. */
const PITCH = (KEYS.y1 - KEYS.y0) / 24;
const keyY = (k: number) => KEYS.y0 + (k + 0.5) * PITCH;
/** The keyboard's face (z) and a pad's centre on a key (≈ 8 mm out from it). */
const KEY_Z = TREBLE.z1;
/** The chord (white keys from the top): thumb C, index E, middle G, ring A, little C. */
export const ACC_CHORD = { thumb: 9, fingers: [11, 13, 14, 16] } as const;
/** The right shoulder in frame A (the profile's shoulder; ≈ 190 mm out from the midline). */
export const ACC_SHOULDER_R: V3 = v3(BODY.headC.x - 60, BODY.shoulderY, 190);
export const ACC_SHOULDER_L: V3 = v3(BODY.headC.x - 60, BODY.shoulderY, -190);

let rightMemo: PosedArm | null = null;
/** THE RIGHT HAND on the treble keyboard (one pose: the keyboard doesn't move). */
export function accRightHand(): PosedArm {
  if (rightMemo) return rightMemo;
  // Pads on the white keys' playing ends (toward the front, clear of the
  // black keys at the chest end), the fingers' pads on a slight arc.
  const pads = ACC_CHORD.fingers.map((k, i) => v3([-40, -30, -32, -44][i], keyY(k), KEY_Z + 8));
  const thumb = v3(-62, keyY(ACC_CHORD.thumb), KEY_Z + 9);
  // The wrist behind the knuckles, out from the keyboard, level with the chord.
  const W0 = v3(-205, keyY(12.5) + 8, KEY_Z + 52);
  const start = handFrame(W0, v3(1, 0.1, -0.32), v3(0.25, -0.15, 1), v3(0, -1, 0));
  const S = ACC_SHOULDER_R;
  // The elbow hangs at the side, a little behind and out (the forearm along the treble side).
  const pole = v3(-0.4, 1, 0.35);
  let sk = fitHand(start, pads, thumb, { slide: 40, curl: 1.05 });
  for (let it = 0; it < 3; it++) {
    const E = elbow3(S, sk.frame.o, pole);
    sk = fitHand(sk.frame, pads, thumb, { slide: 25, curl: 1.05, elbow: E, maxWrist: 30, keep: (g) => 1500 * (1 - dot(g.z, start.z)) });
  }
  const W = sk.frame.o;
  rightMemo = { sk, S, E: elbow3(S, W, pole), W };
  return rightMemo;
}

/**
 * The bass side's end face for an opening: its top and bottom outer corners
 * (z, y), its outward normal (into −z, tilting as the bellows fan), and a
 * point on it: `at(f, x)` — f down the face (0 top … 1 bottom), x in frame A
 * (0 the front edge … TREBLE.x0 the back), `h` mm out from it.
 */
export function bassFace(top: number, bottom: number) {
  const b = bassBoxAt(top, bottom);
  const tz = b.ob.z - b.ot.z;
  const ty = b.ob.y - b.ot.y;
  const tl = Math.hypot(tz, ty) || 1;
  // Outward: away from the bellows (−z), square to the face (a face leaning
  // out at the bottom faces out and a little up).
  const N = v3(0, tz / tl, -ty / tl);
  const at = (f: number, x: number, h = 0): V3 => add(v3(x, b.ot.y + ty * f, b.ot.z + tz * f), mul(N, h));
  /** A world point's (f, g, h): down the face, front → back (0 … 1), out from it. */
  const coords = (p: V3) => {
    const rz = p.z - b.ot.z;
    const ry = p.y - b.ot.y;
    return { f: (rz * tz + ry * ty) / (tl * tl), g: p.x / TREBLE.x0, h: rz * N.z + ry * N.y };
  };
  return { b, N, at, coords, tl };
}

/** Where on the bass end the left hand works (figure pass 3; a real piano
 *  accordion's bass: the strap across the back of the wrist toward the back
 *  of the end, the fingers reaching the buttons toward its front corner). */
export const BASS_HAND = {
  /** Down the face (0 top … 1 bottom): the hand in its upper half. */
  f: 0.38,
  /** The strap's place front → back (0 … 1 of the end's depth). */
  strapG: 0.74,
  /** The button field, front → back (0 … 1). */
  buttons: [0.08, 0.5] as const,
} as const;

const leftMemo = new Map<string, PosedArm>();
/** THE LEFT HAND under the bass strap, for an opening (it rides on the bass side). */
export function accLeftHand(top: number, bottom: number): PosedArm {
  const key = `${Math.round(top)}:${Math.round(bottom)}`;
  const m = leftMemo.get(key);
  if (m) return m;
  const F = bassFace(top, bottom);
  const N = F.N;
  const f0 = BASS_HAND.f;
  const down = unit(sub(F.at(1, 0), F.at(0, 0)));
  // The hand flat along the face, its back out (under the strap), pointing
  // forward and a little down; the wrist under the strap.
  const W0 = F.at(f0, TREBLE.x0 * 0.86, 30);
  const along = unit(add(v3(1, 0, 0), mul(down, 0.12)));
  // A LEFT hand in frame A: toward the little finger = along × back; the thumb up.
  const start: HandFrame = (() => {
    const z = unit(sub(N, mul(along, dot(N, along))));
    return { o: W0, x: along, y: unit(cross(along, z)), z };
  })();
  // Pads on three bass buttons (index, middle, ring), the little finger and thumb at rest.
  const pad = (g: number, df: number) => F.at(f0 + df, TREBLE.x0 * g, 8);
  const pads = [pad(0.2, -0.07), pad(0.13, 0.0), pad(0.18, 0.07), { curl: 0.55 }];
  const sk0 = fitHand(start, pads, { yaw: 0.5, pitch: 0.2, mcp: 0.2, ip: 0.15 }, { slide: 30, curl: 1.0, keep: (g) => 2500 * (1 - dot(g.z, start.z)) + 600 * (1 - dot(g.x, along)) });
  const S = ACC_SHOULDER_L;
  const W = sk0.frame.o;
  const E = elbow3(S, W, v3(-0.5, 1, -0.4));
  const out = { sk: sk0, S, E, W };
  leftMemo.set(key, out);
  return out;
}

/** The posed arms' wrist bends (degrees), for the tests and the drawing. */
export const wristOfArm = (a: PosedArm) => wristBendDeg(a.sk, a.E);

/* ═══════════════ THE HARMONICA ═══════════════ */

/** The harmonica's size (frame H, round H0: x 0 … HD, y ±HH/2, z ±HL/2). */
const HM = { HD: HARMONICA.depth.mm, HH: HARMONICA.height.mm, HL: HARMONICA.length.mm } as const;
/** The shoulders in frame H round H0 (the profile's shoulder; the player centred on the harmonica). */
export const HM_SHOULDER_R: V3 = v3(-152, 186, 190);
export const HM_SHOULDER_L: V3 = v3(-152, 186, -190);
export type HmState = 'open' | 'half' | 'cupped' | 'mic';

const hmMemo = new Map<HmState, { L: PosedArm; R: PosedArm }>();
/** How far the right hand closes over the left (0 open … 1 fully cupped). */
const HM_CLOSE: Record<HmState, number> = { open: 0, half: 0.55, cupped: 1, mic: 1 };
/**
 * THE HANDS ROUND THE HARMONICA, for a chamber state (frame H round H0).
 * LEFT: the harp's left end in the web between thumb and index, the hand
 * pointing along it to the right — the index's pad on the top cover, the
 * thumb's pad under the bottom cover, the middle, ring and little fingers
 * curved over the top and down behind the back (the small resonating space;
 * with a harp mic, closed round the mic held against the back). The palm
 * toward the audience, the back of the hand toward the player's chin.
 * RIGHT: in front of it (toward the audience), the palm toward the
 * harmonica, the fingers together pointing up and across over the left
 * hand's fingers, the edge of the palm against the left hand's heel and
 * thumb — the cup; the thumb up along the harmonica's right end. Partly
 * cupped it swings out from the right; open it stands away.
 */
export function hmHands(state: HmState): { L: PosedArm; R: PosedArm } {
  const m = hmMemo.get(state);
  if (m) return m;
  const { HD, HH, HL } = HM;
  const mic = state === 'mic';
  const BR = BULLET.d.mm / 2;
  // LEFT hand: index on top, thumb under, the rest round the back (or the mic).
  const backX = mic ? HD + 2 + BULLET.l.mm * 0.42 : HD + 14;
  const backR = mic ? BR + 8 : 18;
  const lPads = mic
    ? [v3(13, -HH / 2 - 8, 6), v3(HD + 16, -BR - 8, 0), { curl: 0.75 }, { curl: 0.7 }]
    : [v3(13, -HH / 2 - 8, 6), v3(backX - 6, -backR, 2), { curl: 0.72 }, { curl: 0.68 }];
  const lThumb = v3(12, HH / 2 + 9, -8);
  const lStart = handFrame(v3(0, 34, -HL / 2 - 80), v3(0.2, -0.35, 1), v3(-1, -0.1, 0.1), v3(0, 1, 0));
  const SL = HM_SHOULDER_L;
    const keepL = (g: HandFrame) => 1500 * (1 - dot(g.z, lStart.z));
  let L = fitHand(lStart, lPads, lThumb, { slide: 50, curl: 1.0, keep: keepL });
  for (let it = 0; it < 2; it++) L = fitHand(L.frame, lPads, lThumb, { slide: 15, curl: 1.0, elbow: elbowNatural(SL, L.frame.o, -1), maxWrist: 50, keep: keepL });
  // RIGHT hand: in front, over the left fingers (closing with `c`).
  const c = HM_CLOSE[state];
  const front = (mic ? HD + BULLET.l.mm * 0.78 : HD + 40) + (1 - c) * 10;
  const rPads = [0, 1, 2, 3].map((i) => v3(front - 8 + i * 3 - (1 - c) * 10, -HH / 2 - 22 + i * 15 + (1 - c) * 6, 6 - i * 19 - c * 18 + (1 - c) * 40));
  const rThumb = v3(front - 26, -6, HL / 2 + 14 + (1 - c) * 20);
  const rStart = handFrame(v3(front + 6 + (1 - c) * 6, 110, 30 + (1 - c) * 55), v3(-0.15 - (1 - c) * 0.1, -1, -0.32 + (1 - c) * 0.4), v3(1, 0, 0.25 + (1 - c) * 0.5), v3(0, 0, 1));
  const SR = HM_SHOULDER_R;
    const keepR = (g: HandFrame) => 1500 * (1 - dot(g.z, rStart.z));
  const rGoal = state === 'open' ? [{ curl: 0.3 }, { curl: 0.3 }, { curl: 0.32 }, { curl: 0.35 }] : rPads;
  const rThumbGoal = state === 'open' ? { yaw: 0.55, pitch: 0.25, mcp: 0.15, ip: 0.15 } : rThumb;
  let R = fitHand(rStart, rGoal, rThumbGoal, { slide: 40, curl: 0.7, keep: keepR });
  for (let it = 0; it < 2; it++) R = fitHand(R.frame, rGoal, rThumbGoal, { slide: 15, curl: 0.7, elbow: elbowNatural(SR, R.frame.o, 1), maxWrist: 50, keep: keepR });
  const out = {
    L: { sk: L, S: SL, E: elbowNatural(SL, L.frame.o, -1), W: L.frame.o },
    R: { sk: R, S: SR, E: elbowNatural(SR, R.frame.o, 1), W: R.frame.o },
  };
  hmMemo.set(state, out);
  return out;
}

/* ═══════════════ the cases ═══════════════ */

export type HandCase = { name: string; sk: HandSkeleton; elbow: V3; contact: number[]; thumb?: string };

/** The bellows states the art draws (model.ts BELLOWS_STATES). */
const OPENINGS: readonly [string, number, number][] = [
  ['closed', 100, 100],
  ['half open', 175, 350],
  ['fully open', 264, 600],
];

export function handCases(): HandCase[] {
  const out: HandCase[] = [];
  const r = accRightHand();
  out.push({ name: 'A11 right hand on the keys', sk: r.sk, elbow: r.E, contact: [0, 1, 2, 3, 4], thumb: 'on the lowest key of the chord' });
  for (const [id, t, b] of OPENINGS) {
    const l = accLeftHand(t, b);
    out.push({ name: `A11 left hand on the bass (${id})`, sk: l.sk, elbow: l.E, contact: [0, 1, 2], thumb: 'loose' });
  }
  for (const st of ['open', 'half', 'cupped', 'mic'] as const) {
    const h = hmHands(st);
    out.push({ name: `A10 left hand holding the harmonica (${st})`, sk: h.L.sk, elbow: h.L.E, contact: [0, 1, 4], thumb: 'under the harmonica' });
    out.push({ name: `A10 right hand cupping (${st})`, sk: h.R.sk, elbow: h.R.E, contact: [], thumb: st === 'open' ? 'loose' : 'up along the right end' });
  }
  return out;
}
