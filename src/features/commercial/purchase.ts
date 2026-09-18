/**
 * In-app purchase engine (owner 2026-08-21) — the store side of Academy access.
 *
 * Flow (OpenIAP / expo-iap): open connection → user taps a plan → requestPurchase
 * → the purchaseUpdatedListener fires → we send the purchase to the
 * `validate-purchase` Supabase edge function → on server-verified success we
 * finishTransaction, refresh the entitlement, and tell the UI. Entitlement is
 * NEVER granted client-side; the server verifies the receipt and writes the
 * entitlements row (source 'app_store'/'play_store', store_ref = transaction id).
 *
 * expo-iap is LAZY-LOADED (require on first use, not a top-level import): the
 * native module only exists in a build made AFTER expo-iap was added, so a
 * static import would crash the whole app at startup on older dev builds
 * (RootNavigator statically pulls in PaywallScreen → this file). Lazy + guarded
 * means: no native module → purchases simply report unavailable, the app never
 * crashes, and nothing is fake-granted. Rebuild the dev/preview app to enable IAP.
 */
import { supabase } from '../../lib/supabase';
import { optionalModule } from '../tools/capture/optionalModule';
import {
  INAPP_SKUS,
  PLANS,
  SUBSCRIPTION_SKUS,
  planIdForSku,
  type PlanId,
} from './iapProducts';

/** The subset of the expo-iap (OpenIAP) API we call — typed without importing. */
type Sub = { remove: () => void };
type IapApi = {
  initConnection: (opts?: unknown) => Promise<unknown>;
  endConnection: () => Promise<unknown>;
  fetchProducts: (a: { skus: string[]; type: 'subs' | 'in-app' }) => Promise<unknown[]>;
  requestPurchase: (a: unknown) => Promise<unknown>;
  finishTransaction: (a: { purchase: unknown; isConsumable: boolean }) => Promise<unknown>;
  getAvailablePurchases: () => Promise<unknown[]>;
  purchaseUpdatedListener: (cb: (p: IapPurchase) => void) => Sub;
  purchaseErrorListener: (cb: (e: { code?: string; message?: string }) => void) => Sub;
};

type IapPurchase = {
  id?: string;
  productId?: string;
  purchaseToken?: string;
  transactionId?: string;
  platform?: string;
};

export type PurchaseHandlers = {
  onSuccess: () => void;
  /** message is user-facing; null means "silent" (e.g. user cancelled). */
  onError: (message: string | null) => void;
};

/** Lazily load expo-iap. Returns null (never throws) when the native module
 *  isn't in this build — callers then report "unavailable". */
let iapTried = false;
let iapMod: IapApi | null = null;
function getIap(): IapApi | null {
  // RE-ENABLED 2026-09-06 (launch readiness): expo-iap is installed and loads
  // through optionalModule's LOADERS table — a literal require Metro bundles,
  // inside a try/catch. On a client built before expo-iap's native half this
  // resolves to null and purchases report "unavailable" exactly as before; on
  // the next build the real store connection is live. (The 2026-08-21 disable
  // isolated a launch crash on pre-expo-iap clients; the loader is the guard.)
  if (iapTried) return iapMod;
  iapTried = true;
  iapMod = optionalModule<IapApi>('expo-iap');
  if (!iapMod) console.warn('[iap] expo-iap unavailable in this build — purchases report unavailable');
  return iapMod;
}

let connected = false;
let listeners: Sub[] = [];
let handlers: PurchaseHandlers | null = null;

function isCancel(code: unknown): boolean {
  return String(code ?? '').toLowerCase().includes('cancel');
}

async function validateWithServer(p: IapPurchase): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke('validate-purchase', {
      body: {
        platform: p.platform ?? null,
        productId: p.productId ?? null,
        purchaseToken: p.purchaseToken ?? null,
        transactionId: p.transactionId ?? null,
      },
    });
    if (error) {
      console.warn('[iap] validate-purchase failed:', error.message);
      return false;
    }
    return !!(data as { ok?: boolean } | null)?.ok;
  } catch (e) {
    console.warn('[iap] validate-purchase threw:', (e as Error).message);
    return false;
  }
}

