/**
 * focusScopedBack — the pure half of useBackWhileFocused (pattern hunt P13/P21,
 * 2026-10-02). No React, no react-native: node tests import it directly.
 *
 * Android BACK handlers run newest-first and stay registered while their screen
 * is merely COVERED by another native-stack screen (Help, Paywall, Glossary…).
 * A handler that does not ask "am I the focused screen?" eats the BACK meant for
 * the screen on top: the hidden tray/popup closes and the visible screen stays.
 * LabNavBar and DockTray learned this on 2026-10-01; this is that idiom, once.
 *
 * Outside any navigator (`nav` null/undefined) there is nothing to cover the
 * component, so the handler always runs.
 */
export type FocusProbe = { isFocused(): boolean } | null | undefined;

export function focusScopedBack(nav: FocusProbe, onBack: () => boolean): () => boolean {
  return () => {
    if (nav && !nav.isFocused()) return false;
    return onBack();
  };
}

/** How long the second BACK has to arrive. Matches ToastAndroid.SHORT. */
export const SECOND_BACK_MS = 2000;

/**
 * secondBackToExit — BACK on Home leaves the app only when asked twice (owner
 * 2026-11-05, Pixel: a sideways swipe from the screen edge is Android's back
 * gesture, so a swipe at Home's card carousel left the app by accident).
 *
 * Android decides what counts as the gesture and an app cannot soften it without
 * native code, so the first BACK is held (true = handled) and `hint` tells the
 * user. A second BACK inside the window returns false, which lets Android leave
 * as it always has. The window restarts after that, so coming back to the app
 * needs two again.
 */
export function secondBackToExit(hint: () => void, now: () => number = Date.now): () => boolean {
  let armedAt: number | null = null;
  return () => {
    const t = now();
    if (armedAt !== null && t - armedAt <= SECOND_BACK_MS) {
      armedAt = null;
      return false;
    }
    armedAt = t;
    hint();
    return true;
  };
}
