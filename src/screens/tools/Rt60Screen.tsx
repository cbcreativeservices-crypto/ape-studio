/**
 * Rt60Screen — RT60 / Reverb Decay guided capture (engine build, spec of
 * record docs/APE_AUDIO_TOOLS_SPEC_2026_07_23.md §13; staged rollout: this is
 * the "simple live decay estimator" stage — Decay + Bands views over the
 * golden-tested native analysis; the fuller impulse/marker views come later).
 *
 * Flow: START capture → ARM → make a loud short sound (clap / balloon pop) →
 * the native engine triggers at ~−35 dBFS, records 3.5 s, analyzes per octave
 * band (Schroeder → EDT/T20/T30 fits), lands DONE → results render here.
 *
 * INTEGRITY (the whole point of this tool, spec §13 + review 2026-07-23):
 *  - Every RT60 value is labeled with ITS method (T20/T30) and ITS fit's R² —
 *    per band, live and in the saved record.
 *  - A band without enough decay range shows INSUFFICIENT RANGE; a band whose
 *    fit ran but was too poor shows UNSTABLE FIT — never a fabricated number,
 *    and an invalid capture can never be SAVED under a method label.
 *  - Warning flags are scoped to THE ARMED CAPTURE WINDOW (clipping etc. are
 *    baselined at arm), so a clipped first take can't poison a clean re-take.
 *  - A DONE result is retained on screen until RE-ARM — capture restarts
 *    (library round-trip, route change, watchdog) can't silently destroy it.
 *
 * Visual pass 2026-07-29 (standards rule 2 — abstract data styled, never
 * hairline-on-black; measurement flow and native calls untouched): the decay
 * curve gets a glow stroke + gradient underfill inside a plot frame, the
 * −5/−25/−35 fit-region markers render as dashed amber, the RT60 headline is
 * a house instrument readout (mono digits, glow), octave-band results are lit
 * vs pending cells, and the armed/recording panel carries a status lamp and a
 * live input-level bar (the SAME meter value already printed below it).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, Line, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Crypto from 'expo-crypto';
import { ApeDsp, type Rt60Band, type Rt60Frame } from '../../../modules/ape-dsp';
import { GlassButton } from '../../components/GlassButton';
import { meterWarningFlags, useDspEngine } from '../../features/tools/engine/useDspEngine';
import { saveMeasurement } from '../../features/tools/measure/measurementStore';
import { evaluateQuality } from '../../features/tools/measure/quality';
import { WARNING_INFO, type WarningFlag } from '../../features/tools/measure/types';
import { colors, fonts } from '../../theme/tokens';
import { EngineGate } from './EngineGate';
import { useToolHelp, HelpHead, DisplayGuideButton } from '../../features/lab/guidedLessons';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Rt60Live'>;

const RT60_POLL_MS = 300;
const CURVE_W = 320;
const CURVE_H = 150;
const CURVE_FLOOR_DB = -60;
/** Native T20 range gate (Rt60.hpp): past this, invalid means the fit RAN but
 *  its R² missed the >0.90 quality bar — a different failure than range. */
const T20_RANGE_DB = 35;

// Visual standards 2026-07-29 rule 2 — chart chrome. Copied locally from the
// fxViz grammar (shared idiom, not a cross-feature import).
const PLOT_BG = '#0c0c0f';
const PLOT_FRAME = '#262b36';
const DECAY_GREEN = '#5bff85'; // measured decay trace (house green)
const TICK_TEXT = '#8f8f8f';

/** §13 discipline lines — always visible with results (spec Required warnings). */
const DISCIPLINE = [
  'RT60 varies by frequency band.',
  'Results are extrapolated from T20 or T30 line fits.',
  'Repeat measurements from multiple positions — one position is not the room.',
  'A hand clap may not provide reliable measurement conditions; a balloon pop or clapper excites the room more evenly.',
];

const fmtSec = (s: number) => (s > 0 ? `${s.toFixed(2)} s` : '—');

