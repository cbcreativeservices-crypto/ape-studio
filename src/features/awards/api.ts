/**
 * Award progress + credential reads (R6b, A4).
 *
 * The server owns the rules; this layer only assembles what the screen shows.
 * Shapes verified against the live DB 2026-08-28:
 *   • award_required_topics(p_award_type, p_award_id) → TABLE(achievement_id uuid)
 *     Returns BARE IDS ONLY. It already UNIONs the award's own topics with
 *     award_standing_requirements (Safety 3060, Grounding 3070, Workplace 4370,
 *     Audio Fundamentals Lab 3081) for the ACTIVE curriculum version, so the
 *     client must NOT add the universal four itself — it would double-count.
 *   • award_complete(p_user, p_award_type, p_award_id) → boolean, where p_user
 *     is the INTERNAL users.id (it joins student_achievement_progress), not the
 *     auth uid. We derive the same answer from the statuses we already fetch
 *     rather than paying a fourth round trip; start_final_exam re-checks
 *     server-side regardless, so the UI gate is a convenience, never the rule.
 *   • credential_awards rows carry revoked_at — a live credential is one whose
 *     revoked_at IS NULL.
 */
import { supabase } from '../../lib/supabase';
import type { AwardType } from '../finalExam/api';

export type RequiredTopic = {
  achievementId: string;
  gs: number | null;
  name: string;
  status: string;
  complete: boolean;
};

export type EarnedCredential = {
  earnedAt: string | null;
  issuedAt: string | null;
  source: string | null;
};

export type AwardProgress = {
  topics: RequiredTopic[];
  completeCount: number;
  totalCount: number;
  allComplete: boolean;
  credential: EarnedCredential | null;
};

/** Internal users.id for the signed-in account (RLS scopes this to the caller). */
async function internalUserId(): Promise<string | null> {
  const { data } = await supabase.from('users').select('id').single();
  return (data as { id?: string } | null)?.id ?? null;
}

/**
 * Everything the award screen needs, in three round trips. Returns null only
 * when the account isn't linked to a student record — callers render an honest
 * empty state rather than an implied "0 complete".
 */
export async function fetchAwardProgress(
  awardType: AwardType,
  awardId: string,
): Promise<AwardProgress | null> {
  const userId = await internalUserId();
  if (!userId) return null;

  const { data: reqRows, error: reqErr } = await supabase.rpc('award_required_topics', {
    p_award_type: awardType,
    p_award_id: awardId,
  });
  if (reqErr) {
    console.warn('[awards] award_required_topics failed:', reqErr.message);
    return null;
  }
  const ids = ((reqRows ?? []) as { achievement_id: string }[]).map((r) => r.achievement_id);
  if (ids.length === 0) {
    return { topics: [], completeCount: 0, totalCount: 0, allComplete: false, credential: null };
  }

  const [{ data: achRows }, { data: progRows }, { data: credRows }] = await Promise.all([
    supabase.from('achievements').select('id, name, global_sequence').in('id', ids),
    supabase
      .from('student_achievement_progress')
      .select('achievement_id, status')
      .eq('user_id', userId)
      .in('achievement_id', ids),
    supabase
      .from('credential_awards')
      .select('earned_at, issued_at, source, revoked_at')
      .eq('user_id', userId)
      .eq('credential_type', awardType)
      .eq('credential_id', awardId)
      .is('revoked_at', null)
      .limit(1),
  ]);

  const nameById = new Map<string, { name: string; gs: number | null }>();
  for (const a of (achRows ?? []) as any[]) {
    nameById.set(a.id as string, { name: (a.name as string) ?? 'Untitled topic', gs: (a.global_sequence as number) ?? null });
  }
  const statusById = new Map<string, string>();
  for (const p of (progRows ?? []) as any[]) {
    statusById.set(p.achievement_id as string, (p.status as string) ?? '');
  }

  const topics: RequiredTopic[] = ids.map((id) => {
    const meta = nameById.get(id);
    const status = statusById.get(id) ?? 'not_started';
    return {
      achievementId: id,
      gs: meta?.gs ?? null,
      name: meta?.name ?? 'Untitled topic',
      status,
      complete: status === 'complete',
    };
  });

  // Stable, readable order: incomplete first (what the student must act on),
  // then by global sequence within each group.
  topics.sort((a, b) => {
    if (a.complete !== b.complete) return a.complete ? 1 : -1;
    return (a.gs ?? 1e9) - (b.gs ?? 1e9);
  });

  const completeCount = topics.filter((t) => t.complete).length;
  const credRow = ((credRows ?? []) as any[])[0];

  return {
    topics,
    completeCount,
    totalCount: topics.length,
    allComplete: topics.length > 0 && completeCount === topics.length,
    credential: credRow
      ? {
          earnedAt: (credRow.earned_at as string) ?? null,
          issuedAt: (credRow.issued_at as string) ?? null,
          source: (credRow.source as string) ?? null,
        }
      : null,
  };
}
