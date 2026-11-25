/**
 * FIGURE V2 — A RIGHT HAND HOLDING A TIMPANI / CONCERT BASS DRUM MALLET, SEEN FROM THE PALM SIDE
 * (owner 2026-11-24, "one hand at a time": the mallet hand's other side). The timpanist's far (left) hand shows its
 * PALM to the side camera; this is that hand, authored as the RIGHT hand seen from the palm side (the option `mirror`
 * gives the left hand, re-lit). It is the SAME hand and the SAME grip as malletHandBack.tsx (approved, frozen), seen
 * from the other side: the same silhouette (mirrored), the same mallet, the same shaft line, paint, tones and cuff.
 *
 * THE GRIP (as malletHandBack): "thumbs-up" (French) turned a little toward American, straight wrist, the thumb along
 * the TOP of the shaft, the four fingers curled under it; the fulcrum between the PAD OF THE THUMB and the index at its
 * middle joint; the shaft ≈ 15° below the forearm.
 *
 * Frame: millimetres, origin on the shaft's axis AT THE FULCRUM, +x right, +y DOWN. Neutral position: the forearm
 * horizontal from the RIGHT (seen from the palm side the hand points the other way from malletHandBack), the shaft
 * running on to the LEFT tilted DOWN by MALLET_SHAFT_TILT. The shaft's line is malletHandBack's, mirrored: the butt
 * (45 mm behind the fulcrum) rises a little toward the thumb's base, inside the hand.
 *
 * What the eye sees from the palm side (right to left):
 *   1. the cuff, then the wrist's inner side (≈ 57 mm, narrower than the hand): two tendons at most hinted, the
 *      wrist crease where the heel begins;
 *   2. the heel of the hand: the thumb mound (upper, rising into the thumb as one form) and the little-finger pad
 *      (lower, along the hand's lower edge), the palm's hollow between them; the mound's soft crease curving from the
 *      web down toward the wrist;
 *   3. the shaft lying IN the palm: its butt end seen for a few mm just behind the index's fingertip, between the
 *      thumb (above) and the palm, its last mm tucked under the thumb mound's edge (within the hand, never outside);
 *   4. the four fingers curled round toward the camera, their last segments lying across the palm pointing back
 *      toward the heel, the fingertips tucked in, each with a quiet nail: the index highest and loosest, wrapping over
 *      the shaft up to the thumb's underside (it hides the shaft from the grip to its tip); the middle the longest;
 *      the ring; the little finger the smallest, curling up from the hand's lower edge. Their middle joints form the
 *      fist's far (left) edge: ONE row of rounded bends, each its own size (from this side the big knuckles are not
 *      seen; there is no second row);
 *   5. the thumb along the top of the shaft, seen from its inner side (no nail): out of the thumb mound as one form
 *      (no flap, no notch), its base segment, a soft crease at its last joint, its pad pressing the shaft opposite
 *      the index's bend (the fulcrum), its blunt tip a little past the bend;
 *   6. the shaft leaving the grip on the left from BETWEEN the thumb's pad (above) and the index's bend (below).
 * Paint order: the hand (palm, heel, wrist) → the shaft (lying in the palm, in front of it) → the fingers (in front
 * of the shaft) → the thumb (nearest at the top) → the cuff.
 */
import { useMemo } from 'react';
import { Group, LinearGradient, Path, PathOp, RadialGradient, Skia, vec } from '@shopify/react-native-skia';
import { Blur, FigureScale } from './detail';
import { FigureLook, useLook } from './look';
import { ellipsePath, op, smoothClosed, smoothOpen, type SkPath } from './paths';
import { LIGHT, P, type Poly, type Pt } from './geom.ts';
import type { Ellipse } from './sidePlan.ts';
import { MALLET_BUTT, MALLET_HAND_BACK, MALLET_HEAD_R, MALLET_SHAFT_R, MALLET_SHAFT_TILT, type MalletHandBackProps, type MalletHead } from './malletHandBack';

export { MALLET_BUTT, MALLET_HEAD_R, MALLET_SHAFT_R, MALLET_SHAFT_TILT };
export type { MalletHead };

/* ── the art (pure: the tests read these points) ── */

const pts = (xs: readonly (readonly [number, number])[]): Poly => xs.map(([x, y]) => P(x, y));
const E = (x: number, y: number, rx: number, ry: number, rot = 0): Ellipse => ({ c: P(x, y), rx, ry, rot });
const mx = (q: Pt): Pt => P(-q.u, q.v);

const C = Math.cos(MALLET_SHAFT_TILT);
const S = Math.sin(MALLET_SHAFT_TILT);
const T = MALLET_SHAFT_TILT;
/** A point given along the shaft (`a` mm from the fulcrum toward the head, which lies to the LEFT here) and `d` mm
 *  ABOVE its axis: malletHandBack's onShaft, mirrored. */
export const onShaftPalm = (a: number, d: number): Pt => P(-(a * C + d * S), a * S - d * C);
/** A point's place along the shaft and its height above the axis (the inverse of onShaftPalm). */
export const shaftCoordsPalm = (q: Pt): { a: number; d: number } => ({ a: -q.u * C + q.v * S, d: -q.u * S - q.v * C });
const on = onShaftPalm;

/**
 * THE THUMB'S TOP EDGE (owner 2026-11-24: "the thumb need to have the middle knuckle bent just a little"): the base
 * segment rises a little from its base joint to the middle joint (≈ 3° above the shaft), the joint a soft low peak
 * (26.4 mm over the shaft's axis, 15 mm behind the fulcrum), the end segment angling down from it (≈ 14°) onto the
 * pad: a bend of ≈ 17°. The base joint, the tip and the pad are malletHandBack's, unchanged.
 */
