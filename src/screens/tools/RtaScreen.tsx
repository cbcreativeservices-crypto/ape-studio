/**
 * RtaScreen — Spectrum Analyzer / RTA, LIVE View 1 + trace save (View 2 seed).
 * Spec of record: docs/APE_AUDIO_TOOLS_SPEC_2026_07_23.md §10 (views, controls,
 * required warnings) + §6 quality flags + §7 saved traces. Engine build
 * 2026-07-23 (ape-dsp): polls REAL BandsFrame data via useDspEngine — never a
 * simulated bar (measurement-tools §1.7). Honesty rules embodied here:
 *  - all levels are dBFS, uncalibrated, and labeled so (never dB SPL);
 *  - Q2 gray-out: bands the engine flags unresolvable render dim gray with NO
 *    level bar, and only resolvable bands are persisted in a saved trace;
 *  - peak can exceed 0 dBFS (finding F1) — the 0 dBFS gridline sits below a
 *    headroom zone and numeric readouts print the real value, unclamped;
 *  - capture starts only on the explicit START press; the hook stops capture
 *    on unmount (spec §18).
 * Controls (spec §10): start/stop, 1/1 vs 1/3 octave, averaging speed
 * (exponential α), peak-hold reset, save trace. Banding/averaging changes
 * live-apply through ApeDsp.setEngineConfig — the native side restarts the
 * band average and peak hold under a new settings epoch (noted on screen).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Crypto from 'expo-crypto';
import Svg, { G, Line, Rect } from 'react-native-svg';
import { ApeDsp, type BandsFrame, type EngineConfig } from '../../../modules/ape-dsp';
import { GlassButton } from '../../components/GlassButton';
import { meterWarningFlags, useDspEngine } from '../../features/tools/engine/useDspEngine';
import { saveMeasurement } from '../../features/tools/measure/measurementStore';
import { evaluateQuality } from '../../features/tools/measure/quality';
import { WARNING_INFO } from '../../features/tools/measure/types';
import { colors, fonts } from '../../theme/tokens';
import { EngineGate } from './EngineGate';
import { useToolHelp, HelpHead, DisplayGuideButton, readoutKey } from '../../features/lab/guidedLessons';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Rta'>;

const FFT_SIZE = 8192;

/** Averaging chips → exponential band-average α (higher = faster response). */
const AVG_CHOICES = [
  { label: 'FAST', alpha: 0.6 },
  { label: 'MED', alpha: 0.35 },
  { label: 'SLOW', alpha: 0.15 },
] as const;

// ---- Bar-panel geometry (fixed-height SVG; dBFS → pixels) -----------------
const PANEL_H = 190;
const FLOOR_DB = -90; // display floor — levels below draw no bar
const ZERO_Y = 16; // 0 dBFS gridline; the zone above is REAL headroom (F1)
const FLOOR_Y = 182;
const PX_PER_DB = (FLOOR_Y - ZERO_Y) / -FLOOR_DB;
/** dBFS → y. Values above 0 dBFS climb into the headroom zone; only the SVG
 *  edge (y=2, ≈+7.6 dBFS) limits geometry — numbers are never clamped. */
const yForDb = (db: number) => Math.max(2, ZERO_Y - db * PX_PER_DB);

const GRID_DBS = [0, -30, -60, FLOOR_DB];
const LABEL_TARGETS = [63, 250, 1000, 4000, 16000] as const;

/** Nearest band index per labeled center — skip when over half an octave off
 *  (1/1-octave mode has no 63 Hz twin problem; sparse sets dedupe by index). */
