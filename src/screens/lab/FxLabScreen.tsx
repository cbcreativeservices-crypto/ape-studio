/**
 * FxLabScreen — the config-driven screen for every EFFECT lab (v4 MASTER
 * Pillar B). One structure across all 12 labs so the student's attention goes
 * to the CONCEPT, not to relearning UI.
 *
 * RACK UNIT (APE_LAB_UX_PROPOSAL 2026-08-23, owner-approved): the lab sits on
 * LabShell's `rack` frame — *reading may scroll; operating may not*:
 *
 *   STAGE — the ANIMATED signal-flow hero (fxAnim, Skia — signal traveling
 *           through the effect) pinned on the glass; pre-Skia clients pin the
 *           static analytic hero instead. Tap the glass = play/stop (owner
 *           2026-07-31, same gate as the header ▶).
 *   BEZEL — the config's key values as legend cells (long-press = lesson),
 *           plus a LIVE measured GR cell on the dynamics labs (REAL engine
 *           readout, never simulated).
 *   DOCK  — ONE fader (the config's continuous teaching parameter, pre-bound
 *           to the lane so cause→effect costs zero taps) + the remaining
 *           params as STICKY option trays (A/B while the glass reacts) + the
 *           shared SOURCE tray. Configs with >4 params fold 2–3 interacting
 *           ones into a single group tray so the dock stays ≤5 keys.
 *   WELL  — teaching prose only: the static analytic hero (which ALWAYS
 *           renders — it is the response-curve source of truth), the dynamic
 *           caption, and the audio-path / honest engine notes.
 *
 * The primary source PLAY/STOP is the compact HeaderPlayButton at the TOP
 * RIGHT of the header (LabShell headerAction); LabShell wraps the well in the
 * single LAB NOTES collapsible and renders the Guided-Lesson entry row.
 *
 * HONESTY (§1.7):
 *  - static visuals: "DESIGNED RESPONSE — ANALYTIC" (same formulas as the DSP);
 *  - the animated hero is a MODEL of the signal flowing through the effect,
 *    computed from the SAME param values driving the audio and the SAME fxViz
 *    math — badged as a teaching visual, motion modeled, never a measurement
 *    (the bezel strip may ellipsize the badge; the full text prints in the
 *    well so the complete statement is always readable);
 *  - the GR bezel cell is measured (fxGrStatus), never simulated;
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
import { GuidedLessonSheet, getLabLesson, SOURCE_LESSON, type LabId, type LessonContent } from '../../features/lab/guidedLessons';
import { EngineGate } from '../tools/EngineGate';
import type { EngineState } from '../../features/tools/engine/useDspEngine';
import { colors, fonts } from '../../theme/tokens';
import { HeaderPlayButton, LabChip, LabShell } from './LabShell';
import { skiaAvailable } from './foundations/skiaGate';
import type { BezelItem, DockParam } from './rack/rackTypes';
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

/** Continuous dock-fader spec for the config's teaching parameter. The range
 *  spans the taught chip values (nothing untested is reachable); `snap`
 *  quantizes the mapped value so readouts/captions stay clean. */
export type FxFaderSpec = {
  min: number;
  max: number;
  /** Log taper (frequencies, time constants). Default linear. */
  log?: boolean;
  snap?: (v: number) => number;
  format: (v: number) => string;
  /** ≤7 mono chars for the dock button / bezel cell. Defaults to `format`. */
  formatShort?: (v: number) => string;
};

export type FxParamSpec = {
  /** Section head above the chip row (trays / group sheets). */
  label: string;
  /** SHORT dock-button label (Oswald 12, one line). Defaults to `label`. */
  short?: string;
  paramId: number;
  /** Guided-lesson control key (content.ts) — omitted = opens the lab lesson. */
  lessonKey?: string;
  /** Per-choice tray blurb (owner 2026-08-28) — author for CONCEPTUAL choices
   *  (filter types, modes); numeric teaching values stay label-only. */
  choices: { label: string; value: number; blurb?: string }[];
  initial: number;
  /** Present = this param docks as THE pre-bound lane fader instead of an
   *  options tray (exactly ONE per config — the teaching parameter). Its
   *  chips retire; the fader range spans them. */
  fader?: FxFaderSpec;
};

