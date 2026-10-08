/**
 * I12 GONG — the look (charter §2 layer 3), drawn ONLY from model.ts's sizes
 * and geometry.ts's anchors, in millimetres of each view:
 *   side   u = x, v = y — from the side: the gong EDGE-ON in its frame, its
 *          turned rim behind, the face (and a boss) toward the audience;
 *   top    u = x, v = z — from above;
 *   front  u = −z, v = y — from the audience: the face, the cords, the frame,
 *          the player beside it with the mallet.
 * Bronze lit from the upper left with lathe rings and a darker turned rim, a
 * felt mallet; the player is quiet line art. Nothing moves by itself (D8);
 * the build-up is shown as stepped pictures, never played.
 */
import { useMemo, type ReactElement } from 'react';
import { View } from 'react-native';
import { BlurMask, Canvas, Circle, DashPathEffect, Group, LinearGradient, Path, RadialGradient, RoundedRect, Skia, vec } from '@shopify/react-native-skia';
import { useStageTextScale } from '../../../rack/stageAspect';
import { fitXform } from '../../engine/geometry/frame.ts';
import { StaticLabels, type StaticLabel } from '../../engine/scene/StaticLabels';
import type { VariantId, ViewBox, ViewId } from '../../engine/model/types.ts';
import type { ArtLabel } from '../../engine/scene/sceneTypes.ts';
import { BRONZE, Floor, HIGHLIGHT, make, PlayerInk, playerFront, playerSide, playerTop, polyPath, Rod, STEEL, WOOD } from '../shared/metal/metalArt';
import { DiscField } from '../shared/metal/metalFigures';
import type { FrontArt } from '../shared/metal/metalPages';
import { buildUpWeights, DISC_SHAPES, discAt, discPeak } from '../shared/metal/metalModes.ts';
import { CY, frameW, GONG, kindOf, PLAYER, radiusOf, strikeFrac, strikePoint } from './model.ts';
import { topBarY } from './geometry.ts';

const RIM = GONG.rim.mm;
const DOME = GONG.dome.mm;
const BOSS_R = GONG.bossD.mm / 2;
const BOSS_H = GONG.bossH.mm;
const MH = GONG.malletHead.mm / 2;
const FU = (z: number) => -z;
const isBossed = (v: VariantId) => kindOf(v) === 'bossed';

/** The gong's face, face-on, centred at (u, v): bronze, lathe rings, the
 *  turned rim, the cord holes — and a boss. */
function GongFace({ u, v, R, bossed, glow }: { u: number; v: number; R: number; bossed: boolean; glow?: string | null }): ReactElement {
  const rings = make();
  for (let q = R * 0.12; q < R * 0.93; q += R / 34) rings.addCircle(u, v, q);
  const holes = [-1, 1].map((s) => [u + s * R * 0.69, v - R * 0.69] as const);
  return (
    <Group>
      <Circle cx={u + R * 0.04} cy={v + R * 0.06} r={R * 1.01} color="#000" opacity={0.5}>
        <BlurMask blur={R * 0.06} style="normal" />
      </Circle>
      <Circle cx={u} cy={v} r={R}>
        <RadialGradient c={vec(u - R * 0.4, v - R * 0.45)} r={R * 1.8} colors={[BRONZE[0], BRONZE[1], BRONZE[2], BRONZE[3], BRONZE[4]]} />
      </Circle>
      <Path path={rings} style="stroke" strokeWidth={R / 400} color="#3e2912" opacity={0.28} />
      {/* the turned rim: a darker band with a lit lip */}
      <Circle cx={u} cy={v} r={R * 0.965} style="stroke" strokeWidth={R * 0.07} color={BRONZE[4]} opacity={0.55} />
      <Circle cx={u} cy={v} r={R * 0.995} style="stroke" strokeWidth={R / 90} color={BRONZE[0]} opacity={0.55} />
      {glow === 'gg.rim' ? <Circle cx={u} cy={v} r={R * 0.96} style="stroke" strokeWidth={R * 0.1} color={HIGHLIGHT} opacity={0.35} /> : null}
      {glow === 'gg.face' || glow === 'gg.faceB' ? <Circle cx={u} cy={v} r={R * 0.85} color={HIGHLIGHT} opacity={0.18} /> : null}
      {holes.map(([hu, hv], i) => (
        <Circle key={i} cx={hu} cy={hv} r={R / 70 + 4} color="#1c1208" />
      ))}
      {bossed ? (
        <Group>
          <Circle cx={u} cy={v} r={BOSS_R * 1.5} color={BRONZE[4]} opacity={0.35} />
          <Circle cx={u} cy={v} r={BOSS_R}>
            <RadialGradient c={vec(u - BOSS_R * 0.4, v - BOSS_R * 0.45)} r={BOSS_R * 1.5} colors={[BRONZE[0], BRONZE[1], BRONZE[3]]} />
          </Circle>
          <Circle cx={u - BOSS_R * 0.35} cy={v - BOSS_R * 0.4} r={BOSS_R * 0.25} color="#ffffff" opacity={0.35}>
            <BlurMask blur={BOSS_R * 0.15} style="normal" />
          </Circle>
          {glow === 'gg.boss' ? <Circle cx={u} cy={v} r={BOSS_R * 1.4} color={HIGHLIGHT} opacity={0.35} /> : null}
        </Group>
      ) : null}
      <Circle cx={u - R * 0.4} cy={v - R * 0.45} r={R * 0.22} color="#ffffff" opacity={0.08}>
        <BlurMask blur={R * 0.18} style="normal" />
      </Circle>
    </Group>
  );
}

