/**
 * djDsp — the DJ Systems Lab's signal-processing kernels. Pure TypeScript on
 * Float32Array, in place where it saves a copy, no React Native. Sample rate
 * is the house SR (earDsp, 48 kHz), so every buffer the lab renders plays
 * through the same EarClipPlayer path as the Mixing and Drum Tuning labs.
 *
 * Every filter here is a DEFINED model, documented in docs/labs/dj/MODEL.md
 * and pinned by test/djRender.test.ts:
 *
 *   ISOLATOR (3-band, channel EQ)   two 4th-order Linkwitz-Riley crossovers
 *                                   (24 dB/oct) at 250 Hz and 2.5 kHz; the
 *                                   low band is phase-matched through the
 *                                   2.5 kHz all-pass, so the three bands sum
 *                                   flat. Output = gLo·low + gMid·mid +
 *                                   gHi·high; with every band at 0 dB the
 *                                   stage is skipped (no colour at
 *                                   "12 o'clock"), and a band at "kill" is
 *                                   removed.
 *   CHANNEL FILTER (one knob)       left of centre: 2-pole (12 dB/oct)
 *                                   low-pass swept 20 kHz → 200 Hz; right of
 *                                   centre: 2-pole high-pass swept 30 Hz →
 *                                   6 kHz; a small dead zone at centre is a
 *                                   true bypass. RESONANCE = the filter Q.
 *   RIAA                            the standard playback curve from its three
 *                                   time constants (3180 µs, 318 µs, 75 µs),
 *                                   0 dB at 1 kHz; the recording curve is its
 *                                   exact digital inverse.
 *   CLIP                            a hard clip at ±1.0 (0 dBFS in this model).
 *   PROTECTIVE LIMITER              listener protection ONLY, after every
 *                                   modelled stage: block-smoothed gain to a
 *                                   −1 dBFS ceiling, then a final clip at the
 *                                   ceiling. It never repairs a modelled clip —
 *                                   the clipped samples were already flat.
 */
import { SR, rbj, type Biquad } from '../../../../features/ear/earDsp.ts';

export { SR };
export type { Biquad };

/* ── biquads with state ───────────────────────────────────────────────── */

export type BqState = { x1: number; x2: number; y1: number; y2: number };
export const bqState = (): BqState => ({ x1: 0, x2: 0, y1: 0, y2: 0 });

/** Run a biquad over `x` IN PLACE, carrying `st` (so a stream can be cut
 *  into blocks without a click). */
export function biquadInPlace(x: Float32Array, c: Biquad, st: BqState, from = 0, to = x.length): void {
  let { x1, x2, y1, y2 } = st;
  const { b0, b1, b2, a1, a2 } = c;
  for (let i = from; i < to; i++) {
    const xi = x[i];
    const y = b0 * xi + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1;
    x1 = xi;
    y2 = y1;
    y1 = y;
    x[i] = y;
  }
  st.x1 = x1;
  st.x2 = x2;
  st.y1 = y1;
  st.y2 = y2;
}

/** Magnitude (linear) of a biquad at frequency `f`. */
export function biquadMag(c: Biquad, f: number): number {
  const w = (2 * Math.PI * f) / SR;
  const cr = Math.cos(w);
  const ci = -Math.sin(w);
  const c2r = Math.cos(2 * w);
  const c2i = -Math.sin(2 * w);
  const nr = c.b0 + c.b1 * cr + c.b2 * c2r;
  const ni = c.b1 * ci + c.b2 * c2i;
  const dr = 1 + c.a1 * cr + c.a2 * c2r;
  const di = c.a1 * ci + c.a2 * c2i;
  return Math.sqrt((nr * nr + ni * ni) / (dr * dr + di * di));
}

/** Complex response of a biquad at `f` as [re, im]. */
export function biquadResp(c: Biquad, f: number): [number, number] {
  const w = (2 * Math.PI * f) / SR;
  const cr = Math.cos(w);
  const ci = -Math.sin(w);
  const c2r = Math.cos(2 * w);
  const c2i = -Math.sin(2 * w);
  const nr = c.b0 + c.b1 * cr + c.b2 * c2r;
  const ni = c.b1 * ci + c.b2 * c2i;
  const dr = 1 + c.a1 * cr + c.a2 * c2r;
  const di = c.a1 * ci + c.a2 * c2i;
  const den = dr * dr + di * di;
  return [(nr * dr + ni * di) / den, (ni * dr - nr * di) / den];
}

