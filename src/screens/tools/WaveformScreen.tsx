/**
 * WaveformScreen — Waveform Viewer LIVE oscilloscope view (spec of record
 * docs/APE_AUDIO_TOOLS_SPEC_2026_07_23.md §11 View 1; engine build 2026-07-23).
 * Min/max envelope from the engine's waveform buckets (50 ms each, newest at
 * right) drawn as a gradient-filled area with a glow edge, RMS energy core,
 * red clip ticks, styled center line + dB grid, ±1 amplitude marks.
 *
 * Owner directive 2026-07-29: zoom chips ×1/×2/×4/×6 (DEFAULT ×4) and an
 * adjustable time window (DEFAULT 5 s). The owner asked for 2–7 s, but the
 * native engine ring (WaveEnvelope: 50 ms × 120 buckets, both bridges cap at
 * kMaxWaveBuckets = 120) holds exactly 6.0 s of REAL history — so the control
 * honestly tops out at 6 s and says so on screen; we never draw fabricated
 * history (measurement-tools §1.7).
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
 *  - Vertical zoom AND the time window are display scaling ONLY, with the
 *    spec §11 honesty line shown whenever zoom is engaged.
 *  - FREEZE holds the drawn buckets (the FULL 6 s engine history is held, so
 *    the window control keeps slicing real data while frozen); capture (and
 *    the live meter) continue.
 *  - SAVE SNAPSHOT stores the envelope as NUMBERS (never audio) with the same
 *    quality flags shown live (spec §6/§7).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Svg, { Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import * as Crypto from 'expo-crypto';
import { ApeDsp, type WaveBucket } from '../../../modules/ape-dsp';
import { GlassButton } from '../../components/GlassButton';
import { meterWarningFlags, useDspEngine } from '../../features/tools/engine/useDspEngine';
import { saveMeasurement } from '../../features/tools/measure/measurementStore';
import { evaluateQuality } from '../../features/tools/measure/quality';
import { WARNING_INFO } from '../../features/tools/measure/types';
import { colors, fonts } from '../../theme/tokens';
import { EngineGate } from './EngineGate';
import { useToolHelp, DisplayGuideButton } from '../../features/lab/guidedLessons';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'WaveformLive'>;

const BUCKET_SEC = 0.05;
/** The native ring's REAL capacity: 50 ms × 120 = 6.0 s (WaveEnvelope.hpp,
 *  kMaxWaveBuckets on both bridges). The window control caps here — honest. */
const ENGINE_HISTORY_BUCKETS = 120;
const ENGINE_HISTORY_SEC = ENGINE_HISTORY_BUCKETS * BUCKET_SEC;
const PANEL_H = 240;
/** Vertical inset of the drawable area (leaves the clip-tick lane at top). */
const PAD_V = 16;
/** Accent for clip ticks / axis (teal, toolsData). */
const TRACE = '#5fd9c4';
/** The waveform fill — AMBER, drawn solid like a DAW (owner 2026-07-31). */
const AMBER = '#ffb52e';
const AMBER_RMS = '#ffd27a';

/** Vertical zoom chips — owner 2026-07-29: ×6 added, DEFAULT ×4. */
const ZOOMS = [1, 2, 4, 6] as const;
type Zoom = (typeof ZOOMS)[number];
const DEFAULT_ZOOM: Zoom = 4;

/** Time-window chips (seconds of history shown) — owner 2026-07-31: 1–5 s. */
const WINDOWS = [1, 2, 3, 4, 5] as const;
type WindowSec = (typeof WINDOWS)[number];
const DEFAULT_WINDOW: WindowSec = 5;

/** Honest dBFS formatting — NEVER clamps; peak can exceed 0 dBFS (F1). */
const fmtDb = (v: number | undefined | null) =>
  v != null && Number.isFinite(v) ? `${v > 0 ? '+' : ''}${v.toFixed(1)}` : '—';

