/**
 * FIGURE V2 — A RIGHT HAND HOLDING A TIMPANI / CONCERT BASS DRUM MALLET, SEEN FROM THE BACK OF THE HAND
 * (owner 2026-11-24, "one hand at a time": the mallet hand). A side camera sees the player whose arm hangs forward:
 * the forearm comes in from the LEFT, the mallet leaves the fist toward the lower RIGHT.
 *
 * THE GRIP DRAWN — "thumbs-up" (French) turned a little toward American: the back of the hand faces the side camera,
 * the thumb lies along the TOP of the shaft pointing at the head, the four fingers curl under it. The fulcrum is the
 * standard one for every timpani grip: the shaft pinched between the PAD OF THE THUMB and the index finger at its
 * middle joint, the other fingers cradling it loosely. Why this grip: from the side it is the one that plainly reads
 * as a grip (the thumb on top, the shaft leaving between thumb and index); a German grip (palm down) would show the
 * camera only the little-finger edge of the fist. It also serves a concert bass drum mallet, which is held the same
 * way (one heavier mallet, thumb on top, the fulcrum between thumb and index).
 *
 * AUTHORED 2-D ART, as the approved pole hands (poleHandFront.tsx, poleHandBack.tsx): hand-placed points drawn as
 * smooth closed cubic curves, the same skin light, the same thin soft outline, soft form lights and shadows, very few
 * thin lines. No 3-D model.
 *
 * Frame: millimetres, origin on the shaft's axis AT THE FULCRUM (where the shaft leaves the fist between the thumb's
 * pad and the index's bend), +x right, +y DOWN. Neutral position: the forearm horizontal from the left, the shaft
 * running on to the right tilted DOWN by MALLET_SHAFT_TILT (15°). The butt (45 mm behind the fulcrum) ends inside
 * the hand, so the shaft is seen leaving the fist on ONE side only.
 *
 * What the eye sees (left to right):
 *   1. the cuff, then the wrist (≈ 57 mm) — narrower than the hand;
 *   2. the back of the hand: a broad, gently rounded plane; four faint tendons; the big knuckles toward the right as
 *      four low swells in one slanting row (the index's on top, nearest the thumb; the little finger's lowest and
 *      smallest);
 *   3. the four fingers: from the knuckles their first segments run right a short way and bend; their middle and end
 *      segments tuck back UNDER the shaft toward the palm (unseen). Along the fist's right edge: the four stacked
 *      rounded bends (index on top, each one lower a little shorter), parted by short creases that start at the bends
 *      and fade toward the knuckles;
 *   4. the thumb: growing out of the hand's top edge near the wrist (one form with the hand: no flap, no notch), a
 *      rounded swell at its base joint, then two segments along the TOP of the shaft with one soft bend, its pad on the
 *      shaft, its rounded tip a little past the index's bend, a quiet nail on top — the nearest thing at the top;
 *   5. the shaft: leaving the fist on the right from BETWEEN the thumb's pad (above) and the index's bend (below), both
 *      overlapping it where it leaves, a soft contact shadow on it there.
 * Paint order: the shaft (inside the hand, behind it) → the hand (in front of it) → the cuff.
 */
import { useMemo } from 'react';
import { Group, LinearGradient, Path, PathOp, RadialGradient, Skia, vec } from '@shopify/react-native-skia';
import { Blur, FigureScale } from './detail';
import { FigureLook, useLook } from './look';
import { ellipsePath, op, smoothClosed, smoothOpen, type SkPath } from './paths';
import { LIGHT, P, type Poly, type Pt } from './geom.ts';
import type { Ellipse } from './sidePlan.ts';
import type { CastMember } from './cast.ts';

/* ── the art (pure: the tests read these points) ── */

const pts = (xs: readonly (readonly [number, number])[]): Poly => xs.map(([x, y]) => P(x, y));
const E = (x: number, y: number, rx: number, ry: number, rot = 0): Ellipse => ({ c: P(x, y), rx, ry, rot });

/** The shaft's tilt below the forearm in the neutral drawing (radians, +: down to the right). */
export const MALLET_SHAFT_TILT = (15 * Math.PI) / 180;
/** The shaft's radius (Ø 12 mm). */
export const MALLET_SHAFT_R = 6;
/** From the fulcrum back to the butt (mm). */
export const MALLET_BUTT = 45;
const C = Math.cos(MALLET_SHAFT_TILT);
const S = Math.sin(MALLET_SHAFT_TILT);
/** A point given along the shaft (`a` mm from the fulcrum toward the head) and `d` mm ABOVE its axis. */
export const onShaft = (a: number, d: number): Pt => P(a * C + d * S, a * S - d * C);
/** A point's place along the shaft and its height above the axis (the inverse of onShaft). */
export const shaftCoords = (q: Pt): { a: number; d: number } => ({ a: q.u * C + q.v * S, d: q.u * S - q.v * C });

