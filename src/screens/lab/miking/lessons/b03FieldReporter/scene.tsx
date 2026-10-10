/**
 * B03 FIELD REPORTERS AND HANDHELD INTERVIEWS — the scene (charter §2 layer
 * 3): the guest and the reporter standing face to face (shared/broadcast/
 * SportSpeechArt), the camera on its tripod beside the reporter
 * (shared/field/LocationArt), the kerb and the traffic lane behind the guest
 * (ReporterArt.Roadway), the wind from the road; at a live event, the local
 * loudspeaker on its pole beyond the reporter. The reporter's right arm that
 * holds the mic is folded away: the engine draws it from the shoulder.
 * Static (D8). Labels name what a mic decision needs.
 */
import type { ReactElement } from 'react';
import { Group } from '@shopify/react-native-skia';
import type { VariantId, ViewId } from '../../engine/model/types.ts';
import type { ArtLabel } from '../../engine/scene/sceneTypes.ts';
import { CameraRig, type CameraSpec } from '../shared/field/LocationArt';
import { PaSpeaker } from '../shared/broadcast/BroadcastArt';
import { DirArrow, StandingTalker, standingCovers } from '../shared/broadcast/SportSpeechArt';
import { Roadway } from '../shared/broadcast/ReporterArt';
import { HEAD_C, HEAD_R } from '../shared/voice/voiceSpec.ts';
import { SINGER_SOLIDS } from '../shared/voice/voicePose.ts';
import { CAMERA_BOX, FLOOR, GUEST, KERB_X, LENS, PA_C, REPORTER, ROAD_X0, ROAD_Z, TRIPOD } from './geometry.ts';

export const CAMERA: CameraSpec = { box: CAMERA_BOX, lens: LENS, floor: FLOOR, spread: TRIPOD.spread };

const street = (v: VariantId) => v === 'street' || v === 'twoMics';

export function B03Scene({ view, variant }: { view: ViewId; variant: VariantId }): ReactElement {
  const side = view === 'side';
  return (
    <Group>
      {street(variant) ? <Roadway view={view} x0={ROAD_X0} x1={KERB_X} z0={ROAD_Z.z0} z1={ROAD_Z.z1} floor={FLOOR} /> : null}
      {variant === 'event' && !side ? <PaSpeaker view={view} c={PA_C} faces={1} floor={FLOOR} /> : null}
      {!side && street(variant) ? <DirArrow a={{ u: -1500, v: -1300 }} b={{ u: -800, v: -900 }} color="#8fbcff" w={10} /> : null}
      <StandingTalker view={view} t={GUEST} />
      <StandingTalker view={view} t={REPORTER} arm="R" />
      <CameraRig view={view} spec={CAMERA} />
      {/* From the side the loudspeaker (z 1.3 m, nearer the viewer than the
          camera at 0.7–0.8 m) stands in front of the camera's tripod. */}
      {variant === 'event' && side ? <PaSpeaker view={view} c={PA_C} faces={1} floor={FLOOR} /> : null}
    </Group>
  );
}

export function B03Instrument({ view, variant }: { view: ViewId; variant: VariantId }): ReactElement {
  return <B03Scene view={view} variant={variant} />;
}

export function b03Labels(view: ViewId, variant: VariantId): ArtLabel[] {
  const out: ArtLabel[] = [];
  const R = REPORTER.lip;
  if (view === 'side') {
    out.push({ id: 'v.mouth', text: 'MOUTH', u: -150, v: -230, align: 'right', at: { u: 0, v: 2 } });
    out.push({ id: 'b3R.head', text: 'REPORTER', u: R.x + 120, v: -330, align: 'left', at: { u: R.x - HEAD_C.x, v: HEAD_C.y - HEAD_R + 20 } });
    out.push({ id: 'b3.camera', text: 'CAMERA', u: CAMERA_BOX.max.x - 100, v: CAMERA_BOX.min.y - 170, align: 'center', at: { u: CAMERA_BOX.min.x + 150, v: CAMERA_BOX.min.y + 40 } });
    if (street(variant)) out.push({ id: 'b3.road', text: 'ROAD', u: (ROAD_X0 + KERB_X) / 2 + 600, v: FLOOR - 160, align: 'center', tone: 'muted' });
    if (variant === 'event') out.push({ id: 'b3.pa', text: 'LOUDSPEAKER', short: 'SPEAKER', u: PA_C.x, v: PA_C.y - 420, align: 'center', at: { u: PA_C.x, v: PA_C.y - 280 } });
    return out;
  }
  out.push({ id: 'v.mouth', text: 'GUEST', u: -60, v: 330, align: 'center', at: { u: 2, v: 0 } });
  out.push({ id: 'b3R.head', text: 'REPORTER', u: R.x + 120, v: 340, align: 'center', at: { u: R.x - HEAD_C.x, v: 0 } });
  out.push({ id: 'b3.camera', text: 'CAMERA', u: CAMERA_BOX.max.x - 100, v: CAMERA_BOX.max.z + 300, align: 'center', at: { u: CAMERA_BOX.min.x + 150, v: CAMERA_BOX.max.z } });
  if (street(variant)) {
    out.push({ id: 'b3.road', text: 'ROAD · TRAFFIC', short: 'ROAD', u: KERB_X - 520, v: 900, align: 'center', tone: 'muted' });
    out.push({ id: 'b3.wind', text: 'WIND', u: -1280, v: -1400, align: 'center', tone: 'muted' });
  }
  if (variant === 'event') out.push({ id: 'b3.pa', text: 'LOUDSPEAKER', short: 'SPEAKER', u: PA_C.x, v: PA_C.z + 360, align: 'center', at: { u: PA_C.x, v: PA_C.z + 150 } });
  return out;
}

const inBox = (u: number, v: number, x0: number, x1: number, y0: number, y1: number, tol: number) => u >= x0 - tol && u <= x1 + tol && v >= y0 - tol && v <= y1 + tol;

export function b03HitTest(view: ViewId, variant: VariantId, u: number, v: number, tol: number): string | null {
  const vv = (p: { y: number; z: number }) => (view === 'side' ? p.y : p.z);
  const R = REPORTER.lip;
  if (Math.hypot(u - 2, v - (view === 'side' ? 2 : 0)) <= 16 + tol) return 'v.mouth';
  if (Math.hypot(u - HEAD_C.x, v - (view === 'side' ? HEAD_C.y : 0)) <= HEAD_R + tol) return 'v.head';
  if (Math.hypot(u - (R.x - HEAD_C.x), v - (view === 'side' ? HEAD_C.y : 0)) <= HEAD_R + tol) return 'b3R.head';
  const T = SINGER_SOLIDS.torso;
  if (T.kind === 'box' && inBox(u, v, T.min.x, T.max.x, vv(T.min), vv(T.max), tol)) return 'v.chest';
  if (inBox(u, v, CAMERA_BOX.min.x, CAMERA_BOX.max.x, vv(CAMERA_BOX.min), vv(CAMERA_BOX.max), tol)) return 'b3.camera';
  if (street(variant) && u < KERB_X + tol) return 'b3.road';
  if (variant === 'event' && Math.hypot(u - PA_C.x, v - vv(PA_C)) <= 320 + tol) return 'b3.pa';
  return null;
}

export function b03FigureAt(view: ViewId, _variant: VariantId, u: number, v: number, tol: number): boolean {
  return standingCovers(view, GUEST, u, v, tol) || standingCovers(view, REPORTER, u, v, tol, 'R');
}
