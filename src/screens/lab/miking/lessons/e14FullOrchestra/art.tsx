/**
 * E14 FULL ORCHESTRA — the look and the pages: the shared ensemble stage
 * (shared/ensemble/) in the orchestra's two seatings, Lab 5's own MEET IT,
 * STARTING SETUPS and array Placement Studio, and the shared pages
 * (microphones, studio or live, two mics, troubleshoot, practice) in the
 * orchestra's words. Suggested starting points; no sources on screen;
 * FULLY SILENT; nothing moves by itself.
 */
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import { ensembleLessonArt } from '../shared/ensemble/ensembleArt';
import { ENSEMBLE_STEP_COUNTS, makeEnsemblePages } from '../shared/ensemble/ensemblePages';
import { ARRAY_CARDS, ensembleHandSpec } from '../shared/ensemble/ensembleSpec';
import { E14_MODEL, E14_SEATS, VC_AM } from './geometry.ts';

const BASE = ensembleLessonArt({ american: E14_SEATS.american, german: E14_SEATS.german });

const SPEC = ensembleHandSpec({
  art: BASE,
  model: E14_MODEL,
  title: 'FULL ORCHESTRA',
  firstZone: 'orch.main',
  firstMic: 'arrOmni',
  mic: {
    intro: 'No brand and no special “orchestra mic” is required. Choose by what the job needs: omnis for a spaced pair, a tree and outriggers; matched cardioids for X/Y and the 17 cm pair, and for supports; a figure-8 for the Side of an M/S pair. Each needs phantom power, a tall stand and room to stay clear of the players.',
    mountLine: () => 'Mount: a tall stand with a wide base, or a boom stand behind the podium — clear of the players, the conductor and the walkways; anything flown is the venue’s rigging',
    extra: ARRAY_CARDS,
  },
  ctx: {
    pose: VC_AM.pose,
    mic: 'arrCard',
    plan: { u0: 300, u1: 4900, v0: -1600, v1: 3300 },
    side: { u0: 300, u1: 4900, v0: -3000, v1: 300 },
    creditWedge: 'fill',
    looking: 'From above · the cello support and a side-fill monitor',
    prompt: 'The side-fill monitor stays at the front right, facing the players. Turn the support (AIM) or change its PATTERN until the monitor sits in its rejection — and keep its front on the cellos.',
    label: 'the orchestra’s front right with a cardioid support over the cellos and a side-fill monitor,',
    learn: [
      { title: 'A HALL RECORDING', text: 'One complete picture from the main pair or tree; named supports only after a gap is heard. Set gain on the loudest tutti; record every channel separately when you can, with a channel map.' },
      { title: 'A BROADCAST', text: 'The same main perspective, with supports for the close-ups on their own channels, and room or audience mics judged against the main image. Cameras need clear sightlines: stands where no camera looks.' },
      { title: 'LIVE REINFORCEMENT', text: 'First ask whether the orchestra needs it at all. If it does: closer section or solo pickup, fewer open mics, each aimed with the loudspeakers and monitors in mind. Keep the distant pair out of the PA; build from the sound already in the room.' },
    ],
  },
  two: {
    A: { zone: 'orch.main', mic: 'arrOmni' },
    B: { zone: 'sup.ww', mic: 'arrCard' },
    names: { A: 'MAIN PAIR', B: 'WOODWIND SUPPORT' },
    looking: 'Two mics · A the main pair’s centre, B a support over the woodwinds',
    prompt: 'Flip B POLARITY both ways, then move a mic. Then change SOURCE: each section reaches the two mics at its own times.',
    label: 'The orchestra with the main pair (A) and a woodwind support (B)',
    warn: 'This simplified graph shows one point source and straight paths, no hall. A real section is many players at different distances, so no single delay suits them all — judge by ear, in mono, against the plain version.',
    learn: [
      'A support close to its players hears them first; the main pair hears them later, by about 2.9 ms for every metre of extra path. Summed, the early copy can change the depth and the colour of that section.',
      'Lower the support first; compare main alone, support alone and both. A delay is a trial for one need, judged by ear — and where the main pair and a support are more than about 4 m apart, it is worth trying, never set blindly from distance alone.',
    ],
  },
  practice: {
    orderNote: 'A main pair for an orchestra recording, as a sequence: put the steps in order. A step tapped too early is answered with why it cannot come yet.',
    gainId: 'orc.prac.gain',
    secondId: 'orc.prac.3',
    mixIds: ['orc.hole', 'orc.tree', 'orc.need'],
    mixIntro: 'Three cards from earlier pages, mixed: a spaced pair’s centre, a tree’s centre mic, and what earns a support.',
    sheetNote: 'For a real orchestra, with the players’, the conductor’s and the venue’s agreement. Write tendencies in words — what you heard, not a promised result.',
  },
  words: {
    placeBadge: 'Blue = suggested starting points · grey dashes = the players and the conductor’s space · pinch to zoom',
    clearance: 'Clearance comes first: the conductor’s sightlines, the bows, the slides, the music stands, the walkways and the exits. Anything flown or reached over players is the venue’s rigging, by qualified crew.',
    cardioidTried: 'What you just saw: a cardioid rejects most directly behind it. A support aimed down at its players turns its back up and toward the hall — where a monitor can sit in its rejection.',
    sourceNote: 'What you just saw: sound reaches the two mics at different times. Summed, the delayed copy cancels where it is half a period late: comb-filter notches. Polarity flips the sign — it moves the notches; it does not remove the delay. Change the SOURCE: each section gives its own delay.',
  },
});

export const E14_ART: LessonArt = { ...BASE, pages: makeEnsemblePages(SPEC), stepCounts: ENSEMBLE_STEP_COUNTS };
