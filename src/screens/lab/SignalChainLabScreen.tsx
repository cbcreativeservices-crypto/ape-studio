/**
 * SignalChainLabScreen — the Pillar B CAPSTONE (v4 MASTER §8): the full
 * processing chain as one instrument. Single labs teach each effect alone;
 * this teaches the INTERACTIONS — what each module feeds the next changes
 * what the next one does.
 *
 * RACK UNIT (APE_LAB_UX_PROPOSAL 2026-08-23, owner-approved): the CHAIN
 * DIAGRAM is the hero and PINS on the stage — Source → EQ → Comp → Gate →
 * Dist → Mod → Delay → Reverb → Stereo → Limiter → Out, each module a
 * tappable pill (amber = in the chain, dim = bypassed; tap toggles it LIVE) —
 * with the three live GR meters (comp/gate/limiter, real fxGrStatus) in a
 * compact row on the same glass: toggle a module and WATCH the dynamics
 * react, nothing scrolls away. Bezel = source / chain count / scenario /
 * transport state. Dock: SCENARIO and SOURCE as sticky trays (A/B while the
 * chain re-lights), CLEAR CHAIN in the scenario tray (reset-in-container);
 * PLAY/STOP is the compact HeaderPlayButton. Teaching prose scrolls in the
 * well.
 *
 * HONESTY (§1.7): modules run their lab-default teaching parameters (each
 * module's full controls live in its own lab — stated on screen); the chain
 * order is the FIXED canonical order (reordering is a future lesson; the
 * order lessons live in the ⓘ Common Mistakes). GR meters are measured.
 * Audio needs the v6 engine build — below it the diagram + lessons stay live
 * with the standard honest note.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ApeDsp, FX, FX_PARAM, EQ_BAND_TYPES, GEN_MODES, type GenParams } from '../../../modules/ape-dsp';
import { useAudioOutputGate } from '../../features/audio/AudioOutputGate';
import { noteAudioActivity } from '../../features/audio/audioOutputStore';
import { GuidedLessonSheet, getLabLesson, SOURCE_LESSON, type LessonContent } from '../../features/lab/guidedLessons';
import { GrMeter } from '../../features/lab/fxViz';
import { LabReviewButton } from '../../features/lab/LabReviewButton';
import { EngineGate } from '../tools/EngineGate';
import type { EngineState } from '../../features/tools/engine/useDspEngine';
import { colors, fonts } from '../../theme/tokens';
import { LabShell, HeaderPlayButton } from './LabShell';

const GEN_LEVEL_DB = -20;
const ACTIVITY_MS = 500;
const GR_POLL_MS = 100;
const P = FX_PARAM;

/** The chain modules in the FIXED canonical order (matches fx::Id routing). */
const MODULES: { id: number; label: string }[] = [
  { id: FX.eq, label: 'EQ' },
  { id: FX.comp, label: 'COMP' },
  { id: FX.gate, label: 'GATE' },
  { id: FX.dist, label: 'DIST' },
  { id: FX.mod, label: 'MOD' },
  { id: FX.delay, label: 'DELAY' },
  { id: FX.reverb, label: 'REVERB' },
  { id: FX.stereo, label: 'STEREO' },
  { id: FX.limiter, label: 'LIMIT' },
];

type FxOp = { fx: number; param: number; value: number };

/** Teaching-default params per module (pushed whenever a scenario arms it —
 *  each module's full controls live in its own lab). */
