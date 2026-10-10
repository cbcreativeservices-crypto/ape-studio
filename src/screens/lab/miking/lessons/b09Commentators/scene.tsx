/**
 * B09 COMMENTATORS AND ANNOUNCE POSITIONS — the scene (charter §2 layer 3):
 * the commentator and the analyst seated at the commentary desk (shared/
 * broadcast/BroadcastArt), their chairs, the screen and the notes, the
 * booth's window — or, at the open position, the rail, the crowd below and
 * the PA cluster high to the front-left; the desk arm's clamp in the quiet
 * booth. Static (D8). Labels name what a mic decision needs.
 */
import type { ReactElement } from 'react';
import { Group } from '@shopify/react-native-skia';
import type { VariantId, ViewId } from '../../engine/model/types.ts';
import type { ArtLabel } from '../../engine/scene/sceneTypes.ts';
import { ArmClamp, Desk, Laptop, PaSpeaker, Script, SeatedTalker, StudioChair, talkerCovers } from '../shared/broadcast/BroadcastArt';
import { BoothWindow, CrowdStand, SeatedHolding } from '../shared/broadcast/SportSpeechArt';
import { DESK_TOP_Y, SEATED_FLOOR, SEATED_SOLIDS } from '../shared/broadcast/talkerPose.ts';
import { HEAD_C, HEAD_R } from '../shared/voice/voiceSpec.ts';
import { ANALYST, CALLER, DESK, FRONT_X, GRIP_A, NOTES, PA_C, SCREEN } from './geometry.ts';

const two = (v: VariantId) => v === 'booth';

/** Everything at the position. `headless`: the commentator drawn without a
 *  head (a step that draws it turned); `gap`: the analyst's seat moved (the
 *  partner step). */
export function B09Scene({ view, variant, headless = false, analyst = ANALYST, holding }: { view: ViewId; variant: VariantId; headless?: boolean; analyst?: typeof ANALYST; holding?: boolean }): ReactElement {
  const b = two(variant);
  const open = variant === 'open';
  const studio = variant === 'studio';
  const zs = { z0: DESK.min.z - 200, z1: DESK.max.z + 200 };
  if (view === 'side') {
    return (
      <Group>
        {open ? <CrowdStand view="side" x0={FRONT_X + 500} dx={2200} z0={-3000} z1={3000} floor={SEATED_FLOOR + 900} rows={3} /> : null}
        {open ? <PaSpeaker view="side" c={PA_C} faces={1} floor={SEATED_FLOOR + 900} pole={false} /> : null}
        <BoothWindow view="side" x={FRONT_X} y0={-900} y1={SEATED_FLOOR} z0={zs.z0} z1={zs.z1} sillY={open ? DESK_TOP_Y - 150 : DESK_TOP_Y - 60} open={open} />
        {studio ? <ArmClamp view="side" grip={GRIP_A} deskTop={DESK_TOP_Y} /> : null}
        <StudioChair view="side" t={CALLER} />
        {!open ? <Laptop view="side" at={SCREEN} toward={-1} /> : null}
        <Desk view="side" box={DESK} floor={SEATED_FLOOR} />
        <Script view="side" at={NOTES} />
        {/* The analyst sits beside the commentator, nearer the viewer: from
            the side they would cover the commentator — shown from above. */}
        {open || holding ? <SeatedHolding view="side" t={CALLER} phones /> : <SeatedTalker view="side" t={CALLER} phones headless={headless} />}
      </Group>
    );
  }
  return (
    <Group>
      {!studio ? <CrowdStand view="top" x0={FRONT_X + 500} dx={1500} z0={open ? -3400 : zs.z0 - 200} z1={open ? 900 : zs.z1 + 200} floor={SEATED_FLOOR} rows={3} /> : null}
      {open ? <PaSpeaker view="top" c={PA_C} faces={1} floor={SEATED_FLOOR + 900} pole={false} /> : null}
      <BoothWindow view="top" x={FRONT_X} y0={-900} y1={SEATED_FLOOR} z0={open ? -3400 : zs.z0} z1={open ? 900 : zs.z1} sillY={DESK_TOP_Y - 60} open={open} />
      <StudioChair view="top" t={CALLER} />
      {b ? <StudioChair view="top" t={analyst} /> : null}
      {open || holding ? <SeatedHolding view="top" t={CALLER} part="lower" /> : <SeatedTalker view="top" t={CALLER} part="lower" />}
      {b ? <SeatedTalker view="top" t={analyst} part="lower" /> : null}
      <Desk view="top" box={DESK} floor={SEATED_FLOOR} />
      <Script view="top" at={NOTES} turn={-0.08} />
      {!open ? <Laptop view="top" at={SCREEN} toward={-1} /> : null}
      {studio ? <ArmClamp view="top" grip={GRIP_A} deskTop={DESK_TOP_Y} /> : null}
      {b ? <SeatedTalker view="top" t={analyst} part="upper" phones /> : null}
      {open || holding ? <SeatedHolding view="top" t={CALLER} part="upper" phones /> : <SeatedTalker view="top" t={CALLER} part="upper" phones headless={headless} />}
    </Group>
  );
}

