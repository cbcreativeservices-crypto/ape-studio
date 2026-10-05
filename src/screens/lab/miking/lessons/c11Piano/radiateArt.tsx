/**
 * C11 PIANO — WHERE THE SOUND LEAVES (HOW IT SOUNDS, step 3). A picture of
 * DIRECTION, never of amount (LESSON_JOURNEY §7: body and soundboard
 * radiation stay in words; the arrows only say where sound goes).
 *
 *   grand   an END VIEW cut across the case (looking from the keyboard):
 *           the bass rim (the lid's hinge) on the left, the curved treble rim
 *           on the right, the soundboard and strings between; the lid on the
 *           full stick, the short stick, closed or off. Arrows: up from the
 *           soundboard, off the lid's underside toward the curved side (where
 *           the audience usually sits), and down under the piano.
 *   upright a side view: out of the back toward the wall, and up through the
 *           top; the wall pulled out, pushed back, or the top closed.
 * Static (D8); built from the shared piano family.
 */
import { useMemo } from 'react';
import { View } from 'react-native';
import { BlurMask, Canvas, DashPathEffect, Group, LinearGradient, Path, Skia, vec } from '@shopify/react-native-skia';
import { useStageTextScale } from '../../../rack/stageAspect';
import type { VariantId, ViewBox } from '../../engine/model/types.ts';
import { fitXform } from '../../engine/geometry/frame.ts';
import { StaticLabels, type StaticLabel } from '../../engine/scene/StaticLabels';
import { FLOOR_Y, GRAND_DIMS, LID_DEG, type GrandGeom, type LidState } from '../shared/piano/pianoSpec.ts';
import { PIANO_PALETTE as P, UprightSide } from '../shared/piano/PianoArt';
import { GB, GS, SETUP, UP, type PianoVariant } from './model.ts';

const AIR = '#9cc4ff';
type SkPath = ReturnType<typeof Skia.Path.Make>;

export const GRAND_END_BOX: ViewBox = { u0: -1000, u1: 1650, v0: -1150, v1: FLOOR_Y + 30 };
export const UPRIGHT_RAD_BOX: ViewBox = { u0: -700, u1: 700, v0: -1150, v1: FLOOR_Y + 30 };

function arrow(p: SkPath, x0: number, y0: number, x1: number, y1: number, head = 30) {
  p.moveTo(x0, y0);
  p.lineTo(x1, y1);
  const a = Math.atan2(y1 - y0, x1 - x0);
  p.moveTo(x1 - head * Math.cos(a - 0.45), y1 - head * Math.sin(a - 0.45));
  p.lineTo(x1, y1);
  p.lineTo(x1 - head * Math.cos(a + 0.45), y1 - head * Math.sin(a + 0.45));
}
const rr = (x0: number, y0: number, x1: number, y1: number, r: number) => {
  const p = Skia.Path.Make();
  p.addRRect(Skia.RRectXY(Skia.XYWHRect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0)), r, r));
  return p;
};

type EndPaths = { body: SkPath; inside: SkPath; board: SkPath; plate: SkPath; strings: SkPath; legs: SkPath; lid: SkPath | null; stick: SkPath | null; up: SkPath; reflect: SkPath; down: SkPath; leak: SkPath; floor: SkPath };
const endCache = new Map<string, EndPaths>();

