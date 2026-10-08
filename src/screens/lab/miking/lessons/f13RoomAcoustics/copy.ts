/**
 * F13 ROOM ACOUSTICS AND REVERBERATION — the shared pages' words for a room
 * test: the "instrument" is the room and its source, distances are read from
 * the source's centre (or the PA), and the receivers sit at a seated ear
 * height. Starting-points voice; no sources or brands on screen.
 */
import type { LessonCopy } from '../../engine/model/copy.ts';

export const F13_COPY: Partial<LessonCopy> = {
  variantKey: 'SOURCE',
  variantShort: { room: 'the omni test source', pa: 'the installed PA' },
  sceneSubject: { room: 'a rehearsal room with an omni test source', pa: 'a rehearsal room with its installed PA' },
  viewTag: { side: 'SECTION', top: 'PLAN' },
  axes: {
    x: { plus: 'toward the back', minus: 'toward the source', label: 'DOWN THE ROOM', blurb: 'Toward the back of the room or toward the source (x).' },
    y: { plus: 'lower', minus: 'higher', label: 'HEIGHT', blurb: 'Up or down (y): a seated ear is about 1.2 m above the floor.' },
    z: { plus: 'toward the curtains', minus: 'toward the other wall', label: 'ACROSS', blurb: 'Across the room (z).' },
  },
  instrument: {
    figureBadge: 'The room, drawn in section',
    figureLabel: 'A rehearsal room: the test source at a performer position, the seats, the walls and the ceiling.',
    partsBadge: 'Tap a part of the room to name it',
    partsLooking: { side: 'Section · the source on the left', top: 'Plan · the source on the left' },
    partsIdle: 'Tap the source, the seats, the curtains, the door or the vent to see what each means for the test.',
    variantNotes: { pa: 'With the installed PA as the source, every result is the system and the room together.' },
  },
  placement: {
    workedZone: { room: 'ra.A', pa: 'ra.paA' },
    workedLine: 'This starting point also sets the mic’s height above the floor: a seated ear.',
    workedAim: 'Set the mic up as its data and the method say; this drawing points it at the source.',
    workedClear: 'Clear of the seats’ frames, the source and its stand; nobody in the direct path; the stand out of the routes.',
    blocked: { room: 'The mic or its stand would touch the source, a wall or the ceiling — move it clear.', pa: 'The mic or its stand would touch the PA, a wall or the ceiling — move it clear.' },
    reveal: 'Each seat hears its own impulse response: the direct sound, the early reflections and the decay differ with the distance and the nearest walls.',
    typeNotes: { measRI: 'Random incidence: made for sound from many directions.', measFF: 'Free field: point it as its data says; check the correction for a reverberant field.' },
    note: 'Mark every position so a second pass after a change can find it again.',
    availableLead: 'Starting points for the receiver here',
    learn: {
      intro: 'After our research, each blue zone is a seat we suggest you begin with, measured from the source. The method you use sets the real counts and spacing.',
      separate: 'Move only the receiver between runs; keep the source, the settings and the room state the same.',
      clearance: 'People and stands out of the direct path; cables out of public routes.',
      tendencies: 'What a seat stands for is a tendency to check against the method — never a promise.',
    },
  },
  practice: {
    gain: 'ra.prac.gain',
    second: 'ra.prac.3',
    mixed: ['ra.mix.1', 'ra.mix.2', 'ra.mix.3'],
    mixedIntro: 'Three cards from earlier pages, mixed: a centre-only reading, a range too short, and a PA labelled as the room.',
  },
  words: {
    instrument: 'room',
    player: 'people in the room',
    reference: 'source',
    inside: 'inside the room',
    outside: 'outside the room',
    axis: 'the line to the source',
    facing: 'facing the source',
    shield: 'seat in path',
    mountStand: 'Mount: a firm stand, its position marked, its cable out of the routes',
    mountClip: 'Mount: a firm stand',
    sheet: 'For a real room, with the venue’s agreement and the room’s state logged. Write what you measured and what it may honestly be called.',
    viewSide: 'Section,',
    viewTop: 'Plan,',
  },
};
