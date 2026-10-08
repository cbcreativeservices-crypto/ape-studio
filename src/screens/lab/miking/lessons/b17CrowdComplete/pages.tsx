/**
 * B17 CROWD AND COMPLETE SPORTS COVERAGE — the lesson's own pages
 * (LessonArt.pages), on the journey (docs/labs/miking/LESSON_JOURNEY.md),
 * built from the shared sports steps (lessons/shared/sports/):
 *
 *   MEET IT          START → WHAT IT IS (the mock venue) → THE VENUES (an
 *                    indoor arena, a stadium, a rink — the crowd and the PA
 *                    all round) → WHERE THE SOUND COMES FROM (A and U1–U3
 *                    from S) → checks
 *   STARTING SETUPS  the setups drawn on the plans → what else the mics hear
 *                    → before any mic (the one sports safety card) + checks
 *   MICROPHONES      the audience arrays compared → Mid-Side width → checks
 *   PLACEMENT        the worked example → MOVE and AIM the pair in the mock
 *                    venue → how the starting points work → checks
 *   LIVE CHECKS      plan the coverage (roles × layouts, the failure drill)
 *                    → where each feed goes → the downmix → checks
 *   TWO MICS         the action mic and the audience pair on one moving
 *                    clap → the calculated example → checks
 * TROUBLESHOOT and PRACTICE are the engine's. Suggested starting points in
 * plain words; no sources or badges on screen; FULLY SILENT; nothing moves
 * by itself.
 */
import { useCallback, useState, type ReactNode } from 'react';
import type { SourcePageId } from '../../engine/model/types.ts';
import { PageSteps, type MikingStep } from '../../engine/steps';
import { Card, Point } from '../../engine/kit';
import { ExpandableFigure } from '../../../kit/ExpandableFigure';
import type { PageProps } from '../../pages/pageTypes';
import { factsStep, startStep } from '../shared/journeyPages';
import { FieldStage } from '../shared/field/FieldStage';
import { VenuePlan, venueLabels } from '../shared/sports/VenueArt';
import { PC, PRACTICE_CROWD } from '../shared/sports/practiceScenes.ts';
import { SPORTS_SAFETY } from '../shared/sports/safety.ts';
import { rectUV } from '../shared/sports/venuePlan.ts';
import { deltaTms, notchesHz } from '../../engine/physics/twoMic.ts';
import { useCoveragePlanStep, useDownmixStep, useMsWidthStep } from '../shared/sports/arenaPages';
import { useRoutingStep } from '../shared/broadcast/broadcastPages';
import type { RoutingPlan } from '../shared/broadcast/routing.ts';
import { beforeStep, checkStep, hearsStep, placementLearnStep, useMethodsStep, useOverlapStep, usePlacementStep, usePlanTourStep, useRangeStep, useSetupsStep, useWorkedStep, type Method } from '../shared/sports/sportsPages';
import type { SportId } from '../shared/sports/sportPlans.ts';
import { AB_S, B17_MS_SOURCES, B17_OVERLAP, B17_PLACE, B17_SETUPS, MONO_S, MS_S, ORTF_S, XY_S } from './model.ts';

type PageFn = (p: PageProps) => ReactNode;
const VENUES: readonly SportId[] = ['arena', 'soccer', 'hockey'];

/* ═════════ 1 · MEET IT ═════════ */

