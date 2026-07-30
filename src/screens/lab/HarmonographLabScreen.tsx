/**
 * HarmonographLabScreen — Lab 16 "Harmonograph" (v4 MASTER §7) on the shared
 * LabShell. Frequency ratios ↔ musical intervals, made visible AND audible.
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
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Circle, Defs, Line, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedProps,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { ApeDsp, GEN_MODES, type GenParams } from '../../../modules/ape-dsp';
import { useAudioOutputGate } from '../../features/audio/AudioOutputGate';
import { noteAudioActivity } from '../../features/audio/audioOutputStore';
import { guardAdditiveForEngine, speakerGuardDb, SPEAKER_HPF_HZ } from '../../features/audio/speakerSafety';
import { GuidedLessonSheet, getLabLesson, DisplayGuideButton } from '../../features/lab/guidedLessons';
import { EngineGate } from '../tools/EngineGate';
import type { EngineState } from '../../features/tools/engine/useDspEngine';
import { colors, fonts } from '../../theme/tokens';
import { LabShell, LabChip, CollapsibleSection, HeaderPlayButton } from './LabShell';

const GEN_LEVEL_DB = -20;
const ACTIVITY_MS = 500;
const BASE_F0 = 110; // Hz — harmonics n₁/n₂ of this sound the interval

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
  { key: 0, label: 'LOCKED' },
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

  const [ratioIdx, setRatioIdx] = useState(2); // 3:2 — the fifth
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

  const ratio = RATIOS[ratioIdx];
  const damping = DAMPINGS.find((d) => d.key === dampKey)!;

  // -- Interval audio (v3 additive; locked ratios only) ----------------------
  const genRef = useRef(0);

  /** [f0, a1..a12, p1..p12] with amps at the two ratio harmonics. */
  const intervalPayload = useCallback((n1: number, n2: number): number[] => {
    const amps = new Array(12).fill(0);
    amps[n1 - 1] = 1;
    amps[n2 - 1] = 1; // unison (n1===n2) just sets the one harmonic
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
    if (!additiveReady || detune !== 0) return;
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
  }, [additiveReady, detune, requestAudioOutput, intervalGenParams, ratio]);

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

  // Ratio switch while sounding retunes in place; detune silences (visual-only).
  const pickRatio = (i: number) => {
    setRatioIdx(i);
    if (running) {
      ApeDsp.genSet(intervalGenParams(RATIOS[i].n1, RATIOS[i].n2));
      noteAudioActivity();
    }
  };
  const pickDetune = (d: (typeof DETUNES)[number]['key']) => {
    setDetune(d);
    if (d !== 0 && running) stopInterval(); // audio can't honestly follow a detuned ratio
  };

  const hz1 = ratio.n1 * BASE_F0;
  const hz2 = ratio.n2 * BASE_F0;

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
          disabled={!additiveReady || detune !== 0}
          onPress={() => (running ? stopInterval() : void startInterval())}
          label={running ? 'Stop' : 'Play interval'}
        />
      }
    >
      {!engineReady ? <EngineGate state={gate} /> : null}

      <CollapsibleSection title="READOUTS">
        <Text style={styles.readMain}>
          {ratio.label} — {ratio.interval} · {hz1} Hz : {hz2} Hz
        </Text>
        <Text style={styles.caption}>
          {detune === 0
            ? `Harmonics ${ratio.n1} and ${ratio.n2} of ${BASE_F0} Hz — an exact ${ratio.label} ratio; the figure closes.`
            : `Detuned +${detune * 100}% — the near-miss never closes; the slow precession IS beating.`}
        </Text>
      </CollapsibleSection>

      <CollapsibleSection title="DISPLAY">
        {/* THE FIGURE — deterministic path math (the model IS the drawing);
            it draws itself over ~3 s on every selection change, then holds. */}
        <View style={styles.panelCard}>
          <Text style={styles.badge}>DETERMINISTIC FIGURE — DRAWN FROM THE EQUATIONS</Text>
          <HarmonographFigure
            n1={ratio.n1}
            n2={ratio.n2}
            phaseDeg={phase}
            endAmp={damping.endAmp}
            rotary={rotary}
            detune={detune}
          />
          <Text style={styles.caption}>
            {detune === 0
              ? `${ratio.label} (${ratio.interval.toLowerCase()}) — a simple integer ratio closes into a stable figure.`
              : `${ratio.label} detuned ${detune * 100}% — the near-miss never closes; the slow precession you see IS beating.`}
          </Text>
          <DisplayGuideButton onPress={() => openLesson('display')} />
        </View>
      </CollapsibleSection>

      <CollapsibleSection title="CONTROLS">
        <Text style={styles.sectionHead}>RATIO — INTERVAL</Text>
        <View style={styles.chipRow}>
          {RATIOS.map((r, i) => (
            <LabChip
              key={r.label}
              label={`${r.label} ${r.interval}`}
              selected={ratioIdx === i}
              onPress={() => pickRatio(i)}
              onLongPress={() => openLesson('ratio_lock')}
            />
          ))}
        </View>

        <Text style={styles.sectionHead}>PHASE · DAMPING · MODE · DETUNE</Text>
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
      </CollapsibleSection>

      <CollapsibleSection title="ACTIONS">
        {/* DRIVE FROM OSCILLATORS — real interval audio (v3 additive only);
            the play/stop control itself is the header ▶. */}
        {engineReady ? (
          additiveReady ? (
            detune === 0 ? (
              <>
                <Text style={styles.caption}>
                  {stereoReady
                    ? `PLAY (header ▶) is HARD-PANNED STEREO — ${hz1} Hz on LEFT, ${hz2} Hz on RIGHT (harmonics ${ratio.n1} & ${ratio.n2} of ${BASE_F0} Hz), an exact ${ratio.label} ratio. The XY figure as sound: X-drive left, Y-drive right — headphones split it cleanly.`
                    : `PLAY (header ▶) sounds harmonics ${ratio.n2} and ${ratio.n1} of ${BASE_F0} Hz through the additive engine — an exact ${ratio.label} ratio. Output ${GEN_LEVEL_DB} dBFS · uncalibrated.`}
                </Text>
                <Text style={styles.advisory}>
                  {`Speaker high-pass (${SPEAKER_HPF_HZ} Hz): the ${hz2} Hz tone is attenuated ${speakerGuardDb(hz2).toFixed(1)} dB` +
                    `${ratio.n1 !== ratio.n2 ? `, the ${hz1} Hz tone ${speakerGuardDb(hz1).toFixed(1)} dB` : ''}. ` +
                    `Use headphones for the full interval.`}
                </Text>
                {genError ? <Text style={styles.error}>{genError}</Text> : null}
              </>
            ) : (
              <Text style={styles.caption}>
                Audio pauses under detune — the additive engine renders exact integer harmonics, so a
                detuned ratio cannot sound truthfully. Re-lock the ratio to play the interval.
              </Text>
            )
          ) : (
            <Text style={styles.caption}>
              Interval audio needs the v3 additive engine — this dev build predates it. The figure and
              lessons work fully; install the v3 build to hear the ratios.
            </Text>
          )
        ) : null}
      </CollapsibleSection>

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

