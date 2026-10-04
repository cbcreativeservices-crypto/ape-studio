/**
 * The two VIEWS of one 3-D model (blueprint §4.2). Pure; worklets.
 *
 *   view  camera                                   screen x     screen y   edits
 *   side  on the player's right, looking toward −z  ox + x·s     oy + y·s   x, y, el
 *   top   above, looking down +y                    ox + x·s     oy + z·s   x, z, az
 *
 * Both views read the SAME Vec3, and x maps to screen x the same way in both
 * (one `s` and one `ox` shared by `fitPair`), so stacked views line up on x.
 * A finger delta of Δpx maps to Δpx / s mm at any zoom (`unprojectDelta`).
 */
import type { Vec3, ViewBox, ViewId } from '../model/types.ts';

export type ViewXform = { view: ViewId; s: number; ox: number; oy: number };

/** The second screen axis's model coordinate for a view. */
export function vOf(view: ViewId, p: Vec3): number {
  'worklet';
  return view === 'side' ? p.y : p.z;
}

export function project(xf: ViewXform, p: Vec3): { sx: number; sy: number } {
  'worklet';
  return { sx: xf.ox + p.x * xf.s, sy: xf.oy + (xf.view === 'side' ? p.y : p.z) * xf.s };
}

/** Screen point → model (u, v) for the view (v = y for side, z for top). */
export function unproject(xf: ViewXform, sx: number, sy: number): { u: number; v: number } {
  'worklet';
  return { u: (sx - xf.ox) / xf.s, v: (sy - xf.oy) / xf.s };
}

/** A screen delta as a model delta: only the two axes this view edits. */
export function unprojectDelta(xf: ViewXform, dsx: number, dsy: number): Vec3 {
  'worklet';
  const dx = dsx / xf.s;
  const dv = dsy / xf.s;
  return xf.view === 'side' ? { x: dx, y: dv, z: 0 } : { x: dx, y: 0, z: dv };
}

/** Fit one view box into (w, h) with `pad` px on each side, centred. */
export function fitXform(view: ViewId, box: ViewBox, w: number, h: number, pad: number): ViewXform {
  const bw = box.u1 - box.u0;
  const bh = box.v1 - box.v0;
  const s = Math.max(1e-6, Math.min((w - 2 * pad) / bw, (h - 2 * pad) / bh));
  const ox = w / 2 - ((box.u0 + box.u1) / 2) * s;
  const oy = h / 2 - ((box.v0 + box.v1) / 2) * s;
  return { view, s, ox, oy };
}

/** Side over top, ONE `s` and ONE `ox`, each view in its own (w, h) band. */
export function fitPair(side: ViewBox, top: ViewBox, w: number, hSide: number, hTop: number, pad: number): { side: ViewXform; top: ViewXform } {
  const a = fitXform('side', side, w, hSide, pad);
  const b = fitXform('top', top, w, hTop, pad);
  const s = Math.min(a.s, b.s);
  const ox = w / 2 - ((side.u0 + side.u1) / 2) * s;
  return {
    side: { view: 'side', s, ox, oy: hSide / 2 - ((side.v0 + side.v1) / 2) * s },
    top: { view: 'top', s, ox, oy: hTop / 2 - ((top.v0 + top.v1) / 2) * s },
  };
}

/** A pinch zoom of `k` about the screen point (fx, fy), plus a pan (dx, dy). */
export function zoomAbout(xf: ViewXform, k: number, fx: number, fy: number, dx = 0, dy = 0): ViewXform {
  'worklet';
  return { view: xf.view, s: xf.s * k, ox: fx + (xf.ox - fx) * k + dx, oy: fy + (xf.oy - fy) * k + dy };
}

/** The drawing's aspect for a view box (w ÷ h). */
export function boxAspect(box: ViewBox): number {
  return (box.u1 - box.u0) / (box.v1 - box.v0);
}
