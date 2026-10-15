/**
 * speechSignals — REAL audio for the Speech & Voice Lab's waveform and
 * spectrum pictures (owner 2026-10-14: "the whole speech lab's animations all
 * need upgrading"; standing rule: never draw stylized audio — every waveform is
 * real audio at a real sample rate, drawn min/max per column).
 *
 * A small, classic source–filter (Klatt-style) formant synthesizer:
 *   glottal source (Rosenberg flow pulses at f0, differentiated for lip
 *   radiation) → cascade of two-pole resonators at the vowel's formants.
 * Noise (bursts, aspiration, breath, hiss) is seeded white noise shaped by the
 * same resonators, so every picture is reproducible and testable.
 *
 * Pure: no React, no audio output. Sample rate 16 kHz (enough for the 0–8 kHz
 * a speech picture needs). Every value is a TYPICAL teaching value.
 */

export const SPEECH_SR = 16000;

/** Seeded uniform noise in [-1, 1) (mulberry32). */
export function noiseGen(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (((t ^ (t >>> 14)) >>> 0) / 4294967296) * 2 - 1;
  };
}

/** One two-pole resonator (Klatt 1980) applied in place: centre f, bandwidth bw (Hz). */
export function resonate(x: Float64Array, f: number, bw: number, sr = SPEECH_SR): Float64Array {
  const T = 1 / sr;
  const C = -Math.exp(-2 * Math.PI * bw * T);
  const B = 2 * Math.exp(-Math.PI * bw * T) * Math.cos(2 * Math.PI * f * T);
  const A = 1 - B - C;
  const y = new Float64Array(x.length);
  let y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) {
    const v = A * x[i] + B * y1 + C * y2;
    y[i] = v;
    y2 = y1;
    y1 = v;
  }
  return y;
}

/** First-order high-pass (a capsule / preamp's low-frequency roll-off). */
export function highPass(x: Float64Array, fc: number, sr = SPEECH_SR): Float64Array {
  const rc = 1 / (2 * Math.PI * fc), dt = 1 / sr, a = rc / (rc + dt);
  const y = new Float64Array(x.length);
  for (let i = 1; i < x.length; i++) y[i] = a * (y[i - 1] + x[i] - x[i - 1]);
  return y;
}

export type Formant = [hz: number, bwHz: number];

/** Typical adult-male formants (Peterson & Barney style means) + F4. */
export const VOWEL_FORMANTS: Record<'a' | 'e' | 'i' | 'o' | 'u' | 'schwa', Formant[]> = {
  a: [[730, 90], [1090, 110], [2440, 170], [3400, 250], [4500, 300]],
  e: [[530, 70], [1840, 110], [2480, 160], [3400, 250], [4500, 300]],
  i: [[270, 60], [2290, 100], [3010, 170], [3600, 250], [4500, 300]],
  o: [[570, 80], [840, 90], [2410, 160], [3400, 250], [4500, 300]],
  u: [[300, 60], [870, 90], [2240, 160], [3400, 250], [4500, 300]],
  schwa: [[500, 80], [1500, 110], [2500, 160], [3500, 250], [4500, 300]],
};

/**
 * Glottal source: Rosenberg flow pulses (open 40 %, closing 8 % of each
 * period), differentiated (lip radiation). `f0At(t)` gives the pitch at time t
 * (s), so a voice can glide. Amplitude is unnormalized.
 */
export function glottalSource(n: number, f0At: (t: number) => number, sr = SPEECH_SR): Float64Array {
  const flow = new Float64Array(n);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const f0 = f0At(i / sr);
    const p = phase;
    const tp = 0.4, tn = 0.08;
    flow[i] = p < tp ? 0.5 * (1 - Math.cos((Math.PI * p) / tp)) : p < tp + tn ? Math.cos((Math.PI * (p - tp)) / (2 * tn)) : 0;
    phase += f0 / sr;
    if (phase >= 1) phase -= 1;
  }
  const d = new Float64Array(n);
  for (let i = 1; i < n; i++) d[i] = flow[i] - flow[i - 1];
  return d;
}