function B17Meet(p: PageProps) {
  const { lesson, journey } = p;
  const tour = usePlanTourStep({ sports: VENUES, title: 'The venues', prompt: 'Step through LAYER on each venue: the action, what stays clear, the routes, the approved places — and the crowd and the PA all round.', a11yLead: 'A plan of' });
  const range = useRangeStep({ scene: PRACTICE_CROWD, from: PC.S, fromH: PC.hS, fromLabel: 'S', prediction: lesson.predictions.meet, prompt: 'Step through TARGET: the action and the three audience places, as seen from the stereo centre S.' });
  const box = PRACTICE_CROWD.frame;
  const steps: MikingStep[] = [
    startStep(lesson, journey, '', { ownIntro: true }),
    factsStep(
      lesson,
      <ExpandableFigure
        badge="The mock venue from above · S behind the audience, D beside the action"
        title="THE MOCK VENUE"
        aspect={(box.x1 - box.x0) / (box.y1 - box.y0)}
        render={(w: number, h: number) => (
          <FieldStage w={w} h={h} view="top" box={rectUV(box)} a11y="The mock venue from above: the action point A, three audience places U1 to U3 two metres in front of the stereo centre S, the action mic D two metres beside A, and a separate commentary station." labels={venueLabels(PRACTICE_CROWD, { layers: true })}>
            {(px) => <VenuePlan scene={PRACTICE_CROWD} px={px} />}
          </FieldStage>
        )}
      />,
    ),
    tour,
    range,
    checkStep(p, 'meet'),
  ];
  return <PageSteps steps={steps} />;
}

/* ═════════ 2 · STARTING SETUPS ═════════ */

const ROWS = [SPORTS_SAFETY.approval, SPORTS_SAFETY.play, SPORTS_SAFETY.lightning, SPORTS_SAFETY.weather, SPORTS_SAFETY.electrics, SPORTS_SAFETY.hearing, SPORTS_SAFETY.feedback, SPORTS_SAFETY.withdraw];

function B17Setups(p: PageProps) {
  const setups = useSetupsStep({ p, scene: PRACTICE_CROWD, setups: B17_SETUPS, prompt: 'Step through SETUP. Each mic or pair is drawn at its approved place with its aim; the corner box shows it at its height.' });
  const steps: MikingStep[] = [setups, hearsStep(p.lesson, 'An audience mic hears the whole venue — and some things far more than others:'), beforeStep(p, ROWS)];
  return <PageSteps steps={steps} />;
}

/* ═════════ 3 · MICROPHONES ═════════ */

const METHODS: Method[] = [
  { id: 'mono', label: 'One mono audience mic', short: 'MONO', gives: 'A simple, stable audience bed — the fallback that survives the loss of everything else.', limit: 'No spatial information; a nearby voice or the PA can dominate one mic.', mics: [MONO_S] },
  { id: 'xy', label: 'A coincident XY pair', short: 'XY', gives: 'Width from level differences only: a solid mono sum.', limit: 'Its off-axis tone at the sides; the width depends on the angle between the capsules.', mics: [XY_S], note: 'A starting comparison: cardioids about 90° apart.' },
  { id: 'ortf', label: 'A near-coincident pair', short: 'NEAR-COINC.', gives: 'Level and arrival differences together: a wider, more open image.', limit: 'Some colour in the mono sum from the small spacing.', mics: [ORTF_S], note: 'Two cardioids 17 cm apart, 110° between their axes — a fixed geometry.' },
  { id: 'ab', label: 'Spaced omnis', short: 'SPACED', gives: 'A spacious picture with the venue’s low end.', limit: 'Larger arrival differences: a shared announcement or action transient can colour in mono; more nearby movement.', mics: [AB_S], note: 'A starting trial: about 0.5 m apart, the separation logged.' },
  { id: 'ms', label: 'Mid-Side', short: 'M/S', gives: 'A forward Mid and a side-facing figure-8, decoded to left and right — the width chosen after the capture.', limit: 'The Side’s lobes need to be oriented and decoded correctly; independent processing on the two paths breaks the matrix.', mics: [MS_S], note: 'Decode once; check that a source at the positive lobe appears on the intended side.' },
];

function B17Microphone(p: PageProps) {
  const methods = useMethodsStep({ scene: PRACTICE_CROWD, methods: METHODS, prediction: p.lesson.predictions.microphone, prompt: 'Choose each METHOD: what it gives the audience picture, and what limits it.', done: 'No array is flawless in every room: choose by the coverage you need and check every output — stereo, mono and any downmix.' });
  const ms = useMsWidthStep({ sources: B17_MS_SOURCES, onInteractive: p.onInteractive, done: p.interactiveDone.has('msWidth') });
  return <PageSteps steps={[methods, ms, checkStep(p, 'microphone')]} />;
}

