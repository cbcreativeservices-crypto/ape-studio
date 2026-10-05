/**
 * SMALL-PERCUSSION FAMILY — what a Lab 2 hand-percussion lesson supplies ON
 * TOP of the engine's Lesson (engine/model/types.ts), for the family's own
 * pieces (the HOW IT SOUNDS page, THE SETTING's station plan). It rides on the
 * lesson object as `sp`, so the learner-text test walks it with the rest of
 * the lesson data. Pure data.
 */
import type { Lesson, ViewBox } from '../../../engine/model/types.ts';
import type { PlanThing } from '../handdrums/family.ts';

export type { PlanThing };

export type SpExtra = {
  /** HOW IT SOUNDS step 1's title ("Strike to sound", "Shake to sound"). */
  strikeTitle: string;
  /** THE SETTING: the station plan (from above), mm; things at ILLUSTRATIVE
   *  positions (`prov` is on the matching SettingItem). The lesson's own art
   *  (player and instrument, top view) is drawn at the 'drums' thing. */
  plan: { box: ViewBox; things: readonly PlanThing[] };
  /** ORIENT's close-up framing (the figure and THE PARTS): the scene views
   *  are framed for the mics, too wide to read a small instrument. */
  close: { side: ViewBox; top: ViewBox };
};

export type SpLesson = Lesson & { sp: SpExtra };

export function spOf(lesson: Lesson): SpExtra {
  const s = (lesson as Partial<SpLesson>).sp;
  if (!s) throw new Error(`lesson ${lesson.id} is not a small-percussion lesson`);
  return s;
}
