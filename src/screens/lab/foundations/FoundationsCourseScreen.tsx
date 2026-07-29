/**
 * FoundationsCourseScreen — "Foundations of Sound · Understanding What You're
 * Hearing" (owner 2026-07-26). The FIRST module inside the Ear Training &
 * Audio Lab: a stepped teaching progression (NOT the Learn/Explore lab shell)
 * that builds the mental model every other lesson stands on.
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
 * honest VizUnavailableCard; text + audio still work, §1.7). Animated panels
 * are the slowed CONCEPTUAL model; static panels are ANALYTIC drawings of the
 * exact math — every panel badges which it is.
 *
 * AUDIO: one shared voice owned by the shell (house idiom: audio-output gate →
 * genSet/genStart → keepalive → stop on step change/blur/unmount). Sine
 * everywhere; Modules 11–12 use the REAL v3+ additive engine (12-harmonic
 * synthesis) and Module 10 the REAL v5+ stereo dual-oscillator — engine builds
 * below those versions get the honest "needs the newer dev build" note, never
 * a fabricated stand-in. Speaker-guarded per frequency (native route-aware
 * HPF on v4+). Engine-absent clients read and watch everything — only the
 * PLAY buttons gate out.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useIsFocused, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ApeDsp, GEN_MODES } from '../../../../modules/ape-dsp';
import { GlassButton } from '../../../components/GlassButton';
import { useAudioOutputGate } from '../../../features/audio/AudioOutputGate';
import { noteAudioActivity } from '../../../features/audio/audioOutputStore';
import { guardAdditiveForEngine, guardToneLevelForEngine } from '../../../features/audio/speakerSafety';
import { EngineGate } from '../../tools/EngineGate';
import type { EngineState } from '../../../features/tools/engine/useDspEngine';
import { colors, fonts } from '../../../theme/tokens';
import type { RootStackParamList } from '../../../navigation/types';
import { LabChip } from '../LabShell';
import { GuidedLessonSheet, getLabLesson, DisplayGuideButton } from '../../../features/lab/guidedLessons';
import { CheckQuestion, ConceptBadge, DragSlider, LevelMeterBar, VizUnavailableCard, type CheckSpec } from './bits';
import { requireViz, skiaAvailable, type VizModule } from './skiaGate';

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
// Module panels (each mounts its viz child ONLY when Skia is available)

type PanelProps = { viz: VizModule | null; width: number; tone: ToneApi; focused: boolean; help: (key: string) => void };

/** M1 — air particles alone, LOW/HIGH pitch chips. */
function M1Panel({ viz, width, tone, focused, help }: PanelProps) {
  const [f, setF] = useState(220);
  const pick = (hz: number) => {
    setF(hz);
    if (tone.playing) tone.set({ freqHz: hz });
  };
  return (
    <View style={styles.panelCard}>
      {viz ? (
        <M1Viz viz={viz} width={width} visHz={visHzFor(f)} running={focused} />
      ) : (
        <VizUnavailableCard />
      )}
      <ConceptBadge />
      <DisplayGuideButton onPress={() => help('air')} />
      <View style={styles.chipRow}>
        <LabChip label="LOW · 110 Hz" selected={f === 110} onPress={() => pick(110)} onLongPress={() => help('frequency')} />
        <LabChip label="MID · 220 Hz" selected={f === 220} onPress={() => pick(220)} onLongPress={() => help('frequency')} />
        <LabChip label="HIGH · 880 Hz" selected={f === 880} onPress={() => pick(880)} onLongPress={() => help('frequency')} />
      </View>
      {tone.engineReady ? (
        <GlassButton
          label={tone.playing ? 'STOP' : `PLAY THE TONE — ${f} Hz`}
          tint="green"
          height={46}
          fontSize={14}
          onPress={() => (tone.playing ? tone.stop() : tone.play(f, -24))}
        />
      ) : null}
    </View>
  );
}
function M1Viz({ viz, width, visHz, running }: { viz: VizModule; width: number; visHz: number; running: boolean }) {
  const clock = viz.useVizClock(running);
  return <viz.AirParticlesView clock={clock} width={width} visHz={visHz} amp={0.75} showEar />;
}

/** M2 — the three synchronized windows. */
function M2Panel({ viz, width, tone, focused, help }: PanelProps) {
  return (
    <View style={styles.panelCard}>
      {viz ? (
        <viz.ThreeWindowView width={width} visHz={visHzFor(220)} amp={0.75} running={focused} />
      ) : (
        <VizUnavailableCard />
      )}
      <ConceptBadge extra="ALL THREE WINDOWS SHOW THE SAME MOMENT" />
      <DisplayGuideButton onPress={() => help('speaker_cone')} />
      {tone.engineReady ? (
        <GlassButton
          label={tone.playing ? 'STOP' : 'PLAY THE TONE — 220 Hz'}
          tint="green"
          height={46}
          fontSize={14}
          onPress={() => (tone.playing ? tone.stop() : tone.play(220, -24))}
        />
      ) : null}
    </View>
  );
}

