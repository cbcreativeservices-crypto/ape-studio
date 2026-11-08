/**
 * The forum calls that differ between the two live server shapes: the server
 * of 2026-11-07, and the same server once the SERVER GAPS package
 * (2026-11-07_FOR_COMP_A_FORUM_GAPS) is applied. Each one tries the new
 * function or argument first and falls back to today's path ONLY when the
 * server answers that it does not have it (`missingFunction`: PGRST202 /
 * 42883). Any other failure is told as a failure, never retried the old way.
 *
 * Pure: the database call is passed in, so both shapes are tested in node
 * with a fake server. Only api.ts and forumFlags.ts call these with the real
 * client.
 */
import { BLOCK_NO_PROFILE, PRO_LOUNGE_GROUP, mergeTopics, missingFunction, rulesKept } from './rules.ts';
import { categoryOf, topicOf } from './mappers.ts';
import type { ForumPost, ForumTopic, ForumTopicDetail, TopicSort } from './types.ts';

export type RpcError = { code?: string | null; message?: string | null } | null;
export type RpcAnswer = { data: unknown; error: RpcError };
export type RpcCall = (fn: string, args?: Record<string, unknown>) => PromiseLike<RpcAnswer>;

/**
 * An answer from one of these flows. `message` is the server's raw message, for
 * api.ts to put in words (forumErrorText, and the sign-in check). `words` is
 * already plain text (the Directory's own block answers with it).
 */
export type Got<T> = { ok: true; value: T } | { ok: false; message: string | null; words?: string };

/** One call that never throws: a thrown error is an answer with an error. */
export async function ask(call: RpcCall, fn: string, args?: Record<string, unknown>): Promise<RpcAnswer> {
  try {
    const r = await call(fn, args);
    return { data: r?.data ?? null, error: r?.error ?? null };
  } catch (e) {
    return { data: null, error: { message: e instanceof Error ? e.message : null } };
  }
}

const list = (raw: unknown): unknown[] => (Array.isArray(raw) ? raw : []);
const failed = (e: RpcError): { ok: false; message: string | null } => ({ ok: false, message: e?.message ?? null });

/* ── The Pro Lounge feed (SERVER_GAPS row 7) ─────────────────────────── */

/** How many topics the one-call lounge feed reads. */
export const LOUNGE_LIMIT = 60;
/** Per category, on a server without `p_group` (today's limit). */
export const LOUNGE_PER_CATEGORY = 30;

/**
 * One feed for the whole Pro Lounge. With `p_group` the SERVER sorts it, so
 * "Top this week" truly ranks across the lounge, and the order is kept as it
 * came. Without it, the four categories are read and merged by last activity,
 * and one failed read fails the feed (never a feed with a category missing).
 */
export async function loungeTopics(call: RpcCall, sort: TopicSort): Promise<Got<ForumTopic[]>> {
  const one = await ask(call, 'forum_topics_list', {
    p_category: null,
    p_sort: sort,
    p_limit: LOUNGE_LIMIT,
    p_offset: 0,
    p_group: PRO_LOUNGE_GROUP,
  });
  if (!one.error) return { ok: true, value: list(one.data).map(topicOf) };
  if (!missingFunction(one.error)) return failed(one.error);

  const cats = await ask(call, 'forum_categories_list');
  if (cats.error) return failed(cats.error);
  const slugs = list(cats.data)
    .map(categoryOf)
    .filter((c) => c.groupSlug === PRO_LOUNGE_GROUP)
    .map((c) => c.slug);
  const lists = await Promise.all(
    slugs.map((s) =>
      ask(call, 'forum_topics_list', { p_category: s, p_sort: sort, p_limit: LOUNGE_PER_CATEGORY, p_offset: 0 }),
    ),
  );
  const bad = lists.find((l) => l.error);
  if (bad) return failed(bad.error);
  return { ok: true, value: mergeTopics(lists.map((l) => list(l.data).map(topicOf))) };
}

/* ── Block by post (row 9) ───────────────────────────────────────────── */

/**
 * Block a post's author. `forum_block_author` finds the author on the server,
 * so an author with no published profile can be blocked too. A server without
 * it: the Directory's token block (`legacy`), and with no token, the plain
 * "no community profile" answer, as today.
 */
export async function blockByPost(
  call: RpcCall,
  postId: string,
  token: string | null,
  legacy: (token: string) => Promise<{ ok: true } | { ok: false; error: string }>,
): Promise<Got<true>> {
  const r = await ask(call, 'forum_block_author', { p_post_id: postId, p_on: true });
  if (!r.error) return r.data === false ? { ok: false, message: null } : { ok: true, value: true };
  if (!missingFunction(r.error)) return failed(r.error);
  if (!token) return { ok: false, message: null, words: BLOCK_NO_PROFILE };
  const old = await legacy(token);
  return old.ok ? { ok: true, value: true } : { ok: false, message: null, words: old.error };
}

/* ── The rules agreement (row 10) ────────────────────────────────────── */

/** Record the agreement on the account. 'missing' on a server without it. */
export async function recordRulesOnServer(call: RpcCall): Promise<'recorded' | 'missing' | 'failed'> {
  const r = await ask(call, 'forum_rules_accept');
  if (!r.error) return r.data ? 'recorded' : 'failed';
  return missingFunction(r.error) ? 'missing' : 'failed';
}

/**
 * I AGREE: the phone keeps it AND the server records it. True when either one
 * kept it (rulesKept). Both run together, so a server without the function
 * costs no extra wait.
 */
export async function acceptRulesBoth(device: () => Promise<boolean>, call: RpcCall): Promise<boolean> {
  const [kept, server] = await Promise.all([
    Promise.resolve()
      .then(device)
      .catch(() => false),
    recordRulesOnServer(call),
  ]);
  return rulesKept(kept, server);
}

/* ── Ideas: the line under each row (rows 3 and 5) ───────────────────── */

export type IdeaDetail = { reason: string | null; area: string | null };

/**
 * Each idea's reason and area straight from the list, once forum_topics_list
 * sends them. Null when any row came without them: the screen then asks
 * forum_topic_get per row, as today.
 */
export function ideaDetailsFromList(rows: ForumTopic[]): Record<string, IdeaDetail> | null {
  if (!rows.every((t) => t.detailKnown)) return null;
  return Object.fromEntries(rows.map((t) => [t.id, { reason: t.trackedReason, area: t.area }]));
}

/* ── Edit and Repost from a notice (row 2) ───────────────────────────── */

export type EditTarget = { postId: string; isOpening: boolean; body: string; title?: string };

/**
 * The whole post a notice is about, from its thread, so Edit and Repost starts
 * from all of it (the waiting edit when there is one, as in the thread). Null
 * when the post is not in the thread as read: the notice's excerpt is used.
 */
export function noticeEditFrom(
  thread: { topic: Pick<ForumTopicDetail, 'title' | 'categorySlug'>; posts: ForumPost[] },
  postId: string,
): { slug: string; edit: EditTarget } | null {
  const post = thread.posts.find((p) => p.id === postId && p.isMine);
  if (!post) return null;
  const body = post.pendingBody ?? post.body;
  if (!body) return null;
  return {
    slug: thread.topic.categorySlug,
    edit: {
      postId: post.id,
      isOpening: post.isOpening,
      body,
      ...(post.isOpening ? { title: thread.topic.title } : {}),
    },
  };
}
