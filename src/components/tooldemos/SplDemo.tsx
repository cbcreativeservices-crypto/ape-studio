/**
 * SplDemo — Tool Demo: how an SPL meter reads sound (spec of record
 * docs/APE_AUDIO_TOOLS_SPEC_2026_07_23.md §9 SPL meter; demo-mode rules §4 and
 * tooldemos/types.ts contract, 2026-07-23).
 *
 * VISUAL / ANIMATED TRAINING DEMO ONLY. Every trace, bar level and readout is
 * drawn from fixed, precomputed arrays (deterministic — no audio path, no
 * Math.random, no live values, no LedMeter per spec §1.7). The hosting
 * ToolDemoScreen renders the permanent "TRAINING DEMO — NOT A LIVE
 * MEASUREMENT" badge; nothing here implies a live reading.
 *
 * Scenes: 1) PEAK vs RMS — a burst-y depicted signal drives two bars: PEAK
 * jumps instantly and holds, RMS climbs slowly toward the average.
 * 2) A vs C WEIGHTING — fixed 78 dBA / 84 dBC readouts for one bass-heavy
 * source, with the real IEC 61672 A/C weighting curves sketched underneath.
 * 3) FAST vs SLOW — two identical bars fed the same step pattern, one twitchy
 * (Fast, 125 ms), one damped (Slow, 1 s).
 *
 * Animation: RN core Animated only — one looping master value per scene,
 * keyframed via interpolate(); transforms/opacity with useNativeDriver.
 */
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import Svg, { Line, Polyline } from 'react-native-svg';
import { colors, fonts, spacing } from '../../theme/tokens';

/* ------------------------------------------------------------------ */
/* Fixed, precomputed data (deterministic — computed once at module    */
/* load; the demo never samples anything at render time).              */
/* ------------------------------------------------------------------ */

const VB_W = 300; // scope viewBox width
const VB_H = 130; // scope viewBox height
const Y_SCALE = 0.94; // headroom so strokes never kiss the frame
const BAR_H = 132; // scene 1 bar-track height (px)
const BAR3_H = 96; // scene 3 bar-track height (px)

/** Scene 1 — burst-y depicted signal: three bursts over a quiet bed. */
interface Burst {
  start: number;
  end: number;
  amp: number;
}
const BURSTS: Burst[] = [
  { start: 0.07, end: 0.16, amp: 0.95 },
  { start: 0.38, end: 0.46, amp: 0.72 },
  { start: 0.66, end: 0.75, amp: 0.85 },
];

function envelope(t: number): number {
  for (const b of BURSTS) {
    if (t >= b.start && t <= b.end) {
      const u = (t - b.start) / (b.end - b.start);
      return b.amp * Math.pow(Math.sin(Math.PI * u), 0.35);
    }
  }
  return 0.12;
}

function carrier(t: number): number {
  return 0.82 * Math.sin(2 * Math.PI * 36 * t) + 0.18 * Math.sin(2 * Math.PI * 97 * t + 1.1);
}

/** Map normalized samples (-1..1) to an SVG polyline points string. */
function toPolyline(values: number[], w: number, h: number): string {
  const last = values.length - 1;
  return values
    .map((v, i) => `${((i / last) * w).toFixed(2)},${(h / 2 - v * (h / 2) * Y_SCALE).toFixed(2)}`)
    .join(' ');
}

const S1_N = 200;
const BURST_VALUES: number[] = Array.from({ length: S1_N + 1 }, (_, i) => {
  const t = i / S1_N;
  return envelope(t) * carrier(t);
});
const BURST_POINTS = toPolyline(BURST_VALUES, VB_W, VB_H);

/** Honest bar targets: the peak and RMS of the actual drawn samples. */
const PEAK_LEVEL = Math.max(...BURST_VALUES.map(Math.abs));
const RMS_LEVEL = Math.sqrt(BURST_VALUES.reduce((acc, v) => acc + v * v, 0) / BURST_VALUES.length);

function formatDb(v: number): string {
  return `${(20 * Math.log10(v)).toFixed(1).replace('-', '−')} dB`;
}
const PEAK_DB_TXT = formatDb(PEAK_LEVEL);
const RMS_DB_TXT = formatDb(RMS_LEVEL);

