/**
 * FIGURE V2 — A RIGHT HAND ON THE KEYS OF A SAXOPHONE OR WOODWIND, SEEN FROM THE PALM SIDE, THE TUBE BETWEEN US AND THE
 * PALM (owner 2026-11-25, "batches by family": the reed family). Authored 2-D art, as the approved pole and mallet hands;
 * placed and painted by reedHandKit.tsx.
 *
 * WHAT THE HAND DOES (written first; the real technique). The palm is on the far side of the tube, facing us; the fingers
 * go from the palm behind the tube, curl round its edge and come back toward us, each fingertip's pad pressing its key on
 * the tube's near face; the thumb on the palm's index side reaches up to the tube's other edge and steadies it:
 *   • the flute's and piccolo's RIGHT hand from the audience: the palm under and behind the flute facing forward, the
 *     fingers arching over the top onto the lower keys, their ends and nails seen over the top; the thumb under the tube
 *     behind the index and middle fingers;
 *   • the saxophone's LEFT hand from the player's right: the palm on the far (left) side of the body, the index, middle
 *     and ring fingers coming round the front of the body onto the B, A and G pearls; the thumb at the back on its rest by
 *     the octave key;
 *   • the flute's and piccolo's left hand from above, where the palm is the side we see.
 * The fingers curved and relaxed; each presses with the fleshy pad of its tip; the thumb the thickest digit, bent a
 * little at its middle joint, its nail on the outer side of its end.
 *
 * WHAT THE EYE SEES (the forearm in from the left, the fingers to the right; from the palm side the LITTLE finger is on
 * top and the thumb at the bottom). Paint order, far → near:
 *   1. BEHIND THE INSTRUMENT: the wrist out of the cuff; the palm — the heel on the little-finger side (top), the thumb's
 *      mound on the bottom, the hollow between; the palm's crease line at the fingers' roots; the four fingers' first
 *      segments running on to the right, side by side, into the tube, their ends tucked under it;
 *   2. the instrument;
 *      the thumb (with the palm, behind the instrument) from its mound up to the tube's near edge, its tip against it,
 *      its nail on the outer side of its end;
 *   3. IN FRONT OF IT: each finger's curl round the tube's far edge (its middle joint, the outermost point) and its end
 *      segment lying back over the tube toward the palm, the NAIL clear on its back.
 * Frame: millimetres, the wrist's centre at the origin, +x toward the fingers, +y DOWN (toward the thumb).
 */
import { P, type Poly, type Pt } from './geom.ts';
import { E, pts, type ReedHandArt, type ReedNail, type ReedSoft } from './reedHandKit';

const add = (a: Pt, b: Pt) => P(a.u + b.u, a.v + b.v);
const mul = (a: Pt, k: number) => P(a.u * k, a.v * k);
const lerp = (a: Pt, b: Pt, t: number) => P(a.u + (b.u - a.u) * t, a.v + (b.v - a.v) * t);

/** The design tube (only for reading the drawing: its axis and radius; the lesson's own instrument is drawn). */
export const PALM_TUBE = { x: 116, r: 11 };

/** The fingers top → bottom (little, ring, middle, index): the root on the palm R, the curl's outer point C beyond the
 *  tube's far edge, the end's tip T back over the tube, the width. */
// (round 2: each end LONGER than it is wide — the end segment lying back over the tube, ≈ 32 mm from the curl to the tip
// — so it reads as a finger, never a ball; the first segments side by side with no gap between them)
// (round 3: each end its own length and lean — the middle the longest, the little the shortest — the ends lying a
// little slanted over the tube, not a stack of equal rounded pills)
export const PALM_FINGERS = [
  { name: 'little', y: -29, R: P(72, -29), C: P(130, -31), T: P(106, -36), w: 15.5 },
  { name: 'ring', y: -10, R: P(80, -10), C: P(135.5, -10.5), T: P(103, -14), w: 18 },
  { name: 'middle', y: 10, R: P(82, 10), C: P(137.5, 10.5), T: P(100, 8.5), w: 19 },
  { name: 'index', y: 30, R: P(79, 30), C: P(133.5, 32), T: P(102, 32), w: 18.5 },
] as const;
const F = PALM_FINGERS;