const BUTTER_Q = Math.SQRT1_2;

/* ── the isolator ─────────────────────────────────────────────────────── */

/** Crossover points of the modelled 3-band isolator. */
export const ISO_LOW_HZ = 250;
export const ISO_HIGH_HZ = 2500;

const LP_L = rbj(ISO_LOW_HZ, BUTTER_Q, 0, 'lowpass');
const HP_L = rbj(ISO_LOW_HZ, BUTTER_Q, 0, 'highpass');
const LP_H = rbj(ISO_HIGH_HZ, BUTTER_Q, 0, 'lowpass');
const HP_H = rbj(ISO_HIGH_HZ, BUTTER_Q, 0, 'highpass');
/** The 2nd-order all-pass (Q = 1/√2) that an LR4 crossover sums to: the low
 *  band passes through the HIGH crossover's all-pass so all three bands stay
 *  in phase and the sum is flat. */
const AP_H: Biquad = (() => {
  const w0 = (2 * Math.PI * ISO_HIGH_HZ) / SR;
  const alpha = Math.sin(w0) / (2 * BUTTER_Q);
  const cw = Math.cos(w0);
  const a0 = 1 + alpha;
  return { b0: (1 - alpha) / a0, b1: (-2 * cw) / a0, b2: 1, a1: (-2 * cw) / a0, a2: (1 - alpha) / a0 };
})();

export type IsoState = { s: BqState[] };
export const isoState = (): IsoState => ({ s: Array.from({ length: 9 }, bqState) });

/** Linear band gains. */
export type IsoGains = { lo: number; mid: number; hi: number };

/**
 * The isolator, IN PLACE: low = LR4 low-pass at 250 Hz (then the 2.5 kHz
 * all-pass), mid = LR4 high-pass at 250 Hz then LR4 low-pass at 2.5 kHz,
 * high = LR4 high-pass at 250 Hz then LR4 high-pass at 2.5 kHz. With every
 * band at unity the sum is an all-pass (flat), so it is skipped outright —
 * the input passes untouched; a killed band is removed at 24 dB/oct.
 */
export function isolatorInPlace(x: Float32Array, g: IsoGains, st: IsoState): void {
  if (g.lo === 1 && g.mid === 1 && g.hi === 1) return;
  const s = st.s;
  const lo = x.slice();
  biquadInPlace(lo, LP_L, s[0]);
  biquadInPlace(lo, LP_L, s[1]);
  biquadInPlace(lo, AP_H, s[2]);
  const rest = x.slice();
  biquadInPlace(rest, HP_L, s[3]);
  biquadInPlace(rest, HP_L, s[4]);
  const mid = rest.slice();
  biquadInPlace(mid, LP_H, s[5]);
  biquadInPlace(mid, LP_H, s[6]);
  biquadInPlace(rest, HP_H, s[7]);
  biquadInPlace(rest, HP_H, s[8]);
  const gl = g.lo;
  const gm = g.mid;
  const gh = g.hi;
  for (let i = 0; i < x.length; i++) x[i] = gl * lo[i] + gm * mid[i] + gh * rest[i];
}

type Cx = [number, number];
const cmul = (a: Cx, b: Cx): Cx => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];

/** The isolator's magnitude response (linear) at `f` — the EQ plot on Screen 9
 *  is drawn from this, the same model the audio runs through. */
export function isolatorMag(g: IsoGains, f: number): number {
  const lpl = biquadResp(LP_L, f);
  const hpl = biquadResp(HP_L, f);
  const lph = biquadResp(LP_H, f);
  const hph = biquadResp(HP_H, f);
  const ap = biquadResp(AP_H, f);
  const lo = cmul(cmul(lpl, lpl), ap);
  const rest = cmul(hpl, hpl);
  const mid = cmul(rest, cmul(lph, lph));
  const hi = cmul(rest, cmul(hph, hph));
  const re = g.lo * lo[0] + g.mid * mid[0] + g.hi * hi[0];
  const im = g.lo * lo[1] + g.mid * mid[1] + g.hi * hi[1];
  return Math.sqrt(re * re + im * im);
}

