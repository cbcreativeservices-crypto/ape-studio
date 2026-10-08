/**
 * B08 BROADCAST AUDIENCE AND EVENT SPACE — the lesson's own pages
 * (LessonArt.pages), on the journey (docs/labs/miking/LESSON_JOURNEY.md),
 * built from Lab 7b group 2's plan steps (shared/sports/sportsPages.tsx) and
 * the audience tools (shared/broadcast/audiencePages.tsx):
 *
 *   MEET IT          START → WHAT IT IS (the studio audience) → THE VENUE
 *                    (two venues, layer by layer) → ONE PERSON OR THE CROWD
 *                    (the nearest seat against the section) → checks
 *   STARTING SETUPS  the setups drawn on the plans → what else the mics hear
 *                    → before any mic (safety rows) + checks
 *   MICROPHONES      the coverage methods compared on the plan → five
 *                    capsules or four (no decode) → checks
 *   PLACEMENT        the worked example → MOVE and AIM on the studio plan →
 *                    how the starting points work → checks
 *   LIVE CHECKS      faces, not the PA → where each mic goes (crowd mics to
 *                    broadcast and record only) → checks
 *   TWO MICS         two zone mics on a walking source → a pair or two zones
 *                    → checks
 * TROUBLESHOOT and PRACTICE are the engine's. Suggested starting points in
 * plain words; no sources or badges on screen; FULLY SILENT; nothing moves
 * by itself.
 */
import { useCallback, useState, type ReactNode } from 'react';
import type { SourcePageId } from '../../engine/model/types.ts';
import { PageSteps, type MikingStep } from '../../engine/steps';
import { Body, Card, Note, Point, ScenarioList } from '../../engine/kit';
import { ExpandableFigure } from '../../../kit/ExpandableFigure';
import type { PageProps } from '../../pages/pageTypes';
import { factsStep, startStep } from '../shared/journeyPages';
import { FieldStage } from '../shared/field/FieldStage';
import { VenuePlan, venueLabels } from '../shared/sports/VenueArt';
import { rectUV } from '../shared/sports/venuePlan.ts';
import { checkStep, hearsStep, placementLearnStep, useMethodsStep, useOverlapStep, usePlacementStep, useSetupsStep, useWorkedStep, type Method } from '../shared/sports/sportsPages';
import { useRoutingStep } from '../shared/broadcast/broadcastPages';
import type { RoutingPlan } from '../shared/broadcast/routing.ts';
import { PaCoverage, useImmersiveStep, useNearSeatStep, usePaAngleStep, usePairZonesStep, useVenueTourStep } from '../shared/broadcast/audiencePages';
import { STUDIO_SCENE } from '../shared/broadcast/venue.ts';
import { B08_ROWS } from './rows.ts';
import { B08_OVERLAP, B08_PLACE, B08_SETUPS, MONO, XY, ZONE_L, ZONE_R } from './model.ts';

type PageFn = (p: PageProps) => ReactNode;


/** BEFORE ANY MIC: the rows, the rehearsal note, the checks. */
function beforeStep(p: PageProps): MikingStep {
  return {
    key: 'before',
    title: 'Before any mic',
    kind: 'CHECK',
    layout: 'read',
    body: (
      <>
        <Card>
          {B08_ROWS.map((r) => (
            <Point key={r.id} title={r.title}>
              {r.text}
            </Point>
          ))}
        </Card>
        <Note tone="warn">Rehearse with the venue’s people: quiet speech, applause, a loud peak and an audience question — the PA at its agreed level, never pushed toward feedback.</Note>
        <Body>Then the checks.</Body>
        <ScenarioList items={p.lesson.scenarios.filter((q) => q.page === 'setups')} answers={p.answers} onAnswered={p.onAnswered} />
      </>
    ),
  };
}

/* ═════════ 1 · MEET IT ═════════ */

