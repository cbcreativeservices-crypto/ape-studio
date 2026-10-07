/**
 * Page 2 — HOW IT SOUNDS, for the saxophone family (LESSON_JOURNEY §6
 * stage 2, §7 "air columns": "sound leaves from the first open holes", the
 * Lab 3 correction). The lesson's own page (LessonArt.pages.sound): the
 * drum page's membranes do not fit an air column. FULLY SILENT.
 *
 *   BREATH TO SOUND (rack)       PREDICT FIRST, then four numbered events
 *                                on the horn: STEP, or PLAY ONCE (a staged
 *                                reveal that stops at the end — not a loop,
 *                                D8). Under reduced motion PLAY advances one
 *                                step, instantly.
 *   WHERE THE SOUND LEAVES (rack) the user-started fingering walk: NOTE
 *                                picks a written note; PLAY THE SCALE steps up
 *                                one note at a time and STOPS at the top (or
 *                                at PAUSE); under reduced motion it moves one
 *                                note per press. The first open hole climbs
 *                                toward the mouthpiece; the octave key sends
 *                                it back down an octave up.
 *   LOW AND HIGH REGISTERS (rack) the air column straightened out: shape 1
 *                                (the note) or shape 2 (an octave up), swung
 *                                by hand; the octave vent at shape 2's still
 *                                point.
 *   ATTACK AND BODY (read)       in words, then the three checks.
 * Credit: the breath sequence reached its end ('soundPath') + the checks.
 */
