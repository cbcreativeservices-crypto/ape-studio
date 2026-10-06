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

import { resetRegisteredLocalStores } from '../storage/localStoreRegistry';
import { resetLocal as resetPaceStore } from '../study/paceStore';
import { resetLocal as resetLastStudyLocation } from '../study/lastStudyLocation';
import { resetLocal as resetHomeCardsStore } from '../home/homeCardsStore';
import {
  clearStoredMeasurements,
  resetLocal as resetMeasurementStore,
} from '../tools/measure/measurementStore';
import { resetLocal as resetLabCompletion } from '../lab/labCompletion';
import { resetLocal as resetLabVisits } from '../lab/labVisits';
import { resetLocal as resetExposureMonitor } from '../audio/exposureMonitor';
import { resetLocal as resetDashboardCache } from '../dashboard/dashboardCache';
import { clearQueuedBatches } from '../study/studyQueueStorage';
import { clearScenarioQueue } from '../study/scenarioQueue';
import { clearQueuedSubmissions } from '../quiz/submissionQueueStorage';
import { resetLocal as resetSettingsMirrors } from '../settings/store';
import { resetLocal as resetPublicProfile } from '../profile/publicProfile';
import { setChainValue } from '../../screens/lab/calc/chainStore';
import { resetSoundSafetyAck } from '../audio/soundSafetyAck';
import { resetTimeTrials } from '../study/timeTrial';
import { resetAskModeCache } from '../permissions/permissionStore';
import { resetPopupSuppression } from '../dev/popupSuppressStore';
import { resetLowLight } from '../settings/lowLight';
import { resetCelebrationsSeen } from '../celebration/celebrationSeen';
import { resetGenCapSession } from '../tools/genCapSession';
import { resetLocal as resetSoundSystemsProgress } from '../soundsystems/progress';
import { resetLocal as resetRoomDesigns } from '../roomdesign/roomDesignStore';
import { resetCalcWorkflowStore } from '../../screens/lab/calc/workflowStore';
import { resetCalcSectionPrefs } from '../../screens/lab/calc/calcPrefs';
import { resetAppUserIdMemo } from './appUserIdMemo';

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
  // no longer be credited to whoever signs in next. The guest `total` wipe
  // keeps it too since 2026-10-04 (see GUEST_KEEP): a guest can never create
  // one, so whatever is here is an account's.
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
   * THE OFFLINE CALCULATOR METER, under the same ruling (night bug pass 1,
   * 2026-10-01). `features/lab/calcUsage.ts` falls back to this device-local
   * rolling week whenever the server cannot answer — it exists precisely so
   * aeroplane mode is not unlimited calculations. Swept by the `ape:*` rule,
   * sign out → sign back in (or Guest Mode) → go offline handed a free account
   * five fresh offline calculations, as often as it liked. It holds a count
   * and a week-start, nothing about who or what — a rate limit, not user memory.
   */
  'ape:calc:usageLocal',
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
  /**
   * "Hide the display" in the labs (2026-09-23). A reading preference about how
   * much room the lesson gets — it records nothing about the account, no
   * progress, no identity, no content. Swept by the generic `ape:*` rule it
   * would silently spring the display back open for somebody who had chosen to
   * read without it, on every boot that churns the identity marker. Same trap,
   * and same ruling, as the two lines above.
   */
  'ape:lab:stageCollapsed',
  'ape:splCalOffset', // device mic calibration — hardware (governance R1)
  'ape:deviceId', // stable per-install id for single-device login (survives switch)
  'ape:homeFirstOpenDone', // device's first app open already happened (Start Here landing, owner 2026-09-29)
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
  return (
    k.startsWith('ape:intro:') ||
    k.startsWith('ape:coach:') ||
    k.endsWith('FsGuide') ||
    // The same device-level first-use family (final round A, 2026-10-02):
    // the onboarding flow's "complete" / "visited" flags and the Home
    // attract cues (the Explore ring). accountWipeRegistry exempts both
    // modules as device-level, but the sweep took their keys, so every
    // returning learner got onboarding and the Explore ring again.
    k.startsWith('ape:onboarding:') ||
    k === 'ape:homeAttract2' ||
    // Topic welcome "seen" flags are keyed per uid (hunt 13, 2026-10-04):
    // safe across a switch, and sweeping them replayed every topic welcome.
    k.startsWith('ape:welcome:seen:')
  );
}

