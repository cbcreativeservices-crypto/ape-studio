/**
 * FrequencyCounterScreen — Frequency Counter & Tuner (user request 2026-07-18;
 * merged with the Tuner per the spec of record 2026-07-23 — the counter and
 * tuner share ~90% of one frequency-estimation engine). Four modes:
 *   Sound       — LIVE: mic estimate of a steady tone's frequency from the
 *                 native engine's YIN pitch frames (Hz · period · BPM ·
 *                 confidence · level · stability), with SAVE to the library.
 *   Light Pulse — camera estimate of a flicker rate (needs the camera path +
 *                 per-device testing; shipped later per the recommendation)
 *   Tap         — tap along with a repeating event; frequency/tempo computed
 *                 purely from tap TIMING, so it needs no mic/camera/DSP and is
 *                 LIVE (built first, as recommended).
 *   Tuner       — LIVE: musical interpretation of the SAME pitch frames —
 *                 note, octave, cents vs a selectable A4 reference, with a
 *                 ±50¢ needle and a green ±5¢ in-tune zone.
 *
 * Integrity (tools spec §1.7): Sound and Tuner render ONLY from real engine
 * pitch frames while capture runs — below the confidence/voiced gate the
 * readout dims to the last-good value with an age hint (never presented as
 * live), then falls to dashes. Light Pulse keeps an honest "engine in
 * development" card. Tap shows REAL values derived from the user's own taps.
 *
 * Results (Tap): frequency (Hz), events/sec, period (ms), BPM, stability, and
 * the min/max readings, with Reset + Hold controls.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PermissionsAndroid, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Crypto from 'expo-crypto';
import { GlassButton } from '../../components/GlassButton';
import { useToolUsage } from '../../features/tools/telemetry';
import { meterWarningFlags, useDspEngine } from '../../features/tools/engine/useDspEngine';
import { saveMeasurement } from '../../features/tools/measure/measurementStore';
import { evaluateQuality } from '../../features/tools/measure/quality';
import { WARNING_INFO, type WarningFlag } from '../../features/tools/measure/types';
import { colors, fonts } from '../../theme/tokens';
import { EngineGate } from './EngineGate';
import { ENGINE_NOTE } from './toolsData';
import { useToolHelp, DisplayGuideButton, readoutKey } from '../../features/lab/guidedLessons';
import { useOpticalCounter } from '../../features/tools/capture/opticalCounter';
import * as Optical from '../../../modules/ape-optical';
import { PermissionPrompt, usePermissionFlow } from '../../features/permissions/PermissionPrompt';
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

/** Period display: a 440 Hz tone's period is 2.27 ms, so sub-10 ms needs decimals. */
const fmtMs = (ms: number) => (ms < 10 ? ms.toFixed(2) : ms < 100 ? ms.toFixed(1) : Math.round(ms).toString());

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
// Spec Tool 7 required reference pitches (Custom entry ships later).
const A4_CHOICES = [432, 435, 438, 440, 441, 442, 443, 444];

// Tuner detection band (owner 2026-07-31): a VARIABLE low-cut (high-pass) and
// high-cut (low-pass) that restrict which detected pitches the tuner will lock
// to. Narrowing the band forces the correct OCTAVE (rejects the ½×/2× octave
// error the YIN tracker can make) and ignores rumble below / harmonics + hiss
// above. NOTE: this filters the pitch-DETECTION range in JS — it is not an
// audio-DSP EQ on the microphone signal (that would need the native engine).
const TUNER_LOW_CUT_HZ = [40, 60, 80, 110, 160, 220]; // high-pass cutoffs (Hz)
const TUNER_HIGH_CUT_HZ = [500, 800, 1200, 2000, 4000]; // low-pass cutoffs (Hz)
const fmtCut = (hz: number) => (hz >= 1000 ? `${hz / 1000} kHz` : `${hz} Hz`);

