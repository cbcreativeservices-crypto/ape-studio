/**
 * envelopeModel — Sound Envelope & Transients Lab: the pure model behind
 * every drawing (owner brief 2026-09-02). ADSR envelopes, transient shapes,
 * sound-type presets, duration categories, and peak/average measures — all
 * computed, never hand-drawn. Verified by test/envelopeModel.test.ts.
 *
 * Scope note kept deliberately: an ENVELOPE describes how a sound changes
 * over time at its source. It is not propagation (how sound travels through
 * a medium) — that is the Wave Physics lab's subject.
 */

export type Adsr = {
  attackMs: number;
  decayMs: number;
  /** 0..1 fraction of peak. */
  sustain: number;
  releaseMs: number;
  /** How long the "key" is held after attack+decay, before release. */
  holdMs: number;
  /** Attack curve: 'linear' or 'exponential' (percussive snap). */
  attackShape?: 'linear' | 'exponential';
  /** Decay/release curve. */
  decayShape?: 'linear' | 'exponential';
};

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** Total envelope duration in ms. */
export const adsrTotalMs = (a: Adsr) => a.attackMs + a.decayMs + a.holdMs + a.releaseMs;

/** Envelope value 0..1 at time t (ms). */
export function adsrAt(a: Adsr, tMs: number): number {
  if (!Number.isFinite(tMs) || tMs < 0) return 0;
  const { attackMs, decayMs, sustain, releaseMs, holdMs } = a;
  const s = clamp01(sustain);
  const expo = (x: number, k = 4) => (1 - Math.exp(-k * x)) / (1 - Math.exp(-k));
  if (tMs < attackMs) {
    const x = attackMs > 0 ? tMs / attackMs : 1;
    return a.attackShape === 'exponential' ? expo(x) : x;
  }
  let t = tMs - attackMs;
  if (t < decayMs) {
    const x = decayMs > 0 ? t / decayMs : 1;
    const shaped = a.decayShape === 'exponential' ? expo(x) : x;
    return 1 - (1 - s) * shaped;
  }
  t -= decayMs;
  if (t < holdMs) return s;
  t -= holdMs;
  if (t < releaseMs) {
    const x = releaseMs > 0 ? t / releaseMs : 1;
    const shaped = a.decayShape === 'exponential' ? expo(x) : x;
    return s * (1 - shaped);
  }
  return 0;
}

/** Sample the envelope into n points over its total duration. */
export function adsrCurve(a: Adsr, n = 200): { t: Float32Array; v: Float32Array } {
  const total = Math.max(1, adsrTotalMs(a));
  const t = new Float32Array(n);
  const v = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    t[i] = (i / (n - 1)) * total;
    v[i] = adsrAt(a, t[i]);
  }
  return { t, v };
}

/** Rise time: 10% → 90% of peak during the attack, in ms. */
export function riseTimeMs(a: Adsr): number {
  if (a.attackMs <= 0) return 0;
  const find = (target: number) => {
    let lo = 0, hi = a.attackMs;
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2;
      if (adsrAt(a, mid) < target) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  };
  return find(0.9) - find(0.1);
}

/** Envelope-shaped waveform for drawing (carrier cycles are visual, not audio). */
export function shapedWave(a: Adsr, n = 600, cycles = 40): Float32Array {
  const out = new Float32Array(n);
  const total = Math.max(1, adsrTotalMs(a));
  for (let i = 0; i < n; i++) {
    const tMs = (i / (n - 1)) * total;
    out[i] = adsrAt(a, tMs) * Math.sin((2 * Math.PI * cycles * i) / n);
  }
  return out;
}

/* ── peak vs average ────────────────────────────────────────────────────── */

export function peakAbs(x: Float32Array): number {
  let p = 0;
  for (let i = 0; i < x.length; i++) p = Math.max(p, Math.abs(x[i]));
  return p;
}

export function rms(x: Float32Array): number {
  let s = 0;
  for (let i = 0; i < x.length; i++) s += x[i] * x[i];
  return Math.sqrt(s / Math.max(1, x.length));
}

