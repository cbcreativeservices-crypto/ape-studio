/**
 * Rt60Demo — RT60 (reverberation time) TRAINING DEMO (spec of record
 * docs/APE_AUDIO_TOOLS_SPEC_2026_07_23.md §13; demo-mode contract §4 and
 * integrity rules §5 / measurement-tools §1.7 — 2026-07-23; design pass
 * 2026-09-13 per the shared tool-demo brief).
 *
 * Visual/animated teaching panel only — no audio, no live values, no meters
 * (LedMeter is real-values-only and is not used here). The hosting
 * ToolDemoScreen renders the permanent "TRAINING DEMO" badge.
 *
 * Three scenes:
 *  1. THE DECAY CURVE — Schroeder-style decay on a real time axis (seconds),
 *     T30 fit (−5..−35 dB), extrapolation to −60 dB, and the RT60 answer
 *     marked ON the plot (drop tick + readout chip). The decay trace is
 *     stroked with the shared amplitude ramp (levelColor stops) so the curve
 *     itself cools from loud-red to silent-blue as the room dies out.
 *  2. TREATED vs UNTREATED — two decays overlaid (RT60 1.8 s vs 0.45 s) with
 *     per-curve labels and their RT60 values marked on the time axis. The two
 *     hues here encode ROOM IDENTITY for the A/B comparison (orange = the
 *     ringing room, green = the treated one), not level.
 *  3. NOISE FLOOR LIMIT — the decay sinking into a named −38 dB noise floor;
 *     the usable span is bracketed (23 dB), the required span stated (30 dB),
 *     and the result is visibly REJECTED — the integrity lesson.
 *
 * All curves are fixed precomputed arrays (no Math.random). Animation is RN
 * core Animated driving container transforms/opacity only (native driver);
 * SVG itself is static geometry.
 */
import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Polyline, Stop, Text as SvgText } from 'react-native-svg';
import { LOUDNESS_STOPS } from '../../features/tools/levelColor';
import { colors, fonts } from '../../theme/tokens';

// Callout semantics (shared demo contract): amber = the thing being taught,
// salmon = warning/limit, steel = neutral reference.
const SALMON = '#ff8d7a';
const STEEL = '#9aa3ad';
const LEADER = 'rgba(255,255,255,0.35)';

// ————————————————————————————————————————————————————————— plot geometry ——
// Adaptive width so the recessed frame never overflows narrow phones
// (screen − scroll padding 32 − card border/padding − frame border/padding).
const WIN_W = Dimensions.get('window').width;
const VIZ_W = Math.max(268, Math.min(304, Math.round(WIN_W) - 82));
const VIZ_H = 226;
const PX = 38; // plot left (room for dB labels)
const PY = 14; // plot top = 0 dB
const PH = 190; // plot height = 60 dB span
const PB = PY + PH; // plot bottom = −60 dB
const PW = VIZ_W - PX - 12; // plot width, scenes 1–2
const PW3 = VIZ_W - PX - 58; // plot width, scene 3 (right margin for the bracket)
const TICK_Y = PB + 15; // time-axis tick label baseline

const r1 = (n: number) => Math.round(n * 10) / 10;
const dbY = (db: number) => r1(PY + (-db / 60) * PH);

const STEPS = 25;
const T = Array.from({ length: STEPS }, (_, i) => i / (STEPS - 1));

