/**
 * E13 MIXED CLASSICAL ENSEMBLES — the look and the pages: the shared
 * ensemble stage in a chamber group and an orchestra, Lab 5's own MEET IT,
 * STARTING SETUPS and array Placement Studio, and the shared pages in the
 * ensemble's words. Suggested starting points; FULLY SILENT.
 */
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import { ensembleLessonArt } from '../shared/ensemble/ensembleArt';
import { ENSEMBLE_STEP_COUNTS, makeEnsemblePages } from '../shared/ensemble/ensemblePages';
import { ARRAY_CARDS, ensembleHandSpec } from '../shared/ensemble/ensembleSpec';
import { CH_VC, E13_MODEL, E13_SEATS } from './geometry.ts';

const BASE = ensembleLessonArt({ chamber: E13_SEATS.chamber, orchestra: E13_SEATS.orchestra });

const SPEC = ensembleHandSpec({
  art: BASE,
  model: E13_MODEL,
  title: 'MIXED ENSEMBLE',
  firstZone: 'ch.main',
  firstMic: 'arrCard',
  mic: {
    intro: 'A transducer category alone does not decide tone, spill or headroom: read the real mic’s specifications. For the main array, matched cardioids (X/Y, the 17 cm pair) or omnis (a spaced pair, a tree); a figure-8 for an M/S Side; cardioids for supports and spots. Each needs phantom power and a stable stand.',
    mountLine: () => 'Mount: a tall stand with a wide base, clear of the players, their bows, slides and pedals; anything suspended is the venue’s rated rigging',
    extra: ARRAY_CARDS,
  },
  ctx: {
    pose: CH_VC,
    mic: 'arrCard',
    plan: { u0: -1800, u1: 2800, v0: -1600, v1: 2800 },
    side: { u0: -1800, u1: 2800, v0: -2400, v1: 300 },
    creditWedge: 'mon',
    looking: 'From above · the cello spot and a floor monitor',
    prompt: 'The floor monitor stays in front of the group, facing the players. Turn the cello spot (AIM) or change its PATTERN until the monitor sits in its rejection — and keep its front on the cello.',
    label: 'the chamber group with a cardioid spot on the cello and a floor monitor in front,',
    learn: [
      { title: 'A RECORDING', text: 'Build the sound with one main array first; add at most two supports for stated reasons; ambience later. Keep the raw channels and their geometry noted for the mix.' },
      { title: 'REINFORCEMENT', text: 'Find what already reaches the audience. Close, directional support where it is needed; fewer open mics; monitors placed by the real polar diagrams, at the level the players need. A beautiful distant array may be wrong for the PA.' },
      { title: 'BOTH AT ONCE', text: 'Give every mic a role: capture, PA, or both. A recording pair need not feed the PA; a shared preamp’s gain reaches every feed on it — agree who controls gain and phantom power.' },
    ],
  },
  two: {
    A: { zone: 'ch.main', mic: 'arrCard' },
    B: { zone: 'ch.spot', mic: 'arrCard' },
    names: { A: 'MAIN PAIR', B: 'CELLO SPOT' },
    looking: 'Two mics · A the main pair’s centre, B the cello spot',
    prompt: 'Flip B POLARITY both ways, then move a mic. Then change SOURCE: each player reaches the two mics at its own times.',
    label: 'The chamber group with the main pair (A) and a cello spot (B)',
    warn: 'This simplified graph shows one point source and straight paths, no room. Real players are large sources at different distances, so one delay never suits them all — judge by ear, in mono, against the plain version.',
    learn: [
      'The relevant distance is the difference in paths from the player to each mic — not the distance between the mics. 1 m of path difference is about 2.9 ms.',
      'Compare main alone, spot alone and both. Try the spot’s level, placement or angle first; a polarity flip only tests one relationship; a room-specific delay method is not a fixed recipe — try it on several notes and dynamics, and keep the plain channels.',
    ],
  },
  practice: {
    orderNote: 'A main array for a mixed ensemble, as a sequence: put the steps in order. A step tapped too early is answered with why it cannot come yet.',
    gainId: 'mix.prac.gain',
    secondId: 'mix.prac.3',
    mixIds: ['mix.hole', 'mix.tree', 'mix.need'],
    mixIntro: 'Three cards from earlier pages, mixed: a spaced pair’s centre, a tree’s centre mic, and what earns a support.',
    sheetNote: 'For a real ensemble, with the players’ and the venue’s agreement. Write tendencies in words — what you heard, not a promised result.',
  },
  words: {
    placeBadge: 'Blue = suggested starting points · grey dashes = the players’ space · pinch to zoom',
    clearance: 'Clearance comes first: the players’ sightlines, breathing, bowing, slides, pedals and the way in and out. Anything suspended is the venue’s, by qualified personnel.',
    cardioidTried: 'What you just saw: a cardioid rejects most directly behind it. A spot aimed down at the cello turns its back up and toward the hall — where a monitor can sit in its rejection.',
    sourceNote: 'What you just saw: sound reaches the two mics at different times. Summed, the delayed copy cancels where it is half a period late: comb-filter notches. Polarity flips the sign — it moves the notches; it does not remove the delay. Change the SOURCE: each player gives its own delay.',
  },
});

export const E13_ART: LessonArt = { ...BASE, pages: makeEnsemblePages(SPEC), stepCounts: ENSEMBLE_STEP_COUNTS };
