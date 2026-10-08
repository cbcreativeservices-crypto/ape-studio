/**
 * B10 SIDELINE AND POST-EVENT INTERVIEWS — the scene (charter §2 layer 3):
 * the guest and the reporter standing (shared/broadcast/SportSpeechArt), the
 * camera on its tripod (shared/field/LocationArt), the touchline and the
 * hatched play area behind them, the clear exit route, the PA beyond the
 * camera; at the post-event mark, the backdrop and the boom operator. An arm
 * that holds a mic is folded away: the engine draws it from the shoulder.
 * Static (D8). Labels name what a mic decision needs.
 */
import type { ReactElement } from 'react';
import { Group } from '@shopify/react-native-skia';
import type { VariantId, ViewId } from '../../engine/model/types.ts';
import type { ArtLabel } from '../../engine/scene/sceneTypes.ts';
import { BoomOperator, CameraRig, operatorPoses, type CameraSpec } from '../shared/field/LocationArt';
import { figureCovers } from '../shared/players/PlayerFigure';
import { PaSpeaker } from '../shared/broadcast/BroadcastArt';
import { Backdrop, DirArrow, PlayAreaHatch, StandingTalker, standingCovers } from '../shared/broadcast/SportSpeechArt';
import { HEAD_C, HEAD_R } from '../shared/voice/voiceSpec.ts';
import { SINGER_SOLIDS } from '../shared/voice/voicePose.ts';
import { BACKDROP_X, CAMERA_BOX, EXIT_Z, FLOOR, GRIP, GUEST, LENS, OPERATOR, PA_C, REPORTER, TOUCHLINE_X, TRIPOD } from './geometry.ts';

export const CAMERA: CameraSpec = { box: CAMERA_BOX, lens: LENS, floor: FLOOR, spread: TRIPOD.spread };
export const OPERATOR_POSES = operatorPoses(OPERATOR.feet, GRIP);
/** The pole's rear end behind the operator's front hand (a drawing default). */
const POLE_STUB = { a: GRIP, b: { x: GRIP.x + 380, y: GRIP.y + 420, z: GRIP.z + 300 } };

const holds = (v: VariantId) => ({ reporter: v === 'sideline' || v === 'twoMics', guest: v === 'twoMics' });

export function B10Scene({ view, variant, reporter = true }: { view: ViewId; variant: VariantId; reporter?: boolean }): ReactElement {
  const h = holds(variant);
  const side = view === 'side';
  const sideline = variant === 'sideline';
  const post = variant === 'postEvent';
  return (
    <Group>
      {sideline ? <PlayAreaHatch view={view} x={TOUCHLINE_X} depth={-420} z0={-1500} z1={1900} floor={FLOOR} /> : null}
      {sideline ? <PaSpeaker view={view} c={PA_C} faces={-1} floor={FLOOR} /> : null}
      {post ? <Backdrop view={view} x={BACKDROP_X} z0={-1050} z1={1050} h={2300} floor={FLOOR} /> : null}
      {!side && variant !== 'postEvent' ? <DirArrow a={{ u: -200, v: EXIT_Z }} b={{ u: 1700, v: EXIT_Z }} color="#5bff85" w={12} /> : null}
      {!side && sideline ? <DirArrow a={{ u: -1500, v: -1350 }} b={{ u: -900, v: -1000 }} color="#8fbcff" w={10} /> : null}
      {/* From the side the reporter stands right behind the guest (0.65 m
          farther from the viewer): drawn, their head would sit on the guest's
          as a second outline — so they are shown from above; their arm
          holding the mic is the engine's, faded from the side. */}
      {reporter && !side ? <StandingTalker view={view} t={REPORTER} arm={h.reporter ? 'R' : undefined} phones={sideline} /> : null}
      <StandingTalker view={view} t={GUEST} arm={h.guest ? 'R' : undefined} />
      {post ? <BoomOperator view={view} poses={OPERATOR_POSES} stub={POLE_STUB} /> : null}
      <CameraRig view={view} spec={CAMERA} />
    </Group>
  );
}

export function B10Instrument({ view, variant }: { view: ViewId; variant: VariantId }): ReactElement {
  return <B10Scene view={view} variant={variant} />;
}

