/**
 * Membership from the onboarding landing page comes BACK to it (owner
 * 2026-10-09): "make sure they return here … so they can make their choice
 * afterwards."
 *
 * The landing page arms this before opening the Paywall; the Paywall takes it
 * once, at mount. After a completed purchase it returns to the landing page.
 * A guest who must create an account first re-arms it on the way to sign-up,
 * so the purchase that follows (same app session) still comes back. Memory
 * only: a new launch starts clean.
 */
let armed = false;

export function armLandingReturn(): void {
  armed = true;
}

/** Read and clear. */
export function takeLandingReturn(): boolean {
  const was = armed;
  armed = false;
  return was;
}
