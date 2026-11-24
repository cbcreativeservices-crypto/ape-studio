/**
 * FIGURE V2 — THE HAND AT REST SEEN FROM THE FRONT (wave 4 of D78, the shared
 * figure from the front, 2026-11-24). Pure: no React, no Skia. Authored the
 * way the approved resting hands are (authoredHands.ts): one outline in the
 * hand's own frame — origin at the wrist crease, x along the hand toward the
 * fingertips, y toward the PALM side — real millimetres, placed on the pose by
 * `placeRest`'s rule (here `placeFrontRest`).
 *
 *   'hangFront'  a standing person's hand hanging at the side, seen from the
 *                FRONT: the arm hangs with the palm toward the thigh, so the
 *                viewer sees the hand's THUMB side (its radial edge). The back
 *                of the hand is the outer contour (away from the body), the
 *                index finger in profile curling gently toward the palm, the
 *                middle fingertip a sliver beyond the index's (the gap starts
 *                at the tips); the THUMB lies nearest the viewer along the
 *                index's palm side, grown out of the thenar mound at the wrist
 *                (part of the one outline, no line where it joins), its blunt
 *                tip resting at about the index's middle joint, separated
 *                from the index by a narrow V that fades toward the web.
 *                ≈ 175 mm wrist to fingertip, ≈ 40 mm deep at the knuckles.
 *
 *   'lapFront'   a seated person's hand lying on the thigh just behind the
 *                knee, seen from the FRONT: the back of the hand foreshortened
 *                (it lies along the line of sight), its knuckle row as four
 *                soft swells inside one edge, the four fingers draping down
 *                over the front of the knee side by side (the middle longest,
 *                the little shortest; the gaps start at the tips and fade
 *                toward the knuckles), the thumb on the inner side lying along
 *                the thigh, foreshortened, part of the one outline.
 */
import { add, mul, P, perp, type Poly, type Pt } from './geom.ts';
import { handArt, type HandArt, type PlacedHand } from './authoredHands.ts';
import type { Ellipse } from './sidePlan.ts';

const pts = (xs: readonly (readonly [number, number])[]): Poly => xs.map(([x, y]) => P(x, y));
const E = (x: number, y: number, rx: number, ry: number, rot = 0): Ellipse => ({ c: P(x, y), rx, ry, rot });

/** A gap between two fingers: a thin wedge from the notch `n` (widest, darkest) back along `toward`,
 *  narrowing to nothing at `len` (the gaps start at the tips). */
function gapAlong(n: readonly [number, number], toward: readonly [number, number], len: number, w = 2.6): Poly {
  const d = P(toward[0], toward[1]);
  const q = P(-d.v, d.u);
  const N = P(n[0], n[1]);
  const at = (t: number, s: number) => add(N, add(mul(d, t), mul(q, s)));
  return [at(-1.2, -w / 2), at(len * 0.5, -w * 0.22), at(len, 0), at(len * 0.5, w * 0.22), at(-1.2, w / 2)];
}

/* ── the hanging hand from the front (its thumb side) ── */

