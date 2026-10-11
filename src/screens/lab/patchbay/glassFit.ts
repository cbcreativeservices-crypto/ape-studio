/**
 * The Patchbay rack's glass arithmetic — pure, so test/patchbayRack_20261010
 * can prove the 9 pt floor in node (owner 2026-09-25: lab display text ≥ 9 pt
 * on a 390-wide phone; measure fontSize × fit scale).
 */
import { STAGE_HEIGHTS, type StageSize } from '../rack/rackTypes.ts';

/** The viewBox width every patchbay drawing is authored at. */
export const DRAWING_W = 340;
/** StageFit's inner margin on the glass. */
export const PAD = 6;
/** The glass's border (RackUnit hands render() the glass height − 2). */
export const GLASS_BORDER = 2;
/** Below this window height the rack's own glass rule applies. */
export const TALL_FROM = 760;
/** The most of the window a patchbay glass may take. */
export const GLASS_SHARE_MAX = 0.42;

/**
 * The phone glass height that draws a drawing of `aspect` (w ÷ h) at ≥ 1×
 * — at least DRAWING_W wide — on a tall phone; undefined on a short one.
 * Pure: 340 units ÷ aspect + the fit margins; undefined when the declared
 * glass size is already tall enough, never over GLASS_SHARE_MAX of the window.
 */
export function patchbayGlassHeight(winH: number, aspect: number, size: StageSize = 'L'): number | undefined {
  if (!(winH >= TALL_FROM) || !(aspect > 0)) return undefined;
  const need = Math.ceil(DRAWING_W / aspect + PAD * 2 + GLASS_BORDER);
  // The declared glass already draws it at ≥ 1×: the rack's own height.
  if (need <= STAGE_HEIGHTS[size]) return undefined;
  return Math.min(Math.round(winH * GLASS_SHARE_MAX), need);
}

/** The width StageFit gives a drawing of `aspect` inside (w, h) — the same
 *  arithmetic, so a drawing that needs its width up front gets it. */
export function fitWidth(w: number, h: number, aspect: number, pad = PAD): number {
  const innerW = Math.max(40, w - pad * 2);
  const innerH = Math.max(40, h - pad * 2);
  return Math.max(40, Math.min(innerW, innerH * aspect));
}

