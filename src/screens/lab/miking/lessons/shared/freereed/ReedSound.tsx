/**
 * HOW IT SOUNDS for a FREE REED (Lab 3's harmonica and accordion) — stage 2
 * of the journey (LESSON_JOURNEY §6), in four steps:
 *   1  AIR TO SOUND (rack): one reed cut open, stepped through (or played
 *      ONCE): the air arrives, pushes the reed through its slot, the reed
 *      springs back, and keeps swinging — the air leaves in puffs. Reaching
 *      the last step is the page's activity.
 *   2  THE REED'S SHAPES (rack): an ideal clamped-free bar's vibration
 *      shapes, swung by hand — still points, which parts move, how far apart
 *      the shapes' pitches sit.
 *   3  the lesson's own step (rack): where the sound LEAVES this instrument
 *      — the harmonica's hand chamber, the accordion's bellows and two sides.
 *   4  ATTACK AND BODY (read), then the checks.
 * FULLY SILENT; nothing loops (PLAY ONCE stops at the end, D8); every state
 * is reachable by STEP; reduced motion turns PLAY ONCE into steps.
 */
import { useEffect, useMemo, useState } from 'react';
import type { BezelItem, DockParam } from '../../../../rack/rackTypes';
import { PageSteps, type MikingStep } from '../../../engine/steps';
import { Body, Card, Landing, Note, Point, PredictCard, ScenarioList } from '../../../engine/kit';
import type { PageProps } from '../../../pages/pageTypes';
import { useStepper } from '../hand/handPages';
import { REED_RATIOS, reedNodes } from './reedModel.ts';
import { ReedSequence, ReedShapes } from './ReedArt';

export type ReedSoundSpec = {
  voice: 'harmonica' | 'accordion';
  /** The bezel's words per step (4 each). */
  cells: { k: string; at: readonly string[]; flex?: number }[];
  seqLooking: string;
  /** The lesson's own third step (a hook: called on every render). */
  useWhere: (p: PageProps) => MikingStep;
  /** One line under the shapes: what the shapes mean for THIS instrument. */
  shapesNote: string;
  silentNote: string;
};

const SHAPE_WORDS = ['the lowest shape: the whole tongue bends one way, most at the tip', 'shape 2: one still point near the tip', 'shape 3: two still points', 'shape 4: three still points'];

