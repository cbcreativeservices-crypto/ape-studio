/**
 * M01 KICK DRUM — the look (charter §2 layer 3). Drawn ONLY from the anchors
 * in geometry.ts, in MILLIMETRES of the view's (u, v) plane: side u = x,
 * v = y; top u = x, v = z. The scene puts it under one transform, so the
 * drawing, the labels and the hit areas stay aligned at every zoom.
 *
 * Both views are CUTAWAYS (the near half of the shell removed: the side view
 * is cut at z = 0, the top view at y = 0), so a mic inside the drum is seen.
 * Hidden edges — the offset port, the pillow under the top-view cut — are
 * dashed, the drafting convention. Parts whose geometry is unknown (pedal,
 * beater, pillow size, port position, floor, spurs) are drawn and tagged
 * ILLUSTRATIVE by the scene's labels.
 *
 * Light from the upper left; palette from the visual standards. This is the
 * correctness pass; a later art pass may enrich the finish (charter §9).
 */
import { useMemo } from 'react';
import { Circle, DashPathEffect, Group, Line, LinearGradient, Path, Skia, vec } from '@shopify/react-native-skia';
import type { VariantId, ViewId } from '../../engine/model/types.ts';
import { KICK_ANCHORS, KICK_GEOM as G } from './geometry.ts';

const PORT = KICK_ANCHORS['bd.port.center'];

type SkPath = ReturnType<typeof Skia.Path.Make>;

const WOOD = ['#3d2412', '#8a5a2b', '#b07c44', '#6b4220', '#2e1a0c'];
const HOOP = ['#2a180a', '#6e4520', '#43290f'];
const METAL = ['#3a3c44', '#c6cad4', '#6c707a'];
const HEAD_COATED = '#ece7da';
const HEAD_FRONT = '#30343e';
const FELT = '#ddd5c2';
const FABRIC = ['#3b4352', '#596476', '#2e3440'];
const FLOOR = '#3a3b46';
const HIDDEN = '#9aa3b5';

function rect(x0: number, y0: number, x1: number, y1: number): SkPath {
  const p = Skia.Path.Make();
  p.addRect(Skia.XYWHRect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0)));
  return p;
}
function rrect(x0: number, y0: number, x1: number, y1: number, r: number): SkPath {
  const p = Skia.Path.Make();
  p.addRRect(Skia.RRectXY(Skia.XYWHRect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0)), r, r));
  return p;
}
function lines(segs: [number, number, number, number][]): SkPath {
  const p = Skia.Path.Make();
  for (const [a, b, c, d] of segs) {
    p.moveTo(a, b);
    p.lineTo(c, d);
  }
  return p;
}

/** Plies drawn in a wall band (8-ply shell, TAMA-SSC). */
function plies(x0: number, x1: number, v0: number, v1: number, n = 8): SkPath {
  const segs: [number, number, number, number][] = [];
  for (let i = 1; i < n; i++) {
    const v = v0 + ((v1 - v0) * i) / n;
    segs.push([x0, v, x1, v]);
  }
  return lines(segs);
}

/** The beater + pedal (ILLUSTRATIVE), side view. */
function pedalSide() {
  const b = G.beater;
  const head = { x: b.axle.x + b.len * Math.cos(b.strikeAngle), y: b.axle.y + b.len * Math.sin(b.strikeAngle) };
  const rest = { x: b.axle.x + b.len * Math.cos(b.restAngle), y: b.axle.y + b.len * Math.sin(b.restAngle) };
  const foot = Skia.Path.Make();
  // Footboard: a tilted plate from the heel plate up toward the drum.
  foot.moveTo(G.pedal.x0, G.yFloor - 8);
  foot.lineTo(G.pedal.x1 - 30, G.pedal.top);
  foot.lineTo(G.pedal.x1 - 20, G.pedal.top + 12);
  foot.lineTo(G.pedal.x0 + 6, G.yFloor);
  foot.close();
  const frame = Skia.Path.Make();
  frame.addRRect(Skia.RRectXY(Skia.XYWHRect(b.axle.x - 9, b.axle.y - 8, 18, G.yFloor - b.axle.y + 8), 6, 6));
  const base = rect(G.pedal.x0 - 6, G.yFloor - 6, G.pedal.x1 + 10, G.yFloor);
  return { head, rest, foot, frame, base };
}

