/**
 * Deadlines for calls that gate the UI.
 *
 * ⛔ WHY THIS FILE EXISTS: THE PATTERN KEPT BEING COPIED AND KEPT DRIFTING.
 *
 * A request that HANGS is not a request that FAILS. `try/catch` catches a
 * rejection; a promise that never settles is not caught, `finally` never runs,
 * and any loading flag set before it stays true for the life of the screen — a
 * spinner with no error and no retry. Airplane-mode testing passes this
 * completely; only a stalled connection reveals it.
 *
 * This app has shipped FIVE freezes of exactly that shape in one month:
 *   · the glossary meter (`glossary_usage_status`) — bounded 2026-09-22
 *   · the graded exam submit — bounded 2026-09-23
 *   · the graded quiz submit — bounded 2026-09-23 (lost the attempt outright)
 *   · `calcUsage.ts`, a deliberate line-for-line mirror of `glossaryCap.ts`
 *     that copied everything EXCEPT the bound added to the original
 *   · the glossary gateway RPC, which is the LIVE metering path while the
 *     bounded one turned out to be the fallback
 *
 * Every one was written by hand, and the copies drifted. So the helper lives
 * here once, and new call sites use it rather than growing a sixth variant.
 *
 * TWO SHAPES, AND THE DIFFERENCE MATTERS:
 *
 *   withDeadline   REJECTS on timeout. For work whose failure path does
 *                  something important — queueing a graded submission, showing
 *                  an error. The message contains "timeout" so the transient
 *                  matchers already in this codebase recognise it.
 *
 *   softDeadline   RESOLVES to a fallback. For reads where being unable to
 *                  answer must not block the user — a usage meter, an optional
 *                  decoration. Failing OPEN is the safe direction there.
 *
 * Picking the wrong one is how a timeout turns into silent data loss: a graded
 * submit that RESOLVES to a fallback looks successful and is thrown away.
 */

/** Long enough that a slow-but-working call wins; short enough not to read as
 *  a freeze. Server-side statement timeouts do NOT cover this — a socket that
 *  stops answering never delivers the server's error either. */
export const DEFAULT_DEADLINE_MS = 25000;

/**
 * Reject if `run` has not settled in time.
 *
 * @param run    the work, as a factory so nothing starts before the race
 * @param label  named in the rejection and the warning, so a stall in the wild
 *               says which call stalled instead of appearing anonymously
 */