const DEFAULTS: Record<number, FxOp[]> = {
  [FX.eq]: [
    { fx: FX.eq, param: P.eqBand(0, 'type'), value: EQ_BAND_TYPES.lowShelf },
    { fx: FX.eq, param: P.eqBand(0, 'freq'), value: 150 },
    { fx: FX.eq, param: P.eqBand(0, 'q'), value: 0.7 },
    { fx: FX.eq, param: P.eqBand(0, 'gain'), value: 9 },
  ],
  [FX.comp]: [
    { fx: FX.comp, param: P.thresholdDb, value: -30 },
    { fx: FX.comp, param: P.ratio, value: 4 },
    { fx: FX.comp, param: P.attackMs, value: 5 },
    { fx: FX.comp, param: P.releaseMs, value: 120 },
  ],
  [FX.gate]: [
    { fx: FX.gate, param: P.thresholdDb, value: -35 },
    { fx: FX.gate, param: P.rangeDb, value: -70 },
    { fx: FX.gate, param: P.releaseMs, value: 100 },
  ],
  [FX.dist]: [
    { fx: FX.dist, param: P.distType, value: 1 },
    { fx: FX.dist, param: P.driveDb, value: 12 },
    { fx: FX.dist, param: P.distMix, value: 1 },
  ],
  [FX.mod]: [
    { fx: FX.mod, param: P.modMode, value: 0 },
    { fx: FX.mod, param: P.rateHz, value: 0.25 },
    { fx: FX.mod, param: P.depth, value: 0.5 },
    { fx: FX.mod, param: P.modMix, value: 0.5 },
  ],
  [FX.delay]: [
    { fx: FX.delay, param: P.timeMs, value: 375 },
    { fx: FX.delay, param: P.delayFeedback, value: 0.4 },
    { fx: FX.delay, param: P.delayMix, value: 0.5 },
  ],
  [FX.reverb]: [
    { fx: FX.reverb, param: P.rt60, value: 1.5 },
    { fx: FX.reverb, param: P.reverbMix, value: 0.5 },
  ],
  [FX.stereo]: [{ fx: FX.stereo, param: P.widthPct, value: 150 }],
  [FX.limiter]: [
    { fx: FX.limiter, param: P.ceilingDb, value: -25 },
    { fx: FX.limiter, param: P.releaseMs, value: 120 },
  ],
};

/** Scenario presets — each demonstrates a signature INTERACTION.
 *  `short` = the dock-button/bezel value (~7 mono chars). */
const SCENARIOS: { key: string; label: string; short: string; enable: number[]; sourceIdx: number; lesson: string }[] = [
  {
    key: 'bass_comp', label: 'EQ BOOST → COMP', short: 'EQ→COMP', enable: [FX.eq, FX.comp], sourceIdx: 1,
    lesson: 'The +9 dB low shelf feeds the compressor MORE bass — watch its GR rise: EQ before compression changes what the compressor reacts to.',
  },
  {
    key: 'delay_reverb', label: 'DELAY → REVERB', short: 'DLY→REV', enable: [FX.delay, FX.reverb], sourceIdx: 0,
    lesson: 'Each echo excites the reverb — repeats get washed into space. Reverb→delay would echo the WASH instead: order is a creative choice.',
  },
  {
    key: 'gate_click', label: 'GATE THE CLICK', short: 'GATE', enable: [FX.gate], sourceIdx: 0,
    lesson: 'The gate opens on every hit and slams shut between — watch its GR drop to zero on each click and return in the silence.',
  },
  {
    key: 'squash', label: 'HOT INTO LIMITER', short: 'SQUASH', enable: [FX.eq, FX.comp, FX.limiter], sourceIdx: 1,
    lesson: 'Boost + compression makeup run hot into the limiter, which flattens what is left — bad gain-staging squashes. Watch BOTH meters.',
  },
  {
    key: 'full', label: 'FULL CHAIN', short: 'FULL', enable: [FX.eq, FX.comp, FX.delay, FX.reverb, FX.stereo, FX.limiter], sourceIdx: 0,
    lesson: 'The whole path lit. Toggle modules one at a time — the difference between the sum and the parts IS the interaction.',
  },
];

const SOURCES: { label: string; short: string; gen: GenParams; srcKey: string }[] = [
  { label: 'CLICK 90', short: 'CLICK', gen: { mode: GEN_MODES.click, clickBpm: 90 }, srcKey: 'click' },
  { label: 'PINK NOISE', short: 'PINK', gen: { mode: GEN_MODES.pink }, srcKey: 'pink' },
  { label: 'SINE 220', short: 'SINE', gen: { mode: GEN_MODES.sine, frequency: 220 }, srcKey: 'sine' },
];

