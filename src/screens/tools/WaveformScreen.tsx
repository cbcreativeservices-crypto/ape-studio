/**
 * WaveformScreen — Waveform Viewer LIVE oscilloscope view (spec of record
 * docs/APE_AUDIO_TOOLS_SPEC_2026_07_23.md §11 View 1; engine build 2026-07-23).
 * Min/max envelope columns from the engine's waveform buckets (50 ms each,
 * newest at right), RMS energy band at lower opacity, red clip ticks, centered
 * zero line, ±1 amplitude marks.
 *
 * Integrity:
 *  - NO simulated readings — anything drawn comes from ApeDsp.getWaveform()
 *    while capture is running; every other state renders EngineGate or the
 *    explicit START affordance (measurement-tools §1.7).
 *  - Capture starts only on the user's START press; useDspEngine stops it on
 *    unmount (spec §18).
 *  - All levels are dBFS and UNCALIBRATED — labeled so, never shown as SPL.
 *  - Peak may exceed 0 dBFS and samples may exceed ±1 (finding F1): the peak
 *    readout never clamps, and the display autoscales to the observed max.
 *  - Vertical zoom is display scaling ONLY, with the spec §11 honesty line
 *    shown whenever zoom is engaged.
 *  - FREEZE holds the drawn buckets; capture (and the live meter) continue.
 *  - SAVE SNAPSHOT stores the envelope as NUMBERS (never audio) with the same
 *    quality flags shown live (spec §6/§7).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Svg, { Line, Path, Text as SvgText } from 'react-native-svg';
import * as Crypto from 'expo-crypto';
import { ApeDsp, type WaveBucket } from '../../../modules/ape-dsp';
import { GlassButton } from '../../components/GlassButton';
import { meterWarningFlags, useDspEngine } from '../../features/tools/engine/useDspEngine';
import { saveMeasurement } from '../../features/tools/measure/measurementStore';
import { evaluateQuality } from '../../features/tools/measure/quality';
import { WARNING_INFO } from '../../features/tools/measure/types';
import { colors, fonts } from '../../theme/tokens';
import { EngineGate } from './EngineGate';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'WaveformLive'>;

/** Display window: ~120 × 50 ms buckets ≈ 6 s of history, newest at right. */
const MAX_BUCKETS = 120;
const BUCKET_SEC = 0.05;
const PANEL_H = 240;
/** Vertical inset of the drawable area (leaves the clip-tick lane at top). */
const PAD_V = 16;
/** Scope trace + accents (waveform tool tint — teal, toolsData). */
const TRACE = '#5fd9c4';

const ZOOMS = [1, 2, 4] as const;
type Zoom = (typeof ZOOMS)[number];

/** Honest dBFS formatting — NEVER clamps; peak can exceed 0 dBFS (F1). */
const fmtDb = (v: number | undefined | null) =>
  v != null && Number.isFinite(v) ? `${v > 0 ? '+' : ''}${v.toFixed(1)}` : '—';

