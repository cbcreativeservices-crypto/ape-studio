/**
 * FxLabScreen — the config-driven screen for every EFFECT lab (v4 MASTER
 * Pillar B). One structure across all 12 labs so the student's attention goes
 * to the CONCEPT, not to relearning UI:
 *
 *   ⓘ guided lesson → SOURCE chips → PARAM chip rows (long-press = that
 *   control's lesson) → the HERO teaching visual (analytic, computed from the
 *   same params driving the DSP) → PLAY (real audio: generator → effect chain)
 *   → live GR meter where the effect reduces gain (REAL engine readout).
 *
 * HONESTY (§1.7):
 *  - visuals: "DESIGNED RESPONSE — ANALYTIC" (same formulas as the native DSP);
 *  - the GR meter is measured (fxGrStatus), never simulated;
 *  - effect AUDIO needs the v6 engine build — below v6 the visuals + lessons
 *    are fully live and the audio button is replaced by an honest note.
 *
 * Audio lifecycle = the established generator idiom (gate → genSet/genStart →
 * generation counter → 2 Hz keepalive → stop on blur/unmount), plus: fx params
 * are pushed BEFORE the node is enabled (targets-first, mirrors genSet), and
 * stop disables the whole chain (fxReset) so no lab leaks effects into another.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ApeDsp, GEN_MODES, type GenParams } from '../../../modules/ape-dsp';
import { GlassButton } from '../../components/GlassButton';
import { useAudioOutputGate } from '../../features/audio/AudioOutputGate';
import { noteAudioActivity } from '../../features/audio/audioOutputStore';
import { GuidedLessonSheet, getLabLesson, type LabId } from '../../features/lab/guidedLessons';
import { GrMeter } from '../../features/lab/fxViz';
import { EngineGate } from '../tools/EngineGate';
import type { EngineState } from '../../features/tools/engine/useDspEngine';
import { colors, fonts } from '../../theme/tokens';
import { LabShell, LabChip } from './LabShell';

const GEN_LEVEL_DB = -20;
const ACTIVITY_MS = 500;
const GR_POLL_MS = 100;

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
  /** Poll the live GR readout while running (which field to show). */
  pollGr?: 'comp' | 'gate' | 'limiter';
  /** Optional honest note under the audio section. */
  note?: string;
};

export function FxLabScreen({ config }: { config: FxLabConfig }) {
  const { requestAudioOutput } = useAudioOutputGate();

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

  const [lessonKey, setLessonKey] = useState<string | undefined>(undefined);
  const [lessonOpen, setLessonOpen] = useState(false);
  const openLesson = useCallback((key?: string) => {
    setLessonKey(key);
    setLessonOpen(true);
  }, []);

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
    >
      {!engineReady ? <EngineGate state={gate} /> : null}

      <View style={styles.chipRow}>
        <LabChip label="ⓘ GUIDED LESSON" selected={lessonOpen} onPress={() => openLesson()} />
      </View>
      <Text style={styles.caption}>Long-press a labeled control for its guided lesson.</Text>

      <Text style={styles.sectionHead}>SOURCE</Text>
      <View style={styles.chipRow}>
        {config.sources.map((s, i) => (
          <LabChip key={s.label} label={s.label} selected={sourceIdx === i} onPress={() => pickSource(i)} />
        ))}
      </View>

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

      {/* HERO — the teaching visual, driven by the SAME params as the audio. */}
      <View style={styles.panelCard}>
        <Text style={styles.badge}>{config.heroBadge}</Text>
        {config.Hero(values)}
        {config.heroCaption ? <Text style={styles.caption}>{config.heroCaption(values)}</Text> : null}
        {config.pollGr ? <GrMeter grDb={running ? grDb : 0} label="GAIN REDUCTION — LIVE (measured)" /> : null}
      </View>

      {engineReady ? (
        fxReady ? (
          <>
            <GlassButton
              label={running ? 'STOP' : 'PLAY THROUGH EFFECT'}
              tint="green"
              height={52}
              fontSize={15}
              onPress={() => (running ? stop() : void start())}
            />
            <Text style={styles.caption}>
              {`Real audio: ${config.sources[sourceIdx].label.toLowerCase()} → ${config.title.replace(' LAB', '').toLowerCase()} → output. ${GEN_LEVEL_DB} dBFS · uncalibrated. Change any control while it plays.`}
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

      <GuidedLessonSheet
        visible={lessonOpen}
        lesson={getLabLesson(config.labId)}
        controlKey={lessonKey}
        onClose={() => setLessonOpen(false)}
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
  panelCard: {
    gap: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    padding: 12,
  },
  badge: { fontFamily: fonts.oswaldSemiBold, fontSize: 9.5, letterSpacing: 1.2, color: colors.textSub },
});
