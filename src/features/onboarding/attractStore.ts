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
  deckNextDone: boolean; // user has stepped the Manage My Learning pager once
  firstSeenAt: number | null; // ms epoch of the first-ever Home view
};

let state: AttractState = {
  exploreDone: false,
  aboutDone: false,
  enrolledOnce: false,
  deckNextDone: false,
  firstSeenAt: null,
};
let hydrated = false;
let hydrating: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((l) => l());
}
function persist(): void {
  // Never before a read has answered: the record on disk was not seen, so
  // writing `state` would replace it (see the failed-read note in hydrate).
  if (!hydrated) return;
  void AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {});
}

async function hydrate(): Promise<void> {
  if (hydrated) return;
  if (!hydrating) {
    hydrating = (async () => {
      let raw: string | null;
      try {
        raw = await AsyncStorage.getItem(KEY);
      } catch {
        // READ failed (evening pass 1, 2026-10-02): UNREADABLE, not "fresh".
        // It used to fall through to the defaults with `hydrated = true`, and
        // noteHomeSeen() — called on every Home view — then SAVED those
        // all-false defaults over the stored record: a returning learner's
        // Explore ring breathed again, About re-armed a new week and the
        // green Enrollments chip went dark, for good. Stay unhydrated (every
        // cue stays quiet, the marks write nothing) and read again next time.
        hydrating = null;
        return;
      }
      try {
        if (raw) {
          const p = JSON.parse(raw) as Partial<AttractState>;
          state = {
            exploreDone: !!p.exploreDone,
            aboutDone: !!p.aboutDone,
            enrolledOnce: !!p.enrolledOnce,
            deckNextDone: !!p.deckNextDone,
            firstSeenAt: typeof p.firstSeenAt === 'number' ? p.firstSeenAt : null,
          };
        }
      } catch {
        // start fresh
      }
      hydrated = true;
      applyPendingMarks();
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

/**
 * A cue retired by the learner (Explore / About opened, first enrolment, the
 * pager stepped) is recorded as PENDING and applied once the stored record has
 * been read (evening pass 2, 2026-10-02). Pass 1 made a failed read write
 * nothing — right — but a mark made in that state was simply dropped: the
 * learner opened Explore, and once storage answered its ring breathed at them
 * again. The mark now waits and is laid ON TOP of the stored record.
 */
type Mark = 'exploreDone' | 'aboutDone' | 'enrolledOnce' | 'deckNextDone';
const pendingMarks = new Set<Mark>();

function applyPendingMarks(): void {
  if (!hydrated || pendingMarks.size === 0) return;
  const next = { ...state };
  let changed = false;
  for (const k of pendingMarks) {
    if (!next[k]) {
      next[k] = true;
      changed = true;
    }
  }
  pendingMarks.clear();
  if (!changed) return;
  state = next;
  persist();
  emit();
}

function mark(k: Mark): void {
  pendingMarks.add(k);
  void hydrate().then(applyPendingMarks);
}

/** The user opened Explore — retire its cue permanently. */
export function markExploreOpened(): void {
  mark('exploreDone');
}

/** The user opened About — retire its cue permanently. */
export function markAboutOpened(): void {
  mark('aboutDone');
}

/** The user added their first topic/bundle to My Enrollment — retire the
 *  Enrollments cue permanently (owner 2026-09-14). */
export function markEnrolled(): void {
  mark('enrolledOnce');
}

/** The user stepped the Manage My Learning pager — retire its cue for good
 *  (owner 2026-09-20). Either arrow counts: they have found the control, and
 *  saying so again is just clutter over a button they already use. */
export function markDeckStepped(): void {
  mark('deckNextDone');
}

export type AttractFlags = {
  explore: boolean;
  about: boolean;
  /** Enrollments cue is ANIMATING (explored, but not yet enrolled). */
  enrollments: boolean;
  /** The user has enrolled their first topic — the chip stays GREEN permanently
   *  (frame + text) after the animation retires. */
  enrolledOnce: boolean;
  /** The Manage My Learning pager `›` still needs pointing at: it is the only
   *  way to reach pages 2…n of a 13-page deck, and a static green square next
   *  to a static green square reads as decoration (owner 2026-09-20). */
  deckNext: boolean;
};

function computeFlags(now: number): AttractFlags {
  // Unknown is QUIET (night pass 2, 2026-10-01). Before the stored record has
  // been read every cue computed from the all-false defaults, so on each cold
  // launch a returning user's Home lit the Explore ring and breathed About for
  // the length of the storage read — "start here" pointers at things they had
  // used for weeks. Nothing is cued until we know.
  if (!hydrated) return { explore: false, about: false, enrollments: false, enrolledOnce: false, deckNext: false };
  const explore = !state.exploreDone;
  const aboutWindowOpen = state.firstSeenAt == null || now - state.firstSeenAt < ABOUT_WINDOW_MS;
  const about = !state.aboutDone && aboutWindowOpen;
  // Enrollments cue is the NEXT step: it ANIMATES only after Explore has been
  // opened and until the first topic/bundle is added; once added, the chip keeps
  // a static green frame+text (enrolledOnce) permanently.
  const enrollments = state.exploreDone && !state.enrolledOnce;
  return { explore, about, enrollments, enrolledOnce: state.enrolledOnce, deckNext: !state.deckNextDone };
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
  // Unknown reads as OPENED (night pass 3, 2026-10-01) — the quiet-when-unknown
  // rule computeFlags got in pass 2, missed here. Before the record was read
  // `aboutDone` was its false default, so Explore reached before hydration
  // breathed its About ring at someone who had opened About long ago.
  const [v, setV] = useState<boolean>(() => !hydrated || state.aboutDone);
  useEffect(() => {
    const l = () => setV(!hydrated || state.aboutDone);
    listeners.add(l);
    void hydrate().then(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return v;
}

/**
 * Clear all cues.
 *
 * ⛔ DELIBERATELY NOT WIRED INTO THE ACCOUNT WIPE, and the docstring used to
 *    say the opposite. These cues are device-level first-use state, the same
 *    family as onboardingFlow, and `accountWipeRegistry.test.ts` exempts this
 *    module on exactly that ruling. The old wording ("Account wipe / user
 *    switch — clear all cues (clearLocalAccountData)") described a call that
 *    does not exist and would have sent the next reader to register it,
 *    against the ruling.
 *
 *    Kept as an export because it is the correct thing to call if that ruling
 *    is ever reversed — and because deleting it would lose the reasoning.
 */
export function resetLocal(): void {
  state = { exploreDone: false, aboutDone: false, enrolledOnce: false, deckNextDone: false, firstSeenAt: null };
  hydrated = false;
  hydrating = null;
  pendingMarks.clear();
  emit();
}
