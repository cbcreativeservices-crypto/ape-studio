/**
 * drumProgress — the Drum Tuning Lab's device-local progress (AsyncStorage
 * `ape:drumtuning:v1`, inside the `ape:*` account wipe). The
 * mastering/masteringProgress pattern: only what reproduces the learner's
 * place — which chapters are banked, which scenarios were answered, whether
 * the chapter's interactive was completed, the resume point — plus the
 * Chapter 6 TUNING NOTES (owner spec: "save tuning notes so users can
 * reproduce a setup"). Never per-frame state.
 *
 * HOUSE GUEST RULE (owner 2026-08-12): a signed-out guest or a members-only
 * preview neither restores nor saves. The screen sets the flag every render
 * from the live entitlement (setDrumSaveBlocked) and waits for the tier to be
 * `resolved` before the first load.
 *
 * CREDIT IS NEVER REMOVED (owner 2026-09-29): a practice reset clears the
 * answers, the interactive flags and the resume point; it keeps `done` and
 * the tuning notes.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DrumChapterId, TuningNote } from './drumContent';

const KEY = 'ape:drumtuning:v1';

/** Notes are small; the list is capped so it can never grow into the
 *  AsyncStorage ceiling. Oldest drops first. */
export const MAX_TUNING_NOTES = 24;

export type DrumChapterProgress = {
  done: boolean;
  /** scenario id → answered correctly on the first pick. */
  answers: Record<string, boolean>;
  /** The chapter's interactive reached its goal this run. */
  interactive?: boolean;
};

export type DrumProgressState = {
  modules: Partial<Record<DrumChapterId, DrumChapterProgress>>;
  lastModule?: DrumChapterId;
  lastStep?: number;
  notes: TuningNote[];
};

export const emptyDrumChapter = (): DrumChapterProgress => ({ done: false, answers: {} });

let saveBlocked = false;
export function setDrumSaveBlocked(blocked: boolean): void {
  saveBlocked = blocked;
}

const empty = (): DrumProgressState => ({ modules: {}, notes: [] });

export async function loadDrumProgress(): Promise<DrumProgressState> {
  if (saveBlocked) return empty();
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return empty();
    const p = JSON.parse(raw) as Partial<DrumProgressState>;
    return { modules: p.modules ?? {}, lastModule: p.lastModule, lastStep: p.lastStep, notes: Array.isArray(p.notes) ? p.notes.filter(validNote) : [] };
  } catch {
    return empty();
  }
}

function validNote(n: unknown): n is TuningNote {
  const x = n as TuningNote;
  return !!x && typeof x.id === 'string' && typeof x.name === 'string' && Array.isArray(x.drums);
}

async function save(s: DrumProgressState): Promise<void> {
  if (saveBlocked) return;
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // Local convenience state — losing it never blocks learning.
  }
}

/** Serialized read-modify-write: two writers in one tap never clobber each
 *  other through a stale copy. */
let queue: Promise<unknown> = Promise.resolve();
export function updateDrumProgress(mutate: (s: DrumProgressState) => void): Promise<DrumProgressState> {
  const run = queue.then(async () => {
    const s = await loadDrumProgress();
    mutate(s);
    await save(s);
    return s;
  });
  queue = run.catch(() => undefined);
  return run;
}

/** A PRACTICE reset: answers, interactive flags and the resume point clear;
 *  `done` and the tuning notes are kept. */
export function resetDrumPractice(): Promise<DrumProgressState> {
  return updateDrumProgress((s) => {
    for (const id of Object.keys(s.modules) as DrumChapterId[]) {
      s.modules[id] = { ...emptyDrumChapter(), done: !!s.modules[id]?.done };
    }
    s.lastModule = undefined;
    s.lastStep = undefined;
  });
}

/** Save (insert or replace by id) a tuning note. */
export function saveTuningNote(note: TuningNote): Promise<DrumProgressState> {
  return updateDrumProgress((s) => {
    const next = [...s.notes.filter((n) => n.id !== note.id), note];
    next.sort((a, b) => a.savedAt - b.savedAt);
    while (next.length > MAX_TUNING_NOTES) next.shift();
    s.notes = next;
  });
}

export function deleteTuningNote(id: string): Promise<DrumProgressState> {
  return updateDrumProgress((s) => {
    s.notes = s.notes.filter((n) => n.id !== id);
  });
}