/** Pass a signal through a cascade of formant resonators. */
export function throughFormants(x: Float64Array, formants: Formant[], sr = SPEECH_SR): Float64Array {
  let y = x;
  for (const [f, bw] of formants) y = resonate(y, f, bw, sr);
  return y;
}

export function peakOf(x: Float64Array): number {
  let p = 0;
  for (let i = 0; i < x.length; i++) p = Math.max(p, Math.abs(x[i]));
  return p;
}

export function scaleTo(x: Float64Array, peak: number): Float64Array {
  const p = peakOf(x) || 1;
  const y = new Float64Array(x.length);
  for (let i = 0; i < x.length; i++) y[i] = (x[i] / p) * peak;
  return y;
}

/** A sustained vowel at f0 (with a slight natural pitch drift), peak 1. */
export function vowelWave(durS: number, vowel: keyof typeof VOWEL_FORMANTS = 'a', f0 = 120, sr = SPEECH_SR): Float64Array {
  const n = Math.round(durS * sr);
  const src = glottalSource(n, (t) => f0 * (1 + 0.025 * Math.sin(2 * Math.PI * 2.1 * t)), sr);
  return scaleTo(throughFormants(src, VOWEL_FORMANTS[vowel], sr), 1);
}

/** Band-shaped noise: white noise through resonators at the given centres. */
export function shapedNoise(n: number, shape: Formant[], seed: number, sr = SPEECH_SR): Float64Array {
  const r = noiseGen(seed);
  const w = new Float64Array(n);
  for (let i = 0; i < n; i++) w[i] = r();
  return scaleTo(throughFormants(w, shape, sr), 1);
}

/* ── "P" at the capsule (page 6) ───────────────────────────────────────── */

export const PLOSIVE_DUR_MS = 200;
/** When the lips part (the burst), ms. */
export const PLOSIVE_BURST_MS = 20;
/** Voice onset after the burst (English /p/ is aspirated: VOT ~ 50–70 ms). */
export const PLOSIVE_VOT_MS = 55;

/**
 * "Pa" at a close microphone, 200 ms. The parts, in order: closure (silence),
 * the BURST (a ~3 ms broadband click when the lips part), aspiration (breathy
 * noise through the upper formants), then the voiced vowel. Without a pop
 * filter the AIR JET — moving air, far slower than sound — lands ~30 ms after
 * the burst as a huge low-frequency pressure swing (~45 ms, near full scale),
 * with the undershoot a capsule's low-frequency roll-off gives it. The filter
 * spreads the jet into a weak, slow residue (~8 %); the burst, aspiration and
 * vowel are sample-for-sample the same.
 */
export function plosiveCapture(withFilter: boolean, sr = SPEECH_SR): Float64Array {
  const n = Math.round((PLOSIVE_DUR_MS / 1000) * sr);
  const out = new Float64Array(n);
  const b0 = Math.round((PLOSIVE_BURST_MS / 1000) * sr);
  const v0 = b0 + Math.round((PLOSIVE_VOT_MS / 1000) * sr);
  // burst: broadband click, decays in ~1.5 ms
  const burst = shapedNoise(Math.round(0.006 * sr), [[3500, 2500]], 7, sr);
  for (let i = 0; i < burst.length && b0 + i < n; i++) out[b0 + i] += 0.42 * burst[i] * Math.exp(-i / (0.0015 * sr));
  // aspiration: breath noise exciting the vowel's formants, fading into voicing
  // (F1 cutback: the open glottis damps the first formant during aspiration)
  const asp = shapedNoise(n - b0, VOWEL_FORMANTS.a.slice(1, 4), 21, sr);
  for (let i = 0; i < asp.length; i++) {
    const t = i / sr;
    const env = Math.min(1, t / 0.004) * (b0 + i < v0 ? 1 : Math.exp(-(b0 + i - v0) / (0.012 * sr)));
    out[b0 + i] += 0.07 * asp[i] * env;
  }
  // vowel /a/ at 120 Hz, 15 ms onset
  const vow = vowelWave((n - v0) / sr, 'a', 120, sr);
  for (let i = 0; i < vow.length; i++) out[v0 + i] += 0.3 * vow[i] * Math.min(1, i / (0.015 * sr));
  {
    // the air jet: a smooth pressure push (raised-cosine, 45 ms). Moving air
    // is slow (~3 m/s near a 3–4 inch mic), so it lands ~30 ms after the
    // burst's sound; seen through the capsule's ~25 Hz roll-off (undershoot).
    // A pop filter does not delete it — it spreads and weakens it to a slow
    // ~8 % residue.
    const j0 = b0 + Math.round(0.03 * sr), jn = Math.round((withFilter ? 0.07 : 0.045) * sr);
    const jet = new Float64Array(n);
    for (let i = 0; i < jn && j0 + i < n; i++) jet[j0 + i] = Math.sin((Math.PI * i) / jn) ** 2;
    const hp = scaleTo(highPass(jet, 25, sr), withFilter ? 0.075 : 0.9);
    for (let i = 0; i < n; i++) out[i] += hp[i];
  }
  for (let i = 0; i < n; i++) out[i] = Math.max(-1, Math.min(1, out[i]));
  return out;
}

