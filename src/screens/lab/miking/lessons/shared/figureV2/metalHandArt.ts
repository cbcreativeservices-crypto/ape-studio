/**
 * FIGURE V2 — THE METAL FAMILY'S AUTHORED HANDS: THE ART'S SHAPE (2026-11-25, family batch "metal"). Pure (no
 * React, no Skia): the drawings (figureV2/metalHand*.tsx) are lists of hand-placed pieces in millimetres, read by
 * the painter (metalHandPaint.tsx), by the players' pose modules (where each drawing's wrist lands, so the sleeve
 * ends there) and by the tests.
 *
 * Frame of every art: mm, +x right, +y DOWN, the light from the upper left.
 */
import { P, type Poly, type Pt } from './geom.ts';
import type { Ellipse } from './sidePlan.ts';

export type MetalLayer = 'back' | 'front';

/** One closed form of the hand (the palm with its forearm, a finger, the thumb …). */
export type MetalPiece = {
  name: string;
  outline: Poly;
  /** 'back': painted before the held thing (the palm, what lies beyond it); 'front': after it (what wraps it) */
  layer: MetalLayer;
  /** soft lights (the skin's lit color) and shades (its deep color), clipped to the piece */
  lights?: Ellipse[];
  darks?: Ellipse[];
  /** (default true) the thin soft outline round the piece; `quiet`: where it is NOT drawn (where the piece grows
   *  out of the hand: never a closed line round a finger where it meets the hand) */
  stroke?: boolean;
  quiet?: Ellipse[];
};
/** A nail: a rounded oblong on one piece (painted clipped to it). */
export type MetalNail = { piece: string; c: Pt; len: number; w: number; rot: number };
/** A soft crease on one piece: clear at its first point, fading to its last. */
export type MetalCrease = { piece: string; pts: Poly; w?: number };

export type MetalHandArt = {
  name: string;
  pieces: MetalPiece[];
  nails: MetalNail[];
  creases: MetalCrease[];
  /** where the hand meets the held thing (the page anchor lands here) */
  anchor: Pt;
  /** the middle of the wrist, where the player's sleeve ends */
  cuff: Pt;
  /** the forearm's way from the cuff toward the elbow (a unit vector, art frame) */
  fore: Pt;
  /** the one skin light's center and half-span */
  fill: { c: Pt; r: number };
};

export const pts = (xs: readonly (readonly [number, number])[]): Poly => xs.map(([x, y]) => P(x, y));
export const E = (x: number, y: number, rx: number, ry: number, rot = 0): Ellipse => ({ c: P(x, y), rx, ry, rot });

/** A quiet nail's outline: a rounded oblong `len` along `rot`, `w` across. */
export function nailPoly(c: Pt, len: number, w: number, rot: number): Poly {
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

/** A point of the art on the page: its anchor at (x, y), turned `rot`, mirrored or not, `s` per mm. */
export function metalArtToPage(art: { anchor: Pt }, x: number, y: number, rot = 0, mirror = false, s = 1) {
  const m = mirror ? -1 : 1;
  const co = Math.cos(rot);
  const si = Math.sin(rot);
  return (q: Pt): Pt => {
    const u = (q.u - art.anchor.u) * s * m;
    const v = (q.v - art.anchor.v) * s;
    return P(x + u * co - v * si, y + u * si + v * co);
  };
}

/** A direction of the art on the page (turned, mirrored). */
export function metalArtDir(d: Pt, rot = 0, mirror = false): Pt {
  const u = mirror ? -d.u : d.u;
  const co = Math.cos(rot);
  const si = Math.sin(rot);
  return P(u * co - d.v * si, u * si + d.v * co);
}
