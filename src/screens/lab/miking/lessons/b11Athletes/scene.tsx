/**
 * B11 ATHLETES, COACHES AND OFFICIALS — the scene (charter §2 layer 3): the
 * wearer standing (shared/broadcast/SportSpeechArt), the body-worn chain on
 * them in profile (the cable's strain-relief loop, the pack at the small of
 * the back, the antenna straight), the team's own headset on a coach and an
 * official, the field's edge in front; the perimeter boom operator (coach),
 * the PA (official), the keep-out regions on an athlete. Static (D8).
 */
import type { ReactElement } from 'react';
import { Group } from '@shopify/react-native-skia';
import type { VariantId, ViewId } from '../../engine/model/types.ts';
import type { ArtLabel } from '../../engine/scene/sceneTypes.ts';
import { useKeepOutsAtRest } from '../../engine/scene/keepOuts.ts';
import { BoomOperator, operatorPoses } from '../shared/field/LocationArt';
import { figureCovers } from '../shared/players/PlayerFigure';
import { OnTalker, PaSpeaker, Headphones } from '../shared/broadcast/BroadcastArt';
import { BodyChain, KeepOutRegion, PlayAreaHatch, StandingTalker, standingCovers } from '../shared/broadcast/SportSpeechArt';
import { TORSO, bodyWornChain, keepOutsOf } from '../shared/broadcast/standing.ts';
import { HEAD_C, HEAD_R } from '../shared/voice/voiceSpec.ts';
import { SINGER_SOLIDS } from '../shared/voice/voicePose.ts';
import { FIELD_X, FLOOR, GRIP, OPERATOR, PA_C, WEARER } from './geometry.ts';
import { figureV2On } from '../shared/figureV2/figureV2Config';
import { castFor } from '../shared/figureV2/cast';
import { BoomOperatorV2, fistDisk, type BoomRig } from '../shared/figureV2/BoomV2';
import { alongPole } from '../shared/figureV2/boomGrip.ts';
import { StandingTalkerV2, standingCoversV2 } from '../shared/figureV2/standingV2';

/** (figure V2, wave 4: the whole lesson in the new look — the wearer Kofi, the perimeter boom operator Mei
 *  holding the pole in both hands; in every picture and step of this lesson, or in none) */
export const V2 = figureV2On('frontAndBoom');

export const OPERATOR_POSES = operatorPoses(OPERATOR.feet, GRIP);
const POLE_STUB = { a: GRIP, b: { x: GRIP.x - 380, y: GRIP.y + 420, z: GRIP.z - 300 } };
/** (figure V2) the perimeter boom as a rig: the front hand on the lesson's grip, the rear hand 420 mm back
 *  along the pole's own line (the old drawing's stub; a drawing default), the near arm on the rear hand. */
const RIG: BoomRig = { side: OPERATOR_POSES.side, top: OPERATOR_POSES.top, front: GRIP, rear: alongPole(GRIP, POLE_STUB.b, 420), pole: POLE_STUB, rearArm: 'L' };
const SIDE_UV = (p: { x: number; y: number }) => ({ u: p.x, v: p.y });
const TOP_UV = (p: { x: number; z: number }) => ({ u: p.x, v: p.z });
const CHEST = bodyWornChain('chest');
const HEAD = bodyWornChain('headset');

function KeepOuts({ view }: { view: ViewId }) {
  const show = useKeepOutsAtRest();
  if (!show) return null;
  return (
    <Group>
      {keepOutsOf('athlete').map((k) => (
        <KeepOutRegion key={k.id} shape={k.shape} uv={view === 'side' ? SIDE_UV : TOP_UV} />
      ))}
    </Group>
  );
}

export function B11Scene({ view, variant, headless = false }: { view: ViewId; variant: VariantId; headless?: boolean }): ReactElement {
  const coach = variant === 'coach';
  const official = variant === 'official';
  const athlete = variant === 'athlete';
  const side = view === 'side';
  return (
    <Group>
      {!athlete ? <PlayAreaHatch view={view} x={FIELD_X} depth={700} z0={-2900} z1={700} floor={FLOOR} /> : null}
      {official ? <PaSpeaker view={view} c={PA_C} faces={1} floor={FLOOR} /> : null}
      {side ? <BodyChain uv={SIDE_UV} chain={official ? HEAD : CHEST} /> : null}
      {coach && side ? V2 ? <BoomOperatorV2 view="side" rig={RIG} who={castFor('operator.boom')} dim={0.6} /> : <BoomOperator view={view} poses={OPERATOR_POSES} stub={POLE_STUB} dim={0.6} /> : null}
      {V2 ? <StandingTalkerV2 view={view} t={WEARER} headless={headless} /> : <StandingTalker view={view} t={WEARER} headless={headless} />}
      {!athlete && !headless ? (
        <OnTalker view={view} t={WEARER}>
          <Headphones view={view} />
        </OnTalker>
      ) : null}
      {athlete ? <KeepOuts view={view} /> : null}
      {coach && !side ? V2 ? <BoomOperatorV2 view="top" rig={RIG} who={castFor('operator.boom')} /> : <BoomOperator view={view} poses={OPERATOR_POSES} stub={POLE_STUB} /> : null}
    </Group>
  );
}

/** (figure V2, 2026-11-24; LessonArt.poleHandsOver) After the engine's pole (the perimeter boom placed: the pole from
 *  the mic to her front hand): the operator's front fist again — the rig and look the scene draws her with — so the
 *  pole passes THROUGH the closed hand, never laid over it. */
