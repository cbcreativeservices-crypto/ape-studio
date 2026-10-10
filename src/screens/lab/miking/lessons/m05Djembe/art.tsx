/**
 * M05 DJEMBE — the look (charter §2 layer 3), drawn only from model.ts /
 * geometry.ts anchors. A carved goblet (one profile shared with the
 * collision, smoothed for the eye), a goat-skin head with its fur edge, and
 * rope tuning laced between two rings (MEINL-HDJ500: "Pre-stretched nylon PP
 * ropes"; the lacing pattern and ring positions are drawing defaults). The
 * raised setup stands on four foam blocks (COPPINGER). Upper-left light.
 */
import { useMemo } from 'react';
import { BlurMask, Group, LinearGradient, Path, Skia, vec } from '@shopify/react-native-skia';
import type { VariantId, ViewId } from '../../engine/model/types.ts';
import type { ArtLabel } from '../../engine/scene/sceneTypes.ts';
import { ContactShadow, FloorSide, GOAT, HeadTop, INK } from '../shared/handdrums/handDrumArt';
import { planDist } from '../shared/handdrums/handDrumModel.ts';
import { DJEMBE, HEAD_Y, PROFILE, R, R_FOOT, R_WAIST, SUPPORT, WAIST_Y } from './model.ts';
import { BLOCKS, DJ_MODEL } from './geometry.ts';

type SkPath = ReturnType<typeof Skia.Path.Make>;
const CARVED = ['#1c0f07', '#4e2c14', '#8a5428', '#a86a35', '#7a4a22', '#3a200e', '#140904'];
const ROPE = '#e9e1cd';

/** The outer radius at height y, smoothed through the profile (monotone cubic). */
export function profileR(y: number): number {
  const P = PROFILE;
  if (y <= P[0].y) return P[0].r;
  if (y >= P[P.length - 1].y) return P[P.length - 1].r;
  let i = 0;
  while (i < P.length - 2 && y > P[i + 1].y) i++;
  const a = P[i];
  const b = P[i + 1];
  const t = (y - a.y) / (b.y - a.y);
  // Hermite with slopes from the neighbours (Fritsch–Carlson style clamp).
  const slope = (k: number) => {
    const p = P[Math.max(0, k - 1)];
    const n = P[Math.min(P.length - 1, k + 1)];
    return (n.r - p.r) / (n.y - p.y || 1);
  };
  const h = b.y - a.y;
  const m0 = slope(i) * h;
  const m1 = slope(i + 1) * h;
  const t2 = t * t;
  const t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * a.r + (t3 - 2 * t2 + t) * m0 + (-2 * t3 + 3 * t2) * b.r + (t3 - t2) * m1;
}

/* Real-object reference (drawing only, never app text): a 12-1/2 in
 * (318 mm) goat-skin djembe about 610 mm tall. A carved GOBLET, not a cone:
 * the bowl wall runs nearly straight down from the head for ~70 mm, then
 * rounds in like a cup to a narrow stem (~120 mm across, ~330 mm below the
 * head), which flares out again to a ~280 mm foot. Rope tuning: a crown ring
 * under the skin, a bottom ring seated where the bowl curves in (~235 mm
 * down), verticals laced between them and a band of Mali-weave diamonds.
 * DRAW_PROFILE keeps the model's anchors (head R, the waist at WAIST_Y and
 * R_WAIST, the foot R_FOOT at the floor); the collision keeps PROFILE. */
const DRAW_PROFILE: readonly { y: number; r: number }[] = [
  { y: HEAD_Y, r: R + 2 },
  { y: HEAD_Y + 70, r: R + 3 },
  { y: HEAD_Y + 140, r: R - 12 },
  { y: HEAD_Y + 200, r: R - 40 },
  { y: HEAD_Y + 250, r: R - 72 },
  { y: HEAD_Y + 295, r: R_WAIST + 10 },
  { y: WAIST_Y, r: R_WAIST },
  { y: WAIST_Y + 60, r: R_WAIST + 3 },
  { y: WAIST_Y + 130, r: R_WAIST + 16 },
  { y: WAIST_Y + 200, r: (R_WAIST + R_FOOT) / 2 + 8 },
  { y: -30, r: R_FOOT - 12 },
  { y: 0, r: R_FOOT },
];

