/**
 * B08 BROADCAST AUDIENCE AND EVENT SPACE — the shared pages' words (engine/
 * model/copy.ts) for the pages this lesson keeps from the engine
 * (TROUBLESHOOT and PRACTICE) and for the engine's setups data (ONE MIC =
 * the worked zone, TWO MICS = the two zone mics). Its MEET IT, STARTING
 * SETUPS, MICROPHONES, the Placement Studio, LIVE CHECKS and TWO MICS are its
 * own pages (pages.tsx). Starting-points voice (owner ruling 2026-10-04): no
 * sources, brands or badges.
 */
import type { LessonCopy } from '../../engine/model/copy.ts';

export const B08_COPY: Partial<LessonCopy> = {
  variantKey: 'WHERE',
  variantShort: { studio: 'studio audience' },
  sceneSubject: { studio: 'a studio audience with a PA at the stage’s corners' },
  viewTag: { side: 'SIDE · ACROSS THE HALL', top: 'TOP · FROM ABOVE' },
  axes: {
    x: { plus: 'to the right as drawn', minus: 'to the left as drawn', label: 'ACROSS', blurb: 'Across the hall (x), left and right as the plan is drawn.' },
    y: { plus: 'lower', minus: 'higher', label: 'HEIGHT', blurb: 'Up or down (y). Heights are read from the floor.' },
    z: { plus: 'toward the stage', minus: 'out into the audience', label: 'OUT · IN', blurb: 'Toward the stage or out over the seats (z).' },
  },
  instrument: {
    figureBadge: 'A studio audience from above',
    figureLabel: 'A studio audience with its crowd mic places.',
    partsBadge: 'Tap a part of the hall to name it',
    partsLooking: { side: 'Side view · across the hall', top: 'Top view · from above' },
    partsIdle: 'Tap the section, the front row, the bar or the floor.',
    variantNotes: {},
  },
  placement: {
    workedZone: { studio: 'b8.mono' },
    workedLine: 'This starting point also reads how high the mic is above the floor.',
    workedAim: 'Aim it at the faces of the section — the lab counts it within about {tol}°.',
    workedClear: 'On an approved place, hung by qualified crew, out of the aisles, the exits and the cameras’ view.',
    blocked: {},
    reveal: '',
    typeNotes: {
      arrCard: 'Ideas to try with a crowd mic: raised over a section, aimed at the faces, the PA off its front — then a second zone, then an XY pair, comparing in mono.',
      arrOmni: 'Ideas to try with spaced omnis: high over the hall for its size and low end — and a check of the mono sum.',
    },
    note: 'Approval comes first: only an approved place, never in an aisle or an exit, never over people unless a qualified rigger hung it.',
    availableLead: 'Starting points for this mic',
    learn: {
      intro: 'After our research, each starting point is where we recommend you begin — raised, on an approved place, aimed at the faces of a section, the PA off its front. They are starting points, not rules. Experimentation is encouraged.',
      separate: 'Place, height and aim are separate decisions; change one at a time and listen to each.',
      clearance: 'Only an approved place: never in an aisle, an exit or a camera’s view; nothing over people without a qualified rigger.',
      tendencies: 'Higher and aimed at the faces tends to bring the section together; lower, one nearby person; toward the PA, the loudspeakers. Tendencies, to check by ear.',
    },
  },
  twoMic: {
    variant: 'studio',
    label: 'Two zone mics at the stage’s corners',
    A: { typeId: 'arrCard', pattern: 'cardioid', zone: 'b8.zoneL' },
    B: { typeId: 'arrCard', pattern: 'cardioid', zone: 'b8.zoneR' },
    learn: [
      'Two zone mics hear the same laugh at different times: the arrival difference depends on where it is, so it changes from one seat to the next.',
      'They are two zones, not a stereo pair. Monitor each on its own, then check the mono sum — and do not time-align them to one event when the audience is everywhere.',
    ],
    warn: 'This simplified picture treats the source as one point and both mics as hearing it along straight paths; a real audience is many sources, with the PA and the room.',
  },
  practice: { gain: 'b8.prac.gain', second: 'b8.prac.3', mixed: ['b8.mix.1', 'b8.mix.2', 'b8.mix.3'], mixedIntro: 'Three cards from earlier pages, mixed: the nearest seat, the PA, and two zones.' },
  terms: {
    instrument: 'the audience',
    aimRef: 'the faces',
    startIntro: 'This lesson is about microphones for an audience — the laughter, applause and size of a room — and keeping them out of the PA.',
    startNew: 'Good — NEXT takes you through the venue and the audience first. You can change how you started here at any time.',
    refTitle: 'MEASURED TO',
    otherRef: 'Distances are read from the capsule to the faces of the section, at a seated head’s height.',
    noAim: 'This starting point gives no aim: aim at the faces of a section.',
    clipMount: 'Mount: an approved fixture, rigged by qualified crew',
    standMount: 'Mount: a stand on an approved place, out of every aisle and exit',
    inPath: 'in the way',
    facing: 'facing the faces',
    observation: 'For a real event, with the venue’s permission: write each zone, its channel, what it gave against the PA — observations, not predictions.',
  },
};