/** M3 — compression/rarefaction slider (particles + pressure, no cone). */
function M3Panel({ viz, width, tone, focused, help }: PanelProps) {
  const [amt, setAmt] = useState(0.55);
  const levelFor = (a: number) => -44 + a * 22; // −44 … −22 dBFS
  return (
    <View style={styles.panelCard}>
      {viz ? <M3Viz viz={viz} width={width} amp={amt} running={focused} /> : <VizUnavailableCard />}
      <ConceptBadge />
      <DisplayGuideButton onPress={() => help('pressure_graph')} />
      <DragSlider
        value={amt}
        onChange={(v) => {
          setAmt(v);
          if (tone.playing) tone.set({ levelDb: levelFor(v) });
        }}
        label="COMPRESSION STRENGTH"
        readout={amt < 0.33 ? 'gentle' : amt < 0.66 ? 'medium' : 'strong'}
        onHelp={() => help('pressure_graph')}
      />
      <View style={styles.pressureLegend}>
        <Text style={styles.legendPlus}>+ compression — pressure ABOVE atmospheric</Text>
        <Text style={styles.legendZero}>0 — atmospheric pressure (the resting line)</Text>
        <Text style={styles.legendMinus}>− rarefaction — pressure BELOW atmospheric</Text>
      </View>
      {tone.engineReady ? (
        <GlassButton
          label={tone.playing ? 'STOP' : 'HEAR IT — 165 Hz'}
          tint="green"
          height={46}
          fontSize={14}
          onPress={() => (tone.playing ? tone.stop() : tone.play(165, levelFor(amt)))}
        />
      ) : null}
    </View>
  );
}
function M3Viz({ viz, width, amp, running }: { viz: VizModule; width: number; amp: number; running: boolean }) {
  const clock = viz.useVizClock(running);
  const visHz = visHzFor(165);
  return (
    <View style={{ gap: 4 }}>
      <Text style={styles.winLabel}>AIR — squeeze (compression) · stretch (rarefaction)</Text>
      <viz.AirParticlesView clock={clock} width={width} visHz={visHz} amp={amp} />
      <Text style={styles.winLabel}>PRESSURE — above / below atmospheric</Text>
      <viz.PressureGraphView clock={clock} width={width} visHz={visHz} amp={amp} />
    </View>
  );
}

/** M4 — amplitude: one slider drives cone + air + graph + level + loudness. */
function M4Panel({ viz, width, tone, focused, help }: PanelProps) {
  const [amt, setAmt] = useState(0.5);
  const levelFor = (a: number) => -44 + a * 24; // −44 … −20 dBFS
  return (
    <View style={styles.panelCard}>
      {viz ? (
        <viz.ThreeWindowView width={width} visHz={visHzFor(330)} amp={0.25 + amt * 0.75} running={focused} showEar={false} />
      ) : (
        <VizUnavailableCard />
      )}
      <ConceptBadge />
      <DisplayGuideButton onPress={() => help('speaker_cone')} />
      <DragSlider
        value={amt}
        onChange={(v) => {
          setAmt(v);
          if (tone.playing) tone.set({ levelDb: levelFor(v) });
        }}
        label="VIBRATION SIZE (AMPLITUDE)"
        readout={amt < 0.33 ? 'small → quiet' : amt < 0.66 ? 'medium' : 'large → loud'}
        onHelp={() => help('amplitude')}
      />
      <Pressable onLongPress={() => help('amplitude')} delayLongPress={260}>
        <LevelMeterBar levelDb={levelFor(amt)} minDb={-48} maxDb={-18} />
      </Pressable>
      {tone.engineReady ? (
        <GlassButton
          label={tone.playing ? 'STOP' : 'HEAR IT — 330 Hz'}
          tint="green"
          height={46}
          fontSize={14}
          onPress={() => (tone.playing ? tone.stop() : tone.play(330, levelFor(amt)))}
        />
      ) : null}
    </View>
  );
}

/** The static-panel disclosure twin of ConceptBadge (§1.7). */
function AnalyticBadge({ text }: { text?: string }) {
  return <Text style={styles.analyticBadge}>{text ?? 'ANALYTIC — DRAWN FROM THE MATH, NOT A MEASUREMENT'}</Text>;
}

// ─── M5 — Frequency: two sources that differ ONLY in rate ───────────────────

const M5_PAIRS: { label: string; a: number; b: number }[] = [
  { label: '110 vs 220', a: 110, b: 220 },
  { label: '220 vs 440', a: 220, b: 440 },
  { label: '440 vs 441', a: 440, b: 441 },
];

