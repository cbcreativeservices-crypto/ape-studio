/**
 * djVoice — the lab's stand-in VOICE for announcements (screens 19, 21, 24):
 * a short spoken-like phrase, synthesised with the Speech & Voice Lab's own
 * source–filter pieces (features/speech/speechSignals: the Rosenberg glottal
 * source and Klatt formant resonators) — real audio on a real time base, no
 * recording, no words. It has the rhythm, pitch movement, vowels and
 * consonant bursts of speech, so the meters, the talkover and the recorder
 * see what speech really does: short loud syllables with gaps between.
 *
 * Pure; cached once (about 3.3 s at 48 kHz). Its PEAK sits at
 * SPEECH_PEAK_AT_0DB (the capsule's speech level before any preamp gain);
 * the mic chain (djEvent) adds the sensitivity and the gain.
 */
import { glottalSource, noiseGen, VOWEL_FORMANTS, type Formant } from '../../../../features/speech/speechSignals.ts';
import { SPEECH_PEAK_AT_0DB } from '../model/djEvent.ts';
import { SR } from './djDsp.ts';

type V = keyof typeof VOWEL_FORMANTS;
type Syl = { c: '' | 'p' | 't' | 'k' | 's' | 'sh' | 'm' | 'n' | 'l'; v: V; dur: number; accent?: number; gap?: number };

/** The phrase: three short "sentences" of syllables (durations in s; `gap`
 *  = the pause after it). Its shape, not its words, is what matters here. */
const PHRASE: Syl[] = [
  { c: 'm', v: 'e', dur: 0.15 }, { c: 'k', v: 'schwa', dur: 0.1 }, { c: 's', v: 'a', dur: 0.2, accent: 1, gap: 0.05 },
  { c: 'm', v: 'schwa', dur: 0.12 }, { c: 'n', v: 'o', dur: 0.22, accent: 0.6, gap: 0.12 },
  { c: 'p', v: 'i', dur: 0.12 }, { c: 'l', v: 'e', dur: 0.14 }, { c: 's', v: 'a', dur: 0.26, accent: 1, gap: 0.32 },
  { c: 't', v: 'schwa', dur: 0.1 }, { c: 'n', v: 'a', dur: 0.18, accent: 0.8 }, { c: 'l', v: 'i', dur: 0.12, gap: 0.05 },
  { c: 'sh', v: 'o', dur: 0.24, accent: 0.7, gap: 0.3 },
  { c: 'k', v: 'a', dur: 0.14, accent: 0.9 }, { c: 'm', v: 'u', dur: 0.12 }, { c: 't', v: 'e', dur: 0.24, accent: 0.5, gap: 0.2 },
];

const VOICE_SR = 24000;

/** Fricative / burst noise shapes (centre, bandwidth). */
const NOISE_SHAPE: Record<string, Formant[]> = {
  s: [[5600, 1800], [7600, 2200]],
  sh: [[2600, 900], [4200, 1400]],
  p: [[900, 900]],
  t: [[3800, 1600]],
  k: [[1900, 900]],
};

let cache: Float32Array | null = null;
/** Where each syllable's vowel starts and ends (s) — the "speaking" spans. */
let spans: { t0: number; t1: number }[] = [];

