/**
 * SignalGenScreen — Tone & Noise Generator LIVE (spec of record
 * APE_AUDIO_TOOLS_SPEC_2026_07_23.md Tool 6; output-cap RULING Q4 in
 * MEASUREMENT_TOOLS_RULINGS_Q1_Q5_2026_07_09_v1.md; engine build 2026-07-23).
 *
 * A signal SOURCE, not a meter — it drives the ApeDsp generator directly and
 * needs NO microphone, so it deliberately skips useDspEngine. Engine gating:
 * availability + engineVersion() are computed ONCE; below the engine build the
 * screen renders the honest EngineGate card ('absent'/'spike') — no fake
 * control surface, no simulated output (measurement-tools §1.7).
 *
 * Q4 safety UX — the core of this screen:
 *  - level stepper −60…0 dBFS in 3 dB steps, default −20 dBFS;
 *  - the NATIVE output path hard-caps at −12 dBFS while locked (the cap lives
 *    in the engine, not in this UI — the UI merely fronts it honestly);
 *  - stepping above the cap requires the tap-through confirm ("Remove
 *    headphones / lower monitor level before continuing") → genUnlockCap(),
 *    which unlocks for this session only;
 *  - the status card ALWAYS shows genStatus().effectiveLevelDb — the honest
 *    level actually leaving the output path — labeled dBFS · uncalibrated
 *    (never SPL: calibration does not exist), with a CAP badge while locked;
 *  - leaving the screen stops the generator AND re-locks the cap.
 */
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ApeDsp, GEN_MODES, type GenModeName, type GenStatus } from '../../../modules/ape-dsp';
import { GlassButton } from '../../components/GlassButton';
import { useAudioOutputGate } from '../../features/audio/AudioOutputGate';
import { noteAudioActivity } from '../../features/audio/audioOutputStore';
import { EngineGate } from './EngineGate';
import type { EngineState } from '../../features/tools/engine/useDspEngine';
import { MIDLINE_BLUE, WAVE_LEVEL_STOPS } from '../../features/tools/levelColor';
import { isGenCapUnlockedThisSession, markGenCapUnlockedThisSession } from '../../features/tools/genCapSession';
import { useColorModePref } from '../../features/tools/colorModePref';
import { colors, fonts } from '../../theme/tokens';
import { AccuracyNote } from '../../components/AccuracyNote';
import { toolByKey } from './toolsData';
import { DragSlider } from '../lab/foundations/bits';
import { useToolHelp, HelpHead } from '../../features/lab/guidedLessons';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'SignalGen'>;

// ---- Q4 level constants (native is authoritative; genStatus() reports the
// live capDb/defaultLevelDb — these are UI fallbacks + stepper geometry). ----
const LEVEL_MIN_DB = -60;
const LEVEL_MAX_DB = 0;
const LEVEL_STEP_DB = 3;
const DEFAULT_LEVEL_DB = -20; // Q4 safe default
const FALLBACK_CAP_DB = -12; // Q4 hard cap

const SEMITONE = 2 ** (1 / 12); // fine frequency step ×2^(1/12)
const STATUS_POLL_MS = 500; // 2 Hz — status scalars only, far inside the ≤30 Hz bridge rule

// Frequency slider (owner 2026-08-05): a continuous log sweep 63 Hz → 6 kHz.
const FREQ_SLIDER_MIN = 63;
const FREQ_SLIDER_MAX = 6000;
const FREQ_SLIDER_RATIO = FREQ_SLIDER_MAX / FREQ_SLIDER_MIN;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
/** Current frequency → slider position 0..1 (log), clamped to the slider span. */
const freqToSlider = (hz: number) =>
  clamp01(Math.log(hz / FREQ_SLIDER_MIN) / Math.log(FREQ_SLIDER_RATIO));
/** Slider position 0..1 → frequency (log), rounded to whole Hz. */
const sliderToFreq = (v: number) => Math.round(FREQ_SLIDER_MIN * Math.pow(FREQ_SLIDER_RATIO, clamp01(v)));

