/**
 * FIGURE V2 — THE HAND AT REST SEEN FROM BEHIND (wave 6 of D78, the ensembles'
 * standing figure from the back; 2026-11-24). Pure: no React, no Skia.
 * Authored the way the approved resting hands are (authoredHands.ts,
 * frontHands.ts): one outline in the hand's own frame — origin at the wrist
 * crease, x along the hand toward the fingertips, y toward the PALM side —
 * real millimeters.
 *
 *   'hangBack'  a standing person's hand hanging at the side, seen from
 *               BEHIND. A relaxed arm hangs with the palm toward the thigh,
 *               turned a little back (the forearm rests a little pronated), so
 *               a viewer behind sees the hand's LITTLE-FINGER edge with a
 *               strip of the palm on its inner side: the back of the hand is
 *               the outer contour (away from the body), the heel of the hand
 *               (the hypothenar mound) the fleshy inner contour, the little
 *               finger in profile curling gently toward the palm, the ring
 *               fingertip a step beyond it and the middle's a step beyond that
 *               (the little finger is the shortest: the others reach past it;
 *               the gaps start at the tips). The thumb lies on the far side of
 *               the hand and does not show. ≈ 145 mm wrist to the curled
 *               fingertips, ≈ 38 mm deep at the wrist (the wrist's thickness).
 */
import { add, mul, P, perp, type Poly, type Pt } from './geom.ts';
import type { HandArt, PlacedHand } from './authoredHands.ts';
import type { Ellipse } from './sidePlan.ts';

const pts = (xs: readonly (readonly [number, number])[]): Poly => xs.map(([x, y]) => P(x, y));
const E = (x: number, y: number, rx: number, ry: number, rot = 0): Ellipse => ({ c: P(x, y), rx, ry, rot });

/** A gap between two fingers: a thin wedge from the notch `n` (widest, darkest) back along `toward`,
 *  narrowing to nothing at `len` (the gaps start at the tips). */
function gapAlong(n: readonly [number, number], toward: readonly [number, number], len: number, w = 2.4): Poly {
  const d = P(toward[0], toward[1]);
  const q = P(-d.v, d.u);
  const N = P(n[0], n[1]);
  const at = (t: number, s: number) => add(N, add(mul(d, t), mul(q, s)));
  return [at(-1.2, -w / 2), at(len * 0.5, -w * 0.22), at(len, 0), at(len * 0.5, w * 0.22), at(-1.2, w / 2)];
}

/**
 * (Ensembles3, reviewer 2026-11-24: "sock tubes with a curled end") THE HANGING HAND FROM BEHIND, turned the
 * relaxed arm's way — the hand's little-finger edge toward the viewer and the hand opened toward him a little, so
 * all four fingers show, stepped one beyond the other: the little finger the shortest at the outer edge, the
 * ring finger reaching past it, the middle the longest, the index a little shorter, each gently curled toward the
 * palm, the gaps between them starting at the tips; past the index the thumb's tip just shows at the far edge;
 * the heel of the hand the fleshy inner contour into the wrist. ≈ 160 mm wrist to the middle fingertip.
 */
export const HANG_BACK_FINGERS: readonly (readonly [number, number])[] = [
  // the skin running up under the cuff; the wrist's ulnar knob a low swell
  [-26, -20.6], [-8, -21.4], [4, -20.8],
  // the outer edge: the little finger's metacarpal, its knuckle a low broad swell
  [26, -19.6], [50, -19], [70, -19.2], [84, -19.8], [94, -19.2],
  // the little finger (≈ 60 mm past its knuckle), bent gently at its two joints, its tip turning in
  [110, -17.6], [124, -14.6], [136, -10.4], [146, -5], [151.6, 1], [153, 6.4], [150.8, 10.4], [147.6, 12],
  // the ring finger reaching past it
  [152, 13.2], [161, 15.6], [166.6, 19.6], [168.4, 24.6], [166.6, 29], [162.6, 30.6],
  // the middle finger, the longest
  [167, 32.6], [173, 35.6], [175.6, 40.6], [174.4, 46], [170, 48.6], [165.6, 48.8],
  // the index, a little shorter
  [167.4, 51], [167.6, 56], [164.4, 60.4], [158.6, 62.2], [153.6, 61.6],
  // the thumb's tip showing past the index at the far edge, its pad toward the fingers
  [148, 63.4], [138, 65.4], [128, 64.6], [119, 61],
  // the thumb's side back to its mound, then the heel of the hand into the wrist
  [108, 57.6], [94, 52.6], [78, 46.6], [62, 40], [46, 34.4], [30, 29.8], [14, 26.2], [0, 24.2], [-26, 23.6],
];

