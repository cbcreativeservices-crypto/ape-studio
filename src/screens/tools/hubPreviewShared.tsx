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
import { LinearGradient, Stop } from 'react-native-svg';
import { fonts } from '../../theme/tokens';
import { levelColor } from '../../features/tools/levelColor';

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

/** The strips' vertical level ramp (loud top → silent bottom).
 *
 *  DERIVED from the app-wide amplitude standard (swept 2026-08-28). These used
 *  to be eight hand-typed hexes that had drifted off it — near-misses like
 *  #e8503a for the canonical red — so the tile minis spoke a slightly different
 *  colour language than the tools they preview. The OFFSETS below are the ones
 *  from the owner-approved 2026-08-19 tile pass and are unchanged; only the
 *  colours now come from `levelColor`, so the ramp can never drift again.
 *
 *  The last stop is darkened past blue toward black: the bottom of a strip is
 *  SILENCE, and silence reads as background rather than as a lit wall of blue
 *  (owner 2026-08-28, the same ruling `heatColor` follows). */
const LVL_OFFSETS = [0, 0.14, 0.26, 0.4, 0.56, 0.72, 0.88, 1] as const;

/** Mix a hex toward black. `k` 1 = untouched, 0 = black. */
function darken(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.round(v * k).toString(16).padStart(2, '0');
  return `#${c((n >> 16) & 255)}${c((n >> 8) & 255)}${c(n & 255)}`;
}

export const LVL_STOPS: ReadonlyArray<readonly [number, string]> = LVL_OFFSETS.map((o) => [
  o,
  // offset 0 = top of the strip = full scale, so level is the INVERSE of offset.
  o === 1 ? darken(levelColor(0), 0.42) : levelColor(1 - o),
]);

/** Mirrored ramp for zero-centred waveforms: the SAME ramp folded about the
 *  zero line, so amplitude MAGNITUDE drives the colour and both extremes read
 *  red. Folding it (rather than typing a second table) is what keeps the two in
 *  step. */
export const MIR_STOPS: ReadonlyArray<readonly [number, string]> = [
  ...LVL_STOPS.map(([o, c]) => [o / 2, c] as const),
  ...LVL_STOPS.slice(0, -1)
    .reverse()
    .map(([o, c]) => [1 - o / 2, c] as const),
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

// (The strips' amber ambient radial was removed from the minis — owner
// 2026-08-19: no amber glow on the tile displays.)

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
    // The display is shown uncropped now (owner 2026-09-05) — the tag sits
    // just off the plot floor.
    bottom: '5%',
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