function M5Panel({ viz, width, tone, focused, help }: PanelProps) {
  const [pairIdx, setPairIdx] = useState(1);
  const [side, setSide] = useState<'a' | 'b'>('a');
  const pair = M5_PAIRS[pairIdx];
  const active = tone.playing ? side : 'none';
  const sound = (s: 'a' | 'b') => {
    const hz = s === 'a' ? pair.a : pair.b;
    if (tone.playing && side === s) {
      tone.stop();
      return;
    }
    setSide(s);
    if (tone.playing) tone.set({ freqHz: hz });
    else tone.play(hz, -24);
  };
  return (
    <View style={styles.panelCard}>
      {viz ? <M5Viz viz={viz} width={width} a={pair.a} b={pair.b} active={active} running={focused} /> : <VizUnavailableCard />}
      <ConceptBadge extra="LEFT AND RIGHT DIFFER ONLY IN RATE — count the orbit laps" />
      <DisplayGuideButton onPress={() => help('rate')} />
      <View style={styles.chipRow}>
        {M5_PAIRS.map((p, i) => (
          <LabChip
            key={p.label}
            label={p.label}
            selected={pairIdx === i}
            onPress={() => {
              setPairIdx(i);
              if (tone.playing) tone.set({ freqHz: side === 'a' ? M5_PAIRS[i].a : M5_PAIRS[i].b });
            }}
            onLongPress={() => help('rate')}
          />
        ))}
      </View>
      {tone.engineReady ? (
        <View style={styles.btnRow}>
          <View style={{ flex: 1 }}>
            <GlassButton
              label={tone.playing && side === 'a' ? `STOP A · ${pair.a} Hz` : `PLAY A · ${pair.a} Hz`}
              tint="green"
              height={46}
              fontSize={13}
              onPress={() => sound('a')}
            />
          </View>
          <View style={{ flex: 1 }}>
            <GlassButton
              label={tone.playing && side === 'b' ? `STOP B · ${pair.b} Hz` : `PLAY B · ${pair.b} Hz`}
              tint="green"
              height={46}
              fontSize={13}
              onPress={() => sound('b')}
            />
          </View>
        </View>
      ) : null}
      {pairIdx === 2 ? (
        <Text style={styles.caption}>
          440 vs 441: one extra cycle per second — far too close to name as different notes, yet
          still two different rates. Frequency is a NUMBER (cycles per second), not a feeling.
        </Text>
      ) : null}
    </View>
  );
}
function M5Viz({ viz, width, a, b, active, running }: { viz: VizModule; width: number; a: number; b: number; active: 'a' | 'b' | 'none'; running: boolean }) {
  const clock = viz.useVizClock(running);
  return <viz.RateComparatorView clock={clock} width={width} visHzA={visHzFor(a)} visHzB={visHzFor(b)} active={active} />;
}

// ─── M6 — Wavelength: the wave laid across a real 7 m room ──────────────────

function M6Panel({ viz, width, tone, focused, help }: PanelProps) {
  const [oct, setOct] = useState(1); // 55 · 2^oct, 0..4 → 55..880 Hz
  const f = Math.round(55 * Math.pow(2, oct));
  const lambda = 343 / f;
  return (
    <View style={styles.panelCard}>
      {viz ? <M6Viz viz={viz} width={width} f={f} running={focused} /> : <VizUnavailableCard />}
      <ConceptBadge extra="HORIZONTAL SCALE IS REAL — the room is 7 m wide, ticks every 1 m" />
      <DisplayGuideButton onPress={() => help('wavelength_room')} />
      <DragSlider
        value={oct / 4}
        onChange={(v) => {
          const o = v * 4;
          setOct(o);
          if (tone.playing) tone.set({ freqHz: Math.round(55 * Math.pow(2, o)) });
        }}
        label="FREQUENCY"
        readout={`${f} Hz · λ = ${lambda.toFixed(2)} m`}
        onHelp={() => help('wavelength_room')}
      />
      <Text style={styles.caption}>
        λ = speed ÷ frequency = 343 ÷ {f} ≈ {lambda.toFixed(2)} m — {(7 / lambda).toFixed(1)}{' '}
        wavelength{7 / lambda >= 1.95 ? 's' : ''} fit across the room. The amber bracket IS that
        length, drawn to scale.
      </Text>
      {tone.engineReady ? (
        <GlassButton
          label={tone.playing ? 'STOP' : `PLAY — ${f} Hz`}
          tint="green"
          height={46}
          fontSize={14}
          onPress={() => (tone.playing ? tone.stop() : tone.play(f, -24))}
        />
      ) : null}
      <Text style={styles.caption}>
        Very low tones are high-passed on the phone speaker to protect it — headphones reveal the
        full low end the drawing describes.
      </Text>
    </View>
  );
}
function M6Viz({ viz, width, f, running }: { viz: VizModule; width: number; f: number; running: boolean }) {
  const clock = viz.useVizClock(running);
  return <viz.WavelengthRulerView clock={clock} width={width} freqHz={f} visHz={visHzFor(f)} />;
}

// ─── M7 — Time vs space: the same wave on two rulers ────────────────────────

