/**
 * Scene LABEL layout (pure; no React Native, so the tests reach it): the
 * width a label is given, which labels fit side by side at the fit scale,
 * and the LEADER line from a label that sits clear of the instrument back to
 * the part it names (owner 2026-10-05: labels never sit on the instrument).
 */
import type { ViewXform } from '../geometry/frame.ts';

export function labelWidth(text: string, scale: number, maxX: number): number {
  return Math.min(maxX - 4, Math.ceil(text.length * 9.5 * scale * 0.56) + 6);
}

type Align = 'left' | 'center' | 'right';
type PxRect = { x0: number; x1: number; y0: number; y1: number };
/** Another place a label may sit (mm of the view), tried in order. */
export type LabelPlace = { u: number; v: number; align: Align };
export type LabelRect = PxRect;
type Placed = { u: number; v: number; text: string; align: Align };


/** The screen box a label's text occupies (the same box the scenes draw). */
export function labelRect(l: Placed, xf: ViewXform, scale: number, maxX: number, text = l.text): LabelRect {
  const W = labelWidth(text, scale, maxX);
  const h = 9.5 * scale * 1.25;
  const x = xf.ox + l.u * xf.s;
  const left = Math.max(2, Math.min(maxX - W - 2, l.align === 'left' ? x : l.align === 'right' ? x - W : x - W / 2));
  const top = xf.oy + l.v * xf.s - 7 * scale;
  return { x0: left, x1: left + W, y0: top, y1: top + h };
}

/**
 * A leader runs from the part (`lead`, model u/v) to the nearest edge of the
 * label's box, stopping 2 px short of the text. Screen coordinates; null when
 * the part sits under or right beside the box (no line is needed).
 */
export function leaderLine(r: LabelRect, xf: ViewXform, lead: { u: number; v: number }): { x1: number; y1: number; x2: number; y2: number } | null {
  const ax = xf.ox + lead.u * xf.s;
  const ay = xf.oy + lead.v * xf.s;
  const bx = Math.max(r.x0 - 2, Math.min(r.x1 + 2, ax));
  const by = Math.max(r.y0 - 2, Math.min(r.y1 + 2, ay));
  if (Math.hypot(ax - bx, ay - by) < 6) return null;
  return { x1: ax, y1: ay, x2: bx, y2: by };
}

/**
 * Keep only labels that do not collide at the FIT scale (in the art's order,
 * so the heads win): a small glass — a landscape phone, the side-by-side full
 * screen — drew "BATTER HEAD" over "FRONT HEAD". Zooming in only spreads the
 * survivors apart. Pure.
 *
 * COLLISION-AWARE PLACEMENT (strings art pass 2026-10-05; opt-in, so a label
 * with neither changes nothing):
 *   • `obstacles` (px) — the suggested starting points' boxes a lesson asks
 *     its labels to keep off — count as already taken, like `avoid`;
 *   • a label's `alts` are other places it may sit, tried after its own
 *     place: the FULL words anywhere come before the short form, the short
 *     form anywhere before dropping the label;
 *   • a label with `at` (its part's point) that ends up away from that point
 *     comes back with `leader` = `at`, so the scene can draw a thin line to it.
 */
/**
 * LEVEL OF DETAIL (owner, Pixel 2026-10-06: "many of the text details cover
 * up objects below or stack on top of each other. Maybe the finest details
 * aren't shown until the image is zoomed in enough."). Opt-in by `clearOf`:
 *
 *   • a label is kept only where its box is clear of the DRAWING (`clearOf`,
 *     the art's own hit test as an occupancy grid — artLabels.ts) as well as
 *     of every label already kept, and wholly on the glass (minY..maxY);
 *   • if neither its own place nor an `alts` place is clear, it is placed in
 *     the nearest FREE SPACE round its part — rings of candidate spots, then
 *     the glass's side margins — with a leader back to the part;
 *   • labels are placed in the art's order (or by `priority`, 1 = a primary
 *     part name, 2 = secondary, 3 = fine detail): a label that finds no clear
 *     spot at this scale is left out — at a closer zoom the drawing is larger
 *     than the words, more spots are clear, and the finer names appear.
 * Without `clearOf` the layout is exactly the previous one.
 */
/** Points of clear space a level-of-detail label keeps round its words. */
export const LABEL_AIR = 3;

export type LabelOpts = {
  /** True when the model rectangle (mm) holds no drawn part. */
  clearOf?: (u0: number, v0: number, u1: number, v1: number) => boolean;
  /** The glass's usable band (px): labels sit wholly inside it. */
  minY?: number;
  maxY?: number;
};

