/**
 * Page 2 — HOW IT SOUNDS, for the woodwind family (LESSON_JOURNEY §6 stage
 * 2, §7 "air columns"). The family's own page (LessonArt.pages.sound): the
 * drum page's membranes do not fit an air column. FULLY SILENT.
 *
 *   BREATH TO SOUND (rack)       PREDICT FIRST, then the four numbered
 *                                events on the lesson's own instrument: STEP
 *                                through them, or PLAY ONCE (a staged reveal
 *                                that stops at the end — not a loop, D8);
 *                                under reduced motion PLAY advances one step.
 *   WHERE THE SOUND LEAVES (rack) NOTE: pick a note; the holes open up to
 *                                the first open hole, the air column that
 *                                sounds, its standing wave beside the tube
 *                                (SWING by hand), and where the sound leaves
 *                                — the first open hole, the bell or foot.
 *   OPEN OR CLOSED PIPE (rack)   the ideal pipe of this kind: RESONANCE n,
 *                                its still points; PIPE compares the other
 *                                kind (why a clarinet overblows a twelfth).
 *   ATTACK, BODY, BREATH AND KEYS (read)  in words, then the three checks.
 * Credit: the sequence reached its end ('soundPath') + the three checks.
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
import { windOf } from './windLesson.ts';
import { BreathToSound, NoteMap, PipeModes, type SoundFigure } from './WindSoundArt';
import { noteState, overblowRatio, partialsBelowCutoff, pressureNodes, topNote } from './windPhysics.ts';
import { endWordOf, type Bore } from './windSpec.ts';

const STEP_MS = 1400;

function useFocusedSafe(): boolean {
  try {
    return useIsFocused();
  } catch {
    return true; // the web preview harness mounts the page outside a navigator
  }
}

const fmtHz = (hz: number) => (hz >= 1000 ? `${(hz / 1000).toFixed(2)} kHz` : `${Math.round(hz)} Hz`);
const BORE_WORDS: Record<Bore, { name: string; left: string; right: string; series: string }> = {
  open: { name: 'OPEN AT BOTH ENDS', left: 'OPEN (THE EMBOUCHURE)', right: 'OPEN END', series: 'every whole-number multiple: ×1, ×2, ×3 …' },
  closed: { name: 'CLOSED AT THE REED', left: 'CLOSED (THE REED)', right: 'OPEN END', series: 'only the odd multiples: ×1, ×3, ×5 …' },
  cone: { name: 'A CONE FROM THE REED', left: 'THE CONE’S TIP (THE REED)', right: 'OPEN END', series: 'every whole-number multiple: ×1, ×2, ×3 …' },
};

export type WindSoundConfig = {
  fig: SoundFigure;
  /** The other kind of pipe to compare on step 3. */
  other: Bore;
  /** One line under step 2's card for this instrument. */
  notesNote: string;
  /** One line under step 3's card. */
  pipeNote: string;
  silentNote: string;
  /** After the sequence's end, with a prediction made. */
  reveal: string;
};

