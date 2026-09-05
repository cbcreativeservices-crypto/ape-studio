/**
 * reviewEligibility — decide WHETHER to ask for a store review (owner SEO
 * brief §10). Pure, dependency-free and fully tested: the decision is the part
 * that must be right, and the native call is a one-liner on top of it.
 *
 * Ratings and recent review volume are ranking inputs on both stores, so asking
 * well is discoverability work. Asking badly is worse than not asking: the OS
 * quota is spent, and on iOS the prompt simply does not appear if the system
 * decides it should not.
 *
 * RULES THAT ARE NOT NEGOTIABLE (brief §10, and both stores' own guidelines):
 *  • Ask ONLY straight after a natural success moment.
 *  • NEVER at first launch, during onboarding, mid-measurement, right after a
 *    purchase, after an error, or after a denied permission.
 *  • NEVER pre-screen with "do you like the app?" and never route unhappy users
 *    away from the store. That is review gating and it is against the rules.
 *  • NEVER ask for five stars.
 *  • Track that we ASKED. Never track, infer or store what the user chose —
 *    the rating is private and the OS does not tell us anyway.
 */

/** Tunables in one place so they can be moved without touching the logic. */
export const REVIEW_RULES = {
  minSessions: 3,
  minActiveDays: 2,
  minHighValueEvents: 2,
  minDaysSinceInstall: 7,
  cooldownDays: 120,
  /** At most one request per app version, on top of everything else. */
  oncePerVersion: true,
} as const;

/**
 * The high-value moments that may lead to a request. Each is a genuine
 * success the user chose to reach — never a passive milestone like "opened the
 * app" or a commercial one like "subscribed".
 */
export const HIGH_VALUE_EVENTS = [
  'lab_completed',
  'quiz_passed',
  'topic_completed',
  'tool_used_second_session',
  'certificate_earned',
] as const;
export type HighValueEvent = (typeof HIGH_VALUE_EVENTS)[number];

/** Persisted counters. Everything is device-local and non-identifying. */
export type ReviewState = {
  /** Distinct app sessions seen. */
  sessions: number;
  /** Distinct local calendar days the app was used (YYYY-MM-DD). */
  activeDays: string[];
  /** Count of qualifying success events. */
  highValueEvents: number;
  /** First-launch timestamp (ms). */
  installedAtMs: number | null;
  /** When we last ASKED (ms). Never what the user answered. */
  lastRequestedMs: number | null;
  /** App versions we have already asked in. */
  requestedVersions: string[];
};

export const EMPTY_REVIEW_STATE: ReviewState = {
  sessions: 0,
  activeDays: [],
  highValueEvents: 0,
  installedAtMs: null,
  lastRequestedMs: null,
  requestedVersions: [],
};

/** Contexts in which a request is forbidden regardless of the counters. */
export type ReviewBlocker =
  | 'onboarding'
  | 'first_launch'
  | 'measuring'
  | 'after_purchase'
  | 'after_error'
  | 'after_permission_denied';

export type EligibilityInput = {
  state: ReviewState;
  /** Current app version, e.g. from expo-application. */
  version: string;
  /** Now, injected so tests are deterministic. */
  nowMs: number;
  /** The success that just happened, if any. */
  event?: HighValueEvent;
  /** Anything true here vetoes the request. */
  blockers?: ReviewBlocker[];
};

export type EligibilityResult = {
  eligible: boolean;
  /** Machine-readable reason — this is what analytics records, never a rating. */
  reason:
    | 'eligible'
    | 'no_success_event'
    | 'blocked_context'
    | 'too_few_sessions'
    | 'too_few_active_days'
    | 'too_few_events'
    | 'too_soon_after_install'
    | 'in_cooldown'
    | 'already_asked_this_version';
};

const DAY_MS = 86400000;

/** Local calendar-day key — same rule the exposure monitor uses. */
export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * The whole decision. Order matters only for which reason is reported; every
 * condition must pass. A success event is REQUIRED — this can never fire on a
 * timer, a launch, or a screen view.
 */
export function evaluateReviewEligibility(input: EligibilityInput): EligibilityResult {
  const { state, version, nowMs, event, blockers } = input;

  if (blockers && blockers.length > 0) return { eligible: false, reason: 'blocked_context' };
  if (!event || !HIGH_VALUE_EVENTS.includes(event)) return { eligible: false, reason: 'no_success_event' };

  if (state.installedAtMs == null || nowMs - state.installedAtMs < REVIEW_RULES.minDaysSinceInstall * DAY_MS) {
    return { eligible: false, reason: 'too_soon_after_install' };
  }
  if (state.sessions < REVIEW_RULES.minSessions) return { eligible: false, reason: 'too_few_sessions' };
  if (state.activeDays.length < REVIEW_RULES.minActiveDays) {
    return { eligible: false, reason: 'too_few_active_days' };
  }
  if (state.highValueEvents < REVIEW_RULES.minHighValueEvents) {
    return { eligible: false, reason: 'too_few_events' };
  }
  if (state.lastRequestedMs != null && nowMs - state.lastRequestedMs < REVIEW_RULES.cooldownDays * DAY_MS) {
    return { eligible: false, reason: 'in_cooldown' };
  }
  if (REVIEW_RULES.oncePerVersion && state.requestedVersions.includes(version)) {
    return { eligible: false, reason: 'already_asked_this_version' };
  }
  return { eligible: true, reason: 'eligible' };
}

// ── Pure state transitions (the caller persists the result) ─────────────────

export function recordSession(state: ReviewState, now: Date): ReviewState {
  const key = dayKey(now);
  return {
    ...state,
    sessions: state.sessions + 1,
    activeDays: state.activeDays.includes(key) ? state.activeDays : [...state.activeDays, key],
    installedAtMs: state.installedAtMs ?? now.getTime(),
  };
}

export function recordHighValueEvent(state: ReviewState): ReviewState {
  return { ...state, highValueEvents: state.highValueEvents + 1 };
}

/** Record that we ASKED. Deliberately has no parameter for the user's answer. */
export function recordRequested(state: ReviewState, version: string, nowMs: number): ReviewState {
  return {
    ...state,
    lastRequestedMs: nowMs,
    requestedVersions: state.requestedVersions.includes(version)
      ? state.requestedVersions
      : [...state.requestedVersions, version],
  };
}