/* ═════════ 4 · PLACEMENT ═════════ */

function B17Placement(p: PageProps) {
  const worked = useWorkedStep({
    scene: PRACTICE_CROWD,
    mic: XY_S,
    title: 'an XY audience pair at S',
    pieces: [
      { key: 'WHERE', value: 'S', title: 'WHERE TO BEGIN', text: 'The pair’s centre at S, in its own footprint behind the audience — no seat, aisle, exit or camera view blocked.' },
      { key: 'HEIGHT', value: '≈ 1.5 m', title: 'THE HEIGHT', text: 'The capsules about 1.5 m up. Higher hears a broader area but needs approved access; lower brings the nearest voices forward.' },
      { key: 'AIM', value: 'ON U2', title: 'THE AIM', text: 'The pair’s middle on U2, across the useful audience region — not at the nearest person. U1 and U3 lie about 27° to either side.' },
      { key: 'RANGE', value: '2.0 m', title: 'THE RANGE', text: 'About 2 m to U2, about 2.24 m to U1 and U3, about 4 m to the action at A — the lesson’s own layout.' },
      { key: 'L · R', value: 'NAMED', title: 'LEFT AND RIGHT', text: 'Name left and right from the chosen viewpoint, and check them with a gentle source at each side before the event.' },
    ],
  });
  const place = usePlacementStep({
    p,
    scene: PRACTICE_CROWD,
    zones: B17_PLACE,
    starts: B17_SETUPS.filter((s) => ['su.one', 'su.two', 'su.ms'].includes(s.id)),
    ranges: { x: [-0.7, 0.7], y: [-4.6, -2.4], h: [0.6, 2.0] },
    prediction: p.lesson.predictions.placement,
  });
  const steps: MikingStep[] = [
    worked,
    place,
    ...placementLearnStep(
      p,
      'After our research, each blue starting point is where we recommend you begin — a broad, stable viewpoint first, a closer one only for a named gap. They are starting points, not rules: move only the pair’s centre, keep the source the same, and listen in stereo and in mono. Experimentation is encouraged.',
      'For a real event, every viewpoint, platform and cable route is approved by the venue — no blocked seats, aisles, exits, accessibility routes or camera views.',
    ),
  ];
  return <PageSteps steps={steps} />;
}

/* ═════════ 5 · LIVE CHECKS (context) ═════════ */

const PLAN: RoutingPlan = {
  sources: [
    { id: 'comm', label: 'The commentary mic', short: 'COMMENTARY', kind: 'mic', level: 'mic' },
    { id: 'action', label: 'The action mic', short: 'ACTION', kind: 'mic', level: 'mic' },
    { id: 'aud', label: 'The audience pair', short: 'AUDIENCE', kind: 'ambience', level: 'mic' },
    { id: 'talk', label: 'The producer’s talkback', short: 'TALKBACK', kind: 'talkback', level: 'mic' },
  ],
  dests: ['program', 'recorder', 'pa', 'ifb'],
  sends: { comm: ['program', 'recorder'], action: ['program', 'recorder'], aud: ['program', 'recorder'], talk: ['ifb'] },
  needs: { program: ['comm', 'action', 'aud'] },
};

