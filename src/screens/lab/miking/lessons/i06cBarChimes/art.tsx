/**
 * I06c BAR CHIMES — the look (charter §2 layer 3), drawn ONLY from model.ts's
 * row and geometry.ts's anchors, in millimetres of each view:
 *   side   u = x, v = y — from the player's right: the row END-ON;
 *   top    u = x, v = z — from above: the rail and the row of bars;
 *   front  u = −z, v = y — from the audience: the whole row face-on, the
 *          long bars on the player's left (screen right).
 * A hardwood rail, metal bars lit from the upper left (metalArt.Rod), thin
 * filaments; the player is quiet line art. Nothing moves by itself (D8).
 */
import { useMemo, type ReactElement } from 'react';
import { View } from 'react-native';
import { BlurMask, Canvas, Circle, DashPathEffect, Group, LinearGradient, Path, RoundedRect, Skia, vec } from '@shopify/react-native-skia';
import { useStageTextScale } from '../../../rack/stageAspect';
import { fitXform } from '../../engine/geometry/frame.ts';
import { StaticLabels, type StaticLabel } from '../../engine/scene/StaticLabels';
import type { VariantId, ViewBox, ViewId } from '../../engine/model/types.ts';
import type { ArtLabel } from '../../engine/scene/sceneTypes.ts';
import { ALU, Floor, GOLD_ALU, HIGHLIGHT, make, PlayerInk, playerFront, playerSide, playerTop, polyPath, Rod, STEEL, WOOD } from '../shared/metal/metalArt';
import { straightBar, type BarGeom } from '../shared/metal/metalFigures';
import type { FrontArt } from '../shared/metal/metalPages';
import { BAR_TOP, barsOf, BC, P0, RAIL_Y, type Bar } from './model.ts';
import { STAND } from './geometry.ts';
import { Hand } from '../shared/smallperc/Hand';
import { dorsalFlat, type Placement } from '../shared/smallperc/hands.ts';

const HALF = BC.rail.mm / 2;
const D = BC.barD.mm;
const metalOf = (v: VariantId) => (v === 'double' ? ALU : GOLD_ALU);

/** A hanging bar in a plane (u, v): from its filament top, rotated `deg`
 *  about the top (a swing), length L. */
function HangingBar({ u, L, deg = 0, pal, glow = false }: { u: number; L: number; deg?: number; pal: readonly string[]; glow?: boolean }): ReactElement {
  const a = (deg * Math.PI) / 180;
  const top: [number, number] = [u, BAR_TOP];
  const bot: [number, number] = [u + Math.sin(a) * L, BAR_TOP + Math.cos(a) * L];
  const fil = polyPath([[u, RAIL_Y + BC.railH.mm / 2], top]);
  return (
    <Group>
      <Path path={fil} style="stroke" strokeWidth={0.9} color="#d8dde6" opacity={0.7} />
      {glow ? <Path path={polyPath([top, bot])} style="stroke" strokeWidth={D * 2.4} strokeCap="round" color={HIGHLIGHT} opacity={0.35} /> : null}
      <Rod path={polyPath([top, bot])} d={D} pal={pal} shadow={false} />
    </Group>
  );
}

function Rail({ u0, u1 }: { u0: number; u1: number }): ReactElement {
  const h = BC.railH.mm;
  return (
    <Group>
      <RoundedRect x={u0} y={RAIL_Y - h / 2} width={u1 - u0} height={h} r={5}>
        <LinearGradient start={vec(0, RAIL_Y - h / 2)} end={vec(0, RAIL_Y + h / 2)} colors={[WOOD[0], WOOD[1], WOOD[2], WOOD[3]]} />
      </RoundedRect>
      <Path path={polyPath([[u0 + 6, RAIL_Y - h / 2 + 4], [u1 - 6, RAIL_Y - h / 2 + 4]])} style="stroke" strokeWidth={1.5} color="#ffe2b4" opacity={0.45} />
      <RoundedRect x={u0} y={RAIL_Y - h / 2} width={u1 - u0} height={h} r={5} style="stroke" strokeWidth={1.4} color="#2b1708" />
    </Group>
  );
}

