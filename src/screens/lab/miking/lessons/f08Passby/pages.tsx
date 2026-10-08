/**
 * F08 MOVING SOURCES AND PASS-BYS — the lesson's own pages (the field
 * family's steps, lessons/shared/field):
 *
 *   sound     A PASS, SCRUBBED (MEET IT's second half): the walker moved
 *             along the path with a finger — distance, angle, the level
 *             against the closest point and the ideal Doppler shift of a
 *             steady tone, per mic (fixed omni, cardioid, shotgun, tracked);
 *             the vehicle variant is the paper plan's numbers; then checks
 *   setting   BEFORE ANY MIC: the path drawn first, the safe mic zone, the
 *             operator's station; the safety cards
 *   context   FIXED OR TRACKED: a fixed pair lets the source cross the image,
 *             a tracked mono mic holds it; live and broadcast; checks
 *   twoMic    START AND END MICS: two perspectives, not stereo — their time
 *             difference as the source moves, and the comb if summed; checks
 * FULLY SILENT; nothing moves by itself — the learner's finger moves the source.
 */
import { useCallback } from 'react';
import { Group } from '@shopify/react-native-skia';
import { PageSteps, type MikingStep } from '../../engine/steps';
import { Card, Point } from '../../engine/kit';
import type { PageProps } from '../../pages/pageTypes';
import { SiteArt, SiteCar, SitePerson } from '../shared/field/SiteArt';
import { usePathStep, useImageStep, type PathMicOption } from '../shared/field/fieldSteps';
import { fieldCheckStep, makeFieldBefore, readStep } from '../shared/field/fieldPages';
import { VEHICLE_SPEED_MS, WALK_SPEED_MS } from '../shared/field/path.ts';
import { F08_SITE, PB_H, VEH_PATH, WALK_PATH } from './geometry.ts';
import { F08_START, TRACK_P } from './model.ts';

const vehicle = (v: string) => v === 'vehicle';
function RouteBg() {
  return <SiteArt site={F08_SITE.walk} view="top" hide={['person']} />;
}
function VehBg() {
  return <SiteArt site={F08_SITE.vehicle} view="top" hide={['car']} />;
}
/** The walker, drawn about 2.5 × life size so it reads on a 30 m plan (said once in the note). */
const Walker = (p: { x: number; z: number; heading: number }) => (
  <Group transform={[{ translateX: p.x }, { translateY: p.z }, { scale: 2.5 }, { translateX: -p.x }, { translateY: -p.z }]}>
    <SitePerson f={{ kind: 'person', c: [p.x, p.z], heading: p.heading, role: 'walker' }} view="top" />
  </Group>
);
const Car = (p: { x: number; z: number; heading: number }) => <SiteCar c={[p.x, p.z]} heading={p.heading} view="top" />;

const fixed = (p = F08_START.walk) => ({ p, az: 180, el: 0 });
const WALK_MICS: PathMicOption[] = [
  { id: 'omni', label: 'Fixed omni', short: 'OMNI', typeId: 'arrOmni', pattern: 'omni', pose: fixed(), blurb: 'A broad, steady pickup: the level follows distance alone.' },
  { id: 'card', label: 'Fixed cardioid, aimed at the crossing', short: 'CARDIOID', typeId: 'arrCard', pattern: 'cardioid', pose: fixed(), blurb: 'It leans toward the crossing: the ends of the pass fall a little further off its axis.' },
  { id: 'shotgun', label: 'Fixed shotgun, aimed at the crossing', short: 'SHOTGUN', typeId: 'shotgunShort', pattern: 'supercardioid', pose: fixed(), blurb: 'Narrow: the pass can seem to vanish once the walker leaves its axis (drawn here as its supercardioid base — a shotgun is narrower still in the highs).' },
  { id: 'track', label: 'Tracked shotgun, swung from a fixed station', short: 'TRACKED', typeId: 'shotgunPole', pattern: 'supercardioid', pose: { p: TRACK_P, az: 180, el: 0 }, tracked: true, blurb: 'The operator swings it to follow the walker: the walker stays on its axis, so the level arc comes from distance alone.' },
];
const VEH_MICS: PathMicOption[] = [
  { id: 'omni', label: 'Fixed omni behind the crew line', short: 'OMNI', typeId: 'arrOmni', pattern: 'omni', pose: fixed(F08_START.veh), blurb: 'A broad pickup from the stationary listener’s place.' },
  { id: 'card', label: 'Fixed cardioid, aimed at the route', short: 'CARDIOID', typeId: 'arrCard', pattern: 'cardioid', pose: fixed(F08_START.veh), blurb: 'It leans toward the route: the ends of the pass fall off its axis.' },
];

