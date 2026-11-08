/**
 * Posts this member flagged as a safety concern this session, so "Flag a
 * safety concern" is not offered twice for one post (bug pass 2026-11-08,
 * UI-1-18). Memory only, and cleared by the account wipe (self-registered),
 * so the next member on this phone is offered the flag again.
 */
import { registerLocalStoreReset } from '../storage/localStoreRegistry';

const flagged = new Set<string>();
/** Flags out right now, per post: a flag on post B while A's is out is its
 *  own send, never dropped (N2), and the same post never goes twice. */
const sending = new Set<string>();

export function flaggedPostIds(): string[] {
  return [...flagged];
}

export function markPostFlagged(postId: string): void {
  flagged.add(postId);
}

/** Claims the send for this post: false while it is out, or once flagged. */
export function beginFlag(postId: string): boolean {
  if (sending.has(postId) || flagged.has(postId)) return false;
  sending.add(postId);
  return true;
}

/** The answer came back: flagged on success, free to try again on failure. */
export function endFlag(postId: string, ok: boolean): void {
  sending.delete(postId);
  if (ok) flagged.add(postId);
}

/** The account wipe, and tests. */
export function resetFlaggedPosts(): void {
  flagged.clear();
  sending.clear();
}

registerLocalStoreReset(resetFlaggedPosts);
