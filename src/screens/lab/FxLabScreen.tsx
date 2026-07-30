/**
 * FxLabScreen — the config-driven screen for every EFFECT lab (v4 MASTER
 * Pillar B). One structure across all 12 labs so the student's attention goes
 * to the CONCEPT, not to relearning UI.
 *
 * LAYOUT v2 (owner 2026-07-29): the lab sits on LabShell (header · mode tabs ·
 * DESCRIPTION · bottom GUIDED LESSON row) and renders its Explore content in
 * the standard collapsible order:
 *
 *   READOUTS  — current source + param values, and the LIVE GR meter where
 *               the effect reduces gain (REAL engine readout, never simulated)
 *   DISPLAY   — the ANIMATED signal-flow hero (fxAnim, Skia — signal traveling
 *               through the effect) above the static analytic hero, which
 *               ALWAYS renders (it is the response-curve source of truth)
 *   CONTROLS  — param chip rows (long-press = that control's lesson)
 *   ACTIONS   — source chips + audio status / honest engine notes
 *
 * The primary source PLAY/STOP is the compact HeaderPlayButton at the TOP
 * RIGHT of the header (LabShell headerAction); the old top guided-lesson chip
 * is gone — LabShell's bottom row is the lesson entry.
 *
 * HONESTY (§1.7):
 *  - static visuals: "DESIGNED RESPONSE — ANALYTIC" (same formulas as the DSP);
 *  - the animated hero is a MODEL of the signal flowing through the effect,
 *    computed from the SAME param values driving the audio and the SAME fxViz
 *    math — badged as a teaching visual, motion modeled, never a measurement;
 *  - the GR meter is measured (fxGrStatus), never simulated;
 *  - effect AUDIO needs the v6 engine build — below v6 the visuals + lessons
 *    are fully live and an honest note replaces the audio path.
 *
 * SKIA GATING (skiaGate idiom): fxAnim.tsx is loaded ONLY through
 * requireFxAnim() below — an inline require gated on the foundations probe —
 * so pre-Skia clients never evaluate it and keep today's static heroes.
 *
 * Audio lifecycle = the established generator idiom (gate → genSet/genStart →
 * generation counter → 2 Hz keepalive → stop on blur/unmount), plus: fx params
 * are pushed BEFORE the node is enabled (targets-first, mirrors genSet), and
 * stop disables the whole chain (fxReset) so no lab leaks effects into another.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { ApeDsp, GEN_MODES, type GenParams } from '../../../modules/ape-dsp';
import { useAudioOutputGate } from '../../features/audio/AudioOutputGate';
import { noteAudioActivity } from '../../features/audio/audioOutputStore';
import { GuidedLessonSheet, getLabLesson, SOURCE_LESSON, DisplayGuideButton, type LabId, type LessonContent } from '../../features/lab/guidedLessons';
import { GrMeter } from '../../features/lab/fxViz';
import { EngineGate } from '../tools/EngineGate';
import type { EngineState } from '../../features/tools/engine/useDspEngine';
import { colors, fonts } from '../../theme/tokens';
import { CollapsibleSection, HeaderPlayButton, LabChip, LabShell } from './LabShell';
import { skiaAvailable } from './foundations/skiaGate';
import type { FxAnimModel } from './fxAnim';

const GEN_LEVEL_DB = -20;
const ACTIVITY_MS = 500;
const GR_POLL_MS = 100;

/** fxAnim — the Skia ANIMATED signal-flow heroes. Loaded ONLY via this inline
 *  require, gated on the foundations Skia probe (skiaGate idiom): pre-Skia
 *  clients never evaluate the module and keep the static fxViz heroes exactly
 *  as before. (`import type` above is erased — no eager load.) */
type FxAnimModule = typeof import('./fxAnim');
let fxAnimModule: FxAnimModule | null = null;
function requireFxAnim(): FxAnimModule | null {
  if (!skiaAvailable) return null;
  if (fxAnimModule == null) fxAnimModule = require('./fxAnim') as FxAnimModule;
  return fxAnimModule;
}