// Honesty gating (§1.7): a value is presented as LIVE only when the native
// tracker calls the frame voiced (YIN CMND < 0.15 — which by construction
// means confidence > 0.85, Pitch.hpp), confidence also clears PITCH_CONF_MIN
// (belt-and-braces under that), the input isn't starved, and freq > 0.
// Anything else shows the last-good value DIMMED with an age hint (never as
// live), then dashes once it is older than PITCH_HOLD_MAX_MS.
const PITCH_CONF_MIN = 0.5;
const PITCH_LOW_SIGNAL_DB = -60; // dBFS — below this the tracker is unreliable
const PITCH_HOLD_MAX_MS = 4000;
const PITCH_STATS_WINDOW_MS = 4000; // rolling stability / min / max window
const PITCH_STATS_MIN_FRAMES = 8; // ~0.5–1 s of accepted frames before stats are real
// Reliable range, disclosed on-screen: the FLOOR is documented native-side
// (25 ms max lag → fs/maxLag ≈ 40 Hz at 48 kHz — EngineHub.hpp); the top is a
// conservative ~4 kHz stated as APPROXIMATE — lag quantization erodes
// precision well below the theoretical ceiling.
const PITCH_RANGE_HZ = { min: 40, max: 4000 } as const;

function noteFor(freq: number, a4: number): { name: string; octave: number; cents: number } {
  // Chromatic C-1..G9 — clamp to the MIDI range so out-of-range frequencies
  // (already warned as approximate) can't name a note that doesn't exist.
  const n = Math.max(0, Math.min(127, Math.round(12 * Math.log2(freq / a4)) + 69));
  const fNote = a4 * Math.pow(2, (n - 69) / 12);
  const cents = 1200 * Math.log2(freq / fNote);
  return { name: NOTE_NAMES[((n % 12) + 12) % 12], octave: Math.floor(n / 12) - 1, cents };
}

type PitchStats = {
  freq: number; // windowed mean of accepted frames
  minFreq: number;
  maxFreq: number;
  stabilityPct: number;
  stabilityLabel: string;
  frames: number; // accepted frames averaged in
};

/** Stability from the rolling accepted-frame window — the same CV statistic
 *  Tap mode uses, with tighter thresholds because pitch is finer-grained than
 *  tap timing: 0.5% CV ≈ ±9 cents, 2% ≈ ±35 cents, 6% ≈ a semitone. */
function computePitchStats(hist: { f: number; at: number }[]): PitchStats | null {
  if (hist.length < PITCH_STATS_MIN_FRAMES) return null;
  let sum = 0;
  let min = Infinity;
  let max = -Infinity;
  for (const e of hist) {
    sum += e.f;
    if (e.f < min) min = e.f;
    if (e.f > max) max = e.f;
  }
  const mean = sum / hist.length;
  if (mean <= 0) return null;
  const variance = hist.reduce((a, e) => a + (e.f - mean) ** 2, 0) / hist.length;
  const cv = Math.sqrt(variance) / mean;
  return {
    freq: mean,
    minFreq: min,
    maxFreq: max,
    stabilityPct: Math.max(0, Math.min(100, Math.round((1 - cv) * 100))),
    stabilityLabel: cv < 0.005 ? 'Very stable' : cv < 0.02 ? 'Stable' : cv < 0.06 ? 'Fair' : 'Unstable',
    frames: hist.length,
  };
}

/** Camera-luma OS permission request (owner 2026-07-29): on Android do the
 *  real CAMERA request up front so ape-optical.start() finds it granted; on
 *  iOS ape-optical.start()'s AVCaptureDevice.requestAccess shows the dialog, so
 *  report the pre-check status here. */
async function requestCameraOs(): Promise<'granted' | 'denied' | 'blocked'> {
  if (Platform.OS === 'android') {
    try {
      const res = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);
      if (res === PermissionsAndroid.RESULTS.GRANTED) return 'granted';
      if (res === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) return 'blocked';
      return 'denied';
    } catch {
      return 'denied';
    }
  }
  return Optical.getPermissionStatus() === 'denied' ? 'denied' : 'granted';
}

/** LIGHT PULSE — optical (camera-brightness) frequency counter (ape-optical).
 *  Honest gates: absent native module → "needs the new dev build"; permission
 *  declined → Settings pointer; readings above the camera's Nyquist refused. */