// (authored at a man's hand length; drawn at 0.9 of it along the hand: the hanging hand with its gentle curl
// is ≈ 150 mm from the wrist crease to the curled fingertips, as the approved resting hand)
// (FrontBoom3, review 2026-11-24: "every hanging hand is a long sock or paddle … the thumb only a line … the
// fingertips three or four small equal round lumps") re-authored: a real hand ≈ 185 mm from the wrist crease to
// the fingertips; the WRIST narrower than the hand (it swells into the thenar mound and the knuckles); the THUMB a
// thumb — its two segments along the palm side, a soft bump at its joint, its blunt tip standing a little proud
// of the curled fingers, grown out of the mound; the fingertips of DIFFERENT lengths (the middle longest, the ring
// shorter, the little hidden), the gaps starting at the tips.
const HX = 1.04;
/** (the palm side's depth as seen from the thumb's side: the hand ≈ 50–60 mm deep over the curled fingers) */
const HY = 0.78;
const hx = (xs: readonly (readonly [number, number])[]) => xs.map(([x, y]) => [x > 0 ? x * HX : x, y > 0 ? y * HY : y] as const);
const HANG: readonly (readonly [number, number])[] = hx([
  // the skin runs on up under the cuff (no edge of its own across the wrist): the wrist ≈ 34 mm deep here
  [-28, -16.6], [0, -17],
  // the BACK of the hand (away from the body): widening from the wrist to the knuckles, the index knuckle a low
  // broad swell inside the edge
  [22, -18.8], [46, -20.6], [70, -21.8], [86, -22.4], [95, -21.4],
  // the index finger's back, bent gently at its two joints (≈ 20 mm thick), its tip curling in toward the thigh
  [110, -18.2], [126, -15], [139, -12.2], [151, -7.8], [161, -2], [169, 5], [174.6, 13], [177.4, 21], [176.6, 27.6], [172.6, 31.6],
  // the notch (the gap starts here); the MIDDLE fingertip, the longest, reaching beyond the index's tip
  [170.4, 32.6], [175.4, 35.6], [176.6, 41.4], [173.2, 46.4], [167.4, 48.4],
  // the notch; the RING fingertip, shorter, a step further in (the little finger hidden behind it)
  [164.6, 48.2], [165.6, 52.4], [162, 56.4], [156, 57.8], [150.4, 56.6],
  // the notch at the THUMB's tip: the thumb lies along the palm side nearest the viewer, its blunt tip standing a
  // little proud of the curled fingers, the soft bump of its joint, its first segment, then the thenar mound —
  // widest toward the wrist — narrowing into the wrist
  [147, 55.6], [143.6, 57.6], [137.6, 59.4], [130.8, 59], [125, 56.8], [118, 55.4], [110, 56.2], [102, 55.4], [92, 53.2], [78, 50.6],
  [62, 47.4], [46, 42.4], [30, 34.4], [16, 25.4], [0, 18.4], [-28, 17.2],
]);
/** The thumb's own contour inside the hand: from the web along the index's palm side, round its blunt tip to its
 *  outer side — its only line (none where it grows out of the mound). */
const HANG_THUMB_EDGE: readonly (readonly [number, number])[] = hx([[86, 28.6], [98, 32.4], [110, 36.8], [122, 41.2], [132, 45.6], [139.4, 50.4], [142, 54.6]]);

function hangFront(): HandArt {
  return {
    view: 'restSide',
    F: P(135, 0),
    // ONE form, one skin light (no seam): the thumb is told by its own contour (a soft line from the web round
    // its tip, none where it grows out of the mound), its lit face and its soft shadow on the curled fingers
    parts: [{ name: 'hand', layer: 'front', outline: pts(HANG), axis: [P(0, 0), P(180, 0)], kind: 'palm' }],
    creases: [
      pts(hx([[140, -8.6], [139.2, -3.4], [138.2, 1.4]])), // the index's middle joint, a short soft crease on its side
      pts(hx([[162.4, -1.6], [161.2, 4], [159.4, 8.6]])), // its end joint
      pts(HANG_THUMB_EDGE), // the thumb's contour
      pts(HANG_THUMB_EDGE.slice(3)), // (its tip, a little stronger: the thumb lies over the fingers there)
      pts(hx([[112, 41], [114, 46], [115, 52]])), // the thumb's joint, a short soft crease across it
    ],
    gaps: [gapAlong([170.4 * HX, 32.6 * HY], [-0.62, -0.78], 16, 2.6), gapAlong([164.6 * HX, 48.2 * HY], [-0.7, -0.72], 14, 2.4), gapAlong([147 * HX, 55.6 * HY], [-0.9, -0.42], 12, 2.4)],
    nails: [],
    warm: [{ c: P(92 * HX, -16), r: 5 }, { c: P(174 * HX, 18 * HY), r: 5 }, { c: P(138 * HX, 56 * HY), r: 4 }],
    lights: [
      E(52 * HX, -10, 38, 7, 0), // the back of the hand's lit edge, fading into the fingers
      E(88 * HX, -16, 6, 4.2, 0), // the index knuckle: a soft swell inside the edge
      E(112 * HX, 47 * HY, 22, 4.4, 0.12), // the thumb's face toward the viewer, lit along its length
      E(134 * HX, -1, 14, 4, 0.2), // the index's middle segment
      E(52 * HX, 30 * HY, 16, 7, 0.4), // the thenar mound's swell
    ],
    darks: [
      E(150 * HX, 46 * HY, 9, 9, 0.4), // the curled fingers behind the thumb's tip, turning toward the thigh
      E(80 * HX, 8, 28, 5, 0), // the hollow behind the thumb, between it and the index's root, in soft shade
      E(134 * HX, 40 * HY, 8, 3, 0.5), // the thumb's soft shadow on the index under it
      E(-14, 0, 14, 14, 0), // the wrist turning into the cuff's shade (narrower than the hand)
    ],
    knuckle: P(88 * HX, -17),
    knuckles: [P(88 * HX, -17)],
    wristTop: P(0, -17),
    wristBottom: P(0, 18.4 * HY),
    thumbTip: P(140 * HX, 55 * HY),
    thumbWeb: P(86 * HX, 28.6 * HY),
  };
}