/** The four fingers top to bottom: each bend's band on the fist's right edge (top, bottom, rightmost point), the
 *  notch below it and its big knuckle (a low swell on the back of the hand) with its size, mm. */
// (round 2: the index's bend the largest and farthest forward; each one below a little smaller and set a little
// farther back; the notches between them deep enough that every bend is its own rounded form)
export const MALLET_FINGERS = [
  { name: 'index', top: 4.7, bottom: 21.2, bend: P(6.2, 11.6), notch: P(-0.6, 21.2), knuckle: P(-17.6, 11.2), kr: 7.4 },
  { name: 'middle', top: 21.2, bottom: 36.8, bend: P(2.6, 28.8), notch: P(-4.4, 36.8), knuckle: P(-20.4, 27.6), kr: 7.6 },
  { name: 'ring', top: 36.8, bottom: 50.8, bend: P(-1.4, 43.8), notch: P(-8.8, 50.8), knuckle: P(-25.2, 42.2), kr: 6 },
  { name: 'little', top: 50.8, bottom: 63, bend: P(-6.4, 56.8), notch: P(-17.6, 63), knuckle: P(-31.4, 54.2), kr: 4.8 },
] as const;

/** The finger axis on the page (from knuckle to bend: about square to the row of bends). */
const FINGER_AXIS = 0.24;

/**
 * THE HAND (in front of the shaft): one outline — the wrist out of the cuff, the thumb's base rising out of the
 * hand's top edge to its base joint, the thumb along the top of the shaft, its tip, its pad back to the fulcrum, the
 * narrow mouth where the shaft leaves, the index's bend and the three below it (the fist's right edge), the little
 * finger's underside, the hand's lower edge and the wrist back into the cuff.
 */
// (round 2: a THUMB, short and thick — not a pointing finger. The base segment broad where it leaves the hand, a
// visible knuckle bend, the end segment ≈ 30 mm long and ≈ 20 mm deep with a blunt rounded tip, ending ≈ 6 mm past
// the index's bend)
const THUMB_TOP: Poly = [
  // the thumb's base joint: a rounded swell, the top of the fist
  P(-40, -34.2), P(-34, -34.9),
  // the base segment along the top of the shaft, broad
  onShaft(-34, 25.6), onShaft(-27, 25.1), onShaft(-21, 24.4),
  // the knuckle bend (the thumb's last joint): a gentle rise, the end segment angled a touch down onto the shaft
  onShaft(-15.5, 24.8), onShaft(-9.5, 23.9),
  // the end segment, its blunt rounded tip
  onShaft(-4, 23.4), onShaft(3, 22.6), onShaft(8.6, 21), onShaft(12.4, 17.8), onShaft(14.6, 13.4), onShaft(15, 9), onShaft(13.8, 5.6), onShaft(11.2, 3.9),
];
/** The thumb's pad on the shaft (its lower edge OVER the shaft's top for the first ≈ 15 mm), into the grip. */
const THUMB_PAD: Poly = [onShaft(8.4, 3.4), onShaft(4.6, 3.3), onShaft(1.2, 2.9), onShaft(-1.6, 1.9)];
/** Where the thumb's pad and the index's bend meet inside the grip: the shaft goes in between them. */
// (the thumb's lower edge runs on smoothly through it; the index's top edge rises to meet it)
const GRIP_IN = onShaft(-4.4, 0.9);
/** The mouth: the pad above, the grip point, the index's bend below — a narrowing wedge of shaft, not a cap. */
const MOUTH: Poly = [GRIP_IN, onShaft(-1.6, -1.6), onShaft(1.4, -3.1)];

const BODY: Poly = [
  // the wrist's top (under the cuff → right)
  ...pts([[-112, -18.6], [-100, -18.7], [-90, -18.6], [-81, -19.4]]),
  // the thumb's base: rising out of the hand's top edge, one smooth convex form up to its base joint
  ...pts([[-73, -21.6], [-65, -25], [-57, -28.8], [-48.6, -32.2]]),
  ...THUMB_TOP,
  ...THUMB_PAD,
  ...MOUTH,
  // the index's bend (just under the shaft, overlapping its lower edge where it leaves): the largest, the farthest on
  ...pts([[3, 4.7], [5.3, 7.8], [6.2, 11.6], [5.8, 15.4], [4, 18.8], [1.6, 20.8]]),
  P(-0.6, 21.2),
  // the middle finger's bend
  ...pts([[0.8, 22.4], [2.2, 25.2], [2.6, 28.8], [2, 32.4], [0.2, 35.2], [-2.4, 36.6]]),
  P(-4.4, 36.8),
  // the ring finger's bend
  ...pts([[-3, 38], [-1.8, 40.6], [-1.4, 43.8], [-2, 47], [-3.8, 49.6], [-6.6, 50.7]]),
  P(-8.8, 50.8),
  // the little finger's bend (the smallest, the farthest back) and its underside back toward its knuckle
  ...pts([[-7.4, 52], [-6.6, 54.2], [-6.4, 56.8], [-7.2, 59.4], [-9.4, 61.6], [-13, 62.8], [-17.6, 63], [-23, 62.5], [-30, 61.4]]),
  // the hand's lower edge (the little-finger side): back and up to the wrist, the wrist bone a hint
  ...pts([[-38, 59.4], [-48, 56], [-58, 51.4], [-67, 46.5], [-75, 42.2], [-81.5, 39.6], [-90, 38.6], [-100, 38.5], [-112, 38.5]]),
];

