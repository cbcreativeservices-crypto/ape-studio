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
 * expo-iap is LAZY-LOADED (require on first use, not a top-level import): the
 * native module only exists in a build made AFTER expo-iap was added, so a
 * static import would crash the whole app at startup on older dev builds
 * (RootNavigator statically pulls in PaywallScreen → this file). Lazy + guarded
 * means: no native module → purchases simply report unavailable, the app never
 * crashes, and nothing is fake-granted. Rebuild the dev/preview app to enable IAP.
 */
import { supabase } from '../../lib/supabase';
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

let iapMod: IapApi | null = null;
let iapTried = false;
/** Lazily load expo-iap. Returns null (never throws) when the native module
 *  isn't in this build — callers then report "unavailable". */
function getIap(): IapApi | null {
  if (iapTried) return iapMod;
  iapTried = true;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    iapMod = require('expo-iap') as IapApi;
  } catch (e) {
    console.warn('[iap] expo-iap unavailable (rebuild needed to enable IAP):', (e as Error).message);
    iapMod = null;
  }
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
          const ok = await validateWithServer(purchase);
          if (ok) {
            try {
              await iap.finishTransaction({ purchase, isConsumable: false });
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
 * Restore previous purchases (App Store requirement). Re-validates each held
 * purchase server-side and finishes it; returns true if at least one academy
 * entitlement was (re)granted.
 */
export async function restorePurchases(): Promise<boolean> {
  const iap = getIap();
  if (!iap) return false;
  try {
    const purchases = (await iap.getAvailablePurchases()) as IapPurchase[];
    let any = false;
    for (const p of purchases) {
      if (p.productId && planIdForSku(p.productId) && (await validateWithServer(p))) {
        any = true;
        try {
          await iap.finishTransaction({ purchase: p, isConsumable: false });
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
