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
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CelebrationId } from './types';

const KEY = 'ape:celebrationsSeen:v1';

let seen: Set<string> | null = null;
let loading: Promise<Set<string>> | null = null;

function keyFor(scope: string, id: CelebrationId): string {
  return `${scope}:${id}`;
}

/**
 * Load the record once.
 *
 * On any failure this resolves to an EMPTY set, which means celebrations fire
 * again. That is the right direction to fail: showing a congratulation twice is
 * a small annoyance, and silently swallowing every one because storage hiccuped
 * would look like the feature is broken.
 */
export function loadCelebrationsSeen(): Promise<Set<string>> {
  if (seen) return Promise.resolve(seen);
  if (!loading) {
    loading = AsyncStorage.getItem(KEY)
      .then((raw) => {
        const parsed = raw ? (JSON.parse(raw) as unknown) : [];
        return new Set(Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : []);
      })
      .catch(() => new Set<string>())
      .then((s) => {
        seen = s;
        return s;
      });
  }
  return loading;
}

/** Synchronous read. False until the load resolves — see `hasLoaded`. */
export function wasSeen(scope: string, id: CelebrationId): boolean {
  return seen?.has(keyFor(scope, id)) ?? false;
}

/**
 * Has the record been read yet?
 *
 * Callers MUST check this before deciding to celebrate. Before the load
 * resolves `wasSeen` returns false for everything, and acting on that would
 * re-congratulate a user for every topic they have ever finished, in one burst,
 * on every cold start.
 */
export function hasLoaded(): boolean {
  return seen != null;
}

/**
 * Mark it shown.
 *
 * The IN-MEMORY set is updated first and unconditionally, so the celebration
 * stops repeating within this run even when nothing can be written. The write
 * is then fire-and-forget.
 *
 * The try/catch is not defensive padding: `AsyncStorage.setItem` is not
 * guaranteed to exist — it is absent under `node --test`, and a rejected
 * promise is a different failure from a missing method. Without this the
 * synchronous throw propagated out of a render and took the Dashboard with it,
 * which a test found. A failed write costs a repeated congratulation; a throw
 * costs the screen.
 */
export function markSeen(scope: string, id: CelebrationId): void {
  const s = seen ?? new Set<string>();
  seen = s;
  const k = keyFor(scope, id);
  if (s.has(k)) return;
  s.add(k);
  try {
    void AsyncStorage.setItem(KEY, JSON.stringify([...s]))?.catch?.(() => {});
  } catch {
    // Storage unavailable — the in-memory set above still holds for this run.
  }
}

/**
 * Drop the in-memory set. Called by `resetAllLocalStores()` on every account
 * change, and by the tests.
 *
 * Without it the departing user's "already celebrated" set survived the wipe
 * and was then re-persisted under the NEW account on its next write - so the
 * next member silently lost the celebration for their first certificate,
 * because somebody else had already had it on this phone.
 */
export function resetCelebrationsSeen(): void {
  seen = null;
  loading = null;
}

/** Test seam, with the preload the tests use. */
export function __resetCelebrationsSeenForTests(preload?: string[]): void {
  seen = preload ? new Set(preload) : null;
  loading = null;
}
