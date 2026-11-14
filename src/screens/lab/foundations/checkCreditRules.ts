/**
 * "Done = work done" (owner's decision 1, 2026-11-14, lab fix round phase 3):
 * a module counts when its own check is met, not when it is opened. Pure rule
 * for a module's CHECK YOURSELF cards: the module is done once EVERY card it
 * drew has been answered right. A module with no card is never done by this
 * rule (its host gives it its own goal).
 */
export function allChecksSolved(registered: ReadonlySet<string>, solved: ReadonlySet<string>): boolean {
  if (registered.size === 0) return false;
  for (const id of registered) if (!solved.has(id)) return false;
  return true;
}
