/**
 * Rt60Demo — RT60 (reverberation time) TRAINING DEMO (spec of record
 * docs/APE_AUDIO_TOOLS_SPEC_2026_07_23.md §13; demo-mode contract §4 and
 * integrity rules §5 / measurement-tools §1.7 — 2026-07-23).
 *
 * Visual/animated teaching panel only — no audio, no live values, no meters
 * (LedMeter is real-values-only and is not used here). The hosting
 * ToolDemoScreen renders the permanent "TRAINING DEMO" badge.
 *
 * Three scenes:
 *  1. THE DECAY CURVE — Schroeder-style decay, T30 fit (-5..-35 dB) and the
 *     RT60 extrapolation to -60 dB.
 *  2. TREATED vs UNTREATED — two decays overlaid (RT60 ~1.8 s vs ~0.45 s).
 *  3. NOISE FLOOR LIMIT — the decay sinking into a noise floor; the usable
 *     decay range is bracketed and is insufficient for a valid fit.
 *
 * All curves are fixed precomputed arrays (no Math.random). Animation is RN
 * core Animated driving container transforms/opacity only (native driver);
 * SVG itself is static geometry.
 */
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Polyline, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../../theme/tokens';

// ————————————————————————————————————————————————————————— plot geometry ——
const VIZ_W = 288;
const VIZ_H = 184;
const PX = 34; // plot left (room for dB labels)
const PY = 10; // plot top = 0 dB
const PH = 148; // plot height = 60 dB span
const PB = PY + PH; // plot bottom = -60 dB
const PW = 244; // plot width, scenes 1–2
const PW3 = 200; // plot width, scene 3 (right margin for the range bracket)

const dbY = (db: number) => PY + (-db / 60) * PH;
const r1 = (n: number) => Math.round(n * 10) / 10;

const STEPS = 25;
const T = Array.from({ length: STEPS }, (_, i) => i / (STEPS - 1));

// —— Scene 1: Schroeder decay + T30 fit → RT60 extrapolation ———————————————
// Slightly concave decay (early reflections die faster): dB(t) = -64t + 6t².
const decay1 = (t: number) => -64 * t + 6 * t * t;
const X1 = T.map((t) => r1(PX + t * PW));
const Y1 = T.map((t) => r1(dbY(decay1(t))));
const LINE1 = X1.map((x, i) => `${x},${Y1[i]}`).join(' ');
// Invert decay1 for the fit anchors: 6t² - 64t - dB = 0.
const tAt1 = (db: number) => (64 - Math.sqrt(4096 + 24 * db)) / 12;
const T5 = tAt1(-5);
const T35 = tAt1(-35);
const FIT_SLOPE = -30 / (T35 - T5); // dB per unit t over the -5..-35 span
const T60 = T5 - 55 / FIT_SLOPE; // where the fitted line crosses -60 dB
const FIT = {
  x5: r1(PX + T5 * PW),
  y5: r1(dbY(-5)),
  x35: r1(PX + T35 * PW),
  y35: r1(dbY(-35)),
  x60: r1(PX + T60 * PW),
  y60: r1(dbY(-60)),
};

// —— Scene 2: treated vs untreated ————————————————————————————————————————
const SEC2 = 2.0; // x-axis spans 0..2.0 s
const RT_UNTREATED = 1.8;
const RT_TREATED = 0.45;
const N2 = 15;
const curve2 = (rt: number) =>
  Array.from({ length: N2 }, (_, i) => {
    const sec = (rt * i) / (N2 - 1);
    return {
      p: sec / SEC2, // loop-progress position of this sample
      x: r1(PX + (sec / SEC2) * PW),
      y: r1(dbY(-60 * Math.pow(sec / rt, 1.06))),
    };
  });
const UNT = curve2(RT_UNTREATED);
const TRE = curve2(RT_TREATED);
const LINE_UNT = UNT.map((q) => `${q.x},${q.y}`).join(' ');
const LINE_TRE = TRE.map((q) => `${q.x},${q.y}`).join(' ');
const P_UNT = RT_UNTREATED / SEC2; // 0.9 — untreated dot lands here
const P_TRE = RT_TREATED / SEC2; // 0.225 — treated dot lands here

