/**
 * RtaDemo — animated training demo for the RTA (Real-Time Analyzer) tool.
 * Spec of record: docs/APE_AUDIO_TOOLS_SPEC_2026_07_23.md §10 (RTA) + §4 Demo
 * mode; user ruling 2026-07-23: demos are VISUAL/ANIMATED ONLY (no audio path).
 * Design pass 2026-09-13 (shared demo brief): full-band axis, in-SVG callouts,
 * structured captions, recessed instrument panel, rack-key scene tabs.
 *
 * Three scenes, switched via rack-key tabs:
 *  1. PINK VS WHITE — 28 true third-octave bands (31.5 Hz → 16 kHz) morph
 *     between pink's flat read and white's +3 dB/octave staircase (+1 dB per
 *     third-octave band = +27 dB across the shown span at the fixed
 *     10 dB/div scale).
 *  2. SMOOTHING — one fixed spectrum crossfades between a jagged 1/24-octave
 *     feel and a smoothed 1/3-octave feel (auto-looping): same data, two
 *     drawings.
 *  3. MIC POSITION — the same room at two mic spots: low bands swing many dB,
 *     highs hold. Bars use the app amplitude ramp (levelColor) via a shared
 *     base→tip gradient (owner bar ruling 2026-08-16). A room glyph shows the
 *     mic moving.
 *
 * Integrity (spec §5 + measurement-tools §1.7): the hosting screen shows the
 * permanent "TRAINING DEMO — NOT A LIVE MEASUREMENT" badge; nothing here is a
 * live reading, no LedMeter, no simulated meter chrome. All wobble comes from
 * fixed seeded arrays — no Math.random in render. RN core Animated only:
 * SVG geometry morphs run non-native (animated Rect props, the established
 * tooldemos idiom); callout/layer crossfades and the mic-dot move use
 * native-driver transforms/opacity on Views.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Polyline, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { levelColor } from '../../features/tools/levelColor';
import { colors, fonts } from '../../theme/tokens';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

/* ------------------------------------------------------------------ */
/* Fixed data (module scope, deterministic — spec §4: no Math.random) */
/* ------------------------------------------------------------------ */

const CHART_W = 320;
const CHART_H = 206; // plot + in-SVG frequency labels
const PLOT_L = 8;
const PLOT_R = 312;
const TOP_Y = 16; // full scale (level fraction 1.0)
const BASE_Y = 184; // silence (level fraction 0)
/** Fixed scale: 4 px per dB → the 40 px grid pitch is 10 dB per division. */
const PX_PER_DB = 4;
const GRID_YS = [24, 64, 104, 144];

/** 28 true third-octave bands, 31.5 Hz → 16 kHz (9 octaves + 1 band). */
const BAR_COUNT = 28;
const BAND_PITCH = (PLOT_R - PLOT_L) / BAR_COUNT;
const BAR_W = 8;
const bandX = (i: number) => PLOT_L + i * BAND_PITCH + (BAND_PITCH - BAR_W) / 2;
const bandCenter = (i: number) => PLOT_L + (i + 0.5) * BAND_PITCH;

/** Octave-band axis labels (band index → text). ISO third-octave centres:
 *  every 3rd band from 31.5 Hz doubles the frequency. */
const OCTAVE_TICKS: ReadonlyArray<{ i: number; label: string; anchor?: 'start' }> = [
  { i: 0, label: '31 Hz', anchor: 'start' },
  { i: 3, label: '63' },
  { i: 6, label: '125' },
  { i: 9, label: '250' },
  { i: 12, label: '500' },
  { i: 15, label: '1k' },
  { i: 18, label: '2k' },
  { i: 21, label: '4k' },
  { i: 24, label: '8k' },
  { i: 27, label: '16k' },
];

