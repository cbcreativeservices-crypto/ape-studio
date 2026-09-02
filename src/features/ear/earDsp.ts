/**
 * earDsp — the Ear Training Lab's OFFLINE stimulus renderer (owner commission
 * 2026-09-02, spec: docs/APE_EAR_TRAINING_SPEC_2026_09_02.md).
 *
 * Pure math, zero React Native imports — every stimulus the lab plays is
 * rendered here as a PCM buffer, so:
 *   • every trial is fully parameterized and reproducible (seeded PRNG,
 *     no Math.random),
 *   • the SAME buffer that reaches the ear feeds the "see it" spectrum /
 *     waveform visuals (one source of truth — the visual can never disagree
 *     with the sound), and
 *   • the DSP is verifiable in Node: the build pipeline can FFT a rendered
 *     clip and PROVE "+6 dB @ 250 Hz" is really +6 dB @ 250 Hz before any
 *     human ever hears it (honesty §1.7, applied to audio).
 *
 * Fixed format: 48 kHz, Float32 internally, 16-bit PCM WAV out, mono or
 * stereo. Clips are short (1.5–6 s) — buffers stay ≤ ~1.2 MB.
 *
 * Numerical conventions:
 *   • levels in dBFS; loudness matching normalizes clips to a target RMS
 *     (−20 dBFS default) so nothing but Module 8 ever tests "louder",
 *   • band-limited waveforms by construction (additive partials below
 *     Nyquist) — a naive square would alias audibly and teach a lie,
 *   • every edge gets a raised-cosine fade (default 8 ms) — clicks are a
 *     stimulus in the DEFECTS module, never an accident elsewhere.
 */

export const SR = 48_000;

export type Mono = Float32Array;
export type Stereo = { l: Float32Array; r: Float32Array };
export type Buf = Mono | Stereo;

export const isStereo = (b: Buf): b is Stereo => !(b instanceof Float32Array);

/* ── deterministic PRNG (xorshift32) — trials must be reproducible ───────── */

