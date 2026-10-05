/**
 * THE WOODWIND LESSONS — what they share as DATA (pure, no React Native):
 * the engine's Lesson plus the family's page words, riding on it as `wind`
 * (so the learner-text test walks them with the rest).
 *
 * The HOW IT SOUNDS page (WindSoundPage.tsx) reads `wind` for the words its
 * fourth step says about breath, keys and where the sound goes; the physics
 * it draws come from the lesson's own instrument (windSpec / windPhysics).
 */
import type { Lesson } from '../../../engine/model/types.ts';
import type { WindId, WindSpec } from './windSpec.ts';

export type WindExtra = {
  specId: WindId;
  /** The sound page's figure, for the screen reader. */
  soundSubject: string;
  /** Breath and air noise at a close mic, for this instrument. */
  breath: string;
  /** Key and pad noise. */
  keys: string;
  /** Where the sound goes round the player (measured trends, in words). */
  directivity: string;
  /** The NOTE control's starting note (semitones above the lowest). */
  noteDefault: number;
};

export type WindLesson = Lesson & { wind: WindExtra };

export function windExtra(spec: WindSpec, w: Omit<WindExtra, 'specId'>): WindExtra {
  return { specId: spec.id, ...w };
}

export function windOf(lesson: Lesson): WindExtra | null {
  return (lesson as Partial<WindLesson>).wind ?? null;
}
