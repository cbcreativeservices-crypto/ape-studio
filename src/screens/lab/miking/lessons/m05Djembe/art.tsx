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
import { DJEMBE, HEAD_Y, PROFILE, R, R_FOOT, SUPPORT, WAIST_Y } from './model.ts';
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

const TOP_RING_Y = HEAD_Y + 26;
const LOW_RING_Y = HEAD_Y + 235;
const VERTS = 26;

function buildSide() {
  const N = 60;
  const ys = Array.from({ length: N + 1 }, (_, i) => HEAD_Y + 4 + ((0 - HEAD_Y - 4) * i) / N);
  const body: SkPath = Skia.Path.Make();
  ys.forEach((y, i) => (i === 0 ? body.moveTo(-profileR(y), y) : body.lineTo(-profileR(y), y)));
  for (let i = ys.length - 1; i >= 0; i--) body.lineTo(profileR(ys[i]), ys[i]);
  body.close();
  // Carving bands where the bowl meets the waist and at the foot's lip.
  const bands: SkPath = Skia.Path.Make();
  for (const y of [WAIST_Y - 8, WAIST_Y + 8, -14]) {
    bands.moveTo(-profileR(y) + 2, y);
    bands.lineTo(profileR(y) - 2, y);
  }
  // The rope rings (seen edge-on) and the lacing on the near half.
  const rings: SkPath = Skia.Path.Make();
  for (const y of [TOP_RING_Y, LOW_RING_Y]) {
    const r = profileR(y) + 5;
    rings.addRRect(Skia.RRectXY(Skia.XYWHRect(-r, y - 5, 2 * r, 10), 5, 5));
  }
  const laces: SkPath = Skia.Path.Make();
  for (let k = 0; k < VERTS; k++) {
    const a = (k / VERTS) * 2 * Math.PI;
    const b = ((k + 0.5) / VERTS) * 2 * Math.PI;
    if (Math.sin(a) <= 0.05 && Math.sin(b) <= 0.05) continue;
    const rt = profileR(TOP_RING_Y) + 6;
    const rb = profileR(LOW_RING_Y) + 6;
    laces.moveTo(Math.cos(a) * rt, TOP_RING_Y);
    laces.lineTo(Math.cos(b) * rb, LOW_RING_Y);
    laces.lineTo(Math.cos(a + (2 * Math.PI) / VERTS) * rt, TOP_RING_Y);
  }
  // The skin's fur edge, hanging over the top ring.
  const fur: SkPath = Skia.Path.Make();
  for (let k = 0; k <= 34; k++) {
    const x = -R - 4 + ((2 * R + 8) * k) / 34;
    fur.moveTo(x, HEAD_Y + 2);
    fur.lineTo(x + (k % 2 ? 3 : -2), HEAD_Y + 16 + (k % 3) * 4);
  }
  const head = Skia.Path.Make();
  head.addRRect(Skia.RRectXY(Skia.XYWHRect(-R - 6, HEAD_Y - 6, 2 * R + 12, 12), 6, 6));
  return { body, bands, rings, laces, fur, head };
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
          <LinearGradient start={vec(-R, 0)} end={vec(R, 0)} colors={CARVED} />
        </Path>
        <Path path={g.body}>
          <LinearGradient start={vec(0, HEAD_Y)} end={vec(0, 0)} colors={['rgba(255,220,170,0.12)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.35)']} />
        </Path>
        <Path path={g.bands} style="stroke" strokeWidth={2.2} color="#140904" opacity={0.8} />
        <Path path={g.body} style="stroke" strokeWidth={1.4} color={INK} />
        {/* rope tuning: the rings and the lacing (pattern: drawing default) */}
        <Path path={g.laces} style="stroke" strokeWidth={4.2} color="#2a2420" />
        <Path path={g.laces} style="stroke" strokeWidth={2.6} color={ROPE} />
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
      { id: 'player', text: '← PLAYER', u: -450, v: HEAD_Y - 24, align: 'center', tone: 'muted' },
    ];
    if (variant === 'raised') out.push({ id: 'blocks', text: 'FOAM BLOCKS', short: 'FOAM', u: -R_FOOT - 40, v: SUPPORT - 30, align: 'right', tone: 'muted' });
    return out;
  }
  return [
    { id: 'head', text: 'DJEMBE', u: 0, v: R + 46, align: 'center' },
    { id: 'player', text: '← PLAYER', u: -440, v: 0, align: 'center', tone: 'muted' },
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

