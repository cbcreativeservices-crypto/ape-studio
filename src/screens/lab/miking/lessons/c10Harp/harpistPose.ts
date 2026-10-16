/**
 * C10 HARP — THE HARPIST IN 3-D (art fix round 2, owner 2026-10-16: "the
 * harp hands are translucent blobs over the strings"). Pure: no React, no
 * Skia, so the tests measure the very harpist the art paints
 * (art.tsx → PlayerFigure, its hands by drawHand3).
 *
 * Frame H (harpSpec.ts): +x toward the audience (the pillar side), +y DOWN
 * (the floor at y = 0), +z the player's right; the strings in the plane
 * z = 0. The side view looks from the player's right (+z toward the viewer),
 * the top view from above (−y toward the viewer).
 *
 * THE SEATED HARPIST (ILLUSTRATIVE; every joint a drawing default, the adult
 * of the house figure): upright on the seat (harpistAt), the soundbox
 * between the knees, its back against the front of the RIGHT shoulder by
 * the collar, the head to the left of it (z −150) — from the player's right
 * the soundbox's top crosses the face, as it does on a real harp seen from
 * that side. The knees either side of the soundbox, the feet on the pedals
 * (the right foot on the right-hand pedals, in front of the base; the left
 * behind it).
 *
 * THE HANDS (harp technique): both hands play from either side of the
 * strings — the right hand on the player's right of the string plane (the
 * upper register, nearer the shoulder), the left on the left (lower, further
 * toward the pillar). Each is the shared adult hand (players/handModel.ts)
 * solved so its PADS rest on real strings: the thumb high on the highest
 * string of the four, then the index, middle and ring fingers each two
 * strings lower (a third apart, as a chord is placed), the fingers sloping
 * down from the thumb; the little finger is not used on the harp — it hangs
 * loosely curled beside the ring finger, off the strings. The palm faces the
 * strings, the back of the hand faces out, the wrist nearly straight with the
 * forearm; the elbows out to the sides, held up.
 */
import { fitHand, handOn, h3, wristBendDeg, type DigitGoal, type HandFrame, type HandSkeleton, type V3 } from '../shared/players/handModel.ts';
import { harpGeom, harpistAt, LEVER_PLAYER_SHIFT } from './harpSpec.ts';

/** The adult arm (mm): shoulder → elbow, elbow → wrist crease (the house figure's). */
export const HARP_ARM = { upper: 300, fore: 255 } as const;
/** A pad's centre off the string it rests on (the pad ≈ 8 mm round). */
const PAD = 8.5;

const v = (x: number, y: number, z: number): V3 => ({ x, y, z });

/** The seated harpist's body joints (frame H). */
export type Harpist3 = {
  head: { c: V3; r: number };
  neck: V3;
  shoulderR: V3;
  shoulderL: V3;
  hipR: V3;
  hipL: V3;
  kneeR: V3;
  kneeL: V3;
  footR: V3;
  footL: V3;
};

export function harpistBody(lever = false): Harpist3 {
  const h = harpistAt();
  const zc = h.head.z;
  const pedal: Harpist3 = {
    // The head upright over the shoulders, turned a little toward the
    // strings: just behind the soundbox's top, which crosses the face's front.
    head: { c: v(-832, h.head.y - 32, zc), r: h.headR },
    neck: v(-814, -1188, zc),
    // The right shoulder's front against the soundbox's back by the collar.
    shoulderR: v(-772, -1146, zc + 188),
    shoulderL: v(-808, -1140, zc - 188),
    hipR: v(-812, -640, zc + 92),
    hipL: v(-822, -644, zc - 92),
    // The knees either side of the soundbox's foot, the thighs sloping down
    // to them (hip → knee ≈ 450 mm); the shins ≈ 460 mm to the ankles.
    kneeR: v(-470, -540, 230),
    kneeL: v(-400, -536, -330),
    // The balls of the feet on the pedals (the right foot on the right-hand
    // pedals, raised a little on them; the left on the left-hand pedals).
    footR: v(-468, -14, 165),
    footL: v(-420, -14, -250),
  };
  if (!lever) return pedal;
  // The lever harp's player: the same body, seated lower and closer
  // (LEVER_PLAYER_SHIFT); the knees either side of the smaller soundbox, the
  // feet flat on the floor in front of the chair (no pedals).
  const { dx, dy } = LEVER_PLAYER_SHIFT;
  const m = (q: V3) => v(q.x + dx, q.y + dy, q.z);
  return {
    head: { c: m(pedal.head.c), r: pedal.head.r },
    neck: m(pedal.neck),
    shoulderR: m(pedal.shoulderR),
    shoulderL: m(pedal.shoulderL),
    hipR: m(pedal.hipR),
    hipL: m(pedal.hipL),
    kneeR: v(-300, -462, 215),
    kneeL: v(-238, -468, -330),
    footR: v(-420, 0, 170),
    footL: v(-370, 0, -230),
  };
}

