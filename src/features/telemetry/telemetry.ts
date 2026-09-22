/**
 * Telemetry — Sentry (crash / diagnostics) + Aptabase (anonymous product
 * analytics), wired privacy-first (owner-approved 2026-09-16, per
 * docs/CCODE_WIRE_SENTRY_APTABASE_2026_09_16.md).
 *
 * THE CONTRACT (mirrored in docs/TELEMETRY_DATA_INVENTORY_2026_09_16.md):
 *   • NO advertising id (IDFA/GAID), NO App Tracking Transparency prompt, NO
 *     cross-app tracking — nothing here reads a device identifier at all.
 *   • Sentry: FULLY ANONYMOUS (owner ruling 2026-09-16, "Option B"). NO user
 *     binding of any kind — the SDK's user-binding API is never called (this
 *     module has no auth access; test/telemetry.test.ts pins the source), and
 *     beforeSend strips any `user` object an integration might attach, so no
 *     crash is linkable to an account. `sendDefaultPii: false`; NO Session Replay (the
 *     integration is never added); NO performance tracing; NO screenshots /
 *     view hierarchy; breadcrumbs + events pass through scrub.ts (no console
 *     lines, no query strings, no email/IP).
 *   • Aptabase: anonymous events only — screen views, feature usage, quiz /
 *     exam start + finish counts. Props are whitelist-filtered to enum-shaped
 *     values (scrub.ts); free text cannot get through. Aptabase itself adds
 *     os name/version, app version/build, SDK version, a per-launch random
 *     session id and a debug flag — no device model, no identifiers.
 *   • ONE kill switch for both: src/config/telemetry.ts TELEMETRY_ENABLED.
 *
 * Both SDKs carry a native module that the CURRENT dev client (2026-08 pair)
 * does not have. Each init is wrapped so a missing module degrades to JS-only
 * mode (Sentry: JS errors still report via fetch; Aptabase: app version reads
 * empty) instead of taking the app down. Full native crash capture arrives
 * with the next EAS build.
 */
import * as Sentry from '@sentry/react-native';
import * as Aptabase from '@aptabase/react-native';
import type { ComponentType } from 'react';
import { TELEMETRY_ENABLED } from '../../config/telemetry';
import { sanitizeProps, scrubBreadcrumb, scrubEvent } from './scrub';

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN ?? '';
const APTABASE_APP_KEY = process.env.EXPO_PUBLIC_APTABASE_APP_KEY ?? '';

/** The self-test is the ONE reason to let a dev machine reach Sentry. */
const SELFTEST_ON = process.env.EXPO_PUBLIC_TELEMETRY_SELFTEST === '1';

/**
 * ⛔ A DEV MACHINE DOES NOT REPORT TO SENTRY. (2026-09-21)
 *
 * Events were tagged `environment: development` but still SENT, and the
 * result was that the issue feed stopped being readable. Counted on
 * 2026-09-21: 16 of the 21 open issues were Metro bundler output from this
 * repo — `TransformError`, `UnableToResolveError`, half-finished edits — each
 * one carrying a `C:\Users\profe\dev\ape-studio\...` path, each one already
 * fixed minutes later, and none of them reachable by any user. They sat above
 * and around the five that were real, including a production app hang.
 *
 * Filtering by environment in the Sentry UI is a workaround that has to be
 * re-applied by every person who opens the page; not sending is not. A dev
 * error is already a redbox and a Metro log two feet away — Sentry adds
 * nothing there and costs quota and attention.
 *
 * Set EXPO_PUBLIC_TELEMETRY_SELFTEST=1 when you specifically need to prove the
 * pipe end-to-end from a dev build; that is what the self-test below is for.
 */
const SENTRY_MAY_SEND = !__DEV__ || SELFTEST_ON;

let started = false;
let sentryOn = false;
let aptabaseOn = false;
let lastScreen: string | null = null;