export function WaveformScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { state, frames, start, stop, lastError } = useDspEngine(
    { waveformEnabled: true },
    { meter: true, waveform: true },
  );

  const [panelW, setPanelW] = useState(0);
  const [zoom, setZoom] = useState<Zoom>(1);
  // FREEZE: non-null = the buckets held on screen. Capture continues (spec §11
  // freeze control) — only the drawing stops updating.
  const [frozen, setFrozen] = useState<WaveBucket[] | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Clear the SAVED ✓ timer on unmount (house review rule 2026-07-23).
  useEffect(
    () => () => {
      if (savedTimer.current) clearTimeout(savedTimer.current);
    },
    [],
  );

  // getWaveform() is newest-first → reverse so index 0 is oldest, drawn
  // leftmost, newest at the right edge (oscilloscope convention, §11 View 1).
  const liveBuckets = useMemo(
    () => frames.waveform.slice(0, MAX_BUCKETS).reverse(),
    [frames.waveform],
  );
  const displayBuckets = frozen ?? liveBuckets;
  const windowSec = displayBuckets.length * BUCKET_SEC;

  const meter = frames.meter;
  // Live quality flags (spec §6) — the SAME flags get stored on save.
  const flags = useMemo(() => meterWarningFlags(meter), [meter]);

  const toggleFreeze = useCallback(() => {
    setFrozen((f) => (f ? null : liveBuckets));
  }, [liveBuckets]);

  const onStop = useCallback(() => {
    setFrozen(null);
    stop();
  }, [stop]);

  /** Save the on-screen envelope to the library (Phase 2, spec §7) —
   *  numbers only, never audio. */
  const onSave = useCallback(() => {
    if (!meter || displayBuckets.length === 0) return;
    saveMeasurement({
      id: Crypto.randomUUID(),
      tool_type: 'waveform',
      created_at: new Date().toISOString(),
      title: `Waveform — ${windowSec.toFixed(1)} s · peak ${fmtDb(meter.peakDb)} dBFS`,
      notes: '',
      input_device: 'Device microphone (uncalibrated)',
      calibration_status: 'not_applicable',
      sample_rate: ApeDsp.getInfo()?.sampleRate ?? null,
      measurement_settings: { bucket_ms: 50, zoom },
      quality_state: evaluateQuality(flags),
      warning_flags: flags,
      data_payload: {
        kind: 'waveform_snapshot',
        envelope: displayBuckets.map((b) => ({ min: b.min, max: b.max })),
        durationSec: displayBuckets.length * BUCKET_SEC,
        peakDbfs: meter.peakDb, // never clamped — may exceed 0 dBFS (F1)
        clippedRuns: meter.clipRuns,
        channels: 1,
      },
    });
    setJustSaved(true);
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setJustSaved(false), 1800);
  }, [meter, displayBuckets, windowSec, zoom, flags]);

  // ---- Scope geometry (pure display math over REAL buckets) ----------------
  const scope = useMemo(() => {
    const n = displayBuckets.length;
    if (n === 0 || panelW <= 0) return null;
    // Samples can exceed ±1 (F1): autoscale full-scale to the observed max.
    let observed = 1;
    for (const b of displayBuckets) {
      const m = Math.max(Math.abs(b.min), Math.abs(b.max));
      if (m > observed) observed = m;
    }
    const scaleMax = Math.max(1.05, observed);
    const half = PANEL_H / 2;
    const usable = half - PAD_V;
    const rawY = (v: number) => half - (v * zoom * usable) / scaleMax;
    // Zoomed traces clip at the panel edge (display only — zoom is not gain).
    const y = (v: number) => Math.min(PANEL_H - 2, Math.max(2, rawY(v)));
    const colW = panelW / MAX_BUCKETS;

    let env = '';
    let rms = '';
    let clip = '';
    for (let i = 0; i < n; i++) {
      const b = displayBuckets[i];
      const x = (panelW - (n - i - 0.5) * colW).toFixed(1);
      let y1 = y(b.max);
      let y2 = y(b.min);
      if (y2 - y1 < 1) {
        // Hairline floor so near-silence still draws a visible 1px column.
        y1 -= 0.5;
        y2 += 0.5;
      }
      env += `M${x},${y1.toFixed(1)}L${x},${y2.toFixed(1)}`;
      rms += `M${x},${y(b.rms).toFixed(1)}L${x},${y(-b.rms).toFixed(1)}`;
      if (b.clipped) clip += `M${x},4L${x},12`;
    }
    return {
      env,
      rms,
      clip,
      observed,
      scaleMax,
      strokeW: Math.max(1, colW * 0.8),
      yPlus1: y(1),
      yMinus1: y(-1),
      oneVisible: rawY(1) >= 2 && rawY(-1) <= PANEL_H - 2,
    };
  }, [displayBuckets, panelW, zoom]);

  const running = state === 'running';
  const half = PANEL_H / 2;

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={{ flexShrink: 1 }}>
          <Text style={styles.title}>WAVEFORM VIEWER</Text>
          <Text style={styles.subtitle}>Live oscilloscope · amplitude vs time</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Honest not-ready states (absent / spike / denied / error). */}
        <EngineGate state={state} lastError={lastError} />
        {state === 'error' ? (
          <GlassButton label="TRY AGAIN" tint="teal" height={52} fontSize={15} onPress={() => void start()} />
        ) : null}

        {state === 'idle' || state === 'starting' ? (
          <>
            <Text style={styles.intro}>
              A live oscilloscope of the microphone signal: min/max amplitude envelope over the last
              few seconds, RMS energy band, and clipping markers. Nothing is drawn until real capture
              is running — press START to begin.
            </Text>
            <GlassButton
              label={state === 'starting' ? 'STARTING…' : 'START'}
              tint="teal"
              height={56}
              fontSize={16}
              disabled={state === 'starting'}
              onPress={() => void start()}
            />
            <Text style={styles.footnote}>
              Capture starts only when you press START and stops when you leave this screen. Audio is
              processed on-device; saved snapshots contain numbers only, never audio.
            </Text>
          </>
        ) : null}

        {running ? (
          <>
            {/* Oscilloscope panel — REAL buckets only (§11 View 1). */}
            <View style={styles.scopeCard}>
              <View
                style={styles.scopeSurface}
                onLayout={(e) => setPanelW(Math.round(e.nativeEvent.layout.width))}
              >
                {panelW > 0 ? (
                  <Svg width={panelW} height={PANEL_H}>
                    {/* ±1 reference lines + marks (hidden if zoomed off-panel). */}
                    {scope?.oneVisible ? (
                      <>
                        <Line x1={0} x2={panelW} y1={scope.yPlus1} y2={scope.yPlus1} stroke={colors.hairline} strokeDasharray="4 4" />
                        <Line x1={0} x2={panelW} y1={scope.yMinus1} y2={scope.yMinus1} stroke={colors.hairline} strokeDasharray="4 4" />
                        <SvgText x={4} y={scope.yPlus1 - 4} fill={colors.textSub} fontSize={12} fontFamily={fonts.mono}>
                          +1
                        </SvgText>
                        <SvgText x={4} y={scope.yMinus1 + 13} fill={colors.textSub} fontSize={12} fontFamily={fonts.mono}>
                          -1
                        </SvgText>
                      </>
                    ) : null}
                    {/* Zero line — centered, always visible (§11). */}
                    <Line x1={0} x2={panelW} y1={half} y2={half} stroke="#4a4a50" strokeWidth={1} />
                    <SvgText x={4} y={half - 4} fill={colors.textSub} fontSize={12} fontFamily={fonts.mono}>
                      0
                    </SvgText>
                    {scope ? (
                      <>
                        {/* RMS energy band under the peak envelope. */}
                        <Path d={scope.rms} stroke={TRACE} opacity={0.32} strokeWidth={scope.strokeW} />
                        <Path d={scope.env} stroke={TRACE} opacity={0.9} strokeWidth={scope.strokeW} />
                        {/* Clipped buckets — red ticks in the top lane. */}
                        {scope.clip !== '' ? (
                          <Path d={scope.clip} stroke={colors.red} strokeWidth={scope.strokeW} />
                        ) : null}
                      </>
                    ) : null}
                  </Svg>
                ) : null}
                {frozen ? <Text style={styles.frozenBadge}>FROZEN</Text> : null}
              </View>
              {/* Time axis + honest scale disclosure. */}
              <View style={styles.axisRow}>
                <Text style={styles.axisText}>−{windowSec.toFixed(1)} s</Text>
                {scope && scope.observed > 1 ? (
                  <Text style={styles.axisText}>scale ±{scope.scaleMax.toFixed(2)}</Text>
                ) : null}
                <Text style={styles.axisText}>now</Text>
              </View>
            </View>

            {/* Vertical zoom (display scaling ONLY) + freeze. */}
            <View style={styles.chipRow}>
              {ZOOMS.map((z) => (
                <Pressable
                  key={z}
                  style={[styles.chip, zoom === z && styles.chipActive]}
                  onPress={() => setZoom(z)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: zoom === z }}
                  accessibilityLabel={`Vertical zoom ${z} times`}
                >
                  <Text style={[styles.chipText, zoom === z && styles.chipTextActive]}>×{z}</Text>
                </Pressable>
              ))}
              <Pressable
                style={[styles.chip, styles.chipWide, frozen != null && styles.chipFrozen]}
                onPress={toggleFreeze}
                disabled={displayBuckets.length === 0}
                accessibilityRole="button"
                accessibilityState={{ selected: frozen != null, disabled: displayBuckets.length === 0 }}
                accessibilityLabel={frozen ? 'Unfreeze display' : 'Freeze display'}
              >
                <Text style={[styles.chipText, frozen != null && styles.chipTextFrozen]}>
                  {frozen ? 'FROZEN' : 'FREEZE'}
                </Text>
              </Pressable>
            </View>
            {zoom > 1 ? (
              // Required §11 honesty line — visible whenever zoom is engaged.
              <Text style={styles.liveWarn}>Vertical zoom changes display size, not audio level.</Text>
            ) : null}

            {/* Live readouts — real meter frame only; peak NEVER clamped (F1). */}
            <View style={styles.statGrid}>
              <View style={styles.statCell}>
                <Text style={styles.statLabel}>PEAK</Text>
                <Text style={styles.statValue}>
                  {fmtDb(meter?.peakDb)}
                  <Text style={styles.statUnit}> dBFS</Text>
                </Text>
              </View>
              <View style={styles.statCell}>
                <Text style={styles.statLabel}>CLIP RUNS</Text>
                <Text style={styles.statValue}>{meter ? meter.clipRuns : '—'}</Text>
              </View>
              <View style={styles.statCell}>
                <Text style={styles.statLabel}>WINDOW</Text>
                <Text style={styles.statValue}>
                  {windowSec.toFixed(1)}
                  <Text style={styles.statUnit}> s</Text>
                </Text>
              </View>
            </View>
            <Text style={styles.calNote}>Levels are dBFS · uncalibrated approximate — not dB SPL.</Text>

            {/* Live quality warnings (spec §6) — same flags stored on save. */}
            {flags.map((f) => (
              <Text key={f} style={styles.liveWarn}>
                ⚠ {WARNING_INFO[f].message} {WARNING_INFO[f].hint}
              </Text>
            ))}

            <View style={styles.controls}>
              <View style={{ flex: 1 }}>
                <GlassButton label="STOP" tint="teal" height={52} fontSize={15} onPress={onStop} />
              </View>
              <Pressable
                style={[
                  styles.saveBtn,
                  justSaved && styles.saveBtnSaved,
                  (!meter || displayBuckets.length === 0) && styles.saveBtnDisabled,
                ]}
                onPress={onSave}
                disabled={!meter || displayBuckets.length === 0}
                accessibilityRole="button"
                accessibilityState={{ disabled: !meter || displayBuckets.length === 0 }}
                accessibilityLabel="Save snapshot"
              >
                <Text style={[styles.saveText, justSaved && styles.saveTextSaved]}>
                  {justSaved ? 'SAVED ✓' : 'SAVE SNAPSHOT'}
                </Text>
              </Pressable>
            </View>

            <Pressable
              onPress={() => navigation.navigate('ToolLibrary', { toolKey: 'waveform' })}
              accessibilityRole="button"
              accessibilityLabel="View saved measurements"
            >
              <Text style={styles.libraryLink}>VIEW SAVED MEASUREMENTS ›</Text>
            </Pressable>

            {/* Required interpretation warnings (spec §11). */}
            <Text style={styles.footnote}>
              Waveform height is not the same as perceived loudness. This view shows amplitude over
              time, not frequency balance.
            </Text>
          </>
        ) : null}
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
  scroll: { padding: 16, paddingBottom: 32, gap: 14 },

  intro: { fontFamily: fonts.barlowRegular, fontSize: 15.5, lineHeight: 23, color: colors.textSecondary },

  // Oscilloscope card.
  scopeCard: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    padding: 10,
    gap: 6,
  },
  scopeSurface: { height: PANEL_H, borderRadius: 6, overflow: 'hidden', backgroundColor: '#0a0a0c' },
  frozenBadge: {
    position: 'absolute',
    top: 6,
    right: 8,
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 12,
    letterSpacing: 1.6,
    color: colors.cyanBright,
  },
  axisRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 2 },
  axisText: { fontFamily: fonts.mono, fontSize: 12, color: colors.textSub },

  // Zoom / freeze chips.
  chipRow: { flexDirection: 'row', gap: 10 },
  chip: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    backgroundColor: '#161616',
    paddingVertical: 11,
    alignItems: 'center',
  },
  chipWide: { flex: 1.6 },
  chipActive: { borderColor: 'rgba(95,217,196,.6)', backgroundColor: '#10171a' },
  chipFrozen: { borderColor: 'rgba(127,212,255,.6)', backgroundColor: '#0d151a' },
  chipText: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 1.2, color: colors.textSecondary },
  chipTextActive: { color: TRACE },
  chipTextFrozen: { color: colors.cyanBright },

  // Readouts.
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
  statLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 1.2, color: colors.textSub },
  statValue: { fontFamily: fonts.mono, fontSize: 20, color: colors.textPrimary },
  statUnit: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, color: colors.amberLabel },
  calNote: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.textSub },

  // Live quality warning line (spec §6) — house amber warning style.
  liveWarn: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18.5, color: colors.amber },

  controls: { flexDirection: 'row', gap: 12, alignItems: 'stretch' },
  saveBtn: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    backgroundColor: '#161616',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnSaved: { borderColor: 'rgba(91,255,133,.65)', backgroundColor: '#0d1710' },
  saveBtnDisabled: { opacity: 0.45 },
  saveText: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 1.4, color: colors.textSecondary },
  saveTextSaved: { color: colors.greenBright },

  libraryLink: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 12,
    letterSpacing: 1.4,
    color: '#4dd0e1',
    textAlign: 'center',
  },
  footnote: {
    fontFamily: fonts.barlowRegular,
    fontStyle: 'italic',
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.textMuted,
  },
});