export function makeRng(seed: number): () => number {
  // mulberry32 — unlike raw xorshift32, its per-call increment + double
  // finalizer decorrelates the FIRST draws of nearby seeds. That matters:
  // trial factories draw the answer from the first rng() call, and
  // consecutive seeds were rolling the same first quartile for hundreds of
  // seeds in a row (caught by scripts/verify-ear-modules.mjs).
  let s = (seed >>> 0) || 0x9e3779b9;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ── oscillators ─────────────────────────────────────────────────────────── */

export function sine(freq: number, seconds: number, phase = 0): Mono {
  const n = Math.round(seconds * SR);
  const out = new Float32Array(n);
  const w = (2 * Math.PI * freq) / SR;
  for (let i = 0; i < n; i++) out[i] = Math.sin(phase + w * i);
  return out;
}

/** Band-limited classic waves via additive synthesis (partials < Nyquist). */
export function classicWave(kind: 'square' | 'saw' | 'triangle', freq: number, seconds: number): Mono {
  const n = Math.round(seconds * SR);
  const out = new Float32Array(n);
  const maxK = Math.floor(SR / 2 / freq);
  const w = (2 * Math.PI * freq) / SR;
  for (let k = 1; k <= maxK; k++) {
    let amp = 0;
    if (kind === 'square') {
      if (k % 2 === 1) amp = 1 / k;
    } else if (kind === 'saw') {
      amp = ((k % 2 === 0 ? -1 : 1) * 1) / k;
    } else {
      // triangle: odd harmonics, 1/k², alternating sign
      if (k % 2 === 1) amp = ((((k - 1) / 2) % 2 === 0 ? 1 : -1) * 1) / (k * k);
    }
    if (amp === 0) continue;
    for (let i = 0; i < n; i++) out[i] += amp * Math.sin(w * k * i);
  }
  return normalizePeak(out, 0.9);
}

/** A small harmonic complex — the lab's neutral "program-like" test signal
 *  (richer than a sine so EQ/reverb/compression have something to grab). */
export function harmonicComplex(f0: number, seconds: number, brightness = 0.6): Mono {
  const n = Math.round(seconds * SR);
  const out = new Float32Array(n);
  const w = (2 * Math.PI * f0) / SR;
  const maxK = Math.min(16, Math.floor(SR / 2 / f0));
  for (let k = 1; k <= maxK; k++) {
    const amp = 1 / Math.pow(k, 2 - brightness); // brightness tilts the series
    for (let i = 0; i < n; i++) out[i] += amp * Math.sin(w * k * i + k * 0.7);
  }
  return normalizePeak(out, 0.9);
}

/* ── noise colours ───────────────────────────────────────────────────────── */

export function whiteNoise(seconds: number, rng: () => number): Mono {
  const n = Math.round(seconds * SR);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = rng() * 2 - 1;
  return out;
}

/** Pink via Paul Kellet's economy filter (−3 dB/oct, accurate ±0.5 dB). */
export function pinkNoise(seconds: number, rng: () => number): Mono {
  const n = Math.round(seconds * SR);
  const out = new Float32Array(n);
  let b0 = 0, b1 = 0, b2 = 0;
  for (let i = 0; i < n; i++) {
    const w = rng() * 2 - 1;
    b0 = 0.99765 * b0 + w * 0.099046;
    b1 = 0.963 * b1 + w * 0.2965164;
    b2 = 0.57 * b2 + w * 1.0526913;
    out[i] = (b0 + b1 + b2 + w * 0.1848) * 0.2;
  }
  return out;
}

/** Brown: integrated white with a DC-blocking leak (−6 dB/oct). */
export function brownNoise(seconds: number, rng: () => number): Mono {
  const n = Math.round(seconds * SR);
  const out = new Float32Array(n);
  let acc = 0;
  for (let i = 0; i < n; i++) {
    acc = 0.998 * acc + (rng() * 2 - 1) * 0.05;
    out[i] = acc;
  }
  return normalizePeak(out, 0.9);
}

/* ── RBJ biquads (Audio EQ Cookbook) ─────────────────────────────────────── */

export type Biquad = { b0: number; b1: number; b2: number; a1: number; a2: number };

function rbj(freq: number, q: number, gainDb: number, type: 'peak' | 'lowshelf' | 'highshelf' | 'notch' | 'lowpass' | 'highpass'): Biquad {
  const A = Math.pow(10, gainDb / 40);
  const w0 = (2 * Math.PI * freq) / SR;
  const cw = Math.cos(w0);
  const sw = Math.sin(w0);
  const alpha = sw / (2 * q);
  let b0 = 1, b1 = 0, b2 = 0, a0 = 1, a1 = 0, a2 = 0;
  if (type === 'peak') {
    b0 = 1 + alpha * A; b1 = -2 * cw; b2 = 1 - alpha * A;
    a0 = 1 + alpha / A; a1 = -2 * cw; a2 = 1 - alpha / A;
  } else if (type === 'lowshelf' || type === 'highshelf') {
    const s = Math.sqrt(A) * 2 * Math.sqrt(alpha * sw); // 2*sqrt(A)*alpha with S=1 form folded in
    const sgn = type === 'lowshelf' ? 1 : -1;
    b0 = A * (A + 1 - sgn * (A - 1) * cw + s);
    b1 = sgn * 2 * A * (A - 1 - sgn * (A + 1) * cw);
    b2 = A * (A + 1 - sgn * (A - 1) * cw - s);
    a0 = A + 1 + sgn * (A - 1) * cw + s;
    a1 = sgn * -2 * (A - 1 + sgn * (A + 1) * cw);
    a2 = A + 1 + sgn * (A - 1) * cw - s;
  } else if (type === 'notch') {
    b0 = 1; b1 = -2 * cw; b2 = 1;
    a0 = 1 + alpha; a1 = -2 * cw; a2 = 1 - alpha;
  } else if (type === 'lowpass') {
    b0 = (1 - cw) / 2; b1 = 1 - cw; b2 = (1 - cw) / 2;
    a0 = 1 + alpha; a1 = -2 * cw; a2 = 1 - alpha;
  } else {
    b0 = (1 + cw) / 2; b1 = -(1 + cw); b2 = (1 + cw) / 2;
    a0 = 1 + alpha; a1 = -2 * cw; a2 = 1 - alpha;
  }
  return { b0: b0 / a0, b1: b1 / a0, b2: b2 / a0, a1: a1 / a0, a2: a2 / a0 };
}

export const peakEq = (freq: number, gainDb: number, q = 1.4) => rbj(freq, q, gainDb, 'peak');
export const lowShelf = (freq: number, gainDb: number) => rbj(freq, 0.9, gainDb, 'lowshelf');
export const highShelf = (freq: number, gainDb: number) => rbj(freq, 0.9, gainDb, 'highshelf');
export const notch = (freq: number, q = 8) => rbj(freq, q, 0, 'notch');
export const lowpass = (freq: number, q = 0.707) => rbj(freq, q, 0, 'lowpass');
export const highpass = (freq: number, q = 0.707) => rbj(freq, q, 0, 'highpass');

export function applyBiquad(x: Mono, c: Biquad): Mono {
  const out = new Float32Array(x.length);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) {
    const y = c.b0 * x[i] + c.b1 * x1 + c.b2 * x2 - c.a1 * y1 - c.a2 * y2;
    x2 = x1; x1 = x[i]; y2 = y1; y1 = y;
    out[i] = y;
  }
  return out;
}

