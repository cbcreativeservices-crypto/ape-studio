/**
 * resample — band-limited sample-rate conversion to the DSP rate (48 kHz) plus
 * small channel/length helpers for decoded recordings (2026-10-01).
 *
 * Pure (Node-testable), no native code — ships OTA.
 *
 * METHOD: polyphase windowed-sinc. The ratio is reduced to L/M; when L is
 * small (44.1 k ↔ 48 k is 160/147) every output phase gets its own exact
 * Kaiser-windowed sinc row, normalised to unity DC gain. Odd ratios with a
 * huge L fall back to 2048 phase rows with linear interpolation between them.
 *
 * DESIGN (default `quality`):
 *   passband edge  P = min(20 kHz, 0.45 · min(fsIn, fsOut))
 *   stopband edge  S = min(fsIn, fsOut) − P
 *   cutoff         (P + S) / 2  = min(fsIn, fsOut) / 2
 *   Kaiser, A = 100 dB stopband (β ≈ 10.06)
 * S is chosen so that every alias/image of passband content that would land
 * back at or below P is in the stopband: for 44.1 → 48 the image of 20 kHz
 * sits at 24.1 kHz, so 0–20 kHz is flat (≪ 0.01 dB) and anything that can fold
 * into the audible band is ≥ 100 dB down by design (the test measures it).
 * Content between P and the source Nyquist (20–22.05 kHz) may image into
 * 22–24 kHz — ultrasonic, by construction.
 *
 * COST: ~70 taps per output sample at 44.1 ↔ 48 k. All current lab assets are
 * already 48 kHz, so on the live path this is a no-op copy-free return.
 */
import { SR } from '../ear/earDsp';

export const DSP_RATE = SR; // 48 000

export interface ResampleOptions {
  /** Stopband attenuation in dB (default 100). */
  attenuationDb?: number;
  /** Passband edge in Hz (default min(20 kHz, 0.45 · min rate)). */
  passHz?: number;
}

function gcd(a: number, b: number): number {
  while (b) [a, b] = [b, a % b];
  return a;
}

/** Zeroth-order modified Bessel function of the first kind (series). */
function besselI0(x: number): number {
  let sum = 1;
  let term = 1;
  const q = (x * x) / 4;
  for (let k = 1; k < 64; k++) {
    term *= q / (k * k);
    sum += term;
    if (term < sum * 1e-17) break;
  }
  return sum;
}

export interface ResampleKernel {
  /** Reduced ratio: out/in = L/M. */
  L: number;
  M: number;
  /** Phase rows actually stored. */
  phases: number;
  /** Taps per row (2 · half). */
  taps: number;
  half: number;
  /** phases × taps, row-major. Row p is the filter for fractional offset p/phases. */
  table: Float32Array;
  exact: boolean;
}

const kernelCache = new Map<string, ResampleKernel>();