function synth(): Float32Array {
  // the timeline
  type Seg = { t0: number; c: Syl['c']; cDur: number; v0: number; v1: number; v: V; accent: number };
  const segs: Seg[] = [];
  let t = 0.05;
  for (const s of PHRASE) {
    const cDur = s.c === '' ? 0 : s.c === 's' || s.c === 'sh' ? 0.07 : s.c === 'm' || s.c === 'n' || s.c === 'l' ? 0.05 : 0.03;
    segs.push({ t0: t, c: s.c, cDur, v0: t + cDur, v1: t + cDur + s.dur, v: s.v, accent: s.accent ?? 0 });
    t += cDur + s.dur + (s.gap ?? 0.02);
  }
  const total = t + 0.1;
  const n = Math.round(total * VOICE_SR);
  // pitch: a falling phrase line, lifted on accented syllables
  const f0At = (tt: number): number => {
    let f = 132 - 22 * (tt / total);
    for (const g of segs) if (g.accent > 0 && tt >= g.v0 - 0.02 && tt <= g.v1) f += 22 * g.accent * Math.sin((Math.PI * (tt - g.v0 + 0.02)) / (g.v1 - g.v0 + 0.02));
    return f;
  };
  const src = glottalSource(n, f0At, VOICE_SR);
  const out = new Float64Array(n);
  // voiced part: formants that move from syllable to syllable (resonator
  // coefficients refreshed every 12 samples), gated by each vowel's envelope
  const T = 1 / VOICE_SR;
  const coefOf = (fm: Formant[]) =>
    fm.map(([f, bw]) => {
      const C = -Math.exp(-2 * Math.PI * bw * T);
      const B = 2 * Math.exp(-Math.PI * bw * T) * Math.cos(2 * Math.PI * f * T);
      return [1 - B - C, B, C];
    });
  const segAt = (tt: number): Seg | null => {
    for (const g of segs) if (tt >= g.t0 - 0.03 && tt <= g.v1 + 0.04) return g;
    return null;
  };
  const formantsAt = (tt: number): Formant[] => {
    const g = segAt(tt);
    const v = g ? VOWEL_FORMANTS[g.v] : VOWEL_FORMANTS.schwa;
    if (!g) return v;
    // nasals and liquids: a lowered first formant into the vowel
    if ((g.c === 'm' || g.c === 'n' || g.c === 'l') && tt < g.v0) return v.map(([f, bw], i) => [i === 0 ? 260 : f * 0.92, bw * 1.4] as Formant);
    return v;
  };
  const env = (tt: number): number => {
    let a = 0;
    for (const g of segs) {
      const on = g.c === 'm' || g.c === 'n' || g.c === 'l' ? g.t0 : g.v0;
      if (tt < on - 0.02 || tt > g.v1 + 0.05) continue;
      const rise = Math.min(1, Math.max(0, (tt - on + 0.02) / 0.03));
      const fall = Math.min(1, Math.max(0, (g.v1 + 0.05 - tt) / 0.06));
      const body = tt < g.v0 ? 0.35 : 1;
      a = Math.max(a, rise * fall * body * (0.75 + 0.25 * g.accent));
    }
    return a;
  };
  let coef = coefOf(formantsAt(0));
  const st = coef.map(() => [0, 0]);
  for (let i = 0; i < n; i++) {
    const tt = i / VOICE_SR;
    if (i % 12 === 0) coef = coefOf(formantsAt(tt));
    let v = src[i] * env(tt);
    for (let k = 0; k < coef.length; k++) {
      const [A, B, C] = coef[k];
      const o = A * v + B * st[k][0] + C * st[k][1];
      st[k][1] = st[k][0];
      st[k][0] = o;
      v = o;
    }
    out[i] = v;
  }
  // consonants: bursts and hiss, band-shaped, seeded (reproducible)
  const rnd = noiseGen(2026);
  let vPeak = 0;
  for (let i = 0; i < n; i++) vPeak = Math.max(vPeak, Math.abs(out[i]));
  for (const g of segs) {
    const shape = NOISE_SHAPE[g.c];
    if (!shape) continue;
    const i0 = Math.round(g.t0 * VOICE_SR);
    const m = Math.round(g.cDur * VOICE_SR);
    let x = new Float64Array(m);
    for (let i = 0; i < m; i++) x[i] = rnd();
    for (const [f, bw] of shape) {
      const C = -Math.exp(-2 * Math.PI * bw * T);
      const B = 2 * Math.exp(-Math.PI * bw * T) * Math.cos(2 * Math.PI * f * T);
      const A = 1 - B - C;
      const y = new Float64Array(m);
      let y1 = 0;
      let y2 = 0;
      for (let i = 0; i < m; i++) {
        const o = A * x[i] + B * y1 + C * y2;
        y[i] = o;
        y2 = y1;
        y1 = o;
      }
      x = y;
    }
    let p = 0;
    for (let i = 0; i < m; i++) p = Math.max(p, Math.abs(x[i]));
    const level = (g.c === 's' || g.c === 'sh' ? 0.32 : 0.45) * vPeak;
    for (let i = 0; i < m && i0 + i < n; i++) {
      const w = Math.sin((Math.PI * i) / m);
      out[i0 + i] += (x[i] / (p || 1)) * level * (g.c === 's' || g.c === 'sh' ? w : Math.exp(-i / (m * 0.35)));
    }
  }
  // to the lab's rate (×2, linear) and to its capsule level
  const N = Math.round((n * SR) / VOICE_SR);
  const y = new Float32Array(N);
  let peak = 0;
  for (let j = 0; j < N; j++) {
    const s = (j * VOICE_SR) / SR;
    const i = Math.floor(s);
    const f = s - i;
    const a = out[Math.min(n - 1, i)];
    const b = out[Math.min(n - 1, i + 1)];
    y[j] = a + (b - a) * f;
    peak = Math.max(peak, Math.abs(y[j]));
  }
  const g = Math.pow(10, SPEECH_PEAK_AT_0DB / 20) / (peak || 1);
  for (let j = 0; j < N; j++) y[j] *= g;
  spans = segs.map((s) => ({ t0: s.t0, t1: s.v1 }));
  return y;
}

/** The announcement at the capsule (mono, 48 kHz), peak = SPEECH_PEAK_AT_0DB. */
export function voiceBuf(): Float32Array {
  if (!cache) cache = synth();
  return cache;
}

/** Its length in seconds. */
export const voiceSeconds = (): number => voiceBuf().length / SR;

/** The spans (s from its start) where it is speaking. */
export function voiceSpans(): { t0: number; t1: number }[] {
  voiceBuf();
  return spans;
}

/** Forget the cache (tests). */
export function releaseVoice(): void {
  cache = null;
}