export function B11HandsOver({ view, variant, micTypes }: { view: ViewId; variant: VariantId; micTypes?: readonly string[] }): ReactElement | null {
  if (!V2 || variant !== 'coach' || !micTypes?.includes('locBoomSgCap')) return null;
  const side = view === 'side';
  return (
    <Group clip={fistDisk(view, GRIP)}>
      <BoomOperatorV2 view={side ? 'side' : 'top'} rig={RIG} who={castFor('operator.boom')} part="hands" {...(side ? { dim: 0.6 } : {})} />
    </Group>
  );
}

export function B11Instrument({ view, variant }: { view: ViewId; variant: VariantId }): ReactElement {
  return <B11Scene view={view} variant={variant} />;
}

export function b11Labels(view: ViewId, variant: VariantId): ArtLabel[] {
  const coach = variant === 'coach';
  const official = variant === 'official';
  const athlete = variant === 'athlete';
  if (view === 'side') {
    const out: ArtLabel[] = [
      { id: 'v.mouth', text: 'MOUTH', u: 150, v: -200, align: 'left', at: { u: 0, v: 2 }, alts: [{ u: 180, v: 120, align: 'left' }] },
    ];
    if (!athlete) out.push({ id: 'b11.teamset', text: 'TEAM HEADSET', short: 'TEAM SET', u: -330, v: -330, align: 'right', tone: 'muted', at: { u: HEAD_C.x + 20, v: HEAD_C.y - 40 } });
    // (FrontBoom3, review 2026-11-24: "the FIELD leader line is drawn across Mei's legs") its other places over the
    // field itself, clear of the operator's legs: the text is pushed there before it would lead back across her
    if (!athlete) out.push({ id: 'b11.field', text: 'FIELD · NO CREW IN PLAY', short: 'FIELD', u: FIELD_X + 300, v: FLOOR + 55, align: 'center', tone: 'muted', alts: [{ u: FIELD_X + 360, v: FLOOR - 220, align: 'center' }] });
    if (official) out.push({ id: 'b11.pa', text: 'PA', u: PA_C.x - 360, v: PA_C.y - 100, align: 'right', at: { u: PA_C.x - 150, v: PA_C.y } });
    // Above the operator's raised pole, where no other label or leader runs
    // (owner decision X6, 2026-10-08: its leader crossed TEAM HEADSET's).
    if (coach) out.push({ id: 'b11.operator', text: 'PERIMETER BOOM', short: 'BOOM', u: OPERATOR.feet.x, v: -700, align: 'center', tone: 'muted' });
    return out;
  }
  const out: ArtLabel[] = [{ id: 'v.mouth', text: 'MOUTH', u: 170, v: 220, align: 'left', at: { u: 2, v: 0 }, alts: [{ u: 170, v: -220, align: 'left' }] }];
  if (!athlete) out.push({ id: 'b11.field', text: 'FIELD', u: FIELD_X + 350, v: 300, align: 'center', tone: 'muted' });
  if (official) out.push({ id: 'b11.pa', text: 'PA', u: PA_C.x, v: PA_C.z + 380, align: 'center', at: { u: PA_C.x, v: PA_C.z + 150 } });
  // (FrontBoom3, review 2026-11-24: "the PERIMETER BOOM dot sits on her hair") the leader lands on the pole itself,
  // out past her rear hand — the thing it names — never on her head
  if (coach) {
    const on = alongPole(GRIP, POLE_STUB.b, 520);
    out.push({ id: 'b11.operator', text: 'PERIMETER BOOM', short: 'BOOM', u: OPERATOR.feet.x + 330, v: OPERATOR.feet.z - 120, align: 'left', tone: 'muted', at: { u: on.x, v: on.z } });
  }
  return out;
}

const inBox = (u: number, v: number, x0: number, x1: number, y0: number, y1: number, tol: number) => u >= x0 - tol && u <= x1 + tol && v >= y0 - tol && v <= y1 + tol;

export function b11HitTest(view: ViewId, variant: VariantId, u: number, v: number, tol: number): string | null {
  const vv = (p: { y: number; z: number }) => (view === 'side' ? p.y : p.z);
  if (Math.hypot(u - 2, v - (view === 'side' ? 2 : 0)) <= 16 + tol) return 'v.mouth';
  if (variant !== 'athlete' && view === 'side' && Math.hypot(u - (HEAD_C.x + 20), v - (HEAD_C.y - 40)) <= 50 + tol) return 'b11.teamset';
  if (Math.hypot(u - HEAD_C.x, v - (view === 'side' ? HEAD_C.y : 0)) <= HEAD_R + tol) return 'v.head';
  if (view === 'side' && Math.hypot(u - TORSO.smallOfBack.x, v - TORSO.smallOfBack.y) <= 70 + tol) return 'b11.pack';
  const T = SINGER_SOLIDS.torso;
  if (T.kind === 'box' && inBox(u, v, T.min.x, T.max.x, vv(T.min), vv(T.max), tol)) return 'v.chest';
  if (variant !== 'athlete' && u > FIELD_X - tol) return variant === 'official' && Math.hypot(u - PA_C.x, v - vv(PA_C)) <= 320 + tol ? 'b11.pa' : 'b11.field';
  if (variant === 'coach' && figureCovers(view === 'side' ? OPERATOR_POSES.side : OPERATOR_POSES.top, u, v, tol)) return 'b11.operator';
  return null;
}

export function b11FigureAt(view: ViewId, variant: VariantId, u: number, v: number, tol: number): boolean {
  // (drawn new: the new outline and the old envelope — labels keep off both)
  if (V2 && standingCoversV2(view, WEARER, u, v, tol)) return true;
  if (standingCovers(view, WEARER, u, v, tol)) return true;
  return variant === 'coach' && figureCovers(view === 'side' ? OPERATOR_POSES.side : OPERATOR_POSES.top, u, v, tol);
}