function B17Context(p: PageProps) {
  const { onInteractive, interactiveDone } = p;
  const [got, setGot] = useState<ReadonlySet<string>>(() => new Set());
  const note = useCallback(
    (id: string) => {
      setGot((prev) => {
        if (prev.has(id)) return prev;
        const n = new Set([...prev, id]);
        if (n.has('coveragePlan') && n.has('downmix') && !interactiveDone.has('liveChecks')) onInteractive('liveChecks');
        return n;
      });
    },
    [interactiveDone, onInteractive],
  );
  const plan = useCoveragePlanStep({ onInteractive: note, done: got.has('coveragePlan'), prediction: p.lesson.predictions.context });
  const routing = useRoutingStep({
    plan: PLAN,
    looks: { comm: { art: 'broadcastDynamic', r: 30, len: 190 }, action: { art: 'shotgun', r: 10.5, len: 220 }, aud: { art: 'sdc', r: 10.5, len: 104 }, talk: 'talkback' },
    switches: [
      {
        id: 'aud',
        label: 'AUDIENCE',
        options: [
          { id: 'feeds', label: 'Program and recorder', blurb: 'The audience pair goes to the program and the recording only.', sends: {} },
          { id: 'pa', label: 'Into the PA too', blurb: 'The audience pair is also sent to the venue PA.', sends: { aud: ['program', 'recorder', 'pa'] } },
        ],
      },
      {
        id: 'talk',
        label: 'TALKBACK',
        options: [
          { id: 'ifb', label: 'The earpiece only', blurb: 'The producer’s talkback reaches the commentator’s earpiece only.', sends: {} },
          { id: 'air', label: 'Onto the program too', blurb: 'The talkback is also sent to the program.', sends: { talk: ['ifb', 'program'] } },
        ],
      },
    ],
    words: {
      looking: 'A signal-flow drawing · commentary, action, audience and talkback',
      prompt: 'TRACE each source. Keep the audience out of the PA and the talkback off the air.',
      done: 'Commentary, action and audience each reach the program on their own faders, the audience stays out of the PA, and the talkback stays in the earpiece: a clean plan.',
    },
    points: [
      { title: 'INTERNATIONAL SOUND', text: 'An agreed effects and venue mix without the local commentary: what goes into it — the PA, music, interviews — is decided by the rights and the contract.' },
      { title: 'MUTED FOR TALKBACK', text: 'When the commentator mutes to talk to the producer, the audience bed stays steady underneath — the crowd should not vanish with the speech.' },
      { title: 'REPLAYS', text: 'Avoid doubled live and replay effects, and a delayed return looping back into the mix.' },
    ],
  });
  const down = useDownmixStep({ onInteractive: note, done: got.has('downmix') });
  return <PageSteps steps={[plan, routing, down, checkStep(p, 'context')]} />;
}

/* ═════════ 6 · TWO MICS ═════════ */

/** The calculated example (L157): a 3.43 m path difference, the calculator's speed of sound. */
const EX_DT = deltaTms(3430);
const EX_N = notchesHz(EX_DT, 1, 20000, 3);

function B17TwoMic(p: PageProps) {
  const overlap = useOverlapStep({
    scene: PRACTICE_CROWD,
    a: B17_OVERLAP.a,
    b: B17_OVERLAP.b,
    path: B17_OVERLAP.path,
    onInteractive: p.onInteractive,
    done: p.interactiveDone.has('polarityVsDelay'),
    prediction: p.lesson.predictions.twoMic,
    intro: 'The action mic D and the audience pair at S hear the same gentle clap. WALK it 1 m either way along the action area, and flip B’s POLARITY both ways: watch which readouts change.',
  });
  const lead = (
    <Card>
      <Point title="A CALCULATED EXAMPLE">{`A path difference of 3.43 m is about ${EX_DT.toFixed(0)} ms at the speed of sound; two equal copies of one sound that far apart cancel near ${EX_N.map((f) => `${Math.round(f)}`).join(', ')} Hz and on up. Real levels, reflections and responses make the notches shallower or move them — an idea to check by ear, not a stadium measurement.`}</Point>
      <Point title="USE A DELAY FOR A NAMED PROBLEM">Measure a stationary, shared transient, try a delay on the earlier path, keep an untouched comparison — and retest elsewhere. Avoid delaying the whole ambience to line it up with one action: the later room arrival can be the perspective you want.</Point>
    </Card>
  );
  return <PageSteps steps={[overlap, checkStep(p, 'twoMic', lead)]} />;
}

export const B17_PAGES: Partial<Record<SourcePageId, PageFn>> = {
  meet: B17Meet,
  setups: B17Setups,
  microphone: B17Microphone,
  placement: B17Placement,
  context: B17Context,
  twoMic: B17TwoMic,
};
export const B17_STEP_COUNTS: Partial<Record<SourcePageId, number>> = { meet: 5, setups: 3, microphone: 3, placement: 4, context: 4, twoMic: 2 };
