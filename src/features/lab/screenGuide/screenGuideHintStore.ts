/**
 * The screen-guide hint's "seen" flag (owner 2026-10-31) — one device-local
 * boolean on the shared safe store (createLocalStore, D47).
 *
 * KEY `ape:intro:screenGuideHint`, deliberately in the `ape:intro:*` family,
 * the same as the lab term popup's flags (labTermSeenStore.ts), so it is
 * treated like every other first-open hint:
 *   • it SURVIVES both wipes — an account switch and the guest wipe
 *     (isOnboardingFlag in clearLocalAccountData.ts keeps `ape:intro:*`;
 *     owner ruling 2026-10-04: intro flags "are not work");
 *   • Settings → "Reset onboarding hints" (resetScreenIntros) removes the key
 *     and, through onScreenIntrosReset, drops this store's memory, so the hint
 *     comes back without a relaunch.
 *
 * A failed READ is UNREADABLE: the hint shows nothing and nothing is written
 * over the stored flag (createLocalStore's rule). Only a dismissal writes.
 */
import { useSyncExternalStore } from 'react';
import { createLocalStore } from '../../storage/localStore';
import { onScreenIntrosReset } from '../../intro/screenIntros';

export const SCREEN_GUIDE_HINT_KEY = 'ape:intro:screenGuideHint';

const store = createLocalStore<boolean>({
  key: SCREEN_GUIDE_HINT_KEY,
  empty: () => false,
  // Only `true` means seen; anything else is "not yet" (the hint is the side
  // that never blocks anything).
  parse: (parsed) => parsed === true,
  // Nothing saved until it is seen.
  serialize: (seen) => (seen ? 'true' : null),
});

onScreenIntrosReset(() => store.reset());

/** 'loading' | 'unreadable' | whether the hint was already dismissed. */
export function useScreenGuideHintSeen(): 'loading' | 'unreadable' | boolean {
  const seen = store.use();
  const hydrated = store.useHydrated();
  // Subscribed on its own: a failed read changes neither the value nor
  // `hydrated` (the labTermSeenStore lesson).
  const unreadable = useSyncExternalStore(store.subscribe, store.isUnreadable, store.isUnreadable);
  if (!hydrated) return unreadable ? 'unreadable' : 'loading';
  return seen;
}

/** The hint was tapped, or the ⓘ key was used: never show it again on this
 *  device. A no-op once seen. */
export function markScreenGuideHintSeen(): Promise<boolean> {
  if (store.get() === true) return Promise.resolve(true);
  return store.set(true);
}

/** For tests and the dev index. */
export function screenGuideHintSeenNow(): boolean {
  return store.get();
}
export function screenGuideHintHydrate(): Promise<void> {
  return store.hydrate();
}
export function screenGuideHintUnreadable(): boolean {
  return store.isUnreadable();
}