// —— Scene 1: Schroeder decay + T30 fit → RT60 extrapolation ———————————————
// Slightly concave decay (early reflections die faster), in REAL SECONDS:
// dB(s) = −64s + 6s². The T30 fit slope works out to ≈60 dB/s → RT60 ≈ 1.0 s.
const SEC1 = 1.2; // x-axis spans 0..1.2 s
const sx1 = (s: number) => r1(PX + (s / SEC1) * PW);
const decayDb = (s: number) => -64 * s + 6 * s * s;
// Invert for anchor times: 6s² − 64s − dB = 0.
const sAt = (db: number) => (64 - Math.sqrt(4096 + 24 * db)) / 12;
const S60 = sAt(-60); // ≈1.04 s — where the raw curve reaches −60
const X1 = T.map((t) => sx1(t * S60));
const Y1 = T.map((t) => dbY(decayDb(t * S60)));
const LINE1 = X1.map((x, i) => `${x},${Y1[i]}`).join(' ');
const S5 = sAt(-5);
const S35 = sAt(-35);
const FIT_SLOPE = 30 / (S35 - S5); // ≈60 dB per second over the −5..−35 span
const RT60_S = 60 / FIT_SLOPE; // ≈0.9995 s — the reported RT60
const S_CROSS = S5 + 55 / FIT_SLOPE; // where the fitted line crosses −60 dB
const FIT = {
  x5: sx1(S5),
  y5: dbY(-5),
  x35: sx1(S35),
  y35: dbY(-35),
  x60: sx1(S_CROSS),
  y60: dbY(-60),
};
// Callout anchors (derived from the curve/fit so they track the geometry).
const SF18 = S5 + 13 / FIT_SLOPE; // fit point at −18 dB
const C1_T30 = { ax: sx1(SF18) + 4, ay: dbY(-18), lx: sx1(SF18) + 30, ly: dbY(-18) - 8 };
const S_MID = (S35 + S_CROSS) / 2; // midpoint of the dashed extrapolation
const C1_EXT = { ax: sx1(S_MID) - 2, ay: dbY(-47.5) + 4, lx: sx1(S_MID) - 28, ly: dbY(-47.5) + 24 };

// —— Scene 2: treated vs untreated ————————————————————————————————————————
const SEC2 = 2.0; // x-axis spans 0..2.0 s
const sx2 = (s: number) => r1(PX + (s / SEC2) * PW);
const RT_UNTREATED = 1.8;
const RT_TREATED = 0.45;
const N2 = 15;
const curve2 = (rt: number) =>
  Array.from({ length: N2 }, (_, i) => {
    const sec = (rt * i) / (N2 - 1);
    return {
      p: sec / SEC2, // loop-progress position of this sample
      x: sx2(sec),
      y: dbY(-60 * Math.pow(sec / rt, 1.06)),
    };
  });
const UNT = curve2(RT_UNTREATED);
const TRE = curve2(RT_TREATED);
const LINE_UNT = UNT.map((q) => `${q.x},${q.y}`).join(' ');
const LINE_TRE = TRE.map((q) => `${q.x},${q.y}`).join(' ');
const P_UNT = RT_UNTREATED / SEC2; // 0.9 — untreated dot lands here
const P_TRE = RT_TREATED / SEC2; // 0.225 — treated dot lands here
// Curve point on an RT curve at time s (for callout leader anchors).
const pt2 = (rt: number, s: number) => ({ x: sx2(s), y: dbY(-60 * Math.pow(s / rt, 1.06)) });
const C2_TRE = pt2(RT_TREATED, 0.29);
const C2_UNT = pt2(RT_UNTREATED, 1.04);

// —— Scene 3: noise floor limit ———————————————————————————————————————————
const SEC3 = 1.0; // x-axis spans 0..1.0 s; decay slope 70 dB/s
const sx3 = (s: number) => r1(PX + (s / SEC3) * PW3);
const FLOOR_DB = -38;
// Fixed hand-seeded jitter for the noise floor (spec forbids Math.random).
const WIGGLE = [0.9, -0.7, 1.2, -0.5, 0.4, -1.1, 0.8, -0.9, 1.0, -0.4, 0.6, -1.2];
const decay3 = (s: number, i: number) =>
  Math.max(-70 * s, FLOOR_DB + WIGGLE[i % WIGGLE.length] * 0.9);
const X3 = T.map((t) => sx3(t * SEC3));
const Y3 = T.map((t, i) => dbY(decay3(t * SEC3, i)));
const LINE3 = X3.map((x, i) => `${x},${Y3[i]}`).join(' ');
const BAND_Y = dbY(FLOOR_DB);
const Y_M5 = dbY(-5);
const Y_M28 = dbY(-28); // valid fit bottom = 10 dB above the −38 dB floor
const BRACKET_X = PX + PW3 + 12;

// ————————————————————————————————————————————————————————————— animation ——
function useLoop(duration: number, holdMs: number): Animated.Value {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration, easing: Easing.linear, useNativeDriver: true }),
        Animated.delay(holdMs),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [v, duration, holdMs]);
  return v;
}

function usePulse(): Animated.Value {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [v]);
  return v;
}

type Interp = Animated.AnimatedInterpolation<number>;