// —— Scene 3: noise floor limit ———————————————————————————————————————————
const FLOOR_DB = -38;
// Fixed hand-seeded jitter for the noise floor (spec forbids Math.random).
const WIGGLE = [0.9, -0.7, 1.2, -0.5, 0.4, -1.1, 0.8, -0.9, 1.0, -0.4, 0.6, -1.2];
const decay3 = (t: number, i: number) =>
  Math.max(-70 * t, FLOOR_DB + WIGGLE[i % WIGGLE.length] * 0.9);
const X3 = T.map((t) => r1(PX + t * PW3));
const Y3 = T.map((t, i) => r1(dbY(decay3(t, i))));
const LINE3 = X3.map((x, i) => `${x},${Y3[i]}`).join(' ');
const BAND_Y = r1(dbY(FLOOR_DB));
const Y_M5 = r1(dbY(-5));
const Y_M28 = r1(dbY(-28)); // valid fit bottom = 10 dB above the -38 dB floor
const BRACKET_X = PX + PW3 + 14;

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

// ————————————————————————————————————————————————————————————— scene 1 ——
function SceneDecay() {
  const p = useLoop(3200, 700);
  const dotX = p.interpolate({ inputRange: T, outputRange: X1 });
  const dotY = p.interpolate({ inputRange: T, outputRange: Y1 });
  const dotO = p.interpolate({ inputRange: [0, 0.04, 0.93, 1], outputRange: [0, 1, 1, 0] });
  const tagO = p.interpolate({ inputRange: [0, 0.76, 0.9, 1], outputRange: [0, 0, 1, 1] });

  return (
    <View style={styles.viz}>
      <Svg width={VIZ_W} height={VIZ_H} viewBox={`0 0 ${VIZ_W} ${VIZ_H}`}>
        <Line x1={PX} y1={PY} x2={PX} y2={PB} stroke={colors.steelBorder} strokeWidth={1} />
        <Line x1={PX} y1={PB} x2={PX + PW} y2={PB} stroke={colors.steelBorder} strokeWidth={1} />
        {/* Fit-range gridlines (-5 / -35 dB) and the -60 dB target */}
        <Line x1={PX} y1={FIT.y5} x2={PX + PW} y2={FIT.y5} stroke='rgba(255,198,77,0.25)' strokeWidth={1} strokeDasharray='3,5' />
        <Line x1={PX} y1={FIT.y35} x2={PX + PW} y2={FIT.y35} stroke='rgba(255,198,77,0.25)' strokeWidth={1} strokeDasharray='3,5' />
        <Line x1={PX} y1={FIT.y60} x2={FIT.x60} y2={FIT.y60} stroke={colors.hairline} strokeWidth={1} strokeDasharray='3,5' />
        {/* Integrated (Schroeder-style) decay curve */}
        <Polyline points={LINE1} fill='none' stroke={colors.cyan} strokeWidth={2} strokeLinecap='round' strokeLinejoin='round' />
        {/* Fitted T30 line, then its dashed extrapolation to -60 dB */}
        <Line x1={FIT.x5} y1={FIT.y5} x2={FIT.x35} y2={FIT.y35} stroke={colors.amber} strokeWidth={2} strokeLinecap='round' />
        <Line x1={FIT.x35} y1={FIT.y35} x2={FIT.x60} y2={FIT.y60} stroke={colors.amber} strokeWidth={1.5} strokeDasharray='4,5' />
        <Circle cx={FIT.x60} cy={FIT.y60} r={3.5} fill={colors.amber} />
        <SvgText x={PX - 4} y={FIT.y5 + 4} textAnchor='end' fontFamily={fonts.mono} fontSize={12} fill={colors.textMuted}>-5</SvgText>
        <SvgText x={PX - 4} y={FIT.y35 + 4} textAnchor='end' fontFamily={fonts.mono} fontSize={12} fill={colors.textMuted}>-35</SvgText>
        <SvgText x={PX - 4} y={FIT.y60 + 4} textAnchor='end' fontFamily={fonts.mono} fontSize={12} fill={colors.textMuted}>-60</SvgText>
        <SvgText x={PX + PW / 2} y={VIZ_H - 8} textAnchor='middle' fontFamily={fonts.oswaldSemiBold} fontSize={12} letterSpacing={2} fill={colors.textMuted}>TIME</SvgText>
      </Svg>
      <Dot x={dotX} y={dotY} opacity={dotO} color={colors.cyanBright} />
      <Animated.Text style={[styles.rtTag, { opacity: tagO }]}>RT60 ≈ 1.0 s</Animated.Text>
    </View>
  );
}