/* ── the channel filter ───────────────────────────────────────────────── */

export const FILTER_DEAD_ZONE = 0.03;
export const FILTER_LP_MAX_HZ = 20000;
export const FILTER_LP_MIN_HZ = 200;
export const FILTER_HP_MIN_HZ = 30;
export const FILTER_HP_MAX_HZ = 6000;

export type FilterSetting = { kind: 'off' } | { kind: 'lp' | 'hp'; hz: number; q: number };

/** Knob (−1 … +1) → the filter it sets, exponential sweep. */
export function filterOf(knob: number, q = 0.9): FilterSetting {
  const k = Math.max(-1, Math.min(1, knob));
  if (Math.abs(k) <= FILTER_DEAD_ZONE) return { kind: 'off' };
  const t = (Math.abs(k) - FILTER_DEAD_ZONE) / (1 - FILTER_DEAD_ZONE);
  if (k < 0) return { kind: 'lp', hz: FILTER_LP_MAX_HZ * Math.pow(FILTER_LP_MIN_HZ / FILTER_LP_MAX_HZ, t), q };
  return { kind: 'hp', hz: FILTER_HP_MIN_HZ * Math.pow(FILTER_HP_MAX_HZ / FILTER_HP_MIN_HZ, t), q };
}

export function filterBiquad(f: FilterSetting): Biquad | null {
  if (f.kind === 'off') return null;
  return rbj(Math.min(f.hz, SR * 0.45), f.q, 0, f.kind === 'lp' ? 'lowpass' : 'highpass');
}

/** The filter's magnitude (linear) at `f`. */
export function filterMag(s: FilterSetting, f: number): number {
  const c = filterBiquad(s);
  return c ? biquadMag(c, f) : 1;
}

/* ── RIAA ─────────────────────────────────────────────────────────────── */

const T1 = 3180e-6;
const T2 = 318e-6;
const T3 = 75e-6;

/**
 * RIAA PLAYBACK (de-emphasis), 0 dB at 1 kHz: the 3180/318 µs shelf by the
 * bilinear transform, and the 75 µs pole by the matched z-transform (the
 * bilinear transform would pin a zero at 24 kHz and pull 20 kHz ~9 dB too
 * low). At 20 kHz it reads about −17 dB where the analog curve reads −19.6;
 * 20 Hz – 10 kHz is within about 1 dB.
 */
export const RIAA_PLAYBACK: Biquad = (() => {
  const K = 2 * SR;
  // (1 + s·T2) / (1 + s·T1)
  const n0 = T2 * K + 1;
  const n1 = 1 - T2 * K;
  const d0 = T1 * K + 1;
  const d1 = (1 - T1 * K) / d0;
  const p = Math.exp(-1 / (T3 * SR));
  const raw: Biquad = { b0: (n0 / d0) * (1 - p), b1: (n1 / d0) * (1 - p), b2: 0, a1: d1 - p, a2: -d1 * p };
  const g = biquadMag(raw, 1000);
  return { ...raw, b0: raw.b0 / g, b1: raw.b1 / g };
})();

/** RIAA RECORDING (pre-emphasis): the exact digital inverse of the playback
 *  curve (its zero is inside the unit circle, so the inverse is stable), so a
 *  record played into a phono input comes back flat. */
export const RIAA_RECORDING: Biquad = (() => {
  const c = RIAA_PLAYBACK;
  return { b0: 1 / c.b0, b1: c.a1 / c.b0, b2: c.a2 / c.b0, a1: c.b1 / c.b0, a2: c.b2 / c.b0 };
})();

/* ── level stages ─────────────────────────────────────────────────────── */

export const dbToLin = (db: number): number => (db <= -120 ? 0 : Math.pow(10, db / 20));
export const linToDb = (g: number): number => (g <= 1e-6 ? -120 : 20 * Math.log10(g));

/** Multiply in place. */
export function gainInPlace(x: Float32Array, g: number): void {
  if (g === 1) return;
  for (let i = 0; i < x.length; i++) x[i] *= g;
}

