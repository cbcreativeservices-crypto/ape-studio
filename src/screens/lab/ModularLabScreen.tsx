/**
 * ModularLabScreen — WAVE-2 expansion lab "Modular Synth" (owner 2026-07-26)
 * on the shared LabShell. The canonical subtractive voice with its sections
 * and SIGNAL FLOW made explicit: VCO → VCF → VCA plus the three mod sources
 * (ADSR, LFO, sequencer), each explained and each routing drawn.
 *
 * HERO: the patch-flow diagram IS the actual native signal path — audio boxes
 * on the top row, mod sources below, patch cables highlighting exactly the
 * routings currently active (env→VCA always; env→cutoff, LFO→dest, SEQ→pitch
 * as configured). PATCH IDEAS presets set every parameter and state WHY that
 * routing makes that classic sound.
 *
 * LIVE + HONEST: the env meter and the running step highlight read the REAL
 * native modStatus (no fake meters, §1.7). Audio needs engineVersion ≥ 7 —
 * below it the diagram + lessons work and the build requirement is stated.
 *
 * LAYOUT v2 (owner 2026-07-29): collapsible DISPLAY → CONTROLS → ACTIONS
 * sections (no separate READOUTS — the lab's live readouts ARE the diagram's
 * env meter and step LEDs, which can't split out without faking them); the
 * dominant start/stop (RUN SEQUENCE / PLAY DRONE) is the compact
 * HeaderPlayButton via LabShell's headerAction; the shell renders the
 * Guided-Lesson entry row itself.
 */
import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, RadialGradient, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { ApeDsp, MOD_PARAM } from '../../../modules/ape-dsp';
import { useAudioOutputGate } from '../../features/audio/AudioOutputGate';
import { noteAudioActivity } from '../../features/audio/audioOutputStore';
import { GuidedLessonSheet, getLabLesson, DisplayGuideButton } from '../../features/lab/guidedLessons';
import { EngineGate } from '../tools/EngineGate';
import type { EngineState } from '../../features/tools/engine/useDspEngine';
import { colors, fonts } from '../../theme/tokens';
import { LabShell, LabChip, CollapsibleSection, HeaderPlayButton } from './LabShell';

const ACTIVITY_MS = 500;
const STATUS_MS = 100; // live env/step poll while running (10 Hz)

const SHAPES = [
  { v: 0, label: 'SAW' },
  { v: 1, label: 'SQUARE' },
  { v: 2, label: 'TRI' },
  { v: 3, label: 'SINE' },
] as const;
const CUTOFFS = [250, 800, 2000, 8000] as const;
const RESONANCES = [
  { v: 0, label: 'RES 0' },
  { v: 0.5, label: 'RES ½' },
  { v: 1, label: 'RES MAX' },
] as const;
const ENV_PRESETS = [
  { key: 'pluck', label: 'PLUCK', a: 0.003, d: 0.18, s: 0.0, r: 0.12 },
  { key: 'pad', label: 'PAD', a: 0.6, d: 0.3, s: 0.8, r: 0.8 },
  { key: 'organ', label: 'ORGAN', a: 0.005, d: 0.05, s: 1.0, r: 0.08 },
] as const;
const ENV_TO_CUT = [
  { v: 0, label: 'ENV→VCF OFF' },
  { v: 0.5, label: '+50%' },
  { v: 1, label: '+100%' },
] as const;
const LFO_RATES = [0.5, 2, 6] as const;
const LFO_DEPTHS = [
  { v: 0, label: 'DEPTH 0' },
  { v: 0.5, label: '½' },
  { v: 1, label: 'MAX' },
] as const;
const LFO_DESTS = [
  { v: 0, label: 'OFF' },
  { v: 1, label: '→PITCH' },
  { v: 2, label: '→CUTOFF' },
  { v: 3, label: '→AMP' },
] as const;
const SEQ_RATES = [2, 4, 8] as const;
/** Step cycle values: semitone offsets + rest. */
const STEP_CYCLE = [0, 3, 5, 7, 12, -1] as const; // −1 = rest
const BASE_FREQ = 110;

type Patch = {
  shape: number;
  cutoff: number;
  res: number;
  envKey: (typeof ENV_PRESETS)[number]['key'];
  envToCut: number;
  lfoRate: number;
  lfoDepth: number;
  lfoDest: number;
  seqOn: boolean;
  seqRate: number;
  steps: number[]; // semitones, −1 = rest
};

