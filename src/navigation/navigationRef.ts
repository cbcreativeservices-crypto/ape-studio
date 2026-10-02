/**
 * navigationRef — app-wide navigation handle for code OUTSIDE the navigator
 * (root overlays). Used by the Training-Lab preview overlay to goBack / open the
 * Paywall from a component mounted beside NavigationContainer (owner 2026-08-02).
 */
import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from './types';
import type { GoBackNav } from '../lib/safeGoBack';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

/**
 * rootBack — the root handle shaped for safeGoBack (pattern P9b, 2026-10-02).
 * A root overlay cannot ask "is the screen that asked still focused?", so the
 * guard it gets is the rest of safeGoBack: something to go back to, and ONE
 * leave per LEAVE_WINDOW_MS. One stable object, so the window holds across
 * taps: `safeGoBack(rootBack)`.
 */
export const rootBack: GoBackNav = {
  isFocused: () => navigationRef.isReady(),
  canGoBack: () => navigationRef.isReady() && navigationRef.canGoBack(),
  goBack: () => navigationRef.goBack(),
};