function B08Meet(p: PageProps) {
  const { lesson, journey } = p;
  const tour = useVenueTourStep({
    words: {
      looking: 'From above, layer by layer',
      prompt: 'Step through LAYER, then change VENUE: the seats and the routes, the PA and where it points, the cameras, the places a mic may go.',
      done: 'A crowd mic’s place is decided by the seats, the routes, the PA, the cameras and the approved places — not by the best seat for a person.',
    },
  });
  const near = useNearSeatStep({
    prediction: lesson.predictions.meet,
    words: {
      looking: 'The studio audience from above · a crowd mic on the bar',
      prompt: 'Slide HEIGHT down low, then up high — and OUT. Watch how much louder the nearest seat is than the middle of the section.',
      done: 'Raised above and a little in front, the section arrives together; low, the nearest person dominates. That is why a crowd mic starts high, aimed at the faces.',
    },
  });
  const box = STUDIO_SCENE.frame;
  const steps: MikingStep[] = [
    startStep(lesson, journey, ''),
    factsStep(
      lesson,
      <ExpandableFigure
        badge="A studio audience from above · the stage at the bottom, the seats above"
        title="THE STUDIO AUDIENCE"
        aspect={(box.x1 - box.x0) / (box.y1 - box.y0)}
        render={(w: number, h: number) => (
          <FieldStage w={w} h={h} view="top" box={rectUV(box)} a11y="A studio audience from above: a stage at the bottom, one raked section of empty seats above it, an aisle down each side, a PA loudspeaker at each front corner of the stage, a camera at the back." labels={venueLabels(STUDIO_SCENE, { layers: true, marks: false })}>
            {(px) => (
              <>
                <VenuePlan scene={STUDIO_SCENE} px={px} show={{ marks: false }} />
                <PaCoverage venue="studio" px={px} />
              </>
            )}
          </FieldStage>
        )}
      />,
    ),
    tour,
    near,
    checkStep(p, 'meet'),
  ];
  return <PageSteps steps={steps} />;
}

/* ═════════ 2 · STARTING SETUPS ═════════ */

function B08Setups(p: PageProps) {
  const setups = useSetupsStep({ p, scene: STUDIO_SCENE, setups: B08_SETUPS, prompt: 'Step through SETUP. Each mic is drawn at its approved place with its aim; the corner box shows the mic itself at its height.' });
  const steps: MikingStep[] = [setups, hearsStep(p.lesson, 'An audience mic hears whatever reaches its place — the people it is aimed at, and everything else. These decide where it goes:'), beforeStep(p)];
  return <PageSteps steps={steps} />;
}

/* ═════════ 3 · MICROPHONES ═════════ */

const METHODS: Method[] = [
  { id: 'mono', label: 'One mono crowd mic', short: 'MONO', gives: 'A directional mic raised toward the faces of a representative section, the PA as far off its front as practical.', limit: 'One position can over-represent a small group, aisle chatter, the nearest applause or a loudspeaker — and gives no width.', mics: [MONO] },
  { id: 'zones', label: 'Two audience zones', short: 'TWO ZONES', gives: 'Distinct left and right crowd positions with similar coverage and a named channel map, raised at the stage’s corners or in front of sections.', limit: 'Not a coherent stereo pair: unequal local events, timing and PA pickup can wander the image and colour the mono sum.', mics: [ZONE_L, ZONE_R] },
  { id: 'xy', label: 'A coincident XY pair', short: 'XY', gives: 'Two angled cardioids at one stable place, taking in the useful width of the audience.', limit: 'A predictable mono sum and a stable centre — less spacious than a spaced pair; a central place may hear more PA than crowd.', mics: [XY] },
  { id: 'spaced', label: 'A near-coincident or spaced pair', short: 'SPACED', gives: 'A near-coincident pair adds width with some mono compatibility; spaced omnis bring diffuse hall energy and low end.', limit: 'Time differences comb when summed to mono: check the downmix — a spaced pair is not guaranteed mono-safe.', mics: B08_SETUPS[2].mics, scene: B08_SETUPS[2].scene, box: B08_SETUPS[2].box, noCloseUp: true },
  { id: 'immersive', label: 'A surround or Ambisonic mic', short: 'IMMERSIVE', gives: 'A purpose-built five-capsule surround mic, or a four-capsule Ambisonic mic, when a surround or immersive deliverable is asked for.', limit: 'Two different signal formats. Keep the orientation, the channel identity, the mount and the maker’s conversion — and check the stereo fold-down by ear.', mics: [], note: 'The next step shows both, with their fronts and channel labels.' },
];

