/**
 * F16 SCIENTIFIC ARRAYS AND SPECIALIZED SENSORS — the lesson's own pages:
 *
 *   sound       THE BASELINE (MEET IT's second half): a click at the centre
 *               point, the side point and the side point's mirror; the
 *               arrival at each element and the difference; a third element
 *               off the line — then checks
 *   setting     BEFORE ANY ELEMENT (STARTING SETUPS' last step): the medium,
 *               the quantity, the origin and axes, one clock; safety — checks
 *   microphone  THE ARRAY CHAIN (the chain rack) and HALF A WAVELENGTH (a
 *               uniform line) — then checks
 *   context     THE INTENSITY PROBE, on paper: the outward normals, cos θ —
 *               then checks
 *   twoMic      THE SPECIALIST KIT (camera, ultrasonic, hydrophone and the
 *               units card) and THE CLAIM LADDER — then checks
 *
 * FULLY SILENT; nothing moves by itself.
 */
import { useCallback, useEffect, useState } from 'react';
import { PageSteps, type MikingStep } from '../../engine/steps';
import { Card, Note, Point } from '../../engine/kit';
import { useChainStep } from '../../engine/chain/ChainRack';
import type { PageProps } from '../../pages/pageTypes';
import { checkStep, makeBeforePage } from '../shared/measure/measurePages';
import { drawSystemPart } from '../shared/measure/partArtSystems';
import { ARRAY_CHAIN } from '../shared/measure/chainsSystems.ts';
import { useBaselineStep, useKitStep, useLineArrayStep, useProbeStep } from '../shared/measure/ArrayTools';
import { useClaimLadderStep } from '../shared/measure/ClaimLadderStep';
import { BASE, CENTRE_PT, SIDE_PT } from './geometry.ts';
import { F16_START } from './model.ts';
import { F16_LADDER } from './ladder.ts';

function F16Sound({ lesson, answers, onAnswered }: PageProps) {
  const baseline = useBaselineStep({
    words: {
      title: 'The baseline',
      badge: 'Two omni elements 50 cm apart · straight paths at 20 °C · the arrival times are exact for this drawing',
      looking: 'The click',
      prompt: 'Move the SOURCE: the centre, the side, then the side point’s mirror behind the array. Then turn on THIRD.',
    },
    baseline: BASE.b,
    centre: CENTRE_PT,
    side: SIDE_PT,
    third: F16_START.back,
  });
  const steps: MikingStep[] = [
    baseline,
    checkStep(
      lesson,
      'sound',
      answers,
      onAnswered,
      <>
        <Card>
          <Point title="KNOWN LOCATIONS">An array combines measurements from known locations: the geometry, the clock and the calibration are part of the measurement. A time difference means nothing without the positions it came from.</Point>
          <Point title="THREE KINDS OF SENSOR">An array of mics compares pressures at several points; an intensity probe estimates the energy flow along its axis; a hydrophone senses pressure under water. Each has its own geometry, calibration, band and units.</Point>
        </Card>
        <Note>This lab never plays a sound: the pictures show the paths and the arrival times; the maps and the levels it draws are simplified, never a measurement.</Note>
      </>,
    ),
  ];
  return <PageSteps steps={steps} />;
}

/** The exact safety lines (F16 L26–L27, L42). */
const PROBE = 'Never put a probe or a mic through a guard, or into moving, hot or energized machinery. Specialist equipment is for a qualified operator.';
const ULTRA = 'Never emit unverified ultrasound for a demonstration: inaudible is not harmless. Keep any playback at a modest, agreed level.';

const F16Before = makeBeforePage({
  points: [
    { title: 'THE MEDIUM AND THE QUANTITY', text: 'Name them before placing a sensor: airborne pressure at several points, the direction a sound arrives from, a map of a source region, the intensity through a surface, pressure under water, or ultrasonic events.' },
    { title: 'THE ORIGIN AND THE AXES', text: 'Mark a coordinate origin, the array’s axes, the source region and the obstacles. Write down each sensor’s identity, position, orientation, support, the environment, the sampling and the timing.' },
    { title: 'ONE CLOCK, MATCHED CHANNELS', text: 'Record every element on one synchronized clock. Check the sensitivity, the response and the matching; phase and time offsets matter even when each element looks fine alone. Keep the raw channels.' },
    { title: 'A KNOWN SOURCE FIRST', text: 'Check with a known stationary source at a modest, agreed level: the channel order, the timing and — for a map — its registration to the picture.' },
  ],
  safety: [PROBE, ULTRA],
});

