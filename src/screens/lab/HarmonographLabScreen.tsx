/**
 * HarmonographLabScreen — Lab 16 "Harmonograph" (v4 MASTER §7) on the shared
 * LabShell. Frequency ratios ↔︎ musical intervals, made visible AND audible.
 *
 * LAYOUT v2 (owner 2026-07-29): collapsible READOUTS → DISPLAY → CONTROLS →
 * ACTIONS sections; PLAY INTERVAL is the compact HeaderPlayButton via
 * LabShell's headerAction (disabled under detune / pre-v3 engines, same
 * honesty rules as before); the shell renders the Guided-Lesson entry row.
 *
 * FIGURE (analytic by nature): damped sinusoids drive the pen —
 *   x(t) = sin(n₁θ + φ)·e^(−kθ) · y(t) = sin(n₂(1+Δ)θ)·e^(−kθ)  (lateral)
 * plus a counter-rotating ROTARY variant. Deterministic path math (T1,
 * compute ~zero) rendered as a handful of phosphor-styled SVG path segments
 * (visual standards 2026-07-29). Visual standards addendum: the figure DRAWS
 * ITSELF on every selection change — a native strokeDashoffset reveal walks
 * the pen along the full trace over ~3 s, then holds. The 8-segment phosphor
 * styling (hot pen cooling to ember) is unchanged — the reveal rides on top.
 *
 * AUDIO (honest, real): "drive it from two oscillators" — a locked ratio n₁:n₂
 * plays as harmonics n₁ and n₂ of a shared 110 Hz fundamental through the v3
 * ADDITIVE engine (H2+H3 of 110 Hz = 220+330 Hz = a real 3:2 fifth). Because
 * the additive engine renders EXACT integer harmonics:
 *   - locked ratios sound end-to-end (v3),
 *   - DETUNE is visual-only (the near-miss precession lesson) — audio is
 *     disabled under detune with the reason stated, never an untrue stand-in,
 *   - engine v2/absent states the interval audio needs the v3 build (§1.7).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Circle, Defs, G, Line, Path, RadialGradient, Rect, Stop, Text as SvgText } from 'react-native-svg';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { ApeDsp, GEN_MODES, type GenParams } from '../../../modules/ape-dsp';
import { useAudioOutputGate } from '../../features/audio/AudioOutputGate';
import { noteAudioActivity } from '../../features/audio/audioOutputStore';
import { guardAdditiveForEngine, speakerGuardDb, SPEAKER_HPF_HZ } from '../../features/audio/speakerSafety';
import { GuidedLessonSheet, getLabLesson } from '../../features/lab/guidedLessons';
import { EngineGate } from '../tools/EngineGate';
import type { EngineState } from '../../features/tools/engine/useDspEngine';
import { colors, fonts } from '../../theme/tokens';
import { LabShell, LabChip, HeaderPlayButton } from './LabShell';

const GEN_LEVEL_DB = -20;
const ACTIVITY_MS = 500;
const BASE_F0 = 110; // Hz — harmonics n₁/n₂ of this sound the interval

// Oscillator FREQUENCY range (owner 2026-08-23): each arm sweeps LOG from
// 0.1 Hz up to the 8th harmonic (880 Hz). Below ~110 Hz is real harmonograph
// pendulum territory (sub-audio, visual only); integer harmonics 1..8 still
// land in the range as the audible "sweet spots" and the ratio chips snap to
// them exactly. Harmonic number n = hz / BASE_F0 (may be fractional/tiny).
const OSC_F_MIN = 0.1;
const OSC_F_MAX = 8 * BASE_F0; // 880 Hz
const oscFreqFromPos = (v: number) =>
  OSC_F_MIN * Math.pow(OSC_F_MAX / OSC_F_MIN, Math.max(0, Math.min(1, v)));
const oscPosFromFreq = (hz: number) =>
  Math.log(Math.max(OSC_F_MIN, hz) / OSC_F_MIN) / Math.log(OSC_F_MAX / OSC_F_MIN);
const fmtHz = (hz: number) => `${hz >= 100 ? Math.round(hz) : hz >= 1 ? hz.toFixed(1) : hz.toFixed(2)} Hz`;

/** Ratio-locked intervals (n₁:n₂ = harmonic numbers of BASE_F0). */
const RATIOS: { n1: number; n2: number; label: string; interval: string }[] = [
  { n1: 1, n2: 1, label: '1:1', interval: 'UNISON' },
  { n1: 2, n2: 1, label: '2:1', interval: 'OCTAVE' },
  { n1: 3, n2: 2, label: '3:2', interval: 'PERFECT 5TH' },
  { n1: 4, n2: 3, label: '4:3', interval: 'PERFECT 4TH' },
  { n1: 5, n2: 4, label: '5:4', interval: 'MAJOR 3RD' },
];

