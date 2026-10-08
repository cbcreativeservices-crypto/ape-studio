/**
 * F11 MEASUREMENT MICROPHONES AND CALIBRATION — the lesson's own pages:
 *
 *   sound       HOW SOUND MEETS THE CAPSULE (MEET IT's second half): the
 *               three fields at a real wavelength (FieldScene), then checks
 *   setting     BEFORE ANY MIC (STARTING SETUPS' last step): the question,
 *               the power path, the calibrator's safety, checks
 *   microphone  BUILD THE CHAIN (the chain rack, D-6B-1) and MATCH THE FIELD,
 *               then checks
 *   context     KEEP BACK: your body's reflection into the capsule
 *   twoMic      THE FIELD CHECK before and after, then two channels' records
 *
 * The rest — MEET IT's start and parts, the setups, the mic on the bench,
 * the Placement Studio, Troubleshoot, Practice — are the engine's shared
 * pages. FULLY SILENT; nothing moves by itself.
 */
import { useCallback } from 'react';
import { PageSteps, type MikingStep } from '../../engine/steps';
import { Body, Card, Note, Point } from '../../engine/kit';
import { useChainStep } from '../../engine/chain/ChainRack';
import type { PageProps } from '../../pages/pageTypes';
import { checkStep, makeBeforePage, useFieldStep } from '../shared/measure/measurePages';
import { useKeepAwayStep } from '../shared/measure/KeepAway';
import { useCalibratorStep } from '../shared/measure/CalibratorCheck';
import { drawMeasurePart } from '../shared/measure/partArt';
import { FIELD_MATCH, MEAS_CHAIN } from '../shared/measure/chains.ts';
import { ONE_FREQUENCY_LIMIT } from '../shared/measure/measureSpec.ts';
import { F11_SPK } from './geometry.ts';
import { F11_START } from './model.ts';

/** The calibrator line, exact (F11 L40). */
const CAL_SAFETY = 'A 94 or 114 dB calibrator makes a high level inside its coupler: it goes on a capsule, never to a person’s ear, and it is not a sound effect.';

function F11Sound({ lesson, answers, onAnswered }: PageProps) {
  const field = useFieldStep({
    title: 'How sound meets the capsule',
    badge: 'A 1/2 in measurement mic at true size · wavefronts at the real wavelength · a simplified picture',
    looking: 'The capsule, close up',
    prompt: 'Try each FIELD; in a free field turn the ANGLE; change the PITCH and watch the wavefronts against the capsule.',
    notes: {
      freeField: 'One loudspeaker, one direction: the wavefronts come straight at the grid at 0°. Turn the angle — at 10 kHz the capsule is not much smaller than a wavelength, so where the sound comes from changes what it reads. That is why a free-field mic is pointed as its data says.',
      pressure: 'Sealed in the calibrator’s coupler there is no direction at all: the same pressure all over the diaphragm. The cavity, the seal and the adapter are what matter here.',
      random: 'In a reverberant room sound arrives from many directions at once. A random-incidence mic is made for that — as far as a real room is diffuse, which is never at every frequency.',
    },
    after: 'Three fields, three responses. Each mic is made for one; with the correction its data gives, it can serve another.',
  });
  const steps: MikingStep[] = [
    field,
    checkStep(
      lesson,
      'sound',
      answers,
      onAnswered,
      <>
        <Card>
          <Point title="WHY THE HIGHS">At 1 kHz a wavelength is about 34 cm: a 1/2 in capsule is tiny beside it and hardly disturbs the field. At 10 kHz it is about 3.4 cm — the capsule itself now bends and reflects the wave, and the field it was made for matters.</Point>
          <Point title="OMNI IS NOT A FIELD">“Omnidirectional” is a polar pattern. The field response — free field, pressure, random incidence — is a separate property, in the mic’s data.</Point>
        </Card>
        <Note>This lab never plays a sound and draws no response curve: the pictures show how sound meets the capsule, simplified — straight wavefronts, no bending drawn.</Note>
      </>,
    ),
  ];
  return <PageSteps steps={steps} />;
}

const F11Before = makeBeforePage({
  points: [
    { title: 'THE QUESTION FIRST', text: 'Write it down before choosing hardware: a level at a stated position, a room’s decay, a loudspeaker’s response, or a before-and-after comparison. Note the levels and frequencies involved, the source’s state, the weighting and averaging, the field, the position and the aim. For a claim someone will rely on, get the method and its instrument requirements before you start.' },
    { title: 'THE POWER PATH', text: 'An externally polarized capsule needs its polarization supply; a prepolarized one usually runs from a constant-current input. Neither is automatically compatible with ordinary 48 V phantom power. Use the exact adapter or conditioning unit the maker approves — do not experiment with pinouts or apply power to an unverified sensor, and switch off, or follow the equipment’s own connection steps, before swapping preamps and sensors.' },
    { title: 'THE CALIBRATOR', text: 'Check its identity, battery and calibration status, and that it fits this capsule and grid — a 1/4 in capsule needs its adapter. Use its actual stated output (94 or 114 dB at 1 kHz, as set).' },
    { title: 'MODEST LEVELS', text: 'Use modest demonstration levels. Do not expose anyone to a loudspeaker, siren or impulse merely to prove a meter works — and never raise a level just to make a meter respond.' },
  ],
  safety: [CAL_SAFETY, 'Keep stands out of paths and away from electrical or moving machinery; let qualified people handle energized equipment and anything overhead. Learn on real equipment with someone qualified on it.'],
});

