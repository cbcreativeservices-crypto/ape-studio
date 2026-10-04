/**
 * Achievements data layer (v3) — the EARNED / trophy side of the app, distinct
 * from the browse/enroll side under `screens/awards`. Three categories:
 *   • Topics       — the 166 v3 topics, grouped Field → Subject, each overlaid
 *                    with the caller's per-topic award status.
 *   • Certificates — specialization certs the caller has been awarded.
 *   • Programs     — full program certs the caller has been awarded.
 *
 * RLS-scoped reads only; no DB changes. Topics reuse `fetchV3Curriculum()` for
 * the Field→Subject→Topic shape; earned certs/programs reuse
 * `fetchMyCredentials()` (credential_awards, revoked_at IS NULL). This replaces
 * the v1-coupled `fetchAchievements`/`fetchGallery` in `features/profile/api.ts`
 * (which joined the retired `courses` table).
 */
import { supabase } from '../../lib/supabase';
import {
  fetchV3CurriculumStrict,
  fetchV3CertsStrict,
  fetchV3ProgramsStrict,
  V3_CURRICULUM_VERSION_ID,
} from '../../data/v3Curriculum';
import { fetchMyCredentials, type EarnedCredentialRow } from '../credentials/api';
import { fetchAwardProgress } from '../awards/api';
import { topicImagePath } from '../../data/topicImages';

import { myUserRowOrThrow } from '../account/myUserRow';
import { safeSessionResult } from '../../lib/getSessionSafe';
export type TopicStatus = 'complete' | 'passed_incomplete' | 'unlocked' | 'locked';

export type TopicAchievement = {
  achievementId: string;
  gs: number;
  name: string;
  field: string;
  subject: string;
  iconUrl: string | null;
  status: TopicStatus;
  dateEarned: string | null;
};

export type SubjectGroup = {
  subject: string;
  topics: TopicAchievement[];
  earnedCount: number;
  totalCount: number;
};

export type FieldGroup = {
  field: string;
  subjects: SubjectGroup[];
  earnedCount: number;
  totalCount: number;
};

export type TopicAchievementData = {
  fields: FieldGroup[];
  earnedTotal: number;
  totalCount: number;
  /** All complete topics, newest-earned first — for the hub's recent strip. */
  recentEarned: TopicAchievement[];
};

/**
 * The caller's users.id: null ONLY when there is genuinely no session or no
 * row (a guest). A failed or stalled read THROWS (evening hunt 2026-10-02).
 * The lenient `myUserId()` this used answers null for a dropped read too, so a
 * signed-in member on a bad connection took the GUEST branch below: every
 * topic `locked`, "0 / 166" and an empty gallery, stated as fact — and, on a
 * refocus, written over the trophies already on screen, because the screens
 * keep what they show only when the load REJECTS.
 */
async function internalUserId(): Promise<string | null> {
  const row = await myUserRowOrThrow<{ id: string }>('id');
  return row?.id ?? null;
}

/* ── SHARED READS (perf hunt 2026-10-03) ─────────────────────────────────
 *
 * The Trophy Case hub reads the topic overlay and the earned credentials;
 * tapping TOPICS, CERTIFICATES or PROGRAMS then read them ALL AGAIN from
 * scratch — and a Certificates wall read the earned credentials twice at once
 * (its list + its NEXT UP slot). So every drill-in sat on a blank list for the
 * same round trips the hub had just made.
 *
 * `shared()` lets callers reuse a read that is IN FLIGHT or that STARTED in
 * the last RECENT_MS, for the SAME signed-in identity:
 *  • keyed by the auth user id, so another account never sees this one's;
 *  • a FAILED read is dropped at once, so Retry always goes to the server
 *    (and a failure is never served as an answer — three faces unchanged);
 *  • short: a drill-in a moment after the hub, never a cache that outlives a
 *    quiz. Nothing in the Trophy Case can earn anything inside that window.
 * The screens' own newest-load-wins tickets are untouched.
 */
const RECENT_MS = 8_000;
type Slot<T> = { cur: { key: string; at: number; p: Promise<T> } | null };
const topicSlot: Slot<TopicAchievementData> = { cur: null };
const gallerySlot: Slot<GalleryEntry[]> = { cur: null };
const credsSlot: Slot<EarnedCredentialRow[]> = { cur: null };
const nearestSlots: Record<'certificate' | 'program', Slot<NearestCredentialResult>> = {
  certificate: { cur: null },
  program: { cur: null },
};