/* ═══════════════ side and top ═══════════════ */

function sideArt(v: VariantId): ReactElement {
  const pal = metalOf(v);
  const hand: [number, number] = [-30, P0.y + 10];
  const rows = v === 'double' ? [-9, 9] : [0];
  const dep = BC.railDepth.mm;
  return (
    <Group>
      <Floor u0={-4000} u1={5000} />
      <PlayerInk path={playerSide([hand])} head="side" />
      <Rod path={polyPath([[0, 0], [0, RAIL_Y]])} d={STAND.r * 2} pal={STEEL} />
      {rows.map((x) => (
        <Group key={x}>
          {/* end-on, the bars overlap: the longest shows full length */}
          <Rod path={polyPath([[x, BAR_TOP], [x, BAR_TOP + BC.longest.mm]])} d={D} pal={pal} />
        </Group>
      ))}
      <RoundedRect x={-dep / 2} y={RAIL_Y - BC.railH.mm / 2} width={dep} height={BC.railH.mm} r={4}>
        <LinearGradient start={vec(-dep / 2, RAIL_Y - 15)} end={vec(dep / 2, RAIL_Y + 15)} colors={[WOOD[0], WOOD[1], WOOD[3]]} />
      </RoundedRect>
    </Group>
  );
}

function topArt(v: VariantId): ReactElement {
  const pal = metalOf(v);
  const bars = barsOf(v);
  const dep = BC.railDepth.mm;
  const shadow = make();
  shadow.addRRect(Skia.RRectXY(Skia.XYWHRect(-dep / 2 + 8, -HALF + 10, dep, 2 * HALF), 8, 8));
  return (
    <Group>
      <PlayerInk path={playerTop([[-40, -HALF + 20]])} faint head="top" />
      <Circle cx={0} cy={STAND.z} r={STAND.r + 4} color="#3a3e46" />
      <Path path={polyPath([[0, STAND.z], [0, HALF - 10]])} style="stroke" strokeWidth={10} color="#5a5f6a" />
      <Path path={shadow} color="#000" opacity={0.45}>
        <BlurMask blur={10} style="normal" />
      </Path>
      <RoundedRect x={-dep / 2} y={-HALF} width={dep} height={2 * HALF} r={6}>
        <LinearGradient start={vec(-dep / 2, 0)} end={vec(dep / 2, 0)} colors={[WOOD[0], WOOD[1], WOOD[3]]} />
      </RoundedRect>
      {bars.map((b, i) => (
        <Circle key={i} cx={b.x} cy={b.z} r={D / 2} color={pal[1]} />
      ))}
    </Group>
  );
}

const built: Partial<Record<string, ReactElement>> = {};
export function BarChimesArt({ view, variant }: { view: ViewId; variant: VariantId }) {
  const key = `${view}:${variant}`;
  return (built[key] ??= view === 'top' ? topArt(variant) : sideArt(variant));
}

export function barChimesLabels(view: ViewId, _variant: VariantId): ArtLabel[] {
  if (view === 'top') {
    return [
      { id: 'row', text: 'RAIL · ROW OF BARS', short: 'ROW', u: 40, v: -HALF - 40, align: 'left' },
      { id: 'long', text: 'LONG END', u: 40, v: -HALF + 20, align: 'left', tone: 'muted' },
      { id: 'player', text: 'PLAYER', u: -360, v: 160, align: 'center', tone: 'muted' },
    ];
  }
  return [
    { id: 'row', text: 'THE ROW, END-ON', short: 'ROW', u: 30, v: BAR_TOP + 80, align: 'left' },
    { id: 'rail', text: 'RAIL', u: 30, v: RAIL_Y - 30, align: 'left', tone: 'muted' },
    { id: 'player', text: 'PLAYER', u: -360, v: -1780, align: 'center', tone: 'muted' },
  ];
}