/** How long the pen takes to walk the full trace on a selection change. */
const DRAW_MS = 3000;

const AnimatedPath = Animated.createAnimatedComponent(Path);

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
  phaseDeg,
  endAmp,
  rotary,
  detune,
}: {
  n1: number;
  n2: number;
  phaseDeg: number;
  endAmp: number;
  rotary: boolean;
  detune: number;
}) {
  const SIZE = 320;
  const segs = useMemo(() => {
    const C = 24; // base cycles drawn
    const N = 3000;
    const thetaMax = 2 * Math.PI * C;
    const k = -Math.log(endAmp) / thetaMax;
    const phi = (phaseDeg * Math.PI) / 180;
    const f2 = n2 * (1 + detune);
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
        x = 0.5 * (Math.sin(n1 * th + phi) + Math.sin(f2 * th)) * env;
        y = 0.5 * (Math.cos(n1 * th + phi) - Math.cos(f2 * th)) * env;
      } else {
        x = Math.sin(n1 * th + phi) * env;
        y = Math.sin(f2 * th) * env;
      }
      xs[i] = cx + x * r;
      ys[i] = cx - y * r;
      pts[i] = `${xs[i].toFixed(1)} ${ys[i].toFixed(1)}`;
    }
    // Slice into TRACE_STEPS segments; adjacent segments share their boundary
    // point so the polyline stays continuous. Each segment also carries its
    // arc length for the dashoffset reveal.
    const per = Math.floor(N / TRACE_STEPS.length);
    return TRACE_STEPS.map((_, sIdx) => {
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
  }, [n1, n2, phaseDeg, endAmp, rotary, detune]);

  // The pen: 0 → 1 walks the whole trace, restarted whenever the figure
  // changes (segs identity), then HOLDS at 1.
  const progress = useSharedValue(0);
  useEffect(() => {
    cancelAnimation(progress);
    progress.value = 0;
    progress.value = withTiming(1, { duration: DRAW_MS, easing: Easing.inOut(Easing.sin) });
    return () => cancelAnimation(progress);
  }, [segs, progress]);

  const c = SIZE / 2;
  return (
    <Svg width="100%" height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
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
