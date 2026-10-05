/**
 * Page 2 — HOW IT SOUNDS, for the low / coiled brass (LESSON_JOURNEY §6
 * stage 2, §7 "air columns"). The lesson's own page (LessonArt.pages.sound):
 * the drum page's membranes do not fit a lip-buzzed tube. FULLY SILENT.
 *
 *   LIPS TO BELL (rack)    PREDICT FIRST, then the numbered events on the
 *                          player and instrument: STEP, or PLAY ONCE (a
 *                          staged reveal that stops at the end — never a loop,
 *                          D8; reduced motion: one step, instantly).
 *   THE AIR COLUMN (rack)  the tube unrolled: the ideal pipe's pressure shape
 *                          n — its still points, + and − halves — SWING by hand.
 *   WHERE IT LEAVES (rack) the bell's spread by register (a picture of where,
 *                          not how much); the horn: a plan with the wall behind
 *                          the player — the direct and the reflected path to a
 *                          listener in front, the extra distance and its delay;
 *                          a tuba or euphonium: BELL UP / BELL FRONT.
 *   ATTACK AND BODY (read) in words, then the three checks.
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
import type { LowBrassSpec, Orient } from './lowBrassSpec.ts';
import { brassScene } from './lowBrassScene.ts';
import { AirColumn, BellSpread, BuzzSequence, HornWallPlan, LISTENER } from './LowBrassSoundArt';
import { pipeRatio, reflection, stillPoints, type Register } from './airColumn.ts';

const STEP_MS = 1400;

function useFocusedSafe(): boolean {
  try {
    return useIsFocused();
  } catch {
    return true; // the web preview harness mounts the page outside a navigator
  }
}

export type LowBrassSoundConfig = {
  spec: LowBrassSpec;
  /** The instrument in a sentence, for the screen reader. */
  subject: string;
  /** The horn: the wall behind the player is part of the sound. */
  wall: boolean;
  /** A short line under each step. */
  shapesNote: string;
  spreadNote: string;
  silentNote: string;
  /** After the sequence's end, with a prediction made. */
  reveal: string;
  /** The register cards: what leaves where, for this instrument. */
  registers: Record<Register, string>;
};

const SPREAD_WORD: Record<Register, string> = { low: 'ALL ROUND', mid: 'WIDER', high: 'ALONG THE AXIS' };
const REG_LABEL: Record<Register, string> = { low: 'LOW NOTES', mid: 'MIDDLE', high: 'HIGH OVERTONES' };