type Seg = { x1: number; y1: number; x2: number; y2: number };
/** Two leader lines cross (an end shared within 2 px does not count). Pure. */
export function segsCross(a: Seg, b: Seg): boolean {
  const near = (x1: number, y1: number, x2: number, y2: number) => Math.hypot(x1 - x2, y1 - y2) < 2;
  if (near(a.x1, a.y1, b.x1, b.y1) || near(a.x1, a.y1, b.x2, b.y2) || near(a.x2, a.y2, b.x1, b.y1) || near(a.x2, a.y2, b.x2, b.y2)) return false;
  const d = (px: number, py: number, qx: number, qy: number, rx: number, ry: number) => (qx - px) * (ry - py) - (qy - py) * (rx - px);
  const d1 = d(b.x1, b.y1, b.x2, b.y2, a.x1, a.y1);
  const d2 = d(b.x1, b.y1, b.x2, b.y2, a.x2, a.y2);
  const d3 = d(a.x1, a.y1, a.x2, a.y2, b.x1, b.y1);
  const d4 = d(a.x1, a.y1, a.x2, a.y2, b.x2, b.y2);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}
/** A leader line runs through a label's box (sampled; pure). */
export function segHitsRect(sg: Seg, r: PxRect): boolean {
  const n = Math.max(2, Math.ceil(Math.hypot(sg.x2 - sg.x1, sg.y2 - sg.y1) / 2));
  for (let i = 0; i <= n; i++) {
    const x = sg.x1 + ((sg.x2 - sg.x1) * i) / n;
    const y = sg.y1 + ((sg.y2 - sg.y1) * i) / n;
    if (x > r.x0 + 1 && x < r.x1 - 1 && y > r.y0 + 1 && y < r.y1 - 1) return true;
  }
  return false;
}

type Fit = { u: number; v: number; text: string; short?: string; align: Align; alts?: readonly LabelPlace[]; at?: { u: number; v: number }; lead?: { u: number; v: number }; point?: { u: number; v: number }; priority?: 1 | 2 | 3 };

export function fitLabels<T extends Fit>(
  labels: T[],
  xf: ViewXform,
  scale: number,
  maxX: number,
  avoid?: PxRect,
  obstacles?: readonly PxRect[],
  opts: LabelOpts = {},
): (T & { leader?: { u: number; v: number } })[] {
  const h = 9.5 * scale * 1.25;
  // `avoid` (the glass's inset of the other view) counts as already taken: a
  // label that would run under it takes its short form, or is dropped.
  const kept: PxRect[] = [...(avoid ? [avoid] : []), ...(obstacles ?? [])];
  const out: (T & { leader?: { u: number; v: number } })[] = [];
  // Owner decision X6 (2026-10-08): in the level-of-detail layout no leader
  // crosses another leader or runs through another label's words, and no
  // label sits on a leader already drawn (B11's crossing lines, B17's U3 / D).
  const labelRects: PxRect[] = [];
  const segs: Seg[] = [];
  const rectOf = (p: LabelPlace, text: string): PxRect => {
    const W = labelWidth(text, scale, maxX);
    const x = xf.ox + p.u * xf.s;
    const left = Math.max(2, Math.min(maxX - W - 2, p.align === 'left' ? x : p.align === 'right' ? x - W : x - W / 2));
    const top = xf.oy + p.v * xf.s - 7 * scale;
    return { x0: left, x1: left + W, y0: top, y1: top + h };
  };
  const { clearOf } = opts;
  const lod = !!clearOf;
  const minY = opts.minY ?? -Infinity;
  const maxY = opts.maxY ?? Infinity;
  const clear = (r: PxRect) => {
    if (kept.some((k) => r.x0 < k.x1 - 2 && r.x1 > k.x0 + 2 && r.y0 < k.y1 - 1 && r.y1 > k.y0 + 1)) return false;
    if (!lod) return true;
    if (r.y0 < minY || r.y1 > maxY) return false;
    // The words' own box, in mm, must hold no drawn part — with a few points
    // of air round it, so a label never sits flush against an edge.
    const m = LABEL_AIR;
    return clearOf!((r.x0 - m - xf.ox) / xf.s, (r.y0 - m - xf.oy) / xf.s, (r.x1 + m - xf.ox) / xf.s, (r.y1 + m - xf.oy) / xf.s);
  };
  // Free-space candidates round a part's point (px → a place in mm).
  const around = (ax: number, ay: number): LabelPlace[] => {
    const P = (x: number, y: number, align: Align): LabelPlace => ({ u: (x - xf.ox) / xf.s, v: (y + 7 * scale - h / 2 - xf.oy) / xf.s, align });
    const res: LabelPlace[] = [];
    // Rings out to half the glass (a larger drawing pushes free space further
    // from the part in px).
    const reach = Math.max(h * 7, 0.5 * Math.max(maxX, Number.isFinite(maxY) ? maxY : 0));
    const rings = [1.1, 2, 3.2, 4.8, 7, 10, 14, 20, 28].map((k) => h * k).filter((d, i) => i < 5 || d <= reach);
    for (const d of rings) {
      const k = d * 0.75;
      res.push(P(ax + d, ay, 'left'), P(ax - d, ay, 'right'), P(ax, ay - d, 'center'), P(ax, ay + d, 'center'));
      res.push(P(ax + k, ay - k, 'left'), P(ax - k, ay - k, 'right'), P(ax + k, ay + k, 'left'), P(ax - k, ay + k, 'right'));
    }
    // The glass's margins, level with the part and a row either side.
    for (const dy of [0, -h * 1.4, h * 1.4, -h * 2.8, h * 2.8]) res.push(P(4, ay + dy, 'left'), P(maxX - 4, ay + dy, 'right'));
    return res;
  };
  const order = labels.map((l, i) => ({ l, i })).sort((a, b) => (a.l.priority ?? 2) - (b.l.priority ?? 2) || a.i - b.i);
  const placed = new Map<number, T & { leader?: { u: number; v: number } }>();
  for (const { l, i: idx } of order) {
    const places: LabelPlace[] = [{ u: l.u, v: l.v, align: l.align }, ...(l.alts ?? [])];
    const texts = l.short ? [l.text, l.short] : [l.text];
    // `lead` (the Lab 4 review's name) is the same as `at`.
    const at = l.at ?? l.lead;
    let done = false;
    // A clean place first (no crossing); failing that, the place the layout
    // found before this rule, so no label is lost to it (zooming in never
    // shows fewer).
    let strict = lod;
    const take = (p: LabelPlace, text: string, own: boolean) => {
      const r = rectOf(p, text);
      if (!clear(r)) return false;
      let leader: { u: number; v: number } | undefined;
      // A label set away from its part points back to it: to `at`, or (in
      // free space) to where the art wrote it, which names the part.
      const anchor = at ?? (lod && !own ? l.point ?? { u: l.u, v: l.v } : undefined);
      if (anchor) {
        const ax = xf.ox + anchor.u * xf.s;
        const ay = xf.oy + anchor.v * xf.s;
        const near = ax >= r.x0 - 6 && ax <= r.x1 + 6 && ay >= r.y0 - 6 && ay <= r.y1 + 6;
        // No leader to a point off the glass (it would run off the edge).
        const onGlass = !lod || (ax >= 0 && ax <= maxX && ay >= Math.max(0, minY) && ay <= maxY);
        if (!near && onGlass) leader = anchor;
      }
      if (lod) {
        if (strict && segs.some((sg) => segHitsRect(sg, r))) return false;
        const line = leader ? leaderLine(r, xf, leader) : null;
        if (strict && line && (segs.some((sg) => segsCross(sg, line)) || labelRects.some((k) => segHitsRect(line, k)))) return false;
        if (line) segs.push(line);
      }
      kept.push(r);
      labelRects.push(r);
      if (own && p === places[0] && text === l.text && !leader) placed.set(idx, l);
      else placed.set(idx, { ...l, text, u: p.u, v: p.v, align: p.align, ...(leader ? { leader } : {}) });
      return true;
    };
    for (const pass of lod ? [true, false] : [false]) {
    if (done) break;
    strict = pass;
    for (const text of texts) {
      for (let i = 0; i < places.length && !done; i++) done = take(places[i], text, true);
      if (done) break;
    }
    if (!done && lod) {
      const a = at ?? l.point ?? { u: l.u, v: l.v };
      // A point off the glass (a pointer label at the drawing's edge, "←
      // PLAYER") is searched from the nearest point on the glass.
      const ax = Math.max(4, Math.min(maxX - 4, xf.ox + a.u * xf.s));
      const ay = Math.max(Number.isFinite(minY) ? minY + h : h, Math.min(Number.isFinite(maxY) ? maxY - h : Infinity, xf.oy + a.v * xf.s));
      const cands = around(ax, ay);
      for (const text of texts) {
        for (let i = 0; i < cands.length && !done; i++) done = take(cands[i], text, false);
        if (done) break;
      }
    }
    }
  }
  // Back in the art's order (the scenes draw them in that order).
  for (let i = 0; i < labels.length; i++) {
    const p = placed.get(i);
    if (p) out.push(p);
  }
  return out;
}

