/**
 * F12 SOUND LEVEL AND ENVIRONMENTAL NOISE — the lesson's own pages:
 *
 *   sound       HOW SOUND REACHES THE METER (MEET IT's second half): the car
 *               and the air unit, their straight paths and their reflections
 *               off the ground and the facade (the image-source picture, as
 *               the kit lessons use), for receiver A, receiver B and the
 *               wall position — then checks
 *   setting     BEFORE ANY METER: the question, the descriptor, safety on
 *               site (roads, water, power lines 3 m, lightning 30 minutes)
 *   microphone  THE METER'S SETTINGS (the chain rack): instrument, weighting,
 *               time weighting, what is written down — then checks
 *   context     BACKGROUND AND WEATHER: energy subtraction with the method's
 *               limit; wind and weather in words — then checks
 *   twoMic      TWO RECEIVERS, ONE CLOCK: a made-up level history at A and B
 *               and its descriptors — then checks
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
import { useBackgroundStep, useDescriptorsStep } from '../shared/measure/SurveyTools';
import { drawMeasurePart } from '../shared/measure/partArt';
import { METER_CHAIN } from '../shared/measure/chains.ts';
import { HOUSE, HVAC, ROAD } from './geometry.ts';
import { F12_START } from './model.ts';
import { SiteArt } from './SiteArt';

const CAR: Vec3 = { x: (ROAD.x0 + ROAD.x1) / 2, y: -500, z: 0 };
const UNIT: Vec3 = { x: (HVAC.x0 + HVAC.x1) / 2, y: -HVAC.h, z: (HVAC.z0 + HVAC.z1) / 2 };
const SOURCES: ArrivalSource[] = [
  // The names clear of their markers (clash sweep 2026-10-10: they sat on
  // the air unit's body and on the car's ground-reflection marker). The
  // car's goes under that marker: above it, RECEIVER A's words took the place.
  { id: 'car', label: 'a car', p: CAR, color: '#6fa8ff', labelDv: 34 },
  { id: 'unit', label: 'the air unit', p: UNIT, color: '#7fe0c0', labelDv: -22 },
];
const POINTS: ArrivalPoint[] = [
  { id: 'A', label: 'RECEIVER A · IN THE OPEN', short: 'A · OPEN', p: F12_START.A },
  { id: 'B', label: 'RECEIVER B · 2 M FROM THE FACADE', short: 'B · FACADE', p: F12_START.B },
  { id: 'wall', label: 'AT THE FACADE', short: 'AT WALL', p: F12_START.wall },
];

/** Does the reflection off the facade (the plane x = 0) from `img` to `p` land on the wall? */
function onFacade(img: Vec3, p: Vec3): boolean {
  const t = (0 - img.x) / (p.x - img.x);
  if (!(t > 0 && t < 1)) return false;
  const z = img.z + t * (p.z - img.z);
  const y = img.y + t * (p.y - img.y);
  return z >= HOUSE.z0 && z <= HOUSE.z1 && -y <= HOUSE.eaves && -y >= 0;
}

/** The reflections a point receives: the car off the ground always; the car
 *  and the air unit off the facade only where the mirror path lands on it. */
function imagesFor(pid: string): ArrivalImage[] {
  const p = POINTS.find((q) => q.id === pid)!.p;
  const out: ArrivalImage[] = [{ id: 'carGround', label: 'the car, off the ground', p: { ...CAR, y: -CAR.y }, of: 'car', color: '#9cc4ff' }];
  const carFacade = { ...CAR, x: -CAR.x };
  if (onFacade(carFacade, p)) out.push({ id: 'carFacade', label: 'the car, off the facade', p: carFacade, of: 'car', color: '#c7a6ff' });
  const unitFacade = { ...UNIT, x: -UNIT.x };
  if (onFacade(unitFacade, p)) out.push({ id: 'unitFacade', label: 'the air unit, off the facade', p: unitFacade, of: 'unit', color: '#b9f5df' });
  return out;
}

