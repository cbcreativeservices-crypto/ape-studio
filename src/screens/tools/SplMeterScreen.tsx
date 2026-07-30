/**
 * SplMeterScreen — SPL Reference Meter, LIVE (engine build 2026-07-23; spec
 * APE_AUDIO_TOOLS_SPEC_2026_07_23.md §9: View 1 live meter + View 2 session
 * logging). Weighted metering (A/C/Z × Fast/Slow) from the native ape-dsp
 * meter frame via the shared useDspEngine hook, PEAK / PEAK HOLD with reset,
 * and a Leq session log that saves to the Measurement Library (Phase 2, §7).
 *
 * Integrity (§1.7/§5/§6):
 *  - Nothing is simulated — readouts render ONLY from a real meter frame while
 *    capture is running; every other state is EngineGate or the START card.
 *  - Every value is dBFS and labeled "dBFS · uncalibrated approximate". No
 *    number is ever presented as dB SPL (calibration does not exist yet).
 *  - Peak may legitimately exceed 0 dBFS (finding F1) — shown honestly in red,
 *    never clamped.
 *  - Capture starts only on the explicit START press; the hook stops capture
 *    on unmount (§18: no DSP behind a closed screen).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSharedValue } from 'react-native-reanimated';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Crypto from 'expo-crypto';
import { GlassButton } from '../../components/GlassButton';
import { requireVizMeters, type VizMetersModule } from '../lab/meter/skiaGate';
import type { LiveMeterDrive, PeakHoldMode } from '../lab/meter/vizMeters';
import { meterWarningFlags, useDspEngine } from '../../features/tools/engine/useDspEngine';
import { setSplCalibration, useSplCalibration } from '../../features/tools/measure/calibrationStore';
import { saveMeasurement } from '../../features/tools/measure/measurementStore';
import { evaluateQuality } from '../../features/tools/measure/quality';
import { WARNING_INFO, type SplLogPayload } from '../../features/tools/measure/types';
import { colors, fonts } from '../../theme/tokens';
import { EngineGate } from './EngineGate';
import { MIC_LIMITS, toolByKey } from './toolsData';
import type { MeterFrame } from '../../../modules/ape-dsp';
import { useToolHelp, HelpHead, DisplayGuideButton } from '../../features/lab/guidedLessons';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'SplMeter'>;

type Weighting = SplLogPayload['weighting']; // 'A' | 'C' | 'Z'
type MeterResponse = SplLogPayload['response']; // 'fast' | 'slow'

const WEIGHTINGS: Weighting[] = ['A', 'C', 'Z'];
const RESPONSES: MeterResponse[] = ['fast', 'slow'];

/** The selected weighting × response reading from a real meter frame. */
function selectedLevelDb(m: MeterFrame, w: Weighting, r: MeterResponse): number {
  if (w === 'A') return r === 'fast' ? m.aFastDb : m.aSlowDb;
  if (w === 'C') return r === 'fast' ? m.cFastDb : m.cSlowDb;
  return r === 'fast' ? m.zFastDb : m.zSlowDb;
}

/** dB display: one decimal, honest "+" above 0 dBFS (F1), em-dash for silence
 *  (-Infinity from the engine before any signal). */
const fmtDb = (v: number) => (Number.isFinite(v) ? (v > 0 ? `+${v.toFixed(1)}` : v.toFixed(1)) : '—');