const DEFAULT_PATCH: Patch = {
  shape: 0,
  cutoff: 2000,
  res: 0,
  envKey: 'organ',
  envToCut: 0,
  lfoRate: 2,
  lfoDepth: 0,
  lfoDest: 0,
  seqOn: false,
  seqRate: 4,
  steps: [0, 0, 7, 0, 3, 0, 12, -1],
};

/** PATCH IDEAS — classic routings with the WHY (the signal-flow lesson). */
const PATCH_IDEAS: { key: string; label: string; why: string; patch: Patch }[] = [
  {
    key: 'drone',
    label: 'RAW DRONE',
    why: 'Just VCO → open VCF → VCA: the unshaped starting point every patch carves from.',
    patch: { ...DEFAULT_PATCH, cutoff: 8000, envKey: 'organ' },
  },
  {
    key: 'bass',
    label: 'ACID BASS',
    why: 'Env → cutoff with a fast decay: every sequencer note opens bright and slams shut — the squelch is the filter envelope, not the oscillator.',
    patch: { ...DEFAULT_PATCH, cutoff: 800, res: 1, envKey: 'pluck', envToCut: 1, seqOn: true, seqRate: 8 },
  },
  {
    key: 'wobble',
    label: 'WOBBLE',
    why: 'LFO → cutoff: the filter sweeps rhythmically while pitch holds still — movement without melody.',
    patch: { ...DEFAULT_PATCH, cutoff: 800, res: 0.5, lfoRate: 2, lfoDepth: 1, lfoDest: 2 },
  },
  {
    key: 'vibrato',
    label: 'VIBRATO LEAD',
    why: 'LFO → pitch at low depth: the singing wobble — the SAME LFO that wobbles the filter, just re-routed.',
    patch: { ...DEFAULT_PATCH, shape: 2, cutoff: 8000, lfoRate: 6, lfoDepth: 0.5, lfoDest: 1 },
  },
  {
    key: 'tremolo',
    label: 'TREMOLO',
    why: 'LFO → amp: loudness pulses while pitch and tone stay put — the third classic destination.',
    patch: { ...DEFAULT_PATCH, shape: 2, cutoff: 8000, lfoRate: 6, lfoDepth: 1, lfoDest: 3 },
  },
];

const INTRO =
  'One oscillator, one filter, one amplifier — and three modulators that automate them. ' +
  'Every classic synth sound is a routing decision: what modulates what. The diagram below ' +
  'is the actual signal path of the audio engine; patch cables light up as you route.';

