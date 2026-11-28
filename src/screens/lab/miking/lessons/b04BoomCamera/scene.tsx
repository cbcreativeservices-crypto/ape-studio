/**
 * B04 BOOM AND CAMERA-MOUNTED PICKUP — the scene (charter §2 layer 3): the
 * talker is the voice family's standing figure in a jacket (BodyWornArt), the
 * camera on its tripod with its frame's edges and the headroom band
 * (CameraArt), the boom operator outside the frame holding the pole's end
 * (the location kit's BoomOperator); live, the PA at the stage's corner.
 * Art fix 2026-10-16: the operator holds ONE straight pole in both hands
 * above the head (the near arm on the rear hand, so no arm crosses the
 * face), the whole boom with its mic when no mic is placed, and stands by
 * when the placed mic is not on the pole. Static (D8). Labels name what a
 * mic decision needs.
 */
import type { ReactElement } from 'react';
import { Group } from '@shopify/react-native-skia';
import type { VariantId, ViewId, Vec3 } from '../../engine/model/types.ts';
import type { PlayerPose } from '../shared/players/playerPose.ts';
import type { ArtLabel } from '../../engine/scene/sceneTypes.ts';
import { voiceFigureAt, voiceHitTest } from '../shared/voice/VoiceArt';
import { SINGER_SIDE, SINGER_TOP } from '../shared/voice/voicePose.ts';
import { figureCovers } from '../shared/players/PlayerFigure';
import { PaSpeaker } from '../shared/broadcast/BroadcastArt';
import { StandingPresenter } from '../shared/broadcast/BodyWornArt';
import { BroadcastCameraRig, FrameWedge } from '../shared/broadcast/CameraArt';
import { BoomOperator, operatorPoses } from '../shared/field/LocationArt';
import { cameraBody, toLocationFrame } from '../shared/broadcast/cameraFrame.ts';
import { frameTopY } from '../shared/field/location.ts';
import { MicAt } from '../shared/field/FieldStage';
import { operatorSide, operatorTop } from '../shared/measure/measureModel.ts';
import { SHOTGUN_BODY } from '../shared/fieldmics/fieldMics.ts';
import { SHOTGUN_CAPSULE_MM } from '../shared/field/fieldMics.ts';
import { B04_VIEWS, BOOM_ABOVE, BOOM_BELOW, BOOM_WIDE, CAM_OF, FLOOR, GRIP_CLOSE, GRIP_LOW, GRIP_WIDE, HEAD_TOP, OP_FEET_CLOSE, OP_FEET_WIDE, PA_C } from './geometry.ts';
import { figureV2On } from '../shared/figureV2/figureV2Config';
import { castFor } from '../shared/figureV2/cast';
import { BoomOperatorV2, type BoomRig } from '../shared/figureV2/BoomV2';
import { PersonSideV2, PersonTopV2, personCovers, personTopCovers } from '../shared/figureV2/personV2';

/** (figure V2, wave 4: the whole lesson in the new look — the presenter Ruth in her jacket, the boom operator
 *  Mei holding the pole in both hands, B04's interviewer Kofi; in every picture of this lesson, or in none) */
export const V2 = figureV2On('frontAndBoom');
const OP_WHO = castFor('operator.boom');

type V = 'close' | 'wide' | 'live';
const vOf = (v: VariantId): V => (v === 'wide' ? 'wide' : v === 'live' ? 'live' : 'close');

const len3 = (a: Vec3) => Math.hypot(a.x, a.y, a.z) || 1;
const along = (a: Vec3, d: Vec3, k: number): Vec3 => ({ x: a.x + d.x * k, y: a.y + d.y * k, z: a.z + d.z * k });

/** One straight pole (art fix 2026-10-16): from the mic's tail (the shotgun's
 *  capsule 200 mm behind its tip, its body 50 mm more) through the front hand
 *  at `grip`, on behind it — the rear hand 420 mm back along the same line, the
 *  pole's end 700 mm back (drawing defaults). */
function poleLine(grip: Vec3, boom: { tip: Vec3; aim: Vec3 }) {
  const tail = along(boom.tip, boom.aim, -(SHOTGUN_CAPSULE_MM + SHOTGUN_BODY.length.mm));
  const l = len3({ x: grip.x - tail.x, y: grip.y - tail.y, z: grip.z - tail.z });
  const dir = { x: (grip.x - tail.x) / l, y: (grip.y - tail.y) / l, z: (grip.z - tail.z) / l };
  return { tail, tip: boom.tip, aim: boom.aim, rear: along(grip, dir, 420), stub: { a: grip, b: along(grip, dir, 700) } };
}
const POLE_CLOSE = poleLine(GRIP_CLOSE, BOOM_ABOVE);
const POLE_WIDE = poleLine(GRIP_WIDE, BOOM_WIDE);
/** Owner 2026-10-16 (setup 5): the pole from the mic below the frame to the
 *  hands held low (geometry GRIP_LOW: the engine clamps that setup's pole
 *  there, Rim.zones), on behind them along the same straight line. */
