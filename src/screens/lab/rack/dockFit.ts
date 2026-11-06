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
import type { DockParam } from './rackTypes';

/** Measured widths are fractional; a line within half a pixel already fits. */
export const FIT_SLACK_PX = 0.5;
/** Margin on a shrunk line in the pure sum. The size is floored to 0.1 pt, which
 *  usually leaves the line a little short of the key. */
export const FIT_MARGIN_PX = 0;
/** …but a label does not scale quite linearly, so a drawn key keeps this much:
 *  at 375 "POSITION ▸" at 10.6 pt measured 57.17 px in a 57 px key, at 11 pt
 *  58.94 in 58.58, and the overrun lost the verb glyph ("POSITION …"). Stays
 *  under dockKeyNeed's 1 px, so a key given its need still reaches 9 pt. */
export const LABEL_FIT_MARGIN_PX = 0.8;
/** …except on a value, whose mono digits do not scale quite linearly: at 320
 *  "≈ -10°" came to 11.8 pt, measured 38.23 px in a 38 px key, and the overrun
 *  of a quarter pixel drew it as "≈ -1…". */
export const VALUE_FIT_MARGIN_PX = 0.3;

export function dockFitSize(base: number, natural: number, avail: number, fixed = 0, margin = FIT_MARGIN_PX): number | null {
  // Not measured yet (or nothing to draw): the authored size, as today.
  if (!(natural > 0) || !(avail > 0) || !(base > 0)) return base;
  // With a margin the slack turns the other way: the web rounds a measure to a
  // whole pixel, and "MAKEUP ▸" at 375, 57.25 px measured as 57 in a 57 px key,
  // drew as "MAKEUP …".
  if (natural + fixed <= avail + (margin > 0 ? -FIT_SLACK_PX : FIT_SLACK_PX)) return base;
  const room = avail - fixed - margin;
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
export function dockLabelFit(base: number, today: number, avail: number, spaced = 0, spacedGlyph = 0, trackPx = 0, margin = FIT_MARGIN_PX): DockLabelFit {
  const plain = dockFitSize(base, today, avail, 0, margin);
  const asToday: DockLabelFit = { fs: base, tight: false, tracked: true };
  if (plain === base) return asToday; // fits today, or not measured yet
  if (!(spaced > 0) || !(spacedGlyph > spaced)) return plain == null ? asToday : { fs: plain, tight: false, tracked: true };
  const glyph = spacedGlyph - spaced;
  const fs = dockFitSize(base, spaced, avail, glyph, margin);
  if (fs != null) return { fs, tight: true, tracked: true };
  const bare = spaced - trackPx;
  const fs2 = trackPx > 0 && bare > 0 ? dockFitSize(base, bare, avail, glyph, margin) : null;
  return fs2 == null ? asToday : { fs: fs2, tight: true, tracked: false };
}

/** The gap between dock keys (RackUnit's strip); the tighter one is taken only
 *  when some key's words need the room. */
export const DOCK_KEY_GAP = 6;
export const DOCK_KEY_GAP_TIGHT = 4;

/**
 * THE KEY MAKES ROOM FOR ITS WORD (function audit 2026-11-05: "POLAR…",
 * "POSITI…" at 320). With six equal keys at 320 a key has 36 px inside it, and
 * POSITION at 9 pt beside its 12-pt glyph wants about 47: no size can fit it.
 * Each key reports the least width that holds its words at the floor (the
 * label tight and untracked, a value at 9 pt); dockKeyWidths takes that from
 * the keys with room to spare.
 *
 * `value` is 0 for a fader key: its value changes under the drag, and the keys
 * must not shift while it does. A two-line key wraps at its authored size, so
 * it asks for about half its one-line width.
 */
export function dockKeyNeed(k: {
  chrome: number;
  labelBase: number;
  label: number;
  spaced?: number;
  spacedGlyph?: number;
  trackPx?: number;
  lines?: 1 | 2;
  valueBase?: number;
  value?: number;
}): number {
  if (!(k.label > 0)) return 0;
  const spaced = k.spaced ?? 0;
  const spacedGlyph = k.spacedGlyph ?? 0;
  const atFloor = MIN_DISPLAY_PT / k.labelBase;
  const label =
    k.lines === 2
      ? k.label / 2
      : spaced > 0 && spacedGlyph > spaced
        ? (spaced - (k.trackPx ?? 0)) * atFloor + (spacedGlyph - spaced)
        : k.label * atFloor;
  const value = k.value && k.valueBase ? (k.value * MIN_DISPLAY_PT) / k.valueBase : 0;
  // +1: dockFitSize floors to 0.1 pt, and a hair under 9 would be refused.
  return Math.ceil(k.chrome + Math.max(label, value)) + 1;
}

/**
 * The keys' widths across `avail` px, or null to leave them equal (flex: 1),
 * as they are wherever every key's words fit: nothing moves at 390. Otherwise a
 * key that needs more than an even share keeps what it needs and the rest share
 * what is left; when even that cannot fit, each gets its share in proportion,
 * so the row can never run off the screen.
 */
export function dockKeyWidths(needs: readonly number[], avail: number): number[] | null {
  const n = needs.length;
  if (n < 2 || !(avail > 0)) return null;
  // A need carries a 1 px margin: a key within its need keeps that margin at 9 pt.
  if (needs.every((x) => x <= avail / n)) return null;
  const total = needs.reduce((a, b) => a + b, 0);
  if (total >= avail) return needs.map((x) => (x * avail) / total);
  const fixed = new Set<number>();
  let share = avail / n;
  for (;;) {
    const more = needs.findIndex((x, i) => !fixed.has(i) && x > share);
    if (more < 0) break;
    fixed.add(more);
    let left = avail;
    fixed.forEach((i) => {
      left -= needs[i];
    });
    share = left / (n - fixed.size);
  }
  return needs.map((x, i) => (fixed.has(i) ? x : share));
}

/** The keys across `stripW`: null while every key fits at the even width and
 *  the normal gap, as on nearly every dock. When the words at 9 pt cannot share
 *  one row at all (the six keys of a conga page at 320), the keys take two rows:
 *  a whole word in a taller dock beats a cut one. Floored to 0.01 px, so that
 *  rounding can never push a key onto a third row. */
export function dockStripFit(needs: readonly number[], stripW: number): { gap: number; widths: number[]; wrap: boolean } | null {
  const gaps = needs.length - 1;
  if (dockKeyWidths(needs, stripW - DOCK_KEY_GAP * gaps) == null) return null;
  const across = (row: readonly number[]) => {
    const avail = stripW - DOCK_KEY_GAP_TIGHT * (row.length - 1);
    return (dockKeyWidths(row, avail) ?? row.map(() => avail / row.length)).map((w) => Math.floor(w * 100) / 100);
  };
  const wrap = needs.length > 3 && needs.reduce((a, b) => a + b, 0) + DOCK_KEY_GAP_TIGHT * gaps > stripW;
  if (!wrap) return { gap: DOCK_KEY_GAP_TIGHT, widths: across(needs), wrap };
  const half = Math.ceil(needs.length / 2);
  return { gap: DOCK_KEY_GAP_TIGHT, widths: [...across(needs.slice(0, half)), ...across(needs.slice(half))], wrap };
}

/**
 * A chooser with one choice is not a chooser (function audit decision 25,
 * owner 2026-11-05: Ukulele SIZE, Cello POSTURE, the ensembles' SEATING): the
 * rack shows it as a plain label with no tray. A key stays a key while anything
 * else lives behind it: a reason it is locked, a reset, a photo, a lesson.
 */
export function isLabelOnly(p: DockParam): boolean {
  return p.kind === 'options' && !p.locked && p.options.length <= 1 && !p.onReset && !p.helpKey && !p.options[0]?.onLongPress;
}
