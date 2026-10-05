/**
 * I06a TRIANGLE — the look (charter §2 layer 3), drawn ONLY from model.ts's
 * corners and geometry.ts's anchors, in millimetres of each view's plane:
 *   side   u = x, v = y — from the player's right: the triangle EDGE-ON (its
 *          face looks at the audience), the clip and line above it, the
 *          beater coming from the player's side;
 *   top    u = x, v = z — from above: the triangle edge-on along z;
 *   front  u = −z, v = y — from the audience: the triangle FACE-ON, the open
 *          corner on the player's left (screen right).
 * Steel rods lit from the upper left (metalArt.Rod); the player is quiet line
 * art. Nothing moves by itself (D8); paths are built once.
 */
import { useMemo, type ReactElement } from 'react';
import { View } from 'react-native';
import { BlurMask, Canvas, Circle, DashPathEffect, Group, LinearGradient, Path, RoundedRect, Skia, vec } from '@shopify/react-native-skia';
import { useStageTextScale } from '../../../rack/stageAspect';
import { fitXform } from '../../engine/geometry/frame.ts';
import { StaticLabels, type StaticLabel } from '../../engine/scene/StaticLabels';
import type { VariantId, ViewBox, ViewId } from '../../engine/model/types.ts';
import type { ArtLabel } from '../../engine/scene/sceneTypes.ts';
import { Floor, make, PlayerInk, playerFront, playerSide, playerTop, polyPath, Rod, STEEL, HIGHLIGHT } from '../shared/metal/metalArt';
import { polyBar, type BarGeom } from '../shared/metal/metalFigures';
import type { FrontArt } from '../shared/metal/metalPages';
import { BAR_SHAPES, barAt } from '../shared/metal/metalModes.ts';
import { HELD, MOUNTED, P0, ROD_D, rodPath, SIDE, TRI, type Corners } from './model.ts';
import { BASE_Y, CLIP, CLIP_Y, STAND, TOP_Y } from './geometry.ts';

const cornersOf = (v: VariantId): Corners => (v === 'mounted' ? MOUNTED : HELD);
/** Plane (z, y) → front (u = −z, v = y). */
const fr = ([z, y]: [number, number]): [number, number] => [-z, y];
const BEATER = TRI.beater.mm;
const BD = TRI.beaterD.mm;
/** The beater, held view: from the right hand (behind, below) to the base's middle. */
const BEAT_TIP: [number, number] = [0, BASE_Y];

function Clip({ u, v, w = CLIP.w, h = CLIP.h }: { u: number; v: number; w?: number; h?: number }): ReactElement {
  return (
    <Group>
      <RoundedRect x={u - w / 2} y={v} width={w} height={h} r={4}>
        <LinearGradient start={vec(u - w / 2, v)} end={vec(u + w / 2, v + h)} colors={['#4a4e57', '#24262c', '#101114']} />
      </RoundedRect>
      <RoundedRect x={u - w / 2} y={v} width={w} height={h} r={4} style="stroke" strokeWidth={1.4} color="#7c828e" />
      <Path path={polyPath([[u - w / 2 + 3, v + 5], [u + w / 2 - 3, v + 5]])} style="stroke" strokeWidth={1.2} color="#c8ccd4" opacity={0.5} />
    </Group>
  );
}

/** The thin line(s) from the clip to the corner: the main line and the catch line. */
function Lines({ u, v0, v1, spread = 5 }: { u: number; v0: number; v1: number; spread?: number }): ReactElement {
  const a = polyPath([[u - 3, v0], [u - spread, v1 - 6], [u, v1]]);
  const b = polyPath([[u + 3, v0], [u + spread, v1 - 6], [u, v1]]);
  return (
    <Group>
      <Path path={a} style="stroke" strokeWidth={1.3} color="#e6ebf2" opacity={0.9} />
      <Path path={b} style="stroke" strokeWidth={1.1} color="#9aa3b2" opacity={0.8}>
        <DashPathEffect intervals={[5, 3]} />
      </Path>
    </Group>
  );
}

