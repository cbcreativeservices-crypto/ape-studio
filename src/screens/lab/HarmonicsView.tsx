/**
 * HarmonicsView — the Ear Lab's hear-see-control HARMONICS centerpiece
 * (Explore panel; modeled on the owner's desktop-analyzer reference).
 *
 * THREE LINKED PANELS share ONE frequency axis with TWO scales (chip toggle):
 *  - LOG (default — the RX-style reference view): f0/1.5 → 13.5×f0, each
 *    octave equal height, plus a vertical PIANO-KEY gutter on the right edge
 *    so harmonics visibly line up with note pitches (the key nearest each
 *    n×f0 carries a subtle amber tint). Display-only — keys take no touch.
 *  - LIN: 0 → 13×f0, harmonics 1..12 evenly spaced (the original behavior;
 *    a piano is meaningless on a linear axis, so the gutter hides there).
 *  - MAIN: spectrogram — frequency vertical, time horizontal, heatmap color;
 *  - RIGHT: spectrum slice ROTATED onto the same frequency axis — lobes reach
 *    right with level;
 *  - BOTTOM: waveform strip. Markers "n: hz · note ±¢" label n×f0 on the axis
 *    (nearest equal-tempered note + signed cents, both scales).
 *
 * TWO MODES (integrity rules, measurement-tools §1.7):
 *  1. ANALYTIC (default) — an EDITABLE 12-harmonic additive model
 *     (harmonicModel.ts), NO mic, nothing measured. Preset chips load the
 *     canonical series (sine/square/triangle/saw/pulse + four SIMPLIFIED
 *     INSTRUCTIONAL clipping/saturation recipes) into the model; the stem
 *     editor (HarmonicStems) drags per-harmonic level, and its long-press
 *     detail sheet edits phase/polarity/enable/mute. The bands, lobes, and
 *     drawn waveform all derive FROM THE MODEL, so every edit re-renders all
 *     three linked panels; HarmonicCard shows the selected harmonic's
 *     identity (HV-1 Build A). The model carries the
 *     permanent "ANALYTIC MODEL — NOT A MEASUREMENT" badge (the TRAINING DEMO
 *     badge idiom) and an Animated playhead sweep for visual pacing (native
 *     driver — zero re-renders). AUDIO (HV-2): on the additive-capable
 *     engine (engineVersion ≥ 3) PLAY MODEL sounds the CURRENT 12-harmonic
 *     set as REAL band-limited additive audio through the ApeDsp generator
 *     (−20 dBFS Q4 default, cap untouched; the core peak-normalizes the sum
 *     and omits above-Nyquist harmonics), behind the audio-output gate, with
 *     live edits streaming through a throttled funnel. On a v2 engine PLAY
 *     TONE keeps the fundamental-sine fallback, and a persistent note states
 *     the audio is a pure sine when a non-sine series is displayed.
 *  2. LIVE ("REAL SIGNAL") — engine-gated real capture: the same sine plays
 *     while the mic is analyzed, and real harmonic-distortion products from
 *     the speaker/room/mic line up with the markers (that is the lesson).
 *     Labeled dBFS · uncalibrated; empty/awaiting state until real frames
 *     arrive — never a fabricated column.
 *
 * Perf: useDspEngine handles capture lifecycle + the 15 Hz meter/waveform
 * poll; the spectrogram polls getSpectrum() on its OWN 150 ms (~6.7 Hz)
 * interval (SpectrogramScreen pattern). SVG BATCHING CHOICE: the live
 * heatmap is 96 rows × ≤120 columns — far too many individual <Rect>s — so
 * cells are bucketed BY COLOR STEP into at most 8 <Path>s total (one per
 * RX-ramp step, vertical stroke segments per cell, WaveformScreen's
 * stroke-segment idiom; node count = steps, independent of cell count).
 * The heatmap component is React.memo keyed by the history reference, so
 * the 15 Hz poll never rebuilds it (~6.7 Hz only). Log row-bucket edges are
 * cached per (f0, Nyquist) — never rebuilt per frame.
 *
 * Sound lifecycle: every start passes requestAudioOutput(); a 2 Hz
 * noteAudioActivity() keepalive runs while the tone sounds (SignalGen idiom);
 * the generator stops on STOP, mode switch, blur (useFocusEffect), and
 * unmount. Capture teardown on blur/unmount is useDspEngine's.
 *
 * HV-1 BUILD B layers on the editable model:
 *  - ODD/EVEN group controls: highlight toggle (orange=odd / blue=even tint
 *    on stems + analytic bands/lobes, with a legend), SOLO ODD/EVEN (mute
 *    the complement — H1 counts as odd; pressing the active solo unsolos),
 *    MUTE ODD/EVEN (group toggles), NORMALIZE (max amp → 1), RESTORE
 *    (re-apply the active preset).
 *  - Stem-editor OVERLAYS: ENVELOPE (line tracing contributing stem tops +
 *    "≈ N dB per octave" from the least-squares fit, guarded at ≥3
 *    qualifying harmonics) and SPACING (ticks + the even-spacing teaching
 *    line; LIN shows it visually, LOG bunches musically).
 *  - MEASUREMENTS row: THD % / THD dB / crest factor / dB-per-octave slope,
 *    with a tap-open breakdown sheet showing the actual formula and every
 *    per-harmonic component. THD+N is shown as "live measurement required"
 *    — the analytic model has no noise, so a number would be fabricated.
 *  - A/B: SNAPSHOT A stores the current set; the A/B toggle overlays it as
 *    dashed ghosts (stem tops + waveform) while B stays editable.
 *  - SOLO HARMONIC AUDIO — the one new sound: harmonic n as a REAL sine at
 *    n×f0 through the SAME tone path (gate → genSet/genStart → generation
 *    counter → keepalive). No second audio lifecycle: solo stops via the
 *    existing stop paths (solo again, another solo, card close, f0/preset
 *    change, mode switch, blur, unmount).
 *
 * HV-2 BUILD 3 — the additive engine LANDED (engineVersion ≥ 3): PLAY MODEL
 * plays the full mixture (enabled && !muted stems with their amps/phases)
 * via GEN_MODES.additive through the SAME gate + toneGenRef lifecycle; live
 * edits re-send the 25-number payload through a ≤15/s trailing-edge funnel;
 * solo stays the sine path on EVERY engine version (one mechanism — a sine
 * IS the exact rendering of one harmonic). v2/absent engines keep the exact
 * prior behavior and honesty notes (graceful fallback, nothing breaks).
 */