/* ── an "S" and a vowel, as spectra (page 7) ───────────────────────────── */

/** Smoothed magnitude spectrum in dB (re its own peak) on `n` log-spaced
 *  bands from loHz to hiHz, measured from real audio by a Goertzel bank with
 *  a Hann window, averaged over consecutive frames. */
export function measuredSpectrumDb(x: Float64Array, n = 40, loHz = 20, hiHz = 12000, sr = SPEECH_SR, frame = 1024): { hz: Float64Array; db: Float64Array } {
  const hz = new Float64Array(n);
  const pow = new Float64Array(n);
  const top = Math.min(hiHz, sr / 2 - 1);
  for (let k = 0; k < n; k++) hz[k] = loHz * Math.pow(top / loHz, (k + 0.5) / n);
  const win = new Float64Array(frame);
  for (let i = 0; i < frame; i++) win[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (frame - 1));
  let frames = 0;
  for (let s = 0; s + frame <= x.length; s += frame / 2) {
    frames++;
    for (let k = 0; k < n; k++) {
      // band power = mean of a few Goertzel bins across the band (log-spaced)
      const fLo = loHz * Math.pow(top / loHz, k / n), fHi = loHz * Math.pow(top / loHz, (k + 1) / n);
      const bins = 3;
      let acc = 0;
      for (let b = 0; b < bins; b++) {
        const f = fLo * Math.pow(fHi / fLo, (b + 0.5) / bins);
        const w = (2 * Math.PI * f) / sr, c = 2 * Math.cos(w);
        let s1 = 0, s2 = 0;
        for (let i = 0; i < frame; i++) {
          const v = x[s + i] * win[i] + c * s1 - s2;
          s2 = s1;
          s1 = v;
        }
        acc += s1 * s1 + s2 * s2 - c * s1 * s2;
      }
      pow[k] += acc / bins;
    }
  }
  const db = new Float64Array(n);
  let pk = -Infinity;
  for (let k = 0; k < n; k++) { db[k] = 10 * Math.log10(pow[k] / Math.max(1, frames) + 1e-20); pk = Math.max(pk, db[k]); }
  for (let k = 0; k < n; k++) db[k] -= pk;
  return { hz, db };
}

/** 0.5 s of a sustained "S": turbulent noise shaped by the short front
 *  cavity — energy from ~3.5 kHz up, strongest ~5–8 kHz, almost nothing low. */
export function sibilantWave(durS = 0.5, sr = SPEECH_SR): Float64Array {
  const n = Math.round(durS * sr);
  const r = noiseGen(31);
  const w = new Float64Array(n);
  for (let i = 0; i < n; i++) w[i] = r();
  const hp = highPass(highPass(highPass(w, 3000, sr), 3000, sr), 3000, sr);
  const a = resonate(hp, 6200, 2600, sr);
  const b = resonate(hp, 4300, 1200, sr);
  const y = new Float64Array(n);
  for (let i = 0; i < n; i++) y[i] = a[i] + 0.5 * b[i];
  return scaleTo(y, 1);
}

/* ── a vowel's harmonics through the vocal tract (page 4) ──────────────── */

