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
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Crypto from 'expo-crypto';
import { GlassButton } from '../../components/GlassButton';
import { meterWarningFlags, useDspEngine } from '../../features/tools/engine/useDspEngine';
import { setSplCalibration, useSplCalibration } from '../../features/tools/measure/calibrationStore';
import { saveMeasurement } from '../../features/tools/measure/measurementStore';
import { evaluateQuality } from '../../features/tools/measure/quality';
import { WARNING_INFO, type SplLogPayload } from '../../features/tools/measure/types';
import { colors, fonts } from '../../theme/tokens';
import { EngineGate } from './EngineGate';
import { MIC_LIMITS, toolByKey } from './toolsData';
import type { MeterFrame } from '../../../modules/ape-dsp';
import { useToolHelp, HelpHead } from '../../features/lab/guidedLessons';
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
  const { help, sheet } = useToolHelp('spl');
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
              <View style={styles.peakCell}>
                <Text style={styles.cellLabel}>PEAK (dBFS)</Text>
                <Text style={[styles.cellValue, meter != null && meter.peakDb >= 0 && styles.cellValueHot]}>
                  {meter ? fmtDb(meter.peakDb) : '—'}
                </Text>
              </View>
              <View style={styles.peakCell}>
                <Text style={styles.cellLabel}>PEAK HOLD (dBFS)</Text>
                <Text style={[styles.cellValue, meter != null && meter.peakHoldDb >= 0 && styles.cellValueHot]}>
                  {meter ? fmtDb(meter.peakHoldDb) : '—'}
                </Text>
              </View>
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
});
