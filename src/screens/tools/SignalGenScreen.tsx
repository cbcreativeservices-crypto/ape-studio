/**
 * SignalGenScreen — Tone & Noise Generator LIVE (spec of record
 * APE_AUDIO_TOOLS_SPEC_2026_07_23.md Tool 6; output-cap RULING Q4 in
 * MEASUREMENT_TOOLS_RULINGS_Q1_Q5_2026_07_09_v1.md; engine build 2026-07-23).
 *
 * RACK UNIT (APE_LAB_UX_PROPOSAL 2026-08-23, owner-approved) — the first TOOL
 * on the frame; layout law: *reading may scroll; operating may not.* The
 * waveform preview PINS on the stage glass (height-parametric) with the dBFS
 * honesty line as its badge; SIGNAL/FREQ/OUT/GEN read on the bezel; FREQUENCY
 * and LEVEL ride the dock lane (FREQ pre-bound — the tool's teaching param);
 * SIGNAL is a sticky options tray, ISO presets + the ±1-semitone fine stepper
 * share the PRESET group tray (precision affordance kept off the scroller);
 * START/STOP is the dock's LED key (same semantics as the old transport
 * button). Only the legend, status diagnostics and safety notices scroll —
 * notices at the BOTTOM of the well (owner tools rule).
 *
 * A signal SOURCE, not a meter — it drives the ApeDsp generator directly and
 * needs NO microphone, so it deliberately skips useDspEngine. Engine gating:
 * availability + engineVersion() are computed ONCE; below the engine build the
 * screen renders the honest EngineGate card ('absent'/'spike') — no fake
 * control surface, no simulated output (measurement-tools §1.7).
 *
 * Q4 safety UX — the core of this screen:
 *  - level rides the lane in 3 dB steps across −60…0 dBFS, default −20 dBFS;
 *  - the NATIVE output path hard-caps at −12 dBFS while locked (the cap lives
 *    in the engine, not in this UI — the UI merely fronts it honestly): the
 *    LEVEL lane CLAMPS at the cap while locked;
 *  - going above the cap requires the tap-through confirm ("Remove
 *    headphones / lower monitor level before continuing") → genUnlockCap(),
 *    which unlocks for this session only — pushing the lane past the cap
 *    raises that confirm exactly once per attempt;
 *  - the status card ALWAYS shows genStatus().effectiveLevelDb — the honest
 *    level actually leaving the output path — labeled dBFS · uncalibrated
 *    (never SPL: calibration does not exist), with a CAP badge while locked;
 *  - leaving the screen stops the generator AND re-locks the cap.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ApeDsp, GEN_MODES, type GenModeName, type GenStatus } from '../../../modules/ape-dsp';
import { useAudioOutputGate } from '../../features/audio/AudioOutputGate';
import { noteAudioActivity } from '../../features/audio/audioOutputStore';
import { EngineGate } from './EngineGate';
import type { EngineState } from '../../features/tools/engine/useDspEngine';
import { MIDLINE_BLUE, WAVE_LEVEL_STOPS, levelColorForDb } from '../../features/tools/levelColor';
import { isGenCapUnlockedThisSession, markGenCapUnlockedThisSession } from '../../features/tools/genCapSession';
import { useColorModePref } from '../../features/tools/colorModePref';
import { colors, fonts } from '../../theme/tokens';
import { AccuracyNote } from '../../components/AccuracyNote';
import { toolByKey } from './toolsData';
import { useToolHelp, HelpHead } from '../../features/lab/guidedLessons';
import { RackUnit } from '../lab/rack/RackUnit';
import type { DockParam } from '../lab/rack/rackTypes';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'SignalGen'>;

// ---- Q4 level constants (native is authoritative; genStatus() reports the
// live capDb/defaultLevelDb — these are UI fallbacks + lane geometry). ----
const LEVEL_MIN_DB = -60;
const LEVEL_MAX_DB = 0;
const LEVEL_STEP_DB = 3;
const DEFAULT_LEVEL_DB = -20; // Q4 safe default
const FALLBACK_CAP_DB = -12; // Q4 hard cap

const SEMITONE = 2 ** (1 / 12); // fine frequency step ×2^(1/12)
const STATUS_POLL_MS = 500; // 2 Hz — status scalars only, far inside the ≤30 Hz bridge rule

// Frequency lane (owner 2026-08-05): a continuous log sweep 63 Hz → 6 kHz.
const FREQ_SLIDER_MIN = 63;
const FREQ_SLIDER_MAX = 6000;
const FREQ_SLIDER_RATIO = FREQ_SLIDER_MAX / FREQ_SLIDER_MIN;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
/** Current frequency → lane position 0..1 (log), clamped to the lane span. */
const freqToSlider = (hz: number) =>
  clamp01(Math.log(hz / FREQ_SLIDER_MIN) / Math.log(FREQ_SLIDER_RATIO));
