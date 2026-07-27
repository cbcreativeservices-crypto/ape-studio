/**
 * AutotuneLabScreen — EXPANSION lab "Autotune" (owner request 2026-07-26) on
 * the shared LabShell. Pitch correction taught on the vertical cents-grid:
 * vertical gridlines are the semitone targets; a short demo melody is sung
 * deliberately OUT of tune (fixed cents offsets), and the corrected pitch
 * bends onto the grid according to CORRECTION AMOUNT and RETUNE SPEED.
 *
 * GENERATOR DEMO (honest): there is NO microphone here — the "singer" is the
 * app's own tone generator, so the correction is real, audible retuning of a
 * synthesized voice. The engine retunes phase-continuously, so the glide is
 * click-free. Correcting a live mic needs heavy new native DSP (deliberately
 * out of scope — owner decision 2026-07-26).
 *
 * LOCKSTEP RULE (fxViz discipline): the drawn correction curve and the audio
 * glide are THE SAME exponential — f(t) in cents = c₀·(1−amount) + c₀·amount·
 * e^(−t/τ) — sampled by SVG for the graph and by the 20 Hz update loop for the
 * generator. What you see IS what you hear.
 */
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { ApeDsp, GEN_MODES } from '../../../modules/ape-dsp';
import { GlassButton } from '../../components/GlassButton';
import { useAudioOutputGate } from '../../features/audio/AudioOutputGate';
import { noteAudioActivity } from '../../features/audio/audioOutputStore';
import { GuidedLessonSheet, getLabLesson, DisplayGuideButton } from '../../features/lab/guidedLessons';
import { EngineGate } from '../tools/EngineGate';
import type { EngineState } from '../../features/tools/engine/useDspEngine';
import { colors, fonts } from '../../theme/tokens';
import { LabShell, LabChip } from './LabShell';

const GEN_LEVEL_DB = -20;
const ACTIVITY_MS = 500;
const NOTE_MS = 1100; // per melody note
const TICK_MS = 50; // 20 Hz audio glide updates (≤30 Hz bridge rule)

const NOTE_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'] as const;
const midiName = (m: number) => `${NOTE_NAMES[m % 12]}${Math.floor(m / 12) - 1}`;
const midiHz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

/** The demo melody: grid target (MIDI) + how far it is "sung" off (cents).
 *  Fixed, deterministic offsets — every run corrects the same performance. */
const MELODY: { midi: number; offCents: number }[] = [
  { midi: 57, offCents: +38 }, // A3, sharp
  { midi: 59, offCents: -32 }, // B3, flat
  { midi: 61, offCents: +22 }, // C#4, sharp
  { midi: 64, offCents: -45 }, // E4, badly flat
  { midi: 61, offCents: +15 }, // C#4, slightly sharp
  { midi: 57, offCents: -28 }, // A3, flat
];

const AMOUNTS = [
  { key: 0, label: '0% — OFF' },
  { key: 0.5, label: '50%' },
  { key: 1, label: '100%' },
] as const;

const SPEEDS = [
  { key: 'fast', label: 'FAST — SNAP', tau: 0.025 },
  { key: 'med', label: 'MEDIUM', tau: 0.12 },
  { key: 'slow', label: 'SLOW — GLIDE', tau: 0.4 },
] as const;

/** THE correction curve (cents relative to the note's grid target) — shared by
 *  the graph and the audio loop. c₀ = sung offset; t in seconds. */
function correctedCents(c0: number, amount: number, tau: number, t: number): number {
  return c0 * (1 - amount) + c0 * amount * Math.exp(-t / tau);
}

/** "Voice-ish" additive recipe (a few decaying harmonics) at frequency hz —
 *  [f0, a1..a12, p1..p12]. All melody pitches are ≥ 200 Hz, so no speaker
 *  guard is needed (nothing under the 150 Hz high-pass). */
function voicePayload(hz: number): number[] {
  const amps = [1, 0.35, 0.2, 0.12, 0.08, 0, 0, 0, 0, 0, 0, 0];
  return [hz, ...amps, ...new Array(12).fill(0)];
}

