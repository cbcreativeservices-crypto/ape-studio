/**
 * TELEMETRY KILL SWITCH (owner-approved 2026-09-16, privacy-first).
 *
 * ONE flag gates BOTH third-party SDKs — Sentry (crash / diagnostics) and
 * Aptabase (anonymous product analytics). Flip it to `false` and neither SDK
 * initialises, no listener is attached, and every trackEvent / captureError
 * call becomes a no-op. Nothing else in the app needs to change.
 *
 * What the two SDKs are allowed to send is pinned in
 * src/features/telemetry/telemetry.ts and audited in
 * docs/TELEMETRY_DATA_INVENTORY_2026_09_16.md (the table Computer A files on
 * the Apple App-Privacy / Google Data-Safety forms). Change one → change both.
 *
 * Keys live in .env as EXPO_PUBLIC_SENTRY_DSN / EXPO_PUBLIC_APTABASE_APP_KEY
 * (client-side identifiers by design, not secrets). Missing key = that SDK
 * stays off even with this flag on.
 */
export const TELEMETRY_ENABLED = true;
