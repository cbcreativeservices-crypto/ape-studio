/**
 * clearLocalAccountData / resetAllLocalStores — device-local account wipe
 * (user bug 2026-07-26).
 *
 * Deleting the account, or logging in as a DIFFERENT user, erases the BACKEND
 * but historically left the previous user's device-local state on the phone
 * (old certificate/program, enrollment list, progress mirror, bookmarks…). Two
 * gaps are closed here:
 *   1. clearLocalAccountData() — removes every `ape:*` AsyncStorage key EXCEPT a
 *      small KEEP allowlist (device hardware calibration + dev-only overrides).
 *   2. resetAllLocalStores() — resets the IN-MEMORY module caches of every
 *      external store so subscribed `useX()` hooks re-render empty immediately.
 *      `expo-updates` is NOT installed, so a JS reload isn't available; the
 *      module-level caches survive navigation, so clearing AsyncStorage alone
 *      would leave stale data on screen until the next cold launch.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

import { resetLocal as resetEnrollmentStore } from '../enrollment/enrollmentStore';
import { resetLocal as resetEnrolledBundlesStore } from '../enrollment/enrolledBundlesStore';
import { resetLocal as resetFlaggedStore } from '../flags/flaggedStore';
import { resetLocal as resetPaceStore } from '../study/paceStore';
import { resetLocal as resetLastStudyLocation } from '../study/lastStudyLocation';
import { resetLocal as resetHomeCardsStore } from '../home/homeCardsStore';
import { resetLocal as resetMeasurementStore } from '../tools/measure/measurementStore';

/**
 * Keys that MUST survive an account wipe: device-hardware calibration (per
 * governance R1 — tied to the physical mic, not the user) and dev-only
 * overrides. Everything else under `ape:*` is user data and is removed.
 */
const KEEP: ReadonlySet<string> = new Set<string>([
  'ape:splCalOffset', // device mic calibration — hardware (governance R1)
  'ape:dev:commercialMode', // dev-only override
  'ape:dev:entitlement', // dev-only override
  'ape:devSuppressPopups', // dev-only override
]);

/**
 * Remove all device-local USER data from AsyncStorage. Only touches keys under
 * the `ape:` namespace (leaves the Supabase `sb-*` auth session and any other
 * library keys alone) and preserves the KEEP allowlist. Best-effort: a failed
 * removal never throws.
 */
export async function clearLocalAccountData(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const toRemove = keys.filter((k) => k.startsWith('ape:') && !KEEP.has(k));
    if (toRemove.length > 0) {
      await AsyncStorage.multiRemove(toRemove);
    }
  } catch {
    // best-effort — a storage failure must not block sign-out / account switch
  }
}

/**
 * Reset the in-memory caches of every external store so live hooks refresh
 * immediately WITHOUT an app reload. Each store re-hydrates lazily from the
 * (now-cleared) storage on its next read, so enrollment re-seeds its free
 * topics = the correct new-user default. Safe to call even with no subscribers.
 */
export function resetAllLocalStores(): void {
  resetEnrollmentStore();
  resetEnrolledBundlesStore();
  resetFlaggedStore();
  resetPaceStore();
  resetLastStudyLocation();
  resetHomeCardsStore();
  resetMeasurementStore();
}
