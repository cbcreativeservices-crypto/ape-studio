/**
 * B13 FIELD AND DIAMOND SPORTS — the lesson's own pages (LessonArt.pages),
 * on the journey (docs/labs/miking/LESSON_JOURNEY.md), built from the shared
 * sports steps (lessons/shared/sports/sportsPages.tsx):
 *
 *   MEET IT          START → WHAT IT IS (the practice field) → THE SPORTS
 *                    (five plans, layer by layer: play, keep clear, routes,
 *                    approved places, fixtures, cameras and crowd) → WHERE
 *                    THE SOUND COMES FROM (A, B, C from M: range, angle,
 *                    level) → checks
 *   STARTING SETUPS  the setups drawn on the plan → what else the mics hear
 *                    → before any mic (the one sports safety card) + checks
 *   MICROPHONES      the four pickup methods compared on the plan → checks
 *   PLACEMENT        the worked example → MOVE and AIM on the practice field
 *                    → how the starting points work → checks
 *   LIVE CHECKS      the coverage map → the headroom chain → checks
 *   TWO MICS         a shotgun at M and the ambience at E on one walking
 *                    source → checks
 * TROUBLESHOOT and PRACTICE are the engine's. Suggested starting points in
 * plain words; no sources or badges on screen; FULLY SILENT; nothing moves
 * by itself.
 */
import { useCallback, useState, type ReactNode } from 'react';
import type { SourcePageId } from '../../engine/model/types.ts';
import { PageSteps, type MikingStep } from '../../engine/steps';
import { ExpandableFigure } from '../../../kit/ExpandableFigure';
import type { PageProps } from '../../pages/pageTypes';
import { factsStep, startStep } from '../shared/journeyPages';
import { FieldStage } from '../shared/field/FieldStage';
import { VenuePlan, venueLabels } from '../shared/sports/VenueArt';
import { PF, PF_ARC, PRACTICE_FIELD } from '../shared/sports/practiceScenes.ts';
import { FIELD_SPORTS, sportPlan } from '../shared/sports/sportPlans.ts';
import { OUTDOOR_ROWS } from '../shared/sports/safety.ts';
import { rectUV } from '../shared/sports/venuePlan.ts';
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
import { AMB_E, B13_COVERAGE, B13_OVERLAP, B13_PLACE, B13_SETUPS, DISH_A, DISH_H, SG_A } from './model.ts';

type PageFn = (p: PageProps) => ReactNode;

/* ═════════ 1 · MEET IT ═════════ */

