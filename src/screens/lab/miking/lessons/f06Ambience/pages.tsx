/**
 * F06 NATURAL AND URBAN AMBIENCE — the lesson's own pages (the field
 * family's steps, lessons/shared/field):
 *
 *   sound     WHERE THE AMBIENCE COMES FROM (MEET IT's second half): the
 *             listening point moved toward and away from the main bed — the
 *             stream, or the road — against the events (birds; the café),
 *             from inverse square between drawn distances; then checks
 *   setting   BEFORE ANY MIC: listen first, the destination, permission,
 *             and the safety cards (lightning, wildlife, paths, water and
 *             weather, hearing)
 *   context   WIND BEFORE A FILTER: the layers at three kinds of site; then
 *             levels and the log; live and broadcast; checks
 *   twoMic    A PAIR AND ITS IMAGE: X/Y, ORTF, spaced omnis and M/S with a
 *             source swept round the listening point — level, time, the
 *             image and the mono sum; checks
 * FULLY SILENT; nothing moves by itself.
 */
import { useCallback } from 'react';
import type { Vec3 } from '../../engine/model/types.ts';
import { PageSteps, type MikingStep } from '../../engine/steps';
import { Card, Note, Point } from '../../engine/kit';
import type { PageProps } from '../../pages/pageTypes';
import { SiteArt, SiteBird, SitePerson } from '../shared/field/SiteArt';
import { useBalanceStep, useImageStep, useWindStep } from '../shared/field/fieldSteps';
import { fieldCheckStep, makeFieldBefore, readStep } from '../shared/field/fieldPages';
import { MONITOR_WIND_LINE } from '../shared/field/wind.ts';
import { nearestOnPolyline, PLAZA_SITE, STREAM_PTS, WOODS_BIRDS } from '../shared/field/sites.ts';
import { AMB_H, F06_SITE } from './geometry.ts';

const urban = (v: string) => v === 'plaza';

function Woods() {
  return <SiteArt site={F06_SITE.woodland} view="top" />;
}
function Plaza() {
  return <SiteArt site={F06_SITE.plaza} view="top" />;
}
const BIRD_PTS: Vec3[] = [WOODS_BIRDS.a, WOODS_BIRDS.b].map((b) => ({ x: b.c[0], y: -b.h, z: b.c[1] }));
const CAFE_PTS: Vec3[] = [PLAZA_SITE.sources[2].p, PLAZA_SITE.sources[3].p];

function F06Sound({ lesson, answers, onAnswered, variant }: PageProps) {
  const city = urban(variant);
  const woods = useBalanceStep({
    key: 'balanceWoods',
    words: {
      title: 'Where you listen',
      badge: 'Each source as a point, free field · the change since the start, from the drawn distances · a simplified picture',
      looking: 'A woodland stream, from above',
      prompt: 'Move LISTEN AT toward the water and back, and watch SINCE THE START.',
      mainKey: 'WATER',
      otherKey: 'BIRDS',
      mainWord: 'water',
      otherWord: 'birds',
      note: 'The stream is a steady bed; the birds are events that come and go. Near moving water a few steps change the balance between them a lot — the mic’s position chooses the balance, not the fader.',
      after: 'A few metres nearer the water and it takes over; a few metres back and the birds come forward. Choose the listening point for the balance the scene needs — then keep it while you record.',
    },
    box: { x0: -4000, x1: 16000, z0: -10500, z1: 10500 },
    x: { min: -500, max: 4500, start: 0 },
    h: AMB_H,
    main: (p) => nearestOnPolyline(STREAM_PTS, p, 0),
    others: BIRD_PTS,
    Background: Woods,
    a11y: (x) => `Plan of the woodland stream from above. The listening point ${Math.abs(x / 1000).toFixed(1)} metres ${x >= 0 ? 'toward' : 'back from'} the water from where it started.`,
    prediction: lesson.predictions.sound,
  });
  const plaza = useBalanceStep({
    key: 'balancePlaza',
    words: {
      title: 'Where you listen',
      badge: 'Each source as a point, free field · the change since the start, from the drawn distances · a simplified picture',
      looking: 'A city plaza, from above',
      prompt: 'Move LISTEN AT toward the road and back, and watch SINCE THE START.',
      mainKey: 'TRAFFIC',
      otherKey: 'CAFÉ',
      mainWord: 'road',
      otherWord: 'café',
      note: 'The traffic is the steady bed; the café’s voices and the footsteps are nearer events. Moving the listening point changes which one leads — and how much speech could be understood.',
      after: 'Toward the road the traffic takes over; back toward the facade the square and its voices come forward, with the wall’s reflection behind. Decide which picture the scene needs before the stand is fixed.',
    },
    box: { x0: -9500, x1: 15000, z0: -12500, z1: 12500 },
    x: { min: -6500, max: 5000, start: 0 },
    h: AMB_H,
    main: (p) => ({ x: 10750, y: -600, z: p.z }),
    others: CAFE_PTS,
    Background: Plaza,
    a11y: (x) => `Plan of the city plaza from above. The listening point ${Math.abs(x / 1000).toFixed(1)} metres ${x >= 0 ? 'toward' : 'back from'} the road from where it started.`,
    prediction: lesson.predictions.sound,
  });
  const steps: MikingStep[] = [
    city ? plaza : woods,
    fieldCheckStep(
      lesson,
      'sound',
      answers,
      onAnswered,
      <Card>
        <Point title="A BED AND ITS EVENTS">A place sounds like a continuous layer — water, wind in the trees, a city’s traffic — with events on top that come and go: a call, a bus, a voice. A take needs long enough to hold a normal cycle of them.</Point>
        <Point title="WHAT THE TRACK IS FOR">An honest record of the site, a background under a picture, a live feed or a measurement: decide first. An unwanted event in a film bed may be the evidence in a documentary.</Point>
      </Card>,
    ),
  ];
  return <PageSteps steps={steps} />;
}

