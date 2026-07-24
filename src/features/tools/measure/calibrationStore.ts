/**
 * calibrationStore — the SPL meter's DEVICE-LOCAL field-calibration offset
 * (ruling R1, 2026-07-23): the user matches the app against a reference
 * sound-level meter; the single dB offset lives on THIS device only — never
 * server-side (tech-spec §7.2). Calibrated readings display
 * "dB SPL · field-calibrated (approximate)" — approximate ALWAYS.
 *
 * Same tiny external-store pattern as the sibling stores.
 */
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'ape:splCalOffset';

export type SplCalibration = {
  /** dB to ADD to a dBFS reading to display dB SPL. */
  offsetDb: number;
  /** ISO timestamp of when the user calibrated (context disclosure, spec §5). */
  setAt: string;
};

let cal: SplCalibration | null = null;
let hydrated = false;
let hydrating: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

async function hydrate(): Promise<void> {
  if (hydrated) return;
  if (!hydrating) {
    hydrating = (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        const parsed: unknown = raw ? JSON.parse(raw) : null;
        if (
          parsed != null &&
          typeof (parsed as SplCalibration).offsetDb === 'number' &&
          Number.isFinite((parsed as SplCalibration).offsetDb)
        ) {
          cal = parsed as SplCalibration;
        }
      } catch {
        cal = null; // corrupt → uncalibrated, never crash
      }
      hydrated = true;
      emit();
    })();
  }
  return hydrating;
}

export function getSplCalibration(): SplCalibration | null {
  void hydrate();
  return cal;
}

/** Set (or clear with null) the field-calibration offset. Hydrate-first so a
 *  cold-path write can't race the load (same discipline as measurementStore). */
export function setSplCalibration(offsetDb: number | null): void {
  void hydrate().then(() => {
    cal = offsetDb == null ? null : { offsetDb, setAt: new Date().toISOString() };
    if (cal == null) void AsyncStorage.removeItem(KEY);
    else void AsyncStorage.setItem(KEY, JSON.stringify(cal));
    emit();
  });
}

export function useSplCalibration(): SplCalibration | null {
  const [, setTick] = useState(0);
  useEffect(() => {
    const l = () => setTick((t) => t + 1);
    listeners.add(l);
    void hydrate();
    return () => {
      listeners.delete(l);
    };
  }, []);
  return cal;
}
