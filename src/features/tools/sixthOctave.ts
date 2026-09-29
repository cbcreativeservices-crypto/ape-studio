/**
 * sixthOctave — 1/6-octave (61-band) RTA derived from the fine FFT spectrum.
 *
 * Shared by the RTA tool and the Pro Audio MultiMeter (owner rev 24: the
 * MultiMeter defaults to 61 bands). The native engine only delivers 1/1 and 1/3
 * octave frames, so 1/6-octave is derived here: bin powers ENERGY-SUMMED per
 * band, an exponential α applied to the summed POWER (matching the native band
 * path) and a client-side peak hold. Sub-bin bands (the low end) are shown,
 * flagged `estimated` (owner 2026-09-29) — see deriveSixthOctave.
 */

export type DisplayBands = {
  centers: number[];
  levelsDb: number[];
  peakHoldDb: number[];
  resolvable: boolean[];
  /** Band narrower than one FFT bin — its level comes from the bin it shares
   *  (see deriveSixthOctave). Only the 61-band derivation sets it. */
  estimated?: boolean[];
};

export const SIXTH_BANDS = 61;
/** 1/6-oct centres, 20 Hz × 2^(k/6) → 20 Hz … 20.48 kHz (log-even). */
export const SIXTH_CENTERS: number[] = Array.from({ length: SIXTH_BANDS }, (_, k) => 20 * Math.pow(2, k / 6));
/** Band edges at centre × 2^(±1/12). */
export const SIXTH_EDGE = Math.pow(2, 1 / 12);
/** Sentinel well under any display floor — gray bands carry it so no bar/tick
 *  can ever render for them. */
export const NO_LEVEL = -999;

/**
 * Aggregate one REAL fine-spectrum frame (dBFS per bin) into the 61 bands.
 * `smoothRef` (the summed-power EMA state) and `hold` (the peak-hold array) are
 * caller-owned so each screen keeps its own running state; pass a fresh
 * `smoothRef.current = null` and `hold.fill(NO_LEVEL)` to reset.
 */
export function deriveSixthOctave(
  spec: Float32Array,
  sampleRate: number,
  fftSize: number,
  alpha: number,
  smoothRef: { current: Float64Array | null },
  hold: Float64Array,
): DisplayBands {
  const hzPerBin = sampleRate / fftSize;
  const power = new Float64Array(SIXTH_BANDS);
  const nyquist = sampleRate / 2;
  // LOW END ALWAYS SHOWN (owner 2026-09-29: "I use the RTA in my class to show
  // low end rumble — I want those low Hz to be showing always"). The sub-bass
  // 1/6-oct bands (20–50 Hz at FFT 8192) are NARROWER than one FFT bin, so
  // they used to be grayed as unresolvable. Each bin's power is now shared out
  // by OVERLAP: a bin covering [(i−½)Δf, (i+½)Δf] gives each band the fraction
  // of its width that band spans. That is the band's energy under the bin's
  // own (flat) density — a real measurement at the FFT's coarser resolution,
  // not a fabricated value — and for wide bands it equals the old energy sum.
  // Bands narrower than a bin are flagged `estimated` so the screen can say so.
  const lo = new Float64Array(SIXTH_BANDS);
  const hi = new Float64Array(SIXTH_BANDS);
  for (let k = 0; k < SIXTH_BANDS; k++) {
    lo[k] = SIXTH_CENTERS[k] / SIXTH_EDGE;
    hi[k] = SIXTH_CENTERS[k] * SIXTH_EDGE;
  }
  let k0 = 0;
  for (let i = 1; i < spec.length; i++) {
    const bLo = (i - 0.5) * hzPerBin;
    const bHi = (i + 0.5) * hzPerBin;
    if (bLo >= nyquist || bLo >= hi[SIXTH_BANDS - 1]) break;
    const p = Math.pow(10, spec[i] / 10);
    while (k0 < SIXTH_BANDS && hi[k0] <= bLo) k0++;
    for (let k = k0; k < SIXTH_BANDS && lo[k] < bHi; k++) {
      const overlap = Math.min(bHi, hi[k]) - Math.max(bLo, lo[k]);
      if (overlap > 0) power[k] += p * (overlap / hzPerBin);
    }
  }
  const first = smoothRef.current == null;
  const sm = smoothRef.current ?? Float64Array.from(power);
  smoothRef.current = sm;
  const levelsDb: number[] = [];
  const peakHoldDb: number[] = [];
  const resolvable: boolean[] = [];
  const estimated: boolean[] = [];
  for (let k = 0; k < SIXTH_BANDS; k++) {
    // Gray only where NO bin reaches the band at all (above Nyquist, or below
    // the first bin's lower edge) — there is genuinely nothing to show there.
    const ok = hi[k] > 0.5 * hzPerBin && lo[k] < nyquist;
    resolvable.push(ok);
    estimated.push(ok && hi[k] - lo[k] < hzPerBin);
    if (!ok) {
      levelsDb.push(NO_LEVEL);
      peakHoldDb.push(NO_LEVEL);
      continue;
    }
    if (!first) sm[k] += alpha * (power[k] - sm[k]);
    const db = sm[k] > 0 ? 10 * Math.log10(sm[k]) : NO_LEVEL;
    if (db > hold[k]) hold[k] = db;
    levelsDb.push(db);
    peakHoldDb.push(hold[k]);
  }
  return { centers: SIXTH_CENTERS, levelsDb, peakHoldDb, resolvable, estimated };
}
