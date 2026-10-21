/**
 * eventMotion — what the event screens' drawings read every frame from the
 * ONE clock: the event layer's meter taps (mic, recorder, sub), the
 * talkover dip and the "speaking" flag, all from the render that is
 * sounding (useBoothAudio → MeterFrame.ext). UI-thread derived values only.
 */
import { useDerivedValue } from 'react-native-reanimated';
import type { EvTap } from '../engine/djEventRender';
import { useMotion } from './motion';

/** An event tap's displayed level (dBFS) under the clock; the floor when off. */
export function useExtTapDb(tap: EvTap, which: 'meter' | 'hold' = 'meter') {
  const { clock, meters } = useMotion();
  return useDerivedValue(() => {
    const m = meters.value;
    const e = m?.ext;
    if (!m || !e) return -60;
    let k = Math.floor((clock.value - m.t0) / 0.01);
    if (k < 0) k = 0;
    if (k >= m.blocks) k = m.blocks - 1;
    const arr = which === 'meter' ? e.meter[tap] : e.hold[tap];
    return arr ? arr[k] : -60;
  });
}

/** The talkover dip now (dB, ≤ 0). */
export function useDuckDb() {
  const { clock, meters } = useMotion();
  return useDerivedValue(() => {
    const m = meters.value;
    const e = m?.ext;
    if (!m || !e) return 0;
    let k = Math.floor((clock.value - m.t0) / 0.01);
    if (k < 0) k = 0;
    if (k >= m.blocks) k = m.blocks - 1;
    return e.duck[k] ?? 0;
  });
}

/** 1 while the mic carries speech now, else 0. */
export function useSpeaking() {
  const { clock, meters } = useMotion();
  return useDerivedValue(() => {
    const m = meters.value;
    const e = m?.ext;
    if (!m || !e) return 0;
    let k = Math.floor((clock.value - m.t0) / 0.01);
    if (k < 0) k = 0;
    if (k >= m.blocks) k = m.blocks - 1;
    return e.speech[k] ? 1 : 0;
  });
}