const GRID_XS = [VB_W * 0.25, VB_W * 0.5, VB_W * 0.75];

/** Scene 2 — IEC 61672 A- and C-weighting responses, 20 Hz – 20 kHz. */
function aWeightDb(f: number): number {
  const f2 = f * f;
  const r =
    (12194 ** 2 * f2 * f2) /
    ((f2 + 20.6 ** 2) * Math.sqrt((f2 + 107.7 ** 2) * (f2 + 737.9 ** 2)) * (f2 + 12194 ** 2));
  return 20 * Math.log10(r) + 2.0;
}
function cWeightDb(f: number): number {
  const f2 = f * f;
  const r = (12194 ** 2 * f2) / ((f2 + 20.6 ** 2) * (f2 + 12194 ** 2));
  return 20 * Math.log10(r) + 0.06;
}

const CURVE_W = 300;
const CURVE_H = 104;
const DB_TOP = 5; // dB at the top of the sketch
const DB_BOTTOM = -52; // dB at the bottom (A ≈ −50 dB at 20 Hz)
const LOG_MIN = Math.log10(20);
const LOG_MAX = Math.log10(20000);

function freqToX(f: number): number {
  return ((Math.log10(f) - LOG_MIN) / (LOG_MAX - LOG_MIN)) * CURVE_W;
}
function dbToY(db: number): number {
  const clamped = Math.max(DB_BOTTOM, Math.min(DB_TOP, db));
  return ((DB_TOP - clamped) / (DB_TOP - DB_BOTTOM)) * (CURVE_H - 8) + 4;
}

const CURVE_N = 48;
const CURVE_FREQS: number[] = Array.from({ length: CURVE_N + 1 }, (_, i) =>
  Math.pow(10, LOG_MIN + ((LOG_MAX - LOG_MIN) * i) / CURVE_N),
);
const A_CURVE_POINTS = CURVE_FREQS.map((f) => `${freqToX(f).toFixed(2)},${dbToY(aWeightDb(f)).toFixed(2)}`).join(' ');
const C_CURVE_POINTS = CURVE_FREQS.map((f) => `${freqToX(f).toFixed(2)},${dbToY(cWeightDb(f)).toFixed(2)}`).join(' ');
const CURVE_GRID_XS = [100, 1000, 10000].map(freqToX);
const ZERO_DB_Y = dbToY(0);

/** Scene 3 — one shared step pattern; Fast chases it, Slow damps it. */
const STEP_TARGETS = [0.25, 0.85, 0.35, 0.7, 0.2, 0.9, 0.45, 0.6];
const STEP_FRAC = 1 / STEP_TARGETS.length;
const LOOP3_MS = 3600;

/** Fast (125 ms): near-instant jumps with a small deterministic overshoot. */
const FAST_KEYS: { in: number[]; out: number[] } = (() => {
  const inputs: number[] = [0];
  const outputs: number[] = [STEP_TARGETS[STEP_TARGETS.length - 1]];
  STEP_TARGETS.forEach((target, i) => {
    const t0 = i * STEP_FRAC;
    const prev = i === 0 ? STEP_TARGETS[STEP_TARGETS.length - 1] : STEP_TARGETS[i - 1];
    const wiggle = (i % 2 === 0 ? 1 : -1) * 0.05;
    inputs.push(t0 + 0.006, t0 + 0.03, t0 + 0.05, t0 + 0.07);
    outputs.push(prev, target, Math.max(0, Math.min(1, target + wiggle)), target);
  });
  inputs.push(1);
  outputs.push(STEP_TARGETS[STEP_TARGETS.length - 1]);
  return { in: inputs, out: outputs };
})();

/** Slow (1 s): first-order smoothing of the same pattern, pre-converged so
 *  the loop is seamless. */
