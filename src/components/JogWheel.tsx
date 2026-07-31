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
        {/* Outer depth — a dark vignette hugging the rim so the knob reads as a
            raised object lifted off the background. */}
        <RadialGradient id="jogEdge" cx="50%" cy="50%" r="50%">
          <Stop offset="0.78" stopColor="#000000" stopOpacity="0" />
          <Stop offset="0.97" stopColor="#000000" stopOpacity="0.6" />
          <Stop offset="1" stopColor="#000000" stopOpacity="0.25" />
        </RadialGradient>
      </Defs>
      <Circle cx={c} cy={c} r={c - 1} fill="#08080a" />
      <Circle cx={c} cy={c} r={c - 3} fill="url(#jogBody)" />
      <Circle cx={c} cy={c} r={c - 1} fill="url(#jogEdge)" />
      <Circle cx={c} cy={c} r={c - 1} stroke="#34343a" strokeWidth={1} fill="none" opacity={0.6} />
    </Svg>
  );
}

/** Light features that rotate with the wheel: specular highlight (top), cast
 *  shadow (bottom), and the finger dimple. */
function JogFeatures({ size }: { size: number }) {
  const c = size / 2;
  const dR = size * 0.11;
  // Finger dimple at 2 o'clock at rest (owner 2026-08-01). Orbit radius ~0.24·s;
  // 60° clockwise from top → (c + r·sin60, c − r·cos60).
  const dCx = c + size * 0.24 * 0.866;
  const dCy = c - size * 0.24 * 0.5;
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
      {/* Rim glint + rim shadow near the edges — sharper than the broad
          shading; they ORBIT as the wheel turns, giving depth as it rotates. */}
      <Ellipse cx={c} cy={size * 0.11} rx={size * 0.17} ry={size * 0.045} fill="#ffffff" opacity={0.16} />
      <Ellipse cx={c} cy={size * 0.89} rx={size * 0.19} ry={size * 0.05} fill="#000000" opacity={0.34} />
      <Circle cx={dCx} cy={dCy} r={dR} fill="url(#jogDimple)" />
      <Circle cx={dCx} cy={dCy} r={dR} stroke="#5a5a64" strokeWidth={size * 0.008} fill="none" opacity={0.7} />
      <Circle cx={dCx - dR * 0.35} cy={dCy - dR * 0.4} r={dR * 0.3} fill="#ffffff" opacity={0.22} />
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
  // Angle is measured around the BIG wheel's centre (screen centre — the overlay
  // centres it) using PAGE coordinates, so the finger can trace the circle
  // anywhere, inside OR outside the wheel. That also means a straight up/down
  // drag on either side turns it (down-right = right, up-right = left, and the
  // mirror on the left) — no curved motion needed.
  const { width, height } = useWindowDimensions();
  const centerRef = useRef({ x: width / 2, y: height / 2 });
  centerRef.current = { x: width / 2, y: height / 2 };
  const DEAD_PX = 44; // ignore right at the centre (atan2 is unstable there)

  // The dimple is DRAWN at 2 o'clock (−30° in atan2 terms); rotating the wheel by
  // (fingerAngle + 30) puts the dimple exactly at the finger's angle. Tracking is
  // ABSOLUTE — the dimple always sits where the finger is pressing, so it never
  // drifts or flies off (no accumulation).
  const DIMPLE_OFFSET = 30;
  const lastAngle = useRef(0);
  const accum = useRef(0);
  const inDead = useRef(false);
  const lastStepAt = useRef(0);
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;
  const onGrantRef = useRef(onGrant);
  onGrantRef.current = onGrant;
  const onStepRef = useRef(onStep);
  onStepRef.current = onStep;
  const onReleaseRef = useRef(onRelease);
  onReleaseRef.current = onRelease;

  const angleAt = (px: number, py: number) => {
    const { x, y } = centerRef.current;
    return (Math.atan2(py - y, px - x) * 180) / Math.PI;
  };
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
        onPanResponderGrant: (_e, g) => {
          onGrantRef.current();
          const a0 = angleAt(g.x0, g.y0);
          lastAngle.current = a0;
          accum.current = 0;
          lastStepAt.current = 0; // first detent applies immediately
          inDead.current = false;
          spin.setValue(a0 + DIMPLE_OFFSET); // dimple appears exactly under the thumb
        },
        onPanResponderMove: (_e, g) => {
          if (disabledRef.current) return;
          const { x, y } = centerRef.current;
          // Right at the centre the angle is meaningless — hold steady and
          // re-anchor on the way out so it never snaps/flies.
          if (Math.hypot(g.moveX - x, g.moveY - y) < DEAD_PX) {
            inDead.current = true;
            return;
          }
          const a = angleAt(g.moveX, g.moveY);
          // ABSOLUTE: the dimple is placed exactly at the finger's angle.
          spin.setValue(a + DIMPLE_OFFSET);
          if (inDead.current) {
            inDead.current = false;
            lastAngle.current = a; // re-anchor detents without a jump
            return;
          }
          // Detents count the shortest angular movement (throttled in step()).
          let d = a - lastAngle.current;
          while (d > 180) d -= 360;
          while (d < -180) d += 360;
          lastAngle.current = a;
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
    [],
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
  // 23% larger than before (owner 2026-08-01), still capped to fit the screen.
  const size = Math.round(Math.min(width * 0.62, height * 0.4) * 1.23);
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
