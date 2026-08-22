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
 * NOTE: this is the device-local source of truth. For a signed-in user it is
 * ALSO best-effort mirrored to the backend via the `sync_my_enrollments` RPC
 * (see scheduleServerSync below, added 2026-08-06) — failures are swallowed and
 * the local list stays authoritative. Guests never sync. "Saved" in the account
 * sense is gated in the UI by entitlement (anonymous = warned it won't be saved).
 */
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';

export type EnrollTopic = { gs: number; favorite: boolean; active: boolean };

const KEY = 'ape:enrollmentList';
// One-time seed marker. v5 (2026-08-10): RE-KEYED TO v3. The two free topics are
// Professional Audio Safety (gs3060) + DAW Fundamentals & Session Management
// (gs3970). The old gs (100 / 1240) predated the v3 curriculum re-key — active
// v3 topics live at gs 3000–4710, so 100/1240 resolved to NO topic and rendered
// as "Topic gs100 / gs1240". Bumping the seed key re-seeds every existing user
// once: drop the old free gs (now in LEGACY_FREE_GS) and add the v3 ones.
const SEED_KEY = 'ape:enrollmentSeeded5';
// The 2 auto-enrolled FREE topics a non-subscribed user sees: gs3060
// "Professional Audio Safety" (ALSO a required core) + gs3970 "DAW Fundamentals
// & Session Management". (v3 achievements.global_sequence.)
export const FREE_ENROLL_GS: readonly number[] = [3060, 3970];
/** Prior seeds to remove on re-seed: gs0/gs36 placeholders, gs150 (retired
 *  substitute), and gs100/gs1240 (the pre-v3 free topics, re-keyed to 3060/3970). */
const LEGACY_FREE_GS: readonly number[] = [0, 36, 150, 100, 1240];
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
let syncRetries = 0;
const MAX_SYNC_RETRIES = 4;
function scheduleServerSync(delayMs = 800) {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    void (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session) return;
        // supabase-js RESOLVES with { error } — the old dead catch never saw RPC
        // errors, so a failed FINAL sync left the server master list stale with
        // no retry until the user next edited enrollment (backend gates v3
        // study/quiz on this list). Check error + re-arm a bounded backoff.
        const { error } = await supabase.rpc('sync_my_enrollments', {
          p_items: list.map((e, i) => ({ gs: e.gs, favorite: e.favorite, active: e.active, position: i })),
        });
        if (error) {
          if (syncRetries < MAX_SYNC_RETRIES) {
            syncRetries++;
            scheduleServerSync(Math.min(30_000, 1500 * 2 ** (syncRetries - 1))); // 1.5s→3s→6s→12s
          } else {
            console.warn('[enrollment] sync_my_enrollments giving up after retries:', error.message);
            syncRetries = 0;
          }
          return;
        }
        syncRetries = 0; // success
      } catch (e) {
        // Transport throw (network) — same bounded backoff.
        if (syncRetries < MAX_SYNC_RETRIES) {
          syncRetries++;
          scheduleServerSync(Math.min(30_000, 1500 * 2 ** (syncRetries - 1)));
        } else {
          console.warn('[enrollment] sync_my_enrollments threw, giving up:', (e as Error).message);
          syncRetries = 0;
        }
      }
    })();
  }, delayMs);
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
      let migrated = false;
      try {
        const seeded = await AsyncStorage.getItem(SEED_KEY);
        if (seeded !== '1') {
          // Migrate: drop retired free/placeholder gs (LEGACY_FREE_GS) so testers
          // don't keep stale unnamed rows — this is what clears the pre-v3
          // gs100/gs1240 that rendered as "Topic gsN".
          const before = loaded.length;
          loaded = loaded.filter((e) => !LEGACY_FREE_GS.includes(e.gs));
          const have = new Set(loaded.map((e) => e.gs));
          // Prepend so the free topics are the FIRST two shown (user request).
          const freeAdd = FREE_ENROLL_GS.filter((gs) => !have.has(gs)).map((gs) => ({
            gs,
            favorite: false,
            active: true,
          }));
          loaded = [...freeAdd, ...loaded];
          migrated = loaded.length !== before || freeAdd.length > 0;
          await AsyncStorage.setItem(SEED_KEY, '1');
          await AsyncStorage.setItem(KEY, JSON.stringify(loaded));
        }
      } catch {
        // seeding is best-effort
      }
      list = loaded;
      hydrated = true;
      emit();
      // Push the re-keyed free topics to the server so the corrected list is the
      // one the backend gates on (owner 2026-08-10 v3 re-key fix).
      if (migrated) scheduleServerSync();
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

/** Self-heal (owner 2026-08-10): drop enrolled topics whose gs is NOT in `valid`
 *  — stale pre-v3 rows that no longer resolve to an active curriculum topic and
 *  would show as "Topic gsN". Commits (so it re-syncs the server) only when it
 *  actually removes something. NEVER runs against an empty `valid` set (that
 *  would be "curriculum still loading", not "everything is invalid"). */
export function pruneInvalidGs(valid: Set<number>): number {
  if (valid.size === 0) return 0;
  const next = list.filter((e) => valid.has(e.gs));
  const removed = list.length - next.length;
  if (removed > 0) commit(next);
  return removed;
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