/** Pink noise on a third-octave RTA: flat (tiny fixed variation, ±0.5 dB). */
const PINK_HEIGHTS: number[] = [
  94, 92, 95, 93, 94, 92, 93,
  95, 94, 93, 92, 94, 93, 94,
  92, 95, 93, 94, 92, 93, 95,
  94, 92, 93, 94, 92, 94, 93,
];

/** White noise: equal energy per hertz → +1 dB per third-octave band
 *  (= +3 dB/octave), +27 dB across 31.5 Hz → 16 kHz at 4 px/dB. */
const WHITE_HEIGHTS: number[] = Array.from({ length: BAR_COUNT }, (_, i) => 34 + i * PX_PER_DB);

/** Mic position A vs B — low bands (≤250 Hz) swing up to ~12 dB as room modes
 *  and boundary reflections re-sum; the top octaves converge (≤0.5 dB). */
const MIC_A_HEIGHTS: number[] = [
  92, 68, 104, 56, 110, 64, 98,
  76, 88, 70, 84, 76, 82, 78,
  80, 78, 77, 76, 75, 74, 73,
  72, 71, 70, 69, 68, 66, 65,
];
const MIC_B_HEIGHTS: number[] = [
  70, 96, 60, 106, 64, 108, 70,
  92, 68, 86, 76, 84, 76, 80,
  78, 79, 78, 75, 76, 73, 74,
  71, 72, 69, 70, 67, 67, 64,
];

/** Per-bar wobble keyframes (px, ≤1.5 dB) at flutter 0 / 0.5 / 1 — seeded. */
const FLUTTER_KEYS: number[][] = [
  [0, 4, 0], [3, -2, 3], [0, -5, 0], [-2, 3, -2], [0, 6, 0],
  [4, 0, 4], [0, -4, 0], [-3, 2, -3], [0, 5, 0], [2, -3, 2],
  [0, -6, 0], [-4, 3, -4], [0, 4, 0], [3, -3, 3], [0, -5, 0],
];

/** Deterministic PRNG (mulberry32, fixed seed) for the smoothing-scene trace. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

const TRACE_N = 64;

/** Jagged "1/24-oct feel" spectrum: smooth base shape + seeded jitter that
 *  densifies toward HF (comb detail sits closer together on a log axis). */
const RAW_TRACE: number[] = (() => {
  const rand = mulberry32(0x51e5eed);
  const ys: number[] = [];
  for (let i = 0; i < TRACE_N; i++) {
    const t = i / (TRACE_N - 1);
    const base =
      108 -
      40 * Math.sin(Math.PI * Math.min(t * 1.6, 1)) +
      58 * Math.max(0, t - 0.55) +
      8 * Math.sin(t * 21);
    const jag = (rand() * 2 - 1) * (4 + 14 * t);
    ys.push(clamp(base + jag, 28, 176));
  }
  return ys;
})();

/** The SAME trace averaged (window 9) — the "1/3-oct feel" view. */
const SMOOTH_TRACE: number[] = RAW_TRACE.map((_, i) => {
  let sum = 0;
  let n = 0;
  for (let k = i - 4; k <= i + 4; k++) {
    if (k >= 0 && k < TRACE_N) {
      sum += RAW_TRACE[k];
      n++;
    }
  }
  return sum / n;
});

const traceX = (i: number) => PLOT_L + (i * (PLOT_R - PLOT_L)) / (TRACE_N - 1);
const tracePoints = (ys: number[]): string =>
  ys.map((y, i) => `${traceX(i).toFixed(1)},${y.toFixed(1)}`).join(' ');

const RAW_POINTS = tracePoints(RAW_TRACE);
const SMOOTH_POINTS = tracePoints(SMOOTH_TRACE);

/** Leader-line anchor points on the actual traces (computed, never guessed). */
const JAG_PT = { x: traceX(30), y: RAW_TRACE[30] };
const SM_PT = { x: traceX(34), y: SMOOTH_TRACE[34] };

/** Amplitude-ramp gradient stops (levelColor 0 = silence blue → 1 = loud red). */
const RAMP_SAMPLES = [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1] as const;

