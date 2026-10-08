/**
 * F09 LOCATION SPEECH — the scene (charter §2 layer 3): the talker is the
 * voice family's standing figure (lessons/shared/voice, FigureHead), the
 * location kit (lessons/shared/field/LocationArt) round them — the camera and
 * its frame, the counter with the keys and the jar, the boom operator, the
 * power line outdoors. Static (D8). Labels name what a mic decision needs.
 */
import type { ReactElement } from 'react';
import { Group } from '@shopify/react-native-skia';
import type { VariantId, ViewId } from '../../engine/model/types.ts';
import type { ArtLabel } from '../../engine/scene/sceneTypes.ts';
import { VoiceFigure, voiceFigureAt, voiceHitTest, voiceLabels } from '../shared/voice/VoiceArt';
import { BoomOperator, CameraRig, Counter, FrameLines, PowerLineArt, operatorPoses, type CameraSpec } from '../shared/field/LocationArt';
import { figureCovers } from '../shared/players/PlayerFigure';
import { BOOM, CAMERA_BOX, COUNTER_BOX, F09_VIEWS, FLOOR, FRAME, GRIP, HEAD_TOP, JAR, KEYS, LENS, OPERATOR, POWER_LINE, TRIPOD } from './geometry.ts';

export const CAMERA: CameraSpec = { box: CAMERA_BOX, lens: LENS, floor: FLOOR, spread: TRIPOD.spread };
export const OPERATOR_POSES = operatorPoses(OPERATOR.feet, GRIP);
/** The pole's rear end, behind the front hand: along the line from the boom's
 *  starting tail through the grip (a drawing default, 0.7 m). */
const TAIL = { x: BOOM.tip.x - BOOM.aim.x * 250, y: BOOM.tip.y - BOOM.aim.y * 250, z: BOOM.tip.z - BOOM.aim.z * 250 };
const RD = (() => { const d = { x: GRIP.x - TAIL.x, y: GRIP.y - TAIL.y, z: GRIP.z - TAIL.z }; const l = Math.hypot(d.x, d.y, d.z); return { x: d.x / l, y: d.y / l, z: d.z / l }; })();
export const POLE_STUB = { a: GRIP, b: { x: GRIP.x + RD.x * 700, y: GRIP.y + RD.y * 700, z: GRIP.z + RD.z * 700 } };

const onSet = (v: VariantId) => v === 'set' || v === 'outdoor';

/** Everything round the talker, drawn far side first. `frame` swaps the
 *  shot drawn (MEET IT's frame-line step); `operator` hides the operator. */
export function LocationScene({ view, variant, frame = FRAME, operator = true }: { view: ViewId; variant: VariantId; frame?: typeof FRAME; operator?: boolean }): ReactElement {
  const box = F09_VIEWS[variant as 'set' | 'outdoor' | 'live']?.[view] ?? F09_VIEWS.set[view];
  const op = operator && onSet(variant);
  return (
    <Group>
      {variant === 'outdoor' ? <PowerLineArt view={view} line={POWER_LINE} box={box} /> : null}
      {onSet(variant) ? <FrameLines view={view} frame={frame} farX={box.u0} headTopY={HEAD_TOP} /> : null}
      {op && view === 'side' ? <BoomOperator view={view} poses={OPERATOR_POSES} stub={POLE_STUB} /> : null}
      <VoiceFigure view={view} variant={variant} />
      {variant === 'set' ? <Counter view={view} box={COUNTER_BOX} keys={KEYS} jar={JAR} /> : null}
      {op && view === 'top' ? <BoomOperator view={view} poses={OPERATOR_POSES} stub={POLE_STUB} /> : null}
      {onSet(variant) ? <CameraRig view={view} spec={CAMERA} /> : null}
    </Group>
  );
}

export function LocationInstrument({ view, variant }: { view: ViewId; variant: VariantId }): ReactElement {
  return <LocationScene view={view} variant={variant} />;
}

