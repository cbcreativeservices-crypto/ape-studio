/**
 * AutotuneLabScreen — EXPANSION lab "Autotune" (owner request 2026-07-26) on
 * the shared LabShell. Pitch correction taught on the vertical cents-grid:
 * vertical gridlines are the semitone targets; a short demo melody is sung
 * deliberately OUT of tune (fixed cents offsets), and the corrected pitch
 * bends onto the grid according to CORRECTION AMOUNT and RETUNE SPEED.
 *
 * RACK UNIT layout (APE_LAB_UX_PROPOSAL 2026-08-23): the cents grid pins on
 * the stage (it IS the lab — tall glass) with AMOUNT/SPEED/NOTE/ENDS bezel
 * readouts; the dock carries the CORRECTION AMOUNT fader (pre-bound lane —
 * the parameter is continuous 0–100% by nature, the old 0/50/100 chips were
 * a discrete stand-in), the RETUNE SPEED tray (sticky — A/B while the curves
 * redraw) and the PLAY key (LED = melody running; the owner's 2026-08-05
 * "header ▶ alone is easy to miss" visible-transport rule, dock-sized). Only
 * the teaching prose scrolls in the well.
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
 * generator. What you see IS what you hear. A control change ends any running
 * pass (the pass corrects with ONE setting), so graph and audio never diverge.
 */
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { ApeDsp, GEN_MODES } from '../../../modules/ape-dsp';
import { useAudioOutputGate } from '../../features/audio/AudioOutputGate';
import { noteAudioActivity } from '../../features/audio/audioOutputStore';
import { GuidedLessonSheet, getLabLesson } from '../../features/lab/guidedLessons';
import { CheckQuestion } from './foundations/bits';
import { EngineGate } from '../tools/EngineGate';
import type { EngineState } from '../../features/tools/engine/useDspEngine';
import { colors, fonts } from '../../theme/tokens';
import { LabShell, HeaderPlayButton } from './LabShell';

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

