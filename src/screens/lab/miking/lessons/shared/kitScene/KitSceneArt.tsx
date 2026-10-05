/**
 * THE WHOLE KIT, DRAWN — the look of kitSceneModel.ts for the kit-level
 * lessons (M09 overheads, M10 room, M11 complete kit), at the Kick's
 * illustration standard, from the shared families only:
 *   • the drums: drums/DrumArt (DrumExterior from the side, DrumPlan from
 *     above, the snare's stand, the floor tom's legs);
 *   • the cymbals, their stands and the hi-hat: cymbals/CymbalArt;
 *   • the kick from outside (the M01 kick's own geometry, uncut), its pedal
 *     and the tom holder; the throne;
 *   • the drummer's keep-outs (the body, hatched; the sticks' reach, dashed).
 *
 * SIDE view: the camera on the player's right (+z) looking toward −z; parts
 * are drawn far (−z) to near so nearer parts cover farther ones. TOP view:
 * low to high, the cymbals translucent over the drums they hang above.
 *
 * Nothing moves (D8); every path is built once (module caches here and in
 * the families). All coordinates are millimetres of the view's (u, v).
 */
import { BlurMask, Circle, DashPathEffect, Group, LinearGradient, Path, RadialGradient, Skia, vec } from '@shopify/react-native-skia';
import type { ViewId } from '../../../engine/model/types.ts';
import type { ArtLabel } from '../../../engine/scene/sceneTypes.ts';
import { KICK_GEOM } from '../../m01Kick/geometry.ts';
import { KIT, KIT_DRUMS, KIT_FLOOR_Y, yAt, type KitDrumId } from '../kitPlanModel.ts';
import { DrumExterior, DrumPlan, FloorTomLegsSide, SnareStandSide, sideTransform, topTransform } from '../drums/DrumArt';
import { frameOf, pointOn } from '../drums/drumSpec.ts';
import { BoomStandSide, BoomStandTop, CymbalSide, CymbalTop, HiHatSide, HiHatTop, SwingEnvelope } from '../cymbals/CymbalArt';
import { KIT_PLACED_CYMBALS } from '../cymbals/cymbalSpec.ts';
import { DRUMMER, S0, TOM_POST } from './kitSceneModel.ts';

type SkPath = ReturnType<typeof Skia.Path.Make>;
const INK = '#08080a';
const GREY = '#8a8f9c';
const AMBER = '#ffc64d';
const LACQUER = ['#2f1b0a', '#7a4a20', '#c48f52', '#e2b679', '#9c6631', '#3a2210'];
const LACQUER_POS = [0, 0.15, 0.42, 0.55, 0.82, 1];
const WOOD_HOOP = ['#2f1b0a', '#7a4a20', '#c48a4c', '#9a6430', '#3a220e'];
const CHROME = ['#3a3d45', '#eef1f6', '#9aa0ab', '#4a4e57', '#c8ccd4'];

const make = () => Skia.Path.Make();
function rrect(p: SkPath, x0: number, y0: number, x1: number, y1: number, r: number) {
  p.addRRect(Skia.RRectXY(Skia.XYWHRect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0)), r, r));
  return p;
}
function seg(p: SkPath, a: number, b: number, c: number, d: number) {
  p.moveTo(a, b);
  p.lineTo(c, d);
  return p;
}
let hatchP: SkPath | null = null;
function hatch(): SkPath {
  if (hatchP) return hatchP;
  const p = make();
  for (let k = -4000; k < 4000; k += 34) seg(p, k, -3000, k + 3000, 3000);
  hatchP = p;
  return p;
}

/* ── the kick from outside ── */