/* ── the hand lying on the thigh, seen from the front ── */

/** How much of its length a hand lying on the thigh shows from the front (it lies along the thigh, which
 *  recedes toward the viewer seen from a standing person's eye: a drawing default). */
export const LAP_FORESHORTEN = 0.6;

/** The APPROVED hand from above (authoredHands 'restTop': the back of a relaxed hand lying palm-down, the
 *  thumb toward the body's midline, the knuckle row's four soft swells, the gaps starting at the tips),
 *  foreshortened along its length as it lies on the thigh. */
function lapFront(): HandArt {
  const t = handArt('restTop');
  const k = LAP_FORESHORTEN;
  // (the thumb lies in beside the index, as a relaxed hand's does, not splayed at the drawing's 25°: its side
  // of the hand — past the index's edge, y > 33 — drawn in toward the index)
  const TH = 33;
  // (FrontBoom3, review 2026-11-24: "the thumb a thin pointed spike springing from the side of the hand") the
  // thumb lies IN beside the index along the thigh, its side of the hand closed up to it — no spike
  const X = (p: Pt): Pt => P(p.u > 0 ? p.u * k : p.u, p.v > TH && p.u > 20 ? TH + (p.v - TH) * (p.u > 60 ? 0.2 : 0.2 + (0.6 * (60 - p.u)) / 40) : p.v);
  const XE = (e: Ellipse): Ellipse => ({ c: X(e.c), rx: e.rot === 0 ? e.rx * k : e.rx * (0.5 + k / 2), ry: e.ry, rot: e.rot * k });
  return {
    ...t,
    view: 'restSide',
    F: X(t.F),
    parts: t.parts.map((q) => ({ ...q, outline: q.outline.map(X), axis: [X(q.axis[0]), X(q.axis[1])] as [Pt, Pt], ...(q.edge ? { edge: q.edge.map(X) } : {}) })),
    creases: t.creases.map((c) => c.map(X)),
    ...(t.gaps ? { gaps: t.gaps.map((c) => c.map(X)) } : {}),
    nails: [],
    warm: t.warm.map((w) => ({ c: X(w.c), r: w.r })),
    lights: t.lights.map(XE),
    darks: t.darks.map(XE),
    knuckle: X(t.knuckle),
    ...(t.knuckles ? { knuckles: t.knuckles.map(X) } : {}),
    ...(t.thumbWeb ? { thumbWeb: X(t.thumbWeb) } : {}),
    wristTop: X(t.wristTop),
    wristBottom: X(t.wristBottom),
    thumbTip: t.thumbTip ? X(t.thumbTip) : null,
  };
}

const HANG_ART = hangFront();
const LAP_ART = lapFront();
export type FrontHandView = 'hangFront' | 'lapFront';
export const frontHandArt = (v: FrontHandView): HandArt => (v === 'hangFront' ? HANG_ART : LAP_ART);

/**
 * Place a front-view resting hand at the wrist, pointing `dir` (radians in the view), its local +y (the
 * palm's side for 'hangFront', the thumb's for 'lapFront') turned toward `yToward`. The same placement
 * as authoredHands.placeRest (1 : 1, a mirror where the side calls for it).
 */
export function placeFrontRest(view: FrontHandView, wrist: Pt, dir: number, yToward: Pt): PlacedHand {
  const art = frontHandArt(view);
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
    thumbTip: art.thumbTip ? at(art.thumbTip) : null,
    knuckle: at(art.knuckle),
  };
}
