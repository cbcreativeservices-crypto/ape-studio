/**
 * Where a screen-guide step sits (owner 2026-10-31: "too much to scroll,
 * maybe present it in sections; when showing, try to allow the correct area
 * of the screen below to be still seen so what is being read is relevant").
 *
 * Pure: the overlay hands in the MEASURED regions (guideRegions.ts →
 * measureInWindow, made relative to the overlay's own root) and gets back
 * where the card goes and which band stays bright. No React, no RN — the
 * test imports it directly.
 *
 *   low   — the display + readout strip stay visible and bright; the card is
 *           anchored to the bottom, filling the space under the readouts.
 *   high  — the dock stays visible, bright and live; the card is anchored to
 *           the top, over the display, ending above the dock.
 *   strip — TRY THIS: nothing dimmed, nothing blocked; a compact strip rides
 *           just above the dock so the faders work and the display shows.
 *
 * A screen with no regions (the lab home, a collapsed display) falls back to
 * a bottom card with no bright band.
 */
import type { GuideRect } from './guideRegions';

export type GuidePlacement = 'low' | 'high' | 'strip';

export type GuideLayout = {
  rootW: number;
  rootH: number;
  insetTop: number;
  insetBottom: number;
  /** Glass ∪ readout strip, relative to the overlay root — or null. */
  display: GuideRect | null;
  /** The dock, relative to the overlay root — or null. */
  dock: GuideRect | null;
};

export type GuideStepPlacement = {
  /** The band left bright (and outlined); null = no band. */
  keep: GuideRect | null;
  /** Card box: anchored to `top` or to `bottom`, never taller than maxHeight. */
  card: { top?: number; bottom?: number; maxHeight: number };
  /** Dim everything outside `keep`. */
  dim: boolean;
  /** Taps outside the card and the bright band are held (reading mode). */
  blocking: boolean;
};

/** Breathing room between the card and the area it leaves visible. */
export const GUIDE_GAP = 8;
/** Below this the card overlaps rather than become unreadable. */
export const GUIDE_MIN_CARD = 170;

export function unionRect(a: GuideRect | null, b: GuideRect | null): GuideRect | null {
  if (!a) return b;
  if (!b) return a;
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return { x, y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y };
}

/** A region outside the root (a screen underneath, scrolled away) is no region. */
export function onScreen(r: GuideRect | null, rootW: number, rootH: number): GuideRect | null {
  if (!r) return null;
  if (r.y >= rootH || r.y + r.h <= 0 || r.x >= rootW || r.x + r.w <= 0) return null;
  return r;
}

export function placeGuideStep(place: GuidePlacement, L: GuideLayout): GuideStepPlacement {
  const bottomGap = L.insetBottom + GUIDE_GAP;
  const fallback: GuideStepPlacement = {
    keep: null,
    card: { bottom: bottomGap, maxHeight: Math.round(L.rootH * 0.62) },
    dim: true,
    blocking: true,
  };
  if (place === 'strip') {
    return {
      keep: null,
      card: {
        bottom: L.dock ? Math.max(bottomGap, L.rootH - L.dock.y + GUIDE_GAP) : bottomGap,
        maxHeight: Math.round(L.rootH * 0.4),
      },
      dim: false,
      blocking: false,
    };
  }
  if (place === 'high') {
    if (!L.dock) return fallback;
    const top = L.insetTop + GUIDE_GAP;
    return {
      keep: L.dock,
      card: { top, maxHeight: Math.max(GUIDE_MIN_CARD, Math.round(L.dock.y - GUIDE_GAP - top)) },
      dim: true,
      blocking: true,
    };
  }
  // low
  if (!L.display) return fallback;
  const top = L.display.y + L.display.h + GUIDE_GAP;
  return {
    keep: L.display,
    card: { bottom: bottomGap, maxHeight: Math.max(GUIDE_MIN_CARD, Math.round(L.rootH - top - bottomGap)) },
    dim: true,
    blocking: true,
  };
}
