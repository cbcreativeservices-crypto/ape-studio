/**
 * createLocalStore — ONE device-local `ape:` key, with the four bug classes
 * the 2026-10-02 pattern catalog ranked highest made impossible by
 * construction (docs/bughunt/PATTERN_CATALOG_2026_10_02.md, closer A2):
 *
 *   P1  A failed READ is not an empty read. If `getItem` throws the store is
 *       UNREADABLE: it stays unhydrated, writes nothing over the disk copy,
 *       says so (`isUnreadable()`), and reads again on the next action
 *       (a mutate, a hook mount, an explicit hydrate). A DAMAGED blob (JSON or
 *       `parse` throws) is different: it is set aside under `<key>:damaged`
 *       and the store starts empty with writes allowed, as the hand-rolled
 *       stores already did.
 *   P2  A mutation made before the read lands is QUEUED and applied to the
 *       hydrated value — never computed from the empty placeholder and never
 *       persisted over the stored copy. `get()` shows the queued mutations
 *       applied on top of what is known, so the screen answers the tap.
 *   P3  One generation counter, bumped by `reset()`. A read, a prepare step
 *       or a write that started under the previous identity lands nowhere.
 *       `reset()` registers itself in the account-wipe registry at creation
 *       (localStoreRegistry.ts), so `resetAllLocalStores` cannot miss it.
 *   P6  Writes are serialized and answer `Promise<boolean>` — true only when
 *       the device accepted the write — so "Saved" can only come from a real
 *       write.
 *
 * Deliberately small: a value, a listener set, a queue and a write chain —
 * the same shape as deckOrderStore / enrollmentStore, once, with the rules
 * in one place. What a store adds on top (server sync, the guest ledger via
 * sessionCarry, practice resets) stays in that store.
 *
 * Writing a store on it:
 *   const store = createLocalStore<Prefs>({ key: 'ape:x', empty: () => ({...}), parse });
 *   export const getPrefs = () => store.get();
 *   export function setMode(m) { void store.mutate((p) => ({ ...p, mode: m })); }
 *   export const usePrefs = () => store.use();
 *   export function resetLocal() { store.reset(); }   // optional: the wipe already reaches it
 *
 * A mutation is a pure function of the HYDRATED value. A toggle must decide
 * its intent from `get()` first (`const add = !store.get().has(id)`) and then
 * mutate with that intent — replaying a toggle against a list that loaded
 * meanwhile is the bug homeCardsStore fixed on 2026-10-01.
 */
import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerLocalStoreReset } from './localStoreRegistry';

export type LocalStoreSpec<T> = {
  /** The one `ape:` key this store owns. */
  key: string;
  /** The value of a store with nothing saved (a fresh object every call). */
  empty: () => T;
  /** Turn the parsed JSON into a clean value. THROW for a blob that cannot be
   *  trusted (it is then set aside as damaged); drop bad fields silently when
   *  the rest is usable. */
  parse: (parsed: unknown) => T;
  /** How the value is written. Default JSON.stringify. Return null to REMOVE
   *  the key instead (a store whose empty state is "nothing saved"). */
  serialize?: (value: T) => string | null;
  /** Runs once after each successful read, BEFORE the store is hydrated:
   *  one-time migrations and seeds. A value that is not the one passed in is
   *  written to disk before mutations are let through. Fenced: a reset
   *  meanwhile abandons it. A throw keeps the value as read. */
  prepare?: (loaded: T) => Promise<T> | T;
  /** Extra module state to drop on an account wipe (timers, sync markers). */
  onReset?: () => void;
};

export type LocalStore<T> = {
  readonly key: string;
  /** The value as the screen should see it: the hydrated value with every
   *  queued mutation applied, or the queued mutations on the empty value while
   *  the read is still out. Starts the read when nothing has tried yet. */
  get(): T;
  /** Load once. Resolves when hydrated — or when the read FAILED (see
   *  `isUnreadable`); the next call tries again. */
  hydrate(): Promise<void>;
  isHydrated(): boolean;
  /** The last read threw. Nothing is written until a read succeeds; what the
   *  screen shows is this session's work on an empty copy, not the stored
   *  copy. Screens can say "could not be read, not lost". */
  isUnreadable(): boolean;
  /** Bumped by `reset()`; capture before an await, compare after. */
  generation(): number;
  /** Apply `fn` to the hydrated value and write. Queued until hydrated. True
   *  only when the device accepted the write; false for a write that failed,
   *  a mutation dropped by a reset, or a mutation still waiting on a read
   *  that failed (it stays queued and is written after a later read). */
  mutate(fn: (value: T) => T): Promise<boolean>;
  /** Replace the value (a mutation that ignores the hydrated copy). */
  set(value: T): Promise<boolean>;
  subscribe(listener: () => void): () => void;
  /** The account wipe: new generation, memory dropped, queued mutations
   *  dropped (they were the departing user's), `onReset` run. Mounted hooks
   *  re-hydrate from the (swept) storage. */
  reset(): void;
  /** React: the live value (useSyncExternalStore). */
  use(): T;
  /** React: whether the read has landed. */
  useHydrated(): boolean;
};

type Queued<T> = { fn: (value: T) => T; resolve: ((ok: boolean) => void) | null };

