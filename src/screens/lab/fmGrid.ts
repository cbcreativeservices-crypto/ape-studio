/**
 * FM-03 (owner 2026-11-15, "build waves 1 thru 3"): the faint in-tune lines
 * behind the FM Synth Lab's sticks. Pure, so the test loads it directly.
 *
 * A clear (pitched) FM tone has every stick on a whole multiple of one
 * fundamental. With RATIO = p / q in lowest terms, the sticks sit at
 * fc ± k·fc·p/q, all whole multiples of fc / q: so the in-tune step is fc for
 * 1, 2 and 7, and fc / 2 for 0.5 and 3.5 (the "octave down" series the RATIO
 * tray describes). An uneven ratio (✳, 1.41) has no common fundamental; the
 * lines then mark multiples of the carrier, and the sticks fall between them:
 * the bell. Nothing about the sound or the sticks changes.
 */

/** The spacing of the in-tune lines, in Hz. */
export function fmNoteStep(fc: number, ratio: number, inharmonic: boolean): number {
  if (inharmonic || !(ratio > 0)) return fc;
  for (let q = 1; q <= 8; q++) {
    const p = ratio * q;
    if (Math.abs(p - Math.round(p)) < 1e-6) return fc / q;
  }
  return fc;
}

/**
 * The in-tune line frequencies from one step up to fMax. None when they would
 * sit closer than `minGapPx` on screen (a grey wash teaches nothing).
 */
export function fmNoteGrid(step: number, fMax: number, pxPerHz: number, minGapPx = 5): number[] {
  if (!(step > 0) || !(fMax > 0) || step * pxPerHz < minGapPx) return [];
  const out: number[] = [];
  for (let k = 1; k * step <= fMax; k++) out.push(k * step);
  return out;
}
