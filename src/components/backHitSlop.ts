/**
 * The touch area for a header back / close control.
 *
 * ⛔ WHY THIS EXISTS — TESTER REPORT, 2026-09-23 (Frank, iPhone SE 3rd gen):
 *   "Back button does not work on multiple progress screens"
 *   "Back button doesn't work here. you have to close the app to get out"
 *
 * The control is a bare `‹` glyph — at fontSize 24 that is roughly TEN points
 * of actual ink — wrapped in a Pressable with `hitSlop={10}`. That yields a
 * target around 30×44pt against Apple's 44×44pt minimum, and it sits flush at
 * the left edge where iOS runs the interactive pop-gesture recogniser. A tap
 * that lands a few points off, or that iOS decides might be the start of an
 * edge swipe, simply does nothing — which is indistinguishable from a broken
 * button, and on a 667pt iPhone SE it reads as being trapped in the screen.
 *
 * 62 of these controls exist across 59 screens, which is exactly why the report
 * said "multiple progress screens" rather than naming one.
 *
 * ⚠️ DELIBERATELY ASYMMETRIC. Growing the area LEFT does not help: that is the
 * system gesture's territory and the recogniser wins regardless. The room has to
 * come from the RIGHT and from ABOVE/BELOW, where a missed tap actually lands.
 *
 * This changes no layout at all — `hitSlop` extends only the touch region, so
 * not a single pixel moves.
 */
export const BACK_HIT_SLOP = { top: 16, bottom: 16, left: 10, right: 30 } as const;