function buildKickSide() {
  const G = KICK_GEOM;
  const shell = rrect(make(), 0, -G.R, G.L, G.R, 2);
  const hoops = make();
  rrect(hoops, G.hoopX.batter[0], -G.hoopOut, G.hoopX.batter[1], G.hoopOut, 4);
  rrect(hoops, G.hoopX.reso[0], -G.hoopOut, G.hoopX.reso[1], G.hoopOut, 4);
  // Near-side tension rods and lugs (10 per head; the near half shows ~5).
  const lugs = make();
  const rods = make();
  for (const phi of G.rodAngles) {
    const a = (phi * Math.PI) / 180;
    if (Math.sin(a) <= 0.05) continue; // the near half (+z)
    const y = Math.cos(a) * G.R;
    rrect(lugs, 52, y - 7, 92, y + 7, 4);
    rrect(lugs, G.L - 92, y - 7, G.L - 52, y + 7, 4);
    seg(rods, G.hoopX.batter[1] + 2, y, 60, y);
    seg(rods, G.hoopX.reso[0] - 2, y, G.L - 60, y);
  }
  const spur = make();
  const s = G.spurs[1];
  seg(spur, s.top.x, s.top.y, s.foot.x, s.foot.y);
  // The pedal: footboard, frame, and the beater at rest.
  const ped = G.pedal;
  const board = make();
  board.moveTo(ped.x0, G.yFloor - 8);
  board.lineTo(ped.x1 - 60, ped.top + 6);
  board.lineTo(ped.x1 - 48, ped.top + 18);
  board.lineTo(ped.x0 + 6, G.yFloor);
  board.close();
  const frame = make();
  rrect(frame, ped.x1 - 40, ped.top - 40, ped.x1 + 6, G.yFloor, 6);
  const shaft = make();
  const ax = G.beater.axle;
  const rest = { x: ax.x + G.beater.len * Math.cos(G.beater.restAngle), y: ax.y + G.beater.len * Math.sin(G.beater.restAngle) };
  seg(shaft, ax.x, ax.y, rest.x, rest.y);
  const shadow = rrect(make(), 0, G.yFloor - 10, G.L, G.yFloor + 6, 8);
  return { shell, hoops, lugs, rods, spur, board, frame, shaft, rest, shadow };
}
let kickSide: ReturnType<typeof buildKickSide> | null = null;

function KickSide() {
  const g = (kickSide ??= buildKickSide());
  const G = KICK_GEOM;
  return (
    <Group>
      <Path path={g.shadow} color="#000" opacity={0.5}>
        <BlurMask blur={10} style="normal" />
      </Path>
      <Path path={g.spur} style="stroke" strokeWidth={14} strokeCap="round" color="#16171b" />
      <Path path={g.spur} style="stroke" strokeWidth={9} strokeCap="round" color="#9aa0ab" />
      <Path path={g.shell}>
        <LinearGradient start={vec(0, -G.R)} end={vec(0, G.R)} colors={LACQUER} positions={LACQUER_POS} />
      </Path>
      <Path path={g.shell}>
        <LinearGradient start={vec(0, 0)} end={vec(G.L, 0)} colors={['rgba(255,240,210,0.12)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.25)']} />
      </Path>
      <Path path={g.rods} style="stroke" strokeWidth={5} strokeCap="round" color="#2a2c32" />
      <Path path={g.rods} style="stroke" strokeWidth={1.8} strokeCap="round" color="#d9dde5" opacity={0.85} />
      <Path path={g.lugs}>
        <LinearGradient start={vec(0, -G.R)} end={vec(0, G.R)} colors={CHROME} />
      </Path>
      <Path path={g.lugs} style="stroke" strokeWidth={0.8} color={INK} />
      <Path path={g.hoops}>
        <LinearGradient start={vec(0, -G.hoopOut)} end={vec(0, G.hoopOut)} colors={WOOD_HOOP} />
      </Path>
      <Path path={g.hoops} style="stroke" strokeWidth={1.2} color="#140b05" />
      <Path path={g.shell} style="stroke" strokeWidth={1.2} color="#140b05" />
      <Path path={g.board}>
        <LinearGradient start={vec(G.pedal.x0, 0)} end={vec(G.pedal.x1, 0)} colors={['#1f2126', '#6b707b', '#30323a']} />
      </Path>
      <Path path={g.frame} color="#2a2c32" />
      <Path path={g.shaft} style="stroke" strokeWidth={8} strokeCap="round" color="#16171b" />
      <Path path={g.shaft} style="stroke" strokeWidth={4} strokeCap="round" color="#c6cad4" />
      <Circle cx={g.rest.x} cy={g.rest.y} r={G.beater.headR}>
        <RadialGradient c={vec(g.rest.x - 8, g.rest.y - 8)} r={G.beater.headR * 1.6} colors={['#f4f1ea', '#bdb6a5', '#6e6858']} />
      </Circle>
    </Group>
  );
}