export function SignalChainLabScreen() {
  const { requestAudioOutput } = useAudioOutputGate();

  const [gate] = useState<EngineState>(() => {
    if (!ApeDsp.isAvailable()) return 'absent';
    return ApeDsp.engineVersion() >= 2 ? 'idle' : 'spike';
  });
  const engineReady = gate === 'idle';
  const fxReady = engineReady && ApeDsp.fxAvailable();

  const [sourceIdx, setSourceIdx] = useState(0);
  const [enabled, setEnabled] = useState<Record<number, boolean>>({});
  const [scenarioKey, setScenarioKey] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [genError, setGenError] = useState('');
  const [gr, setGr] = useState({ comp: 0, gate: 0, limiter: 0 });

  const [lessonKey, setLessonKey] = useState<string | undefined>(undefined);
  const [lessonOpen, setLessonOpen] = useState(false);
  const [lessonContent, setLessonContent] = useState<LessonContent>(() => getLabLesson('chain'));
  const openLesson = useCallback((key?: string) => {
    setLessonContent(getLabLesson('chain'));
    setLessonKey(key);
    setLessonOpen(true);
  }, []);
  const openSourceHelp = useCallback((srcKey: string) => {
    setLessonContent(SOURCE_LESSON);
    setLessonKey(srcKey);
    setLessonOpen(true);
  }, []);

  const genRef = useRef(0);

  /** Push defaults + enables for the current map (targets-first per module). */
  const pushChain = useCallback((en: Record<number, boolean>) => {
    ApeDsp.fxReset();
    for (const m of MODULES) {
      if (!en[m.id]) continue;
      for (const op of DEFAULTS[m.id] ?? []) ApeDsp.fxSet(op.fx, op.param, op.value);
      ApeDsp.fxSet(m.id, 0, 1);
    }
  }, []);

  const start = useCallback(async () => {
    if (!fxReady) return;
    const gen = ++genRef.current;
    const ok = await requestAudioOutput();
    if (!ok || gen !== genRef.current) return;
    setGenError('');
    ApeDsp.genSet({ levelDb: GEN_LEVEL_DB, ...SOURCES[sourceIdx].gen });
    pushChain(enabled);
    try {
      await ApeDsp.genStart();
      if (gen !== genRef.current) {
        void ApeDsp.genStop();
        ApeDsp.fxReset();
        return;
      }
      setRunning(true);
      noteAudioActivity();
    } catch (e) {
      if (gen === genRef.current) setGenError(e instanceof Error ? e.message : String(e));
      ApeDsp.fxReset();
    }
  }, [fxReady, requestAudioOutput, sourceIdx, enabled, pushChain]);

  const stop = useCallback(() => {
    genRef.current++;
    void ApeDsp.genStop();
    ApeDsp.fxReset();
    setRunning(false);
    setGr({ comp: 0, gate: 0, limiter: 0 });
  }, []);

  useFocusEffect(useCallback(() => () => stop(), [stop]));
  useEffect(() => {
    if (!running) return;
    const id = setInterval(noteAudioActivity, ACTIVITY_MS);
    return () => clearInterval(id);
  }, [running]);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const g = ApeDsp.fxGrStatus();
      if (g) setGr(g);
    }, GR_POLL_MS);
    return () => clearInterval(id);
  }, [running]);

  /** Toggle one module (live when sounding). Clears the scenario tag — the
   *  chain is now the student's own. */
  const toggleModule = (id: number) => {
    setEnabled((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      if (running) {
        if (next[id]) {
          for (const op of DEFAULTS[id] ?? []) ApeDsp.fxSet(op.fx, op.param, op.value);
          ApeDsp.fxSet(id, 0, 1);
        } else {
          ApeDsp.fxSet(id, 0, 0);
        }
        noteAudioActivity();
      }
      return next;
    });
    setScenarioKey(null);
  };

  const applyScenario = (key: string) => {
    const sc = SCENARIOS.find((s) => s.key === key)!;
    const en: Record<number, boolean> = {};
    for (const id of sc.enable) en[id] = true;
    setEnabled(en);
    setScenarioKey(key);
    setSourceIdx(sc.sourceIdx);
    if (running) {
      ApeDsp.genSet({ levelDb: GEN_LEVEL_DB, ...SOURCES[sc.sourceIdx].gen });
      pushChain(en);
      noteAudioActivity();
    }
  };

  /** Empty the chain (scenario-tray ⟲ — reset-in-container). Live = go dry. */
  const clearChain = () => {
    setEnabled({});
    setScenarioKey(null);
    if (running) {
      pushChain({});
      noteAudioActivity();
    }
  };

  const scenario = scenarioKey ? SCENARIOS.find((s) => s.key === scenarioKey) : null;
  const anyOn = MODULES.some((m) => enabled[m.id]);
  const chainCount = MODULES.filter((m) => enabled[m.id]).length;
  const anyDyn = !!(enabled[FX.comp] || enabled[FX.gate] || enabled[FX.limiter]);

  return (
    <LabShell
      labId="chain"
      title="SIGNAL CHAIN BUILDER"
      subtitle="The capstone — effects interact"
      intro={getLabLesson('chain').whatItIs}
      exploreCaption="Tap modules in or out of the chain — or start from a scenario that demonstrates a signature interaction."
      headerAction={
        <HeaderPlayButton
          playing={running}
          disabled={!fxReady}
          onPress={() => (running ? stop() : void start())}
          label={running ? 'Stop' : anyOn ? 'Play the chain' : 'Play (chain empty — dry)'}
        />
      }
      rack={{
        // No continuous params in this lab (modules run lab defaults — each
        // module's fader lives in its OWN lab), so no fader binds the lane;
        // the id is nominal and the frame hides the lane.
        initialParam: 'scenario',
        onHelp: openLesson,
        stage: {
          size: 'L', // the chain diagram IS the lab — earns the tall glass
          badge: 'MODULES RUN LAB-DEFAULT SETTINGS — GR METERS MEASURED, LIVE',
          onGuide: () => openLesson('display'),
          bezel: [
            { k: 'SRC', v: SOURCES[sourceIdx].label },
            { k: 'CHAIN', v: `${chainCount}/9`, helpKey: 'module_toggle' },
            { k: 'SCENE', v: scenario?.short ?? (anyOn ? 'CUSTOM' : '—'), flex: 1.4, helpKey: 'chain_order' },
            { k: 'OUT', v: running ? 'LIVE' : 'IDLE', helpKey: 'gain_staging' },
          ],
          render: (_w, h) => (
            <View style={[styles.stageInner, { height: h }]}>
              {/* THE CHAIN — the hero. Tap a module to toggle it LIVE. */}
              <View style={{ gap: 6 }}>
                <Text style={styles.stageHead}>THE CHAIN — CANONICAL ORDER (tap a module to toggle it)</Text>
                <View style={styles.chainWrap}>
                  <Text style={styles.chainEnd}>SRC</Text>
                  {MODULES.map((m) => (
                    <View key={m.id} style={styles.chainSeg}>
                      <Text style={styles.chainArrow}>→</Text>
                      <Pressable
                        onPress={() => toggleModule(m.id)}
                        onLongPress={() => openLesson('module_toggle')}
                        delayLongPress={350}
                        style={[styles.node, enabled[m.id] && styles.nodeOn]}
                        accessibilityRole="button"
                        accessibilityState={{ selected: !!enabled[m.id] }}
                        accessibilityLabel={`${m.label} ${enabled[m.id] ? 'in the chain' : 'bypassed'}`}
                      >
                        <Text style={[styles.nodeText, enabled[m.id] && styles.nodeTextOn]}>{m.label}</Text>
                      </Pressable>
                    </View>
                  ))}
                  <Text style={styles.chainArrow}>→</Text>
                  <Text style={styles.chainEnd}>OUT</Text>
                </View>
              </View>
              {/* LIVE GR — the interaction made measurable (real engine
                  readout), a compact row on the same glass so a toggle and its
                  meter reaction are co-visible. Long-press for the lesson. */}
              {anyDyn ? (
                <Pressable
                  style={{ gap: 6 }}
                  onLongPress={() => openLesson('gain_reduction')}
                  delayLongPress={350}
                  accessibilityRole="button"
                  accessibilityLabel="Gain-reduction meters — what they show"
                >
                  <Text style={styles.stageHead}>GAIN REDUCTION — LIVE (measured per module)</Text>
                  <View style={styles.grRow}>
                    {enabled[FX.comp] ? (
                      <View style={styles.grCell}><GrMeter grDb={running ? gr.comp : 0} label="COMP" /></View>
                    ) : null}
                    {enabled[FX.gate] ? (
                      <View style={styles.grCell}><GrMeter grDb={running ? gr.gate : 0} maxDb={70} label="GATE" /></View>
                    ) : null}
                    {enabled[FX.limiter] ? (
                      <View style={styles.grCell}><GrMeter grDb={running ? gr.limiter : 0} label="LIMIT" /></View>
                    ) : null}
                  </View>
                </Pressable>
              ) : null}
            </View>
          ),
        },
        params: [
          {
            kind: 'options',
            id: 'scenario',
            label: 'SCENARIO',
            valueLabel: scenario?.short ?? (anyOn ? 'CUSTOM' : '—'),
            options: SCENARIOS.map((s) => ({ id: s.key, label: s.label })),
            selectedId: scenarioKey,
            onSelect: applyScenario,
            sticky: true, // A/B interactions while the chain re-lights — the lesson
            onReset: { label: 'CLEAR CHAIN', onPress: clearChain },
            helpKey: 'chain_order',
          },
          {
            kind: 'options',
            id: 'source',
            label: 'SOURCE',
            valueLabel: SOURCES[sourceIdx].short,
            options: SOURCES.map((s) => ({
              id: s.srcKey,
              label: s.label,
              // Source long-presses keep their OWN lesson book (SOURCE_LESSON).
              onLongPress: () => openSourceHelp(s.srcKey),
            })),
            selectedId: SOURCES[sourceIdx].srcKey,
            onSelect: (id) => {
              const i = SOURCES.findIndex((s) => s.srcKey === id);
              if (i < 0) return;
              setSourceIdx(i);
              if (running) {
                ApeDsp.genSet({ levelDb: GEN_LEVEL_DB, ...SOURCES[i].gen });
                noteAudioActivity();
              }
            },
            sticky: true, // hear the SAME chain on click vs noise vs sine
          },
        ],
      }}
    >
      {!engineReady ? <EngineGate state={gate} /> : null}

      <Text style={styles.caption}>
        Modules run their lab-default teaching settings — each module’s full controls live in its
        own lab. The order is the fixed canonical order; WHY it matters is in the ⓘ mistakes.
      </Text>

      {scenario ? <Text style={styles.scenarioLesson}>{scenario.lesson}</Text> : null}

      {engineReady ? (
        fxReady ? (
          <>
            <Text style={styles.caption}>
              {`${SOURCES[sourceIdx].label.toLowerCase()} → ${
                MODULES.filter((m) => enabled[m.id]).map((m) => m.label.toLowerCase()).join(' → ') || '(nothing)'
              } → output. Toggle modules while it plays (header ▶).`}
            </Text>
            {genError ? <Text style={styles.error}>{genError}</Text> : null}
          </>
        ) : (
          <Text style={styles.caption}>
            Chain AUDIO needs the v6 engine build — this dev client predates the effects path. The
            diagram, scenarios, and lessons are fully live; install the next dev build to hear it.
          </Text>
        )
      ) : null}

      {/* R6c: sandbox capstone — no modules/challenge; explicit review credit. */}
      <LabReviewButton labKey="af_signal_chain" />

      <GuidedLessonSheet
        visible={lessonOpen}
        lesson={lessonContent}
        controlKey={lessonKey}
        onClose={() => setLessonOpen(false)}
      />
    </LabShell>
  );
}

const styles = StyleSheet.create({
  caption: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
  scenarioLesson: { fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 18, color: colors.textSecondary },
  error: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: '#ff6b5e' },

  // Stage: chain diagram on top, GR meter row anchored below on the same glass.
  stageInner: { padding: 10, justifyContent: 'space-between', gap: 8 },
  stageHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 9.5, letterSpacing: 1.2, color: colors.textSub },
  grRow: { flexDirection: 'row', gap: 10 },
  grCell: { flex: 1 },

  chainWrap: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 4 },
  chainSeg: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  chainEnd: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, color: colors.textSub, letterSpacing: 0.5 },
  chainArrow: { fontFamily: fonts.barlowRegular, fontSize: 12, color: '#3a3a44' },
  node: {
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#2c2c33',
    backgroundColor: '#101014',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  nodeOn: { borderColor: 'rgba(255,198,77,.65)', backgroundColor: '#1a1409' },
  nodeText: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 0.8, color: colors.textSub },
  nodeTextOn: { color: colors.amber },
});
