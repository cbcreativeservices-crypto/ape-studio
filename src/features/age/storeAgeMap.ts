/**
 * The store's age signal → one band, for the 18+ gates (Texas SB 2420, owner
 * go 2026-11-27, 1.0.1). PURE: no React Native, no storage, no network, so
 * every raw answer is unit-tested (test/storeAgeSignal_20261127.test.ts).
 *
 *   18+                           → 'adult'
 *   13–17, or any range under 18  → 'teen'
 *   under 13                      → 'child'
 *   anything else                 → 'unknown'
 *     (declined, not shared, not a covered region, any error, an unsupported
 *     OS, an old binary without the module, web)
 *
 * 'unknown' NEVER counts as adult: it keeps today's self-confirmation exactly.
 * 'adult' changes nothing either (no auto-confirm). Only 'teen' and 'child'
 * close the 18+ areas.
 *
 * Sec. 121.055: the band is used ONLY for these age gates. It is never sent
 * to our server, never stored, never put in telemetry (guard test).
 */

export type StoreAgeBand = 'adult' | 'teen' | 'child' | 'unknown';

/** A mapped answer. `retry` marks an answer that may change if asked again
 *  soon (a network blip, a busy Play service): it is not kept for the session. */
export type BandRead = { band: StoreAgeBand; retry: boolean };

const UNKNOWN: BandRead = { band: 'unknown', retry: false };
const UNKNOWN_RETRY: BandRead = { band: 'unknown', retry: true };

/** A real age bound, or null. */
function bound(v: unknown): number | null {
  return typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 150 ? v : null;
}

/**
 * Both stores answer an age RANGE [lower, upper]; a missing bound is open.
 * Apple: under 13 = [nil, 12], 13–17 = [13, 17], 18+ = [18, nil] with our gates
 * 13 and 18 (the system may use other gates where local rules require it).
 * Google: 0–12, 13–15, 16–17, 18+ (the Play Console bands).
 */
export function bandFromBounds(lowerRaw: unknown, upperRaw: unknown): StoreAgeBand {
  const lower = bound(lowerRaw);
  const upper = bound(upperRaw);
  if (lower != null && upper != null && lower > upper) return 'unknown';
  if (upper != null && upper <= 12) return 'child';
  // A range that ends before 18 is a minor, even one that straddles 13: both
  // close the same doors.
  if (upper != null && upper <= 17) return 'teen';
  if (lower != null && lower >= 18) return 'adult';
  return 'unknown';
}

/* ── Apple: Declared Age Range (ApeAgeSignalModule.swift) ─────────────── */

/** AgeRangeService.Error names worth asking again for. */
const IOS_RETRY_ERRORS: ReadonlySet<string> = new Set(['network', 'noViewController']);

/**
 * kinds: sharing (lowerBound/upperBound) | declined | ineligible | unsupported
 * | error (error = the AgeRangeService.Error case name: notAvailable,
 * invalidRequest, declinedOnboarding, invalidAccount, network; or other,
 * unknownResponse, noViewController).
 */
export function bandFromIos(raw: Record<string, unknown>): BandRead {
  switch (raw.kind) {
    case 'sharing':
      return { band: bandFromBounds(raw.lowerBound, raw.upperBound), retry: false };
    case 'declined':
    case 'ineligible':
    case 'unsupported':
      return UNKNOWN;
    case 'error':
      return typeof raw.error === 'string' && IOS_RETRY_ERRORS.has(raw.error) ? UNKNOWN_RETRY : UNKNOWN;
    default:
      return UNKNOWN;
  }
}

/* ── Google: Play Age Signals 0.0.6 (ApeAgeSignalModule.kt) ───────────── */

/** com.google.android.play.agesignals.model.AgeSignalsStatus */
export const AGE_SIGNALS_STATUS = {
  UNSPECIFIED: 0,
  SHARED: 1,
  NOT_SHARED: 2,
  VERIFICATION_REQUIRED: 3,
} as const;

/** com.google.android.play.agesignals.model.AgeRangeSource (not used for the
 *  band: a self-declared minor is still a minor). */
export const AGE_RANGE_SOURCE = { UNSPECIFIED: 0, TIER_A: 1, TIER_B: 2, TIER_C: 3, TIER_D: 4 } as const;

