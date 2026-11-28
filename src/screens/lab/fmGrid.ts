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
 * The stick graph's frequency axis (owner 2026-11-25, fix-first 15, item 13).
 * ONE fixed axis for every FC, RATIO and INDEX, so riding INDEX adds sticks at
 * fixed places and RATIO widens or narrows the gaps in proportion. (It used to
 * be rebuilt from the current RATIO and INDEX, so riding INDEX slid every
 * stick and RATIO barely changed the gaps.)
 *
 * The mapping, strictly increasing, from 0 Hz to Nyquist:
 *  - 0 to FM_AXIS_KNEE_HZ (5 kHz) is LINEAR over the first 85 % of the plot.
 *    The opening voice (ratio 2, index 2) fits there whole at every carrier
 *    (its top stick is 4.84 kHz at FC 440), so equal ±k·fm gaps look equal.
 *  - 5 kHz to Nyquist is linear again, squeezed into the last 15 % (about 21×
 *    tighter). The screen draws that stretch with a dashed baseline and labels
 *    both ends, so the far sidebands of the extreme settings, and their red
 *    fold-backs, stay on the glass at the frequency where they really land.
 * Nothing is ever off the scale: after folding, every stick lies in 0..Nyquist.
 * Returns the fraction (0..1) of the plot width.
 */
export const FM_AXIS_KNEE_HZ = 5000;
export const FM_AXIS_KNEE_FRAC = 0.85;
export function fmAxisFrac(f: number, nyquist: number): number {
  const c = Math.min(nyquist, Math.max(0, f));
  if (c <= FM_AXIS_KNEE_HZ) return (c / FM_AXIS_KNEE_HZ) * FM_AXIS_KNEE_FRAC;
  return FM_AXIS_KNEE_FRAC + (1 - FM_AXIS_KNEE_FRAC) * ((c - FM_AXIS_KNEE_HZ) / (nyquist - FM_AXIS_KNEE_HZ));
}

/**
 * Sticks in the squeezed 5 kHz–Nyquist strip shorter than this (|J| < 0.01,
 * under 1 % of the |J| = 1 line) are not drawn (owner 2026-11-25, round 2):
 * there they are ~21× closer together, so a spray of hair-thin stubs reads as
 * a grey smear, not as tones. The linear 0–5 kHz part keeps every stick the
 * sideband maths keeps (|J| ≥ 0.004).
 */
export const FM_STRIP_MIN_A = 0.01;
export function fmStickShown(f: number, a: number): boolean {
  return f <= FM_AXIS_KNEE_HZ || a >= FM_STRIP_MIN_A;
}

/**
 * The axis numbers under the sticks (owner 2026-11-25, round 2). "0" and its
 * unit "Hz" at the left end; 1k…5k centred on their ticks; the Nyquist number
 * ("24k") anchored at its OWN tick, the right end, so it can never sit over
 * "5k" on a narrow glass (it used to stand 16 px left of the end to leave room
 * for "Hz"). A centred label that would touch a neighbour is left out, never
 * drawn on top of it. Widths are estimated at `charW` per character (11-pt
 * mono ≈ 6.6 px).
 */
export type FmAxisLabel = { text: string; x: number; anchor: 'start' | 'middle' | 'end' };
export const FM_AXIS_CHAR_W = 11 * 0.6;
export function fmAxisLabels(pad: number, plotW: number, nyquist: number, charW = FM_AXIS_CHAR_W, minGap = 3): FmAxisLabel[] {
  const kLabel = (f: number) => (f === 0 ? '0' : f >= 1000 ? `${+(f / 1000).toFixed(2)}k` : `${f}`);
  const span = (l: FmAxisLabel): [number, number] => {
    const w = l.text.length * charW;
    return l.anchor === 'start' ? [l.x, l.x + w] : l.anchor === 'end' ? [l.x - w, l.x] : [l.x - w / 2, l.x + w / 2];
  };
  const zero: FmAxisLabel = { text: '0', x: pad, anchor: 'start' };
  const unit: FmAxisLabel = { text: 'Hz', x: pad + charW + charW * 0.5, anchor: 'start' };
  const end: FmAxisLabel = { text: kLabel(nyquist), x: pad + plotW, anchor: 'end' };
  const out: FmAxisLabel[] = [zero, unit];
  for (let f = 1000; f <= FM_AXIS_KNEE_HZ; f += 1000) {
    const l: FmAxisLabel = { text: kLabel(f), x: pad + fmAxisFrac(f, nyquist) * plotW, anchor: 'middle' };
    const [a, b] = span(l);
    if (a - span(out[out.length - 1])[1] < minGap) continue;
    if (span(end)[0] - b < minGap) continue;
    out.push(l);
  }
  out.push(end);
  return out;
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
