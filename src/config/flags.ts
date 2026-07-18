/**
 * Feature flags (CM1, Booth 2026-07-11).
 *
 * `commercialMode` gates the ENTIRE commercial-first rebuild. Compile-time
 * default = FALSE so a release build is byte-identical to today's app. In dev
 * it can be flipped at runtime and persisted (see EntitlementProvider); the
 * persisted override only applies in __DEV__.
 *
 * Definition of done for every commercial milestone: flag OFF ⇒ current app
 * behavior unchanged; flag ON ⇒ new behavior.
 */
export const FLAG_DEFAULTS = {
  /** Master switch for the commercial-first structure + entitlement gating. */
  commercialMode: false,
} as const;

export type FlagName = keyof typeof FLAG_DEFAULTS;

/** AsyncStorage key for the dev-only commercialMode override. */
export const DEV_COMMERCIAL_FLAG_KEY = 'ape:dev:commercialMode';
/** AsyncStorage key for the dev-only mock entitlement state. */
export const DEV_ENTITLEMENT_KEY = 'ape:dev:entitlement';
