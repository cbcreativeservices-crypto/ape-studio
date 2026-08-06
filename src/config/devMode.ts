/**
 * DEV-MODE BYPASSES (Booth 2026-07-18) — screen-development testing aids.
 *
 * Every switch here exists so Booth can enter ANY screen like a brand-new user
 * and exercise flows that are normally gated. All of them are hard-guarded by
 * `__DEV__`: in a release build this entire object is inert regardless of the
 * values below, so shipping with a flag accidentally `true` cannot leak.
 *
 * ⚠️ RESTORE CHECKLIST: docs/DEV_MODE_RESTORE_2026_07_18.md lists every place
 * these flags are consumed and what "operating position" means for each.
 * To restore normal behavior for in-dev testing of the real flows, flip the
 * individual flag(s) to false — no other code changes needed.
 */
export const DEV_BYPASS = {
  /** Quiz gate ignored: quiz switch is always startable, lockout timer ignored.
   *  NOTE: the server (`start_quiz_attempt`) still re-checks gates — if it
   *  refuses, the client shows the server error; that is expected and the
   *  backend is frozen (do not "fix" it client-side beyond this bypass). */
  bypassQuizLocks: true,
  /** Topic frontier + method dead-switches ignored: every topic reachable,
   *  every method tappable (screens may be empty if a topic has no content). */
  bypassMethodLocks: true,
  /** Entitlement caps forced to full academy: paywalls/veils/upsells hidden. */
  bypassAcademyLocks: true,
  /** Every screen intro/tutorial + coach mark shows on EVERY entry (first-time
   *  experience each visit), ignoring the persisted seen/retire counters.
   *  OFF (owner 2026-08-06): the "Welcome to Pro Audio Training Academy" popup
   *  kept reappearing on every visit to the login screen during device testing
   *  — with this off, intros show once and honor the persisted seen flag. */
  alwaysShowIntros: false,
  /** Intro/welcome READ-TIMERS forced to zero: every intro popup is instantly
   *  dismissable instead of holding the reader for its governed dwell time
   *  (owner 2026-07-29, "for now" — logging/screen-sweep aid).
   *  ⚠️ GOVERNANCE: the real dwell times (app welcome 9 s, commitment 8 s) are
   *  a ratified decision (APE_BACKEND_HANDOFF_2026_07_23 §2.3). This flag only
   *  bypasses them in __DEV__; the constants themselves are untouched, so
   *  flipping this to false restores the governed behavior exactly. */
  instantIntros: true,
} as const;

/** True only in dev builds AND when at least one bypass is on. */
export const DEV_BYPASS_ACTIVE =
  __DEV__ && Object.values(DEV_BYPASS).some(Boolean);

/** Per-flag accessor that self-disables outside dev builds. */
export const devBypass = (flag: keyof typeof DEV_BYPASS): boolean =>
  __DEV__ && DEV_BYPASS[flag];
