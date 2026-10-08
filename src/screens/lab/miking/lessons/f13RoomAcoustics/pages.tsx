/**
 * F13 ROOM ACOUSTICS AND REVERBERATION — the lesson's own pages:
 *
 *   sound       HOW A ROOM ANSWERS (MEET IT's second half): the direct sound
 *               and the first reflections off the floor, the ceiling and each
 *               wall reaching three seats (the mirror-image picture, as the
 *               drum-room lesson uses), then direct, early, late — and checks
 *   setting     BEFORE ANY TEST: the question and the room's state; no
 *               explosive or firearm-like sources; hearing; the PA path
 *   microphone  THE TEST CHAIN (the chain rack): signal, source, receiver,
 *               processing — room only, or system + room — then checks
 *   context     WHERE THE RECEIVERS GO: choose a set of positions on the plan
 *               and read what it can stand for — then checks
 *   twoMic      THE DECAY READER: EDT, T20, T30 per band, refused where the
 *               range is short — then checks
 *
 * FULLY SILENT; nothing moves by itself.
 */
import { useCallback, type ReactElement } from 'react';
import type { Vec3, ViewId } from '../../engine/model/types.ts';
import { PageSteps, type MikingStep } from '../../engine/steps';
import { Card, Note, Point } from '../../engine/kit';
import { useChainStep } from '../../engine/chain/ChainRack';
import type { PageProps } from '../../pages/pageTypes';
import { useArrivalsStep } from '../shared/kitPages/kitSoundSteps';
import type { ArrivalImage, ArrivalPoint, ArrivalSource } from '../shared/kitPages/ArrivalsScene';
import { checkStep, makeBeforePage } from '../shared/measure/measurePages';
import { useDecayStep, useSamplingStep } from '../shared/measure/RoomTools';
import { drawMeasurePart } from '../shared/measure/partArt';
import { ROOM_CHAIN } from '../shared/measure/chains.ts';
import type { SpotKind } from '../shared/measure/sampling.ts';
import { earY, F13_FLOOR, F13_VIEWS, ROOM13 } from './geometry.ts';
import { F13_START } from './model.ts';
import { RoomArt13 } from './RoomArt';

const S0: Vec3 = { x: 0, y: 0, z: 0 };
const TOP = F13_FLOOR - ROOM13.ceiling;
const SOURCES: ArrivalSource[] = [{ id: 'src', label: 'the test source', p: S0, color: '#ffc64d' }];
const POINTS: ArrivalPoint[] = [
  { id: 'A', label: 'RECEIVER A · MID-AUDIENCE', short: 'A · MID', p: F13_START.A },
  { id: 'B', label: 'RECEIVER B · NEAR THE BACK', short: 'B · BACK', p: F13_START.B },
  { id: 'side', label: 'A SIDE SEAT · 1 M FROM THE WALL', short: 'SIDE', p: F13_START.side },
];
/** The source's mirror image behind each surface: one bounce each (the image-source picture). */
const IMAGES: ArrivalImage[] = [
  { id: 'floor', label: 'off the floor', p: { x: 0, y: 2 * F13_FLOOR, z: 0 }, of: 'src', color: '#9cc4ff' },
  { id: 'ceiling', label: 'off the ceiling', p: { x: 0, y: 2 * TOP, z: 0 }, of: 'src', color: '#9cc4ff' },
  { id: 'back', label: 'off the wall behind the source', p: { x: 2 * ROOM13.back, y: 0, z: 0 }, of: 'src', color: '#7fe0c0' },
  { id: 'sideR', label: 'off the curtained side wall', p: { x: 0, y: 0, z: 2 * ROOM13.half }, of: 'src', color: '#7fe0c0' },
  { id: 'sideL', label: 'off the other side wall', p: { x: 0, y: 0, z: -2 * ROOM13.half }, of: 'src', color: '#7fe0c0' },
  { id: 'rear', label: 'off the rear wall', p: { x: 2 * ROOM13.front, y: 0, z: 0 }, of: 'src', color: '#c7a6ff' },
];
const BOX = {
  side: { u0: 2 * ROOM13.back - 500, u1: 2 * ROOM13.front + 500, v0: 2 * TOP - 500, v1: 2 * F13_FLOOR + 500 },
  top: { u0: 2 * ROOM13.back - 500, u1: 2 * ROOM13.front + 500, v0: -2 * ROOM13.half - 500, v1: 2 * ROOM13.half + 500 },
};

