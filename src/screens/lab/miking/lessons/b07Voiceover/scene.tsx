/**
 * B07 VOICEOVER, NARRATION AND BROADCAST GUESTS — the scene (charter §2
 * layer 3). BOOTH: the reader standing (the voice family's figure, on
 * closed-back headphones) at a music stand holding the script, soft panels on
 * the wall behind. GUEST DESK: the host and an in-studio guest seated at the
 * desk (shared/broadcast/BroadcastArt), their arms' clamps, the monitor
 * loudspeaker on the desk. Static (D8).
 */
import type { ReactElement } from 'react';
import { Group } from '@shopify/react-native-skia';
import type { VariantId, ViewId } from '../../engine/model/types.ts';
import type { ArtLabel } from '../../engine/scene/sceneTypes.ts';
import { VoiceFigure, voiceFigureAt, voiceHitTest } from '../shared/voice/VoiceArt';
import { PlayerBehind, PlayerInFront } from '../shared/players/PlayerFigure';
import { SINGER_SIDE, SINGER_TOP, SINGER_SOLIDS } from '../shared/voice/voicePose.ts';
import { AcousticPanels, ArmClamp, Desk, Headphones, PaSpeaker, ScriptStand, SeatedTalker, StudioChair, talkerCovers } from '../shared/broadcast/BroadcastArt';
import { DESK_TOP_Y, SEATED_FLOOR, SEATED_SOLIDS } from '../shared/broadcast/talkerPose.ts';
import { HEAD_C, HEAD_R } from '../shared/voice/voiceSpec.ts';
import { BOOTH_FLOOR, DESK, GRIP_G, GRIP_H, GUEST, MONITOR_C, READER, STAND, WALL_X } from './geometry.ts';

const SIDE_HEADLESS = { ...SINGER_SIDE, head: { ...SINGER_SIDE.head, r: 1 } };
const TOP_HEADLESS = { ...SINGER_TOP, head: { ...SINGER_TOP.head, r: 1 } };

/** The standing reader without a head (a step draws it turned). */
export function ReaderHeadless({ view }: { view: ViewId }) {
  const pose = view === 'side' ? SIDE_HEADLESS : TOP_HEADLESS;
  return (
    <Group>
      <PlayerBehind pose={pose} />
      <PlayerInFront pose={pose} hands={view === 'side'} />
    </Group>
  );
}

export function B07Scene({ view, variant, headless = false }: { view: ViewId; variant: VariantId; headless?: boolean }): ReactElement {
  const g = variant === 'guest';
  if (variant === 'booth') {
    return (
      <Group>
        <AcousticPanels view={view} x={WALL_X} y0={-600} y1={900} z0={-560} z1={560} />
        {headless ? <ReaderHeadless view={view} /> : <VoiceFigure view={view} variant="booth" />}
        {!headless ? <Headphones view={view} /> : null}
        <ScriptStand view={view} s={STAND} />
      </Group>
    );
  }
  if (view === 'side') {
    return (
      <Group>
        <ArmClamp view="side" grip={GRIP_H} deskTop={DESK_TOP_Y} on="side" />
        {g ? <ArmClamp view="side" grip={GRIP_G} deskTop={DESK_TOP_Y} edge={1} on="side" /> : null}
        <StudioChair view="side" t={READER} />
        {g ? <StudioChair view="side" t={GUEST} /> : null}
        {g ? <SeatedTalker view="side" t={GUEST} phones /> : null}
        <PaSpeaker view="side" c={MONITOR_C} faces={-1} h={260} d={200} w={160} floor={SEATED_FLOOR} pole={false} />
        <Desk view="side" box={DESK} floor={SEATED_FLOOR} />
        <SeatedTalker view="side" t={READER} phones headless={headless} />
      </Group>
    );
  }
  return (
    <Group>
      <StudioChair view="top" t={READER} />
      {g ? <StudioChair view="top" t={GUEST} /> : null}
      <SeatedTalker view="top" t={READER} part="lower" />
      {g ? <SeatedTalker view="top" t={GUEST} part="lower" /> : null}
      <Desk view="top" box={DESK} floor={SEATED_FLOOR} />
      <PaSpeaker view="top" c={MONITOR_C} faces={-1} h={260} d={200} w={160} floor={SEATED_FLOOR} pole={false} />
      <ArmClamp view="top" grip={GRIP_H} deskTop={DESK_TOP_Y} on="side" />
      {g ? <ArmClamp view="top" grip={GRIP_G} deskTop={DESK_TOP_Y} edge={1} on="side" /> : null}
      {g ? <SeatedTalker view="top" t={GUEST} part="upper" phones /> : null}
      <SeatedTalker view="top" t={READER} part="upper" phones headless={headless} />
    </Group>
  );
}

export function B07Instrument({ view, variant }: { view: ViewId; variant: VariantId }): ReactElement {
  return <B07Scene view={view} variant={variant} />;
}

