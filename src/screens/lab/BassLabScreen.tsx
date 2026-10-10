/**
 * BassLabScreen — EXPANSION lab "Bass Guitar" (owner request 2026-07-26) on the
 * shared LabShell. A 4-string fretted electric bass makes string physics
 * tangible: string division ↔︎ fractions ↔︎ intervals ↔︎ the harmonic series.
 *
 * LAYOUT v3 — RACK UNIT (APE_LAB_UX_PROPOSAL 2026-08-23, owner-approved): the
 * fretboard pins on the stage glass (size L — the board IS the lab) with the
 * NOTE / FREQ / INTERVAL / LENGTH-or-NODE readouts on its bezel; the dock
 * carries MODE + STRING trays and the FRET (or NODE) fader; only the teaching
 * prose scrolls in the well. PLAY/STOP stays the compact HeaderPlayButton.
 * The fretboard is TAP-only and its tap SELECTS a string+fret/node — so the
 * glass tap is selection, not the play/stop toggle other rack labs use.
 *
 * TWO MODES:
 *  • FRETTED — tap a string+fret on the fretboard: fret n leaves 2^(−n/12) of
 *    the string vibrating and multiplies the pitch by 2^(n/12). The special
 *    fractions are the lesson: 12th fret = ½ = octave (2:1), 7th ≈ ⅔ = perfect
 *    fifth (3:2), 5th ≈ ¾ = perfect fourth (4:3).
 *  • HARMONICS — touch a node point (½ · ⅓ · ¼ · ⅕): only the modes with a node
 *    there survive, so you hear harmonic n = n × the open-string frequency. The
 *    standing-wave lobes are drawn with the nodes marked.
 *
 * The fretboard is drawn at TRUE geometry (nut → bridge): frets crowd toward
 * the bridge because each semitone is the same RATIO — itself part of the
 * lesson. The drawing is deterministic math, no measurement claims.
 *
 * AUDIO (honest, real — owner 2026-09-25): PLAY streams the RECORDING of the
 * selected note from the lab-audio bucket — 52 chromatic notes (four strings
 * × frets 0–12) and 16 natural harmonics (four strings × ½ ⅓ ¼ ⅕) of a real
 * bass (features/lab/bassSamples.ts). The additive string model (harmonic
 * amps ≈ 1/n; a v2 engine gives a sine) is the FALLBACK when a recording
 * cannot be fetched, and the screen says which is sounding. Low bass
 * fundamentals sit under the speaker high-pass — the advisory says so and the
 * shared speaker guard applies (audio == display honesty).
 */
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import Svg, { Circle, Defs, G, LinearGradient, Line, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { ApeDsp, AUDIO_UNAVAILABLE_MESSAGE, GEN_MODES, type GenParams } from '../../../modules/ape-dsp';
import { useAudioOutputGate } from '../../features/audio/AudioOutputGate';
import { noteAudioActivity, useAudioOutputEnabled } from '../../features/audio/audioOutputStore';
import { startFenced } from '../../features/audio/startFenced';
import { guardAdditiveForEngine, speakerGuardDb, SPEAKER_HPF_HZ } from '../../features/audio/speakerSafety';
import { GuidedLessonSheet, getLabLesson } from '../../features/lab/guidedLessons';
import { CheckQuestion } from './foundations/bits';
import { EngineGate } from '../tools/EngineGate';
import type { EngineState } from '../../features/tools/engine/useDspEngine';
import { colors, fonts } from '../../theme/tokens';
import { LabShell, HeaderPlayButton } from './LabShell';
import { useStageTextScale } from './rack/stageAspect';
import { useStopOnAudioMute } from '../../features/audio/useStopOnAudioMute';
import { useStopWhenSilenced } from '../../features/audio/useStopWhenSilenced';
import { useLabAudio } from '../../features/lab/useLabAudio';
import { PRELOAD_MAX, URL_REUSE_MS } from '../../features/lab/LabAudioPlayer';
import { gridPreloadOrder } from '../../features/lab/labPreloadPlan';
import { labProbe } from '../../features/lab/labProbe';
import { BASS_LAB_KEY, frettedSampleKey, harmonicSampleKey, type BassString } from '../../features/lab/bassSamples';
import { useStopOnClose } from '../../features/audio/useStopOnBlur';

const GEN_LEVEL_DB = -20;
const ACTIVITY_MS = 500;
const SPEED_OF_SOUND = 343; // m/s at ~20 °C (air-wavelength readout)

/** Standard bass tuning, low→high (MIDI 28/33/38/43, A440). */
const STRINGS = [
  { key: 'E', label: 'E', midi: 28, hz: 41.203 },
  { key: 'A', label: 'A', midi: 33, hz: 55.0 },
  { key: 'D', label: 'D', midi: 38, hz: 73.416 },
  { key: 'G', label: 'G', midi: 43, hz: 97.999 },
] as const;

const NOTE_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'] as const;
const INTERVALS = [
  'UNISON', 'MINOR 2ND', 'MAJOR 2ND', 'MINOR 3RD', 'MAJOR 3RD', 'PERFECT 4TH', 'TRITONE',
  'PERFECT 5TH', 'MINOR 6TH', 'MAJOR 6TH', 'MINOR 7TH', 'MAJOR 7TH', 'OCTAVE',
] as const;

/** Natural-harmonic node choices: touch at 1/n of the string. */
const NODES = [
  { n: 2, frac: '½', interval: 'OCTAVE (2:1)' },
  { n: 3, frac: '⅓', interval: 'OCTAVE + 5TH (3:1)' },
  { n: 4, frac: '¼', interval: '2 OCTAVES (4:1)' },
  { n: 5, frac: '⅕', interval: '2 OCT + MAJ 3RD (5:1)' },
] as const;

/** The teaching fractions at special frets (equal temper ≈ the just fraction). */
const FRET_FRACTIONS: Record<number, { frac: string; ratio: string }> = {
  5: { frac: '≈ 3/4', ratio: '4:3' },
  7: { frac: '≈ 2/3', ratio: '3:2' },
  12: { frac: '1/2', ratio: '2:1' },
};

const NUM_FRETS = 12;
/** Fret n's distance from the nut, as a fraction of full string length L. */
const fretPos = (n: number) => 1 - Math.pow(2, -n / 12);

const midiName = (m: number) => `${NOTE_NAMES[m % 12]}${Math.floor(m / 12) - 1}`;

const INTRO =
  'A vibrating string turns fractions into music. Fret the string and the vibrating length ' +
  'shrinks by an exact ratio — halve it and the pitch jumps an octave. Touch a node instead ' +
  'and the string rings a natural harmonic. The simple fractions of a string ARE the ' +
  'consonant intervals.';

type Mode = 'fretted' | 'harmonics';

export function BassLabScreen() {
  const { requestAudioOutput } = useAudioOutputGate();

  const [gate] = useState<EngineState>(() => {
    if (!ApeDsp.isAvailable()) return 'absent';
    return ApeDsp.engineVersion() >= 2 ? 'idle' : 'spike';
  });
  const engineReady = gate === 'idle';
  const additiveReady = engineReady && ApeDsp.engineVersion() >= 3;

  const [mode, setMode] = useState<Mode>('fretted');
  const [stringIdx, setStringIdx] = useState(0); // E
  const [fret, setFret] = useState(0); // open
  const [nodeIdx, setNodeIdx] = useState(0); // ½
  const [running, setRunning] = useState(false);
  // TEMP (owner 2026-09-29): ▶ shows "…" while a start is in flight, so a
  // tap that was accepted but never finished is visible on the button.
  const [starting, setStarting] = useState(false);
  // Something else can silence this lab — backgrounding, shake-to-mute, the
  // idle auto-mute. Without this the transport stayed lit over silence.
  useStopOnAudioMute(setRunning);

  const [genError, setGenError] = useState('');
  // ---- The real recordings (owner 2026-09-25) --------------------------------
  // PLAY streams the RECORDED note for the selection — 52 chromatic notes and
  // 16 natural harmonics of a real bass, published in the lab-audio bucket
  // (features/lab/bassSamples.ts). The string-model generator below is now
  // the FALLBACK, used only when the recording cannot be fetched, and the
  // lab says so on screen. `source` is what is sounding right now.
  const sample = useLabAudio();
  // ⛔ THE BASS ▶ BUG (owner's iPhone, 2026-09-27 → 09-29): `sample` is a NEW
  // object every render, and stopNote depended on it — so every render made a
  // new stopNote, the useFocusEffect below re-ran, and its CLEANUP called
  // stopNote(): genRef++ and sample.stop(). Tapping ▶ re-renders (pending,
  // loading), so each start was cancelled by its own re-render — the clip
  // was fetched (server logs: 200) and then silently abandoned. Depend on the
  // STABLE callbacks only.
  const samplePlay = sample.play;
  const sampleStop = sample.stop;
  const [source, setSource] = useState<'recording' | 'model' | null>(null);
  const [sampleNote, setSampleNote] = useState('');

  const [lessonKey, setLessonKey] = useState<string | undefined>(undefined);
  const [lessonOpen, setLessonOpen] = useState(false);
  const openLesson = useCallback((key?: string) => {
    setLessonKey(key);
    setLessonOpen(true);
  }, []);

  const str = STRINGS[stringIdx];
  const node = NODES[nodeIdx];

  // ---- The sounding pitch for the current selection --------------------------
  const soundHz = mode === 'fretted' ? str.hz * Math.pow(2, fret / 12) : str.hz * node.n;
  const soundMidi =
    mode === 'fretted' ? str.midi + fret : str.midi + Math.round(12 * Math.log2(node.n));
  const vibFrac = mode === 'fretted' ? Math.pow(2, -fret / 12) : 1; // harmonics ring the full string

  // ---- Audio (v3 additive pluck / single harmonic; v2 sine fallback) ---------
  const genRef = useRef(0);
  /** The start that last called genStart (the model fallback) — see the
   *  superseded branch in startNoteInner. */
  const modelGenRef = useRef(0);

  /** Additive payload for the selection: FRETTED = idealized pluck (amps 1/n at
   *  the fretted fundamental) · HARMONICS = the single exact harmonic n of the
   *  OPEN string. [f0, a1..a12, p1..p12], speaker-guarded. */
  const payload = useCallback((): number[] => {
    const amps = new Array(12).fill(0);
    if (mode === 'fretted') {
      for (let n = 1; n <= 12; n++) amps[n - 1] = 1 / n; // plucked-string model
      return guardAdditiveForEngine([soundHz, ...amps, ...new Array(12).fill(0)]);
    }
    amps[node.n - 1] = 1;
    return guardAdditiveForEngine([str.hz, ...amps, ...new Array(12).fill(0)]);
  }, [mode, soundHz, node, str]);

  const genParams = useCallback(
    (): GenParams =>
      additiveReady
        ? { mode: GEN_MODES.additive, additive: payload(), levelDb: GEN_LEVEL_DB }
        : { mode: GEN_MODES.sine, frequency: soundHz, levelDb: GEN_LEVEL_DB },
    [additiveReady, payload, soundHz],
  );

  const sampleKey =
    mode === 'fretted'
      ? frettedSampleKey(str.key.toLowerCase() as BassString, fret)
      : harmonicSampleKey(str.key.toLowerCase() as BassString, node.n);

  const startNote = useCallback(async () => {
    setStarting(true);
    try {
      await startNoteInner();
    } catch (e) {
      labProbe(`start THREW ${(e as Error)?.message ?? e}`); // TEMP probe
    } finally {
      setStarting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestAudioOutput, genParams, samplePlay, sampleKey, engineReady]);

  const startNoteInner = async () => {
    const gen = ++genRef.current;
    setGenError('');
    // 1. The recording. play() runs the audio-output gate itself.
    labProbe(`▶ tap ${sampleKey ?? 'no key'}`); // TEMP probe
    if (sampleKey) {
      let r: Awaited<ReturnType<typeof sample.play>>;
      try {
        r = await samplePlay(BASS_LAB_KEY, sampleKey);
      } catch (e) {
        labProbe(`play THREW ${(e as Error)?.message ?? e}`); // TEMP probe
        return;
      }
      labProbe(`play → ${r}`); // TEMP probe
      if (gen !== genRef.current) return;
      if (r === 'blocked') return;
      if (r === 'ok') {
        void ApeDsp.genStop(); // never both at once
        setSource('recording');
        setSampleNote('');
        setRunning(true);
        noteAudioActivity();
        // A string / fret / node picked while the recording was being fetched
        // skipped its re-pluck (retune: running was still false), so the OLD
        // note rang under the new selection (bug hunt 2026-09-30 pass 2, the
        // Fx/FM pass-1 fix). Pluck the newest one.
        if (latestRef.current.sampleKey !== sampleKey) void latestRef.current.startNote();
        return;
      }
      setSampleNote(
        r === 'network'
          ? 'The recording could not be fetched (check the connection) — playing the string model instead.'
          : r === 'auth'
            ? 'This recording needs a signed-in account — playing the string model instead.'
            : 'No recording is published for this note — playing the string model instead.',
      );
    }
    // 2. Fallback: the string model through the engine.
    if (!engineReady) {
      setGenError(AUDIO_UNAVAILABLE_MESSAGE);
      return;
    }
    const ok = await requestAudioOutput();
    if (!ok || gen !== genRef.current) return;
    setSource('model');
    ApeDsp.genSet(genParams());
    modelGenRef.current = gen;
    try {
      // The fence (startFenced): a mute, a stop, or a stop-all that lands
      // while the native start is in flight wins — this start never sounds on.
      const fenced = await startFenced({
        start: () => ApeDsp.genStart(),
        // Superseded: stop the generator only if no NEWER start has started
        // it since (bug hunt 2026-09-30 day): a double tap on ▶ in the model
        // fallback used to have start #1 resolve late and stop start #2's
        // tone, leaving ■ lit over silence. A ■, a close or a recording that
        // took over still stop it — none of them start the generator.
        stop: (_s, why) => (why === 'superseded' && modelGenRef.current !== gen ? undefined : ApeDsp.genStop()),
        isCurrent: () => gen === genRef.current,
      });
      if (fenced.status !== 'started') return;
      // Same for the model: a selection changed during the native start is
      // sent now (see the recording branch above).
      if (latestRef.current.genParams !== genParams) ApeDsp.genSet(latestRef.current.genParams());
      setRunning(true);
      noteAudioActivity();
    } catch (e) {
      if (gen === genRef.current) setGenError(AUDIO_UNAVAILABLE_MESSAGE);
    }
  };

  /** The newest render's selection, read after a start's awaits. */
  const latestRef = useRef({ sampleKey, genParams, startNote });
  latestRef.current = { sampleKey, genParams, startNote };

  const stopNote = useCallback(() => {
    genRef.current++;
    sampleStop();
    void ApeDsp.genStop();
    setRunning(false);
    setSource(null);
  }, [sampleStop]);
  // STAYS ACTIVE (owner 2026-09-29: "I switched strings and it muted — it
  // should stay active"). ▶ arms the lab: the transport stays ■ after a
  // recording (a ~2.5 s one-shot) rings out, and every string / fret / node
  // change plays the new note until ■ is pressed. It used to drop back to ▶
  // when the clip ended, so the next change was silent.
  //
  // TIGHTER RESPONSE (same note): while armed, the notes a learner is likely
  // to pick next — frets ±2 on this string and this fret on the other
  // strings (or every node here and this node on the other strings) — load in
  // the background, so a change plays from memory instead of waiting on the
  // network.
  //
  // MORE, AND SOONER (owner 2026-09-29, later: "load in audio clip starts (as
  // many as possible with still good function) in each screen"). Loading now
  // starts once sound output is ON — armed or not — in gridPreloadOrder: the
  // current note, the whole current string, this fret on every string, then
  // the rest nearest-first, capped at PRELOAD_MAX (the pool's budget, see
  // LabAudioPlayer). Nothing plays. Only while this screen is in front, so a
  // lab left sounding under another screen does not keep fetching. Signed
  // URLs age out after URL_REUSE_MS, so while ARMED the nearest few are
  // re-loaded just before that — the next change still plays from memory.
  const samplePreload = sample.preload;
  const outputOn = useAudioOutputEnabled();
  const focused = useIsFocused();
  const [refreshTick, setRefreshTick] = useState(0);
  useEffect(() => {
    if (!running || !outputOn || !focused) return;
    const id = setInterval(() => setRefreshTick((t) => t + 1), URL_REUSE_MS - 10_000);
    return () => clearInterval(id);
  }, [running, outputOn, focused]);
  const lastTickRef = useRef(0);
  useEffect(() => {
    if (!outputOn || !focused) return;
    // A refresh re-loads only the nearest 8 (fewer lab-audio calls); a change
    // or an open plans the full budget.
    const refresh = refreshTick !== lastTickRef.current;
    lastTickRef.current = refreshTick;
    const fretted = mode === 'fretted';
    const cols = fretted ? NUM_FRETS + 1 : NODES.length;
    const col = fretted ? fret : nodeIdx;
    const plan = gridPreloadOrder(STRINGS.length, cols, stringIdx, col, refresh ? 8 : PRELOAD_MAX);
    const keys = plan.map(([r, c]) => {
      const s = STRINGS[r].key.toLowerCase() as BassString;
      return fretted ? frettedSampleKey(s, c) : (harmonicSampleKey(s, NODES[c].n) ?? '');
    });
    samplePreload(BASS_LAB_KEY, keys.filter(Boolean));
  }, [outputOn, focused, mode, stringIdx, fret, nodeIdx, refreshTick, samplePreload]);
  // Shake-to-mute (and the idle/background lock) silences the voices from
  // outside this screen; without this the transport would keep saying it is
  // playing. See useStopWhenSilenced.
  useStopWhenSilenced(running, stopNote);

  useStopOnClose(stopNote); // on CLOSE, not blur - keeps playing under other screens (owner 2026-09-29, useStopOnBlur.ts)
  useEffect(() => {
    if (!running) return;
    const id = setInterval(noteAudioActivity, ACTIVITY_MS);
    return () => clearInterval(id);
  }, [running]);

  // Selection changes while sounding: a recording re-plucks the new note; the
  // model retunes in place (phase-continuous resend).
  const retune = useCallback(() => {
    if (!running) return;
    if (source === 'recording') {
      void startNote();
      return;
    }
    ApeDsp.genSet(genParams());
    noteAudioActivity();
  }, [running, source, startNote, genParams]);
  useEffect(retune, [mode, stringIdx, fret, nodeIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Readouts (bezel cells + well detail) ----------------------------------
  const fracInfo = mode === 'fretted' ? FRET_FRACTIONS[fret] : null;
  const airWavelen = SPEED_OF_SOUND / soundHz;

  // ── RACK UNIT (APE_LAB_UX_PROPOSAL 2026-08-23, owner-approved) ────────────
  // The fretboard + its readouts pin on the stage/bezel; MODE and STRING are
  // STICKY trays (A/B while the wave redraws + retunes); the FRET (fretted) or
  // NODE (harmonics) fader is the pre-bound lane. Only the prose scrolls.
  return (
    <LabShell
      labId="bass"
      title="BASS GUITAR LAB"
      subtitle="Strings · Frets · Harmonics · Intervals"
      intro={INTRO}
      exploreCaption="Tap the fretboard (or ride the fader) to choose a note — then read the fraction, watch the standing wave, and play it."
      headerAction={
        <HeaderPlayButton
          playing={running}
          pending={starting && !running}
          // The recordings need no engine; only the fallback does. While the
          // signed URL is being fetched a second tap is ignored, not queued.
          // …but ■ is never disabled (bug hunt 2026-09-29): a re-pluck while
          // sounding sets `loading` too, and a stalled fetch left STOP dead.
          disabled={sample.loading && !running}
          onPress={() => (running ? stopNote() : void startNote())}
          label={running ? 'Stop' : `Play ${midiName(soundMidi)}, ${soundHz.toFixed(1)} hertz`}
        />
      }
      rack={{
        initialParam: 'fret',
        onHelp: openLesson,
        stage: {
          size: 'L', // the fretboard IS the lab — earns the tall glass
          fullScreen: true, // the rack's ⤢ FULL SCREEN (full-screen build 2026-09-30)
          badge: 'TRUE FRET GEOMETRY — BRIDGE ← NUT · DRAWN FROM THE EQUATIONS',
          onGuide: () => openLesson('display'),
          bezel:
            mode === 'fretted'
              ? [
                  { k: 'NOTE', v: midiName(soundMidi), helpKey: 'fret' },
                  { k: 'FREQ', v: `${soundHz.toFixed(1)} Hz`, helpKey: 'display' },
                  { k: 'INTERVAL', v: INTERVALS[fret], flex: 1.6, helpKey: 'fret' },
                  { k: 'LENGTH', v: `${(vibFrac * 100).toFixed(0)}%`, helpKey: 'fret' },
                ]
              : [
                  { k: 'NOTE', v: node.n === 5 ? `≈${midiName(soundMidi)} −14¢` : midiName(soundMidi), helpKey: 'harmonic_node' },
                  { k: 'FREQ', v: `${soundHz.toFixed(1)} Hz`, helpKey: 'display' },
                  { k: 'INTERVAL', v: node.interval, flex: 1.8, helpKey: 'harmonic_node' },
                  { k: 'NODE', v: `${node.frac} · H${node.n}`, tint: NODE_GREEN, helpKey: 'harmonic_node' },
                ],
          // The board's tap is SELECTION (string + fret/node) — play/stop stays
          // on the header ▶, so no play toggle wraps this glass.
          render: (w, h) => (
            <Fretboard
              mode={mode}
              stringIdx={stringIdx}
              fret={fret}
              harmonicN={node.n}
              width={w}
              height={h}
              onPick={(si, n) => {
                setStringIdx(si);
                if (mode === 'fretted') setFret(n);
                else setNodeIdx(Math.max(0, NODES.findIndex((nd) => nd.n === n)));
              }}
            />
          ),
        },
        params: [
          {
            kind: 'options',
            id: 'mode',
            label: 'MODE',
            valueLabel: mode === 'fretted' ? 'FRETTED' : 'HARM',
            options: [
              { id: 'fretted', label: 'FRETTED', blurb: 'Press behind a fret to SHORTEN the string: the whole series shifts up together — a new fundamental, normal notes.', onLongPress: () => openLesson('fret') },
              { id: 'harmonics', label: 'NATURAL HARMONICS', blurb: 'Touch a node lightly and the OPEN string keeps its length but only vibrates in parts — the chimey overtones, no fundamental.', onLongPress: () => openLesson('harmonic_node') },
            ],
            selectedId: mode,
            onSelect: (id) => setMode(id as Mode),
            sticky: true, // A/B fretting vs node-touching on the same string
            helpKey: mode === 'fretted' ? 'fret' : 'harmonic_node',
          },
          {
            kind: 'options',
            id: 'string',
            label: 'STRING',
            valueLabel: str.label,
            options: STRINGS.map((s) => ({ id: s.key, label: `${s.label} · ${s.hz.toFixed(0)} Hz` })),
            selectedId: str.key,
            onSelect: (id) => {
              const i = STRINGS.findIndex((s) => s.key === id);
              if (i >= 0) setStringIdx(i);
            },
            sticky: true, // hop strings while the wave redraws + retunes
            helpKey: 'string',
          },
          mode === 'fretted'
            ? {
                kind: 'fader',
                id: 'fret',
                label: 'FRET',
                // 13 detents (open + 12): sweeping the lane IS the lesson —
                // watch the vibrating length shrink by the same RATIO each step.
                value: fret / NUM_FRETS,
                onChange: (v) => setFret(Math.min(NUM_FRETS, Math.max(0, Math.round(v * NUM_FRETS)))),
                format: () => (fret === 0 ? 'OPEN' : `FRET ${fret} of ${NUM_FRETS}`),
                formatShort: () => (fret === 0 ? 'OPEN' : `${fret}/${NUM_FRETS}`),
                helpKey: 'fret',
              }
            : {
                kind: 'fader',
                id: 'node',
                label: 'NODE',
                // 4 detents (½ ⅓ ¼ ⅕) — step through the touch fractions.
                value: nodeIdx / (NODES.length - 1),
                onChange: (v) =>
                  setNodeIdx(Math.min(NODES.length - 1, Math.max(0, Math.round(v * (NODES.length - 1))))),
                format: () => `${node.frac} · H${node.n}`,
                formatShort: () => `${node.frac} H${node.n}`,
                tint: NODE_GREEN, // matches the node markers on the board
                helpKey: 'harmonic_node',
              },
        ],
      }}
    >
      {/* The engine gate only matters once a recording has failed and the
          model is what would have to play. */}
      {!engineReady && sampleNote ? <EngineGate state={gate} /> : null}

      <View style={{ gap: 6 }}>
        <Text style={styles.sectionHead}>WHAT YOU’RE SEEING</Text>
        <Text style={styles.caption}>
          {mode === 'fretted'
            ? 'Frets crowd toward the bridge because each semitone is the same RATIO (2^(1/12)) — equal ratios, shrinking spacings. The wave is drawn on the vibrating length (fret → bridge).'
            : `Touching at ${node.frac} damps every mode WITHOUT a node there — harmonic ${node.n} (and its multiples) survive. Nodes are marked; the string rings over its FULL length.`}
        </Text>
      </View>

      <View style={{ gap: 6 }}>
        <Text style={styles.sectionHead}>THE EXACT NUMBERS</Text>
        {/* Fraction · interval · wavelength — the richer readout lines behind
            the bezel cells (NOTE/FREQ/INTERVAL live up there). */}
        <Text style={styles.badge}>READOUT — EXACT VALUES FROM THE STRING MODEL</Text>
        {mode === 'fretted' ? (
          <Text style={styles.readRow}>
            Vibrating length: {(vibFrac * 100).toFixed(1)}% of the string
            {fracInfo ? `  (${fracInfo.frac} → ratio ${fracInfo.ratio})` : ''} — {INTERVALS[fret]} above the open
            string ({fret} semitone{fret === 1 ? '' : 's'}).
          </Text>
        ) : (
          <Text style={styles.readRow}>
            {node.n} × {str.hz.toFixed(1)} Hz — {node.interval} above the open string.
          </Text>
        )}
        <Text style={styles.readRow}>
          {mode === 'fretted'
            ? 'String wave: λ = 2 × vibrating length (one lobe over fret → bridge).'
            : `String wave: λ = 2 × full length ÷ ${node.n} (harmonic ${node.n} rings in ${node.n} lobes over the whole string).`}
          {' '}Sound wave in air: λ = {SPEED_OF_SOUND}/{soundHz.toFixed(0)} ≈ {airWavelen.toFixed(2)} m
        </Text>
      </View>

      <View style={{ gap: 6 }}>
        <Text style={styles.sectionHead}>THE NOTE, AS SOUND</Text>
        {/* PLAY lives in the header (▶) — a REAL bass recording of the
            selected note (owner 2026-09-25); the string model is only the
            fallback when the recording cannot be fetched. Honest captions. */}
        <Text style={styles.caption}>
          {mode === 'fretted'
            ? `PLAY (header ▶) — a recording of a real bass: the ${str.label} string ${fret === 0 ? 'open' : `at fret ${fret}`} (${midiName(soundMidi)}). Pick another note while it rings and the new one plays.`
            : `PLAY (header ▶) — a recording of a real bass: the natural harmonic at ${node.frac} of the open ${str.label} string (H${node.n}). Pick another node while it rings and the new one plays.`}
        </Text>
        {sampleNote ? (
          <Text style={styles.advisory}>
            {sampleNote}
            {engineReady
              ? additiveReady
                ? mode === 'fretted'
                  ? ` The model is an idealized plucked string, harmonic amplitudes ≈ 1/n, output ${GEN_LEVEL_DB} dBFS · uncalibrated.`
                  : ` The model is the single exact harmonic ${node.n} of the open ${str.label} string, output ${GEN_LEVEL_DB} dBFS · uncalibrated.`
                : ' This dev build predates the v3 additive engine — the model is a pure sine at the target pitch.'
              : ''}
          </Text>
        ) : null}
        {soundHz < SPEAKER_HPF_HZ ? (
          <Text style={styles.advisory}>
            {`Speaker high-pass (${SPEAKER_HPF_HZ} Hz): a ${soundHz.toFixed(0)} Hz fundamental is attenuated ${speakerGuardDb(soundHz).toFixed(1)} dB on the phone speaker — you mostly hear its harmonics. Use headphones for the true low end.`}
          </Text>
        ) : null}
        {genError ? <Text style={styles.error}>{genError}</Text> : null}
      </View>

{/* Retrieval (learning pass 2026-08-31) — NEW COPY, owner review. */}
      <CheckQuestion
        spec={{
          question: 'Fretting at the 7th fret and touching the node at 1/3 both raise the pitch. What\u2019s the difference?',
          options: [
            'Fretting SHORTENS the string (new fundamental); the harmonic keeps full length but forces 3 lobes',
            'Nothing — both make the same note the same way',
            'The harmonic is just quieter',
          ],
          correctIdx: 0,
          reveal:
            'The fret moves the nut: a shorter string with its own full harmonic series. The node touch keeps the whole string ringing but kills every mode WITHOUT a node there — only H3, H6, H9 survive. Same pitch class, different physics, different tone.',
          wrongHint: 'Switch MODE and watch the lobes: 1 big lobe vs 3 equal ones.',
        }}
      />
      <CheckQuestion
        spec={{
          question: 'The 5th harmonic\u2019s bezel reads \u2248G\u26AF3 \u221214\u00A2. Why the \u2248?',
          options: [
            '5 \u00D7 the fundamental lands 14 cents flat of the equal-tempered note',
            'The string is out of tune',
            'The display rounds badly',
          ],
          correctIdx: 0,
          reveal:
            'Harmonics are EXACT integer multiples — it is the piano\u2019s equal-tempered grid that bends notes to fit 12 keys. H5 (a pure major third) sits 14\u00A2 flat of the tempered third: the string is honest, the keyboard compromises.',
          wrongHint: 'Compare 5 \u00D7 41.2 = 206.0 Hz with the tempered G\u26AF3 at 207.65 Hz.',
        }}
      />

      <GuidedLessonSheet
        visible={lessonOpen}
        lesson={getLabLesson('bass')}
        controlKey={lessonKey}
        onClose={() => setLessonOpen(false)}
      />
    </LabShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

const STRING_GAP = 34;
const LABELS_H = 20; // NUT / fractions / BRIDGE label strip under the board
/** String rows drawn TAB-style: G on top … E on the bottom. */
const ROW_TO_STRING = [3, 2, 1, 0] as const;

// Instrument look behind the strings — an ELECTRIC bass, as the lab says
// (art pass 2026-10-10; it was an acoustic body with a sound hole, rosette and
// bridge pins, which no electric bass has). Drawn to a 34" (864 mm) scale on
// the board's own nut → bridge width: a rosewood fingerboard as wide as the
// fret wire, its frets running on past 12 to the 20th (the lesson's frets
// 0–12 stay the bright, tappable ones), the neck entering the body at the
// 20th fret; a three-tone sunburst body with its two horns; a three-ply
// pickguard; the split-coil pickup centred ≈ 165 mm from the saddles (the
// low-string half toward the neck, two pole pieces per string); and a bent-
// steel bridge plate with four barrel saddles. The strings are drawn evenly
// spaced (parallel rows to tap) — the one simplification of a real neck taper.
// Geometry (fret positions, string rows, tap mapping) is unchanged.
const GRAIN = '#1f1206'; // wood-grain streak lines over the fingerboard
const FRET_BASE = '#4b4b53'; // fret wire body (dark nickel)
const FRET_SPEC = '#d8d8e0'; // fret wire specular highlight
const STRING_STEEL = '#8d8d99';
const STRING_SPEC = '#eceef4';
const STRING_SEL = '#e6b84e'; // selected string — amber-tinted steel
const NODE_GREEN = '#5bff85'; // harmonic node markers — shared with the NODE fader/bezel tint
// Static pseudo-random grain rows (fractions of the fingerboard height).
const GRAIN_ROWS = [0.12, 0.27, 0.41, 0.57, 0.72, 0.88] as const;
/** 34" bass scale, mm — the board's full nut → bridge width. */
const SCALE_MM = 864;
/** The neck enters the body at the 20th fret (a classic 20-fret bolt-on). */
const NECK_FRETS = 20;

/** The tappable fretboard: 4 strings, frets 0–12 at true positions, fret
 *  markers, and the selected string's standing wave. Tap maps to the nearest
 *  string row + (fretted) nearest fret line / (harmonics) nearest node.
 *  Sized by the RACK STAGE (width/height = the glass's inner size); strings
 *  center vertically in whatever height the stage hands down. */
function Fretboard({
  mode,
  stringIdx,
  fret,
  harmonicN,
  width,
  height,
  onPick,
}: {
  mode: Mode;
  stringIdx: number;
  fret: number;
  harmonicN: number;
  width: number;
  height: number;
  onPick: (stringIdx: number, fretOrNode: number) => void;
}) {
  // FULL SCREEN (2026-09-30, D35 "everything zooms"): the board is authored
  // in GLASS pixels (w, svgH below) and painted through a viewBox of
  // (width ÷ ts) × (pixel height ÷ ts), so the frets, inlays, strings, the
  // standing wave, node markers and the finger dot are all × the step; the
  // NUT / fractions / BRIDGE strip under it (RN text) multiplies its own font.
  // A tap arrives in pixels and is divided back to glass units. ts = 1 on the
  // glass — the glass picture is unchanged.
  const ts = useStageTextScale();
  const w = width / ts;
  const pxSvgH = Math.max(80 * ts, height - LABELS_H * ts);
  const svgH = pxSvgH / ts;
  const stringTop = Math.max(24, Math.round((svgH - 3 * STRING_GAP) / 2));

  const onPress = useCallback(
    (px: number, py: number) => {
      // Web preview: locationX/Y can arrive undefined → NaN row → the whole
      // app unmounted (no root error boundary). Reproduced 2026-08-31.
      if (w <= 0 || !Number.isFinite(px) || !Number.isFinite(py)) return;
      // The board is drawn turned 180° — map the tap back into its frame.
      const x = w - px / ts;
      const y = svgH - py / ts;
      // Row → string (clamped).
      const row = Math.min(3, Math.max(0, Math.round((y - stringTop) / STRING_GAP)));
      const si = ROW_TO_STRING[row] ?? 0;
      const fx = Math.min(1, Math.max(0, x / w));
      if (mode === 'fretted') {
        // Snap to the nearest fret line (0..12).
        let best = 0;
        let bestD = Infinity;
        for (let n = 0; n <= NUM_FRETS; n++) {
          const d = Math.abs(fx - fretPos(n));
          if (d < bestD) {
            bestD = d;
            best = n;
          }
        }
        onPick(si, best);
      } else {
        // Snap to the nearest node fraction 1/n.
        let best: number = NODES[0].n;
        let bestD = Infinity;
        for (const nd of NODES) {
          const d = Math.abs(fx - 1 / nd.n);
          if (d < bestD) {
            bestD = d;
            best = nd.n;
          }
        }
        onPick(si, best);
      }
    },
    [w, ts, stringTop, mode, onPick],
  );

  // Standing wave on the selected string: FRETTED = one lobe over the vibrating
  // length (fret → bridge) · HARMONICS = n lobes over the full string. Same
  // sample math as ever; the 2026-07-29 re-skin ALSO emits the closed envelope
  // (top curve + mirrored bottom curve) for a translucent gradient fill.
  const wave = useMemo(() => {
    if (w <= 0) return { top: '', env: '' };
    const row = ROW_TO_STRING.indexOf(stringIdx as 0 | 1 | 2 | 3);
    const y0 = stringTop + row * STRING_GAP;
    const amp = 12;
    const x0 = mode === 'fretted' ? fretPos(fret) * w : 0;
    const len = w - x0;
    const lobes = mode === 'fretted' ? 1 : harmonicN;
    const N = 120;
    const px: string[] = new Array(N + 1);
    const py: number[] = new Array(N + 1);
    let top = '';
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const x = x0 + t * len;
      const y = y0 - Math.sin(Math.PI * lobes * t) * amp;
      px[i] = x.toFixed(1);
      py[i] = y;
      top += i === 0 ? `M${px[i]} ${y.toFixed(1)}` : `L${px[i]} ${y.toFixed(1)}`;
    }
    let env = top;
    for (let i = N; i >= 0; i--) env += `L${px[i]} ${(2 * y0 - py[i]).toFixed(1)}`;
    return { top, env: `${env}Z` };
  }, [w, stringTop, mode, stringIdx, fret, harmonicN]);

  const selRow = ROW_TO_STRING.indexOf(stringIdx as 0 | 1 | 2 | 3);
  const selY = stringTop + selRow * STRING_GAP;

  // Instrument background geometry: wood neck on the left, blue body + sound
  // hole toward the bridge (right). The hole is centered on the 4 strings so
  // they cross over it ("behind the strings").
  const mm = w / SCALE_MM; // px per millimetre of the real bass
  const fbTop = stringTop - 18; // fingerboard edges = the fret-wire ends
  const fbBot = stringTop + 3 * STRING_GAP + 18;
  const fbEnd = fretPos(NECK_FRETS + 0.55) * w; // end of the fingerboard
  const bodyStart = fretPos(NECK_FRETS) * w; // the neck pocket
  // Horns: the long (bass-side, bottom row = E) horn reaches to ≈ fret 12,
  // the treble-side horn to ≈ fret 16, curving away from the neck edges.
  const hornLow = fretPos(12.4) * w;
  const hornHigh = fretPos(15.6) * w;
  const bodyPath =
    `M${bodyStart} ${fbTop} C${bodyStart - 6} ${fbTop - 6} ${hornHigh + 14} ${fbTop - 10} ${hornHigh} ${Math.max(2, fbTop - 16)} ` +
    `C${hornHigh - 8} ${-4} ${bodyStart + 20} ${-2} ${bodyStart + 40} ${-2} L${w + 2} ${-2} L${w + 2} ${svgH + 2} L${bodyStart + 40} ${svgH + 2} ` +
    `C${bodyStart} ${svgH + 2} ${hornLow - 10} ${svgH + 4} ${hornLow} ${Math.min(svgH - 2, fbBot + 16)} ` +
    `C${hornLow + 12} ${fbBot + 8} ${bodyStart - 6} ${fbBot + 6} ${bodyStart} ${fbBot} Z`;
  // Split-coil pickup, centred 165 mm in front of the saddles.
  const pickupX = w - 165 * mm;
  const coilW = Math.max(5, 21 * mm); // each half's width along the strings
  const halfOffset = Math.max(4, 12 * mm); // E/A half toward the neck, D/G toward the bridge
  // Pickguard: three-ply, from the fingerboard end around the pickup.
  const pgL = fbEnd - 2;
  const pgR = pickupX + halfOffset + coilW / 2 + 26 * mm;
  const pgPath =
    `M${pgL} ${fbTop - 10} C${pgL + 10} ${2} ${pgR - 30} ${4} ${pgR} ${fbTop - 2} ` +
    `C${pgR + 10} ${(fbTop + fbBot) / 2} ${pgR + 4} ${fbBot} ${pgR - 18} ${fbBot + 10} ` +
    `C${pgR - 40} ${svgH - 2} ${pgL + 6} ${svgH - 4} ${pgL} ${fbBot + 12} Z`;

  return (
    <View>
      {w > 0 ? (
        <Pressable
          onPress={(e) => {
            const ne = e.nativeEvent as { locationX?: number; locationY?: number; offsetX?: number; offsetY?: number };
            onPress(ne.locationX ?? ne.offsetX ?? NaN, ne.locationY ?? ne.offsetY ?? NaN);
          }}
          accessibilityRole="button"
          accessibilityLabel="Fretboard — tap a string and fret"
        >
          <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" width={width} height={pxSvgH} viewBox={`0 0 ${w} ${svgH}`}>
            <Defs>
              {/* Wood: vertical walnut gradient (light from upper-left). */}
              <LinearGradient id="fbWood" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#4a3018" />
                <Stop offset="28%" stopColor="#38250f" />
                <Stop offset="55%" stopColor="#452c15" />
                <Stop offset="82%" stopColor="#2f1d0d" />
                <Stop offset="100%" stopColor="#241608" />
              </LinearGradient>
              {/* Body: three-tone sunburst — amber centre, red, dark edge. */}
              <RadialGradient id="fbBody" cx="70%" cy="50%" r="75%">
                <Stop offset="0%" stopColor="#d9973a" />
                <Stop offset="45%" stopColor="#b5671f" />
                <Stop offset="72%" stopColor="#7a2410" />
                <Stop offset="100%" stopColor="#1c0d07" />
              </RadialGradient>
              {/* Chrome: bridge plate and saddles. */}
              <LinearGradient id="fbChrome" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0%" stopColor="#f2f4f8" />
                <Stop offset="50%" stopColor="#9a9ea8" />
                <Stop offset="100%" stopColor="#5a5e68" />
              </LinearGradient>
              <RadialGradient id="fbPearl" cx="35%" cy="30%" r="80%">
                <Stop offset="0%" stopColor="#fdf9ee" />
                <Stop offset="60%" stopColor="#cfc8b8" />
                <Stop offset="100%" stopColor="#a09681" />
              </RadialGradient>
              <RadialGradient id="fbFinger" cx="35%" cy="30%" r="80%">
                <Stop offset="0%" stopColor="#ffe08a" />
                <Stop offset="60%" stopColor="#ffc64d" />
                <Stop offset="100%" stopColor="#e8940f" />
              </RadialGradient>
              <LinearGradient id="fbNut" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0%" stopColor="#efe9da" />
                <Stop offset="100%" stopColor="#b3ab97" />
              </LinearGradient>
              {/* Standing-wave envelope: brightest at the lobe extremes. */}
              <LinearGradient id="fbEnv" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor={colors.amber} stopOpacity={0.3} />
                <Stop offset="50%" stopColor={colors.amber} stopOpacity={0.05} />
                <Stop offset="100%" stopColor={colors.amber} stopOpacity={0.3} />
              </LinearGradient>
            </Defs>
            {/* TURNED 180° (owner 2026-10-10): body on the left, headstock to the right,
                low E on top — a right-handed bass as seen from the front. Drawn in
                the nut→bridge frame below; a turn (not a mirror) keeps it right-handed. */}
            <G transform={`rotate(180 ${w / 2} ${svgH / 2})`}>
            {/* Off the instrument: the dark stage. */}
            <Rect x={0} y={0} width={w} height={svgH} fill="#0d0d10" />
            {/* The body (sunburst, both horns) behind the neck. */}
            <Path d={bodyPath} fill="url(#fbBody)" stroke="#120804" strokeWidth={1.2} />
            {/* Three-ply pickguard: white top, black bevel line. */}
            <Path d={pgPath} fill="#ece7da" stroke="#151515" strokeWidth={1.4} />
            <Path d={pgPath} fill="none" stroke="#ffffff" strokeWidth={0.5} opacity={0.5} />
            {/* Rosewood fingerboard: nut → just past the 20th fret, as wide
                as the fret wire; static grain streaks along it. */}
            <Rect x={0} y={fbTop} width={fbEnd} height={fbBot - fbTop} fill="url(#fbWood)" />
            {GRAIN_ROWS.map((g, i) => {
              const gy = fbTop + g * (fbBot - fbTop);
              return (
                <Path
                  key={`grain${i}`}
                  d={`M0 ${gy.toFixed(1)} Q ${(fbEnd * 0.5).toFixed(1)} ${(gy + (i % 2 === 0 ? -3 : 3)).toFixed(1)} ${fbEnd.toFixed(1)} ${gy.toFixed(1)}`}
                  stroke={GRAIN}
                  strokeWidth={i % 2 === 0 ? 1.2 : 0.7}
                  opacity={0.4}
                  fill="none"
                />
              );
            })}
            <Line x1={0} y1={fbTop + 0.6} x2={fbEnd} y2={fbTop + 0.6} stroke="#ffffff" strokeWidth={0.7} opacity={0.12} />
            {/* The upper frets, 13–20 (the lesson uses 0–12): dimmer wire,
                single dots at 15, 17 and 19. */}
            {Array.from({ length: NECK_FRETS - NUM_FRETS }, (_, i) => {
              const n = NUM_FRETS + 1 + i;
              const x = fretPos(n) * w;
              return <Line key={`uf${n}`} x1={x} y1={fbTop} x2={x} y2={fbBot} stroke={FRET_BASE} strokeWidth={2.2} opacity={0.75} />;
            })}
            {[15, 17, 19].map((n) => (
              <Circle key={`ud${n}`} cx={((fretPos(n - 1) + fretPos(n)) / 2) * w} cy={stringTop + 1.5 * STRING_GAP} r={2.6} fill="url(#fbPearl)" opacity={0.85} />
            ))}
            {/* Split-coil pickup: two black covers, two pole pieces per string. */}
            {[
              { rows: [2, 3], dx: -halfOffset / 2 },
              { rows: [0, 1], dx: halfOffset / 2 },
            ].map((half, hi) => {
              const cx = pickupX + half.dx;
              const yA = stringTop + half.rows[0] * STRING_GAP - STRING_GAP * 0.42;
              const yB = stringTop + half.rows[1] * STRING_GAP + STRING_GAP * 0.42;
              return (
                <Fragment key={`pu${hi}`}>
                  <Rect x={cx - coilW / 2 - 1.5} y={yA - 1.5} width={coilW + 3} height={yB - yA + 3} rx={coilW / 2 + 1.5} fill="#1a1a1e" />
                  <Rect x={cx - coilW / 2} y={yA} width={coilW} height={yB - yA} rx={coilW / 2} fill="#0b0b0d" stroke="#3a3a40" strokeWidth={0.8} />
                  {half.rows.map((row) =>
                    [-1, 1].map((sg) => (
                      <Circle key={`pole${row}${sg}`} cx={cx} cy={stringTop + row * STRING_GAP + sg * STRING_GAP * 0.17} r={Math.max(1.3, coilW * 0.16)} fill="#b9bcc4" stroke="#55585f" strokeWidth={0.5} />
                    )),
                  )}
                </Fragment>
              );
            })}
            {/* Bridge: bent-steel plate under four barrel saddles; each
                string breaks over its saddle crest at the board's right edge. */}
            <Rect x={w - 16 * mm - 4} y={stringTop - STRING_GAP * 0.55} width={16 * mm + 6} height={3 * STRING_GAP + STRING_GAP * 1.1} rx={2} fill="url(#fbChrome)" stroke="#3a3c44" strokeWidth={0.8} />
            {ROW_TO_STRING.map((si, row) => {
              const y = stringTop + row * STRING_GAP;
              const sh = STRING_GAP * 0.38;
              return (
                <Fragment key={`sad${si}`}>
                  <Rect x={w - 7} y={y - sh / 2} width={6} height={sh} rx={2.4} fill="url(#fbChrome)" stroke="#4a4e58" strokeWidth={0.6} />
                  <Circle cx={w - 4} cy={y - sh * 0.32} r={0.9} fill="#2a2c33" />
                  <Circle cx={w - 4} cy={y + sh * 0.32} r={0.9} fill="#2a2c33" />
                </Fragment>
              );
            })}
            {/* Frets: dark nickel wire + specular highlight (0 = bone nut). */}
            {Array.from({ length: NUM_FRETS + 1 }, (_, n) => {
              const x = fretPos(n) * w;
              const y1 = stringTop - 18;
              const y2 = stringTop + 3 * STRING_GAP + 18;
              return n === 0 ? (
                <Rect key={n} x={x} y={y1} width={4.5} height={y2 - y1} fill="url(#fbNut)" />
              ) : (
                <Fragment key={n}>
                  <Line x1={x} y1={y1} x2={x} y2={y2} stroke={FRET_BASE} strokeWidth={3} />
                  <Line x1={x - 0.7} y1={y1} x2={x - 0.7} y2={y2} stroke={FRET_SPEC} strokeWidth={1.1} opacity={0.85} />
                </Fragment>
              );
            })}
            {/* Fret markers (gradient-pearl inlays at 3·5·7·9, double at 12). */}
            {[3, 5, 7, 9, 12].map((n) => {
              const x = ((fretPos(n - 1) + fretPos(n)) / 2) * w;
              const cy = stringTop + 1.5 * STRING_GAP;
              return n === 12 ? (
                <Fragment key={n}>
                  <Circle cx={x} cy={cy - 22} r={4} fill="url(#fbPearl)" />
                  <Circle cx={x} cy={cy + 22} r={4} fill="url(#fbPearl)" />
                </Fragment>
              ) : (
                <Circle key={n} cx={x} cy={cy} r={4} fill="url(#fbPearl)" />
              );
            })}
            {/* Strings (G top … E bottom): gauge grows toward the low E; each
                gets a shadow pass + specular highlight; selection = amber glow. */}
            {ROW_TO_STRING.map((si, row) => {
              const y = stringTop + row * STRING_GAP;
              const sel = si === stringIdx;
              const gauge = 1 + row * 0.8; // E (bottom row) is the heaviest
              return (
                <Fragment key={si}>
                  {sel ? (
                    <Line x1={0} y1={y} x2={w} y2={y} stroke={colors.amber} strokeWidth={gauge + 5} opacity={0.16} />
                  ) : null}
                  <Line x1={0} y1={y + gauge * 0.5} x2={w} y2={y + gauge * 0.5} stroke="#000000" strokeWidth={gauge} opacity={0.35} />
                  <Line x1={0} y1={y} x2={w} y2={y} stroke={sel ? STRING_SEL : STRING_STEEL} strokeWidth={gauge} />
                  <Line
                    x1={0}
                    y1={y - gauge * 0.25}
                    x2={w}
                    y2={y - gauge * 0.25}
                    stroke={STRING_SPEC}
                    strokeWidth={Math.max(0.6, gauge * 0.28)}
                    opacity={sel ? 0.9 : 0.6}
                  />
                </Fragment>
              );
            })}
            {/* FRETTED: dim the dead length (nut → fret) + domed finger dot. */}
            {mode === 'fretted' && fret > 0 ? (
              <>
                <Line x1={0} y1={selY} x2={fretPos(fret) * w} y2={selY} stroke="#1c1c22" strokeWidth={5.5} />
                <Circle cx={fretPos(fret) * w} cy={selY} r={13} fill={colors.amber} opacity={0.18} />
                <Circle cx={fretPos(fret) * w} cy={selY} r={7} fill="url(#fbFinger)" />
                <Circle cx={fretPos(fret) * w - 2.2} cy={selY - 2.2} r={1.8} fill="#ffffff" opacity={0.55} />
              </>
            ) : null}
            {/* The standing wave: translucent gradient ENVELOPE + glow-stroked
                mirrored lobes (same sampled math as before the re-skin). */}
            <Path d={wave.env} fill="url(#fbEnv)" />
            <Path d={wave.top} stroke={colors.amber} strokeWidth={5} fill="none" opacity={0.18} strokeLinecap="round" />
            <Path
              d={wave.top}
              stroke={colors.amber}
              strokeWidth={5}
              fill="none"
              opacity={0.1}
              strokeLinecap="round"
              transform={`translate(0, ${2 * selY}) scale(1, -1)`}
            />
            <Path d={wave.top} stroke={colors.amber} strokeWidth={1.6} fill="none" opacity={0.95} strokeLinecap="round" />
            <Path
              d={wave.top}
              stroke={colors.amber}
              strokeWidth={1.6}
              fill="none"
              opacity={0.5}
              strokeLinecap="round"
              transform={`translate(0, ${2 * selY}) scale(1, -1)`}
            />
            {/* HARMONICS: glowing NODE markers at k/n + faint ANTINODE dots at
                the lobe peaks + the amber touch ring at 1/n. */}
            {mode === 'harmonics'
              ? Array.from({ length: harmonicN - 1 }, (_, k) => {
                  const x = ((k + 1) / harmonicN) * w;
                  return (
                    <Fragment key={k}>
                      <Circle cx={x} cy={selY} r={9} fill={NODE_GREEN} opacity={0.16} />
                      <Circle cx={x} cy={selY} r={4} fill={NODE_GREEN} opacity={0.95} />
                      <Circle cx={x - 1.2} cy={selY - 1.2} r={1.3} fill="#eafff0" opacity={0.9} />
                    </Fragment>
                  );
                })
              : null}
            {mode === 'harmonics'
              ? Array.from({ length: harmonicN }, (_, k) => {
                  const x = ((k + 0.5) / harmonicN) * w;
                  return (
                    <Fragment key={`an${k}`}>
                      <Circle cx={x} cy={selY - 12} r={6} fill={colors.amber} opacity={0.14} />
                      <Circle cx={x} cy={selY - 12} r={2.2} fill={colors.amber} opacity={0.8} />
                    </Fragment>
                  );
                })
              : null}
            {mode === 'harmonics' ? (
              <>
                <Circle cx={(1 / harmonicN) * w} cy={selY} r={7} fill="none" stroke={colors.amber} strokeWidth={6} opacity={0.2} />
                <Circle cx={(1 / harmonicN) * w} cy={selY} r={7} fill="none" stroke={colors.amber} strokeWidth={2} />
              </>
            ) : null}
            </G>
          </Svg>
        </Pressable>
      ) : (
        <View style={{ height: pxSvgH }} />
      )}
      {/* Nut/bridge + fraction labels under the board. */}
      <View style={[styles.fbLabels, ts !== 1 ? { marginTop: 3 * ts, paddingHorizontal: 8 * ts } : null]}>
        <Text style={[styles.fbLabel, ts !== 1 ? { fontSize: 9.5 * ts, letterSpacing: ts } : null]}>BRIDGE</Text>
        {mode === 'fretted' ? (
          <Text style={[styles.fbLabel, ts !== 1 ? { fontSize: 9.5 * ts, letterSpacing: ts } : null]}>5 ≈ ¾ · 7 ≈ ⅔ · 12 = ½</Text>
        ) : (
          <Text style={[styles.fbLabel, ts !== 1 ? { fontSize: 9.5 * ts, letterSpacing: ts } : null]}>nodes at ½ · ⅓ · ¼ · ⅕</Text>
        )}
        <Text style={[styles.fbLabel, ts !== 1 ? { fontSize: 9.5 * ts, letterSpacing: ts } : null]}>NUT</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1.5, color: colors.amber },
  caption: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
  advisory: { fontFamily: fonts.barlowMedium, fontSize: 12, lineHeight: 16, color: colors.amber },
  error: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: '#ff6b5e' },
  badge: { fontFamily: fonts.oswaldSemiBold, fontSize: 9.5, letterSpacing: 1.2, color: colors.textSub },
  readRow: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSecondary },
  // The label strip lives INSIDE the stage glass now — give it side breathing.
  fbLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 3, paddingHorizontal: 8 },
  fbLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 9.5, letterSpacing: 1, color: colors.textSub },
});