function F08Sound({ lesson, answers, onAnswered, variant }: PageProps) {
  const walk = usePathStep({
    key: 'passWalk',
    words: {
      title: 'A pass, scrubbed',
      badge: 'Straight line, free field, a steady tone at walking pace (1.4 m/s) · level against the closest point · a simplified picture',
      looking: 'The walking route from above',
      prompt: 'Drag SOURCE from the start to the end of the path. Then change MIC and drag again.',
      after: 'The level rises to the closest point and falls away; a directional mic adds its own change off its axis; a tracked mic keeps the walker on its axis. The pitch shift of a steady tone at walking pace is tiny — about 7 cents either way in this model.',
      start: 'APPROACH',
      end: 'DEPARTURE',
    },
    path: WALK_PATH,
    mics: WALK_MICS,
    speeds: [{ id: 'walk', label: 'Walking pace (1.4 m/s)', short: 'WALK', ms: WALK_SPEED_MS, blurb: 'A normal walking pace — a drawing default.' }],
    box: { x0: -2800, x1: 5200, z0: -15500, z1: 15500 },
    orient: 'frontUp',
    Background: RouteBg,
    Token: Walker,
    prediction: lesson.predictions.sound,
  });
  const veh = usePathStep({
    key: 'passVehicle',
    words: {
      title: 'A pass, on paper',
      badge: 'A PAPER PLAN · straight line, free field, a steady tone at 20 m/s (about 72 km/h) · a simplified picture',
      looking: 'The closed route, planned on paper',
      prompt: 'Drag SOURCE along the planned route and compare the level arc and the pitch with the walking pass.',
      after: 'At vehicle speed the same formula gives about a semitone (some 100 cents) up on the approach and down after it — but a real engine also changes pitch with its own speed, so a real pass never proves a Doppler number.',
      start: 'APPROACH',
      end: 'DEPARTURE',
    },
    path: VEH_PATH,
    mics: VEH_MICS,
    speeds: [{ id: 'veh', label: 'A vehicle on a closed route (20 m/s, paper example)', short: '20 M/S', ms: VEHICLE_SPEED_MS, blurb: 'A drawing default for the paper plan only.' }],
    box: { x0: -2500, x1: 13000, z0: -22500, z1: 22500 },
    orient: 'frontUp',
    Background: VehBg,
    Token: Car,
    prediction: lesson.predictions.sound,
  });
  const steps: MikingStep[] = [
    vehicle(variant) ? veh : walk,
    fieldCheckStep(
      lesson,
      'sound',
      answers,
      onAnswered,
      <Card>
        <Point title="THREE SEPARATE CUES">The level arc, the movement across a stereo image and a pitch change are three different things: one can happen without the others. Panning a track does not create a Doppler shift.</Point>
        <Point title="THE WHOLE PASS">A pass-by is not only its loud instant: the lead-in and the tail tell the listener how far and how fast.</Point>
      </Card>,
    ),
  ];
  return <PageSteps steps={steps} />;
}

const F08Before = makeFieldBefore({
  points: [
    { title: 'DRAW THE PATH FIRST', text: 'Approach, closest point, departure: the intended listener or camera position, the safe mic zone, the operator’s station and where the source enters and leaves the picture. Rehearse once without recording if you can.' },
    { title: 'A WALKING PASS FOR PRACTICE', text: 'Use a consenting walker on a path closed to traffic, with an agreed route and no trip hazards. The walker watches the route, never the mic.' },
    { title: 'A VEHICLE IS A PAPER PLAN HERE', text: 'A real vehicle session needs a permitted, closed route, a driver, a safety lead and a plan that keeps every person and every piece of equipment outside the vehicle’s envelope. In this lesson you plan it on paper only.' },
    { title: 'NOTHING INSIDE THE ENVELOPE', text: 'Mics, stands, cables and crew stay outside the travel path, its possible deviation and its stopping area. Never move a stand during a live pass to chase the source.' },
  ],
  safety: ['traffic', 'hearing', 'lightning', 'water'],
  note: 'Never use a boom over a public street, a railway, a track or a moving vehicle without the required permission and qualified production control.',
});

