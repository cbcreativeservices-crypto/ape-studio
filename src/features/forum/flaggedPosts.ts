/**
 * Posts this member flagged as a safety concern this session, so "Flag a
 * safety concern" is not offered twice for one post (bug pass 2026-11-08,
 * UI-1-18). Memory only, and cleared by the account wipe (self-registered),
 * so the next member on this phone is offered the flag again.
 */
import { localStoreWipeCount, registerLocalStoreReset } from '../storage/localStoreRegistry';

const flagged = new Set<string>();
/** Flags out right now, per post: a flag on post B while A's is out is its
 *  own send, never dropped (N2), and the same post never goes twice. */
const sending = new Map<string, number>();

export function flaggedPostIds(): string[] {
  return [...flagged];
}

export function markPostFlagged(postId: string): void {
  flagged.add(postId);
}

/** Claims the send for this post: false while it is out, or once flagged.
 *  Remembers which account it was sent under (the wipe count). */
export function beginFlag(postId: string): boolean {
  if (sending.has(postId) || flagged.has(postId)) return false;
  sending.set(postId, localStoreWipeCount());
  return true;
}

/** The answer came back: flagged on success, free to try again on failure.
 *  An answer that lands after a sign-out (the account wipe ran while it was
 *  out) belongs to the member who left: it marks nothing for the next one
 *  (bug pass 3, CODE-3-10; the same fence as draftOwner). */
export function endFlag(postId: string, ok: boolean): void {
  const at = sending.get(postId);
  if (at === undefined || at !== localStoreWipeCount()) return;
  sending.delete(postId);
  if (ok) flagged.add(postId);
}

/** The account wipe, and tests. */
export function resetFlaggedPosts(): void {
  flagged.clear();
  sending.clear();
}

registerLocalStoreReset(resetFlaggedPosts);