export function barChimesHitTest(view: ViewId, _variant: VariantId, u: number, v: number, tol: number): string | null {
  if (view === 'top') {
    if (Math.abs(u) <= BC.railDepth.mm / 2 + tol && Math.abs(v) <= HALF + tol) return 'bc.rail';
    if (Math.hypot(u, v - STAND.z) <= STAND.r + tol) return 'bc.stand';
    return null;
  }
  if (Math.abs(u) <= 24 + tol && Math.abs(v - RAIL_Y) <= BC.railH.mm / 2 + tol) return 'bc.rail';
  if (Math.abs(u) <= 15 + tol && v >= BAR_TOP && v <= BAR_TOP + BC.longest.mm + tol) return 'bc.bars';
  if (Math.abs(u) <= STAND.r + tol && v > BAR_TOP + BC.longest.mm && v <= 0) return 'bc.stand';
  return null;
}

/* ═══════════════ front (from the audience) ═══════════════ */

const FU = (z: number) => -z;

/** The sweeping hand seen from the audience: the back of the player's LEFT
 *  hand, fingers together pointing up, the thumb to the outside — an
 *  anatomical hand at true size (smallperc/hands.ts dorsalFlat: ≈ 190 mm
 *  wrist to fingertip, ≈ 85 mm across the knuckles), its middle fingertip at
 *  (u, v), the forearm down out of the drawing. */
const SWEEP_HAND = dorsalFlat(0);
const TIP = SWEEP_HAND.fingers.find((f) => f.layer === 2)!.tip;
function handAtTip(u: number, v: number): { pl: Placement; arm: { from: readonly [number, number]; w: number; sleeve: number } } {
  const at: [number, number] = [u - TIP[1], v + TIP[0]];
  return { pl: { at, angle: -90, mirror: true }, arm: { from: [at[0] + 40, at[1] + 520], w: 54, sleeve: 300 } };
}
function SweepHand({ u, v, glow }: { u: number; v: number; glow?: boolean }): ReactElement {
  const h = useMemo(() => handAtTip(u, v), [u, v]);
  return (
    <Group>
      {glow ? <Circle cx={u} cy={v + 90} r={110} color={HIGHLIGHT} opacity={0.3} /> : null}
      <Hand geo={SWEEP_HAND} pl={h.pl} forearm={h.arm} />
    </Group>
  );
}

function FrontImpl({ variant, highlight }: { variant: VariantId; highlight: string | null }): ReactElement {
  const pal = metalOf(variant);
  const bars = barsOf(variant);
  const hl = (id: string) => highlight === id;
  const handAt: [number, number] = [FU(-HALF) + 30, P0.y - 10];
  return (
    <Group>
      <Floor u0={-2400} u1={2400} />
      <PlayerInk path={playerFront([handAt])} faint head="front" />
      {hl('bc.stand') ? <Path path={polyPath([[FU(STAND.z), -40], [FU(STAND.z), RAIL_Y]])} style="stroke" strokeWidth={50} color={HIGHLIGHT} opacity={0.3} /> : null}
      <Rod path={polyPath([[FU(STAND.z), 0], [FU(STAND.z), RAIL_Y], [FU(HALF) + 12, RAIL_Y]])} d={STAND.r * 2} pal={STEEL} />
      {[...bars].sort((a, b) => a.x - b.x).map((b, i) => (
        <HangingBar key={i} u={FU(b.z)} L={b.L} pal={b.x > 0 ? [pal[2], pal[2], pal[3], pal[4], pal[4]] : pal} glow={hl('bc.bars')} />
      ))}
      {hl('bc.filament') ? <Path path={polyPath([[FU(-HALF), BAR_TOP - 8], [FU(HALF), BAR_TOP - 8]])} style="stroke" strokeWidth={24} color={HIGHLIGHT} opacity={0.35} /> : null}
      {hl('bc.rail') ? <RoundedRect x={FU(HALF) - 12} y={RAIL_Y - 30} width={2 * HALF + 24} height={60} r={10} color={HIGHLIGHT} opacity={0.3} /> : null}
      <Rail u0={FU(HALF)} u1={FU(-HALF)} />
      <SweepHand u={handAt[0]} v={handAt[1]} glow={hl('bc.hand')} />
    </Group>
  );
}

