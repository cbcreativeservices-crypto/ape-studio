/**
 * reviewPrompt — the runtime half of the store-review flow (owner 2026-09-06,
 * launch readiness). The DECISION lives in reviewEligibility.ts (pure, tested);
 * this file persists the counters, records sessions and successes, and asks
 * the OS for the native prompt when — and only when — the decision says so.
 *
 * Both stores rank on ratings and treat the prompt as quota-controlled: iOS
 * may simply not show it. So this never promises a prompt, never pre-screens
 * ("do you like the app?"), never routes unhappy users away from the store,
 * and records only that we ASKED — the user's answer is theirs.
 *
 * expo-store-review and expo-application ship in the build after 2026-09-06;
 * on an older client both resolve to null and everything here is a no-op.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { optionalModule } from '../tools/capture/optionalModule';
import { isMicActive } from '../audio/audioOutputStore';
import { areOverlaysSuppressed } from '../dev/popupSuppressStore';
import {
  EMPTY_REVIEW_STATE,
  evaluateReviewEligibility,
  recordHighValueEvent,
  recordRequested,
  recordSession,
  type HighValueEvent,
  type ReviewBlocker,
  type ReviewState,
} from './reviewEligibility';

const KEY = 'ape:review:v1';

type StoreReviewLib = {
  isAvailableAsync(): Promise<boolean>;
  hasAction(): Promise<boolean>;
  requestReview(): Promise<void>;
};
type ApplicationLib = { nativeApplicationVersion: string | null };

let state: ReviewState | null = null;
let loading: Promise<ReviewState | null> | null = null;

/**
 * The counters, or NULL when the storage read FAILED (wave 2, 2026-10-02).
 *
 * The hand-rolled load answered a read that threw with EMPTY counters and
 * cached them, so the next save wrote "never asked, zero sessions" over the
 * real record — including the once-per-version "already asked" stamp, which
 * is what stops the app asking again. A failed read now stays unread (the
 * next call tries again) and every caller does nothing on it: a lost session
 * count only delays a prompt, while a lost stamp re-asks. A garbled blob is
 * still treated as empty — there is nothing usable in it to protect.
 */
async function load(): Promise<ReviewState | null> {
  if (state) return state;
  if (!loading) {
    loading = (async () => {
      let raw: string | null;
      try {
        raw = await AsyncStorage.getItem(KEY);
      } catch {
        loading = null; // readFailed: unread, not empty — retry next time
        return null;
      }
      let s: ReviewState;
      try {
        s = raw ? { ...EMPTY_REVIEW_STATE, ...(JSON.parse(raw) as Partial<ReviewState>) } : { ...EMPTY_REVIEW_STATE };
      } catch {
        s = { ...EMPTY_REVIEW_STATE };
      }
      state = s;
      return s;
    })();
  }
  return loading;
}

async function save(next: ReviewState): Promise<boolean> {
  state = next;
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
    return true;
  } catch {
    /* best effort — a lost counter only delays a prompt */
    return false;
  }
}

/** The installed app version the once-per-version rule is keyed on. */
function appVersion(): string {
  const app = optionalModule<ApplicationLib>('expo-application');
  return app?.nativeApplicationVersion ?? Constants.expoConfig?.version ?? '0.0.0';
}

/** Call once per app launch (App.tsx). Counts the session and the active day. */
export async function recordAppSession(): Promise<void> {
  const s = await load();
  if (!s) return; // read failed — never save over the stored counters
  await save(recordSession(s, new Date()));
}

/** Contexts that veto a prompt right now, regardless of the counters. */
function currentBlockers(): ReviewBlocker[] {
  const b: ReviewBlocker[] = [];
  if (isMicActive()) b.push('measuring'); // never interrupt a live measurement
  // Low-Light Production Mode: nothing may auto-appear. This is a full-screen
  // OS sheet and the mode is used in dark rooms during shows — it was the only
  // auto-appearing surface in the app with no such gate (2026-09-17).
  //
  // Blocking here rather than at the moment of asking also protects the
  // once-per-version allowance: `recordRequested` is written just before the
  // sheet is requested, so a prompt fired into a suppressed app would have
  // spent that allowance permanently without anyone seeing it.
  if (areOverlaysSuppressed()) b.push('low_light');
  return b;
}

/**
 * Record a genuine success and, if the user has earned the right to be asked,
 * ask. Returns true only when the native prompt was actually REQUESTED (the OS
 * may still decide not to show it). Safe to call from any screen; never throws.
 */
export async function noteHighValueEvent(event: HighValueEvent): Promise<boolean> {
  try {
    const loaded = await load();
    if (!loaded) return false; // read failed: the "already asked" stamp is unknown
    const s = recordHighValueEvent(loaded);
    await save(s);
    const version = appVersion();
    const verdict = evaluateReviewEligibility({ state: s, version, nowMs: Date.now(), event, blockers: currentBlockers() });
    if (!verdict.eligible) return false;
    const lib = optionalModule<StoreReviewLib>('expo-store-review');
    if (!lib || !(await lib.isAvailableAsync().catch(() => false))) return false;
    // Record BEFORE asking: if the OS shows the sheet and the app is killed
    // mid-prompt, we must not ask again on the next success.
    // …and only if the stamp actually landed: a prompt whose record failed to
    // save would be asked again on the next success.
    if (!(await save(recordRequested(s, version, Date.now())))) return false;
    await lib.requestReview();
    return true;
  } catch {
    return false;
  }
}
