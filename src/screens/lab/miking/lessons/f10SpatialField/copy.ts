/**
 * F10 SPATIAL FIELD PICKUP — the shared pages' words (engine/model/copy.ts)
 * for the pages this lesson keeps from the engine: MICROPHONES' first step
 * (the chosen mic drawn where the lesson starts it), TWO MICROPHONES (the
 * Ambisonic mic and a close mic on the singer), TROUBLESHOOT and PRACTICE.
 * Its MEET IT, STARTING SETUPS, the second half of MICROPHONES, the
 * Placement Studio and CHANNELS AND DESTINATIONS are its own pages
 * (pages.tsx). Starting-points voice (owner ruling 2026-10-04): no sources,
 * brands or badges.
 */
import type { LessonCopy } from '../../engine/model/copy.ts';

export const F10_COPY: Partial<LessonCopy> = {
  variantKey: 'WHERE',
  variantShort: { plaza: 'city square', event: 'outdoor event' },
  sceneSubject: { plaza: 'a city square, a street singer in front', event: 'an outdoor event, a performer on a stage' },
  viewTag: { side: 'SIDE · FROM THE LISTENER’S RIGHT', top: 'TOP · FROM ABOVE' },
  axes: {
    x: { plus: 'toward the scene front', minus: 'away from the front', label: 'FRONT–BACK', blurb: 'Toward the scene front or back from it (x).' },
    y: { plus: 'lower', minus: 'higher', label: 'HEIGHT', blurb: 'Up or down (y). Heights are read from the ground.' },
    z: { plus: 'to the listener’s right', minus: 'to the listener’s left', label: 'ACROSS', blurb: 'Toward the listener’s right or left (z).' },
  },
  instrument: {
    figureBadge: 'The scene and the listener’s point',
    figureLabel: 'An outdoor scene with the listener’s point marked.',
    partsBadge: 'Tap a part of the scene to name it',
    partsLooking: { side: 'Side view · from the listener’s right', top: 'Top view · from above' },
    partsIdle: 'Tap the listener’s point, a source, the footpath or the wall.',
    variantNotes: {},
  },
  placement: {
    workedZone: { plaza: 'sp.head', event: 'sp.head' },
    workedLine: 'This starting point also reads how far the mic is from the scene-front line through the listener’s point.',
    workedAim: 'Face it to the scene front — the lab counts it within about {tol}°.',
    workedClear: 'Clear of the public footpath, on a stable stand, out of everyone’s way.',
    blocked: {},
    reveal: '',
    typeNotes: {
      spHead: 'Ideas to try with the binaural head: at the listener’s height, the face to the scene front, left and right labelled — then listen on headphones.',
      spFoa: 'Ideas to try with the Ambisonic mic: upright, its front mark to the scene front, four matched and linked channels — log the mounting and the capsule order.',
      spDms: 'Ideas to try with Double M/S: mark the figure-8’s positive side first, keep three tracks, and decode on purpose.',
    },
    note: 'Clearance comes first: clear of the footpath and of people, on a stable stand, away from power lines.',
    availableLead: 'Starting points for this mic',
    learn: {
      intro: 'After our research, each starting point is where we suggest you begin for that destination — at the listener’s point, facing the scene front. They are starting points, not rules: walk and listen at other places. Experimentation is encouraged.',
      separate: 'Height, place and facing are separate decisions; log each one.',
      clearance: 'Clear of the public route, on a stable stand, away from power lines.',
      tendencies: 'Closer to the front source tends to bring more of it and less of the place; at the listener’s point, the place as a listener hears it. Tendencies, to check by ear.',
    },
  },
  twoMic: {
    variant: 'plaza',
    label: 'An Ambisonic mic + a close mic on the singer',
    A: { typeId: 'spFoa', pattern: 'unstated', zone: 'sp.foa' },
    B: { typeId: 'vocDynCard', pattern: 'cardioid', zone: 'sp.close' },
    learn: [
      'The close mic hears the singer about 6 m — about 17 ms — before the spatial mic does. Summed as they are, the two make a comb of notches packed close together, heard as colour or as an echo.',
      'Keep them as two layers on their own channels: the spatial view, and the close voice an array cannot isolate. Any blend is a choice, judged by ear — polarity flips the sign and never removes a delay.',
    ],
    warn: 'This simplified graph treats the singer as one point and both mics as hearing the same sound with straight paths and no square. A real spatial mic hears the whole place, the close mic mostly the voice — read the notch POSITIONS (they follow from the arrival-time difference) and treat their depths as illustrative.',
  },
  practice: { gain: 'sp.prac.gain', second: 'sp.prac.3', mixed: ['sp.mix.1', 'sp.mix.2', 'sp.mix.3'], mixedIntro: 'Three cards from earlier pages, mixed: the deliverable first, the four tracks, and two layers in time.' },
  terms: {
    instrument: 'the scene',
    aimRef: 'the scene front',
    startIntro: 'This lesson is about spatial pickup in the field: a binaural head, an Ambisonic mic and surround arrays at a listener’s point, and the channel maps that keep them right.',
    startNew: 'Good — NEXT takes you through the scene first. You can change how you started here at any time.',
    refTitle: 'MEASURED FROM',
    otherRef: 'Heights are read from the ground; the face or front mark points to the scene front.',
    noAim: 'This starting point gives no aim: face the scene front.',
    clipMount: 'Mount: a headset the performer wears, its thin boom from over the ear',
    standMount: 'Mount: a sturdy stand with a wide base, clear of the public route — sandbagged or guyed in wind',
    inPath: 'in path',
    facing: 'facing the scene front',
    observation: 'For a real place, with permission for the site and its use. Write what you heard in words — positions, the front, the channel map — not a promised result.',
  },
};
