/**
 * M13 TABLA — the look (charter §2 layer 3): the pair drawn with care, ONLY
 * from geometry.ts's anchors, in millimetres of each view's plane:
 *   side  u = x, v = y — from the player's right: the dayan in front, the
 *         bayan behind it, each leaning toward the audience on its ring;
 *   top   u = x, v = z — from above: both heads nearly face-on, the black
 *         patch CENTRED on the dayan and OFF-CENTRE (toward the player) on
 *         the bayan, the lacing running down from each braided rim.
 * The wooden dayan with its lacing and tuning blocks; the metal kettle of the
 * bayan (the museum's pair: "hide, wood, chromed copper"). Profiles, head
 * sizes, patches, rings and posture are drawing defaults the owner checks.
 * The player is quiet line art (a bald head — the house style). Static (D8).
 */
import { BlurMask, Circle, DashPathEffect, Group, LinearGradient, Path, RadialGradient, Skia, vec } from '@shopify/react-native-skia';
import type { VariantId, ViewId } from '../../engine/model/types.ts';
import type { ArtLabel } from '../../engine/scene/sceneTypes.ts';
import { BAYAN, DAYAN, type TablaDrum } from './geometry.ts';
import { PlayerBehind, PlayerInFront } from '../shared/players/PlayerFigure';
import { pt, type PlayerPose } from '../shared/players/playerPose.ts';

type SkPath = ReturnType<typeof Skia.Path.Make>;
const make = () => Skia.Path.Make();
const WOOD = ['#c48f52', '#8a5426', '#5c3417', '#2f1b0a'];
const METAL = ['#f2d8b8', '#c8915e', '#8a5a32', '#3a2414'];
const SKIN = ['#efe2c4', '#dccaa2', '#b8a072'];
const PATCH = ['#3a3d45', '#15161a', '#050506'];

/** Radius profile r(s), s = 0 at the base … height at the head (drawing defaults). */
function profile(d: TablaDrum, s: number): number {
  const t = Math.max(0, Math.min(1, s / d.height));
  const pts: [number, number][] =
    d.id === 'dayan'
      ? [
          [0, 0.9],
          [0.08, 0.95],
          [0.3, 1],
          [0.6, 0.97],
          [0.85, 0.87],
          [1, 0.82],
        ]
      : [
          [0, 0.55],
          [0.12, 0.78],
          [0.3, 0.965],
          [0.45, 1],
          [0.65, 0.965],
          [0.85, 0.91],
          [1, 0.9],
        ];
  for (let i = 1; i < pts.length; i++) {
    if (t <= pts[i][0]) {
      const k = (t - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]);
      const e = k * k * (3 - 2 * k);
      return d.maxR * (pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * e);
    }
  }
  return d.maxR * pts[pts.length - 1][1];
}
export const tablaProfile = profile;

