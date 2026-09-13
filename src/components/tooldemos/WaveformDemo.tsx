/**
 * WaveformDemo — Tool Demo: reading a waveform display (spec of record
 * docs/APE_AUDIO_TOOLS_SPEC_2026_07_23.md §11 Waveform; demo-mode rules §4 and
 * tooldemos/types.ts contract, 2026-07-23; demo design pass 2026-09-13).
 *
 * VISUAL / ANIMATED TRAINING DEMO ONLY. Every trace is drawn from fixed,
 * precomputed sample arrays (deterministic sine mixes — no audio path, no
 * Math.random, no live values, no LedMeter per spec §1.7). The hosting
 * ToolDemoScreen renders the permanent "TRAINING DEMO — NOT A LIVE
 * MEASUREMENT" badge; nothing here implies a live reading.
 *
 * Scenes: 1) CLEAN vs CLIPPED — gain toggle drives a wave into flat-topped
 * clipping; in-plot callouts name the flat tops (salmon) and the clean wave's
 * headroom margin (amber). 2) TRANSIENT vs SUSTAINED — drum spike vs pad
 * block, with ATTACK/DECAY callouts and a computed PEAK-vs-RMS compare strip
 * (both peaks near-identical, RMS ~3× apart — why waveform height is not
 * loudness). 3) ZOOM IS NOT GAIN — fixed 1× reference + zoom view; the peak
 * readout never moves with zoom, only with the LEVEL slider.
 *
 * Callout text lives in PIXEL-SPACE overlay SVGs (measured width, no viewBox)
 * so `preserveAspectRatio='none'` on the trace SVGs never distorts glyphs.
 *
 * Animation: RN core Animated only, transforms/opacity with useNativeDriver.
 */
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import Svg, { Defs, G, Line, LinearGradient, Polyline, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { WAVE_LEVEL_STOPS, rampColors } from '../../features/tools/levelColor';
import { DragSlider } from '../../screens/lab/foundations/bits';
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
const DRIVE_GAIN = 2.1; // ≈ +6.4 dB — how hard the HOT toggle pushes the wave

const SCOPE_H = 210; // scene-1 scope pixel height (brief: viz ≥ 190)
const PANE_PX_H = 150; // scene-2 pane pixel height

// Shared callout language (demo design brief 2026-09-13):
// amber = the thing being taught / correct · salmon = wrong / lost / warning ·
// steel = neutral reference. Leader lines are thin white.
const CALLOUT_AMBER = colors.amberDeep; // #ffb400
const CALLOUT_SALMON = '#ff8d7a';
const CALLOUT_STEEL = '#9aa3ad';
const LEADER = 'rgba(255,255,255,.35)';

/** Deterministic three-partial mix, |value| < 0.75 — kept under the 0.8
 *  converter ceiling so the CLEAN wave genuinely fits beneath it (F25). */
function sineMix(t: number): number {
  return (
    0.8 *
    (0.52 * Math.sin(2 * Math.PI * 3 * t) +
      0.24 * Math.sin(2 * Math.PI * 7 * t + 1.3) +
      0.14 * Math.sin(2 * Math.PI * 13 * t + 0.7))
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

/** Tallest positive peak of the clean wave — anchor for the HEADROOM bracket
 *  (measured to the global positive max, so the drawn margin is honest). */
const CLEAN_PEAK = (() => {
  let idx = 0;
  for (let i = 1; i < CLEAN_VALUES.length; i++) {
    if (CLEAN_VALUES[i] > CLEAN_VALUES[idx]) idx = i;
  }
  return { fx: idx / (CLEAN_VALUES.length - 1), v: CLEAN_VALUES[idx] };
})();

/** Widest top-side flat run — target of the FLAT TOPS callout (fractions). */
const WIDE_RUN = (() => {
  let best: ClipRun | null = null;
  for (const r of CLIP_RUNS) {
    if (r.y !== CEIL_Y_TOP) continue;
    if (!best || r.x2 - r.x1 > best.x2 - best.x1) best = r;
  }
  return best
    ? { fx1: best.x1 / VB_W, fx2: best.x2 / VB_W }
    : { fx1: 0.4, fx2: 0.6 };
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
  const env = 0.87 + 0.05 * Math.sin(2 * Math.PI * 1.2 * t + 0.4);
  return env * Math.sin(2 * Math.PI * 16 * t);
});

const TRANSIENT_POINTS = toPolyline(TRANSIENT_VALUES, PANE_W, PANE_H);
const PAD_POINTS = toPolyline(PAD_VALUES, PANE_W, PANE_H);

/** Scene 2 measurements — computed from the SAME arrays that are drawn, so the
 *  compare strip states facts about these exact pictures, nothing invented. */
const rmsOf = (a: number[]) => Math.sqrt(a.reduce((s, v) => s + v * v, 0) / a.length);
const TR_PEAK = Math.max(...TRANSIENT_VALUES.map(Math.abs)); // ≈ 0.9
const PAD_PEAK = Math.max(...PAD_VALUES.map(Math.abs)); // ≈ 0.9
const TR_RMS = rmsOf(TRANSIENT_VALUES); // ≈ 0.18
const PAD_RMS = rmsOf(PAD_VALUES); // ≈ 0.62
const ENERGY_RATIO = PAD_RMS / TR_RMS; // ≈ 3.4
const TR_SPIKE = (() => {
  let idx = 0;
  for (let i = 1; i < TRANSIENT_VALUES.length; i++) {
    if (Math.abs(TRANSIENT_VALUES[i]) > Math.abs(TRANSIENT_VALUES[idx])) idx = i;
  }
  return { fx: idx / M, v: Math.abs(TRANSIENT_VALUES[idx]) };
})();

const GRID_XS = [VB_W * 0.25, VB_W * 0.5, VB_W * 0.75];

interface SceneDef {
  key: string;
  chip: string;
  title: string;
  /** One-line WATCH FOR — the visual moment to look at (amber eyebrow). */
  watch: string;
  /** 2–4 sentences — why it matters on a real job. */
  body: string;
  /** FIELD NOTE — the classic mistake + the pro habit that avoids it. */
  note: string;
}

const SCENES: SceneDef[] = [
  {
    key: 'clip',
    chip: 'CLIPPING',
    title: 'CLEAN vs CLIPPED',
    watch: 'ROUNDED TOPS SLICE FLAT AT THE RED CEILING',
    body:
      'Press +6 dB. The wave no longer fits under the converter ceiling, so every peak that tried to pass full scale is sliced off flat — the red runs mark samples the system could not represent. Flat tops are information destroyed: pulling the level down afterward makes it quieter, but the original shape never comes back. Clean, the same wave keeps the amber HEADROOM margin under the ceiling — that gap is what protects the loudest moment of the night.',
    note:
      'One sample touching full scale is a peak, not proof of clipping — it is the flat RUNS of consecutive full-scale samples that say information was lost.',
  },
  {
    key: 'transient',
    chip: 'TRANSIENTS',
    title: 'TRANSIENT vs SUSTAINED',
    watch: 'ONE SPIKE AND GONE vs A BLOCK THAT NEVER RESTS',
    body:
      `The drum is a transient: a fast ATTACK spike, a quick DECAY, then nothing. The pad's body holds steady the whole way across. Now read the strip below — measured from these exact traces, the two PEAKS are nearly identical, but the pad carries about ${ENERGY_RATIO.toFixed(1)}× the RMS energy, and the ear follows energy, not spikes. That is why a peak meter and a waveform can both say "same level" while one source sounds far louder.`,
    note:
      'Set input headroom from the transients; judge loudness from RMS or LUFS — never from waveform height.',
  },
  {
    key: 'zoom',
    chip: 'ZOOM vs GAIN',
    title: 'ZOOM IS NOT GAIN',
    watch: 'THE PEAK READOUT NEVER MOVES WHEN ZOOM CHANGES',
    body:
      'Step ZOOM up: the picture grows taller and the cyan window on the 1× reference shrinks, but PEAK holds the exact same number — dBFS measures the signal against the digital ceiling, not against your screen. Now drag LEVEL: trace, colours, and readout all move together, because gain changes the signal itself. Zoom changes what you see; gain changes what gets recorded.',
    note:
      'Auto-normalized views stretch every file to fill the display — before comparing two waveforms by eye, lock both to the same fixed scale.',
  },
];

/* ------------------------------------------------------------------ */
/* In-plot callout label (pixel-space SVG): small-caps tag on a dark    */
/* backing chip so it stays legible over a trace.                       */
/* ------------------------------------------------------------------ */

function Callout({
  x,
  y,
  text,
  fill,
  anchor = 'start',
}: {
  x: number;
  y: number;
  text: string;
  fill: string;
  anchor?: 'start' | 'middle' | 'end';
}) {
  const wEst = text.length * 6.4 + 10; // approx Oswald 10px + letterSpacing 1
  const rx = anchor === 'start' ? x - 5 : anchor === 'end' ? x - wEst + 5 : x - wEst / 2;
  return (
    <G>
      <Rect x={rx} y={y - 11} width={wEst} height={15} rx={3} fill='#0b0c0e' opacity={0.85} />
      <SvgText
        x={x}
        y={y}
        textAnchor={anchor}
        fontFamily={fonts.oswaldSemiBold}
        fontSize={10}
        letterSpacing={1}
        fill={fill}
      >
        {text}
      </SvgText>
    </G>
  );
}

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
        duration: 4800,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [sweep]);

  // Two separate buttons (owner 2026-08-05): pressing one selects that state and
  // deselects the other. No-op if already selected.
  const setDrive = (next: boolean) => {
    if (next === hot) return;
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

  // Pixel-space geometry for the callout overlays (scope is SCOPE_H tall).
  const yOf = (v: number) => SCOPE_H / 2 - v * (SCOPE_H / 2) * Y_SCALE;
  const ceilTop = yOf(CLIP_LIMIT);
  const ceilBottom = yOf(-CLIP_LIMIT);
  const peakX = CLEAN_PEAK.fx * scopeW;
  const peakY = yOf(CLEAN_PEAK.v);
  const headroomOnLeft = CLEAN_PEAK.fx > 0.55; // flip the label away from the edge
  const runMidX = ((WIDE_RUN.fx1 + WIDE_RUN.fx2) / 2) * scopeW;
  const flatLabelX = Math.max(84, Math.min(scopeW - 88, runMidX));

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
          {/* Converter ceiling — drawn in BOTH states so the CLEAN wave can be
              seen sitting under it, as the caption claims (Bug+Hater night D1-03). */}
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
        </Svg>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: cleanOpacity }]}>
          <Svg width='100%' height='100%' viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio='none'>
            <Defs>
              <LinearGradient id='wfClipMidi' x1={0} y1={0} x2={0} y2={VB_H} gradientUnits='userSpaceOnUse'>
                {WAVE_LEVEL_STOPS.map((s) => (
                  <Stop key={s.offset} offset={s.offset} stopColor={s.color} />
                ))}
              </LinearGradient>
            </Defs>
            <Polyline points={CLEAN_POINTS} fill='none' stroke='url(#wfClipMidi)' strokeWidth={2.4} />
          </Svg>
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: drive }]}>
          <Svg width='100%' height='100%' viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio='none'>
            <Defs>
              <LinearGradient id='wfClipMidiHot' x1={0} y1={0} x2={0} y2={VB_H} gradientUnits='userSpaceOnUse'>
                {WAVE_LEVEL_STOPS.map((s) => (
                  <Stop key={s.offset} offset={s.offset} stopColor={s.color} />
                ))}
              </LinearGradient>
            </Defs>
            <Polyline points={DRIVEN_POINTS} fill='none' stroke='url(#wfClipMidiHot)' strokeWidth={2.4} />
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

        {/* ---- pixel-space callout overlays (no viewBox → no glyph stretch) ---- */}
        {scopeW > 0 ? (
          <>
            {/* Always-on: name the ceiling itself (steel = neutral reference). */}
            <View pointerEvents='none' style={StyleSheet.absoluteFill}>
              <Svg width={scopeW} height={SCOPE_H}>
                <Callout
                  x={scopeW - 8}
                  y={ceilBottom + 16}
                  anchor='end'
                  fill={CALLOUT_STEEL}
                  text='CEILING — FULL SCALE'
                />
              </Svg>
            </View>
            {/* CLEAN state: the amber headroom margin, bracketed peak → ceiling. */}
            <Animated.View pointerEvents='none' style={[StyleSheet.absoluteFill, { opacity: cleanOpacity }]}>
              <Svg width={scopeW} height={SCOPE_H}>
                <Line x1={peakX} y1={ceilTop + 1} x2={peakX} y2={peakY - 1} stroke={CALLOUT_AMBER} strokeWidth={1.5} />
                <Line x1={peakX - 4} y1={ceilTop + 1} x2={peakX + 4} y2={ceilTop + 1} stroke={CALLOUT_AMBER} strokeWidth={1.5} />
                <Line x1={peakX - 4} y1={peakY - 1} x2={peakX + 4} y2={peakY - 1} stroke={CALLOUT_AMBER} strokeWidth={1.5} />
                <Line
                  x1={headroomOnLeft ? peakX - 5 : peakX + 5}
                  y1={(ceilTop + peakY) / 2}
                  x2={headroomOnLeft ? peakX - 22 : peakX + 22}
                  y2={peakY + 14}
                  stroke={LEADER}
                  strokeWidth={1}
                />
                <Callout
                  x={headroomOnLeft ? peakX - 26 : peakX + 26}
                  y={peakY + 18}
                  anchor={headroomOnLeft ? 'end' : 'start'}
                  fill={CALLOUT_AMBER}
                  text='HEADROOM — SAFETY MARGIN'
                />
              </Svg>
            </Animated.View>
            {/* HOT state: name the flattened tops (salmon = destroyed samples). */}
            <Animated.View pointerEvents='none' style={[StyleSheet.absoluteFill, { opacity: drive }]}>
              <Svg width={scopeW} height={SCOPE_H}>
                <Line x1={flatLabelX} y1={19} x2={runMidX} y2={ceilTop - 1} stroke={LEADER} strokeWidth={1} />
                <Callout
                  x={flatLabelX}
                  y={16}
                  anchor='middle'
                  fill={CALLOUT_SALMON}
                  text='FLAT TOPS = LOST SAMPLES'
                />
              </Svg>
            </Animated.View>
          </>
        ) : null}

        <Animated.View
          pointerEvents='none'
          style={[styles.cursor, { transform: [{ translateX: cursorX }] }]}
        />
      </View>
      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>INPUT GAIN</Text>
        <View style={styles.toggleBtns}>
          <Pressable
            onPress={() => setDrive(false)}
            accessibilityRole='button'
            accessibilityState={{ selected: !hot }}
            aria-pressed={!hot}
            accessibilityLabel='Clean — 0 dB'
            hitSlop={6}
            style={[styles.toggleBtn, !hot && styles.toggleBtnCleanOn]}
          >
            <Text style={[styles.toggleValue, !hot && styles.toggleValueCleanOn]}>0 dB — CLEAN</Text>
          </Pressable>
          <Pressable
            onPress={() => setDrive(true)}
            accessibilityRole='button'
            accessibilityState={{ selected: hot }}
            aria-pressed={hot}
            accessibilityLabel='Too hot — plus 6 dB'
            hitSlop={6}
            style={[styles.toggleBtn, hot && styles.toggleBtnHotOn]}
          >
            <Text style={[styles.toggleValue, hot && styles.toggleValueHotOn]}>+6 dB — TOO HOT</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Scene 2 — TRANSIENT vs SUSTAINED                                    */
