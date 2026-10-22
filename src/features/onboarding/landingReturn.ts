/**
 * Where the Paywall sends people back to — two memory-only holds.
 *
 * 1. THE LANDING RETURN (owner 2026-10-09): membership from the onboarding
 *    landing page comes BACK to it — "make sure they return here … so they can
 *    make their choice afterwards." The landing arms it before opening the
 *    Paywall; the Paywall takes it once, at mount. After a completed purchase
 *    it returns to the landing page.
 *
 * 2. THE PAYWALL RETURN (owner H9 + H-E, 2026-10-22): a GUEST who chooses a
 *    plan and taps CREATE ACCOUNT TO CONTINUE — from ANY paywall entry
 *    (landing, lab lock, glossary lock, calculators…) — comes back to the
 *    Paywall after signing up or signing in, with the plan they chose still
 *    selected. Only then, after the purchase, to the landing (if that is where
 *    they started: the landing hold rides along).
 *
 *    ⛔ It only PRE-SELECTS. Nothing here ever starts a purchase: the buyer
 *       taps the gold button again, under the full disclosure (ROSCA / CA ARL
 *       express consent; no duplicate purchase). An account that turns out to
 *       be a member gets the Paywall's member face, not plans.
 *
 * MEMORY ONLY, deliberately: the D57 guest wipe sweeps `ape:*` storage at
 * sign-in, so a stored plan would either be lost or break the wipe rule; and a
 * new launch should start clean rather than resurrect an old intent.
 */
import type { PlanId } from '../commercial/iapProducts';

let armed = false;
let heldPlan: PlanId | null = null;

export function armLandingReturn(): void {
  armed = true;
}

/** Read and clear. */
export function takeLandingReturn(): boolean {
  const was = armed;
  armed = false;
  return was;
}

/**
 * The guest is leaving the Paywall for sign-up / sign-in: remember the plan
 * (and, when this Paywall was opened from the landing, the landing return).
 */
export function holdPaywallReturn(plan: PlanId, toLanding: boolean): void {
  heldPlan = plan;
  if (toLanding) armed = true;
}

/** Read and clear — AuthScreen, once the account is in. */
export function takePaywallReturn(): PlanId | null {
  const p = heldPlan;
  heldPlan = null;
  return p;
}

/** Drop both: the guest came back without signing in, or chose Guest Mode. */
export function dropPaywallReturn(): void {
  heldPlan = null;
  armed = false;
}
