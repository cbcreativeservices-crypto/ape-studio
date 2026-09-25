/**
 * Sound Systems Lab — progress that the paged shells do not track.
 *
 * PagedLab already persists which PAGES are done per mode. This store holds
 * the finer grain the hub's WHAT-IS-LEFT screen reports on: which faults
 * were solved (and solved with a forward walk), which capstones passed, and
 * which route/operate exercises were completed. Device-local, `ape:`-prefixed
 * (so the account wipe removes it), hand-rolled external store in the
 * labCompletion idiom, corruption-safe.
 */
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'ape:soundsystems:v1';

export type SoundSystemsProgress = {
  /** Fault ids solved (a correct diagnosis). */
  faults: string[];
  /** Fault ids solved WITH a source-forward walk. */
  forward: string[];
  /** Capstone ids passed. */
  capstones: string[];
  /** ROUTE exercise ids completed. */
  route: string[];
  /** OPERATE exercise ids completed. */
  operate: string[];
};

const EMPTY = (): SoundSystemsProgress => ({ faults: [], forward: [], capstones: [], route: [], operate: [] });

let state: SoundSystemsProgress = EMPTY();
let hydrated = false;
let hydrating: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function cleanList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.filter((v): v is string => typeof v === 'string' && v.length > 0 && v.length < 64))];
}

function normalise(raw: unknown): SoundSystemsProgress {
  const r = (raw ?? {}) as Partial<Record<keyof SoundSystemsProgress, unknown>>;
  return {
    faults: cleanList(r.faults),
    forward: cleanList(r.forward),
    capstones: cleanList(r.capstones),
    route: cleanList(r.route),
    operate: cleanList(r.operate),
  };
}

function hydrate(): Promise<void> {
  if (hydrated) return Promise.resolve();
  if (!hydrating) {
    hydrating = (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw != null) state = normalise(JSON.parse(raw));
      } catch {
        // damaged or absent → start empty; the next write repairs the key
      }
      hydrated = true;
      emit();
    })();
  }
  return hydrating;
}

function persist() {
  void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
}

function add(list: keyof SoundSystemsProgress, id: string) {
  void hydrate().then(() => {
    if (state[list].includes(id)) return;
    state = { ...state, [list]: [...state[list], id] };
    persist();
    emit();
  });
}

export function markFaultSolved(id: string, forward: boolean): void {
  add('faults', id);
  if (forward) add('forward', id);
}

export function markCapstonePassed(id: string): void {
  add('capstones', id);
}

export function markRouteDone(id: string): void {
  add('route', id);
}

export function markOperateDone(id: string): void {
  add('operate', id);
}

export function getSoundSystemsProgress(): SoundSystemsProgress {
  return state;
}

/** Reactive snapshot (a fresh object per change so React re-renders). */
export function useSoundSystemsProgress(): SoundSystemsProgress {
  const [v, setV] = useState(state);
  useEffect(() => {
    const l = () => setV({ ...state });
    listeners.add(l);
    void hydrate().then(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return v;
}

/** The learner's own RESET (PagedLab's reset only clears its pages). */
export async function resetSoundSystemsProgress(): Promise<void> {
  state = EMPTY();
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {}
  emit();
}

/** Account switch: the persisted key is removed by clearLocalAccountData
 *  (it is `ape:*`); this drops the in-memory copy so hooks re-render empty. */
export function resetLocal(): void {
  state = EMPTY();
  hydrated = true;
  emit();
}
