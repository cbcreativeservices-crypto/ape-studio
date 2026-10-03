/**
 * amplitudeOrientation — the ONE completion flag for the "Understanding Level &
 * Amplitude Displays" orientation (owner spec 2026-08-12).
 *
 * Two paths set the SAME flag (single source of truth):
 *  - Path A: the learner completes the lesson inside Foundations of Sound
 *    (the course's START HERE step).
 *  - Path B: the learner opens any interactive audio lab/tool first — the
 *    centralized gate (withAmplitudeOrientation, wired in RootNavigator) shows
 *    the same full lab page once, then continues to the selected destination.
 *
 * Persistence: `ape:intro:amplitudeOrientation` — deliberately in the
 * `ape:intro:*` family so Settings → "Reset onboarding hints" replays it
 * (Settings also calls resetAmplitudeOrientation() explicitly so the live
 * in-memory flag resets without a relaunch).
 *
 * Tiny hand-rolled external store (same pattern as popupSuppressStore):
 * module-level value + listeners, hydrated once from AsyncStorage on import.
 */
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'ape:intro:amplitudeOrientation';

let done = false; // spec default: NOT completed
let hydrated = false;
let hydrating: Promise<void> | null = null;
/** The last read THREW (wave 2, 2026-10-02): the flag shows "not completed"
 *  for now — the orientation is offered again, the side that never blocks a
 *  lab — and the next call reads again. Nothing is written from it: the only
 *  write is a deliberate "completed". */
let readFailed = false;
/** Bumped by a replay (resetAmplitudeOrientation): a read that started before
 *  it lands nowhere, so it cannot put the old "completed" back. */
let gen = 0;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function hydrate(): Promise<void> {
  if (hydrated && !readFailed) return Promise.resolve();
  if (!hydrating) {
    const g = gen;
    hydrating = (async () => {
      let raw: string | null;
      try {
        raw = await AsyncStorage.getItem(STORAGE_KEY);
      } catch {
        if (g !== gen) return;
        readFailed = true;
        hydrating = null;
        hydrated = true; // resolve the gate (null would render nothing): not completed, for now
        emit();
        return;
      }
      if (g !== gen) return;
      // A completion made while the read was out stands (it is newer than
      // the copy read): the read can only ADD "completed", never undo it.
      if (raw === '1') done = true;
      readFailed = false;
      hydrating = null;
      hydrated = true;
      emit();
    })();
  }
  return hydrating;
}

// Warm the flag at app boot so any lab/tool entry reads it synchronously.
void hydrate();

/** Current value (sync). False until hydration lands (hydration runs at boot). */
export function hasCompletedAmplitudeOrientation(): boolean {
  void hydrate();
  return done;
}

/** Mark the orientation complete (both Path A and Path B call this). */
export function markAmplitudeOrientationComplete(): void {
  if (done) return;
  done = true;
  // Silent on purpose: the app's first-use flag — a lost flag offers the orientation once more.
  void AsyncStorage.setItem(STORAGE_KEY, '1').catch(() => {});
  emit();
}

/** Replay the orientation (Settings → "Reset onboarding hints"). */
export function resetAmplitudeOrientation(): void {
  gen++;
  hydrating = null;
  readFailed = false;
  hydrated = true; // the replay IS the answer: not completed
  done = false;
  // Silent on purpose: the replay already happens in memory now; the wipe calls this too.
  void AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  emit();
}

/** Live view: `null` while hydrating (first ms of an app run), then the flag.
 *  Gates render nothing during the null beat so completed users never see a
 *  flash of the orientation, and new users never see a flash of the lab. */
export function useAmplitudeOrientationDone(): boolean | null {
  const [snap, setSnap] = useState<boolean | null>(hydrated ? done : null);
  useEffect(() => {
    const l = () => setSnap(done);
    listeners.add(l);
    void hydrate().then(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return snap;
}
