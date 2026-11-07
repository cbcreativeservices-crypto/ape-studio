/**
 * Audio Community Forum: the whole client/server contract in one place.
 *
 * EVERY call is an RPC on the one Supabase client, except the two that post:
 * those go through the `forum-moderate` edge function, which runs
 * `forum_post_submit` as the member and then the real-time check in the same
 * round trip. The rules live in the database, so a client that skips a screen
 * still cannot skip a rule.
 *
 * A failed read answers `{ ok: false }`, never an empty list, so a screen can
 * show its three faces (loading / UNREADABLE / truly empty). "Done" and "saved"
 * only ever come from a write's answer.
 *
 * While the dev sample is on (sampleSwitch.ts) every call here answers from
 * sampleData.ts. That module is required behind the switch, so a release build
 * never evaluates it.
 */
import { supabase } from '../../lib/supabase';
import { withDeadline } from '../../lib/boundedCall';
import { blockMember } from '../directory/api';
import { FORUM_CLOSED, FORUM_UNREADABLE, PRO_LOUNGE_GROUP, forumErrorText, mergeTopics } from './rules.ts';
import {
  appealOf,
  bookmarkOf,
  categoryOf,
  meOf,
  noticeOf,
  outcomeOf,
  postOf,
  rightsOf,
  searchHitOf,
  topicDetailOf,
  topicOf,
} from './mappers.ts';
import { sampleForumOn, sampleState } from './sampleSwitch.ts';
import type {
  FollowLevel,
  ForumAppeal,
  ForumBookmark,
  ForumCategory,
  ForumMe,
  ForumNotice,
  ForumPost,
  ForumResult,
  ForumRights,
  ForumSearchHit,
  ForumTopic,
  ForumTopicDetail,
  PostOutcome,
  ReactionKind,
  SubmitInput,
  TopicSort,
} from './types.ts';

export type { FollowLevel, ForumCategory, ForumPost, ForumRights, ForumTopic, ForumTopicDetail, ForumNotice };

const data = () => require('./sampleData') as typeof import('./sampleData');

const fail = (message: string | null | undefined): { ok: false; error: string; code: string | null } => ({
  ok: false,
  ...forumErrorText(message),
});

const done = <T,>(value: T): ForumResult<T> => ({ ok: true, value });

/** The sample's answer to a list read, for the three faces and "closed". */
async function sampleRead<T>(value: () => T): Promise<ForumResult<T>> {
  const face = sampleState()?.face;
  // Stays on the loading face: a read that never answers, and no timer to clear.
  if (face === 'loading') await new Promise(() => {});
  if (face === 'unreadable') return { ok: false, error: FORUM_UNREADABLE, code: null };
  if (face === 'closed') return { ok: false, error: FORUM_CLOSED, code: 'forum_closed' };
  return done(value());
}

async function rpc<T>(fn: string, args: Record<string, unknown> | undefined, map: (raw: unknown) => T): Promise<ForumResult<T>> {
  try {
    const { data: raw, error } = await supabase.rpc(fn as never, args as never);
    if (error) return fail(error.message);
    return done(map(raw));
  } catch (e) {
    return fail(e instanceof Error ? e.message : null);
  }
}

const rows = <T,>(map: (v: unknown) => T) => (raw: unknown): T[] => (Array.isArray(raw) ? raw.map(map) : []);
const yes = (raw: unknown): true => {
  if (raw === false) throw new Error('refused');
  return true;
};

/* ── Reads ───────────────────────────────────────────────────────────── */

export type ForumHome = {
  categories: ForumCategory[];
  rights: ForumRights[] | null;
  me: ForumMe | null;
  announcements: ForumTopic[];
};

/**
 * The forum home: categories are the read that decides the face. Rights and
 * "me" only colour it: when they fail, a press asks the server instead.
 */
export async function fetchForumHome(): Promise<ForumResult<ForumHome>> {
  if (sampleForumOn()) return sampleRead(() => data().sampleHome());
  const [categories, rights, me, announcements] = await Promise.all([
    rpc('forum_categories_list', undefined, rows(categoryOf)),
    rpc('forum_category_rights', undefined, rows(rightsOf)),
    rpc('forum_me', undefined, meOf),
    fetchTopics('announcements', 'latest', 5, 0),
  ]);
  if (!categories.ok) return categories;
  if (!announcements.ok) return announcements;
  return done({
    categories: categories.value,
    rights: rights.ok ? rights.value : null,
    me: me.ok ? me.value : null,
    announcements: announcements.value,
  });
}

