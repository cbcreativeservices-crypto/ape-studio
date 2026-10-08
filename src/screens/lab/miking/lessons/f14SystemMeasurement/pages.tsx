/**
 * F14 LOUDSPEAKER AND SOUND SYSTEM MEASUREMENT — the lesson's own pages:
 *
 *   sound       WHAT A SEAT HEARS (MEET IT's second half): the left main, the
 *               front fill and the sub reaching three seats, with the floor's
 *               and the rear wall's bounce (the mirror-image picture), then
 *               checks
 *   setting     BEFORE ANY TRACE (STARTING SETUPS' last step): the question,
 *               the route, the level, safety — and checks
 *   microphone  THE CHAIN (the chain rack: tap, mic, route, capture), THE TAP
 *               AND THE DELAY (systems.ts), then checks
 *   context     THE WINDOW: direct sound or the room — 1 ÷ T — then checks
 *   twoMic      THE OVERLAP SEAT: the main and the fill, aligned at one seat
 *               and off at the next — then checks
 *
 * FULLY SILENT; nothing moves by itself.
 */
import { useCallback, type ReactElement } from 'react';
import type { ViewId } from '../../engine/model/types.ts';
import { PageSteps, type MikingStep } from '../../engine/steps';
import { Card, Note, Point } from '../../engine/kit';
import { useChainStep } from '../../engine/chain/ChainRack';
import type { PageProps } from '../../pages/pageTypes';
import { useArrivalsStep } from '../shared/kitPages/kitSoundSteps';
import type { ArrivalImage, ArrivalPoint, ArrivalSource } from '../shared/kitPages/ArrivalsScene';
import { checkStep, makeBeforePage } from '../shared/measure/measurePages';
import { useOverlapStep, useTimingStep, useWindowStep } from '../shared/measure/SystemTools';
import { drawSystemPart } from '../shared/measure/partArtSystems';
import { SYSTEM_CHAIN } from '../shared/measure/chainsSystems.ts';
import { VenueArt } from '../shared/measure/VenueArt';
import { FILL, MAIN_L, SUB, VENUE } from '../shared/measure/venue.ts';
import { F14_START } from './model.ts';

const V = VENUE;
const SOURCES: ArrivalSource[] = [
  { id: 'main', label: 'the left main', p: MAIN_L, color: '#ffc64d' },
  { id: 'fill', label: 'the front fill', p: FILL, color: '#6fa8ff' },
  { id: 'sub', label: 'the subwoofer', p: SUB, color: '#c7a6ff' },
];
const POINTS: ArrivalPoint[] = [
  { id: 'front', label: 'A FRONT SEAT', short: 'FRONT', p: F14_START.overlap },
  { id: 'mid', label: 'A MID SEAT', short: 'MID', p: F14_START.mid },
  { id: 'rear', label: 'A REAR SEAT', short: 'REAR', p: F14_START.rear },
];
/** The left main's mirror image behind the floor and behind the rear wall: one bounce each. */
const IMAGES: ArrivalImage[] = [
  { id: 'floor', label: 'the main, off the floor', p: { x: MAIN_L.x, y: -MAIN_L.y, z: MAIN_L.z }, of: 'main', color: '#9cc4ff' },
  { id: 'rearWall', label: 'the main, off the rear wall', p: { x: 2 * V.room.rear - MAIN_L.x, y: MAIN_L.y, z: MAIN_L.z }, of: 'main', color: '#7fe0c0' },
];
const BOX: Record<ViewId, { u0: number; u1: number; v0: number; v1: number }> = {
  side: { u0: V.room.back - 200, u1: 2 * V.room.rear + 400, v0: -3600, v1: 2900 },
  top: { u0: V.room.back - 200, u1: 2 * V.room.rear + 400, v0: -V.room.half - 250, v1: V.room.half + 250 },
};

function Background({ view }: { view: ViewId }): ReactElement {
  return <VenueArt view={view} />;
}

