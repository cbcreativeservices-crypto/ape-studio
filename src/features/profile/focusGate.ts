/**
 * What a Profile surface may show after an await (bug pass 2, CODE-2-11 and
 * its follow-up, 2026-11-08).
 *
 * Profile is a TAB: it stays mounted while Study or My Progress is in front,
 * and the RN Modal and `notify` are global. An answer that lands after the
 * member left Profile must not open over another tab. Two kinds of answer:
 *
 *  - `ifFocused`: an answer nobody is waiting for (the share popup, "add your
 *    name first"). Shown if Profile is in front, else dropped: the switch never
 *    turned on, so the member just turns it on again.
 *  - `nowOrOnFocus`: a FAILURE the member must still see (a stop that was not
 *    confirmed). Shown if Profile is in front, else kept and shown the next
 *    time Profile is focused (`onFocus`). Only the newest is kept.
 *
 * `isFocused` is read when the answer lands, never from the render that
 * started the tap. Pure and import-free so its node test runs bare.
 */
export type FocusGate = {
  ifFocused(show: () => void): void;
  nowOrOnFocus(show: () => void): void;
  /** Call when the screen gains focus: shows the kept answer, once. */
  onFocus(): void;
  /** Is an answer waiting for focus? (tests) */
  hasPending(): boolean;
};

export function createFocusGate(isFocused: () => boolean): FocusGate {
  let pending: (() => void) | null = null;
  return {
    ifFocused(show) {
      if (isFocused()) show();
    },
    nowOrOnFocus(show) {
      if (isFocused()) {
        pending = null;
        show();
      } else {
        pending = show;
      }
    },
    onFocus() {
      const show = pending;
      pending = null;
      if (show) show();
    },
    hasPending() {
      return pending !== null;
    },
  };
}