function Background({ view }: { view: ViewId }): ReactElement {
  return <SiteArt view={view} />;
}
const BOX = { side: { u0: -9600, u1: 11000, v0: -3400, v1: 1200 }, top: { u0: -9600, u1: 11000, v0: -7000, v1: 5000 } };

function F12Sound({ lesson, answers, onAnswered }: PageProps) {
  const arrivals = useArrivalsStep({
    words: {
      title: 'How sound reaches the meter',
      badge: 'Straight paths at 20 °C · dashed rings = reflections (the mirror-image picture) · a simplified picture',
      prompt: 'Drag TIME and watch each sound arrive; change POINT between receiver A, receiver B and the wall.',
      looking: 'The site',
      note: 'As if the car and the air unit each made one click at the same instant. Receiver B and the wall position also hear the facade’s reflection; receiver A, out in the open, does not. A real road is a line of moving sources, and the ground’s reflection depends on what it is made of — the picture shows the paths, not the levels.',
      arrived: 'arrived after',
      pending: 'arrives after',
      subject: 'the site',
      event: 'the sound left each source',
    },
    box: BOX,
    Background,
    sources: SOURCES,
    points: POINTS,
    imagesFor,
    maxMs: 40,
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
          <Point title="WHAT A METER RECEIVES">Everything that arrives at its position, from every source, direct and reflected: the traffic, the facade’s reflection, the air unit, the wind at the windscreen. A small shift toward the road, toward a wall or into a loudspeaker’s axis can change the reading a lot.</Point>
          <Point title="A POSITION STANDS FOR ITSELF">An area reading represents its spot and its time — not every listener nearby, and not a worker’s daily exposure, which is measured on the person.</Point>
        </Card>
        <Note>This lab never plays a sound and draws no measured curve: the pictures show where the sound goes and when it arrives.</Note>
      </>,
    ),
  ];
  return <PageSteps steps={steps} />;
}

const F12Before = makeBeforePage({
  points: [
    { title: 'THE QUESTION, THE RECEIVER, THE TIME', text: 'Name the source, the receiver or area, the operating condition and the decision the result must support. A neighbourhood baseline, a traffic study, a venue’s boundary and a worker’s exposure are four different questions. Get the method — the local permit, the project’s specification — before a formal claim.' },
    { title: 'THE DESCRIPTOR FIRST', text: 'Write the descriptor and the window before measuring: an average over the window (LAeq), the loudest fast level (LAFmax), the levels exceeded part of the time (L10, L50, L90), or a peak. Each answers a different question.' },
    { title: 'SAFE, AUTHORIZED POSITIONS', text: 'Choose positions you are allowed to use and can reach safely, away from roads, tracks, water edges, moving equipment and electrical hazards. If a receiver is unsafe to reach, use remote placement or qualified site coordination. Keep the tripod and cable from becoming a hazard to the public.' },
    { title: 'ORDINARY OPERATION', text: 'Measure the source as it normally runs. Never raise a level to make a meter respond, and use hearing protection where the staff need it.' },
  ],
  safety: [
    'Overhead power lines: keep any pole, mast or stand at least 3 m (10 ft) away from them — farther if you are unsure, and if you cannot be sure, do not raise it.',
    'Lightning: when thunder is heard or the sky looks threatening, get inside a safe place immediately, and wait 30 minutes after the last lightning or thunder before going back out.',
  ],
});

