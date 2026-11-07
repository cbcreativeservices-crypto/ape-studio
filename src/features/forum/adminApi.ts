/**
 * The owner's forum queue. Nothing here is the enforcement: every forum_admin_*
 * function re-checks `is_admin()` in the database and refuses with "not
 * permitted", so hiding the screen is a courtesy, not a control. A refusal is
 * its own face: it is never shown as an empty queue.
 *
 * Suspensions and bans stay with the existing `account_set_standing`
 * (setAccountStanding): the AI never confirms a ban, and neither does this file.
 */
import { supabase } from '../../lib/supabase';
import { setAccountStanding } from '../moderation/api';
import { sampleForumOn, sampleState } from './sampleSwitch.ts';
import type { ForumResult, ForumTopic, TopicKind, TrackedStatus } from './types.ts';
import { topicOf } from './mappers.ts';
import {
  ADMIN_NOT_PERMITTED,
  ADMIN_UNREADABLE,
  adminAppealOf,
  adminError,
  queueItemOf,
  type AdminAppeal,
  type QueueItem,
} from './adminRows.ts';

export type { AdminAppeal, QueueItem };

const data = () => require('./sampleData') as typeof import('./sampleData');

export type AiUsage = { calls: number; costUsd: number; capUsd: number; capHitAt: string | null };

export type QueueDecision = 'dismiss' | 'confirm' | 'restore' | 'hide' | 'delete' | 'suspended' | 'banned' | 'noted';
export type PostAction = 'restore' | 'hide' | 'hold' | 'please_edit' | 'delete';
export type UserAction = 'warn' | 'mute' | 'unmute';

async function sampleAdmin<T>(value: () => T): Promise<ForumResult<T>> {
  const face = sampleState()?.face;
  if (face === 'loading') await new Promise(() => {});
  if (face === 'unreadable') return { ok: false, error: ADMIN_UNREADABLE, code: null };
  if (face === 'closed') return { ok: false, error: ADMIN_NOT_PERMITTED, code: 'not_permitted' };
  return { ok: true, value: value() };
}

async function adminRpc<T>(fn: string, args: Record<string, unknown> | undefined, map: (raw: unknown) => T): Promise<ForumResult<T>> {
  try {
    const { data: raw, error } = await supabase.rpc(fn as never, args as never);
    if (error) return { ok: false, ...adminError(error.message) };
    return { ok: true, value: map(raw) };
  } catch (e) {
    return { ok: false, ...adminError(e instanceof Error ? e.message : null) };
  }
}

type Row = Record<string, unknown>;
const str = (v: unknown): string | null => (typeof v === 'string' && v ? v : null);
const list = <T,>(map: (r: Row) => T) => (raw: unknown): T[] => (Array.isArray(raw) ? (raw as Row[]).map(map) : []);

export async function fetchQueue(): Promise<ForumResult<QueueItem[]>> {
  if (sampleForumOn()) return sampleAdmin(() => data().sampleQueue());
  return adminRpc('forum_admin_queue', { p_limit: 100 }, list(queueItemOf));
}

export async function fetchAppeals(): Promise<ForumResult<AdminAppeal[]>> {
  if (sampleForumOn()) return sampleAdmin(() => data().sampleAdminAppeals());
  return adminRpc('forum_admin_appeals', { p_status: 'open' }, list(adminAppealOf));
}

/** This month's row, or null when nothing has been recorded. */
export async function fetchAiUsage(): Promise<ForumResult<AiUsage | null>> {
  if (sampleForumOn()) return sampleAdmin(() => data().sampleAiUsage());
  return adminRpc('forum_admin_ai_usage', undefined, (raw) => {
    const r = (Array.isArray(raw) ? raw[0] : raw) as Row | undefined;
    if (!r) return null;
    return {
      calls: Number(r.calls ?? 0),
      costUsd: Number(r.cost_usd ?? 0),
      capUsd: Number(r.cap_usd ?? 0),
      capHitAt: str(r.cap_hit_at),
    };
  });
}

