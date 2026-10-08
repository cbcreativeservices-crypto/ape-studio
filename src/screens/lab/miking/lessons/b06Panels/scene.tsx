/**
 * B06 PANELS, PRESS CONFERENCES AND GROUPS — the scene (charter §2 layer 3).
 * PANEL: four panelists seated behind a skirted table (shared/broadcast/
 * BroadcastArt), a gooseneck base in front of each; from the side the row
 * lines up behind the focus panelist, so only they are drawn. LECTERN: the
 * presenter standing at the lectern (the voice family's figure), the member
 * of the press at the aisle mic facing the stage, the PA at the stage's
 * corner. Static (D8).
 */
import type { ReactElement } from 'react';
import { Group } from '@shopify/react-native-skia';
import type { VariantId, ViewId } from '../../engine/model/types.ts';
import type { ArtLabel } from '../../engine/scene/sceneTypes.ts';
import { VoiceFigure, voiceFigureAt, voiceHitTest } from '../shared/voice/VoiceArt';
import { PlayerBehind, PlayerInFront, figureCovers } from '../shared/players/PlayerFigure';
import { SINGER_SIDE, SINGER_TOP } from '../shared/voice/voicePose.ts';
import { Desk, GooseBase, Lectern, PaSpeaker, Script, SeatedTalker, StudioChair, talkerCovers } from '../shared/broadcast/BroadcastArt';
import { DESK_TOP_Y, SEATED_FLOOR, SEATED_SOLIDS, poseOnTalker } from '../shared/broadcast/talkerPose.ts';
import { HEAD_C, HEAD_R } from '../shared/voice/voiceSpec.ts';
import { ASKER, FOCUS, LECTERN, P1, P3, P4, PA_C, STAND_FLOOR, TABLE, gooseBase } from './geometry.ts';

const PANEL = [P1, FOCUS, P3, P4];
const ASK_SIDE = poseOnTalker(SINGER_SIDE, ASKER);
const ASK_TOP = poseOnTalker(SINGER_TOP, ASKER);
const SIDE_HEADLESS = { ...SINGER_SIDE, head: { ...SINGER_SIDE.head, r: 1 } };
const TOP_HEADLESS = { ...SINGER_TOP, head: { ...SINGER_TOP.head, r: 1 } };

function Asker({ view }: { view: ViewId }) {
  const pose = view === 'side' ? ASK_SIDE : ASK_TOP;
  return (
    <Group>
      <PlayerBehind pose={pose} />
      <PlayerInFront pose={pose} hands={view === 'side'} />
    </Group>
  );
}

/** `headless`: the focus talker drawn without a head (a step draws it
 *  turned); `bases`: the gooseneck bases (off where a step draws its own). */
export function B06Scene({ view, variant, headless = false, bases = true }: { view: ViewId; variant: VariantId; headless?: boolean; bases?: boolean }): ReactElement {
  if (variant === 'lectern') {
    const pres = headless ? (
      <Group>
        <PlayerBehind pose={view === 'side' ? SIDE_HEADLESS : TOP_HEADLESS} />
        <PlayerInFront pose={view === 'side' ? SIDE_HEADLESS : TOP_HEADLESS} hands={view === 'side'} />
      </Group>
    ) : (
      <VoiceFigure view={view} variant="lectern" />
    );
    return (
      <Group>
        <PaSpeaker view={view} c={PA_C} faces={1} floor={STAND_FLOOR} />
        {pres}
        <Lectern view={view} s={LECTERN} />
        <Asker view={view} />
      </Group>
    );
  }
  if (view === 'side') {
    return (
      <Group>
        <StudioChair view="side" t={FOCUS} />
        <Desk view="side" box={TABLE} floor={SEATED_FLOOR} skirt />
        {bases ? <GooseBase view="side" at={gooseBase(FOCUS)} /> : null}
        <Script view="side" at={{ x: 330, y: DESK_TOP_Y, z: 150 }} />
        <SeatedTalker view="side" t={FOCUS} headless={headless} />
      </Group>
    );
  }
  return (
    <Group>
      {PANEL.map((t) => (
        <StudioChair key={`c${t.id}`} view="top" t={t} />
      ))}
      {PANEL.map((t) => (
        <SeatedTalker key={`l${t.id}`} view="top" t={t} part="lower" />
      ))}
      <Desk view="top" box={TABLE} floor={SEATED_FLOOR} skirt />
      {PANEL.map((t) => (
        <Script key={`s${t.id}`} view="top" at={{ x: 330, y: DESK_TOP_Y, z: t.lip.z + 170 }} turn={0.06} />
      ))}
      {bases ? PANEL.map((t) => <GooseBase key={`b${t.id}`} view="top" at={gooseBase(t)} />) : null}
      {PANEL.map((t) => (
        <SeatedTalker key={`u${t.id}`} view="top" t={t} part="upper" headless={headless && t.id === FOCUS.id} />
      ))}
    </Group>
  );
}

export function B06Instrument({ view, variant }: { view: ViewId; variant: VariantId }): ReactElement {
  return <B06Scene view={view} variant={variant} />;
}

