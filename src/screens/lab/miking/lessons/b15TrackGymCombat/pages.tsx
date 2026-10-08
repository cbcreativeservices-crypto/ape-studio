/**
 * B15 TRACK, GYMNASTICS AND COMBAT SPORTS — the lesson's own pages
 * (LessonArt.pages), on the journey (docs/labs/miking/LESSON_JOURNEY.md),
 * built from the shared sports steps (lessons/shared/sports/):
 *
 *   MEET IT          START → WHAT IT IS (the practice room) → THE VENUES
 *                    (track start, gymnastics, boxing, wrestling, judo, layer
 *                    by layer) → WHERE THE SOUND COMES FROM (A, B, C from M1)
 *                    → checks
 *   STARTING SETUPS  the setups drawn on the plans → what else the mics hear
 *                    → before any mic (the one sports safety card) + checks
 *   MICROPHONES      the pickup methods compared → checks
 *   PLACEMENT        the worked example → MOVE and AIM in the practice room
 *                    → how the starting points work → checks
 *   LIVE CHECKS      the coverage map → air or structure (the plant) → the
 *                    headroom chain → where each feed goes (the supplied
 *                    cue) → checks
 *   TWO MICS         M2 and M1 at its farther place on one walking source
 *                    → checks
 * TROUBLESHOOT and PRACTICE are the engine's. Suggested starting points in
 * plain words; no sources or badges on screen; FULLY SILENT; nothing moves
 * by itself.
 */
import { useCallback, useState, type ReactNode } from 'react';
import type { SourcePageId } from '../../engine/model/types.ts';
import { PageSteps, type MikingStep } from '../../engine/steps';
import { Note } from '../../engine/kit';
import { ExpandableFigure } from '../../../kit/ExpandableFigure';
import type { PageProps } from '../../pages/pageTypes';
import { factsStep, startStep } from '../shared/journeyPages';
import { FieldStage } from '../shared/field/FieldStage';
import { VenuePlan, venueLabels } from '../shared/sports/VenueArt';
import { PRACTICE_SMALL, PS } from '../shared/sports/practiceScenes.ts';
import { TRACK_GYM_COMBAT, sportPlan } from '../shared/sports/sportPlans.ts';
import { SPORTS_SAFETY } from '../shared/sports/safety.ts';
import { p2, rectUV } from '../shared/sports/venuePlan.ts';
import { usePlantStep } from '../shared/sports/sportsTools';
import { withInsetRoom } from '../shared/sports/arenaPlans.ts';
import { useRoutingStep } from '../shared/broadcast/broadcastPages';
import type { RoutingPlan } from '../shared/broadcast/routing.ts';
import {
  beforeStep,
  checkStep,
  hearsStep,
  placementLearnStep,
  useCoverageStep,
  useHeadroomStep,
  useMethodsStep,
  useOverlapStep,
  usePlacementStep,
  usePlanTourStep,
  useRangeStep,
  useSetupsStep,
  useWorkedStep,
  type Method,
} from '../shared/sports/sportsPages';
import { B15_COVERAGE, B15_OVERLAP, B15_PLACE, B15_SETUPS, BND_M1, CMP_B, SG2_B, SG_B } from './model.ts';

type PageFn = (p: PageProps) => ReactNode;

/* ═════════ 1 · MEET IT ═════════ */

