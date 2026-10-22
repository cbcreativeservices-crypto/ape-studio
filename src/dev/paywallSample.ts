/**
 * DEV + WEB PREVIEW ONLY — sample store answers for the Paywall, so the owner
 * can review the plan cards, the plan-named buy button and the plan-specific
 * disclosure in the browser, where no store exists (landing/paywall redesign,
 * 2026-10-22).
 *
 * Opt-in by hash suffix: `#labpreview/Paywall/sample` (or
 * `#labpreview/OnboardingLanding/sample`, then SEE MEMBERSHIP PLANS). Without
 * `/sample` the browser shows the real no-store state ("Price shown at
 * checkout").
 *
 * ⛔ These figures are STORE-SHAPED SAMPLES, not prices the app shows to anyone:
 *    the Paywall only reads them under `__DEV__ && Platform.OS === 'web'`, and
 *    they go through the same localizePlans() a real store answer does. They
 *    mirror the store's current USD prices on the day this was written.
 */
export function devSampleStoreProducts(): unknown[] | null {
  if (typeof window === 'undefined' || !/\/sample$/.test(window.location.hash)) return null;
  return [
    { id: 'academy_monthly', displayPrice: '$9.99', price: 9.99, currency: 'USD' },
    { id: 'academy_annual', displayPrice: '$59.99', price: 59.99, currency: 'USD' },
    { id: 'academy_lifetime', displayPrice: '$99.99', price: 99.99, currency: 'USD' },
  ];
}