const SLOW_KEYS: { in: number[]; out: number[] } = (() => {
  const samples = 160;
  const dtMs = LOOP3_MS / samples;
  const alpha = 1 - Math.exp(-dtMs / 1000);
  const vals: number[] = [];
  let s = 0.5;
  for (let pass = 0; pass < 3; pass++) {
    for (let i = 0; i < samples; i++) {
      const t = i / samples;
      const target = STEP_TARGETS[Math.min(Math.floor(t / STEP_FRAC), STEP_TARGETS.length - 1)];
      s += (target - s) * alpha;
      if (pass === 2) vals.push(s);
    }
  }
  const inputs: number[] = [];
  const outputs: number[] = [];
  for (let i = 0; i < samples; i += 8) {
    inputs.push(i / samples);
    outputs.push(vals[i]);
  }
  inputs.push(1);
  outputs.push(vals[0]);
  return { in: inputs, out: outputs };
})();

/** Staircase sketch of the shared step pattern (scene 3 header). */
const STAIR_W = 300;
const STAIR_H = 56;
const STAIR_POINTS = STEP_TARGETS.map((v, i) => {
  const y = (STAIR_H - 8) * (1 - v) + 4;
  const x1 = i * STEP_FRAC * STAIR_W;
  const x2 = (i + 1) * STEP_FRAC * STAIR_W;
  return `${x1.toFixed(2)},${y.toFixed(2)} ${x2.toFixed(2)},${y.toFixed(2)}`;
}).join(' ');

/** Pin a full-height fill to the track bottom while scaling it — transforms
 *  only, so the bars animate on the native driver. */
function barRise(level: Animated.AnimatedInterpolation<number>, barH: number) {
  return [
    {
      translateY: level.interpolate({
        inputRange: [0, 0.02, 1],
        outputRange: [barH * 0.49, barH * 0.49, 0],
      }),
    },
    {
      scaleY: level.interpolate({
        inputRange: [0, 0.02, 1],
        outputRange: [0.02, 0.02, 1],
      }),
    },
  ];
}

interface SceneDef {
  key: string;
  chip: string;
  title: string;
  caption: string;
}

const SCENES: SceneDef[] = [
  {
    key: 'peakRms',
    chip: 'PEAK vs RMS',
    title: 'PEAK vs RMS — ONE SIGNAL, TWO NUMBERS',
    caption:
      'Each depicted burst slams the PEAK bar to its highest instant, and the hold keeps it there. RMS averages energy over time, so it drifts slowly toward the average level. Peaks warn about overload; RMS tracks loudness.',
  },
  {
    key: 'weighting',
    chip: 'A vs C',
    title: 'A vs C WEIGHTING',
    caption:
      'Both readouts depict the same bass-heavy source. The A curve rolls off the low end before counting it; the C curve keeps it nearly flat. That is why sources with heavy bass read several dB higher in dBC than in dBA.',
  },
  {
    key: 'fastSlow',
    chip: 'FAST vs SLOW',
    title: 'FAST vs SLOW RESPONSE',
    caption:
      'Both bars are driven by the same fluctuating pattern. FAST (125 ms) chases every flicker; SLOW (1 s) damps the motion into a readable trend. Use Fast to catch short events, Slow for a stable average.',
  },
];

/* ------------------------------------------------------------------ */
/* Scene 1 — PEAK vs RMS                                               */
/* ------------------------------------------------------------------ */

const LOOP1_MS = 4200;