/* ── time-domain tools ───────────────────────────────────────────────────── */

/** Raised-cosine fade at both edges (clicks belong only to the defect module). */
export function fadeEdges(x: Mono, ms = 8): Mono {
  const f = Math.min(Math.round((ms / 1000) * SR), Math.floor(x.length / 2));
  for (let i = 0; i < f; i++) {
    const g = 0.5 - 0.5 * Math.cos((Math.PI * i) / f);
    x[i] *= g;
    x[x.length - 1 - i] *= g;
  }
  return x;
}

/** Mix a delayed copy in (feedforward): comb filtering / slapback / echoes. */
export function mixDelayed(x: Mono, delayMs: number, gain: number): Mono {
  const d = Math.round((delayMs / 1000) * SR);
  const out = new Float32Array(x.length);
  for (let i = 0; i < x.length; i++) out[i] = x[i] + (i >= d ? gain * x[i - d] : 0);
  return out;
}

/** Feedback comb (reverb building block). */
function combFb(x: Mono, delaySamp: number, feedback: number, damp: number): Mono {
  const out = new Float32Array(x.length);
  const buf = new Float32Array(delaySamp);
  let idx = 0, store = 0;
  for (let i = 0; i < x.length; i++) {
    const y = buf[idx];
    store = y * (1 - damp) + store * damp;
    buf[idx] = x[i] + store * feedback;
    idx = (idx + 1) % delaySamp;
    out[i] = y;
  }
  return out;
}

/** Schroeder allpass. */
function allpass(x: Mono, delaySamp: number, g = 0.5): Mono {
  const out = new Float32Array(x.length);
  const buf = new Float32Array(delaySamp);
  let idx = 0;
  for (let i = 0; i < x.length; i++) {
    const bufOut = buf[idx];
    const y = -g * x[i] + bufOut;
    buf[idx] = x[i] + g * bufOut;
    idx = (idx + 1) % delaySamp;
    out[i] = y;
  }
  return out;
}

export type ReverbSpace = 'room' | 'hall' | 'plate' | 'chamber' | 'spring';

/** Nominal broadband RT60 (s) per space — the spec's table. Used when a
 *  caller doesn't name a decay, and quoted in feedback copy. */
export const REVERB_RT60: Record<ReverbSpace, number> = { room: 0.4, chamber: 1.0, hall: 2.2, plate: 1.6, spring: 1.8 };

