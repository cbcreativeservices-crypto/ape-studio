/**
 * THE METAL FAMILY'S AUTHORED HANDS — WHERE EACH DRAWING MEETS THE PICTURE (family batch, 2026-11-25). Pure.
 * Each drawing (figureV2/metalHand*.tsx) takes its anchor, its wrist and its forearm's way from here, so the
 * players' pose modules (no React, no Skia) can lay the arm to the drawing's wrist and the tests can read them.
 *   anchor  the drawing's point that lands on the held thing (mm, the drawing's own frame);
 *   cuff    the middle of its wrist, where the player's sleeve ends;
 *   fore    the forearm's way from the cuff toward the elbow (a unit vector).
 */
import { P, type Pt } from '../figureV2/geom.ts';
import { metalArtDir, metalArtToPage } from '../figureV2/metalHandArt.ts';

export type HandPlace = { anchor: Pt; cuff: Pt; fore: Pt };

const unitP = (u: number, v: number): Pt => {
  const l = Math.hypot(u, v) || 1;
  return P(u / l, v / l);
};

export const METAL_HAND_PLACES = {
  /** the dancer's hand wearing zills, from the palm side (front view): anchor = the thumb's tip */
  zillPalm: { anchor: P(0, 0), cuff: P(24, 178), fore: unitP(0, 1) },
  /** the dancer's hand wearing zills, its little-finger edge toward the camera (side view): anchor = the thumb's tip */
  zillEdge: { anchor: P(0, 0), cuff: P(-46, 204), fore: unitP(-0.6, 0.8) },
  /** the triangle player's right hand on the beater, from the back of the hand (side view): anchor = the fulcrum;
   *  the wrist 95 mm back along the hand's axis (0.96, 0.28), its middle 7.5 mm below the fulcrum's line */
  beaterBack: { anchor: P(0, 0), cuff: P(-95 * 0.96 - 7.5 * 0.28, -95 * 0.28 + 7.5 * 0.96), fore: unitP(-0.96, -0.28) },
  /** the triangle player's left hand on the clip, from the player's right (side view): anchor = the clip's center */
  clipSide: { anchor: P(0, 0), cuff: P(-60, 96), fore: unitP(-0.5, 0.87) },
} satisfies Record<string, HandPlace>;

export type MetalHandKind = keyof typeof METAL_HAND_PLACES;

/** (zillPalm) the middle finger's curled tip, which carries the lower cymbal (mm, from the thumb's tip). */
export const ZILL_PALM_MIDDLE = P(10, 42);
/** (zillEdge) the same, seen from the side. */
export const ZILL_EDGE_MIDDLE = P(6, 42);
/** (beaterBack) the way the beater leaves the hand toward its head, in the drawing's own frame. */
export const BEATER_BACK_DIR = unitP(0.93, -0.36);

/** The turn that lays a drawing's two points (`a` → `b`, its own frame) along a page pair (`pa` → `pb`). */
export function turnFor(a: Pt, b: Pt, pa: { u: number; v: number }, pb: { u: number; v: number }, mirror: boolean): number {
  const du = (b.u - a.u) * (mirror ? -1 : 1);
  const dv = b.v - a.v;
  return Math.atan2(pb.v - pa.v, pb.u - pa.u) - Math.atan2(dv, du);
}

/** A placed drawing's wrist on the page and its forearm's way there. */
export function drawnWrist(kind: MetalHandKind, at: { u: number; v: number }, rot: number, mirror: boolean): { cuff: Pt; fore: Pt } {
  const pl = METAL_HAND_PLACES[kind];
  return { cuff: metalArtToPage(pl, at.u, at.v, rot, mirror)(pl.cuff), fore: metalArtDir(pl.fore, rot, mirror) };
}