const fmtElapsed = (sec: number) => {
  if (!Number.isFinite(sec) || sec < 0) return '0:00';
  const s = Math.floor(sec);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/** Wall-seconds one phase-clock loop represents inside the VU popup — the
 *  clock runs at 1/VU_LOOP Hz so the ballistics integrate real time. */
const VU_LOOP = 4;

/** The popup's Skia hero (mounted only while the popup is open AND the viz
 *  module gate passed): LEFT the circular dB-SPL dial (two arc scales + mixing
 *  sweet-spot band + ballistic needle + corner readouts), RIGHT the thin live
 *  LED meter (PEAK + AVERAGE columns with a user peak-hold). Both are driven by
 *  the SAME polled RMS/peak SharedValues off one shared phase clock. */
function VuHero({
  viz,
  live,
  dialW,
  ledW,
  dialH,
  holdMode,
  splOffset,
  calibrated,
  levelLabel,
  levelValue,
  levelUnit,
  peakValue,
  peakHoldValue,
  peakHot,
  peakHoldHot,
}: {
  viz: VizMetersModule;
  live: LiveMeterDrive;
  dialW: number;
  ledW: number;
  dialH: number;
  holdMode: PeakHoldMode;
  splOffset: number;
  calibrated: boolean;
  levelLabel: string;
  levelValue: string;
  levelUnit: string;
  peakValue: string;
  peakHoldValue: string;
  peakHot: boolean;
  peakHoldHot: boolean;
}) {
  const phase = viz.usePhaseClock(true, 1 / VU_LOOP);
  return (
    <View style={styles.heroRow}>
      <viz.SplDialView
        width={dialW}
        height={dialH}
        phase={phase}
        live={live}
        splOffset={splOffset}
        calibrated={calibrated}
        loopSeconds={VU_LOOP}
        levelLabel={levelLabel}
        levelValue={levelValue}
        levelUnit={levelUnit}
        peakValue={peakValue}
        peakHoldValue={peakHoldValue}
        peakHot={peakHot}
        peakHoldHot={peakHoldHot}
      />
      <viz.PeakAvgMeterView
        width={ledW}
        height={dialH}
        phase={phase}
        live={live}
        loopSeconds={VU_LOOP}
        holdMode={holdMode}
      />
    </View>
  );
}

/** Peak-hold linger options for the LED meter's user setting. */
const HOLD_MODES: PeakHoldMode[] = ['off', '1s', '3s', 'inf'];
const holdLabel = (m: PeakHoldMode) => (m === 'off' ? 'OFF' : m === 'inf' ? '∞' : m);

/** Plain-RN mini-VU fallback for pre-Skia clients (cream face, red zone,
 *  tilted needle) — the opener must read as a tiny VU even without Skia. */
function VuGlyphFallback() {
  return (
    <View style={styles.vuGlyphFace}>
      <View style={styles.vuGlyphArc} />
      <View style={styles.vuGlyphRed} />
      <View style={styles.vuGlyphNeedle} />
    </View>
  );
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

export function SplMeterScreen({ navigation }: Props) {
  const { help, helpAll, sheet } = useToolHelp('spl');
  const insets = useSafeAreaInsets();
  const tool = toolByKey('spl');
  const { state, frames, start, stop, lastError, resetPeakHold, resetLeq } = useDspEngine(
    {},
    { meter: true },
  );

  const [weighting, setWeighting] = useState<Weighting>('A');
  const [response, setResponse] = useState<MeterResponse>('fast');
  const [justSaved, setJustSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (savedTimer.current) clearTimeout(savedTimer.current);
    },
    [],
  );

  // Field calibration (ruling R1, 2026-07-23): a single DEVICE-LOCAL offset
  // maps dBFS → displayed dB SPL. Calibrated stays APPROXIMATE — this is a
  // field calibration against the user's reference, not an IEC instrument.
  const cal = useSplCalibration();
  const offset = cal?.offsetDb ?? null;
  const [calibrating, setCalibrating] = useState(false);
  // Draft offset while the calibrate panel is open. 100 dB is only a starting
  // point (0 dBFS ≈ 100–120 dB SPL on typical phone mics) — the user matches
  // their reference meter.
  const [draftOffset, setDraftOffset] = useState(100);
  const unitLabel = offset != null ? 'dB SPL · field-calibrated (approximate)' : 'dBFS · uncalibrated approximate';
  /** Level shown to the user: calibrated when an offset exists, else raw dBFS. */
  const shown = (rawDb: number, withDraft = false) =>
    rawDb + (withDraft ? draftOffset : (offset ?? 0));

  const running = state === 'running';
  // Readouts come ONLY from a live frame — stale frames after STOP are not
  // shown (measurement-integrity: no value the mic isn't producing right now).
  const meter = running ? frames.meter : null;
  // Note: meterWarningFlags raises 'uncalibrated_input' only for OS-PROCESSED
  // input (measurement mode not honored) — that stays a warning even when
  // field-calibrated, because it undermines the calibration itself.
  const flags = meterWarningFlags(meter);

  // ── Full-screen VU popup (owner directive 2026-07-29) ─────────────────────
  // Skia meters load ONLY through the meter gate (§1.7 honest fallback).
  const viz = useMemo(() => requireVizMeters(), []);
  const [vuOpen, setVuOpen] = useState(false);
  // User setting for the LED meter's peak-hold cap linger (owner 2026-07-30).
  const [holdMode, setHoldMode] = useState<PeakHoldMode>('1s');
  const { width: winW } = useWindowDimensions();
  // Side-by-side hero sizing (dial LEFT ~60%, thin LED RIGHT ~34%), capped so
  // it never overflows portrait; the two share a height for a clean baseline.
  const heroAvail = winW - 32 - 12;
  const dialW = Math.min(300, Math.round(heroAvail * 0.6));
  const ledW = Math.min(138, Math.round(heroAvail * 0.36));
  const dialH = Math.round(dialW * 1.02);
  // The popup meters are fed by pushing the SAME polled frame values into two
  // SharedValues — no second poll, no duplicated state. RMS = the selected
  // weighting × response level (set in the effect below); peak = the raw peak
  // (F1: may exceed 0 dBFS, never clamped). −120 stands in for silence/no-frame.
  const liveRmsDb = useSharedValue(-120);
  const livePeakDb = useSharedValue(-120);
  // The needle + LED AVERAGE chase the SELECTED weighting × response level (what
  // the user is metering); peak is the raw peak (F1: may exceed 0 dBFS).
  useEffect(() => {
    const lvl = meter ? selectedLevelDb(meter, weighting, response) : -120;
    liveRmsDb.value = Number.isFinite(lvl) ? lvl : -120;
    livePeakDb.value = meter && Number.isFinite(meter.peakDb) ? meter.peakDb : -120;
  }, [meter, weighting, response, liveRmsDb, livePeakDb]);
  const live = useMemo<LiveMeterDrive>(() => ({ rmsDb: liveRmsDb, peakDb: livePeakDb }), [liveRmsDb, livePeakDb]);

  // ── Dial mapping + corner readouts (single source: the screen's shown()/unit
  // math, so the needle's SPL position matches every number elsewhere) ────────
  // splOffset = the field-calibration offset, or a nominal 100 dB estimate when
  // uncalibrated (0 dBFS ≈ 100 dB SPL on a typical phone mic). calibrated=false
  // badges the dial ESTIMATED — never a certified SPL reading (§1.7).
  const splOffset = offset ?? 100;
  const calibrated = offset != null;
  const dialLevelLabel = `L${weighting}${response === 'fast' ? 'F' : 'S'}`;
  const dialLevelValue = meter ? fmtDb(shown(selectedLevelDb(meter, weighting, response))) : '—';
  const dialLevelUnit = offset != null ? 'dB SPL' : 'dBFS · est';
  const dialPeakValue = meter ? fmtDb(meter.peakDb) : '—';
  const dialPeakHoldValue = meter ? fmtDb(meter.peakHoldDb) : '—';
  const dialPeakHot = meter != null && meter.peakDb >= 0;
  const dialPeakHoldHot = meter != null && meter.peakHoldDb >= 0;

  /** SAVE LOG → Saved Measurement Library (spec §7; payload = SplLogPayload). */
  const onSaveLog = useCallback(() => {
    const m = state === 'running' ? frames.meter : null;
    if (!m) return;
    const saveFlags = meterWarningFlags(m);
    // Without a field calibration the record is explicitly uncalibrated
    // (spec §9 required warning). With one (ruling R1), the record carries
    // calibration_status 'calibrated' + the disclosed offset instead.
    if (offset == null && !saveFlags.includes('uncalibrated_input'))
      saveFlags.push('uncalibrated_input');
    // The engine logs Leq(A) and Leq(Z) only — a C-weighted selection stores
    // the unweighted Leq(Z) as its average (documented honest fallback).
    // Values are stored AS DISPLAYED: dB SPL when field-calibrated, else dBFS
    // (compare mode already warns on calibrated-vs-uncalibrated pairs).
    const avgDb = shown(weighting === 'A' ? m.leqADb : m.leqZDb);
    const unit = offset != null ? 'dB SPL' : 'dBFS';
    const payload: SplLogPayload = {
      kind: 'spl_log',
      weighting,
      response,
      durationSec: m.elapsedSec,
      timeline: [], // timeline capture ships with a later engine pass
      timelineStepSec: 0,
      peakDb: shown(m.peakHoldDb),
      avgDb,
    };
    saveMeasurement({
      id: Crypto.randomUUID(),
      tool_type: 'spl',
      created_at: new Date().toISOString(),
      title: `SPL Log — Leq(${weighting === 'A' ? 'A' : 'Z'}) ${fmtDb(avgDb)} ${unit} · ${fmtElapsed(m.elapsedSec)}`,
      notes: '',
      input_device: 'phone microphone',
      calibration_status: offset != null ? 'calibrated' : 'uncalibrated',
      sample_rate: null, // info polling is out of scope for this screen
      measurement_settings:
        offset != null
          ? { weighting, response, cal_offset_db: offset, cal_set_at: cal?.setAt ?? null }
          : { weighting, response },
      quality_state: evaluateQuality(saveFlags),
      warning_flags: saveFlags,
      data_payload: payload,
    });
    setJustSaved(true);
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setJustSaved(false), 1800);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, frames.meter, weighting, response, offset, cal]);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={{ flexShrink: 1 }}>
          <Text style={styles.title}>{tool.name.toUpperCase()}</Text>
          {tool.subtitle ? <Text style={styles.subtitle}>{tool.subtitle}</Text> : null}
        </View>
        {/* Mini-VU opener → the full-screen VU popup (owner 2026-07-29). */}
        <Pressable
          style={styles.vuOpenBtn}
          onPress={() => setVuOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Open full-screen VU meter"
        >
          {viz ? <viz.VuGlyph size={38} /> : <VuGlyphFallback />}
          <Text style={styles.vuOpenLabel}>VU</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Honest not-ready states: absent / spike / denied / error. */}
        <EngineGate state={state} lastError={lastError} />

        {(state === 'idle' || state === 'starting') && (
          <>
            <Text style={styles.intro}>
              Live digital level metering with A/C/Z weighting and Fast/Slow response, plus a
              session Leq log you can save. Every value is dBFS — digital level from the phone
              microphone, uncalibrated and approximate — never dB SPL. The microphone captures
              only while the meter runs.
            </Text>
            <GlassButton
              label={state === 'starting' ? 'STARTING…' : 'START METER'}
              tint="orange"
              disabled={state === 'starting'}
              onPress={() => void start()}
            />
          </>
        )}

        {running && (
          <>
            {/* Weighting × response selection (spec §9 required controls). */}
            <View style={styles.chipsRow}>
              <View style={styles.chipGroup}>
                <HelpHead title="WEIGHTING" onHelp={() => help('weighting')} style={styles.chipGroupLabel} />
                <View style={styles.chipSet}>
                  {WEIGHTINGS.map((w) => (
                    <Chip key={w} label={w} selected={weighting === w} onPress={() => setWeighting(w)} />
                  ))}
                </View>
              </View>
              <View style={styles.chipGroup}>
                <HelpHead title="RESPONSE" onHelp={() => help('response')} style={styles.chipGroupLabel} />
                <View style={styles.chipSet}>
                  {RESPONSES.map((r) => (
                    <Chip key={r} label={r.toUpperCase()} selected={response === r} onPress={() => setResponse(r)} />
                  ))}
                </View>
              </View>
            </View>

            {/* Big live readout of the selected weighting × response. */}
            <View style={styles.readoutCard}>
              <Text style={styles.readoutEyebrow}>
                {`L${weighting}${response === 'fast' ? 'F' : 'S'} · ${weighting}-WEIGHTED · ${response.toUpperCase()}`}
              </Text>
              <Text style={styles.readoutValue}>
                {meter ? fmtDb(shown(selectedLevelDb(meter, weighting, response))) : '—'}
              </Text>
              <Text style={styles.readoutSub}>{unitLabel}</Text>
            </View>
            <DisplayGuideButton onPress={helpAll} />

            {/* Field calibration (ruling R1, 2026-07-23): device-local offset,
                matched against the user's reference meter. */}
            <View style={styles.calCard}>
              <View style={styles.calHeadRow}>
                <HelpHead title="CALIBRATION" onHelp={() => help('calibration')} style={styles.sectionHead} />
                <Text style={[styles.calStatus, offset != null && styles.calStatusOn]}>
                  {offset != null ? `FIELD-CALIBRATED · +${offset.toFixed(1)} dB` : 'UNCALIBRATED'}
                </Text>
              </View>
              {!calibrating ? (
                <View style={styles.controls}>
                  <Pressable
                    style={styles.ctrlBtn}
                    onPress={() => {
                      setDraftOffset(offset ?? 100);
                      setCalibrating(true);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Calibrate against a reference meter"
                  >
                    <Text style={styles.ctrlText}>{offset != null ? 'RE-CALIBRATE' : 'CALIBRATE'}</Text>
                  </Pressable>
                  {offset != null && (
                    <Pressable
                      style={styles.ctrlBtn}
                      onPress={() => setSplCalibration(null)}
                      accessibilityRole="button"
                      accessibilityLabel="Clear calibration"
                    >
                      <Text style={styles.ctrlText}>CLEAR</Text>
                    </Pressable>
                  )}
                </View>
              ) : (
                <>
                  <Text style={styles.calHint}>
                    Play steady pink noise and adjust until this reading matches your reference
                    sound-level meter (same weighting and response on both).
                  </Text>
                  <Text style={styles.calDraftValue}>
                    {meter ? fmtDb(shown(selectedLevelDb(meter, weighting, response), true)) : '—'}
                    <Text style={styles.calDraftUnit}>  dB SPL (candidate)</Text>
                  </Text>
                  <View style={styles.controls}>
                    {[-5, -0.5, +0.5, +5].map((step) => (
                      <Pressable
                        key={step}
                        style={styles.ctrlBtn}
                        onPress={() => setDraftOffset((d) => Math.round((d + step) * 2) / 2)}
                        accessibilityRole="button"
                        accessibilityLabel={`Adjust ${step > 0 ? 'up' : 'down'} ${Math.abs(step)} dB`}
                      >
                        <Text style={styles.ctrlText}>{step > 0 ? `+${step}` : step}</Text>
                      </Pressable>
                    ))}
                  </View>
                  <View style={styles.controls}>
                    <Pressable
                      style={styles.ctrlBtn}
                      onPress={() => setCalibrating(false)}
                      accessibilityRole="button"
                      accessibilityLabel="Cancel calibration"
                    >
                      <Text style={styles.ctrlText}>CANCEL</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.ctrlBtn, styles.ctrlBtnSaved]}
                      onPress={() => {
                        setSplCalibration(draftOffset);
                        setCalibrating(false);
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="Set calibration"
                    >
                      <Text style={[styles.ctrlText, styles.ctrlTextSaved]}>SET</Text>
                    </Pressable>
                  </View>
                </>
              )}
              <Text style={styles.calNote}>
                Field calibration is stored on this device only and stays approximate — it is not a
                certified instrument calibration.
              </Text>
            </View>

            {/* PEAK / PEAK HOLD — may exceed 0 dBFS (F1): red at ≥ 0, never clamped. */}
            <View style={styles.peakRow}>
              {/* Peak cells stay RAW dBFS always — they are digital-headroom
                  indicators; the ≥0 dBFS hot state is about the converter
                  ceiling, not acoustic level (F1). */}
              <Pressable style={styles.peakCell} onLongPress={() => help('peak')} delayLongPress={260}>
                <Text style={styles.cellLabel}>PEAK (dBFS)</Text>
                <Text style={[styles.cellValue, meter != null && meter.peakDb >= 0 && styles.cellValueHot]}>
                  {meter ? fmtDb(meter.peakDb) : '—'}
                </Text>
              </Pressable>
              <Pressable style={styles.peakCell} onLongPress={() => help('peak_hold')} delayLongPress={260}>
                <Text style={styles.cellLabel}>PEAK HOLD (dBFS)</Text>
                <Text style={[styles.cellValue, meter != null && meter.peakHoldDb >= 0 && styles.cellValueHot]}>
                  {meter ? fmtDb(meter.peakHoldDb) : '—'}
                </Text>
              </Pressable>
              <Pressable
                style={styles.ctrlBtnSmall}
                onPress={resetPeakHold}
                accessibilityRole="button"
                accessibilityLabel="Reset peak hold"
              >
                <Text style={styles.ctrlText}>RESET{'\n'}PEAK</Text>
              </Pressable>
            </View>

            {/* Live quality warnings, plain language (spec §6) — the SAME flags
                that get stored with a saved log. */}
            {flags.map((f) => (
              <Text key={f} style={styles.liveWarn}>
                ⚠ {WARNING_INFO[f].message} {WARNING_INFO[f].hint}
              </Text>
            ))}

            {/* Session log (spec §9 View 2): Leq + elapsed + reset/save. */}
            <View style={styles.logCard}>
              <HelpHead title="SESSION LOG" onHelp={() => help('session_log')} style={styles.sectionHead} />
              <Pressable onLongPress={() => help('session_log')} delayLongPress={260}>
              <View style={styles.logRow}>
                <View style={styles.logCell}>
                  <Text style={styles.cellLabel}>Leq(A)</Text>
                  <Text style={styles.cellValue}>{meter ? fmtDb(shown(meter.leqADb)) : '—'}</Text>
                </View>
                <View style={styles.logCell}>
                  <Text style={styles.cellLabel}>Leq(Z)</Text>
                  <Text style={styles.cellValue}>{meter ? fmtDb(shown(meter.leqZDb)) : '—'}</Text>
                </View>
                <View style={styles.logCell}>
                  <Text style={styles.cellLabel}>ELAPSED</Text>
                  <Text style={styles.cellValue}>{meter ? fmtElapsed(meter.elapsedSec) : '—'}</Text>
                </View>
              </View>
              </Pressable>
              <Text style={styles.logNote}>
                Leq = equivalent continuous level over the session · {unitLabel}
              </Text>
              <View style={styles.controls}>
                <Pressable style={styles.ctrlBtn} onPress={resetLeq} accessibilityRole="button" accessibilityLabel="Reset log">
                  <Text style={styles.ctrlText}>RESET LOG</Text>
                </Pressable>
                <Pressable
                  style={[styles.ctrlBtn, justSaved && styles.ctrlBtnSaved, !meter && styles.ctrlBtnDisabled]}
                  onPress={onSaveLog}
                  disabled={!meter}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !meter }}
                  accessibilityLabel="Save log"
                >
                  <Text style={[styles.ctrlText, justSaved && styles.ctrlTextSaved]}>
                    {justSaved ? 'SAVED ✓' : 'SAVE LOG'}
                  </Text>
                </Pressable>
              </View>
            </View>

            <GlassButton label="STOP" tint="orange" onPress={stop} />
          </>
        )}

        {(state === 'idle' || running) && (
          <Pressable
            onPress={() => navigation.navigate('ToolLibrary', { toolKey: 'spl' })}
            accessibilityRole="button"
            accessibilityLabel="View saved measurements"
          >
            <Text style={styles.libraryLink}>VIEW SAVED MEASUREMENTS ›</Text>
          </Pressable>
        )}

        {/* Shared phone-mic honesty copy (spec §1.4) — short footer. */}
        <View style={styles.micLimits}>
          <Text style={styles.sectionHead}>PHONE-MIC LIMITS</Text>
          <Text style={styles.bullet}>
            {'•  '}
            {MIC_LIMITS[0]}
          </Text>
          <Text style={styles.bullet}>
            {'•  '}
            {MIC_LIMITS[4]}
          </Text>
        </View>
      </ScrollView>

      {/* ── Full-screen VU popup: live meters + mirrored readouts/controls ──
          Same state, same handlers — the meter keeps running; nothing here is
          a second copy of the measurement. ✕ (top right) closes. */}
      <Modal
        visible={vuOpen}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setVuOpen(false)}
      >
        <View style={[styles.vuModalRoot, { paddingTop: insets.top + 8 }]}>
          <View style={styles.vuModalHead}>
            <Text style={styles.vuModalTitle}>{`${tool.name.toUpperCase()} · VU`}</Text>
            <Pressable
              onPress={() => setVuOpen(false)}
              hitSlop={14}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Text style={styles.vuClose}>✕</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.vuScroll}>
            <EngineGate state={state} lastError={lastError} />

            {(state === 'idle' || state === 'starting') && (
              <>
                <Text style={styles.intro}>
                  Start the meter to drive the VU. The microphone captures only while the meter
                  runs.
                </Text>
                <GlassButton
                  label={state === 'starting' ? 'STARTING…' : 'START METER'}
                  tint="orange"
                  disabled={state === 'starting'}
                  onPress={() => void start()}
                />
              </>
            )}

            {running &&
              (viz ? (
                <VuHero
                  viz={viz}
                  live={live}
                  dialW={dialW}
                  ledW={ledW}
                  dialH={dialH}
                  holdMode={holdMode}
                  splOffset={splOffset}
                  calibrated={calibrated}
                  levelLabel={dialLevelLabel}
                  levelValue={dialLevelValue}
                  levelUnit={dialLevelUnit}
                  peakValue={dialPeakValue}
                  peakHoldValue={dialPeakHoldValue}
                  peakHot={dialPeakHot}
                  peakHoldHot={dialPeakHoldHot}
                />
              ) : (
                /* Honest gate for pre-Skia clients (§1.7): readouts stay live. */
                <View style={styles.vuUnavailCard}>
                  <Text style={styles.vuUnavailTitle}>SPL DIAL NEEDS THE NEW DEV BUILD</Text>
                  <Text style={styles.vuUnavailBody}>
                    This dev client predates the graphics engine the dial renders on. The digital
                    readouts below are fully live — install the newest dev build to see the needle.
                  </Text>
                </View>
              ))}

            {/* House honesty line: the dial's SPL scale is calibrated-approximate
                at best (and an ESTIMATE when uncalibrated); the sweet-spot band
                is a mixing REFERENCE (C-weighted), not a guarantee. */}
            <Text style={styles.vuBadge}>
              {calibrated
                ? 'DIAL: dB SPL · FIELD-CALIBRATED (APPROXIMATE) — the 79/82/85 dB(C) mix band is a reference, not a guarantee'
                : 'DIAL: ESTIMATED · UNCALIBRATED — SPL numbers are an estimate; calibrate against a real SPL meter for true readings. The mix band is most meaningful once calibrated'}
            </Text>

            {running && (
              <>
                {/* Weighting × response controls (same setters as the screen). */}
                <View style={styles.chipsRow}>
                  <View style={styles.chipGroup}>
                    <Text style={styles.chipGroupLabel}>WEIGHTING</Text>
                    <View style={styles.chipSet}>
                      {WEIGHTINGS.map((w) => (
                        <Chip key={w} label={w} selected={weighting === w} onPress={() => setWeighting(w)} />
                      ))}
                    </View>
                  </View>
                  <View style={styles.chipGroup}>
                    <Text style={styles.chipGroupLabel}>RESPONSE</Text>
                    <View style={styles.chipSet}>
                      {RESPONSES.map((r) => (
                        <Chip key={r} label={r.toUpperCase()} selected={response === r} onPress={() => setResponse(r)} />
                      ))}
                    </View>
                  </View>
                </View>

                {/* PEAK-HOLD user setting (governs the LED cap linger) + RESET
                    PEAK. The peak/level numerals now live in the dial corners. */}
                <View style={styles.chipsRow}>
                  <View style={styles.chipGroup}>
                    <Text style={styles.chipGroupLabel}>PEAK HOLD</Text>
                    <View style={styles.chipSet}>
                      {HOLD_MODES.map((m) => (
                        <Chip key={m} label={holdLabel(m)} selected={holdMode === m} onPress={() => setHoldMode(m)} />
                      ))}
                    </View>
                  </View>
                  <View style={styles.chipGroup}>
                    <Text style={styles.chipGroupLabel}> </Text>
                    <Pressable
                      style={[styles.ctrlBtn, styles.holdResetBtn]}
                      onPress={resetPeakHold}
                      accessibilityRole="button"
                      accessibilityLabel="Reset peak hold"
                    >
                      <Text style={styles.ctrlText}>RESET PEAK</Text>
                    </Pressable>
                  </View>
                </View>

                {/* Field calibration (ruling R1) — same store as the screen, so
                    the dial's SPL scale updates the instant it is set/cleared. */}
                <View style={styles.calCard}>
                  <View style={styles.calHeadRow}>
                    <Text style={styles.sectionHead}>CALIBRATION</Text>
                    <Text style={[styles.calStatus, offset != null && styles.calStatusOn]}>
                      {offset != null ? `FIELD-CALIBRATED · +${offset.toFixed(1)} dB` : 'UNCALIBRATED'}
                    </Text>
                  </View>
                  {!calibrating ? (
                    <View style={styles.controls}>
                      <Pressable
                        style={styles.ctrlBtn}
                        onPress={() => {
                          setDraftOffset(offset ?? 100);
                          setCalibrating(true);
                        }}
                        accessibilityRole="button"
                        accessibilityLabel="Calibrate against a reference meter"
                      >
                        <Text style={styles.ctrlText}>{offset != null ? 'RE-CALIBRATE' : 'CALIBRATE'}</Text>
                      </Pressable>
                      {offset != null && (
                        <Pressable
                          style={styles.ctrlBtn}
                          onPress={() => setSplCalibration(null)}
                          accessibilityRole="button"
                          accessibilityLabel="Clear calibration"
                        >
                          <Text style={styles.ctrlText}>CLEAR</Text>
                        </Pressable>
                      )}
                    </View>
                  ) : (
                    <>
                      <Text style={styles.calHint}>
                        Play steady pink noise and adjust until this reading matches your reference
                        sound-level meter (same weighting and response on both).
                      </Text>
                      <Text style={styles.calDraftValue}>
                        {meter ? fmtDb(shown(selectedLevelDb(meter, weighting, response), true)) : '—'}
                        <Text style={styles.calDraftUnit}>  dB SPL (candidate)</Text>
                      </Text>
                      <View style={styles.controls}>
                        {[-5, -0.5, +0.5, +5].map((step) => (
                          <Pressable
                            key={step}
                            style={styles.ctrlBtn}
                            onPress={() => setDraftOffset((d) => Math.round((d + step) * 2) / 2)}
                            accessibilityRole="button"
                            accessibilityLabel={`Adjust ${step > 0 ? 'up' : 'down'} ${Math.abs(step)} dB`}
                          >
                            <Text style={styles.ctrlText}>{step > 0 ? `+${step}` : step}</Text>
                          </Pressable>
                        ))}
                      </View>
                      <View style={styles.controls}>
                        <Pressable
                          style={styles.ctrlBtn}
                          onPress={() => setCalibrating(false)}
                          accessibilityRole="button"
                          accessibilityLabel="Cancel calibration"
                        >
                          <Text style={styles.ctrlText}>CANCEL</Text>
                        </Pressable>
                        <Pressable
                          style={[styles.ctrlBtn, styles.ctrlBtnSaved]}
                          onPress={() => {
                            setSplCalibration(draftOffset);
                            setCalibrating(false);
                          }}
                          accessibilityRole="button"
                          accessibilityLabel="Set calibration"
                        >
                          <Text style={[styles.ctrlText, styles.ctrlTextSaved]}>SET</Text>
                        </Pressable>
                      </View>
                    </>
                  )}
                  <Text style={styles.calNote}>
                    Field calibration is stored on this device only and stays approximate — it is
                    not a certified instrument calibration.
                  </Text>
                </View>

                {/* Mirrored live quality warnings (same flags as on save). */}
                {flags.map((f) => (
                  <Text key={f} style={styles.liveWarn}>
                    ⚠ {WARNING_INFO[f].message} {WARNING_INFO[f].hint}
                  </Text>
                ))}

                {/* Mirrored session log + save (same handlers). */}
                <View style={styles.logCard}>
                  <Text style={styles.sectionHead}>SESSION LOG</Text>
                  <View style={styles.logRow}>
                    <View style={styles.logCell}>
                      <Text style={styles.cellLabel}>Leq(A)</Text>
                      <Text style={styles.cellValue}>{meter ? fmtDb(shown(meter.leqADb)) : '—'}</Text>
                    </View>
                    <View style={styles.logCell}>
                      <Text style={styles.cellLabel}>Leq(Z)</Text>
                      <Text style={styles.cellValue}>{meter ? fmtDb(shown(meter.leqZDb)) : '—'}</Text>
                    </View>
                    <View style={styles.logCell}>
                      <Text style={styles.cellLabel}>ELAPSED</Text>
                      <Text style={styles.cellValue}>{meter ? fmtElapsed(meter.elapsedSec) : '—'}</Text>
                    </View>
                  </View>
                  <Text style={styles.logNote}>
                    Leq = equivalent continuous level over the session · {unitLabel}
                  </Text>
                  <View style={styles.controls}>
                    <Pressable
                      style={styles.ctrlBtn}
                      onPress={resetLeq}
                      accessibilityRole="button"
                      accessibilityLabel="Reset log"
                    >
                      <Text style={styles.ctrlText}>RESET LOG</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.ctrlBtn, justSaved && styles.ctrlBtnSaved, !meter && styles.ctrlBtnDisabled]}
                      onPress={onSaveLog}
                      disabled={!meter}
                      accessibilityRole="button"
                      accessibilityState={{ disabled: !meter }}
                      accessibilityLabel="Save log"
                    >
                      <Text style={[styles.ctrlText, justSaved && styles.ctrlTextSaved]}>
                        {justSaved ? 'SAVED ✓' : 'SAVE LOG'}
                      </Text>
                    </Pressable>
                  </View>
                </View>

                <GlassButton
                  label="STOP"
                  tint="orange"
                  onPress={() => {
                    stop();
                    setVuOpen(false);
                  }}
                />
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
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

  // Weighting / response chips.
  chipsRow: { flexDirection: 'row', gap: 12 },
  chipGroup: { flex: 1, gap: 6 },
  chipGroupLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.textSub },
  chipSet: { flexDirection: 'row', gap: 8 },
  chip: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    backgroundColor: '#161616',
    paddingVertical: 10,
    alignItems: 'center',
  },
  chipSelected: { borderColor: 'rgba(255,138,30,.65)', backgroundColor: '#1a1207' },
  chipText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1, color: colors.textSecondary },
  chipTextSelected: { color: colors.orange },

  // Big readout card.
  readoutCard: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 6,
  },
  readoutEyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.6, color: colors.amberLabel },
  readoutValue: { fontFamily: fonts.mono, fontSize: 58, color: colors.textPrimary, letterSpacing: 1 },
  readoutSub: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.amber },

  // Peak row.
  peakRow: { flexDirection: 'row', gap: 10, alignItems: 'stretch' },
  peakCell: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 4,
  },
  cellLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.textSub },
  cellValue: { fontFamily: fonts.mono, fontSize: 20, color: colors.textPrimary },
  cellValueHot: { color: colors.red },

  // Session log card.
  logCard: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    padding: 14,
    gap: 10,
  },
  sectionHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.8, color: colors.amberLabel },
  logRow: { flexDirection: 'row', gap: 10 },
  logCell: { flex: 1, gap: 4 },
  logNote: { fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 17, color: colors.textMuted },

  // Controls (house ctrl-button style).
  controls: { flexDirection: 'row', gap: 12 },
  ctrlBtn: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    backgroundColor: '#161616',
    paddingVertical: 14,
    alignItems: 'center',
  },
  ctrlBtnSmall: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    backgroundColor: '#161616',
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctrlBtnSaved: { borderColor: 'rgba(91,255,133,.65)', backgroundColor: '#0d1710' },
  ctrlBtnDisabled: { opacity: 0.45 },
  ctrlText: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 14,
    letterSpacing: 1.4,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  ctrlTextSaved: { color: '#5bff85' },

  // Live quality warning line (spec §6) — house amber warning style.
  liveWarn: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18.5, color: colors.amber },

  // Field-calibration card (ruling R1, 2026-07-23).
  calCard: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    padding: 14,
    gap: 10,
  },
  calHeadRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  calStatus: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 1.2, color: colors.textSub },
  calStatusOn: { color: '#5bff85' },
  calHint: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 19, color: colors.textSecondary },
  calDraftValue: { fontFamily: fonts.mono, fontSize: 30, color: colors.textPrimary, textAlign: 'center' },
  calDraftUnit: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.amber },
  calNote: { fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 17, color: colors.textMuted },

  libraryLink: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 12,
    letterSpacing: 1.4,
    color: '#4dd0e1',
    textAlign: 'center',
  },

  micLimits: { gap: 6, marginTop: 6 },
  bullet: { fontFamily: fonts.barlowRegular, fontSize: 14.5, lineHeight: 21, color: colors.textSecondary },

  // Mini-VU opener (header, right-aligned) + plain-RN fallback glyph.
  vuOpenBtn: { marginLeft: 'auto', alignItems: 'center', gap: 1, paddingHorizontal: 4, paddingVertical: 2 },
  vuOpenLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 9, letterSpacing: 1.6, color: colors.textSub },
  vuGlyphFace: {
    width: 38,
    height: 30,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#1b1c22',
    backgroundColor: '#f0e0b4',
    overflow: 'hidden',
  },
  vuGlyphArc: {
    position: 'absolute',
    left: 5,
    right: 5,
    top: 6,
    height: 14,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderTopWidth: 2,
    borderColor: '#2b2317',
  },
  vuGlyphRed: { position: 'absolute', right: 5, top: 4, width: 8, height: 4, backgroundColor: '#c9382e', transform: [{ rotate: '24deg' }] },
  vuGlyphNeedle: {
    position: 'absolute',
    left: 16,
    bottom: 2,
    width: 2,
    height: 20,
    backgroundColor: '#17130c',
    transform: [{ rotate: '14deg' }],
  },

  // Full-screen VU popup.
  vuModalRoot: { flex: 1, backgroundColor: '#0c0c0f' },
  vuModalHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  vuModalTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, letterSpacing: 1.6, color: colors.textPrimary },
  vuClose: { fontFamily: fonts.oswaldSemiBold, fontSize: 22, color: colors.textSecondary, padding: 4 },
  vuScroll: { padding: 16, paddingBottom: 40, gap: 14, alignItems: 'stretch' },
  // Side-by-side hero: circular SPL dial (left) + thin LED meter (right).
  heroRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', justifyContent: 'center' },
  holdResetBtn: { flex: 0, paddingHorizontal: 16, justifyContent: 'center' },
  vuBadge: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 9,
    letterSpacing: 1,
    lineHeight: 13,
    color: colors.textSub,
  },
  vuUnavailCard: {
    gap: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    padding: 14,
  },
  vuUnavailTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 1.2, color: colors.textSecondary },
  vuUnavailBody: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18, color: colors.textSub },
});
