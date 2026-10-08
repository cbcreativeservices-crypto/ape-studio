/**
 * E05 CHOIRS — the look and the pages: the shared ensemble stage with the
 * choir on its risers and a chamber choir on an arc (seatingVoices.ts), Lab
 * 5's own MEET IT, STARTING SETUPS and Placement Studio, and the shared
 * pages in the choir's words. Suggested starting points; FULLY SILENT.
 */
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import { ensembleLessonArt } from '../shared/ensemble/ensembleArt';
import { ENSEMBLE_STEP_COUNTS, makeEnsemblePages } from '../shared/ensemble/ensemblePages';
import { ARRAY_CARDS, ensembleHandSpec } from '../shared/ensemble/ensembleSpec';
import { AREA_L, E05_MODEL, E05_SEATS } from './geometry.ts';

const BASE = ensembleLessonArt({ risers: E05_SEATS.risers, arc: E05_SEATS.arc });

const SPEC = ensembleHandSpec({
  art: BASE,
  model: E05_MODEL,
  title: 'CHOIR',
  firstZone: 'ch.live',
  firstMic: 'arrCard',
  mic: {
    intro: 'A transducer category alone does not decide tone, spill or headroom: read the real mic’s specifications. Area mics: directional condensers on tall stands, a tighter pattern where the PA is loud. A main pair: matched cardioids (X/Y, the 17 cm pair) or omnis in a fine, quiet room; a figure-8 for an M/S Side. Each needs phantom power.',
    mountLine: () => 'Mount: a tall stand with a wide base, clear of the risers’ edges, the singers’ feet and their sightlines to the conductor; anything hung is the venue’s, in front of the mouths — never over the heads',
    extra: ARRAY_CARDS,
  },
  ctx: {
    pose: AREA_L,
    mic: 'arrCard',
    plan: { u0: -3200, u1: 600, v0: -2300, v1: 2600 },
    side: { u0: -3200, u1: 600, v0: -3300, v1: 300 },
    creditWedge: 'mon',
    looking: 'From the hall · the left area mic and a floor monitor',
    prompt: 'The floor monitor stays in front of the choir, facing the singers, below the area mic. Tilt the mic (AIM) or change its PATTERN until the monitor sits in its rejection — and keep its front on the middle rows.',
    label: 'the choir on risers with a cardioid area mic in front of its left half and a floor monitor below it,',
    learn: [
      { title: 'LIVE', text: 'Begin with the fewest open choir mics that cover the group, in front and a little above, aimed at the singers. Keep monitors low, in the mics’ rejection from their real polar plots, and never send the choir mics into the choir’s monitor. Mute and unmute to compare the natural choir with the reinforced one.' },
      { title: 'A RECORDING', text: 'The simplest credible stereo setup first, moved in small steps and judged on loudspeakers; spots only where the pair cannot carry a section; ambience only if the room needs it.' },
      { title: 'A SMALL ROOM', text: 'A small or lively room may need little or no reinforcement: a choir that already carries needs less PA than expected.' },
    ],
  },
  two: {
    A: { zone: 'ch.pair', mic: 'arrCard' },
    B: { zone: 'ch.spot', mic: 'arrCard' },
    names: { A: 'MAIN PAIR', B: 'SOPRANO SPOT' },
    looking: 'Two mics · A the main pair’s centre, B the soprano spot',
    prompt: 'Flip B POLARITY both ways, then move a mic. Then change SOURCE: each section reaches the two mics at its own times.',
    label: 'The choir on risers with the main pair (A) and a soprano spot (B)',
    warn: 'This simplified graph shows one point source and straight paths, no room. A section is many singers at different distances, so one delay never suits them all — judge by ear, in mono, against the pair alone.',
    learn: [
      'The relevant distance is the difference in paths from the section to each mic — not the distance between the mics. 1 m of path difference is about 2.9 ms.',
      'Compare the pair alone, the spot alone and both. Try the spot’s level, placement or angle first; keep it low and panned where the pair places the section.',
    ],
  },
  practice: {
    orderNote: 'Live choir mics as a sequence: put the steps in order. A step tapped too early is answered with why it cannot come yet.',
    gainId: 'ch.prac.gain',
    secondId: 'ch.prac.3',
    mixIds: ['ch.nom', 'ch.31why', 'ch.ring'],
    mixIntro: 'Three cards from earlier pages, mixed: open mics and the margin, what 3:1 does, and the first ring.',
    sheetNote: 'For a real choir, with the director’s and the venue’s agreement. Write tendencies in words — what you heard, not a promised result.',
  },
  words: {
    placeBadge: 'Blue = suggested starting points · grey dashes = the singers’ space · pinch to zoom',
    clearance: 'Clearance comes first: the risers’ edges, the singers’ feet and their way on and off, the sightlines to the conductor. Nothing hangs over the singers.',
    cardioidTried: 'What you just saw: a cardioid rejects most directly behind it. An area mic aimed down at the choir turns its back up and toward the hall — a floor monitor below it sits off that axis, so tilt the mic or try a tighter pattern.',
    sourceNote: 'What you just saw: a section reaches the two mics at different times. Summed, the delayed copy cancels where it is half a period late: comb-filter notches. Polarity flips the sign — it moves the notches; it does not remove the delay. Change the SOURCE: each section gives its own delay.',
  },
});

export const E05_ART: LessonArt = { ...BASE, pages: makeEnsemblePages(SPEC), stepCounts: ENSEMBLE_STEP_COUNTS };
