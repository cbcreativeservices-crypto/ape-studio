/**
 * B12 PARABOLIC AND TRACKED ACTION PICKUP — the lesson's own pages
 * (LessonArt.pages), on the journey, built from the shared sports steps
 * (lessons/shared/sports/sportsPages.tsx, sportsTools.tsx):
 *
 *   MEET IT          START → WHAT IT IS (the dish, cut away) → THE PARTS
 *                    (the bowl, the rim, the focus, the element, the hub, the
 *                    grip, the cover) → HOW THE BOWL WORKS (the dish tool:
 *                    size, aim error, focus slide, cover) → checks
 *   STARTING SETUPS  the setups on the practice field → what else the dish
 *                    hears → before any mic + checks
 *   MICROPHONES      the dish and its alternatives on the plan → checks
 *   PLACEMENT        the worked example → aim the dish inside the arc, or
 *                    the fixed shotgun → how the starting points work → checks
 *   TRACKING         track a walking source, stop at the arc and hand off →
 *                    the headroom chain → checks
 *   TWO MICS         the dish and the fixed shotgun on one walking source
 * TROUBLESHOOT and PRACTICE are the engine's. FULLY SILENT; nothing moves by
 * itself.
 */
import { useCallback, useState, type ReactNode } from 'react';
import { Circle } from '@shopify/react-native-skia';
import type { SourcePageId } from '../../engine/model/types.ts';
import { PageSteps, type MikingStep } from '../../engine/steps';
import { Body, Card, Landing, Point } from '../../engine/kit';
import { ExpandableFigure } from '../../../kit/ExpandableFigure';
import type { PageProps } from '../../pages/pageTypes';
import { factsStep, startStep } from '../shared/journeyPages';
import { FieldStage } from '../shared/field/FieldStage';
import { DishRays, DishSection } from '../shared/sports/DishArt';
import { DISHES, halfWidthAt } from '../shared/sports/parabolic.ts';
import { PRACTICE_FIELD } from '../shared/sports/practiceScenes.ts';
import { sportPlan } from '../shared/sports/sportPlans.ts';
import { OUTDOOR_ROWS } from '../shared/sports/safety.ts';
import { beforeStep, checkStep, hearsStep, placementLearnStep, useHeadroomStep, useMethodsStep, useOverlapStep, usePlacementStep, useSetupsStep, useTrackStep, useWorkedStep, type Method, type SportSetup } from '../shared/sports/sportsPages';
import { useDishStep } from '../shared/sports/sportsTools';
import { AMB_E, B12_OVERLAP, B12_PLACE, B12_SETUPS, DISH_A, DISH_H, F, PF_ARC, SG_F, TRACK_PATH } from './model.ts';

type PageFn = (p: PageProps) => ReactNode;
const DISH = DISHES.large;
const R = halfWidthAt(DISH, DISH.depth);
const BOX = { u0: -280, u1: DISH.depth + 300, v0: -R - 80, v1: R + 320 };

/* ═════════ 1 · MEET IT ═════════ */

const PARTS: readonly { id: string; label: string; at: { u: number; v: number }; text: string }[] = [
  { id: 'bowl', label: 'THE BOWL', at: { u: 60, v: -R * 0.55 }, text: 'A paraboloid: every ray arriving along the axis reflects toward one point. Its width sets the lowest frequency it can gather.' },
  { id: 'rim', label: 'THE RIM', at: { u: DISH.depth, v: -R }, text: 'The bowl’s front edge. Some makers measure the focus from the front face; others from the hub — use the one your maker names.' },
  { id: 'focus', label: 'THE FOCUS', at: { u: DISH.f, v: 0 }, text: 'Where the on-axis reflections meet. The element goes exactly here, at the maker’s reference.' },
  { id: 'element', label: 'THE ELEMENT', at: { u: DISH.f + 20, v: 0 }, text: 'A small capsule FACING the bowl — the type the maker specifies (one large dish calls for an omni). Never a shotgun swapped in by assumption.' },
  { id: 'hub', label: 'THE HUB AND BOOM', at: { u: -24, v: 0 }, text: 'The mount at the bottom of the bowl, holding the element on the axis.' },
  { id: 'grip', label: 'THE GRIP AND CABLE', at: { u: -40, v: 120 }, text: 'The intended handle or an approved support; a short cable secured clear of the dish and the walkway — squeaks and bumps reach the element.' },
  { id: 'cover', label: 'THE WIND COVER', at: { u: DISH.depth + 14, v: R * 0.4 }, text: 'A cover made for the dish and its element: it must never shift the focus or touch the element. Not waterproofing.' },
];

