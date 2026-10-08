/**
 * B14 COURT, RACKET AND ICE SPORTS — the shared pages' words for the pages
 * this lesson keeps from the engine (TROUBLESHOOT, PRACTICE) and the engine's
 * setups data. Starting-points voice; no sources, brands or badges.
 */
import type { LessonCopy } from '../../engine/model/copy.ts';

export const B14_COPY: Partial<LessonCopy> = {
  variantKey: 'WHERE',
  variantShort: { line: 'practice line' },
  sceneSubject: { line: 'a mock boundary with the mic mark 3 m outside it' },
  viewTag: { side: 'SIDE · ALONG THE LINE', top: 'TOP · FROM ABOVE' },
  axes: {
    x: { plus: 'along the line to the right', minus: 'along the line to the left', label: 'ALONG', blurb: 'Along the boundary (x).' },
    y: { plus: 'lower', minus: 'higher', label: 'HEIGHT', blurb: 'Up or down (y). Heights are read from the floor.' },
    z: { plus: 'back from the line', minus: 'toward the line', label: 'OUT · IN', blurb: 'Back from the boundary or toward it (z).' },
  },
  instrument: {
    figureBadge: 'The practice line from above',
    figureLabel: 'A mock boundary with three source points inside and the mic mark outside.',
    partsBadge: 'Tap a part of the practice line',
    partsLooking: { side: 'Side view · along the line', top: 'Top view · from above' },
    partsIdle: 'Tap a source point, the mic mark or the outside zone.',
    variantNotes: {},
  },
  placement: {
    workedZone: { line: 'cl.sg.B' },
    workedLine: 'This starting point also reads how far the mic is from the boundary.',
    workedAim: 'Put the axis on the source point — the lab counts it within about {tol}°.',
    workedClear: 'In the outside zone with the observers; nothing inside the line.',
    blocked: {},
    reveal: '',
    typeNotes: {
      shotgunShort: 'Ideas to try with the shotgun: claps at A, B and C with the gain unchanged; 30° off the axis at B; then a second position overlapping at B.',
      scSupercard: 'Ideas to try with the compact directional: the same claps — broader tolerance, more spill.',
    },
    note: 'The mics and the observers stay outside the line; only the source participant walks inside.',
    availableLead: 'Starting points for this mic',
    learn: {
      intro: 'After our research, each starting point is where we suggest you begin — from the outside zone, aimed at the contact height. Starting points, not rules. Experimentation is encouraged.',
      separate: 'Distance, height, aim and the mic are separate variables; change one at a time.',
      clearance: 'Outside the line, out of the walking route and the camera line.',
      tendencies: 'Nearer tends to bring more detail and less room; off the axis, the tone changes. Tendencies, to check by ear.',
    },
  },
  twoMic: {
    variant: 'line',
    label: 'A shotgun at M + a second shotgun at M2',
    A: { typeId: 'shotgunShort', pattern: 'supercardioid', zone: 'cl.sg.B' },
    B: { typeId: 'shotgunShort', pattern: 'supercardioid', zone: 'cl.sg2.B' },
    learn: ['Two open mics hear one point at different times; as the source moves the difference changes.', 'Choose a dominant feed per sector, or hand off; polarity reversal is a diagnostic, not time alignment.'],
    warn: 'A simplified picture: one point source, straight paths, no room.',
  },
  practice: { gain: 'cl.prac.gain', second: 'cl.prac.3', mixed: ['cl.mix.1', 'cl.mix.2', 'cl.mix.3'], mixedIntro: 'Three cards from earlier pages, mixed: the floor, two mics in time, and the glass.' },
  terms: {
    instrument: 'the court',
    aimRef: 'the source point',
    startIntro: 'This lesson is about action sound at court, racket and ice sports: perimeter and compact mics, floor boundary pickup, approved plants — and the airborne sound kept apart from the structure’s vibration.',
    startNew: 'Good — NEXT takes you through the courts first. You can change how you started here at any time.',
    refTitle: 'MEASURED TO',
    otherRef: 'Distances are read from the capsule to the source point.',
    noAim: 'This starting point gives no aim: aim at the contact height.',
    clipMount: 'Mount: an approved, reviewed fixture only',
    standMount: 'Mount: a weighted stand in the outside zone, out of every route',
    inPath: 'in the way',
    facing: 'facing the source',
    observation: 'For a real, approved practice: write the pattern and geometry, the peak and noise, the tone and coverage — observations, not predictions.',
  },
};