function KickTop() {
  const G = KICK_GEOM;
  const p = (kickTop ??= (() => {
    const shell = rrect(make(), 0, -G.R, G.L, G.R, 4);
    const hoops = make();
    rrect(hoops, G.hoopX.batter[0], -G.hoopOut, G.hoopX.batter[1], G.hoopOut, 5);
    rrect(hoops, G.hoopX.reso[0], -G.hoopOut, G.hoopX.reso[1], G.hoopOut, 5);
    const rods = make();
    for (const s of [-1, 1]) {
      seg(rods, G.hoopX.batter[1] + 4, s * (G.hoopOut + 10), 60, s * (G.hoopOut + 10));
      seg(rods, G.hoopX.reso[0] - 4, s * (G.hoopOut + 10), G.L - 60, s * (G.hoopOut + 10));
    }
    const pedal = rrect(make(), G.pedal.x0, -45, G.pedal.x1, 45, 10);
    return { shell, hoops, rods, pedal };
  })());
  return (
    <Group>
      <Group transform={[{ translateX: 12 }, { translateY: 16 }]}>
        <Path path={p.shell} color="#000" opacity={0.5}>
          <BlurMask blur={14} style="normal" />
        </Path>
      </Group>
      <Path path={p.shell}>
        <LinearGradient start={vec(0, -G.R)} end={vec(0, G.R)} colors={['#3a2210', '#e2b679', '#c48f52', '#7a4a20', '#2f1b0a']} positions={[0, 0.25, 0.5, 0.8, 1]} />
      </Path>
      <Path path={p.rods} style="stroke" strokeWidth={6} strokeCap="round" color="#2a2c32" />
      <Path path={p.rods} style="stroke" strokeWidth={2} strokeCap="round" color="#d9dde5" opacity={0.8} />
      <Path path={p.hoops}>
        <LinearGradient start={vec(0, -G.hoopOut)} end={vec(0, G.hoopOut)} colors={['#c48a4c', '#7a4a20', '#2f1b0a']} />
      </Path>
      <Path path={p.pedal}>
        <LinearGradient start={vec(G.pedal.x0, -45)} end={vec(G.pedal.x1, 45)} colors={['#6b707b', '#3a3d45', '#22242a']} />
      </Path>
    </Group>
  );
}
let kickTop: { shell: SkPath; hoops: SkPath; rods: SkPath; pedal: SkPath } | null = null;

/* ── the throne and the tom holder ── */

