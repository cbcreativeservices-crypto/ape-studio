/**
 * FrequencyCounterScreen — Frequency Counter & Tuner (user request 2026-07-18;
 * merged with the Tuner per the spec of record 2026-07-23 — the counter and
 * tuner share ~90% of one frequency-estimation engine). Four modes:
 *   Sound       — mic estimate of a steady tone's frequency (needs the engine)
 *   Light Pulse — camera estimate of a flicker rate (needs the engine + more
 *                 device testing; shipped later per the recommendation)
 *   Tap         — tap along with a repeating event; frequency/tempo computed
 *                 purely from tap TIMING, so it needs no mic/camera/DSP and is
 *                 LIVE now (built first, as recommended).
 *   Tuner       — musical interpretation of the detected frequency: note,
 *                 octave, cents vs a selectable A4 reference (needs the engine's
 *                 pitch detection — autocorrelation/YIN per the spec).
 *
 * Integrity: Sound, Light and Tuner show an honest "measurement engine in
 * development" state — no simulated meters (tools spec §1.7). Tap shows REAL
 * values derived from the user's own taps, so it is not a fake meter.
 *
 * Results (Tap): frequency (Hz), events/sec, period (ms), BPM, stability, and
 * the min/max readings, with Reset + Hold controls.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Crypto from 'expo-crypto';
import { GlassButton } from '../../components/GlassButton';
import { useToolUsage } from '../../features/tools/telemetry';
import { useDspEngine } from '../../features/tools/engine/useDspEngine';
import { saveMeasurement } from '../../features/tools/measure/measurementStore';
import { evaluateQuality } from '../../features/tools/measure/quality';
import { WARNING_INFO, type WarningFlag } from '../../features/tools/measure/types';
import { colors, fonts } from '../../theme/tokens';
import { EngineGate } from './EngineGate';
import { ENGINE_NOTE } from './toolsData';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'FrequencyCounter'>;

type Mode = 'sound' | 'light' | 'tap' | 'tuner';

/** Required disclaimer, shown on the tool (user-provided 2026-07-18). */
const DISCLAIMER =
  'Measurements are estimates based on your device’s microphone, camera, sensors, and processing ' +
  'capabilities. This tool is intended for education and general troubleshooting, not calibrated ' +
  'laboratory measurement.';

const MODES: { key: Mode; name: string; blurb: string }[] = [
  { key: 'sound', name: 'Sound', blurb: 'Use the microphone to estimate the frequency of a steady sound.' },
  { key: 'light', name: 'Light Pulse', blurb: 'Use the camera to estimate the repetition rate of a flashing or flickering light.' },
  { key: 'tap', name: 'Tap', blurb: 'Tap along with a repeating sound, light, or event to calculate its frequency and tempo.' },
  // Tuner mode (merged tool, spec 2026-07-23): same engine, musical interpretation.
  { key: 'tuner', name: 'Tuner', blurb: 'Interpret a sustained note musically — note name, octave, and cents against a selectable A4 reference.' },
];

// A long pause starts a fresh measurement; only the most recent taps average in.
const TAP_RESET_GAP_MS = 2500;
const MAX_TAPS = 16;

type TapStats = {
  freq: number; // Hz
  periodMs: number;
  bpm: number;
  eventsPerSec: number;
  intervals: number;
  stabilityPct: number | null;
  stabilityLabel: string | null;
  minFreq: number | null;
  maxFreq: number | null;
};

function computeTapStats(taps: number[]): TapStats | null {
  if (taps.length < 2) return null;
  const intervals: number[] = [];
  for (let i = 1; i < taps.length; i++) intervals.push(taps[i] - taps[i - 1]);
  const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  if (mean <= 0) return null;
  const freq = 1000 / mean;

  // Stability + min/max need at least two intervals to be meaningful.
  let stabilityPct: number | null = null;
  let stabilityLabel: string | null = null;
  let minFreq: number | null = null;
  let maxFreq: number | null = null;
  if (intervals.length >= 2) {
    const variance = intervals.reduce((a, b) => a + (b - mean) ** 2, 0) / intervals.length;
    const cv = Math.sqrt(variance) / mean; // coefficient of variation
    stabilityPct = Math.max(0, Math.min(100, Math.round((1 - cv) * 100)));
    stabilityLabel = cv < 0.03 ? 'Very stable' : cv < 0.08 ? 'Stable' : cv < 0.15 ? 'Fair' : 'Unstable';
    // Longest interval → lowest freq; shortest → highest.
    minFreq = 1000 / Math.max(...intervals);
    maxFreq = 1000 / Math.min(...intervals);
  }

  return {
    freq,
    periodMs: mean,
    bpm: 60000 / mean,
    eventsPerSec: freq,
    intervals: intervals.length,
    stabilityPct,
    stabilityLabel,
    minFreq,
    maxFreq,
  };
}

