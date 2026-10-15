/**
 * trayTap — TAP vs SCROLL for the dock chooser tray's chips (emulator pass
 * 2026-10-14, 411×731 phone): a fast swipe that STARTED on a chip released as
 * a tap — the chip toggled (and the tray re-laid out under the finger)
 * instead of the tray scrolling. Pure, so it is unit-tested in Node
 * (test/emulatorPass_20261014.test.ts); DockTray's TrayChip calls it.
 */

/** A release more than this far (dp) from where the finger landed is a
 *  scroll, never a pick. */
export const TRAY_TAP_SLOP = 10;

/** Should a chip release count as a tap? `lastScrollAt`: when the tray last
 *  scrolled (ms) — a release after the tray scrolled during the touch is the
 *  end of a scroll. */
export function trayReleaseIsTap(
  down: { x: number; y: number; at: number } | null,
  up: { x: number; y: number },
  lastScrollAt: number,
): boolean {
  if (!down) return true; // no press-in seen — a plain tap
  if (lastScrollAt >= down.at) return false;
  // No coordinates (a screen-reader activation) — nothing moved; a tap.
  if (![down.x, down.y, up.x, up.y].every(Number.isFinite)) return true;
  return Math.abs(up.x - down.x) <= TRAY_TAP_SLOP && Math.abs(up.y - down.y) <= TRAY_TAP_SLOP;
}