// ————————————————————————————————————————————————————————————— scene 2 ——
function SceneCompare() {
  const p = useLoop(2800, 700);
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
        <Line x1={PX} y1={dbY(-60)} x2={PX + PW} y2={dbY(-60)} stroke={colors.hairline} strokeWidth={1} strokeDasharray='3,5' />
        <Polyline points={LINE_UNT} fill='none' stroke={colors.orange} strokeWidth={2} strokeLinecap='round' strokeLinejoin='round' />
        <Polyline points={LINE_TRE} fill='none' stroke={colors.green} strokeWidth={2} strokeLinecap='round' strokeLinejoin='round' />
        <SvgText x={PX - 4} y={dbY(-60) + 4} textAnchor='end' fontFamily={fonts.mono} fontSize={12} fill={colors.textMuted}>-60</SvgText>
        <SvgText x={PX} y={VIZ_H - 8} textAnchor='middle' fontFamily={fonts.mono} fontSize={12} fill={colors.textMuted}>0</SvgText>
        <SvgText x={PX + PW / 2} y={VIZ_H - 8} textAnchor='middle' fontFamily={fonts.mono} fontSize={12} fill={colors.textMuted}>1.0</SvgText>
        <SvgText x={PX + PW} y={VIZ_H - 8} textAnchor='end' fontFamily={fonts.mono} fontSize={12} fill={colors.textMuted}>2.0 s</SvgText>
      </Svg>
      <Dot x={uX} y={uY} opacity={uO} color={colors.orange} />
      <Dot x={tX} y={tY} opacity={tO} color={colors.greenBright} />
      <View style={styles.legend} pointerEvents='none'>
        <View style={styles.legendRow}>
          <View style={[styles.swatch, { backgroundColor: colors.orange }]} />
          <Text style={[styles.legendLabel, { color: colors.orange }]}>UNTREATED</Text>
          <Text style={styles.legendValue}>1.8 s</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.swatch, { backgroundColor: colors.green }]} />
          <Text style={[styles.legendLabel, { color: colors.green }]}>TREATED</Text>
          <Text style={styles.legendValue}>0.45 s</Text>
        </View>
      </View>
    </View>
  );
}

// ————————————————————————————————————————————————————————————— scene 3 ——
function SceneNoise() {
  const p = useLoop(3200, 700);
  const pulse = usePulse();
  const dotX = p.interpolate({ inputRange: T, outputRange: X3 });
  const dotY = p.interpolate({ inputRange: T, outputRange: Y3 });
  // The marker fades away as the decay disappears into the noise.
  const dotO = p.interpolate({ inputRange: [0, 0.04, 0.5, 0.68, 1], outputRange: [0, 1, 1, 0.15, 0] });
  const bandO = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] });

  return (
    <View style={styles.viz}>
      <Svg width={VIZ_W} height={VIZ_H} viewBox={`0 0 ${VIZ_W} ${VIZ_H}`}>
        <Line x1={PX} y1={PY} x2={PX} y2={PB} stroke={colors.steelBorder} strokeWidth={1} />
        <Line x1={PX} y1={PB} x2={PX + PW3} y2={PB} stroke={colors.steelBorder} strokeWidth={1} />
        {/* Usable-range limits: -5 dB top, and 10 dB above the noise floor */}
        <Line x1={PX} y1={Y_M5} x2={PX + PW3} y2={Y_M5} stroke={colors.hairline} strokeWidth={1} strokeDasharray='3,5' />
        <Line x1={PX} y1={Y_M28} x2={PX + PW3} y2={Y_M28} stroke={colors.hairline} strokeWidth={1} strokeDasharray='3,5' />
        <Polyline points={LINE3} fill='none' stroke={colors.cyan} strokeWidth={2} strokeLinecap='round' strokeLinejoin='round' />
        {/* Bracket: the only decay range usable for a fit */}
        <Path
          d={`M ${BRACKET_X - 6} ${Y_M5} L ${BRACKET_X} ${Y_M5} L ${BRACKET_X} ${Y_M28} L ${BRACKET_X - 6} ${Y_M28}`}
          fill='none'
          stroke={colors.amber}
          strokeWidth={1.5}
        />
        <SvgText x={BRACKET_X + 8} y={(Y_M5 + Y_M28) / 2 - 2} textAnchor='start' fontFamily={fonts.mono} fontSize={12} fill={colors.amber}>23</SvgText>
        <SvgText x={BRACKET_X + 8} y={(Y_M5 + Y_M28) / 2 + 12} textAnchor='start' fontFamily={fonts.mono} fontSize={12} fill={colors.amber}>dB</SvgText>
        <SvgText x={PX - 4} y={Y_M5 + 4} textAnchor='end' fontFamily={fonts.mono} fontSize={12} fill={colors.textMuted}>-5</SvgText>
        <SvgText x={PX - 4} y={Y_M28 + 4} textAnchor='end' fontFamily={fonts.mono} fontSize={12} fill={colors.textMuted}>-28</SvgText>
        <SvgText x={PX - 4} y={PB + 4} textAnchor='end' fontFamily={fonts.mono} fontSize={12} fill={colors.textMuted}>-60</SvgText>
      </Svg>
      <Animated.View style={[styles.noiseBand, { opacity: bandO }]} pointerEvents='none'>
        <Text style={styles.noiseLabel}>NOISE FLOOR</Text>
      </Animated.View>
      <Dot x={dotX} y={dotY} opacity={dotO} color={colors.cyanBright} />
    </View>
  );
}

