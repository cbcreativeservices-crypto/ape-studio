/**
 * enrollmentStore — the user's device-local ENROLLMENT LIST (user request
 * 2026-07-22): the topics they've enrolled in / added. The Enrollment screen
 * manages this list, and it is the source for the topics the user swipe-scrolls
 * in the Dashboard's top container (Dashboard wiring is a follow-up).
 *
 * Each entry = a topic gs (achievements.global_sequence) with two user flags:
 *   favorite — starred.
 *   active   — ACTIVE/INACTIVE toggle: inactive = temporarily set aside WITHOUT
 *              removing (stays in the list, drops out of the active study set).
 * Order is user-arrangeable (move up/down). Persisted to AsyncStorage — same
 * tiny external-store pattern as flaggedStore.
 *
 * NOTE: this is a CLIENT list; it does NOT touch the backend `enrollment` table
 * (backend frozen). "Saved" in the account sense is gated in the UI by
 * entitlement (anonymous = warned it won't be saved).
 */
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';

export type EnrollTopic = { gs: number; favorite: boolean; active: boolean };

const KEY = 'ape:enrollmentList';
// One-time seed marker. v4 (2026-07-22): the two free topics are Professional
// Audio Safety (gs100) + DAW Fundamentals & Session Management (gs1240). The
// other two required cores (gs120/gs1590) are NOT seeded — they join the list
// only once the user adds their first certificate or program (user request
// 2026-07-22, handled in EnrollmentScreen/AwardsScreen).
const SEED_KEY = 'ape:enrollmentSeeded4';
// The 2 auto-enrolled FREE topics a non-subscribed user sees (user request
// 2026-07-22): gs100 "Professional Audio Safety" + gs1240 "DAW Fundamentals &
// Session Management". Safety is ALSO a required core. Signal Path & Levels
// (gs150) is NOT free.
export const FREE_ENROLL_GS: readonly number[] = [100, 1240];
/** Prior seeds to remove on re-seed: gs0/gs36 placeholders + gs150 (the retired
 *  substitute). */
const LEGACY_FREE_GS: readonly number[] = [0, 36, 150];
export function isFreeEnrollGs(gs: number): boolean {
  return FREE_ENROLL_GS.includes(gs);
}

let list: EnrollTopic[] = [];
let hydrated = false;
let hydrating: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}
function persist() {
  void AsyncStorage.setItem(KEY, JSON.stringify(list));
}

// Mirror the enrollment list to the SERVER (owner 2026-08-06): user_topic_enrollments
// is the master list the backend gates v3 study/quiz on. Debounced; signed-in only
// (guests stay device-local). Best-effort — the local list is the source and
// re-syncs on the next change if a sync fails.
let syncTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleServerSync() {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    void (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session) return;
        await supabase.rpc('sync_my_enrollments', {
          p_items: list.map((e, i) => ({ gs: e.gs, favorite: e.favorite, active: e.active, position: i })),
        });
      } catch {
        /* best-effort */
      }
    })();
  }, 800);
}

async function hydrate(): Promise<void> {
  if (hydrated) return;
  if (!hydrating) {
    hydrating = (async () => {
      let loaded: EnrollTopic[] = [];
      try {
        const raw = await AsyncStorage.getItem(KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as EnrollTopic[];
          if (Array.isArray(parsed)) {
            loaded = parsed
              .filter((e) => e && typeof e.gs === 'number')
              .map((e) => ({ gs: e.gs, favorite: !!e.favorite, active: e.active !== false }));
          }
        }
      } catch {
        // corrupt/absent → start empty
      }
      // One-time seed of the FREE topics so everyone is already enrolled in
      // them (user request 2026-07-22). Idempotent via SEED_KEY.
      try {
        const seeded = await AsyncStorage.getItem(SEED_KEY);
        if (seeded !== '1') {
          // Migrate: drop the old placeholder free gs (0/36) if a prior build
          // seeded them, so testers don't keep stale unnamed rows.
          loaded = loaded.filter((e) => !LEGACY_FREE_GS.includes(e.gs));
          const have = new Set(loaded.map((e) => e.gs));
          // Prepend so the free topics are the FIRST two shown (user request).
          const freeAdd = FREE_ENROLL_GS.filter((gs) => !have.has(gs)).map((gs) => ({
            gs,
            favorite: false,
            active: true,
          }));
          loaded = [...freeAdd, ...loaded];
          await AsyncStorage.setItem(SEED_KEY, '1');
          await AsyncStorage.setItem(KEY, JSON.stringify(loaded));
        }
      } catch {
        // seeding is best-effort
      }
      list = loaded;
      hydrated = true;
      emit();
    })();
  }
  return hydrating;
}

