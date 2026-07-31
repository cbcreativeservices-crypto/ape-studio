/**
 * JogWheel — an SSL-style dished jog wheel (owner 2026-08-01).
 *
 * On the Dashboard the small wheel is a TRIGGER (`JogWheelTrigger`) — the SAME
 * graphic, just shrunk. Touching it opens `JogPopup`: a LARGE copy of the wheel
 * placed so its finger DIMPLE lands exactly where the small icon was, i.e. right
 * under the thumb that pressed it. The user then turns the wheel and it SPINS in
 * a circular fashion (the whole face — dimple included — rotates to follow the
 * finger, like a real jog wheel, not a joystick). It moves in click DETENTS
 * (~1/7 turn per step) with a Rigid haptic (the study action-button click) and
 * NO sound. As soon as they let go of the wheel — or tap outside it — the popup
 * closes.
 *
 * `onStep(dir)` fires once per detent crossed (+1 CW / −1 CCW); `onRelease`
 * fires when the drag ends.
 */
import { useMemo, useRef } from 'react';
import { Animated, Modal, PanResponder, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { hapticsEnabled } from '../features/settings/store';
import { colors, fonts } from '../theme/tokens';

const DETENT_DEG = 360 / 7; // ~51.4° per click → one hard full spin ≈ 7 steps
/** Finger-dimple centre as a fraction of the wheel size from the TOP — shared so
 *  the popup can align the big dimple to the small icon (the thumb press). */
const DIMPLE_CY = 0.26;

/** The SSL-style dished-black wheel face: matte-black domed disc lit from the
 *  upper-left, a concave centre, a faint purple sheen, and a finger dimple near
 *  the top. Used at BOTH sizes unchanged (small icon = this, shrunk). */
function JogFace({ size }: { size: number }) {
  const c = size / 2;
  const dR = size * 0.11; // dimple radius
  const dCy = size * DIMPLE_CY; // dimple centre y
  return (
    <Svg width={size} height={size}>
      <Defs>
        <RadialGradient id="jogBody" cx="40%" cy="34%" r="72%">
          <Stop offset="0" stopColor="#43434a" />
          <Stop offset="0.4" stopColor="#212127" />
          <Stop offset="0.75" stopColor="#0e0e12" />
          <Stop offset="1" stopColor="#050507" />
        </RadialGradient>
        <RadialGradient id="jogDish" cx="50%" cy="52%" r="58%">
          <Stop offset="0" stopColor="#000000" stopOpacity="0.5" />
          <Stop offset="0.7" stopColor="#000000" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="jogDimple" cx="40%" cy="32%" r="70%">
          <Stop offset="0" stopColor="#50505a" />
          <Stop offset="0.5" stopColor="#141418" />
          <Stop offset="1" stopColor="#000000" />
        </RadialGradient>
      </Defs>
      {/* Faint purple outer glow ring (owner: "some purple"). */}
      <Circle cx={c} cy={c} r={c - 0.5} fill="none" stroke="#7a4dff" strokeWidth={size * 0.02} opacity={0.35} />
      {/* Rim + matte-black domed body. */}
      <Circle cx={c} cy={c} r={c - 2} fill="#08080a" />
      <Circle cx={c} cy={c} r={c - 2} stroke="#3c3c44" strokeWidth={1} fill="none" opacity={0.7} />
      <Circle cx={c} cy={c} r={c - 4} fill="url(#jogBody)" />
      <Circle cx={c} cy={c} r={c - 4} fill="url(#jogDish)" />
      {/* Upper-left light sheen + a faint purple counter-sheen lower-right. */}
      <Ellipse cx={c - size * 0.15} cy={c - size * 0.2} rx={size * 0.28} ry={size * 0.16} fill="#ffffff" opacity={0.05} />
      <Ellipse cx={c + size * 0.12} cy={c + size * 0.16} rx={size * 0.3} ry={size * 0.18} fill="#8a5cff" opacity={0.06} />
      {/* Finger dimple near the top, with a small bright highlight. */}
      <Circle cx={c} cy={dCy} r={dR} fill="url(#jogDimple)" />
      <Circle cx={c} cy={dCy} r={dR} stroke="#5a5a64" strokeWidth={size * 0.008} fill="none" opacity={0.7} />
      <Circle cx={c - dR * 0.35} cy={dCy - dR * 0.4} r={dR * 0.28} fill="#ffffff" opacity={0.2} />
    </Svg>
  );
}

/** Small static jog on the Dashboard — a button that measures its own position
 *  and opens the big-wheel popup anchored to it (under the thumb). */
export function JogWheelTrigger({
  size = 74,
  disabled = false,
  onOpen,
}: {
  size?: number;
  disabled?: boolean;
  onOpen: (anchor: { x: number; y: number }) => void;
}) {
  const ref = useRef<View>(null);
  const handle = () => {
    const node = ref.current;
    if (!node) return;
    node.measureInWindow((x, y, w, h) => onOpen({ x: x + w / 2, y: y + h / 2 }));
  };
  return (
    <Pressable
      ref={ref}
      onPress={disabled ? undefined : handle}
      disabled={disabled}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      accessibilityLabel="Open the topic jog wheel"
      style={[styles.wrap, { width: size, height: size }, disabled && styles.disabled]}
    >
      <JogFace size={size} />
    </Pressable>
  );
}

/** The interactive wheel: drag AROUND it to detent-step; the whole face SPINS
 *  circularly to follow the finger. `onRelease` fires when the drag ends. */
export function JogWheel({
  size = 74,
  onStep,
  onRelease,
  disabled = false,
}: {
  size?: number;
  onStep: (dir: -1 | 1) => void;
  onRelease?: () => void;
  disabled?: boolean;
}) {
  const c = size / 2;
  const lastAngle = useRef(0);
  const accum = useRef(0);
  const onStepRef = useRef(onStep);
  onStepRef.current = onStep;
  const onReleaseRef = useRef(onRelease);
  onReleaseRef.current = onRelease;
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;

  // Continuous rotation of the whole face — this is the "spin" (a real jog wheel
  // turns; it is NOT a joystick). It follows the finger's angular movement 1:1.
  const spin = useRef(new Animated.Value(0)).current;
  const spinDeg = useRef(0);

  const angleAt = (lx: number, ly: number) => (Math.atan2(ly - c, lx - c) * 180) / Math.PI;

  const click = (dir: -1 | 1) => {
    onStepRef.current(dir);
    if (hapticsEnabled()) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid).catch(() => {});
  };

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
          // Spin the face by the same angular delta — circular, follows the finger.
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
        onPanResponderRelease: () => onReleaseRef.current?.(),
        onPanResponderTerminate: () => onReleaseRef.current?.(),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [c],
  );

  const rotate = spin.interpolate({
    inputRange: [-360, 360],
    outputRange: ['-360deg', '360deg'],
    extrapolate: 'extend',
  });

  return (
    <View
      {...pan.panHandlers}
      style={[styles.wrap, { width: size, height: size }, disabled && styles.disabled]}
      accessibilityRole="adjustable"
      accessibilityLabel="Jog wheel — turn to change the current topic"
    >
      <Animated.View style={{ width: size, height: size, transform: [{ rotate }] }}>
        <JogFace size={size} />
      </Animated.View>
    </View>
  );
}

