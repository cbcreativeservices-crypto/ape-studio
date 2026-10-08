/**
 * F15 MACHINERY AND PRODUCT SOUND — the lesson's own pages:
 *
 *   sound       HOW THE FAN REACHES A, B AND C (MEET IT's second half): the
 *               fan's sound reaching three positions at the same radius —
 *               the same direct path, different bounces off the table, the
 *               floor and the wall behind (the mirror-image picture) — then
 *               checks: pressure, vibration and sound power kept apart
 *   setting     BEFORE THE FAN RUNS (STARTING SETUPS' last step): permission,
 *               guards, the zone, hearing — and checks
 *   microphone  TWO CHANNELS (the chain rack: air, vibration, gain, claim),
 *               then checks
 *   context     KEEP OUT: the zone, the airflow, and the no-go machine —
 *               then checks
 *   twoMic      THE CYCLE LOG and THE CLAIM LADDER — then checks
 *
 * FULLY SILENT; nothing moves by itself.
 */
import { useCallback, useEffect, useState, type ReactElement } from 'react';
import type { ViewId } from '../../engine/model/types.ts';
import { PageSteps, type MikingStep } from '../../engine/steps';
import { Card, Note, Point } from '../../engine/kit';
import { useChainStep } from '../../engine/chain/ChainRack';
import type { PageProps } from '../../pages/pageTypes';
import { useArrivalsStep } from '../shared/kitPages/kitSoundSteps';
import type { ArrivalImage, ArrivalPoint, ArrivalSource } from '../shared/kitPages/ArrivalsScene';
import { checkStep, makeBeforePage } from '../shared/measure/measurePages';
import { drawSystemPart } from '../shared/measure/partArtSystems';
import { PRODUCT_CHAIN } from '../shared/measure/chainsSystems.ts';
import { useCycleStep } from '../shared/measure/ProductTools';
import { useClaimLadderStep } from '../shared/measure/ClaimLadderStep';
import { FanScene } from './FanArt';
import { useKeepOutStep } from './KeepOutStep';
import { F15_LADDER } from './ladder.ts';
import { HUB, TABLE, WALL_X } from './geometry.ts';
import { F15_POINTS } from './model.ts';

const SOURCES: ArrivalSource[] = [{ id: 'fan', label: 'the fan', p: HUB, color: '#ffc64d' }];
const POINTS: ArrivalPoint[] = [
  { id: 'A', label: 'A · THE USER’S POSITION', short: 'A', p: F15_POINTS.A },
  { id: 'B', label: 'B · THE OTHER SIDE', short: 'B', p: F15_POINTS.B },
  { id: 'C', label: 'C · BEHIND THE FAN', short: 'C', p: F15_POINTS.C },
];
/** The fan's mirror image under the table top, under the floor, and behind the wall: one bounce each. */
const IMAGES: ArrivalImage[] = [
  { id: 'table', label: 'off the table top', p: { x: HUB.x, y: 2 * TABLE.top - HUB.y, z: HUB.z }, of: 'fan', color: '#9cc4ff' },
  { id: 'floor', label: 'off the floor', p: { x: HUB.x, y: 2 * TABLE.floor - HUB.y, z: HUB.z }, of: 'fan', color: '#7fe0c0' },
  { id: 'wall', label: 'off the wall behind', p: { x: 2 * WALL_X - HUB.x, y: HUB.y, z: HUB.z }, of: 'fan', color: '#c7a6ff' },
];
const BOX: Record<ViewId, { u0: number; u1: number; v0: number; v1: number }> = {
  side: { u0: 2 * WALL_X - 300, u1: 1400, v0: -1000, v1: 2 * TABLE.floor - HUB.y + 200 },
  top: { u0: 2 * WALL_X - 300, u1: 1400, v0: -1300, v1: 1300 },
};

function Background({ view }: { view: ViewId }): ReactElement {
  return <FanScene view={view} />;
}