/* ── side view (x, y) ── */
function sideParts(d: TablaDrum) {
  const ux = d.u.x;
  const uy = d.u.y;
  const px = -uy; // perpendicular in the x–y plane (cos t, sin t)
  const py = ux;
  const at = (s: number, k: number) => [d.B.x + ux * s + px * k, d.B.y + uy * s + py * k] as const;
  const body = make();
  const N = 40;
  for (let i = 0; i <= N; i++) {
    const s = (d.height * i) / N;
    const [x, y] = at(s, -profile(d, s));
    if (i === 0) body.moveTo(x, y);
    else body.lineTo(x, y);
  }
  for (let i = N; i >= 0; i--) {
    const s = (d.height * i) / N;
    const [x, y] = at(s, profile(d, s));
    body.lineTo(x, y);
  }
  body.close();
  // Lacing: straps from the braided rim down to the base (their chords).
  const straps = make();
  for (const f of [-0.75, -0.4, 0, 0.4, 0.75]) {
    const [x0, y0] = at(d.height - 6, f * profile(d, d.height));
    const [x1, y1] = at(d.id === 'dayan' ? 8 : d.height * 0.12, f * profile(d, d.id === 'dayan' ? 8 : d.height * 0.12));
    straps.moveTo(x0, y0);
    straps.lineTo(x1, y1);
  }
  // Tuning blocks on the dayan's straps; a binding ring low on the bayan.
  const blocks = make();
  if (d.id === 'dayan') {
    for (const f of [-0.75, -0.4, 0, 0.4, 0.75]) {
      const s = d.height * 0.3;
      const [x, y] = at(s, f * profile(d, s) * 1.02);
      blocks.addRRect(Skia.RRectXY(Skia.XYWHRect(x - 9, y - 26, 18, 52), 6, 6));
    }
  } else {
    const [x0, y0] = at(d.height * 0.12, -profile(d, d.height * 0.12) - 4);
    const [x1, y1] = at(d.height * 0.12, profile(d, d.height * 0.12) + 4);
    blocks.moveTo(x0, y0);
    blocks.lineTo(x1, y1);
  }
  // The head, edge-on, and its braided rim.
  const [hx0, hy0] = at(d.height, -d.headR);
  const [hx1, hy1] = at(d.height, d.headR);
  const head = make();
  head.moveTo(hx0, hy0);
  head.lineTo(hx1, hy1);
  const rim = make();
  const [rx0, ry0] = at(d.height + 2, -d.headR - 8);
  const [rx1, ry1] = at(d.height + 2, d.headR + 8);
  rim.moveTo(rx0, ry0);
  rim.lineTo(rx1, ry1);
  // The cloth ring it sits in.
  const ring = make();
  ring.addOval(Skia.XYWHRect(d.B.x - profile(d, 0) - 30, d.B.y - 22, 2 * profile(d, 0) + 60, 64));
  const [gx, gy] = at(d.height * 0.55, -profile(d, d.height * 0.55));
  return { body, straps, blocks, head, rim, ring, glow: [gx, gy] as const };
}

/* ── top view (x, z) ── */
function topParts(d: TablaDrum) {
  const ct = -d.u.y; // cos(tilt): how much an x-extent is foreshortened
  const body = make();
  const N = 24;
  for (let i = 0; i <= N; i++) {
    const s = (d.height * i) / N;
    const r = profile(d, s);
    const cx = d.B.x + d.u.x * s;
    body.addOval(Skia.XYWHRect(cx - r * ct, d.B.z - r, 2 * r * ct, 2 * r));
  }
  // One shape by non-zero fill; the outline is a wide stroke drawn UNDER it
  // (no path ops: the web backend has no simplify).
  const head = make();
  head.addOval(Skia.XYWHRect(d.H.x - d.headR * ct, d.H.z - d.headR, 2 * d.headR * ct, 2 * d.headR));
  const rim = make();
  rim.addOval(Skia.XYWHRect(d.H.x - (d.headR + 8) * ct, d.H.z - d.headR - 8, 2 * (d.headR + 8) * ct, 2 * (d.headR + 8)));
  // The outer ring of skin (the second layer at the edge): a thin band.
  const edge = make();
  edge.addOval(Skia.XYWHRect(d.H.x - (d.headR - 11) * ct, d.H.z - d.headR + 11, 2 * (d.headR - 11) * ct, 2 * (d.headR - 11)));
  const patch = make();
  patch.addOval(Skia.XYWHRect(d.patchC.x - d.patchR * ct, d.patchC.z - d.patchR, 2 * d.patchR * ct, 2 * d.patchR));
  // Straps fanning out from the braided rim to the body's widest girth.
  const straps = make();
  const M = d.id === 'dayan' ? 16 : 14;
  const rMax = d.maxR;
  const cMax = d.B.x + d.u.x * d.height * (d.id === 'dayan' ? 0.3 : 0.45);
  for (let k = 0; k < M; k++) {
    const a = (k / M) * Math.PI * 2;
    straps.moveTo(d.H.x + Math.cos(a) * (d.headR + 8) * ct, d.H.z + Math.sin(a) * (d.headR + 8));
    straps.lineTo(cMax + Math.cos(a) * rMax * ct, d.B.z + Math.sin(a) * rMax);
  }
  return { body, head, rim, edge, patch, straps };
}

