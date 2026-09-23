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
import { resetLocal as resetTermsExempt } from '../study/termsExempt';
import { resetLocal as resetHomeCardsStore } from '../home/homeCardsStore';
import {
  clearStoredMeasurements,
  resetLocal as resetMeasurementStore,
} from '../tools/measure/measurementStore';
import { resetLocal as resetLabCompletion } from '../lab/labCompletion';
import { resetLocal as resetExposureMonitor } from '../audio/exposureMonitor';
import { resetLocal as resetDashboardCache } from '../dashboard/dashboardCache';
import { clearQueuedBatches } from '../study/studyQueueStorage';
import { clearScenarioQueue } from '../study/scenarioQueue';
import { clearQueuedSubmissions } from '../quiz/submissionQueueStorage';
import { resetLocal as resetDeckOrder } from '../dashboard/deckOrderStore';
import { resetLocal as resetSettingsMirrors } from '../settings/store';
import { resetLocal as resetPublicProfile } from '../profile/publicProfile';
import { setChainValue } from '../../screens/lab/calc/chainStore';
import { resetLocal as resetDetectiveSolved } from '../../screens/lab/meter/modules/modMeterC';
import { resetLocal as resetCareerFinderStore } from '../careerfinder/store';
import { resetSoundSafetyAck } from '../audio/soundSafetyAck';
import { resetTimeTrials } from '../study/timeTrial';
import { resetAskModeCache } from '../permissions/permissionStore';
import { resetPopupSuppression } from '../dev/popupSuppressStore';
import { resetLowLight } from '../settings/lowLight';
import { resetMixingCommitments } from '../../screens/lab/mixing/kit';
import { resetCelebrationsSeen } from '../celebration/celebrationSeen';
import { resetGenCapSession } from '../tools/genCapSession';

/**
 * Keys that MUST survive an account wipe: device-hardware calibration (per
 * governance R1 — tied to the physical mic, not the user) and dev-only
 * overrides. Everything else under `ape:*` is user data and is removed.
 */