export function b10Labels(view: ViewId, variant: VariantId): ArtLabel[] {
  const sideline = variant === 'sideline';
  const post = variant === 'postEvent';
  if (view === 'side') {
    const out: ArtLabel[] = [
      { id: 'v.mouth', text: 'MOUTH', u: 140, v: -210, align: 'left', at: { u: 0, v: 2 }, alts: [{ u: 180, v: 140, align: 'left' }] },
      { id: 'b10.camera', text: 'CAMERA', u: CAMERA_BOX.max.x - 120, v: CAMERA_BOX.min.y - 160, align: 'center', at: { u: CAMERA_BOX.max.x - 150, v: CAMERA_BOX.min.y + 40 } },
    ];
    if (sideline) {
      out.push({ id: 'b10.play', text: 'PLAY AREA', u: TOUCHLINE_X - 120, v: FLOOR - 320, align: 'center', tone: 'muted', at: { u: TOUCHLINE_X - 200, v: FLOOR - 20 } });
      out.push({ id: 'b10.pa', text: 'PA', u: PA_C.x - 420, v: PA_C.y + 60, align: 'right', at: { u: PA_C.x - 170, v: PA_C.y } });
    }
    if (post) {
      out.push({ id: 'b10.backdrop', text: 'BACKDROP', u: BACKDROP_X - 60, v: -900, align: 'right', tone: 'muted', at: { u: BACKDROP_X, v: -700 } });
      out.push({ id: 'b10.operator', text: 'BOOM OPERATOR', short: 'OPERATOR', u: OPERATOR.feet.x + 200, v: 700, align: 'left', tone: 'muted', at: { u: OPERATOR.feet.x + 60, v: 650 } });
    }
    return out;
  }
  const out: ArtLabel[] = [
    { id: 'v.mouth', text: 'MOUTH', u: 160, v: 230, align: 'left', at: { u: 2, v: 0 }, alts: [{ u: 160, v: -230, align: 'left' }] },
    { id: 'b10R.head', text: 'REPORTER', u: REPORTER.lip.x - 120, v: REPORTER.lip.z - 330, align: 'center', at: { u: REPORTER.lip.x + HEAD_C.x, v: REPORTER.lip.z } },
    { id: 'b10.camera', text: 'CAMERA', u: CAMERA_BOX.max.x - 100, v: CAMERA_BOX.max.z + 280, align: 'center', at: { u: CAMERA_BOX.max.x - 150, v: CAMERA_BOX.max.z } },
  ];
  if (variant !== 'postEvent') out.push({ id: 'b10.exit', text: 'CLEAR EXIT · KEEP OPEN', short: 'EXIT', u: 900, v: EXIT_Z + 180, align: 'center', tone: 'muted' });
  if (sideline) {
    out.push({ id: 'b10.play', text: 'PLAY AREA', u: TOUCHLINE_X - 210, v: 600, align: 'center', tone: 'muted' });
    out.push({ id: 'b10.pa', text: 'PA', u: PA_C.x, v: PA_C.z - 360, align: 'center', at: { u: PA_C.x, v: PA_C.z - 150 } });
    out.push({ id: 'b10.wind', text: 'WIND', u: -1150, v: -1380, align: 'center', tone: 'muted' });
  }
  if (post) {
    out.push({ id: 'b10.operator', text: 'BOOM OPERATOR', short: 'OPERATOR', u: OPERATOR.feet.x + 260, v: OPERATOR.feet.z + 260, align: 'left', tone: 'muted', at: { u: OPERATOR.feet.x + 80, v: OPERATOR.feet.z } });
    out.push({ id: 'b10.backdrop', text: 'BACKDROP', u: BACKDROP_X - 60, v: -900, align: 'right', tone: 'muted', at: { u: BACKDROP_X, v: -700 } });
  }
  return out;
}

const inBox = (u: number, v: number, x0: number, x1: number, y0: number, y1: number, tol: number) => u >= x0 - tol && u <= x1 + tol && v >= y0 - tol && v <= y1 + tol;

export function b10HitTest(view: ViewId, variant: VariantId, u: number, v: number, tol: number): string | null {
  const vv = (p: { y: number; z: number }) => (view === 'side' ? p.y : p.z);
  if (Math.hypot(u - 2, v - (view === 'side' ? 2 : 0)) <= 16 + tol) return 'v.mouth';
  if (Math.hypot(u - HEAD_C.x, v - (view === 'side' ? HEAD_C.y : 0)) <= HEAD_R + tol) return 'v.head';
  const T = SINGER_SOLIDS.torso;
  if (T.kind === 'box' && inBox(u, v, T.min.x, T.max.x, vv(T.min), vv(T.max), tol)) return 'v.chest';
  if (view === 'top' && Math.hypot(u - (REPORTER.lip.x + HEAD_C.x), v - REPORTER.lip.z) <= HEAD_R + tol) return 'b10R.head';
  if (inBox(u, v, CAMERA_BOX.min.x, CAMERA_BOX.max.x, vv(CAMERA_BOX.min), vv(CAMERA_BOX.max), tol)) return 'b10.camera';
  if (variant === 'sideline' && u < TOUCHLINE_X + tol) return 'b10.play';
  if (variant === 'sideline' && Math.hypot(u - PA_C.x, v - vv(PA_C)) <= 320 + tol) return 'b10.pa';
  if (variant === 'postEvent' && figureCovers(view === 'side' ? OPERATOR_POSES.side : OPERATOR_POSES.top, u, v, tol)) return 'b10.operator';
  if (variant === 'postEvent' && Math.abs(u - BACKDROP_X) <= 60 + tol) return 'b10.backdrop';
  if (view === 'top' && variant !== 'postEvent' && Math.abs(v - EXIT_Z) <= 80 + tol && u > -200) return 'b10.exit';
  return null;
}

export function b10FigureAt(view: ViewId, variant: VariantId, u: number, v: number, tol: number): boolean {
  const h = holds(variant);
  if (standingCovers(view, GUEST, u, v, tol, h.guest ? 'R' : undefined)) return true;
  if (view === 'top' && standingCovers(view, REPORTER, u, v, tol, h.reporter ? 'R' : undefined)) return true;
  return variant === 'postEvent' && figureCovers(view === 'side' ? OPERATOR_POSES.side : OPERATOR_POSES.top, u, v, tol);
}
