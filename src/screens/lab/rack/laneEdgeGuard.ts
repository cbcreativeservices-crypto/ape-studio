/**
 * laneEdgeGuard — keeps the ParamLane's grabbable CAP out of the phone's
 * system edge-gesture zones (owner, Pixel 7 Pro, gesture navigation,
 * 2026-10-04: "when grabbing at extreme ends wants to scroll (swipe gesture)
 * to next screen — very frustrating").
 *
 * WHY: the dock pads the lane 8 dp from each screen edge and the cap used to
 * travel the lane's full width, so at value 0 the cap sat 8–34 dp from the
 * left edge and at value 1 the same distance from the right. Android's
 * gesture navigation reserves a back-gesture strip on BOTH edges (≈24 dp at
 * default sensitivity, wider at high sensitivity); a touch that starts inside
 * it and moves inward is pilfered by the system (the app receives a cancel)
 * and the screen starts to slide away. Grabbing the cap at either end and
 * pulling it back toward the middle is exactly that gesture.
 *
 * THE FIX (JS, OTA-safe): the lane keeps its full width — panel, label and
 * readout are unchanged — but the cap's TRAVEL is inset inside it so the
 * cap's outer edge never comes closer than EDGE_GUARD_DP to either edge of
 * the window. Values 0 and 1 are still reached: the cap at 0 sits ≥ 40 dp in,
 * and a touch anywhere in the inset end clamps to the endpoint.
 *
 * The inset is computed from the lane's MEASURED frame in its window
 * (measureInWindow): a lane in a tablet's centred reading column is already
 * far from the edges and gets no inset; full screen's landscape cutout
 * padding is asymmetric and is measured, never assumed.
 *
 * The same guard serves every horizontal slider whose cap travels an inset
 * lane (DragSlider, ControlSlider): pass that slider's cap width and a
 * fallback of zero (its position is not known before it is measured).
 *
 * Pure (no React Native) so it is tested directly; useEdgeGuard.ts is the
 * React hook that measures and feeds it.
 */

/** The cap's outer edge stays at least this far from either window edge. */
export const EDGE_GUARD_DP = 40;
/** The lane cap's width (ParamLane draws it at this size). */
export const LANE_CAP_W = 26;
/** Every lane lives in a dock padded 8 dp from the edge: the inset to use
 *  before the first measurement arrives (exact for a phone's dock). */
export const DOCK_EDGE_PAD = 8;
/** Never inset so far that the cap has less than this much travel. */
const MIN_TRAVEL = 60;

export type LaneInsets = { l: number; r: number };

/** The lane's frame in its window: x of its left edge and its width. */
export type LaneFrame = { x: number; w: number };

/** The dock lane's insets before it is measured. */
export const FALLBACK_INSETS: LaneInsets = { l: EDGE_GUARD_DP - DOCK_EDGE_PAD, r: EDGE_GUARD_DP - DOCK_EDGE_PAD };
export const NO_INSETS: LaneInsets = { l: 0, r: 0 };

export type GuardOpts = { capW?: number; fallback?: LaneInsets; guard?: number };

/**
 * The cap-travel insets for a lane at `frame` in a window `winW` wide.
 * A missing or impossible measurement (zero width, or a lane not wholly on
 * screen — a frame caught mid-transition) keeps the fallback.
 */
export function laneEdgeInsets(frame: LaneFrame | null | undefined, winW: number, opts: GuardOpts = {}): LaneInsets {
  const { capW = LANE_CAP_W, fallback = FALLBACK_INSETS, guard = EDGE_GUARD_DP } = opts;
  if (!frame || !(frame.w > 0) || !(winW > 0)) return fallback;
  const right = winW - (frame.x + frame.w);
  // 1 dp of slack for sub-pixel rounding of the measurement.
  if (frame.x < -1 || right < -1) return fallback;
  let l = Math.max(0, Math.ceil(guard - Math.max(0, frame.x)));
  let r = Math.max(0, Math.ceil(guard - Math.max(0, right)));
  // A lane too narrow to carry both insets (never seen: lanes are ≥ 288 dp)
  // keeps a usable travel rather than a dead control.
  const spare = frame.w - capW - MIN_TRAVEL;
  if (l + r > spare) {
    const k = Math.max(0, spare) / (l + r);
    l = Math.floor(l * k);
    r = Math.floor(r * k);
  }
  return { l, r };
}

export function sameInsets(a: LaneInsets, b: LaneInsets): boolean {
  return a.l === b.l && a.r === b.r;
}

/** The cap's travel in dp (lane width less the insets and the cap). */
export function laneTravel(laneW: number, ins: LaneInsets, capW = LANE_CAP_W): number {
  return Math.max(1, laneW - ins.l - ins.r - capW);
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** Jump-to-finger: the value under a touch at `locationX` (lane-local). */
export function laneValueAt(locationX: number, laneW: number, ins: LaneInsets, capW = LANE_CAP_W): number {
  return clamp01((locationX - ins.l - capW / 2) / laneTravel(laneW, ins, capW));
}

/** Riding the lane: the value after the grabbing finger moved `dx`. */
export function laneDragValue(base: number, dx: number, laneW: number, ins: LaneInsets, capW = LANE_CAP_W): number {
  return clamp01(base + dx / laneTravel(laneW, ins, capW));
}

/** The cap's left edge, lane-local, at value `v`. */
export function capLeftAt(v: number, laneW: number, ins: LaneInsets, capW = LANE_CAP_W): number {
  return ins.l + clamp01(v) * laneTravel(laneW, ins, capW);
}
