/**
 * F09 LOCATION SPEECH — the lesson's own pages (LessonArt.pages), served by
 * the journey (engine/restructure):
 *
 *   sound  → the second half of MEET IT — WHERE THE SOUND COMES FROM:
 *     WHERE THE VOICE COMES FROM (rack)  the voice family's sequence: breath,
 *                 the folds, the throat and mouth, out of the lips — STEP or
 *                 PLAY ONCE (a staged reveal that stops at the end).
 *     THE FRAME LINE (rack)  the camera's shot — CLOSE, MEDIUM or WIDE — and
 *                 where it leaves the boom: 15 cm above the frame's top edge,
 *                 aimed at the mouth (location.boomStart); the body mic stays
 *                 where it is. Distances and the level change are calculated
 *                 from the drawing (inverse square, "about").
 *     THE HEAD TURNS (rack)  TURN the talker's head ±60°: the mouth's axis
 *                 swings, the boom must follow (or not: FOLLOW), the body mic
 *                 on the chest stays put — each mic's distance and angle off
 *                 the mouth's axis read from the drawing.
 *     SPEECH AND THE ACTION (read, CHECK)  what a voice and a practical
 *                 sound each need; the checks.
 *   setting → its last steps on STARTING SETUPS:
 *     EACH MIC ON ITS OWN CHANNEL (read, key 'path')  boom, body, plant and
 *                 camera tracks labelled; live: stream, recorder and PA apart.
 *     BEFORE ANY MIC (read)  map the scene, ask first, permission and
 *                 privacy, power lines and lightning; hearing; the checks.
 * FULLY SILENT; nothing loops (D8); every state reachable by a control.
 */
import { useMemo, useState, type ReactNode } from 'react';
import type { BezelItem, DockParam } from '../../../rack/rackTypes';
import type { SourcePageId } from '../../engine/model/types.ts';
import { PageSteps, type MikingStep } from '../../engine/steps';
import { Body, Card, Landing, Note, Point, PredictCard, ScenarioList } from '../../engine/kit';
import type { PageProps } from '../../pages/pageTypes';
import { useStepper } from '../shared/hand/handPages';
import { makeVoiceSetting } from '../shared/voice/VoicePages';
import { VoiceSequence } from '../shared/voice/VoiceSoundArt';
import { FigureHead, PlayerBehind, PlayerInFront, headAbove } from '../shared/players/PlayerFigure';
import { pt } from '../shared/players/playerPose.ts';
import { HEAD_C } from '../shared/voice/voiceSpec.ts';
import { SINGER_TOP } from '../shared/voice/voicePose.ts';
import { boomStart, distanceDb, frameForShot, micToMouth, SHOT_IDS, SHOTS, turnedMouth, type ShotId } from '../shared/field/location.ts';
import { Aim, Dim, FieldStage, MicAt, Ray, uvOf } from '../shared/field/FieldStage';
import { BOOM, F09_VIEWS, GRIP, LAV_P, LENS } from './geometry.ts';
import { LocationScene } from './scene';
import { Group } from '@shopify/react-native-skia';

type PageFn = (p: PageProps) => ReactNode;
const v3 = (x: number, y: number, z: number) => ({ x, y, z });
const cm = (mm: number) => `${Math.round(mm / 10)} cm`;
const deg = (d: number) => `${Math.round(d / 5) * 5}°`;
const LIP = v3(0, 0, 0);
const unit = (a: { x: number; y: number; z: number }) => {
  const l = Math.hypot(a.x, a.y, a.z) || 1;
  return v3(a.x / l, a.y / l, a.z / l);
};
const sub = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) => v3(a.x - b.x, a.y - b.y, a.z - b.z);

/** The frame-line step's drawing box (the set, side view, the counter cut). */
const FRAME_BOX = { u0: -500, u1: F09_VIEWS.set.side.u1, v0: -1050, v1: 1640 };
/** The head-turn step's box (from above, close round the talker). */
const TURN_BOX = { u0: -420, u1: 820, v0: -520, v1: 520 };
/** The head's turning axis: over the neck, at the head's centre (a drawing default). */
const PIVOT = v3(HEAD_C.x, 0, 0);
/** The talker from above with the head drawn separately (TurnedHead): the
 *  pose's own head shrunk to nothing under it. */
const BODY_TOP = { ...SINGER_TOP, head: { ...SINGER_TOP.head, r: 1 } };

