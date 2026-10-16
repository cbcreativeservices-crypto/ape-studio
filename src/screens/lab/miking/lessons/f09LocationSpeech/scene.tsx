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
import { operatorSide, operatorTop } from '../shared/measure/measureModel.ts';
import { MicAt } from '../shared/field/FieldStage';
import { BeltPack } from '../shared/broadcast/BodyWornArt';
import { packAt } from '../shared/broadcast/bodyWorn.ts';
import { BOOM, BOOM_FUR, CAMERA_BOX, COUNTER_BOX, F09_VIEWS, FLOOR, FRAME, GRIP, HEAD_TOP, JAR, KEYS, LAV_P, LENS, OPERATOR, POWER_LINE, TRIPOD } from './geometry.ts';
import { LavRun } from './lavRun';

export const CAMERA: CameraSpec = { box: CAMERA_BOX, lens: LENS, floor: FLOOR, spread: TRIPOD.spread };
/** The pole's rear end, behind the front hand: along the line from the boom's
 *  starting tail through the grip (a drawing default, 1.05 m). */
const TAIL = { x: BOOM.tip.x - BOOM.aim.x * 250, y: BOOM.tip.y - BOOM.aim.y * 250, z: BOOM.tip.z - BOOM.aim.z * 250 };
const RD = (() => { const d = { x: GRIP.x - TAIL.x, y: GRIP.y - TAIL.y, z: GRIP.z - TAIL.z }; const l = Math.hypot(d.x, d.y, d.z); return { x: d.x / l, y: d.y / l, z: d.z / l }; })();
export const POLE_STUB = { a: GRIP, b: { x: GRIP.x + RD.x * 1050, y: GRIP.y + RD.y * 1050, z: GRIP.z + RD.z * 1050 } };
/** The rear hand on the pole, 0.8 m behind the front hand along the pole — the pole runs across the
 *  view, so the hands look closer from the side (a drawing default). */
export const REAR_HAND = { x: GRIP.x + RD.x * 800, y: GRIP.y + RD.y * 800, z: GRIP.z + RD.z * 800 };
export const OPERATOR_POSES = operatorPoses(OPERATOR.feet, GRIP, { rear: REAR_HAND });
/** The operator standing by, arms down (a setup that uses no boom). */
const IDLE_POSES = {
  side: operatorSide(OPERATOR.feet.x + 28, FLOOR, -1),
  top: { ...operatorTop(OPERATOR.feet.x, OPERATOR.feet.z, 1), facing: Math.atan2(-OPERATOR.feet.z, -OPERATOR.feet.x) },
};
/** The whole pole when the scene holds its own boom (no mic placed): from the
 *  mic's mount through both hands to the rear end. */
const FULL_POLE = { a: TAIL, b: POLE_STUB.b };
const TAIL_FUR = { x: BOOM_FUR.tip.x - BOOM_FUR.aim.x * 420, y: BOOM_FUR.tip.y - BOOM_FUR.aim.y * 420, z: BOOM_FUR.tip.z - BOOM_FUR.aim.z * 420 };
const FULL_POLE_FUR = { a: TAIL_FUR, b: POLE_STUB.b };
/** The pack on the back of the belt, the lav's tail (the body mic). */
export const LAV_PACK = packAt(true);
const LAV_TAIL = { x: LAV_P.x - 3, y: LAV_P.y + 16, z: 0 };

/** What the operator does in a drawing: holds the scene's own boom ('full',
 *  no mic placed: a part tour), holds the pole's end of a placed boom
 *  ('stub'), or stands by with the arms down ('idle', a setup with no boom). */
export type OperatorMode = 'full' | 'stub' | 'idle';
const isPole = (t: string) => t.startsWith('locBoom');
export function operatorMode(micTypes?: readonly string[]): OperatorMode {
  if (!micTypes || micTypes.length === 0) return 'full';
  return micTypes.some(isPole) ? 'stub' : 'idle';
}

const onSet = (v: VariantId) => v === 'set' || v === 'outdoor';

/** Everything round the talker, drawn far side first. `frame` swaps the
 *  shot drawn (MEET IT's frame-line step); `operator` hides the operator. */
