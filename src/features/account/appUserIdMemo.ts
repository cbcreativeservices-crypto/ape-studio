/**
 * appUserIdMemo — the caller's `public.users.id`, read ONCE per auth identity
 * (perf decisions A, owner-approved 2026-10-04).
 *
 * `users.id` never changes for a given auth uid, but every screen that needed
 * it (Awards, Profile, study writes, the push token save, the weekly-concept
 * preference) re-read the users row — and Home's first paint fires several of
 * those at once, each its own round trip. This keeps the answer for the
 * CURRENT auth uid and lets parallel callers share one in-flight read.
 *
 * Safety:
 *  • KEYED BY THE AUTH UID. A call for any other uid drops the memo and reads
 *    afresh, so an account switch can never be handed the previous person's
 *    id — even before the wipe below runs.
 *  • RESET BY THE ACCOUNT WIPE (`resetAllLocalStores`, the house registry):
 *    every sign-out, account switch, guest entry and account deletion drops
 *    it, and a read that was in flight across the reset is not remembered.
 *  • ONLY A REAL ANSWER IS KEPT. No row (a cold start before
 *    register_commercial_user) and a failed read are returned to the caller
 *    as they are and not remembered, so the next call asks again.
 *  • The server still authenticates every request (RLS / RPCs on auth.uid());
 *    this only saves the client a lookup it already made.
 *
 * ⚠️ NO IMPORTS ON PURPOSE (the getSessionSafe rule): notification modules
 * that Node tests load against stub clients import this, so it must not pull
 * a Supabase client into their module graph. The caller passes the read.
 */

export type AppUserIdRead = { id: string | null; error: string | null };

let memo: { authUid: string; id: string } | null = null;
let inflight: { authUid: string; p: Promise<AppUserIdRead> } | null = null;
/** Bumped by every reset; a read that began before one is not remembered. */
let epoch = 0;

/**
 * The users.id for `authUid`: the remembered answer, the read already in
 * flight for the same uid, or a new read via `read`. A rejection of `read`
 * reaches every caller sharing it, exactly as their own read would have.
 */
export function sharedAppUserId(authUid: string, read: () => Promise<AppUserIdRead>): Promise<AppUserIdRead> {
  if (memo && memo.authUid === authUid) return Promise.resolve({ id: memo.id, error: null });
  if (memo) memo = null; // a different identity — never hand its id on
  if (inflight && inflight.authUid === authUid) return inflight.p;
  const mine = epoch;
  const entry: { authUid: string; p: Promise<AppUserIdRead> } = {
    authUid,
    p: Promise.resolve()
      .then(read)
      .then(
        (r) => {
          if (inflight === entry) inflight = null;
          if (epoch === mine && r.id && !r.error) memo = { authUid, id: r.id };
          return r;
        },
        (e: unknown) => {
          if (inflight === entry) inflight = null;
          throw e;
        },
      ),
  };
  inflight = entry;
  return entry.p;
}

/** Drop the remembered id and forget any read in flight (account wipe). */
export function resetAppUserIdMemo(): void {
  memo = null;
  inflight = null;
  epoch += 1;
}
