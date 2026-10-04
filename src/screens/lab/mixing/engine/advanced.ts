/**
 * Advanced Mixing — the ADVANCED TRUTH ENGINE (owner GO 2026-09-11).
 * Pure math the AML pages execute against, pinned by
 * test/mixingAdvanced.test.ts:
 *
 *  • Phase & alignment: comb-filter notch/peak frequencies for a two-path
 *    delay, sample-domain correlation, polarity-vs-delay distinction.
 *  • Mid/side: encode/decode, width, and the mono-collapse truth (S vanishes).
 *  • Loudness: a BS.1770-STYLE gated loudness ESTIMATE (K-weighting biquads +
 *    400 ms blocks + absolute/relative gating) and a 4× oversampled true-peak
 *    ESTIMATE. Labeled estimates on-screen — teaching measurement concepts,
 *    never claiming certified metering (§1.7 honesty).
 *  • Stems: buffer summing + a null test in dB, so "do the stems reconstruct
 *    the mix?" is a measured fact — including WHY nonlinear mix-bus
 *    processing breaks reconstruction.
 */
import {
  SR,
  applyBiquad,
  rbj,
  type Biquad,
  type Mono,
  type Stereo,
} from '../../../../features/ear/earDsp.ts';

/* ── Phase, polarity, alignment ──────────────────────────────────────────── */

/** Comb filter from summing a signal with itself delayed by `ms`:
 *  CANCELLATION notches at f = (2k+1)/(2·Δt); REINFORCEMENT peaks at k/Δt.
 *  The first notch is the one engineers hear as "hollow". */
export function combNotchesHz(ms: number, count = 4): number[] {
  const dt = ms / 1000;
  return Array.from({ length: count }, (_, k) => (2 * k + 1) / (2 * dt));
}

export function combPeaksHz(ms: number, count = 4): number[] {
  const dt = ms / 1000;
  return Array.from({ length: count }, (_, k) => (k + 1) / dt);
}

/** Pearson correlation of two buffers — the meter's −1…+1. +1 dual-mono,
 *  0 unrelated, −1 polarity-inverted copy. */
export function correlation(a: Mono, b: Mono): number {
  const n = Math.min(a.length, b.length);
  let sa = 0;
  let sb = 0;
  for (let i = 0; i < n; i++) {
    sa += a[i] * a[i];
    sb += b[i] * b[i];
  }
  if (sa < 1e-12 || sb < 1e-12) return 0;
  let sab = 0;
  for (let i = 0; i < n; i++) sab += a[i] * b[i];
  return sab / Math.sqrt(sa * sb);
}

/** The distinction section 8 teaches: POLARITY flip is a mirror (fixes a
 *  mis-wired pair exactly); DELAY is time (no flip fixes it — you align it).
 *  Returns what actually nulls against the original. */
export function nullsWhenSummed(kind: 'polarityFlip' | 'delayed', _ms?: number): boolean {
  return kind === 'polarityFlip';
}

/* ── Mid/side ────────────────────────────────────────────────────────────── */

export function encodeMidSide(s: Stereo): { m: Mono; side: Mono } {
  const n = s.l.length;
  const m = new Float32Array(n);
  const side = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    m[i] = (s.l[i] + s.r[i]) / 2;
    side[i] = (s.l[i] - s.r[i]) / 2;
  }
  return { m, side };
}

export function decodeMidSide(m: Mono, side: Mono, widthAmount = 1): Stereo {
  const n = m.length;
  const l = new Float32Array(n);
  const r = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const sw = side[i] * widthAmount;
    l[i] = m[i] + sw;
    r[i] = m[i] - sw;
  }
  return { l, r };
}

/* ── Loudness (BS.1770-style ESTIMATE) ───────────────────────────────────── */

// K-weighting per ITU-R BS.1770: a high-shelf (+4 dB, ~1.68 kHz) then a
// high-pass (~38 Hz). At the house rate (48 kHz) these are the PUBLISHED
// BS.1770 coefficients (pre-filter + RLB), normalised to a0 = 1; at any other
// rate the rbj approximations stand in. Still a labeled ESTIMATE, never
// certified metering (mastering-lab audio review 2026-10-01, finding 12).
const kShelf: Biquad = SR === 48000
  ? { b0: 1.53512485958697, b1: -2.69169618940638, b2: 1.19839281085285, a1: -1.69065929318241, a2: 0.73248077421585 }
  : rbj(1681, 0.7071, 3.99958, 'highshelf');
const kHp: Biquad = SR === 48000
  ? { b0: 1, b1: -2, b2: 1, a1: -1.99004745483398, a2: 0.99007225036621 }
  : rbj(38.135, 0.5, 0, 'highpass');

function kWeight(x: Mono): Mono {
  return applyBiquad(applyBiquad(x, kShelf), kHp);
}

/** Integrated loudness ESTIMATE (LUFS): K-weighted 400 ms blocks, 75%
 *  overlap, −70 LUFS absolute gate then −10 LU relative gate — the BS.1770
 *  procedure in miniature. */