/** Honesty badge for the animated hero (§1.7 — a model, mirroring the math). */
const ANIM_BADGE =
  'SIGNAL THROUGH THE EFFECT — TEACHING VISUAL · EXACT JS MIRROR OF THE DSP MATH (motion modeled, not audio-rate)';

/** The SOURCE_LESSON control key for a generator source, from its mode. */
function sourceKeyForGen(gen: GenParams): string {
  switch (gen.mode) {
    case GEN_MODES.sine: return 'sine';
    case GEN_MODES.white: return 'white';
    case GEN_MODES.pink: return 'pink';
    case GEN_MODES.brown: return 'brown';
    case GEN_MODES.blue: return 'blue';
    case GEN_MODES.violet: return 'violet';
    case GEN_MODES.sweepLin:
    case GEN_MODES.sweepLog: return 'sweep';
    case GEN_MODES.impulse:
    case GEN_MODES.click: return 'click';
    case GEN_MODES.burst: return 'burst';
    case GEN_MODES.additive: return 'additive';
    default: return 'sine';
  }
}

export type FxParamSpec = {
  /** Section head above the chip row. */
  label: string;
  paramId: number;
  /** Guided-lesson control key (content.ts) — omitted = opens the lab lesson. */
  lessonKey?: string;
  choices: { label: string; value: number }[];
  initial: number;
};

export type FxSourceSpec = { label: string; gen: GenParams };

export type FxLabConfig = {
  labId: LabId;
  /** fx::Id of this lab's node. */
  fxId: number;
  title: string;
  subtitle: string;
  intro: string;
  exploreCaption: string;
  sources: FxSourceSpec[];
  params: FxParamSpec[];
  /** Fixed params pushed on start before the user params (e.g. mod mode). */
  fixed?: { paramId: number; value: number }[];
  /** The hero teaching visual, rendered from the current param values. */
  Hero: (values: Record<number, number>) => ReactNode;
  heroBadge: string;
  heroCaption?: (values: Record<number, number>) => string;
  /** The ANIMATED signal-flow hero: maps the CURRENT param values to a fxAnim
   *  model. Optional — labs without an authored animation (or clients without
   *  Skia) render the static Hero alone, exactly as before. */
  anim?: (values: Record<number, number>) => FxAnimModel;
  /** Poll the live GR readout while running (which field to show). */
  pollGr?: 'comp' | 'gate' | 'limiter';
  /** Optional honest note under the audio section. */
  note?: string;
};

/** The currently selected choice's chip label (readout row). */
function choiceLabel(p: FxParamSpec, v: number): string {
  return p.choices.find((c) => c.value === v)?.label ?? String(v);
}

