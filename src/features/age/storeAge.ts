/**
 * storeAgeBand() — the app store's age signal for the 18+ gates (Texas SB
 * 2420, owner go 2026-11-27, 1.0.1). The mapping is storeAgeMap.ts (pure).
 *
 * WHERE THE BAND LIVES: in this module's memory, for this app session only.
 * Never on the server, never in the database, never in storage, never in
 * telemetry (Sec. 121.055; guard test storeAgeSignal_20261127). An account
 * wipe drops it too. Screens never see the band itself: they ask
 * `adultAreasClosed()`, a yes/no.
 *
 * WHY A SESSION CACHE: Apple's sheet and Google's prompt must not reappear
 * on every tap. A definite answer (a band, declined, not a covered region,
 * no module) is kept until the app closes; an answer that may change soon
 * (a network blip, a busy Play service, a timeout) is not kept.
 *
 * LAZY: the native module is required on the first ask, never at app start
 * (the start graph is capped at 260 modules). A binary without the module
 * (built before 1.0.1), web and Expo Go read 'unknown'.
 */
import { bandFromRaw, isMinorBand, type BandRead, type StoreAgeBand } from './storeAgeMap.ts';
import { registerLocalStoreReset } from '../storage/localStoreRegistry.ts';

export type { StoreAgeBand } from './storeAgeMap.ts';

type AgeSignalNative = { requestAgeSignal(): Promise<unknown> };

/** Long enough for a person reading Apple's or Google's sheet; a native call
 *  that never answers still ends as 'unknown' (not kept). */
export const STORE_AGE_TIMEOUT_MS = 60_000;

export type StoreAgeReader = {
  read(): Promise<StoreAgeBand>;
  /** The kept band, or null when nothing definite is known yet. */
  peek(): StoreAgeBand | null;
  reset(): void;
};

export function createStoreAgeReader(
  load: () => AgeSignalNative | null,
  opts: { timeoutMs?: number } = {},
): StoreAgeReader {
  const timeoutMs = opts.timeoutMs ?? STORE_AGE_TIMEOUT_MS;
  let known: StoreAgeBand | null = null;
  let generation = 0;
  /** The native ask still out. Shared, so a second tap never opens a second
   *  sheet; it outlives a timeout, and a late answer is still kept. */
  let pending: Promise<BandRead> | null = null;

  const ask = (): Promise<BandRead> => {
    if (pending) return pending;
    const gen = generation;
    let native: AgeSignalNative | null = null;
    try {
      native = load();
    } catch {
      native = null;
    }
    const started: Promise<BandRead> = native
      ? Promise.resolve()
          .then(() => (native as AgeSignalNative).requestAgeSignal())
          .then(bandFromRaw, (): BandRead => ({ band: 'unknown', retry: true }))
      : Promise.resolve({ band: 'unknown', retry: false });
    const p = started.then((r) => {
      if (gen === generation && !r.retry) known = r.band;
      return r;
    });
    pending = p;
    void p.finally(() => {
      if (pending === p) pending = null;
    });
    return p;
  };

  return {
    read() {
      if (known) return Promise.resolve(known);
      const out = ask().then((r) => r.band);
      return new Promise<StoreAgeBand>((resolve) => {
        const t = setTimeout(() => resolve('unknown'), timeoutMs);
        void out.then((b) => {
          clearTimeout(t);
          resolve(b);
        });
      });
    },
    peek: () => known,
    reset() {
      generation++;
      known = null;
      pending = null;
    },
  };
}

const reader = createStoreAgeReader(() => {
  const m = require('../../../modules/ape-age-signal') as typeof import('../../../modules/ape-age-signal');
  return m.isAvailable() ? m : null;
});

/** The app store's age band for this session: adult | teen | child | unknown. */
export function storeAgeBand(): Promise<StoreAgeBand> {
  return reader.read();
}

/** Is a band already known (no sheet will show)? Null until then. */
export function peekStoreAgeBand(): StoreAgeBand | null {
  return reader.peek();
}

/**
 * The ONE question the screens ask: are the 18+ areas closed for this person?
 * True only for 'teen' or 'child'. 'unknown' and 'adult' keep today's
 * self-confirmation exactly.
 */
export async function adultAreasClosed(): Promise<boolean> {
  return isMinorBand(await storeAgeBand());
}

/** The account wipe: nothing kept for the next person on this phone. */
export function resetStoreAgeBand(): void {
  reader.reset();
}
registerLocalStoreReset(resetStoreAgeBand);
