/**
 * THE MIKING HAND — anatomy and grips (hands redesign 2026-10-24, owner: "The
 * hands continue to be drawn poorly … This must be MUCH better!!!").
 *
 * ONE HAND SYSTEM. Every hand in the Miking lab is the shared adult skeleton
 * (players/handModel.ts: real joints, real limits) POSED on what it holds,
 * then drawn by the one anatomical painter (drawAnatomy.ts → AnatomicalHand).
 * The same posed skeleton is projected into every view, so a hand seen from
 * the side and the same hand seen from above always agree.
 *
 * Pure: no React, no Skia — the tests measure exactly what the art draws.
 *
 * REAL DIMENSIONS (adult hand anthropometry; the house figure is ≈ 1.75 m):
 *   • hand length, wrist crease → middle fingertip ≈ 186 mm (adult 180–195);
 *   • hand breadth across the knuckles ≈ 73 mm skin to skin (adult 70–90);
 *   • palm length (wrist crease → middle knuckle) ≈ the middle finger's
 *     length (ratio ≈ 1.1 at the joint centres);
 *   • finger lengths: middle > ring ≥ index > little;
 *   • the thumb rises from the BASE of the palm (its saddle joint ≈ 24 mm
 *     past the wrist crease, on the palm side), two visible phalanges;
 *   • wrist ≈ 55 mm wide, narrower than the heel of the hand (≈ 70 mm).
 *
 * GRIPS (all solved in 3-D, then drawn in any view):
 *   gripCylinder  the POWER GRIP round a cylinder (a shaker shell, an egg, a
 *                 maraca handle, a tambourine frame, a clave): the object
 *                 lies across the palm at the base of the fingers, the four
 *                 fingers WRAP round it (their pads on its far side), the
 *                 thumb closes round the near side. The hand is turned and
 *                 slid along the object until its wrist meets the model's
 *                 wrist — the lesson's arm stays as it is.
 *   pinchGrip     the thumb's pad on the index finger's pad (a strap, a loop).
 *   openHandOn    a flat or gently cupped hand, its palm on a surface.
 */
import { h3, HAND, handFrame, handOn, HAND_LENGTH, v3, type DigitGoal, type HandFrame, type HandSkeleton, type ThumbGoal, type V3 } from '../../players/handModel.ts';

export { h3, v3, type HandSkeleton, type V3 };

const DEG = Math.PI / 180;
const { add, sub, mul, dot, len, unit } = h3;
/** A cross product in the world's own numbers (frame H is left-handed: the
 *  callers say which way the thumb goes with `thumbSign`). */
export const cross = (a: V3, b: V3): V3 => v3(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);

/* ── the anatomy, measured from the shared skeleton ── */

/** The adult hand's measures (mm) from the shared skeleton — what the drawing uses. */
export function handProportions() {
  const fl = HAND.fingers.map((f) => f.seg[0] + f.seg[1] + f.seg[2]);
  const [index, middle, ring, little] = fl;
  const palmLength = HAND.fingers[1].mcp.x;
  const breadth = HAND.fingers[0].mcp.y * -1 + HAND.fingers[3].mcp.y + HAND.fingers[0].r[0] + HAND.fingers[3].r[0];
  return {
    handLength: HAND_LENGTH,
    breadth,
    palmLength,
    fingers: { index, middle, ring, little },
    /** Palm length ÷ middle finger length (joint centres): ≈ 1.0–1.25 in adults. */
    palmToFinger: palmLength / middle,
    /** The thumb's saddle joint: how far past the wrist crease (x), toward the
     *  thumb side (−y) and toward the palm (−z). */
    thumbBase: { ...HAND.thumb.cmc },
    /** The thumb's two visible phalanges and its metacarpal (mm). */
    thumb: {
      metacarpal: HAND.thumb.seg[0],
      proximal: HAND.thumb.seg[1],
      distal: HAND.thumb.seg[2],
    },
    wristWidth: HAND.wristHalf * 2,
  };
}

/* ── the power grip round a cylinder ── */

export type Cylinder = {
  /** A point on the axis where the hand should hold (the grip's middle). */
  c: V3;
  /** The axis direction (any sign). */
  axis: V3;
  /** The radius (mm). */
  r: number;
  /** How far (mm) the hand may slide along the axis from `c` (default 0). */
  slide?: number;
  /** The axis points to the object's TIP, which leaves the fist past the
   *  thumb (a stick, a beater). Without it either end may. */
  tipward?: boolean;
};