/** |H(f)| of one formant resonance (unity at 0 Hz), analog form. */
export function resonanceGain(f: number, F: number, B: number): number {
  const a = F * F + (B / 2) * (B / 2);
  return a / Math.sqrt((a - f * f) * (a - f * f) + f * f * B * B);
}

/** The vocal tract's transfer function in dB at f (all formants in cascade). */
export function tractDb(f: number, formants: Formant[]): number {
  let g = 1;
  for (const [F, B] of formants) g *= resonanceGain(f, F, B);
  return 20 * Math.log10(g);
}

/**
 * The harmonics of a voice at f0 after the mouth has shaped them, in dB re the
 * strongest one — the SAME source–filter model the waveforms use: a glottal
 * source falling ~12 dB/octave, +6 dB/octave of lip radiation (net −6 dB/oct
 * above f0), times the tract's formant resonances. `envDb` is the smooth curve
 * (source slope × tract) on `envN` points 0..maxHz, same reference.
 */
export function vowelHarmonicsDb(formants: Formant[], f0 = 120, maxHz = 4000, envN = 160): { hz: Float64Array; db: Float64Array; envHz: Float64Array; envDb: Float64Array } {
  const count = Math.floor(maxHz / f0);
  const hz = new Float64Array(count), db = new Float64Array(count);
  const src = (f: number) => 20 * Math.log10(f0 / Math.max(f0, f));
  let pk = -Infinity;
  for (let k = 1; k <= count; k++) {
    const f = k * f0;
    hz[k - 1] = f;
    db[k - 1] = src(f) + tractDb(f, formants);
    pk = Math.max(pk, db[k - 1]);
  }
  for (let i = 0; i < count; i++) db[i] -= pk;
  const envHz = new Float64Array(envN), envDb = new Float64Array(envN);
  for (let i = 0; i < envN; i++) {
    const f = (i / (envN - 1)) * maxHz;
    envHz[i] = f;
    envDb[i] = src(Math.max(f, 1)) + tractDb(f, formants) - pk;
  }
  return { hz, db, envHz, envDb };
}

/* ── consonant + vowel syllables and their spectrograms (page 5) ───────── */

/** Voiced sound with formants that MOVE (coefficients updated every 8
 *  samples) — for transitions, glides, nasal murmurs. */
export function voicedTrack(n: number, f0: number, formantsAt: (t: number) => Formant[], ampAt: (t: number) => number, sr = SPEECH_SR): Float64Array {
  const src = glottalSource(n, (t) => f0 * (1 + 0.02 * Math.sin(2 * Math.PI * 2.3 * t)), sr);
  const T = 1 / sr;
  const coefOf = (fm: Formant[]) => fm.map(([f, bw]) => {
    const C = -Math.exp(-2 * Math.PI * bw * T), B = 2 * Math.exp(-Math.PI * bw * T) * Math.cos(2 * Math.PI * f * T);
    return [1 - B - C, B, C];
  });
  let coef = coefOf(formantsAt(0));
  const st = coef.map(() => [0, 0]);
  const y = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    if (i % 8 === 0) coef = coefOf(formantsAt(i / sr));
    let v = src[i] * ampAt(i / sr);
    for (let k = 0; k < coef.length; k++) {
      const [A, B, C] = coef[k];
      const o = A * v + B * st[k][0] + C * st[k][1];
      st[k][1] = st[k][0];
      st[k][0] = o;
      v = o;
    }
    y[i] = v;
  }
  return y;
}

const lerpF = (a: Formant[], b: Formant[], k: number): Formant[] => a.map(([f, bw], i) => [f + (b[i][0] - f) * k, bw + (b[i][1] - bw) * k]);
const smooth01 = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

export type CvSegment = { label: string; t0: number; t1: number };
export type ConsonantFamilyId = 'plosive' | 'fricative' | 'affricate' | 'nasal' | 'liquid' | 'glide';
export const SYLLABLE_MS = 400;
export const SYLLABLE_SR = 24000;

/**
 * A consonant + "ah" syllable for each family (400 ms at 24 kHz), with its
 * labelled parts: "pa" (closure, burst + breathy release), "sa", "cha", "ma", "la",
 * "wa". Typical adult-male values; the formant transitions follow the usual
 * loci (labial low F2, alveolar ~1.7 kHz, palato-alveolar ~2 kHz).
 */