const THUMB_TOP: Poly = [
  mx(P(-40, -34.2)), mx(P(-34, -34.9)),
  // the base segment, rising a little
  on(-34, 25.4), on(-21, 26),
  // the middle joint: a soft low peak
  on(-15, 26.4), on(-11, 26.2),
  // the end segment, angled down onto the pad
  on(-7, 25.5), on(-2.5, 24.2), on(3, 22.6),
  // the tip (as before)
  on(8.6, 21), on(12.4, 17.8), on(14.6, 13.4), on(15, 9), on(13.8, 5.6), on(11.2, 3.9),
];
/** Where the thumb's top edge starts in malletHandBack's outline (there the bent thumb's points replace its own). */
export const PALM_THUMB_TOP_AT = 8;
/** THE HAND'S ONE OUTLINE: malletHandBack's silhouette, mirrored (the same hand from the other side), but for the
 *  thumb's top edge, bent a little at its middle joint. */
const BODY: Poly = [
  ...MALLET_HAND_BACK.body.slice(0, PALM_THUMB_TOP_AT).map(mx),
  ...THUMB_TOP,
  ...MALLET_HAND_BACK.body.slice(PALM_THUMB_TOP_AT + MALLET_HAND_BACK.thumbTop.length).map(mx),
];
/** Where the thumb's pad and the index's bend meet inside the grip (the shaft goes in between them). */
const GRIP_IN = mx(MALLET_HAND_BACK.mouth[0]);
const MOUTH: Poly = MALLET_HAND_BACK.mouth.map(mx);

/**
 * THE FOUR FINGERS from the palm side, top to bottom: each ONE closed form from its middle joint's bend (on the fist's
 * left edge: the same bends as the silhouette) to its tucked fingertip. `front`: the bend's span on the left edge;
 * `tip`: the fingertip's farthest point; `w`: the last segment's width (mm). They differ: the index the highest and
 * loosest, wrapping over the shaft; the middle the longest; the little finger the smallest.
 */
export const MALLET_PALM_FINGERS = [
  { name: 'index', top: 4.7, bottom: 21.2, bend: P(-6.2, 11.6), tip: P(32.6, -6), w: 12.6 },
  { name: 'middle', top: 21.2, bottom: 36.8, bend: P(-2.6, 28.8), tip: P(35.6, 10.6), w: 12.2 },
  { name: 'ring', top: 36.8, bottom: 50.8, bend: P(1.4, 43.8), tip: P(33.2, 25), w: 11.2 },
  { name: 'little', top: 50.8, bottom: 63, bend: P(6.4, 56.8), tip: P(29, 37.4), w: 9.4 },
] as const;

// (the bends: the silhouette's own points, mirrored)
const BEND_INDEX = pts([[-1.6, 20.8], [-4, 18.8], [-5.8, 15.4], [-6.2, 11.6], [-5.3, 7.8], [-3, 4.7]]);
const BEND_MIDDLE = pts([[2.4, 36.6], [-0.2, 35.2], [-2, 32.4], [-2.6, 28.8], [-2.2, 25.2], [-0.8, 22.4]]);
const BEND_RING = pts([[6.6, 50.7], [3.8, 49.6], [2, 47], [1.4, 43.8], [1.8, 40.6], [3, 38]]);
const BEND_LITTLE = pts([[13, 62.8], [9.4, 61.6], [7.2, 59.4], [6.4, 56.8], [6.6, 54.2], [7.4, 52]]);

/** Each finger's underside (the seam with the finger below), from the tip back to the notch on the left edge. */
// (each finger tapers from its bend to its tip: the last segment narrower than the bend)
const UNDER_INDEX = pts([[27.4, 1.4], [22, 3.4], [16, 7.6], [10.4, 13.6], [6, 18.4], [0.6, 21.2]]);
const UNDER_MIDDLE = pts([[30, 17.2], [25, 19], [18, 23], [11.4, 28.4], [7.6, 32.6], [4.4, 36.8]]);
const UNDER_RING = pts([[29, 30.6], [25, 32.4], [19.4, 35.8], [14.4, 40.6], [11, 45.4], [8.8, 50.8]]);

const INDEX: Poly = [
  GRIP_IN,
  // its top: wrapping over the shaft, up under the thumb's underside (the thumb painted over it)
  ...pts([[8, -4.4], [14.5, -7.4], [21, -10.4], [26, -12.3]]),
  // the fingertip, tucked toward the thumb's base
  ...pts([[29.6, -11.8], [31.9, -9.4], [32.6, -6], [31.6, -2.4], [29.8, 0.2]]),
  ...UNDER_INDEX,
  ...BEND_INDEX,
  ...MOUTH.slice(1).reverse(),
];
const MIDDLE: Poly = [
  P(0.6, 21.2),
  // its top: just under the index's underside (overlapped by it), parting from it toward the tip
  ...pts([[6, 17.8], [10.4, 13], [16, 7], [21.4, 3.4], [26.4, 3]]),
  ...pts([[30.4, 3.6], [33.8, 5.6], [35.6, 8.8], [35.4, 12.4], [33.4, 15.4]]),
  ...UNDER_MIDDLE,
  ...BEND_MIDDLE,
];
const RING: Poly = [
  P(4.4, 36.8),
  ...pts([[7.6, 32], [11.4, 27.8], [18, 22.2], [25, 18.4], [29, 18.2]]),
  ...pts([[31, 19.2], [32.8, 21.6], [33.2, 25], [31.8, 28.4]]),
  ...UNDER_RING,
  ...BEND_RING,
];
// (the smallest: shorter than the ring, its tip curled in farther)
const LITTLE: Poly = [
  P(8.8, 50.8),
  ...pts([[11, 44.8], [14.4, 39.8], [19.4, 35], [23.6, 33], [26.4, 32.6]]),
  ...pts([[28.4, 34.2], [29, 37.4], [28, 40.4], [25.8, 42.6]]),
  // its underside curling up from the hand's lower edge
  ...pts([[23.2, 45.6], [20.8, 50.2], [19, 55.6], [17.6, 63]]),
  ...BEND_LITTLE,
];