function ThroneSide() {
  const t = KIT.throne;
  const p = (throneSide ??= (() => {
    const seatY = yAt(t.seatH);
    const seat = rrect(make(), t.c.u - t.r, seatY, t.c.u + t.r, seatY + 80, 30);
    const post = seg(make(), t.c.u, seatY + 80, t.c.u, KIT_FLOOR_Y - 150);
    const legs = make();
    seg(legs, t.c.u, KIT_FLOOR_Y - 150, t.c.u - 230, KIT_FLOOR_Y);
    seg(legs, t.c.u, KIT_FLOOR_Y - 150, t.c.u + 230, KIT_FLOOR_Y);
    return { seat, post, legs, seatY };
  })());
  return (
    <Group>
      <Path path={p.legs} style="stroke" strokeWidth={11} strokeCap="round" color="#16171b" />
      <Path path={p.legs} style="stroke" strokeWidth={7} strokeCap="round" color="#7a7f8a" />
      <Path path={p.post} style="stroke" strokeWidth={30} strokeCap="round" color="#16171b" />
      <Path path={p.post} style="stroke" strokeWidth={22} strokeCap="round" color="#5b5f69" />
      <Path path={p.seat}>
        <LinearGradient start={vec(0, p.seatY)} end={vec(0, p.seatY + 80)} colors={['#4a4e57', '#24262c', '#0e0f12']} />
      </Path>
      <Path path={p.seat} style="stroke" strokeWidth={1.4} color="#5d616c" />
    </Group>
  );
}
let throneSide: { seat: SkPath; post: SkPath; legs: SkPath; seatY: number } | null = null;

function ThroneTop() {
  const t = KIT.throne;
  const legs = (throneLegs ??= (() => {
    const p = make();
    for (let k = 0; k < 3; k++) {
      const a = Math.PI / 6 + (k * 2 * Math.PI) / 3;
      seg(p, t.c.u + Math.cos(a) * 40, t.c.v + Math.sin(a) * 40, t.c.u + Math.cos(a) * (t.r + 120), t.c.v + Math.sin(a) * (t.r + 120));
    }
    return p;
  })());
  return (
    <Group>
      <Path path={legs} style="stroke" strokeWidth={11} color="#7a7f8a" strokeCap="round" />
      <Circle cx={t.c.u + 12} cy={t.c.v + 16} r={t.r + 6} color="#000" opacity={0.55}>
        <BlurMask blur={14} style="normal" />
      </Circle>
      <Circle cx={t.c.u} cy={t.c.v} r={t.r}>
        <RadialGradient c={vec(t.c.u - t.r * 0.35, t.c.v - t.r * 0.4)} r={t.r * 1.7} colors={['#4a4e57', '#24262c', '#0e0f12']} />
      </Circle>
      <Circle cx={t.c.u} cy={t.c.v} r={t.r - 18} style="stroke" strokeWidth={2.5} color="#5d616c" opacity={0.8}>
        <DashPathEffect intervals={[8, 7]} />
      </Circle>
    </Group>
  );
}
let throneLegs: SkPath | null = null;

function tomArmEnds() {
  return (['tom1', 'tom2'] as const).map((id) => {
    const d = KIT_DRUMS[id];
    return pointOn(frameOf(d), d.spec.d.mm / 2 + 10, 0, d.spec.depth.mm * 0.5);
  });
}

function TomHolderSide() {
  const p = (holderSide ??= (() => {
    const top = { x: TOM_POST.u, y: -KICK_GEOM.R };
    const head = { x: TOM_POST.u, y: yAt(780) };
    const post = seg(make(), top.x, top.y, head.x, head.y);
    const arms = make();
    for (const e of tomArmEnds()) seg(arms, head.x, head.y, e.x, e.y);
    return { post, arms, head };
  })());
  return (
    <Group>
      <Path path={p.post} style="stroke" strokeWidth={24} strokeCap="round" color="#16171b" />
      <Path path={p.post} style="stroke" strokeWidth={17} strokeCap="round" color="#8a8f99" />
      <Path path={p.arms} style="stroke" strokeWidth={17} strokeCap="round" color="#16171b" />
      <Path path={p.arms} style="stroke" strokeWidth={11} strokeCap="round" color="#aeb3bd" />
      <Circle cx={p.head.x} cy={p.head.y} r={20} color="#2a2c32" />
    </Group>
  );
}
let holderSide: { post: SkPath; arms: SkPath; head: { x: number; y: number } } | null = null;

