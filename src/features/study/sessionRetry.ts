/**
 * The cold-start auth race on the study reads, and the retry that closes it.
 *
 * ⛔ THIS IS THE "FIRST TIME I OPEN FLASHCARDS FOR A TOPIC" BUG
 * (owner 2026-09-19: "often creates error message").
 *
 * The session lives in the OS keychain and is loaded ASYNCHRONOUSLY, and
 * `autoRefreshToken` only runs while the app is foregrounded. So on a cold
 * start the first study reads can leave before the client has hydrated the
 * persisted JWT. PostgREST sees the `anon` role and answers 42501 — and the
 * study fetch is a cascade of three paths that ALL end at `glossary_study_v`,
 * so one denial fails every one of them and the last re-throws. The screen
 * then says "Could not load this topic. Check your connection," which is the
 * wrong cause and sends the reader to look at their wifi.
 *
 * A moment later the session is in place and the same topic opens fine. That
 * is the whole of "first time, often", and why it read as random.
 *
 * ⚠️ Its own module, with the session lookup passed IN, for two reasons: the
 * api module imports the Supabase client (and through it react-native, which
 * the test runner cannot load), and a retry rule with a real client inside it
 * cannot be tested at all. Both behaviours below are pinned by
 * `test/studySessionRetry.test.ts`.
 */

/**
 * Does this error mean PostgREST saw the ANON role rather than the member's?
 *
 * 42501 is Postgres's insufficient_privilege, surfaced to the client as a 401.
 * It is the shape every relation in the study path returns when the request
 * carried no usable JWT, so it is the one error worth a second attempt.
 */
export function isAuthDenial(e: unknown): boolean {
  if (e == null) return false;
  const code = (e as { code?: unknown }).code;
  if (code === '42501') return true;
  const raw = (e as { message?: unknown }).message;
  const msg = typeof raw === 'string' ? raw : e instanceof Error ? e.message : '';
  return /permission denied/i.test(msg);
}

/**
 * Run a study read; if it fails as an anon-role denial AND a session does in
 * fact exist, run it exactly once more.
 *
 * ⛔ ONE retry, and only with a session. A genuine guest reaching a
 * member-only topic must still fail — quickly, and for the real reason —
 * rather than being retried at. `hasSession` is the gate AND the wait:
 * Supabase's `getSession()` settles only once the client has finished reading
 * storage and any initial refresh, so by the time it answers true the retry
 * is certain to carry the token. That is why this is not a sleep.
 */
export async function withSessionRetry<T>(
  read: () => Promise<T>,
  hasSession: () => Promise<boolean>,
): Promise<T> {
  try {
    return await read();
  } catch (e) {
    if (!isAuthDenial(e)) throw e;
    if (!(await hasSession())) throw e; // really is a guest — surface it
    console.warn('[study] read denied before the session loaded; retrying once');
    return await read();
  }
}