/** Crest factor in dB: 20·log10(peak / rms). A steady sine is ≈ 3.01 dB. */
export function crestFactorDb(x: Float32Array): number {
  const p = peakAbs(x), r = rms(x);
  if (p <= 0 || r <= 0) return 0;
  return 20 * Math.log10(p / r);
}

export const toDb = (lin: number) => (lin > 0 ? 20 * Math.log10(lin) : -120);

/* ── presets (simplified teaching shapes — labeled so in the UI) ────────── */

export type SoundPreset = {
  id: string;
  name: string;
  adsr: Adsr;
  bullets: string[];
  kind: 'percussive' | 'sustained' | 'speech';
};

export const PRESETS: SoundPreset[] = [
  {
    id: 'snare', name: 'Snare drum', kind: 'percussive',
    adsr: { attackMs: 2, decayMs: 120, sustain: 0, releaseMs: 60, holdMs: 0, attackShape: 'exponential', decayShape: 'exponential' },
    bullets: ['Instant attack', 'Very short decay', 'No sustain', 'Short release'],
  },
  {
    id: 'kick', name: 'Kick drum', kind: 'percussive',
    adsr: { attackMs: 6, decayMs: 320, sustain: 0, releaseMs: 120, holdMs: 0, attackShape: 'exponential', decayShape: 'exponential' },
    bullets: ['Fast attack', 'Longer low-frequency decay', 'No sustain'],
  },
  {
    id: 'piano', name: 'Piano', kind: 'percussive',
    adsr: { attackMs: 8, decayMs: 1400, sustain: 0.12, releaseMs: 500, holdMs: 400, attackShape: 'exponential', decayShape: 'exponential' },
    bullets: ['Fast attack', 'Natural decay', 'No true sustain (unless the pedal holds it)'],
  },
  {
    id: 'violin', name: 'Violin', kind: 'sustained',
    adsr: { attackMs: 180, decayMs: 120, sustain: 0.85, releaseMs: 260, holdMs: 900, attackShape: 'linear', decayShape: 'linear' },
    bullets: ['Variable attack (bow speed and pressure)', 'Long sustain', 'Controlled release'],
  },
  {
    id: 'trumpet', name: 'Trumpet', kind: 'sustained',
    adsr: { attackMs: 60, decayMs: 80, sustain: 0.9, releaseMs: 120, holdMs: 900, attackShape: 'linear', decayShape: 'linear' },
    bullets: ['Medium attack', 'Continuous sustain', 'Controlled release'],
  },
  {
    id: 'cymbal', name: 'Cymbal', kind: 'percussive',
    adsr: { attackMs: 3, decayMs: 2600, sustain: 0.06, releaseMs: 1400, holdMs: 200, attackShape: 'exponential', decayShape: 'exponential' },
    bullets: ['Fast transient', 'Very long decay', 'Long release'],
  },
];

/** Speech: a sequence of syllable envelopes — transients and sustained vowels alternating. */
export const SPEECH_SYLLABLES: { label: string; adsr: Adsr; gapMs: number }[] = [
  { label: 'pro', adsr: { attackMs: 4, decayMs: 40, sustain: 0.6, releaseMs: 60, holdMs: 120, attackShape: 'exponential' }, gapMs: 30 },
  { label: 'fes', adsr: { attackMs: 25, decayMs: 30, sustain: 0.5, releaseMs: 80, holdMs: 90 }, gapMs: 20 },
  { label: 'sion', adsr: { attackMs: 12, decayMs: 40, sustain: 0.7, releaseMs: 120, holdMs: 160 }, gapMs: 60 },
  { label: 'al', adsr: { attackMs: 20, decayMs: 30, sustain: 0.55, releaseMs: 90, holdMs: 110 }, gapMs: 40 },
  { label: 'au', adsr: { attackMs: 18, decayMs: 40, sustain: 0.65, releaseMs: 80, holdMs: 140 }, gapMs: 20 },
  { label: 'di', adsr: { attackMs: 3, decayMs: 25, sustain: 0.5, releaseMs: 60, holdMs: 70, attackShape: 'exponential' }, gapMs: 20 },
  { label: 'o', adsr: { attackMs: 22, decayMs: 40, sustain: 0.7, releaseMs: 140, holdMs: 200 }, gapMs: 0 },
];