function M7Panel({ viz, width, tone, focused, help }: PanelProps) {
  const [cursor, setCursor] = useState(0.25);
  const [frozen, setFrozen] = useState(false);
  const [f, setF] = useState(220);
  return (
    <View style={styles.panelCard}>
      {viz ? <viz.DualDomainView width={width} visHz={visHzFor(f)} cursor={cursor} running={focused && !frozen} /> : <VizUnavailableCard />}
      <ConceptBadge extra="SAME WAVE — TWO RULERS" />
      <DisplayGuideButton onPress={() => help('domain_link')} />
      <DragSlider
        value={cursor}
        onChange={setCursor}
        label="TRACE THE WAVE"
        readout="same phase → same height"
        onHelp={() => help('domain_link')}
      />
      <View style={styles.chipRow}>
        <LabChip label={frozen ? 'RUN ▶' : 'FREEZE ⏸'} selected={frozen} onPress={() => setFrozen((v) => !v)} onLongPress={() => help('domain_link')} />
        {[110, 220].map((hz) => (
          <LabChip
            key={hz}
            label={`${hz} Hz`}
            selected={f === hz}
            onPress={() => {
              setF(hz);
              if (tone.playing) tone.set({ freqHz: hz });
            }}
            onLongPress={() => help('domain_link')}
          />
        ))}
      </View>
      <Text style={styles.caption}>
        The two green dots never disagree: a moment BACK IN TIME on the top ruler is the same as a
        distance BACK ALONG THE ROOM on the bottom one. distance = speed × time — that single
        equation links the two graphs forever.
      </Text>
      {tone.engineReady ? (
        <GlassButton
          label={tone.playing ? 'STOP' : `PLAY — ${f} Hz`}
          tint="green"
          height={46}
          fontSize={14}
          onPress={() => (tone.playing ? tone.stop() : tone.play(f, -24))}
        />
      ) : null}
    </View>
  );
}

// ─── M8 — Pitch vs frequency: the octave spiral ─────────────────────────────

function M8Panel({ viz, width, tone, help }: PanelProps) {
  const [f, setF] = useState(220);
  const fRef = useRef(220);
  const toneRef = useRef(tone);
  toneRef.current = tone;
  const widthRef = useRef(width);
  widthRef.current = width;
  const lastAngRef = useRef<number | null>(null);

  const setFreq = (nf: number) => {
    fRef.current = nf;
    setF(nf);
    if (toneRef.current.playing) toneRef.current.set({ freqHz: Math.round(nf) });
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4,
      onPanResponderGrant: (e) => {
        lastAngRef.current = Math.atan2(e.nativeEvent.locationY - 105, e.nativeEvent.locationX - widthRef.current / 2);
      },
      onPanResponderMove: (e) => {
        const ang = Math.atan2(e.nativeEvent.locationY - 105, e.nativeEvent.locationX - widthRef.current / 2);
        const last = lastAngRef.current;
        lastAngRef.current = ang;
        if (last == null) return;
        let d = ang - last;
        if (d > Math.PI) d -= 2 * Math.PI;
        if (d < -Math.PI) d += 2 * Math.PI;
        // Clockwise = up the spiral: one full turn = one octave (a doubling).
        const o = Math.max(0, Math.min(3, Math.log2(fRef.current / 110) + d / (2 * Math.PI)));
        setFreq(110 * Math.pow(2, o));
      },
      onPanResponderRelease: () => {
        lastAngRef.current = null;
      },
      onPanResponderTerminationRequest: () => false,
    }),
  ).current;

  const octAbove = Math.log2(f / 110);
  return (
    <View style={styles.panelCard}>
      <View {...pan.panHandlers}>{viz ? <viz.OctaveSpiralView width={width} freqHz={f} /> : <VizUnavailableCard />}</View>
      <AnalyticBadge text="ANALYTIC — THE SPIRAL IS HOW HEARING MAPS FREQUENCY (log), DRAWN EXACTLY" />
      <DisplayGuideButton onPress={() => help('octave_spiral')} />
      <Text style={styles.caption}>
        Drag AROUND the spiral to glide the pitch — one full turn is one octave. The dots on the
        upward ray mark 110 · 220 · 440 · 880 Hz: every crossing is a DOUBLING, yet each turn feels
        like the same size musical step.
      </Text>
      <View style={styles.chipRow}>
        {[110, 220, 440, 880].map((hz) => (
          <LabChip key={hz} label={`${hz}`} selected={Math.round(f) === hz} onPress={() => setFreq(hz)} onLongPress={() => help('octave_spiral')} />
        ))}
      </View>
      <Text style={styles.sliderReadoutBig}>
        {Math.round(f)} Hz · {octAbove.toFixed(2)} octaves above 110
      </Text>
      {tone.engineReady ? (
        <GlassButton
          label={tone.playing ? 'STOP' : 'PLAY THE SPIRAL'}
          tint="green"
          height={46}
          fontSize={14}
          onPress={() => (tone.playing ? tone.stop() : tone.play(Math.round(f), -24))}
        />
      ) : null}
    </View>
  );
}

// ─── M9 — Loudness vs amplitude: the ear-sensitivity curve ──────────────────