/** Whose reads these are: the auth uid, 'guest' with no session, or null when
 *  the session itself could not be read (then nothing is shared).
 *
 *  ⛔ UNKNOWN IS NOT 'guest' (hunt 12, 2026-10-04 — K1, the house
 *  `safeSessionResult`). The hand-rolled read here caught a stall or a
 *  rejection, but an expired token on a dead connection RESOLVES as
 *  `{ session: null, error: AuthRetryableFetchError }` with the session still
 *  stored — and that keyed a signed-in member's reads as the GUEST's. */
async function identityKey(): Promise<string | null> {
  try {
    const { result, timedOut } = await safeSessionResult(supabase.auth.getSession(), 'achievements identity');
    if (timedOut) return null;
    return result.data?.session?.user?.id ?? 'guest';
  } catch {
    return null;
  }
}

async function shared<T>(slot: Slot<T>, read: () => Promise<T>): Promise<T> {
  const key = await identityKey();
  if (key == null) return read();
  const hit = slot.cur;
  if (hit && hit.key === key && Date.now() - hit.at < RECENT_MS) return hit.p;
  const entry = { key, at: Date.now(), p: read() };
  slot.cur = entry;
  entry.p.catch(() => {
    if (slot.cur === entry) slot.cur = null;
  });
  return entry.p;
}

/** The earned credentials, shared across this module's readers (see above). */
function myCredentialsShared(): Promise<EarnedCredentialRow[]> {
  return shared(credsSlot, fetchMyCredentials);
}

/**
 * Warm the reads a Trophy Case drill-in is about to make — called on PRESS-IN
 * of the hub's cards and the Topics screen's gallery link, so the next screen
 * finds them in flight (or done). Fire-and-forget: a failure here is dropped
 * and the screen's own read reports it.
 */
export function prefetchTrophyCase(target: 'topics' | 'certificate' | 'program' | 'gallery'): void {
  const quiet = (p: Promise<unknown>) => void p.catch(() => {});
  if (target === 'topics') quiet(fetchTopicAchievementsShared());
  else if (target === 'gallery') quiet(fetchGalleryV3Shared());
  else {
    quiet(fetchEarnedCredentialsByType(target));
    quiet(fetchNearestCredentialShared(target));
  }
}

/**
 * The whole v3 topic curriculum grouped Field → Subject, overlaid with the
 * caller's per-topic status. A guest / unlinked account still gets the full
 * structure with every topic `locked` (an honest "nothing earned yet" grid).
 */
export function fetchTopicAchievementsShared(): Promise<TopicAchievementData> {
  return shared(topicSlot, fetchTopicAchievements);
}

