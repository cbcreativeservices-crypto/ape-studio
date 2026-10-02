/**
 * ONE SOUND AT A TIME on a page with ▶ TAP and ▶ STRIKE (toddler pass 2 —
 * Chapter 6's stopAll rule, applied to Chapters 1, 3 and 7). The two have
 * their own players, so a TAP pressed over a ringing STRIKE (or the reverse)
 * played both at once: the lug pitch the learner was asked to judge was
 * buried under the whole drum, the status line named only one of them, and
 * tapping the display while the TAP rang started a STRIKE on top instead of
 * stopping (the house tap-to-toggle rule).
 *
 * Pure (no React Native import) so the rule is tested on its own.
 */
import type { DrumPlayback } from './useDrumPlayback';

type Transport = Pick<DrumPlayback, 'stop' | 'playing' | 'pending'> & { play: () => Promise<boolean> | void };

/** `strike` / `tap` resolve true only when that sound actually started
 *  (toddler pass 3 — a lug is "tapped" when it was HEARD, never on a press
 *  the audio gate refused). */
export function soloPair(strike: Transport, tap: Transport): { strike: () => Promise<boolean>; tap: () => Promise<boolean>; toggle: () => void } {
  const busy = (p: Transport) => p.playing || p.pending;
  return {
    strike: () => {
      tap.stop();
      return Promise.resolve(strike.play()).then((ok) => ok === true);
    },
    tap: () => {
      strike.stop();
      return Promise.resolve(tap.play()).then((ok) => ok === true);
    },
    toggle: () => {
      if (busy(strike) || busy(tap)) {
        strike.stop();
        tap.stop();
      } else {
        tap.stop();
        strike.play();
      }
    },
  };
}
