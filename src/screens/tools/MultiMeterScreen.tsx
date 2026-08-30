/**
 * MultiMeterScreen — Pro Audio MultiMeter (Mono), owner spec 2026-07-29:
 * the all-in-one live meter. FOUR live panels over ONE engine session:
 *
 *  1. TOP STATUS BAR (pinned, mono digits): SPL (LAF — the SPL screen's dB
 *     convention: dBFS-referenced, UNCALIBRATED, labeled with the same honesty
 *     line) · PEAK · RMS (Z-fast) · PEAK HOLD with ⟲ / long-press reset.
 *  2. LIVE SPECTRUM (the hero): 31-band LED columns (native 1/3-oct frame,
 *     the RtaScreen restyle language mirrored locally) + FFT fine-spectrum
 *     glow overlay + AVERAGE trace (exponential envelope average) + native
 *     peak-hold ticks + tap/drag CURSOR (Hz + dB chip; the plot is an
 *     InteractionZone so dragging never scrolls the page) + ZOOM windows
 *     (FULL / LOW / MID / HIGH) + SMOOTHING chips (bandAvgAlpha + envelope α).
 *  3. MINI SPECTROGRAM (lower left): the SpectrogramScreen approach
 *     miniaturized — 64 log rows × 44 columns at ~6 col/s, per-column path
 *     batching into ≤12 quantized MIDI-velocity colors, one <G> translate to
 *     scroll (colormap fn copied locally with provenance).
 *  4. MINI OSCILLOSCOPE (lower right): live waveform buckets, gradient
 *     envelope + glow + RMS core + red clip ticks (WaveformScreen language);
 *     the fixed center line makes any DC offset visible by construction.
 *
 * Below: DOMINANT FREQUENCY (pitch frame when voiced+confident, else the
 * spectrum's peak bin — the live source is labeled) · MUSICAL NOTE + cents
 * (FrequencyCounterScreen tuner math, A440 fixed here) · cents bar with the
 * ±5¢ in-tune lock · SYSTEM INFO (sample rate · FFT · display range · input
 * route) · SMART DETECTION chips (multiMeterDetect heuristics, hysteresis) ·
 * MEASUREMENT SNAPSHOT (notes sheet → measurementStore).
 *
 * Integrity (§1.7):
 *  - every level is dBFS · UNCALIBRATED and labeled so — never dB SPL;
 *  - pitch honesty gating identical to FrequencyCounterScreen (voiced +
 *    confidence + level; last-good DIMS with an age hint, then dashes);
 *  - detections are "likely conditions based on the measured signal — not
 *    guarantees" (owner framing, printed verbatim);
 *  - CPU usage is OMITTED — JS cannot measure the app's real CPU load
 *    honestly (no native counter is exposed), so no number is invented;
 *  - input gain is OMITTED — the engine does not expose it (don't fake);
 *  - GPS + room photo are OMITTED this pass — expo-location/camera are not in
 *    the installed build; the snapshot sheet says so honestly;
 *  - capture starts only on the explicit START press; the hook stops capture
 *    on blur/unmount (spec §18).
 *
 * PERF BUDGET (four live panels — hard budget, ≤ ~700 SVG nodes steady state):
 *  - hero spectrum: ≤ 31×4 bar nodes + ~14 chrome + 3 overlay paths + cursor
 *    ≈ 145 max;
 *  - mini spectrogram: 44 memoized columns × ≤12 batched paths = 528 worst
 *    bound, ~180–350 on typical audio, + 5 chrome; columns scroll via ONE
 *    <G> translate — per-column paths are frozen after mount;
 *  - mini scope: ~12 nodes; total ≈ 350–520 typical, ≤ ~700 worst case.
 *  The 15 Hz meter poll re-renders RN text; the spectrogram SVG reconciles
 *  only at its own ~6 Hz column push (React.memo keyed by history reference).
 */
