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

/** A key's authored side padding (DockButton styles.btn paddingHorizontal):
 *  the chrome dockKeyNeed is measured with. */
export const DOCK_KEY_PAD = 4;
/** The least width a key may be given on a NARROW dock before the row wraps
 *  instead (the 44 pt touch target; the key's height stays 48). */
export const DOCK_MIN_KEY_W = 44;
/**
 * NARROW DOCK, TIGHTER CHROME BEFORE A SECOND ROW (held frame item 1, owner
 * 2026-11-13: Game Audio page 22's six keys needed ~318 px of a 304 px dock at
 * 320 wide, wrapped to two rows and pushed the tray's chips under its fold).
 * Only when the keys' least widths cannot share one row at the normal tight
 * gap: first the keys' side padding and the gap give way, in these steps, and
 * only if no step fits do the keys take two rows as before. The words keep
 * their 9 pt floor (dockKeyNeed), the keys their 48 pt height and at least
 * DOCK_MIN_KEY_W of width. A dock that fits one row today never gets here, so
 * nothing changes at 375 or 390.
 */
export const DOCK_TIGHT_STEPS: readonly { padX: number; gap: number }[] = [
  { padX: 2, gap: DOCK_KEY_GAP_TIGHT },
  { padX: 1, gap: 2 },
];

export type DockStripRow = {
  gap: number;
  widths: number[];
  wrap: boolean;
  /** The keys' side padding on this row (DOCK_KEY_PAD unless tightened). */
  padX: number;
};

/** The keys across `stripW`: null while every key fits at the even width and
 *  the normal gap, as on nearly every dock. When the words at 9 pt cannot share
 *  one row at the tight gap, the keys' chrome tightens (DOCK_TIGHT_STEPS); when
 *  even that cannot hold them (the six keys of a conga page at 320), the keys
 *  take two rows: a whole word in a taller dock beats a cut one. Floored to
 *  0.01 px, so that rounding can never push a key onto a third row. */
export function dockStripFit(needs: readonly number[], stripW: number): DockStripRow | null {
  const gaps = needs.length - 1;
  if (dockKeyWidths(needs, stripW - DOCK_KEY_GAP * gaps) == null) return null;
  const across = (row: readonly number[], gap: number = DOCK_KEY_GAP_TIGHT) => {
    const avail = stripW - gap * (row.length - 1);
    return (dockKeyWidths(row, avail) ?? row.map(() => avail / row.length)).map((w) => Math.floor(w * 100) / 100);
  };
  const sum = (row: readonly number[]) => row.reduce((a, b) => a + b, 0);
  const wrap = needs.length > 3 && sum(needs) + DOCK_KEY_GAP_TIGHT * gaps > stripW;
  if (!wrap) return { gap: DOCK_KEY_GAP_TIGHT, widths: across(needs), wrap, padX: DOCK_KEY_PAD };
  const tight = dockTightRow(needs, stripW);
  if (tight) return tight;
  const half = Math.ceil(needs.length / 2);
  return { gap: DOCK_KEY_GAP_TIGHT, widths: [...across(needs.slice(0, half)), ...across(needs.slice(half))], wrap, padX: DOCK_KEY_PAD };
}

/** The first DOCK_TIGHT_STEPS step that holds every key on one row (each key at
 *  least its tightened need and DOCK_MIN_KEY_W wide), or null: wrap. A need is
 *  measured at DOCK_KEY_PAD a side, so a step's need is that less the padding
 *  it gives up. */
export function dockTightRow(needs: readonly number[], stripW: number): DockStripRow | null {
  const gaps = needs.length - 1;
  for (const step of DOCK_TIGHT_STEPS) {
    const save = 2 * (DOCK_KEY_PAD - step.padX);
    const row = needs.map((x) => (x > 0 ? Math.max(0, x - save) : 0));
    if (row.reduce((a, b) => a + b, 0) + step.gap * gaps > stripW) continue;
    const avail = stripW - step.gap * gaps;
    const widths = (dockKeyWidths(row, avail) ?? row.map(() => avail / row.length)).map((w) => Math.floor(w * 100) / 100);
    if (widths.some((w) => w < DOCK_MIN_KEY_W)) continue;
    return { gap: step.gap, widths, wrap: false, padX: step.padX };
  }
  return null;
}

/**
 * A STICKY TRAY'S TITLE: THE NOTE GIVES WAY, NEVER THE TITLE (held frame item
 * 3, owner 2026-11-13: "SOUNDS · CLOSE THIS: THE SLIDER IS SP…" — the page's
 * own words cut to keep a reminder whole). The note after the title shortens
 * first, then goes; the title is never cut: alone and still wider than the
 * head, it is drawn smaller to fit (never under 9 pt, as the dock keys), and
 * only when even 9 pt cannot hold it does it wrap to a second line. Widths are
 * the measured natural lines (title + note), the title alone, and the room the
 * head gives it; `base` is the title's authored size.
 */
export const TRAY_STICKY_NOTE = '  ·  stays open — compare while you watch';
export const TRAY_STICKY_NOTE_SHORT = '  ·  stays open';
export const TRAY_TITLE_FS = 12;
export type TrayTitleFit = { note: 'full' | 'short' | 'none'; fs: number; wrap: boolean };
export function trayTitleFit(avail: number, withFull: number, withShort: number, bare: number, base: number = TRAY_TITLE_FS): TrayTitleFit {
  // Not measured yet: as drawn today.
  if (!(avail > 0) || !(withFull > 0) || !(withShort > 0) || !(bare > 0)) return { note: 'full', fs: base, wrap: false };
  if (withFull <= avail + FIT_SLACK_PX) return { note: 'full', fs: base, wrap: false };
  if (withShort <= avail + FIT_SLACK_PX) return { note: 'short', fs: base, wrap: false };
  const fs = dockFitSize(base, bare, avail, 0, LABEL_FIT_MARGIN_PX);
  return fs == null ? { note: 'none', fs: base, wrap: true } : { note: 'none', fs, wrap: false };
}

/**
 * A BEZEL KEY IS WHOLE, SHORT OR GONE (held frame item 4, owner 2026-11-13:
 * "SURFA…", "PLAYI…"). The house rule is that a cropped readout drops its
 * label, never its number (D36); a key ending in "…" is neither. When the key
 * does not fit its cell whole, the readout's short key (BezelItem.kNarrow) is
 * used if it has one and it fits; otherwise the key line is dropped and the
 * value keeps the cell. Widths are the measured natural key lines (with the
 * tap caret when the cell has one) and the cell's inner width.
 */
export type BezelKeyFit = 'full' | 'narrow' | 'none';
export function bezelKeyFit(avail: number, key: number, narrow?: number): BezelKeyFit {
  // Not measured yet: as drawn today.
  if (!(avail > 0) || !(key > 0)) return 'full';
  if (key <= avail + FIT_SLACK_PX) return 'full';
  if (narrow != null && narrow > 0 && narrow <= avail + FIT_SLACK_PX) return 'narrow';
  return 'none';
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