/** The elbow of an adult arm from `s` to the wrist `w`, bent toward `pole`. */
export function harpElbow(s: V3, w: V3, pole: V3): V3 {
  const d = h3.sub(w, s);
  const L = Math.min(h3.len(d), HARP_ARM.upper + HARP_ARM.fore - 1);
  const u = h3.unit(d);
  const a = (HARP_ARM.upper ** 2 - HARP_ARM.fore ** 2 + L * L) / (2 * L);
  const hgt = Math.sqrt(Math.max(0, HARP_ARM.upper ** 2 - a * a));
  const p = h3.unit(h3.sub(pole, h3.mul(u, h3.dot(pole, u))));
  return h3.add(h3.add(s, h3.mul(u, a)), h3.mul(p, hgt));
}

export type HarpHand = {
  sk: HandSkeleton;
  elbow: V3;
  shoulder: V3;
  /** The strings (indices into harpGeom().strings) under the thumb, index, middle and ring pads. */
  strings: { thumb: number; index: number; middle: number; ring: number };
  /** Where each of those pads was placed (on its string, `side` of the plane). */
  targets: { thumb: V3; index: V3; middle: V3; ring: V3 };
  /** +1: the player's right of the strings (z > 0); −1 the left. */
  side: 1 | -1;
};

/** A point on string `i` at height `y` (the pad's centre `side` of the plane). */
function onString(lever: boolean, i: number, y: number, side: number): V3 {
  const g = harpGeom(lever);
  const s = g.strings[i];
  const yy = Math.max(s.y1 + 40, Math.min(s.y0 - 40, y));
  return v(s.x, yy, side * PAD);
}

/** The string nearest frame-H x. */
export function stringAt(lever: boolean, x: number): number {
  const g = harpGeom(lever);
  let best = 0;
  g.strings.forEach((s, i) => {
    if (Math.abs(s.x - x) < Math.abs(g.strings[best].x - x)) best = i;
  });
  return best;
}

/**
 * Where each hand plays (frame H): its thumb's string (the nearest to
 * `thumbX`) and the index pad's height `y`; the pads slope down from the
 * thumb (`dy`: thumb, index, middle, ring); the elbow bends toward `pole`
 * (out to the side and down — the elbows held out from the body).
 *
 * `frame`: the hand's place and set, FITTED ONCE at design time (the shared
 * hand model's `fitHand`, a sweep of starting sets scored for every pad on
 * its string, natural joint bends — knuckles 8–65°, middle joints 30–90°,
 * no finger at its spread limit — the wrist within 28° of the forearm, the
 * palm off the strings and the back of the hand away from them) and kept
 * here, so the app only places the digits (`handOn`, a few milliseconds).
 * The tests re-measure every pad, bend and wrist from it.
 */
type HandPlan = { side: 1 | -1; thumbX: number; y: number; dy: readonly [number, number, number, number]; pole: V3; frame: HandFrame };

