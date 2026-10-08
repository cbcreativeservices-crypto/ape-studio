/**
 * B05 LAVALIER, HEADSET AND CONCEALED PICKUP — the scene (charter §2 layer
 * 3): the presenter is the voice family's standing figure (FigureHead) in a
 * jacket (shared/broadcast/BodyWornArt), the bodypack on the belt; in the
 * studio the camera on its tripod and its frame's edges; live, the lectern
 * (BroadcastArt, B06's) and the PA at the stage's front corner. Static (D8).
 * Labels name what a mic decision needs.
 */
import type { ReactElement } from 'react';
import { Group } from '@shopify/react-native-skia';
import type { VariantId, ViewId } from '../../engine/model/types.ts';
import type { ArtLabel } from '../../engine/scene/sceneTypes.ts';
import { voiceFigureAt, voiceHitTest } from '../shared/voice/VoiceArt';
import { SINGER_SOLIDS } from '../shared/voice/voicePose.ts';
import { Lectern, PaSpeaker } from '../shared/broadcast/BroadcastArt';
import { StandingPresenter } from '../shared/broadcast/BodyWornArt';
import { BroadcastCameraRig } from '../shared/broadcast/CameraArt';
import { CHEST_X, NECK_Y } from '../shared/broadcast/bodyWorn.ts';
import { CAMERA, CAMERA_BOX, FLOOR, LECTERN, PACK, PA_C } from './geometry.ts';

/** The presenter: the shared standing figure in a jacket, the pack on the
 *  belt (BodyWornArt). `headless` leaves the head off (a step draws it
 *  turned). */
export function Presenter({ view, headless = false }: { view: ViewId; headless?: boolean }): ReactElement {
  return <StandingPresenter view={view} headless={headless} />;
}

/** Everything round the presenter, far side first. */
export function B05Scene({ view, variant, headless = false }: { view: ViewId; variant: VariantId; headless?: boolean }): ReactElement {
  if (variant === 'live') {
    return (
      <Group>
        <PaSpeaker view={view} c={PA_C} faces={1} floor={FLOOR} />
        <Presenter view={view} headless={headless} />
        <Lectern view={view} s={LECTERN} />
      </Group>
    );
  }
  return (
    <Group>
      <Presenter view={view} headless={headless} />
      <BroadcastCameraRig view={view} cam={CAMERA} floor={FLOOR} />
    </Group>
  );
}

export function B05Instrument({ view, variant }: { view: ViewId; variant: VariantId }): ReactElement {
  return <B05Scene view={view} variant={variant} />;
}

export function b05Labels(view: ViewId, variant: VariantId): ArtLabel[] {
  const out: ArtLabel[] = [];
  if (view === 'side') {
    out.push({ id: 'v.mouth', text: 'MOUTH', u: 150, v: -170, align: 'left', at: { u: 0, v: 2 }, alts: [{ u: 160, v: 90, align: 'left' }] });
    out.push({ id: 'b5.jacket', text: 'JACKET AND SHIRT', short: 'JACKET', u: 200, v: 520, align: 'left', tone: 'muted', at: { u: CHEST_X + 2, v: NECK_Y + 360 } });
    if (variant === 'studio') out.push({ id: 'bc.camera', text: 'CAMERA', u: CAMERA_BOX.max.x - 150, v: CAMERA_BOX.min.y - 150, align: 'center', at: { u: CAMERA_BOX.max.x - 150, v: CAMERA_BOX.min.y + 40 } });
    else {
      out.push({ id: 'b5.lectern', text: 'LECTERN', u: (LECTERN.x0 + LECTERN.x1) / 2, v: 900, align: 'center', tone: 'muted' });
      out.push({ id: 'b5.pa', text: 'PA', u: PA_C.x, v: PA_C.y - 380, align: 'center', at: { u: PA_C.x, v: PA_C.y - 280 } });
    }
    return out;
  }
  out.push({ id: 'v.mouth', text: 'MOUTH', u: 150, v: -170, align: 'left', at: { u: 2, v: 0 }, alts: [{ u: 150, v: 170, align: 'left' }] });
  out.push({ id: 'v.chest', text: 'SHOULDERS', short: 'CHEST', u: -150, v: 330, align: 'center', at: { u: -100, v: 180 } });
  if (variant === 'studio') out.push({ id: 'bc.camera', text: 'CAMERA', u: CAMERA_BOX.max.x - 100, v: CAMERA_BOX.max.z + 260, align: 'center', at: { u: CAMERA_BOX.max.x - 150, v: 40 } });
  else {
    out.push({ id: 'b5.lectern', text: 'LECTERN', u: (LECTERN.x0 + LECTERN.x1) / 2, v: -LECTERN.halfW - 130, align: 'center', tone: 'muted' });
    out.push({ id: 'b5.pa', text: 'PA', u: PA_C.x, v: PA_C.z - 320, align: 'center', at: { u: PA_C.x, v: PA_C.z - 170 } });
  }
  return out;
}

const inBox = (u: number, v: number, x0: number, x1: number, y0: number, y1: number, tol: number) => u >= x0 - tol && u <= x1 + tol && v >= y0 - tol && v <= y1 + tol;

export function b05HitTest(view: ViewId, variant: VariantId, u: number, v: number, tol: number): string | null {
  const vv = (p: { y: number; z: number }) => (view === 'side' ? p.y : p.z);
  if (Math.hypot(u - PACK.x, v - vv(PACK)) <= 60 + tol) return 'b5.pack';
  const T = SINGER_SOLIDS.torso;
  // The jacket's front over the chest (side view): the lapel and the front edge.
  if (view === 'side' && T.kind === 'box' && u >= CHEST_X - 40 - tol && u <= CHEST_X + 12 + tol && v >= NECK_Y + 60 && v <= NECK_Y + 560) return 'b5.jacket';
  const own = voiceHitTest(view, variant, u, v, tol);
  if (own) return own;
  if (variant === 'studio' && inBox(u, v, CAMERA_BOX.min.x, CAMERA_BOX.max.x, vv(CAMERA_BOX.min), vv(CAMERA_BOX.max), tol)) return 'bc.camera';
  if (variant === 'live') {
    if (inBox(u, v, LECTERN.x0, LECTERN.x1, view === 'side' ? LECTERN.top : -LECTERN.halfW, view === 'side' ? FLOOR : LECTERN.halfW, tol)) return 'b5.lectern';
    if (Math.hypot(u - PA_C.x, v - vv(PA_C)) <= 320 + tol) return 'b5.pa';
  }
  return null;
}

export function b05FigureAt(view: ViewId, variant: VariantId, u: number, v: number, tol: number): boolean {
  return voiceFigureAt(view, variant, u, v, tol);
}
