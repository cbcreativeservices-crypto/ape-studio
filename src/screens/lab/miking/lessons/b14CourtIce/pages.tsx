/**
 * B14 COURT, RACKET AND ICE SPORTS — the lesson's own pages (LessonArt.pages),
 * on the journey, built from the shared sports steps (lessons/shared/sports/
 * sportsPages.tsx, sportsTools.tsx):
 *
 *   MEET IT          START → WHAT IT IS (the practice line) → THE SPORTS (five
 *                    court and rink plans, layer by layer) → WHERE THE SOUND
 *                    COMES FROM (A, B, C from M) → checks
 *   STARTING SETUPS  the setups on the line and the court → what else the mics
 *                    hear → before any mic + checks
 *   MICROPHONES      the pickup methods on the plan → checks
 *   PLACEMENT        the worked example → move and aim the shotgun, the
 *                    compact mic or the boundary → how they work → checks
 *   FLOOR, STRUCTURE the boundary tool → the plant tool → the headroom chain
 *   AND HEADROOM     → checks
 *   TWO POSITIONS    shotguns at M and M2 on one walking source → checks
 * TROUBLESHOOT and PRACTICE are the engine's. FULLY SILENT; nothing moves by
 * itself.
 */
import { useCallback, useState, type ReactNode } from 'react';
import type { SourcePageId } from '../../engine/model/types.ts';
import { PageSteps, type MikingStep } from '../../engine/steps';
import { ExpandableFigure } from '../../../kit/ExpandableFigure';
import type { PageProps } from '../../pages/pageTypes';
import { factsStep, startStep } from '../shared/journeyPages';
import { FieldStage } from '../shared/field/FieldStage';
import { VenuePlan, venueLabels } from '../shared/sports/VenueArt';
import { PL, PRACTICE_LINE } from '../shared/sports/practiceScenes.ts';
import { COURT_SPORTS, sportPlan } from '../shared/sports/sportPlans.ts';
import { INDOOR_ROWS, SPORTS_SAFETY } from '../shared/sports/safety.ts';
import { rectUV } from '../shared/sports/venuePlan.ts';
import { beforeStep, checkStep, hearsStep, placementLearnStep, useHeadroomStep, useMethodsStep, useOverlapStep, usePlacementStep, usePlanTourStep, useRangeStep, useSetupsStep, useWorkedStep, type Method } from '../shared/sports/sportsPages';
import { useBoundaryStep, usePlantStep } from '../shared/sports/sportsTools';
import { AMB, B14_OVERLAP, B14_PLACE, B14_SETUPS, BND_M, CMP_B, SG_B } from './model.ts';

type PageFn = (p: PageProps) => ReactNode;
const ROWS = [...INDOOR_ROWS, SPORTS_SAFETY.lightning, SPORTS_SAFETY.weather];

/* ═════════ 1 · MEET IT ═════════ */

