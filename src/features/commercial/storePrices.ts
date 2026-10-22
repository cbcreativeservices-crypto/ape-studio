/**
 * Store-localized plan prices for the paywall (Apple 3.1.2, 2026-10-15: "full
 * renewal price, shown clearly and prominently, and localized").
 *
 * The paywall's own price strings are USD display copy. Once the store has
 * answered, each plan shows the STORE's `displayPrice` (already formatted in
 * the buyer's currency and locale) instead. A plan the store did not return
 * keeps its fallback text.
 *
 * Badges: a percentage is currency-neutral, so "SAVE n%" is DERIVED from the
 * store's numeric prices when both subscriptions came back in one currency. The
 * "About $5/mo" line is a USD figure, so it is DROPPED next to a store price and
 * replaced by a plain "Billed yearly". If the saving cannot be derived the
 * badge is dropped — never a USD claim beside a non-USD price.
 *
 * Pure (type-only imports), so it is unit-testable under node --test. The SKU
 * map is passed in — the caller hands over iapProducts' PLANS, the one source
 * of the product ids.
 */
import type { PlanId } from './iapProducts';

export type PlanCopy = {
  id: PlanId;
  name: string;
  /** The card's price line. Empty until the store answers (2026-10-22: no
   *  hard-coded fallback price — prices rise on 1 January 2027). */
  price: string;
  sub: string;
  badge?: string;
  /** The STORE's own localized `displayPrice`, bare (no period). Set ONLY by
   *  localizePlans from a store answer, so the buy button and the disclosure
   *  can never be built from a fallback figure. */
  storePrice?: string;
};

/** The few fields we read from an expo-iap (OpenIAP) product. */
type StoreProduct = {
  id?: unknown;
  productId?: unknown;
  displayPrice?: unknown;
  price?: unknown;
  currency?: unknown;
};

const PERIOD: Record<PlanId, string> = { monthly: ' / mo', annual: ' / yr', lifetime: '' };

function skuOf(p: StoreProduct): string | null {
  const id = typeof p.id === 'string' ? p.id : typeof p.productId === 'string' ? p.productId : null;
  return id;
}

function priceOf(p: StoreProduct | undefined): number | null {
  return p && typeof p.price === 'number' && Number.isFinite(p.price) && p.price > 0 ? p.price : null;
}

/**
 * Merge the store's products into the fallback plan copy. `products` is what
 * loadStoreProducts returned (empty on failure → the fallback unchanged).
 */
export function localizePlans(
  fallback: PlanCopy[],
  products: unknown[],
  skus: Record<PlanId, { sku: string }>,
): PlanCopy[] {
  const bySku = new Map<string, StoreProduct>();
  for (const raw of products) {
    if (!raw || typeof raw !== 'object') continue;
    const p = raw as StoreProduct;
    const sku = skuOf(p);
    if (sku && typeof p.displayPrice === 'string' && p.displayPrice.trim()) bySku.set(sku, p);
  }
  if (bySku.size === 0) return fallback;

  const product = (id: PlanId) => bySku.get(skus[id].sku);
  const monthly = product('monthly');
  const annual = product('annual');
  let savePct: number | null = null;
  const m = priceOf(monthly);
  const a = priceOf(annual);
  if (m && a && monthly?.currency && monthly.currency === annual?.currency) {
    const pct = Math.round((1 - a / (m * 12)) * 100);
    if (pct >= 1) savePct = pct;
  }

  return fallback.map((plan) => {
    const p = product(plan.id);
    if (!p) return plan;
    const storePrice = String(p.displayPrice).trim();
    const price = `${storePrice}${PERIOD[plan.id]}`;
    if (plan.id === 'annual') {
      return { ...plan, price, storePrice, sub: 'Billed yearly', badge: savePct ? `SAVE ${savePct}%` : undefined };
    }
    return { ...plan, price, storePrice };
  });
}
