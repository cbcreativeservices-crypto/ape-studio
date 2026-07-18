/**
 * useShake — fire a callback on a phone shake (Booth 2026-07-11). The native
 * accelerometer module (expo-sensors) is GUARDED with a lazy require: on a build
 * that doesn't yet include it, the require throws and we no-op (no crash). A new
 * EAS dev build is required for shake to actually fire.
 */
import { useEffect, useRef } from 'react';

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

export function useShake(onShake: () => void, enabled = true): void {
  const cb = useRef(onShake);
  cb.current = onShake;
  const last = useRef(0);

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