function F15Sound({ lesson, answers, onAnswered }: PageProps) {
  const arrivals = useArrivalsStep({
    words: {
      title: 'How the fan reaches A, B and C',
      badge: 'Straight paths at 20 °C · dashed rings = one bounce off the table, the floor and the wall behind · simplified',
      prompt: 'Drag TIME and watch the direct sound reach the point, then each bounce; change POINT between A, B and C.',
      looking: 'The fan in its room',
      note: 'As if the fan made one click. A, B and C sit at the same radius, so the direct sound reaches each at the same moment — but the bounces do not: the wall behind is close to C and far from A. The picture shows the paths and the times, not the levels or the direction the fan favours.',
      arrived: 'arrived after',
      pending: 'arrives after',
      subject: 'the fan and its room',
      event: 'the click',
    },
    box: BOX,
    Background,
    sources: SOURCES,
    points: POINTS,
    images: IMAGES,
    maxMs: 25,
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
          <Point title="PRESSURE AT ONE POINT">A mic measures the airborne pressure where its capsule sits: what a user hears at that point, at that load. It cannot alone give the fan’s sound power, the source of a rattle, or a worker’s daily dose.</Point>
          <Point title="AIR AND STRUCTURE">The housing also vibrates. A contact sensor reads that vibration, in its own units, on its own channel — never an airborne level. Vibration can radiate from a panel; sound in the air can shake a panel too.</Point>
          <Point title="THE QUESTION FIRST">A creative product sound, a repeatable comparison, a fault hunt, a work-position level or a formal sound-power figure: each asks for different positions and controls.</Point>
        </Card>
        <Note>This lab never plays a sound: the pictures show where the sound goes and when it arrives; any level strip is a made-up example, never a measurement.</Note>
      </>,
    ),
  ];
  return <PageSteps steps={steps} />;
}

/** The exact safety lines (F15 L24, L47–L48). */
const GUARDS = 'Guards and interlocks stay in place. Never reach through a guard, and never place a sensor on, open, service or modify an operating machine.';
const LOCKOUT = 'Access that counts as servicing falls under the employer’s hazardous-energy procedure: lockout is for authorized people — never improvised. If the noise is high, follow the site’s hearing procedure and wear the right protection.';

const F15Before = makeBeforePage({
  points: [
    { title: 'THE DEVICE', text: 'A low-risk, intact, guarded device — here a desk fan — under its own instructions, with the owner’s permission and safe access agreed. Write down the purpose and the operating state: speed, load, warm-up, mounting.' },
    { title: 'THE ZONE', text: 'Survey the area with the owner or operator; sketch the device, its guard and the exclusion zone. Keep hair, clothing, cables, stands and people clear of intakes, blades, pinch points, hot surfaces and traffic. A position you cannot reach from outside the zone is left out.' },
    { title: 'THE BACKGROUND', text: 'With the device off, where that is safe, record the background: other machines, air handling, the room’s surfaces. If the operating state cannot be repeated, a change in sound is not proof of an improvement.' },
    { title: 'THE CHAIN', text: 'Mark the stand’s feet or measure the coordinates; log the mic’s orientation; lock the gain and processing with headroom for the start, the stop and any impact.' },
  ],
  safety: [GUARDS, LOCKOUT],
});