const fmtHz = (hz: number) => (hz < 10 ? hz.toFixed(2) : hz.toFixed(1));

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

function EngineInDev({ extra }: { extra?: string }) {
  return (
    <View style={styles.statusCard}>
      <Text style={styles.statusTitle}>MEASUREMENT ENGINE — IN DEVELOPMENT</Text>
      <Text style={styles.statusBody}>{ENGINE_NOTE}</Text>
      {extra ? <Text style={styles.statusBody}>{extra}</Text> : null}
    </View>
  );
}

// ---- Live pitch modes (engine build 2026-07-23): Sound = numeric frequency
// counter; Tuner = musical interpretation (note/octave/cents vs a selectable
// A4 reference). Both read the SAME YIN pitch frames — the merged-tool point.
const NOTE_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
const A4_CHOICES = [432, 435, 438, 440, 441, 442, 443, 444];

function noteFor(freq: number, a4: number): { name: string; octave: number; cents: number } {
  const n = Math.round(12 * Math.log2(freq / a4)) + 69; // MIDI number
  const fNote = a4 * Math.pow(2, (n - 69) / 12);
  const cents = 1200 * Math.log2(freq / fNote);
  return { name: NOTE_NAMES[((n % 12) + 12) % 12], octave: Math.floor(n / 12) - 1, cents };
}

