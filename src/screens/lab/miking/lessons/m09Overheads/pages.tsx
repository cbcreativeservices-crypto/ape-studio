/**
 * M09 DRUM OVERHEADS — the lesson's own pages (LessonArt.pages): ORIENT and
 * HOW IT SOUNDS for a whole kit (the drum lessons' pages are about one drum),
 * and TWO OVERHEADS (the snare-distance aid and the stereo pairs). The rest
 * of the journey uses the shared pages.
 */
import { useCallback, useMemo, type ReactElement } from 'react';
import type { ViewId } from '../../engine/model/types.ts';
import { PageSteps, type MikingStep } from '../../engine/steps';
import { Card, Note, Point, ScenarioList } from '../../engine/kit';
import type { PageProps } from '../../pages/pageTypes';
import { PKitOrient } from '../shared/kitPages/PKitOrient';
import { useArrivalsStep, useCymbalShapesStep, useCymbalStrikeStep } from '../shared/kitPages/kitSoundSteps';
import type { ArrivalPoint, ArrivalSource } from '../shared/kitPages/ArrivalsScene';
import { KitSide, KitTop } from '../shared/kitScene/KitSceneArt';
import { KIT_CENTRE, S0, O } from '../shared/kitScene/kitSceneModel.ts';
import { KIT_PLACED_CYMBALS } from '../shared/cymbals/cymbalSpec.ts';
import { M09_ARRIVALS, M09_ORIENT, M09_SHAPES, M09_STRIKE } from './copy.ts';
import { GJ_MAIN, GJ_SIDE, MONO } from './model.ts';
import { M09_VIEWS } from './geometry.ts';
import { PTwoOverheads } from './PTwoOverheads';

export function M09Orient(p: PageProps) {
  return <PKitOrient {...p} words={M09_ORIENT} />;
}

const SOURCES: ArrivalSource[] = [
  { id: 'snare', label: 'snare', p: S0, color: '#6fa8ff' },
  { id: 'kick', label: 'kick', p: O, color: '#ff8c3c' },
  { id: 'hihat', label: 'hi-hats', p: KIT_PLACED_CYMBALS.hihat.c, color: '#5bff85' },
  { id: 'crash2', label: '18 in crash', p: KIT_PLACED_CYMBALS.crash2.c, color: '#e7a6ff' },
];
const POINTS: ArrivalPoint[] = [
  { id: 'over', label: 'OVER THE SNARE · 1 m', short: 'OVER SNARE', p: GJ_MAIN },
  { id: 'side', label: 'BESIDE THE FLOOR TOM', short: 'FLOOR TOM', p: GJ_SIDE },
  { id: 'centre', label: 'OVER THE KIT’S CENTRE', short: 'CENTRE', p: { x: KIT_CENTRE.x, y: MONO.y, z: KIT_CENTRE.z } },
];

function KitBackground({ view }: { view: ViewId }): ReactElement {
  return view === 'side' ? <KitSide reach={false} /> : <KitTop reach={false} />;
}

export function M09Sound({ lesson, answers, onAnswered, onInteractive, interactiveDone, hidden }: PageProps) {
  const reached = useCallback(() => {
    if (!interactiveDone.has('soundPath')) onInteractive('soundPath');
  }, [interactiveDone, onInteractive]);
  const strike = useCymbalStrikeStep({ words: M09_STRIKE, hidden, prediction: lesson.predictions.sound, onReached: reached });
  const shapes = useCymbalShapesStep({ words: M09_SHAPES });
  const box = useMemo(() => ({ side: M09_VIEWS.side, top: M09_VIEWS.top }), []);
  const arrivals = useArrivalsStep({ words: M09_ARRIVALS, box, Background: KitBackground, sources: SOURCES, points: POINTS, maxMs: 6 });
  const steps: MikingStep[] = [
    strike.step,
    shapes,
    arrivals,
    {
      key: 'body',
      title: 'Drums and cymbals',
      kind: 'CHECK',
      layout: 'read',
      body: (
        <>
          <Card>
            <Point title="ATTACK">{lesson.sound.attack}</Point>
            <Point title="BODY">{lesson.sound.body}</Point>
            <Point title="WHAT AN OVERHEAD HEARS">The cymbals hang closest, so they arrive first and loudest; the snare a little later; the kick last and weakest. Each source keeps its own distance — and its own arrival time — at every mic.</Point>
          </Card>
          <Note>This lab never plays a sound and draws no frequency curve for the kit: how a real kit sounds depends on the drums, the cymbals, the tuning, the room and the player. The pictures show where the sound comes from and when it arrives.</Note>
          {!strike.reached ? <Note tone="warn">The cymbal’s stroke on step 1 has not reached its end yet — step it through to earn this page’s credit.</Note> : null}
          <ScenarioList items={lesson.scenarios.filter((s) => s.page === 'sound')} answers={answers} onAnswered={onAnswered} />
        </>
      ),
    },
  ];
  return <PageSteps steps={steps} />;
}

export const M09_PAGES = { instrument: M09Orient, sound: M09Sound, twoMic: PTwoOverheads };
