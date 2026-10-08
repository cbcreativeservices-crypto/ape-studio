/**
 * B16 MOTORSPORT, EQUESTRIAN AND AQUATIC EVENTS — the lesson's own pages
 * (LessonArt.pages), on the journey (docs/labs/miking/LESSON_JOURNEY.md),
 * built from the shared sports steps (lessons/shared/sports/):
 *
 *   MEET IT          START → WHAT IT IS (the practice room) → THE VENUES (a
 *                    circuit, a jumping arena, a pool, layer by layer) →
 *                    WHERE THE SOUND COMES FROM (A, B, C from M1) → checks
 *   STARTING SETUPS  the setups drawn on the plans (and the optional
 *                    hydrophone in its container) → what else the mics hear
 *                    → before any mic (the one sports safety card) + checks
 *   MICROPHONES      the pickup methods compared → checks
 *   PLACEMENT        the worked example → MOVE and AIM in the practice room
 *                    → how the starting points work → checks
 *   LIVE CHECKS      the coverage map → the headroom chain → checks
 *   TWO MICS         the PASS-BY: one walking source past M1 and M2, the aim
 *                    across or along, the double range → checks
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
import { MOTOR_HORSE_WATER, containerPlan, sportPlan } from '../shared/sports/sportPlans.ts';
import { SPORTS_SAFETY } from '../shared/sports/safety.ts';
import { p2, rectUV } from '../shared/sports/venuePlan.ts';
import { usePassByStep } from '../shared/sports/arenaPages';
import { withInsetRoom } from '../shared/sports/arenaPlans.ts';
import { beforeStep, checkStep, hearsStep, placementLearnStep, useCoverageStep, useHeadroomStep, useMethodsStep, usePlacementStep, usePlanTourStep, useRangeStep, useSetupsStep, useWorkedStep, type Method } from '../shared/sports/sportsPages';
import { B16_COVERAGE, B16_PASS, B16_PLACE, B16_SETUPS, HYDRO, MEDIA_SG, SG2_B, SG_B } from './model.ts';

type PageFn = (p: PageProps) => ReactNode;

/* ═════════ 1 · MEET IT ═════════ */