export type GripOpts = {
  /** +1 / −1: which way the thumb lies, as thumb = thumbSign · (along × back)
   *  in the world's own numbers. Frame H (the small-percussion frame): +1 a
   *  RIGHT hand, −1 a LEFT hand. */
  thumbSign: 1 | -1;
  /** Where the lesson's arm puts the wrist: the grip turns the hand round
   *  the object until its wrist lands as near to this as it can. */
  wrist: V3;
  /** The elbow: the forearm (elbow → wrist) and the hand stay within
   *  `maxWrist`° of each other (D68: a wrist bends 70° at most). */
  elbow?: V3;
  maxWrist?: number;
  /** The angle between the hand's length and the object (deg): a fist round
   *  a handle crosses at 60–90°, a diagonal ("handshake") grip at 35–55°. */
  angle?: [number, number];
  /** A preferred direction for the back of the hand (soft). */
  back?: V3;
  /** 0 … 1: how hard the fingers close (1 = pads on the object). */
  close?: number;
  /** The thumb's job: 'wrap' (closes round the near side, the power grip),
   *  'along' (lies along the object, pointing past the fingers), or a pose. */
  thumb?: 'wrap' | 'along';
};

/** Where the object's axis crosses the hand frame in a power grip: under the
 *  base of the fingers, against the palm (z = the palm's face, less the radius). */
const GRIP_AT = { x: 80, y: 0 } as const;
const PALM_FACE = HAND.thick / 2;

/** The hand frame whose palm holds the cylinder at `p` (on the axis), the axis
 *  crossing the hand at `ang` (rad) to its length, the back of the hand
 *  toward `back` (square to the axis). */
function frameOn(p: V3, axis: V3, back: V3, ang: number, r: number, thumbSign: 1 | -1): HandFrame {
  const a = unit(axis);
  const z = unit(sub(back, mul(a, dot(back, a))));
  // q: in the palm's plane, square to the axis.
  const q = unit(cross(a, z));
  // The hand's length: across the object at `ang`; which of ±q is decided so
  // that the thumb (thumb = thumbSign · (x × z)) points along +a — the
  // object leaves the fist past the thumb and index (a hammer, a stick).
  let x = add(mul(q, Math.sin(ang)), mul(a, Math.cos(ang)));
  const thumbDir = mul(cross(x, z), thumbSign);
  if (dot(thumbDir, a) < 0) x = add(mul(q, -Math.sin(ang)), mul(a, Math.cos(ang)));
  const thumbSide = mul(cross(x, z), thumbSign);
  // The axis passes GRIP_AT, palm-side by the palm's half thickness + r.
  const f0 = handFrame(v3(0, 0, 0), x, z, thumbSide);
  const off = add(mul(f0.x, GRIP_AT.x), add(mul(f0.y, GRIP_AT.y), mul(f0.z, -(PALM_FACE + r + 1))));
  return { ...f0, o: sub(p, off) };
}

/** A point on the cylinder's surface (pad centre radius `rho`) at angle `beta`
 *  round the axis from the palm's contact line, turning the way the fingers
 *  curl (0 = under the palm, 90° = past the knuckles, 180° = the far side). */
function round(f: HandFrame, axisPt: V3, axis: V3, rho: number, beta: number): V3 {
  const a = unit(axis);
  const up = unit(sub(f.z, mul(a, dot(f.z, a)))); // axis → the palm
  const fwd = unit(sub(f.x, mul(a, dot(f.x, a)))); // axis → the fingertips' side
  return add(axisPt, add(mul(up, rho * Math.cos(beta)), mul(fwd, rho * Math.sin(beta))));
}

/** The point of the axis nearest to q. */
const onAxis = (c: V3, axis: V3, q: V3): V3 => {
  const a = unit(axis);
  return add(c, mul(a, dot(sub(q, c), a)));
};

export type Grip = {
  sk: HandSkeleton;
  /** The grip's wrist (where the arm meets the hand). */ wrist: V3;
  /** The distance from the lesson's wrist (mm). */ wristMiss: number;
};

/**
 * THE POWER GRIP. The object lies across the palm at the base of the
 * fingers; each finger wraps round it (its pad as far round as the finger's
 * length reaches, at most to the palm); the thumb closes round the near
 * side. The hand's roll round the object, its angle across it and its place
 * along it are searched so the wrist meets the lesson's wrist with the wrist
 * joint inside its range.
 */