function Beater({ a, b }: { a: [number, number]; b: [number, number] }): ReactElement {
  const p = polyPath([a, b]);
  return (
    <Group>
      <Rod path={p} d={BD} pal={STEEL} />
      {/* the grip end */}
      <Circle cx={a[0]} cy={a[1]} r={BD * 1.6} color="#2b2f36" />
    </Group>
  );
}

/* ═══════════════ side and top (the placement views) ═══════════════ */

const built: Partial<Record<string, ReactElement>> = {};

function sideArt(v: VariantId): ReactElement {
  const c = cornersOf(v);
  const ys = [c.top[1], c.open[1], c.closed[1]];
  const y0 = Math.min(...ys);
  const y1 = Math.max(...ys);
  const held = v !== 'mounted';
  // Edge-on: the rods overlap in one upright line; the level side is seen end-on.
  const upright = polyPath([[0, y0], [0, y1]]);
  const levelY = held ? BASE_Y : MOUNTED.top[1];
  const hand: [number, number] = [-40, CLIP_Y - 20];
  const strikeHand: [number, number] = [-230, BASE_Y + 70];
  return (
    <Group>
      <Floor u0={-3000} u1={3000} />
      <PlayerInk path={playerSide(held ? [hand, strikeHand] : [[-200, P0.y + 40], [-210, P0.y + 90]])} />
      {held ? null : (
        <Group>
          <Rod path={polyPath([[STAND.x, 0], [STAND.x, STAND.barY]])} d={STAND.r * 2} pal={STEEL} />
          <Circle cx={STAND.x} cy={STAND.barY} r={9} color="#3a3e46" />
          <Path path={polyPath([[STAND.x, STAND.barY], [0, levelY]])} style="stroke" strokeWidth={2} color="#c8ccd4" opacity={0.7} />
        </Group>
      )}
      <Rod path={upright} d={ROD_D} pal={STEEL} />
      <Circle cx={0} cy={levelY} r={ROD_D / 2}>
        <LinearGradient start={vec(-ROD_D / 2, levelY - ROD_D / 2)} end={vec(ROD_D / 2, levelY + ROD_D / 2)} colors={[STEEL[0], STEEL[2], STEEL[4]]} />
      </Circle>
      {held ? (
        <Group>
          <Lines u={0} v0={CLIP_Y + CLIP.h} v1={TOP_Y} />
          <Clip u={0} v={CLIP_Y} />
          <Beater a={strikeHand} b={[-ROD_D, BASE_Y]} />
        </Group>
      ) : (
        <Beater a={[-210, P0.y + 90]} b={[-ROD_D, (MOUNTED.open[1] + MOUNTED.top[1]) / 2 + 20]} />
      )}
    </Group>
  );
}

function topArt(v: VariantId): ReactElement {
  const held = v !== 'mounted';
  const z0 = -SIDE / 2;
  const z1 = SIDE / 2;
  const line = polyPath([[0, z0 + TRI.gap.mm / 2], [0, z1]]);
  const hand: [number, number] = [-40, 0];
  const strikeHand: [number, number] = [-230, 150];
  const shadow = make();
  shadow.addRRect(Skia.RRectXY(Skia.XYWHRect(-14, z0 - 6, 28, z1 - z0 + 12), 14, 14));
  return (
    <Group>
      <PlayerInk path={playerTop(held ? [hand, strikeHand] : [[-200, -90], [-200, 90]])} faint />
      {held ? null : (
        <Group>
          <Rod path={polyPath([[STAND.x, -STAND.barHalf], [STAND.x, STAND.barHalf]])} d={14} pal={STEEL} />
          <Circle cx={STAND.x} cy={0} r={STAND.r + 2} color="#3a3e46" />
        </Group>
      )}
      <Path path={shadow} color="#000" opacity={0.45}>
        <BlurMask blur={10} style="normal" />
      </Path>
      <Rod path={line} d={ROD_D} pal={STEEL} />
      {held ? (
        <Group>
          <Clip u={0} v={-CLIP.w / 2} h={CLIP.w} />
          <Beater a={strikeHand} b={[-ROD_D, 0]} />
        </Group>
      ) : (
        <Beater a={[-200, 90]} b={[-ROD_D, 20]} />
      )}
    </Group>
  );
}