function F15Microphone({ lesson, answers, onAnswered, onInteractive, interactiveDone }: PageProps) {
  const pass = useCallback(() => {
    if (!interactiveDone.has('chainBuilt')) onInteractive('chainBuilt');
  }, [interactiveDone, onInteractive]);
  const chain = useChainStep({
    spec: PRODUCT_CHAIN,
    drawPart: drawSystemPart,
    prediction: lesson.predictions.microphone,
    onPass: pass,
    words: {
      title: 'Two channels',
      badge: 'Air, vibration, gain, claim · a red dashed cable = refused · the label names what was measured',
      looking: 'The fan’s channels',
      prompt: 'Pick a QUESTION — a before-and-after, or where a rattle starts — then each link in the dock.',
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
        <Point title="CLUES, NOT A PATH">With a mic and a contact sensor side by side, compare the timing and the frequencies as clues. A peak in both is suggestive — proving where a sound travels needs more sensors and a transfer study.</Point>
        <Point title="A SENSOR’S CABLE">Secure it only after the device has been isolated and checked by someone authorized; never attach, move or retrieve a sensor by hand on a running, energized or guarded device.</Point>
      </Card>,
    ),
  ];
  return <PageSteps steps={steps} />;
}

function F15Context({ lesson, answers, onAnswered, onInteractive, interactiveDone }: PageProps) {
  const done = useCallback(() => {
    if (!interactiveDone.has('keepOut')) onInteractive('keepOut');
  }, [interactiveDone, onInteractive]);
  const keep = useKeepOutStep({
    words: {
      title: 'Keep out',
      badge: 'From above · red dashes = the exclusion zone · the pale cone = the airflow · sizes are drawings',
      looking: 'The keep-outs',
      prompt: 'Move the mic with DISTANCE and ANGLE: into the zone, into the airflow, then somewhere clear. Then look at the DEVICE that is a no-go.',
    },
    onDone: done,
  });
  const steps: MikingStep[] = [
    keep,
    checkStep(
      lesson,
      'context',
      answers,
      onAnswered,
      <Card>
        <Point title="FOLEY AND STORYTELLING">A listener-like position and safe exterior details, the load and the surface logged. A designed or layered effect is useful — just never presented as an unaltered measurement.</Point>
        <Point title="A LIVE DEMONSTRATION">Stand, cable and mic out of moving paths; a perspective that shows the product without getting close — and no feed into the local PA. A broadcast mix is for clarity, not for a noise claim.</Point>
        <Point title="A QUALITY CHECK ON A LINE">A fixed jig, a fixed mic coordinate, the product’s mode and the acceptance method; the background and the run-to-run spread tracked. A pass/fail limit is proven on good and faulty units in the real plant.</Point>
      </Card>,
    ),
  ];
  return <PageSteps steps={steps} />;
}

function F15TwoMic({ lesson, answers, onAnswered, onInteractive, interactiveDone }: PageProps) {
  const [cycled, setCycled] = useState(false);
  const [laddered, setLaddered] = useState(false);
  const onCycle = useCallback(() => setCycled(true), []);
  const onLadder = useCallback(() => setLaddered(true), []);
  useEffect(() => {
    if (cycled && laddered && !interactiveDone.has('cycleClaims')) onInteractive('cycleClaims');
  }, [cycled, laddered, interactiveDone, onInteractive]);
  const cycle = useCycleStep({
    words: {
      title: 'The cycle log',
      badge: 'One cycle of the fan, relative dB, a made-up example · amber dashes = start, steady, stop · blue = your sample',
      looking: 'The cycle',
      prompt: 'Take a short SAMPLE and slide it with START AT: what did it catch? Then take the WHOLE CYCLE.',
    },
    onDone: onCycle,
  });
  const ladder = useClaimLadderStep({
    ladder: F15_LADDER,
    words: {
      title: 'The claim ladder',
      badge: 'From the smallest claim to the largest · green = what the setup reaches · a claim off the ladder needs another method',
      looking: 'What may be claimed',
      prompt: 'Pick a SETUP, then go through each CLAIM and give your VERDICT: does this setup support it?',
    },
    onDone: onLadder,
  });
  const steps: MikingStep[] = [
    cycle,
    ladder,
    checkStep(
      lesson,
      'twoMic',
      answers,
      onAnswered,
      <Card>
        <Point title="A FORMAL SURVEY IS ANOTHER JOB">A sound-power figure needs a defined surface, the positions, a qualifying room, the operating conditions and the corrections of the current method and any product test code — and a qualified team. An informal walk round the fan is not that method; design the survey on paper and leave the test to them.</Point>
      </Card>,
    ),
  ];
  return <PageSteps steps={steps} />;
}

export const F15_PAGES = { sound: F15Sound, setting: F15Before, microphone: F15Microphone, context: F15Context, twoMic: F15TwoMic };
export const F15_STEP_COUNTS = { sound: 2, setting: 1, microphone: 2, context: 2, twoMic: 3 };
