/**
 * WaveformDemo — Tool Demo: reading a waveform display (spec of record
 * docs/APE_AUDIO_TOOLS_SPEC_2026_07_23.md §11 Waveform; demo-mode rules §4 and
 * tooldemos/types.ts contract, 2026-07-23).
 *
 * VISUAL / ANIMATED TRAINING DEMO ONLY. Every trace is drawn from fixed,
 * precomputed sample arrays (deterministic sine mixes — no audio path, no
 * Math.random, no live values, no LedMeter per spec §1.7). The hosting
 * ToolDemoScreen renders the permanent "TRAINING DEMO — NOT A LIVE
 * MEASUREMENT" badge; nothing here implies a live reading.
 *
 * Scenes: 1) CLEAN vs CLIPPED — gain toggle drives a wave into flat-topped
 * clipping with red clip markers. 2) TRANSIENT vs SUSTAINED — drum-hit
 * spike-and-decay next to a steady pad. 3) ZOOM IS NOT GAIN — vertical view
 * zoom animates while the dBFS peak readout stays identical.
 *
 * Animation: RN core Animated only, transforms/opacity with useNativeDriver.
 */
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import Svg, { Line, Polyline } from 'react-native-svg';
import { colors, fonts, spacing } from '../../theme/tokens';

/* ------------------------------------------------------------------ */
/* Fixed, precomputed waveform data (deterministic — computed once at   */
/* module load; the demo never samples anything at render time).        */
/* ------------------------------------------------------------------ */

const VB_W = 320; // scope viewBox width
const VB_H = 150; // scope viewBox height
const PANE_W = 150; // half-pane viewBox width (scene 2)
const PANE_H = 110; // half-pane viewBox height (scene 2)
const Y_SCALE = 0.95; // headroom so strokes never kiss the frame
const CLIP_LIMIT = 0.8; // normalized "converter ceiling" for scene 1
const DRIVE_GAIN = 2.1; // how hard the HOT toggle pushes the clean wave

/** Deterministic three-partial mix, |value| < 0.9. */
function sineMix(t: number): number {
  return (
    0.52 * Math.sin(2 * Math.PI * 3 * t) +
    0.24 * Math.sin(2 * Math.PI * 7 * t + 1.3) +
    0.14 * Math.sin(2 * Math.PI * 13 * t + 0.7)
  );
}

function clampToCeiling(v: number): number {
  return Math.max(-CLIP_LIMIT, Math.min(CLIP_LIMIT, v));
}

/** Map normalized samples (-1..1) to an SVG polyline points string. */
function toPolyline(values: number[], w: number, h: number): string {
  const last = values.length - 1;
  return values
    .map((v, i) => `${((i / last) * w).toFixed(2)},${(h / 2 - v * (h / 2) * Y_SCALE).toFixed(2)}`)
    .join(' ');
}

const N = 120;
const CLEAN_VALUES: number[] = Array.from({ length: N + 1 }, (_, i) => sineMix(i / N));
const DRIVEN_VALUES: number[] = CLEAN_VALUES.map((v) => clampToCeiling(v * DRIVE_GAIN));

const CLEAN_POINTS = toPolyline(CLEAN_VALUES, VB_W, VB_H);
const DRIVEN_POINTS = toPolyline(DRIVEN_VALUES, VB_W, VB_H);

const CEIL_Y_TOP = VB_H / 2 - CLIP_LIMIT * (VB_H / 2) * Y_SCALE;
const CEIL_Y_BOTTOM = VB_H / 2 + CLIP_LIMIT * (VB_H / 2) * Y_SCALE;

interface ClipRun {
  x1: number;
  x2: number;
  y: number;
}

