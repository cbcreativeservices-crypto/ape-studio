/**
 * JogWheel — a black dished rotary jog wheel (owner 2026-08-01), styled after a
 * hardware controller jog (SSL UF8 / RME ARC). Drag AROUND it to spin; it moves
 * in CLICK DETENTS, not linearly — every ~1/7 of a turn advances one step and
 * fires a Rigid haptic (the same click the study action buttons use). So a hard
 * full spin steps ~7 items; a slow turn clicks one at a time. Never makes a sound.
 *
 * `onStep(dir)` is called once per detent crossed (dir = +1 clockwise / −1 CCW).
 * Angle is computed from the touch's position RELATIVE to this view (locationX/Y),
 * so no window measuring is needed even inside a scroll view.
 */
import { useMemo, useRef } from 'react';
import { Animated, PanResponder, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { hapticsEnabled } from '../features/settings/store';

const DETENT_DEG = 360 / 7; // ~51.4° per click → one hard full spin ≈ 7 steps

export function JogWheel({
  size = 74,
  onStep,
  disabled = false,
}: {
  size?: number;
  onStep: (dir: -1 | 1) => void;
  disabled?: boolean;
}) {
  const c = size / 2;
  const lastAngle = useRef(0);
  const accum = useRef(0);
  const onStepRef = useRef(onStep);
  onStepRef.current = onStep;
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;

  // The wheel visibly SPINS as you drag (owner 2026-08-01): a running rotation
  // that follows the finger 1:1, so the click detents look like the wheel is
  // turning. It's an endless encoder — the rotation persists where it lands.
  const spin = useRef(new Animated.Value(0)).current;
  const spinDeg = useRef(0);

  const angleAt = (lx: number, ly: number) => (Math.atan2(ly - c, lx - c) * 180) / Math.PI;

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabledRef.current,
        onMoveShouldSetPanResponder: () => !disabledRef.current,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (e) => {
          lastAngle.current = angleAt(e.nativeEvent.locationX, e.nativeEvent.locationY);
          accum.current = 0;
        },
        onPanResponderMove: (e) => {
          if (disabledRef.current) return;
          const a = angleAt(e.nativeEvent.locationX, e.nativeEvent.locationY);
          let d = a - lastAngle.current;
          // Shortest signed delta across the ±180° seam.
          while (d > 180) d -= 360;
          while (d < -180) d += 360;
          lastAngle.current = a;
          // Spin the wheel graphic by the same delta so it turns under the finger.
          spinDeg.current += d;
          spin.setValue(spinDeg.current);
          accum.current += d;
          while (accum.current >= DETENT_DEG) {
            accum.current -= DETENT_DEG;
            click(1);
          }
          while (accum.current <= -DETENT_DEG) {
            accum.current += DETENT_DEG;
            click(-1);
          }
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [c],
  );

  const click = (dir: -1 | 1) => {
    onStepRef.current(dir);
    // Same "click" the study action buttons use — haptic only, never a sound.
    if (hapticsEnabled()) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid).catch(() => {});
  };

  return (
    <View
      {...pan.panHandlers}
      style={[styles.wrap, { width: size, height: size }, disabled && styles.disabled]}
      accessibilityRole="adjustable"
      accessibilityLabel="Jog wheel — spin to change the current topic"
    >
      <Animated.View
        style={{
          width: size,
          height: size,
          transform: [
            {
              rotate: spin.interpolate({
                inputRange: [-360, 360],
                outputRange: ['-360deg', '360deg'],
                extrapolate: 'extend',
              }),
            },
          ],
        }}
      >
      <Svg width={size} height={size}>
        <Defs>
          {/* Dished black face: a soft edge sheen (lighter ring) fading to a dark
              concave centre. */}
          <RadialGradient id="jogFace" cx="50%" cy="42%" r="62%">
            <Stop offset="0" stopColor="#242428" />
            <Stop offset="0.55" stopColor="#161619" />
            <Stop offset="0.86" stopColor="#37373d" />
            <Stop offset="1" stopColor="#0c0c0e" />
          </RadialGradient>
          {/* Finger dimple near the top — a small darker divot with a light lip. */}
          <RadialGradient id="jogDimple" cx="50%" cy="38%" r="60%">
            <Stop offset="0" stopColor="#3a3a40" />
            <Stop offset="0.7" stopColor="#0e0e10" />
            <Stop offset="1" stopColor="#050506" />
          </RadialGradient>
        </Defs>
        {/* Rim */}
        <Circle cx={c} cy={c} r={c - 1} fill="#050506" />
        <Circle cx={c} cy={c} r={c - 1} stroke="#3c3c42" strokeWidth={1} fill="none" opacity={0.7} />
        {/* Dished face */}
        <Circle cx={c} cy={c} r={c - 4} fill="url(#jogFace)" />
        {/* Subtle top highlight arc */}
        <Circle cx={c} cy={c - size * 0.12} r={c * 0.62} fill="#ffffff" opacity={0.04} />
        {/* Finger dimple */}
        <Circle cx={c} cy={c - size * 0.18} r={size * 0.11} fill="url(#jogDimple)" />
        <Circle cx={c} cy={c - size * 0.18} r={size * 0.11} stroke="#4a4a50" strokeWidth={0.8} fill="none" opacity={0.6} />
      </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.45 },
});