/**
 * Called after a purchase is validated and finished, so the app can re-read the
 * member's tier without a paywall on screen. Set once, at app root.
 */
let onEntitlementMayHaveChanged: (() => void) | null = null;

/**
 * Start listening for store events for the lifetime of the process.
 *
 * Call ONCE from the app root. Idempotent: `initPurchases` only registers
 * listeners when none exist, so a second call is harmless.
 *
 * Returns false when IAP is unavailable in this build (missing native module,
 * store not prepared) — the app carries on, it simply cannot sell anything.
 */
export async function startPurchaseListeners(onChanged: () => void): Promise<boolean> {
  onEntitlementMayHaveChanged = onChanged;
  // No UI callbacks: nothing is on screen. The listener handles that case.
  return initPurchases({ onSuccess: () => {}, onError: () => {} }).then((ok) => {
    // initPurchases sets `handlers` to the no-ops above; drop them so a later
    // paywall's handlers are the only UI callbacks that ever fire.
    handlers = null;
    return ok;
  });
}

/**
 * Open the store connection and register the purchase listeners. Returns false
 * if IAP isn't available in this build (native module missing / store not
 * prepared) so the UI can explain.
 */
export async function initPurchases(h: PurchaseHandlers): Promise<boolean> {
  handlers = h;
  const iap = getIap();
  if (!iap) return false;
  try {
    await iap.initConnection();
  } catch (e) {
    console.warn('[iap] initConnection failed:', (e as Error).message);
    return false;
  }
  if (listeners.length === 0) {
    listeners.push(
      iap.purchaseUpdatedListener((purchase) => {
        void (async () => {
          // THIS RUNS WITH OR WITHOUT A PAYWALL ON SCREEN (2026-09-18).
          //
          // `handlers` is the paywall's UI callbacks and is null whenever the
          // paywall is not mounted — but validating and FINISHING the
          // transaction must happen regardless. An Ask-to-Buy approval, an SCA
          // challenge, or any purchase the store completes after the sheet is
          // gone arrives here with handlers null. Previously the listeners did
          // not even exist by then; now they do, and this path must not depend
          // on them.
          //
          // finishTransaction is the part that matters: unacknowledged Google
          // purchases are AUTO-REFUNDED after 72 hours, so a customer who paid
          // silently loses both the money and the access.
          const ok = await validateWithServer(purchase);
          if (ok) {
            try {
              await iap.finishTransaction({ purchase, isConsumable: false });
            } catch (e) {
              console.warn('[iap] finishTransaction failed:', (e as Error).message);
            }
            // Tell the app its tier changed even when nothing is listening for a
            // UI callback, or the member stays on the free experience until the
            // next cold start.
            onEntitlementMayHaveChanged?.();
            handlers?.onSuccess();
          } else {
            handlers?.onError('We couldn’t verify that purchase. If you were charged, use Restore Purchases.');
          }
        })();
      }),
    );
    listeners.push(
      iap.purchaseErrorListener((err) => {
        if (isCancel(err?.code)) {
          handlers?.onError(null);
          return;
        }
        handlers?.onError(err?.message ?? 'The purchase could not be completed.');
      }),
    );
  }
  connected = true;
  void loadStoreProducts();
  return true;
}

