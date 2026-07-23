/**
 * SpectrogramScreen — Spectrogram, LIVE View 1 + freeze/snapshot (View 2 seed).
 * Spec of record: docs/APE_AUDIO_TOOLS_SPEC_2026_07_23.md §12 (views, controls,
 * required warnings) + §6 quality flags + §7 saved snapshots. Engine build
 * 2026-07-23 (ape-dsp): renders REAL fine-spectrum frames only — never a
 * simulated column (measurement-tools §1.7). Honesty rules embodied here:
 *  - all levels are dBFS, uncalibrated, and labeled so (never dB SPL);
 *  - the colormap is RELATIVE to the observed maximum over the selected
 *    dynamic range (spec §12 required warning: "Color intensity is relative
 *    to the selected scale." — printed on screen, always);
 *  - FREEZE stops the scrolling history only; capture keeps running and is
 *    said so on screen — nothing pretends to be paused that isn't;
 *  - capture starts only on the explicit START press; the hook stops capture
 *    on unmount (spec §18).
 *
 * Perf (A13 budget, RN SVG): useDspEngine handles lifecycle + the meter poll;
 * the spectrogram itself polls ApeDsp.getSpectrum() on its OWN 250 ms (4 Hz)
 * interval — a fresh column 4×/s, not 15×/s. Each frame is downsampled to
 * 26 log-spaced cells (50 Hz–16 kHz, max of the FFT bins per cell) and kept
 * in a 44-column rolling history (~11 s). The 26×44 Rect grid renders inside
 * a React.memo component keyed by the history reference, so the 15 Hz meter
 * poll never re-renders the SVG and the 4 Hz column push never rebuilds more
 * than the grid.
 */
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Crypto from 'expo-crypto';
import Svg, { Rect } from 'react-native-svg';
import { ApeDsp, type EngineConfig } from '../../../modules/ape-dsp';
import { GlassButton } from '../../components/GlassButton';
import { meterWarningFlags, useDspEngine } from '../../features/tools/engine/useDspEngine';
import { saveMeasurement } from '../../features/tools/measure/measurementStore';
import { evaluateQuality } from '../../features/tools/measure/quality';
import { WARNING_INFO } from '../../features/tools/measure/types';
import { colors, fonts } from '../../theme/tokens';
import { EngineGate } from './EngineGate';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'SpectrogramLive'>;

const FFT_SIZE = 4096;
const FFT_PRESET = 'hann-4096'; // engine analysis window preset (payload/settings id)
const SPECTRO_POLL_MS = 250; // 4 Hz column cadence — deliberately NOT the meter poll
const CELLS = 26; // log-spaced frequency cells per column
const HISTORY_COLS = 44; // rolling columns → 44 × 0.25 s ≈ 11 s
const TIME_SPAN_SEC = (HISTORY_COLS * SPECTRO_POLL_MS) / 1000;
const F_MIN = 50;
const F_MAX = 16000;
/** Cell floor: a cell whose bins all sit at/below this renders as background
 *  and is stored as this value — a stated display floor, never fabricated. */
const CELL_FLOOR_DB = -120;

const LOG_MIN = Math.log(F_MIN);
const LOG_SPAN = Math.log(F_MAX) - LOG_MIN;
/** Geometric cell centers, precomputed once — also the saved bandsHz. */
const CELL_CENTERS_HZ: number[] = Array.from({ length: CELLS }, (_, i) =>
  Math.round(Math.exp(LOG_MIN + (LOG_SPAN * (i + 0.5)) / CELLS)),
);

/** Dynamic-range chips — dB below the observed maximum (display scale only;
 *  no engine setting changes, no settings epoch). */
const DYN_RANGES = [40, 60, 80] as const;

/** 5-step dB colormap, coldest → hottest (spectrogram purple accent family). */
const COLORMAP = ['#241040', '#4a1f7a', '#8332c4', '#c95ce8', '#ffe8b0'] as const;

const GRID_H = 208; // grid pixel height; each of the 26 cells is GRID_H/26 tall
const FREQ_LABELS = [
  { hz: 100, text: '100' },
  { hz: 1000, text: '1k' },
  { hz: 10000, text: '10k' },
] as const;
/** Frequency → y within the grid (log axis, low frequencies at the bottom). */
const yForHz = (hz: number) => GRID_H - ((Math.log(hz) - LOG_MIN) / LOG_SPAN) * GRID_H;

