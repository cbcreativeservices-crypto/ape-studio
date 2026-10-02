/**
 * lastStudyLocation — device-local memory of WHERE the learner last was in the
 * study stack, so the Enrollments "CONTINUE LEARNING" banner can resume the
 * exact spot (a study METHOD screen with its topic, or the Dashboard).
 *
 * On the shared safe store (features/storage/localStore.ts), hydrated lazily on
 * first use. Persisted as one JSON record under `ape:lastStudyLoc`.
 */
import { createLocalStore } from '../storage/localStore';

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

/**
 * ON THE SHARED SAFE STORE (wave 2, 2026-10-02). The hand-rolled store marked
 * itself hydrated BEFORE its read, so a read that threw left "nothing
 * recorded" for the rest of the run (CONTINUE LEARNING gone until relaunch)
 * with no second try. Now a failed read stays unhydrated and is retried on the
 * next observation; a spot recorded meanwhile is shown at once and written
 * once a read succeeds (it replaces the stored spot whole — the newest spot is
 * the right one). The generation fence and the wipe registration are the
 * store's.
 */
const store = createLocalStore<LastStudyLocation>({
  key: STORAGE_KEY,
  empty: () => null,
  parse: (p) => {
    const parsed = p as { kind?: unknown; route?: unknown; achievementId?: unknown; topicName?: unknown } | null;
    if (parsed?.kind === 'dashboard') return { kind: 'dashboard' };
    if (
      parsed?.kind === 'method' &&
      typeof parsed.route === 'string' &&
      METHOD_ROUTES.has(parsed.route) &&
      typeof parsed.achievementId === 'string' &&
      typeof parsed.topicName === 'string'
    ) {
      return {
        kind: 'method',
        route: parsed.route as StudyMethodRoute,
        achievementId: parsed.achievementId,
        topicName: parsed.topicName,
      };
    }
    return null; // an unknown shape reads as nothing recorded, as before
  },
  // null = nothing recorded: the key is removed, as before.
  serialize: (loc) => (loc == null ? null : JSON.stringify(loc)),
});

/** Record the last study location (persist + notify subscribers). Nothing is
 *  told "saved" here; the banner simply reads the store. */
export function setLastStudyLocation(loc: LastStudyLocation): void {
  void store.set(loc);
}

/** Current last study location (synchronous snapshot). */
export function getLastStudyLocation(): LastStudyLocation {
  return store.get();
}

/** Reset the IN-MEMORY cache (account wipe / user switch — clearLocalAccountData).
 *  Drops the current location and emits so live hooks re-render null; the
 *  next read re-hydrates from the (cleared) storage. */
export function resetLocal(): void {
  store.reset();
}

/** Subscribe to the last study location; hydrates from storage on first use. */
export function useLastStudyLocation(): LastStudyLocation {
  return store.use();
}
