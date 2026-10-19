/**
 * djMatch — the pre-matched blend (pure, so test/djSetupReady_20261018
 * reaches it; booth/setup.preMatched is this).
 *
 * Deck B's tempo fader is set so it plays at deck A's tempo: the blend
 * lessons start pre-matched so nothing is judged on drifting beats (Screen 10
 * shows how it is done). KEY LOCK is ON (second audio review 2026-10-18 #1):
 * without it the tempo match also moves deck B's pitch — Glass Harbour at
 * −3.17 % is 0.56 of a semitone flat, the state Screen 14 calls OUT OF TUNE —
 * so every pre-matched blend would be sour.
 */
import { TRACKS } from '../engine/djMusic.ts';
import { pitchFor, playedBpm } from './djTime.ts';
import type { Booth } from './djModel.ts';

export function preMatchedBooth(b: Booth, keyLock = true): Booth {
  const A = b.decks.A;
  const B = b.decks.B;
  if (!A.track || !B.track) return b;
  return { ...b, decks: { ...b.decks, B: { ...B, pitch: pitchFor(TRACKS[B.track].bpm, playedBpm(TRACKS[A.track].bpm, A.pitch)), keyLock } } };
}
