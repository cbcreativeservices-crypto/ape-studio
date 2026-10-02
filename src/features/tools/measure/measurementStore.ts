/**
 * measurementStore — the device-local Saved Measurement Library (Phase 2,
 * spec §7). Same tiny external-store pattern as enrollmentStore: module list +
 * listeners + hydrate/commit + a useMeasurements() hook.
 *
 * STORAGE MOVED 2026-09-11, after a device pass lost real data. This file used
 * to keep the whole library as one JSON blob under a single AsyncStorage key,
 * with its own docblock warning that big grids must move to the SQLite split.
 * The Spectrogram and MultiMeter tools shipped exactly those grids (~119 KB a
 * snapshot), and about twenty of them produced, on an Android device:
 *
 *     Error: database or disk is full (code 13 SQLITE_FULL)
 *
 * with the library gone after a restart. The ceiling belongs to AsyncStorage,
 * not to this feature: on Android it is ONE SQLite database capped at build
 * time (default 6 MB) shared by all ~102 `ape:` keys in the app — so an
 * oversized library does not just lose itself, it stops progress, enrollments,
 * bookmarks and settings from saving too. Rows now live in the app's own
 * SQLite database (measurementsBackend.native.ts), which has no such cap.
 *
 * DEVICE-LOCAL by design: backend frozen; tools tech-spec §7.2 forbids
 * measurement content server-side (no audio uploads, no calibration in DB).
 */
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  clearAllRows,
  deleteRows,
  putRow,
  readAllRows,
  replaceAllRows,
  type MeasurementRow,
} from './measurementsBackend';
import { WARNING_INFO, type SavedMeasurement } from './types';
import { QUALITY_LABEL } from './quality';
import { TOOLS, type ToolKey } from '../../../screens/tools/toolsData';

/** The pre-2026-09-11 whole-library-in-one-value key. Read once, then DELETED
 *  — see migrateLegacyKey. */
const LEGACY_KEY = 'ape:toolMeasurements';
/** Practical cap — oldest drop first past this (spec §18 "avoid" list). */
const MAX_SAVED = 200;

let list: SavedMeasurement[] = [];
let hydrated = false;
let hydrating: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}
function rowOf(m: SavedMeasurement): MeasurementRow {
  return { id: m.id, created_at: m.created_at, json: JSON.stringify(m) };
}

/** A write that fails must be AUDIBLE. It used to be fire-and-forget, so a
 *  rejection vanished and the user kept a library on screen that was never
 *  stored — which is precisely how the 2026-09-11 loss stayed invisible until a
 *  restart. Never throws: a storage failure must not take down a tool. */
function guard(what: string, p: Promise<void>): void {
  void p.catch((e: unknown) => {
    console.warn(`[measurements] ${what} FAILED — the library on screen is not persisted:`, e);
  });
}

/** Per-record sanitize (house pattern — enrollmentStore/enrolledBundles): drop
 *  unusable records, degrade unknown enum values, so the display path can never
 *  crash on corrupt or version-skewed data (review 2026-07-23). */
function sanitize(parsed: unknown): SavedMeasurement[] {
  if (!Array.isArray(parsed)) return [];
  return (parsed as SavedMeasurement[])
    .filter(
      (m) =>
        m != null &&
        typeof m.id === 'string' &&
        typeof m.created_at === 'string' &&
        TOOLS.some((t) => t.key === m.tool_type) &&
        m.data_payload != null &&
        typeof m.data_payload.kind === 'string',
    )
    .map((m) => ({
      ...m,
      quality_state: m.quality_state in QUALITY_LABEL ? m.quality_state : 'caution',
      warning_flags: (Array.isArray(m.warning_flags) ? m.warning_flags : []).filter(
        (f) => f in WARNING_INFO,
      ),
    }));
}

/**
 * Move a pre-2026-09-11 library out of the single AsyncStorage value, then
 * DELETE that value.
 *
 * The delete is the half that matters most, and it is why this runs even when
 * the old key holds nothing usable. A phone that already hit SQLITE_FULL has a
 * full AsyncStorage database, and while it stays full EVERY key in the app
 * fails to write — progress, enrollments, settings, not just measurements.
 * Removing the oversized value is what gives that space back, so an affected
 * device heals itself on the next launch instead of needing its data cleared.
 *
 * Deletes do not need free space, so this works on exactly the device that
 * cannot write. Best-effort throughout: a phone that has never saved a
 * measurement must not pay a failure for a key it does not have.
 */