const PHASES = [0, 45, 90] as const;
const DAMPINGS = [
  { key: 'light', label: 'LIGHT', endAmp: 0.55 },
  { key: 'medium', label: 'MEDIUM', endAmp: 0.25 },
  { key: 'heavy', label: 'HEAVY', endAmp: 0.06 },
] as const;
const DETUNES = [
  { key: 0, label: 'LOCKED RATIO' },
  { key: 0.01, label: '+1%' },
  { key: 0.03, label: '+3%' },
] as const;

const INTRO =
  'A virtual harmonograph: two damped oscillations drive the pen. Simple integer ' +
  'frequency ratios draw stable closed figures — and those same ratios are the musical ' +
  'intervals. Lock a ratio, watch the figure, and hear the interval it draws.';

export function HarmonographLabScreen() {
  const { requestAudioOutput } = useAudioOutputGate();

  const [gate] = useState<EngineState>(() => {
    if (!ApeDsp.isAvailable()) return 'absent';
    return ApeDsp.engineVersion() >= 2 ? 'idle' : 'spike';
  });
  const engineReady = gate === 'idle';
  const additiveReady = engineReady && ApeDsp.engineVersion() >= 3;
  // engineVersion ≥ 5: native STEREO output — play the interval HARD-PANNED
  // (harmonic n1 → Left, n2 → Right, matching the XY figure). Below v5 fall back
  // to the mono additive mixture.
  const stereoReady = engineReady && ApeDsp.engineVersion() >= 5;

  // Each oscillator's frequency as a harmonic number of BASE_F0 (owner
  // 2026-08-05): the sliders drive these directly; the ratio chips are presets.
  const [n1, setN1] = useState(3); // 3:2 — the fifth
  const [n2, setN2] = useState(2);
  const [phase, setPhase] = useState<(typeof PHASES)[number]>(90);
  const [dampKey, setDampKey] = useState<(typeof DAMPINGS)[number]['key']>('medium');
  const [rotary, setRotary] = useState(false);
  const [detune, setDetune] = useState<(typeof DETUNES)[number]['key']>(0);
  const [running, setRunning] = useState(false);
  const [genError, setGenError] = useState('');

  const [lessonKey, setLessonKey] = useState<string | undefined>(undefined);
  const [lessonOpen, setLessonOpen] = useState(false);
  const openLesson = useCallback((key?: string) => {
    setLessonKey(key);
    setLessonOpen(true);
  }, []);

  // Oscillator frequencies sweep CONTINUOUSLY (owner 2026-08-05); the integers
  // 1..8 are the "sweet spots" where the figure closes and the additive audio
  // is an exact harmonic. Between them the figure precesses like the detune
  // lesson.
  const nearInt = (x: number) => Math.abs(x - Math.round(x)) < 0.03;
  const fmtN = (x: number) => (nearInt(x) ? String(Math.round(x)) : x.toFixed(2));
  // Oscillator readout: Hz + the "×N harmonic" tag only on a real sweet spot
  // (integer ≥ 1); otherwise the "(between)" precession cue.
  const oscReadout = (hz: number, n: number) =>
    `${fmtHz(hz)}${nearInt(n) && Math.round(n) >= 1 ? ` · ×${Math.round(n)}` : ' (between)'}`;
  // Match a named interval by the RATIO n1:n2 at ANY scale (owner 2026-08-23) —
  // so a 3:2 reads as "Perfect 5th" whether it's 330:220 Hz or a slow 3:2 Hz
  // pendulum pair. 2% relative tolerance.
  const matched = RATIOS.find((r) => n2 > 0 && Math.abs(n1 / n2 - r.n1 / r.n2) <= (r.n1 / r.n2) * 0.02);
  // Real, audible integer harmonics (1..) — the only state that truthfully
  // sounds through the additive engine.
  const bothHarmonic = nearInt(n1) && nearInt(n2) && Math.round(n1) >= 1 && Math.round(n2) >= 1;
  // Figure "closes" on a clean small-integer ratio (scale-independent).
  const isExact = matched != null && detune === 0;
  // Audio may sound only on real integer harmonics with the ratio locked —
  // never for a sub-audio pendulum pair (honesty rule).
  const playable = additiveReady && detune === 0 && bothHarmonic;
  const ratio = {
    n1,
    n2,
    // On a named interval → its label; otherwise the live ratio as "R : 1"
    // (fmtN reads "0" for sub-integer arms, so never build "n1:n2" here).
    label: matched?.label ?? (n2 > 0 ? `${(n1 / n2).toFixed(2)} : 1` : '—'),
    interval: matched?.interval ?? 'CUSTOM RATIO',
  };
  const damping = DAMPINGS.find((d) => d.key === dampKey)!;

  // -- Interval audio (v3 additive; locked ratios only) ----------------------
  const genRef = useRef(0);

  /** [f0, a1..a12, p1..p12] with amps at the two ratio harmonics. */
  const intervalPayload = useCallback((n1: number, n2: number): number[] => {
    const amps = new Array(12).fill(0);
    // The additive engine renders EXACT integer harmonics, so round each
    // oscillator to its nearest harmonic for the mono path (the FIGURE still
    // uses the continuous value; the stereo path plays the exact frequencies).
    const i1 = Math.min(12, Math.max(1, Math.round(n1)));
    const i2 = Math.min(12, Math.max(1, Math.round(n2)));
    amps[i1 - 1] = 1;
    amps[i2 - 1] = 1; // unison (i1===i2) just sets the one harmonic
    return [BASE_F0, ...amps, ...new Array(12).fill(0)];
  }, []);

  /** GenParams for the interval: HARD-PANNED stereo on v5+ (harmonic n1 → Left,
   *  n2 → Right — the XY figure as audio), else the mono additive mixture (with
   *  the JS speaker guard below v4). The native route-aware HPF (v4+) protects
   *  each channel, so no client filter is applied on the stereo path. */
  const intervalGenParams = useCallback(
    (n1: number, n2: number): GenParams =>
      stereoReady
        ? { mode: GEN_MODES.sine, stereo: { on: true, fL: n1 * BASE_F0, fR: n2 * BASE_F0 }, levelDb: GEN_LEVEL_DB }
        : { mode: GEN_MODES.additive, additive: guardAdditiveForEngine(intervalPayload(n1, n2)), levelDb: GEN_LEVEL_DB },
    [stereoReady, intervalPayload],
  );

  const startInterval = useCallback(async () => {
    // Only sound real integer-harmonic pairs (never a sub-audio pendulum pair).
    if (!additiveReady || detune !== 0 || !bothHarmonic) return;
    const gen = ++genRef.current;
    const ok = await requestAudioOutput();
    if (!ok || gen !== genRef.current) return;
    setGenError('');
    ApeDsp.genSet(intervalGenParams(ratio.n1, ratio.n2));
    try {
      await ApeDsp.genStart();
      if (gen !== genRef.current) {
        void ApeDsp.genStop();
        return;
      }
      setRunning(true);
      noteAudioActivity();
    } catch (e) {
      if (gen === genRef.current) setGenError(e instanceof Error ? e.message : String(e));
    }
  }, [additiveReady, detune, bothHarmonic, requestAudioOutput, intervalGenParams, ratio]);

  const stopInterval = useCallback(() => {
    genRef.current++;
    void ApeDsp.genStop();
    // Clear the (global) stereo flag so the next mono tool doesn't inherit the
    // hard-panned dual-oscillator (no-op below v5).
    ApeDsp.genSet({ stereo: { on: false, fL: BASE_F0, fR: BASE_F0 } });
    setRunning(false);
  }, []);

  useFocusEffect(useCallback(() => () => stopInterval(), [stopInterval]));
  useEffect(() => {
    if (!running) return;
    const id = setInterval(noteAudioActivity, ACTIVITY_MS);
    return () => clearInterval(id);
  }, [running]);

  // Retune the interval audio to a new (n1,n2), or stop it if the new pair is
  // not a real integer-harmonic pair (never fake a tone for a slow/off-grid
  // pendulum pair — honesty rule).
  const retuneOrStop = (a: number, b: number) => {
    if (!running) return;
    if (nearInt(a) && nearInt(b) && Math.round(a) >= 1 && Math.round(b) >= 1) {
      ApeDsp.genSet(intervalGenParams(a, b));
      noteAudioActivity();
    } else {
      stopInterval();
    }
  };
  // Ratio chip: KEEP OSC 1 (your speed), set OSC 2 to form the interval ratio
  // n1:n2 at the current scale (owner 2026-08-23). detune silences separately.
  const pickRatio = (i: number) => {
    const r = RATIOS[i];
    const nn2 = n1 * (r.n2 / r.n1);
    setN2(nn2);
    retuneOrStop(n1, nn2);
  };
  // Slider-driven oscillator frequency (harmonic number; may be fractional).
  const setOsc = (which: 1 | 2, nn: number) => {
    const a = which === 1 ? nn : n1;
    const b = which === 2 ? nn : n2;
    if (which === 1) setN1(nn);
    else setN2(nn);
    retuneOrStop(a, b);
  };
  const pickDetune = (d: (typeof DETUNES)[number]['key']) => {
    setDetune(d);
    if (d !== 0 && running) stopInterval(); // audio can't honestly follow a detuned ratio
  };

  const hz1 = ratio.n1 * BASE_F0;
  const hz2 = ratio.n2 * BASE_F0;

  // ── RACK UNIT pilot (APE_LAB_UX_PROPOSAL 2026-08-23, owner-approved) ──────
  // The figure + its readouts pin on the stage/bezel; the oscillator sliders
  // become the pre-bound lane ("tap the legend, ride the fader"); the ratio
  // and detune collections become STICKY trays (A/B while the figure redraws);
  // phase/damping/mode share one group tray. Only the teaching prose scrolls.
  return (
    <LabShell
      labId="harmonograph"
      title="HARMONOGRAPH LAB"
      subtitle="Frequency Ratios · Intervals · Beating"
      intro={INTRO}
      exploreCaption="Lock a ratio and watch the figure — then detune slightly and watch it precess: that drift is beating."
      headerAction={
        <HeaderPlayButton
          playing={running}
          disabled={!playable}
          onPress={() => (running ? stopInterval() : void startInterval())}
          label={running ? 'Stop' : 'Play interval'}
        />
      }
      rack={{
        initialParam: 'osc1',
        onHelp: openLesson,
        stage: {
          size: 'L', // the figure IS the lab — earns the tall glass
          badge: 'DETERMINISTIC FIGURE — FROM THE EQUATIONS',
          onGuide: () => openLesson('display'),
          bezel: [
            { k: 'RATIO', v: ratio.label, helpKey: 'ratio_lock' },
            { k: 'INTERVAL', v: ratio.interval, flex: 1.6, helpKey: 'ratio_lock' },
            { k: 'OSC 1', v: fmtHz(hz1), tint: ARM_X, helpKey: 'ratio_lock' },
            { k: 'OSC 2', v: fmtHz(hz2), tint: ARM_Y, helpKey: 'ratio_lock' },
          ],
          render: (_w, h) => (
            // Tapping the display toggles play/stop (owner 2026-07-31) — same
            // gate as the header button (needs v3, no detune, real harmonics).
            <Pressable
              onPress={
                playable || running
                  ? () => (running ? stopInterval() : void startInterval())
                  : undefined
              }
              accessibilityRole="button"
              accessibilityLabel={running ? 'Tap to stop' : 'Tap to play interval'}
            >
              <HarmonographFigure
                n1={ratio.n1}
                n2={ratio.n2}
                hz1={hz1}
                hz2={hz2}
                phaseDeg={phase}
                endAmp={damping.endAmp}
                rotary={rotary}
                detune={detune}
                height={h}
              />
            </Pressable>
          ),
        },
        params: [
          {
            kind: 'fader',
            id: 'osc1',
            label: 'OSC 1',
            // Log frequency sweep 0.1 Hz → 880 Hz (owner 2026-08-23).
            value: oscPosFromFreq(hz1),
            onChange: (v) => setOsc(1, oscFreqFromPos(v) / BASE_F0),
            // Lane/drag-tag get the full readout (harmonic multiple when on a
            // sweet spot, else the "(between)" cue); the dock key gets Hz only.
            format: () => oscReadout(hz1, n1),
            formatShort: () => fmtHz(hz1),
            tint: ARM_X,
            helpKey: 'ratio_lock',
          },
          {
            kind: 'fader',
            id: 'osc2',
            label: 'OSC 2',
            value: oscPosFromFreq(hz2),
            onChange: (v) => setOsc(2, oscFreqFromPos(v) / BASE_F0),
            format: () => oscReadout(hz2, n2),
            formatShort: () => fmtHz(hz2),
            tint: ARM_Y,
            helpKey: 'ratio_lock',
          },
          {
            kind: 'options',
            id: 'ratio',
            label: 'RATIO',
            valueLabel: ratio.label,
            options: RATIOS.map((r) => ({ id: r.label, label: `${r.label} ${r.interval}` })),
            selectedId: matched?.label ?? null,
            onSelect: (id) => {
              const i = RATIOS.findIndex((r) => r.label === id);
              if (i >= 0) pickRatio(i);
            },
            sticky: true, // A/B intervals while the figure redraws — the lesson
            helpKey: 'ratio_lock',
          },
          {
            kind: 'group',
            id: 'shape',
            label: 'SHAPE',
            // All three states stay visible on the key (φ · damping initial ·
            // R when rotary) — no hidden state behind a closed tray.
            valueLabel: `${phase}°·${damping.label[0]}${rotary ? '·R' : ''}`,
            helpKey: 'phase',
            render: () => (
              <View style={{ gap: 10 }}>
                <Text style={styles.sectionHead}>PHASE</Text>
                <View style={styles.chipRow}>
                  {PHASES.map((p) => (
                    <LabChip
                      key={p}
                      label={`φ ${p}°`}
                      selected={phase === p}
                      onPress={() => setPhase(p)}
                      onLongPress={() => openLesson('phase')}
                    />
                  ))}
                </View>
                <Text style={styles.sectionHead}>DAMPING · MODE</Text>
                <View style={styles.chipRow}>
                  {DAMPINGS.map((d) => (
                    <LabChip
                      key={d.key}
                      label={d.label}
                      selected={dampKey === d.key}
                      onPress={() => setDampKey(d.key)}
                      onLongPress={() => openLesson('damping')}
                    />
                  ))}
                  <LabChip
                    label={rotary ? 'ROTARY' : 'LATERAL'}
                    selected={rotary}
                    onPress={() => setRotary((v) => !v)}
                    onLongPress={() => openLesson('mode')}
                  />
                </View>
              </View>
            ),
          },
          {
            kind: 'options',
            id: 'detune',
            label: 'DETUNE',
            valueLabel: detune === 0 ? 'LOCK' : `+${detune * 100}%`,
            options: DETUNES.map((d) => ({ id: String(d.key), label: d.label })),
            selectedId: String(detune),
            onSelect: (id) => {
              const d = DETUNES.find((x) => String(x.key) === id);
              if (d) pickDetune(d.key);
            },
            sticky: true, // watch the precession start while comparing
            helpKey: 'ratio_lock',
          },
        ],
      }}
    >
      {!engineReady ? <EngineGate state={gate} /> : null}

      <View style={{ gap: 6 }}>
        <Text style={styles.sectionHead}>WHAT YOU’RE SEEING</Text>
        <Text style={styles.caption}>
          {isExact
            ? bothHarmonic
              ? `Harmonics ${Math.round(n1)} and ${Math.round(n2)} of ${BASE_F0} Hz — an exact ${ratio.label} ratio; the figure closes.`
              : `A clean ${ratio.label} ratio (${ratio.interval.toLowerCase()}) — the figure closes. Both arms sit below hearing, so it draws but doesn’t sound.`
            : detune !== 0
              ? `Detuned +${detune * 100}% — the near-miss never closes; the slow precession IS beating.`
              : `Between simple ratios — the figure precesses and never quite closes, just like a slight detune.`}
        </Text>
      </View>

      <View style={{ gap: 6 }}>
        <Text style={styles.sectionHead}>SWEET SPOTS</Text>
        <Text style={styles.caption}>
          Integers 1–8 are the sweet spots — the figure closes and the tone is an exact harmonic.
          Sweep OSC 1 or OSC 2 between them and the figure precesses, just like a slight detune.
          Use the RATIO chips to snap back to an exact interval.
        </Text>
        <Text style={styles.sectionHead}>REAL-TIME SWINGS</Text>
        <Text style={styles.caption}>
          The pen swings at the true frequency you set: 1 Hz is one full swing per second, 0.1 Hz one
          swing every ten seconds. Down at 0.1–a-few Hz you’re in real harmonograph pendulum
          territory — slow, watchable, and below hearing, so it draws but doesn’t sound. Up in the
          audible range the arms swing far too fast to see, so the figure fills in at once and you
          hear the interval instead.
        </Text>
      </View>

      <View style={{ gap: 6 }}>
        <Text style={styles.sectionHead}>THE INTERVAL, AS SOUND</Text>
        {/* DRIVE FROM OSCILLATORS — real interval audio (v3 additive only);
            the play/stop control itself is the header ▶. */}
        {engineReady ? (
          additiveReady ? (
            detune !== 0 ? (
              <Text style={styles.caption}>
                Audio pauses under detune — the additive engine renders exact integer harmonics, so a
                detuned ratio cannot sound truthfully. Re-lock the ratio to play the interval.
              </Text>
            ) : !bothHarmonic ? (
              <Text style={styles.caption}>
                Both arms are below the audio range (real harmonograph pendulum speeds), so the figure
                draws but does not sound. Land both on integer harmonics (1–8) — a RATIO chip with
                OSC 1 on a whole number, or the sweet spots — to hear the interval.
              </Text>
            ) : (
              <>
                <Text style={styles.caption}>
                  {stereoReady
                    ? `PLAY (header ▶) is HARD-PANNED STEREO — ${Math.round(hz1)} Hz on LEFT, ${Math.round(hz2)} Hz on RIGHT (harmonics ${Math.round(n1)} & ${Math.round(n2)} of ${BASE_F0} Hz), an exact ${ratio.label} ratio. The XY figure as sound: X-drive left, Y-drive right — headphones split it cleanly.`
                    : `PLAY (header ▶) sounds harmonics ${Math.round(n2)} and ${Math.round(n1)} of ${BASE_F0} Hz through the additive engine — an exact ${ratio.label} ratio. Output ${GEN_LEVEL_DB} dBFS · uncalibrated.`}
                </Text>
                <Text style={styles.advisory}>
                  {`Speaker high-pass (${SPEAKER_HPF_HZ} Hz): the ${hz2} Hz tone is attenuated ${speakerGuardDb(hz2).toFixed(1)} dB` +
                    `${ratio.n1 !== ratio.n2 ? `, the ${hz1} Hz tone ${speakerGuardDb(hz1).toFixed(1)} dB` : ''}. ` +
                    `Use headphones for the full interval.`}
                </Text>
                {genError ? <Text style={styles.error}>{genError}</Text> : null}
              </>
            )
          ) : (
            <Text style={styles.caption}>
              Interval audio needs the v3 additive engine — this dev build predates it. The figure and
              lessons work fully; install the v3 build to hear the ratios.
            </Text>
          )
        ) : null}
      </View>

      <GuidedLessonSheet
        visible={lessonOpen}
        lesson={getLabLesson('harmonograph')}
        controlKey={lessonKey}
        onClose={() => setLessonOpen(false)}
      />
    </LabShell>
  );
}