export type FxSourceSpec = {
  label: string;
  /** Compact dock-button value (~7 mono chars). Defaults to `label`. */
  short?: string;
  gen: GenParams;
  /** Tray blurb: why you'd audition THIS effect on THIS source. */
  blurb?: string;
};

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
  /** Bezel legend cells (short ALL-CAPS keys, ≤4 — keep 3 where the LIVE GR
   *  cell auto-appends via `pollGr`; the SOURCE reads on its dock key). */
  bezel: { k: string; paramId: number }[];
  /** 2–3 INTERACTING params folded into ONE group tray so the dock stays ≤5
   *  keys. Grouped params drop their individual dock buttons. */
  dockGroups?: {
    id: string;
    label: string;
    paramIds: number[];
    /** Compact combined value for the dock key (~7 mono chars). */
    valueLabel: (values: Record<number, number>) => string;
    lessonKey?: string;
  }[];
  /** The hero teaching visual, rendered from the current param values. */
  Hero: (values: Record<number, number>) => ReactNode;
  heroBadge: string;
  heroCaption?: (values: Record<number, number>) => string;
  /** The ANIMATED signal-flow hero: maps the CURRENT param values to a fxAnim
   *  model. Optional — labs without an authored animation (or clients without
   *  Skia) pin the static Hero on the stage, exactly as before. */
  anim?: (values: Record<number, number>) => FxAnimModel;
  /** Poll the live GR readout while running (which field to show). */
  pollGr?: 'comp' | 'gate' | 'limiter';
  /** Optional honest note under the audio section. */
  note?: string;
};

/** The currently selected choice's chip label (bezel/valueLabel source). */
function choiceLabel(p: FxParamSpec, v: number): string {
  return p.choices.find((c) => c.value === v)?.label ?? String(v);
}

/** Compact value for a dock key / bezel cell: a short chip label stands as-is;
 *  a long one keeps its leading value token ('PEAK (BELL)' → 'PEAK'). */
function shortChoice(label: string): string {
  return label.length <= 8 ? label : label.split(' ')[0];
}