/* Callout palette (shared demo brief): amber = the thing being taught,
 * salmon = warning/limit, steel = neutral reference. */
const CALLOUT_STEEL = '#9aa3ad';
const LEADER = 'rgba(255,255,255,.35)';

/* Source hues (scene 1 contrasts two SOURCES — the allowed two-hue case;
 * pink matches SignalGenDemo's pink-noise hue). */
const PINK_C = '#ff8fae';
const WHITE_C = '#f2f2f5';

const SCENES = [
  {
    key: 'noise',
    label: 'PINK VS WHITE',
    watch: 'THE WHITE STAIRCASE — +3 dB EVERY OCTAVE',
    body:
      'Pink noise carries equal energy per octave, so a third-octave RTA draws it flat — ' +
      'that is exactly why pink is the standard alignment source: any tilt or bump you see ' +
      'came from the system, the room, or the mic position, never the source. White noise ' +
      'carries equal energy per hertz, and each octave up spans twice as many hertz, so its ' +
      'bars climb about +3 dB per octave — roughly +27 dB across the 31 Hz–16 kHz span shown here.',
    note: 'If your pink reference does not read flat, fix the source or the input chain before you judge the room.',
  },
  {
    key: 'smoothing',
    label: 'SMOOTHING',
    watch: 'THE COMB VANISHES — THE TREND SURVIVES',
    body:
      'One fixed spectrum drawn two ways. At a 1/24-octave feel every narrow ripple shows; ' +
      'averaged to a 1/3-octave feel only the broad trend remains. Smoothing changes how the ' +
      'trace looks — never how the system sounds. Use fine resolution to hunt narrow problems ' +
      'and heavier smoothing to judge overall balance.',
    note: 'Never compare two traces captured with different smoothing or scale — you would be comparing display math, not sound.',
  },
  {
    key: 'mic',
    label: 'MIC POSITION',
    watch: 'LOW BANDS SWING, HIGH BANDS HOLD',
    body:
      'Same speaker, same pink noise, two mic spots one step apart. Reflections and room ' +
      'modes sum differently at every point in the room, so the bass bands can swing many dB ' +
      'while the top octaves barely move. One trace is only ever true for the spot where the ' +
      'mic stood.',
    note: 'Average several mic positions — and log where the mic stood — before you touch an EQ.',
  },
] as const;

/* ------------------------------------------------------------------ */
/* Shared pieces                                                      */
/* ------------------------------------------------------------------ */

function DemoChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole='button'
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      aria-pressed={active}
      onPress={onPress}
      hitSlop={9}
      style={[styles.innerChip, active && styles.innerChipActive]}
    >
      <Text style={[styles.innerChipText, active && styles.innerChipTextActive]}>{label}</Text>
    </Pressable>
  );
}

/** Grid, fixed-scale tag, baseline and octave-band labels — drawn INSIDE the
 *  SVG so labels sit exactly under their bands (the old flexbox row drifted). */
function GridAndAxis() {
  return (
    <>
      {GRID_YS.map((gy) => (
        <Line key={gy} x1={PLOT_L} y1={gy} x2={PLOT_R} y2={gy} stroke='#26272e' strokeWidth={1} />
      ))}
      <SvgText x={11} y={20} fontSize={9} letterSpacing={1} fontFamily={fonts.mono} fill={CALLOUT_STEEL} opacity={0.8}>
        10 dB / DIV
      </SvgText>
      <Line x1={PLOT_L} y1={BASE_Y} x2={PLOT_R} y2={BASE_Y} stroke='#4a4e58' strokeWidth={1.5} />
      {OCTAVE_TICKS.map((t) => (
        <SvgText
          key={t.i}
          x={t.anchor === 'start' ? PLOT_L + 1 : bandCenter(t.i)}
          y={200}
          fontSize={9.5}
          fontFamily={fonts.mono}
          fill={colors.textMuted}
          textAnchor={t.anchor ?? 'middle'}
        >
          {t.label}
        </SvgText>
      ))}
    </>
  );
}

