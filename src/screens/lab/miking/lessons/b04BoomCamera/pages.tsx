/**
 * B04 BOOM AND CAMERA-MOUNTED PICKUP — the lesson's own pages
 * (LessonArt.pages), on the broadcast steps (shared/broadcast/
 * broadcastPages.tsx), the camera step (cameraPages.tsx) and the body-worn
 * turn step (bodyWornPages.tsx):
 *
 *   sound   → MEET IT's second half: the voice sequence; THE FRAME LINE (a
 *             close or a wide shot, the boom above, below or beside it, the
 *             camera's own mic, a lav — each distance read from the
 *             drawing); CHEST OR HEAD (the boom held still while the head
 *             turns, against a lav); TWO TALKERS (cue the boom from one
 *             mouth to the other: the swing, and the other voice off the
 *             axis); then the checks.
 *   setting → STARTING SETUPS' tail: WHERE EACH MIC GOES (the boom, the
 *             safety lav, the camera's mic: the program, the recorder, the
 *             earpiece — one mic on air per voice), then BEFORE ANY MIC.
 * FULLY SILENT; nothing loops (D8).
 */
import { useState, type ReactNode } from 'react';
import type { BezelItem, DockParam } from '../../../rack/rackTypes';
import type { PatternId, SourcePageId, Vec3 } from '../../engine/model/types.ts';
import type { PageProps } from '../../pages/pageTypes';
import type { MikingStep } from '../../engine/steps';
import { Body, Card, Landing, Note, Point } from '../../engine/kit';
import { gainDb } from '../../engine/physics/polar.ts';
import { makeBroadcastSetting, makeBroadcastSound, useRoutingStep } from '../shared/broadcast/broadcastPages';
import { useShotStep } from '../shared/broadcast/cameraPages';
import { useBodyTurnStep } from '../shared/broadcast/bodyWornPages';
import { boomSwing } from '../shared/broadcast/boomPole.ts';
import type { RoutingPlan } from '../shared/broadcast/routing.ts';
import { poseOnTalker } from '../shared/broadcast/talkerPose.ts';
import { StandingPresenter } from '../shared/broadcast/BodyWornArt';
import { PlayerBehind, PlayerInFront } from '../shared/players/PlayerFigure';
import { SINGER_TOP } from '../shared/voice/voicePose.ts';
import { Aim, Dim, FieldStage, MicAt, Ray, uvOf } from '../shared/field/FieldStage';
import { B04Scene } from './scene';
import { CAM_CAPSULE_MM, SHOTGUN_CAPSULE_MM } from '../shared/field/fieldMics.ts';
import { BOOM_ABOVE, CAM_CLOSE, CAM_WIDE, FLOOR, HEAD_TOP, LAV } from './geometry.ts';

type PageFn = (p: PageProps) => ReactNode;
const v3 = (x: number, y: number, z: number): Vec3 => ({ x, y, z });
const sub = (a: Vec3, b: Vec3): Vec3 => v3(a.x - b.x, a.y - b.y, a.z - b.z);
const unit = (a: Vec3): Vec3 => {
  const l = Math.hypot(a.x, a.y, a.z) || 1;
  return v3(a.x / l, a.y / l, a.z / l);
};
const cm = (mm: number) => `${Math.round(mm / 10)} cm`;
const deg5 = (d: number) => `${Math.round(d / 5) * 5}°`;
const angleBetween = (a: Vec3, b: Vec3) => (Math.acos(Math.max(-1, Math.min(1, (a.x * b.x + a.y * b.y + a.z * b.z) / ((Math.hypot(a.x, a.y, a.z) || 1) * (Math.hypot(b.x, b.y, b.z) || 1))))) * 180) / Math.PI;

/* ── TWO TALKERS ── */

/** Two standing talkers face to face 1.1 m apart (an interview, a drawing
 *  default); the boom above, between them and a little to one side. */
const A_LIP = v3(0, 0, 0);
const B_LIP = v3(1100, 0, 0);
const B_POSE = poseOnTalker(SINGER_TOP, { id: 'b', lip: B_LIP, facing: -1 });
const BOOM_2 = v3(550, -520, -260);
type Cue = 'A' | 'between' | 'B';
const CUES: readonly { id: Cue; label: string; blurb: string }[] = [
  { id: 'A', label: 'At the talker', blurb: 'The boom aimed at the talker’s mouth.' },
  { id: 'between', label: 'Between them', blurb: 'Aimed halfway between the two mouths.' },
  { id: 'B', label: 'At the interviewer', blurb: 'Cued to the interviewer’s mouth for their question.' },
];
const PATTERNS: readonly { id: PatternId; label: string; blurb: string }[] = [
  { id: 'supercardioid', label: 'Short shotgun', blurb: 'Drawn as its supercardioid base: narrower higher up (a simplified picture).' },
  { id: 'hypercardioid', label: 'Compact hypercardioid', blurb: 'A textbook hypercardioid.' },
];

