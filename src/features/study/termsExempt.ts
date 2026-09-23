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
 * store idiom, same confirmed-only rule, same change bus so a live Dashboard
 * recomputes the unlock the moment a topic is confirmed empty.
 *
 * ⚠️ It does NOT claim the topic is studied — it removes a gate that cannot be
 * satisfied. A topic with nothing to study has nothing to withhold.
 */
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'ape:termsExempt';

const exempt = new Set<string>();
let hydrated = false;
let hydrating: Promise<void> | null = null;
let version = 0;
const listeners = new Set<() => void>();

function emit() {
  version++;
  listeners.forEach((l) => {
    try {
      l();
    } catch {
      /* a listener throwing must not wedge callers */
    }
  });
}

function hydrate(): Promise<void> {
  if (hydrated) return Promise.resolve();
  if (hydrating) return hydrating;
  hydrating = (async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) for (const id of JSON.parse(raw) as string[]) exempt.add(id);
    } catch {
      /* best-effort — a fresh empty set is safe */
    }
    hydrated = true;
    emit();
  })();
  return hydrating;
}

/** True if the topic is CONFIRMED to have no glossary terms. Reads the
 *  in-memory set; pair with useTermsExempt() where a live re-render matters. */
export function isTermsExempt(achievementId: string): boolean {
  return exempt.has(achievementId);
}

/** Record that a topic is confirmed to have no terms (idempotent).
 *  ⛔ Call ONLY after a successful fetch that returned zero items. */
export async function markTermsExempt(achievementId: string): Promise<void> {
  // Hydrate FIRST — the Flashcards screen can reach this via a deep link or a
  // resume before anything mounted the hook, and writing without loading the
  // stored set would overwrite it with just this one id.
  await hydrate();
  if (exempt.has(achievementId)) return;
  exempt.add(achievementId);
  emit();
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify([...exempt]));
  } catch {
    /* the in-memory set already unblocked this session */
  }
}

/**
 * Reset the in-memory cache on account switch (parity with the other
 * device-local mirrors). The persisted `ape:termsExempt` key is removed by
 * clearLocalAccountData's `ape:*` sweep; this drops the cache and flips
 * `hydrated` so live hooks re-render empty and the next read re-hydrates.
 */
export function resetLocal(): void {
  exempt.clear();
  hydrated = false;
  hydrating = null;
  emit();
}

/** Subscribe a screen to exemption changes; returns a version that bumps on any
 *  change so callers re-render and re-read isTermsExempt(). */
export function useTermsExempt(): number {
  const [v, setV] = useState(version);
  useEffect(() => {
    const l = () => setV(version);
    listeners.add(l);
    void hydrate().then(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return v;
}
