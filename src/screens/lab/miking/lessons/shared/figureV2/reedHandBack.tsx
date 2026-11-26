/**
 * FIGURE V2 — A RIGHT HAND ON THE KEYS OF A SAXOPHONE OR WOODWIND, SEEN FROM THE BACK OF THE HAND (owner 2026-11-25,
 * "batches by family": the reed family). Authored 2-D art, as the approved pole and mallet hands; placed and painted by
 * reedHandKit.tsx.
 *
 * WHAT THE HAND DOES (written first; the real technique). The hand lies along the side of the tube with its palm toward
 * the tube and curls its fingers ROUND the tube onto the keys on the far side of the curl:
 *   • the saxophone's right hand from the player's right: the palm on the right side of the body, the index, middle and
 *     ring fingers' pads on the F, E and D pearls at the front, the little finger lower on the low C / E-flat keys, the
 *     thumb under the thumb hook at the back — behind the hand, out of sight;
 *   • the flute's and piccolo's left hand from the audience: the palm turned toward the player, the flute resting on the
 *     base of the index finger, the fingers rising and curling back over the top onto their keys, the thumb under the
 *     tube on its thumb key — behind the hand;
 *   • the clarinet's, bass clarinet's, oboe's and bassoon's hands from the front or from above where the back of the
 *     hand is the side we see: the palm on its side of the tube, the fingers wrapping round the front onto the rings.
 * The fingers are relaxed and curved, never flat or stiff; each finger presses with the fleshy pad of its tip; the wrist
 * is straight or a little bent; the thumb is never seen from this side.
 *
 * WHAT THE EYE SEES (left to right; the forearm in from the left, the fingers to the right, the index on top):
 *   1. the cuff and the wrist (≈ 52 mm across), narrower than the hand;
 *   2. the back of the hand: a broad, gently rounded plane widening to the knuckles (≈ 84 mm across); on the index side
 *      its top edge rises a little over the thumb's base (the thumb itself is under the hand); the big knuckles a low
 *      slanting row of swells, the middle's the farthest out;
 *   3. the four fingers growing out of the hand as one form, side by side, touching at their roots and opening apart
 *      toward their ends (they reach keys about 35 mm apart): each one's first segment its full length, then the middle
 *      joint's bend — the nearest, most lit part of the finger — then the rest curling away from us round the tube, so
 *      the last two segments are short and the end is seen from the back: the NAIL, clear, across the end of each finger;
 *      each finger its own width and reach (the middle the longest, the little the shortest and lowest);
 *   4. between the fingers short soft creases from each notch back toward the knuckles.
 * Frame: millimetres, the wrist's centre at the origin, +x toward the fingers, +y DOWN toward the little finger.
 */
import { P, type Poly, type Pt } from './geom.ts';
import { E, pts, type ReedHandArt, type ReedNail, type ReedSoft } from './reedHandKit';

/** Each finger: its big knuckle K, its middle joint's bend B (the nearest point), the end of the curl T, its width. */
// (round 2: the fingers thicker and closer — touching to past the middle of their first segments — and CURLED: past the
// middle joint's bend only a short foreshortened end, narrower, its nail on it)
export const BACK_FINGERS = [
  { name: 'index', K: P(78, -28), B: P(114, -33), T: P(125, -34), w: 20.5 },
  { name: 'middle', K: P(82, -8), B: P(122, -6.5), T: P(134, -6), w: 21 },
  { name: 'ring', K: P(78, 11.5), B: P(114, 18), T: P(125, 21), w: 19.5 },
  { name: 'little', K: P(70, 29), B: P(98, 39), T: P(107, 43), w: 16.5 },
] as const;

const sub = (a: Pt, b: Pt) => P(a.u - b.u, a.v - b.v);
const add = (a: Pt, b: Pt) => P(a.u + b.u, a.v + b.v);
const mul = (a: Pt, k: number) => P(a.u * k, a.v * k);
const unit = (a: Pt) => mul(a, 1 / (Math.hypot(a.u, a.v) || 1));
const lerp = (a: Pt, b: Pt, t: number) => P(a.u + (b.u - a.u) * t, a.v + (b.v - a.v) * t);
/** The finger's direction and its side toward the index (up). */
const dirOf = (f: (typeof BACK_FINGERS)[number]) => unit(sub(f.T, f.K));
const upOf = (d: Pt) => P(d.v, -d.u);

/** The notch between finger i and i + 1 (a third of the way along their first segments, a little back). */
const notch = (i: number): Pt => {
  const a = BACK_FINGERS[i];
  const b = BACK_FINGERS[i + 1];
  return lerp(lerp(a.K, a.B, 0.62), lerp(b.K, b.B, 0.62), 0.5);
};

/** The curled end's half-width against the finger's. */
const END_K = 0.78;
/** A finger's edge from its root to its end (`s` +1 the index side, −1 the little side), the end's half-round. */
function fingerEdge(f: (typeof BACK_FINGERS)[number], s: 1 | -1, from: number): Poly {
  const d = dirOf(f);
  const n = mul(upOf(d), s);
  const h = f.w / 2;
  const out: Poly = [];
  // (the width eases in a little at the middle joint's bend and toward the end: a finger, not a rod)
  for (const t of [from, 0.5, 0.8, 1]) {
    if (t < from) continue;
    const c = t <= 1 ? lerp(f.K, f.B, t) : f.B;
    out.push(add(c, mul(n, h * (t === 1 ? 1.05 : 1))));
  }
  const b2 = lerp(f.B, f.T, 0.55);
  out.push(add(b2, mul(n, h * 0.88)));
  out.push(add(f.T, mul(n, h * END_K)));
  return out;
}
/** The end of a finger: a half-round past T, from the index side to the little side. */
function fingerEnd(f: (typeof BACK_FINGERS)[number]): Poly {
  const d = dirOf(f);
  const n = upOf(d);
  const h = (f.w / 2) * END_K;
  const out: Poly = [];
  for (const a of [0.35, 0.7, 1.05, 1.4]) {
    const c = Math.cos(a * 1.12);
    const s = Math.sin(a * 1.12);
    out.push(add(f.T, add(mul(n, h * c), mul(d, h * 0.95 * s))));
  }
  for (const a of [1.4, 1.05, 0.7, 0.35].slice(1)) {
    const c = Math.cos(a * 1.12);
    const s = Math.sin(a * 1.12);
    out.push(add(f.T, add(mul(n, -h * c), mul(d, h * 0.95 * s))));
  }
  return out;
}

