/**
 * B04 BOOM AND CAMERA-MOUNTED PICKUP — the scene (charter §2 layer 3): the
 * talker is the voice family's standing figure in a jacket (BodyWornArt), the
 * camera on its tripod with its frame's edges and the headroom band
 * (CameraArt), the boom operator outside the frame holding the pole's end
 * (the location kit's BoomOperator); live, the PA at the stage's corner.
 * Static (D8). Labels name what a mic decision needs.
 */
import type { ReactElement } from 'react';
import { Group } from '@shopify/react-native-skia';
import type { VariantId, ViewId, Vec3 } from '../../engine/model/types.ts';
import type { ArtLabel } from '../../engine/scene/sceneTypes.ts';
import { voiceFigureAt, voiceHitTest } from '../shared/voice/VoiceArt';
import { figureCovers } from '../shared/players/PlayerFigure';
import { PaSpeaker } from '../shared/broadcast/BroadcastArt';
import { StandingPresenter } from '../shared/broadcast/BodyWornArt';
import { BroadcastCameraRig, FrameWedge } from '../shared/broadcast/CameraArt';
import { BoomOperator, operatorPoses } from '../shared/field/LocationArt';
import { cameraBody, toLocationFrame } from '../shared/broadcast/cameraFrame.ts';
import { frameTopY } from '../shared/field/location.ts';
import { B04_VIEWS, BOOM_ABOVE, BOOM_WIDE, CAM_OF, FLOOR, GRIP_CLOSE, GRIP_WIDE, HEAD_TOP, OP_FEET_CLOSE, OP_FEET_WIDE, PA_C } from './geometry.ts';

type V = 'close' | 'wide' | 'live';
const vOf = (v: VariantId): V => (v === 'wide' ? 'wide' : v === 'live' ? 'live' : 'close');

/** The pole's rear end behind the operator's front hand: along the line from
 *  the boom's starting tail through the grip (a drawing default, 0.7 m). */
function stub(grip: Vec3, boom: { p: Vec3; aim: Vec3 }): { a: Vec3; b: Vec3 } {
  const tail = { x: boom.p.x - boom.aim.x * 250, y: boom.p.y - boom.aim.y * 250, z: boom.p.z - boom.aim.z * 250 };
  const d = { x: grip.x - tail.x, y: grip.y - tail.y, z: grip.z - tail.z };
  const l = Math.hypot(d.x, d.y, d.z) || 1;
  return { a: grip, b: { x: grip.x + (d.x / l) * 700, y: grip.y + (d.y / l) * 700, z: grip.z + (d.z / l) * 700 } };
}
export const OPERATOR = {
  close: { poses: operatorPoses(OP_FEET_CLOSE, GRIP_CLOSE), stub: stub(GRIP_CLOSE, BOOM_ABOVE) },
  wide: { poses: operatorPoses(OP_FEET_WIDE, GRIP_WIDE), stub: stub(GRIP_WIDE, BOOM_WIDE) },
} as const;
const opOf = (v: V) => (v === 'wide' ? OPERATOR.wide : OPERATOR.close);

/** Everything round the talker, far side first. `headless`: the talker drawn
 *  without a head (a step draws it turned); `operator` false hides the
 *  operator (a step draws its own boom). */
export function B04Scene({ view, variant, headless = false, operator = true, camera = true }: { view: ViewId; variant: VariantId; headless?: boolean; operator?: boolean; camera?: boolean }): ReactElement {
  const v = vOf(variant);
  const cam = CAM_OF[v];
  const box = B04_VIEWS[v][view];
  const op = opOf(v);
  return (
    <Group>
      {v === 'live' ? <PaSpeaker view={view} c={PA_C} faces={1} floor={FLOOR} /> : null}
      {camera ? <FrameWedge view={view} cam={cam} reach={cam.lens.x - box.u0} headTop={HEAD_TOP} /> : null}
      {operator && view === 'side' ? <BoomOperator view={view} poses={op.poses} stub={op.stub} /> : null}
      <StandingPresenter view={view} headless={headless} />
      {operator && view === 'top' ? <BoomOperator view={view} poses={op.poses} stub={op.stub} /> : null}
      {camera ? <BroadcastCameraRig view={view} cam={cam} floor={FLOOR} /> : null}
    </Group>
  );
}