/** The moving "level" marker — an overlay View driven by transforms only. */
function Dot({ x, y, opacity, color }: { x: Interp; y: Interp; opacity: Interp; color: string }) {
  return (
    <Animated.View
      pointerEvents='none'
      style={[styles.dot, { backgroundColor: color, opacity, transform: [{ translateX: x }, { translateY: y }] }]}
    />
  );
}

/** Vertical amplitude-ramp gradient for the decay trace: 0 dB (loud, red) at
 *  the top of the plot → −60 dB (silence, MIDI blue) at the bottom. The dB
 *  axis is linear, so the shared LOUDNESS_STOPS map straight onto it. */
function DecayRampDefs() {
  return (
    <Defs>
      <LinearGradient id='rt60ramp' gradientUnits='userSpaceOnUse' x1={0} y1={PY} x2={0} y2={PB}>
        {LOUDNESS_STOPS.map((s) => (
          <Stop key={s.pos} offset={s.pos} stopColor={s.color} />
        ))}
      </LinearGradient>
    </Defs>
  );
}

// ————————————————————————————————————————————————————————————— scene 1 ——
function SceneDecay() {
  const p = useLoop(3600, 900);
  const dotX = p.interpolate({ inputRange: T, outputRange: X1 });
  const dotY = p.interpolate({ inputRange: T, outputRange: Y1 });
  const dotO = p.interpolate({ inputRange: [0, 0.04, 0.93, 1], outputRange: [0, 1, 1, 0] });
  const tagO = p.interpolate({ inputRange: [0, 0.76, 0.9, 1], outputRange: [0, 0, 1, 1] });

  return (
    <View style={styles.viz}>
      <Svg width={VIZ_W} height={VIZ_H} viewBox={`0 0 ${VIZ_W} ${VIZ_H}`}>
        <DecayRampDefs />
        <Line x1={PX} y1={PY} x2={PX} y2={PB} stroke={colors.steelBorder} strokeWidth={1} />
        <Line x1={PX} y1={PB} x2={PX + PW} y2={PB} stroke={colors.steelBorder} strokeWidth={1} />
        {/* Fit-range gridlines (−5 / −35 dB) and the −60 dB target */}
        <Line x1={PX} y1={FIT.y5} x2={PX + PW} y2={FIT.y5} stroke='rgba(255,198,77,0.25)' strokeWidth={1} strokeDasharray='3,5' />
        <Line x1={PX} y1={FIT.y35} x2={PX + PW} y2={FIT.y35} stroke='rgba(255,198,77,0.25)' strokeWidth={1} strokeDasharray='3,5' />
        <Line x1={PX} y1={FIT.y60} x2={FIT.x60} y2={FIT.y60} stroke={colors.hairline} strokeWidth={1} strokeDasharray='3,5' />
        {/* Integrated (Schroeder-style) decay — stroked on the amplitude ramp */}
        <Polyline points={LINE1} fill='none' stroke='url(#rt60ramp)' strokeWidth={2.5} strokeLinecap='round' strokeLinejoin='round' />
        {/* Fitted T30 line, then its dashed extrapolation to −60 dB */}
        <Line x1={FIT.x5} y1={FIT.y5} x2={FIT.x35} y2={FIT.y35} stroke={colors.amber} strokeWidth={2} strokeLinecap='round' />
        <Line x1={FIT.x35} y1={FIT.y35} x2={FIT.x60} y2={FIT.y60} stroke={colors.amber} strokeWidth={1.5} strokeDasharray='4,5' />
        {/* The answer, marked ON the plot: crossing dot + drop tick at 1.0 s */}
        <Circle cx={FIT.x60} cy={FIT.y60} r={3.5} fill={colors.amber} />
        <Line x1={FIT.x60} y1={PB} x2={FIT.x60} y2={PB + 6} stroke={colors.amber} strokeWidth={1.5} />
        <SvgText x={FIT.x60} y={TICK_Y} textAnchor='middle' fontFamily={fonts.mono} fontSize={12} fill={colors.amber}>1.0 s</SvgText>
        {/* Callout: the T30 fit */}
        <Line x1={C1_T30.lx - 4} y1={C1_T30.ly + 4} x2={C1_T30.ax} y2={C1_T30.ay} stroke={LEADER} strokeWidth={1} />
        <SvgText x={C1_T30.lx} y={C1_T30.ly} textAnchor='start' fontFamily={fonts.oswaldSemiBold} fontSize={10} letterSpacing={1} fill={colors.amber}>T30 FIT</SvgText>
        <SvgText x={C1_T30.lx} y={C1_T30.ly + 12} textAnchor='start' fontFamily={fonts.mono} fontSize={10} fill={colors.amber}>-5 → -35 dB</SvgText>
        {/* Callout: the dashed extrapolation */}
        <Line x1={C1_EXT.lx + 2} y1={C1_EXT.ly - 4} x2={C1_EXT.ax} y2={C1_EXT.ay} stroke={LEADER} strokeWidth={1} />
        <SvgText x={C1_EXT.lx} y={C1_EXT.ly + 4} textAnchor='end' fontFamily={fonts.oswaldSemiBold} fontSize={10} letterSpacing={1} fill={STEEL}>EXTRAPOLATED</SvgText>
        {/* dB axis labels */}
        <SvgText x={PX - 4} y={PY + 4} textAnchor='end' fontFamily={fonts.mono} fontSize={12} fill={colors.textMuted}>0</SvgText>
        <SvgText x={PX - 4} y={FIT.y5 + 10} textAnchor='end' fontFamily={fonts.mono} fontSize={12} fill={colors.textMuted}>-5</SvgText>
        <SvgText x={PX - 4} y={FIT.y35 + 4} textAnchor='end' fontFamily={fonts.mono} fontSize={12} fill={colors.textMuted}>-35</SvgText>
        <SvgText x={PX - 4} y={FIT.y60 + 4} textAnchor='end' fontFamily={fonts.mono} fontSize={12} fill={colors.textMuted}>-60</SvgText>
        {/* Time axis in seconds */}
        <SvgText x={sx1(0)} y={TICK_Y} textAnchor='middle' fontFamily={fonts.mono} fontSize={12} fill={colors.textMuted}>0</SvgText>
        <SvgText x={sx1(0.5)} y={TICK_Y} textAnchor='middle' fontFamily={fonts.mono} fontSize={12} fill={colors.textMuted}>0.5</SvgText>
      </Svg>
      <Dot x={dotX} y={dotY} opacity={dotO} color={colors.amber} />
      <Animated.View style={[styles.rtChip, { opacity: tagO }]} pointerEvents='none'>
        <Text style={styles.rtChipText}>RT60 ≈ {r1(RT60_S).toFixed(1)} s</Text>
      </Animated.View>
    </View>
  );
}

