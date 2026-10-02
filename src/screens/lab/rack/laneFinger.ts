/**
 * laneFinger — ParamLane follows THE FINGER THAT GRABBED IT (full run 1,
 * 2026-10-01).
 *
 * React Native's PanResponder `dx` is the travel of the CENTROID of every
 * touch that moved (PanResponder._updateGestureStateOnMove →
 * TouchHistoryMath.currentCentroidXOfTouchesChangedAfter), and the view that
 * holds the responder receives every touch's moves (ResponderEventPlugin
 * dispatches any move to the current responder; ParamLane refuses to hand
 * the gesture over). So while a student rides the lane, a second finger on
 * the glass — a pinch, the other hand on the stage — moved the fader too:
 * by its full travel once the first finger lifted, and by half of it on
 * Android, which reports every pointer as changed on each move.
 *
 * Pure (no React Native) so it is tested directly.
 */
export type LaneTouch = { identifier?: number | string; pageX?: number; touches?: readonly { identifier?: number | string; pageX: number }[] };

/** The grabbing finger: its identifier and where it went down (page x). */
export type LaneFinger = { id: number | string | undefined; px: number };

export function laneFingerAt(ne: LaneTouch): LaneFinger {
  return { id: ne.identifier, px: ne.pageX ?? 0 };
}

/**
 * The grabbing finger's x travel since it went down. `fallbackDx` (the
 * centroid) only when the event carries no touch list or no identifier;
 * 'lifted' once that finger has left the glass (the lane stays where it is
 * while any other finger remains).
 */
export function laneFingerDx(ne: LaneTouch, f: LaneFinger, fallbackDx: number): number | 'lifted' {
  const list = ne.touches;
  if (f.id == null || !Array.isArray(list) || list.length === 0) return fallbackDx;
  const t = list.find((x) => x.identifier === f.id);
  if (!t) return 'lifted';
  return t.pageX - f.px;
}
