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
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ApeDsp, GEN_MODES, type GenParams } from '../../../modules/ape-dsp';
import { useAudioOutputGate } from '../../features/audio/AudioOutputGate';
import { noteAudioActivity } from '../../features/audio/audioOutputStore';
import { guardAdditiveForEngine, speakerGuardDb, SPEAKER_HPF_HZ } from '../../features/audio/speakerSafety';
import { GuidedLessonSheet, getLabLesson } from '../../features/lab/guidedLessons';
import { EngineGate } from '../tools/EngineGate';
import type { EngineState } from '../../features/tools/engine/useDspEngine';
import { colors, fonts } from '../../theme/tokens';
import { LabShell, LabChip, HeaderPlayButton } from './LabShell';
import { HarmonographMachine, INK_DEFAULT, drawTurns } from './HarmonographMachine';
import { HarmonographViewer } from './HarmonographViewer';

const GEN_LEVEL_DB = -20;
const ACTIVITY_MS = 500;
const BASE_F0 = 110; // Hz — harmonics n₁/n₂ of this sound the interval

// Oscillator FREQUENCY range (owner 2026-08-23, tightened same day): each
// pendulum sweeps LOG from 0.5 Hz to 10 Hz — real machine territory (a built
// harmonograph runs ~0.5–1 Hz; past 10 the arms were just blur). The machine
// always draws at the true pendulum speed; the RATIO between the arms names
// the interval, and PLAY renders that ratio audibly as harmonics of BASE_F0
// (the pendulums themselves are below hearing).
const OSC_F_MIN = 0.5;
const OSC_F_MAX = 10;
const oscFreqFromPos = (v: number) =>
  OSC_F_MIN * Math.pow(OSC_F_MAX / OSC_F_MIN, Math.max(0, Math.min(1, v)));
const oscPosFromFreq = (hz: number) =>
  Math.log(Math.max(OSC_F_MIN, hz) / OSC_F_MIN) / Math.log(OSC_F_MAX / OSC_F_MIN);
// PLAT lane: full-left = STATIONARY (0 Hz — the platform pendulum hangs
// centred, owner 2026-08-23), then the same log sweep.
const PLAT_OFF_ZONE = 0.07;
const platFreqFromPos = (v: number) =>
  v <= PLAT_OFF_ZONE ? 0 : oscFreqFromPos((v - PLAT_OFF_ZONE) / (1 - PLAT_OFF_ZONE));