/** Phosphor style-steps along the trace (visual standards 2026-07-29): the pen
 *  starts HOT — near-white amber — and cools into a dim ember as the damping
 *  bleeds energy away, so hue+opacity shift WITH the decay. The 3000-point
 *  trace is sliced into these ≤8 polyline segments (not per-point elements);
 *  each segment is a wide low-opacity glow stroke under a crisp core stroke. */
const TRACE_STEPS = [
  { color: '#fff6dc', coreO: 0.95, glowO: 0.28 },
  { color: '#ffe9ad', coreO: 0.92, glowO: 0.24 },
  { color: '#ffd970', coreO: 0.88, glowO: 0.2 },
  { color: '#ffc64d', coreO: 0.82, glowO: 0.16 },
  { color: '#f7ae35', coreO: 0.72, glowO: 0.13 },
  { color: '#e3922a', coreO: 0.6, glowO: 0.1 },
  { color: '#c47722', coreO: 0.48, glowO: 0.07 },
  { color: '#9c5e1e', coreO: 0.36, glowO: 0.05 },
] as const;

/** How long the pen takes to walk the full trace on a selection change. Slowed
 *  (owner 2026-08-05) so the figure EMERGES rather than snapping in. */
// The pen draws in REAL TIME (owner 2026-08-23): the slower arm swings at its
// actual Hz — 1 Hz = one end-to-end-and-back per second, 0.1 Hz = one per 10 s.
// The figure spans BASE_TURNS turns of the slower arm, so the full reveal takes
// BASE_TURNS / slowerHz seconds (≈24 s at 1 Hz, ~4 min at 0.1 Hz; a few ms at
// the audio-range harmonics, which are far too fast to watch — you hear them).
const BASE_TURNS = 24;
/** Rotary-table spin period (one full paper rotation). */
const TABLE_MS = 9000;

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedLine = Animated.createAnimatedComponent(Line);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedText = Animated.createAnimatedComponent(SvgText);
const AnimatedG = Animated.createAnimatedComponent(G);