/** Schroeder reverb, parameterized per space — an EMULATION and labeled so in
 *  the UI. `rt60Sec` is the broadband decay time the render is BUILT to have:
 *  each comb's feedback is solved from its own delay (fb = 10^(−3·d/RT60)) so
 *  every comb decays at the same rate and a quoted "≈1.2 s" is true by
 *  construction. (Previously one shared feedback per space was scaled by a
 *  loose "decay" factor — a "medium hall" then rang ~3 s while the copy
 *  claimed 1.2 s, and "long" pegged the same 0.92 for every space.)
 *  `bright` (0..1) sets the in-loop damping tilt: the HF part of the tail
 *  dies faster than RT60 says, the LF part decays at RT60. */
export function reverb(x: Mono, space: ReverbSpace, rt60Sec = REVERB_RT60[space], bright = 0.5, wet = 0.45): Mono {
  // Comb delays (ms) per space character; spring gets short, boingy, sparse.
  const COMBS: Record<ReverbSpace, number[]> = {
    room: [29.7, 37.1, 41.1, 43.7],
    hall: [50.0, 56.0, 61.0, 68.0, 72.0, 78.0],
    plate: [23.0, 26.7, 31.1, 33.7, 36.3, 39.7],
    chamber: [36.0, 41.0, 47.0, 53.0],
    spring: [31.0, 33.5, 36.0],
  };
  const damp = 0.6 - bright * 0.45;
  const rt = Math.max(0.1, rt60Sec);
  let wetSum: Mono = new Float32Array(x.length);
  for (const ms of COMBS[space]) {
    const d = Math.max(8, Math.round((ms / 1000) * SR));
    // 60 dB of loss after RT60/d passes → per-pass gain 10^(−3·d/RT60).
    const fb = Math.min(0.95, Math.pow(10, (-3 * (d / SR)) / rt));
    const c = combFb(x, d, fb, damp);
    for (let i = 0; i < x.length; i++) wetSum[i] += c[i] / COMBS[space].length;
  }
  wetSum = allpass(wetSum, Math.round(0.005 * SR));
  wetSum = allpass(wetSum, Math.round(0.0017 * SR));
  if (space === 'spring') {
    // The spring's signature "drip": ripple the wet path with a slow chirped AM.
    for (let i = 0; i < x.length; i++) wetSum[i] *= 1 + 0.35 * Math.sin(2 * Math.PI * 6 * (i / SR) + Math.sin(2 * Math.PI * 1.3 * (i / SR)) * 3);
  }
  const out = new Float32Array(x.length);
  for (let i = 0; i < x.length; i++) out[i] = (1 - wet) * x[i] + wet * wetSum[i];
  return out;
}

/** Offline compressor: envelope follower + static curve (+ optional pumping
 *  via over-slow release against a beating stimulus). makeup matches RMS. */
export function compress(x: Mono, ratio: number, thresholdDb: number, attackMs: number, releaseMs: number): Mono {
  const out = new Float32Array(x.length);
  const atk = Math.exp(-1 / ((attackMs / 1000) * SR));
  const rel = Math.exp(-1 / ((releaseMs / 1000) * SR));
  let env = 0;
  for (let i = 0; i < x.length; i++) {
    const a = Math.abs(x[i]);
    env = a > env ? atk * env + (1 - atk) * a : rel * env + (1 - rel) * a;
    const envDb = 20 * Math.log10(Math.max(env, 1e-9));
    const over = envDb - thresholdDb;
    const gainDb = over > 0 ? -over * (1 - 1 / ratio) : 0;
    out[i] = x[i] * Math.pow(10, gainDb / 20);
  }
  return matchRms(out, x);
}

/** Clipping. hard: brick wall at `drive`-scaled full scale; soft: tanh. */
export function clip(x: Mono, kind: 'hard' | 'soft', driveDb: number): Mono {
  const g = Math.pow(10, driveDb / 20);
  const out = new Float32Array(x.length);
  for (let i = 0; i < x.length; i++) {
    const v = x[i] * g;
    out[i] = kind === 'hard' ? Math.max(-1, Math.min(1, v)) : Math.tanh(v);
  }
  return matchRms(out, x);
}

