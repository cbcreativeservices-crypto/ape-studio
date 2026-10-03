/**
 * Scenario exemption store (owner launch-triage 2026-08-21, gate E4).
 *
 * Some topics genuinely have NO scenario content — the admin-only quiz_questions
 * table holds no usage='scenario' rows for any of the topic's terms. The staged
 * unlock (owner 2026-08-13) makes scenarios a HARD term of the quiz gate
 * (`allMethodsComplete` in DashboardScreen), so without this a no-scenario topic
 * could never satisfy that term: its scenarios % is stuck at 0 and its quiz is
 * locked FOREVER, even after every other method is complete.
 *
 * When the Scenarios screen loads its homework SUCCESSFULLY and finds zero
 * questions across all three rounds, it records the topic here; the Dashboard
 * then treats scenarios as satisfied for that topic and the quiz can unlock.
 *
 * CONFIRMED-empty ONLY: an RPC error / no-auth load (homework === null) must
 * NEVER mark a topic exempt — that would falsely unlock the quiz on a transient
 * failure or for a guest whose role can't read the scenarios. Only a non-null
 * homework with no questions is a real "this topic has no scenarios" signal.
 *
 * Device-local (frozen backend): a Set of achievement_ids under one `ape:` key
 * on the shared safe store (pattern catalog 2026-10-02, closer A2) — a failed
 * read is never written over, a mark before the read lands joins the stored
 * set, a read in flight across the account wipe lands nowhere, and the wipe
 * reaches the store without a hand entry. The change bus is the store's own:
 * a live Dashboard updates the moment a topic is confirmed empty.
 */
import { useSyncExternalStore } from 'react';
import { createLocalStore } from '../storage/localStore';

const KEY = 'ape:scenariosExempt';

const store = createLocalStore<ReadonlySet<string>>({
  key: KEY,
  empty: () => new Set<string>(),
  parse: (p) => new Set(Array.isArray(p) ? p.filter((x): x is string => typeof x === 'string') : []),
  serialize: (s) => JSON.stringify([...s]),
});

/** True if the topic is CONFIRMED to have no scenario content. Reads the
 *  in-memory set; pair with useScenarioExempt() where a live re-render matters. */
export function isScenariosExempt(achievementId: string): boolean {
  return store.get().has(achievementId);
}

/** Record that a topic is confirmed to have no scenario content (idempotent).
 *  Applied to the STORED set once it has loaded (the Scenarios screen can reach
 *  this before anything mounted useScenarioExempt — deep link / resume — and a
 *  write over an unloaded set would lose every prior exemption). */
export async function markScenariosExempt(achievementId: string): Promise<void> {
  // A derived cache, not the user's change: a lost marker is found again on the next fetch.
  await store.mutate((s) => (s.has(achievementId) ? s : new Set([...s, achievementId])), { reportFailure: false });
}

/**
 * Reset the in-memory cache on account switch. The persisted key is removed by
 * clearLocalAccountData's `ape:*` sweep and the shared store registers this
 * reset with the wipe itself; kept exported for callers and tests.
 */
export function resetLocal(): void {
  store.reset();
}

// A version that moves whenever the set does (hydrate, mark, reset), so a
// screen re-renders and re-reads isScenariosExempt().
let version = 0;
let lastSeen: ReadonlySet<string> | null = null;
function currentVersion(): number {
  const s = store.get();
  if (s !== lastSeen) {
    lastSeen = s;
    version++;
  }
  return version;
}

/** Subscribe a screen to exemption changes; returns a version that bumps on any
 *  change so callers re-render and re-read isScenariosExempt(). Hydrates on first
 *  use (lazy, same as enrollmentStore.useEnrollment). */
export function useScenarioExempt(): number {
  return useSyncExternalStore(store.subscribe, currentVersion, currentVersion);
}