export function TriangleArt({ view, variant }: { view: ViewId; variant: VariantId }) {
  const key = `${view}:${variant}`;
  return (built[key] ??= view === 'top' ? topArt(variant) : sideArt(variant));
}

export function triangleLabels(view: ViewId, variant: VariantId): ArtLabel[] {
  const held = variant !== 'mounted';
  if (view === 'top') {
    return [
      { id: 'tri', text: 'TRIANGLE · EDGE-ON', short: 'TRIANGLE', u: 30, v: -SIDE / 2 - 30, align: 'left' },
      { id: 'open', text: 'OPEN CORNER', short: 'OPEN', u: 30, v: -SIDE / 2 + 8, align: 'left', tone: 'muted' },
      ...(held ? [{ id: 'beater', text: 'BEATER', u: -150, v: 150, align: 'center' as const, tone: 'muted' as const }] : []),
      { id: 'player', text: 'PLAYER', u: -360, v: 160, align: 'center', tone: 'muted' },
    ];
  }
  return [
    { id: 'tri', text: 'TRIANGLE · EDGE-ON', short: 'TRIANGLE', u: 34, v: P0.y - 20, align: 'left' },
    ...(held ? [{ id: 'clip', text: 'CLIP · LINE', short: 'CLIP', u: 26, v: CLIP_Y + 10, align: 'left' as const, tone: 'muted' as const }] : [{ id: 'stand', text: 'STAND', u: STAND.x - 20, v: STAND.barY - 40, align: 'right' as const, tone: 'muted' as const }]),
    { id: 'beater', text: 'BEATER', u: -150, v: BASE_Y + 90, align: 'center', tone: 'muted' },
    { id: 'player', text: 'PLAYER', u: -360, v: -1780, align: 'center', tone: 'muted' },
  ];
}

