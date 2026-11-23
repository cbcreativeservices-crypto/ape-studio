/**
 * FIGURE V2 — AUTHORED HANDS (the owner on the example drummer, 2026-11-23:
 * "Fix the hands"). Pure: no React, no Skia; the tests read these points.
 *
 * A hand seen close in a known view is DRAWN, the way an illustrator or a 2-D
 * animation rig draws it: an outline and its interior forms authored in the
 * hand's own frame — origin at the wrist crease, x toward the knuckles, y
 * toward the palm side (down in the drawing), real millimetres — through
 * hand-placed points, as the head's profile is. The shared hand skeleton and
 * grip.ts still decide WHERE the hand is (the wrist, the fulcrum, the stick
 * and which view the camera has of it) and the depth order; the authored
 * drawing decides how it LOOKS. Two views, reusable by any hand gripping a
 * stick, a mallet or a beater in them:
 *
 *   'fistEdge'   the stick grip seen from the LITTLE-FINGER side (the camera
 *                looks almost along the stick: the right hand crossing to the
 *                hi-hat seen from the player's right). A compact, chunky block:
 *                the wrist leaving the cuff with the ulnar styloid's bump on
 *                top and the pisiform's low bump under the palm; the
 *                HYPOTHENAR mass — the thick fleshy edge of the palm, the
 *                largest shape — bulging down from the wrist to the little
 *                finger; the back of the hand rising to the little finger's
 *                knuckle at the top front corner, the ring knuckle just
 *                beyond it; the little finger in full profile, nearest — its
 *                first bone dropping from the knuckle, its middle bone turning
 *                back, its tip tucked against the palm — the ring finger a
 *                sliver beyond it; the stick's butt coming toward the viewer
 *                out of the fist's opening. ≈ 100 mm wrist to knuckle,
 *                ≈ 70 mm tall at the knuckles.
 *
 *   'palmThumb'  the stick grip seen from the PALM side, the thumb on top (the
 *                left hand on the snare stick seen from the player's right).
 *                The palm with its thenar pad and hypothenar edge; the stick
 *                across it from the heel to the pinch; the thumb growing out
 *                of the thenar pad (webbing toward the index), bending at its
 *                one middle joint, tapering, its pad flattened on the stick's
 *                upper side, a sliver of nail along its back; the index finger
 *                hooked over the stick at the fulcrum ahead of the thumb's tip;
 *                the other three fingers a fanned, tapering group wrapping
 *                under the stick, their tips returning toward the palm.
 */
import { add, limbOutline, mul, P, perp, sub, unit, type Poly, type Pt } from './geom.ts';
import type { Ellipse } from './sidePlan.ts';

export type HandArtView = 'fistEdge' | 'palmThumb';

/** A digit as joints (base → tip) and radii: drawn as one tapered form. */
type Chain = { pts: readonly (readonly [number, number])[]; r: readonly number[] };

export type HandArtPart = {
  name: string;
  /** Painted before the stick (behind it) or after (in front). */
  layer: 'back' | 'front';
  outline: Poly;
  /** The form's axis (for its cylinder light), local. */
  axis: [Pt, Pt];
  kind: 'palm' | 'digit' | 'web';
};

export type HandArt = {
  view: HandArtView;
  /** Where the stick's fulcrum sits in the drawing (local mm). */
  F: Pt;
  parts: HandArtPart[];
  /** Soft creases (open curves): joints, where a finger lies over the palm. */
  creases: Poly[];
  /** Nail slivers (closed), where a nail truly faces the viewer. */
  nails: Poly[];
  /** Warmer, redder skin: knuckles and fingertips. */
  warm: { c: Pt; r: number }[];
  lights: Ellipse[];
  darks: Ellipse[];
  /** Points the tests read (local). */
  knuckle: Pt;
  wristTop: Pt;
  wristBottom: Pt;
  thumbTip: Pt | null;
};

