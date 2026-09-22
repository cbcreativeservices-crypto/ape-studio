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
import { safeUser } from '../../lib/getSessionSafe';

/** The auth uid, or null when the session has not hydrated yet. */
async function authUid(): Promise<string | null> {
  try {
    const { data } = await safeUser(supabase.auth.getUser(), 'myUserRow');
    return data?.user?.id ?? null;
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

/** The caller's `public.users.id` — the surrogate key almost every progress
 *  table points at. NOT the same value as `auth.uid()`; see the two id spaces. */
export async function myUserId(): Promise<string | null> {
  const row = await myUserRow<{ id: string }>('id');
  return row?.id ?? null;
}