export async function fetchTopicAchievements(): Promise<TopicAchievementData> {
  /** The caller's progress rows, or null for a guest. Throws on a failed read
   *  (see the ⛔ note below). */
  const readMyProgressRows = async () => {
    const userId = await internalUserId();
    if (!userId) return null;
    const { data: prog, error } = await supabase
      .from('student_achievement_progress')
      .select('achievement_id, status, date_earned')
      .eq('user_id', userId);
    if (error) throw error;
    return (prog ?? []) as { achievement_id: string; status: string; date_earned: string | null }[];
  };
  // STRICT curriculum (evening hunt 2026-10-02): the lenient read resolves `[]`
  // on failure, which drew an empty Trophy Case — "0 / 0", no subjects — as a
  // fact instead of reaching the screens' error + Retry.
  //
  // The progress read rides ALONGSIDE the curriculum (perf hunt 2026-10-03):
  // it used to wait for both the curriculum and the identity read, so a first
  // open of the Trophy Case paid curriculum + progress in series. Now it is
  // max(curriculum, identity → progress).
  const [fieldsRaw, progRows] = await Promise.all([fetchV3CurriculumStrict(), readMyProgressRows()]);

  const statusById = new Map<string, { status: TopicStatus; dateEarned: string | null }>();
  if (progRows) {
    /**
     * ⛔ Surface the failure. supabase-js RESOLVES with `{ data: null, error }`
     * on an RLS denial or a PostgREST error, so dropping `error` left
     * `statusById` empty, every topic falling to `'locked'`, and `earnedTotal`
     * at 0 — and BOTH consumers' error states became unreachable
     * (`TopicsScreen.tsx:64`, `AchievementsHomeScreen.tsx:81` each have a
     * `.catch` that could never fire). A member with forty trophies was told,
     * as a fact with no error and no retry, "0 / 166".
     *
     * The doc comment above promises a locked grid for a GUEST, which is
     * honest — that branch is the `userId == null` one. The same grid for a
     * signed-in member whose read failed is not. `fetchGalleryV3` twelve lines
     * below already throws for exactly this reason; this site was missed.
     * (overnight hunt 2026-09-23)
     */
    for (const p of progRows) {
      statusById.set(p.achievement_id, {
        status: (p.status as TopicStatus) ?? 'locked',
        dateEarned: p.date_earned ?? null,
      });
    }
  }

  let earnedTotal = 0;
  let totalCount = 0;
  const recentEarned: TopicAchievement[] = [];

  const fields: FieldGroup[] = fieldsRaw.map((f) => {
    let fieldEarned = 0;
    let fieldTotal = 0;
    const subjects: SubjectGroup[] = f.subjects.map((s) => {
      let subjectEarned = 0;
      const topics: TopicAchievement[] = s.topics.map((t) => {
        const pr = statusById.get(t.achievementId);
        const status: TopicStatus = pr?.status ?? 'locked';
        const dateEarned = pr?.dateEarned ?? null;
        const ta: TopicAchievement = {
          achievementId: t.achievementId,
          gs: t.gs,
          name: t.name,
          field: f.field,
          subject: s.subject,
          // Per-topic tile image (topic-tiles bucket) replaces the old trophy
          // icon; falls back to any legacy icon_url until the object exists.
          iconUrl: topicImagePath(t.gs) ?? t.iconUrl,
          status,
          dateEarned,
        };
        if (status === 'complete') {
          subjectEarned++;
          recentEarned.push(ta);
        }
        return ta;
      });
      fieldEarned += subjectEarned;
      fieldTotal += topics.length;
      return { subject: s.subject, topics, earnedCount: subjectEarned, totalCount: topics.length };
    });
    earnedTotal += fieldEarned;
    totalCount += fieldTotal;
    return { field: f.field, subjects, earnedCount: fieldEarned, totalCount: fieldTotal };
  });

  recentEarned.sort((a, b) => {
    const ta = a.dateEarned ? Date.parse(a.dateEarned) : -Infinity;
    const tb = b.dateEarned ? Date.parse(b.dateEarned) : -Infinity;
    return tb - ta;
  });

  return { fields, earnedTotal, totalCount, recentEarned };
}

export type GalleryEntry = {
  achievementId: string;
  name: string;
  subject: string;
  iconUrl: string | null;
  dateEarned: string;
};

/** Earned topic trophies, newest first — the chronological "everything earned"
 *  wall. v3-scoped (replaces the v1 `courses`-joined fetchGallery). */
export function fetchGalleryV3Shared(): Promise<GalleryEntry[]> {
  return shared(gallerySlot, fetchGalleryV3);
}

export async function fetchGalleryV3(): Promise<GalleryEntry[]> {
  const userId = await internalUserId();
  if (!userId) return [];
  const { data, error } = await supabase
    .from('student_achievement_progress')
    .select('achievement_id, date_earned, achievements!inner(name, icon_url, subject, global_sequence, curriculum_version_id)')
    .eq('user_id', userId)
    .eq('status', 'complete')
    .not('date_earned', 'is', null)
    .eq('achievements.curriculum_version_id', V3_CURRICULUM_VERSION_ID)
    .order('date_earned', { ascending: false });
  // Surface a read failure rather than swallowing it as an empty gallery: a
  // rejection lets GalleryScreen show its error+retry card instead of telling a
  // member who has earned trophies "Earn your first trophy to see it here"
  // (the error-vs-empty class the launch audit fixed on the sibling screens).
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    achievementId: r.achievement_id,
    name: r.achievements.name,
    subject: r.achievements.subject ?? '',
    // Per-topic tile image (topic-tiles bucket); legacy icon_url is the fallback.
    iconUrl: topicImagePath(r.achievements.global_sequence) ?? r.achievements.icon_url ?? null,
    dateEarned: r.date_earned,
  }));
}

/** Earned credentials of one type (certificate | program), newest first. */
export async function fetchEarnedCredentialsByType(
  type: 'certificate' | 'program',
): Promise<EarnedCredentialRow[]> {
  const all = await myCredentialsShared();
  return all.filter((c) => c.type === type);
}

export type HubData = {
  topics: { earned: number; total: number; recent: TopicAchievement[] };
  certificates: { earned: number; recent: EarnedCredentialRow[] };
  programs: { earned: number; recent: EarnedCredentialRow[] };
};

