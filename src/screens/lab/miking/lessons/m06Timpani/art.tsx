/**
 * M06 TIMPANI — the look (charter §2 layer 3), drawn ONLY from model.ts and
 * the timpano drawing defaults, in millimetres of the view's (u, v): side
 * u = x, v = y (the floor at 0, the heads at −h); top u = x, v = z.
 *
 * SIDE: the camera stands on the player's right (+z) looking across the set,
 * so the drums overlap; the farther ones are drawn first and dimmed. TOP:
 * every drum from above, the pedals toward the player (left). The mallets
 * are drawn in the player's hands (illustrative positions). Nothing moves
 * (D8); the drums' paths are built once (TimpaniArt caches them).
 */
import { Group, LinearGradient, Path, vec } from '@shopify/react-native-skia';
import type { VariantId, ViewId } from '../../engine/model/types.ts';
import type { ArtLabel } from '../../engine/scene/sceneTypes.ts';
import { TimpanoSide, TimpanoTop } from '../shared/concert/TimpaniArt';
import { TIMPANO_DRAW } from '../shared/concert/timpanoSpec.ts';
import { Mallet } from '../shared/concert/Mallets';
import { FLOOR, make, rect, seg } from '../shared/concert/paths.ts';
import { HEAD_Y, R26, R29, TIMPANI, type Timpano } from './model.ts';

/** The mallets as drawn (illustrative: one about to strike, one raised). */
export const MALLETS = {
  side: [
    { grip: { x: -640, y: -1000 }, head: { x: -240, y: -782 } },
    { grip: { x: -680, y: -1090 }, head: { x: -420, y: -1160 } },
  ],
  top: [
    { grip: { x: -720, y: -250 }, head: { x: -245, y: -380 } },
    { grip: { x: -720, y: 240 }, head: { x: -300, y: 330 } },
  ],
} as const;

const shown = (variant: VariantId): Timpano[] => TIMPANI.filter((t) => variant === 'four' || !t.four);

let fl: { floor: ReturnType<typeof make>; edge: ReturnType<typeof make> } | null = null;
const floorPaths = () => (fl ??= { floor: rect(make(), -4000, 0, 4000, 600), edge: seg(make(), -4000, 0, 4000, 0) });

export function TimpaniArt({ view, variant }: { view: ViewId; variant: VariantId }) {
  const drums = shown(variant);
  if (view === 'top') {
    return (
      <Group>
        {drums.map((t) => (
          <Group key={t.id} transform={[{ translateX: t.c.x }, { translateY: t.c.z }]}>
            <TimpanoTop R={t.d.mm / 2} pedalA={Math.PI} />
          </Group>
        ))}
        {MALLETS.top.map((m, i) => (
          <Mallet key={i} kind="timpani" grip={m.grip} head={m.head} />
        ))}
      </Group>
    );
  }
  // Farthest from the camera (smallest z) first; the nearest drawn last, brightest.
  const order = [...drums].sort((a, b) => a.c.z - b.c.z);
  const FL = floorPaths();
  return (
    <Group>
      <Path path={FL.floor}>
        <LinearGradient start={vec(0, 0)} end={vec(0, 60)} colors={FLOOR} />
      </Path>
      <Path path={FL.edge} style="stroke" strokeWidth={2.5} color="#4a4c58" />
      {order.map((t, i) => (
        <Group key={t.id} transform={[{ translateX: t.c.x }]}>
          <TimpanoSide R={t.d.mm / 2} headY={HEAD_Y} floorY={0} dim={i === order.length - 1 ? 1 : 0.62 + 0.12 * i} />
        </Group>
      ))}
      {MALLETS.side.map((m, i) => (
        <Mallet key={i} kind="timpani" grip={m.grip} head={m.head} opacity={i === 1 ? 0.55 : 1} />
      ))}
    </Group>
  );
}

