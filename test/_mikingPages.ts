/**
 * The lesson pages, after the 2026-10-06 restructure (LESSON_JOURNEY.md):
 * the 79 lessons are WRITTEN in nine source pages (instrument, sound,
 * setting + the six core pages) and SERVED as the eight-page journey (MEET
 * IT and STARTING SETUPS built from the first three: engine/restructure.ts).
 * Shared by the family tests that used to pin "the 9 pages are present".
 */
import assert from 'node:assert/strict';
import type { Lesson } from '../src/screens/lab/miking/engine/model/types.ts';
import { PAGE_IDS } from '../src/screens/lab/miking/engine/model/types.ts';
import { pageOf } from '../src/screens/lab/miking/engine/restructure.ts';

/** The pages a lesson of 2026-10-04/05 is written in. */
export const WRITTEN_PAGE_IDS = ['instrument', 'sound', 'setting', 'microphone', 'placement', 'context', 'twoMic', 'troubleshoot', 'practice'] as const;

/** The lesson's written pages are the nine source pages, and every one of
 *  the eight journey pages is served with a title, a goal and a credit rule. */
export function assertJourneyPages(lesson: Lesson): void {
  assert.deepEqual(Object.keys(lesson.pages).sort(), [...WRITTEN_PAGE_IDS].sort(), `${lesson.id}: written pages`);
  assert.equal(PAGE_IDS.length, 8);
  for (const p of PAGE_IDS) {
    const c = pageOf(lesson, p);
    assert.ok(c?.title && c.goal && c.credit, `${lesson.id}: journey page ${p}`);
  }
}
