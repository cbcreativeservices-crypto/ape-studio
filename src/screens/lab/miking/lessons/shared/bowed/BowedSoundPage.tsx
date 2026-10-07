/**
 * Page 2 — HOW IT SOUNDS, for the bowed family (LESSON_JOURNEY §6 stage 2,
 * §7 "strings"). The lesson's own page (LessonArt.pages.sound): the drum
 * page's membranes do not fit a string. FULLY SILENT (owner ruling).
 *
 *   BOW TO SOUND (rack)        PREDICT FIRST, then the events on a cross-
 *                              section at the bridge, numbered: STEP through
 *                              them, or PLAY ONCE (a staged reveal that stops
 *                              at the end — not a loop, D8). Under reduced
 *                              motion PLAY advances one step, instantly.
 *   THE STRING'S SHAPES (rack) one ideal shape sin(nπx) at a time: its still
 *                              points, its whole-number pitch ratio, and how
 *                              much it moves under the bow or finger. SWING is
 *                              dragged by hand.
 *   HOW THE BOW KEEPS IT GOING / HOW A PLUCK RINGS (rack)
 *                              one cycle of the ideal bowed (Helmholtz) or
 *                              plucked string, dragged by hand through PHASE.
 *   ATTACK AND BODY (read)     in words, then the three checks.
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
import type { BowedSpec } from './bowedSpec.ts';
import { CrossSection, StringMotion, StringShapes, type Excite } from './BowedSoundArt';
import { bowState, helmholtzCorner, nodesOf, shareAt } from './stringModel.ts';

const STEP_MS = 1300;

function useFocusedSafe(): boolean {
  try {
    return useIsFocused();
  } catch {
    return true; // the web preview harness mounts the page outside a navigator
  }
}

/** What one lesson's sound page needs. */
export type BowedSoundConfig = {
  spec: BowedSpec;
  excite: Excite;
  /** The string drawn in the shapes steps ("the open C string"), its pitch. */
  stringName: string;
  hz: number;
  /** Where the bow or finger meets the string: fractions of the length from
   *  the bridge (frame B contact / pluck points ÷ the string length). */
  points: readonly { id: string; label: string; at: number; blurb: string }[];
  pointDefault: string;
  /** The cross-section's subject, for the screen reader. */
  subject: string;
  /** A short line under each step's prompt, for this instrument. */
  shapesNote: string;
  motionNote: string;
  silentNote: string;
  /** After the sequence's end, with a prediction made. */
  reveal: string;
};

const fmtHz = (hz: number) => (hz >= 1000 ? `${(hz / 1000).toFixed(hz >= 10000 ? 0 : 1)} kHz` : `${Math.round(hz)} Hz`);

