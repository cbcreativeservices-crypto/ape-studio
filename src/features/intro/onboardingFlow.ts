/**
 * onboardingFlow — PERSISTENT first-run state for the sampler loop (plan §2.1).
 *
 *  - `complete`: once the user reaches Home from the sampler loop, onboarding is
 *    done PERMANENTLY and never auto-shows again (`ape:onboarding:complete`).
 *  - `visited`: which starting choices the user has already sampled, so the
 *    continuation screen can mark them "✓ Explored" (`ape:onboarding:visited`).
 *
 * Transient "sampling in progress" is separate (onboardingSampling.ts). The
 * Settings → "Reset onboarding hints" control clears this too via
 * resetOnboarding() so QA/owner can re-see the whole first run.
 *
 * Same external-store pattern as popupSuppressStore: module-level state +
 * listeners, hydrated once from AsyncStorage, persisted on change.
 */
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/** The first-run connected-path stops (plan §2.3). Each maps to an EXISTING
 *  screen; the sampler threads them around one concept (sound level / dB). */
export type OnboardingChoice =
  | 'fundamentals'
  | 'decibel'
  | 'calc'
  | 'acoustics'
  | 'splmeter'
  | 'career';

const ALL_CHOICES: readonly OnboardingChoice[] = [
  'fundamentals',
  'decibel',
  'calc',
  'acoustics',
  'splmeter',
  'career',
];

const COMPLETE_KEY = 'ape:onboarding:complete';
const VISITED_KEY = 'ape:onboarding:visited';

let complete = false;
let visited: OnboardingChoice[] = [];
let hydrated = false;
let hydrating: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function hydrate(): Promise<void> {
  if (hydrated) return Promise.resolve();
  if (!hydrating) {
    hydrating = (async () => {
      try {
        const [c, v] = await AsyncStorage.multiGet([COMPLETE_KEY, VISITED_KEY]);
        if (c[1] != null) complete = c[1] === '1';
        if (v[1] != null) {
          const parsed = JSON.parse(v[1]);
          if (Array.isArray(parsed)) visited = parsed.filter(isChoice);
        }
      } catch {
        // corrupt/absent → keep defaults
      }
      hydrated = true;
      emit();
    })();
  }
  return hydrating;
}

function isChoice(x: unknown): x is OnboardingChoice {
  return typeof x === 'string' && (ALL_CHOICES as readonly string[]).includes(x);
}

// Warm the store on first import so first-run gating can read it early.
void hydrate();

/** True once the user has finished the first-run sampler loop (reached Home). */
export function isOnboardingComplete(): boolean {
  void hydrate();
  return complete;
}

/** Mark the first-run sampler loop finished, permanently. */
export function setOnboardingComplete(): void {
  if (complete) return;
  complete = true;
  void AsyncStorage.setItem(COMPLETE_KEY, '1');
  emit();
}

/** Choices already sampled this onboarding (for the ✓ Explored marks). */
export function getVisitedChoices(): OnboardingChoice[] {
  void hydrate();
  return visited;
}

/** Record that a choice was sampled. No-op if already recorded. */
export function markChoiceVisited(choice: OnboardingChoice): void {
  if (visited.includes(choice)) return;
  visited = [...visited, choice];
  void AsyncStorage.setItem(VISITED_KEY, JSON.stringify(visited));
  emit();
}

/** Clear all first-run state so onboarding can run again (Settings reset / QA). */
export async function resetOnboarding(): Promise<void> {
  complete = false;
  visited = [];
  try {
    await AsyncStorage.multiRemove([COMPLETE_KEY, VISITED_KEY]);
  } finally {
    emit();
  }
}

/** Live hydrated view of { complete, visited } — re-renders on change and once
 *  hydration completes. */
export function useOnboardingFlow(): { complete: boolean; visited: OnboardingChoice[]; hydrated: boolean } {
  const [snap, setSnap] = useState(() => ({ complete, visited, hydrated }));
  useEffect(() => {
    const l = () => setSnap({ complete, visited, hydrated });
    listeners.add(l);
    void hydrate().then(l);
    l();
    return () => {
      listeners.delete(l);
    };
  }, []);
  return snap;
}
