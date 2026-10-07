/**
 * E16 JAZZ BIG BAND — the look and the pages: the shared ensemble stage with
 * the rows and the studio horseshoe, Lab 5's own MEET IT, STARTING SETUPS and
 * Placement Studio, and the shared pages in the band's words. Its practice
 * page carries the shared Lab 5 worksheet. Suggested starting points; FULLY
 * SILENT.
 */
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import { Body, Card, Point } from '../../engine/kit';
import { ensembleLessonArt } from '../shared/ensemble/ensembleArt';
import { ENSEMBLE_STEP_COUNTS, makeEnsemblePages } from '../shared/ensemble/ensemblePages';
import { ARRAY_CARDS, ensembleHandSpec } from '../shared/ensemble/ensembleSpec';
import { BB_A1, E16_MODEL, E16_SEATS } from './geometry.ts';

const BASE = ensembleLessonArt({ rows: E16_SEATS.rows, horseshoe: E16_SEATS.horseshoe });

const BAND_CARDS = (
  <>
    <Card>
      <Point title="A CARDIOID CONDENSER">Section detail, quieter reeds, the piano and a main stereo view. Check its noise, its peak handling, its off-axis sound and the brass spilling into it.</Point>
      <Point title="A MOVING-COIL DYNAMIC">Close horns and amps, with manageable stage hardware. “Dynamic” alone does not promise better isolation — the pattern and the distance do.</Point>
      <Point title="A FIGURE-8 RIBBON">A tonal choice for horns, its sides turned toward an unwanted source. Its back hears too. Check its wind tolerance, its mounting and the preamp gain — and its own manual on power.</Point>
      <Point title="AN INSTRUMENT MINIATURE">A fixed relationship when a soloist stands or moves, and less stand clutter: an approved clip, clearance, strain relief, the pattern and the input’s headroom.</Point>
      <Point title="AN OMNI OR WIDE PATTERN">A more inclusive room or section view in controlled conditions; broad pickup can limit the PA’s gain and bring in the next section.</Point>
    </Card>
    <Body>Check the loudest trumpet and trombone attacks with the chosen mic and preamp. A mic’s output sensitivity alone does not decide gain before feedback: pattern, distance, open channels and the loudspeakers do.</Body>
    {ARRAY_CARDS}
  </>
);

const SPEC = ensembleHandSpec({
  art: BASE,
  model: E16_MODEL,
  title: 'BIG BAND',
  firstZone: 'bb.main',
  firstMic: 'arrCard',
  mic: {
    intro: 'Choose by the job, then verify: a type is a starting point, not a promise. For the main view, matched cardioids (X/Y, the 17 cm pair) or spaced omnis; for the horns, condensers, dynamics or figure-8 ribbons; for a moving soloist, an approved instrument mount.',
    mountLine: () => 'Mount: a stand with a stable base, clear of slides at full extension, mute changes, standing soloists and the walkways; on a riser only where it sits steady; anything above the band is the venue’s rigging',
    extra: BAND_CARDS,
  },
  ctx: {
    pose: BB_A1.pose,
    mic: 'saxDynSuper',
    plan: { u0: -1600, u1: 1800, v0: -1600, v1: 1600 },
    side: { u0: -1600, u1: 1800, v0: -2000, v1: 300 },
    creditWedge: 'mon',
    looking: 'From above · the lead alto’s mic and a floor wedge',
    prompt: 'The floor wedge stays in front of the saxes, facing them. Turn the alto mic (AIM) or change its PATTERN until the wedge sits in its rejection — a supercardioid’s is off its rear, not straight behind.',
    label: 'the sax row with a close mic on the lead alto and a floor wedge in front,',
    learn: [
      { title: 'LIVE SOUND', text: 'Start from the band in the room: in a good room the brass and drums may need little help, while the bass, piano, vocals and soft solos need support. Work closer where needed; attenuate unneeded mics; wedges in each mic’s real rejection.' },
      { title: 'A RECORDING', text: 'A room-led sound starts from the main pair or a section view; more control means each horn mic placed and checked in the planned seating, with individual tracks kept where the project needs them.' },
      { title: 'BOTH AT ONCE', text: 'The house and remote listeners need different balances: a room or ensemble pair on its own recording or stream route, close sources for the PA, and a plan for which channels feed what.' },
    ],
  },
  two: {
    A: { zone: 'bb.main', mic: 'arrCard' },
    B: { zone: 'bb.sax', mic: 'saxDynSuper' },
    names: { A: 'MAIN PAIR', B: 'ALTO MIC' },
    looking: 'Two mics · A the main pair’s centre, B the lead alto’s mic',
    prompt: 'Flip B POLARITY both ways, then move a mic. Then change SOURCE: each player reaches the two mics at its own times.',
    label: 'The big band with the main pair (A) and the lead alto’s mic (B)',
    warn: 'This simplified graph shows one point source and straight paths, no room. Real players move and the room adds its own arrivals, so one delay never suits them all — judge by ear, in mono, against the plain version.',
    learn: [
      'The relevant distance is the difference in paths from the player to each mic. 1 m of path difference is about 2.9 ms.',
      'Hear each added mic alone, with its section, and with the main view in stereo and mono. Lower or move a support before assuming polarity or a delay solves the difference.',
    ],
  },
  practice: {
    orderNote: 'A big-band comparison, as a sequence: put the steps in order. A step tapped too early is answered with why it cannot come yet.',
    gainId: 'bb.prac.gain',
    secondId: 'bb.prac.3',
    mixIds: ['bb.need', 'bb.hole', 'bb.ms'],
    mixIntro: 'Three cards from earlier pages, mixed: what earns a support, a spaced pair spread too wide, and an M/S pair in mono.',
    sheetNote: 'For a real band, with the bandleader’s, the players’ and the venue’s agreement. Two positions on the same rows: write tendencies in words — what you heard, not a promised result.',
  },
  words: {
    placeBadge: 'Blue = recommended starting points · grey dashes = the players’ space · pinch to zoom',
    clearance: 'Clearance comes first: slides at full extension, mute changes, standing soloists, chairs and pedals, and the band’s way in and out.',
    cardioidTried: 'What you just saw: a cardioid rejects most directly behind it. A close mic aimed at the alto turns its rear toward the floor in front — where a wedge can sit in its rejection.',
    sourceNote: 'What you just saw: sound reaches the two mics at different times. Summed, the delayed copy cancels where it is half a period late: comb-filter notches. Polarity flips the sign — it moves the notches; it does not remove the delay. Change the SOURCE: each player gives its own delay.',
  },
});

export const E16_ART: LessonArt = { ...BASE, pages: makeEnsemblePages(SPEC), stepCounts: ENSEMBLE_STEP_COUNTS };
