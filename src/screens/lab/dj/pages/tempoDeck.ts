/**
 * tempoDeck — Screen 10's deck reset, the pure half (tests reach it).
 *
 * Screen 10 teaches that on this lab's players the TEMPO fader changes speed
 * AND pitch (no key lock), on the standard ±8 % range the dock fader uses.
 * Earlier screens leave deck B with KEY LOCK on (the pre-matched blends), and
 * Screen 14 can leave a key shift and a ±16 % range. Entering Screen 10 puts
 * every deck back to the plain Stage 1 player the page describes (owner
 * 2026-11-25, fix-first 15) — the same values Screen 14's own setup uses, and
 * the same behaviour as a fresh booth, so any screen after it starts as it
 * would on a first visit.
 */
import { PITCH_RANGE_PCT } from '../model/djTime.ts';
import type { DeckState } from '../model/djModel.ts';

export function plainTempoDeck<D extends Pick<DeckState, 'pitch' | 'keyLock' | 'keyShift' | 'tempoRange'>>(d: D): D {
  // A Stage 2 setting the deck never carried stays ABSENT (round 2, 2026-11-25):
  // the player draws its KEY LOCK / KEY ± keys whenever `keyLock` is defined
  // (PlayerTop.tsx), so writing `false` onto a deck that had none would add those
  // keys to deck A on this and every later screen.
  const out: D = { ...d, pitch: 0 };
  if (d.keyLock !== undefined) out.keyLock = false;
  if (d.keyShift !== undefined) out.keyShift = 0;
  if (d.tempoRange !== undefined) out.tempoRange = PITCH_RANGE_PCT;
  return out;
}
