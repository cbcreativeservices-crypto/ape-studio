/**
 * navigationRef — app-wide navigation handle for code OUTSIDE the navigator
 * (root overlays). Used by the Training-Lab preview overlay to goBack / open the
 * Paywall from a component mounted beside NavigationContainer (owner 2026-08-02).
 */
import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from './types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();