function useTwoTalkerStep(): MikingStep {
  const [cue, setCue] = useState<Cue>('A');
  const [pattern, setPattern] = useState<PatternId>('supercardioid');
  const [seen, setSeen] = useState<ReadonlySet<Cue>>(() => new Set<Cue>(['A']));
  const target = cue === 'A' ? A_LIP : cue === 'B' ? B_LIP : v3((A_LIP.x + B_LIP.x) / 2, 0, 0);
  const aim = unit(sub(target, BOOM_2));
  const swing = boomSwing(BOOM_2, A_LIP, B_LIP);
  const read = (m: Vec3) => {
    const th = angleBetween(aim, sub(m, BOOM_2));
    const d = Math.hypot(m.x - BOOM_2.x, m.y - BOOM_2.y, m.z - BOOM_2.z);
    return { th, d, db: gainDb(pattern, th) };
  };
  const a = read(A_LIP);
  const b = read(B_LIP);
  const diff = a.db - 20 * Math.log10(a.d) - (b.db - 20 * Math.log10(b.d));
  const a11y = `From above: two talkers face to face 1.1 metres apart, a boom above and between them, aimed ${cue === 'A' ? 'at the talker' : cue === 'B' ? 'at the interviewer' : 'between them'}. The talker is ${deg5(a.th)} off its axis, the interviewer ${deg5(b.th)}. Cueing from one mouth to the other is a swing of about ${deg5(swing)}.`;
  const params: DockParam[] = [
    {
      kind: 'options',
      id: 'cue',
      label: 'CUE',
      valueLabel: cue === 'A' ? 'TALKER' : cue === 'B' ? 'INTERVIEWER' : 'BETWEEN',
      selectedId: cue,
      onSelect: (id) => {
        setCue(id as Cue);
        setSeen((s) => (s.has(id as Cue) ? s : new Set([...s, id as Cue])));
      },
      sticky: true,
      options: CUES.map((c) => ({ id: c.id, label: c.label, blurb: c.blurb })),
    },
    {
      kind: 'options',
      id: 'pattern',
      label: 'MIC',
      valueLabel: pattern === 'supercardioid' ? 'SHOTGUN' : 'HYPER',
      selectedId: pattern,
      onSelect: (id) => setPattern(id as PatternId),
      sticky: true,
      options: PATTERNS.map((p) => ({ id: p.id, label: p.label, blurb: p.blurb })),
    },
  ];
  const bezel: BezelItem[] = [
    { k: 'SWING', v: deg5(swing), flex: 0.8 },
    { k: 'TALKER', v: `${deg5(a.th)} OFF`, flex: 1 },
    { k: 'INTERVIEWER', v: `${deg5(b.th)} OFF`, flex: 1.1 },
    { k: Math.abs(diff) < 1 ? 'BALANCE' : diff > 0 ? 'TALKER AHEAD' : 'INTERVIEWER AHEAD', v: Math.abs(diff) < 1 ? 'EVEN' : `${Math.abs(diff).toFixed(0)} dB`, flex: 1.2 },
  ];
  const top = uvOf('top', BOOM_2);
  return {
    key: 'two',
    title: 'Two talkers',
    kind: 'TRY',
    layout: 'rack',
    rack: {
      render: (w, h) => (
        <FieldStage
          w={w}
          h={h}
          view="top"
          box={{ u0: -420, u1: 1520, v0: -760, v1: 520 }}
          a11y={a11y}
          labels={[
            { id: 'a', text: 'TALKER', u: -150, v: 360, align: 'center', tone: cue === 'A' ? 'amber' : 'muted' },
            { id: 'b', text: 'INTERVIEWER', short: 'INTERVIEW', u: B_LIP.x + 150, v: 360, align: 'center', tone: cue === 'B' ? 'amber' : 'muted' },
            { id: 'boom', text: 'BOOM, ABOVE', short: 'BOOM', u: top.u, v: top.v - 200, align: 'center', tone: 'amber', at: top },
          ]}
        >
          {(px) => (
            <>
              <PlayerBehind pose={SINGER_TOP} />
              <PlayerInFront pose={SINGER_TOP} hands={false} />
              <PlayerBehind pose={B_POSE} />
              <PlayerInFront pose={B_POSE} hands={false} />
              <Ray a={uvOf('top', A_LIP)} b={top} px={px} color={cue === 'B' ? '#8fbcff' : '#ffc64d'} width={cue === 'B' ? 2 : 3} dash={cue === 'B' ? [10, 7] : [1000, 0]} />
              <Ray a={uvOf('top', B_LIP)} b={top} px={px} color={cue === 'A' ? '#8fbcff' : '#ffc64d'} width={cue === 'A' ? 2 : 3} dash={cue === 'A' ? [10, 7] : [1000, 0]} />
              <MicAt view="top" p={BOOM_2} aim={aim} art="shotgun" r={9.5} len={250} />
              <Aim from={top} dir={{ u: aim.x, v: aim.z }} len={180} px={px} />
              <Dim a={uvOf('top', A_LIP)} b={uvOf('top', B_LIP)} px={px} color="#cfd4dc" />
            </>
          )}
        </FieldStage>
      ),
      badge: 'From above · calculated from the drawing · the patterns are textbook shapes (a simplified picture) · silent',
      bezel,
      params,
      initialParam: 'cue',
    },
    well: (
      <>
        <Landing looking="Top view · two talkers face to face, the boom above and between them" prompt="CUE the boom to the talker, then the interviewer, then between them. Read how far off the axis the other voice falls." />
        <Card>
          <Point title={`CUED ${cue === 'A' ? 'TO THE TALKER' : cue === 'B' ? 'TO THE INTERVIEWER' : 'BETWEEN THEM'}`}>{`The talker is ${deg5(a.th)} off the mic’s axis, ${cm(a.d)} away; the interviewer ${deg5(b.th)} off, ${cm(b.d)} away. ${Math.abs(diff) < 1 ? 'The two voices arrive about even' : `The ${diff > 0 ? 'talker' : 'interviewer'} is about ${Math.abs(diff).toFixed(0)} dB stronger`} on this simplified pattern. From one mouth to the other the boom swings about ${deg5(swing)}.`}</Point>
        </Card>
        {seen.size === 3 ? <Note tone="ok">One narrow boom aimed at one talker hears the other well off its axis — duller and quieter. Cue the boom before each turn to speak; for overlapping talk or a very wide shot, give each person their own mic and test the program.</Note> : null}
        <Body>Cue smoothly, from the script or the interview’s plan, and avoid sweeping across a loud background on the way. Listen to the room along the mic’s axis behind each talker too.</Body>
      </>
    ),
  };
}