// ————————————————————————————————————————————————————————————— scenes ——
const SCENES = [
  {
    chip: 'DECAY CURVE',
    title: 'THE DECAY CURVE',
    caption:
      'The impulse response is integrated into a smooth decay curve. A line fitted to the -5 to -35 dB span (T30) is extrapolated down to -60 dB — that extrapolated time is the RT60, about 1.0 s in this example.',
  },
  {
    chip: 'TREATED A/B',
    title: 'TREATED vs UNTREATED',
    caption:
      'Two example rooms from the same source level. The untreated room rings out near RT60 1.8 s, while broadband absorption brings the treated room down to about 0.45 s — a faster decay keeps speech and mixes clear.',
  },
  {
    chip: 'NOISE FLOOR',
    title: 'NOISE FLOOR LIMIT',
    caption:
      'Here the decay sinks into a -38 dB noise floor — everything below it is just noise. A valid fit needs the -5 to -35 dB span plus 10 dB of headroom above the floor; with only ~23 dB usable, the RT60 result is invalid.',
  },
] as const;

// —————————————————————————————————————————————————————————— component ——
export function Rt60Demo() {
  const [scene, setScene] = useState(0);
  const active = SCENES[scene] ?? SCENES[0];

  return (
    <View style={styles.panel}>
      <View style={styles.chipRow}>
        {SCENES.map((s, i) => {
          const on = i === scene;
          return (
            <Pressable
              key={s.chip}
              onPress={() => setScene(i)}
              accessibilityRole='button'
              accessibilityLabel={`Show scene: ${s.title}`}
              accessibilityState={{ selected: on }}
              hitSlop={4}
              style={[styles.chip, on && styles.chipOn]}
            >
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{s.chip}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.sceneTitle}>{active.title}</Text>
      <View style={styles.vizRow}>
        {scene === 0 ? <SceneDecay /> : scene === 1 ? <SceneCompare /> : <SceneNoise />}
      </View>
      <Text style={styles.caption}>{active.caption}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    height: 360,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    padding: 12,
    gap: 8,
  },
  chipRow: { flexDirection: 'row', gap: 6 },
  chip: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#18181c',
  },
  chipOn: { borderColor: 'rgba(255,198,77,0.55)', backgroundColor: 'rgba(255,198,77,0.10)' },
  chipText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.1, color: colors.textSub },
  chipTextOn: { color: colors.amber },
  sceneTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.8, color: colors.amberLabel },
  vizRow: { alignItems: 'center' },
  viz: { width: VIZ_W, height: VIZ_H },
  dot: { position: 'absolute', left: -5, top: -5, width: 10, height: 10, borderRadius: 5 },
  rtTag: { position: 'absolute', right: 2, top: FIT.y60 - 26, fontFamily: fonts.mono, fontSize: 12, color: colors.amber },
  legend: { position: 'absolute', top: 6, right: 4, alignItems: 'flex-end', gap: 3 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  swatch: { width: 10, height: 2, borderRadius: 1 },
  legendLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1 },
  legendValue: { fontFamily: fonts.mono, fontSize: 12, color: colors.textPrimary },
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
  caption: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSecondary },
});
