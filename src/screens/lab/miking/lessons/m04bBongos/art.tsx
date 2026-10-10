/**
 * M04b BONGOS — the look (charter §2 layer 3), drawn only from model.ts /
 * geometry.ts anchors with the hand-drum family's parts. Side view: an
 * elevation from the player's right — the hembra in front, the macho behind
 * it. Top view: both heads, the centre block between them. Rod counts, rims
 * and the stand are drawing defaults (never stated in words).
 */
import { useMemo } from 'react';
import { DashPathEffect, Group, LinearGradient, Path, Skia, vec } from '@shopify/react-native-skia';
import type { VariantId, ViewId } from '../../engine/model/types.ts';
import type { ArtLabel } from '../../engine/scene/sceneTypes.ts';
import { ContactShadow, FloorSide, HeadTop, INK, ShellSide, StandLegs, WOOD } from '../shared/handdrums/handDrumArt';
import { planDist, rimTopY } from '../shared/handdrums/handDrumModel.ts';
import { BONGO_DIMS as D, HEMBRA, MACHO } from './model.ts';
import { BONGO_MODEL, LEGS, STAND } from './geometry.ts';
import { FigureMass, limb } from '../shared/players/PlayerFigure';
import { pt } from '../shared/players/playerPose';

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

/** The seated player's legs (KNEES), on the same boxes the collision uses
 *  (figure polish 2026-10-10 — they were flat slabs: a rounded box for the
 *  thigh, another for the shin, a bar for the shoe): the shared figure's
 *  trouser leg — the thigh from the hip tapering to the knee (≈ 164 mm deep
 *  at the hip, 124 at the knee), the shin to the ankle (80 mm), one mass,
 *  the house form gradient, rim and contour — and a leather shoe on the
 *  floor, its toe forward. Opaque, as every limb. From the player's right the
 *  NEAR leg stands in front of the drums: it is drawn as a PHANTOM — its
 *  outline in a dashed line, the technical illustrator's cut-away — so the
 *  shells and the open lower ends stay in view, never a see-through limb. */
function Legs({ view, which, phantom = false }: { view: ViewId; which: 'L' | 'R' | 'both'; phantom?: boolean }) {
  const masses = useMemo(() => {
    const out: { path: ReturnType<typeof Skia.Path.Make>; tone: 'trousers' | 'shoe' }[] = [];
    const sides = which === 'both' ? (['L', 'R'] as const) : ([which] as const);
    for (const sd of sides) {
      const th = LEGS[sd === 'L' ? 'thighL' : 'thighR'];
      const sh = LEGS[sd === 'L' ? 'shinL' : 'shinR'];
      if (th.kind !== 'box' || sh.kind !== 'box') continue;
      if (view === 'side') {
        const tv = (th.min.y + th.max.y) / 2;
        const hip = pt(th.min.x + 70, tv + 4);
        const knee = pt(th.max.x - 14, tv);
        const ankle = pt((sh.min.x + sh.max.x) / 2 - 10, sh.max.y - 92);
        out.push({ path: limb([hip, knee, ankle], [82, 62, 40]), tone: 'trousers' });
        // The shoe: the heel under the ankle, the toe forward, the sole on the floor.
        const f = pt(ankle.u + 40, sh.max.y);
        const P = (x: number, y: number) => pt(f.u + x, f.v + y);
        out.push({ path: smoothPath([P(-96, -2), P(-100, -64), P(-44, -92), P(40, -62), P(140, -34), P(150, -4)]), tone: 'shoe' });
      } else {
        const tz = (th.min.z + th.max.z) / 2;
        // From above: the shoe's toe past the knee, then the thigh over it.
        const toe = pt(sh.max.x + 120, tz);
        out.push({ path: limb([pt(sh.max.x - 40, tz), toe], [44, 40]), tone: 'shoe' });
        out.push({ path: limb([pt(th.min.x + 70, tz), pt(th.max.x - 14, tz)], [82, 64]), tone: 'trousers' });
      }
    }
    return out;
  }, [view, which]);
  if (phantom) {
    return (
      <Group>
        {masses.map((m, i) => (
          <Path key={i} path={m.path} style="stroke" strokeWidth={3} color="#9aa0ab" opacity={0.8}>
            <DashPathEffect intervals={[18, 12]} />
          </Path>
        ))}
      </Group>
    );
  }
  return (
    <Group>
      {masses.map((m, i) => (
        <FigureMass key={i} path={m.path} tone={m.tone} />
      ))}
    </Group>
  );
}

/** A smooth closed outline through points. */
function smoothPath(points: { u: number; v: number }[]) {
  const p = Skia.Path.Make();
  const n = points.length;
  const at = (i: number) => points[(i + n) % n];
  p.moveTo(points[0].u, points[0].v);
  for (let i = 0; i < n; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    const k = 0.45 / 3;
    p.cubicTo(p1.u + (p2.u - p0.u) * k, p1.v + (p2.v - p0.v) * k, p2.u - (p3.u - p1.u) * k, p2.v - (p3.v - p1.v) * k, p2.u, p2.v);
  }
  p.close();
  return p;
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
        <ShellSide d={MACHO} look="staved" staves={10} lugs={RODS} plateDown={D.shellH.mm - 18} rimDepth={16} hardware="ear" dim />
        <ShellSide d={HEMBRA} look="staved" staves={10} lugs={RODS} plateDown={D.shellH.mm - 18} rimDepth={16} hardware="ear" />
        {onStand ? null : <Legs view="side" which="R" phantom />}
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
      { id: 'player', text: '← PLAYER', u: BONGO_MODEL.views.side!.u0 + 20, v: top - 26, align: 'left', tone: 'muted', point: { u: BONGO_MODEL.views.side!.u0 - 400, v: top - 26 } },
    ];
    if (variant === 'knees') out.push({ id: 'legs', text: 'PLAYER’S LEGS', short: 'LEGS', u: 130, v: -300, align: 'left', tone: 'muted' });
    return out;
  }
  return [
    { id: 'macho', text: 'MACHO', u: MACHO.c.x, v: MACHO.c.z - MACHO.R - 46, align: 'center' },
    { id: 'hembra', text: 'HEMBRA', u: HEMBRA.c.x, v: HEMBRA.c.z + HEMBRA.R + 36, align: 'center' },
    { id: 'player', text: '← PLAYER', u: BONGO_MODEL.views.top!.u0 + 20, v: 0, align: 'left', tone: 'muted', point: { u: BONGO_MODEL.views.top!.u0 - 400, v: 0 } },
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
