/**
 * HarmonographLabScreen — Lab 16 "Harmonograph" (v4 MASTER §7) on the shared
 * LabShell. Frequency ratios ↔ musical intervals, made visible AND audible.
 *
 * FIGURE (analytic by nature): damped sinusoids drive the pen —
 *   x(t) = sin(n₁θ + φ)·e^(−kθ) · y(t) = sin(n₂(1+Δ)θ)·e^(−kθ)  (lateral)
 * plus a counter-rotating ROTARY variant. Deterministic path math (T1,
 * compute ~zero) rendered as one SVG path; the drawing IS the model, so no
 * measurement claims arise.
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
import Svg, { Path, Rect } from 'react-native-svg';
import { ApeDsp, GEN_MODES } from '../../../modules/ape-dsp';
import { GlassButton } from '../../components/GlassButton';
import { useAudioOutputGate } from '../../features/audio/AudioOutputGate';
import { noteAudioActivity } from '../../features/audio/audioOutputStore';
import { applySpeakerGuardToAdditive, speakerGuardDb, SPEAKER_HPF_HZ } from '../../features/audio/speakerSafety';
import { GuidedLessonSheet, getLabLesson } from '../../features/lab/guidedLessons';
import { EngineGate } from '../tools/EngineGate';
import type { EngineState } from '../../features/tools/engine/useDspEngine';
import { colors, fonts } from '../../theme/tokens';
import { LabShell, LabChip } from './LabShell';

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

  const startInterval = useCallback(async () => {
    if (!additiveReady || detune !== 0) return;
    const gen = ++genRef.current;
    const ok = await requestAudioOutput();
    if (!ok || gen !== genRef.current) return;
    setGenError('');
    ApeDsp.genSet({
      mode: GEN_MODES.additive,
      // Real per-harmonic high-pass on the interval's two tones (the lower
      // harmonic is attenuated by |H| at its frequency) — see the note below.
      additive: applySpeakerGuardToAdditive(intervalPayload(ratio.n1, ratio.n2)),
      levelDb: GEN_LEVEL_DB,
    });
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
  }, [additiveReady, detune, requestAudioOutput, intervalPayload, ratio]);

  const stopInterval = useCallback(() => {
    genRef.current++;
    void ApeDsp.genStop();
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
      ApeDsp.genSet({
        additive: applySpeakerGuardToAdditive(intervalPayload(RATIOS[i].n1, RATIOS[i].n2)),
        levelDb: GEN_LEVEL_DB,
      });
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
    >
      {!engineReady ? <EngineGate state={gate} /> : null}

      <View style={styles.chipRow}>
        <LabChip label="ⓘ GUIDED LESSON" selected={lessonOpen} onPress={() => openLesson()} />
      </View>
      <Text style={styles.caption}>Long-press a labeled control for its guided lesson.</Text>

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

      {/* THE FIGURE — deterministic path math (the model IS the drawing). */}
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
      </View>

      {/* DRIVE FROM OSCILLATORS — real interval audio (v3 additive only). */}
      {engineReady ? (
        additiveReady ? (
          detune === 0 ? (
            <>
              <GlassButton
                label={running ? 'STOP' : `PLAY INTERVAL — ${hz2} + ${hz1} Hz`}
                tint="green"
                height={52}
                fontSize={15}
                onPress={() => (running ? stopInterval() : void startInterval())}
              />
              <Text style={styles.caption}>
                {`Harmonics ${ratio.n2} and ${ratio.n1} of ${BASE_F0} Hz through the additive engine — an exact ${ratio.label} ratio. Output ${GEN_LEVEL_DB} dBFS · uncalibrated.`}
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

      <GuidedLessonSheet
        visible={lessonOpen}
        lesson={getLabLesson('harmonograph')}
        controlKey={lessonKey}
        onClose={() => setLessonOpen(false)}
      />
    </LabShell>
  );
}

/** The damped figure as one SVG path. Lateral = Lissajous with decay; rotary =
 *  counter-rotating circular pair (petal figures). ~3000 points, memoized —
 *  recomputed only on a control change. */
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
  const d = useMemo(() => {
    const C = 24; // base cycles drawn
    const N = 3000;
    const thetaMax = 2 * Math.PI * C;
    const k = -Math.log(endAmp) / thetaMax;
    const phi = (phaseDeg * Math.PI) / 180;
    const f2 = n2 * (1 + detune);
    const cx = SIZE / 2;
    const r = SIZE / 2 - 12;
    let s = '';
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
      const px = (cx + x * r).toFixed(1);
      const py = (cx - y * r).toFixed(1);
      s += i === 0 ? `M${px} ${py}` : `L${px} ${py}`;
    }
    return s;
  }, [n1, n2, phaseDeg, endAmp, rotary, detune]);

  return (
    <Svg width="100%" height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
      <Rect x={0} y={0} width={SIZE} height={SIZE} fill="#0c0c0f" />
      <Path d={d} stroke={colors.amber} strokeWidth={0.8} strokeOpacity={0.85} fill="none" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sectionHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1.5, color: colors.amber },
  caption: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
  advisory: { fontFamily: fonts.barlowMedium, fontSize: 12, lineHeight: 16, color: colors.amber },
  error: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: '#ff6b5e' },
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
