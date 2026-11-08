/**
 * One post, one once-only id (bug pass 2026-11-08, CODE-1-05).
 *
 * The server lands a post once per `clientId`. Each Ask form and reply box used
 * to make a fresh id when it mounted, so leaving mid-post and posting the
 * restored draft again, or a second Ask form on the stack posting the same
 * draft, made a second public post. Here the id belongs to WHAT is posted
 * (where + the exact text): the same post sent again from anywhere in the app
 * within a short while reuses its id and lands once; a changed post is a new
 * one, and so is the same words sent again long after.
 *
 * Cleared by the account wipe (self-registered below), so the next member on
 * this phone is never handed the last member's ids. Unit-tested in node.
 */
import { registerLocalStoreReset } from '../storage/localStoreRegistry';

/** How long the same words in the same place count as the same post. */
export const SAME_POST_MS = 15 * 60 * 1000;
/** Plenty for one session; the oldest make way past this many. */
const MAX_KEPT = 50;

const ids = new Map<string, { id: string; at: number }>();

/** The post's identity: where it goes and its exact content. */
export function postFingerprint(where: string, content: unknown): string {
  return `${where}\u0000${JSON.stringify(content)}`;
}

/**
 * The id for this post: the one it already has (a restored draft's, a retry's),
 * else the one it was sent with a moment ago, else a new one. Remembered either
 * way, so the next send of the same post finds it.
 */
export function clientIdFor(fingerprint: string, known: string | null, make: () => string, now: number = Date.now()): string {
  const kept = ids.get(fingerprint);
  const recent = kept && now - kept.at < SAME_POST_MS ? kept.id : null;
  const id = known ?? recent ?? make();
  ids.delete(fingerprint);
  ids.set(fingerprint, { id, at: now });
  while (ids.size > MAX_KEPT) {
    const oldest = ids.keys().next().value as string;
    ids.delete(oldest);
  }
  return id;
}

/** This post will never be the same post again (it was stopped and cleared):
 *  the next send of the same words is a new post. */
export function forgetClientId(fingerprint: string): void {
  ids.delete(fingerprint);
}

/**
 * A reply's answer came back: `true` releases its id, so the same words sent
 * again on purpose ("Thanks!" to a second person) are a new post. The thread
 * releases it whether or not it was still on screen (bug pass 3, CODE-3-01):
 * an id is only worth keeping while NO answer has come, and then the draft on
 * disk carries it. `false` keeps it (kept for tests and callers that need it).
 */
export function settleClientId(fingerprint: string, seen: boolean): void {
  if (seen) ids.delete(fingerprint);
}

/**
 * A reply seen to land, told to every open reply box (bug pass 2026-11-08,
 * N1). Two thread screens for one topic can be on the stack (thread, a lab,
 * DISCUSS THIS LAB again). Once the id is released, the box underneath still
 * held the sent words and would post them again: every box holding exactly
 * that reply drops it.
 */
const landedListeners = new Set<(fingerprint: string) => void>();

export function onReplyLanded(listener: (fingerprint: string) => void): () => void {
  landedListeners.add(listener);
  return () => {
    landedListeners.delete(listener);
  };
}

/** Tell every box first, then release the id: no box can still send it. */
export function replyLandedSeen(fingerprint: string): void {
  for (const l of [...landedListeners]) {
    try {
      l(fingerprint);
    } catch {
      // one box must not stop the others
    }
  }
  settleClientId(fingerprint, true);
}

/**
 * Which post each landed id made (bug pass 2, CODE-2-07). The server answers a
 * known id with the post it already made, even a DELETED one: the same words
 * posted again after a delete never landed and opened the deleted topic.
 * Deleting a post frees the id it was sent with.
 */
const landedPosts = new Map<string, string>();

export function landedAs(fingerprint: string, postId: string): void {
  if (!postId) return;
  landedPosts.delete(postId);
  landedPosts.set(postId, fingerprint);
  while (landedPosts.size > MAX_KEPT) {
    const oldest = landedPosts.keys().next().value as string;
    landedPosts.delete(oldest);
  }
}

/** The post was deleted: the same words sent again are a new post. */
export function forgetLandedPost(postId: string): void {
  const fingerprint = landedPosts.get(postId);
  landedPosts.delete(postId);
  if (fingerprint) ids.delete(fingerprint);
}

/** The account wipe, and tests. */
export function resetPostOnce(): void {
  ids.clear();
  landedPosts.clear();
}

registerLocalStoreReset(resetPostOnce);
