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

/** How long the booth must stay clean, in booth seconds of rendered sound,
 *  before Screen 6's overload counts as fixed (lab fix round 2026-11-14, F2:
 *  ONE clean 3 s chunk ticked "Fix the hidden overload" while the trims were
 *  still hot enough to clip the bus on the next loud bar — "✓ fixed" next to
 *  MIX BUS: OVER, and no "Fixed." line). The first chunk after a change is
 *  3 s, the next ones 8 s (useBoothAudio), so this needs the change's own
 *  chunk AND the next one clean. */
export const CLEAN_HOLD_S = 8;

/** A run of clean renders since the fault started: `since` the booth time
 *  the run began (null while not clean), `seen` the last chunk counted. */
export type CleanRun = { since: number | null; seen: number | null };
export const CLEAN_RUN_FRESH: CleanRun = { since: null, seen: null };

/** Count one more render into the run (each chunk once, only chunks
 *  rendered after the fault started). A chunk that clips ends the run. */
export function cleanRunStep(run: CleanRun, r: { t0: number; seconds: number } | null | undefined, clean: boolean, faultAt: number | null): CleanRun {
  if (!r || !renderedSince(r, faultAt) || r.t0 === run.seen) return run;
  return { seen: r.t0, since: clean ? (run.since ?? r.t0) : null };
}

/** Booth seconds of clean sound in the run, up to the end of `r`. */
export function cleanFor(run: CleanRun, r: { t0: number; seconds: number } | null | undefined): number {
  return run.since == null || !r ? 0 : r.t0 + r.seconds - run.since;
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