const pts = (xs: readonly (readonly [number, number])[]): Poly => xs.map(([x, y]) => P(x, y));
const chain = (c: Chain): Poly => limbOutline(pts(c.pts), c.r);
const axisOf = (c: Chain): [Pt, Pt] => [P(c.pts[0][0], c.pts[0][1]), P(c.pts[c.pts.length - 1][0], c.pts[c.pts.length - 1][1])];
const E = (x: number, y: number, rx: number, ry: number, rot = 0): Ellipse => ({ c: P(x, y), rx, ry, rot });

/* ── the fist from its little-finger side ── */

const FIST_BODY: readonly (readonly [number, number])[] = [
  [-6, -17], [3, -20], [8, -23.5], [13, -22.5], [20, -20.5], // the wrist out of the cuff, the ulnar styloid's bump
  [36, -21], [54, -23], [70, -25.5], [82, -28], // the back of the hand rising a little
  [90, -30.5], [97, -28], [101.5, -21], [102, -12], // the little finger's knuckle, the top front corner
  [97, 2], [90, 16], [80, 30], // (under the little finger)
  [66, 42], [52, 47], [38, 47], [26, 42], // the hypothenar mass bulging down
  [18, 37], [12, 37.5], [6, 32], [-1, 24], [-6, 20], // the pisiform's low bump, the wrist's underside
];
const LITTLE: Chain = { pts: [[90, -16], [99, 21], [82, 32], [66, 26]], r: [10.6, 9.8, 8.8, 7.4] };
const RING: Chain = { pts: [[94, -21], [104, 17], [89, 29], [73, 25]], r: [10.4, 9.7, 8.8, 7.6] };
const RING_KNUCKLE: Chain = { pts: [[86, -27], [96, -30]], r: [6.5, 6.4] };

function fistEdge(): HandArt {
  return {
    view: 'fistEdge',
    F: P(92, 34),
    parts: [
      { name: 'ring knuckle', layer: 'front', outline: chain(RING_KNUCKLE), axis: axisOf(RING_KNUCKLE), kind: 'digit' },
      { name: 'ring', layer: 'front', outline: chain(RING), axis: axisOf(RING), kind: 'digit' },
      { name: 'hand', layer: 'front', outline: pts(FIST_BODY), axis: [P(0, 10), P(100, 10)], kind: 'palm' },
      { name: 'little', layer: 'front', outline: chain(LITTLE), axis: axisOf(LITTLE), kind: 'digit' },
    ],
    creases: [
      // the little finger where it lies over the palm's edge, its root at the knuckle
      pts([[81, -14], [80, 0], [82, 14], [86, 22]]),
      // the middle joint's folds on its outer corner
      pts([[103, 21], [100, 27], [96, 31]]),
      pts([[100, 16], [104, 19]]),
      // the end joint
      pts([[77, 27], [79, 33], [77, 37]]),
      // the tip tucked against the palm
      pts([[60, 21], [64, 18], [70, 20]]),
      // a soft fold at the base of the hypothenar, over the pisiform
      pts([[18, 32], [28, 36], [38, 37]]),
    ],
    nails: [],
    warm: [
      { c: P(93, -25), r: 7 },
      { c: P(101, 21), r: 7 },
      { c: P(68, 27), r: 6 },
      { c: P(97, -32), r: 5 },
    ],
    lights: [
      E(9, -21, 4, 2.6), // the ulnar styloid
      E(50, -19, 30, 4.5, -0.04), // the back of the hand's top plane
      E(91, -25, 6, 4), // the little knuckle
      E(42, 22, 22, 10, 0.12), // the hypothenar's lit upper slope
      E(94, -8, 4.5, 14, 0.12), // the little finger's first bone
      E(90, 29, 9, 3.5, -0.4), // the little finger's middle bone, turning back
    ],
    darks: [
      E(48, 37, 26, 6, 0.05), // the hypothenar turning under
      E(84, 2, 6, 14, -0.1), // the shadow behind the little finger
      E(70, 32, 9, 5), // the fist's opening
    ],
    knuckle: P(97, -30),
    wristTop: P(0, -19),
    wristBottom: P(0, 22),
    thumbTip: null,
  };
}

