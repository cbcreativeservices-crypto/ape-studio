/**
 * MALLET-BAR FAMILY — what a mallet lesson supplies ON TOP of the engine's
 * Lesson, for the family's own pages (HOW IT SOUNDS: bars, tubes and fans;
 * TWO MICROPHONES: spaced and coincident pairs). The WORDS ride on the
 * lesson as `mallet` (so the learner-text test walks them); the family's
 * geometry rides on the ART (LessonArt + `malletFam`), never on the lesson
 * data — the rows carry the makers' model names for the internal record.
 */
import type { Lesson, MicPattern, MicPose, VariantId } from '../../../engine/model/types.ts';
import type { CopyCell } from '../../../engine/model/copy.ts';
import type { LessonArt } from '../../../engine/scene/sceneTypes.ts';
import type { MalletFamily } from './malletModel.ts';

export type MalletStage = { title: string; text: string; byVariant?: Partial<Record<VariantId, string>> };

/** A two-mic setup on TWO MICROPHONES (poses from the family geometry). */
export type PairPreset = {
  id: string;
  label: string;
  short: string;
  blurb: string;
  /** A coincident pair: the grilles together (Δd = 0 for every source). */
  coincident: boolean;
  typeId: string;
  pattern: MicPattern;
  A: MicPose;
  B: MicPose;
};

export type MalletWords = {
  sound: {
    stages: readonly MalletStage[];
    cells: readonly CopyCell[];
    looking: string;
    /** After the strike sequence reached its end, with a prediction made. */
    reveal: string;
    after: string;
    /** The damper (vibraphone, pedal glockenspiel): the PEDAL option's words. */
    pedal?: { down: string; up: string; note: string };
    shapes: { intro: string; tuned: string; notes: readonly string[] };
    tube: { intro: string; visible: string; noTube: string; helmholtz?: string };
    /** The vibraphone's fans (step 4 of its HOW IT SOUNDS). */
    fan?: { intro: string; card: string; note: string; looking: string };
  };
  two: {
    presets: readonly PairPreset[];
    looking: string;
    prompt: string;
    learn: readonly string[];
    warn: string;
  };
};

export type MalletLesson = Lesson & { mallet: MalletWords };
export type MalletArt = LessonArt & { malletFam: MalletFamily };

export function malletWordsOf(lesson: Lesson): MalletWords {
  const m = (lesson as Partial<MalletLesson>).mallet;
  if (!m) throw new Error(`lesson ${lesson.id} is not a mallet lesson`);
  return m;
}
export function malletFamOf(art: LessonArt): MalletFamily {
  const f = (art as Partial<MalletArt>).malletFam;
  if (!f) throw new Error('not a mallet lesson’s art');
  return f;
}