import { useEffect, useState, type ReactNode } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { cancelAnimation, Easing, useAnimatedReaction, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { colors } from '../../../../../../theme/tokens';
import { useAnimationsAllowed } from '../../../../../../features/settings/a11y';
import type { BezelItem, DockParam } from '../../../../rack/rackTypes';
import { PageSteps, type MikingStep } from '../../../engine/steps';
import { Card, Landing, Note, Point, PredictCard, ScenarioList } from '../../../engine/kit';
import type { PageProps } from '../../../pages/pageTypes';
import { fingering, noteRange, REGISTER_TOP, type SaxRow } from './saxSpec.ts';
import { ConeShapes, SaxBreath, SaxFingering } from './SaxSoundArt';

const STEP_MS = 1400;
const NOTE_MS = 650;

function useFocusedSafe(): boolean {
  try {
    return useIsFocused();
  } catch {
    return true; // the web preview harness mounts the page outside a navigator
  }
}

export type SaxSoundConfig = {
  row: SaxRow;
  /** The note the breath sequence plays (written semitones above low B♭). */
  breathNote: number;
  /** The horn face-on, in words, for the screen reader. */
  subject: string;
  /** Lines under each step, for this instrument. */
  bellNote: string;
  registerNote: string;
  silentNote: string;
  /** After the sequence's end, with a prediction made. */
  reveal: string;
};

const fmtHz = (hz: number) => (hz >= 1000 ? `${(hz / 1000).toFixed(2)} kHz` : `${Math.round(hz)} Hz`);

export function makeSaxSoundPage(cfg: SaxSoundConfig): (p: PageProps) => ReactNode {
  const row = cfg.row;
  const range = noteRange(row);
  return function SaxSound({ lesson, answers, onAnswered, onInteractive, interactiveDone, hidden }: PageProps) {
    const S = lesson.sound;
    const n = S.stages.length;
    const motion = useAnimationsAllowed();
    const focused = useFocusedSafe();

    /* step 1: breath to sound */
    const reveal = useSharedValue(1);
    const [shown, setShown] = useState(1);
    const [playing, setPlaying] = useState(false);
    const [predicted, setPredicted] = useState<string | null>(null);
    useAnimatedReaction(
      () => Math.max(1, Math.min(n, Math.floor(reveal.value + 0.001))),
      (cur, prev) => {
        if (cur !== prev) scheduleOnRN(setShown, cur);
      },
    );
    const stop = () => {
      cancelAnimation(reveal);
      setPlaying(false);
    };
    const goTo = (k: number) => {
      cancelAnimation(reveal);
      setPlaying(false);
      reveal.value = k;
      setShown(k);
    };
    const play = () => {
      if (playing) {
        stop();
        return;
      }
      const from = shown >= n ? 1 : Math.floor(reveal.value);
      if (!motion) {
        goTo(Math.min(n, from + (shown >= n ? 0 : 1)));
        return;
      }
      reveal.value = from;
      setPlaying(true);
      reveal.value = withTiming(n, { duration: (n - from) * STEP_MS, easing: Easing.linear }, (done) => {
        if (done) scheduleOnRN(setPlaying, false);
      });
    };

    /* step 2: the fingering walk (user-started, finite, pausable) */
    const walk = useSharedValue(cfg.breathNote);
    const [note, setNote] = useState(cfg.breathNote);
    const [walking, setWalking] = useState(false);
    const [seenNotes, setSeenNotes] = useState<ReadonlySet<number>>(() => new Set([cfg.breathNote]));
    useAnimatedReaction(
      () => Math.round(walk.value),
      (cur, prev) => {
        if (cur !== prev) scheduleOnRN(setNote, cur);
      },
    );
    useEffect(() => {
      setSeenNotes((p) => (p.has(note) ? p : new Set([...p, note])));
    }, [note]);
    const stopWalk = () => {
      cancelAnimation(walk);
      setWalking(false);
      walk.value = Math.round(walk.value);
    };
    const pickNote = (s: number) => {
      cancelAnimation(walk);
      setWalking(false);
      walk.value = s;
      setNote(s);
    };
    const playScale = () => {
      if (walking) {
        stopWalk();
        return;
      }
      const from = note >= range.hi ? range.lo : note;
      if (!motion) {
        pickNote(Math.min(range.hi, from + (note >= range.hi ? 0 : 1)));
        return;
      }
      walk.value = from;
      setNote(from);
      setWalking(true);
      walk.value = withTiming(range.hi, { duration: (range.hi - from) * NOTE_MS, easing: Easing.linear }, (done) => {
        if (done) scheduleOnRN(setWalking, false);
      });
    };

    useEffect(() => {
      if ((hidden || !focused) && playing) stop();
      if ((hidden || !focused) && walking) stopWalk();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hidden, focused]);
    useEffect(
      () => () => {
        cancelAnimation(reveal);
        cancelAnimation(walk);
      },
      [], // eslint-disable-line react-hooks/exhaustive-deps
    );
    useEffect(() => {
      if (shown >= n && !interactiveDone.has('soundPath')) onInteractive('soundPath');
    }, [shown, n, interactiveDone, onInteractive]);
    const stage = S.stages[shown - 1];
    const breathF = fingering(row, cfg.breathNote);
    const f = fingering(row, note);

    /* step 3: the air column's shapes */
    const [shape, setShape] = useState<1 | 2>(1);
    const [swing, setSwing] = useState(1);

    const strikeParams: DockParam[] = [
      {
        kind: 'fader',
        id: 'step',
        label: 'STEP',
        value: (shown - 1) / Math.max(1, n - 1),
        onChange: (v) => goTo(1 + Math.round(v * (n - 1))),
        format: () => `${shown} of ${n} · ${stage.title.toLowerCase()}`,
        formatShort: () => `${shown} / ${n}`,
      },
      { kind: 'action', id: 'play', label: playing ? 'PAUSE' : shown >= n ? 'REPLAY ONCE' : motion ? 'PLAY ONCE' : 'NEXT STEP', onPress: play, tint: colors.green },
    ];
    const strikeBezel: BezelItem[] = [
      { k: 'EVENT', v: `${shown} / ${n}`, flex: 0.8 },
      { k: 'REED', v: shown >= 1 ? 'VIBRATING' : 'AT REST', flex: 1.1 },
      { k: 'AIR COLUMN', v: shown >= 3 ? `≈ ${Math.round(breathF.air / 10)} CM` : shown === 2 ? 'PULSE RUNS' : '—', flex: 1.3 },
      { k: 'SOUND LEAVES', v: shown >= 4 ? (breathF.k === 0 ? 'BELL' : 'HOLES · BELL') : '—', flex: 1.3 },
    ];
    const noteParams: DockParam[] = [
      {
        kind: 'fader',
        id: 'note',
        label: 'NOTE',
        value: (note - range.lo) / (range.hi - range.lo),
        onChange: (v) => pickNote(range.lo + Math.round(v * (range.hi - range.lo))),
        format: () => `written ${f.written} · sounds ${f.sounding} · ${f.register === 1 ? 'first' : 'second'} register`,
        formatShort: () => f.written,
      },
      { kind: 'action', id: 'scale', label: walking ? 'PAUSE' : note >= range.hi ? 'PLAY THE SCALE AGAIN' : motion ? 'PLAY THE SCALE' : 'NEXT NOTE', onPress: playScale, tint: colors.green },
    ];
    const noteBezel: BezelItem[] = [
      { k: 'NOTE', v: f.written, sub: `sounds ${f.sounding} · ${fmtHz(f.hz)}`, flex: 1.2 },
      { k: 'FIRST OPEN HOLE', v: f.k === 0 ? 'NONE — BELL' : `HOLE ${f.k}`, sub: f.k === 0 ? 'every key closed' : `${f.open.length} open`, flex: 1.4 },
      { k: 'AIR COLUMN', v: `≈ ${Math.round(f.air / 10)} cm`, flex: 1 },
      { k: 'OCTAVE KEY', v: f.octaveKey ? 'OPEN' : 'CLOSED', tint: f.octaveKey ? '#ffc64d' : undefined, flex: 1 },
    ];
    const shapeParams: DockParam[] = [
      {
        kind: 'options',
        id: 'shape',
        label: 'SHAPE',
        valueLabel: shape === 1 ? '1 · THE NOTE' : '2 · AN OCTAVE UP',
        selectedId: String(shape),
        onSelect: (id) => setShape(id === '2' ? 2 : 1),
        sticky: true,
        options: [
          { id: '1', label: 'SHAPE 1 · THE NOTE', blurb: 'The air column’s lowest shape: the note the fingering plays in the first register.' },
          { id: '2', label: 'SHAPE 2 · AN OCTAVE UP', blurb: 'The next shape: twice the pitch. The octave key’s vent opens at its still point.' },
        ],
      },
      {
        kind: 'fader',
        id: 'swing',
        label: 'SWING',
        value: (swing + 1) / 2,
        home: 1,
        onChange: (v) => setSwing(Math.round((v * 2 - 1) * 20) / 20),
        format: () => (Math.abs(swing) < 0.05 ? 'passing through zero' : `${Math.round(Math.abs(swing) * 100)} % of its swing, ${swing > 0 ? 'above' : 'below'} the room’s pressure`),
        formatShort: () => `${Math.round(swing * 100)} %`,
      },
    ];
    const shapeBezel: BezelItem[] = [
      { k: 'SHAPE', v: `${shape}`, flex: 0.7 },
      { k: 'PITCH', v: shape === 1 ? 'THE NOTE' : '× 2 · OCTAVE', flex: 1.3 },
      { k: 'STILL POINTS', v: shape === 1 ? 'OPEN END' : 'MIDDLE · END', flex: 1.4 },
      { k: 'OCTAVE VENT', v: shape === 1 ? 'CLOSED' : 'OPEN', tint: shape === 2 ? '#ffc64d' : undefined, flex: 1 },
    ];

    const pred = lesson.predictions.sound;
    const reached = shown >= n;
    const register = f.register === 1 ? 'first' : 'second';
    const steps: MikingStep[] = [
      {
        key: 'strike',
        title: 'Breath to sound',
        kind: 'LEARN',
        layout: 'rack',
        rack: {
          render: (w, h) => <SaxBreath w={w} h={h} row={row} reveal={reveal} shown={shown} s={cfg.breathNote} accessibilityLabel={`${cfg.subject}, playing written ${breathF.written}. Event ${shown} of ${n}: ${stage.title}. ${stage.text}`} />,
          badge: `The ${lesson.noun.one} face-on · written ${breathF.written} · the order of events, not their speed · silent`,
          bezel: strikeBezel,
          params: strikeParams,
          initialParam: 'step',
        },
        well: (
          <>
            {pred ? <PredictCard p={pred} value={predicted} onPick={setPredicted} /> : null}
            <Landing looking={`The ${lesson.noun.one} face-on, playing one note`} prompt="STEP through it, or PLAY ONCE — it stops at the end. Nothing here makes a sound." />
            <Card>
              <Point title={`${shown} · ${stage.title.toUpperCase()}`}>{stage.text}</Point>
            </Card>
            {reached && predicted != null ? <Note tone="ok">{`You predicted “${predicted}”. ${cfg.reveal}`}</Note> : null}
            {reached ? <Note>{S.body}</Note> : null}
          </>
        ),
      },
      {
        key: 'leaves',
        title: 'Where the sound leaves',
        kind: 'COMPARE',
        layout: 'rack',
        rack: {
          render: (w, h) => (
            <SaxFingering
              w={w}
              h={h}
              row={row}
              s={note}
              accessibilityLabel={`The ${lesson.noun.one} face-on, fingering written ${f.written} (it sounds ${f.sounding}), ${register} register. ${f.k === 0 ? 'Every key is closed: the air column runs to the bell, and the note leaves the bell.' : `${f.open.length} holes are open from the bell end; the first open hole is number ${f.k}, and the note leaves mostly there and at the next open holes, with the high harmonics at the bell.`}${f.octaveKey ? ' The octave key is open.' : ''}`}
            />
          ),
          badge: 'A simplified fingering: every hole open from the bell end up to the first open hole · rings show where the sound leaves, not how loud · silent',
          bezel: noteBezel,
          params: noteParams,
          initialParam: 'note',
        },
        well: (
          <>
            <Landing looking={`Written ${f.written} · ${register} register`} prompt="Pick a NOTE, or PLAY THE SCALE — it climbs one note at a time and stops at the top (PAUSE any time). Watch where the first open hole goes." />
            <Card>
              <Point title={f.k === 0 ? 'EVERY KEY CLOSED' : `FIRST OPEN HOLE · ${f.k}`}>
                {f.k === 0
                  ? `With every key closed the air column runs the whole length of the horn, about ${Math.round(f.air / 10)} cm as the air sees it, and the lowest note leaves through the bell.`
                  : `The holes from the bell end up to hole ${f.k} are open. The air column acts as if the tube ended at the first open hole — about ${Math.round(f.air / 10)} cm as the air sees it — so most of this note leaves there and at the open holes just past it. The bell still carries its high harmonics.`}
              </Point>
              <Point title={f.register === 1 ? 'FIRST REGISTER' : 'SECOND REGISTER · OCTAVE KEY'}>
                {f.register === 1
                  ? `Up the scale, each note opens one more hole: the first open hole climbs toward the mouthpiece, and the air column gets about 6 % shorter each time. A fixed mic close to the body hears the sound move along it.`
                  : `Above written ${fingering(row, REGISTER_TOP).written} the octave key opens a small vent and the same holes play an octave higher: the first open hole drops back down the body and climbs again.`}
              </Point>
            </Card>
            <Note>{cfg.bellNote}</Note>
            {seenNotes.size >= 6 ? null : <Note>Try the lowest note, a note in the middle, and one above the octave key.</Note>}
          </>
        ),
      },
      {
        key: 'registers',
        title: 'Low and high registers',
        kind: 'COMPARE',
        layout: 'rack',
        rack: {
          render: (w, h) => (
            <ConeShapes w={w} h={h} n={shape} swing={swing} accessibilityLabel={`The air column straightened into a cone, from the reed end to the open end. The pressure along it in shape ${shape}: ${shape === 1 ? 'largest at the reed end, falling to a still point at the open end' : 'largest at the reed end, a still point in the middle and another at the open end; the octave vent opens at the middle still point'}. Swing ${Math.round(swing * 100)} percent.`} />
          ),
          badge: 'The air column straightened out: a simplified cone · drag SWING by hand · silent',
          bezel: shapeBezel,
          params: shapeParams,
          initialParam: 'shape',
        },
        well: (
          <>
            <Landing looking={`The air column as a cone · shape ${shape}`} prompt="Switch SHAPE, then drag SWING by hand. Where does the pressure stay still?" />
            <Card>
              <Point title={shape === 1 ? 'SHAPE 1 · THE NOTE' : 'SHAPE 2 · AN OCTAVE UP'}>
                {shape === 1
                  ? 'The air in the cone swings above and below the room’s pressure: most at the reed end, still at the open end, where the air meets the room. This is the note the fingering plays.'
                  : 'The next shape has a still point in the middle as well as at the open end, and sounds twice the pitch — an octave up. A small vent opened right at that still point barely disturbs shape 2 but spoils shape 1, so the reed settles on shape 2.'}
              </Point>
            </Card>
            <Note>{cfg.registerNote}</Note>
          </>
        ),
      },
      {
        key: 'body',
        title: 'Attack and body',
        kind: 'CHECK',
        layout: 'read',
        body: (
          <>
            <Card>
              <Point title="ATTACK">{S.attack}</Point>
              <Point title="BODY">{S.body}</Point>
            </Card>
            <Note>{cfg.silentNote}</Note>
            <ScenarioList items={lesson.scenarios.filter((s) => s.page === 'sound')} answers={answers} onAnswered={onAnswered} />
          </>
        ),
      },
    ];
    return <PageSteps steps={steps} />;
  };
}
