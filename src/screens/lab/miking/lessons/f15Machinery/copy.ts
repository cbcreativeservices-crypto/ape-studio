/**
 * F15 MACHINERY AND PRODUCT SOUND — the shared pages' words (engine/model/
 * copy.ts) for a guarded desk fan on a small table: distances read from the
 * fan, the exclusion zone and the airflow kept out of, the receivers at a
 * seated ear height. Starting-points voice; no sources or brands on screen.
 */
import type { LessonCopy } from '../../engine/model/copy.ts';

export const F15_COPY: Partial<LessonCopy> = {
  variantKey: 'DEVICE',
  variantShort: { fan: 'desk fan' },
  sceneSubject: { fan: 'a guarded desk fan on a small table' },
  viewTag: { side: 'SIDE', top: 'FROM ABOVE' },
  axes: {
    x: { plus: 'downwind of the fan', minus: 'behind the fan', label: 'ALONG', blurb: 'Along the airflow, or behind the fan (x).' },
    y: { plus: 'lower', minus: 'higher', label: 'HEIGHT', blurb: 'Up or down (y): a seated ear is about 1.2 m above the floor.' },
    z: { plus: 'to the user’s side', minus: 'to the other side', label: 'ACROSS', blurb: 'Across the fan (z).' },
  },
  instrument: {
    figureBadge: 'The fan, drawn from the front',
    figureLabel: 'A guarded desk fan: the wire guard, the blades behind it, the hub, the column and the base.',
    partsBadge: 'Tap a part to name it',
    partsLooking: { side: 'Side · the fan blows to the right', top: 'From above · the fan blows to the right' },
    partsIdle: 'Tap the guard, the motor, the sensor, the zone or the airflow to see what each means for the mic.',
    variantNotes: {},
  },
  placement: {
    workedZone: { fan: 'mp.A' },
    workedLine: 'This starting point also sets the mic’s height above the floor: a seated ear.',
    workedAim: 'Point the mic at the fan; log its orientation as well as its position.',
    workedClear: 'Outside the exclusion zone and beside the airflow; the stand and its cable out of every path.',
    blocked: { fan: 'The mic or its stand would enter the exclusion zone, the airflow, the table or you — keep it outside.' },
    reveal: 'Each position stands for one thing: A, the user’s ear; B and C, the fan from other sides at the same radius; close by the housing, one panel; farther out, a listener’s perspective.',
    typeNotes: {
      measFF: 'A measurement mic: aim it as its data says; label the result relative unless the chain is calibrated.',
      measRI: 'Random incidence: for a reverberant room, as its data says.',
      sdcCard: 'A pencil condenser: a perspective for a recording — its pattern shapes the tone.',
    },
    note: 'Mark the stand’s feet: a return to A must find the same spot.',
    availableLead: 'Starting points for this mic here',
    learn: {
      intro: 'After our research, each blue zone is a place we suggest you begin — all outside the exclusion zone, beside the airflow. The product’s own test code sets real positions.',
      separate: 'Distance, angle and height are separate: change one at a time, and keep the cycle the same.',
      clearance: 'Nothing enters the zone; nothing reaches through a guard; the stand out of every path.',
      tendencies: 'What a position stands for is a tendency to check — never a promise about the whole device.',
    },
  },
  practice: {
    gain: 'mp.prac.gain',
    second: 'mp.prac.3',
    mixed: ['mp.mix.1', 'mp.mix.2', 'mp.mix.3'],
    mixedIntro: 'Three cards from earlier pages, mixed: a short take, a peak near the vent, and a claim too big for its setup.',
  },
  words: {
    instrument: 'fan',
    player: 'person running the test',
    reference: 'fan',
    inside: 'inside the exclusion zone',
    outside: 'outside the exclusion zone',
    axis: 'the airflow',
    facing: 'facing the fan',
    shield: 'fan in path',
    mountStand: 'Mount: a firm stand, its feet marked, its cable clear of the fan',
    mountClip: 'Mount: a firm stand',
    sheet: 'For a real device, with the owner’s permission and someone qualified on it. Write what you measured and what it may honestly be called.',
    viewSide: 'Side view,',
    viewTop: 'From above,',
  },
};
