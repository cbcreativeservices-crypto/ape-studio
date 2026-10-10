/**
 * B01 RADIO, PODCAST AND STUDIO HOSTS — the scene (charter §2 layer 3): the
 * host and the second host seated at the desk (shared/broadcast/
 * BroadcastArt), their chairs, the arm clamps, the laptops and the script;
 * live, the PA at the stage's front corner. Static (D8). Labels name what a
 * mic decision needs.
 */
import type { ReactElement } from 'react';
import { Group } from '@shopify/react-native-skia';
import type { VariantId, ViewId } from '../../engine/model/types.ts';
import type { ArtLabel } from '../../engine/scene/sceneTypes.ts';
import { ArmClamp, Desk, Laptop, PaSpeaker, Script, SeatedTalker, StudioChair, talkerCovers } from '../shared/broadcast/BroadcastArt';
import { DESK_TOP_Y, SEATED_FLOOR, SEATED_SOLIDS } from '../shared/broadcast/talkerPose.ts';
import { HEAD_C, HEAD_R } from '../shared/voice/voiceSpec.ts';
import { DESK, GRIP_A, GRIP_B, HOST_A, HOST_B, LAPTOP_A, LAPTOP_B, PA_C, SCRIPT_A } from './geometry.ts';

const studio = (v: VariantId) => v === 'twoHosts';

/** Everything in the room. `headless`: the host drawn without a head (a step
 *  that draws the head turned); `hostB`: draw the second host (studio). */
export function B01Scene({ view, variant, headless = false, phones }: { view: ViewId; variant: VariantId; headless?: boolean; phones?: boolean }): ReactElement {
  const two = studio(variant);
  const ph = phones ?? variant !== 'live';
  if (view === 'side') {
    return (
      <Group>
        {variant === 'live' ? <PaSpeaker view="side" c={PA_C} faces={1} floor={SEATED_FLOOR} /> : null}
        <ArmClamp view="side" grip={GRIP_A} deskTop={DESK_TOP_Y} />
        {two ? <ArmClamp view="side" grip={GRIP_B} deskTop={DESK_TOP_Y} edge={1} /> : null}
        <StudioChair view="side" t={HOST_A} />
        {two ? <StudioChair view="side" t={HOST_B} /> : null}
        {two ? <SeatedTalker view="side" t={HOST_B} phones={ph} /> : null}
        <Laptop view="side" at={LAPTOP_A} toward={1} />
        {two ? <Laptop view="side" at={LAPTOP_B} toward={-1} /> : null}
        <Desk view="side" box={DESK} floor={SEATED_FLOOR} />
        <Script view="side" at={SCRIPT_A} />
        <SeatedTalker view="side" t={HOST_A} phones={ph} headless={headless} />
      </Group>
    );
  }
  return (
    <Group>
      {variant === 'live' ? <PaSpeaker view="top" c={PA_C} faces={1} floor={SEATED_FLOOR} /> : null}
      <StudioChair view="top" t={HOST_A} />
      {two ? <StudioChair view="top" t={HOST_B} /> : null}
      <SeatedTalker view="top" t={HOST_A} part="lower" />
      {two ? <SeatedTalker view="top" t={HOST_B} part="lower" /> : null}
      <Desk view="top" box={DESK} floor={SEATED_FLOOR} />
      <Script view="top" at={SCRIPT_A} turn={-0.08} />
      <Laptop view="top" at={LAPTOP_A} toward={1} />
      {two ? <Laptop view="top" at={LAPTOP_B} toward={-1} /> : null}
      <ArmClamp view="top" grip={GRIP_A} deskTop={DESK_TOP_Y} />
      {two ? <ArmClamp view="top" grip={GRIP_B} deskTop={DESK_TOP_Y} edge={1} /> : null}
      {two ? <SeatedTalker view="top" t={HOST_B} part="upper" phones={ph} /> : null}
      <SeatedTalker view="top" t={HOST_A} part="upper" phones={ph} headless={headless} />
    </Group>
  );
}

export function B01Instrument({ view, variant }: { view: ViewId; variant: VariantId }): ReactElement {
  return <B01Scene view={view} variant={variant} />;
}