/** The older edge-on hand (kept for reference; no longer drawn). */
export const HANG_BACK: readonly (readonly [number, number])[] = [
  // the skin runs on up under the cuff (no edge of its own across the wrist); the wrist's ulnar knob a low
  // swell on the back edge just below the cuff
  [-26, -19.6], [-8, -20.4], [4, -19.8],
  // the BACK of the hand along the little finger's bone: nearly straight, the knuckle a low broad swell
  [26, -17.8], [50, -17], [68, -16.8], [78, -17.4], [86, -16.6],
  // the little finger's back, bent at its two joints (≈ 15 mm thick), its tip turning in toward the palm
  [99, -13.6], [110, -10.4], [119, -6], [126, -0.6], [130.6, 6], [133, 12.4], [132.6, 18], [129.4, 22],
  // a shallow kink where the ring finger shows past it; the ring and middle fingertips as ONE soft lobe
  // stepping in beyond the little finger's (the gap between them only a short line from the tips)
  [128.6, 25.4], [131.4, 30], [131.6, 36], [128.4, 41.6], [122.6, 45.6], [116, 46],
  // under the curled fingers into the palm, then the heel of the hand — the fleshy mound — widest near the
  // wrist, and into the wrist
  [109, 41.4], [100, 36], [89, 31.4], [76, 29], [60, 28.4], [44, 27.8], [28, 25.6], [12, 22.6], [0, 20.8], [-26, 20],
];

function hangBack(): HandArt {
  return {
    view: 'restSide',
    F: P(120, 0),
    // ONE form, one skin light (no seam): the fingers read apart by the gaps from their tips and soft joint creases
    parts: [{ name: 'hand', layer: 'front', outline: pts(HANG_BACK_FINGERS), axis: [P(0, 0), P(170, 0)], kind: 'palm' }],
    creases: [
      pts([[124, -14], [123, -8.4], [122, -2.6]]), // the little finger's middle joint
      pts([[141, -8], [140, -3], [139, 2]]), // its end joint
      pts([[133, 15.4], [132.4, 21], [131.8, 27]]), // the ring finger's middle joint
      pts([[137, 33.6], [136.4, 39.4], [135.8, 45.2]]), // the middle finger's
      pts([[133, 51.4], [132.4, 56], [131.6, 60.2]]), // the index's
      pts([[112, 59], [100, 54], [88, 49]]), // the thumb's mound meeting the palm
    ],
    gaps: [
      gapAlong([148.6, 12.4], [-0.99, 0.05], 38, 2.2), // little | ring
      gapAlong([163.8, 31.6], [-0.995, 0.02], 42, 2.2), // ring | middle
      gapAlong([166.4, 49.8], [-0.995, -0.02], 40, 2.2), // middle | index
      gapAlong([152, 62.4], [-0.97, -0.1], 22, 1.8), // index | thumb
    ],
    nails: [],
    warm: [{ c: P(150, 4), r: 4.5 }, { c: P(165, 23), r: 4.5 }, { c: P(172, 41), r: 4.5 }, { c: P(163, 56), r: 4.2 }, { c: P(134, 63), r: 4 }],
    lights: [
      E(48, -12, 36, 6.4, 0), // the outer edge's lit form, fading into the fingers
      // the knuckle row: low broad swells INSIDE the hand, stepping across it (never bumps on the outline)
      E(92, -14, 7, 4.2, 0.1),
      E(98, 4, 7, 4.4, 0.05),
      E(100, 22, 7, 4.4, 0),
      E(96, 39, 6.6, 4.2, -0.05),
      // each finger's middle segment catching the light along its back
      E(132, -9, 9, 2.6, 0.2),
      E(146, 21, 10, 2.6, 0.05),
      E(150, 40, 10, 2.6, 0),
      E(146, 56, 9, 2.4, -0.05),
      E(40, 24, 26, 5, 0.04), // the heel of the hand
    ],
    darks: [
      E(76, 10, 32, 9, 0), // the hand's middle, a soft half-tone between the edge and the heel
      E(116, 54, 9, 4, 0.3), // under the thumb's tip
    ],
    knuckle: P(92, -16),
    knuckles: [P(92, -16), P(98, 2), P(100, 20), P(96, 37)],
    wristTop: P(0, -21),
    wristBottom: P(0, 24),
    thumbTip: null,
  };
}

