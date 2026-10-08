/**
 * E11 STRING QUARTETS AND LARGER STRING SECTIONS — the look and the pages:
 * the shared ensemble stage (the quartet in two orders, the string sections),
 * Lab 5's own MEET IT, STARTING SETUPS and array Placement Studio, and the
 * shared pages in the quartet's words. Suggested starting points; FULLY SILENT.
 */
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import { ensembleLessonArt } from '../shared/ensemble/ensembleArt';
import { ENSEMBLE_STEP_COUNTS, makeEnsemblePages } from '../shared/ensemble/ensemblePages';
import { ARRAY_CARDS, ensembleHandSpec } from '../shared/ensemble/ensembleSpec';
import { E11_MODEL, E11_SEATS, VC_Q } from './geometry.ts';

const BASE = ensembleLessonArt({ quartet: E11_SEATS.quartet, quartetVa: E11_SEATS.quartetVa, sections: E11_SEATS.sections });

const SPEC = ensembleHandSpec({
  art: BASE,
  model: E11_MODEL,
  title: 'STRING QUARTET',
  firstZone: 'q.main',
  firstMic: 'arrCard',
  mic: {
    intro: 'Use quiet, low-noise mics with a suitable response for the main pair: matched cardioids for X/Y and the 17 cm pair, omnis for a spaced pair, a figure-8 for an M/S Side. For a spot or a close mic, a cardioid on its own stand — or a miniature on a mount made for the instrument, with the player’s approval and its specified adapter.',
    mountLine: () => 'Mount: a stand with a stable base in front of the group, clear of the bows, the endpin and the sightlines; an instrument mount only with the player’s approval, never on the bridge or the varnish',
    extra: ARRAY_CARDS,
  },
  ctx: {
    pose: VC_Q.pose,
    mic: 'arrCard',
    plan: { u0: -1800, u1: 2200, v0: -1200, v1: 2600 },
    side: { u0: -1800, u1: 2200, v0: -2300, v1: 300 },
    creditWedge: 'mon',
    looking: 'From above · the cello spot and a floor monitor',
    prompt: 'The floor monitor stays in front of the quartet, facing the players. Turn the cello spot (AIM) or change its PATTERN until the monitor sits in its rejection — and keep its front on the cello.',
    label: 'the quartet with a cardioid spot on the cello and a floor monitor in front,',
    learn: [
      { title: 'A RECORDING', text: 'A quiet room and low-noise mics; the main pair alone first; a viola or cello spot only when a line needs it, raised from muted until it is clearer without pulling it out of the group.' },
      { title: 'A QUIET HALL', text: 'Little or no reinforcement may be needed. If any, a little from close aimed mics; keep the recording mix separate where the system allows.' },
      { title: 'A LOUD BAND STAGE', text: 'Individual directional close mics or instrument mounts; move loud amps, drums and loudspeakers away from the strings; place wedges by the real polar diagram with the players in position. A null at a loud source does not guarantee silence.' },
    ],
  },
  two: {
    A: { zone: 'q.main', mic: 'arrCard' },
    B: { zone: 'q.vc', mic: 'arrCard' },
    names: { A: 'MAIN PAIR', B: 'CELLO SPOT' },
    looking: 'Two mics · A the main pair’s centre, B the cello spot',
    prompt: 'Flip B POLARITY both ways, then move a mic. Then change SOURCE: each player reaches the two mics at its own times.',
    label: 'The quartet with the main pair (A) and a cello spot (B)',
    warn: 'This simplified graph shows one point source and straight paths, no room. A bowed string is a large source and players move, so one delay never suits them all — judge by ear, in mono, against the plain version.',
    learn: [
      'An estimated spot delay is the difference between the main and spot distances from the player, divided by the speed of sound: 1 m is about 2.9 ms. It is one source’s estimate, not a section’s.',
      'Lowering a spot, moving it or reducing redundant pickup can be better than aligning everything electronically. Never adjust live monitor latency as a stand-in for recording alignment.',
    ],
  },
  practice: {
    orderNote: 'A quartet recording setup, as a sequence: put the steps in order. A step tapped too early is answered with why it cannot come yet.',
    gainId: 'sq.prac.gain',
    secondId: 'sq.prac.3',
    mixIds: ['sq.hole', 'sq.need', 'sq.first2'],
    mixIntro: 'Three cards from earlier pages, mixed: a spaced pair’s centre, what earns a support, and a support’s early arrival.',
    sheetNote: 'For a real quartet or section, with the players’ agreement. Write tendencies in words — what you heard, not a promised result.',
  },
  words: {
    placeBadge: 'Blue = suggested starting points · grey dashes = the players and their bows · pinch to zoom',
    clearance: 'Clearance comes first: the bows’ full sweep, the left hands, the chairs, the cello’s endpin, the cables and the players’ sightlines. Mounts only with the player’s approval.',
    cardioidTried: 'What you just saw: a cardioid rejects most directly behind it. A spot aimed down at the cello turns its back up and toward the hall — where a monitor can sit in its rejection.',
    sourceNote: 'What you just saw: sound reaches the two mics at different times. Summed, the delayed copy cancels where it is half a period late: comb-filter notches. Polarity flips the sign — it moves the notches; it does not remove the delay. Change the SOURCE: each player gives its own delay.',
  },
});

export const E11_ART: LessonArt = { ...BASE, pages: makeEnsemblePages(SPEC), stepCounts: ENSEMBLE_STEP_COUNTS };
