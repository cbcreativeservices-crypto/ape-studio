/**
 * Generator output-cap unlock — SESSION scope (owner 2026-08-05).
 *
 * Ruling Q4 says the Q4 safety cap unlocks "for that session only". Previously
 * the screen re-locked on every unmount, so the user was re-prompted each time
 * they reopened the Tone/Noise Generator — there was no real "per session"
 * memory. This module-level flag IS the session: once the user confirms the
 * unlock it is remembered for the rest of this app session (the generator
 * screen restores the native unlock silently on re-entry, no second prompt),
 * and it resets — re-locks — when the app process restarts.
 *
 * Native still re-locks its own cap whenever the screen closes (no hot output
 * behind a closed screen); this flag only governs whether we ask again.
 */
let unlockedThisSession = false;

export const isGenCapUnlockedThisSession = (): boolean => unlockedThisSession;

export const markGenCapUnlockedThisSession = (): void => {
  unlockedThisSession = true;
};

/** Test/first-run hook — clears the session unlock (e.g. on explicit sign-out). */
export const resetGenCapSession = (): void => {
  unlockedThisSession = false;
};