/**
 * 28 third-octave bars that morph between two fixed height arrays
 * (`which` 0 ↔ 1) with a gentle seeded flutter. Fill is either a morphing
 * solid colour (two-source scenes) or the shared amplitude-ramp gradient
 * (level scenes — base blue climbing to the tip colour, owner bar ruling
 * 2026-08-16). SVG geometry props animate via createAnimatedComponent, so
 * these drivers are non-native (the established tooldemos idiom).
 */
function MorphBars({
  heightsA,
  heightsB,
  which,
  colorA = colors.blue,
  colorB = colors.blue,
  ramp = false,
}: {
  heightsA: readonly number[];
  heightsB: readonly number[];
  which: 0 | 1;
  colorA?: string;
  colorB?: string;
  ramp?: boolean;
}) {
  const morph = useRef(new Animated.Value(which)).current;
  const flutter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(morph, {
      toValue: which,
      duration: 650,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false, // drives SVG rect geometry
    }).start();
  }, [which, morph]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(flutter, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
        Animated.timing(flutter, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [flutter]);

  const solidFill = useMemo(
    () => morph.interpolate({ inputRange: [0, 1], outputRange: [colorA, colorB] }),
    [morph, colorA, colorB],
  );

  const bars = useMemo(
    () =>
      heightsA.map((hA, i) => {
        const base = morph.interpolate({ inputRange: [0, 1], outputRange: [hA, heightsB[i]] });
        const sway = flutter.interpolate({ inputRange: [0, 0.5, 1], outputRange: FLUTTER_KEYS[i % FLUTTER_KEYS.length] });
        const h = Animated.add(base, sway);
        const y = Animated.subtract(new Animated.Value(BASE_Y), h);
        return { h, y };
      }),
    [heightsA, heightsB, morph, flutter],
  );

  return (
    <Svg width='100%' height={CHART_H} viewBox={`0 0 ${CHART_W} ${CHART_H}`}>
      {ramp ? (
        <Defs>
          {/* Amplitude ramp in plot pixels: silence blue at the baseline
              climbing to the level's colour at the tip (userSpaceOnUse so the
              colour tracks TRUE level, never each bar's own height). */}
          <LinearGradient id='rtaLvlRamp' gradientUnits='userSpaceOnUse' x1='0' y1={BASE_Y} x2='0' y2={TOP_Y}>
            {RAMP_SAMPLES.map((s) => (
              <Stop key={s} offset={s} stopColor={levelColor(s)} />
            ))}
          </LinearGradient>
        </Defs>
      ) : null}
      <GridAndAxis />
      {bars.map((b, i) => (
        <AnimatedRect
          key={`bar-${i}`}
          x={bandX(i)}
          width={BAR_W}
          y={b.y}
          height={b.h}
          rx={1.5}
          fill={ramp ? 'url(#rtaLvlRamp)' : solidFill}
          fillOpacity={0.94}
        />
      ))}
      <Line x1={PLOT_L} y1={BASE_Y} x2={PLOT_R} y2={BASE_Y} stroke='#4a4e58' strokeWidth={1.5} />
    </Svg>
  );
}

/** Recessed glass instrument panel around a stack of same-viewBox SVG layers. */
function PlotPanel({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.panel}>
      <View style={styles.plotStack}>{children}</View>
    </View>
  );
}

function LegendRow({ dot, lead, leadColor, rest }: { dot: string; lead: string; leadColor: string; rest: string }) {
  return (
    <View style={styles.legendRow}>
      <View style={[styles.legendDot, { backgroundColor: dot }]} />
      <Text style={styles.legendText}>
        <Text style={{ fontFamily: fonts.mono, color: leadColor }}>{lead}</Text>
        {rest}
      </Text>
    </View>
  );
}

