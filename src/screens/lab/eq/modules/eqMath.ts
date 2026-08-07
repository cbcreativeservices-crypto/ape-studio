/**
 * eqMath — tiny shared helpers for the EQ Lab modules (owner spec 2026-08-07).
 * Q ↔ bandwidth-in-octaves uses the standard peaking-filter relation
 * 1/Q = 2·sinh(ln2/2 · BWoct) — the SAME numbers a console readout shows, so
 * the dual "Q · Bandwidth (oct)" displays the spec mandates stay honest.
 */

/** Bandwidth in octaves for a peaking filter of quality Q. */
export function bwOctFromQ(q: number): number {
  return (2 / Math.LN2) * Math.asinh(1 / (2 * q));
}

/** Quality Q for a peaking filter of the given bandwidth in octaves. */
export function qFromBwOct(bw: number): number {
  return 1 / (2 * Math.sinh((Math.LN2 / 2) * bw));
}

/** 0..1 slider position → 20 Hz…20 kHz (log-even). */
export const fFromNorm = (t: number) => 20 * Math.pow(1000, Math.max(0, Math.min(1, t)));
/** 20 Hz…20 kHz → 0..1 slider position (log-even). */
export const normFromF = (f: number) => Math.log(f / 20) / Math.log(1000);

/** Console-style frequency readout: "63 Hz" · "1.00 kHz" · "12.5 kHz". */
export function fmtHz(f: number): string {
  if (f >= 10000) return `${(f / 1000).toFixed(1)} kHz`;
  if (f >= 1000) return `${(f / 1000).toFixed(2)} kHz`;
  return `${Math.round(f)} Hz`;
}
