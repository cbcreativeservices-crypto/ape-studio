/**
 * B15 TRACK, GYMNASTICS AND COMBAT SPORTS — the shared pages' words
 * (engine/model/copy.ts) for the pages this lesson keeps from the engine
 * (TROUBLESHOOT and PRACTICE) and for the engine's setups data. Its MEET IT,
 * STARTING SETUPS, MICROPHONES, the Placement Studio, LIVE CHECKS and TWO MICS
 * are its own pages (pages.tsx). Starting-points voice (owner ruling
 * 2026-10-04): no sources, brands or badges.
 */
import type { LessonCopy } from '../../engine/model/copy.ts';

export const B15_COPY: Partial<LessonCopy> = {
  variantKey: 'WHERE',
  variantShort: { room: 'practice room' },
  sceneSubject: { room: 'a practice room with three source points and two equipment areas' },
  viewTag: { side: 'SIDE · ALONG THE WALK', top: 'TOP · FROM ABOVE' },
  axes: {
    x: { plus: 'along the walk toward C', minus: 'along the walk toward A', label: 'ALONG', blurb: 'Along the walking line (x).' },
    y: { plus: 'lower', minus: 'higher', label: 'HEIGHT', blurb: 'Up or down (y). Heights are read from the floor.' },
    z: { plus: 'back from the walk', minus: 'toward the walk', label: 'OUT · IN', blurb: 'Back from the walking line or toward it (z).' },
  },
  instrument: {
    figureBadge: 'The practice room from above',
    figureLabel: 'A practice room with three source points on one line and two equipment areas.',
    partsBadge: 'Tap a part of the room to name it',
    partsLooking: { side: 'Side view · along the walk', top: 'Top view · from above' },
    partsIdle: 'Tap a source point or an equipment area.',
    variantNotes: {},
  },
  placement: {
    workedZone: { room: 'tg.sg.B' },
    workedLine: 'This starting point also reads how far the mic is from the walking line.',
    workedAim: 'Put the axis on the source point — the lab counts it within about {tol}°.',
    workedClear: 'In its equipment area, nothing reaching into the walking path.',
    blocked: {},
    reveal: '',
    typeNotes: {
      shotgunShort: 'Ideas to try with the shotgun: on B, then A and C with the gain unchanged; then 30° off the axis at B and back; then lower, re-aimed.',
      scSupercard: 'Ideas to try with the compact directional: the same claps from the same place, its own gain logged — and how much of the room it brings.',
    },
    note: 'Every stand, cable loop and windshield stays in its equipment area, out of the walking path.',
    availableLead: 'Starting points for this mic',
    learn: {
      intro: 'After our research, each starting point is where we recommend you begin — from an approved equipment area, the axis on a named source point. They are starting points, not rules. Experimentation is encouraged.',
      separate: 'Range, height and aim are separate decisions; change one at a time and log each.',
      clearance: 'Only an approved place: never the walking path, a route or a camera’s view.',
      tendencies: 'Nearer and on the axis tends to bring more detail; farther or off the axis, more of the room. Tendencies, to check by ear.',
    },
  },
  twoMic: {
    variant: 'room',
    label: 'M2 and M1 at its farther place',
    A: { typeId: 'shotgunShort', pattern: 'supercardioid', zone: 'tg.m2.B' },
    B: { typeId: 'shotgunShort', pattern: 'supercardioid', zone: 'tg.far.B' },
    learn: [
      'Both mics hear the same action at different times when their paths differ, and the difference changes as the source moves.',
      'Choose a dominant detail feed or a controlled handoff when the blend is worse. Polarity flips the sign; it never removes a delay.',
    ],
    warn: 'This simplified picture treats the source as one point and both mics as hearing it along straight paths; a real venue adds the crowd, the PA and reflections.',
  },
  practice: { gain: 'tg.prac.gain', second: 'tg.prac.3', mixed: ['tg.mix.1', 'tg.mix.2', 'tg.mix.3'], mixedIntro: 'Three cards from earlier pages, mixed: surfaces, two mics in time, and the cue.' },
  terms: {
    instrument: 'the practice room',
    aimRef: 'the source point',
    startIntro: 'This lesson is about action sound at a track start, in gymnastics and in combat sports: fixed detail from approved places, a stable venue view — and what each can cover.',
    startNew: 'Good — NEXT takes you through the practice room and the venues first. You can change how you started here at any time.',
    refTitle: 'MEASURED TO',
    otherRef: 'Ranges are read from the capsule to the source point, at its height.',
    noAim: 'This starting point gives no aim: aim into the named sector.',
    clipMount: 'Mount: a reviewed, approved fixture only',
    standMount: 'Mount: an independent stand in the equipment area, out of every route',
    inPath: 'in the way',
    facing: 'facing the sector',
    observation: 'For a real, approved practice: write positions, ranges, heights and aims, peaks and margin, what each mic gave — observations, not predictions.',
  },
};