function Caption({ watch, body, note }: { watch: string; body: string; note: string }) {
  return (
    <View style={styles.captionBlock}>
      <Text style={styles.watchFor}>WATCH FOR — {watch}</Text>
      <Text style={styles.captionBody}>{body}</Text>
      <Text style={styles.fieldNote}>FIELD NOTE: {note}</Text>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Scenes                                                             */
/* ------------------------------------------------------------------ */

function SceneNoise() {
  const [which, setWhich] = useState<0 | 1>(0);
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: which, duration: 520, easing: Easing.inOut(Easing.quad), useNativeDriver: true }).start();
  }, [which, fade]);

  const pinkOp = fade.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });

  return (
    <View style={styles.sceneArea}>
      <View style={styles.innerRow}>
        <DemoChip label='PINK' active={which === 0} onPress={() => setWhich(0)} />
        <DemoChip label='WHITE' active={which === 1} onPress={() => setWhich(1)} />
        <View style={styles.rowSpacer} />
        <Text style={styles.readout}>{which === 0 ? 'TILT 0 dB/OCT' : 'TILT +3 dB/OCT'}</Text>
      </View>

      <PlotPanel>
        <MorphBars heightsA={PINK_HEIGHTS} heightsB={WHITE_HEIGHTS} which={which} colorA={PINK_C} colorB={WHITE_C} />

        {/* Pink callout layer: flat dashed guide along the bar tops. */}
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: pinkOp }]} pointerEvents='none'>
          <Svg width='100%' height={CHART_H} viewBox={`0 0 ${CHART_W} ${CHART_H}`}>
            <Line x1={bandCenter(0)} y1={90} x2={bandCenter(27)} y2={90} stroke={CALLOUT_STEEL} strokeWidth={1} strokeDasharray='3 4' opacity={0.55} />
            <SvgText x={160} y={62} fontSize={9.5} letterSpacing={1} fontFamily={fonts.mono} fill={colors.amberDeep} textAnchor='middle'>
              PINK READS FLAT · EQUAL ENERGY PER OCTAVE
            </SvgText>
            <Line x1={160} y1={67} x2={160} y2={85} stroke={LEADER} strokeWidth={1} />
          </Svg>
        </Animated.View>

        {/* White callout layer: the +3 dB/oct slope guide along the staircase. */}
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: fade }]} pointerEvents='none'>
          <Svg width='100%' height={CHART_H} viewBox={`0 0 ${CHART_W} ${CHART_H}`}>
            <Line x1={bandCenter(0)} y1={BASE_Y - WHITE_HEIGHTS[0]} x2={bandCenter(27)} y2={BASE_Y - WHITE_HEIGHTS[27]} stroke={CALLOUT_STEEL} strokeWidth={1} strokeDasharray='3 4' opacity={0.55} />
            <SvgText x={150} y={36} fontSize={9.5} letterSpacing={1} fontFamily={fonts.mono} fill={colors.amberDeep} textAnchor='middle'>
              +3 dB PER OCTAVE · EQUAL ENERGY PER Hz
            </SvgText>
            <Line x1={215} y1={41} x2={213} y2={73} stroke={LEADER} strokeWidth={1} />
          </Svg>
        </Animated.View>
      </PlotPanel>

      <View style={styles.legendCol}>
        <LegendRow dot={PINK_C} lead='PINK ' leadColor={PINK_C} rest='— equal energy per octave, so a third-octave RTA draws it flat.' />
        <LegendRow dot={WHITE_C} lead='WHITE ' leadColor={WHITE_C} rest='— equal energy per hertz, so the display rises +3 dB per octave.' />
      </View>
    </View>
  );
}