export function gripCylinder(cyl: Cylinder, o: GripOpts): Grip {
  const a = unit(cyl.axis);
  const [lo, hi] = o.angle ?? [55, 90];
  const maxW = (o.maxWrist ?? 60) * DEG;
  const slide = cyl.slide ?? 0;
  // The roll's reference: any direction square to the axis.
  const ref0 = Math.abs(a.y) < 0.9 ? v3(0, 1, 0) : v3(1, 0, 0);
  const e1 = unit(sub(ref0, mul(a, dot(ref0, a))));
  const e2 = unit(cross(a, e1));
  let best: { f: HandFrame; cost: number } | null = null;
  const tryFrameA = (aa: V3, phi: number, ang: number, t: number) => {
    const back = add(mul(e1, Math.cos(phi)), mul(e2, Math.sin(phi)));
    const p = add(cyl.c, mul(a, t));
    const f = frameOn(p, aa, back, ang, cyl.r, o.thumbSign);
    let cost = len(sub(f.o, o.wrist)) ** 2;
    if (o.elbow) {
      const fore = unit(sub(f.o, o.elbow));
      const bend = Math.acos(Math.max(-1, Math.min(1, dot(fore, f.x))));
      if (bend > maxW) cost += 40000 * (bend - maxW) ** 2;
      // The forearm runs INTO the wrist from behind the hand, never from in front of the knuckles.
      cost += 800 * Math.max(0, -dot(fore, f.x));
    }
    if (o.back) cost += 6000 * (1 - dot(f.z, unit(o.back)));
    if (!best || cost < best.cost) best = { f, cost };
  };
  // Either end of a symmetric object may leave the fist past the thumb.
  const ends = cyl.tipward ? [a] : [a, mul(a, -1)];
  let bestA = a;
  for (const aa of ends) {
    const before: typeof best = best;
    for (let phi = 0; phi < 360; phi += 4)
      for (let ang = lo; ang <= hi + 1e-6; ang += 5) for (let t = -slide; t <= slide + 1e-6; t += slide > 0 ? Math.max(4, slide / 6) : 1) tryFrameA(aa, phi * DEG, ang * DEG, t);
    if (best !== before) bestA = aa;
  }
  // Refine round the best.
  const b0 = best!;
  const back0 = b0.f.z;
  const phi0 = Math.atan2(dot(back0, e2), dot(back0, e1));
  const ang0 = Math.acos(Math.abs(Math.max(-1, Math.min(1, dot(b0.f.x, a)))));
  const t0 = dot(sub(add(b0.f.o, add(mul(b0.f.x, GRIP_AT.x), mul(b0.f.z, -(PALM_FACE + cyl.r + 1)))), cyl.c), a);
  for (let dp = -4; dp <= 4; dp += 1)
    for (let da = -4; da <= 4; da += 1)
      for (let dt = -4; dt <= 4; dt += 2) {
        const t = Math.max(-slide, Math.min(slide, t0 + dt));
        tryFrameA(bestA, phi0 + dp * DEG, Math.max(lo * DEG, Math.min(hi * DEG, ang0 + da * DEG)), t);
      }
  const f = best!.f;
  const sk = wrapFingers(f, cyl, o);
  return { sk, wrist: f.o, wristMiss: len(sub(f.o, o.wrist)) };
}

/** The fingers wrapped round the cylinder held in frame f, the thumb closing
 *  round its near side (or lying along it). */
function wrapFingers(f: HandFrame, cyl: Cylinder, o: GripOpts): HandSkeleton {
  const a = unit(cyl.axis);
  const close = o.close ?? 1;
  const fingers: DigitGoal[] = HAND.fingers.map((F, i) => {
    const mcp = add(f.o, add(mul(f.x, F.mcp.x), mul(f.y, F.mcp.y)));
    // Where this finger crosses the object: the axis point nearest its knuckle,
    // nudged toward the fingertips' side of the hand's length.
    const ax = onAxis(cyl.c, a, add(mcp, mul(f.x, 8)));
    const rho = cyl.r + F.r[3] * 0.78;
    // How far round the finger reaches: its length along a curl of radius
    // ≈ the object's plus the finger's half-width, from the knuckle's angle.
    const L = F.seg[0] + F.seg[1] + F.seg[2];
    const R = cyl.r + F.r[1];
    const reach = (L / R) * 0.82 * close + 0.35;
    const beta = Math.min(reach, 300 * DEG);
    return round(f, ax, a, rho, beta);
  });
  let thumb: ThumbGoal;
  const idx = HAND.fingers[0];
  const iMcp = add(f.o, add(mul(f.x, idx.mcp.x), mul(f.y, idx.mcp.y)));
  if (o.thumb === 'along') {
    // Along the object, its pad past the index knuckle on the object's side.
    const ax = onAxis(cyl.c, a, add(iMcp, mul(f.y, -40)));
    thumb = round(f, ax, a, cyl.r + 9, -78 * DEG);
  } else {
    // Round the near side: from under the palm's thumb edge, its pad meeting
    // the index finger's middle bone on a slim object, on the object's near
    // side on a thick one.
    const ax = onAxis(cyl.c, a, add(iMcp, mul(f.y, -22)));
    const R = cyl.r + 11;
    const beta = -Math.min(205 * DEG, (68 / R) * 0.95 + 0.55);
    thumb = round(f, ax, a, cyl.r + 8, beta);
  }
  return handOn(f, fingers, thumb, 0.75);
}