/** A felt mallet: a wooden handle and a wrapped head. */
function Mallet({ grip, head }: { grip: [number, number]; head: [number, number] }): ReactElement {
  return (
    <Group>
      <Path path={polyPath([grip, head])} style="stroke" strokeWidth={22} strokeCap="round" color={WOOD[3]} />
      <Path path={polyPath([grip, head])} style="stroke" strokeWidth={14} strokeCap="round" color={WOOD[1]} />
      <Circle cx={head[0]} cy={head[1]} r={MH}>
        <RadialGradient c={vec(head[0] - MH * 0.4, head[1] - MH * 0.45)} r={MH * 1.6} colors={['#e9e1d2', '#b9ab93', '#6f6455']} />
      </Circle>
      <Circle cx={head[0]} cy={head[1]} r={MH} style="stroke" strokeWidth={3} color="#4a4238" />
    </Group>
  );
}

/* ═══════════════ side and top ═══════════════ */

function sideArt(v: VariantId): ReactElement {
  const R = radiusOf(v);
  const top = topBarY(v);
  const F = GONG.feet.mm / 2;
  const bossed = isBossed(v);
  // Edge-on: the turned rim (−x) and the face's slight dome (+x).
  const prof = make();
  prof.moveTo(-RIM, CY - R);
  prof.lineTo(0, CY - R);
  prof.quadTo(DOME * 2, CY, 0, CY + R);
  prof.lineTo(-RIM, CY + R);
  prof.lineTo(-RIM, CY + R - 14);
  prof.lineTo(-6, CY + R - 14);
  prof.lineTo(-6, CY - R + 14);
  prof.lineTo(-RIM, CY - R + 14);
  prof.close();
  const sp = strikePoint(v);
  const head: [number, number] = [sp.x + MH, sp.y];
  return (
    <Group>
      <Floor u0={-4000} u1={6000} />
      {/* the frame, edge-on: a post, a foot, the top bar end-on */}
      <Rod path={polyPath([[-F, -20], [F, -20]])} d={GONG.post.mm} pal={STEEL} />
      <Rod path={polyPath([[0, -20], [0, top]])} d={GONG.post.mm} pal={STEEL} />
      <Circle cx={0} cy={top} r={GONG.post.mm * 0.7} color={STEEL[3]} />
      <Path path={polyPath([[0, top], [-6, CY - R * 0.69]])} style="stroke" strokeWidth={3} color="#c9b48c" />
      <Group transform={[{ scaleX: -1 }]}>
        <PlayerInk path={playerSide([[-(head[0] + 230), head[1] - 120]])} faint head="side" />
      </Group>
      <Path path={prof}>
        <LinearGradient start={vec(-RIM, CY - R)} end={vec(DOME, CY + R)} colors={[BRONZE[1], BRONZE[2], BRONZE[4]]} />
      </Path>
      <Path path={prof} style="stroke" strokeWidth={2} color={BRONZE[4]} />
      {bossed ? (
        <Group>
          <RoundedRect x={0} y={CY - BOSS_R} width={BOSS_H} height={2 * BOSS_R} r={BOSS_R * 0.6}>
            <LinearGradient start={vec(0, CY - BOSS_R)} end={vec(BOSS_H, CY + BOSS_R)} colors={[BRONZE[0], BRONZE[2], BRONZE[4]]} />
          </RoundedRect>
        </Group>
      ) : null}
      <Mallet grip={[head[0] + 230, head[1] - 110]} head={head} />
    </Group>
  );
}