const fmtDb = (v: number | null | undefined) =>
  v != null && Number.isFinite(v) ? `${v > 0 ? '+' : ''}${v.toFixed(1)}` : '—';

/** Downsample one REAL fine-spectrum frame (dBFS per FFT bin) to the 26
 *  log-spaced cells — max of the bins that land in each cell. Bins outside
 *  50 Hz–16 kHz are ignored; a cell with nothing above the floor stays at
 *  CELL_FLOOR_DB (honest "no energy registered", not a made-up level). */
function downsampleColumn(spec: Float32Array, sampleRate: number, fftSize: number): number[] {
  const col = new Array<number>(CELLS).fill(CELL_FLOOR_DB);
  const hzPerBin = sampleRate / fftSize;
  for (let i = 1; i < spec.length; i++) {
    const f = i * hzPerBin;
    if (f < F_MIN || f > F_MAX) continue;
    const c = Math.min(CELLS - 1, Math.floor(((Math.log(f) - LOG_MIN) / LOG_SPAN) * CELLS));
    if (spec[i] > col[c]) col[c] = spec[i];
  }
  return col;
}

function StatCell({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <View style={styles.statCell}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>
        {value}
        {unit ? <Text style={styles.statUnit}> {unit}</Text> : null}
      </Text>
    </View>
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

/** The 26×44 Rect grid. React.memo keyed by the history REFERENCE: the 15 Hz
 *  meter poll re-renders the parent but props are unchanged, so this SVG only
 *  rebuilds when a new column lands (4 Hz) or the display scale changes.
 *  Cells at/below the scale floor draw NO rect — background is the floor. */
const SpectrogramGrid = memo(function SpectrogramGrid({
  history,
  observedMax,
  dynRange,
  width,
}: {
  history: number[][];
  observedMax: number | null;
  dynRange: number;
  width: number;
}) {
  if (width <= 0 || history.length === 0 || observedMax == null) return null;
  const floorLevel = observedMax - dynRange;
  const cellW = width / HISTORY_COLS;
  const cellH = GRID_H / CELLS;
  const startCol = HISTORY_COLS - history.length; // newest column at the right edge
  return (
    <Svg width={width} height={GRID_H}>
      {history.map((col, t) => {
        const x = (startCol + t) * cellW;
        return col.map((v, c) => {
          if (v <= floorLevel) return null;
          const step = Math.min(
            COLORMAP.length - 1,
            Math.floor(((v - floorLevel) / dynRange) * COLORMAP.length),
          );
          return (
            <Rect
              key={`${t}-${c}`}
              x={x}
              y={GRID_H - (c + 1) * cellH}
              width={cellW + 0.5}
              height={cellH + 0.5}
              fill={COLORMAP[step]}
            />
          );
        });
      })}
    </Svg>
  );
});

export function SpectrogramScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  // Ref-stable config (house pattern): useDspEngine's start() closes over the
  // object we pass on mount. No live engine-setting changes on this screen —
  // dynamic range is a pure display scale.
  const cfg = useRef<EngineConfig>({ fftSize: FFT_SIZE, spectrumEnabled: true }).current;
  const { state, frames, start, stop, lastError } = useDspEngine(cfg, { meter: true });

  const [history, setHistory] = useState<number[][]>([]);
  const [dynRange, setDynRange] = useState<number>(60);
  const [frozen, setFrozen] = useState(false);
  const frozenRef = useRef(false);
  const [chartW, setChartW] = useState(0);

  // ---- The spectrogram's OWN 4 Hz poll (not the hook's 15 Hz meter poll).
  // Reads the current REAL fine spectrum each 250 ms while running; FREEZE
  // skips the history push only — capture and polling continue underneath.
  useEffect(() => {
    if (state !== 'running') return;
    const id = setInterval(() => {
      const meta = ApeDsp.getSpectrumMeta();
      const spec = ApeDsp.getSpectrum();
      if (!meta || meta.sampleRate <= 0 || meta.fftSize <= 0 || spec.length === 0) return;
      if (frozenRef.current) return; // display frozen; capture continues
      const col = downsampleColumn(spec, meta.sampleRate, meta.fftSize);
      setHistory((h) =>
        h.length >= HISTORY_COLS ? [...h.slice(h.length - HISTORY_COLS + 1), col] : [...h, col],
      );
    }, SPECTRO_POLL_MS);
    return () => clearInterval(id);
  }, [state]);

  /** Observed maximum across the visible history — the colormap's anchor.
   *  Recomputed only when a column lands (4 Hz); 26×44 numbers is cheap. */
  const observedMax = useMemo(() => {
    let m = -Infinity;
    for (const col of history) for (const v of col) if (v > m) m = v;
    return Number.isFinite(m) ? m : null;
  }, [history]);

  const onStart = useCallback(() => {
    // Fresh run = fresh timeline: stale columns from a previous run would lie
    // about time continuity across the stop gap.
    setHistory([]);
    frozenRef.current = false;
    setFrozen(false);
    void start();
  }, [start]);

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
        grid: history.map((col) => [...col]),
        bandsHz: [...CELL_CENTERS_HZ],
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

        {(state === 'idle' || state === 'starting') && (
          <>
            <Text style={styles.intro}>
              Watch frequency content scroll across time — time runs horizontally, frequency
              vertically, and color shows signal level relative to the selected scale. Levels are
              digital level at the microphone input (dBFS), uncalibrated and approximate. Press
              START to begin capture; nothing is simulated while stopped.
            </Text>
            <GlassButton
              label={state === 'starting' ? 'STARTING…' : 'START'}
              tint="purple"
              height={52}
              fontSize={15}
              disabled={state === 'starting'}
              onPress={onStart}
            />
          </>
        )}

        {state === 'running' && (
          <>
            <View style={styles.panel}>
              <View style={styles.panelHead}>
                <Text style={styles.panelEyebrow}>LIVE SPECTROGRAM</Text>
                <Text style={styles.panelSettings}>
                  FFT {FFT_SIZE} · {SPECTRO_POLL_MS} ms/col
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

                <View
                  style={styles.chartArea}
                  onLayout={(e) => setChartW(Math.round(e.nativeEvent.layout.width))}
                >
                  <SpectrogramGrid
                    history={history}
                    observedMax={observedMax}
                    dynRange={dynRange}
                    width={chartW}
                  />
                  {history.length === 0 && (
                    <Text style={styles.waitingText}>waiting for first spectrum frames…</Text>
                  )}
                </View>
              </View>

              {/* Time axis note (spec §12: time is horizontal, newest right). */}
              <Text style={styles.timeLine}>
                time → · ~{TIME_SPAN_SEC.toFixed(0)} s history · {(SPECTRO_POLL_MS / 1000).toFixed(2)} s per column
              </Text>

              {/* Color scale legend — anchored to the OBSERVED max. */}
              <View style={styles.legendRow}>
                {COLORMAP.map((c) => (
                  <View key={c} style={[styles.swatch, { backgroundColor: c }]} />
                ))}
                <Text style={styles.legendText}>
                  {observedMax != null
                    ? `${fmtDb(observedMax - dynRange)} → ${fmtDb(observedMax)} dBFS`
                    : '—'}
                </Text>
              </View>

              <Text style={styles.unitLine}>dBFS · uncalibrated approximate</Text>
              {/* Required warning (spec §12) — always visible while live. */}
              <Text style={styles.scaleNote}>Color intensity is relative to the selected scale.</Text>
            </View>

            {/* Numeric truth row — real values, unclamped. */}
            <View style={styles.statGrid}>
              <StatCell label="OBS MAX" value={fmtDb(observedMax)} unit="dBFS" />
              <StatCell label="PEAK" value={fmtDb(meter?.peakDb)} unit="dBFS" />
              <StatCell label="HISTORY" value={`${history.length}/${HISTORY_COLS}`} />
            </View>

            {/* Live quality warnings (spec §6) — same flags stored on save. */}
            {liveFlags.map((f) => (
              <Text key={f} style={styles.liveWarn}>
                ⚠ {WARNING_INFO[f].message} {WARNING_INFO[f].hint}
              </Text>
            ))}

            {/* Controls (spec §12): dynamic range · freeze · save snapshot. */}
            <View style={styles.ctrlRow}>
              <Text style={styles.ctrlLabel}>DYN RANGE</Text>
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

            <GlassButton label="STOP" tint="purple" height={52} fontSize={15} onPress={stop} />

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
  chartArea: { flex: 1, height: GRID_H, backgroundColor: '#0b0b10', borderRadius: 4, overflow: 'hidden' },
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

  // Colormap legend.
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  swatch: { width: 18, height: 10, borderRadius: 2 },
  legendText: { fontFamily: fonts.mono, fontSize: 12, color: colors.textSubAlt, marginLeft: 6 },

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
  statUnit: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, color: colors.amberLabel },

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