function bandLabels(centers: number[]): { i: number; text: string }[] {
  const out: { i: number; text: string }[] = [];
  for (const hz of LABEL_TARGETS) {
    let best = -1;
    let bestDist = Infinity;
    for (let i = 0; i < centers.length; i++) {
      if (centers[i] <= 0) continue;
      const d = Math.abs(Math.log2(centers[i] / hz));
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    if (best >= 0 && bestDist <= 0.5 && !out.some((l) => l.i === best)) {
      out.push({ i: best, text: hz >= 1000 ? `${hz / 1000}k` : `${hz}` });
    }
  }
  return out;
}

const fmtDb = (v: number | undefined) =>
  v != null && Number.isFinite(v) ? `${v > 0 ? '+' : ''}${v.toFixed(1)}` : '—';

function StatCell({ label, value, unit, help }: { label: string; value: string; unit?: string; help?: (key: string) => void }) {
  return (
    <Pressable
      style={styles.statCell}
      onLongPress={help ? () => help(readoutKey(label)) : undefined}
      delayLongPress={350}
      accessibilityRole={help ? 'button' : undefined}
      accessibilityLabel={help ? `${label} — what it shows` : label}
    >
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>
        {value}
        {unit ? <Text style={styles.statUnit}> {unit}</Text> : null}
      </Text>
    </Pressable>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

/** Live vertical bar graph from a REAL BandsFrame — bars for levelsDb, thin
 *  peak-hold ticks, Q2 dim-gray slots for unresolvable bands. */
function BandsPanel({ bands, fraction, alpha }: { bands: BandsFrame | null; fraction: 1 | 3; alpha: number }) {
  const [chartW, setChartW] = useState(0);

  const n = bands ? bands.centers.length : 0;
  const barW = n > 0 && chartW > 0 ? chartW / n : 0;
  const labels = bands ? bandLabels(bands.centers) : [];
  const anyUnresolvable = bands != null && bands.resolvable.some((r) => !r);

  return (
    <View style={styles.panel}>
      <View style={styles.panelHead}>
        <Text style={styles.panelEyebrow}>LIVE RTA</Text>
        <Text style={styles.panelSettings}>
          1/{fraction} OCT · FFT {FFT_SIZE} · α {alpha.toFixed(2)}
        </Text>
      </View>

      <View style={styles.chartRow}>
        {/* dB gutter — dBFS scale marks matching the gridlines. */}
        <View style={styles.gutter}>
          {GRID_DBS.map((db) => (
            <Text key={db} style={[styles.gutterLabel, { top: yForDb(db) - 8 }]}>
              {db}
            </Text>
          ))}
        </View>

        <View
          style={styles.chartArea}
          onLayout={(e) => setChartW(Math.round(e.nativeEvent.layout.width))}
        >
          {chartW > 0 && (
            <Svg width={chartW} height={PANEL_H}>
              {GRID_DBS.map((db) => (
                <Line
                  key={db}
                  x1={0}
                  y1={yForDb(db)}
                  x2={chartW}
                  y2={yForDb(db)}
                  stroke={db === 0 || db === FLOOR_DB ? colors.steelBorder : colors.hairlineDim}
                  strokeWidth={db === FLOOR_DB ? 1.5 : 1}
                />
              ))}
              {bands != null &&
                bands.centers.map((c, i) => {
                  const x = i * barW + 1;
                  const w = Math.max(1, barW - 2);
                  if (!bands.resolvable[i]) {
                    // Q2 honest gray-out: a dim slot, NO level bar, NO tick —
                    // this band cannot be resolved at this FFT/banding setting.
                    return (
                      <Rect
                        key={`slot-${c}`}
                        x={x}
                        y={ZERO_Y}
                        width={w}
                        height={FLOOR_Y - ZERO_Y}
                        fill="#55555f"
                        fillOpacity={0.14}
                      />
                    );
                  }
                  const level = bands.levelsDb[i];
                  const peak = bands.peakHoldDb[i];
                  const barTop = yForDb(level); // yForDb caps only at the SVG edge — F1 headroom
                  return (
                    <G key={`band-${c}`}>
                      {level > FLOOR_DB && (
                        <Rect
                          x={x}
                          y={barTop}
                          width={w}
                          height={FLOOR_Y - barTop}
                          fill={colors.blue}
                          fillOpacity={0.92}
                        />
                      )}
                      {peak > FLOOR_DB && (
                        <Rect x={x} y={yForDb(peak) - 1} width={w} height={2} fill="#e6ecf2" />
                      )}
                    </G>
                  );
                })}
            </Svg>
          )}
          {/* Band-center frequency labels, aligned under their bars. */}
          <View style={styles.labelRow}>
            {chartW > 0 &&
              labels.map((l) => (
                <Text
                  key={l.text}
                  style={[styles.freqLabel, { left: (l.i + 0.5) * barW - 24 }]}
                >
                  {l.text}
                </Text>
              ))}
          </View>
        </View>
      </View>

      <Text style={styles.unitLine}>dBFS · uncalibrated approximate</Text>
      {anyUnresolvable && (
        <Text style={styles.grayNote}>grayed bands: insufficient resolution at this setting</Text>
      )}
    </View>
  );
}

export function RtaScreen({ navigation }: Props) {
  const { help, helpAll, sheet } = useToolHelp('rta');
  const insets = useSafeAreaInsets();

  // Ref-stable config object: useDspEngine's start() closes over the object we
  // pass on mount, so settings changes MUTATE it (then live-apply below) —
  // a fresh object per render would leave START pushing stale settings.
  const cfg = useRef<EngineConfig>({
    fftSize: FFT_SIZE,
    fraction: 3,
    spectrumEnabled: true,
    bandAvgAlpha: 0.35,
  }).current;
  const [fraction, setFraction] = useState<1 | 3>(3);
  const [alpha, setAlpha] = useState(0.35);

  const { state, frames, start, stop, lastError, resetPeakHold } = useDspEngine(cfg, {
    meter: true,
    bands: true,
  });

  const [justSaved, setJustSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (savedTimer.current) clearTimeout(savedTimer.current);
    },
    [],
  );

  const applyBanding = useCallback(
    (f: 1 | 3) => {
      if (f === fraction) return;
      cfg.fraction = f;
      setFraction(f);
      // Live-apply: the native side restarts band averaging + per-band peak
      // hold under a new settings epoch. When idle this pre-stages the config;
      // the hook re-pushes the same object on START.
      ApeDsp.setEngineConfig(cfg);
    },
    [cfg, fraction],
  );

  const applyAlpha = useCallback(
    (a: number) => {
      if (a === alpha) return;
      cfg.bandAvgAlpha = a;
      setAlpha(a);
      ApeDsp.setEngineConfig(cfg); // same settings-epoch restart as banding
    },
    [cfg, alpha],
  );

  /** SAVE TRACE (spec §10 View 2 → §7 library). Real polled data only. */
  const onSaveTrace = useCallback(() => {
    const bands = frames.bands;
    if (state !== 'running' || bands == null || bands.centers.length === 0) return;
    const flags = meterWarningFlags(frames.meter);
    // Q2: persist ONLY resolvable bands — the payload has no resolvable flag,
    // so storing flagged-unresolvable levels would fabricate data on replay.
    const bandsHz: number[] = [];
    const levelsDb: number[] = [];
    bands.centers.forEach((c, i) => {
      if (bands.resolvable[i]) {
        bandsHz.push(c);
        levelsDb.push(bands.levelsDb[i]);
      }
    });
    const routeName = ApeDsp.getInfo()?.routeName;
    saveMeasurement({
      id: Crypto.randomUUID(),
      tool_type: 'rta',
      created_at: new Date().toISOString(),
      title: `RTA trace — ${fraction === 1 ? '1/1' : '1/3'} octave`,
      notes: '',
      input_device: routeName && routeName.length > 0 ? routeName : 'Device microphone',
      calibration_status: 'uncalibrated',
      sample_rate: bands.sampleRate,
      measurement_settings: { fraction, fft_size: FFT_SIZE, averaging: alpha },
      quality_state: evaluateQuality(flags),
      warning_flags: flags,
      data_payload: {
        kind: 'spectrum_trace',
        bandsHz,
        levelsDb,
        fraction,
        smoothing: String(alpha),
        averaging: 'exponential',
      },
    });
    setJustSaved(true);
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setJustSaved(false), 1800);
  }, [state, frames, fraction, alpha]);

  const liveFlags = state === 'running' ? meterWarningFlags(frames.meter) : [];
  const meter = frames.meter;
  const canSave = state === 'running' && frames.bands != null && frames.bands.centers.length > 0;

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={{ flexShrink: 1 }}>
          <Text style={styles.title}>SPECTRUM ANALYZER / RTA</Text>
          <Text style={styles.subtitle}>Live RTA · dBFS · uncalibrated</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Honest not-ready card (absent/spike/denied/error) — renders nothing
            when the engine is usable. */}
        <EngineGate state={state} lastError={lastError} />

        {(state === 'idle' || state === 'starting') && (
          <>
            <Text style={styles.intro}>
              Watch signal energy across frequency in real time — octave or third-octave bands
              with peak hold. Levels are digital level at the microphone input (dBFS),
              uncalibrated and approximate. Press START to begin capture; nothing is simulated
              while stopped.
            </Text>
            <GlassButton
              label={state === 'starting' ? 'STARTING…' : 'START'}
              tint="blue"
              height={52}
              fontSize={15}
              disabled={state === 'starting'}
              onPress={() => void start()}
            />
          </>
        )}

        {state === 'running' && (
          <>
            <BandsPanel bands={frames.bands} fraction={fraction} alpha={alpha} />
            <DisplayGuideButton onPress={helpAll} />

            {/* Numeric truth row — peak may exceed 0 dBFS (F1): print it.
                Long-press any cell for what it shows. */}
            <View style={styles.statGrid}>
              <StatCell help={help} label="PEAK" value={fmtDb(meter?.peakDb)} unit="dBFS" />
              <StatCell help={help} label="PEAK HOLD" value={fmtDb(meter?.peakHoldDb)} unit="dBFS" />
              <StatCell help={help} label="BANDS" value={frames.bands ? String(frames.bands.centers.length) : '—'} />
            </View>

            {/* Live quality warnings (spec §6) — same flags stored on save. */}
            {liveFlags.map((f) => (
              <Text key={f} style={styles.liveWarn}>
                ⚠ {WARNING_INFO[f].message} {WARNING_INFO[f].hint}
              </Text>
            ))}

            {/* Controls (spec §10): banding · averaging · peak hold · save. */}
            <View style={styles.ctrlRow}>
              <HelpHead title="BANDING" onHelp={() => help('banding')} style={styles.ctrlLabel} />
              <Chip label="1/1 OCT" active={fraction === 1} onPress={() => applyBanding(1)} />
              <Chip label="1/3 OCT" active={fraction === 3} onPress={() => applyBanding(3)} />
            </View>
            <View style={styles.ctrlRow}>
              <HelpHead title="AVERAGING" onHelp={() => help('averaging')} style={styles.ctrlLabel} />
              {AVG_CHOICES.map((c) => (
                <Chip key={c.label} label={c.label} active={alpha === c.alpha} onPress={() => applyAlpha(c.alpha)} />
              ))}
            </View>
            <Text style={styles.settingsNote}>
              Changing banding or averaging restarts the band average and peak hold (new settings
              epoch).
            </Text>

            <View style={styles.buttonRow}>
              <Pressable
                style={styles.ctrlBtn}
                onPress={resetPeakHold}
                accessibilityRole="button"
                accessibilityLabel="Reset peak hold"
              >
                <Text style={styles.ctrlText}>RESET PEAK</Text>
              </Pressable>
              <Pressable
                style={[styles.ctrlBtn, justSaved && styles.ctrlBtnSaved, !canSave && styles.ctrlBtnDisabled]}
                onPress={onSaveTrace}
                disabled={!canSave}
                accessibilityRole="button"
                accessibilityState={{ disabled: !canSave }}
                accessibilityLabel="Save trace"
              >
                <Text style={[styles.ctrlText, justSaved && styles.ctrlTextSaved]}>
                  {justSaved ? 'SAVED ✓' : 'SAVE TRACE'}
                </Text>
              </Pressable>
            </View>

            <GlassButton label="STOP" tint="blue" height={52} fontSize={15} onPress={stop} />

            <Pressable
              onPress={() => navigation.navigate('ToolLibrary', { toolKey: 'rta' })}
              accessibilityRole="button"
              accessibilityLabel="View saved measurements"
            >
              <Text style={styles.libraryLink}>VIEW SAVED MEASUREMENTS ›</Text>
            </Pressable>
          </>
        )}

        {/* Required warnings (spec §10) — always visible. */}
        <Text style={styles.reminder}>
          This display shows frequency energy, not automatic EQ advice. Microphone position
          strongly affects the result.
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

  // Live bar-graph panel.
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
  gutter: { width: 32, height: PANEL_H },
  gutterLabel: {
    position: 'absolute',
    right: 4,
    width: 28,
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'right',
  },
  chartArea: { flex: 1, height: PANEL_H + 16 },
  labelRow: { height: 16 },
  freqLabel: {
    position: 'absolute',
    top: 0,
    width: 48,
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
  unitLine: { fontFamily: fonts.mono, fontSize: 12, color: colors.textSubAlt },
  grayNote: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSubAlt },

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

  // Reset / save buttons.
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
  ctrlBtnSaved: { borderColor: 'rgba(91,255,133,.65)', backgroundColor: '#0d1710' },
  ctrlBtnDisabled: { opacity: 0.45 },
  ctrlText: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 1.4, color: colors.textSecondary },
  ctrlTextSaved: { color: '#5bff85' },

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