/** The case cut across at x = xm, seen from the keyboard (u = z, v = y). */
function endPaths(g: GrandGeom, lid: LidState): EndPaths {
  const key = `${g.spec.id}:${lid}`;
  const hit = endCache.get(key);
  if (hit) return hit;
  const xm = g.xKey + 0.45 * (g.xTail - g.xKey);
  const zb = -g.hw;
  const zt = Math.min(g.hw, g.bentZ(xm));
  const t = GRAND_DIMS.rimT.mm;
  const body = rr(zb, g.rimTop, zt, g.caseBottom, 10);
  const inside = rr(zb + t, g.rimTop + 2, zt - t, GRAND_DIMS.soundboardY.mm, 4);
  const board = rr(zb + t, GRAND_DIMS.soundboardY.mm, zt - t, GRAND_DIMS.soundboardY.mm + 10, 2);
  const plate = rr(zb + t + 20, -6, zt - t - 20, 26, 6);
  const strings = Skia.Path.Make();
  for (let z = zb + t + 40; z < zt - t - 30; z += 22) strings.addCircle(z, -10, 4.5);
  const legs = Skia.Path.Make();
  for (const z of [-g.hw + 110, g.hw - 110]) legs.addRRect(Skia.RRectXY(Skia.XYWHRect(z - 40, g.caseBottom, 80, FLOOR_Y - 40 - g.caseBottom), 16, 16));
  const deg = LID_DEG[lid];
  const a = (deg * Math.PI) / 180;
  const W = zt - zb;
  const T = GRAND_DIMS.lidT.mm;
  let lidP: SkPath | null = null;
  let stick: SkPath | null = null;
  if (lid !== 'off') {
    lidP = Skia.Path.Make();
    const c = Math.cos(a);
    const s = Math.sin(a);
    // The lid's section: from the hinge (bass rim) out to its free edge.
    lidP.moveTo(zb, g.rimTop);
    lidP.lineTo(zb + W * c, g.rimTop - W * s);
    lidP.lineTo(zb + W * c - T * s, g.rimTop - W * s - T * c);
    lidP.lineTo(zb - T * s, g.rimTop - T * c);
    lidP.close();
    if (lid === 'full' || lid === 'short') {
      // From the treble rim, leaning in to a cup under the lid near its free
      // edge (the shared family's stick).
      stick = Skia.Path.Make();
      stick.moveTo(zt - t / 2, g.rimTop);
      stick.lineTo(zb + 0.9 * W * c, g.rimTop - 0.9 * W * s);
    }
  }
  // Direction arrows: up from the board; off the lid toward the curved side;
  // down under the case. Closed: short leaks at the rim, more sound kept in.
  const up = Skia.Path.Make();
  const reflect = Skia.Path.Make();
  const down = Skia.Path.Make();
  const leak = Skia.Path.Make();
  const mid = (zb + zt) / 2;
  if (lid === 'off') {
    for (const dz of [-220, 0, 220]) arrow(up, mid + dz, 40, mid + dz * 1.6, -900);
  } else if (lid === 'closed') {
    for (const dz of [-200, 0, 200]) arrow(up, mid + dz, 40, mid + dz, g.rimTop + 30);
    arrow(leak, zt - 30, g.rimTop - 10, zt + 260, g.rimTop - 60, 24);
  } else {
    // Rays leaving the board tilted 30° toward the open side meet the lid's
    // underside (the plane through the hinge at angle a) and reflect off it
    // (mirror law) — direction only; the board radiates every way.
    const phi = (30 * Math.PI) / 180;
    const d = { z: Math.sin(phi), y: -Math.cos(phi) };
    const n = { z: Math.sin(a), y: Math.cos(a) };
    for (const f of [0.18, 0.4, 0.62]) {
      const z0 = zb + t + (W - 2 * t) * f;
      const y0 = 40;
      // Hit: y = rimTop − (z − zb)·tan a along z0 + d.z·s, y0 + d.y·s.
      const sHit = (y0 - g.rimTop + (z0 - zb) * Math.tan(a)) / (-d.y - d.z * Math.tan(a));
      const hz = z0 + d.z * sHit;
      const hy = y0 + d.y * sHit;
      if (!(sHit > 0) || hz > zb + W * Math.cos(a)) continue;
      up.moveTo(z0, y0);
      up.lineTo(hz, hy + 8);
      const dn = d.z * n.z + d.y * n.y;
      const r = { z: d.z - 2 * dn * n.z, y: d.y - 2 * dn * n.y };
      const L = lid === 'full' ? 1050 : 900;
      arrow(reflect, hz, hy + 8, hz + r.z * L, hy + 8 + r.y * L);
    }
  }
  for (const dz of [-260, 0, 260]) arrow(down, mid + dz, g.caseBottom + 30, mid + dz * 1.3, FLOOR_Y - 90, 24);
  const floor = Skia.Path.Make();
  floor.moveTo(GRAND_END_BOX.u0, FLOOR_Y);
  floor.lineTo(GRAND_END_BOX.u1, FLOOR_Y);
  const out = { body, inside, board, plate, strings, legs, lid: lidP, stick, up, reflect, down, leak, floor };
  endCache.set(key, out);
  return out;
}

