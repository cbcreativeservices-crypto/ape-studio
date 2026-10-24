/**
 * EXIT FLOW SWITCH (owner build plan 2026-10-15, docs: Downloads/
 * 2026-10-15_EXIT_FLOW_BUILD_PLAN.md).
 *
 * Membership cancellation + account deletion exit flow.
 *
 * ON since 2026-10-24 (owner: "nothing should be postponed if we can do it
 * now" — the exit flow ships in the final store build, switched ON). The
 * server half is live and verified (Comp A 2026-10-23): entitlements.plan /
 * will_renew / renewal_checked_at, submit_exit_feedback,
 * delete_my_account(p_keep_credentials).
 *
 * ON: Settings shows "Membership and billing" and "Account and privacy"
 * (Delete account lives there and never requires the cancel flow).
 * OFF (rollback only): Settings keeps its MEMBERSHIP "Manage membership" row
 * and the DELETE ACCOUNT hold-button section, exactly as before.
 *
 * Import-free on purpose so node:test can read it without React Native.
 */
export const EXIT_FLOW_ENABLED = true;

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