export function b01Labels(view: ViewId, variant: VariantId): ArtLabel[] {
  const two = studio(variant);
  if (view === 'side') {
    const out: ArtLabel[] = [
      { id: 'v.mouth', text: 'MOUTH', u: 120, v: -170, align: 'left', at: { u: 0, v: 2 }, alts: [{ u: 160, v: 120, align: 'left' }] },
      { id: 'b1.desk', text: 'DESK', u: 760, v: DESK.max.y + 70, align: 'center', tone: 'muted', at: { u: 760, v: DESK.max.y } },
      { id: 'b1.laptop', text: 'LAPTOP', u: LAPTOP_A.x, v: DESK_TOP_Y - 300, align: 'center', tone: 'muted', at: { u: LAPTOP_A.x + 80, v: DESK_TOP_Y - 140 } },
      { id: 'arm.A.post', text: 'ARM CLAMP', short: 'CLAMP', u: GRIP_A.x + 60, v: DESK_TOP_Y + 170, align: 'left', tone: 'muted', at: { u: GRIP_A.x, v: DESK_TOP_Y + 20 } },
    ];
    if (two) out.push({ id: 'hB.head', text: 'SECOND HOST', short: 'HOST 2', u: HOST_B.lip.x, v: -380, align: 'center', at: { u: HOST_B.lip.x - HEAD_C.x, v: HEAD_C.y - HEAD_R + 20 } });
    return out;
  }
  const out: ArtLabel[] = [
    { id: 'v.mouth', text: 'MOUTH', u: 150, v: -170, align: 'left', at: { u: 2, v: 0 }, alts: [{ u: 150, v: 170, align: 'left' }] },
    { id: 'b1.desk', text: 'DESK', u: 760, v: DESK.max.z - 80, align: 'center', tone: 'muted' },
    { id: 'b1.laptop', text: 'LAPTOP', u: LAPTOP_A.x, v: LAPTOP_A.z - 230, align: 'center', tone: 'muted', at: { u: LAPTOP_A.x, v: LAPTOP_A.z - 150 } },
    { id: 'b1.script', text: 'SCRIPT', u: SCRIPT_A.x, v: SCRIPT_A.z + 200, align: 'center', tone: 'muted', at: { u: SCRIPT_A.x, v: SCRIPT_A.z + 120 } },
  ];
  if (two) out.push({ id: 'hB.head', text: 'SECOND HOST', short: 'HOST 2', u: HOST_B.lip.x + 40, v: -330, align: 'center', at: { u: HOST_B.lip.x - HEAD_C.x, v: -80 } });
  return out;
}

const inBox = (u: number, v: number, x0: number, x1: number, y0: number, y1: number, tol: number) => u >= x0 - tol && u <= x1 + tol && v >= y0 - tol && v <= y1 + tol;

/** The seated host's own parts (frame V): the mouth, the head, the chest. */
function hostHit(view: ViewId, u: number, v: number, tol: number): string | null {
  if (view === 'side') {
    if (Math.hypot(u, v - 2) <= 16 + tol) return 'v.mouth';
    if (Math.hypot(u - HEAD_C.x, v - HEAD_C.y) <= HEAD_R + tol) return 'v.head';
    const T = SEATED_SOLIDS.torso;
    if (T.kind === 'box' && inBox(u, v, T.min.x, T.max.x, T.min.y, T.max.y, tol)) return 'v.chest';
    return null;
  }
  if (Math.hypot(u - 2, v) <= 16 + tol) return 'v.mouth';
  if (Math.hypot(u - HEAD_C.x, v) <= HEAD_R * 0.92 + tol) return 'v.head';
  const T = SEATED_SOLIDS.torso;
  if (T.kind === 'box' && inBox(u, v, T.min.x, T.max.x, T.min.z, T.max.z, tol)) return 'v.chest';
  return null;
}

export function b01HitTest(view: ViewId, variant: VariantId, u: number, v: number, tol: number): string | null {
  const own = hostHit(view, u, v, tol);
  if (own) return own;
  const vv = (p: { y: number; z: number }) => (view === 'side' ? p.y : p.z);
  if (studio(variant) && Math.hypot(u - (HOST_B.lip.x - HEAD_C.x), v - (view === 'side' ? HEAD_C.y : 0)) <= HEAD_R + tol) return 'hB.head';
  if (Math.hypot(u - GRIP_A.x, v - vv(GRIP_A)) <= 40 + tol) return 'arm.A.post';
  if (studio(variant) && Math.hypot(u - GRIP_B.x, v - vv(GRIP_B)) <= 40 + tol) return 'arm.B.post';
  if (inBox(u, v, LAPTOP_A.x - 120, LAPTOP_A.x + 180, view === 'side' ? DESK_TOP_Y - 240 : LAPTOP_A.z - 170, view === 'side' ? DESK_TOP_Y : LAPTOP_A.z + 170, tol)) return 'b1.laptop';
  if (view === 'top' && inBox(u, v, SCRIPT_A.x - 110, SCRIPT_A.x + 110, SCRIPT_A.z - 150, SCRIPT_A.z + 150, tol)) return 'b1.script';
  if (inBox(u, v, DESK.min.x, DESK.max.x, vv(DESK.min), vv(DESK.max), tol)) return 'b1.desk';
  if (variant === 'live' && Math.hypot(u - PA_C.x, v - vv(PA_C)) <= 320 + tol) return 'b1.pa';
  return null;
}

export function b01FigureAt(view: ViewId, variant: VariantId, u: number, v: number, tol: number): boolean {
  if (talkerCovers(view, HOST_A, u, v, tol)) return true;
  return studio(variant) && talkerCovers(view, HOST_B, u, v, tol);
}