export function GrandEndSection({ g, lid }: { g: GrandGeom; lid: LidState }) {
  const p = endPaths(g, lid);
  return (
    <Group>
      <Path path={p.floor} style="stroke" strokeWidth={4} color="#3a3d45" />
      <Path path={p.legs}>
        <LinearGradient start={vec(-g.hw, 0)} end={vec(g.hw, 0)} colors={['#3a3c44', '#141418', '#08080a']} />
      </Path>
      <Path path={p.body}>
        <LinearGradient start={vec(-g.hw, g.rimTop)} end={vec(g.hw, g.caseBottom)} colors={[...P.LACQUER]} positions={[...P.LACQUER_POS]} />
      </Path>
      <Path path={p.inside} color="#121216" />
      <Path path={p.board}>
        <LinearGradient start={vec(0, 90)} end={vec(0, 100)} colors={[...P.SPRUCE]} />
      </Path>
      <Path path={p.plate}>
        <LinearGradient start={vec(0, -6)} end={vec(0, 26)} colors={[...P.GOLD]} positions={[0, 0.35, 0.75, 1]} />
      </Path>
      <Path path={p.strings} color={P.STEEL} />
      {p.lid ? (
        <Group>
          <Group transform={[{ translateX: 10 }, { translateY: 14 }]}>
            <Path path={p.lid} color="#000" opacity={0.5}>
              <BlurMask blur={14} style="normal" />
            </Path>
          </Group>
          <Path path={p.lid}>
            <LinearGradient start={vec(-g.hw, -900)} end={vec(g.hw, g.rimTop)} colors={['#5a5d66', '#1f2025', '#0c0c0f']} />
          </Path>
          <Path path={p.lid} style="stroke" strokeWidth={4} color="#c8ccd4" opacity={0.5} />
        </Group>
      ) : null}
      {p.stick ? <Path path={p.stick} style="stroke" strokeWidth={18} strokeCap="round" color="#141418" /> : null}
      {p.stick ? <Path path={p.stick} style="stroke" strokeWidth={5} strokeCap="round" color="#8a8f99" opacity={0.7} /> : null}
      <Path path={p.up} style="stroke" strokeWidth={9} strokeCap="round" strokeJoin="round" color={AIR} />
      <Path path={p.reflect} style="stroke" strokeWidth={9} strokeCap="round" strokeJoin="round" color={AIR}>
        <DashPathEffect intervals={[34, 18]} />
      </Path>
      <Path path={p.leak} style="stroke" strokeWidth={7} strokeCap="round" strokeJoin="round" color={AIR} opacity={0.7}>
        <DashPathEffect intervals={[20, 14]} />
      </Path>
      <Path path={p.down} style="stroke" strokeWidth={8} strokeCap="round" strokeJoin="round" color={AIR} opacity={0.8}>
        <DashPathEffect intervals={[26, 16]} />
      </Path>
    </Group>
  );
}

type UpRad = { back: SkPath; up: SkPath; bounce: SkPath };
const upCache = new Map<string, UpRad>();
function upRad(option: string): UpRad {
  const hit = upCache.get(option);
  if (hit) return hit;
  const wallX = option === 'wall' ? UP.xBack + 25 : UP.wallX;
  const back = Skia.Path.Make();
  const up = Skia.Path.Make();
  const bounce = Skia.Path.Make();
  for (const y of [-260, 40, 340]) {
    if (option === 'wall') arrow(back, UP.xBack + 4, y, wallX - 6, y, 18);
    else arrow(back, UP.xBack + 20, y, wallX - 30, y);
    if (option !== 'wall') arrow(bounce, wallX - 40, y + 30, UP.xBack + 80, y + 150, 24);
  }
  if (option !== 'closed') for (const x of [-170, -40, 40]) arrow(up, x, UP.yTop - 20, x * 1.4, UP.yTop - 520);
  const out = { back, up, bounce };
  upCache.set(option, out);
  return out;
}