/** BEHIND: the wrist, the palm and the fingers' first segments into the tube — ONE outline, the fingers side by side
 *  (parted by soft lines, never by gaps). */
const PALM: Poly = (() => {
  const xEnd = PALM_TUBE.x + 2;
  const out: Poly = pts([[-44, -25.6], [-20, -25.4], [0, -25.6], [20, -29], [40, -34], [58, -37.6], [76, -38.4], [96, -38.2]]);
  // the stubs' ends under the tube: one soft scalloped edge (hidden by the instrument)
  F.forEach((f) => {
    const h = f.w / 2;
    out.push(P(xEnd - 3, f.y - h * 0.85), P(xEnd + 1, f.y - h * 0.4), P(xEnd + 1.6, f.y + h * 0.2), P(xEnd - 1, f.y + h * 0.8));
  });
  // the index's underside back to the thumb's mound, the mound (a broad swell) and the wrist
  out.push(...pts([[96, 40], [78, 41.4], [64, 44.5], [48, 45], [30, 40], [14, 32], [0, 25.6], [-20, 25.4], [-44, 25.6]]));
  return out;
})();

/** IN FRONT: one finger's curl and end over the tube — from the far edge of the tube, round the middle joint (C) and
 *  back over the tube to the rounded tip (T). */
function fingerEnd(f: (typeof F)[number]): Poly {
  const h = f.w / 2;
  const m = lerp(f.C, f.T, 0.5);
  // (one finger lying over the tube: the broad rounded curl on the right — the middle joint coming round the tube's far
  // edge — narrowing a little to the tip on the left, its pad on the key)
  return [
    P(f.C.u - 6, f.C.v - h * 1.04), P(f.C.u - 0.6, f.C.v - h * 0.7), P(f.C.u + 1.6, f.C.v), P(f.C.u - 0.6, f.C.v + h * 0.7), P(f.C.u - 6, f.C.v + h * 1.04),
    P(m.u, m.v + h * 0.92),
    P(f.T.u + 5, f.T.v + h * 0.84), P(f.T.u - 0.6, f.T.v + h * 0.56), P(f.T.u - 2.4, f.T.v), P(f.T.u - 0.6, f.T.v - h * 0.56), P(f.T.u + 5, f.T.v - h * 0.84),
    P(m.u, m.v - h * 0.92),
  ];
}

/** THE THUMB: from its mound at the palm's lower edge up and out to the tube's near edge (its pad against the tube),
 *  bent a little at its middle joint; the thickest digit. */
// (round 2: thicker — the thickest digit, ≈ 22 mm at its base joint — broad where it leaves the mound)
const THUMB: Poly = pts([
  // its root inside the mound (painted on the palm: one skin)
  [30, 28], [46, 20],
  // the base segment's upper edge, the middle joint's soft bend, the end segment's upper edge to the pad
  [62, 15], [76, 12], [88, 11.2], [97, 12.4],
  // the rounded end (the pad against the tube's near edge)
  [103.2, 15.4], [106, 20.6], [105.6, 26.4], [102, 31],
  // the outer side (the nail's side) back along the end segment, the middle joint's bend, the base segment, the mound
  [95, 33.6], [86, 35], [76, 38.4], [64, 43], [50, 46.6], [36, 44.6],
]);

const NAILS: ReedNail[] = [
  // each finger's end lies back over the tube toward us: its nail clear on the back of the end, toward the tip
  ...F.map((f) => ({ c: lerp(f.T, f.C, 0.2), len: f.w * 0.62, w: f.w * 0.5, rot: Math.atan2(f.T.v - f.C.v, f.T.u - f.C.u), layer: 'front' as const })),
  // the thumb's nail on the outer side of its end (seen a little from its side: narrower)
  { c: P(99.6, 27.6), len: 11.5, w: 7.4, rot: 0.42, layer: 'back' },
];

