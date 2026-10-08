/**
 * F07 WILDLIFE AND DISTANT SOURCES — the lesson's own pages (the field
 * family's steps, lessons/shared/field):
 *
 *   sound       THE TARGET AND ITS SURROUNDINGS (MEET IT's second half): the
 *               observation point moved toward the bird — never past its
 *               setback ring — and away from the brook behind: the balance
 *               changes by position, not by a mic; then checks
 *   setting     BEFORE ANY MIC: the target, identification honesty, the
 *               place; the safety cards (wildlife, lightning, water, paths,
 *               hearing)
 *   microphone  THE DISH: cut through its axis against the wavelength
 *               ("little help below about c / D"), then aimed — the beam per
 *               pitch band (illustrative); what each system can and cannot
 *               do; checks
 *   context     WIND, LIVE AND SCIENCE: the layers at a forest and in the
 *               open; live coverage and monitoring; checks
 *   twoMic      A MOVING FLOCK: the flock scrubbed across the field with a
 *               fixed shotgun, a re-aimed shotgun or a wide omni; the
 *               focused channel and the habitat channel; checks
 * FULLY SILENT; nothing moves by itself.
 */
import { useCallback } from 'react';
import type { Vec3 } from '../../engine/model/types.ts';
import { PageSteps, type MikingStep } from '../../engine/steps';
import { Card, Point } from '../../engine/kit';
import type { PageProps } from '../../pages/pageTypes';
import { SiteArt, SiteFlock } from '../shared/field/SiteArt';
import { useBalanceStep, useDishAimStep, useDishStep, usePathStep, useWindStep, type PathMicOption } from '../shared/field/fieldSteps';
import { fieldCheckStep, makeFieldBefore, readStep } from '../shared/field/fieldPages';
import { EDGE_BIRD } from '../shared/field/sites.ts';
import { SETBACK } from '../shared/field/safety.ts';
import { BIRD_P, F07_SITE, FLOCK_P, FLOCK_PATH, FLOCK_SPEED_MS, WL_H } from './geometry.ts';

function EdgeBg() {
  return <SiteArt site={F07_SITE.bird} view="top" />;
}
function MeadowBg() {
  return <SiteArt site={F07_SITE.flock} view="top" hide={['flock']} />;
}
const FlockToken = (p: { x: number; z: number; heading: number }) => <SiteFlock f={{ kind: 'flock', c: [p.x, p.z], h: 6000, heading: p.heading }} view="top" />;

/** The observation point may come no nearer the bird than the ring's edge, less half a metre. */
const RING_EDGE_X = EDGE_BIRD.c[0] - SETBACK.most.mm - 500;
const BROOK: Vec3 = { x: -7900, y: 0, z: 0 };

function F07Sound({ lesson, answers, onAnswered }: PageProps) {
  const balance = useBalanceStep({
    words: {
      title: 'The target and its surroundings',
      badge: 'Each source as a point, free field · the change since the start, from the drawn distances · a simplified picture',
      looking: 'A woodland edge from above · the setback ring in red',
      prompt: 'Move LISTEN AT toward the bird — it stops at the ring — and back toward the brook. Watch SINCE THE START.',
      mainKey: 'BIRD',
      otherKey: 'BROOK',
      mainWord: 'bird',
      otherWord: 'brook',
      note: 'The bird is 26 m away and its ring keeps you more than 23 m off. A few metres toward it — and away from the brook behind you — help the call against the water. No mic, dish or gain makes that distance disappear.',
      after: 'Up to the ring the call gains a little and the brook falls away; back toward the brook the balance tips the other way. The quietest permitted position helps more than any gain — and the ring is never crossed for a cleaner take.',
    },
    box: { x0: -10000, x1: 30000, z0: -15000, z1: 15000 },
    x: { min: -2000, max: RING_EDGE_X, start: 0 },
    h: WL_H,
    main: () => BIRD_P,
    others: [BROOK],
    Background: EdgeBg,
    a11y: (x) => `Plan of the woodland edge. The observation point ${Math.abs(x / 1000).toFixed(1)} metres ${x >= 0 ? 'toward' : 'back from'} the bird from where it started, outside the setback ring.`,
    prediction: lesson.predictions.sound,
  });
  const steps: MikingStep[] = [
    balance,
    fieldCheckStep(
      lesson,
      'sound',
      answers,
      onAnswered,
      <Card>
        <Point title="ONE CALLER, A GROUP, OR A LOW CALL">A single bird in a canopy, a flock crossing a field and a low call far away ask for different pickups — decide which before choosing a mic.</Point>
        <Point title="NAME WHAT YOU HEARD HONESTLY">Write an identification as confirmed, provisional or unknown, from the evidence you have: a sound alone does not always say which animal made it.</Point>
      </Card>,
    ),
  ];
  return <PageSteps steps={steps} />;
}