export function timpaniLabels(view: ViewId, variant: VariantId): ArtLabel[] {
  const four = variant === 'four';
  if (view === 'top') {
    const out: ArtLabel[] = shown(variant).map((t) => ({ id: `d${t.inch}`, text: `${t.inch} IN`, u: t.c.x + t.d.mm / 2 + 70, v: t.c.z, align: 'left' as const }));
    out.push({ id: 'player', text: '← PLAYER', u: -900, v: four ? -40 : -40, align: 'center', tone: 'muted' });
    out.push({ id: 'cond', text: 'CONDUCTOR →', short: 'CONDUCTOR', u: 930, v: four ? 1420 : 820, align: 'right', tone: 'muted' });
    out.push({ id: 'pedals', text: 'PEDALS', u: -R29 - 140, v: four ? -760 : -650, align: 'center', tone: 'illustrative' });
    return out;
  }
  return [
    { id: 'heads', text: four ? 'HEADS (FOUR DRUMS)' : 'HEADS (29 AND 26 IN)', short: 'HEADS', u: 40, v: HEAD_Y - TIMPANO_DRAW.hoopUp - 40, align: 'left' },
    { id: 'bowl', text: 'BOWLS (KETTLES)', short: 'BOWLS', u: R26 + 80, v: HEAD_Y + 240, align: 'left' },
    { id: 'pedal', text: 'PEDAL', u: -R29 - 160, v: -120, align: 'center', tone: 'illustrative' },
    { id: 'mallets', text: 'MALLETS', u: -560, v: -1250, align: 'center', tone: 'illustrative' },
    { id: 'player', text: '← PLAYER', u: -930, v: -560, align: 'center', tone: 'muted' },
    { id: 'cond', text: 'CONDUCTOR →', short: 'COND. →', u: 930, v: -560, align: 'right', tone: 'muted' },
    { id: 'floor', text: 'FLOOR', u: 930, v: -24, align: 'right', tone: 'illustrative' },
  ];
}

/** The part under a model point (u, v) in this view; `tol` in mm. */
export function timpaniHitTest(view: ViewId, variant: VariantId, u: number, v: number, tol: number): string | null {
  const drums = shown(variant);
  if (view === 'top') {
    for (const t of drums) {
      const R = t.d.mm / 2;
      const r = Math.hypot(u - t.c.x, v - t.c.z);
      if (u < t.c.x - R - TIMPANO_DRAW.pedal.gap + tol && u > t.c.x - R - TIMPANO_DRAW.pedal.gap - TIMPANO_DRAW.pedal.len - tol && Math.abs(v - t.c.z) <= TIMPANO_DRAW.pedal.w / 2 + tol) return `tp.pedal${t.inch}`;
      if (r <= R) return `tp.head${t.inch}`;
      if (r <= R + TIMPANO_DRAW.handle + tol) return `tp.hoop${t.inch}`;
    }
    return null;
  }
  // Side: the nearest drum (largest z) whose outline holds the point.
  const near = [...drums].sort((a, b) => b.c.z - a.c.z);
  for (const t of near) {
    const R = t.d.mm / 2;
    const dx = u - t.c.x;
    if (Math.abs(dx) <= R + tol && Math.abs(v - HEAD_Y) <= 16 + tol) return `tp.head${t.inch}`;
    if (dx < -R - TIMPANO_DRAW.pedal.gap + tol && dx > -R - TIMPANO_DRAW.pedal.gap - TIMPANO_DRAW.pedal.len - tol && v >= -80 - tol) return `tp.pedal${t.inch}`;
    if (Math.abs(dx) <= R + TIMPANO_DRAW.handle + tol && v >= HEAD_Y - 50 && v < HEAD_Y - 16) return `tp.hoop${t.inch}`;
    if (Math.abs(dx) <= R + TIMPANO_DRAW.lip + tol && v > HEAD_Y && v <= HEAD_Y + 2 * R * TIMPANO_DRAW.depthK) return `tp.bowl${t.inch}`;
  }
  return null;
}