function topArt(v: VariantId): ReactElement {
  const R = radiusOf(v);
  const W = frameW(v) / 2;
  const F = GONG.feet.mm / 2;
  const bossed = isBossed(v);
  const sp = strikePoint(v);
  const head: [number, number] = [sp.x + MH, sp.z];
  return (
    <Group>
      {[-W, W].map((z) => (
        <Group key={z}>
          <Rod path={polyPath([[-F, z], [F, z]])} d={GONG.post.mm} pal={STEEL} />
          <Circle cx={0} cy={z} r={GONG.post.mm * 0.8} color={STEEL[3]} />
        </Group>
      ))}
      <Rod path={polyPath([[0, -W], [0, W]])} d={GONG.post.mm} pal={STEEL} />
      <RoundedRect x={-RIM} y={-R} width={RIM + DOME} height={2 * R} r={6}>
        <LinearGradient start={vec(-RIM, 0)} end={vec(DOME, 0)} colors={[BRONZE[3], BRONZE[1], BRONZE[2]]} />
      </RoundedRect>
      {bossed ? <RoundedRect x={DOME} y={-BOSS_R} width={BOSS_H - DOME} height={2 * BOSS_R} r={10} color={BRONZE[1]} /> : null}
      <Group transform={[{ translateX: PLAYER.x }, { translateY: PLAYER.z }, { scaleX: -1 }, { translateX: 360 }]}>
        <PlayerInk path={playerTop()} faint head="top" />
      </Group>
      <Mallet grip={[PLAYER.x - 40, PLAYER.z + 160]} head={head} />
    </Group>
  );
}

const built: Partial<Record<string, ReactElement>> = {};
export function GongArt({ view, variant }: { view: ViewId; variant: VariantId }) {
  const key = `${view}:${variant}`;
  return (built[key] ??= view === 'top' ? topArt(variant) : sideArt(variant));
}

export function gongLabels(view: ViewId, variant: VariantId): ArtLabel[] {
  const R = radiusOf(variant);
  const name = isBossed(variant) ? 'BOSSED GONG · EDGE-ON' : 'TAM-TAM · EDGE-ON';
  if (view === 'top') {
    return [
      { id: 'gong', text: name, short: 'GONG', u: 60, v: R + 60, align: 'left' },
      { id: 'frame', text: 'FRAME', u: -60, v: -frameW(variant) / 2 - 50, align: 'right', tone: 'muted' },
      { id: 'player', text: 'PLAYER', u: PLAYER.x + 40, v: PLAYER.z - 280, align: 'center', tone: 'muted' },
    ];
  }
  return [
    { id: 'gong', text: name, short: 'GONG', u: 60, v: CY - R - 40, align: 'left' },
    { id: 'mallet', text: 'MALLET', u: strikePoint(variant).x + 240, v: CY - 170, align: 'left', tone: 'muted' },
    { id: 'frame', text: 'FRAME', u: -60, v: topBarY(variant) + 60, align: 'right', tone: 'muted' },
  ];
}