const ARM_X = '#4fd0e0'; // X oscillator arm (cyan)
const ARM_Y = '#b48bff'; // Y oscillator arm (violet)

/** One phosphor pass (glow or core) of one trace segment, revealed by the
 *  shared draw progress: segment i becomes visible across the progress window
 *  [i/count, (i+1)/count] via a native strokeDashoffset sweep — the classic
 *  self-drawing-path technique, zero JS per-frame work. The +4 offset while a
 *  segment is still unstarted hides the round-cap dot at its first point. */
function TracePass({
  d,
  len,
  idx,
  count,
  progress,
  color,
  width,
  opacity,
}: {
  d: string;
  len: number;
  idx: number;
  count: number;
  progress: SharedValue<number>;
  color: string;
  width: number;
  opacity: number;
}) {
  const animatedProps = useAnimatedProps(() => {
    const local = Math.min(Math.max(progress.value * count - idx, 0), 1);
    return { strokeDashoffset: len * (1 - local) + (local <= 0 ? 4 : 0) };
  });
  return (
    <AnimatedPath
      d={d}
      stroke={color}
      strokeWidth={width}
      strokeOpacity={opacity}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      strokeDasharray={`${len.toFixed(1)} ${len.toFixed(1)}`}
      animatedProps={animatedProps}
    />
  );
}