/* ── the grip from its palm side, the thumb on top ── */

const PALM: readonly (readonly [number, number])[] = [
  [-4, -22], [8, -29], [22, -36], [40, -38], [58, -36], [76, -33], [90, -29], [99, -21],
  [102, -6], [100, 10], [96, 24], [86, 34], [66, 40], [44, 41], [24, 38], [8, 32], [-4, 24],
];
const THUMB: Chain = { pts: [[24, -30], [54, -44], [78, -46], [97, -34]], r: [15, 12.2, 10.4, 9] };
const THUMB_WEB: readonly (readonly [number, number])[] = [[36, -36], [58, -42], [80, -38], [90, -27], [70, -29]];
const INDEX: Chain = { pts: [[93, -23], [110, -44], [124, -33], [118, -20]], r: [10.6, 9.8, 8.8, 7.6] };
const MIDDLE: Chain = { pts: [[99, -7], [121, -12], [106, 4], [89, -1]], r: [11, 10.2, 9.2, 8] };
const RING_P: Chain = { pts: [[98, 9], [118, 8], [102, 20], [86, 14]], r: [10.4, 9.6, 8.7, 7.6] };
const LITTLE_P: Chain = { pts: [[93, 24], [109, 26], [95, 36], [80, 30]], r: [9.2, 8.6, 7.8, 6.8] };

function palmThumb(): HandArt {
  return {
    view: 'palmThumb',
    F: P(104, -28),
    parts: [
      { name: 'palm', layer: 'back', outline: pts(PALM), axis: [P(50, -38), P(50, 40)], kind: 'palm' },
      { name: 'web', layer: 'front', outline: pts(THUMB_WEB), axis: [P(40, -40), P(80, -30)], kind: 'web' },
      { name: 'thumb', layer: 'front', outline: chain(THUMB), axis: axisOf(THUMB), kind: 'digit' },
      { name: 'little', layer: 'front', outline: chain(LITTLE_P), axis: axisOf(LITTLE_P), kind: 'digit' },
      { name: 'ring', layer: 'front', outline: chain(RING_P), axis: axisOf(RING_P), kind: 'digit' },
      { name: 'middle', layer: 'front', outline: chain(MIDDLE), axis: axisOf(MIDDLE), kind: 'digit' },
      { name: 'index', layer: 'front', outline: chain(INDEX), axis: axisOf(INDEX), kind: 'digit' },
    ],
    creases: [
      // the thumb's middle joint, the pad flattened on the stick
      pts([[75, -53], [78, -47], [76, -40]]),
      // the thumb's underside where it lies over the palm
      pts([[42, -31], [60, -35], [78, -36], [90, -29]]),
      pts([[90, -28], [97, -26], [103, -28]]),
      // the index: its two bends round the stick
      pts([[106, -50], [111, -46], [115, -47]]),
      pts([[121, -27], [125, -26]]),
      // the curled fingers' middle joints at the front of the fist, and their end joints
      pts([[122, -5], [127, -10]]),
      pts([[118, 15], [122, 11]]),
      pts([[108, 32], [112, 29]]),
      pts([[99, 6], [101, 0]]),
      pts([[95, 21], [97, 15]]),
      // the palm: the thenar crease round the thumb's base, the crease under the fingers' roots
      pts([[76, -28], [56, -22], [36, -10], [24, 6]]),
      pts([[90, -16], [84, 2], [78, 18], [66, 30]]),
    ],
    nails: [
      // the thumb's nail: a sliver along its back edge
      pts([[86, -50.5], [95, -46], [102, -39], [99, -39], [92, -44.5], [85, -48]]),
      // the curled fingers' nails: slivers on the tips' backs, turned toward the viewer
      pts([[92, -8], [86, -6.5], [84, -4], [88, -5.5]]),
      pts([[89, 8], [83, 9.5], [81, 12], [85, 10.5]]),
      pts([[83, 25], [77, 26.5], [76, 29], [80, 27.5]]),
    ],
    warm: [
      { c: P(97, -34), r: 7 },
      { c: P(110, -44), r: 7 },
      { c: P(121, -12), r: 7 },
      { c: P(118, 8), r: 6.5 },
      { c: P(109, 26), r: 6 },
      { c: P(89, -1), r: 5.5 },
      { c: P(86, 14), r: 5.5 },
    ],
    lights: [
      E(36, -30, 16, 9, -0.35), // the thenar pad
      E(30, 30, 18, 7, 0.1), // the hypothenar edge
      E(66, -46, 16, 4.5, -0.1), // the thumb's back
      E(116, -40, 5, 8, 0.5), // the index's hooked middle bone
    ],
    darks: [
      E(64, 4, 20, 14, 0.2), // the hollow of the palm
      E(104, 14, 8, 20, 0.1), // inside the curl
    ],
    knuckle: P(110, -44),
    wristTop: P(0, -22),
    wristBottom: P(0, 24),
    thumbTip: P(97, -34),
  };
}