function SceneSmoothing() {
  const xfade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(1600),
        Animated.timing(xfade, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.delay(1600),
        Animated.timing(xfade, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [xfade]);

  const jaggedOpacity = xfade.interpolate({ inputRange: [0, 1], outputRange: [1, 0.16] });
  const smoothOpacity = xfade.interpolate({ inputRange: [0, 1], outputRange: [0.16, 1] });
  const jaggedFull = xfade.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });

  return (
    <View style={styles.sceneArea}>
      <View style={styles.innerRow}>
        <Animated.Text style={[styles.legendJagged, { opacity: jaggedOpacity }]}>1/24 OCT</Animated.Text>
        <Animated.Text style={[styles.legendSmooth, { opacity: smoothOpacity }]}>1/3 OCT</Animated.Text>
        <View style={styles.rowSpacer} />
        <Text style={styles.readout}>SAME DATA</Text>
      </View>

      <PlotPanel>
        <Svg width='100%' height={CHART_H} viewBox={`0 0 ${CHART_W} ${CHART_H}`}>
          <GridAndAxis />
        </Svg>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: jaggedOpacity }]} pointerEvents='none'>
          <Svg width='100%' height={CHART_H} viewBox={`0 0 ${CHART_W} ${CHART_H}`}>
            {/* 1/24-octave (raw) line = BLUE (owner 2026-08-05). */}
            <Polyline points={RAW_POINTS} fill='none' stroke={colors.blue} strokeWidth={1.6} strokeLinejoin='round' />
          </Svg>
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: smoothOpacity }]} pointerEvents='none'>
          <Svg width='100%' height={CHART_H} viewBox={`0 0 ${CHART_W} ${CHART_H}`}>
            {/* Smoothed outcome line = GREEN (owner 2026-08-05). */}
            <Polyline points={SMOOTH_POINTS} fill='none' stroke={colors.green} strokeWidth={2.5} strokeLinecap='round' strokeLinejoin='round' />
          </Svg>
        </Animated.View>

        {/* Callouts ride their own layer so each names the view it belongs to. */}
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: jaggedFull }]} pointerEvents='none'>
          <Svg width='100%' height={CHART_H} viewBox={`0 0 ${CHART_W} ${CHART_H}`}>
            <SvgText x={100} y={30} fontSize={9.5} letterSpacing={1} fontFamily={fonts.mono} fill={CALLOUT_STEEL} textAnchor='middle'>
              EVERY NARROW RIPPLE SHOWS
            </SvgText>
            <Line x1={138} y1={34} x2={JAG_PT.x - 3} y2={JAG_PT.y - 4} stroke={LEADER} strokeWidth={1} />
          </Svg>
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: xfade }]} pointerEvents='none'>
          <Svg width='100%' height={CHART_H} viewBox={`0 0 ${CHART_W} ${CHART_H}`}>
            <SvgText x={185} y={44} fontSize={9.5} letterSpacing={1} fontFamily={fonts.mono} fill={colors.amberDeep} textAnchor='middle'>
              THE BROAD TREND · WHAT YOU TUNE TO
            </SvgText>
            <Line x1={178} y1={49} x2={SM_PT.x} y2={SM_PT.y - 3} stroke={LEADER} strokeWidth={1} />
          </Svg>
        </Animated.View>
      </PlotPanel>

      <View style={styles.legendCol}>
        <LegendRow dot={colors.blue} lead='FINE (1/24 OCT) ' leadColor={colors.blue} rest='— hunt narrow problems: feedback rings, buzzes, resonances.' />
        <LegendRow dot={colors.green} lead='SMOOTH (1/3 OCT) ' leadColor={colors.green} rest='— judge tonal balance and plan broad EQ moves.' />
      </View>
    </View>
  );
}

/** Mini top-view room glyph: speaker, two marked mic spots, sliding mic dot. */
const MIC_SPOT_A = { x: 30, y: 24 };
const MIC_SPOT_B = { x: 13, y: 33 };

