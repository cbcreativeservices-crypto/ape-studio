/**
 * planLabels — the Room Design plan's labels keep out of each other's way
 * (emulator follow-up 2026-10-15, Room Design M3).
 *
 * Each label used to choose its spot alone, against the drawing it belongs
 * to, so two labels could land on one spot: with FRONT at max the
 * "NEARFIELD · 1.89 m ?" / "NO TRIANGLE" pair went above the head and sat on
 * the DESK label and the "4.00 m" width; a short side leader put "62 cm" on
 * the rotated "5.00 m" length ("62 c8m"); after SPREAD the L cabinet stood on
 * the DESK label.
 *
 * Now every movable label offers its spots in order of preference and takes
 * the first one that is on the glass and clear of everything already placed
 * (the fixed dimension labels, the cabinets and the head first). When no spot
 * is clear it takes the one that overlaps least: A LABEL YIELDS ITS POSITION,
 * NEVER ITS NUMBER — nothing is hidden to make room.
 *
 * Pure (no React Native), so it is tested directly.
 */

export type Box = { x0: number; y0: number; x1: number; y1: number };
export type Anchor = 'start' | 'middle' | 'end';

/** Advance per character as a fraction of the font size. Mono matches the
 *  BoundaryLines estimate (0.62); the condensed caps face is narrower, 0.56
 *  is a safe upper bound for its capitals and digits. */
export const MONO_W = 0.62;
export const CAPS_W = 0.56;

/** The ink box of one line of SVG text whose BASELINE is at y. */
export function textBox(x: number, y: number, text: string, fs: number, anchor: Anchor, charW: number = MONO_W): Box {
  const w = text.length * fs * charW;
  const x0 = anchor === 'start' ? x : anchor === 'end' ? x - w : x - w / 2;
  return { x0, y0: y - fs * 0.8, x1: x0 + w, y1: y + fs * 0.22 };
}

/** A square box around a point (a cabinet, the head). */
export function boxAround(cx: number, cy: number, half: number): Box {
  return { x0: cx - half, y0: cy - half, x1: cx + half, y1: cy + half };
}

/** Overlap area of two boxes, each grown by `pad` (0 when they are clear). */
export function overlapArea(a: Box, b: Box, pad = 1): number {
  const w = Math.min(a.x1 + pad, b.x1 + pad) - Math.max(a.x0 - pad, b.x0 - pad);
  const h = Math.min(a.y1 + pad, b.y1 + pad) - Math.max(a.y0 - pad, b.y0 - pad);
  return w > 0 && h > 0 ? w * h : 0;
}

/** How much of a box lies off a gw × gh glass (area), 0 when fully on it. */
export function offGlass(b: Box, gw: number, gh: number): number {
  const w = b.x1 - b.x0;
  const h = b.y1 - b.y0;
  const cw = Math.max(0, Math.min(b.x1, gw) - Math.max(b.x0, 0));
  const ch = Math.max(0, Math.min(b.y1, gh) - Math.max(b.y0, 0));
  return w * h - cw * ch;
}

/** The clash cost of a spot made of one or more boxes: overlap with every
 *  taken box, and anything off the glass counted heavier (a cropped number
 *  is worse than a touching one). */
export function spotCost(boxes: readonly Box[], taken: readonly Box[], gw: number, gh: number): number {
  let c = 0;
  for (const b of boxes) {
    c += offGlass(b, gw, gh) * 4;
    for (const t of taken) c += overlapArea(b, t);
  }
  return c;
}

/**
 * The first candidate whose boxes are all clear and on the glass; failing
 * that, the cheapest one (ties go to the earlier, preferred spot). Never
 * returns null for a non-empty list — a label is always drawn.
 */
export function pickSpot<T extends { boxes: readonly Box[] }>(cands: readonly T[], taken: readonly Box[], gw: number, gh: number): T {
  let best = cands[0];
  let bestCost = Infinity;
  for (const c of cands) {
    const cost = spotCost(c.boxes, taken, gw, gh);
    if (cost === 0) return c;
    if (cost < bestCost) {
      best = c;
      bestCost = cost;
    }
  }
  return best;
}
