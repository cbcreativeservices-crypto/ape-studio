/**
 * ParamLane — the Rack Unit's one shared channel fader, pinned in the dock and
 * BOUND to whichever fader param the student selected ("tap the legend, ride
 * the fader"). DragSlider's proven internals — anchored-dx math (locationX
 * re-bases when the finger leaves the track; dx never lies) and capture-claim
 * on touch start — are untouched. DragSlider itself is untouched at its 30
 * call sites.
 *
 * RESKINNED AS HARDWARE (owner design pass 2026-09-11): "we are teaching
 * audio… part of learning is getting comfortable with how things LOOK and are
 * laid out." This one component is every rack lab's continuous control —
 * foundations, digital, EQ, meter, tube, wave, the FX family, modular, the
 * oscillator family and more all bind it — so this single file is where a
 * student's hands learn what a console fader looks like:
 *   • a recessed travel SLOT with printed tick stops, not a progress track;
 *   • a brushed-metal CAP with grip grooves and a coloured indicator line
 *     (the material language of PresetFader's cap and the mixing GearStrip),
 *     riding ABOVE the slot the way a real cap stands proud of the panel;
 *   • the label and mono readout printed on the faceplate, backed so they
 *     never vanish under the cap (design pass 2026-08-31, kept).
 *
 * The LEVEL ramp fill stays, per the owner's 2026-09-05 standard (LEVEL lanes
 * show the amplitude ramp) — but it now glows INSIDE the recessed slot, a lit
 * groove rather than a bar-meter face, so the lane cannot be misread as a
 * meter (the no-fake-meters rule is about what a thing CLAIMS to be).
 *
 * Owner ruling 2026-09-11 (mid design pass): DOUBLE-TAP RETURNS HOME — unity
 * for faders, centre for panners. The lane is parameter-agnostic, so "home"
 * is the bound param's declared `home` position; a param that declares none
 * simply has no double-tap behaviour (a delay time has no unity to return to,
 * and inventing one would be a lie).
 *
 * The lane lives OUTSIDE the scroll well, so scroll contention is structurally
 * gone; no scroll-lock plumbing needed here.
 */
import { useRef } from 'react';
import { AccessibilityInfo, PanResponder, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts } from '../../../theme/tokens';
import { levelColor, rampColors } from '../../../features/tools/levelColor';
import { usePulseStyle } from '../../../features/lab/attentionPulse';

const DOUBLE_TAP_MS = 320;

