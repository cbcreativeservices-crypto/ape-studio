/**
 * JogWheel — an SSL-style dished jog wheel (owner 2026-08-01).
 *
 * On the Dashboard the small wheel is a TRIGGER (`JogWheelTrigger`) — the SAME
 * graphic, just shrunk. Touching it opens `JogPopup`: a large copy CENTERED
 * left-right on the screen, with its finger DIMPLE pointed at the small icon (so
 * the thumb that pressed it is more or less over the dimple). Turning the wheel
 * visibly SPINS it (fixed matte base; the dimple + highlight + shadow rotate on
 * top — real jog feel, not a joystick). It steps in click DETENTS (~1/7 turn)
 * with a Rigid haptic, no sound.
 *
 * Smoothness: the popup steps a LOCAL index while turning (only the popup
 * re-renders); the heavy Dashboard is updated ONCE, on close — so scrolling is
 * not delayed or jittery. Letting go of the wheel (or tapping outside) closes.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Modal, PanResponder, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { hapticsEnabled } from '../features/settings/store';
import { colors, fonts } from '../theme/tokens';

const DETENT_DEG = 360 / 7; // ~51.4° per click → one hard full spin ≈ 7 steps
/** Default finger-dimple centre as a fraction of size from the TOP. */
const DIMPLE_CY = 0.26;

type Pt = { x: number; y: number };

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

/** Light features that ROTATE with the wheel: a specular highlight (top), a cast
 *  shadow (bottom, opposite), and the finger dimple. `dimple` positions the
 *  dimple (default top-centre; the popup points it at the thumb). */
function JogFeatures({ size, dimple }: { size: number; dimple: Pt }) {
  const c = size / 2;
  const dR = size * 0.11;
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
      {/* Cast shadow + specular highlight — orbit while turning. */}
      <Ellipse cx={c} cy={size * 0.72} rx={size * 0.4} ry={size * 0.28} fill="url(#jogSh)" />
      <Ellipse cx={c} cy={size * 0.3} rx={size * 0.36} ry={size * 0.24} fill="url(#jogHi)" />
      {/* Finger dimple with a small bright highlight on its upper-left. */}
      <Circle cx={dimple.x} cy={dimple.y} r={dR} fill="url(#jogDimple)" />
      <Circle cx={dimple.x} cy={dimple.y} r={dR} stroke="#5a5a64" strokeWidth={size * 0.008} fill="none" opacity={0.7} />
      <Circle cx={dimple.x - dR * 0.35} cy={dimple.y - dR * 0.4} r={dR * 0.3} fill="#ffffff" opacity={0.22} />
    </Svg>
  );
}

function JogStack({ size, dimple, rotate }: { size: number; dimple: Pt; rotate?: Animated.AnimatedInterpolation<string> }) {
  return (
    <View style={{ width: size, height: size }}>
      <View style={StyleSheet.absoluteFill}>
        <JogBase size={size} />
      </View>
      {rotate ? (
        <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate }] }]}>
          <JogFeatures size={size} dimple={dimple} />
        </Animated.View>
      ) : (
        <View style={StyleSheet.absoluteFill}>
          <JogFeatures size={size} dimple={dimple} />
        </View>
      )}
    </View>
  );
}

/** Small static jog on the Dashboard — a button that measures its own position
 *  and opens the big-wheel popup pointed at it. */
export function JogWheelTrigger({
  size = 74,
  disabled = false,
  onOpen,
}: {
  size?: number;
  disabled?: boolean;
  onOpen: (anchor: Pt) => void;
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
      <JogStack size={size} dimple={{ x: size / 2, y: size * DIMPLE_CY }} />
    </Pressable>
  );
}

/** The interactive wheel: drag AROUND it to detent-step; the light features SPIN
 *  circularly to follow the finger. `onRelease` fires when the drag ends. */
export function JogWheel({
  size = 74,
  onStep,
  onRelease,
  disabled = false,
  dimple,
}: {
  size?: number;
  onStep: (dir: -1 | 1) => void;
  onRelease?: () => void;
  disabled?: boolean;
  dimple?: Pt;
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
          while (d > 180) d -= 360;
          while (d < -180) d += 360;
          lastAngle.current = a;
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
      <JogStack size={size} dimple={dimple ?? { x: size / 2, y: size * DIMPLE_CY }} rotate={rotate} />
    </View>
  );
}

/** Big-wheel popup: CENTERED left-right; the dimple points at the small icon so
 *  the thumb is over it. Steps a LOCAL index while turning (smooth); commits to
 *  the Dashboard once, on close. Releasing the wheel / tapping outside closes. */
export function JogPopup({
  visible,
  anchor,
  onClose,
  topics,
  startIndex,
  onCommit,
}: {
  visible: boolean;
  anchor: Pt | null;
  onClose: () => void;
  topics: { id: string; name: string }[];
  startIndex: number;
  onCommit: (index: number) => void;
}) {
  const { width, height } = useWindowDimensions();
  const size = Math.round(Math.min(width * 0.62, height * 0.4));
  const left = Math.round(width / 2 - size / 2); // CENTERED left-right
  const a = anchor ?? { x: width / 2, y: height * 0.42 };
  const top = Math.max(56, Math.min(Math.round(a.y - size * DIMPLE_CY), height - size - 72));
  // Point the dimple at the thumb: its x within the centred wheel = anchor.x−left.
  const dimple: Pt = {
    x: Math.max(size * 0.18, Math.min(a.x - left, size * 0.82)),
    y: size * DIMPLE_CY,
  };

  const [idx, setIdx] = useState(startIndex);
  const idxRef = useRef(idx);
  idxRef.current = idx;
  useEffect(() => {
    if (visible) setIdx(startIndex);
  }, [visible, startIndex]);

  const disabled = topics.length <= 1;
  const step = (d: -1 | 1) => setIdx((i) => Math.max(0, Math.min(topics.length - 1, i + d)));
  const close = () => {
    onCommit(idxRef.current);
    onClose();
  };

  const cur = topics[idx];
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close} accessibilityRole="button" accessibilityLabel="Close jog wheel">
        <View style={[styles.jogHolder, { left, top, width: size, height: size }]}>
          <JogWheel size={size} disabled={disabled} dimple={dimple} onStep={step} onRelease={close} />
        </View>
        {cur ? (
          <Text style={[styles.jogLabel, { top: top + size + 12 }]} numberOfLines={1}>
            {cur.name}  ·  TOPIC {idx + 1} OF {topics.length}
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