/* ── the occlusion plane for a held object ── */

/** The plane that splits a hand at a held cylinder for a view whose
 *  toward-the-viewer direction is `toward`: parts behind it are painted
 *  before the object. End-on, the plane is the object's near end face. */
export function cylinderCut(cyl: Cylinder, toward: V3, halfLength: number): { p: V3; n: V3 } {
  const a = unit(cyl.axis);
  const t = unit(toward);
  const perp = sub(t, mul(a, dot(t, a)));
  if (len(perp) < 0.25) {
    const s = Math.sign(dot(t, a)) || 1;
    return { p: add(cyl.c, mul(a, s * halfLength)), n: mul(a, s) };
  }
  return { p: cyl.c, n: unit(perp) };
}

/** The toward-the-viewer direction of an orthographic view (its depth's gradient). */
export function towardOf(view: (p: V3) => { u: number; v: number; d: number }): V3 {
  const o = view(v3(0, 0, 0)).d;
  return v3(view(v3(1, 0, 0)).d - o, view(v3(0, 1, 0)).d - o, view(v3(0, 0, 1)).d - o);
}

/* ── a pinch and an open hand ── */

/**
 * THE PINCH: the thumb's pad on the index finger's pad at `at` (a strap, a
 * loop, a cymbal's knot), the hand pointing along `along`, its back toward
 * `back`; the middle finger curled just behind the index, the ring and
 * little fingers folded loosely into the palm.
 */
export function pinchGrip(at: V3, along: V3, back: V3, thumbSign: 1 | -1): HandSkeleton {
  const x0 = unit(along);
  const z = unit(sub(back, mul(x0, dot(back, x0))));
  const f0 = handFrame(v3(0, 0, 0), x0, z, mul(cross(x0, z), thumbSign));
  // The pinch sits ≈ 125 mm from the wrist, a little palm-side of the bones' plane.
  const local = add(mul(f0.x, 125), add(mul(f0.y, -22), mul(f0.z, -30)));
  const f: HandFrame = { ...f0, o: sub(at, local) };
  const pad = add(at, mul(f.y, -2));
  return handOn(f, [pad, { curl: 0.62 }, { curl: 0.85 }, { curl: 0.95 }], add(at, mul(f.y, -10)), 0.6);
}

/**
 * AN OPEN HAND ON A SURFACE: the palm toward `normal` (into the surface), the
 * hand pointing along `along`, the wrist at `wrist`; `curl` 0 (flat, the
 * fingers together) … 0.5 (cupped). The fingers held together (no spread),
 * the thumb relaxed beside the index.
 */
export function openHandOn(wrist: V3, along: V3, palmToward: V3, thumbSign: 1 | -1, curl = 0.12): HandSkeleton {
  const x = unit(along);
  const z = unit(mul(sub(palmToward, mul(x, dot(palmToward, x))), -1));
  const f = handFrame(wrist, x, z, mul(cross(x, z), thumbSign));
  const c = Math.max(0, curl);
  const fp = (i: number) => ({
    abd: (i - 1.3) * 0.035,
    mcp: 0.18 * c + 0.04,
    pip: 0.75 * c + 0.06,
    dip: 0.5 * c + 0.04,
  });
  return handOn(f, [fp(0), fp(1), fp(2), fp(3)], {
    yaw: 0.48,
    pitch: 0.16 + 0.3 * c,
    mcp: 0.12 + 0.2 * c,
    ip: 0.1 + 0.15 * c,
  });
}

export { HAND, HAND_LENGTH };