/**
 * THE THUMB as its own piece (painted again over the hand, the nearest thing at the top): its top edge IS the hand's
 * top edge (the same points: one outline), its tip and pad the same; its underside runs back from the mouth over the
 * hand to its base joint and closes INSIDE the hand along the top edge (painted in the same skin: no seam, no notch).
 */
// (its root a hair inside the hand's top edge: the hand's own edge stays the one outline there)
const THUMB_ROOT: Poly = pts([[-63, -23.8], [-57, -27.6], [-48.6, -31.4]]);
// (its underside: from the grip back over the hand, the base segment broadening, into the hand at its root)
const THUMB_BELOW: Poly = [onShaft(-8.4, 1.6), onShaft(-16, 2.6), onShaft(-24, 3.8), onShaft(-30, 4.8), onShaft(-36, 7), P(-42, -17.4), P(-50, -20.2), P(-57, -23.4)];
const THUMB: Poly = [...THUMB_ROOT, ...THUMB_TOP, ...THUMB_PAD, GRIP_IN, ...THUMB_BELOW];

/** The notches between neighbouring bends (where the crease starts). */
const NOTCHES: readonly Pt[] = MALLET_FINGERS.slice(0, 3).map((f) => f.notch);

/** The thumb's underside running on inside the hand from the grip to where it merges into the hand: one clear soft line. */
const THUMB_UNDER: Poly = [GRIP_IN, ...THUMB_BELOW.slice(0, 6)];
/** The index's top edge running on inside the hand from the grip (faint, short). */
const INDEX_TOP: Poly = [GRIP_IN, onShaft(-9, -0.9), onShaft(-14, -2)];

/** The cuff: its rim a near-straight arc (we see the forearm from its side), the sleeve on to the left. */
function arc(cx: number, cy: number, rx: number, ry: number, from: number, to: number, n = 16): Poly {
  const out: Poly = [];
  for (let j = 0; j <= n; j++) {
    const t = from + ((to - from) * j) / n;
    out.push(P(cx + rx * Math.cos(t), cy + ry * Math.sin(t)));
  }
  return out;
}
const CUFF_C = P(-101, 10);
const CUFF_RX = 4.5;
const CUFF_RY = 31;
const SLEEVE: Poly = [...arc(CUFF_C.u, CUFF_C.v, CUFF_RX, CUFF_RY, -Math.PI / 2, Math.PI / 2), P(-130, 41.6), P(-200, 42.4), P(-200, -22.4), P(-130, -21.6)];

/** A thin soft tendon line (an elongated ellipse) from `a` to `b`. */
const tendon = (a: Pt, b: Pt): Ellipse => ({ c: P((a.u + b.u) / 2, (a.v + b.v) / 2), rx: (Math.hypot(b.u - a.u, b.v - a.v) / 2) * 0.8, ry: 1.2, rot: Math.atan2(b.v - a.v, b.u - a.u) });

export type MalletHandArt = {
  body: Poly;
  thumb: Poly;
  notches: readonly Pt[];
  fingers: typeof MALLET_FINGERS;
  thumbTop: Poly;
  thumbPad: Poly;
  mouth: Poly;
  thumbUnder: Poly;
  indexTop: Poly;
  thumbTip: Pt;
  thumbBase: Pt;
  thumbNail: Poly;
  sleeve: Poly;
  cuffSeam: Poly;
  /** Where the back of the hand meets the wrist (x, mm). */
  wristX: number;
  broad: Ellipse[];
  lights: Ellipse[];
  darks: Ellipse[];
  knuckleLights: Ellipse[];
  knuckleDarks: Ellipse[];
  thumbLights: Ellipse[];
  thumbDarks: Ellipse[];
  /** The thumb's base lit as one form with the hand (painted on both). */
  baseLight: Ellipse[];
  /** The thumb's soft shadow on the hand just under it (tapering out before its base). */
  thumbShadow: Ellipse[];
  tendons: Ellipse[];
  /** The short crease between two neighbouring bends: from the notch on the front edge back toward the knuckles. */
  creases: Poly[];
};

/** A quiet nail: a rounded oblong `len` along `rot`, `w` across (seen from its side: narrow). */
function nail(c: Pt, len: number, w: number, rot: number): Poly {
  const out: Poly = [];
  const co = Math.cos(rot);
  const si = Math.sin(rot);
  for (let j = 0; j < 20; j++) {
    const t = (Math.PI * 2 * j) / 20;
    const ct = Math.cos(t);
    const st = Math.sin(t);
    const a = (len / 2) * Math.sign(ct) * Math.pow(Math.abs(ct), 0.75);
    const b = (w / 2) * Math.sign(st) * Math.pow(Math.abs(st), 0.75);
    out.push(P(c.u + a * co - b * si, c.v + a * si + b * co));
  }
  return out;
}

