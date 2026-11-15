/**
 * What's-left rows for the labs F5 owns (Foundations of Sound, Microphone
 * Principles, Speaker Placement, Wave Physics, Room Design).
 *
 * Phase 2 (2026-11-14, S2's end-screen API): each unfinished row names ITS
 * missing piece; the rule every row shares is said once.
 * Phase 3 (owner's decision 1, "done = work done"): a module no longer counts
 * when it is opened. It counts when its own goal is met: its CHECK YOURSELF
 * answered right; for a module with no card, moving on from it with NEXT;
 * for Room Design's hands-on modules, a change made to the room there.
 */
export type ModuleGoal = 'check' | 'next' | 'work' | 'report';

const GOAL_LINE: Record<ModuleGoal, string> = {
  check: 'answer its CHECK YOURSELF right.',
  next: 'read it through and press NEXT at its foot.',
  work: 'change the room on it.',
  // Room Design's SUGGESTED SETUPS (2026-11-14): its work is reading a
  // setup's report or trying one.
  report: 'open a setup’s report, or try one.',
};

/** One row's line: what is still to do, then what the module holds. */
export function moduleGoalDetail(goal: ModuleGoal, learning: string | undefined): string {
  const l = learning?.trim();
  const inside = l ? ` Inside: ${l.charAt(0).toLowerCase()}${l.slice(1)}` : '';
  return `Still to do: ${GOAL_LINE[goal]}${inside}`;
}

/** The once-only HOW A MODULE COUNTS sentence for a check-credited lab. */
export function goalCounts(opts: { next?: boolean } = {}): string {
  const parts = ['A module counts once its CHECK YOURSELF is answered right'];
  if (opts.next) parts.push('a module with no check counts when you move on from it with NEXT');
  return `${parts.join('; ')}. Opening a module does not count it, and nothing you have already earned is taken away.`;
}

/** Room Design: reading modules count on NEXT, hands-on ones on a change. */
export function roomCounts(): string {
  return 'A reading module counts when you move on from it with NEXT; a hands-on module counts once you change the room on it, and Suggested setups once you open a setup’s report or try one. Opening a module does not count it, and nothing already counted is taken away.';
}
