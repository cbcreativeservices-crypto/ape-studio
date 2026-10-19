/**
 * goalStore — what each DJ screen still has to do, for the what's-left screen
 * (learning review 2026-10-18 X5: "show each screen's unmet goal labels").
 *
 * Every screen's goal chips latch while it is open (bits.useVisitGoals); each
 * render reports here which labels are still unmet. The what's-left row of a
 * screen that is not done then reads "Left: Fix the silent start · Pass the
 * check" — from the last visit, or every goal of a screen not yet opened.
 * SESSION state only (a module map, like the shared booth): nothing here is
 * the learner's record, so it is never saved.
 */

const reported = new Map<string, readonly string[]>();

/** The labels whose goals are not latched, in the screen's order. */
export function unmetGoals(labels: readonly string[], latched: readonly boolean[]): string[] {
  return labels.filter((_, i) => !latched[i]);
}

/** A screen reports its goals (called on render; cheap and idempotent). */
export function reportGoals(page: string, labels: readonly string[], latched: readonly boolean[]): void {
  reported.set(page, unmetGoals(labels, latched));
}

/** The what's-left line for a screen: its unmet goals from the last visit,
 *  or all of them when it has not been opened this session. */
export function leftLine(page: string, allLabels: readonly string[]): string {
  const left = reported.get(page) ?? allLabels;
  if (!left.length) return 'Every goal is met — open it once more to count it.';
  return `Left: ${left.join(' · ')}`;
}

/** Forget every report (tests; a fresh session). */
export function clearGoalReports(): void {
  reported.clear();
}

/* ── is a screen's setup still waiting? ──────────────────────────────────
 * A screen's FIRST render still sees the booth the previous screen left
 * (booth/setup.useScreenSetup applies its setup in a layout effect, after
 * that render). A goal judged on that render can be met by a leftover — the
 * capstone's "Power up safely" ticked itself on arrival from a fully powered
 * screen (learning review 2026-10-18, 24 #1, BLOCKER). So a screen's setup
 * is PENDING from its first render until its layout effect has applied it,
 * and bits.useVisitGoals latches nothing while any setup is pending — on
 * every screen, whether or not the screen passes `ready` itself. A mark
 * that never commits (a discarded render) lapses after PENDING_LAPSE_MS. */
export const PENDING_LAPSE_MS = 1500;
const pending = new Map<object, number>();

/** Is some screen's setup not yet applied? (`now` for tests.) */
export function setupPending(now: number = Date.now()): boolean {
  let any = false;
  for (const [k, at] of pending) {
    if (now - at > PENDING_LAPSE_MS) pending.delete(k);
    else any = true;
  }
  return any;
}

export function markSetupPending(key: object, at: number = Date.now()): void {
  if (!pending.has(key)) pending.set(key, at);
}
export function clearSetupPending(key: object): void {
  pending.delete(key);
}

/**
 * One render's latch step (pure; bits.useVisitGoals): every goal hit NOW
 * latches — unless the screen is not `ready` (its setup not yet applied),
 * when nothing new latches. Latched goals never unlatch (credit is kept).
 */
export function latchGoals(prev: readonly boolean[], hits: readonly boolean[], ready: boolean): boolean[] {
  const out = hits.map((_, i) => prev[i] ?? false);
  if (!ready) return out;
  hits.forEach((h, i) => {
    if (h) out[i] = true;
  });
  return out;
}