/** Lane position 0..1 → frequency (log), rounded to whole Hz. */
const sliderToFreq = (v: number) => Math.round(FREQ_SLIDER_MIN * Math.pow(FREQ_SLIDER_RATIO, clamp01(v)));

/** Signal chips (spec Tool 6 required modes; keys must exist in GEN_MODES). */
// Tray blurbs (owner 2026-08-28): the noise COLOURS especially — nothing about
// the words "pink" or "violet" explains itself.
const SIGNALS: { key: GenModeName; label: string; blurb: string }[] = [
  { key: 'sine', label: 'SINE', blurb: 'One pure frequency at the dial — the reference tone for level checks and ear training.' },
  { key: 'white', label: 'WHITE', blurb: 'Equal energy per Hz. The top octaves dominate (each octave holds twice the frequencies) — bright, hissy.' },
  { key: 'pink', label: 'PINK', blurb: 'Equal energy per OCTAVE — matches how hearing and RTAs divide the spectrum. THE measurement and tuning noise.' },
  { key: 'brown', label: 'BROWN', blurb: 'Energy falling 6 dB per octave — deep rumble, like distant surf. All weight, no sizzle.' },
  { key: 'blue', label: 'BLUE', blurb: 'Pink’s mirror: energy RISING per octave. Thin and airy — mostly a dither/testing curiosity.' },
  { key: 'violet', label: 'VIOLET', blurb: 'White’s mirror, rising 6 dB per octave — almost pure sizzle. The extreme end of the noise family.' },
  { key: 'sweepLin', label: 'SWEEP LIN', blurb: 'A tone gliding at constant Hz per second — it races through the bass and crawls through the highs.' },
  { key: 'sweepLog', label: 'SWEEP LOG', blurb: 'A tone gliding at constant OCTAVES per second — equal time in every octave. The sweep that sounds even, and the one measurement uses.' },
  { key: 'click', label: 'CLICK', blurb: 'A dry metronome tick — sharp transients with silence between, for timing, echoes and latency checks.' },
  { key: 'burst', label: 'BURST', blurb: 'Short tone bursts with gaps — level in bursts, silence between: meter ballistics and gating made audible.' },
];

