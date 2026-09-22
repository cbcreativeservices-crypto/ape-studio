/**
 * getSessionSafe — `supabase.auth.getSession()` that cannot hang forever.
 *
 * ⛔ THE BUG THIS EXISTS TO PREVENT — and it has been seen twice.
 *
 * `getSession()` reads the persisted session out of the native secure store.
 * That read can STALL rather than fail: the promise simply never settles. A
 * `.catch()` does not help, because nothing is rejecting.
 *
 * SplashScreen hit this during QA Wave D (2026-09-10) and its comment names
 * the symptom exactly: *"a stalled native secure-store read would leave
 * `await sessionP` pending forever and freeze the app on Splash."* It was
 * fixed there with a local 5-second race — and nowhere else.
 *
 * Sixteen other call sites still awaited it unguarded, including three that
 * gate a screen's ONLY load:
 *   • FlashcardsScreen — inside a `Promise.all` of seven, so one stall leaves
 *     the whole screen empty with no cards and no error
 *   • DashboardScreen — the study rack
 *   • CourseSelectionScreen — the Home screen
 *
 * A stall there does not throw, so no error boundary catches it and no
 * message is shown. The screen simply never finishes loading, which a user
 * reports as "it froze" — and because the cause is a stored value, force-
 * quitting and reopening reproduces it exactly. A tester hit precisely that
 * on 2026-09-21.
 *
 * ⚠️ TIMING OUT RESOLVES TO "NO SESSION", which is the same fallback Splash
 * chose and the same direction the rest of the app fails: an unresolved tier
 * is treated as not-entitled, never as entitled. A signed-in user who hits a
 * stall sees signed-out content for that one operation instead of a dead
 * screen, and the next call succeeds once the store responds.
 */
/**
 * ⚠️ NO IMPORTS ON PURPOSE. This module is pulled into files that Node tests
 * load with a stubbed Supabase client (see test/examTenure), so it must not
 * drag the real client into their module graph. The caller passes the promise;
 * this only bounds it.
 */

/** Long enough that a slow-but-working read still wins, short enough that a
 *  stall does not read as a freeze. Matches SplashScreen's existing choice. */
export const SESSION_TIMEOUT_MS = 5000;

type AnySession = { data: { session: unknown } };

/**
 * Bound a `getSession()` call so a stalled secure-store read cannot hang the
 * caller forever.
 *
 * @param p         the in-flight `supabase.auth.getSession()` promise
 * @param whereFrom a short tag, so a stall in the wild names the screen it
 *                  stalled on instead of appearing anonymously in the log
 */
export async function safeSession<T extends AnySession>(p: Promise<T>, whereFrom: string): Promise<T> {
  const none = { data: { session: null } } as unknown as T;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      p.catch(() => none),
      new Promise<T>((resolve) => {
        timer = setTimeout(() => {
          // Worth a warning: a stall is a real device fault, not an ordinary
          // signed-out state, and it is otherwise completely silent.
          console.warn(`[auth] getSession stalled >${SESSION_TIMEOUT_MS}ms in ${whereFrom} — continuing as signed out`);
          resolve(none);
        }, SESSION_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** `true` when a real session is present — the common shorthand. */
export async function hasSafeSession<T extends AnySession>(p: Promise<T>, whereFrom: string): Promise<boolean> {
  return !!(await safeSession(p, whereFrom)).data.session;
}

type AnyUser = { data: { user: unknown } };

/**
 * The same bound for `supabase.auth.getUser()`.
 *
 * ⚠️ `getUser()` is a NETWORK round trip, not a keychain read, so it fails in
 * a second way `getSession()` does not: on a dead or captive connection it can
 * sit unresolved until the platform's own socket timeout, which is far longer
 * than a person will wait and is not guaranteed to fire at all. Everywhere it
 * gates a screen's only load — or worse, sits in front of a write to disk on
 * the branch entered *because* the network just failed — an unbounded wait is
 * the same defect as the session one, reached by a different road.
 */
export async function safeUser<T extends AnyUser>(p: Promise<T>, whereFrom: string): Promise<T> {
  const none = { data: { user: null } } as unknown as T;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      p.catch(() => none),
      new Promise<T>((resolve) => {
        timer = setTimeout(() => {
          console.warn(`[auth] getUser stalled >${SESSION_TIMEOUT_MS}ms in ${whereFrom} — continuing as signed out`);
          resolve(none);
        }, SESSION_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