export function B04Instrument({ view, variant }: { view: ViewId; variant: VariantId }): ReactElement {
  return <B04Scene view={view} variant={variant} />;
}

export function b04Labels(view: ViewId, variant: VariantId): ArtLabel[] {
  const v = vOf(variant);
  const cam = CAM_OF[v];
  const body = cameraBody(cam);
  const camId = v === 'wide' ? 'bc.cameraWide' : 'bc.camera';
  const feet = v === 'wide' ? OP_FEET_WIDE : OP_FEET_CLOSE;
  const L = cam.lens;
  const out: ArtLabel[] = [];
  if (view === 'side') {
    out.push({ id: 'v.mouth', text: 'MOUTH', u: 140, v: 120, align: 'left', at: { u: 0, v: 2 }, alts: [{ u: 160, v: 220, align: 'left' }] });
    out.push({ id: camId, text: 'CAMERA', u: body.max.x - 150, v: body.min.y - 160, align: 'center', at: { u: body.max.x - 150, v: body.min.y + 40 } });
    out.push({ id: 'b4.frame', text: 'TOP OF THE FRAME', short: 'FRAME', u: L.x * 0.62, v: -700, align: 'center', tone: 'muted', at: { u: L.x * 0.62, v: frameTopY(toLocationFrame(cam), L.x * 0.62) } });
    out.push({ id: 'b4.operator', text: 'BOOM OPERATOR', short: 'OPERATOR', u: feet.x + 220, v: 760, align: 'left', tone: 'muted', at: { u: feet.x + 60, v: 700 } });
    if (v === 'live') out.push({ id: 'b4.pa', text: 'PA', u: PA_C.x, v: PA_C.y - 380, align: 'center', at: { u: PA_C.x, v: PA_C.y - 280 } });
    return out;
  }
  out.push({ id: 'v.mouth', text: 'MOUTH', u: 150, v: 170, align: 'left', at: { u: 2, v: 0 } });
  out.push({ id: camId, text: 'CAMERA', u: body.max.x - 100, v: body.max.z + 260, align: 'center', at: { u: body.max.x - 150, v: 40 } });
  out.push({ id: 'b4.operator', text: 'BOOM OPERATOR', short: 'OPERATOR', u: feet.x + 320, v: feet.z - 160, align: 'left', tone: 'muted', at: { u: feet.x + 80, v: feet.z } });
  out.push({ id: 'b4.frame', text: 'THE SHOT', short: 'SHOT', u: L.x * 0.55, v: 560, align: 'center', tone: 'muted' });
  if (v === 'live') out.push({ id: 'b4.pa', text: 'PA', u: PA_C.x, v: PA_C.z + 330, align: 'center', at: { u: PA_C.x, v: PA_C.z + 170 } });
  return out;
}

const inBox = (u: number, v: number, x0: number, x1: number, y0: number, y1: number, tol: number) => u >= x0 - tol && u <= x1 + tol && v >= y0 - tol && v <= y1 + tol;

export function b04HitTest(view: ViewId, variant: VariantId, u: number, v: number, tol: number): string | null {
  const own = voiceHitTest(view, variant, u, v, tol);
  if (own) return own;
  const vv = (p: { y: number; z: number }) => (view === 'side' ? p.y : p.z);
  const V2 = vOf(variant);
  const body = cameraBody(CAM_OF[V2]);
  if (inBox(u, v, body.min.x, body.max.x, vv(body.min), vv(body.max), tol)) return V2 === 'wide' ? 'bc.cameraWide' : 'bc.camera';
  const op = opOf(V2);
  if (figureCovers(view === 'side' ? op.poses.side : op.poses.top, u, v, tol)) return 'b4.operator';
  if (V2 === 'live' && Math.hypot(u - PA_C.x, v - vv(PA_C)) <= 320 + tol) return 'b4.pa';
  return null;
}

export function b04FigureAt(view: ViewId, variant: VariantId, u: number, v: number, tol: number): boolean {
  if (voiceFigureAt(view, variant, u, v, tol)) return true;
  const op = opOf(vOf(variant));
  return figureCovers(view === 'side' ? op.poses.side : op.poses.top, u, v, tol);
}