export function gongHitTest(view: ViewId, variant: VariantId, u: number, v: number, tol: number): string | null {
  const R = radiusOf(variant);
  const face = isBossed(variant) ? 'gg.faceB' : 'gg.face';
  if (view === 'top') {
    if (u >= -RIM - tol && u <= BOSS_H + tol && Math.abs(v) <= R + tol) return isBossed(variant) && Math.abs(v) < BOSS_R && u > DOME ? 'gg.boss' : face;
    if (Math.abs(u) <= GONG.feet.mm / 2 + tol && Math.abs(Math.abs(v) - frameW(variant) / 2) <= 30 + tol) return isBossed(variant) ? 'gg.frameB' : 'gg.frame';
    return null;
  }
  if (u >= -RIM - tol && u <= BOSS_H + tol && Math.abs(v - CY) <= R + tol) return isBossed(variant) && Math.abs(v - CY) < BOSS_R && u > DOME ? 'gg.boss' : face;
  if (Math.abs(u) <= 30 + tol && v <= -20 && v >= topBarY(variant) - tol) return isBossed(variant) ? 'gg.frameB' : 'gg.frame';
  return null;
}

/* ═══════════════ front (from the audience) ═══════════════ */

function frontArt(variant: VariantId, highlight: string | null): ReactElement {
  const R = radiusOf(variant);
  const W = frameW(variant) / 2;
  const top = topBarY(variant);
  const bossed = isBossed(variant);
  const sp = strikePoint(variant);
  const headAt: [number, number] = [FU(sp.z) + MH * 0.6, sp.y + MH * 0.2];
  const grip: [number, number] = [FU(PLAYER.z) - 120, CY - 140];
  const holes = [-1, 1].map((s) => [s * R * 0.69, CY - R * 0.69] as [number, number]);
  const anchors = [-1, 1].map((s) => [s * R * 0.52, top] as [number, number]);
  const hl = (id: string) => highlight === id || (highlight === `${id}B`);
  return (
    <Group>
      <Floor u0={-3000} u1={3000} />
      {/* the player beside the struck face (screen right), the mallet hand reaching in */}
      <Group transform={[{ translateX: FU(PLAYER.z) }]}>
        <PlayerInk path={playerFront([[grip[0] - FU(PLAYER.z) + 10, grip[1] + 10]])} faint head="front" />
      </Group>
      {/* the frame */}
      {hl('gg.frame') ? <RoundedRect x={-W - 40} y={top - 40} width={2 * W + 80} height={-top + 20} r={40} color={HIGHLIGHT} opacity={0.18} /> : null}
      <Rod path={polyPath([[-W, -20], [-W, top], [W, top], [W, -20]])} d={GONG.post.mm} pal={STEEL} />
      {[-W, W].map((u) => (
        <RoundedRect key={u} x={u - 40} y={-40} width={80} height={36} r={8} color={STEEL[3]} />
      ))}
      {/* the cords, from the top bar to the rim's holes */}
      {anchors.map((a, i) => (
        <Path key={i} path={polyPath([a, holes[i]])} style="stroke" strokeWidth={hl('gg.cords') ? 9 : 4} color={hl('gg.cords') ? HIGHLIGHT : '#c9b48c'} />
      ))}
      <GongFace u={0} v={CY} R={R} bossed={bossed} glow={highlight} />
      {hl('gg.mallet') ? <Path path={polyPath([grip, headAt])} style="stroke" strokeWidth={70} strokeCap="round" color={HIGHLIGHT} opacity={0.25} /> : null}
      <Mallet grip={grip} head={headAt} />
    </Group>
  );
}

function FrontImpl({ variant, highlight }: { variant: VariantId; highlight: string | null }) {
  return frontArt(variant, highlight);
}

function frontBox(v: VariantId): ViewBox {
  const W = frameW(v) / 2;
  return { u0: -W - 140, u1: Math.max(W + 140, FU(PLAYER.z) + 260), v0: topBarY(v) - 140, v1: 60 };
}