export function KickArt({ view, variant }: { view: ViewId; variant: VariantId }) {
  const ported = variant === 'ported';
  const g = useMemo(() => {
    const v = view;
    const R = G.R;
    const L = G.L;
    const rIn = G.rIn;
    const hb = G.hoopX.batter;
    const hr = G.hoopX.reso;
    // Shell wall bands (cut faces) at ±(rIn..R).
    const wallTop = rect(0, -R, L, -rIn);
    const wallBot = rect(0, rIn, L, R);
    const interior = rect(0, -rIn, L, rIn);
    const plyLines = Skia.Path.Make();
    plyLines.addPath(plies(0, L, -R, -rIn));
    plyLines.addPath(plies(0, L, rIn, R));
    const hoops = Skia.Path.Make();
    for (const [x0, x1] of [hb, hr]) {
      hoops.addPath(rrect(x0, -G.hoopOut, x1, -G.hoopIn, 2));
      hoops.addPath(rrect(x0, G.hoopIn, x1, G.hoopOut, 2));
    }
    // Tension rods + lugs at the silhouette (|cos φ| > 0.8 in the side view,
    // |sin φ| > 0.8 from above), hoop claw → lug.
    const rodSegs: [number, number, number, number][] = [];
    const lugs = Skia.Path.Make();
    for (const phi of G.rodAngles) {
      const a = (phi * Math.PI) / 180;
      const c = v === 'side' ? Math.cos(a) : Math.sin(a);
      if (Math.abs(c) < 0.8) continue;
      const vv = (R + 14) * c;
      rodSegs.push([hb[0] + 4, vv, 46, vv], [hr[1] - 4, vv, L - 46, vv]);
      lugs.addPath(rrect(46, vv - 6, 70, vv + 6, 3));
      lugs.addPath(rrect(L - 70, vv - 6, L - 46, vv + 6, 3));
    }
    const rods = lines(rodSegs);
    // Port as a hidden edge on the front-head line.
    const pc = v === 'side' ? PORT.y : PORT.z;
    const port = lines([[L, pc - G.portR, L, pc + G.portR]]);
    const pillow = rrect(G.pillow.x0, v === 'side' ? G.pillow.top : -G.pillow.halfW, G.pillow.x1, v === 'side' ? G.pillow.bottom : G.pillow.halfW, 26);
    const ped = pedalSide();
    const spurs = Skia.Path.Make();
    for (const s of G.spurs) {
      // Side view: the near spur is cut away with the near half of the shell,
      // the far one is hidden behind the far wall — neither is drawn.
      if (v === 'side') continue;
      spurs.moveTo(s.top.x, s.top.z);
      spurs.lineTo(s.foot.x, s.foot.z);
    }
    const footPlan = rrect(G.pedal.x0, -45, G.pedal.x1, 45, 10);
    return { R, L, rIn, wallTop, wallBot, interior, plyLines, hoops, rods, lugs, port, pillow, ped, spurs, footPlan };
  }, [view]);
  const { R, L, rIn } = g;
  const sideV = view === 'side';
  return (
    <Group>
      {/* Floor (side view only; its height is a placeholder). */}
      {sideV ? (
        <>
          <Path path={rect(-400, G.yFloor, 900, G.yFloor + 30)}>
            <LinearGradient start={vec(0, G.yFloor)} end={vec(0, G.yFloor + 30)} colors={['#23242b', '#0c0c0f']} />
          </Path>
          <Line p1={vec(-400, G.yFloor)} p2={vec(900, G.yFloor)} color={FLOOR} strokeWidth={3} />
        </>
      ) : null}
      {/* Interior air — the cut-open drum, dark, lit faintly from the upper left. */}
      <Path path={g.interior}>
        <LinearGradient start={vec(0, -rIn)} end={vec(L, rIn)} colors={['#1b1712', '#0e0c0a']} />
      </Path>
      {/* Pillow: solid in the side cut; a hidden outline under the top cut. */}
      {sideV ? (
        <Path path={g.pillow}>
          <LinearGradient start={vec(0, G.pillow.top)} end={vec(0, G.pillow.bottom)} colors={FABRIC} />
        </Path>
      ) : (
        <Path path={g.pillow} style="stroke" strokeWidth={3} color={HIDDEN} opacity={0.55}>
          <DashPathEffect intervals={[14, 10]} />
        </Path>
      )}
      {/* Shell walls (cut faces), plies, hoops, rods and lugs. */}
      <Path path={g.wallTop}>
        <LinearGradient start={vec(0, -R)} end={vec(0, -rIn)} colors={WOOD} />
      </Path>
      <Path path={g.wallBot}>
        <LinearGradient start={vec(0, rIn)} end={vec(0, R)} colors={WOOD} />
      </Path>
      <Path path={g.plyLines} style="stroke" strokeWidth={0.5} color="#24150a" opacity={0.6} />
      <Path path={g.rods} style="stroke" strokeWidth={3.5} color={METAL[1]} opacity={0.8} />
      <Path path={g.lugs}>
        <LinearGradient start={vec(0, -R - 20)} end={vec(0, R + 20)} colors={METAL} />
      </Path>
      <Path path={g.hoops}>
        <LinearGradient start={vec(0, -G.hoopOut)} end={vec(0, G.hoopOut)} colors={HOOP} />
      </Path>
      {/* Heads: the coated batter head, the dark front head. */}
      <Line p1={vec(0, -R)} p2={vec(0, R)} color={HEAD_COATED} strokeWidth={4} />
      <Line p1={vec(L, -R)} p2={vec(L, R)} color={HEAD_FRONT} strokeWidth={4} />
      <Line p1={vec(L, -R)} p2={vec(L, R)} color="#8d95a6" strokeWidth={1.2} opacity={0.6} />
      {ported ? (
        <Path path={g.port} style="stroke" strokeWidth={6} color={HIDDEN}>
          <DashPathEffect intervals={[10, 7]} />
        </Path>
      ) : null}
      {/* Spurs (illustrative geometry). */}
      <Path path={g.spurs} style="stroke" strokeWidth={9} strokeCap="round" color={METAL[2]} />
      <Path path={g.spurs} style="stroke" strokeWidth={3} strokeCap="round" color={METAL[1]} opacity={0.6} />
      {/* Pedal and beater (ILLUSTRATIVE): at the strike, with the rest
          position ghosted. */}
      {sideV ? (
        <>
          <Path path={g.ped.base} color="#202227" />
          <Path path={g.ped.foot}>
            <LinearGradient start={vec(G.pedal.x0, G.yFloor)} end={vec(G.pedal.x1, G.pedal.top)} colors={['#1f2126', '#5b5f69', '#2a2c32']} />
          </Path>
          <Path path={g.ped.frame}>
            <LinearGradient start={vec(G.beater.axle.x - 9, 0)} end={vec(G.beater.axle.x + 9, 0)} colors={METAL} />
          </Path>
          <Line p1={vec(G.beater.axle.x, G.beater.axle.y)} p2={vec(g.ped.rest.x, g.ped.rest.y)} color={METAL[1]} strokeWidth={5} opacity={0.3} />
          <Circle cx={g.ped.rest.x} cy={g.ped.rest.y} r={G.beater.headR} color={FELT} opacity={0.25} />
          <Line p1={vec(G.beater.axle.x, G.beater.axle.y)} p2={vec(g.ped.head.x, g.ped.head.y)} color={METAL[1]} strokeWidth={6} />
          <Circle cx={g.ped.head.x} cy={g.ped.head.y} r={G.beater.headR}>
            <LinearGradient start={vec(g.ped.head.x - 30, g.ped.head.y - 30)} end={vec(g.ped.head.x + 30, g.ped.head.y + 30)} colors={['#f4efe2', FELT, '#9b937f']} />
          </Circle>
          <Circle cx={G.beater.axle.x} cy={G.beater.axle.y} r={12} color={METAL[0]} />
        </>
      ) : (
        <>
          <Path path={g.footPlan}>
            <LinearGradient start={vec(G.pedal.x0, -45)} end={vec(G.pedal.x1, 45)} colors={['#5b5f69', '#2a2c32']} />
          </Path>
          <Line p1={vec(G.beater.axle.x, 0)} p2={vec(-G.beater.headR, 0)} color={METAL[1]} strokeWidth={6} />
          <Circle cx={-G.beater.headR} cy={0} r={G.beater.headR} color={FELT} />
        </>
      )}
      {/* The beater line: where the beater meets the head, parallel to the axis. */}
      <Line p1={vec(0, sideV ? G.strikeY : 0)} p2={vec(L, sideV ? G.strikeY : 0)} color="#ffc64d" strokeWidth={1.6} opacity={0.55}>
        <DashPathEffect intervals={[16, 10]} />
      </Line>
    </Group>
  );
}