/** Build (or reuse) the polyphase kernel for inRate → outRate. */
export function resampleKernel(inRate: number, outRate: number, opts: ResampleOptions = {}): ResampleKernel {
  const A = opts.attenuationDb ?? 100;
  const minRate = Math.min(inRate, outRate);
  const pass = opts.passHz ?? Math.min(20000, 0.45 * minRate);
  const stop = minRate - pass;
  const key = `${inRate}/${outRate}/${A}/${pass}`;
  const hit = kernelCache.get(key);
  if (hit) return hit;

  const g = gcd(inRate, outRate);
  const L = outRate / g;
  const M = inRate / g;
  const exact = L <= 2048;
  const phases = exact ? L : 2048;

  // Filter designed in INPUT-sample time. Cutoff as a fraction of fsIn.
  const fc = (pass + stop) / 2 / inRate; // cycles per input sample
  const dw = (2 * Math.PI * (stop - pass)) / inRate; // transition, rad/sample
  const n = Math.ceil((A - 8) / (2.285 * dw)) + 1;
  const half = Math.max(4, Math.ceil(n / 2));
  const taps = 2 * half;
  const beta = A > 50 ? 0.1102 * (A - 8.7) : A >= 21 ? 0.5842 * (A - 21) ** 0.4 + 0.07886 * (A - 21) : 0;
  const i0b = besselI0(beta);

  // Row p, tap j: input sample (i0 - half + 1 + j) for output at i0 + p/phases.
  // Distance from that tap to the output instant: t = (j - half + 1) - p/phases.
  const table = new Float32Array(phases * taps);
  for (let p = 0; p < phases; p++) {
    const frac = p / phases;
    let sum = 0;
    const row = p * taps;
    for (let j = 0; j < taps; j++) {
      const t = j - half + 1 - frac;
      const r = t / half;
      const w = Math.abs(r) >= 1 ? 0 : besselI0(beta * Math.sqrt(1 - r * r)) / i0b;
      const x = 2 * fc * t;
      const sinc = x === 0 ? 1 : Math.sin(Math.PI * x) / (Math.PI * x);
      const h = 2 * fc * sinc * w;
      table[row + j] = h;
      sum += h;
    }
    // Unity DC gain per phase — keeps the passband exactly flat at DC and
    // removes the tiny per-phase gain ripple that would otherwise modulate.
    const inv = sum !== 0 ? 1 / sum : 0;
    for (let j = 0; j < taps; j++) table[row + j] *= inv;
  }
  const k: ResampleKernel = { L, M, phases, taps, half, table, exact };
  if (kernelCache.size > 8) kernelCache.clear();
  kernelCache.set(key, k);
  return k;
}

/** Output length for `frames` input frames: round(frames · out / in). */
export function resampledLength(frames: number, inRate: number, outRate: number): number {
  return Math.round((frames * outRate) / inRate);
}

/** Resample output samples [from, to) of one channel into `out`. */
function runKernel(x: Float32Array, out: Float32Array, k: ResampleKernel, from: number, to: number): void {
  const { L, M, phases, taps, half, table, exact } = k;
  const nIn = x.length;
  for (let n = from; n < to; n++) {
    // Input-time position of output n is n·M/L = i0 + rem/L.
    const num = n * M;
    const i0 = Math.floor(num / L);
    const rem = num - i0 * L;
    const base = i0 - half + 1;
    let acc = 0;
    if (exact) {
      const row = rem * taps;
      if (base >= 0 && base + taps <= nIn) {
        for (let j = 0; j < taps; j++) acc += table[row + j] * x[base + j];
      } else {
        for (let j = 0; j < taps; j++) {
          const idx = base + j;
          if (idx >= 0 && idx < nIn) acc += table[row + j] * x[idx];
        }
      }
    } else {
      const pos = (rem / L) * phases;
      const p0 = Math.floor(pos);
      const w = pos - p0;
      const r0 = p0 * taps;
      // Phase `phases` (frac = 1) is phase 0 one input sample later.
      const wrap = p0 + 1 >= phases;
      const r1 = wrap ? 0 : (p0 + 1) * taps;
      const shift = wrap ? 1 : 0;
      for (let j = 0; j < taps; j++) {
        const idx = base + j;
        const a = idx >= 0 && idx < nIn ? x[idx] : 0;
        const idx1 = idx + shift;
        const b1 = idx1 >= 0 && idx1 < nIn ? x[idx1] : 0;
        acc += (1 - w) * table[r0 + j] * a + w * table[r1 + j] * b1;
      }
    }
    out[n] = acc;
  }
}

/**
 * Resample channels from `inRate` to `outRate` (default 48 kHz). Returns the
 * SAME arrays when the rates already match (no copy).
 */
export function resample(
  channels: readonly Float32Array[],
  inRate: number,
  outRate: number = DSP_RATE,
  opts?: ResampleOptions,
): Float32Array[] {
  if (inRate === outRate) return channels as Float32Array[];
  if (!(inRate > 0) || !(outRate > 0)) throw new RangeError('Sample rates must be positive');
  const k = resampleKernel(inRate, outRate, opts);
  return channels.map((x) => {
    const out = new Float32Array(resampledLength(x.length, inRate, outRate));
    runKernel(x, out, k, 0, out.length);
    return out;
  });
}

/**
 * Same as resample(), but yields to the event loop every `sliceFrames` output
 * frames so a long file never freezes the JS thread (the 2026-09-11
 * device-freeze class). Honours an AbortSignal between slices.
 */
