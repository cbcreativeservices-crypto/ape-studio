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
import { PanResponder, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Reanimated, { Easing as REasing, useAnimatedStyle, withTiming, type SharedValue } from 'react-native-reanimated';
import Svg, { Circle, Defs, Ellipse, Line, RadialGradient, Stop } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { hapticsEnabled } from '../features/settings/store';

// 8 clicks per full turn (owner 2026-08-06, was 7): one more detent + haptic
// per rotation, so a full turn scrolls one topic further.
const DETENT_DEG = 360 / 8; // 45° per click
/** The big overlay wheel sits BELOW screen centre by this much (owner
 *  2026-08-06) so the topic title + % in the Current Topic container stay in
 *  view. The dial's angle math shifts its centre by the same amount so the
 *  dimple still tracks exactly under the finger. */
const OVERLAY_Y_OFFSET = 46;
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

/** Machined tick ring (owner 2026-08-16) — fine radial ticks just inside the
 *  rim that ROTATE with the wheel, so even small rotations are visible (the
 *  dimple alone made fine motion invisible). 36 ticks at 10°, every third one
 *  slightly longer/brighter — subtle, machined-metal, not a ruler. */
function JogTicks({ size }: { size: number }) {
  const c = size / 2;
  const rOuter = c - size * 0.045;
  const ticks = Array.from({ length: 36 }, (_, i) => {
    const major = i % 3 === 0;
    const rad = (i * 10 * Math.PI) / 180;
    const rInner = rOuter - size * (major ? 0.034 : 0.02);
    return (
      <Line
        key={i}
        x1={c + rInner * Math.sin(rad)}
        y1={c - rInner * Math.cos(rad)}
        x2={c + rOuter * Math.sin(rad)}
        y2={c - rOuter * Math.cos(rad)}
        stroke="#c3c8d4"
        strokeWidth={Math.max(1, size * 0.004)}
        strokeLinecap="round"
        opacity={major ? 0.16 : 0.07}
      />
    );
  });
  return <Svg width={size} height={size}>{ticks}</Svg>;
}

/** The rotating dimple layer. When `spin` is provided (the overlay) the rotation
 *  runs on the UI thread via Reanimated — so the dimple tracks the thumb with no
 *  bridge lag (owner 2026-08-05). The small dial passes no spin and stays put. */
function JogDimpleLayer({ size, spin }: { size: number; spin?: SharedValue<number> }) {
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin ? spin.value : 0}deg` }] }));
  if (!spin) {
    return (
      <View style={StyleSheet.absoluteFill}>
        <JogTicks size={size} />
        <View style={StyleSheet.absoluteFill}>
          <JogDimple size={size} />
        </View>
      </View>
    );
  }
  return (
    <Reanimated.View style={[StyleSheet.absoluteFill, style]}>
      <JogTicks size={size} />
      <View style={StyleSheet.absoluteFill}>
        <JogDimple size={size} />
      </View>
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
 * The small dial — now purely an OPENER (owner 2026-08-06): a tap OR a press-hold
 * both open the big overlay wheel, which is the actual turn control. It does not
 * turn anything itself.
 */
export function JogDial({
  size = 74,
  disabled = false,
  onOpen,
}: {
  size?: number;
  disabled?: boolean;
  onOpen: () => void;
}) {
  return (
    <Pressable
      onPressIn={() => {
        if (!disabled) onOpen();
      }}
      disabled={disabled}
      style={[styles.wrap, { width: size, height: size }, disabled && styles.disabled]}
      accessibilityRole="button"
      accessibilityLabel="Open the topic wheel"
    >
      <JogStack size={size} />
    </Pressable>
  );
}

/**
 * The big centred wheel — the ACTUAL turn control (owner 2026-08-06). Opened by
 * the small dial; once open, DRAG ANYWHERE on the overlay to turn (angle is
 * measured around the wheel's centre, so a straight drag on any side works), it
 * steps topic detents with a haptic, and the ✕ commits + closes. NOT dimmed:
 * the current-topic container behind stays visible and updates as you turn.
 * Mount it at the screen root so it isn't clipped.
 */
export function JogOverlay({
  active,
  spin,
  onStep,
  onClose,
  disabled = false,
}: {
  active: boolean;
  spin: SharedValue<number>;
  onStep: (dir: -1 | 1) => void;
  onClose: () => void;
  disabled?: boolean;
}) {
  const { width, height } = useWindowDimensions();
  // 23% larger than before (owner 2026-08-01), still capped to fit the screen.
  const size = Math.round(Math.min(width * 0.62, height * 0.4) * 1.23);
  // Wheel centre in SCREEN coords — shifted down so the topic title + % stay
  // visible (owner 2026-08-06). Positioned by LAYOUT (absolute top/left), not a
  // transform (a transform offsets the visual but not the touch hit-area).
  const cx = width / 2;
  const cy = height / 2 + OVERLAY_Y_OFFSET;

  const DEAD_PX = 44; // ignore right at the centre (atan2 is unstable there)
  const DIMPLE_OFFSET = 30; // dimple drawn at 2 o'clock; +30 puts it under the finger
  const centerRef = useRef({ x: cx, y: cy });
  centerRef.current = { x: cx, y: cy };
  const lastAngle = useRef(0);
  const accum = useRef(0);
  // Continuous (unbounded) rotation target — finger deltas accumulate here so
  // the wheel never wraps/teleports; spin chases it (owner 2026-08-16 polish).
  const spinTarget = useRef(0);
  const inDead = useRef(false);
  const lastStepAt = useRef(0);
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;
  const onStepRef = useRef(onStep);
  onStepRef.current = onStep;
  // Tap-outside-to-close (owner 2026-08-13): a TAP (no rotation) that lands
  // OUTSIDE the wheel dismisses the overlay; drags still turn it, and a tap ON
  // the wheel is ignored. Refs so the memoised PanResponder reads live values.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const sizeRef = useRef(size);
  sizeRef.current = size;
  const grantRef = useRef({ x: 0, y: 0 });
  const movedRef = useRef(false);

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
        onStartShouldSetPanResponder: () => !disabledRef.current,
        onMoveShouldSetPanResponder: () => !disabledRef.current,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (_e, g) => {
          const a0 = angleAt(g.x0, g.y0);
          lastAngle.current = a0;
          accum.current = 0;
          lastStepAt.current = 0; // first detent applies immediately
          inDead.current = false;
          grantRef.current = { x: g.x0, y: g.y0 };
          movedRef.current = false;
          // Elegant grab (owner 2026-08-16): the dimple GLIDES under the finger
          // (short eased turn along the nearest path) instead of teleporting.
          // Unwrap the target to the closest equivalent of the current spin so
          // the glide never takes the long way round.
          const current = spin.value;
          let diff = (a0 + DIMPLE_OFFSET - current) % 360;
          if (diff > 180) diff -= 360;
          if (diff < -180) diff += 360;
          spinTarget.current = current + diff;
          spin.value = withTiming(spinTarget.current, { duration: 130, easing: REasing.out(REasing.quad) });
        },
        onPanResponderMove: (_e, g) => {
          if (disabledRef.current) return;
          if (!movedRef.current && Math.hypot(g.moveX - grantRef.current.x, g.moveY - grantRef.current.y) > 8) {
            movedRef.current = true; // it's a drag (rotation), not a tap
          }
          const { x, y } = centerRef.current;
          if (Math.hypot(g.moveX - x, g.moveY - y) < DEAD_PX) {
            inDead.current = true;
            return;
          }
          const a = angleAt(g.moveX, g.moveY);
          if (inDead.current) {
            inDead.current = false;
            lastAngle.current = a; // re-anchor detents without a jump
            return;
          }
          let d = a - lastAngle.current;
          while (d > 180) d -= 360;
          while (d < -180) d += 360;
          lastAngle.current = a;
          // Tight tracking with a whisper of smoothing (owner 2026-08-16):
          // finger deltas accumulate into the continuous target and the wheel
          // chases it over ~60ms — glued to the finger, but event jitter is
          // filtered out so the motion reads machined, not raw.
          spinTarget.current += d;
          spin.value = withTiming(spinTarget.current, { duration: 60, easing: REasing.linear });
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
        onPanResponderRelease: () => {
          // A tap (no drag) that landed beyond the wheel radius = dismiss.
          const { x, y } = centerRef.current;
          const outside = Math.hypot(grantRef.current.x - x, grantRef.current.y - y) > sizeRef.current / 2;
          if (!movedRef.current && outside) onCloseRef.current();
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  if (!active) return null;
  return (
    <View style={[StyleSheet.absoluteFill, styles.overlay]}>
      {/* Full-screen turn surface — drag anywhere to rotate the wheel. The ✕
          (a later sibling, so higher z) still wins taps on itself. */}
      <View {...pan.panHandlers} style={StyleSheet.absoluteFill} />
      {/* The wheel is purely visual — the surface above drives it. */}
      <View
        pointerEvents="none"
        style={{ position: 'absolute', left: cx - size / 2, top: cy - size / 2, width: size, height: size }}
      >
        <JogStack size={size} spin={spin} />
      </View>
      {/* ✕ commits the selection + closes; hit-area matches the visual. */}
      <Pressable
        onPress={onClose}
        hitSlop={18}
        style={[styles.closeKey, { left: cx + size / 2 - 22, top: cy - size / 2 - 8 }]}
        accessibilityRole="button"
        accessibilityLabel="Close the topic wheel"
      >
        <Text style={styles.closeX}>✕</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.45 },
  // No dim — the current-topic container behind stays visible and changes as you
  // turn (owner 2026-08-01).
  overlay: { alignItems: 'center', justifyContent: 'center', zIndex: 60 },
  // ✕ close key at the wheel's top-right corner (owner 2026-08-06) — a small
  // dark console key; the one control on the otherwise touch-transparent
  // overlay, so a stuck-open wheel can always be dismissed.
  closeKey: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111214',
    borderWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.32)',
    borderLeftColor: 'rgba(255,255,255,0.18)',
    borderBottomColor: '#000000',
    borderRightColor: 'rgba(0,0,0,0.7)',
  },
  closeX: { fontSize: 16, lineHeight: 19, color: '#e8ecf2', fontWeight: '600' },
});