export function consonantSyllable(id: ConsonantFamilyId, sr = SYLLABLE_SR): { wave: Float64Array; segments: CvSegment[]; text: string } {
  const n = Math.round((SYLLABLE_MS / 1000) * sr);
  const A = VOWEL_FORMANTS.a;
  const out = new Float64Array(n);
  const add = (x: Float64Array, at: number, gain: number, env: (t: number) => number) => {
    const s0 = Math.round(at * sr);
    for (let i = 0; i < x.length && s0 + i < n; i++) out[s0 + i] += gain * x[i] * env(i / sr);
  };
  const fadeOut = (len: number) => (t: number) => 1 - smooth01((t - (len / sr - 0.06)) / 0.06);
  const voicedFrom = (t0: number, formantsAt: (t: number) => Formant[], amp: (t: number) => number) => {
    const len = n - Math.round(t0 * sr);
    const fo = fadeOut(len);
    const v = voicedTrack(len, 120, formantsAt, (t) => amp(t) * fo(t), sr);
    add(scaleTo(v, 1), t0, 0.55, () => 1);
  };
  const burst = (at: number, shape: Formant[], seed: number, gain: number) => add(shapedNoise(Math.round(0.008 * sr), shape, seed, sr), at, gain, (t) => Math.exp(-t / 0.0018));
  let segments: CvSegment[] = [];
  let text = '';
  switch (id) {
    case 'plosive': {
      text = 'pa';
      burst(0.06, [[1200, 3000]], 7, 0.2); // a lip burst: the weakest, lowest of the stops
      add(shapedNoise(Math.round(0.06 * sr), A.slice(1, 4), 21, sr), 0.061, 0.09, (t) => smooth01(t / 0.004) * (1 - smooth01((t - 0.045) / 0.015)));
      const P: Formant[] = [[500, 90], [900, 110], [2300, 170], [3400, 250], [4500, 300]];
      voicedFrom(0.115, (t) => lerpF(P, A, smooth01(t / 0.05)), (t) => smooth01(t / 0.012));
      segments = [{ label: 'closure', t0: 0, t1: 0.06 }, { label: 'release', t0: 0.06, t1: 0.115 }, { label: 'vowel', t0: 0.115, t1: 0.4 }];
      break;
    }
    case 'fricative': {
      text = 'sa';
      add(sibilantWave(0.15, sr), 0.02, 0.45, (t) => smooth01(t / 0.03) * (1 - smooth01((t - 0.12) / 0.03)));
      const S: Formant[] = [[400, 80], [1700, 110], [2600, 170], [3500, 250], [4500, 300]];
      voicedFrom(0.17, (t) => lerpF(S, A, smooth01(t / 0.05)), (t) => smooth01(t / 0.012));
      segments = [{ label: 'hiss', t0: 0.02, t1: 0.17 }, { label: 'vowel', t0: 0.17, t1: 0.4 }];
      break;
    }
    case 'affricate': {
      text = 'cha';
      burst(0.06, [[3000, 3000]], 9, 0.45);
      const r = noiseGen(53);
      const w = new Float64Array(Math.round(0.09 * sr));
      for (let i = 0; i < w.length; i++) w[i] = r();
      const hpw = highPass(highPass(w, 1800, sr), 1800, sr);
      const a = resonate(hpw, 2800, 900, sr), b = resonate(hpw, 4400, 1600, sr);
      const sh = scaleTo(Float64Array.from(a, (v, i) => v + 0.6 * b[i]), 1);
      add(sh, 0.062, 0.4, (t) => smooth01(t / 0.006) * (1 - smooth01((t - 0.07) / 0.02)));
      const CH: Formant[] = [[400, 80], [2000, 110], [2700, 170], [3500, 250], [4500, 300]];
      voicedFrom(0.152, (t) => lerpF(CH, A, smooth01(t / 0.06)), (t) => smooth01(t / 0.012));
      segments = [{ label: 'closure', t0: 0, t1: 0.06 }, { label: 'hiss', t0: 0.06, t1: 0.152 }, { label: 'vowel', t0: 0.152, t1: 0.4 }];
      break;
    }
    case 'nasal': {
      text = 'ma';
      const NAS: Formant[] = [[250, 100], [1000, 300], [2200, 400], [3300, 500], [4500, 600]];
      const M: Formant[] = [[500, 90], [900, 110], [2300, 170], [3400, 250], [4500, 300]];
      voicedFrom(0.03, (t) => (t < 0.1 ? NAS : lerpF(M, A, smooth01((t - 0.1) / 0.05))), (t) => smooth01(t / 0.015) * (t < 0.1 ? 0.3 : 1));
      segments = [{ label: 'nasal hum', t0: 0.03, t1: 0.13 }, { label: 'vowel', t0: 0.13, t1: 0.4 }];
      break;
    }
    case 'liquid': {
      text = 'la';
      const L: Formant[] = [[360, 80], [1250, 120], [2900, 200], [3600, 250], [4500, 300]];
      voicedFrom(0.03, (t) => lerpF(L, A, smooth01((t - 0.09) / 0.07)), (t) => smooth01(t / 0.015) * (t < 0.09 ? 0.6 : 1));
      segments = [{ label: 'L', t0: 0.03, t1: 0.12 }, { label: 'into the vowel', t0: 0.12, t1: 0.4 }];
      break;
    }
    case 'glide': {
      text = 'wa';
      const Wf: Formant[] = [[300, 70], [650, 90], [2200, 160], [3400, 250], [4500, 300]];
      voicedFrom(0.03, (t) => lerpF(Wf, A, smooth01((t - 0.02) / 0.15)), (t) => smooth01(t / 0.02));
      segments = [{ label: 'W glides', t0: 0.03, t1: 0.2 }, { label: 'vowel', t0: 0.2, t1: 0.4 }];
      break;
    }
  }
  for (let i = 0; i < n; i++) out[i] = Math.max(-1, Math.min(1, out[i]));
  return { wave: out, segments, text };
}