function F16Microphone({ lesson, answers, onAnswered, onInteractive, interactiveDone }: PageProps) {
  const pass = useCallback(() => {
    if (!interactiveDone.has('chainBuilt')) onInteractive('chainBuilt');
  }, [interactiveDone, onInteractive]);
  const spaced = useCallback(() => {
    if (!interactiveDone.has('spacing')) onInteractive('spacing');
  }, [interactiveDone, onInteractive]);
  const chain = useChainStep({
    spec: ARRAY_CHAIN,
    drawPart: drawSystemPart,
    prediction: lesson.predictions.microphone,
    onPass: pass,
    words: {
      title: 'The array chain',
      badge: 'Elements, clock, geometry, processing · amber = does not suit this question, with why',
      looking: 'A two-element array',
      prompt: 'Pick a QUESTION — which heard it first, or which hears it louder — then each link.',
      done: 'This chain answers the question:',
    },
  });
  const line = useLineArrayStep({
    words: {
      title: 'Half a wavelength',
      badge: 'A uniform line of elements · f_max = c ÷ 2d at 20 °C · a design principle, not one spacing for every band',
      looking: 'The spacing',
      prompt: 'Pick a TOP frequency, then drag SPACING: find one that keeps clear of ambiguous lobes, and one that does not.',
    },
    onDone: spaced,
  });
  const steps: MikingStep[] = [
    chain,
    line,
    checkStep(
      lesson,
      'microphone',
      answers,
      onAnswered,
      <Card>
        <Point title="BEAMFORMING AND HOLOGRAPHY">A beamformer steers synchronized channels toward a direction, usually most useful in the highs; near-field holography scans a dense plane close to the source, for the lows and the near field. Different geometries, different bands — one does not stand in for the other.</Point>
      </Card>,
    ),
  ];
  return <PageSteps steps={steps} />;
}

function F16Context({ lesson, answers, onAnswered, onInteractive, interactiveDone }: PageProps) {
  const done = useCallback(() => {
    if (!interactiveDone.has('probe')) onInteractive('probe');
  }, [interactiveDone, onInteractive]);
  const probe = useProbeStep({
    words: {
      title: 'The intensity probe, on paper',
      badge: 'A small device and its enclosing surface, from above · a layout exercise — no probe near a running device',
      looking: 'The probe on a normal',
      prompt: 'Turn the ANGLE: along the outward normal, across it, then against it. Try each SPACER.',
    },
    onDone: done,
  });
  const steps: MikingStep[] = [
    probe,
    checkStep(
      lesson,
      'context',
      answers,
      onAnswered,
      <Card>
        <Point title="A SURVEY IS A METHOD">For a source’s sound power, a qualified operator measures the normal component over an enclosing surface — at points or by scanning — under the chosen method and its validity indicators. A quick pass over one panel is a localization aid, not a sound-power figure.</Point>
        <Point title="BACKGROUND IS NOT HARMLESS">Intensity can help in some rooms, but outside sources, changing fields, a poor phase match or the wrong band can invalidate a result.</Point>
      </Card>,
    ),
  ];
  return <PageSteps steps={steps} />;
}

function F16TwoMic({ lesson, answers, onAnswered, onInteractive, interactiveDone }: PageProps) {
  const [kitDone, setKitDone] = useState(false);
  const [ladderDone, setLadderDone] = useState(false);
  const onKit = useCallback(() => setKitDone(true), []);
  const onLadder = useCallback(() => setLadderDone(true), []);
  useEffect(() => {
    if (kitDone && ladderDone && !interactiveDone.has('kitClaims')) onInteractive('kitClaims');
  }, [kitDone, ladderDone, interactiveDone, onInteractive]);
  const kit = useKitStep({
    words: {
      title: 'The specialist kit',
      badge: 'Drawn as objects for a qualified operator · sizes are drawings · the map and the levels are simplified',
      looking: 'The kit',
      prompt: 'Look at each KIT: the camera’s map, the detector’s RATE against your TOP frequency, the hydrophone’s units.',
    },
    onDone: onKit,
  });
  const ladder = useClaimLadderStep({
    ladder: F16_LADDER,
    words: {
      title: 'The claim ladder',
      badge: 'From the smallest claim to the largest · green = what the setup reaches · a claim off the ladder needs another check',
      looking: 'What may be claimed',
      prompt: 'Pick a SETUP, then go through each CLAIM and give your VERDICT: does this setup support it?',
    },
    onDone: onLadder,
  });
  const steps: MikingStep[] = [
    kit,
    ladder,
    checkStep(
      lesson,
      'twoMic',
      answers,
      onAnswered,
      <Card>
        <Point title="BEFORE A SPECIALIST PROJECT">On paper first: the medium, the reference pressure or the band, the sensor, its calibration, the permissions, the placement record — and one claim the setup cannot support.</Point>
      </Card>,
    ),
  ];
  return <PageSteps steps={steps} />;
}

export const F16_PAGES = { sound: F16Sound, setting: F16Before, microphone: F16Microphone, context: F16Context, twoMic: F16TwoMic };
export const F16_STEP_COUNTS = { sound: 2, setting: 1, microphone: 3, context: 2, twoMic: 3 };