/* ── THE FRAME LINE ── */

function useFrameStep(): MikingStep {
  const [shot, setShot] = useState<ShotId>('medium');
  const [seen, setSeen] = useState<ReadonlySet<ShotId>>(() => new Set(['medium']));
  const frame = useMemo(() => frameForShot(LENS, shot), [shot]);
  const boom = useMemo(() => boomStart(frame, { clearance: 150, elevDeg: 45 }), [frame]);
  const dBoom = boom.d;
  const dLav = Math.hypot(LAV_P.x, LAV_P.y, LAV_P.z);
  const db = distanceDb(dLav, dBoom);
  const tail = sub(boom.p, v3(boom.aim.x * 250, boom.aim.y * 250, 0));
  const words = `${SHOTS[shot].label.toLowerCase()} shot (${SHOTS[shot].words})`;
  const a11y = `A talker at a counter seen from the right, the camera 2.5 metres in front, its frame drawn as dashed lines: a ${words}. The boom mic sits 15 centimetres above the top of the frame, ${cm(dBoom)} from the lips, aimed at the mouth; a body mic on the chest is ${cm(dLav)} from the lips.`;
  const params: DockParam[] = [
    {
      kind: 'options',
      id: 'shot',
      label: 'SHOT',
      valueLabel: SHOTS[shot].label,
      selectedId: shot,
      onSelect: (id) => {
        const s = id as ShotId;
        setShot(s);
        setSeen((prev) => (prev.has(s) ? prev : new Set([...prev, s])));
      },
      sticky: true,
      options: SHOT_IDS.map((s) => ({ id: s, label: `${SHOTS[s].label} — ${SHOTS[s].words}`, blurb: s === 'wide' ? 'Room above the head grows: the boom backs off.' : s === 'close' ? 'Little headroom: the boom can come closest.' : 'The talker to the waist.' })),
    },
  ];
  const bezel: BezelItem[] = [
    { k: 'SHOT', v: SHOTS[shot].label, flex: 0.9 },
    { k: 'BOOM → LIPS', v: cm(dBoom), flex: 1.1 },
    { k: 'BODY MIC', v: cm(dLav), flex: 1 },
    { k: 'BOOM vs BODY', v: `≈ ${db.toFixed(0)} dB`, flex: 1.1 },
  ];
  return {
    key: 'frame',
    title: 'The frame line',
    kind: 'TRY',
    layout: 'rack',
    rack: {
      render: (w, h) => (
        <FieldStage
          w={w}
          h={h}
          view="side"
          box={FRAME_BOX}
          a11y={a11y}
          labels={[
            { id: 'top', text: 'TOP OF THE FRAME', short: 'FRAME', u: 1700, v: frame.top + (LENS.y - frame.top) * (1700 / LENS.x) - 90, align: 'center', tone: 'muted' },
            { id: 'boom', text: `BOOM ${cm(dBoom)}`, short: cm(dBoom), u: boom.p.x + 120, v: boom.p.y - 60, align: 'left', tone: 'amber' },
            { id: 'lav', text: `BODY MIC ${cm(dLav)}`, short: cm(dLav), u: 120, v: 300, align: 'left', tone: 'amber', at: { u: LAV_P.x, v: LAV_P.y } },
          ]}
        >
          {(px) => (
            <>
              <LocationScene view="side" variant="set" frame={frame} operator={false} />
              <Ray a={uvOf('side', tail)} b={uvOf('side', GRIP)} px={px} color="#4d515b" width={14} dash={[1000, 0]} />
              <MicAt view="side" p={boom.p} aim={boom.aim} art="shotgun" r={9.5} len={250} />
              <MicAt view="side" p={LAV_P} aim={unit(sub(LIP, LAV_P))} art="lavalier" r={3} len={12} />
              <Dim a={uvOf('side', LIP)} b={uvOf('side', boom.p)} px={px} />
              <Dim a={uvOf('side', v3(-30, 0, 0))} b={uvOf('side', v3(-30, LAV_P.y, 0))} px={px} color="#cfd4dc" />
            </>
          )}
        </FieldStage>
      ),
      badge: 'Calculated from the drawing · dashed = the camera’s frame · red band = in the shot above the head · silent',
      bezel,
      params,
      initialParam: 'shot',
    },
    well: (
      <>
        <Landing looking="Side view · the talker, the camera and its frame" prompt="Switch SHOT: close, medium, wide. Where can the boom go — and the body mic?" />
        <Card>
          <Point title={`${SHOTS[shot].label} SHOT`}>{`The frame’s top edge sits ${shot === 'close' ? 'just' : shot === 'medium' ? 'a little' : 'well'} above the head. The boom stays 15 cm above that edge, aimed down at the mouth — ${cm(dBoom)} from the lips. The body mic on the chest stays ${cm(dLav)} away whatever the shot: here the boom hears the voice about ${db.toFixed(0)} dB weaker than the body mic does (by distance alone).`}</Point>
        </Card>
        {seen.size === 3 ? <Note tone="ok">A wider shot pushes the boom farther from the mouth — more room and noise against the voice. The body mic keeps its distance, but sounds of the chest and the clothes. Often both are recorded, each on its own channel, and the editor chooses.</Note> : null}
        <Body>The camera, its distance and the three shots are drawing defaults; the distances and the dB come from the drawing, by distance alone — a simplified picture. Move a mic, not the gain.</Body>
      </>
    ),
  };
}