const POLE_LOW = poleLine(GRIP_LOW, BOOM_BELOW);
/** (figure V2) the low hold's stance: LOW_STEP mm to the operator's left of the overhead stance. */
export const LOW_STEP = 180;
export const LOW_BACK = 150;
/** (figure V2) held low the hands are closer on the pole: the rear hand 28 cm behind the front (a drawing default). */
const LOW_GAP = 280;
const LOW_FEET = (() => {
  // (her left, facing the pole's front hand from her feet: the plan perpendicular)
  const f = { x: GRIP_LOW.x - OP_FEET_CLOSE.x, z: GRIP_LOW.z - OP_FEET_CLOSE.z };
  const l = Math.hypot(f.x, f.z) || 1;
  // (facing f, her right is (−f.z, f.x)/l; her left the opposite)
  // (…and LOW_BACK mm back, so both hands are in front of her, the rear one at her right ribs)
  return { x: OP_FEET_CLOSE.x + (f.z / l) * LOW_STEP - (f.x / l) * LOW_BACK, y: OP_FEET_CLOSE.y, z: OP_FEET_CLOSE.z - (f.x / l) * LOW_STEP - (f.z / l) * LOW_BACK };
})();
export const OPERATOR = {
  // Art fix 2026-10-16 (B04 graded "the arm crosses his face"): the near arm
  // takes the rear hand on the pole, the far arm the front hand (LocationArt
  // operatorPoses `rear`), both hands on the pole's one line.
  close: { poses: operatorPoses(OP_FEET_CLOSE, GRIP_CLOSE, { rear: POLE_CLOSE.rear }), stub: POLE_CLOSE.stub, pole: POLE_CLOSE },
  wide: { poses: operatorPoses(OP_FEET_WIDE, GRIP_WIDE, { rear: POLE_WIDE.rear }), stub: POLE_WIDE.stub, pole: POLE_WIDE },
  // Same stance, the pole held LOW (the below-the-frame starting setup only).
  // (figure V2, FrontBoom2 2026-11-24: held low the pole passes BESIDE the operator — she stands a step to her left
  // of the old place, so the pole runs past her right side at the ribs, never through her body; a drawing default,
  // the grip and the mic unchanged)
  low: { poses: operatorPoses(V2 ? LOW_FEET : OP_FEET_CLOSE, GRIP_LOW, { rear: POLE_LOW.rear, low: true }), stub: POLE_LOW.stub, pole: POLE_LOW },
} as const;
/** The starting setup that holds the boom low (B04_ZONES: below the frame). */
export const LOW_HOLD_SETUP = 'b4.below';
const POLE_MICS: readonly string[] = ['locBoomSgCap', 'locBoomHyper', 'locBoomFurCap'];

/** What the operator does in a drawing (the same three as F09's, art fix
 *  2026-10-16): holds the scene's own boom ('full': no mic placed — the part
 *  tour), holds the pole's end of a placed boom ('stub': the engine draws the
 *  mic and the pole to the front hand), or stands by, arms down ('idle': a
 *  setup with no boom — the camera's mic or the lav alone). */
export type OperatorMode = 'full' | 'stub' | 'idle';
export function operatorMode(micTypes?: readonly string[]): OperatorMode {
  if (!micTypes || micTypes.length === 0) return 'full';
  return micTypes.some((t) => POLE_MICS.includes(t)) ? 'stub' : 'idle';
}
const idlePoses = (feet: Vec3) => ({
  side: operatorSide(feet.x + 28, feet.y, -1),
  top: { ...operatorTop(feet.x, feet.z, 1), facing: Math.atan2(-feet.z, -feet.x) },
});
const IDLE = { close: idlePoses(OP_FEET_CLOSE), wide: idlePoses(OP_FEET_WIDE) } as const;
const opOf = (v: V) => (v === 'wide' ? OPERATOR.wide : OPERATOR.close);

/** (figure V2) each hold as a rig for the new operator: the lesson's own hand points on the pole, the pole
 *  drawn from `a` (the mic's tail, or the front hand) to its rear end; the near arm (the operator's left) on
 *  the rear hand overhead, on the front hand held low — as the old drawing chose. */
type Op = (typeof OPERATOR)[keyof typeof OPERATOR];
const rigOf = (op: Op, front: Vec3, a: Vec3, low: boolean): BoomRig => ({ side: op.poses.side, top: op.poses.top, front, rear: op.pole.rear, pole: { a, b: op.stub.b }, rearArm: low ? 'R' : 'L' });
const lowRear = along(GRIP_LOW, { x: (POLE_LOW.rear.x - GRIP_LOW.x) / 420, y: (POLE_LOW.rear.y - GRIP_LOW.y) / 420, z: (POLE_LOW.rear.z - GRIP_LOW.z) / 420 }, LOW_GAP);
const RIGS = {
  close: { full: rigOf(OPERATOR.close, GRIP_CLOSE, OPERATOR.close.pole.tail, false), stub: rigOf(OPERATOR.close, GRIP_CLOSE, GRIP_CLOSE, false) },
  wide: { full: rigOf(OPERATOR.wide, GRIP_WIDE, OPERATOR.wide.pole.tail, false), stub: rigOf(OPERATOR.wide, GRIP_WIDE, GRIP_WIDE, false) },
  low: { full: { ...rigOf(OPERATOR.low, GRIP_LOW, OPERATOR.low.pole.tail, true), rear: lowRear }, stub: { ...rigOf(OPERATOR.low, GRIP_LOW, GRIP_LOW, true), rear: lowRear } },
};
/** (the study page draws the lesson's own rigs) */
export const B04_V2_RIGS = RIGS;
/** The operator standing by in the new look (arms down, the hands at rest). */
function IdleV2({ view, poses }: { view: ViewId; poses: { side: PlayerPose; top: PlayerPose } }) {
  return view === 'side' ? <PersonSideV2 pose={poses.side} who={OP_WHO} opts={{ rest: 'restSide' }} dim={0.82} /> : <PersonTopV2 pose={poses.top} who={OP_WHO} dim={0.82} />;
}

