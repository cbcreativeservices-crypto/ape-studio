/**
 * M08 HEADED TAMBOURINE — the look (charter §2 layer 3), drawn ONLY from the
 * poses in model.ts, in millimetres of the view's (u, v): side u = x, v = y;
 * top u = x, v = z.
 *
 *   SIDE  the head's plane contains z, so from the side the instrument is
 *         seen EDGE-ON: the frame's wooden band (lit, ply edge), the head as
 *         a cream film on its front face, and the near half's jingle slots —
 *         two staggered rows, each slot holding a pair of thin discs on a pin
 *         (seen edge-on, foreshortened by where the slot sits round the ring).
 *   TOP   the head from above (an ellipse at the 45° hold, a circle mounted),
 *         the frame's ring with its depth, and the jingle pairs round it. The
 *         SHAKEN state shows the frame's side-to-side sweep as two ghosts.
 *
 * Counts and sizes no source gives are drawing defaults (8 slots per row,
 * Ø 50 mm discs, a 55 mm frame). Nothing moves (D8); paths built once.
 */
import { BlurMask, Group, LinearGradient, Path, RadialGradient, vec } from '@shopify/react-native-skia';
import type { VariantId, ViewId } from '../../engine/model/types.ts';
import type { ArtLabel } from '../../engine/scene/sceneTypes.ts';
import { CHROME, INK, make, oval, rect, rrect, seg, type SkPath } from '../shared/concert/paths.ts';
import { JINGLE_OUT, poseOf, R, TAMB_DIMS, type Pose } from './model.ts';

const DEPTH = TAMB_DIMS.depth.mm;
const SLOTS = TAMB_DIMS.slots.mm;
const JD = TAMB_DIMS.jingleD.mm;
const WOOD = ['#c48f52', '#9c6631', '#6e4318', '#4a2a12'];
const SKIN = ['#f6ecd2', '#e2cfa3', '#c6ad7c'];
const JINGLE = ['#ffffff', '#d9dde5', '#9aa0ab', '#5d616c'];

/** Slot angles round the ring: two rows, the second staggered by half a slot. */
export function slotAngles(row: 0 | 1): number[] {
  return Array.from({ length: SLOTS }, (_, k) => ((k + (row === 1 ? 0.5 : 0)) / SLOTS) * 2 * Math.PI);
}

/* ── the edge-on frame, in its LOCAL frame: u along e1 (−R … R), w into the
 *  frame (0 = the head face … DEPTH = the open back) ── */
type Edge = { band: SkPath; slots: SkPath; discs: SkPath; pins: SkPath; head: SkPath; sheen: SkPath };
let edgeCache: Edge | null = null;
function edge(): Edge {
  if (edgeCache) return edgeCache;
  const band = rrect(make(), -R, 0, R, DEPTH, 4);
  const slots = make();
  const discs = make();
  const pins = make();
  for (const row of [0, 1] as const) {
    const w = DEPTH * (row === 0 ? 0.36 : 0.68);
    for (const a of slotAngles(row)) {
      const s = Math.sin(a);
      if (s <= 0.12) continue; // the near half only
      const u = R * Math.cos(a);
      const half = (JD / 2) * s + 4;
      rrect(slots, u - half - 3, w - 8, u + half + 3, w + 8, 3);
      // a PAIR of discs, edge-on: two thin bars with a hair between them
      rrect(discs, u - half, w - 4.2, u + half, w - 1.2, 1.2);
      rrect(discs, u - half, w + 1.2, u + half, w + 4.2, 1.2);
      seg(pins, u, w - 9, u, w + 9);
    }
  }
  const head = rect(make(), -R - 1, -4, R + 1, 3);
  const sheen = seg(make(), -R * 0.9, -1.2, R * 0.5, -1.2);
  edgeCache = { band, slots, discs, pins, head, sheen };
  return edgeCache;
}

function sideAngle(p: Pose): number {
  return Math.atan2(p.e1.y, p.e1.x);
}