/** Hard clip at ±1 IN PLACE; returns how many samples were clipped. */
export function hardClipInPlace(x: Float32Array): number {
  let n = 0;
  for (let i = 0; i < x.length; i++) {
    const v = x[i];
    if (v > 1) {
      x[i] = 1;
      n++;
    } else if (v < -1) {
      x[i] = -1;
      n++;
    }
  }
  return n;
}

/** out += x × g */
export function mixInto(out: Float32Array, x: Float32Array, g: number): void {
  if (g === 0) return;
  const n = Math.min(out.length, x.length);
  for (let i = 0; i < n; i++) out[i] += x[i] * g;
}

/* ── the protective limiter (listener safety, after the model) ────────── */

export const LIMIT_CEILING_DB = -1;
const LIMIT_BLOCK = 64;
const LIMIT_RELEASE_S = 0.12;

/**
 * Peak limiter for the LISTENER, stereo, in place: a per-64-sample gain that
 * drops at once to what the next block needs and recovers with a 120 ms
 * release, interpolated per sample, then a final clip at the ceiling so no
 * sample can exceed it. Returns the deepest gain reduction in dB (≤ 0).
 * `st` carries the gain across contiguous blocks of one stream (the booth's
 * chunks), so a join never snaps the gain back to unity.
 */
export type LimiterState = { g: number };
export function protectiveLimitInPlace(l: Float32Array, r: Float32Array, ceilingDb = LIMIT_CEILING_DB, st?: LimiterState): number {
  const ceil = dbToLin(ceilingDb);
  const n = l.length;
  const blocks = Math.ceil(n / LIMIT_BLOCK);
  const need = new Float32Array(blocks + 1).fill(1);
  for (let b = 0; b < blocks; b++) {
    let pk = 0;
    const e = Math.min(n, (b + 1) * LIMIT_BLOCK);
    for (let i = b * LIMIT_BLOCK; i < e; i++) {
      const a = Math.abs(l[i]);
      const c = Math.abs(r[i]);
      if (a > pk) pk = a;
      if (c > pk) pk = c;
    }
    need[b] = pk > ceil ? ceil / pk : 1;
  }
  const rel = 1 - Math.exp(-LIMIT_BLOCK / (LIMIT_RELEASE_S * SR));
  const g = new Float32Array(blocks + 1);
  let cur = st ? st.g : 1;
  for (let b = 0; b <= blocks; b++) {
    // look one block ahead so the gain is already down when the peak lands
    const want = Math.min(need[b], b + 1 <= blocks ? need[b + 1] : 1);
    cur = want < cur ? want : cur + (want - cur) * rel;
    g[b] = cur;
  }
  let deepest = 1;
  for (let b = 0; b < blocks; b++) {
    const g0 = g[b];
    const g1 = g[b + 1];
    if (g0 < deepest) deepest = g0;
    const s = b * LIMIT_BLOCK;
    const e = Math.min(n, s + LIMIT_BLOCK);
    for (let i = s; i < e; i++) {
      const t = (i - s) / LIMIT_BLOCK;
      const gi = g0 + (g1 - g0) * t;
      let a = l[i] * gi;
      let c = r[i] * gi;
      if (a > ceil) a = ceil;
      else if (a < -ceil) a = -ceil;
      if (c > ceil) c = ceil;
      else if (c < -ceil) c = -ceil;
      l[i] = a;
      r[i] = c;
    }
  }
  if (st) st.g = g[blocks];
  return linToDb(deepest);
}

/* ── resampling (the tempo fader, no key lock) ────────────────────────── */

/** Linear-interpolation read of `src` at fractional positions start + i·rate. */
export function resampleLinear(src: Float32Array, rate: number, outLen: number, start = 0): Float32Array {
  const out = new Float32Array(outLen);
  const last = src.length - 1;
  for (let i = 0; i < outLen; i++) {
    const p = start + i * rate;
    const k = Math.floor(p);
    if (k >= last) {
      out[i] = k === last ? src[last] : 0;
      continue;
    }
    if (k < 0) continue;
    const f = p - k;
    out[i] = src[k] + (src[k + 1] - src[k]) * f;
  }
  return out;
}