const LIGHTS: ReedSoft[] = [
  // the palm: the heel (little-finger side) and the thumb's mound lit, the hollow between in shade
  { e: E(38, -18, 22, 10, -0.12), o: 0.18, layer: 'back' },
  { e: E(40, 30, 20, 9, 0.2), o: 0.2, layer: 'back' },
  // each first segment's pad, a soft light along it
  ...F.map((f) => ({ e: E((f.R.u + PALM_TUBE.x) / 2 + 2, f.y - f.w * 0.1, 14, f.w * 0.2), o: 0.16, layer: 'back' as const })),
  // each curl (the middle joint, the outermost point) and each end lit on its upper side
  ...F.map((f) => ({ e: E(f.C.u - 3, f.C.v - f.w * 0.16, 4, f.w * 0.26), o: 0.28, layer: 'front' as const })),
  ...F.map((f) => ({ e: E(f.T.u + 8, f.T.v - f.w * 0.2, 7, f.w * 0.16), o: 0.22, layer: 'front' as const })),
  // the thumb along its upper side
  { e: E(78, 21, 16, 3, -0.2), o: 0.26, layer: 'back' },
];
const DARKS: ReedSoft[] = [
  // the hollow of the palm; its crease line at the fingers' roots
  { e: E(50, 4, 22, 12, 0.1), o: 0.1, layer: 'back' },
  // between the first segments (each one's lower side)
  ...F.slice(0, 3).map((f) => ({ e: E((f.R.u + PALM_TUBE.x) / 2 + 4, f.y + f.w * 0.46, 17, 2.4), o: 0.2, layer: 'back' as const })),
  // the curl's underside and each end's lower side
  ...F.map((f) => ({ e: E(f.C.u - 6, f.C.v + f.w * 0.3, 5, f.w * 0.16), o: 0.24, layer: 'front' as const })),
  // past the tube's far edge each finger turns away round it: its curl in soft shade at the outer end
  ...F.map((f) => ({ e: E(f.C.u + 1, f.C.v, 4.5, f.w * 0.5), o: 0.26, layer: 'front' as const })),
  ...F.map((f) => ({ e: E(f.T.u + 9, f.T.v + f.w * 0.36, 9, f.w * 0.12), o: 0.22, layer: 'front' as const })),
  // the thumb's underside
  { e: E(76, 34, 18, 2.6, -0.24), o: 0.26, layer: 'back' },
];
/** The palm's crease line where the fingers begin (soft, short, broken), and the thumb's mound's crease. */
const LINES = [
  { poly: pts([[70, -22], [76, -4], [79, 18]]), layer: 'back' as const, w: 0.7 },
  // the fingers parted by soft lines (strong toward the tube, fading toward the palm)
  ...[0, 1, 2].map((i) => {
    const y = (F[i].y + F[i + 1].y) / 2;
    return { poly: pts([[PALM_TUBE.x - 2, y], [96, y - 0.2], [86, y + 0.4]]), layer: 'back' as const, w: 0.8 };
  }),
  // the thumb's middle joint, a short crease on its upper side
  { poly: pts([[86, 15], [87.6, 19.6]]), layer: 'back' as const, w: 0.6 },
];

export const REED_HAND_PALM: ReedHandArt = {
  name: 'palm',
  // (the thumb behind the instrument with the palm: it steadies the tube from its far side — under the flute, at the
  // back of the saxophone on its rest — and never stands over the keys as a flap)
  pieces: [{ poly: PALM, layer: 'back' }, { poly: THUMB, layer: 'back' }, ...F.map((f) => ({ poly: fingerEnd(f), layer: 'front' as const }))],
  lines: LINES,
  nails: NAILS,
  lights: LIGHTS,
  darks: DARKS,
  // (index … little: the pads under the ends, at the tips)
  pads: [add(F[3].T, P(2, 0)), add(F[2].T, P(2, 0)), add(F[1].T, P(2, 0)), add(F[0].T, P(2, 0))],
  // (index … little: from the palm's root to just short of the tip — the end over the tube moves whole with its tip)
  reachOf: [F[3], F[2], F[1], F[0]].map((f) => ({ K: f.R, T: P(f.T.u - 1, f.y), w: f.w })),
  fore: P(-1, 0),
  centre: P(60, 0),
  reach: 90,
  tube: PALM_TUBE,
};