function F14Sound({ lesson, answers, onAnswered }: PageProps) {
  const arrivals = useArrivalsStep({
    words: {
      title: 'What a seat hears',
      badge: 'Straight paths at 20 °C · dashed rings = one bounce of the main off the floor and the rear wall · simplified',
      prompt: 'Drag TIME and watch the main, the fill and the sub arrive, then the bounces; change POINT between three seats.',
      looking: 'The venue',
      note: 'As if every loudspeaker made one click at the same instant. The nearest source arrives first; the floor’s bounce close behind it; the rear wall’s much later at the front. The picture shows the paths and the times, not the levels — the main plays louder than the fill, and the sub only the lows.',
      arrived: 'arrived after',
      pending: 'arrives after',
      subject: 'the venue',
      event: 'the click',
    },
    box: BOX,
    Background,
    sources: SOURCES,
    points: POINTS,
    images: IMAGES,
    maxMs: 80,
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
          <Point title="PRESSURE AT ONE POINT">A mic measures the pressure where its capsule is. A loudspeaker’s response depends on the angle, the distance, the boundaries and the drive; an installed system adds its processing, its other sources and the room.</Point>
          <Point title="ONE TRACE, ONE PLACE">One trace in a room cannot give a loudspeaker’s free-field specification, or show that the coverage is even. Name the test before you set the stand.</Point>
          <Point title="STAGE AND STUDIO">In a venue: each subsystem alone across its seats, then the overlaps. In a studio: each monitor alone at the listening position, then the places a head moves to.</Point>
        </Card>
        <Note>This lab never plays a sound: the pictures show where the sound goes and when it arrives; any trace it draws is a simplified example, never a measurement.</Note>
      </>,
    ),
  ];
  return <PageSteps steps={steps} />;
}

/** The exact safety lines (F14 L26, L47). */
const NEVER_PA = 'The measurement mic goes to the analyzer only — it must never return to the live PA.';
const LEVELS = 'Test at an agreed, safe level: studio monitors can reach hazardous levels in a small room too. Raising the playback is not the cure for a poor trace — stop if the measurement cannot be done safely.';

const F14Before = makeBeforePage({
  points: [
    { title: 'THE QUESTION FIRST', text: 'One loudspeaker’s direct radiation, its coverage, a subwoofer and main overlap, or the audience’s actual experience? Write it down before setting a stand: each asks for different positions.' },
    { title: 'THE CHAIN', text: 'A measurement mic with its calibration file or a verified response, aimed as the file says. Log the mic and interface, the gains, the sample rate, the source input and the processing state. A relative trace is not an absolute level.' },
    { title: 'THE ROUTE', text: 'Label the reference tap, the mic’s channel and the active sources. Confirm the channels, the polarity, the phantom power, the input level and the headroom before any test signal.' },
    { title: 'IN A VENUE', text: 'Coordinate muting with the system operator, keep the route to the amplifiers unambiguous, and prevent unexpected playback. Stands out of access routes, cables secured, loudspeakers on rated supports. Do not move flown or energized equipment for a practice run.' },
  ],
  safety: [NEVER_PA, LEVELS],
});

function F14Microphone({ lesson, answers, onAnswered, onInteractive, interactiveDone }: PageProps) {
  const pass = useCallback(() => {
    if (!interactiveDone.has('chainBuilt')) onInteractive('chainBuilt');
  }, [interactiveDone, onInteractive]);
  const timed = useCallback(() => {
    if (!interactiveDone.has('delaySet')) onInteractive('delaySet');
  }, [interactiveDone, onInteractive]);
  const chain = useChainStep({
    spec: SYSTEM_CHAIN,
    drawPart: drawSystemPart,
    prediction: lesson.predictions.microphone,
    onPass: pass,
    words: {
      title: 'The chain',
      badge: 'Reference, mic, route, capture · a red dashed cable = refused · the label names what was measured',
      looking: 'A dual-channel test',
      prompt: 'Pick a QUESTION — the whole path, or what the processor works with — then each link in the dock.',
      done: 'This chain answers the question:',
    },
  });
  const timing = useTimingStep({
    words: {
      title: 'The tap and the delay',
      badge: 'Arrivals at a front-row seat on a real time base · the heights are a made-up example · amber line = your delay',
      looking: 'The arrivals',
      prompt: 'With the fill ALONE, set the DELAY on its first arrival. Then leave the left main ON and press FINDER: is it right?',
    },
    onDone: timed,
  });
  const steps: MikingStep[] = [
    chain,
    timing,
    checkStep(
      lesson,
      'microphone',
      answers,
      onAnswered,
      <Card>
        <Point title="QUALITY, NOT JUST A CURVE">Look at the magnitude and the phase with the coherence or another quality indicator. Poor coherence can come from a timing mismatch, noise, reflections or a changing system — it is not one diagnosis, and turning the playback up is not the default cure.</Point>
      </Card>,
    ),
  ];
  return <PageSteps steps={steps} />;
}

