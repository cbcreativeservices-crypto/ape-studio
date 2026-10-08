/**
 * THE CAMERA STEP (Lab 7 group 2; LessonArt.pages tool) — used by B04 and
 * B02, and by group 3: a rack step for MEET IT's second half.
 *
 *   useShotStep  THE FRAME LINE (key 'frame'): choose the SHOT (each a
 *                camera from cameraFrame.ts — a closer or a wider picture, a
 *                camera nearer or farther) and where the boom comes FROM
 *                (above, below, beside the frame, as the lesson offers).
 *                The boom starts at the nearest point on its line that
 *                clears the frame by the margin (cameraFrame.boomOutside —
 *                DERIVED), aimed at the mouth; the camera's own mic sits on
 *                the camera and moves with it; a body mic stays on the
 *                chest. Distances and the level differences (inverse
 *                square) are calculated from the drawing.
 * FULLY SILENT; nothing loops (D8); every state reachable by a control.
 */
import { useMemo, useState, type ReactNode } from 'react';
import type { BezelItem, DockParam } from '../../../../rack/rackTypes';
import type { ViewBox, ViewId, Vec3 } from '../../../engine/model/types.ts';
import type { MikingStep } from '../../../engine/steps';
import { Body, Card, Landing, Note, Point } from '../../../engine/kit';
import { Aim, Dim, FieldStage, MicAt, Ray, uvOf, type FieldInset } from '../field/FieldStage';
import { boomAbove, boomBelow, boomSide, cameraMic, type BroadcastCamera } from './cameraFrame.ts';
import { BroadcastCameraRig, FrameWedge } from './CameraArt';

const v3 = (x: number, y: number, z: number): Vec3 => ({ x, y, z });
const cm = (mm: number) => `${Math.round(mm / 10)} cm`;
const dist = (a: Vec3, b: Vec3) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const LIP = v3(0, 0, 0);
const db = (near: number, far: number) => 20 * Math.log10(far / near);

export type BoomFrom = 'above' | 'below' | 'side';
const FROM_WORDS: Readonly<Record<BoomFrom, { label: string; short: string; blurb: string }>> = {
  above: { label: 'Above the frame', short: 'ABOVE', blurb: 'Above the top of the picture and a little in front, aimed down at the mouth.' },
  below: { label: 'Below the frame', short: 'BELOW', blurb: 'Under the bottom of the picture, aimed up at the mouth.' },
  side: { label: 'Beside the frame', short: 'SIDE', blurb: 'Out past the side of the picture at about mouth height.' },
};

export type ShotSpec = {
  shots: readonly { id: string; label: string; words: string; cam: BroadcastCamera }[];
  /** Where the boom may come from (the first is the start). */
  from: readonly BoomFrom[];
  /** The boom's line (the lab's angles: drawing defaults) and its margin. */
  boom: { clearance: number; elevDeg: number; planDeg?: number; belowDeg?: number; sideDeg?: number; side?: 1 | -1 };
  /** A short shotgun read to its CAPSULE: the tube's length behind the tip
   *  that keeps clear of the frame (fieldmics SHOTGUN_BODY.fore). */
  tube?: number;
  /** The camera mic read to its capsule: its tube ahead (owner 2026-10-08, L6A). */
  camTube?: number;
  /** A body mic on the chest (frame V), when the lesson has one. */
  bodyMic?: Vec3;
  /** Draw the camera's own mic (and read it). */
  camMic: boolean;
  /** The scene round the talker (no camera: the step draws it). */
  scene: (view: ViewId, px: number) => ReactNode;
  floor: number;
  headTop: Vec3;
  boxSide: ViewBox;
  boxTop: ViewBox;
  /** The inset's own boxes (closer than the main view's) and its place. */
  insetBoxSide?: ViewBox;
  insetBoxTop?: ViewBox;
  insetAt?: { x: number; y: number; w: number; h: number };
  words: { subject: string; looking: string; prompt: string; done: string };
};

