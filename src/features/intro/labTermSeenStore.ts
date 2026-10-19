/**
 * The lab term popup's "seen" flags (owner 2026-10-19) — one device-local list
 * of lab keys on the shared safe store (createLocalStore, D47).
 *
 * KEY `ape:intro:labTerms`, deliberately in the `ape:intro:*` family, so it is
 * treated exactly like every other first-open intro flag:
 *   • it SURVIVES both wipes — an account switch and the guest wipe
 *     (isOnboardingFlag in clearLocalAccountData.ts keeps `ape:intro:*`;
 *     owner ruling 2026-10-04: intro flags "are not work"). A member who saw
 *     the Compression popup does not see it again after a sign-out / sign-in.
 *     The store's own reset (registered with the wipe at creation) only drops
 *     memory, and re-reads the kept key;
 *   • Settings → "Reset onboarding hints" (resetScreenIntros) removes the key
 *     and, through onScreenIntrosReset, drops this store's memory too, so
 *     every lab popup comes back without a relaunch.
 *
 * A failed READ is UNREADABLE: the popup shows nothing and nothing is written
 * over the stored list (createLocalStore's rule). Only CONTINUE writes.
 */
import { useSyncExternalStore } from 'react';
import { createLocalStore } from '../storage/localStore';
import { onScreenIntrosReset } from './screenIntros';
import { parseSeenLabTerms, withSeenLabTerm } from './labTermIntros';

export const LAB_TERMS_SEEN_KEY = 'ape:intro:labTerms';

const store = createLocalStore<string[]>({
  key: LAB_TERMS_SEEN_KEY,
  empty: () => [],
  parse: parseSeenLabTerms,
});

onScreenIntrosReset(() => store.reset());

/** 'loading' | 'unreadable' | whether this lab's popup was already seen. */
export function useLabTermSeen(key: string): 'loading' | 'unreadable' | boolean {
  const list = store.use();
  const hydrated = store.useHydrated();
  // Subscribed on its own: a failed read changes neither the value nor
  // `hydrated`, so without this the popup would read 'loading' — and hold the
  // lab's own intros — for the rest of the visit.
  const unreadable = useSyncExternalStore(store.subscribe, store.isUnreadable, store.isUnreadable);
  return labTermSeenOf(hydrated, unreadable, list, key);
}

/** Pure: the stored flags' answer for one lab. */
export function labTermSeenOf(
  hydrated: boolean,
  unreadable: boolean,
  list: readonly string[],
  key: string,
): 'loading' | 'unreadable' | boolean {
  if (!hydrated) return unreadable ? 'unreadable' : 'loading';
  return list.includes(key);
}

/** CONTINUE: this lab's popup never shows again on this device. */
export function markLabTermSeen(key: string): Promise<boolean> {
  return store.mutate((seen) => withSeenLabTerm(seen, key));
}

/** For tests and the dev index: the list as the screen sees it. */
export function seenLabTerms(): readonly string[] {
  return store.get();
}
export function labTermsSeenHydrate(): Promise<void> {
  return store.hydrate();
}
