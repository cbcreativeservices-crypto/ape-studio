/**
 * The intro card waits for the learner's work (held frame item 2, owner
 * 2026-11-13; audit F13 and the Game Audio bug tests: the first-visit intro
 * card rose over a dock tray the learner had already opened, or arrived a
 * second late on top of a drag already under way, on pages 4, 7, 8, 9, 17).
 *
 * The house `hold` rule (K10): a popup that must wait for another surface is
 * held, never presented over it. A dock tray is not a DimModal, so the card's
 * `useModalHostOpen` gate could not see it. A view inside a ScreenGuideHost
 * (the Rack Unit) reports its work here; the host then:
 *   - holds a card still owed, and DROPS it for this visit (it is not marked
 *     seen, so it comes back on the next visit): the learner has started, and
 *     a card arriving after the tray closes would land on the next step;
 *   - closes a card already up (marked seen: the dock it keeps live is what
 *     the learner just used).
 *
 * A leaf module (React only): the Rack Unit is shared by every lab, and this
 * costs it one context read. Outside a host it does nothing.
 */
import { createContext, useContext, useEffect, useState } from 'react';

/** The host's ear: `on` while the reporting view has work under way. */
export type IntroWorkReport = (id: number, on: boolean) => void;
export const IntroWorkContext = createContext<IntroWorkReport | null>(null);

let seq = 0;

/** Report work under way (a tray open, a drag on the lane) to the screen's
 *  ScreenGuideHost, for as long as `on`. */
export function useScreenGuideWork(on: boolean): void {
  const report = useContext(IntroWorkContext);
  const [id] = useState(() => ++seq);
  useEffect(() => {
    if (!report) return;
    report(id, on);
    return () => report(id, false);
  }, [report, id, on]);
}

/** What the intro card does when work starts: the pure rule the host runs.
 *  `owed` = an offered card not yet presented or dropped on this visit;
 *  `shown` = what the host's overlay shows now. */
export type IntroWorkAction = 'none' | 'drop' | 'close';
export function introWorkAction(working: boolean, owed: boolean, shown: 'intro' | 'guide' | null): IntroWorkAction {
  if (!working) return 'none';
  if (shown === 'intro') return 'close';
  // The stepped guide was asked for: it stays (its TRY THIS strip keeps the
  // screen live on purpose), and an owed card is moot under it already.
  if (shown === 'guide') return 'none';
  return owed ? 'drop' : 'none';
}