export function loudnessLufsEstimate(s: Stereo): number {
  const l = kWeight(s.l);
  const r = kWeight(s.r);
  const block = Math.round(0.4 * SR);
  const hop = Math.round(0.1 * SR);
  const blocks: number[] = [];
  for (let start = 0; start + block <= l.length; start += hop) {
    let sum = 0;
    for (let i = start; i < start + block; i++) sum += l[i] * l[i] + r[i] * r[i];
    const ms = sum / block; // channel-summed mean square (BS.1770 weights L=R=1)
    blocks.push(-0.691 + 10 * Math.log10(Math.max(ms, 1e-12)));
  }
  if (blocks.length === 0) return -Infinity;
  const abs = blocks.filter((b) => b > -70);
  if (abs.length === 0) return -Infinity;
  const mean1 = abs.reduce((a, b) => a + Math.pow(10, (b + 0.691) / 10), 0) / abs.length;
  const gate = -0.691 + 10 * Math.log10(mean1) - 10;
  const kept = abs.filter((b) => b > gate);
  if (kept.length === 0) return -Infinity;
  const mean2 = kept.reduce((a, b) => a + Math.pow(10, (b + 0.691) / 10), 0) / kept.length;
  return -0.691 + 10 * Math.log10(mean2);
}

/** True-peak ESTIMATE via 4× linear-phase-ish oversampling (windowed-sinc,
 *  8-tap): catches inter-sample peaks a plain sample peak misses. */
export function truePeakDbEstimate(s: Stereo): number {
  const OS = 4;
  const TAPS = 8;
  let peak = 0;
  const consider = (x: Mono) => {
    for (let i = 0; i < x.length; i++) {
      const a = Math.abs(x[i]);
      if (a > peak) peak = a;
    }
    for (let i = 0; i < x.length - 1; i++) {
      for (let p = 1; p < OS; p++) {
        const frac = p / OS;
        let v = 0;
        for (let t = -TAPS / 2 + 1; t <= TAPS / 2; t++) {
          const idx = i + t;
          if (idx < 0 || idx >= x.length) continue;
          const d = frac - t;
          const sinc = d === 0 ? 1 : Math.sin(Math.PI * d) / (Math.PI * d);
          const win = 0.5 + 0.5 * Math.cos((Math.PI * d) / (TAPS / 2));
          v += x[idx] * sinc * win;
        }
        const a = Math.abs(v);
        if (a > peak) peak = a;
      }
    }
  };
  consider(s.l);
  consider(s.r);
  return 20 * Math.log10(Math.max(peak, 1e-9));
}

/**
 * truePeakDbEstimate with the sinc and window factors computed ONCE instead of
 * per sample (perf hunt 2026-10-03; the Mastering lab's truePeakDbFast, Labs B,
 * mirrored here). The estimate above evaluates Math.sin + Math.cos 24 times per
 * sample — ~21 M trig calls for a 10 s stereo mix, ~0.5 s in Node and several
 * times that on the phone, all before MEASURE THE MIX could show a number.
 * Same factors, same multiplication order (x·sinc·win), same additions in the
 * same order and the same skipped out-of-range taps: bit-identical (pinned in
 * test/perfLabsA_20261003.test.ts). truePeakDbEstimate stays as the reference.
 */
const TP_OS = 4;
const TP_TAPS = 8;
const TP_SINC: number[][] = [];
const TP_WIN: number[][] = [];
for (let p = 1; p < TP_OS; p++) {
  const frac = p / TP_OS;
  const sincRow: number[] = [];
  const winRow: number[] = [];
  for (let t = -TP_TAPS / 2 + 1; t <= TP_TAPS / 2; t++) {
    const d = frac - t;
    sincRow.push(d === 0 ? 1 : Math.sin(Math.PI * d) / (Math.PI * d));
    winRow.push(0.5 + 0.5 * Math.cos((Math.PI * d) / (TP_TAPS / 2)));
  }
  TP_SINC.push(sincRow);
  TP_WIN.push(winRow);
}

export function truePeakDbFast(s: Stereo): number {
  const T0 = -TP_TAPS / 2 + 1;
  let peak = 0;
  const consider = (x: Mono) => {
    const n = x.length;
    for (let i = 0; i < n; i++) {
      const a = Math.abs(x[i]);
      if (a > peak) peak = a;
    }
    for (let i = 0; i < n - 1; i++) {
      const edge = i + T0 < 0 || i + TP_TAPS / 2 >= n;
      for (let p = 0; p < TP_OS - 1; p++) {
        const sinc = TP_SINC[p];
        const win = TP_WIN[p];
        let v = 0;
        for (let k = 0; k < TP_TAPS; k++) {
          const idx = i + T0 + k;
          if (edge && (idx < 0 || idx >= n)) continue;
          v += x[idx] * sinc[k] * win[k];
        }
        const a = Math.abs(v);
        if (a > peak) peak = a;
      }
    }
  };
  consider(s.l);
  consider(s.r);
  return 20 * Math.log10(Math.max(peak, 1e-9));
}

/* ── Stems & reconstruction ──────────────────────────────────────────────── */

export function sumStereo(parts: readonly Stereo[]): Stereo {
  const n = parts[0]?.l.length ?? 0;
  const l = new Float32Array(n);
  const r = new Float32Array(n);
  for (const p of parts) {
    for (let i = 0; i < n; i++) {
      l[i] += p.l[i];
      r[i] += p.r[i];
    }
  }
  return { l, r };
}

/** Null test: RMS (dB) of (a − b). ≤ −60 dB reads as a reconstruction pass;
 *  a nonlinear mix-bus stage leaves an audible residue — the section-16
 *  lesson, measured. */
export function nullResidueDb(a: Stereo, b: Stereo): number {
  const n = Math.min(a.l.length, b.l.length);
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const dl = a.l[i] - b.l[i];
    const dr = a.r[i] - b.r[i];
    sum += dl * dl + dr * dr;
  }
  return 10 * Math.log10(Math.max(sum / (2 * n), 1e-18));
}