export async function fetchTopics(
  category: string | null,
  sort: TopicSort,
  limit: number,
  offset: number,
): Promise<ForumResult<ForumTopic[]>> {
  if (sampleForumOn()) return sampleRead(() => data().sampleTopics(category, sort));
  return rpc(
    'forum_topics_list',
    { p_category: category, p_sort: sort, p_limit: limit, p_offset: offset },
    rows(topicOf),
  );
}

/**
 * The Pro Lounge reads as one feed. The server lists one category at a time, so
 * this merges them; one failed read fails the feed, never a feed with a
 * category quietly missing.
 */
export async function fetchLoungeTopics(sort: TopicSort): Promise<ForumResult<ForumTopic[]>> {
  if (sampleForumOn()) return sampleRead(() => data().sampleLounge());
  const categories = await rpc('forum_categories_list', undefined, rows(categoryOf));
  if (!categories.ok) return categories;
  const slugs = categories.value.filter((c) => c.groupSlug === PRO_LOUNGE_GROUP).map((c) => c.slug);
  const lists = await Promise.all(slugs.map((s) => fetchTopics(s, sort, 30, 0)));
  const bad = lists.find((l) => !l.ok);
  if (bad && !bad.ok) return bad;
  return done(mergeTopics(lists.map((l) => (l.ok ? l.value : []))));
}

export type ForumThread = { topic: ForumTopicDetail; posts: ForumPost[]; rights: ForumRights | null };

export const POSTS_PAGE = 100;

export async function fetchThread(topicId: string, offset = 0): Promise<ForumResult<ForumThread>> {
  if (sampleForumOn()) return sampleRead(() => data().sampleThread(topicId));
  const [topic, posts, rights] = await Promise.all([
    rpc('forum_topic_get', { p_topic_id: topicId }, topicDetailOf),
    rpc('forum_posts_list', { p_topic_id: topicId, p_limit: POSTS_PAGE, p_offset: offset }, rows(postOf)),
    rpc('forum_category_rights', undefined, rows(rightsOf)),
  ]);
  if (!topic.ok) return topic;
  if (!posts.ok) return posts;
  return done({
    topic: topic.value,
    posts: posts.value,
    rights: rights.ok ? rights.value.find((r) => r.slug === topic.value.categorySlug) ?? null : null,
  });
}

/** One topic's details, for the status line and tag on an Ideas row. */
export async function fetchTopicDetail(topicId: string): Promise<ForumResult<ForumTopicDetail>> {
  if (sampleForumOn()) return sampleRead(() => data().sampleThread(topicId).topic);
  return rpc('forum_topic_get', { p_topic_id: topicId }, topicDetailOf);
}

export async function searchTopics(q: string, category?: string): Promise<ForumResult<ForumSearchHit[]>> {
  if (sampleForumOn()) return sampleRead(() => data().sampleSearch(q));
  return rpc('forum_search', { p_q: q, p_category: category ?? null, p_limit: 10 }, rows(searchHitOf));
}

/** Glossary terms whose NAME matches, for "maybe already answered". The term
 *  list is the public browse view, so this spends none of the member's opens.
 *  A decoration: a failed read simply shows none. */
export async function glossaryMatches(words: string[]): Promise<string[]> {
  if (sampleForumOn()) return data().sampleGlossary(words);
  const safe = words.filter((w) => /^[a-z0-9]+$/.test(w));
  if (safe.length === 0) return [];
  try {
    const { data: raw, error } = await supabase
      .from('glossary_browse_v')
      .select('term')
      .or(safe.map((w) => `term.ilike.%${w}%`).join(','))
      .limit(2);
    if (error || !Array.isArray(raw)) return [];
    return raw.map((r) => (r as { term?: unknown }).term).filter((t): t is string => typeof t === 'string');
  } catch {
    return [];
  }
}

/** forum_me, for Your forum. Null when there is no account. */
export async function fetchForumMe(): Promise<ForumResult<ForumMe | null>> {
  if (sampleForumOn()) return sampleRead(() => data().sampleHome().me);
  return rpc('forum_me', undefined, (raw) => (raw ? meOf(raw) : null));
}