type Built = { side: ReturnType<typeof sideParts>[]; top: ReturnType<typeof topParts>[]; person: { side: SkPath; top: SkPath; topLegs: SkPath }; floor: SkPath };
let built: Built | null = null;
function getBuilt(): Built {
  if (built) return built;
  const pSide = make();
  // Seated on the floor, cross-legged, facing the audience: line art.
  pSide.addCircle(-560, -1000, 90);
  pSide.moveTo(-600, -905);
  pSide.cubicTo(-640, -760, -640, -520, -600, -300);
  pSide.moveTo(-510, -890);
  pSide.cubicTo(-450, -760, -420, -620, -420, -470);
  pSide.moveTo(-600, -300);
  pSide.cubicTo(-500, -180, -300, -120, -170, -110);
  pSide.moveTo(-500, -820);
  pSide.cubicTo(-380, -700, -220, -560, -80, -460);
  const pTop = make();
  pTop.addOval(Skia.XYWHRect(-720, -250, 300, 500));
  pTop.addCircle(-570, 0, 92);
  pTop.moveTo(-520, 190);
  pTop.cubicTo(-380, 260, -150, 230, -20, 160);
  pTop.moveTo(-520, -190);
  pTop.cubicTo(-380, -260, -160, -230, -40, -170);
  const legs = make();
  legs.addOval(Skia.XYWHRect(-520, -470, 360, 300));
  legs.addOval(Skia.XYWHRect(-520, 170, 360, 300));
  const floor = make();
  floor.addRect(Skia.XYWHRect(-3000, 0, 6000, 600));
  built = { side: [sideParts(BAYAN), sideParts(DAYAN)], top: [topParts(BAYAN), topParts(DAYAN)], person: { side: pSide, top: pTop, topLegs: legs }, floor };
  return built;
}

function SideDrum({ d, p, behind }: { d: TablaDrum; p: ReturnType<typeof sideParts>; behind: boolean }) {
  const cols = d.id === 'dayan' ? WOOD : METAL;
  return (
    <Group opacity={behind ? 0.82 : 1}>
      <Path path={p.ring}>
        <LinearGradient start={vec(d.B.x, d.B.y - 22)} end={vec(d.B.x, d.B.y + 42)} colors={['#7a6a8f', '#4b4060', '#251f31']} />
      </Path>
      <Path path={p.ring} style="stroke" strokeWidth={2} color="#16121f" />
      <Path path={p.body}>
        <LinearGradient start={vec(d.B.x - d.maxR, 0)} end={vec(d.B.x + d.maxR + 80, 0)} colors={cols} positions={[0, 0.3, 0.7, 1]} />
      </Path>
      <Path path={p.body}>
        <RadialGradient c={vec(p.glow[0] + 30, p.glow[1])} r={d.maxR * 1.2} colors={['rgba(255,236,200,0.22)', 'rgba(255,236,200,0)']} />
      </Path>
      <Path path={p.straps} style="stroke" strokeWidth={7} color="#2a1a0e" opacity={0.85} />
      <Path path={p.straps} style="stroke" strokeWidth={2.4} color="#a07a4e" opacity={0.6} />
      {d.id === 'dayan' ? (
        <Path path={p.blocks}>
          <LinearGradient start={vec(d.B.x - 100, 0)} end={vec(d.B.x + 100, 0)} colors={['#d9a766', '#8a5426']} />
        </Path>
      ) : (
        <Path path={p.blocks} style="stroke" strokeWidth={14} strokeCap="round" color="#3a2414" />
      )}
      <Path path={p.body} style="stroke" strokeWidth={3} color="#140b05" />
      <Path path={p.rim} style="stroke" strokeWidth={18} strokeCap="round" color="#5c3417" />
      <Path path={p.rim} style="stroke" strokeWidth={6} strokeCap="round" color="#c48f52" opacity={0.7}>
        <DashPathEffect intervals={[8, 6]} />
      </Path>
      <Path path={p.head} style="stroke" strokeWidth={8} strokeCap="round" color="#e2d1aa" />
    </Group>
  );
}

