/**
 * B16 MOTORSPORT, EQUESTRIAN AND AQUATIC EVENTS — the shared pages' words
 * (engine/model/copy.ts) for the pages this lesson keeps from the engine
 * (TROUBLESHOOT and PRACTICE) and for the engine's setups data. Its other
 * pages are its own (pages.tsx). Starting-points voice (owner ruling
 * 2026-10-04): no sources, brands or badges.
 */
import type { LessonCopy } from '../../engine/model/copy.ts';

export const B16_COPY: Partial<LessonCopy> = {
  variantKey: 'WHERE',
  variantShort: { room: 'practice room' },
  sceneSubject: { room: 'a practice room with a walking line and two equipment areas' },
  viewTag: { side: 'SIDE · ALONG THE WALK', top: 'TOP · FROM ABOVE' },
  axes: {
    x: { plus: 'along the walk toward C', minus: 'along the walk toward A', label: 'ALONG', blurb: 'Along the walking line (x).' },
    y: { plus: 'lower', minus: 'higher', label: 'HEIGHT', blurb: 'Up or down (y). Heights are read from the floor.' },
    z: { plus: 'back from the walk', minus: 'toward the walk', label: 'OUT · IN', blurb: 'Back from the walking line or toward it (z).' },
  },
  instrument: {
    figureBadge: 'The practice room from above',
    figureLabel: 'A practice room with a walking line A–B–C and two equipment areas.',
    partsBadge: 'Tap a part of the room to name it',
    partsLooking: { side: 'Side view · along the walk', top: 'Top view · from above' },
    partsIdle: 'Tap a source point or an equipment area.',
    variantNotes: {},
  },
  placement: {
    workedZone: { room: 'mo.sg.B' },
    workedLine: 'This starting point also reads how far the mic is from the walking line.',
    workedAim: 'Put the axis on the source point — the lab counts it within about {tol}°.',
    workedClear: 'In its equipment area, nothing reaching into the walking path.',
    blocked: {},
    reveal: '',
    typeNotes: {
      shotgunShort: 'Ideas to try with the shotgun: aimed across the walk at B, then along it toward A; the walk from A to C and back with the mic fixed.',
      scSupercard: 'Ideas to try with the compact directional: the same walk from the same place, its own gain logged.',
    },
    note: 'Every stand, cable loop and windshield stays in its equipment area, out of the walking path.',
    availableLead: 'Starting points for this mic',
    learn: {
      intro: 'After our research, each starting point is where we suggest you begin — from an approved place, the axis across or along the path. They are starting points, not rules. Experimentation is encouraged.',
      separate: 'Range, height and aim are separate decisions; change one at a time and log each.',
      clearance: 'Only an approved place: never the course, a run-off, a gate or a route.',
      tendencies: 'Aimed across, a short strong sector; aimed along, a longer one with more of what lies beyond. Tendencies, to check by ear.',
    },
  },
  twoMic: {
    variant: 'room',
    label: 'M1 and M2 on one walking source',
    A: { typeId: 'shotgunShort', pattern: 'supercardioid', zone: 'mo.sg.B' },
    B: { typeId: 'shotgunShort', pattern: 'supercardioid', zone: 'mo.m2.B' },
    learn: [
      'A moving source changes its path difference to two fixed mics, so an alignment made at one pass-by point does not hold everywhere.',
      'Choose a dominant detail feed per sector and reduce the overlap before adding delay. Polarity flips the sign; it never removes a delay.',
    ],
    warn: 'This simplified picture treats the source as one point and both mics as hearing it along straight paths; a real venue adds the crowd, the PA and reflections.',
  },
  practice: { gain: 'mo.prac.gain', second: 'mo.prac.3', mixed: ['mo.mix.1', 'mo.mix.2', 'mo.mix.3'], mixedIntro: 'Three cards from earlier pages, mixed: the dry side, two mics in time, and the horse.' },
  terms: {
    instrument: 'the practice room',
    aimRef: 'the source point',
    startIntro: 'This lesson is about moving action at motorsport, equestrian and aquatic events: fixed detail from approved places, a moving source past fixed mics, and a stable venue view.',
    startNew: 'Good — NEXT takes you through the practice room and the venues first. You can change how you started here at any time.',
    refTitle: 'MEASURED TO',
    otherRef: 'Ranges are read from the capsule to the source point, at its height.',
    noAim: 'This starting point gives no aim: aim into the named sector.',
    clipMount: 'Mount: a reviewed, approved fixture only',
    standMount: 'Mount: an independent stand in the equipment area, out of every route',
    inPath: 'in the way',
    facing: 'facing the path',
    observation: 'For a real, approved practice: write positions, ranges, heights and aims, peaks and margin, what each mic gave on the approach, the pass and the departure — observations, not predictions.',
  },
};
