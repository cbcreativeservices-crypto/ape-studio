/**
 * IAP product catalog (owner 2026-08-21). Maps the app's three academy plans to
 * store product IDs (SKUs). These IDs MUST be created verbatim in App Store
 * Connect AND Google Play Console — see docs/APE_IAP_PLAN_2026_08_21.md.
 *
 * monthly / annual are auto-renewing SUBSCRIPTIONS (type 'subs'); lifetime is a
 * NON-CONSUMABLE in-app product (type 'in-app'). Prices/names are the store's
 * truth at purchase; the public.products table mirrors them for reference
 * (monthly 999 / annual 5999 / lifetime 9999).
 */
export type PlanId = 'monthly' | 'annual' | 'lifetime';

export type PlanDef = {
  id: PlanId;
  sku: string; // the store product id — must match App Store Connect / Play exactly
  kind: 'subs' | 'in-app';
};

export const PLANS: Record<PlanId, PlanDef> = {
  monthly: { id: 'monthly', sku: 'academy_monthly', kind: 'subs' },
  annual: { id: 'annual', sku: 'academy_annual', kind: 'subs' },
  lifetime: { id: 'lifetime', sku: 'academy_lifetime', kind: 'in-app' },
};

export const SUBSCRIPTION_SKUS = [PLANS.monthly.sku, PLANS.annual.sku];
export const INAPP_SKUS = [PLANS.lifetime.sku];
export const ALL_SKUS = [...SUBSCRIPTION_SKUS, ...INAPP_SKUS];

/** Purchase analytics (D98). Every value here is a fixed word, so nothing a
 *  store or server says can reach Aptabase: their free text may name a person. */
export type PurchaseFailure = {
  stage: 'store' | 'verify' | 'restore';
  reason: string;
};

/** A store error as a fixed word. Same order as purchase.ts storeErrorMessage. */
export function storeFailureOf(err: { code?: unknown; message?: unknown } | null | undefined): PurchaseFailure {
  const code = String(err?.code ?? '').toLowerCase().replace(/_/g, '-');
  const message = String(err?.message ?? '').toLowerCase();
  if (code.includes('cancel') || message.includes('cancel')) return { stage: 'store', reason: 'cancelled' };
  if (code.includes('deferred') || code === 'pending' || code === 'e-pending') {
    return { stage: 'store', reason: 'deferred' };
  }
  if (code.includes('already-owned')) return { stage: 'store', reason: 'already_owned' };
  return { stage: 'store', reason: 'store_error' };
}

export function verifyFailureOf(serverReason: string | null): PurchaseFailure {
  return { stage: 'verify', reason: serverReason === 'receipt_already_linked' ? 'linked' : 'not_verified' };
}

/** A finished restore as a failure, or null when it was not one: 'restored'
 *  has its own event, and 'none' only means there was nothing to restore. */
export function restoreFailureOf(result: string): PurchaseFailure | null {
  if (result === 'restored' || result === 'none') return null;
  const known = ['error', 'unavailable', 'linked', 'pending', 'expired', 'refunded'];
  return { stage: 'restore', reason: known.includes(result) ? result : 'error' };
}

/** A renewal the store delivers while the app runs (iOS) is not a new sale. */
export function isRenewalDelivery(p: { reasonIOS?: unknown; transactionReasonIOS?: unknown }): boolean {
  return /renew/i.test(String(p.reasonIOS ?? p.transactionReasonIOS ?? ''));
}

/** The store's numeric price and ISO currency for a SKU, or null when it gave
 *  neither: a guessed amount is never reported. */
export function storeChargeFor(products: unknown[], sku: string): { amount: number; currency: string } | null {
  for (const raw of products) {
    const p = (raw ?? {}) as { id?: unknown; productId?: unknown; price?: unknown; currency?: unknown };
    if ((p.id ?? p.productId) !== sku) continue;
    const ok =
      typeof p.price === 'number' &&
      Number.isFinite(p.price) &&
      p.price > 0 &&
      typeof p.currency === 'string' &&
      /^[A-Z]{3}$/.test(p.currency);
    return ok ? { amount: p.price as number, currency: p.currency as string } : null;
  }
  return null;
}

/** Reverse map: store SKU → our plan id. */
export function planIdForSku(sku: string): PlanId | null {
  const hit = (Object.values(PLANS) as PlanDef[]).find((p) => p.sku === sku);
  return hit?.id ?? null;
}