function TopDrum({ d, p }: { d: TablaDrum; p: ReturnType<typeof topParts> }) {
  const cols = d.id === 'dayan' ? WOOD : METAL;
  return (
    <Group>
      <Group transform={[{ translateX: 14 }, { translateY: 18 }]}>
        <Path path={p.body} color="#000" opacity={0.5}>
          <BlurMask blur={22} style="normal" />
        </Path>
      </Group>
      <Path path={p.body} style="stroke" strokeWidth={6} color="#140b05" />
      <Path path={p.body}>
        <RadialGradient c={vec(d.H.x - d.maxR * 0.4, d.H.z - d.maxR * 0.45)} r={d.maxR * 1.8} colors={cols} />
      </Path>
      <Path path={p.straps} style="stroke" strokeWidth={6} color="#2a1a0e" opacity={0.8} />
      <Path path={p.straps} style="stroke" strokeWidth={2} color="#a07a4e" opacity={0.55} />
      <Path path={p.rim} style="stroke" strokeWidth={16} color="#5c3417" />
      <Path path={p.rim} style="stroke" strokeWidth={5} color="#c48f52" opacity={0.7}>
        <DashPathEffect intervals={[9, 7]} />
      </Path>
      <Path path={p.head}>
        <RadialGradient c={vec(d.H.x - d.headR * 0.4, d.H.z - d.headR * 0.45)} r={d.headR * 1.7} colors={SKIN} />
      </Path>
      <Path path={p.edge} style="stroke" strokeWidth={1.6} color="#9c8256" opacity={0.7} />
      <Path path={p.patch}>
        <RadialGradient c={vec(d.patchC.x - d.patchR * 0.35, d.patchC.z - d.patchR * 0.4)} r={d.patchR * 1.5} colors={PATCH} />
      </Path>
      <Circle cx={d.patchC.x - d.patchR * 0.35} cy={d.patchC.z - d.patchR * 0.38} r={d.patchR * 0.22} color="#ffffff" opacity={0.14}>
        <BlurMask blur={d.patchR * 0.2} style="normal" />
      </Circle>
    </Group>
  );
}

/** The player as the shared figure (players/PlayerFigure, clarity pass
 *  2026-10-05): seated cross-legged on the floor, barefoot, facing the
 *  audience (+x), the right hand on the dayan, the left on the bayan — the
 *  same places as the line art it replaces. ILLUSTRATIVE. */
const tablaPoses: Partial<Record<ViewId, PlayerPose>> = {};
export function tablaPose(view: ViewId): PlayerPose {
  const hit = tablaPoses[view];
  if (hit) return hit;
  let pose: PlayerPose;
  if (view === 'side') {
    const hip = pt(-600, -170);
    pose = {
      view: 'side',
      posture: 'floor',
      facing: 1,
      head: { c: pt(-560, -1000), r: 100 },
      neck: pt(-577, -845),
      shoulderR: pt(-572, -795),
      shoulderL: pt(-586, -805),
      elbowR: pt(-430, -560),
      elbowL: pt(-446, -575),
      handR: { wrist: pt(-230, -490), dir: 0.12, kind: 'rest' },
      handL: { wrist: pt(-250, -430), dir: 0.3, kind: 'rest' },
      hipR: hip,
      hipL: pt(hip.u - 10, hip.v - 4),
      kneeR: pt(-250, -120),
      kneeL: pt(-280, -130),
      footR: pt(-420, 0),
      footL: pt(-400, 0),
      floor: 0,
    };
  } else {
    const n = pt(-580, 0);
    const L = (right: number, fwd: number) => pt(n.u - right, n.v + fwd);
    pose = {
      view: 'above',
      posture: 'floor',
      facing: 0,
      head: { c: L(0, 10), r: 96 },
      neck: n,
      shoulderR: L(188, 4),
      shoulderL: L(-188, 4),
      elbowR: L(230, 170),
      elbowL: L(-230, 170),
      handR: { wrist: L(165, 360), dir: Math.PI / 2 - 0.2, kind: 'above' },
      handL: { wrist: L(-165, 360), dir: Math.PI / 2 + 0.2, kind: 'above' },
      hipR: L(106, -40),
      hipL: L(-106, -40),
      kneeR: L(300, 230),
      kneeL: L(-300, 230),
      footR: L(80, 300),
      footL: L(-80, 300),
      floor: null,
    };
  }
  tablaPoses[view] = pose;
  return pose;
}