function M9Panel({ viz, width, tone, help }: PanelProps) {
  const [pos, setPos] = useState(Math.log(1000 / 80) / Math.log(8000 / 80)); // start at 1 kHz
  const [lvl, setLvl] = useState(0.65); // −44..−20 dBFS
  const f = Math.round(80 * Math.pow(8000 / 80, pos));
  const levelDb = -44 + lvl * 24;
  const sens = viz ? viz.earSensDb(f) : null;
  return (
    <View style={styles.panelCard}>
      {viz ? <viz.EqualLoudnessView width={width} freqHz={f} /> : <VizUnavailableCard />}
      <AnalyticBadge text="SIMPLIFIED SENSITIVITY CURVE — ILLUSTRATION INSPIRED BY EQUAL-LOUDNESS CONTOURS, NOT MEASURED DATA" />
      <DisplayGuideButton onPress={() => help('loudness_curve')} />
      <DragSlider
        value={pos}
        onChange={(v) => {
          setPos(v);
          const hz = Math.round(80 * Math.pow(8000 / 80, v));
          if (tone.playing) tone.set({ freqHz: hz });
        }}
        label="FREQUENCY (level held constant)"
        readout={`${f} Hz`}
        onHelp={() => help('loudness_curve')}
      />
      <DragSlider
        value={lvl}
        onChange={(v) => {
          setLvl(v);
          if (tone.playing) tone.set({ levelDb: -44 + v * 24 });
        }}
        label="LEVEL (the actual amplitude)"
        readout={`${levelDb.toFixed(0)} dBFS`}
        onHelp={() => help('loudness_curve')}
      />
      {sens != null ? (
        <Text style={styles.caption}>
          Ear sensitivity at {f} Hz ≈ {sens.toFixed(0)} dB relative to 1 kHz —{' '}
          {sens < -6 ? 'the SAME amplitude sounds clearly quieter here.' : sens > 2 ? 'your ear slightly favors this region.' : 'close to the 1 kHz reference.'}
        </Text>
      ) : null}
      {tone.engineReady ? (
        <GlassButton
          label={tone.playing ? 'STOP' : 'SWEEP IT YOURSELF'}
          tint="green"
          height={46}
          fontSize={14}
          onPress={() => (tone.playing ? tone.stop() : tone.play(f, levelDb))}
        />
      ) : null}
      <Text style={styles.caption}>
        While playing, drag FREQUENCY with the level untouched — the dBFS number never moves, yet
        the loudness does. (Phone speakers also physically roll off lows — headphones make the
        effect honest.)
      </Text>
    </View>
  );
}

// ─── M10 — Phase: two identical waves + their sum ───────────────────────────

function M10Panel({ viz, width, tone, help }: PanelProps) {
  const [phase, setPhase] = useState(0);
  return (
    <View style={styles.panelCard}>
      {viz ? <viz.PhaseOverlayView width={width} phaseDeg={phase} /> : <VizUnavailableCard />}
      <AnalyticBadge text="DRAWN FROM THE MATH — THE BOTTOM LINE IS THE EXACT SUM OF THE TWO WAVES" />
      <DisplayGuideButton onPress={() => help('phase_sum')} />
      <DragSlider
        value={phase / 360}
        onChange={(v) => setPhase(Math.round(v * 360))}
        label="PHASE OFFSET"
        readout={`${phase}°${phase >= 175 && phase <= 185 ? ' — CANCELLED' : phase <= 5 || phase >= 355 ? ' — ALIGNED' : ''}`}
        onHelp={() => help('phase_sum')}
      />
      <View style={styles.chipRow}>
        {[0, 90, 180, 270, 360].map((d) => (
          <LabChip key={d} label={`${d}°`} selected={phase === d} onPress={() => setPhase(d)} onLongPress={() => help('phase_sum')} />
        ))}
      </View>
      {tone.stereoReady ? (
        <>
          <View style={styles.btnRow}>
            <View style={{ flex: 1 }}>
              <GlassButton label="HEAR ALIGNED" tint="green" height={46} fontSize={12.5} onPress={() => tone.playStereo(220, 220, -24)} />
            </View>
            <View style={{ flex: 1 }}>
              <GlassButton label="HEAR DRIFTING" tint="green" height={46} fontSize={12.5} onPress={() => tone.playStereo(220, 222, -24)} />
            </View>
            <View style={{ flex: 1 }}>
              <GlassButton label="STOP" tint="steel" height={46} fontSize={12.5} onPress={() => tone.stop()} />
            </View>
          </View>
          <Text style={styles.caption}>
            Two REAL tones, hard-panned left/right. DRIFTING = 220 vs 222 Hz: through the phone
            speaker they sum in the air, and their alignment cycles twice a second — loud (aligned)
            … quiet (opposed) … loud. That slow breathing IS phase, audible. On headphones each ear
            gets its own tone, so the beat becomes a softer in-head effect.
          </Text>
        </>
      ) : tone.engineReady ? (
        <Text style={styles.caption}>
          This engine build predates the stereo dual-oscillator — the drawn sum above stays exact;
          install the newest dev build to HEAR the drifting-phase demo.
        </Text>
      ) : null}
    </View>
  );
}

// ─── M11 — Harmonics: build a tone layer by layer ───────────────────────────

