/**
 * ShakeToMute — a "panic mute" gesture (owner request 2026-07-26). Whenever
 * audio output is ENABLED, a decisive shake of the phone instantly silences
 * everything and re-locks the app to silent (panicMuteAudio). Renders nothing;
 * mounted once at the app root.
 *
 * Battery + correctness: the accelerometer is subscribed ONLY while audio can
 * sound (useAudioOutputEnabled) — the moment the panic re-mutes, the gate flips
 * false, this effect tears the listener down, so it never runs while silent.
 *
 * Shake vs bump: a jolt is one sample whose total acceleration exceeds SHAKE_G;
 * NEED jolts within WINDOW_MS count as a real shake. A single knock (one jolt)
 * never fires — you have to actually shake it.
 */
import { useEffect, useRef } from 'react';
import * as Haptics from 'expo-haptics';
import { Accelerometer } from 'expo-sensors';
import { useAudioOutputEnabled } from './audioOutputStore';
import { panicMuteAudio } from './panicMute';

const SHAKE_G = 1.9; // total acceleration magnitude (g) that counts as a jolt
const NEED = 2; // jolts required…
const WINDOW_MS = 700; // …within this window → a genuine shake

export function ShakeToMute() {
  const on = useAudioOutputEnabled();
  const jolts = useRef<number[]>([]);

  useEffect(() => {
    if (!on) return; // only listen while audio can sound
    let cancelled = false;
    let sub: { remove: () => void } | null = null;

    (async () => {
      try {
        if (!(await Accelerometer.isAvailableAsync()) || cancelled) return;
      } catch {
        return; // sensor unavailable (older client / platform) — degrade silently
      }
      if (cancelled) return;
      Accelerometer.setUpdateInterval(80); // ~12 Hz — plenty for a shake, light on battery
      jolts.current = [];
      sub = Accelerometer.addListener(({ x, y, z }) => {
        const g = Math.sqrt(x * x + y * y + z * z);
        if (g < SHAKE_G) return;
        const now = Date.now();
        jolts.current = jolts.current.filter((t) => now - t < WINDOW_MS);
        jolts.current.push(now);
        if (jolts.current.length >= NEED) {
          jolts.current = [];
          try {
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          } catch {
            /* haptics optional */
          }
          panicMuteAudio();
        }
      });
    })();

    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, [on]);

  return null;
}
