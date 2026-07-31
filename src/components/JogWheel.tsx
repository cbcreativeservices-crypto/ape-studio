/**
 * JogWheel — a black dished rotary jog wheel (owner 2026-08-01, reworked).
 *
 * On the Dashboard the small wheel is a TRIGGER (`JogWheelTrigger`): touching it
 * opens `JogPopup` — a LARGE wheel in the lower two-thirds of the screen. The
 * user turns the big wheel to scroll the deck's topics; the wheel moves in CLICK
 * DETENTS (~1/7 turn per step) with a Rigid haptic (the study action-button
 * click) and NO sound. As soon as they let go of the wheel, the popup closes.
 *
 * The wheel itself no longer visually spins (owner removed that animation) — the
 * feedback is the detent haptic + the topic scrolling underneath.
 *
 * `onStep(dir)` fires once per detent crossed (+1 CW / −1 CCW); `onRelease`
 * fires when the drag ends. Angle is computed from the touch RELATIVE to the
 * view (locationX/Y), so no window measuring is needed.
 */
import { useMemo, useRef } from 'react';
import { Modal, PanResponder, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { hapticsEnabled } from '../features/settings/store';
import { colors, fonts } from '../theme/tokens';

const DETENT_DEG = 360 / 7; // ~51.4° per click → one hard full spin ≈ 7 steps

/** The pure dished-black wheel face: rim, concave dish, top sheen, finger
 *  dimple near the top (the "indent" the user rests a finger in). */
function JogFace({ size }: { size: number }) {
  const c = size / 2;
  return (
    <Svg width={size} height={size}>
      <Defs>
        <RadialGradient id="jogFace" cx="50%" cy="42%" r="62%">
          <Stop offset="0" stopColor="#242428" />
          <Stop offset="0.55" stopColor="#161619" />
          <Stop offset="0.86" stopColor="#37373d" />
          <Stop offset="1" stopColor="#0c0c0e" />
        </RadialGradient>
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
      {/* Subtle top highlight */}
      <Circle cx={c} cy={c - size * 0.12} r={c * 0.62} fill="#ffffff" opacity={0.04} />
      {/* Finger dimple */}
      <Circle cx={c} cy={c - size * 0.18} r={size * 0.11} fill="url(#jogDimple)" />
      <Circle cx={c} cy={c - size * 0.18} r={size * 0.11} stroke="#4a4a50" strokeWidth={0.8} fill="none" opacity={0.6} />
    </Svg>
  );
}

/** Small static jog on the Dashboard — a button that opens the big-wheel popup. */
export function JogWheelTrigger({
  size = 74,
  disabled = false,
  onPress,
}: {
  size?: number;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
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

/** The interactive wheel: drag AROUND it to detent-step; `onRelease` fires when
 *  the drag ends (used to dismiss the popup). No visual rotation. */
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

  const angleAt = (lx: number, ly: number) => (Math.atan2(ly - c, lx - c) * 180) / Math.PI;

  const click = (dir: -1 | 1) => {
    onStepRef.current(dir);
    // Same "click" the study action buttons use — haptic only, never a sound.
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

  return (
    <View
      {...pan.panHandlers}
      style={[styles.wrap, { width: size, height: size }, disabled && styles.disabled]}
      accessibilityRole="adjustable"
      accessibilityLabel="Jog wheel — turn to change the current topic"
    >
      <JogFace size={size} />
    </View>
  );
}

/** Big-wheel popup (owner 2026-08-01): a large jog wheel (~3/4 screen width) in
 *  the lower two-thirds of the screen. The user turns it to scroll topics; as
 *  soon as they let go of the wheel — or tap anywhere outside it — it closes. */
export function JogPopup({
  visible,
  onClose,
  onStep,
  label,
  sublabel,
  disabled = false,
}: {
  visible: boolean;
  onClose: () => void;
  onStep: (dir: -1 | 1) => void;
  label: string;
  sublabel?: string;
  disabled?: boolean;
}) {
  const { width, height } = useWindowDimensions();
  const wheelSize = Math.round(Math.min(width * 0.75, height * 0.45));
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      {/* Tap anywhere off the wheel closes; the wheel claims its own touches. */}
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close jog wheel">
        <View style={[styles.panel, { height: Math.round(height * 0.66) }]}>
          <View style={styles.grabber} />
          <Text style={styles.jogLabel} numberOfLines={1}>
            {label}
          </Text>
          {sublabel ? <Text style={styles.jogSub}>{sublabel}</Text> : null}
          <View style={styles.wheelWrap}>
            <JogWheel size={wheelSize} disabled={disabled} onStep={onStep} onRelease={onClose} />
          </View>
          <Text style={styles.jogHint}>Turn to change topic · let go to close</Text>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.45 },

  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  panel: {
    width: '100%',
    backgroundColor: '#141416',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderColor: '#2a2a2e',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 26,
    paddingHorizontal: 20,
  },
  grabber: { width: 42, height: 4, borderRadius: 2, backgroundColor: '#3a3a3e', marginBottom: 14 },
  jogLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 18, letterSpacing: 0.4, color: colors.textPrimary, textAlign: 'center' },
  jogSub: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.4, color: colors.amber, marginTop: 3 },
  wheelWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  jogHint: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.textSub, textAlign: 'center' },
});