export function makeWindSoundPage(cfg: WindSoundConfig): (p: PageProps) => ReactNode {
  return function WindSound({ lesson, answers, onAnswered, onInteractive, interactiveDone, hidden }: PageProps) {
    const S = lesson.sound;
    const X = windOf(lesson);
    const spec = cfg.fig.L.spec;
    const n = S.stages.length;
    const motion = useAnimationsAllowed();
    const focused = useFocusedSafe();
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
    useEffect(() => {
      if ((hidden || !focused) && playing) stop();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hidden, focused]);
    useEffect(() => () => cancelAnimation(reveal), []); // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => {
      if (shown >= n && !interactiveDone.has('soundPath')) onInteractive('soundPath');
    }, [shown, n, interactiveDone, onInteractive]);
    const stage = S.stages[shown - 1];
    const edge = spec.family === 'edge';
    const endWord = endWordOf(spec).toUpperCase();
    const demo = noteState(spec, X?.noteDefault ?? 7);

    /* the notes */
    const top = topNote(spec);
    const [k, setK] = useState(X?.noteDefault ?? 7);
    const [swing, setSwing] = useState(1);
    const st = noteState(spec, k);
    const below = partialsBelowCutoff(spec, st.hz);

    /* the pipe */
    const [mode, setMode] = useState(1);
    const [pipeSwing, setPipeSwing] = useState(1);
    const [pipe, setPipe] = useState<'this' | 'other'>('this');
    const bore: Bore = pipe === 'this' ? spec.bore : cfg.other;
    const harmonic = bore === 'closed' ? 2 * mode - 1 : mode;
    const still = pressureNodes(bore, mode).length;

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
      { k: edge ? 'AIR JET' : 'REED', v: shown <= 1 ? (edge ? 'ACROSS THE HOLE' : 'PRESSED') : edge ? 'FLIPPING' : 'OPEN · CLOSE', flex: 1.3 },
      { k: 'AIR COLUMN', v: shown >= 3 ? 'RINGING' : 'AT REST', flex: 1.1 },
      { k: 'SOUND', v: shown >= 4 ? (demo.hole > 0 ? `HOLE ${demo.hole}` : endWord) : '—', flex: 1 },
    ];
    const noteParams: DockParam[] = [
      {
        kind: 'fader',
        id: 'note',
        label: 'NOTE',
        value: k / top,
        onChange: (v) => setK(Math.round(v * top)),
        format: () => `${st.name} · ${fmtHz(st.hz)} · ${st.register.toLowerCase()}`,
        formatShort: () => st.name,
      },
      {
        kind: 'fader',
        id: 'swing',
        label: 'SWING',
        value: (swing + 1) / 2,
        home: 1,
        onChange: (v) => setSwing(Math.round((v * 2 - 1) * 20) / 20),
        format: () => (Math.abs(swing) < 0.05 ? 'passing through the middle' : `${Math.round(Math.abs(swing) * 100)} % of its swing, ${swing > 0 ? 'one way' : 'the other way'}`),
        formatShort: () => `${Math.round(swing * 100)} %`,
      },
    ];
    const noteBezel: BezelItem[] = [
      { k: 'NOTE', v: st.name, sub: `${fmtHz(st.hz)}${st.n > 1 ? ' · upper' : ''}`, flex: 0.9 },
      { k: 'LEAVES FROM', v: st.hole > 0 ? `HOLE ${st.hole}` : endWord, tint: '#ffc64d', flex: 1.1 },
      { k: 'TUBE', v: `${Math.round(st.L / 10)} cm`, flex: 0.8 },
      { k: 'UNDER CUTOFF', v: below == null ? '—' : `${below}`, sub: below == null ? 'not measured' : 'partials', flex: 1.1 },
    ];
    const pipeParams: DockParam[] = [
      {
        kind: 'fader',
        id: 'mode',
        label: 'RESONANCE',
        value: (mode - 1) / 3,
        onChange: (v) => setMode(1 + Math.round(v * 3)),
        format: () => `resonance ${mode} · ×${harmonic} the lowest pitch`,
        formatShort: () => `${mode}`,
      },
      {
        kind: 'fader',
        id: 'swing',
        label: 'SWING',
        value: (pipeSwing + 1) / 2,
        home: 1,
        onChange: (v) => setPipeSwing(Math.round((v * 2 - 1) * 20) / 20),
        format: () => (Math.abs(pipeSwing) < 0.05 ? 'passing through the middle' : `${Math.round(Math.abs(pipeSwing) * 100)} % of its swing`),
        formatShort: () => `${Math.round(pipeSwing * 100)} %`,
      },
      {
        kind: 'options',
        id: 'pipe',
        label: 'PIPE',
        valueLabel: pipe === 'this' ? lesson.noun.one.toUpperCase().slice(0, 10) : 'COMPARE',
        selectedId: pipe,
        onSelect: (id) => setPipe(id as 'this' | 'other'),
        sticky: true,
        options: [
          { id: 'this', label: `THIS ${lesson.noun.one.toUpperCase()}’S KIND`, blurb: `${BORE_WORDS[spec.bore].name.toLowerCase()}: ${BORE_WORDS[spec.bore].series}` },
          { id: 'other', label: 'THE OTHER KIND', blurb: `${BORE_WORDS[cfg.other].name.toLowerCase()}: ${BORE_WORDS[cfg.other].series}` },
        ],
      },
    ];
    const pipeBezel: BezelItem[] = [
      { k: 'RESONANCE', v: `${mode}`, flex: 0.9 },
      { k: 'PITCH', v: `× ${harmonic}`, flex: 0.8 },
      { k: 'STILL POINTS', v: `${still}`, sub: 'open ends count', flex: 1.1 },
      { k: 'OVERBLOWS', v: overblowRatio(bore) === 3 ? 'A TWELFTH' : 'AN OCTAVE', flex: 1.1 },
    ];

    const pred = lesson.predictions.sound;
    const reached = shown >= n;
    const steps: MikingStep[] = [
      {
        key: 'strike',
        title: 'Breath to sound',
        kind: 'LEARN',
        layout: 'rack',
        rack: {
          render: (w, h) => <BreathToSound w={w} h={h} fig={cfg.fig} st={demo} reveal={reveal} shown={shown} accessibilityLabel={`${cfg.fig.subject}. Event ${shown} of ${n}: ${stage.title}. ${stage.text}`} />,
          badge: 'The order of events, not their speed · the air column’s pressure drawn beside the tube · silent',
          bezel: strikeBezel,
          params: strikeParams,
          initialParam: 'step',
        },
        well: (
          <>
            {pred ? <PredictCard p={pred} value={predicted} onPick={setPredicted} /> : null}
            <Landing looking={`The ${lesson.noun.one}, its keys toward you · one note (${demo.name})`} prompt="STEP through it, or PLAY ONCE — it stops at the end. Nothing here makes a sound." />
            <Card>
              <Point title={`${shown} · ${stage.title.toUpperCase()}`}>{stage.text}</Point>
            </Card>
            {reached && predicted != null ? <Note tone="ok">{`You predicted “${predicted}”. ${cfg.reveal}`}</Note> : null}
            {reached ? <Note>{S.body}</Note> : null}
          </>
        ),
      },
      {
        key: 'notes',
        title: 'Where the sound leaves',
        kind: 'COMPARE',
        layout: 'rack',
        rack: {
          render: (w, h) => (
            <NoteMap
              w={w}
              h={h}
              fig={cfg.fig}
              st={st}
              swing={swing}
              accessibilityLabel={`${cfg.fig.subject}. Note ${st.name}, ${Math.round(st.hz)} hertz, ${st.register.toLowerCase()}. ${st.hole > 0 ? `The first open hole is hole ${st.hole}; most of the sound leaves there` : `Every hole is closed; the sound leaves from the ${endWord.toLowerCase()}`}. The sounding air column is ${Math.round(st.L / 10)} centimetres long.`}
            />
          ),
          badge: 'A simplified fingering · holes where the semitone rule puts them · the pressure drawn beside the tube · silent',
          bezel: noteBezel,
          params: noteParams,
          initialParam: 'note',
        },
        well: (
          <>
            <Landing looking={`${st.name} · ${st.register.toLowerCase()}`} prompt="Slide NOTE from the lowest note up. Watch the first open hole move — and where the sound leaves." />
            <Card>
              <Point title={st.hole > 0 ? `HOLE ${st.hole} IS THE FIRST OPEN HOLE` : `EVERY HOLE CLOSED · THE ${endWord}`}>
                {st.hole > 0
                  ? `The air column behaves as if the tube ended just past the first open hole: here it sounds about ${Math.round(st.L / 10)} cm long, and most of this note leaves from that hole${edge ? ' — and from the embouchure hole, always' : ''}. One note higher opens the next hole along, nearer the end the player blows into.`
                  : `With every hole closed the whole tube sounds — its lowest note — and the sound leaves from the ${endWord.toLowerCase()}${edge ? ' and the embouchure hole' : ''}.`}
                {st.n > 1 ? ` This note is in the upper register: the same holes as ${spec.bore === 'closed' ? 'a twelfth' : 'an octave'} below, the tube ringing in its resonance ${st.n}.` : ''}
              </Point>
              <Point title="ABOVE THE CUTOFF">{spec.cutoff.hz == null ? `How far up the open holes stop letting the sound out has not been measured for this ${lesson.noun.one} — the upper partials of every note still travel on toward the ${endWord.toLowerCase()}.` : `Partials below about ${spec.cutoff.words} leave mostly by the first open holes; higher partials travel on past them and leave by holes farther down and the ${endWord.toLowerCase()} — so even a low note’s upper partials reach the ${endWord.toLowerCase()}.`}</Point>
            </Card>
            <Note>{cfg.notesNote}</Note>
          </>
        ),
      },
      {
        key: 'pipe',
        title: 'Open or closed pipe',
        kind: 'COMPARE',
        layout: 'rack',
        rack: {
          render: (w, h) => (
            <PipeModes
              w={w}
              h={h}
              bore={bore}
              n={mode}
              swing={pipeSwing}
              ends={{ left: BORE_WORDS[bore].left, right: BORE_WORDS[bore].right }}
              accessibilityLabel={`An ideal pipe, ${BORE_WORDS[bore].name.toLowerCase()}, in resonance ${mode}: ${harmonic} times the lowest pitch, with ${still} still points along it.`}
            />
          ),
          badge: `An ideal pipe, ${BORE_WORDS[bore].name.toLowerCase()} · the pressure along it beneath · drag SWING by hand · silent`,
          bezel: pipeBezel,
          params: pipeParams,
          initialParam: 'mode',
        },
        well: (
          <>
            <Landing looking={`${pipe === 'this' ? `The ${lesson.noun.one}’s kind of pipe` : 'The other kind, to compare'} · resonance ${mode}`} prompt="Step through RESONANCE. Then switch PIPE and compare which pitches each kind can make." />
            <Card>
              <Point title={`${BORE_WORDS[bore].name} · RESONANCE ${mode} · ×${harmonic}`}>
                {bore === 'closed'
                  ? `Closed at the reed, the pressure swings most there and stays still at the open end — so only odd multiples fit: ×1, ×3, ×5 and so on. The next resonance up is ×3, a twelfth: the register key jumps there.`
                  : bore === 'open'
                    ? `Open at both ends, the pressure stays still at both: every whole-number multiple fits: ×1, ×2, ×3 and so on. The next resonance up is ×2, an octave: blow a little harder and a flute or a piccolo jumps there.`
                    : `A cone from the reed’s end behaves like a pipe open at both ends: every whole-number multiple fits — ×1, ×2, ×3 and so on — and the next resonance up is ×2 — an octave.`}
              </Point>
            </Card>
            <Note>{cfg.pipeNote}</Note>
          </>
        ),
      },
      {
        key: 'body',
        title: 'Attack, body, breath and keys',
        kind: 'CHECK',
        layout: 'read',
        body: (
          <>
            <Card>
              <Point title="ATTACK">{S.attack}</Point>
              <Point title="BODY">{S.body}</Point>
              {X ? <Point title="BREATH">{X.breath}</Point> : null}
              {X ? <Point title="KEYS">{X.keys}</Point> : null}
              {X ? <Point title="WHERE THE SOUND GOES">{X.directivity}</Point> : null}
            </Card>
            <Note>{cfg.silentNote}</Note>
            {!reached ? <Note tone="warn">The sequence on step 1 has not reached its end yet — step it through to earn this page’s credit.</Note> : null}
            <ScenarioList items={lesson.scenarios.filter((s) => s.page === 'sound')} answers={answers} onAnswered={onAnswered} />
          </>
        ),
      },
    ];
    return <PageSteps steps={steps} />;
  };
}
