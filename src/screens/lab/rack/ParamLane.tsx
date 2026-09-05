/**
 * ParamLane — the Rack Unit's one shared channel fader (~44dp track), pinned
 * in the dock and BOUND to whichever fader param the student selected ("tap
 * the legend, ride the fader"). DragSlider's proven internals — anchored-dx
 * math (locationX re-bases when the finger leaves the track; dx never lies)
 * and capture-claim on touch start — re-skinned as a console fader with the
 * label + mono value printed IN the lane. DragSlider itself is untouched at
 * its 30 call sites.
 *
 * The lane lives OUTSIDE the scroll well, so scroll contention is structurally
 * gone; no scroll-lock plumbing needed here.
 *
 * Owner standard 2026-09-05: the thumb BREATHES (5 s loop) so the lane reads
 * as interactable, and a LEVEL lane (`level`) shows the amplitude ramp
 * climbing from silence-blue to the level's colour, thumb in that colour.
 */
import { useRef } from 'react';
import { PanResponder, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts } from '../../../theme/tokens';
import { levelColor, rampColors } from '../../../features/tools/levelColor';
import { usePulseStyle } from '../../../features/lab/attentionPulse';

export function ParamLane({
  label,
  value,
  readout,
  onChange,
  onDragActive,
  tint,
  level,
}: {
  label: string;
  /** 0..1 lane position. */
  value: number;
  /** Formatted value string (mono, right side of the lane). */
  readout: string;
  onChange: (v: number) => void;
  /** True while the finger is riding the lane — drives the in-glass drag tag. */
  onDragActive?: (active: boolean) => void;
  /** Thumb/fill tint (default amber). */
  tint?: string;
  /** This lane sets a LEVEL (level, input/drive, gain, amplitude…): fill =
   *  the amplitude ramp climbing to the level's colour, thumb + readout in
   *  that colour. Overrides `tint`. */
  level?: boolean;
}) {
  const wRef = useRef(0);
  const baseRef = useRef(0);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onActiveRef = useRef(onDragActive);
  onActiveRef.current = onDragActive;
  const pulseStyle = usePulseStyle();

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onPanResponderGrant: (e) => {
        onActiveRef.current?.(true);
        if (wRef.current > 0) {
          const v = Math.max(0, Math.min(1, (e.nativeEvent.locationX - THUMB_W / 2) / (wRef.current - THUMB_W)));
          baseRef.current = v;
          onChangeRef.current(v);
        }
      },
      onPanResponderMove: (_e, g) => {
        if (wRef.current > 0) {
          onChangeRef.current(Math.max(0, Math.min(1, baseRef.current + g.dx / (wRef.current - THUMB_W))));
        }
      },
      onPanResponderRelease: () => onActiveRef.current?.(false),
      onPanResponderTerminate: () => onActiveRef.current?.(false),
      onPanResponderTerminationRequest: () => false,
    }),
  ).current;

  const v = Math.max(0, Math.min(1, value));
  const c = level ? levelColor(v) : (tint ?? colors.amber);

  return (
    <View
      style={styles.lane}
      onLayout={(e) => (wRef.current = e.nativeEvent.layout.width)}
      {...pan.panHandlers}
      accessibilityRole="adjustable"
      accessibilityLabel={`${label}: ${readout}`}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => {
        const step = e.nativeEvent.actionName === 'increment' ? 0.05 : -0.05;
        onChangeRef.current(Math.max(0, Math.min(1, v + step)));
      }}
    >
      {level ? (
        <LinearGradient
          pointerEvents="none"
          colors={rampColors(v)}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.fill, { width: `${v * 100}%`, opacity: 0.45 }]}
        />
      ) : (
        <View pointerEvents="none" style={[styles.fill, { width: `${v * 100}%`, backgroundColor: c + '22' }]} />
      )}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.thumb,
          // eslint-disable-next-line react-native/no-inline-styles
          { left: `${v * 100}%`, marginLeft: -THUMB_W * v, backgroundColor: c },
          pulseStyle,
        ]}
      />
      {/* Backed chips (design pass 2026-08-31): at the lane's ends the thumb
          sat under same-hue text — the label and value vanished into it. */}
      <Text pointerEvents="none" style={[styles.laneLabel, styles.textBacked]} numberOfLines={1}>
        {label}
      </Text>
      <Text pointerEvents="none" style={[styles.laneValue, styles.textBacked, { color: c }]} numberOfLines={1}>
        {readout}
      </Text>
    </View>
  );
}

const THUMB_W = 22;

const styles = StyleSheet.create({
  lane: {
    height: 44,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#2c2c33',
    backgroundColor: '#0f0f12',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0 },
  thumb: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    width: THUMB_W,
    borderRadius: 6,
    // subtle key-cap edge so the thumb reads as hardware
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.35)',
  },
  laneLabel: {
    position: 'absolute',
    left: 10,
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 12,
    letterSpacing: 1,
    color: colors.textSub,
    maxWidth: '46%',
  },
  laneValue: {
    position: 'absolute',
    right: 10,
    fontFamily: fonts.mono,
    fontSize: 14,
  },
  textBacked: { backgroundColor: 'rgba(15,15,18,0.72)', paddingHorizontal: 4, borderRadius: 4, overflow: 'hidden' },
});
