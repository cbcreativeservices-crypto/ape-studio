/**
 * paywallCopy — the words AT the point of purchase (landing + paywall
 * redesign, owner 2026-10-22; compliance review rows 2, 6, 7, 8, 10).
 *
 * Pure (no React / native imports) so node --test can pin every sentence.
 *
 *  • The buy button NAMES THE PLAN, and the amount only when the STORE has
 *    answered (`storePrice` is the store's own localized `displayPrice`, never
 *    a USD fallback). A guest's button says what actually happens next.
 *  • The disclosure is PLAN-SPECIFIC and sits directly above the buy button:
 *    plan title and length, the price per period from the store, "renews
 *    automatically until you cancel", and how to cancel in the store's own
 *    subscription settings. Lifetime says it is one payment that never renews,
 *    so the renewal words can never read as if they applied to it.
 *
 * ⛔ No price literal in this file. A price shown here would go false the day
 *    prices change (1 January 2027); the store is the only source.
 */
import type { PlanId } from './iapProducts';
import { COPY } from '../../lib/copy.ts';

/** The store's own name, for "your {store} subscription settings". */
export function storeNameFor(os: string): string {
  if (os === 'ios') return 'App Store';
  if (os === 'android') return 'Google Play';
  return 'app store';
}

/** The buy button's label (H5 plan-named buttons, H6 gold). */
export function buyLabel(plan: PlanId, storePrice: string | undefined, guest: boolean): string {
  if (guest) return COPY.createAccountToContinue;
  const p = storePrice?.trim();
  switch (plan) {
    case 'annual':
      return p ? `SUBSCRIBE · ${p} / YEAR` : 'SUBSCRIBE · ANNUAL';
    case 'monthly':
      return p ? `SUBSCRIBE · ${p} / MONTH` : 'SUBSCRIBE · MONTHLY';
    case 'lifetime':
      return p ? `BUY LIFETIME · ${p}` : 'BUY LIFETIME';
  }
}

/**
 * The point-of-purchase disclosure for the selected plan. Plain words, short
 * sentences (reading grade ≤ 9). Without a store price it names the period and
 * says the store shows the price — it never guesses one.
 */
export function purchaseDisclosure(plan: PlanId, storePrice: string | undefined, store: string): string {
  const p = storePrice?.trim();
  const cancel = `Cancel any time in your ${store} subscription settings, at least 24 hours before it renews.`;
  switch (plan) {
    case 'annual':
      return `Annual Academy membership: ${p ? `${p} per year` : 'billed once a year at the price the store shows'}. It renews automatically each year until you cancel. ${cancel}`;
    case 'monthly':
      return `Monthly Academy membership: ${p ? `${p} per month` : 'billed once a month at the price the store shows'}. It renews automatically each month until you cancel. ${cancel}`;
    case 'lifetime':
      return `Lifetime Academy membership: ${p ? `${p}, ` : ''}a one-time purchase. It never renews, so there is nothing to cancel.`;
  }
}

/** A plan id from an untrusted source (route params), or null. */
export function planIdOf(v: unknown): PlanId | null {
  return v === 'annual' || v === 'monthly' || v === 'lifetime' ? v : null;
}
