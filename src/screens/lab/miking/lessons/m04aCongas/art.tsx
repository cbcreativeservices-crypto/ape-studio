/**
 * M04a CONGAS — the look (charter §2 layer 3), drawn ONLY from the anchors in
 * model.ts / geometry.ts with the hand-drum family's parts
 * (shared/handdrums/handDrumArt.tsx). Side view: an elevation seen from the
 * player's right — the tumba in front, the conga directly behind it (the same
 * height, a little narrower, so it hides behind the tumba). Top view: both
 * heads from above. Lug counts, the rim and the stands are drawing defaults
 * (model.ts), never stated in words.
 */
import { Group } from '@shopify/react-native-skia';
import type { VariantId, ViewId } from '../../engine/model/types.ts';
import type { ArtLabel } from '../../engine/scene/sceneTypes.ts';
import { ContactShadow, FloorSide, HeadTop, ShellSide, StandLegs } from '../shared/handdrums/handDrumArt';
import { planDist, rimTopY } from '../shared/handdrums/handDrumModel.ts';
import { CONGA, CONGA_DIMS as D, HEAD_Y, TUMBA } from './model.ts';
import { CONGA_MODEL, STAND_RING_Y, standLegs } from './geometry.ts';

const LUGS = D.lugs.mm;
const STAVES = 14;

export function CongaArt({ view, variant }: { view: ViewId; variant: VariantId }) {
  const raised = variant === 'raised';
  const floorY = CONGA_MODEL.floorByVariant?.[variant] ?? 0;
  if (view === 'side') {
    return (
      <Group>
        <FloorSide y={floorY} u0={CONGA_MODEL.views.side!.u0} u1={CONGA_MODEL.views.side!.u1} />
        <ContactShadow cx={0} cy={floorY + 2} rx={(raised ? 330 : TUMBA.rBottom + 30)} ry={9} />
        {raised ? <StandLegs legs={standLegs(CONGA)} view="side" ring={{ cx: CONGA.c.x, cv: 0, r: 0, y: STAND_RING_Y }} /> : null}
        <ShellSide d={CONGA} look="staved" staves={STAVES} lugs={LUGS} dim />
        <ShellSide d={TUMBA} look="staved" staves={STAVES} lugs={LUGS} />
        {raised ? <StandLegs legs={standLegs(TUMBA).filter((l) => l.top.z >= TUMBA.c.z - 1)} view="side" ring={{ cx: TUMBA.c.x, cv: 0, r: 0, y: STAND_RING_Y }} /> : null}
      </Group>
    );
  }
  return (
    <Group>
      {raised
        ? [CONGA, TUMBA].map((d) => (
            <StandLegs key={d.id} legs={standLegs(d)} view="top" ring={{ cx: d.c.x, cv: d.c.z, r: 0 }} />
          ))
        : null}
      <HeadTop d={CONGA} look="rawhide" lugs={LUGS} seed={11} />
      <HeadTop d={TUMBA} look="rawhide" lugs={LUGS} seed={29} />
    </Group>
  );
}

export function congaLabels(view: ViewId, variant: VariantId): ArtLabel[] {
  const top = rimTopY(TUMBA);
  if (view === 'side') {
    const out: ArtLabel[] = [
      { id: 'tumba', text: 'TUMBA (IN FRONT)', short: 'TUMBA', u: TUMBA.R + 40, v: top - 30, align: 'left' },
      { id: 'conga', text: 'CONGA BEHIND IT', short: 'CONGA BEHIND', u: TUMBA.R + 40, v: top + 90, align: 'left', tone: 'muted' },
      { id: 'bottom', text: 'OPEN LOWER END', short: 'OPEN END', u: TUMBA.rBottom + 30, v: -40, align: 'left', tone: 'muted' },
      { id: 'floor', text: 'FLOOR', u: CONGA_MODEL.views.side!.u1 - 20, v: (CONGA_MODEL.floorByVariant?.[variant] ?? 0) - 24, align: 'right', tone: 'muted' },
      { id: 'player', text: '← PLAYER', u: -440, v: top - 30, align: 'center', tone: 'muted' },
    ];
    if (variant === 'raised') out.push({ id: 'stand', text: 'STAND', u: -TUMBA.rBottom - 140, v: 60, align: 'right', tone: 'muted' });
    return out;
  }
  return [
    { id: 'conga', text: 'CONGA', u: CONGA.c.x, v: CONGA.c.z - CONGA.R - 52, align: 'center' },
    { id: 'tumba', text: 'TUMBA', u: TUMBA.c.x, v: TUMBA.c.z + TUMBA.R + 40, align: 'center' },
    { id: 'player', text: '← PLAYER', u: -440, v: 0, align: 'center', tone: 'muted' },
    { id: 'aud', text: 'AUDIENCE →', u: CONGA_MODEL.views.top!.u1 - 20, v: CONGA_MODEL.views.top!.v1 - 40, align: 'right', tone: 'muted' },
  ];
}

/** The part under a model point (u, v) in this view; `tol` in mm. */
export function congaHitTest(view: ViewId, variant: VariantId, u: number, v: number, tol: number): string | null {
  if (view === 'top') {
    for (const d of [CONGA, TUMBA]) if (planDist({ x: u, y: 0, z: v }, d.c.x, d.c.z) <= d.R + d.rim.t + tol) return `${d.id}.head`;
    if (variant === 'raised') for (const d of [CONGA, TUMBA]) for (const [i, l] of standLegs(d).entries()) if (Math.hypot(u - l.foot.x, v - l.foot.z) <= 30 + tol) return `${d.id}.leg${i + 1}`;
    return null;
  }
  const top = rimTopY(TUMBA);
  if (Math.abs(u - TUMBA.c.x) <= TUMBA.R + TUMBA.rim.t + tol && v >= top - tol && v <= HEAD_Y + 30) return 'tumba.head';
  if (Math.abs(u - TUMBA.c.x) <= TUMBA.R + tol && v > HEAD_Y + 30 && v <= TUMBA.bottomY + tol) return 'tumba.shell';
  if (variant === 'raised' && v > 0 && v <= (CONGA_MODEL.floorByVariant?.raised ?? 0) + tol && Math.abs(u) <= 320) return 'tumba.leg1';
  return null;
}
