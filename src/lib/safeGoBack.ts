/**
 * safeGoBack — THE way a press leaves a screen (pattern hunt P9b, 2026-10-02).
 * Guard: test/patternP9b_20261002.test.ts — a raw `.goBack()` anywhere else in
 * src/ fails the build unless it is on that test's allowlist with a reason.
 *
 *   <Pressable onPress={() => safeGoBack(navigation)} … />
 *
 * The bug class: `navigation.goBack()` dispatches GO_BACK with `source` = this
 * screen's route key. A quick double tap fires it twice. The first pops this
 * screen; for the second, the source route is gone, RN7's StackRouter returns
 * null, and the action BUBBLES to the parent navigator — the tab navigator
 * (switches tab) or the root stack (pops the screen under a nested stack). Two
 * levels for one intent: "a doubled RETURN popped the screen under the lab".
 *
 * The rule, checked at call time (the navigation store updates synchronously,
 * so a popped screen reads unfocused at once):
 *   1. this screen is still the FOCUSED one — its route is still in front and
 *      nothing is on top of it (a popped route never is);
 *   2. `canGoBack()` — there is somewhere to go (no "GO_BACK was not handled");
 *   3. the same screen did not already go back inside LEAVE_WINDOW_MS. A
 *      window, not a one-way latch (the LabNavBar idiom): a screen whose leave
 *      was stopped by a `beforeRemove` confirm still answers the next real tap.
 *
 * Returns true when it went back. No React and no react-native imports, so the
 * node tests drive it with RN7's real StackRouter.
 *
 * Android hardware BACK is NOT this: that is useBackWhileFocused.
 */
export type GoBackNav = {
  isFocused(): boolean;
  canGoBack(): boolean;
  goBack(): void;
};

/** Same window as LabNavBar's claimLabLeave. */
export const LEAVE_WINDOW_MS = 700;

const lastLeave = new WeakMap<object, number>();

export function safeGoBack(navigation: GoBackNav | null | undefined): boolean {
  if (!navigation) return false;
  if (!navigation.isFocused()) return false;
  if (!navigation.canGoBack()) return false;
  const now = Date.now();
  const last = lastLeave.get(navigation);
  if (last !== undefined && now - last < LEAVE_WINDOW_MS) return false;
  lastLeave.set(navigation, now);
  navigation.goBack();
  return true;
}