export function makeReedSound(spec: ReedSoundSpec) {
  return function ReedSound(p: PageProps) {
    const { lesson, answers, onAnswered, onInteractive, interactiveDone, variant, hidden } = p;
    const S = lesson.sound;
    const n = S.stages.length;
    const st = useStepper(n, hidden);
    const [predicted, setPredicted] = useState<string | null>(null);
    useEffect(() => {
      if (st.shown >= n && !interactiveDone.has('soundPath')) onInteractive('soundPath');
    }, [st.shown, n, interactiveDone, onInteractive]);
    const stageText = (i: number) => S.stages[i].byVariant?.[variant] ?? S.stages[i].text;
    const pred = lesson.predictions.sound;
    const reached = st.shown >= n;
    const seqBezel: BezelItem[] = [{ k: 'STEP', v: `${st.shown} / ${n}`, flex: 0.8 }, ...spec.cells.map((c) => ({ k: c.k, v: c.at[Math.min(c.at.length - 1, st.shown - 1)] ?? '—', flex: c.flex ?? 1 }))];

    /* the shapes */
    const [mode, setMode] = useState(0);
    const [swing, setSwing] = useState(1);
    const [tried, setTried] = useState(false);
    const nodes = useMemo(() => reedNodes(mode), [mode]);
    const shapeParams: DockParam[] = [
      {
        kind: 'fader',
        id: 'shape',
        label: 'SHAPE',
        value: mode / 3,
        onChange: (v) => {
          const m = Math.round(v * 3);
          setMode(m);
          if (m > 0) setTried(true);
        },
        format: () => SHAPE_WORDS[mode],
        formatShort: () => `#${mode + 1}`,
      },
      {
        kind: 'fader',
        id: 'swing',
        label: 'SWING',
        value: (swing + 1) / 2,
        home: 1,
        onChange: (v) => setSwing(Math.round((v * 2 - 1) * 20) / 20),
        format: () => (Math.abs(swing) < 0.05 ? 'passing through rest' : `${Math.round(Math.abs(swing) * 100)} % of its swing, ${swing > 0 ? 'one way' : 'the other way'}`),
        formatShort: () => `${Math.round(swing * 100)} %`,
      },
    ];
    const shapeBezel: BezelItem[] = [
      { k: 'SHAPE', v: `${mode + 1}`, flex: 0.7 },
      { k: 'PITCH', v: `×${REED_RATIOS[mode].toFixed(2)}`, sub: 'the lowest', flex: 1.1 },
      { k: 'STILL POINTS', v: mode === 0 ? 'HELD END' : `${nodes.length} + HELD END`, flex: 1.4 },
    ];
    const where = spec.useWhere(p);

    const steps: MikingStep[] = [
      {
        key: 'seq',
        title: 'Air to sound',
        kind: 'WATCH',
        layout: 'rack',
        rack: {
          render: (w, h) => <ReedSequence w={w} h={h} shown={st.shown} voice={spec.voice} accessibilityLabel={`One reed cut open, step ${st.shown} of ${n}: ${S.stages[st.shown - 1].title}. ${stageText(st.shown - 1)}`} />,
          badge: 'The order of events, not their speed or size · one reed cut open · motion drawn larger · silent',
          bezel: seqBezel,
          params: st.params,
          initialParam: 'step',
        },
        well: (
          <>
            {pred ? <PredictCard p={pred} value={predicted} onPick={setPredicted} /> : null}
            <Landing looking={spec.seqLooking} prompt="STEP through how a reed turns moving air into sound — or PLAY ONCE. It stops at the end." />
            <Card>
              <Point title={`${st.shown} · ${S.stages[st.shown - 1].title.toUpperCase()}`}>{stageText(st.shown - 1)}</Point>
            </Card>
            <Body>{`Activity: ${reached ? 'done — you reached the last step' : `step ${st.shown} of ${n}`}.`}</Body>
            {reached && predicted != null ? <Note tone="ok">{`You predicted “${predicted}”. The reed is a valve that swings: it lets the air through in puffs, at its own frequency — the puffs are the sound.`}</Note> : null}
          </>
        ),
      },
      {
        key: 'shapes',
        title: 'The reed’s shapes',
        kind: 'TRY',
        layout: 'rack',
        rack: {
          render: (w, h) => <ReedShapes w={w} h={h} mode={mode} swing={swing} accessibilityLabel={`A reed held at one end, seen from the side, in vibration shape ${mode + 1}: ${SHAPE_WORDS[mode]}. Its pitch is ${REED_RATIOS[mode].toFixed(2)} times the lowest shape’s.`} />,
          badge: 'A simplified picture: an ideal bar held at one end · blue moving up, amber moving down · white dashes = still points',
          bezel: shapeBezel,
          params: shapeParams,
          initialParam: 'shape',
        },
        well: (
          <>
            <Landing looking="One reed from the side · held at the rivet, loose at the tip" prompt="Step through SHAPE, then drag SWING through rest and back. Where does the reed stay still?" />
            <Card>
              <Point title={`SHAPE ${mode + 1} · ${mode === 0 ? 'THE LOWEST' : `${nodes.length} STILL POINT${nodes.length === 1 ? '' : 'S'}`}`}>
                {mode === 0
                  ? 'The whole tongue bends one way, most at its loose tip, still only at the rivet. A reed swings mostly like this — it sets the note’s pitch.'
                  : `This shape’s pitch is ${REED_RATIOS[mode].toFixed(2)} times the lowest one’s — far apart, not a neat series of whole numbers. A reed’s rich tone comes mostly from how it chops the air into puffs, not from these higher shapes.`}
              </Point>
            </Card>
            <Note>{spec.shapesNote}</Note>
            {tried ? <Note tone="ok">The held end never moves; the tip moves most in the lowest shape. The higher shapes have still points along the tongue and sit far above the note.</Note> : null}
          </>
        ),
      },
      where,
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
            <Note>{spec.silentNote}</Note>
            <ScenarioList items={lesson.scenarios.filter((s) => s.page === 'sound')} answers={answers} onAnswered={onAnswered} />
          </>
        ),
      },
    ];
    return <PageSteps steps={steps} />;
  };
}