/** Boot both SDKs once. Safe to call repeatedly; a no-op when the switch is off. */
export function initTelemetry(): void {
  if (started) return;
  started = true;
  if (!TELEMETRY_ENABLED) return;

  if (SENTRY_DSN && SENTRY_MAY_SEND) {
    try {
      Sentry.init({
        dsn: SENTRY_DSN,
        environment: __DEV__ ? 'development' : 'production',
        // ── privacy pins ──────────────────────────────────────────────────
        sendDefaultPii: false,
        attachScreenshot: false,
        attachViewHierarchy: false,
        enableCaptureFailedRequests: false,
        enableUserInteractionTracing: false,
        enableAutoPerformanceTracing: false,
        // tracesSampleRate deliberately unset → no performance monitoring.
        // mobileReplayIntegration deliberately NOT added → no Session Replay.
        // ──────────────────────────────────────────────────────────────────
        // Release health (crash-free sessions): anonymous session start/end
        // counters, no identifiers. This is the "Diagnostics" bucket.
        enableAutoSessionTracking: true,
        maxBreadcrumbs: 50,
        // The dev client predates the native module — never show Sentry's
        // "native not available" alert over the app.
        enableNativeNagger: false,
        beforeBreadcrumb: (b) => scrubBreadcrumb(b),
        beforeSend: (e) => scrubEvent(e),
      });
      sentryOn = true;
    } catch (e) {
      console.warn('[telemetry] Sentry init failed — crash reporting off:', e);
    }
  }

  if (APTABASE_APP_KEY) {
    try {
      // Region comes from the key prefix: A-EU-… → https://eu.aptabase.com
      // (EU data residency). No host override needed.
      Aptabase.init(APTABASE_APP_KEY);
      aptabaseOn = true;
    } catch (e) {
      console.warn('[telemetry] Aptabase init failed — analytics off:', e);
    }
  }

  if (!sentryOn && !aptabaseOn) return;

  // Deliberately NO auth binding here: Sentry never learns who the user is
  // (see the header). If someone later needs per-account crash lookup, that is
  // a privacy-form change for Computer A first, not a one-line addition.

  // One-shot verification hook (dev only, opt-in via .env): proves the pipes
  // end-to-end without leaving a test path in the app.
  if (__DEV__ && SELFTEST_ON) {
    selfTest();
  }
}

/** Wrap the root component (Sentry touch-event boundary + profiler). */
export function wrapRoot<P extends Record<string, unknown>>(Root: ComponentType<P>): ComponentType<P> {
  return sentryOn ? Sentry.wrap(Root) : Root;
}

/**
 * Anonymous product event. `props` are whitelist-filtered — pass enum-shaped
 * values only (a topic gs number, an outcome code, a boolean); anything
 * text-like is silently dropped.
 */
export function trackEvent(name: string, props?: Record<string, unknown>): void {
  if (!aptabaseOn) return;
  try {
    Aptabase.trackEvent(name, sanitizeProps(props));
  } catch {
    /* analytics must never throw into app code */
  }
}

/** Screen view — de-duplicated so a re-render of the same route counts once. */
export function trackScreen(name: string | undefined): void {
  if (!name || name === lastScreen) return;
  lastScreen = name;
  trackEvent('screen_view', { screen: name });
  if (sentryOn) {
    Sentry.addBreadcrumb({ category: 'navigation', message: name, level: 'info' });
  }
}

/** Report a caught error (render-boundary catches, swallowed rejections worth knowing about). */
export function captureError(error: unknown, context?: Record<string, unknown>): void {
  if (!sentryOn) return;
  try {
    Sentry.captureException(error, context ? { extra: sanitizeProps(context) } : undefined);
  } catch {
    /* never throw from a reporter */
  }
}

function selfTest(): void {
  trackEvent('telemetry_self_test', { source: 'dev_client' });
  if (sentryOn) Sentry.captureException(new Error('telemetry self-test (dev client)'));
  console.log('[telemetry] self-test sent — sentry:', sentryOn, 'aptabase:', aptabaseOn);
}
