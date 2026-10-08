/**
 * B13 FIELD AND DIAMOND SPORTS — the shared pages' words (engine/model/
 * copy.ts) for the pages this lesson keeps from the engine (TROUBLESHOOT and
 * PRACTICE) and for the engine's setups data (ONE MIC = the worked zone, TWO
 * MICS = the two-mic pair). Its MEET IT, STARTING SETUPS, MICROPHONES, the
 * Placement Studio, LIVE CHECKS and TWO MICS are its own pages (pages.tsx).
 * Starting-points voice (owner ruling 2026-10-04): no sources, brands or
 * badges.
 */
import type { LessonCopy } from '../../engine/model/copy.ts';

export const B13_COPY: Partial<LessonCopy> = {
  variantKey: 'WHERE',
  variantShort: { field: 'practice field' },
  sceneSubject: { field: 'a 30 × 20 m practice field with its comparison mark M' },
  viewTag: { side: 'SIDE · ALONG THE TOUCHLINE', top: 'TOP · FROM ABOVE' },
  axes: {
    x: { plus: 'along the touchline to the right', minus: 'along the touchline to the left', label: 'ALONG', blurb: 'Along the touchline (x).' },
    y: { plus: 'lower', minus: 'higher', label: 'HEIGHT', blurb: 'Up or down (y). Heights are read from the ground.' },
    z: { plus: 'back from the field', minus: 'toward the field', label: 'OUT · IN', blurb: 'Back from the touchline or toward the play (z).' },
  },
  instrument: {
    figureBadge: 'The practice field from above',
    figureLabel: 'A practice field with the comparison mark M and three targets.',
    partsBadge: 'Tap a part of the field to name it',
    partsLooking: { side: 'Side view · along the touchline', top: 'Top view · from above' },
    partsIdle: 'Tap a target, the mark M, the crew strip or the offset.',
    variantNotes: {},
  },
  placement: {
    workedZone: { field: 'fd.sg.A' },
    workedLine: 'This starting point also reads how far the mic is from the touchline.',
    workedAim: 'Put the axis on the target — the lab counts it within about {tol}°.',
    workedClear: 'On the approved crew strip, nothing in a route, the way out clear.',
    blocked: {},
    reveal: '',
    typeNotes: {
      shotgunShort: 'Ideas to try with the shotgun: on A, then B and C with the gain unchanged; then 10° and 20° off the axis; then lower, re-aimed.',
      spDish: 'Ideas to try with the dish: assembled and focused by its manual, turned only inside the arc, handed off when the target leaves it.',
      arrCard: 'Ideas to try with the ambience: a place that represents the listening side, no one voice or loudspeaker dominating — checked in mono.',
    },
    note: 'Approval comes first: only an approved place, never in play, the offset or a route.',
    availableLead: 'Starting points for this mic',
    learn: {
      intro: 'After our research, each starting point is where we suggest you begin — from an approved place, its axis on a named zone. They are starting points, not rules. Experimentation is encouraged.',
      separate: 'Range, height and aim are separate decisions; change one at a time and log each.',
      clearance: 'Only an approved place: never in play, the offset, a route or a camera’s frame.',
      tendencies: 'Nearer and on the axis tends to bring more detail; farther or off the axis, more of the place. Tendencies, to check by ear.',
    },
  },
  twoMic: {
    variant: 'field',
    label: 'A shotgun at M + the ambience at E',
    A: { typeId: 'shotgunShort', pattern: 'supercardioid', zone: 'fd.sg.A' },
    B: { typeId: 'arrCard', pattern: 'cardioid', zone: 'fd.amb.E' },
    learn: [
      'Both mics hear the same play at different times: the arrival difference depends on where the source is, so it changes as the play moves.',
      'Prefer a dominant zone mic or a controlled handoff when the blend is worse. Polarity flips the sign; it never removes a delay.',
    ],
    warn: 'This simplified picture treats the source as one point and both mics as hearing it along straight paths; a real field adds the crowd, the PA and reflections.',
  },
  practice: { gain: 'fd.prac.gain', second: 'fd.prac.3', mixed: ['fd.mix.1', 'fd.mix.2', 'fd.mix.3'], mixedIntro: 'Three cards from earlier pages, mixed: what may be live, two mics in time, and height.' },
  terms: {
    instrument: 'the field',
    aimRef: 'the target',
    startIntro: 'This lesson is about action sound at field and diamond sports: approved perimeter shotguns, a tracked dish and fixed ambience — and what each can cover.',
    startNew: 'Good — NEXT takes you through the field and the sports first. You can change how you started here at any time.',
    refTitle: 'MEASURED TO',
    otherRef: 'Ranges are read from the capsule to the source, at the source’s height.',
    noAim: 'This starting point gives no aim: aim into the named zone.',
    clipMount: 'Mount: a reviewed, approved fixture only',
    standMount: 'Mount: a weighted stand on the approved place, out of every route',
    inPath: 'in the way',
    facing: 'facing the zone',
    observation: 'For a real, approved practice: write positions, ranges, heights and aims, what each mic gave against the background — observations, not predictions.',
  },
};