/** The drawn outer radius at height y: a monotone cubic through DRAW_PROFILE. */
export function drawR(y: number): number {
  const P = DRAW_PROFILE;
  if (y <= P[0].y) return P[0].r;
  if (y >= P[P.length - 1].y) return P[P.length - 1].r;
  let i = 0;
  while (i < P.length - 2 && y > P[i + 1].y) i++;
  const a = P[i];
  const b = P[i + 1];
  const h = b.y - a.y;
  const t = (y - a.y) / h;
  const d = (k: number) => (P[k + 1].r - P[k].r) / (P[k + 1].y - P[k].y);
  const m = (k: number) => {
    if (k === 0) return d(0);
    if (k === P.length - 1) return d(k - 1);
    const d0 = d(k - 1);
    const d1 = d(k);
    return d0 * d1 <= 0 ? 0 : (2 * d0 * d1) / (d0 + d1);
  };
  const m0 = m(i) * h;
  const m1 = m(i + 1) * h;
  const t2 = t * t;
  const t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * a.r + (t3 - 2 * t2 + t) * m0 + (-2 * t3 + 3 * t2) * b.r + (t3 - t2) * m1;
}

/** The drawn goblet as a section profile (head → floor), for the cut-open drawing. */
export const DRAW_SECTION: readonly { y: number; r: number }[] = Array.from({ length: 49 }, (_, i) => {
  const y = HEAD_Y + (-HEAD_Y * i) / 48;
  return { y, r: drawR(y) };
});

const TOP_RING_Y = HEAD_Y + 26;
const LOW_RING_Y = HEAD_Y + 235;
const VERTS = 26;

function buildSide() {
  const N = 90;
  const ys = Array.from({ length: N + 1 }, (_, i) => HEAD_Y + 4 + ((0 - HEAD_Y - 4) * i) / N);
  const body: SkPath = Skia.Path.Make();
  ys.forEach((y, i) => (i === 0 ? body.moveTo(-drawR(y), y) : body.lineTo(-drawR(y), y)));
  for (let i = ys.length - 1; i >= 0; i--) body.lineTo(drawR(ys[i]), ys[i]);
  body.close();
  // Carving: a bead where the bowl meets the stem, and the foot's lip.
  const bands: SkPath = Skia.Path.Make();
  for (const y of [WAIST_Y - 6, WAIST_Y + 6, -22]) {
    bands.moveTo(-drawR(y) + 2, y);
    bands.lineTo(drawR(y) - 2, y);
  }
  // The rope rings (seen edge-on).
  const rings: SkPath = Skia.Path.Make();
  for (const y of [TOP_RING_Y, LOW_RING_Y]) {
    const r = drawR(y) + 5;
    rings.addRRect(Skia.RRectXY(Skia.XYWHRect(-r, y - 5, 2 * r, 10), 5, 5));
  }
  // A rope from ring to ring is taut, but it lies ON the bowl where the bowl
  // stands proud of the straight line: r = max(straight, surface).
  const rT = drawR(TOP_RING_Y) + 6;
  const rB = drawR(LOW_RING_Y) + 6;
  const ropeR = (y: number) => {
    const t = (y - TOP_RING_Y) / (LOW_RING_Y - TOP_RING_Y);
    return Math.max(rT + (rB - rT) * t, drawR(y) + 3);
  };
  const ropePt = (ang: number, t: number): [number, number] => {
    const y = TOP_RING_Y + (LOW_RING_Y - TOP_RING_Y) * t;
    return [Math.cos(ang) * ropeR(y), y];
  };
  const laces: SkPath = Skia.Path.Make();
  // Verticals: down from a top-ring loop to a bottom-ring loop half a step
  // round, and back up (the zigzag every djembe starts from).
  const near = (a: number) => Math.sin(a) > 0.04;
  const leg = (a0: number, a1: number) => {
    const S = 16;
    for (let j = 0; j <= S; j++) {
      const t = j / S;
      const [x, y] = ropePt(a0 + (a1 - a0) * t, t);
      if (j === 0) laces.moveTo(x, y);
      else laces.lineTo(x, y);
    }
  };
  for (let k = 0; k < VERTS; k++) {
    const a = (k / VERTS) * 2 * Math.PI;
    const b = ((k + 0.5) / VERTS) * 2 * Math.PI;
    const c = ((k + 1) / VERTS) * 2 * Math.PI;
    if (near(a) || near(b)) leg(a, b);
    if (near(b) || near(c)) leg(c, b);
  }
  // Mali weave: a band of diamonds in the upper verticals (each pair of
  // neighbouring verticals pulled together and crossed).
  const weave: SkPath = Skia.Path.Make();
  const rows = [0.1, 0.24, 0.38, 0.52];
  for (let k = 0; k < VERTS * 2; k++) {
    const a0 = (k / (VERTS * 2)) * 2 * Math.PI;
    const a1 = ((k + 1) / (VERTS * 2)) * 2 * Math.PI;
    if (!near(a0) || !near(a1)) continue;
    for (let j = 0; j < rows.length - 1; j++) {
      const p0 = ropePt(a0, rows[j]);
      const p1 = ropePt(a1, rows[j + 1]);
      const q0 = ropePt(a1, rows[j]);
      const q1 = ropePt(a0, rows[j + 1]);
      if ((k + j) % 2 === 0) {
        weave.moveTo(p0[0], p0[1]);
        weave.lineTo(p1[0], p1[1]);
      } else {
        weave.moveTo(q0[0], q0[1]);
        weave.lineTo(q1[0], q1[1]);
      }
    }
  }
  // The skin's fur edge, hanging over the top ring.
  const fur: SkPath = Skia.Path.Make();
  for (let k = 0; k <= 40; k++) {
    const x = -R - 6 + ((2 * R + 12) * k) / 40;
    fur.moveTo(x, HEAD_Y + 4);
    fur.lineTo(x + (k % 2 ? 3 : -2), HEAD_Y + 18 + (k % 3) * 5);
  }
  const head = Skia.Path.Make();
  head.addRRect(Skia.RRectXY(Skia.XYWHRect(-R - 6, HEAD_Y - 6, 2 * R + 12, 14), 6, 6));
  // The foot's open lower edge, seen edge-on (a dark lip).
  const lip = Skia.Path.Make();
  lip.addRRect(Skia.RRectXY(Skia.XYWHRect(-R_FOOT, -8, 2 * R_FOOT, 8), 3, 3));
  return { body, bands, rings, laces, weave, fur, head, lip };
}
let SIDE: ReturnType<typeof buildSide> | null = null;

