/**
 * Scene LABEL layout (pure; no React Native, so the tests reach it): the
 * width a label is given, and which labels fit side by side at the fit scale.
 */
import type { ViewXform } from '../geometry/frame.ts';

export function labelWidth(text: string, scale: number, maxX: number): number {
  return Math.min(maxX - 4, Math.ceil(text.length * 9.5 * scale * 0.56) + 6);
}

/**
 * Keep only labels that do not collide at the FIT scale (in the art's order,
 * so the heads win): a small glass — a landscape phone, the side-by-side full
 * screen — drew "BATTER HEAD" over "FRONT HEAD". Zooming in only spreads the
 * survivors apart. Pure.
 */
export function fitLabels<T extends { u: number; v: number; text: string; short?: string; align: 'left' | 'center' | 'right' }>(labels: T[], xf: ViewXform, scale: number, maxX: number, avoid?: { x0: number; x1: number; y0: number; y1: number }): T[] {
  const h = 9.5 * scale * 1.25;
  // `avoid` (the glass's inset of the other view) counts as already taken: a
  // label that would run under it takes its short form, or is dropped.
  const kept: { x0: number; x1: number; y0: number; y1: number }[] = avoid ? [avoid] : [];
  const out: T[] = [];
  const rectOf = (l: T, text: string) => {
    const W = labelWidth(text, scale, maxX);
    const x = xf.ox + l.u * xf.s;
    const left = Math.max(2, Math.min(maxX - W - 2, l.align === 'left' ? x : l.align === 'right' ? x - W : x - W / 2));
    const top = xf.oy + l.v * xf.s - 7 * scale;
    return { x0: left, x1: left + W, y0: top, y1: top + h };
  };
  const clear = (r: { x0: number; x1: number; y0: number; y1: number }) => !kept.some((k) => r.x0 < k.x1 - 2 && r.x1 > k.x0 + 2 && r.y0 < k.y1 - 1 && r.y1 > k.y0 + 1);
  for (const l of labels) {
    // The full words if they fit, else the label's short form, else nothing.
    for (const text of l.short ? [l.text, l.short] : [l.text]) {
      const r = rectOf(l, text);
      if (!clear(r)) continue;
      kept.push(r);
      out.push(text === l.text ? l : { ...l, text });
      break;
    }
  }
  return out;
}
