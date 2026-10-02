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
 * Order is user-arrangeable (move up/down). Persisted to AsyncStorage through
 * the shared safe store (pattern catalog 2026-10-02, closer A2): a read that
 * FAILED is unreadable and never written over (it used to start empty, and
 * the next edit saved — and pushed to the server master list — that empty
 * copy); an edit before the stored list lands is applied on top of it
 * (full-app run 2, 2026-10-01); a read in flight across the account wipe
 * lands nowhere (bug pass 2, 2026-09-30); the wipe reaches the store without
 * a hand entry.
 *
 * NOTE: this is the device-local source of truth. For a signed-in user it is
 * ALSO best-effort mirrored to the backend via the `sync_my_enrollments` RPC
 * (see scheduleServerSync below, added 2026-08-06) — failures are swallowed and
 * the local list stays authoritative. Guests never sync. "Saved" in the account
 * sense is gated in the UI by entitlement (anonymous = warned it won't be saved).
 */
import { supabase } from '../../lib/supabase';
import { safeSession } from '../../lib/getSessionSafe';
import { isRealAccount } from '../commercial/realAccount';
import { createLocalStore } from '../storage/localStore';
import { freshGs, studyFocusAction } from './enrollmentPlan';

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
// ⚠️ MIRRORED IN THE DATABASE. `glossary_study_v` masks definitions with
// `a.global_sequence = any (array[3060, 3970])`
// (docs/APE_GLOSSARY_STUDY_V_MASK_2026_09_13.SQL). If this pair changes and the
// view does not, a newly-free topic's study cards silently become
// 120-character teasers — or a paid topic's definitions silently open up.
export const FREE_ENROLL_GS: readonly number[] = [3060, 3970];
/** Prior seeds to remove on re-seed: gs0/gs36 placeholders, gs150 (retired
 *  substitute), and gs100/gs1240 (the pre-v3 free topics, re-keyed to 3060/3970). */
const LEGACY_FREE_GS: readonly number[] = [0, 36, 150, 100, 1240];
export function isFreeEnrollGs(gs: number): boolean {
  return FREE_ENROLL_GS.includes(gs);
}

// Mirror the enrollment list to the SERVER (owner 2026-08-06): user_topic_enrollments
// is the master list the backend gates v3 study/quiz on. Debounced; signed-in only
// (guests stay device-local). Best-effort — the local list is the source and
// re-syncs on the next change if a sync fails.
let syncTimer: ReturnType<typeof setTimeout> | null = null;
let syncRetries = 0;
const MAX_SYNC_RETRIES = 4;

/**
 * Has this identity's list been reconciled against the server yet?
 *
 * ── THE SYNC ONLY EVER WENT ONE WAY (2026-09-17, bug-hunt pass 2) ─────────
 *
 * `sync_my_enrollments` pushes the device's list up and nothing anywhere reads
 * it back — a repo-wide search for the table returns only the write. That is
 * fine for the case it was designed for (one device, editing its own list) and
 * quietly destructive for the case nobody wrote down: a REINSTALL, or a second
 * device. The fresh install seeds the two free topics, signs in, pushes that
 * seed over the master list, and per governance R3 the backend gates v3 study
 * and quizzes on exactly that list — so a paying member loses access to topics
 * they enrolled in, and the app shows them as enrolled while the server refuses.
 *
 * The store's own history records the same shape happening once already, when a
 * sign-out/sign-in inside the retry window pushed an empty list and "wiped THEIR
 * enrollment master list".
 */
let reconciled = false;

// Bumped on every account wipe (bug pass 2, 2026-09-30) — the server-sync
// fences below capture it before their first await. Mirrors the shared
// store's own generation (bumped by the same reset, see onReset).
let generation = 0;

/** The one-time seed marker, on the same safe store: a marker that cannot be
 *  READ is treated as unknown and seeding is skipped for this run (as the
 *  best-effort read always did) — never as "not yet seeded". On disk it stays
 *  the legacy '1'. */
const seeded = createLocalStore<boolean>({
  key: SEED_KEY,
  empty: () => false,
  parse: (p) => p === 1 || p === '1' || p === true,
  serialize: (v) => (v ? '1' : null),
});

/** Set by the seed step; the re-keyed free topics are pushed to the server
 *  once the store is hydrated (owner 2026-08-10 v3 re-key fix). */
let migratedAtSeed = false;

const store = createLocalStore<EnrollTopic[]>({
  key: KEY,
  empty: () => [],
  parse: (parsed) => {
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((e) => e && typeof e.gs === 'number')
      .map((e) => ({ gs: e.gs as number, favorite: !!e.favorite, active: e.active !== false }));
  },
  // One-time seed of the FREE topics so everyone is already enrolled in them
  // (user request 2026-07-22). Idempotent via SEED_KEY. Runs before the store
  // is hydrated, so the first list anyone reads is the seeded one.
  prepare: async (loaded) => {
    await seeded.hydrate();
    if (!seeded.isHydrated() || seeded.get()) return loaded;
    // Migrate: drop retired free/placeholder gs (LEGACY_FREE_GS) so testers
    // don't keep stale unnamed rows — this is what clears the pre-v3
    // gs100/gs1240 that rendered as "Topic gsN".
    const before = loaded.length;
    let next = loaded.filter((e) => !LEGACY_FREE_GS.includes(e.gs));
    const have = new Set(next.map((e) => e.gs));
    // Prepend so the free topics are the FIRST two shown (user request).
    const freeAdd = FREE_ENROLL_GS.filter((gs) => !have.has(gs)).map((gs) => ({
      gs,
      favorite: false,
      active: true,
    }));
    next = [...freeAdd, ...next];
    migratedAtSeed = next.length !== before || freeAdd.length > 0;
    await seeded.set(true); // the marker first, then the list (the store writes it)
    return next;
  },
  onReset: () => {
    // Cancel any armed server sync FIRST (fix 2026-08-28). The debounced callback
    // reads the list at FIRE time and uses whatever session is current, and the
    // failure backoff can keep it armed for up to 30 s. Sign-out → sign-in
    // inside that window fired `sync_my_enrollments({ p_items: [] })` under the
    // NEW user and wiped THEIR enrollment master list — which the backend gates
    // v3 study/quiz on.
    if (syncTimer) clearTimeout(syncTimer);
    syncTimer = null;
    syncRetries = 0;
    // The next identity must reconcile against ITS OWN server list, not inherit
    // the departing user's "already checked".
    reconciled = false;
    migratedAtSeed = false;
    generation++;
  },
});

/** Is the local list still the untouched new-device default? */
function isPristineSeed(l: EnrollTopic[]): boolean {
  if (l.length === 0) return true;
  if (l.length !== FREE_ENROLL_GS.length) return false;
  return l.every((e) => FREE_ENROLL_GS.includes(e.gs) && !e.favorite && e.active);
}

/**
 * Read the server's list once per identity, BEFORE the first push.
 *
 * Deliberately defensive. There is no documented read path for this table, so a
 * missing policy or grant simply means the select errors — in which case this
 * does nothing at all and the behaviour is exactly what it was. If the read does
 * work, a reinstalling member gets their enrollments back.
 *
 * It adopts the server list ONLY when the device's list is still the untouched
 * seed. Anyone who has actually edited their enrollments on this phone is
 * holding the phone, and their intent wins.
 */
async function reconcileFromServer(gen: number): Promise<boolean> {
  if (reconciled) return false;
  try {
    const { data, error } = await supabase
      .from('user_topic_enrollments')
      .select('gs, favorite, active, position')
      .order('position', { ascending: true });
    // Wiped while reading (night bug pass 2, 2026-10-01): these are the
    // DEPARTING account's rows, and the reset's empty list reads as a
    // pristine seed — adopting them would hand them to the next account.
    if (gen !== generation) return false;
    if (error) {
      console.warn('[enrollment] could not read the server list:', error.message);
      return false;
    }
    const rows = (data ?? []) as { gs: number; favorite: boolean | null; active: boolean | null }[];
    // ZERO ROWS IS NOT AN ANSWER (corrected 2026-09-17 by a verification pass).
    //
    // `user_topic_enrollments` has NO SELECT grant to `anon` or
    // `authenticated`. ⛔ CORRECTED 2026-09-20 (probed live): a direct client
    // select on it returns **42501 permission denied** — an ERROR, not the
    // zero rows this comment used to claim, twice, as the stated reason the
    // push below is unconditional.
    //
    // The behaviour here is right either way, and deliberately so: a denial
    // and an empty result are BOTH treated as not-confirmed, because the
    // first version treated a denial as "the server has nothing to teach us",
    // returned, and let the push proceed — the exact overwrite this was
    // written to prevent. But the next person reasoning about whether the
    // client can ever read this list should start from the true premise.
    //
    // An empty result is therefore indistinguishable from a denial, and both are
    // treated as NOT CONFIRMED. Only rows we actually read count.
    if (rows.length === 0) return false;
    if (!isPristineSeed(store.get())) return true; // the user has edited this device's list

    const adopted = rows
      .filter((r) => typeof r.gs === 'number')
      .map((r) => ({ gs: r.gs, favorite: !!r.favorite, active: r.active !== false }));
    void store.set(adopted);
    return true;
  } catch (e) {
    console.warn('[enrollment] server list read threw:', (e as Error)?.message);
    return false;
  } finally {
    // Latched only AFTER the attempt, so a throw on the way in does not disable
    // the pull for the rest of the run — and never for the NEXT identity, which
    // resetLocal has just re-opened.
    if (gen === generation) reconciled = true;
  }
}
function scheduleServerSync(delayMs = 800) {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    // THE CALLBACK ALREADY RUNNING IS FENCED TOO (night bug pass 2,
    // 2026-10-01). resetLocal cancels an ARMED timer, but a callback already
    // past it kept going across the wipe: its push carried the reset's empty
    // list under whatever session was current by then, and its failure
    // branch re-armed the retry AFTER the reset — the 2026-08-28 hole (an
    // empty list pushed over the next account's master list) by a side door.
    const gen = generation;
    void (async () => {
      try {
        const { data } = await safeSession(supabase.auth.getSession(), 'enrollmentStore');
        if (gen !== generation) return;
        // Guests (incl. an anonymous device key) keep enrollment device-local:
        // syncing would write a master list for a uid deleted within the week.
        if (!isRealAccount(data.session)) return;
        // PULL FIRST, THEN PUSH REGARDLESS.
        //
        // ── WHY THERE IS NO "REFUSE TO PUSH" GUARD HERE ───────────────────
        //
        // I added one on 2026-09-17 — skip the push when the server list could
        // not be confirmed and this device holds only the default seed — to stop
        // a REINSTALL overwriting a member's master list. A regression review
        // the same night showed it was worse than the problem:
        //
        //   `sync_my_enrollments` is the ONLY writer of `user_topic_enrollments`
        //   in the entire repo, and a brand-new account's server list is
        //   legitimately empty, so it can never be "confirmed". The guard
        //   therefore never pushed for a new user — and `start_quiz_attempt`,
        //   `record_study_progress` and `credit_time_trial` all raise
        //   `not_enrolled` without a row. Every new and free-tier user would
        //   have been told "You are not enrolled in this course" on a topic the
        //   Dashboard showed as enrolled.
        //
        // Certain breakage for every new user is worse than a narrower loss that
        // the member can repair by re-adding topics from Browse. So the push is
        // unconditional again, and the reinstall case needs the fix it always
        // needed, which is on the SERVER: either `sync_my_enrollments` merges
        // rather than replaces, or the client is given a way to READ the list
        // (it currently cannot — the table has no SELECT grant to `anon` or
        // `authenticated`, so a client select returns 42501 permission denied;
        // corrected 2026-09-20, this used to say "zero rows rather than an
        // error". Either way the pull below is best-effort and never
        // load-bearing, because a denial and an empty result are both treated
        // as not-confirmed).
        //
        // BOUNDED (2026-09-17, pass 6). The pull is a convenience; the push is
        // the thing that matters. There is no request timeout anywhere in this
        // app, so awaiting an untimed select would park the push indefinitely —
        // the same hazard the exam-queue fix in this same batch argues against.
        // Four seconds, then go.
        await Promise.race([
          reconcileFromServer(gen),
          new Promise((r) => setTimeout(r, 4000)),
        ]);
        if (gen !== generation) return;
        // supabase-js RESOLVES with { error } — the old dead catch never saw RPC
        // errors, so a failed FINAL sync left the server master list stale with
        // no retry until the user next edited enrollment (backend gates v3
        // study/quiz on this list). Check error + re-arm a bounded backoff.
        const { error } = await supabase.rpc('sync_my_enrollments', {
          p_items: store.get().map((e, i) => ({ gs: e.gs, favorite: e.favorite, active: e.active, position: i })),
        });
        if (gen !== generation) return; // wiped meanwhile — never re-arm for the next account
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
        if (gen !== generation) return; // see the fence above
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

/** Load once (the shared store does the reading; see `prepare` for the seed).
 *  After a seed that changed the list, push the re-keyed free topics to the
 *  server so the corrected list is the one the backend gates on. */
async function hydrate(): Promise<void> {
  const gen = generation;
  await store.hydrate();
  if (gen === generation && store.isHydrated() && migratedAtSeed) {
    migratedAtSeed = false;
    scheduleServerSync();
  }
}

/**
 * Apply an edit to the STORED list and mirror it to the server.
 *
 * NO EDIT BEFORE THE STORED LIST HAS LANDED (full-app run 2, 2026-10-01).
 * Every mutator below computes its result from the list it is handed, and the
 * shared store hands it the HYDRATED list — queued until the read lands, and
 * dropped by an account wipe meanwhile. Before, an ENROLL tap on Awards or
 * Explore (neither mounts `useEnrollment`), or any tap in the moments after an
 * account switch, wrote a one-topic list over the learner's stored enrollment
 * and synced it upstream, where it gates study and quizzes. `edit` returns
 * null for "nothing to change".
 *
 * While the stored list cannot be READ, the edit stays queued (shown, not
 * written) and lands on the list the next successful read brings back; the
 * server mirror then follows on the next edit (the push is the whole list).
 */
function commit(edit: (list: EnrollTopic[]) => EnrollTopic[] | null): void {
  const gen = generation;
  let changed = false;
  void store
    .mutate((list) => {
      const next = edit(list);
      if (next == null) return list;
      changed = true;
      return next; // new identity so React snapshots update
    })
    .then(() => {
      if (changed && gen === generation) scheduleServerSync();
    });
}

export function getEnrollment(): EnrollTopic[] {
  void hydrate();
  return store.get();
}

export function isEnrolled(gs: number): boolean {
  return store.get().some((e) => e.gs === gs);
}

function additionsFor(list: EnrollTopic[], gsList: number[]): EnrollTopic[] {
  const have = new Set(list.map((e) => e.gs));
  const seen = new Set<number>();
  const additions: EnrollTopic[] = [];
  for (const gs of gsList) {
    if (have.has(gs) || seen.has(gs)) continue;
    seen.add(gs);
    additions.push({ gs, favorite: false, active: true });
  }
  return additions;
}

/** Add topics (gs) not already present, appended in order, active + unfavorited.
 *  Returns how many were newly added (against the list as shown now). */
export function addTopics(gsList: number[]): number {
  const count = additionsFor(store.get(), gsList).length;
  commit((list) => {
    const additions = additionsFor(list, gsList);
    return additions.length === 0 ? null : [...list, ...additions];
  });
  return count;
}

/** Bundle enrol (bug hunt 2026-09-29): add the NEW topics of a bundle
 *  UNLOADED (not on the Dashboard until LOAD) while leaving topics that were
 *  already enrolled exactly as they were. The old addTopics +
 *  setActiveMany(all, false) pair unloaded shared topics the user had loaded
 *  for another credential. Returns how many were newly added. */
export function addTopicsUnloaded(gsList: number[]): number {
  const count = freshGs(store.get().map((e) => e.gs), gsList).length;
  commit((list) => {
    const fresh = freshGs(list.map((e) => e.gs), gsList);
    return fresh.length === 0 ? null : [...list, ...fresh.map((gs) => ({ gs, favorite: false, active: false }))];
  });
  return count;
}

export function addTopic(gs: number): void {
  addTopics([gs]);
}

export function removeTopic(gs: number): void {
  commit((list) => (list.some((e) => e.gs === gs) ? list.filter((e) => e.gs !== gs) : null));
}

/** Self-heal (owner 2026-08-10): drop enrolled topics whose gs is NOT in `valid`
 *  — stale pre-v3 rows that no longer resolve to an active curriculum topic and
 *  would show as "Topic gsN". Commits (so it re-syncs the server) only when it
 *  actually removes something. NEVER runs against an empty `valid` set (that
 *  would be "curriculum still loading", not "everything is invalid"). */
export function pruneInvalidGs(valid: Set<number>): number {
  if (valid.size === 0) return 0;
  const shown = store.get();
  const removed = shown.length - shown.filter((e) => valid.has(e.gs)).length;
  commit((list) => {
    const next = list.filter((e) => valid.has(e.gs));
    return next.length === list.length ? null : next;
  });
  return removed;
}

/** Toggle membership — add if absent, remove if present (add-menu tap). */
export function toggleTopic(gs: number): void {
  commit((list) => (list.some((e) => e.gs === gs) ? list.filter((e) => e.gs !== gs) : [...list, { gs, favorite: false, active: true }]));
}

export function toggleFavorite(gs: number): void {
  commit((list) => list.map((e) => (e.gs === gs ? { ...e, favorite: !e.favorite } : e)));
}

export function toggleActive(gs: number): void {
  commit((list) => list.map((e) => (e.gs === gs ? { ...e, active: !e.active } : e)));
}

/** Bulk-set active on many topics (bundle LOAD/UNLOAD, user request 2026-07-22). */
export function setActiveMany(gsList: number[], active: boolean): void {
  const set = new Set(gsList);
  commit((list) => {
    let changed = false;
    const next = list.map((e) => {
      if (set.has(e.gs) && e.active !== active) {
        changed = true;
        return { ...e, active };
      }
      return e;
    });
    return changed ? next : null;
  });
}

/** STUDY NOW / any `focusGs` request: make sure `gs` is enrolled AND active so
 *  the Dashboard deck can receive it (see studyFocusAction). Waits for the
 *  stored list first — adding to an un-hydrated list would persist a
 *  one-topic list over the learner's real enrollment. */
export async function ensureStudyTopic(gs: number): Promise<void> {
  // …and the SAME identity's list (bug pass 1, 2026-10-01). An account wipe
  // (resetLocal) while this awaits makes the old hydrate return WITHOUT
  // hydrating; the list is then the reset's empty array, so the add below wrote
  // a one-topic list over the next account's stored enrollment (and pushed it
  // to their server master list). The armed focus re-asks on the next deck
  // change, so dropping this request loses nothing.
  const gen = generation;
  await hydrate();
  if (gen !== generation || !store.isHydrated()) return;
  const action = studyFocusAction(store.get(), gs);
  if (action === 'enroll') addTopics([gs]);
  else if (action === 'activate') setActiveMany([gs], true);
}

/** Reset the enrollment list to the NEW-USER DEFAULT (the seeded FREE topics).
 *  User PROGRESS is stored separately and is NOT touched — cleared topics can be
 *  re-added from the browse/add lists (user request 2026-07-25). */
export function resetEnrollment(): void {
  commit(() => FREE_ENROLL_GS.map((gs) => ({ gs, favorite: false, active: true })));
}

/** Reset the IN-MEMORY cache (account wipe / user switch). The shared store
 *  registers this reset with the wipe itself (its `onReset` cancels the armed
 *  server sync and re-opens the server reconcile for the next identity, and it
 *  re-hydrates for mounted hooks so they pick up the fresh, re-seeded list);
 *  kept exported for callers and tests. */
export function resetLocal(): void {
  store.reset();
  seeded.reset();
}

/** Move an entry up (-1) or down (+1) in the user's order. */
export function moveTopic(gs: number, dir: -1 | 1): void {
  commit((list) => {
    const i = list.findIndex((e) => e.gs === gs);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= list.length) return null;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    return next;
  });
}

/** Live view of the enrollment list (re-renders on any change, any screen). */
export function useEnrollment(): EnrollTopic[] {
  return store.use();
}
