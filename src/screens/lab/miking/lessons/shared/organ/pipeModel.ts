/**
 * THE PIPE ORGAN — technical truth for HOW IT SOUNDS (Lab 3's A12). Pure
 * TypeScript, so the tests reach it. Every picture is a SIMPLIFIED model,
 * said once on screen:
 *
 *   PIPES     an air column. An OPEN pipe sounds about c / 2L, with every
 *             harmonic; a STOPPED pipe (capped at the top) about c / 4L —
 *             an octave lower for the same length — with only the odd
 *             harmonics. That is why a stop labelled 8′ made of stopped
 *             pipes is only about 4′ long (the research: "is labeled as an
 *             8' stop. If that pipe is a stopped flute, however, the
 *             physical length of the pipe is only 4'."). End corrections
 *             are ignored.
 *   THE ROOM  the nave's LENGTHWISE resonances, an ideal hard-walled box:
 *             f_n = n·c / 2L, pressure ∝ cos(nπx / L) — strong at the end
 *             walls, a still line every L / n. A real room mixes many such
 *             resonances in three directions; the picture shows why the
 *             low pedal notes can change a lot over a short move
 *             (illustrative, never a prediction for a real room).
 *   ARRIVALS  sound from each division reaches a listening position after
 *             d / c: a distributed source arrives at different times.
 *
 * Pitches: equal temperament, A4 = 440 Hz (C0 16.35, C1 32.70, C2 65.41 Hz —
 * the lowest C of a 32′, 16′ and 8′ stop). c = 343.2 m/s at 20 °C, the
 * lab's two-mic constant. Nothing here is played; nothing loops.
 */

export const C_AIR = 343.2;

/** The frequency of C in octave k (C4 = 261.63 Hz, A4 = 440 Hz). */
export function cHz(k: number): number {
  return 440 * Math.pow(2, (k * 12 + 0 - 57) / 12);
}

/** The lowest C of a stop labelled `feet` (32′ → C0, 16′ → C1, 8′ → C2, 4′ → C3). */
export function stopLowC(feet: number): number {
  return cHz(Math.round(5 - Math.log2(feet)));
}

/** A pipe's lowest pitch, Hz: open c / 2L, stopped c / 4L (L in metres). */
export function pipePitchHz(lengthM: number, stopped: boolean, c = C_AIR): number {
  return c / ((stopped ? 4 : 2) * lengthM);
}

/** The length (m) that sounds f: open c / 2f, stopped c / 4f. */
export function pipeLengthM(f: number, stopped: boolean, c = C_AIR): number {
  return c / ((stopped ? 4 : 2) * f);
}

/** The harmonics a pipe can sound (multiples of its lowest): all, or odd only. */
export function pipeHarmonics(stopped: boolean, n = 5): number[] {
  return Array.from({ length: n }, (_, i) => (stopped ? 2 * i + 1 : i + 1));
}

/**
 * The pressure swing along a pipe in its k-th mode (k = 1 the lowest), at
 * ξ = 0 at the MOUTH (open) … 1 at the top. Open at both ends: a still point
 * of pressure at each end, |sin(kπξ)|. Stopped at the top: still at the
 * mouth, strongest at the cap, |sin((2k − 1)πξ / 2)|.
 */
export function pipePressure(xi: number, k: number, stopped: boolean): number {
  const x = Math.max(0, Math.min(1, xi));
  return stopped ? Math.abs(Math.sin(((2 * k - 1) * Math.PI * x) / 2)) : Math.abs(Math.sin(k * Math.PI * x));
}

/** The nave's lengthwise resonance nearest a note: n, its frequency, its still-line spacing. */
export function naveMode(f: number, lengthM: number, c = C_AIR): { n: number; hz: number; spacingM: number } {
  const n = Math.max(1, Math.round((2 * lengthM * f) / c));
  return { n, hz: (n * c) / (2 * lengthM), spacingM: lengthM / n };
}

/** The pressure swing of lengthwise mode n at x (m) along a nave of length L: |cos(nπx/L)|. */
export function navePressure(xM: number, n: number, lengthM: number): number {
  return Math.abs(Math.cos((n * Math.PI * xM) / lengthM));
}

/** The time (ms) for sound to travel d mm. */
export function arrivalMs(dMm: number, c = C_AIR): number {
  return dMm / c;
}
