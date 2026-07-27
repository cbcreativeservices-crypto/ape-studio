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
 * MVP scope: Modules 1–4 + the Module-2 three-window centerpiece + a
 * WHAT'S-NEXT step listing Modules 5–14 honestly as in development.
 *
 * VISUALS: Skia (native — clients built before the Skia dependency render the
 * honest VizUnavailableCard; text + audio still work, §1.7). All motion is
 * the slowed CONCEPTUAL model, badged on every panel.
 *
 * AUDIO: one shared sine tone owned by the shell (house idiom: audio-output
 * gate → genSet/genStart → keepalive → stop on step change/blur/unmount),
 * speaker-guarded per frequency. Engine-absent clients read everything and
 * watch everything — only the PLAY buttons gate out.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useIsFocused, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ApeDsp, GEN_MODES } from '../../../../modules/ape-dsp';
import { GlassButton } from '../../../components/GlassButton';
import { useAudioOutputGate } from '../../../features/audio/AudioOutputGate';
import { noteAudioActivity } from '../../../features/audio/audioOutputStore';
import { guardToneLevelForEngine } from '../../../features/audio/speakerSafety';
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
  playing: boolean;
  freq: number;
  levelDb: number;
  play: (freqHz: number, levelDb: number) => void;
  set: (p: { freqHz?: number; levelDb?: number }) => void;
  stop: () => void;
};

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

  const stop = useCallback(() => {
    genRef.current++;
    void ApeDsp.genStop();
    setPlaying(false);
  }, []);

  useFocusEffect(useCallback(() => () => stop(), [stop]));
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(noteAudioActivity, ACTIVITY_MS);
    return () => clearInterval(id);
  }, [playing]);

  return { engineReady, playing, freq, levelDb, play, set, stop };
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

/** WHAT'S NEXT — honest roadmap + the Playground door. */
function NextPanel({ onPlayground }: { onPlayground: () => void }) {
  const coming = [
    '5 · Frequency — which one sounds higher?',
    '6 · Wavelength — low notes occupy real space',
    '7 · Time domain vs space domain',
    '8 · Pitch vs frequency (perception vs measurement)',
    '9 · Loudness vs amplitude',
    '10 · Phase — the first magic trick',
    '11 · Harmonics — sines that build every sound',
    '12 · The Fourier principle',
    '13 · Why we need measurement tools',
    '14 · The full interactive playground',
  ];
  return (
    <View style={styles.panelCard}>
      <Text style={styles.comingHead}>COMING NEXT — IN DEVELOPMENT</Text>
      {coming.map((c) => (
        <Text key={c} style={styles.comingRow}>
          {c}
        </Text>
      ))}
      <Text style={styles.body}>
        The Playground below is already open — every control drives every view at once. And the
        rest of the Audio Learning Lab is one screen back.
      </Text>
      <GlassButton label="OPEN THE PLAYGROUND" tint="green" height={50} fontSize={14} onPress={onPlayground} />
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
  Panel: (p: PanelProps & { onPlayground: () => void }) => React.JSX.Element;
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
    key: 'next',
    tag: 'FOUNDATIONS',
    title: 'WHAT’S NEXT',
    paras: [
      'You now have the mental model: sound is moving air, a speaker makes it, a graph describes it, and amplitude sets how loud.',
      'Modules 5–14 build on exactly this picture — frequency, wavelength, phase, harmonics, and why every measurement tool in this app exists.',
    ],
    Panel: ({ onPlayground }) => <NextPanel onPlayground={onPlayground} />,
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
            <s.Panel viz={viz} width={width} tone={tone} focused={focused} help={help} onPlayground={openPlayground} />
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

  dotsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingBottom: 6 },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#2c2c33' },
  dotActive: { backgroundColor: colors.amber, width: 20 },
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
});