/* ── labels and taps (mm, from the same anchors) ── */
export type ArtLabel = { id: string; text: string; u: number; v: number; align: 'left' | 'center' | 'right'; tone?: 'muted' | 'illustrative' };

export function kickLabels(view: ViewId, variant: VariantId): ArtLabel[] {
  const out: ArtLabel[] = [
    { id: 'batter', text: 'BATTER HEAD', u: 14, v: -G.hoopOut - 26, align: 'right' },
    // Right-aligned to the front hoop: the top-right corner is the inset's.
    { id: 'reso', text: variant === 'ported' ? 'FRONT HEAD (PORTED)' : 'FRONT HEAD (INTACT)', u: G.L + 30, v: -G.hoopOut - 26, align: 'right' },
  ];
  if (view === 'side') {
    out.push({ id: 'beater', text: 'PEDAL · ILLUSTRATIVE', u: -230, v: -170, align: 'center', tone: 'illustrative' });
    out.push({ id: 'pillow', text: 'PILLOW', u: 150, v: G.pillow.top + 50, align: 'center', tone: 'muted' });
    out.push({ id: 'floor', text: 'FLOOR · ILLUSTRATIVE', u: 680, v: G.yFloor - 24, align: 'center', tone: 'illustrative' });
  } else {
    out.push({ id: 'pedal', text: 'PEDAL · ILLUSTRATIVE', u: -230, v: 110, align: 'center', tone: 'illustrative' });
    out.push({ id: 'pillow', text: 'PILLOW (BELOW)', u: 150, v: 0, align: 'center', tone: 'muted' });
    out.push({ id: 'player', text: '← PLAYER', u: -300, v: -170, align: 'center', tone: 'muted' });
  }
  if (variant === 'ported') out.push({ id: 'port', text: 'PORT · ILLUSTRATIVE', u: G.L + 30, v: (view === 'side' ? PORT.y : PORT.z) + G.portR + 40, align: 'left', tone: 'illustrative' });
  return out;
}