function B15Meet(p: PageProps) {
  const { lesson, journey } = p;
  const tour = usePlanTourStep({ sports: TRACK_GYM_COMBAT, title: 'The venues', prompt: 'Step through LAYER on each SPORT: where the action is, what stays clear, the routes people need, the places a mic may be approved, and what nothing is attached to.', a11yLead: 'A plan of' });
  const range = useRangeStep({ scene: PRACTICE_SMALL, from: PS.M1, fromH: PS.h, fromLabel: 'M1', prediction: lesson.predictions.meet, prompt: 'Step through TARGET: one equipment area, three source points on the walk — each a different range and angle.' });
  const box = PRACTICE_SMALL.frame;
  const steps: MikingStep[] = [
    startStep(lesson, journey, ''),
    factsStep(
      lesson,
      <ExpandableFigure
        badge="The practice room from above · A, B and C on the walk, M1 and M2 either side"
        title="THE PRACTICE ROOM"
        aspect={(box.x1 - box.x0) / (box.y1 - box.y0)}
        render={(w: number, h: number) => (
          <FieldStage w={w} h={h} view="top" box={rectUV(box)} a11y="The practice room from above: three source points A, B and C two metres apart on one walking line, equipment area M1 two metres to one side of B and M2 two metres to the other, the walking path's clearance between them." labels={venueLabels(PRACTICE_SMALL, { layers: true })}>
            {(px) => <VenuePlan scene={PRACTICE_SMALL} px={px} />}
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

const ROWS = [SPORTS_SAFETY.approval, SPORTS_SAFETY.play, SPORTS_SAFETY.protective, SPORTS_SAFETY.lightning, SPORTS_SAFETY.weather, SPORTS_SAFETY.hearing, SPORTS_SAFETY.feedback, SPORTS_SAFETY.withdraw];

function B15Setups(p: PageProps) {
  const setups = useSetupsStep({ p, scene: PRACTICE_SMALL, setups: B15_SETUPS, prompt: 'Step through SETUP. Each mic is drawn at its approved place with its aim and the range to its source point; the corner box shows the mic itself at its height.' });
  const steps: MikingStep[] = [
    setups,
    hearsStep(p.lesson, 'An action mic hears whatever sits on its axis and reaches its place. These decide where it goes and what covers the rest:'),
    beforeStep(p, ROWS, <Note tone="warn">Never stand near a start device, a bell or a loudspeaker just to get a stronger signal — and never ask for hard landings, punches or throws to test a mic.</Note>),
  ];
  return <PageSteps steps={steps} />;
}

/* ═════════ 3 · MICROPHONES ═════════ */

const BOX = sportPlan('boxing');
const GYM = sportPlan('gymnastics');
const RS = BOX.footprints.find((f) => f.id === 'rs1')!.rect;
const CORNER = GYM.footprints.find((f) => f.id === 'corner')!.rect;
const METHODS_RAW: Method[] = [
  { id: 'fixed', label: 'A fixed directional', short: 'FIXED', gives: 'Repeatable detail at one chosen region — a start group, a landing area, a ring sector.', limit: 'Its rejection depends on frequency, not a universal reach. Aim at the source’s real height, and check the near, middle and far points and what its rear hears.', mics: [SG_B], note: 'Compare it with a compact directional from the same place, especially in a reflective arena.' },
  { id: 'compact', label: 'A compact directional', short: 'COMPACT', gives: 'Broader aim tolerance than many shotguns: kinder to a source that moves.', limit: 'More of the room and the crowd with it.', mics: [CMP_B], note: 'An indoor arena does not rule out either mic: the room and the motion decide.' },
  { id: 'boundary', label: 'A boundary mic on a hard surface', short: 'BOUNDARY', gives: 'An airborne floor perspective, where a large, flat, hard surface is expressly approved.', limit: 'A soft mat, or a raised or small surface, does not give it the geometry it is built for.', mics: [BND_M1], note: 'Log the surface, the height and the distance; never on a soft mat.' },
  { id: 'plant', label: 'An approved low plant', short: 'PLANT', gives: 'Local apparatus or ring detail — only where the whole installation is expressly approved.', limit: 'A rigid mount carries the structure’s rattles and rumble; a small capsule does not make an attachment safe.', mics: [{ id: 'pl', kind: 'compact', label: 'low plant', at: { x: (RS.x0 + RS.x1) / 2, y: (RS.y0 + RS.y1) / 2 }, h: 0.8, aimAt: p2(1.2, 3.05), aimH: 0.9, pattern: 'supercardioid' }], scene: BOX, box: { x0: -9, y0: -7, x1: 12, y1: 12 }, note: 'Separate approval, retention and a vibration test — and a contact sensor is a different path again, never a stand-in for air.' },
  { id: 'ambience', label: 'Mono or stereo ambience', short: 'AMBIENCE', gives: 'The venue and its continuity when detail is blocked — the bed every detail feed sits on.', limit: 'Nearby spectators or the PA can dominate it; stereo must still work in mono.', mics: [{ id: 'amb', kind: 'xy', label: 'stereo pair', at: { x: (CORNER.x0 + CORNER.x1) / 2, y: (CORNER.y0 + CORNER.y1) / 2 }, h: 1.6, aimAt: p2(6, 6), aimH: 1.2, pattern: 'cardioid' }], scene: GYM, box: { x0: -5, y0: -5, x1: 20, y1: 16 }, note: 'Choose a perspective, not a mic count: one useful detail sector and the ambience first.' },
];
/** A method drawn on a venue plan keeps the plan clear of its corner close-up. */
const METHODS: Method[] = METHODS_RAW.map((m) => (m.scene ? { ...m, box: withInsetRoom(m.box ?? m.scene.frame) } : m));

function B15Microphone(p: PageProps) {
  const methods = useMethodsStep({ scene: PRACTICE_SMALL, methods: METHODS, prediction: p.lesson.predictions.microphone, prompt: 'Choose each METHOD: what it gives, and what limits it.', done: 'Fixed detail favours a place, ambience favours continuity, and air and structure are different paths. Start with one useful sector and the ambience; add a channel only for a gap you can name.' });
  return <PageSteps steps={[methods, checkStep(p, 'microphone')]} />;
}

/* ═════════ 4 · PLACEMENT ═════════ */

function B15Placement(p: PageProps) {
  const worked = useWorkedStep({
    scene: PRACTICE_SMALL,
    mic: SG_B,
    title: 'a short shotgun at M1 on B',
    pieces: [
      { key: 'WHERE', value: 'M1', title: 'WHERE TO BEGIN', text: 'In equipment area M1, 2 m to one side of B — the stand, the cable loop and the windshield all inside the area, none reaching into the walking path.' },
      { key: 'HEIGHT', value: '≈ 1 m', title: 'THE HEIGHT', text: 'The capsule about 1 m up, at the gentle clap’s height. Log it; the range is measured to the source’s own height.' },
      { key: 'AIM', value: 'ON B', title: 'THE AIM', text: 'The axis on B. A and C lie 45° to either side: farther, and off the axis.' },
      { key: 'RANGE', value: '2.0 m', title: 'THE RANGE', text: 'About 2 m to B, about 2.83 m to A and C — the lesson’s own layout. Keep the gain fixed through A, B and C.' },
      { key: 'CLEAR', value: 'IN AREA', title: 'CLEARANCE', text: 'Nothing in the walking path or its clearance; the way out behind clear.' },
    ],
  });
  const place = usePlacementStep({
    p,
    scene: PRACTICE_SMALL,
    zones: B15_PLACE,
    starts: B15_SETUPS.filter((s) => ['su.one', 'su.cmp', 'su.dbl'].includes(s.id)),
    ranges: { x: [1.2, 2.8], y: [-4.6, -0.9], h: [0.3, 1.6] },
    prediction: p.lesson.predictions.placement,
  });
  const steps: MikingStep[] = [
    worked,
    place,
    ...placementLearnStep(
      p,
      'After our research, each blue starting point is where we recommend you begin — from the approved equipment area, the axis on a named source point, at a height you log. They are starting points, not rules: compare one change at a time — aim, height, pattern, range — and use your ears. Experimentation is encouraged.',
      'For a real event, replace these practice distances with the approved survey: never carry them into a live venue, and never move toward the action to get closer.',
    ),
  ];
  return <PageSteps steps={steps} />;
}

/* ═════════ 5 · LIVE CHECKS (context) ═════════ */

const PLAN: RoutingPlan = {
  sources: [
    { id: 'action', label: 'The action mic', short: 'ACTION', kind: 'mic', level: 'mic' },
    { id: 'amb', label: 'The venue ambience pair', short: 'AMBIENCE', kind: 'ambience', level: 'mic' },
    { id: 'cue', label: 'The supplied start-cue feed', short: 'CUE FEED', kind: 'playback', level: 'line' },
    { id: 'comm', label: 'The commentary mic', short: 'COMMENTARY', kind: 'mic', level: 'mic' },
  ],
  dests: ['program', 'recorder', 'pa'],
  sends: { action: ['program', 'recorder'], amb: ['program', 'recorder'], cue: ['program', 'recorder'], comm: ['program', 'recorder'] },
  needs: { program: ['action', 'amb', 'cue', 'comm'] },
};

function B15Context(p: PageProps) {
  const { onInteractive, interactiveDone } = p;
  const [got, setGot] = useState<ReadonlySet<string>>(() => new Set());
  const note = useCallback(
    (id: string) => {
      setGot((prev) => {
        if (prev.has(id)) return prev;
        const n = new Set([...prev, id]);
        if (n.has('coverageMap') && n.has('plantCompared') && n.has('headroomChain') && !interactiveDone.has('liveChecks')) onInteractive('liveChecks');
        return n;
      });
    },
    [interactiveDone, onInteractive],
  );
  const coverage = useCoverageStep({ scene: PRACTICE_SMALL, tasks: B15_COVERAGE, mics: [SG_B, SG2_B], onInteractive: note, done: got.has('coverageMap') });
  const plant = usePlantStep({ onInteractive: note, done: got.has('plantCompared') });
  const headroom = useHeadroomStep({ onInteractive: note, done: got.has('headroomChain'), prediction: p.lesson.predictions.context });
  const routing = useRoutingStep({
    plan: PLAN,
    looks: { action: { art: 'shotgun', r: 10.5, len: 220 }, amb: { art: 'sdc', r: 10.5, len: 104 }, cue: 'player', comm: { art: 'broadcastDynamic', r: 30, len: 190 } },
    switches: [
      {
        id: 'cue',
        label: 'CUE FEED',
        options: [
          { id: 'own', label: 'On its own input', blurb: 'The authorized start-cue feed comes in on its own line input, to the program and the recording.', sends: {} },
          { id: 'none', label: 'Left to the action mic', blurb: 'No cue feed: the cue reaches the program only as whatever the action mic hears of it.', sends: { cue: [] } },
        ],
      },
      {
        id: 'amb',
        label: 'AMBIENCE',
        options: [
          { id: 'feeds', label: 'Program and recorder', blurb: 'The ambience pair goes to the program and the recording only.', sends: {} },
          { id: 'pa', label: 'Into the PA too', blurb: 'The ambience pair is also sent to the venue PA.', sends: { amb: ['program', 'recorder', 'pa'] } },
        ],
      },
    ],
    words: {
      looking: 'A signal-flow drawing · the action mic, the ambience, the cue feed, the commentary',
      prompt: 'TRACE each source. Keep the supplied cue on its own input, and the ambience out of the PA.',
      done: 'The cue arrives on its own controllable input, the action and the ambience reach the program and the recording, and nothing loops through the PA: a clean plan.',
    },
    points: [
      { title: 'A SUPPLIED CUE IS ITS OWN INPUT', text: 'An authorized production feed of the start cue or the routine’s music is separate from the action mic: check its level, its delay against the room and its rights with the timing or presentation team. It is never an official timing record — and the start and timing systems are never split, patched or loaded for audio.' },
      { title: 'ACTION AND CROWD STAY OFF THE PA', text: 'Action and crowd mics generally need no reinforcement in the venue. Route to the PA only what is asked for, reviewed by the venue engineer — never a test of feedback.' },
    ],
  });
  return <PageSteps steps={[coverage, plant, headroom, routing, checkStep(p, 'context')]} />;
}

/* ═════════ 6 · TWO MICS ═════════ */

function B15TwoMic(p: PageProps) {
  const overlap = useOverlapStep({
    scene: PRACTICE_SMALL,
    a: B15_OVERLAP.a,
    b: B15_OVERLAP.b,
    path: B15_OVERLAP.path,
    onInteractive: p.onInteractive,
    done: p.interactiveDone.has('polarityVsDelay'),
    prediction: p.lesson.predictions.twoMic,
    intro: 'M2 at its place and M1 moved to its farther place: walk the source from A to C (WALK) — the two mics hear it at different times. Flip B’s POLARITY both ways and watch which readouts change.',
  });
  return <PageSteps steps={[overlap, checkStep(p, 'twoMic')]} />;
}

export const B15_PAGES: Partial<Record<SourcePageId, PageFn>> = {
  meet: B15Meet,
  setups: B15Setups,
  microphone: B15Microphone,
  placement: B15Placement,
  context: B15Context,
  twoMic: B15TwoMic,
};
export const B15_STEP_COUNTS: Partial<Record<SourcePageId, number>> = { meet: 5, setups: 3, microphone: 2, placement: 4, context: 5, twoMic: 2 };