export function B09Instrument({ view, variant }: { view: ViewId; variant: VariantId }): ReactElement {
  return <B09Scene view={view} variant={variant} />;
}

export function b09Labels(view: ViewId, variant: VariantId): ArtLabel[] {
  const b = two(variant);
  const open = variant === 'open';
  if (view === 'side') {
    const out: ArtLabel[] = [
      { id: 'v.mouth', text: 'MOUTH', u: 120, v: -200, align: 'left', at: { u: 0, v: 2 }, alts: [{ u: 160, v: 130, align: 'left' }] },
      { id: 'b9.desk', text: 'DESK', u: 700, v: DESK.max.y + 80, align: 'center', tone: 'muted', at: { u: 700, v: DESK.max.y } },
      { id: open ? 'b9.rail' : 'b9.window', text: open ? 'OPEN RAIL' : 'WINDOW', u: FRONT_X - 30, v: -560, align: 'right', tone: 'muted', at: { u: FRONT_X, v: open ? SEATED_FLOOR - 400 : -300 } },
    ];
    if (open) out.push({ id: 'b9.pa', text: 'PA CLUSTER', short: 'PA', u: PA_C.x - 200, v: PA_C.y - 420, align: 'center', at: { u: PA_C.x, v: PA_C.y - 200 } });
    return out;
  }
  const out: ArtLabel[] = [
    { id: 'v.mouth', text: 'MOUTH', u: 160, v: -200, align: 'left', at: { u: 2, v: 0 }, alts: [{ u: 160, v: 200, align: 'left' }] },
    { id: 'b9.notes', text: 'NOTES', u: NOTES.x, v: NOTES.z - 220, align: 'center', tone: 'muted', at: { u: NOTES.x, v: NOTES.z - 120 } },
    { id: 'b9.crowd', text: open ? 'CROWD' : 'THE FIELD', u: FRONT_X + 700, v: open ? 700 : DESK.max.z + 160, align: 'center', tone: 'muted' },
  ];
  if (open) out.push({ id: 'b9.pa', text: 'PA CLUSTER', short: 'PA', u: PA_C.x, v: PA_C.z + 420, align: 'center', at: { u: PA_C.x, v: PA_C.z + 200 } });
  if (!open) out.push({ id: 'b9.screen', text: 'SCREEN', u: SCREEN.x + 30, v: SCREEN.z - 290, align: 'center', tone: 'muted', at: { u: SCREEN.x, v: SCREEN.z - 170 } });
  if (b) out.push({ id: 'b9B.head', text: 'ANALYST', u: ANALYST.lip.x - 120, v: ANALYST.lip.z + 330, align: 'center', at: { u: ANALYST.lip.x + HEAD_C.x, v: ANALYST.lip.z } });
  return out;
}

const inBox = (u: number, v: number, x0: number, x1: number, y0: number, y1: number, tol: number) => u >= x0 - tol && u <= x1 + tol && v >= y0 - tol && v <= y1 + tol;

/** The commentator's own parts (frame V): the mouth, the head, the chest. */
function callerHit(view: ViewId, u: number, v: number, tol: number): string | null {
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

export function b09HitTest(view: ViewId, variant: VariantId, u: number, v: number, tol: number): string | null {
  const own = callerHit(view, u, v, tol);
  if (own) return own;
  const vv = (p: { y: number; z: number }) => (view === 'side' ? p.y : p.z);
  if (two(variant) && view === 'top' && Math.hypot(u - (ANALYST.lip.x + HEAD_C.x), v - ANALYST.lip.z) <= HEAD_R + tol) return 'b9B.head';
  if (variant === 'studio' && Math.hypot(u - GRIP_A.x, v - vv(GRIP_A)) <= 40 + tol) return 'arm.A.post';
  if (variant !== 'open' && inBox(u, v, SCREEN.x - 60, SCREEN.x + 60, view === 'side' ? DESK_TOP_Y - 240 : SCREEN.z - 180, view === 'side' ? DESK_TOP_Y : SCREEN.z + 180, tol)) return 'b9.screen';
  if (view === 'top' && inBox(u, v, NOTES.x - 110, NOTES.x + 110, NOTES.z - 150, NOTES.z + 150, tol)) return 'b9.notes';
  if (inBox(u, v, DESK.min.x, DESK.max.x, vv(DESK.min), vv(DESK.max), tol)) return 'b9.desk';
  if (Math.abs(u - FRONT_X) <= 40 + tol) return variant === 'open' ? 'b9.rail' : 'b9.window';
  if (variant === 'open' && Math.hypot(u - PA_C.x, v - vv(PA_C)) <= 320 + tol) return 'b9.pa';
  if (variant !== 'studio' && u > FRONT_X + 300) return 'b9.crowd';
  return null;
}

export function b09FigureAt(view: ViewId, variant: VariantId, u: number, v: number, tol: number): boolean {
  if (talkerCovers(view, CALLER, u, v, tol)) return true;
  return two(variant) && view === 'top' && talkerCovers(view, ANALYST, u, v, tol);
}
