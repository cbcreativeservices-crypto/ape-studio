/**
 * Intentional-sign-out marker (QA Wave D, D-1 2026-09-10).
 *
 * The app calls supabase.auth.signOut() in several INTENTIONAL cases — logout,
 * delete account, entering Guest mode, single-device displacement, stranded-
 * session self-heal, and the "Back to Login" error escape — and each of those
 * handles its own navigation. An UNEXPECTED sign-out (token expired/revoked mid-
 * use) also fires SIGNED_OUT, but with nothing to navigate the user, which is
 * what SessionExpiryGuard fixes.
 *
 * To tell the two apart: call markIntentionalSignOut() immediately BEFORE an
 * app-initiated signOut(). SessionExpiryGuard consumes the flag on the next
 * SIGNED_OUT and stays out of the way when it was intentional.
 */
let intentional = false;
let clearTimer: ReturnType<typeof setTimeout> | undefined;

/** Flag the NEXT SIGNED_OUT as app-initiated. Call right before signOut(). */
export function markIntentionalSignOut(): void {
  intentional = true;
  if (clearTimer) clearTimeout(clearTimer);
  // Safety auto-clear: if no SIGNED_OUT arrives within a few seconds (e.g. the
  // signOut call failed), drop the flag so a LATER unexpected loss is still caught.
  clearTimer = setTimeout(() => {
    intentional = false;
    clearTimer = undefined;
  }, 8000);
}

/** Read-and-reset the flag. Returns true if the sign-out was app-initiated. */
export function consumeIntentionalSignOut(): boolean {
  const was = intentional;
  intentional = false;
  if (clearTimer) {
    clearTimeout(clearTimer);
    clearTimer = undefined;
  }
  return was;
}