/* ------------------------------------------------------------------ */

const STRIP_SVG_H = 92;

/** One ramp-coloured measurement bar: the amplitude colour standard says a bar
 *  whose SIZE encodes level shows the ramp climbing base(blue) → colour(level)
 *  at the tip (owner ruling 2026-08-16 — same rule the lab faders follow). */
function MeasureBar({ id, x0, y, maxW, value }: { id: string; x0: number; y: number; maxW: number; value: number }) {
  const stops = rampColors(value, 6);
  const barW = Math.max(2, value * maxW);
  return (
    <G>
      <Defs>
        <LinearGradient id={id} x1={x0} y1={0} x2={x0 + barW} y2={0} gradientUnits='userSpaceOnUse'>
          {stops.map((c, i) => (
            <Stop key={`${id}-${i}`} offset={i / (stops.length - 1)} stopColor={c} />
          ))}
        </LinearGradient>
      </Defs>
      <Rect x={x0} y={y} width={maxW} height={7} rx={3.5} fill='rgba(255,255,255,.05)' />
      <Rect x={x0} y={y} width={barW} height={7} rx={3.5} fill={`url(#${id})`} />
    </G>
  );
}

function TransientScene() {
  const [paneW, setPaneW] = useState(0);
  const [stripW, setStripW] = useState(0);
  const sweep = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(sweep, {
        toValue: 1,
        duration: 5200,
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

  // Pixel-space geometry for the pane callouts (panes are PANE_PX_H tall).
  const yOf = (v: number) => PANE_PX_H / 2 - v * (PANE_PX_H / 2) * Y_SCALE;
  const spikeX = TR_SPIKE.fx * paneW;
  const spikeY = yOf(TR_SPIKE.v);

  // Compare-strip layout (all measured from the drawn arrays above).
  const barX0 = 46;
  const barMaxW = Math.max(10, stripW - barX0 - 8);

  return (
    <View style={styles.sceneRoot}>
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
            {paneW > 0 ? (
              <View pointerEvents='none' style={StyleSheet.absoluteFill}>
                <Svg width={paneW} height={PANE_PX_H}>
                  {/* ATTACK — the taught feature (amber). */}
                  <Line x1={spikeX + 1} y1={spikeY + 2} x2={spikeX + 18} y2={22} stroke={LEADER} strokeWidth={1} />
                  <Callout x={spikeX + 22} y={26} fill={CALLOUT_AMBER} text='ATTACK' />
                  {/* DECAY — neutral reference into the tail. */}
                  <Line x1={paneW * 0.42} y1={yOf(0.22)} x2={paneW * 0.6} y2={48} stroke={LEADER} strokeWidth={1} />
                  <Callout x={paneW * 0.6 + 4} y={52} fill={CALLOUT_STEEL} text='DECAY' />
                </Svg>
              </View>
            ) : null}
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
            {paneW > 0 ? (
              <View pointerEvents='none' style={StyleSheet.absoluteFill}>
                <Svg width={paneW} height={PANE_PX_H}>
                  {/* Envelope guide hugging the pad's peaks — the body never dips. */}
                  <Line
                    x1={paneW * 0.06}
                    y1={yOf(0.93)}
                    x2={paneW * 0.94}
                    y2={yOf(0.93)}
                    stroke={CALLOUT_AMBER}
                    strokeWidth={1}
                    strokeOpacity={0.7}
                    strokeDasharray='3 4'
                  />
                  <Callout x={paneW / 2} y={26} anchor='middle' fill={CALLOUT_AMBER} text='HOLDS STEADY' />
                </Svg>
              </View>
            ) : null}
            <View pointerEvents='none' style={[StyleSheet.absoluteFill, styles.glowBlue]} />
            <Animated.View
              pointerEvents='none'
              style={[styles.cursor, { transform: [{ translateX: headX }] }]}
            />
          </View>
        </View>
      </View>

      {/* Compare strip — PEAK vs RMS, measured from the drawn traces. This is
          the whole lesson: near-identical peaks, wildly different energy. */}
      <View
        style={styles.strip}
        onLayout={(e: LayoutChangeEvent) => setStripW(Math.round(e.nativeEvent.layout.width) - 20)}
      >
        {stripW > 0 ? (
          <Svg width={stripW} height={STRIP_SVG_H}>
            <SvgText x={0} y={11} fontFamily={fonts.oswaldSemiBold} fontSize={10} letterSpacing={1} fill={CALLOUT_STEEL}>
              PEAK — NEARLY THE SAME
            </SvgText>
            <SvgText x={2} y={26} fontFamily={fonts.mono} fontSize={10} fill={colors.textSub}>DRUM</SvgText>
            <MeasureBar id='wfBarPkT' x0={barX0} y={19} maxW={barMaxW} value={TR_PEAK} />
            <SvgText x={2} y={37} fontFamily={fonts.mono} fontSize={10} fill={colors.textSub}>PAD</SvgText>
            <MeasureBar id='wfBarPkP' x0={barX0} y={30} maxW={barMaxW} value={PAD_PEAK} />

            <SvgText x={0} y={61} fontFamily={fonts.oswaldSemiBold} fontSize={10} letterSpacing={1} fill={CALLOUT_AMBER}>
              {`RMS ENERGY — ≈${ENERGY_RATIO.toFixed(1)}× APART · WHAT THE EAR TRACKS`}
            </SvgText>
            <SvgText x={2} y={76} fontFamily={fonts.mono} fontSize={10} fill={colors.textSub}>DRUM</SvgText>
            <MeasureBar id='wfBarRmT' x0={barX0} y={69} maxW={barMaxW} value={TR_RMS} />
            <SvgText x={2} y={87} fontFamily={fonts.mono} fontSize={10} fill={colors.textSub}>PAD</SvgText>
            <MeasureBar id='wfBarRmP' x0={barX0} y={80} maxW={barMaxW} value={PAD_RMS} />
          </Svg>
        ) : null}
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Scene 3 — ZOOM IS NOT GAIN                                          */
/* ------------------------------------------------------------------ */

const ZOOM_STEPS = [1, 2, 4, 8] as const;
const ZP_H = 92; // each zoom-scene pane height (px)
const CLEAN_MAX = Math.max(...CLEAN_VALUES.map((v) => Math.abs(v))); // ≈ 0.72

/** Waveform points in pixel space at vertical gain `k` px per unit amplitude. */
function zoomPoints(w: number, level: number, k: number): string {
  const last = CLEAN_VALUES.length - 1;
  return CLEAN_VALUES.map(
    (v, i) => `${((i / last) * w).toFixed(1)},${(ZP_H / 2 - v * level * k).toFixed(1)}`,
  ).join(' ');
}

/**
 * ZOOM IS NOT GAIN (owner 2026-08-05): a fixed 1× reference on top that never
 * moves, and the live zoom view below. Raising ZOOM only magnifies the centre
 * slice — the dotted outline on the 1× view shrinks to show how much of it the
 * zoom view is displaying, and the LEVEL slider proves the signal (not the
 * picture) is what actually changes. The zoom view does NOT re-fit: at higher
 * zoom only the colour band that fits is visible (louder colours run off-frame).
 */
function ZoomScene() {
  const [zoom, setZoom] = useState(2);
  const [level, setLevel] = useState(0.7);
  const [w, setW] = useState(0);
  const full = (ZP_H / 2) * Y_SCALE; // pixels for |amp| = 1.0 at 1×
  const peakDb = 20 * Math.log10(Math.max(0.001, level * CLEAN_MAX));
  const peakStr = `${peakDb.toFixed(1).replace('-', '−')} dBFS`;
  const winH = ZP_H / zoom; // slice of the 1× view the zoom view shows

  return (
    <View style={styles.sceneRoot}>
      <View style={styles.readoutRow}>
        <Text style={styles.peakReadout}>PEAK {peakStr}</Text>
        <Text style={styles.zoomLabel}>ZOOM ×{zoom} — VIEW ONLY</Text>
      </View>

      {/* TOP — fixed 1× reference; the dotted box is the slice shown below. */}
      <Text style={styles.zPaneLabel}>1× REFERENCE — does not move</Text>
      <View style={styles.zPane} onLayout={(e: LayoutChangeEvent) => setW(Math.round(e.nativeEvent.layout.width))}>
        {w > 0 ? (
          <Svg width={w} height={ZP_H}>
            <Defs>
              <LinearGradient id='zTop' x1={0} y1={ZP_H / 2 - full} x2={0} y2={ZP_H / 2 + full} gradientUnits='userSpaceOnUse'>
                {WAVE_LEVEL_STOPS.map((s) => (
                  <Stop key={s.offset} offset={s.offset} stopColor={s.color} />
                ))}
              </LinearGradient>
            </Defs>
            <Line x1={0} y1={ZP_H / 2} x2={w} y2={ZP_H / 2} stroke={colors.steelBorder} strokeWidth={1} strokeDasharray='4 4' />
            <Polyline points={zoomPoints(w, level, full)} fill='none' stroke='url(#zTop)' strokeWidth={2} />
            {/* Visible-window outline — thinner with each higher zoom. */}
            <Rect x={1} y={ZP_H / 2 - winH / 2} width={w - 2} height={winH} rx={2} fill='none' stroke={colors.cyanBright} strokeWidth={1.5} strokeDasharray='5 4' />
            {zoom > 1 ? (
              <Callout
                x={w - 8}
                y={Math.max(12, ZP_H / 2 - winH / 2 - 4)}
                anchor='end'
                fill={colors.cyanBright}
                text='SLICE SHOWN BELOW'
              />
            ) : null}
          </Svg>
        ) : null}
      </View>

      {/* BOTTOM — the zoom view. Magnifies the centre; at high zoom the loud
          colours run off-frame (only the band that fits shows). */}
      <Text style={styles.zPaneLabel}>ZOOM ×{zoom} VIEW</Text>
      <View style={styles.zPane}>
        {w > 0 ? (
          <Svg width={w} height={ZP_H}>
            <Defs>
              <LinearGradient id='zBot' x1={0} y1={ZP_H / 2 - full * zoom} x2={0} y2={ZP_H / 2 + full * zoom} gradientUnits='userSpaceOnUse'>
                {WAVE_LEVEL_STOPS.map((s) => (
                  <Stop key={s.offset} offset={s.offset} stopColor={s.color} />
                ))}
              </LinearGradient>
            </Defs>
            <Line x1={0} y1={ZP_H / 2} x2={w} y2={ZP_H / 2} stroke={colors.steelBorder} strokeWidth={1} strokeDasharray='4 4' />
            <Polyline points={zoomPoints(w, level, full * zoom)} fill='none' stroke='url(#zBot)' strokeWidth={2} />
            {zoom > 1 ? (
              <Callout x={10} y={16} fill={CALLOUT_SALMON} text='LOOKS LOUDER — SAME SIGNAL' />
            ) : (
              <Callout x={10} y={16} fill={CALLOUT_STEEL} text='1× — MATCHES REFERENCE' />
            )}
          </Svg>
        ) : null}
      </View>

      {/* Zoom control. */}
      <View style={styles.zoomRow}>
        <Text style={styles.zoomRowLabel}>ZOOM</Text>
        {ZOOM_STEPS.map((z) => (
          <Pressable
            key={z}
            onPress={() => setZoom(z)}
            accessibilityRole='button'
            accessibilityState={{ selected: zoom === z }}
            aria-pressed={zoom === z}
            accessibilityLabel={`Zoom ${z} times`}
            style={[styles.zoomChip, zoom === z && styles.zoomChipOn]}
          >
            <Text style={[styles.zoomChipText, zoom === z && styles.zoomChipTextOn]}>×{z}</Text>
          </Pressable>
        ))}
      </View>

      {/* LEVEL slider — MIDI-coloured; this is what actually changes the signal. */}
      <DragSlider value={level} onChange={setLevel} label='LEVEL — changes the SIGNAL' readout={peakStr} levelTint />
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
      <View style={styles.chipRow} accessibilityRole='tablist'>
        {SCENES.map((s, i) => (
          <Pressable
            key={s.key}
            onPress={() => setScene(i)}
            accessibilityRole='tab'
            accessibilityState={{ selected: i === scene }}
            aria-selected={i === scene}
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
      {/* Structured caption — WATCH FOR (the visual moment) / body (why it
          matters on the job) / FIELD NOTE (the pro habit). */}
      <View style={styles.captionBlock}>
        <Text style={styles.watchFor}>WATCH FOR — {current.watch}</Text>
        <Text style={styles.caption}>{current.body}</Text>
        <Text style={styles.fieldNote}>FIELD NOTE: {current.note}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    // Auto height (design pass 2026-09-13): each scene sizes its own stage, and
    // the structured caption grows below — no more fixed 470 that clipped copy.
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    padding: spacing.md,
    gap: spacing.sm,
  },

  // Rack-key scene tabs — shared demo contract (design brief 2026-09-13).
  chipRow: { flexDirection: 'row', gap: spacing.sm },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.steelBorder,
    backgroundColor: '#141414',
  },
  chipActive: {
    borderColor: colors.amber,
    backgroundColor: 'rgba(255,180,0,.10)',
  },
  chipText: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 12,
    letterSpacing: 1.2,
    color: colors.textMuted,
  },
  chipTextActive: { color: colors.amber },

  sceneTitle: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 12,
    letterSpacing: 1.8,
    color: colors.amberLabel,
  },

  stage: {},
  sceneRoot: { gap: spacing.sm },

  // Recessed glass instrumentation frame — shared demo contract.
  scope: {
    height: SCOPE_H,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,.07)',
    backgroundColor: '#0b0c0e',
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

  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggleLabel: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 12,
    letterSpacing: 1.5,
    color: colors.textSub,
  },
  // Two mutually-exclusive buttons (owner 2026-08-05): both always visible, the
  // active one lit (CLEAN green / TOO HOT red).
  toggleBtns: { flexDirection: 'row', gap: 8 },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    backgroundColor: '#161616',
  },
  toggleBtnCleanOn: { borderColor: colors.green, backgroundColor: 'rgba(55, 224, 95, 0.12)' },
  toggleBtnHotOn: { borderColor: colors.red, backgroundColor: 'rgba(255, 75, 58, 0.12)' },
  toggleValue: { fontFamily: fonts.mono, fontSize: 12, color: colors.textSub },
  toggleValueCleanOn: { color: colors.green },
  toggleValueHotOn: { color: colors.red },

  paneRow: { flexDirection: 'row', gap: spacing.sm },
  pane: { flex: 1, gap: 5 },
  paneLabel: {
    fontFamily: fonts.barlowCondensedSemiBold,
    fontSize: 12,
    letterSpacing: 1.2,
    color: colors.textSub,
  },
  paneScope: {
    height: PANE_PX_H,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,.07)',
    backgroundColor: '#0b0c0e',
    overflow: 'hidden',
  },
  flashGreen: { backgroundColor: colors.green },
  glowBlue: { backgroundColor: colors.blue, opacity: 0.06 },

  // Scene-2 compare strip — same recessed glass as the scopes.
  strip: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,.07)',
    backgroundColor: '#0b0c0e',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },

  readoutRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  peakReadout: { fontFamily: fonts.mono, fontSize: 13, color: colors.amber },
  zoomLabel: { fontFamily: fonts.mono, fontSize: 13, color: colors.cyanBright },

  // Zoom scene — stacked 1× reference + zoom view + controls (owner 2026-08-05).
  zPaneLabel: { fontFamily: fonts.barlowCondensedSemiBold, fontSize: 12, letterSpacing: 1.1, color: colors.textSub },
  zPane: {
    height: ZP_H,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,.07)',
    backgroundColor: '#0b0c0e',
    overflow: 'hidden',
  },
  zoomRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  zoomRowLabel: { width: 44, fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.textSub },
  zoomChip: {
    flex: 1,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    backgroundColor: '#161616',
    paddingVertical: 6,
    alignItems: 'center',
  },
  zoomChipOn: { borderColor: 'rgba(127,212,255,.7)', backgroundColor: '#0d151a' },
  zoomChipText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1, color: colors.textSub },
  zoomChipTextOn: { color: colors.cyanBright },

  // Structured caption (shared demo contract 2026-09-13).
  captionBlock: { gap: 4 },
  watchFor: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 11,
    letterSpacing: 1.6,
    color: colors.amber,
  },
  caption: {
    fontFamily: fonts.barlowRegular,
    fontSize: 13.5,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  fieldNote: {
    fontFamily: fonts.barlowRegular,
    fontSize: 12.5,
    lineHeight: 17,
    fontStyle: 'italic',
    color: colors.textMuted,
  },
});