/**
 * THE THUMB (nearest at the top), with its base: its top edge IS the hand's top edge (the same points, mirrored: one
 * outline), its tip and pad the same; its underside runs back from the grip along the top of the shaft to the web
 * and closes INSIDE the hand along the top edge (painted in the same skin: one form with the mound, no seam).
 */
const THUMB_PAD: Poly = MALLET_HAND_BACK.thumbPad.map(mx);
const THUMB_ROOT: Poly = pts([[63, -23.8], [57, -27.6], [48.6, -31.4]]);
// (along the butt too it lies over the shaft's top edge: the thumb is the nearer; a shallow hollow under the middle
// joint, following the bend)
const THUMB_BELOW: Poly = [on(-8.4, 1.6), on(-16, 3.2), on(-24, 3.8), on(-30, 4.4), on(-35.6, 4.4), on(-41, 4.4), P(44, -18.6), P(50, -20.4), P(57, -23.4)];
const THUMB: Poly = [...THUMB_ROOT, ...THUMB_TOP, ...THUMB_PAD, GRIP_IN, ...THUMB_BELOW];
/** The thumb's underside drawn as one soft line: from the grip back along the shaft to the web. */
const THUMB_UNDER: Poly = [GRIP_IN, ...THUMB_BELOW.slice(0, 6)];

/** The thumb mound's edge: from the web, over the shaft's last mm, curving down toward the wrist (its soft crease). */
const MOUND_EDGE: Poly = pts([[37.8, -17.6], [40.4, -12.6], [41.6, -7.2], [43.2, -1.6], [46.4, 3.6], [51.4, 8.4], [58.4, 12.4], [66.4, 15.2], [75, 16.6]]);
/** What lies in front of the shaft's butt: the mound (the shaft is shown only to its left). */
const LIP: Poly = [...MOUND_EDGE.slice(0, 5), P(60, 3.6), P(60, -40), P(37.8, -40)];

/** The notches between neighbouring bends on the left edge. */
const NOTCHES: readonly Pt[] = [P(0.6, 21.2), P(4.4, 36.8), P(8.8, 50.8)];

/** The cuff (malletHandBack's, mirrored): its rim a near-straight arc, the sleeve on to the right. */
const SLEEVE: Poly = MALLET_HAND_BACK.sleeve.map(mx);
const CUFF_SEAM: Poly = MALLET_HAND_BACK.cuffSeam.map(mx);
const CUFF_C = mx(P(-101, 10));

/** A quiet nail: a rounded oblong `len` along `rot`, `w` across. */
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
const tendon = (a: Pt, b: Pt): Ellipse => ({ c: P((a.u + b.u) / 2, (a.v + b.v) / 2), rx: (Math.hypot(b.u - a.u, b.v - a.v) / 2) * 0.8, ry: 1.2, rot: Math.atan2(b.v - a.v, b.u - a.u) });

export type MalletHandPalmArt = {
  body: Poly;
  fingers: { index: Poly; middle: Poly; ring: Poly; little: Poly };
  thumb: Poly;
  thumbTop: Poly;
  thumbPad: Poly;
  thumbUnder: Poly;
  mouth: Poly;
  moundEdge: Poly;
  lip: Poly;
  notches: readonly Pt[];
  unders: Poly[];
  nails: Poly[];
  warm: Ellipse[];
  thumbTip: Pt;
  sleeve: Poly;
  cuffSeam: Poly;
  /** Where the heel meets the wrist (x, mm). */
  wristX: number;
  lights: Ellipse[];
  darks: Ellipse[];
  contact: Ellipse[];
  creases: Poly[];
  tendons: Ellipse[];
  fingerLights: Ellipse[];
  fingerDarks: Ellipse[];
  thumbLights: Ellipse[];
  thumbDarks: Ellipse[];
  baseLight: Ellipse[];
  thumbShadow: Ellipse[];
  thumbCrease: Poly;
  /** The thumbnail: facing up, seen from the thumb's side — a narrow sliver along the end segment's top edge. */
  thumbNail?: Poly;
  /** Its upper rim (on the thumb's outline) and its side fold (the fine line on the camera side). */
  thumbNailRim?: Poly;
  thumbNailFold?: Poly;
  /** Its free edge's tiny lighter rim, toward the tip. */
  thumbNailTip?: Poly;
};

