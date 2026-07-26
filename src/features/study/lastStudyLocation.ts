/**
 * lastStudyLocation — device-local memory of WHERE the learner last was in the
 * study stack, so the Enrollments "CONTINUE LEARNING" banner can resume the
 * exact spot (a study METHOD screen with its topic, or the Dashboard).
 *
 * External-store pattern (module var + listeners + useSyncExternalStore), the
 * same shape as the settings store in paceStore.ts, plus lazy AsyncStorage
 * hydration on first use. Persisted as one JSON record under `ape:lastStudyLoc`.
 */
import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/** The four study-method routes (route names EXACTLY as in StudyStackParamList). */
export type StudyMethodRoute = 'Flashcards' | 'Matching' | 'FillInBlank' | 'Scenarios';

const METHOD_ROUTES: ReadonlySet<string> = new Set<StudyMethodRoute>([
  'Flashcards',
  'Matching',
  'FillInBlank',
  'Scenarios',
]);

/** The learner's last recorded study position. null = nothing recorded yet. */
export type LastStudyLocation =
  | { kind: 'method'; route: StudyMethodRoute; achievementId: string; topicName: string }
  | { kind: 'dashboard' }
  | null;

const STORAGE_KEY = 'ape:lastStudyLoc';

let current: LastStudyLocation = null;
const listeners = new Set<() => void>();
let hydrated = false;

function emit(): void {
  listeners.forEach((l) => l());
}

/** Record the last study location (persist + notify subscribers). */
export function setLastStudyLocation(loc: LastStudyLocation): void {
  current = loc;
  emit();
  if (loc == null) {
    void AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  } else {
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(loc)).catch(() => {});
  }
}

/** Current last study location (synchronous snapshot). */
export function getLastStudyLocation(): LastStudyLocation {
  return current;
}

/** Lazily load the persisted location the first time the store is observed. */
async function hydrate(): Promise<void> {
  if (hydrated) return;
  hydrated = true;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as { kind?: unknown; route?: unknown; achievementId?: unknown; topicName?: unknown };
    if (parsed?.kind === 'dashboard') {
      current = { kind: 'dashboard' };
      emit();
    } else if (
      parsed?.kind === 'method' &&
      typeof parsed.route === 'string' &&
      METHOD_ROUTES.has(parsed.route) &&
      typeof parsed.achievementId === 'string' &&
      typeof parsed.topicName === 'string'
    ) {
      current = {
        kind: 'method',
        route: parsed.route as StudyMethodRoute,
        achievementId: parsed.achievementId,
        topicName: parsed.topicName,
      };
      emit();
    }
  } catch {
    /* corrupt value — leave the default (null) */
  }
}

/** Reset the IN-MEMORY cache (account wipe / user switch — clearLocalAccountData).
 *  Clears the current location + hydrated flag and emits so live hooks re-render
 *  null; the next read re-hydrates from the (cleared) storage. */
export function resetLocal(): void {
  current = null;
  hydrated = false;
  emit();
}

/** Subscribe to the last study location; hydrates from storage on first use. */
export function useLastStudyLocation(): LastStudyLocation {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      void hydrate();
      return () => {
        listeners.delete(cb);
      };
    },
    getLastStudyLocation,
    getLastStudyLocation,
  );
}
