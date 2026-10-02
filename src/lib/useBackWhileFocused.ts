/**
 * useBackWhileFocused — THE way to listen for Android hardware BACK (pattern
 * hunt P13/P21, 2026-10-02). Guard: test/patternP13_20261002.test.ts — a raw
 * `BackHandler.addEventListener` anywhere else in src/ fails the build unless
 * it is on that test's allowlist with a reason.
 *
 *   useBackWhileFocused(active, onBack)
 *
 * - Registers only while `active` (a tray/popup is open, an attempt is live…).
 * - Answers only while this screen is the FOCUSED one; when another screen is
 *   pushed on top, BACK falls through to it (see focusedBack.ts).
 * - `onBack` returns true when it handled BACK, false to let it go on.
 *
 * Registration timing is the caller's, exactly as before the migration: the
 * listener re-registers when `active` or `onBack` changes, so pass a
 * useCallback'd handler with the deps the old effect had. (BackHandler runs the
 * newest registration first — re-registering on open keeps the thing that just
 * opened on top.)
 */
import { useContext, useEffect } from 'react';
import { BackHandler } from 'react-native';
import { NavigationContext } from '@react-navigation/native';
import { focusScopedBack } from './focusedBack';

export function useBackWhileFocused(active: boolean, onBack: () => boolean): void {
  const navCtx = useContext(NavigationContext);
  useEffect(() => {
    if (!active) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', focusScopedBack(navCtx, onBack));
    return () => sub.remove();
  }, [active, onBack, navCtx]);
}