function TomHolderTop() {
  const p = (holderTop ??= (() => {
    const arms = make();
    for (const e of tomArmEnds()) seg(arms, TOM_POST.u, TOM_POST.v, e.x, e.z);
    return arms;
  })());
  return (
    <Group>
      <Path path={p} style="stroke" strokeWidth={15} strokeCap="round" color="#16171b" />
      <Path path={p} style="stroke" strokeWidth={10} strokeCap="round" color="#8a8f99" />
      <Circle cx={TOM_POST.u} cy={TOM_POST.v} r={22} color="#1b1c21" />
      <Circle cx={TOM_POST.u} cy={TOM_POST.v} r={22} style="stroke" strokeWidth={4} color="#b6bbc5" />
    </Group>
  );
}
let holderTop: SkPath | null = null;

/* ── the drummer's keep-outs ── */

function stadium(a: { u: number; v: number }, b: { u: number; v: number }, r: number): SkPath {
  const p = make();
  const dx = b.u - a.u;
  const dv = b.v - a.v;
  const L = Math.hypot(dx, dv) || 1e-6;
  const nx = -dv / L;
  const nv = dx / L;
  const ang = (Math.atan2(dv, dx) * 180) / Math.PI;
  p.moveTo(a.u + nx * r, a.v + nv * r);
  p.lineTo(b.u + nx * r, b.v + nv * r);
  p.arcToOval(Skia.XYWHRect(b.u - r, b.v - r, 2 * r, 2 * r), ang + 90, -180, false);
  p.lineTo(a.u - nx * r, a.v - nv * r);
  p.arcToOval(Skia.XYWHRect(a.u - r, a.v - r, 2 * r, 2 * r), ang - 90, -180, false);
  p.close();
  return p;
}

const keepCache = new Map<ViewId, { body: SkPath; reach: SkPath }>();
function keepOutPaths(view: ViewId) {
  let k = keepCache.get(view);
  if (!k) {
    const seatC = { x: KIT.throne.c.u, y: yAt(DRUMMER.seatH + DRUMMER.bodyR), z: KIT.throne.c.v };
    const headC = { x: DRUMMER.headTop.x, y: DRUMMER.headTop.y + DRUMMER.bodyR, z: DRUMMER.headTop.z };
    const v = (p: { x: number; y: number; z: number }) => ({ u: p.x, v: view === 'side' ? p.y : p.z });
    const body = stadium(v(seatC), v(headC), DRUMMER.bodyR);
    const sh = v(DRUMMER.shoulderR);
    const reach = make();
    reach.addCircle(sh.u, sh.v, DRUMMER.reach);
    k = { body, reach };
    keepCache.set(view, k);
  }
  return k;
}

/** The drummer's keep-outs: the body hatched grey (the lab's keep-out
 *  look), the sticks' reach dashed. */
export function DrummerKeepOut({ view, reach = true }: { view: ViewId; reach?: boolean }) {
  const k = keepOutPaths(view);
  return (
    <Group>
      <Group clip={k.body}>
        <Path path={hatch()} style="stroke" strokeWidth={4} color={GREY} opacity={0.5} />
      </Group>
      <Path path={k.body} style="stroke" strokeWidth={4} color={GREY} opacity={0.85} />
      {reach ? (
        <Path path={k.reach} style="stroke" strokeWidth={4} color={GREY} opacity={0.6}>
          <DashPathEffect intervals={[22, 16]} />
        </Path>
      ) : null}
    </Group>
  );
}

/* ── the scene ── */

const DRUM_ORDER_SIDE: KitDrumId[] = ['snare', 'tom1', 'tom2', 'floor'];

/** One drum from the side, uncut, with its stand or legs. */
function DrumSide({ id, dim }: { id: KitDrumId; dim: number }) {
  const d = KIT_DRUMS[id];
  if (id === 'snare') {
    const basket = d.c.y + d.spec.depth.mm + d.spec.hoop.above.mm;
    return (
      <Group opacity={dim}>
        <SnareStandSide cx={d.c.x} basketY={basket} hoopR={d.spec.d.mm / 2} floorY={KIT_FLOOR_Y} armsDeg={[180, 0]} />
        <Group transform={sideTransform(d)}>
          <DrumExterior spec={d.spec} />
        </Group>
      </Group>
    );
  }
  if (id === 'floor') {
    return (
      <Group opacity={dim} transform={sideTransform(d)}>
        <FloorTomLegsSide spec={d.spec} floorS={KIT_FLOOR_Y - d.c.y} />
        <DrumExterior spec={d.spec} />
      </Group>
    );
  }
  return (
    <Group opacity={dim} transform={sideTransform(d)}>
      <DrumExterior spec={d.spec} />
    </Group>
  );
}