/** Flat-top runs where the driven wave sits pinned at the ceiling. */
const CLIP_RUNS: ClipRun[] = (() => {
  const runs: ClipRun[] = [];
  const last = CLEAN_VALUES.length - 1;
  let start = -1;
  let sign = 0;
  for (let i = 0; i <= last + 1; i++) {
    const raw = i <= last ? CLEAN_VALUES[i] * DRIVE_GAIN : 0;
    const s = Math.abs(raw) >= CLIP_LIMIT ? Math.sign(raw) : 0;
    if (s === sign) continue;
    if (sign !== 0 && start >= 0 && i - start >= 2) {
      runs.push({
        x1: (start / last) * VB_W,
        x2: ((i - 1) / last) * VB_W,
        y: sign > 0 ? CEIL_Y_TOP : CEIL_Y_BOTTOM,
      });
    }
    sign = s;
    start = s !== 0 ? i : -1;
  }
  return runs;
})();

/** Scene 2 — drum hit: fast attack at t≈0.06 then exponential decay. */
const M = 140;
const TRANSIENT_VALUES: number[] = Array.from({ length: M + 1 }, (_, i) => {
  const t = i / M;
  const env = t < 0.06 ? t / 0.06 : Math.exp(-(t - 0.06) * 6);
  return env * Math.sin(2 * Math.PI * 26 * t) * 0.92;
});

/** Scene 2 — pad: near-constant envelope, slow wobble. */
const PAD_VALUES: number[] = Array.from({ length: M + 1 }, (_, i) => {
  const t = i / M;
  const env = 0.55 + 0.05 * Math.sin(2 * Math.PI * 1.2 * t + 0.4);
  return env * Math.sin(2 * Math.PI * 16 * t);
});

const TRANSIENT_POINTS = toPolyline(TRANSIENT_VALUES, PANE_W, PANE_H);
const PAD_POINTS = toPolyline(PAD_VALUES, PANE_W, PANE_H);

/** Scene 3 — the same mix drawn small; peak derived from the actual data so
 *  the readout is honest about the drawn wave (it is still a fixed demo). */
const ZOOM_VALUES: number[] = CLEAN_VALUES.map((v) => v * 0.3);
const ZOOM_POINTS = toPolyline(ZOOM_VALUES, VB_W, VB_H);
const ZOOM_PEAK_DB = `${(20 * Math.log10(Math.max(...ZOOM_VALUES.map(Math.abs))))
  .toFixed(1)
  .replace('-', '−')} dBFS`;

const GRID_XS = [VB_W * 0.25, VB_W * 0.5, VB_W * 0.75];

interface SceneDef {
  key: string;
  chip: string;
  title: string;
  caption: string;
}

const SCENES: SceneDef[] = [
  {
    key: 'clip',
    chip: 'CLIPPING',
    title: 'CLEAN vs CLIPPED',
    caption:
      'A clean wave fits under the converter ceiling. Push the gain too hot and the tops flatten — the red bars mark samples the system could not represent.',
  },
  {
    key: 'transient',
    chip: 'TRANSIENTS',
    title: 'TRANSIENT vs SUSTAINED',
    caption:
      'A drum hit is a transient: one fast spike, then a quick decay. A pad is sustained: energy holds steady over time. Similar peaks can carry very different energy.',
  },
  {
    key: 'zoom',
    chip: 'ZOOM vs GAIN',
    title: 'ZOOM IS NOT GAIN',
    caption:
      'Vertical zoom only stretches the picture — the peak readout never moves. Zoom changes what you see; gain changes the signal itself.',
  },
];

/* ------------------------------------------------------------------ */
/* Scene 1 — CLEAN vs CLIPPED                                          */
/* ------------------------------------------------------------------ */