// ————————————————————————————————————————————————————————————— scene 2 ——
function SceneCompare() {
  const p = useLoop(3200, 900);
  const uX = p.interpolate({ inputRange: UNT.map((q) => q.p), outputRange: UNT.map((q) => q.x), extrapolate: 'clamp' });
  const uY = p.interpolate({ inputRange: UNT.map((q) => q.p), outputRange: UNT.map((q) => q.y), extrapolate: 'clamp' });
  const uO = p.interpolate({ inputRange: [0, 0.04, P_UNT, Math.min(P_UNT + 0.07, 1), 1], outputRange: [0, 1, 1, 0, 0] });
  const tX = p.interpolate({ inputRange: TRE.map((q) => q.p), outputRange: TRE.map((q) => q.x), extrapolate: 'clamp' });
  const tY = p.interpolate({ inputRange: TRE.map((q) => q.p), outputRange: TRE.map((q) => q.y), extrapolate: 'clamp' });
  const tO = p.interpolate({ inputRange: [0, 0.04, P_TRE, P_TRE + 0.07, 1], outputRange: [0, 1, 1, 0, 0] });

  return (
    <View style={styles.viz}>
      <Svg width={VIZ_W} height={VIZ_H} viewBox={`0 0 ${VIZ_W} ${VIZ_H}`}>
        <Line x1={PX} y1={PY} x2={PX} y2={PB} stroke={colors.steelBorder} strokeWidth={1} />
        <Line x1={PX} y1={PB} x2={PX + PW} y2={PB} stroke={colors.steelBorder} strokeWidth={1} />
        <Line x1={PX} y1={dbY(-30)} x2={PX + PW} y2={dbY(-30)} stroke={colors.hairline} strokeWidth={1} strokeDasharray='3,5' />
        {/* Identity hues for the A/B: orange = untreated, green = treated */}
        <Polyline points={LINE_UNT} fill='none' stroke={colors.orange} strokeWidth={2} strokeLinecap='round' strokeLinejoin='round' />
        <Polyline points={LINE_TRE} fill='none' stroke={colors.green} strokeWidth={2} strokeLinecap='round' strokeLinejoin='round' />
        {/* Per-curve callouts */}
        <Line x1={C2_TRE.x + 22} y1={dbY(-37) - 6} x2={C2_TRE.x + 4} y2={C2_TRE.y} stroke={LEADER} strokeWidth={1} />
        <SvgText x={C2_TRE.x + 26} y={dbY(-37)} textAnchor='start' fontFamily={fonts.oswaldSemiBold} fontSize={10} letterSpacing={1} fill={colors.green}>TREATED</SvgText>
        <Line x1={C2_UNT.x + 12} y1={dbY(-19) + 4} x2={C2_UNT.x + 2} y2={C2_UNT.y - 6} stroke={LEADER} strokeWidth={1} />
        <SvgText x={C2_UNT.x + 16} y={dbY(-19)} textAnchor='start' fontFamily={fonts.oswaldSemiBold} fontSize={10} letterSpacing={1} fill={colors.orange}>UNTREATED</SvgText>
        {/* Where each room actually reaches −60 dB, marked on the time axis */}
        <Line x1={sx2(RT_TREATED)} y1={PB} x2={sx2(RT_TREATED)} y2={PB + 6} stroke={colors.green} strokeWidth={1.5} />
        <SvgText x={sx2(RT_TREATED)} y={TICK_Y} textAnchor='middle' fontFamily={fonts.mono} fontSize={12} fill={colors.green}>0.45 s</SvgText>
        <Line x1={sx2(RT_UNTREATED)} y1={PB} x2={sx2(RT_UNTREATED)} y2={PB + 6} stroke={colors.orange} strokeWidth={1.5} />
        <SvgText x={sx2(RT_UNTREATED)} y={TICK_Y} textAnchor='middle' fontFamily={fonts.mono} fontSize={12} fill={colors.orange}>1.8 s</SvgText>
        {/* dB + time axes */}
        <SvgText x={PX - 4} y={PY + 4} textAnchor='end' fontFamily={fonts.mono} fontSize={12} fill={colors.textMuted}>0</SvgText>
        <SvgText x={PX - 4} y={dbY(-30) + 4} textAnchor='end' fontFamily={fonts.mono} fontSize={12} fill={colors.textMuted}>-30</SvgText>
        <SvgText x={PX - 4} y={PB + 4} textAnchor='end' fontFamily={fonts.mono} fontSize={12} fill={colors.textMuted}>-60</SvgText>
        <SvgText x={sx2(0)} y={TICK_Y} textAnchor='middle' fontFamily={fonts.mono} fontSize={12} fill={colors.textMuted}>0</SvgText>
        <SvgText x={sx2(1.0)} y={TICK_Y} textAnchor='middle' fontFamily={fonts.mono} fontSize={12} fill={colors.textMuted}>1.0</SvgText>
      </Svg>
      <Dot x={uX} y={uY} opacity={uO} color={colors.orange} />
      <Dot x={tX} y={tY} opacity={tO} color={colors.greenBright} />
    </View>
  );
}

