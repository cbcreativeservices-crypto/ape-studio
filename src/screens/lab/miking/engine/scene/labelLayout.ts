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

export type LabelRect = { x0: number; x1: number; y0: number; y1: number };
type Placed = { u: number; v: number; text: string; align: 'left' | 'center' | 'right' };

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
 */
export function fitLabels<T extends Placed & { short?: string }>(labels: T[], xf: ViewXform, scale: number, maxX: number, avoid?: LabelRect): T[] {
  // `avoid` (the glass's inset of the other view) counts as already taken: a
  // label that would run under it takes its short form, or is dropped.
  const kept: LabelRect[] = avoid ? [avoid] : [];
  const out: T[] = [];
  const clear = (r: LabelRect) => !kept.some((k) => r.x0 < k.x1 - 2 && r.x1 > k.x0 + 2 && r.y0 < k.y1 - 1 && r.y1 > k.y0 + 1);
  for (const l of labels) {
    // The full words if they fit, else the label's short form, else nothing.
    for (const text of l.short ? [l.text, l.short] : [l.text]) {
      const r = labelRect(l, xf, scale, maxX, text);
      if (!clear(r)) continue;
      kept.push(r);
      out.push(text === l.text ? l : { ...l, text });
      break;
    }
  }
  return out;
}
