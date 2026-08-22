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

/** Reverse map: store SKU → our plan id. */
export function planIdForSku(sku: string): PlanId | null {
  const hit = (Object.values(PLANS) as PlanDef[]).find((p) => p.sku === sku);
  return hit?.id ?? null;
}
