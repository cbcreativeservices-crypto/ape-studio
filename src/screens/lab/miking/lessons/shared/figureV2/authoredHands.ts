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
 *                ONE FINGER = ONE SHAPE (owner 2026-11-23: "i see 9 fingers"):
 *                the palm, the stick across it from the heel to the pinch, the
 *                four fingers curled toward the viewer round the stick — their
 *                middle and end segments lying ACROSS THE FRONT of it as four
 *                parallel forms side by side, nearly at right angles to it,
 *                touching, their tips (each with its nail) in a staggered row
 *                on the palm side, their knuckles and first segments hidden —
 *                and the thumb along the stick on the side toward its tip,
 *                beside the index, its pad on the stick, whole.
 */
import { add, limbOutline, mul, P, perp, sub, unit, type Poly, type Pt } from './geom.ts';
import type { Ellipse } from './sidePlan.ts';

export type HandArtView = 'fistEdge' | 'palmThumb' | 'backTop' | 'restSide' | 'restFlat' | 'restFlatThumb' | 'restTop' | 'holdSide';

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
  /** Which digit this part belongs to (a hand shows at most one thumb and four fingers). */
  digit?: 'thumb' | 'index' | 'middle' | 'ring' | 'little';
  /** A digit's joints and radii (base → tip): painted as the union of its
   *  bones, so a finger curled back on itself stays solid (an outline traced
   *  round a tight curl crosses itself and would leave a hole). */
  chain?: { pts: Pt[]; r: number[] };
  /** The only line drawn for this part (open): a thumb that grows out of the
   *  hand draws its outer edge and its gap line to the index — never an
   *  outline where it joins the hand. */
  edge?: Poly;
  /** A part in the hand's soft shade (a thumb under the hand): darker at the
   *  first point, fading to the skin's own tone at the second — no cylinder
   *  of its own, no flat dark fill. */
  shade?: [Pt, Pt];
};

export type HandArt = {
  view: HandArtView;
  /** Where the stick's fulcrum sits in the drawing (local mm). */
  F: Pt;
  /** The stick's direction in the drawing (radians, local; toward its tip),
   *  when the drawing is placed by its stick (the palm side: the fingers are
   *  drawn across the stick, so the stick's angle in the hand is the drawing's). */
  stickLocal?: number;
  parts: HandArtPart[];
  /** Soft creases (open curves): joints, where a finger lies over the palm. */
  creases: Poly[];
  /** (wave 3) The gaps between fingers in one group (closed, thin wedges): darkest and
   *  widest at the notch between two fingertips, narrowing to nothing toward the knuckles. */
  gaps?: Poly[];
  /** (wave 3) Soft contact shadows on what the hand rests on (painted under the hand, not clipped to it). */
  contact?: Ellipse[];
  /** Nail slivers (closed), where a nail truly faces the viewer. */
  nails: Poly[];
  /** Warmer, redder skin: knuckles and fingertips. */
  warm: { c: Pt; r: number }[];
  lights: Ellipse[];
  darks: Ellipse[];
  /** Points the tests read (local). */
  knuckle: Pt;
  /** A fist from above: the knuckle row's four swells (little → index), each a bump on the one silhouette. */
  knuckles?: Pt[];
  /** From above: where the thumb's web meets the hand (its free length is measured from here). */
  thumbWeb?: Pt;
  wristTop: Pt;
  wristBottom: Pt;
  thumbTip: Pt | null;
};

const pts = (xs: readonly (readonly [number, number])[]): Poly => xs.map(([x, y]) => P(x, y));
const chain = (c: Chain): Poly => limbOutline(pts(c.pts), c.r);
const bones = (c: Chain) => ({ pts: pts(c.pts), r: [...c.r] });
const axisOf = (c: Chain): [Pt, Pt] => [P(c.pts[0][0], c.pts[0][1]), P(c.pts[c.pts.length - 1][0], c.pts[c.pts.length - 1][1])];
const E = (x: number, y: number, rx: number, ry: number, rot = 0): Ellipse => ({ c: P(x, y), rx, ry, rot });

/* ── the fist from its little-finger side ── */

const FIST_BODY: readonly (readonly [number, number])[] = [
  [-14, -12], [-6, -17], [3, -20], [8, -23.5], [13, -22.5], [20, -20.5], // the wrist out of the cuff, the ulnar styloid's bump
  [36, -21], [54, -23], [70, -25.5], [82, -28], // the back of the hand rising a little
  [90, -30.5], [97, -28], [101.5, -21], [102, -12], // the little finger's knuckle, the top front corner
  [97, 2], [90, 16], [80, 30], // (under the little finger)
  [66, 42], [52, 47], [38, 47], [26, 42], // the hypothenar mass bulging down
  [18, 37], [12, 37.5], [6, 32], [-1, 24], [-6, 20], [-14, 14], [-18, 1], // the pisiform's low bump, the wrist's underside
  // (the wrist runs on into the sleeve's end, rounded: no cut edge where the cuff covers it)
];
const LITTLE: Chain = { pts: [[90, -16], [99, 21], [82, 32], [66, 26]], r: [10.6, 9.8, 8.8, 7.4] };
const RING: Chain = { pts: [[94, -21], [104, 17], [89, 29], [73, 25]], r: [10.4, 9.7, 8.8, 7.6] };