/* ── levels ──────────────────────────────────────────────────────────────── */

export function rms(x: Mono): number {
  let s = 0;
  for (let i = 0; i < x.length; i++) s += x[i] * x[i];
  return Math.sqrt(s / x.length);
}

export const rmsDb = (x: Mono): number => 20 * Math.log10(Math.max(rms(x), 1e-9));

export function gainDb(x: Mono, db: number): Mono {
  const g = Math.pow(10, db / 20);
  const out = new Float32Array(x.length);
  for (let i = 0; i < x.length; i++) out[i] = x[i] * g;
  return out;
}

/** Normalize RMS to a target dBFS — the loudness-matching rule: every trial
 *  stimulus lands at the SAME loudness unless the module is ABOUT loudness. */
export function normalizeRms(x: Mono, targetDb = -20): Mono {
  return gainDb(x, targetDb - rmsDb(x));
}

export function matchRms(x: Mono, ref: Mono): Mono {
  return gainDb(x, rmsDb(ref) - rmsDb(x));
}

export function normalizePeak(x: Mono, peak = 0.98): Mono {
  let m = 0;
  for (let i = 0; i < x.length; i++) m = Math.max(m, Math.abs(x[i]));
  if (m < 1e-9) return x;
  const g = peak / m;
  for (let i = 0; i < x.length; i++) x[i] *= g;
  return x;
}

/* ── stereo ──────────────────────────────────────────────────────────────── */

export function toStereo(x: Mono): Stereo {
  return { l: Float32Array.from(x), r: Float32Array.from(x) };
}

/** Constant-power pan: −1 hard left … +1 hard right. */
export function pan(x: Mono, p: number): Stereo {
  const a = ((p + 1) / 2) * (Math.PI / 2);
  const l = Math.cos(a), r = Math.sin(a);
  const L = new Float32Array(x.length), R = new Float32Array(x.length);
  for (let i = 0; i < x.length; i++) { L[i] = x[i] * l; R[i] = x[i] * r; }
  return { l: L, r: R };
}

/** Width via M/S scaling: 0 = mono, 1 = as-is, >1 = wider. Needs a stereo
 *  source with actual differences (use decorrelate first). */
export function width(s: Stereo, w: number): Stereo {
  const L = new Float32Array(s.l.length), R = new Float32Array(s.l.length);
  for (let i = 0; i < s.l.length; i++) {
    const m = (s.l[i] + s.r[i]) / 2;
    const d = ((s.l[i] - s.r[i]) / 2) * w;
    L[i] = m + d; R[i] = m - d;
  }
  return { l: L, r: R };
}

/** Decorrelated stereo from one mono source (short complementary allpasses). */
export function decorrelate(x: Mono): Stereo {
  return { l: allpass(Float32Array.from(x), 113, 0.45), r: allpass(Float32Array.from(x), 173, 0.45) };
}

export function invertChannel(s: Stereo, ch: 'l' | 'r'): Stereo {
  const t = Float32Array.from(s[ch]);
  for (let i = 0; i < t.length; i++) t[i] = -t[i];
  return ch === 'l' ? { l: t, r: s.r } : { l: s.l, r: t };
}

export function sumToMono(s: Stereo): Mono {
  const out = new Float32Array(s.l.length);
  for (let i = 0; i < s.l.length; i++) out[i] = (s.l[i] + s.r[i]) / 2;
  return out;
}

/* ── defects (module 6 recipes) ──────────────────────────────────────────── */

export function hum(seconds: number, mainsHz: 50 | 60, harmonics = 3): Mono {
  const n = Math.round(seconds * SR);
  const out = new Float32Array(n);
  for (let k = 1; k <= harmonics; k++) {
    const w = (2 * Math.PI * mainsHz * k) / SR;
    const amp = 1 / (k * k); // hum: fundamental-dominated
    for (let i = 0; i < n; i++) out[i] += amp * Math.sin(w * i);
  }
  return normalizePeak(out, 0.9);
}

