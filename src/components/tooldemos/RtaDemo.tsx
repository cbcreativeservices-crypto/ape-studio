/**
 * RtaDemo — animated training demo for the RTA (Real-Time Analyzer) tool.
 * Spec of record: docs/APE_AUDIO_TOOLS_SPEC_2026_07_23.md §10 (RTA) + §4 Demo
 * mode; user ruling 2026-07-23: demos are VISUAL/ANIMATED ONLY (no audio path).
 *
 * Three scenes, switched via chips:
 *  1. PINK VS WHITE — 15 third-octave-style bars morph between the flat read
 *     of pink noise and the ~+3 dB/octave upward tilt of white noise.
 *  2. SMOOTHING — one fixed spectrum trace crossfades between a jagged
 *     1/24-octave feel and a smoothed 1/3-octave feel (auto-looping).
 *  3. MIC POSITION — the same room at two mic spots: the low-mid bars ripple
 *     in a visibly different pattern; a mini room glyph shows the mic moving.
 *
 * Integrity (spec §5 + measurement-tools §1.7): the hosting screen shows the
 * permanent "TRAINING DEMO — NOT A LIVE MEASUREMENT" badge; nothing here is a
 * live reading, no LedMeter, no simulated meter chrome. All wobble comes from
 * fixed seeded arrays — no Math.random in render. RN core Animated only:
 * SVG geometry morphs run non-native (animated Rect props); layer crossfades
 * and the mic-dot move use native-driver transforms/opacity.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Polyline, Rect } from 'react-native-svg';
import { colors, fonts } from '../../theme/tokens';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

/* ------------------------------------------------------------------ */
/* Fixed data (module scope, deterministic — spec §4: no Math.random) */
/* ------------------------------------------------------------------ */

const CHART_W = 320;
const CHART_H = 158;
const BASE_Y = 152;
const GRID_YS = [32, 72, 112];
const BAR_COUNT = 15;

/** Pink noise on a third-octave RTA: flat (tiny fixed variation). */
const PINK_HEIGHTS = [86, 84, 87, 85, 86, 84, 85, 87, 86, 85, 84, 86, 85, 86, 84];

/** White noise: equal energy per Hz → rises ~+3 dB/octave left to right. */
const WHITE_HEIGHTS = [34, 41, 48, 55, 62, 69, 75, 82, 89, 96, 103, 110, 117, 124, 130];

/** Mic position A vs B — low-mid ripple (bars 2–7) inverts; highs converge. */
const MIC_A_HEIGHTS = [64, 70, 88, 56, 90, 58, 84, 66, 72, 76, 74, 72, 70, 68, 66];
const MIC_B_HEIGHTS = [66, 72, 58, 88, 60, 92, 62, 80, 70, 74, 75, 71, 71, 67, 67];

/** Per-bar wobble keyframes (px) at flutter = 0 / 0.5 / 1 — seeded, desynced. */
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

const TRACE_N = 48;