export function PianoRadiation({ w, h, variant, option, accessibilityLabel }: { w: number; h: number; variant: VariantId; option: string; accessibilityLabel: string }) {
  const textScale = useStageTextScale();
  const s = SETUP[(variant as PianoVariant) in SETUP ? (variant as PianoVariant) : 'grand'];
  const box = s.kind === 'grand' ? GRAND_END_BOX : UPRIGHT_RAD_BOX;
  const xf = useMemo(() => fitXform('side', box, w, h, 6), [box, w, h]);
  if (s.kind === 'grand') {
    const g = s.id === 'S' ? GS : GB;
    const lid = (['full', 'short', 'closed', 'off'] as const).includes(option as LidState) ? (option as LidState) : 'full';
    const labels: StaticLabel[] = [
      { id: 'bass', text: 'BASS SIDE · HINGE', short: 'BASS', u: -g.hw + 20, v: g.caseBottom + 60, align: 'left', tone: 'muted' },
      { id: 'treble', text: 'CURVED SIDE', short: 'CURVE', u: g.hw - 40, v: g.caseBottom + 60, align: 'right', tone: 'muted' },
      { id: 'aud', text: 'AUDIENCE, USUALLY →', short: 'AUDIENCE →', u: GRAND_END_BOX.u1 - 20, v: -1060, align: 'right', tone: 'blue' },
      { id: 'under', text: 'UNDER THE PIANO', short: 'UNDER', u: 0, v: FLOOR_Y - 40, align: 'center', tone: 'blue' },
      { id: 'look', text: 'SEEN FROM THE KEYBOARD, CUT ACROSS', short: 'FROM THE KEYS', u: GRAND_END_BOX.u0 + 20, v: -1060, align: 'left', tone: 'illustrative' },
    ];
    return (
      <View style={{ width: w, height: h }}>
        <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
          <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
            <GrandEndSection g={g} lid={lid} />
          </Group>
        </Canvas>
        <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
      </View>
    );
  }
  const r = upRad(option);
  const wallX = option === 'wall' ? UP.xBack + 25 : UP.wallX;
  const labels: StaticLabel[] = [
    { id: 'wall', text: 'WALL', u: wallX + 30, v: -1000, align: 'center', tone: 'muted' },
    { id: 'back', text: 'OUT AT THE BACK', short: 'BACK', u: UP.xBack + 40, v: -420, align: 'left', tone: 'blue' },
    { id: 'top', text: option === 'closed' ? 'TOP CLOSED' : 'UP THROUGH THE TOP', short: 'TOP', u: -60, v: -1060, align: 'center', tone: option === 'closed' ? 'muted' : 'blue' },
    { id: 'look', text: 'SIDE VIEW', u: UPRIGHT_RAD_BOX.u0 + 20, v: -1060, align: 'left', tone: 'illustrative' },
  ];
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          <UprightSide panelOn={s.panel} wallX={wallX} topClosed={option === 'closed'} />
          <Path path={r.back} style="stroke" strokeWidth={9} strokeCap="round" strokeJoin="round" color={AIR} />
          <Path path={r.bounce} style="stroke" strokeWidth={8} strokeCap="round" strokeJoin="round" color={AIR} opacity={0.75}>
            <DashPathEffect intervals={[26, 16]} />
          </Path>
          <Path path={r.up} style="stroke" strokeWidth={8} strokeCap="round" strokeJoin="round" color={AIR}>
            <DashPathEffect intervals={[26, 16]} />
          </Path>
        </Group>
      </Canvas>
      <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
    </View>
  );
}