export const MALLET_HAND_PALM: MalletHandPalmArt = {
  body: BODY,
  fingers: { index: INDEX, middle: MIDDLE, ring: RING, little: LITTLE },
  thumb: THUMB,
  thumbTop: THUMB_TOP,
  thumbPad: THUMB_PAD,
  thumbUnder: THUMB_UNDER,
  mouth: MOUTH,
  moundEdge: MOUND_EDGE,
  lip: LIP,
  notches: NOTCHES,
  unders: [UNDER_INDEX, UNDER_MIDDLE, UNDER_RING],
  // (the last segments' backs face the camera: a quiet nail near each tip, along the finger)
  nails: [nail(P(28.2, -5.4), 7.8, 6.4, -0.36), nail(P(31.2, 9.8), 7.6, 6.4, -0.32), nail(P(29.3, 24.4), 6.8, 5.6, -0.48), nail(P(25.6, 37.8), 5.4, 4.6, -0.78)],
  // (the fingertips warmer, as the approved hands')
  warm: [E(30, -5.4, 3.6, 4.2, -0.36), E(33, 9.8, 3.4, 4, -0.32), E(31, 24.6, 3, 3.6, -0.48), E(27, 37.6, 2.6, 3, -0.78)],
  thumbTip: mx(MALLET_HAND_BACK.thumbTip),
  sleeve: SLEEVE,
  cuffSeam: CUFF_SEAM,
  wristX: 80,
  lights: [
    // the thumb mound, lit on its upper left; the little-finger pad likewise; the wrist's top side
    E(55, -9, 12, 8, 0.5), E(57, 38, 13, 6, 0.42), E(96, -11, 10, 4),
  ],
  darks: [
    // the palm's hollow behind the fingertips; the mound's lower side along its crease
    E(44, 23, 6, 9, 0.2), E(60, 15.4, 15, 3.2, 0.25),
    // the hand's lower edge turning away; the wrist's lower side; the wrist going into the cuff
    E(44, 56, 22, 3.4, -0.33), E(90, 36.4, 10, 2.2), E(97, 10, 2.6, 27),
  ],
  // the fingertips' soft shadows on the palm (each tip tucked in)
  contact: [E(34.4, -4.6, 2.6, 5.4, 0.2), E(37.4, 10.6, 2.4, 5.2), E(34.8, 25, 2.2, 4.6), E(30.2, 38.6, 2, 4.2, -0.5)],
  creases: [
    // the wrist crease where the heel meets the wrist (soft)
    pts([[81, -14], [80.2, -2], [80.4, 12], [81.4, 28]]),
  ],
  tendons: [tendon(P(84, 4), P(110, 4.4)), tendon(P(84, 15), P(110, 15.6))],
  fingerLights: [
    // each bend's lit upper left (the left edge faces the light), each finger's upper side, each tip's top
    E(-3.2, 8.4, 3.4, 2.4, -0.5), E(14, -3.2, 8, 2.2, -0.42), E(29.4, -9.4, 2.6, 1.4, -0.3),
    E(-0.4, 25, 3.2, 2.2, -0.4), E(16, 11.4, 8, 2, -0.55), E(32, 5.8, 2.8, 1.4, -0.3),
    E(3.2, 40.4, 3, 2, -0.4), E(17, 26, 7, 1.9, -0.6), E(31.4, 20.6, 2.4, 1.3, -0.4),
    E(8.2, 53.8, 2.6, 1.7, -0.5), E(17.6, 40.6, 5, 1.6, -0.8), E(27, 34, 2, 1.2, -0.6),
  ],
  fingerDarks: [
    // each finger's lower side, turning down into the seam below it; the little finger's underside
    E(14, 9.4, 10, 1.9, -0.62), E(17, 23.6, 10, 1.9, -0.6), E(18.4, 36.4, 8.6, 1.8, -0.68), E(20.4, 53.4, 5.6, 1.8, -1.15),
    // each bend's lower side
    E(-2.8, 18.8, 3, 1.4, 0.4), E(0.6, 34.6, 2.8, 1.3, 0.4), E(4.8, 48.8, 2.6, 1.2, 0.4), E(10.6, 61.2, 3.4, 1.3, 0.2),
  ],
  thumbLights: [
    // along the top of the thumb: the base segment and the end segment, parted at its last joint
    { c: on(-25, 22.2), rx: 8.4, ry: 2.6, rot: -T + 0.05 },
    { c: on(-2, 20.4), rx: 9, ry: 2.8, rot: -T - 0.24 },
    // the base joint's swell
    E(37, -30.4, 8, 3.4, 0.08),
  ],
  baseLight: [E(60, -24.6, 13, 2.8, 0.4)],
  thumbDarks: [
    // the underside turning away along its length; the pad's underside over the shaft near the tip
    { c: on(-14, 5.4), rx: 18, ry: 2.4, rot: -T },
    { c: on(7, 5), rx: 6.5, ry: 2, rot: -T },
  ],
  thumbShadow: [
    { c: on(-8, -0.8), rx: 6, ry: 2, rot: -T },
    { c: on(-17, 0.4), rx: 8, ry: 2, rot: -T },
    { c: on(-27, 2), rx: 7, ry: 1.8, rot: -T },
  ],
  // the soft crease at the thumb's last joint, across its inner side (short: it fades upward)
  thumbCrease: [on(-14.2, 4.4), on(-14.6, 8.6), on(-15.2, 12.6)],
  ...thumbNailArt(),
};

/**
 * THE THUMBNAIL (owner 2026-11-24: "where is the thumbnail"): the nail faces UP (away from the shaft) and the camera
 * sees the thumb from its side, so the nail shows strongly foreshortened — a narrow plate lying ALONG THE TOP EDGE of
 * the end segment, from the fulcrum's line to 12 mm in front of it (its free edge 3 mm short of the tip's end): 12 mm
 * long, at most 3.8 mm deep, a short rounded cuticle end toward the joint, a blunt free edge toward the tip. Its upper
 * rim lies on the thumb's outline (painted inside the thumb, so it never floats); its lower edge is the side fold.
 */