function ClipScene() {
  const [hot, setHot] = useState(false);
  const [scopeW, setScopeW] = useState(0);
  const drive = useRef(new Animated.Value(0)).current;
  const sweep = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(sweep, {
        toValue: 1,
        duration: 3200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [sweep]);

  const onToggle = () => {
    const next = !hot;
    setHot(next);
    Animated.timing(drive, {
      toValue: next ? 1 : 0,
      duration: 420,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  const cleanOpacity = drive.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  const cursorX = sweep.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.max(scopeW - 2, 1)],
  });

  return (
    <View style={styles.sceneRoot}>
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
        </Svg>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: cleanOpacity }]}>
          <Svg width='100%' height='100%' viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio='none'>
            <Polyline points={CLEAN_POINTS} fill='none' stroke={colors.green} strokeWidth={2} />
          </Svg>
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: drive }]}>
          <Svg width='100%' height='100%' viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio='none'>
            <Line
              x1={0}
              y1={CEIL_Y_TOP}
              x2={VB_W}
              y2={CEIL_Y_TOP}
              stroke={colors.red}
              strokeWidth={1}
              strokeOpacity={0.35}
              strokeDasharray='5 5'
            />
            <Line
              x1={0}
              y1={CEIL_Y_BOTTOM}
              x2={VB_W}
              y2={CEIL_Y_BOTTOM}
              stroke={colors.red}
              strokeWidth={1}
              strokeOpacity={0.35}
              strokeDasharray='5 5'
            />
            <Polyline points={DRIVEN_POINTS} fill='none' stroke={colors.orange} strokeWidth={2} />
            {CLIP_RUNS.map((r) => (
              <Line
                key={`${r.x1}-${r.y}`}
                x1={r.x1}
                y1={r.y}
                x2={r.x2}
                y2={r.y}
                stroke={colors.red}
                strokeWidth={3.5}
                strokeLinecap='round'
              />
            ))}
          </Svg>
        </Animated.View>
        <Animated.View
          pointerEvents='none'
          style={[styles.cursor, { transform: [{ translateX: cursorX }] }]}
        />
        <Animated.View pointerEvents='none' style={[styles.clipTag, { opacity: drive }]}>
          <Text style={styles.clipTagText}>CLIP</Text>
        </Animated.View>
      </View>
      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>INPUT GAIN</Text>
        <Pressable
          onPress={onToggle}
          accessibilityRole='button'
          accessibilityState={{ selected: hot }}
          accessibilityLabel={hot ? 'Input gain hot, tap for clean' : 'Input gain clean, tap to drive hot'}
          hitSlop={6}
          style={[styles.toggleBtn, hot && styles.toggleBtnHot]}
        >
          <Text style={[styles.toggleValue, hot && styles.toggleValueHot]}>
            {hot ? '+12 dB — TOO HOT' : '0 dB — CLEAN'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Scene 2 — TRANSIENT vs SUSTAINED                                    */
/* ------------------------------------------------------------------ */

function TransientScene() {
  const [paneW, setPaneW] = useState(0);
  const sweep = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(sweep, {
        toValue: 1,
        duration: 2600,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [sweep]);

  const headX = sweep.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.max(paneW - 2, 1)],
  });
  // Flash when the playhead crosses the drum-hit spike (t ≈ 0.06).
  const flash = sweep.interpolate({
    inputRange: [0, 0.04, 0.09, 0.3, 1],
    outputRange: [0, 0, 0.3, 0, 0],
  });

  return (
    <View style={styles.paneRow}>
      <View style={styles.pane}>
        <Text style={styles.paneLabel}>TRANSIENT — DRUM HIT</Text>
        <View
          style={styles.paneScope}
          onLayout={(e: LayoutChangeEvent) => setPaneW(e.nativeEvent.layout.width)}
        >
          <Svg width='100%' height='100%' viewBox={`0 0 ${PANE_W} ${PANE_H}`} preserveAspectRatio='none'>
            <Line
              x1={0}
              y1={PANE_H / 2}
              x2={PANE_W}
              y2={PANE_H / 2}
              stroke={colors.steelBorder}
              strokeWidth={1}
              strokeDasharray='4 4'
            />
            <Polyline points={TRANSIENT_POINTS} fill='none' stroke={colors.green} strokeWidth={1.5} />
          </Svg>
          <Animated.View
            pointerEvents='none'
            style={[StyleSheet.absoluteFill, styles.flashGreen, { opacity: flash }]}
          />
          <Animated.View
            pointerEvents='none'
            style={[styles.cursor, { transform: [{ translateX: headX }] }]}
          />
        </View>
      </View>
      <View style={styles.pane}>
        <Text style={styles.paneLabel}>SUSTAINED — PAD</Text>
        <View style={styles.paneScope}>
          <Svg width='100%' height='100%' viewBox={`0 0 ${PANE_W} ${PANE_H}`} preserveAspectRatio='none'>
            <Line
              x1={0}
              y1={PANE_H / 2}
              x2={PANE_W}
              y2={PANE_H / 2}
              stroke={colors.steelBorder}
              strokeWidth={1}
              strokeDasharray='4 4'
            />
            <Polyline points={PAD_POINTS} fill='none' stroke={colors.blue} strokeWidth={1.5} />
          </Svg>
          <View pointerEvents='none' style={[StyleSheet.absoluteFill, styles.glowBlue]} />
          <Animated.View
            pointerEvents='none'
            style={[styles.cursor, { transform: [{ translateX: headX }] }]}
          />
        </View>
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Scene 3 — ZOOM IS NOT GAIN                                          */
/* ------------------------------------------------------------------ */

function ZoomScene() {
  const zoom = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(zoom, {
          toValue: 1,
          duration: 900,
          delay: 1000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(zoom, {
          toValue: 0,
          duration: 900,
          delay: 1300,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [zoom]);

  const scaleY = zoom.interpolate({ inputRange: [0, 1], outputRange: [1, 3] });
  const outOpacity = zoom.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });

  return (
    <View style={styles.sceneRoot}>
      <View style={styles.readoutRow}>
        <Text style={styles.peakReadout}>PEAK {ZOOM_PEAK_DB}</Text>
        <View>
          <Animated.View style={{ opacity: outOpacity }}>
            <Text style={styles.zoomLabel}>ZOOM 1.0x</Text>
          </Animated.View>
          <Animated.View style={[styles.zoomLabelOverlay, { opacity: zoom }]}>
            <Text style={styles.zoomLabel}>ZOOM 3.0x</Text>
          </Animated.View>
        </View>
      </View>
      <View style={styles.scope}>
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
        </Svg>
        <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ scaleY }] }]}>
          <Svg width='100%' height='100%' viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio='none'>
            <Polyline points={ZOOM_POINTS} fill='none' stroke={colors.cyanBright} strokeWidth={1.8} />
          </Svg>
        </Animated.View>
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Panel                                                               */
/* ------------------------------------------------------------------ */