/** Ideas, corrections and bugs: what a status can be set on. */
export async function fetchTracked(): Promise<ForumResult<ForumTopic[]>> {
  if (sampleForumOn()) return sampleAdmin(() => data().sampleTracked());
  const lists = await Promise.all(
    ['ideas-requests', 'glossary-corrections', 'bug-reports'].map((slug) =>
      adminRpc('forum_topics_list', { p_category: slug, p_sort: 'latest', p_limit: 50, p_offset: 0 }, (raw) =>
        Array.isArray(raw) ? raw.map(topicOf) : [],
      ),
    ),
  );
  const bad = lists.find((l) => !l.ok);
  if (bad && !bad.ok) return bad;
  return { ok: true, value: lists.flatMap((l) => (l.ok ? l.value : [])) };
}

const writeOk = (): true => true;

export async function decideQueueItem(logId: number, decision: QueueDecision, note?: string): Promise<ForumResult<true>> {
  if (sampleForumOn()) return { ok: true, value: data().sampleDecide(logId) };
  return adminRpc('forum_admin_decide', { p_log_id: logId, p_decision: decision, p_note: note ?? null }, writeOk);
}

export async function actOnPost(postId: string, action: PostAction, reason?: string): Promise<ForumResult<true>> {
  if (sampleForumOn()) return { ok: true, value: true };
  return adminRpc('forum_admin_post_action', { p_post_id: postId, p_action: action, p_reason: reason ?? null }, writeOk);
}

export async function actOnUser(user: string, action: UserAction, hours: number, reason?: string): Promise<ForumResult<true>> {
  if (sampleForumOn()) return { ok: true, value: true };
  return adminRpc(
    'forum_admin_user_action',
    { p_user: user, p_action: action, p_hours: hours, p_reason: reason ?? null },
    writeOk,
  );
}

export async function decideAppeal(id: string, outcome: 'upheld' | 'overturned', note?: string): Promise<ForumResult<true>> {
  if (sampleForumOn()) return { ok: true, value: data().sampleDecideAppeal(id) };
  return adminRpc('forum_admin_appeal_decide', { p_appeal_id: id, p_outcome: outcome, p_note: note ?? null }, writeOk);
}

export async function setTrackedStatus(topicId: string, status: TrackedStatus, reason?: string): Promise<ForumResult<true>> {
  if (sampleForumOn()) return { ok: true, value: data().sampleSetStatus(topicId, status, reason ?? null) };
  return adminRpc('forum_admin_set_tracked_status', { p_topic_id: topicId, p_status: status, p_reason: reason ?? null }, writeOk);
}

export async function setTopicFlags(topicId: string, flags: { pinned?: boolean; locked?: boolean }): Promise<ForumResult<true>> {
  if (sampleForumOn()) return { ok: true, value: data().sampleTopicFlags(topicId, flags) };
  return adminRpc(
    'forum_admin_topic_flags',
    { p_topic_id: topicId, p_pinned: flags.pinned ?? null, p_locked: flags.locked ?? null },
    writeOk,
  );
}

/** Suspend or ban: the existing standing call, always from the owner's hand. */
export async function setMemberStanding(
  user: string,
  status: 'suspended' | 'banned',
  days: number | undefined,
  reason: string,
): Promise<ForumResult<true>> {
  if (sampleForumOn()) return { ok: true, value: true };
  const r = await setAccountStanding({
    userId: user,
    status,
    until: days ? new Date(Date.now() + days * 86400_000).toISOString() : null,
    reason,
  });
  return r.ok ? { ok: true, value: true } : { ok: false, error: r.error ?? ADMIN_UNREADABLE, code: null };
}

/** Whether to draw the admin rows in a thread. A courtesy: the server decides. */
export async function amIForumAdmin(): Promise<boolean> {
  if (sampleForumOn()) return sampleState()?.admin === true;
  try {
    const { data: raw, error } = await supabase.rpc('is_admin');
    return !error && raw === true;
  } catch {
    return false;
  }
}

export type { TopicKind };
