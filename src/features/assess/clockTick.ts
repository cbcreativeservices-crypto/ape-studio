/**
 * Countdown state for the quiz and the final exam (perf hunt 2026-10-03).
 *
 * Both papers tick every 250 ms so the force-submit lands on time, and each
 * tick used to set the clock state — re-rendering the WHOLE paper (question,
 * options, figure) four times a second while the learner was tapping answers.
 *
 * The clock only SHOWS whole seconds (`Math.ceil(ms / 1000)`), and the only
 * other readers ask "under a minute?" and "still running?". So a tick keeps the
 * previous value — React then skips the render — unless one of those three
 * things changed. Every visible change still lands on the same tick as before.
 */
export function nextClockMs(prev: number, left: number): number {
  const same =
    Math.ceil(prev / 1000) === Math.ceil(left / 1000) &&
    (prev < 60_000) === (left < 60_000) &&
    (prev > 0) === (left > 0);
  return same ? prev : left;
}
