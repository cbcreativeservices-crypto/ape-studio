/**
 * F11 MEASUREMENT MICROPHONES AND CALIBRATION — the shared pages' words
 * (engine/model/copy.ts) for a test bench: the loudspeaker is the "source",
 * distances are read from its reference point, the person running the
 * measurement stands back. Starting-points voice; no sources or brands.
 */
import type { LessonCopy } from '../../engine/model/copy.ts';

export const F11_COPY: Partial<LessonCopy> = {
  variantKey: 'SETUP',
  variantShort: { bench: 'test bench' },
  sceneSubject: { bench: 'a test bench with a small loudspeaker' },
  viewTag: { side: 'SIDE', top: 'FROM ABOVE' },
  axes: {
    x: { plus: 'away from the loudspeaker', minus: 'toward the loudspeaker', label: 'DISTANCE', blurb: 'Out along the loudspeaker’s axis, or back toward it (x).' },
    y: { plus: 'lower', minus: 'higher', label: 'HEIGHT', blurb: 'Up or down (y). The reference axis is drawn 1.2 m above the floor.' },
    z: { plus: 'to the right', minus: 'to the left', label: 'ACROSS', blurb: 'Off to one side of the axis or the other (z).' },
  },
  instrument: {
    figureBadge: 'The test bench, drawn from the side',
    figureLabel: 'A small two-way loudspeaker on a stand, and you standing back from it.',
    partsBadge: 'Tap a part to name it',
    partsLooking: { side: 'Side view · the loudspeaker faces right', top: 'From above · the loudspeaker faces right' },
    partsIdle: 'Tap the loudspeaker, its drivers, its stand or yourself to see what each one means for the mic.',
    variantNotes: {},
  },
  placement: {
    workedZone: { bench: 'mm.axis' },
    workedLine: 'This starting point also keeps the mic on the loudspeaker’s axis, drawn dashed.',
    workedAim: 'Point the mic at the loudspeaker’s reference point, as its data says.',
    workedClear: 'Clear of the loudspeaker, its stand and you. The stand stays out of paths, and you stand back before any reading.',
    blocked: { bench: 'The mic or its stand would touch the loudspeaker, its stand or you — move it clear.' },
    reveal: 'Each position stands for one thing: on the axis, the loudspeaker; farther back, more of the room; off the axis, the loudspeaker’s sound to the side; out in the room, sound from every side.',
    typeNotes: {
      measFF: 'Free-field: for sound from one direction — point it as its data says.',
      measRI: 'Random-incidence: for sound from many directions — set it up as its data says.',
      measQuarter: 'A 1/4 in capsule: check its field response in its data; the calibrator needs its adapter.',
    },
    note: 'You stand back from the capsule before a reading: your body is part of the field.',
    availableLead: 'Starting points for this mic here',
    learn: {
      intro: 'After our research, each blue zone is a place we suggest you begin — measured from the loudspeaker’s reference point. The method you are handed sets the real distances.',
      separate: 'Distance, height and angle are separate: change one at a time, and write each one down.',
      clearance: 'Clearance comes first: the stand clear of the loudspeaker, out of paths; you back from the capsule.',
      tendencies: 'What a position stands for is a tendency to check against the method — never a promise.',
    },
  },
  practice: {
    gain: 'mm.prac.gain',
    second: 'mm.prac.3',
    mixed: ['mm.mix.1', 'mm.mix.2', 'mm.mix.3'],
    mixedIntro: 'Three cards from earlier pages, mixed: an honest label, a trend that follows the capsule, and a check that failed.',
  },
  words: {
    instrument: 'loudspeaker',
    player: 'person running the measurement',
    reference: 'reference point',
    inside: 'inside the loudspeaker',
    outside: 'in front of the loudspeaker',
    axis: 'the loudspeaker’s axis',
    facing: 'facing the loudspeaker',
    shield: 'loudspeaker in path',
    mountStand: 'Mount: a sturdy stand, the cable relieved of strain, nothing over the vents',
    mountClip: 'Mount: a sturdy stand',
    sheet: 'For real equipment, with someone qualified on it. Write what you did and what the result may honestly be called.',
    viewSide: 'Side view,',
    viewTop: 'From above,',
  },
};
