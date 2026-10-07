/**
 * E02 BACKGROUND AND HARMONY VOCALS — the look and the pages: the shared
 * ensemble stage with standing singers (seatingVoices.ts: a row on a stage,
 * an arc round one mic, a studio circle), Lab 5's own MEET IT, STARTING
 * SETUPS and Placement Studio (the shared mic moved like an array), and the
 * shared pages in the backing group's words. Suggested starting points;
 * FULLY SILENT.
 */
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import { ensembleLessonArt } from '../shared/ensemble/ensembleArt';
import { ENSEMBLE_STEP_COUNTS, makeEnsemblePages } from '../shared/ensemble/ensemblePages';
import { ensembleHandSpec } from '../shared/ensemble/ensembleSpec';
import { E02_MODEL, E02_SEATS, E02_ZONES } from './geometry.ts';

const BASE = ensembleLessonArt({ live: E02_SEATS.live, shared: E02_SEATS.shared, studio: E02_SEATS.studio });
const HAND = E02_ZONES.find((z) => z.id === 'bv.hand')!;

const SPEC = ensembleHandSpec({
  art: BASE,
  model: E02_MODEL,
  title: 'BACKING VOCALS',
  firstZone: 'bv.hand',
  firstMic: 'vocDynCard',
  mic: {
    intro: 'A transducer category alone does not decide tone, spill or headroom: read the real mic’s specifications. Live, a handheld vocal dynamic per part — cardioid, or supercardioid beside loud drums. A large condenser with a pattern switch for a group sharing one mic: cardioid for an arc, omni for a circle. Matching mics does not match voices.',
    mountLine: () => 'Mount: a stand with a boom and a heavy base, clear of the singers’ feet, faces and moves; the cable dressed out of the choreography',
  },
  ctx: {
    pose: HAND.start,
    mic: 'vocDynCard',
    plan: { u0: -1000, u1: 1000, v0: -900, v1: 1400 },
    side: { u0: -1100, u1: 1100, v0: -2050, v1: 250 },
    creditWedge: 'wedge',
    looking: 'The middle singer’s handheld and the wedge in front of them',
    prompt: 'The wedge stays on the floor in front of the singer, facing back at them. Aim the handheld (AIM) or change its PATTERN until the wedge sits in its rejection — keep its front on the mouth.',
    label: 'the middle backing singer with a handheld about 6 cm from the lips and a floor wedge in front,',
    learn: [
      { title: 'LIVE', text: 'Enough voice over the band with margin before feedback: close, directional handhelds, matched, 3:1 apart, each wedge where its pattern rejects most, the fewest open mics. Mute and unmute to hear what the group gives without the PA.' },
      { title: 'THE STUDIO', text: 'A matched, repeatable stack — the same mic, distance, screen and position for each part — or one shared mic or an omni circle in a quiet, flattering room. Doubles are separate takes; a stereo pair does not make one.' },
      { title: 'MOVING SINGERS', text: 'Rehearse shared-mic moves and handoffs; never pass a live handheld. A headset steadies the distance for a singer who must move — each one’s position, windscreen and monitor checked.' },
    ],
  },
  two: {
    A: { zone: 'bv.hand', mic: 'vocDynCard' },
    B: { zone: 'bv.hand2', mic: 'vocDynCard' },
    names: { A: 'MIDDLE SINGER’S MIC', B: 'HIGH SINGER’S MIC' },
    looking: 'Two mics · A the middle singer’s handheld, B the high singer’s',
    prompt: 'Flip B POLARITY both ways, then move a mic. Then change SOURCE: each singer reaches their own mic first and the other one later.',
    label: 'Two backing singers, each with a handheld: A the middle singer’s, B the high singer’s',
    warn: 'This simplified graph shows one point source and straight paths, no room. Real voices move and turn: listen to each mic alone, then the sum in mono.',
    learn: [
      'Each singer reaches their own mic first and the neighbour’s later and quieter. The relevant distance is the difference in paths from that singer to each mic — 1 m is about 2.9 ms.',
      'Spaced 3:1 or more, the neighbour’s copy is quiet and the comb shallow. Too close, it is loud and the stack turns phasey — fewer mics, closer mics, or more space.',
    ],
  },
  practice: {
    orderNote: 'Live backing vocals as a sequence: put the steps in order. A step tapped too early is answered with why it cannot come yet.',
    gainId: 'bv.prac.gain',
    secondId: 'bv.prac.3',
    mixIds: ['bv.nom', 'bv.31why', 'bv.ring'],
    mixIntro: 'Three cards from earlier pages, mixed: open mics and the margin, what 3:1 does, and the first ring.',
    sheetNote: 'For a real group, with the singers’ agreement. Write tendencies in words — what you heard, not a promised result.',
  },
  words: {
    placeBadge: 'Blue = recommended starting points · grey dashes = the singers’ space · pinch to zoom',
    clearance: 'Clearance comes first: the singers’ faces, hands and feet as they move, and their way in and out of a shared mic.',
    cardioidTried: 'What you just saw: a cardioid rejects most directly behind it. A handheld aimed level at the mouth has its back toward the wedge — but the wedge is low, so tilt or a tighter pattern decides how much it hears.',
    sourceNote: 'What you just saw: a voice reaches two mics at different times. Summed, the late copy cancels where it is half a period late: comb-filter notches. Polarity flips the sign — it moves the notches; it does not remove the delay. Change the SOURCE: each singer gives their own delay.',
  },
});

export const E02_ART: LessonArt = { ...BASE, pages: makeEnsemblePages(SPEC), stepCounts: ENSEMBLE_STEP_COUNTS };