function F12Microphone({ lesson, answers, onAnswered, onInteractive, interactiveDone }: PageProps) {
  const pass = useCallback(() => {
    if (!interactiveDone.has('chainBuilt')) onInteractive('chainBuilt');
  }, [interactiveDone, onInteractive]);
  const chain = useChainStep({
    spec: METER_CHAIN,
    drawPart: drawMeasurePart,
    prediction: lesson.predictions.microphone,
    onPass: pass,
    words: {
      title: 'The meter’s settings',
      badge: 'The meter, top to bottom · weighting curves from their formulas · a red dashed cable = refused',
      looking: 'Instrument and settings',
      prompt: 'Pick a QUESTION, then the instrument, its weighting, its time weighting and what you write down.',
      done: 'These settings answer the question.',
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
        <Point title="WRITE THE METER’S OWN LABEL">dBA, dBC, LAeq over the window, LAFmax, the peak — never a bare “dB”. A recorder’s dBFS is not a sound pressure level. Fit the windscreen, and check the meter’s field response and its outdoor correction as the measurement-mic lesson taught.</Point>
      </Card>,
    ),
  ];
  return <PageSteps steps={steps} />;
}

function F12Context({ lesson, answers, onAnswered, onInteractive, interactiveDone }: PageProps) {
  const done = useCallback(() => {
    if (!interactiveDone.has('bgSubtract')) onInteractive('bgSubtract');
  }, [interactiveDone, onInteractive]);
  const bg = useBackgroundStep({
    words: {
      title: 'Background',
      badge: 'Three meters on one absolute scale · the subtraction is in energy · your method sets the limit',
      looking: 'The source, the background, the total',
      prompt: 'Move BACKGROUND toward TOTAL and watch the source alone — then past the limit, where it is refused.',
    },
    onDone: done,
  });
  const steps: MikingStep[] = [
    bg,
    {
      key: 'weather',
      title: 'Wind and weather',
      kind: 'LEARN',
      layout: 'read',
      body: (
        <Card>
          <Point title="THE WINDSCREEN">Fit it, and watch for gusts buffeting the capsule in the lows. A windscreen reduces buffeting — it does not make a high-wind interval valid, and it does not waterproof the mic.</Point>
          <Point title="ONE PROTOCOL’S WIND LIMIT">One park-monitoring protocol leaves out intervals with wind over 5 m/s (11 mph) because of false readings. That limit belongs to that protocol; your method names its own.</Point>
          <Point title="LOG IT, DO NOT FIX IT">Note wind, rain, temperature and humidity as the method asks, and the aircraft, speech, construction or rain that change what a level means. No arbitrary filter, noise reduction or “wind correction” to get a cleaner number; keep the raw records and a written reason for every interval you leave out.</Point>
        </Card>
      ),
    },
    checkStep(lesson, 'context', answers, onAnswered),
  ];
  return <PageSteps steps={steps} />;
}

function F12TwoMic({ lesson, answers, onAnswered, onInteractive, interactiveDone }: PageProps) {
  const done = useCallback(() => {
    if (!interactiveDone.has('descriptors')) onInteractive('descriptors');
  }, [interactiveDone, onInteractive]);
  const hist = useDescriptorsStep({
    words: {
      title: 'Two receivers, one clock',
      badge: 'A made-up 10-minute run · 8 fast readings a second · amber LAeq, blue L10 / L50 / L90, red the loudest',
      looking: 'The level history',
      prompt: 'Compare RECEIVER A and B, then shorten the WINDOW and watch which descriptors move.',
      receivers: {
        A: 'In the open, at the method’s height.',
        B: 'Two metres from the facade: the same traffic plus its reflection — a little higher in this example; how much depends on the site.',
      },
    },
    onDone: done,
  });
  const steps: MikingStep[] = [
    hist,
    {
      key: 'two',
      title: 'Two meters',
      kind: 'LEARN',
      layout: 'read',
      body: (
        <Card>
          <Point title="ONE CLOCK, TWO RECORDS">Synchronize the two meters’ clocks, and keep each one’s calibration, position, height and orientation on the sheet.</Point>
          <Point title="LONG ENOUGH">A few minutes can scout a site; they cannot stand for an hour, a day or a season. Choose a window that holds the variation the question is about — traffic cycles, a production shift, a quiet night.</Point>
          <Point title="KEEP WHAT HAPPENED">Decide which events are part of the question before collecting. Keep the original histories and a written reason for any excluded interval — never delete an inconvenient loud event after seeing the result.</Point>
        </Card>
      ),
    },
    checkStep(lesson, 'twoMic', answers, onAnswered),
  ];
  return <PageSteps steps={steps} />;
}

export const F12_PAGES = { sound: F12Sound, setting: F12Before, microphone: F12Microphone, context: F12Context, twoMic: F12TwoMic };
export const F12_STEP_COUNTS = { sound: 2, setting: 1, microphone: 2, context: 3, twoMic: 3 };