function commit(next: EnrollTopic[]) {
  list = next; // new identity so React snapshots update
  persist();
  scheduleServerSync();
  emit();
}

export function getEnrollment(): EnrollTopic[] {
  void hydrate();
  return list;
}

export function isEnrolled(gs: number): boolean {
  return list.some((e) => e.gs === gs);
}

/** Add topics (gs) not already present, appended in order, active + unfavorited.
 *  Returns how many were newly added. */
export function addTopics(gsList: number[]): number {
  const have = new Set(list.map((e) => e.gs));
  const seen = new Set<number>();
  const additions: EnrollTopic[] = [];
  for (const gs of gsList) {
    if (have.has(gs) || seen.has(gs)) continue;
    seen.add(gs);
    additions.push({ gs, favorite: false, active: true });
  }
  if (additions.length === 0) return 0;
  commit([...list, ...additions]);
  return additions.length;
}

export function addTopic(gs: number): void {
  addTopics([gs]);
}

export function removeTopic(gs: number): void {
  if (!list.some((e) => e.gs === gs)) return;
  commit(list.filter((e) => e.gs !== gs));
}

/** Toggle membership — add if absent, remove if present (add-menu tap). */
export function toggleTopic(gs: number): void {
  if (list.some((e) => e.gs === gs)) removeTopic(gs);
  else addTopic(gs);
}

export function toggleFavorite(gs: number): void {
  commit(list.map((e) => (e.gs === gs ? { ...e, favorite: !e.favorite } : e)));
}

export function toggleActive(gs: number): void {
  commit(list.map((e) => (e.gs === gs ? { ...e, active: !e.active } : e)));
}

/** Bulk-set active on many topics (bundle LOAD/UNLOAD, user request 2026-07-22). */
export function setActiveMany(gsList: number[], active: boolean): void {
  const set = new Set(gsList);
  let changed = false;
  const next = list.map((e) => {
    if (set.has(e.gs) && e.active !== active) {
      changed = true;
      return { ...e, active };
    }
    return e;
  });
  if (changed) commit(next);
}

/** Reset the enrollment list to the NEW-USER DEFAULT (the seeded FREE topics).
 *  User PROGRESS is stored separately and is NOT touched — cleared topics can be
 *  re-added from the browse/add lists (user request 2026-07-25). */
export function resetEnrollment(): void {
  commit(FREE_ENROLL_GS.map((gs) => ({ gs, favorite: false, active: true })));
}

/** Reset the IN-MEMORY cache (account wipe / user switch — clearLocalAccountData).
 *  Clears the list + hydrated flags and emits so live useEnrollment() hooks
 *  re-render empty; the next read re-hydrates from the (cleared) storage, which
 *  re-seeds the free topics = correct new-user default. */
export function resetLocal(): void {
  list = [];
  hydrated = false;
  hydrating = null;
  emit();
}

/** Move an entry up (-1) or down (+1) in the user's order. */
export function moveTopic(gs: number, dir: -1 | 1): void {
  const i = list.findIndex((e) => e.gs === gs);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return;
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  commit(next);
}

/** Live view of the enrollment list (re-renders on any change, any screen). */
export function useEnrollment(): EnrollTopic[] {
  const [snap, setSnap] = useState<EnrollTopic[]>(list);
  useEffect(() => {
    const l = () => setSnap(list);
    listeners.add(l);
    void hydrate().then(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return snap;
}
