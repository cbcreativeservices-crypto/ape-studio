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
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function hydrate(): Promise<void> {
  if (hydrated) return Promise.resolve();
  if (!hydrating) {
    hydrating = (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw != null) done = raw === '1';
      } catch {
        // corrupt/absent → keep default (not completed)
      }
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
  void AsyncStorage.setItem(STORAGE_KEY, '1');
  emit();
}

/** Replay the orientation (Settings → "Reset onboarding hints"). */
export function resetAmplitudeOrientation(): void {
  done = false;
  void AsyncStorage.removeItem(STORAGE_KEY);
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