function B13Meet(p: PageProps) {
  const { lesson, journey } = p;
  const tour = usePlanTourStep({ sports: FIELD_SPORTS, title: 'The sports', prompt: 'Step through LAYER on each SPORT: where the play is, what stays clear, the routes people need, the places a mic may be approved, and what nothing is attached to.', a11yLead: 'A plan of' });
  const range = useRangeStep({ scene: PRACTICE_FIELD, from: PF.M, fromH: PF.hHigh, fromLabel: 'M', prediction: lesson.predictions.meet, prompt: 'Step through TARGET: the same approved mark, three targets — each a different range and angle.' });
  const box = PRACTICE_FIELD.frame;
  const steps: MikingStep[] = [
    startStep(lesson, journey, ''),
    factsStep(
      lesson,
      <ExpandableFigure
        badge="The practice field from above · M outside the rectangle, A, B and C inside"
        title="THE PRACTICE FIELD"
        aspect={(box.x1 - box.x0) / (box.y1 - box.y0)}
        render={(w: number, h: number) => (
          <FieldStage w={w} h={h} view="top" box={rectUV(box)} a11y="The practice field from above: a 30 by 20 metre rectangle, the comparison mark M six metres outside it, the targets A, B and C inside, the crew strip and the way out." labels={venueLabels(PRACTICE_FIELD, { layers: true })}>
            {(px) => <VenuePlan scene={PRACTICE_FIELD} px={px} />}
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

function B13Setups(p: PageProps) {
  const setups = useSetupsStep({ p, scene: PRACTICE_FIELD, setups: B13_SETUPS, prompt: 'Step through SETUP. Each mic is drawn at its approved place with its aim and the range to its target; the corner box shows the mic itself at its height.' });
  const steps: MikingStep[] = [setups, hearsStep(p.lesson, 'An action mic hears whatever sits on its axis and reaches its place. These decide where it goes and what covers the rest:'), beforeStep(p, OUTDOOR_ROWS)];
  return <PageSteps steps={steps} />;
}

/* ═════════ 3 · MICROPHONES ═════════ */

const BASE = sportPlan('baseball');
const METHODS: Method[] = [
  { id: 'shotgun', label: 'A perimeter shotgun', short: 'SHOTGUN', gives: 'Aimed detail from a closer permitted zone — fixed on a stand, or safely operated.', limit: 'Its rejection depends on frequency: through the lows and mids it hears like its capsule, narrower only higher up. Aim and distance change the tone. It has no acoustic zoom.', mics: [SG_A], note: 'Read the model’s pattern drawings: a shotgun can have side and rear pickup.' },
  { id: 'dish', label: 'A parabolic dish', short: 'DISH', gives: 'Selected distant transients or calls, from a permitted viewing position, turned within an approved arc.', limit: 'Focus and aim are critical; a portable dish helps the high frequencies most. A crowd or PA on its axis is favoured along with the play.', mics: [DISH_A], note: 'Assembled with the maker’s capsule, focal reference and mount — never a shotgun at the focus by assumption.' },
  { id: 'ambience', label: 'Fixed ambience', short: 'AMBIENCE', gives: 'A stable mono or stereo sense of the venue and its audience, through every play.', limit: 'Less action isolation; a nearby spectator or the PA can dominate it.', mics: [AMB_E], note: 'An XY pair of cardioids is a useful starting comparison; a single broad mic a simpler mono fallback.' },
  { id: 'structure', label: 'An approved structure or boundary mic', short: 'STRUCTURE', gives: 'A repeatable local effect where a specific mount is allowed — the backstop side of the plate, an approved surface.', limit: 'Impact, vibration, the ball and the structure’s own rules can rule it out. Nothing on goals, nets or flagposts.', mics: [{ ...B13_SETUPS[2].mics[0], id: 'st' }], scene: BASE, box: { x0: -30, y0: -26, x1: 30, y1: 34 }, note: 'Mounting approval first; never through screening into live-ball space.' },
];

function B13Microphone(p: PageProps) {
  const methods = useMethodsStep({ scene: PRACTICE_FIELD, methods: METHODS, prediction: p.lesson.predictions.microphone, prompt: 'Choose each METHOD: what it gives, and what limits it.', done: 'Shotguns and dishes favour selected action; fixed pickup favours continuity. No one method covers a field — the plan names who covers what.' });
  return <PageSteps steps={[methods, checkStep(p, 'microphone')]} />;
}

/* ═════════ 4 · PLACEMENT ═════════ */

function B13Placement(p: PageProps) {
  const worked = useWorkedStep({
    scene: PRACTICE_FIELD,
    mic: SG_A,
    title: 'a perimeter shotgun at M on A',
    pieces: [
      { key: 'WHERE', value: 'MARK M', title: 'WHERE TO BEGIN', text: 'At the approved mark M on the crew strip — outside the 6 m offset, out of every route, the way out behind it clear.' },
      { key: 'HEIGHT', value: '≈ 1.2 m', title: 'THE HEIGHT', text: 'The capsule about 1.2 m up — only if that mount is approved. Log the capsule height; the range is measured to the source’s own height.' },
      { key: 'AIM', value: 'ON A · 0°', title: 'THE AIM', text: 'The axis on A, straight ahead. Where an approved angle allows, the loudest crowd or PA sector farther off the axis.' },
      { key: 'RANGE', value: '10.0 m', title: 'THE RANGE', text: 'About 10 m from M to A in plan — the lesson’s own layout. Keep the gain fixed for the whole A–B–C sequence.' },
      { key: 'CLEAR', value: 'APPROVED', title: 'CLEARANCE', text: 'Nothing protrudes into the offset, a route or a camera’s frame; the suspension and the windshield fitted, the cable clear of them.' },
    ],
  });
  const place = usePlacementStep({
    p,
    scene: PRACTICE_FIELD,
    zones: B13_PLACE,
    starts: B13_SETUPS.filter((s) => ['su.one', 'su.dish', 'su.low'].includes(s.id)),
    ranges: { x: [11, 19], y: [-9, -2], h: [0.3, 2.0] },
    arc: PF_ARC,
    arcKinds: ['dish'],
    prediction: p.lesson.predictions.placement,
  });
  const steps: MikingStep[] = [
    worked,
    place,
    ...placementLearnStep(
      p,
      `After our research, each blue starting point is where we suggest you begin — from the approved mark, the axis on a named target, at a height you log. They are starting points, not rules: compare one change at a time, and use your ears. Experimentation is encouraged. The dish is a hand-held collector here: its axis about ${DISH_H.toFixed(1)} m up is only the drawing’s.`,
      'Approval comes first: never into the offset, the play or a route to get closer — distance is the plan’s to solve, not the operator’s legs.',
    ),
  ];
  return <PageSteps steps={steps} />;
}

/* ═════════ 5 · LIVE CHECKS (context) ═════════ */

function B13Context(p: PageProps) {
  const { onInteractive, interactiveDone } = p;
  const [got, setGot] = useState<ReadonlySet<string>>(() => new Set());
  const note = useCallback(
    (id: string) => {
      setGot((prev) => {
        if (prev.has(id)) return prev;
        const n = new Set([...prev, id]);
        if (n.has('coverageMap') && n.has('headroomChain') && !interactiveDone.has('liveChecks')) onInteractive('liveChecks');
        return n;
      });
    },
    [interactiveDone, onInteractive],
  );
  const coverage = useCoverageStep({ scene: PRACTICE_FIELD, tasks: B13_COVERAGE, mics: [SG_A, DISH_A, AMB_E], onInteractive: note, done: got.has('coverageMap') });
  const headroom = useHeadroomStep({ onInteractive: note, done: got.has('headroomChain'), prediction: p.lesson.predictions.context });
  return <PageSteps steps={[coverage, headroom, checkStep(p, 'context')]} />;
}

/* ═════════ 6 · TWO MICS ═════════ */

function B13TwoMic(p: PageProps) {
  const overlap = useOverlapStep({
    scene: PRACTICE_FIELD,
    a: B13_OVERLAP.a,
    b: B13_OVERLAP.b,
    path: B13_OVERLAP.path,
    onInteractive: p.onInteractive,
    done: p.interactiveDone.has('polarityVsDelay'),
    prediction: p.lesson.predictions.twoMic,
    intro: 'Walk the source from A to C (WALK): the shotgun at M and the ambience at E hear it at different times. Flip B’s POLARITY both ways and watch which readouts change.',
  });
  return <PageSteps steps={[overlap, checkStep(p, 'twoMic')]} />;
}

export const B13_PAGES: Partial<Record<SourcePageId, PageFn>> = {
  meet: B13Meet,
  setups: B13Setups,
  microphone: B13Microphone,
  placement: B13Placement,
  context: B13Context,
  twoMic: B13TwoMic,
};
export const B13_STEP_COUNTS: Partial<Record<SourcePageId, number>> = { meet: 5, setups: 3, microphone: 2, placement: 4, context: 3, twoMic: 2 };