const INTRO =
  'Every note has a target line on the cents grid — one vertical line per semitone. This ' +
  'demo melody is sung out of tune on purpose; pitch correction pulls each note toward its ' +
  'line. Correction amount sets HOW FAR it is pulled, retune speed sets HOW FAST — slow ' +
  'sounds natural, instant sounds robotic.';

export function AutotuneLabScreen() {
  const { requestAudioOutput } = useAudioOutputGate();

  const [gate] = useState<EngineState>(() => {
    if (!ApeDsp.isAvailable()) return 'absent';
    return ApeDsp.engineVersion() >= 2 ? 'idle' : 'spike';
  });
  const engineReady = gate === 'idle';
  const additiveReady = engineReady && ApeDsp.engineVersion() >= 3;

  const [amount, setAmount] = useState<(typeof AMOUNTS)[number]['key']>(1);
  const [speedKey, setSpeedKey] = useState<(typeof SPEEDS)[number]['key']>('med');
  const [playing, setPlaying] = useState(false);
  const [activeNote, setActiveNote] = useState(-1); // -1 = idle
  const [genError, setGenError] = useState('');

  const [lessonKey, setLessonKey] = useState<string | undefined>(undefined);
  const [lessonOpen, setLessonOpen] = useState(false);
  const openLesson = useCallback((key?: string) => {
    setLessonKey(key);
    setLessonOpen(true);
  }, []);

  const tau = SPEEDS.find((s) => s.key === speedKey)!.tau;

  // ---- Playback: sequence the melody, glide each note along THE curve --------
  const genRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  const stop = useCallback(() => {
    genRef.current++;
    clearTimer();
    void ApeDsp.genStop();
    setPlaying(false);
    setActiveNote(-1);
  }, [clearTimer]);

  const play = useCallback(async () => {
    const gen = ++genRef.current;
    const ok = await requestAudioOutput();
    if (!ok || gen !== genRef.current) return;
    setGenError('');
    // Capture the controls at press time — the pass corrects with ONE setting
    // (changing controls mid-pass restarts on the next press, honest A/B).
    const amt = amount;
    const tc = tau;
    const startHz = (i: number) => midiHz(MELODY[i].midi) * Math.pow(2, MELODY[i].offCents / 1200);
    ApeDsp.genSet(
      additiveReady
        ? { mode: GEN_MODES.additive, additive: voicePayload(startHz(0)), levelDb: GEN_LEVEL_DB }
        : { mode: GEN_MODES.sine, frequency: startHz(0), levelDb: GEN_LEVEL_DB },
    );
    try {
      await ApeDsp.genStart();
    } catch (e) {
      if (gen === genRef.current) setGenError(e instanceof Error ? e.message : String(e));
      return;
    }
    if (gen !== genRef.current) {
      void ApeDsp.genStop();
      return;
    }
    setPlaying(true);
    setActiveNote(0);
    noteAudioActivity();

    const t0 = Date.now();
    clearTimer();
    timerRef.current = setInterval(() => {
      if (gen !== genRef.current) return; // stale tick after stop
      const elapsed = Date.now() - t0;
      const idx = Math.floor(elapsed / NOTE_MS);
      if (idx >= MELODY.length) {
        stop();
        return;
      }
      setActiveNote((cur) => (cur === idx ? cur : idx));
      const note = MELODY[idx];
      const tInNote = (elapsed - idx * NOTE_MS) / 1000;
      // THE shared curve: cents offset now → frequency now.
      const cents = correctedCents(note.offCents, amt, tc, tInNote);
      const hz = midiHz(note.midi) * Math.pow(2, cents / 1200);
      ApeDsp.genSet(
        additiveReady
          ? { mode: GEN_MODES.additive, additive: voicePayload(hz) }
          : { frequency: hz },
      );
      noteAudioActivity();
    }, TICK_MS);
  }, [requestAudioOutput, amount, tau, additiveReady, clearTimer, stop]);

  useFocusEffect(useCallback(() => () => stop(), [stop]));
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(noteAudioActivity, ACTIVITY_MS);
    return () => clearInterval(id);
  }, [playing]);

  const remaining = (c0: number) => Math.round(c0 * (1 - amount));

  return (
    <LabShell
      labId="autotune"
      title="AUTOTUNE LAB"
      subtitle="Pitch Correction · Cents Grid · Retune Speed"
      intro={INTRO}
      exploreCaption="Set the correction amount and retune speed, then play the out-of-tune melody and watch each note pull onto its gridline."
    >
      {!engineReady ? <EngineGate state={gate} /> : null}

      <View style={styles.chipRow}>
        <LabChip label="ⓘ GUIDED LESSON" selected={lessonOpen} onPress={() => openLesson()} />
      </View>
      <Text style={styles.caption}>Long-press a labeled control for its guided lesson.</Text>

      <Text style={styles.sectionHead}>CORRECTION AMOUNT</Text>
      <View style={styles.chipRow}>
        {AMOUNTS.map((a) => (
          <LabChip
            key={a.key}
            label={a.label}
            selected={amount === a.key}
            // A control change ends any running pass — the pass corrects with
            // ONE setting, so graph and audio can never diverge (lockstep rule).
            onPress={() => {
              if (playing) stop();
              setAmount(a.key);
            }}
            onLongPress={() => openLesson('correction')}
          />
        ))}
      </View>

      <Text style={styles.sectionHead}>RETUNE SPEED</Text>
      <View style={styles.chipRow}>
        {SPEEDS.map((s) => (
          <LabChip
            key={s.key}
            label={s.label}
            selected={speedKey === s.key}
            onPress={() => {
              if (playing) stop();
              setSpeedKey(s.key);
            }}
            onLongPress={() => openLesson('retune_speed')}
          />
        ))}
      </View>

      {/* THE CENTS GRID — vertical semitone lines; notes bend onto them. */}
      <View style={styles.panelCard}>
        <Text style={styles.badge}>
          CENTS GRID — THE DRAWN CURVE IS THE EXACT RETUNE MATH THE AUDIO FOLLOWS
        </Text>
        <CentsGrid amount={amount} tau={tau} activeNote={activeNote} />
        <Text style={styles.caption}>
          Gray = as sung (out of tune) · amber = corrected pitch over the note’s duration (time runs
          downward within each note). At {Math.round(amount * 100)}% correction a{' '}
          {Math.abs(MELODY[3].offCents)}¢ error ends {Math.abs(remaining(MELODY[3].offCents))}¢ from
          the line{amount === 1 ? ' — exactly on pitch' : ''}.
        </Text>
        <DisplayGuideButton onPress={() => openLesson('cents_grid')} />
      </View>

      {/* PLAY — real audible correction of the generator "singer". */}
      {engineReady ? (
        <>
          <GlassButton
            label={playing ? 'STOP' : 'PLAY OUT-OF-TUNE MELODY'}
            tint="green"
            height={52}
            fontSize={15}
            onPress={() => (playing ? stop() : void play())}
          />
          <Text style={styles.caption}>
            GENERATOR DEMO — the “singer” is the app’s tone generator (no microphone), so the
            correction you hear is real retuning of a synthesized voice.{' '}
            {additiveReady
              ? ''
              : 'This dev build predates the v3 additive engine — the voice falls back to a pure sine. '}
            Try FAST at 100% for the robotic hard-tune snap, then SLOW for a natural glide. Output{' '}
            {GEN_LEVEL_DB} dBFS · uncalibrated.
          </Text>
          {genError ? <Text style={styles.error}>{genError}</Text> : null}
        </>
      ) : null}

      <GuidedLessonSheet
        visible={lessonOpen}
        lesson={getLabLesson('autotune')}
        controlKey={lessonKey}
        onClose={() => setLessonOpen(false)}
      />
    </LabShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

const ROW_H = 54;
const TOP_AXIS = 26;
const PAD_X = 16;

/** The vertical cents-grid graph. X = pitch (linear in cents), one vertical
 *  gridline per semitone; each melody note is a row — the gray line is the
 *  sung (offset) pitch, the amber curve bends toward the gridline following
 *  correctedCents() with time running downward through the row. */
function CentsGrid({ amount, tau, activeNote }: { amount: number; tau: number; activeNote: number }) {
  const [w, setW] = useState(0);
  const h = TOP_AXIS + MELODY.length * ROW_H + 8;

  // Pitch range: every semitone from min−1 to max+1 of the melody.
  const midis = MELODY.map((n) => n.midi);
  const loM = Math.min(...midis) - 1;
  const hiM = Math.max(...midis) + 1;
  const loC = loM * 100;
  const hiC = hiM * 100;
  const xOf = useCallback(
    (cents: number) => PAD_X + ((cents - loC) / (hiC - loC)) * (w - 2 * PAD_X),
    [w, loC, hiC],
  );

  // Correction curves — one per note, memoized on the controls.
  const curves = useMemo(() => {
    if (w <= 0) return [];
    const noteSec = NOTE_MS / 1000;
    return MELODY.map((note, i) => {
      const y0 = TOP_AXIS + i * ROW_H + 8;
      const y1 = TOP_AXIS + (i + 1) * ROW_H - 8;
      const N = 40;
      let d = '';
      for (let k = 0; k <= N; k++) {
        const t = (k / N) * noteSec;
        const c = note.midi * 100 + correctedCents(note.offCents, amount, tau, t);
        const x = xOf(c);
        const y = y0 + (k / N) * (y1 - y0);
        d += k === 0 ? `M${x.toFixed(1)} ${y.toFixed(1)}` : `L${x.toFixed(1)} ${y.toFixed(1)}`;
      }
      return { d, y0, y1, sungX: xOf(note.midi * 100 + note.offCents), gridX: xOf(note.midi * 100) };
    });
  }, [w, amount, tau, xOf]);

  return (
    <View onLayout={(e) => setW(Math.round(e.nativeEvent.layout.width))}>
      {w > 0 ? (
        <Svg width={w} height={h}>
          <Rect x={0} y={0} width={w} height={h} fill="#0c0c0f" />
          {/* Vertical semitone gridlines + note names. */}
          {Array.from({ length: hiM - loM + 1 }, (_, k) => {
            const m = loM + k;
            const x = xOf(m * 100);
            const isTarget = midis.includes(m);
            return (
              <Fragment key={m}>
                <Line
                  x1={x}
                  y1={TOP_AXIS - 4}
                  x2={x}
                  y2={h - 4}
                  stroke={isTarget ? '#3f3f49' : '#232329'}
                  strokeWidth={isTarget ? 1.5 : 1}
                />
                <SvgText
                  x={x}
                  y={14}
                  fill={isTarget ? colors.textSecondary : '#4a4a52'}
                  fontSize={9.5}
                  textAnchor="middle"
                >
                  {midiName(m)}
                </SvgText>
              </Fragment>
            );
          })}
          {/* Note rows: active highlight · sung line · corrected curve · label. */}
          {curves.map((c, i) => (
            <Fragment key={i}>
              {i === activeNote ? (
                <Rect
                  x={2}
                  y={TOP_AXIS + i * ROW_H + 2}
                  width={w - 4}
                  height={ROW_H - 4}
                  fill="rgba(255,198,77,.07)"
                  stroke="rgba(255,198,77,.35)"
                  strokeWidth={1}
                  rx={4}
                />
              ) : null}
              <Line x1={c.sungX} y1={c.y0} x2={c.sungX} y2={c.y1} stroke="#6a6a74" strokeWidth={2.5} opacity={0.75} />
              <Path d={c.d} stroke={colors.amber} strokeWidth={2.2} fill="none" />
              <SvgText
                x={c.sungX + (MELODY[i].offCents >= 0 ? 6 : -6)}
                y={c.y0 + 10}
                fill="#8a8a94"
                fontSize={9.5}
                textAnchor={MELODY[i].offCents >= 0 ? 'start' : 'end'}
              >
                {`${MELODY[i].offCents > 0 ? '+' : ''}${MELODY[i].offCents}¢`}
              </SvgText>
            </Fragment>
          ))}
        </Svg>
      ) : (
        <View style={{ height: h }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sectionHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1.5, color: colors.amber },
  caption: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
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
