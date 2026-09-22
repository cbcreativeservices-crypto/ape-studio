/** Stand-ins for topicPct's two imports — neither is exercised by the
 *  trial_passed branch, which returns before they are reached. */
export function studyDisplayPct(states, itemCount, key, requiredPasses) {
  // Mirrors the real shape closely enough for the non-trial assertions:
  // nothing studied -> 0.
  const n = Object.keys(states ?? {}).length;
  if (!itemCount || n === 0) return 0;
  return Math.min(100, Math.round((n / itemCount) * 100));
}
export function isScenariosExempt() {
  return false;
}
