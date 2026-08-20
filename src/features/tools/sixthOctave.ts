/**
 * sixthOctave — 1/6-octave (61-band) RTA derived from the fine FFT spectrum.
 *
 * Shared by the RTA tool and the Pro Audio MultiMeter (owner rev 24: the
 * MultiMeter defaults to 61 bands). The native engine only delivers 1/1 and 1/3
 * octave frames, so 1/6-octave is derived here: bin powers ENERGY-SUMMED per
 * band, an exponential α applied to the summed POWER (matching the native band
 * path), a client-side peak hold, and the same honest resolvability gate as the
 * native `resolvable` flag — a band is gray unless ≥1 bin lands in it AND its
 * bandwidth spans at least one bin at this FFT size.
 */

export type DisplayBands = {
  centers: number[];
  levelsDb: number[];
  peakHoldDb: number[];
  resolvable: boolean[];
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
  const binCount = new Int32Array(SIXTH_BANDS);
  const nyquist = sampleRate / 2;
  for (let i = 1; i < spec.length; i++) {
    const f = i * hzPerBin;
    if (f > nyquist) break;
    const k = Math.round(6 * Math.log2(f / 20));
    if (k < 0 || k >= SIXTH_BANDS) continue;
    power[k] += Math.pow(10, spec[i] / 10);
    binCount[k] += 1;
  }
  const first = smoothRef.current == null;
  const sm = smoothRef.current ?? Float64Array.from(power);
  smoothRef.current = sm;
  const levelsDb: number[] = [];
  const peakHoldDb: number[] = [];
  const resolvable: boolean[] = [];
  for (let k = 0; k < SIXTH_BANDS; k++) {
    const widthHz = SIXTH_CENTERS[k] * (SIXTH_EDGE - 1 / SIXTH_EDGE);
    const ok = binCount[k] >= 1 && widthHz >= hzPerBin;
    resolvable.push(ok);
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
  return { centers: SIXTH_CENTERS, levelsDb, peakHoldDb, resolvable };
}
