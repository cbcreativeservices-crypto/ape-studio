/**
 * BassLabScreen — EXPANSION lab "Bass Guitar" (owner request 2026-07-26) on the
 * shared LabShell. A 4-string fretted electric bass makes string physics
 * tangible: string division ↔︎ fractions ↔︎ intervals ↔︎ the harmonic series.
 *
 * LAYOUT v2 (owner 2026-07-29): collapsible READOUTS → DISPLAY → CONTROLS →
 * ACTIONS sections; PLAY/STOP is the compact HeaderPlayButton via LabShell's
 * headerAction; the shell renders the Guided-Lesson entry row itself. The
 * fretboard is TAP-only (no drag), so no InteractionZone is needed.
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
 * AUDIO (honest, real): the pluck is an additive model (harmonic amps ≈ 1/n —
 * an idealized plucked string) through the v3 additive engine; natural
 * harmonics play as the single exact harmonic n of the open string. On a v2
 * engine both fall back to a sine at the target pitch (stated). Low bass
 * fundamentals sit under the speaker high-pass — the advisory says so and the
 * shared speaker guard applies (audio == display honesty).
 */
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Circle, Defs, LinearGradient, Line, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { ApeDsp, GEN_MODES, type GenParams } from '../../../modules/ape-dsp';
import { useAudioOutputGate } from '../../features/audio/AudioOutputGate';
import { noteAudioActivity } from '../../features/audio/audioOutputStore';
import { guardAdditiveForEngine, speakerGuardDb, SPEAKER_HPF_HZ } from '../../features/audio/speakerSafety';
import { GuidedLessonSheet, getLabLesson, DisplayGuideButton } from '../../features/lab/guidedLessons';
import { EngineGate } from '../tools/EngineGate';
import type { EngineState } from '../../features/tools/engine/useDspEngine';
import { colors, fonts } from '../../theme/tokens';
import { LabShell, LabChip, CollapsibleSection, HeaderPlayButton } from './LabShell';

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
  const [genError, setGenError] = useState('');

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

  const startNote = useCallback(async () => {
    const gen = ++genRef.current;
    const ok = await requestAudioOutput();
    if (!ok || gen !== genRef.current) return;
    setGenError('');
    ApeDsp.genSet(genParams());
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
  }, [requestAudioOutput, genParams]);

  const stopNote = useCallback(() => {
    genRef.current++;
    void ApeDsp.genStop();
    setRunning(false);
  }, []);

  useFocusEffect(useCallback(() => () => stopNote(), [stopNote]));
  useEffect(() => {
    if (!running) return;
    const id = setInterval(noteAudioActivity, ACTIVITY_MS);
    return () => clearInterval(id);
  }, [running]);

  // Selection changes retune in place while sounding (phase-continuous resend).
  const retune = useCallback(() => {
    if (!running) return;
    ApeDsp.genSet(genParams());
    noteAudioActivity();
  }, [running, genParams]);
  useEffect(retune, [mode, stringIdx, fret, nodeIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Readouts --------------------------------------------------------------
  const semis = mode === 'fretted' ? fret : null;
  const fracInfo = mode === 'fretted' ? FRET_FRACTIONS[fret] : null;
  const airWavelen = SPEED_OF_SOUND / soundHz;

  return (
    <LabShell
      labId="bass"
      title="BASS GUITAR LAB"
      subtitle="Strings · Frets · Harmonics · Intervals"
      intro={INTRO}
      exploreCaption="Tap the fretboard (or the chips) to choose a note — then read the fraction, watch the standing wave, and play it."
      headerAction={
        <HeaderPlayButton
          playing={running}
          disabled={!engineReady}
          onPress={() => (running ? stopNote() : void startNote())}
          label={running ? 'Stop' : `Play ${soundHz.toFixed(1)} hertz`}
        />
      }
    >
      {!engineReady ? <EngineGate state={gate} /> : null}

      <CollapsibleSection title="READOUTS">
        {/* READOUT — fraction · frequency · note · interval · wavelength. */}
        <Text style={styles.badge}>READOUT — EXACT VALUES FROM THE STRING MODEL</Text>
        {mode === 'fretted' ? (
          <>
            <Text style={styles.readMain}>
              {str.label} string · {fret === 0 ? 'open' : `fret ${fret}`} → {midiName(soundMidi)} ·{' '}
              {soundHz.toFixed(1)} Hz
            </Text>
            <Text style={styles.readRow}>
              Vibrating length: {(vibFrac * 100).toFixed(1)}% of the string
              {fracInfo ? `  (${fracInfo.frac} → ratio ${fracInfo.ratio})` : ''}
            </Text>
            <Text style={styles.readRow}>
              Interval above the open string: {INTERVALS[semis ?? 0]} ({fret} semitone{fret === 1 ? '' : 's'})
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.readMain}>
              {str.label} string · node {node.frac} → harmonic {node.n} = {midiName(soundMidi)} ·{' '}
              {soundHz.toFixed(1)} Hz
            </Text>
            <Text style={styles.readRow}>
              {node.n} × {str.hz.toFixed(1)} Hz — {node.interval} above the open string
            </Text>
          </>
        )}
        <Text style={styles.readRow}>
          String wave: λ = 2 × vibrating length. Sound wave in air: λ = {SPEED_OF_SOUND}/{soundHz.toFixed(0)} ≈{' '}
          {airWavelen.toFixed(2)} m
        </Text>
        <DisplayGuideButton onPress={() => openLesson('display')} />
      </CollapsibleSection>

      <CollapsibleSection title="DISPLAY">
        {/* THE FRETBOARD — true geometry, tappable. */}
        <View style={styles.panelCard}>
          <Text style={styles.badge}>TRUE FRET GEOMETRY — NUT → BRIDGE · DRAWN FROM THE EQUATIONS</Text>
          <Fretboard
            mode={mode}
            stringIdx={stringIdx}
            fret={fret}
            harmonicN={node.n}
            onPick={(si, n) => {
              setStringIdx(si);
              if (mode === 'fretted') setFret(n);
              else setNodeIdx(Math.max(0, NODES.findIndex((nd) => nd.n === n)));
            }}
          />
          <Text style={styles.caption}>
            {mode === 'fretted'
              ? 'Frets crowd toward the bridge because each semitone is the same RATIO (2^(1/12)) — equal ratios, shrinking spacings. The wave is drawn on the vibrating length (fret → bridge).'
              : `Touching at ${node.frac} damps every mode WITHOUT a node there — harmonic ${node.n} (and its multiples) survive. Nodes are marked; the string rings over its FULL length.`}
          </Text>
          <DisplayGuideButton onPress={() => openLesson('display')} />
        </View>
      </CollapsibleSection>

      <CollapsibleSection title="CONTROLS">
        <Text style={styles.sectionHead}>MODE</Text>
        <View style={styles.chipRow}>
          <LabChip
            label="FRETTED"
            selected={mode === 'fretted'}
            onPress={() => setMode('fretted')}
            onLongPress={() => openLesson('fret')}
          />
          <LabChip
            label="NATURAL HARMONICS"
            selected={mode === 'harmonics'}
            onPress={() => setMode('harmonics')}
            onLongPress={() => openLesson('harmonic_node')}
          />
        </View>

        <Text style={styles.sectionHead}>STRING</Text>
        <View style={styles.chipRow}>
          {STRINGS.map((s, i) => (
            <LabChip
              key={s.key}
              label={`${s.label} · ${s.hz.toFixed(0)} Hz`}
              selected={stringIdx === i}
              onPress={() => setStringIdx(i)}
              onLongPress={() => openLesson('string')}
            />
          ))}
        </View>

        {mode === 'fretted' ? (
          <>
            <Text style={styles.sectionHead}>FRET</Text>
            <View style={styles.chipRow}>
              {Array.from({ length: NUM_FRETS + 1 }, (_, n) => (
                <LabChip
                  key={n}
                  label={n === 0 ? 'OPEN' : String(n)}
                  selected={fret === n}
                  onPress={() => setFret(n)}
                  onLongPress={() => openLesson('fret')}
                />
              ))}
            </View>
          </>
        ) : (
          <>
            <Text style={styles.sectionHead}>TOUCH NODE — FRACTION OF THE STRING</Text>
            <View style={styles.chipRow}>
              {NODES.map((nd, i) => (
                <LabChip
                  key={nd.n}
                  label={`${nd.frac} · H${nd.n}`}
                  selected={nodeIdx === i}
                  onPress={() => setNodeIdx(i)}
                  onLongPress={() => openLesson('harmonic_node')}
                />
              ))}
            </View>
          </>
        )}
      </CollapsibleSection>

      <CollapsibleSection title="ACTIONS">
        {/* PLAY lives in the header (▶) — real audio through the additive
            engine (sine fallback on v2); the honest captions stay here. */}
        {engineReady ? (
          <>
            <Text style={styles.caption}>
              {additiveReady
                ? mode === 'fretted'
                  ? `PLAY (header ▶) — idealized plucked-string model, harmonic amplitudes ≈ 1/n through the additive engine (real strings vary with pluck position and pickup). Output ${GEN_LEVEL_DB} dBFS · uncalibrated.`
                  : `PLAY (header ▶) — the single exact harmonic ${node.n} of the open ${str.label} string through the additive engine. Output ${GEN_LEVEL_DB} dBFS · uncalibrated.`
                : 'This dev build predates the v3 additive engine — audio falls back to a pure sine at the target pitch; the fretboard and readouts are exact either way.'}
            </Text>
            {soundHz < SPEAKER_HPF_HZ ? (
              <Text style={styles.advisory}>
                {`Speaker high-pass (${SPEAKER_HPF_HZ} Hz): a ${soundHz.toFixed(0)} Hz fundamental is attenuated ${speakerGuardDb(soundHz).toFixed(1)} dB on the phone speaker — you mostly hear its harmonics. Use headphones for the true low end.`}
              </Text>
            ) : null}
            {genError ? <Text style={styles.error}>{genError}</Text> : null}
          </>
        ) : null}
      </CollapsibleSection>

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

const FB_H = 190;
const STRING_GAP = 34;
const STRING_TOP = 42;
/** String rows drawn TAB-style: G on top … E on the bottom. */
const ROW_TO_STRING = [3, 2, 1, 0] as const;

// Instrument look behind the strings (owner request 2026-07-26, RAISED per the
// visual standards 2026-07-29): a wood-grain gradient neck meeting a sunburst
// blue body with edge binding, a round sound hole, and a bridge with saddle +
// pins. Frets get a specular metal pass; inlays are gradient pearl. Geometry
// (fret positions, string rows, tap mapping) is untouched — this is a re-skin.
const GRAIN = '#1f1206'; // wood-grain streak lines over the neck gradient
const ROSETTE = '#0f3a68'; // outer decorative ring around the hole
const ROSETTE_PEARL = '#cfc8b8'; // fine pearl inlay ring inside the rosette
const FRET_BASE = '#4b4b53'; // fret wire body (dark nickel)
const FRET_SPEC = '#d8d8e0'; // fret wire specular highlight
const BINDING = '#e8dfc8'; // cream edge binding on the body
const STRING_STEEL = '#8d8d99';
const STRING_SPEC = '#eceef4';
const STRING_SEL = '#e6b84e'; // selected string — amber-tinted steel
// Static pseudo-random grain rows (fractions of FB_H) — drawn once, cheap.
const GRAIN_ROWS = [0.12, 0.27, 0.41, 0.57, 0.72, 0.88] as const;
// The neck→body seam sits just past the 12th fret (fretPos(12) = 0.5).
const BODY_START_FRAC = 0.52;

/** The tappable fretboard: 4 strings, frets 0–12 at true positions, fret
 *  markers, and the selected string's standing wave. Tap maps to the nearest
 *  string row + (fretted) nearest fret line / (harmonics) nearest node. */
function Fretboard({
  mode,
  stringIdx,
  fret,
  harmonicN,
  onPick,
}: {
  mode: Mode;
  stringIdx: number;
  fret: number;
  harmonicN: number;
  onPick: (stringIdx: number, fretOrNode: number) => void;
}) {
  const [w, setW] = useState(0);

  const onPress = useCallback(
    (x: number, y: number) => {
      if (w <= 0) return;
      // Row → string (clamped).
      const row = Math.min(3, Math.max(0, Math.round((y - STRING_TOP) / STRING_GAP)));
      const si = ROW_TO_STRING[row];
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
    [w, mode, onPick],
  );

  // Standing wave on the selected string: FRETTED = one lobe over the vibrating
  // length (fret → bridge) · HARMONICS = n lobes over the full string. Same
  // sample math as ever; the 2026-07-29 re-skin ALSO emits the closed envelope
  // (top curve + mirrored bottom curve) for a translucent gradient fill.
  const wave = useMemo(() => {
    if (w <= 0) return { top: '', env: '' };
    const row = ROW_TO_STRING.indexOf(stringIdx as 0 | 1 | 2 | 3);
    const y0 = STRING_TOP + row * STRING_GAP;
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
  }, [w, mode, stringIdx, fret, harmonicN]);

  const selRow = ROW_TO_STRING.indexOf(stringIdx as 0 | 1 | 2 | 3);
  const selY = STRING_TOP + selRow * STRING_GAP;

  // Instrument background geometry: wood neck on the left, blue body + sound
  // hole toward the bridge (right). The hole is centered on the 4 strings so
  // they cross over it ("behind the strings").
  const bodyStart = BODY_START_FRAC * w;
  const holeCX = bodyStart + (w - bodyStart) * 0.52;
  const holeCY = STRING_TOP + 1.5 * STRING_GAP;
  const holeR = Math.min(46, (w - bodyStart) * 0.42);

  return (
    <View onLayout={(e) => setW(Math.round(e.nativeEvent.layout.width))}>
      {w > 0 ? (
        <Pressable
          onPress={(e) => onPress(e.nativeEvent.locationX, e.nativeEvent.locationY)}
          accessibilityRole="button"
          accessibilityLabel="Fretboard — tap a string and fret"
        >
          <Svg width={w} height={FB_H}>
            <Defs>
              {/* Wood: vertical walnut gradient (light from upper-left). */}
              <LinearGradient id="fbWood" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#4a3018" />
                <Stop offset="28%" stopColor="#38250f" />
                <Stop offset="55%" stopColor="#452c15" />
                <Stop offset="82%" stopColor="#2f1d0d" />
                <Stop offset="100%" stopColor="#241608" />
              </LinearGradient>
              {/* Body: blue sunburst — bright near the hole, deep at the rim. */}
              <RadialGradient id="fbBody" cx="45%" cy="40%" r="90%">
                <Stop offset="0%" stopColor="#2f6fb8" />
                <Stop offset="55%" stopColor="#1e5290" />
                <Stop offset="100%" stopColor="#0d2c50" />
              </RadialGradient>
              {/* Sound hole bore: near-black with a lit inner rim (depth). */}
              <RadialGradient id="fbHole" cx="42%" cy="38%" r="70%">
                <Stop offset="0%" stopColor="#020203" />
                <Stop offset="78%" stopColor="#08080a" />
                <Stop offset="100%" stopColor="#171207" />
              </RadialGradient>
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
            {/* WOOD neck (gradient + static grain streaks) → sunburst body. */}
            <Rect x={0} y={0} width={w} height={FB_H} fill="url(#fbWood)" />
            {GRAIN_ROWS.map((g, i) => (
              <Path
                key={`grain${i}`}
                d={`M0 ${(g * FB_H).toFixed(1)} Q ${(bodyStart * 0.5).toFixed(1)} ${(g * FB_H + (i % 2 === 0 ? -4 : 4)).toFixed(1)} ${bodyStart.toFixed(1)} ${(g * FB_H).toFixed(1)}`}
                stroke={GRAIN}
                strokeWidth={i % 2 === 0 ? 1.2 : 0.7}
                opacity={0.4}
                fill="none"
              />
            ))}
            <Rect x={bodyStart} y={0} width={w - bodyStart} height={FB_H} fill="url(#fbBody)" />
            {/* Cream edge binding along the body rim + the neck→body seam. */}
            <Line x1={bodyStart} y1={1} x2={w} y2={1} stroke={BINDING} strokeWidth={2} opacity={0.55} />
            <Line x1={bodyStart} y1={FB_H - 1} x2={w} y2={FB_H - 1} stroke={BINDING} strokeWidth={2} opacity={0.55} />
            <Line x1={w - 1} y1={0} x2={w - 1} y2={FB_H} stroke={BINDING} strokeWidth={2} opacity={0.4} />
            <Line x1={bodyStart} y1={0} x2={bodyStart} y2={FB_H} stroke="#0a0a0c" strokeWidth={2} />
            {/* Sound hole: rosette + fine pearl rings + shaded bore. */}
            <Circle cx={holeCX} cy={holeCY} r={holeR + 4} fill="none" stroke={ROSETTE} strokeWidth={5} />
            <Circle cx={holeCX} cy={holeCY} r={holeR + 6} fill="none" stroke={ROSETTE_PEARL} strokeWidth={0.8} opacity={0.65} />
            <Circle cx={holeCX} cy={holeCY} r={holeR + 1.5} fill="none" stroke={ROSETTE_PEARL} strokeWidth={0.8} opacity={0.65} />
            <Circle cx={holeCX} cy={holeCY} r={holeR} fill="url(#fbHole)" />
            {/* Bridge: ebony base, bone saddle, pearl-ringed string pins. */}
            <Rect x={w - 13} y={STRING_TOP - 24} width={10} height={3 * STRING_GAP + 48} rx={5} fill="#150f08" />
            <Line x1={w - 8} y1={STRING_TOP - 18} x2={w - 8} y2={STRING_TOP + 3 * STRING_GAP + 18} stroke="#e8e2d2" strokeWidth={2} />
            {ROW_TO_STRING.map((si, row) => (
              <Circle
                key={`pin${si}`}
                cx={w - 4}
                cy={STRING_TOP + row * STRING_GAP}
                r={1.8}
                fill="#0c0c0f"
                stroke={ROSETTE_PEARL}
                strokeWidth={0.7}
              />
            ))}
            {/* Frets: dark nickel wire + specular highlight (0 = bone nut). */}
            {Array.from({ length: NUM_FRETS + 1 }, (_, n) => {
              const x = fretPos(n) * w;
              const y1 = STRING_TOP - 18;
              const y2 = STRING_TOP + 3 * STRING_GAP + 18;
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
              const cy = STRING_TOP + 1.5 * STRING_GAP;
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
              const y = STRING_TOP + row * STRING_GAP;
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
                      <Circle cx={x} cy={selY} r={9} fill="#5bff85" opacity={0.16} />
                      <Circle cx={x} cy={selY} r={4} fill="#5bff85" opacity={0.95} />
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
          </Svg>
        </Pressable>
      ) : (
        <View style={{ height: FB_H }} />
      )}
      {/* Nut/bridge + fraction labels under the board. */}
      <View style={styles.fbLabels}>
        <Text style={styles.fbLabel}>NUT</Text>
        {mode === 'fretted' ? (
          <Text style={styles.fbLabel}>5 ≈ ¾ · 7 ≈ ⅔ · 12 = ½</Text>
        ) : (
          <Text style={styles.fbLabel}>nodes at ½ · ⅓ · ¼ · ⅕</Text>
        )}
        <Text style={styles.fbLabel}>BRIDGE</Text>
      </View>
    </View>
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
  readMain: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, letterSpacing: 0.6, color: colors.textPrimary },
  readRow: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSecondary },
  fbLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  fbLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 9.5, letterSpacing: 1, color: colors.textSub },
});
