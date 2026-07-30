/**
 * ape-optical — JS API for the native OPTICAL (camera-luma) capture module
 * (owner 2026-07-29). The backend for the Frequency Counter's LIGHT PULSE
 * mode: it opens the camera, computes the mean luminance of each frame, and
 * exposes a rolling (timestamp, luma) series. The frequency estimate itself is
 * done in JS (autocorrelation on the luma series) so the honesty framing and
 * the frame-rate ceiling live next to the UI.
 *
 * WHY A SEPARATE MODULE (not ape-dsp): isolation — the camera pipeline must
 * never touch the audio RT thread. Mirrors ape-dsp's gate contract exactly:
 *   • isAvailable()  — the native module is in THIS build. FALSE on web, in
 *     Expo Go, and on every dev client built BEFORE this module shipped, so
 *     callers degrade to the honest "install the new dev build" state, never
 *     crash, never simulate.
 *   • moduleVersion() — bump when the native surface changes.
 *
 * ⚠️ NATIVE: adding this module changes the native fingerprint. It cannot be
 * hot-reloaded over Metro — it needs `expo prebuild` + a NEW EAS dev build +
 * on-device validation (rolling-shutter / frame-rate aliasing per device).
 *
 * PHYSICS HONESTY: a phone camera samples at its FRAME RATE, so the highest
 * flicker it can resolve is fps/2 (Nyquist): ~15 Hz at 30 fps, ~30 Hz at
 * 60 fps. Faster flicker ALIASES (and rolling shutter can fold it further).
 * Suitable for slow flashing indicators, strobes, and rotating machinery with
 * a marker — NOT arbitrary audio-rate measurement. The UI must disclose this.
 */
import { requireOptionalNativeModule } from 'expo-modules-core';

/** One pull of the rolling luma series. `seq` is monotonic per sample so the
 *  JS consumer can append only what's new. `ts` are ms (monotonic clock),
 *  `luma` are 0..1 mean-frame luminance. */
export type LumaFrame = {
  /** Sequence of the LAST sample in this batch (monotonic, per-sample). */
  seq: number;
  /** Timestamps (ms) of the samples in this batch, oldest→newest. */
  ts: number[];
  /** Mean-frame luminance 0..1, aligned with `ts`. */
  luma: number[];
  /** Measured camera frame rate (Hz) — the Nyquist ceiling is fps/2. */
  fps: number;
  running: boolean;
  /** Rolling frame count (diagnostics). */
  frameCount: number;
  lastError: string;
};

type OpticalNative = {
  moduleVersion(): number;
  start(): Promise<void>;
  stop(): Promise<void>;
  /** Pull samples with seq > sinceSeq (0 = everything currently buffered). */
  getSamples(sinceSeq: number): LumaFrame;
  /** Best-effort current permission state without prompting:
   *  'granted' | 'denied' | 'undetermined'. */
  getPermissionStatus(): string;
};

const native = requireOptionalNativeModule<OpticalNative>('ApeOptical');

export function isAvailable(): boolean {
  return native != null;
}

export function moduleVersion(): number {
  return native ? native.moduleVersion() : 0;
}

export async function start(): Promise<void> {
  if (!native) throw new Error('ape-optical native module absent — needs the new dev build');
  await native.start();
}

export async function stop(): Promise<void> {
  if (native) await native.stop();
}

export function getSamples(sinceSeq: number): LumaFrame | null {
  return native ? native.getSamples(sinceSeq) : null;
}

export function getPermissionStatus(): 'granted' | 'denied' | 'undetermined' {
  if (!native) return 'undetermined';
  const s = native.getPermissionStatus();
  return s === 'granted' || s === 'denied' ? s : 'undetermined';
}