const F = (o: V3, x: V3, y: V3, z: V3): HandFrame => ({ o, x, y, z });
const PLANS: Record<'pedal' | 'lever', Record<'R' | 'L', HandPlan>> = {
  pedal: {
    // The right hand: the upper register, at about shoulder height, a third
    // of the way along its strings from the soundboard.
    R: {
      side: 1,
      thumbX: -475,
      y: -1165,
      dy: [-50, 0, 8, 16],
      pole: v(0.1, 0.6, 1),
      frame: F(v(-500.97, -1128.47, 91.56), v(0.7905, -0.5194, -0.3246), v(0.6117, 0.642, 0.4623), v(-0.0318, -0.564, 0.8252)),
    },
    // The left hand: lower, toward the pillar, near the middle of its strings.
    L: {
      side: -1,
      thumbX: -330,
      y: -1070,
      dy: [-50, 0, 8, 16],
      pole: v(0.1, 0.6, -1),
      frame: F(v(-348.03, -1115.68, -115.18), v(0.772, 0.1619, 0.6147), v(0.3851, 0.6502, -0.6549), v(0.5057, -0.7423, -0.4397)),
    },
  },
  lever: {
    // The lever harp: the same places on its shorter strings, its player
    // seated lower and closer.
    R: {
      side: 1,
      thumbX: -400,
      y: -950,
      dy: [-50, 0, 8, 16],
      pole: v(0.1, 0.6, 1),
      frame: F(v(-416.57, -923.62, 102.35), v(0.847, -0.3291, -0.4175), v(0.4734, 0.8242, 0.3108), v(0.2419, -0.4609, 0.8539)),
    },
    L: {
      side: -1,
      thumbX: -250,
      y: -860,
      dy: [-50, 0, 8, 16],
      pole: v(0.1, 0.6, -1),
      frame: F(v(-286.34, -881.19, -110.1), v(0.8474, 0.0133, 0.5307), v(0.3627, 0.7156, -0.597), v(0.3877, -0.6984, -0.6016)),
    },
  },
};

/** Where one hand's pads go (frame H): the plan's strings, each pad on its string. */
export function harpHandPlan(lever: boolean, which: 'R' | 'L') {
  const P = PLANS[lever ? 'lever' : 'pedal'][which];
  const ti = stringAt(lever, P.thumbX);
  // Lower notes are the LONGER strings, toward the pillar (lower index):
  // the thumb on the highest, each finger two strings lower.
  const strings = { thumb: ti, index: ti - 2, middle: ti - 4, ring: ti - 6 };
  const targets = {
    thumb: onString(lever, strings.thumb, P.y + P.dy[0], P.side),
    index: onString(lever, strings.index, P.y + P.dy[1], P.side),
    middle: onString(lever, strings.middle, P.y + P.dy[2], P.side),
    ring: onString(lever, strings.ring, P.y + P.dy[3], P.side),
  };
  // The little finger is not used: loosely curled beside the ring finger.
  const pads: DigitGoal[] = [targets.index, targets.middle, targets.ring, { curl: 0.72, abd: 0.12 }];
  return { P, strings, targets, pads };
}

function solveHand(lever: boolean, which: 'R' | 'L'): HarpHand {
  const { P, strings, targets, pads } = harpHandPlan(lever, which);
  const body = harpistBody(lever);
  const shoulder = which === 'R' ? body.shoulderR : body.shoulderL;
  const sk = handOn(P.frame, pads, targets.thumb);
  const elbow = harpElbow(shoulder, sk.frame.o, P.pole);
  return { sk, elbow, shoulder, strings, targets, side: P.side };
}

/** The design-time fit (scratch tooling and the tests): the hand's frame
 *  re-fitted from the plan's own frame, to show it is settled. */
export function refitHarpHand(lever: boolean, which: 'R' | 'L'): HandSkeleton {
  const { P, targets, pads } = harpHandPlan(lever, which);
  const body = harpistBody(lever);
  const shoulder = which === 'R' ? body.shoulderR : body.shoulderL;
  const elbow = harpElbow(shoulder, P.frame.o, P.pole);
  return fitHand(P.frame, pads, targets.thumb, { elbow, maxWrist: 28, slide: 10, curl: 0.95 });
}

const cache = new Map<string, { R: HarpHand; L: HarpHand }>();
/** Both hands on the strings (solved once per harp). */
export function harpHands(lever: boolean): { R: HarpHand; L: HarpHand } {
  const key = lever ? 'lever' : 'pedal';
  let hit = cache.get(key);
  if (!hit) {
    hit = { R: solveHand(lever, 'R'), L: solveHand(lever, 'L') };
    cache.set(key, hit);
  }
  return hit;
}

/** The wrist's bend from the forearm (degrees), for the tests. */
export const harpWristBend = (h: HarpHand) => wristBendDeg(h.sk, h.elbow);