function F11Microphone({ lesson, answers, onAnswered, onInteractive, interactiveDone }: PageProps) {
  const pass = useCallback(() => {
    if (!interactiveDone.has('chainBuilt')) onInteractive('chainBuilt');
  }, [interactiveDone, onInteractive]);
  const chain = useChainStep({
    spec: MEAS_CHAIN,
    drawPart: drawMeasurePart,
    prediction: lesson.predictions.microphone,
    onPass: pass,
    words: {
      title: 'Build the chain',
      badge: 'The chain, top to bottom · a red dashed cable = a refused join · choose each link in the dock',
      looking: 'A measurement chain',
      prompt: 'Pick a QUESTION, then each link in the dock — capsule, power, input, its record. A wrong join is refused, with why.',
      done: 'This chain answers the question.',
    },
  });
  const field = useChainStep({
    spec: FIELD_MATCH,
    drawPart: drawMeasurePart,
    onPass: () => undefined,
    words: {
      title: 'Match the field',
      badge: 'Which response and which aim for each field · amber = check the correction for this field',
      looking: 'Field and response',
      prompt: 'Pick a QUESTION — a loudspeaker test, a coupler, a reverberant room — then the mic’s RESPONSE and how it is set up (AIM).',
      done: 'A sound match.',
    },
  });
  const steps: MikingStep[] = [
    chain,
    { ...field, key: 'field' },
    checkStep(
      lesson,
      'microphone',
      answers,
      onAnswered,
      <Card>
        <Point title="BY PROPERTY, NOT BY BRAND">Choose the capsule size for the level and frequency range, the field response for the field, the power path the maker approves, and an input you can check with the calibrator. A sensitivity belongs to its own chain and record; a dBFS number on a recorder is not a sound level.</Point>
      </Card>,
    ),
  ];
  return <PageSteps steps={steps} />;
}

function F11Context({ lesson, answers, onAnswered, onInteractive, interactiveDone }: PageProps) {
  const clear = useCallback(() => {
    if (!interactiveDone.has('keepAway')) onInteractive('keepAway');
  }, [interactiveDone, onInteractive]);
  const keep = useKeepAwayStep({
    words: {
      title: 'Keep back',
      badge: 'From above · amber = the direct sound · blue dashes = the copy off your body · the ring’s size is the method’s',
      looking: 'You, the mic and the loudspeaker',
      prompt: 'Drag DISTANCE: start close behind the capsule, then step back outside the ring.',
      inside: 'Close behind the capsule your body is a reflector in the field you are measuring: its copy arrives soon after the direct sound and not far below it.',
      outside: 'Outside the ring your copy arrives later and weaker. Monitor from here, and keep the stand and the cable where you will not touch them during a reading.',
      note: 'A simplified picture: one reflection off your chest, sound spreading in straight lines; a body also absorbs and scatters, so the real copy is weaker still. The ring’s radius is drawn at 1 m — the method gives the real one.',
    },
    speaker: F11_SPK,
    mic: F11_START.axis,
    box: { u0: -500, u1: 2900, v0: -900, v1: 2300 },
    onClear: clear,
  });
  const steps: MikingStep[] = [
    keep,
    checkStep(
      lesson,
      'context',
      answers,
      onAnswered,
      <Card>
        <Point title="ON A BENCH OR IN A LAB">Control the source’s level and state, the air handling and the reflections as the method requires. Change one position or condition at a time; repeat the baseline; log when the room, the operator or the aim changed.</Point>
        <Point title="IN A VENUE">Measure where the question is. Coordinate test levels and timing with the operator and the venue; keep stands and cables out of public routes. The measurement mic goes to the analyzer only — never back to the PA.</Point>
      </Card>,
    ),
  ];
  return <PageSteps steps={steps} />;
}

function F11TwoMic({ lesson, answers, onAnswered, onInteractive, interactiveDone }: PageProps) {
  const done = useCallback(() => {
    if (!interactiveDone.has('calCheck')) onInteractive('calCheck');
  }, [interactiveDone, onInteractive]);
  const cal = useCalibratorStep({
    words: {
      title: 'The field check',
      badge: 'The calibrator over the capsule, cut away · readings are a made-up example · the brief sets the tolerance',
      looking: 'The check, before and after',
      prompt: 'Choose an EXAMPLE and how the calibrator sits (SEAT), then READ BEFORE, RUN, READ AFTER.',
      safety: CAL_SAFETY,
    },
    onDone: done,
  });
  const steps: MikingStep[] = [
    cal,
    {
      key: 'channels',
      title: 'Two channels',
      kind: 'LEARN',
      layout: 'read',
      body: (
        <>
          <Card>
            <Point title="EACH CHANNEL ITS OWN">When several mics are used, identify each channel with its own sensitivity, its correction data and its own check. Two capsules of the same model are not matched because they share a name.</Point>
            <Point title="ONE CHANGE AT A TIME">For a relative comparison, change one position or source condition at a time and repeat the baseline. An absolute multi-point survey needs each channel’s chain and the method’s own spacing.</Point>
            <Point title="A LAB CALIBRATION IS ANOTHER JOB">A laboratory calibration gives a certified result with its uncertainty for named equipment; a field check is a practical check of the assembled chain. Both have their place — neither replaces the other.</Point>
          </Card>
          <Body>{ONE_FREQUENCY_LIMIT}</Body>
        </>
      ),
    },
    checkStep(lesson, 'twoMic', answers, onAnswered),
  ];
  return <PageSteps steps={steps} />;
}

export const F11_PAGES = { sound: F11Sound, setting: F11Before, microphone: F11Microphone, context: F11Context, twoMic: F11TwoMic };
export const F11_STEP_COUNTS = { sound: 2, setting: 1, microphone: 3, context: 2, twoMic: 3 };