async function migrateLegacyKey(): Promise<SavedMeasurement[]> {
  // READ and REMOVE are separate steps on purpose. The device this has to
  // rescue is the one whose old value is too big to read back — on Android a
  // value past the ~2 MB CursorWindow throws on getItem — and an early return
  // or a shared try/catch would skip the removal on exactly that device,
  // leaving it stuck full forever. A failed read means nothing is recoverable,
  // which also means nothing can be lost by dropping the key.
  let raw: string | null = null;
  let unreadable = false;
  try {
    raw = await AsyncStorage.getItem(LEGACY_KEY);
  } catch {
    unreadable = true;
  }
  if (!unreadable && raw == null) return []; // never had one — nothing to do

  let carried: SavedMeasurement[] = [];
  if (raw != null) {
    try {
      carried = sanitize(JSON.parse(raw));
    } catch {
      carried = []; // truncated or corrupt — the records are gone, the space is not
    }
  }

  // Only drop the original once its contents are safely re-homed. If the new
  // store refuses the write, keeping the old key is the lesser harm: it costs
  // space, whereas removing it costs the library.
  let safeToDrop = true;
  if (carried.length > 0) {
    try {
      await replaceAllRows(carried.map(rowOf));
    } catch (e) {
      safeToDrop = false;
      console.warn('[measurements] could not re-home the legacy library; keeping the old key:', e);
    }
  }
  if (safeToDrop) {
    try {
      // A delete needs no free space, so this works on the full database that
      // cannot accept a write — which is the whole point.
      await AsyncStorage.removeItem(LEGACY_KEY);
      console.warn(
        `[measurements] migrated ${carried.length} record(s) out of the legacy AsyncStorage key ` +
          `and freed it${unreadable ? ' (its contents were unreadable)' : ''} — the library now lives in SQLite.`,
      );
    } catch (e) {
      console.warn('[measurements] the legacy key could not be removed and is still holding space:', e);
    }
  }
  return carried;
}

/** Bumped by resetLocal (account wipe / switch). A hydrate that was already
 *  reading when the wipe ran must not land afterwards: it would put the
 *  PREVIOUS account's rows back on screen, and every later save would merge
 *  into them (toddler pass 3 2026-09-30 — the generation fence the other
 *  per-account stores gained today). */
let generation = 0;
/** Account wipes (clearStoredMeasurements) still clearing the table. */
let wipesRunning = 0;
/** The last library read FAILED (toddler evening 2026-10-02, pass 2). A failed
 *  read used to be latched as an EMPTY library (`hydrated = true`) for the
 *  rest of the session: "NO SAVED MEASUREMENTS YET" over a library that was
 *  still on disk, until the app was killed. Now nothing is latched — the next
 *  mount or save reads again — and the library screen says it could not read. */
let readFailed = false;

/** True while the saved library could not be read (see readFailed). */
export function measurementsUnreadable(): boolean {
  return readFailed;
}

async function hydrate(): Promise<void> {
  if (hydrated) return;
  if (!hydrating) {
    const gen = generation;
    hydrating = (async () => {
      let next: SavedMeasurement[];
      try {
        const carried = await migrateLegacyKey();
        const rows = await readAllRows();
        next = carried.length > 0 && rows.length === 0
          ? carried
          : sanitize(
              rows.flatMap((r) => {
                try {
                  return [JSON.parse(r.json) as SavedMeasurement];
                } catch {
                  return []; // one corrupt row must not cost the whole library
                }
              }),
            );
      } catch (e) {
        // A READ that failed is not an empty library (corrupt rows are already
        // dropped one by one above). Not latched: the next use reads again.
        if (gen !== generation) return;
        console.warn('[measurements] the saved library could not be read:', e);
        hydrating = null;
        if (!readFailed) {
          readFailed = true;
          emit();
        }
        return;
      }
      if (gen !== generation) return; // wiped mid-read — the next hydrate reads the cleared store
      list = next;
      hydrated = true;
      readFailed = false;
      emit();
    })();
  }
  return hydrating;
}