const platPosFromFreq = (hz: number) =>
  hz <= 0 ? 0 : PLAT_OFF_ZONE + oscPosFromFreq(hz) * (1 - PLAT_OFF_ZONE);
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

  // Each oscillator stored as n = hz / BASE_F0 (fractional at pendulum speeds).
  // Opening defaults (owner 2026-08-23): 1.5 Hz : 1.0 Hz (3:2 — perfect fifth),
  // φ 90°, MEDIUM damping, ROTARY, detune +1% — a rich precessing rose drawing
  // itself the moment the lab opens.
  const [n1, setN1] = useState(1.5 / BASE_F0);
  const [n2, setN2] = useState(1.0 / BASE_F0);
  // OSC 3 = the paper platform's own pendulum (owner 2026-08-23: the platform
  // rotation is a separate control, not OSC 2's job). ROTARY only.
  const [n3, setN3] = useState(1.0 / BASE_F0);
  const [phase, setPhase] = useState<(typeof PHASES)[number]>(90);
  const [dampKey, setDampKey] = useState<(typeof DAMPINGS)[number]['key']>('medium');
  const [rotary, setRotary] = useState(true);
  const [detune, setDetune] = useState<(typeof DETUNES)[number]['key']>(0.01);
  const [running, setRunning] = useState(false);
  const [genError, setGenError] = useState('');
  // FREEZE holds the machine mid-draw; ⟲ NEW pulls a fresh sheet (owner
  // 2026-08-23 — device parity with the browser mock's NEW DRAWING).
  const [frozen, setFrozen] = useState(false);
  const [epoch, setEpoch] = useState(0);
  // Member ink colour (customization rule: entitlement-gated colour wheel).
  const [inkColor, setInkColor] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const freezeFracRef = useRef(1);

  const [lessonKey, setLessonKey] = useState<string | undefined>(undefined);
  const [lessonOpen, setLessonOpen] = useState(false);
  const openLesson = useCallback((key?: string) => {
    setLessonKey(key);
    setLessonOpen(true);
  }, []);

  // Match a named interval by the RATIO n1:n2 at ANY scale (owner 2026-08-23) —
  // a 3:2 reads as "Perfect 5th" whether the pendulums run 1.5:1.0 Hz or
  // 99:66 Hz. 2% relative tolerance.
  const matchRatio = (a: number, b: number) =>
    RATIOS.find((r) => b > 0 && Math.abs(a / b - r.n1 / r.n2) <= (r.n1 / r.n2) * 0.02);
  const matched = matchRatio(n1, n2);
  // Figure "closes" on a clean small-integer ratio (scale-independent).
  const isExact = matched != null && detune === 0;
  // PLAY renders the MATCHED ratio as harmonics of BASE_F0 (the pendulums are
  // below hearing) — a clean ratio + locked detune is what can sound honestly.
  const playable = additiveReady && detune === 0 && matched != null;
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
    // PLAY = the MATCHED ratio rendered as harmonics of BASE_F0 (the pendulums
    // themselves are below hearing); only a clean, locked ratio sounds.
    if (!additiveReady || detune !== 0 || !matched) return;
    const gen = ++genRef.current;
    const ok = await requestAudioOutput();
    if (!ok || gen !== genRef.current) return;
    setGenError('');
    ApeDsp.genSet(intervalGenParams(matched.n1, matched.n2));
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
  }, [additiveReady, detune, matched, requestAudioOutput, intervalGenParams]);

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

  // Retune the interval audio to the new pair's MATCHED ratio (as harmonics of
  // BASE_F0), or stop if the ratio is no longer clean — never fake a tone.
  const retuneOrStop = (a: number, b: number) => {
    if (!running) return;
    const m = matchRatio(a, b);
    if (m && detune === 0) {
      ApeDsp.genSet(intervalGenParams(m.n1, m.n2));
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
  const hz3 = n3 * BASE_F0;
  // REAL-TIME draw (owner 2026-08-23): the machine's slower pendulum swings at
  // its true Hz (the platform counts too in ROTARY), and the drawing runs
  // until the pen SETTLES (turn count derives from the damping).
  const slowerHz = Math.max(
    OSC_F_MIN,
    rotary && hz3 > 0 ? Math.min(hz1, hz2, hz3) : Math.min(hz1, hz2),
  );
  const drawMs = (drawTurns(damping.endAmp) / slowerHz) * 1000;
  const newDrawing = () => {
    setFrozen(false);
    setEpoch((e) => e + 1);
  };
  // ⟲ RESET (glass corner): back to the opening defaults + a fresh sheet.
  // Member ink stays — customization isn't a setting of the machine.
  const resetAll = () => {
    setN1(1.5 / BASE_F0);
    setN2(1.0 / BASE_F0);
    setN3(1.0 / BASE_F0);
    setPhase(90);
    setDampKey('medium');
    setRotary(true);
    setDetune(0.01);
    if (running) stopInterval();
    newDrawing();
  };

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
          badge: 'RIGID-BODY MACHINE — DRAWN FROM THE EQUATIONS',
          onGuide: () => openLesson('display'),
          // OSC readouts now live ON the machine (each pendulum wears its own
          // tag); the bezel gains the pen controls — FREEZE and a fresh sheet.
          bezel: [
            { k: 'RATIO', v: ratio.label, helpKey: 'ratio_lock' },
            { k: 'INTERVAL', v: ratio.interval, flex: 1.5, helpKey: 'ratio_lock' },
            {
              k: 'PEN',
              v: frozen ? 'FROZEN' : 'DRAWING',
              tint: frozen ? '#7fd4ff' : undefined,
              onPress: () => setFrozen((f) => !f),
              helpKey: 'damping',
            },
            { k: 'PAGE', v: '⟲ NEW', onPress: newDrawing, helpKey: 'damping' },
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
              <HarmonographMachine
                n1={ratio.n1}
                n2={ratio.n2}
                n3={n3}
                phaseDeg={phase}
                endAmp={damping.endAmp}
                rotary={rotary}
                detune={detune}
                height={h}
                drawMs={drawMs}
                frozen={frozen}
                epoch={epoch}
                inkColor={inkColor}
                hz1Label={`OSC 1 · ${fmtHz(hz1)}`}
                hz2Label={`OSC 2 · ${fmtHz(hz2)}`}
                hz3Label={hz3 > 0 ? `PLAT · ${fmtHz(hz3)}` : 'PLAT · OFF'}
                onFreezeFraction={(f) => {
                  freezeFracRef.current = f;
                }}
                onInsetPress={() => setViewerOpen(true)}
                onResetPress={resetAll}
              />
            </Pressable>
          ),
        },
        params: [
          {
            kind: 'fader',
            id: 'osc1',
            label: 'OSC 1',
            // Log frequency sweep 0.5 Hz → 100 Hz (owner 2026-08-23). The
            // ratio state on the bezel (RATIO / INTERVAL) names what the pair
            // forms; a clean ratio reads there, "custom ratio" is the cue.
            value: oscPosFromFreq(hz1),
            onChange: (v) => setOsc(1, oscFreqFromPos(v) / BASE_F0),
            format: () => fmtHz(hz1),
            tint: ARM_X,
            helpKey: 'ratio_lock',
          },
          {
            kind: 'fader',
            id: 'osc2',
            label: 'OSC 2',
            value: oscPosFromFreq(hz2),
            onChange: (v) => setOsc(2, oscFreqFromPos(v) / BASE_F0),
            format: () => fmtHz(hz2),
            tint: ARM_Y,
            helpKey: 'ratio_lock',
          },
          ...(rotary
            ? [
                {
                  // The paper platform's own pendulum — OSC 3 (owner
                  // 2026-08-23: platform rotation is a separate control).
                  kind: 'fader' as const,
                  id: 'plat',
                  label: 'PLAT',
                  value: platPosFromFreq(hz3),
                  onChange: (v: number) => setN3(platFreqFromPos(v) / BASE_F0),
                  format: () => (hz3 > 0 ? fmtHz(hz3) : 'OFF — platform stationary'),
                  formatShort: () => (hz3 > 0 ? fmtHz(hz3) : 'OFF'),
                  tint: '#e0b25e',
                  helpKey: 'mode',
                },
              ]
            : []),
          {
            // RATIO + DETUNE share one sticky tray (both are A/B-the-interval
            // teaching collections; the tray stays open while the figure
            // redraws). Freed a dock slot for the PLAT lane.
            kind: 'group',
            id: 'tune',
            label: 'TUNE',
            valueLabel: `${matched?.label ?? 'CUST'}${detune !== 0 ? `·+${detune * 100}%` : ''}`,
            helpKey: 'ratio_lock',
            render: () => (
              <View style={{ gap: 10 }}>
                <Text style={styles.sectionHead}>RATIO — KEEPS OSC 1, SETS OSC 2</Text>
                <View style={styles.chipRow}>
                  {RATIOS.map((r, i) => (
                    <LabChip
                      key={r.label}
                      label={`${r.label} ${r.interval}`}
                      selected={matched?.label === r.label}
                      onPress={() => pickRatio(i)}
                      onLongPress={() => openLesson('ratio_lock')}
                    />
                  ))}
                </View>
                <Text style={styles.sectionHead}>DETUNE</Text>
                <View style={styles.chipRow}>
                  {DETUNES.map((d) => (
                    <LabChip
                      key={d.key}
                      label={d.label}
                      selected={detune === d.key}
                      onPress={() => pickDetune(d.key)}
                      onLongPress={() => openLesson('ratio_lock')}
                    />
                  ))}
                </View>
              </View>
            ),
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
        ],
      }}
    >
      {!engineReady ? <EngineGate state={gate} /> : null}

      <View style={{ gap: 6 }}>
        <Text style={styles.sectionHead}>WHAT YOU’RE SEEING</Text>
        <Text style={styles.caption}>
          {isExact
            ? `A clean ${ratio.label} ratio (${ratio.interval.toLowerCase()}) — the pendulums repeat together and the figure closes.`
            : detune !== 0
              ? `Detuned +${detune * 100}% — the near-miss never closes; the slow precession IS beating.`
              : `Between simple ratios — the figure precesses and never quite closes, just like a slight detune.`}
        </Text>
      </View>

      <View style={{ gap: 6 }}>
        <Text style={styles.sectionHead}>SWEET SPOTS</Text>
        <Text style={styles.caption}>
          Clean small-number ratios — 1:1, 2:1, 3:2, 4:3, 5:4 — are the sweet spots: the two
          pendulums repeat together and the figure closes. Sweep either oscillator off a ratio and
          the figure precesses, just like a slight detune. The RATIO chips (TUNE key) keep OSC 1 where you set
          it and move OSC 2 to form the interval.
        </Text>
        <Text style={styles.sectionHead}>REAL-TIME SWINGS</Text>
        <Text style={styles.caption}>
          The machine runs at the true frequency you set (0.5–10 Hz): 1 Hz is one full swing per
          second. Around 0.5–2 Hz you’re at real harmonograph pendulum speeds — slow enough to watch
          every swing. Push toward 10 Hz and the arms blur; the drawing fills in fast. In ROTARY the paper platform is a third pendulum with its own speed — the PLAT
          lane; tiny platform detunes are what precess the rose.
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
            ) : !matched ? (
              <Text style={styles.caption}>
                A custom ratio has no exact interval to sound. Land on a clean ratio — tap a RATIO
                chip, or sweep an oscillator until the bezel names the interval — and PLAY renders
                it audibly.
              </Text>
            ) : (
              <>
                <Text style={styles.caption}>
                  {`The pendulums themselves are below hearing, so PLAY (header ▶) renders the ${ratio.label} ratio audibly` +
                    (stereoReady
                      ? ` — HARD-PANNED STEREO, ${matched.n1 * BASE_F0} Hz on LEFT and ${matched.n2 * BASE_F0} Hz on RIGHT (harmonics ${matched.n1} & ${matched.n2} of ${BASE_F0} Hz). The same ratio the machine is drawing, as sound.`
                      : ` — harmonics ${matched.n1} and ${matched.n2} of ${BASE_F0} Hz through the additive engine (${matched.n1 * BASE_F0} & ${matched.n2 * BASE_F0} Hz). Output ${GEN_LEVEL_DB} dBFS · uncalibrated.`)}
                </Text>
                <Text style={styles.advisory}>
                  {`Speaker high-pass (${SPEAKER_HPF_HZ} Hz): the ${matched.n2 * BASE_F0} Hz tone is attenuated ${speakerGuardDb(matched.n2 * BASE_F0).toFixed(1)} dB` +
                    `${matched.n1 !== matched.n2 ? `, the ${matched.n1 * BASE_F0} Hz tone ${speakerGuardDb(matched.n1 * BASE_F0).toFixed(1)} dB` : ''}. ` +
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

      {/* Fullscreen drawing viewer (tap THE DRAWING inset): share / save /
          print with the brand card; member ink colour. Renders the artwork
          from the same equations — frozen drawings show exactly the frozen
          moment. */}
      <HarmonographViewer
        visible={viewerOpen}
        onClose={() => setViewerOpen(false)}
        cfg={{
          n1: hz1,
          n2: hz2,
          n3: hz3,
          phaseDeg: phase,
          endAmp: damping.endAmp,
          rotary,
          detune,
          upTo: frozen ? freezeFracRef.current : 1,
        }}
        ratioLabel={ratio.label}
        intervalLabel={ratio.interval}
        dampingLabel={damping.label}
        inkColor={inkColor ?? INK_DEFAULT}
        onInkColor={setInkColor}
      />
    </LabShell>
  );
}

// The machine display lives in ./HarmonographMachine (rigid-body simulation of
// the three-pendulum rotary harmonograph — spec: docs/APE_HARMONOGRAPH_MECHANISM_2026_08_23.md).
// These OSC identity colors are shared with its shafts and the bezel/lane tints.
const ARM_X = '#4fd0e0'; // OSC 1 (cyan)
const ARM_Y = '#b48bff'; // OSC 2 (violet)

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