/**
 * ⛔ WHAT A GUEST KEEPS (owner rulings 2026-10-04). "Guest data is ALWAYS
 * deleted, Career Finder included. The ONLY guest data that survives is the
 * usage tracking for the glossary and calculator meters, plus the device id
 * they key on." The guest (`total`) wipe — Guest Mode entry and the launch
 * wipe of a known guest (accountLocalSync) — keeps exactly:
 *   • the two meters: `ape:glossaryUsageLocal`, `ape:calc:usageLocal`;
 *   • the device id the glossary meter is keyed on: `ape:deviceId`;
 *   • the device-level onboarding / intro "seen" family (isOnboardingFlag and
 *     `ape:homeFirstOpenDone`) — "those are not work" (ruling 2);
 *   • device hardware calibration (`ape:splCalOffset`, governance R1: the
 *     physical mic, not a person) and the dev-only overrides;
 *   • an ACCOUNT's unsent graded work (`ape:finalExamQueue*`,
 *     `ape:attemptDraft:*`). A guest can never create these (the server
 *     refuses every attempt start without an account row), so they are never
 *     guest data; each row names its owner and only that account can submit
 *     it. The launch wipe runs for a member who signed out and relaunched, and
 *     must not throw their offline exam away.
 * Everything else under `ape:*` goes — display preferences included (the big-
 * picture totals, keep-glossary-offline, hide-the-display): the 2026-09-01
 * ruling already took a guest's settings, and the KEEP list kept these only
 * for account switches.
 */
const GUEST_KEEP: ReadonlySet<string> = new Set<string>([
  'ape:glossaryUsageLocal',
  'ape:calc:usageLocal',
  'ape:deviceId',
  'ape:homeFirstOpenDone',
  'ape:splCalOffset',
  'ape:finalExamQueue',
  'ape:finalExamQueue:damaged',
  'ape:dev:entitlement',
  'ape:devSuppressPopups',
]);

/** Does this key survive the wipe? Pure — exported for the receipts. */
export function keepsThroughWipe(k: string, opts?: { total?: boolean }): boolean {
  if (!k.startsWith('ape:')) return true; // never ours to touch (sb-* auth, libraries)
  // The in-progress exam/quiz answer draft: see the note in sweepApeKeys.
  if (k.startsWith('ape:attemptDraft:')) return true;
  if (isOnboardingFlag(k)) return true;
  return opts?.total === true ? GUEST_KEEP.has(k) : KEEP.has(k);
}

/**
 * Remove all device-local USER data from AsyncStorage. Only touches keys under
 * the `ape:` namespace (leaves the Supabase `sb-*` auth session and any other
 * library keys alone) and preserves the KEEP allowlist + onboarding flags.
 * Best-effort: a failed removal never throws.
 */
export async function clearLocalAccountData(opts?: { total?: boolean }): Promise<void> {
  await sweepApeKeys(opts);
  // The saved measurement library is NOT an `ape:*` key any more (2026-09-11 —
  // it moved to SQLite when spectrogram grids filled AsyncStorage's shared 6 MB
  // Android database). The sweep above cannot see a table, so it is wiped by
  // name; miss this and the next account signing in on this device inherits the
  // previous one's measurements.
  await clearStoredMeasurements();
  /**
   * ⛔ SWEEP AGAIN, LAST (night bug pass 2, 2026-10-01). Until the caller runs
   * resetAllLocalStores(), every store still holds the DEPARTING user in
   * memory, and any write it makes in the meantime (an exposure-dose flush, a
   * lab completion, a deck reorder) lands AFTER the sweep above — AsyncStorage
   * runs operations in order — or creates a key the sweep never listed. That
   * key then survived the wipe and the next account hydrated it. The window was
   * the whole sweep plus the SQLite clear; a second pass right before handing
   * back shrinks it to one storage round trip. Nothing legitimate writes for
   * the NEXT person before the reset, so whatever appeared here is stale.
   */
  await sweepApeKeys(opts);
}