export function b06Labels(view: ViewId, variant: VariantId): ArtLabel[] {
  if (variant === 'lectern') {
    if (view === 'side')
      return [
        { id: 'v.mouth', text: 'MOUTH', u: 120, v: -170, align: 'left', at: { u: 0, v: 2 } },
        { id: 'b6.lectern', text: 'LECTERN', u: (LECTERN.x0 + LECTERN.x1) / 2, v: 900, align: 'center', tone: 'muted' },
        { id: 'ask.head', text: 'QUESTION FROM THE AISLE', short: 'QUESTION', u: ASKER.lip.x, v: -380, align: 'center', at: { u: ASKER.lip.x - HEAD_C.x, v: HEAD_C.y - HEAD_R + 20 } },
        { id: 'b6.pa', text: 'PA', u: PA_C.x, v: PA_C.y - 380, align: 'center', at: { u: PA_C.x, v: PA_C.y - 280 } },
      ];
    return [
      { id: 'v.mouth', text: 'MOUTH', u: 150, v: -170, align: 'left', at: { u: 2, v: 0 } },
      { id: 'b6.lectern', text: 'LECTERN', u: (LECTERN.x0 + LECTERN.x1) / 2, v: LECTERN.halfW + 110, align: 'center', tone: 'muted' },
      { id: 'ask.head', text: 'QUESTION FROM THE AISLE', short: 'QUESTION', u: ASKER.lip.x, v: ASKER.lip.z + 300, align: 'center', at: { u: ASKER.lip.x + 90, v: ASKER.lip.z } },
      { id: 'b6.pa', text: 'PA', u: PA_C.x, v: PA_C.z - 300, align: 'center', at: { u: PA_C.x, v: PA_C.z - 170 } },
    ];
  }
  if (view === 'side')
    return [
      { id: 'v.mouth', text: 'MOUTH', u: 120, v: -170, align: 'left', at: { u: 0, v: 2 } },
      { id: 'b6.table', text: 'TABLE', u: 450, v: TABLE.max.y + 90, align: 'center', tone: 'muted' },
      { id: 'b6.base', text: 'GOOSENECK BASE', short: 'BASE', u: gooseBase(FOCUS).x + 80, v: DESK_TOP_Y - 150, align: 'left', tone: 'muted', at: { u: gooseBase(FOCUS).x, v: DESK_TOP_Y - 20 } },
    ];
  return [
    { id: 'v.mouth', text: 'MOUTH', u: 150, v: -110, align: 'left', at: { u: 2, v: 0 } },
    { id: 'p3.head', text: 'NEXT PANELIST', short: 'NEXT', u: -320, v: P3.lip.z, align: 'right', at: { u: P3.lip.x + HEAD_C.x - 60, v: P3.lip.z } },
    { id: 'b6.table', text: 'TABLE', u: 560, v: TABLE.max.z - 120, align: 'center', tone: 'muted' },
  ];
}

const inBox = (u: number, v: number, x0: number, x1: number, y0: number, y1: number, tol: number) => u >= x0 - tol && u <= x1 + tol && v >= y0 - tol && v <= y1 + tol;

export function b06HitTest(view: ViewId, variant: VariantId, u: number, v: number, tol: number): string | null {
  const vv = (p: { y: number; z: number }) => (view === 'side' ? p.y : p.z);
  if (variant === 'lectern') {
    const own = voiceHitTest(view, variant, u, v, tol);
    if (own) return own;
    if (inBox(u, v, LECTERN.x0, LECTERN.x1, view === 'side' ? LECTERN.top : -LECTERN.halfW, view === 'side' ? STAND_FLOOR : LECTERN.halfW, tol)) return 'b6.lectern';
    if (Math.hypot(u - (ASKER.lip.x - HEAD_C.x), v - (view === 'side' ? HEAD_C.y : ASKER.lip.z)) <= HEAD_R + tol) return 'ask.head';
    if (Math.hypot(u - PA_C.x, v - vv(PA_C)) <= 320 + tol) return 'b6.pa';
    return null;
  }
  if (view === 'side' ? Math.hypot(u, v - 2) <= 16 + tol : Math.hypot(u - 2, v) <= 16 + tol) return 'v.mouth';
  if (Math.hypot(u - HEAD_C.x, v - (view === 'side' ? HEAD_C.y : 0)) <= HEAD_R + tol) return 'v.head';
  if (view === 'top') {
    for (const [t, id] of [[P1, 'p1.head'], [P3, 'p3.head'], [P4, 'p4.head']] as const) if (Math.hypot(u - HEAD_C.x, v - t.lip.z) <= HEAD_R + tol) return id;
    for (const t of PANEL) if (Math.hypot(u - gooseBase(t).x, v - gooseBase(t).z) <= 75 + tol) return 'b6.base';
  } else if (Math.hypot(u - gooseBase(FOCUS).x, v - (DESK_TOP_Y - 15)) <= 75 + tol) return 'b6.base';
  const T = SEATED_SOLIDS.torso;
  if (T.kind === 'box' && inBox(u, v, T.min.x, T.max.x, view === 'side' ? T.min.y : T.min.z, view === 'side' ? T.max.y : T.max.z, tol)) return 'v.chest';
  if (inBox(u, v, TABLE.min.x, TABLE.max.x, vv(TABLE.min), vv(TABLE.max), tol)) return 'b6.table';
  return null;
}

export function b06FigureAt(view: ViewId, variant: VariantId, u: number, v: number, tol: number): boolean {
  if (variant === 'lectern') return voiceFigureAt(view, variant, u, v, tol) || figureCovers(view === 'side' ? ASK_SIDE : ASK_TOP, u, v, tol);
  if (view === 'side') return talkerCovers(view, FOCUS, u, v, tol);
  return PANEL.some((t) => talkerCovers(view, t, u, v, tol));
}