function CymbalWithStandSide({ id, dim }: { id: 'crash1' | 'crash2' | 'ride'; dim: number }) {
  const p = KIT_PLACED_CYMBALS[id];
  return (
    <Group opacity={dim}>
      <BoomStandSide id={id} />
      <CymbalSide spec={p.spec} cx={p.c.x} cy={p.c.y} tiltDeg={p.tiltDeg} />
    </Group>
  );
}

export type KitSceneOpts = {
  /** Show the cymbals' swing envelopes (side view). */
  swing?: boolean;
  /** Dim the whole kit (a room scene draws it smaller in context). */
  dim?: number;
  /** The drummer's keep-outs (default on). */
  keepOuts?: boolean;
  /** The sticks' reach circle (default on). */
  reach?: boolean;
  /** A part to ring in amber (the parts page's tap). */
  highlight?: string | null;
};

/** The kit from the side (camera on the player's right). */
export function KitSide({ swing = false, dim = 1, keepOuts = true, reach = true }: KitSceneOpts) {
  const far = (z: number) => (z < -400 ? 0.92 : 1);
  return (
    <Group opacity={dim}>
      <HiHatSide dim={far(KIT_PLACED_CYMBALS.hihat.c.z)} />
      <CymbalWithStandSide id="crash1" dim={far(KIT_PLACED_CYMBALS.crash1.c.z)} />
      <DrumSide id="snare" dim={1} />
      <DrumSide id="tom1" dim={1} />
      <ThroneSide />
      <KickSide />
      <TomHolderSide />
      <DrumSide id="tom2" dim={1} />
      <CymbalWithStandSide id="crash2" dim={1} />
      <DrumSide id="floor" dim={1} />
      <CymbalWithStandSide id="ride" dim={1} />
      {swing
        ? (['crash1', 'crash2', 'ride'] as const).map((id) => {
            const p = KIT_PLACED_CYMBALS[id];
            return <SwingEnvelope key={id} spec={p.spec} cx={p.c.x} cy={p.c.y} tiltDeg={p.tiltDeg} />;
          })
        : null}
      {keepOuts ? <DrummerKeepOut view="side" reach={reach} /> : null}
    </Group>
  );
}

/** The kit from above. */
export function KitTop({ dim = 1, keepOuts = true, reach = true, highlight = null }: KitSceneOpts) {
  const drum = (id: KitDrumId) => (
    <Group key={id} transform={topTransform(KIT_DRUMS[id])}>
      <DrumPlan drum={KIT_DRUMS[id]} highlight={highlight === `kit.${id}`} />
    </Group>
  );
  const cym = (id: 'crash1' | 'crash2' | 'ride') => {
    const p = KIT_PLACED_CYMBALS[id];
    return <CymbalTop key={id} spec={p.spec} cx={p.c.x} cz={p.c.z} tiltDeg={p.tiltDeg} dim={highlight === `cym.${id}` ? 0.96 : 0.8} highlight={highlight === `cym.${id}`} />;
  };
  return (
    <Group opacity={dim}>
      {(['crash1', 'crash2', 'ride'] as const).map((id) => (
        <BoomStandTop key={`st:${id}`} id={id} />
      ))}
      <ThroneTop />
      <KickTop />
      {highlight === 'kit.kick' ? <Path path={rrect(make(), KICK_GEOM.hoopX.batter[0] - 30, -KICK_GEOM.hoopOut - 30, KICK_GEOM.hoopX.reso[1] + 30, KICK_GEOM.hoopOut + 30, 30)} style="stroke" strokeWidth={9} color={AMBER} /> : null}
      {drum('floor')}
      {drum('snare')}
      <TomHolderTop />
      {drum('tom1')}
      {drum('tom2')}
      <HiHatTop highlight={highlight === 'cym.hihat'} />
      {cym('ride')}
      {cym('crash1')}
      {cym('crash2')}
      {highlight === 'kit.throne' ? <Circle cx={KIT.throne.c.u} cy={KIT.throne.c.v} r={KIT.throne.r + 40} style="stroke" strokeWidth={9} color={AMBER} /> : null}
      {keepOuts ? <DrummerKeepOut view="top" reach={reach} /> : null}
    </Group>
  );
}