/* ── THE HEAD TURNS ── */

function TurnedHead({ yawDeg }: { yawDeg: number }) {
  // The figure's own head from above, turned about the head's centre.
  const head = useMemo(() => headAbove(pt(SINGER_TOP.head.c.u, SINGER_TOP.head.c.v), SINGER_TOP.head.r), []);
  const c = { u: HEAD_C.x, v: 0 };
  const a = (yawDeg * Math.PI) / 180;
  // The pose's head is authored nose toward +v, turned −90° to face +x.
  return (
    <Group transform={[{ translateX: c.u }, { translateY: c.v }, { rotate: a - Math.PI / 2 }, { translateX: -SINGER_TOP.head.c.u }, { translateY: -SINGER_TOP.head.c.v }]}>
      <FigureHead fill={head.fill} />
    </Group>
  );
}

function useTurnStep(hidden: boolean): MikingStep {
  void hidden;
  const [yaw, setYaw] = useState(0);
  const [follow, setFollow] = useState(true);
  const [reached, setReached] = useState({ left: false, right: false });
  const m = turnedMouth(yaw, PIVOT, LIP);
  const boomAim = follow ? unit(sub(m.mouth, BOOM.p)) : BOOM.aim;
  const b = micToMouth(BOOM.p, boomAim, m.mouth, m.dir);
  const l = micToMouth(LAV_P, null, m.mouth, m.dir);
  const b0 = micToMouth(BOOM.p, BOOM.aim, LIP, v3(1, 0, 0));
  const l0 = micToMouth(LAV_P, null, LIP, v3(1, 0, 0));
  const axisEnd = v3(m.mouth.x + m.dir.x * 520, 0, m.mouth.z + m.dir.z * 520);
  const side = yaw > 2 ? 'to their right' : yaw < -2 ? 'to their left' : 'straight ahead';
  const a11y = `From above: the talker’s head turned ${Math.abs(Math.round(yaw))} degrees ${side}. The boom ${follow ? 'follows the mouth' : 'stays where it was'}: ${cm(b.d)} from the lips, ${deg(b.offAxis)} off the mouth’s axis${b.aimErr != null && b.aimErr > 3 ? `, pointing ${deg(b.aimErr)} away from the mouth` : ''}. The body mic on the chest: ${cm(l.d)}, ${deg(l.offAxis)} off the axis.`;
  const params: DockParam[] = [
    {
      kind: 'fader',
      id: 'turn',
      label: 'TURN',
      value: (yaw + 60) / 120,
      onChange: (v) => {
        const y = Math.round((v * 120 - 60) / 5) * 5;
        setYaw(y);
        if (y <= -40) setReached((r) => (r.left ? r : { ...r, left: true }));
        if (y >= 40) setReached((r) => (r.right ? r : { ...r, right: true }));
      },
      format: (v) => {
        const y = Math.round((v * 120 - 60) / 5) * 5;
        return y === 0 ? 'facing the camera' : `${Math.abs(y)}° to the talker’s ${y > 0 ? 'right' : 'left'}`;
      },
      formatShort: (v) => `${Math.round((v * 120 - 60) / 5) * 5}°`,
      home: 0.5,
    },
    { kind: 'toggle', id: 'follow', label: follow ? 'BOOM FOLLOWS' : 'BOOM STAYS', value: follow, onToggle: () => setFollow((f) => !f) },
  ];
  const bezel: BezelItem[] = [
    { k: 'TURN', v: `${Math.round(yaw)}°`, flex: 0.7 },
    { k: 'BOOM OFF AXIS', v: deg(b.offAxis), flex: 1.1 },
    { k: 'BOOM AIM', v: b.aimErr != null && b.aimErr > 3 ? `${deg(b.aimErr)} OFF` : 'ON MOUTH', tint: b.aimErr != null && b.aimErr > 10 ? '#ff6b5e' : undefined, flex: 1 },
    { k: 'BODY MIC', v: `${cm(l.d)} · ${deg(l.offAxis)}`, flex: 1.2 },
  ];
  const boomTop = uvOf('top', BOOM.p);
  return {
    key: 'turn',
    title: 'The head turns',
    kind: 'TRY',
    layout: 'rack',
    rack: {
      render: (w, h) => (
        <FieldStage
          w={w}
          h={h}
          view="top"
          box={TURN_BOX}
          a11y={a11y}
          labels={[
            { id: 'axis', text: 'THE MOUTH’S AXIS', short: 'AXIS', u: axisEnd.x - 40, v: axisEnd.z + (m.dir.z >= 0 ? 40 : -60), align: 'right', tone: 'muted' },
            { id: 'boom', text: follow ? 'BOOM (FOLLOWS)' : 'BOOM (STAYS)', short: 'BOOM', u: boomTop.u + 60, v: boomTop.v - 160, align: 'left', tone: 'amber', at: boomTop },
            { id: 'lav', text: 'BODY MIC, ON THE CHEST', short: 'BODY MIC', u: 60, v: 330, align: 'left', tone: 'amber', at: { u: LAV_P.x, v: 0 } },
          ]}
        >
          {(px) => (
            <>
              <PlayerBehind pose={BODY_TOP} />
              <PlayerInFront pose={BODY_TOP} hands={false} />
              <TurnedHead yawDeg={yaw} />
              <Ray a={uvOf('top', m.mouth)} b={uvOf('top', axisEnd)} px={px} color="#e8eaee" width={2.2} />
              <MicAt view="top" p={LAV_P} aim={unit(sub(LIP, LAV_P))} art="lavalier" r={3} len={12} />
              <MicAt view="top" p={BOOM.p} aim={boomAim} art="shotgun" r={9.5} len={250} />
              <Aim from={boomTop} dir={{ u: boomAim.x, v: boomAim.z }} len={Math.max(60, Math.hypot(boomAim.x, boomAim.z) * 420)} px={px} />
              <Dim a={uvOf('top', m.mouth)} b={boomTop} px={px} />
            </>
          )}
        </FieldStage>
      ),
      badge: 'From above · calculated from the drawing · the head turns about its centre (a simplified picture) · silent',
      bezel,
      params,
      initialParam: 'turn',
    },
    well: (
      <>
        <Landing looking="Top view · the talker’s head, the boom above, the body mic on the chest" prompt="TURN the head both ways. Then switch BOOM FOLLOWS to BOOM STAYS and turn again." />
        <Card>
          <Point title="THE BOOM">{`${cm(b.d)} from the lips, ${deg(b.offAxis)} off the mouth’s axis (${deg(b0.offAxis)} facing the camera)${follow ? ' — the operator turns the mic with the head, so it still points at the mouth.' : b.aimErr != null && b.aimErr > 3 ? ` — left where it was, it now points ${deg(b.aimErr)} away from the mouth.` : '.'}`}</Point>
          <Point title="THE BODY MIC">{`${cm(l.d)} from the lips, ${deg(l.offAxis)} off the axis (${deg(l0.offAxis)} facing the camera): on the chest, it does not move with the head.`}</Point>
        </Card>
        {reached.left && reached.right ? <Note tone="ok">The voice’s highest frequencies go out ahead of the mouth. As the head turns, a mic that stays put drifts off the mouth’s axis and hears a duller voice: a boom is re-aimed through the whole line, rehearsed. A body mic keeps one distance — but under the chin it never was on the axis.</Note> : null}
      </>
    ),
  };
}

