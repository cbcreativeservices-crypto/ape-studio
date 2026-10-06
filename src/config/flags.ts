/**
 * Dev-only storage keys for the entitlement provider.
 *
 * The app is commercial-only: the old `commercialMode` master flag and its dev
 * long-press toggle were removed on 2026-10-05 (the institutional mode it
 * switched to was retired 2026-08-06), so commercial behaviour is simply the
 * code.
 */

/** AsyncStorage key for the dev-only mock entitlement state. */
export const DEV_ENTITLEMENT_KEY = 'ape:dev:entitlement';
