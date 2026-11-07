/**
 * The owner's queue rows, as the app's types. Pure, so what an odd row becomes
 * is tested. Only adminApi.ts calls these.
 */
import { authorOf } from './mappers.ts';
import type { ForumAuthor } from './types.ts';

type Row = Record<string, unknown>;
const str = (v: unknown): string | null => (typeof v === 'string' && v ? v : null);

export type QueueItem = {
  logId: number;
  createdAt: string;
  mode: string;
  action: string;
  actor: string;
  rule: string | null;
  reason: string | null;
  excerpt: string | null;
  urgentCategory: string | null;
  recommendation: string | null;
  postId: string | null;
  topicId: string | null;
  topicTitle: string | null;
  postBody: string | null;
  postState: string | null;
  author: ForumAuthor | null;
  targetUser: string | null;
  openReports: number;
  openAppealId: string | null;
};

export type AdminAppeal = {
  appealId: string;
  postId: string;
  topicId: string | null;
  member: ForumAuthor | null;
  reason: string;
  status: string;
  postBody: string | null;
  modRule: string | null;
  modReason: string | null;
  recommendation: string | null;
  createdAt: string;
};

export function queueItemOf(r: Row): QueueItem {
  return {
    logId: Number(r.log_id),
    createdAt: String(r.created_at ?? ''),
    mode: String(r.mode ?? ''),
    action: String(r.action ?? ''),
    actor: String(r.actor ?? ''),
    rule: str(r.rule),
    reason: str(r.reason),
    excerpt: str(r.excerpt),
    urgentCategory: str(r.urgent_category),
    recommendation: str(r.recommendation),
    postId: str(r.post_id),
    topicId: str(r.topic_id),
    topicTitle: str(r.topic_title),
    postBody: str(r.post_body),
    postState: str(r.post_state),
    author: r.author ? authorOf(r.author) : null,
    targetUser: str(r.target_user),
    openReports: Number(r.open_reports ?? 0),
    openAppealId: str(r.open_appeal_id),
  };
}

export function adminAppealOf(r: Row): AdminAppeal {
  return {
    appealId: String(r.appeal_id ?? ''),
    postId: String(r.post_id ?? ''),
    topicId: str(r.topic_id),
    member: r.member ? authorOf(r.member) : null,
    reason: String(r.reason ?? ''),
    status: String(r.status ?? ''),
    postBody: str(r.post_body),
    modRule: str(r.mod_rule),
    modReason: str(r.mod_reason),
    recommendation: str(r.recommendation),
    createdAt: String(r.created_at ?? ''),
  };
}

export const ADMIN_NOT_PERMITTED = 'This queue is for the owner.';
export const ADMIN_UNREADABLE = 'Could not read the queue. Check your connection and try again.';

/** The refusal is a fact about the account, not about the network. */
export function adminError(message: string | null | undefined): { error: string; code: string | null } {
  return /not permitted|permission denied/i.test(message ?? '')
    ? { error: ADMIN_NOT_PERMITTED, code: 'not_permitted' }
    : { error: ADMIN_UNREADABLE, code: null };
}
