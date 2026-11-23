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

export type HandArtView = 'fistEdge' | 'palmThumb' | 'backTop' | 'thumbTop';

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
 *   • The thumb: from the back of the hand (`backTop`) it lies UNDER the hand
 *     along the stick ("make sure when viewed from above, the thumb is
 *     correctly placed under the hand"), painted first, the hand's shadow on
 *     it; on a hand rolled toward its thumb side (`thumbTop`) it lies along
 *     the TOP of the stick, nearest the eye, painted last, the knuckle row
 *     turning away beyond it.
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
const T_THUMB: Chain = { pts: [[18, 26], [52, 43], [80, 46], [104, 40]], r: [11.6, 10.6, 9.6, 8.6] };

/** From above the thumb lies on its side along the stick: its nail faces OUT,
 *  away from the hand — a sliver along its outer edge, toward the tip. */
function thumbSideNail(c: Chain): Poly {
  const k = c.pts.length - 1;
  const a = P(c.pts[k - 1][0], c.pts[k - 1][1]);
  const b = P(c.pts[k][0], c.pts[k][1]);
  let n = perp(unit(sub(b, a)));
  if (n.v < 0) n = mul(n, -1); // outward: +y, away from the hand
  const r = c.r[k];
  const at = (f: number, o: number) => add(add(a, mul(sub(b, a), f)), mul(n, r * o));
  return [at(0.45, 0.62), at(0.7, 0.84), at(0.95, 0.66), at(0.97, 0.4), at(0.7, 0.5), at(0.47, 0.42)];
}

function backTop(): HandArt {
  const digit = (name: string, c: Chain, d: HandArtPart['digit']): HandArtPart => ({ name, layer: 'front', outline: chain(c), axis: axisOf(c), kind: 'digit', chain: bones(c), digit: d });
  return {
    view: 'backTop',
    F: P(100, 30),
    stickLocal: TOP_STICK,
    // the thumb FIRST (under the hand), then the one silhouette of the back of the hand and the fingers
    parts: [
      digit('thumb', T_THUMB, 'thumb'),
      { name: 'hand', layer: 'front', outline: pts(FIST_TOP), axis: [P(0, 0), P(116, 0)], kind: 'palm' },
    ],
    // the three valleys' short creases, fading forward over the curl
    creases: [pts([[96, -21], [100, -20.5], [103, -20]]), pts([[103, -3], [106.5, -2.5], [110, -2]]), pts([[104, 13.5], [107, 13.7], [110, 13.8]])],
    nails: [thumbSideNail(T_THUMB)],
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
    thumbTip: P(T_THUMB.pts[3][0], T_THUMB.pts[3][1]),
  };
}

// The hand rolled toward its thumb side: a narrower back, the knuckle row turning away (each swell
// smaller toward the little finger), the index finger's side the hand's near edge.
const FIST_ROLLED: readonly (readonly [number, number])[] = [
  [-6, -20], [14, -24], [40, -28], [66, -30], [82, -30],
  [88, -28], [91, -25], [89.5, -22], [88, -19.5],
  [95, -15], [99.5, -12], [98.5, -9], [96.5, -6.5],
  [105, -1], [109, 3], [107.5, 6.5], [106, 8.5],
  [114, 13], [115, 18], [112, 23], [104, 26],
  [88, 26], [66, 27], [42, 26], [20, 24], [-6, 20],
];
const ROLLED_KNUCKLES: readonly (readonly [number, number])[] = [[91, -25], [99.5, -12], [109, 3], [115, 18]];
const R_THUMB: Chain = { pts: [[18, 18], [52, 30], [82, 33], [106, 30]], r: [12, 11, 9.8, 8.8] };

function thumbTop(): HandArt {
  const digit = (name: string, c: Chain, d: HandArtPart['digit']): HandArtPart => ({ name, layer: 'front', outline: chain(c), axis: axisOf(c), kind: 'digit', chain: bones(c), digit: d });
  return {
    view: 'thumbTop',
    F: P(100, 22),
    stickLocal: (12 * Math.PI) / 180,
    // the one silhouette of the hand and fingers, then the thumb on top along the stick
    parts: [
      { name: 'hand', layer: 'front', outline: pts(FIST_ROLLED), axis: [P(0, 0), P(112, 0)], kind: 'palm' },
      digit('thumb', R_THUMB, 'thumb'),
    ],
    creases: [pts([[83, -20.5], [85.5, -20], [88, -19.5]]), pts([[91.5, -7.5], [94, -7], [96.5, -6.5]]), pts([[100, 8], [103, 8.3], [106, 8.5]])],
    nails: [nailOf(R_THUMB)],
    warm: [],
    lights: [
      E(52, 26, 30, 6, 0), // the thumb's lit top along the stick
      E(88, -24, 3.5, 3, 0), E(96, -11, 4, 3.5, 0), E(104, 3, 5, 4, 0), E(109, 17, 5.5, 4.5, 0),
    ],
    darks: [E(108, -6, 5, 26, 0.3)],
    knuckle: P(ROLLED_KNUCKLES[3][0], ROLLED_KNUCKLES[3][1]),
    knuckles: ROLLED_KNUCKLES.map(([x, y]) => P(x, y)),
    wristTop: P(0, -20),
    wristBottom: P(0, 20),
    thumbTip: P(R_THUMB.pts[3][0], R_THUMB.pts[3][1]),
  };
}

const ARTS: Record<HandArtView, HandArt> = { fistEdge: fistEdge(), palmThumb: palmThumb(), backTop: backTop(), thumbTop: thumbTop() };
export const handArt = (v: HandArtView): HandArt => ARTS[v];

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
  parts: (HandArtPart & { placed: Poly; placedAxis: [Pt, Pt]; placedChain: { pts: Pt[]; r: number[] } | null })[];
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
    parts: art.parts.map((p) => ({ ...p, placed: p.outline.map(at), placedAxis: [at(p.axis[0]), at(p.axis[1])] as [Pt, Pt], placedChain: p.chain ? { pts: p.chain.pts.map(at), r: p.chain.r.map((r) => r * Math.sqrt(sx)) } : null })),
    creases: art.creases.map((c) => c.map(at)),
    nails: art.nails.map((c) => c.map(at)),
    warm: art.warm.map((w) => ({ c: at(w.c), r: w.r })),
    lights: art.lights.map(mapE),
    darks: art.darks.map(mapE),
    thumbTip: art.thumbTip ? at(art.thumbTip) : null,
    knuckle: at(art.knuckle),
  };
}