function RoomGlyph({ which }: { which: 0 | 1 }) {
  const pos = useRef(new Animated.Value(which)).current;

  useEffect(() => {
    Animated.timing(pos, {
      toValue: which,
      duration: 480,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true, // View transform only
    }).start();
  }, [which, pos]);

  // The Svg scales the 46-unit content into a 92px box; the overlaid dot is in
  // container px, so its positions scale by 2 (dot is 16px → −8 to centre).
  const tx = pos.interpolate({ inputRange: [0, 1], outputRange: [MIC_SPOT_A.x * 2 - 8, MIC_SPOT_B.x * 2 - 8] });
  const ty = pos.interpolate({ inputRange: [0, 1], outputRange: [MIC_SPOT_A.y * 2 - 8, MIC_SPOT_B.y * 2 - 8] });

  return (
    <View style={styles.roomGlyph}>
      <Svg width={92} height={92} viewBox='0 0 46 46'>
        <Rect x={2} y={2} width={42} height={42} rx={3} fill='#101014' stroke={colors.steelBorder} strokeWidth={1.2} />
        <Rect x={6} y={6} width={8} height={8} rx={1.5} fill={colors.amber} />
        <Path d='M17 8 A9 9 0 0 1 20 17' stroke={colors.amber} strokeOpacity={0.45} strokeWidth={1.2} fill='none' />
        <Path d='M21 5 A15 15 0 0 1 26 20' stroke={colors.amber} strokeOpacity={0.22} strokeWidth={1.2} fill='none' />
        <Circle cx={MIC_SPOT_A.x} cy={MIC_SPOT_A.y} r={5} stroke={colors.textMutedDeep} strokeDasharray='2 2' fill='none' />
        <Circle cx={MIC_SPOT_B.x} cy={MIC_SPOT_B.y} r={5} stroke={colors.textMutedDeep} strokeDasharray='2 2' fill='none' />
      </Svg>
      <Animated.View style={[styles.micDot, { transform: [{ translateX: tx }, { translateY: ty }] }]} />
    </View>
  );
}

