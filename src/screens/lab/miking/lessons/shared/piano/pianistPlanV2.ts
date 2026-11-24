/**
 * THE PIANIST in the new look (figure V2, wave 3 set 3c of D78, 2026-11-24).
 * Pure: no React, no Skia.
 *
 * The same pianist the lesson places (pianoSpec.pianistAt: the bench, the head,
 * the keep-outs; the key fronts and the pedals), drawn as a cast member at the
 * keys the way a pianist sits and plays (the owner is a pianist):
 *   • the bench height and distance as the lesson sets them (seat 480 mm, its
 *     front edge 250 mm from the key fronts): the elbows hang a little in front
 *     of the body at about the height of the keys, the FOREARM LEVEL from the
 *     elbow to the wrist;
 *   • each hand ARCHED over the white keys, the wrist level with the knuckles,
 *     the fingers CURVED so each fingertip pad stands on its key (a five-finger
 *     position, one finger per white key, the right hand from middle C upward,
 *     the left hand an octave and a half below), the thumb lying along its key
 *     on its side, near the key's front;
 *   • the back upright, leaning a little forward from the hips, the head over
 *     the shoulders looking at the hands;
 *   • the right foot on the damper (right) pedal, heel on the floor, the ball of
 *     the foot on the pedal; the left foot flat on the floor beside it.
 * Each hand is ONE posed 3-D hand (players/handModel: each pad solved onto its
 * key, fitHand turning the hand until the pads land with a natural curl), drawn
 * in the approved hands' language (figureV2/familyHand). The arms are adult
 * two-bone arms from the shoulders (playersPlan.solveArm3). Nothing here moves
 * the piano, the bench, a keep-out or a measured point.
 */
import { BODY, pt, type PlayerPose } from '../players/playerPose.ts';
import { fingerFlexDeg, fitHand, handFrame, handOn, v3, type HandFrame, type HandSkeleton, type V3 } from '../players/handModel.ts';
import { solveArm3 } from '../figureV2/playersPlan.ts';
import { FLOOR_Y, KEY_TOP_Y, pianistAt } from './pianoSpec.ts';

/** A white key's width (mm) and how far in from the key fronts each pad plays (drawing defaults). */
export const WHITE_W = 23.5;
// (review 2026-11-24, KeysGuitar2: the pads a third of the way into the 150 mm white keys, just short of the black
// keys' fronts at 55 mm — never at the very front edge; the thumb, on its side along its key, a little nearer the
// front than the fingers)
// (review 2: the pads on the white keys' playing surface clear of the black keys — pad centre ≤ 45 mm, its
// ≈ 8 mm round edge short of the black keys' fronts at 55 mm — the middle reaching farthest, the little finger
// least; the thumb's tip about level with the index's middle joint)
const PAD_IN = { thumb: 2, index: 35, middle: 42, ring: 38, little: 25 } as const;
/** The end joint follows the middle joint gently on the keys (a pianist's finger, not a curling one). */
const DIP_K = 0.45;
/** The middle joint's bend and the end bone's slope on its key (degrees; KeysGuitar3 — were 40–58 and 50–80). */
const PIP_BAND = [30, 48] as const;
const SLOPE_BAND = [45, 68] as const;

const add = (a: V3, b: V3): V3 => v3(a.x + b.x, a.y + b.y, a.z + b.z);
const sub = (a: V3, b: V3): V3 => v3(a.x - b.x, a.y - b.y, a.z - b.z);
const mul = (a: V3, k: number): V3 => v3(a.x * k, a.y * k, a.z * k);
const unit = (a: V3): V3 => mul(a, 1 / (Math.hypot(a.x, a.y, a.z) || 1));

export type PianoArm = { side: 'R' | 'L'; shoulder: V3; elbow: V3; sk: HandSkeleton; /** where the sleeve ends: just past the hand's own wrist crease */ cuffEnd: V3; pads: V3[] };
export type Pianist3 = { R: PianoArm; L: PianoArm; side: PlayerPose; top: PlayerPose; ball: { u: number; v: number }; footSlope: number };

const cache = new Map<string, Pianist3>();

/**
 * ONE ARM AND HAND AT A KEYBOARD (any keyboard: the piano, the reed piano), solved in the player's own frame
 * and set into the picture's: `keyFront` the key fronts' x, `keyTop` the white keys' top (y down),
 * `facing` the way the player faces along x (+1 or −1; the player's right is +z when facing +x, −z when
 * facing −x — a real person turned round, never a mirror image), `side` the player's own R or L, `shoulder`
 * that shoulder in the picture's 3-D.
 */