const F07Before = makeFieldBefore({
  points: [
    { title: 'THE TARGET AND WHAT ELSE IS THERE', text: 'The target, its direction and movement, the competing sounds — water, a road, your own clothes — the wind, and the safe, permitted places you can work from.' },
    { title: 'TIME AND PLACE BEFORE GAIN', text: 'Choose the time and the position before adding any gain: a quieter spot away from water or a road helps the call more than the recorder can.' },
    { title: 'LET ANIMALS BEHAVE NATURALLY', text: 'Aim from a permitted point, away from nests and sensitive habitat. No recorded calls, no lures, no attractants — and never a step backward onto a trail while aiming.' },
    { title: 'THE PURPOSE', text: 'An isolated sound for a library, a record of natural behaviour, a wider habitat recording, a live feed or a structured survey: each asks for something different.' },
  ],
  safety: ['wildlife', 'lightning', 'water', 'traffic', 'hearing'],
});

function F07Microphone({ lesson, answers, onAnswered, onInteractive, interactiveDone }: PageProps) {
  const done = useCallback(() => {
    if (!interactiveDone.has('dishTried')) onInteractive('dishTried');
  }, [interactiveDone, onInteractive]);
  const dish = useDishStep({
    words: {
      title: 'The dish and the wavelength',
      badge: 'A dish cut through its axis, drawn to its own equation · wavefronts at the true wavelength · a simplified picture',
      looking: 'A parabolic dish, its capsule at the focus',
      prompt: 'Move PITCH below and above the dish’s line, and change DISH.',
      after: 'Where the wavelength is shorter than the dish, the bowl gathers the sound to the focus; where it is longer, the dish gives little help and the capsule hears the sound directly. A bigger dish lowers that line — it belongs to each dish.',
    },
    onTried: done,
    prediction: lesson.predictions.microphone,
  });
  const aim = useDishAimStep({
    words: {
      title: 'Aiming the dish',
      badge: 'The beam per pitch band, drawn narrower as the pitch rises · not to scale · an illustrative picture, never a number',
      looking: 'A 57 cm dish aimed at one bird',
      prompt: 'Bring AIM onto the bird, then swing it off. Which band goes first?',
      after: 'The high band is narrowest: a small aim error loses it first. The low band gets little help whatever the aim. Sweep slowly on headphones to find the best aim, and hold it through a phrase.',
      target: 'bird',
    },
  });
  const steps: MikingStep[] = [
    dish,
    aim,
    readStep('systems', 'What each one can and cannot do', [
      { title: 'A SHOTGUN', text: 'Its axis on the target, in a windscreen and suspension: compact and easier to follow a moving bird or group. It reduces some off-axis sound, especially in the upper pitches — it does not amplify the target or remove what lies on its axis, and off its axis the tone changes.' },
      { title: 'A PARABOLIC DISH', text: 'The capsule at the focus, facing the dish, as its maker specifies — never moved to another product’s focus. It concentrates the mid and high pitches of a localized call at a fixed direction; it is harder to follow fast movement or several callers. That gain is acoustic concentration at the focus, not electrical gain.' },
      { title: 'AN OMNI OR A CARDIOID', text: 'When the target and its surroundings both matter, or a group spans more than a narrow beam: less isolation, a broader context, steadier coverage of moving animals.' },
      { title: 'A FIXED AUTONOMOUS RECORDER', text: 'Left in place — with permission, site approval and a plan — it documents activity over time rather than chasing one target. What it detects depends on its mic, the weather and the background, not only on its hours.' },
    ]),
    fieldCheckStep(lesson, 'microphone', answers, onAnswered),
  ];
  return <PageSteps steps={steps} />;
}