function B16Meet(p: PageProps) {
  const { lesson, journey } = p;
  const tour = usePlanTourStep({ sports: MOTOR_HORSE_WATER, title: 'The venues', prompt: 'Step through LAYER on each SPORT: where the action runs, what stays clear, the routes people and animals need, the places a mic may be approved, and what nothing is attached to.', a11yLead: 'A plan of' });
  const range = useRangeStep({ scene: PRACTICE_SMALL, from: PS.M1, fromH: PS.h, fromLabel: 'M1', prediction: lesson.predictions.meet, prompt: 'Step through TARGET: the approach, the closest point and the departure of one walk, from one equipment area.' });
  const box = PRACTICE_SMALL.frame;
  const steps: MikingStep[] = [
    startStep(lesson, journey, '', { ownIntro: true }),
    factsStep(
      lesson,
      <ExpandableFigure
        badge="The practice room from above · the walk A–B–C, M1 and M2 either side"
        title="THE PRACTICE ROOM"
        aspect={(box.x1 - box.x0) / (box.y1 - box.y0)}
        render={(w: number, h: number) => (
          <FieldStage w={w} h={h} view="top" box={rectUV(box)} a11y="The practice room from above: a walking line through A, B and C two metres apart, equipment area M1 two metres to one side of B and M2 two metres to the other." labels={venueLabels(PRACTICE_SMALL, { layers: true })}>
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

const ROWS = [SPORTS_SAFETY.approval, SPORTS_SAFETY.play, SPORTS_SAFETY.animals, SPORTS_SAFETY.lightning, SPORTS_SAFETY.weather, SPORTS_SAFETY.electrics, SPORTS_SAFETY.hearing, SPORTS_SAFETY.feedback, SPORTS_SAFETY.withdraw];

function B16Setups(p: PageProps) {
  const setups = useSetupsStep({ p, scene: PRACTICE_SMALL, setups: B16_SETUPS, prompt: 'Step through SETUP. Each mic is drawn at its approved place with its aim; the corner box shows the mic itself at its height — or the hydrophone in its container.' });
  const steps: MikingStep[] = [
    setups,
    hearsStep(p.lesson, 'A fixed mic hears a moving source change in distance, angle and state all at once — and whatever else shares the axis:'),
    beforeStep(p, ROWS, <Note tone="warn">Near horses: no flash, no loud test tones, no abrupt movement — follow the stewards. A quiet track or a missing engine is not a release: install and retrieve only in a released period.</Note>),
  ];
  return <PageSteps steps={steps} />;
}

/* ═════════ 3 · MICROPHONES ═════════ */

const CIR = sportPlan('circuit');
const JMP = sportPlan('jumping');
const POOL = sportPlan('pool');
const POOL_FAR = POOL.footprints.find((f) => f.id === 'far')!.rect;
const JMP_P2 = JMP.footprints.find((f) => f.id === 'p2')!.rect;
const METHODS_RAW: Method[] = [
  { id: 'fixed', label: 'A fixed directional', short: 'FIXED', gives: 'One track sector, one landing region, one pool segment — from an approved place.', limit: 'Range, height and angle change as the source moves: near and far coverage is unequal. Its rejection depends on frequency; it has no universal reach.', mics: [MEDIA_SG], scene: CIR, box: { x0: -12, y0: -16, x1: 60, y1: 30 }, note: 'Aim obliquely along the segment for the approach, or across it for a short contact region.' },
  { id: 'mono', label: 'Fixed mono ambience', short: 'MONO', gives: 'A stable identity for the event, and the fallback when detail is lost.', limit: 'Less sense of the path; a nearby loudspeaker or spectator can dominate it.', mics: [{ id: 'mn', kind: 'compact', label: 'mono ambience', at: { x: (POOL_FAR.x0 + POOL_FAR.x1) / 2, y: (POOL_FAR.y0 + POOL_FAR.y1) / 2 }, h: 1.6, aimAt: p2(25, 12.5), aimH: 1.0, pattern: 'cardioid' }], scene: POOL, note: 'Keep it useful when every detail channel is muted.' },
  { id: 'xy', label: 'Coincident stereo', short: 'COINCIDENT', gives: 'The approach and the departure, or a wider venue view, as left and right.', limit: 'Its orientation and the downmix matter; a moving source can change level more than position.', mics: [{ id: 'xy', kind: 'xy', label: 'coincident pair', at: { x: (POOL_FAR.x0 + POOL_FAR.x1) / 2, y: (POOL_FAR.y0 + POOL_FAR.y1) / 2 }, h: 1.6, aimAt: p2(25, 12.5), aimH: 1.0, pattern: 'cardioid' }], scene: POOL, note: 'Log the pattern, the angle, the orientation and the reference axis.' },
  { id: 'ab', label: 'Spaced stereo', short: 'SPACED', gives: 'A wide perspective, with arrival differences between the two mics.', limit: 'The mono sum can colour a shared action sound; the spacing decides how much.', mics: [{ id: 'ab', kind: 'ab', label: 'spaced pair', at: { x: (JMP_P2.x0 + JMP_P2.x1) / 2, y: (JMP_P2.y0 + JMP_P2.y1) / 2 }, h: 1.6, aimAt: p2(40, 30), aimH: 1.2, pattern: null }], scene: JMP, note: 'Log the separation, and check correlated action in mono.' },
  { id: 'hydro', label: 'An optional hydrophone', short: 'HYDROPHONE', gives: 'Underwater pressure: a different medium and a different perspective.', limit: 'Flow, bubbles and the container’s own sound; the dB figures of water and air are not comparable — equal level is not equal pressure.', mics: [HYDRO], scene: containerPlan(), note: 'Not the default aquatic mic: above-water pickup is. The connectors stay dry.' },
];
/** A method drawn on a venue outline shows no close-up (its height is a drawing default); the hydrophone keeps its section, beside the plan. */
const METHODS: Method[] = METHODS_RAW.map((m) => (!m.scene ? m : m.mics[0]?.kind === 'hydrophone' ? { ...m, box: withInsetRoom(m.box ?? m.scene.frame) } : { ...m, noCloseUp: true }));

function B16Microphone(p: PageProps) {
  const methods = useMethodsStep({ scene: PRACTICE_SMALL, methods: METHODS, prediction: p.lesson.predictions.microphone, prompt: 'Choose each METHOD: what it gives, and what limits it.', done: 'Directional detail, stereo trajectories and a stable ambience serve different perspectives — and water is a different medium altogether. Choose the perspective first, then the mic.' });
  return <PageSteps steps={[methods, checkStep(p, 'microphone')]} />;
}

/* ═════════ 4 · PLACEMENT ═════════ */

function B16Placement(p: PageProps) {
  const worked = useWorkedStep({
    scene: PRACTICE_SMALL,
    mic: SG_B,
    title: 'a short shotgun at M1, across the walk',
    pieces: [
      { key: 'WHERE', value: 'M1', title: 'WHERE TO BEGIN', text: 'In equipment area M1, beside the middle of the walk — the stand, the cable loop and the windshield inside the area.' },
      { key: 'HEIGHT', value: '≈ 1 m', title: 'THE HEIGHT', text: 'The capsule about 1 m up, at the clap and speech height. There is no universal trackside height: a real one follows the assigned access and its protection.' },
      { key: 'AIM', value: 'ACROSS', title: 'THE AIM', text: 'Across the walk, at B: a short, strong sector. Aimed along the walk instead, the approach stays on the axis longer.' },
      { key: 'RANGE', value: '2.0 m', title: 'THE RANGE', text: 'About 2 m at the closest point, about 2.83 m at A and C. Keep the gain fixed for the whole walk.' },
      { key: 'CLEAR', value: 'IN AREA', title: 'CLEARANCE', text: 'Nothing in the walking path; a real course, arena or deck adds its run-off, gates and routes.' },
    ],
  });
  const place = usePlacementStep({
    p,
    scene: PRACTICE_SMALL,
    zones: B16_PLACE,
    starts: B16_SETUPS.filter((s) => ['su.obl', 'su.cmp', 'su.dbl'].includes(s.id)),
    ranges: { x: [1.2, 2.8], y: [-4.6, -0.9], h: [0.3, 1.6] },
    prediction: p.lesson.predictions.placement,
  });
  const steps: MikingStep[] = [
    worked,
    place,
    ...placementLearnStep(
      p,
      'After our research, each blue starting point is where we recommend you begin — from the approved equipment area, the axis across the walk or along it. They are starting points, not rules: compare one change at a time and use your ears. Experimentation is encouraged.',
      'For a real course, arena or pool, replace these practice distances with the approved survey — and never move toward the action, over a barrier or into a run-off to get closer.',
    ),
  ];
  return <PageSteps steps={steps} />;
}

/* ═════════ 5 · LIVE CHECKS (context) ═════════ */

function B16Context(p: PageProps) {
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
  const coverage = useCoverageStep({ scene: PRACTICE_SMALL, tasks: B16_COVERAGE, mics: [SG_B, SG2_B], onInteractive: note, done: got.has('coverageMap') });
  const headroom = useHeadroomStep({ onInteractive: note, done: got.has('headroomChain'), prediction: p.lesson.predictions.context });
  return <PageSteps steps={[coverage, headroom, checkStep(p, 'context')]} />;
}

/* ═════════ 6 · THE PASS-BY (twoMic) ═════════ */

function B16TwoMic(p: PageProps) {
  const pass = usePassByStep({
    scene: PRACTICE_SMALL,
    path: B16_PASS.path,
    hSrc: PS.h,
    m1: B16_PASS.m1,
    far: B16_PASS.far,
    m2: B16_PASS.m2,
    aims: B16_PASS.aims,
    pattern: 'supercardioid',
    stops: [
      { t: 0, short: 'A' },
      { t: 0.5, short: 'B' },
      { t: 1, short: 'C' },
    ],
    onInteractive: p.onInteractive,
    done: p.interactiveDone.has('passBy'),
    prediction: p.lesson.predictions.twoMic,
    intro: 'WALK the source from A through B to C with both mics fixed. Then AIM mic 1 along the walk instead of across it, and move mic 1 twice as far: watch its level along the walk and the delay between the two mics.',
  });
  return <PageSteps steps={[pass, checkStep(p, 'twoMic')]} />;
}

export const B16_PAGES: Partial<Record<SourcePageId, PageFn>> = {
  meet: B16Meet,
  setups: B16Setups,
  microphone: B16Microphone,
  placement: B16Placement,
  context: B16Context,
  twoMic: B16TwoMic,
};
export const B16_STEP_COUNTS: Partial<Record<SourcePageId, number>> = { meet: 5, setups: 3, microphone: 2, placement: 4, context: 3, twoMic: 2 };