function fistEdge(): HandArt {
  return {
    view: 'fistEdge',
    F: P(92, 34),
    parts: [
      { name: 'ring', layer: 'front', outline: chain(RING), axis: axisOf(RING), kind: 'digit', chain: bones(RING), digit: 'ring' },
      { name: 'hand', layer: 'front', outline: pts(FIST_BODY), axis: [P(0, 10), P(100, 10)], kind: 'palm' },
      { name: 'little', layer: 'front', outline: chain(LITTLE), axis: axisOf(LITTLE), kind: 'digit', chain: bones(LITTLE), digit: 'little' },
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

/*
 * THE STICK GRIP FROM THE PALM SIDE (owner 2026-11-23, after "it shows 6
 * fingers" and then "i see 9 fingers"). ONE FINGER = ONE SHAPE: each finger a
 * single continuous form (one outline, one core shadow, one lit edge), its
 * joint only a short soft crease and a slight change of direction; nothing
 * else in the hand a small rounded form that could read as a fingertip.
 *
 * Drawn in the STICK's frame (t along the stick toward its tip, from the
 * fulcrum; n across it toward the knuckles), then carried into the hand's own
 * frame: the stick crosses the palm from the heel to the pinch at 38° to the
 * hand's length.
 *   • the four fingers come from their hidden knuckles (n > 0), curl toward
 *     the viewer round the stick and lie ACROSS ITS FRONT — four parallel
 *     forms side by side, ≈ 10° off a right angle to it, touching, covering
 *     ≈ 68 mm of it: the index foremost (nearest the stick's tip), the middle
 *     longest, the ring, the little finger shortest (nearest the butt) — their
 *     tips in a staggered row on the palm side (n < 0), each with its nail;
 *   • the THUMB lies along the stick on the side toward its tip, beside the
 *     index, its pad on the stick — whole, painted last.
 */
const STICK_LOCAL = (-38 * Math.PI) / 180;
const F_PALM = P(98, -26);
const S_DIR = P(Math.cos(STICK_LOCAL), Math.sin(STICK_LOCAL));
const N_DIR = P(-S_DIR.v, S_DIR.u);
/** (t along the stick, n across it) → the hand's frame. */
const TN = (t: number, n: number): [number, number] => [F_PALM.u + S_DIR.u * t + N_DIR.u * n, F_PALM.v + S_DIR.v * t + N_DIR.v * n];
const tnChain = (xs: readonly (readonly [number, number])[], r: readonly number[]): Chain => ({ pts: xs.map(([t, n]) => TN(t, n)), r });

// (each finger: the bend at its middle joint — the knuckle hidden behind it — then its end joint, then its tip)
const INDEX: Chain = tnChain([[-4, 26], [-7, 7], [-10, -7]], [10, 9.6, 8]);
const MIDDLE: Chain = tnChain([[-21.5, 30], [-24.5, 6], [-28.5, -16]], [10.4, 10, 8.4]);
const RING_P: Chain = tnChain([[-38.8, 28], [-41.8, 6], [-45.8, -13]], [10, 9.6, 8]);
const LITTLE_P: Chain = tnChain([[-54.6, 24], [-57.6, 6], [-61.1, -6]], [9.2, 8.8, 7.4]);
const THUMB: Chain = tnChain([[-58, -50], [-30, -36], [-4, -22], [16, -12]], [11.8, 11, 10, 8.8]);

// (its lower edge, past the little finger, runs just under the stick to the heel: no
// separate lump of palm between the little finger and the butt)
const PALM: readonly (readonly [number, number])[] = [
  [-4, -22], [8, -29], [22, -35], [40, -37], [60, -36], [80, -33], [94, -29], [102, -22],
  [106, -12], [102, 2], [92, 13], [80, 22], TN(-62, 10), TN(-76, 6), TN(-90, 6), TN(-100, 6), [12, 40], [2, 30], [-4, 24],
];

/** A soft crease across a digit at joint `i` (a short open curve, ≈ ⅗ of its width). */
function jointCrease(c: Chain, i: number): Poly {
  const q = P(c.pts[i][0], c.pts[i][1]);
  const d = unit(sub(P(c.pts[i + 1][0], c.pts[i + 1][1]), P(c.pts[i - 1][0], c.pts[i - 1][1])));
  const n = perp(d);
  const w = c.r[i] * 0.6;
  return [add(q, mul(n, -w)), add(q, mul(d, 0.8)), add(q, mul(n, w))];
}

/** A finger's nail, facing the viewer near its end (closed, inside the finger). */
function nailOf(c: Chain): Poly {
  const k = c.pts.length - 1;
  const tip = P(c.pts[k][0], c.pts[k][1]);
  const u = unit(sub(tip, P(c.pts[k - 1][0], c.pts[k - 1][1])));
  const n = perp(u);
  const r = c.r[k];
  // (at the very end of the finger: its free edge at the tip's rim)
  const mid = add(tip, mul(u, r * 0.05));
  const out: Poly = [];
  for (let j = 0; j < 12; j++) {
    const a = (Math.PI * 2 * j) / 12;
    const x = Math.cos(a);
    const y = Math.sin(a);
    // a rounded oblong, a little flatter toward the root
    out.push(add(mid, add(mul(u, r * 0.66 * (x > 0 ? x : x * 0.9)), mul(n, r * 0.56 * Math.sign(y) * Math.pow(Math.abs(y), 0.7)))));
  }
  return out;
}

/** The thumb's nail: a sliver along its back (the side away from the stick), toward the tip. */
function thumbNail(c: Chain): Poly {
  const k = c.pts.length - 1;
  const a = P(c.pts[k - 1][0], c.pts[k - 1][1]);
  const b = P(c.pts[k][0], c.pts[k][1]);
  const u = unit(sub(b, a));
  let n = perp(u);
  if (n.v > 0) n = mul(n, -1); // the back: up, away from the stick
  const r = c.r[k];
  const at = (f: number, o: number) => add(add(a, mul(sub(b, a), f)), mul(n, r * o));
  return [at(0.45, 0.62), at(0.7, 0.84), at(0.95, 0.66), at(0.97, 0.4), at(0.7, 0.5), at(0.47, 0.42)];
}

function palmThumb(): HandArt {
  const digit = (name: string, c: Chain, d: HandArtPart['digit']): HandArtPart => ({ name, layer: 'front', outline: chain(c), axis: axisOf(c), kind: 'digit', chain: bones(c), digit: d });
  return {
    view: 'palmThumb',
    F: F_PALM,
    stickLocal: STICK_LOCAL,
    parts: [
      { name: 'palm', layer: 'back', outline: pts(PALM), axis: [P(50, -38), P(50, 40)], kind: 'palm' },
      // the four fingers from the butt's end to the tip's (the index last, foremost), then the thumb over all
      digit('little', LITTLE_P, 'little'),
      digit('ring', RING_P, 'ring'),
      digit('middle', MIDDLE, 'middle'),
      digit('index', INDEX, 'index'),
      digit('thumb', THUMB, 'thumb'),
    ],
    creases: [jointCrease(LITTLE_P, 1), jointCrease(RING_P, 1), jointCrease(MIDDLE, 1), jointCrease(INDEX, 1), jointCrease(THUMB, 2)],
    nails: [nailOf(LITTLE_P), nailOf(RING_P), nailOf(MIDDLE), nailOf(INDEX), thumbNail(THUMB)],
    warm: [],
    lights: [
      E(28, 33, 15, 5.5, 0.35), // the hypothenar's edge, toward the heel
    ],
    darks: [],
    knuckle: P(INDEX.pts[0][0], INDEX.pts[0][1]),
    wristTop: P(0, -22),
    wristBottom: P(0, 24),
    thumbTip: P(THUMB.pts[3][0], THUMB.pts[3][1]),
  };
}

/* ── the grip from ABOVE: the fist on its stick (wave 1 of D78, 2026-11-23) ── */

/*
 * THE FIST ON ITS STICK, SEEN FROM ABOVE (the kit drummer's top view; owner
 * 2026-11-23 on the first try: "knuckles look very odd" — four separate pills
 * in a row read as beads stuck onto the fist). The local frame as the others:
 * origin at the wrist crease, x toward the knuckles, y toward the THUMB's side
 * (placement mirrors it for the other hand).
 *   • ONE SILHOUETTE for the back of the hand and the fingers: the back of the
 *     hand runs without a break into the first finger bones; its front is the
 *     KNUCKLE ROW — four soft rounded swells along one contour, an arc, not a
 *     ruler line (the middle knuckle highest and farthest forward, the little
 *     finger's lowest and set back), each lit on top, a shallow valley between
 *     neighbours; beyond them the fingers turn DOWN round the stick, a short
 *     foreshortened strip darkening over the curve.
 *   • The fingers are told apart by three short creases starting in the
 *     valleys between the knuckles and fading forward — never an outline round
 *     a finger. The fingertips and nails are underneath.
 *   • The thumb lies UNDER the hand, as the fulcrum (owner 2026-11-23: "thumb
 *     is underneath as the fulcrum"; "make sure when viewed from above, the
 *     thumb is correctly placed under the hand"): painted first, in the hand's
 *     soft shade; only the strip beyond the hand's inner edge shows, beside
 *     the stick, its pad against the stick's SIDE at the fulcrum. It leaves
 *     the hand's contour tangentially near the heel ("watch lower thumb
 *     transition around the hand"): wrist, heel, thumb base and thumb one
 *     smooth curve, no notch, no lobe, no line.
 * Both hands of a matched grip are drawn this way from above (the right
 * hand's roll in the pose — thumb side 0.72 up against back 0.66 — does not
 * turn it into a thumb-on-top view).
 * The stick runs under the hand from the heel to the pinch between the thumb
 * and the index.
 */
const TOP_STICK = (21 * Math.PI) / 180;
// (the back of the hand from the wrist, round the knuckle row's swells — little, ring, middle, index — and back along the index side)
const FIST_TOP: readonly (readonly [number, number])[] = [
  [-6, -25], [12, -29], [40, -36], [66, -40], [84, -39], [93, -37],
  [100, -33], [104, -28], [103, -22], [101, -19.5],
  [106, -16], [112, -12], [113.5, -8], [112, -4], [109.5, -2],
  [114, 1], [117.5, 6], [116, 10.5], [110, 13.5],
  [112.5, 17], [113, 22], [110, 27], [102, 31],
  [86, 33], [64, 33], [42, 31], [20, 28], [-6, 24],
];
const FIST_KNUCKLES: readonly (readonly [number, number])[] = [[104, -28], [113.5, -8], [117.5, 6], [113, 22]];
// The thumb from above, under the hand: its root deep under the back of the hand; the visible strip
// leaves the hand's inner contour tangentially near the heel, widest at its knuckle (≈ 20 mm), tapering
// over its end joint to a rounded tip whose pad presses the stick's side at the fulcrum.
const T_THUMB_OUT: readonly (readonly [number, number])[] = [
  [44, 26], [56, 22], [66, 21], [80, 26], [92, 30.5], [100, 33], [106, 37.5], [109.5, 40], [111, 43], [109, 46], [104, 47.5], [96, 47.5], [86, 46.5], [74, 44.5], [62, 41.5], [50, 37.5], [40, 33], [32, 30],
];
const T_THUMB_EDGE: readonly (readonly [number, number])[] = [[44, 35], [50, 37.5], [62, 41.5], [74, 44.5], [86, 46.5], [96, 47.5], [104, 47.5], [109, 46], [111, 43], [109.5, 40], [106, 37.5], [100, 33]];
const T_THUMB: Chain = { pts: [[60, 32], [92, 38], [109, 43]], r: [10, 8, 6] };

function backTop(): HandArt {
  const digit = (name: string, c: Chain, d: HandArtPart['digit']): HandArtPart => ({ name, layer: 'front', outline: chain(c), axis: axisOf(c), kind: 'digit', chain: bones(c), digit: d });
  return {
    view: 'backTop',
    F: P(100, 30),
    stickLocal: TOP_STICK,
    // the thumb FIRST (under the hand), then the one silhouette of the back of the hand and the fingers
    parts: [
      { name: 'thumb', layer: 'front', outline: pts(T_THUMB_OUT), axis: [P(50, 36), P(111, 36)], kind: 'digit', chain: bones(T_THUMB), digit: 'thumb', edge: pts(T_THUMB_EDGE), shade: [P(80, 31), P(80, 47)] },
      { name: 'hand', layer: 'front', outline: pts(FIST_TOP), axis: [P(0, 0), P(116, 0)], kind: 'palm' },
    ],
    // the three valleys' short creases, fading forward over the curl
    creases: [pts([[96, -21], [100, -20.5], [103, -20]]), pts([[103, -3], [106.5, -2.5], [110, -2]]), pts([[104, 13.5], [107, 13.7], [110, 13.8]])],
    // (no nail: from above the thumb under the hand shows its side, the nail faces away)
    nails: [],
    warm: [],
    lights: [
      E(58, -2, 26, 15, 0), // the broad back of the hand, turned to the light
      // a small light on top of each knuckle
      E(98, -27, 5, 4, 0), E(106, -8, 5.5, 4.5, 0), E(109, 6, 6, 4.5, 0), E(105, 21, 5.5, 4.5, 0),
    ],
    darks: [
      E(112, -2, 6, 30, 0.08), // the fingers turning down round the stick, past the knuckles
    ],
    knuckle: P(FIST_KNUCKLES[2][0], FIST_KNUCKLES[2][1]),
    knuckles: FIST_KNUCKLES.map(([x, y]) => P(x, y)),
    wristTop: P(0, -25),
    wristBottom: P(0, 24),
    thumbTip: P(T_THUMB.pts[2][0], T_THUMB.pts[2][1]),
    thumbWeb: P(50, 37.5),
  };
}

/* ── wave 3 of D78 (2026-11-23): hands at rest, and round a mic's handle ── */

/*
 * A RELAXED HAND HANGING AT THE SIDE (a standing talker's, a singer's), seen
 * with the person in profile (coordinator round 3, 2026-11-23): the palm faces
 * the thigh, so the viewer sees the BACK of the hand, the THUMB on the FRONT
 * edge (the side the person faces), the little finger toward the back. Local
 * frame as the others: x from the wrist crease down toward the fingertips, y
 * toward the THUMB (forward). ONE contour for the whole hand:
 *   • the back of the hand widens from the narrow wrist (≈ 44 mm) to the
 *     knuckle row, which SLOPES — the index knuckle highest and most forward,
 *     the little finger's lowest and farthest back; the knuckles are soft
 *     swells of light only (one sloping band), no circles, no lines;
 *   • the fingers hang from the knuckle row as ONE group, gently curled toward
 *     the thigh, so ≈ 55–65 mm shows below the knuckles; one outline round the
 *     group, four rounded tips with a clear notch between each two (the middle
 *     lowest, the index and ring a little shorter, the little finger
 *     shortest); inside it only the three GAPS between the fingers — each
 *     strongest at its notch, running up toward the knuckles and fading out
 *     about two thirds of the way (round 4); no outline round any finger;
 *   • the THUMB on the front edge: its mound is the hand's front contour from
 *     the wrist down; about half way down the back of the hand it SEPARATES —
 *     a narrow V of background between thumb and index, opening downward, its
 *     point at the web — then hangs down and very slightly forward, two
 *     segments with a small bend, a blunt rounded tip (≈ 20 mm) ending about
 *     level with the index finger's first joint, ≈ 30 mm above the fingertips.
 *     Its only line is its own contour and the V. No mark floats in the hand.
 */
const REST_HAND: readonly (readonly [number, number])[] = [
  // (round 4: the skin runs on up under the cuff — no top edge of its own across the wrist)
  [-26, -21], [0, -22],
  // the back edge (little-finger side), from the wrist down to the little knuckle (the lowest)
  [28, -26.5], [56, -31], [80, -34.5], [96, -36.5],
  // the finger group: the little finger's outer side, then four rounded tips with a clear notch
  // between each two — little, ring, middle, index
  [112, -36.5], [126, -34.5], [134, -31.5], [138, -27], [138.5, -23.5], [136, -21], [132, -20],
  [139, -19.4], [144.5, -16], [147, -10], [146.4, -5.2], [143.5, -3.4], [139.5, -3],
  [147, -1.8], [151.4, 2.4], [152.6, 8], [151.2, 12.6], [147.6, 15], [142.5, 15.6],
  [146, 17.4], [146.6, 21.6], [145, 26], [141.6, 29.2], [136, 31],
  // the index finger's front edge up to the web — the point of the narrow V
  [124, 31.6], [110, 31.6], [96, 31.2], [82, 30.6], [66, 30],
  // the thumb (fuller, ≈ 21 mm near the tip, hanging close along the index): its inner side down from
  // the web, round its blunt tip, its outer side up over the wider mound to the wrist
  [80, 32.6], [94, 34.2], [104, 35], [111, 35.8], [116.8, 38.8], [119.4, 44], [118.6, 50], [114, 54.6], [106, 56.6],
  [96, 56.6], [84, 54.6], [70, 50.6], [54, 44.6], [36, 37], [18, 29.4], [0, 22.5], [-26, 21.5],
];
/** A finger gap: a thin wedge from the notch between two fingertips (widest, darkest) up toward the
 *  knuckles, narrowing to nothing about two thirds of the way. */
const gap = (n: readonly [number, number], len: number, w = 2.8): Poly => [P(n[0] + 1.2, n[1] - w / 2), P(n[0] - len * 0.5, n[1] - w * 0.22), P(n[0] - len, n[1]), P(n[0] - len * 0.5, n[1] + w * 0.22), P(n[0] + 1.2, n[1] + w / 2)];
const REST_NOTCHES = [[132, -20], [139.5, -3], [142.5, 15.6]] as const;

function restSide(): HandArt {
  return {
    view: 'restSide',
    F: P(150, 0),
    parts: [{ name: 'hand', layer: 'front', outline: pts(REST_HAND), axis: [P(0, 0), P(150, 0)], kind: 'palm' }],
    // (no creases: the fingers are told apart by the three gaps, strongest at the tips)
    creases: [],
    gaps: REST_NOTCHES.map((n) => gap(n, (n[0] - 92) * 0.68)),
    nails: [],
    warm: [],
    lights: [
      E(62, 2, 44, 17, 0), // the broad back of the hand, fading out into the fingers (no edge at the knuckles)
      // the knuckles: four soft separate swells along the sloping row (little → index)
      E(97, -27.5, 5.2, 4, 0), E(94, -11.2, 5.6, 4.3, 0), E(91, 5.2, 5.6, 4.3, 0), E(88, 21.2, 5.2, 4, 0),
      E(86, 49, 22, 5.5, 0.26), // the thumb's outer face
    ],
    darks: [
      E(148, -2, 6, 30, 0), // the fingertips curling toward the thigh
    ],
    knuckle: P(88, 30),
    knuckles: [P(97, -28), P(94, -11), P(91, 5.5), P(88, 21)],
    wristTop: P(0, 22.5),
    wristBottom: P(0, -22),
    thumbTip: P(119.4, 44),
    thumbWeb: P(66, 30),
  };
}

/*
 * A RELAXED HAND LYING PALM-DOWN ON A DESK, SEEN FROM THE SIDE (a seated
 * talker's hand; coordinator round, 2026-11-23, after "it reads as a paddle"):
 * x forward along the desk, y DOWN toward it (the desk's top at y ≈ 26, the
 * pose's wrist 26 mm above it). Drawn by the rules of the approved resting hand:
 *   • the forearm comes out of the cuff NARROWING to the wrist, which rests just
 *     above the desk;
 *   • the TOP contour: a dip at the wrist, the back of the hand rising in a low
 *     arch to the KNUCKLE CREST (≈ 35 mm above the desk), then the index finger
 *     sloping DOWN, gently bent at its two joints, to a fingertip on the desk;
 *     ≈ 85 mm knuckle to tip;
 *   • the other fingers lie behind the index: the middle fingertip shows as a
 *     sliver stepping just beyond it, the gap between them starting at the tips
 *     and fading back toward the knuckles;
 *   • the THUMB on the near side lies on the desk beside the index, coming out
 *     of the hand's lower near edge below the index knuckle — part of the one
 *     outline, a blunt tip at about the index's middle joint; no line along it,
 *     only a soft shade where it lies against the index;
 *   • daylight under the arch of the fingers between the thumb's tip and the
 *     fingertips; a soft contact shadow under the heel, the thumb and the tips;
 *   • the skin runs on up under the cuff.
 */
const FLAT_BODY: readonly (readonly [number, number])[] = [
  // the top: out of the cuff, narrowing to the wrist's dip, the back of the hand's arch to the knuckle crest
  [-26, -19], [-18, -17.6], [-10, -16], [-2, -14.4], [6, -12.8], [12, -12], [20, -12], [30, -12.6], [40, -13.2], [50, -13.8], [60, -14.4], [70, -15], [78, -15.4], [86, -15.4],
  // the index finger: nearly level to its middle joint, then bending down to its tip on the desk
  [97, -13.4], [110, -8.6], [124, -2.6], [134, 4], [143, 11], [151, 17.3], [157.5, 21.8], [162, 24], [163.5, 24.4],
  // the notch, then the middle fingertip's sliver stepping just beyond the index (the gap starts here)
  [164.5, 25], [167, 24.2], [170, 25.4], [169.5, 27.4],
  // along the desk under the tips, then daylight under the fingers' arch, back along the index's underside
  [161, 27.8], [153, 25.2], [145, 21.4], [137, 17.6], [130, 15.2], [126.5, 14.6],
  // the thumb's blunt tip on the desk, just under the index's middle joint, its underside along the desk, the heel, the wrist
  [128, 16.4], [129, 19.6], [128.4, 23.4], [125, 26.4], [116, 26.9], [100, 26.6], [80, 26.2], [60, 25.4], [40, 24.6], [24, 24.2], [12, 22.6], [0, 22.8], [-14, 23], [-26, 23.2],
];
/** A gap between two fingers in one group: a thin wedge from the notch `n` (widest, darkest) back along
 *  `toward` (a unit direction), narrowing to nothing at `len`. */
const gapAlong = (n: readonly [number, number], toward: readonly [number, number], len: number, w = 2.6): Poly => {
  const d = P(toward[0], toward[1]);
  const q = P(-d.v, d.u);
  const N = P(n[0], n[1]);
  const at = (t: number, s2: number) => add(N, add(mul(d, t), mul(q, s2)));
  return [at(-1.2, -w / 2), at(len * 0.5, -w * 0.22), at(len, 0), at(len * 0.5, w * 0.22), at(-1.2, w / 2)];
};

/** The FAR hand on the desk (the person's other hand, seen from its THUMB side): the index in
 *  profile, the thumb on the viewer's side under the index's middle joint (round 1's drawing). */
function restFlatThumb(): HandArt {
  return {
    view: 'restFlatThumb',
    F: P(150, 24),
    parts: [{ name: 'hand', layer: 'front', outline: pts(FLAT_BODY), axis: [P(0, -2), P(150, -2)], kind: 'palm' }],
    creases: [
      pts([[124.5, -0.6], [123.5, 4.5], [123, 8]]), // the index's middle joint
    ],
    gaps: [gapAlong([164.5, 25], [-0.72, -0.69], 24)],
    nails: [],
    warm: [{ c: P(85, -7), r: 5 }],
    lights: [
      E(50, -3, 34, 4.2, -0.03), // the back of the hand's top plane
      E(85, -8.5, 6, 3.6), // the index knuckle: a soft swell
      E(72, -6.5, 5, 3.2), // the middle knuckle just behind it
      E(110, 19.5, 18, 3, 0.04), // the thumb's top face, lit
    ],
    darks: [
      E(108, 15, 22, 2.8, 0.06), // the thumb's soft shade where it lies against the index (its top edge)
      E(60, 21, 36, 3.4, 0), // the palm's edge turning under toward the desk
    ],
    // soft contact shadows on the desk: the heel, the thumb, the fingertips
    contact: [E(36, 27.5, 30, 3.5), E(112, 27.6, 18, 3), E(165, 28, 9, 2.5)],
    knuckle: P(86, -11.4),
    wristTop: P(0, -2),
    wristBottom: P(0, 23),
    thumbTip: P(129, 19.6),
    thumbWeb: P(92, 12),
  };
}

/*
 * THE NEAR HAND ON THE DESK, THE TRUE VIEW (coordinator round 2, 2026-11-23: "a right hand lying
 * palm-down, seen from the person's right, shows its LITTLE-FINGER side"): x forward, y down (the desk
 * at y ≈ 26).
 *   • the near contour is the hand's outer edge: from the wrist along the fleshy edge below the little
 *     finger to the little-finger knuckle; the LITTLE finger seen whole in profile, gently bent, its
 *     rounded pad on the desk — the shortest finger (≈ 58 mm knuckle to tip);
 *   • behind it the ring and middle fingers step forward, each a rounded pad on the desk beyond the
 *     one in front (the ring ≈ 12 mm beyond the little finger, the middle ≈ 20 mm); the index lies
 *     farthest, its tip hidden behind the ring's, its knuckle the crest of the arch;
 *   • the gaps start at the tips (where a nearer finger's pad lies over the next) and fade back;
 *   • fingertips are rounded pads ≈ 13 mm deep with a hint of a nail line on top;
 *   • NO thumb: it lies on the far side, hidden;
 *   • the wrist's dip, the low arch to the knuckle crest, the fingers sloping down, daylight under the
 *     little finger's arch, contact shadows under the heel and the tips, the skin on under the cuff.
 */
const FLAT_HAND: readonly (readonly [number, number])[] = [
  // (its front edge lies inside the fingers' roots, under their top line: no step where the fingers begin)
  // (owner 2026-11-23, "the wrist looks odd": out of the cuff the forearm tapers smoothly to the wrist — its
  // narrowest point — then the back of the hand rises a little to the crest; no edge, no step, no block)
  [-26, -19], [-18, -17.6], [-10, -16], [-2, -14.4], [6, -12.8], [12, -12], [20, -12], [30, -12.6], [40, -13.2], [50, -13.8], [60, -14.4], [70, -15], [78, -15.4], [86, -15.4], [91, -14], [93.5, -8.5], [94.5, -1], [93.5, 6], [91.5, 13], [89, 19], [85, 23],
  [78, 25.2], [60, 25.6], [40, 25], [24, 24.2], [12, 22.6], [0, 22.8], [-14, 23], [-26, 23.2],
];
const FLAT_MIDDLE: Chain = { pts: [[88, -5.4], [124, 4], [148, 14.6], [157.5, 19.6]], r: [10, 9, 7.6, 6.8] };
const FLAT_RING: Chain = { pts: [[86, -1], [118, 8], [140, 15.4], [149.5, 19.6]], r: [9.6, 8.6, 7.2, 6.6] };
const FLAT_LITTLE: Chain = { pts: [[82, 4], [104, 10.5], [124, 16.4], [137.5, 19.6]], r: [8.6, 7.8, 6.8, 6.4] };

function restFlat(): HandArt {
  const digit = (name: string, c: Chain, d: HandArtPart['digit']): HandArtPart => ({ name, layer: 'front', outline: chain(c), axis: axisOf(c), kind: 'digit', chain: bones(c), digit: d });
  return {
    view: 'restFlat',
    F: P(150, 24),
    // far to near: the middle, the ring, the little finger, then the hand over their roots (no line where a finger meets it)
    parts: [
      digit('middle', FLAT_MIDDLE, 'middle'),
      digit('ring', FLAT_RING, 'ring'),
      digit('little', FLAT_LITTLE, 'little'),
      { name: 'hand', layer: 'front', outline: pts(FLAT_HAND), axis: [P(0, -2), P(100, -2)], kind: 'palm' },
    ],
    creases: [
      pts([[121, 9.6], [119.5, 13.5], [119, 17]]), // the little finger's middle joint
      pts([[132.5, 13.3], [136.5, 13]]), // a hint of the little finger's nail on top of its pad
      pts([[151.5, 12.9], [155.5, 13]]), // the middle finger's nail, beyond
    ],
    // the gaps: from where each nearer pad lies over the next finger, back along it, fading
    gaps: [gapAlong([143.6, 17.6], [-0.9, -0.42], 22, 2.4), gapAlong([155.8, 17.4], [-0.9, -0.42], 20, 2.2)],
    nails: [],
    warm: [{ c: P(84, -9), r: 5 }],
    lights: [
      E(50, -3, 34, 4.2, -0.03), // the back of the hand's top plane
      E(86, -8.5, 6, 3.6), // the knuckle crest
      E(108, 7, 14, 2.4, 0.2), // the little finger's lit top
    ],
    darks: [E(60, 21, 36, 3.4, 0)],
    contact: [E(38, 27.5, 30, 3.5), E(138, 27.4, 6, 2), E(150, 27.4, 6, 2), E(158, 27.6, 6, 2)],
    knuckle: P(82, 4),
    knuckles: [P(82, 4), P(86, -1), P(88, -5.4)],
    wristTop: P(12, -12),
    wristBottom: P(0, 23),
    thumbTip: null,
  };
}

/*
 * THE SAME HAND FROM ABOVE (the top view of a desk talker): the BACK of a
 * relaxed hand lying palm-down, x forward along the fingers, y toward the THUMB
 * (the body's midline). One outline for hand, fingers and thumb: the wrist out
 * of the cuff widening to the knuckle row; the four fingers forward, side by
 * side, their tips a stepped line (the middle longest, the little shortest), the
 * gaps between them starting at the tips and fading toward the knuckles; the
 * thumb on the midline side, leaving the hand at its mound, separated from the
 * index by a narrow V, a blunt tip; four soft knuckle swells along the row.
 */
const TOP_HAND: readonly (readonly [number, number])[] = [
  [-26, -21], [0, -22], [30, -27], [60, -33], [88, -37], [110, -38.5],
  // the little finger, a little fanned out, its rounded tip; the notch
  [128, -38], [140, -36.6], [148, -34], [152.5, -29.6], [152, -24.6], [148, -21.6], [141, -20.6], [136, -20.5],
  // the ring finger
  [146, -19.5], [158, -18.5], [167, -16], [170.5, -11], [169, -5.6], [164, -3], [157, -2.6], [152, -2.5],
  // the middle finger, the longest
  [162, -1.5], [172, 0.5], [178, 4], [179, 9.5], [175.5, 14], [168, 16], [158, 16.4], [152, 16.5],
  // the index finger, its outer edge back to the web
  [161, 18], [168, 20.5], [170, 25], [167, 29.5], [159, 32], [146, 32.4], [128, 32.6], [110, 32.6], [92, 32.4], [84, 33],
  // the web: a soft U, then the thumb at ≈ 25–30° to the index, its tip about level with the index's first joint
  [78, 34.8], [75, 38], [84, 43], [98, 48.5], [110, 52.5], [118, 54.8], [123, 57.8], [124, 62.2], [121, 66.2], [115, 67.8],
  [104, 66.4], [88, 61.8], [70, 55.5], [52, 47.5], [36, 39.5], [20, 31.5], [0, 23], [-26, 22],
];
const TOP_NOTCHES = [[136, -20.5], [152, -2.5], [152, 16.5]] as const;
/** A faint nail on a fingertip seen from above (a small rounded oblong set back from the tip). */
const nailAt = (x: number, y: number, len = 9, w = 7): Poly => {
  const out: Poly = [];
  for (let j = 0; j < 12; j++) {
    const t = (Math.PI * 2 * j) / 12;
    out.push(P(x + (len / 2) * Math.cos(t), y + (w / 2) * Math.sin(t)));
  }
  return out;
};

function restTop(): HandArt {
  return {
    view: 'restTop',
    F: P(150, 0),
    parts: [{ name: 'hand', layer: 'front', outline: pts(TOP_HAND), axis: [P(0, 0), P(170, 0)], kind: 'palm' }],
    creases: [],
    gaps: TOP_NOTCHES.map((n) => gapAlong(n, [-1, 0], (n[0] - 95) * 0.68, 3.2)),
    nails: [nailAt(144, -29), nailAt(163, -10.5), nailAt(171, 8.5), nailAt(161, 25)],
    warm: [],
    lights: [
      E(58, -1, 34, 18, 0), // the broad back of the hand
      E(97, -30, 5.2, 4), E(98, -12, 5.6, 4.3), E(97, 6, 5.6, 4.3), E(95, 24, 5.2, 4), // the knuckles: four soft swells
      E(90, 55, 18, 5, 0.36), // the thumb's back
    ],
    darks: [E(160, -2, 7, 32, 0)],
    knuckle: P(97, 24),
    knuckles: [P(97, -30), P(98, -12), P(97, 6), P(95, 24)],
    wristTop: P(0, 23),
    wristBottom: P(0, -22),
    thumbTip: P(122, 62),
    thumbWeb: P(78, 35),
  };
}

/*
 * A FIST ROUND A HAND-HELD MIC'S HANDLE, SEEN FROM OUTSIDE (the reporter's
 * hand, seen from the side the arm is on): the back of the fist (the approved
 * fist from above — one silhouette, the knuckle row's swells, three creases),
 * the handle passing through it ACROSS the hand behind the curled fingers, the
 * thumb wrapped over the handle on the side toward the mic's head — its tip
 * peeking beyond the index, ON the handle. Placed by the handle (stickLocal 90°:
 * the handle runs across the hand, toward the thumb's side = toward the head).
 */
function holdSide(): HandArt {
  const t = backTop();
  return { ...t, view: 'holdSide', F: P(104, 0), stickLocal: Math.PI / 2 };
}

const ARTS: Record<HandArtView, HandArt> = { fistEdge: fistEdge(), palmThumb: palmThumb(), backTop: backTop(), restSide: restSide(), restFlat: restFlat(), restFlatThumb: restFlatThumb(), restTop: restTop(), holdSide: holdSide() };
export const handArt = (v: HandArtView): HandArt => ARTS[v];

/**
 * Place a hand that holds nothing (restSide / restFlat) at the pose's wrist,
 * pointing the pose's way: its local +y (the thumb's side for restSide, the
 * palm's for restFlat) turned toward `yToward` in the view.
 */
export function placeRest(view: 'restSide' | 'restFlat' | 'restFlatThumb' | 'restTop', wrist: Pt, dir: number, yToward: Pt): PlacedHand {
  const art = handArt(view);
  const ex = P(Math.cos(dir), Math.sin(dir));
  let ey = perp(ex);
  if (ey.u * yToward.u + ey.v * yToward.v < 0) ey = mul(ey, -1);
  const mirrored = ex.u * ey.v - ex.v * ey.u < 0;
  const th = Math.atan2(ex.v, ex.u);
  const at = (p: Pt) => add(wrist, add(mul(ex, p.u), mul(ey, p.v)));
  const mapE = (e: Ellipse): Ellipse => ({ c: at(e.c), rx: e.rx, ry: e.ry, rot: mirrored ? th - e.rot : th + e.rot });
  const F = at(art.F);
  return {
    art,
    at,
    sx: 1,
    ex,
    wrist,
    F,
    butt: F,
    bead: F,
    stubEnd: F,
    parts: art.parts.map((p) => ({ ...p, placed: p.outline.map(at), placedAxis: [at(p.axis[0]), at(p.axis[1])] as [Pt, Pt], placedChain: p.chain ? { pts: p.chain.pts.map(at), r: [...p.chain.r] } : null, placedEdge: p.edge ? p.edge.map(at) : null, placedShade: p.shade ? ([at(p.shade[0]), at(p.shade[1])] as [Pt, Pt]) : null })),
    creases: art.creases.map((c) => c.map(at)),
    ...(art.gaps ? { gaps: art.gaps.map((c) => c.map(at)) } : {}),
    ...(art.contact ? { contact: art.contact.map(mapE) } : {}),
    nails: art.nails.map((c) => c.map(at)),
    warm: art.warm.map((w) => ({ c: at(w.c), r: w.r })),
    lights: art.lights.map(mapE),
    darks: art.darks.map(mapE),
    thumbTip: art.thumbTip ? at(art.thumbTip) : null,
    knuckle: at(art.knuckle),
  };
}

/**
 * Place the fist round a mic's handle (holdSide): its fulcrum on the handle at
 * `F`, the handle from `butt` toward the mic's head `head`; of the two ways the
 * fist can lie on it, the one whose wrist is nearer the `elbow`.
 */
export function placeHold(F: Pt, butt: Pt, head: Pt, elbow: Pt): PlacedHand {
  const a = placeHand('holdSide', P(0, 0), F, butt, head, 1, { mirror: false });
  const b = placeHand('holdSide', P(0, 0), F, butt, head, 1, { mirror: true });
  const d = (h: PlacedHand) => Math.hypot(h.wrist.u - elbow.u, h.wrist.v - elbow.v);
  return d(a) <= d(b) ? a : b;
}

/* ── placing an authored hand on the pose ── */

export type PlacedHand = {
  art: HandArt;
  /** The foreshortening along the hand's length, and the hand's axis in the view. */
  sx: number;
  ex: Pt;
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
  parts: (HandArtPart & { placed: Poly; placedAxis: [Pt, Pt]; placedChain: { pts: Pt[]; r: number[] } | null; placedEdge: Poly | null; placedShade: [Pt, Pt] | null })[];
  creases: Poly[];
  gaps?: Poly[];
  contact?: Ellipse[];
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
export function placeHand(view: HandArtView, W: Pt, F: Pt, butt: Pt, bead: Pt, sx = 1, opts: { mirror?: boolean } = {}): PlacedHand {
  const art = handArt(view);
  let th: number;
  let ex: Pt;
  let ey: Pt;
  if (art.stickLocal !== undefined && opts.mirror !== undefined) {
    // Placed by its stick, the side its local +y (the thumb's) faces given:
    // from ABOVE there is no "down the picture" to decide it.
    const dS = unit(sub(bead, butt));
    const aS = Math.atan2(dS.v, dS.u);
    const aL = Math.atan2(Math.sin(art.stickLocal), Math.cos(art.stickLocal) * sx);
    th = opts.mirror ? aS + aL : aS - aL;
    ex = P(Math.cos(th), Math.sin(th));
    ey = opts.mirror ? mul(perp(ex), -1) : perp(ex);
  } else if (art.stickLocal !== undefined) {
    // Placed by its STICK: the drawing's stick (foreshortened along the hand
    // as the rest of it) lies on the pose's stick; y (the palm side) down.
    const dS = unit(sub(bead, butt));
    const aS = Math.atan2(dS.v, dS.u);
    const aL = Math.atan2(Math.sin(art.stickLocal), Math.cos(art.stickLocal) * sx);
    th = aS - aL;
    ex = P(Math.cos(th), Math.sin(th));
    ey = perp(ex);
    if (ey.v < 0) {
      // (the palm side would face up: the mirrored drawing, which turns the other way)
      th = aS + aL;
      ex = P(Math.cos(th), Math.sin(th));
      ey = mul(perp(ex), -1);
    }
  } else {
    const dWF = unit(sub(F, W));
    const aLocal = Math.atan2(art.F.v, art.F.u * sx);
    const aView = Math.atan2(dWF.v, dWF.u);
    th = aView - aLocal;
    ex = P(Math.cos(th), Math.sin(th));
    ey = perp(ex);
    // y (the palm side) points down the picture.
    if (ey.v < 0) ey = mul(ey, -1);
  }
  // A mirrored placement (the palm side had to flip to face down) turns the ellipses the other way.
  const mirrored = ex.u * ey.v - ex.v * ey.u < 0;
  // (the drawing is a true side view of the hand: along its length it is
  // foreshortened as the hand's own axis is in this view, `sx`)
  const raw = (p: Pt) => add(mul(ex, p.u * sx), mul(ey, p.v));
  const o = sub(F, raw(art.F));
  const at = (p: Pt) => add(o, raw(p));
  const mapE = (e: Ellipse): Ellipse => ({ c: at(e.c), rx: e.rx, ry: e.ry, rot: mirrored ? th - e.rot : th + e.rot });
  return {
    art,
    at,
    sx,
    ex,
    wrist: at(P(0, 0)),
    F,
    butt,
    bead,
    stubEnd: add(butt, mul(sub(F, butt), 0.45)),
    parts: art.parts.map((p) => ({ ...p, placed: p.outline.map(at), placedAxis: [at(p.axis[0]), at(p.axis[1])] as [Pt, Pt], placedChain: p.chain ? { pts: p.chain.pts.map(at), r: p.chain.r.map((r) => r * Math.sqrt(sx)) } : null, placedEdge: p.edge ? p.edge.map(at) : null, placedShade: p.shade ? ([at(p.shade[0]), at(p.shade[1])] as [Pt, Pt]) : null })),
    creases: art.creases.map((c) => c.map(at)),
    nails: art.nails.map((c) => c.map(at)),
    warm: art.warm.map((w) => ({ c: at(w.c), r: w.r })),
    lights: art.lights.map(mapE),
    darks: art.darks.map(mapE),
    thumbTip: art.thumbTip ? at(art.thumbTip) : null,
    knuckle: at(art.knuckle),
  };
}
