/**
 * hubGenNoise — the Tools hub signal-generator preview's NOISE trace, as pure
 * TypeScript (no React Native) so a node test reaches the very numbers the
 * tile draws (test/traceTimeBaseOthers_20261122.test.ts).
 *
 * Owner, 2026-11-22: "the wave form transforms after the present moment which
 * look odd. Once a wave form has happend, it should not become some other
 * waveform later in time...."
 *
 * The tile used to show two FIXED noise traces cross-fading into each other in
 * a 340 ms loop, so the drawn noise morphed in place. Now it is ONE noise
 * signal: one seeded value per sample index k (every GEN_NOISE_STEP canvas
 * units), lightly smoothed as before, and the trace slides across the tile at
 * the same speed as the periodic shapes. A point keeps its value until it
 * leaves the tile.
 *
 * The sequence is PERIODIC over GEN_NOISE_PERIOD samples (= one plot width,
 * 1800 units), so the scroll loop wraps with no visible jump and no stretch of
 * noise is ever on the glass twice at once. The smoothing is run over two
 * periods and the second pass kept, so the value after the last sample is the
 * filter's own continuation into the first.
 */

/** Deterministic LCG (the SignalGenDemo constants). */
export function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

/** Canvas units between two noise samples (the old trace's step). */
export const GEN_NOISE_STEP = 9;
/** Samples in one period of the noise. */
export const GEN_NOISE_PERIOD = 200;
/** One period in canvas units: the scroll loop's length (one plot width). */
export const GEN_NOISE_LOOP = GEN_NOISE_STEP * GEN_NOISE_PERIOD;
/** The seed the tile draws (the old trace A's seed). */
export const GEN_NOISE_SEED = 0xc0ffee;

/** One period of the smoothed noise, each value in −1 … +1. */
export function genNoiseSamples(seed: number = GEN_NOISE_SEED, period: number = GEN_NOISE_PERIOD): number[] {
  const rng = makeRng(seed);
  const raw: number[] = [];
  for (let k = 0; k < period; k++) raw.push(rng() * 2 - 1);
  const out: number[] = new Array(period).fill(0);
  let acc = 0;
  for (let pass = 0; pass < 2; pass++) {
    for (let k = 0; k < period; k++) {
      // Lightly smoothed white noise so the trace reads as broadband, not spikes.
      acc = acc * 0.35 + raw[k] * 0.85;
      if (pass === 1) out[k] = Math.max(-1, Math.min(1, acc));
    }
  }
  return out;
}

/** The value of sample index k (any integer): the periodic sequence. */
export function genNoiseAt(samples: readonly number[], k: number): number {
  const n = samples.length;
  return samples[((k % n) + n) % n];
}

/** The noise trace across the plot plus one loop length (the scroll's extra
 *  width), in plot-local canvas units: y = mid − v·amp. */
export function genNoisePath(samples: readonly number[], plotW: number, mid: number, amp: number): string {
  const parts: string[] = [];
  const last = Math.round((plotW + GEN_NOISE_LOOP) / GEN_NOISE_STEP);
  for (let k = 0; k <= last; k++) {
    const x = k * GEN_NOISE_STEP;
    const y = mid - genNoiseAt(samples, k) * amp;
    parts.push(`${k === 0 ? 'M' : 'L'}${x} ${y.toFixed(1)}`);
  }
  return parts.join('');
}

/** What the tile draws at plot-local x (canvas units) when the loop is at
 *  fraction s ∈ [0, 1] (the layer is translated left by s·GEN_NOISE_LOOP):
 *  the trace's value at path position x + s·loop, linear between samples. */
export function genNoiseDrawnAt(samples: readonly number[], x: number, s: number): number {
  const u = (x + s * GEN_NOISE_LOOP) / GEN_NOISE_STEP;
  const k = Math.floor(u);
  const fr = u - k;
  const a = genNoiseAt(samples, k);
  const b = genNoiseAt(samples, k + 1);
  return a + (b - a) * fr;
}
