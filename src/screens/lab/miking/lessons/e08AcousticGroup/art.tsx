/**
 * E08 ACOUSTIC DUOS AND SMALL GROUPS — the look and the pages: the shared
 * ensemble stage with a seated duo and a folk trio on one arc, Lab 5's own
 * MEET IT, STARTING SETUPS (the equal-distance ring, the 3:1 readout) and
 * the pair's Placement Studio, and the shared pages in the group's words.
 * Suggested starting points; FULLY SILENT.
 */
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import { ensembleLessonArt } from '../shared/ensemble/ensembleArt';
import { ENSEMBLE_STEP_COUNTS, makeEnsemblePages } from '../shared/ensemble/ensemblePages';
import { ARRAY_CARDS, ensembleHandSpec, STAGE_PLOT_AXES } from '../shared/ensemble/ensembleSpec';
import { aimOf } from '../shared/ensemble/frameS.ts';
import { E08_MODEL, E08_SEATS, GUITAR_MIC } from './geometry.ts';

const BASE = ensembleLessonArt({ duo: E08_SEATS.duo, trio: E08_SEATS.trio });
const G = GUITAR_MIC.own;

const SPEC = ensembleHandSpec({
  art: BASE,
  model: E08_MODEL,
  title: 'ACOUSTIC GROUP',
  firstZone: 'ac.main',
  firstMic: 'arrCard',
  axes: STAGE_PLOT_AXES,
  aimWords: { az: 'Swing the front left or right (seen from above).', el: 'Tilt the front up or down (seen from the front).' },
  mic: {
    intro: 'A transducer category alone does not decide tone, spill or headroom: read the real mic’s specifications. For the group, a matched cardioid pair (X/Y, the 17 cm pair) — or omnis in a quiet room worth hearing; small condensers for spots, their off-axis sound still acceptable. Condensers need phantom power; every stand a stable base.',
    mountLine: () => 'Mount: a stand or boom with a stable base, clear of the bows, the hands, the cases and the walkways',
    extra: ARRAY_CARDS,
  },
  ctx: {
    pose: { p: GUITAR_MIC.p, ...aimOf(GUITAR_MIC.aim) },
    mic: 'sdcCard',
    plan: { u0: G.x - 1200, u1: G.x + 1600, v0: G.z - 900, v1: G.z + 1700 },
    side: { u0: G.x - 1200, u1: G.x + 1600, v0: -1800, v1: 200 },
    creditWedge: 'ag',
    looking: 'From above · the guitar spot and the guitarist’s wedge',
    prompt: 'The wedge stays on the floor in front of the guitarist, facing back at them. Turn the guitar spot (AIM) or change its PATTERN until the wedge sits in its rejection — and keep its front on the 12th fret.',
    label: 'the seated guitarist with a cardioid spot near the 12th fret and a floor wedge in front,',
    learn: [
      { title: 'LIVE', text: 'Stable gain before feedback first: close directional mics, pickups or DIs where they help. A stereo pair only when the PA is stereo, the group small and the pair close enough. Monitors and stage level down before any feedback suppression.' },
      { title: 'A RECORDING', text: 'The simplest credible pair, moved in small steps; the players reseated before the EQ; spots one at a time for a clear reason.' },
      { title: 'A SMALL ROOM', text: 'Less reinforcement may sound more natural than trying to amplify every source.' },
    ],
  },
  two: {
    A: { zone: 'ac.main', mic: 'arrCard' },
    B: { zone: 'ac.ag', mic: 'sdcCard' },
    names: { A: 'MAIN PAIR', B: 'GUITAR SPOT' },
    looking: 'Two mics · A the main pair’s centre, B the guitar spot',
    prompt: 'Flip B POLARITY both ways, then move a mic. Then change SOURCE: each player reaches the two mics at its own times.',
    label: 'The group with the main pair (A) and a guitar spot (B)',
    warn: 'This simplified graph shows one point source and straight paths, no room. Real instruments are large sources, so one delay never suits them all — judge by ear, in mono, against the plain version.',
    learn: [
      'The relevant distance is the difference in paths from the player to each mic — not the distance between the mics. 1 m of path difference is about 2.9 ms.',
      'Keep the pair as the reference and listen for the image drifting as the spot comes up. Do not assume a polarity switch or a delay fixes poor geometry.',
    ],
  },
  practice: {
    orderNote: 'A small-group recording, as a sequence: put the steps in order. A step tapped too early is answered with why it cannot come yet.',
    gainId: 'ac.prac.gain',
    secondId: 'ac.prac.3',
    mixIds: ['ac.hole', 'ac.prac.4'],
    mixIntro: 'Two cards from earlier pages, mixed: a spaced pair’s middle, and what to do when 3:1 will not fit.',
    sheetNote: 'For a real group, with the players’ agreement. Write tendencies in words — what you heard, not a promised result.',
  },
  words: {
    placeBadge: 'Blue = recommended starting points · white dots = the players’ distances to the pair, from above · pinch to zoom',
    clearance: 'Clearance comes first: the bows, the picking hands, the cases, the players’ feet and the walkways.',
    cardioidTried: 'What you just saw: a cardioid rejects most directly behind it. A guitar spot aimed back at the 12th fret turns its back toward the audience — the wedge, on the floor in front, sits low behind it.',
    sourceNote: 'What you just saw: a player reaches the two mics at different times. Summed, the late copy cancels where it is half a period late: comb-filter notches. Polarity flips the sign — it moves the notches; it does not remove the delay. Change the SOURCE: each player gives its own delay.',
  },
});

export const E08_ART: LessonArt = { ...BASE, pages: makeEnsemblePages(SPEC), stepCounts: ENSEMBLE_STEP_COUNTS };