function usePartsStep(): MikingStep {
  const [k, setK] = useState(0);
  const [seen, setSeen] = useState<ReadonlySet<string>>(() => new Set(['bowl']));
  const pt = PARTS[k];
  return {
    key: 'parts',
    title: 'The parts',
    kind: 'TRY',
    layout: 'rack',
    rack: {
      render: (w, h) => (
        <FieldStage w={w} h={h} view="side" box={BOX} a11y={`The dish cut along its axis. Highlighted: ${pt.label.toLowerCase()}. ${pt.text}`} labels={[{ id: 'p', text: pt.label, u: pt.at.u, v: pt.at.v - 110, align: 'center', tone: 'amber', at: pt.at }]}>
          {(px) => (
            <>
              <DishSection dish={DISH} px={px} wind={pt.id === 'cover'} />
              <Circle cx={pt.at.u} cy={pt.at.v} r={22 * px} color="#ffc64d" opacity={0.14} />
              <Circle cx={pt.at.u} cy={pt.at.v} r={22 * px} style="stroke" strokeWidth={2.6 * px} color="#ffc64d" />
            </>
          )}
        </FieldStage>
      ),
      badge: 'The dish cut along its axis · amber ring = the part you chose · a simplified picture',
      bezel: [
        { k: 'PART', v: pt.label.replace('THE ', ''), flex: 1.6 },
        { k: 'LOOKED AT', v: `${seen.size} / ${PARTS.length}`, flex: 1 },
      ],
      params: [
        {
          kind: 'fader',
          id: 'part',
          label: 'PART',
          value: k / (PARTS.length - 1),
          onChange: (v) => {
            const i = Math.round(v * (PARTS.length - 1));
            setK(i);
            setSeen((s) => (s.has(PARTS[i].id) ? s : new Set([...s, PARTS[i].id])));
          },
          format: () => `${k + 1} of ${PARTS.length} · ${pt.label.toLowerCase()}`,
          formatShort: () => pt.label.replace('THE ', '').slice(0, 8),
        },
      ],
      initialParam: 'part',
    },
    well: (
      <>
        <Landing looking="The dish · cut along its axis" prompt="Step through PART: the bowl, the rim, the focus, the element, the hub, the grip and the cover." />
        <Card>
          <Point title={pt.label}>{pt.text}</Point>
        </Card>
        <Body>{`Looked at: ${seen.size} of ${PARTS.length}.`}</Body>
      </>
    ),
  };
}

function B12Meet(p: PageProps) {
  const { lesson, journey } = p;
  const parts = usePartsStep();
  const tool = useDishStep({ onInteractive: () => undefined, done: true, prediction: lesson.predictions.meet });
  const steps: MikingStep[] = [
    startStep(lesson, journey, ''),
    factsStep(
      lesson,
      <ExpandableFigure
        badge="The dish cut along its axis · blue = sound arriving on the axis, amber = its reflections"
        title="THE DISH"
        aspect={(BOX.u1 - BOX.u0) / (BOX.v1 - BOX.v0)}
        render={(w: number, h: number) => (
          <FieldStage w={w} h={h} view="side" box={{ ...BOX, u1: DISH.depth + 640 }} a11y="A hand-held parabolic dish cut along its axis: the bowl, the element at the focus facing the bowl, the hub and the grip; sound arriving along the axis reflects to the focus." labels={[]}>
            {(px) => (
              <>
                <DishSection dish={DISH} px={px} />
                <DishRays dish={DISH} offDeg={0} px={px} low={false} />
              </>
            )}
          </FieldStage>
        )}
      />,
    ),
    parts,
    { ...tool, title: 'How the bowl works' },
    checkStep(p, 'meet'),
  ];
  return <PageSteps steps={steps} />;
}