const M11_F0 = 220;
const M11_PRESETS: { label: string; on: boolean[] }[] = [
  { label: 'F0 ONLY', on: [true, false, false, false, false, false] },
  { label: 'ODD', on: [true, false, true, false, true, false] },
  { label: 'ALL', on: [true, true, true, true, true, true] },
];

function m11Amps(on: boolean[]): number[] {
  return Array.from({ length: 12 }, (_, i) => (i < 6 && on[i] ? 1 / (i + 1) : 0));
}

function M11Panel({ viz, width, tone, help }: PanelProps) {
  const [on, setOn] = useState<boolean[]>([true, false, false, false, false, false]);
  const apply = (next: boolean[]) => {
    setOn(next);
    if (tone.playing) tone.setAdditiveLive(M11_F0, m11Amps(next));
  };
  return (
    <View style={styles.panelCard}>
      {viz ? <viz.HarmonicStackerView width={width} on={on} /> : <VizUnavailableCard />}
      <AnalyticBadge text="LAYERS AND SUM DRAWN FROM THE SAME RECIPE THE ENGINE PLAYS (1/n weights)" />
      <DisplayGuideButton onPress={() => help('harmonic_stack')} />
      <View style={styles.chipRow}>
        {on.map((v, i) => (
          <LabChip
            key={i}
            label={`H${i + 1}`}
            selected={v}
            onPress={() => {
              const next = [...on];
              next[i] = !next[i];
              apply(next);
            }}
            onLongPress={() => help('harmonic_stack')}
          />
        ))}
      </View>
      <View style={styles.chipRow}>
        {M11_PRESETS.map((p) => (
          <LabChip
            key={p.label}
            label={p.label}
            selected={on.every((v, i) => v === p.on[i])}
            onPress={() => apply([...p.on])}
            onLongPress={() => help('harmonic_stack')}
          />
        ))}
      </View>
      {tone.additiveReady ? (
        <GlassButton
          label={tone.playing ? 'STOP' : 'PLAY THE STACK'}
          tint="green"
          height={46}
          fontSize={14}
          onPress={() => (tone.playing ? tone.stop() : tone.playAdditive(M11_F0, m11Amps(on), -20))}
        />
      ) : tone.engineReady ? (
        <Text style={styles.caption}>
          This engine build predates the additive generator — the drawing stays exact; install the
          newest dev build to HEAR each harmonic enter the tone.
        </Text>
      ) : null}
      <Text style={styles.caption}>
        Toggle layers WHILE it plays: every layer is a pure sine at a whole-number multiple of{' '}
        {M11_F0} Hz. The PITCH never moves — only the character (timbre) thickens. Real additive
        synthesis, {`amps 1/n`}, engine-normalized.
      </Text>
    </View>
  );
}

// ─── M12 — The Fourier principle: unmix a wave into its recipe ──────────────

const M12_RECIPES: { key: string; label: string; amps: number[] }[] = [
  { key: 'pure', label: 'PURE', amps: m11Amps([true, false, false, false, false, false]) },
  { key: 'hollow', label: 'HOLLOW (odd)', amps: m11Amps([true, false, true, false, true, false]) },
  { key: 'bright', label: 'BRIGHT (all)', amps: m11Amps([true, true, true, true, true, true]) },
];

function M12Panel({ viz, width, tone, help }: PanelProps) {
  const [recipeIdx, setRecipeIdx] = useState(2);
  const [morph, setMorph] = useState(0);
  const recipe = M12_RECIPES[recipeIdx];
  return (
    <View style={styles.panelCard}>
      {viz ? <viz.FourierLensView width={width} amps={recipe.amps} morph={morph} /> : <VizUnavailableCard />}
      <AnalyticBadge text="ANALYTIC DECOMPOSITION OF THE MODEL — THE MEASURED VERSION LIVES IN THE RTA & SPECTROGRAM" />
      <DisplayGuideButton onPress={() => help('fourier_morph')} />
      <View style={styles.chipRow}>
        {M12_RECIPES.map((r, i) => (
          <LabChip
            key={r.key}
            label={r.label}
            selected={recipeIdx === i}
            onPress={() => {
              setRecipeIdx(i);
              if (tone.playing) tone.setAdditiveLive(M11_F0, M12_RECIPES[i].amps);
            }}
            onLongPress={() => help('fourier_morph')}
          />
        ))}
      </View>
      <DragSlider
        value={morph}
        onChange={setMorph}
        label="UNMIX"
        readout={`${Math.round(morph * 100)}% separated`}
        onHelp={() => help('fourier_morph')}
      />
      {tone.additiveReady ? (
        <GlassButton
          label={tone.playing ? 'STOP' : 'PLAY THIS RECIPE'}
          tint="green"
          height={46}
          fontSize={14}
          onPress={() => (tone.playing ? tone.stop() : tone.playAdditive(M11_F0, recipe.amps, -20))}
        />
      ) : null}
      <Text style={styles.caption}>
        Fourier’s claim: ANY repeating pressure pattern — however jagged — is a stack of plain
        sines. Slide UNMIX to pull this wave apart into its ingredient list. Every analyzer in this
        app does exactly that, live, on real signals.
      </Text>
    </View>
  );
}

