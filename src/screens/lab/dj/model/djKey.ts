/**
 * djKey — speed, pitch and key (Stage 2, Screen 14; research DJ20). Pure
 * TypeScript; pinned by test/djStage2Engine.test.ts.
 *
 *   SPEED changes PITCH. A deck played `rate` times faster sounds
 *   12·log2(rate) semitones higher (a turntable, or a player with key lock
 *   off): +8 % is +1.33 semitones; 126 → 122 BPM (−3.17 %) is −0.56.
 *   KEY LOCK keeps the pitch while the tempo moves: the player TIME-STRETCHES
 *   the audio (engine/djStretch.ts — a real stretch, a simple one).
 *   KEY SHIFT moves the pitch in semitone steps without moving the tempo.
 *
 * So the pitch a deck sounds at, in semitones from the track's own key:
 *   key lock OFF: 12·log2(1 + pitch/100) + shift;  key lock ON: shift.
 *
 * KEYS are named by their tonic and mode. Two keys' relation is read on the
 * circle of fifths (same key, neighbours, …); a fraction of a semitone off is
 * OUT OF TUNE — that sounds worse than any "wrong" key.
 */
import { TRACKS, type TrackId } from '../engine/djMusic.ts';
import { semitonesOf } from './djTime.ts';
import type { DeckState } from './djModel.ts';

export const NOTE_NAMES = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'] as const;

/** The tempo range a player can be switched to (± %). */
export const TEMPO_RANGES = [8, 16] as const;
/** Key shift steps on offer (semitones). */
export const KEY_SHIFT_MAX = 3;

/** A track's key: tonic pitch class (C = 0) and mode. */
export function trackKey(id: TrackId): { pc: number; mode: 'minor' | 'major' } {
  const [name, mode] = TRACKS[id].key.split(' ');
  const pc = NOTE_NAMES.indexOf(name as (typeof NOTE_NAMES)[number]);
  return { pc: pc < 0 ? 0 : pc, mode: mode === 'major' ? 'major' : 'minor' };
}

/** Semitones the deck sounds away from its track's own key. */
export function playedSemis(d: Pick<DeckState, 'pitch' | 'keyLock' | 'keyShift'>): number {
  const shift = d.keyShift ?? 0;
  return d.keyLock ? shift : semitonesOf(d.pitch) + shift;
}

/** The pitch class (fractional) the deck's tonic now sounds at. */
export function soundingTonic(d: DeckState): number | null {
  if (!d.track) return null;
  const k = trackKey(d.track);
  return (((k.pc + playedSemis(d)) % 12) + 12) % 12;
}

/** "D minor", or "D minor −0.56 st" when it sounds between keys. */
export function keyWords(d: DeckState): string {
  if (!d.track) return '—';
  const k = trackKey(d.track);
  const s = playedSemis(d);
  // within ¾ of a semitone, name the track's own key with how far it is off
  const whole = Math.abs(s) < 0.75 ? 0 : Math.round(s);
  const frac = s - whole;
  const name = `${NOTE_NAMES[(((k.pc + whole) % 12) + 12) % 12]} ${k.mode}`;
  return Math.abs(frac) < 0.05 ? name : `${name} ${frac > 0 ? '+' : '−'}${Math.abs(frac).toFixed(2)} st`;
}

/** Steps apart on the circle of fifths (0 = the same key, 1 = neighbours). */
export function fifthsApart(pcA: number, pcB: number): number {
  const d = (((Math.round(pcB) - Math.round(pcA)) % 12) + 12) % 12;
  const f = (d * 7) % 12;
  return Math.min(f, 12 - f);
}

export type KeyRelation = 'SAME' | 'NEIGHBOURS' | 'DISTANT' | 'OUT OF TUNE';

/**
 * How two decks' keys sit together (both in the same mode in this lab's
 * music). Out of tune = tonics more than 0.15 semitone from a whole step
 * apart; then the relation by fifths.
 */
export function keyRelation(a: DeckState, b: DeckState): KeyRelation | null {
  const ta = soundingTonic(a);
  const tb = soundingTonic(b);
  if (ta == null || tb == null) return null;
  const d = tb - ta;
  const frac = d - Math.round(d);
  if (Math.abs(frac) > 0.15) return 'OUT OF TUNE';
  const f = fifthsApart(ta, tb);
  return f === 0 ? 'SAME' : f === 1 ? 'NEIGHBOURS' : 'DISTANT';
}

/**
 * The audio's processing, as two ratios: PITCH (the final resample — the
 * sounding pitch factor) and STRETCH (the time-stretch before it, input
 * samples per output sample at the original pitch; 1 = none). The tempo is
 * always STRETCH × PITCH = the rate.
 *   key lock OFF: pitch = rate × shift, stretch = 1 / shift
 *   key lock ON:  pitch = shift,        stretch = rate / shift
 */
export function speedPlan(d: Pick<DeckState, 'pitch' | 'keyLock' | 'keyShift'>): { rate: number; pitch: number; stretch: number } {
  const rate = 1 + d.pitch / 100;
  const p = Math.pow(2, (d.keyShift ?? 0) / 12);
  return d.keyLock ? { rate, pitch: p, stretch: rate / p } : { rate, pitch: rate * p, stretch: 1 / p };
}

/** How far a time-stretch is working (input per output at the original
 *  pitch; 1 = no stretch at all). */
export const stretchRatio = (d: Pick<DeckState, 'pitch' | 'keyLock' | 'keyShift'>): number => speedPlan(d).stretch;

/** Past about ±10 % a simple stretch is easy to hear (smeared hits, a
 *  phasey, doubled sound); the lab says so at that point. */
export const STRETCH_AUDIBLE = 0.1;
