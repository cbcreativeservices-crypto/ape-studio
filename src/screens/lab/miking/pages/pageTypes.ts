/**
 * What the lesson host hands every page (blueprint §7).
 */
import type { Lesson, VariantId } from '../engine/model/types.ts';
import type { LessonArt } from '../engine/scene/sceneTypes.ts';

export type PageProps = {
  lesson: Lesson;
  art: LessonArt;
  /** scenario / symptom id → first pick right (this practice run). */
  answers: Readonly<Record<string, boolean>>;
  onAnswered: (id: string, firstRight: boolean) => void;
  /** A page interactive reached its goal. */
  onInteractive: (id: string) => void;
  interactiveDone: ReadonlySet<string>;
  /** The drum's front head, shared by every page. */
  variant: VariantId;
  setVariant: (v: VariantId) => void;
  /** The what's-left screen covers the page (gestures off). */
  hidden: boolean;
  /** May this learner's observation sheets be written? */
  canSave: boolean;
  preview: boolean;
};
