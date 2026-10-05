/**
 * Scene LABEL layout (pure; no React Native, so the tests reach it): the
 * width a label is given, and which labels fit side by side at the fit scale.
 */
import type { ViewXform } from '../geometry/frame.ts';

export function labelWidth(text: string, scale: number, maxX: number): number {
  return Math.min(maxX - 4, Math.ceil(text.length * 9.5 * scale * 0.56) + 6);
}

type Align = 'left' | 'center' | 'right';
type PxRect = { x0: number; x1: number; y0: number; y1: number };
/** Another place a label may sit (mm of the view), tried in order. */
export type LabelPlace = { u: number; v: number; align: Align };

/**
 * Keep only labels that do not collide at the FIT scale (in the art's order,
 * so the heads win): a small glass — a landscape phone, the side-by-side full
 * screen — drew "BATTER HEAD" over "FRONT HEAD". Zooming in only spreads the
 * survivors apart. Pure.
 *
 * COLLISION-AWARE PLACEMENT (strings art pass 2026-10-05; opt-in, so a label
 * with neither changes nothing):
 *   • `obstacles` (px) — the recommended starting points' boxes a lesson asks
 *     its labels to keep off — count as already taken, like `avoid`;
 *   • a label's `alts` are other places it may sit, tried after its own
 *     place: the FULL words anywhere come before the short form, the short
 *     form anywhere before dropping the label;
 *   • a label with `at` (its part's point) that ends up away from that point
 *     comes back with `leader` = `at`, so the scene can draw a thin line to it.
 */
export function fitLabels<T extends { u: number; v: number; text: string; short?: string; align: Align; alts?: readonly LabelPlace[]; at?: { u: number; v: number } }>(
  labels: T[],
  xf: ViewXform,
  scale: number,
  maxX: number,
  avoid?: PxRect,
  obstacles?: readonly PxRect[],
): (T & { leader?: { u: number; v: number } })[] {
  const h = 9.5 * scale * 1.25;
  // `avoid` (the glass's inset of the other view) counts as already taken: a
  // label that would run under it takes its short form, or is dropped.
  const kept: PxRect[] = [...(avoid ? [avoid] : []), ...(obstacles ?? [])];
  const out: (T & { leader?: { u: number; v: number } })[] = [];
  const rectOf = (p: LabelPlace, text: string): PxRect => {
    const W = labelWidth(text, scale, maxX);
    const x = xf.ox + p.u * xf.s;
    const left = Math.max(2, Math.min(maxX - W - 2, p.align === 'left' ? x : p.align === 'right' ? x - W : x - W / 2));
    const top = xf.oy + p.v * xf.s - 7 * scale;
    return { x0: left, x1: left + W, y0: top, y1: top + h };
  };
  const clear = (r: PxRect) => !kept.some((k) => r.x0 < k.x1 - 2 && r.x1 > k.x0 + 2 && r.y0 < k.y1 - 1 && r.y1 > k.y0 + 1);
  for (const l of labels) {
    const places: LabelPlace[] = [{ u: l.u, v: l.v, align: l.align }, ...(l.alts ?? [])];
    const texts = l.short ? [l.text, l.short] : [l.text];
    let done = false;
    for (const text of texts) {
      for (let i = 0; i < places.length && !done; i++) {
        const p = places[i];
        const r = rectOf(p, text);
        if (!clear(r)) continue;
        kept.push(r);
        done = true;
        let leader: { u: number; v: number } | undefined;
        if (l.at) {
          const ax = xf.ox + l.at.u * xf.s;
          const ay = xf.oy + l.at.v * xf.s;
          const near = ax >= r.x0 - 6 && ax <= r.x1 + 6 && ay >= r.y0 - 6 && ay <= r.y1 + 6;
          if (!near) leader = l.at;
        }
        if (i === 0 && text === l.text && !leader) out.push(l);
        else out.push({ ...l, text, u: p.u, v: p.v, align: p.align, ...(leader ? { leader } : {}) });
      }
      if (done) break;
    }
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