/* ── labels and taps ── */

/** The kit's part labels (short words first where space is tight). */
export function kitLabels(view: ViewId, opts: { drummer?: boolean } = {}): ArtLabel[] {
  const c = KIT_PLACED_CYMBALS;
  const R = (id: 'hihat' | 'crash1' | 'crash2' | 'ride') => c[id].spec.d.mm / 2;
  if (view === 'side') {
    const out: ArtLabel[] = [
      { id: 'ride', text: '20 IN RIDE', short: 'RIDE', u: c.ride.c.x, v: c.ride.c.y - 90, align: 'center' },
      { id: 'crash2', text: '18 IN CRASH', short: 'CRASH', u: c.crash2.c.x + 120, v: c.crash2.c.y - 110, align: 'center' },
      { id: 'crash1', text: '16 IN CRASH', short: 'CRASH', u: c.crash1.c.x - 160, v: c.crash1.c.y - 120, align: 'center' },
      { id: 'hihat', text: 'HI-HATS', short: 'HATS', u: c.hihat.c.x - R('hihat') - 20, v: c.hihat.c.y - 40, align: 'right' },
      { id: 'kick', text: 'KICK', u: KICK_GEOM.L / 2, v: 40, align: 'center' },
      { id: 'floor', text: 'FLOOR TOM', short: 'FLOOR', u: KIT_DRUMS.floor.c.x, v: KIT_DRUMS.floor.c.y + KIT_DRUMS.floor.spec.depth.mm / 2, align: 'center' },
      { id: 'snare', text: 'SNARE', u: S0.x - 210, v: S0.y + 30, align: 'right' },
    ];
    if (opts.drummer !== false) out.push({ id: 'drummer', text: 'DRUMMER', u: DRUMMER.headTop.x, v: DRUMMER.headTop.y + 120, align: 'center', tone: 'illustrative' });
    return out;
  }
  const out: ArtLabel[] = [
    { id: 'ride', text: '20 IN RIDE', short: 'RIDE', u: c.ride.c.x + 60, v: c.ride.c.z + R('ride') + 50, align: 'center' },
    { id: 'crash2', text: '18 IN CRASH', short: 'CRASH', u: c.crash2.c.x + 80, v: c.crash2.c.z + R('crash2') + 50, align: 'center' },
    { id: 'crash1', text: '16 IN CRASH', short: 'CRASH', u: c.crash1.c.x + 80, v: c.crash1.c.z - R('crash1') - 30, align: 'center' },
    { id: 'hihat', text: 'HI-HATS', short: 'HATS', u: c.hihat.c.x - 30, v: c.hihat.c.z - R('hihat') - 34, align: 'center' },
    { id: 'snare', text: 'SNARE', u: S0.x - 30, v: S0.z + 30, align: 'center' },
    { id: 'kick', text: 'KICK', u: KICK_GEOM.L + 40, v: 0, align: 'left' },
  ];
  if (opts.drummer !== false) out.push({ id: 'drummer', text: 'DRUMMER', u: KIT.throne.c.u, v: KIT.throne.c.v + 30, align: 'center', tone: 'illustrative' });
  return out;
}