function EdgeOn({ p, opacity = 1, discs = true }: { p: Pose; opacity?: number; discs?: boolean }) {
  const g = edge();
  return (
    <Group opacity={opacity} transform={[{ translateX: p.c.x }, { translateY: p.c.y }, { rotate: sideAngle(p) }]}>
      <Path path={g.band}>
        <LinearGradient start={vec(0, 0)} end={vec(0, DEPTH)} colors={WOOD} />
      </Path>
      <Path path={g.slots} color="#1a0f07" />
      <Path path={g.pins} style="stroke" strokeWidth={1.6} color="#3a3d45" />
      {discs ? (
        <>
          <Path path={g.discs}>
            <LinearGradient start={vec(-R, 0)} end={vec(R, 0)} colors={JINGLE} />
          </Path>
          <Path path={g.discs} style="stroke" strokeWidth={0.5} color={INK} opacity={0.7} />
        </>
      ) : null}
      <Path path={g.band} style="stroke" strokeWidth={1.1} color="#3a2210" />
      <Path path={g.head}>
        <LinearGradient start={vec(-R, 0)} end={vec(R, 0)} colors={SKIN} />
      </Path>
      <Path path={g.head} style="stroke" strokeWidth={0.8} color="#5a4a30" />
      <Path path={g.sheen} style="stroke" strokeWidth={1} color="#ffffff" opacity={0.6} />
    </Group>
  );
}

/* ── from above ── */
type Top = { shadow: SkPath; back: SkPath; ring: SkPath; head: SkPath; discs: SkPath; inner: SkPath };
const topCache = new Map<number, Top>();
function top(kx: number, backX: number): Top {
  const key = Math.round(kx * 1000) * 1000 + Math.round(backX);
  let t = topCache.get(key);
  if (t) return t;
  const shadow = oval(make(), 14, 20, (R + 14) * kx, R + 14);
  const back = oval(make(), backX, 0, (R + JINGLE_OUT) * kx, R + JINGLE_OUT);
  const ring = oval(make(), 0, 0, (R + JINGLE_OUT) * kx, R + JINGLE_OUT);
  const head = oval(make(), 0, 0, (R - 2) * kx, R - 2);
  const inner = oval(make(), 0, 0, (R - 18) * kx, R - 18);
  const discs = make();
  for (const row of [0, 1] as const) {
    for (const a of slotAngles(row)) oval(discs, R * Math.cos(a) * kx + (row ? backX * 0.6 : backX * 0.3), (R + 4) * Math.sin(a), (JD / 2) * Math.max(0.3, kx * Math.abs(Math.sin(a)) + 0.2), (JD / 2) * Math.max(0.3, Math.abs(Math.cos(a))));
  }
  t = { shadow, back, ring, head, discs, inner };
  topCache.set(key, t);
  return t;
}

function FromAbove({ p, opacity = 1 }: { p: Pose; opacity?: number }) {
  const kx = Math.abs(p.e1.x);
  const backX = -p.n.x * DEPTH;
  const t = top(kx, backX);
  return (
    <Group opacity={opacity} transform={[{ translateX: p.c.x }, { translateY: p.c.z }]}>
      <Path path={t.shadow} color="#000" opacity={0.5}>
        <BlurMask blur={14} style="normal" />
      </Path>
      <Path path={t.back}>
        <LinearGradient start={vec(-R, -R)} end={vec(R, R)} colors={['#8a5426', '#5c3417', '#2f1b0a']} />
      </Path>
      <Path path={t.ring}>
        <LinearGradient start={vec(-R, -R)} end={vec(R, R)} colors={WOOD} />
      </Path>
      <Path path={t.discs}>
        <RadialGradient c={vec(-R * 0.5, -R * 0.5)} r={R * 2.2} colors={JINGLE} />
      </Path>
      <Path path={t.discs} style="stroke" strokeWidth={0.6} color={INK} opacity={0.6} />
      <Path path={t.head}>
        <RadialGradient c={vec(-R * 0.35 * kx, -R * 0.4)} r={R * 1.6} colors={SKIN} />
      </Path>
      <Path path={t.inner} style="stroke" strokeWidth={1.5} color="#a99f88" opacity={0.45} />
    </Group>
  );
}

/** The mount (mounted state): a stand tube under the frame's player-side
 *  edge and a clamp arm (drawing defaults). */
let mountCache: { tube: SkPath; arm: SkPath } | null = null;
function MountSide({ p }: { p: Pose }) {
  const x = p.c.x - R - 30;
  const { tube, arm } = (mountCache ??= { tube: seg(make(), x, p.c.y + 30, x, -40), arm: rrect(make(), x - 10, p.c.y + DEPTH * 0.3, p.c.x - R + 16, p.c.y + DEPTH * 0.7, 4) });
  return (
    <>
      <Path path={tube} style="stroke" strokeWidth={24} strokeCap="round" color="#2a2c32" />
      <Path path={tube} style="stroke" strokeWidth={16} strokeCap="round" color="#9aa0ab" />
      <Path path={arm}>
        <LinearGradient start={vec(x, 0)} end={vec(p.c.x - R, 0)} colors={CHROME} />
      </Path>
    </>
  );
}