export function b07Labels(view: ViewId, variant: VariantId): ArtLabel[] {
  if (variant === 'booth') {
    if (view === 'side')
      return [
        { id: 'v.mouth', text: 'MOUTH', u: 130, v: -170, align: 'left', at: { u: 0, v: 2 }, alts: [{ u: 150, v: 120, align: 'left' }] },
        { id: 'b7.stand', text: 'SCRIPT STAND', short: 'SCRIPT', u: STAND.c.x + 120, v: STAND.c.y + 200, align: 'left', at: { u: STAND.c.x, v: STAND.c.y } },
        { id: 'b7.phones', text: 'HEADPHONES', short: 'PHONES', u: -300, v: -260, align: 'right', at: { u: -60, v: -60 } },
        { id: 'b7.panels', text: 'SOFT PANELS', short: 'PANELS', u: WALL_X + 80, v: -470, align: 'left', tone: 'muted', at: { u: WALL_X + 30, v: -300 } },
      ];
    return [
      { id: 'v.mouth', text: 'MOUTH', u: 150, v: -150, align: 'left', at: { u: 2, v: 0 } },
      { id: 'b7.stand', text: 'SCRIPT STAND', short: 'SCRIPT', u: STAND.c.x, v: -330, align: 'center', at: { u: STAND.c.x, v: -200 } },
      { id: 'b7.panels', text: 'SOFT PANELS', short: 'PANELS', u: WALL_X + 80, v: 430, align: 'left', tone: 'muted' },
    ];
  }
  const g = variant === 'guest';
  const out: ArtLabel[] = view === 'side'
    ? [
        { id: 'v.mouth', text: 'MOUTH', u: 120, v: -170, align: 'left', at: { u: 0, v: 2 } },
        { id: 'b7.monitor', text: 'MONITOR (OFF)', short: 'MONITOR', u: MONITOR_C.x, v: MONITOR_C.y - 230, align: 'center', tone: 'muted', at: { u: MONITOR_C.x, v: MONITOR_C.y - 120 } },
        { id: 'b7.desk', text: 'DESK', u: 760, v: DESK.max.y + 70, align: 'center', tone: 'muted' },
      ]
    : [
        { id: 'v.mouth', text: 'MOUTH', u: 150, v: -170, align: 'left', at: { u: 2, v: 0 } },
        { id: 'b7.monitor', text: 'MONITOR (OFF)', short: 'MONITOR', u: MONITOR_C.x, v: MONITOR_C.z - 200, align: 'center', tone: 'muted', at: { u: MONITOR_C.x, v: MONITOR_C.z - 80 } },
      ];
  if (g) out.push(view === 'side' ? { id: 'gu.head', text: 'GUEST', u: GUEST.lip.x, v: -380, align: 'center', at: { u: GUEST.lip.x - HEAD_C.x, v: HEAD_C.y - HEAD_R + 20 } } : { id: 'gu.head', text: 'GUEST', u: GUEST.lip.x + 40, v: -330, align: 'center', at: { u: GUEST.lip.x - HEAD_C.x, v: -80 } });
  return out;
}

const inBox = (u: number, v: number, x0: number, x1: number, y0: number, y1: number, tol: number) => u >= x0 - tol && u <= x1 + tol && v >= y0 - tol && v <= y1 + tol;

export function b07HitTest(view: ViewId, variant: VariantId, u: number, v: number, tol: number): string | null {
  const vv = (p: { y: number; z: number }) => (view === 'side' ? p.y : p.z);
  if (variant === 'booth') {
    const own = voiceHitTest(view, variant, u, v, tol);
    if (own) return own;
    if (Math.hypot(u - STAND.c.x, v - vv(STAND.c)) <= 160 + tol) return 'b7.stand';
    if (u <= WALL_X + 80 + tol) return 'b7.panels';
    return null;
  }
  if (view === 'side' ? Math.hypot(u, v - 2) <= 16 + tol : Math.hypot(u - 2, v) <= 16 + tol) return 'v.mouth';
  if (Math.hypot(u - HEAD_C.x, v - (view === 'side' ? HEAD_C.y : 0)) <= HEAD_R + tol) return 'v.head';
  if (variant === 'guest' && Math.hypot(u - (GUEST.lip.x - HEAD_C.x), v - (view === 'side' ? HEAD_C.y : 0)) <= HEAD_R + tol) return 'gu.head';
  const T = SEATED_SOLIDS.torso;
  if (T.kind === 'box' && inBox(u, v, T.min.x, T.max.x, view === 'side' ? T.min.y : T.min.z, view === 'side' ? T.max.y : T.max.z, tol)) return 'v.chest';
  if (Math.hypot(u - MONITOR_C.x, v - vv(MONITOR_C)) <= 150 + tol) return 'b7.monitor';
  if (Math.hypot(u - GRIP_H.x, v - vv(GRIP_H)) <= 40 + tol) return 'arm.H.post';
  if (inBox(u, v, DESK.min.x, DESK.max.x, vv(DESK.min), vv(DESK.max), tol)) return 'b7.desk';
  return null;
}

export function b07FigureAt(view: ViewId, variant: VariantId, u: number, v: number, tol: number): boolean {
  if (variant === 'booth') return voiceFigureAt(view, variant, u, v, tol);
  return talkerCovers(view, READER, u, v, tol) || (variant === 'guest' && talkerCovers(view, GUEST, u, v, tol));
}

export const B07_FLOOR = { booth: BOOTH_FLOOR, desk: SEATED_FLOOR };
export const B07_SOLIDS = SINGER_SOLIDS;