export function locationLabels(view: ViewId, variant: VariantId): ArtLabel[] {
  const out: ArtLabel[] = voiceLabels(view, variant).filter((l) => l.id !== 'v.folds');
  if (onSet(variant)) {
    if (view === 'side') {
      out.push({ id: 'f9.camera', text: 'CAMERA', u: CAMERA_BOX.max.x - 120, v: CAMERA_BOX.min.y - 140, align: 'center', at: { u: CAMERA_BOX.max.x - 150, v: CAMERA_BOX.min.y + 40 } });
      out.push({ id: 'f9.frame', text: 'TOP OF THE FRAME', short: 'FRAME', u: 1700, v: -560, align: 'center', tone: 'muted', at: { u: 1700, v: FRAME.top + (LENS.y - FRAME.top) * (1700 / LENS.x) } });
      out.push({ id: 'f9.operator', text: 'BOOM OPERATOR', short: 'OPERATOR', u: OPERATOR.feet.x + 180, v: 620, align: 'left', tone: 'muted', at: { u: OPERATOR.feet.x + 60, v: 600 } });
    } else {
      out.push({ id: 'f9.camera', text: 'CAMERA', u: CAMERA_BOX.max.x - 100, v: CAMERA_BOX.max.z + 260, align: 'center', at: { u: CAMERA_BOX.max.x - 150, v: 40 } });
      out.push({ id: 'f9.operator', text: 'BOOM OPERATOR', short: 'OPERATOR', u: OPERATOR.feet.x + 280, v: OPERATOR.feet.z - 180, align: 'left', tone: 'muted', at: { u: OPERATOR.feet.x + 80, v: OPERATOR.feet.z } });
      out.push({ id: 'f9.frame', text: 'THE SHOT', short: 'SHOT', u: 1500, v: 620, align: 'center', tone: 'muted', at: { u: 1500, v: 420 } });
    }
  }
  if (variant === 'set') {
    if (view === 'side') out.push({ id: 'f9.keys', text: 'KEYS', u: KEYS.x - 40, v: KEYS.y - 170, align: 'center', at: { u: KEYS.x, v: KEYS.y - 8 } });
    else out.push({ id: 'f9.keys', text: 'KEYS', u: KEYS.x, v: KEYS.z - 170, align: 'center', at: { u: KEYS.x, v: KEYS.z } });
    out.push({ id: 'f9.counter', text: 'COUNTER', u: (COUNTER_BOX.min.x + COUNTER_BOX.max.x) / 2, v: view === 'side' ? 1080 : COUNTER_BOX.max.z - 90, align: 'center', tone: 'muted' });
  }
  if (variant === 'outdoor') {
    if (view === 'side') out.push({ id: 'f9.line', text: '3 m (10 ft) FROM THE POWER LINE ABOVE', short: '3 m FROM THE LINE', u: -1420, v: -1220, align: 'left', at: { u: -1200, v: POWER_LINE.a.y + 3000 } });
    else out.push({ id: 'f9.line', text: 'POWER LINE', u: POWER_LINE.a.x + 340, v: -1250, align: 'left', at: { u: POWER_LINE.a.x, v: -1100 } });
  }
  return out;
}

const inBox = (u: number, v: number, x0: number, x1: number, y0: number, y1: number, tol: number) => u >= x0 - tol && u <= x1 + tol && v >= y0 - tol && v <= y1 + tol;

export function locationHitTest(view: ViewId, variant: VariantId, u: number, v: number, tol: number): string | null {
  const own = voiceHitTest(view, variant, u, v, tol);
  if (own) return own;
  const vv = (p: { y: number; z: number }) => (view === 'side' ? p.y : p.z);
  if (onSet(variant)) {
    if (inBox(u, v, CAMERA_BOX.min.x, CAMERA_BOX.max.x, vv(CAMERA_BOX.min), vv(CAMERA_BOX.max), tol)) return 'f9.camera';
    if (figureCovers(view === 'side' ? OPERATOR_POSES.side : OPERATOR_POSES.top, u, v, tol)) return 'f9.operator';
  }
  if (variant === 'set') {
    if (Math.hypot(u - KEYS.x, v - vv(KEYS)) <= 60 + tol) return 'f9.keys';
    if (inBox(u, v, COUNTER_BOX.min.x, COUNTER_BOX.max.x, vv(COUNTER_BOX.min), vv(COUNTER_BOX.max), tol)) return 'f9.counter';
  }
  if (variant === 'outdoor' && view === 'top' && Math.abs(u - POWER_LINE.a.x) <= 300 + tol) return 'f9.line';
  return null;
}

export function locationFigureAt(view: ViewId, variant: VariantId, u: number, v: number, tol: number): boolean {
  if (voiceFigureAt(view, variant, u, v, tol)) return true;
  return onSet(variant) && figureCovers(view === 'side' ? OPERATOR_POSES.side : OPERATOR_POSES.top, u, v, tol);
}
