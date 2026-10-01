/**
 * renderRecorded — process a DECODED RECORDING through the house offline DSP
 * (earDsp biquads / shelves / gain) and hand the result to the existing
 * EarClipPlayer pipeline (2026-10-01).
 *
 * Pure: no React, no native import (the player is a type-only import), so the
 * processing is tested in Node. The React side — render → play behind the
 * audio gate, re-render on a control change, every stop path — is
 * useRecordedPlayback.ts, which follows useMasterPlayback.
 *
 * Order: slice (optionally looping a short clip) → mono/stereo → EQ (per
 * channel, in series) → gain → linked RMS level-match → peak safety → edge
 * fades. The app-wide −12 dB output ceiling is NOT applied here: EarClipPlayer
 * applies it to every player it creates (features/audio/outputCeiling), so a
 * rendered recording obeys it exactly like a synthesized clip.
 */
import {
  SR, applyBiquad, fadeEdges, rbj, type Biquad, type Buf, type Mono, type Stereo,
} from '../ear/earDsp';
import { ensureStereo, loopSlice, resample, toMono, trim } from './resample';
import type { EarClipPlayer } from '../ear/earPlayer';

/** A filter by description (built with earDsp.rbj) — or pass a ready Biquad. */
export type RecordedEqSpec = {
  type: 'peak' | 'lowshelf' | 'highshelf' | 'lowpass' | 'highpass' | 'notch';
  freq: number;
  gainDb?: number;
  q?: number;
};

export interface RecordedProcess {
  /** Where to start in the clip (s). Default 0. */
  startSec?: number;
  /** Length to render (s). Default: the rest of the clip. */
  durationSec?: number;
  /** When the clip is shorter than durationSec, loop it (with a 20 ms
   *  crossfade) instead of stopping short. Default true. */
  loop?: boolean;
  /** Fold to mono (average). Default false — stereo sources stay stereo. */
  mono?: boolean;
  /** Filters in series, applied to every channel. */
  eq?: readonly (Biquad | RecordedEqSpec)[];
  /** Plain gain after EQ (dB). */
  gainDb?: number;
  /** Level-match: scale so the RMS (all channels together) is this dBFS. */
  rmsTargetDb?: number;
  /** Peak safety: if any sample exceeds this, the whole render is turned DOWN
   *  to it (never clipped). Default 0.98. */
  peakCeiling?: number;
  /** Raised-cosine edge fade (earDsp.fadeEdges), ms. Default 8; 0 = none. */
  fadeMs?: number;
}

/** Anything with 48 kHz-ish channels — a LabClipBuffer or a DecodedAudio. */
export interface RecordedSource {
  channels: readonly Float32Array[];
  /** Assumed 48 000 when omitted; anything else is resampled first. */
  sampleRate?: number;
}

const isSpec = (f: Biquad | RecordedEqSpec): f is RecordedEqSpec => (f as RecordedEqSpec).type !== undefined;

export function toBiquad(f: Biquad | RecordedEqSpec): Biquad {
  if (!isSpec(f)) return f;
  const q = f.q ?? (f.type === 'peak' ? 1.4 : f.type === 'notch' ? 8 : f.type.endsWith('shelf') ? 0.9 : 0.707);
  return rbj(f.freq, q, f.gainDb ?? 0, f.type);
}

/** The channels of `src` at 48 kHz, cut to [startSec, startSec + durationSec). */
export function sliceRecorded(src: RecordedSource, startSec = 0, durationSec?: number, loop = true): Float32Array[] {
  const rate = src.sampleRate ?? SR;
  const chans = rate === SR ? [...src.channels] : resample(src.channels, rate, SR);
  const n = chans[0]?.length ?? 0;
  const start = Math.max(0, Math.round(startSec * SR));
  if (durationSec == null) return trim(chans, start);
  const want = Math.max(0, Math.round(durationSec * SR));
  if (start + want <= n || !loop || n === 0) return trim(chans, start, start + want);
  return loopSlice(chans, start, want, Math.round(0.02 * SR));
}

function rmsOf(chs: readonly Float32Array[]): number {
  let s = 0;
  let n = 0;
  for (const c of chs) {
    for (let i = 0; i < c.length; i++) s += c[i] * c[i];
    n += c.length;
  }
  return n ? Math.sqrt(s / n) : 0;
}

function peakOf(chs: readonly Float32Array[]): number {
  let p = 0;
  for (const c of chs) for (let i = 0; i < c.length; i++) {
    const a = Math.abs(c[i]);
    if (a > p) p = a;
  }
  return p;
}

function scaleInPlace(chs: Float32Array[], g: number): void {
  if (g === 1) return;
  for (const c of chs) for (let i = 0; i < c.length; i++) c[i] *= g;
}

/**
 * Render a recording through the process. Returns an earDsp Buf (Mono or
 * {l, r}) ready for EarClipPlayer.load. Never mutates the source.
 */
export function renderRecorded(src: RecordedSource, p: RecordedProcess = {}): Buf {
  let chs = sliceRecorded(src, p.startSec ?? 0, p.durationSec, p.loop ?? true);
  chs = p.mono || chs.length === 1 ? [toMono(chs)] : ensureStereo(chs);
  // Copy before any in-place work (slices may be views of the shared cache).
  const filters = (p.eq ?? []).map(toBiquad);
  let out: Float32Array[] = chs.map((c) => {
    let x: Mono = c;
    for (const f of filters) x = applyBiquad(x, f);
    return x === c ? new Float32Array(c) : x;
  });
  // A mono source in a stereo render shares one array — un-share it.
  if (out.length === 2 && out[0] === out[1]) out = [out[0], new Float32Array(out[0])];

  if (p.gainDb) scaleInPlace(out, 10 ** (p.gainDb / 20));
  if (p.rmsTargetDb != null) {
    const r = rmsOf(out);
    if (r > 1e-9) scaleInPlace(out, 10 ** (p.rmsTargetDb / 20) / r);
  }
  const ceiling = p.peakCeiling ?? 0.98;
  const pk = peakOf(out);
  if (pk > ceiling) scaleInPlace(out, ceiling / pk);
  const fadeMs = p.fadeMs ?? 8;
  if (fadeMs > 0) out = out.map((c) => fadeEdges(c, fadeMs));
  return out.length === 1 ? out[0] : ({ l: out[0], r: out[1] } as Stereo);
}

/** The minimum of EarClipPlayer this module drives (a type-only import). */
export type RecordedPlayer = Pick<EarClipPlayer, 'load' | 'play' | 'stop'>;

/**
 * Load rendered versions into a player and play one — behind the gate.
 * `requestAudioOutput` is the gate's ask (useAudioOutputGate); `isEnabled`
 * the last-moment check (audioOutputStore.isAudioOutputEnabled), because a
 * shake-to-mute can land during the load. Returns false when nothing played.
 */
export async function playRendered(
  player: RecordedPlayer,
  bufs: Buf[],
  index: number,
  gate: { requestAudioOutput: () => Promise<boolean>; isEnabled: () => boolean },
): Promise<boolean> {
  if (!(await gate.requestAudioOutput())) return false;
  await player.load(bufs);
  if (!gate.isEnabled()) return false;
  player.play(index);
  return true;
}