import { memo, useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import {
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Crypto from 'expo-crypto';
import Svg, { Defs, G, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { ApeDsp, type EngineConfig } from '../../../modules/ape-dsp';
import { GlassButton } from '../../components/GlassButton';
import { meterWarningFlags, useDspEngine } from '../../features/tools/engine/useDspEngine';
import { deriveSixthOctave, NO_LEVEL, SIXTH_BANDS, SIXTH_EDGE, type DisplayBands } from '../../features/tools/sixthOctave';
import { useSplCalibration } from '../../features/tools/measure/calibrationStore';
import { heatColor, levelColorForDb, MIDLINE_BLUE, rampColors, WAVE_LEVEL_STOPS } from '../../features/tools/levelColor';
import { LinearGradient as GradientView } from 'expo-linear-gradient';
import { saveMeasurement } from '../../features/tools/measure/measurementStore';
import { evaluateQuality } from '../../features/tools/measure/quality';
import { WARNING_INFO, type MultimeterSnapshotPayload } from '../../features/tools/measure/types';
import { useToolUsage } from '../../features/tools/telemetry';
import { PermissionPrompt, usePermissionFlow } from '../../features/permissions/PermissionPrompt';
import * as photo from '../../features/tools/capture/photo';
import * as location from '../../features/tools/capture/location';
import type { GeoFix } from '../../features/tools/capture/location';
import { colors, fonts } from '../../theme/tokens';
import { AccuracyNote } from '../../components/AccuracyNote';
import { EngineGate } from './EngineGate';
import { InteractionZone } from '../lab/LabShell';
import { useToolHelp, DisplayGuideButton } from '../../features/lab/guidedLessons';
import {
  analyze,
  applyHysteresis,
  initialDetectState,
  type ChipState,
  type DetectState,
  type Detection,
} from './multiMeterDetect';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'MultiMeter'>;

// ---------------------------------------------------------------------------
// Engine + poll cadences
// ---------------------------------------------------------------------------
const FFT_SIZE = 8192;
/** Uncalibrated dBFS → dB-SPL estimate: 0 dBFS ≈ this many dB SPL on a typical
 *  phone mic (owner ruling 2026-08-12) — the shared field calibration overrides
 *  it. Matches the SPL meter. */
const NOMINAL_OFFSET = 100;
/** The 4 readout modes (owner rev 24 — long-press the SPL cell to switch), same
 *  set + semantics as the SPL meter. A/C weight the level; A/C/SPL add the SPL
 *  offset (estimated dB SPL); FS is the raw digital level (dBFS). */
type UnitMode = 'A' | 'C' | 'FS' | 'SPL';
const UNIT_MODES: readonly UnitMode[] = ['A', 'C', 'FS', 'SPL'] as const;
const MODE_UNIT: Record<UnitMode, string> = { A: 'dBA', C: 'dBC', FS: 'dBFS', SPL: 'dB SPL' };
const MODE_LABEL: Record<UnitMode, string> = { A: 'SPL·LAF', C: 'SPL·LCF', FS: 'LEVEL·FS', SPL: 'SPL·L' };
/** The fine-spectrum poll (envelope + spectrogram + detection feed) — its own
 *  ~12.5 Hz interval, exactly the SpectrogramScreen idiom (the hook's 15 Hz
 *  frame poll does not carry the spectrum payload). */
// Faster spectrum response (owner 2026-08-05, item 4): poll the fine spectrum at
// ~16.7 Hz (was 12.5) so the FFT overlay + envelope track the signal quicker.
const SPEC_POLL_MS = 60;
/** Spectrogram/detection cadence: every 3rd spectrum tick → 180 ms ≈ 5.5 col/s. */
const SLOW_EVERY = 3;

/** SMOOTHING chips → native bandAvgAlpha + the overlay-envelope α (same
 *  exponential-average behavior; HIGH = heaviest smoothing = slowest α). */
const SMOOTHINGS = [
  { label: 'LOW', bandAlpha: 0.6, envAlpha: 0.5 },
  { label: 'MED', bandAlpha: 0.35, envAlpha: 0.3 },
  { label: 'HIGH', bandAlpha: 0.15, envAlpha: 0.12 },
] as const;
type Smoothing = (typeof SMOOTHINGS)[number];

/** ZOOM windows — pure display re-mapping of the log x-axis; bands outside
 *  the window hide, the FFT overlay re-samples. No engine setting changes. */
const ZOOMS = [
  { label: 'FULL', min: 20, max: 20000 },
  { label: 'LOW', min: 20, max: 500 },
  { label: 'MID', min: 200, max: 5000 },
  { label: 'HIGH', min: 2000, max: 20000 },
] as const;
type Zoom = (typeof ZOOMS)[number];

// ---------------------------------------------------------------------------
// Hero spectrum geometry (dBFS → px, log-f → px)
// ---------------------------------------------------------------------------
const FLOOR_DB = -90; // display floor — also the honest "display range" figure
const ZERO_Y = 14; // 0 dBFS gridline; above it is REAL headroom (F1)
const GRID_DBS = [0, -30, -60, FLOOR_DB];
const GRID_DBS_MINOR = [-15, -45, -75];
/** Fine-spectrum overlay resolution across the zoom window. */
const ENV_POINTS = 96;

// LED palette — the RtaScreen 2026-07-29 restyle language, mirrored locally
// (shared idiom, not a cross-screen import).
const PLOT_BG = '#0c0c0f';
const PLOT_FRAME = '#262b36';
const GRID = '#333846';
const GRID_MINOR = '#262b36';
const AXIS = '#5a6376';
const BAR_HOT = '#ffd35e';
const BAR_HI = '#7fd4ff';
const BAR_MID = '#2f9bff';
const BAR_DEEP = '#123a5e';
const CAP_HALO = '#7fd4ff';
const CAP_CORE = '#d9f1ff';
const PEAK_TICK = '#ffe8b0';
const SLOT_GRAY = '#55555f';
const CURSOR = '#ff9de0';

// ---------------------------------------------------------------------------
// Mini spectrogram (SpectrogramScreen miniaturized — same construction)
// ---------------------------------------------------------------------------
const SG_ROWS = 64; // log-spaced frequency rows (compact)
const SG_COLS = 44; // 44 × 160 ms ≈ 7 s of history
const SG_H = 128; // 2 px per row
const SG_F_MIN = 50;
const SG_F_MAX = 16000;
const SG_FLOOR_DB = -120;
const SG_DYN_RANGE = 60; // fixed dynamic range (compact panel — recorded on save)
const SG_LOG_MIN = Math.log(SG_F_MIN);
const SG_LOG_SPAN = Math.log(SG_F_MAX) - SG_LOG_MIN;
const SG_CELL_H = SG_H / SG_ROWS;
/** FIXED colour anchor (owner 2026-08-14): the mini-spectrogram colormap top is
 *  a constant 0 dBFS, SG_DYN_RANGE below it — no dynamic re-anchor to the signal,
 *  so a later loud event never recolours history. */
const SG_ANCHOR_DB = 0;

/** MIDI-velocity rainbow — COPIED from SpectrogramScreen (owner 2026-07-29):
 *  near-silence stays deep navy, then blue → green → yellow → orange → red.
 *  The app-wide amplitude ramp (owner 2026-08-02) — shared heatColor so this
 *  raster matches every meter, waveform and lab heat map. */
function midiVelocityColor(t: number): string {
  return heatColor(t);
}

/** ≤12 quantized colors — the per-column path-batching buckets (fewer than the
 *  full screen's 32: this raster is 45%-width, and the node budget is shared
 *  with three other live panels — 44 × 12 = 528 worst-case bound). */
const SG_BUCKETS = 12;
const SG_COLORS: readonly string[] = Array.from({ length: SG_BUCKETS }, (_, i) =>
  midiVelocityColor((i + 0.5) / SG_BUCKETS),
);

// ---------------------------------------------------------------------------
// Mini oscilloscope (WaveformScreen language, compact)
// ---------------------------------------------------------------------------
const SCOPE_H = 128;
const SCOPE_WINDOW_SEC = 3; // mini-scope time window
const ENGINE_HISTORY_SEC = 6; // WaveEnvelope ring span; bucket duration derived from the live count (resolution-agnostic)
const SCOPE_MAX_COLS = 128; // min/max downsample columns — high-res peak envelope, light on this dense multi-panel screen

// ---------------------------------------------------------------------------
// Pitch honesty gating — IDENTICAL constants to FrequencyCounterScreen
// (dim/dashes, never fabricate).
// ---------------------------------------------------------------------------
const PITCH_CONF_MIN = 0.5;
const PITCH_LOW_SIGNAL_DB = -60;
const PITCH_HOLD_MAX_MS = 4000;
/** Spectrum-peak fallback floor: below this the "dominant" bin is just noise. */
const SPEC_PEAK_MIN_DB = -70;

const NOTE_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
const A4 = 440; // fixed here (owner spec) — the tuner tool has selectable A4

/** FrequencyCounterScreen's tuner math (A440 fixed). */
function noteFor(freq: number): { name: string; octave: number; cents: number } {
  const n = Math.max(0, Math.min(127, Math.round(12 * Math.log2(freq / A4)) + 69));
  const fNote = A4 * Math.pow(2, (n - 69) / 12);
  const cents = 1200 * Math.log2(freq / fNote);
  return { name: NOTE_NAMES[((n % 12) + 12) % 12], octave: Math.floor(n / 12) - 1, cents };
}

const fmtDb = (v: number | null | undefined) =>
  v != null && Number.isFinite(v) ? `${v > 0 ? '+' : ''}${v.toFixed(1)}` : '—';
const fmtHz = (hz: number) => (hz < 100 ? hz.toFixed(1) : hz < 10000 ? Math.round(hz).toString() : `${(hz / 1000).toFixed(2)}k`);

// ---------------------------------------------------------------------------
// Fine-spectrum → envelope resampling (log-spaced points across the zoom
// window; each point is the MAX of the REAL bins in its log segment — the
// SpectrogramScreen downsampling idiom, never interpolated or fabricated).
// ---------------------------------------------------------------------------
function buildEnvBins(sampleRate: number, fftSize: number, bins: number, zoom: Zoom): Int32Array {
  const hzPerBin = sampleRate / fftSize;
  const logMin = Math.log(zoom.min);
  const logSpan = Math.log(zoom.max) - logMin;
  const map = new Int32Array(ENV_POINTS * 2);
  for (let i = 0; i < ENV_POINTS; i++) {
    const fLo = Math.exp(logMin + (logSpan * i) / ENV_POINTS);
    const fHi = Math.exp(logMin + (logSpan * (i + 1)) / ENV_POINTS);
    let lo = Math.max(1, Math.ceil(fLo / hzPerBin));
    let hi = Math.min(bins - 1, Math.floor(fHi / hzPerBin));
    if (lo > hi) {
      const c = Math.min(bins - 1, Math.max(1, Math.round(Math.sqrt(fLo * fHi) / hzPerBin)));
      lo = c;
      hi = c;
    }
    map[i * 2] = lo;
    map[i * 2 + 1] = hi;
  }
  return map;
}

/** Per-row bin ranges for the mini raster — SpectrogramScreen's buildRowBins
 *  pattern at 64 rows. */
function buildSgRowBins(sampleRate: number, fftSize: number, bins: number): Int32Array {
  const hzPerBin = sampleRate / fftSize;
  const map = new Int32Array(SG_ROWS * 2);
  for (let r = 0; r < SG_ROWS; r++) {
    const fLo = Math.exp(SG_LOG_MIN + (SG_LOG_SPAN * r) / SG_ROWS);
    const fHi = Math.exp(SG_LOG_MIN + (SG_LOG_SPAN * (r + 1)) / SG_ROWS);
    let lo = Math.max(1, Math.ceil(fLo / hzPerBin));
    let hi = Math.min(bins - 1, Math.floor(fHi / hzPerBin));
    if (lo > hi) {
      const c = Math.min(bins - 1, Math.max(1, Math.round(Math.sqrt(fLo * fHi) / hzPerBin)));
      lo = c;
      hi = c;
    }
    map[r * 2] = lo;
    map[r * 2 + 1] = hi;
  }
  return map;
}

type SgColumnData = { id: number; cells: number[]; max: number };

// ---------------------------------------------------------------------------
// Mini spectrogram column + grid (the SpectrogramScreen batching, compact):
// each column's 64 cells collapse into ≤12 <Path> nodes (one per quantized
// color present; contiguous equal-bucket runs merge); scrolling is ONE parent
// <G> translate per push — mounted columns never rebuild while they scroll.
// ---------------------------------------------------------------------------
const SG_COL_OVERLAP = 0.35;

const SgColumn = memo(function SgColumn({
  cells,
  x,
  colW,
  anchor,
}: {
  cells: number[];
  x: number;
  colW: number;
  anchor: number;
}) {
  const floor = anchor - SG_DYN_RANGE;
  const scale = SG_BUCKETS / SG_DYN_RANGE;
  const xs = x.toFixed(1);
  const buckets: (string | undefined)[] = new Array<string | undefined>(SG_BUCKETS);
  let run = -1;
  let runStart = 0;
  for (let r = 0; r <= SG_ROWS; r++) {
    let b = -1;
    if (r < SG_ROWS) {
      const v = cells[r];
      if (v > floor) b = Math.min(SG_BUCKETS - 1, Math.floor((v - floor) * scale));
    }
    if (b !== run) {
      if (run >= 0) {
        const y1 = (SG_H - runStart * SG_CELL_H).toFixed(1);
        const y2 = (SG_H - r * SG_CELL_H).toFixed(1);
        buckets[run] = (buckets[run] ?? '') + `M${xs} ${y1}V${y2}`;
      }
      run = b;
      runStart = r;
    }
  }
  const out: ReactElement[] = [];
  for (let b = 0; b < SG_BUCKETS; b++) {
    const d = buckets[b];
    if (d) out.push(<Path key={b} d={d} stroke={SG_COLORS[b]} strokeWidth={colW + SG_COL_OVERLAP} />);
  }
  return <>{out}</>;
});

/** memo keyed by the history REFERENCE — the 15 Hz meter poll re-renders the
 *  parent, but this SVG reconciles only when a column lands (~6 Hz). */
const SgGrid = memo(function SgGrid({
  history,
  anchor,
  width,
}: {
  history: SgColumnData[];
  anchor: number;
  width: number;
}) {
  if (width <= 0 || history.length === 0) return null;
  const colW = width / SG_COLS;
  const newestId = history[history.length - 1].id;
  const tx = width - (newestId + 1) * colW;
  const yFor = (hz: number) => SG_H - ((Math.log(hz) - SG_LOG_MIN) / SG_LOG_SPAN) * SG_H;
  return (
    <Svg width={width} height={SG_H}>
      {[100, 1000, 10000].map((hz) => (
        <Line key={hz} x1={0} x2={width} y1={yFor(hz)} y2={yFor(hz)} stroke="#1c1c26" strokeWidth={1} strokeDasharray="3 5" />
      ))}
      <G x={tx}>
        {history.map((c) => (
          <SgColumn key={c.id} cells={c.cells} x={(c.id + 0.5) * colW} colW={colW} anchor={anchor} />
        ))}
      </G>
      <Rect x={0.5} y={0.5} width={width - 1} height={SG_H - 1} stroke="#26262c" strokeWidth={1} fill="none" />
    </Svg>
  );
});

// ---------------------------------------------------------------------------
// Shared small UI bits
// ---------------------------------------------------------------------------
function Chip({ label, active, onPress, a11yLabel }: { label: string; active: boolean; onPress: () => void; a11yLabel?: string }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel ?? label}
      accessibilityState={{ selected: active }}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------
export function MultiMeterScreen({ navigation }: Props) {
  const { help, helpAll, sheet } = useToolHelp('multimeter');
  const insets = useSafeAreaInsets();
  const { height: winH } = useWindowDimensions();
  useToolUsage('multimeter'); // T-1 telemetry (this tool skips ToolInfo, hzcounter idiom)

  // Ref-stable engine config (house pattern — useDspEngine's start() closes
  // over this object; setting changes MUTATE it then live-apply).
  const cfg = useRef<EngineConfig>({
    fftSize: FFT_SIZE,
    fraction: 3,
    spectrumEnabled: true,
    pitchEnabled: true,
    waveformEnabled: true,
    bandAvgAlpha: 0.6, // faster bar response (owner 2026-08-05, item 4) — LOW default
  }).current;
  const { state, frames, start, stop, lastError, resetPeakHold } = useDspEngine(cfg, {
    meter: true,
    bands: true,
    pitch: true,
    waveform: true,
  });
  const framesRef = useRef(frames);
  framesRef.current = frames;

  const [smoothing, setSmoothing] = useState<Smoothing>(SMOOTHINGS[0]); // LOW (fastest) default (item 4)
  // Spectrum zoom is fixed FULL (owner 2026-08-05, item 3: FULL/LOW/MID/HIGH
  // buttons removed). Scope zoom ×1/×2/×4 is a separate control (item 2).
  const [zoom] = useState<Zoom>(ZOOMS[0]);
  const [scopeZoom, setScopeZoom] = useState<1 | 2 | 4>(1);
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const envAlphaRef = useRef(smoothing.envAlpha);
  envAlphaRef.current = smoothing.envAlpha;

  // Scroll gating for the cursor drag surface (LabShell InteractionZone
  // pattern with an explicit onLock — this screen has its own ScrollView).
  const [scrollEnabled, setScrollEnabled] = useState(true);

  // ---- Fine-spectrum poll products -----------------------------------------
  type SpecView = {
    env: number[]; // live glow envelope (dBFS per point, zoom-window log-spaced)
    avg: number[]; // exponential average of the envelope (AVERAGE trace)
    peak: { hz: number; db: number } | null; // spectrum's global peak bin
    sampleRate: number;
  };
  const [specView, setSpecView] = useState<SpecView | null>(null);
  // 1/6-octave (61-band) RTA derived from the fine spectrum (owner rev 24 — the
  // MultiMeter defaults to 61 bands; the native engine only delivers 1/3-oct).
  const [sixthBands, setSixthBands] = useState<DisplayBands | null>(null);
  const sixthSmoothRef = useRef<Float64Array | null>(null);
  const sixthHoldRef = useRef<Float64Array>(new Float64Array(SIXTH_BANDS).fill(NO_LEVEL));
  const everStartedRef = useRef(false); // true once the user has started (resilience gate)
  const bandAlphaRef = useRef(smoothing.bandAlpha);
  bandAlphaRef.current = smoothing.bandAlpha;
  const envAvgRef = useRef<Float64Array | null>(null);
  const envBinsRef = useRef<{ key: string; map: Int32Array } | null>(null);
  const sgBinsRef = useRef<{ key: string; map: Int32Array } | null>(null);
  const clearEnv = useCallback(() => {
    envAvgRef.current = null;
    envBinsRef.current = null;
  }, []);

  // Mini spectrogram history. Colour anchor is FIXED at 0 dBFS (SG_ANCHOR_DB,
  // owner 2026-08-14) — the schema glues to a fixed reference; a later loud
  // event never recolours already-drawn history.
  const [sgHistory, setSgHistory] = useState<SgColumnData[]>([]);
  const sgColIdRef = useRef(0);

  // Smart detection (multiMeterDetect — pure fns; refs carry tracker state).
  const detectStateRef = useRef<DetectState>(initialDetectState());
  const chipStateRef = useRef<ChipState>({});
  const [chips, setChips] = useState<Detection[]>([]);
  const chipsSigRef = useRef('');

  // The ~12.5 Hz fine-spectrum poll (envelope every tick; spectrogram column +
  // detection every 2nd tick ≈ 6 Hz) — deliberately NOT the hook's meter poll.
  useEffect(() => {
    if (state !== 'running') return;
    let tick = 0;
    const id = setInterval(() => {
      const meta = ApeDsp.getSpectrumMeta();
      const spec = ApeDsp.getSpectrum();
      if (!meta || meta.sampleRate <= 0 || meta.fftSize <= 0 || spec.length === 0) return;
      tick++;
      const z = zoomRef.current;

      // Envelope resample across the zoom window (max of the REAL bins per
      // log segment) + exponential AVERAGE trace.
      const envKey = `${meta.sampleRate}|${meta.fftSize}|${spec.length}|${z.min}|${z.max}`;
      if (!envBinsRef.current || envBinsRef.current.key !== envKey) {
        envBinsRef.current = { key: envKey, map: buildEnvBins(meta.sampleRate, meta.fftSize, spec.length, z) };
        envAvgRef.current = null; // window changed — a stale average would lie
      }
      const map = envBinsRef.current.map;
      const env = new Array<number>(ENV_POINTS);
      for (let i = 0; i < ENV_POINTS; i++) {
        let v = -Infinity;
        const hi = map[i * 2 + 1];
        for (let b = map[i * 2]; b <= hi; b++) if (spec[b] > v) v = spec[b];
        env[i] = Number.isFinite(v) ? v : FLOOR_DB - 30;
      }
      const first = envAvgRef.current == null;
      const avg = envAvgRef.current ?? Float64Array.from(env);
      envAvgRef.current = avg;
      if (!first) {
        const a = envAlphaRef.current;
        for (let i = 0; i < ENV_POINTS; i++) avg[i] += a * (env[i] - avg[i]);
      }

      // Spectrum's global peak bin (dominant-frequency fallback source).
      const hzPerBin = meta.sampleRate / meta.fftSize;
      const startBin = Math.max(1, Math.ceil(20 / hzPerBin));
      let pk = -Infinity;
      let pkI = startBin;
      for (let i = startBin; i < spec.length; i++) {
        if (spec[i] > pk) {
          pk = spec[i];
          pkI = i;
        }
      }
      setSpecView({
        env,
        avg: Array.from(avg),
        peak: Number.isFinite(pk) && pk >= SPEC_PEAK_MIN_DB ? { hz: pkI * hzPerBin, db: pk } : null,
        sampleRate: meta.sampleRate,
      });

      // 61-band 1/6-oct RTA from the same real frame (owner rev 24).
      setSixthBands(
        deriveSixthOctave(spec, meta.sampleRate, meta.fftSize, bandAlphaRef.current, sixthSmoothRef, sixthHoldRef.current),
      );

      if (tick % SLOW_EVERY !== 0) return;

      // ---- Mini spectrogram column (~6 col/s).
      const sgKey = `${meta.sampleRate}|${meta.fftSize}|${spec.length}`;
      if (!sgBinsRef.current || sgBinsRef.current.key !== sgKey) {
        sgBinsRef.current = { key: sgKey, map: buildSgRowBins(meta.sampleRate, meta.fftSize, spec.length) };
      }
      const rowMap = sgBinsRef.current.map;
      const cells = new Array<number>(SG_ROWS);
      let max = SG_FLOOR_DB;
      for (let r = 0; r < SG_ROWS; r++) {
        let v = -Infinity;
        const hi = rowMap[r * 2 + 1];
        for (let b = rowMap[r * 2]; b <= hi; b++) if (spec[b] > v) v = spec[b];
        const clamped = Number.isFinite(v) && v > SG_FLOOR_DB ? v : SG_FLOOR_DB;
        cells[r] = clamped;
        if (clamped > max) max = clamped;
      }
      sgColIdRef.current += 1;
      const col: SgColumnData = { id: sgColIdRef.current, cells, max };
      setSgHistory((h) => (h.length >= SG_COLS ? [...h.slice(h.length - SG_COLS + 1), col] : [...h, col]));

      // ---- Smart detection (cheap pure pass over the SAME frames).
      const fr = framesRef.current;
      const now = Date.now();
      const { raw, state: nextDetect } = analyze(
        {
          tMs: now,
          spectrumDb: spec,
          sampleRate: meta.sampleRate,
          fftSize: meta.fftSize,
          meter: fr.meter ? { peakDb: fr.meter.peakDb, clipRuns: fr.meter.clipRuns } : null,
          waveClipped: fr.waveform.slice(0, 12).some((b) => b.clipped),
          pitch: fr.pitch,
        },
        detectStateRef.current,
      );
      detectStateRef.current = nextDetect;
      const { chips: nextChips, next: nextChipState } = applyHysteresis(chipStateRef.current, raw, now);
      chipStateRef.current = nextChipState;
      const sig = nextChips.map((c) => `${c.id}:${c.severity}:${c.detail}`).join('|');
      if (sig !== chipsSigRef.current) {
        chipsSigRef.current = sig;
        setChips(nextChips);
      }
    }, SPEC_POLL_MS);
    return () => clearInterval(id);
  }, [state]);

  // ---- Pitch honesty (FrequencyCounterScreen gating, A440 fixed) -----------
  const running = state === 'running';

  // STOP must not collapse the tool back to the intro card (that shrinks the
  // ScrollView and jumps the scroll). Hold the view mounted via micPaused; the
  // button toggles START/STOP in place. Cleared once we're truly running again.
  const [micPaused, setMicPaused] = useState(false);
  useEffect(() => {
    if (running) setMicPaused(false);
  }, [running]);
  const onStop = useCallback(() => {
    setMicPaused(true);
    stop();
  }, [stop]);
  const meter = running ? frames.meter : null;

  // Readout mode (owner rev 24 — long-press the SPL cell): A/C/FS/SPL, same as
  // the SPL meter. Shared field calibration → estimated dB SPL; nominal 100 when
  // uncalibrated. The chosen mode RIPPLES to PEAK/RMS and the horizontal meter.
  const [unitMode, setUnitMode] = useState<UnitMode>('C');
  const [unitPopup, setUnitPopup] = useState(false);
  const cal = useSplCalibration();
  const splOffset = cal?.offsetDb ?? NOMINAL_OFFSET;
  const calibrated = cal?.offsetDb != null;
  // Weighted broadband level for the chosen mode (A/C weight; FS/SPL are flat Z).
  const modeLevel = (m: typeof meter): number | undefined =>
    !m ? undefined : unitMode === 'A' ? m.aFastDb : unitMode === 'C' ? m.cFastDb : m.zFastDb;
  // Raw dBFS → displayed value: FS shows the raw digital dB; A/C/SPL add the SPL
  // offset (estimated dB SPL, floored at 0). Colour always uses the RAW dBFS.
  const applyRef = (dbfs: number | undefined): number | undefined =>
    dbfs == null || !Number.isFinite(dbfs) ? undefined : unitMode === 'FS' ? dbfs : Math.max(0, dbfs + splOffset);

  const live = running ? frames.pitch : null;
  const lowSignal = live != null && live.levelDb < PITCH_LOW_SIGNAL_DB;
  const accepted =
    live != null && live.voiced && live.confidence >= PITCH_CONF_MIN && !lowSignal && live.freq > 0;
  const lastGoodRef = useRef<{ f: number; at: number } | null>(null);
  useEffect(() => {
    if (running && accepted && live != null) lastGoodRef.current = { f: live.freq, at: Date.now() };
  }, [running, accepted, live]);
  const lastGood = lastGoodRef.current;
  const heldAgeMs = !accepted && lastGood != null ? Date.now() - lastGood.at : null;
  const isHeld = heldAgeMs != null && heldAgeMs <= PITCH_HOLD_MAX_MS;
  const shownPitchHz = accepted && live != null ? live.freq : isHeld && lastGood != null ? lastGood.f : null;
  const note = shownPitchHz != null ? noteFor(shownPitchHz) : null;
  const inTune = note != null && !isHeld && Math.abs(note.cents) < 5;

  // Dominant frequency: the pitch frame when voiced+confident, else the
  // spectrum's peak bin — the live source is LABELED (never conflated).
  // `running` gate added 2026-08-28: specView is not cleared on STOP, so after
  // stopping this panel kept rendering a frequency captioned "from spectrum
  // peak" off a dead mic, while every other panel had correctly gone dark.
  const dominant: { hz: number; source: 'pitch' | 'spectrum' } | null = !running
    ? null
    : accepted && live != null
      ? { hz: live.freq, source: 'pitch' }
      : specView?.peak != null
        ? { hz: specView.peak.hz, source: 'spectrum' }
        : null;

  // ---- Cursor (tap/drag on the hero plot) ----------------------------------
  const [cursorX, setCursorX] = useState<number | null>(null);
  const [plotW, setPlotW] = useState(0);
  const heroH = Math.round(Math.min(340, Math.max(240, winH * 0.36)));
  const floorY = heroH - 14;
  const pxPerDb = (floorY - ZERO_Y) / -FLOOR_DB;
  const yForDb = (db: number) => Math.max(2, Math.min(floorY, ZERO_Y - db * pxPerDb));
  const xForHz = (hz: number) =>
    (plotW * Math.log(hz / zoom.min)) / Math.log(zoom.max / zoom.min);

  const cursorInfo = useMemo(() => {
    // `running` gate (2026-08-28): specView survives STOP, so the cursor chip
    // kept reading Hz/dB off a frozen envelope after the mic was off.
    if (!running || cursorX == null || plotW <= 0 || specView == null) return null;
    const frac = Math.max(0, Math.min(1, cursorX / plotW));
    const hz = zoom.min * Math.pow(zoom.max / zoom.min, frac);
    const i = Math.max(0, Math.min(ENV_POINTS - 1, Math.round(frac * ENV_POINTS - 0.5)));
    const db = specView.env[i];
    return { hz, db: db > FLOOR_DB - 20 ? db : null };
  }, [running, cursorX, plotW, specView, zoom]);

  // ---- Settings changes -----------------------------------------------------
  const applySmoothing = useCallback(
    (s: Smoothing) => {
      if (s.label === smoothing.label) return;
      cfg.bandAvgAlpha = s.bandAlpha;
      setSmoothing(s);
      envAvgRef.current = null; // fresh envelope average under the new α
      ApeDsp.setEngineConfig(cfg); // native settings-epoch restart (RTA idiom)
    },
    [cfg, smoothing],
  );
  // PEAK / PK HOLD readouts now colour on the amplitude ramp (levelColorForDb,
  // owner 2026-08-12) — the old boolean "has peaked" red latch (item 5) is gone,
  // so there is no per-poll latch state to track here anymore.
  const onResetPeakHold = useCallback(() => {
    resetPeakHold();
    sixthHoldRef.current.fill(NO_LEVEL); // clear the derived 61-band holds too
  }, [resetPeakHold]);

  const onStart = useCallback(() => {
    setMicPaused(false);
    // Fresh run = fresh derived state (stale holds/history/chips would lie).
    clearEnv();
    sgBinsRef.current = null;
    setSpecView(null);
    setSixthBands(null);
    sixthSmoothRef.current = null;
    sixthHoldRef.current.fill(NO_LEVEL);
    setSgHistory([]);
    sgColIdRef.current = 0;
    detectStateRef.current = initialDetectState();
    chipStateRef.current = {};
    chipsSigRef.current = '';
    setChips([]);
    setCursorX(null);
    lastGoodRef.current = null;
    everStartedRef.current = true;
    // ...and the NATIVE accumulator too (fix 2026-08-28): everything above is
    // JS-derived state, but peak-hold lives in the engine and survives a warm
    // stream adoption, so a fresh run showed the previous session's peak from
    // its first frame — and `openSnapshot` saves it into the record.
    resetPeakHold();
    void start();
  }, [clearEnv, start, resetPeakHold]);

  // DEV + WEB preview only (#multimeterpreview): auto-start once so the harness
  // shows the live (sim) panels without a tap — RN-web synthetic presses on the
  // START button are unreliable. No effect on device or in release builds.
  const previewAutoStartedRef = useRef(false);
  useEffect(() => {
    if (!(__DEV__ && Platform.OS === 'web')) return;
    if (previewAutoStartedRef.current) return;
    if (state === 'idle') {
      previewAutoStartedRef.current = true;
      onStart();
    }
  }, [state, onStart]);

  // Resilience (owner rev 24): if the engine drops back to idle while we're
  // still ON-SCREEN and the user hadn't stopped it, resume — this masks the iOS
  // "randomly reverts to START" report. Gated on isFocused (navigating away
  // still stops for privacy) and everStarted (a fresh entry still shows the
  // manual START card by design). Survives a stray blur/refocus, not a full
  // remount (refs reset then). Root cause still tracked via the Metro log.
  const isFocused = useIsFocused();
  useEffect(() => {
    if (isFocused && everStartedRef.current && !micPaused && state === 'idle') onStart();
  }, [isFocused, micPaused, state, onStart]);

  // ---- Snapshot (owner spec §8): capture AT BUTTON PRESS, confirm w/ notes --
  type SnapshotDraft = {
    payload: MultimeterSnapshotPayload;
    sampleRate: number | null;
    flags: ReturnType<typeof meterWarningFlags>;
    routeName: string;
  };
  const [draft, setDraft] = useState<SnapshotDraft | null>(null);
  const [notes, setNotes] = useState('');
  const [justSaved, setJustSaved] = useState(false);

  // ---- Optional room-photo + GPS capture (owner 2026-07-29) -----------------
  // Both are HONEST-GATED: the controls only appear when the native module is
  // actually in this build (isAvailable()); otherwise a one-liner says the
  // capability needs the next dev build. Nothing is uploaded — the photo URI
  // and fix live on-device with the snapshot. isAvailable() is a runtime probe
  // of the optional-require gate, stable for the app's lifetime → read once.
  const photoAvailable = useMemo(() => photo.isAvailable(), []);
  const locationAvailable = useMemo(() => location.isAvailable(), []);
  const photoFlow = usePermissionFlow('photo', photo.requestPermission);
  const locationFlow = usePermissionFlow('location', location.requestPermission);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [geo, setGeo] = useState<GeoFix | null>(null);
  const [photoBlocked, setPhotoBlocked] = useState(false);
  const [locationBlocked, setLocationBlocked] = useState(false);

  const onAddPhoto = useCallback(async () => {
    const r = await photoFlow.request();
    if (r === 'granted') {
      setPhotoBlocked(false);
      const uri = await photo.capture(); // launches the system camera
      if (uri) setPhotoUri(uri);
    } else if (r === 'blocked') {
      setPhotoBlocked(true); // OS access is off — point to Settings
    }
  }, [photoFlow]);

  const onTagLocation = useCallback(async () => {
    const r = await locationFlow.request();
    if (r === 'granted') {
      setLocationBlocked(false);
      const fix = await location.getFix();
      if (fix) setGeo(fix);
    } else if (r === 'blocked') {
      setLocationBlocked(true);
    }
  }, [locationFlow]);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (savedTimer.current) clearTimeout(savedTimer.current);
    },
    [],
  );

  const openSnapshot = useCallback(() => {
    const fr = framesRef.current;
    const m = fr.meter;
    const bands = fr.bands;
    if (state !== 'running' || m == null || bands == null || bands.centers.length === 0) return;
    // Q2: persist ONLY resolvable bands (the spectrum_trace rule — storing a
    // flagged-unresolvable level would fabricate data on replay).
    const bandsHz: number[] = [];
    const levelsDb: number[] = [];
    const bandPeakHoldDb: number[] = [];
    bands.centers.forEach((c, i) => {
      if (bands.resolvable[i]) {
        bandsHz.push(c);
        levelsDb.push(bands.levelsDb[i]);
        bandPeakHoldDb.push(bands.peakHoldDb[i]);
      }
    });
    const p = fr.pitch;
    const pitchOk =
      p != null && p.voiced && p.confidence >= PITCH_CONF_MIN && p.levelDb >= PITCH_LOW_SIGNAL_DB && p.freq > 0;
    const dom = pitchOk && p != null ? { hz: p.freq, source: 'pitch' as const } : specView?.peak != null ? { hz: specView.peak.hz, source: 'spectrum' as const } : null;
    const domNote = pitchOk && p != null ? noteFor(p.freq) : null;
    const payload: MultimeterSnapshotPayload = {
      kind: 'multimeter_snapshot',
      bandsHz,
      levelsDb,
      bandPeakHoldDb,
      splDb: m.cFastDb, // dBC — matches the display default (owner rev 24)
      peakDb: m.peakDb,
      rmsDb: m.zFastDb,
      peakHoldDb: m.peakHoldDb,
      dominantHz: dom?.hz ?? null,
      dominantSource: dom?.source ?? null,
      note: domNote ? `${domNote.name}${domNote.octave}` : null,
      cents: domNote ? Math.round(domNote.cents * 10) / 10 : null,
      pitchConfidence: pitchOk && p != null ? Math.round(p.confidence * 100) / 100 : null,
      detections: chips.map((c) => ({ label: c.label, detail: c.detail, severity: c.severity })),
      spectrogram:
        sgHistory.length > 0
          ? {
              rows: SG_ROWS,
              fMinHz: SG_F_MIN,
              fMaxHz: SG_F_MAX,
              timeStepSec: (SPEC_POLL_MS * SLOW_EVERY) / 1000,
              dynamicRangeDb: SG_DYN_RANGE,
              // 44 × 64 ≈ 2.8k numbers — well inside the spectrogram tool's
              // own save size (160 × 128), so the recent history stores whole.
              grid: sgHistory.map((c) => [...c.cells]),
            }
          : null,
    };
    const routeName = ApeDsp.getInfo()?.routeName ?? '';
    setDraft({
      payload,
      sampleRate: specView?.sampleRate ?? null,
      flags: meterWarningFlags(m),
      routeName,
    });
    setNotes('');
    // Fresh sheet = fresh optional capture (a prior photo/fix would mis-tag).
    setPhotoUri(null);
    setGeo(null);
    setPhotoBlocked(false);
    setLocationBlocked(false);
  }, [state, chips, sgHistory, specView]);

  const confirmSnapshot = useCallback(() => {
    if (!draft) return;
    // Fold in the optional, gated captures (additive — omitted when absent, so
    // a snapshot with neither saves exactly as before).
    const payload: MultimeterSnapshotPayload = {
      ...draft.payload,
      ...(photoUri ? { photoUri } : {}),
      ...(geo
        ? {
            geo: {
              latitude: geo.latitude,
              longitude: geo.longitude,
              accuracyM: geo.accuracyM,
              timestamp: geo.timestamp,
            },
          }
        : {}),
    };
    saveMeasurement({
      id: Crypto.randomUUID(),
      tool_type: 'multimeter',
      created_at: new Date().toISOString(),
      title: `MultiMeter snapshot — LCF ${fmtDb(draft.payload.splDb)} dBC`,
      notes: notes.trim(),
      input_device: draft.routeName.length > 0 ? draft.routeName : 'Device microphone',
      calibration_status: 'uncalibrated',
      sample_rate: draft.sampleRate,
      measurement_settings: {
        fft_size: FFT_SIZE,
        fraction: 3,
        smoothing: smoothing.label,
        zoom: zoom.label,
        spectro_range_db: SG_DYN_RANGE,
      },
      quality_state: evaluateQuality(draft.flags),
      warning_flags: draft.flags,
      data_payload: payload,
    });
    setDraft(null);
    setJustSaved(true);
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setJustSaved(false), 1800);
  }, [draft, notes, smoothing, zoom, photoUri, geo]);

  // ---- Derived render data ---------------------------------------------------
  const liveFlags = running ? meterWarningFlags(meter) : [];
  const bands = running ? sixthBands : null; // 61-band 1/6-oct (owner rev 24)
  const info = running ? ApeDsp.getInfo() : null;
  const half = SCOPE_H / 2;

  // Horizontal SPL meter fractions (item 7): map −60…0 dBFS → 0…1. Default
  // weighting is C (owner rev 24) to match the status cell.
  const SPL_MIN_DB = -60;
  // Fill maps the RAW weighted dBFS level (−60…0) for the current mode — the
  // caption shows the mode's value/unit (owner rev 24).
  const splFrac = meter ? Math.max(0, Math.min(1, ((modeLevel(meter) ?? SPL_MIN_DB) - SPL_MIN_DB) / -SPL_MIN_DB)) : 0;
  const splHoldFrac = meter ? Math.max(0, Math.min(1, (meter.peakHoldDb - SPL_MIN_DB) / -SPL_MIN_DB)) : 0;

  // Mini-scope geometry (WaveformScreen scope math, compact ×1, autoscaled).
  const [scopeW, setScopeW] = useState(0);
  const scope = useMemo(() => {
    if (!running || scopeW <= 0) return null;
    // Resolution-agnostic 3 s window over the fine engine history (owner
    // 2026-08-15) — auto-adapts to the native bucket duration.
    const total = frames.waveform.length;
    if (total === 0) return null;
    const wantBuckets = Math.max(1, Math.round(total * (SCOPE_WINDOW_SEC / ENGINE_HISTORY_SEC)));
    const src = frames.waveform.slice(0, wantBuckets).reverse(); // oldest → newest
    const n = src.length;
    if (n === 0) return null;
    let observed = 1;
    for (const b of src) {
      const m = Math.max(Math.abs(b.min), Math.abs(b.max));
      if (m > observed) observed = m;
    }
    // Same scale rule as the Waveform Viewer: fixed full-scale for normal signal
    // (no size pulsing), expands only past 0 dBFS (disclosed as "scale ±").
    const scaleMax = Math.max(1.05, observed);
    const usable = half - 10;
    // Vertical zoom ×1/×2/×4 (owner 2026-08-05, item 2) — display scaling only.
    const y = (v: number) => Math.min(SCOPE_H - 2, Math.max(2, half - (v * scopeZoom * usable) / scaleMax));
    // MIN/MAX downsample the fine buckets to a bounded column count: keeps every
    // peak (DAW envelope) at high resolution while staying light (SVG, one filled
    // body — no outline stroke). Column i = oldest→newest, left→right.
    const cols = Math.max(1, Math.min(n, Math.round(scopeW), SCOPE_MAX_COLS));
    const colW = scopeW / cols;
    let top = '';
    let bottomRev = '';
    let rmsTop = '';
    let rmsRev = '';
    let clip = '';
    for (let i = 0; i < cols; i++) {
      const b0 = Math.floor((i / cols) * n);
      const b1 = Math.min(n, Math.max(b0 + 1, Math.floor(((i + 1) / cols) * n)));
      let mn = Infinity;
      let mx = -Infinity;
      let rms = 0;
      let clipped = false;
      for (let k = b0; k < b1; k++) {
        const b = src[k];
        if (b.max > mx) mx = b.max;
        if (b.min < mn) mn = b.min;
        if (b.rms > rms) rms = b.rms;
        if (b.clipped) clipped = true;
      }
      if (mx === -Infinity) {
        mx = 0;
        mn = 0;
      }
      const x = ((i + 0.5) * colW).toFixed(1);
      let y1 = y(mx);
      let y2 = y(mn);
      if (y2 - y1 < 1) {
        y1 -= 0.5;
        y2 += 0.5;
      }
      const cmd = i === 0 ? 'M' : 'L';
      top += `${cmd}${x},${y1.toFixed(1)}`;
      bottomRev = `L${x},${y2.toFixed(1)}` + bottomRev;
      rmsTop += `${cmd}${x},${y(rms).toFixed(1)}`;
      rmsRev = `L${x},${y(-rms).toFixed(1)}` + rmsRev;
      if (clipped) clip += `M${x},3L${x},9`;
    }
    // Velocity-ramp axis: blue at the mid line (0), red at |amp| = full scale.
    const fullPix = (scopeZoom * usable) / scaleMax;
    return {
      area: top + bottomRev + 'Z',
      rmsArea: rmsTop + rmsRev + 'Z',
      clip,
      clipW: Math.max(1.5, colW * 0.8),
      scaleMax,
      observed,
      gradY0: half - fullPix,
      gradY1: half + fullPix,
    };
  }, [running, frames.waveform, scopeW, half, scopeZoom]);

  // Visible 1/6-oct bands within the zoom window (log-mapped x + edges).
  const visibleBands = useMemo(() => {
    if (bands == null || plotW <= 0) return [];
    const edge = SIXTH_EDGE; // 1/6-oct half-width = center × 2^(±1/12)
    const out: { key: number; x: number; w: number; level: number; hold: number; ok: boolean }[] = [];
    bands.centers.forEach((c, i) => {
      if (c < zoom.min || c > zoom.max) return; // outside the window — hidden
      const x1 = Math.max(0, xForHz(Math.max(c / edge, zoom.min)));
      const x2 = Math.min(plotW, xForHz(Math.min(c * edge, zoom.max)));
      const pad = x2 - x1 > 4 ? 1 : 0.5;
      out.push({
        key: i,
        x: x1 + pad,
        w: Math.max(1, x2 - x1 - pad * 2),
        level: bands.levelsDb[i],
        hold: bands.peakHoldDb[i],
        ok: bands.resolvable[i],
      });
    });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bands, plotW, zoom]);
  const anyUnresolvable = visibleBands.some((b) => !b.ok);

  const freqTicks = useMemo(() => {
    const targets = [31.5, 63, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
    return targets
      .filter((f) => f >= zoom.min * 1.05 && f <= zoom.max * 0.95)
      .filter((_, i, arr) => (arr.length > 5 ? i % 2 === 0 : true))
      .map((f) => ({ f, label: f >= 1000 ? `${f / 1000}k` : `${f}` }));
  }, [zoom]);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={{ flexShrink: 1, flexGrow: 1 }}>
          <Text style={styles.title}>PRO AUDIO MULTIMETER</Text>
          <Text style={styles.subtitle}>All-in-one live meter · mono · uncalibrated</Text>
        </View>
        <AccuracyNote compact detail="Levels read as an ESTIMATED dB SPL (dBA/dBC/dB SPL, nominal reference) or raw dBFS — long-press the SPL cell to switch. This runs on your phone’s UNCALIBRATED microphone, so every number is APPROXIMATE, for learning, NOT a certified reading. For accurate, absolute measurements use a calibrated SPL meter, measurement mic, or a dedicated instrument." />
      </View>

      {/* 1 ── TOP STATUS BAR — pinned, instrument-style mono digits. Shown only
             while capturing (owner 2026-08-05, item 1: the dead readouts are
             removed from the start screen). "SPL" carries the SPL screen's
             convention: A-weighted FAST, dBFS-referenced, UNCALIBRATED. */}
      {(running || micPaused) && (
        <>
          <View style={styles.statusBar}>
            {/* SPL cell — LONG-PRESS to switch A/C/FS/SPL (owner rev 24); tap = help.
                Label/value/unit follow the mode; the mode RIPPLES to PEAK/RMS +
                the horizontal meter. Colour uses the RAW dBFS (amplitude ramp). */}
            <Pressable
              style={styles.statusCell}
              onPress={() => help('spl')}
              onLongPress={() => setUnitPopup(true)}
              delayLongPress={350}
              accessibilityRole="button"
              accessibilityLabel={`${MODE_LABEL[unitMode]} (${MODE_UNIT[unitMode]}), ${calibrated ? 'field-calibrated approximate' : unitMode === 'FS' ? 'relative digital level' : 'uncalibrated estimate'}. Long-press to change mode; tap for details.`}
            >
              <View style={styles.statusHoldRow}>
                <Text style={styles.statusLabel}>{MODE_LABEL[unitMode]}</Text>
                <Text style={styles.statusInfo}>ⓘ</Text>
              </View>
              <Text style={[styles.statusValue, meter ? { color: levelColorForDb(modeLevel(meter) as number) } : null]}>
                {meter ? fmtDb(applyRef(modeLevel(meter))) : '—'}
              </Text>
            </Pressable>
            <Pressable accessibilityHint="Press and hold for an explanation." style={styles.statusCell} onLongPress={() => help('peak')} delayLongPress={350}>
              <Text style={styles.statusLabel}>PEAK</Text>
              <Text style={[styles.statusValue, meter ? { color: levelColorForDb(meter.peakDb) } : null]}>
                {meter ? fmtDb(applyRef(meter.peakDb)) : '—'}
              </Text>
            </Pressable>
            <Pressable accessibilityHint="Press and hold for an explanation." style={styles.statusCell} onLongPress={() => help('rms')} delayLongPress={350}>
              <Text style={styles.statusLabel}>RMS</Text>
              <Text style={[styles.statusValue, meter ? { color: levelColorForDb(meter.zFastDb) } : null]}>
                {meter ? fmtDb(applyRef(meter.zFastDb)) : '—'}
              </Text>
            </Pressable>
            {/* PEAK HOLD: tap the cell (or the ⟲, or long-press) to reset —
                clears the native meter hold, the per-band holds, AND the red
                peak latch (user request: tap the readout, not just the key). */}
            <Pressable
              style={styles.statusCell}
              onPress={onResetPeakHold}
              onLongPress={onResetPeakHold}
              delayLongPress={350}
              accessibilityRole="button"
              accessibilityLabel="Peak hold — tap to reset"
            >
              <View style={styles.statusHoldRow}>
                <Text style={styles.statusLabel}>PK HOLD</Text>
                <Pressable onPress={onResetPeakHold} hitSlop={8} accessibilityRole="button" accessibilityLabel="Reset peak hold">
                  <Text style={styles.statusReset}>⟲</Text>
                </Pressable>
              </View>
              <Text style={[styles.statusValue, meter ? { color: levelColorForDb(meter.peakHoldDb) } : null]}>
                {meter ? fmtDb(applyRef(meter.peakHoldDb)) : '—'}
              </Text>
            </Pressable>
          </View>
          <Text style={styles.statusUnit}>
            {MODE_UNIT[unitMode]} ·{' '}
            {calibrated
              ? 'field-calibrated (approximate)'
              : unitMode === 'FS'
                ? 'relative digital level — not dB SPL'
                : 'uncalibrated estimate — approximate dB SPL, not a calibrated meter'}
          </Text>

          {/* 7 ── Horizontal main SPL level meter (owner 2026-08-05) — like the
                 VU screen's, but horizontal + thinner. Left→right level with a
                 peak-hold tick, MIDI-coloured (blue quiet → red loud). */}
          <View style={styles.hMeterWrap}>
            <View style={styles.hMeterTrack}>
              <GradientView
                colors={rampColors(splFrac)}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.hMeterFill, { width: `${splFrac * 100}%` }]}
              />
              {splHoldFrac > 0 ? (
                <View style={[styles.hMeterHold, { left: `${Math.min(99.3, splHoldFrac * 100)}%` }]} />
              ) : null}
            </View>
            {/* dBFS reference scale under the bar (owner rev 24) — the meter maps
                −60…0 dBFS linearly, so evenly-spaced ticks read true. */}
            <View style={styles.hMeterScale}>
              {[-60, -50, -40, -30, -20, -10, 0].map((db) => (
                <View key={db} style={styles.hMeterTickCol}>
                  <View style={styles.hMeterTick} />
                  {/* Labels follow the mode: raw dBFS in FS, offset SPL estimate else. */}
                  <Text style={styles.hMeterTickLabel}>{unitMode === 'FS' ? db : Math.max(0, db + splOffset)}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.hMeterCaption}>
              {MODE_LABEL[unitMode]} {meter ? fmtDb(applyRef(modeLevel(meter))) : '—'} {MODE_UNIT[unitMode]}
            </Text>
          </View>
        </>
      )}

      <ScrollView contentContainerStyle={styles.scroll} scrollEnabled={scrollEnabled}>
        {/* Honest not-ready card (absent/spike/denied/error). */}
        <EngineGate state={state} lastError={lastError} />

        {!micPaused && (state === 'idle' || state === 'starting') && (
          <>
            <Text style={styles.intro}>
              Every meter at once: weighted level, peak and RMS, a 61-band (1/6-octave) spectrum,
              a scrolling spectrogram, a live oscilloscope, dominant frequency with musical
              note, and smart signal detection. Levels read A/C-weighted (dBA/dBC) in a familiar
              scale, but from your phone’s uncalibrated mic — RELATIVE and approximate, not a
              calibrated SPL meter. Press START to begin capture; nothing is simulated while stopped.
            </Text>
            <GlassButton
              label={state === 'starting' ? 'STARTING…' : 'START'}
              tint="steel"
              height={52}
              fontSize={15}
              disabled={state === 'starting'}
              onPress={onStart}
            />
          </>
        )}

        {(running || micPaused) && (
          <>
            {/* 2 ── LIVE SPECTRUM ANALYZER (the hero) */}
            <View style={styles.panel}>
              <View style={styles.panelHead}>
                <Text style={styles.panelEyebrow}>LIVE SPECTRUM</Text>
                <Text style={styles.panelSettings}>
                  1/6 OCT · derived · FFT {FFT_SIZE} · α {smoothing.bandAlpha.toFixed(2)}
                </Text>
              </View>

              {/* Drag surface: InteractionZone locks the page scroll for the
                  gesture's duration (LabShell pattern, explicit onLock). */}
              <InteractionZone onLock={(locked) => setScrollEnabled(!locked)}>
                <View
                  style={{ height: heroH }}
                  onLayout={(e) => setPlotW(Math.round(e.nativeEvent.layout.width))}
                  onStartShouldSetResponder={() => true}
                  onMoveShouldSetResponder={() => true}
                  onResponderGrant={(e) => setCursorX(Math.max(0, Math.min(plotW, e.nativeEvent.locationX)))}
                  onResponderMove={(e) => setCursorX(Math.max(0, Math.min(plotW, e.nativeEvent.locationX)))}
                >
                  {plotW > 0 && (
                    <Svg width={plotW} height={heroH}>
                      <Defs>
                        {/* ONE shared LED ramp, anchored to the dB scale
                            (userSpaceOnUse) — every bar shares it. */}
                        <LinearGradient id="mmBarFill" x1="0" y1={ZERO_Y} x2="0" y2={floorY} gradientUnits="userSpaceOnUse">
                          <Stop offset="0" stopColor={BAR_HOT} />
                          <Stop offset="0.13" stopColor={BAR_HI} />
                          <Stop offset="0.5" stopColor={BAR_MID} />
                          <Stop offset="1" stopColor={BAR_DEEP} />
                        </LinearGradient>
                      </Defs>
                      <Rect x={0} y={0} width={plotW} height={heroH} rx={8} fill={PLOT_BG} />
                      <Rect x={0.5} y={0.5} width={plotW - 1} height={heroH - 1} rx={7.5} stroke={PLOT_FRAME} strokeWidth={1} fill="none" />
                      {GRID_DBS_MINOR.map((db) => (
                        <Line key={db} x1={2} y1={yForDb(db)} x2={plotW - 2} y2={yForDb(db)} stroke={GRID_MINOR} strokeWidth={0.75} />
                      ))}
                      {GRID_DBS.map((db) => (
                        <Line
                          key={db}
                          x1={2}
                          y1={yForDb(db)}
                          x2={plotW - 2}
                          y2={yForDb(db)}
                          stroke={db === 0 ? AXIS : GRID}
                          strokeWidth={db === 0 ? 1.2 : db === FLOOR_DB ? 1.5 : 1}
                        />
                      ))}
                      {/* 31-band LED columns (native frame; Q2 gray slots). */}
                      {visibleBands.map((b) => {
                        if (!b.ok) {
                          return (
                            <Rect key={`slot-${b.key}`} x={b.x} y={ZERO_Y} width={b.w} height={floorY - ZERO_Y} fill={SLOT_GRAY} fillOpacity={0.14} />
                          );
                        }
                        const barTop = yForDb(b.level);
                        return (
                          <G key={`band-${b.key}`}>
                            {b.level > FLOOR_DB && (
                              <>
                                <Rect x={b.x} y={barTop} width={b.w} height={floorY - barTop} fill="url(#mmBarFill)" fillOpacity={0.96} />
                                <Rect x={b.x - 0.75} y={barTop - 2.5} width={b.w + 1.5} height={5} rx={1.5} fill={CAP_HALO} fillOpacity={0.22} />
                                <Rect x={b.x} y={barTop - 1.1} width={b.w} height={2.2} rx={1} fill={CAP_CORE} fillOpacity={0.95} />
                              </>
                            )}
                            {b.hold > FLOOR_DB && (
                              <Rect x={b.x + b.w * 0.1} y={yForDb(b.hold) - 1} width={b.w * 0.8} height={2} rx={1} fill={PEAK_TICK} fillOpacity={0.95} />
                            )}
                          </G>
                        );
                      })}
                      {/* No FFT/AVG line traces over the bars (owner 2026-08-15:
                          "remove the trace ... I never wanted that"). The LED bars
                          + peak-hold ARE the RTA. */}
                      {cursorX != null && <Line x1={cursorX} y1={2} x2={cursorX} y2={heroH - 2} stroke={CURSOR} strokeWidth={1.2} opacity={0.9} />}
                    </Svg>
                  )}
                  {/* Cursor readout chip riding the cursor line. */}
                  {cursorInfo != null && cursorX != null && plotW > 0 && (
                    <View
                      style={[
                        styles.cursorChip,
                        { left: Math.max(0, Math.min(plotW - 128, cursorX - 64)) },
                      ]}
                      pointerEvents="none"
                    >
                      <Text style={styles.cursorChipText}>
                        {fmtHz(cursorInfo.hz)} Hz · {cursorInfo.db != null ? `${fmtDb(cursorInfo.db)} dB` : 'below floor'}
                      </Text>
                    </View>
                  )}
                </View>
              </InteractionZone>

              {/* Frequency ticks for the current zoom window. */}
              <View style={styles.tickRow}>
                {plotW > 0 &&
                  freqTicks.map((t) => (
                    <Text key={t.f} style={[styles.tickLabel, { left: xForHz(t.f) - 24 }]}>
                      {t.label}
                    </Text>
                  ))}
              </View>

              <View style={styles.legendRow}>
                <Text style={styles.legendItem}>
                  <Text style={{ color: PEAK_TICK }}>▔</Text> PK HOLD
                </Text>
                {cursorX != null ? (
                  <Pressable onPress={() => setCursorX(null)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Clear cursor">
                    <Text style={styles.cursorClear}>CURSOR ✕</Text>
                  </Pressable>
                ) : (
                  <Text style={styles.legendHint}>tap/drag to read Hz + dB</Text>
                )}
              </View>
              <Text style={styles.unitLine}>relative dB · uncalibrated</Text>
              {anyUnresolvable && (
                <Text style={styles.grayNote}>grayed bands: insufficient resolution at this setting</Text>
              )}
            </View>

            {/* MINI SPECTROGRAM + MINI OSCILLOSCOPE — moved up, directly under the
                spectrum analyzer and above the user buttons (owner 2026-08-05,
                item 6). The FULL/LOW/MID/HIGH spectrum-zoom row is removed
                (item 3); the scope carries its own ×1/×2/×4 zoom (item 2). */}
            <View style={styles.lowerRow}>
              <View style={styles.miniPanel}>
                <Pressable accessibilityHint="Press and hold for an explanation." onLongPress={() => help('spectrogram')} delayLongPress={350}>
                  <Text style={styles.miniEyebrow}>SPECTROGRAM</Text>
                </Pressable>
                <View style={styles.sgSurface}>
                  <SgGridSized history={sgHistory} anchor={SG_ANCHOR_DB} />
                </View>
                <Text style={styles.miniMeta}>
                  {SG_F_MIN}–{SG_F_MAX / 1000}k · {SG_DYN_RANGE} dB · ~{(1000 / (SPEC_POLL_MS * SLOW_EVERY)).toFixed(0)} col/s
                </Text>
              </View>

              <View style={styles.miniPanel}>
                <Pressable accessibilityHint="Press and hold for an explanation." onLongPress={() => help('oscilloscope')} delayLongPress={350}>
                  <Text style={styles.miniEyebrow}>OSCILLOSCOPE</Text>
                </Pressable>
                <View style={styles.scopeSurface} onLayout={(e) => setScopeW(Math.round(e.nativeEvent.layout.width))}>
                  {scopeW > 0 && (
                    <Svg width={scopeW} height={SCOPE_H}>
                      {scope && (
                        <Defs>
                          {/* Amplitude → MIDI-velocity colour (blue at the mid line
                              → red at ±full scale), keyed to true level. */}
                          <LinearGradient
                            id="mmWfLevel"
                            x1={0}
                            y1={scope.gradY0}
                            x2={0}
                            y2={scope.gradY1}
                            gradientUnits="userSpaceOnUse"
                          >
                            {WAVE_LEVEL_STOPS.map((s) => (
                              <Stop key={s.offset} offset={s.offset} stopColor={s.color} />
                            ))}
                          </LinearGradient>
                        </Defs>
                      )}
                      {/* Fixed center line = the zero-pressure reference (0 amplitude
                          → MIDI-0 blue): any DC offset shows as an asymmetric
                          envelope around it. */}
                      <Line x1={0} x2={scopeW} y1={half} y2={half} stroke={MIDLINE_BLUE} strokeWidth={1} />
                      {scope && (
                        <>
                          <Path d={scope.area} fill="url(#mmWfLevel)" opacity={0.85} />
                          <Path d={scope.rmsArea} fill="url(#mmWfLevel)" opacity={0.6} />
                          {scope.clip !== '' && <Path d={scope.clip} stroke={colors.red} strokeWidth={scope.clipW} />}
                        </>
                      )}
                      <Rect x={0.5} y={0.5} width={scopeW - 1} height={SCOPE_H - 1} stroke="#26262c" strokeWidth={1} fill="none" />
                    </Svg>
                  )}
                </View>
                {/* Oscilloscope vertical zoom ×1/×2/×4 (owner 2026-08-05, item 2). */}
                <View style={styles.scopeZoomRow}>
                  {([1, 2, 4] as const).map((z) => (
                    <Pressable
                      key={z}
                      onPress={() => setScopeZoom(z)}
                      hitSlop={4}
                      accessibilityRole="button"
                      accessibilityState={{ selected: scopeZoom === z }}
                      accessibilityLabel={`Oscilloscope zoom ${z} times`}
                      style={[styles.scopeZoomChip, scopeZoom === z && styles.scopeZoomChipOn]}
                    >
                      <Text style={[styles.scopeZoomText, scopeZoom === z && styles.scopeZoomTextOn]}>×{z}</Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={styles.miniMeta}>
                  3 s window · ×{scopeZoom}{scope && scope.observed > 1 ? ` · scale ±${scope.scaleMax.toFixed(2)}` : ''}
                </Text>
              </View>
            </View>

            {/* User controls — below the displays (owner 2026-08-05, item 6). */}
            <View style={styles.ctrlRow}>
              <Pressable accessibilityHint="Press and hold for an explanation." onLongPress={() => help('smoothing')} delayLongPress={350}>
                <Text style={styles.ctrlLabel}>SMOOTH</Text>
              </Pressable>
              {SMOOTHINGS.map((s) => (
                <Chip key={s.label} label={s.label} active={smoothing.label === s.label} onPress={() => applySmoothing(s)} />
              ))}
            </View>

            <DisplayGuideButton onPress={helpAll} />

            {/* 5 ── DOMINANT FREQUENCY · NOTE · CENTS · COUNTER */}
            <View style={styles.panel}>
              <View style={styles.panelHead}>
                <Text style={styles.panelEyebrow}>FREQUENCY & PITCH</Text>
                <Text style={styles.panelSettings}>A4 = {A4} Hz</Text>
              </View>
              <View style={styles.freqGrid}>
                <Pressable accessibilityHint="Press and hold for an explanation." style={styles.freqCell} onLongPress={() => help('dominant')} delayLongPress={350}>
                  <Text style={styles.statusLabel}>DOMINANT</Text>
                  <Text style={styles.freqValue}>{dominant ? fmtHz(dominant.hz) : '—'}</Text>
                  <Text style={styles.freqSource}>
                    {dominant ? (dominant.source === 'pitch' ? 'from pitch tracker' : 'from spectrum peak') : 'no source live'}
                  </Text>
                </Pressable>
                <Pressable accessibilityHint="Press and hold for an explanation." style={styles.freqCell} onLongPress={() => help('note')} delayLongPress={350}>
                  <Text style={styles.statusLabel}>NOTE</Text>
                  <Text style={[styles.freqValue, isHeld && styles.dim]}>
                    {note ? `${note.name}${note.octave}` : '—'}
                  </Text>
                  <Text style={[styles.freqSource, isHeld && styles.dim]}>
                    {note ? `${note.cents >= 0 ? '+' : ''}${note.cents.toFixed(1)} cents` : 'no stable pitch'}
                  </Text>
                </Pressable>
                <Pressable accessibilityHint="Press and hold for an explanation." style={styles.freqCell} onLongPress={() => help('counter')} delayLongPress={350}>
                  <Text style={styles.statusLabel}>COUNTER</Text>
                  <Text style={[styles.freqValue, isHeld && styles.dim]}>
                    {shownPitchHz != null ? fmtHz(shownPitchHz) : '—'}
                  </Text>
                  <Text style={styles.freqSource}>
                    Hz · conf {live ? `${Math.round(live.confidence * 100)}%` : '—'}
                  </Text>
                </Pressable>
              </View>
              {/* Cents indicator — ±50¢ scale, ±5¢ green in-tune lock glow. */}
              <Pressable
                onLongPress={() => help('cents')}
                delayLongPress={350}
                accessibilityRole="image"
                accessibilityLabel="Tuning indicator, plus or minus 50 cents. Press and hold for an explanation."
              >
                <View style={styles.centsScale}>
                  <View style={[styles.centsZoneInTune, inTune && styles.centsZoneLocked]} />
                  <View style={styles.centsZero} />
                  {note && (
                    <View
                      style={[
                        styles.centsNeedle,
                        { left: `${50 + Math.max(-50, Math.min(50, note.cents))}%` },
                        inTune && styles.centsNeedleInTune,
                        isHeld && styles.dim,
                      ]}
                    />
                  )}
                </View>
              </Pressable>
              {isHeld && heldAgeMs != null && (
                <Text style={styles.holdNote}>
                  last stable pitch · {(heldAgeMs / 1000).toFixed(1)} s ago — not live
                </Text>
              )}
            </View>

            {/* 6 ── SYSTEM INFO. CPU usage is OMITTED — not measurable from JS
                   honestly (no native counter exposed); input gain OMITTED —
                   the engine does not expose it (never faked). */}
            <View style={styles.sysRow}>
              <View style={styles.sysCell}>
                <Text style={styles.statusLabel}>SAMPLE RATE</Text>
                <Text style={styles.sysValue}>
                  {running && specView?.sampleRate != null ? `${(specView.sampleRate / 1000).toFixed(1)}k` : '—'}
                </Text>
              </View>
              <View style={styles.sysCell}>
                <Text style={styles.statusLabel}>FFT</Text>
                <Text style={styles.sysValue}>{FFT_SIZE}</Text>
              </View>
              <View style={styles.sysCell}>
                <Text style={styles.statusLabel}>DISP RANGE</Text>
                <Text style={styles.sysValue}>{-FLOOR_DB} dB</Text>
              </View>
              <View style={styles.sysCell}>
                <Text style={styles.statusLabel}>INPUT</Text>
                <Text style={styles.sysValue} numberOfLines={1}>
                  {info && info.routeName.length > 0 ? info.routeName : '—'}
                </Text>
              </View>
            </View>

            {/* Live quality warnings (spec §6) — same flags stored on save. */}
            {liveFlags.map((f) => (
              <Text key={f} style={styles.liveWarn}>
                ⚠ {WARNING_INFO[f].message} {WARNING_INFO[f].hint}
              </Text>
            ))}

            {/* SMART DETECTION moved to the very bottom (owner rev 24): its chips
                come and go with the signal, so keeping it mid-scroll reflowed the
                panels below it. It now lives under everything else. */}

            {/* 8 ── MEASUREMENT SNAPSHOT */}
            <Pressable
              style={[styles.snapBtn, justSaved && styles.snapBtnSaved]}
              onPress={openSnapshot}
              accessibilityRole="button"
              accessibilityLabel="Measurement snapshot"
            >
              <Text style={[styles.snapText, justSaved && styles.snapTextSaved]}>
                {justSaved ? 'SNAPSHOT SAVED ✓' : '● MEASUREMENT SNAPSHOT'}
              </Text>
            </Pressable>

            <GlassButton
              label={running ? 'STOP' : 'START'}
              tint="steel"
              height={52}
              fontSize={15}
              onPress={running ? onStop : onStart}
            />

            <Pressable
              onPress={() => navigation.navigate('ToolLibrary', { toolKey: 'multimeter' })}
              accessibilityRole="button"
              accessibilityLabel="View saved measurements"
            >
              <Text style={styles.libraryLink}>VIEW SAVED MEASUREMENTS ›</Text>
            </Pressable>

            {/* 9 ── SMART DETECTION — pinned to the very bottom so its changing
                   height never pushes the meters/controls above it (owner rev 24). */}
            <View style={styles.panel}>
              <Pressable accessibilityHint="Press and hold for an explanation." onLongPress={() => help('detection')} delayLongPress={350}>
                <Text style={styles.panelEyebrow}>SMART DETECTION</Text>
              </Pressable>
              {chips.length === 0 ? (
                <Text style={styles.detectEmpty}>no conditions detected right now</Text>
              ) : (
                <View style={styles.detectWrap}>
                  {chips.map((c) => (
                    <View key={c.id} style={[styles.detectChip, c.severity === 'red' ? styles.detectChipRed : styles.detectChipAmber]}>
                      <Text style={[styles.detectLabel, c.severity === 'red' ? styles.detectLabelRed : styles.detectLabelAmber]}>
                        {c.label}
                      </Text>
                      <Text style={styles.detectDetail}>{c.detail}</Text>
                    </View>
                  ))}
                </View>
              )}
              {/* Owner's framing — VERBATIM. */}
              <Text style={styles.detectCaption}>
                likely conditions based on the measured signal — not guarantees
              </Text>
            </View>
          </>
        )}

        <Text style={styles.reminder}>
          Every level here is A/C-weighted (dBA/dBC) from your phone’s uncalibrated mic — RELATIVE
          and approximate, not a calibrated SPL meter. Microphone position and the phone mic's
          response strongly affect every panel.
        </Text>
      </ScrollView>

      {/* Readout-mode chooser (owner rev 24) — long-press the SPL cell opens it;
          picking a mode applies + closes. Tap outside to dismiss. */}
      {unitPopup ? (
        <Pressable style={styles.unitPopupBackdrop} onPress={() => setUnitPopup(false)} accessibilityRole="button" accessibilityLabel="Close">
          <View style={styles.unitPopupCard}>
            <Text style={styles.unitPopupTitle}>READOUT MODE</Text>
            <View style={styles.unitPopupGrid}>
              {UNIT_MODES.map((m) => (
                <Pressable
                  key={m}
                  style={[styles.unitPopupOpt, unitMode === m && styles.unitPopupOptSel]}
                  onPress={() => {
                    setUnitMode(m);
                    setUnitPopup(false);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: unitMode === m }}
                >
                  <Text style={[styles.unitPopupOptText, unitMode === m && styles.unitPopupOptTextSel]}>{MODE_UNIT[m]}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.unitPopupNote}>
              {calibrated ? 'Field-calibrated (approximate).' : 'FS = raw digital; A/C/SPL = uncalibrated dB-SPL estimate.'}
            </Text>
          </View>
        </Pressable>
      ) : null}

      {/* Snapshot confirm sheet: notes, then save (values frozen at press). */}
      <Modal visible={draft != null} transparent animationType="fade" onRequestClose={() => setDraft(null)}>
        <View style={styles.sheetScrim}>
          <View style={styles.sheetCard}>
            <Text style={styles.sheetTitle}>MEASUREMENT SNAPSHOT</Text>
            <Text style={styles.sheetSummary}>
              {draft
                ? `LCF ${fmtDb(draft.payload.splDb)} dBC · peak ${fmtDb(draft.payload.peakDb)} · ` +
                  `${draft.payload.bandsHz.length} bands · ${draft.payload.detections.length} detection${
                    draft.payload.detections.length === 1 ? '' : 's'
                  } · uncalibrated relative`
                : ''}
            </Text>
            <TextInput
              style={styles.sheetInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Notes (room, source, position…)"
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={280}
            />
            {/* Optional room photo — gated: only when the module is in this
                build. Nothing is uploaded; the URI is stored with the snapshot. */}
            {photoAvailable ? (
              photoUri ? (
                <View style={styles.captureRow}>
                  <Image source={{ uri: photoUri }} style={styles.captureThumb} />
                  <View style={styles.captureRowBody}>
                    <Text style={styles.captureLabel}>ROOM PHOTO ATTACHED</Text>
                    <View style={styles.captureActions}>
                      <Pressable onPress={onAddPhoto} hitSlop={6} accessibilityRole="button" accessibilityLabel="Retake photo">
                        <Text style={styles.captureAction}>RETAKE</Text>
                      </Pressable>
                      <Pressable onPress={() => setPhotoUri(null)} hitSlop={6} accessibilityRole="button" accessibilityLabel="Remove photo">
                        <Text style={styles.captureActionRemove}>REMOVE</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              ) : (
                <Pressable style={styles.captureBtn} onPress={onAddPhoto} accessibilityRole="button" accessibilityLabel="Add room photo">
                  <Text style={styles.captureBtnText}>+ ADD PHOTO</Text>
                </Pressable>
              )
            ) : (
              <Text style={styles.sheetFuture}>Photo capture needs the next dev build.</Text>
            )}
            {photoAvailable && photoBlocked && (
              <Text style={styles.captureBlocked}>
                Camera access is off — enable it in your device Settings to add a photo.
              </Text>
            )}

            {/* Optional GPS tag — gated the same way. */}
            {locationAvailable ? (
              geo ? (
                <View style={styles.captureRow}>
                  <View style={styles.captureRowBody}>
                    <Text style={styles.captureLabel}>LOCATION TAGGED</Text>
                    <Text style={styles.captureGeo}>
                      📍 {geo.latitude.toFixed(5)}, {geo.longitude.toFixed(5)}
                      {geo.accuracyM != null ? ` (±${Math.round(geo.accuracyM)}m)` : ''}
                    </Text>
                    <View style={styles.captureActions}>
                      <Pressable onPress={onTagLocation} hitSlop={6} accessibilityRole="button" accessibilityLabel="Re-tag location">
                        <Text style={styles.captureAction}>RE-TAG</Text>
                      </Pressable>
                      <Pressable onPress={() => setGeo(null)} hitSlop={6} accessibilityRole="button" accessibilityLabel="Remove location">
                        <Text style={styles.captureActionRemove}>REMOVE</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              ) : (
                <Pressable style={styles.captureBtn} onPress={onTagLocation} accessibilityRole="button" accessibilityLabel="Tag location">
                  <Text style={styles.captureBtnText}>📍 TAG LOCATION</Text>
                </Pressable>
              )
            ) : (
              <Text style={styles.sheetFuture}>Location tagging needs the next dev build.</Text>
            )}
            {locationAvailable && locationBlocked && (
              <Text style={styles.captureBlocked}>
                Location access is off — enable it in your device Settings to tag this snapshot.
              </Text>
            )}
            <View style={styles.sheetBtnRow}>
              <Pressable style={styles.sheetBtn} onPress={() => setDraft(null)} accessibilityRole="button" accessibilityLabel="Cancel">
                <Text style={styles.sheetBtnText}>CANCEL</Text>
              </Pressable>
              <Pressable style={[styles.sheetBtn, styles.sheetBtnSave]} onPress={confirmSnapshot} accessibilityRole="button" accessibilityLabel="Save snapshot">
                <Text style={[styles.sheetBtnText, styles.sheetBtnSaveText]}>SAVE</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Pre-permission explainers — rendered once; open above the sheet. */}
      <PermissionPrompt {...photoFlow.promptProps} />
      <PermissionPrompt {...locationFlow.promptProps} />
      {sheet}
    </View>
  );
}

/** Width-measuring host for the memoized raster (keeps SgGrid's memo keyed by
 *  the history reference — layout state lives here, not in the screen body). */
function SgGridSized({ history, anchor }: { history: SgColumnData[]; anchor: number }) {
  const [w, setW] = useState(0);
  return (
    <View style={{ height: SG_H }} onLayout={(e) => setW(Math.round(e.nativeEvent.layout.width))}>
      <SgGrid history={history} anchor={anchor} width={w} />
      {history.length === 0 && <Text style={styles.sgWaiting}>waiting for frames…</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingBottom: 8 },
  back: { fontFamily: fonts.oswaldSemiBold, fontSize: 30, color: colors.textSub, marginTop: -4, paddingRight: 2 },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 17, letterSpacing: 1.4, color: colors.textPrimary },
  subtitle: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.textSub, marginTop: 1 },
  scroll: { padding: 16, paddingTop: 10, paddingBottom: 28, gap: 14 },

  intro: { fontFamily: fonts.barlowRegular, fontSize: 15.5, lineHeight: 23, color: colors.textSecondary },

  // 1 ── Top status bar (pinned).
  statusBar: { flexDirection: 'row', gap: 8, paddingHorizontal: 14 },
  statusCell: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#101014',
    paddingVertical: 8,
    paddingHorizontal: 8,
    gap: 2,
  },
  statusHoldRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 1.2, color: colors.textSub },
  // Honesty cue on the dBC readout (owner rev 24) — tap the cell for the note.
  statusInfo: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, color: colors.amberLabel, marginLeft: 3, marginTop: -1 },
  statusValue: { fontFamily: fonts.mono, fontSize: 17, color: colors.textPrimary },
  statusReset: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, color: '#c9d6e4', marginTop: -2 },

  // Horizontal SPL level meter (owner 2026-08-05, item 7) — thin, left→right.
  hMeterWrap: { paddingHorizontal: 14, marginTop: 6, gap: 3 },
  hMeterTrack: {
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2a2a30',
    backgroundColor: '#0c0c10',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  hMeterFill: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 6 },
  hMeterHold: { position: 'absolute', top: -1, bottom: -1, width: 2, backgroundColor: '#ffffff' },
  // dBFS reference scale under the horizontal meter (owner rev 24).
  hMeterScale: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 1 },
  hMeterTickCol: { alignItems: 'center' },
  hMeterTick: { width: 1, height: 4, backgroundColor: '#4a4a52' },
  hMeterTickLabel: { fontFamily: fonts.mono, fontSize: 9, color: colors.textMuted, marginTop: 1 },
  hMeterCaption: { fontFamily: fonts.mono, fontSize: 12, color: colors.textSub },

  // Oscilloscope ×1/×2/×4 zoom chips (item 2).
  scopeZoomRow: { flexDirection: 'row', gap: 5, marginTop: 5 },
  scopeZoomChip: {
    flex: 1,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    backgroundColor: '#141418',
    paddingVertical: 4,
    alignItems: 'center',
  },
  scopeZoomChipOn: { borderColor: 'rgba(55,224,95,.65)', backgroundColor: '#0c2012' },
  scopeZoomText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 0.8, color: colors.textSub },
  scopeZoomTextOn: { color: '#37e05f' },
  statusUnit: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.textSubAlt,
    paddingHorizontal: 14,
    paddingTop: 4,
  },

  // Panels (house card chrome).
  panel: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    padding: 12,
    gap: 6,
  },
  panelHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  panelEyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.6, color: colors.amberLabel },
  panelSettings: { fontFamily: fonts.mono, fontSize: 12, color: colors.textSubAlt },

  // Hero spectrum extras.
  cursorChip: {
    position: 'absolute',
    top: 4,
    width: 128,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,157,224,.5)',
    backgroundColor: 'rgba(12,12,15,.92)',
    paddingVertical: 3,
    alignItems: 'center',
  },
  cursorChipText: { fontFamily: fonts.mono, fontSize: 12, color: '#ff9de0' },
  cursorClear: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1, color: '#ff9de0' },
  tickRow: { height: 16 },
  tickLabel: {
    position: 'absolute',
    top: 0,
    width: 48,
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
  legendRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  legendItem: { fontFamily: fonts.mono, fontSize: 12, color: colors.textSub },
  legendHint: { fontFamily: fonts.barlowRegular, fontSize: 12, color: colors.textMuted },
  unitLine: { fontFamily: fonts.mono, fontSize: 12, color: colors.textSubAlt },
  grayNote: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSubAlt },

  // Control chips.
  ctrlRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ctrlLabel: { width: 66, fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.4, color: colors.textSub },
  chip: {
    paddingHorizontal: 12,
    height: 30,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: '#18181c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: { borderColor: 'rgba(201,214,228,.6)', backgroundColor: '#15181d' },
  chipText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.textSub },
  chipTextActive: { color: '#c9d6e4' },

  // 3+4 ── lower panels.
  lowerRow: { flexDirection: 'row', gap: 10 },
  miniPanel: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    padding: 10,
    gap: 6,
  },
  miniEyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 1.4, color: colors.amberLabel },
  miniMeta: { fontFamily: fonts.mono, fontSize: 12, color: colors.textMuted },
  sgSurface: { height: SG_H, borderRadius: 4, overflow: 'hidden', backgroundColor: '#07070d' },
  sgWaiting: {
    position: 'absolute',
    top: SG_H / 2 - 9,
    left: 0,
    right: 0,
    fontFamily: fonts.barlowRegular,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
  scopeSurface: { height: SCOPE_H, borderRadius: 4, overflow: 'hidden', backgroundColor: '#07090b' },

  // 5 ── frequency & pitch.
  freqGrid: { flexDirection: 'row', gap: 10 },
  freqCell: { flex: 1, gap: 2 },
  freqValue: { fontFamily: fonts.mono, fontSize: 22, color: colors.textPrimary },
  freqSource: { fontFamily: fonts.barlowRegular, fontSize: 12, color: colors.textSub },
  dim: { opacity: 0.35 },
  holdNote: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.textSub },
  centsScale: {
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#101013',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  centsZero: { position: 'absolute', left: '50%', top: 4, bottom: 4, width: 2, backgroundColor: '#3a3a3a', borderRadius: 1 },
  centsZoneInTune: {
    position: 'absolute',
    left: '45%',
    width: '10%',
    top: 3,
    bottom: 3,
    borderRadius: 4,
    backgroundColor: 'rgba(91,255,133,.10)',
    borderWidth: 1,
    borderColor: 'rgba(91,255,133,.28)',
  },
  // The ±5¢ lock glow — the zone brightens when the note is in tune.
  centsZoneLocked: { backgroundColor: 'rgba(91,255,133,.28)', borderColor: 'rgba(91,255,133,.8)' },
  centsNeedle: {
    position: 'absolute',
    top: 2,
    bottom: 2,
    width: 3,
    marginLeft: -1.5,
    borderRadius: 1.5,
    backgroundColor: colors.amber,
  },
  centsNeedleInTune: { backgroundColor: '#5bff85' },

  // 6 ── system info.
  sysRow: { flexDirection: 'row', gap: 8 },
  sysCell: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#101014',
    paddingVertical: 8,
    paddingHorizontal: 8,
    gap: 2,
  },
  sysValue: { fontFamily: fonts.mono, fontSize: 13, color: colors.textSecondary },

  liveWarn: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18.5, color: colors.amber },

  // 7 ── detection chips.
  detectWrap: { gap: 8 },
  detectChip: { borderRadius: 8, borderWidth: 1, paddingVertical: 8, paddingHorizontal: 10, gap: 2 },
  detectChipAmber: { borderColor: 'rgba(255,198,77,.5)', backgroundColor: '#1a1409' },
  detectChipRed: { borderColor: 'rgba(255,75,58,.55)', backgroundColor: '#1c0d0a' },
  detectLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2 },
  detectLabelAmber: { color: colors.amber },
  detectLabelRed: { color: '#ff8d7a' },
  detectDetail: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSecondary },
  detectEmpty: { fontFamily: fonts.barlowRegular, fontSize: 13, color: colors.textMuted },
  detectCaption: { fontFamily: fonts.barlowRegular, fontStyle: 'italic', fontSize: 12, lineHeight: 16, color: colors.textSub },

  // 8 ── snapshot.
  snapBtn: {
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(201,214,228,.6)',
    backgroundColor: '#14171c',
    paddingVertical: 16,
    alignItems: 'center',
  },
  snapBtnSaved: { borderColor: 'rgba(91,255,133,.65)', backgroundColor: '#0d1710' },
  snapText: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, letterSpacing: 1.6, color: '#c9d6e4' },
  snapTextSaved: { color: '#5bff85' },

  libraryLink: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 12,
    letterSpacing: 1.4,
    color: '#4dd0e1',
    textAlign: 'center',
  },
  reminder: {
    fontFamily: fonts.barlowRegular,
    fontStyle: 'italic',
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.textMuted,
    marginTop: 4,
  },

  // Snapshot sheet.
  // Readout-mode chooser popup (owner rev 24).
  unitPopupBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 26,
    zIndex: 50,
  },
  unitPopupCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2b2b33',
    backgroundColor: '#141418',
    padding: 18,
    gap: 12,
  },
  unitPopupTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.6, color: colors.textSecondary, textAlign: 'center' },
  unitPopupGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, justifyContent: 'center' },
  unitPopupOpt: {
    minWidth: 74,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#33333c',
    backgroundColor: '#1a1a1f',
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  unitPopupOptSel: { borderColor: 'rgba(255,198,77,.7)', backgroundColor: '#1c1608' },
  unitPopupOptText: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 0.6, color: colors.textSecondary },
  unitPopupOptTextSel: { color: colors.amber },
  unitPopupNote: { fontFamily: fonts.barlowRegular, fontSize: 11.5, color: colors.textMuted, textAlign: 'center' },
  sheetScrim: { flex: 1, backgroundColor: 'rgba(0,0,0,.7)', justifyContent: 'center', padding: 20 },
  sheetCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2c2f38',
    backgroundColor: '#131316',
    padding: 16,
    gap: 12,
  },
  sheetTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 1.8, color: colors.textPrimary },
  sheetSummary: { fontFamily: fonts.mono, fontSize: 12, lineHeight: 17, color: colors.textSub },
  sheetInput: {
    minHeight: 72,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2c2c2c',
    backgroundColor: '#0f0f12',
    padding: 10,
    fontFamily: fonts.barlowRegular,
    fontSize: 14,
    color: colors.textPrimary,
    textAlignVertical: 'top',
  },
  sheetFuture: { fontFamily: fonts.barlowRegular, fontStyle: 'italic', fontSize: 12, lineHeight: 16, color: colors.textMuted },

  // Optional photo + GPS capture (gated).
  captureBtn: {
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#3a3d46',
    backgroundColor: '#17171c',
    paddingVertical: 11,
    alignItems: 'center',
  },
  captureBtnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1.2, color: colors.textSecondary },
  captureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#2c2f38',
    backgroundColor: '#101013',
    padding: 8,
  },
  captureRowBody: { flex: 1, gap: 3 },
  captureThumb: { width: 48, height: 48, borderRadius: 6, backgroundColor: '#000' },
  captureLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 1.2, color: colors.amberLabel },
  captureGeo: { fontFamily: fonts.mono, fontSize: 12.5, color: colors.textSecondary },
  captureActions: { flexDirection: 'row', gap: 16, marginTop: 1 },
  captureAction: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1, color: '#4dd0e1' },
  captureActionRemove: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1, color: '#ff8d7a' },
  captureBlocked: { fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16, color: colors.amber },

  sheetBtnRow: { flexDirection: 'row', gap: 12 },
  sheetBtn: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    backgroundColor: '#161616',
    paddingVertical: 13,
    alignItems: 'center',
  },
  sheetBtnSave: { borderColor: 'rgba(91,255,133,.65)', backgroundColor: '#0d1710' },
  sheetBtnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 1.4, color: colors.textSecondary },
  sheetBtnSaveText: { color: '#5bff85' },
});
