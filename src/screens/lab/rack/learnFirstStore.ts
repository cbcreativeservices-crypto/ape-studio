/**
 * learnFirstStore — which rack labs this device has opened before (lab fix
 * round 2, phase 3, 2026-11-14; owner's decision 3: "do your recommendations
 * for these" — report section 3 row 11: "Rack labs open on LEARN on the first
 * visit"). A LabShell lab with a rack opens on its LEARN tab the FIRST time;
 * every later visit opens on EXPLORE as before.
 *
 * One device-local list on the shared safe store (createLocalStore, D47),
 * key `ape:intro:labLearnFirst`, in the `ape:intro:*` family: kept through the
 * account switch and the guest wipe (intro flags "are not work", owner ruling
 * 2026-10-04) and cleared by Settings › "Reset onboarding hints".
 * A failed READ is UNREADABLE: the lab opens on EXPLORE (as before) and
 * nothing is written over the stored list.
 */
import { useEffect, useRef, useSyncExternalStore } from 'react';
import { createLocalStore } from '../../../features/storage/localStore';
import { onScreenIntrosReset } from '../../../features/intro/screenIntros';

export const LEARN_FIRST_KEY = 'ape:intro:labLearnFirst';
const MAX_IDS = 200;

export function parseLearnFirst(parsed: unknown): string[] {
  if (!Array.isArray(parsed)) throw new Error('labLearnFirst: not a list');
  return parsed.filter((x): x is string => typeof x === 'string').slice(-MAX_IDS);
}

const store = createLocalStore<string[]>({
  key: LEARN_FIRST_KEY,
  empty: () => [],
  parse: parseLearnFirst,
  serialize: (v) => (v.length ? JSON.stringify(v) : null),
});

onScreenIntrosReset(() => store.reset());

/**
 * Is this the learner's FIRST visit to `labId`? null while the read is out (or
 * failed: then never true). The answer is latched for the mount, and the visit
 * is recorded as soon as it is known, so the next visit opens on EXPLORE.
 */
export function useFirstLabVisit(labId: string, enabled: boolean): boolean | null {
  useEffect(() => {
    if (!store.isHydrated()) void store.hydrate();
  }, []);
  const list = store.use();
  const hydrated = store.useHydrated();
  const unreadable = useSyncExternalStore(store.subscribe, store.isUnreadable, store.isUnreadable);
  const latched = useRef<boolean | null>(null);
  if (latched.current === null && enabled) {
    if (hydrated) latched.current = !list.includes(labId);
    else if (unreadable) latched.current = false;
  }
  const first = latched.current;
  useEffect(() => {
    if (first && !store.get().includes(labId)) void store.mutate((v) => (v.includes(labId) ? v : [...v, labId].slice(-MAX_IDS)));
  }, [first, labId]);
  return enabled ? first : false;
}

/** For tests. */
export const __learnFirstStore = store;
