/**
 * B02 NEWS ANCHORS AND SEATED INTERVIEWS — the scene (charter §2 layer 3):
 * the anchor and the guest seated at the anchor desk (shared/broadcast/
 * BroadcastArt), in jackets (BodyWornArt), a gooseneck's base and the script
 * on the desk; the camera on its tripod and its frame (CameraArt); in public,
 * the PA at the stage's corner. From the side the guest lines up beside the
 * anchor, so only the anchor is drawn. Static (D8).
 */
import type { ReactElement } from 'react';
import { Group } from '@shopify/react-native-skia';
import type { VariantId, ViewId } from '../../engine/model/types.ts';
import type { ArtLabel } from '../../engine/scene/sceneTypes.ts';
import { Desk, DeskNearLegs, GooseBase, PaSpeaker, Script, SeatedTalker, StudioChair, talkerCovers } from '../shared/broadcast/BroadcastArt';
import { Jacket } from '../shared/broadcast/BodyWornArt';
import { BroadcastCameraRig, FrameWedge } from '../shared/broadcast/CameraArt';
import { cameraBody } from '../shared/broadcast/cameraFrame.ts';
import { DESK_TOP_Y, SEATED_FLOOR, SEATED_SOLIDS } from '../shared/broadcast/talkerPose.ts';
import { HEAD_C, HEAD_R } from '../shared/voice/voiceSpec.ts';
import { ANCHOR, B02_VIEWS, CAM_OF, DESK, GOOSE_BASE, GUEST, HEAD_TOP, PA_C } from './geometry.ts';

type V = 'close' | 'twoShot' | 'public';
const vOf = (v: VariantId): V => (v === 'twoShot' ? 'twoShot' : v === 'public' ? 'public' : 'close');

/** Everything at the desk, far side first. `headless`: the anchor drawn
 *  without a head (a step draws it turned); `camera` false leaves the camera
 *  and its frame to the step; `base` false hides the gooseneck's base. */
export function B02Scene({ view, variant, headless = false, camera = true, base = true }: { view: ViewId; variant: VariantId; headless?: boolean; camera?: boolean; base?: boolean }): ReactElement {
  const v = vOf(variant);
  const cam = CAM_OF[v];
  const box = B02_VIEWS[v][view];
  if (view === 'side') {
    return (
      <Group>
        {v === 'public' ? <PaSpeaker view="side" c={PA_C} faces={1} floor={SEATED_FLOOR} /> : null}
        {camera ? <FrameWedge view="side" cam={cam} reach={cam.lens.x - box.u0} headTop={HEAD_TOP} /> : null}
        <StudioChair view="side" t={ANCHOR} />
        <Desk view="side" box={DESK} floor={SEATED_FLOOR} skirt />
        {base ? <GooseBase view="side" at={GOOSE_BASE} /> : null}
        <Script view="side" at={{ x: 420, y: DESK_TOP_Y, z: 160 }} />
        <SeatedTalker view="side" t={ANCHOR} headless={headless} />
        <Jacket view="side" standing={false} />
        <DeskNearLegs box={DESK} floor={SEATED_FLOOR} skirt />
        {camera ? <BroadcastCameraRig view="side" cam={cam} floor={SEATED_FLOOR} /> : null}
      </Group>
    );
  }
  return (
    <Group>
      {v === 'public' ? <PaSpeaker view="top" c={PA_C} faces={1} floor={SEATED_FLOOR} /> : null}
      {camera ? <FrameWedge view="top" cam={cam} reach={cam.lens.x - box.u0} /> : null}
      <StudioChair view="top" t={ANCHOR} />
      <StudioChair view="top" t={GUEST} />
      <SeatedTalker view="top" t={ANCHOR} part="lower" />
      <SeatedTalker view="top" t={GUEST} part="lower" />
      <Desk view="top" box={DESK} floor={SEATED_FLOOR} skirt />
      <Script view="top" at={{ x: 420, y: DESK_TOP_Y, z: 160 }} turn={-0.06} />
      <Script view="top" at={{ x: 420, y: DESK_TOP_Y, z: GUEST.lip.z + 160 }} turn={0.05} />
      {base ? <GooseBase view="top" at={GOOSE_BASE} /> : null}
      <SeatedTalker view="top" t={GUEST} part="upper" />
      {/* The left hand rests inside the gooseneck's base (it lay on it). */}
      <SeatedTalker view="top" t={ANCHOR} part="upper" headless={headless} leftHandIn={75} />
      {camera ? <BroadcastCameraRig view="top" cam={cam} floor={SEATED_FLOOR} /> : null}
    </Group>
  );
}