const ARTS: Record<HandArtView, HandArt> = { fistEdge: fistEdge(), palmThumb: palmThumb() };
export const handArt = (v: HandArtView): HandArt => ARTS[v];

/* ── placing an authored hand on the pose ── */

export type PlacedHand = {
  art: HandArt;
  /** Local (x, y) → the view. */
  at: (p: Pt) => Pt;
  /** The drawn wrist crease (the forearm ends here). */
  wrist: Pt;
  F: Pt;
  /** The stick's ends in the view (butt, bead) and where it enters the fist from the viewer's side. */
  butt: Pt;
  bead: Pt;
  stubEnd: Pt;
  /** The authored parts, placed. */
  parts: (HandArtPart & { placed: Poly; placedAxis: [Pt, Pt] })[];
  creases: Poly[];
  nails: Poly[];
  warm: { c: Pt; r: number }[];
  lights: Ellipse[];
  darks: Ellipse[];
  thumbTip: Pt | null;
  knuckle: Pt;
};

/**
 * Place an authored hand at 1 : 1: rotated so its own wrist → fulcrum line
 * runs along the pose's projected wrist → fulcrum, translated so its
 * fulcrum lands on the pose's, flipped if its palm side would face up.
 * `butt` / `bead`: the stick's ends as the view sees them.
 */
export function placeHand(view: HandArtView, W: Pt, F: Pt, butt: Pt, bead: Pt): PlacedHand {
  const art = handArt(view);
  const dWF = unit(sub(F, W));
  const aLocal = Math.atan2(art.F.v, art.F.u);
  const aView = Math.atan2(dWF.v, dWF.u);
  const th = aView - aLocal;
  const ex = P(Math.cos(th), Math.sin(th));
  let ey = perp(ex);
  // y (the palm side) points down the picture.
  if (ey.v < 0) ey = mul(ey, -1);
  // A mirrored placement (the palm side had to flip to face down) turns the ellipses the other way.
  const mirrored = ex.u * ey.v - ex.v * ey.u < 0;
  const raw = (p: Pt) => add(mul(ex, p.u), mul(ey, p.v));
  const o = sub(F, raw(art.F));
  const at = (p: Pt) => add(o, raw(p));
  const mapE = (e: Ellipse): Ellipse => ({ c: at(e.c), rx: e.rx, ry: e.ry, rot: mirrored ? th - e.rot : th + e.rot });
  return {
    art,
    at,
    wrist: at(P(0, 0)),
    F,
    butt,
    bead,
    stubEnd: add(butt, mul(sub(F, butt), 0.45)),
    parts: art.parts.map((p) => ({ ...p, placed: p.outline.map(at), placedAxis: [at(p.axis[0]), at(p.axis[1])] as [Pt, Pt] })),
    creases: art.creases.map((c) => c.map(at)),
    nails: art.nails.map((c) => c.map(at)),
    warm: art.warm.map((w) => ({ c: at(w.c), r: w.r })),
    lights: art.lights.map(mapE),
    darks: art.darks.map(mapE),
    thumbTip: art.thumbTip ? at(art.thumbTip) : null,
    knuckle: at(art.knuckle),
  };
}
