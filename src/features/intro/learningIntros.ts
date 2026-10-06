/**
 * Learning intros (user request 2026-07-18): every TOPIC gets a short intro
 * shown BEFORE the student begins — the what / why / where / who / importance
 * of it, plus what they will learn.
 *
 * SCAFFOLD: content is authored per topic as it's developed. An intro with no
 * authored content is never auto-shown (see isIntroEmpty). Keys are the topic
 * DISPLAY NAME (stable, human-readable).
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

export function getTopicIntro(name: string): LearningIntro {
  return TOPIC_INTROS[name] ?? {};
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
