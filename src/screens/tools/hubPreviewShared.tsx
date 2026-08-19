/**
 * hubPreviewShared — tiny primitives shared by the live + simulated tile
 * previews on the Tools & Analysis hub (2026-08-19). The look is a verbatim
 * port of the approved tool-strip artwork (assets/tool-strips — the design
 * deliverable): same shell (#060608 base, amber ambient, bottom vignette),
 * same level ramps. Gradient ids here use the `hp` prefix so they can never
 * collide with the strips' hand-suffixed ids (amb_bNN/lvl_bNN/… — the
 * .svgrrc.js svgo:false lesson: one global id namespace per screen on web).
 */
import { useState } from 'react';
import { Platform, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { LinearGradient as RnLinearGradient } from 'expo-linear-gradient';
import { LinearGradient, RadialGradient, Stop } from 'react-native-svg';
import { fonts } from '../../theme/tokens';

/** Measured width of a preview root (the minis position RN overlays in pt
 *  space). One shared implementation — copies drift (equality guard, rounding). */
export function useMeasuredWidth(): [number, (e: LayoutChangeEvent) => void] {
  const [w, setW] = useState(0);
  return [
    w,
    (e: LayoutChangeEvent) => {
      const width = e.nativeEvent.layout.width;
      setW((p) => (p === width ? p : width));
    },
  ];
}

/** RN Animated native driver is unavailable on web (NavIcon caveat). */
export const NATIVE_DRIVER = Platform.OS !== 'web';

/** The strips' vertical level ramp (red top → deep blue bottom). */
export const LVL_STOPS: ReadonlyArray<readonly [number, string]> = [
  [0, '#e8503a'],
  [0.14, '#f0a23c'],
  [0.26, '#e9dc4d'],
  [0.4, '#8ed24c'],
  [0.56, '#34b96e'],
  [0.72, '#2b9ad2'],
  [0.88, '#2166c4'],
  [1, '#143a86'],
];

/** Mirrored ramp for zero-centred waveforms (red at both extremes). */
export const MIR_STOPS: ReadonlyArray<readonly [number, string]> = [
  [0, '#e8503a'],
  [0.07, '#f0a23c'],
  [0.13, '#e9dc4d'],
  [0.2, '#8ed24c'],
  [0.28, '#34b96e'],
  [0.36, '#2b9ad2'],
  [0.44, '#2166c4'],
  [0.5, '#143a86'],
  [0.56, '#2166c4'],
  [0.64, '#2b9ad2'],
  [0.72, '#34b96e'],
  [0.8, '#8ed24c'],
  [0.87, '#e9dc4d'],
  [0.93, '#f0a23c'],
  [1, '#e8503a'],
];

/** Gradient stops — ALWAYS keyed by index: the ramps carry duplicate offsets
 *  (mir doubles 0.5) and duplicate colors (the 2026-08-15 duplicate-key freeze). */
export function rampStops(stops: ReadonlyArray<readonly [number, string]>) {
  return stops.map(([offset, color], i) => <Stop key={i} offset={offset} stopColor={color} />);
}

/** Vertical strip-level gradient pinned to absolute canvas coords (the art's
 *  userSpaceOnUse contract: color maps absolute level, never per-bar bbox). */
export function LvlGrad({ id, y1, y2 }: { id: string; y1: number; y2: number }) {
  return (
    <LinearGradient id={id} gradientUnits="userSpaceOnUse" x1="0" y1={y1} x2="0" y2={y2}>
      {rampStops(LVL_STOPS)}
    </LinearGradient>
  );
}

export function MirGrad({ id, y1, y2 }: { id: string; y1: number; y2: number }) {
  return (
    <LinearGradient id={id} gradientUnits="userSpaceOnUse" x1="0" y1={y1} x2="0" y2={y2}>
      {rampStops(MIR_STOPS)}
    </LinearGradient>
  );
}

/** The strips' amber ambient radial (drawn under the chrome). */
export function AmbGrad({ id, peak = 0.26 }: { id: string; peak?: number }) {
  return (
    <RadialGradient id={id} cx="14%" cy="10%" r="85%">
      <Stop offset="0" stopColor="#f5a020" stopOpacity={peak} />
      <Stop offset="0.55" stopColor="#f5a020" stopOpacity={peak > 0.22 ? 0.05 : 0.04} />
      <Stop offset="1" stopColor="#f5a020" stopOpacity="0" />
    </RadialGradient>
  );
}

/** The strips' bottom vignette, as an RN overlay so it stays TOPMOST above the
 *  minis' RN needle/cursor/plotter overlays (in the art the vignette is the
 *  last-drawn element — data must never read brighter than the statics). */
export function Vignette() {
  return (
    <RnLinearGradient
      pointerEvents="none"
      colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.45)']}
      locations={[0, 0.55, 1]}
      style={StyleSheet.absoluteFill}
    />
  );
}

/** Integrity chip for the three scripted cards (measurement-tools §1.7: nothing
 *  simulated may read as a live measurement — the ToolDemo badge precedent at
 *  tile scale). Bottom-right, tiny, dim: showroom "demo mode", not an alert. */
export function DemoTag() {
  return (
    <View pointerEvents="none" style={tagStyles.wrap}>
      <Text style={tagStyles.text}>DEMO</Text>
    </View>
  );
}

const tagStyles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    right: 4,
    // The tile crops the strip's 2:1 inner to 2.5:1 — the bottom 10% of this
    // view is NOT visible. 13% keeps the tag inside the visible band.
    bottom: '13%',
    borderRadius: 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(122,130,148,0.55)',
    backgroundColor: 'rgba(6,7,9,0.6)',
    paddingHorizontal: 3,
    paddingVertical: 0.5,
  },
  text: {
    fontFamily: fonts.mono,
    fontSize: 6.5,
    letterSpacing: 1,
    color: 'rgba(174,185,203,0.85)',
  },
});