export function ModularLabScreen() {
  const { requestAudioOutput } = useAudioOutputGate();

  const [gate] = useState<EngineState>(() => {
    if (!ApeDsp.isAvailable()) return 'absent';
    return ApeDsp.engineVersion() >= 2 ? 'idle' : 'spike';
  });
  const engineReady = gate === 'idle';
  const modReady = engineReady && ApeDsp.wave2Available();

  const [patch, setPatch] = useState<Patch>(DEFAULT_PATCH);
  const [patchKey, setPatchKey] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [envLevel, setEnvLevel] = useState(0);
  const [activeStep, setActiveStep] = useState(-1);
  const [genError, setGenError] = useState('');

  const [lessonKey, setLessonKey] = useState<string | undefined>(undefined);
  const [lessonOpen, setLessonOpen] = useState(false);
  const openLesson = useCallback((key?: string) => {
    setLessonKey(key);
    setLessonOpen(true);
  }, []);

  /** Push the WHOLE patch through the scalar setter (targets ramp natively). */
  const pushPatch = useCallback((p: Patch) => {
    const env = ENV_PRESETS.find((e) => e.key === p.envKey)!;
    ApeDsp.modSet(MOD_PARAM.shape, p.shape);
    ApeDsp.modSet(MOD_PARAM.baseFreq, BASE_FREQ);
    ApeDsp.modSet(MOD_PARAM.cutoff, p.cutoff);
    ApeDsp.modSet(MOD_PARAM.resonance, p.res);
    ApeDsp.modSet(MOD_PARAM.envA, env.a);
    ApeDsp.modSet(MOD_PARAM.envD, env.d);
    ApeDsp.modSet(MOD_PARAM.envS, env.s);
    ApeDsp.modSet(MOD_PARAM.envR, env.r);
    ApeDsp.modSet(MOD_PARAM.envToCutoff, p.envToCut);
    ApeDsp.modSet(MOD_PARAM.lfoRate, p.lfoRate);
    ApeDsp.modSet(MOD_PARAM.lfoDepth, p.lfoDepth);
    ApeDsp.modSet(MOD_PARAM.lfoDest, p.lfoDest);
    ApeDsp.modSet(MOD_PARAM.seqOn, p.seqOn ? 1 : 0);
    ApeDsp.modSet(MOD_PARAM.seqRate, p.seqRate);
    p.steps.forEach((s, i) => {
      ApeDsp.modSet(MOD_PARAM.seqStep(i), s < 0 ? 0 : s);
      ApeDsp.modSet(MOD_PARAM.seqGate(i), s < 0 ? 0 : 1);
    });
    ApeDsp.modSet(MOD_PARAM.levelDb, -18);
  }, []);

  /** Change patch state and (while running) push live. */
  const update = useCallback(
    (patchPatch: Partial<Patch>, fromPreset: string | null = null) => {
      setPatch((prev) => {
        const next = { ...prev, ...patchPatch };
        pushPatch(next);
        if (running) noteAudioActivity();
        return next;
      });
      setPatchKey(fromPreset);
    },
    [pushPatch, running],
  );

  const start = useCallback(async () => {
    if (!modReady) return;
    const ok = await requestAudioOutput();
    if (!ok) return;
    setGenError('');
    pushPatch(patch);
    try {
      await ApeDsp.modStart();
      setRunning(true);
      noteAudioActivity();
    } catch (e) {
      setGenError(e instanceof Error ? e.message : String(e));
    }
  }, [modReady, requestAudioOutput, pushPatch, patch]);

  const stop = useCallback(() => {
    void ApeDsp.modStop();
    setRunning(false);
    setEnvLevel(0);
    setActiveStep(-1);
  }, []);

  useFocusEffect(useCallback(() => () => stop(), [stop]));
  useEffect(() => {
    if (!running) return;
    const keep = setInterval(noteAudioActivity, ACTIVITY_MS);
    // REAL live state (native modStatus): env meter + running step (§1.7).
    const poll = setInterval(() => {
      const st = ApeDsp.modStatus();
      if (st) {
        setEnvLevel(st.envLevel);
        setActiveStep(st.activeStep);
      }
    }, STATUS_MS);
    return () => {
      clearInterval(keep);
      clearInterval(poll);
    };
  }, [running]);

  const cycleStep = (i: number) => {
    const cur = patch.steps[i];
    const idx = STEP_CYCLE.indexOf(cur as (typeof STEP_CYCLE)[number]);
    const next = STEP_CYCLE[(idx + 1) % STEP_CYCLE.length];
    update({ steps: patch.steps.map((s, k) => (k === i ? next : s)) });
  };

  return (
    <LabShell
      labId="modular"
      title="MODULAR SYNTH LAB"
      subtitle="VCO · VCF · VCA · LFO · Envelope · Sequencer"
      intro={INTRO}
      exploreCaption="Route the modulators and listen to what each patch cable does — the diagram is the live signal flow."
      headerAction={
        <HeaderPlayButton
          playing={running}
          disabled={!modReady}
          onPress={() => (running ? stop() : void start())}
          label={running ? 'Stop' : patch.seqOn ? 'Run the sequence' : 'Play the drone'}
        />
      }
    >
      {!engineReady ? <EngineGate state={gate} /> : null}

      <CollapsibleSection title="DISPLAY">
        {/* HERO — the live patch-flow diagram (its env meter and step LEDs are
            the lab's REAL readouts — native modStatus, §1.7). */}
        <View style={styles.panelCard}>
          <Text style={styles.badge}>SIGNAL FLOW — THE ACTUAL NATIVE PATH · ACTIVE ROUTINGS LIT</Text>
          <PatchDiagram patch={patch} envLevel={envLevel} activeStep={activeStep} running={running} onBox={openLesson} />
          <Text style={styles.caption}>
            Audio (top row): VCO → VCF → VCA → output stage. Modulators (bottom): the envelope
            always drives the VCA; everything else is a routing you choose. Tap any box for what it
            does.
          </Text>
          <DisplayGuideButton onPress={() => openLesson('display')} />
        </View>
      </CollapsibleSection>

      <CollapsibleSection title="CONTROLS">
        <Text style={styles.sectionHead}>PATCH IDEAS — CLASSIC ROUTINGS</Text>
      <View style={styles.chipRow}>
        {PATCH_IDEAS.map((p) => (
          <LabChip
            key={p.key}
            label={p.label}
            selected={patchKey === p.key}
            onPress={() => update(p.patch, p.key)}
            onLongPress={() => openLesson(`patch_${p.key}`)}
          />
        ))}
      </View>
      {patchKey ? (
        <Text style={styles.whyText}>{PATCH_IDEAS.find((p) => p.key === patchKey)!.why}</Text>
      ) : null}

      <Text style={styles.sectionHead}>VCO — OSCILLATOR</Text>
      <View style={styles.chipRow}>
        {SHAPES.map((s) => (
          <LabChip
            key={s.label}
            label={s.label}
            selected={patch.shape === s.v}
            onPress={() => update({ shape: s.v })}
            onLongPress={() => openLesson('vco')}
          />
        ))}
      </View>

      <Text style={styles.sectionHead}>VCF — FILTER</Text>
      <View style={styles.chipRow}>
        {CUTOFFS.map((c) => (
          <LabChip
            key={c}
            label={c >= 1000 ? `${c / 1000}k` : `${c}`}
            selected={patch.cutoff === c}
            onPress={() => update({ cutoff: c })}
            onLongPress={() => openLesson('vcf')}
          />
        ))}
        {RESONANCES.map((r) => (
          <LabChip
            key={r.label}
            label={r.label}
            selected={patch.res === r.v}
            onPress={() => update({ res: r.v })}
            onLongPress={() => openLesson('vcf')}
          />
        ))}
      </View>

      <Text style={styles.sectionHead}>ENVELOPE (ADSR) — VCA + OPTIONAL → CUTOFF</Text>
      <View style={styles.chipRow}>
        {ENV_PRESETS.map((e) => (
          <LabChip
            key={e.key}
            label={e.label}
            selected={patch.envKey === e.key}
            onPress={() => update({ envKey: e.key })}
            onLongPress={() => openLesson('envelope')}
          />
        ))}
        {ENV_TO_CUT.map((e) => (
          <LabChip
            key={e.label}
            label={e.label}
            selected={patch.envToCut === e.v}
            onPress={() => update({ envToCut: e.v })}
            onLongPress={() => openLesson('envelope')}
          />
        ))}
      </View>

      <Text style={styles.sectionHead}>LFO — ONE MODULATOR, THREE EFFECTS</Text>
      <View style={styles.chipRow}>
        {LFO_RATES.map((r) => (
          <LabChip
            key={r}
            label={`${r} Hz`}
            selected={patch.lfoRate === r}
            onPress={() => update({ lfoRate: r })}
            onLongPress={() => openLesson('lfo')}
          />
        ))}
        {LFO_DEPTHS.map((d) => (
          <LabChip
            key={d.label}
            label={d.label}
            selected={patch.lfoDepth === d.v}
            onPress={() => update({ lfoDepth: d.v })}
            onLongPress={() => openLesson('lfo')}
          />
        ))}
      </View>
      <View style={styles.chipRow}>
        {LFO_DESTS.map((d) => (
          <LabChip
            key={d.label}
            label={d.label}
            selected={patch.lfoDest === d.v}
            onPress={() => update({ lfoDest: d.v })}
            onLongPress={() => openLesson('lfo')}
          />
        ))}
      </View>

      <Text style={styles.sectionHead}>SEQUENCER — 8 STEPS (TAP TO CYCLE · ✕ = REST)</Text>
      <View style={styles.chipRow}>
        <LabChip
          label={patch.seqOn ? 'SEQ ON' : 'SEQ OFF'}
          selected={patch.seqOn}
          onPress={() => update({ seqOn: !patch.seqOn })}
          onLongPress={() => openLesson('sequencer')}
        />
        {SEQ_RATES.map((r) => (
          <LabChip
            key={r}
            label={`${r}/s`}
            selected={patch.seqRate === r}
            onPress={() => update({ seqRate: r })}
            onLongPress={() => openLesson('sequencer')}
          />
        ))}
      </View>
      <View style={styles.stepRow}>
        {patch.steps.map((s, i) => (
          <View key={i} style={{ flex: 1 }}>
            <LabChip
              label={s < 0 ? '✕' : `+${s}`}
              selected={running && patch.seqOn && activeStep === i}
              onPress={() => cycleStep(i)}
              onLongPress={() => openLesson('sequencer')}
            />
          </View>
        ))}
      </View>
        <Text style={styles.caption}>
          Steps are semitone offsets from {BASE_FREQ} Hz; each active step retunes the VCO and
          retriggers the envelope. The lit step is the REAL native sequencer position.
        </Text>
      </CollapsibleSection>

      <CollapsibleSection title="ACTIONS">
        {/* AUDIO — engine-gated ≥ v7, honest below. RUN/PLAY lives in the
            header (▶ = run sequence with SEQ on, play drone with it off). */}
        {engineReady ? (
          modReady ? (
            <>
              <Text style={styles.caption}>
                {patch.seqOn ? 'RUN SEQUENCE' : 'PLAY DRONE'} (header ▶) outputs −18 dBFS ·
                uncalibrated. The output stage saturates softly at high resonance (analog-style,
                stated). Sequencer off = a sustained drone so every knob is explorable.
              </Text>
              {genError ? <Text style={styles.error}>{genError}</Text> : null}
            </>
          ) : (
            <Text style={styles.caption}>
              Modular audio needs the v7 engine build — this dev client predates it. The patch
              diagram and lessons are fully functional; install the v7 build to hear the voice.
            </Text>
          )
        ) : null}
      </CollapsibleSection>

      <GuidedLessonSheet
        visible={lessonOpen}
        lesson={getLabLesson('modular')}
        controlKey={lessonKey}
        onClose={() => setLessonOpen(false)}
      />
    </LabShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

const D_H = 176;

/** The live patch-flow diagram: audio boxes VCO→VCF→VCA→OUT on top, mod
 *  sources LFO · ENV · SEQ below; patch cables drawn ONLY for active routings
 *  (env→VCA always; env→cutoff / LFO→dest / SEQ→pitch as configured). The env
 *  box doubles as the REAL env meter while running; the SEQ box carries 8 step
 *  LEDs lit from the REAL native sequencer position. 2026-07-29 visual-
 *  standards re-skin: gradient module plates with screws + engraved labels,
 *  sagging glow-stroked cables with jack plugs — same layout, taps, and state. */
function PatchDiagram({
  patch,
  envLevel,
  activeStep,
  running,
  onBox,
}: {
  patch: Patch;
  envLevel: number;
  /** REAL native sequencer position (−1 when idle) — lights the step LEDs. */
  activeStep: number;
  running: boolean;
  /** Tap a box → open that section's "what it does" help. */
  onBox: (key: string) => void;
}) {
  const [w, setW] = useState(0);
  if (w <= 0) {
    return <View onLayout={(e) => setW(Math.round(e.nativeEvent.layout.width))} style={{ height: D_H }} />;
  }
  const boxW = Math.min(74, (w - 60) / 4);
  const boxH = 34;
  const topY = 22;
  const botY = 112;
  const xs = [0, 1, 2, 3].map((i) => 10 + i * ((w - 20 - boxW) / 3));
  const audio = ['VCO', 'VCF', 'VCA', 'OUT'];
  const audioKeys = ['vco', 'vcf', 'vca', 'out'];
  const mods = ['LFO', 'ENV', 'SEQ'];
  const modKeys = ['lfo', 'envelope', 'sequencer'];
  const mxs = [0, 1, 2].map((i) => 30 + i * ((w - 60 - boxW) / 2));
  const cx = (i: number, top: boolean) => (top ? xs[i] : mxs[i]) + boxW / 2;

  /** Corner screws for one module plate (panel-hardware detail). */
  const screws = (x: number, y: number, key: string) =>
    (
      [
        [x + 5, y + 5],
        [x + boxW - 5, y + 5],
        [x + 5, y + boxH - 5],
        [x + boxW - 5, y + boxH - 5],
      ] as const
    ).map(([sx, sy], k) => (
      <Fragment key={`${key}${k}`}>
        <Circle cx={sx} cy={sy} r={1.7} fill="url(#mdScrew)" />
        <Line x1={sx - 1} y1={sy + 1} x2={sx + 1} y2={sy - 1} stroke="#0d0d11" strokeWidth={0.6} />
      </Fragment>
    ));

  /** Engraved-style label: dark inset copy under the lit face. */
  const label = (x: number, y: number, text: string, fill: string, key: string) => (
    <Fragment key={key}>
      <SvgText x={x} y={y + 1} fill="#000000" fillOpacity={0.55} fontSize={11.5} fontWeight="bold" textAnchor="middle">
        {text}
      </SvgText>
      <SvgText x={x} y={y} fill={fill} fontSize={11.5} fontWeight="bold" textAnchor="middle">
        {text}
      </SvgText>
    </Fragment>
  );

  /** A patch cable from mod box mi up to audio box ai: sagging bezier (it
   *  hangs below the straight run, staying between the rows), color-coded,
   *  glow-stroked — every drawn cable IS an active routing — with jack plugs
   *  at both ends. Same endpoints as before the re-skin. */
  const cable = (mi: number, ai: number, color: string, key: string) => {
    const x1 = cx(mi, false);
    const y1 = botY;
    const x2 = cx(ai, true);
    const y2 = topY + boxH;
    const sagY = (y1 + y2) / 2 + 14;
    const d = `M${x1} ${y1} C ${x1 + (x2 - x1) * 0.2} ${sagY}, ${x1 + (x2 - x1) * 0.8} ${sagY}, ${x2} ${y2}`;
    return (
      <Fragment key={key}>
        <Path d={d} stroke={color} strokeWidth={6} fill="none" opacity={0.18} strokeLinecap="round" />
        <Path d={d} stroke={color} strokeWidth={2.2} fill="none" opacity={0.95} strokeLinecap="round" />
        <Path d={d} stroke="#ffffff" strokeWidth={0.7} fill="none" opacity={0.28} strokeLinecap="round" />
        <Circle cx={x1} cy={y1} r={3.4} fill="#0c0c0f" stroke={color} strokeWidth={1.8} />
        <Circle cx={x2} cy={y2} r={3.4} fill="#0c0c0f" stroke={color} strokeWidth={1.8} />
      </Fragment>
    );
  };

  const lfoColor = '#6fa8ff';
  const envColor = '#5bff85';
  const seqColor = '#ff8d7a';
  const envW = (boxW - 4) * Math.max(0, Math.min(1, envLevel));

  return (
    <View onLayout={(e) => setW(Math.round(e.nativeEvent.layout.width))}>
      <Svg width={w} height={D_H}>
        <Defs>
          <LinearGradient id="mdBg" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#14141a" />
            <Stop offset="100%" stopColor="#0a0a0e" />
          </LinearGradient>
          {/* Module plate: brushed-panel gradient, lit from the top. */}
          <LinearGradient id="mdPlate" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#26262e" />
            <Stop offset="45%" stopColor="#17171c" />
            <Stop offset="100%" stopColor="#101014" />
          </LinearGradient>
          <RadialGradient id="mdScrew" cx="35%" cy="30%" r="80%">
            <Stop offset="0%" stopColor="#b9b9c4" />
            <Stop offset="100%" stopColor="#52525c" />
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width={w} height={D_H} rx={8} fill="url(#mdBg)" />
        {/* Audio path: glow-backed amber run with arrowheads. */}
        {[0, 1, 2].map((i) => {
          const y = topY + boxH / 2;
          return (
            <Fragment key={i}>
              <Line x1={xs[i] + boxW} y1={y} x2={xs[i + 1]} y2={y} stroke={colors.amber} strokeWidth={5.5} opacity={0.15} />
              <Line x1={xs[i] + boxW} y1={y} x2={xs[i + 1] - 4} y2={y} stroke={colors.amber} strokeWidth={2.2} />
              <Path d={`M${xs[i + 1] - 6.5} ${y - 4} L${xs[i + 1]} ${y} L${xs[i + 1] - 6.5} ${y + 4} Z`} fill={colors.amber} />
            </Fragment>
          );
        })}
        {/* Active patch cables. */}
        {cable(1, 2, envColor, 'env-vca') /* env → VCA — always */}
        {patch.envToCut > 0 ? cable(1, 1, envColor, 'env-vcf') : null}
        {patch.lfoDepth > 0 && patch.lfoDest === 1 ? cable(0, 0, lfoColor, 'lfo-vco') : null}
        {patch.lfoDepth > 0 && patch.lfoDest === 2 ? cable(0, 1, lfoColor, 'lfo-vcf') : null}
        {patch.lfoDepth > 0 && patch.lfoDest === 3 ? cable(0, 2, lfoColor, 'lfo-vca') : null}
        {patch.seqOn ? cable(2, 0, seqColor, 'seq-vco') : null}
        {/* Audio boxes — tap for what each does. */}
        {audio.map((name, i) => (
          <G key={name} onPress={() => onBox(audioKeys[i])}>
            <Rect x={xs[i] + 1.5} y={topY + 2.5} width={boxW} height={boxH} rx={7} fill="#000000" opacity={0.45} />
            <Rect x={xs[i]} y={topY} width={boxW} height={boxH} rx={7} fill="url(#mdPlate)" stroke={colors.amber} strokeWidth={1.4} />
            <Rect x={xs[i] + 1.5} y={topY + 1.5} width={boxW - 3} height={boxH - 3} rx={5.5} fill="none" stroke="#ffffff" strokeOpacity={0.07} strokeWidth={1} />
            {screws(xs[i], topY, `as${i}`)}
            {label(xs[i] + boxW / 2, topY + boxH / 2 + 4, name, colors.textPrimary, `al${i}`)}
          </G>
        ))}
        {/* Mod boxes (ENV doubles as the real env meter while running; SEQ
            carries the real step LEDs). */}
        {mods.map((name, i) => {
          const color = i === 0 ? lfoColor : i === 1 ? envColor : seqColor;
          const active =
            i === 0 ? patch.lfoDepth > 0 && patch.lfoDest > 0 : i === 1 ? true : patch.seqOn;
          return (
            <G key={name} onPress={() => onBox(modKeys[i])}>
              <Rect x={mxs[i] + 1.5} y={botY + 2.5} width={boxW} height={boxH} rx={7} fill="#000000" opacity={0.45} />
              <Rect
                x={mxs[i]}
                y={botY}
                width={boxW}
                height={boxH}
                rx={7}
                fill="url(#mdPlate)"
                stroke={color}
                strokeWidth={1.4}
                opacity={active ? 1 : 0.35}
              />
              <Rect x={mxs[i] + 1.5} y={botY + 1.5} width={boxW - 3} height={boxH - 3} rx={5.5} fill="none" stroke="#ffffff" strokeOpacity={0.07} strokeWidth={1} />
              {screws(mxs[i], botY, `ms${i}`)}
              {i === 1 && running ? (
                <Fragment key="meter">
                  {/* Lit-LED env meter: glow halo + fill + hot leading edge. */}
                  <Rect x={mxs[i] + 0.5} y={botY + 0.5} width={envW + 3} height={boxH - 1} rx={5} fill={envColor} opacity={0.12} />
                  <Rect x={mxs[i] + 2} y={botY + 2} width={envW} height={boxH - 4} rx={4} fill={envColor} opacity={0.3} />
                  <Line x1={mxs[i] + 2 + envW} y1={botY + 4} x2={mxs[i] + 2 + envW} y2={botY + boxH - 4} stroke="#c9ffd9" strokeWidth={1.5} opacity={0.9} />
                </Fragment>
              ) : null}
              {i === 2
                ? patch.steps.map((s, k) => {
                    const lx = mxs[i] + (boxW / 9) * (k + 1);
                    const ly = botY + boxH - 6;
                    const lit = running && patch.seqOn && activeStep === k;
                    const gated = s >= 0;
                    return (
                      <Fragment key={`led${k}`}>
                        {lit ? <Circle cx={lx} cy={ly} r={4.5} fill={seqColor} opacity={0.35} /> : null}
                        <Circle
                          cx={lx}
                          cy={ly}
                          r={1.8}
                          fill={lit ? '#ffd9cf' : gated ? seqColor : '#3a3a42'}
                          opacity={lit ? 1 : gated ? (patch.seqOn ? 0.55 : 0.3) : 0.8}
                        />
                      </Fragment>
                    );
                  })
                : null}
              {label(
                mxs[i] + boxW / 2,
                botY + boxH / 2 + (i === 2 ? 1 : 4),
                name,
                active ? colors.textPrimary : colors.textSub,
                `ml${i}`,
              )}
            </G>
          );
        })}
        <SvgText x={10} y={D_H - 6} fill="#4a4a52" fontSize={9}>
          audio path
        </SvgText>
        <SvgText x={w - 10} y={D_H - 6} fill="#4a4a52" fontSize={9} textAnchor="end">
          mod sources — cables = active routings
        </SvgText>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stepRow: { flexDirection: 'row', gap: 4 },
  sectionHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1.5, color: colors.amber },
  caption: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
  whyText: { fontFamily: fonts.barlowMedium, fontSize: 12.5, lineHeight: 17, color: colors.textSecondary },
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
