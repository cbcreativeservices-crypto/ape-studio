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
 *     zooms ONLY its gear, opening on the part the learner last touched (or
 *     dragged to), else its `focus` part (or its first callout), and the
 *     learner drags the gear under the pinned plots.
 *
 * Pure (no React Native) apart from the context, so the geometry is tested.
 */
import { createContext } from 'react';

export type PanLimits = { minX: number; maxX: number; minY: number; maxY: number };

type Rect = { x: number; y: number; w: number; h: number };
type P = { x: number; y: number };
export type Anchor = { fx: number; fy: number };

/** What the Scene last drew, in the host's render coordinates (the window's
 *  when zoomed): its transform, the region its gear sits in, its frame, and
 *  the drag that transform includes. The host turns a touch into scene mm
 *  with it. */
export type SceneView = { xf: { s: number; ox: number; oy: number }; region: Rect; frame: Rect; pan: P };

/** The part (scene mm) the next zoom step opens on, and the frame it was
 *  read from (a different drawing on the same page ignores it). */
export type ZoomAt = P & { frame: Rect };

export type DjZoom = {
  /** The full-screen zoom step (1 on the glass and at 1×). */
  z: number;
  /** The learner's drag (screen points), relative to the opening camera. */
  pan: { x: number; y: number };
  /** The Scene reports how far the gear can be dragged (it knows its frame). */
  limits?: { current: PanLimits | null };
  /** The Scene reports what it drew (so the host can read a touch). */
  view?: { current: SceneView | null };
  /** The part the learner last touched or dragged to: the zoom opens there. */
  at?: ZoomAt | null;
};

export const DjZoomContext = createContext<DjZoom>({ z: 1, pan: { x: 0, y: 0 } });

/* ── one opening's memory across its zoom steps ───────────────────────── */

/**
 * The rack re-mounts the stage on every zoom step and keeps its touch ANCHOR
 * (where it scrolls to) for the whole opening; it forgets it only when the
 * full screen closes. The host must keep the same anchor, or its window
 * lands where the rack did not scroll (bug 2026-10-19: a tap or a 1× drag,
 * then 2× or 3×, showed black or a thin strip).
 *
 * Telling an opening from a step: a step's new host RENDERS while the old
 * one is still mounted (React runs the old one's cleanup only after the new
 * one has rendered — so a "time since the last unmount" test, the 10-18
 * build, always read a step as an opening and dropped the anchor). An
 * opening is the first render with NO host alive.
 */
export type ZoomCarry = { anchor: Anchor | null; at: ZoomAt | null };

export function createZoomMemory() {
  let alive = 0;
  let carry: ZoomCarry = { anchor: null, at: null };
  return {
    /** A host's first render: fresh at an opening, carried on a step. */
    begin(): ZoomCarry {
      if (alive === 0) carry = { anchor: null, at: null };
      return carry;
    },
    mounted(): void {
      alive += 1;
    },
    unmounted(): void {
      alive = Math.max(0, alive - 1);
    },
    touch(anchor: Anchor, at: ZoomAt | null): void {
      carry = { anchor, at: at ?? carry.at };
    },
    /** A drag ended: the next step opens on what the learner moved to. */
    dragged(at: ZoomAt | null): void {
      if (at) carry = { ...carry, at };
    },
    get(): ZoomCarry {
      return carry;
    },
  };
}

/** The scene point (mm) under the stage point `p` (render coordinates), or
 *  null when `p` is outside the gear's region (on a pinned plot). Clamped to
 *  the frame, so the opening always stays inside the drawing. */
export function scenePointAt(p: P, v: SceneView): ZoomAt | null {
  const r = v.region;
  if (!(p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h) || !(v.xf.s > 0)) return null;
  const f = v.frame;
  const x = Math.max(f.x, Math.min(f.x + f.w, (p.x - v.xf.ox) / v.xf.s));
  const y = Math.max(f.y, Math.min(f.y + f.h, (p.y - v.xf.oy) / v.xf.s));
  return { x, y, frame: { ...f } };
}

/** The scene point at the middle of the region once the drag `pan` (already
 *  clamped to the limits) is drawn — the Scene's transform moves one point
 *  per point of drag, so it is the drawn view shifted by the difference. */
export function regionCentreAt(v: SceneView, pan: P): ZoomAt | null {
  const xf = { s: v.xf.s, ox: v.xf.ox + (pan.x - v.pan.x), oy: v.xf.oy + (pan.y - v.pan.y) };
  return scenePointAt({ x: v.region.x + v.region.w / 2, y: v.region.y + v.region.h / 2 }, { ...v, xf });
}

/* ── the window, checked against where the rack really scrolled ────────── */

/**
 * The mirror above predicts the rack's scroll; the first step out of 1× can
 * still differ by a few points (the hint line shrinks, so the body and the
 * box grow around the moment the rack scrolls, and which size it used
 * depends on event order), and an opening the host cannot see (a close and a
 * re-open within the Modal's fade) keeps a stale anchor. So the host also
 * MEASURES: at 1× the box sits centred in the body's viewport — 8 in from
 * its left, 3 down from its top (the body is the box + (16, 8), with a 1 pt
 * border top and bottom) — which gives the viewport's place on the page; once
 * zoomed, the viewport's place minus the box's place is the real scroll.
 */
export type Viewport = { x: number; y: number; w1: number };