/* ═════════ 2 · STARTING SETUPS ═════════ */

function B12Setups(p: PageProps) {
  const setups = useSetupsStep({ p, scene: PRACTICE_FIELD, setups: B12_SETUPS, prompt: 'Step through SETUP. Each is drawn from the operator’s approved place, with its aim and range; the corner box shows the dish itself, cut away.' });
  return <PageSteps steps={[setups, hearsStep(p.lesson, 'A dish hears what is on its axis — and its operator works among people and loud moments. These decide where it goes and what covers the rest:'), beforeStep(p, OUTDOOR_ROWS)]} />;
}

/* ═════════ 3 · MICROPHONES ═════════ */

const BB = sportPlan('basketball');
const METHODS: Method[] = [
  { id: 'dish', label: 'The parabolic dish', short: 'DISH', gives: 'Selected distant transients and calls from an approved viewing place, turned within an arc.', limit: 'Helps the high frequencies most; focus and aim are critical; whatever is on the axis is gathered too.', mics: [DISH_A] },
  { id: 'shotgun', label: 'An approved perimeter shotgun', short: 'SHOTGUN', gives: 'A known closer zone covered without anyone turning; the operator or mount stays outside play.', limit: 'Depends on angle and acoustics; no distant mic rejects sound from the same direction as the target.', mics: [SG_F] },
  { id: 'boundary', label: 'A fixed boundary or protected effect mic', short: 'BOUNDARY', gives: 'A discrete, predictable place on an approved surface or structure.', limit: 'Mounting approval, vibration, impact and weather may rule it out.', mics: [{ id: 'bd', kind: 'boundary', label: 'boundary mic', at: { x: 31.6, y: 12.5 }, h: 0, aimAt: { x: 26, y: 7.5 }, aimH: 0 }], scene: BB, note: 'Only on an approved surface, beyond the court’s clear band.' },
  { id: 'ambience', label: 'A wider ambience pair', short: 'AMBIENCE', gives: 'A clearer venue perspective when tracking fails or atmosphere is the goal.', limit: 'Less isolated action detail — label the source as ambience.', mics: [AMB_E] },
  { id: 'second', label: 'A second dish at a second approved place', short: '2ND DISH', gives: 'Separate action zones covered by two operators.', limit: 'Needs coordination, radio and cable planning, and a handoff to avoid doubled, coloured transients.', mics: [DISH_A, { ...DISH_A, id: 'd2', at: F, aimAt: { x: 5, y: 10 } }] },
];

function B12Microphone(p: PageProps) {
  const methods = useMethodsStep({ scene: PRACTICE_FIELD, methods: METHODS, prediction: p.lesson.predictions.microphone, prompt: 'Choose each METHOD: when it is useful, and what it costs.', done: 'The dish is often a supplement. Decide by the target against the background and its tone — in a reflective room a close permitted mic may sound more natural than a long-distance dish.' });
  return <PageSteps steps={[methods, checkStep(p, 'microphone')]} />;
}

/* ═════════ 4 · PLACEMENT ═════════ */

const FIXED_START: SportSetup = { ...B12_SETUPS[1], id: 'su.fixed', title: 'The fixed shotgun at F', start: 'At the approved place F, about 1.2 m up, its axis on B.', mics: [SG_F] };

