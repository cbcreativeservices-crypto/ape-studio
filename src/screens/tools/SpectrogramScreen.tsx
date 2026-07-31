/**
 * SpectrogramScreen — Spectrogram, LIVE View 1 + freeze/snapshot (View 2 seed).
 * Spec of record: docs/APE_AUDIO_TOOLS_SPEC_2026_07_23.md §12 (views, controls,
 * required warnings) + §6 quality flags + §7 saved snapshots. Engine build
 * 2026-07-23 (ape-dsp): renders REAL fine-spectrum frames only — never a
 * simulated column (measurement-tools §1.7). Honesty rules embodied here:
 *  - all levels are dBFS, uncalibrated, and labeled so (never dB SPL);
 *  - the colormap is RELATIVE to the observed maximum over the selected
 *    dynamic range (spec §12 required warning: "Color intensity is relative
 *    to the selected scale." — printed on screen, always); the legend prints
 *    the exact anchor the colors are mapped to;
 *  - FREEZE stops the scrolling history only; capture keeps running and is
 *    said so on screen — nothing pretends to be paused that isn't;
 *  - capture starts only on the explicit START press; the hook stops capture
 *    on unmount (spec §18).
 *
 * HI-RES RASTER (owner directive 2026-07-29) — 128 log-spaced frequency rows
 * (50 Hz–16 kHz) × 160 time columns at 8 columns/s (125 ms/col ≈ 20 s of
 * history), MIDI-velocity rainbow colormap (deep blue → cyan → green → yellow
 * → orange → red; near-silence stays near-black/deep blue), quantized to 32
 * color buckets.
 *
 * Perf-by-construction (A13 budget, RN SVG): a 128×160 per-cell Rect grid
 * (20,480 nodes rebuilt per poll) would die — instead each COLUMN is a memoized
 * component that batches its 128 cells into at most 32 <Path> nodes (one per
 * quantized color bucket present; contiguous equal-bucket runs merge into one
 * stroke segment — real audio columns typically land at ~6–16 paths). Columns
 * are keyed by a monotonic id at a fixed virtual x; scrolling is ONE translate
 * update on the parent <G> per poll, so history columns stay frozen — per-poll
 * work is: build 1 new column (≤32 small paths), unmount the oldest, move the
 * <G>. Total steady-state SVG nodes ≈ 160 cols × ~6–16 paths ≈ 1–2.5k
 * (worst-case bound 160 × 32 = 5,120) + ~8 static grid/frame nodes. History
 * only rebuilds wholesale when the color anchor re-anchors (±1/−3 dB
 * hysteresis) or the user changes the dynamic range — a one-time ~20k-run
 * pass, never per-poll. The 15 Hz meter poll never re-renders the SVG
 * (React.memo keyed by the history reference); the 8 Hz column push touches
 * only the pieces above.
 */