function SceneMic() {
  const [which, setWhich] = useState<0 | 1>(0);
  return (
    <View style={styles.sceneArea}>
      <View style={styles.innerRow}>
        <DemoChip label='POS A' active={which === 0} onPress={() => setWhich(0)} />
        <DemoChip label='POS B' active={which === 1} onPress={() => setWhich(1)} />
        <View style={styles.rowSpacer} />
        <Text style={styles.readout}>{which === 0 ? 'MIC AT A' : 'MIC AT B'}</Text>
      </View>

      <PlotPanel>
        <MorphBars heightsA={MIC_A_HEIGHTS} heightsB={MIC_B_HEIGHTS} which={which} ramp />
        {/* Static callouts — true at BOTH positions, so they never crossfade. */}
        <View style={StyleSheet.absoluteFill} pointerEvents='none'>
          <Svg width='100%' height={CHART_H} viewBox={`0 0 ${CHART_W} ${CHART_H}`}>
            <SvgText x={88} y={30} fontSize={9.5} letterSpacing={1} fontFamily={fonts.mono} fill={colors.amberDeep} textAnchor='middle'>
              LOW END SWINGS MOST
            </SvgText>
            <Line x1={70} y1={34} x2={58} y2={66} stroke={LEADER} strokeWidth={1} />
            <SvgText x={248} y={72} fontSize={9.5} letterSpacing={1} fontFamily={fonts.mono} fill={CALLOUT_STEEL} textAnchor='middle'>
              HIGHS BARELY MOVE
            </SvgText>
            <Line x1={248} y1={76} x2={258} y2={100} stroke={LEADER} strokeWidth={1} />
          </Svg>
        </View>
      </PlotPanel>

      <View style={styles.glyphRow}>
        <RoomGlyph which={which} />
        <View style={styles.glyphTextCol}>
          <Text style={styles.glyphEyebrow}>SPEAKER FIXED · MIC MOVES</Text>
          <Text style={styles.glyphBody}>
            Dashed circles mark the two mic spots. Reflections sum differently at each, so the
            bass picture reorders while the highs hold.
          </Text>
          <View style={styles.rampLegendRow}>
            <Svg width={72} height={8}>
              <Defs>
                <LinearGradient id='rtaLegendRamp' x1='0' y1='0' x2='1' y2='0'>
                  {RAMP_SAMPLES.map((s) => (
                    <Stop key={s} offset={s} stopColor={levelColor(s)} />
                  ))}
                </LinearGradient>
              </Defs>
              <Rect x={0} y={0} width={72} height={8} rx={4} fill='url(#rtaLegendRamp)' />
            </Svg>
            <Text style={styles.rampLegendText}>BAR COLOUR = BAND LEVEL</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Root                                                               */
/* ------------------------------------------------------------------ */

export function RtaDemo() {
  const [scene, setScene] = useState(0);
  return (
    <View style={styles.root}>
      <View style={styles.chipRow} accessibilityRole='tablist'>
        {SCENES.map((s, i) => (
          <Pressable hitSlop={8}
            key={s.key}
            accessibilityRole='tab'
            accessibilityLabel={`Show ${s.label} scene`}
            accessibilityState={{ selected: scene === i }}
            aria-selected={scene === i}
            onPress={() => setScene(i)}
            style={[styles.chip, scene === i && styles.chipActive]}
          >
            <Text style={[styles.chipText, scene === i && styles.chipTextActive]}>{s.label}</Text>
          </Pressable>
        ))}
      </View>
      {scene === 0 ? <SceneNoise /> : scene === 1 ? <SceneSmoothing /> : <SceneMic />}
      <Caption watch={SCENES[scene].watch} body={SCENES[scene].body} note={SCENES[scene].note} />
    </View>
  );
}

/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  root: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    padding: 12,
    gap: 10,
  },

  // Rack-key scene tabs (shared demo visual contract, 2026-09-13).
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.steelBorder,
    backgroundColor: '#141414',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: { borderColor: colors.amber, backgroundColor: 'rgba(255,180,0,.10)' },
  chipText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.textMuted },
  chipTextActive: { color: colors.amber },

  sceneArea: { gap: 8 },
  innerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 26 },
  rowSpacer: { flex: 1 },
  innerChip: {
    paddingHorizontal: 12,
    height: 26,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.steelBorder,
    backgroundColor: '#141414',
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerChipActive: { borderColor: colors.amber, backgroundColor: 'rgba(255,180,0,.10)' },
  innerChipText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1, color: colors.textSub },
  innerChipTextActive: { color: colors.amber },
  readout: { fontFamily: fonts.mono, fontSize: 12, color: colors.textSubAlt },

  // Recessed glass instrument panel (shared demo visual contract).
  panel: {
    backgroundColor: '#0b0c0e',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,.07)',
    borderRadius: 10,
    paddingVertical: 8,
  },
  plotStack: { height: CHART_H },

  legendJagged: { fontFamily: fonts.mono, fontSize: 12, color: colors.blue },
  legendSmooth: { fontFamily: fonts.mono, fontSize: 12, color: colors.green, marginLeft: 8 },

  legendCol: { gap: 4 },
  legendRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 7 },
  legendDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
  legendText: { flex: 1, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },

  glyphRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  roomGlyph: { width: 92, height: 92 },
  micDot: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.green,
  },
  glyphTextCol: { flex: 1, gap: 5 },
  glyphEyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.4, color: colors.amberLabel },
  glyphBody: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
  rampLegendRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  rampLegendText: { fontFamily: fonts.mono, fontSize: 12, color: colors.textMuted },

  captionBlock: { gap: 5 },
  watchFor: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.6, color: colors.amber },
  captionBody: {
    fontFamily: fonts.barlowRegular,
    fontSize: 13.5,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  fieldNote: {
    fontFamily: fonts.barlowRegular,
    fontStyle: 'italic',
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.textMuted,
  },
});
