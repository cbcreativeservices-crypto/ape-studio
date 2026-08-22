/**
 * In-app purchase engine (owner 2026-08-21) — the store side of Academy access.
 *
 * Flow (OpenIAP / expo-iap): open connection → user taps a plan → requestPurchase
 * → the purchaseUpdatedListener fires → we send the purchase to the
 * `validate-purchase` Supabase edge function → on server-verified success we
 * finishTransaction, refresh the entitlement, and tell the UI. Entitlement is
 * NEVER granted client-side; the server verifies the receipt and writes the
 * entitlements row (source 'appstore'/'playstore', store_ref = transaction id).
 *
 * FAILS SAFE / OPEN: if the native module isn't in this build, or the edge
 * function isn't deployed yet, purchases simply can't complete (nothing is
 * granted) and the UI shows an honest message — it never crashes or fake-grants.
 * Until the edge function + store products exist, grant testers access via a comp
 * code (accessCode) or an entitlements row.
 */
import { supabase } from '../../lib/supabase';
import {
  ALL_SKUS,
  INAPP_SKUS,
  PLANS,
  SUBSCRIPTION_SKUS,
  planIdForSku,
  type PlanId,
} from './iapProducts';

// expo-iap (OpenIAP). Imported lazily-safe: importing is fine; the native calls
// are wrapped in try/catch so a build WITHOUT the module never crashes the UI.
import {
  initConnection,
  endConnection,
  fetchProducts,
  requestPurchase,
  finishTransaction,
  getAvailablePurchases,
  purchaseUpdatedListener,
  purchaseErrorListener,
} from 'expo-iap';

/** Minimal shape we rely on from an expo-iap Purchase (OpenIAP unified fields). */
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

type Sub = { remove: () => void };

let connected = false;
let listeners: Sub[] = [];
let handlers: PurchaseHandlers | null = null;

function isCancel(code: unknown): boolean {
  const c = String(code ?? '').toLowerCase();
  return c.includes('cancel'); // E_USER_CANCELLED / user-cancelled variants
}

/** Send a completed purchase to the server verifier. Returns true only when the
 *  server confirms and writes the entitlement. */
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
 * Open the store connection and register the purchase listeners. Call when the
 * paywall opens. Returns false if IAP isn't available in this build (native
 * module missing / store not prepared) so the UI can explain.
 */
export async function initPurchases(h: PurchaseHandlers): Promise<boolean> {
  handlers = h;
  try {
    await initConnection();
  } catch (e) {
    console.warn('[iap] initConnection failed (module not in this build?):', (e as Error).message);
    return false;
  }
  if (listeners.length === 0) {
    listeners.push(
      purchaseUpdatedListener((purchase) => {
        void (async () => {
          const p = purchase as IapPurchase;
          const ok = await validateWithServer(p);
          if (ok) {
            try {
              await finishTransaction({ purchase: purchase as never, isConsumable: false });
            } catch (e) {
              console.warn('[iap] finishTransaction failed:', (e as Error).message);
            }
            handlers?.onSuccess();
          } else {
            handlers?.onError('We couldn’t verify that purchase. If you were charged, use Restore Purchases.');
          }
        })();
      }),
    );
    listeners.push(
      purchaseErrorListener((err) => {
        if (isCancel((err as { code?: string })?.code)) {
          handlers?.onError(null); // user cancelled — no error UI
          return;
        }
        handlers?.onError((err as { message?: string })?.message ?? 'The purchase could not be completed.');
      }),
    );
  }
  connected = true;
  // Warm the product catalog (prices/localized titles) — non-fatal.
  void loadStoreProducts();
  return true;
}

/** Tear down listeners + connection (call when the paywall closes). */
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
    try {
      await endConnection();
    } catch {
      /* ignore */
    }
  }
}

/** Fetch localized store products (both subs + in-app). Best-effort. */
export async function loadStoreProducts(): Promise<unknown[]> {
  try {
    const [subs, inapp] = await Promise.all([
      fetchProducts({ skus: SUBSCRIPTION_SKUS, type: 'subs' }).catch(() => []),
      fetchProducts({ skus: INAPP_SKUS, type: 'in-app' }).catch(() => []),
    ]);
    return [...(subs as unknown[]), ...(inapp as unknown[])];
  } catch {
    return [];
  }
}

/** Start the purchase flow for a plan. Result arrives via the listeners. */
export async function buyPlan(planId: PlanId): Promise<void> {
  const plan = PLANS[planId];
  await requestPurchase({
    request: { apple: { sku: plan.sku }, google: { skus: [plan.sku] } },
    type: plan.kind,
  });
}

/**
 * Restore previous purchases (App Store requirement). Re-validates each held
 * purchase server-side and finishes it; returns true if at least one academy
 * entitlement was (re)granted.
 */
export async function restorePurchases(): Promise<boolean> {
  try {
    const purchases = (await getAvailablePurchases()) as IapPurchase[];
    let any = false;
    for (const p of purchases) {
      if (p.productId && planIdForSku(p.productId) && (await validateWithServer(p))) {
        any = true;
        try {
          await finishTransaction({ purchase: p as never, isConsumable: false });
        } catch {
          /* ignore finalize error on restore */
        }
      }
    }
    return any;
  } catch (e) {
    console.warn('[iap] restore failed:', (e as Error).message);
    return false;
  }
}

export { ALL_SKUS };
