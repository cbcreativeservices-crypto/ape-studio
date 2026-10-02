/**
 * celebrationSeen — which celebrations this user has already been shown.
 *
 * A celebration fires ONCE, ever, for a given thing. Without a record of that,
 * "your flashcard deck is complete" would appear every single time the
 * Dashboard recomputed its gates — which is on every focus — and the reward
 * would become a nuisance within a day.
 *
 * PERSISTED, unlike the audio gate's session-only store, because "have I
 * already congratulated you for this" is a fact about the user's history, not
 * about this run of the app.
 *
 * Keys are `${scope}:${celebrationId}` where scope is the thing achieved — a
 * topic id, a lab key, a credential id. The same celebration can therefore fire
 * for a different topic, which is the point, and cannot fire twice for the same
 * one.
 *
 * ON THE SHARED SAFE STORE (wave 2, 2026-10-02 — features/storage/localStore).
 * The hand-rolled version turned a storage read that THREW into an EMPTY set
 * and marked it loaded: every celebration the user had ever had fired again,
 * and the first `markSeen` then wrote a one-item set OVER the stored history,
 * so they all came back on every later launch too. Now a read that fails
 * leaves the record UNREAD: `hasLoaded()` stays false, so (as every caller
 * already requires) nothing is celebrated, and a mark made meanwhile is queued
 * and written only on top of the real record once a later read lands. Failing
 * toward "no congratulation this time" is the safe side; the next successful
 * read gives every earned celebration its turn.
 */
import { createLocalStore } from '../storage/localStore';
import type { CelebrationId } from './types';

const KEY = 'ape:celebrationsSeen:v1';

const store = createLocalStore<ReadonlySet<string>>({
  key: KEY,
  empty: () => new Set<string>(),
  parse: (parsed) => {
    // Not a list = not a record we can trust: set aside as damaged.
    if (!Array.isArray(parsed)) throw new Error('celebrationsSeen: not a list');
    return new Set(parsed.filter((x): x is string => typeof x === 'string'));
  },
  serialize: (s) => JSON.stringify([...s]),
});

/**
 * Bumped by every account change (the store's reset, which the account wipe
 * reaches through the registry and through `resetCelebrationsSeen`). A load
 * still out when the reset ran lands nowhere (full-app run 2, 2026-10-01).
 * `useCredentialCelebration` reads it too, to drop a check that straddles the
 * switch.
 */
export const celebrationGeneration = (): number => store.generation();

function keyFor(scope: string, id: CelebrationId): string {
  return `${scope}:${id}`;
}

/**
 * Load the record once. Resolves when it has been read — or when the read
 * FAILED, in which case `hasLoaded()` is still false and the next call reads
 * again.
 */
export async function loadCelebrationsSeen(): Promise<Set<string>> {
  await store.hydrate();
  return new Set(store.get());
}

/** Synchronous read. False until the load resolves — see `hasLoaded`. Marks
 *  made this run count even before then. */
export function wasSeen(scope: string, id: CelebrationId): boolean {
  return store.get().has(keyFor(scope, id));
}

/**
 * Has the record been read yet?
 *
 * Callers MUST check this before deciding to celebrate. Before the load
 * resolves `wasSeen` returns false for everything, and acting on that would
 * re-congratulate a user for every topic they have ever finished, in one burst,
 * on every cold start. A read that failed is not loaded either.
 */
export function hasLoaded(): boolean {
  return store.isHydrated();
}

/**
 * Mark it shown.
 *
 * The in-memory view is updated at once (`wasSeen` answers true straight
 * away), so the celebration stops repeating within this run even when nothing
 * can be written. The write is applied to the HYDRATED record — queued until
 * the read lands — and never throws into a render.
 */
export function markSeen(scope: string, id: CelebrationId): void {
  const k = keyFor(scope, id);
  if (store.get().has(k)) return;
  void store.mutate((s) => (s.has(k) ? s : new Set([...s, k])));
}

/**
 * Drop the in-memory set. Called by `resetAllLocalStores()` on every account
 * change (the registry reaches the store too; a second reset is harmless), and
 * by the tests.
 *
 * Without it the departing user's "already celebrated" set survived the wipe
 * and was then re-persisted under the NEW account on its next write - so the
 * next member silently lost the celebration for their first certificate,
 * because somebody else had already had it on this phone.
 */
export function resetCelebrationsSeen(): void {
  store.reset();
}

/** Test seam: forget everything in memory (the next read goes to storage). */
export function __resetCelebrationsSeenForTests(): void {
  store.reset();
}
