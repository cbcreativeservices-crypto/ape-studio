/**
 * gaEngineProtocol — the messages between the Game Audio lab and its SOUND
 * ENGINE (engine/gaEngineSource.ts). Pure types and two small encoders; no
 * React Native, so node:test reaches it directly.
 *
 * WHY THIS LAB HAS ITS OWN ENGINE (plan 2026-11-12, must-do D60). The other
 * labs render a few seconds of audio in TypeScript and hand the file to
 * expo-audio; a control change is heard about 0.9 s later (dj/booth/
 * useBoothAudio.ts). Here the lesson IS "the game asks, and the sound starts
 * now", so the lab drives the platform's Web Audio graph instead: directly in
 * the web build, and inside a hidden web view on a phone. One protocol, one
 * engine source, two transports.
 *
 * The engine is a VOICE SERVER and nothing more: it holds decoded buffers,
 * starts and stops voices, ramps their gain / pan / rate / filter, sums them
 * through category buses, and runs the music transport on its own clock. It
 * makes NO game decision. Which sound plays, which variation, which voice is
 * refused at the limit — all of that is the pure model's job (model/gaModel),
 * so it is tested without a device and survives a change of engine.
 *
 * HONESTY RULE the protocol carries: a `start` is only a REQUEST. The engine
 * answers `started` (with the audio-clock time it was scheduled for) or
 * `failed` (with the reason). The lab never shows "playing" from a request.
 */

/** The mix categories (the lab's buses). `chat` is an illustrative path. */
export const GA_BUSES = ['ambience', 'sfx', 'dialogue', 'music', 'ui', 'chat'] as const;
export type GaBus = (typeof GA_BUSES)[number];

/** How a voice is placed between the two ears.
 *   none   — played as authored (a stereo bed, an interface cue)
 *   stereo — live left/right pan (−1 … +1)
 *   hrtf   — the platform's head-related (binaural) panner; headphones */
export type GaPanMode = 'none' | 'stereo' | 'hrtf';

/** A direction from the listener: +x right, +y up, −z straight ahead. */
export type GaVec3 = readonly [number, number, number];

export type GaMusicBoundary = 'now' | 'beat' | 'bar' | 'phrase';

/* ── lab → engine ───────────────────────────────────────────────────────── */

export type GaCmd =
  | { t: 'init' }
  /** Decoded audio. `i16` = base64 little-endian 16-bit per channel (the web
   *  view transport); `f32` = the samples themselves (the web transport). */
  | { t: 'buffer'; id: string; sr: number; i16?: string[]; f32?: Float32Array[] }
  | {
      t: 'start';
      /** The lab's own voice id — the engine echoes it in every answer. */
      v: string;
      buf: string;
      bus: GaBus;
      /** Linear gain of this voice (source gain × distance × variation). */
      gain: number;
      mode: GaPanMode;
      pan?: number;
      pos?: GaVec3;
      rate?: number;
      loop?: boolean;
      /** Seconds before the voice starts (a delayed secondary layer). */
      delay?: number;
      fadeIn?: number;
      /** Low-pass corner in Hz (an authored obstruction treatment). */
      lowpass?: number;
      /** Send into the shared reverb, 0 … 1. */
      rev?: number;
    }
  | { t: 'set'; v: string; gain?: number; pan?: number; pos?: GaVec3; rate?: number; lowpass?: number; rev?: number; ramp?: number }
  | { t: 'stop'; v: string; fade?: number }
  | { t: 'bus'; bus: GaBus; gain: number; ramp?: number }
  /** The lab's own master fader, 0 … 1, BEFORE the fixed output ceiling. */
  | { t: 'master'; gain: number; ramp?: number }
  /** Fold the whole mix to mono (the mono-compatibility check). */
  | { t: 'mono'; on: boolean }
  /** Measure only: everything runs and is metered, the device gets nothing. */
  | { t: 'silent'; on: boolean }
  | { t: 'reverb'; buf: string; gain: number }
  | {
      t: 'music';
      op: 'start';
      bpm: number;
      beatsPerBar: number;
      barsPerPhrase: number;
      stems: { id: string; buf: string; gain: number }[];
    }
  | { t: 'music'; op: 'layers'; req: string; at: GaMusicBoundary; gains: Record<string, number>; ramp?: number }
  | { t: 'music'; op: 'stinger'; req: string; at: GaMusicBoundary; buf: string; gain: number }
  | { t: 'music'; op: 'cancel'; req: string }
  | { t: 'music'; op: 'stop'; fade?: number }
  | { t: 'stopAll'; fade?: number }
  | { t: 'suspend' }
  | { t: 'resume' }
  | { t: 'ping' }
  | { t: 'dispose' };