function B08Microphone(p: PageProps) {
  const methods = useMethodsStep({ scene: STUDIO_SCENE, methods: METHODS, prediction: p.lesson.predictions.microphone, prompt: 'Choose each METHOD: what it gives, and what limits it.', done: 'Mono, two zones, a pair, a spaced pair, an immersive mic: each gives something and limits something. Start from the fewest zones the brief needs.' });
  const imm = useImmersiveStep({ words: { looking: 'An immersive mic, from above', prompt: 'Look at both with MIC: where the front is, and what each one’s signals are called.', done: 'Five channels or four capsule tracks — different formats, each with its own front, order and conversion. Optional, and never instead of a clean mono and stereo plan.' } });
  return <PageSteps steps={[methods, imm, checkStep(p, 'microphone')]} />;
}

/* ═════════ 4 · PLACEMENT ═════════ */

function B08Placement(p: PageProps) {
  const worked = useWorkedStep({
    scene: STUDIO_SCENE,
    mic: MONO,
    title: 'one crowd mic on the bar, aimed at the faces',
    pieces: [
      { key: 'WHERE', value: 'THE BAR', title: 'WHERE TO BEGIN', text: 'On the approved rigging bar above the front rows — hung by qualified crew — a little in front of the section.' },
      { key: 'HEIGHT', value: '≈ 3.2 m', title: 'THE HEIGHT', text: 'Raised about 3 m above the floor (a drawing default): high enough that the front row is not much nearer than the middle.' },
      { key: 'AIM', value: 'THE FACES', title: 'THE AIM', text: 'Down at the faces and upper bodies of the section — not at the stage, not over the heads.' },
      { key: 'PA', value: 'OFF ITS FRONT', title: 'THE PA', text: 'The loudspeakers at the stage’s corners sit well off the mic’s front, toward its sides and back.' },
      { key: 'ROUTE', value: 'NOT THE PA', title: 'THE ROUTE', text: 'On its own channel to the broadcast and the recording — never into the main PA.' },
    ],
  });
  const place = usePlacementStep({
    p,
    scene: STUDIO_SCENE,
    zones: B08_PLACE,
    starts: B08_SETUPS.filter((s) => ['su.one', 'su.two', 'su.zones'].includes(s.id)),
    ranges: { x: [-5, 5], y: [-0.5, 2.5], h: [1.6, 4.2] },
    prediction: p.lesson.predictions.placement,
  });
  const steps: MikingStep[] = [
    worked,
    place,
    ...placementLearnStep(
      p,
      'After our research, each blue starting point is where we recommend you begin — on an approved place, raised, aimed at the faces of a section, the PA off its front. They are starting points, not rules: compare one change at a time, and use your ears. Experimentation is encouraged.',
      'Only an approved place: never in an aisle or an exit, never over people unless a qualified rigger hung it — and never into the main PA.',
    ),
  ];
  return <PageSteps steps={steps} />;
}

/* ═════════ 5 · LIVE CHECKS (context) ═════════ */

const PLAN: RoutingPlan = {
  sources: [
    { id: 'crowd', label: 'The crowd mics', short: 'CROWD', kind: 'ambience', level: 'mic' },
    { id: 'host', label: 'The presenter’s mic', short: 'PRESENTER', kind: 'mic', level: 'mic' },
    { id: 'question', label: 'The audience question mic', short: 'QUESTION', kind: 'mic', level: 'mic' },
  ],
  dests: ['pa', 'stream', 'recorder'],
  sends: {
    crowd: ['stream', 'recorder'],
    host: ['pa', 'stream', 'recorder'],
    question: ['pa', 'stream', 'recorder'],
  },
  openMics: ['host', 'question'],
  needs: { stream: ['crowd', 'host', 'question'], recorder: ['crowd', 'host', 'question'] },
};

