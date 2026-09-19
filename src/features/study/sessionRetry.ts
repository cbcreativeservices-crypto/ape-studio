/**
 * What happens when a study read fails: the cold-start auth race, the retry
 * that closes it, and the message the learner is shown.
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
 * cannot be tested at all. Everything below is pinned by
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
    if (!(await hasSession())) {
      // Really is a guest on a topic that is not free. Not a network fault,
      // and not something a retry can change.
      throw new StudyLoadError('signed-out', e);
    }
    console.warn('[study] read denied before the session loaded; retrying once');
    try {
      return await read();
    } catch (again) {
      // Signed in and still refused: an entitlement or grant problem, or a
      // session that never finished hydrating. Either way it is about access.
      if (isAuthDenial(again)) throw new StudyLoadError('no-access', again);
      throw again;
    }
  }
}

/**
 * Why a study read failed, in the only terms the learner can act on.
 *
 * ⛔ THE SCREENS USED TO SAY "Check your connection" FOR ALL OF THESE, and
 * that is how the cold-start race above stayed hidden for so long: the one
 * message sent the reader to look at their wifi when their wifi was fine.
 * Three separate screens carried the same wrong string, so the reason is
 * decided here, once, where the failure is actually understood.
 */
export type StudyLoadReason =
  /** The request never reached the server. "Check your connection" is right. */
  | 'offline'
  /** Denied with no session at all — a guest, and not a free topic. */
  | 'signed-out'
  /** Denied WITH a session, and the retry did not help. Access, not network. */
  | 'no-access'
  /** Something else. Say so plainly rather than inventing a cause. */
  | 'unknown';

/**
 * A study read that failed, carrying WHY so the screen need not guess.
 *
 * ⚠️ Fields are assigned in the body, not declared as constructor parameter
 * properties: the test runner strips types rather than compiling them, and
 * parameter properties are the one TS feature that cannot be stripped.
 */
export class StudyLoadError extends Error {
  readonly reason: StudyLoadReason;
  readonly failure: unknown;

  constructor(reason: StudyLoadReason, failure: unknown) {
    super(`study load failed: ${reason}`);
    this.name = 'StudyLoadError';
    this.reason = reason;
    this.failure = failure;
  }
}

/** Did the request fail before it got an answer, rather than being refused? */
export function isOfflineError(e: unknown): boolean {
  const raw = (e as { message?: unknown } | null)?.message;
  const msg = typeof raw === 'string' ? raw : e instanceof Error ? e.message : '';
  return /network|fetch failed|failed to fetch|timeout|timed out|abort|socket|econn|offline/i.test(msg);
}

/**
 * The line shown on the study screens.
 *
 * Plain, specific, and honest about what the reader can do — the house voice
 * of "Your membership has expired. Renew to open your saved Home cards."
 * Nothing here promises access that an account may not have.
 */
export function studyLoadMessage(reason: StudyLoadReason): string {
  switch (reason) {
    case 'offline':
      return 'Could not reach the server. Check your connection and try again.';
    case 'signed-out':
      return 'Sign in to study this topic. Free topics are open to everyone; the rest come with a membership.';
    case 'no-access':
      return 'Your account does not have access to this topic. If your membership is current, close the app and open it again.';
    default:
      return 'Could not load this topic. Try again in a moment.';
  }
}

/** Classify any failure thrown out of a study fetch. */
export function studyLoadReason(e: unknown): StudyLoadReason {
  if (e instanceof StudyLoadError) return e.reason;
  if (isOfflineError(e)) return 'offline';
  // A denial that reached here un-tagged means nothing knew whether a session
  // existed; "no access" is the safer of the two, because telling a signed-in
  // member to sign in is the more confusing mistake.
  if (isAuthDenial(e)) return 'no-access';
  return 'unknown';
}
