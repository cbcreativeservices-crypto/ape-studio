/**
 * fxEqCurve — the FX Equalizer lab's response curve as points for the animated
 * display (slider audit hold #27, owner 2026-10-14: "the bell curve isn't
 * drawn on the display — draw it"). Pure: the caller hands in the response
 * function (fxAnim passes fxViz's eqResponseDb on the SAME band the DSP runs),
 * so this file needs no React and the tests can import it.
 *
 * Axis: x = log frequency, 20 Hz at x0 … 20 kHz at x1 (ten octaves, the axis
 * every EQ display in the app uses); y = dB about the flow's zero line, ±
 * EQ_CURVE_RANGE_DB filling `halfH`. Values past the range (a pass filter's
 * deep stop band) are pinned to the edge, never drawn outside the panel.
 */
export const EQ_CURVE_F_MIN = 20;
export const EQ_CURVE_F_MAX = 20000;
/** ± dB the curve's half-height spans. The lab's GAIN tops out at ±12 dB, so
 *  a ±12 boost reaches two thirds of the way to the panel edge. */
export const EQ_CURVE_RANGE_DB = 18;
/** Points along the curve (plus the band's exact centre, so a narrow bell
 *  always draws its full height). */
export const EQ_CURVE_POINTS = 160;

export type CurvePt = { x: number; y: number; f: number; db: number };

/** x for a frequency on the 20 Hz – 20 kHz log axis between x0 and x1. */
export function eqCurveX(f: number, x0: number, x1: number): number {
  const u = Math.log(f / EQ_CURVE_F_MIN) / Math.log(EQ_CURVE_F_MAX / EQ_CURVE_F_MIN);
  return x0 + Math.max(0, Math.min(1, u)) * (x1 - x0);
}

/** y for a dB value: midY at 0 dB, boost UP, clamped to ±EQ_CURVE_RANGE_DB. */
export function eqCurveY(db: number, midY: number, halfH: number): number {
  const d = Math.max(-EQ_CURVE_RANGE_DB, Math.min(EQ_CURVE_RANGE_DB, Number.isFinite(db) ? db : -EQ_CURVE_RANGE_DB));
  return midY - (d / EQ_CURVE_RANGE_DB) * halfH;
}

/** The curve, left to right. `centreHz` (the band's frequency) is inserted
 *  exactly so the bell's peak is a sample, not a near miss. */
export function eqCurvePoints(
  respDb: (f: number) => number,
  x0: number,
  x1: number,
  midY: number,
  halfH: number,
  centreHz?: number,
): CurvePt[] {
  const fs: number[] = [];
  for (let k = 0; k <= EQ_CURVE_POINTS; k++) {
    fs.push(EQ_CURVE_F_MIN * Math.pow(EQ_CURVE_F_MAX / EQ_CURVE_F_MIN, k / EQ_CURVE_POINTS));
  }
  if (centreHz != null && centreHz > EQ_CURVE_F_MIN && centreHz < EQ_CURVE_F_MAX) {
    fs.push(centreHz);
    fs.sort((a, b) => a - b);
  }
  return fs.map((f) => {
    const db = respDb(f);
    return { f, db, x: eqCurveX(f, x0, x1), y: eqCurveY(db, midY, halfH) };
  });
}
