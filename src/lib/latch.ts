/**
 * latch — one run of a press's work at a time (pattern P9, 2026-10-02).
 *
 * The bug class: a guard kept in React state (`if (busy) return;
 * setBusy(true)`, or `disabled={busy}` alone) does not stop a second tap that
 * lands in the same frame — both taps see the old `busy`. Two share sheets
 * (iOS refuses the second, and the screen then says sharing "isn't
 * available on this device"), two camera launches, two writes.
 *
 * The house idiom is a SYNCHRONOUS ref claimed as the first statement and
 * released in `finally` (useSending, ExportPanel's busyRef, sharingRef…).
 * This is that idiom once, for new code and for the sites that lacked it:
 *
 *   const share = useLatchedPress(async () => { …await captureAndShare(…)… });
 *   <Btn onPress={share} />
 *
 * One latch per LOGICAL action: buttons that open the same kind of thing
 * (COPY / SHARE LINK / SHARE QR) share one `useInFlightLatch()`.
 *
 * Not for navigation: RN7's StackRouter already ignores a second
 * `navigate('X')` while X is the focused route (see
 * test/patternP9_20261002.test.ts). `push()` does stack twice and keeps its
 * own window (Mod8Apply, ToolsHub's openOnce).
 */
import { useCallback, useRef } from 'react';

export type InFlightLatch = {
  /** Runs `task` unless a run is already in flight. A refused call resolves
   *  `undefined` without calling `task`. The claim is synchronous, so a
   *  same-frame second tap is refused; the release is in `finally`, so a
   *  throwing task cannot leave the button dead. */
  run<T>(task: () => Promise<T> | T): Promise<T | undefined>;
  busy(): boolean;
};

export function createInFlightLatch(): InFlightLatch {
  let inFlight = false;
  return {
    async run(task) {
      // An async function runs synchronously up to its first await, so this
      // check-and-claim happens inside the tap that called it.
      if (inFlight) return undefined;
      inFlight = true;
      try {
        return await task();
      } finally {
        inFlight = false;
      }
    },
    busy: () => inFlight,
  };
}

/** A per-mount latch, stable across renders. */
export function useInFlightLatch(): InFlightLatch {
  const ref = useRef<InFlightLatch | null>(null);
  if (ref.current == null) ref.current = createInFlightLatch();
  return ref.current;
}

/**
 * An onPress for async work that runs once at a time. Always calls the
 * LATEST `fn` (no stale closure), and the returned handler is stable. Pass a
 * shared `latch` when several buttons are one action.
 */
export function useLatchedPress<A extends unknown[]>(
  fn: (...args: A) => Promise<unknown> | unknown,
  latch?: InFlightLatch,
): (...args: A) => void {
  const own = useInFlightLatch();
  const use = latch ?? own;
  const fnRef = useRef(fn);
  fnRef.current = fn;
  return useCallback(
    (...args: A) => {
      void use.run(() => fnRef.current(...args)).catch(() => {});
    },
    [use],
  );
}