import { memo, useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Crypto from 'expo-crypto';
import Svg, { G, Line, Path, Rect } from 'react-native-svg';
import { ApeDsp, type EngineConfig } from '../../../modules/ape-dsp';
import { GlassButton } from '../../components/GlassButton';
import { meterWarningFlags, useDspEngine, useToolAutoStart } from '../../features/tools/engine/useDspEngine';
import { saveMeasurement } from '../../features/tools/measure/measurementStore';
import { evaluateQuality } from '../../features/tools/measure/quality';
import { WARNING_INFO } from '../../features/tools/measure/types';
import { colors, fonts } from '../../theme/tokens';
import { EngineGate } from './EngineGate';
import { useToolHelp, HelpHead, DisplayGuideButton, readoutKey } from '../../features/lab/guidedLessons';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'SpectrogramLive'>;

const FFT_SIZE = 4096;
const FFT_PRESET = 'hann-4096'; // engine analysis window preset (payload/settings id)
const SPECTRO_POLL_MS = 125; // 8 Hz column cadence — deliberately NOT the meter poll
const ROWS = 128; // log-spaced frequency rows per column (hi-res raster)
const HISTORY_COLS = 160; // rolling columns → 160 × 0.125 s = 20 s
const F_MIN = 50;
const F_MAX = 16000;
/** Row floor: a row whose bins all sit at/below this renders as background
 *  and is stored as this value — a stated display floor, never fabricated. */
const CELL_FLOOR_DB = -120;

const LOG_MIN = Math.log(F_MIN);
const LOG_SPAN = Math.log(F_MAX) - LOG_MIN;
/** Geometric row centers, precomputed once — also the saved bandsHz. */
const CELL_CENTERS_HZ: number[] = Array.from({ length: ROWS }, (_, i) =>
  Math.round(Math.exp(LOG_MIN + (LOG_SPAN * (i + 0.5)) / ROWS)),
);

/** Dynamic-range chips — dB below the color anchor (display scale only;
 *  no engine setting changes, no settings epoch). */
const DYN_RANGES = [40, 60, 80] as const;

/** MIDI-velocity rainbow (owner 2026-07-29): near-silence stays near-black /
 *  very dark blue, then deep blue → cyan → green → yellow → orange → red
 *  (hue sweep ≈ 240° → 0°, saturated on the dark background). Piecewise linear
 *  over 8 stops [t, r, g, b]. */
const MIDI_STOPS = [
  [0.0, 6, 6, 24],
  [0.13, 18, 30, 158],
  [0.28, 32, 104, 224],
  [0.42, 20, 192, 214],
  [0.56, 34, 206, 88],
  [0.72, 250, 222, 56],
  [0.86, 255, 138, 28],
  [1.0, 255, 44, 24],
] as const;

function midiVelocityColor(t: number): string {
  const x = Math.min(1, Math.max(0, t));
  let i = 0;
  while (i < MIDI_STOPS.length - 2 && x > MIDI_STOPS[i + 1][0]) i++;
  const a = MIDI_STOPS[i];
  const b = MIDI_STOPS[i + 1];
  const f = b[0] > a[0] ? (x - a[0]) / (b[0] - a[0]) : 0;
  const ch = (k: 1 | 2 | 3) => Math.round(a[k] + (b[k] - a[k]) * f);
  return `rgb(${ch(1)},${ch(2)},${ch(3)})`;
}

/** ≤32 quantized colors — the per-column path-batching buckets. */
const COLOR_BUCKETS = 32;
const BUCKET_COLORS: readonly string[] = Array.from({ length: COLOR_BUCKETS }, (_, i) =>
  midiVelocityColor((i + 0.5) / COLOR_BUCKETS),
);

/** Color-anchor hysteresis: history columns are frozen paths, so the anchor
 *  (the level the top of the colormap maps to) re-anchors — triggering a
 *  one-time history rebuild — only when the observed max rises >1 dB above it
 *  or falls ≥3 dB below it. The legend always prints the anchor actually in
 *  use; OBS MAX always prints the true observed maximum. */
const ANCHOR_RISE_DB = 1;
const ANCHOR_FALL_DB = 3;

const GRID_H = 256; // grid pixel height; each of the 128 rows is 2 px tall
const CELL_H = GRID_H / ROWS;
const FREQ_LABELS = [
  { hz: 100, text: '100' },
  { hz: 1000, text: '1k' },
  { hz: 10000, text: '10k' },
] as const;
/** Frequency → y within the grid (log axis, low frequencies at the bottom). */
const yForHz = (hz: number) => GRID_H - ((Math.log(hz) - LOG_MIN) / LOG_SPAN) * GRID_H;

const fmtDb = (v: number | null | undefined) =>
  v != null && Number.isFinite(v) ? `${v > 0 ? '+' : ''}${v.toFixed(1)}` : '—';

/** Per-row FFT bin ranges for the current (sampleRate, fftSize) — computed
 *  once per meta change, not per column. Each display row reads the REAL bins
 *  whose frequencies fall in its log span (max of bins); a low-frequency row
 *  narrower than one bin reads the single bin containing its center — always
 *  a real measured bin (the FFT's true resolution repeats across the rows it
 *  covers), never interpolated or fabricated. */
function buildRowBins(sampleRate: number, fftSize: number, bins: number): Int32Array {
  const hzPerBin = sampleRate / fftSize;
  const map = new Int32Array(ROWS * 2);
  for (let r = 0; r < ROWS; r++) {
    const fLo = Math.exp(LOG_MIN + (LOG_SPAN * r) / ROWS);
    const fHi = Math.exp(LOG_MIN + (LOG_SPAN * (r + 1)) / ROWS);
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

type SpectroColumnData = { id: number; cells: number[]; max: number };

/** Downsample one REAL fine-spectrum frame (dBFS per FFT bin) to the 128
 *  log-spaced rows via the precomputed bin map. A row with nothing above the
 *  floor stays at CELL_FLOOR_DB (honest "no energy registered"). */
function downsampleColumn(spec: Float32Array, rowBins: Int32Array): { cells: number[]; max: number } {
  const cells = new Array<number>(ROWS);
  let max = CELL_FLOOR_DB;
  for (let r = 0; r < ROWS; r++) {
    let v = -Infinity;
    const hi = rowBins[r * 2 + 1];
    for (let i = rowBins[r * 2]; i <= hi; i++) if (spec[i] > v) v = spec[i];
    const clamped = Number.isFinite(v) && v > CELL_FLOOR_DB ? v : CELL_FLOOR_DB;
    cells[r] = clamped;
    if (clamped > max) max = clamped;
  }
  return { cells, max };
}

function StatCell({
  label,
  value,
  unit,
  help,
  peak,
}: {
  label: string;
  value: string;
  unit?: string;
  help?: (key: string) => void;
  /** Peak text readout (owner 2026-07-31): the top peak number always prints RED. */
  peak?: boolean;
}) {
  return (
    <Pressable
      style={styles.statCell}
      onLongPress={help ? () => help(readoutKey(label)) : undefined}
      delayLongPress={350}
      accessibilityRole={help ? 'button' : undefined}
      accessibilityLabel={help ? `${label} — what it shows` : label}
    >
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, peak && styles.statValuePeak]}>
        {value}
        {unit ? <Text style={styles.statUnit}> {unit}</Text> : null}
      </Text>
    </Pressable>
  );
}

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

/** Slight stroke overlap so adjacent columns never show background seams. */
const COL_OVERLAP = 0.35;

/** ONE spectrogram column: its 128 cells batched into ≤32 <Path> nodes (one
 *  per quantized color bucket present; contiguous equal-bucket runs merge into
 *  a single M/V stroke segment). memo — a mounted column NEVER rebuilds while
 *  it scrolls (its x is virtual; the parent <G> translates), only when the
 *  color anchor or dynamic range changes. Cells at/below the scale floor draw
 *  nothing — background is the floor. */
const SpectroColumn = memo(function SpectroColumn({
  cells,
  x,
  colW,
  anchor,
  dynRange,
}: {
  cells: number[];
  x: number;
  colW: number;
  anchor: number;
  dynRange: number;
}) {
  const floor = anchor - dynRange;
  const scale = COLOR_BUCKETS / dynRange;
  const xs = x.toFixed(1);
  const buckets: (string | undefined)[] = new Array<string | undefined>(COLOR_BUCKETS);
  let run = -1;
  let runStart = 0;
  for (let r = 0; r <= ROWS; r++) {
    let b = -1;
    if (r < ROWS) {
      const v = cells[r];
      if (v > floor) b = Math.min(COLOR_BUCKETS - 1, Math.floor((v - floor) * scale));
    }
    if (b !== run) {
      if (run >= 0) {
        const y1 = (GRID_H - runStart * CELL_H).toFixed(1);
        const y2 = (GRID_H - r * CELL_H).toFixed(1);
        buckets[run] = (buckets[run] ?? '') + `M${xs} ${y1}V${y2}`;
      }
      run = b;
      runStart = r;
    }
  }
  const out: ReactElement[] = [];
  for (let b = 0; b < COLOR_BUCKETS; b++) {
    const d = buckets[b];
    if (d) out.push(<Path key={b} d={d} stroke={BUCKET_COLORS[b]} strokeWidth={colW + COL_OVERLAP} />);
  }
  return <>{out}</>;
});

/** The 128×160 raster. React.memo keyed by the history REFERENCE: the 15 Hz
 *  meter poll re-renders the parent but props are unchanged, so this SVG only
 *  reconciles when a new column lands (8 Hz) or the scale/anchor changes —
 *  and reconciling means ONE new memoized column plus a <G> translate. */
const SpectrogramGrid = memo(function SpectrogramGrid({
  history,
  anchor,
  dynRange,
  width,
  speed,
}: {
  history: SpectroColumnData[];
  anchor: number | null;
  dynRange: number;
  width: number;
  speed: number;
}) {
  if (width <= 0 || history.length === 0 || anchor == null) return null;
  // Each column is `speed`× wider → the waterfall scrolls `speed`× faster and
  // shows ~HISTORY_COLS/speed columns; the rest scroll off the (clipped) left.
  const colW = (width / HISTORY_COLS) * speed;
  const newestId = history[history.length - 1].id;
  const tx = width - (newestId + 1) * colW;
  const colsPer5s = 5000 / SPECTRO_POLL_MS; // 5 s of real time in columns (cadence is fixed)
  return (
    <Svg width={width} height={GRID_H}>
      {/* Subtle static grid — frequency decades + 5 s time marks (from "now"). */}
      {FREQ_LABELS.map((l) => (
        <Line
          key={l.text}
          x1={0}
          x2={width}
          y1={yForHz(l.hz)}
          y2={yForHz(l.hz)}
          stroke="#1c1c26"
          strokeWidth={1}
          strokeDasharray="3 5"
        />
      ))}
      {[1, 2, 3].map((k) => (
        <Line
          key={k}
          x1={width - k * colsPer5s * colW}
          x2={width - k * colsPer5s * colW}
          y1={0}
          y2={GRID_H}
          stroke="#17171f"
          strokeWidth={1}
          strokeDasharray="3 5"
        />
      ))}
      {/* All columns live at fixed virtual x; scrolling = this one translate. */}
      <G x={tx}>
        {history.map((c) => (
          <SpectroColumn
            key={c.id}
            cells={c.cells}
            x={(c.id + 0.5) * colW}
            colW={colW}
            anchor={anchor}
            dynRange={dynRange}
          />
        ))}
      </G>
      <Rect x={0.5} y={0.5} width={width - 1} height={GRID_H - 1} stroke="#26262c" strokeWidth={1} fill="none" />
    </Svg>
  );
});

export function SpectrogramScreen({ navigation }: Props) {
  const { help, helpAll, sheet } = useToolHelp('spectrogram');
  const insets = useSafeAreaInsets();

  // Ref-stable config (house pattern): useDspEngine's start() closes over the
  // object we pass on mount. No live engine-setting changes on this screen —
  // dynamic range is a pure display scale.
  const cfg = useRef<EngineConfig>({ fftSize: FFT_SIZE, spectrumEnabled: true }).current;
  const { state, frames, start, stop, lastError } = useDspEngine(cfg, { meter: true });

  const [history, setHistory] = useState<SpectroColumnData[]>([]);
  const [dynRange, setDynRange] = useState<number>(60);
  // Scroll speed (owner 2026-07-31; reworked 2026-08-01): a DISPLAY-only zoom of
  // the column WIDTH — each column is `speed`× wider, so the waterfall scrolls
  // `speed`× faster and shows less history, GUARANTEED visible regardless of the
  // native FFT frame rate. The capture cadence (one column per real 125 ms
  // native frame) is unchanged, so saves and the time axis stay honest — the old
  // "poll faster" approach was capped by the native frame rate + SVG rebuild
  // cost, so 2×/3× looked identical.
  const [speed, setSpeed] = useState<1 | 2 | 3>(1);
  const [frozen, setFrozen] = useState(false);
  const frozenRef = useRef(false);
  const [chartW, setChartW] = useState(0);
  const colIdRef = useRef(0);
  const rowBinsRef = useRef<{ key: string; map: Int32Array } | null>(null);

  // ---- The spectrogram's OWN 8 Hz poll (not the hook's 15 Hz meter poll).
  // Reads the current REAL fine spectrum each 125 ms while running; FREEZE
  // skips the history push only — capture and polling continue underneath.
  useEffect(() => {
    if (state !== 'running') return;
    const id = setInterval(() => {
      const meta = ApeDsp.getSpectrumMeta();
      const spec = ApeDsp.getSpectrum();
      if (!meta || meta.sampleRate <= 0 || meta.fftSize <= 0 || spec.length === 0) return;
      if (frozenRef.current) return; // display frozen; capture continues
      const key = `${meta.sampleRate}|${meta.fftSize}|${spec.length}`;
      if (!rowBinsRef.current || rowBinsRef.current.key !== key) {
        rowBinsRef.current = { key, map: buildRowBins(meta.sampleRate, meta.fftSize, spec.length) };
      }
      const { cells, max } = downsampleColumn(spec, rowBinsRef.current.map);
      colIdRef.current += 1;
      const col: SpectroColumnData = { id: colIdRef.current, cells, max };
      setHistory((h) =>
        h.length >= HISTORY_COLS ? [...h.slice(h.length - HISTORY_COLS + 1), col] : [...h, col],
      );
    }, SPECTRO_POLL_MS);
    return () => clearInterval(id);
  }, [state]);

  /** True observed maximum across the visible history (per-column maxes are
   *  precomputed at downsample time — 160 comparisons per column push). */
  const observedMax = useMemo(() => {
    let m = -Infinity;
    for (const c of history) if (c.max > m) m = c.max;
    return Number.isFinite(m) ? m : null;
  }, [history]);

  /** The color anchor the frozen column paths are actually mapped to —
   *  follows observedMax with rise/fall hysteresis so history rebuilds stay
   *  rare (see constant docs). The legend prints THIS value. */
  const [anchor, setAnchor] = useState<number | null>(null);
  useEffect(() => {
    if (observedMax == null) {
      setAnchor(null);
      return;
    }
    setAnchor((a) =>
      a == null || observedMax > a + ANCHOR_RISE_DB || a - observedMax >= ANCHOR_FALL_DB
        ? observedMax
        : a,
    );
  }, [observedMax]);

  // STOP must not collapse the tool back to the intro card (that shrinks the
  // ScrollView and jumps the scroll). Hold the view mounted via micPaused; the
  // button toggles START/STOP in place. Cleared once we're truly running again.
  const [micPaused, setMicPaused] = useState(false);
  useEffect(() => {
    if (state === 'running') setMicPaused(false);
  }, [state]);

  const onStart = useCallback(() => {
    setMicPaused(false);
    // Fresh run = fresh timeline: stale columns from a previous run would lie
    // about time continuity across the stop gap.
    setHistory([]);
    setAnchor(null);
    colIdRef.current = 0;
    frozenRef.current = false;
    setFrozen(false);
    void start();
  }, [start]);

  const onStop = useCallback(() => {
    setMicPaused(true);
    stop();
  }, [stop]);

  // Open straight into the live spectrogram — no redundant START screen (owner
  // 2026-08-01).
  useToolAutoStart(state, onStart);

  const toggleFreeze = useCallback(() => {
    frozenRef.current = !frozenRef.current;
    setFrozen(frozenRef.current);
  }, []);

  const [justSaved, setJustSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (savedTimer.current) clearTimeout(savedTimer.current);
    },
    [],
  );

  /** SAVE SNAPSHOT (spec §12 View 2 → §7 library). Real polled columns only —
   *  exactly what is on screen, with the display scale recorded alongside. */
  const onSaveSnapshot = useCallback(() => {
    if (state !== 'running' || history.length === 0) return;
    const flags = meterWarningFlags(frames.meter);
    const meta = ApeDsp.getSpectrumMeta();
    const routeName = ApeDsp.getInfo()?.routeName;
    saveMeasurement({
      id: Crypto.randomUUID(),
      tool_type: 'spectrogram',
      created_at: new Date().toISOString(),
      title: `Spectrogram snapshot — ${dynRange} dB range`,
      notes: '',
      input_device: routeName && routeName.length > 0 ? routeName : 'Device microphone',
      calibration_status: 'uncalibrated',
      sample_rate: meta ? meta.sampleRate : null,
      measurement_settings: { fft_size: FFT_SIZE, dynamic_range_db: dynRange },
      quality_state: evaluateQuality(flags),
      warning_flags: flags,
      data_payload: {
        kind: 'spectrogram_snapshot',
        grid: history.map((c) => [...c.cells]),
        bandsHz: [...CELL_CENTERS_HZ],
        // Each column is one native frame at the fixed base cadence — speed is a
        // display zoom only, so the stored time step is unaffected.
        timeStepSec: SPECTRO_POLL_MS / 1000,
        dynamicRangeDb: dynRange,
        fftPreset: FFT_PRESET,
      },
    });
    setJustSaved(true);
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setJustSaved(false), 1800);
  }, [state, history, frames, dynRange]);

  const liveFlags = state === 'running' ? meterWarningFlags(frames.meter) : [];
  const meter = frames.meter;
  const canSave = state === 'running' && history.length > 0;

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={{ flexShrink: 1 }}>
          <Text style={styles.title}>SPECTROGRAM</Text>
          <Text style={styles.subtitle}>Frequency over time · dBFS · uncalibrated</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Honest not-ready card (absent/spike/denied/error) — renders nothing
            when the engine is usable. */}
        <EngineGate state={state} lastError={lastError} />

        {/* Opens straight into the live spectrogram (auto-start). */}
        {!micPaused && (state === 'idle' || state === 'starting') && (
          <Text style={styles.intro}>Starting the spectrogram…</Text>
        )}

        {(state === 'running' || micPaused) && (
          <>
            {/* Numeric truth row — real values, unclamped. ABOVE the display (owner
                2026-07-31). Peak readouts print RED. Long-press a cell. */}
            <View style={styles.statGrid}>
              <StatCell help={help} label="OBS MAX" value={fmtDb(observedMax)} unit="dBFS" peak />
              <StatCell help={help} label="PEAK" value={fmtDb(meter?.peakDb)} unit="dBFS" peak />
              <StatCell help={help} label="HISTORY" value={`${history.length}/${HISTORY_COLS}`} />
            </View>

            <View style={styles.panel}>
              <View style={styles.panelHead}>
                <Text style={styles.panelEyebrow}>LIVE SPECTROGRAM</Text>
                <Text style={styles.panelSettings}>
                  FFT {FFT_SIZE} · {SPECTRO_POLL_MS} ms/col · {speed}× scroll
                </Text>
              </View>

              <View style={styles.chartRow}>
                {/* Frequency gutter — log axis marks (spec §12: frequency is vertical). */}
                <View style={styles.gutter}>
                  {FREQ_LABELS.map((l) => (
                    <Text key={l.text} style={[styles.gutterLabel, { top: yForHz(l.hz) - 8 }]}>
                      {l.text}
                    </Text>
                  ))}
                </View>

                {/* Tapping the display toggles START/STOP (owner 2026-07-31). */}
                <Pressable
                  style={styles.chartArea}
                  onLayout={(e) => setChartW(Math.round(e.nativeEvent.layout.width))}
                  onPress={state === 'running' ? onStop : onStart}
                  accessibilityRole="button"
                  accessibilityLabel={state === 'running' ? 'Tap to stop capture' : 'Tap to start capture'}
                >
                  <SpectrogramGrid
                    history={history}
                    anchor={anchor}
                    dynRange={dynRange}
                    width={chartW}
                    speed={speed}
                  />
                  {history.length === 0 && (
                    <Text style={styles.waitingText}>waiting for first spectrum frames…</Text>
                  )}
                </Pressable>
              </View>

              {/* Time axis note (spec §12: time is horizontal, newest right).
                  Higher speed = faster scroll = a shorter visible window. */}
              <Text style={styles.timeLine}>
                time → · ~{((HISTORY_COLS / speed) * SPECTRO_POLL_MS / 1000).toFixed(0)} s visible · {speed}× scroll · {ROWS} freq rows
              </Text>

              {/* Color-scale legend strip — dark → blue → … → red, with the dB
                  endpoints of the anchor actually mapped (see anchor docs). */}
              <View style={styles.legendRow}>
                <View style={styles.legendStrip}>
                  {BUCKET_COLORS.map((c, i) => (
                    <View key={i} style={{ flex: 1, backgroundColor: c }} />
                  ))}
                </View>
                <Text style={styles.legendText}>
                  {anchor != null
                    ? `${fmtDb(anchor - dynRange)} → ${fmtDb(anchor)} dBFS`
                    : '—'}
                </Text>
              </View>

              <Text style={styles.unitLine}>dBFS · uncalibrated approximate</Text>
              {/* Required warning (spec §12) — always visible while live. */}
              <Text style={styles.scaleNote}>Color intensity is relative to the selected scale.</Text>
            </View>

            {/* Display guide + scroll-speed (owner 2026-07-31): 1× / 2× / 3×. */}
            <View style={styles.guideRow}>
              <View style={{ flex: 1 }}>
                <DisplayGuideButton onPress={helpAll} />
              </View>
              <Text style={styles.speedLabel}>SPEED</Text>
              {([1, 2, 3] as const).map((s) => (
                <Chip
                  key={s}
                  label={`${s}×`}
                  a11yLabel={`Scroll speed ${s} times`}
                  active={speed === s}
                  onPress={() => setSpeed(s)}
                />
              ))}
            </View>

            {/* Live quality warnings (spec §6) — same flags stored on save. */}
            {liveFlags.map((f) => (
              <Text key={f} style={styles.liveWarn}>
                ⚠ {WARNING_INFO[f].message} {WARNING_INFO[f].hint}
              </Text>
            ))}

            {/* Controls (spec §12): dynamic range · freeze · save snapshot. */}
            <View style={styles.ctrlRow}>
              <HelpHead title="DYN RANGE" onHelp={() => help('db_range')} style={styles.ctrlLabel} />
              {DYN_RANGES.map((r) => (
                <Chip
                  key={r}
                  label={`${r} dB`}
                  a11yLabel={`${r} decibel dynamic range`}
                  active={dynRange === r}
                  onPress={() => setDynRange(r)}
                />
              ))}
            </View>
            <Text style={styles.settingsNote}>
              Dynamic range changes the color scale only — capture and analysis are unaffected.
              Snapshots record the range in use.
            </Text>

            <View style={styles.buttonRow}>
              <Pressable
                style={[styles.ctrlBtn, frozen && styles.ctrlBtnFrozen]}
                onPress={toggleFreeze}
                accessibilityRole="button"
                accessibilityLabel={frozen ? 'Resume scrolling' : 'Freeze display'}
                accessibilityState={{ selected: frozen }}
              >
                <Text style={[styles.ctrlText, frozen && styles.ctrlTextFrozen]}>
                  {frozen ? 'RESUME' : 'FREEZE'}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.ctrlBtn, justSaved && styles.ctrlBtnSaved, !canSave && styles.ctrlBtnDisabled]}
                onPress={onSaveSnapshot}
                disabled={!canSave}
                accessibilityRole="button"
                accessibilityState={{ disabled: !canSave }}
                accessibilityLabel="Save snapshot"
              >
                <Text style={[styles.ctrlText, justSaved && styles.ctrlTextSaved]}>
                  {justSaved ? 'SAVED ✓' : 'SAVE SNAPSHOT'}
                </Text>
              </Pressable>
            </View>
            {frozen && (
              <Text style={styles.frozenNote}>
                Display frozen — capture continues underneath. RESUME to scroll again.
              </Text>
            )}

            <GlassButton
              label={state === 'running' ? 'STOP' : 'START'}
              tint="purple"
              height={52}
              fontSize={15}
              onPress={state === 'running' ? onStop : onStart}
            />

            <Pressable
              onPress={() => navigation.navigate('ToolLibrary', { toolKey: 'spectrogram' })}
              accessibilityRole="button"
              accessibilityLabel="View saved measurements"
            >
              <Text style={styles.libraryLink}>VIEW SAVED MEASUREMENTS ›</Text>
            </Pressable>
          </>
        )}

        {/* Required warnings (spec §12) — always visible. */}
        <Text style={styles.reminder}>
          This view shows frequency over time, not waveform amplitude. FFT/window settings affect
          time and frequency detail; noise floor may appear as low-level background energy.
        </Text>
      </ScrollView>
      {sheet}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingBottom: 10 },
  back: { fontFamily: fonts.oswaldSemiBold, fontSize: 30, color: colors.textSub, marginTop: -4, paddingRight: 2 },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 17, letterSpacing: 1.4, color: colors.textPrimary },
  subtitle: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.textSub, marginTop: 1 },
  scroll: { padding: 16, paddingBottom: 28, gap: 14 },

  intro: { fontFamily: fonts.barlowRegular, fontSize: 15.5, lineHeight: 23, color: colors.textSecondary },

  // Live spectrogram panel.
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
  chartRow: { flexDirection: 'row' },
  gutter: { width: 32, height: GRID_H },
  gutterLabel: {
    position: 'absolute',
    right: 4,
    width: 28,
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'right',
  },
  chartArea: { flex: 1, height: GRID_H, backgroundColor: '#07070d', borderRadius: 4, overflow: 'hidden' },
  waitingText: {
    position: 'absolute',
    top: GRID_H / 2 - 9,
    left: 0,
    right: 0,
    fontFamily: fonts.barlowRegular,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
  timeLine: { fontFamily: fonts.mono, fontSize: 12, color: colors.textMuted },

  // Colormap legend — continuous quantized strip (dark → blue → … → red).
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendStrip: {
    flex: 1,
    flexDirection: 'row',
    height: 10,
    borderRadius: 3,
    overflow: 'hidden',
  },
  legendText: { fontFamily: fonts.mono, fontSize: 12, color: colors.textSubAlt },

  unitLine: { fontFamily: fonts.mono, fontSize: 12, color: colors.textSubAlt },
  scaleNote: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSubAlt },

  // Numeric readout cells (fonts.mono for values — house data-readout face).
  statGrid: { flexDirection: 'row', gap: 10 },
  statCell: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 4,
  },
  statLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.textSub },
  statValue: { fontFamily: fonts.mono, fontSize: 19, color: colors.textPrimary },
  statValuePeak: { color: '#ff5a48' }, // peak text readouts are always red (owner 2026-07-31)
  statUnit: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, color: colors.amberLabel },

  // Display-guide + scroll-speed row.
  guideRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  speedLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 1.2, color: colors.textSub },

  // Live warning line (spec §6) — amber, plain language.
  liveWarn: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18.5, color: colors.amber },

  // Control chips.
  ctrlRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ctrlLabel: {
    width: 84,
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 12,
    letterSpacing: 1.4,
    color: colors.textSub,
  },
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
  chipActive: { borderColor: colors.amberDeep, backgroundColor: '#1d180d' },
  chipText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.textSub },
  chipTextActive: { color: colors.amber },
  settingsNote: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textMuted },

  // Freeze / save buttons.
  buttonRow: { flexDirection: 'row', gap: 12 },
  ctrlBtn: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    backgroundColor: '#161616',
    paddingVertical: 14,
    alignItems: 'center',
  },
  ctrlBtnFrozen: { borderColor: 'rgba(167,110,255,.65)', backgroundColor: '#160f22' },
  ctrlBtnSaved: { borderColor: 'rgba(91,255,133,.65)', backgroundColor: '#0d1710' },
  ctrlBtnDisabled: { opacity: 0.45 },
  ctrlText: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 1.4, color: colors.textSecondary },
  ctrlTextFrozen: { color: '#dcc9ff' },
  ctrlTextSaved: { color: '#5bff85' },
  frozenNote: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: '#b9a3e6' },

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
});