/** The viewport's page position from the 1× box's page position. */
export function viewportFrom1x(box: P, w1: number): Viewport {
  return { x: box.x - 8, y: box.y - 3, w1 };
}

/** The window offset that matches the real scroll, from the zoomed box's
 *  page position — null when the viewport was read at another layout (a
 *  different width: the phone turned), and null while the box still sits
 *  at the viewport's corner (the rack has not scrolled yet: a real scroll to
 *  the very corner is what the prediction already gives). Clamped inside
 *  the box. */
export function alignedWindow(vp: Viewport | null, box: P, boxW: number, boxH: number, z: number, win: { w: number; h: number }): P | null {
  if (!vp || !(vp.w1 > 0) || Math.abs(vp.w1 * z - boxW) > 3) return null;
  if (Math.abs(vp.x - box.x) < 0.5 && Math.abs(vp.y - box.y) < 0.5) return null;
  return {
    x: Math.max(0, Math.min(Math.max(0, boxW - win.w), vp.x - box.x)),
    y: Math.max(0, Math.min(Math.max(0, boxH - win.h), vp.y - box.y)),
  };
}

/** A measured offset kept inside the box as it grows or shrinks. */
export function keepInBox(at: P, boxW: number, boxH: number, win: { w: number; h: number }): P {
  return { x: Math.max(0, Math.min(Math.max(0, boxW - win.w), at.x)), y: Math.max(0, Math.min(Math.max(0, boxH - win.h), at.y)) };
}

/** Same frame (the carried part belongs to this drawing). */
export function sameFrame(a: Rect, b: Rect): boolean {
  return Math.abs(a.x - b.x) < 1e-6 && Math.abs(a.y - b.y) < 1e-6 && Math.abs(a.w - b.w) < 1e-6 && Math.abs(a.h - b.h) < 1e-6;
}

/** A touch at page point `t` on the host's root (page origin `o`, size
 *  `size`): the anchor fraction the rack reads from the same touch. */
export function anchorOf(t: P, o: P, size: { w: number; h: number }): Anchor | null {
  if (!(size.w > 0 && size.h > 0)) return null;
  return { fx: Math.max(0, Math.min(1, (t.x - o.x) / size.w)), fy: Math.max(0, Math.min(1, (t.y - o.y) / size.h)) };
}

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
 * The window for one zoom step as the box settles: the rack scrolls ONCE per
 * step, on the box's first size, and the body can grow afterwards (its hint
 * line shrinks to one line), which grows the box but not the scroll. So the
 * window keeps the offset of the step's first size (`first`) — never past
 * the box's far edge — and takes the new size.
 */
export function stepWindow(
  w: number,
  h: number,
  z: number,
  anchor: Anchor | null,
  first: { x: number; y: number } | null,
): { x: number; y: number; w: number; h: number; first: { x: number; y: number } } {
  const z0 = zoomWindow(w, h, z, anchor);
  const f = first ?? { x: z0.x, y: z0.y };
  return { ...z0, x: Math.min(f.x, Math.max(0, w - z0.w)), y: Math.min(f.y, Math.max(0, h - z0.h)), first: f };
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

/* ── a pinned side view that zooms inside its own panel ─────────────── */

/** FULL SCREEN zoom of a side view (polish 2026-10-19, grade round 1:
 *  "3x enlarges only the top view"): the drawing grows `zoom` times inside
 *  its own window, cut to it, centred on `focus` (drawing mm) and kept from
 *  showing past its edges; its words keep their size. Callers skip it at
 *  1× (the glass), so nothing there moves.
 *  Returns the drawing's origin (screen points). */
export function zoomedOrigin(win: Rect, s: number, focus: { x: number; y: number }, xRange: readonly [number, number], yRange: readonly [number, number] | null, ySign: 1 | -1) {
  // x: the focus at the window's centre, clamped to the drawing's ends
  let ox = win.x + win.w / 2 - focus.x * s;
  ox = Math.min(win.x - xRange[0] * s, Math.max(win.x + win.w - xRange[1] * s, ox));
  // y (ySign −1: the drawing's y runs UP): the focus at the centre, the top
  // edge never inside the window (the bottom runs on, cropped)
  let oy = win.y + win.h / 2 - ySign * focus.y * s;
  if (yRange) {
    const top = ySign === 1 ? yRange[0] : yRange[1];
    oy = Math.min(win.y - ySign * top * s, oy);
  }
  return { ox, oy };
}

/* ── READ: the full-screen step at which the printed words can be read ── */

/** The smallest PRINTED word on the DJ gear (mm): the 3.4 mm legends of the
 *  mixer, the players and the rear panels (owner 2026-10-19, option A). */
export const PRINTED_MIN_MM = 3.4;
/** A little over the exact factor, so the window the DJ host draws at READ
 *  (a few points off the 1× box) still puts the smallest word at 9 pt. */
export const READ_SAFETY = 1.04;

/** The zoom (× the full screen's 1×) at which a printed word `mm` tall,
 *  drawn at `s1` pt per mm at 1×, reaches `minPt` (sceneText draws nothing
 *  under 9 pt). */
export function readZoomFor(mm: number, s1: number, minPt = 9): number | null {
  if (!(mm > 0) || !(s1 > 0)) return null;
  return (minPt / (mm * s1)) * READ_SAFETY;
}