function B08Context(p: PageProps) {
  const { onInteractive, interactiveDone } = p;
  const [got, setGot] = useState<ReadonlySet<string>>(() => new Set());
  const note = useCallback(
    (id: string) => {
      setGot((prev) => {
        if (prev.has(id)) return prev;
        const n = new Set([...prev, id]);
        if (n.has('pa') && !interactiveDone.has('liveChecks')) onInteractive('liveChecks');
        return n;
      });
    },
    [interactiveDone, onInteractive],
  );
  const pa = usePaAngleStep({
    onDone: () => note('pa'),
    prediction: p.lesson.predictions.context,
    words: {
      looking: 'The event from above · a crowd mic and the left PA cluster',
      prompt: 'TURN and TILT the crowd mic, try both PLACEs and PATTERNs: the faces in front of it, the PA toward its rejection.',
      done: 'Aimed down at the faces with the PA well toward its back: the people first. A pattern helps; the place and the aim do more.',
    },
  });
  const routing = useRoutingStep({
    plan: PLAN,
    looks: { crowd: { art: 'sdc', r: 10.5, len: 104 }, host: { art: 'vocalDynamic', r: 25, len: 162 }, question: { art: 'vocalDynamic', r: 25, len: 162 } },
    switches: [
      {
        id: 'crowd',
        label: 'CROWD MICS',
        options: [
          { id: 'feeds', label: 'Broadcast and record', blurb: 'The crowd mics go to the stream and the recording only.', sends: {} },
          { id: 'pa', label: 'Into the PA too', blurb: 'The crowd mics are also sent to the main PA.', sends: { crowd: ['stream', 'recorder', 'pa'] } },
        ],
      },
      {
        id: 'q',
        label: 'QUESTION MIC',
        options: [
          { id: 'all', label: 'To every feed', blurb: 'The audience question mic goes to the PA, the stream and the recording.', sends: {} },
          { id: 'pa', label: 'To the PA only', blurb: 'The question mic goes to the room’s PA — nowhere else.', sends: { question: ['pa'] } },
        ],
      },
    ],
    words: {
      looking: 'A signal-flow drawing · the crowd mics, the presenter, the audience question, the PA, the stream',
      prompt: 'TRACE the crowd mics. Send them into the PA, then take the question mic off the stream — and read what goes wrong.',
      done: 'The crowd mics on their own paths to the broadcast and the recording, out of the PA; the question on its close mic to every feed: a clean plan.',
    },
    points: [
      { title: 'AMBIENCE IS NOT REINFORCEMENT', text: 'A distant audience mic routed into nearby loudspeakers can feed back — and it will not make an audience question clear. The question gets its own close mic.' },
      { title: 'THE SPEECH LEADS', text: 'The stream may carry a little room for continuity and more for a reaction — a mix decision after placement. The close speech mics carry the words.' },
    ],
  });
  return <PageSteps steps={[pa, routing, checkStep(p, 'context')]} />;
}

/* ═════════ 6 · TWO MICS ═════════ */

function B08TwoMic(p: PageProps) {
  const overlap = useOverlapStep({
    scene: STUDIO_SCENE,
    a: B08_OVERLAP.a,
    b: B08_OVERLAP.b,
    path: B08_OVERLAP.path,
    box: { x0: -6, y0: -1.5, x1: 6, y1: 9 },
    onInteractive: p.onInteractive,
    done: p.interactiveDone.has('polarityVsDelay'),
    prediction: p.lesson.predictions.twoMic,
    intro: 'Walk a laugh across the front of the section (WALK): the two zone mics hear it at different times. Flip B’s POLARITY both ways and watch which readouts change.',
  });
  const pair = usePairZonesStep({ onDone: () => undefined, words: { looking: 'The studio audience from above · a pair or two zones', prompt: 'Change METHOD and SOURCE: where do the two capsules hear the same sound at the same moment?', done: 'Two zone mics are not a stereo pair: a sound at one side reaches them milliseconds apart, and the mono sum combs. A coincident pair hears it at the same moment.' } });
  return <PageSteps steps={[overlap, pair, checkStep(p, 'twoMic')]} />;
}

export const B08_PAGES: Partial<Record<SourcePageId, PageFn>> = {
  meet: B08Meet,
  setups: B08Setups,
  microphone: B08Microphone,
  placement: B08Placement,
  context: B08Context,
  twoMic: B08TwoMic,
};
export const B08_STEP_COUNTS: Partial<Record<SourcePageId, number>> = { meet: 5, setups: 3, microphone: 3, placement: 4, context: 3, twoMic: 3 };