async function sweepApeKeys(opts?: { total?: boolean }): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    // `total` = a NO-ACCOUNT GUEST wipe: Guest Mode entry, and the launch wipe
    // of a known guest. What it keeps is GUEST_KEEP above (owner rulings
    // 2026-10-04, which replace the 2026-09-01 "onboarding flags go too" and
    // the 2026-09-03 Career Finder exception). An ACCOUNT switch keeps KEEP.
    //
    // ⛔ THE IN-PROGRESS EXAM ANSWER DRAFT SURVIVES EITHER WAY (bug pass 1,
    // 2026-09-20). `ape:attemptDraft:<attemptId>` was swept by the blanket
    // `ape:*` rule. `SingleDeviceGuard` runs this wipe within about a second
    // of a second device signing in, from any screen — including mid-exam.
    // The SERVER attempt stays `in_progress` with `started_at` unchanged, so
    // the learner rejoined the same sitting with zero answers and an
    // already-expired clock, and the screen force-submitted an empty paper.
    // Keeping it is safe: the key carries the ATTEMPT ID, and the submit RPCs
    // raise `not_owner` for an attempt that is not the caller's — so a draft
    // cannot be credited to whoever signs in next.
    const toRemove = keys.filter((k) => !keepsThroughWipe(k, opts));
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
  // EVERY store on the shared safe store (features/storage/localStore.ts)
  // registered its reset at creation: enrollment, enrolled bundles, the term
  // lists and bookmarks, the deck order, the exemption sets, and whatever is
  // migrated next. Nothing below needs a line for them — the hand-kept list
  // drifted every bug pass (2, then 9, then 3 missing), which is why the
  // registry exists (pattern catalog 2026-10-02, closer A2 / guard G2).
  //
  // ⛔ SELF-REGISTERED LAB AND FEATURE MODULES (perf start trim, owner
  // 2026-10-04). Five resets used to be imported here, and importing them put
  // whole screens in the app-start graph (the meter lab + guided lessons, the
  // Mixing kit + engine, the Career Finder + its 217 KB index, the lab-clip
  // decoder, the directory API). Each now calls registerLocalStoreReset when
  // it is first EVALUATED, so this line runs it:
  //   • modMeterC resetLocal        — Signal Detective solved set (B-154)
  //   • kit resetMixingCommitments  — the Mixing focal point + priorities
  //   • careerfinder resetLocal     — Career Finder answers/results/feedback
  //   • labClipBuffer resetLabClipMemory — decoded public clips
  //   • directory resetTaxonomyCache — the chip vocabulary (guard G2)
  // A module never loaded this session has no memory to reset, and every key
  // it owns is `ape:*`, so the sweep in clearLocalAccountData takes it.
  // test/perfStartTrim_20261004.test.ts proves both halves behaviourally.
  resetRegisteredLocalStores();
  resetPaceStore();
  resetLastStudyLocation();
  resetHomeCardsStore();
  resetMeasurementStore();
  resetLabCompletion();
  resetLabVisits();
  // Hearing-exposure dose/sessions/limit — without this the departing user's
  // dose stayed in memory AND was re-persisted under the next account
  // (2026-08-28).
  resetExposureMonitor();
  resetDashboardCache();
  resetSettingsMirrors();
  // Registry 18+ attestation + name/listing sync markers — module-level, so
  // the next account inherited the departing user's attestation and skipped
  // the age gate (B-140).
  resetPublicProfile();
  // Calc Lab chain value (in-memory only, never persisted) — USER working
  // state, so the next person (account switch OR guest) must not inherit an
  // armed "CHAIN ACTIVE" banner. (The Signal Detective solved set and the
  // Career Finder record are self-registered — see the top of this function.)
  setChainValue(null);
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
  // (The Mixing labs' focal point and mix priorities — a stranger's answers
  // shown as the next person's own — are self-registered: see the top.)
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
  // Sound Systems Lab: solved faults, passed capstones, routing/operating
  // exercises — the departing learner's record, not the next one's.
  resetSoundSystemsProgress();
  // Room Design & Monitoring Lab: the saved room designs are the departing
  // user's rooms. Fenced, so an in-flight read cannot restore them.
  resetRoomDesigns();
  // Calculator workflows: the departing user's favourites, recents and saved
  // runs. Fenced, so a write queued before the wipe cannot re-create them.
  resetCalcWorkflowStore();
  // Calculator section open/closed memory (perf hunt 2026-10-03): the next
  // account starts from its own stored state, never the departing one's.
  resetCalcSectionPrefs();
  // (Decoded lab-audio clips and the community directory taxonomy cache are
  // self-registered: see the top of this function.)
  // The remembered users.id (perf decisions A, 2026-10-04): keyed by the auth
  // uid already, and dropped here too so nothing of the departing identity —
  // not even a read still in flight — outlives the wipe.
  resetAppUserIdMemo();
}
