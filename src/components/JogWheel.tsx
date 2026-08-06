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
import { PanResponder, StyleSheet, useWindowDimensions, View } from 'react-native';
import Reanimated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import Svg, { Circle, Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { hapticsEnabled } from '../features/settings/store';

const DETENT_DEG = 360 / 7; // ~51.4° per click
/** Min time between topic switches (owner 2026-08-01) — slow enough to WATCH the
 *  topic change behind the wheel, and no rapid-fire haptic "vibration". Faster
 *  spins just drop the excess steps; the wheel keeps turning smoothly. */
const MIN_STEP_MS = 300;

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

/** FIXED depth shading — just soft cast shadows (owner 2026-08-05: the light
 *  gray specular highlight was removed; it read wrong). These do not orbit; only
 *  the physical dimple below rotates. */
function JogLighting({ size }: { size: number }) {
  const c = size / 2;
  return (
    <Svg width={size} height={size}>
      <Defs>
        <RadialGradient id="jogSh" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#000000" stopOpacity="0.5" />
          <Stop offset="1" stopColor="#000000" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Ellipse cx={c} cy={size * 0.72} rx={size * 0.4} ry={size * 0.28} fill="url(#jogSh)" />
      <Ellipse cx={c} cy={size * 0.89} rx={size * 0.19} ry={size * 0.05} fill="#000000" opacity={0.34} />
    </Svg>
  );
}

/** The finger dimple — a CONCAVE dish the finger sits DOWN into (owner
 *  2026-08-05). Lit from the top: the near (top) inner wall is in shadow, light
 *  pools on the far (lower) wall, and a thin lip catches light at the top edge —
 *  the inverse of a raised bump. Rotates with the wheel. */
function JogDimple({ size }: { size: number }) {
  const c = size / 2;
  const dR = size * 0.12;
  // Finger dimple at 2 o'clock at rest (owner 2026-08-01). Orbit radius ~0.24·s;
  // 60° clockwise from top → (c + r·sin60, c − r·cos60).
  const dCx = c + size * 0.24 * 0.866;
  const dCy = c - size * 0.24 * 0.5;
  return (
    <Svg width={size} height={size}>
      <Defs>
        {/* Concave bowl: light pooled toward the far/lower wall, deep at the rim. */}
        <RadialGradient id="jogDish" cx="50%" cy="66%" r="72%">
          <Stop offset="0" stopColor="#3c3c45" />
          <Stop offset="0.5" stopColor="#171719" />
          <Stop offset="1" stopColor="#040405" />
        </RadialGradient>
      </Defs>
      {/* Recessed outer ring — a hair of raised lip framing the dish. */}
      <Circle cx={dCx} cy={dCy} r={dR + size * 0.007} fill="#0a0a0d" />
      <Circle cx={dCx} cy={dCy} r={dR} fill="url(#jogDish)" />
      {/* Near-rim occlusion — the top inner wall shades the bowl (depth). */}
      <Ellipse cx={dCx} cy={dCy - dR * 0.52} rx={dR * 0.9} ry={dR * 0.44} fill="#000000" opacity={0.5} />
      {/* Faint light pooling on the far inner wall. */}
      <Ellipse cx={dCx} cy={dCy + dR * 0.48} rx={dR * 0.55} ry={dR * 0.24} fill="#ffffff" opacity={0.05} />
      {/* Thin lip glint on the top outer edge (rim catching the light). */}
      <Ellipse cx={dCx} cy={dCy - dR * 0.98} rx={dR * 0.5} ry={dR * 0.11} fill="#6a6a76" opacity={0.5} />
    </Svg>
  );
}

/** The rotating dimple layer. When `spin` is provided (the overlay) the rotation
 *  runs on the UI thread via Reanimated — so the dimple tracks the thumb with no
 *  bridge lag (owner 2026-08-05). The small dial passes no spin and stays put. */
function JogDimpleLayer({ size, spin }: { size: number; spin?: SharedValue<number> }) {
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin ? spin.value : 0}deg` }] }));
  if (!spin) {
    return (
      <View style={StyleSheet.absoluteFill}>
        <JogDimple size={size} />
      </View>
    );
  }
  return (
    <Reanimated.View style={[StyleSheet.absoluteFill, style]}>
      <JogDimple size={size} />
    </Reanimated.View>
  );
}

function JogStack({ size, spin }: { size: number; spin?: SharedValue<number> }) {
  return (
    <View style={{ width: size, height: size }}>
      <View style={StyleSheet.absoluteFill}>
        <JogBase size={size} />
      </View>
      {/* Fixed lighting sits above the disc but does NOT rotate. */}
      <View style={StyleSheet.absoluteFill}>
        <JogLighting size={size} />
      </View>
      {/* Only the dimple rotates (UI-thread when driven by the overlay). */}
      <JogDimpleLayer size={size} spin={spin} />
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
  spin: SharedValue<number>;
  onGrant: () => void;
  onStep: (dir: -1 | 1) => void;
  /** wasTap = a quick press with no turn (owner 2026-08-05): the host uses it to
   *  PARK the overlay open on a tap instead of closing on release. */
  onRelease: (wasTap: boolean) => void;
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
  // Tap detection (owner 2026-08-05): a quick, STILL press that never stepped the
  // wheel. The movement guard stops brief turn-attempts / accidental brushes from
  // being read as taps (which made the overlay open/close sporadically).
  const grantAt = useRef(0);
  const stepped = useRef(false);
  const moved = useRef(false);
  const TAP_SLOP = 10; // px of finger travel still counts as a tap
  const TAP_MS = 240; // max press duration for a tap
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
    stepped.current = true; // any detent means this was a TURN, not a tap
    onStepRef.current(dir);
    if (hapticsEnabled()) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid).catch(() => {});
  };
  /** A tap = released quickly, with no detent stepped AND the finger barely moved. */
  const releaseKind = () => !stepped.current && !moved.current && Date.now() - grantAt.current < TAP_MS;

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
          grantAt.current = Date.now();
          stepped.current = false;
          moved.current = false;
          onGrantRef.current();
          const a0 = angleAt(g.x0, g.y0);
          lastAngle.current = a0;
          accum.current = 0;
          lastStepAt.current = 0; // first detent applies immediately
          inDead.current = false;
          spin.value = a0 + DIMPLE_OFFSET; // dimple appears exactly under the thumb
        },
        onPanResponderMove: (_e, g) => {
          if (disabledRef.current) return;
          if (Math.hypot(g.dx, g.dy) > TAP_SLOP) moved.current = true; // any real travel → not a tap
          const { x, y } = centerRef.current;
          // Right at the centre the angle is meaningless — hold steady and
          // re-anchor on the way out so it never snaps/flies.
          if (Math.hypot(g.moveX - x, g.moveY - y) < DEAD_PX) {
            inDead.current = true;
            return;
          }
          const a = angleAt(g.moveX, g.moveY);
          // ABSOLUTE: the dimple is placed exactly at the finger's angle.
          spin.value = a + DIMPLE_OFFSET;
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
        onPanResponderRelease: () => onReleaseRef.current(releaseKind()),
        onPanResponderTerminate: () => onReleaseRef.current(false),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <View
      {...pan.panHandlers}
      style={[styles.wrap, { width: size, height: size }, disabled && styles.disabled]}
      accessibilityRole="adjustable"
      accessibilityLabel="Jog dial — tap to open, then turn to change the topic"
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
export function JogOverlay({ active, spin }: { active: boolean; spin: SharedValue<number> }) {
  const { width, height } = useWindowDimensions();
  // 23% larger than before (owner 2026-08-01), still capped to fit the screen.
  const size = Math.round(Math.min(width * 0.62, height * 0.4) * 1.23);
  if (!active) return null;
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.overlay]}>
      <JogStack size={size} spin={spin} />
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
