/**
 * dockFit — the pure half of a dock key's shrink-to-fit (owner 2026-10-19:
 * "shrink cut-off dock words at 320 px to fit (9 pt minimum) in the shared
 * dock").
 *
 * At a narrow width a key's label or value used to end in "…" ("STOPP…",
 * "PLATTE…", "DJ2 OUT" cut). DockButton measures each line's natural width
 * at its authored size and the key's inner width, and this picks the size
 * to draw it at:
 *
 *   - it fits today      → the authored size, exactly (nothing changes at 390);
 *   - it fits at ≥ 9 pt  → the largest size (0.1 pt steps) that fits;
 *   - not even at 9 pt   → null: the caller keeps the old behaviour.
 *
 * `fixed` is the part of the line that does NOT scale: the ▪ / ▸ verb glyph
 * stays at 12 (it is load-bearing). The rest (glyphs and letter-spacing)
 * scales with the font, so the width is linear in the size.
 */
import { MIN_DISPLAY_PT } from '../../../theme/legibility.ts';

/** Measured widths are fractional; a line within half a pixel already fits. */
export const FIT_SLACK_PX = 0.5;
/** Margin on a shrunk line. None is needed: the size is floored to 0.1 pt,
 *  which already leaves the line a little short of the key (measured in the
 *  web preview at 320: "ATK/REL ▸" at 9 pt, uncut). */
export const FIT_MARGIN_PX = 0;

export function dockFitSize(base: number, natural: number, avail: number, fixed = 0): number | null {
  // Not measured yet (or nothing to draw): the authored size, as today.
  if (!(natural > 0) || !(avail > 0) || !(base > 0)) return base;
  if (natural + fixed <= avail + FIT_SLACK_PX) return base;
  const room = avail - fixed - FIT_MARGIN_PX;
  if (!(room > 0)) return null;
  const fs = Math.floor(((base * room) / natural) * 10) / 10;
  if (fs >= base) return base;
  return fs >= MIN_DISPLAY_PT ? fs : null;
}

/** A key label's size, and how to draw it. `today` is the line as drawn
 *  now (the label, then " ▸" in the 12-pt glyph font). When it must shrink:
 *   1. the label alone, when it has no glyph;
 *   2. TIGHT: the space before the glyph moves into the label's own font and
 *      size (`spaced` = label + " " there; `spacedGlyph` = that + the bare
 *      glyph) — the 12-pt space alone is ~3 px of a 46-px key at 320 wide;
 *   3. tight and UNTRACKED: the label's letter-spacing (`trackPx` in all,
 *      at the authored size) let go too — "PREDICT ▸" needs it at 320.
 *  Not even 9 pt fits → today's line (`fs` = base, nothing changes). */
export type DockLabelFit = { fs: number; tight: boolean; tracked: boolean };
export function dockLabelFit(base: number, today: number, avail: number, spaced = 0, spacedGlyph = 0, trackPx = 0): DockLabelFit {
  const plain = dockFitSize(base, today, avail);
  const asToday: DockLabelFit = { fs: base, tight: false, tracked: true };
  if (plain === base) return asToday; // fits today, or not measured yet
  if (!(spaced > 0) || !(spacedGlyph > spaced)) return plain == null ? asToday : { fs: plain, tight: false, tracked: true };
  const glyph = spacedGlyph - spaced;
  const fs = dockFitSize(base, spaced, avail, glyph);
  if (fs != null) return { fs, tight: true, tracked: true };
  const bare = spaced - trackPx;
  const fs2 = trackPx > 0 && bare > 0 ? dockFitSize(base, bare, avail, glyph) : null;
  return fs2 == null ? asToday : { fs: fs2, tight: true, tracked: false };
}
