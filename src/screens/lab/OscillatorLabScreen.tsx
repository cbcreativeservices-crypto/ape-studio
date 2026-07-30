/**
 * OscillatorLabScreen — Lab 14 "Oscillator" (v4 MASTER §7) on the shared
 * LabShell. Generate the classic waveforms and see/hear their spectra.
 *
 * LAYOUT v2 (owner 2026-07-29): collapsible DISPLAY → CONTROLS → ACTIONS
 * sections (no numeric readouts in this lab, so no READOUTS section); the
 * primary PLAY/STOP is the compact HeaderPlayButton via LabShell's
 * headerAction; the shell renders the Guided-Lesson entry row itself, so the
 * screen keeps only per-control long-press lessons + DisplayGuide buttons.
 *
 * AUDIO (honest, real):
 *  - engine v3 (additive): every wave sounds as REAL band-limited additive
 *    audio — the canonical 12-harmonic recipe (harmonicModel.buildPreset)
 *    through GEN_MODES.additive. Band-limited BY CONSTRUCTION (the core omits
 *    harmonics at/above Nyquist), which is itself the anti-aliasing lesson.
 *  - engine v2: sine only (the additive mode doesn't exist) — non-sine waves
 *    stay visual with an honest note, never a fabricated stand-in.
 *  - FM / AM need NEW native DSP (not in the engine) — stated plainly, no
 *    dead controls (§1.7).
 *
 * DISPLAYS (analytic, labeled): waveform strip + 12-harmonic bar chart derive
 * from the MODEL (harmonicModel.synthWaveform), not from a measurement —
 * badged "ANALYTIC MODEL — NOT A MEASUREMENT" (HarmonicsView idiom).
 * Visual standards 2026-07-29: the strip is a TRAVELING wave — a 3-cycle
 * tiling path slid by a native Reanimated translate loop (one period per
 * lap, zero JS re-renders, paused when the screen blurs); the harmonic bars
 * SETTLE into each new recipe with a gentle withTiming overshoot.
 *
 * Sound lifecycle = the HarmonicsView/SignalGen idiom: audio-output gate →
 * genSet/genStart → generation-counter stale guard → 2 Hz noteAudioActivity
 * keepalive → stop on toggle/blur/unmount.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import Svg, { Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { ApeDsp, GEN_MODES, type GenParams } from '../../../modules/ape-dsp';
import { useAudioOutputGate } from '../../features/audio/AudioOutputGate';
import { noteAudioActivity } from '../../features/audio/audioOutputStore';
import {
  guardToneLevelForEngine,
  guardAdditiveForEngine,
  speakerGuardGain,
  SPEAKER_HPF_HZ,
  LOW_FREQ_ADVISORY,
} from '../../features/audio/speakerSafety';
import { GuidedLessonSheet, getLabLesson, DisplayGuideButton } from '../../features/lab/guidedLessons';
import { EngineGate } from '../tools/EngineGate';
import type { EngineState } from '../../features/tools/engine/useDspEngine';
import { colors, fonts } from '../../theme/tokens';
import { LabShell, LabChip, SpeakerOutputToggle, CollapsibleSection, HeaderPlayButton } from './LabShell';
import { additivePayload, buildPreset, effectiveAmp, synthWaveform, type PresetKey } from './harmonicModel';

const GEN_LEVEL_DB = -20; // Q4 default; cap stays locked
const ACTIVITY_MS = 500; // 2 Hz keepalive (SignalGen idiom)

/** The classic waves this lab generates (each = a canonical additive recipe). */
const WAVES: { key: PresetKey; label: string; lessonKey: string }[] = [
  { key: 'sine', label: 'SINE', lessonKey: 'sine' },
  { key: 'square', label: 'SQUARE', lessonKey: 'square' },
  { key: 'triangle', label: 'TRIANGLE', lessonKey: 'triangle' },
  { key: 'saw', label: 'SAW', lessonKey: 'saw' },
  { key: 'pulse', label: 'PULSE 25%', lessonKey: 'pulse' },
];