function F08Context({ lesson, answers, onAnswered, onInteractive, interactiveDone, variant }: PageProps) {
  const done = useCallback(() => {
    if (!interactiveDone.has('imageSwept')) onInteractive('imageSwept');
  }, [interactiveDone, onInteractive]);
  const veh = vehicle(variant);
  const image = useImageStep({
    words: {
      title: 'Fixed pair or tracked mono',
      badge: 'Textbook patterns, free field · the image from level and time is a simplified picture',
      looking: veh ? 'The paper plan: a pair facing the route' : 'A pair facing the walking route',
      prompt: 'Drag SOURCE along the path with each PAIR — then choose ONE MIC and drag again.',
      after: 'A fixed pair lets the pass travel across the image; one mono mic — fixed or tracked — keeps it in one place unless the mix moves it. Two channels are not stereo by themselves.',
    },
    arrays: ['xy', 'ms', 'ortf'],
    place: { c: veh ? F08_START.veh : F08_START.walk, bearing: 0 },
    source: { kind: 'path', path: veh ? VEH_PATH : WALK_PATH, label: (s) => (s < 0.45 ? 'APPROACHING' : s > 0.55 ? 'RECEDING' : 'PASSING') },
    box: veh ? { x0: -2500, x1: 13000, z0: -22500, z1: 22500 } : { x0: -2800, x1: 5200, z0: -15500, z1: 15500 },
    orient: 'frontUp',
    Background: veh ? VehBg : RouteBg,
    Token: veh ? Car : Walker,
    mono: { label: 'One mic (fixed or tracked)' },
    prediction: lesson.predictions.context,
    onTried: done,
  });
  const steps: MikingStep[] = [
    image,
    readStep('live', 'Studio, live and broadcast', [
      { title: 'FIXED OR TRACKED IS A VIEWPOINT', text: 'A tracked directional mic holds the subject; a fixed pair lets it cross the image. Neither is the one correct pass-by — they are different listeners.' },
      { title: 'LIVE', text: 'For a live show or a broadcast, a fixed, safe array can cover a predictable route without a moving operator. Route only the channels you need to the PA, the monitors and the stream, check mono and the audience positions, and control the gain before feedback.' },
      { title: 'CUES, NOT STEPS', text: 'If the subject changes path, an operator may track from a safe station — with intercom or visual cues, never by stepping toward the action to rescue a missed sound.' },
    ]),
    fieldCheckStep(lesson, 'context', answers, onAnswered),
  ];
  return <PageSteps steps={steps} />;
}

const START_END: PathMicOption[] = [
  { id: 'start', label: 'The start mic, near the approach', short: 'START', typeId: 'arrCard', pattern: 'cardioid', pose: { p: F08_START.start, az: 0, el: 0 }, blurb: 'Close to the approach: loud at the start, far away at the end.' },
  { id: 'end', label: 'The end mic, near the departure', short: 'END', typeId: 'arrCard', pattern: 'cardioid', pose: { p: F08_START.end, az: 0, el: 0 }, blurb: 'Close to the departure: the opposite perspective.' },
];

function F08TwoMic({ lesson, answers, onAnswered, onInteractive, interactiveDone }: PageProps) {
  const done = useCallback(() => {
    if (!interactiveDone.has('pairScrubbed')) onInteractive('pairScrubbed');
  }, [interactiveDone, onInteractive]);
  const aimAtPath = (o: PathMicOption, z: number): PathMicOption => {
    const dx = 3000 - o.pose.p.x;
    const dz = z - o.pose.p.z;
    const dy = -1000 + PB_H;
    const l = Math.hypot(dx, dy, dz);
    return { ...o, pose: { p: o.pose.p, az: (Math.atan2(dz, -dx) * 180) / Math.PI, el: (Math.asin(-dy / l) * 180) / Math.PI } };
  };
  const mics = [aimAtPath(START_END[0], -6000), aimAtPath(START_END[1], 6000)];
  const pair = usePathStep({
    key: 'startEnd',
    words: {
      title: 'Start and end mics',
      badge: 'Straight line, free field · the time between the two mics from the drawn distances · a simplified picture',
      looking: 'Two separate mics along the route',
      prompt: 'Drag SOURCE along the path and watch Δt between the two mics change. Switch MIC to read each one.',
      after: 'Two separate mics are two perspectives: each is loud where the other is far. Their time difference changes all the way along the pass — so no single delay or polarity setting fixes a blend for the whole pass.',
      start: 'APPROACH',
      end: 'DEPARTURE',
    },
    path: WALK_PATH,
    mics,
    box: { x0: -2800, x1: 5200, z0: -15500, z1: 15500 },
    orient: 'frontUp',
    Background: RouteBg,
    Token: Walker,
    pair: { a: 'start', b: 'end', note: 'Summed, they comb.' },
    prediction: lesson.predictions.twoMic,
    onScrubbed: done,
  });
  const steps: MikingStep[] = [
    pair,
    readStep('sync', 'Two recorders, one event', [
      { title: 'PERSPECTIVES, NOT STEREO', text: 'A start mic and an end mic become a stereo pair only if their spacing, orientation, routing and blend are planned as one. Otherwise keep them as two labelled perspectives.' },
      { title: 'ONE CLOCK', text: 'With separate recorders, synchronise and log their clocks or timecode, and a common event. Aligning for an editorial choice is fine — aligning every mic into one mono signal can change the passing perspective you recorded.' },
      { title: 'HEADROOM FOR THE CLOSEST MOMENT', text: 'Set the gain for the loudest plausible moment, not the quiet approach; change position, pattern or gain only between passes.' },
    ]),
    fieldCheckStep(lesson, 'twoMic', answers, onAnswered),
  ];
  return <PageSteps steps={steps} />;
}

export const F08_PAGES = { sound: F08Sound, setting: F08Before, context: F08Context, twoMic: F08TwoMic };
export const F08_STEP_COUNTS = { sound: 2, setting: 1, context: 3, twoMic: 3 };