export const HANG_BACK_ART = hangBack();

/**
 * (Ensembles3, reviewer 2026-11-24: the chorister's "block fists drawn IN FRONT of the folder's lower edge") THE
 * HAND HOLDING A FOLDER'S LOWER EDGE, SEEN FROM THE HALL. The hand is under the edge, palm up; its four fingers
 * curl up round the edge onto the back cover (the hall's side) — their backs and nails toward the viewer, flat on
 * the cover, the little finger the shortest, the middle the longest, the gaps from the tips; the thumb is over
 * the top on the pages (the singer's side), hidden, its mound and the heel of the hand showing at the edge's side
 * and below it. Frame: origin on the edge, x UP the cover (toward the fingertips), y across toward the THUMB's
 * side; mm.
 */
const FOLDER_FRONT: readonly (readonly [number, number])[] = [
  // the hand's little-finger edge below the folder's edge, rounding into the wrist
  [-38, -14], [-35, -25], [-26, -31.6], [-12, -33], [0, -33],
  // the little finger on the cover, the shortest, tapering to its tip
  [14, -32.8], [30, -31.8], [42, -29.8], [49.6, -26.4], [51.6, -21.8], [49.6, -17.8],
  // the ring finger
  [56, -16.4], [62, -13.2], [64.8, -8.8], [63.6, -4], [60.4, -1.8],
  // the middle finger, the longest
  [66.4, -0.6], [70.2, 3], [71.2, 7.8], [68.8, 12.4], [65, 14.2],
  // the index
  [64.6, 16.2], [65.6, 20.6], [62.8, 25.6], [57, 28.6], [50, 29.2],
  // down the index's side to the web, the thumb's mound bulging at the edge's side (the thumb itself over the top)
  [36, 30.4], [20, 32.4], [6, 37], [-6, 39.4], [-18, 37.6], [-28, 32.4], [-35, 23], [-38.6, 11], [-39.4, 0],
];
const nailAt = (x: number, y: number, w: number, h: number): Poly => pts(Array.from({ length: 8 }, (_, i) => [x + Math.sin((i / 8) * Math.PI * 2) * h, y + Math.cos((i / 8) * Math.PI * 2) * w] as const));
function folderFront(): HandArt {
  return {
    view: 'restTop',
    F: P(30, 0),
    parts: [{ name: 'hand', layer: 'front', outline: pts(FOLDER_FRONT), axis: [P(-38, 0), P(70, 0)], kind: 'palm' }],
    creases: [
      // each finger's middle and end joints, short soft lines across it
      pts([[22, -32], [21.6, -25.6], [21.2, -19]]),
      pts([[38, -30], [37.6, -25], [37.2, -20]]),
      pts([[30, -15], [29.6, -9], [29.2, -3]]),
      pts([[48, -13.6], [47.6, -8.6], [47.2, -3.4]]),
      pts([[32, 1], [31.8, 7], [31.4, 13]]),
      pts([[53, 1.4], [52.8, 7], [52.4, 12.4]]),
      pts([[30, 17.4], [29.6, 23], [29, 28]]),
      pts([[48, 17.4], [47.6, 22.4], [47, 27]]),
      pts([[6, -31], [6.6, -18], [7.2, -6], [7.4, 6], [7, 18], [6, 28]]), // where the fingers turn round the edge
    ],
    gaps: [
      gapAlong([49.8, -17.2], [-0.995, 0.02], 40, 2),
      gapAlong([61, -1.2], [-0.995, 0], 46, 2),
      gapAlong([65.2, 15.2], [-0.995, -0.02], 44, 2),
    ],
    nails: [nailAt(45.4, -25, 4.6, 4.4), nailAt(58.4, -8.6, 5, 4.8), nailAt(65, 7.6, 5, 5), nailAt(59.6, 22.2, 4.8, 4.6)],
    warm: [{ c: P(48, -24), r: 4.5 }, { c: P(61, -8), r: 4.5 }, { c: P(68, 8), r: 4.5 }, { c: P(62, 22), r: 4.2 }, { c: P(-6, 32), r: 6 }],
    lights: [
      E(30, -27, 16, 2.8, 0), E(40, -9, 18, 2.8, 0), E(44, 7, 20, 2.8, 0), E(40, 22, 17, 2.8, 0), // each finger's back
      E(-12, 28, 12, 6, 0.4), // the thumb's mound
    ],
    darks: [
      E(-20, -6, 16, 12, 0), // the hand's underside below the edge, turning away from the light
      E(3, 0, 3.4, 30, 0), // the shade where the fingers turn round the edge
    ],
    knuckle: P(2, -28),
    knuckles: [P(2, -28), P(4, -9), P(4, 8), P(2, 23)],
    wristTop: P(-38, -14),
    wristBottom: P(-39.4, 0),
    thumbTip: null,
  };
}
export const FOLDER_FRONT_ART = folderFront();