const F06Before = makeFieldBefore({
  points: [
    { title: 'LISTEN BEFORE YOU DEPLOY', text: 'Stand still and listen first: the main sources and where they move, the wind, the ground and the walls that reflect, how far the scene reaches — and whether speech could be understood. Come back at another time if the activity is not what the brief needs.' },
    { title: 'THE DESTINATION AND THE LISTENER', text: 'Write one sentence for each site: who is listening, from where, and in what format — stereo, mono, headphones. It decides the pickup before any mic does.' },
    { title: 'PERMISSION AND PRIVACY', text: 'Check access, permissions and the privacy rules for the place before you capture identifiable conversation or publish a take — they vary from place to place.' },
    { title: 'LABEL WHAT IT REALLY IS', text: 'Label each take with its real place and time. A filtered, assembled or looped bed is a deliverable — never claim it is one unaltered place.' },
  ],
  safety: ['lightning', 'wildlife', 'traffic', 'water', 'hearing'],
});

function F06Context({ lesson, answers, onAnswered, onInteractive, interactiveDone, variant }: PageProps) {
  const done = useCallback(() => {
    if (!interactiveDone.has('windTried')) onInteractive('windTried');
  }, [interactiveDone, onInteractive]);
  const wind = useWindStep({
    start: urban(variant) ? 'plaza' : 'forest',
    words: {
      title: 'Wind before a filter',
      badge: 'The layers drawn as real objects · the curls at the capsule are a cue, not a level',
      looking: 'A short shotgun and its wind protection',
      prompt: 'Add the layers with COVER, then try each SITE. What does each place need?',
      after: 'Foam is often enough inside a sheltered forest; open ground and a gusty plaza need fur, a basket and its suspension — and the most protection costs a little top end. Fit it to the mic and the day, and keep monitoring.',
      extra: MONITOR_WIND_LINE,
    },
    onTried: done,
    prediction: lesson.predictions.context,
  });
  const steps: MikingStep[] = [
    wind,
    readStep('levels', 'Levels and the log', [
      { title: 'HEADROOM FOR THE LOUDEST EVENT', text: 'Test on the loudest likely event — a passing vehicle, a shout, a close bird — and leave room so it does not clip. Raising the gain later raises the mic’s own noise and the place’s noise with it; in a quiet place, a quieter position often helps more than more gain.' },
      { title: 'NO SINGLE TARGET LEVEL', text: 'There is no one correct level for every ambience: the scene and the recorder decide the practical headroom. Watch the real input meters and listen on headphones.' },
      { title: 'THE FIELD LOG', text: 'Date, local time and time zone, the site, the weather and wind, the mic and its pattern, the array and which way it faced, the height, the wind protection, the recorder’s settings and filters, the channel map, the take length, what happened, and any limits on use. A creative bed is not a calibrated measurement — the log says which one you made.' },
    ]),
    readStep('live', 'Studio, live and broadcast', [
      { title: 'FOR A FILM OR STUDIO', text: 'Keep an identifiable bed and separate foreground options, and say in the log where each layer was recorded.' },
      { title: 'LIVE AND BROADCAST', text: 'An ambience mic can bring the audience or the place to a remote listener. Place it for useful pickup with little of the PA or the monitors in it, and route it on purpose: every open mic near a loudspeaker takes away gain before feedback. A quiet field pair made for later editing is not automatically safe as an open live feed.' },
      { title: 'NEVER PROVOKE FEEDBACK', text: 'Mute unused ambience channels, check every path to the speakers, streams and recorders at a controlled level — and never raise the output to find where it rings.' },
    ]),
    fieldCheckStep(lesson, 'context', answers, onAnswered),
  ];
  return <PageSteps steps={steps} />;
}

