/**
 * buildPixelEnvelope — collapse waveform buckets into one min/max/rms per
 * screen pixel, WITHOUT losing peaks.
 *
 * ⛔ THE BUG THIS EXISTS TO PREVENT (owner 2026-09-20: "single transient
 * images are pulsing as they go across the screen").
 *
 * The native ring holds ~1200 buckets across 6 s — 5 ms each. At the 2/3/4 s
 * windows that is 400/600/800 buckets drawn across a ~350 px panel, so more
 * than one bucket lands on every pixel. The old code sampled the NEAREST
 * bucket per pixel (`buckets[Math.round(f)]`) and silently dropped the rest:
 * at the 4 s window more than half the captured audio was never drawn.
 *
 * For steady signal that is invisible — neighbouring buckets look alike. For a
 * TRANSIENT it is not: a clap lives in a handful of 5 ms buckets, and whether
 * the rounding happens to land on its loudest one changes every time the trace
 * scrolls. So the same clap is drawn tall, then short, then tall again as it
 * travels leftward — it pulses. Nothing about the sound changed; only which
 * buckets survived the sampling.
 *
 * The rule is the one every DAW and scope uses: a pixel shows the MIN OF THE
 * MINS and the MAX OF THE MAXES of everything that falls in it. A peak that
 * was captured is then always drawn, whatever the scroll offset, so the clap
 * holds its height all the way across.
 *
 * Where buckets are WIDER than a pixel the range collapses to a single bucket
 * and this returns exactly what sample-and-hold returned — the flat-topped
 * rectangular bars the owner asked for on 2026-08-01 are unchanged. The fix
 * only adds back what was being thrown away.
 *
 * (MultiMeterScreen's mini scope already decimated this way, and its comment
 * already said "no size pulsing". The full viewer never got the same
 * treatment.)
 */

/** The fields of a WaveBucket this display needs. */
export type EnvBucket = { min: number; max: number; rms: number };

export type PixelEnvelope = {
  /** Highest sample in each pixel column. Length width + 1. */
  max: Float32Array;
  /** Lowest sample in each pixel column. Length width + 1. */
  min: Float32Array;
  /** Loudest RMS in each pixel column. Length width + 1. */
  rms: Float32Array;
};

/**
 * @param buckets oldest → newest, exactly the run to fill the panel
 * @param width   panel width in whole pixels (columns 0…width inclusive)
 */
export function buildPixelEnvelope(buckets: readonly EnvBucket[], width: number): PixelEnvelope {
  const w = Math.max(0, Math.floor(width));
  const cols = w + 1;
  const max = new Float32Array(cols);
  const min = new Float32Array(cols);
  const rms = new Float32Array(cols);
  const n = buckets.length;
  if (n === 0 || cols === 0) return { max, min, rms };

  for (let px = 0; px < cols; px++) {
    // The half-open bucket span this pixel owns. This is the tiling
    // MultiMeterScreen's mini scope already uses: the spans butt up against
    // each other and together cover [0, n) exactly, so no bucket belongs to
    // no pixel — which is precisely what makes a peak impossible to miss.
    let lo = Math.floor((px * n) / cols);
    let hi = Math.floor(((px + 1) * n) / cols); // exclusive
    if (hi <= lo) hi = lo + 1; // buckets wider than a pixel: hold this one
    if (hi > n) hi = n;
    if (lo >= n) lo = n - 1;
    let mx = -Infinity;
    let mn = Infinity;
    let rm = 0;
    for (let k = lo; k < hi; k++) {
      const b = buckets[k];
      if (b.max > mx) mx = b.max;
      if (b.min < mn) mn = b.min;
      if (b.rms > rm) rm = b.rms;
    }
    max[px] = mx;
    min[px] = mn;
    rms[px] = rm;
  }
  return { max, min, rms };
}
