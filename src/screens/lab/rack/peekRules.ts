/**
 * peekRules — the pure half of the reading well's fold (RackUnit; lab fix
 * round 1, 2026-11-14, section 3 row 9). See the note above PEEK in
 * RackUnit.tsx. No imports, so the tests load it directly.
 */
export const PEEK_SHARE = 0.4;
/** The least glass a folded display keeps (dp). */
export const PEEK_MIN_H = 72;
/** A well scrolled this far (dp) is being read. */
export const PEEK_AFTER_Y = 24;
/** Fold only when, even after it, the well still overflows by this much, so
 *  the fold can never clamp the scroll back to the top and unfold itself. */
export const PEEK_SPARE = 40;
export function peekHeight(glassH: number): number {
  return Math.min(glassH, Math.max(PEEK_MIN_H, Math.round(glassH * PEEK_SHARE)));
}
/** Fold now? Pure (tests): scrolled past PEEK_AFTER_Y, nothing in hand, and
 *  the well would still overflow by PEEK_SPARE once it gained the room. */
export function shouldPeek(o: { y: number; contentH: number; viewH: number; glassH: number; busy: boolean; allowed: boolean }): boolean {
  if (!o.allowed || o.busy || o.y <= PEEK_AFTER_Y) return false;
  const gain = o.glassH - peekHeight(o.glassH);
  return gain > 0 && o.contentH - o.viewH > gain + PEEK_SPARE;
}

/** The least reading room (dp) an open tray must leave above its card before
 *  the display folds for it (row 8, F2: DJ screen 10 left one line). */
export const TRAY_READ_MIN = 120;
/** Fold the display under an open tray? Pure. `wellTop` is the well's top with
 *  the display UNFOLDED; the card sits on the dock (6 dp margin). */
export function shouldTrayFold(o: { rootH: number; bottom: number; dockH: number; cardH: number; wellTop: number; glassH: number }): boolean {
  if (!(o.rootH > 0) || !(o.cardH > 0) || !(o.dockH > 0) || !(o.wellTop > 0)) return false;
  if (o.glassH - peekHeight(o.glassH) <= 0) return false;
  const cardTop = o.rootH - o.bottom - o.dockH - 6 - o.cardH;
  return cardTop - o.wellTop < TRAY_READ_MIN;
}
