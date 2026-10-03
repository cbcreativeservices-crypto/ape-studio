/**
 * Terms exemption store — a topic CONFIRMED to have no glossary terms.
 *
 * ⛔ THE TRAP THIS CLOSES (overnight hunt 2026-09-23, agent 1 finding A1-2).
 *
 * Every item-based study method divides by the topic's term count, and
 * `studyDisplayPct` returns 0 when that count is 0. So a topic with no terms
 * mapped is stuck at 0% on flashcards — which means `homeworkPowered` never
 * flips, which means fill-in-blank / matching / scenarios never power, which
 * means the quiz never unlocks. Every credential requiring that topic becomes
 * permanently unreachable, while the award checklist keeps saying "complete
 * every required topic and lab to unlock the Final Exam" against a requirement
 * that cannot reach 100%. Nothing anywhere explains why.
 *
 * It cannot happen on today's data — queried 2026-09-23: 0 of 166 live topics
 * have zero terms, and the smallest has 69 — so this is a guard against a topic
 * being switched on BEFORE its terms are mapped, not a fix for a live fault.
 *
 * ⛔ CONFIRMED-EMPTY ONLY, and that distinction is the whole safety of it.
 * Only a SUCCESSFUL `fetchTopicItems` that returned zero rows may mark a topic.
 * A throw, an auth denial (the cold-start 42501 race is real and common on the
 * first open), or a guest whose role cannot read the study view must NEVER mark
 * one — that would hand out a topic's completion on a transient failure.
 *
 * This deliberately mirrors `scenarioExempt.ts`, which the owner ruled on for
 * the identical shape (launch-triage E4, scenarios with no questions). Same
 * store idiom (the shared safe store — pattern catalog 2026-10-02, closer A2:
 * a failed read is never written over, a mark before the read lands joins the
 * stored set, a read in flight across the account wipe lands nowhere, and the
 * wipe reaches the store without a hand entry), same confirmed-only rule, same
 * change bus so a live Dashboard recomputes the unlock the moment a topic is
 * confirmed empty.
 *
 * ⚠️ It does NOT claim the topic is studied — it removes a gate that cannot be
 * satisfied. A topic with nothing to study has nothing to withhold.
 */
import { useSyncExternalStore } from 'react';
import { createLocalStore } from '../storage/localStore';

const KEY = 'ape:termsExempt';

const store = createLocalStore<ReadonlySet<string>>({
  key: KEY,
  empty: () => new Set<string>(),
  parse: (p) => new Set(Array.isArray(p) ? p.filter((x): x is string => typeof x === 'string') : []),
  serialize: (s) => JSON.stringify([...s]),
});

/** True if the topic is CONFIRMED to have no glossary terms. Reads the
 *  in-memory set; pair with useTermsExempt() where a live re-render matters. */
export function isTermsExempt(achievementId: string): boolean {
  return store.get().has(achievementId);
}

/** Record that a topic is confirmed to have no terms (idempotent).
 *  ⛔ Call ONLY after a successful fetch that returned zero items.
 *  Applied to the STORED set once it has loaded — the Flashcards screen can
 *  reach this via a deep link or a resume before anything mounted the hook,
 *  and a write over an unloaded set would lose every prior exemption. */
export async function markTermsExempt(achievementId: string): Promise<void> {
  // A derived cache, not the user's change: a lost marker is found again on the next fetch.
  await store.mutate((s) => (s.has(achievementId) ? s : new Set([...s, achievementId])), { reportFailure: false });
}

/**
 * Reset the in-memory cache on account switch (parity with the other
 * device-local mirrors). The persisted `ape:termsExempt` key is removed by
 * clearLocalAccountData's `ape:*` sweep and the shared store registers this
 * reset with the wipe itself; kept exported for callers and tests.
 */
export function resetLocal(): void {
  store.reset();
}

// A version that moves whenever the set does (hydrate, mark, reset), so a
// screen re-renders and re-reads isTermsExempt().
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
 *  change so callers re-render and re-read isTermsExempt(). */
export function useTermsExempt(): number {
  return useSyncExternalStore(store.subscribe, currentVersion, currentVersion);
}
