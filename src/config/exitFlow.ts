/**
 * EXIT FLOW SWITCH (owner build plan 2026-10-15, docs: Downloads/
 * 2026-10-15_EXIT_FLOW_BUILD_PLAN.md).
 *
 * Membership cancellation + account deletion exit flow. OFF until the server
 * half is live (Comp A: entitlements.plan / will_renew / renewal_checked_at,
 * submit_exit_feedback, delete_my_account(p_keep_credentials)) and both stores
 * have approved the build in review (D74).
 *
 * While OFF the app behaves exactly as before: Settings keeps its MEMBERSHIP
 * "Manage membership" row and the DELETE ACCOUNT hold-button section.
 * While ON, Settings shows "Membership and billing" and "Account and privacy"
 * (Delete account lives there and never requires the cancel flow).
 *
 * Import-free on purpose so node:test can read it without React Native.
 */
export const EXIT_FLOW_ENABLED = false;

/**
 * DEV-ONLY preview. Flip to true to see the new Settings entries in a dev
 * build (Metro / the web preview) without turning the switch on. Inert in a
 * release build: `__DEV__` is false there, whatever this says.
 */
const DEV_PREVIEW_EXIT_FLOW = false;

declare const __DEV__: boolean | undefined;

export function exitFlowEnabled(): boolean {
  if (EXIT_FLOW_ENABLED) return true;
  const dev = typeof __DEV__ !== 'undefined' && !!__DEV__;
  return dev && DEV_PREVIEW_EXIT_FLOW;
}