/** Newest-first list, optionally filtered to one tool. */
export function getMeasurements(toolKey?: ToolKey): SavedMeasurement[] {
  // Not on every render after a failed read (the failure emits, the render
  // would read again, fail, emit…): mounts and saves retry it instead.
  if (!readFailed) void hydrate();
  const l = toolKey ? list.filter((m) => m.tool_type === toolKey) : list;
  return [...l].sort((x, y) => (x.created_at < y.created_at ? 1 : -1));
}

// Every mutator is HYDRATE-FIRST (review 2026-07-23): a cold-launch save must
// merge with the persisted library, never overwrite it. hydrate() caches its
// promise, so once hydrated these resolve on the microtask queue — callers
// keep their synchronous void signatures.

// Writes are now PER ROW rather than "serialize the whole library again".
// Saving one 119 KB snapshot used to rewrite every other record with it, so the
// cost of a save grew with the size of the library it was being added to.

/**
 * Save a measurement. RESOLVES FALSE IF IT DID NOT REACH DISK.
 *
 * ── "SAVED ✓" USED TO BE UNCONDITIONAL (2026-09-17, bug-hunt pass 3) ──────
 *
 * This was `void` and fire-and-forget: the write went through `guard()`, whose
 * entire failure path is a `console.warn` — and this file's own header says a
 * failed write "must be AUDIBLE". It was audible to a developer. Every one of
 * the eight call sites then set its success state on the next line, so the user
 * saw SAVED ✓, the record appeared in the in-memory library, and it was gone on
 * the next launch. That is exactly how the 2026-09-11 SQLITE_FULL loss stayed
 * invisible.
 *
 * The in-memory list is still updated first, because the record IS valid and the
 * user should see it for this session; what changes is that the caller can now
 * tell them the truth about whether it will still be there tomorrow.
 */
/**
 * How this module tells a HUMAN that a write failed.
 *
 * Injected rather than imported: the dialog helper pulls in react-native, and
 * this store is covered by a node test that cannot load it. Defaults to nothing
 * so the store stays usable headless; `App` wires the real one once at start-up.
 */
let reportSaveFailure: ((title: string, body: string) => void) | null = null;

export function setMeasurementFailureReporter(fn: (title: string, body: string) => void): void {
  reportSaveFailure = fn;
}

export function saveMeasurement(m: SavedMeasurement): Promise<boolean> {
  // The account this measurement was taken under (night pass 2026-10-01). A
  // save waits on hydrate(); an account wipe landing in that window used to
  // let it continue afterwards and write the PREVIOUS account's record into
  // the freshly wiped store — the next account's library then opened on it.
  const gen = generation;
  // A save the account switch refused is SAID too (pattern hunt wave 3,
  // 2026-10-02, class P6): both fences below answered false in silence while
  // the tool flashed "SAVED ✓" on the next line.
  const refusedBySwitch = () =>
    reportSaveFailure?.(
      'Measurement not saved',
      'The account on this device changed while this measurement was being saved, so it was not written. Take it again.',
    );
  if (wipesRunning > 0) {
    refusedBySwitch(); // see clearStoredMeasurements
    return Promise.resolve(false);
  }
  return hydrate().then(async () => {
    if (gen !== generation) {
      refusedBySwitch();
      return false;
    }
    const next = [...list, m];
    // Enforce the cap oldest-first (by created_at).
    let dropped: SavedMeasurement[] = [];
    if (next.length > MAX_SAVED) {
      next.sort((x, y) => (x.created_at < y.created_at ? -1 : 1));
      dropped = next.splice(0, next.length - MAX_SAVED);
    }
    list = next;
    let ok = true;
    try {
      await putRow(rowOf(m));
    } catch (e) {
      console.warn('[measurements] save FAILED — the library on screen is not persisted:', e);
      ok = false;
      // SAID OUT LOUD, FROM HERE (2026-09-17). Eight tools call this and every
      // one of them showed "SAVED ✓" on the next line, so the message lives in
      // the store rather than in eight screens that would each have to remember.
      // A measurement is often taken once, on site, in a room the person will
      // not be standing in again — finding out tomorrow is not good enough.
      reportSaveFailure?.(
        'Measurement not saved',
        'This device could not write the measurement to storage — it is on screen for now, but it will be gone when you close the app. Free up some space and take it again.',
      );
    }
    // A failed TRIM is not a failed save: the record the user asked for is on
    // disk, and an over-long library is self-correcting on the next write.
    if (dropped.length > 0) guard('trim', deleteRows(dropped.map((d) => d.id)));
    emit();
    return ok;
  });
}