// ————————————————————————————————————————————————————————————— scene 3 ——
function SceneNoise() {
  const p = useLoop(3600, 900);
  const pulse = usePulse();
  const dotX = p.interpolate({ inputRange: T, outputRange: X3 });
  const dotY = p.interpolate({ inputRange: T, outputRange: Y3 });
  // The marker fades away as the decay disappears into the noise.
  const dotO = p.interpolate({ inputRange: [0, 0.04, 0.5, 0.68, 1], outputRange: [0, 1, 1, 0.15, 0] });
  const bandO = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] });

  return (
    <View style={styles.viz}>
      <Svg width={VIZ_W} height={VIZ_H} viewBox={`0 0 ${VIZ_W} ${VIZ_H}`}>
        <DecayRampDefs />
        <Line x1={PX} y1={PY} x2={PX} y2={PB} stroke={colors.steelBorder} strokeWidth={1} />
        <Line x1={PX} y1={PB} x2={PX + PW3} y2={PB} stroke={colors.steelBorder} strokeWidth={1} />
        {/* Usable-range limits: −5 dB top, and 10 dB above the noise floor */}
        <Line x1={PX} y1={Y_M5} x2={PX + PW3} y2={Y_M5} stroke={colors.hairline} strokeWidth={1} strokeDasharray='3,5' />
        <Line x1={PX} y1={Y_M28} x2={PX + PW3} y2={Y_M28} stroke={colors.hairline} strokeWidth={1} strokeDasharray='3,5' />
        <Polyline points={LINE3} fill='none' stroke='url(#rt60ramp)' strokeWidth={2.5} strokeLinecap='round' strokeLinejoin='round' />
        {/* Bracket: the only decay range usable for a fit */}
        <Path
          d={`M ${BRACKET_X - 6} ${Y_M5} L ${BRACKET_X} ${Y_M5} L ${BRACKET_X} ${Y_M28} L ${BRACKET_X - 6} ${Y_M28}`}
          fill='none'
          stroke={colors.amber}
          strokeWidth={1.5}
        />
        <SvgText x={BRACKET_X + 5} y={(Y_M5 + Y_M28) / 2 - 8} textAnchor='start' fontFamily={fonts.oswaldSemiBold} fontSize={9} letterSpacing={0.8} fill={colors.amber}>USABLE</SvgText>
        <SvgText x={BRACKET_X + 5} y={(Y_M5 + Y_M28) / 2 + 6} textAnchor='start' fontFamily={fonts.mono} fontSize={12} fill={colors.amber}>23</SvgText>
        <SvgText x={BRACKET_X + 5} y={(Y_M5 + Y_M28) / 2 + 20} textAnchor='start' fontFamily={fonts.mono} fontSize={12} fill={colors.amber}>dB</SvgText>
        {/* dB + time axes */}
        <SvgText x={PX - 4} y={Y_M5 + 4} textAnchor='end' fontFamily={fonts.mono} fontSize={12} fill={colors.textMuted}>-5</SvgText>
        <SvgText x={PX - 4} y={Y_M28 + 4} textAnchor='end' fontFamily={fonts.mono} fontSize={12} fill={colors.textMuted}>-28</SvgText>
        <SvgText x={PX - 4} y={PB + 4} textAnchor='end' fontFamily={fonts.mono} fontSize={12} fill={colors.textMuted}>-60</SvgText>
        <SvgText x={sx3(0)} y={TICK_Y} textAnchor='middle' fontFamily={fonts.mono} fontSize={12} fill={colors.textMuted}>0</SvgText>
        <SvgText x={sx3(0.5)} y={TICK_Y} textAnchor='middle' fontFamily={fonts.mono} fontSize={12} fill={colors.textMuted}>0.5</SvgText>
        <SvgText x={sx3(1.0)} y={TICK_Y} textAnchor='middle' fontFamily={fonts.mono} fontSize={12} fill={colors.textMuted}>1.0 s</SvgText>
      </Svg>
      <Animated.View style={[styles.noiseBand, { opacity: bandO }]} pointerEvents='none'>
        <Text style={styles.noiseLabel}>NOISE FLOOR  −38 dB</Text>
      </Animated.View>
      <Animated.View style={[styles.rejectChip, { opacity: bandO }]} pointerEvents='none'>
        <Text style={styles.rejectChipText}>✕ FIT REJECTED</Text>
      </Animated.View>
      <Dot x={dotX} y={dotY} opacity={dotO} color={colors.amber} />
    </View>
  );
}

