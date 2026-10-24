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
/**
 * A SOLID ANDROID BUTTON BAR (emulator pass 2026-10-13, owner "yes fix it").
 * The 394 pt chrome was measured on an iPhone SE, which has no bottom bar.
 * Android's three-button bar (back · home · recents) is a ~48 pt bottom inset
 * the budget never had, so on a 16:9 Android phone (Nexus 5X, 412 × 731) every
 * Home card's button sat half under the dot row. An inset this tall is only
 * ever that bar — iPhones (34) and gesture-nav Android (~16–24) stay below it,
 * so no other phone changes. The extra 32 pt was MEASURED on that phone
 * (Android 16, 1080 × 1920, three-button bar): with the bar alone taken off,
 * the card's eyebrow and its bottom edge were still clipped by ~22 pt; 24 still grazed the card's bottom corners.
 */
const SOLID_NAV_BAR_MIN = 40;
const SOLID_NAV_BAR_EXTRA = 32;
export function phoneCardDims(windowW: number, windowH: number, screenW: number, screenH: number, bottomInset = 0): CardDims {
  const sShort = Math.min(screenW, screenH);
  const sLong = Math.max(screenW, screenH);
  const wShort = Math.min(windowW, windowH);
  const fillsScreen = fillsScreenFor(windowW, windowH, screenW, screenH);
  const short = fillsScreen ? sShort : wShort;
  // Full screen: the screen's long edge, less a solid button bar. Windowed:
  // the window's HEIGHT — a wide desktop window has its room vertically.
  const navBar = bottomInset >= SOLID_NAV_BAR_MIN ? bottomInset + SOLID_NAV_BAR_EXTRA : 0;
  const room = fillsScreen ? sLong - navBar : windowH;
  const w = Math.min(Math.round(short * 0.7 * 0.93), CARD_MAX_W);
  return dims(w, Math.max(200, Math.min(409, room - deckChrome(isCompactHeader(windowW, windowH, screenW, screenH)))));
}
export function cardDimsFor(windowW: number, windowH: number, screenW: number, screenH: number, bottomInset = 0): CardDims {
  const phone = phoneCardDims(windowW, windowH, screenW, screenH, bottomInset);
  if (!isTabletWindow(windowW, windowH)) return phone;
  const tallest = Math.max(300, Math.min(TABLET_CARD_MAX_H, windowH - deckChrome(isCompactHeader(windowW, windowH, screenW, screenH))));
  const w = Math.max(phone.w, Math.min(Math.round(tallest / PHONE_CARD_RATIO), Math.round(windowW * 0.46)));
  // Never taller than the room (emulator pass 2026-10-13): the phone-width
  // floor above made a 1280 × 800 tablet's card 409 tall in 406 of room, so
  // every card's button sat on the card's bottom edge.
  return dims(w, Math.min(Math.round(w * PHONE_CARD_RATIO), tallest));
}

/**
 * ⛔ THE CARD FITS THE ROW IT IS DRAWN IN (owner iPad report 2026-10-24: "the
 * titles above the course cards aren't showing … they show in iPad portrait,
 * but disappear in landscape").
 *
 * Everything above budgets the deck's chrome as a fixed 394 pt measured on a
 * phone. The carousel row itself is a horizontal FlatList, which flex-fills
 * whatever height is really left. On an iPad in landscape the real chrome (tab
 * bar, safe areas) left a row shorter than caption + card, and the list centres
 * its items, so the overflow was cut equally top and bottom: the caption strip
 * ("INCLUDED FOR EVERYONE", "SET UP WHAT YOU STUDY") went first. Measured in
 * the web preview at 1194 × 834 WITHOUT the tab bar: unit 472 pt (32 caption +
 * 440 card) in a 483 pt row — 11 pt of margin before any tab bar.
 *
 * So the screen MEASURES the row (onLayout) and the card is never taller than
 * the row minus the caption strip. A card that already fits is returned
 * unchanged, so no phone or portrait iPad moves.
 */
export const CAPTION_STRIP_H = 32; // cardAbove: 17 text + 5 + 1 rule + 9 margin
const ROW_BREATH = 4;
export function fitCardToRow(cd: CardDims, rowH: number | null, tablet: boolean): CardDims {
  if (rowH == null || !(rowH > 0)) return cd;
  const maxH = Math.floor(rowH - CAPTION_STRIP_H - ROW_BREATH);
  if (cd.h <= maxH) return cd;
  const h = Math.max(160, maxH);
  // A tablet's card width was derived from its height; keep it a card, not a
  // banner. A phone keeps its width (the screen's own centring uses it).
  const w = tablet ? Math.min(cd.w, Math.max(220, Math.round(h / PHONE_CARD_RATIO))) : cd.w;
  return dims(w, h);
}

/**
 * The carousel's dot row ALWAYS fits one line (small-screen pass 2026-09-30).
 * Adding the Calculator + Career Finder cards made 7-pt dots with 6-pt gaps
 * wrap on a 375-wide phone; the second row pushed the carousel down and
 * clipped the card captions. Keep the house size when it fits; otherwise
 * tighten the gap (to 3) and then the dot (to 4) until it does.
 */
export function dotRowFit(count: number, windowW: number): { size: number; gap: number } {
  const avail = Math.max(0, windowW - 32); // the row's side margins
  const need = (size: number, gap: number) => count * size + 11 + Math.max(0, count - 1) * gap; // +11: the wide active dot
  for (const size of [7, 6, 5, 4]) {
    for (const gap of [6, 5, 4, 3]) {
      if (need(size, gap) <= avail) return { size, gap };
    }
  }
  return { size: 4, gap: 2 };
}