import { memo, useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { Animated, Easing, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import Svg, { Defs, Line, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { ApeDsp, GEN_MODES, type EngineConfig, type GenParams } from '../../../modules/ape-dsp';
import { GlassButton } from '../../components/GlassButton';
import { useAudioOutputGate } from '../../features/audio/AudioOutputGate';
import { isFeedbackAllowed, noteAudioActivity, useFeedbackAllowed } from '../../features/audio/audioOutputStore';
import { FeedbackAllowRow } from '../../features/audio/FeedbackAllowRow';
import { guardToneLevelForEngine, LOW_FREQ_ADVISORY } from '../../features/audio/speakerSafety';
import { meterWarningFlags, useDspEngine } from '../../features/tools/engine/useDspEngine';
import { MIDLINE_BLUE, WAVE_LEVEL_STOPS } from '../../features/tools/levelColor';
import { WARNING_INFO } from '../../features/tools/measure/types';
import { EngineGate } from '../tools/EngineGate';
import { GuidedLessonSheet, getLabLesson, DisplayGuideButton } from '../../features/lab/guidedLessons';
import { colors, fonts } from '../../theme/tokens';
import {
  additivePayload,
  AMP_FLOOR,
  BLACK_PC,
  buildPreset,
  crestFactorDb,
  DBC_FLOOR_DB,
  dbcOf,
  effectiveAmp,
  envelopeSlopeDbPerOct,
  hasOvertones,
  midiToHz,
  normalizeSet,
  noteInfo,
  PRESETS,
  synthWaveform,
  thd,
  type Harmonic,
  type HarmonicSet,
  type PresetKey,
} from './harmonicModel';
import { HarmonicCard } from './HarmonicCard';
import { HarmonicStems } from './HarmonicStems';

type ViewMode = 'model' | 'live';
type AxisMode = 'log' | 'lin';

/** f0 presets — 100 Hz default matches the reference labels (1: 100Hz …). */
const F0_PRESETS = [60, 80, 100, 150, 200, 300] as const;
const DEFAULT_F0 = 100;
const HARMONICS = 12; // labeled markers 1..12 at n×f0
const AXIS_MULT = 13; // LIN axis top = 13×f0 → harmonics evenly spaced
const LOG_LO_DIV = 1.5; // LOG axis bottom = f0/1.5 (guarded > 0)
const LOG_MULT = 13.5; // LOG axis top = 13.5×f0 (clamped to Nyquist in live)

// Panel geometry (portrait: top row square-ish, thin waveform strip below).
const TOP_H = 252;
const WAVE_H = 60;
const GUTTER_W = 84; // fits "12: 1.2k · G#3 +2¢" at mono 9
const PIANO_W = 30; // right-edge piano-key gutter (LOG axis only)
const MIN_LABEL_GAP = 12; // px — drop gutter labels that would overlap (LOG crowds high n)

// Analytic model display range (relative to the fundamental = 0 dB) — the
// same floor the editable model's dBc math is guarded at.
const MODEL_FLOOR_DB = DBC_FLOOR_DB;
const BAND_H = 5; // harmonic band/lobe thickness in px

// Live capture: linear downsample grid + rolling history.
const SPEC_POLL_MS = 150; // ~6.7 Hz column cadence — NOT the 15 Hz meter poll
const ROWS = 96; // frequency cells — linear grid (LIN) or log-spaced buckets (LOG)
const HIST_COLS = 120; // 120 × 0.15 s = 18 s of history
const CELL_FLOOR_DB = -100; // honest "no energy registered" cell value
const LIVE_RANGE_DB = 60; // color range below the observed maximum (legend/color math)
const LIVE_DRAW_RANGE_DB = 40; // heatmap DRAW threshold below the max — cells in the
// bottom 20 dB of the color scale are near-black on black anyway, and skipping them
// keeps columns sparse (≤8 short paths) even in quiet rooms where per-bin noise sits
// above CELL_FLOOR_DB; the legend keeps reporting the full LIVE_RANGE_DB scale.
const WAVE_BUCKETS = 120; // live waveform strip columns (50 ms buckets)

// Generator: Q4 safe default, cap never unlocked here.
const GEN_LEVEL_DB = -20;
const ACTIVITY_MS = 500; // 2 Hz noteAudioActivity keepalive (SignalGen idiom)
// HV-2 live model→engine funnel: minimum spacing between additive payload
// pushes while the model plays — 67 ms ⇒ ≤15/s, trailing edge (drags
// coalesce, the final state always lands). The core setter is UI-rate safe
// (targets only, 8 ms glides), so this is bridge-traffic hygiene, not RT
// protection.
const ADDITIVE_PUSH_MS = 67;

// Analytic sweep + synthesis.
const SWEEP_MS = 9000; // playhead loop — pure visual pacing
const WAVE_POINTS = 240; // recomputed only when the model changes — no per-frame trig
const WAVE_CYCLES = 3;

// Solo-audio honesty ceiling: never sound a clamped/aliased stand-in above
// this (well under any device Nyquist). 12 × 300 Hz = 3.6 kHz today, so the
// guard is unreachable with the current f0 presets — it protects the future.
const SOLO_MAX_HZ = 20000;
// Envelope-slope guard: a dB/oct figure from fewer than 3 qualifying
// harmonics is a line through ≤2 points — show "—" instead.
const MIN_SLOPE_HARMONICS = 3;

// Model-wave velocity-ramp axis: ±1 normalized maps to mid ∓ amp (see
// buildWavePath), so full scale sits at these y's — blue mid line → red peaks.
const WAVE_MODEL_AMP = WAVE_H / 2 - 4;
const WAVE_MODEL_Y0 = WAVE_H / 2 - WAVE_MODEL_AMP;
const WAVE_MODEL_Y1 = WAVE_H / 2 + WAVE_MODEL_AMP;

/** Waveform strip path from a ±1-normalized wave (shared by the live model
 *  wave and the A/B ghost — identical scaling so the shapes compare). */
function buildWavePath(wave: readonly number[], w: number): string {
  const mid = WAVE_H / 2;
  const amp = WAVE_MODEL_AMP;
  let d = '';
  for (let i = 0; i < wave.length; i++) {
    d += `${i === 0 ? 'M' : 'L'}${((i / (wave.length - 1)) * w).toFixed(1)},${(mid - wave[i] * amp).toFixed(1)}`;
  }
  return d;
}

/** RX-style heat ramp — black → deep navy → blue → orange → amber →
 *  near-white (black at silence = the panel background). rampColor()
 *  interpolates continuously (analytic bands/lobes); the live heatmap and
 *  legend use LIVE_STEPS discrete samples of the same ramp, so the SVG node
 *  count stays = steps regardless of cell count. */
const RAMP_RGB: readonly [number, number, number][] = [
  [0, 0, 0], // #000000
  [0, 26, 77], // #001a4d
  [10, 74, 194], // #0a4ac2
  [255, 138, 0], // #ff8a00
  [255, 194, 26], // #ffc21a
  [255, 246, 216], // #fff6d8
];
const LIVE_STEPS = 8; // discrete live-heatmap color buckets (≤8 <Path>s)

/** Intensity (0..1) → interpolated ramp color. */
function rampColor(t: number): string {
  const x = Math.min(1, Math.max(0, t)) * (RAMP_RGB.length - 1);
  const i = Math.min(RAMP_RGB.length - 2, Math.floor(x));
  const f = x - i;
  const a = RAMP_RGB[i];
  const b = RAMP_RGB[i + 1];
  const ch = (k: 0 | 1 | 2) => Math.round(a[k] + (b[k] - a[k]) * f);
  return `rgb(${ch(0)},${ch(1)},${ch(2)})`;
}

/** Discrete live-step colors, sampled at each bucket's center — module-level
 *  precompute, shared by the heatmap paths and the legend swatches. */
const STEP_COLORS: readonly string[] = Array.from({ length: LIVE_STEPS }, (_, i) =>
  rampColor((i + 0.5) / LIVE_STEPS),
);

/** Per-row heatmap y endpoints, precomputed once — they depend only on the
 *  TOP_H/ROWS module constants, and stringifying them inside the cell loop
 *  would repeat up to ~23k identical toFixed calls per rebuild (toFixed is
 *  slow on Hermes). The +0.4 px oversize kills row seams (spectrogram
 *  idiom). */
const ROW_Y_TOP: readonly string[] = Array.from({ length: ROWS }, (_, r) =>
  (TOP_H - (r + 1) * (TOP_H / ROWS)).toFixed(1),
);
const ROW_Y_BOT: readonly string[] = Array.from({ length: ROWS }, (_, r) =>
  (TOP_H - r * (TOP_H / ROWS) + 0.4).toFixed(1),
);

// Note math (noteInfo/midiToHz/BLACK_PC) and the canonical series recipes
// (incl. the corrected triangle/saw phase-sign math) moved to
// harmonicModel.ts — one source, shared with the stem editor + identity card.

/** Downsample one REAL fine-spectrum frame to ROWS linear cells over 0..fMax
 *  (max dB per cell). A row narrower than one FFT bin samples the nearest
 *  bin (a real measured value — no interpolation, no fabrication): at 96
 *  rows the low-f0 presets drop below one bin width, and without the
 *  fallback those rows would stripe at the floor forever (downsampleLog's
 *  rule, mirrored here). */
function downsampleLinear(
  spec: Float32Array,
  sampleRate: number,
  fftSize: number,
  fMax: number,
): number[] {
  const col = new Array<number>(ROWS).fill(CELL_FLOOR_DB);
  const hzPerBin = sampleRate / fftSize;
  const rowHz = fMax / ROWS;
  let i = 1;
  for (let r = 0; r < ROWS; r++) {
    const hi = (r + 1) * rowHz;
    const start = i;
    for (; i < spec.length; i++) {
      if (i * hzPerBin >= hi) break;
      if (spec[i] > col[r]) col[r] = spec[i];
    }
    if (i === start) {
      const nearest = Math.round((hi - rowHz / 2) / hzPerBin);
      if (nearest >= 1 && nearest < spec.length && spec[nearest] > col[r]) col[r] = spec[nearest];
    }
  }
  return col;
}

/** Downsample one REAL fine-spectrum frame into ROWS log-spaced buckets.
 *  `edges` is the precomputed (ROWS+1)-entry Hz boundary array (cached per
 *  f0/Nyquist — never rebuilt per frame). Max-of-bins per bucket keeps
 *  narrow harmonics visible; a bucket narrower than one FFT bin samples the
 *  nearest bin (a real measured value — no interpolation, no fabrication). */
function downsampleLog(
  spec: Float32Array,
  sampleRate: number,
  fftSize: number,
  edges: Float64Array,
): number[] {
  const col = new Array<number>(ROWS).fill(CELL_FLOOR_DB);
  const hzPerBin = sampleRate / fftSize;
  let i = Math.max(1, Math.ceil(edges[0] / hzPerBin));
  for (let r = 0; r < ROWS; r++) {
    const hi = edges[r + 1];
    const start = i;
    for (; i < spec.length; i++) {
      if (i * hzPerBin >= hi) break;
      if (spec[i] > col[r]) col[r] = spec[i];
    }
    if (i === start) {
      const nearest = Math.round((edges[r] + hi) / 2 / hzPerBin);
      if (nearest >= 1 && nearest < spec.length && spec[nearest] > col[r]) col[r] = spec[nearest];
    }
  }
  return col;
}

const trim = (s: string) => (s.includes('.') ? s.replace(/\.?0+$/, '') : s);
const hzShort = (hz: number) => (hz >= 1000 ? `${trim((hz / 1000).toFixed(1))}k` : `${hz}`);
const fmtDb = (v: number | null) => (v != null && Number.isFinite(v) ? v.toFixed(1) : '—');

function Chip({
  label,
  selected,
  onPress,
  onLongPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** Long-press → open this control's Guided Lesson (v4 MASTER §5). Optional so
   *  utility chips can opt out; when set, the hint below the controls applies. */
  onLongPress?: () => void;
}) {
  return (
    <Pressable
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={350}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={onLongPress ? `${label} — long-press for its guided lesson` : label}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

/** LIVE heatmap — 96×≤120 cells drawn as ≤8 <Path>s: cells are bucketed by
 *  colormap step and each bucket becomes ONE path of vertical stroke
 *  segments (a Path has a single stroke color, so bucketing by color is what
 *  makes the node count independent of the cell count). React.memo keyed by
 *  the history REFERENCE: the 15 Hz meter/waveform poll re-renders the
 *  parent with unchanged props, so this only rebuilds at the ~6.7 Hz column
 *  cadence. Cells at/below the DRAW floor emit nothing — background is the
 *  floor (black, the ramp's zero), never a fabricated level. The draw floor
 *  is max(observedMax − LIVE_DRAW_RANGE_DB, CELL_FLOOR_DB): sentinel
 *  "no energy registered" cells can never draw regardless of how low the
 *  color scale slides, and only cells within 40 dB of the max emit
 *  segments, keeping path strings far below the ~11.5k-cell worst case
 *  even at quiet capture levels. Color steps still map over the full
 *  LIVE_RANGE_DB scale so drawn colors match the legend. */
const LiveHeatmap = memo(function LiveHeatmap({
  history,
  observedMax,
  width,
}: {
  history: number[][];
  observedMax: number | null;
  width: number;
}) {
  if (width <= 0 || history.length === 0 || observedMax == null) return null;
  const scaleFloor = observedMax - LIVE_RANGE_DB; // color mapping — matches the legend
  const drawFloor = Math.max(observedMax - LIVE_DRAW_RANGE_DB, CELL_FLOOR_DB);
  const colW = width / HIST_COLS;
  const startCol = HIST_COLS - history.length; // newest column at the right edge
  const buckets: string[] = new Array<string>(LIVE_STEPS).fill('');
  for (let t = 0; t < history.length; t++) {
    const col = history[t];
    const x = ((startCol + t + 0.5) * colW).toFixed(1);
    for (let r = 0; r < ROWS; r++) {
      const v = col[r];
      if (v <= drawFloor) continue;
      const step = Math.min(
        LIVE_STEPS - 1,
        Math.floor(((v - scaleFloor) / LIVE_RANGE_DB) * LIVE_STEPS),
      );
      buckets[step] += `M${x},${ROW_Y_TOP[r]}L${x},${ROW_Y_BOT[r]}`;
    }
  }
  return (
    <Svg width={width} height={TOP_H}>
      {buckets.map((d, i) =>
        d === '' ? null : <Path key={STEP_COLORS[i]} d={d} stroke={STEP_COLORS[i]} strokeWidth={colW + 0.4} />,
      )}
    </Svg>
  );
});

export function HarmonicsView({
  onDragActive,
}: {
  /** Optional: stem-drag lifecycle, threaded to the host ScrollView so it
   *  can set scrollEnabled={false} during a vertical stem drag. */
  onDragActive?: (active: boolean) => void;
}) {
  const { requestAudioOutput } = useAudioOutputGate();

  // Capture lifecycle + 15 Hz meter/waveform poll (house hook: stops on
  // blur/unmount, explicit START only, permission handling inside).
  const cfg = useRef<EngineConfig>({ fftSize: 4096, spectrumEnabled: true, waveformEnabled: true }).current;
  const { state, frames, start, stop, lastError } = useDspEngine(cfg, { meter: true, waveform: true });
  const engineReady = state !== 'absent' && state !== 'spike';
  const running = state === 'running';
  // Mic↔speaker feedback override (owner request 2026-07-26). LIVE mode needs
  // the mic AND the speaker at once, so the reference tone may sound only when
  // the user has physically flipped the override; otherwise the interlock keeps
  // the speaker muted while the mic listens.
  const feedbackAllowed = useFeedbackAllowed();
  // HV-2 additive capability: engineVersion ≥ 3 = the generator has the
  // 12-harmonic additive mode. Memoized native constant — cannot change
  // within a process, so a plain read per render is free. A v2 dev client
  // keeps today's sine-only behavior + honesty notes (never crash, never
  // simulate).
  const additiveReady = ApeDsp.engineVersion() >= 3;

  const [view, setView] = useState<ViewMode>('model');
  // LOG default: the RX-style reference view (piano gutter, equal octaves).
  const [axis, setAxis] = useState<AxisMode>('log');
  const axisRef = useRef<AxisMode>('log'); // read inside the poll interval
  // THE EDITABLE MODEL (SAW default: all 12 harmonics visible — the
  // reference image's series). Preset chips REBUILD it; the stem editor
  // mutates it per harmonic. presetRef = canonical source for per-stem reset.
  const [preset, setPreset] = useState<PresetKey>('saw');
  const presetRef = useRef<PresetKey>('saw');
  const [model, setModel] = useState<HarmonicSet>(() => buildPreset('saw'));
  const [selectedN, setSelectedN] = useState<number | null>(null);
  // Build B UI state — highlight, overlays, A/B snapshot, THD sheet, solo.
  const [oddEvenHl, setOddEvenHl] = useState(false);
  const [showEnvelope, setShowEnvelope] = useState(false);
  const [showSpacing, setShowSpacing] = useState(false);
  const [snapA, setSnapA] = useState<HarmonicSet | null>(null);
  const [abOn, setAbOn] = useState(false);
  const [thdOpen, setThdOpen] = useState(false);
  // Guided Lesson sheet (v4 MASTER §5) — long-press a labeled control (or tap
  // ⓘ GUIDED LESSON) opens the Harmonic lab's lesson focused on that control.
  const [lessonKey, setLessonKey] = useState<string | undefined>(undefined);
  const [lessonOpen, setLessonOpen] = useState(false);
  const openLesson = useCallback((key?: string) => {
    setLessonKey(key);
    setLessonOpen(true);
  }, []);
  /** Solo-audible harmonic (a REAL sine at n×f0 via the shared tone path). */
  const [soloN, setSoloN] = useState<number | null>(null);
  const [f0, setF0] = useState(DEFAULT_F0);
  const f0Ref = useRef(DEFAULT_F0); // read inside the poll interval
  const [genRunning, setGenRunning] = useState(false);
  const [genError, setGenError] = useState('');
  /** True while the sounding tone IS the additive model (engine v3 only) —
   *  the live model→engine funnel and the honesty notes key off this.
   *  Every stop path clears it alongside genRunning/soloN. */
  const [additiveOn, setAdditiveOn] = useState(false);
  /** Last normalization factor published by the generator (1 = not
   *  attenuating) — polled at the keepalive cadence while the model plays;
   *  null when unknown or not playing (never a fabricated figure). */
  const [additiveNorm, setAdditiveNorm] = useState<number | null>(null);
  const [history, setHistory] = useState<number[][]>([]);
  const [nyquist, setNyquist] = useState(24000); // refreshed from real meta
  const [specW, setSpecW] = useState(0);
  const [sliceW, setSliceW] = useState(0);
  const [waveW, setWaveW] = useState(0);

  // Shared axis range. LIN: 0 → 13×f0. LOG: f0/1.5 → 13.5×f0. Both tops
  // clamp to Nyquist in live mode; the LOG bottom is guarded > 0.
  const fLo = Math.max(1, f0 / LOG_LO_DIV);
  const fHiLog = view === 'live' ? Math.min(LOG_MULT * f0, nyquist) : LOG_MULT * f0;
  const fMaxLin = view === 'live' ? Math.min(AXIS_MULT * f0, nyquist) : AXIS_MULT * f0;
  const axisTop = axis === 'log' ? fHiLog : fMaxLin;

  /** Harmonic markers n×f0 on the shared axis (skipped outside the range),
   *  each carrying its nearest-note info for the gutter + piano tint.
   *  LOG y(f) = H·(1 − (log2 f − log2 fLo)/(log2 fHi − log2 fLo)). */
  const markers = useMemo(() => {
    const lo2 = Math.log2(fLo);
    const span = Math.log2(fHiLog) - lo2;
    const yOf =
      axis === 'log' && span > 0
        ? (hz: number) => TOP_H * (1 - (Math.log2(hz) - lo2) / span)
        : (hz: number) => TOP_H - (hz / fMaxLin) * TOP_H;
    return Array.from({ length: HARMONICS }, (_, i) => i + 1)
      .map((n) => ({ n, hz: n * f0 }))
      .filter((m) => m.hz <= axisTop && (axis !== 'log' || m.hz >= fLo))
      .map((m) => ({ ...m, y: yOf(m.hz), note: noteInfo(m.hz) }));
  }, [f0, axis, fLo, fHiLog, fMaxLin, axisTop]);

  /** Model levels FROM THE EDITABLE SET: dB re full scale, floored at the
   *  display range. Disabled/muted/at-floor harmonics draw nothing — they
   *  contribute nothing (the one silence predicate, everywhere).
   *  Recomputes on model edits only; markers/pianoSvg key on f0/axis and
   *  never rebuild for an amplitude change. */
  const modelLevels = useMemo(
    () =>
      markers
        .map((m) => ({ ...m, h: model[m.n - 1] }))
        .filter((m) => effectiveAmp(m.h) > AMP_FLOOR)
        .map((m) => {
          const db = dbcOf(m.h);
          return { ...m, db, frac: (db - MODEL_FLOOR_DB) / -MODEL_FLOOR_DB };
        }),
    [markers, model],
  );

  /** Drawn model wave — additive synthesis honoring amp/phase/enable/mute
   *  (harmonicModel.synthWaveform), recomputed only on model edits. */
  const modelWave = useMemo(() => synthWaveform(model, WAVE_POINTS, WAVE_CYCLES), [model]);

  /** Crest factor of the drawn wave — surfaced so the PHASE lesson lands:
   *  phase edits change shape/peak/crest while the spectrum holds still. */
  const modelCrestDb = useMemo(() => crestFactorDb(modelWave), [modelWave]);

  /** THD of the model — the identity card shows the selected harmonic's
   *  per-component share now; Build B surfaces the full readout. */
  const modelThd = useMemo(() => thd(model), [model]);

  /** Gates the "audio plays a pure sine" honesty note — true whenever any
   *  overtone would sound (the shape!=='sine' rule, model-aware). */
  const modelHasOvertones = useMemo(() => hasOvertones(model), [model]);

  const modelWavePath = useMemo(
    () => (waveW <= 0 ? '' : buildWavePath(modelWave, waveW)),
    [modelWave, waveW],
  );

  /** A/B ghost — snapshot A (a stored copy: editing B never mutates it),
   *  drawn only while the toggle is on. Same synthesis + scaling as the
   *  live wave, dashed so before/after reads at a glance. */
  const ghost = abOn ? snapA : null;
  const ghostWavePath = useMemo(
    () => (ghost == null || waveW <= 0 ? '' : buildWavePath(synthWaveform(ghost, WAVE_POINTS, WAVE_CYCLES), waveW)),
    [ghost, waveW],
  );

  /** Odd/even group state derived FROM the mute flags (no shadow state):
   *  "solo odd" simply IS "every even muted, no odd muted" — so pressing
   *  the active solo chip again reads as active and unsolos. H1 counts as
   *  odd-order (it is the 1st harmonic). */
  const groupState = useMemo(() => {
    let oddMuted = 0;
    let evenMuted = 0;
    let oddCount = 0;
    let evenCount = 0;
    for (const h of model) {
      if (h.n % 2 === 1) {
        oddCount++;
        if (h.muted) oddMuted++;
      } else {
        evenCount++;
        if (h.muted) evenMuted++;
      }
    }
    const oddAllMuted = oddMuted === oddCount;
    const evenAllMuted = evenMuted === evenCount;
    const solo: 'odd' | 'even' | null =
      evenAllMuted && oddMuted === 0 ? 'odd' : oddAllMuted && evenMuted === 0 ? 'even' : null;
    return { oddAllMuted, evenAllMuted, solo };
  }, [model]);

  /** Envelope slope, guarded: a least-squares dB/oct through fewer than
   *  MIN_SLOPE_HARMONICS contributing (enabled, unmuted, above-floor) points
   *  is shown as "—". Same qualifier as envelopeSlopeDbPerOct and the drawn
   *  envelope — group mutes move the SLOPE readout with everything else. */
  const slopeInfo = useMemo(() => {
    const qualifying = model.filter((h) => effectiveAmp(h) > AMP_FLOOR).length;
    return {
      count: qualifying,
      slope: qualifying >= MIN_SLOPE_HARMONICS ? envelopeSlopeDbPerOct(model) : null,
    };
  }, [model]);

  /** Observed maximum across the live history — the color scale's anchor.
   *  CELL_FLOOR_DB sentinel cells are EXCLUDED: they mean "no energy
   *  registered", not a measured level, and anchoring the scale on them
   *  would slide the floor below −100 and recolor the sentinels themselves
   *  as energy (all-sentinel history → null → awaiting state, honest). */
  const observedMax = useMemo(() => {
    let m = -Infinity;
    for (const col of history) for (const v of col) if (v > CELL_FLOOR_DB && v > m) m = v;
    return Number.isFinite(m) ? m : null;
  }, [history]);

  /** Live spectrum slice — the NEWEST column as a rotated curve (level → x). */
  const liveSlicePath = useMemo(() => {
    if (view !== 'live' || sliceW <= 0 || history.length === 0 || observedMax == null) return '';
    const col = history[history.length - 1];
    const floorLevel = observedMax - LIVE_RANGE_DB;
    const cellH = TOP_H / ROWS;
    let d = '';
    for (let r = 0; r < ROWS; r++) {
      const v = col[r];
      // Sentinel cells registered nothing — pin to the floor, never a level.
      const frac =
        v <= CELL_FLOOR_DB ? 0 : Math.min(1, Math.max(0, (v - floorLevel) / LIVE_RANGE_DB));
      d += `${r === 0 ? 'M' : 'L'}${(frac * (sliceW - 2)).toFixed(1)},${(TOP_H - (r + 0.5) * cellH).toFixed(1)}`;
    }
    return d;
  }, [view, sliceW, history, observedMax]);

  /** Live waveform strip — real envelope buckets (newest-first → reversed),
   *  vertical stroke segments (WaveformScreen idiom). */
  const liveWave = useMemo(() => {
    if (view !== 'live' || waveW <= 0 || frames.waveform.length === 0) return null;
    const buckets = frames.waveform.slice(0, WAVE_BUCKETS).reverse();
    const n = buckets.length;
    let observed = 1;
    for (const b of buckets) {
      const m = Math.max(Math.abs(b.min), Math.abs(b.max));
      if (m > observed) observed = m;
    }
    const mid = WAVE_H / 2;
    const usable = mid - 3;
    const colW = waveW / WAVE_BUCKETS;
    const y = (v: number) => Math.min(WAVE_H - 1, Math.max(1, mid - (v / observed) * usable));
    let d = '';
    for (let i = 0; i < n; i++) {
      const b = buckets[i];
      const x = (waveW - (n - i - 0.5) * colW).toFixed(1);
      let y1 = y(b.max);
      let y2 = y(b.min);
      if (y2 - y1 < 1) {
        y1 -= 0.5;
        y2 += 0.5;
      }
      d += `M${x},${y1.toFixed(1)}L${x},${y2.toFixed(1)}`;
    }
    // Level-colour axis (loudness ramp keyed to amplitude — red at ±full, deep
    // green at the zero line), the SPL-VU standard shared across the app.
    return { d, strokeW: Math.max(1, colW * 0.8), gradY0: mid - usable, gradY1: mid + usable };
  }, [view, waveW, frames.waveform]);

  // ---- Analytic playhead sweep — Animated loop on the NATIVE driver (visual
  // pacing only; zero setState, zero re-renders). Gated on FOCUS too: the view
  // stays mounted on the root stack behind pushed screens, and the loop must
  // not keep compositing forever back there (same lifecycle rule as the tone).
  const isFocused = useIsFocused();
  const sweep = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (view !== 'model' || !isFocused) return;
    const anim = Animated.loop(
      Animated.timing(sweep, {
        toValue: 1,
        duration: SWEEP_MS,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    anim.start();
    return () => {
      anim.stop();
      sweep.setValue(0);
    };
  }, [view, isFocused, sweep]);

  // Log row-bucket edges cache — rebuilt only when f0/Nyquist move the
  // range (keyed), NEVER per polled frame (high-res quality bar).
  const rowEdgesRef = useRef<{ key: string; edges: Float64Array }>({
    key: '',
    edges: new Float64Array(0),
  });

  // ---- Live spectrogram poll — OWN ~6.7 Hz interval while capture runs
  // (SpectrogramScreen pattern; meter/waveform ride the hook's 15 Hz poll).
  // Axis + f0 are read through refs so toggles never churn the interval.
  useEffect(() => {
    if (view !== 'live' || state !== 'running') return;
    const id = setInterval(() => {
      const meta = ApeDsp.getSpectrumMeta();
      const spec = ApeDsp.getSpectrum();
      if (!meta || meta.sampleRate <= 0 || meta.fftSize <= 0 || spec.length === 0) return;
      const nyq = meta.sampleRate / 2;
      setNyquist(nyq);
      let col: number[];
      if (axisRef.current === 'log') {
        const lo = Math.max(1, f0Ref.current / LOG_LO_DIV);
        const hi = Math.min(LOG_MULT * f0Ref.current, nyq);
        if (hi <= lo) return;
        const key = `${lo}:${hi}`;
        if (rowEdgesRef.current.key !== key) {
          const lo2 = Math.log2(lo);
          const span = Math.log2(hi) - lo2;
          const edges = new Float64Array(ROWS + 1);
          for (let r = 0; r <= ROWS; r++) edges[r] = 2 ** (lo2 + (r / ROWS) * span);
          rowEdgesRef.current = { key, edges };
        }
        col = downsampleLog(spec, meta.sampleRate, meta.fftSize, rowEdgesRef.current.edges);
      } else {
        col = downsampleLinear(
          spec,
          meta.sampleRate,
          meta.fftSize,
          Math.min(AXIS_MULT * f0Ref.current, nyq),
        );
      }
      setHistory((h) =>
        h.length >= HIST_COLS ? [...h.slice(h.length - HIST_COLS + 1), col] : [...h, col],
      );
    }, SPEC_POLL_MS);
    return () => clearInterval(id);
  }, [view, state]);

  // 2 Hz audio-activity keepalive while the tone sounds — a legitimately
  // running tone is never idle-muted out from under the user (SignalGen).
  // While the ADDITIVE MODEL plays, the same tick polls genStatus for the
  // normalization factor, keeping the "output auto-leveled" hint honest
  // without a second interval.
  useEffect(() => {
    if (!genRunning) return;
    const t = setInterval(() => {
      noteAudioActivity();
      if (additiveOn) {
        const s = ApeDsp.genStatus();
        setAdditiveNorm(typeof s?.additiveNorm === 'number' ? s.additiveNorm : null);
      }
    }, ACTIVITY_MS);
    return () => clearInterval(t);
  }, [genRunning, additiveOn]);

  // LIVE MODEL → ENGINE funnel (HV-2): while the additive tone sounds, EVERY
  // model edit (stem drags, phase, enable/mute, group actions, normalize,
  // presets) and every f0 change lands here and re-sends the full 25-number
  // payload — the ONE update path. Full resend because the native setter is
  // all-or-nothing and `frequency` moves only the sine path; the core glides
  // amps/phases over ~8 ms and retunes f0 phase-continuously, so a resend is
  // click-free. Trailing-edge throttle at ≤15/s (ADDITIVE_PUSH_MS): each edit
  // reschedules the pending push no sooner than one period after the previous
  // push, so gesture-rate edits coalesce and the FINAL state always lands.
  // The one extra push when additiveOn first flips true merely repeats the
  // start payload (targets only — harmless, and it covers edits made while
  // the audio-output gate was up).
  // Tone generation counter (useDspEngine's start() pattern): every stop path
  // bumps it, so an in-flight genStart() that resolves AFTER a stop/blur/
  // unmount/mode-switch detects staleness and closes the native ordering hole
  // instead of leaving the tone sounding with no owning UI.
  const toneGenRef = useRef(0);
  // Start serialization: a START issued while another start is in flight is
  // DROPPED. Without this, the second start bumps the counter and the FIRST
  // start's stale-guard genStop lands after the second genStart in the
  // native queue — silencing a tone the UI then claims is running (double-
  // tap PLAY, PLAY→SOLO, SOLO A→SOLO B races). Stop paths are unaffected:
  // they bump toneGenRef only, and the guards below handle them. Handlers
  // that flip labels/flags BEFORE starting (toggleSolo, playModel) must
  // pre-check this ref and drop the press instead — see startTone's doc.
  const toneStartBusyRef = useRef(false);

  const additivePushAtRef = useRef(0);
  useEffect(() => {
    if (!additiveOn) return;
    // Stop-staleness guard: stop paths call genStop synchronously in the
    // event handler, but this effect's cleanup only runs post-commit — a
    // trailing push due inside that gap would land AFTER genStop (harmless to
    // the audio: targets only — but its noteAudioActivity() would spuriously
    // refresh the idle timer for a deliberately silenced tone). Every stop
    // path bumps toneGenRef, so compare against the generation captured at
    // schedule time and drop the push if a stop landed first.
    const gen = toneGenRef.current;
    const wait = Math.max(0, ADDITIVE_PUSH_MS - (Date.now() - additivePushAtRef.current));
    const t = setTimeout(() => {
      if (gen !== toneGenRef.current) return;
      additivePushAtRef.current = Date.now();
      // Speaker guard: re-level for f0 (a drop to a low f0 must re-attenuate)
      // alongside the phase-continuous payload re-send.
      ApeDsp.genSet({ levelDb: guardToneLevelForEngine(GEN_LEVEL_DB, f0) });
      ApeDsp.genSetAdditive(additivePayload(model, f0));
      noteAudioActivity();
    }, wait);
    return () => clearTimeout(t);
  }, [additiveOn, model, f0]);

  /** Start the REAL tone (both modes): audio-output gate first, Q4-safe
   *  default level, cap left locked. Returns true if sound is running.
   *  `params` (Build B/HV-2) retargets the SAME tone path — solo passes
   *  { frequency: n×f0 }, PLAY MODEL passes the additive mode + payload;
   *  omitted, it plays the fundamental sine as before. Returns false
   *  without side effects while another start is in flight (see
   *  toneStartBusyRef) — indistinguishable from a failure in the return
   *  value, so callers that flip labels/flags optimistically BEFORE awaiting
   *  must pre-check toneStartBusyRef and drop the press instead of starting:
   *  a busy-drop rollback would clobber the state the IN-FLIGHT start is
   *  about to make true (HV-2 Build 3 review: double-tap PLAY MODEL left
   *  additive audio sounding with additiveOn=false — dead live-edit funnel,
   *  display/audio f0 mismatch). Callers whose rollback only undoes their
   *  own optimistic flip (gate declined / start failed / went stale) stay
   *  correct because the pre-check makes a busy false unreachable for them. */
  const startTone = useCallback(async (params?: GenParams) => {
    if (toneStartBusyRef.current) return false; // dropped — a start is in flight
    toneStartBusyRef.current = true;
    try {
      const gen = ++toneGenRef.current;
      const ok = await requestAudioOutput();
      if (!ok || gen !== toneGenRef.current) return false;
      setGenError('');
      // Speaker guard: base level keyed on the frequency this start will play
      // (solo passes { frequency: n×f0 }); playModel passes its own guarded
      // levelDb in `params`, which wins via the spread.
      const guardHz = params?.frequency ?? f0Ref.current;
      ApeDsp.genSet({
        mode: GEN_MODES.sine,
        frequency: f0Ref.current,
        levelDb: guardToneLevelForEngine(GEN_LEVEL_DB, guardHz),
        ...params,
      });
      try {
        await ApeDsp.genStart();
        if (gen !== toneGenRef.current) {
          // A STOP path tore this down while starting (only stop paths can
          // bump the counter mid-start now) — close the ordering hole too.
          void ApeDsp.genStop();
          return false;
        }
        setGenRunning(true);
        noteAudioActivity();
        return true;
      } catch (e) {
        if (gen !== toneGenRef.current) return false;
        setGenError(e instanceof Error ? e.message : String(e));
        setGenRunning(false);
        return false;
      }
    } finally {
      toneStartBusyRef.current = false;
    }
  }, [requestAudioOutput]);

  const stopTone = useCallback(() => {
    toneGenRef.current++;
    void ApeDsp.genStop();
    setGenRunning(false);
    setSoloN(null); // whatever was soloing is no longer sounding
    setAdditiveOn(false); // the model tone (if any) is no longer sounding
    setAdditiveNorm(null);
  }, []);

  /** Full stop: tone + capture + history (mode switch / live STOP). */
  const stopAll = useCallback(() => {
    toneGenRef.current++;
    void ApeDsp.genStop();
    setGenRunning(false);
    setSoloN(null);
    setAdditiveOn(false);
    setAdditiveNorm(null);
    stop();
    setHistory([]);
  }, [stop]);

  /** LIVE start (explicit press): mic capture always; the reference tone only
   *  when the feedback override is on (else the interlock keeps the speaker
   *  muted while the mic listens — owner request 2026-07-26). A capture failure
   *  surfaces via the honest engine states below while the panels stay in their
   *  awaiting state. The tone follows later override flips via the sync effect. */
  const onLiveStart = useCallback(async () => {
    setHistory([]);
    void start();
    if (isFeedbackAllowed()) void startTone();
  }, [startTone, start]);

  /** LIVE tone ↔ feedback-override sync: while the mic is capturing in live
   *  mode, the reference tone sounds iff the user has accepted feedback risk.
   *  Owns the tone's genRunning state (the global MicFeedbackGuard is the
   *  belt-and-suspenders cut for every OTHER screen). */
  useEffect(() => {
    if (view !== 'live' || !running) return;
    if (feedbackAllowed && !genRunning) void startTone();
    else if (!feedbackAllowed && genRunning) stopTone();
  }, [view, running, feedbackAllowed, genRunning, startTone, stopTone]);

  const pickView = (v: ViewMode) => {
    if (v === view) return;
    stopAll(); // mode switch always silences + stops capture
    setView(v);
  };

  const pickF0 = (hz: number) => {
    setF0(hz);
    f0Ref.current = hz;
    // Axis rescales with f0 — old columns would lie about their frequency.
    setHistory([]);
    // A solo tone is pinned to n×(the OLD f0) — stop it rather than sound a
    // frequency the display no longer describes; a plain fundamental retunes.
    // The ADDITIVE model retunes through the live funnel instead (its deps
    // include f0): `frequency` moves only the sine path, so the full payload
    // is re-sent and the core retunes phase-continuously — same UX as today.
    if (soloN != null) stopTone();
    // Speaker guard: retune the sine AND re-level for the new (lower) f0.
    else if (genRunning && !additiveOn)
      ApeDsp.genSet({ frequency: hz, levelDb: guardToneLevelForEngine(GEN_LEVEL_DB, hz) });
  };

  const pickAxis = (a: AxisMode) => {
    if (a === axis) return;
    setAxis(a);
    axisRef.current = a;
    // Row buckets reinterpret under the new scale — old columns would lie.
    setHistory([]);
  };

  /** Preset chips are SHORTCUTS into the model: a chip rebuilds all 12
   *  harmonics from the canonical recipe (shape chips and presets converge).
   *  Also RESTORE's path (re-applies the active key). A preset load stops
   *  any solo tone — the sounding harmonic may not even exist in the new
   *  series. */
  const pickPreset = (key: PresetKey) => {
    presetRef.current = key;
    setPreset(key);
    setModel(buildPreset(key));
    if (soloN != null) stopTone();
  };

  /** SOLO HARMONIC AUDIO — harmonic n as a REAL sine at n×f0 through the
   *  EXISTING tone path (no second audio lifecycle). ONE mechanism on every
   *  engine version (HV-2 decision): a sine IS the exact rendering of one
   *  harmonic, so solo stays the sine path even on the additive-capable
   *  engine — soloing while the model plays switches the mode back to sine
   *  in place (retune idiom, no stop/start). Toggling the active solo stops
   *  it; another solo retunes the already-running generator. */
  const toggleSolo = (n: number) => {
    if (soloN === n) {
      stopTone();
      return;
    }
    const hz = n * f0;
    if (hz >= SOLO_MAX_HZ) return; // never sound an aliased stand-in
    // A start is already in flight (genRunning stays false until it settles):
    // our own start would be busy-dropped, and flipping soloN now would
    // mislabel the tone that start is about to produce — drop the press.
    if (!genRunning && toneStartBusyRef.current) return;
    setSoloN(n);
    if (genRunning) {
      // Leaving the additive model needs the mode switch alongside the tune.
      // Speaker guard: re-level for the solo frequency (n×f0 can be as low as f0).
      ApeDsp.genSet(
        additiveOn
          ? { mode: GEN_MODES.sine, frequency: hz, levelDb: guardToneLevelForEngine(GEN_LEVEL_DB, hz) }
          : { frequency: hz, levelDb: guardToneLevelForEngine(GEN_LEVEL_DB, hz) },
      );
      setAdditiveOn(false);
      setAdditiveNorm(null);
      noteAudioActivity();
      return;
    }
    void (async () => {
      // startTone owns the gate + generation guard; roll the label back if
      // the gate was declined or the start failed/went stale.
      if (!(await startTone({ frequency: hz }))) setSoloN((cur) => (cur === n ? null : cur));
    })();
  };

  /** PLAY MODEL (engine v3 only) — the CURRENT 12-harmonic set as REAL
   *  band-limited additive audio through the SAME tone path (gate →
   *  genSet/genStart → generation counter → keepalive; no second audio
   *  lifecycle). Pressing it over a running solo/sine retunes in place (the
   *  retune idiom) and the mixture supersedes the solo; edits while playing
   *  stream through the live funnel above. The core omits harmonics at/above
   *  Nyquist (never aliased) and peak-normalizes the sum inside the Q4 cap —
   *  the auto-level hint below reports when the norm attenuates. */
  const playModel = () => {
    if (!additiveReady) return; // v2 fallback: the button never routes here
    // A start is already in flight (genRunning stays false until it settles —
    // the button still reads PLAY MODEL through native spin-up, so a double
    // tap lands here): our own start would be busy-dropped, and its rollback
    // would strand additiveOn=false over the additive audio the FIRST start
    // is about to produce (dead live-edit funnel, sine-only pickF0 retunes
    // under an additive tone). Likewise soloN=null would unlabel an
    // in-flight solo. Drop the press instead.
    if (!genRunning && toneStartBusyRef.current) return;
    const params: GenParams = {
      mode: GEN_MODES.additive,
      additive: additivePayload(model, f0),
      // Speaker guard: key on the fundamental (the lowest content in the mix).
      levelDb: guardToneLevelForEngine(GEN_LEVEL_DB, f0),
    };
    setSoloN(null);
    setAdditiveOn(true);
    if (genRunning) {
      ApeDsp.genSet(params);
      noteAudioActivity();
      return;
    }
    void (async () => {
      // startTone owns the gate + generation guard; roll the flag back if
      // the gate was declined or the start failed/went stale.
      if (!(await startTone(params))) setAdditiveOn(false);
    })();
  };

  // ---- Odd/even GROUP actions (mute-flag semantics — enable stays the
  // user's per-harmonic edit; H1 is odd-order).
  const inGroup = (h: Harmonic, g: 'odd' | 'even') => (h.n % 2 === 1) === (g === 'odd');

  /** SOLO ODD/EVEN = mute the complement, unmute the group. Pressing the
   *  ACTIVE solo again unsolos (unmutes everything). The active check reads
   *  the updater's own set, never a stale render's groupState. */
  const soloGroup = (g: 'odd' | 'even') => {
    setModel((m) => {
      const active = m.every((h) => (inGroup(h, g) ? !h.muted : h.muted));
      return active
        ? m.map((h) => ({ ...h, muted: false }))
        : m.map((h) => ({ ...h, muted: !inGroup(h, g) }));
    });
  };

  /** MUTE ODD/EVEN toggles the whole group: all muted → unmute the group,
   *  otherwise mute it (partial states resolve toward muted). */
  const muteGroup = (g: 'odd' | 'even') => {
    setModel((m) => {
      const allMuted = m.every((h) => !inGroup(h, g) || h.muted);
      return m.map((h) => (inGroup(h, g) ? { ...h, muted: !allMuted } : h));
    });
  };

  /** NORMALIZE — scale so the largest amplitude is exactly 1 (pure model
   *  math; silent sets no-op there). */
  const normalizeModel = () => setModel((m) => normalizeSet(m));

  /** SNAPSHOT A — store a copy of the current set and show the ghost right
   *  away. A new snapshot replaces A; editing B never touches the copy. */
  const takeSnapshot = () => {
    setSnapA(model.map((h) => ({ ...h })));
    setAbOn(true);
  };

  // ---- Stem-editor mutators — functional setState only, one state update
  // per gesture-move event (HarmonicStems throttles). Stable identities so
  // drags never churn the editor's PanResponder.
  const handleSetAmp = useCallback((n: number, amp: number) => {
    setModel((m) => m.map((h) => (h.n === n ? { ...h, amp } : h)));
  }, []);
  const handleSetPhase = useCallback((n: number, phaseDeg: number) => {
    setModel((m) => m.map((h) => (h.n === n ? { ...h, phaseDeg } : h)));
  }, []);
  const handleToggleEnabled = useCallback((n: number) => {
    setModel((m) => m.map((h) => (h.n === n ? { ...h, enabled: !h.enabled } : h)));
  }, []);
  const handleToggleMuted = useCallback((n: number) => {
    setModel((m) => m.map((h) => (h.n === n ? { ...h, muted: !h.muted } : h)));
  }, []);
  /** Double-tap / detail-sheet reset: back to the ACTIVE preset's canonical
   *  value for that one harmonic. */
  const handleResetHarmonic = useCallback((n: number) => {
    const canon = buildPreset(presetRef.current)[n - 1];
    setModel((m) => m.map((h) => (h.n === n ? { ...canon } : h)));
  }, []);

  // Tone teardown on BLUR (a pushed screen must not leave the tone sounding)
  // and on unmount. Capture teardown on blur/unmount is useDspEngine's own.
  // History is cleared too: blur silently stops capture, so keeping the old
  // columns on refocus would look like a live display lying about time
  // continuity (stopAll's honesty rule, mirrored here).
  useFocusEffect(
    useCallback(
      () => () => {
        toneGenRef.current++;
        void ApeDsp.genStop();
        setGenRunning(false);
        setSoloN(null); // blur silences the solo tone with everything else
        setAdditiveOn(false); // …and the model tone (the funnel stops too)
        setAdditiveNorm(null);
        setHistory([]);
      },
      [],
    ),
  );
  useEffect(
    () => () => {
      toneGenRef.current++;
      void ApeDsp.genStop();
    },
    [],
  );

  const liveFlags = view === 'live' && running ? meterWarningFlags(frames.meter) : [];
  const soundOn = genRunning || running;

  // Markers only move on f0/nyquist changes — memoized so the ~22 Hz live
  // re-render doesn't reconcile 12 <Line>s across TWO Svg surfaces (plus the
  // 12 gutter labels) for identical props on every poll tick.
  const markerLines = useMemo(
    () =>
      markers.map((m) => (
        <Line
          key={m.n}
          x1={0}
          x2="100%"
          y1={m.y}
          y2={m.y}
          stroke="rgba(55,224,95,0.20)"
          strokeDasharray="3 5"
        />
      )),
    [markers],
  );

  // "n: hz · note ±¢" — nearest equal-tempered note + signed cents. On the
  // LOG axis high harmonics crowd (log2(12/11) of an octave apart), so
  // labels that would collide are greedily dropped low-n-first; the marker
  // LINES still show every harmonic.
  const markerLabels = useMemo(() => {
    const out: ReactElement[] = [];
    let lastY = Number.POSITIVE_INFINITY;
    for (const m of markers) {
      if (lastY - m.y < MIN_LABEL_GAP) continue;
      lastY = m.y;
      const c = m.note.cents;
      out.push(
        <Text key={m.n} style={[styles.markerLabel, { top: m.y - 6 }]} numberOfLines={1}>
          {`${m.n}: ${hzShort(m.hz)} · ${m.note.label} ${c >= 0 ? '+' : ''}${c}¢`}
        </Text>,
      );
    }
    return out;
  }, [markers]);

  /** PIANO GUTTER (LOG axis only) — one key per semitone in [fLo, fHi]; log
   *  spacing makes every octave (and so every key) equal height, RX-style.
   *  Light strip = white keys; short dark rects overlapping the left
   *  boundary = black keys; hairlines at the E/F and B/C white-white
   *  boundaries; C keys labeled; the key nearest each harmonic gets a
   *  subtle amber tint. Display-only (no touch), memoized on
   *  [axis, fLo, fHiLog, markers] — nothing rebuilds per frame. */
  const pianoSvg = useMemo(() => {
    if (axis !== 'log') return null;
    const lo2 = Math.log2(fLo);
    const span = Math.log2(fHiLog) - lo2;
    if (span <= 0) return null;
    const yOf = (hz: number) => TOP_H * (1 - (Math.log2(hz) - lo2) / span);
    const mLo = Math.ceil(69 + 12 * Math.log2(fLo / 440));
    const mHi = Math.floor(69 + 12 * Math.log2(fHiLog / 440));
    const harmonicKeys = new Set(markers.map((mk) => mk.note.midi));
    const nodes: ReactElement[] = [
      <Rect key="bg" x={0} y={0} width={PIANO_W} height={TOP_H} fill="#e7e8ec" />,
    ];
    for (let m = mLo; m <= mHi; m++) {
      const pc = ((m % 12) + 12) % 12;
      // Key slot = the semitone's span, mLo−½ → mLo+½ semitone in log-f.
      const yTop = Math.max(0, yOf(midiToHz(m + 0.5)));
      const yBot = Math.min(TOP_H, yOf(midiToHz(m - 0.5)));
      const h = yBot - yTop;
      if (h <= 0) continue;
      if (BLACK_PC.has(pc)) {
        nodes.push(
          <Rect key={`k${m}`} x={0} y={yTop} width={PIANO_W * 0.62} height={h} fill="#131318" />,
        );
      } else if (pc === 4 || pc === 11) {
        // White-white boundary above E (→F) and B (→C).
        nodes.push(
          <Line
            key={`b${m}`}
            x1={0}
            x2={PIANO_W}
            y1={yTop}
            y2={yTop}
            stroke="rgba(0,0,0,0.35)"
            strokeWidth={0.75}
          />,
        );
      }
      if (harmonicKeys.has(m)) {
        nodes.push(
          <Rect key={`h${m}`} x={0} y={yTop} width={PIANO_W} height={h} fill="rgba(255,170,0,0.4)" />,
        );
      }
      if (pc === 0) {
        nodes.push(
          <SvgText
            key={`c${m}`}
            x={PIANO_W - 3}
            y={(yTop + yBot) / 2 + 2.5}
            fontSize={7}
            fill="#3c3c44"
            textAnchor="end"
          >
            {`C${Math.floor(m / 12) - 1}`}
          </SvgText>,
        );
      }
    }
    return (
      <Svg width={PIANO_W} height={TOP_H} pointerEvents="none">
        {nodes}
      </Svg>
    );
  }, [axis, fLo, fHiLog, markers]);

  return (
    <View style={styles.wrap}>
      {/* MODE TOGGLE — analytic model vs engine-gated real signal. */}
      <View style={styles.toggleRow}>
        <Pressable
          style={[styles.toggleTab, view === 'model' && styles.toggleTabSelected]}
          onPress={() => pickView('model')}
          onLongPress={() => openLesson('view')}
          delayLongPress={300}
          accessibilityRole="button"
          accessibilityState={{ selected: view === 'model' }}
          accessibilityLabel="Analytic model mode"
        >
          <Text style={[styles.toggleText, view === 'model' && styles.toggleTextSelected]}>
            ANALYTIC MODEL
          </Text>
        </Pressable>
        <Pressable
          style={[styles.toggleTab, view === 'live' && styles.toggleTabSelected]}
          onPress={() => pickView('live')}
          onLongPress={() => openLesson('view')}
          delayLongPress={300}
          accessibilityRole="button"
          accessibilityState={{ selected: view === 'live' }}
          accessibilityLabel="Real signal mode"
        >
          <Text style={[styles.toggleText, view === 'live' && styles.toggleTextSelected]}>
            REAL SIGNAL
          </Text>
        </Pressable>
      </View>

      {/* AXIS TOGGLE — LOG (RX-style, piano gutter) vs LIN (even harmonics). */}
      <View style={styles.chipRow}>
        <Chip label="LOG ♪" selected={axis === 'log'} onPress={() => pickAxis('log')} onLongPress={() => openLesson('axis')} />
        <Chip label="LIN" selected={axis === 'lin'} onPress={() => pickAxis('lin')} onLongPress={() => openLesson('axis')} />
      </View>

      {/* INTEGRITY BADGE — permanent (TRAINING DEMO badge idiom): the model
          is math, never a measurement; live is honest dBFS, uncalibrated. */}
      {view === 'model' ? (
        <View style={styles.modelBadge}>
          <Text style={styles.modelBadgeText}>ANALYTIC MODEL — NOT A MEASUREMENT</Text>
        </View>
      ) : (
        <View style={styles.liveBadge}>
          <Text style={styles.liveBadgeText}>REAL SIGNAL — dBFS · UNCALIBRATED</Text>
        </View>
      )}

      {/* THE THREE LINKED PANELS. In LIVE mode, tapping the display toggles the
          mic capture START/STOP (owner 2026-07-31); model mode is inert. */}
      <Pressable
        style={styles.vizCard}
        onPress={
          view === 'live'
            ? () => {
                if (soundOn) stopAll();
                else void onLiveStart();
              }
            : undefined
        }
        accessibilityRole={view === 'live' ? 'button' : undefined}
        accessibilityLabel={
          view === 'live' ? (soundOn ? 'Tap to stop capture' : 'Tap to start capture') : undefined
        }
      >
        <View style={styles.topRow}>
          {/* Harmonic markers on the shared frequency axis (n: hz). */}
          <View style={styles.gutter}>{markerLabels}</View>

          {/* MAIN — spectrogram (heatmap). */}
          <View
            style={styles.specPanel}
            onLayout={(e) => setSpecW(Math.round(e.nativeEvent.layout.width))}
          >
            {specW > 0 ? (
              view === 'model' ? (
                <Svg width={specW} height={TOP_H}>
                  {markerLines}
                  {modelLevels.map((m) => (
                    <Rect
                      key={m.n}
                      x={0}
                      y={m.y - BAND_H / 2}
                      width={specW}
                      height={BAND_H}
                      // ODD/EVEN highlight tints the groups apart (legend by
                      // the toggle); otherwise the RX heat ramp by level.
                      fill={
                        oddEvenHl
                          ? m.n % 2 === 1
                            ? colors.orange
                            : colors.blue
                          : rampColor(m.frac)
                      }
                      opacity={0.35 + 0.65 * m.frac}
                    />
                  ))}
                </Svg>
              ) : (
                <>
                  <LiveHeatmap history={history} observedMax={observedMax} width={specW} />
                  <Svg width={specW} height={TOP_H} style={StyleSheet.absoluteFill}>
                    {markerLines}
                  </Svg>
                  {history.length === 0 ? (
                    <Text style={styles.awaitText}>
                      {running ? 'waiting for spectrum frames…' : 'no capture — press START below'}
                    </Text>
                  ) : null}
                </>
              )
            ) : null}
            {view === 'model' ? (
              // Sweeping playhead — visual pacing only (native-driver loop).
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.playhead,
                  {
                    transform: [
                      {
                        translateX: sweep.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, Math.max(0, specW - 2)],
                        }),
                      },
                    ],
                  },
                ]}
              />
            ) : null}
          </View>

          {/* RIGHT — spectrum slice rotated onto the shared frequency axis. */}
          <View
            style={styles.slicePanel}
            onLayout={(e) => setSliceW(Math.round(e.nativeEvent.layout.width))}
          >
            {sliceW > 0 ? (
              <Svg width={sliceW} height={TOP_H}>
                {markerLines}
                {view === 'model' ? (
                  modelLevels.map((m) => (
                    <Rect
                      key={m.n}
                      x={0}
                      y={m.y - BAND_H / 2}
                      width={Math.max(2, m.frac * (sliceW - 2))}
                      height={BAND_H}
                      fill={
                        oddEvenHl
                          ? m.n % 2 === 1
                            ? colors.orange
                            : colors.blue
                          : rampColor(m.frac)
                      }
                    />
                  ))
                ) : liveSlicePath !== '' ? (
                  <Path d={liveSlicePath} stroke={colors.greenBright} strokeWidth={1.5} fill="none" />
                ) : null}
              </Svg>
            ) : null}
          </View>

          {/* FAR RIGHT — piano-key gutter (LOG axis only; display-only). */}
          {axis === 'log' ? <View style={styles.pianoGutter}>{pianoSvg}</View> : null}
        </View>

        {/* Shared-axis captions: time under the spectrogram, level under the
            slice (flex ratios match the panels above). */}
        <View style={styles.axisRow}>
          <View style={{ width: GUTTER_W }} />
          <Text style={[styles.axisText, { flex: 1.6 }]}>
            {view === 'model'
              ? 'time → (visual sweep)'
              : `time → ~${trim(((HIST_COLS * SPEC_POLL_MS) / 1000).toFixed(1))} s`}
          </Text>
          <Text style={[styles.axisText, styles.axisTextRight, { flex: 1 }]}>
            {view === 'model' ? `${MODEL_FLOOR_DB} → 0 dB` : 'level →'}
          </Text>
          {axis === 'log' ? <View style={{ width: PIANO_W + 4 }} /> : null}
        </View>

        {/* BOTTOM — waveform strip (full width; model playhead matches the
            spectrogram sweep as a fraction of the panel). */}
        <View
          style={styles.wavePanel}
          onLayout={(e) => setWaveW(Math.round(e.nativeEvent.layout.width))}
        >
          {waveW > 0 ? (
            <Svg width={waveW} height={WAVE_H}>
              <Defs>
                {/* Model-wave gradient (static amplitude axis). */}
                <LinearGradient id="harmModelLevel" x1={0} y1={WAVE_MODEL_Y0} x2={0} y2={WAVE_MODEL_Y1} gradientUnits="userSpaceOnUse">
                  {WAVE_LEVEL_STOPS.map((s) => (
                    <Stop key={s.offset} offset={s.offset} stopColor={s.color} />
                  ))}
                </LinearGradient>
                {liveWave ? (
                  <LinearGradient
                    id="harmWaveLevel"
                    x1={0}
                    y1={liveWave.gradY0}
                    x2={0}
                    y2={liveWave.gradY1}
                    gradientUnits="userSpaceOnUse"
                  >
                    {WAVE_LEVEL_STOPS.map((s) => (
                      <Stop key={s.offset} offset={s.offset} stopColor={s.color} />
                    ))}
                  </LinearGradient>
                ) : null}
              </Defs>
              <Line x1={0} x2={waveW} y1={WAVE_H / 2} y2={WAVE_H / 2} stroke={MIDLINE_BLUE} strokeWidth={1} />
              {view === 'model' ? (
                <>
                  {/* A/B ghost first so the live edit draws on top. */}
                  {ghostWavePath !== '' ? (
                    <Path
                      d={ghostWavePath}
                      stroke="rgba(255,255,255,0.45)"
                      strokeWidth={1.2}
                      strokeDasharray="4 4"
                      fill="none"
                    />
                  ) : null}
                  {modelWavePath !== '' ? (
                    <Path d={modelWavePath} stroke="url(#harmModelLevel)" strokeWidth={1.8} fill="none" />
                  ) : null}
                </>
              ) : liveWave ? (
                <Path d={liveWave.d} stroke="url(#harmWaveLevel)" opacity={0.95} strokeWidth={liveWave.strokeW} />
              ) : null}
            </Svg>
          ) : null}
          {view === 'model' ? (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.playhead,
                {
                  transform: [
                    {
                      translateX: sweep.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, Math.max(0, waveW - 2)],
                      }),
                    },
                  ],
                },
              ]}
            />
          ) : null}
        </View>
        <Text style={styles.waveCaption}>
          {view === 'model'
            ? `waveform · ${WAVE_CYCLES} cycles · 12-harmonic model${
                modelCrestDb != null ? ` · crest ${modelCrestDb.toFixed(1)} dB` : ''
              }${ghostWavePath !== '' ? ' · dashed = snapshot A' : ''}`
            : 'waveform · live mic envelope · newest right'}
        </Text>

        {/* Color legend — model: fixed range re the fundamental; live:
            anchored to the observed max (spectrogram honesty idiom). */}
        <View style={styles.legendRow}>
          {STEP_COLORS.map((c) => (
            <View key={c} style={[styles.swatch, { backgroundColor: c }]} />
          ))}
          <Text style={styles.legendText}>
            {view === 'model'
              ? `${MODEL_FLOOR_DB} → 0 dB re full scale`
              : observedMax != null
                ? `${fmtDb(observedMax - LIVE_RANGE_DB)} → ${fmtDb(observedMax)} dBFS`
                : '—'}
          </Text>
        </View>
        <Text style={styles.scaleNote}>
          {view === 'model'
            ? 'Levels are the editable model series, relative to model full scale (0 dB = amp 1).'
            : 'Color intensity is relative to the selected scale. dBFS · uncalibrated.'}
        </Text>
        <DisplayGuideButton onPress={() => openLesson('display')} />
      </Pressable>

      {/* STEM EDITOR + IDENTITY CARD — analytic mode only. Edits mutate the
          model state; the live capture path renders from history/frames and
          is untouched by them. */}
      {view === 'model' ? (
        <>
          <HarmonicStems
            set={model}
            f0={f0}
            selectedN={selectedN}
            onSelect={setSelectedN}
            onSetAmp={handleSetAmp}
            onSetPhase={handleSetPhase}
            onToggleEnabled={handleToggleEnabled}
            onToggleMuted={handleToggleMuted}
            onResetHarmonic={handleResetHarmonic}
            onDragActive={onDragActive}
            highlightOddEven={oddEvenHl}
            showEnvelope={showEnvelope}
            showSpacing={showSpacing}
            ghostSet={ghost}
            soloN={soloN}
            canSolo={engineReady}
            onToggleSolo={toggleSolo}
          />
          {selectedN != null ? (
            <HarmonicCard
              harmonic={model[selectedN - 1]}
              f0={f0}
              thdSharePct={
                selectedN >= 2
                  ? (modelThd.perHarmonic.find((p) => p.n === selectedN)?.pct ?? null)
                  : null
              }
              soloActive={soloN === selectedN}
              canSolo={engineReady}
              onToggleSolo={() => toggleSolo(selectedN)}
              // Card close is a solo stop trigger (spec §5) — the tone must
              // never outlive the UI that says why it is sounding.
              onClose={() => {
                setSelectedN(null);
                if (soloN != null) stopTone();
              }}
            />
          ) : null}

          {/* MEASUREMENTS — THD (tap for the actual calculation), crest
              factor of the synthesized wave, envelope slope. All model math;
              THD+N stays honestly unavailable without a live measurement. */}
          <View style={styles.measureCard}>
            <Pressable
              style={styles.measureItem}
              onPress={() => setThdOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Total harmonic distortion — open calculation breakdown"
            >
              <Text style={styles.measureLabel}>THD ▸</Text>
              <Text style={styles.measureValue}>
                {modelThd.pct != null ? `${modelThd.pct.toFixed(1)} %` : '—'}
              </Text>
              <Text style={styles.measureSub}>
                {modelThd.db != null ? `${modelThd.db.toFixed(1)} dB` : modelThd.pct != null ? '−∞ dB' : 'H1 silent'}
              </Text>
            </Pressable>
            <Pressable style={styles.measureItem} onLongPress={() => openLesson('crest')} delayLongPress={300}>
              <Text style={styles.measureLabel}>CREST</Text>
              <Text style={styles.measureValue}>
                {modelCrestDb != null ? modelCrestDb.toFixed(1) : '—'}
              </Text>
              <Text style={styles.measureSub}>dB peak/RMS</Text>
            </Pressable>
            <Pressable style={styles.measureItem} onLongPress={() => openLesson('slope')} delayLongPress={300}>
              <Text style={styles.measureLabel}>SLOPE</Text>
              <Text style={styles.measureValue}>
                {slopeInfo.slope != null ? slopeInfo.slope.toFixed(1) : '—'}
              </Text>
              <Text style={styles.measureSub}>dB/oct envelope</Text>
            </Pressable>
          </View>
          <Text style={styles.thdnDim}>THD+N — live measurement required (the model has no noise)</Text>

          {/* HIGHLIGHT + OVERLAY toggles. */}
          <Text style={styles.sectionHead}>GROUPS & OVERLAYS</Text>
          <View style={styles.chipRow}>
            <Chip label="ODD/EVEN" selected={oddEvenHl} onPress={() => setOddEvenHl((v) => !v)} onLongPress={() => openLesson('wave_shape')} />
            <Chip label="ENVELOPE" selected={showEnvelope} onPress={() => setShowEnvelope((v) => !v)} onLongPress={() => openLesson('amplitude')} />
            <Chip label="SPACING" selected={showSpacing} onPress={() => setShowSpacing((v) => !v)} onLongPress={() => openLesson('frequency')} />
          </View>
          {oddEvenHl ? (
            <View style={styles.legendRow}>
              <View style={[styles.swatch, { backgroundColor: colors.orange }]} />
              <Text style={styles.legendText}>ODD H1·3·5…</Text>
              <View style={[styles.swatch, { backgroundColor: colors.blue, marginLeft: 10 }]} />
              <Text style={styles.legendText}>EVEN H2·4·6…</Text>
            </View>
          ) : null}
          {showEnvelope ? (
            <Text style={styles.caption}>
              {slopeInfo.slope != null
                ? `Harmonic energy ${slopeInfo.slope <= 0 ? 'decreases' : 'increases'} ≈ ${Math.abs(
                    slopeInfo.slope,
                  ).toFixed(1)} dB per octave (least-squares fit over the contributing stems).`
                : `Envelope slope — (needs at least ${MIN_SLOPE_HARMONICS} contributing harmonics above the floor).`}
            </Text>
          ) : null}
          {showSpacing ? (
            <Text style={styles.caption}>
              {`Harmonics are evenly spaced in frequency by the fundamental — f0 = ${f0} Hz. The LIN axis shows the even spacing; LOG bunches them into musical intervals.`}
            </Text>
          ) : null}

          {/* GROUP ACTIONS — solo = mute the complement (H1 counts as odd);
              pressing the active solo unsolos. */}
          <View style={styles.chipRow}>
            <Chip label="SOLO ODD" selected={groupState.solo === 'odd'} onPress={() => soloGroup('odd')} onLongPress={() => openLesson('add_remove_harmonics')} />
            <Chip label="SOLO EVEN" selected={groupState.solo === 'even'} onPress={() => soloGroup('even')} onLongPress={() => openLesson('add_remove_harmonics')} />
            <Chip label="MUTE ODD" selected={groupState.oddAllMuted} onPress={() => muteGroup('odd')} onLongPress={() => openLesson('add_remove_harmonics')} />
            <Chip label="MUTE EVEN" selected={groupState.evenAllMuted} onPress={() => muteGroup('even')} onLongPress={() => openLesson('add_remove_harmonics')} />
            <Chip label="NORMALIZE" selected={false} onPress={normalizeModel} />
            <Chip label="RESTORE" selected={false} onPress={() => pickPreset(presetRef.current)} />
          </View>

          {/* A/B BEFORE–AFTER — snapshot A as a dashed ghost over the stems
              and the waveform strip; B stays live-editable. */}
          <View style={styles.chipRow}>
            <Chip label="SNAPSHOT A" selected={false} onPress={takeSnapshot} />
            <Chip
              label={abOn ? 'A/B GHOST ON' : 'A/B GHOST'}
              selected={abOn}
              onPress={() => {
                if (snapA != null) setAbOn((v) => !v);
              }}
            />
          </View>
          <Text style={styles.caption}>
            {snapA == null
              ? 'SNAPSHOT A stores the current series; the A/B toggle overlays it as a dashed ghost for before/after comparison.'
              : abOn
                ? 'A = snapshot (dashed ghost on stems + waveform) · B = the live edit. A new snapshot replaces A.'
                : 'Snapshot A held — toggle A/B GHOST to overlay it.'}
          </Text>
        </>
      ) : null}

      {/* THD BREAKDOWN SHEET — the actual calculation components (spec §2.I):
          the formula, each harmonic's aₙ/a₁ contribution, and the honest
          THD+N placeholder. */}
      {thdOpen ? (
        <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={() => setThdOpen(false)}>
          <View style={styles.sheetBackdrop}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => setThdOpen(false)}
              accessibilityRole="button"
              accessibilityLabel="Dismiss THD breakdown"
            />
            <View style={styles.sheet}>
              <Text style={styles.sheetTitle}>THD — HOW IT IS CALCULATED</Text>
              <Text style={styles.sheetFormula}>THD % = √(a₂² + a₃² + … + a₁₂²) ÷ a₁ × 100</Text>
              <Text style={styles.sheetFormula}>THD dB = 20 · log₁₀(THD % ÷ 100)</Text>
              {modelThd.pct != null ? (
                <>
                  <Text style={styles.sheetResult}>
                    {`THD ${modelThd.pct.toFixed(2)} %${modelThd.db != null ? ` · ${modelThd.db.toFixed(1)} dB` : ''}`}
                  </Text>
                  <View style={styles.thdList}>
                    {modelThd.perHarmonic.filter((p) => p.pct > 0).length > 0 ? (
                      modelThd.perHarmonic
                        .filter((p) => p.pct > 0)
                        .map((p) => (
                          <Text key={p.n} style={styles.thdItem}>
                            {`H${p.n}   aₙ/a₁ = ${p.pct.toFixed(2)} %`}
                          </Text>
                        ))
                    ) : (
                      <Text style={styles.thdItem}>No overtones sounding — every aₙ (n ≥ 2) is 0.</Text>
                    )}
                  </View>
                </>
              ) : (
                <Text style={styles.sheetResult}>
                  THD is undefined — the fundamental (a₁) is silent, so there is nothing to measure
                  distortion against.
                </Text>
              )}
              <Text style={styles.thdnSheetNote}>
                THD+N — live measurement required. The analytic model contains no noise, so a THD+N
                figure here would be fabricated.
              </Text>
              <Pressable
                style={styles.doneBtn}
                onPress={() => setThdOpen(false)}
                accessibilityRole="button"
                accessibilityLabel="Done"
              >
                <Text style={styles.doneText}>DONE</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      ) : null}

      {/* GUIDED LESSON sheet — opened by the ⓘ entry or a control long-press. */}
      <GuidedLessonSheet
        visible={lessonOpen}
        lesson={getLabLesson('harmonic')}
        controlKey={lessonKey}
        onClose={() => setLessonOpen(false)}
      />

      {/* CONTROLS. */}
      {/* GUIDED LESSON entry — tap opens the lab lesson; long-press any labeled
          control below opens it focused on that control (v4 MASTER §5). */}
      <View style={styles.chipRow}>
        <Chip label="ⓘ GUIDED LESSON" selected={lessonOpen} onPress={() => openLesson()} />
      </View>
      <Text style={styles.caption}>Long-press a labeled control for its guided lesson.</Text>

      <Text style={styles.sectionHead}>FUNDAMENTAL</Text>
      <View style={styles.chipRow}>
        {F0_PRESETS.map((hz) => (
          <Chip key={hz} label={`${hz} Hz`} selected={f0 === hz} onPress={() => pickF0(hz)} onLongPress={() => openLesson('frequency')} />
        ))}
      </View>

      {view === 'model' ? (
        <>
          <Text style={styles.sectionHead}>PRESETS — SIMPLIFIED INSTRUCTIONAL MODELS</Text>
          <View style={styles.chipRow}>
            {PRESETS.map((p) => (
              <Chip key={p.key} label={p.label} selected={preset === p.key} onPress={() => pickPreset(p.key)} onLongPress={() => openLesson('wave_shape')} />
            ))}
          </View>
          <Text style={styles.caption}>
            Simplified instructional models — canonical harmonic recipes, not reproductions of any
            real device. A chip resets all 12 stems; drag the stems to edit from there.
          </Text>

          {engineReady ? (
            <>
              {/* v3: PLAY MODEL (the full 12-harmonic mixture, additive).
                  v2: PLAY TONE (fundamental sine — today's exact fallback). */}
              <GlassButton
                label={genRunning ? 'STOP TONE' : additiveReady ? 'PLAY MODEL' : 'PLAY TONE'}
                tint="green"
                height={52}
                fontSize={15}
                onPress={() => {
                  if (genRunning) stopTone();
                  else if (additiveReady) playModel();
                  else void startTone();
                }}
              />
              <Text style={styles.caption}>
                {additiveReady
                  ? `Model output up to ${GEN_LEVEL_DB} dBFS · uncalibrated — digital output level, not dB SPL; the harmonic sum is peak-normalized inside the level cap.`
                  : `Tone output up to ${GEN_LEVEL_DB} dBFS · uncalibrated — digital output level, not dB SPL.`}
              </Text>
              <Text style={styles.lowFreqAdvisory}>{LOW_FREQ_ADVISORY}</Text>
              {additiveOn && additiveNorm != null && additiveNorm < 0.995 ? (
                // Subtle auto-level hint — shown only while normalization is
                // actually attenuating (norm < 1, from genStatus).
                <Text style={styles.caption}>
                  {`Output auto-leveled ×${additiveNorm.toFixed(2)} — normalization is holding the harmonic sum inside the level cap.`}
                </Text>
              ) : null}
              {soloN != null ? (
                // SOLO status — real and honest: ONE harmonic as a real sine
                // (the one solo mechanism on every engine version).
                <Text style={styles.honestyNote}>
                  {`SOLO H${soloN} · ${soloN * f0} Hz sine — one harmonic alone${
                    additiveReady
                      ? '; PLAY MODEL sounds the full mixture.'
                      : '; the full mixture needs the additive engine (coming later).'
                  }`}
                </Text>
              ) : null}
            </>
          ) : (
            // No engine → no sound path; the model view stays fully usable.
            <Text style={styles.caption}>
              Playback needs the measurement engine (see the note above) — the analytic view stays
              fully interactive without it.
            </Text>
          )}
          {additiveOn ? (
            // HONESTY (v3, model sounding) — the audio IS the drawn model:
            // band-limited additive synthesis of these 12 stems, live edits
            // included; above-Nyquist harmonics are omitted, never aliased.
            <Text style={styles.honestyNote}>
              Audio = this 12-harmonic band-limited model — amps and phases sound as drawn;
              harmonics above the device Nyquist are omitted, never aliased.
            </Text>
          ) : modelHasOvertones && !additiveReady ? (
            // HONESTY (v2 fallback) — persistent while any overtone is
            // displayed on a sine-only engine (model-aware: edits can
            // silence or add overtones on any preset).
            <Text style={styles.honestyNote}>
              Audio plays a pure sine — the engine generates sine only; this series is an analytic
              model.
            </Text>
          ) : null}
        </>
      ) : (
        <>
          {!engineReady ? (
            // The Explore panel already shows the shared EngineGate card for
            // absent/spike — just say why this mode is inert, simulate nothing.
            <Text style={styles.caption}>
              Real-signal mode needs the DSP engine (see the note above). Nothing is simulated in
              its place.
            </Text>
          ) : (
            <>
              {/* Runtime capture failures (denied/error) — honest cards. */}
              {state === 'denied' || state === 'error' ? (
                <EngineGate state={state} lastError={lastError} />
              ) : null}
              {/* Feedback override: LIVE mode is the ONE place the app needs mic
                  + speaker together, so the user must physically accept the
                  feedback risk before the reference tone will sound. */}
              <FeedbackAllowRow />
              <GlassButton
                label={soundOn ? 'STOP' : state === 'starting' ? 'STARTING…' : 'START TONE + MIC'}
                tint="green"
                height={52}
                fontSize={15}
                // STOP stays pressable mid-start: the tone is already sounding
                // and useDspEngine.stop() is safe during 'starting' (its
                // generation counter voids the in-flight start).
                disabled={!soundOn && state === 'starting'}
                onPress={() => {
                  if (soundOn) stopAll();
                  else void onLiveStart();
                }}
              />
              <Text style={styles.caption}>
                Plays the fundamental as a sine ({GEN_LEVEL_DB} dBFS) while analyzing the
                microphone. Real harmonic distortion from the speaker, room, and mic lines up with
                the markers — that is the lesson.
                {!feedbackAllowed
                  ? ' The tone stays muted for feedback safety until you switch on the override above (use headphones, or the built-in mic will hear the speaker).'
                  : ''}
              </Text>
              {liveFlags.map((f) => (
                <Text key={f} style={styles.liveWarn}>
                  ⚠ {WARNING_INFO[f].message} {WARNING_INFO[f].hint}
                </Text>
              ))}
            </>
          )}
        </>
      )}
      {genError ? <Text style={styles.errorText}>Generator error: {genError}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },

  // Segmented mode toggle (EarLab tab idiom).
  toggleRow: { flexDirection: 'row', gap: 8 },
  toggleTab: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    paddingVertical: 9,
    alignItems: 'center',
  },
  toggleTabSelected: { borderColor: 'rgba(55,224,95,.55)', backgroundColor: '#0e130f' },
  toggleText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1, color: colors.textSecondary },
  toggleTextSelected: { color: colors.green },

  // Integrity badges (ToolDemoScreen badge idiom).
  modelBadge: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,141,122,.55)',
    backgroundColor: '#1c0f0b',
    paddingVertical: 8,
    alignItems: 'center',
  },
  modelBadgeText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.6, color: '#ff8d7a' },
  liveBadge: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(55,224,95,.45)',
    backgroundColor: '#0e130f',
    paddingVertical: 8,
    alignItems: 'center',
  },
  liveBadgeText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.6, color: colors.green },

  // The three-panel card.
  vizCard: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    padding: 10,
    gap: 6,
  },
  topRow: { flexDirection: 'row' },
  gutter: { width: GUTTER_W, height: TOP_H },
  markerLabel: {
    position: 'absolute',
    right: 4,
    width: GUTTER_W - 6,
    fontFamily: fonts.mono,
    fontSize: 9,
    color: 'rgba(91,255,133,.8)',
    textAlign: 'right',
  },
  // Spectral panels are pure black — the RX ramp's zero, so silence = bg.
  specPanel: {
    flex: 1.6,
    height: TOP_H,
    backgroundColor: '#000000',
    borderRadius: 4,
    overflow: 'hidden',
  },
  slicePanel: {
    flex: 1,
    height: TOP_H,
    backgroundColor: '#000000',
    borderRadius: 4,
    overflow: 'hidden',
    marginLeft: 6,
  },
  pianoGutter: {
    width: PIANO_W,
    height: TOP_H,
    marginLeft: 4,
    borderRadius: 3,
    overflow: 'hidden',
  },
  playhead: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 2,
    backgroundColor: 'rgba(91,255,133,.7)',
  },
  awaitText: {
    position: 'absolute',
    top: TOP_H / 2 - 9,
    left: 0,
    right: 0,
    fontFamily: fonts.barlowRegular,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
  axisRow: { flexDirection: 'row', alignItems: 'center' },
  axisText: { fontFamily: fonts.mono, fontSize: 12, color: colors.textMuted },
  axisTextRight: { textAlign: 'right', marginLeft: 6 },
  wavePanel: {
    height: WAVE_H,
    backgroundColor: '#0a0a0c',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 2,
  },
  waveCaption: { fontFamily: fonts.mono, fontSize: 12, color: colors.textMuted },

  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  swatch: { width: 13, height: 10, borderRadius: 2 },
  legendText: { fontFamily: fonts.mono, fontSize: 12, color: colors.textSubAlt, marginLeft: 6 },
  scaleNote: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSubAlt },

  // Controls (SignalGen chip idiom).
  sectionHead: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 13,
    letterSpacing: 1.8,
    color: colors.amberLabel,
    marginTop: 2,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  chipSelected: { borderColor: 'rgba(255,198,77,.65)', backgroundColor: '#1a1409' },
  chipText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1, color: colors.textSecondary },
  chipTextSelected: { color: colors.amber },

  caption: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
  lowFreqAdvisory: { fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16, color: colors.amber },
  honestyNote: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18.5, color: colors.amber },
  liveWarn: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18.5, color: colors.amber },
  errorText: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18, color: '#ff8d7a' },

  // Build B — measurement readout row (vizCard chrome, three columns).
  measureCard: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  measureItem: { flex: 1, alignItems: 'center', gap: 1 },
  measureLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.4, color: colors.amberLabel },
  measureValue: { fontFamily: fonts.mono, fontSize: 14, color: colors.textPrimary },
  measureSub: { fontFamily: fonts.mono, fontSize: 10.5, color: colors.textSubAlt },
  thdnDim: { fontFamily: fonts.mono, fontSize: 11, color: colors.textMuted },

  // Build B — THD breakdown sheet (HarmonicStems detail-sheet idiom).
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(8,8,10,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 26,
  },
  sheet: {
    width: '100%',
    maxWidth: 344,
    backgroundColor: '#17181a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(55,224,95,.35)',
    padding: 18,
    gap: 8,
  },
  sheetTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 1.2, color: colors.textPrimary },
  sheetFormula: { fontFamily: fonts.mono, fontSize: 12, color: colors.textSubAlt },
  sheetResult: { fontFamily: fonts.mono, fontSize: 13, color: 'rgba(91,255,133,.85)' },
  thdList: { gap: 2 },
  thdItem: { fontFamily: fonts.mono, fontSize: 12, color: colors.textSecondary },
  thdnSheetNote: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textMuted },
  doneBtn: {
    marginTop: 4,
    borderRadius: 9,
    backgroundColor: 'rgba(55,224,95,.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(55,224,95,.7)',
    paddingVertical: 10,
    alignItems: 'center',
  },
  doneText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 0.8, color: colors.green },
});
