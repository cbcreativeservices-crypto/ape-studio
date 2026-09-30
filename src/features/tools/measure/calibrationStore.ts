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

/** The offset range the community catalog accepts (docs/MIC_CATALOG_2026_08_21.sql:
 *  `offset_db between 0 and 200`). The calibrate stepper had no bound, so mashing
 *  −5 went negative — every reading then clamped to 0.0 dB SPL — and the one
 *  out-of-range contribution failed the whole upload batch on every retry. */
export const CAL_OFFSET_MIN_DB = 0;
export const CAL_OFFSET_MAX_DB = 200;
export function clampCalOffset(db: number): number {
  return Math.min(CAL_OFFSET_MAX_DB, Math.max(CAL_OFFSET_MIN_DB, db));
}

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
    if (cal == null) void AsyncStorage.removeItem(KEY).catch(() => {});
    else void AsyncStorage.setItem(KEY, JSON.stringify(cal)).catch(() => {});
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