function thumbNailArt(): Pick<MalletHandPalmArt, 'thumbNail' | 'thumbNailRim' | 'thumbNailFold' | 'thumbNailTip'> {
  // (the end segment's top edge, as authored in THUMB_TOP: along the shaft → height over its axis)
  const edge: [number, number][] = [[-11, 26.2], [-7, 25.5], [-2.5, 24.2], [3, 22.6], [8.6, 21], [12.4, 17.8]];
  const topD = (a: number): number => {
    for (let i = 1; i < edge.length; i++) {
      if (a <= edge[i][0]) {
        const [a0, d0] = edge[i - 1];
        const [a1, d1] = edge[i];
        return d0 + ((a - a0) / (a1 - a0)) * (d1 - d0);
      }
    }
    return edge[edge.length - 1][1];
  };
  const a0 = 0;
  const a1 = 12;
  const n = 14;
  // (a plate, not a lens: blunt at both ends — the rounded cuticle, the free edge — deepest a little toward the tip)
  const depth = (t: number) => 3.8 * Math.pow(1 - Math.pow(Math.abs(2 * Math.pow(t, 1.15) - 1), 2.6), 0.45);
  const rimOut: Poly = [];
  const fold: Poly = [];
  const rim: Poly = [];
  for (let j = 0; j <= n; j++) {
    const t = j / n;
    const a = a0 + (a1 - a0) * t;
    // (a hair past the outline: the thumb's own clip trims it exactly to the edge)
    rimOut.push(on(a, topD(a) + 0.3));
    rim.push(on(a, topD(a) - 0.5));
    if (j > 0 && j < n) fold.push(on(a, topD(a) - depth(t)));
  }
  // the free edge's tiny lighter rim: just inside the plate's end toward the tip
  const tip: Poly = [0.2, 0.5, 0.8].map((k) => on(a1 - 1.1 - k * 0.5, topD(a1 - 1.1) - depth(0.9) * k));
  return { thumbNail: [...rimOut, ...fold.slice().reverse()], thumbNailRim: rim.slice(1, -1), thumbNailFold: fold, thumbNailTip: tip };
}

/* ── the paint ── */

const SHAFT_STOPS = ['#5a3f26', '#b48c5c', '#e6c999', '#c9a574', '#9d774c', '#6d4f30', '#4a321d'];
const SHAFT_POS = [0, 0.13, 0.31, 0.46, 0.66, 0.86, 1];
const FELT = ['#f6f1e7', '#e3dccd', '#bdb3a1', '#8c8170'];
const WARM = '#b8665a';

type LightMap = { a: number; b: number; c: number; d: number };
function lightMap(rot: number, mirror: boolean): LightMap {
  const m = mirror ? -1 : 1;
  const co = Math.cos(rot);
  const si = Math.sin(rot);
  return { a: m * co, b: m * si, c: -si, d: co };
}
const mv = (M: LightMap, u: number, v: number): Pt => P(M.a * u + M.b * v, M.c * u + M.d * v);
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
function rimL(path: SkPath, w: number, L: Pt): SkPath {
  const q = path.copy();
  q.offset(-L.u * w, -L.v * w);
  return op(path, q, PathOp.Difference);
}

/** Each finger's turn round its own length: [a point on its upper side, a point on its lower side] (mm). */
const FINGER_ACROSS: [Pt, Pt][] = [
  [P(14, -6.6), P(18.6, 5.4)],
  [P(16, 8.2), P(21.2, 21.4)],
  [P(18, 22.6), P(22.6, 34.6)],
  [P(17.6, 37.4), P(23.4, 47)],
];

function build(a: MalletHandPalmArt, end: number, head: MalletHead, L: Pt, sleeveOn: boolean, r: number, paintShaft: boolean, wood: ShaftWood | null = null, mirror = false) {
  const body0 = smoothClosed(a.body);
  const sleeve = smoothClosed(a.sleeve, 0.2);
  const body = sleeveOn ? body0 : op(body0, sleeve, PathOp.Difference);
  const shaftPts: Poly = [on(end, r), on(end, -r)];
  const ca = -MALLET_BUTT + r;
  for (let j = 0; j <= 8; j++) {
    const f = (Math.PI * j) / 8;
    shaftPts.push(on(ca - r * Math.sin(f), -r * Math.cos(f)));
  }
  const shaft = polyPath(shaftPts);
  const lip = smoothClosed(a.lip, 0.3);
  // (the shaft shown: all of it but the last mm under the thumb mound; with paintShaft false, only the part inside the
  // hand's outline, which the scene's own mallet drawn under the hand cannot show)
  const shaftShown0 = op(shaft, lip, PathOp.Difference);
  const shaftShown = paintShaft ? shaftShown0 : op(shaftShown0, body0, PathOp.Intersect);
  // (its outline: the whole shaft's, drawn only where the shaft is shown — the cut under the mound is not an edge)
  const shaftEdge = shaft;
  const outsideLip = Skia.Path.Make();
  outsideLip.addRect(Skia.XYWHRect(-400, -200, 800, 400));
  const shaftEdgeClip = op(op(outsideLip, lip, PathOp.Difference), paintShaft ? outsideLip : body0, PathOp.Intersect);
  const hr = MALLET_HEAD_R[head];
  const hc = on(end + hr * 0.8, 0);
  const headPath = Skia.Path.Make();
  if (hr > 0) headPath.addCircle(hc.u, hc.v, hr);
  const fingers = [a.fingers.little, a.fingers.ring, a.fingers.middle, a.fingers.index].map((f) => smoothClosed(f, 0.45));
  const group = many(fingers);
  return {
    body,
    rim: rimL(body, 2, L),
    shaft: shaftShown,
    shaftEdge,
    shaftEdgeClip,
    head: headPath,
    headC: hc,
    headR: hr,
    shaftA: on(0, r),
    shaftB: on(0, -r),
    sleeve,
    sleeveOn,
    paintShaft,
    wood,
    // (a lesson's wood: its first colour on the side its own Mallet paints first — local −y of the grip → head frame —
    // which is the drawing's upper side when mirrored, its lower side when not)
    woodA: mirror ? on(0, r) : on(0, -r),
    woodB: mirror ? on(0, -r) : on(0, r),
    L,
    // little, ring, middle, index (painted in that order: each one up a little in front of the one below)
    fingers,
    across: [...FINGER_ACROSS].reverse(),
    group,
    groupRim: rimL(group, 1.6, L),
    thumb: smoothClosed(a.thumb),
    wedges: many(a.notches.map((t) => polyPath([P(t.u - 0.8, t.v - 1), P(t.u - 1.2, t.v + 1.1), P(t.u + 3.2, t.v + 0.3), P(t.u + 3.4, t.v - 0.9)]))),
    unders: a.unders.map((q) => ({ path: smoothOpen(q), a: q[0], b: q[q.length - 1] })),
    nails: a.nails.map((n) => smoothClosed(n)),
    warm: many(a.warm.map(ellipsePath)),
    thumbUnder: smoothOpen(a.thumbUnder),
    thumbUnderA: a.thumbUnder[0],
    thumbUnderB: a.thumbUnder[a.thumbUnder.length - 1],
    thumbCrease: smoothOpen(a.thumbCrease),
    thumbNail: a.thumbNail ? smoothClosed(a.thumbNail) : Skia.Path.Make(),
    thumbNailRim: a.thumbNailRim ? smoothOpen(a.thumbNailRim) : Skia.Path.Make(),
    thumbNailFold: a.thumbNailFold ? smoothOpen(a.thumbNailFold) : Skia.Path.Make(),
    thumbNailTip: a.thumbNailTip ? smoothOpen(a.thumbNailTip) : Skia.Path.Make(),
    thumbCreaseA: a.thumbCrease[0],
    thumbCreaseB: a.thumbCrease[a.thumbCrease.length - 1],
    moundEdge: smoothOpen(a.moundEdge),
    moundA: a.moundEdge[0],
    moundB: a.moundEdge[a.moundEdge.length - 1],
    creases: many(a.creases.map(smoothOpen)),
    cuffRim: smoothOpen(a.sleeve.slice(0, 17)),
    cuffSeam: smoothOpen(a.cuffSeam),
    lights: many(relit(a.lights, L, 1).map(ellipsePath)),
    darks: many(relit(a.darks, L, -1).map(ellipsePath)),
    contact: many(a.contact.map(ellipsePath)),
    tendons: many(a.tendons.map(ellipsePath)),
    fingerLights: many(relit(a.fingerLights, L, 1).map(ellipsePath)),
    fingerDarks: many(relit(a.fingerDarks, L, -1).map(ellipsePath)),
    thumbLights: many(relit(a.thumbLights, L, 1).map(ellipsePath)),
    thumbDarks: many(relit(a.thumbDarks, L, -1).map(ellipsePath)),
    baseLight: many(relit(a.baseLight, L, 1).map(ellipsePath)),
    thumbShadow: many(a.thumbShadow.map((e) => ({ ...e, c: P(e.c.u - (L.u - LIGHT.u) * 1.4, e.c.v - (L.v - LIGHT.v) * 1.4) })).map(ellipsePath)),
    // thin soft contact shadows on the shaft: just under the thumb's pad, just over the index's bend
    contactShaft: many([{ c: on(4.6, 2.3), rx: 8, ry: 1.1, rot: -T }, { c: on(2.6, -2.9), rx: 3.6, ry: 0.9, rot: -T }].map(ellipsePath)),
    // the mound's soft shadow on the shaft's butt just before it tucks under
    moundShade: ellipsePath({ c: on(-41, 0), rx: 3.6, ry: 7, rot: -T }),
    r,
  };
}
type Built = ReturnType<typeof build>;

