/**
 * M04b BONGOS — the look (charter §2 layer 3), drawn only from model.ts /
 * geometry.ts anchors with the hand-drum family's parts. Side view: an
 * elevation from the player's right — the hembra in front, the macho behind
 * it. Top view: both heads, the centre block between them. Rod counts, rims
 * and the stand are drawing defaults (never stated in words).
 */
import { useMemo } from 'react';
import { Group, LinearGradient, Path, Skia, vec } from '@shopify/react-native-skia';
import type { VariantId, ViewId } from '../../engine/model/types.ts';
import type { ArtLabel } from '../../engine/scene/sceneTypes.ts';
import { ContactShadow, FloorSide, HeadTop, INK, ShellSide, StandLegs, WOOD } from '../shared/handdrums/handDrumArt';
import { planDist, rimTopY } from '../shared/handdrums/handDrumModel.ts';
import { BONGO_DIMS as D, HEMBRA, MACHO } from './model.ts';
import { BONGO_MODEL, LEGS, STAND } from './geometry.ts';

const RODS = D.lugs.mm;

function Block({ view }: { view: ViewId }) {
  const p = useMemo(() => {
    const s = Skia.Path.Make();
    if (view === 'top') s.addRRect(Skia.RRectXY(Skia.XYWHRect(-42, MACHO.c.z + MACHO.R - 4, 84, HEMBRA.c.z - HEMBRA.R - (MACHO.c.z + MACHO.R) + 8), 6, 6));
    return s;
  }, [view]);
  if (view !== 'top') return null;
  return (
    <>
      <Path path={p}>
        <LinearGradient start={vec(-42, 0)} end={vec(42, 0)} colors={WOOD} />
      </Path>
      <Path path={p} style="stroke" strokeWidth={1.2} color={INK} />
    </>
  );
}

// Charcoal trousers, never blue: blue on the glass means a recommended starting point.
const DENIM = ['#6b6660', '#4a4643', '#2c2a29'];

/** The seated player's legs (KNEES), from the same boxes the collision uses:
 *  a thigh from the hip to the knee, a shin to the floor, a shoe. Side view:
 *  `which` picks the far (left) or near (right) leg — the near one is drawn
 *  ghosted in front of the drums so the pair stays readable. */
function Legs({ view, which, ghost }: { view: ViewId; which: 'L' | 'R' | 'both'; ghost?: boolean }) {
  const p = useMemo(() => {
    const out = Skia.Path.Make();
    const sides = which === 'both' ? (['L', 'R'] as const) : ([which] as const);
    for (const sd of sides) {
      const th = LEGS[sd === 'L' ? 'thighL' : 'thighR'];
      const sh = LEGS[sd === 'L' ? 'shinL' : 'shinR'];
      if (th.kind !== 'box' || sh.kind !== 'box') continue;
      if (view === 'side') {
        const t0 = th.min.y;
        const t1 = th.max.y;
        // Thigh: hip (rounded) to knee (rounded), slightly tapering.
        out.moveTo(th.min.x, t0 + 8);
        out.quadTo(th.min.x - 30, (t0 + t1) / 2, th.min.x, t1);
        out.lineTo(th.max.x - 10, t1 - 6);
        out.quadTo(th.max.x + 34, (t0 + t1) / 2, th.max.x - 6, t0 + 4);
        out.close();
        // Shin to the floor, and a shoe pointing forward.
        out.addRRect(Skia.RRectXY(Skia.XYWHRect(sh.min.x + 8, sh.min.y + 40, sh.max.x - sh.min.x - 16, sh.max.y - sh.min.y - 70), 30, 30));
        out.addRRect(Skia.RRectXY(Skia.XYWHRect(sh.min.x, sh.max.y - 42, sh.max.x - sh.min.x + 80, 42), 18, 18));
      } else {
        out.addRRect(Skia.RRectXY(Skia.XYWHRect(th.min.x, th.min.z, th.max.x - th.min.x + 30, th.max.z - th.min.z), 55, 55));
      }
    }
    return out;
  }, [view, which]);
  return (
    <Group opacity={ghost ? 0.38 : 1}>
      <Path path={p}>
        <LinearGradient start={vec(-560, -560)} end={vec(120, 0)} colors={DENIM} />
      </Path>
      <Path path={p} style="stroke" strokeWidth={2} color={INK} opacity={0.9} />
    </Group>
  );
}

