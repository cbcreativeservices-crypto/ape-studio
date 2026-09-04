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
import { fetchV3Curriculum, fetchV3Certs, fetchV3Programs, V3_CURRICULUM_VERSION_ID } from '../../data/v3Curriculum';
import { fetchMyCredentials, type EarnedCredentialRow } from '../credentials/api';
import { fetchAwardProgress } from '../awards/api';

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

async function internalUserId(): Promise<string | null> {
  try {
    const { data } = await supabase.from('users').select('id').single();
    return (data as { id?: string } | null)?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * The whole v3 topic curriculum grouped Field → Subject, overlaid with the
 * caller's per-topic status. A guest / unlinked account still gets the full
 * structure with every topic `locked` (an honest "nothing earned yet" grid).
 */
export async function fetchTopicAchievements(): Promise<TopicAchievementData> {
  const [fieldsRaw, userId] = await Promise.all([fetchV3Curriculum(), internalUserId()]);

  const statusById = new Map<string, { status: TopicStatus; dateEarned: string | null }>();
  if (userId) {
    const { data: prog } = await supabase
      .from('student_achievement_progress')
      .select('achievement_id, status, date_earned')
      .eq('user_id', userId);
    for (const p of (prog ?? []) as { achievement_id: string; status: string; date_earned: string | null }[]) {
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
          iconUrl: t.iconUrl,
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
export async function fetchGalleryV3(): Promise<GalleryEntry[]> {
  const userId = await internalUserId();
  if (!userId) return [];
  const { data, error } = await supabase
    .from('student_achievement_progress')
    .select('achievement_id, date_earned, achievements!inner(name, icon_url, subject, curriculum_version_id)')
    .eq('user_id', userId)
    .eq('status', 'complete')
    .not('date_earned', 'is', null)
    .eq('achievements.curriculum_version_id', V3_CURRICULUM_VERSION_ID)
    .order('date_earned', { ascending: false });
  if (error) return [];
  return (data ?? []).map((r: any) => ({
    achievementId: r.achievement_id,
    name: r.achievements.name,
    subject: r.achievements.subject ?? '',
    iconUrl: r.achievements.icon_url ?? null,
    dateEarned: r.date_earned,
  }));
}

/** Earned credentials of one type (certificate | program), newest first. */
export async function fetchEarnedCredentialsByType(
  type: 'certificate' | 'program',
): Promise<EarnedCredentialRow[]> {
  const all = await fetchMyCredentials();
  return all.filter((c) => c.type === type);
}

export type HubData = {
  topics: { earned: number; total: number; recent: TopicAchievement[] };
  certificates: { earned: number; recent: EarnedCredentialRow[] };
  programs: { earned: number; recent: EarnedCredentialRow[] };
};

/** Everything the Trophy Case hub needs, in one call (fans out internally). */
export async function fetchAchievementsHub(): Promise<HubData> {
  const [topicData, creds] = await Promise.all([fetchTopicAchievements(), fetchMyCredentials()]);
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

export async function fetchNearestCredential(
  type: 'certificate' | 'program',
): Promise<NearestCredentialResult> {
  const [catalog, earned, topicData] = await Promise.all([
    type === 'certificate' ? fetchV3Certs() : fetchV3Programs(),
    fetchMyCredentials(),
    fetchTopicAchievements(),
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
        b.done - a.done ||
        a.c.name.localeCompare(b.c.name),
    );
  const top = ranked[0];

  const exact = await fetchAwardProgress(type, top.c.id);
  return {
    kind: 'candidate',
    id: top.c.id,
    slug: top.c.slug,
    name: top.c.name,
    completeCount: exact?.completeCount ?? top.done,
    totalCount: exact?.totalCount ?? top.c.topicsGs.length,
  };
}