/** Big-wheel popup (owner 2026-08-01): a large SSL jog wheel placed so its
 *  dimple sits exactly where the small icon was — under the thumb — so the user
 *  can turn it immediately. Releasing the wheel (or tapping outside it) closes. */
export function JogPopup({
  visible,
  anchor,
  onClose,
  onStep,
  label,
  sublabel,
  disabled = false,
}: {
  visible: boolean;
  anchor: { x: number; y: number } | null;
  onClose: () => void;
  onStep: (dir: -1 | 1) => void;
  label: string;
  sublabel?: string;
  disabled?: boolean;
}) {
  const { width, height } = useWindowDimensions();
  const size = Math.round(Math.min(width * 0.8, height * 0.5));
  const a = anchor ?? { x: width / 2, y: height / 2 };
  // Place the big DIMPLE at the anchor (the small icon / thumb press).
  const left = Math.round(a.x - size / 2);
  const top = Math.round(a.y - size * DIMPLE_CY);
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close jog wheel">
        <View style={[styles.jogHolder, { left, top, width: size, height: size }]}>
          <JogWheel size={size} disabled={disabled} onStep={onStep} onRelease={onClose} />
        </View>
        {label ? (
          <Text style={[styles.jogLabel, { top: top + size + 12 }]} numberOfLines={1}>
            {label}
            {sublabel ? `  ·  ${sublabel}` : ''}
          </Text>
        ) : null}
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.45 },

  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  jogHolder: { position: 'absolute' },
  jogLabel: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 15,
    letterSpacing: 0.6,
    color: colors.textPrimary,
  },
});