// ————————————————————————————————————————————————— per-scene detail strips ——
/** Scene 1 — the fit-window ladder: one slope, three standard read methods. */
function StripFitWindows() {
  return (
    <View style={styles.strip}>
      <Text style={styles.stripTitle}>THE FIT WINDOWS</Text>
      <View style={styles.stripRow}>
        <Text style={[styles.methodTag, { color: colors.amber, borderColor: 'rgba(255,198,77,0.5)' }]}>T30</Text>
        <Text style={styles.stripBody}>
          <Text style={styles.stripMono}>−5 → −35 dB</Text>, time ×2 — the fit shown on this plot
        </Text>
      </View>
      <View style={styles.stripRow}>
        <Text style={styles.methodTag}>T20</Text>
        <Text style={styles.stripBody}>
          <Text style={styles.stripMono}>−5 → −25 dB</Text>, time ×3 — for noisier rooms
        </Text>
      </View>
      <View style={styles.stripRow}>
        <Text style={styles.methodTag}>EDT</Text>
        <Text style={styles.stripBody}>
          first <Text style={styles.stripMono}>10 dB</Text> only — tracks perceived liveness
        </Text>
      </View>
    </View>
  );
}

/** Scene 2 — connect each RT60 to what a member would hear on the job. */
function StripHear() {
  return (
    <View style={styles.strip}>
      <Text style={styles.stripTitle}>WHAT YOU WOULD HEAR</Text>
      <View style={styles.stripRow}>
        <View style={[styles.swatch, { backgroundColor: colors.orange }]} />
        <Text style={styles.stripBody}>
          <Text style={[styles.stripTag, { color: colors.orange }]}>UNTREATED · 1.8 s</Text> — a clap hangs in
          the air; each word smears into the next.
        </Text>
      </View>
      <View style={styles.stripRow}>
        <View style={[styles.swatch, { backgroundColor: colors.green }]} />
        <Text style={styles.stripBody}>
          <Text style={[styles.stripTag, { color: colors.green }]}>TREATED · 0.45 s</Text> — the tail snaps
          shut; speech and mixes stay clear.
        </Text>
      </View>
    </View>
  );
}