const KEEP: ReadonlySet<string> = new Set<string>([
  // A GRADED FINAL EXAM THAT HAS NOT REACHED THE SERVER (2026-09-17).
  //
  // This was being swept by the generic `ape:*` rule, with nothing anywhere
  // mentioning it — unlike the quiz and study queues, which are dropped
  // deliberately and by name, each with a written reason. So a learner who sat
  // the capstone offline, was told "your exam is saved and will be submitted
  // automatically", and then signed out, lost it silently.
  //
  // Keeping it is now safe: every queued row records the user it belongs to and
  // `replayExamSubmissions` submits only the current session's rows, so it can
  // no longer be credited to whoever signs in next. A guest `total` wipe still
  // removes it below — a guest cannot sit a graded exam in the first place.
  'ape:finalExamQueue',
  'ape:finalExamQueue:damaged', // its quarantine copy, for the same reason
  // THE FREE-TIER GLOSSARY METER (2026-09-17, bug-hunt pass 5).
  //
  // This is the ONLY limit on free access to 26,855 definitions, and the sweep
  // was resetting it: a guest who hit the lock tapped "Exit to menu" → any sign-in
  // button → GUEST MODE and had fourteen fresh lookups, for as long as they cared
  // to repeat it. The post-gateway half resets too (a new anonymous uid has no
  // usage row), so both meters died in the same wipe.
  //
  // Keeping it does NOT break the owner's "a guest is remembered in no way"
  // ruling: it holds a count and a week-start, no identity and nothing about
  // what was looked up — the same standing as the device id it sits beside. A
  // ⛔ AND THE `total` WIPE MUST NOT REMOVE IT EITHER (2026-09-20).
  //
  // The exemption on the `total` branch below used to name this key, and
  // Guest Mode entry (AuthScreen's enterGuest) is the ONLY caller that passes
  // `total`. So the exact repro written above was never actually closed: hit
  // the lock, tap Guest Mode, get fourteen more, repeat. Three taps for
  // unlimited access to the whole glossary.
  //
  // There is no "deliberate escape" to protect here — the escape WAS the
  // exploit. Someone genuinely starting over loses nothing that matters: a
  // count and a week-start.
  'ape:glossaryUsageLocal',
  /**
   * A DISPLAY PREFERENCE, NOT USER DATA (2026-09-22).
   *
   * The Profile screen's opt-in for whole-academy progress totals. It records
   * nothing about the account — no progress, no identity, no content — only
   * whether this device shows the academy-wide figures at all. Swept by the
   * generic `ape:*` rule it silently reset to OFF on boots where the anonymous
   * session churns the identity marker, so a learner who turned it on found it
   * off again with no explanation, every time.
   *
   * Keeping it across an account switch is harmless: the worst case is the next
   * person on this device seeing a totals toggle already on, which discloses
   * nothing about the previous one.
   */
  'ape:profile:showBigPicture',
  /**
   * "Keep the glossary on this phone" (2026-09-22). A device preference about
   * how much of a 5.4 MB corpus to hold locally — it says nothing about the
   * account. Swept by the generic `ape:*` rule it would silently revert to on
   * for somebody who had deliberately turned it off, and re-spend their data.
   * Same trap as the line above; see the 2026-09-22 engineering lessons.
   */
  'ape:glossary:autoOffline',
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
      (k) =>
        k.startsWith('ape:') &&
        /**
         * ⛔ THE IN-PROGRESS EXAM ANSWER DRAFT SURVIVES, FOR THE SAME REASON
         * THE EXAM QUEUE DOES (bug pass 1, 2026-09-20).
         *
         * `ape:attemptDraft:<attemptId>` was swept by the blanket `ape:*`
         * rule. `SingleDeviceGuard` runs this wipe within about a second of a
         * second device signing in, from any screen — including mid-exam. The
         * SERVER attempt stays `in_progress` with `started_at` unchanged, so
         * the learner rejoins the same sitting with zero answers and an
         * already-expired clock, and the screen force-submits an empty paper
         * that is scored and recorded as a real attempt.
         *
         * Keeping it is safe for the same reason the queue is: the key carries
         * the ATTEMPT ID, and `submit_final_exam` raises `not_owner` for an
         * attempt that is not the caller's — so a draft cannot be credited to
         * whoever signs in next. A guest `total` wipe still removes it below;
         * a guest cannot sit a graded exam.
         */
        !(k.startsWith('ape:attemptDraft:') && opts?.total !== true) &&
        // A guest is wiped 100% clean, so `total` overrides the exam-queue
        // entries too — but never the hardware calibration, the install id,
        // the dev overrides, or THE GLOSSARY METER, which is a rate limit
        // rather than user memory and whose whole purpose is to survive this.
        !(KEEP.has(k) && !(opts?.total === true && k.startsWith('ape:finalExamQueue'))) &&
        (opts?.total === true || !isOnboardingFlag(k)),
    );
    if (toRemove.length > 0) {
      await AsyncStorage.multiRemove(toRemove);
    }
  } catch {
    // best-effort — a storage failure must not block sign-out / account switch
  }
  // The saved measurement library is NOT an `ape:*` key any more (2026-09-11 —
  // it moved to SQLite when spectrogram grids filled AsyncStorage's shared 6 MB
  // Android database). The sweep above cannot see a table, so it is wiped by
  // name; miss this and the next account signing in on this device inherits the
  // previous one's measurements.
  await clearStoredMeasurements();
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
  resetTermsExempt();
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
  // Scenarios keeps its own queue (AsyncStorage, different shape) — its rows
  // carry an achievement id but no user, so they MUST not survive a switch.
  void clearScenarioQueue();
  // The hearing-damage warning acceptance (2026-09-17). The stored key is swept
  // by the sweep above, but `isAcknowledged()` reads a module-level mirror that
  // is not - so the NEXT person on this phone got sound with no warning, and no
  // acceptance record of their own was ever written. This is the safety gate;
  // it is the one entry here that must never be missed.
  // A LIVE TIMER, not just a cache (2026-09-17). A time trial started by the
  // departing user kept ticking through the sign-out and fired
  // `credit_time_trial` under whoever arrived next — study credit written to the
  // wrong account, which is the exact failure this registry exists to prevent.
  resetTimeTrials();
  // Consent decisions belong to a PERSON, not a handset: the departing user's
  // "never ask me again" for the camera, mic, photos or location was inherited
  // by the next account (2026-09-17).
  resetAskModeCache();
  // Low-Light Production Mode silences every auto-appearing overlay in the app,
  // safety notices included. The next person must not be handed a silenced app
  // they never switched on.
  resetPopupSuppression();
  // The dim-and-silence mode itself, which is a different module from the
  // overlay suppression above and was missed for the same reason.
  resetLowLight();
  // The Mixing labs echo the learner's own focal point and mix priorities back
  // at them later in the lab. Left in memory, the next person was shown a
  // stranger's answers as their own.
  resetMixingCommitments();
  resetSoundSafetyAck();
  // ⚠️ HEARING SAFETY. The generator's output-cap unlock is a SAFETY gate: the
  // departing user confirmed a prompt accepting louder-than-capped output, and
  // that confirmation is theirs alone. `resetGenCapSession` was written for
  // exactly this ("e.g. on explicit sign-out") and then had ZERO callers, so
  // the unlock survived an account switch — the next person, who was never
  // shown the prompt and never agreed to anything, got an already-unlocked
  // generator and no second ask (the screen restores the native unlock
  // silently on re-entry, by design).
  //
  // Of everything in this function this is the only one that can hurt somebody
  // rather than confuse them.
  resetGenCapSession();
  // The "already celebrated" set is the departing user's. Left in memory it was
  // re-persisted under the new account, and the next member lost the
  // celebration for their first certificate to somebody else's history.
  resetCelebrationsSeen();
}
