/**
 * JogWheel — an SSL-style dished jog wheel (owner 2026-08-01).
 *
 * `JogDial` is the SMALL wheel on the Dashboard AND the live control: the moment
 * a finger touches it, `onGrant` opens `JogOverlay` (a big centred wheel) and the
 * SAME continuous gesture turns it — instantly, no tap-then-grab, no Modal (a
 * Modal cancels the in-flight touch). Turning it steps in click DETENTS with a
 * Rigid haptic (no sound). It spins ALL THE WAY AROUND — the topic index wraps,
 * so there are no end-stops. `onRelease` fires when the finger lifts.
 *
 * The overlay is a pointer-transparent, same-tree overlay (mounted at the
 * Dashboard root) that MIRRORS the dial's rotation via a shared Animated.Value.
 */
import { useMemo, useRef } from 'react';
import { Animated, PanResponder, StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { hapticsEnabled } from '../features/settings/store';

const DETENT_DEG = 360 / 7; // ~51.4° per click
const DIMPLE_CY = 0.26; // dimple centre as a fraction of size from the top
/** Min time between topic switches (owner 2026-08-01) — slow enough to WATCH the
 *  topic change behind the wheel, and no rapid-fire haptic "vibration". Faster
 *  spins just drop the excess steps; the wheel keeps turning smoothly. */
const MIN_STEP_MS = 300;

type Rotate = Animated.AnimatedInterpolation<string>;

/** FIXED base of the wheel — rim + matte-black concave disc. */
function JogBase({ size }: { size: number }) {
  const c = size / 2;
  return (
    <Svg width={size} height={size}>
      <Defs>
        <RadialGradient id="jogBody" cx="50%" cy="50%" r="62%">
          <Stop offset="0" stopColor="#26262b" />
          <Stop offset="0.6" stopColor="#141418" />
          <Stop offset="0.86" stopColor="#0b0b0e" />
          <Stop offset="1" stopColor="#050506" />
        </RadialGradient>
      </Defs>
      <Circle cx={c} cy={c} r={c - 1} fill="#08080a" />
      <Circle cx={c} cy={c} r={c - 1} stroke="#34343a" strokeWidth={1} fill="none" opacity={0.65} />
      <Circle cx={c} cy={c} r={c - 3} fill="url(#jogBody)" />
    </Svg>
  );
}

/** Light features that rotate with the wheel: specular highlight (top), cast
 *  shadow (bottom), and the finger dimple. */
function JogFeatures({ size }: { size: number }) {
  const c = size / 2;
  const dR = size * 0.11;
  const dCy = size * DIMPLE_CY;
  return (
    <Svg width={size} height={size}>
      <Defs>
        <RadialGradient id="jogHi" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#ffffff" stopOpacity="0.18" />
          <Stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="jogSh" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#000000" stopOpacity="0.5" />
          <Stop offset="1" stopColor="#000000" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="jogDimple" cx="40%" cy="32%" r="70%">
          <Stop offset="0" stopColor="#4c4c56" />
          <Stop offset="0.5" stopColor="#141418" />
          <Stop offset="1" stopColor="#000000" />
        </RadialGradient>
      </Defs>
      <Ellipse cx={c} cy={size * 0.72} rx={size * 0.4} ry={size * 0.28} fill="url(#jogSh)" />
      <Ellipse cx={c} cy={size * 0.3} rx={size * 0.36} ry={size * 0.24} fill="url(#jogHi)" />
      <Circle cx={c} cy={dCy} r={dR} fill="url(#jogDimple)" />
      <Circle cx={c} cy={dCy} r={dR} stroke="#5a5a64" strokeWidth={size * 0.008} fill="none" opacity={0.7} />
      <Circle cx={c - dR * 0.35} cy={dCy - dR * 0.4} r={dR * 0.3} fill="#ffffff" opacity={0.22} />
    </Svg>
  );
}

function JogStack({ size, rotate }: { size: number; rotate?: Rotate }) {
  return (
    <View style={{ width: size, height: size }}>
      <View style={StyleSheet.absoluteFill}>
        <JogBase size={size} />
      </View>
      {rotate ? (
        <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate }] }]}>
          <JogFeatures size={size} />
        </Animated.View>
      ) : (
        <View style={StyleSheet.absoluteFill}>
          <JogFeatures size={size} />
        </View>
      )}
    </View>
  );
}

