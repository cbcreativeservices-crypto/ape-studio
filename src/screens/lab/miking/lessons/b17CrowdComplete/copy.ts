/**
 * B17 CROWD AND COMPLETE SPORTS COVERAGE — the shared pages' words
 * (engine/model/copy.ts) for the pages this lesson keeps from the engine
 * (TROUBLESHOOT and PRACTICE) and for the engine's setups data. Its other
 * pages are its own (pages.tsx). Starting-points voice (owner ruling
 * 2026-10-04): no sources, brands or badges.
 */
import type { LessonCopy } from '../../engine/model/copy.ts';

export const B17_COPY: Partial<LessonCopy> = {
  variantKey: 'WHERE',
  variantShort: { venue: 'mock venue' },
  sceneSubject: { venue: 'a mock venue with an action point, an audience and a stereo centre' },
  viewTag: { side: 'SIDE · ACROSS THE VENUE', top: 'TOP · FROM ABOVE' },
  axes: {
    x: { plus: 'across, to the left of the audience', minus: 'across, to the right of the audience', label: 'ACROSS', blurb: 'Across the venue (x).' },
    y: { plus: 'lower', minus: 'higher', label: 'HEIGHT', blurb: 'Up or down (y). Heights are read from the floor.' },
    z: { plus: 'back from the audience', minus: 'toward the audience', label: 'BACK · IN', blurb: 'Back from the audience or toward it (z).' },
  },
  instrument: {
    figureBadge: 'The mock venue from above',
    figureLabel: 'A mock venue: the action point, three audience places, the stereo centre and the action mic.',
    partsBadge: 'Tap a part of the venue to name it',
    partsLooking: { side: 'Side view · across the venue', top: 'Top view · from above' },
    partsIdle: 'Tap the action point, an audience place, S or D.',
    variantNotes: {},
  },
  placement: {
    workedZone: { venue: 'cc.amb.S' },
    workedLine: 'This starting point also reads how far the pair is from the audience.',
    workedAim: 'Put the pair’s axis on U2 — the lab counts it within about {tol}°.',
    workedClear: 'In the pair’s own footprint, no seat, aisle or exit blocked.',
    blocked: {},
    reveal: '',
    typeNotes: {
      arrCard: 'Ideas to try with the audience pair: at S on U2, then 1 m closer at S′; XY against a near-coincident pair; the mono sum each time.',
      shotgunShort: 'Ideas to try with the action mic: on A, then with the source moved 1 m along — and its sum with the audience pair.',
    },
    note: 'Every stand stays in its marked footprint: no seat, aisle, exit or camera view blocked.',
    availableLead: 'Starting points for this mic',
    learn: {
      intro: 'After our research, each starting point is where we suggest you begin — a stable viewpoint first, then the detail it lacks. They are starting points, not rules. Experimentation is encouraged.',
      separate: 'Viewpoint, height, aim and width are separate decisions; change one at a time and log each.',
      clearance: 'Only an approved place: never a seat, an aisle, an exit or a camera’s view.',
      tendencies: 'A broad viewpoint carries the venue; a closer one picks out nearby voices. Tendencies, to check by ear.',
    },
  },
  twoMic: {
    variant: 'venue',
    label: 'The action mic D and the audience pair at S',
    A: { typeId: 'shotgunShort', pattern: 'supercardioid', zone: 'cc.act.D' },
    B: { typeId: 'arrCard', pattern: 'cardioid', zone: 'cc.amb.S' },
    learn: [
      'The action mic and the audience pair hear the same clap at different times; the later room arrival can be part of the intended perspective.',
      'A delay that fits one point is wrong once the source moves. Polarity flips the sign; it never removes a delay.',
    ],
    warn: 'This simplified picture treats the source as one point and both mics as hearing it along straight paths; a real venue adds the crowd, the PA and reflections.',
  },
  practice: { gain: 'cc.prac.gain', second: 'cc.prac.3', mixed: ['cc.mix.1', 'cc.mix.2', 'cc.mix.3'], mixedIntro: 'Three cards from earlier pages, mixed: the mono sum, two mics in time, and a failed side of the pair.' },
  terms: {
    instrument: 'the mock venue',
    aimRef: 'the audience',
    startIntro: 'This lesson brings it all together: commentary, action and audience as separately controllable feeds — the layout, the stereo picture, the downmix and what survives a failure.',
    startNew: 'Good — NEXT takes you through the mock venue and the arena first. You can change how you started here at any time.',
    refTitle: 'MEASURED TO',
    otherRef: 'Ranges are read from the capsules to the source, at its height.',
    noAim: 'This starting point gives no aim: aim across the useful audience region.',
    clipMount: 'Mount: a reviewed, approved fixture only',
    standMount: 'Mount: a stand in its marked footprint, out of every route',
    inPath: 'in the way',
    facing: 'facing the audience',
    observation: 'For a real, approved practice: write viewpoints, heights, ranges, angles and spacing, peaks and the mono result — and whether each output was heard or only planned.',
  },
};