/**
 * Which right-hand corner the glass's inset of the other view takes: the
 * preferred one unless it would cover the model's keep-clear rectangle (mm;
 * the guitars' headstock and tuners) at this transform — then the other, or
 * whichever covers less. Pure.
 */
export function chooseInsetCorner(keep: { u0: number; u1: number; v0: number; v1: number } | undefined, xf: ViewXform, rects: { top: PxRect; bottom: PxRect }, prefer: 'top' | 'bottom'): 'top' | 'bottom' {
  if (!keep) return prefer;
  const k = { x0: xf.ox + keep.u0 * xf.s, x1: xf.ox + keep.u1 * xf.s, y0: xf.oy + keep.v0 * xf.s, y1: xf.oy + keep.v1 * xf.s };
  const area = (r: PxRect) => Math.max(0, Math.min(r.x1, k.x1) - Math.max(r.x0, k.x0)) * Math.max(0, Math.min(r.y1, k.y1) - Math.max(r.y0, k.y0));
  const other = prefer === 'top' ? 'bottom' : 'top';
  const a = area(rects[prefer]);
  if (a === 0) return prefer;
  return area(rects[other]) < a ? other : prefer;
}

/** Where a label's leader meets its box (px): the box edge point nearest the
 *  part, so the line runs from the part to the words and stops there. */
export function leaderEnd(box: PxRect, ax: number, ay: number): { x: number; y: number } {
  return { x: Math.max(box.x0, Math.min(box.x1, ax)), y: Math.max(box.y0, Math.min(box.y1, ay)) };
}