/** The part under a model point (u, v) in this view; `tol` in mm. */
export function kickHitTest(view: ViewId, variant: VariantId, u: number, v: number, tol: number): string | null {
  const pc = view === 'side' ? PORT.y : PORT.z;
  if (variant === 'ported' && Math.abs(u - G.L) <= tol && Math.abs(v - pc) <= G.portR + tol) return 'kick.port';
  if (Math.abs(u - G.L) <= tol && Math.abs(v) <= G.R + tol) return 'kick.reso';
  if (Math.abs(u) <= tol && Math.abs(v) <= G.R + tol) return 'kick.batter';
  if (view === 'side') {
    if (u >= -G.beater.headR * 2 - tol && u <= tol && Math.abs(v - G.strikeY) <= G.beater.headR + tol) return 'kick.beater';
    if (u >= G.pillow.x0 && u <= G.pillow.x1 && v >= G.pillow.top - tol && v <= G.pillow.bottom) return 'kick.pillow';
    if (u >= G.pedal.x0 - tol && u <= G.pedal.x1 + tol && v >= G.beater.axle.y - tol && v <= G.yFloor + tol) return 'kick.pedal';
  } else {
    if (u >= G.pedal.x0 - tol && u <= tol && Math.abs(v) <= 45 + tol) return 'kick.pedal';
    if (u >= G.pillow.x0 && u <= G.pillow.x1 && Math.abs(v) <= G.pillow.halfW) return 'kick.pillow';
  }
  if (u >= 0 && u <= G.L && Math.abs(v) <= G.R + tol) return 'kick.shell';
  return null;
}