function useTools() {
  const frame = useShotStep({
    shots: [
      { id: 'close', label: 'Close', words: 'head and shoulders, the camera 2.2 m away', cam: CAM_CLOSE },
      { id: 'wide', label: 'Wide', words: 'to the waist, the camera moved back to 3.6 m', cam: CAM_WIDE },
    ],
    from: ['above', 'below', 'side'],
    boom: { clearance: 150, elevDeg: 45, planDeg: -25, belowDeg: 40, sideDeg: 70, side: -1 },
    tube: SHOTGUN_CAPSULE_MM,
    camTube: CAM_CAPSULE_MM,
    bodyMic: LAV.at,
    camMic: true,
    scene: (view) => <B04Scene view={view} variant="close" operator={false} camera={false} />,
    floor: FLOOR,
    headTop: HEAD_TOP,
    boxSide: { u0: -700, u1: 3950, v0: -1050, v1: 1620 },
    boxTop: { u0: -700, u1: 3950, v0: -1700, v1: 1500 },
    insetBoxSide: { u0: -650, u1: 1350, v0: -950, v1: 900 },
    insetBoxTop: { u0: -650, u1: 1350, v0: -1250, v1: 600 },
    insetAt: { x: 0.3, y: 0.55, w: 0.42, h: 0.43 },
    words: {
      subject: 'A talker standing',
      looking: 'Side view · the talker, the camera and its frame · from above in the corner',
      prompt: 'Switch SHOT: close, then wide. Then bring the BOOM from below and from the side. Which is closest — and where is the camera’s own mic?',
      done: 'The boom goes as close as the picture allows: the wider the shot, the farther it must stay. Above is the usual first place; below and beside are for when the shot or the light rule it out. The camera’s mic is always as far as the camera — moved back, it went back too.',
    },
  });
  const turn = useBodyTurnStep({
    mics: [
      { id: 'boom', label: 'The boom, held still', short: 'BOOM', p: BOOM_ABOVE.p, rides: 'fixed', art: 'shotgun', r: 9.5, len: 250, fore: SHOTGUN_CAPSULE_MM },
      { id: 'lav', label: 'The safety lav on the chest', short: 'LAV', p: LAV.at, rides: 'chest', art: 'lavalier', r: 3, len: 12 },
    ],
    top: () => <StandingPresenter view="top" headless />,
    side: () => <StandingPresenter view="side" headless />,
    boxTop: { u0: -460, u1: 700, v0: -620, v1: 460 },
    boxSide: { u0: -420, u1: 640, v0: -560, v1: 420 },
    insetAt: { x: 0.6, y: 0.52, w: 0.39, h: 0.46 },
    pitch: true,
    words: {
      subject: 'a talker with a boom above and a lav on the chest',
      looking: 'From above · the talker, the boom above, a lav on the chest · the side in the corner',
      prompt: 'TURN the head both ways and LOOK down, with the boom held still. Switch MIC: which one drifts off the mouth?',
      done: 'Held still, the boom drifts off the turning mouth — so the operator re-aims it through the whole line, rehearsed. The lav keeps its place on the chest, but never was on the mouth’s axis. Two perspectives: kept on separate tracks, the program chooses.',
    },
  });
  const two = useTwoTalkerStep();
  return [frame, turn, two];
}

