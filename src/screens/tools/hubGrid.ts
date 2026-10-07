/**
 * The Tools hub's tile arithmetic — pure, so it runs in node tests at every
 * phone and iPad size. The full history of why each number is what it is
 * (2026-09-13: live window not boot, the fit slack, the column cap) is in the
 * block comment above `tileMetricsFor` in ./ToolsHubScreen.tsx.
 *
 * INSIDE the gray panel: subtract the scroll padding (14x2), the panel's
 * border (1x2) + padding (12x2), the gaps between the tiles, and the slack.
 */
import { TOOL_READING_MAX_W, WIDE_MAX_W } from '../../theme/readingColumn';
import { isTabletWindow } from '../../theme/tablet';

export const GRID_GAP = 12; // styles.grid gap
export const HUB_MAX_CONTENT_W = TOOL_READING_MAX_W;
/** Pixels deliberately left unspent so flex-wrap can never drop a tile. */
export const TILE_FIT_SLACK = 2;

/**
 * ⛔ TABLET: THE HUB USES THE WHOLE iPAD (owner iPad report 2026-10-06:
 * "Audio tools menu and other screens like it have blank space on both sides
 * of the narrowed phone-width display. All that dead space makes it look not
 * designed for iPad (needed for Apple approval)"). The 560 pt column above
 * left 232 pt of black either side of a portrait iPad and 403 pt in
 * landscape. On a tablet the hub column is the WIDE column and the rack
 * holds FOUR displays across (8 tools = two full rows), each bigger than the
 * old 247 pt tile. Where four would land under HUB_TABLET_MIN_TILE (an iPad
 * mini or 11" in portrait) it stays two across, with the bigger tiles that
 * width buys — never three, which would strand two tiles on the last row.
 *
 * ✅ A PHONE (short edge under 600, either way up) takes exactly the old path.
 */
export const HUB_TABLET_MIN_TILE = 200;

/** How many displays sit across the rack at this window. */
export function hubColumnsFor(windowW: number, windowH: number): number {
  if (!isTabletWindow(windowW, windowH)) return 2;
  const inner = Math.min(windowW, WIDE_MAX_W) - 14 * 2 - (1 + 12) * 2;
  const four = Math.floor((inner - GRID_GAP * 3 - TILE_FIT_SLACK) / 4);
  return four >= HUB_TABLET_MIN_TILE ? 4 : 2;
}

/** The hub's content column at this window: 560 on a phone, wide on a tablet. */
export function hubContentMaxW(windowW: number, windowH: number): number {
  return isTabletWindow(windowW, windowH) ? WIDE_MAX_W : HUB_MAX_CONTENT_W;
}

export function tileWidthFor(windowW: number, windowH: number = windowW * 2): number {
  const content = Math.min(windowW, hubContentMaxW(windowW, windowH));
  const inner = content - 14 * 2 - (1 + 12) * 2;
  const cols = hubColumnsFor(windowW, windowH);
  return Math.floor((inner - GRID_GAP * (cols - 1) - TILE_FIT_SLACK) / cols);
}