/**
 * Spectrogram of real audio (pre-emphasized): Hann-windowed frames (`winMs`), `cols` frames
 * across the signal, power on `rows` linear bands 0..maxHz (Goertzel, 2 bins
 * per band), in dB re the loudest cell. rows × cols; row 0 = lowest band.
 */
export function spectrogramDb(x0: Float64Array, sr: number, cols: number, rows: number, maxHz: number, winMs = 8, preEmphasis = 0.97): Float64Array[] {
  // the usual spectrograph pre-emphasis (+6 dB/octave) so the upper formants show
  const x = new Float64Array(x0.length);
  for (let i = 0; i < x0.length; i++) x[i] = x0[i] - (i > 0 ? preEmphasis * x0[i - 1] : 0);
  const win = Math.round((winMs / 1000) * sr);
  const hann = new Float64Array(win);
  for (let i = 0; i < win; i++) hann[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (win - 1));
  const grid: Float64Array[] = Array.from({ length: rows }, () => new Float64Array(cols));
  let pk = -Infinity;
  const frame = new Float64Array(win);
  for (let c = 0; c < cols; c++) {
    const centre = Math.round(((c + 0.5) / cols) * x.length);
    for (let i = 0; i < win; i++) {
      const j = centre - Math.floor(win / 2) + i;
      frame[i] = j >= 0 && j < x.length ? x[j] * hann[i] : 0;
    }
    for (let r = 0; r < rows; r++) {
      let acc = 0;
      for (let b = 0; b < 2; b++) {
        const f = ((r + (b + 0.5) / 2) / rows) * maxHz;
        const w = (2 * Math.PI * f) / sr, k = 2 * Math.cos(w);
        let s1 = 0, s2 = 0;
        for (let i = 0; i < win; i++) { const v = frame[i] + k * s1 - s2; s2 = s1; s1 = v; }
        acc += s1 * s1 + s2 * s2 - k * s1 * s2;
      }
      const db = 10 * Math.log10(acc / 2 + 1e-20);
      grid[r][c] = db;
      pk = Math.max(pk, db);
    }
  }
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) grid[r][c] -= pk;
  return grid;
}