/* ── engine → lab ───────────────────────────────────────────────────────── */

export type GaEngineState = 'running' | 'suspended' | 'closed';

/** Why a start did not sound. */
export type GaFailWhy = 'no-context' | 'suspended' | 'missing-buffer' | 'bad-bus' | 'error';

export type GaEvt =
  | { e: 'ready'; sr: number; state: GaEngineState; hrtf: boolean }
  | { e: 'state'; state: GaEngineState }
  | { e: 'buffer'; id: string; ok: boolean; seconds?: number; why?: string }
  /** `at` and `now` are AUDIO-CLOCK seconds: the voice sounds at `at`. */
  | { e: 'started'; v: string; at: number; now: number }
  | { e: 'failed'; v: string; why: GaFailWhy; detail?: string }
  | { e: 'ended'; v: string; why: 'natural' | 'stopped' }
  | { e: 'music'; what: 'started'; at: number; bar: number; beat: number; phrase: number }
  /** A change is waiting for its boundary: it lands in `inS` seconds. */
  | { e: 'music'; what: 'queued'; req: string; at: number; inS: number; boundary: GaMusicBoundary }
  | { e: 'music'; what: 'applied'; req: string; at: number }
  | { e: 'music'; what: 'cancelled'; req: string }
  | { e: 'music'; what: 'stopped' }
  /** The mix BEFORE the output ceiling: RMS and peak, linear full scale;
   *  `l` / `r` are each side's RMS (how a pan is SHOWN, not just claimed). */
  | { e: 'level'; rms: number; peak: number; l: number; r: number; voices: number }
  | { e: 'clock'; now: number; state: GaEngineState; latencyS: number | null }
  | { e: 'error'; msg: string };

/* ── encoders (the web view transport) ──────────────────────────────────── */

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** Float samples (−1 … +1) → base64 of little-endian 16-bit PCM. Clamps; a
 *  NaN becomes silence. Written out (no Buffer / btoa) so it runs the same in
 *  Hermes, in a browser and under node:test. */
export function f32ToI16Base64(x: Float32Array): string {
  const n = x.length;
  const bytes = new Uint8Array(n * 2);
  for (let i = 0; i < n; i++) {
    let s = x[i];
    if (!(s === s)) s = 0;
    if (s > 1) s = 1;
    else if (s < -1) s = -1;
    const v = Math.round(s * 32767);
    bytes[2 * i] = v & 255;
    bytes[2 * i + 1] = (v >> 8) & 255;
  }
  const parts: string[] = [];
  let chunk = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const c = i + 2 < bytes.length ? bytes[i + 2] : 0;
    chunk += B64[a >> 2] + B64[((a & 3) << 4) | (b >> 4)];
    chunk += i + 1 < bytes.length ? B64[((b & 15) << 2) | (c >> 6)] : '=';
    chunk += i + 2 < bytes.length ? B64[c & 63] : '=';
    if (chunk.length >= 8192) {
      parts.push(chunk);
      chunk = '';
    }
  }
  parts.push(chunk);
  return parts.join('');
}

/** The inverse, for tests (the engine has its own copy in plain JS). */
export function i16Base64ToF32(b64: string): Float32Array {
  const clean = b64.replace(/=+$/, '');
  const bytes = new Uint8Array(Math.floor((clean.length * 3) / 4));
  let o = 0;
  for (let i = 0; i < clean.length; i += 4) {
    const a = B64.indexOf(clean[i]);
    const b = B64.indexOf(clean[i + 1]);
    const c = i + 2 < clean.length ? B64.indexOf(clean[i + 2]) : -1;
    const d = i + 3 < clean.length ? B64.indexOf(clean[i + 3]) : -1;
    bytes[o++] = (a << 2) | (b >> 4);
    if (c >= 0) bytes[o++] = ((b & 15) << 4) | (c >> 2);
    if (d >= 0) bytes[o++] = ((c & 3) << 6) | d;
  }
  const n = o >> 1;
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const v = ((bytes[2 * i] | (bytes[2 * i + 1] << 8)) << 16) >> 16;
    out[i] = v / 32767;
  }
  return out;
}