/* ── oscillators and the state-variable filter (the synth) ────────────── */

/** PolyBLEP residual — removes most of a naive saw/square's aliasing. */
function polyBlep(t: number, dt: number): number {
  if (t < dt) {
    const x = t / dt;
    return x + x - x * x - 1;
  }
  if (t > 1 - dt) {
    const x = (t - 1) / dt;
    return x * x + x + x + 1;
  }
  return 0;
}

/** Band-limited sawtooth into `out` (added, × amp). */
export function addSaw(out: Float32Array, hz: number, amp: number, phase0 = 0, from = 0, to = out.length): void {
  const dt = hz / SR;
  let t = phase0 - Math.floor(phase0);
  for (let i = from; i < to; i++) {
    out[i] += amp * (2 * t - 1 - polyBlep(t, dt));
    t += dt;
    if (t >= 1) t -= 1;
  }
}

/** Band-limited square into `out` (added, × amp). */
export function addSquare(out: Float32Array, hz: number, amp: number, phase0 = 0): void {
  const dt = hz / SR;
  let t = phase0 - Math.floor(phase0);
  for (let i = 0; i < out.length; i++) {
    let v = t < 0.5 ? 1 : -1;
    v += polyBlep(t, dt);
    let t2 = t + 0.5;
    if (t2 >= 1) t2 -= 1;
    v -= polyBlep(t2, dt);
    out[i] += amp * v;
    t += dt;
    if (t >= 1) t -= 1;
  }
}

/** Sine into `out` (added). */
export function addSine(out: Float32Array, hz: number, amp: number, phase0 = 0): void {
  const w = (2 * Math.PI * hz) / SR;
  for (let i = 0; i < out.length; i++) out[i] += amp * Math.sin(phase0 + w * i);
}

/**
 * Topology-preserving state-variable low-pass, cutoff per sample from
 * `cutoffAt(i)`, IN PLACE. Q ≈ 0.5 … 4. (Used to voice the synth parts.)
 */
export function svfLowpassInPlace(x: Float32Array, cutoffAt: (i: number) => number, q: number): void {
  svfRun(x, cutoffAt, q, false);
}

/** The TPT state-variable core. The coefficients follow `fAt` every
 *  SVF_STEP samples (a voice's envelope moves far slower than that). */
const SVF_STEP = 16;
function svfRun(x: Float32Array, fAt: (i: number) => number, q: number, band: boolean): void {
  let ic1 = 0;
  let ic2 = 0;
  const k = 1 / q;
  let a1 = 0;
  let a2 = 0;
  let a3 = 0;
  for (let i = 0; i < x.length; i++) {
    if (i % SVF_STEP === 0) {
      const fc = Math.min(fAt(i), SR * 0.45);
      const g = Math.tan((Math.PI * fc) / SR);
      a1 = 1 / (1 + g * (g + k));
      a2 = g * a1;
      a3 = g * a2;
    }
    const v3 = x[i] - ic2;
    const v1 = a1 * ic1 + a2 * v3;
    const v2 = ic2 + a2 * ic1 + a3 * v3;
    ic1 = 2 * v1 - ic1;
    ic2 = 2 * v2 - ic2;
    x[i] = band ? v1 : v2;
  }
}

/** Band-pass flavour of the same filter (centre per sample), IN PLACE. */
export function svfBandpassInPlace(x: Float32Array, centreAt: (i: number) => number, q: number): void {
  svfRun(x, centreAt, q, true);
}

/** Deterministic noise (mulberry32). */
export function rng(seed: number): () => number {
  let s = (seed >>> 0) || 0x9e3779b9;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Peak (linear) of a buffer. */
export function peakOf(x: Float32Array): number {
  let p = 0;
  for (let i = 0; i < x.length; i++) {
    const a = Math.abs(x[i]);
    if (a > p) p = a;
  }
  return p;
}

/** RMS (linear) of a buffer. */
export function rmsOf(x: Float32Array, from = 0, to = x.length): number {
  let s = 0;
  for (let i = from; i < to; i++) s += x[i] * x[i];
  return Math.sqrt(s / Math.max(1, to - from));
}
