/**
 * F05 FOLEY PERSPECTIVE — the lesson's own two-mic page (the field family's
 * steps at Foley-stage scale, lessons/shared/field; the rest of the journey
 * is the Foley family's pages and the engine's):
 *
 *   twoMic  CLOSE + ROOM ON A MOVING ACTION: the key ring scrubbed along its
 *           marked path; the close mic and the room mic each read, and the
 *           time between them — which changes as the keys move ("any one
 *           alignment is only locally true", L31) —
 *           A PAIR ACROSS THE ACTION: X/Y, ORTF or M/S with the keys moving
 *           across them, the image and the mono sum —
 *           NEAR / FAR IS NOT LEFT / RIGHT, then the checks
 * FULLY SILENT; nothing moves by itself.
 */
import { useCallback } from 'react';
import { Group } from '@shopify/react-native-skia';
import { PageSteps, type MikingStep } from '../../engine/steps';
import { Card, Note, Point } from '../../engine/kit';
import type { PageProps } from '../../pages/pageTypes';
import { KeyRing } from '../shared/foley/props';
import { around, v3 } from '../shared/foley/frameF.ts';
import { useImageStep, usePathStep, type PathMicOption } from '../shared/field/fieldSteps';
import { fieldCheckStep } from '../shared/field/fieldPages';
import { KEYS_PATH } from './geometry.ts';
import { F05StagePlan } from './art';
import { F05_ZONES } from './model.ts';

const zone = (id: string) => F05_ZONES.find((z) => z.id === id)!;
function Stage() {
  return <F05StagePlan />;
}
/** The key ring at its point on the path, drawn 3 × life size to read on the plan. */
const Keys = (p: { x: number; z: number; heading: number }) => (
  <Group transform={[{ translateX: p.x }, { translateY: p.z }, { scale: 7 }]}>
    <KeyRing view="top" />
  </Group>
);

const PAIR_MICS: PathMicOption[] = [
  { id: 'close', label: 'The close mic', short: 'CLOSE', typeId: 'shotgunShort', pattern: 'supercardioid', pose: zone('f05.mono').start, blurb: 'About 1.4 m from the middle of the path: the detail of the keys, a little room.' },
  { id: 'room', label: 'The room mic', short: 'ROOM', typeId: 'ldcRoom', pattern: 'cardioid', pose: zone('f05.room').start, blurb: 'About 3 m out and 2 m up: the keys with the room round them.' },
];

export function F05TwoMic({ lesson, answers, onAnswered, onInteractive, interactiveDone }: PageProps) {
  const done = useCallback(() => {
    if (!interactiveDone.has('imageSwept')) onInteractive('imageSwept');
  }, [interactiveDone, onInteractive]);
  const pair = usePathStep({
    key: 'closeRoom',
    words: {
      title: 'Close + room on a moving action',
      badge: 'Straight path, free field · the time between the two mics from the drawn distances · a simplified picture',
      looking: 'The stage from above · the keys carried across the marked path',
      prompt: 'Drag SOURCE to carry the keys across. Watch Δt between the close and the room mic — then switch MIC to read each one.',
      after: 'The room mic always hears the keys later — but by an amount that changes as they move. A delay that lines the two up at one point is wrong at the next: choose the blend by listening over the whole action, in mono.',
      start: 'START',
      end: 'END',
    },
    path: KEYS_PATH,
    mics: PAIR_MICS,
    box: { x0: -1300, x1: 3500, z0: -1800, z1: 1800 },
    orient: 'actionUp',
    Background: Stage,
    Token: Keys,
    showPitch: false,
    endLabelDx: 350,
    pair: { a: 'close', b: 'room', note: 'Summed, the two comb.', key: 'Δt CLOSE–ROOM' },
    prediction: lesson.predictions.twoMic,
  });
  const image = useImageStep({
    key: 'pairImage',
    words: {
      title: 'A pair across the action',
      badge: 'Textbook patterns, free field · the image from level and time is a simplified picture',
      looking: 'A pair facing the path, about 1.5 m out',
      prompt: 'Drag SOURCE to carry the keys across with each PAIR — then choose ONE MIC and drag again.',
      after: 'A pair at one place maps the keys’ travel across the image; one mono mic keeps them in one place for the mix to move. Close + room is two distances, not left and right.',
    },
    arrays: ['xy', 'ortf', 'ms'],
    place: { c: around(v3(0, 0, 0), 1500, 0, 8), bearing: 180 },
    source: { kind: 'path', path: KEYS_PATH, label: (s) => (s < 0.4 ? 'ON THE LEFT' : s > 0.6 ? 'ON THE RIGHT' : 'IN THE MIDDLE') },
    box: { x0: -1300, x1: 2600, z0: -1700, z1: 1700 },
    orient: 'actionUp',
    Background: Stage,
    Token: Keys,
    labelDx: 380,
    mono: { label: 'One mic (mono)' },
    onTried: done,
  });
  const steps: MikingStep[] = [
    pair,
    image,
    {
      key: 'nearFar',
      title: 'Near and far is not left and right',
      kind: 'LEARN',
      layout: 'read',
      body: (
        <>
          <Card>
            <Point title="TWO DISTANCES">A close mic and a room mic are two perspectives of one action — select one, or blend them in mono. Do not hard-pan them left and right just because there are two tracks: that pulls a centred picture apart.</Point>
            <Point title="ONE PLACE, LEFT AND RIGHT">An X/Y pair at one place maps movement across its angle, without two distances. ORTF widens it with time differences; M/S sets the width later. Use them only when the action’s travel is worth recording.</Point>
            <Point title="POLARITY AND DELAY">A polarity switch flips the sign — it never makes two arrival times coincide. A fixed delay aligns one moment of a moving action, and can change its tail. Solo each mic, then the sum in mono, over the whole movement.</Point>
          </Card>
          <Note>For ORTF the 110° is the angle between the two capsules’ axes — 55° each side — with the capsules 17 cm apart. Never eyeball a wide pair and call it ORTF.</Note>
        </>
      ),
    },
    fieldCheckStep(lesson, 'twoMic', answers, onAnswered),
  ];
  return <PageSteps steps={steps} />;
}

export const F05_STEP_COUNT_TWOMIC = 4;
