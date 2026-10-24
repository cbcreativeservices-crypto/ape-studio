/**
 * Pre-warm the Miking lesson screen while the learner reads a lesson list
 * (2026-10-23, measured on a Pixel 7 Pro: the first lesson open evaluated the
 * screen and every lesson's ART — 2.75 s — after the tap). Idle-time through
 * the house helper; Metro evaluates a module once, so later calls cost
 * nothing. Returns the cancel for an effect cleanup.
 */
import { runSoon } from '../../../../lib/afterInteractions';

export function prewarmLessonScreen(): () => void {
  const task = runSoon(() => {
    require('../MikingLessonScreen');
  }, { idleTimeoutMs: 1500 });
  return () => task.cancel();
}