/** The hand's one skin light (one fixed span, every piece shares it — no seam). */
function HandFill({ path, L }: { path: SkPath; L: Pt }) {
  const { HAND } = useLook();
  const c = { u: 36, v: 14 };
  const n = Math.hypot(L.u, L.v) || 1;
  const R = 78;
  return (
    <Path path={path}>
      <LinearGradient start={vec(c.u + (L.u / n) * R, c.v + (L.v / n) * R)} end={vec(c.u - (L.u / n) * R, c.v - (L.v / n) * R)} colors={HAND} positions={[0, 0.35, 0.75, 1]} />
    </Path>
  );
}

function Paint({ B }: { B: Built }) {
  const { MAT, NAIL } = useLook();
  const SKIN = MAT.skin;
  const shirt = MAT.shirt;
  const L = B.L;
  // (the shaft lit on its side toward the light: its top in the neutral drawing)
  const litTop = -S * L.u - C * L.v > 0;
  const sA = litTop ? B.shaftA : B.shaftB;
  const sB = litTop ? B.shaftB : B.shaftA;
  const litTopArm = L.v <= 0;
  const sh = P(-L.u * 1.3, -L.v * 1.3);
  return (
    <Group>
      {/* 1. THE HAND: palm, heel, wrist (behind the shaft) */}
      <HandFill path={B.body} L={L} />
      <Group clip={B.body}>
        <Path path={B.tendons} color={SKIN.rim} opacity={0.08}>
          <Blur mm={1.4} />
        </Path>
        <Path path={B.lights} color={SKIN.rim} opacity={0.24}>
          <Blur mm={3} />
        </Path>
        <Path path={B.baseLight} color={SKIN.rim} opacity={0.3}>
          <Blur mm={2} />
        </Path>
        <Path path={B.darks} color={SKIN.deep} opacity={0.28}>
          <Blur mm={3} />
        </Path>
        <Path path={B.creases} style="stroke" strokeWidth={1.6} strokeCap="round" color={SKIN.deep} opacity={0.2}>
          <Blur mm={0.9} />
        </Path>
        {/* the mound's soft crease, clear at the web, fading toward the wrist */}
        <Path path={B.moundEdge} style="stroke" strokeWidth={0.9} strokeCap="round">
          <LinearGradient start={vec(B.moundA.u, B.moundA.v)} end={vec(B.moundB.u, B.moundB.v)} colors={[`${SKIN.edge}a0`, `${SKIN.edge}50`, `${SKIN.edge}00`]} positions={[0, 0.45, 1]} />
          <Blur mm={0.4} />
        </Path>
        {/* the fingertips' soft shadows on the palm; the shaft's on the palm under it */}
        <Path path={B.contact} color={SKIN.deep} opacity={0.42}>
          <Blur mm={1.8} />
        </Path>
        <Group transform={[{ translateX: sh.u }, { translateY: sh.v }]}>
          <Path path={B.shaft} color="#1a0f08" opacity={0.3}>
            <Blur mm={1.4} />
          </Path>
        </Group>
        <Path path={B.rim} color={SKIN.rim} opacity={0.26}>
          <Blur mm={1} />
        </Path>
      </Group>

      {/* 2. THE SHAFT (lying in the palm, in front of it; its last mm under the thumb mound), the felt head */}
      <Path path={B.shaft}>
        {B.wood ? (
          <LinearGradient start={vec(B.woodA.u, B.woodA.v)} end={vec(B.woodB.u, B.woodB.v)} colors={[...B.wood.colors]} positions={B.wood.positions ? [...B.wood.positions] : undefined} />
        ) : (
          <LinearGradient start={vec(sA.u, sA.v)} end={vec(sB.u, sB.v)} colors={SHAFT_STOPS} positions={SHAFT_POS} />
        )}
      </Path>
      <Group clip={B.shaftEdgeClip}>
        <Path path={B.shaftEdge} style="stroke" strokeWidth={0.7} color="#2a1a0c" opacity={0.55} />
      </Group>
      {B.paintShaft && B.headR > 0 ? (
        <Group>
          <Path path={B.head}>
            <RadialGradient c={vec(B.headC.u + L.u * B.headR * 0.45, B.headC.v + L.v * B.headR * 0.45)} r={B.headR * 1.5} colors={FELT} positions={[0, 0.4, 0.78, 1]} />
          </Path>
          <Path path={B.head} style="stroke" strokeWidth={0.8} color="#5d5446" opacity={0.45} />
        </Group>
      ) : null}
      {/* the fingers', the thumb's and the mound's soft shadows on the shaft */}
      <Group clip={B.shaft}>
        <Group transform={[{ translateX: sh.u }, { translateY: sh.v }]}>
          <Path path={B.group} color="#1a0f08" opacity={0.34}>
            <Blur mm={1.2} />
          </Path>
          <Path path={B.thumb} color="#1a0f08" opacity={0.3}>
            <Blur mm={1.2} />
          </Path>
        </Group>
        <Path path={B.contactShaft} color="#1a0f08" opacity={0.34}>
          <Blur mm={0.7} />
        </Path>
        <Path path={B.moundShade} color="#1a0f08" opacity={0.5}>
          <Blur mm={1.6} />
        </Path>
      </Group>

      {/* 3. THE FINGERS (in front of the shaft): little, ring, middle, index */}
      {B.fingers.map((f, i) => {
        const [up, dn] = B.across[i];
        const dx = dn.u - up.u;
        const dy = dn.v - up.v;
        // (lit on the side toward the light)
        const upLit = -(dx * L.u + dy * L.v) >= 0;
        return (
          <Group key={`f${i}`}>
            <HandFill path={f} L={L} />
            <Path path={f}>
              <LinearGradient start={vec((upLit ? up : dn).u, (upLit ? up : dn).v)} end={vec((upLit ? dn : up).u, (upLit ? dn : up).v)} colors={['rgba(255,238,226,0.16)', 'rgba(255,238,226,0.03)', 'rgba(52,26,16,0.1)', 'rgba(52,26,16,0.3)']} positions={[0, 0.3, 0.72, 1]} />
            </Path>
          </Group>
        );
      })}
      <Group clip={B.group}>
        <Path path={B.fingerLights} color={SKIN.rim} opacity={0.3}>
          <Blur mm={1.3} />
        </Path>
        <Path path={B.fingerDarks} color={SKIN.deep} opacity={0.26}>
          <Blur mm={1.3} />
        </Path>
        <Path path={B.groupRim} color={SKIN.rim} opacity={0.3}>
          <Blur mm={0.8} />
        </Path>
        <Path path={B.wedges} color={SKIN.deep} opacity={0.6}>
          <Blur mm={0.5} />
        </Path>
        <Path path={B.warm} color={WARM} opacity={0.2}>
          <Blur mm={2} />
        </Path>
        {B.nails.map((n, i) => (
          <Group key={`n${i}`}>
            <Path path={n} color={NAIL.fill} opacity={0.38}>
              <Blur mm={0.4} />
            </Path>
            <Path path={n} style="stroke" strokeWidth={0.45} color={SKIN.edge} opacity={0.26}>
              <Blur mm={0.25} />
            </Path>
          </Group>
        ))}
      </Group>
      {/* each seam: the upper finger's underside, clear at the tip, softer toward the bend */}
      {B.unders.map((c, i) => (
        <Path key={`u${i}`} path={c.path} style="stroke" strokeWidth={0.7} strokeCap="round">
          <LinearGradient start={vec(c.a.u, c.a.v)} end={vec(c.b.u, c.b.v)} colors={[`${SKIN.edge}c0`, `${SKIN.edge}60`, `${SKIN.edge}90`]} positions={[0, 0.55, 1]} />
          <Blur mm={0.3} />
        </Path>
      ))}
      {/* the fingers' own contour over the palm (never over the thumb), soft */}
      <Group clip={B.thumb} invertClip>
        <Path path={B.group} style="stroke" strokeWidth={0.8} strokeJoin="round" color={SKIN.edge} opacity={0.32}>
          <Blur mm={0.25} />
        </Path>
      </Group>

      {/* 4. THE THUMB (nearest at the top): its soft shadow on the index, then the thumb */}
      <Group clip={B.group}>
        <Path path={B.thumbShadow} color={SKIN.deep} opacity={0.4}>
          <Blur mm={1.6} />
        </Path>
      </Group>
      <HandFill path={B.thumb} L={L} />
      <Group clip={B.thumb}>
        <Path path={B.lights} color={SKIN.rim} opacity={0.24}>
          <Blur mm={3} />
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
        <Path path={B.rim} color={SKIN.rim} opacity={0.26}>
          <Blur mm={1} />
        </Path>
        <Path path={B.thumbCrease} style="stroke" strokeWidth={0.6} strokeCap="round">
          <LinearGradient start={vec(B.thumbCreaseA.u, B.thumbCreaseA.v)} end={vec(B.thumbCreaseB.u, B.thumbCreaseB.v)} colors={[`${SKIN.edge}70`, `${SKIN.edge}00`]} positions={[0, 1]} />
          <Blur mm={0.3} />
        </Path>
        {/* the thumbnail (facing up, nearly edge-on): the skin just under its side fold turning away (it sets the
            plate off), the plate in the nail tone, its soft edge, a lighter upper rim, the side fold, the free edge */}
        <Group transform={[{ translateX: S * 1.1 }, { translateY: C * 1.1 }]}>
          <Path path={B.thumbNailFold} style="stroke" strokeWidth={1.6} strokeCap="round" color={SKIN.deep} opacity={0.3}>
            <Blur mm={0.6} />
          </Path>
        </Group>
        <Path path={B.thumbNail} color={NAIL.fill} opacity={0.95}>
          <Blur mm={0.2} />
        </Path>
        <Path path={B.thumbNail} style="stroke" strokeWidth={0.5} color={NAIL.edge} opacity={0.55}>
          <Blur mm={0.2} />
        </Path>
        <Path path={B.thumbNailRim} style="stroke" strokeWidth={0.9} strokeCap="round" color="#fff6ee" opacity={0.5}>
          <Blur mm={0.3} />
        </Path>
        <Path path={B.thumbNailFold} style="stroke" strokeWidth={0.6} strokeCap="round" color={SKIN.edge} opacity={0.7}>
          <Blur mm={0.15} />
        </Path>
        <Path path={B.thumbNailTip} style="stroke" strokeWidth={0.7} strokeCap="round" color="#fff8f2" opacity={0.6}>
          <Blur mm={0.2} />
        </Path>
      </Group>
      <Path path={B.thumbUnder} style="stroke" strokeWidth={0.85} strokeCap="round">
        <LinearGradient start={vec(B.thumbUnderA.u, B.thumbUnderA.v)} end={vec(B.thumbUnderB.u, B.thumbUnderB.v)} colors={[SKIN.edge, `${SKIN.edge}b0`, `${SKIN.edge}00`]} positions={[0, 0.75, 1]} />
      </Path>
      {/* the thin soft outline round the whole silhouette */}
      <Path path={B.body} style="stroke" strokeWidth={0.9} strokeJoin="round" color={SKIN.edge} opacity={0.5} />

      {/* the cuff over the wrist */}
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

/** (option, 2026-11-24) A lesson's own shaft wood: its colours across the shaft as the lesson's Mallet paints them
 *  (first colour on the frame's −y side, grip → head), so the short piece of shaft that shows inside the palm (painted
 *  even with paintShaft false) is the lesson's mallet, not this drawing's default wood. */
export type ShaftWood = { colors: readonly string[]; positions?: readonly number[] };
/** The same options as MalletHandBack (rot, mirror, shaft, head, sleeve, ownScale, shaftR, paintShaft), and `wood`. */
export type MalletHandPalmProps = MalletHandBackProps & { wood?: ShaftWood };

/** Where the art's own cuff rim is (local mm): a figure's sleeve mouth goes here. */
export const MALLET_HAND_PALM_CUFF = CUFF_C;

/** The art's frame on the page: local (mm) → page. */
export function malletHandPalmToPage({ x, y, s, rot = 0, mirror = false }: Pick<MalletHandPalmProps, 'x' | 'y' | 's' | 'rot' | 'mirror'>) {
  const m = mirror ? -1 : 1;
  const co = Math.cos(rot);
  const si = Math.sin(rot);
  return (q: Pt): Pt => {
    const u = q.u * s * m;
    const v = q.v * s;
    return P(x + u * co - v * si, y + u * si + v * co);
  };
}
/** The rotation that lays the hand along a page shaft running at `angle` (radians: the page direction from the
 *  fulcrum toward the head). Neutral, the head lies down to the LEFT (π − tilt); mirrored, down to the right (tilt) —
 *  the mirrored palm hand then sits exactly where malletHandBack would with the same x, y, s and rot. */
export function malletHandPalmRotFor(angle: number, mirror = false): number {
  return mirror ? angle - MALLET_SHAFT_TILT : angle - (Math.PI - MALLET_SHAFT_TILT);
}

/**
 * The right hand on its mallet seen from the palm side, for one cast member: the fulcrum drawn at (x, y) pt, `s` pt
 * per mm, turned `rot` radians from the neutral drawing (forearm level from the right, shaft 15° down to the left).
 * With `mirror`, the left hand (forearm from the left, shaft down to the right), re-lit.
 */
export function MalletHandPalm({ who, x, y, s, rot = 0, mirror = false, shaft = 200, head = 'timpani', sleeve = true, ownScale = true, shaftR = MALLET_SHAFT_R, paintShaft = true, wood }: MalletHandPalmProps) {
  const B = useMemo(() => {
    const M = lightMap(rot, mirror);
    return build(MALLET_HAND_PALM, shaft, head, mv(M, LIGHT.u, LIGHT.v), sleeve, shaftR, paintShaft, wood ?? null, mirror);
  }, [rot, mirror, shaft, head, sleeve, shaftR, paintShaft, wood]);
  const paint = <Paint B={B} />;
  const art = who ? <FigureLook look={who.look}>{paint}</FigureLook> : paint;
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { rotate: rot }, { scale: s }, ...(mirror ? [{ scaleX: -1 }] : [])]}>
      {ownScale ? <FigureScale ptPerMm={s}>{art}</FigureScale> : art}
    </Group>
  );
}