export function ParamLane({
  label,
  value,
  readout,
  onChange,
  onDragActive,
  tint,
  level,
  home,
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
  /** The param's neutral position (0..1): unity for a gain, centre for a pan.
   *  Double-tap returns here (owner ruling 2026-09-11). Omit for params that
   *  have no honest home. */
  home?: number;
}) {
  const wRef = useRef(0);
  const baseRef = useRef(0);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onActiveRef = useRef(onDragActive);
  onActiveRef.current = onDragActive;
  const homeRef = useRef(home);
  homeRef.current = home;
  const labelRef = useRef(label);
  labelRef.current = label;
  const lastTapRef = useRef(0);
  const movedRef = useRef(false);
  const pulseStyle = usePulseStyle();

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onPanResponderGrant: (e) => {
        onActiveRef.current?.(true);
        movedRef.current = false;
        if (wRef.current > 0) {
          const v = Math.max(0, Math.min(1, (e.nativeEvent.locationX - CAP_W / 2) / (wRef.current - CAP_W)));
          baseRef.current = v;
          onChangeRef.current(v);
        }
      },
      onPanResponderMove: (_e, g) => {
        if (Math.abs(g.dx) > 5) movedRef.current = true;
        if (wRef.current > 0) {
          onChangeRef.current(Math.max(0, Math.min(1, baseRef.current + g.dx / (wRef.current - CAP_W))));
        }
      },
      onPanResponderRelease: () => {
        onActiveRef.current?.(false);
        // Double-tap → home (owner ruling 2026-09-11: unity for faders,
        // centre for panners). Tap semantics on this lane have always been
        // "jump to the finger", so the first tap of the pair jumps and the
        // second snaps home — the net result is home, which is the point.
        if (!movedRef.current) {
          const now = Date.now();
          if (now - lastTapRef.current < DOUBLE_TAP_MS && homeRef.current != null) {
            onChangeRef.current(homeRef.current);
            AccessibilityInfo.announceForAccessibility?.(`${labelRef.current} reset to home`);
            lastTapRef.current = 0;
          } else {
            lastTapRef.current = now;
          }
        }
      },
      onPanResponderTerminate: () => onActiveRef.current?.(false),
      onPanResponderTerminationRequest: () => false,
    }),
  ).current;

  const v = Math.max(0, Math.min(1, value));
  const c = level ? levelColor(v) : (tint ?? colors.amber);
  const capLeft = `${v * 100}%` as const;

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
      {/* The recessed travel slot. The fill lives INSIDE it — a lit groove,
          not a bar meter. */}
      <View pointerEvents="none" style={styles.slot}>
        {level ? (
          <LinearGradient
            colors={rampColors(v)}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.slotFill, { width: `${v * 100}%`, opacity: 0.8 }]}
          />
        ) : (
          <View style={[styles.slotFill, { width: `${v * 100}%`, backgroundColor: c + '66' }]} />
        )}
      </View>

      {/* Printed tick stops at 0 / ¼ / ½ / ¾ / full travel — the faceplate
          detail that says "fader", engraved, not interactive. */}
      {[0, 0.25, 0.5, 0.75, 1].map((f) => (
        <View
          key={f}
          pointerEvents="none"
          style={[styles.stop, { left: `${f * 100}%`, marginLeft: SLOT_PAD + f * -2 * SLOT_PAD - 0.5 }]}
        />
      ))}

      {/* The cap: brushed metal, grip grooves, coloured indicator line that
          breathes per the app-wide pulse standard. It overhangs the slot the
          way a real cap stands proud of the panel. */}
      <Animated.View pointerEvents="none" style={[styles.cap, { left: capLeft, marginLeft: -CAP_W * v }]}>
        <LinearGradient colors={['#3c3c44', '#26262c', '#303038']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
        <View style={styles.grip} />
        <Animated.View style={[styles.capLine, { backgroundColor: c }, pulseStyle]} />
        <View style={[styles.grip, { right: 5, left: undefined }]} />
      </Animated.View>

      {/* Backed chips (design pass 2026-08-31): at the lane's ends the cap
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

const CAP_W = 26;
const SLOT_PAD = 9; // slot inset from the lane ends

const styles = StyleSheet.create({
  lane: {
    height: 48,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#2c2c33',
    borderTopColor: '#3a3a42', // caught light on the top edge — panel, not card
    backgroundColor: '#141418',
    overflow: 'hidden',
    justifyContent: 'center',
    // Web: riding the fader must never double as a text-selection gesture.
    userSelect: 'none',
  },
  slot: {
    position: 'absolute',
    left: SLOT_PAD,
    right: SLOT_PAD,
    top: 20,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0a0a0c',
    borderWidth: 1,
    borderColor: '#000',
    overflow: 'hidden',
  },
  slotFill: { position: 'absolute', left: 0, top: 0, bottom: 0 },
  stop: { position: 'absolute', top: 32, width: 1, height: 5, backgroundColor: '#8b8b95', opacity: 0.45 },
  cap: {
    position: 'absolute',
    top: 6,
    width: CAP_W,
    height: 36,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#3d3d46',
    overflow: 'hidden',
    justifyContent: 'center',
    // The one element on the lane that stands proud of the panel.
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  grip: { position: 'absolute', left: 5, top: 6, bottom: 6, width: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  capLine: { alignSelf: 'center', width: 2.5, height: 24, borderRadius: 1.25 },
  laneLabel: {
    position: 'absolute',
    left: 10,
    top: 3,
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 11,
    letterSpacing: 1,
    color: colors.textSub,
    maxWidth: '46%',
  },
  laneValue: {
    position: 'absolute',
    right: 10,
    top: 3,
    fontFamily: fonts.mono,
    fontSize: 12.5,
  },
  textBacked: { backgroundColor: 'rgba(15,15,18,0.72)', paddingHorizontal: 4, borderRadius: 4, overflow: 'hidden' },
});