function LightPulseMode({ blurb, help, helpAll }: { blurb: string; help: (key: string) => void; helpAll: () => void }) {
  const available = Optical.isAvailable();
  const [armed, setArmed] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const { request, promptProps } = usePermissionFlow('camera', requestCameraOs);
  const { state, reading, lastError } = useOpticalCounter(armed);

  const onStart = useCallback(async () => {
    const r = await request();
    if (r === 'granted') {
      setBlocked(false);
      setArmed(true);
    } else if (r === 'blocked') {
      setBlocked(true);
    }
  }, [request]);

  if (!available) {
    return (
      <>
        <Text style={styles.intro}>{blurb}</Text>
        <EngineInDev extra="Light-Pulse uses a native camera module that isn't in this installed build yet — install the next dev build to enable it. It measures overall image brightness over time (no photo or video is saved) and estimates the flash rate; rolling-shutter and frame-rate limits cap what a phone camera can resolve, so it's for slow flashing lights, strobes, and marked rotating machinery, not audio-rate signals." />
        <Text style={styles.disclaimer}>{DISCLAIMER}</Text>
      </>
    );
  }

  const freq = reading?.freq ?? null;
  const nyq = reading?.nyquistHz ?? 0;
  const steady = reading != null && reading.depth < 0.01;

  return (
    <>
      <Text style={styles.intro}>{blurb}</Text>
      <DisplayGuideButton onPress={helpAll} />

      {!armed ? (
        <GlassButton label="START CAMERA" onPress={onStart} tint="gold" />
      ) : (
        <View style={styles.controls}>
          <Pressable style={styles.ctrlBtn} onPress={() => setArmed(false)} accessibilityRole="button" accessibilityLabel="Stop">
            <Text style={styles.ctrlText}>STOP</Text>
          </Pressable>
        </View>
      )}

      {blocked && (
        <Text style={styles.liveWarn}>
          ⚠ Camera access is off. Turn it on for this app in your device Settings to use Light Pulse.
        </Text>
      )}

      {armed && (
        <>
          <View style={styles.readout}>
            <Text style={[styles.readoutValue, (state !== 'running' || freq == null) && styles.readoutDim]}>
              {freq != null ? freq.toFixed(freq < 10 ? 2 : 1) : '– –'}
            </Text>
            <Text style={styles.readoutUnit}>Hz</Text>
          </View>
          <View style={styles.statGrid}>
            <StatCell label="PERIOD" value={freq != null ? fmtMs(1000 / freq) : '—'} unit="ms" help={help} />
            <StatCell label="BPM" value={freq != null ? Math.round(freq * 60).toString() : '—'} help={help} />
            <StatCell label="MOD DEPTH" value={reading != null ? `${Math.round(reading.depth * 100)}` : '—'} unit="%" help={help} />
            <StatCell label="CAMERA FPS" value={reading != null ? Math.round(reading.fps).toString() : '—'} help={help} />
            <StatCell label="MAX RESOLVABLE" value={nyq > 0 ? nyq.toFixed(0) : '—'} unit="Hz" help={help} />
          </View>

          {state === 'starting' && <Text style={styles.liveWarn}>Opening the camera…</Text>}
          {state === 'denied' && (
            <Text style={styles.liveWarn}>⚠ Camera access is off — enable it in Settings to use Light Pulse.</Text>
          )}
          {state === 'error' && <Text style={styles.liveWarn}>⚠ Camera error: {lastError || 'could not start capture'}.</Text>}
          {state === 'running' && steady && (
            <Text style={styles.liveWarn}>Point the camera at the flashing light — the image looks steady right now (little brightness change).</Text>
          )}
          {reading?.nearLimit && (
            <Text style={styles.liveWarn}>
              ⚠ This reading is near the camera's limit (~{nyq.toFixed(0)} Hz) — treat it as approximate; faster
              flicker can alias to a wrong, lower rate.
            </Text>
          )}
          <Text style={styles.disclaimer}>
            A camera can only resolve flicker up to about half its frame rate. Best for slow flashing
            indicators, strobes, and rotating machinery with a marker. Overall image brightness only —
            no photo or video is recorded.
          </Text>
        </>
      )}
      <PermissionPrompt {...promptProps} />
    </>
  );
}