function Blocks({ view }: { view: ViewId }) {
  const p = useMemo(() => {
    const s = Skia.Path.Make();
    for (const b of BLOCKS) {
      if (b.kind !== 'box') continue;
      if (view === 'side') {
        if ((b.min.z + b.max.z) / 2 < 0) continue;
        s.addRRect(Skia.RRectXY(Skia.XYWHRect(b.min.x, b.min.y, b.max.x - b.min.x, b.max.y - b.min.y), 6, 6));
      } else s.addRRect(Skia.RRectXY(Skia.XYWHRect(b.min.x, b.min.z, b.max.x - b.min.x, b.max.z - b.min.z), 6, 6));
    }
    return s;
  }, [view]);
  return (
    <>
      <Path path={p}>
        <LinearGradient start={vec(-160, 0)} end={vec(160, SUPPORT)} colors={['#7d8fb3', '#4b5a7a', '#2c3549']} />
      </Path>
      <Path path={p} style="stroke" strokeWidth={1.4} color={INK} />
    </>
  );
}

export function DjembeArt({ view, variant }: { view: ViewId; variant: VariantId }) {
  const raised = variant === 'raised';
  const floorY = raised ? SUPPORT : 0;
  if (view === 'side') {
    const g = (SIDE ??= buildSide());
    return (
      <Group>
        <FloorSide y={floorY} u0={DJ_MODEL.views.side!.u0} u1={DJ_MODEL.views.side!.u1} />
        <ContactShadow cx={0} cy={floorY + 2} rx={R_FOOT + 60} ry={9} />
        {raised ? <Blocks view="side" /> : null}
        <Group transform={[{ translateX: 10 }, { translateY: 12 }]}>
          <Path path={g.body} color="#000" opacity={0.35}>
            <BlurMask blur={10} style="normal" />
          </Path>
        </Group>
        <Path path={g.body}>
          <LinearGradient start={vec(-R - 4, 0)} end={vec(R + 4, 0)} colors={CARVED} />
        </Path>
        <Path path={g.body}>
          <LinearGradient start={vec(0, HEAD_Y)} end={vec(0, 0)} colors={['rgba(255,220,170,0.12)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.35)']} />
        </Path>
        <Path path={g.bands} style="stroke" strokeWidth={2.2} color="#140904" opacity={0.8} />
        <Path path={g.body} style="stroke" strokeWidth={1.4} color={INK} />
        {/* rope tuning: the rings and the lacing (pattern: drawing default) */}
        <Path path={g.lip} color="#120a05" />
        <Path path={g.laces} style="stroke" strokeWidth={4.2} color="#2a2420" />
        <Path path={g.laces} style="stroke" strokeWidth={2.6} color={ROPE} />
        <Path path={g.weave} style="stroke" strokeWidth={4} color="#2a2420" />
        <Path path={g.weave} style="stroke" strokeWidth={2.4} color="#f4eedf" />
        <Path path={g.rings}>
          <LinearGradient start={vec(0, TOP_RING_Y - 5)} end={vec(0, TOP_RING_Y + 5)} colors={['#3a3d45', '#9aa0ab', '#1d1e23']} />
        </Path>
        {/* the goat head, edge-on, with its fur edge */}
        <Path path={g.head}>
          <LinearGradient start={vec(-R, 0)} end={vec(R, 0)} colors={GOAT} />
        </Path>
        <Path path={g.fur} style="stroke" strokeWidth={2} color="#5a4a36" opacity={0.85} />
        <Path path={g.head} style="stroke" strokeWidth={1} color="#6e5a40" />
      </Group>
    );
  }
  return (
    <Group>
      {raised ? <Blocks view="top" /> : null}
      <HeadTop d={DJEMBE} look="goat" lugs={0} seed={23} rimColors={['#f0e6cf', '#b9a780', '#6b5a3a', '#2a2014']} rimWidth={16} />
      <Path path={(() => { const p = Skia.Path.Make(); for (let k = 0; k < VERTS; k++) { const a = (k / VERTS) * 2 * Math.PI; p.moveTo(Math.cos(a) * (R + 2), Math.sin(a) * (R + 2)); p.lineTo(Math.cos(a + 0.12) * (R + 16), Math.sin(a + 0.12) * (R + 16)); } return p; })()} style="stroke" strokeWidth={3} color={ROPE} opacity={0.9} />
    </Group>
  );
}