// ─── M13 — Why measurement tools exist: concept → the REAL tool ─────────────

type ToolRoute = 'SplMeter' | 'FrequencyCounter' | 'Rta' | 'SpectrogramLive' | 'WaveformLive' | 'Rt60Live' | 'SignalGen';

const M13_TOOLS: { q: string; name: string; blurb: string; route: ToolRoute }[] = [
  { q: 'HOW LOUD IS IT IN THE ROOM?', name: 'SPL Meter', blurb: 'Weighted, time-averaged level from the real mic — ears estimate, meters measure.', route: 'SplMeter' },
  { q: 'WHAT FREQUENCY IS THAT?', name: 'Frequency Counter & Tuner', blurb: 'Detects the pitch (M5’s number) and tells you how much to trust it.', route: 'FrequencyCounter' },
  { q: 'WHAT’S THE RECIPE RIGHT NOW?', name: 'RTA', blurb: 'Live energy per frequency band — M12’s Fourier idea, measured.', route: 'Rta' },
  { q: 'HOW DOES IT CHANGE OVER TIME?', name: 'Spectrogram', blurb: 'Frequency vs time — sweeps, decays, harmonics appearing and fading.', route: 'SpectrogramLive' },
  { q: 'WHAT IS THE PRESSURE DOING?', name: 'Waveform', blurb: 'M2’s graph captured live: real pressure over real time.', route: 'WaveformLive' },
  { q: 'HOW LONG DOES THE ROOM RING?', name: 'RT60', blurb: 'Clap — the decay is recorded and fitted per octave band.', route: 'Rt60Live' },
  { q: 'WHAT DO I TEST WITH?', name: 'Signal Generator', blurb: 'Known tones, noise, sweeps and clicks — because a known source exposes the system.', route: 'SignalGen' },
];

function M13Panel({ help, onTool }: PanelProps & { onTool: (r: ToolRoute) => void }) {
  return (
    <View style={styles.panelCard}>
      <DisplayGuideButton onPress={() => help('tool_map')} />
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
      <Text style={styles.caption}>
        Every card opens the REAL tool — live mic, real engine, honest units (dBFS · uncalibrated
        where that’s the truth). Ears adapt, compare and tire; instruments hold still. That is the
        entire reason this toolbox exists.
      </Text>
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

function M14Panel({ onPlayground }: { onPlayground: () => void }) {
  return (
    <View style={styles.panelCard}>
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
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// The steps

type Step = {
  key: string;
  tag: string;
  title: string;
  paras: string[];
  Panel: (p: PanelProps & { onPlayground: () => void; onTool: (r: ToolRoute) => void }) => React.JSX.Element;
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
    Panel: M1Panel,
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
    Panel: M2Panel,
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
      'Drag the slider. A stronger vibration packs the molecules closer on every squeeze (compression) and spreads them thinner on every stretch (rarefaction).',
      'Pressure above the room’s resting pressure is POSITIVE. Below it is NEGATIVE. The resting level — atmospheric pressure — is the graph’s zero line.',
      'Hold onto this picture: a microphone is just a tiny surface that rides these pressure swings. Every mic you will ever use starts here.',
    ],
    Panel: M3Panel,
  },
  {
    key: 'm4',
    tag: 'MODULE 4',
    title: 'AMPLITUDE',
    paras: [
      'Small vibration → quiet sound. Large vibration → loud sound. That size is AMPLITUDE.',
      'Drag the slider and watch everything move together: the cone travels farther, the squeezes get denser, the graph gets taller, and the level rises — four views of one number.',
      'Amplitude is the SIZE of the vibration, not its speed. Speed is a different property — that is the next module.',
    ],
    Panel: M4Panel,
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
    Panel: M5Panel,
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
      'This is why bass behaves so differently: it wraps around obstacles, piles up in room corners, and needs big drivers. Drag the slider and watch real meters of air.',
    ],
    Panel: M6Panel,
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
      'Here is the same wave drawn on two different rulers. TOP: pressure at ONE point (a mic), plotted over TIME — the right edge is “now”. BOTTOM: pressure ALONG the room at one instant — a snapshot in SPACE.',
      'They look identical, and that fools nearly everyone. One axis is seconds; the other is meters. The bridge between them is one equation: distance = speed × time.',
      'Drag the cursor: the two green dots always ride the same phase — the same height. Freeze the motion and study it. Every waveform display you will ever read is the TOP picture.',
    ],
    Panel: M7Panel,
    check: {
      question: 'On a studio waveform display, the horizontal axis is…',
      options: ['Distance through the air, in meters', 'Time, in seconds', 'Frequency, low to high'],
      correctIdx: 1,
      reveal:
        'A waveform display is a microphone’s diary: pressure at ONE point plotted over TIME. The space picture exists too — but no ordinary meter shows it. (Frequency on the x-axis is a different tool entirely: the analyzer, coming in Module 12.)',
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
    Panel: M8Panel,
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
    Panel: M9Panel,
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
      'Drag the slider and watch the sum. This one idea powers noise-canceling headphones, explains hollow-sounding mic pairs, comb filtering, and why subwoofer placement matters.',
    ],
    Panel: M10Panel,
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
    Panel: M11Panel,
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
      'Module 11 built complex tones out of sines. Fourier’s theorem is the breathtaking reverse: ANY repeating pattern — however jagged — can be taken APART into plain sines. Not approximately. Exactly.',
      'That means every sound has two complete descriptions: the waveform (pressure over time) and the SPECTRUM (which sines, how strong). Same information, two views.',
      'Slide UNMIX to pull this wave apart into its ingredient list. Every analyzer, every EQ readout, every spectrogram in this app is doing precisely this — live, on real air.',
    ],
    Panel: M12Panel,
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
    Panel: M13Panel,
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
    Panel: ({ onPlayground }) => <M14Panel onPlayground={onPlayground} />,
  },
];