export function makeBowedSoundPage(cfg: BowedSoundConfig): (p: PageProps) => ReactNode {
  return function BowedSound({ lesson, answers, onAnswered, onInteractive, interactiveDone, hidden }: PageProps) {
    const S = lesson.sound;
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

    /* the string's shapes */
    const [shapeN, setShapeN] = useState(1);
    const [swing, setSwing] = useState(1);
    const [pointId, setPointId] = useState(cfg.pointDefault);
    const point = cfg.points.find((q) => q.id === pointId) ?? cfg.points[0];
    const share = shareAt(shapeN, point.at);
    const sharePct = Math.round(share * 100);
    const nodes = nodesOf(shapeN);

    /* the motion */
    const [phase, setPhase] = useState(0.2);
    const corner = helmholtzCorner(phase);
    const state = bowState(point.at, phase);

    const bowWord = cfg.excite === 'bow' ? 'the bow' : 'the finger';
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
      { k: 'STRING', v: shown <= 1 ? (cfg.excite === 'bow' ? 'GRIPPED' : 'PULLED') : shown === 2 ? (cfg.excite === 'bow' ? 'SLIPS' : 'RELEASED') : 'VIBRATING', flex: 1.2 },
      { k: 'BRIDGE', v: shown >= 3 ? 'ROCKING' : 'AT REST', flex: 1.1 },
      { k: 'TOP', v: shown >= 4 ? 'MOVING' : 'AT REST', flex: 1 },
    ];
    const shapeParams: DockParam[] = [
      {
        kind: 'fader',
        id: 'shape',
        label: 'SHAPE',
        value: (shapeN - 1) / 7,
        onChange: (v) => setShapeN(1 + Math.round(v * 7)),
        format: () => `shape ${shapeN} · ${shapeN - 1 === 0 ? 'no still points' : `${shapeN - 1} still point${shapeN - 1 > 1 ? 's' : ''}`}`,
        formatShort: () => `${shapeN}`,
      },
      {
        kind: 'fader',
        id: 'swing',
        label: 'SWING',
        value: (swing + 1) / 2,
        home: 1,
        onChange: (v) => setSwing(Math.round((v * 2 - 1) * 20) / 20),
        format: () => (Math.abs(swing) < 0.05 ? 'passing through straight' : `${Math.round(Math.abs(swing) * 100)} % of its swing, ${swing > 0 ? 'one way' : 'the other way'}`),
        formatShort: () => `${Math.round(swing * 100)} %`,
      },
      {
        kind: 'options',
        id: 'point',
        label: cfg.excite === 'bow' ? 'BOW AT' : 'PLUCK AT',
        valueLabel: point.label,
        selectedId: pointId,
        onSelect: setPointId,
        sticky: true,
        options: cfg.points.map((q) => ({ id: q.id, label: q.label, blurb: q.blurb })),
      },
    ];
    const shapeBezel: BezelItem[] = [
      { k: 'SHAPE', v: `${shapeN}`, flex: 0.7 },
      { k: 'PITCH', v: `× ${shapeN}`, sub: fmtHz(cfg.hz * shapeN), flex: 1 },
      { k: cfg.excite === 'bow' ? 'UNDER THE BOW' : 'UNDER THE FINGER', v: `${sharePct} %`, sub: 'of its peak', tint: share < 0.05 ? '#ff6b5e' : undefined, flex: 1.4 },
      { k: 'STILL POINTS', v: nodes.length ? `${nodes.length}` : 'NONE', flex: 1 },
    ];
    const motionParams: DockParam[] = [
      {
        kind: 'fader',
        id: 'phase',
        label: 'PHASE',
        value: phase,
        onChange: (v) => setPhase(Math.min(0.995, Math.round(v * 200) / 200)),
        format: () => `${Math.round(phase * 100)} % through one cycle`,
        formatShort: () => `${Math.round(phase * 100)} %`,
      },
      {
        kind: 'options',
        id: 'point',
        label: cfg.excite === 'bow' ? 'BOW AT' : 'PLUCK AT',
        valueLabel: point.label,
        selectedId: pointId,
        onSelect: setPointId,
        sticky: true,
        options: cfg.points.map((q) => ({ id: q.id, label: q.label, blurb: q.blurb })),
      },
    ];
    const motionBezel: BezelItem[] =
      cfg.excite === 'bow'
        ? [
            { k: 'PHASE', v: `${Math.round(phase * 100)} %`, flex: 0.8 },
            { k: 'UNDER THE BOW', v: state === 'stick' ? 'STICKING' : 'SLIPPING', tint: state === 'slip' ? '#ffc64d' : undefined, flex: 1.3 },
            { k: 'CORNER', v: corner.outbound ? 'TO THE NUT' : 'TO THE BRIDGE', flex: 1.3 },
            { k: 'SLIPS FOR', v: `${Math.round(point.at * 100)} %`, sub: 'per cycle', flex: 1 },
          ]
        : [
            { k: 'PHASE', v: `${Math.round(phase * 100)} %`, flex: 0.8 },
            { k: 'SHAPE', v: Math.abs(phase - 0.5) < 0.01 ? 'MIRRORED' : phase < 0.01 ? 'AS PLUCKED' : 'TWO CORNERS', flex: 1.4 },
            { k: 'PLUCKED AT', v: `${Math.round(point.at * 100)} %`, sub: 'of the length', flex: 1.2 },
          ];

    const pred = lesson.predictions.sound;
    const reached = shown >= n;
    const steps: MikingStep[] = [
      {
        key: 'strike',
        title: cfg.excite === 'bow' ? 'Bow to sound' : 'Pluck to sound',
        kind: 'LEARN',
        layout: 'rack',
        rack: {
          render: (w, h) => (
            <CrossSection w={w} h={h} spec={cfg.spec} excite={cfg.excite} reveal={reveal} shown={shown} accessibilityLabel={`${cfg.subject}. Event ${shown} of ${n}: ${stage.title}. ${stage.text}`} />
          ),
          badge: 'Cut across at the bridge, seen along the strings · the order of events, not their speed · motion drawn much larger · silent',
          bezel: strikeBezel,
          params: strikeParams,
          initialParam: 'step',
        },
        well: (
          <>
            {pred ? <PredictCard p={pred} value={predicted} onPick={setPredicted} /> : null}
            <Landing looking="Across the instrument at the bridge, looking along the strings" prompt="STEP through it, or PLAY ONCE — it stops at the end. Nothing here makes a sound." />
            <Card>
              <Point title={`${shown} · ${stage.title.toUpperCase()}`}>{stage.text}</Point>
            </Card>
            {reached && predicted != null ? <Note tone="ok">{`You predicted “${predicted}”. ${cfg.reveal}`}</Note> : null}
            {reached ? <Note>{S.body}</Note> : null}
          </>
        ),
      },
      {
        key: 'shapes',
        title: 'The string’s shapes',
        kind: 'COMPARE',
        layout: 'rack',
        rack: {
          render: (w, h) => (
            <StringShapes
              w={w}
              h={h}
              n={shapeN}
              swing={swing}
              at={point.at}
              excite={cfg.excite}
              accessibilityLabel={`${cfg.stringName}, from the bridge to the nut, in shape ${shapeN}: ${nodes.length ? `${nodes.length} still points` : 'no still points'}, ${shapeN} times the open string's pitch. Under ${bowWord}, ${point.label.toLowerCase()}, it moves ${sharePct} percent of its peak.`}
            />
          ),
          badge: 'A simplified string, fixed at the bridge and the nut · motion drawn much larger · silent',
          bezel: shapeBezel,
          params: shapeParams,
          initialParam: 'shape',
        },
        well: (
          <>
            <Landing looking={`${cfg.stringName} · shape ${shapeN}`} prompt={`Step through SHAPE, then try each place for ${bowWord}. Which shapes does ${bowWord} leave still?`} />
            <Card>
              <Point title={`SHAPE ${shapeN} · ${shapeN} × THE PITCH`}>
                {`A string vibrates in several shapes at once; this is one of them. Its pitch is ${shapeN === 1 ? 'the note itself' : `${shapeN} times the note’s — a whole number, which is why a string sounds clearly pitched (a drumhead’s shapes are not whole-number multiples)`}. Under ${bowWord} the string moves ${sharePct} % of this shape’s peak. ${share < 0.05 ? `That is a still point of this shape: ${bowWord} cannot drive it there, so this overtone goes missing.` : `That is not a still point, so ${bowWord} can drive this shape. Move ${bowWord} along the string and a different set of shapes gets a still point under it — the overtones change.`}`}
              </Point>
            </Card>
            <Note>{cfg.shapesNote}</Note>
          </>
        ),
      },
      {
        key: 'keepsGoing',
        title: cfg.excite === 'bow' ? 'How the bow keeps it going' : 'How a pluck rings',
        kind: 'COMPARE',
        layout: 'rack',
        rack: {
          render: (w, h) => (
            <StringMotion
              w={w}
              h={h}
              phase={phase}
              at={point.at}
              excite={cfg.excite}
              accessibilityLabel={
                cfg.excite === 'bow'
                  ? `The bowed string, ${Math.round(phase * 100)} percent through one cycle: two straight lines meeting at a corner that is travelling toward the ${corner.outbound ? 'nut' : 'bridge'}. Under the bow the string is ${state === 'stick' ? 'sticking to the hair' : 'slipping back'}.`
                  : `The plucked string, ${Math.round(phase * 100)} percent through one cycle: the starting triangle has split into two corners travelling apart.`
              }
            />
          ),
          badge: cfg.excite === 'bow' ? 'A simplified bowed string: the corner’s path dashed · drag PHASE by hand · silent' : 'A simplified plucked string: the starting shape dashed · drag PHASE by hand · silent',
          bezel: motionBezel,
          params: motionParams,
          initialParam: 'phase',
        },
        well: (
          <>
            <Landing looking={cfg.excite === 'bow' ? 'One cycle of a bowed string' : 'One cycle of a plucked string'} prompt={`Drag PHASE through one cycle, by hand. Then move the ${cfg.excite === 'bow' ? 'bow' : 'pluck'} point and drag again.`} />
            <Card>
              <Point title={cfg.excite === 'bow' ? (state === 'stick' ? 'STICKING' : 'SLIPPING') : 'TWO CORNERS'}>
                {cfg.excite === 'bow'
                  ? `The string is two straight lines meeting at a corner, and the corner runs to the nut and back once every cycle. Under the bow the string ${state === 'stick' ? 'is gripped by the hair and moves with the bow' : 'has been let go and slips back quickly'}. It slips only while the corner passes between the bridge and the bow — here about ${Math.round(point.at * 100)} % of each cycle — and sticks for the rest.`
                  : 'The released triangle splits into two corners that run apart, bounce off the ends and meet again: half a cycle on, the string is the same triangle, mirrored and upside down. With nothing to keep it going, the note dies away.'}
              </Point>
            </Card>
            <Note>{cfg.motionNote}</Note>
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