/**
 * Detach the PAYWALL'S UI callbacks. Does not stop listening.
 *
 * ── WHY THIS NO LONGER TEARS ANYTHING DOWN (2026-09-18) ──────────────────────
 *
 * It used to remove the listeners and end the store connection, and the paywall
 * was the only caller of `initPurchases` — so outside that one screen the app
 * was not listening for purchase events at all.
 *
 * Anything the store completes asynchronously therefore landed nowhere:
 * Ask-to-Buy (a parent approves hours later), SCA / 3-D Secure challenges, a
 * purchase interrupted by a crash or a backgrounded app. `finishTransaction`
 * never ran for those, and an unacknowledged Google purchase is AUTO-REFUNDED
 * after 72 hours — the customer is charged, gets nothing, and then gets a
 * refund they did not ask for, with no trace in the app.
 *
 * Listeners are now started once at app root by `startPurchaseListeners` and
 * stay for the process lifetime. This only clears the UI callbacks so a closed
 * paywall cannot be called back.
 */
export function detachPaywallHandlers(): void {
  handlers = null;
}

/** Full shutdown — listeners and connection. Not used in normal operation. */
export async function teardownPurchases(): Promise<void> {
  handlers = null;
  for (const l of listeners) {
    try {
      l.remove();
    } catch {
      /* ignore */
    }
  }
  listeners = [];
  if (connected) {
    connected = false;
    const iap = getIap();
    try {
      await iap?.endConnection();
    } catch {
      /* ignore */
    }
  }
}

/** Fetch localized store products (both subs + in-app). Best-effort. */
export async function loadStoreProducts(): Promise<unknown[]> {
  const iap = getIap();
  if (!iap) return [];
  try {
    const [subs, inapp] = await Promise.all([
      iap.fetchProducts({ skus: SUBSCRIPTION_SKUS, type: 'subs' }).catch(() => []),
      iap.fetchProducts({ skus: INAPP_SKUS, type: 'in-app' }).catch(() => []),
    ]);
    return [...(subs as unknown[]), ...(inapp as unknown[])];
  } catch {
    return [];
  }
}

/** Start the purchase flow for a plan. Result arrives via the listeners. */
export async function buyPlan(planId: PlanId): Promise<void> {
  const iap = getIap();
  if (!iap) throw new Error('In-app purchases are not available in this build.');
  const plan = PLANS[planId];
  await iap.requestPurchase({
    request: { apple: { sku: plan.sku }, google: { skus: [plan.sku] } },
    type: plan.kind,
  });
}

/**
 * Outcome of a restore attempt. TYPED, not boolean (error-triad audit
 * 2026-09-13): the old `false` meant BOTH "no prior purchase" and "the store /
 * validator threw", and the paywall then asserted "no previous purchase was
 * found" to a member who was merely offline — a dishonest state.
 *  - 'restored'    at least one academy purchase re-validated and (re)granted
 *  - 'none'        the store answered and holds no academy purchase — genuine empty
 *  - 'error'       the store or the validation call failed — retryable, NOT "none"
 *  - 'unavailable' IAP native module missing in this build (needs a rebuild)
 */
export type RestoreResult = 'restored' | 'none' | 'error' | 'unavailable';

/**
 * Restore previous purchases (App Store requirement). Re-validates each held
 * purchase server-side and finishes it. Never rejects — every failure maps to
 * a RestoreResult the UI can state honestly.
 */
export async function restorePurchases(): Promise<RestoreResult> {
  const iap = getIap();
  if (!iap) return 'unavailable';
  try {
    const purchases = (await iap.getAvailablePurchases()) as IapPurchase[];
    let restored = false;
    // An academy purchase WAS found but validation failed (offline, edge
    // function down) — that is an error to retry, never "nothing to restore".
    let validationFailed = false;
    for (const p of purchases) {
      if (!p.productId || !planIdForSku(p.productId)) continue;
      if (await validateWithServer(p)) {
        restored = true;
        try {
          await iap.finishTransaction({ purchase: p, isConsumable: false });
        } catch {
          /* ignore finalize error on restore */
        }
      } else {
        validationFailed = true;
      }
    }
    if (restored) return 'restored';
    return validationFailed ? 'error' : 'none';
  } catch (e) {
    console.warn('[iap] restore failed:', (e as Error).message);
    return 'error';
  }
}