/** One id, or a bulk selection — a bulk delete is ONE storage call and, if it
 *  fails, one popup. */
export function deleteMeasurement(idOrIds: string | string[]): void {
  const ids = new Set(Array.isArray(idOrIds) ? idOrIds : [idOrIds]);
  void hydrate().then(() => {
    const gone = list.filter((m) => ids.has(m.id));
    if (gone.length === 0) return;
    const gen = generation;
    list = list.filter((m) => !ids.has(m.id));
    emit();
    // A delete that did not reach disk is SAID and the rows come back
    // (toddler evening 2026-10-02, pass 2): they used to vanish from the
    // library with only a console.warn, then reappear on the next launch.
    deleteRows(gone.map((m) => m.id)).catch((e: unknown) => {
      console.warn('[measurements] delete FAILED — the records are still stored:', e);
      if (gen !== generation) return;
      const back = gone.filter((g) => !list.some((m) => m.id === g.id));
      if (back.length === 0) return;
      list = [...list, ...back];
      emit();
      reportSaveFailure?.(
        back.length === 1 ? 'Measurement not deleted' : 'Measurements not deleted',
        back.length === 1
          ? 'This device could not remove the measurement from storage, so it is still saved. Try deleting it again.'
          : `This device could not remove ${back.length} measurements from storage, so they are still saved. Try deleting them again.`,
      );
    });
  });
}

export function updateMeasurement(id: string, patch: Partial<Pick<SavedMeasurement, 'title' | 'notes'>>): void {
  void hydrate().then(() => {
    const updated = list.find((m) => m.id === id);
    if (!updated) return;
    const next = { ...updated, ...patch };
    list = list.map((m) => (m.id === id ? next : m));
    guard('update', putRow(rowOf(next)));
    emit();
  });
}

/**
 * WIPE the stored library (account switch / guest exit — clearLocalAccountData).
 *
 * This has to be called explicitly now. The account wipe works by removing
 * every `ape:*` AsyncStorage key, which used to include this library; a SQLite
 * table is invisible to that sweep, so without this the next account to sign in
 * on the device would inherit the previous one's saved measurements. Awaited
 * rather than fire-and-forget: a wipe that has not finished is not a wipe.
 */
export async function clearStoredMeasurements(): Promise<void> {
  // Fence FIRST (night pass 2 2026-10-01). The pass-1 save fence only bumped
  // in resetLocal(), AFTER the awaited table clear — so on a warm library a
  // SAVE tapped while that clear was running passed its check, and its row
  // could be written after the DELETE: the next account opened on it. A save
  // ISSUED during the clear belongs to the departing account too (wipesRunning).
  generation++;
  wipesRunning++;
  try {
    await clearAllRows();
  } catch (e) {
    console.warn('[measurements] wipe FAILED — stored measurements may survive the switch:', e);
  } finally {
    wipesRunning--;
  }
  resetLocal();
}

/** Reset the IN-MEMORY cache (account wipe / user switch — clearLocalAccountData).
 *  Clears the list + hydrated flags and emits so live useMeasurements() hooks
 *  re-render empty; the next read re-hydrates from the (cleared) storage. */
export function resetLocal(): void {
  generation++;
  list = [];
  hydrated = false;
  hydrating = null;
  readFailed = false;
  emit();
}

/** Reactive hook — hydrates on first use. */
export function useMeasurements(toolKey?: ToolKey): SavedMeasurement[] {
  const [, setTick] = useState(0);
  useEffect(() => {
    const l = () => setTick((t) => t + 1);
    listeners.add(l);
    void hydrate();
    return () => {
      listeners.delete(l);
    };
  }, []);
  return getMeasurements(toolKey);
}
