/**
 * F14 LOUDSPEAKER AND SOUND SYSTEM MEASUREMENT — the shared pages' words
 * (engine/model/copy.ts) for three scenes: a test bench, a venue and a
 * studio. Distances are read from the loudspeaker under test (its reference
 * point, the left main, the fill or the left monitor); the receivers sit at
 * an ear height. Starting-points voice; no sources or brands on screen.
 */
import type { LessonCopy } from '../../engine/model/copy.ts';

export const F14_COPY: Partial<LessonCopy> = {
  variantKey: 'SCENE',
  variantShort: { bench: 'test bench', venue: 'venue', studio: 'studio' },
  sceneSubject: { bench: 'a test bench with a small loudspeaker', venue: 'a small venue with mains, a sub and a front fill', studio: 'a studio with a pair of monitors' },
  viewTag: { side: 'SECTION', top: 'PLAN' },
  axes: {
    x: { plus: 'away from the loudspeakers', minus: 'toward the loudspeakers', label: 'DISTANCE', blurb: 'Out from the loudspeakers, or back toward them (x).' },
    y: { plus: 'lower', minus: 'higher', label: 'HEIGHT', blurb: 'Up or down (y): a seated ear is about 1.2 m above the floor, a standing one about 1.7 m.' },
    z: { plus: 'to the right', minus: 'to the left', label: 'ACROSS', blurb: 'Across the room (z).' },
  },
  instrument: {
    figureBadge: 'The test bench, drawn in section',
    figureLabel: 'A small two-way loudspeaker on a stand, its reference axis level with the drivers, and you standing back.',
    partsBadge: 'Tap a part to name it',
    partsLooking: { side: 'Section · the loudspeakers face right', top: 'Plan · the loudspeakers face right' },
    partsIdle: 'Tap a loudspeaker, a driver, the seats or the desk to see what each one means for the mic.',
    variantNotes: {
      venue: 'An installed system: measure each subsystem alone across its seats, then where they overlap.',
      studio: 'Each monitor alone at the listening position, then the places a head moves to.',
    },
  },
  placement: {
    workedZone: { bench: 'ls.axis', venue: 'vn.mid', studio: 'st.listen' },
    workedLine: 'This starting point also keeps the mic on the loudspeaker’s reference axis, drawn dashed.',
    workedAim: 'Aim the mic as its calibration file says; this drawing points it at the loudspeaker.',
    workedClear: 'Clear of the loudspeaker, its stand, the seats’ frames and you; the stand out of the routes.',
    blocked: {
      bench: 'The mic or its stand would touch the loudspeaker, its stand or you — move it clear.',
      venue: 'The mic or its stand would touch a loudspeaker, the stage or the sub — move it clear.',
      studio: 'The mic or its stand would touch a monitor or the desk — move it clear.',
    },
    reveal: 'Each position stands for one thing: on the axis, the loudspeaker; off it, its sound to the side; close to a cone, one driver; at a seat, the system and the room as that seat hears them.',
    typeNotes: {
      measFF: 'Free field: aim it as its calibration file says.',
      measRI: 'Random incidence: made for sound from many directions — check the correction before a direct-sound trace.',
      measQuarter: 'A 1/4 in capsule: for the high levels close to a cone; check its own file.',
    },
    note: 'Log the radius, the angle or the seat for every trace — and the source that was playing.',
    availableLead: 'Starting points for this mic here',
    learn: {
      intro: 'After our research, each blue zone is a place we recommend you begin — on the axis, off it, close to a driver, or at a listener’s seat. The method you are handed sets the real radii, angles and seats.',
      separate: 'Radius, angle and seat are separate: change one at a time, and write each one down.',
      clearance: 'Nothing touches a cone, a grille or a port; stands out of the routes; you back from the capsule.',
      tendencies: 'What a position stands for is a tendency to check against the method — never a promise.',
    },
  },
  practice: {
    gain: 'sy.prac.gain',
    second: 'sy.prac.3',
    mixed: ['sy.mix.1', 'sy.mix.2', 'sy.mix.3'],
    mixedIntro: 'Three cards from earlier pages, mixed: a finder’s choice, a narrow dip at one chair, and one seat called the room.',
  },
  words: {
    instrument: 'loudspeaker',
    player: 'person running the measurement',
    reference: 'loudspeaker',
    inside: 'inside the loudspeaker',
    outside: 'in front of the loudspeaker',
    axis: 'the reference axis',
    facing: 'facing the loudspeaker',
    shield: 'loudspeaker in path',
    mountStand: 'Mount: a firm stand, its position marked, its cable out of the routes',
    mountClip: 'Mount: a firm stand',
    sheet: 'For a real system, with the operator’s agreement and the active sources logged. Write what you measured and what it may honestly be called.',
    viewSide: 'Section,',
    viewTop: 'Plan,',
  },
};
