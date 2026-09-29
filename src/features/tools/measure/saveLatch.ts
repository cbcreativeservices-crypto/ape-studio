/**
 * saveLatch — one saved measurement per SAVE tap (bug hunt 2026-09-29).
 *
 * Every live tool's SAVE fires saveMeasurement() and then flips a "✓ SAVED"
 * badge for 1.8 s — but nothing stopped a second tap inside that window, so a
 * double-tap wrote two identical records to the library (RT60, SPL, RTA,
 * Spectrogram, Waveform, Frequency Counter ×2, MultiMeter). The latch refuses a
 * second claim within the same window the badge is up, which is exactly the
 * span in which a repeat press can only be an accident.
 */
import { useRef } from 'react';

/** Matches the tools' "✓ SAVED" badge (setJustSaved … 1800 ms). */
export const SAVE_LATCH_MS = 1800;

export type SaveLatch = { claim: () => boolean };

export function createSaveLatch(windowMs: number = SAVE_LATCH_MS, now: () => number = Date.now): SaveLatch {
  let last = -Infinity;
  return {
    claim() {
      const t = now();
      if (t - last < windowMs) return false;
      last = t;
      return true;
    },
  };
}

/** Per-mount latch. Call `claim()` right before saveMeasurement(), after every
 *  gate/validation return, and bail when it returns false. */
export function useSaveLatch(windowMs: number = SAVE_LATCH_MS): SaveLatch {
  const ref = useRef<SaveLatch | null>(null);
  if (ref.current == null) ref.current = createSaveLatch(windowMs);
  return ref.current;
}
