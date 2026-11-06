/**
 * Ad measurement consent (owner 2026-11-05): this person's answer on this
 * device. Off until they say yes (decisions in metaGate.ts).
 *
 * ⛔ SWEPT BY THE ACCOUNT WIPE ON PURPOSE. Consent belongs to a person, so this
 * key is on neither KEEP nor GUEST_KEEP and uses no onboarding prefix.
 *
 * ⛔ NO FEATURE READS THE ANSWER. Two callers only: metaMeasurement.ts, and the
 * Settings row that shows it.
 */
import { useSyncExternalStore } from 'react';

import { createLocalStore } from '../storage/localStore';
import type { ConsentAnswer, ConsentRead } from './metaGate';

type ConsentRecord = { answer: ConsentAnswer | null };

let onWipe: (() => void) | null = null;

const store = createLocalStore<ConsentRecord>({
  key: 'ape:metaConsent',
  empty: () => ({ answer: null }),
  parse: (parsed) => {
    const answer = (parsed as { answer?: unknown } | null)?.answer;
    if (answer === 'yes' || answer === 'no') return { answer };
    throw new Error('not a consent record'); // set aside: never read as a yes
  },
  onReset: () => onWipe?.(),
});

/** metaMeasurement's one listener: the wipe must also stop this session. */
export function noteMetaConsentWipe(listener: () => void): void {
  onWipe = listener;
}

/** A failed read is 'unreadable', which is off and is never asked over. */
export async function readMetaConsent(): Promise<ConsentRead> {
  await store.hydrate();
  if (!store.isHydrated()) return 'unreadable';
  return store.get().answer ?? 'unset';
}

/** True only when the phone kept it. An unreadable store takes no write, and
 *  nothing is left queued to land later over what the screen showed. */
export async function saveMetaConsent(answer: ConsentAnswer): Promise<boolean> {
  await store.hydrate();
  if (!store.isHydrated()) return false;
  const before = store.get();
  const generation = store.generation();
  const saved = await store.set({ answer });
  // The switch moves only from a write the phone accepted.
  if (!saved && answer === 'yes' && generation === store.generation()) void store.set(before);
  return saved;
}

/** The Settings row: on only for a yes that was read back. */
export function useMetaConsent(): { ready: boolean; on: boolean; unreadable: boolean } {
  const value = store.use();
  const ready = store.useHydrated();
  const unreadable = useSyncExternalStore(store.subscribe, store.isUnreadable, store.isUnreadable);
  return { ready, on: ready && value.answer === 'yes', unreadable };
}