export function djembeLabels(view: ViewId, variant: VariantId): ArtLabel[] {
  if (view === 'side') {
    const out: ArtLabel[] = [
      { id: 'head', text: 'SKIN HEAD', short: 'HEAD', u: R + 30, v: HEAD_Y - 24, align: 'left' },
      { id: 'ropes', text: 'ROPE TUNING', short: 'ROPES', u: profileR(LOW_RING_Y) + 30, v: (TOP_RING_Y + LOW_RING_Y) / 2, align: 'left', tone: 'muted' },
      { id: 'waist', text: 'WAIST', u: R_FOOT + 30, v: WAIST_Y, align: 'left', tone: 'muted' },
      { id: 'open', text: 'OPEN FOOT', short: 'OPENING', u: R_FOOT + 30, v: -24, align: 'left', tone: 'muted' },
      { id: 'player', text: '← PLAYER', u: DJ_MODEL.views.side!.u0 + 20, v: HEAD_Y - 24, align: 'left', tone: 'muted', point: { u: DJ_MODEL.views.side!.u0 - 400, v: HEAD_Y - 24 } },
    ];
    if (variant === 'raised') out.push({ id: 'blocks', text: 'FOAM BLOCKS', short: 'FOAM', u: -R_FOOT - 40, v: SUPPORT - 30, align: 'right', tone: 'muted' });
    return out;
  }
  return [
    { id: 'head', text: 'DJEMBE', u: 0, v: R + 46, align: 'center' },
    { id: 'player', text: '← PLAYER', u: DJ_MODEL.views.top!.u0 + 20, v: 0, align: 'left', tone: 'muted', point: { u: DJ_MODEL.views.top!.u0 - 400, v: 0 } },
    { id: 'aud', text: 'AUDIENCE →', u: DJ_MODEL.views.top!.u1 - 20, v: DJ_MODEL.views.top!.v1 - 36, align: 'right', tone: 'muted' },
  ];
}

export function djembeHitTest(view: ViewId, variant: VariantId, u: number, v: number, tol: number): string | null {
  if (view === 'top') {
    if (planDist({ x: u, y: 0, z: v }, 0, 0) <= R - 4 + tol) return 'djembe.head';
    if (planDist({ x: u, y: 0, z: v }, 0, 0) <= R + 22 + tol) return 'djembe.ropes';
    if (variant === 'raised' && planDist({ x: u, y: 0, z: v }, 0, 0) <= 200 + tol) return 'djembe.block1';
    return null;
  }
  if (v >= HEAD_Y - 12 - tol && v <= HEAD_Y + 12 && Math.abs(u) <= R + 8 + tol) return 'djembe.head';
  if (v > HEAD_Y + 12 && v <= LOW_RING_Y + 8 && Math.abs(u) <= profileR(v) + 10 + tol) return 'djembe.ropes';
  if (v > LOW_RING_Y + 8 && v <= WAIST_Y && Math.abs(u) <= profileR(v) + tol) return 'djembe.bowl';
  if (v > WAIST_Y && v <= 0 + tol && Math.abs(u) <= profileR(v) + tol) return 'djembe.foot';
  if (variant === 'raised' && v > 0 && v <= SUPPORT && Math.abs(u) <= 170 + tol) return 'djembe.block1';
  return null;
}