/** Buzz: mains-locked but edge-rich (high harmonic content — SCR/dimmer). */
export function buzz(seconds: number, mainsHz: 50 | 60): Mono {
  const n = Math.round(seconds * SR);
  const out = new Float32Array(n);
  const maxK = Math.floor(SR / 2 / mainsHz);
  for (let k = 1; k <= Math.min(maxK, 60); k++) {
    const w = (2 * Math.PI * mainsHz * k) / SR;
    for (let i = 0; i < n; i++) out[i] += Math.sin(w * i) / k;
  }
  return normalizePeak(out, 0.9);
}

export function crackle(x: Mono, rng: () => number, density = 0.0006, ampl = 0.5): Mono {
  const out = Float32Array.from(x);
  for (let i = 0; i < out.length; i++) {
    if (rng() < density) {
      const a = (rng() * 2 - 1) * ampl;
      out[i] += a;
      if (i + 1 < out.length) out[i + 1] -= a * 0.6;
    }
  }
  return out;
}

export function dropout(x: Mono, atSec: number, lengthMs: number): Mono {
  const out = Float32Array.from(x);
  const s = Math.round(atSec * SR);
  const e = Math.min(out.length, s + Math.round((lengthMs / 1000) * SR));
  const f = Math.round(0.002 * SR);
  for (let i = s; i < e; i++) out[i] = 0;
  for (let i = 0; i < f; i++) {
    if (s - f + i >= 0) out[s - f + i] *= 1 - i / f;
    if (e + i < out.length) out[e + i] *= i / f;
  }
  return out;
}

export function digitalGlitch(x: Mono, rng: () => number, blocks = 3): Mono {
  const out = Float32Array.from(x);
  const blockLen = Math.round(0.02 * SR);
  for (let b = 0; b < blocks; b++) {
    const at = Math.floor(rng() * (out.length - blockLen * 4));
    for (let r = 1; r <= 2; r++)
      for (let i = 0; i < blockLen; i++) out[at + r * blockLen + i] = out[at + i]; // stuck-buffer repeat
  }
  return out;
}

/** RF interference (emulation): the GSM-handset-near-a-cable buzz. A TDMA
 *  frame is 4.615 ms (217 Hz) and a handset transmits in one of its eight
 *  slots (577 µs). Audio circuitry ENVELOPE-DETECTS the RF, so what reaches
 *  the ear is the unipolar burst envelope itself — a 217 Hz pulse train
 *  with harmonics to a few kHz (the classic "dit-dit-dit" buzz), with the
 *  idle frame every 26th (the 8.3 Hz multiframe rhythm). A little in-burst
 *  ripple and noise keep it buzzy rather than clean. The previous render
 *  pulsed at 46 Hz, which is not the sound anyone knows. Mean-removed so the
 *  unipolar pulses add no DC to the program. */
export function rfInterference(x: Mono, rng: () => number): Mono {
  const period = SR / 217; // samples per TDMA frame (≈221)
  const burst = Math.round(period / 8); // one slot ≈ 577 µs
  const sig = new Float32Array(x.length);
  let mean = 0;
  for (let i = 0; i < sig.length; i++) {
    const frame = Math.floor(i / period);
    if (frame % 26 === 25) continue; // idle frame — the multiframe gap
    const k = i - frame * period;
    if (k >= burst) continue;
    const env = Math.sin((Math.PI * (k + 0.5)) / burst); // half-sine slot envelope
    const ripple = 0.7 + 0.3 * Math.sin((2 * Math.PI * 1400 * i) / SR);
    sig[i] = 0.3 * env * ripple + 0.05 * (rng() * 2 - 1) * env;
    mean += sig[i];
  }
  mean /= sig.length;
  const out = Float32Array.from(x);
  for (let i = 0; i < out.length; i++) out[i] += sig[i] - mean;
  return out;
}

