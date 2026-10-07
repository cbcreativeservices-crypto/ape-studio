/**
 * E12 PERCUSSION ENSEMBLES — the look and the pages: the shared ensemble
 * stage with three stations and two rows, Lab 5's own MEET IT, STARTING
 * SETUPS and Placement Studio, and the shared pages in the group's words.
 * Suggested starting points; FULLY SILENT.
 */
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import { Body, Card, Point } from '../../engine/kit';
import { ensembleLessonArt } from '../shared/ensemble/ensembleArt';
import { ENSEMBLE_STEP_COUNTS, makeEnsemblePages } from '../shared/ensemble/ensemblePages';
import { ARRAY_CARDS, ensembleHandSpec } from '../shared/ensemble/ensembleSpec';
import { E12_MODEL, E12_SEATS, TR_CG } from './geometry.ts';

const BASE = ensembleLessonArt({ trio: E12_SEATS.trio, large: E12_SEATS.large });

const PERC_CARDS = (
  <>
    <Card>
      <Point title="ONE MAIN MIC">Mono documentation, or a compact group that already balances: every essential instrument must stay audible.</Point>
      <Point title="A COMPACT DYNAMIC OVER THE DRUMS">One mic between two hand drums, just above the heads, aimed down: both drums on one channel, every stroke, a robust choice for a loud stage.</Point>
      <Point title="SMALL CONDENSERS OVER THE BARS">One a few centimetres over the bars favours the notes nearest it; a pair higher up, spaced or angled, evens the range.</Point>
      <Point title="AREA MICS">Shared by the stations a player moves between: check the coverage through every change and the overlap between areas.</Point>
    </Card>
    <Body>Check each device’s overload on the strongest accent: the mic, any adapter or transmitter, the preamp and the converter. Sensitivity is output, not rejection — the pattern, distance and aim decide the spill.</Body>
    {ARRAY_CARDS}
  </>
);

const SPEC = ensembleHandSpec({
  art: BASE,
  model: E12_MODEL,
  title: 'PERCUSSION',
  firstZone: 'pc.main',
  firstMic: 'arrCard',
  mic: {
    intro: 'Choose the arrangement around the musical balance and the level the audience needs: one main mic, a main pair, area mics, close supports — or a combination. Follow each device’s own specifications; dynamics and condensers do not all overload the same way.',
    mountLine: () => 'Mount: suitably rated stands with stable bases, clear of the players’ paths, pedals, sticks and instrument changes; overhead hardware out of reach; nothing touching a bar or blocking a resonator',
    extra: PERC_CARDS,
  },
  ctx: {
    pose: TR_CG.spot.pose,
    mic: 'hdDynCard',
    plan: { u0: -2800, u1: -200, v0: -2000, v1: 1000 },
    side: { u0: -800, u1: 2400, v0: -1800, v1: 300 },
    creditWedge: 'mon',
    looking: 'From above · the conga mic and a floor wedge',
    prompt: 'The floor wedge stays in front of the congas, facing the player. Turn the conga mic (AIM) or change its PATTERN until the wedge sits in its rejection — and keep its front on the heads.',
    label: 'the stations with a dynamic over the congas and a floor wedge in front,',
    learn: [
      { title: 'LIVE SOUND', text: 'Find what already reaches the audience; reinforce missing detail or balance. On a quiet stage main or area mics may do; with loud monitors or a band, closer directional pickup. Lower the gain at once if ringing starts.' },
      { title: 'A RECORDING', text: 'In a quiet room the main array may give the whole sound; spots from silence until a line is intelligible; room mics only when their decay helps. A dry, separately processed sound is a production goal to state first.' },
      { title: 'BOTH AT ONCE', text: 'Label each mic by the station or area it serves, with its routing; clear mute or scene instructions that keep the piece’s tails and overlaps.' },
    ],
  },
  two: {
    A: { zone: 'pc.main', mic: 'arrCard' },
    B: { zone: 'pc.conga', mic: 'hdDynCard' },
    names: { A: 'MAIN PAIR', B: 'CONGA MIC' },
    looking: 'Two mics · A the main pair’s centre, B the conga mic',
    prompt: 'Flip B POLARITY both ways, then move a mic. Then change SOURCE: each instrument reaches the two mics at its own times.',
    label: 'The stations with the main pair (A) and a conga mic (B)',
    warn: 'This simplified graph shows one point source and straight paths, no room. Every instrument and reflection has its own path difference, so one delay never suits them all — judge by ear, in mono, against the plain version.',
    learn: [
      'At 343 m/s, 1 m of path difference is about 2.9 ms (1 ÷ 343 s) — an illustrative estimate, not a delay setting.',
      'Compare the main pickup alone, each support and the combination. Change position, angle or support level first; polarity inversion changes the sign, not arbitrary arrival times.',
    ],
  },
  practice: {
    orderNote: 'A percussion setup, as a sequence: put the steps in order. A step tapped too early is answered with why it cannot come yet.',
    gainId: 'pe.prac.gain',
    secondId: 'pe.prac.3',
    mixIds: ['pe.need', 'pe.hole', 'pe.mix.1'],
    mixIntro: 'Three cards mixed from earlier pages: what earns a support, a spaced pair spread too wide, and what a more sensitive mic does and does not change.',
    sheetNote: 'For a real group, with the players’ and the venue’s agreement. Write tendencies in words — what you heard, not a promised result.',
  },
  words: {
    placeBadge: 'Blue = recommended starting points · grey dashes = the players’ space · pinch to zoom',
    clearance: 'Clearance comes first: the players’ paths, sticks and mallets, pedals and instrument changes; nothing on a bar or over a resonator opening.',
    cardioidTried: 'What you just saw: a cardioid rejects most directly behind it. A mic aimed down at the heads turns its back up and away — where a wedge can sit in its rejection.',
    sourceNote: 'What you just saw: sound reaches the two mics at different times. Summed, the delayed copy cancels where it is half a period late: comb-filter notches. Polarity flips the sign — it moves the notches; it does not remove the delay. Change the SOURCE: each instrument gives its own delay.',
  },
});

export const E12_ART: LessonArt = { ...BASE, pages: makeEnsemblePages(SPEC), stepCounts: ENSEMBLE_STEP_COUNTS };
