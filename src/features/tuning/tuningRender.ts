/**
 * tuningRender — the Tuning & Temperament Lab's PURE audio renderers (spec
 * Stage 1 §10). No React Native imports, so Node can test them
 * (test/tuningAudio.test.ts). Every clip is rendered offline from the same
 * frequencies the math module produces, with one shared loudness rule so
 * A/B comparisons differ only in their tuning ratios.
 */
import type { Mono } from '../ear/earDsp';

/** Shared render rate with the ear lab's pipeline (earDsp.SR). Restated here so
 *  this module has no runtime import of app code and runs under plain Node. */
export const SR = 48000;

function normalizeRms(x: Mono, targetDb: number): Mono {
  let s = 0;
  for (let i = 0; i < x.length; i++) s += x[i] * x[i];
  const rms = Math.sqrt(s / Math.max(1, x.length));
  const g = rms > 1e-9 ? Math.pow(10, targetDb / 20) / rms : 1;
  const out = new Float32Array(x.length);
  for (let i = 0; i < x.length; i++) out[i] = x[i] * g;
  return out;
}

export type Timbre = 'sine' | 'rich';

const TARGET_RMS_DB = -18; // one loudness rule for every clip
const PEAK_CEILING = 0.9; // never clip, whatever the voicing
const ATTACK_S = 0.012;
const RELEASE_S = 0.08;
export const RICH_PARTIALS = 8;

/** Additive tone: harmonic k at amplitude 1/k (a gentle natural roll-off). */
export function renderTone(freqHz: number, seconds: number, timbre: Timbre, partials = RICH_PARTIALS): Mono {
  const n = Math.round(seconds * SR);
  const out = new Float32Array(n);
  const k = timbre === 'sine' ? 1 : partials;
  for (let h = 1; h <= k; h++) {
    const f = freqHz * h;
    if (f >= SR / 2) break;
    const a = 1 / h;
    const w = (2 * Math.PI * f) / SR;
    for (let i = 0; i < n; i++) out[i] += a * Math.sin(w * i);
  }
  return out;
}

/** Only the named partials — e.g. the root's 5th and the third's 4th. */
export function renderIsolatedPartials(freqsHz: number[], seconds: number): Mono {
  const n = Math.round(seconds * SR);
  const out = new Float32Array(n);
  for (const f of freqsHz) {
    const w = (2 * Math.PI * f) / SR;
    for (let i = 0; i < n; i++) out[i] += Math.sin(w * i);
  }
  return out;
}

/** Sum voices (interval or chord) — identical register and voicing by construction. */
export function mixVoices(voices: Mono[]): Mono {
  // Math.max() of nothing is -Infinity, which throws inside Float32Array.
  const n = Math.max(0, ...voices.map((v) => v.length));
  const out = new Float32Array(n);
  for (const v of voices) for (let i = 0; i < v.length; i++) out[i] += v[i];
  return out;
}

/** Attack/release raised-cosine ramps — no clicks at start or stop. */
export function envelope(x: Mono, attackS = ATTACK_S, releaseS = RELEASE_S): Mono {
  const out = Float32Array.from(x);
  const a = Math.min(out.length >> 1, Math.round(attackS * SR));
  const r = Math.min(out.length >> 1, Math.round(releaseS * SR));
  for (let i = 0; i < a; i++) out[i] *= 0.5 - 0.5 * Math.cos((Math.PI * i) / a);
  for (let i = 0; i < r; i++) out[out.length - 1 - i] *= 0.5 - 0.5 * Math.cos((Math.PI * i) / r);
  return out;
}

/** The one loudness rule: RMS to −18 dBFS, then a hard peak ceiling. */
export function finalize(x: Mono): Mono {
  let y = normalizeRms(x, TARGET_RMS_DB);
  let peak = 0;
  for (let i = 0; i < y.length; i++) peak = Math.max(peak, Math.abs(y[i]));
  if (peak > PEAK_CEILING) {
    const g = PEAK_CEILING / peak;
    y = y.map((v) => v * g) as Mono;
  }
  return envelope(y);
}

/** One or more simultaneous notes, ready to play. */
export function renderNotes(freqsHz: number[], seconds: number, timbre: Timbre): Mono {
  return finalize(mixVoices(freqsHz.map((f) => renderTone(f, seconds, timbre))));
}

export function renderPartials(freqsHz: number[], seconds: number): Mono {
  return finalize(renderIsolatedPartials(freqsHz, seconds));
}

/** Sequential notes with identical timing/articulation; only the frequencies vary. */
export function renderSequence(freqsHz: number[], noteSeconds: number, timbre: Timbre, gapSeconds = 0.05): Mono {
  const note = Math.round(noteSeconds * SR);
  const gap = Math.round(gapSeconds * SR);
  const out = new Float32Array(freqsHz.length * (note + gap));
  freqsHz.forEach((f, i) => {
    const tone = envelope(renderTone(f, noteSeconds, timbre), 0.008, 0.06);
    out.set(tone, i * (note + gap));
  });
  return finalize(out);
}

/** A then silence then B — the "alternate" comparison as one clip. */
export function concatWithGap(a: Mono, b: Mono, gapSeconds = 0.35): Mono {
  const gap = Math.round(gapSeconds * SR);
  const out = new Float32Array(a.length + gap + b.length);
  out.set(a, 0);
  out.set(b, a.length + gap);
  return out;
}

export const clipSeconds = (x: Mono): number => x.length / SR;