/**
 * (Ensembles3, reviewer 2026-11-24 B14: "the near hand shows no thumb; the fingertips a fan of equal round pills")
 * A CLAPPING HAND SEEN FROM ITS BACK, in profile: the palms meet across the body's midline, so the near hand turns
 * its back to the viewer, its thumb along the TOP edge. Four fingers together, of different lengths (the middle
 * the longest, the little the shortest), each its own form with a gap from the tip back toward its knuckle; the
 * knuckles low swells inside the hand; the thumb growing from the mound at the wrist's top, lying along the index
 * with its own gap from the tip to the web. Frame: x from the wrist toward the fingertips, y toward the THUMB; mm.
 */
const CLAP_BACK: readonly (readonly [number, number])[] = [
  // the wrist's lower (little-finger) edge, then the hand's outer edge to the little finger
  [-24, -26], [0, -27], [30, -30.4], [62, -33], [88, -33.6],
  // the little finger, the shortest
  [104, -33.4], [122, -32.4], [138, -30.6], [148, -28], [152.4, -24.4], [151.6, -20.6], [147.8, -18.4],
  // the ring finger
  [156, -17.8], [166, -15.6], [171.4, -11.8], [172, -7.6], [169, -4.6],
  // the middle finger, the longest
  [176, -3.4], [181.4, 0.4], [183, 5], [181, 9.6], [176.6, 12.2],
  // the index
  [176, 14.6], [176.2, 19.6], [172.6, 24.6], [165.4, 27.4], [152, 28.2], [130, 28.6],
  // the web; the thumb lying along the index, its tip short of the index's middle joint
  [112, 29.8], [116.6, 33.2], [117.4, 38], [114, 42.2], [106, 44.4], [92, 44.6], [74, 43.4], [54, 40.4],
  // the thumb's mound into the wrist's top edge
  [34, 36], [16, 30.6], [0, 27.4], [-24, 26.6],
];
function clapBack(): HandArt {
  return {
    view: 'restSide',
    F: P(120, 0),
    parts: [{ name: 'hand', layer: 'front', outline: pts(CLAP_BACK), axis: [P(0, 0), P(180, 0)], kind: 'palm' }],
    creases: [
      pts([[122, -31], [121.4, -25], [121, -19.4]]), // the little finger's middle joint
      pts([[134, -16.4], [133.6, -10.6], [133.2, -5]]), // the ring finger's
      pts([[140, -2.4], [139.8, 4], [139.4, 11]]), // the middle finger's
      pts([[136, 14.8], [135.6, 20.4], [135, 26]]), // the index's
      pts([[84, 40], [82, 36.4], [80, 32.6]]), // the thumb's joint
    ],
    gaps: [
      gapAlong([148.4, -18.2], [-0.995, 0.02], 38, 2),
      gapAlong([169.6, -4.2], [-0.995, 0], 44, 2),
      gapAlong([177, 12.8], [-0.995, -0.02], 42, 2),
      gapAlong([112.6, 30.4], [-0.99, -0.06], 42, 1.8), // the thumb from the index, to the web
    ],
    nails: [],
    warm: [{ c: P(150, -24), r: 4.4 }, { c: P(170, -9), r: 4.4 }, { c: P(181, 5), r: 4.4 }, { c: P(173, 21), r: 4.4 }, { c: P(113, 39), r: 4.2 }],
    lights: [
      E(50, 2, 40, 14, 0), // the back of the hand
      // the knuckle row: low broad swells inside the hand
      E(96, -24, 7, 5, 0), E(100, -8, 7, 5, 0), E(101, 7, 7, 5, 0), E(98, 21, 7, 5, 0),
      E(84, 40, 14, 3.4, 0.05), // the thumb's back
    ],
    darks: [E(60, 30, 30, 5, 0.04), E(132, 6, 30, 16, 0)],
    knuckle: P(98, -8),
    knuckles: [P(96, -24), P(100, -8), P(101, 7), P(98, 21)],
    wristTop: P(0, 27.4),
    wristBottom: P(0, -27),
    thumbTip: P(117, 38),
  };
}
export const CLAP_BACK_ART = clapBack();

