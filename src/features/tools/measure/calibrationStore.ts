/**
 * calibrationStore — the SPL meter's DEVICE-LOCAL field-calibration offset
 * (ruling R1, 2026-07-23): the user matches the app against a reference
 * sound-level meter; the single dB offset lives on THIS device only — never
 * server-side (tech-spec §7.2). Calibrated readings display
 * "dB SPL · field-calibrated (approximate)" — approximate ALWAYS.
 *
 * On the shared safe store (pattern catalog 2026-10-02, closer A2; wave 2).
 * A read that FAILED used to start the meter uncalibrated AND mark it
 * hydrated, so the next CALIBRATE / CLEAR was the only thing on screen and a
 * failed read was indistinguishable from "never calibrated". Now a read that
 * throws leaves the store unreadable: nothing is written over the stored
 * offset, and a CALIBRATE made meanwhile is held and written after the next
 * read that succeeds. A blob that will not parse is set aside under
 * `ape:splCalOffset:damaged` and the meter reads uncalibrated (as before).
 *
 * The key is on the wipe's KEEP list (hardware, governance R1). The store's
 * registered reset only drops the in-memory copy on an account change; the
 * next read brings the same device offset straight back.
 */
import { createLocalStore } from '../../storage/localStore';

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

const store = createLocalStore<SplCalibration | null>({
  key: KEY,
  empty: () => null,
  parse: (parsed) => {
    // In range too (toddler pass 2026-09-30): the stepper is clamped now,
    // but an offset mashed below 0 BEFORE the clamp shipped is still on
    // disk, and it pins every SPL reading to 0.0 dB for good — the device
    // reads as uncalibrated instead until the user calibrates again.
    const c = parsed as SplCalibration | null;
    if (
      c != null &&
      typeof c === 'object' &&
      typeof c.offsetDb === 'number' &&
      Number.isFinite(c.offsetDb) &&
      clampCalOffset(c.offsetDb) === c.offsetDb
    ) {
      return { offsetDb: c.offsetDb, setAt: typeof c.setAt === 'string' ? c.setAt : '' };
    }
    return null;
  },
  // Uncalibrated = nothing saved: CLEAR removes the key.
  serialize: (v) => (v == null ? null : JSON.stringify(v)),
});

export function getSplCalibration(): SplCalibration | null {
  return store.get();
}

/** Set (or clear with null) the field-calibration offset. Applied on top of
 *  the hydrated value by the shared store, so a cold-path write can't race
 *  the load.
 *
 *  RESOLVES FALSE IF THE WRITE DID NOT REACH DISK (full run 2, 2026-10-02).
 *  The write's failure used to be swallowed (`.catch(() => {})`): a full
 *  AsyncStorage database (the documented Android SQLITE_FULL) left the meter
 *  reading "field-calibrated" for this session and uncalibrated on the next
 *  launch, with nothing said — the same silent loss saveMeasurement() stopped
 *  hiding on 2026-09-17. The in-memory value still applies for this session;
 *  the caller tells the user it will not survive a restart. Also false while
 *  the stored copy is unreadable (the change is held, never written over it).
 *  Never rejects. */
export function setSplCalibration(offsetDb: number | null): Promise<boolean> {
  const next: SplCalibration | null = offsetDb == null ? null : { offsetDb, setAt: new Date().toISOString() };
  return store.set(next).then((ok) => {
    if (!ok) console.warn('[calibration] write FAILED — the calibration on screen is not persisted');
    return ok;
  });
}

export function useSplCalibration(): SplCalibration | null {
  return store.use();
}