const T = MALLET_SHAFT_TILT;
const F = MALLET_FINGERS;

export const MALLET_HAND_BACK: MalletHandArt = {
  body: BODY,
  thumb: THUMB,
  notches: NOTCHES,
  fingers: F,
  thumbTop: THUMB_TOP,
  thumbPad: THUMB_PAD,
  mouth: MOUTH,
  thumbUnder: THUMB_UNDER,
  indexTop: INDEX_TOP,
  thumbTip: onShaft(15, 9),
  thumbBase: P(-34, -34.9),
  // (the nail you can see: the thumb turned a little toward the camera, as the grip leans toward American)
  thumbNail: nail(onShaft(6.6, 15.6), 11, 7.6, T),
  sleeve: SLEEVE,
  cuffSeam: arc(CUFF_C.u - 16, CUFF_C.v, CUFF_RX, CUFF_RY + 0.4, -Math.PI * 0.46, Math.PI * 0.46),
  wristX: -80,
  broad: [E(-52, 10, 26, 20), E(-14, 26, 12, 26, 0.1)],
  lights: [
    // each curled finger lit along its upper side, from the bend back toward the knuckle (a band, not a blotch)
    ...F.map((f) => {
      const h = f.bottom - f.top;
      return E(f.bend.u - 7, f.top + h * 0.3, 8, h * 0.16, FINGER_AXIS);
    }),
    // the wrist bone's small bump on the little-finger side (a hint)
    E(-81, 36.2, 2.4, 1.7),
  ],
  darks: [
    // each finger's lower side, turning down into the crease below it
    ...F.map((f) => {
      const h = f.bottom - f.top;
      return E(f.bend.u - 7.5, f.bottom - h * 0.12, 8.5, h * 0.11, FINGER_AXIS);
    }),
    // the hand's lower edge turning away; the wrist's lower side; just under the wrist bone
    E(-44, 55.6, 22, 3.4, -0.33), E(-90, 36.4, 10, 2.2), E(-80.4, 38.6, 2.6, 1.2),
    // the wrist going into the cuff
    E(-97, 10, 2.6, 27),
  ],
  // the knuckle row: four low swells in a slanting line, a soft light on the top of each (index and middle largest)
  // (each swell lit on its upper-left face as a soft crescent, shaded on its lower-right: a low form, not a pale disc)
  knuckleLights: F.map((f) => E(f.knuckle.u - f.kr * 0.4, f.knuckle.v - f.kr * 0.22, f.kr * 0.42, f.kr * 0.82, FINGER_AXIS + 0.15)),
  knuckleDarks: [
    // the three valleys between the knuckles
    E(-18.2, 19.8, 3.6, 1.9, FINGER_AXIS), E(-21.8, 35.2, 3.4, 1.8, FINGER_AXIS), E(-27.4, 48.6, 3, 1.6, FINGER_AXIS),
    // each swell's lower right, turning down into its curled finger
    ...F.map((f) => E(f.knuckle.u + f.kr * 0.75, f.knuckle.v + f.kr * 0.3, f.kr * 0.4, f.kr * 0.75, FINGER_AXIS + 0.15)),
  ],
  thumbLights: [
    // along the top of the thumb: the base segment and the end segment, parted at the knuckle bend
    { c: onShaft(-26, 21.4), rx: 8.4, ry: 2.6, rot: T },
    { c: onShaft(-1, 19.6), rx: 10, ry: 2.8, rot: T },
    // the base joint's swell
    E(-37, -30.4, 8, 3.4, -0.08),
  ],
  // the thumb's base along the hand's top edge: painted on the hand AND on the thumb (one form, no seam at the root)
  baseLight: [E(-60, -24.6, 13, 2.8, -0.4)],
  thumbDarks: [
    // the thumb's underside turning away, along its whole length; the pad's underside over the shaft near the tip
    { c: onShaft(-14, 5.4), rx: 18, ry: 2.4, rot: T },
    { c: onShaft(7, 5.2), rx: 6.5, ry: 2, rot: T },
    // the knuckle bend: a short soft crease underneath (its rise shows in the top edge)
    { c: onShaft(-14.6, 4.2), rx: 1.1, ry: 2.4, rot: T },
  ],
  thumbShadow: [
    { c: onShaft(-8, -0.8), rx: 6, ry: 2, rot: T },
    { c: onShaft(-17, 0.6), rx: 8, ry: 2, rot: T },
    { c: onShaft(-28, 2.4), rx: 7, ry: 1.6, rot: T },
  ],
  tendons: [
    tendon(P(-74, -2), P(-24, 9.6)),
    tendon(P(-74, 8), P(-26, 26)),
    tendon(P(-74, 16), P(-30, 41)),
    tendon(P(-74, 24), P(-35, 53.4)),
  ],
  creases: NOTCHES.map((n) => [n, P(n.u - 6.5, n.v - 1.6), P(n.u - 14, n.v - 3.5)]),
};

