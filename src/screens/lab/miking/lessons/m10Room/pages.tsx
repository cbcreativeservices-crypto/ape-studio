/**
 * M10 DRUM ROOM MICROPHONES — the lesson's own pages: ORIENT (the kit in its
 * room), HOW THE ROOM SOUNDS (arrival times near and far; the room's first
 * reflections, drawn from mirror images — the image-source picture of one
 * bounce) and WHERE IT SITS (the room's plan). The rest of the journey uses
 * the shared pages.
 */
import { useCallback, useMemo, type ReactElement } from 'react';
import type { ViewId } from '../../engine/model/types.ts';
import { PageSteps, type MikingStep } from '../../engine/steps';
import { Card, Note, Point, ScenarioList } from '../../engine/kit';
import type { PageProps } from '../../pages/pageTypes';
import { PKitOrient } from '../shared/kitPages/PKitOrient';
import { useArrivalsStep } from '../shared/kitPages/kitSoundSteps';
import type { ArrivalPoint, ArrivalSource } from '../shared/kitPages/ArrivalsScene';
import { KIT_FLOOR_Y, yAt } from '../shared/kitPlanModel.ts';
import { O, S0 } from '../shared/kitScene/kitSceneModel.ts';
import { KIT_PLACED_CYMBALS } from '../shared/cymbals/cymbalSpec.ts';
import { GJ_MAIN } from '../m09Overheads/model.ts';
import { M10_ARRIVALS, M10_ECHOES, M10_ORIENT } from './copy.ts';
import { CORNER_R, FRONT_LDC, LOW_CENTRE, ROOM, TRIAL_B, snareImages } from './model.ts';
import { M10_VIEWS } from './geometry.ts';
import { RoomArt } from './RoomArt';
import { PRoomSetting } from './PRoomSetting';

export function M10Orient(p: PageProps) {
  return <PKitOrient {...p} words={M10_ORIENT} />;
}

const SOURCES: ArrivalSource[] = [
  { id: 'snare', label: 'snare', p: S0, color: '#6fa8ff' },
  { id: 'kick', label: 'kick', p: O, color: '#ff8c3c' },
  { id: 'crash2', label: '18 in crash', p: KIT_PLACED_CYMBALS.crash2.c, color: '#e7a6ff' },
];
const POINTS: ArrivalPoint[] = [
  { id: 'over', label: 'OVERHEAD · OVER THE SNARE', short: 'OVERHEAD', p: GJ_MAIN },
  { id: 'low', label: 'LOW, 1 M IN FRONT', short: 'LOW 1 M', p: LOW_CENTRE },
  { id: 'front', label: '1.5 M IN FRONT', short: '1.5 M OUT', p: FRONT_LDC },
  { id: 'far', label: 'FARTHER OUT (SPOT B)', short: 'SPOT B', p: TRIAL_B },
  { id: 'corner', label: 'A FRONT CORNER', short: 'CORNER', p: CORNER_R },
];

const IMAGES = snareImages();

/** The room as a drawing behind the arrivals (wider than the room for the mirror images). */
function RoomBackground({ view }: { view: ViewId }): ReactElement {
  return <RoomArt view={view} variant="studio" />;
}
const NEAR_BOX = { side: { u0: -1300, u1: 4100, v0: yAt(3000), v1: KIT_FLOOR_Y + 40 }, top: { u0: -1300, u1: 4100, v0: ROOM.left, v1: ROOM.right } };
const ECHO_BOX = {
  side: { u0: ROOM.back - 1800, u1: ROOM.front + 1800, v0: yAt(ROOM.ceilingH) - 2500, v1: KIT_FLOOR_Y + 700 },
  top: { u0: ROOM.back - 1800, u1: ROOM.front + 1800, v0: ROOM.left - 2600, v1: ROOM.right + 600 },
};

export function M10Sound({ lesson, answers, onAnswered, onInteractive, interactiveDone }: PageProps) {
  const reached = useCallback(() => {
    if (!interactiveDone.has('soundPath')) onInteractive('soundPath');
  }, [interactiveDone, onInteractive]);
  const near = useArrivalsStep({ words: M10_ARRIVALS, box: NEAR_BOX, Background: RoomBackground, sources: SOURCES, points: POINTS, maxMs: 16 });
  const snareOnly = useMemo(() => SOURCES.filter((s) => s.id === 'snare'), []);
  const echoes = useArrivalsStep({ words: M10_ECHOES, box: ECHO_BOX, Background: RoomBackground, sources: snareOnly, points: POINTS.slice(1), images: IMAGES, maxMs: 30, onAllArrived: reached });
  const reachedAll = interactiveDone.has('soundPath');
  const steps: MikingStep[] = [
    near,
    echoes,
    {
      key: 'body',
      title: 'Direct, early, late',
      kind: 'CHECK',
      layout: 'read',
      body: (
        <>
          <Card>
            <Point title="DIRECT">{lesson.sound.attack}</Point>
            <Point title="EARLY AND LATE">{lesson.sound.body}</Point>
            <Point title="WHAT A ROOM MIC HEARS">The kit after its parts have begun to blend, plus the room’s answer. Closer, more direct kit; farther, more reflections and decay. The useful balance depends on this room, this kit and what you want — no distance is a room mic by itself.</Point>
          </Card>
          <Note>This lab never plays a sound and draws no frequency curve for the room: how a room sounds depends on its size, its surfaces, the kit and the player. The pictures show where the sound goes and when it arrives.</Note>
          {!reachedAll ? <Note tone="warn">On step 2, drag TIME past the last reflection to earn this page’s credit.</Note> : null}
          <ScenarioList items={lesson.scenarios.filter((s) => s.page === 'sound')} answers={answers} onAnswered={onAnswered} />
        </>
      ),
    },
  ];
  return <PageSteps steps={steps} />;
}

export const M10_PAGES = { instrument: M10Orient, sound: M10Sound, setting: PRoomSetting };
export { M10_VIEWS };