export function B02Instrument({ view, variant }: { view: ViewId; variant: VariantId }): ReactElement {
  return <B02Scene view={view} variant={variant} />;
}

export function b02Labels(view: ViewId, _variant: VariantId): ArtLabel[] {
  if (view === 'side') {
    const out: ArtLabel[] = [
      { id: 'v.mouth', text: 'MOUTH', u: 140, v: -170, align: 'left', at: { u: 0, v: 2 }, alts: [{ u: 160, v: 110, align: 'left' }] },
      { id: 'bc.desk', text: 'ANCHOR DESK', short: 'DESK', u: 560, v: DESK.max.y + 90, align: 'center', tone: 'muted', at: { u: 560, v: DESK.max.y } },
      { id: 'b2.base', text: 'GOOSENECK BASE', short: 'BASE', u: GOOSE_BASE.x + 90, v: DESK_TOP_Y - 160, align: 'left', tone: 'muted', at: { u: GOOSE_BASE.x, v: DESK_TOP_Y - 20 } },
    ];
    // The camera and the PA are named by a tap (THE PARTS): the setups are
    // framed close on the desk, where their labels would sit alone.
    return out;
  }
  const out: ArtLabel[] = [
    { id: 'v.mouth', text: 'MOUTH', u: 150, v: -170, align: 'left', at: { u: 2, v: 0 } },
    { id: 'g.head', text: 'GUEST', u: -360, v: GUEST.lip.z, align: 'right', at: { u: GUEST.lip.x + HEAD_C.x - HEAD_R + 10, v: GUEST.lip.z } },
    { id: 'bc.desk', text: 'ANCHOR DESK', short: 'DESK', u: 600, v: DESK.max.z - 110, align: 'center', tone: 'muted' },
  ];
  return out;
}

const inBox = (u: number, v: number, x0: number, x1: number, y0: number, y1: number, tol: number) => u >= x0 - tol && u <= x1 + tol && v >= y0 - tol && v <= y1 + tol;

export function b02HitTest(view: ViewId, variant: VariantId, u: number, v: number, tol: number): string | null {
  const vv = (p: { y: number; z: number }) => (view === 'side' ? p.y : p.z);
  const V2 = vOf(variant);
  if (view === 'side' ? Math.hypot(u, v - 2) <= 16 + tol : Math.hypot(u - 2, v) <= 16 + tol) return 'v.mouth';
  if (Math.hypot(u - HEAD_C.x, v - (view === 'side' ? HEAD_C.y : 0)) <= HEAD_R + tol) return 'v.head';
  if (view === 'top' && Math.hypot(u - HEAD_C.x, v - GUEST.lip.z) <= HEAD_R + tol) return 'g.head';
  if (Math.hypot(u - GOOSE_BASE.x, v - vv(GOOSE_BASE)) <= 75 + tol) return 'b2.base';
  const body = cameraBody(CAM_OF[V2]);
  if (inBox(u, v, body.min.x, body.max.x, vv(body.min), vv(body.max), tol)) return 'bc.camera';
  const T = SEATED_SOLIDS.torso;
  if (T.kind === 'box' && inBox(u, v, T.min.x, T.max.x, vv(T.min), vv(T.max), tol)) return 'v.chest';
  if (inBox(u, v, DESK.min.x, DESK.max.x, vv(DESK.min), vv(DESK.max), tol)) return 'bc.desk';
  if (V2 === 'public' && Math.hypot(u - PA_C.x, v - vv(PA_C)) <= 320 + tol) return 'b2.pa';
  return null;
}

export function b02FigureAt(view: ViewId, _variant: VariantId, u: number, v: number, tol: number): boolean {
  if (talkerCovers(view, ANCHOR, u, v, tol)) return true;
  return view === 'top' && talkerCovers(view, GUEST, u, v, tol);
}
