/**
 * attractStore — first-run "start here" attention cues for the Home screen
 * (owner 2026-09-14). Two independent, device-local, persisted cues:
 *   • EXPLORE — breathes until the user opens Explore for the first time. No
 *     time expiry: it's the primary "begin here" cue and simply stops on use.
 *   • ABOUT   — breathes until the user opens About, OR until 7 days after the
 *     first Home view, whichever comes first. About is a new-user courtesy, so
 *     returning users past week one see it plain (no special attention).
 *
 * Same external-store pattern as homeCardsStore (module state + listeners +
 * AsyncStorage). The About window is evaluated at read time against firstSeenAt.
 */
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// v2 (owner 2026-09-14): bumped so any stale onboarding state persisted during
// development is discarded and the explore-first sequence starts fresh.
const KEY = 'ape:homeAttract2';
const ABOUT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000; // one week

type AttractState = {
  exploreDone: boolean; // user has opened Explore at least once
  aboutDone: boolean; // user has opened About at least once
  enrolledOnce: boolean; // user has added their first topic/bundle to My Enrollment
  firstSeenAt: number | null; // ms epoch of the first-ever Home view
};

let state: AttractState = { exploreDone: false, aboutDone: false, enrolledOnce: false, firstSeenAt: null };
let hydrated = false;
let hydrating: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((l) => l());
}
function persist(): void {
  void AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {});
}

async function hydrate(): Promise<void> {
  if (hydrated) return;
  if (!hydrating) {
    hydrating = (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        if (raw) {
          const p = JSON.parse(raw) as Partial<AttractState>;
          state = {
            exploreDone: !!p.exploreDone,
            aboutDone: !!p.aboutDone,
            enrolledOnce: !!p.enrolledOnce,
            firstSeenAt: typeof p.firstSeenAt === 'number' ? p.firstSeenAt : null,
          };
        }
      } catch {
        // start fresh
      }
      hydrated = true;
      emit();
    })();
  }
  return hydrating;
}

/** Stamp the first-ever Home view (starts the About week-window). No-op after. */
export function noteHomeSeen(): void {
  void hydrate().then(() => {
    if (state.firstSeenAt == null) {
      state = { ...state, firstSeenAt: Date.now() };
      persist();
      emit();
    }
  });
}

/** The user opened Explore — retire its cue permanently. */
export function markExploreOpened(): void {
  void hydrate().then(() => {
    if (!state.exploreDone) {
      state = { ...state, exploreDone: true };
      persist();
      emit();
    }
  });
}

/** The user opened About — retire its cue permanently. */
export function markAboutOpened(): void {
  void hydrate().then(() => {
    if (!state.aboutDone) {
      state = { ...state, aboutDone: true };
      persist();
      emit();
    }
  });
}

/** The user added their first topic/bundle to My Enrollment — retire the
 *  Enrollments cue permanently (owner 2026-09-14). */
export function markEnrolled(): void {
  void hydrate().then(() => {
    if (!state.enrolledOnce) {
      state = { ...state, enrolledOnce: true };
      persist();
      emit();
    }
  });
}

export type AttractFlags = {
  explore: boolean;
  about: boolean;
  /** Enrollments cue is ANIMATING (explored, but not yet enrolled). */
  enrollments: boolean;
  /** The user has enrolled their first topic — the chip stays GREEN permanently
   *  (frame + text) after the animation retires. */
  enrolledOnce: boolean;
};

function computeFlags(now: number): AttractFlags {
  const explore = !state.exploreDone;
  const aboutWindowOpen = state.firstSeenAt == null || now - state.firstSeenAt < ABOUT_WINDOW_MS;
  const about = !state.aboutDone && aboutWindowOpen;
  // Enrollments cue is the NEXT step: it ANIMATES only after Explore has been
  // opened and until the first topic/bundle is added; once added, the chip keeps
  // a static green frame+text (enrolledOnce) permanently.
  const enrollments = state.exploreDone && !state.enrolledOnce;
  return { explore, about, enrollments, enrolledOnce: state.enrolledOnce };
}

/** Live attract flags for the Home screen. Recomputes on store changes and on
 *  mount (so the About week-window is re-checked each time Home is shown). */
export function useHomeAttract(): AttractFlags {
  const [snap, setSnap] = useState<AttractFlags>(() => computeFlags(Date.now()));
  useEffect(() => {
    const l = () => setSnap(computeFlags(Date.now()));
    listeners.add(l);
    void hydrate().then(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return snap;
}

/** Reactive "has About EVER been opened" (raw aboutDone, NOT the week-windowed
 *  Home cue). Used by the Explore screen's temporary "About the Academy" link,
 *  which shows until About is viewed by EITHER path (Home cue or that link both
 *  call markAboutOpened) and then retires permanently. */
export function useAboutOpened(): boolean {
  const [v, setV] = useState<boolean>(() => state.aboutDone);
  useEffect(() => {
    const l = () => setV(state.aboutDone);
    listeners.add(l);
    void hydrate().then(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return v;
}

/** Account wipe / user switch — clear all cues (clearLocalAccountData). */
export function resetLocal(): void {
  state = { exploreDone: false, aboutDone: false, enrolledOnce: false, firstSeenAt: null };
  hydrated = false;
  hydrating = null;
  emit();
}
