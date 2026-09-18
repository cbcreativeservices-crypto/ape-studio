/**
 * useShake — fire a callback on a phone shake (Booth 2026-07-11). The native
 * accelerometer module (expo-sensors) is GUARDED with a lazy require: on a build
 * that doesn't yet include it, the require throws and we no-op (no crash).
 *
 * ── THE SHAKE BELONGS TO THE SAFETY MUTE FIRST (2026-09-17, pass 4) ──────
 *
 * `ShakeToMute` is mounted globally and the sound-safety gate promises, in red
 * capitals, that shaking the phone at any time mutes everything instantly. But
 * this hook is ALSO bound in the full-screen study methods, where a shake marks
 * a flashcard known (a real write: the global known-terms list, plus a server
 * study-credit event feeding the flashcards-100% gate) or steps back a question.
 *
 * The thresholds make the collision the normal case rather than a race: the mute
 * needs two samples at 1.9 g, this fires on one sample at 1.8 g, so any shake
 * hard enough to mute necessarily fires the study write first. Someone reaching
 * for the emergency mute silently altered their own progress, and on an
 * already-known card the toggle un-knew it locally while the server credit
 * stayed — desyncing the list from the percentage.
 *
 * So a consumer that is not the mute passes `yieldToMute`, and the shake is
 * ignored whenever audio output is on — which is exactly when the safety gesture
 * has something to do. With sound off there is nothing to mute and the shortcut
 * is unambiguous, so it still works.
 */
import { useEffect, useRef } from 'react';
import { isAudioOutputEnabled } from '../features/audio/audioOutputStore';

let Accelerometer: {
  setUpdateInterval: (ms: number) => void;
  addListener: (cb: (d: { x: number; y: number; z: number }) => void) => { remove: () => void };
} | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Accelerometer = require('expo-sensors').Accelerometer;
} catch {
  Accelerometer = null;
}

export const SHAKE_AVAILABLE = Accelerometer != null;

export function useShake(
  onShake: () => void,
  enabled = true,
  /** Set by every consumer EXCEPT the safety mute. See the note above. */
  opts?: { yieldToMute?: boolean },
): void {
  const cb = useRef(onShake);
  cb.current = onShake;
  const last = useRef(0);
  const yieldToMute = useRef(false);
  yieldToMute.current = opts?.yieldToMute === true;

  useEffect(() => {
    if (!enabled || !Accelerometer) return;
    let sub: { remove: () => void } | null = null;
    try {
      Accelerometer.setUpdateInterval(120);
      sub = Accelerometer.addListener(({ x, y, z }) => {
        const g = Math.sqrt(x * x + y * y + z * z);
        if (g > 1.8) {
          const now = Date.now();
          if (now - last.current > 1200) {
            last.current = now;
            // The mute owns the gesture whenever there is sound to mute.
            if (yieldToMute.current && isAudioOutputEnabled()) return;
            cb.current();
          }
        }
      });
    } catch {
      sub = null;
    }
    return () => {
      try {
        sub?.remove();
      } catch {
        /* ignore */
      }
    };
  }, [enabled]);
}
