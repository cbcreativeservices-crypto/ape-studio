/**
 * measurementStore — the device-local Saved Measurement Library (Phase 2,
 * spec §7). Same tiny external-store pattern as enrollmentStore: module list +
 * listeners + hydrate/commit + a useMeasurements() hook, persisted under one
 * AsyncStorage key. Payloads are small numerical records (never audio), so a
 * single JSON key is appropriate; if a future engine tool needs big grids
 * (spectrogram), migrate that payload to the SQLite split — flagged in the
 * spec's §18 size guidance.
 *
 * DEVICE-LOCAL by design: backend frozen; tools tech-spec §7.2 forbids
 * measurement content server-side (no audio uploads, no calibration in DB).
 */
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WARNING_INFO, type SavedMeasurement } from './types';
import { QUALITY_LABEL } from './quality';
import { TOOLS, type ToolKey } from '../../../screens/tools/toolsData';

const KEY = 'ape:toolMeasurements';
/** Practical cap — oldest drop first past this (numerical payloads are tiny,
 *  but unbounded growth is never OK; spec §18 "avoid" list). */
const MAX_SAVED = 200;

let list: SavedMeasurement[] = [];
let hydrated = false;
let hydrating: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}
/** Largest blob we are willing to push into ONE AsyncStorage value before
 *  saying so. Android backs AsyncStorage with SQLite, whose CursorWindow is
 *  ~2 MB — past that a value can fail to READ BACK, which would lose the whole
 *  library silently on the next launch. */
const SIZE_WARN_BYTES = 1_500_000;

function persist() {
  const blob = JSON.stringify(list);
  // The write used to be fire-and-forget: a failure (quota, CursorWindow, disk)
  // vanished, and the user kept a library that was never stored. At minimum it
  // must be audible in the logs (perf/memory audit 2026-09-11).
  void AsyncStorage.setItem(KEY, blob).catch((e: unknown) => {
    console.warn('[measurements] save FAILED — the library on screen is not persisted:', e);
  });
  if (__DEV__ && blob.length > SIZE_WARN_BYTES) {
    // Not a throttle, a tripwire: this file's own docblock says big grids
    // (spectrogram) must move to the SQLite split, and the Spectrogram and
    // MultiMeter tools now ship exactly those. One snapshot is ~119 KB, so the
    // MAX_SAVED = 200 cap allows ~23 MB in a single key.
    console.warn(
      `[measurements] blob is ${(blob.length / 1_000_000).toFixed(1)} MB in ONE AsyncStorage key ` +
        `(${list.length} records). Past ~2 MB Android may fail to read it back and the whole ` +
        'library is lost on relaunch — migrate grid payloads to the SQLite split.',
    );
  }
}

async function hydrate(): Promise<void> {
  if (hydrated) return;
  if (!hydrating) {
    hydrating = (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        const parsed: unknown = raw ? JSON.parse(raw) : null;
        // Per-record sanitize (house pattern — enrollmentStore/enrolledBundles):
        // drop unusable records, degrade unknown enum values, so the display
        // path can never crash on corrupt/version-skewed data (review 2026-07-23).
        if (Array.isArray(parsed)) {
          list = (parsed as SavedMeasurement[])
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
      } catch {
        list = []; // corrupt store — start clean rather than crash
      }
      hydrated = true;
      emit();
    })();
  }
  return hydrating;
}

function commit(next: SavedMeasurement[]) {
  list = next;
  persist();
  emit();
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

export function saveMeasurement(m: SavedMeasurement): void {
  void hydrate().then(() => {
    const next = [...list, m];
    // Enforce the cap oldest-first (by created_at).
    if (next.length > MAX_SAVED) {
      next.sort((x, y) => (x.created_at < y.created_at ? -1 : 1));
      next.splice(0, next.length - MAX_SAVED);
    }
    commit(next);
  });
}

export function deleteMeasurement(id: string): void {
  void hydrate().then(() => {
    if (!list.some((m) => m.id === id)) return;
    commit(list.filter((m) => m.id !== id));
  });
}

export function updateMeasurement(id: string, patch: Partial<Pick<SavedMeasurement, 'title' | 'notes'>>): void {
  void hydrate().then(() => {
    commit(list.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  });
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