function Background({ view }: { view: ViewId }): ReactElement {
  return <RoomArt13 view={view} variant="room" />;
}

function F13Sound({ lesson, answers, onAnswered }: PageProps) {
  const arrivals = useArrivalsStep({
    words: {
      title: 'How a room answers',
      badge: 'Straight paths at 20 °C · dashed rings = one bounce off each surface (the mirror-image picture) · simplified',
      prompt: 'Drag TIME and watch the direct sound arrive, then each reflection; change POINT between the three seats.',
      looking: 'The room',
      note: 'As if the source made one click. Each dashed ring is the sound that bounced once off one surface, arriving as if from the source’s mirror image behind it. After these first bounces come thousands more, ever weaker: the decay. Real surfaces absorb and scatter — the picture shows the paths and the times, not the levels.',
      arrived: 'arrived after',
      pending: 'arrives after',
      subject: 'the room',
      event: 'the click',
    },
    box: BOX,
    Background,
    sources: SOURCES,
    points: POINTS,
    images: IMAGES,
    maxMs: 60,
  });
  const steps: MikingStep[] = [
    arrivals,
    checkStep(
      lesson,
      'sound',
      answers,
      onAnswered,
      <>
        <Card>
          <Point title="DIRECT">The sound straight from the source: first to arrive, and weaker the farther the seat.</Point>
          <Point title="EARLY">The first reflections, from the floor, the ceiling and the nearest walls — a few milliseconds behind, and different at every seat.</Point>
          <Point title="LATE: THE DECAY">Reflections of reflections, ever denser and weaker, until they sink under the room’s noise floor. How fast that energy falls — band by band — is what the decay figures describe.</Point>
          <Point title="ONE PAIR, ONE RESULT">An impulse response belongs to one source position and one receiver: move either and it changes. And the room’s state — doors, curtains, people, air handling — is part of it.</Point>
        </Card>
        <Note>This lab never plays a sound: the pictures show where the sound goes and when it arrives; the decay page draws a simplified example, never a measurement.</Note>
      </>,
    ),
  ];
  return <PageSteps steps={steps} />;
}

const F13Before = makeBeforePage({
  points: [
    { title: 'THE QUESTION AND THE STATE', text: 'Write down the purpose — the room’s own reverberation, the installed system at a listener seat, a treatment change, one recording position — and the room’s state: doors, curtains, movable panels, furniture, people, the air handling. Empty and occupied can differ.' },
    { title: 'THE SOURCE', text: 'For the room itself, a broadly radiating, well-known test source where the method calls for one. A sweep through the installed PA measures the system plus the room — useful, and labelled as such.' },
    { title: 'THE NOISE FIRST', text: 'Before the test, log the room’s noise, band by band, with the air handling and the people as they will be. Close an optional noise source only if the intended state allows it — or come back at a quieter time.' },
    { title: 'IN A LIVE SPACE', text: 'Coordinate the test with the operator and the venue, mute unrelated program, keep stands and cables out of public routes, and never run an unannounced sweep near performers or an audience. Loudspeakers go on rated supports; flown systems are for qualified crew.' },
  ],
  safety: [
    'No explosive or firearm-like sources in this lab — ever. Use modest test levels, protect hearing, and never drive the source louder only to force a result.',
    'The measurement mic goes to the analyzer or recorder only, never back to the PA.',
  ],
});

function F13Microphone({ lesson, answers, onAnswered, onInteractive, interactiveDone }: PageProps) {
  const pass = useCallback(() => {
    if (!interactiveDone.has('chainBuilt')) onInteractive('chainBuilt');
  }, [interactiveDone, onInteractive]);
  const chain = useChainStep({
    spec: ROOM_CHAIN,
    drawPart: drawMeasurePart,
    prediction: lesson.predictions.microphone,
    onPass: pass,
    words: {
      title: 'The test chain',
      badge: 'Signal, source, receiver, processing · a red dashed cable = refused · the label names what was measured',
      looking: 'A room test',
      prompt: 'Pick a QUESTION — the room itself, or the installed system — then each link.',
      done: 'This chain answers the question:',
    },
  });
  const steps: MikingStep[] = [
    chain,
    checkStep(
      lesson,
      'microphone',
      answers,
      onAnswered,
      <Card>
        <Point title="THE RECEIVER AND ITS CHAIN">An omni measurement mic, calibrated or verified, is the common receiver: note its model, response, check, gain and any windscreen. Turn off automatic gain, noise reduction, gating and changing dynamics; confirm the sample rate, the channel map, the polarity and the clock.</Point>
      </Card>,
    ),
  ];
  return <PageSteps steps={steps} />;
}

