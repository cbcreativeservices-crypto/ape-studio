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

async function hydrate(): Promise<void> {
  if (hydrated) return;
  if (!hydrating) {
    hydrating = (async () => {
      try {
        const carried = await migrateLegacyKey();
        const rows = await readAllRows();
        list = carried.length > 0 && rows.length === 0
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
      } catch {
        list = []; // corrupt store — start clean rather than crash
      }
      hydrated = true;
      emit();
    })();
  }
  return hydrating;
}

/** Newest-first list, optionally filtered to one tool. */
export function getMeasurements(toolKey?: ToolKey): SavedMeasurement[] {
  void hydrate();
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

export function saveMeasurement(m: SavedMeasurement): void {
  void hydrate().then(() => {
    const next = [...list, m];
    // Enforce the cap oldest-first (by created_at).
    let dropped: SavedMeasurement[] = [];
    if (next.length > MAX_SAVED) {
      next.sort((x, y) => (x.created_at < y.created_at ? -1 : 1));
      dropped = next.splice(0, next.length - MAX_SAVED);
    }
    list = next;
    guard('save', putRow(rowOf(m)));
    if (dropped.length > 0) guard('trim', deleteRows(dropped.map((d) => d.id)));
    emit();
  });
}

export function deleteMeasurement(id: string): void {
  void hydrate().then(() => {
    if (!list.some((m) => m.id === id)) return;
    list = list.filter((m) => m.id !== id);
    guard('delete', deleteRows([id]));
    emit();
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
  try {
    await clearAllRows();
  } catch (e) {
    console.warn('[measurements] wipe FAILED — stored measurements may survive the switch:', e);
  }
  resetLocal();
}

/** Reset the IN-MEMORY cache (account wipe / user switch — clearLocalAccountData).
 *  Clears the list + hydrated flags and emits so live useMeasurements() hooks
 *  re-render empty; the next read re-hydrates from the (cleared) storage. */
export function resetLocal(): void {
  list = [];
  hydrated = false;
  hydrating = null;
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