/* ── the paint ── */

/** The shaft: a light wood (a maple or bamboo timpani / bass drum mallet shaft), lit from above. */
const SHAFT_STOPS = ['#5a3f26', '#b48c5c', '#e6c999', '#c9a574', '#9d774c', '#6d4f30', '#4a321d'];
// (its lit band just below the thumb's pad, so it runs on unbroken into the grip)
const SHAFT_POS = [0, 0.13, 0.31, 0.46, 0.66, 0.86, 1];
/** The felt head. */
const FELT = ['#f6f1e7', '#e3dccd', '#bdb3a1', '#8c8170'];

/** The light carried into the art's frame: page → art (rotation `rot`, mirrored or not). */
type LightMap = { a: number; b: number; c: number; d: number };
function lightMap(rot: number, mirror: boolean): LightMap {
  const m = mirror ? -1 : 1;
  const co = Math.cos(rot);
  const si = Math.sin(rot);
  return { a: m * co, b: m * si, c: -si, d: co };
}
const mv = (M: LightMap, u: number, v: number): Pt => P(M.a * u + M.b * v, M.c * u + M.d * v);
/** A soft light or shade moved round its form toward the light (k: how far, as a share of its smaller radius). */
function relit(es: Ellipse[], L: Pt, sign: 1 | -1, k = 0.35): Ellipse[] {
  if (Math.abs(L.u - LIGHT.u) < 1e-9 && Math.abs(L.v - LIGHT.v) < 1e-9) return es;
  return es.map((e) => {
    const r = Math.min(e.rx, e.ry) * k * sign;
    return { ...e, c: P(e.c.u + r * (L.u - LIGHT.u), e.c.v + r * (L.v - LIGHT.v)) };
  });
}

const many = (ps: SkPath[]): SkPath => {
  const p = Skia.Path.Make();
  for (const q of ps) p.addPath(q);
  return p;
};
const polyPath = (q: Poly): SkPath => {
  const p = Skia.Path.Make();
  p.moveTo(q[0].u, q[0].v);
  for (let i = 1; i < q.length; i++) p.lineTo(q[i].u, q[i].v);
  p.close();
  return p;
};
/** The lit edge of a mass for the light L (art frame). */
function rimL(path: SkPath, w: number, L: Pt): SkPath {
  const q = path.copy();
  q.offset(-L.u * w, -L.v * w);
  return op(path, q, PathOp.Difference);
}

export type MalletHead = 'timpani' | 'bass' | 'none';
/** The felt head's radius: a timpani mallet's ≈ Ø 38 mm, a concert bass drum mallet's ≈ Ø 70 mm. */
export const MALLET_HEAD_R: Record<MalletHead, number> = { timpani: 19, bass: 35, none: 0 };

