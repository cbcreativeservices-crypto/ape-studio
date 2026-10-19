/**
 * takeStore — the RECORDER's take (screens 21 and 24): what the recorder
 * actually captured, sample for sample, from the chunks that really
 * sounded (useBoothAudio's onChunk → engine/djEventRender's `ext.take`).
 * A re-render that starts inside an earlier chunk overwrites from its own
 * start, so the take holds exactly what the booth played. Session state
 * (a module store, like the booth): nothing here is saved.
 *
 * Its OVERVIEW (min / max per column, and where the mic was in it) is
 * measured from the captured samples — the take lane never draws stylised
 * audio.
 */
import { useSyncExternalStore } from 'react';
import { SR } from '../engine/djDsp';
import type { EventRender } from '../engine/djEventRender';

export const TAKE_MAX_S = 40;

type Take = { armedAt: number; l: Float32Array; r: Float32Array; mic: Float32Array; written: number; closedAt: number | null; version: number };

let take: Take | null = null;
let version = 0;
const listeners = new Set<() => void>();
const emit = () => {
  version++;
  for (const l of [...listeners]) l();
};

/** Start a new take at booth time t (the old one is dropped). */
export function armTake(t: number): void {
  const n = TAKE_MAX_S * SR;
  take = { armedAt: t, l: new Float32Array(n), r: new Float32Array(n), mic: new Float32Array(n), written: 0, closedAt: null, version: 0 };
  emit();
}

/** Stop recording at booth time t. */
export function closeTake(t: number): void {
  if (!take || take.closedAt != null) return;
  take.closedAt = t;
  take.written = Math.min(take.written, Math.max(0, Math.round((t - take.armedAt) * SR)));
  emit();
}

export function clearTake(): void {
  take = null;
  emit();
}

/** Write a chunk that has just started sounding. */
export function writeChunk(r: EventRender): void {
  if (!take || take.closedAt != null || !r.ext.take) return;
  const off = Math.round((r.t0 - take.armedAt) * SR);
  const src = r.ext.take;
  const n = src.l.length;
  const cap = take.l.length;
  if (off >= cap) {
    closeTake(take.armedAt + TAKE_MAX_S);
    return;
  }
  for (let i = Math.max(0, -off); i < n && off + i < cap; i++) {
    take.l[off + i] = src.l[i];
    take.r[off + i] = src.r[i];
    take.mic[off + i] = src.mic[i];
  }
  // a re-render inside an earlier chunk replaces the rest of it; the next
  // contiguous chunk continues — so the take ends where this chunk does
  take.written = Math.min(cap, Math.max(0, off + n));
  emit();
}

export type TakeView = {
  armedAt: number;
  closed: boolean;
  seconds: number;
  /** The captured stereo audio (for playback). */
  l: Float32Array;
  r: Float32Array;
  /** Min / max per column (the waveform), its RMS (ADDITIVE: the shared
   *  renderer's core) and the voice per column. */
  cols: { lo: Float32Array; hi: Float32Array; voice: Uint8Array; rms?: Float32Array };
  /** Peak (dBFS) of the take. */
  peakDb: number;
  /** The mic is in the take somewhere. */
  hasVoice: boolean;
  clipped: number;
};

const COLS = 240;
let cached: { v: number; view: TakeView | null } = { v: -1, view: null };

function viewOf(t: Take | null): TakeView | null {
  if (!t) return null;
  const n = t.written;
  const lo = new Float32Array(COLS);
  const hi = new Float32Array(COLS);
  const voice = new Uint8Array(COLS);
  const rms = new Float32Array(COLS);
  let pk = 0;
  let clip = 0;
  const per = Math.max(1, Math.floor(n / COLS));
  for (let c = 0; c < COLS; c++) {
    let a = 0;
    let b = 0;
    let m = 0;
    let sq = 0;
    const s0 = c * per;
    const s1 = Math.min(n, s0 + per);
    for (let i = s0; i < s1; i++) {
      const x = (t.l[i] + t.r[i]) / 2;
      if (x < a) a = x;
      if (x > b) b = x;
      sq += x * x;
      const ab = Math.max(Math.abs(t.l[i]), Math.abs(t.r[i]));
      if (ab > pk) pk = ab;
      if (ab >= 0.9999) clip++;
      const mm = Math.abs(t.mic[i]);
      if (mm > m) m = mm;
    }
    lo[c] = a;
    hi[c] = b;
    rms[c] = s1 > s0 ? Math.sqrt(sq / (s1 - s0)) : 0;
    voice[c] = m > 0.0032 ? 1 : 0; // the mic's own part above −50 dBFS
  }
  return {
    armedAt: t.armedAt,
    closed: t.closedAt != null,
    seconds: n / SR,
    l: t.l.subarray(0, n),
    r: t.r.subarray(0, n),
    cols: { lo, hi, voice, rms },
    peakDb: pk > 0 ? 20 * Math.log10(pk) : -Infinity,
    hasVoice: voice.some((x) => x === 1),
    clipped: clip,
  };
}

export function getTake(): TakeView | null {
  if (cached.v !== version) cached = { v: version, view: viewOf(take) };
  return cached.view;
}

/** Recording now? */
export const takeOpen = (): boolean => !!take && take.closedAt == null;

function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useTake(): TakeView | null {
  return useSyncExternalStore(subscribe, getTake, getTake);
}