function frontLabels(v: VariantId): ArtLabel[] {
  const R = radiusOf(v);
  const W = frameW(v) / 2;
  const top = topBarY(v);
  const bossed = isBossed(v);
  const out: ArtLabel[] = [
    { id: bossed ? 'gg.faceB' : 'gg.face', text: bossed ? 'FACE' : 'FACE (NO BOSS)', short: 'FACE', u: -R * 0.42, v: CY + R * 0.45, align: 'center' },
    { id: 'gg.rim', text: 'TURNED RIM', short: 'RIM', u: -R * 0.72, v: CY + R + 30, align: 'center', tone: 'muted' },
    { id: 'gg.cords', text: 'CORDS', u: -R * 0.62 - 20, v: (top + CY - R * 0.69) / 2, align: 'right', tone: 'muted' },
    { id: bossed ? 'gg.frameB' : 'gg.frame', text: 'FRAME', u: -W - 30, v: (top + CY + R) / 2 + R * 0.6, align: 'right', tone: 'muted' },
    { id: 'gg.mallet', text: 'MALLET', u: FU(PLAYER.z) - 70, v: CY - 230, align: 'center' },
  ];
  if (bossed) out.push({ id: 'gg.boss', text: 'BOSS', u: BOSS_R + 24, v: CY - BOSS_R - 12, align: 'left' });
  return out;
}

function frontHit(v: VariantId, u: number, vv: number, tol: number): string | null {
  const R = radiusOf(v);
  const W = frameW(v) / 2;
  const top = topBarY(v);
  const bossed = isBossed(v);
  const sp = strikePoint(v);
  const headAt: [number, number] = [FU(sp.z) + MH * 0.6, sp.y + MH * 0.2];
  const grip: [number, number] = [FU(PLAYER.z) - 120, CY - 140];
  const d = Math.hypot(u, vv - CY);
  // the mallet first (it lies over the face)
  const t = Math.max(0, Math.min(1, ((u - grip[0]) * (headAt[0] - grip[0]) + (vv - grip[1]) * (headAt[1] - grip[1])) / ((headAt[0] - grip[0]) ** 2 + (headAt[1] - grip[1]) ** 2)));
  if (Math.hypot(u - grip[0] - t * (headAt[0] - grip[0]), vv - grip[1] - t * (headAt[1] - grip[1])) <= MH + tol) return 'gg.mallet';
  if (bossed && d <= BOSS_R + tol) return 'gg.boss';
  if (d <= R * 0.9) return bossed ? 'gg.faceB' : 'gg.face';
  if (d <= R + tol) return 'gg.rim';
  if (vv > top && vv < CY - R * 0.6 && Math.abs(Math.abs(u) - R * 0.6) <= 40 + tol) return 'gg.cords';
  if ((Math.abs(Math.abs(u) - W) <= 40 + tol && vv >= top - tol && vv <= 0) || (Math.abs(vv - top) <= 40 + tol && Math.abs(u) <= W)) return bossed ? 'gg.frameB' : 'gg.frame';
  return null;
}

export const GONG_FRONT: FrontArt = { box: frontBox, Art: FrontImpl, labels: frontLabels, hitTest: frontHit };

/* ═══════════════ HOW IT SOUNDS: the stroke and the build-up ═══════════════ */

/** The face's field at an event: the shapes weighted by buildUpWeights,
 *  normalised to its own peak (a picture of which shapes hold the energy —
 *  never a level or a time). */
function mixField(event: number, v: VariantId): ((r: number, t: number) => number) | null {
  const w = buildUpWeights(event, strikeFrac(v), kindOf(v));
  if (w.every((x) => x < 1e-6)) return null;
  const raw = (r: number, t: number) => DISC_SHAPES.reduce((a, sh, i) => a + (w[i] ? (w[i] * discAt(sh, r, t)) / discPeak(sh) : 0), 0);
  let pk = 1e-9;
  for (let i = 1; i <= 24; i++) for (let k = 0; k < 48; k++) pk = Math.max(pk, Math.abs(raw(i / 24, (k / 48) * 2 * Math.PI)));
  return (r, t) => raw(r, t) / pk;
}

