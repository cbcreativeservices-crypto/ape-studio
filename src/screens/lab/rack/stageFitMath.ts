/**
 * stageFitMath — the pure half of StageFullScreen (no React Native import, so
 * the node test runner can exercise it): how the drawing is sized at 1×, what
 * the FIT step is, which step an opening lands on, and how the sideways
 * frame compacts. The view reads these; nothing here renders.
 *
 * Space rules (owner 2026-10-01, "every lab uses the space better"):
 *
 *  1× IS THE WHOLE DRAWING (owner 2026-09-26) — contain-fit inside the body,
 *  the drawing's own aspect, never cropped.
 *
 *  …AND ITS TEXT IS NEVER SMALLER THAN ON THE GLASS. Sideways the body is
 *  short, and a drawing contain-fit into it can come out narrower than the
 *  glass it left (textScale ≈ 0.95 → labels under the 9 pt floor; a tall rig
 *  at 0.3). The text scale is floored at 1 (`textScaleFor`): the drawing lays
 *  out at its real width with glass-size text, and stays the whole drawing.
 *  (Flooring the SIZE instead would make a tall drawing sideways overflow
 *  the body by hundreds of points at "1×" — tried, rejected.)
 *
 *  FIT fills the body's OTHER side. A wide drawing in a tall portrait body is
 *  a strip in black (the Compression Lab, owner 2026-10-01): FIT makes it as
 *  tall as the body and pans sideways. A tall drawing in a short sideways
 *  body (the Amp's three-panel rig) fills the width and pans up/down. The
 *  step exists only when it gains something (> FIT_MIN_GAIN).
 *
 *  THE OPENING IS STILL 1× (owner 2026-09-26: "every opening starts at the
 *  whole drawing"). FIT crops along its pan axis, so it is one tap away, never
 *  the opening; a wide drawing's hint sends the learner sideways or to FIT.
 */

export type StageShape = { aspect: number; pad: number } | null;

/** A FIT step under this gain over 1× is not worth a key. */
export const FIT_MIN_GAIN = 1.15;
/** Past this FIT factor less than half the drawing is on screen at once: a
 *  wide drawing in portrait is then better turned sideways than zoomed. */
export const FIT_CROPS_PAST_HALF = 2;
/** The fixed zoom steps; FIT slots in among them by its factor. */
export const ZOOM_FACTORS = [1, 1.5, 2, 3] as const;

export type ZoomStep = { key: string; factor: number; label: string };

/**
 * The 1× box: the widest box of the drawing's shape that fits (fitW, fitH).
 * A drawing without a shape takes the whole body (it paints the box it is
 * given).
 */
export function baseSize({ fitW, fitH, shape }: { fitW: number; fitH: number; shape: StageShape }): { w: number; h: number } {
  if (!shape || shape.aspect <= 0) return { w: fitW, h: fitH };
  const pad = shape.pad;
  const drawW = Math.max(1, Math.min(fitW - pad * 2, (fitH - pad * 2) * shape.aspect));
  return { w: drawW + pad * 2, h: drawW / shape.aspect + pad * 2 };
}

/**
 * StageTextScale for a drawing rendered `w` wide from a glass `glassW` wide:
 * rendered ÷ glass, floored at 1 — overlay labels never go under their
 * glass size (the 9 pt floor). 1 when the glass width is unknown.
 */
export function textScaleFor(w: number, glassW: number): number {
  return glassW > 0 ? Math.max(1, w / glassW) : 1;
}

/** The factor that fills the body's other side (1 when 1× already does). */
export function fitFactor({ baseW, baseH, fitW, fitH }: { baseW: number; baseH: number; fitW: number; fitH: number }): number {
  if (baseW <= 0 || baseH <= 0) return 1;
  // A contain-fit touches one side; FIT fills the other.
  return Math.max(1, fitW / baseW, fitH / baseH);
}

/** The zoom row: the fixed steps plus FIT when it gains, ascending. */
export function zoomSteps(fit: number): ZoomStep[] {
  const steps: ZoomStep[] = ZOOM_FACTORS.map((f) => ({ key: String(f), factor: f, label: `${f}×` }));
  if (fit > FIT_MIN_GAIN) steps.push({ key: 'fit', factor: fit, label: 'FIT' });
  return steps.sort((a, b) => a.factor - b.factor);
}

/** The factor a step key stands for now (a FIT key whose step is gone = 1×). */
export function factorOf(steps: ZoomStep[], key: string): number {
  return steps.find((s) => s.key === key)?.factor ?? 1;
}

/**
 * Scroll offset that puts the anchor fraction `f` of the content mid-view,
 * clamped to the content. 0 when nothing overflows.
 */
export function anchorOffset(content: number, view: number, f: number): number {
  if (view <= 0 || content <= view) return 0;
  return Math.max(0, Math.min(content - view, f * content - view / 2));
}

/** Width > height: the sideways frame (readouts and badge fold into the bar). */
export const isLandscape = (width: number, height: number): boolean => width > height;

/**
 * Whether the portrait frame should push the learner sideways: the drawing's
 * 1× height is under half the body (a wide strip in black) and FIT would show
 * less than half of it at once. Sideways gives the drawing the long side.
 */
export function wantsRotate({ landscape, baseH, fitH, fit }: { landscape: boolean; baseH: number; fitH: number; fit: number }): boolean {
  return !landscape && fitH > 0 && baseH < fitH * 0.5 && fit > FIT_CROPS_PAST_HALF;
}

/**
 * The sideways frame folds its rows: the readouts ride in the bar beside the
 * zoom keys, the badge goes on one line in the dock-handle row (the foot),
 * the hint is dropped, the dock can fold to its handle. Portrait keeps the
 * rows — there is room, and the hint earns it.
 */
export function compaction(landscape: boolean): { readoutsInBar: boolean; badgeInFoot: boolean; hint: boolean } {
  return { readoutsInBar: landscape, badgeInFoot: landscape, hint: !landscape };
}