export function WaveformDemo() {
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
        {scene === 0 ? <ClipScene /> : scene === 1 ? <TransientScene /> : <ZoomScene />}
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
  clipTag: { position: 'absolute', top: 6, right: 8 },
  clipTagText: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 12,
    letterSpacing: 1.5,
    color: colors.red,
  },

  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggleLabel: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 12,
    letterSpacing: 1.5,
    color: colors.textSub,
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: colors.green,
    backgroundColor: 'rgba(55, 224, 95, 0.08)',
  },
  toggleBtnHot: {
    borderColor: colors.red,
    backgroundColor: 'rgba(255, 75, 58, 0.1)',
  },
  toggleValue: { fontFamily: fonts.mono, fontSize: 12, color: colors.green },
  toggleValueHot: { color: colors.red },

  paneRow: { flex: 1, flexDirection: 'row', gap: spacing.sm },
  pane: { flex: 1, gap: 5 },
  paneLabel: {
    fontFamily: fonts.barlowCondensedSemiBold,
    fontSize: 12,
    letterSpacing: 1.2,
    color: colors.textSub,
  },
  paneScope: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.hairlineDim,
    backgroundColor: colors.screenBgDeep,
    overflow: 'hidden',
  },
  flashGreen: { backgroundColor: colors.green },
  glowBlue: { backgroundColor: colors.blue, opacity: 0.06 },

  readoutRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  peakReadout: { fontFamily: fonts.mono, fontSize: 13, color: colors.amber },
  zoomLabel: { fontFamily: fonts.mono, fontSize: 13, color: colors.cyanBright },
  zoomLabelOverlay: { position: 'absolute', top: 0, right: 0 },

  caption: {
    fontFamily: fonts.barlowRegular,
    fontSize: 13.5,
    lineHeight: 19,
    color: colors.textSecondary,
  },
});
