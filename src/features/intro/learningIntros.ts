/**
 * Learning intros (user request 2026-07-18): every TOPIC and every COURSE gets
 * a short intro shown BEFORE the student begins — the what / why / where / who /
 * importance of it, plus what they will learn.
 *
 * SCAFFOLD: content is authored per topic/course as it's developed. Until an
 * entry exists, the intro sheet still renders the labeled structure with
 * "coming soon" placeholders, so the shape is in place now. Keys are the
 * topic/course DISPLAY NAME for now (stable, human-readable); when the
 * COURSE / TOPIC MATRIX SSoT lands, re-key these to its ids.
 */
export type LearningIntro = {
  /** What it is — a one/two-sentence definition. */
  what?: string;
  /** Why it matters. */
  why?: string;
  /** Where it shows up in the real world. */
  where?: string;
  /** Who works with it / who it's for. */
  who?: string;
  /** Why it's important to master. */
  importance?: string;
  /** What the student will be able to do after it. */
  willLearn?: string[];
};

/**
 * Per-topic intros, keyed by topic display name.
 * Add entries as topics are developed, e.g.:
 *   'Microphones': { what: '…', why: '…', where: '…', who: '…',
 *                    importance: '…', willLearn: ['…', '…'] },
 */
export const TOPIC_INTROS: Record<string, LearningIntro> = {};

/** Per-course intros, keyed by course display name (same shape as topics). */
export const COURSE_INTROS: Record<string, LearningIntro> = {};

export function getTopicIntro(name: string): LearningIntro {
  return TOPIC_INTROS[name] ?? {};
}

export function getCourseIntro(name: string): LearningIntro {
  return COURSE_INTROS[name] ?? {};
}

/** True when an intro still has no authored content (all fields empty). */
export function isIntroEmpty(intro: LearningIntro): boolean {
  return (
    !intro.what &&
    !intro.why &&
    !intro.where &&
    !intro.who &&
    !intro.importance &&
    !(intro.willLearn && intro.willLearn.length)
  );
}
