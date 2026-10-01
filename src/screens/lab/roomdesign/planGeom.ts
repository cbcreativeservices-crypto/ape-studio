/**
 * planGeom — the pure geometry between the room (metres) and the glass
 * (points), shared by the plan and side views and node-tested so a drag is
 * proven to land where the finger is at every zoom.
 *
 * FULL SCREEN (house rule D35): the views lay themselves out in GLASS UNITS —
 * the box they are given divided by StageTextScale — and paint through an SVG
 * viewBox of that size, so every px constant (strokes, fonts, handles) grows
 * with the zoom. A touch arrives in box pixels and is divided by the same
 * scale before it goes through this transform, so a 2× drawing maps a 2×
 * finger offset to the same metre.
 */
import type { Bounds, Pt } from './roomModel';

export type PlanTransform = {
  /** Points per metre. */
  k: number;
  /** Glass-unit origin of the plan's bounding box. */
  ox: number;
  oy: number;
  /** The glass-unit box the plan occupies. */
  gw: number;
  gh: number;
  toPx: (p: Pt) => Pt;
  toM: (p: Pt) => Pt;
};

/** Fit the room's bounding box (plus a margin in metres) into a glass box of
 *  (gw, gh) with `pad` points of frame, keeping the metre scale square. */
export function planTransform(b: Bounds, gw: number, gh: number, pad = 14, marginM = 0.35): PlanTransform {
  const spanX = Math.max(0.5, b.width + marginM * 2);
  const spanY = Math.max(0.5, b.length + marginM * 2);
  const innerW = Math.max(20, gw - pad * 2);
  const innerH = Math.max(20, gh - pad * 2);
  const k = Math.min(innerW / spanX, innerH / spanY);
  const drawW = spanX * k;
  const drawH = spanY * k;
  const ox = (gw - drawW) / 2 + marginM * k - b.minX * k;
  const oy = (gh - drawH) / 2 + marginM * k - b.minY * k;
  return {
    k,
    ox,
    oy,
    gw,
    gh,
    toPx: (p) => ({ x: ox + p.x * k, y: oy + p.y * k }),
    toM: (p) => ({ x: (p.x - ox) / k, y: (p.y - oy) / k }),
  };
}

/** A touch in BOX pixels → glass units, given the stage scale. The inverse
 *  of the viewBox: at 1× the two are equal; at 2× a 200-px offset is 100
 *  glass units. */
export function touchToGlass(px: number, py: number, scale: number): Pt {
  const s = scale > 0 ? scale : 1;
  return { x: px / s, y: py / s };
}

/** Side-elevation transform: the room's LENGTH (plan y) runs left → right,
 *  height runs up. Same square-metre scale rule. */
export function sideTransform(length: number, height: number, gw: number, gh: number, pad = 14, marginM = 0.3): PlanTransform {
  const spanX = Math.max(0.5, length + marginM * 2);
  const spanY = Math.max(0.5, height + marginM * 2);
  const innerW = Math.max(20, gw - pad * 2);
  const innerH = Math.max(20, gh - pad * 2);
  const k = Math.min(innerW / spanX, innerH / spanY);
  const drawW = spanX * k;
  const drawH = spanY * k;
  const ox = (gw - drawW) / 2 + marginM * k;
  // z = 0 (the floor) sits at the bottom of the drawing.
  const floorY = (gh + drawH) / 2 - marginM * k;
  return {
    k,
    ox,
    oy: floorY,
    gw,
    gh,
    // p.x = position along the length (metres), p.y = height above the floor.
    toPx: (p) => ({ x: ox + p.x * k, y: floorY - p.y * k }),
    toM: (p) => ({ x: (p.x - ox) / k, y: (floorY - p.y) / k }),
  };
}

/** The nearest handle within `radius` glass units, or null. */
export function pickHandle<T extends { id: string; px: number; py: number; r?: number }>(handles: readonly T[], gx: number, gy: number, radius = 22): T | null {
  let best: T | null = null;
  let bestD = Infinity;
  for (const h of handles) {
    const d = Math.hypot(h.px - gx, h.py - gy);
    const lim = h.r ?? radius;
    if (d <= lim && d < bestD) {
      bestD = d;
      best = h;
    }
  }
  return best;
}
