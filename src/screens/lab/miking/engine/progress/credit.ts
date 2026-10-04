/**
 * The page credit rule (blueprint §7, pure; tested): a page banks THE MOMENT
 * its checks are answered (a retry is explained, never penalised) and its interactive is reached.
 * A page with neither (Sources) never banks on its own — the host banks it
 * on NEXT / FINISH (the PagedLab rule for a page with no requirement).
 */
import type { Lesson, PageId } from '../model/types.ts';

export function pageComplete(lesson: Lesson, page: PageId, answers: Readonly<Record<string, boolean>>, interactive: ReadonlySet<string>): boolean {
  const c = lesson.pages[page].credit;
  if (c.scenarios.length === 0 && !c.interactive) return false;
  return c.scenarios.every((id) => id in answers) && (!c.interactive || interactive.has(c.interactive));
}

/** True for a page that banks on NEXT / FINISH (no requirement). */
export function banksOnNext(lesson: Lesson, page: PageId): boolean {
  const c = lesson.pages[page].credit;
  return c.scenarios.length === 0 && !c.interactive;
}