function F07Context({ lesson, answers, onAnswered, onInteractive, interactiveDone, variant }: PageProps) {
  const done = useCallback(() => {
    if (!interactiveDone.has('windTried')) onInteractive('windTried');
  }, [interactiveDone, onInteractive]);
  const wind = useWindStep({
    exposures: ['forest', 'open'],
    start: variant === 'bird' ? 'forest' : 'open',
    words: {
      title: 'Wind, noise and levels',
      badge: 'The layers drawn as real objects · the curls at the capsule are a cue, not a level',
      looking: 'A shotgun and its wind protection',
      prompt: 'Add the layers with COVER at the forest, then on open grassland.',
      after: 'Foam can do in a sheltered forest; open grassland needs fur, a basket and its suspension. A dish is a large surface in the wind too — and a low-cut filter can take a real low call with the rumble: note its state.',
    },
    onTried: done,
    prediction: lesson.predictions.context,
  });
  const steps: MikingStep[] = [
    wind,
    readStep('aims', 'Studio, live and science', [
      { title: 'LEVELS', text: 'Listen for the strongest likely call and leave headroom; raising the gain also raises the mic’s own noise and the place’s. A plane or a gust in the beam still spoils a take.' },
      { title: 'FILM OR LIBRARY', text: 'Keep the raw targeted take, log the species or its uncertainty and the place, and record a separate wide habitat bed if it is needed. Label any processed version and keep the original.' },
      { title: 'LIVE COVERAGE', text: 'Mount securely in an approved place, protect it from the weather, route it only to the feeds that need it and check any PA path for feedback. A moving narrow beam makes level jumps; a shotgun or a wider mic may serve an audience more steadily.' },
      { title: 'MONITORING', text: 'A tracked target and a fixed recorder answer different questions. For comparisons between sites or seasons, keep the mic, its settings, orientation, place, dates, schedule and weather notes the same. One clear call proves an event — not how many animals there are, or where there are none.' },
    ]),
    fieldCheckStep(lesson, 'context', answers, onAnswered),
  ];
  return <PageSteps steps={steps} />;
}

const OBS: Vec3 = { x: 0, y: -WL_H, z: 0 };
const FLOCK_MICS: PathMicOption[] = [
  { id: 'fixed', label: 'A shotgun held on one spot', short: 'FIXED', typeId: 'shotgunShort', pattern: 'supercardioid', pose: { p: OBS, az: 180, el: 0 }, blurb: 'Aimed at the middle of the flight line and held: the flock crosses its axis and leaves it.' },
  { id: 'track', label: 'A shotgun re-aimed smoothly', short: 'FOLLOWED', typeId: 'shotgunShort', pattern: 'supercardioid', pose: { p: OBS, az: 180, el: 0 }, tracked: true, blurb: 'Feet planted, the axis kept on the flock: steadier presence, a smooth swing.' },
  { id: 'wide', label: 'A wide omni', short: 'OMNI', typeId: 'arrOmni', pattern: 'omni', pose: { p: OBS, az: 180, el: 0 }, blurb: 'Steady coverage of the whole flight: the level follows distance alone, with the field around it.' },
];

function F07TwoMic({ lesson, answers, onAnswered, onInteractive, interactiveDone }: PageProps) {
  const done = useCallback(() => {
    if (!interactiveDone.has('flockScrubbed')) onInteractive('flockScrubbed');
  }, [interactiveDone, onInteractive]);
  const flock = usePathStep({
    words: {
      title: 'A moving flock',
      badge: `Straight flight line, free field, a flock in flight about ${FLOCK_SPEED_MS} m/s · the shotgun drawn as its supercardioid base · a simplified picture`,
      looking: 'Open grassland, the flock crossing',
      prompt: 'Drag SOURCE to move the flock across the field. Compare the FIXED shotgun with the FOLLOWED one and the OMNI.',
      after: 'Held on one spot, the shotgun loses the flock as it leaves the axis; followed smoothly, it keeps it; the omni gives the whole flight with the field around it. Mark where the flock crosses the edge of the useful angle.',
      start: 'FROM THE LEFT',
      end: 'TO THE RIGHT',
    },
    path: FLOCK_PATH,
    mics: FLOCK_MICS,
    box: { x0: -4000, x1: 36000, z0: -29000, z1: 29000 },
    orient: 'frontUp',
    Background: MeadowBg,
    Token: FlockToken,
    endLabelDx: -4000,
    prediction: lesson.predictions.twoMic,
    onScrubbed: done,
  });
  const steps: MikingStep[] = [
    flock,
    readStep('channels', 'Two channels, two jobs', [
      { title: 'FOCUSED AND HABITAT', text: 'A shotgun or a dish on the target and a separate wide mic for the habitat are two signal paths: label each, and keep the raw focused take.' },
      { title: 'A STEREO DISH IS STILL TWO PATHS', text: 'Some dish systems add a wider stereo pickup; the focused part and the stereo ambience are different paths whose format and mono behaviour need writing down.' },
      { title: 'WHEN THE TARGET LEAVES THE BEAM', text: 'Do not chase it with gain without checking what is now on the axis. Pause, or move to another permitted point.' },
    ]),
    fieldCheckStep(lesson, 'twoMic', answers, onAnswered),
  ];
  return <PageSteps steps={steps} />;
}

export const F07_PAGES = { sound: F07Sound, setting: F07Before, microphone: F07Microphone, context: F07Context, twoMic: F07TwoMic };
export const F07_STEP_COUNTS = { sound: 2, setting: 1, microphone: 4, context: 3, twoMic: 3 };

export const F07_FLOCK_P = FLOCK_P;
