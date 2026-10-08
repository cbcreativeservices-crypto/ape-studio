/**
 * E15 JAZZ COMBO — the look and the pages: the shared ensemble stage drawn as
 * a club stage plot (a piano quartet, a guitar group with its amp turned
 * away from the drums), Lab 5's own MEET IT, STARTING SETUPS (with the
 * derived stage-plot readouts) and the main pair's Placement Studio, and the
 * shared pages in the combo's words. Suggested starting points; FULLY SILENT.
 */
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import { ensembleLessonArt } from '../shared/ensemble/ensembleArt';
import { ENSEMBLE_STEP_COUNTS, makeEnsemblePages } from '../shared/ensemble/ensemblePages';
import { ARRAY_CARDS, ensembleHandSpec, STAGE_PLOT_AXES } from '../shared/ensemble/ensembleSpec';
import { aimOf } from '../shared/ensemble/frameS.ts';
import { BASS_MIC, E15_MODEL, E15_SEATS } from './geometry.ts';

const BASE = ensembleLessonArt({ quartet: E15_SEATS.quartet, guitar: E15_SEATS.guitar });
const B = BASS_MIC.own;

const SPEC = ensembleHandSpec({
  art: BASE,
  model: E15_MODEL,
  title: 'JAZZ COMBO',
  firstZone: 'jz.main',
  firstMic: 'arrCard',
  axes: STAGE_PLOT_AXES,
  aimWords: { az: 'Swing the front left or right (seen from above).', el: 'Tilt the front up or down (seen from the front).' },
  mic: {
    intro: 'A transducer category alone does not decide tone, spill or headroom: read the real mic’s specifications. For the main view, matched cardioids (X/Y, the 17 cm pair) or omnis (a spaced pair) in a room that justifies them; small condensers for the bass and the piano; a dynamic close to a loud horn or an amp. Condensers need phantom power; every stand a stable base.',
    mountLine: () => 'Mount: a tall stand with a stable base, clear of the players’ movement, the piano pedals and lid, and the bass endpin — never fixed to the instrument',
    extra: ARRAY_CARDS,
  },
  ctx: {
    pose: { p: BASS_MIC.p, ...aimOf(BASS_MIC.aim) },
    mic: 'sdcCard',
    plan: { u0: B.x - 1500, u1: B.x + 1300, v0: B.z - 900, v1: B.z + 1600 },
    side: { u0: B.x - 1500, u1: B.x + 1300, v0: -2100, v1: 200 },
    creditWedge: 'ub',
    looking: 'From above · the bass mic and the bassist’s wedge',
    prompt: 'The wedge stays on the floor in front of the bassist, facing back at them. Turn the bass mic (AIM) or change its PATTERN until the wedge sits in its rejection — and keep its front on the bridge.',
    label: 'the upright bass with a cardioid in front of its bridge and a floor wedge in front,',
    learn: [
      { title: 'THE CLUB', text: 'The kit and the horns may already fill the room: reinforce only what the audience lacks. Close pickup gives the gain before feedback a distant view cannot; aim each mic with the loudspeakers and monitors in mind.' },
      { title: 'THE STREAM', text: 'Remote listeners hear none of the room: build them their own balance from the close mics and a pair, and keep that pair out of the wedges.' },
      { title: 'THE STUDIO', text: 'Ensemble-first when the players and the room set the balance; a more separated session with each neighbour audible enough to keep the cueing. Keep a room pair on its own tracks.' },
    ],
  },
  two: {
    A: { zone: 'jz.main', mic: 'arrCard' },
    B: { zone: 'jz.ub', mic: 'sdcCard' },
    names: { A: 'MAIN PAIR', B: 'BASS SPOT' },
    looking: 'Two mics · A the main pair’s centre, B the bass spot',
    prompt: 'Flip B POLARITY both ways, then move a mic. Then change SOURCE: each player reaches the two mics at its own times.',
    label: 'The combo with the main pair (A) and a bass spot (B)',
    warn: 'This simplified graph shows one point source and straight paths, no room. Real players are large sources at different distances, so one delay never suits them all — judge by ear, in mono, against the plain version.',
    learn: [
      'The relevant distance is the difference in paths from the player to each mic — not the distance between the mics. 1 m of path difference is about 2.9 ms.',
      'Hear the main alone, the support alone and the sum at matched level, then in mono. Lower or move the overlapping mic before treating polarity or time alignment as a fix.',
    ],
  },
  practice: {
    orderNote: 'A combo setup, as a sequence: put the steps in order. A step tapped too early is answered with why it cannot come yet.',
    gainId: 'jz.prac.gain',
    secondId: 'jz.prac.3',
    mixIds: ['jz.prac.4', 'jz.prac.5'],
    mixIntro: 'Two cards from earlier pages, mixed: a singer joining the combo, and the first ring.',
    sheetNote: 'For a real group, with the players’ and the venue’s agreement. Write tendencies in words — what you heard, not a promised result.',
  },
  words: {
    placeBadge: 'Blue = suggested starting points · grey dashes = the players’ space · pinch to zoom',
    clearance: 'Clearance comes first: the players’ movement, the piano pedals and lid, the bass endpin, the walkways — nothing fixed to an instrument.',
    cardioidTried: 'What you just saw: a cardioid rejects most directly behind it. A bass mic aimed back at the bridge turns its back toward the audience — the wedge, on the floor in front, sits low behind it.',
    sourceNote: 'What you just saw: a player reaches the two mics at different times. Summed, the late copy cancels where it is half a period late: comb-filter notches. Polarity flips the sign — it moves the notches; it does not remove the delay. Change the SOURCE: each player gives its own delay.',
  },
});

export const E15_ART: LessonArt = { ...BASE, pages: makeEnsemblePages(SPEC), stepCounts: ENSEMBLE_STEP_COUNTS };
