/**
 * djLessons — the measurable tests behind the DJ Systems Lab's practice goals,
 * kept pure so test/djLessons.test.ts can prove them against the real render.
 *
 *   GAIN (Screen 6, audio review 2026-10-18 #1). Peaks are not loudness: a
 *   loud master reaches the same peak as a quiet one but sounds several dB
 *   louder. Two channels are MATCHED by their AVERAGE level (where the meter
 *   sits most of the time — the render's RMS of the channel tap), within
 *   2 dB, inside a sensible band; the PEAK is only a ceiling (under −3 dBFS).
 *
 *   TWO COPIES (Screen 8, review #19 + learning p08 #1). The +6.02 dB of two
 *   identical, aligned copies is MEASURED, not ticked: the mix bus is read
 *   against channel 1's own meter (bus − CH1, a content-free ratio, so two
 *   moments of the music compare), once with CH2 down (one copy) and once
 *   with CH2 back level with CH1 (two copies). It counts only on the CUT
 *   curve with the crossfader in the middle (or both channels on THRU) —
 *   where each side is at full level, so "+6 dB" means louder than one deck
 *   alone.
 */
import type { BoothRender } from '../engine/djRender.ts';
import type { Booth, ChannelId } from './djModel.ts';

/* ── gain matching ─────────────────────────────────────────────────────── */

/** The average band a matched pair should sit in (dBFS, RMS of the channel). */
export const AVG_BAND = { lo: -21, hi: -15 } as const;
/** Peaks stay under this (dBFS): the ceiling, never the target. */
export const PEAK_CEILING_DB = -3;
/** Two averages this close (dB) are matched. */
export const MATCH_DB = 2;

export type ChanLevels = { avg: number | null; peak: number | null };

/** A channel's average (RMS) and peak (dBFS) over one render; null = silent. */
export function chanLevels(r: BoothRender | null, ch: ChannelId): ChanLevels {
  if (!r) return { avg: null, peak: null };
  const tap = ch === 1 ? 'ch1' : 'ch2';
  let pk = -120;
  for (const v of r.raw[tap]) if (v > pk) pk = v;
  const avg = r.rmsDb[tap];
  return { avg: avg > -80 ? avg : null, peak: pk > -59.9 ? pk : null };
}

/** The channel's average sits in the band and its peaks under the ceiling. */
export const levelSet = (l: ChanLevels): boolean => l.avg != null && l.peak != null && l.avg >= AVG_BAND.lo && l.avg <= AVG_BAND.hi && l.peak < PEAK_CEILING_DB;

/** Both channels set, and their AVERAGES within MATCH_DB — peaks may differ. */
export const averagesMatched = (a: ChanLevels, b: ChanLevels): boolean => levelSet(a) && levelSet(b) && Math.abs(a.avg! - b.avg!) <= MATCH_DB;

/** Peaks within MATCH_DB (what NOT to match by — kept for the test). */
export const peaksMatched = (a: ChanLevels, b: ChanLevels): boolean => a.peak != null && b.peak != null && Math.abs(a.peak - b.peak) <= MATCH_DB;

/* ── the two-copies comparison ─────────────────────────────────────────── */

/** The mix bus against channel 1's own meter, dB (RMS); null when CH1 is silent. */
export function busOverCh1(r: BoothRender | null): number | null {
  if (!r || r.rmsDb.ch1 <= -80 || r.rmsDb.bus <= -80) return null;
  return r.rmsDb.bus - r.rmsDb.ch1;
}

/** Both sides at full level in the middle: CUT at the centre, or both THRU. */
export function fullBothSides(b: Booth): boolean {
  const thru = b.ch[1].xf === 'THRU' && b.ch[2].xf === 'THRU';
  return thru || (b.mixer.xfCurve === 'CUT' && Math.abs(b.mixer.xf - 0.5) < 0.1);
}

/** The demonstration's set-up: one track on both decks, both playing. */
export const sameTrackBoth = (b: Booth): boolean => !!b.decks.A.track && b.decks.A.track === b.decks.B.track && b.decks.A.playing && b.decks.B.playing;

/** Where the comparison stands: one copy (CH2 down), two copies (CH2 level
 *  with CH1), or neither. */
export function copiesState(b: Booth): 'one' | 'two' | null {
  if (!sameTrackBoth(b) || b.ch[1].fader < 0.3) return null;
  if (b.ch[2].fader <= 0.02) return 'one';
  if (Math.abs(b.ch[2].fader - b.ch[1].fader) <= 0.03) return 'two';
  return null;
}

/** The measured rise from one copy to two (dB), and whether it counts. */
export function twoCopiesResult(b: Booth, oneRel: number | null, r: BoothRender | null): { delta: number | null; met: boolean } {
  const now = busOverCh1(r);
  if (oneRel == null || now == null || copiesState(b) !== 'two') return { delta: null, met: false };
  const delta = now - oneRel;
  return { delta, met: fullBothSides(b) && delta >= 5.5 && delta <= 6.5 };
}