/** The kit part under a model point (u, v), `tol` in mm; null = none. */
export function kitHitTest(view: ViewId, u: number, v: number, tol: number): string | null {
  const c = KIT_PLACED_CYMBALS;
  if (view === 'top') {
    // Cymbals first (they hang above), then the drums under them.
    for (const id of ['crash2', 'crash1', 'ride', 'hihat'] as const) {
      const p = c[id];
      const ct = Math.cos((p.tiltDeg * Math.PI) / 180);
      const R = p.spec.d.mm / 2;
      const du = (u - p.c.x) / (R * ct + tol);
      const dv = (v - p.c.z) / (R + tol);
      if (du * du + dv * dv <= 1) {
        // A cymbal over a drum: the drum wins near the drum's centre.
        const under = (['tom1', 'tom2', 'floor', 'snare'] as const).find((d) => Math.hypot(u - KIT_DRUMS[d].c.x, v - KIT_DRUMS[d].c.z) <= KIT_DRUMS[d].spec.d.mm * 0.3);
        return under ? `kit.${under}` : `cym.${id}`;
      }
    }
    for (const id of ['tom1', 'tom2', 'snare', 'floor'] as const) if (Math.hypot(u - KIT_DRUMS[id].c.x, v - KIT_DRUMS[id].c.z) <= KIT_DRUMS[id].spec.d.mm / 2 + tol) return `kit.${id}`;
    if (u >= KICK_GEOM.hoopX.batter[0] - tol && u <= KICK_GEOM.hoopX.reso[1] + tol && Math.abs(v) <= KICK_GEOM.hoopOut + tol) return 'kit.kick';
    if (Math.hypot(u - KIT.throne.c.u, v - KIT.throne.c.v) <= KIT.throne.r + tol) return 'kit.throne';
    return null;
  }
  // Side: a cymbal is a tilted line; test the distance to it.
  for (const id of ['ride', 'crash2', 'crash1', 'hihat'] as const) {
    const p = c[id];
    const t = (p.tiltDeg * Math.PI) / 180;
    const R = p.spec.d.mm / 2;
    const ax = p.c.x - R * Math.cos(t);
    const ay = p.c.y + R * Math.sin(t);
    const bx = p.c.x + R * Math.cos(t);
    const by = p.c.y - R * Math.sin(t);
    const vx = bx - ax;
    const vy = by - ay;
    const k = Math.max(0, Math.min(1, ((u - ax) * vx + (v - ay) * vy) / (vx * vx + vy * vy)));
    if (Math.hypot(u - (ax + vx * k), v - (ay + vy * k)) <= tol + p.spec.rise.mm + 14) return `cym.${id}`;
  }
  for (const id of DRUM_ORDER_SIDE.slice().reverse()) {
    const d = KIT_DRUMS[id];
    const f = frameOf(d);
    const a = pointOn(f, 0, 0, 0);
    const b = pointOn(f, 0, 0, f.depth);
    const half = f.R + 20;
    const x0 = Math.min(a.x, b.x) - half * Math.cos((d.tiltDeg * Math.PI) / 180);
    const x1 = Math.max(a.x, b.x) + half * Math.cos((d.tiltDeg * Math.PI) / 180);
    const y0 = Math.min(a.y, b.y) - 30;
    const y1 = Math.max(a.y, b.y) + 30;
    if (u >= x0 - tol && u <= x1 + tol && v >= y0 - tol && v <= y1 + tol) return `kit.${id}`;
  }
  if (u >= KICK_GEOM.hoopX.batter[0] - tol && u <= KICK_GEOM.hoopX.reso[1] + tol && Math.abs(v) <= KICK_GEOM.hoopOut + tol) return 'kit.kick';
  if (Math.abs(u - KIT.throne.c.u) <= KIT.throne.r + tol && v >= yAt(KIT.throne.seatH) - tol && v <= KIT_FLOOR_Y) return 'kit.throne';
  return null;
}
