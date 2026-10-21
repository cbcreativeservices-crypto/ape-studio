/**
 * s1Guards — small pure guards for screens 1–8 (toddler bug test
 * 2026-10-19). Pure (no React Native), so test/djToddler1to8_20261019
 * reaches them.
 *
 *  - `renderedSince`: a FaultCard's `fixed` that reads the latest render
 *    (`audio.last`) must not judge the booth from a chunk rendered BEFORE the
 *    fault was started. That chunk shows the clean booth the learner had a
 *    moment ago, so START THE FAULT read "Fixed" at once (Screens 6 and 7).
 *    Every chunk rendered after the start begins later than the booth time
 *    the start was pressed at (useBoothAudio renders from now + latency).
 *  - `deckOnAir` / `loadVerdict`: Screen 5 judges a LOAD by the deck as it was
 *    BEFORE the load — a load stops the deck, so after it no deck is ever on
 *    air, and loading onto the deck the crowd was hearing used to credit
 *    "Load a track deck A can tempo-match" with no warning.
 */
import { faderGain, xfGainFor, type Booth, type DeckId } from '../model/djModel.ts';

/** A chunk rendered BEFORE a change can still start sounding up to 60 ms
 *  after it (useBoothAudio waits that long before re-rendering); the first
 *  chunk AFTER it starts at least 60 ms + 0.15 s (the smallest render lead)
 *  later. A margin between the two tells them apart. */
export const RENDER_MARGIN_S = 0.1;

/** Was `r` rendered for booth time well after `t`? (`t` null: no fault
 *  started on this visit.) */
export function renderedSince(r: { t0: number } | null | undefined, t: number | null): boolean {
  return !!r && t != null && r.t0 > t + RENDER_MARGIN_S;
}

/** Is this deck reaching the crowd? (playing, its fader up and the
 *  crossfader letting it through) */
export function deckOnAir(b: Booth, d: DeckId): boolean {
  const ch = d === 'A' ? 1 : 2;
  const c = b.ch[ch];
  return b.decks[d].playing && faderGain(c.fader) * xfGainFor(c.xf, b.mixer.xf, b.mixer.xfCurve) > 0.01;
}

/** What a LOAD onto `deck` means, judged on the booth BEFORE the load:
 *  `stoppedCrowd` — it landed on the deck the crowd was hearing; `credit` —
 *  the spare deck B got a track deck A can tempo-match. */
export function loadVerdict(before: Booth, deck: DeckId, matchOk: boolean): { stoppedCrowd: boolean; credit: boolean } {
  const stoppedCrowd = deckOnAir(before, deck);
  return { stoppedCrowd, credit: !stoppedCrowd && deck === 'B' && matchOk };
}
