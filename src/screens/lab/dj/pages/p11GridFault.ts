/**
 * p11GridFault — Screen 11's LOOPS TWICE AS LONG fault, the pure half (tests
 * reach it). The fault is fixed when deck B's half-BPM grid has been doubled
 * back to the true one AND the loop running NOW is 4 real beats — read from
 * the live deck, never from a flag latched earlier on the screen.
 *
 * Toddler bug 2026-10-19: the old check used a "made a 4-real-beat loop"
 * flag latched for the whole visit. A learner who had once looped on a
 * right grid (GRID tray → HALF BPM, BPM ×2, LOOP 4 BEATS) and then started
 * the fault saw it marked FIXED the moment they pressed BPM ×2 — while the
 * fault's 8-real-beat loop was still running.
 */
import { TRACKS } from '../engine/djMusic.ts';
import { gridCorrect } from '../model/djDeck.ts';
import type { DeckState } from '../model/djModel.ts';

/** Real beats in the deck's running loop (0 with no loop). */
export function loopRealBeats(d: DeckState): number {
  return d.loop && d.track ? (d.loop.lengthSec * TRACKS[d.track].bpm) / 60 : 0;
}

/** The half-BPM fault is repaired: grid doubled back AND a 4-real-beat loop. */
export function halfBpmFaultFixed(d: DeckState): boolean {
  return d.gridMode === 'HALF_BPM' && gridCorrect(d) && Math.abs(loopRealBeats(d) - 4) < 0.01;
}