/** The damped figure — same equations as ever (~3000 points, memoized, only
 *  recomputed on a control change); the 2026-07-29 retrofit changed RENDERING
 *  only: phosphor glow+core passes over a radial-fade disc with a styled
 *  axis/center hint (the pen's rest point). 2026-07-29 (later): the figure
 *  DRAWS ITSELF — a strokeDashoffset reveal walks the trace over ~3 s on every
 *  selection change (and on mount), then holds. */
function HarmonographFigure({
  n1,
  n2,
  hz1,
  hz2,
  phaseDeg,
  endAmp,
  rotary,
  detune,
  height,
}: {
  n1: number;
  n2: number;
  hz1: number;
  hz2: number;
  phaseDeg: number;
  endAmp: number;
  rotary: boolean;
  detune: number;
  /** Rendered height (Rack Unit stage glass) — the square 320 viewBox scales
   *  to fit; the figure's own #0c0c0f ground matches the glass, so letterbox
   *  margins read as more glass. Default = the legacy 320. */
  height?: number;
}) {
  const SIZE = 320;
  const M = 160; // downsampled pen path for the animated drive arms
  const { segs, penX, penY } = useMemo(() => {
    const C = BASE_TURNS; // base cycles drawn
    const N = 3000;
    const thetaMax = 2 * Math.PI * C;
    const k = -Math.log(endAmp) / thetaMax;
    const phi = (phaseDeg * Math.PI) / 180;
    // The figure is a function of the RATIO n1:n2, not the absolute harmonic
    // numbers — a 3:2 is a 3:2 whether the arms are 330:220 Hz or 3:2 Hz
    // pendulums (owner 2026-08-23). Normalize by the slower arm so the pen
    // always draws C full turns of the pattern at any absolute speed; without
    // this, low-Hz arms (n≪1) barely complete a swing and the figure flattens.
    const mn = Math.max(1e-9, Math.min(n1, n2));
    const ax = n1 / mn;
    const ay = (n2 * (1 + detune)) / mn;
    const cx = SIZE / 2;
    const r = SIZE / 2 - 12;
    const xs = new Array<number>(N + 1);
    const ys = new Array<number>(N + 1);
    const pts: string[] = new Array(N + 1);
    for (let i = 0; i <= N; i++) {
      const th = (i / N) * thetaMax;
      const env = Math.exp(-k * th);
      let x: number;
      let y: number;
      if (rotary) {
        x = 0.5 * (Math.sin(ax * th + phi) + Math.sin(ay * th)) * env;
        y = 0.5 * (Math.cos(ax * th + phi) - Math.cos(ay * th)) * env;
      } else {
        x = Math.sin(ax * th + phi) * env;
        y = Math.sin(ay * th) * env;
      }
      xs[i] = cx + x * r;
      ys[i] = cx - y * r;
      pts[i] = `${xs[i].toFixed(1)} ${ys[i].toFixed(1)}`;
    }
    // Slice into TRACE_STEPS segments; adjacent segments share their boundary
    // point so the polyline stays continuous. Each segment also carries its
    // arc length for the dashoffset reveal.
    const per = Math.floor(N / TRACE_STEPS.length);
    const segList = TRACE_STEPS.map((_, sIdx) => {
      const a = sIdx * per;
      const b = sIdx === TRACE_STEPS.length - 1 ? N : (sIdx + 1) * per;
      let d = `M${pts[a]}`;
      let len = 0;
      for (let i = a + 1; i <= b; i++) {
        d += `L${pts[i]}`;
        len += Math.hypot(xs[i] - xs[i - 1], ys[i] - ys[i - 1]);
      }
      return { d, len: Math.max(len, 1) };
    });
    // Downsampled pen path — the drive arms + pen tip ride this at the reveal
    // progress, so the arms are literally drawing the trace.
    const penX = new Array<number>(M);
    const penY = new Array<number>(M);
    for (let j = 0; j < M; j++) {
      const i = Math.round((j / (M - 1)) * N);
      penX[j] = xs[i];
      penY[j] = ys[i];
    }
    return { segs: segList, penX, penY };
  }, [n1, n2, phaseDeg, endAmp, rotary, detune]);

  // REAL-TIME reveal: the slower arm swings at its actual Hz. The trace spans
  // BASE_TURNS turns of the slower arm, so the full draw takes
  // BASE_TURNS / slowerHz seconds. Clamp the slower arm to the 0.1 Hz floor.
  const slowerHz = Math.max(OSC_F_MIN, Math.min(hz1, hz2));
  const drawMs = (BASE_TURNS / slowerHz) * 1000;
  // The pen: 0 → 1 walks the whole trace, restarted whenever the figure or the
  // real-time rate changes, then HOLDS at 1.
  const progress = useSharedValue(0);
  useEffect(() => {
    cancelAnimation(progress);
    progress.value = 0;
    progress.value = withTiming(1, { duration: drawMs, easing: Easing.linear });
    return () => cancelAnimation(progress);
  }, [segs, drawMs, progress]);

  // Rotary paper/table spin — a real harmonograph turns the paper in rotary
  // mode; the table rotates under the trace to show it shaping the figure.
  const spin = useSharedValue(0);
  useEffect(() => {
    cancelAnimation(spin);
    spin.value = 0;
    if (rotary) {
      spin.value = withRepeat(withTiming(360, { duration: TABLE_MS, easing: Easing.linear }), -1, false);
    }
    return () => cancelAnimation(spin);
  }, [rotary, spin]);

  const c = SIZE / 2;
  const lastIdx = M - 1;
  // The two perpendicular drive arms + the pen tip + each arm's live Hz label,
  // all riding the reveal progress along the downsampled pen path.
  const armHProps = useAnimatedProps(() => {
    const j = Math.round(progress.value * lastIdx);
    return { x1: 8, y1: penY[j], x2: penX[j], y2: penY[j] };
  });
  const armVProps = useAnimatedProps(() => {
    const j = Math.round(progress.value * lastIdx);
    return { x1: penX[j], y1: 8, x2: penX[j], y2: penY[j] };
  });
  const penProps = useAnimatedProps(() => {
    const j = Math.round(progress.value * lastIdx);
    return { cx: penX[j], cy: penY[j] };
  });
  const labXProps = useAnimatedProps(() => {
    const j = Math.round(progress.value * lastIdx);
    return { y: penY[j] - 5 };
  });
  const labYProps = useAnimatedProps(() => {
    const j = Math.round(progress.value * lastIdx);
    return { x: penX[j] + 7 };
  });
  const tableProps = useAnimatedProps(() => ({ rotation: spin.value }));

  return (
    <Svg width="100%" height={height ?? SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
      <Defs>
        <RadialGradient id="hgDisc" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#221b0e" stopOpacity={1} />
          <Stop offset="62%" stopColor="#161208" stopOpacity={0.9} />
          <Stop offset="100%" stopColor="#0c0c0f" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect x={0} y={0} width={SIZE} height={SIZE} rx={10} fill="#0c0c0f" />
      {/* Radial-fade disc — the figure floats on a faint warm pool of light. */}
      <Circle cx={c} cy={c} r={c - 4} fill="url(#hgDisc)" />
      {/* Rotary paper/table: spins under the trace so you see the figure being
          drawn ON a turning surface (rotary mode only). */}
      {rotary ? (
        <AnimatedG originX={c} originY={c} animatedProps={tableProps}>
          <Circle cx={c} cy={c} r={c - 18} fill="none" stroke="#2a2412" strokeWidth={1} />
          <Circle cx={c} cy={c} r={c - 42} fill="none" stroke="#231e11" strokeWidth={1} />
          {Array.from({ length: 24 }).map((_, i) => {
            const a = (i / 24) * 2 * Math.PI;
            const r0 = c - 18;
            const r1 = c - 11;
            return (
              <Line
                key={i}
                x1={c + Math.cos(a) * r0}
                y1={c + Math.sin(a) * r0}
                x2={c + Math.cos(a) * r1}
                y2={c + Math.sin(a) * r1}
                stroke="#3a3118"
                strokeWidth={1}
              />
            );
          })}
        </AnimatedG>
      ) : null}
      {/* Axis + center hint: the pen's rest point and the swing axes. */}
      <Line x1={c} y1={14} x2={c} y2={SIZE - 14} stroke="#282213" strokeWidth={1} />
      <Line x1={14} y1={c} x2={SIZE - 14} y2={c} stroke="#282213" strokeWidth={1} />
      <Circle cx={c} cy={c} r={c - 12} fill="none" stroke="#1f1b10" strokeWidth={1} />
      <Circle cx={c} cy={c} r={2} fill="#4a3f24" />
      {/* Phosphor pass 1 — wide, soft glow under the whole trace. */}
      {segs.map((s, i) => (
        <TracePass
          key={`glow${i}`}
          d={s.d}
          len={s.len}
          idx={i}
          count={segs.length}
          progress={progress}
          color={TRACE_STEPS[i].color}
          width={3.4}
          opacity={TRACE_STEPS[i].glowO}
        />
      ))}
      {/* Phosphor pass 2 — the crisp core stroke. */}
      {segs.map((s, i) => (
        <TracePass
          key={`core${i}`}
          d={s.d}
          len={s.len}
          idx={i}
          count={segs.length}
          progress={progress}
          color={TRACE_STEPS[i].color}
          width={0.9}
          opacity={TRACE_STEPS[i].coreO}
        />
      ))}
      {/* The two drive arms meeting the pen at 90°, the pen tip, and each arm's
          live Hz readout (owner 2026-08-05). */}
      <AnimatedLine animatedProps={armHProps} stroke={ARM_X} strokeWidth={1.6} strokeOpacity={0.85} strokeLinecap="round" />
      <AnimatedLine animatedProps={armVProps} stroke={ARM_Y} strokeWidth={1.6} strokeOpacity={0.85} strokeLinecap="round" />
      <AnimatedCircle animatedProps={penProps} r={3.2} fill="#fff6dc" />
      <AnimatedText x={10} animatedProps={labXProps} fill={ARM_X} fontSize={10} fontFamily={fonts.oswaldSemiBold}>
        {`${Math.round(hz1)} Hz`}
      </AnimatedText>
      <AnimatedText y={13} animatedProps={labYProps} textAnchor="middle" fill={ARM_Y} fontSize={10} fontFamily={fonts.oswaldSemiBold}>
        {`${Math.round(hz2)} Hz`}
      </AnimatedText>
    </Svg>
  );
}

const styles = StyleSheet.create({
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sectionHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1.5, color: colors.amber },
  caption: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
  advisory: { fontFamily: fonts.barlowMedium, fontSize: 12, lineHeight: 16, color: colors.amber },
  error: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: '#ff6b5e' },
  readMain: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, letterSpacing: 0.6, color: colors.textPrimary },
  panelCard: {
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    padding: 12,
  },
  badge: { fontFamily: fonts.oswaldSemiBold, fontSize: 9.5, letterSpacing: 1.2, color: colors.textSub },
});