const ISO_PRESETS_HZ = [63, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
const SWEEP_START_PRESETS_HZ = [20, 50, 100, 500, 1000];
const SWEEP_END_PRESETS_HZ = [2000, 5000, 10000, 20000];
const SWEEP_DURATIONS_SEC = [5, 10, 30];
const CLICK_BPM_PRESETS = [60, 90, 120, 150];

/** Required warnings (spec Tool 6) — fixed amber list, always visible. */
const WARNINGS = [
  'Very low frequencies can damage loudspeakers, especially at high level.',
  'High frequencies can damage hearing — keep levels low and exposure short.',
  'Start at low volume, every time. Raise it only as far as the task needs.',
  'Never connect the output directly to a power amplifier without understanding the gain structure in between.',
  'Generator output is not a calibrated laboratory reference.',
];

const clampHz = (hz: number) => Math.min(20000, Math.max(20, hz));
/** Trim trailing zeros of a toFixed() string (input always has a decimal point). */
const trim = (s: string) => (s.includes('.') ? s.replace(/\.?0+$/, '') : s);
const fmtHz = (hz: number) =>
  hz >= 1000 ? `${trim((hz / 1000).toFixed(2))} kHz` : `${trim(hz.toFixed(1))} Hz`;
const chipHz = (hz: number) => (hz >= 1000 ? `${trim((hz / 1000).toFixed(1))}k` : `${hz}`);
/** Compact dock-button frequency (~7 mono chars): 1.06k / 440. */
const shortHz = (hz: number) => (hz >= 1000 ? `${trim((hz / 1000).toFixed(2))}k` : `${Math.round(hz)}`);

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

// ---- WAVEFORM DISPLAY (owner 2026-07-31; on the rack stage 2026-08-23) ----
// A synthetic PREVIEW of the signal the controls are building — this screen is
// a pure source with no microphone, so this is an honest illustration (shape
// from SIGNAL, cycle count from FREQUENCY/SWEEP, click count from TEMPO, height
// from LEVEL), NOT a captured measurement. Amplitude is drawn with the house
// MIDI-velocity level ramp (blue at the zero line → red at full scale).
// Height-parametric: the stage grants (w, h) and the plot fills the glass.
const SCOPE_N = 260;

/** Deterministic pseudo-random value in [−1, 1] (stable per index — the noise
 *  preview shouldn't reshuffle on every re-render). */
const hashNoise = (i: number) => {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return 2 * (x - Math.floor(x)) - 1;
};

/** Map a frequency to a representative on-screen cycle count (log scale). */
const cyclesFor = (hz: number) =>
  Math.max(1, Math.min(12, 1 + Math.log10(Math.max(20, hz) / 20) * 2.2));

/** Unit-amplitude (−1..1) sample array illustrating the SHAPE of `mode`. */
function unitShape(
  mode: GenModeName,
  freq: number,
  bpm: number,
  sweepStart: number,
  sweepEnd: number,
): number[] {
  const N = SCOPE_N;
  const out = new Array<number>(N).fill(0);
  const isNoise =
    mode === 'white' || mode === 'pink' || mode === 'brown' || mode === 'blue' || mode === 'violet';

  if (isNoise) {
    const raw = new Array<number>(N);
    for (let i = 0; i < N; i++) raw[i] = hashNoise(i + 1);
    if (mode === 'white') {
      for (let i = 0; i < N; i++) out[i] = raw[i];
    } else if (mode === 'pink') {
      let p = 0; // mild low tilt
      for (let i = 0; i < N; i++) ((p = 0.55 * p + 0.45 * raw[i]), (out[i] = p));
    } else if (mode === 'brown') {
      let b = 0; // strong low tilt — smooth wander
      for (let i = 0; i < N; i++) ((b = 0.86 * b + 0.14 * raw[i]), (out[i] = b));
    } else if (mode === 'blue') {
      for (let i = 0; i < N; i++) out[i] = raw[i] - (raw[i - 1] ?? 0); // high tilt
    } else {
      for (let i = 0; i < N; i++) out[i] = (raw[i] - 2 * (raw[i - 1] ?? 0) + (raw[i - 2] ?? 0)) * 0.6;
    }
    let m = 0;
    for (let i = 0; i < N; i++) m = Math.max(m, Math.abs(out[i]));
    if (m > 0) for (let i = 0; i < N; i++) out[i] /= m; // normalize peak to 1
    return out;
  }

  if (mode === 'click') {
    const clicks = Math.max(2, Math.min(8, Math.round(bpm / 30)));
    for (let c = 0; c < clicks; c++) {
      const center = Math.round(((c + 0.5) / clicks) * (N - 1));
      out[center] = 1;
      if (center - 1 >= 0) out[center - 1] = 0.4;
      if (center + 1 < N) out[center + 1] = -0.3;
    }
    return out;
  }

  if (mode === 'sweepLin' || mode === 'sweepLog') {
    const c0 = cyclesFor(sweepStart);
    const c1 = Math.max(c0 + 0.5, cyclesFor(sweepEnd));
    for (let i = 0; i < N; i++) {
      const x = i / (N - 1);
      const phase =
        mode === 'sweepLin'
          ? 2 * Math.PI * (c0 * x + (c1 - c0) * x * x * 0.5)
          : 2 * Math.PI * ((c0 * (Math.pow(c1 / c0, x) - 1)) / Math.log(c1 / c0));
      out[i] = Math.sin(phase);
    }
    return out;
  }

  // sine / burst
  const cycles = Math.round(cyclesFor(freq) * 1.2);
  for (let i = 0; i < N; i++) {
    const x = i / (N - 1);
    let v = Math.sin(2 * Math.PI * cycles * x);
    if (mode === 'burst') {
      const w = x < 0.15 || x > 0.85 ? 0 : 0.5 - 0.5 * Math.cos((2 * Math.PI * (x - 0.15)) / 0.7);
      v *= w; // Hann-windowed tone burst over the middle ~70%
    }
    out[i] = v;
  }
  return out;
}

const SCOPE_OFF_COLOR = '#7fd4ff'; // COLORS-off: single calm cyan trace

function GenScope({
  mode,
  freq,
  levelDb,
  bpm,
  sweepStart,
  sweepEnd,
  midiColors,
  width,
  height,
}: {
  mode: GenModeName;
  freq: number;
  levelDb: number;
  bpm: number;
  sweepStart: number;
  sweepEnd: number;
  /** COLORS toggle (owner 2026-08-05): MIDI amplitude ramp vs a flat trace. */
  midiColors: boolean;
  /** Glass inner size from the rack stage (never resized during interaction). */
  width: number;
  height: number;
}) {
  // Height tracks LEVEL along the dBFS window (−60…0 → 0…1) so louder = taller
  // = redder, consistent with the meters.
  const amp = Math.max(0, Math.min(1, (levelDb - LEVEL_MIN_DB) / (LEVEL_MAX_DB - LEVEL_MIN_DB)));
  const mid = height / 2;
  const fs = (height / 2) * 0.92; // pixels representing ±full scale (0 dBFS)
  const linePath = useMemo(() => {
    if (width <= 0) return '';
    const pts = unitShape(mode, freq, bpm, sweepStart, sweepEnd);
    let d = '';
    for (let i = 0; i < pts.length; i++) {
      const x = (i / (pts.length - 1)) * width;
      const y = mid - pts[i] * amp * fs;
      d += `${d ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    return d;
  }, [width, mode, freq, amp, bpm, sweepStart, sweepEnd, mid, fs]);

  if (width <= 0) return <View style={{ height }} />;
  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient
          id="genWaveLevel"
          x1={0}
          y1={mid - fs}
          x2={0}
          y2={mid + fs}
          gradientUnits="userSpaceOnUse"
        >
          {WAVE_LEVEL_STOPS.map((s) => (
            <Stop key={s.offset} offset={s.offset} stopColor={s.color} />
          ))}
        </LinearGradient>
      </Defs>
      {/* Metric marks: zero line (MIDI-0 blue) + ±½ full-scale guides. */}
      <Line x1={0} y1={mid - fs / 2} x2={width} y2={mid - fs / 2} stroke="#33343d" strokeWidth={1} strokeDasharray="3 5" />
      <Line x1={0} y1={mid + fs / 2} x2={width} y2={mid + fs / 2} stroke="#33343d" strokeWidth={1} strokeDasharray="3 5" />
      <Line x1={0} y1={mid} x2={width} y2={mid} stroke={MIDLINE_BLUE} strokeWidth={1} />
      {/* Trace: MIDI amplitude ramp, or a flat cyan trace when COLORS off. */}
      <Path
        d={linePath}
        stroke={midiColors ? 'url(#genWaveLevel)' : SCOPE_OFF_COLOR}
        strokeWidth={5}
        fill="none"
        opacity={0.16}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d={linePath}
        stroke={midiColors ? 'url(#genWaveLevel)' : SCOPE_OFF_COLOR}
        strokeWidth={1.8}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function SignalGenScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const tool = toolByKey('signalgen');
  const { help, helpAll, sheet } = useToolHelp('signalgen');
  const { requestAudioOutput } = useAudioOutputGate();

  // Engine gate — computed ONCE (native availability cannot change mid-session).
  // 'idle' = engine build present, generator usable; 'absent'/'spike' render
  // the shared honest EngineGate card.
  const [gate] = useState<EngineState>(() => {
    if (!ApeDsp.isAvailable()) return 'absent';
    return ApeDsp.engineVersion() >= 2 ? 'idle' : 'spike';
  });
  const ready = gate === 'idle';

  const [mode, setMode] = useState<GenModeName>('sine');
  const [freq, setFreq] = useState(1000);
  const [levelDb, setLevelDb] = useState(DEFAULT_LEVEL_DB);
  const [bpm, setBpm] = useState(120);
  const [sweepStart, setSweepStart] = useState(20);
  const [sweepEnd, setSweepEnd] = useState(20000);
  const [sweepSec, setSweepSec] = useState(10);
  const [sweepRepeat, setSweepRepeat] = useState(false);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState<GenStatus | null>(() => (ready ? ApeDsp.genStatus() : null));
  // Native session/route info — for the dev output diagnostics (why is it silent?).
  const [info, setInfo] = useState<ReturnType<typeof ApeDsp.getInfo>>(() => ApeDsp.getInfo());
  const [genError, setGenError] = useState('');
  const [colorsOn, setColorsOn] = useColorModePref(); // waveform MIDI colours, persisted (items 6/7)

  // Push the UI defaults to the native generator once, so the params the user
  // sees are exactly the params the engine holds. If the Q4 cap was already
  // unlocked earlier THIS SESSION, restore the native unlock silently (owner
  // 2026-08-05: per-session, confirm once — no second prompt on re-entry). Level
  // still starts at the safe default regardless.
  useEffect(() => {
    if (!ready) return;
    ApeDsp.genSet({
      mode: GEN_MODES.sine,
      frequency: 1000,
      levelDb: DEFAULT_LEVEL_DB,
      clickBpm: 120,
      sweep: { startHz: 20, endHz: 20000, seconds: 10, repeat: false },
    });
    if (isGenCapUnlockedThisSession()) ApeDsp.genUnlockCap();
    setStatus(ApeDsp.genStatus());
  }, [ready]);

  // Generation guard (fix 2026-08-28): onStart awaits requestAudioOutput() and
  // the native genStart(). Leaving the screen inside that window ran the
  // teardown's genStop() FIRST, so the generator started afterwards and a real
  // tone kept sounding behind a closed screen — the exact thing spec §18
  // forbids. Bumping the generation on teardown makes the late start abort.
  const genRef = useRef(0);

  // Teardown: leaving the screen silences the output AND re-engages the Q4 cap
  // — the unlock is per-session (ruling Q4: "for that session only"; spec §18:
  // no DSP behind a closed screen).
  useEffect(
    () => () => {
      genRef.current++;
      void ApeDsp.genStop();
      ApeDsp.genRelockCap();
    },
    [],
  );

  // Poll genStatus at 2 Hz while running — effectiveLevelDb is the honest
  // output level (the native cap may differ from the requested level). While
  // the generator is actively sounding we also refresh the audio-output idle
  // timer, so a legitimately-running tone is never muted out from under it.
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setStatus(ApeDsp.genStatus());
      setInfo(ApeDsp.getInfo());
      noteAudioActivity();
    }, STATUS_POLL_MS);
    return () => clearInterval(t);
  }, [running]);

  const refreshStatus = () => setStatus(ApeDsp.genStatus());

  const pickMode = (m: GenModeName) => {
    setMode(m);
    ApeDsp.genSet({ mode: GEN_MODES[m] });
    refreshStatus();
  };

  const applyFrequency = (hz: number) => {
    const next = Math.round(clampHz(hz) * 100) / 100;
    setFreq(next);
    ApeDsp.genSet({ frequency: next });
  };

  const pickBpm = (b: number) => {
    setBpm(b);
    ApeDsp.genSet({ clickBpm: b });
  };

  const applySweep = (patch: Partial<{ startHz: number; endHz: number; seconds: number; repeat: boolean }>) => {
    const next = { startHz: sweepStart, endHz: sweepEnd, seconds: sweepSec, repeat: sweepRepeat, ...patch };
    setSweepStart(next.startHz);
    setSweepEnd(next.endHz);
    setSweepSec(next.seconds);
    setSweepRepeat(next.repeat);
    ApeDsp.genSet({ sweep: next });
  };

  const applyLevel = (db: number) => {
    setLevelDb(db);
    ApeDsp.genSet({ levelDb: db });
    refreshStatus();
  };

  const capDb = status?.capDb ?? FALLBACK_CAP_DB;
  const capLocked = !(status?.capUnlocked ?? false);

  // ---- Q4 on the lane: the LEVEL fader moves in the SAME 3 dB steps as the
  // old stepper. While the cap is LOCKED the lane clamps at capDb; pushing
  // past it raises the tap-through confirm — the ONLY path above the cap,
  // exactly once per attempt (the guard ref keeps a drag from stacking
  // alerts). The native path stays hard-capped regardless of what this UI
  // does — the engine, not this handler, is the safety authority. ----
  const capPromptOpen = useRef(false);
  const setLevelFromLane = (v: number) => {
    const steps = Math.round((clamp01(v) * (LEVEL_MAX_DB - LEVEL_MIN_DB)) / LEVEL_STEP_DB);
    const next = Math.min(LEVEL_MAX_DB, LEVEL_MIN_DB + steps * LEVEL_STEP_DB);
    if (next > capDb && capLocked) {
      // Clamp to the highest 3 dB step at/below the cap…
      const clamped = Math.floor(capDb / LEVEL_STEP_DB) * LEVEL_STEP_DB;
      if (clamped !== levelDb) applyLevel(clamped);
      // …and require the Q4 confirm to go further (session-only unlock).
      if (!capPromptOpen.current) {
        capPromptOpen.current = true;
        Alert.alert(
          'Output above the safety cap',
          `Levels above ${capDb} dBFS can be loud. Remove headphones / lower monitor level before continuing.`,
          [
            { text: 'Cancel', style: 'cancel', onPress: () => (capPromptOpen.current = false) },
            {
              text: 'I understand — unlock',
              style: 'destructive',
              onPress: () => {
                capPromptOpen.current = false;
                ApeDsp.genUnlockCap();
                markGenCapUnlockedThisSession(); // remembered for this session (owner 2026-08-05)
                applyLevel(next);
              },
            },
          ],
          { cancelable: true, onDismiss: () => (capPromptOpen.current = false) },
        );
      }
      return;
    }
    if (next !== levelDb) applyLevel(next);
  };

  // Explicit user START only (spec §18) — nothing sounds until this press.
  const onStart = async () => {
    // AUDIO-OUTPUT GATE (owner request 2026-07-25): the generator is real sound
    // output and must stay silent unless output is enabled. Runs the enable flow
    // when muted; a decline leaves the generator stopped. (The Q4 safety cap is
    // independent and still applies once running.)
    const gen = ++genRef.current;
    const ok = await requestAudioOutput();
    if (!ok || gen !== genRef.current) return;
    setGenError('');
    try {
      const s = await ApeDsp.genStart();
      if (gen !== genRef.current) {
        void ApeDsp.genStop(); // screen closed while the native start was in flight
        return;
      }
      setStatus(s);
      setRunning(true);
      noteAudioActivity();
    } catch (e) {
      if (gen !== genRef.current) return;
      setGenError(e instanceof Error ? e.message : String(e));
      setRunning(false);
    }
  };

  const onStop = async () => {
    try {
      await ApeDsp.genStop();
    } finally {
      setRunning(false);
      refreshStatus();
    }
  };

  const isSweep = mode === 'sweepLin' || mode === 'sweepLog';
  const showFreq = mode === 'sine' || mode === 'burst';
  const isClick = mode === 'click';
  const sigLabel = SIGNALS.find((s) => s.key === mode)?.label ?? mode.toUpperCase();

  // ---- Dock declaration (≤5 keys; dynamic by mode — RackUnit reconciles a
  // vanished fader back onto the first live one). FREQ is the pre-bound
  // teaching param; LEVEL keeps the honest dBFS wording + level tint. ----
  const params: DockParam[] = [];
  if (showFreq) {
    params.push({
      kind: 'fader',
      id: 'freq',
      label: 'FREQ',
      value: freqToSlider(freq),
      onChange: (v) => applyFrequency(sliderToFreq(v)),
      format: () => fmtHz(freq),
      formatShort: () => shortHz(freq),
      tint: colors.gold,
      helpKey: 'frequency',
    });
  }
  params.push({
    kind: 'fader',
    id: 'level',
    label: 'LEVEL',
    value: (levelDb - LEVEL_MIN_DB) / (LEVEL_MAX_DB - LEVEL_MIN_DB),
    onChange: setLevelFromLane,
    format: () => `${levelDb} dBFS`,
    formatShort: () => `${levelDb}`,
    tint: levelColorForDb(levelDb),
    helpKey: 'output_level',
  });
  params.push({
    kind: 'options',
    id: 'signal',
    label: 'SIGNAL',
    valueLabel: sigLabel,
    options: SIGNALS.map((s) => ({ id: s.key, label: s.label, blurb: s.blurb })),
    selectedId: mode,
    onSelect: (id) => pickMode(id as GenModeName),
    sticky: true, // A/B signals while the preview redraws
    helpKey: 'signal',
  });
  if (showFreq) {
    // ISO presets + the ±1-semitone FINE stepper share one sticky group tray —
    // the stepper's precision affordance survives OFF the scroller.
    params.push({
      kind: 'group',
      id: 'preset',
      label: 'PRESET',
      valueLabel: shortHz(freq),
      helpKey: 'frequency',
      render: () => (
        <View style={{ gap: 10 }}>
          <Text style={styles.subHead}>FINE — ±1 SEMITONE (×2^1/12)</Text>
          <View style={styles.stepperRow}>
            <Pressable
              style={styles.stepBtn}
              onPress={() => applyFrequency(freq / SEMITONE)}
              accessibilityRole="button"
              accessibilityLabel="Frequency down one semitone"
            >
              <Text style={styles.stepBtnText}>−</Text>
            </Pressable>
            <Text style={styles.freqReadout}>{fmtHz(freq)}</Text>
            <Pressable
              style={styles.stepBtn}
              onPress={() => applyFrequency(freq * SEMITONE)}
              accessibilityRole="button"
              accessibilityLabel="Frequency up one semitone"
            >
              <Text style={styles.stepBtnText}>+</Text>
            </Pressable>
          </View>
          <Text style={styles.subHead}>ISO PRESETS</Text>
          <View style={styles.chipRow}>
            {ISO_PRESETS_HZ.map((hz) => (
              <Chip key={hz} label={chipHz(hz)} selected={freq === hz} onPress={() => applyFrequency(hz)} />
            ))}
          </View>
          <Text style={styles.caption}>Fader 63 Hz–6 kHz · fine steps ±1 semitone (×2^1/12) · presets to 16 kHz</Text>
        </View>
      ),
    });
  }
  if (isSweep) {
    // SWEEP start · end · duration · repeat co-visible (spec Tool 6).
    params.push({
      kind: 'group',
      id: 'sweep',
      label: 'SWEEP',
      valueLabel: `${chipHz(sweepStart)}→${chipHz(sweepEnd)}`,
      helpKey: 'sweep',
      render: () => (
        <View style={{ gap: 10 }}>
          <Text style={styles.sweepSummary}>
            {fmtHz(sweepStart)} → {fmtHz(sweepEnd)} · {sweepSec} s · {sweepRepeat ? 'repeating' : 'single pass'}
          </Text>
          <Text style={styles.subHead}>START</Text>
          <View style={styles.chipRow}>
            {SWEEP_START_PRESETS_HZ.map((hz) => (
              <Chip key={hz} label={chipHz(hz)} selected={sweepStart === hz} onPress={() => applySweep({ startHz: hz })} />
            ))}
          </View>
          <Text style={styles.subHead}>END</Text>
          <View style={styles.chipRow}>
            {SWEEP_END_PRESETS_HZ.map((hz) => (
              <Chip key={hz} label={chipHz(hz)} selected={sweepEnd === hz} onPress={() => applySweep({ endHz: hz })} />
            ))}
          </View>
          <Text style={styles.subHead}>DURATION</Text>
          <View style={styles.chipRow}>
            {SWEEP_DURATIONS_SEC.map((s) => (
              <Chip key={s} label={`${s}s`} selected={sweepSec === s} onPress={() => applySweep({ seconds: s })} />
            ))}
            <Chip label="REPEAT" selected={sweepRepeat} onPress={() => applySweep({ repeat: !sweepRepeat })} />
          </View>
        </View>
      ),
    });
  }
  if (isClick) {
    params.push({
      kind: 'options',
      id: 'tempo',
      label: 'TEMPO',
      valueLabel: `${bpm} BPM`,
      options: CLICK_BPM_PRESETS.map((b) => ({ id: String(b), label: `${b} BPM` })),
      selectedId: String(bpm),
      onSelect: (id) => pickBpm(Number(id)),
      sticky: true,
      helpKey: 'click_tempo',
    });
  }
  // START/STOP — the transport, exact old semantics (output gate on start;
  // stop always allowed), as the dock's LED key.
  params.push({
    kind: 'toggle',
    id: 'run',
    label: running ? 'STOP' : 'START',
    value: running,
    onToggle: () => {
      void (running ? onStop() : onStart());
    },
    helpKey: 'status',
  });

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={{ flexShrink: 1, flexGrow: 1 }}>
          <Text style={styles.title}>{tool.name.toUpperCase()}</Text>
          <Text style={styles.subtitle}>{tool.subtitle ?? 'Test-Signal Source'}</Text>
        </View>
        <AccuracyNote compact detail="Test tones play through your phone’s uncalibrated speaker/output — the frequency is exact, the LEVEL is not. For calibrated output use dedicated signal-generation gear." />
      </View>

      {!ready ? (
        // Honest not-ready card — never a dead control surface (no rack frame,
        // no dock keys, nothing that looks operable).
        <View style={styles.gateWrap}>
          <EngineGate state={gate} />
        </View>
      ) : (
        <RackUnit
          initialParam="freq"
          params={params}
          onHelp={(k) => {
            if (k) help(k);
          }}
          stage={{
            size: 'M',
            // Honesty line verbatim (never SPL; calibration does not exist).
            badge: 'dBFS · uncalibrated approximate — digital output level, not dB SPL',
            onGuide: helpAll,
            bezel: [
              { k: 'SIGNAL', v: sigLabel, flex: 1.2, helpKey: 'signal' },
              isSweep
                ? { k: 'SWEEP', v: `${chipHz(sweepStart)}→${chipHz(sweepEnd)}`, flex: 1.2, helpKey: 'sweep' }
                : isClick
                  ? { k: 'TEMPO', v: `${bpm} BPM`, flex: 1.2, helpKey: 'click_tempo' }
                  : showFreq
                    ? { k: 'FREQ', v: fmtHz(freq), flex: 1.2, helpKey: 'frequency' }
                    : { k: 'FREQ', v: 'BROADBAND', flex: 1.2, helpKey: 'signal' },
              {
                k: 'OUT',
                // The HONEST level actually leaving the output path (Q4).
                v: status ? `${status.effectiveLevelDb.toFixed(1)} dBFS` : '—',
                tint: levelColorForDb(status?.effectiveLevelDb),
                flex: 1.4,
                helpKey: 'status',
              },
              {
                k: 'GEN',
                v: running ? 'RUN' : 'STOP',
                tint: running ? colors.greenBright : '#7a7f8a',
                flex: 0.9,
                helpKey: 'status',
              },
            ],
            render: (w, h) => (
              // No tap-glass action: this tool never had a tap-the-display
              // idiom — START/STOP stays an explicit press (spec §18).
              <GenScope
                mode={mode}
                freq={freq}
                levelDb={levelDb}
                bpm={bpm}
                sweepStart={sweepStart}
                sweepEnd={sweepEnd}
                midiColors={colorsOn}
                width={w}
                height={h}
              />
            ),
          }}
        >
          {/* ── WELL: reading only — legend, status diagnostics, notices. ── */}
          <View style={styles.waveHeadRow}>
            <HelpHead title="WAVEFORM" onHelp={() => help('signal')} style={styles.sectionHead} />
            <Pressable
              style={[styles.colorsBtn, colorsOn && styles.colorsBtnOn]}
              onPress={() => setColorsOn(!colorsOn)}
              accessibilityRole="button"
              accessibilityState={{ selected: colorsOn }}
              accessibilityLabel="Toggle MIDI amplitude colours on the waveform"
            >
              <Text style={[styles.colorsBtnText, colorsOn && styles.colorsBtnTextOn]}>COLORS</Text>
            </Pressable>
          </View>
          <Text style={styles.caption}>
            Illustrative view of the generated signal — shape from SIGNAL, cycles from FREQUENCY/SWEEP,
            height from LEVEL. Not a microphone capture.
          </Text>

          {/* Status — the HONEST output level from the native path (Q4). */}
          <Pressable style={styles.statusCard} onLongPress={() => help('status')} delayLongPress={260}>
            <View style={styles.statusRow}>
              <Text style={[styles.statusState, running && styles.statusStateRunning]}>
                {running ? 'RUNNING' : 'STOPPED'}
              </Text>
              {capLocked ? (
                <View style={styles.capBadge}>
                  <Text style={styles.capBadgeText}>CAP {capDb} dBFS</Text>
                </View>
              ) : null}
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>OUTPUT</Text>
              <Text style={styles.statusValue}>
                {status ? `${status.effectiveLevelDb.toFixed(1)} dBFS` : '—'}
              </Text>
            </View>
            {/* DEV output diagnostics (why is it silent?) — hidden in production. */}
            {__DEV__ ? (
              <>
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>ROUTE</Text>
                  <Text style={styles.statusValue}>{info?.outputRoute || info?.routeName || '—'}</Text>
                </View>
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>SESSION</Text>
                  <Text style={styles.statusValue}>
                    {info
                      ? `${info.running ? 'capture ON' : 'idle'} · ${info.measurementMode ? 'MEASUREMENT' : 'default'}`
                      : '—'}
                  </Text>
                </View>
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>PULLS</Text>
                  <Text style={styles.statusValue}>{info?.genRenderPulls ?? '— (needs new build)'}</Text>
                </View>
                {status?.genHpfHz != null ? (
                  <View style={styles.statusRow}>
                    <Text style={styles.statusLabel}>SPEAKER HPF</Text>
                    <Text style={styles.statusValue}>
                      {status.genHpfEngaged ? `${Math.round(status.genHpfHz)} Hz` : 'off'}
                    </Text>
                  </View>
                ) : null}
                {info?.lastError ? (
                  <View style={styles.statusRow}>
                    <Text style={styles.statusLabel}>LAST ERROR</Text>
                    <Text style={styles.statusValue}>{info.lastError}</Text>
                  </View>
                ) : null}
              </>
            ) : null}
            <Text style={styles.caption}>dBFS · uncalibrated approximate — digital output level, not dB SPL · hold for help</Text>
            {genError ? <Text style={styles.errorText}>Generator error: {genError}</Text> : null}
          </Pressable>

          <Text style={styles.caption}>
            LEVEL moves in 3 dB steps · −60…0 dBFS · default −20 · above {capDb} dBFS requires the safety confirm
          </Text>

          {/* Required warnings (spec Tool 6) — fixed, at the BOTTOM of the
              well (owner tools rule: notices at bottom). */}
          <HelpHead title="SAFETY" onHelp={() => help('safety')} style={styles.sectionHead} />
          {WARNINGS.map((w) => (
            <Text key={w} style={styles.warn}>
              {'⚠ '}
              {w}
            </Text>
          ))}
        </RackUnit>
      )}
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
  gateWrap: { padding: 16 },

  sectionHead: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 13,
    letterSpacing: 1.8,
    color: colors.amberLabel,
    marginTop: 6,
  },
  subHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.textSub, marginTop: 4 },
  caption: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },

  // WAVEFORM legend row + [COLORS] toggle (owner 2026-08-05).
  waveHeadRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  colorsBtn: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    backgroundColor: '#161616',
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginTop: 6,
  },
  colorsBtnOn: { borderColor: colors.green, backgroundColor: '#0d1710' },
  colorsBtnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.textSecondary },
  colorsBtnTextOn: { color: colors.green },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  chipSelected: { borderColor: 'rgba(255,198,77,.65)', backgroundColor: '#1a1409' },
  chipText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1, color: colors.textSecondary },
  chipTextSelected: { color: colors.amber },

  stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  stepBtn: {
    width: 46,
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    backgroundColor: '#161616',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 22, color: colors.textSecondary, marginTop: -2 },
  freqReadout: { fontFamily: fonts.mono, fontSize: 28, color: colors.gold },
  sweepSummary: { fontFamily: fonts.mono, fontSize: 15, color: colors.textSecondary },

  statusCard: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    padding: 12,
    gap: 8,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  statusState: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 1.6, color: colors.textSub },
  statusStateRunning: { color: colors.greenBright },
  statusLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.textSub },
  statusValue: { fontFamily: fonts.mono, fontSize: 24, color: colors.gold },
  capBadge: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,180,0,.55)',
    backgroundColor: '#1a1409',
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  capBadgeText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.amber },
  errorText: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18, color: '#ff8d7a' },

  // Amber warning lines (house style — same as the live-tool quality warnings).
  warn: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18.5, color: colors.amber },
});