/** com.google.android.play.agesignals.model.AgeSignalsErrorCode, plus the
 *  module's own two (no Activity; a non-Play exception). */
export const AGE_SIGNALS_ERROR = {
  API_NOT_AVAILABLE: -1,
  PLAY_STORE_NOT_FOUND: -2,
  NETWORK_ERROR: -3,
  PLAY_SERVICES_NOT_FOUND: -4,
  CANNOT_BIND_TO_SERVICE: -5,
  PLAY_STORE_VERSION_OUTDATED: -6,
  PLAY_SERVICES_VERSION_OUTDATED: -7,
  CLIENT_TRANSIENT_ERROR: -8,
  APP_NOT_OWNED: -9,
  SDK_VERSION_OUTDATED: -10,
  DEVICE_NOT_SUPPORTED: -11,
  INTERNAL_ERROR: -100,
  NOT_PLAY_ERROR: -1000,
  NO_ACTIVITY: -1001,
} as const;

/** Google's "retry with backoff" codes, plus a dropped network and no Activity. */
const ANDROID_RETRY_ERRORS: ReadonlySet<number> = new Set([
  AGE_SIGNALS_ERROR.NETWORK_ERROR,
  AGE_SIGNALS_ERROR.CANNOT_BIND_TO_SERVICE,
  AGE_SIGNALS_ERROR.CLIENT_TRANSIENT_ERROR,
  AGE_SIGNALS_ERROR.INTERNAL_ERROR,
  AGE_SIGNALS_ERROR.NO_ACTIVITY,
]);

/**
 * kinds: result (accessStatus SHARED + ageLower/ageUpper/source) | access
 * (accessStatus not SHARED) | ineligible (no MANDATORY_SHARING) | error
 * (errorCode).
 */
export function bandFromAndroid(raw: Record<string, unknown>): BandRead {
  switch (raw.kind) {
    case 'result':
      if (raw.accessStatus !== AGE_SIGNALS_STATUS.SHARED) return UNKNOWN;
      return { band: bandFromBounds(raw.ageLower, raw.ageUpper), retry: false };
    case 'access':
      // VERIFICATION_REQUIRED: the member is asked to verify in the Play Store
      // app, not here; once they have, the next ask can answer.
      return raw.accessStatus === AGE_SIGNALS_STATUS.VERIFICATION_REQUIRED ? UNKNOWN_RETRY : UNKNOWN;
    case 'ineligible':
      return UNKNOWN;
    case 'error':
      return typeof raw.errorCode === 'number' && ANDROID_RETRY_ERRORS.has(raw.errorCode) ? UNKNOWN_RETRY : UNKNOWN;
    default:
      return UNKNOWN;
  }
}

/** Any raw answer (or none: an old binary, web) → a band. */
export function bandFromRaw(raw: unknown): BandRead {
  if (!raw || typeof raw !== 'object') return UNKNOWN;
  const r = raw as Record<string, unknown>;
  if (r.platform === 'ios') return bandFromIos(r);
  if (r.platform === 'android') return bandFromAndroid(r);
  return UNKNOWN;
}

/** The only bands that close the 18+ areas. 'unknown' and 'adult' never do. */
export function isMinorBand(band: StoreAgeBand | null | undefined): boolean {
  return band === 'teen' || band === 'child';
}

/* ── The words (DRAFT, for the owner's approval) ──────────────────────── */

export const STORE_AGE_TITLE = 'For members 18 and over';

/** Forum: every post control. */
export const STORE_AGE_FORUM =
  'Your app store account says you are under 18, so posting in the forum is closed to you. You can still read it, and everything else in the app works at any age.';

/** Audio Community profile: PUBLISH (the forum's CONFIRM 18+ step). */
export const STORE_AGE_PROFILE =
  'Your app store account says you are under 18, so you can’t publish an Audio Community profile. Your draft stays here, and your studies and certificates work at any age.';

/** Pro Registry: the public listing switch. */
export const STORE_AGE_REGISTRY =
  'Your app store account says you are under 18, so you can’t be listed in the Pro Registry. Your studies, your certificates and QR verification work at any age.';

/** Directory messages: a new request, a message, accepting a request. */
export const STORE_AGE_CONTACT =
  'Your app store account says you are under 18, so messaging other members is closed to you. Your studies and certificates work at any age.';
