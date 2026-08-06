/**
 * Feature flags (CM1, Booth 2026-07-11).
 *
 * `commercialMode` gates the commercial-first rebuild. Institutional mode is
 * being RETIRED (owner 2026-08-06) — the app being built IS the commercial app,
 * so DEV defaults commercialMode ON (see EntitlementProvider) and all
 * development/testing happens there. This compile-time default stays FALSE only
 * so a RELEASE build isn't shipped commercial-first before commercial mode is
 * declared complete; flip it to true at that point.
 */
export const FLAG_DEFAULTS = {
  /** Master switch for the commercial-first structure + entitlement gating.
   *  Release default; dev forces ON in EntitlementProvider. */
  commercialMode: false,
} as const;

export type FlagName = keyof typeof FLAG_DEFAULTS;

/** AsyncStorage key for the dev-only commercialMode override. */
export const DEV_COMMERCIAL_FLAG_KEY = 'ape:dev:commercialMode';
/** AsyncStorage key for the dev-only mock entitlement state. */
export const DEV_ENTITLEMENT_KEY = 'ape:dev:entitlement';
