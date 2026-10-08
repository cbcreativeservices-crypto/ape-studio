/**
 * E10 HORN SECTIONS — the look and the pages: the shared ensemble stage with
 * a horn line and a studio arc, Lab 5's own MEET IT, STARTING SETUPS and
 * Placement Studio, and the shared pages in the section's words. Suggested
 * starting points; FULLY SILENT.
 */
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import { Body, Card, Point } from '../../engine/kit';
import { ensembleLessonArt } from '../shared/ensemble/ensembleArt';
import { ENSEMBLE_STEP_COUNTS, makeEnsemblePages } from '../shared/ensemble/ensemblePages';
import { ARRAY_CARDS, ensembleHandSpec } from '../shared/ensemble/ensembleSpec';
import { E10_MODEL, E10_SEATS, LN_TPT } from './geometry.ts';

const BASE = ensembleLessonArt({ line: E10_SEATS.line, arc: E10_SEATS.arc });

const SECTION_CARDS = (
  <>
    <Card>
      <Point title="A CLOSE DYNAMIC">High level handled well and a predictable rejection: a rugged stage choice. Aimed straight into a bell it can sound narrow or aggressive — angle it a little off.</Point>
      <Point title="A CONDENSER AT A DISTANCE">Detail and a natural section image where the stage level and the feedback margin allow. Needs phantom power; check its peak handling on the loudest passage.</Point>
      <Point title="A CLIP-ON MIC">The distance stays steady as the player moves, with strong separation — and a close, smaller view, handling noise and a cable to secure.</Point>
      <Point title="A SUPERCARDIOID">Tighter at the front than a cardioid; its least-sensitive directions sit off its rear, with a small lobe straight behind — place wedges there, not dead behind.</Point>
    </Card>
    <Body>For the section view, a pair: matched cardioids together (X/Y), 17 cm apart at 110°, or spaced omnis.</Body>
    {ARRAY_CARDS}
  </>
);

const SPEC = ensembleHandSpec({
  art: BASE,
  model: E10_MODEL,
  title: 'HORN SECTION',
  firstZone: 'ln.tpt',
  firstMic: 'instDynCard',
  mic: {
    intro: 'A transducer type alone does not decide tone, spill or headroom: read the real mic’s specifications and check its peak handling against the loudest passage. Keep the mic families and the placement logic reasonably consistent across the section — without forcing identical positions on different instruments.',
    mountLine: () => 'Mount: a short boom stand with a stable base, clear of the slide at full extension, the bell’s travel, the hands and the feet; a clip only on the player’s instrument with their agreement, its cable secured',
    extra: SECTION_CARDS,
  },
  ctx: {
    pose: LN_TPT.pose,
    mic: 'instDynCard',
    plan: { u0: -2600, u1: 600, v0: -1400, v1: 2000 },
    side: { u0: -2600, u1: 600, v0: -2400, v1: 300 },
    creditWedge: 'mon',
    looking: 'From above · the trumpet’s close mic and a floor wedge',
    prompt: 'The floor wedge stays in front of the trumpet, facing the player. Turn the close mic (AIM) or change its PATTERN until the wedge sits in its rejection — and keep its front on the bell.',
    label: 'the horn line with a close dynamic on the trumpet and a floor wedge in front,',
    learn: [
      { title: 'LIVE SOUND', text: 'Enough level and clarity without changing the section’s own balance. Close cardioids or supercardioids, each wedge in its mic’s real rejection, only the monitor level the players need — and recheck when the bells move.' },
      { title: 'A RECORDING', text: 'The section in the arrangement it will perform. A minimal section view first; close mics for independent editing, treated as one system. A distant pair in a good room may be the most natural choice.' },
      { title: 'BOTH AT ONCE', text: 'Take the recording feed before the PA’s EQ and dynamics when an unprocessed feed is wanted. Keep audience and room mics out of the monitor sends; agree who controls gain and phantom power on a shared split.' },
    ],
  },
  two: {
    A: { zone: 'ln.main', mic: 'arrCard' },
    B: { zone: 'ln.tpt', mic: 'instDynCard' },
    names: { A: 'SECTION PAIR', B: 'TRUMPET MIC' },
    looking: 'Two mics · A the section pair’s centre, B the trumpet’s close mic',
    prompt: 'Flip B POLARITY both ways, then move a mic. Then change SOURCE: each player reaches the two mics at its own times.',
    label: 'The horn line with the section pair (A) and a close trumpet mic (B)',
    warn: 'This simplified graph shows one point source and straight paths, no room. Real players move and the room adds its own arrivals, so one delay never suits them all — judge by ear, in mono, against the plain version.',
    learn: [
      'The relevant distance is the difference in paths from the player to each mic — not the distance between the mics. 1 m of path difference is about 2.9 ms.',
      'Compare the pair alone, the close mic alone and both. Lower or move the close mic first; a polarity flip only tests one relationship, and the section is never time-aligned to the pair by reflex.',
    ],
  },
  practice: {
    orderNote: 'A section capture, as a sequence: put the steps in order. A step tapped too early is answered with why it cannot come yet.',
    gainId: 'hs.prac.gain',
    secondId: 'hs.prac.3',
    mixIds: ['hs.mix.1', 'hs.mix.2', 'hs.mix.3'],
    mixIntro: 'Three cards mixed from the section pair and the close mics: the near-coincident pair’s geometry, M/S in mono, and the expanded plan as one system.',
    sheetNote: 'For a real section, with the players’ and the venue’s agreement. Write tendencies in words — what you heard, not a promised result.',
  },
  words: {
    placeBadge: 'Blue = suggested starting points · grey dashes = the players’ space · pinch to zoom',
    clearance: 'Clearance comes first: every slide at full extension, the bells’ travel, hands, chairs and feet, and the players’ way in and out.',
    cardioidTried: 'What you just saw: a cardioid rejects most directly behind it. A close mic aimed back at the bell turns its rear toward the audience side — where a wedge can sit in its rejection.',
    sourceNote: 'What you just saw: sound reaches the two mics at different times. Summed, the delayed copy cancels where it is half a period late: comb-filter notches. Polarity flips the sign — it moves the notches; it does not remove the delay. Change the SOURCE: each player gives its own delay.',
  },
});

export const E10_ART: LessonArt = { ...BASE, pages: makeEnsemblePages(SPEC), stepCounts: ENSEMBLE_STEP_COUNTS };
