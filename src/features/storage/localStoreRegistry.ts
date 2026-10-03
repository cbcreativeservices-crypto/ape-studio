/**
 * localStoreRegistry — every `createLocalStore` registers its reset here at
 * creation, so the account wipe (`resetAllLocalStores` in
 * features/account/clearLocalAccountData.ts) reaches it with no hand-written
 * import. The hand-kept list drifted every bug pass (2 missing, then 9, then
 * 3 — see test/accountWipeRegistry.test.ts); a store that cannot forget to
 * register cannot drift.
 *
 * Pure: no React, no storage. Kept apart from localStore.ts so the wipe can
 * import it without pulling React into the account module.
 */

const resets = new Set<() => void>();
/** How many account wipes have run this app session (the hand-rolled
 *  writers' fence for the failed-save notice — saveFailureNotice.ts). */
let wipes = 0;

/** Bumped by every account wipe; capture before a write, compare after. */
export function localStoreWipeCount(): number {
  return wipes;
}

/** Called once per store, at creation. */
export function registerLocalStoreReset(reset: () => void): void {
  resets.add(reset);
}

/** The account wipe: bump every registered store's generation and drop its
 *  memory. A reset that throws must not stop the others. */
export function resetRegisteredLocalStores(): void {
  wipes++;
  for (const reset of [...resets]) {
    try {
      reset();
    } catch {
      // one store's failure must not leave another holding the departing user
    }
  }
}

/** How many stores are registered (guard tests). */
export function registeredLocalStoreCount(): number {
  return resets.size;
}
