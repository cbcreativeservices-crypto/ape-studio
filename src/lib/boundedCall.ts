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