/* ── WAV encode (16-bit PCM little-endian) ───────────────────────────────── */

export function encodeWav(buf: Buf): Uint8Array {
  const stereo = isStereo(buf);
  const n = stereo ? buf.l.length : (buf as Mono).length;
  const ch = stereo ? 2 : 1;
  const dataLen = n * ch * 2;
  const out = new Uint8Array(44 + dataLen);
  const dv = new DataView(out.buffer);
  const str = (o: number, s: string) => { for (let i = 0; i < s.length; i++) out[o + i] = s.charCodeAt(i); };
  str(0, 'RIFF'); dv.setUint32(4, 36 + dataLen, true); str(8, 'WAVE');
  str(12, 'fmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, ch, true);
  dv.setUint32(24, SR, true); dv.setUint32(28, SR * ch * 2, true); dv.setUint16(32, ch * 2, true); dv.setUint16(34, 16, true);
  str(36, 'data'); dv.setUint32(40, dataLen, true);
  let o = 44;
  const put = (v: number) => {
    const c = Math.max(-1, Math.min(1, v));
    dv.setInt16(o, Math.round(c * 32767), true);
    o += 2;
  };
  if (stereo) for (let i = 0; i < n; i++) { put(buf.l[i]); put(buf.r[i]); }
  else for (let i = 0; i < n; i++) put((buf as Mono)[i]);
  return out;
}

/* ── analysis (the "see it" visuals + build-time verification) ───────────── */

/** Radix-2 FFT power spectrum in dB (Hann window), for the post-answer
 *  "see it" mini-spectrum and for Node-side verification of renders. */
export function powerSpectrumDb(x: Mono, fftSize = 8192, offset = 0): { freqs: Float32Array; db: Float32Array } {
  const N = fftSize;
  const re = new Float32Array(N);
  const im = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const w = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / N);
    re[i] = (x[offset + i] ?? 0) * w;
  }
  // in-place iterative radix-2
  for (let i = 1, j = 0; i < N; i++) {
    let bit = N >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { const tr = re[i]; re[i] = re[j]; re[j] = tr; const ti = im[i]; im[i] = im[j]; im[j] = ti; }
  }
  for (let len = 2; len <= N; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < N; i += len) {
      let cwr = 1, cwi = 0;
      for (let k = 0; k < len / 2; k++) {
        const ur = re[i + k], ui = im[i + k];
        const vr = re[i + k + len / 2] * cwr - im[i + k + len / 2] * cwi;
        const vi = re[i + k + len / 2] * cwi + im[i + k + len / 2] * cwr;
        re[i + k] = ur + vr; im[i + k] = ui + vi;
        re[i + k + len / 2] = ur - vr; im[i + k + len / 2] = ui - vi;
        const nwr = cwr * wr - cwi * wi;
        cwi = cwr * wi + cwi * wr; cwr = nwr;
      }
    }
  }
  const bins = N / 2;
  const freqs = new Float32Array(bins);
  const db = new Float32Array(bins);
  for (let i = 0; i < bins; i++) {
    freqs[i] = (i * SR) / N;
    db[i] = 10 * Math.log10((re[i] * re[i] + im[i] * im[i]) / (N * N) + 1e-20);
  }
  return { freqs, db };
}

/** Band energy in dB around a centre frequency (for verification asserts). */
export function bandDb(x: Mono, centreHz: number, octaves = 1 / 3): number {
  const { freqs, db } = powerSpectrumDb(x);
  const lo = centreHz * Math.pow(2, -octaves / 2);
  const hi = centreHz * Math.pow(2, octaves / 2);
  let acc = 0, cnt = 0;
  for (let i = 0; i < freqs.length; i++) {
    if (freqs[i] >= lo && freqs[i] <= hi) { acc += Math.pow(10, db[i] / 10); cnt++; }
  }
  return cnt ? 10 * Math.log10(acc / cnt) : -120;
}