export function useShotStep(spec: ShotSpec): MikingStep {
  const [shotId, setShotId] = useState(spec.shots[0].id);
  const [from, setFrom] = useState<BoomFrom>(spec.from[0]);
  const [seen, setSeen] = useState<ReadonlySet<string>>(() => new Set([spec.shots[0].id]));
  const shot = spec.shots.find((s) => s.id === shotId) ?? spec.shots[0];
  const cam = shot.cam;
  const boom = useMemo(() => {
    const B = spec.boom;
    if (from === 'below') return boomBelow(cam, LIP, { clearance: B.clearance, elevDeg: B.belowDeg ?? 40, planDeg: B.planDeg });
    if (from === 'side') return boomSide(cam, LIP, { clearance: B.clearance, side: B.side ?? -1, planDeg: B.sideDeg ?? 70 });
    return boomAbove(cam, LIP, { clearance: B.clearance, elevDeg: B.elevDeg, planDeg: B.planDeg });
  }, [cam, from, spec.boom]);
  const cmic = useMemo(() => cameraMic(cam), [cam]);
  const tube = spec.tube ?? 0;
  const dBoom = boom.d + tube;
  /** Where the distance is read to: the front, or a shotgun's capsule. */
  const cap = v3(boom.p.x - boom.aim.x * tube, boom.p.y - boom.aim.y * tube, boom.p.z - boom.aim.z * tube);
  const camTube = spec.camTube ?? 0;
  const dCam = dist(v3(cmic.p.x - cmic.aim.x * camTube, cmic.p.y - cmic.aim.y * camTube, cmic.p.z - cmic.aim.z * camTube), LIP);
  const dBody = spec.bodyMic ? dist(spec.bodyMic, LIP) : null;
  const mainView: ViewId = from === 'side' ? 'top' : 'side';
  const tail = v3(boom.p.x - boom.aim.x * 250, boom.p.y - boom.aim.y * 250, boom.p.z - boom.aim.z * 250);
  const poleEnd = v3(tail.x - boom.aim.x * 700, tail.y - boom.aim.y * 700, tail.z - boom.aim.z * 700);
  const a11y = `${spec.words.subject}, the camera in front: a ${shot.label.toLowerCase()} (${shot.words}). The boom ${FROM_WORDS[from].label.toLowerCase()}, as close as the frame allows: ${cm(dBoom)} from the lips, aimed at the mouth.${spec.camMic ? ` The camera’s own mic is ${cm(dCam)} away.` : ''}${dBody != null ? ` A body mic on the chest is ${cm(dBody)} away.` : ''}`;
  const params: DockParam[] = [
    {
      kind: 'options',
      id: 'shot',
      label: 'SHOT',
      valueLabel: shot.label.slice(0, 10),
      selectedId: shotId,
      onSelect: (id) => {
        setShotId(id);
        setSeen((s) => (s.has(id) ? s : new Set([...s, id])));
      },
      sticky: true,
      options: spec.shots.map((s) => ({ id: s.id, label: `${s.label} — ${s.words}`, blurb: s.words })),
    },
    ...(spec.from.length > 1
      ? [
          {
            kind: 'options' as const,
            id: 'from',
            label: 'BOOM',
            valueLabel: FROM_WORDS[from].short,
            selectedId: from,
            onSelect: (id: string) => {
              setFrom(id as BoomFrom);
              setSeen((s) => (s.has(`from:${id}`) ? s : new Set([...s, `from:${id}`])));
            },
            sticky: true,
            options: spec.from.map((f) => ({ id: f, label: FROM_WORDS[f].label, blurb: FROM_WORDS[f].blurb })),
          },
        ]
      : []),
  ];
  const bezel: BezelItem[] = [
    { k: 'SHOT', v: shot.label.toUpperCase(), flex: 0.9 },
    { k: 'BOOM → LIPS', v: boom.ok ? cm(dBoom) : '—', flex: 1.1 },
    ...(spec.camMic ? [{ k: 'CAMERA MIC', v: cm(dCam), flex: 1 }] : []),
    ...(dBody != null ? [{ k: 'BODY MIC', v: cm(dBody), flex: 1 }] : []),
  ];
  const draw = (view: ViewId, px: number) => (
    <>
      {spec.scene(view, px)}
      <FrameWedge view={view} cam={cam} reach={cam.lens.x - spec.boxSide.u0} headTop={view === 'side' ? spec.headTop : undefined} />
      <BroadcastCameraRig view={view} cam={cam} floor={spec.floor} />
      {spec.camMic ? <MicAt view={view} p={cmic.p} aim={cmic.aim} art="shotgun" r={10} len={180} /> : null}
      <Ray a={uvOf(view, tail)} b={uvOf(view, poleEnd)} px={px} color="#3a3d45" width={5} dash={[1000, 0]} />
      <MicAt view={view} p={boom.p} aim={boom.aim} art="shotgun" r={9.5} len={250} />
      <Aim from={uvOf(view, boom.p)} dir={{ u: boom.aim.x, v: view === 'side' ? boom.aim.y : boom.aim.z }} len={Math.min(dBoom * 0.5, 160)} px={px} />
      <Dim a={uvOf(view, LIP)} b={uvOf(view, cap)} px={px} />
    </>
  );
  const otherView: ViewId = mainView === 'side' ? 'top' : 'side';
  const insetBox = otherView === 'side' ? spec.insetBoxSide ?? spec.boxSide : spec.insetBoxTop ?? spec.boxTop;
  const inset: FieldInset = {
    view: otherView,
    box: insetBox,
    at: spec.insetAt ?? { x: 0.62, y: 0.02, w: 0.37, h: 0.44 },
    title: otherView === 'side' ? 'SIDE' : 'FROM ABOVE',
    draw: (px) => draw(otherView, px),
    labels: [{ id: 'iv', text: otherView === 'side' ? 'SIDE' : 'FROM ABOVE', short: otherView === 'side' ? 'SIDE' : 'ABOVE', u: insetBox.u0 + (insetBox.u1 - insetBox.u0) * 0.06, v: insetBox.v0 + (insetBox.v1 - insetBox.v0) * 0.1, align: 'left', tone: 'muted' }],
  };
  const box = mainView === 'side' ? spec.boxSide : spec.boxTop;
  const bv = mainView === 'side' ? boom.p.y : boom.p.z;
  const shotsSeen = spec.shots.filter((s) => seen.has(s.id)).length;
  const fromSeen = spec.from.filter((f) => f === spec.from[0] || seen.has(`from:${f}`)).length;
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
          view={mainView}
          box={box}
          a11y={a11y}
          inset={inset}
          labels={[
            { id: 'boom', text: `BOOM ${cm(dBoom)}`, short: cm(dBoom), u: boom.p.x + 140, v: bv - 80, align: 'left', tone: 'amber', at: { u: boom.p.x, v: bv } },
            ...(spec.camMic ? [{ id: 'cam', text: `CAMERA MIC ${cm(dCam)}`, short: cm(dCam), u: cmic.p.x - 40, v: (mainView === 'side' ? cmic.p.y : cmic.p.z) - 190, align: 'center' as const, tone: 'amber' as const, at: { u: cmic.p.x, v: mainView === 'side' ? cmic.p.y : cmic.p.z } }] : []),
          ]}
        >
          {(px) => draw(mainView, px)}
        </FieldStage>
      ),
      badge: 'Calculated from the drawing · dashed = the camera’s frame · red band = in the picture above the head · the camera and the shots are drawing defaults · silent',
      bezel,
      params,
      initialParam: 'shot',
    },
    well: (
      <>
        <Landing looking={spec.words.looking} prompt={spec.words.prompt} />
        <Card>
          <Point title={`${shot.label.toUpperCase()} · BOOM ${FROM_WORDS[from].short}`}>
            {boom.ok
              ? `As close as this picture allows, the boom ${tube ? `mic’s tube ends 15 cm clear of the frame’s edge, its capsule ${cm(dBoom)} from the lips` : `sits ${cm(dBoom)} from the lips — 15 cm clear of the frame’s edge`}, aimed at the mouth.${spec.camMic ? ` The camera’s mic is ${cm(dCam)} away: by distance alone it hears the voice about ${db(dBoom, dCam).toFixed(0)} dB weaker than the boom does, with the room and the noise as loud as ever.` : ''}${dBody != null ? ` The body mic stays ${cm(dBody)} away whatever the shot.` : ''}`
              : 'From here no place on this line clears the frame: choose another side.'}
          </Point>
        </Card>
        {shotsSeen >= spec.shots.length && fromSeen >= Math.min(2, spec.from.length) ? <Note tone="ok">{spec.words.done}</Note> : null}
        <Body>A shotgun does not zoom: pointing it does not bring a distant voice closer. Distance decides how much voice there is against the room — a wider picture keeps the boom farther away, and a camera moved back takes its own mic back with it. The light and its shadows are another limit: check them in the real scene.</Body>
      </>
    ),
  };
}
