/**
 * E09 RHYTHM SECTIONS AND COMPLETE BANDS — the look and the pages: the
 * shared ensemble stage drawn as a stage plot (a band on a stage, the band
 * in one room), Lab 5's own MEET IT, STARTING SETUPS (with the derived
 * stage-plot readouts) and Placement Studio for the drum pair, and the
 * shared pages in the band's words. Suggested starting points; FULLY SILENT.
 */
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import { Body, Card, Point } from '../../engine/kit';
import { ensembleLessonArt } from '../shared/ensemble/ensembleArt';
import { ENSEMBLE_STEP_COUNTS, makeEnsemblePages } from '../shared/ensemble/ensemblePages';
import { ensembleHandSpec, STAGE_PLOT_AXES } from '../shared/ensemble/ensembleSpec';
import { aimOf } from '../shared/ensemble/frameS.ts';
import { E09_MODEL, E09_SEATS, SINGER_V, VOCAL_MIC } from './geometry.ts';

const BASE = ensembleLessonArt({ stage: E09_SEATS.stage, room: E09_SEATS.room });
const L = SINGER_V.lip;

const BAND_CARDS = (
  <>
    <Card>
      <Point title="CLOSE DYNAMICS">On the loud sources and the voice: directional, robust and happy at high levels. Close, they hear their own source well ahead of the stage — the most gain before feedback.</Point>
      <Point title="THE VOCAL MIC’S PATTERN">A cardioid rejects most straight behind; a supercardioid and a hypercardioid reject most off their backs, with a little pickup directly behind. Choose with the wedges in mind.</Point>
      <Point title="A DI IS NOT A MIC">A line output or DI box carries bass or keys as a clean electrical signal: no spill, no feedback path — and no cabinet or room either.</Point>
      <Point title="THE DRUM PAIR">Two small condensers over the kit (or a low pair in front of it in a good room) hear the kit as one picture; close mics add focus only where it is missing.</Point>
    </Card>
    <Body>Choose by the job each mic does on this stage: its source, its pattern against the monitors, and how many mics are open. No mic is best everywhere.</Body>
  </>
);

const SPEC = ensembleHandSpec({
  art: BASE,
  model: E09_MODEL,
  title: 'BAND',
  firstZone: 'bd.voc',
  firstMic: 'vocDynSuper',
  axes: STAGE_PLOT_AXES,
  aimWords: { az: 'Swing the front left or right (seen from above).', el: 'Tilt the front up or down (seen from the front).' },
  mic: {
    intro: 'A transducer category alone does not decide tone, spill or headroom: read the real mic’s specifications. On a band stage: directional dynamics close to the loud sources and the voice, small condensers for the drum pair, and a DI where a line output will do. Condensers need phantom power; every stand needs a stable base.',
    mountLine: () => 'Mount: a boom stand with a stable base, clear of the players, their pedals and the walkways; cables dressed flat and serviceable',
    extra: BAND_CARDS,
  },
  ctx: {
    pose: { p: VOCAL_MIC.p, ...aimOf(VOCAL_MIC.aim) },
    mic: 'vocDynSuper',
    plan: { u0: L.x - 1400, u1: L.x + 1400, v0: L.z - 1000, v1: L.z + 1900 },
    side: { u0: L.x - 1400, u1: L.x + 1400, v0: -2100, v1: 200 },
    creditWedge: 'vox',
    looking: 'From above · the vocal mic and the singer’s wedge',
    prompt: 'The wedge stays on the floor in front of the singer, facing back at them. Turn the vocal mic (AIM) or change its PATTERN until the wedge sits in its rejection — and keep its front on the singer’s mouth.',
    label: 'the singer with a supercardioid vocal mic and a floor wedge in front,',
    learn: [
      { title: 'LIVE', text: 'Start with the fewest channels that give a clear, stable mix. Close directional mics on the loud sources; wedges at each mic’s real null; the stage mix set first, then a stable margin before feedback — never mixing on the edge of ringing.' },
      { title: 'A RECORDING', text: 'Choose between playing together with controlled bleed and an isolation-heavy production — or a hybrid. Bleed is not automatically an error; judge it in the complete mix.' },
      { title: 'BOTH AT ONCE', text: 'Split the mics through a proper splitter, its phantom power and grounding checked with its maker. Give every mic a role: PA, wedges, recording. Room and audience mics go to the recording, never the wedges.' },
    ],
  },
  two: {
    A: { zone: 'bd.voc', mic: 'vocDynSuper' },
    B: { zone: 'bd.kick', mic: 'kickDynCard' },
    names: { A: 'VOCAL MIC', B: 'KICK MIC' },
    looking: 'Two mics · A the vocal mic, B the kick mic',
    prompt: 'Flip B POLARITY both ways, then move a mic. Then change SOURCE: the singer and the kit each reach the two mics at their own times.',
    label: 'The band with the vocal mic (A) and the kick mic (B)',
    warn: 'This simplified graph shows one point source and straight paths, no room. A band is many large sources at once, so one delay never suits them all — judge by ear, in the complete mix, in mono.',
    learn: [
      'The relevant distance is the difference in paths from a source to each mic — not the distance between the mics. 1 m of path difference is about 2.9 ms.',
      'Bleed is the late copy of one source in another mic. Change the distance, the aim or the overlap first; reverse polarity only when it sounds more coherent; do not time-align every mic by habit.',
    ],
  },
  practice: {
    orderNote: 'A band’s mic plan, as a sequence: put the steps in order. A step tapped too early is answered with why it cannot come yet.',
    gainId: 'bd.prac.gain',
    secondId: 'bd.prac.3',
    mixIds: ['bd.prac.4', 'bd.prac.5'],
    mixIntro: 'Two cards from earlier pages, mixed: the over-and-beside drum method, and ringing at the loudest passage.',
    sheetNote: 'For a real band, with the players’ and the venue’s agreement. Write tendencies in words — what you heard, not a promised result.',
  },
  words: {
    placeBadge: 'Blue = suggested starting points · grey dashes = the players’ space · pinch to zoom',
    clearance: 'Clearance comes first: the players, their pedals and the sticks’ reach, hot amps and their ventilation, cables and walkways.',
    cardioidTried: 'What you just saw: a cardioid rejects most directly behind it. A vocal mic aimed level at the mouth turns its back toward the audience — the wedge, on the floor in front, sits low behind it.',
    sourceNote: 'What you just saw: a source reaches the two mics at different times. Summed, the late copy cancels where it is half a period late: comb-filter notches. Polarity flips the sign — it moves the notches; it does not remove the delay. Change the SOURCE: the kit and the singer each give their own delay.',
  },
});

export const E09_ART: LessonArt = { ...BASE, pages: makeEnsemblePages(SPEC), stepCounts: ENSEMBLE_STEP_COUNTS };