/** Distance from (u, v) to the segment a–b. */
function segD(u: number, v: number, a: [number, number], b: [number, number]): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const t = Math.max(0, Math.min(1, ((u - a[0]) * dx + (v - a[1]) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(u - a[0] - t * dx, v - a[1] - t * dy);
}

export function triangleHitTest(view: ViewId, variant: VariantId, u: number, v: number, tol: number): string | null {
  const held = variant !== 'mounted';
  if (view === 'top') {
    if (Math.abs(u) <= ROD_D + tol && Math.abs(v) <= SIDE / 2 + tol) return held ? (v < -SIDE / 2 + 30 ? 'tri.open' : 'tri.base') : 'tri.topM';
    if (!held && Math.abs(u - STAND.x) <= 20 + tol && Math.abs(v) <= STAND.barHalf + tol) return 'tri.stand';
    return null;
  }
  if (held && Math.abs(u) <= CLIP.w + tol && v >= CLIP_Y - tol && v <= TOP_Y) return 'tri.clip';
  if (Math.abs(u) <= ROD_D + tol) {
    const c = cornersOf(variant);
    const ys = [c.top[1], c.open[1], c.closed[1]];
    if (v >= Math.min(...ys) - tol && v <= Math.max(...ys) + tol) return held ? (Math.abs(v - BASE_Y) < 20 ? 'tri.base' : 'tri.side') : 'tri.sideM';
  }
  if (!held && Math.abs(u - STAND.x) <= 16 + tol && v >= STAND.barY && v <= 0) return 'tri.stand';
  return null;
}

/* ═══════════════ front (from the audience): face-on ═══════════════ */

function frontTriangle(c: Corners): { rod: ReturnType<typeof polyPath>; pts: [number, number][] } {
  const pts = rodPath(c).map(fr);
  return { rod: polyPath(pts), pts };
}

function FrontTriangleArt({ variant, highlight }: { variant: VariantId; highlight: string | null }): ReactElement {
  const held = variant !== 'mounted';
  const c = cornersOf(variant);
  const { rod, pts } = frontTriangle(c);
  // The beater comes from behind the triangle (the player's side), its grip
  // low on the player's right (screen-left from the audience).
  const grip: [number, number] = [-150, BASE_Y + 105];
  const tip: [number, number] = [-8, BASE_Y + ROD_D * 0.2];
  const hl = (id: string) => highlight === id;
  const segOf = (id: string): [number, number][] | null => {
    if (id === 'tri.base' || id === 'tri.sideM') return [pts[0], pts[1]];
    if (id === 'tri.side' || id === 'tri.topM') return [pts[1], pts[2]];
    if (id === 'tri.oside' || id === 'tri.osideM') return [pts[2], pts[3]];
    return null;
  };
  const hiSeg = highlight ? segOf(highlight) : null;
  return (
    <Group>
      <Floor u0={-2000} u1={2000} />
      <PlayerInk path={playerFront(held ? [[60, CLIP_Y - 25], [-170, BASE_Y + 110]] : [[-150, P0.y + 80], [150, P0.y + 80]])} faint />
      {held ? null : (
        <Group>
          <Rod path={polyPath([[0, 0], [0, STAND.barY]])} d={STAND.r * 2} pal={STEEL} />
          <Rod path={polyPath([[-STAND.barHalf, STAND.barY], [STAND.barHalf, STAND.barY]])} d={12} pal={STEEL} />
          {[MOUNTED.top, MOUNTED.closed].map(fr).map(([u], i) => (
            <Group key={i}>
              <Lines u={u} v0={STAND.barY + 18} v1={MOUNTED.top[1] - ROD_D / 2} spread={3} />
              <Clip u={u} v={STAND.barY - 6} w={18} h={24} />
            </Group>
          ))}
        </Group>
      )}
      {hiSeg ? <Path path={polyPath(hiSeg)} style="stroke" strokeWidth={ROD_D * 2.6} strokeCap="round" color={HIGHLIGHT} opacity={0.35} /> : null}
      {hl('tri.open') ? <Circle cx={pts[0][0] + 6} cy={pts[0][1] - 8} r={26} color={HIGHLIGHT} opacity={0.3} /> : null}
      {hl('tri.corner') ? <Circle cx={pts[1][0] + 14} cy={pts[1][1] - 10} r={26} color={HIGHLIGHT} opacity={0.3} /> : null}
      <Rod path={rod} d={ROD_D} pal={STEEL} />
      {held ? (
        <Group>
          {hl('tri.clip') ? <Circle cx={0} cy={CLIP_Y + 20} r={40} color={HIGHLIGHT} opacity={0.3} /> : null}
          <Lines u={0} v0={CLIP_Y + CLIP.h} v1={TOP_Y - ROD_D / 2} />
          <Clip u={0} v={CLIP_Y} />
          {hl('tri.beater') ? <Path path={polyPath([grip, tip])} style="stroke" strokeWidth={BD * 5} strokeCap="round" color={HIGHLIGHT} opacity={0.35} /> : null}
          <Beater a={grip} b={tip} />
        </Group>
      ) : (
        <Group>
          {hl('tri.stand') ? <Path path={polyPath([[0, -60], [0, STAND.barY]])} style="stroke" strokeWidth={50} color={HIGHLIGHT} opacity={0.3} /> : null}
          {hl('tri.beater') ? <Path path={polyPath([[-180, P0.y + 120], [-40, P0.y + 30]])} style="stroke" strokeWidth={BD * 5} strokeCap="round" color={HIGHLIGHT} opacity={0.35} /> : null}
          <Beater a={[-180, P0.y + 120]} b={[-46, P0.y + 34]} />
          <Beater a={[180, P0.y + 120]} b={[46, P0.y + 34]} />
        </Group>
      )}
    </Group>
  );
}

function frontBox(_v: VariantId): ViewBox {
  return { u0: -250, u1: 250, v0: -1560, v1: -1080 };
}

function frontLabels(variant: VariantId): ArtLabel[] {
  const held = variant !== 'mounted';
  const c = cornersOf(variant);
  const [o, k] = [fr(c.open), fr(c.closed)];
  if (!held) {
    return [
      { id: 'tri.topM', text: 'CLOSED SIDE (ON TOP)', short: 'CLOSED SIDE', u: 0, v: MOUNTED.top[1] - 40, align: 'center' },
      { id: 'tri.open', text: 'OPEN CORNER', short: 'OPEN', u: o[0] + 26, v: o[1] + 8, align: 'left' },
      { id: 'tri.stand', text: 'STAND · TWO CLIPS', short: 'STAND', u: STAND.barHalf + 10, v: STAND.barY - 4, align: 'left', tone: 'muted' },
      { id: 'tri.beater', text: 'TWO BEATERS', short: 'BEATERS', u: -190, v: P0.y + 150, align: 'center', tone: 'muted' },
    ];
  }
  return [
    { id: 'tri.clip', text: 'CLIP · LINE', short: 'CLIP', u: 26, v: CLIP_Y + 12, align: 'left' },
    { id: 'tri.oside', text: 'SIDE', u: (fr(c.top)[0] + o[0]) / 2 + 26, v: (TOP_Y + o[1]) / 2 - 6, align: 'left', tone: 'muted' },
    { id: 'tri.side', text: 'SIDE (PLAYED)', short: 'SIDE', u: (fr(c.top)[0] + k[0]) / 2 - 26, v: (TOP_Y + k[1]) / 2 - 6, align: 'right' },
    { id: 'tri.open', text: 'OPEN CORNER', short: 'OPEN', u: o[0] + 16, v: o[1] + 4, align: 'left' },
    { id: 'tri.corner', text: 'CLOSED CORNER', short: 'CLOSED', u: k[0] - 16, v: k[1] + 4, align: 'right' },
    { id: 'tri.base', text: 'BASE', u: 30, v: BASE_Y + 34, align: 'left' },
    { id: 'tri.beater', text: 'BEATER', u: -160, v: BASE_Y + 128, align: 'center', tone: 'muted' },
  ];
}

function frontHit(variant: VariantId, u: number, v: number, tol: number): string | null {
  const held = variant !== 'mounted';
  const c = cornersOf(variant);
  const pts = rodPath(c).map(fr);
  const t = tol + ROD_D;
  if (held && Math.abs(u) <= CLIP.w + tol && v >= CLIP_Y - tol && v <= TOP_Y - ROD_D) return 'tri.clip';
  const o = fr(c.open);
  if (Math.hypot(u - o[0], v - o[1]) <= 24 + tol) return 'tri.open';
  if (held) {
    const k = fr(c.closed);
    if (Math.hypot(u - k[0], v - k[1]) <= 18 + tol * 0.6) return 'tri.corner';
    if (segD(u, v, [-150, BASE_Y + 105], [-8, BASE_Y]) <= BD + tol) return 'tri.beater';
  } else {
    if (Math.abs(u) <= 16 + tol && v >= STAND.barY && v <= 0) return 'tri.stand';
    if (Math.abs(v - STAND.barY) <= 16 + tol && Math.abs(u) <= STAND.barHalf) return 'tri.stand';
    if (segD(u, v, [-180, P0.y + 120], [-46, P0.y + 34]) <= BD + tol || segD(u, v, [180, P0.y + 120], [46, P0.y + 34]) <= BD + tol) return 'tri.beater';
  }
  const ids = held ? ['tri.base', 'tri.side', 'tri.oside'] : ['tri.sideM', 'tri.topM', 'tri.osideM'];
  let best: string | null = null;
  let bd = t;
  for (let i = 0; i < 3; i++) {
    const d = segD(u, v, pts[i], pts[i + 1]);
    if (d <= bd) {
      bd = d;
      best = ids[i];
    }
  }
  return best;
}

export const TRI_FRONT: FrontArt = { box: frontBox, Art: FrontTriangleArt, labels: frontLabels, hitTest: frontHit };

/* ═══════════════ HOW IT SOUNDS: the stroke over the face-on triangle ═══════════════ */

const TRI_BAR: BarGeom = polyBar(rodPath(HELD).map(fr), 240);
const BAR_M: BarGeom = polyBar(rodPath(MOUNTED).map(fr), 240);
const STRIKE_BOX: ViewBox = { u0: -200, u1: 240, v0: TOP_Y - 125, v1: BASE_Y + 125 };

/** The rod displaced by a weighted mix of the bar's shapes (motion drawn larger). */
function displaced(g: BarGeom, weights: readonly number[], amp: number): ReturnType<typeof polyPath> {
  const pts = g.pts.map(([u, v], i) => {
    const s = g.s[i];
    const d = weights.reduce((a, w, k) => a + w * barAt(BAR_SHAPES[k], s), 0) * amp;
    return [u + g.normals[i][0] * d, v + g.normals[i][1] * d] as [number, number];
  });
  return polyPath(pts);
}

/** Built on first use (Skia is ready by then on every platform). */
const strikeCache: Partial<Record<'held' | 'mounted', ReturnType<typeof buildStrikePaths>>> = {};
function buildStrikePaths(g: BarGeom) {
  const arcs = make();
  for (const r of [150, 185, 220]) {
    // Sound leaving all round: arcs on both sides of the rod.
    arcs.addArc(Skia.XYWHRect(-r, P0.y - r, 2 * r, 2 * r), -160, 120);
    arcs.addArc(Skia.XYWHRect(-r, P0.y - r, 2 * r, 2 * r), 20, 120);
  }
  return {
    rest: polyPath(g.pts as [number, number][]),
    bend: displaced(g, [1, 0.35, 0, 0], 9),
    ring: displaced(g, [0.55, 0.45, 0.35, 0.3, 0.25], 7),
    arcs,
  };
}
const strikePaths = (v: VariantId) => {
  const k = v === 'mounted' ? 'mounted' : 'held';
  return (strikeCache[k] ??= buildStrikePaths(k === 'mounted' ? BAR_M : TRI_BAR));
};

export function TriangleStrike({ w, h, variant, shown, accessibilityLabel }: { w: number; h: number; variant: VariantId; shown: number; accessibilityLabel: string }) {
  return <StrikeCanvas w={w} h={h} variant={variant} shown={shown} label={accessibilityLabel} />;
}

function StrikeCanvas({ w, h, variant, shown, label }: { w: number; h: number; variant: VariantId; shown: number; label: string }) {
  const textScale = useStageTextScale();
  const xf = useMemo(() => fitXform('side', STRIKE_BOX, w, h, 6), [w, h]);
  const held = variant !== 'mounted';
  const P = strikePaths(variant);
  const rodNow = shown <= 1 ? P.rest : shown === 2 ? P.bend : P.ring;
  // Held: one beater on the base's middle. Mounted: two beaters on the lower sides.
  const mp = rodPath(MOUNTED).map(fr);
  const lowL: [number, number] = [(mp[0][0] + mp[1][0]) / 2, (mp[0][1] + mp[1][1]) / 2];
  const lowR: [number, number] = [(mp[2][0] + mp[3][0]) / 2, (mp[2][1] + mp[3][1]) / 2];
  const contacts: [number, number][] = held ? [[0, BASE_Y]] : [lowL, lowR];
  const off = shown === 1 ? 2 : 14;
  const beaters: [[number, number], [number, number]][] = held
    ? [[[-150, BASE_Y + 105], [-8, BASE_Y + off]]]
    : [
        [[lowL[0] - 140, lowL[1] + 90], [lowL[0] - 8 - off / 2, lowL[1] + off / 2]],
        [[lowR[0] + 140, lowR[1] + 90], [lowR[0] + 8 + off / 2, lowR[1] + off / 2]],
      ];
  const labels: StaticLabel[] = [
    { id: 'n1', text: held ? '① BEATER' : '① BEATERS', u: -150, v: (held ? BASE_Y : lowL[1]) + 100, align: 'right', tone: shown === 1 ? 'amber' : 'muted' },
    { id: 'n2', text: shown >= 3 ? '③ RINGS IN MANY SHAPES' : '② THE BAR BENDS', short: shown >= 3 ? '③ RINGS' : '② BENDS', u: 125, v: P0.y + 70, align: 'left', tone: shown === 2 || shown === 3 ? 'amber' : 'muted' },
    { id: 'n4', text: '④ SOUND LEAVES ALL ROUND', short: '④ ALL ROUND', u: 0, v: TOP_Y - 100, align: 'center', tone: shown === 4 ? 'amber' : 'muted' },
    { id: 'clip', text: held ? 'HANGS FREELY' : 'TWO CLIPS', u: held ? 24 : SIDE / 2 + 24, v: held ? CLIP_Y + 12 : STAND.barY + 8, align: 'left', tone: 'muted' },
  ];
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={label}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          {shown >= 4 ? (
            <Path path={P.arcs} style="stroke" strokeWidth={3} color="#8fbcff" opacity={0.55}>
              <DashPathEffect intervals={[10, 8]} />
            </Path>
          ) : null}
          {held ? (
            <Group>
              <Lines u={0} v0={CLIP_Y + CLIP.h} v1={TOP_Y - ROD_D / 2} />
              <Clip u={0} v={CLIP_Y} />
            </Group>
          ) : (
            <Group>
              <Rod path={polyPath([[-STAND.barHalf, STAND.barY], [STAND.barHalf, STAND.barY]])} d={12} pal={STEEL} />
              {[MOUNTED.top, MOUNTED.closed].map(fr).map(([u], i) => (
                <Group key={i}>
                  <Lines u={u} v0={STAND.barY + 18} v1={MOUNTED.top[1] - ROD_D / 2} spread={3} />
                  <Clip u={u} v={STAND.barY - 6} w={18} h={24} />
                </Group>
              ))}
            </Group>
          )}
          {shown >= 2 ? <Path path={P.rest} style="stroke" strokeWidth={ROD_D} strokeCap="round" strokeJoin="round" color="#8a8f9c" opacity={0.25} /> : null}
          <Rod path={rodNow} d={ROD_D} pal={STEEL} />
          {shown === 1
            ? contacts.map(([cu, cv], i) => (
                <Group key={i}>
                  <Circle cx={cu} cy={cv} r={22} color="#ffc64d" opacity={0.35}>
                    <BlurMask blur={8} style="normal" />
                  </Circle>
                  <Circle cx={cu} cy={cv} r={16} style="stroke" strokeWidth={3} color="#ffc64d" />
                </Group>
              ))
            : null}
          {beaters.map(([a, b], i) => (
            <Beater key={i} a={a} b={b} />
          ))}
        </Group>
      </Canvas>
      <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
    </View>
  );
}

/** The shapes step's bar: the held triangle, face-on, as the bar it was bent from. */
export function triangleBar(): { box: ViewBox; geom: BarGeom; rodD: number; metal: readonly string[]; amp: number; under: ReactElement } {
  return {
    box: { u0: -170, u1: 200, v0: TOP_Y - 70, v1: BASE_Y + 60 },
    geom: TRI_BAR,
    rodD: ROD_D,
    metal: STEEL,
    amp: 14,
    under: (
      <Group>
        <Lines u={0} v0={CLIP_Y + CLIP.h} v1={TOP_Y - ROD_D / 2} />
        <Clip u={0} v={CLIP_Y} />
      </Group>
    ),
  };
}