export function keysArm(o: { keyFront: number; keyTop: number; facing: 1 | -1; side: 'R' | 'L'; shoulder: V3 }): PianoArm {
  const f = o.facing;
  const W = (lx: number, ly: number, lz: number): V3 => v3(o.keyFront + f * lx, ly, f * lz);
  const D = (lx: number, ly: number, lz: number): V3 => v3(f * lx, ly, f * lz);
  const side = o.side;
  const s = side === 'R' ? 1 : -1;
  const sh = o.shoulder;
  const top = o.keyTop;
  // five white keys: the right hand from ≈ 6 cm right of the player's middle up (middle C a little right of
  // the middle), the left an octave and a half below; the thumb on the key nearest the middle
  const z0 = side === 'R' ? 60 : -60;
  const zk = (k: number) => z0 + s * k * WHITE_W;
  // (each pad on its own key, a little toward the outer side of the hand's middle: five separate fingers fanned
  // over five keys, never drawn together)
  // (the little finger's pad toward the ring's side of its key: the two lie within a few millimetres of each
  // other along their first bones, as every neighbor does — never a wedge of air between them)
  const FAN = [0, 3, 0, -2, -5];
  const pad = (k: number, inn: number): V3 => W(inn, top - 6, zk(k) + s * FAN[k]);
  const fingers = [pad(1, PAD_IN.index), pad(2, PAD_IN.middle), pad(3, PAD_IN.ring), pad(4, PAD_IN.little)];
  // (the thumb short and thick along its key, pointing forward and a little in, its tip about level with the
  // index's middle joint, lying on its side; never below the key top, never splayed out)
  const thumb = W(PAD_IN.thumb, top - 11, zk(0) + s * 6);
  // the wrist a little below the knuckles (the back of the hand rising gently to the knuckle row), ≈ 12 cm
  // before the key fronts
  const wrist0 = W(-112, top - 50, zk(1.9));
  const along = unit(D(1, -0.12, 0));
  const dorsal = v3(0, -1, 0);
  const thumbSide = D(0, 0, -s);
  // the elbow: an adult arm from the shoulder to just behind the wrist, hanging a little forward and out
  // (by the side, not winged: the forearm then runs in to the hand at ≈ 15°, which the wrist takes up)
  const { elbow } = solveArm3(sh, sub(wrist0, mul(along, 20)), add(sh, D(40, 300, -s * 20)));
  // A PIANIST'S CURVED FINGER (review 2 2026-11-24, from above "snail shells"): the knuckle gently bent
  // (≈ 0–25°), the middle joint 40–58°, the end joint following gently (≤ 38°: the end bone stands at ≈ 50–75°
  // on its key with the pad on it, never curled back toward the palm); the knuckle row the arch's top; the wrist
  // level with the knuckles or a little below; the thumb along its key, its end joint never below the key top.
  const keepThumb = (fr: HandFrame) => {
    const h = handOn(fr, fingers, thumb, DIP_K);
    const tj = h.thumb.joints;
    const ipUp = top - tj[2].y;
    let c = Math.max(0, 10 - ipUp) ** 2 + Math.max(0, ipUp - 22) ** 2;
    for (const m of h.miss) c += 150 * Math.max(0, m - 1) ** 2;
    for (const d of h.fingers) {
      const fl = fingerFlexDeg(fr, d);
      // (KeysGuitar3, review 2026-11-24 from above at 10×: "short stubby lobes, nothing showing the finger dropping
      // onto the key" — the middle joint a little less bent (≈ 30–48°) so the finger runs out longer from the
      // knuckle, and the end bone sloping down at ≈ 45–68°, not standing upright: its nail-side top shows from above)
      c += 0.6 * (Math.max(0, fl.pip - PIP_BAND[1]) ** 2 + Math.max(0, PIP_BAND[0] - fl.pip) ** 2) + 0.6 * Math.max(0, fl.dip - 38) ** 2 + 0.3 * (Math.max(0, fl.mcp - 25) ** 2 + Math.max(0, -2 - fl.mcp) ** 2);
      // (the end bone's slope on its key, from the key's surface, the tip ahead of the end joint)
      const e = sub(d.joints[3], d.joints[2]);
      const slope = (Math.atan2(e.y, f * e.x) * 180) / Math.PI;
      c += 1.2 * (Math.max(0, slope - SLOPE_BAND[1]) ** 2 + Math.max(0, SLOPE_BAND[0] - slope) ** 2);
      // (each finger runs forward from its knuckle, the row only slightly fanned)
      c += 2 * Math.max(0, Math.abs(fl.spread) - 9) ** 2;
      c += 2 * Math.max(0, top - d.joints[0].y - 56) ** 2 + 2 * Math.max(0, d.joints[0].y - d.joints[1].y + 2) ** 2;
    }
    // (the hand pointing along the keys, the wrist turned out a little from the forearm as a pianist's is)
    c += 3000 * fr.x.z ** 2;
    // (the back of the hand level across, not rolled onto its side: the fingers curl straight down onto their keys)
    c += 3000 * fr.z.z ** 2;
    // (the wrist level with the middle knuckle or up to ≈ 2.5 cm below it, never above it)
    const mk = h.fingers[1].joints[0].y;
    c += 2 * Math.max(0, mk - fr.o.y) ** 2 + 2 * Math.max(0, fr.o.y - mk - 25) ** 2;
    return c;
  };
  const sk = fitHand(handFrame(wrist0, along, dorsal, thumbSide), fingers, thumb, { elbow, maxWrist: 22, slide: 30, curl: 0.85, dipRatio: DIP_K, keep: keepThumb });
  const cuffEnd = add(sk.frame.o, mul(unit(sub(sk.frame.o, elbow)), 16));
  return { side, shoulder: sh, elbow, sk, cuffEnd, pads: [thumb, ...fingers] };
}