export function createLocalStore<T>(spec: LocalStoreSpec<T>): LocalStore<T> {
  const { key, empty, parse } = spec;
  const serialize = spec.serialize ?? ((v: T) => JSON.stringify(v));

  let value: T = empty();
  let hydrated = false;
  let hydrating: Promise<void> | null = null;
  let unreadable = false;
  let generation = 0;
  let queue: Queued<T>[] = [];
  let writeChain: Promise<void> = Promise.resolve();
  const listeners = new Set<() => void>();

  // `get()` must hand React the SAME reference until something changed, or
  // useSyncExternalStore loops. Recomputed only when value or queue change.
  let snapshot: T = value;
  let snapshotStale = false;
  function markStale(): void {
    snapshotStale = true;
  }
  function snap(): T {
    if (snapshotStale) {
      snapshotStale = false;
      let v = value;
      for (const q of queue) {
        try {
          v = q.fn(v);
        } catch {
          // a mutation that throws on the placeholder is shown as not applied
        }
      }
      snapshot = v;
    }
    return snapshot;
  }

  function emit(): void {
    for (const l of [...listeners]) {
      try {
        l();
      } catch {
        // a listener throwing must not wedge the store
      }
    }
  }

  /** Serialized, generation-fenced write of the value as it is NOW. */
  function scheduleWrite(): Promise<boolean> {
    const gen = generation;
    const v = value;
    const p = writeChain.then(async (): Promise<boolean> => {
      // The departing user's write must not land after the wipe (the sweep
      // runs before the reset; a write after it would re-create the key).
      if (gen !== generation) return false;
      try {
        const raw = serialize(v);
        if (raw == null) await AsyncStorage.removeItem(key);
        else await AsyncStorage.setItem(key, raw);
        return true;
      } catch {
        return false;
      }
    });
    writeChain = p.then(
      () => {},
      () => {},
    );
    return p;
  }

  /** Apply every queued mutation to the hydrated value and write once. */
  function drainQueue(): void {
    if (queue.length === 0) return;
    const q = queue;
    queue = [];
    const applied: Queued<T>[] = [];
    for (const item of q) {
      try {
        value = item.fn(value);
        applied.push(item);
      } catch {
        item.resolve?.(false);
      }
    }
    markStale();
    if (applied.length === 0) return;
    void scheduleWrite().then((ok) => {
      for (const item of applied) item.resolve?.(ok);
    });
  }

  function hydrate(): Promise<void> {
    if (hydrated) return Promise.resolve();
    if (hydrating) return hydrating;
    const gen = generation;
    hydrating = (async () => {
      let raw: string | null;
      try {
        raw = await AsyncStorage.getItem(key);
      } catch {
        if (gen !== generation) return;
        // UNREADABLE is not "nothing saved yet": stay unhydrated so nothing is
        // written over the stored copy; the next action reads again. Whoever
        // awaited a queued mutation is told it did not land; the mutation
        // itself stays queued for a later successful read.
        unreadable = true;
        hydrating = null;
        for (const item of queue) {
          item.resolve?.(false);
          item.resolve = null;
        }
        emit();
        return;
      }
      if (gen !== generation) return;
      let loaded: T;
      let damaged = false;
      if (raw == null) {
        loaded = empty();
      } else {
        try {
          loaded = parse(JSON.parse(raw));
        } catch {
          damaged = true;
          loaded = empty();
        }
      }
      if (damaged) {
        // Set aside, never silently discarded; the store starts empty and may
        // write (the stored copy was not usable, so nothing real is lost).
        void AsyncStorage.setItem(`${key}:damaged`, raw as string).catch(() => {});
      }
      if (spec.prepare) {
        let prepared: T = loaded;
        try {
          prepared = await spec.prepare(loaded);
        } catch {
          prepared = loaded;
        }
        if (gen !== generation) return;
        if (!Object.is(prepared, loaded)) {
          loaded = prepared;
          try {
            const out = serialize(loaded);
            if (out == null) await AsyncStorage.removeItem(key);
            else await AsyncStorage.setItem(key, out);
          } catch {
            // best-effort: the prepared value lives in memory for this run
          }
          if (gen !== generation) return;
        }
      }
      unreadable = false;
      value = loaded;
      hydrated = true;
      hydrating = null;
      markStale();
      drainQueue();
      emit();
    })();
    return hydrating;
  }

  function mutate(fn: (v: T) => T): Promise<boolean> {
    if (!hydrated) {
      return new Promise<boolean>((resolve) => {
        queue.push({ fn, resolve });
        markStale();
        emit();
        void hydrate();
      });
    }
    try {
      value = fn(value);
    } catch {
      return Promise.resolve(false);
    }
    markStale();
    emit();
    return scheduleWrite();
  }

  function reset(): void {
    generation++;
    const dropped = queue;
    queue = [];
    value = empty();
    hydrated = false;
    hydrating = null;
    unreadable = false;
    markStale();
    for (const item of dropped) item.resolve?.(false);
    try {
      spec.onReset?.();
    } catch {
      // the store is reset regardless
    }
    emit();
    // Mounted hooks only hydrate on subscribe; without this they sat empty
    // until remounted (careerfinder, enrollment: 2026-10-01). Storage was
    // swept before the reset, so this lands the new identity's (empty) copy.
    if (listeners.size > 0) void hydrate();
  }

  function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    void hydrate();
    return () => {
      listeners.delete(listener);
    };
  }

  function get(): T {
    if (!hydrated && !hydrating && !unreadable) void hydrate();
    return snap();
  }

  const isHydrated = () => hydrated;

  registerLocalStoreReset(reset);

  return {
    key,
    get,
    hydrate,
    isHydrated,
    isUnreadable: () => unreadable,
    generation: () => generation,
    mutate,
    set: (v: T) => mutate(() => v),
    subscribe,
    reset,
    use: () => useSyncExternalStore(subscribe, snap, snap),
    useHydrated: () => useSyncExternalStore(subscribe, isHydrated, isHydrated),
  };
}