/** Everything round the talker, far side first. `headless`: the talker drawn
 *  without a head (a step draws it turned); `operator` false hides the
 *  operator (a step draws its own boom); `micTypes`: the mics the engine has
 *  placed (the operator's mode); `setup`: the starting setup's points (the
 *  engine, STARTING SETUPS only): the below-the-frame one holds the boom low. */
export function B04Scene({ view, variant, headless = false, operator = true, camera = true, micTypes, setup }: { view: ViewId; variant: VariantId; headless?: boolean; operator?: boolean; camera?: boolean; micTypes?: readonly string[]; setup?: readonly string[] }): ReactElement {
  const v = vOf(variant);
  const cam = CAM_OF[v];
  const box = B04_VIEWS[v][view];
  const mode = operatorMode(micTypes);
  const low = mode === 'stub' && v === 'close' && !!setup?.includes(LOW_HOLD_SETUP);
  const op = low ? OPERATOR.low : opOf(v);
  const rigs = low ? RIGS.low : v === 'wide' ? RIGS.wide : RIGS.close;
  const opArt = V2 ? (
    mode === 'idle' ? (
      <IdleV2 view={view} poses={IDLE[v === 'wide' ? 'wide' : 'close']} />
    ) : (
      <BoomOperatorV2 view={view === 'side' ? 'side' : 'top'} rig={mode === 'full' ? rigs.full : rigs.stub} who={OP_WHO} />
    )
  ) : mode === 'idle' ? (
    <BoomOperator view={view} poses={IDLE[v === 'wide' ? 'wide' : 'close']} />
  ) : (
    <BoomOperator view={view} poses={op.poses} stub={mode === 'full' ? { a: op.pole.tail, b: op.stub.b } : op.stub} low={low} />
  );
  // The scene's own boom mic (no mic placed): the short shotgun in its
  // suspension at the starting place, aimed at the mouth.
  const ownMic = operator && mode === 'full' ? <MicAt view={view} p={op.pole.tip} aim={op.pole.aim} art="shotgun" r={9.5} len={250} /> : null;
  return (
    <Group>
      {v === 'live' ? <PaSpeaker view={view} c={PA_C} faces={1} floor={FLOOR} /> : null}
      {camera ? <FrameWedge view={view} cam={cam} reach={cam.lens.x - box.u0} headTop={HEAD_TOP} /> : null}
      {operator && view === 'side' ? opArt : null}
      <StandingPresenter view={view} headless={headless} v2={V2} />
      {operator && view === 'top' ? opArt : null}
      {ownMic}
      {camera ? <BroadcastCameraRig view={view} cam={cam} floor={FLOOR} /> : null}
    </Group>
  );
}

export function B04Instrument({ view, variant, micTypes, setup }: { view: ViewId; variant: VariantId; micTypes?: readonly string[]; setup?: readonly string[] }): ReactElement {
  return <B04Scene view={view} variant={variant} micTypes={micTypes} setup={setup} />;
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
    // Named between the operator and the camera, clear of the raised arms.
    out.push({ id: 'b4.frame', text: 'TOP OF THE FRAME', short: 'FRAME', u: L.x * 0.8, v: frameTopY(toLocationFrame(cam), L.x * 0.8) + 330, align: 'center', tone: 'muted', at: { u: L.x * 0.8, v: frameTopY(toLocationFrame(cam), L.x * 0.8) } });
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

/** (figure V2) the presenter's new outline (labels keep off it and the old envelope both). */
const PRESENTER_OPTS = { lip: { u: 0, v: 0 }, rest: 'restSide' as const, jacket: true };
function presenterCovers(view: ViewId, u: number, v: number, tol: number): boolean {
  if (!V2) return false;
  const who = castFor('presenter');
  return view === 'side' ? personCovers(SINGER_SIDE, who, PRESENTER_OPTS, u, v, tol) : personTopCovers(SINGER_TOP, who, { jacket: true }, u, v, tol);
}

export function b04FigureAt(view: ViewId, variant: VariantId, u: number, v: number, tol: number): boolean {
  if (presenterCovers(view, u, v, tol)) return true;
  if (voiceFigureAt(view, variant, u, v, tol)) return true;
  const op = opOf(vOf(variant));
  return figureCovers(view === 'side' ? op.poses.side : op.poses.top, u, v, tol);
}
