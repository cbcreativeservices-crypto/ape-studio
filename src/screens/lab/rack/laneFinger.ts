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

/** A touch-END event: the lifted touch itself (identifier/pageX on the event)
 *  and/or the list of touches that changed. */
export type LaneLift = LaneTouch & { changedTouches?: readonly { identifier?: number | string; pageX: number }[] };

/**
 * Where the grabbing finger LIFTED, as x travel since it went down — or null
 * when the lift was some other finger (the grabbing one already left) or the
 * event carries no position.
 *
 * WHY (emulator pass 2026-10-14, Gain Staging M6 EQ GAIN): a fast flick on a
 * PanResponder slider delivers few moves, and PanResponder's gestureState is
 * NOT updated on release — the slider settled on the last MOVE, short of where
 * the finger lifted (−8/−10 dB for a flick to −12). The release event carries
 * the lift point; DragSlider lands there, as ParamLane does in onEnd.
 */
export function laneFingerLiftDx(ne: LaneLift, f: LaneFinger): number | null {
  const list = ne.changedTouches;
  if (f.id != null && Array.isArray(list) && list.length > 0) {
    const t = list.find((x) => x.identifier === f.id);
    if (t) return t.pageX - f.px;
  }
  if (typeof ne.pageX !== 'number') return null;
  if (f.id != null && ne.identifier != null && ne.identifier !== f.id) return null;
  return ne.pageX - f.px;
}

/**
 * Where a PanResponder slider should LAND when its touch ends — released OR
 * cancelled — as x travel since the grab, or null to stay on the last move
 * already handed over (a tap inside the slop, another finger lifting, an
 * event with no position, or a lift point that cannot be trusted).
 *
 * `lastDx` is the grabbing finger's travel at the last MOVE seen (null when
 * no move arrived at all).
 *
 * ⛔ THE LIFT POINT IS NOT ALWAYS FRESH (follow-up 2026-10-15, the real
 * cause of "every other fast flick does nothing"). The 2026-10-14 release
 * landing trusted the end event's position. Caught in the web preview with a
 * log on every move and release: gesture 1 lifted at x 405 (right); gesture 2
 * moved to dx −174 and then RELEASED reporting x 352 — its own GRAB point —
 * so the slider was landed straight back where the finger went down. To the
 * learner that flick "did nothing", the next one worked; a slow drag right
 * after a flick was "dropped" the same way. So the lift is used only where it
 * can only help:
 *   • no move arrived (a flick delivered as grant → release): the lift is all
 *     there is — land on it when it is past the tap slop;
 *   • moves arrived: land on the lift only when it carries the travel ON in
 *     the direction the finger was going (a fast flick's last move falls
 *     short of the end). A lift that goes back toward the grab is the stale
 *     report — the last move stands.
 * A cancelled touch (the platform taking it; the sliders refuse every JS
 * termination request) follows the same rule. DragSlider and amp/kit's
 * ControlSlider both call this.
 */
export function laneLandDx(ne: LaneLift | null | undefined, f: LaneFinger, lastDx: number | null, slop: number): number | null {
  const lift = ne ? laneFingerLiftDx(ne, f) : null;
  if (lift == null) return null;
  if (lastDx == null || Math.abs(lastDx) <= slop) return Math.abs(lift) > slop ? lift : null;
  return (lift - lastDx) * Math.sign(lastDx) > 0 ? lift : null;
}

// ── The vertical twin (TestFlight triage 2026-10-08) ─────────────────────────
// Faders that travel UP and DOWN (the EQ board's VerticalFader, the mixing
// desk's GearFader) read `g.dy` — the same centroid, so a second finger on the
// next fader moved the one already held: "controls … move together".

export type LaneTouchY = { identifier?: number | string; pageY?: number; touches?: readonly { identifier?: number | string; pageY: number }[] };

/** The grabbing finger: its identifier and where it went down (page y). */
export type LaneFingerY = { id: number | string | undefined; py: number };

export function laneFingerAtY(ne: LaneTouchY): LaneFingerY {
  return { id: ne.identifier, py: ne.pageY ?? 0 };
}

/** The grabbing finger's y travel since it went down — same contract as
 *  laneFingerDx: the centroid fallback only without a touch list or an
 *  identifier, 'lifted' once that finger has left the glass. */
export function laneFingerDy(ne: LaneTouchY, f: LaneFingerY, fallbackDy: number): number | 'lifted' {
  const list = ne.touches;
  if (f.id == null || !Array.isArray(list) || list.length === 0) return fallbackDy;
  const t = list.find((x) => x.identifier === f.id);
  if (!t) return 'lifted';
  return t.pageY - f.py;
}