/** Fader 0..1 lane position ↔︎ param value (lin or log taper). */
function faderPos(s: FxFaderSpec, v: number): number {
  const p = s.log ? Math.log(v / s.min) / Math.log(s.max / s.min) : (v - s.min) / (s.max - s.min);
  return Math.max(0, Math.min(1, p));
}
function faderVal(s: FxFaderSpec, pos: number): number {
  const p = Math.max(0, Math.min(1, pos));
  const v = s.log ? s.min * Math.pow(s.max / s.min, p) : s.min + (s.max - s.min) * p;
  return s.snap ? s.snap(v) : v;
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
  // The rack's single help router: 'src' routes to the CURRENT source's entry
  // in the shared SOURCE lesson; everything else is a lab-lesson control key.
  const openHelp = useCallback(
    (key?: string) => {
      if (key === 'src') openSourceHelp(config.sources[sourceIdx].gen);
      else openLesson(key);
    },
    [config.sources, sourceIdx, openSourceHelp, openLesson],
  );

  // The gated animated-hero module (null on pre-Skia clients).
  const fxAnim = useMemo(() => (config.anim ? requireFxAnim() : null), [config.anim]);
  const animOnStage = fxAnim != null && config.anim != null;

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

  // Live GR polling — the REAL measured gain reduction (honest bezel cell).
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

  // ── RACK declaration (regenerated per render — the dock is React state) ───
  const paramById = (id: number) => config.params.find((p) => p.paramId === id)!;
  /** A param's compact current value (fader format or shortened chip label). */
  const compactValue = (p: FxParamSpec) =>
    p.fader ? (p.fader.formatShort ?? p.fader.format)(values[p.paramId]) : shortChoice(choiceLabel(p, values[p.paramId]));

  const bezel: BezelItem[] = [
    ...config.bezel.map((b) => {
      const p = paramById(b.paramId);
      return { k: b.k, v: compactValue(p), helpKey: p.lessonKey };
    }),
    // LIVE measured GR (dynamics labs) — fxGrStatus, never simulated.
    ...(config.pollGr
      ? [{ k: 'GR', v: running ? `${grDb.toFixed(1)} dB` : '— dB', helpKey: 'gain_reduction' }]
      : []),
  ];

  const emittedGroups = new Set<string>();
  const dockParams: DockParam[] = [];
  for (const p of config.params) {
    const g = (config.dockGroups ?? []).find((x) => x.paramIds.includes(p.paramId));
    if (g) {
      // The group key sits where its FIRST member sat (authored order holds).
      if (emittedGroups.has(g.id)) continue;
      emittedGroups.add(g.id);
      dockParams.push({
        kind: 'group',
        id: g.id,
        label: g.label,
        valueLabel: g.valueLabel(values),
        helpKey: g.lessonKey,
        render: () => (
          <View style={{ gap: 10 }}>
            {g.paramIds.map((pid) => {
              const gp = paramById(pid);
              return (
                <View key={pid} style={{ gap: 8 }}>
                  <Text style={styles.sectionHead}>{gp.label}</Text>
                  <View style={styles.chipRow}>
                    {gp.choices.map((c) => (
                      <LabChip
                        key={c.label}
                        label={c.label}
                        selected={values[pid] === c.value}
                        onPress={() => setParam(pid, c.value)}
                        onLongPress={() => openLesson(gp.lessonKey)}
                      />
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        ),
      });
    } else if (p.fader) {
      const s = p.fader;
      dockParams.push({
        kind: 'fader',
        id: String(p.paramId),
        label: p.short ?? p.label,
        value: faderPos(s, values[p.paramId]),
        onChange: (pos) => setParam(p.paramId, faderVal(s, pos)),
        format: () => s.format(values[p.paramId]),
        formatShort: s.formatShort ? () => s.formatShort!(values[p.paramId]) : undefined,
        helpKey: p.lessonKey,
      });
    } else {
      dockParams.push({
        kind: 'options',
        id: String(p.paramId),
        label: p.short ?? p.label,
        valueLabel: shortChoice(choiceLabel(p, values[p.paramId])),
        options: p.choices.map((c) => ({
          id: String(c.value),
          label: c.label,
          blurb: c.blurb,
          onLongPress: () => openLesson(p.lessonKey),
        })),
        selectedId: String(values[p.paramId]),
        onSelect: (id) => setParam(p.paramId, Number(id)),
        sticky: true, // A/B teaching values while the glass + audio react
        helpKey: p.lessonKey,
      });
    }
  }
  // SOURCE tray last — swapping the test signal while listening IS a lesson.
  dockParams.push({
    kind: 'options',
    id: 'src',
    label: 'SOURCE',
    valueLabel: config.sources[sourceIdx].short ?? config.sources[sourceIdx].label,
    options: config.sources.map((s, i) => ({
      id: String(i),
      label: s.label,
      blurb: s.blurb,
      onLongPress: () => openSourceHelp(s.gen),
    })),
    selectedId: String(sourceIdx),
    onSelect: (id) => pickSource(Number(id)),
    sticky: true,
    helpKey: 'src',
  });

  const faderParam = config.params.find((p) => p.fader);
  const AnimHero = animOnStage ? fxAnim!.FxAnimHero : null;

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
      rack={{
        initialParam: faderParam ? String(faderParam.paramId) : '',
        onHelp: openHelp,
        stage: {
          // The animated flow is compact (118dp); the static heroes want the
          // taller glass. Sized once at mount — skiaAvailable is static.
          size: animOnStage ? 'S' : 'M',
          // Honesty badge verbatim (§1.7). The strip may ellipsize the long
          // animated-model badge — its full text prints in the well below.
          badge: animOnStage ? ANIM_BADGE : config.heroBadge,
          onGuide: () => openLesson('display'),
          bezel,
          render: (w, h) => (
            // Tapping the display toggles play/stop (owner 2026-07-31).
            <Pressable
              style={{ width: w, height: h, justifyContent: 'center' }}
              onPress={fxReady ? () => (running ? stop() : void start()) : undefined}
              accessibilityRole="button"
              accessibilityLabel={running ? 'Tap to stop the effect audio' : 'Tap to play the source through the effect'}
            >
              {AnimHero ? (
                <AnimHero model={config.anim!(values)} active={focused} grDb={running ? grDb : 0} />
              ) : (
                <View style={{ paddingHorizontal: 6 }}>{config.Hero(values)}</View>
              )}
            </Pressable>
          ),
        },
        params: dockParams,
      }}
    >
      {!engineReady ? <EngineGate state={gate} /> : null}

      {/* DESIGNED RESPONSE — the static analytic hero ALWAYS renders (§1.7:
          it is the response-curve source of truth). With Skia the animated
          model holds the stage and the curve reads here; pre-Skia clients
          already have it pinned above, so only the caption repeats. */}
      {animOnStage ? (
        <View style={{ gap: 6 }}>
          <Text style={styles.badge}>{ANIM_BADGE}</Text>
          <Text style={styles.sectionHead}>DESIGNED RESPONSE</Text>
          <Text style={styles.badge}>{config.heroBadge}</Text>
          {config.Hero(values)}
          {config.heroCaption ? <Text style={styles.caption}>{config.heroCaption(values)}</Text> : null}
        </View>
      ) : config.heroCaption ? (
        <View style={{ gap: 6 }}>
          <Text style={styles.sectionHead}>WHAT YOU’RE SEEING</Text>
          <Text style={styles.caption}>{config.heroCaption(values)}</Text>
        </View>
      ) : null}

      {/* THE AUDIO PATH — status + honest engine notes. */}
      <View style={{ gap: 6 }}>
        <Text style={styles.sectionHead}>THE AUDIO PATH</Text>
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
      </View>

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
  sectionHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1.5, color: colors.amber },
  caption: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
  error: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: '#ff6b5e' },
  badge: { fontFamily: fonts.oswaldSemiBold, fontSize: 9.5, letterSpacing: 1.2, color: colors.textSub },
});