function build(a: MalletHandArt, end: number, head: MalletHead, L: Pt, sleeveOn: boolean, r: number = MALLET_SHAFT_R, paintShaft = true) {
  const body0 = smoothClosed(a.body);
  const sleeve = smoothClosed(a.sleeve, 0.2);
  // (no sleeve of its own: the skin ends at the cuff's rim, where the figure's own sleeve takes the wrist)
  const body = sleeveOn ? body0 : op(body0, sleeve, PathOp.Difference);
  // the shaft from its butt (rounded, inside the hand) to `end` along its axis
  const shaftPts: Poly = [onShaft(end, r), onShaft(end, -r)];
  // (the butt's round end, inside the hand: bottom edge → its tip → top edge)
  const ca = -MALLET_BUTT + r;
  for (let j = 0; j <= 8; j++) {
    const f = (Math.PI * j) / 8;
    shaftPts.push(onShaft(ca - r * Math.sin(f), -r * Math.cos(f)));
  }
  const shaft = polyPath(shaftPts);
  const hr = MALLET_HEAD_R[head];
  const hc = onShaft(end + hr * 0.8, 0);
  const headPath = Skia.Path.Make();
  if (hr > 0) headPath.addCircle(hc.u, hc.v, hr);
  return {
    body,
    rim: rimL(body, 2, L),
    thumb: smoothClosed(a.thumb),
    shaft,
    head: headPath,
    headC: hc,
    headR: hr,
    shaftA: onShaft(0, r),
    shaftB: onShaft(0, -r),
    sleeve,
    sleeveOn,
    paintShaft,
    L,
    // the crease between two bends: a small dark wedge at the front edge, then a line fading back toward the knuckles
    wedges: many(a.notches.map((t) => polyPath([P(t.u + 0.8, t.v - 1), P(t.u + 1.2, t.v + 1.1), P(t.u - 3.2, t.v + 0.3), P(t.u - 3.4, t.v - 0.9)]))),
    creases: a.creases.map((q) => ({ path: smoothOpen(q), a: q[0], b: q[q.length - 1] })),
    // the bends' front and lower edges turning away from the light (only on the curled fingers)
    frontEdge: (() => {
      const zone = Skia.Path.Make();
      zone.addRect(Skia.XYWHRect(-16, 4, 30, 62));
      return op(rimL(body, 2.4, P(-L.u, -L.v)), zone, PathOp.Intersect);
    })(),
    thumbUnder: smoothOpen(a.thumbUnder),
    thumbUnderA: a.thumbUnder[0],
    thumbUnderB: a.thumbUnder[a.thumbUnder.length - 1],
    indexTop: smoothOpen(a.indexTop),
    indexTopA: a.indexTop[0],
    indexTopB: a.indexTop[a.indexTop.length - 1],
    thumbNail: smoothClosed(a.thumbNail),
    thumbNailGloss: ellipsePath({ c: onShaft(5, 17), rx: 3.2, ry: 1.6, rot: T }),
    cuffRim: smoothOpen(a.sleeve.slice(0, 17)),
    cuffSeam: smoothOpen(a.cuffSeam),
    broad: many(a.broad.map(ellipsePath)),
    lights: many(relit(a.lights, L, 1).map(ellipsePath)),
    darks: many(relit(a.darks, L, -1).map(ellipsePath)),
    tendons: many(a.tendons.map(ellipsePath)),
    knuckleLights: many(relit(a.knuckleLights, L, 1).map(ellipsePath)),
    knuckleDarks: many(relit(a.knuckleDarks, L, -1).map(ellipsePath)),
    thumbLights: many(relit(a.thumbLights, L, 1).map(ellipsePath)),
    thumbDarks: many(relit(a.thumbDarks, L, -1).map(ellipsePath)),
    baseLight: many(relit(a.baseLight, L, 1).map(ellipsePath)),
    thumbShadow: many(a.thumbShadow.map((e) => ({ ...e, c: P(e.c.u - (L.u - LIGHT.u) * 1.4, e.c.v - (L.v - LIGHT.v) * 1.4) })).map(ellipsePath)),
    // thin soft contact shadows on the shaft: just under the thumb's pad, just over the index's bend (no dark cap)
    contact: many([{ c: onShaft(4.6, 2.3), rx: 8, ry: 1.1, rot: T }, { c: onShaft(2.6, -2.9), rx: 3.6, ry: 0.9, rot: T }].map(ellipsePath)),
  };
}
type Built = ReturnType<typeof build>;

/** The hand's one skin light (the approved hands': one fixed span, every piece shares it — no seam). */
function HandFill({ path, L }: { path: SkPath; L: Pt }) {
  const { HAND } = useLook();
  const c = { u: -36, v: 14 };
  const Ld = L;
  const n = Math.hypot(Ld.u, Ld.v) || 1;
  const R = 78;
  return (
    <Path path={path}>
      <LinearGradient start={vec(c.u + (Ld.u / n) * R, c.v + (Ld.v / n) * R)} end={vec(c.u - (Ld.u / n) * R, c.v - (Ld.v / n) * R)} colors={HAND} positions={[0, 0.35, 0.75, 1]} />
    </Path>
  );
}