/** `lav`: the body mic's bodypack on the belt; `lavCable`: its cable too (a
 *  page's own drawing — in the Placement scene the engine draws the cable,
 *  LavLead, from the lav rim's lead). */
export function LocationScene({ view, variant, frame = FRAME, operator = true, mode = 'full', lav = false, lavCable = true }: { view: ViewId; variant: VariantId; frame?: typeof FRAME; operator?: boolean; mode?: OperatorMode; lav?: boolean; lavCable?: boolean }): ReactElement {
  const box = F09_VIEWS[variant as 'set' | 'outdoor' | 'live']?.[view] ?? F09_VIEWS.set[view];
  const op = operator && onSet(variant);
  const fur = variant === 'outdoor';
  const opArt =
    mode === 'idle' ? (
      // From above the hanging hands are under the cuffs (not drawn).
      <BoomOperator view={view} poses={IDLE_POSES} hands={view === 'side'} />
    ) : (
      <BoomOperator view={view} poses={OPERATOR_POSES} stub={mode === 'full' ? (fur ? FULL_POLE_FUR : FULL_POLE) : POLE_STUB} />
    );
  // The scene's own boom mic (a part tour): the shotgun in its suspension at
  // the starting place, outdoors in its basket windshield.
  const ownMic = op && mode === 'full' ? (fur ? <MicAt view={view} p={BOOM_FUR.tip} aim={BOOM_FUR.aim} art="blimp" r={45} len={420} /> : <MicAt view={view} p={BOOM.tip} aim={BOOM.aim} art="shotgun" r={9.5} len={250} />) : null;
  return (
    <Group>
      {variant === 'outdoor' ? <PowerLineArt view={view} line={POWER_LINE} box={box} /> : null}
      {onSet(variant) ? <FrameLines view={view} frame={frame} farX={box.u0} headTopY={HEAD_TOP} /> : null}
      {op && view === 'side' ? opArt : null}
      {lav && view === 'side' ? <BeltPack view="side" at={LAV_PACK} /> : null}
      <VoiceFigure view={view} variant={variant} />
      {lav && lavCable ? <LavRun view={view} from={LAV_TAIL} pack={LAV_PACK} /> : null}
      {lav && view === 'top' ? <BeltPack view="top" at={LAV_PACK} /> : null}
      {variant === 'set' ? <Counter view={view} box={COUNTER_BOX} keys={KEYS} jar={JAR} /> : null}
      {op && view === 'top' ? opArt : null}
      {ownMic}
      {onSet(variant) ? <CameraRig view={view} spec={CAMERA} /> : null}
    </Group>
  );
}

/** The engine's scene: the operator and the body mic's pack dressed for the
 *  mics placed (sceneTypes Instrument.micTypes). */
export function LocationInstrument({ view, variant, micTypes }: { view: ViewId; variant: VariantId; micTypes?: readonly string[] }): ReactElement {
  return <LocationScene view={view} variant={variant} mode={operatorMode(micTypes)} lav={!!micTypes?.includes('locLav')} lavCable={false} />;
}

export function locationLabels(view: ViewId, variant: VariantId): ArtLabel[] {
  const out: ArtLabel[] = voiceLabels(view, variant).filter((l) => l.id !== 'v.folds');
  if (onSet(variant)) {
    if (view === 'side') {
      out.push({ id: 'f9.camera', text: 'CAMERA', u: CAMERA_BOX.max.x - 120, v: CAMERA_BOX.min.y - 140, align: 'center', at: { u: CAMERA_BOX.max.x - 150, v: CAMERA_BOX.min.y + 40 } });
      // Pointed at the line between the operator's rear hand and the camera
      // (art fix 2026-10-16: the leader landed on the operator's arm).
      out.push({ id: 'f9.frame', text: 'TOP OF THE FRAME', short: 'FRAME', u: 2000, v: -560, align: 'center', tone: 'muted', at: { u: 2000, v: FRAME.top + (LENS.y - FRAME.top) * (2000 / LENS.x) } });
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
