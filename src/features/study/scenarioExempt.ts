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
 * Device-local (frozen backend), same hydrate-once + listener idiom as
 * enrollmentStore / flaggedStore: a Set of achievement_ids in AsyncStorage,
 * hydrated on first subscribe, with a change bus so a live Dashboard updates the
 * moment a topic is confirmed empty.
 */
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'ape:scenariosExempt';

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

/** True if the topic is CONFIRMED to have no scenario content. Reads the
 *  in-memory set; pair with useScenarioExempt() where a live re-render matters. */
export function isScenariosExempt(achievementId: string): boolean {
  return exempt.has(achievementId);
}

/** Record that a topic is confirmed to have no scenario content (idempotent). */
export async function markScenariosExempt(achievementId: string): Promise<void> {
  // Hydrate FIRST (parity with enrollmentStore/measurementStore): the Scenarios
  // screen can reach this before anything mounted useScenarioExempt (deep link /
  // resume), so writing without loading the stored set first would overwrite it
  // with just this one id and lose every prior exemption.
  await hydrate();
  if (exempt.has(achievementId)) return;
  exempt.add(achievementId);
  emit();
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify([...exempt]));
  } catch {
    /* the in-memory set already unblocked the quiz for this session */
  }
}

/**
 * Reset the in-memory cache on account switch (parity with the other device-local
 * mirrors — see clearLocalAccountData/resetAllLocalStores). The persisted
 * `ape:scenariosExempt` key is removed by clearLocalAccountData's `ape:*` sweep;
 * this drops the cache + flips `hydrated` so live hooks re-render empty and the
 * next read re-hydrates from the (now-cleared) storage.
 */
export function resetLocal(): void {
  exempt.clear();
  hydrated = false;
  hydrating = null;
  emit();
}

/** Subscribe a screen to exemption changes; returns a version that bumps on any
 *  change so callers re-render and re-read isScenariosExempt(). Hydrates on first
 *  use (lazy, same as enrollmentStore.useEnrollment). */
export function useScenarioExempt(): number {
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