// ─────────────────────────────────────────────────────────────────────────────

export function FoundationsCourseScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [step, setStep] = useState(0);
  const [width, setWidth] = useState(0);

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
  // popup, shared with every lab.
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
      void AsyncStorage.setItem(STEP_KEY, String(n));
    },
    [tone],
  );

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

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={{ flexShrink: 1 }}>
          <Text style={styles.title}>FOUNDATIONS OF SOUND</Text>
          <Text style={styles.subtitle}>Understanding What You’re Hearing</Text>
        </View>
      </View>

      {/* Progress dots — tap to jump (freely open, owner decision). */}
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

      <ScrollView contentContainerStyle={styles.scroll}>
        {!engineReady ? <EngineGate state={gate} /> : null}
        {/* One-time honesty note for pre-Skia clients, above the fold. */}
        {!skiaAvailable && step === 0 ? <VizUnavailableCard /> : null}

        <Text style={styles.tag}>{s.tag} · {step + 1} OF {STEPS.length}</Text>
        <Text style={styles.stepTitle}>{s.title}</Text>
        {s.paras.map((p, i) => (
          <Text key={i} style={styles.body}>
            {p}
          </Text>
        ))}

        <View onLayout={(e) => setWidth(Math.round(e.nativeEvent.layout.width) - 24)}>
          {width > 0 ? (
            <s.Panel viz={viz} width={width} tone={tone} focused={focused} help={help} onPlayground={openPlayground} onTool={goTool} />
          ) : null}
        </View>

        {s.check ? <CheckQuestion key={s.key} spec={s.check} /> : null}

        <View style={styles.navRow}>
          <View style={{ flex: 1 }}>
            <GlassButton
              label="‹ BACK"
              tint="steel"
              height={48}
              fontSize={13}
              disabled={step === 0}
              onPress={() => goTo(Math.max(0, step - 1))}
            />
          </View>
          <View style={{ flex: 1 }}>
            <GlassButton
              label={step === STEPS.length - 1 ? 'DONE ✓' : 'NEXT ›'}
              tint="gold"
              height={48}
              fontSize={13}
              onPress={() =>
                step === STEPS.length - 1 ? navigation.goBack() : goTo(Math.min(STEPS.length - 1, step + 1))
              }
            />
          </View>
        </View>
      </ScrollView>

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

  // 15 steps now — dots sized so the full row + the Playground link still fit.
  dotsRow: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 16, paddingBottom: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#2c2c33' },
  dotActive: { backgroundColor: colors.amber, width: 15 },
  dotDone: { backgroundColor: 'rgba(255,198,77,.45)' },
  playgroundLink: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.2, color: '#5bff85' },

  scroll: { padding: 16, paddingBottom: 30, gap: 12 },
  tag: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 1.6, color: colors.amber },
  stepTitle: { fontFamily: fonts.oswaldMedium, fontSize: 22, letterSpacing: 0.6, color: colors.textPrimary },
  body: { fontFamily: fonts.barlowRegular, fontSize: 14.5, lineHeight: 21, color: colors.textSecondary },

  panelCard: {
    gap: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    padding: 12,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  winLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 9.5, letterSpacing: 1.1, color: colors.textSub },

  pressureLegend: { gap: 2 },
  legendPlus: { fontFamily: fonts.barlowMedium, fontSize: 12, color: colors.amber },
  legendZero: { fontFamily: fonts.barlowMedium, fontSize: 12, color: colors.textSub },
  legendMinus: { fontFamily: fonts.barlowMedium, fontSize: 12, color: '#6fa8ff' },

  comingHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.4, color: colors.textSecondary },
  comingRow: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 19, color: colors.textSub },

  navRow: { flexDirection: 'row', gap: 10, marginTop: 4 },

  // Modules 5–14 additions
  caption: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
  btnRow: { flexDirection: 'row', gap: 10 },
  analyticBadge: { fontFamily: fonts.oswaldSemiBold, fontSize: 9, letterSpacing: 1, lineHeight: 13, color: colors.textSub },
  sliderReadoutBig: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, letterSpacing: 0.6, color: colors.amber },

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
  toolBlurb: { fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16, color: colors.textSub },
  toolArrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 22, color: colors.textSub },
});