function frontBox(_v: VariantId): ViewBox {
  return { u0: -330, u1: 330, v0: RAIL_Y - 110, v1: BAR_TOP + BC.longest.mm + 120 };
}

function frontLabels(_v: VariantId): ArtLabel[] {
  return [
    { id: 'bc.rail', text: 'RAIL', u: 0, v: RAIL_Y - 34, align: 'center' },
    { id: 'bc.bars', text: 'LONG BARS', u: FU(-HALF) + 14, v: BAR_TOP + BC.longest.mm + 26, align: 'center' },
    { id: 'bc.short', text: 'SHORT BARS', u: FU(HALF) + 70, v: BAR_TOP + BC.shortest.mm + 95, align: 'center', tone: 'muted' },
    { id: 'bc.filament', text: 'FILAMENTS ↓', short: 'FILAMENTS', u: FU(-HALF) - 10, v: RAIL_Y - 34, align: 'right', tone: 'muted' },
    { id: 'bc.stand', text: 'STAND', u: FU(STAND.z) - 18, v: BAR_TOP + 200, align: 'right', tone: 'muted' },
    { id: 'bc.hand', text: 'HAND', u: FU(-HALF) + 80, v: P0.y + 60, align: 'left' },
  ];
}

function frontHit(v: VariantId, u: number, vv: number, tol: number): string | null {
  if (Math.abs(vv - RAIL_Y) <= BC.railH.mm / 2 + tol && Math.abs(u) <= HALF + tol) return 'bc.rail';
  const hand: [number, number] = [FU(-HALF) + 30, P0.y - 10];
  if (Math.abs(u - hand[0]) <= 50 + tol && vv >= hand[1] - 10 && vv <= hand[1] + 200) return 'bc.hand';
  if (vv > RAIL_Y && vv < BAR_TOP + 4 && Math.abs(u) <= HALF) return 'bc.filament';
  for (const b of barsOf(v)) if (Math.abs(u - FU(b.z)) <= D + tol * 0.5 && vv >= BAR_TOP && vv <= BAR_TOP + b.L + tol) return 'bc.bars';
  if (Math.abs(u - FU(STAND.z)) <= STAND.r + tol && vv >= RAIL_Y && vv <= 0) return 'bc.stand';
  return null;
}

export const BC_FRONT: FrontArt = { box: frontBox, Art: FrontImpl, labels: frontLabels, hitTest: frontHit };

/* ═══════════════ HOW IT SOUNDS: the sweep ═══════════════ */

const SWEEP_BOX: ViewBox = { u0: -260, u1: 260, v0: RAIL_Y - 70, v1: BAR_TOP + BC.longest.mm + 110 };

/** Each bar's swing (degrees) at an event: struck bars swing away from the
 *  hand's travel, the earlier-struck ones a little less (drawn larger than life). */
function swingAt(bars: readonly Bar[], shown: number): number[] {
  // The hand travels from the long end (−z) toward the short end (+z).
  const handZ = shown <= 1 ? -HALF - 40 : shown === 2 ? 0 : HALF + 40;
  return bars.map((b) => {
    if (shown <= 1 || b.z > handZ) return 0;
    const age = (handZ - b.z) / (2 * HALF); // 0 just struck … 1 struck first
    return -(BC.swingDeg.mm * (shown >= 3 ? 0.9 - 0.45 * age : 1 - 0.3 * age));
  });
}