export async function fetchBookmarks(): Promise<ForumResult<ForumBookmark[]>> {
  if (sampleForumOn()) return sampleRead(() => data().sampleBookmarks());
  return rpc('forum_bookmarks_mine', undefined, rows(bookmarkOf));
}

/** The one thread of a lab, or null while nobody has started it. */
export async function fetchLabThread(labKey: string): Promise<ForumResult<string | null>> {
  if (sampleForumOn()) return sampleRead(() => data().sampleLabThread(labKey));
  return rpc('forum_lab_thread', { p_lab_key: labKey }, (raw) => (typeof raw === 'string' ? raw : null));
}

export type MyModeration = { notices: ForumNotice[]; appeals: ForumAppeal[] };

export async function fetchMyModeration(): Promise<ForumResult<MyModeration>> {
  if (sampleForumOn()) return sampleRead(() => data().sampleModeration());
  const [notices, appeals] = await Promise.all([
    rpc('forum_notices_mine', { p_limit: 30 }, rows(noticeOf)),
    rpc('forum_appeals_mine', undefined, rows(appealOf)),
  ]);
  if (!notices.ok) return notices;
  // An appeal list that failed only costs the "sent" mark: the server still
  // answers "already open" to a second appeal.
  return done({ notices: notices.value, appeals: appeals.ok ? appeals.value : [] });
}

/* ── Posting ─────────────────────────────────────────────────────────── */

/** The real message inside a functions.invoke error (it hides in the Response). */
async function invokeMessage(error: unknown): Promise<string | null> {
  const e = error as { message?: unknown; context?: { json?: () => Promise<unknown> } } | null;
  try {
    const body = (await e?.context?.json?.()) as { error?: unknown } | undefined;
    if (typeof body?.error === 'string') return body.error;
  } catch {
    // Not JSON: fall through to the wrapper's own message.
  }
  return typeof e?.message === 'string' ? e.message : null;
}

async function moderate(body: Record<string, unknown>): Promise<ForumResult<PostOutcome>> {
  try {
    const { data: raw, error } = await withDeadline(
      () => supabase.functions.invoke('forum-moderate', { body }),
      'forum-moderate',
      30000,
    );
    if (error) return fail(await invokeMessage(error));
    const reply = raw as { ok?: unknown; error?: unknown } | null;
    if (reply?.ok === false) return fail(typeof reply.error === 'string' ? reply.error : null);
    const outcome = outcomeOf(raw);
    return outcome ? done(outcome) : fail(null);
  } catch (e) {
    return fail(e instanceof Error ? e.message : null);
  }
}

/**
 * A new topic or a reply. `clientId` makes a retry after a dropped connection
 * land once. Text goes to the check in the same round trip (about 3 seconds).
 */
export async function submitPost(input: SubmitInput): Promise<ForumResult<PostOutcome>> {
  if (sampleForumOn()) return data().sampleSubmit(input);
  return moderate({
    mode: 'post',
    p_body: input.body,
    p_category: input.category,
    p_topic_id: input.topicId,
    p_title: input.title,
    p_topic_kind: input.topicKind,
    p_fields: input.fields,
    p_quote_post_id: input.quotePostId,
    p_quote_excerpt: input.quoteExcerpt,
    p_cards: input.labKey ? [{ type: 'lab', lab_key: input.labKey }] : undefined,
    p_correction_of: input.correctionOf,
    p_mention_tokens: input.mentionTokens?.length ? input.mentionTokens : undefined,
    p_lab_key: input.labThread?.key,
    p_lab_title: input.labThread?.title,
    p_client_id: input.clientId,
  });
}

/** Edit and Repost: checked again; others keep the approved text meanwhile. */
export async function editPost(postId: string, body: string, title?: string): Promise<ForumResult<PostOutcome>> {
  if (sampleForumOn()) return data().sampleEdit(postId, body, title);
  return moderate({ mode: 'edit', p_post_id: postId, p_body: body, p_title: title ?? null });
}

export async function deletePost(postId: string): Promise<ForumResult<true>> {
  if (sampleForumOn()) return done(data().sampleDelete(postId));
  return rpc('forum_post_delete', { p_post_id: postId }, yes);
}

/* ── Acting on posts ─────────────────────────────────────────────────── */

export type ReactionCounts = { helpful: number; thanks: number; insightful: number };

