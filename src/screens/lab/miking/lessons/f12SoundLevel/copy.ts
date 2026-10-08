/**
 * F12 SOUND LEVEL AND ENVIRONMENTAL NOISE — the shared pages' words for a
 * survey site: the "instrument" is the site, distances are read from the
 * road's edge or the facade, and the mic is a complete sound level meter on
 * a tripod. Starting-points voice; no sources or brands on screen.
 */
import type { LessonCopy } from '../../engine/model/copy.ts';

export const F12_COPY: Partial<LessonCopy> = {
  variantKey: 'SITE',
  variantShort: { site: 'a house by a road' },
  sceneSubject: { site: 'a house by a road, with a lawn between' },
  viewTag: { side: 'SECTION', top: 'SITE PLAN' },
  axes: {
    x: { plus: 'toward the road', minus: 'toward the house', label: 'ACROSS THE LAWN', blurb: 'Toward the road or back toward the house (x).' },
    y: { plus: 'lower', minus: 'higher', label: 'HEIGHT', blurb: 'Up or down (y): the method names the height above the ground.' },
    z: { plus: 'along the facade, away from the house’s corner', minus: 'along the facade, toward its far end', label: 'ALONG', blurb: 'Along the facade and the road (z).' },
  },
  instrument: {
    figureBadge: 'The meter on its tripod',
    figureLabel: 'A sound level meter on a tripod, its windscreen on.',
    partsBadge: 'Tap a part of the site to name it',
    partsLooking: { side: 'Section · the road on the right', top: 'Site plan · the road on the right' },
    partsIdle: 'Tap the house, its facade, the air unit, the road or the power line to see what each one means for the meter.',
    variantNotes: {},
  },
  placement: {
    workedZone: { site: 'sl.open' },
    workedLine: 'This starting point also sets the meter’s height above the ground.',
    workedAim: 'Point the meter as its data says — a free-field meter toward the road.',
    workedClear: 'On the property side, clear of the road, the house and anyone’s path; the tripod stable, the cable secured.',
    blocked: { site: 'The meter or its tripod would touch the house, the air unit or the road’s keep-out — move it clear.' },
    reveal: 'Each position stands for one thing: the open spot, the traffic; 2 m from the facade, the traffic and its reflection; at the wall, the most the facade can add.',
    typeNotes: { slm: 'The complete meter, its windscreen on, aimed as its data says.' },
    note: 'Return to the same spot, height and aim for a before-and-after; log what changed.',
    availableLead: 'Starting points for the meter here',
    learn: {
      intro: 'After our research, each blue zone is a place we recommend you begin, measured from the road’s edge or the facade. Your question and your method name the real receivers.',
      separate: 'Height, distance and the facade are separate: change one at a time, and write each one down.',
      clearance: 'Safety first: authorized positions, away from the road and electrical hazards; the tripod is no hazard to the public.',
      tendencies: 'What a position stands for is a tendency to check against the method — never a promise.',
    },
  },
  practice: {
    gain: 'sl.prac.gain',
    second: 'sl.prac.3',
    mixed: ['sl.mix.1', 'sl.mix.2', 'sl.mix.3'],
    mixedIntro: 'Three cards from earlier pages, mixed: a reading at a wall, a window too short, and a meter’s honest label.',
  },
  words: {
    instrument: 'site',
    player: 'the people on site',
    reference: 'reference',
    inside: 'inside the house',
    outside: 'on the lawn',
    axis: 'the road’s direction',
    facing: 'facing the road',
    shield: 'house in path',
    mountStand: 'Mount: a stable tripod, the cable secured, no hazard to the public',
    mountClip: 'Mount: a stable tripod',
    sheet: 'For a real site, with permission to be there and every position safe to reach. Write what you measured and what it may honestly be called.',
    viewSide: 'Section,',
    viewTop: 'Site plan,',
  },
};