export function GongStrike({ w, h, variant, shown, accessibilityLabel }: { w: number; h: number; variant: VariantId; shown: number; accessibilityLabel: string }) {
  const textScale = useStageTextScale();
  const R = radiusOf(variant);
  const bossed = isBossed(variant);
  // The face, and a small edge-on inset at the right for "front and back".
  const box: ViewBox = useMemo(() => ({ u0: -R * 1.15, u1: R * 1.95, v0: CY - R * 1.25, v1: CY + R * 1.3 }), [R]);
  const xf = useMemo(() => fitXform('side', box, w, h, 6), [box, w, h]);
  const field = useMemo(() => mixField(Math.min(3, shown), variant), [shown, variant]);
  const sp = strikePoint(variant);
  const dir = Math.atan2(0, FU(sp.z) === 0 ? -1 : FU(sp.z)); // the stroke's direction on screen
  const spot: [number, number] = [FU(sp.z), CY];
  const insetU = R * 1.55;
  const arcs = useMemo(() => {
    const p = make();
    for (const r of [R * 0.22, R * 0.36]) {
      p.addArc(Skia.XYWHRect(insetU - r, CY - r, 2 * r, 2 * r), -60, 120);
      p.addArc(Skia.XYWHRect(insetU - r, CY - r, 2 * r, 2 * r), 120, 120);
    }
    return p;
  }, [R, insetU]);
  const labels: StaticLabel[] = [
    { id: 'n1', text: bossed ? '① ON THE BOSS' : '① A LITTLE OFF CENTRE', short: '① STROKE', u: -R * 1.1, v: CY - R * 1.12, align: 'left', tone: shown === 1 ? 'amber' : 'muted' },
    { id: 'n2', text: '② BROAD SHAPES', u: -R * 1.1, v: CY + R * 1.12, align: 'left', tone: shown === 2 ? 'amber' : 'muted' },
    { id: 'n3', text: bossed ? '③ THE BOSS’S TONE' : '③ THE BUILD-UP', u: R * 0.15, v: CY + R * 1.12, align: 'left', tone: shown === 3 ? 'amber' : 'muted' },
    { id: 'n4', text: '④ FRONT AND BACK', short: '④ BOTH FACES', u: insetU, v: CY - R * 0.62, align: 'center', tone: shown === 4 ? 'amber' : 'muted' },
  ];
  const fieldKey = `${variant}:${Math.min(3, shown)}`;
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          <GongFace u={0} v={CY} R={R} bossed={bossed} />
          {field ? (
            <Group transform={[{ translateY: CY }]}>
              <Circle cx={0} cy={0} r={R} color="rgba(10,10,14,0.35)" />
              <DiscField at={field} R={R * 0.985} r0Frac={bossed ? BOSS_R / R : 0.03} dir={dir} fieldKey={fieldKey} />
            </Group>
          ) : null}
          {bossed ? <Circle cx={0} cy={CY} r={BOSS_R} style="stroke" strokeWidth={4} color={BRONZE[0]} opacity={0.7} /> : null}
          {shown === 1 ? (
            <Group>
              <Circle cx={spot[0]} cy={spot[1]} r={R * 0.1} color="#ffc64d" opacity={0.35}>
                <BlurMask blur={R * 0.04} style="normal" />
              </Circle>
              <Circle cx={spot[0]} cy={spot[1]} r={R * 0.07} style="stroke" strokeWidth={R / 90} color="#ffc64d" />
            </Group>
          ) : null}
          {/* the inset: the gong edge-on, sound leaving its front and its back */}
          <RoundedRect x={insetU - 10} y={CY - R * 0.48} width={20} height={R * 0.96} r={8}>
            <LinearGradient start={vec(insetU - 10, CY - R * 0.5)} end={vec(insetU + 10, CY + R * 0.5)} colors={[BRONZE[1], BRONZE[3]]} />
          </RoundedRect>
          {shown >= 4 ? (
            <Path path={arcs} style="stroke" strokeWidth={R / 120} color="#8fbcff" opacity={0.7}>
              <DashPathEffect intervals={[R / 30, R / 45]} />
            </Path>
          ) : null}
        </Group>
      </Canvas>
      <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
    </View>
  );
}