/* ── MEET IT, the second half ── */

function F09Sound(p: PageProps) {
  const { lesson, answers, onAnswered, hidden } = p;
  const S = lesson.sound;
  const n = S.stages.length;
  const st = useStepper(n, hidden);
  const [predicted, setPredicted] = useState<string | null>(null);
  const pred = lesson.predictions.sound;
  const stage = S.stages[st.shown - 1];
  const frameStep = useFrameStep();
  const turnStep = useTurnStep(hidden);
  const steps: MikingStep[] = [
    {
      key: 'seq',
      title: 'Where the voice comes from',
      kind: 'WATCH',
      layout: 'rack',
      rack: {
        render: (w, h) => <VoiceSequence w={w} h={h} shown={st.shown} accessibilityLabel={`A talker in profile, the head and neck cut through the middle to show the airway, step ${st.shown} of ${n}: ${stage.title}. ${stage.text}`} />,
        badge: 'A simplified picture: a cut through the middle of the head · the order of events, not their speed or size · silent',
        bezel: [
          { k: 'STEP', v: `${st.shown} / ${n}`, flex: 0.8 },
          { k: 'EVENT', v: stage.title.toUpperCase(), flex: 2 },
        ],
        params: st.params,
        initialParam: 'step',
      },
      well: (
        <>
          {pred ? <PredictCard p={pred} value={predicted} onPick={setPredicted} /> : null}
          <Landing looking="Side view · the talker from the right, cut through the middle" prompt="STEP through how breath becomes speech — or PLAY ONCE. It stops at the end." />
          <Card>
            <Point title={`${st.shown} · ${stage.title.toUpperCase()}`}>{stage.text}</Point>
          </Card>
          {st.shown >= n && predicted != null ? <Note tone="ok">{`You predicted “${predicted}”. The voice leaves through the mouth, so every distance here is read from the lips — whatever the camera, the room or the mic.`}</Note> : null}
        </>
      ),
    },
    frameStep,
    turnStep,
    {
      key: 'body',
      title: 'Speech and the action',
      kind: 'CHECK',
      layout: 'read',
      body: (
        <>
          <Card>
            <Point title="SPEECH">{S.body}</Point>
            <Point title="CONSONANTS AND BREATH">{S.attack}</Point>
            <Point title="THE PRACTICAL SOUND">Keys put down, a door, a switch: real sounds of the scene, captured while filming or in a permitted separate take. A door has its impact, its hinge and its latch — each may want a different place. Decide, moment by moment, whether the words or the action come first.</Point>
          </Card>
          <Note>This lab never plays a sound and draws no frequency curve for the voice: a real voice depends on the talker, the words, the mic and the place. The pictures show where the sound comes from and where it goes.</Note>
          <ScenarioList items={lesson.scenarios.filter((s) => s.page === 'sound')} answers={answers} onAnswered={onAnswered} />
        </>
      ),
    },
  ];
  return <PageSteps steps={steps} />;
}

