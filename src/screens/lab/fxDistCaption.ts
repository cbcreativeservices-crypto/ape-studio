/**
 * The FX Distortion caption's low-DRIVE branch for SOFT and TUBE (owner
 * 2026-11-25, audit B21). Pure, so a node test can run it.
 *
 * The caption said SOFT and TUBE "clip" at every DRIVE, but the lab's −20 dBFS
 * sine at +6 dB peaks at 0.2 of full scale, where tanh bends its tops by
 * about 1 %: the drawn wave looks clean. The bend is measured on the lab's own
 * shapers (fxViz `distShape`, the DSP's mirror): how far the driven peak falls
 * short of where a straight line through the curve's centre slope would put
 * it, the larger of top and bottom. Under DIST_FAINT_BEND_PCT the caption says
 * the bend is small and the harmonics faint; above it the old sentences stand.
 */
export const DIST_FAINT_BEND_PCT = 5;

/** The shapers (fxViz distShape mirrors Effects.hpp; kept identical here). */
function shape(x: number, type: 'soft' | 'tube'): number {
  return type === 'soft' ? Math.tanh(x) : Math.tanh(x + 0.4) - Math.tanh(0.4);
}

/** % the driven sine's peaks fall short of a straight line (larger of the two). */
export function distBendPct(type: 'soft' | 'tube', peakLin: number): number {
  if (!(peakLin > 0)) return 0;
  const slope0 = type === 'soft' ? 1 : 1 - Math.tanh(0.4) ** 2;
  const top = 1 - shape(peakLin, type) / (slope0 * peakLin);
  const bot = 1 - shape(-peakLin, type) / (slope0 * -peakLin);
  return 100 * Math.max(Math.abs(top), Math.abs(bot));
}

/** The low-drive caption, or null when the bend is big enough for the old one. */
export function distFaintCaption(type: 'soft' | 'tube', driveDb: number, sourcePeakDb: number): string | null {
  const peakDb = sourcePeakDb + driveDb;
  const bend = distBendPct(type, Math.pow(10, peakDb / 20));
  if (bend >= DIST_FAINT_BEND_PCT) return null;
  const pct = bend < 1 ? 'under 1' : `about ${Math.round(bend)}`;
  return type === 'soft'
    ? `DRIVE +${Math.round(driveDb)} dB lifts the −20 dBFS sine to ${Math.round(peakDb)} dBFS, where the soft curve bends its tops by ${pct} %: the wave still looks clean and the odd harmonics it adds are faint. Push DRIVE up to see the tops round over.`
    : `DRIVE +${Math.round(driveDb)} dB lifts the −20 dBFS sine to ${Math.round(peakDb)} dBFS, where the tube curve bends it by ${pct} %, top and bottom unequally: the wave still looks clean and the even and odd harmonics it adds are faint. Push DRIVE up to see them grow.`;
}