function Paint({ B }: { B: Built }) {
  const { MAT, NAIL } = useLook();
  const SKIN = MAT.skin;
  const shirt = MAT.shirt;
  const L = B.L;
  // (the shaft lit on its side toward the light: its top in the neutral drawing)
  const litTop = S * L.u - C * L.v > 0;
  const sA = litTop ? B.shaftA : B.shaftB;
  const sB = litTop ? B.shaftB : B.shaftA;
  const litTopArm = L.v <= 0;
  const sh = P(-L.u * 1.3, -L.v * 1.3);
  return (
    <Group>
      {/* 1. THE SHAFT (inside the hand, behind it), the felt head at its far end (option `paintShaft={false}`: the
          scene's own mallet is drawn there instead — only the hand's shadows land on it) */}
      {B.paintShaft ? (
        <Group>
          <Path path={B.shaft}>
            <LinearGradient start={vec(sA.u, sA.v)} end={vec(sB.u, sB.v)} colors={SHAFT_STOPS} positions={SHAFT_POS} />
          </Path>
          <Path path={B.shaft} style="stroke" strokeWidth={0.7} color="#2a1a0c" opacity={0.55} />
        </Group>
      ) : null}
      {B.paintShaft && B.headR > 0 ? (
        <Group>
          <Path path={B.head}>
            <RadialGradient c={vec(B.headC.u + L.u * B.headR * 0.45, B.headC.v + L.v * B.headR * 0.45)} r={B.headR * 1.5} colors={FELT} positions={[0, 0.4, 0.78, 1]} />
          </Path>
          <Path path={B.head} style="stroke" strokeWidth={0.8} color="#5d5446" opacity={0.45} />
        </Group>
      ) : null}
      {/* the hand's soft shadow on the shaft where it leaves the fist, and the contact under the thumb's pad */}
      <Group clip={B.shaft}>
        <Group transform={[{ translateX: sh.u }, { translateY: sh.v }]}>
          <Path path={B.body} color="#1a0f08" opacity={0.32}>
            <Blur mm={1.2} />
          </Path>
        </Group>
        <Path path={B.contact} color="#1a0f08" opacity={0.34}>
          <Blur mm={0.7} />
        </Path>
      </Group>

      {/* 2. THE HAND (in front of the shaft) */}
      <HandFill path={B.body} L={L} />
      <Group clip={B.body}>
        <Path path={B.broad} color={SKIN.rim} opacity={0.12}>
          <Blur mm={5} />
        </Path>
        <Path path={B.tendons} color={SKIN.rim} opacity={0.05}>
          <Blur mm={1.2} />
        </Path>
        <Path path={B.lights} color={SKIN.rim} opacity={0.26}>
          <Blur mm={1.3} />
        </Path>
        <Path path={B.baseLight} color={SKIN.rim} opacity={0.3}>
          <Blur mm={2} />
        </Path>
        <Path path={B.darks} color={SKIN.deep} opacity={0.3}>
          <Blur mm={1.4} />
        </Path>
        <Path path={B.knuckleLights} color={SKIN.rim} opacity={0.32}>
          <Blur mm={1.6} />
        </Path>
        <Path path={B.knuckleDarks} color={SKIN.deep} opacity={0.26}>
          <Blur mm={1.3} />
        </Path>
        <Path path={B.frontEdge} color={SKIN.deep} opacity={0.24}>
          <Blur mm={0.9} />
        </Path>
        <Path path={B.wedges} color={SKIN.deep} opacity={0.6}>
          <Blur mm={0.5} />
        </Path>
        {/* each crease: clear at the front edge, fading back toward the knuckles */}
        {B.creases.map((c, i) => (
          <Path key={`c${i}`} path={c.path} style="stroke" strokeWidth={0.75} strokeCap="round">
            <LinearGradient start={vec(c.a.u, c.a.v)} end={vec(c.b.u, c.b.v)} colors={[SKIN.edge, `${SKIN.edge}70`, `${SKIN.edge}00`]} positions={[0, 0.45, 1]} />
            <Blur mm={0.25} />
          </Path>
        ))}
        {/* the index's top edge running in from the grip, faint */}
        <Path path={B.indexTop} style="stroke" strokeWidth={0.7} strokeCap="round">
          <LinearGradient start={vec(B.indexTopA.u, B.indexTopA.v)} end={vec(B.indexTopB.u, B.indexTopB.v)} colors={[`${SKIN.edge}80`, `${SKIN.edge}00`]} positions={[0, 1]} />
          <Blur mm={0.3} />
        </Path>
        <Path path={B.rim} color={SKIN.rim} opacity={0.26}>
          <Blur mm={1} />
        </Path>
        {/* the thumb's soft shadow on the hand just under it (it is nearer than the web and the index), dying out
            before its base so the base stays one form with the hand */}
        <Path path={B.thumbShadow} color={SKIN.deep} opacity={0.4}>
          <Blur mm={1.6} />
        </Path>
      </Group>

      {/* 3. THE THUMB (nearest at the top): the same skin light, its own soft lights and shades */}
      <HandFill path={B.thumb} L={L} />
      <Group clip={B.thumb}>
        <Path path={B.broad} color={SKIN.rim} opacity={0.12}>
          <Blur mm={5} />
        </Path>
        <Path path={B.baseLight} color={SKIN.rim} opacity={0.3}>
          <Blur mm={2} />
        </Path>
        <Path path={B.thumbLights} color={SKIN.rim} opacity={0.3}>
          <Blur mm={1.6} />
        </Path>
        <Path path={B.thumbDarks} color={SKIN.deep} opacity={0.34}>
          <Blur mm={1.4} />
        </Path>
        {/* the hand's own lit edge carried on along the thumb's top (the same edge: no seam) */}
        <Path path={B.rim} color={SKIN.rim} opacity={0.26}>
          <Blur mm={1} />
        </Path>
        {/* the nail: a slightly lighter rounded shape near the tip, a faint soft edge round it, a small gloss */}
        <Path path={B.thumbNail} color={NAIL.fill} opacity={0.38}>
          <Blur mm={0.45} />
        </Path>
        <Path path={B.thumbNail} style="stroke" strokeWidth={0.5} color={SKIN.edge} opacity={0.28}>
          <Blur mm={0.25} />
        </Path>
        <Group transform={[{ translateX: L.u * 1 }, { translateY: L.v * 1 }]}>
          <Path path={B.thumbNailGloss} color="#fff6ee" opacity={0.16}>
            <Blur mm={0.8} />
          </Path>
        </Group>
      </Group>
      {/* its underside over the hand: one clear soft line from the grip back to where it merges into the hand */}
      <Path path={B.thumbUnder} style="stroke" strokeWidth={0.85} strokeCap="round">
        <LinearGradient start={vec(B.thumbUnderA.u, B.thumbUnderA.v)} end={vec(B.thumbUnderB.u, B.thumbUnderB.v)} colors={[SKIN.edge, `${SKIN.edge}b0`, `${SKIN.edge}00`]} positions={[0, 0.7, 1]} />
      </Path>
      {/* the thin soft outline round the whole silhouette (the approved hands') */}
      <Path path={B.body} style="stroke" strokeWidth={0.9} strokeJoin="round" color={SKIN.edge} opacity={0.5} />

      {/* the cuff over the wrist (none where the figure's own sleeve takes the wrist) */}
      {B.sleeveOn ? (
        <Group>
          <Path path={B.sleeve}>
            <LinearGradient start={vec(0, litTopArm ? -22 : 42)} end={vec(0, litTopArm ? 42 : -22)} colors={shirt.form} positions={shirt.pos} />
          </Path>
          <Group clip={B.sleeve}>
            <Path path={B.cuffSeam} style="stroke" strokeWidth={1.6} color={shirt.deep} opacity={0.18}>
              <Blur mm={1} />
            </Path>
            <Path path={B.cuffRim} style="stroke" strokeWidth={3} strokeCap="round" color={shirt.rim} opacity={0.18}>
              <Blur mm={1.2} />
            </Path>
          </Group>
          <Path path={B.sleeve} style="stroke" strokeWidth={0.9} strokeJoin="round" color={shirt.edge} opacity={0.4}>
            <Blur mm={0.35} />
          </Path>
        </Group>
      ) : null}
    </Group>
  );
}

