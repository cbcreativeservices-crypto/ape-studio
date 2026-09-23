/** Stand-ins for topicPct's imports. `studyDisplayPct` and `isScenariosExempt`
 *  are not exercised by the trial_passed branch, which returns before they are
 *  reached; `isTermsExempt` IS exercised, so it is controllable. */
export function studyDisplayPct(states, itemCount, key, requiredPasses) {
  // Mirrors the real shape closely enough for the non-trial assertions:
  // nothing studied -> 0. And, like the real one, a zero item count -> 0,
  // which is the whole reason the terms exemption exists.
  const n = Object.keys(states ?? {}).length;
  if (!itemCount || n === 0) return 0;
  return Math.min(100, Math.round((n / itemCount) * 100));
}
export function isScenariosExempt() {
  return false;
}

/** Topics the test has declared CONFIRMED-empty. Mutable so a test can set up
 *  both sides of the branch without touching AsyncStorage. */
export const termsExemptIds = new Set();
export function isTermsExempt(id) {
  return termsExemptIds.has(id);
}