/** Scene 3 — the arithmetic that forces an honest rejection. */
function StripReject() {
  return (
    <View style={styles.strip}>
      <Text style={styles.stripTitle}>WHY THE RESULT IS REJECTED</Text>
      <View style={styles.ledgerRow}>
        <Text style={styles.ledgerLabel}>Usable span (−5 dB down to floor + 10 dB)</Text>
        <Text style={[styles.ledgerValue, { color: colors.amber }]}>23 dB</Text>
      </View>
      <View style={styles.ledgerRow}>
        <Text style={styles.ledgerLabel}>A T30 fit needs</Text>
        <Text style={styles.ledgerValue}>30 dB</Text>
      </View>
      <View style={styles.ledgerRow}>
        <Text style={styles.ledgerLabel}>Verdict</Text>
        <Text style={[styles.ledgerValue, { color: SALMON }]}>REJECTED</Text>
      </View>
    </View>
  );
}

// ————————————————————————————————————————————————————————————— scenes ——
const SCENES = [
  {
    chip: 'DECAY CURVE',
    title: 'THE DECAY CURVE',
    watch: 'the amber fit crossing −60 dB at 1.0 s — that crossing is the RT60',
    body:
      'The source stops, and the room’s response is integrated into this smooth Schroeder decay — level in dB falling against time in seconds, the trace cooling from loud to silent-blue as it dies. The tool fits a straight line to the −5 to −35 dB span (a T30 fit), then rides that slope down to −60 dB. RT60 is read off the fitted slope — about 1.0 s here — never off the raw wiggles.',
    note:
      'FIELD NOTE: check the method label before quoting a number — a T30 extrapolation and a true 60 dB measurement are not the same claim.',
  },
  {
    chip: 'TREATED A/B',
    title: 'TREATED vs UNTREATED',
    watch: 'both dots leave together — the green room is silent while the orange one still rings',
    body:
      'Same source level, two rooms, one axis. The untreated room takes 1.8 s to fall 60 dB: the classic muddy tail that buries consonants and smears a mix. Broadband absorption pulls the treated room down to 0.45 s, so the tail collapses quickly and the room stays controlled. Before-vs-after comparison like this is the measurement’s real job.',
    note:
      'FIELD NOTE: decay differs per band — a room can be dry at 4 kHz and still boom at 125 Hz, so quote RT60 at stated octave bands.',
  },
  {
    chip: 'NOISE FLOOR',
    title: 'NOISE FLOOR LIMIT',
    watch: 'the decay flattening into the red band — everything after that is noise, not the room',
    body:
      'This room’s background noise sits at −38 dB, and the decay vanishes into it — the flat “tail” below the band is noise, not reverberation. A valid T30 fit needs the −5 to −35 dB span with the floor at least 10 dB below the fit, so only the bracketed 23 dB is usable here: 7 dB short. An honest tool rejects this capture instead of fitting a slope to noise.',
    note:
      'FIELD NOTE: the remedy is signal-to-noise — a louder, repeatable source (a sweep or balloon pop, not a hand clap) or a quieter room. Then measure again.',
  },
] as const;