/** Jagged "1/24-oct feel" spectrum: smooth base shape + seeded jitter. */
const RAW_TRACE: number[] = (() => {
  const rand = mulberry32(0x51e5eed);
  const ys: number[] = [];
  for (let i = 0; i < TRACE_N; i++) {
    const t = i / (TRACE_N - 1);
    const base =
      84 -
      34 * Math.sin(Math.PI * Math.min(t * 1.6, 1)) +
      52 * Math.max(0, t - 0.55) +
      7 * Math.sin(t * 21);
    const jag = (rand() * 2 - 1) * (4 + 12 * t);
    ys.push(clamp(base + jag, 26, 148));
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

const tracePoints = (ys: number[]): string =>
  ys.map((y, i) => `${(8 + (i * 304) / (TRACE_N - 1)).toFixed(1)},${y.toFixed(1)}`).join(' ');

const RAW_POINTS = tracePoints(RAW_TRACE);
const SMOOTH_POINTS = tracePoints(SMOOTH_TRACE);

// 15 third-octave bands starting ~31.5 Hz reach only ~800 Hz — label the axis
// to that true span, not 16 kHz (F24).
const FREQ_LABELS = ['31 Hz', '100', '315', '800'];

const SCENES = [
  {
    key: 'noise',
    label: 'PINK VS WHITE',
    caption:
      'Pink noise carries equal energy per octave, so a third-octave RTA draws it flat. ' +
      'White noise carries equal energy per hertz and climbs about +3 dB per octave.',
  },
  {
    key: 'smoothing',
    label: 'SMOOTHING',
    caption:
      'One fixed spectrum drawn two ways: raw at a 1/24-octave feel, then averaged to a ' +
      '1/3-octave feel. Smoothing changes how the trace looks — never how the system sounds.',
  },
  {
    key: 'mic',
    label: 'MIC POSITION',
    caption:
      'Same speaker, same room, two mic spots. Reflections sum differently at each position, ' +
      'so the low-mid bars ripple in a different pattern — average several spots before you EQ.',
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
      onPress={onPress}
      hitSlop={6}
      style={[styles.innerChip, active && styles.innerChipActive]}
    >
      <Text style={[styles.innerChipText, active && styles.innerChipTextActive]}>{label}</Text>
    </Pressable>
  );
}

function FreqLabels() {
  return (
    <View style={styles.freqRow}>
      {FREQ_LABELS.map((f) => (
        <Text key={f} style={styles.freqLabel}>
          {f}
        </Text>
      ))}
    </View>
  );
}

/**
 * 15 bars that morph between two fixed height arrays (`which` 0 ↔︎ 1) with a
 * gentle seeded flutter so the drawing feels alive. SVG geometry props animate
 * via Animated.createAnimatedComponent, so these drivers are non-native.
 */
function MorphBars({
  heightsA,
  heightsB,
  colorA,
  colorB,
  which,
}: {
  heightsA: number[];
  heightsB: number[];
  colorA: string;
  colorB: string;
  which: 0 | 1;
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
        Animated.timing(flutter, { toValue: 1, duration: 950, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
        Animated.timing(flutter, { toValue: 0, duration: 950, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [flutter]);

  const fill = useMemo(
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
    <View>
      <Svg width='100%' height={CHART_H} viewBox={`0 0 ${CHART_W} ${CHART_H}`}>
        {GRID_YS.map((gy) => (
          <Line key={gy} x1={8} y1={gy} x2={312} y2={gy} stroke={colors.hairlineDim} strokeWidth={1} />
        ))}
        {bars.map((b, i) => (
          <AnimatedRect
            key={`bar-${i}`}
            x={12.5 + i * 20}
            width={15}
            y={b.y}
            height={b.h}
            rx={2}
            fill={fill}
            fillOpacity={0.92}
          />
        ))}
        <Line x1={8} y1={BASE_Y} x2={312} y2={BASE_Y} stroke={colors.steelBorder} strokeWidth={1.5} />
      </Svg>
      <FreqLabels />
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Scenes                                                             */
/* ------------------------------------------------------------------ */

function SceneNoise() {
  const [which, setWhich] = useState<0 | 1>(0);
  return (
    <View style={styles.sceneArea}>
      <View style={styles.innerRow}>
        <DemoChip label='PINK' active={which === 0} onPress={() => setWhich(0)} />
        <DemoChip label='WHITE' active={which === 1} onPress={() => setWhich(1)} />
        <View style={styles.rowSpacer} />
        <Text style={styles.readout}>{which === 0 ? 'TILT 0 dB/OCT' : 'TILT +3 dB/OCT'}</Text>
      </View>
      <MorphBars
        heightsA={PINK_HEIGHTS}
        heightsB={WHITE_HEIGHTS}
        colorA='#ff8ba0'
        colorB='#ecedf2'
        which={which}
      />
    </View>
  );
}

function SceneSmoothing() {
  const xfade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(1200),
        Animated.timing(xfade, { toValue: 1, duration: 650, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.delay(1200),
        Animated.timing(xfade, { toValue: 0, duration: 650, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [xfade]);

  const jaggedOpacity = xfade.interpolate({ inputRange: [0, 1], outputRange: [1, 0.16] });
  const smoothOpacity = xfade.interpolate({ inputRange: [0, 1], outputRange: [0.16, 1] });

  return (
    <View style={styles.sceneArea}>
      <View style={styles.innerRow}>
        <Animated.Text style={[styles.legendJagged, { opacity: jaggedOpacity }]}>1/24 OCT</Animated.Text>
        <Animated.Text style={[styles.legendSmooth, { opacity: smoothOpacity }]}>1/3 OCT</Animated.Text>
        <View style={styles.rowSpacer} />
        <Text style={styles.readout}>SAME DATA</Text>
      </View>
      <View style={styles.traceStack}>
        <Svg width='100%' height={CHART_H} viewBox={`0 0 ${CHART_W} ${CHART_H}`} style={StyleSheet.absoluteFill}>
          {GRID_YS.map((gy) => (
            <Line key={gy} x1={8} y1={gy} x2={312} y2={gy} stroke='#3a3c46' strokeWidth={1} />
          ))}
          <Line x1={8} y1={BASE_Y} x2={312} y2={BASE_Y} stroke='#565a66' strokeWidth={1.5} />
        </Svg>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: jaggedOpacity }]}>
          <Svg width='100%' height={CHART_H} viewBox={`0 0 ${CHART_W} ${CHART_H}`}>
            {/* 1/24-octave (raw) line = BLUE (owner 2026-08-05). */}
            <Polyline points={RAW_POINTS} fill='none' stroke={colors.blue} strokeWidth={1.6} strokeLinejoin='round' />
          </Svg>
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: smoothOpacity }]}>
          <Svg width='100%' height={CHART_H} viewBox={`0 0 ${CHART_W} ${CHART_H}`}>
            {/* Smoothed outcome line = GREEN (owner 2026-08-05). */}
            <Polyline points={SMOOTH_POINTS} fill='none' stroke={colors.green} strokeWidth={2.5} strokeLinecap='round' strokeLinejoin='round' />
          </Svg>
        </Animated.View>
      </View>
      <FreqLabels />
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

  // Enlarged 2× (owner 2026-08-05: there's spare space — make it easier to read).
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
      <MorphBars
        heightsA={MIC_A_HEIGHTS}
        heightsB={MIC_B_HEIGHTS}
        colorA={colors.blue}
        colorB={colors.blue}
        which={which}
      />
      <RoomGlyph which={which} />
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
      <View style={styles.chipRow}>
        {SCENES.map((s, i) => (
          <Pressable hitSlop={8}
            key={s.key}
            accessibilityRole='button'
            accessibilityLabel={`Show ${s.label} scene`}
            accessibilityState={{ selected: scene === i }}
            onPress={() => setScene(i)}
            style={[styles.chip, scene === i && styles.chipActive]}
          >
            <Text style={[styles.chipText, scene === i && styles.chipTextActive]}>{s.label}</Text>
          </Pressable>
        ))}
      </View>
      {scene === 0 ? <SceneNoise /> : scene === 1 ? <SceneSmoothing /> : <SceneMic />}
      <Text style={styles.caption}>{SCENES[scene].caption}</Text>
    </View>
  );
}

/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  root: {
    height: 364,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    padding: 12,
    gap: 8,
  },

  chipRow: { flexDirection: 'row', gap: 6 },
  chip: {
    paddingHorizontal: 10,
    height: 28,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: '#18181c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: { borderColor: colors.green, backgroundColor: '#122015' },
  chipText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.textSub },
  chipTextActive: { color: colors.green },

  sceneArea: { height: 206 },
  innerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 24, marginBottom: 6 },
  rowSpacer: { flex: 1 },
  innerChip: {
    paddingHorizontal: 10,
    height: 24,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerChipActive: { borderColor: colors.amberDeep },
  innerChipText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1, color: colors.textSub },
  innerChipTextActive: { color: colors.amber },
  readout: { fontFamily: fonts.mono, fontSize: 12, color: colors.textSubAlt },

  legendJagged: { fontFamily: fonts.mono, fontSize: 12, color: colors.blue },
  legendSmooth: { fontFamily: fonts.mono, fontSize: 12, color: colors.green, marginLeft: 8 },
  traceStack: { height: CHART_H },

  freqRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 8, marginTop: 2 },
  freqLabel: { fontFamily: fonts.mono, fontSize: 12, color: colors.textMuted },

  roomGlyph: { position: 'absolute', top: 30, right: 6, width: 92, height: 92 },
  micDot: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.green,
  },

  caption: {
    fontFamily: fonts.barlowRegular,
    fontSize: 13.5,
    lineHeight: 18,
    color: colors.textSecondary,
  },
});