export async function withDeadline<T>(
  run: () => Promise<T>,
  label: string,
  ms: number = DEFAULT_DEADLINE_MS,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      run(),
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => {
          // "timeout" is load-bearing: the transient matchers in QuizScreen and
          // the exam queue test the MESSAGE to decide whether to save the
          // attempt. Rewording this silently stops a graded submission being
          // rescued.
          reject(new Error(`${label} timeout after ${ms}ms`));
        }, ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Resolve to `fallback` if `run` has not settled in time, and on any error.
 *
 * ⛔ Only for work where "could not answer" must not block the user. Never for
 * anything whose result is recorded — a fallback that looks like a real answer
 * is worse than a visible failure.
 */
export async function softDeadline<T>(
  run: () => Promise<T>,
  fallback: T,
  label: string,
  ms: number = DEFAULT_DEADLINE_MS,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      run().catch(() => fallback),
      new Promise<T>((resolve) => {
        timer = setTimeout(() => {
          // A stall is a real fault and is otherwise completely silent.
          console.warn(`[bounded] ${label} stalled >${ms}ms — continuing without it`);
          resolve(fallback);
        }, ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// THE CLIENT BOUNDARY (pattern hunt A4, 2026-10-02)
//
// withDeadline/softDeadline bound the calls someone remembered to wrap. This
// bounds EVERY request the Supabase client makes — `.rpc()`, `.from()`,
// `auth.*` network calls (sign-in, refresh, sign-out), `functions.invoke()`
// and storage — because it is handed to `createClient` as `global.fetch`, the
// one door all four HTTP clients go through. React Native's fetch on Android
// never times out by itself, so without this a stalled socket is a promise
// that never settles, however careful the caller is.
//
// It is a BACKSTOP, not a replacement:
//   · The budgets are deliberately LONGER than DEFAULT_DEADLINE_MS, so every
//     per-call withDeadline/softDeadline still fires first with its own label
//     and its own (friendlier) timing — `/redeem_access_code timeout/` and
//     `/signOut timeout/` match on those labels. This only catches the sites
//     nobody wrapped, and it also cancels the socket a per-call race left
//     running.
//   · The rejection is named `AbortError` and its message says "timeout":
//       - postgrest-js turns a rejected fetch into `{ data: null, error }`
//         (message "AbortError: … timeout after …") — an ERROR, never an empty
//         success — and does not retry an AbortError, so a GET cannot triple
//         the wait;
//       - auth-js throws AuthRetryableFetchError (status 0) with the message;
//       - functions-js returns `{ error: FunctionsFetchError }`;
//     and every transient matcher in the app (/timeout|abort|fetch/) reads it
//     as the offline case.
//
// ⚠️ NOT COVERED: the access-token read supabase-js does BEFORE calling fetch
// (`auth.getSession()` → the keychain). A stalled secure-store read stalls
// there, outside this window — that is what safeSession/withDeadline at the
// call site are for. A refresh stalled on the NETWORK is covered (the refresh
// request itself comes through here, so the auth lock is released).
// Realtime is a WebSocket and does not use fetch; it is unaffected.
// ─────────────────────────────────────────────────────────────────────────────

/** REST, auth and anything else. Above DEFAULT_DEADLINE_MS on purpose (see above). */
export const FETCH_DEADLINE_MS = 30000;
/** Edge functions: cold starts, and validate-purchase is bounded at 30 s by its caller. */
export const FUNCTIONS_FETCH_DEADLINE_MS = 45000;
/** Storage: uploads and downloads move real bytes over a phone connection. */
export const STORAGE_FETCH_DEADLINE_MS = 120000;

type FetchLike = (input: any, init?: any) => Promise<any>;

/** The budget for one request, by Supabase service path. */
export function fetchDeadlineFor(url: string): number {
  if (/\/storage\/v1\//.test(url)) return STORAGE_FETCH_DEADLINE_MS;
  if (/\/functions\/v1\//.test(url)) return FUNCTIONS_FETCH_DEADLINE_MS;
  return FETCH_DEADLINE_MS;
}

const urlOf = (input: unknown): string =>
  typeof input === 'string' ? input : String((input as { url?: string } | null)?.url ?? input);

/** Path only — no host, no query string (filters can carry user values). */
const pathOf = (url: string): string => url.replace(/^[a-z][a-z0-9+.-]*:\/\/[^/]+/i, '').split('?')[0];

/**
 * Wrap a fetch so no request can outlive its budget.
 *
 * @param base        the real fetch, resolved at CALL time so a polyfill (or a
 *                    test stub) installed after import is the one used
 * @param label       named in the rejection, so a stall in the wild says where
 * @param deadlineFor budget per URL
 */
export function createBoundedFetch(
  base: FetchLike = (input, init) => fetch(input, init),
  label = 'fetch',
  deadlineFor: (url: string) => number = fetchDeadlineFor,
): FetchLike {
  return (input, init) => {
    const url = urlOf(input);
    const ms = deadlineFor(url);
    const ctl = typeof AbortController === 'function' ? new AbortController() : null;
    // Keep the caller's own cancellation (postgrest `.abortSignal()`,
    // functions-js `timeout`) working through our controller.
    const outer: AbortSignal | undefined = init?.signal ?? undefined;
    let relay: (() => void) | undefined;
    if (ctl && outer) {
      if (outer.aborted) ctl.abort();
      else {
        relay = () => ctl.abort();
        outer.addEventListener('abort', relay, { once: true });
      }
    }
    let timer: ReturnType<typeof setTimeout> | undefined;
    const deadline = new Promise<never>((_resolve, reject) => {
      timer = setTimeout(() => {
        // "timeout" is load-bearing (see withDeadline); the AbortError name
        // stops postgrest-js retrying it. Reject FIRST so this error, not the
        // platform's generic abort, is the one the caller sees.
        const err = new Error(`${label} ${pathOf(url)} timeout after ${ms}ms`);
        err.name = 'AbortError';
        reject(err);
        // Also cancel the socket. The race above already settled the caller,
        // so a fetch that ignores the signal still cannot hold anyone up.
        ctl?.abort();
      }, ms);
    });
    let run: Promise<any>;
    try {
      run = base(input, ctl ? { ...(init ?? {}), signal: ctl.signal } : init);
    } catch (e) {
      run = Promise.reject(e);
    }
    return Promise.race([run, deadline]).finally(() => {
      if (timer) clearTimeout(timer);
      if (relay && outer) outer.removeEventListener('abort', relay);
    });
  };
}