// —————————————————————————————————————————————————————————— component ——
export function Rt60Demo() {
  const [scene, setScene] = useState(0);
  const active = SCENES[scene] ?? SCENES[0];

  return (
    <View style={styles.panel}>
      <View style={styles.chipRow} accessibilityRole='tablist'>
        {SCENES.map((s, i) => {
          const on = i === scene;
          return (
            <Pressable
              key={s.chip}
              onPress={() => setScene(i)}
              accessibilityRole='tab'
              accessibilityLabel={`Show scene: ${s.title}`}
              accessibilityState={{ selected: on }}
              aria-selected={on}
              hitSlop={4}
              style={[styles.chip, on && styles.chipOn]}
            >
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{s.chip}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.sceneTitle}>{active.title}</Text>
      <View style={styles.vizFrame}>
        {scene === 0 ? <SceneDecay /> : scene === 1 ? <SceneCompare /> : <SceneNoise />}
      </View>
      {scene === 0 ? <StripFitWindows /> : scene === 1 ? <StripHear /> : <StripReject />}
      <View style={styles.captionBlock}>
        <Text style={styles.watchFor}>
          WATCH FOR — <Text style={styles.watchForBody}>{active.watch}</Text>
        </Text>
        <Text style={styles.caption}>{active.body}</Text>
        <Text style={styles.fieldNote}>{active.note}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    padding: 10,
    gap: 10,
  },
  chipRow: { flexDirection: 'row', gap: 6 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.steelBorder,
    backgroundColor: '#141414',
  },
  chipOn: { borderColor: colors.amber, backgroundColor: 'rgba(255,180,0,.10)' },
  chipText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.textMuted },
  chipTextOn: { color: colors.amber },
  sceneTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.8, color: colors.amberLabel },
  // Recessed glass instrumentation frame (shared demo contract).
  vizFrame: {
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,.07)',
    backgroundColor: '#0b0c0e',
  },
  viz: { width: VIZ_W, height: VIZ_H },
  dot: { position: 'absolute', left: -5, top: -5, width: 10, height: 10, borderRadius: 5 },
  rtChip: {
    position: 'absolute',
    right: 4,
    top: 106,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(255,198,77,0.55)',
    backgroundColor: 'rgba(255,180,0,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  rtChipText: { fontFamily: fonts.mono, fontSize: 12, color: colors.amber },
  rejectChip: {
    position: 'absolute',
    left: PX + 84,
    top: 38,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(255,141,122,0.55)',
    backgroundColor: 'rgba(255,75,58,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  rejectChipText: { fontFamily: fonts.mono, fontSize: 12, color: SALMON },
  noiseBand: {
    position: 'absolute',
    left: PX,
    top: BAND_Y,
    width: PW3,
    height: PB - BAND_Y,
    backgroundColor: 'rgba(255,75,58,0.10)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,75,58,0.55)',
    padding: 6,
  },
  noiseLabel: { fontFamily: fonts.mono, fontSize: 12, color: 'rgba(255,150,140,0.95)' },
  // Per-scene detail strip.
  strip: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,.06)',
    backgroundColor: '#101013',
    padding: 10,
    gap: 6,
  },
  stripTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.6, color: colors.textSub },
  stripRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  methodTag: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.textSub,
    borderWidth: 1,
    borderColor: colors.steelBorder,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  stripBody: { flex: 1, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
  stripMono: { fontFamily: fonts.mono, fontSize: 12, color: colors.textSecondary },
  stripTag: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 0.6 },
  swatch: { width: 10, height: 3, borderRadius: 1.5 },
  ledgerRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 },
  ledgerLabel: { flexShrink: 1, fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.textSub },
  ledgerValue: { fontFamily: fonts.mono, fontSize: 13, color: colors.textSecondary },
  // Structured caption.
  captionBlock: { gap: 5 },
  watchFor: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.6, color: colors.amber },
  watchForBody: { fontFamily: fonts.barlowMedium, fontSize: 12.5, letterSpacing: 0.2, color: colors.textSecondary },
  caption: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSecondary },
  fieldNote: { fontFamily: fonts.barlowRegular, fontStyle: 'italic', fontSize: 12.5, lineHeight: 17, color: colors.textMuted },
});
