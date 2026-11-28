/**
 * PurchaseListenerRoot — listen for store purchases for the whole app session.
 *
 * ── WHY THIS EXISTS (2026-09-18) ─────────────────────────────────────────────
 *
 * The purchase listeners used to be registered by `initPurchases` and removed by
 * `teardownPurchases`, and the PAYWALL was the only caller of either. Outside
 * that one screen the app was not listening for store events at all.
 *
 * Stores do not promise to finish a purchase while your sheet is open:
 *
 *   • Ask-to-Buy — a parent approves hours or days later
 *   • SCA / 3-D Secure — the bank challenge completes in another app
 *   • a purchase interrupted by a crash, a call, or a backgrounded app
 *   • anything the store retries on the next launch
 *
 * Every one of those arrived with nothing listening. The receipt was never sent
 * for validation, the entitlement was never written, and — the part that costs
 * real money — `finishTransaction` never ran. An unacknowledged Google purchase
 * is AUTO-REFUNDED after 72 hours, so the customer is charged, receives nothing,
 * and is then refunded without ever being told why. Nothing in the app records
 * that it happened.
 *
 * Mounting this once inside EntitlementProvider means the listener is alive from
 * boot. A purchase that completes with no paywall on screen is validated,
 * acknowledged, and the member's tier is re-read — so they simply find
 * themselves a member, which is what they paid for.
 *
 * ── WHY IT RENDERS NOTHING ───────────────────────────────────────────────────
 *
 * It is a lifecycle hook that needs `refreshEntitlement` from context, and the
 * alternative — calling it from EntitlementProvider itself — would make the
 * provider depend on the store module and drag react-native-iap into every test
 * that mounts it.
 */
import { useEffect, useRef, useState } from 'react';
import { AppState, Platform, type AppStateStatus } from 'react-native';

import { useEntitlement } from './EntitlementProvider';
import { recheckUnfinishedAndroidPurchases, startPurchaseListeners } from './purchase';
import { tierOf } from './tier';

export function PurchaseListenerRoot(): null {
  const { refreshEntitlement, entitlement, resolved, tierKnown } = useEntitlement();
  /** The listeners' start (the store connection), which the re-check below
   *  must wait for — it queries the same connection. */
  const started = useRef<Promise<boolean> | null>(null);

  useEffect(() => {
    // Never throws and never blocks boot: `startPurchaseListeners` returns false
    // when IAP is unavailable in this build (no native module, store not
    // prepared, web preview). The app runs exactly as before in that case — it
    // simply cannot sell anything, which is already true of those builds.
    started.current = startPurchaseListeners(() => {
      void refreshEntitlement();
    }).catch(() => false);
    // Deliberately no cleanup. These listeners are meant to outlive every
    // screen; the paywall detaches only its own UI callbacks. Tearing them down
    // here would restore the exact bug this file exists to fix.
  }, [refreshEntitlement]);

  /**
   * UNFINISHED ANDROID PURCHASES, ONCE PER APP OPEN (toddler hunt #2, owner
   * 2026-10-14). See `recheckUnfinishedAndroidPurchases`: a Play purchase whose
   * verification failed is otherwise refunded by Google after 3 days. "Open" =
   * the cold start, and each return to the app from the background.
   *
   * Only once the signed-in session is READY: a real account whose tier a
   * server read has actually produced (`tierKnown`, and not a guest) — so the
   * session is live and the network answered, and validate-purchase will not
   * be sent before the token is ready (the cold-start auth race).
   */
  const [open, setOpen] = useState(0);
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    let state: AppStateStatus = AppState.currentState;
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (state === 'background' && next === 'active') setOpen((n) => n + 1);
      state = next;
    });
    return () => sub.remove();
  }, []);
  // A real account ('free' covers lapsed too), from the tier — not the raw
  // entitlement (pattern P8). The members-only preview flag is not folded in.
  const tier = tierOf(entitlement, resolved);
  const sessionReady = tierKnown && (tier === 'free' || tier === 'member');
  useEffect(() => {
    if (Platform.OS !== 'android' || !sessionReady) return;
    let alive = true;
    void (started.current ?? Promise.resolve(false)).then((ok) => {
      if (ok && alive) void recheckUnfinishedAndroidPurchases(open);
    });
    // Signed out (or a new open) before the store connection answered: skip.
    return () => {
      alive = false;
    };
  }, [sessionReady, open]);

  return null;
}