/** The pianist at the keys whose fronts are at `xKey`, the pedals at `pedalX` (side u = x, v = y; top u = x, v = z). */
export function pianist3(xKey: number, pedalX: number): Pianist3 {
  const key = `${xKey}:${pedalX}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const pn = pianistAt(xKey, pedalX);
  const h = pn.head;
  const b = pn.bench;
  // (the side pose's shoulders: the lesson's own)
  const shR = v3(h.x - 20, h.y + 215, BODY.shoulderHalf);
  const shL = v3(h.x - 34, h.y + 205, -BODY.shoulderHalf);
  const arm = (side: 'R' | 'L'): PianoArm => keysArm({ keyFront: xKey, keyTop: KEY_TOP_Y, facing: 1, side, shoulder: side === 'R' ? shR : shL });
  const R = arm('R');
  const L = arm('L');
  const p2 = (q: V3) => pt(q.x, q.y);
  // THE SIDE POSE (the lesson's own body; the arms solved above; the near foot on the damper pedal)
  const hip = pt(b.x0 + 170, b.y - 85);
  const knee = pt(hip.u + 440, b.y - 105);
  // the right foot: the heel on the floor, the front of the foot (≈ 6 cm ahead of the drawn shoe's ball
  // point) on the damper pedal's tip, pressed (≈ 7 cm up): the sole rises ≈ 26°
  const FOOT_SLOPE = 0.45;
  const ball = { u: pedalX - 190 - 60 * Math.cos(FOOT_SLOPE), v: FLOOR_Y - 100 * Math.sin(FOOT_SLOPE) };
  const side: PlayerPose = {
    view: 'side',
    posture: 'seated',
    facing: 1,
    head: { c: pt(h.x, h.y), r: pn.headR },
    neck: pt(h.x - 20, h.y + 160),
    shoulderR: p2(shR),
    shoulderL: p2(shL),
    elbowR: p2(R.elbow),
    elbowL: p2(L.elbow),
    handR: { wrist: p2(R.cuffEnd), dir: 0.06, kind: 'keys' },
    handL: { wrist: p2(L.cuffEnd), dir: 0.06, kind: 'keys' },
    hipR: hip,
    hipL: pt(hip.u - 10, hip.v - 4),
    kneeR: knee,
    // (the far knee a little back and the far foot flat behind the near one: two legs read from the side)
    kneeL: pt(knee.u - 75, knee.v - 6),
    footR: pt(ball.u, ball.v),
    footL: pt(pedalX - 300, FLOOR_Y),
    floor: FLOOR_Y,
  };
  // FROM ABOVE (authored chest toward +v round the neck, turned to face +x: local (right, fwd) → world (n.u + fwd, right))
  const n = pt(h.x - 10, 0);
  const L2 = (right: number, fwd: number) => pt(n.u - right, n.v + fwd);
  const A = (q: V3) => L2(q.z, q.x - n.u);
  const topPose: PlayerPose = {
    view: 'above',
    posture: 'seated',
    facing: 0,
    head: { c: L2(0, -18), r: pn.headR },
    neck: n,
    shoulderR: A(shR),
    shoulderL: A(shL),
    elbowR: A(R.elbow),
    elbowL: A(L.elbow),
    handR: { wrist: A(R.cuffEnd), dir: Math.PI / 2, kind: 'above' },
    handL: { wrist: A(L.cuffEnd), dir: Math.PI / 2, kind: 'above' },
    hipR: L2(106, -40),
    hipL: L2(-106, -40),
    kneeR: L2(130, 430),
    kneeL: L2(-130, 430),
    footR: L2(140, 500),
    footL: L2(-140, 500),
    floor: null,
  };
  const out = { R, L, side, top: topPose, ball, footSlope: FOOT_SLOPE };
  cache.set(key, out);
  return out;
}
