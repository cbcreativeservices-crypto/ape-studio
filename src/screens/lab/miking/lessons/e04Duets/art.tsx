/**
 * E04 DUETS AND SMALL VOCAL GROUPS — the look and the pages: the shared
 * ensemble stage with standing singers (seatingVoices.ts: a duet on a
 * semicircle, two face to face, an a cappella quartet), Lab 5's own MEET IT,
 * STARTING SETUPS and Placement Studio (one mic, a figure-8 or a pair moved
 * like an array), and the shared pages in the duet's words. Suggested
 * starting points; FULLY SILENT.
 */
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import { ensembleLessonArt } from '../shared/ensemble/ensembleArt';
import { ENSEMBLE_STEP_COUNTS, makeEnsemblePages } from '../shared/ensemble/ensemblePages';
import { ARRAY_CARDS, ensembleHandSpec } from '../shared/ensemble/ensembleSpec';
import { E04_MODEL, E04_SEATS, E04_ZONES } from './geometry.ts';

const BASE = ensembleLessonArt({ shared: E04_SEATS.shared, fig8: E04_SEATS.fig8, quartet: E04_SEATS.quartet });
const HAND = E04_ZONES.find((z) => z.id === 'du.hand')!;

const SPEC = ensembleHandSpec({
  art: BASE,
  model: E04_MODEL,
  title: 'DUET',
  firstZone: 'du.shared',
  firstMic: 'grpLdc',
  mic: {
    intro: 'The pattern and the room matter more than a model name: read the real mic’s specifications. One large condenser with a pattern switch for a shared mic (cardioid or omni) or a figure-8 between two singers; matched pairs for a small group; directional handhelds for a live duet.',
    mountLine: () => 'Mount: a stand with a heavy base, its boom running away from the singers, clear of their feet and faces; the cable dressed out of their moves',
    extra: ARRAY_CARDS,
  },
  ctx: {
    pose: HAND.start,
    mic: 'vocDynCard',
    plan: { u0: -1100, u1: 1100, v0: -1000, v1: 1200 },
    side: { u0: -1200, u1: 1200, v0: -2050, v1: 250 },
    creditWedge: 'wedge',
    looking: 'The higher singer’s handheld and the wedge in front of the duet',
    prompt: 'The wedge stays on the floor in front of the two singers, facing back at them. Aim the handheld (AIM) or change its PATTERN until the wedge sits in its rejection — keep its front on the mouth.',
    label: 'the duet with a handheld within 10 cm of the higher singer’s lips and a floor wedge in front,',
    learn: [
      { title: 'LIVE', text: 'The fewest open mics that give the clarity needed: directional handhelds or stand mics, the wedges out of each mic’s most sensitive direction, no ensemble mic in a monitor that can excite it. A repeatable distance — close for the words, a little away for a loud phrase.' },
      { title: 'THE STUDIO', text: 'Place the singers, then one mic, a figure-8 or a pair in a controlled room; a mic each with screens and matched distances when each voice needs its own control. Spot mics are support, never a replacement for a balanced performance.' },
      { title: 'THE MONITOR CHECK', text: 'Bring the monitors up in small steps only to the agreed level while the singers perform the loudest passage. At any ring, lower that send at once and fix the placement or the monitor’s angle — never raise the level to find the feedback point.' },
    ],
  },
  two: {
    A: { zone: 'du.hand', mic: 'vocDynCard' },
    B: { zone: 'du.hand2', mic: 'vocDynCard' },
    names: { A: 'HIGHER SINGER’S MIC', B: 'LOWER SINGER’S MIC' },
    looking: 'Two mics · A the higher singer’s handheld, B the lower singer’s',
    prompt: 'Flip B POLARITY both ways, then move a mic. Then change SOURCE: each singer reaches their own mic first and the other one later.',
    label: 'The duet, each singer with a handheld: A the higher voice’s, B the lower voice’s',
    warn: 'This simplified graph shows one point source and straight paths, no room. Real voices move and turn: mute-check each mic, then the sum in stereo and in mono.',
    learn: [
      'Each singer reaches their own mic first and the other’s later and quieter. The relevant distance is the difference in paths from that singer to each mic — 1 m is about 2.9 ms.',
      'Spaced 3:1 or more, the other voice’s copy is quiet and the comb shallow. When close spacing is unavoidable: fewer mics, mics closer to the singers, directional patterns — and check mono.',
    ],
  },
  practice: {
    orderNote: 'A live duet as a sequence: put the steps in order. A step tapped too early is answered with why it cannot come yet.',
    gainId: 'du.prac.gain',
    secondId: 'du.prac.3',
    mixIds: ['du.nom', 'du.31why', 'du.ring'],
    mixIntro: 'Three cards from earlier pages, mixed: open mics and the margin, what 3:1 does, and the first ring.',
    sheetNote: 'For real singers, with their agreement. Write tendencies in words — what you heard, not a promised result.',
  },
  words: {
    placeBadge: 'Blue = suggested starting points · grey dashes = the singers’ space · pinch to zoom',
    clearance: 'Clearance comes first: the singers’ faces, hands and feet as they move; the stand’s boom runs away from them.',
    cardioidTried: 'What you just saw: a cardioid rejects most directly behind it. A handheld aimed level at a mouth has its back toward the wedge — but the wedge is low, so tilt or a tighter pattern decides how much it hears.',
    sourceNote: 'What you just saw: a voice reaches two mics at different times. Summed, the late copy cancels where it is half a period late: comb-filter notches. Polarity flips the sign — it moves the notches; it does not remove the delay. Change the SOURCE: each singer gives their own delay.',
  },
});

export const E04_ART: LessonArt = { ...BASE, pages: makeEnsemblePages(SPEC), stepCounts: ENSEMBLE_STEP_COUNTS };
