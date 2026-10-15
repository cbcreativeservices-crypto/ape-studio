/**
 * Speech & Voice Lab — the looping clocks for the illustrative animations on
 * pages 6 and 8 (2026-10-14 redraw). They are DECORATIVE in the house sense:
 * the page reads fully without them (the still drawing and the text carry the
 * lesson), so they stop under reduced motion and in Low-Light mode
 * (useDecorativeMotion) and when the caller says `running = false`.
 *
 * One UI-thread clock per drawing (seconds, wrapped), no per-frame React state.
 */
import { useEffect } from 'react';
import { useFrameCallback, useSharedValue, type SharedValue } from 'react-native-reanimated';
import { useDecorativeMotion } from '../../../features/settings/decorativeMotion';

/** Seconds since start, wrapped at `period`; frozen at `still` when motion is off. */
export function useLoopClock(period: number, still: number, running = true): { t: SharedValue<number>; moving: boolean } {
  const motion = useDecorativeMotion();
  const moving = motion && running;
  const t = useSharedValue(moving ? 0 : still);
  const cb = useFrameCallback((info) => {
    const dt = info.timeSincePreviousFrame;
    if (dt == null) return;
    const v = t.value + Math.min(dt, 64) / 1000;
    t.value = v >= period ? v - period : v;
  }, false);
  useEffect(() => {
    cb.setActive(moving);
    if (!moving) t.value = still;
  }, [moving, still, cb, t]);
  return { t, moving };
}