function PeakRmsScene() {
  const [scopeW, setScopeW] = useState(0);
  const master = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(master, {
        toValue: 1,
        duration: LOOP1_MS,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [master]);

  const cursorX = master.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.max(scopeW - 2, 1)],
  });
  // PEAK: jumps the instant the cursor crosses the first (tallest) burst,
  // then holds for the rest of the sweep.
  const peakLevel = master.interpolate({
    inputRange: [0, 0.07, 0.085, 1],
    outputRange: [0.12, 0.12, PEAK_LEVEL, PEAK_LEVEL],
  });
  // RMS: integrates slowly — rises through each burst, sags a little between.
  const rmsLevel = master.interpolate({
    inputRange: [0, 0.07, 0.2, 0.36, 0.5, 0.64, 0.78, 1],
    outputRange: [
      0.06,
      0.07,
      RMS_LEVEL * 0.82,
      RMS_LEVEL * 0.72,
      RMS_LEVEL * 0.92,
      RMS_LEVEL * 0.8,
      RMS_LEVEL * 0.98,
      RMS_LEVEL,
    ],
  });

  return (
    <View style={styles.peakRow}>
      <View
        style={styles.scope}
        onLayout={(e: LayoutChangeEvent) => setScopeW(e.nativeEvent.layout.width)}
      >
        <Svg width='100%' height='100%' viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio='none'>
          {GRID_XS.map((x) => (
            <Line key={x} x1={x} y1={0} x2={x} y2={VB_H} stroke={colors.hairlineDim} strokeWidth={1} />
          ))}
          <Line
            x1={0}
            y1={VB_H / 2}
            x2={VB_W}
            y2={VB_H / 2}
            stroke={colors.steelBorder}
            strokeWidth={1}
            strokeDasharray='4 4'
          />
          <Polyline points={BURST_POINTS} fill='none' stroke={colors.cyanBright} strokeWidth={1.5} />
        </Svg>
        <Animated.View
          pointerEvents='none'
          style={[styles.cursor, { transform: [{ translateX: cursorX }] }]}
        />
      </View>

      <View style={styles.barGroup}>
        <View style={styles.barCol}>
          <View style={styles.barTrack}>
            <Animated.View
              style={[styles.barFill, styles.barFillPeak, { transform: barRise(peakLevel, BAR_H) }]}
            />
          </View>
          <Text style={styles.barLabel}>PEAK</Text>
          <Text style={[styles.barValue, { color: colors.amber }]}>{PEAK_DB_TXT}</Text>
        </View>
        <View style={styles.barCol}>
          <View style={styles.barTrack}>
            <Animated.View
              style={[styles.barFill, styles.barFillRms, { transform: barRise(rmsLevel, BAR_H) }]}
            />
          </View>
          <Text style={styles.barLabel}>RMS</Text>
          <Text style={[styles.barValue, { color: colors.green }]}>{RMS_DB_TXT}</Text>
        </View>
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Scene 2 — A vs C WEIGHTING                                          */
/* ------------------------------------------------------------------ */

function WeightingScene() {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  // Bass thump: the woofer breathes, and the C readout glows in step with it
  // (C-weighting is the one that counts that low end).
  const wooferScale = pulse.interpolate({
    inputRange: [0, 0.22, 0.5, 1],
    outputRange: [1, 1.16, 1, 1],
  });
  const cGlow = pulse.interpolate({
    inputRange: [0, 0.22, 0.5, 1],
    outputRange: [0.05, 0.3, 0.05, 0.05],
  });

  return (
    <View style={styles.sceneRoot}>
      <View style={styles.sourceRow}>
        <View style={styles.speaker}>
          <View style={styles.tweeter} />
          <Animated.View style={[styles.woofer, { transform: [{ scale: wooferScale }] }]} />
        </View>
        <View style={styles.readCard}>
          <View style={styles.readValueRow}>
            <Text style={[styles.readValue, { color: colors.blue }]}>78</Text>
            <Text style={[styles.readUnit, { color: colors.blue }]}>dBA</Text>
          </View>
          <Text style={styles.readNote}>BASS ROLLED OFF</Text>
        </View>
        <View style={styles.readCard}>
          <Animated.View
            pointerEvents='none'
            style={[StyleSheet.absoluteFill, styles.glowOrange, { opacity: cGlow }]}
          />
          <View style={styles.readValueRow}>
            <Text style={[styles.readValue, { color: colors.orange }]}>84</Text>
            <Text style={[styles.readUnit, { color: colors.orange }]}>dBC</Text>
          </View>
          <Text style={styles.readNote}>BASS COUNTED</Text>
        </View>
      </View>

      <View style={styles.curveBox}>
        <Svg width='100%' height='100%' viewBox={`0 0 ${CURVE_W} ${CURVE_H}`} preserveAspectRatio='none'>
          {CURVE_GRID_XS.map((x) => (
            <Line key={x} x1={x} y1={0} x2={x} y2={CURVE_H} stroke={colors.hairlineDim} strokeWidth={1} />
          ))}
          <Line
            x1={0}
            y1={ZERO_DB_Y}
            x2={CURVE_W}
            y2={ZERO_DB_Y}
            stroke={colors.steelBorder}
            strokeWidth={1}
            strokeDasharray='4 4'
          />
          <Polyline points={C_CURVE_POINTS} fill='none' stroke={colors.orange} strokeWidth={2} />
          <Polyline points={A_CURVE_POINTS} fill='none' stroke={colors.blue} strokeWidth={2} />
        </Svg>
        <Text style={[styles.curveTag, { color: colors.blue, top: '58%' }]}>A</Text>
        <Text style={[styles.curveTag, { color: colors.orange, top: '8%' }]}>C</Text>
      </View>
      <View style={styles.freqRow}>
        <Text style={styles.freqText}>20 Hz</Text>
        <Text style={styles.freqText}>LOG FREQUENCY</Text>
        <Text style={styles.freqText}>20 kHz</Text>
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Scene 3 — FAST vs SLOW                                              */
/* ------------------------------------------------------------------ */

function FastSlowScene() {
  const [stairW, setStairW] = useState(0);
  const master = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(master, {
        toValue: 1,
        duration: LOOP3_MS,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [master]);

  const cursorX = master.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.max(stairW - 2, 1)],
  });
  const fastLevel = master.interpolate({ inputRange: FAST_KEYS.in, outputRange: FAST_KEYS.out });
  const slowLevel = master.interpolate({ inputRange: SLOW_KEYS.in, outputRange: SLOW_KEYS.out });

  return (
    <View style={styles.sceneRoot}>
      <View
        style={styles.stair}
        onLayout={(e: LayoutChangeEvent) => setStairW(e.nativeEvent.layout.width)}
      >
        <Svg width='100%' height='100%' viewBox={`0 0 ${STAIR_W} ${STAIR_H}`} preserveAspectRatio='none'>
          <Polyline points={STAIR_POINTS} fill='none' stroke={colors.cyanBright} strokeWidth={1.5} />
        </Svg>
        <Animated.View
          pointerEvents='none'
          style={[styles.cursor, { transform: [{ translateX: cursorX }] }]}
        />
        <Text style={styles.stairTag}>SHARED PATTERN</Text>
      </View>

      <View style={styles.fsRow}>
        <View style={styles.fsCol}>
          <View style={styles.barTrackWide}>
            <Animated.View
              style={[styles.barFill, styles.barFillPeak, { transform: barRise(fastLevel, BAR3_H) }]}
            />
          </View>
          <View style={styles.fsLabelRow}>
            <Text style={styles.barLabel}>FAST</Text>
            <Text style={styles.fsTime}>125 ms</Text>
          </View>
        </View>
        <View style={styles.fsCol}>
          <View style={styles.barTrackWide}>
            <Animated.View
              style={[styles.barFill, styles.barFillSlow, { transform: barRise(slowLevel, BAR3_H) }]}
            />
          </View>
          <View style={styles.fsLabelRow}>
            <Text style={styles.barLabel}>SLOW</Text>
            <Text style={styles.fsTime}>1 s</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Panel                                                               */
/* ------------------------------------------------------------------ */

export function SplDemo() {
  const [scene, setScene] = useState(0);
  const current = SCENES[scene] ?? SCENES[0];

  return (
    <View style={styles.panel}>
      <View style={styles.chipRow}>
        {SCENES.map((s, i) => (
          <Pressable
            key={s.key}
            onPress={() => setScene(i)}
            accessibilityRole='button'
            accessibilityState={{ selected: i === scene }}
            accessibilityLabel={s.title}
            hitSlop={4}
            style={[styles.chip, i === scene && styles.chipActive]}
          >
            <Text style={[styles.chipText, i === scene && styles.chipTextActive]}>{s.chip}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.sceneTitle}>{current.title}</Text>
      <View style={styles.stage}>
        {scene === 0 ? <PeakRmsScene /> : scene === 1 ? <WeightingScene /> : <FastSlowScene />}
      </View>
      <Text style={styles.caption}>{current.caption}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    height: 356,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    padding: spacing.md,
    gap: spacing.sm,
  },

  chipRow: { flexDirection: 'row', gap: spacing.sm },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  chipActive: {
    borderColor: colors.amber,
    backgroundColor: 'rgba(255, 198, 77, 0.08)',
  },
  chipText: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 12,
    letterSpacing: 1.2,
    color: colors.textSub,
  },
  chipTextActive: { color: colors.amber },

  sceneTitle: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 12,
    letterSpacing: 1.8,
    color: colors.amberLabel,
  },

  stage: { flex: 1 },
  sceneRoot: { flex: 1, gap: spacing.sm },

  /* Scene 1 */
  peakRow: { flex: 1, flexDirection: 'row', gap: spacing.md },
  scope: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.hairlineDim,
    backgroundColor: colors.screenBgDeep,
    overflow: 'hidden',
  },
  cursor: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 2,
    backgroundColor: colors.amber,
    opacity: 0.45,
  },
  barGroup: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  barCol: { alignItems: 'center', gap: 3 },
  barTrack: {
    width: 26,
    height: BAR_H,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.hairlineDim,
    backgroundColor: colors.screenBgDeep,
    overflow: 'hidden',
  },
  barFill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: 4,
  },
  barFillPeak: { backgroundColor: colors.amber },
  barFillRms: { backgroundColor: colors.green },
  barFillSlow: { backgroundColor: colors.blue },
  barLabel: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 12,
    letterSpacing: 1.2,
    color: colors.textSub,
  },
  barValue: { fontFamily: fonts.mono, fontSize: 12 },

  /* Scene 2 */
  sourceRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'stretch' },
  speaker: {
    width: 54,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.steelBorder,
    backgroundColor: colors.screenBgDeep,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingVertical: 6,
  },
  tweeter: {
    width: 13,
    height: 13,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: colors.textMuted,
  },
  woofer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.orange,
    backgroundColor: 'rgba(255, 138, 30, 0.12)',
  },
  readCard: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.screenBgDeep,
    paddingVertical: 8,
    paddingHorizontal: 10,
    gap: 2,
    overflow: 'hidden',
  },
  glowOrange: { backgroundColor: colors.orange },
  readValueRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  readValue: { fontFamily: fonts.mono, fontSize: 24, lineHeight: 26 },
  readUnit: { fontFamily: fonts.mono, fontSize: 12, marginBottom: 2 },
  readNote: {
    fontFamily: fonts.barlowCondensedMedium,
    fontSize: 12,
    letterSpacing: 0.8,
    color: colors.textSub,
  },
  curveBox: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.hairlineDim,
    backgroundColor: colors.screenBgDeep,
    overflow: 'hidden',
  },
  curveTag: {
    position: 'absolute',
    left: '9%',
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 13,
    letterSpacing: 1,
  },
  freqRow: { flexDirection: 'row', justifyContent: 'space-between' },
  freqText: {
    fontFamily: fonts.barlowCondensedRegular,
    fontSize: 12,
    letterSpacing: 0.8,
    color: colors.textMuted,
  },

  /* Scene 3 */
  stair: {
    height: STAIR_H,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.hairlineDim,
    backgroundColor: colors.screenBgDeep,
    overflow: 'hidden',
  },
  stairTag: {
    position: 'absolute',
    top: 4,
    right: 8,
    fontFamily: fonts.barlowCondensedMedium,
    fontSize: 12,
    letterSpacing: 1,
    color: colors.textMuted,
  },
  fsRow: { flex: 1, flexDirection: 'row', gap: spacing.lg, justifyContent: 'center' },
  fsCol: { alignItems: 'center', gap: 4 },
  barTrackWide: {
    width: 44,
    height: BAR3_H,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.hairlineDim,
    backgroundColor: colors.screenBgDeep,
    overflow: 'hidden',
  },
  fsLabelRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  fsTime: { fontFamily: fonts.mono, fontSize: 12, color: colors.textSub },

  caption: {
    fontFamily: fonts.barlowRegular,
    fontSize: 13.5,
    lineHeight: 19,
    color: colors.textSecondary,
  },
});