/**
 * The small dial — the live jog control. Grabs the gesture on touch-DOWN (so the
 * card's swipe never steals it — see `disabled`/grant coordination in the host),
 * writes rotation into the shared `spin`, and steps detents.
 */
export function JogDial({
  size = 74,
  disabled = false,
  spin,
  onGrant,
  onStep,
  onRelease,
}: {
  size?: number;
  disabled?: boolean;
  spin: Animated.Value;
  onGrant: () => void;
  onStep: (dir: -1 | 1) => void;
  onRelease: () => void;
}) {
  const c = size / 2;
  const dead = size * 0.16; // ignore touches near the centre (atan2 is unstable there)
  const lastAngle = useRef(0);
  const accum = useRef(0);
  const spinDeg = useRef(0);
  const lastStepAt = useRef(0);
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;
  const onGrantRef = useRef(onGrant);
  onGrantRef.current = onGrant;
  const onStepRef = useRef(onStep);
  onStepRef.current = onStep;
  const onReleaseRef = useRef(onRelease);
  onReleaseRef.current = onRelease;

  const angleAt = (lx: number, ly: number) => (Math.atan2(ly - c, lx - c) * 180) / Math.PI;
  const step = (dir: -1 | 1) => {
    const now = Date.now();
    if (now - lastStepAt.current < MIN_STEP_MS) return; // throttle — slow enough to watch
    lastStepAt.current = now;
    onStepRef.current(dir);
    if (hapticsEnabled()) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid).catch(() => {});
  };

  const pan = useMemo(
    () =>
      PanResponder.create({
        // Claim on touch-DOWN so the gesture is ours instantly (before the card's
        // move-capture can look at it — the host also gates the card on grant).
        onStartShouldSetPanResponder: () => !disabledRef.current,
        onStartShouldSetPanResponderCapture: () => !disabledRef.current,
        onMoveShouldSetPanResponder: () => !disabledRef.current,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (e) => {
          onGrantRef.current();
          lastAngle.current = angleAt(e.nativeEvent.locationX, e.nativeEvent.locationY);
          accum.current = 0;
          lastStepAt.current = 0; // first detent applies immediately
        },
        onPanResponderMove: (e) => {
          if (disabledRef.current) return;
          const lx = e.nativeEvent.locationX;
          const ly = e.nativeEvent.locationY;
          if (Math.hypot(lx - c, ly - c) < dead) return; // centre dead-zone → no freak-out
          const a = angleAt(lx, ly);
          let d = a - lastAngle.current;
          while (d > 180) d -= 360;
          while (d < -180) d += 360;
          lastAngle.current = a;
          spinDeg.current += d;
          spin.setValue(spinDeg.current);
          accum.current += d;
          while (accum.current >= DETENT_DEG) {
            accum.current -= DETENT_DEG;
            step(1);
          }
          while (accum.current <= -DETENT_DEG) {
            accum.current += DETENT_DEG;
            step(-1);
          }
        },
        onPanResponderRelease: () => onReleaseRef.current(),
        onPanResponderTerminate: () => onReleaseRef.current(),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [c],
  );

  return (
    <View
      {...pan.panHandlers}
      style={[styles.wrap, { width: size, height: size }, disabled && styles.disabled]}
      accessibilityRole="adjustable"
      accessibilityLabel="Jog dial — hold and turn to change the topic"
    >
      <JogStack size={size} />
    </View>
  );
}

/** The big centred wheel shown while the dial is held — mirrors the dial's
 *  rotation. NOT dimmed (owner 2026-08-01): the current-topic container behind
 *  it stays fully visible and changes as you turn. Pointer-transparent (the
 *  finger stays on the small dial). Mount it at the screen root so it isn't
 *  clipped. */
export function JogOverlay({ active, spin }: { active: boolean; spin: Animated.Value }) {
  const { width, height } = useWindowDimensions();
  const size = Math.round(Math.min(width * 0.62, height * 0.4));
  const rotate = spin.interpolate({
    inputRange: [-360, 360],
    outputRange: ['-360deg', '360deg'],
    extrapolate: 'extend',
  });
  if (!active) return null;
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.overlay]}>
      <JogStack size={size} rotate={rotate} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.45 },
  // No dim — the current-topic container behind stays visible and changes as you
  // turn (owner 2026-08-01).
  overlay: { alignItems: 'center', justifyContent: 'center', zIndex: 60 },
});