function F14Context({ lesson, answers, onAnswered, onInteractive, interactiveDone }: PageProps) {
  const done = useCallback(() => {
    if (!interactiveDone.has('window')) onInteractive('window');
  }, [interactiveDone, onInteractive]);
  const win = useWindowStep({
    words: {
      title: 'The window',
      badge: 'The bench, the mic 2 m out on the axis · blue = inside the window · arrivals from the room’s mirror images',
      looking: 'Direct sound or the room',
      prompt: 'Drag WINDOW: shut out the floor’s bounce, then open it until every reflection is in — and read what it resolves.',
    },
    onDone: done,
  });
  const steps: MikingStep[] = [
    win,
    checkStep(
      lesson,
      'context',
      answers,
      onAnswered,
      <Card>
        <Point title="CLOSE TO ONE DRIVER">A near-field mic at a cone or a port hears that radiator far above the room — but it changes the geometry and misses the other outputs. Joining near and far traces needs level, phase, area and boundary corrections under a defined method; two plots spliced together are not a calibrated result.</Point>
        <Point title="ON A GROUND PLANE">Mic and source on a large reflecting surface remove a separate floor bounce: a deliberate measurement condition, not a way to make walls and weather disappear. A mic on a stage floor under a flown system is an installed-system boundary point.</Point>
        <Point title="IN A SMALL ROOM">The lows and the early floor, desk or wall reflections often dominate. Do not equalize a narrow cancellation as if it were the loudspeaker’s fault: compare positions and find the cause first.</Point>
      </Card>,
    ),
  ];
  return <PageSteps steps={steps} />;
}

function F14TwoMic({ lesson, answers, onAnswered, onInteractive, interactiveDone }: PageProps) {
  const done = useCallback(() => {
    if (!interactiveDone.has('overlap')) onInteractive('overlap');
  }, [interactiveDone, onInteractive]);
  const overlap = useOverlapStep({
    words: {
      title: 'The overlap seat',
      badge: 'The front of the venue from above · below, the ideal sum of the two arrivals (equal levels, free field) · simplified',
      looking: 'The main and the fill',
      prompt: 'Play each ALONE, then BOTH. ALIGN HERE at one seat — then change SEAT and read the gap again.',
    },
    prediction: lesson.predictions.twoMic,
    onDone: done,
  });
  const steps: MikingStep[] = [
    overlap,
    checkStep(
      lesson,
      'twoMic',
      answers,
      onAnswered,
      <Card>
        <Point title="SUBS AND MAINS">Measure the mains and the subs separately round the crossover at defined positions, then together, tracking the actual reference delay and processing state. Summation at the chosen seat does not promise summation everywhere.</Point>
      </Card>,
    ),
  ];
  return <PageSteps steps={steps} />;
}

export const F14_PAGES = { sound: F14Sound, setting: F14Before, microphone: F14Microphone, context: F14Context, twoMic: F14TwoMic };
export const F14_STEP_COUNTS = { sound: 2, setting: 1, microphone: 3, context: 2, twoMic: 2 };

/** For the tests: the arrivals step's seats and sources. */
export const F14_ARRIVALS = { sources: SOURCES, points: POINTS, images: IMAGES } as { sources: ArrivalSource[]; points: ArrivalPoint[]; images: ArrivalImage[] };
