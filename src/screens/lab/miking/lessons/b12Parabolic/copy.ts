/**
 * B12 PARABOLIC AND TRACKED ACTION PICKUP — the shared pages' words for the
 * pages this lesson keeps from the engine (TROUBLESHOOT, PRACTICE) and the
 * engine's setups data. Starting-points voice; no sources, brands or badges.
 */
import type { LessonCopy } from '../../engine/model/copy.ts';

export const B12_COPY: Partial<LessonCopy> = {
  variantKey: 'WHERE',
  variantShort: { field: 'practice field' },
  sceneSubject: { field: 'a practice field, the dish operator at M' },
  viewTag: { side: 'SIDE · ALONG THE TOUCHLINE', top: 'TOP · FROM ABOVE' },
  axes: {
    x: { plus: 'along the touchline to the right', minus: 'along the touchline to the left', label: 'ALONG', blurb: 'Along the touchline (x).' },
    y: { plus: 'lower', minus: 'higher', label: 'HEIGHT', blurb: 'Up or down (y). Heights are read from the ground.' },
    z: { plus: 'back from the field', minus: 'toward the field', label: 'OUT · IN', blurb: 'Back from the touchline or toward the play (z).' },
  },
  instrument: {
    figureBadge: 'The dish, cut along its axis',
    figureLabel: 'A hand-held parabolic dish, cut along its axis.',
    partsBadge: 'Step through the dish’s parts',
    partsLooking: { side: 'Cut along the axis', top: 'From above' },
    partsIdle: 'Step through the bowl, the focus, the element, the hub, the grip and the cover.',
    variantNotes: {},
  },
  placement: {
    workedZone: { field: 'pb.dish.A' },
    workedLine: 'This starting point also reads how far the dish is from the touchline.',
    workedAim: 'Put the dish’s axis on the target — the lab counts it within about {tol}°.',
    workedClear: 'In the approved operating place, turning only inside the arc.',
    blocked: {},
    reveal: '',
    typeNotes: {
      spDish: 'Ideas to try with the dish: on the axis, then a small aim error, then a deliberately off-axis target — listen for the high frequencies first.',
      shotgunShort: 'Ideas to try with the fixed shotgun: on the zone the dish hands off to; compare it with the dish on the same target.',
      arrCard: 'Ideas to try with the ambience: the bed under every handoff — checked in mono.',
    },
    note: 'The operator stays in the approved place and turns only inside the arc.',
    availableLead: 'Starting points for this mic',
    learn: {
      intro: 'After our research, each starting point is where we recommend you begin — the dish’s axis on a chosen target from an approved place. Starting points, not rules. Experimentation is encouraged.',
      separate: 'The target, the aim and the focus are separate decisions; change one at a time.',
      clearance: 'The approved place only; never into play, run-off or a route.',
      tendencies: 'On the axis and in focus tends to bring the most high-frequency detail; off either, the target dulls first. Tendencies, to check by ear.',
    },
  },
  twoMic: {
    variant: 'field',
    label: 'The dish at M + a fixed shotgun at F',
    A: { typeId: 'spDish', pattern: 'unstated', zone: 'pb.dish.A' },
    B: { typeId: 'shotgunShort', pattern: 'supercardioid', zone: 'pb.sg.F' },
    learn: ['Two action mics on one source hear it at different times; the difference changes as the source moves.', 'Monitor their arrival difference and polarity when combined; a fixed delay is right at one point only.'],
    warn: 'A simplified picture: one point source, straight paths, no crowd or reflections.',
  },
  practice: { gain: 'pb.prac.gain', second: 'pb.prac.3', mixed: ['pb.mix.1', 'pb.mix.2', 'pb.mix.3'], mixedIntro: 'Three cards from earlier pages, mixed: the bowl and the bass, two mics in time, and the focus.' },
  terms: {
    instrument: 'the dish',
    aimRef: 'the target',
    startIntro: 'This lesson is about the parabolic dish and tracked action: what the bowl does and does not do, how it is assembled and focused, how it is aimed and handed off.',
    startNew: 'Good — NEXT takes you through the dish first. You can change how you started here at any time.',
    refTitle: 'MEASURED TO',
    otherRef: 'Ranges are read from the dish to the source, at the source’s height.',
    noAim: 'This starting point gives no aim: aim at the chosen target.',
    clipMount: 'Mount: the maker’s handle or approved support',
    standMount: 'Mount: hand-held on its grip, or the maker’s approved support',
    inPath: 'in the way',
    facing: 'facing the target',
    observation: 'For a real, approved practice: write the dish, its focus check, the aim errors you tried and what changed — observations, not predictions.',
  },
};