export function WaveformScreen({ navigation }: Props) {
  const { help, helpAll, sheet } = useToolHelp('waveform');
  const insets = useSafeAreaInsets();
  const { state, frames, start, stop, lastError } = useDspEngine(
    { waveformEnabled: true },
    { meter: true, waveform: true },
  );

  const [panelW, setPanelW] = useState(0);
  const [zoom, setZoom] = useState<Zoom>(DEFAULT_ZOOM);
  const [windowSec, setWindowSec] = useState<WindowSec>(DEFAULT_WINDOW);
  // FREEZE: non-null = the FULL engine history held on screen (so the window
  // control still slices real data while frozen). Capture continues (spec §11
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
    () => frames.waveform.slice(0, ENGINE_HISTORY_BUCKETS).reverse(),
    [frames.waveform],
  );
  const windowBuckets = Math.round(windowSec / BUCKET_SEC);
  const source = frozen ?? liveBuckets;
  /** The buckets actually on screen: the newest `windowBuckets` of the real
   *  history — a shorter run early in capture simply shows what exists. */
  const displayBuckets = useMemo(
    () => source.slice(Math.max(0, source.length - windowBuckets)),
    [source, windowBuckets],
  );
  const shownSec = displayBuckets.length * BUCKET_SEC;

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
      title: `Waveform — ${shownSec.toFixed(1)} s · peak ${fmtDb(meter.peakDb)} dBFS`,
      notes: '',
      input_device: 'Device microphone (uncalibrated)',
      calibration_status: 'not_applicable',
      sample_rate: ApeDsp.getInfo()?.sampleRate ?? null,
      measurement_settings: { bucket_ms: 50, zoom, window_sec: windowSec },
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
  }, [meter, displayBuckets, shownSec, zoom, windowSec, flags]);

  // ---- Scope geometry (pure display math over REAL buckets) ----------------
  // Builds: a closed min/max envelope area (gradient fill), the envelope
  // outline (drawn twice — wide translucent glow + crisp edge), a closed ±RMS
  // energy core, and the red clip-tick lane. ~15 SVG nodes total, rebuilt at
  // the 15 Hz poll — bounded and cheap.
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
    const colW = panelW / windowBuckets;

    // PER-PIXEL min/max envelope (owner 2026-07-31): sample the bucket envelope at
    // EVERY screen pixel (linearly interpolated between bucket centres) so the
    // waveform is drawn as finely as the screen allows — one filled amber body,
    // like a DAW, not a coarse outlined trace.
    const sampleAt = (px: number) => {
      let f = n - 0.5 - (panelW - px) / colW; // fractional bucket index at this x
      if (f < 0) f = 0;
      if (f > n - 1) f = n - 1;
      const i0 = Math.floor(f);
      const i1 = Math.min(n - 1, i0 + 1);
      const t = f - i0;
      const a = displayBuckets[i0];
      const b = displayBuckets[i1];
      return {
        max: a.max + (b.max - a.max) * t,
        min: a.min + (b.min - a.min) * t,
        rms: a.rms + (b.rms - a.rms) * t,
      };
    };
    let top = ''; // max edge, left → right
    let bottomRev = ''; // min edge, right → left (closes the area)
    let rmsTop = '';
    let rmsRev = '';
    let clip = '';
    const W = Math.round(panelW);
    for (let px = 0; px <= W; px++) {
      const s = sampleAt(px);
      let y1 = y(s.max);
      let y2 = y(s.min);
      if (y2 - y1 < 1) {
        // Hairline floor so near-silence still draws a visible 1px band.
        y1 -= 0.5;
        y2 += 0.5;
      }
      const cmd = px === 0 ? 'M' : 'L';
      top += `${cmd}${px},${y1.toFixed(1)}`;
      bottomRev = `L${px},${y2.toFixed(1)}` + bottomRev;
      rmsTop += `${cmd}${px},${y(s.rms).toFixed(1)}`;
      rmsRev = `L${px},${y(-s.rms).toFixed(1)}` + rmsRev;
    }
    // Clip ticks stay per REAL bucket (a bucket either clipped or it didn't).
    for (let i = 0; i < n; i++) {
      if (displayBuckets[i].clipped) {
        const x = (panelW - (n - i - 0.5) * colW).toFixed(1);
        clip += `M${x},4L${x},12`;
      }
    }
    return {
      area: top + bottomRev + 'Z',
      rmsArea: rmsTop + rmsRev + 'Z',
      clip,
      observed,
      scaleMax,
      clipW: Math.max(1.5, colW * 0.8),
      yPlus1: y(1),
      yMinus1: y(-1),
      oneVisible: rawY(1) >= 2 && rawY(-1) <= PANEL_H - 2,
      yHalfP: y(0.5),
      yHalfM: y(-0.5),
      halfVisible: rawY(0.5) >= 2 && rawY(-0.5) <= PANEL_H - 2,
    };
  }, [displayBuckets, panelW, zoom, windowBuckets]);

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
            {/* Live readouts — ABOVE the viewer (owner 2026-07-31). Real meter
                frame only; peak NEVER clamped (F1). */}
            <View style={styles.statGrid}>
              <Pressable style={styles.statCell} onLongPress={() => help('peak')} delayLongPress={260}>
                <Text style={styles.statLabel}>PEAK</Text>
                <Text style={styles.statValue}>
                  {fmtDb(meter?.peakDb)}
                  <Text style={styles.statUnit}> dBFS</Text>
                </Text>
              </Pressable>
              <Pressable style={styles.statCell} onLongPress={() => help('clip_runs')} delayLongPress={260}>
                <Text style={styles.statLabel}>CLIP RUNS</Text>
                <Text style={styles.statValue}>{meter ? meter.clipRuns : '—'}</Text>
              </Pressable>
              <Pressable style={styles.statCell} onLongPress={() => help('window')} delayLongPress={260}>
                <Text style={styles.statLabel}>WINDOW</Text>
                <Text style={styles.statValue}>
                  {shownSec.toFixed(1)}
                  <Text style={styles.statUnit}> s</Text>
                </Text>
              </Pressable>
            </View>

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
                    {/* −6 dB (±0.5) grid lines — subtler weight than ±1. */}
                    {scope?.halfVisible ? (
                      <>
                        <Line x1={0} x2={panelW} y1={scope.yHalfP} y2={scope.yHalfP} stroke={colors.hairlineDim} strokeDasharray="2 6" />
                        <Line x1={0} x2={panelW} y1={scope.yHalfM} y2={scope.yHalfM} stroke={colors.hairlineDim} strokeDasharray="2 6" />
                        <SvgText x={panelW - 40} y={scope.yHalfP - 4} fill={colors.textMuted} fontSize={12} fontFamily={fonts.mono}>
                          -6dB
                        </SvgText>
                      </>
                    ) : null}
                    {/* Zero line — centered, always visible (§11), teal-tinted. */}
                    <Line x1={0} x2={panelW} y1={half} y2={half} stroke="#3e5852" strokeWidth={1} />
                    <SvgText x={4} y={half - 4} fill={colors.textSub} fontSize={12} fontFamily={fonts.mono}>
                      0
                    </SvgText>
                    {scope ? (
                      <>
                        {/* DAW-style solid AMBER waveform (owner 2026-07-31): the
                            peak (min/max) body filled solid, a brighter RMS core on
                            top — no outline, no glow. */}
                        <Path d={scope.area} fill={AMBER} opacity={0.92} />
                        <Path d={scope.rmsArea} fill={AMBER_RMS} opacity={0.9} />
                        {/* Clipped buckets — red ticks in the top lane. */}
                        {scope.clip !== '' ? (
                          <Path d={scope.clip} stroke={colors.red} strokeWidth={scope.clipW} />
                        ) : null}
                      </>
                    ) : null}
                    {/* Frame. */}
                    <Rect x={0.5} y={0.5} width={panelW - 1} height={PANEL_H - 1} stroke="#26262c" strokeWidth={1} fill="none" />
                  </Svg>
                ) : null}
                {frozen ? <Text style={styles.frozenBadge}>FROZEN</Text> : null}
              </View>
              {/* Time axis + honest scale disclosure. */}
              <View style={styles.axisRow}>
                <Text style={styles.axisText}>−{shownSec.toFixed(1)} s</Text>
                {scope && scope.observed > 1 ? (
                  <Text style={styles.axisText}>scale ±{scope.scaleMax.toFixed(2)}</Text>
                ) : null}
                <Text style={styles.axisText}>now</Text>
              </View>
            </View>

            {/* Vertical zoom (display scaling ONLY) + freeze. */}
            <View style={styles.chipRow}>
              <Text style={styles.rowLabel}>ZOOM</Text>
              {ZOOMS.map((z) => (
                <Pressable
                  key={z}
                  style={[styles.chip, zoom === z && styles.chipGreen]}
                  onPress={() => setZoom(z)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: zoom === z }}
                  accessibilityLabel={`Vertical zoom ${z} times`}
                >
                  <Text style={[styles.chipText, zoom === z && styles.chipTextGreen]}>×{z}</Text>
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

            {/* Time window (display history length — real buckets only). */}
            <View style={styles.chipRow}>
              <Text style={styles.rowLabel}>WINDOW</Text>
              {WINDOWS.map((w) => (
                <Pressable
                  key={w}
                  style={[styles.chip, windowSec === w && styles.chipBlue]}
                  onPress={() => setWindowSec(w)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: windowSec === w }}
                  accessibilityLabel={`Time window ${w} seconds`}
                >
                  <Text style={[styles.chipText, windowSec === w && styles.chipTextBlue]}>{w}s</Text>
                </Pressable>
              ))}
            </View>
            {zoom > 1 ? (
              // Required §11 honesty line — visible whenever zoom is engaged.
              <Text style={styles.liveWarn}>Vertical zoom changes display size, not audio level.</Text>
            ) : null}
            <Text style={styles.settingsNote}>
              Zoom and window change the display only — capture keeps running unchanged.
            </Text>

            <Text style={styles.calNote}>Levels are dBFS · uncalibrated approximate — not dB SPL.</Text>

            {/* Live quality warnings (spec §6) — same flags stored on save. */}
            {flags.map((f) => (
              <Text key={f} style={styles.liveWarn}>
                ⚠ {WARNING_INFO[f].message} {WARNING_INFO[f].hint}
              </Text>
            ))}

            <DisplayGuideButton onPress={helpAll} />

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
  scopeSurface: { height: PANEL_H, borderRadius: 6, overflow: 'hidden', backgroundColor: '#07090b' },
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

  // Zoom / window / freeze chip rows.
  chipRow: { flexDirection: 'row', gap: 10, alignItems: 'stretch' },
  rowLabel: {
    width: 56,
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 12,
    letterSpacing: 1.4,
    color: colors.textSub,
    alignSelf: 'center',
  },
  chip: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    backgroundColor: '#161616',
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipWide: { flex: 1.6 },
  chipActive: { borderColor: 'rgba(95,217,196,.6)', backgroundColor: '#10171a' },
  // ZOOM = green, WINDOW = blue (owner 2026-07-31).
  chipGreen: { borderColor: 'rgba(55,224,95,.65)', backgroundColor: '#0c2012' },
  chipTextGreen: { color: '#37e05f' },
  chipBlue: { borderColor: 'rgba(93,151,255,.65)', backgroundColor: '#101f36' },
  chipTextBlue: { color: '#7fa8ff' },
  chipFrozen: { borderColor: 'rgba(127,212,255,.6)', backgroundColor: '#0d151a' },
  chipText: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 1.2, color: colors.textSecondary },
  chipTextActive: { color: TRACE },
  chipTextFrozen: { color: colors.cyanBright },
  settingsNote: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textMuted },

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
