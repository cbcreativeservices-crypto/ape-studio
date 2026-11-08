/**
 * The intro card's "seen" list (owner 2026-11-08, D52) — which screens'
 * intro cards this device has already shown, on the shared safe store
 * (createLocalStore, D47). One entry per intro (screenIntroId: a hash of its
 * two lines), so no lab screen needs an id of its own.
 *
 * KEY `ape:intro:screenIntroCards`, in the `ape:intro:*` family like the
 * guide hint (screenGuideHintStore.ts) and the lab term popup's flags:
 *   • it SURVIVES both wipes — an account switch and the guest wipe
 *     (isOnboardingFlag in clearLocalAccountData.ts keeps `ape:intro:*`;
 *     owner ruling 2026-10-04: intro flags "are not work");
 *   • Settings → "Reset onboarding hints" (resetScreenIntros) removes the key
 *     and, through onScreenIntrosReset, drops this store's memory, so every
 *     card comes back without a relaunch.
 *
 * A failed READ is UNREADABLE: no card shows and nothing is written over the
 * stored list (createLocalStore's rule) — never "not seen, so show it and
 * write a list holding only this one". Only a card that was really put on
 * screen writes.
 *
 * Also the BUSY signal: while a focused screen's intro card is still to come
 * (its read is out, or it is due) or is on screen, the one-time ⓘ hint waits,
 * so the two never draw together. Module state, not user data; each owner
 * clears its own entry when it unmounts.
 */
import { useSyncExternalStore } from 'react';
import { createLocalStore } from '../../storage/localStore';
import { onScreenIntrosReset } from '../../intro/screenIntros';

export const SCREEN_INTRO_CARD_KEY = 'ape:intro:screenIntroCards';

/** Far more than the app's lab screens; the oldest ids drop off first. */
const MAX_IDS = 1000;

const store = createLocalStore<readonly string[]>({
  key: SCREEN_INTRO_CARD_KEY,
  empty: () => [],
  parse: (parsed) => {
    // Not a list = a blob that cannot be trusted (set aside as damaged).
    if (!Array.isArray(parsed)) throw new Error('screen intro list is not a list');
    return parsed.filter((x): x is string => typeof x === 'string' && x.length > 0).slice(-MAX_IDS);
  },
  // Nothing saved until a card has shown.
  serialize: (ids) => (ids.length ? JSON.stringify(ids) : null),
});

onScreenIntrosReset(() => store.reset());

/** 'loading' | 'unreadable' | whether this intro card has already shown. */
export function useScreenIntroSeen(id: string): 'loading' | 'unreadable' | boolean {
  const ids = store.use();
  const hydrated = store.useHydrated();
  // Subscribed on its own: a failed read changes neither the value nor
  // `hydrated` (the labTermSeenStore lesson).
  const unreadable = useSyncExternalStore(store.subscribe, store.isUnreadable, store.isUnreadable);
  if (!hydrated) return unreadable ? 'unreadable' : 'loading';
  return ids.includes(id);
}

/** The card was put on screen: never auto-show it again on this device. A
 *  no-op once listed. */
export function markScreenIntroSeen(id: string): Promise<boolean> {
  if (store.get().includes(id)) return Promise.resolve(true);
  return store.mutate((ids) => (ids.includes(id) ? ids : [...ids, id].slice(-MAX_IDS)));
}

// ───────────────────────────────────────────────────────────── busy signal ──

const busy = new Set<number>();
const busyListeners = new Set<() => void>();
let busySeq = 0;

/** A new owner id for setScreenIntroCardBusy. */
export function screenIntroBusyId(): number {
  busySeq += 1;
  return busySeq;
}

export function setScreenIntroCardBusy(owner: number, on: boolean): void {
  if (busy.has(owner) === on) return;
  if (on) busy.add(owner);
  else busy.delete(owner);
  for (const l of Array.from(busyListeners)) l();
}

export function isScreenIntroCardBusy(): boolean {
  return busy.size > 0;
}

function subscribeBusy(l: () => void): () => void {
  busyListeners.add(l);
  return () => {
    busyListeners.delete(l);
  };
}

/** True while a focused screen's intro card is owed or on screen. */
export function useScreenIntroCardBusy(): boolean {
  return useSyncExternalStore(subscribeBusy, isScreenIntroCardBusy, isScreenIntroCardBusy);
}

// ─────────────────────────────────────────────────── for tests / dev index ──

export function screenIntroSeenNow(id: string): boolean {
  return store.get().includes(id);
}
export function screenIntroHydrate(): Promise<void> {
  return store.hydrate();
}
export function screenIntroUnreadable(): boolean {
  return store.isUnreadable();
}