export function TambourineArt({ view, variant }: { view: ViewId; variant: VariantId }) {
  const p = poseOf(variant);
  if (view === 'top') {
    const ghosts = variant === 'shaken' ? [-TAMB_DIMS.shake.mm, TAMB_DIMS.shake.mm] : [];
    return (
      <Group>
        {ghosts.map((dz) => (
          <FromAbove key={dz} p={{ ...p, c: { ...p.c, z: p.c.z + dz } }} opacity={0.22} />
        ))}
        {variant === 'mounted' ? <Path path={oval(make(), p.c.x - R - 30, 0, 20, 20)} color="#9aa0ab" /> : null}
        <FromAbove p={p} />
      </Group>
    );
  }
  return (
    <Group>
      {variant === 'mounted' ? <MountSide p={p} /> : null}
      <EdgeOn p={p} />
    </Group>
  );
}

export function tambourineLabels(view: ViewId, variant: VariantId): ArtLabel[] {
  const p = poseOf(variant);
  const mounted = variant === 'mounted';
  if (view === 'top') {
    const out: ArtLabel[] = [
      { id: 'head', text: 'HEAD', u: p.c.x, v: -24, align: 'center' },
      { id: 'jingles', text: 'JINGLE PAIRS', short: 'JINGLES', u: p.c.x + 40, v: R + 60, align: 'center' },
      { id: 'player', text: '← PLAYER', u: -330, v: -380, align: 'center', tone: 'muted', point: { u: -6000, v: -380 } },
    ];
    if (variant === 'shaken') out.push({ id: 'shake', text: '↕ SHAKE', u: p.c.x - 170, v: -R - 150, align: 'center', tone: 'illustrative' });
    return out;
  }
  const out: ArtLabel[] = [
    { id: 'head', text: 'HEAD (FRONT FACE)', short: 'HEAD', u: p.c.x + p.n.x * 70 - 20, v: p.c.y + p.n.y * 70 - 20, align: 'right' },
    { id: 'jingles', text: 'JINGLE PAIRS', short: 'JINGLES', u: p.c.x + p.e1.x * (R + 40) + 30, v: p.c.y + p.e1.y * (R + 40) + 10, align: 'left' },
    { id: 'player', text: '← PLAYER', u: -330, v: -1420, align: 'center', tone: 'muted', point: { u: -6000, v: -1420 } },
  ];
  if (mounted) out.push({ id: 'mount', text: 'MOUNT', u: p.c.x - R - 60, v: -800, align: 'right', tone: 'illustrative' });
  else out.push({ id: 'hold', text: 'HELD AT 45°', u: p.c.x - 60, v: p.c.y + 170, align: 'right', tone: 'muted' });
  return out;
}

export function tambourineHitTest(view: ViewId, variant: VariantId, u: number, v: number, tol: number): string | null {
  const p = poseOf(variant);
  const sfx = variant === 'mounted' ? 'M' : '';
  if (view === 'top') {
    const kx = Math.abs(p.e1.x);
    const dx = (u - p.c.x) / Math.max(0.2, kx);
    const r = Math.hypot(dx, v - p.c.z);
    if (r <= R - 6) return `tb.head${sfx}`;
    if (r <= R + JINGLE_OUT + tol) return `tb.jingles${sfx}`;
    if (variant === 'mounted' && Math.hypot(u - (p.c.x - R - 30), v) <= 24 + tol) return 'tb.mount';
    return null;
  }
  const dx = u - p.c.x;
  const dy = v - p.c.y;
  const a = sideAngle(p);
  const lu = dx * Math.cos(a) + dy * Math.sin(a);
  const lw = -dx * Math.sin(a) + dy * Math.cos(a);
  if (Math.abs(lu) <= R + tol && lw >= -6 - tol && lw <= 6) return `tb.head${sfx}`;
  if (Math.abs(lu) <= R + JINGLE_OUT + tol && lw > 6 && lw <= DEPTH + tol) return Math.abs(lw - DEPTH * 0.36) < 10 || Math.abs(lw - DEPTH * 0.68) < 10 ? `tb.jingles${sfx}` : `tb.frame${sfx}`;
  if (variant === 'mounted' && Math.abs(u - (p.c.x - R - 30)) <= 20 + tol && v > p.c.y) return 'tb.mount';
  return null;
}

/** The instrument edge-on and LEVEL (head on top), at the origin: HOW IT
 *  SOUNDS draws it in this canonical pose. */
const LEVEL: Pose = { c: { x: 0, y: 0, z: 0 }, n: { x: 0, y: -1, z: 0 }, e1: { x: 1, y: 0, z: 0 }, e2: { x: 0, y: 0, z: 1 } };
export function TambourineEdge({ discs = true }: { discs?: boolean }) {
  return <EdgeOn p={LEVEL} discs={discs} />;
}