const SPOT_AT: Record<SpotKind, Vec3> = {
  centre: { x: (ROOM13.back + ROOM13.front) / 2, y: earY, z: 0 },
  front: { x: 2500, y: earY, z: 900 },
  mid: F13_START.A,
  rear: F13_START.B,
  side: F13_START.side,
  corner: { x: ROOM13.front - 300, y: earY, z: -ROOM13.half + 300 },
};
function PlanRoom(): ReactElement {
  return <RoomArt13 view="top" variant="room" />;
}

function F13Context({ lesson, answers, onAnswered, onInteractive, interactiveDone }: PageProps) {
  const done = useCallback(() => {
    if (!interactiveDone.has('positions')) onInteractive('positions');
  }, [interactiveDone, onInteractive]);
  const spots = useSamplingStep({
    words: {
      title: 'Where the receivers go',
      badge: 'The room from above · six positions · green = chosen',
      looking: 'Receiver positions',
      prompt: 'Add or remove POSITIONS until the set could describe the room — and read why.',
    },
    Room: PlanRoom,
    box: F13_VIEWS.top,
    spots: SPOT_AT,
    onDone: done,
  });
  const steps: MikingStep[] = [
    spots,
    checkStep(
      lesson,
      'context',
      answers,
      onAnswered,
      <Card>
        <Point title="A STUDIO OR A BOOTH">Compare representative source and mic positions; repeat after moving panels or curtains with the geometry and the state logged. A shorter decay alone does not mean better recordings — early reflections, colour and position matter too.</Point>
        <Point title="A CONCERT OR REHEARSAL SPACE">Sample the performers’ and the audience’s areas in the intended occupancy and curtain state; an empty hall’s figure may not predict a full one.</Point>
        <Point title="AN INSTALLED PA">Measure at listener seats with the actual loudspeakers, preset and a safe procedure; the result is system + room — check coverage and intelligibility separately.</Point>
      </Card>,
    ),
  ];
  return <PageSteps steps={steps} />;
}

function F13TwoMic({ lesson, answers, onAnswered, onInteractive, interactiveDone }: PageProps) {
  const done = useCallback(() => {
    if (!interactiveDone.has('decayRead')) onInteractive('decayRead');
  }, [interactiveDone, onInteractive]);
  const decay = useDecayStep({
    words: {
      title: 'The decay reader',
      badge: 'A made-up decay per band · solid = the fitted range, dashed = extended to 60 dB · grey = the noise floor',
      looking: 'The decay',
      prompt: 'Step through each BAND, then raise the NOISE as if the air handling were on — and watch which fits are refused.',
    },
    onDone: done,
  });
  const steps: MikingStep[] = [
    decay,
    {
      key: 'report',
      title: 'Report it band by band',
      kind: 'LEARN',
      layout: 'read',
      body: (
        <Card>
          <Point title="THE TAIL AND THE FLOOR">Record the full excitation and a tail long enough to reach the floor; watch the input for clipping and the output for limiting; repeat each set-up to catch a cough, a door or a failed run. A decay that merges into the floor supports no late slope.</Point>
          <Point title="BAND BY BAND">Look at the impulse response and the decay curve in bands, not one broadband figure. Report T20, T30 and EDT separately, mark the bands with too little range, and keep each position’s result visible before any average.</Point>
          <Point title="NOT ONE CLEAN SLOPE">Small rooms and spaces that are not diffuse may bend: early spikes, two slopes, low-frequency modes. Say so rather than forcing one number.</Point>
        </Card>
      ),
    },
    checkStep(lesson, 'twoMic', answers, onAnswered),
  ];
  return <PageSteps steps={steps} />;
}

export const F13_PAGES = { sound: F13Sound, setting: F13Before, microphone: F13Microphone, context: F13Context, twoMic: F13TwoMic };
export const F13_STEP_COUNTS = { sound: 2, setting: 1, microphone: 2, context: 2, twoMic: 3 };