const B04Sound = makeBroadcastSound({
  useTools: () => useTools(),
  highs: 'The voice’s highest frequencies go out ahead of the mouth: a boom above and in front hears them; a talker who turns away from it, or a mic beside the frame, hears a duller voice. In words only — the shape of that spread is not drawn.',
  silentNote: 'This lab never plays a sound and draws no frequency curve for a voice or a shotgun: how a real talker sounds depends on the voice, the mic, the room and the distance. The pictures show where the sound comes from and where it goes.',
});

/** The shoot's routing: the boom, the safety lav, the camera's mic, the
 *  producer. One voice on air through one mic; each mic on its own track. */
const PLAN: RoutingPlan = {
  sources: [
    { id: 'boom', label: 'The boom mic', short: 'BOOM', kind: 'mic', level: 'mic', talker: 'talker' },
    { id: 'lav', label: 'The safety lav', short: 'LAV', kind: 'mic', level: 'mic', talker: 'talker' },
    { id: 'cam', label: 'The camera’s mic', short: 'CAMERA MIC', kind: 'mic', level: 'mic', talker: 'talker' },
    { id: 'producer', label: 'The producer’s talkback', short: 'PRODUCER', kind: 'talkback', level: 'mic' },
  ],
  dests: ['program', 'recorder', 'ifb', 'talkback'],
  sends: {
    boom: ['program', 'recorder'],
    lav: ['recorder'],
    cam: ['recorder'],
    producer: ['talkback', 'ifb'],
  },
  openMics: ['boom', 'lav', 'cam'],
  needs: { program: ['boom'], recorder: ['boom', 'lav', 'cam'] },
};

const B04Setting = makeBroadcastSetting({
  useRouting: () =>
    useRoutingStep({
      plan: PLAN,
      looks: { boom: { art: 'shotgun', r: 9.5, len: 250 }, lav: { art: 'lavalier', r: 9, len: 40 }, cam: { art: 'shotgun', r: 10, len: 180 }, producer: 'talkback' },
      switches: [
        {
          id: 'air',
          label: 'ON AIR',
          options: [
            { id: 'boom', label: 'The boom', blurb: 'The boom in the program; the lav on its own track as the fallback.', sends: { lav: ['recorder'] } },
            { id: 'both', label: 'Boom and lav', blurb: 'The boom and the lav summed in the program.', sends: { lav: ['program', 'recorder'] } },
          ],
        },
        {
          id: 'cam',
          label: 'CAMERA MIC',
          options: [
            { id: 'track', label: 'Its own track', blurb: 'The camera’s mic as a reference track only.', sends: { cam: ['recorder'] } },
            { id: 'program', label: 'In the program', blurb: 'The camera’s mic summed into the program too.', sends: { cam: ['program', 'recorder'] } },
          ],
        },
      ],
      words: {
        looking: 'A signal-flow drawing · the mics, the mixer, where each one goes',
        prompt: 'TRACE each source. Then sum the lav into the program, and the camera’s mic — read what goes wrong.',
        done: 'The boom on air; the lav and the camera’s mic each on its own track as a fallback and a reference; the producer in the earpiece only. One voice, one mic in the program.',
      },
      points: [
        { title: 'ONE MIC ON AIR PER VOICE', text: 'A boom and a lav on one talker hear the voice at two times: summed, it combs. Choose the intended feed; keep the other on its own track. A delay added by guesswork is not a cure — it lines up one position, and people move.' },
        { title: 'WHICH MIC IS LIVE', text: 'After every switch, confirm which mic is actually on air — and what goes to the program, the recorder, the earpiece and any PA.' },
        { title: 'THE CAMERA’S INPUT', text: 'Check the camera mic’s power, its connector, mic or line level, and the camera’s automatic gain — a tested manual setting where you can. Monitor on headphones and play back what was recorded.' },
      ],
    }),
});

export const B04_PAGES: Partial<Record<SourcePageId, PageFn>> = { sound: B04Sound, setting: B04Setting };
/** MEET IT's sound part: the sequence, three tools, the checks; STARTING
 *  SETUPS' tail: routing + before any mic. */
export const B04_STEP_COUNTS: Partial<Record<SourcePageId, number>> = { sound: 5, setting: 2 };
