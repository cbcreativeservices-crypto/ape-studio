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
