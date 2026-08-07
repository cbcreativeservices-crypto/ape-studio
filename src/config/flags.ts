/**
 * Feature flags (CM1, Booth 2026-07-11).
 *
 * `commercialMode` gates the commercial-first structure. Institutional mode is
 * RETIRED (owner 2026-08-06) — the app IS the commercial app, so this now
 * defaults ON at boot (dev AND release). The institutional code paths remain
 * only as dead branches reachable via the dev logo long-press for inspection.
 */
export const FLAG_DEFAULTS = {
  /** Master switch for the commercial-first structure + entitlement gating.
   *  Defaults ON (owner 2026-08-06); dev long-press-logo can toggle it off. */
  commercialMode: true,
} as const;

export type FlagName = keyof typeof FLAG_DEFAULTS;

/** AsyncStorage key for the dev-only commercialMode override. */
export const DEV_COMMERCIAL_FLAG_KEY = 'ape:dev:commercialMode';
/** AsyncStorage key for the dev-only mock entitlement state. */
export const DEV_ENTITLEMENT_KEY = 'ape:dev:entitlement';
