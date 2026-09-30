/**
 * The Home deck's card size — pure, so `test/androidLargeScreenPass.test.ts`
 * can drive it at Android sizes (owner 2026-09-29, Android large-screen pass).
 * The WHY of every number is in CourseSelectionScreen.tsx, beside `useCardDims`.
 */
import { isTabletWindow } from '../../theme/tablet.ts';

/** Never wider than the largest phone produced - a card stays a card. */
const CARD_MAX_W = 280;
const PHONE_CARD_RATIO = 409 / 280;
const DECK_CHROME_H = 394;
/**
 * SHORT WINDOWS (owner 2026-09-29: "shrink the header"). Below this window
 * height — phone split screen, a short Chromebook/desktop window — the full
 * chrome left the card cut off (394 + the 260 floor = 654). Home then hides the
 * logo, the PROFESSIONAL AUDIO GLOSSARY line and "Start Learning" (measured
 * 120 pt with their spacing), and the card gets that room. Every normal phone
 * is taller than this, so no phone changes.
 */
export const COMPACT_HEADER_BELOW_H = 654;
const COMPACT_SAVED_H = 120;
/** Does the app fill the physical screen (vs a split-screen pane / window)? */
function fillsScreenFor(windowW: number, windowH: number, screenW: number, screenH: number): boolean {
  const sShort = Math.min(screenW, screenH);
  const sLong = Math.max(screenW, screenH);
  return sShort > 0 && Math.min(windowW, windowH) >= sShort - 1 && Math.max(windowW, windowH) >= sLong - WINDOWED_SLACK;
}
/** Compact header? Full screen: judged on the SCREEN's long edge, so no phone
 *  ever changes (an iPhone SE's 667 clears it even though Android-style window
 *  heights may read shorter). Windowed: the window's own height. */
export function isCompactHeader(windowW: number, windowH: number, screenW: number, screenH: number): boolean {
  const h = fillsScreenFor(windowW, windowH, screenW, screenH) ? Math.max(screenW, screenH) : windowH;
  return h > 0 && h < COMPACT_HEADER_BELOW_H;
}
function deckChrome(compact: boolean): number {
  return compact ? DECK_CHROME_H - COMPACT_SAVED_H : DECK_CHROME_H;
}
const TABLET_CARD_MAX_H = 720;
/** A window this much shorter than the screen is a split-screen pane or a
 *  desktop window, not a full-screen app — generous enough to absorb the
 *  status/navigation bars Android may or may not count in the window. */
const WINDOWED_SLACK = 160;
export type CardDims = { w: number; h: number; btnW: number; outer: { width: number }; card: { width: number; height: number } };
function dims(w: number, h: number): CardDims {
  return { w, h, btnW: Math.round(w * 0.62), outer: { width: w }, card: { width: w, height: h } };
}
/** The phone card — the same arithmetic as `CARD_W` / `CARD_H` in the screen, from
 *  whichever box the app actually has (see the note there). Exported for the
 *  Android large-screen test. */
export function phoneCardDims(windowW: number, windowH: number, screenW: number, screenH: number): CardDims {
  const sShort = Math.min(screenW, screenH);
  const sLong = Math.max(screenW, screenH);
  const wShort = Math.min(windowW, windowH);
  const fillsScreen = fillsScreenFor(windowW, windowH, screenW, screenH);
  const short = fillsScreen ? sShort : wShort;
  // Full screen: the screen's long edge, exactly as before. Windowed: the
  // window's HEIGHT — a wide desktop window has its room vertically.
  const room = fillsScreen ? sLong : windowH;
  const w = Math.min(Math.round(short * 0.7 * 0.93), CARD_MAX_W);
  return dims(w, Math.max(200, Math.min(409, room - deckChrome(isCompactHeader(windowW, windowH, screenW, screenH)))));
}
export function cardDimsFor(windowW: number, windowH: number, screenW: number, screenH: number): CardDims {
  const phone = phoneCardDims(windowW, windowH, screenW, screenH);
  if (!isTabletWindow(windowW, windowH)) return phone;
  const tallest = Math.max(300, Math.min(TABLET_CARD_MAX_H, windowH - deckChrome(isCompactHeader(windowW, windowH, screenW, screenH))));
  const w = Math.max(phone.w, Math.min(Math.round(tallest / PHONE_CARD_RATIO), Math.round(windowW * 0.46)));
  return dims(w, Math.round(w * PHONE_CARD_RATIO));
}