function B14Meet(p: PageProps) {
  const { lesson, journey } = p;
  const tour = usePlanTourStep({ sports: COURT_SPORTS, title: 'The sports', prompt: 'Step through LAYER on each SPORT: the court, its clear space, the routes people need, the approved places, and the fixtures nothing is attached to.', a11yLead: 'A plan of' });
  const range = useRangeStep({ scene: PRACTICE_LINE, from: PL.M, fromH: PL.h, fromLabel: 'M', prediction: lesson.predictions.meet, prompt: 'Step through TARGET: three points on one line from the mark outside — 5, 8 and 11 m.' });
  const box = PRACTICE_LINE.frame;
  const steps: MikingStep[] = [
    startStep(lesson, journey, ''),
    factsStep(
      lesson,
      <ExpandableFigure
        badge="The practice line from above · M outside the line, A, B and C inside"
        title="THE PRACTICE LINE"
        aspect={(box.x1 - box.x0) / (box.y1 - box.y0)}
        render={(w: number, h: number) => (
          <FieldStage w={w} h={h} view="top" box={rectUV(box)} a11y="The practice line from above: a straight mock boundary, the source points A, B and C 2, 5 and 8 metres inside it, the mic mark M 3 metres outside, all on one line." labels={venueLabels(PRACTICE_LINE, { layers: true })}>
            {(px) => <VenuePlan scene={PRACTICE_LINE} px={px} />}
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

function B14Setups(p: PageProps) {
  const setups = useSetupsStep({ p, scene: PRACTICE_LINE, setups: B14_SETUPS, prompt: 'Step through SETUP. Each mic is drawn at its approved place with its aim and range; the corner box shows the mic itself at its height.' });
  return <PageSteps steps={[setups, hearsStep(p.lesson, 'Contacts move across the court, and the room, the structure and the people are part of what reaches each mic. These decide where it goes:'), beforeStep(p, ROWS)]} />;
}

/* ═════════ 3 · MICROPHONES ═════════ */

const BB = sportPlan('basketball');
const HK = sportPlan('hockey');
const METHODS: Method[] = [
  { id: 'compact', label: 'A compact cardioid or supercardioid', short: 'COMPACT', gives: 'Airborne impacts and shoe or skate detail from a permitted nearby place.', limit: 'Broader aim tolerance than many shotguns; more spill. Check its real nulls and rear lobe.', mics: [CMP_B] },
  { id: 'shotgun', label: 'A perimeter shotgun', short: 'SHOTGUN', gives: 'A selected action sector from an approved fixed or operated place.', limit: 'Its rejection varies with frequency and angle; distance stays decisive, and reflections change the tone.', mics: [SG_B] },
  { id: 'boundary', label: 'A floor boundary mic', short: 'BOUNDARY', gives: 'Airborne sound at a large solid surface, the capsule in its intended boundary geometry.', limit: 'Footfalls and impacts excite the surface; low profile does not mean safe for contact.', mics: [BND_M] },
  { id: 'plant', label: 'An approved structure plant', short: 'PLANT', gives: 'Local airborne detail near a basket, a fixture or a rink zone.', limit: 'Mount vibration, exposed hardware, the rules and access can outweigh the closer place.', mics: [B14_SETUPS[6].mics[0]], scene: BB },
  { id: 'contact', label: 'A contact sensor (a comparison)', short: 'CONTACT', gives: 'The vibration of a board or another approved test structure.', limit: 'Not the same perspective as an airborne mic: label it separately. Its impedance and interface from its documentation; no phantom power unless it says so.', mics: [], scene: HK },
  { id: 'ambience', label: 'Fixed mono or stereo ambience', short: 'AMBIENCE', gives: 'The continuous room and audience perspective through changing action.', limit: 'Less individual detail; the PA, ventilation and spectators stay part of it. Check the stereo downmix.', mics: [AMB] },
];

function B14Microphone(p: PageProps) {
  const methods = useMethodsStep({ scene: PRACTICE_LINE, methods: METHODS, prediction: p.lesson.predictions.microphone, prompt: 'Choose each METHOD: what it gives, and what limits it.', done: 'Pattern names alone do not settle isolation: audition the mic with the crowd and the PA running, and keep air and structure apart.' });
  return <PageSteps steps={[methods, checkStep(p, 'microphone')]} />;
}

/* ═════════ 4 · PLACEMENT ═════════ */

function B14Placement(p: PageProps) {
  const worked = useWorkedStep({
    scene: PRACTICE_LINE,
    mic: SG_B,
    title: 'a short shotgun at M on B',
    pieces: [
      { key: 'WHERE', value: 'MARK M', title: 'WHERE TO BEGIN', text: 'At the mark 3 m outside the line, in the outside zone with the observers. Nothing of the setup inside the line.' },
      { key: 'HEIGHT', value: '≈ 1 m', title: 'THE HEIGHT', text: 'The capsule about 1 m above the floor; the clap made at the same height.' },
      { key: 'AIM', value: 'ON B', title: 'THE AIM', text: 'The axis on B — at the contact height, not automatically at the floor.' },
      { key: 'RANGE', value: '8 m', title: 'THE RANGE', text: '8 m from M to B, on one line with A (5 m) and C (11 m). The gain stays unchanged between them.' },
      { key: 'CLEAR', value: 'OUTSIDE', title: 'CLEARANCE', text: 'Out of the walking route and the camera line; one mic at a time if two stands would crowd the zone.' },
    ],
  });
  const place = usePlacementStep({
    p,
    scene: PRACTICE_LINE,
    zones: B14_PLACE,
    starts: B14_SETUPS.filter((s) => ['su.one', 'su.cmp', 'su.bnd'].includes(s.id)),
    ranges: { x: [-6, 6], y: [-4.5, 1.5], h: [0, 2.0] },
    prediction: p.lesson.predictions.placement,
    refuseWords: 'The mics and the observers stay outside the line — the inside belongs to the source participant.',
  });
  const steps: MikingStep[] = [
    worked,
    place,
    ...placementLearnStep(
      p,
      'After our research, each blue starting point is where we recommend you begin — from the outside zone, aimed at the contact height; on the floor, the boundary in its intended geometry. Starting points, not rules: change one variable at a time and use your ears. Experimentation is encouraged.',
      'For real sports work, replace the practice geometry with the approved survey: never carry these practice distances into a live court or rink.',
    ),
  ];
  return <PageSteps steps={steps} />;
}

/* ═════════ 5 · FLOOR, STRUCTURE AND HEADROOM (context) ═════════ */

function B14Context(p: PageProps) {
  const { onInteractive, interactiveDone } = p;
  const [got, setGot] = useState<ReadonlySet<string>>(() => new Set());
  const note = useCallback(
    (id: string) => {
      setGot((prev) => {
        if (prev.has(id)) return prev;
        const n = new Set([...prev, id]);
        if (n.has('boundaryHeights') && n.has('plantCompared') && n.has('headroomChain') && !interactiveDone.has('liveChecks')) onInteractive('liveChecks');
        return n;
      });
    },
    [interactiveDone, onInteractive],
  );
  const boundary = useBoundaryStep({ onInteractive: note, done: got.has('boundaryHeights'), prediction: p.lesson.predictions.context, source: { x: 3000, hs: 1000 } });
  const plant = usePlantStep({ onInteractive: note, done: got.has('plantCompared') });
  const headroom = useHeadroomStep({ onInteractive: note, done: got.has('headroomChain') });
  return <PageSteps steps={[boundary, plant, headroom, checkStep(p, 'context')]} />;
}

/* ═════════ 6 · TWO POSITIONS ═════════ */

function B14TwoMic(p: PageProps) {
  const overlap = useOverlapStep({
    scene: PRACTICE_LINE,
    a: B14_OVERLAP.a,
    b: B14_OVERLAP.b,
    path: B14_OVERLAP.path,
    onInteractive: p.onInteractive,
    done: p.interactiveDone.has('polarityVsDelay'),
    prediction: p.lesson.predictions.twoMic,
    intro: 'Walk the source from A to C (WALK): the shotguns at M and M2 hear it at different times. Flip B’s POLARITY both ways and watch which readouts change.',
  });
  return <PageSteps steps={[overlap, checkStep(p, 'twoMic')]} />;
}

export const B14_PAGES: Partial<Record<SourcePageId, PageFn>> = {
  meet: B14Meet,
  setups: B14Setups,
  microphone: B14Microphone,
  placement: B14Placement,
  context: B14Context,
  twoMic: B14TwoMic,
};
export const B14_STEP_COUNTS: Partial<Record<SourcePageId, number>> = { meet: 5, setups: 3, microphone: 2, placement: 4, context: 4, twoMic: 2 };
