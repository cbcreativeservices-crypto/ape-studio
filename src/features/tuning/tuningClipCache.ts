/**
 * tuningClipCache — every Tuning & Temperament clip is rendered ONCE (owner
 * 2026-09-29: "Yes save each clip … minimize delays when the user is
 * switching between audio sample sounds").
 *
 * The chapter renderers are pure functions of their arguments, so the same
 * arguments give the same clip. These wrappers memoise renderNotes /
 * renderPartials / renderSequence / concatWithGap by their arguments and hand
 * back the SAME buffer object on a repeat call. clipKeyOf(buf) names that
 * clip, which is how TuningPlayer finds the already-written WAV and the
 * already-loaded player for it: a repeat tap skips the DSP burst, the WAV
 * encode, the file write and the player load.
 *
 * MEMORY BUDGET (documented, owner 2026-09-29 "if it isn't too heavy"):
 * rendered Float32 clips ≤ RENDER_CACHE_BYTES (4 MB) and ≤ RENDER_CACHE_MAX
 * (32) — a 1.4 s clip is 269 KB, a 2.2 s chord 422 KB — least recently used
 * dropped first. Cached buffers are shared: nothing may write into them
 * (every consumer only reads — the WAV encoder, concatWithGap's copy).
 *
 * Pure (no React Native), so it is tested in Node.
 */
import { ByteLru } from '../audio/clipLru.ts';
import {
  concatWithGap as concatRaw,
  renderNotes as notesRaw,
  renderPartials as partialsRaw,
  renderSequence as sequenceRaw,
  type Timbre,
} from './tuningRender.ts';
import type { Mono } from '../ear/earDsp';

export const RENDER_CACHE_BYTES = 4 * 1024 * 1024;
export const RENDER_CACHE_MAX = 32;

const cache = new ByteLru<Mono>(RENDER_CACHE_BYTES, RENDER_CACHE_MAX);
const keys = new WeakMap<Mono, string>();

/** The cache key of a clip made by these wrappers, else undefined. */
export function clipKeyOf(buf: Mono): string | undefined {
  return keys.get(buf);
}

function memo(key: string, make: () => Mono): Mono {
  const hit = cache.get(key);
  if (hit) return hit;
  const buf = make();
  keys.set(buf, key);
  cache.set(key, buf, buf.byteLength);
  return buf;
}

export function renderNotes(freqsHz: number[], seconds: number, timbre: Timbre): Mono {
  return memo(`n|${freqsHz.join(',')}|${seconds}|${timbre}`, () => notesRaw(freqsHz, seconds, timbre));
}

export function renderPartials(freqsHz: number[], seconds: number): Mono {
  return memo(`p|${freqsHz.join(',')}|${seconds}`, () => partialsRaw(freqsHz, seconds));
}

export function renderSequence(freqsHz: number[], noteSeconds: number, timbre: Timbre, gapSeconds = 0.05): Mono {
  return memo(`s|${freqsHz.join(',')}|${noteSeconds}|${timbre}|${gapSeconds}`, () => sequenceRaw(freqsHz, noteSeconds, timbre, gapSeconds));
}

/** A then silence then B. Cached only when both halves are cached clips. */
export function concatWithGap(a: Mono, b: Mono, gapSeconds = 0.35): Mono {
  const ka = keys.get(a);
  const kb = keys.get(b);
  if (!ka || !kb) return concatRaw(a, b, gapSeconds);
  return memo(`c|${ka}|${kb}|${gapSeconds}`, () => concatRaw(a, b, gapSeconds));
}

/** Bytes of the 16-bit mono WAV this clip encodes to (header included). */
export function wavBytes(buf: Mono): number {
  return 44 + buf.length * 2;
}

export function renderCacheStats(): { count: number; bytes: number } {
  return { count: cache.size, bytes: cache.bytes };
}

export function __clearRenderCacheForTests(): void {
  cache.clear();
}