export function TablaArt({ view }: { view: ViewId; variant: VariantId }) {
  const b = getBuilt();
  if (view === 'top') {
    return (
      <Group>
        <PlayerBehind pose={tablaPose('top')} dim={0.85} />
        <TopDrum d={BAYAN} p={b.top[0]} />
        <TopDrum d={DAYAN} p={b.top[1]} />
        <PlayerInFront pose={tablaPose('top')} dim={0.85} />
      </Group>
    );
  }
  return (
    <Group>
      <Path path={b.floor}>
        <LinearGradient start={vec(0, 0)} end={vec(0, 60)} colors={['#202128', '#141519', '#0b0b0e']} />
      </Path>
      <PlayerBehind pose={tablaPose('side')} dim={0.85} />
      <SideDrum d={BAYAN} p={b.side[0]} behind />
      <SideDrum d={DAYAN} p={b.side[1]} behind={false} />
      <PlayerInFront pose={tablaPose('side')} dim={0.85} />
    </Group>
  );
}

export function tablaLabels(view: ViewId): ArtLabel[] {
  if (view === 'top') {
    return [
      { id: 'dayan', text: 'DAYAN · PATCH CENTRED', short: 'DAYAN', u: DAYAN.H.x, v: DAYAN.H.z + DAYAN.maxR + 50, align: 'center' },
      { id: 'bayan', text: 'BAYAN · PATCH OFF-CENTRE', short: 'BAYAN', u: BAYAN.H.x, v: BAYAN.H.z - BAYAN.maxR - 40, align: 'center' },
      { id: 'player', text: 'PLAYER', u: -570, v: 140, align: 'center', tone: 'muted' },
    ];
  }
  return [
    { id: 'dayan', text: 'DAYAN (NEAR)', short: 'DAYAN', u: DAYAN.H.x + DAYAN.headR + 40, v: DAYAN.H.y + 30, align: 'left' },
    { id: 'bayan', text: 'BAYAN (BEHIND)', short: 'BAYAN', u: BAYAN.H.x + BAYAN.headR + 50, v: BAYAN.H.y - 40, align: 'left', tone: 'muted' },
    { id: 'rings', text: 'SUPPORT RINGS', short: 'RINGS', u: DAYAN.B.x + 160, v: -16, align: 'left', tone: 'illustrative' },
    { id: 'player', text: 'PLAYER', u: -560, v: -1130, align: 'center', tone: 'muted' },
  ];
}

function inEllipse(u: number, v: number, cu: number, cv: number, ru: number, rv: number) {
  return ((u - cu) / ru) ** 2 + ((v - cv) / rv) ** 2 <= 1;
}

export function tablaHitTest(view: ViewId, _variant: VariantId, u: number, v: number, tol: number): string | null {
  if (view === 'top') {
    for (const d of [DAYAN, BAYAN]) {
      const ct = -d.u.y;
      const pre = d.id === 'dayan' ? 'ta.dayan' : 'ta.bayan';
      if (inEllipse(u, v, d.patchC.x, d.patchC.z, d.patchR * ct + 2, d.patchR + 2)) return `${pre}Patch`;
      if (inEllipse(u, v, d.H.x, d.H.z, (d.headR + 8) * ct + tol * 0.5, d.headR + 8 + tol * 0.5)) return `${pre}Head`;
      if (inEllipse(u, v, d.H.x - d.u.x * d.height * 0.5, d.H.z, d.maxR * ct + tol, d.maxR + tol)) return d.id === 'dayan' ? 'ta.dayanLacing' : 'ta.bayanBody';
    }
    return null;
  }
  for (const d of [DAYAN, BAYAN]) {
    // Into the drum's frame: s along its axis from the base, k across.
    const dx = u - d.B.x;
    const dy = v - d.B.y;
    const s = dx * d.u.x + dy * d.u.y;
    const k = dx * -d.u.y + dy * d.u.x;
    if (s < -40 - tol || s > d.height + 20 + tol) continue;
    if (s < 0 && Math.abs(k) <= profile(d, 0) + 40) return 'ta.rings';
    if (Math.abs(k) > profile(d, Math.max(0, Math.min(d.height, s))) + tol) continue;
    if (s >= d.height - 14) return d.id === 'dayan' ? 'ta.dayanHead' : 'ta.bayanHead';
    return d.id === 'dayan' ? 'ta.dayanBody' : 'ta.bayanBody';
  }
  return null;
}