const F = BACK_FINGERS;
/** The one outline: the wrist's top, the hand's index edge, each finger out and back between the notches, the little
 *  finger's underside, the hand's little-finger edge back to the wrist. */
const BODY: Poly = (() => {
  const out: Poly = pts([[-44, -25.6], [-20, -25.6], [0, -26], [16, -29.4], [32, -33.6], [50, -35.4], [64, -36]]);
  for (let i = 0; i < 4; i++) {
    const f = F[i];
    const top = fingerEdge(f, 1, i === 0 ? 0.25 : 0.72);
    out.push(...top, ...fingerEnd(f));
    const bot = fingerEdge(f, -1, i === 3 ? 0.2 : 0.72).reverse();
    out.push(...bot);
    if (i < 3) out.push(notch(i));
  }
  out.push(...pts([[58, 37.6], [40, 36.4], [20, 31.6], [0, 26], [-20, 25.6], [-44, 25.6]]));
  return out;
})();

const NAILS: ReedNail[] = F.map((f) => {
  const d = dirOf(f);
  // (the end curls away from us: its nail is seen from its free edge — short along the finger, wide across it)
  return { c: add(f.T, mul(d, f.w * 0.12)), len: f.w * 0.36, w: f.w * 0.56, rot: Math.atan2(d.v, d.u), layer: 'front' as const };
});

const along = (f: (typeof BACK_FINGERS)[number]) => Math.atan2(dirOf(f).v, dirOf(f).u);
const LIGHTS: ReedSoft[] = [
  // the back of the hand: one broad soft light toward the index side
  { e: E(40, -10, 30, 20, 0.05), o: 0.14, layer: 'front' },
  // the knuckles: a low swell each, lit on its upper side
  ...F.map((f) => ({ e: E(f.K.u - 2, f.K.v - f.w * 0.18, f.w * 0.32, f.w * 0.22, along(f)), o: 0.26, layer: 'front' as const })),
  // each first segment lit along its upper side; the middle joint's bend, the nearest point, lit most
  ...F.map((f) => ({ e: { c: add(lerp(f.K, f.B, 0.55), mul(upOf(dirOf(f)), f.w * 0.16)), rx: Math.hypot(f.B.u - f.K.u, f.B.v - f.K.v) * 0.36, ry: f.w * 0.16, rot: along(f) }, o: 0.24, layer: 'front' as const })),
  ...F.map((f) => ({ e: E(f.B.u, f.B.v - f.w * 0.08, f.w * 0.3, f.w * 0.26, along(f)), o: 0.3, layer: 'front' as const })),
];
const DARKS: ReedSoft[] = [
  // each finger's lower side, turning down toward the next
  ...F.map((f) => ({ e: { c: add(lerp(f.K, f.B, 0.6), mul(upOf(dirOf(f)), -f.w * 0.34)), rx: Math.hypot(f.B.u - f.K.u, f.B.v - f.K.v) * 0.4, ry: f.w * 0.12, rot: along(f) }, o: 0.26, layer: 'front' as const })),
  // the curl: past the bend each finger turns away from us, into shade
  ...F.map((f) => ({ e: E(lerp(f.B, f.T, 0.75).u, lerp(f.B, f.T, 0.75).v, f.w * 0.3, f.w * 0.44, along(f)), o: 0.2, layer: 'front' as const })),
  // the hand's little-finger edge turning away; the wrist going into the cuff
  { e: E(40, 32, 30, 4, 0.06), o: 0.24, layer: 'front' },
  // the turn at each middle joint: just past the bend the finger falls away, a soft band of shade across it
  ...F.map((f) => ({ e: E(lerp(f.B, f.T, 0.35).u, lerp(f.B, f.T, 0.35).v, 3, f.w * 0.44, along(f)), o: 0.14, layer: 'front' as const })),
];
/** The creases: from each notch back toward the knuckles, fading. */
const LINES = [0, 1, 2].map((i) => {
  const n = notch(i);
  const k = lerp(F[i].K, F[i + 1].K, 0.5);
  return { poly: [n, lerp(n, k, 0.45), lerp(n, k, 0.85)] as Poly, layer: 'front' as const, w: 0.8 };
});

export const REED_HAND_BACK: ReedHandArt = {
  name: 'back',
  pieces: [{ poly: BODY, layer: 'front' }],
  lines: LINES,
  nails: NAILS,
  lights: LIGHTS,
  darks: DARKS,
  pads: [F[0].T, F[1].T, F[2].T, F[3].T],
  reachOf: F.map((f) => ({ K: f.K, T: f.T, w: f.w })),
  fore: P(-1, 0),
  centre: P(60, 0),
  reach: 90,
  // (the saxophone's body behind the hand, its keys at the front edge where the fingers curl)
  tube: { x: 112, r: 20 },
};