/** Everything the Trophy Case hub needs, in one call (fans out internally). */
export async function fetchAchievementsHub(): Promise<HubData> {
  const [topicData, creds] = await Promise.all([fetchTopicAchievementsShared(), myCredentialsShared()]);
  const certs = creds.filter((c) => c.type === 'certificate');
  const progs = creds.filter((c) => c.type === 'program');
  return {
    topics: { earned: topicData.earnedTotal, total: topicData.totalCount, recent: topicData.recentEarned.slice(0, 5) },
    certificates: { earned: certs.length, recent: certs.slice(0, 5) },
    programs: { earned: progs.length, recent: progs.slice(0, 5) },
  };
}

/** The credential to show in the "waiting slot" at the top of a Certificates /
 *  Programs list: the not-yet-earned credential the user is closest to
 *  completing, or a terminal state. Composes existing frozen-backend reads only
 *  (no new RPC surface); ranks in memory, then refines the ONE winner's numbers
 *  with the server's exact rule (award_required_topics unions the co-reqs). */
export type NearestCredentialResult =
  | { kind: 'candidate'; id: string; slug: string | null; name: string; completeCount: number; totalCount: number }
  | { kind: 'all_earned' }
  | { kind: 'none_published' };

export function fetchNearestCredentialShared(type: 'certificate' | 'program'): Promise<NearestCredentialResult> {
  return shared(nearestSlots[type], () => fetchNearestCredential(type));
}

export async function fetchNearestCredential(
  type: 'certificate' | 'program',
): Promise<NearestCredentialResult> {
  const [catalog, earned, topicData] = await Promise.all([
    // STRICT (2026-09-17). The lenient variants resolve to `[]` on any failure,
    // and an empty catalog here returns `none_published` — which the wall renders
    // as "COMING SOON — No certificates available yet". So an outage read as a
    // product decision, and the caller's own error branch was unreachable.
    type === 'certificate' ? fetchV3CertsStrict() : fetchV3ProgramsStrict(),
    myCredentialsShared(),
    fetchTopicAchievementsShared(),
  ]);
  if (catalog.length === 0) return { kind: 'none_published' };

  const earnedIds = new Set(earned.filter((c) => c.type === type).map((c) => c.id));
  const completedGs = new Set(
    topicData.fields
      .flatMap((f) => f.subjects.flatMap((s) => s.topics))
      .filter((t) => t.status === 'complete')
      .map((t) => t.gs),
  );

  const candidates = catalog.filter((c) => !earnedIds.has(c.id));
  if (candidates.length === 0) return { kind: 'all_earned' };

  // Rank in memory by the credential's OWN topics complete-ratio (good enough
  // to pick the nearest); the winner's exact numbers come from the server rule.
  const ranked = candidates
    .map((c) => ({ c, done: c.topicsGs.filter((gs) => completedGs.has(gs)).length }))
    .sort(
      (a, b) =>
        b.done / Math.max(1, b.c.topicsGs.length) - a.done / Math.max(1, a.c.topicsGs.length) ||
        b.done - a.done,
      // No alphabetical tiebreak: with equal progress the stable sort keeps the
      // catalog's own `sequence` order, so a new user's NEXT UP is the first
      // credential the catalog presents — not "Ableton Live Specialist" because
      // it sorts first by letter (Bug+Hater night A1-05).
    );
  const top = ranked[0];

  const exact = await fetchAwardProgress(type, top.c.id);
  /**
   * ⛔ A FAILED EXACT READ IS NOT THE CATALOG COUNT (deep-dive A, 2026-10-03).
   * fetchAwardProgress answers null for a guest AND for a read that failed.
   * The catalog fallback counts only the credential's own topics — not the
   * four standing requirements award_required_topics unions in — so a member
   * whose read dropped was shown a full ring and "12 of 12 topics complete"
   * for a credential whose exam is still locked. For a signed-in account,
   * null is a failure: throw, and the wall draws its NEXT UP retry (D51).
   * The guest keeps the catalog count (the RPC is not granted to anon).
   */
  if (exact == null) {
    const me = await myUserRowOrThrow<{ id: string }>('id');
    if (me?.id) throw new Error('award progress unreadable');
  }
  return {
    kind: 'candidate',
    id: top.c.id,
    slug: top.c.slug,
    name: top.c.name,
    completeCount: exact?.completeCount ?? top.done,
    totalCount: exact?.totalCount ?? top.c.topicsGs.length,
  };
}
