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
import { resetLocal as resetScenarioExempt } from '../study/scenarioExempt';
import { resetLocal as resetHomeCardsStore } from '../home/homeCardsStore';
import { resetLocal as resetMeasurementStore } from '../tools/measure/measurementStore';
import { resetLocal as resetLabCompletion } from '../lab/labCompletion';
import { resetLocal as resetExposureMonitor } from '../audio/exposureMonitor';
import { resetLocal as resetDashboardCache } from '../dashboard/dashboardCache';
import { clearQueuedBatches } from '../study/studyQueueStorage';
import { clearQueuedSubmissions } from '../quiz/submissionQueueStorage';
import { resetLocal as resetDeckOrder } from '../dashboard/deckOrderStore';
import { resetLocal as resetSettingsMirrors } from '../settings/store';
import { resetLocal as resetPublicProfile } from '../profile/publicProfile';
import { setChainValue } from '../../screens/lab/calc/chainStore';
import { resetLocal as resetDetectiveSolved } from '../../screens/lab/meter/modules/modMeterC';
import { resetLocal as resetCareerFinderStore } from '../careerfinder/store';

/**
 * Keys that MUST survive an account wipe: device-hardware calibration (per
 * governance R1 — tied to the physical mic, not the user) and dev-only
 * overrides. Everything else under `ape:*` is user data and is removed.
 */
const KEEP: ReadonlySet<string> = new Set<string>([
  'ape:splCalOffset', // device mic calibration — hardware (governance R1)
  'ape:deviceId', // stable per-install id for single-device login (survives switch)
  'ape:dev:commercialMode', // dev-only override
  'ape:dev:entitlement', // dev-only override
  'ape:devSuppressPopups', // dev-only override
]);

/**
 * Onboarding / coach-mark "seen once" flags are DEVICE-level first-use state, NOT
 * account data — a returning or guest user on the same device has already seen
 * the tutorials. They must survive an account wipe, or every logout / guest entry
 * would replay every intro popup (user bug 2026-08-13). Kept BY PREFIX/SUFFIX
 * since they're an open family: `ape:intro:*` (all screen intros + app welcome +
 * the amplitude orientation), the `…FsGuide` fullscreen-guide keys, and
 * `ape:coach:*` (the 0–5 retire counters for the same coach-mark idiom — added
 * 2026-08-28: they were being swept, so a fully-retired hint came back after
 * every logout, which is the exact bug this exception exists to prevent).
 * Settings → "Reset onboarding hints" is the intended way to replay them.
 */
function isOnboardingFlag(k: string): boolean {
  return k.startsWith('ape:intro:') || k.startsWith('ape:coach:') || k.endsWith('FsGuide');
}

/**
 * Remove all device-local USER data from AsyncStorage. Only touches keys under
 * the `ape:` namespace (leaves the Supabase `sb-*` auth session and any other
 * library keys alone) and preserves the KEEP allowlist + onboarding flags.
 * Best-effort: a failed removal never throws.
 */
export async function clearLocalAccountData(opts?: { total?: boolean }): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    // `total` = a NO-ACCOUNT GUEST entry (owner ruling 2026-09-01): "a guest is
    // always wiped 100% clean — that includes ALL app settings. Once an account
    // is made, then we begin to remember anything about the user. We break that
    // promise if we allow anything to be stored." So a guest also loses the
    // onboarding/coach flags that an ACCOUNT switch deliberately keeps (the
    // 2026-08-13 fix, which exists so signing out doesn't replay every intro —
    // that fix still stands for account users). The KEEP allowlist survives
    // either way: it is device hardware calibration, the install id the
    // single-device login needs, and dev-only overrides — never user memory.
    const toRemove = keys.filter(
      (k) => k.startsWith('ape:') && !KEEP.has(k) && (opts?.total === true || !isOnboardingFlag(k)),
    );
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
  resetScenarioExempt();
  resetHomeCardsStore();
  resetMeasurementStore();
  resetLabCompletion();
  // Hearing-exposure dose/sessions/limit — without this the departing user's
  // dose stayed in memory AND was re-persisted under the next account
  // (2026-08-28).
  resetExposureMonitor();
  resetDashboardCache();
  resetDeckOrder();
  resetSettingsMirrors();
  // Registry 18+ attestation + name/listing sync markers — module-level, so
  // the next account inherited the departing user's attestation and skipped
  // the age gate (B-140).
  resetPublicProfile();
  // Calc Lab chain value (in-memory only, never persisted) and the Signal
  // Detective solved-set cache — both are USER working state, so the next
  // person (account switch OR guest) must not inherit an armed "CHAIN ACTIVE"
  // banner or the departing user's SOLVED count (B-154).
  setChainValue(null);
  resetDetectiveSolved();
  // Career Finder answers, results, saved families and Beta feedback are the
  // departing user's — the next person starts the questionnaire fresh.
  resetCareerFinderStore();
  // Offline SQLite/in-memory queues carry NO user id — if not dropped here, a
  // departing user's queued study batches / quiz submissions would replay under
  // the NEXT user's session and be credited to the wrong account. Their local
  // progress mirror is already wiped on switch, so dropping the queue is
  // consistent (owner debug audit 2026-08-21).
  clearQueuedBatches();
  clearQueuedSubmissions();
}