function B12Placement(p: PageProps) {
  const worked = useWorkedStep({
    scene: PRACTICE_FIELD,
    mic: DISH_A,
    title: 'the dish from the operator’s place, on A',
    pieces: [
      { key: 'TARGET', value: 'A', title: 'THE TARGET FIRST', text: 'Choose the sound before the dish: here, speech and gentle claps at A. Locate its travel, the crowd and PA direction, the cameras and the exits.' },
      { key: 'PLACE', value: 'MARK M', title: 'THE PLACE', text: 'The approved operating place at M: the operator, the dish, its support and its cable all stay there — the no-entry edge drawn.' },
      { key: 'FOCUS', value: 'MAKER’S', title: 'THE FOCUS', text: 'Assembled by its manual: the element at the maker’s focal reference, measured from the surface the maker names; rechecked after travel.' },
      { key: 'AIM', value: 'ON A', title: 'THE AIM', text: 'The dish’s axis on A; then small turns to find the useful action and the least background, listening on headphones that started low.' },
      { key: 'ARC', value: '±40°', title: 'THE ARC', text: 'Turn only inside the marked arc. Past it, stop and hand off — another crew member watches the surroundings.' },
    ],
  });
  const place = usePlacementStep({
    p,
    scene: PRACTICE_FIELD,
    zones: B12_PLACE,
    starts: [B12_SETUPS[0], FIXED_START],
    ranges: { x: [4, 19], y: [-9, -2], h: [0.3, 2.0] },
    arc: PF_ARC,
    arcKinds: ['dish'],
    prediction: p.lesson.predictions.placement,
  });
  const steps: MikingStep[] = [
    worked,
    place,
    ...placementLearnStep(
      p,
      `After our research, each blue starting point is where we recommend you begin — the dish from the approved place, its axis on a chosen target, inside the arc; the fixed shotgun on the zone the dish lets go. Starting points, not rules: listen, compare, and use your ears. Experimentation is encouraged. The dish’s axis about ${DISH_H.toFixed(1)} m up is only the drawing’s.`,
      'Never run backward while looking into the dish, never chase play into a crew lane or the run-off — a good angle never justifies an unapproved place.',
    ),
  ];
  return <PageSteps steps={steps} />;
}

/* ═════════ 5 · TRACKING AND HEADROOM (context) ═════════ */

function B12Context(p: PageProps) {
  const { onInteractive, interactiveDone } = p;
  const [got, setGot] = useState<ReadonlySet<string>>(() => new Set());
  const note = useCallback(
    (id: string) => {
      setGot((prev) => {
        if (prev.has(id)) return prev;
        const n = new Set([...prev, id]);
        if (n.has('handoff') && n.has('headroomChain') && !interactiveDone.has('liveChecks')) onInteractive('liveChecks');
        return n;
      });
    },
    [interactiveDone, onInteractive],
  );
  const track = useTrackStep({ scene: PRACTICE_FIELD, dish: DISH_A, arc: PF_ARC, path: TRACK_PATH, fixed: { ...SG_F, aimAt: { x: 4, y: 6 } }, onInteractive: note, done: got.has('handoff') });
  const headroom = useHeadroomStep({ onInteractive: note, done: got.has('headroomChain') });
  return <PageSteps steps={[track, headroom, checkStep(p, 'context')]} />;
}

/* ═════════ 6 · TWO MICS ═════════ */

function B12TwoMic(p: PageProps) {
  const overlap = useOverlapStep({
    scene: PRACTICE_FIELD,
    a: B12_OVERLAP.a,
    b: B12_OVERLAP.b,
    path: B12_OVERLAP.path,
    onInteractive: p.onInteractive,
    done: p.interactiveDone.has('polarityVsDelay'),
    prediction: p.lesson.predictions.twoMic,
    intro: 'Walk the source from A to C (WALK): the dish at M and the fixed shotgun at F hear it at different times. Flip B’s POLARITY both ways and watch which readouts change.',
  });
  return <PageSteps steps={[overlap, checkStep(p, 'twoMic')]} />;
}

export const B12_PAGES: Partial<Record<SourcePageId, PageFn>> = {
  meet: B12Meet,
  setups: B12Setups,
  microphone: B12Microphone,
  placement: B12Placement,
  context: B12Context,
  twoMic: B12TwoMic,
};
export const B12_STEP_COUNTS: Partial<Record<SourcePageId, number>> = { meet: 5, setups: 3, microphone: 2, placement: 4, context: 3, twoMic: 2 };
