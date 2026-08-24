/**
 * FoundationsCourseScreen — "Foundations of Sound · Understanding What You're
 * Hearing" (owner 2026-07-26). The FIRST module inside the Ear Training &
 * Audio Lab: a stepped teaching progression (NOT the Learn/Explore lab shell)
 * that builds the mental model every other lesson stands on.
 *
 * RACK UNIT (APE_LAB_UX_PROPOSAL 2026-08-23, owner-approved): each module now
 * renders the RackUnit frame — the layout law *reading may scroll; operating
 * may not*. The module's viz PINS on the stage (height-parametric; fixed-
 * height composites scale-to-fit); its live numbers read on the bezel; its
 * sliders ride the dock lane, its chips live in sticky trays, and PLAY is a
 * dock key with an LED. Prose, captions, CheckQuestion and BACK/NEXT scroll in
 * the well. The stage badge pins each display's honesty CLASS; the full
 * verbatim disclosure (ConceptBadge / AnalyticBadge) leads the well.
 *
 * SHAPE (owner decisions): hybrid course — linear steps with progress dots,
 * NEXT/BACK, tap-to-jump (freely open: nothing gated, nothing graded, no
 * backend) + a persistent door to the free Playground. The answer→reveal
 * CheckQuestion primitive is designed into the shell from day one. Step
 * position persists device-locally (ape:fosStep) so students resume where
 * they left off.
 *
 * SCOPE (owner 2026-07-29): the FULL course — Modules 1–13 each with a
 * bespoke interactive visual + check, and Module 14 = the graduation step
 * whose interactive IS the existing Playground screen.
 *
 * VISUALS: Skia (native — clients built before the Skia dependency render the
 * honest VizUnavailableCard ON THE STAGE; text + audio still work, §1.7).
 * Animated panels are the slowed CONCEPTUAL model; static panels are ANALYTIC
 * drawings of the exact math — every panel badges which it is.
 *
 * AUDIO: one shared voice owned by the shell (house idiom: audio-output gate →
 * genSet/genStart → keepalive → stop on step change/blur/unmount). Sine
 * everywhere; Modules 11–12 use the REAL v3+ additive engine (12-harmonic
 * synthesis) and Module 10 the REAL v5+ stereo dual-oscillator — engine builds
 * below those versions get the honest "needs the newer dev build" note, never
 * a fabricated stand-in. Speaker-guarded per frequency (native route-aware
 * HPF on v4+). Engine-absent clients read and watch everything — only the
 * PLAY keys gate out.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useIsFocused, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ApeDsp, GEN_MODES } from '../../../../modules/ape-dsp';
import { GlassButton } from '../../../components/GlassButton';
import { useAudioOutputGate } from '../../../features/audio/AudioOutputGate';
import { useEntitlement } from '../../../features/commercial/EntitlementProvider';
import { noteAudioActivity } from '../../../features/audio/audioOutputStore';
import { guardAdditiveForEngine, guardToneLevelForEngine } from '../../../features/audio/speakerSafety';
import { EngineGate } from '../../tools/EngineGate';
import type { EngineState } from '../../../features/tools/engine/useDspEngine';
import { levelColor } from '../../../features/tools/levelColor';
import { colors, fonts } from '../../../theme/tokens';
import { AccuracyNote } from '../../../components/AccuracyNote';
import type { RootStackParamList } from '../../../navigation/types';
import { GuidedLessonSheet, getLabLesson } from '../../../features/lab/guidedLessons';
import { markLabUnit, registerLabUnits } from '../../../features/lab/labCompletion';
import { RackUnit } from '../rack/RackUnit';
import type { BezelItem, DockParam } from '../rack/rackTypes';
import { CheckQuestion, ConceptBadge, LevelMeterBar, VizUnavailableCard, type CheckSpec } from './bits';
import { requireViz, type VizModule } from './skiaGate';

const STEP_KEY = 'ape:fosStep';
const ACTIVITY_MS = 500;

/** Slowed visual rate for a given audio frequency — the conceptual model's
 *  speed. Proportional (higher pitch animates faster) but ALWAYS slowed. */