export async function resampleAsync(
  channels: readonly Float32Array[],
  inRate: number,
  outRate: number = DSP_RATE,
  opts?: ResampleOptions & { sliceFrames?: number; signal?: AbortSignal },
): Promise<Float32Array[]> {
  if (inRate === outRate) return channels as Float32Array[];
  if (!(inRate > 0) || !(outRate > 0)) throw new RangeError('Sample rates must be positive');
  const k = resampleKernel(inRate, outRate, opts);
  const slice = Math.max(1024, opts?.sliceFrames ?? 24000);
  const outs: Float32Array[] = [];
  for (const x of channels) {
    const out = new Float32Array(resampledLength(x.length, inRate, outRate));
    for (let from = 0; from < out.length; from += slice) {
      runKernel(x, out, k, from, Math.min(out.length, from + slice));
      await new Promise<void>((r) => setTimeout(r, 0));
      if (opts?.signal?.aborted) throw new Error('aborted');
    }
    outs.push(out);
  }
  return outs;
}

// ————————————————————————————— channel / length helpers —————————————————————

/** Average all channels to one (equal weight). One channel → that channel. */
export function toMono(channels: readonly Float32Array[]): Float32Array {
  if (channels.length === 0) return new Float32Array(0);
  if (channels.length === 1) return channels[0];
  const n = channels[0].length;
  const out = new Float32Array(n);
  const g = 1 / channels.length;
  for (const ch of channels) for (let i = 0; i < n; i++) out[i] += ch[i] * g;
  return out;
}

/** Exactly two channels: mono is duplicated (shared, not copied); > 2 keeps the first two. */
export function ensureStereo(channels: readonly Float32Array[]): [Float32Array, Float32Array] {
  if (channels.length === 0) return [new Float32Array(0), new Float32Array(0)];
  if (channels.length === 1) return [channels[0], channels[0]];
  return [channels[0], channels[1]];
}

/** Frames [start, end) of every channel (clamped). Subarray views — no copy. */
export function trim(channels: readonly Float32Array[], startFrame: number, endFrame?: number): Float32Array[] {
  return channels.map((ch) => {
    const s = Math.max(0, Math.min(ch.length, Math.floor(startFrame)));
    const e = Math.max(s, Math.min(ch.length, Math.floor(endFrame ?? ch.length)));
    return ch.subarray(s, e);
  });
}

/**
 * `frames` frames starting at `startFrame`, wrapping around the end of the
 * clip when it is shorter than needed (a 4 s chord can feed a 6 s trial).
 * `crossfadeFrames` blends the wrap seam (linear) so the loop does not click.
 * Always returns fresh arrays.
 */
export function loopSlice(
  channels: readonly Float32Array[],
  startFrame: number,
  frames: number,
  crossfadeFrames = 0,
): Float32Array[] {
  return channels.map((ch) => {
    const n = ch.length;
    const out = new Float32Array(Math.max(0, Math.floor(frames)));
    if (n === 0) return out;
    const s = ((Math.floor(startFrame) % n) + n) % n;
    if (s + out.length <= n) {
      out.set(ch.subarray(s, s + out.length));
      return out;
    }
    const xf = Math.max(0, Math.min(Math.floor(crossfadeFrames), Math.floor(n / 2)));
    // Walk the clip; at each seam the last `xf` frames fade out while the
    // first `xf` fade in, and reading resumes at frame `xf` — so every pass
    // after the first is n − xf frames long and seamless. A start already
    // inside the fade zone just runs to the end and wraps hard once.
    let p = s;
    let fadeAt = s < n - xf ? n - xf : n;
    let i = 0;
    while (i < out.length) {
      if (p < fadeAt) {
        out[i++] = ch[p++];
        continue;
      }
      if (fadeAt === n || xf === 0) {
        p = 0;
      } else {
        for (let k = 0; k < xf && i < out.length; k++) {
          const t = k / xf;
          out[i++] = ch[n - xf + k] * (1 - t) + ch[k] * t;
        }
        p = xf;
      }
      fadeAt = n - xf;
    }
    return out;
  });
}