/** The fit that actually produced a band's reported value (§13: label it). */
const fitOf = (b: Rt60Band): 'T30' | 'T20' | null =>
  b.t30Rt60Sec > 0 ? 'T30' : b.t20Rt60Sec > 0 ? 'T20' : null;
/** R² of THAT fit (never the other method's — review 2026-07-23). */
const fitR2 = (b: Rt60Band): number => (b.t30Rt60Sec > 0 ? b.t30R2 : b.t20R2);
/** Invalid because the fit ran but was too poor (vs insufficient range). */
const poorFit = (b: Rt60Band): boolean => !b.valid && b.decayRangeDb > T20_RANGE_DB;

/** Broadband Schroeder decay curve (0 → −60 dB window): glow-stroked trace
 *  with a gradient underfill, dashed-amber −5/−25/−35 fit-region markers
 *  (T20 reads −5→−25, T30 −5→−35), plot frame behind. Same real curve, same
 *  downsample, same caption — 2026-07-29 restyle only. */
function DecayCurve({ curveDb, stepSec }: { curveDb: number[]; stepSec: number }) {
  const { linePath, fillPath } = useMemo(() => {
    if (curveDb.length < 2) return { linePath: '', fillPath: '' };
    // Downsample to ≤160 points for the path (ceil so the cap holds).
    const stride = Math.max(1, Math.ceil(curveDb.length / 160));
    let d = '';
    let lastX = 0;
    for (let i = 0; i < curveDb.length; i += stride) {
      const x = (i / (curveDb.length - 1)) * CURVE_W;
      const db = Math.max(CURVE_FLOOR_DB, Math.min(0, curveDb[i]));
      const y = (db / CURVE_FLOOR_DB) * CURVE_H;
      d += `${d ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
      lastX = x;
    }
    return { linePath: d, fillPath: `${d}L${lastX.toFixed(1)} ${CURVE_H - 1} L1 ${CURVE_H - 1}Z` };
  }, [curveDb]);
  const totalSec = curveDb.length * stepSec;
  const yFor = (db: number) => (db / CURVE_FLOOR_DB) * CURVE_H;

  return (
    <View style={styles.curvePanel}>
      <Svg width="100%" height={CURVE_H + 18} viewBox={`0 0 ${CURVE_W} ${CURVE_H + 18}`}>
        <Defs>
          <LinearGradient id="rt60DecayFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={DECAY_GREEN} stopOpacity={0.26} />
            <Stop offset="1" stopColor={DECAY_GREEN} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        {/* Plot frame — rounded panel + hairline (shared chart chrome). */}
        <Rect x={0} y={0} width={CURVE_W} height={CURVE_H} rx={8} fill={PLOT_BG} />
        <Rect
          x={0.5}
          y={0.5}
          width={CURVE_W - 1}
          height={CURVE_H - 1}
          rx={7.5}
          stroke={PLOT_FRAME}
          strokeWidth={1}
          fill="none"
        />
        {/* Fit-region markers: −5 / −25 / −35 dB (T20/T30 bounds) — dashed amber. */}
        {[-5, -25, -35].map((db) => (
          <Line
            key={db}
            x1={2}
            y1={yFor(db)}
            x2={CURVE_W - 2}
            y2={yFor(db)}
            stroke={colors.amber}
            strokeOpacity={0.45}
            strokeWidth={0.9}
            strokeDasharray="5 4"
          />
        ))}
        {[-5, -25, -35].map((db) => (
          <SvgText
            key={`t${db}`}
            x={CURVE_W - 5}
            y={yFor(db) - 3}
            fontSize={8}
            fontFamily={fonts.mono}
            fill={colors.amberLabel}
            textAnchor="end"
          >
            {db} dB
          </SvgText>
        ))}
        {/* Measured decay: gradient underfill, then glow halo + crisp core. */}
        {fillPath ? <Path d={fillPath} fill="url(#rt60DecayFill)" /> : null}
        {linePath ? (
          <>
            <Path
              d={linePath}
              fill="none"
              stroke={DECAY_GREEN}
              strokeWidth={5.5}
              strokeOpacity={0.18}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d={linePath}
              fill="none"
              stroke={DECAY_GREEN}
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        ) : null}
        <SvgText x={2} y={CURVE_H + 13} fontSize={8} fontFamily={fonts.mono} fill={TICK_TEXT}>
          0 s
        </SvgText>
        <SvgText
          x={CURVE_W - 2}
          y={CURVE_H + 13}
          fontSize={8}
          fontFamily={fonts.mono}
          fill={TICK_TEXT}
          textAnchor="end"
        >
          {totalSec.toFixed(1)} s
        </SvgText>
      </Svg>
      <Text style={styles.curveCaption}>
        Broadband Schroeder decay (0 to −60 dB window). The T20 fit reads −5→−25 dB; T30 reads
        −5→−35 dB — both extrapolate to the 60 dB decay time. Visible late energy may include
        noise.
      </Text>
    </View>
  );
}

export function Rt60Screen({ navigation }: Props) {
  const { help, helpAll, sheet } = useToolHelp('rt60');
  const insets = useSafeAreaInsets();
  const { state, frames, start, stop, lastError } = useDspEngine({}, { meter: true });
  const [rt60, setRt60] = useState<Rt60Frame | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (savedTimer.current) clearTimeout(savedTimer.current);
    },
    [],
  );

  const meter = frames.meter;

  // ---- Capture-window warning flags (review 2026-07-23) ----
  // clipRuns is SESSION-cumulative in the engine (reset only on capture start),
  // so a clipped first take or a stray loud sound must not poison a clean
  // re-armed capture: baseline the counter at ARM and latch conditions that
  // occur while armed/recording. The latched set is what DONE shows and SAVE
  // stores — the flags describe THE CAPTURE, not the whole session.
  const clipBaseRef = useRef(0);
  const [windowFlags, setWindowFlags] = useState<WarningFlag[]>([]);

  // Poll the native RT60 state machine while capture runs (slow — 3.3 Hz).
  // A DONE result is RETAINED until RE-ARM: every capture (re)start (library
  // round-trip → blur teardown → new START, watchdog stall restart, route
  // change) resets the native machine to Off, which would otherwise silently
  // destroy an unsaved analysis. The retained frame is a completed analysis,
  // never stale live data (the bridge fills bands only at state 3).
  useEffect(() => {
    if (state !== 'running') {
      setRt60((prev) => (prev?.state === 3 ? prev : null));
      return;
    }
    const t = setInterval(() => {
      const f = ApeDsp.getRt60Frame();
      setRt60((prev) => (f && f.state === 0 && prev?.state === 3 ? prev : f));
    }, RT60_POLL_MS);
    return () => clearInterval(t);
  }, [state]);

  const rtState = rt60?.state ?? 0; // 0 off · 1 armed · 2 recording · 3 done
  const bands = rt60?.bands ?? [];
  const broadband = bands.find((b) => b.bandHz === 0);
  const octaves = bands.filter((b) => b.bandHz > 0);
  const showResults = rtState === 3 && broadband != null;

  // Latch capture-window conditions while armed/recording.
  useEffect(() => {
    if ((rtState !== 1 && rtState !== 2) || !meter) return;
    setWindowFlags((prev) => {
      const next = [...prev];
      if (meter.clipRuns > clipBaseRef.current && !next.includes('input_clipping'))
        next.push('input_clipping');
      for (const f of meterWarningFlags(meter))
        if (f !== 'input_clipping' && !next.includes(f)) next.push(f);
      return next.length === prev.length ? prev : next;
    });
  }, [meter, rtState]);

  /** ARM / RE-ARM: baseline the window, ensure capture is running, arm native. */
  const armCapture = useCallback(async () => {
    if (state !== 'running') await start(); // returning from the library etc.
    clipBaseRef.current = ApeDsp.getMeterFrame()?.clipRuns ?? 0;
    setWindowFlags([]);
    setRt60(null); // drop a retained DONE — the user chose to re-measure
    ApeDsp.rt60Arm();
  }, [state, start]);

  // STOP must not collapse the guided panel back to the intro card (that jumps
  // the scroll). Hold the panel mounted via micPaused; the button toggles
  // START/STOP in place. Cleared once we're truly running again.
  const [micPaused, setMicPaused] = useState(false);
  useEffect(() => {
    if (state === 'running') setMicPaused(false);
  }, [state]);
  const onStart = useCallback(() => {
    setMicPaused(false);
    void start();
  }, [start]);
  const onStop = useCallback(() => {
    setMicPaused(true);
    stop();
  }, [stop]);

  /** Final flag set: the capture window's conditions + the engine's verdict. */
  const flags = useMemo<WarningFlag[]>(() => {
    const f = [...windowFlags];
    if (!f.includes('uncalibrated_input')) f.push('uncalibrated_input'); // phone mic (§6 table)
    if (showResults && broadband && !broadband.valid)
      f.push(poorFit(broadband) ? 'unstable_measurement' : 'insufficient_decay_range');
    else if (showResults && broadband && broadband.decayRangeDb < 45)
      f.push('high_noise_floor'); // T30 range not met — background noise limits the tail
    return f;
  }, [windowFlags, showResults, broadband]);

  const headlineMethod = broadband && broadband.valid ? fitOf(broadband) : null;

  const onSave = () => {
    // §13 integrity: a disavowed capture is never saved under a method label.
    if (!rt60 || !showResults || !broadband || !broadband.valid) return;
    const method = fitOf(broadband);
    if (method == null) return; // no fit ran — nothing honest to save
    // Downsample the stored curve to ≤200 numeric points (ceil so the cap holds).
    const stride = Math.max(1, Math.ceil(rt60.curveDb.length / 200));
    const decayDb = rt60.curveDb.filter((_, i) => i % stride === 0);
    saveMeasurement({
      id: Crypto.randomUUID(),
      tool_type: 'rt60',
      created_at: new Date().toISOString(),
      title: `RT60 ${fmtSec(method === 'T30' ? broadband.t30Rt60Sec : broadband.t20Rt60Sec)} · ${method}`,
      notes: '',
      input_device: 'phone microphone',
      calibration_status: 'uncalibrated',
      sample_rate: ApeDsp.getInfo()?.sampleRate ?? null,
      measurement_settings: {
        method,
        bands: 'octave 125 Hz – 4 kHz',
        trigger_dbfs: -35,
        capture_sec: 3.5,
      },
      quality_state: evaluateQuality(flags),
      warning_flags: flags,
      data_payload: {
        kind: 'impulse_response',
        method,
        // Per-band method + that fit's R² (§13 "always labeled", per band).
        perBand: octaves.map((b) => ({
          bandHz: b.bandHz,
          rt60Sec: b.valid ? (b.t30Rt60Sec > 0 ? b.t30Rt60Sec : b.t20Rt60Sec) : null,
          method: b.valid ? fitOf(b) : null,
          confidence: b.valid ? fitR2(b) : b.r2,
        })),
        noiseFloorDb: broadband.decayRangeDb > 0 ? -broadband.decayRangeDb : null,
        decayDb,
        decayStepSec: rt60.curveStepSec * stride,
      },
    });
    setJustSaved(true);
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setJustSaved(false), 1800);
  };

  /** Input-level bar geometry (armed/recording panel): the SAME zFastDb value
   *  printed in the line below it, mapped −60…0 dBFS → 0…100% — a visual of
   *  an existing readout, not a new measurement. */
  const levelPct = meter ? Math.max(0, Math.min(100, ((meter.zFastDb + 60) / 60) * 100)) : 0;
  const TRIGGER_PCT = ((-35 + 60) / 60) * 100; // the ~−35 dBFS arm trigger

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={{ flexShrink: 1 }}>
          <Text style={styles.title}>RT60 / REVERB DECAY</Text>
          <Text style={styles.subtitle}>Guided decay capture · octave bands</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {state === 'absent' || state === 'spike' || state === 'denied' || state === 'error' ? (
          <EngineGate state={state} lastError={lastError} />
        ) : showResults && broadband ? (
          <>
            {/* Headline — method + ITS fit's R², always labeled (spec §13).
                House instrument readout: framed panel, mono digits, glow. */}
            <Pressable style={styles.readout} onLongPress={() => help('rt60')} delayLongPress={260}>
              <Text style={styles.readoutEyebrow}>BROADBAND DECAY</Text>
              <Text style={[styles.readoutValue, !broadband.valid && styles.readoutInvalid]}>
                {broadband.valid
                  ? fmtSec(headlineMethod === 'T30' ? broadband.t30Rt60Sec : broadband.t20Rt60Sec)
                  : 'INVALID'}
              </Text>
              <Text style={styles.readoutMethod}>
                {broadband.valid
                  ? `RT60 · ${headlineMethod} fit · R² ${fitR2(broadband).toFixed(2)}`
                  : poorFit(broadband)
                    ? `unstable decay fit — R² ${broadband.r2.toFixed(2)} (needs > 0.90) — do not trust this capture`
                    : 'insufficient decay range — do not trust this capture'}
              </Text>
            </Pressable>

            {state !== 'running' && (
              <Text style={styles.stoppedNote}>
                Capture is stopped — this result is retained until you re-arm. RE-ARM restarts the
                microphone.
              </Text>
            )}

            {rt60 && rt60.curveDb.length > 1 && (
              <DecayCurve curveDb={rt60.curveDb} stepSec={rt60.curveStepSec} />
            )}
            <DisplayGuideButton onPress={helpAll} />

            {/* Octave bands (spec §13 View 3): per-band method labels, honest
                gaps — lit cells for valid fits, dim pending cells otherwise. */}
            <HelpHead title="OCTAVE BANDS" onHelp={() => help('band')} style={styles.groupHead} />
            <Pressable onLongPress={() => help('band')} delayLongPress={260}>
            <View style={styles.bandTable}>
              <View style={styles.bandRowHead}>
                <Text style={[styles.bandCellHead, { flex: 1.2 }]}>BAND</Text>
                <Text style={styles.bandCellHead}>RT60</Text>
                <Text style={styles.bandCellHead}>EDT</Text>
                <Text style={styles.bandCellHead}>R²</Text>
              </View>
              {octaves.map((b) => {
                const tag = fitOf(b);
                const lit = b.valid && tag != null;
                const v = lit && tag ? (tag === 'T30' ? b.t30Rt60Sec : b.t20Rt60Sec) : 0;
                return (
                  <View key={b.bandHz} style={[styles.bandRow, lit ? styles.bandRowLit : styles.bandRowDim]}>
                    <Text style={[styles.bandCell, { flex: 1.2, color: colors.textPrimary }]}>
                      {b.bandHz >= 1000 ? `${b.bandHz / 1000} kHz` : `${b.bandHz} Hz`}
                    </Text>
                    {lit && tag ? (
                      <>
                        <Text style={[styles.bandCell, styles.bandCellLit]}>
                          {fmtSec(v)} <Text style={styles.bandTag}>{tag}</Text>
                        </Text>
                        <Text style={styles.bandCell}>{b.edtSec > 0 ? fmtSec(b.edtSec) : '—'}</Text>
                        <Text style={styles.bandCell}>{fitR2(b).toFixed(2)}</Text>
                      </>
                    ) : (
                      <Text style={[styles.bandCell, styles.bandInvalid, { flex: 3 }]}>
                        {poorFit(b)
                          ? `unstable fit (R² ${b.r2.toFixed(2)})`
                          : `insufficient range (${b.decayRangeDb.toFixed(0)} dB available)`}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
            </Pressable>

            <View style={styles.controls}>
              <View style={{ flex: 1 }}>
                <GlassButton label="RE-ARM" tint="green" height={46} fontSize={14} onPress={() => void armCapture()} />
              </View>
              <View style={{ flex: 1 }}>
                <GlassButton
                  label={justSaved ? 'SAVED ✓' : 'SAVE'}
                  tint="steel"
                  height={46}
                  fontSize={14}
                  disabled={!broadband.valid}
                  onPress={onSave}
                />
              </View>
            </View>
            {!broadband.valid && (
              <Text style={styles.saveNote}>
                Invalid captures can't be saved — re-arm and repeat with a louder excitation or a
                quieter room.
              </Text>
            )}
            <Pressable
              onPress={() => navigation.navigate('ToolLibrary', { toolKey: 'rt60' })}
              accessibilityRole="button"
              accessibilityLabel="View saved measurements"
            >
              <Text style={styles.libraryLink}>VIEW SAVED MEASUREMENTS ›</Text>
            </Pressable>

            {/* Capture-window + verdict warnings (spec §6) — same set SAVE stores. */}
            {flags.map((f) => (
              <Text key={f} style={styles.liveWarn}>
                ⚠ {WARNING_INFO[f].message} {WARNING_INFO[f].hint}
              </Text>
            ))}
            <View style={styles.disciplineCard}>
              {DISCIPLINE.map((d) => (
                <Text key={d} style={styles.disciplineLine}>
                  •  {d}
                </Text>
              ))}
            </View>
          </>
        ) : state !== 'running' && !micPaused ? (
          <>
            <Text style={styles.intro}>
              Measure how long sound takes to decay in this room, per octave band. You will make a
              loud, short sound — the engine triggers automatically, records 3.5 seconds, and fits
              the decay. Get the phone away from soft surfaces and hold still during the capture.
            </Text>
            <GlassButton
              label={state === 'starting' ? 'STARTING…' : 'START'}
              tint="green"
              height={52}
              onPress={onStart}
            />
          </>
        ) : (
          <>
            {/* Armed / recording guidance — status lamp + live level bar. */}
            <View style={[styles.stagePanel, rtState === 2 && styles.stagePanelHot]}>
              <View style={styles.stageTitleRow}>
                <View
                  style={[
                    styles.stageDot,
                    rtState === 2 ? styles.stageDotHot : rtState === 1 ? styles.stageDotArmed : null,
                  ]}
                />
                <Text style={styles.stageTitle}>
                  {rtState === 2 ? 'RECORDING — HOLD STILL' : rtState === 1 ? 'ARMED — MAKE THE SOUND' : 'READY'}
                </Text>
              </View>
              <Text style={styles.stageBody}>
                {rtState === 2
                  ? 'Capturing 3.5 seconds of decay. Keep quiet and keep the phone still.'
                  : rtState === 1
                    ? 'Clap hard, pop a balloon, or use a clapper — one loud, SHORT sound. Recording starts by itself at the trigger (about −35 dBFS).'
                    : 'Arm the capture, then make one loud, short sound.'}
              </Text>
              {meter && (
                <>
                  <View style={styles.levelTrack}>
                    <View
                      style={[
                        styles.levelFill,
                        rtState === 2 && styles.levelFillHot,
                        { width: `${levelPct}%` },
                      ]}
                    />
                    {/* ~−35 dBFS trigger mark (the value the copy states). */}
                    <View style={[styles.levelTrigger, { left: `${TRIGGER_PCT}%` }]} />
                  </View>
                  <Text style={styles.levelLine}>
                    input level {meter.zFastDb.toFixed(1)} dBFS · uncalibrated approximate
                  </Text>
                </>
              )}
            </View>
            <View style={styles.controls}>
              {rtState === 1 || rtState === 2 ? (
                <View style={{ flex: 1 }}>
                  <GlassButton label="CANCEL" tint="steel" height={46} fontSize={14} onPress={() => ApeDsp.rt60Cancel()} />
                </View>
              ) : (
                <View style={{ flex: 1 }}>
                  <GlassButton label="ARM CAPTURE" tint="green" height={46} fontSize={14} onPress={() => void armCapture()} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <GlassButton
                  label={state === 'running' ? 'STOP' : 'START'}
                  tint="steel"
                  height={46}
                  fontSize={14}
                  onPress={state === 'running' ? onStop : onStart}
                />
              </View>
            </View>

            {/* Conditions latched for THIS capture window (spec §6). */}
            {windowFlags.map((f) => (
              <Text key={f} style={styles.liveWarn}>
                ⚠ {WARNING_INFO[f].message} {WARNING_INFO[f].hint}
              </Text>
            ))}
            <View style={styles.disciplineCard}>
              {DISCIPLINE.map((d) => (
                <Text key={d} style={styles.disciplineLine}>
                  •  {d}
                </Text>
              ))}
            </View>
          </>
        )}
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
  scroll: { padding: 16, paddingBottom: 28, gap: 12 },

  intro: { fontFamily: fonts.barlowRegular, fontSize: 15, lineHeight: 22, color: colors.textSecondary },

  stagePanel: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(91,255,133,.45)',
    backgroundColor: '#0d1710',
    padding: 16,
    gap: 8,
  },
  stagePanelHot: { borderColor: 'rgba(255,141,122,.6)', backgroundColor: '#1c0f0b' },
  stageTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stageDot: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: '#3a3f3a' },
  stageDotArmed: {
    backgroundColor: '#5bff85',
    shadowColor: '#5bff85',
    shadowOpacity: 0.9,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  stageDotHot: {
    backgroundColor: '#ff6b5e',
    shadowColor: '#ff6b5e',
    shadowOpacity: 0.9,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  stageTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 1.6, color: colors.textPrimary },
  stageBody: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19.5, color: colors.textSecondary },

  // Live input-level bar — a visual of the zFastDb readout printed below it.
  levelTrack: {
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#101216',
    borderWidth: 1,
    borderColor: '#22262e',
    overflow: 'hidden',
  },
  levelFill: { height: '100%', borderRadius: 3.5, backgroundColor: 'rgba(91,255,133,.75)' },
  levelFillHot: { backgroundColor: 'rgba(255,141,122,.8)' },
  levelTrigger: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: 'rgba(255,198,77,.85)',
  },
  levelLine: { fontFamily: fonts.mono, fontSize: 12, color: colors.textSub },

  // Headline instrument readout (2026-07-29 restyle — same values/labels).
  readout: {
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  readoutEyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.8, color: colors.amberLabel },
  readoutValue: {
    fontFamily: fonts.mono,
    fontSize: 44,
    color: '#5bff85',
    letterSpacing: 1,
    textShadowColor: 'rgba(91,255,133,.45)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },
  readoutInvalid: {
    color: '#ff8d7a',
    fontSize: 30,
    textShadowColor: 'rgba(255,141,122,.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  readoutMethod: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 11,
    letterSpacing: 1.4,
    color: colors.textSub,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  stoppedNote: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 18, color: colors.textMuted, textAlign: 'center' },
  saveNote: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 18, color: colors.textMuted, textAlign: 'center' },

  curvePanel: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#0e0e10',
    padding: 10,
    gap: 6,
  },
  curveCaption: { fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 17, color: colors.textMuted },

  groupHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.8, color: colors.amberLabel, marginTop: 2 },
  bandTable: { borderRadius: 10, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#131316', overflow: 'hidden' },
  bandRowHead: { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#0e0e10' },
  bandCellHead: { flex: 1, fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 1.2, color: colors.textSub },
  bandRow: {
    flexDirection: 'row',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: '#1c1c20',
    borderLeftWidth: 3,
  },
  // Lit vs pending cells (2026-07-29): valid fits carry the green rail + tint;
  // invalid bands stay dim with their honest reason line.
  bandRowLit: { borderLeftColor: 'rgba(91,255,133,.55)', backgroundColor: 'rgba(91,255,133,.04)' },
  bandRowDim: { borderLeftColor: '#26262c' },
  bandCell: { flex: 1, fontFamily: fonts.mono, fontSize: 12.5, color: colors.textSecondary },
  bandCellLit: { color: '#5bff85' },
  bandTag: { fontFamily: fonts.oswaldSemiBold, fontSize: 9, color: colors.amberLabel },
  bandInvalid: { color: '#8a8a8a', fontStyle: 'italic', fontFamily: fonts.barlowRegular },

  controls: { flexDirection: 'row', gap: 12 },
  libraryLink: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.4, color: '#4dd0e1', textAlign: 'center' },

  liveWarn: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18.5, color: colors.amber },

  disciplineCard: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#111113',
    padding: 12,
    gap: 6,
    marginTop: 2,
  },
  disciplineLine: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 18, color: colors.textSub },
});