const F0_CHOICES = [110, 220, 440, 880];

const INTRO =
  'Generate the classic waveforms, watch their shape and harmonic content, and ' +
  'hear each one as real band-limited audio. The waveform you see and the ' +
  'harmonics you hear are the same Fourier recipe.';

export function OscillatorLabScreen() {
  const { requestAudioOutput } = useAudioOutputGate();

  const [gate] = useState<EngineState>(() => {
    if (!ApeDsp.isAvailable()) return 'absent';
    return ApeDsp.engineVersion() >= 2 ? 'idle' : 'spike';
  });
  const engineReady = gate === 'idle';
  const additiveReady = engineReady && ApeDsp.engineVersion() >= 3;

  const [wave, setWave] = useState<PresetKey>('saw');
  const [f0, setF0] = useState(220);
  const [running, setRunning] = useState(false);
  const [genError, setGenError] = useState('');

  // Guided Lesson sheet (control long-press + DisplayGuide entries; the lab
  // entry row is the shell's).
  const [lessonKey, setLessonKey] = useState<string | undefined>(undefined);
  const [lessonOpen, setLessonOpen] = useState(false);
  const openLesson = useCallback((key?: string) => {
    setLessonKey(key);
    setLessonOpen(true);
  }, []);

  // PHONE SPEAKER OUTPUT view — show the signal AFTER the protective high-pass.
  const [speakerView, setSpeakerView] = useState(false);

  // The analytic model behind both displays AND the additive audio payload.
  const model = useMemo(() => buildPreset(wave), [wave]);
  // Displayed model: filtered by the SAME speaker high-pass the audio uses when
  // PHONE SPEAKER OUTPUT is on, so what you see and hear can't disagree.
  const shownModel = useMemo(
    () => (speakerView ? model.map((h, i) => ({ ...h, amp: h.amp * speakerGuardGain((i + 1) * f0) })) : model),
    [model, speakerView, f0],
  );
  // 3 EXACT cycles (120 samples each, shared boundary sample) so the traveling
  // strip tiles seamlessly when the translate loop wraps by one period.
  const waveformPts = useMemo(() => synthWaveform(shownModel, 361, 3), [shownModel]);
  const amps = useMemo(() => shownModel.map(effectiveAmp), [shownModel]);
  // The filter's gain per harmonic — drawn as the overlay curve in speaker view.
  const guardCurve = useMemo(() => Array.from({ length: 12 }, (_, i) => speakerGuardGain((i + 1) * f0)), [f0]);

  // -- Tone lifecycle (generation-counter stale guard, one tone owner) -------
  const genRef = useRef(0);

  /** Params for the CURRENT wave: additive recipe on v3, sine on v2. */
  const paramsFor = useCallback(
    (w: PresetKey, hz: number): GenParams =>
      additiveReady
        ? {
            mode: GEN_MODES.additive,
            // Engine-aware: JS per-harmonic high-pass below v4 (matches the
            // PHONE SPEAKER OUTPUT view); raw on ≥4 (native route-aware HPF).
            additive: guardAdditiveForEngine(additivePayload(buildPreset(w), hz)),
            levelDb: GEN_LEVEL_DB,
          }
        : // A pure sine is one frequency, so the filter is just its gain there.
          { mode: GEN_MODES.sine, frequency: hz, levelDb: guardToneLevelForEngine(GEN_LEVEL_DB, hz) },
    [additiveReady],
  );

  const startTone = useCallback(async () => {
    const gen = ++genRef.current;
    const ok = await requestAudioOutput();
    if (!ok || gen !== genRef.current) return;
    setGenError('');
    ApeDsp.genSet(paramsFor(wave, f0));
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
  }, [requestAudioOutput, paramsFor, wave, f0]);

  const stopTone = useCallback(() => {
    genRef.current++;
    void ApeDsp.genStop();
    setRunning(false);
  }, []);

  // Stop on blur/unmount; keepalive while sounding.
  useFocusEffect(useCallback(() => () => stopTone(), [stopTone]));
  useEffect(() => {
    if (!running) return;
    const id = setInterval(noteAudioActivity, ACTIVITY_MS);
    return () => clearInterval(id);
  }, [running]);

  // Live retune/reshape while sounding (the retune idiom — no stop/start).
  const pickWave = (w: PresetKey) => {
    setWave(w);
    if (running) {
      ApeDsp.genSet(paramsFor(w, f0));
      noteAudioActivity();
    }
  };
  const pickF0 = (hz: number) => {
    setF0(hz);
    if (running) {
      // Additive retunes via the full payload (`frequency` moves the sine path only).
      ApeDsp.genSet(paramsFor(wave, hz));
      noteAudioActivity();
    }
  };

  return (
    <LabShell
      labId="oscillator"
      title="OSCILLATOR LAB"
      subtitle="Waveforms · Spectra · Band-limiting"
      intro={INTRO}
      exploreCaption="Pick a waveform and fundamental — the shape, the harmonic recipe, and the sound stay in lockstep."
      headerAction={
        <HeaderPlayButton
          playing={running}
          disabled={!engineReady}
          onPress={() => (running ? stopTone() : void startTone())}
          label={running ? 'Stop' : additiveReady ? 'Play waveform' : 'Play sine'}
        />
      }
    >
      {!engineReady ? <EngineGate state={gate} /> : null}

      <CollapsibleSection title="DISPLAY">
        {/* HONESTY CONTROL — reference (ideal) vs the filtered speaker output. */}
        <SpeakerOutputToggle
          value={speakerView}
          onChange={setSpeakerView}
          sub={
            speakerView
              ? `Showing the signal AFTER the ${SPEAKER_HPF_HZ} Hz high-pass — what actually reaches the built-in speaker.`
              : 'Reference (ideal) view. Audio is high-passed for speaker safety — tick to see the speaker output.'
          }
        />

        {/* WAVEFORM STRIP — drawn FROM THE (possibly filtered) MODEL; travels. */}
        <View style={styles.panelCard}>
          <Text style={styles.badge}>
            {speakerView ? `PHONE SPEAKER OUTPUT — ${SPEAKER_HPF_HZ} Hz HPF APPLIED` : 'ANALYTIC MODEL — NOT A MEASUREMENT'}
          </Text>
          <TravelingWaveStrip points={waveformPts} />
          <Text style={styles.caption}>
            {speakerView
              ? 'The waveform after the speaker high-pass, traveling as a wave does — low partials removed, so the shape flattens toward its upper harmonics.'
              : 'The ideal 12-harmonic recipe traveling as a wave — the same series the additive engine renders.'}
          </Text>
          <DisplayGuideButton onPress={() => openLesson('display')} />
        </View>

        {/* HARMONIC BARS — the recipe as levels; filter curve overlaid in speaker view. */}
        <View style={styles.panelCard}>
          <Text style={styles.badge}>
            {speakerView ? `HARMONIC RECIPE AFTER ${SPEAKER_HPF_HZ} Hz HPF` : 'HARMONIC RECIPE — ANALYTIC'}
          </Text>
          <HarmonicBars amps={amps} overlay={speakerView ? guardCurve : undefined} />
          <Text style={styles.caption}>
            {speakerView
              ? `H1–H12 after the high-pass (amber line = the filter's gain at each harmonic's frequency, n × ${f0} Hz).`
              : 'H1–H12 relative amplitudes. Square/triangle = odd only; saw = all; pulse nulls follow its duty cycle.'}
          </Text>
          <DisplayGuideButton onPress={() => openLesson('display')} />
        </View>
      </CollapsibleSection>

      <CollapsibleSection title="CONTROLS">
        <Text style={styles.sectionHead}>WAVEFORM</Text>
        <View style={styles.chipRow}>
          {WAVES.map((w) => (
            <LabChip
              key={w.key}
              label={w.label}
              selected={wave === w.key}
              onPress={() => pickWave(w.key)}
              onLongPress={() => openLesson(w.lessonKey)}
            />
          ))}
        </View>

        <Text style={styles.sectionHead}>FUNDAMENTAL</Text>
        <View style={styles.chipRow}>
          {F0_CHOICES.map((hz) => (
            <LabChip
              key={hz}
              label={`${hz} Hz`}
              selected={f0 === hz}
              onPress={() => pickF0(hz)}
              onLongPress={() => openLesson('frequency')}
            />
          ))}
        </View>
      </CollapsibleSection>

      <CollapsibleSection title="ACTIONS">
        {engineReady ? (
          <>
            <Text style={styles.caption}>
              {additiveReady
                ? `PLAY (header ▶) outputs ${GEN_LEVEL_DB} dBFS · uncalibrated. Band-limited by construction — harmonics at/above Nyquist are omitted, never aliased (that omission is the anti-aliasing lesson).`
                : `This engine build predates the additive generator — audio is the fundamental SINE only; square/saw/triangle/pulse stay visual until the v3 dev build is installed.`}
            </Text>
            <Text style={styles.advisory}>{LOW_FREQ_ADVISORY}</Text>
            {genError ? <Text style={styles.error}>{genError}</Text> : null}
          </>
        ) : null}

        {/* FM / AM — honest status, no dead controls (§1.7). */}
        <View style={styles.devNote}>
          <Text style={styles.devNoteHead}>FM · AM — NEEDS NEW NATIVE DSP</Text>
          <Text style={styles.caption}>
            Frequency and amplitude modulation are not in the current ape-dsp engine, so they have no
            controls here yet. The theory is in this lab’s lesson (ⓘ) — sidebands at fc ± n·fm (FM,
            Bessel amplitudes) vs one pair at fc ± fm (AM).
          </Text>
        </View>
      </CollapsibleSection>

      <GuidedLessonSheet
        visible={lessonOpen}
        lesson={getLabLesson('oscillator')}
        controlKey={lessonKey}
        onClose={() => setLessonOpen(false)}
      />
    </LabShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

const AnimatedRect = Animated.createAnimatedComponent(Rect);

const STRIP_H = 96;
const CYCLE_MS = 1600; // one waveform period per lap — a calm, readable drift

/** The TRAVELING waveform strip (visual standards 2026-07-29): 3 exact model
 *  cycles are drawn once as a single path 1.5× the viewport wide, then slid
 *  rightward by ONE period on a native Reanimated linear loop. Because the
 *  path tiles exactly (period = w/2 px), the wrap is invisible — a continuous
 *  rightward-traveling wave with zero per-frame JS work. Paused on blur. */
function TravelingWaveStrip({ points }: { points: number[] }) {
  const focused = useIsFocused();
  const [w, setW] = useState(0);
  const shift = useSharedValue(0);

  // The 3-cycle path in PIXEL coords (recomputed only on layout/model change).
  const d = useMemo(() => {
    if (!points.length || w <= 0) return '';
    const step = (w * 1.5) / (points.length - 1);
    const y = (v: number) => (STRIP_H / 2 - (v * STRIP_H) / 2.2).toFixed(1);
    let s = `M0 ${y(points[0])}`;
    for (let i = 1; i < points.length; i++) s += `L${(i * step).toFixed(1)} ${y(points[i])}`;
    return s;
  }, [points, w]);

  useEffect(() => {
    if (!focused || w <= 0) {
      cancelAnimation(shift);
      return;
    }
    shift.value = -w / 2;
    shift.value = withRepeat(withTiming(0, { duration: CYCLE_MS, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(shift);
  }, [focused, w, shift]);

  const slide = useAnimatedStyle(() => ({ transform: [{ translateX: shift.value }] }));

  return (
    <View
      style={styles.stripClip}
      onLayout={(e) => setW(Math.round(e.nativeEvent.layout.width))}
    >
      {w > 0 ? (
        <Animated.View style={[{ width: w * 1.5 }, slide]}>
          <Svg width={w * 1.5} height={STRIP_H}>
            <Line x1={0} y1={STRIP_H / 2} x2={w * 1.5} y2={STRIP_H / 2} stroke="#22222a" strokeWidth={1} />
            {/* Soft glow pass under the crisp core stroke (standards §2). */}
            <Path d={d} stroke={colors.amber} strokeWidth={4.5} fill="none" opacity={0.14} strokeLinecap="round" />
            <Path d={d} stroke={colors.amber} strokeWidth={1.6} fill="none" />
          </Svg>
        </Animated.View>
      ) : (
        <View style={{ height: STRIP_H }} />
      )}
    </View>
  );
}

/** One harmonic bar that SETTLES into its new amplitude (withTiming with a
 *  gentle back-ease overshoot — never a snap). Height/opacity are clamped in
 *  the worklet so the overshoot can't go negative. */
function SettleBar({ x, width, amp, chartH }: { x: number; width: number; amp: number; chartH: number }) {
  const av = useSharedValue(amp);
  useEffect(() => {
    av.value = withTiming(amp, { duration: 420, easing: Easing.out(Easing.back(1.3)) });
  }, [amp, av]);
  const animatedProps = useAnimatedProps(() => {
    const a = Math.min(1, Math.max(0, av.value));
    const h = a > 0.004 ? Math.max(a * (chartH - 10), 2) : 0;
    return { y: chartH - h, height: h, opacity: 0.55 + 0.45 * a };
  });
  return <AnimatedRect x={x} width={width} fill={colors.amber} animatedProps={animatedProps} />;
}

/** The 12-harmonic recipe as amber bars (relative amplitude, linear). When
 *  `overlay` is given (0..1 gain per harmonic) the filter response is drawn as a
 *  line across the bars — the honest picture of what the high-pass does. */
function HarmonicBars({ amps, overlay }: { amps: number[]; overlay?: number[] }) {
  const W = 320;
  const H = 110;
  const pad = 6;
  const bw = (W - pad * 2) / 12;
  const cx = (i: number) => pad + i * bw + bw / 2;
  const overlayPath =
    overlay && overlay.length
      ? overlay
          .map((g, i) => `${i === 0 ? 'M' : 'L'}${cx(i).toFixed(1)} ${(H - g * (H - 10)).toFixed(1)}`)
          .join(' ')
      : '';
  return (
    <Svg width="100%" height={H + 14} viewBox={`0 0 ${W} ${H + 14}`}>
      <Rect x={0} y={0} width={W} height={H} fill="#0c0c0f" />
      {amps.map((a, i) => (
        <SettleBar key={i} x={pad + i * bw + 3} width={bw - 6} amp={a} chartH={H} />
      ))}
      {overlayPath ? <Path d={overlayPath} stroke={colors.amber} strokeWidth={1.4} fill="none" opacity={0.9} /> : null}
      {overlay?.map((g, i) => (
        <Rect key={`d${i}`} x={cx(i) - 1.4} y={H - g * (H - 10) - 1.4} width={2.8} height={2.8} fill={colors.amber} />
      ))}
      {amps.map((_, i) => (
        <SvgText
          key={`l${i}`}
          x={pad + i * bw + bw / 2}
          y={H + 11}
          fill={colors.textSub}
          fontSize={8}
          textAnchor="middle"
        >
          {`${i + 1}`}
        </SvgText>
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
  panelCard: {
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    padding: 12,
  },
  badge: { fontFamily: fonts.oswaldSemiBold, fontSize: 9.5, letterSpacing: 1.2, color: colors.textSub },
  stripClip: { overflow: 'hidden', borderRadius: 6, backgroundColor: '#0c0c0f' },
  devNote: {
    gap: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    padding: 12,
  },
  devNoteHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.2, color: colors.textSecondary },
});
