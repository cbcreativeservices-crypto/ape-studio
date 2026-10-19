/**
 * djZoom — FULL SCREEN as a working surface for the DJ lab (second visual
 * review 2026-10-18, finding 22; D35). Kept inside the DJ lab: the shared
 * rack (rack/StageFullScreen) is not changed.
 *
 * The shared full screen zooms by growing the stage's box and letting two
 * scrollers pan it, so a plot drawn in screen space (a Scene `screenOverlay`)
 * zoomed and scrolled away with the gear, and every step opened on the
 * centre. The DJ rack (DjRack's stage host) instead:
 *   - locks the rack's scrollers while zoomed and draws a WINDOW the size of
 *     the visible body exactly where the rack's scroll puts it;
 *   - renders the page into that window at the window's size, so its plots
 *     and readouts are laid out — and stay pinned — as on a big glass;
 *   - hands the page's Scene the zoom (`z`) through this context: the Scene
 *     zooms ONLY its gear, opening on its `focus` part (or its first
 *     callout), and the learner drags the gear under the pinned plots.
 *
 * Pure (no React Native) apart from the context, so the geometry is tested.
 */
import { createContext } from 'react';

export type PanLimits = { minX: number; maxX: number; minY: number; maxY: number };

export type DjZoom = {
  /** The full-screen zoom step (1 on the glass and at 1×). */
  z: number;
  /** The learner's drag (screen points), relative to the opening camera. */
  pan: { x: number; y: number };
  /** The Scene reports how far the gear can be dragged (it knows its frame). */
  limits?: { current: PanLimits | null };
};

export const DjZoomContext = createContext<DjZoom>({ z: 1, pan: { x: 0, y: 0 } });

/** The scroll offset the rack's full screen puts a fraction `f` of the
 *  content at (mirrors rack/stageFitMath.anchorOffset). */
export function anchorOffsetDj(content: number, view: number, f: number): number {
  if (view <= 0 || content <= view) return 0;
  return Math.max(0, Math.min(content - view, f * content - view / 2));
}

/**
 * The visible window inside the zoomed box. The DJ stage reports no aspect,
 * so the rack's 1× box is the body less its padding (8 a side across, 8 in
 * all down): the body is the 1× box + (16, 8), and the zoomed box is the 1×
 * box × z.
 */
export function zoomWindow(w: number, h: number, z: number, anchor: { fx: number; fy: number } | null): { x: number; y: number; w: number; h: number } {
  const vw = Math.min(w, Math.round(w / z + 16));
  const vh = Math.min(h, Math.round(h / z + 8));
  const fx = anchor?.fx ?? 0.5;
  const fy = anchor?.fy ?? 0.5;
  return { x: anchorOffsetDj(w, vw, fx), y: anchorOffsetDj(h, vh, fy), w: vw, h: vh };
}

/**
 * The gear's transform when zoomed: scale `s1 · z` about the focus point,
 * which sits mid-region at the opening, plus the learner's drag — clamped so
 * the frame keeps covering the region (no empty band past its edges).
 */
export function zoomedXf(
  base: { s: number },
  region: { x: number; y: number; w: number; h: number },
  frame: { x: number; y: number; w: number; h: number },
  focus: { x: number; y: number },
  z: number,
  pan: { x: number; y: number },
): { xf: { s: number; ox: number; oy: number }; limits: PanLimits } {
  const s = base.s * z;
  const ox0 = region.x + region.w / 2 - focus.x * s;
  const oy0 = region.y + region.h / 2 - focus.y * s;
  const range = (lo: number, len: number, f0: number, fl: number) => {
    const min = lo + len - (f0 + fl) * s;
    const max = lo - f0 * s;
    return min <= max ? [min, max] : [(min + max) / 2, (min + max) / 2];
  };
  const [xmin, xmax] = range(region.x, region.w, frame.x, frame.w);
  const [ymin, ymax] = range(region.y, region.h, frame.y, frame.h);
  const c0x = Math.max(xmin, Math.min(xmax, ox0));
  const c0y = Math.max(ymin, Math.min(ymax, oy0));
  const ox = Math.max(xmin, Math.min(xmax, c0x + pan.x));
  const oy = Math.max(ymin, Math.min(ymax, c0y + pan.y));
  return { xf: { s, ox, oy }, limits: { minX: xmin - c0x, maxX: xmax - c0x, minY: ymin - c0y, maxY: ymax - c0y } };
}