/** Signal chips (spec Tool 6 required modes; keys must exist in GEN_MODES). */
const SIGNALS: { key: GenModeName; label: string }[] = [
  { key: 'sine', label: 'SINE' },
  { key: 'white', label: 'WHITE' },
  { key: 'pink', label: 'PINK' },
  { key: 'brown', label: 'BROWN' },
  { key: 'blue', label: 'BLUE' },
  { key: 'violet', label: 'VIOLET' },
  { key: 'sweepLin', label: 'SWEEP LIN' },
  { key: 'sweepLog', label: 'SWEEP LOG' },
  { key: 'click', label: 'CLICK' },
  { key: 'burst', label: 'BURST' },
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

// ---- WAVEFORM DISPLAY (owner 2026-07-31) --------------------------------
// A synthetic PREVIEW of the signal the controls are building — this screen is
// a pure source with no microphone, so this is an honest illustration (shape
// from SIGNAL, cycle count from FREQUENCY/SWEEP, click count from TEMPO, height
// from LEVEL), NOT a captured measurement. Amplitude is drawn with the house
// MIDI-velocity level ramp (blue at the zero line → red at full scale).
const SCOPE_H = 96;
const SCOPE_N = 260;
const SCOPE_FS = (SCOPE_H / 2) * 0.92; // pixels representing ±full scale (0 dBFS)

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
}: {
  mode: GenModeName;
  freq: number;
  levelDb: number;
  bpm: number;
  sweepStart: number;
  sweepEnd: number;
  /** COLORS toggle (owner 2026-08-05): MIDI amplitude ramp vs a flat trace. */
  midiColors: boolean;
}) {
  const [w, setW] = useState(0);
  // Height tracks LEVEL along the dBFS window (−60…0 → 0…1) so louder = taller
  // = redder, consistent with the meters.
  const amp = Math.max(0, Math.min(1, (levelDb - LEVEL_MIN_DB) / (LEVEL_MAX_DB - LEVEL_MIN_DB)));
  const mid = SCOPE_H / 2;
  const linePath = useMemo(() => {
    if (w <= 0) return '';
    const pts = unitShape(mode, freq, bpm, sweepStart, sweepEnd);
    let d = '';
    for (let i = 0; i < pts.length; i++) {
      const x = (i / (pts.length - 1)) * w;
      const y = mid - pts[i] * amp * SCOPE_FS;
      d += `${d ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    return d;
  }, [w, mode, freq, amp, bpm, sweepStart, sweepEnd, mid]);

  return (
    <View style={styles.scopePanel}>
      <View style={{ width: '100%' }} onLayout={(e) => setW(Math.round(e.nativeEvent.layout.width))}>
        {w > 0 ? (
          <Svg width={w} height={SCOPE_H}>
            <Defs>
              <LinearGradient
                id="genWaveLevel"
                x1={0}
                y1={mid - SCOPE_FS}
                x2={0}
                y2={mid + SCOPE_FS}
                gradientUnits="userSpaceOnUse"
              >
                {WAVE_LEVEL_STOPS.map((s) => (
                  <Stop key={s.offset} offset={s.offset} stopColor={s.color} />
                ))}
              </LinearGradient>
            </Defs>
            {/* Metric marks: zero line (MIDI-0 blue) + ±½ full-scale guides. */}
            <Line x1={0} y1={mid - SCOPE_FS / 2} x2={w} y2={mid - SCOPE_FS / 2} stroke="#33343d" strokeWidth={1} strokeDasharray="3 5" />
            <Line x1={0} y1={mid + SCOPE_FS / 2} x2={w} y2={mid + SCOPE_FS / 2} stroke="#33343d" strokeWidth={1} strokeDasharray="3 5" />
            <Line x1={0} y1={mid} x2={w} y2={mid} stroke={MIDLINE_BLUE} strokeWidth={1} />
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
        ) : (
          <View style={{ height: SCOPE_H }} />
        )}
      </View>
      <Text style={styles.caption}>
        Illustrative view of the generated signal — shape from SIGNAL, cycles from FREQUENCY/SWEEP,
        height from LEVEL. Not a microphone capture.
      </Text>
    </View>
  );
}

export function SignalGenScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const tool = toolByKey('signalgen');
  const { help, sheet } = useToolHelp('signalgen');
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
  const [genError, setGenError] = useState('');
  const [colorsOn, setColorsOn] = useColorModePref(); // waveform MIDI colours, persisted (items 6/7)
  const [scrollEnabled, setScrollEnabled] = useState(true); // released while dragging the freq slider

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

  // Teardown: leaving the screen silences the output AND re-engages the Q4 cap
  // — the unlock is per-session (ruling Q4: "for that session only"; spec §18:
  // no DSP behind a closed screen).
  useEffect(
    () => () => {
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

  const stepLevel = (dir: 1 | -1) => {
    const next = Math.min(LEVEL_MAX_DB, Math.max(LEVEL_MIN_DB, levelDb + dir * LEVEL_STEP_DB));
    if (next === levelDb) return;
    if (next > capDb && capLocked) {
      // Q4 tap-through confirm — the ONLY path above the cap, session-only.
      Alert.alert(
        'Output above the safety cap',
        `Levels above ${capDb} dBFS can be loud. Remove headphones / lower monitor level before continuing.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'I understand — unlock',
            style: 'destructive',
            onPress: () => {
              ApeDsp.genUnlockCap();
              markGenCapUnlockedThisSession(); // remembered for this session (owner 2026-08-05)
              applyLevel(next);
            },
          },
        ],
      );
      return;
    }
    applyLevel(next);
  };

  // Explicit user START only (spec §18) — nothing sounds until this press.
  const onStart = async () => {
    // AUDIO-OUTPUT GATE (owner request 2026-07-25): the generator is real sound
    // output and must stay silent unless output is enabled. Runs the enable flow
    // when muted; a decline leaves the generator stopped. (The Q4 safety cap is
    // independent and still applies once running.)
    const ok = await requestAudioOutput();
    if (!ok) return;
    setGenError('');
    try {
      const s = await ApeDsp.genStart();
      setStatus(s);
      setRunning(true);
      noteAudioActivity();
    } catch (e) {
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

      <ScrollView contentContainerStyle={styles.scroll} scrollEnabled={scrollEnabled}>
        {!ready ? (
          // Honest not-ready card — never a dead control surface.
          <EngineGate state={gate} />
        ) : (
          <>
            {/* FREQUENCY — above the waveform (owner 2026-08-05). Applies to
                sine/burst: stepper · sweep slider 63 Hz–6 kHz · ISO presets. */}
            {showFreq ? (
              <>
                <HelpHead title="FREQUENCY" onHelp={() => help('frequency')} style={styles.sectionHead} />
                <View style={styles.card}>
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
                  <DragSlider
                    value={freqToSlider(freq)}
                    onChange={(v) => applyFrequency(sliderToFreq(v))}
                    label="SWEEP 63 Hz – 6 kHz"
                    readout={fmtHz(freq)}
                    tint={colors.gold}
                    onHelp={() => help('frequency')}
                    onDragActive={(active) => setScrollEnabled(!active)}
                  />
                  <View style={styles.chipRow}>
                    {ISO_PRESETS_HZ.map((hz) => (
                      <Chip key={hz} label={chipHz(hz)} selected={freq === hz} onPress={() => applyFrequency(hz)} />
                    ))}
                  </View>
                  <Text style={styles.caption}>Slider 63 Hz–6 kHz · fine steps ±1 semitone (×2^1/12) · presets to 16 kHz</Text>
                </View>
              </>
            ) : null}

            {/* WAVEFORM — live preview of the signal the controls are building,
                with the [COLORS] MIDI-amplitude toggle (owner 2026-08-05). */}
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
            <GenScope
              mode={mode}
              freq={freq}
              levelDb={levelDb}
              bpm={bpm}
              sweepStart={sweepStart}
              sweepEnd={sweepEnd}
              midiColors={colorsOn}
            />

            {/* SIGNAL selection — below the display (owner 2026-08-05). */}
            <HelpHead title="SIGNAL" onHelp={() => help('signal')} style={styles.sectionHead} />
            <View style={styles.chipRow}>
              {SIGNALS.map((s) => (
                <Chip key={s.key} label={s.label} selected={mode === s.key} onPress={() => pickMode(s.key)} />
              ))}
            </View>

            {/* SWEEP controls (spec Tool 6: start · end · duration · repeat). */}
            {isSweep ? (
              <>
                <HelpHead title="SWEEP" onHelp={() => help('sweep')} style={styles.sectionHead} />
                <View style={styles.card}>
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
              </>
            ) : null}

            {/* CLICK tempo (spec Tool 6: configurable BPM). */}
            {isClick ? (
              <>
                <HelpHead title="CLICK TEMPO" onHelp={() => help('click_tempo')} style={styles.sectionHead} />
                <View style={styles.card}>
                  <View style={styles.chipRow}>
                    {CLICK_BPM_PRESETS.map((b) => (
                      <Chip key={b} label={`${b} BPM`} selected={bpm === b} onPress={() => pickBpm(b)} />
                    ))}
                  </View>
                </View>
              </>
            ) : null}

            {/* OUTPUT LEVEL — the Q4 safety stepper. */}
            <HelpHead title="OUTPUT LEVEL" onHelp={() => help('output_level')} style={styles.sectionHead} />
            <View style={styles.card}>
              <View style={styles.stepperRow}>
                <Pressable
                  style={styles.stepBtn}
                  onPress={() => stepLevel(-1)}
                  accessibilityRole="button"
                  accessibilityLabel="Level down 3 dB"
                >
                  <Text style={styles.stepBtnText}>−</Text>
                </Pressable>
                <View style={styles.levelMid}>
                  <Text style={styles.levelReadout}>{levelDb} dBFS</Text>
                  <Text style={styles.caption}>requested · uncalibrated approximate</Text>
                </View>
                <Pressable
                  style={styles.stepBtn}
                  onPress={() => stepLevel(1)}
                  accessibilityRole="button"
                  accessibilityLabel="Level up 3 dB"
                >
                  <Text style={styles.stepBtnText}>+</Text>
                </Pressable>
              </View>
              <Text style={styles.caption}>
                3 dB steps · −60…0 dBFS · default −20 · above {capDb} dBFS requires the safety confirm
              </Text>
            </View>

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
              <Text style={styles.caption}>dBFS · uncalibrated approximate — digital output level, not dB SPL · hold for help</Text>
              {genError ? <Text style={styles.errorText}>Generator error: {genError}</Text> : null}
            </Pressable>

            <GlassButton
              label={running ? 'STOP' : 'START'}
              tint={tool.tint}
              height={58}
              fontSize={18}
              onPress={() => {
                void (running ? onStop() : onStart());
              }}
            />

            {/* Required warnings (spec Tool 6) — fixed, always visible. */}
            <HelpHead title="SAFETY" onHelp={() => help('safety')} style={styles.sectionHead} />
            {WARNINGS.map((w) => (
              <Text key={w} style={styles.warn}>
                {'⚠ '}
                {w}
              </Text>
            ))}
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

  sectionHead: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 13,
    letterSpacing: 1.8,
    color: colors.amberLabel,
    marginTop: 6,
  },
  subHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.textSub, marginTop: 4 },
  caption: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },

  // WAVEFORM header row + [COLORS] toggle (owner 2026-08-05).
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

  card: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    padding: 12,
    gap: 10,
  },

  // Waveform preview panel (owner 2026-07-31) — dark plot well + caption.
  scopePanel: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#0c0c0f',
    padding: 10,
    gap: 6,
  },

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
  levelMid: { flex: 1, alignItems: 'center', gap: 2 },
  levelReadout: { fontFamily: fonts.mono, fontSize: 26, color: colors.textPrimary },
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