function LivePitchMode({ kind }: { kind: 'sound' | 'tuner' }) {
  const { state, frames, start, stop, lastError } = useDspEngine(
    { pitchEnabled: true },
    { meter: true, pitch: true },
  );
  const [a4, setA4] = useState(440);
  const p = frames.pitch;
  const lowSignal = p != null && p.levelDb < -60;
  const showPitch = p != null && p.voiced && !lowSignal && p.freq > 0;
  const note = p != null && showPitch ? { ...noteFor(p.freq, a4), freq: p.freq } : null;

  if (state === 'absent' || state === 'spike' || state === 'denied' || state === 'error') {
    return <EngineGate state={state} lastError={lastError} />;
  }
  if (state !== 'running') {
    return (
      <>
        <Text style={styles.intro}>
          {kind === 'sound'
            ? 'Measure the frequency of a steady sound with the microphone. Values are estimates — approximate unless calibrated.'
            : 'Play or sing a sustained note. The tuner shows the nearest note and how many cents you are from it.'}
        </Text>
        <GlassButton label={state === 'starting' ? 'STARTING…' : 'START'} tint="teal" height={52} onPress={() => void start()} />
        <Text style={styles.disclaimer}>{DISCLAIMER}</Text>
      </>
    );
  }
  return (
    <>
      {kind === 'sound' ? (
        <View style={styles.readout}>
          <Text style={styles.readoutValue}>{showPitch ? fmtHz(p.freq) : '—'}</Text>
          <Text style={styles.readoutUnit}>Hz</Text>
        </View>
      ) : (
        <>
          <View style={styles.readout}>
            <Text style={styles.readoutValue}>{note ? `${note.name}${note.octave}` : '—'}</Text>
          </View>
          {/* Cents needle: real deviation on a ±50¢ scale. */}
          <View style={styles.centsScale}>
            <View style={styles.centsZero} />
            {note && (
              <View
                style={[
                  styles.centsNeedle,
                  { left: `${50 + Math.max(-50, Math.min(50, note.cents))}%` },
                  Math.abs(note.cents) < 5 ? styles.centsNeedleInTune : null,
                ]}
              />
            )}
          </View>
          <Text style={styles.centsLabel}>
            {note ? `${note.cents >= 0 ? '+' : ''}${note.cents.toFixed(1)} cents · ${fmtHz(note.freq)} Hz` : 'no stable pitch'}
          </Text>
        </>
      )}

      <View style={styles.statGrid}>
        <StatCell label="CONFIDENCE" value={p ? `${Math.round(p.confidence * 100)}%` : '—'} />
        <StatCell label="INPUT LEVEL" value={p ? p.levelDb.toFixed(1) : '—'} unit="dBFS" />
        <StatCell label="STATUS" value={showPitch ? 'STABLE' : lowSignal ? 'LOW SIGNAL' : 'LISTENING'} />
      </View>

      {kind === 'tuner' && (
        <View style={styles.a4Row}>
          <Text style={styles.a4Label}>A4</Text>
          {A4_CHOICES.map((v) => (
            <Pressable
              key={v}
              style={[styles.a4Chip, a4 === v && styles.a4ChipOn]}
              onPress={() => setA4(v)}
              accessibilityRole="button"
              accessibilityState={{ selected: a4 === v }}
              accessibilityLabel={`A4 ${v} hertz`}
            >
              <Text style={[styles.a4ChipText, a4 === v && styles.a4ChipTextOn]}>{v}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Plain-language live warnings (spec §6). */}
      {lowSignal && (
        <Text style={styles.liveWarn}>
          ⚠ {WARNING_INFO.insufficient_signal.message} {WARNING_INFO.insufficient_signal.hint}
        </Text>
      )}
      {p != null && !p.voiced && !lowSignal && (
        <Text style={styles.liveWarn}>⚠ No stable pitch detected — sustain a single note.</Text>
      )}

      <GlassButton label="STOP" tint="steel" height={46} onPress={stop} />
      <Text style={styles.disclaimer}>{DISCLAIMER}</Text>
    </>
  );
}

function ModeSelect({ onPick, onLearn, onDemo }: { onPick: (m: Mode) => void; onLearn: () => void; onDemo: () => void }) {
  return (
    <>
      <Text style={styles.intro}>
        Count how often something repeats — as frequency, period, and tempo — or interpret it
        musically as pitch. Choose a mode:
      </Text>
      {MODES.map((m) => (
        <Pressable
          key={m.key}
          style={styles.modeBtn}
          onPress={() => onPick(m.key)}
          accessibilityRole="button"
          accessibilityLabel={m.name}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.modeName}>{m.name}</Text>
            <Text style={styles.modeBlurb}>{m.blurb}</Text>
          </View>
          <Text style={styles.modeChevron}>›</Text>
        </Pressable>
      ))}
      {/* Phase-1 training layer (spec 2026-07-23) — this tool skips ToolInfo,
          so LEARN/DEMO live here. Destinations gate the content. */}
      <View style={styles.trainRow}>
        <View style={{ flex: 1 }}>
          <GlassButton label="LEARN" tint="teal" height={46} fontSize={14} onPress={onLearn} />
        </View>
        <View style={{ flex: 1 }}>
          <GlassButton label="DEMO" tint="teal" height={46} fontSize={14} onPress={onDemo} />
        </View>
      </View>
      <Text style={styles.disclaimer}>{DISCLAIMER}</Text>
    </>
  );
}

function TapMode({ onOpenLibrary }: { onOpenLibrary: () => void }) {
  const [taps, setTaps] = useState<number[]>([]);
  const [held, setHeld] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Clear the SAVED ✓ timer on unmount (review 2026-07-23).
  useEffect(
    () => () => {
      if (savedTimer.current) clearTimeout(savedTimer.current);
    },
    [],
  );

  const onTap = useCallback(() => {
    if (held) return;
    const now = Date.now();
    setTaps((prev) => {
      if (prev.length && now - prev[prev.length - 1] > TAP_RESET_GAP_MS) return [now];
      const next = [...prev, now];
      return next.length > MAX_TAPS ? next.slice(next.length - MAX_TAPS) : next;
    });
  }, [held]);

  // onPressIn samples finger-DOWN — release dwell varies tap-to-tap and would
  // inflate the CV (review 2026-07-23). Screen-reader activation dispatches
  // onPress without a real touch, so a recent-touch guard keeps both paths
  // working without double-counting.
  const lastDownRef = useRef(0);
  const onTapDown = useCallback(() => {
    lastDownRef.current = Date.now();
    onTap();
  }, [onTap]);
  const onTapPress = useCallback(() => {
    if (Date.now() - lastDownRef.current > 400) onTap();
  }, [onTap]);

  const stats = useMemo(() => computeTapStats(taps), [taps]);
  const reset = useCallback(() => {
    setTaps([]);
    setHeld(false);
  }, []);

  /** Honest quality flags from the LIVE tap statistics — shown on the
   *  measurement screen (spec §6 required behavior) AND stored on save. They
   *  derive from the same CV the STABILITY readout shows, nothing invented. */
  const flags = useMemo<WarningFlag[]>(() => {
    if (!stats) return [];
    const f: WarningFlag[] = [];
    if (stats.stabilityLabel === 'Unstable') f.push('unstable_measurement');
    if (stats.intervals < 4) f.push('insufficient_sample_count');
    return f;
  }, [stats]);

  /** Save the session to the Saved Measurement Library (Phase 2, spec §7). */
  const onSave = useCallback(() => {
    if (!stats) return;
    saveMeasurement({
      id: Crypto.randomUUID(),
      tool_type: 'hzcounter',
      created_at: new Date().toISOString(),
      title: `Tap — ${fmtHz(stats.freq)} Hz · ${Math.round(stats.bpm)} BPM`,
      notes: '',
      input_device: 'Tap timing (touch)',
      calibration_status: 'not_applicable', // no transducer involved
      sample_rate: null,
      measurement_settings: { mode: 'tap', window_taps: MAX_TAPS, reset_gap_ms: TAP_RESET_GAP_MS },
      quality_state: evaluateQuality(flags),
      warning_flags: flags,
      data_payload: {
        kind: 'tap_log',
        freq: stats.freq,
        periodMs: stats.periodMs,
        bpm: stats.bpm,
        intervals: stats.intervals,
        stabilityPct: stats.stabilityPct,
        stabilityLabel: stats.stabilityLabel,
        minFreq: stats.minFreq,
        maxFreq: stats.maxFreq,
      },
    });
    setJustSaved(true);
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setJustSaved(false), 1800);
  }, [stats, flags]);

  return (
    <>
      {/* Big frequency readout. */}
      <View style={styles.readout}>
        <Text style={styles.readoutValue}>{stats ? fmtHz(stats.freq) : '—'}</Text>
        <Text style={styles.readoutUnit}>Hz</Text>
      </View>

      {/* Tap target — onPressIn samples finger-DOWN (see onTapDown note). */}
      <Pressable
        style={[styles.tapPad, held && styles.tapPadHeld]}
        onPressIn={onTapDown}
        onPress={onTapPress}
        accessibilityRole="button"
        accessibilityLabel="Tap"
      >
        <Text style={styles.tapPadText}>{held ? 'HELD' : taps.length < 2 ? 'TAP IN TIME' : 'TAP'}</Text>
        <Text style={styles.tapPadHint}>
          {held ? 'Release Hold to resume' : 'Keep a steady beat — pausing starts over'}
        </Text>
      </Pressable>

      {/* Results grid. */}
      <View style={styles.statGrid}>
        <StatCell label="EVENTS / SEC" value={stats ? fmtHz(stats.eventsPerSec) : '—'} />
        <StatCell label="PERIOD" value={stats ? Math.round(stats.periodMs).toString() : '—'} unit="ms" />
        <StatCell label="BPM" value={stats ? Math.round(stats.bpm).toString() : '—'} />
        <StatCell
          label="STABILITY"
          value={stats?.stabilityLabel ?? '—'}
          unit={stats?.stabilityPct != null ? `${stats.stabilityPct}%` : undefined}
        />
        <StatCell label="MIN" value={stats?.minFreq != null ? fmtHz(stats.minFreq) : '—'} unit={stats?.minFreq != null ? 'Hz' : undefined} />
        <StatCell label="MAX" value={stats?.maxFreq != null ? fmtHz(stats.maxFreq) : '—'} unit={stats?.maxFreq != null ? 'Hz' : undefined} />
      </View>

      {/* Live quality warnings ON the measurement screen (spec §6 required
          behavior) — same flags that will be stored on save. */}
      {flags.map((f) => (
        <Text key={f} style={styles.liveWarn}>
          ⚠ {WARNING_INFO[f].message} {WARNING_INFO[f].hint}
        </Text>
      ))}

      {/* Reset + Hold + Save controls. */}
      <View style={styles.controls}>
        <Pressable style={styles.ctrlBtn} onPress={reset} accessibilityRole="button" accessibilityLabel="Reset">
          <Text style={styles.ctrlText}>RESET</Text>
        </Pressable>
        <Pressable
          style={[styles.ctrlBtn, held && styles.ctrlBtnActive]}
          onPress={() => setHeld((h) => !h)}
          accessibilityRole="button"
          accessibilityState={{ selected: held }}
          accessibilityLabel={held ? 'Release hold' : 'Hold'}
        >
          <Text style={[styles.ctrlText, held && styles.ctrlTextActive]}>{held ? 'HOLD ●' : 'HOLD'}</Text>
        </Pressable>
        {/* SAVE — enabled once there is a real measurement (Phase 2, spec §7). */}
        <Pressable
          style={[styles.ctrlBtn, justSaved && styles.ctrlBtnSaved, !stats && styles.ctrlBtnDisabled]}
          onPress={onSave}
          disabled={!stats}
          accessibilityRole="button"
          accessibilityState={{ disabled: !stats }}
          accessibilityLabel="Save measurement"
        >
          <Text style={[styles.ctrlText, justSaved && styles.ctrlTextSaved]}>
            {justSaved ? 'SAVED ✓' : 'SAVE'}
          </Text>
        </Pressable>
      </View>

      <Pressable onPress={onOpenLibrary} accessibilityRole="button" accessibilityLabel="View saved measurements">
        <Text style={styles.libraryLink}>VIEW SAVED MEASUREMENTS ›</Text>
      </Pressable>

      <Text style={styles.disclaimer}>{DISCLAIMER}</Text>
    </>
  );
}

export function FrequencyCounterScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<Mode | null>(null);
  useToolUsage('hzcounter'); // T-1 telemetry (this tool skips ToolInfo)

  const goBack = () => (mode ? setMode(null) : navigation.goBack());
  const modeMeta = MODES.find((m) => m.key === mode) ?? null;

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={goBack} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.backBtnText}>‹ BACK</Text>
        </Pressable>
        <View style={{ flexShrink: 1 }}>
          <Text style={styles.title}>FREQUENCY COUNTER & TUNER</Text>
          <Text style={styles.subtitle}>{modeMeta ? modeMeta.name : 'Hz Counter · Pitch Tuner'}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {mode == null ? (
          <ModeSelect
            onPick={setMode}
            onLearn={() => navigation.navigate('ToolLearn', { toolKey: 'hzcounter' })}
            onDemo={() => navigation.navigate('ToolDemo', { toolKey: 'hzcounter' })}
          />
        ) : mode === 'tap' ? (
          <TapMode onOpenLibrary={() => navigation.navigate('ToolLibrary', { toolKey: 'hzcounter' })} />
        ) : mode === 'sound' || mode === 'tuner' ? (
          // LIVE (engine build 2026-07-23): YIN pitch — numeric (Sound) or
          // musical (Tuner). Gates itself honestly when the engine is absent.
          <LivePitchMode kind={mode} />
        ) : (
          // Light Pulse: honest in-development state (camera path not built).
          <>
            <Text style={styles.intro}>{modeMeta?.blurb}</Text>
            <EngineInDev extra="The camera light-pulse mode also needs careful per-device testing: rolling-shutter and frame-rate limits cap what a phone camera can resolve, and fast flicker can alias to the wrong rate. It ships after that testing." />
            <Text style={styles.disclaimer}>{DISCLAIMER}</Text>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingBottom: 10 },
  backBtn: {
    borderWidth: 1,
    borderColor: '#3a3a3a',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 11,
    backgroundColor: '#161616',
  },
  backBtnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1, color: colors.textSecondary },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 17, letterSpacing: 1.4, color: colors.textPrimary },
  subtitle: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.textSub, marginTop: 1 },
  scroll: { padding: 16, paddingBottom: 32, gap: 14 },

  intro: { fontFamily: fonts.barlowRegular, fontSize: 15.5, lineHeight: 23, color: colors.textSecondary },

  // Mode selection buttons — large.
  modeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(95,217,196,.5)',
    backgroundColor: '#12181a',
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  modeName: { fontFamily: fonts.oswaldMedium, fontSize: 20, letterSpacing: 0.4, color: colors.textPrimary },
  modeBlurb: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSecondary, marginTop: 3 },
  modeChevron: { fontFamily: fonts.oswaldSemiBold, fontSize: 26, color: '#5fd9c4' },
  trainRow: { flexDirection: 'row', gap: 12, marginTop: 4 },

  // Big readout.
  readout: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 8, marginTop: 4 },
  readoutValue: { fontFamily: fonts.oswaldBold, fontSize: 64, color: '#5fd9c4', letterSpacing: 1 },
  readoutUnit: { fontFamily: fonts.oswaldSemiBold, fontSize: 22, color: colors.amberLabel },

  // Tap target.
  tapPad: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(95,217,196,.55)',
    backgroundColor: '#10171a',
    paddingVertical: 34,
    alignItems: 'center',
    gap: 6,
  },
  tapPadHeld: { borderColor: 'rgba(255,180,0,.6)', backgroundColor: '#1a1409' },
  tapPadText: { fontFamily: fonts.oswaldBold, fontSize: 26, letterSpacing: 2, color: colors.textPrimary },
  tapPadHint: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.textSub },

  // Results grid — 3 across.
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCell: {
    flexGrow: 1,
    flexBasis: '30%',
    minWidth: 96,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 4,
  },
  statLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 1.2, color: colors.textSub },
  statValue: { fontFamily: fonts.oswaldMedium, fontSize: 20, color: colors.textPrimary },
  statUnit: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, color: colors.amberLabel },

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
  ctrlBtnActive: { borderColor: 'rgba(255,180,0,.65)', backgroundColor: '#1a1409' },
  ctrlBtnSaved: { borderColor: 'rgba(91,255,133,.65)', backgroundColor: '#0d1710' },
  ctrlBtnDisabled: { opacity: 0.45 },
  ctrlText: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 1.4, color: colors.textSecondary },
  ctrlTextActive: { color: colors.amber },
  ctrlTextSaved: { color: '#5bff85' },
  libraryLink: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 12,
    letterSpacing: 1.4,
    color: '#4dd0e1',
    textAlign: 'center',
  },
  // Live quality warning line (spec §6) — house amber warning style.
  liveWarn: {
    fontFamily: fonts.barlowRegular,
    fontSize: 13,
    lineHeight: 18.5,
    color: colors.amber,
  },
  // Tuner cents scale (engine build 2026-07-23) — real deviation, ±50¢.
  centsScale: {
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#101013',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  centsZero: {
    position: 'absolute',
    left: '50%',
    top: 4,
    bottom: 4,
    width: 2,
    backgroundColor: '#3a3a3a',
    borderRadius: 1,
  },
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
  centsLabel: {
    fontFamily: fonts.mono,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  a4Row: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  a4Label: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.4, color: colors.textSub },
  a4Chip: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    backgroundColor: '#141414',
    paddingVertical: 5,
    paddingHorizontal: 9,
  },
  a4ChipOn: { borderColor: 'rgba(95,217,196,.7)', backgroundColor: '#0f1a18' },
  a4ChipText: { fontFamily: fonts.mono, fontSize: 12, color: colors.textSecondary },
  a4ChipTextOn: { color: '#5fd9c4' },

  // In-development card (Sound / Light).
  statusCard: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,180,0,.45)',
    backgroundColor: '#1a1409',
    padding: 14,
    gap: 8,
  },
  statusTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.6, color: colors.amber },
  statusBody: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSecondary },

  disclaimer: {
    fontFamily: fonts.barlowRegular,
    fontStyle: 'italic',
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.textMuted,
    marginTop: 6,
  },
});