/** Hearing, for location work (BEFORE ANY MIC). */
export const F09_HEARING =
  'Protect hearing — the talker’s, the crew’s and yours. Keep headphone and monitor levels comfortable: a useful balance should never need a dangerous level. A widely used guideline: no more than 85 dBA averaged over an 8-hour day, and halve the time for every 3 dBA above that — a limit for PEOPLE, measured where a person listens. If anyone reports pain, ringing or a change in their hearing, stop and deal with the level.';

const F09Setting = makeVoiceSetting({
  hearing: F09_HEARING,
  path: {
    title: 'Each mic on its own channel',
    points: [
      { title: 'LABELLED, SEPARATE TRACKS', text: 'Keep each useful mic — boom, body mic, plant, camera reference — on its own labelled channel, with notes on noise and the shot. A boom and a body mic are two perspectives to choose between or blend on purpose, not the two sides of a stereo picture.' },
      { title: 'SOLO, THEN TOGETHER IN MONO', text: 'Listen to each alone, then to any blend in mono: a hollow, thin sound means some pitches cancel between two mics at different distances. Favour the channel that serves the scene; polarity is a test, not a cure for a delay.' },
      { title: 'LIVE: SEPARATE PATHS', text: 'Live, check what goes to the stream, the recorder and the local PA as separate paths, so an ambience or backup mic never feeds a loudspeaker by accident. Fewest open mics: each one adds room and lowers the margin before feedback.' },
    ],
    note: 'Record a separate room tone for editing — it smooths the cuts, but it cannot bring back a lost word.',
  },
});

export const F09_PAGES: Partial<Record<SourcePageId, PageFn>> = {
  sound: F09Sound,
  setting: F09Setting,
};
export const F09_STEP_COUNTS: Partial<Record<SourcePageId, number>> = { sound: 4, setting: 2 };