function F06TwoMic({ lesson, answers, onAnswered, onInteractive, interactiveDone, variant }: PageProps) {
  const city = urban(variant);
  const done = useCallback(() => {
    if (!interactiveDone.has('imageSwept')) onInteractive('imageSwept');
  }, [interactiveDone, onInteractive]);
  const image = useImageStep({
    words: {
      title: 'A pair and its image',
      badge: 'Textbook patterns, free field · the image from level and time is a simplified picture',
      looking: city ? 'The plaza, a source swept round the pair' : 'The wood, a bird swept round the pair',
      prompt: 'Sweep BEARING from left to right, then change PAIR and sweep again.',
      after: 'X/Y and M/S place the source by level alone and hold together in mono; ORTF and the spaced omnis add time differences — wider, and a comb in a mono sum to listen for. Width is not the same as depth.',
    },
    arrays: ['xy', 'ortf', 'ab', 'ms'],
    params: { ab: { spacing: 600 } },
    place: { c: { x: 0, y: -AMB_H, z: 0 }, bearing: 0 },
    source: { kind: 'arc', range: 8000, h: city ? 1500 : 6000, limit: 80 },
    box: { x0: -3500, x1: 10500, z0: -9500, z1: 9500 },
    orient: 'frontUp',
    Background: city ? Plaza : Woods,
    Token: (p) => (city ? <SitePerson f={{ kind: 'person', c: [p.x, p.z], heading: 180, role: 'public' }} view="top" /> : <SiteBird c={[p.x, p.z]} h={6000} heading={200} view="top" calling />),
    mono: { label: 'One mic (mono)' },
    prediction: lesson.predictions.twoMic,
    onTried: done,
  });
  const steps: MikingStep[] = [
    image,
    {
      key: 'mono',
      title: 'Check the fold-down',
      kind: 'LEARN',
      layout: 'read',
      body: (
        <>
          <Card>
            <Point title="LEFT, RIGHT AND MONO">Check left and right and the mono sum at the start, the middle and the end of a take. For X/Y and decoded M/S the centre should stay useful; for ORTF and spaced omnis listen for changes in the low end and the transients.</Point>
            <Point title="M/S STAYS LABELLED">Record the Mid and the Side as their own tracks, or decode them correctly to left and right. The raw Side is not a right channel.</Point>
            <Point title="TWO SPACED MICS ARE NOT ONE OMNI">Summing two spaced mics does not recreate one omni at the middle: the time difference between them stays in the sum.</Point>
          </Card>
          <Note>For ORTF the 110° is the angle between the two capsules’ axes — 55° each side of the front — not 110° to each side.</Note>
        </>
      ),
    },
    fieldCheckStep(lesson, 'twoMic', answers, onAnswered),
  ];
  return <PageSteps steps={steps} />;
}

export const F06_PAGES = { sound: F06Sound, setting: F06Before, context: F06Context, twoMic: F06TwoMic };
export const F06_STEP_COUNTS = { sound: 2, setting: 1, context: 4, twoMic: 3 };
