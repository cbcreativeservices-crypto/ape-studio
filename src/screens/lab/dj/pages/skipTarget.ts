/**
 * skipTarget — the pure half of the SKIP TO SCREEN 19 › action (tests reach
 * it; pages/skipOptional draws the button): the page index of an outline
 * screen, and the jump through the page shell's own navigation (`ctx.goTo`,
 * which clamps, scrolls to the top and persists).
 */
import type { PageCtx } from '../../kit/PagedLab';

/** The outline number the skip lands on: Screen 19, Microphones. */
export const SKIP_TO_NO = 19;
export const SKIP_LABEL = `SKIP TO SCREEN ${SKIP_TO_NO} ›`;

/** The page index of outline screen `to` (−1 when it is not registered). */
export function skipTargetIndex(numbers: readonly number[], to: number = SKIP_TO_NO): number {
  return numbers.indexOf(to);
}

/** Jump to screen 19 through the shell's navigation. Returns whether it went. */
export function skipToMic(ctx: Pick<PageCtx, 'goTo'>, numbers: readonly number[]): boolean {
  const i = skipTargetIndex(numbers);
  if (i < 0 || !ctx.goTo) return false;
  ctx.goTo(i);
  return true;
}
