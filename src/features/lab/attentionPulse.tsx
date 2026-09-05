/**
 * Attention pulse for INTERACTIVE lab controls (owner 2026-09-05).
 *
 * A slider thumb that just sits there does not read as something to touch —
 * the owner circled one on the Amplifier lab and asked for it to "animate
 * brighter and darker in a loop: 5 s, 2.5 s getting brighter, 2.5 s getting
 * dimmer" so EVERY user slider announces that it is interactable.
 *
 * Reanimated, not RN Animated: the RN native-driver path is a no-op on the
 * web preview (the Amp rig's playhead sits frozen there too), while
 * Reanimated runs on the UI thread on device AND on web. Reduced motion (app
 * toggle or OS) holds the thumb bright and still.
 */
import { useEffect } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { animationsAllowed } from '../settings/a11y';

export const ATTENTION_PULSE_MS = 5000;

/** Opacity range for a pulsing thumb: never fully gone, clearly brighter at the peak. */
export const PULSE_OPACITY: [number, number] = [0.42, 1];

/** 0 (dim) → 1 (bright) → 0, forever. */
export function useAttentionPulse(run: boolean = true, period: number = ATTENTION_PULSE_MS) {
  const t = useSharedValue(1);
  // Read on every render (not once at mount): the reduce-motion setting and
  // the OS flag hydrate after first paint, and a stale read froze the pulse.
  const allowed = animationsAllowed();
  useEffect(() => {
    cancelAnimation(t);
    if (!run || !allowed) {
      t.value = 1;
      return;
    }
    t.value = 0;
    t.value = withRepeat(
      withSequence(
        withTiming(1, { duration: period / 2, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: period / 2, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    return () => cancelAnimation(t);
  }, [run, period, allowed, t]);
  return t;
}

/** Ready-made animated style for a slider thumb: `opacity` breathing between
 *  PULSE_OPACITY. Use on a reanimated `Animated.View`. */
export function usePulseStyle(run: boolean = true, period: number = ATTENTION_PULSE_MS) {
  const t = useAttentionPulse(run, period);
  return useAnimatedStyle(() => ({
    opacity: PULSE_OPACITY[0] + (PULSE_OPACITY[1] - PULSE_OPACITY[0]) * t.value,
  }));
}

/** A breathing slider thumb: drop-in for a plain `<View style={thumb} />`. */
export function PulseThumb({ style, run = true }: { style?: StyleProp<ViewStyle>; run?: boolean }) {
  const pulseStyle = usePulseStyle(run);
  return <Animated.View pointerEvents="none" style={[style, pulseStyle]} />;
}
