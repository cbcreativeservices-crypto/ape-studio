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
let loading: Promise<ReviewState> | null = null;

async function load(): Promise<ReviewState> {
  if (state) return state;
  if (!loading) {
    loading = AsyncStorage.getItem(KEY)
      .then((raw) => (raw ? { ...EMPTY_REVIEW_STATE, ...(JSON.parse(raw) as Partial<ReviewState>) } : { ...EMPTY_REVIEW_STATE }))
      .catch(() => ({ ...EMPTY_REVIEW_STATE }))
      .then((s) => {
        state = s;
        return s;
      });
  }
  return loading;
}

async function save(next: ReviewState): Promise<void> {
  state = next;
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* best effort — a lost counter only delays a prompt */
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
  await save(recordSession(s, new Date()));
}

/** Contexts that veto a prompt right now, regardless of the counters. */
function currentBlockers(): ReviewBlocker[] {
  const b: ReviewBlocker[] = [];
  if (isMicActive()) b.push('measuring'); // never interrupt a live measurement
  return b;
}

/**
 * Record a genuine success and, if the user has earned the right to be asked,
 * ask. Returns true only when the native prompt was actually REQUESTED (the OS
 * may still decide not to show it). Safe to call from any screen; never throws.
 */
export async function noteHighValueEvent(event: HighValueEvent): Promise<boolean> {
  try {
    const s = recordHighValueEvent(await load());
    await save(s);
    const version = appVersion();
    const verdict = evaluateReviewEligibility({ state: s, version, nowMs: Date.now(), event, blockers: currentBlockers() });
    if (!verdict.eligible) return false;
    const lib = optionalModule<StoreReviewLib>('expo-store-review');
    if (!lib || !(await lib.isAvailableAsync().catch(() => false))) return false;
    // Record BEFORE asking: if the OS shows the sheet and the app is killed
    // mid-prompt, we must not ask again on the next success.
    await save(recordRequested(s, version, Date.now()));
    await lib.requestReview();
    return true;
  } catch {
    return false;
  }
}
