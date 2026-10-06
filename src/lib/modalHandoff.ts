/**
 * modalHandoff — the core of "close the popup, THEN present the next thing"
 * (pattern P5, closer A3, 2026-10-02).
 *
 * UIKit presents one modal at a time. Every app popup (AppDialog, the
 * membership card, PrePaywallPrompt, StudyAccessSheet, the glossary lock…) is
 * a DimModal, and Paywall / Settings / Help / About / WeeklyConcept /
 * ExposureMonitor are `presentation: 'modal'` screens. Opening
 * one of those screens in the same tap that closes a popup is refused while
 * the popup's Modal is still fading out (HOST_DISMISS_MS) — the button reads
 * as dead on iPhone, and Android draws the screen BEHIND the popup.
 *
 * Five screens hand-rolled the wait (a timer ref, a double-tap check, an
 * unmount clear) and none of them held the dialog queue, which
 * `afterDialogCloses` learned to do on 2026-10-01. This is that hand-off ONCE:
 *
 * - waits `waitMs` (HOST_DISMISS_MS) before running the next step;
 * - holds the AppDialog queue for twice the wait, so a dialog queued behind
 *   cannot put its own Modal up first and block the screen again;
 * - ONE hand-off at a time: a double tap on EXPLORE MEMBERSHIP is one Paywall;
 * - `cancel()` (unmount) drops a pending step — never a Paywall over a screen
 *   the learner has already left.
 *
 * Pure (no React, no react-native) so it is tested directly; the hook that
 * screens use is `useModalHandoff` in lib/confirm.ts.
 */

export type ModalHandoff = {
  /** Run `next` once the closing popup has gone. Ignored while one is pending. */
  run(next: () => void): void;
  /** Drop a pending step (the screen unmounted). */
  cancel(): void;
  pending(): boolean;
};

export function createModalHandoff(deps: {
  waitMs: number;
  /** Holds the AppDialog queue for `ms` (holdAppDialogQueue). */
  hold: (ms: number) => void;
  setTimer?: (fn: () => void, ms: number) => unknown;
  clearTimer?: (t: unknown) => void;
}): ModalHandoff {
  const setTimer = deps.setTimer ?? ((fn: () => void, ms: number) => setTimeout(fn, ms));
  const clearTimer = deps.clearTimer ?? ((t: unknown) => clearTimeout(t as ReturnType<typeof setTimeout>));
  let timer: unknown = null;
  return {
    run(next) {
      if (timer != null) return;
      deps.hold(deps.waitMs * 2);
      timer = setTimer(() => {
        timer = null;
        next();
      }, deps.waitMs);
    },
    cancel() {
      if (timer != null) clearTimer(timer);
      timer = null;
    },
    pending: () => timer != null,
  };
}