function LivePitchMode({
  kind,
  help,
  helpAll,
  onOpenLibrary,
}: {
  kind: 'sound' | 'tuner';
  help: (key: string) => void;
  helpAll: () => void;
  onOpenLibrary: () => void;
}) {
  const { state, frames, start, stop, lastError } = useDspEngine(
    { pitchEnabled: true },
    { meter: true, pitch: true },
  );
  const [a4, setA4] = useState(440);
  // Tuner-only variable detection band (high-pass low-cut + low-pass high-cut).
  // Defaults span the full reliable range, so the tuner is unrestricted until
  // the user narrows it to force an octave.
  const [lowCut, setLowCut] = useState(TUNER_LOW_CUT_HZ[0]); // 40 Hz
  const [highCut, setHighCut] = useState(TUNER_HIGH_CUT_HZ[TUNER_HIGH_CUT_HZ.length - 1]); // 4 kHz
  const [justSaved, setJustSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (savedTimer.current) clearTimeout(savedTimer.current);
    },
    [],
  );

  // Accepted-frame history (rolling window) + the last-good reading. Refs, not
  // state — the hook's poll already re-renders this component every tick.
  const histRef = useRef<{ f: number; at: number }[]>([]);
  const lastGoodRef = useRef<{ f: number; at: number } | null>(null);
  const lastSeqRef = useRef(-1);

  const running = state === 'running';

  // STOP must not collapse the tool back to the intro card (that jumps the
  // scroll). Hold the readout view mounted via micPaused; the button toggles
  // START/STOP in place. Cleared once we're truly running again.
  const [micPaused, setMicPaused] = useState(false);
  useEffect(() => {
    if (running) setMicPaused(false);
  }, [running]);
  const onStart = useCallback(() => {
    setMicPaused(false);
    void start();
  }, [start]);
  const onStop = useCallback(() => {
    setMicPaused(true);
    stop();
  }, [stop]);

  // Readouts come ONLY from a live frame — stale frames after STOP are never
  // shown (the SPL screen's integrity idiom).
  const live = running ? frames.pitch : null;
  const meter = running ? frames.meter : null;
  const lowSignal = live != null && live.levelDb < PITCH_LOW_SIGNAL_DB;
  // Tuner detection band — Sound mode is never band-limited (it counts any
  // frequency); only the Tuner locks within [lowCut, highCut].
  const inBand = useCallback(
    (f: number) => kind !== 'tuner' || (f >= lowCut && f <= highCut),
    [kind, lowCut, highCut],
  );
  const accepted =
    live != null &&
    live.voiced &&
    live.confidence >= PITCH_CONF_MIN &&
    !lowSignal &&
    live.freq > 0 &&
    inBand(live.freq);

  // Fresh session per START — never carry a previous session's last-good.
  useEffect(() => {
    if (running) {
      histRef.current = [];
      lastGoodRef.current = null;
      lastSeqRef.current = -1;
    }
  }, [running]);

  // Fold each NEW accepted frame (sequence-deduped — the poll can return the
  // same analysis frame twice) into the history + last-good refs.
  useEffect(() => {
    if (!running || live == null || live.sequence === lastSeqRef.current) return;
    lastSeqRef.current = live.sequence;
    const ok =
      live.voiced &&
      live.confidence >= PITCH_CONF_MIN &&
      live.levelDb >= PITCH_LOW_SIGNAL_DB &&
      live.freq > 0 &&
      inBand(live.freq);
    if (!ok) return;
    const now = Date.now();
    lastGoodRef.current = { f: live.freq, at: now };
    const h = histRef.current;
    h.push({ f: live.freq, at: now });
    while (h.length && now - h[0].at > PITCH_STATS_WINDOW_MS) h.shift();
  }, [running, live, inBand]);

  // What the big readout shows: the live value, or the last-good DIMMED with
  // an age hint (§1.7 — a stale number is never presented as live), then '—'.
  const lastGood = lastGoodRef.current;
  const heldAgeMs = !accepted && lastGood != null ? Date.now() - lastGood.at : null;
  const isHeld = heldAgeMs != null && heldAgeMs <= PITCH_HOLD_MAX_MS;
  const shownFreq = accepted && live != null ? live.freq : isHeld && lastGood != null ? lastGood.f : null;
  const holdNote = accepted
    ? null
    : isHeld
      ? `last stable reading · ${((heldAgeMs ?? 0) / 1000).toFixed(1)} s ago — not live`
      : 'no stable pitch';

  const note = shownFreq != null ? noteFor(shownFreq, a4) : null;
  const stats = computePitchStats(histRef.current);
  const outOfRange =
    accepted && live != null && (live.freq < PITCH_RANGE_HZ.min || live.freq > PITCH_RANGE_HZ.max);
  const statusLabel = accepted ? 'STABLE' : lowSignal ? 'LOW SIGNAL' : 'LISTENING';

  // Quality flags: native meter conditions (clipping / OS-processed input /
  // Bluetooth / stalled capture) via the SHARED mapping, plus this tool's own
  // honest conditions — the same flags shown live are stored on save (§6).
  const flags = meterWarningFlags(meter);
  if (running && lowSignal && !flags.includes('insufficient_signal')) flags.push('insufficient_signal');
  if (running && stats?.stabilityLabel === 'Unstable' && !flags.includes('unstable_measurement'))
    flags.push('unstable_measurement');

  /** SAVE (Sound mode) → Saved Measurement Library, mirroring Tap's shape:
   *  the tool's shared frequency-log payload (freq/period/BPM/stability/
   *  min/max) with mode disclosed in measurement_settings. */
  const onSave = useCallback(() => {
    const fr = state === 'running' ? frames.pitch : null;
    const s = computePitchStats(histRef.current);
    const ok =
      fr != null &&
      fr.voiced &&
      fr.confidence >= PITCH_CONF_MIN &&
      fr.levelDb >= PITCH_LOW_SIGNAL_DB &&
      fr.freq > 0;
    if (!ok || s == null) return;
    const saveFlags = meterWarningFlags(state === 'running' ? frames.meter : null);
    if (s.stabilityLabel === 'Unstable' && !saveFlags.includes('unstable_measurement'))
      saveFlags.push('unstable_measurement');
    saveMeasurement({
      id: Crypto.randomUUID(),
      tool_type: 'hzcounter',
      created_at: new Date().toISOString(),
      title: `Sound — ${fmtHz(s.freq)} Hz · ${s.stabilityLabel}`,
      notes: '',
      input_device: 'phone microphone',
      // Every stored quantity is frequency-domain (the uncalibrated dBFS level
      // is displayed live but never stored) and the timebase needs no field
      // calibration — so this mirrors Tap's 'not_applicable'.
      calibration_status: 'not_applicable',
      sample_rate: null, // info polling is out of scope for this screen (SPL idiom)
      measurement_settings: {
        mode: 'sound',
        conf_min: PITCH_CONF_MIN,
        low_signal_db: PITCH_LOW_SIGNAL_DB,
        stats_window_ms: PITCH_STATS_WINDOW_MS,
      },
      quality_state: evaluateQuality(saveFlags),
      warning_flags: saveFlags,
      data_payload: {
        kind: 'tap_log', // the tool's shared frequency-log shape
        freq: s.freq,
        periodMs: 1000 / s.freq,
        bpm: 60 * s.freq,
        intervals: s.frames, // accepted pitch frames averaged in
        stabilityPct: s.stabilityPct,
        stabilityLabel: s.stabilityLabel,
        minFreq: s.minFreq,
        maxFreq: s.maxFreq,
      },
    });
    setJustSaved(true);
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setJustSaved(false), 1800);
  }, [state, frames.pitch, frames.meter]);

  if (state === 'absent' || state === 'spike' || state === 'denied' || state === 'error') {
    return <EngineGate state={state} lastError={lastError} />;
  }
  if (state !== 'running' && !micPaused) {
    return (
      <>
        <Text style={styles.intro}>
          {kind === 'sound'
            ? 'Measure the frequency of a steady sound with the microphone — frequency is the ' +
              'measurement; pitch is the musical interpretation. The microphone captures only while ' +
              'the counter runs.'
            : 'Play or sing a sustained note. The tuner shows the nearest note and how many cents ' +
              'you are from it, against a selectable A4 reference. The microphone captures only ' +
              'while the tuner runs.'}
        </Text>
        <GlassButton
          label={state === 'starting' ? 'STARTING…' : 'START'}
          tint="teal"
          height={52}
          disabled={state === 'starting'}
          onPress={onStart}
        />
        <Text style={styles.disclaimer}>{DISCLAIMER}</Text>
      </>
    );
  }
  return (
    <>
      {kind === 'sound' ? (
        // Tapping the readout toggles START/STOP (owner 2026-07-31).
        <Pressable
          style={styles.readout}
          onPress={running ? onStop : onStart}
          accessibilityRole="button"
          accessibilityLabel={running ? 'Tap to stop capture' : 'Tap to start capture'}
        >
          <Text style={[styles.readoutValue, isHeld && styles.readoutDim]}>
            {shownFreq != null ? fmtHz(shownFreq) : '—'}
          </Text>
          <Text style={styles.readoutUnit}>Hz</Text>
        </Pressable>
      ) : (
        <>
          <Pressable
            style={styles.readout}
            onPress={running ? onStop : onStart}
            accessibilityRole="button"
            accessibilityLabel={running ? 'Tap to stop capture' : 'Tap to start capture'}
          >
            <Text style={[styles.readoutValue, isHeld && styles.readoutDim]}>
              {note ? `${note.name}${note.octave}` : '—'}
            </Text>
          </Pressable>
          {/* Cents needle: real deviation on a ±50¢ scale; the green band is
              the ±5¢ in-tune zone. */}
          <View style={styles.centsScale}>
            <View style={styles.centsZoneInTune} />
            <View style={styles.centsZero} />
            {note && (
              <View
                style={[
                  styles.centsNeedle,
                  { left: `${50 + Math.max(-50, Math.min(50, note.cents))}%` },
                  Math.abs(note.cents) < 5 ? styles.centsNeedleInTune : null,
                  isHeld && styles.readoutDim,
                ]}
              />
            )}
          </View>
          <Text
            style={[
              styles.centsLabel,
              note != null && !isHeld && Math.abs(note.cents) < 5 && styles.centsLabelInTune,
              isHeld && styles.readoutDim,
            ]}
          >
            {note != null && shownFreq != null
              ? `${note.cents >= 0 ? '+' : ''}${note.cents.toFixed(1)} cents · ${fmtHz(shownFreq)} Hz`
              : 'no stable pitch'}
          </Text>
        </>
      )}
      {/* The tuner's cents label already says "no stable pitch" — only the
          age-hint adds information there. */}
      {holdNote != null && (kind === 'sound' || isHeld) && <Text style={styles.holdNote}>{holdNote}</Text>}

      {kind === 'sound' ? (
        <View style={styles.statGrid}>
          <StatCell help={help} label="PERIOD" value={accepted && live != null ? fmtMs(1000 / live.freq) : '—'} unit="ms" />
          <StatCell help={help} label="BPM" value={accepted && live != null ? Math.round(60 * live.freq).toString() : '—'} />
          <StatCell help={help} label="CONFIDENCE" value={live ? `${Math.round(live.confidence * 100)}%` : '—'} />
          <StatCell
            help={help}
            label="INPUT LEVEL"
            value={live != null && Number.isFinite(live.levelDb) ? live.levelDb.toFixed(1) : '—'}
            unit="dBFS"
          />
          <StatCell
            help={help}
            label="STABILITY"
            value={stats?.stabilityLabel ?? '—'}
            unit={stats != null ? `${stats.stabilityPct}%` : undefined}
          />
          <StatCell help={help} label="STATUS" value={statusLabel} />
        </View>
      ) : (
        <View style={styles.statGrid}>
          {/* Explicit octave detection (owner 2026-07-31) — the octave the
              nearest note sits in, e.g. A4 → 4. Band controls below force it. */}
          <StatCell help={help} label="OCTAVE" value={note != null ? String(note.octave) : '—'} />
          <StatCell help={help} label="CONFIDENCE" value={live ? `${Math.round(live.confidence * 100)}%` : '—'} />
          <StatCell
            help={help}
            label="INPUT LEVEL"
            value={live != null && Number.isFinite(live.levelDb) ? live.levelDb.toFixed(1) : '—'}
            unit="dBFS"
          />
          <StatCell help={help} label="STATUS" value={statusLabel} />
        </View>
      )}
      {/* Honest range + unit conventions (§1.4/§1.7 + spec Tool 7 warnings). */}
      <Text style={styles.gridNote}>
        Reads ONE steady tone, roughly {PITCH_RANGE_HZ.min} Hz – {PITCH_RANGE_HZ.max / 1000} kHz
        (approximate). Input level is dBFS · uncalibrated — digital level, never SPL.
      </Text>
      <DisplayGuideButton onPress={helpAll} />

      {kind === 'tuner' && (
        <View style={styles.a4Row}>
          <Pressable onLongPress={() => help('a4')} delayLongPress={260} hitSlop={8}>
            <Text style={styles.a4Label}>A4 ⓘ</Text>
          </Pressable>
          {A4_CHOICES.map((v) => (
            <Pressable
              key={v}
              style={[styles.a4Chip, a4 === v && styles.a4ChipOn]}
              onPress={() => setA4(v)}
              onLongPress={() => help('a4')}
              delayLongPress={260}
              accessibilityRole="button"
              accessibilityState={{ selected: a4 === v }}
              accessibilityLabel={`A4 ${v} hertz`}
            >
              <Text style={[styles.a4ChipText, a4 === v && styles.a4ChipTextOn]}>{v}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Variable detection band (owner 2026-07-31): a low-cut (high-pass) and
          high-cut (low-pass) that bracket the frequencies the tuner will lock
          to — narrow it to force the octave and reject rumble / harmonics. */}
      {kind === 'tuner' && (
        <View style={styles.bandControls}>
          <Text style={styles.bandTitle}>DETECTION BAND — narrow to force the octave</Text>
          <View style={styles.a4Row}>
            <Text style={styles.a4Label}>LOW-CUT</Text>
            {TUNER_LOW_CUT_HZ.map((v) => (
              <Pressable
                key={v}
                style={[styles.a4Chip, lowCut === v && styles.a4ChipOn]}
                onPress={() => setLowCut(v)}
                accessibilityRole="button"
                accessibilityState={{ selected: lowCut === v }}
                accessibilityLabel={`Low cut ${v} hertz high-pass`}
              >
                <Text style={[styles.a4ChipText, lowCut === v && styles.a4ChipTextOn]}>{v}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.a4Row}>
            <Text style={styles.a4Label}>HIGH-CUT</Text>
            {TUNER_HIGH_CUT_HZ.map((v) => (
              <Pressable
                key={v}
                style={[styles.a4Chip, highCut === v && styles.a4ChipOn]}
                onPress={() => setHighCut(v)}
                accessibilityRole="button"
                accessibilityState={{ selected: highCut === v }}
                accessibilityLabel={`High cut ${v} hertz low-pass`}
              >
                <Text style={[styles.a4ChipText, highCut === v && styles.a4ChipTextOn]}>
                  {v >= 1000 ? `${v / 1000}k` : v}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.gridNote}>
            The tuner locks only to pitches between {fmtCut(lowCut)} and {fmtCut(highCut)}. Narrow the
            band to force the correct octave and ignore rumble or harmonics. This limits the detection
            range, not the microphone signal itself.
          </Text>
        </View>
      )}

      {/* Plain-language live warnings (spec §6) — shared flags first, then the
          tool's spec-required caveats (multiple tones / out of range). */}
      {flags.map((f) => (
        <Text key={f} style={styles.liveWarn}>
          ⚠ {WARNING_INFO[f].message} {WARNING_INFO[f].hint}
        </Text>
      ))}
      {live != null && !accepted && !lowSignal && (
        <Text style={styles.liveWarn}>
          ⚠ No stable pitch — sustain ONE steady tone. Chords, speech, or multiple tones at once do
          not reduce to a single frequency.
        </Text>
      )}
      {outOfRange && (
        <Text style={styles.liveWarn}>
          ⚠ Frequency is outside the reliable range (≈{PITCH_RANGE_HZ.min} Hz–
          {PITCH_RANGE_HZ.max / 1000} kHz) — treat this reading as approximate.
        </Text>
      )}
      {kind === 'tuner' &&
        live != null &&
        live.voiced &&
        live.confidence >= PITCH_CONF_MIN &&
        !lowSignal &&
        live.freq > 0 &&
        !inBand(live.freq) && (
          <Text style={styles.liveWarn}>
            ⚠ A pitch at {fmtHz(live.freq)} Hz is outside the detection band ({fmtCut(lowCut)}–
            {fmtCut(highCut)}). Widen or move the band to include your note.
          </Text>
        )}

      {/* SAVE (Sound mode only) — enabled once a live, confident pitch has held
          long enough for real stats (Phase 2, spec §7). */}
      {kind === 'sound' && (
        <>
          <View style={styles.controls}>
            <Pressable
              style={[
                styles.ctrlBtn,
                justSaved && styles.ctrlBtnSaved,
                (!accepted || stats == null) && styles.ctrlBtnDisabled,
              ]}
              onPress={onSave}
              disabled={!accepted || stats == null}
              accessibilityRole="button"
              accessibilityState={{ disabled: !accepted || stats == null }}
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
        </>
      )}

      <GlassButton
        label={running ? 'STOP' : 'START'}
        tint="steel"
        height={46}
        onPress={running ? onStop : onStart}
      />
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

function TapMode({ onOpenLibrary, help, helpAll }: { onOpenLibrary: () => void; help: (key: string) => void; helpAll: () => void }) {
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
        <StatCell help={help} label="EVENTS / SEC" value={stats ? fmtHz(stats.eventsPerSec) : '—'} />
        <StatCell help={help} label="PERIOD" value={stats ? Math.round(stats.periodMs).toString() : '—'} unit="ms" />
        <StatCell help={help} label="BPM" value={stats ? Math.round(stats.bpm).toString() : '—'} />
        <StatCell
          help={help}
          label="STABILITY"
          value={stats?.stabilityLabel ?? '—'}
          unit={stats?.stabilityPct != null ? `${stats.stabilityPct}%` : undefined}
        />
        <StatCell help={help} label="MIN" value={stats?.minFreq != null ? fmtHz(stats.minFreq) : '—'} unit={stats?.minFreq != null ? 'Hz' : undefined} />
        <StatCell help={help} label="MAX" value={stats?.maxFreq != null ? fmtHz(stats.maxFreq) : '—'} unit={stats?.maxFreq != null ? 'Hz' : undefined} />
      </View>
      <DisplayGuideButton onPress={helpAll} />

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
  const { help, helpAll, sheet } = useToolHelp('freqcounter');
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
          <TapMode help={help} helpAll={helpAll} onOpenLibrary={() => navigation.navigate('ToolLibrary', { toolKey: 'hzcounter' })} />
        ) : mode === 'sound' || mode === 'tuner' ? (
          // LIVE (engine build 2026-07-23): YIN pitch — numeric (Sound) or
          // musical (Tuner). Gates itself honestly when the engine is absent.
          <LivePitchMode
            kind={mode}
            help={help}
            helpAll={helpAll}
            onOpenLibrary={() => navigation.navigate('ToolLibrary', { toolKey: 'hzcounter' })}
          />
        ) : (
          // Light Pulse: camera-luma optical counter (ape-optical). Gates
          // itself honestly when the native module isn't in the build.
          <LightPulseMode blurb={modeMeta?.blurb ?? ''} help={help} helpAll={helpAll} />
        )}
      </ScrollView>
      {sheet}
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
  // Last-good hold (§1.7): dimmed, never presented as live.
  readoutDim: { opacity: 0.35 },
  holdNote: {
    fontFamily: fonts.barlowRegular,
    fontSize: 12.5,
    color: colors.textSub,
    textAlign: 'center',
    marginTop: -6,
  },

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
  // The ±5¢ in-tune zone — 10% of the ±50¢ scale, centered on zero.
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
  centsLabelInTune: { color: '#5bff85' },
  // Honest range/unit footnote under the stat grid.
  gridNote: { fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 17, color: colors.textMuted },
  a4Row: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  // Variable detection-band controls (low-cut / high-cut) — tuner only.
  bandControls: { gap: 8 },
  bandTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.4, color: colors.amberLabel },
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
