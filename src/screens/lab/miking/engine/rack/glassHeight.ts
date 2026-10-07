/**
 * THE MIKING DISPLAY'S HEIGHT ON A PHONE (owner 2026-10-06, answer A to the
 * fix pass: "make the display taller where the screen allows"). Pure; tested.
 *
 * The Rack Unit's large glass is a fixed 250 pt. A Miking drawing is an
 * instrument, its player, a mic, its stand and a dimension: on a tall phone
 * it has room to grow. The glass is sized from the WINDOW height —
 *
 *     height = clamp(round(window × 0.36), 250, 340)   (window ≥ 760 pt)
 *
 * — so a 915-pt phone (Pixel 7 Pro at 412 wide) gets 329 pt, an 844-pt
 * iPhone 304 pt, and a short phone (below 760) keeps the rack's own rule (250,
 * dropped a step under 700). The rack still clamps it so the dock and the
 * well keep their room, and a tablet still takes its own larger share.
 */
export const GLASS_SHARE = 0.36;
export const GLASS_MIN = 250;
export const GLASS_MAX = 340;
/** Below this window height the rack's own rule applies. */
export const GLASS_TALL_FROM = 760;

export function mikingGlassHeight(winH: number): number | undefined {
  if (!(winH >= GLASS_TALL_FROM)) return undefined;
  return Math.max(GLASS_MIN, Math.min(GLASS_MAX, Math.round(winH * GLASS_SHARE)));
}
