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

/** The host's ear: `on` while the reporting view has work under way. The host
 *  also publishes it app-wide (setScreenWork in intro/screenIntros.ts,
 *  2026-11-14), so the lab term popup and the Sound Safety arrival ask never
 *  open over an open tray either (audit row 1: "It never opens on top of an
 *  open tray or console"). This file stays import-free of app modules: the
 *  node tests import it directly. */
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

/**
 * STEP INTROS: A POPUP ON THE FIRST STEP ONLY, THEN INLINE (owner decision
 * 2026-11-14, phase 3 item 3: "do your recommendations for these"; audit
 * section 3 row 15. Drum Tuning took ~36 GOT IT taps for a full run;
 * Envelope, Tuning and Speech the same).
 *
 * A ScreenGuideHost that swaps its content in place (steps, chapters, pages,
 * tabs: its `resetKey`) offers one intro card per step. The FIRST card the
 * host presents on a visit is the popup; every later step's card in the same
 * visit shows the SAME words as a non-blocking inline note (nothing dimmed,
 * no tap held), so nothing is lost and nothing interrupts. A card that
 * carries the lab's glossary term is always the popup (the term needs it).
 */
export type IntroPresentMode = 'popup' | 'inline';
export function introPresentMode(poppedThisVisit: boolean, carriesTerm: boolean): IntroPresentMode {
  if (carriesTerm) return 'popup';
  return poppedThisVisit ? 'inline' : 'popup';
}