/** Place an authored hand (1 : 1 mm) at `o`, its x along `dir` (radians), its +y turned toward `yToward`. */
export function placeArt(art: HandArt, o: Pt, dir: number, yToward: Pt): PlacedHand {
  const ex = P(Math.cos(dir), Math.sin(dir));
  let ey = perp(ex);
  if (ey.u * yToward.u + ey.v * yToward.v < 0) ey = mul(ey, -1);
  const mirrored = ex.u * ey.v - ex.v * ey.u < 0;
  const th = Math.atan2(ex.v, ex.u);
  const at = (p: Pt) => add(o, add(mul(ex, p.u), mul(ey, p.v)));
  const mapE = (e: Ellipse): Ellipse => ({ c: at(e.c), rx: e.rx, ry: e.ry, rot: mirrored ? th - e.rot : th + e.rot });
  const F = at(art.F);
  return {
    art,
    at,
    sx: 1,
    ex,
    wrist: at(P(art === FOLDER_FRONT_ART ? -38 : 0, 0)),
    F,
    butt: F,
    bead: F,
    stubEnd: F,
    parts: art.parts.map((p) => ({ ...p, placed: p.outline.map(at), placedAxis: [at(p.axis[0]), at(p.axis[1])] as [Pt, Pt], placedChain: null, placedEdge: p.edge ? p.edge.map(at) : null, placedShade: null })),
    creases: art.creases.map((c) => c.map(at)),
    ...(art.gaps ? { gaps: art.gaps.map((c) => c.map(at)) } : {}),
    nails: art.nails.map((c) => c.map(at)),
    warm: art.warm.map((w) => ({ c: at(w.c), r: w.r })),
    lights: art.lights.map(mapE),
    darks: art.darks.map(mapE),
    thumbTip: null,
    knuckle: at(art.knuckle),
  };
}

/**
 * Place the hanging hand seen from behind at the wrist, pointing `dir` (radians in the view), its local +y
 * (the palm's side) turned toward `yToward` (the body). 1 : 1, mirrored where the side calls for it — the
 * same rule as frontHands.placeFrontRest.
 */
export function placeBackRest(wrist: Pt, dir: number, yToward: Pt): PlacedHand {
  const art = HANG_BACK_ART;
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
    parts: art.parts.map((p) => ({ ...p, placed: p.outline.map(at), placedAxis: [at(p.axis[0]), at(p.axis[1])] as [Pt, Pt], placedChain: null, placedEdge: p.edge ? p.edge.map(at) : null, placedShade: null })),
    creases: art.creases.map((c) => c.map(at)),
    ...(art.gaps ? { gaps: art.gaps.map((c) => c.map(at)) } : {}),
    nails: art.nails.map((c) => c.map(at)),
    warm: art.warm.map((w) => ({ c: at(w.c), r: w.r })),
    lights: art.lights.map(mapE),
    darks: art.darks.map(mapE),
    thumbTip: null,
    knuckle: at(art.knuckle),
  };
}