export type MalletHandBackProps = {
  /** The cast member (absent: the look already given round it, inside a figure). */
  who?: CastMember;
  /** Where the fulcrum goes on the page (pt). */
  x: number;
  y: number;
  /** pt per mm. */
  s: number;
  /** Turned from the neutral drawing (radians): the shaft then runs at MALLET_SHAFT_TILT + rot on the page. */
  rot?: number;
  /** (option) the LEFT hand: the mirror image (forearm from the right), re-lit so the light stays upper left. */
  mirror?: boolean;
  /** How far the shaft runs past the fulcrum toward the head (mm); the head sits on its end. */
  shaft?: number;
  head?: MalletHead;
  /** (option, default true) false: no sleeve of its own. */
  sleeve?: boolean;
  /** (option, default true) false: keep the scene's own figure scale. */
  ownScale?: boolean;
  /** (option, default MALLET_SHAFT_R) the shaft's radius (mm): the scene's own mallet's. */
  shaftR?: number;
  /** (option, default true) false: the shaft and head are not painted — the scene draws its own mallet on the same
   *  line under the hand; the hand's soft shadows still land on it. */
  paintShaft?: boolean;
};

/** Where the art's own cuff rim is (local mm): a figure's sleeve mouth goes here. */
export const MALLET_HAND_CUFF = CUFF_C;

/** The art's frame on the page: local (mm) → page. */
export function malletHandToPage({ x, y, s, rot = 0, mirror = false }: Pick<MalletHandBackProps, 'x' | 'y' | 's' | 'rot' | 'mirror'>) {
  const m = mirror ? -1 : 1;
  const co = Math.cos(rot);
  const si = Math.sin(rot);
  return (q: Pt): Pt => {
    const u = q.u * s * m;
    const v = q.v * s;
    return P(x + u * co - v * si, y + u * si + v * co);
  };
}
/** The rotation that lays the hand along a page shaft running at `angle` (radians, toward the head; for the mirrored
 *  hand the head end points the other way, so pass the page angle of the shaft from the fulcrum toward the head). */
export function malletHandRotFor(angle: number, mirror = false): number {
  return mirror ? angle - Math.PI + MALLET_SHAFT_TILT : angle - MALLET_SHAFT_TILT;
}

/**
 * The right hand on its mallet, for one cast member: the fulcrum drawn at (x, y) pt, `s` pt per mm, turned `rot`
 * radians from the neutral drawing (forearm level from the left, shaft 15° down to the right). With `mirror`, the left.
 */
export function MalletHandBack({ who, x, y, s, rot = 0, mirror = false, shaft = 200, head = 'timpani', sleeve = true, ownScale = true, shaftR = MALLET_SHAFT_R, paintShaft = true }: MalletHandBackProps) {
  const B = useMemo(() => {
    const M = lightMap(rot, mirror);
    return build(MALLET_HAND_BACK, shaft, head, mv(M, LIGHT.u, LIGHT.v), sleeve, shaftR, paintShaft);
  }, [rot, mirror, shaft, head, sleeve, shaftR, paintShaft]);
  const paint = <Paint B={B} />;
  const art = who ? <FigureLook look={who.look}>{paint}</FigureLook> : paint;
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { rotate: rot }, { scale: s }, ...(mirror ? [{ scaleX: -1 }] : [])]}>
      {ownScale ? <FigureScale ptPerMm={s}>{art}</FigureScale> : art}
    </Group>
  );
}