export function visHzFor(freqHz: number): number {
  const lo = 110;
  const hi = 1760;
  const f = Math.max(lo, Math.min(hi, freqHz));
  return 0.45 + 1.15 * (Math.log(f / lo) / Math.log(hi / lo));
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared tone controller (the shell owns ONE sine voice)

type ToneApi = {
  engineReady: boolean;
  /** engineVersion ≥ 3 — the 12-harmonic additive voice exists. */
  additiveReady: boolean;
  /** engineVersion ≥ 5 — the hard-panned stereo dual-oscillator exists. */
  stereoReady: boolean;
  playing: boolean;
  freq: number;
  levelDb: number;
  play: (freqHz: number, levelDb: number) => void;
  set: (p: { freqHz?: number; levelDb?: number }) => void;
  /** REAL additive synthesis (M11–12): amps are 12 relative 0..1 harmonic
   *  weights of f0; phases all 0. No-op below engine v3 (callers gate). */
  playAdditive: (f0: number, amps12: number[], levelDb: number) => void;
  /** Retune/reshape the additive voice while sounding (phase-continuous). */
  setAdditiveLive: (f0: number, amps12: number[]) => void;
  /** REAL stereo dual sine (M10): L = sine(fL), R = sine(fR), hard-panned.
   *  No-op below engine v5 (callers gate). */
  playStereo: (fL: number, fR: number, levelDb: number) => void;
  stop: () => void;
};

/** Flat 25-number additive payload [f0, a1..a12, p1..p12] (phases 0). */
function additivePayloadOf(f0: number, amps: number[]): number[] {
  const a: number[] = [];
  for (let i = 0; i < 12; i++) a.push(Math.max(0, Math.min(1, amps[i] ?? 0)));
  return [f0, ...a, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
}

function useCourseTone(engineReady: boolean): ToneApi {
  const { requestAudioOutput } = useAudioOutputGate();
  const [playing, setPlaying] = useState(false);
  const [freq, setFreq] = useState(220);
  const [levelDb, setLevelDb] = useState(-24);
  const genRef = useRef(0);
  const freqRef = useRef(freq);
  const levelRef = useRef(levelDb);

  const play = useCallback(
    (f: number, db: number) => {
      if (!engineReady) return;
      setFreq(f);
      setLevelDb(db);
      freqRef.current = f;
      levelRef.current = db;
      const gen = ++genRef.current;
      void (async () => {
        const ok = await requestAudioOutput();
        if (!ok || gen !== genRef.current) return;
        ApeDsp.genSet({
          mode: GEN_MODES.sine,
          frequency: freqRef.current,
          levelDb: guardToneLevelForEngine(levelRef.current, freqRef.current),
        });
        try {
          await ApeDsp.genStart();
          if (gen !== genRef.current) {
            void ApeDsp.genStop();
            return;
          }
          setPlaying(true);
          noteAudioActivity();
        } catch {
          /* engine start failure — buttons stay honest via playing=false */
        }
      })();
    },
    [engineReady, requestAudioOutput],
  );

  const set = useCallback((p: { freqHz?: number; levelDb?: number }) => {
    if (p.freqHz != null) {
      setFreq(p.freqHz);
      freqRef.current = p.freqHz;
    }
    if (p.levelDb != null) {
      setLevelDb(p.levelDb);
      levelRef.current = p.levelDb;
    }
    // Retune in place while sounding (phase-continuous; guard re-applied).
    ApeDsp.genSet({
      frequency: freqRef.current,
      levelDb: guardToneLevelForEngine(levelRef.current, freqRef.current),
    });
    noteAudioActivity();
  }, []);

  // ── Additive voice (M11–12) — REAL v3+ 12-harmonic synthesis. ─────────────
  const playAdditive = useCallback(
    (f0: number, amps12: number[], db: number) => {
      if (!engineReady || ApeDsp.engineVersion() < 3) return;
      setFreq(f0);
      setLevelDb(db);
      freqRef.current = f0;
      levelRef.current = db;
      const gen = ++genRef.current;
      void (async () => {
        const ok = await requestAudioOutput();
        if (!ok || gen !== genRef.current) return;
        // guardAdditiveForEngine: JS per-harmonic HPF below v4; raw on ≥4
        // (the native route-aware HPF owns speaker safety there).
        ApeDsp.genSet({
          mode: GEN_MODES.additive,
          additive: guardAdditiveForEngine(additivePayloadOf(f0, amps12)),
          levelDb: db,
        });
        try {
          await ApeDsp.genStart();
          if (gen !== genRef.current) {
            void ApeDsp.genStop();
            return;
          }
          setPlaying(true);
          noteAudioActivity();
        } catch {
          /* engine start failure — buttons stay honest via playing=false */
        }
      })();
    },
    [engineReady, requestAudioOutput],
  );

  const setAdditiveLive = useCallback((f0: number, amps12: number[]) => {
    // Reshape in place while sounding (the additive core is phase-continuous).
    ApeDsp.genSet({ additive: guardAdditiveForEngine(additivePayloadOf(f0, amps12)) });
    noteAudioActivity();
  }, []);

  // ── Stereo dual sine (M10) — REAL v5+ hard-panned L/R oscillators. ────────
  const stereoRef = useRef(false);
  const playStereo = useCallback(
    (fL: number, fR: number, db: number) => {
      if (!engineReady || ApeDsp.engineVersion() < 5) return;
      setFreq(fL);
      setLevelDb(db);
      freqRef.current = fL;
      levelRef.current = db;
      const gen = ++genRef.current;
      void (async () => {
        const ok = await requestAudioOutput();
        if (!ok || gen !== genRef.current) return;
        // v5 ⇒ the native route-aware HPF (v4+) exists — no JS level guard.
        ApeDsp.genSet({ mode: GEN_MODES.sine, frequency: fL, levelDb: db, stereo: { on: true, fL, fR } });
        stereoRef.current = true;
        try {
          await ApeDsp.genStart();
          if (gen !== genRef.current) {
            void ApeDsp.genStop();
            return;
          }
          setPlaying(true);
          noteAudioActivity();
        } catch {
          /* engine start failure — buttons stay honest via playing=false */
        }
      })();
    },
    [engineReady, requestAudioOutput],
  );

  const stop = useCallback(() => {
    genRef.current++;
    if (stereoRef.current) {
      // Harmonograph idiom: the stereo split is GLOBAL engine state — clear it
      // on stop so mono tools never inherit a hard-panned pair.
      ApeDsp.genSet({ stereo: { on: false, fL: 440, fR: 440 } });
      stereoRef.current = false;
    }
    void ApeDsp.genStop();
    setPlaying(false);
  }, []);

  useFocusEffect(useCallback(() => () => stop(), [stop]));
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(noteAudioActivity, ACTIVITY_MS);
    return () => clearInterval(id);
  }, [playing]);

  const additiveReady = engineReady && ApeDsp.engineVersion() >= 3;
  const stereoReady = engineReady && ApeDsp.engineVersion() >= 5;

  return {
    engineReady,
    additiveReady,
    stereoReady,
    playing,
    freq,
    levelDb,
    play,
    set,
    playAdditive,
    setAdditiveLive,
    playStereo,
    stop,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Rack plumbing shared by every module

type ToolRoute = 'SplMeter' | 'FrequencyCounter' | 'Rta' | 'SpectrogramLive' | 'WaveformLive' | 'Rt60Live' | 'SignalGen';

type RackProps = {
  viz: VizModule | null;
  tone: ToneApi;
  focused: boolean;
  help: (key: string) => void;
  /** Screen-composed reading column ABOVE the module's own captions:
   *  engine gate + tag + title + collapsible paragraphs. */
  wellTop: ReactNode;
  /** Screen-composed reading column BELOW: CheckQuestion + BACK/NEXT. */
  wellBottom: ReactNode;
  onPlayground: () => void;
  onTool: (r: ToolRoute) => void;
};

/** Honest stage fallback for pre-Skia clients (§1.7) — the card pins where
 *  the animated model would be; text and audio below keep working. */
function StageFallback({ w }: { w: number }) {
  return (
    <View style={{ width: w, flex: 1, justifyContent: 'center', padding: 10 }}>
      <VizUnavailableCard />
    </View>
  );
}

/** Scale-to-fit wrapper for the fixed-height COMPOSITE vizzes (ThreeWindow,
 *  DualDomain, HarmonicStacker) whose internal layout can't take a height
 *  prop: render at width/scale, scale down so the natural height fits the
 *  glass exactly — nothing is cropped, the drawing stays whole. */
function FitStage({ w, h, natural, children }: { w: number; h: number; natural: number; children: (vw: number) => ReactNode }) {
  const pad = 8;
  const s = Math.min(1, (h - pad) / natural);
  const vw = Math.max(1, Math.floor((w - pad) / s));
  return (
    <View style={{ width: w, height: h, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <View style={{ width: vw, transform: [{ scale: s }] }}>{children(vw)}</View>
    </View>
  );
}
const THREE_WINDOW_NATURAL = 240; // label+cone row (133) + gap + label + gap + graph (84)
const DUAL_DOMAIN_NATURAL = 206; // two 84-high canvases + two labels + gaps
const HSTACK_NATURAL = 282; // 4 + 6×30 rows + 12 gap + 86 sum

/** Shared TONE bezel cell — the voice state, printed on every audio module. */
function toneCell(tone: ToneApi): BezelItem {
  return { k: 'TONE', v: tone.playing ? 'LIVE' : '—', tint: tone.playing ? undefined : '#7a7f8a' };
}

/** Shared PLAY dock key (kind:'toggle', LED = sounding) — the course's inline
 *  transport idiom moved to the dock. Callers gate on engine readiness. */
function playKey(tone: ToneApi, onPlay: () => void): DockParam {
  return {
    kind: 'toggle',
    id: 'play',
    label: 'PLAY',
    value: tone.playing,
    onToggle: () => (tone.playing ? tone.stop() : onPlay()),
  };
}

/** The static-panel disclosure twin of ConceptBadge (§1.7). */
function AnalyticBadge({ text }: { text?: string }) {
  return <Text style={styles.analyticBadge}>{text ?? 'ANALYTIC — DRAWN FROM THE MATH, NOT A MEASUREMENT'}</Text>;
}

// Compact honesty classes pinned on the stage bezel strip (one line). The FULL
// verbatim disclosure stays with each module, leading the well.
const BADGE_CONCEPT = 'CONCEPTUAL MODEL — SLOWED FOR VISIBILITY';
const BADGE_ANALYTIC = 'ANALYTIC — DRAWN FROM THE MATH, NOT A MEASUREMENT';

// ─────────────────────────────────────────────────────────────────────────────
// Module racks (each renders the RackUnit itself; viz children mount ONLY when
// Skia is available — the stage shows the honest card otherwise)

/** M1 — air particles alone, LOW/HIGH pitch chips. */
function M1Rack({ viz, tone, focused, help, wellTop, wellBottom }: RackProps) {
  const [f, setF] = useState(220);
  const [zones, setZones] = useState(true);
  const pick = (hz: number) => {
    setF(hz);
    if (tone.playing) tone.set({ freqHz: hz });
  };
  const params: DockParam[] = [
    {
      kind: 'options',
      id: 'pitch',
      label: 'PITCH',
      valueLabel: `${f} Hz`,
      options: [
        { id: '110', label: 'LOW · 110 Hz' },
        { id: '220', label: 'MID · 220 Hz' },
        { id: '880', label: 'HIGH · 880 Hz' },
      ],
      selectedId: String(f),
      onSelect: (id) => pick(Number(id)),
      sticky: true, // A/B the pitches while the particles react
      helpKey: 'frequency',
    },
    { kind: 'toggle', id: 'zones', label: 'COLORS', value: zones, onToggle: () => setZones((v) => !v), helpKey: 'pressure_graph' },
    ...(tone.engineReady ? [playKey(tone, () => tone.play(f, -24))] : []),
  ];
  return (
    <RackUnit
      initialParam="pitch"
      params={params}
      onHelp={(k) => (k ? help(k) : undefined)}
      stage={{
        size: 'M',
        badge: BADGE_CONCEPT,
        onGuide: () => help('air'),
        bezel: [
          { k: 'FREQ', v: `${f} Hz`, helpKey: 'frequency' },
          { k: 'MODEL', v: `${visHzFor(f).toFixed(2)} Hz`, helpKey: 'air' },
          toneCell(tone),
        ],
        render: (w, h) => (viz ? <M1Stage viz={viz} w={w} h={h} f={f} zones={zones} focused={focused} /> : <StageFallback w={w} />),
      }}
    >
      {wellTop}
      <ConceptBadge />
      {wellBottom}
    </RackUnit>
  );
}
function M1Stage({ viz, w, h, f, zones, focused }: { viz: VizModule; w: number; h: number; f: number; zones: boolean; focused: boolean }) {
  const clock = viz.useVizClock(focused);
  return (
    <View style={{ width: w, height: h, justifyContent: 'center' }}>
      <viz.AirParticlesView clock={clock} width={w} height={h} visHz={visHzFor(f)} amp={0.75} showEar showZones={zones} />
    </View>
  );
}

/** M2 — the three synchronized windows. */
function M2Rack({ viz, tone, focused, help, wellTop, wellBottom }: RackProps) {
  const [zones, setZones] = useState(true);
  const params: DockParam[] = [
    { kind: 'toggle', id: 'zones', label: 'COLORS', value: zones, onToggle: () => setZones((v) => !v), helpKey: 'pressure_graph' },
    ...(tone.engineReady ? [playKey(tone, () => tone.play(220, -24))] : []),
  ];
  return (
    <RackUnit
      initialParam="zones"
      params={params}
      onHelp={(k) => (k ? help(k) : undefined)}
      stage={{
        size: 'L', // three phase-locked windows — earns the tall glass
        badge: BADGE_CONCEPT,
        onGuide: () => help('speaker_cone'),
        bezel: [{ k: 'FREQ', v: '220 Hz', helpKey: 'frequency' }, toneCell(tone)],
        render: (w, h) =>
          viz ? (
            <FitStage w={w} h={h} natural={THREE_WINDOW_NATURAL}>
              {(vw) => <viz.ThreeWindowView width={vw} visHz={visHzFor(220)} amp={0.75} running={focused} showZones={zones} />}
            </FitStage>
          ) : (
            <StageFallback w={w} />
          ),
      }}
    >
      {wellTop}
      <ConceptBadge extra="ALL THREE WINDOWS SHOW THE SAME MOMENT" />
      {wellBottom}
    </RackUnit>
  );
}

/** M3 — compression/rarefaction slider (particles + pressure, no cone). */
function M3Rack({ viz, tone, focused, help, wellTop, wellBottom }: RackProps) {
  const [amt, setAmt] = useState(0.55);
  const [zones, setZones] = useState(true);
  const levelFor = (a: number) => -44 + a * 22; // −44 … −22 dBFS
  const readout = amt < 0.33 ? 'gentle' : amt < 0.66 ? 'medium' : 'strong';
  const params: DockParam[] = [
    {
      kind: 'fader',
      id: 'amt',
      label: 'STRENGTH',
      value: amt,
      onChange: (v) => {
        setAmt(v);
        if (tone.playing) tone.set({ levelDb: levelFor(v) });
      },
      format: () => readout,
      tint: levelColor(amt),
      helpKey: 'pressure_graph',
    },
    { kind: 'toggle', id: 'zones', label: 'COLORS', value: zones, onToggle: () => setZones((v) => !v), helpKey: 'pressure_graph' },
    ...(tone.engineReady ? [playKey(tone, () => tone.play(165, levelFor(amt)))] : []),
  ];
  return (
    <RackUnit
      initialParam="amt"
      params={params}
      onHelp={(k) => (k ? help(k) : undefined)}
      stage={{
        size: 'L', // two stacked windows: air + pressure
        badge: BADGE_CONCEPT,
        onGuide: () => help('pressure_graph'),
        bezel: [
          { k: 'STRENGTH', v: readout, tint: levelColor(amt), helpKey: 'pressure_graph' },
          { k: 'LEVEL', v: `${levelFor(amt).toFixed(0)} dBFS`, helpKey: 'amplitude' },
          toneCell(tone),
        ],
        render: (w, h) => (viz ? <M3Stage viz={viz} w={w} h={h} amp={amt} zones={zones} focused={focused} /> : <StageFallback w={w} />),
      }}
    >
      {wellTop}
      <ConceptBadge />
      <View style={styles.pressureLegend}>
        <Text style={styles.legendPlus}>+ compression — pressure ABOVE atmospheric</Text>
        <Text style={styles.legendZero}>0 — atmospheric pressure (the resting line)</Text>
        <Text style={styles.legendMinus}>− rarefaction — pressure BELOW atmospheric</Text>
      </View>
      {wellBottom}
    </RackUnit>
  );
}
function M3Stage({ viz, w, h, amp, zones, focused }: { viz: VizModule; w: number; h: number; amp: number; zones: boolean; focused: boolean }) {
  const clock = viz.useVizClock(focused);
  const visHz = visHzFor(165);
  // Height split: two label rows (~12) + container gaps eat ~36; the air
  // window gets the larger share (that's where the molecules live).
  const avail = Math.max(60, h - 36);
  const airH = Math.round(avail * 0.55);
  const graphH = avail - airH;
  return (
    <View style={{ width: w, height: h, justifyContent: 'center', gap: 4 }}>
      <Text style={styles.winLabel}>AIR — squeeze (compression) · stretch (rarefaction)</Text>
      <viz.AirParticlesView clock={clock} width={w} height={airH} visHz={visHz} amp={amp} showZones={zones} />
      <Text style={styles.winLabel}>PRESSURE — above / below atmospheric</Text>
      <viz.PressureGraphView clock={clock} width={w} height={graphH} visHz={visHz} amp={amp} />
    </View>
  );
}

/** M4 — amplitude: one fader drives cone + air + graph + level + loudness. */
function M4Rack({ viz, tone, focused, help, wellTop, wellBottom }: RackProps) {
  const [amt, setAmt] = useState(0.5);
  const [zones, setZones] = useState(true);
  const levelFor = (a: number) => -44 + a * 24; // −44 … −20 dBFS
  const readout = amt < 0.33 ? 'small → quiet' : amt < 0.66 ? 'medium' : 'large → loud';
  const params: DockParam[] = [
    {
      kind: 'fader',
      id: 'amt',
      label: 'AMPLITUDE',
      value: amt,
      onChange: (v) => {
        setAmt(v);
        if (tone.playing) tone.set({ levelDb: levelFor(v) });
      },
      format: () => readout,
      formatShort: () => `${Math.round(amt * 100)}%`,
      tint: levelColor(amt),
      helpKey: 'amplitude',
    },
    { kind: 'toggle', id: 'zones', label: 'COLORS', value: zones, onToggle: () => setZones((v) => !v), helpKey: 'pressure_graph' },
    ...(tone.engineReady ? [playKey(tone, () => tone.play(330, levelFor(amt)))] : []),
  ];
  return (
    <RackUnit
      initialParam="amt"
      params={params}
      onHelp={(k) => (k ? help(k) : undefined)}
      stage={{
        size: 'L',
        badge: BADGE_CONCEPT,
        onGuide: () => help('speaker_cone'),
        bezel: [
          { k: 'AMP', v: readout, tint: levelColor(amt), flex: 1.4, helpKey: 'amplitude' },
          { k: 'LEVEL', v: `${levelFor(amt).toFixed(0)} dBFS`, helpKey: 'amplitude' },
          toneCell(tone),
        ],
        render: (w, h) =>
          viz ? (
            <FitStage w={w} h={h} natural={THREE_WINDOW_NATURAL}>
              {(vw) => (
                <viz.ThreeWindowView width={vw} visHz={visHzFor(330)} amp={0.25 + amt * 0.75} running={focused} showEar={false} showZones={zones} />
              )}
            </FitStage>
          ) : (
            <StageFallback w={w} />
          ),
      }}
    >
      {wellTop}
      <ConceptBadge />
      <Pressable onLongPress={() => help('amplitude')} delayLongPress={260}>
        <LevelMeterBar levelDb={levelFor(amt)} minDb={-48} maxDb={-18} />
      </Pressable>
      {wellBottom}
    </RackUnit>
  );
}

// ─── M5 — Frequency: a fixed reference vs a frequency YOU set with the lane ──

const M5_FIXED_A = 220; // the LEFT reference source (Hz)
const M5_MIN = 140;
const M5_MAX = 600;

function M5Rack({ viz, tone, focused, help, wellTop, wellBottom }: RackProps) {
  // The RIGHT display's frequency is driven by the lane (owner 2026-08-05) —
  // it speeds up / slows down the orbit dot AND the compressions of that side.
  const [freqB, setFreqB] = useState(330);
  const active: 'a' | 'b' | 'none' = tone.playing ? 'b' : 'none';
  const params: DockParam[] = [
    {
      kind: 'fader',
      id: 'freqb',
      label: 'FREQ B',
      value: (freqB - M5_MIN) / (M5_MAX - M5_MIN),
      onChange: (v) => {
        const hz = Math.round(M5_MIN + v * (M5_MAX - M5_MIN));
        setFreqB(hz);
        if (tone.playing) tone.set({ freqHz: hz });
      },
      format: () => `${freqB} Hz`,
      helpKey: 'rate',
    },
    ...(tone.engineReady ? [playKey(tone, () => tone.play(freqB, -24))] : []),
  ];
  return (
    <RackUnit
      initialParam="freqb"
      params={params}
      onHelp={(k) => (k ? help(k) : undefined)}
      stage={{
        size: 'M',
        badge: BADGE_CONCEPT,
        onGuide: () => help('rate'),
        bezel: [
          { k: 'REF', v: `${M5_FIXED_A} Hz`, helpKey: 'rate' },
          { k: 'YOURS', v: `${freqB} Hz`, helpKey: 'rate' },
          toneCell(tone),
        ],
        render: (w, h) => (viz ? <M5Stage viz={viz} w={w} h={h} a={M5_FIXED_A} b={freqB} active={active} focused={focused} /> : <StageFallback w={w} />),
      }}
    >
      {wellTop}
      <ConceptBadge extra={`LEFT = ${M5_FIXED_A} Hz reference · RIGHT = your frequency — count the orbit laps`} />
      <Text style={styles.caption}>
        Ride the FREQ B lane ({M5_MIN}–{M5_MAX} Hz): the RIGHT display's orbit dot and its
        compressions both speed up or slow down with the frequency — same-size vibration, different
        RATE. Press PLAY to listen to the frequency you chose.
      </Text>
      {wellBottom}
    </RackUnit>
  );
}
function M5Stage({ viz, w, h, a, b, active, focused }: { viz: VizModule; w: number; h: number; a: number; b: number; active: 'a' | 'b' | 'none'; focused: boolean }) {
  // Phase clocks — continuous through pair switches (no t·Δω jump).
  const phaseA = viz.usePhaseClock(focused, visHzFor(a));
  const phaseB = viz.usePhaseClock(focused, visHzFor(b));
  return (
    <View style={{ width: w, height: h, justifyContent: 'center' }}>
      <viz.RateComparatorView phaseA={phaseA} phaseB={phaseB} width={w} height={h} active={active} />
    </View>
  );
}

// ─── M6 — Wavelength: the wave laid across a real 7 m room ──────────────────

function M6Rack({ viz, tone: _tone, focused, help, wellTop, wellBottom }: RackProps) {
  const [oct, setOct] = useState(1); // 55 · 2^oct, 0..4 → 55..880 Hz
  const f = Math.round(55 * Math.pow(2, oct));
  const lambda = 343 / f;
  // No sound on this screen (owner 2026-08-05) — the lane only reshapes the
  // drawn wavelength across the room.
  const params: DockParam[] = [
    {
      kind: 'fader',
      id: 'oct',
      label: 'FREQ',
      value: oct / 4,
      onChange: (v) => setOct(v * 4),
      format: () => `${f} Hz · λ = ${lambda.toFixed(2)} m`,
      formatShort: () => `${f} Hz`,
      helpKey: 'wavelength_room',
    },
  ];
  return (
    <RackUnit
      initialParam="oct"
      params={params}
      onHelp={(k) => (k ? help(k) : undefined)}
      stage={{
        size: 'L', // the room ruler IS the lesson
        badge: 'CONCEPTUAL MODEL — HORIZONTAL SCALE IS REAL (7 m ROOM)',
        onGuide: () => help('wavelength_room'),
        bezel: [
          { k: 'FREQ', v: `${f} Hz`, helpKey: 'wavelength_room' },
          { k: 'λ', v: `${lambda.toFixed(2)} m`, helpKey: 'wavelength_room' },
          { k: 'FITS', v: `${(7 / lambda).toFixed(1)}×`, helpKey: 'wavelength_room' },
        ],
        render: (w, h) => (viz ? <M6Stage viz={viz} w={w} h={h} f={f} focused={focused} /> : <StageFallback w={w} />),
      }}
    >
      {wellTop}
      <ConceptBadge extra="HORIZONTAL SCALE IS REAL — the room is 7 m wide, ticks every 1 m" />
      <Text style={styles.caption}>
        λ = speed ÷ frequency = 343 ÷ {f} ≈ {lambda.toFixed(2)} m — {(7 / lambda).toFixed(1)}{' '}
        wavelength{7 / lambda >= 1.95 ? 's' : ''} fit across the room. The amber bracket IS that
        length, drawn to scale. Follow any GLINTING molecule — it only wobbles in place as the
        pattern flows past. The wave crosses the room; the air does not.
      </Text>
      {wellBottom}
    </RackUnit>
  );
}
function M6Stage({ viz, w, h, f, focused }: { viz: VizModule; w: number; h: number; f: number; focused: boolean }) {
  // Phase clock — continuous while the lane drags the frequency; the seconds
  // clock paces the sparkle-tracked molecules' hand-offs (owner 2026-08-10).
  const phase = viz.usePhaseClock(focused, visHzFor(f));
  const clock = viz.useVizClock(focused);
  return (
    <View style={{ width: w, height: h, justifyContent: 'center' }}>
      <viz.WavelengthRulerView phase={phase} clock={clock} width={w} height={h} freqHz={f} />
    </View>
  );
}

// ─── M7 — Time vs space: the same wave on two rulers ────────────────────────

function M7Rack({ viz, tone, focused, help, wellTop, wellBottom }: RackProps) {
  const [cursor, setCursor] = useState(0.25);
  const [frozen, setFrozen] = useState(false);
  const [f, setF] = useState(220);
  const params: DockParam[] = [
    {
      kind: 'fader',
      id: 'cursor',
      label: 'TRACE',
      value: cursor,
      onChange: setCursor,
      format: () => 'same phase → same height',
      formatShort: () => `${Math.round(cursor * 100)}%`,
      tint: '#37e05f',
      helpKey: 'domain_link',
    },
    { kind: 'toggle', id: 'freeze', label: 'FREEZE', value: frozen, onToggle: () => setFrozen((v) => !v), helpKey: 'domain_link' },
    {
      kind: 'options',
      id: 'freq',
      label: 'FREQ',
      valueLabel: `${f} Hz`,
      options: [
        { id: '110', label: '110 Hz' },
        { id: '220', label: '220 Hz' },
      ],
      selectedId: String(f),
      onSelect: (id) => {
        const hz = Number(id);
        setF(hz);
        if (tone.playing) tone.set({ freqHz: hz });
      },
      sticky: true,
      helpKey: 'domain_link',
    },
    ...(tone.engineReady ? [playKey(tone, () => tone.play(f, -24))] : []),
  ];
  return (
    <RackUnit
      initialParam="cursor"
      params={params}
      onHelp={(k) => (k ? help(k) : undefined)}
      stage={{
        size: 'L',
        badge: BADGE_CONCEPT,
        onGuide: () => help('domain_link'),
        bezel: [
          { k: 'FREQ', v: `${f} Hz`, helpKey: 'domain_link' },
          { k: 'MODE', v: frozen ? 'FROZEN' : 'RUN', tint: frozen ? '#7fd4ff' : undefined, helpKey: 'domain_link' },
          toneCell(tone),
        ],
        render: (w, h) =>
          viz ? (
            <FitStage w={w} h={h} natural={DUAL_DOMAIN_NATURAL}>
              {(vw) => <viz.DualDomainView width={vw} visHz={visHzFor(f)} cursor={cursor} running={focused && !frozen} />}
            </FitStage>
          ) : (
            <StageFallback w={w} />
          ),
      }}
    >
      {wellTop}
      <ConceptBadge extra="SAME WAVE — TWO RULERS" />
      <Text style={styles.caption}>
        The two green dots never disagree: a moment BACK IN TIME on the top ruler is the same as a
        distance BACK ALONG THE ROOM on the bottom one. distance = speed × time — that single
        equation links the two graphs forever.
      </Text>
      {wellBottom}
    </RackUnit>
  );
}

// ─── M8 — Pitch vs frequency: the octave spiral ─────────────────────────────

function M8Rack({ viz, tone, focused, help, wellTop, wellBottom }: RackProps) {
  const [f, setF] = useState(220);
  const setFreq = (nf: number) => {
    setF(nf);
    if (tone.playing) tone.set({ freqHz: Math.round(nf) });
  };
  const octAbove = Math.log2(f / 110);
  const params: DockParam[] = [
    {
      kind: 'fader',
      id: 'pitch',
      label: 'PITCH',
      // Same log mapping the spiral drag glides: 0..1 = 110 Hz → 3 octaves up.
      value: octAbove / 3,
      onChange: (v) => setFreq(110 * Math.pow(2, Math.max(0, Math.min(3, v * 3)))),
      format: () => `${Math.round(f)} Hz · ${octAbove.toFixed(2)} 8ve`,
      formatShort: () => `${Math.round(f)} Hz`,
      helpKey: 'octave_spiral',
    },
    {
      kind: 'options',
      id: 'jump',
      label: 'OCTAVES',
      valueLabel: `${Math.round(f)} Hz`,
      options: [110, 220, 440, 880].map((hz, i) => ({ id: String(hz), label: i === 0 ? `${hz} Hz` : `${hz} Hz · +${i} 8ve` })),
      selectedId: [110, 220, 440, 880].includes(Math.round(f)) ? String(Math.round(f)) : null,
      onSelect: (id) => setFreq(Number(id)),
      sticky: true, // A/B the doublings — the whole lesson
      helpKey: 'octave_spiral',
    },
    ...(tone.engineReady ? [playKey(tone, () => tone.play(Math.round(f), -24))] : []),
  ];
  return (
    <RackUnit
      initialParam="pitch"
      params={params}
      onHelp={(k) => (k ? help(k) : undefined)}
      stage={{
        size: 'L', // the spiral wants the round glass
        badge: 'ANALYTIC — LOG SPIRAL DRAWN EXACTLY · ORBIT SLOWED',
        onGuide: () => help('octave_spiral'),
        bezel: [
          { k: 'FREQ', v: `${Math.round(f)} Hz`, helpKey: 'octave_spiral' },
          { k: 'ABOVE 110', v: `+${octAbove.toFixed(2)} 8ve`, flex: 1.3, helpKey: 'octave_spiral' },
          toneCell(tone),
        ],
        render: (w, h) => (viz ? <M8Stage viz={viz} w={w} h={h} f={f} focused={focused} onFreq={setFreq} /> : <StageFallback w={w} />),
      }}
    >
      {wellTop}
      <AnalyticBadge text="ANALYTIC — THE SPIRAL IS HOW HEARING MAPS FREQUENCY (log), DRAWN EXACTLY · THE ORBIT LAPS ONCE PER CYCLE (SLOWED)" />
      <Text style={styles.spiralHint}>
        Drag AROUND the spiral to glide the pitch — one full turn is one octave. The dots on the
        upward ray mark 110 · 220 · 440 · 880 Hz: every crossing is a DOUBLING, yet each turn feels
        like the same size musical step.
      </Text>
      <Text style={styles.caption}>OCTAVES — each key in the OCTAVES tray jumps up ONE octave (a doubling, ×2).</Text>
      {wellBottom}
    </RackUnit>
  );
}
function M8Stage({ viz, w, h, f, focused, onFreq }: { viz: VizModule; w: number; h: number; f: number; focused: boolean; onFreq: (nf: number) => void }) {
  const fRef = useRef(f);
  fRef.current = f;
  const onFreqRef = useRef(onFreq);
  onFreqRef.current = onFreq;
  const wRef = useRef(w);
  wRef.current = w;
  const hRef = useRef(h);
  hRef.current = h;
  const lastAngRef = useRef<number | null>(null);
  // Rotary drag on the PINNED stage (owner 2026-07-30 lesson, resolved by the
  // rack law): the glass never scrolls, so no scroll-lock plumbing is needed —
  // a near-vertical swing always spins the spiral.
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderGrant: (e) => {
        const dx = e.nativeEvent.locationX - wRef.current / 2;
        const dy = e.nativeEvent.locationY - hRef.current / 2;
        // Hub dead-zone: near the center, angles are meaningless — a touch
        // crossing it would read as up to a half-turn (a half-octave lurch).
        lastAngRef.current = Math.hypot(dx, dy) < 25 ? null : Math.atan2(dy, dx);
      },
      onPanResponderMove: (e) => {
        const dx = e.nativeEvent.locationX - wRef.current / 2;
        const dy = e.nativeEvent.locationY - hRef.current / 2;
        if (Math.hypot(dx, dy) < 25) {
          lastAngRef.current = null; // re-grab cleanly once clear of the hub
          return;
        }
        const ang = Math.atan2(dy, dx);
        const last = lastAngRef.current;
        lastAngRef.current = ang;
        if (last == null) return;
        let d = ang - last;
        if (d > Math.PI) d -= 2 * Math.PI;
        if (d < -Math.PI) d += 2 * Math.PI;
        // Clockwise = up the spiral: one full turn = one octave (a doubling).
        const o = Math.max(0, Math.min(3, Math.log2(fRef.current / 110) + d / (2 * Math.PI)));
        onFreqRef.current(110 * Math.pow(2, o));
      },
      onPanResponderRelease: () => {
        lastAngRef.current = null;
      },
      onPanResponderTerminate: () => {
        lastAngRef.current = null;
      },
      onPanResponderTerminationRequest: () => false,
    }),
  ).current;
  // Phase clock — the drag glides the rate; phase stays continuous (no
  // phantom satellite revolutions from t·Δω).
  const phase = viz.usePhaseClock(focused, visHzFor(f));
  return (
    <View {...pan.panHandlers} style={{ width: w, height: h }}>
      <viz.OctaveSpiralView phase={phase} width={w} height={h} freqHz={f} />
    </View>
  );
}

// ─── M9 — Loudness vs amplitude: the ear-sensitivity curve ──────────────────

function M9Rack({ viz, tone, focused, help, wellTop, wellBottom }: RackProps) {
  const [pos, setPos] = useState(Math.log(1000 / 80) / Math.log(8000 / 80)); // start at 1 kHz
  const [lvl, setLvl] = useState(0.65); // −44..−20 dBFS
  const f = Math.round(80 * Math.pow(8000 / 80, pos));
  const levelDb = -44 + lvl * 24;
  const sens = viz ? viz.earSensDb(f) : null;
  const params: DockParam[] = [
    {
      kind: 'fader',
      id: 'freq',
      label: 'FREQ',
      value: pos,
      onChange: (v) => {
        setPos(v);
        const hz = Math.round(80 * Math.pow(8000 / 80, v));
        if (tone.playing) tone.set({ freqHz: hz });
      },
      format: () => `${f} Hz`,
      tint: '#37e05f',
      helpKey: 'loudness_curve',
    },
    {
      kind: 'fader',
      id: 'lvl',
      label: 'LEVEL',
      value: lvl,
      onChange: (v) => {
        setLvl(v);
        if (tone.playing) tone.set({ levelDb: -44 + v * 24 });
      },
      format: () => `${levelDb.toFixed(0)} dBFS`,
      tint: levelColor(lvl),
      helpKey: 'loudness_curve',
    },
    ...(tone.engineReady ? [playKey(tone, () => tone.play(f, levelDb))] : []),
  ];
  return (
    <RackUnit
      initialParam="freq"
      params={params}
      onHelp={(k) => (k ? help(k) : undefined)}
      stage={{
        size: 'M',
        badge: 'SIMPLIFIED SENSITIVITY CURVE — NOT MEASURED DATA',
        onGuide: () => help('loudness_curve'),
        bezel: [
          { k: 'FREQ', v: `${f} Hz`, helpKey: 'loudness_curve' },
          { k: 'LEVEL', v: `${levelDb.toFixed(0)} dBFS`, tint: levelColor(lvl), helpKey: 'loudness_curve' },
          { k: 'EAR', v: sens != null ? `${sens.toFixed(0)} dB` : '—', helpKey: 'loudness_curve' },
          toneCell(tone),
        ],
        render: (w, h) => (viz ? <M9Stage viz={viz} w={w} h={h} f={f} lvl={lvl} focused={focused} /> : <StageFallback w={w} />),
      }}
    >
      {wellTop}
      <AnalyticBadge text="SIMPLIFIED SENSITIVITY CURVE — ILLUSTRATION INSPIRED BY EQUAL-LOUDNESS CONTOURS, NOT MEASURED DATA · BOTTOM STRIP = THE SIGNAL (FOLLOWS LEVEL ONLY, NEVER FREQUENCY · SLOWED)" />
      {sens != null ? (
        <Text style={styles.caption}>
          Ear sensitivity at {f} Hz ≈ {sens.toFixed(0)} dB relative to 1 kHz —{' '}
          {sens < -6 ? 'the SAME amplitude sounds clearly quieter here.' : sens > 2 ? 'your ear slightly favors this region.' : 'close to the 1 kHz reference.'}
        </Text>
      ) : null}
      <Text style={styles.caption}>
        While playing, ride FREQ with the level untouched — the dBFS number never moves, yet the
        loudness does. (Phone speakers also physically roll off lows — headphones make the effect
        honest.)
      </Text>
      {wellBottom}
    </RackUnit>
  );
}
function M9Stage({ viz, w, h, f, lvl, focused }: { viz: VizModule; w: number; h: number; f: number; lvl: number; focused: boolean }) {
  // Phase clock — continuous while the frequency sweep drags.
  const phase = viz.usePhaseClock(focused, visHzFor(f));
  return (
    <View style={{ width: w, height: h, justifyContent: 'center' }}>
      <viz.EqualLoudnessView phase={phase} width={w} height={h} freqHz={f} level01={lvl} />
    </View>
  );
}

// ─── M10 — Phase: two identical waves + their sum ───────────────────────────

function M10Rack({ viz, tone, focused, help, wellTop, wellBottom }: RackProps) {
  const [phase, setPhase] = useState(270); // default lands at 270° (owner 2026-08-05)
  const [stereoMode, setStereoMode] = useState<'aligned' | 'drift' | null>(null);
  const hearSel = tone.playing && stereoMode ? stereoMode : 'off';
  const params: DockParam[] = [
    {
      kind: 'fader',
      id: 'phase',
      label: 'PHASE',
      value: phase / 360,
      onChange: (v) => setPhase(Math.round(v * 360)),
      format: () => `${phase}°${phase >= 175 && phase <= 185 ? ' — CANCELLED' : phase <= 5 || phase >= 355 ? ' — ALIGNED' : ''}`,
      formatShort: () => `${phase}°`,
      helpKey: 'phase_sum',
    },
    {
      kind: 'options',
      id: 'preset',
      label: 'PRESET',
      valueLabel: `${phase}°`,
      options: [0, 90, 180, 270, 360].map((d) => ({ id: String(d), label: `${d}°` })),
      selectedId: [0, 90, 180, 270, 360].includes(phase) ? String(phase) : null,
      onSelect: (id) => setPhase(Number(id)),
      sticky: true, // A/B aligned vs cancelled while the sum redraws
      helpKey: 'phase_sum',
    },
    ...(tone.stereoReady
      ? ([
          {
            kind: 'options',
            id: 'hear',
            label: 'HEAR',
            valueLabel: hearSel === 'aligned' ? 'ALIGN' : hearSel === 'drift' ? 'DRIFT' : 'OFF',
            options: [
              { id: 'aligned', label: 'HEAR ALIGNED — 220 / 220 Hz' },
              { id: 'drift', label: 'HEAR DRIFTING — 220 / 222 Hz' },
              { id: 'off', label: 'STOP' },
            ],
            selectedId: hearSel,
            onSelect: (id: string) => {
              if (id === 'aligned') {
                setStereoMode('aligned');
                tone.playStereo(220, 220, -24);
              } else if (id === 'drift') {
                setStereoMode('drift');
                tone.playStereo(220, 222, -24);
              } else {
                setStereoMode(null);
                tone.stop();
              }
            },
            sticky: true, // listen to the alignment breathe while comparing
            helpKey: 'phase_sum',
          },
        ] as DockParam[])
      : []),
  ];
  return (
    <RackUnit
      initialParam="phase"
      params={params}
      onHelp={(k) => (k ? help(k) : undefined)}
      stage={{
        size: 'L',
        badge: 'DRAWN FROM THE MATH — THE EXACT SUM (SLOWED)',
        onGuide: () => help('phase_sum'),
        bezel: [
          { k: 'PHASE', v: `${phase}°`, helpKey: 'phase_sum' },
          {
            k: 'SUM',
            v: phase >= 175 && phase <= 185 ? 'CANCELLED' : phase <= 5 || phase >= 355 ? 'ALIGNED' : 'PARTIAL',
            flex: 1.3,
            helpKey: 'phase_sum',
          },
          { k: 'OUT', v: tone.playing && stereoMode ? (stereoMode === 'drift' ? '220/222' : '220/220') : '—', tint: tone.playing ? undefined : '#7a7f8a' },
        ],
        render: (w, h) => (viz ? <M10Stage viz={viz} w={w} h={h} phase={phase} focused={focused} /> : <StageFallback w={w} />),
      }}
    >
      {wellTop}
      <AnalyticBadge text="DRAWN FROM THE MATH — THE BOTTOM LINE IS THE EXACT SUM OF THE TWO TRAVELING WAVES (SLOWED)" />
      {tone.stereoReady ? (
        <Text style={styles.caption}>
          Two REAL tones, hard-panned left/right (the HEAR key). DRIFTING = 220 vs 222 Hz: through
          the phone speaker they sum in the air, and their alignment cycles twice a second — loud
          (aligned) … quiet (opposed) … loud. That slow breathing IS phase, audible. On headphones
          each ear gets its own tone, so the beat becomes a softer in-head effect.
        </Text>
      ) : tone.engineReady ? (
        <Text style={styles.caption}>
          This engine build predates the stereo dual-oscillator — the drawn sum above stays exact;
          install the newest dev build to HEAR the drifting-phase demo.
        </Text>
      ) : null}
      {wellBottom}
    </RackUnit>
  );
}
function M10Stage({ viz, w, h, phase, focused }: { viz: VizModule; w: number; h: number; phase: number; focused: boolean }) {
  const clock = viz.useVizClock(focused);
  return (
    <View style={{ width: w, height: h, justifyContent: 'center' }}>
      <viz.PhaseOverlayView clock={clock} width={w} height={h} phaseDeg={phase} visHz={visHzFor(220)} />
    </View>
  );
}

// ─── M11 — Harmonics: build a tone layer by layer ───────────────────────────

const M11_F0 = 220;
function m11Amps(on: boolean[]): number[] {
  return Array.from({ length: 12 }, (_, i) => (i < 6 && on[i] ? 1 / (i + 1) : 0));
}
/** 6 per-harmonic amplitudes → the 25-number additive payload (H1..H6). */
function toAmps12(a6: number[]): number[] {
  return Array.from({ length: 12 }, (_, i) => (i < 6 ? Math.max(0, Math.min(1, a6[i] ?? 0)) : 0));
}

function M11Rack({ viz, tone, focused, help, wellTop, wellBottom }: RackProps) {
  // Each harmonic has an AMPLITUDE (owner 2026-08-05). The HARMONICS tray
  // selects one (off = amp 0, on = amp > 0, amber = selected); the LANE sets
  // the selected harmonic's amplitude, which the viewer reflects live via the
  // MIDI level colour. One harmonic is always selected (the lane needs a bind).
  const [amps, setAmps] = useState<number[]>([1, 0.5, 0.33, 0, 0, 0]);
  const [selected, setSelected] = useState(0);
  const setAmp = (i: number, v: number) =>
    setAmps((prev) => {
      const next = [...prev];
      next[i] = v;
      if (tone.playing) tone.setAdditiveLive(M11_F0, toAmps12(next));
      return next;
    });
  const params: DockParam[] = [
    {
      kind: 'fader',
      id: 'amp',
      label: `H${selected + 1} AMP`,
      value: amps[selected],
      onChange: (v) => setAmp(selected, v),
      format: () => `${Math.round(amps[selected] * 100)}%`,
      tint: levelColor(amps[selected]),
      helpKey: 'harmonic_stack',
    },
    {
      kind: 'group',
      id: 'harm',
      label: 'HARMONICS',
      valueLabel: `H${selected + 1}`,
      helpKey: 'harmonic_stack',
      render: () => (
        <View style={{ gap: 10 }}>
          <Text style={styles.trayHead}>HARMONICS — tap to select; the lane sets its amplitude</Text>
          <View style={styles.chipRow}>
            {amps.map((a, i) => {
              const on = a > 0.02;
              const sel = selected === i;
              return (
                <Pressable
                  key={i}
                  style={[styles.harmBtn, on && styles.harmBtnOn, sel && styles.harmBtnSel]}
                  onPress={() => setSelected(i)}
                  onLongPress={() => help('harmonic_stack')}
                  delayLongPress={300}
                  accessibilityRole="button"
                  accessibilityState={{ selected: sel }}
                  accessibilityLabel={`Harmonic ${i + 1}, ${sel ? 'selected' : on ? 'on' : 'off'}`}
                >
                  <Text style={[styles.harmBtnText, on && styles.harmBtnTextOn, sel && styles.harmBtnTextSel]}>H{i + 1}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ),
    },
    ...(tone.additiveReady ? [playKey(tone, () => tone.playAdditive(M11_F0, toAmps12(amps), -20))] : []),
  ];
  return (
    <RackUnit
      initialParam="amp"
      params={params}
      onHelp={(k) => (k ? help(k) : undefined)}
      stage={{
        size: 'L', // six layers + the sum
        badge: 'ANALYTIC — THE ENGINE’S EXACT RECIPE · PHASE-LOCKED, SLOWED',
        onGuide: () => help('harmonic_stack'),
        bezel: [
          { k: 'F0', v: `${M11_F0} Hz`, helpKey: 'harmonic_stack' },
          { k: 'SEL', v: `H${selected + 1}`, helpKey: 'harmonic_stack' },
          { k: 'AMP', v: `${Math.round(amps[selected] * 100)}%`, tint: levelColor(amps[selected]), helpKey: 'harmonic_stack' },
          toneCell(tone),
        ],
        render: (w, h) =>
          viz ? (
            <FitStage w={w} h={h} natural={HSTACK_NATURAL}>
              {(vw) => <M11Stage viz={viz} w={vw} amps={amps} focused={focused} />}
            </FitStage>
          ) : (
            <StageFallback w={w} />
          ),
      }}
    >
      {wellTop}
      <AnalyticBadge text="LAYERS AND SUM DRAWN FROM THE SAME RECIPE THE ENGINE PLAYS · PHASE-LOCKED, SLOWED · EACH ROW'S COLOUR = ITS LEVEL" />
      {!tone.additiveReady && tone.engineReady ? (
        <Text style={styles.caption}>
          This engine build predates the additive generator — the drawing stays exact; install the
          newest dev build to HEAR each harmonic enter the tone.
        </Text>
      ) : null}
      <Text style={styles.caption}>
        H1 (the fundamental) is at the BOTTOM; higher harmonics stack upward. Every layer is a pure
        sine at a whole-number multiple of {M11_F0} Hz — changing a harmonic's amplitude changes the
        TIMBRE, not the pitch, and its row colour tracks the level (blue = quiet → red = loud).
      </Text>
      {wellBottom}
    </RackUnit>
  );
}
function M11Stage({ viz, w, amps, focused }: { viz: VizModule; w: number; amps: number[]; focused: boolean }) {
  const clock = viz.useVizClock(focused);
  return <viz.HarmonicStackerView clock={clock} width={w} amps={amps} visHz={visHzFor(M11_F0)} />;
}

// ─── M12 — The Fourier principle: unmix a wave into its recipe ──────────────

const M12_RECIPES: { key: string; label: string; amps: number[] }[] = [
  { key: 'pure', label: 'PURE', amps: m11Amps([true, false, false, false, false, false]) },
  { key: 'hollow', label: 'HOLLOW (odd)', amps: m11Amps([true, false, true, false, true, false]) },
  { key: 'bright', label: 'BRIGHT (all)', amps: m11Amps([true, true, true, true, true, true]) },
];

function M12Rack({ viz, tone, focused, help, wellTop, wellBottom }: RackProps) {
  const [recipeIdx, setRecipeIdx] = useState(2);
  const [morph, setMorph] = useState(0.67); // UNMIX defaults to 67% separated (owner 2026-08-05)
  const recipe = M12_RECIPES[recipeIdx];
  const params: DockParam[] = [
    {
      kind: 'fader',
      id: 'morph',
      label: 'UNMIX',
      value: morph,
      onChange: setMorph,
      format: () => `${Math.round(morph * 100)}% separated`,
      formatShort: () => `${Math.round(morph * 100)}%`,
      helpKey: 'fourier_morph',
    },
    {
      kind: 'options',
      id: 'recipe',
      label: 'RECIPE',
      valueLabel: recipe.label,
      options: M12_RECIPES.map((r) => ({ id: r.key, label: r.label })),
      selectedId: recipe.key,
      onSelect: (id) => {
        const i = M12_RECIPES.findIndex((r) => r.key === id);
        if (i < 0) return;
        setRecipeIdx(i);
        if (tone.playing) tone.setAdditiveLive(M11_F0, M12_RECIPES[i].amps);
      },
      sticky: true, // A/B the recipes while the lens holds
      helpKey: 'fourier_morph',
    },
    ...(tone.additiveReady ? [playKey(tone, () => tone.playAdditive(M11_F0, recipe.amps, -20))] : []),
  ];
  return (
    <RackUnit
      initialParam="morph"
      params={params}
      onHelp={(k) => (k ? help(k) : undefined)}
      stage={{
        size: 'L',
        badge: 'ANALYTIC DECOMPOSITION OF THE MODEL — SLOWED',
        onGuide: () => help('fourier_morph'),
        bezel: [
          { k: 'RECIPE', v: recipe.label, flex: 1.3, helpKey: 'fourier_morph' },
          { k: 'UNMIX', v: `${Math.round(morph * 100)}%`, helpKey: 'fourier_morph' },
          { k: 'F0', v: `${M11_F0} Hz`, helpKey: 'fourier_morph' },
          toneCell(tone),
        ],
        render: (w, h) => (viz ? <M12Stage viz={viz} w={w} h={h} amps={recipe.amps} morph={morph} focused={focused} /> : <StageFallback w={w} />),
      }}
    >
      {wellTop}
      <AnalyticBadge text="ANALYTIC DECOMPOSITION OF THE MODEL — WAVE & INGREDIENTS TRAVEL (SLOWED); THE SPECTRUM HOLDS STILL. THE MEASURED VERSION LIVES IN THE RTA & SPECTROGRAM" />
      <Text style={styles.caption}>
        Fourier’s claim: ANY repeating pressure pattern — however jagged — is a stack of plain
        sines. Ride UNMIX to pull this wave apart into its ingredient list. Every analyzer in this
        app does exactly that, live, on real signals.
      </Text>
      {wellBottom}
    </RackUnit>
  );
}
function M12Stage({ viz, w, h, amps, morph, focused }: { viz: VizModule; w: number; h: number; amps: number[]; morph: number; focused: boolean }) {
  const clock = viz.useVizClock(focused);
  return (
    <View style={{ width: w, height: h, justifyContent: 'center' }}>
      <viz.FourierLensView clock={clock} width={w} height={h} amps={amps} morph={morph} visHz={visHzFor(M11_F0)} />
    </View>
  );
}

// ─── M13 — Why measurement tools exist: concept → the REAL tool ─────────────

const M13_TOOLS: { q: string; name: string; blurb: string; route: ToolRoute }[] = [
  { q: 'HOW LOUD IS IT IN THE ROOM?', name: 'SPL Meter', blurb: 'Weighted, time-averaged level from the real mic — ears estimate, meters measure.', route: 'SplMeter' },
  { q: 'WHAT FREQUENCY IS THAT?', name: 'Frequency Counter & Tuner', blurb: 'Measures a steady tone’s exact frequency in Hz — and reads it musically as note, octave, and cents for tuning.', route: 'FrequencyCounter' },
  { q: 'WHAT’S THE RECIPE RIGHT NOW?', name: 'RTA', blurb: 'Live energy per frequency band — M12’s Fourier idea, measured.', route: 'Rta' },
  { q: 'HOW DOES IT CHANGE OVER TIME?', name: 'Spectrogram', blurb: 'Frequency vs time — sweeps, decays, harmonics appearing and fading.', route: 'SpectrogramLive' },
  { q: 'WHAT IS THE PRESSURE DOING?', name: 'Waveform', blurb: 'M2’s graph captured live: real pressure over real time.', route: 'WaveformLive' },
  { q: 'HOW LONG DOES THE ROOM RING?', name: 'RT60', blurb: 'Clap — the decay is recorded and fitted per octave band.', route: 'Rt60Live' },
  { q: 'WHAT DO I TEST WITH?', name: 'Signal Generator', blurb: 'Known tones, noise, sweeps and clicks — because a known source exposes the system.', route: 'SignalGen' },
];

function M13Rack({ viz, focused, help, wellTop, wellBottom, onTool }: RackProps) {
  return (
    <RackUnit
      // Reading module: the signal chain pins as an illustrative stage; the
      // tool cards are navigation (reading), so the dock stays empty.
      initialParam="none"
      params={[]}
      onHelp={(k) => (k ? help(k) : undefined)}
      stage={{
        size: 'S',
        badge: BADGE_CONCEPT,
        onGuide: () => help('tool_map'),
        bezel: [{ k: 'CHAIN', v: 'SOURCE → AIR → MIC', flex: 2, helpKey: 'tool_map' }],
        render: (w, h) => (viz ? <M13Stage viz={viz} w={w} h={h} focused={focused} /> : <StageFallback w={w} />),
      }}
    >
      {wellTop}
      {viz ? <ConceptBadge extra="SOURCE → AIR → MIC — the chain every tool below listens to" /> : null}
      {/* Intro text ABOVE the list (owner 2026-08-05). */}
      <Text style={styles.caption}>
        Every card opens the REAL tool — live mic, real engine, honest units (dBFS · uncalibrated
        where that’s the truth). Ears adapt, compare and tire; instruments hold still. That is the
        entire reason this toolbox exists.
      </Text>
      {M13_TOOLS.map((t) => (
        <Pressable
          key={t.route}
          style={styles.toolCard}
          onPress={() => onTool(t.route)}
          onLongPress={() => help('tool_map')}
          accessibilityRole="button"
          accessibilityLabel={`Open ${t.name}`}
        >
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.toolQ}>{t.q}</Text>
            <Text style={styles.toolName}>{t.name}</Text>
            <Text style={styles.toolBlurb}>{t.blurb}</Text>
          </View>
          <Text style={styles.toolArrow}>›</Text>
        </Pressable>
      ))}
      {wellBottom}
    </RackUnit>
  );
}
function M13Stage({ viz, w, h, focused }: { viz: VizModule; w: number; h: number; focused: boolean }) {
  const clock = viz.useVizClock(focused);
  return (
    <View style={{ width: w, height: h, justifyContent: 'center' }}>
      <viz.SignalPathView clock={clock} width={w} height={h} />
    </View>
  );
}

// ─── M14 — Graduation: the playground IS the module ─────────────────────────

const M14_RECAP = [
  '1 · Sound is moving air',
  '2 · Speaker · air · graph — one event, three views',
  '3 · Compression & rarefaction around the resting line',
  '4 · Amplitude — the SIZE of the vibration',
  '5 · Frequency — the RATE of the vibration',
  '6 · Wavelength — low notes occupy meters of air',
  '7 · Time and space — two rulers, distance = speed × time',
  '8 · Pitch is ratio — every octave is a doubling',
  '9 · Loudness ≠ amplitude — ears have a curve',
  '10 · Phase — alignment decides add or cancel',
  '11 · Harmonics — sines stack into character',
  '12 · Fourier — every sound is a sum of sines',
  '13 · Tools measure what ears estimate',
];

function M14Rack({ viz, focused, help, wellTop, wellBottom, onPlayground }: RackProps) {
  return (
    <RackUnit
      // Graduation module: one last look at the centerpiece pins on the stage;
      // the recap reads in the well; the Playground door is the big green CTA.
      initialParam="none"
      params={[]}
      onHelp={(k) => (k ? help(k) : undefined)}
      stage={{
        size: 'L',
        badge: BADGE_CONCEPT,
        onGuide: () => help('speaker_cone'),
        bezel: [{ k: 'COURSE', v: 'COMPLETE — THE WHOLE MODEL', flex: 2 }],
        render: (w, h) =>
          viz ? (
            <FitStage w={w} h={h} natural={THREE_WINDOW_NATURAL}>
              {(vw) => <viz.ThreeWindowView width={vw} visHz={visHzFor(220)} amp={0.75} running={focused} />}
            </FitStage>
          ) : (
            <StageFallback w={w} />
          ),
      }}
    >
      {wellTop}
      {viz ? <ConceptBadge extra="THE WHOLE MODEL, ONE LAST LOOK" /> : null}
      <Text style={styles.comingHead}>YOU BUILT THE WHOLE MODEL</Text>
      {M14_RECAP.map((c) => (
        <Text key={c} style={styles.comingRow}>
          {c}
        </Text>
      ))}
      <Text style={styles.body}>
        Module 14 IS the Playground: every control from this course on one screen, driving every
        view at once — waveform, spectrum, air, cone, level. Change anything; watch everything
        answer.
      </Text>
      <GlassButton label="OPEN THE PLAYGROUND" tint="green" height={52} fontSize={14} onPress={onPlayground} />
      {wellBottom}
    </RackUnit>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// The steps

type Step = {
  key: string;
  tag: string;
  title: string;
  paras: string[];
  Rack: (p: RackProps) => React.JSX.Element;
  check?: CheckSpec;
};

const STEPS: Step[] = [
  {
    key: 'm1',
    tag: 'MODULE 1',
    title: 'WHAT IS SOUND?',
    paras: [
      'Sound is moving air. Not electricity. Not a waveform. Not a speaker. Not a graph.',
      'Air molecules repeatedly squeeze together (compression) and spread apart (rarefaction). Those pressure changes travel outward until they reach your ears.',
      'Watch the particles: each one only rocks back and forth around its home. The PATTERN of squeezes is what travels — the air itself stays put.',
    ],
    Rack: M1Rack,
  },
  {
    key: 'm2',
    tag: 'MODULE 2',
    title: 'THREE WAYS TO VIEW SOUND',
    paras: [
      'The same sound can be pictured three ways: the SPEAKER that makes it, the AIR that carries it, and the GRAPH engineers draw of it.',
      'These are three views of ONE phenomenon, at the same moment: the cone pushes, the air squeezes, the graph plots the squeeze.',
      'The wavy line is NOT the shape of the sound. It is a graph of PRESSURE over time. This one misunderstanding causes enormous confusion later — settle it now.',
    ],
    Rack: M2Rack,
    check: {
      question: 'Is the wavy line the shape sound makes in the air?',
      options: [
        'Yes — sound ripples through air in a wave shape',
        'No — it is a graph of pressure plotted over time',
      ],
      correctIdx: 1,
      reveal:
        'The line is a GRAPH — pressure at one point, plotted over time. In the air itself, molecules just move back and forth along the direction of travel (the particle window above). Nothing in the air is ever shaped like the line.',
      wrongHint: 'Look at the particle window — do you see anything wave-SHAPED in the air?',
    },
  },
  {
    key: 'm3',
    tag: 'MODULE 3',
    title: 'COMPRESSION & RAREFACTION',
    paras: [
      'Ride the STRENGTH lane. A stronger vibration packs the molecules closer on every squeeze (compression) and spreads them thinner on every stretch (rarefaction).',
      'Pressure above the room’s resting pressure is POSITIVE. Below it is NEGATIVE. The resting level — atmospheric pressure — is the graph’s zero line.',
      'Hold onto this picture: a microphone is just a tiny surface that rides these pressure swings. Every mic you will ever use starts here.',
    ],
    Rack: M3Rack,
  },
  {
    key: 'm4',
    tag: 'MODULE 4',
    title: 'AMPLITUDE',
    paras: [
      'Small vibration → quiet sound. Large vibration → loud sound. That size is AMPLITUDE.',
      'Ride the lane and watch everything move together: the cone travels farther, the squeezes get denser, the graph gets taller, and the level rises — four views of one number.',
      'Amplitude is the SIZE of the vibration, not its speed. Speed is a different property — that is the next module.',
    ],
    Rack: M4Rack,
    check: {
      question: 'To make a LOUDER sound, the speaker cone must…',
      options: [
        'Move back and forth FASTER',
        'Move back and forth FARTHER',
        'Move physically closer to your ear',
      ],
      correctIdx: 1,
      reveal:
        'Farther = bigger pressure swings = louder. Moving FASTER changes how often the air is squeezed — that changes the PITCH, not the loudness. (Getting closer does sound louder, but the speaker itself isn’t making a louder sound.)',
    },
  },
  {
    key: 'm5',
    tag: 'MODULE 5',
    title: 'FREQUENCY',
    paras: [
      'Amplitude was the SIZE of the vibration. Frequency is its RATE: how many complete back-and-forth cycles happen each second, counted in hertz (Hz).',
      'Both sources below are identical except for one number. Watch the orbit dials — one lap is one cycle. B simply completes its cycles more often.',
      'A faster rate packs the compressions closer together in time. Your ear reports that as HIGHER. Nothing else changed — not the size, not the distance, only the rate.',
    ],
    Rack: M5Rack,
    check: {
      question: 'To raise the PITCH of a sound, the source must…',
      options: [
        'Vibrate back and forth FARTHER',
        'Vibrate back and forth MORE OFTEN each second',
        'Push more air with each cycle',
      ],
      correctIdx: 1,
      reveal:
        'Pitch follows the RATE — cycles per second (Hz). Vibrating farther makes it LOUDER (that was Module 4). Two properties, two knobs: size = amplitude = loudness, rate = frequency = pitch.',
      wrongHint: 'Which module was about the SIZE of the vibration? This one is about something else.',
    },
  },
  {
    key: 'm6',
    tag: 'MODULE 6',
    title: 'WAVELENGTH',
    paras: [
      'A wave is not just a rate — it takes up SPACE. While one compression travels away at 343 m/s, the next is already being made behind it. The distance between them is the wavelength, λ.',
      'λ = speed ÷ frequency. A 55 Hz bass note is over six meters long — it doesn’t fit in your bedroom. A 5 kHz sparkle is seven centimeters.',
      'This is why bass behaves so differently: it wraps around obstacles, piles up in room corners, and needs big drivers. Ride the lane and watch real meters of air.',
    ],
    Rack: M6Rack,
    check: {
      question: 'A 55 Hz wave is ~6 m long. Your eardrum is ~6 mm. How can you hear it at all?',
      options: [
        'The whole 6 m wave squeezes into the ear',
        'The ear reads the pressure changes ARRIVING AT ONE POINT, over time',
        'You can’t — subwoofers are felt, not heard',
      ],
      correctIdx: 1,
      reveal:
        'The ear never needs the whole wave — it sits at one point and rides the pressure swings as they PASS (Module 3’s microphone picture). The wave’s size in space and the ear’s size have nothing to do with each other.',
    },
  },
  {
    key: 'm7',
    tag: 'MODULE 7',
    title: 'TIME vs SPACE',
    paras: [
      'At first glance, these two waveforms look identical — but they are measuring two different things.',
      'TOP GRAPH: pressure measured by ONE microphone over TIME at one location. As the sound wave passes the mic, the pressure rises and falls and moves its element. This is the waveform you see in DAWs, oscilloscopes, and most audio software — what came out of the mic.',
      'BOTTOM GRAPH: pressure measured across MANY locations in SPACE at one instant. Imagine pausing time at a concert and measuring the air pressure at every seat. Those measurements reveal the shape of the sound wave as it exists across the room at that moment.',
      'They have the same shape because they describe the same sound wave — only the horizontal axis changes. The top axis shows the waveform over TIME; the bottom axis shows it over DISTANCE.',
      'The two are connected by one simple relationship: distance = speed × time. The sound wave is always traveling through space — one microphone experiences that motion over time, while the entire room contains the wave spread across distance.',
    ],
    Rack: M7Rack,
    check: {
      question: 'On a studio waveform display, the horizontal axis is…',
      options: ['Distance through the air, in meters', 'Time, in seconds', 'Frequency, low to high'],
      correctIdx: 1,
      reveal:
        'A waveform display is a microphone’s diary: pressure at ONE point plotted over TIME. The space picture exists too — but no ordinary meter shows it. (Frequency on the x-axis is a different tool entirely: the analyzer.)',
    },
  },
  {
    key: 'm8',
    tag: 'MODULE 8',
    title: 'PITCH vs FREQUENCY',
    paras: [
      'Frequency is the measured number. PITCH is what you hear — and your hearing is a RATIO instrument, not a difference instrument.',
      '110→220 adds 110 Hz. 440→880 adds 440 Hz. Different amounts — yet both sound like exactly the same step: one octave, a doubling.',
      'The spiral is that fact drawn honestly: one full turn = one octave = ×2 in frequency. Equal musical steps are equal ANGLES while the Hz number accelerates. This is why every analyzer offers a log axis.',
    ],
    Rack: M8Rack,
    check: {
      question: '220→440 Hz and 440→880 Hz sound like the SAME size step because…',
      options: [
        'They both add the same number of hertz',
        'Hearing works in RATIOS — both are a doubling (×2)',
        'The ear can’t tell high frequencies apart',
      ],
      correctIdx: 1,
      reveal:
        'Both steps are ×2 — one octave each. The ear compares ratios, which is a logarithmic response. That single fact explains octaves, why frequency axes are drawn in log, and why “200 Hz wide” means a lot at 100 Hz and almost nothing at 10 kHz.',
    },
  },
  {
    key: 'm9',
    tag: 'MODULE 9',
    title: 'LOUDNESS vs AMPLITUDE',
    paras: [
      'Module 4 said bigger amplitude = louder. True — for one frequency at a time. Across frequencies, the ear applies its own hidden curve.',
      'The blue line is that curve (simplified): sensitivity peaks in the few-kHz region — where speech lives — and falls off steeply toward the lows.',
      'Sweep the frequency WITHOUT touching the level: the amplitude number stays fixed while the loudness visibly (audibly) changes. Amplitude is physics; loudness is perception wearing that curve.',
    ],
    Rack: M9Rack,
    check: {
      question: 'A tone at 80 Hz and a tone at 1 kHz have the SAME amplitude. Why does the 80 Hz tone sound quieter?',
      options: [
        'Low frequencies carry less energy',
        'The ear is simply less sensitive at low frequencies',
        'It doesn’t — equal amplitude always means equal loudness',
      ],
      correctIdx: 1,
      reveal:
        'The energy is the same — the RECEIVER differs. Ear sensitivity drops toward the lows, so equal amplitude is not equal loudness. This is why quiet playback loses bass first, and why “turn it up until it sounds right” changes the whole tonal balance.',
    },
  },
  {
    key: 'm10',
    tag: 'MODULE 10',
    title: 'PHASE — THE FIRST MAGIC TRICK',
    paras: [
      'Phase is WHERE in its cycle a wave is, measured in degrees. Alone it is inaudible. But sound is almost never alone.',
      'When two copies of the same wave meet, phase decides everything: aligned (0°) they ADD into double. Opposed (180°) they CANCEL — pressure up meets pressure down, and the air simply never moves.',
      'Ride the lane and watch the sum. This one idea powers noise-canceling headphones, explains hollow-sounding mic pairs, comb filtering, and why subwoofer placement matters.',
    ],
    Rack: M10Rack,
    check: {
      question: 'Two IDENTICAL waves meet at 180°. The result is…',
      options: [
        'Twice as loud — two waves is more sound',
        'Silence — every push meets an equal pull',
        'The pitch drops one octave',
      ],
      correctIdx: 1,
      reveal:
        'At 180° every compression lands on an equal rarefaction: the sum is zero — silence from two real sounds. (The energy isn’t destroyed; in real rooms it redistributes to places where they align.) Aligned instead, the same pair doubles. Phase decides.',
      wrongHint: 'Look at the amber SUM line at 180° — what happened to it?',
    },
  },
  {
    key: 'm11',
    tag: 'MODULE 11',
    title: 'HARMONICS',
    paras: [
      'Why don’t a piano and a trumpet playing the same note sound the same? Same pitch, same loudness — different CHARACTER. The answer is harmonics.',
      'Real vibrating things don’t make one sine — they make a family: the fundamental plus whole-number multiples (2×, 3×, 4×…), each a pure sine with its own strength.',
      'Build it yourself: stack layers and listen. The pitch NEVER moves — H2 at 440 lives inside 220’s family — only the character thickens. Timbre is a recipe.',
    ],
    Rack: M11Rack,
    check: {
      question: 'Adding harmonics to a 220 Hz fundamental changes the sound’s…',
      options: ['Pitch — more harmonics, higher note', 'Character (timbre) — the pitch stays at 220 Hz', 'Speed through the air'],
      correctIdx: 1,
      reveal:
        'The harmonics are MULTIPLES of 220, so the pattern still repeats 220 times a second — the pitch holds. What changes is the SHAPE of each cycle: the tone’s character. A trumpet is “brighter” than a flute because its recipe holds more strong upper harmonics.',
    },
  },
  {
    key: 'm12',
    tag: 'MODULE 12',
    title: 'THE FOURIER PRINCIPLE',
    paras: [
      'Module 11 built complex tones out of sines in harmonic relationships. Fourier’s theorem is the breathtaking reverse: any repeating pattern — however jagged — can have its harmonics taken apart into plain sines. Not approximately. Exactly.',
      'That means every sound has two complete descriptions: the waveform (pressure over time) and the SPECTRUM (which sines, how strong). Same information, two views.',
      'Ride UNMIX to pull this wave apart into its ingredient list. Every analyzer, every EQ readout, every spectrogram in this app is doing precisely this — live, on real air.',
    ],
    Rack: M12Rack,
    check: {
      question: 'A spectrum analyzer shows tall lines at 220, 440 and 660 Hz. What is it telling you?',
      options: [
        'Three separate instruments are playing',
        'The sound contains sine ingredients at those frequencies — likely ONE 220 Hz tone with harmonics',
        'The microphone is distorting',
      ],
      correctIdx: 1,
      reveal:
        'The analyzer speaks Fourier: it lists the sine ingredients. 220 · 440 · 660 is a whole-number family — the signature of ONE 220 Hz tone with its harmonics (Module 11). Reading spectra is reading recipes.',
    },
  },
  {
    key: 'm13',
    tag: 'MODULE 13',
    title: 'WHY MEASUREMENT TOOLS EXIST',
    paras: [
      'You now own the model: air, amplitude, frequency, wavelength, phase, harmonics, spectra. One problem remains — your ears ADAPT. They tire, they recalibrate, they flatter. Instruments hold still.',
      'Every question this course raised has a tool that answers it with a number. Each card below opens the real one — live mic, real engine.',
      'Tools don’t replace ears; they anchor them. The meter gives you the number, the model tells you what the number means — and now you have both.',
    ],
    Rack: M13Rack,
    check: {
      question: 'A level meter in this app reads −12 dBFS. What is that a measurement of?',
      options: [
        'The loudness your ear experiences',
        'The sound pressure in the room, in dB SPL',
        'Digital signal level relative to full scale — not calibrated loudness',
      ],
      correctIdx: 2,
      reveal:
        'dBFS is DIGITAL level: distance below the converter’s full scale. It is not SPL and not loudness (Module 9 showed loudness needs the ear’s curve). This app labels every reading honestly — dBFS · uncalibrated — because a number you misread is worse than no number.',
    },
  },
  {
    key: 'm14',
    tag: 'MODULE 14',
    title: 'THE FULL PLAYGROUND',
    paras: [
      'Thirteen modules, one picture: a speaker moves, air squeezes and stretches, a graph describes it, and every property — size, rate, spacing, alignment, recipe — is now a knob you understand.',
      'The final module is not a lesson. It is the whole course on one screen: every control driving every view at once. Go break things.',
    ],
    Rack: M14Rack,
  },
];

// ─────────────────────────────────────────────────────────────────────────────

export function FoundationsCourseScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [step, setStep] = useState(0);
  // No-account (anonymous) users always OPEN a lab at the first step and never
  // resume a later one after an app close (owner 2026-08-12): their place is
  // neither restored nor persisted. A registered account (free/academy/lapsed)
  // resumes as before. Ref so the async restore/persist below reads the CURRENT
  // tier, never a stale closure. (Gate on entitlement, not caps — the dev
  // academy-lock bypass forces caps only, so this stays correct in dev.)
  const { entitlement } = useEntitlement();
  const noAccountRef = useRef(entitlement === 'anonymous');
  noAccountRef.current = entitlement === 'anonymous';
  // Collapsible intro TEXT (owner 2026-08-05) — the paragraph block at the top
  // of every module's well can be hidden; the pinned display never moves.
  const [textOpen, setTextOpen] = useState(true);

  const [gate] = useState<EngineState>(() => {
    if (!ApeDsp.isAvailable()) return 'absent';
    return ApeDsp.engineVersion() >= 2 ? 'idle' : 'spike';
  });
  const engineReady = gate === 'idle';
  const tone = useCourseTone(engineReady);
  const viz = useMemo(() => requireViz(), []);
  // Freeze all Skia animation when the course is not the focused screen
  // (native-stack keeps it mounted under the pushed Playground).
  const focused = useIsFocused();

  // Per-control help (owner request 2026-07-26) — the two-tier "what it does"
  // popup, shared with every lab. Bezel/dock long-presses route here too.
  const [lessonKey, setLessonKey] = useState<string | undefined>(undefined);
  const [lessonOpen, setLessonOpen] = useState(false);
  const help = useCallback((key: string) => {
    setLessonKey(key);
    setLessonOpen(true);
  }, []);

  // Resume where the student left off (device-local; freely open, not graded).
  // The restore is DROPPED if the student already navigated before AsyncStorage
  // resolved — their tap wins over the stored position.
  const navigatedRef = useRef(false);
  useEffect(() => {
    void AsyncStorage.getItem(STEP_KEY).then((v) => {
      if (navigatedRef.current) return; // the user's own tap already won
      if (noAccountRef.current) return; // no account: always begin at the first step
      const n = v == null ? NaN : Number(v);
      if (Number.isInteger(n) && n > 0 && n < STEPS.length) {
        tone.stop(); // never carry a step-0 tone into the resumed step
        setStep(n);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const goTo = useCallback(
    (n: number) => {
      navigatedRef.current = true;
      tone.stop(); // each step owns its own sound — never carries over
      setStep(n);
      // Persist the place only for registered accounts — guests never resume.
      if (!noAccountRef.current) void AsyncStorage.setItem(STEP_KEY, String(n));
    },
    [tone],
  );

  // R6c: mark each course step viewed → the Foundations of Sound lab completes
  // once all modules have been seen. Register the unit set (step indices) on
  // mount so the boot-loaded store never imports this heavy screen.
  useEffect(() => {
    registerLabUnits('af_foundations', STEPS.map((_, i) => String(i)));
  }, []);
  useEffect(() => {
    markLabUnit('af_foundations', String(step));
  }, [step]);

  const s = STEPS[step];
  const openPlayground = useCallback(() => {
    tone.stop();
    navigation.navigate('FoundationsPlayground');
  }, [navigation, tone]);
  // M13 — each concept card opens the REAL measurement tool.
  const goTool = useCallback(
    (r: ToolRoute) => {
      tone.stop();
      navigation.navigate(r);
    },
    [navigation, tone],
  );

  // The reading column the module racks wrap: gate + tag + title + collapsible
  // paragraphs above the module's own captions…
  const wellTop = (
    <>
      {!engineReady ? <EngineGate state={gate} /> : null}
      <Text style={styles.tag}>{s.tag} · {step + 1} OF {STEPS.length}</Text>
      <View style={styles.titleRow}>
        <Text style={[styles.stepTitle, { flex: 1 }]}>{s.title}</Text>
        {/* Reveal toggle for the intro TEXT only — collapse it and the dock
            rides up under the remaining content (RackUnit well behavior). */}
        <Pressable
          onPress={() => setTextOpen((v) => !v)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={textOpen ? 'Hide the description text' : 'Show the description text'}
        >
          <Text style={styles.textToggle}>{textOpen ? '▾ TEXT' : '▸ TEXT'}</Text>
        </Pressable>
      </View>
      {textOpen
        ? s.paras.map((p, i) => (
            <Text key={i} style={styles.body}>
              {p}
            </Text>
          ))
        : null}
    </>
  );
  // …and the check + BACK/NEXT below them (PREV = gold, NEXT = green, matching
  // the study-method screens — owner 2026-08-05).
  const wellBottom = (
    <>
      {s.check ? <CheckQuestion key={s.key} spec={s.check} /> : null}
      <View style={styles.navRow}>
        <View style={{ flex: 1 }}>
          <GlassButton
            label="‹ BACK"
            tint="gold"
            disabled={step === 0}
            onPress={() => goTo(Math.max(0, step - 1))}
          />
        </View>
        <View style={{ flex: 1 }}>
          <GlassButton
            label={step === STEPS.length - 1 ? 'DONE ✓' : 'NEXT ›'}
            tint="green"
            onPress={() =>
              step === STEPS.length - 1 ? navigation.goBack() : goTo(Math.min(STEPS.length - 1, step + 1))
            }
          />
        </View>
      </View>
    </>
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={{ flexShrink: 1, flexGrow: 1 }}>
          <Text style={styles.title}>FOUNDATIONS OF SOUND</Text>
          <Text style={styles.subtitle}>Understanding What You’re Hearing</Text>
        </View>
        <AccuracyNote compact />
      </View>

      {/* Top navigation (owner 2026-08-05): jump straight to the beginning, or
          step, without scrolling to the bottom BACK/NEXT buttons. */}
      <View style={styles.topNav}>
        <Pressable
          onPress={() => goTo(0)}
          disabled={step === 0}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go to the first module"
        >
          <Text style={[styles.navBtn, step === 0 && styles.navBtnDisabled]}>⏮ START</Text>
        </Pressable>
        <Pressable
          onPress={() => goTo(Math.max(0, step - 1))}
          disabled={step === 0}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Previous module"
        >
          <Text style={[styles.navBtn, step === 0 && styles.navBtnDisabled]}>‹ PREV</Text>
        </Pressable>
        <View style={{ flex: 1 }} />
        <Text style={styles.navPos}>
          MODULE {step + 1} / {STEPS.length}
        </Text>
        <View style={{ flex: 1 }} />
        <Pressable
          onPress={() => goTo(Math.min(STEPS.length - 1, step + 1))}
          disabled={step === STEPS.length - 1}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Next module"
        >
          <Text style={[styles.navBtn, step === STEPS.length - 1 && styles.navBtnDisabled]}>NEXT ›</Text>
        </Pressable>
      </View>

      {/* Progress dots — tap any dot to jump directly (freely open). */}
      <View style={styles.dotsRow}>
        {STEPS.map((st, i) => (
          <Pressable
            key={st.key}
            onPress={() => goTo(i)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Go to ${st.title}`}
          >
            <View style={[styles.dot, i === step && styles.dotActive, i < step && styles.dotDone]} />
          </Pressable>
        ))}
        <View style={{ flex: 1 }} />
        <Pressable onPress={openPlayground} accessibilityRole="button" accessibilityLabel="Open the playground">
          <Text style={styles.playgroundLink}>PLAYGROUND ›</Text>
        </Pressable>
      </View>

      {/* The current module's Rack Unit — keyed per step so each module mounts
          fresh (its own state, its own initial lane bind), exactly as the old
          per-step panels did. The frame owns the scroll well + dock. */}
      <View style={styles.rackWrap}>
        <s.Rack
          key={s.key}
          viz={viz}
          tone={tone}
          focused={focused}
          help={help}
          wellTop={wellTop}
          wellBottom={wellBottom}
          onPlayground={openPlayground}
          onTool={goTool}
        />
      </View>

      <GuidedLessonSheet
        visible={lessonOpen}
        lesson={getLabLesson('foundations')}
        controlKey={lessonKey}
        onClose={() => setLessonOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingBottom: 8 },
  back: { fontFamily: fonts.oswaldSemiBold, fontSize: 30, color: colors.textSub, marginTop: -4, paddingRight: 2 },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 17, letterSpacing: 1.4, color: colors.textPrimary },
  subtitle: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.textSub, marginTop: 1 },

  // Top navigation bar (jump-to-start / prev / next).
  topNav: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingBottom: 6 },
  navBtn: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1, color: colors.amber },
  navBtnDisabled: { color: '#45454d' },
  navPos: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1, color: colors.textSub },

  // 14 steps now — dots sized so the full row + the Playground link still fit.
  dotsRow: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 16, paddingBottom: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#2c2c33' },
  dotActive: { backgroundColor: colors.amber, width: 15 },
  dotDone: { backgroundColor: 'rgba(255,198,77,.45)' },
  playgroundLink: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.2, color: '#37e05f' },

  // The Rack Unit needs the remaining vertical space (flex:1) — it owns the
  // stage, the scroll well and the dock inside it.
  rackWrap: { flex: 1 },

  tag: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 1.6, color: colors.amber },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepTitle: { fontFamily: fonts.oswaldMedium, fontSize: 22, letterSpacing: 0.6, color: colors.textPrimary },
  textToggle: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1, color: colors.amber },
  body: { fontFamily: fonts.barlowRegular, fontSize: 14.5, lineHeight: 21, color: colors.textSecondary },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  trayHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.amber },
  // Harmonic buttons — three states: off / on / selected (owner 2026-08-05).
  harmBtn: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3a3a42',
    backgroundColor: '#141418',
    paddingVertical: 8,
    paddingHorizontal: 14,
    minWidth: 44,
    alignItems: 'center',
  },
  harmBtnOn: { borderColor: 'rgba(55,224,95,.6)', backgroundColor: '#0f1a12' },
  harmBtnSel: { borderColor: 'rgba(255,198,77,.85)', backgroundColor: '#1a1409' },
  harmBtnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1, color: colors.textMuted },
  harmBtnTextOn: { color: '#37e05f' },
  harmBtnTextSel: { color: colors.amber },
  winLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 9.5, letterSpacing: 1.1, color: colors.textSub },

  pressureLegend: { gap: 2 },
  legendPlus: { fontFamily: fonts.barlowMedium, fontSize: 12, color: colors.amber },
  legendZero: { fontFamily: fonts.barlowMedium, fontSize: 12, color: colors.textSub },
  legendMinus: { fontFamily: fonts.barlowMedium, fontSize: 12, color: '#6fa8ff' },

  comingHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.4, color: colors.textSecondary },
  comingRow: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 19, color: colors.textSub },

  navRow: { flexDirection: 'row', gap: 10, marginTop: 4 },

  // Display-explanation captions are WHITE like the body text (owner
  // 2026-08-05), not gray.
  caption: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSecondary },
  // Green "drag the spiral" hint — matches the green node/lines (owner 2026-08-05).
  spiralHint: { fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 18, color: '#37e05f' },
  analyticBadge: { fontFamily: fonts.oswaldSemiBold, fontSize: 9, letterSpacing: 1, lineHeight: 13, color: colors.textSub },

  toolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#0f0f13',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  toolQ: { fontFamily: fonts.oswaldSemiBold, fontSize: 9.5, letterSpacing: 1.2, color: colors.amber },
  toolName: { fontFamily: fonts.oswaldMedium, fontSize: 15, letterSpacing: 0.4, color: colors.textPrimary },
  // Brighter subtitle for contrast on black (owner 2026-08-05) — was gray.
  toolBlurb: { fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16, color: colors.textSecondary },
  toolArrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 22, color: colors.textSub },
});