export function makeLowBrassSoundPage(cfg: LowBrassSoundConfig): (p: PageProps) => ReactNode {
  return function LowBrassSound({ lesson, answers, onAnswered, onInteractive, interactiveDone, hidden, variant, setVariant }: PageProps) {
    const S = lesson.sound;
    const n = S.stages.length;
    const orient = (cfg.spec.orients.includes(variant as Orient) ? variant : cfg.spec.orients[0]) as Orient;
    const scene = brassScene(cfg.spec, orient);
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
    const stageText = stage.byVariant?.[variant] ?? stage.text;

    /* the air column */
    const [shapeN, setShapeN] = useState(1);
    const [swing, setSwing] = useState(1);
    const nodes = stillPoints(shapeN);

    /* where it leaves */
    const [register, setRegister] = useState<Register>('high');
    const [wallBehind, setWallBehind] = useState(1200);
    const refl = reflection(scene.bell.rim, LISTENER, scene.chair.back.min.x - wallBehind);

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
      { k: 'LIPS', v: 'BUZZING', flex: 1 },
      { k: 'AIR IN THE TUBE', v: shown <= 1 ? '—' : shown === 2 ? 'PULSE RUNS' : 'STANDING WAVE', flex: 1.4 },
      { k: 'BELL', v: shown <= 2 ? '—' : shown === 3 ? 'TURNS SOME BACK' : 'SOUND LEAVES', flex: 1.3 },
      ...(cfg.wall ? [{ k: 'ROOM', v: shown >= 5 ? 'WALL REFLECTS' : '—', flex: 1.2 }] : []),
    ];
    const shapeParams: DockParam[] = [
      {
        kind: 'fader',
        id: 'shape',
        label: 'SHAPE',
        value: (shapeN - 1) / 5,
        onChange: (v) => setShapeN(1 + Math.round(v * 5)),
        format: () => `shape ${shapeN} · ${shapeN} still point${shapeN > 1 ? 's' : ''}, the bell’s end included`,
        formatShort: () => `${shapeN}`,
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
      { k: 'SHAPE', v: `${shapeN}`, flex: 0.7 },
      { k: 'PLAIN TUBE', v: `× ${pipeRatio(shapeN)}`, sub: 'the lowest’s pitch', flex: 1.1 },
      { k: 'STILL POINTS', v: `${nodes.length}`, sub: 'bell end incl.', flex: 1.1 },
      { k: 'AT THE LIPS', v: 'MOST PRESSURE', flex: 1.3 },
    ];
    const regOption: DockParam = {
      kind: 'options',
      id: 'register',
      label: 'REGISTER',
      valueLabel: REG_LABEL[register],
      selectedId: register,
      onSelect: (id) => setRegister(id as Register),
      sticky: true,
      options: (['low', 'mid', 'high'] as const).map((r) => ({ id: r, label: REG_LABEL[r], blurb: cfg.registers[r] })),
    };
    const spreadParams: DockParam[] = cfg.wall
      ? [
          {
            kind: 'fader',
            id: 'wall',
            label: 'WALL',
            value: (wallBehind - 800) / 1700,
            onChange: (v) => setWallBehind(Math.round((800 + v * 1700) / 50) * 50),
            format: () => `the wall ${(wallBehind / 1000).toFixed(2)} m behind the chair`,
            formatShort: () => `${(wallBehind / 1000).toFixed(1)} m`,
          },
          regOption,
        ]
      : [
          regOption,
          ...(cfg.spec.orients.length > 1
            ? [
                {
                  kind: 'options' as const,
                  id: 'bell',
                  label: 'BELL',
                  valueLabel: orient === 'up' ? 'UP' : 'FRONT',
                  selectedId: orient,
                  onSelect: (id: string) => setVariant(id),
                  sticky: true,
                  options: lesson.model.variants.map((x) => ({ id: x.id, label: x.label, blurb: x.blurb })),
                },
              ]
            : []),
        ];
    const spreadBezel: BezelItem[] = cfg.wall
      ? [
          { k: 'SPREAD', v: SPREAD_WORD[register], flex: 1.2 },
          { k: 'DIRECT', v: `${(refl.direct / 1000).toFixed(1)} m`, flex: 0.9 },
          { k: 'BY THE WALL', v: `+ ${(refl.extra / 1000).toFixed(1)} m`, flex: 1.1 },
          { k: 'LATER BY', v: `${refl.delayMs.toFixed(1)} ms`, flex: 1 },
        ]
      : [
          { k: 'SPREAD', v: SPREAD_WORD[register], flex: 1.3 },
          { k: 'BELL FACES', v: orient === 'up' ? 'UP' : 'THE FRONT', flex: 1.1 },
          { k: 'SHOWN', v: 'WHERE, NOT HOW MUCH', flex: 1.6 },
        ];

    const pred = lesson.predictions.sound;
    const reached = shown >= n;
    const steps: MikingStep[] = [
      {
        key: 'buzz',
        title: 'Lips to bell',
        kind: 'LEARN',
        layout: 'rack',
        rack: {
          render: (w, h) => <BuzzSequence w={w} h={h} s={scene} reveal={reveal} shown={shown} n={n} wall={cfg.wall} accessibilityLabel={`${cfg.subject}. Event ${shown} of ${n}: ${stage.title}. ${stageText}`} />,
          badge: 'The order of events, not their speed · a simplified picture · silent',
          bezel: strikeBezel,
          params: strikeParams,
          initialParam: 'step',
        },
        well: (
          <>
            {pred ? <PredictCard p={pred} value={predicted} onPick={setPredicted} /> : null}
            <Landing looking="From the player’s right side" prompt="STEP through it, or PLAY ONCE — it stops at the end. Nothing here makes a sound." />
            <Card>
              <Point title={`${shown} · ${stage.title.toUpperCase()}`}>{stageText}</Point>
            </Card>
            {reached && predicted != null ? <Note tone="ok">{`You predicted “${predicted}”. ${cfg.reveal}`}</Note> : null}
            {reached ? <Note>{S.body}</Note> : null}
          </>
        ),
      },
      {
        key: 'column',
        title: 'The air column',
        kind: 'COMPARE',
        layout: 'rack',
        rack: {
          render: (w, h) => (
            <AirColumn
              w={w}
              h={h}
              n={shapeN}
              swing={swing}
              accessibilityLabel={`The ${lesson.noun.one}'s tube unrolled into a straight pipe, the lips at the left and the bell at the right, in pressure shape ${shapeN}: most pressure at the lips, ${nodes.length} still point${nodes.length > 1 ? 's' : ''} including the open bell end, ${pipeRatio(shapeN)} times the lowest shape's pitch in a plain tube.`}
            />
          ),
          badge: 'A simplified pipe: the coiled tube drawn straight, closed at the lips, open at the bell · motion drawn larger · silent',
          bezel: shapeBezel,
          params: shapeParams,
          initialParam: 'shape',
        },
        well: (
          <>
            <Landing looking={`The ${lesson.noun.one}’s tube, unrolled · pressure shape ${shapeN}`} prompt="Step through SHAPE, then drag SWING by hand. Where does the pressure stand still — and where is it always greatest?" />
            <Card>
              <Point title={`SHAPE ${shapeN} · ${nodes.length} STILL POINT${nodes.length > 1 ? 'S' : ''}`}>
                {`The air in the tube vibrates in standing waves; this is one of them. The pressure swings most at the lips (red ring), where the mouthpiece closes the tube, and stands still at the open bell (white dots: ${shapeN === 1 ? 'only the bell end' : `the bell end and ${nodes.length - 1} more along the tube`}). In a plain tube like this one the pitches would be 1, 3, 5 … times the lowest. A real ${lesson.noun.one}’s flaring bell and its mouthpiece pull them into a nearly whole-number series — so the lips can pick a whole row of notes without touching a valve.`}
              </Point>
            </Card>
            <Note>{cfg.shapesNote}</Note>
          </>
        ),
      },
      {
        key: 'spread',
        title: 'Where it leaves',
        kind: 'COMPARE',
        layout: 'rack',
        rack: {
          render: (w, h) =>
            cfg.wall ? (
              <HornWallPlan
                w={w}
                h={h}
                s={scene}
                wallBehind={wallBehind}
                register={register}
                accessibilityLabel={`From above: the horn player, the bell pointing back toward a wall ${(wallBehind / 1000).toFixed(1)} metres behind the chair, and a listener in front. The sound reaching the listener by the wall travels ${(refl.extra / 1000).toFixed(1)} metres farther than the direct way and arrives ${refl.delayMs.toFixed(1)} milliseconds later. ${REG_LABEL[register]}: ${cfg.registers[register]}`}
              />
            ) : (
              <BellSpread w={w} h={h} s={scene} register={register} accessibilityLabel={`From the player's right: the ${lesson.noun.one} with its bell ${orient === 'up' ? 'up' : 'to the front'}. ${REG_LABEL[register]}: ${cfg.registers[register]}`} />
            ),
          badge: cfg.wall ? 'From above · straight paths, one reflection · a simplified picture of where the sound goes, not how much · silent' : 'Where the sound goes, not how much · a simplified picture · silent',
          bezel: spreadBezel,
          params: spreadParams,
          initialParam: cfg.wall ? 'wall' : 'register',
        },
        well: (
          <>
            <Landing looking={cfg.wall ? 'From above · the wall behind, a listener in front' : `From the player’s right · the bell ${orient === 'up' ? 'up' : 'to the front'}`} prompt={cfg.wall ? 'Move the WALL, then switch REGISTER. Which way does the bell send the high overtones — and how do they reach a listener in front?' : 'Switch REGISTER, then turn the BELL. Where would a mic hear the high overtones most strongly?'} />
            <Card>
              <Point title={REG_LABEL[register]}>{cfg.registers[register]}</Point>
              {cfg.wall ? <Point title="BY THE WALL">{`The way by the wall is ${(refl.extra / 1000).toFixed(1)} m longer than the direct way here, so that sound arrives about ${refl.delayMs.toFixed(1)} ms later. A hard wall sends it on brightly, a curtain softens it — part of the horn’s sound in the room.`}</Point> : null}
            </Card>
            <Note>{cfg.spreadNote}</Note>
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
            {!reached ? <Note tone="warn">The sequence on step 1 has not reached its end yet — step it through to earn this page’s credit.</Note> : null}
            <ScenarioList items={lesson.scenarios.filter((s) => s.page === 'sound')} answers={answers} onAnswered={onAnswered} />
          </>
        ),
      },
    ];
    return <PageSteps steps={steps} />;
  };
}