export function BarChimesStrike({ w, h, variant, shown, accessibilityLabel }: { w: number; h: number; variant: VariantId; shown: number; accessibilityLabel: string }) {
  const textScale = useStageTextScale();
  const xf = useMemo(() => fitXform('side', SWEEP_BOX, w, h, 6), [w, h]);
  const pal = metalOf(variant);
  const bars = barsOf(variant);
  const sw = swingAt(bars, shown);
  const handZ = shown <= 1 ? -HALF - 40 : shown === 2 ? 0 : HALF + 50;
  const arcs = useMemo(() => {
    const p = make();
    for (const r of [60, 110]) {
      p.addRRect(Skia.RRectXY(Skia.XYWHRect(-HALF - r, BAR_TOP - r * 0.5, 2 * (HALF + r), BC.longest.mm + r), r, r));
    }
    return p;
  }, []);
  const labels: StaticLabel[] = [
    { id: 'n1', text: '① THE HAND ENTERS', short: '① HAND', u: FU(-HALF) + 40, v: RAIL_Y - 40, align: 'center', tone: shown === 1 ? 'amber' : 'muted' },
    { id: 'n2', text: '② ONE BAR AFTER ANOTHER', short: '② IN TURN', u: 0, v: BAR_TOP + BC.longest.mm + 40, align: 'center', tone: shown === 2 ? 'amber' : 'muted' },
    { id: 'n3', text: '③ THEY RING ON, OVERLAPPING', short: '③ OVERLAP', u: 0, v: BAR_TOP + BC.longest.mm + 80, align: 'center', tone: shown === 3 ? 'amber' : 'muted' },
    { id: 'n4', text: '④ SOUND ALONG THE ROW', short: '④ ALONG', u: FU(HALF) - 10, v: RAIL_Y - 40, align: 'center', tone: shown === 4 ? 'amber' : 'muted' },
  ];
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          {shown >= 4 ? (
            <Path path={arcs} style="stroke" strokeWidth={2.4} color="#8fbcff" opacity={0.5}>
              <DashPathEffect intervals={[10, 8]} />
            </Path>
          ) : null}
          {bars.map((b, i) => (
            <Group key={i}>
              {sw[i] !== 0 && shown >= 2 ? <Circle cx={FU(b.z) + Math.sin((sw[i] * Math.PI) / 180) * b.L} cy={BAR_TOP + b.L} r={6} color="#ffc64d" opacity={shown >= 3 ? 0.55 : 0.85} /> : null}
              <HangingBar u={FU(b.z)} L={b.L} deg={sw[i]} pal={b.x > 0 ? [pal[2], pal[2], pal[3], pal[4], pal[4]] : pal} />
            </Group>
          ))}
          <Rail u0={FU(HALF)} u1={FU(-HALF)} />
          <SweepHand u={FU(handZ)} v={P0.y - 30} />
        </Group>
      </Canvas>
      <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
    </View>
  );
}

/** The shapes step's bar: one hanging bar of length L, under a rail stub. */
export function chimeBar(variant: VariantId, L?: number): { box: ViewBox; geom: BarGeom; rodD: number; metal: readonly string[]; amp: number; under: ReactElement } {
  const len = L ?? BC.longest.mm;
  return {
    box: { u0: -120, u1: 120, v0: RAIL_Y - 40, v1: BAR_TOP + BC.longest.mm + 30 },
    geom: straightBar(0, BAR_TOP, BAR_TOP + len),
    rodD: D,
    metal: metalOf(variant),
    amp: 16,
    under: (
      <Group>
        <Rail u0={-60} u1={60} />
        <Path path={polyPath([[0, RAIL_Y + BC.railH.mm / 2], [0, BAR_TOP]])} style="stroke" strokeWidth={0.9} color="#d8dde6" opacity={0.8} />
      </Group>
    ),
  };
}