export function FxLabScreen({ config }: { config: FxLabConfig }) {
  const { requestAudioOutput } = useAudioOutputGate();
  const focused = useIsFocused();

  const [gate] = useState<EngineState>(() => {
    if (!ApeDsp.isAvailable()) return 'absent';
    return ApeDsp.engineVersion() >= 2 ? 'idle' : 'spike';
  });
  const engineReady = gate === 'idle';
  const fxReady = engineReady && ApeDsp.fxAvailable();

  const [sourceIdx, setSourceIdx] = useState(0);
  const [values, setValues] = useState<Record<number, number>>(() =>
    Object.fromEntries(config.params.map((p) => [p.paramId, p.initial])),
  );
  const [running, setRunning] = useState(false);
  const [genError, setGenError] = useState('');
  const [grDb, setGrDb] = useState(0);

  // Help popup — one sheet, but it can show either the LAB lesson (controls,
  // GR meter) or the shared SOURCE lesson (test signals). Track which.
  const [help, setHelp] = useState<{ lesson: LessonContent; key?: string } | null>(null);
  const labLesson = useMemo(() => getLabLesson(config.labId), [config.labId]);
  const openLesson = useCallback((key?: string) => setHelp({ lesson: labLesson, key }), [labLesson]);
  const openSourceHelp = useCallback((gen: GenParams) => setHelp({ lesson: SOURCE_LESSON, key: sourceKeyForGen(gen) }), []);

  // The gated animated-hero module (null on pre-Skia clients).
  const fxAnim = useMemo(() => (config.anim ? requireFxAnim() : null), [config.anim]);

  // -- Audio lifecycle (generation-guarded; chain reset on every stop) -------
  const genRef = useRef(0);

  const pushAllParams = useCallback(
    (vals: Record<number, number>) => {
      for (const f of config.fixed ?? []) ApeDsp.fxSet(config.fxId, f.paramId, f.value);
      for (const p of config.params) ApeDsp.fxSet(config.fxId, p.paramId, vals[p.paramId]);
      ApeDsp.fxSet(config.fxId, 0, 1); // enable LAST (targets-first)
    },
    [config],
  );

  const start = useCallback(async () => {
    if (!fxReady) return;
    const gen = ++genRef.current;
    const ok = await requestAudioOutput();
    if (!ok || gen !== genRef.current) return;
    setGenError('');
    ApeDsp.genSet({ levelDb: GEN_LEVEL_DB, ...config.sources[sourceIdx].gen });
    pushAllParams(values);
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
  }, [fxReady, requestAudioOutput, config, sourceIdx, values, pushAllParams]);

  const stop = useCallback(() => {
    genRef.current++;
    void ApeDsp.genStop();
    ApeDsp.fxReset(); // leave NOTHING armed for the next lab
    setRunning(false);
    setGrDb(0);
  }, []);

  useFocusEffect(useCallback(() => () => stop(), [stop]));
  useEffect(() => {
    if (!running) return;
    const id = setInterval(noteAudioActivity, ACTIVITY_MS);
    return () => clearInterval(id);
  }, [running]);

  // Live GR polling — the REAL measured gain reduction (honest meter).
  useEffect(() => {
    if (!running || !config.pollGr) return;
    const id = setInterval(() => {
      const g = ApeDsp.fxGrStatus();
      if (g) setGrDb(g[config.pollGr!]);
    }, GR_POLL_MS);
    return () => clearInterval(id);
  }, [running, config.pollGr]);

  // Param change: update state; push live when sounding.
  const setParam = (paramId: number, v: number) => {
    setValues((prev) => {
      const next = { ...prev, [paramId]: v };
      if (running) {
        ApeDsp.fxSet(config.fxId, paramId, v);
        noteAudioActivity();
      }
      return next;
    });
  };
  const pickSource = (i: number) => {
    setSourceIdx(i);
    if (running) {
      ApeDsp.genSet({ levelDb: GEN_LEVEL_DB, ...config.sources[i].gen });
      noteAudioActivity();
    }
  };

  return (
    <LabShell
      labId={config.labId}
      title={config.title}
      subtitle={config.subtitle}
      intro={config.intro}
      exploreCaption={config.exploreCaption}
      headerAction={
        <HeaderPlayButton
          playing={running}
          disabled={!fxReady}
          onPress={() => (running ? stop() : void start())}
          label={running ? 'Stop the effect audio' : 'Play the source through the effect'}
        />
      }
    >
      {!engineReady ? <EngineGate state={gate} /> : null}

      {/* READOUTS — the current settings at a glance + the LIVE GR meter. */}
      <CollapsibleSection title="READOUTS">
        <View style={styles.readoutRow}>
          <View style={styles.readoutCell}>
            <Text style={styles.readoutLabel}>SOURCE</Text>
            <Text style={styles.readoutValue}>{config.sources[sourceIdx].label}</Text>
          </View>
          {config.params.map((p) => (
            <View key={p.paramId} style={styles.readoutCell}>
              <Text style={styles.readoutLabel}>{p.label}</Text>
              <Text style={styles.readoutValue}>{choiceLabel(p, values[p.paramId])}</Text>
            </View>
          ))}
        </View>
        {config.pollGr ? (
          <Pressable
            onLongPress={() => openLesson('gain_reduction')}
            delayLongPress={350}
            accessibilityRole="button"
            accessibilityLabel="Gain reduction meter — what it shows"
          >
            <GrMeter grDb={running ? grDb : 0} label="GAIN REDUCTION — LIVE (measured)" />
          </Pressable>
        ) : null}
      </CollapsibleSection>

      {/* DISPLAY — the animated signal-flow hero (Skia, gated) above the
          static analytic hero, which ALWAYS renders (pre-Skia fallback AND
          the response-curve source of truth). Not drag-interactive — no
          InteractionZone needed. */}
      <CollapsibleSection title="DISPLAY" onHelp={() => openLesson('display')}>
        {fxAnim && config.anim ? (
          <>
            <Text style={styles.badge}>{ANIM_BADGE}</Text>
            <fxAnim.FxAnimHero model={config.anim(values)} active={focused} grDb={running ? grDb : 0} />
          </>
        ) : null}
        <Text style={styles.badge}>{config.heroBadge}</Text>
        {config.Hero(values)}
        {config.heroCaption ? <Text style={styles.caption}>{config.heroCaption(values)}</Text> : null}
        <DisplayGuideButton onPress={() => openLesson('display')} />
      </CollapsibleSection>

      {/* CONTROLS — the param chip rows. */}
      <CollapsibleSection title="CONTROLS">
        <Text style={styles.caption}>Long-press any labeled control, source, or meter for what it does.</Text>
        {config.params.map((p) => (
          <View key={p.paramId} style={styles.paramBlock}>
            <Text style={styles.sectionHead}>{p.label}</Text>
            <View style={styles.chipRow}>
              {p.choices.map((c) => (
                <LabChip
                  key={c.label}
                  label={c.label}
                  selected={values[p.paramId] === c.value}
                  onPress={() => setParam(p.paramId, c.value)}
                  onLongPress={() => openLesson(p.lessonKey)}
                />
              ))}
            </View>
          </View>
        ))}
      </CollapsibleSection>

      {/* ACTIONS — source pickers + audio status (the PLAY control itself is
          the compact ▶ top-right in the header). */}
      <CollapsibleSection title="ACTIONS">
        <Text style={styles.sectionHead}>SOURCE</Text>
        <View style={styles.chipRow}>
          {config.sources.map((s, i) => (
            <LabChip
              key={s.label}
              label={s.label}
              selected={sourceIdx === i}
              onPress={() => pickSource(i)}
              onLongPress={() => openSourceHelp(s.gen)}
            />
          ))}
        </View>
        {engineReady ? (
          fxReady ? (
            <>
              <Text style={styles.caption}>
                {`▶ (top right) plays real audio: ${config.sources[sourceIdx].label.toLowerCase()} → ${config.title.replace(' LAB', '').toLowerCase()} → output. ${GEN_LEVEL_DB} dBFS · uncalibrated. Change any control while it plays.`}
              </Text>
              {genError ? <Text style={styles.error}>{genError}</Text> : null}
            </>
          ) : (
            <Text style={styles.caption}>
              Effect AUDIO needs the v6 engine build — this dev client predates the effects path. The
              visuals and lessons above are fully live; install the next dev build to hear it.
            </Text>
          )
        ) : null}
        {config.note ? <Text style={styles.caption}>{config.note}</Text> : null}
      </CollapsibleSection>

      <GuidedLessonSheet
        visible={help != null}
        lesson={help?.lesson ?? labLesson}
        controlKey={help?.key}
        onClose={() => setHelp(null)}
      />
    </LabShell>
  );
}

const styles = StyleSheet.create({
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  paramBlock: { gap: 8 },
  sectionHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1.5, color: colors.amber },
  caption: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
  error: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: '#ff6b5e' },
  badge: { fontFamily: fonts.oswaldSemiBold, fontSize: 9.5, letterSpacing: 1.2, color: colors.textSub },
  readoutRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  readoutCell: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    paddingVertical: 6,
    paddingHorizontal: 10,
    minWidth: 86,
    gap: 1,
  },
  readoutLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 8.5, letterSpacing: 1, color: colors.textSub },
  readoutValue: { fontFamily: fonts.mono, fontSize: 12.5, color: colors.amber },
});
