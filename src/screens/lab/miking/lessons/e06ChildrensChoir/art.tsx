/**
 * E06 CHILDREN'S VOICES AND CHOIRS — the look and the pages: the shared
 * ensemble stage with the children drawn FROM ABOVE ONLY (SeatingArt never
 * draws a child in elevation — the engine's side view marks their area
 * instead), Lab 5's own MEET IT, STARTING SETUPS and Placement Studio with
 * the plan as the only view, and the shared pages in the lesson's words.
 * Suggested starting points; FULLY SILENT.
 */
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import { ensembleLessonArt } from '../shared/ensemble/ensembleArt';
import { ENSEMBLE_STEP_COUNTS, makeEnsemblePages } from '../shared/ensemble/ensemblePages';
import { ARRAY_CARDS, ensembleHandSpec } from '../shared/ensemble/ensembleSpec';
import { AREA_L, E06_MODEL, E06_SEATS } from './geometry.ts';

const BASE = ensembleLessonArt({ choir: E06_SEATS.choir, feature: E06_SEATS.feature });

const SPEC = ensembleHandSpec({
  art: BASE,
  model: E06_MODEL,
  title: 'CHILDREN’S CHOIR',
  firstZone: 'cc.area',
  firstMic: 'arrCard',
  mic: {
    intro: 'A transducer category alone does not decide tone, spill or headroom: read the real mic’s specifications. For the choir, directional condensers on stable stands, or one pair; for a featured child, a stand mic an adult sets before a handheld; a headset only fitted and checked by an authorised adult. Each condenser needs phantom power.',
    mountLine: () => 'Mount: a stable stand with a wide base and a sandbag, set and moved only by a responsible adult with the group stopped; cables taped flat or under ramps; nothing hung over the children’s heads',
    extra: ARRAY_CARDS,
  },
  ctx: {
    pose: AREA_L,
    mic: 'arrCard',
    plan: { u0: -2900, u1: 500, v0: -1500, v1: 2300 },
    side: { u0: -2900, u1: 500, v0: -2700, v1: 300 },
    creditWedge: 'mon',
    looking: 'From above · the left area mic and a low floor monitor',
    prompt: 'The low monitor stays in front of the children, facing them, below the area mic. Turn the mic (AIM) or change its PATTERN until the monitor sits in its rejection — and keep its front on the children’s mouths.',
    label: 'the children’s choir from above with a cardioid area mic in front of its left half and a low floor monitor in front of it,',
    learn: [
      { title: 'LIVE', text: 'Begin with the fewest open choir mics, in front, a little above the mouths, aimed at the group. Keep monitors low, in the mics’ rejection, never carrying the choir mics, and never pointed into an open choir mic. Mute and unmute to compare the natural choir with the reinforced one.' },
      { title: 'A RECORDING', text: 'One pair or a carefully placed area mic first — not a close mic on every child; several short takes; spots only for a section the pair cannot carry.' },
      { title: 'THEIR HEARING', text: 'Measure at the children’s positions and lower the level at the source first; quiet, short soundchecks. A child who cannot hear instructions means it is too loud.' },
    ],
  },
  two: {
    A: { zone: 'cc.pair', mic: 'arrCard' },
    B: { zone: 'cc.solo', mic: 'vocDynCard' },
    names: { A: 'MAIN PAIR', B: 'SOLO MIC' },
    looking: 'Two mics · A the choir’s pair, B the featured child’s stand mic',
    prompt: 'Flip B POLARITY both ways, then move a mic. Then change SOURCE: the soloist and each section reach the two mics at their own times.',
    label: 'The children’s choir from above with the pair (A) and the soloist’s stand mic (B)',
    warn: 'This simplified graph shows one point source and straight paths, no room. Judge the soloist with both mics by ear, in mono, against each mic alone.',
    learn: [
      'The relevant distance is the difference in paths from the soloist’s mouth to each mic — not the distance between the mics. 1 m of path difference is about 2.9 ms.',
      'Balance the soloist with her own mic’s level; keep the pair for the choir. Polarity tests one relationship; a delay is a trial judged by ear.',
    ],
  },
  practice: {
    orderNote: 'A children’s choir as a sequence: put the steps in order. A step tapped too early is answered with why it cannot come yet.',
    gainId: 'cc.prac.gain',
    secondId: 'cc.prac.3',
    mixIds: ['cc.nom', 'cc.31why', 'cc.ring'],
    mixIntro: 'Three cards from earlier pages, mixed: open mics and the margin, what 3:1 does, and the first ring.',
    sheetNote: 'For a real choir, with the responsible adults’ and the venue’s agreement. Record no child’s name or image. Write tendencies in words — what you heard, not a promised result.',
  },
  words: {
    placeBadge: 'Blue = suggested starting points · from above only · pinch to zoom',
    clearance: 'Clearance comes first: the children’s feet, the way out, the cable routes — and nothing over their heads. Stop the group before moving any stand.',
    cardioidTried: 'What you just saw: a cardioid rejects most directly behind it. An area mic aimed at the children turns its back toward the hall — turn it, or try a tighter pattern, until the low monitor sits in its rejection.',
    sourceNote: 'What you just saw: a voice reaches the two mics at different times. Summed, the delayed copy cancels where it is half a period late: comb-filter notches. Polarity flips the sign — it moves the notches; it does not remove the delay.',
  },
});

export const E06_ART: LessonArt = { ...BASE, pages: makeEnsemblePages(SPEC), stepCounts: ENSEMBLE_STEP_COUNTS };