const SPEEDS = [
  { key: 'fast', label: 'FAST — SNAP', short: 'FAST', tau: 0.025, blurb: 'Correction in ~25 ms — pitch JUMPS to the grid. Audible as the hard, robotic effect; nothing natural moves this fast.' },
  { key: 'med', label: 'MEDIUM', short: 'MEDIUM', tau: 0.12, blurb: 'Correction over ~120 ms — quick enough to catch a note, slow enough to keep some human motion.' },
  { key: 'slow', label: 'SLOW — GLIDE', short: 'SLOW', tau: 0.4, blurb: 'Correction over ~400 ms — a gentle drift back to pitch. Vibrato and slides survive; this is "transparent" tuning.' },
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

/** Fader readout — 0 reads "OFF" (the old "0% — OFF" chip, kept honest). */
const fmtAmount = (amount: number) => (amount <= 0.005 ? 'OFF' : `${Math.round(amount * 100)}%`);

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

  // Correction amount is continuous 0..1 (the rack fader rides it directly —
  // the old 0/50/100% chips were the discrete stand-in for this same value).
  const [amount, setAmount] = useState<number>(1);
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

  const speed = SPEEDS.find((s) => s.key === speedKey)!;
  const tau = speed.tau;

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

  // Where a note ENDS after correction — τ-aware (fix 2026-08-31): the old
  // asymptote-only formula claimed "0¢ — exactly on pitch" at 100% + SLOW
  // while the drawn curve (the EXACT RETUNE MATH badge) ended ~3¢ short.
  const remaining = (c0: number) => Math.round(Math.abs(correctedCents(c0, amount, tau, NOTE_MS / 1000)));
  const togglePlay = () => (playing ? stop() : void play());

  // ── RACK UNIT (APE_LAB_UX_PROPOSAL 2026-08-23) ────────────────────────────
  // The cents grid + its state pin on the stage/bezel; AMOUNT is the pre-bound
  // lane (drag it and every curve re-bends live — cause→effect at zero taps);
  // SPEED is a sticky tray; PLAY is the dock transport key. Prose scrolls.
  return (
    <LabShell
      labId="autotune"
      title="AUTOTUNE LAB"
      subtitle="Pitch Correction · Cents Grid · Retune Speed"
      intro={INTRO}
      exploreCaption="Set the correction amount and retune speed, then play the out-of-tune melody and watch each note pull onto its gridline."
      headerAction={
        <HeaderPlayButton
          playing={playing}
          disabled={!engineReady}
          onPress={togglePlay}
          label={playing ? 'Stop' : 'Play the out-of-tune melody'}
        />
      }
      rack={{
        initialParam: 'amount',
        onHelp: openLesson,
        stage: {
          size: 'L', // the cents grid IS the lab — earns the tall glass
          badge: 'CENTS GRID — THE DRAWN CURVE IS THE EXACT RETUNE MATH THE AUDIO FOLLOWS',
          onGuide: () => openLesson('cents_grid'),
          bezel: [
            { k: 'AMOUNT', v: fmtAmount(amount), helpKey: 'correction' },
            { k: 'SPEED', v: speed.short, helpKey: 'retune_speed' },
            // Live transport readout: which note is being corrected right now.
            {
              k: 'NOTE',
              v: activeNote >= 0 ? midiName(MELODY[activeNote].midi) : '—',
              helpKey: 'cents_grid',
            },
            // The residual: where the worst note (45¢ flat) ENDS after correction.
            { k: 'ENDS', v: `${remaining(MELODY[3].offCents)}¢`, helpKey: 'correction' },
          ],
          render: (_w, h) => (
            // Tapping the display toggles play/stop (owner 2026-07-31) — same
            // gate as the header button.
            <Pressable
              onPress={engineReady ? togglePlay : undefined}
              accessibilityRole="button"
              accessibilityLabel={playing ? 'Tap to stop' : 'Tap to play'}
            >
              <CentsGrid amount={amount} tau={tau} activeNote={activeNote} height={h} />
            </Pressable>
          ),
        },
        params: [
          {
            kind: 'fader',
            id: 'amount',
            label: 'AMOUNT',
            // The value IS the lane position — correction amount is linear 0..1.
            value: amount,
            onChange: (v) => {
              if (playing) stop(); // lockstep rule: a control change ends the pass
              setAmount(v);
            },
            format: () => fmtAmount(amount),
            helpKey: 'correction',
          },
          {
            kind: 'options',
            id: 'speed',
            label: 'SPEED',
            valueLabel: speed.short,
            options: SPEEDS.map((s) => ({ id: s.key, label: s.label, blurb: s.blurb })),
            selectedId: speedKey,
            onSelect: (id) => {
              const s = SPEEDS.find((x) => x.key === id);
              if (!s) return;
              if (playing) stop(); // lockstep rule
              setSpeedKey(s.key);
            },
            sticky: true, // A/B snap vs glide while the curves redraw — the lesson
            helpKey: 'retune_speed',
          },
          {
            // Visible transport (owner 2026-08-05 — the header ▶ alone was easy
            // to miss); the LED shows the melody running. Same handler as the
            // header control and the display tap.
            kind: 'toggle',
            id: 'play',
            label: playing ? 'STOP' : 'PLAY',
            value: playing,
            onToggle: () => {
              if (engineReady) togglePlay();
            },
          },
        ],
      }}
    >
      {!engineReady ? <EngineGate state={gate} /> : null}

      <View style={{ gap: 6 }}>
        <Text style={styles.sectionHead}>READING THE GRID</Text>
        <Text style={styles.caption}>
          Gray = as sung (out of tune) · amber = corrected pitch over the note’s duration (time runs
          downward within each note). Ride the AMOUNT fader and every curve re-bends live; switch
          SPEED and watch snap become glide.
        </Text>
      </View>

      <View style={{ gap: 6 }}>
        <Text style={styles.sectionHead}>THE CORRECTION, IN NUMBERS</Text>
        <Text style={styles.readMain}>
          {fmtAmount(amount)} correction · {speed.label.toLowerCase()} (τ = {tau}s)
        </Text>
        <Text style={styles.caption}>
          At {Math.round(amount * 100)}% correction a {Math.abs(MELODY[3].offCents)}¢ error ends{' '}
          {remaining(MELODY[3].offCents)}¢ from the line
          {remaining(MELODY[3].offCents) === 0
            ? ' — exactly on pitch'
            : amount === 1
              ? ' — the SLOW glide has not finished by the note’s end (mistake #2 in the lesson, live)'
              : ''}.
        </Text>
      </View>

      {engineReady ? (
        <View style={{ gap: 6 }}>
          <Text style={styles.sectionHead}>THE DEMO SINGER</Text>
          <Text style={styles.caption}>
            GENERATOR DEMO — plays the demo melody with the app’s tone generator (no microphone), so
            the correction you hear is real retuning of a synthesized voice.{' '}
            {additiveReady ? '' : 'This build plays the voice as a pure sine. '}
            Try FAST at 100% for the robotic hard-tune snap, then SLOW for a natural glide. Output{' '}
            {GEN_LEVEL_DB} dBFS · uncalibrated.
          </Text>
          {genError ? <Text style={styles.error}>{genError}</Text> : null}
        </View>
      ) : null}

{/* Retrieval (learning pass 2026-08-31) — NEW COPY, owner review. */}
      <CheckQuestion
        spec={{
          question: 'Why does FAST retune sound robotic?',
          options: [
            'Pitch JUMPS to the grid faster than any natural voice can move — and vibrato flattens with it',
            'It adds distortion to the voice',
            'It corrects to the wrong notes',
          ],
          correctIdx: 0,
          reveal:
            'A ~25 ms snap is faster than any human pitch motion, so every scoop, slide and vibrato cycle gets ironed flat the instant it starts — that instant flatness IS the robotic sound.',
          wrongHint: 'Play the melody on FAST, then SLOW, and watch the curve shapes.',
        }}
      />
      <CheckQuestion
        spec={{
          question: '100% correction on SLOW still leaves a short note a few cents off. Why?',
          options: [
            'The glide takes time — the note ends before the correction finishes',
            'SLOW mode caps correction at 90%',
            'The singer moved',
          ],
          correctIdx: 0,
          reveal:
            'Retune speed is a time constant: SLOW drifts toward the grid over ~400 ms per τ. A 1.1 s note ends mid-glide — read the ENDS cell, it does the τ math live. Transparent tuning trades precision for motion.',
          wrongHint: 'Set 100% + SLOW and read ENDS — then switch to FAST.',
        }}
      />

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

const TOP_AXIS = 26;
const PAD_X = 16;

/** The vertical cents-grid graph. X = pitch (linear in cents), one vertical
 *  gridline per semitone; each melody note is a row — the gray line is the
 *  sung (offset) pitch, the amber curve bends toward the gridline following
 *  correctedCents() with time running downward through the row. Height-driven
 *  (rack stage contract): rows share whatever height the glass provides. */
function CentsGrid({
  amount,
  tau,
  activeNote,
  height,
}: {
  amount: number;
  tau: number;
  activeNote: number;
  height: number;
}) {
  const [w, setW] = useState(0);
  const h = height;
  const rowH = (h - TOP_AXIS - 8) / MELODY.length;
  const padY = Math.max(4, Math.min(8, rowH * 0.18)); // row inner breathing room

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
      const y0 = TOP_AXIS + i * rowH + padY;
      const y1 = TOP_AXIS + (i + 1) * rowH - padY;
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
  }, [w, rowH, padY, amount, tau, xOf]);

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
                  stroke={isTarget ? '#4a4a56' : '#2e2f38'}
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
                  y={TOP_AXIS + i * rowH + 2}
                  width={w - 4}
                  height={rowH - 4}
                  fill="rgba(255,198,77,.07)"
                  stroke="rgba(255,198,77,.35)"
                  strokeWidth={1}
                  rx={4}
                />
              ) : null}
              <Line x1={c.sungX} y1={c.y0} x2={c.sungX} y2={c.y1} stroke="#6a6a74" strokeWidth={2.5} opacity={0.75} />
              {/* At AMOUNT OFF the corrected curve coincides with the sung
                  line — dash it so the gray reference stays visible and the
                  legend keeps telling the truth (fix 2026-08-31). */}
              <Path
                d={c.d}
                stroke={colors.amber}
                strokeWidth={2.2}
                fill="none"
                strokeDasharray={amount === 0 ? '4 4' : undefined}
              />
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
  sectionHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1.5, color: colors.amber },
  caption: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
  readMain: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, letterSpacing: 0.6, color: colors.textPrimary },
  error: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: '#ff6b5e' },
});