export async function reactToPost(postId: string, kind: ReactionKind, on: boolean): Promise<ForumResult<ReactionCounts>> {
  if (sampleForumOn()) return done(data().sampleReact(postId, kind, on));
  return rpc('forum_react', { p_post_id: postId, p_kind: kind, p_on: on }, (raw) => {
    const r = (Array.isArray(raw) ? raw[0] : raw) as Record<string, number> | null;
    if (!r) throw new Error('no_result');
    return { helpful: r.helpful_count ?? 0, thanks: r.thanks_count ?? 0, insightful: r.insightful_count ?? 0 };
  });
}

export async function markSolution(topicId: string, postId: string | null): Promise<ForumResult<true>> {
  if (sampleForumOn()) return done(data().sampleMarkSolution(topicId, postId));
  return rpc('forum_mark_solution', { p_topic_id: topicId, p_post_id: postId }, yes);
}

/** Best effort: an unread mark that failed is only a dot that stays. */
export async function markRead(topicId: string, postId?: string | null): Promise<void> {
  if (sampleForumOn()) return data().sampleMarkRead(topicId);
  await rpc('forum_mark_read', { p_topic_id: topicId, p_post_id: postId ?? null }, yes);
}

export async function reportPost(postId: string, reason: string, detail?: string): Promise<ForumResult<true>> {
  if (sampleForumOn()) return done(true);
  return rpc('forum_report', { p_post_id: postId, p_reason: reason, p_detail: detail ?? null }, () => true as const);
}

/** Block goes through the directory's own block, so it reaches Requests too. */
export async function blockAuthor(token: string): Promise<ForumResult<true>> {
  if (sampleForumOn()) return done(data().sampleBlock(token));
  const r = await blockMember(token);
  return r.ok ? done(true) : { ok: false, error: r.error, code: null };
}

export async function voteIdea(topicId: string, on: boolean): Promise<ForumResult<number>> {
  if (sampleForumOn()) return done(data().sampleVote(topicId, on));
  return rpc('forum_idea_vote', { p_topic_id: topicId, p_on: on }, (raw) => {
    if (typeof raw !== 'number') throw new Error('no_result');
    return raw;
  });
}

/** `remindAt`: when the server should send the reminder. Delivery is the server's. */
export async function setBookmark(postId: string, on: boolean, remindAt?: string): Promise<ForumResult<true>> {
  if (sampleForumOn()) return done(data().sampleSetBookmark(postId, on, remindAt ?? null));
  return rpc('forum_bookmark_set', { p_post_id: postId, p_on: on, p_remind_at: remindAt ?? null }, yes);
}

/** The corrected post's author accepts or declines. Accepting does not change
 *  the post: the author then edits it, and the edit is checked as usual. */
export async function resolveCorrection(correctionPostId: string, accept: boolean): Promise<ForumResult<true>> {
  if (sampleForumOn()) return done(data().sampleResolveCorrection(correctionPostId, accept));
  return rpc('forum_correction_resolve', { p_correction_post_id: correctionPostId, p_accept: accept }, yes);
}

/** "This could hurt someone": reviewed straight away. */
export async function flagSafety(postId: string): Promise<ForumResult<true>> {
  if (sampleForumOn()) return done(true);
  return rpc('forum_safety_flag', { p_post_id: postId }, yes);
}

export async function setTopicFollow(topicId: string, level: FollowLevel): Promise<ForumResult<true>> {
  if (sampleForumOn()) return done(true);
  return rpc('forum_follow_set', { p_category: null, p_topic_id: topicId, p_level: level }, yes);
}

export async function setFollow(category: string, level: FollowLevel): Promise<ForumResult<true>> {
  if (sampleForumOn()) return done(data().sampleFollow(category, level));
  return rpc('forum_follow_set', { p_category: category, p_topic_id: null, p_level: level }, yes);
}

export async function appealPost(postId: string, reason: string): Promise<ForumResult<true>> {
  if (sampleForumOn()) return done(data().sampleAppeal(postId));
  return rpc('forum_appeal_submit', { p_post_id: postId, p_reason: reason }, () => true as const);
}

export async function markNoticeRead(id: number): Promise<void> {
  if (sampleForumOn()) return data().sampleNoticeRead(id);
  await rpc('forum_notice_mark_read', { p_id: id }, yes);
}