export function BongoArt({ view, variant }: { view: ViewId; variant: VariantId }) {
  const onStand = variant === 'stand';
  const floorY = BONGO_MODEL.floorByVariant?.[variant] ?? 0;
  const legs = useMemo(() => STAND.legs.map((l) => ({ top: l.a, foot: l.b })), []);
  if (view === 'side') {
    return (
      <Group>
        <FloorSide y={floorY} u0={BONGO_MODEL.views.side!.u0} u1={BONGO_MODEL.views.side!.u1} />
        {onStand ? (
          <>
            <ContactShadow cx={0} cy={floorY + 2} rx={320} ry={9} />
            <StandLegs legs={[{ top: STAND.top, foot: STAND.hub }, ...legs]} view="side" ring={{ cx: 0, cv: 0, r: 46, y: STAND.top.y + 10 }} />
          </>
        ) : null}
        {onStand ? null : <Legs view="side" which="L" />}
        <ShellSide d={MACHO} look="staved" staves={10} lugs={RODS} plateDown={D.shellH.mm - 18} rimDepth={16} dim />
        <ShellSide d={HEMBRA} look="staved" staves={10} lugs={RODS} plateDown={D.shellH.mm - 18} rimDepth={16} />
        {onStand ? null : <Legs view="side" which="R" ghost />}
      </Group>
    );
  }
  return (
    <Group>
      {onStand ? <StandLegs legs={legs} view="top" ring={{ cx: 0, cv: 0, r: 0 }} /> : <Legs view="top" which="both" />}
      <Block view="top" />
      <HeadTop d={MACHO} look="rawhide" lugs={RODS} seed={5} />
      <HeadTop d={HEMBRA} look="rawhide" lugs={RODS} seed={17} />
    </Group>
  );
}

export function bongoLabels(view: ViewId, variant: VariantId): ArtLabel[] {
  const top = rimTopY(HEMBRA);
  if (view === 'side') {
    const out: ArtLabel[] = [
      { id: 'hembra', text: 'HEMBRA (IN FRONT)', short: 'HEMBRA', u: HEMBRA.R + 30, v: top - 26, align: 'left' },
      { id: 'macho', text: 'MACHO BEHIND IT', short: 'MACHO BEHIND', u: HEMBRA.R + 30, v: top + 60, align: 'left', tone: 'muted' },
      { id: 'bottom', text: 'OPEN LOWER ENDS', short: 'OPEN ENDS', u: HEMBRA.R + 30, v: HEMBRA.bottomY + 10, align: 'left', tone: 'muted' },
      { id: 'player', text: '← PLAYER', u: -380, v: top - 26, align: 'center', tone: 'muted' },
    ];
    if (variant === 'knees') out.push({ id: 'legs', text: 'PLAYER’S LEGS', short: 'LEGS', u: 130, v: -300, align: 'left', tone: 'muted' });
    return out;
  }
  return [
    { id: 'macho', text: 'MACHO', u: MACHO.c.x, v: MACHO.c.z - MACHO.R - 46, align: 'center' },
    { id: 'hembra', text: 'HEMBRA', u: HEMBRA.c.x, v: HEMBRA.c.z + HEMBRA.R + 36, align: 'center' },
    { id: 'player', text: '← PLAYER', u: -380, v: 0, align: 'center', tone: 'muted' },
    { id: 'aud', text: 'AUDIENCE →', u: BONGO_MODEL.views.top!.u1 - 20, v: BONGO_MODEL.views.top!.v1 - 36, align: 'right', tone: 'muted' },
  ];
}

export function bongoHitTest(view: ViewId, variant: VariantId, u: number, v: number, tol: number): string | null {
  if (view === 'top') {
    for (const d of [MACHO, HEMBRA]) if (planDist({ x: u, y: 0, z: v }, d.c.x, d.c.z) <= d.R + d.rim.t + tol) return `${d.id}.head`;
    if (Math.abs(u) <= 42 + tol && v > MACHO.c.z + MACHO.R - tol && v < HEMBRA.c.z - HEMBRA.R + tol) return 'bongo.block';
    if (variant === 'stand' && Math.hypot(u, v) <= 300 + tol) return 'bongo.stand';
    if (variant === 'knees' && u >= -560 - tol && u <= 110 + tol && Math.abs(v) >= 200 - tol && Math.abs(v) <= 400 + tol) return v < 0 ? 'player.thighL' : 'player.thighR';
    return null;
  }
  const top = rimTopY(HEMBRA);
  if (Math.abs(u - HEMBRA.c.x) <= HEMBRA.R + HEMBRA.rim.t + tol && v >= top - tol && v <= HEMBRA.headY + 20) return 'hembra.head';
  if (Math.abs(u - HEMBRA.c.x) <= HEMBRA.R + tol && v > HEMBRA.headY + 20 && v <= HEMBRA.bottomY + tol) return 'hembra.shell';
  if (variant === 'stand' && Math.abs(u) <= 300 && v > HEMBRA.bottomY) return 'bongo.stand';
  if (variant === 'knees' && u >= -560 - tol && u <= 200 + tol && v >= -560 - tol && v <= 0) return 'player.thighR';
  return null;
}