/** Concatenate syllable envelopes into one curve over a shared timeline. */
export function speechCurve(n = 400): { t: Float32Array; v: Float32Array; marks: { label: string; startMs: number; endMs: number }[] } {
  const marks: { label: string; startMs: number; endMs: number }[] = [];
  let cursor = 0;
  for (const s of SPEECH_SYLLABLES) {
    const d = adsrTotalMs(s.adsr);
    marks.push({ label: s.label, startMs: cursor, endMs: cursor + d });
    cursor += d + s.gapMs;
  }
  const total = cursor;
  const t = new Float32Array(n), v = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const tm = (i / (n - 1)) * total;
    t[i] = tm;
    let val = 0;
    for (let k = 0; k < SPEECH_SYLLABLES.length; k++) {
      const m = marks[k];
      if (tm >= m.startMs && tm < m.endMs) val = adsrAt(SPEECH_SYLLABLES[k].adsr, tm - m.startMs);
    }
    v[i] = val;
  }
  return { t, v, marks };
}

/* ── transients ─────────────────────────────────────────────────────────── */

export type TransientKind = 'sharp' | 'soft' | 'none';

export const TRANSIENTS: Record<TransientKind, { name: string; adsr: Adsr; note: string }> = {
  sharp: { name: 'Sharp transient', adsr: { attackMs: 2, decayMs: 90, sustain: 0.35, releaseMs: 200, holdMs: 500, attackShape: 'exponential', decayShape: 'exponential' }, note: 'A near-instant rise with an overshoot that settles — the "click" or "snap" the ear uses to locate and identify a sound.' },
  soft: { name: 'Soft transient', adsr: { attackMs: 60, decayMs: 80, sustain: 0.6, releaseMs: 200, holdMs: 500 }, note: 'A rounded onset over tens of milliseconds — present, but gentle. Bowed strings and breathy brass live here.' },
  none: { name: 'No transient', adsr: { attackMs: 400, decayMs: 0, sustain: 1, releaseMs: 200, holdMs: 400 }, note: 'A slow swell with no distinct onset — pads, reversed sounds, a fade-in. Hard to place in time.' },
};

/* ── duration categories (log-time axis) ───────────────────────────────── */

export type DurationCategory = 'impulse' | 'short' | 'medium' | 'long' | 'continuous';

export const DURATION_EXAMPLES: { name: string; ms: number; category: DurationCategory }[] = [
  { name: 'Finger snap', ms: 12, category: 'impulse' },
  { name: 'Kick drum', ms: 250, category: 'short' },
  { name: 'Snare', ms: 180, category: 'short' },
  { name: 'Speech (a word)', ms: 600, category: 'medium' },
  { name: 'Piano note', ms: 2500, category: 'long' },
  { name: 'Organ (held)', ms: 8000, category: 'continuous' },
  { name: 'Pink noise', ms: 12000, category: 'continuous' },
];

export const DURATION_BANDS: { category: DurationCategory; fromMs: number; toMs: number; label: string }[] = [
  { category: 'impulse', fromMs: 1, toMs: 50, label: 'Impulse · under ~50 ms' },
  { category: 'short', fromMs: 50, toMs: 400, label: 'Short · ~50–400 ms' },
  { category: 'medium', fromMs: 400, toMs: 1500, label: 'Medium · ~0.4–1.5 s' },
  { category: 'long', fromMs: 1500, toMs: 5000, label: 'Long · ~1.5–5 s' },
  { category: 'continuous', fromMs: 5000, toMs: 20000, label: 'Continuous · sustained as long as energy is supplied' },
];

/** Position on a log-time axis 1 ms … 20 s → 0..1. */
export function logTimePos(ms: number): number {
  const lo = Math.log10(1), hi = Math.log10(20000);
  return clamp01((Math.log10(Math.max(1, ms)) - lo) / (hi - lo));
}
