/**
 * Read the signed-in person's own `public.users` row.
 *
 * ── ⛔ WHY THIS EXISTS: `.single()` ON `users` IS A BUG FOR ADMINS ───────────
 *
 * Twelve call sites did `supabase.from('users').select('id').single()` with no
 * filter, trusting RLS to return exactly one row. That holds for an ordinary
 * member — and NOT for an admin. `public.users` carries an `admin_all_users`
 * policy (`ALL`, `is_admin()`), and two of the nine live accounts are admins.
 * For them the read returns EVERY row, `.single()` raises **PGRST116**, and
 * `profileRead.ts` maps PGRST116 to `'none'` — *"you have no account"*.
 *
 * Profile, Dashboard progress, Awards, Achievements, credentials and
 * notification preferences all failed at once, for the only two accounts that
 * can open the moderation and employer queues shipped for Apple 1.2.
 *
 * The fix is to say WHICH row you want instead of relying on the policy to
 * leave you only one. That is correct for every caller: an ordinary member
 * gets the same row they got before, and an admin stops matching everybody.
 *
 * ⚠️ ONE HELPER, NOT TWELVE PATCHES. The bug was not any single call site — it
 * was the idiom. A helper means the next person to read their own row cannot
 * reintroduce it, and `test/usersReadIsScoped.test.ts` fails on a bare
 * `.from('users')…single()` anywhere in the app.
 */
import { supabase } from '../../lib/supabase';
import { safeSessionResult, SESSION_TIMEOUT_MS } from '../../lib/getSessionSafe';
import { withDeadline } from '../../lib/boundedCall';
import { sharedAppUserId } from './appUserIdMemo';

/**
 * The auth uid from the STORED SESSION, or null when there is none.
 *
 * ⚡ NOT `getUser()` (perf decisions A, owner-approved 2026-10-04): that is a
 * round trip to the auth server on every call, made before the users-row read
 * could even start. The stored session carries the same uid (the strict twin
 * below has always read it this way); RLS on the users row still
 * authenticates the request itself.
 *
 * A read that did not come back (`timedOut`: a stall, a rejection, an
 * unreachable refresh) answers null — exactly what a failed `getUser()` gave
 * these callers before. Null here is "no row read", never a sign-out: nothing
 * in this module wipes or asserts an identity.
 */
async function authUid(): Promise<string | null> {
  try {
    const { result, timedOut } = await safeSessionResult(supabase.auth.getSession(), 'myUserRow');
    if (timedOut) return null;
    return result.data?.session?.user?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Select columns from the caller's OWN users row.
 *
 * Returns null when there is no session, when the row does not exist, or on
 * any error — callers already treat "no row" as not-signed-in. It never
 * throws: every one of these reads sits on a screen-load path.
 *
 * ⚠️ `maybeSingle`, not `single`: a missing row is an ordinary state (a guest,
 * or a cold start before `register_commercial_user` has run) and must not
 * surface as an error the caller has to special-case.
 */
export async function myUserRow<T = Record<string, unknown>>(columns: string): Promise<T | null> {
  const uid = await authUid();
  if (!uid) return null;
  try {
    const { data } = await supabase.from('users').select(columns).eq('auth_id', uid).maybeSingle();
    return (data as T) ?? null;
  } catch {
    return null;
  }
}

/**
 * `myUserRow` for a read whose FAILURE must not pass for "nothing there"
 * (full run 2, 2026-10-01). Resolves null only when there is genuinely no
 * session or no row; a failed or stalled read THROWS. The printed certificate
 * used the forgiving read and turned a network blip into "Academy Member".
 */
export async function myUserRowOrThrow<T = Record<string, unknown>>(columns: string): Promise<T | null> {
  const { data: s } = await withDeadline(() => supabase.auth.getSession(), 'users row session', SESSION_TIMEOUT_MS);
  const uid = s.session?.user?.id ?? null;
  if (!uid) return null;
  const { data, error } = await withDeadline(
    async () => await supabase.from('users').select(columns).eq('auth_id', uid).maybeSingle(),
    'users row read',
  );
  if (error) throw new Error(error.message || 'users row read failed');
  return (data as T) ?? null;
}

/** The caller's `public.users.id` — the surrogate key almost every progress
 *  table points at. NOT the same value as `auth.uid()`; see the two id spaces. */
export async function myUserId(): Promise<string | null> {
  const uid = await authUid();
  if (!uid) return null;
  // ⚡ One users-row read per identity, shared by parallel callers (see
  // appUserIdMemo). Same answers as before: null for no row or any failure.
  try {
    const { id } = await sharedAppUserId(uid, readAppUserId(uid));
    return id;
  } catch {
    return null;
  }
}

/** The users-row id read every memo caller shares — scoped to `auth_id` (see
 *  the header: never trust RLS to leave one row). Resolves an error as a
 *  value so each caller keeps its own failure handling. */
function readAppUserId(uid: string): () => Promise<{ id: string | null; error: string | null }> {
  return async () => {
    const { data, error } = await supabase.from('users').select('id').eq('auth_id', uid).maybeSingle();
    if (error) return { id: null, error: error.message || 'users row read failed' };
    return { id: (data as { id: string } | null)?.id ?? null, error: null };
  };
}
