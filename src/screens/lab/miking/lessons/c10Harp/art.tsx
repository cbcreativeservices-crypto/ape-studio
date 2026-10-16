/**
 * C10 HARP — the look (charter §2 layer 3), drawn from harpSpec.ts in
 * millimetres of the view's (u, v): side u = x, v = y (the harp in profile,
 * the string plane facing you); top u = x, v = z (from above).
 *
 *   SIDE  the base and its pedals (the pedal harp), the soundbox leaning back
 *         with its spruce soundboard face and the sound holes along its back
 *         (seen edge-on, marked), the strings standing between the board and
 *         the curved neck, the pillar and its crown; the lever harp drawn
 *         smaller, with levers along the neck; the harpist on a chair at the
 *         left, the soundbox at their right shoulder (ILLUSTRATIVE) — ONE
 *         seated body in 3-D (harpistPose.ts): the right arm and hand in
 *         front of the strings, the left behind them, both hands the shared
 *         hand model with their pads on real strings; the near knee and foot
 *         in front of the soundbox and the pedals (art fix 2026-10-16).
 *   TOP   the base, the tapering soundbox, the neck and the strings edge-on,
 *         the pillar and crown; the harpist from above (the hands over the
 *         soundbox, under the neck).
 * Light from the upper left; nothing moves (D8); paths built once.
 */
import { BlurMask, Group, LinearGradient, Path, PathOp, RadialGradient, Skia, vec } from '@shopify/react-native-skia';
import type { VariantId, ViewId } from '../../engine/model/types.ts';
import type { ArtLabel, LessonArt } from '../../engine/scene/sceneTypes.ts';
import { harpGeom, harpistAt, type HarpGeom, type Pt } from './harpSpec.ts';
import { FIGURE_TONES, figureCovers, figureParts, PlayerBehind, PlayerInFront } from '../shared/players/PlayerFigure';
import { h3, handOn, type HandView, type V3 } from '../shared/players/handModel.ts';
import type { SharedValue } from 'react-native-reanimated';
import { harpElbow, harpHandPlan, harpHands, harpistBody, type HarpHand } from './harpistPose.ts';
import { pt, type PlayerPose } from '../shared/players/playerPose.ts';

type SkPath = ReturnType<typeof Skia.Path.Make>;
const make = () => Skia.Path.Make();
const MAPLE = ['#e3c48a', '#b8894a', '#7c5426'];
const SPRUCE = ['#f2dcae', '#dcbd82', '#b7955a'];
const GILT = ['#f6dd95', '#c9a24a', '#7c5a18'];

const isLever = (v: VariantId) => v === 'lever';

function poly(pts: readonly Pt[], close = true): SkPath {
  const p = make();
  pts.forEach(([x, y], i) => (i === 0 ? p.moveTo(x, y) : p.lineTo(x, y)));
  if (close) p.close();
  return p;
}
export function smooth(pts: readonly Pt[]): SkPath {
  const p = make();
  p.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i][0] + pts[i + 1][0]) / 2;
    const my = (pts[i][1] + pts[i + 1][1]) / 2;
    p.quadTo(pts[i][0], pts[i][1], mx, my);
  }
  const l = pts[pts.length - 1];
  p.lineTo(l[0], l[1]);
  return p;
}

type SidePaths = Record<string, SkPath>;
const sideCache = new Map<string, SidePaths>();
function sidePaths(g: HarpGeom, key: string): SidePaths {
  const hit = sideCache.get(key);
  if (hit) return hit;
  const o: SidePaths = {};
  const k = g.scale;
  o.shadow = make();
  o.shadow.addOval(Skia.XYWHRect(g.base.x0 - 80 * k, -26 * k, g.base.x1 - g.base.x0 + 160 * k, 52 * k));
  // Base (a plinth on feet); pedals stick out toward the player.
  o.base = make();
  o.base.addRRect(Skia.RRectXY(Skia.XYWHRect(g.base.x0, g.base.y0, g.base.x1 - g.base.x0, -g.base.y0 - 20 * k), 18 * k, 18 * k));
  o.feet = make();
  for (const x of [g.base.x0 + 40 * k, g.base.x1 - 60 * k]) o.feet.addRRect(Skia.RRectXY(Skia.XYWHRect(x, -22 * k, 50 * k, 22 * k), 6 * k, 6 * k));
  o.pedals = make();
  if (g.pedals) {
    for (let i = 0; i < 4; i++) {
      const y = -46 * k - i * 3;
      o.pedals.addRRect(Skia.RRectXY(Skia.XYWHRect(g.base.x0 - 110 * k + i * 26 * k, y, 120 * k, 12 * k), 5 * k, 5 * k));
    }
  }
  // Soundbox: board face (front) and back, bottom to top.
  const F = [0, 0.25, 0.5, 0.75, 1];
  const front = F.map((f) => g.boardAt(f));
  const back = F.map((f) => g.backAt(f));
  o.box = poly([...front, ...[...back].reverse()]);
  o.board = make();
  // The board's face, a spruce strip a few centimetres deep.
  const inner = F.map((f) => {
    const p = g.boardAt(f);
    return [p[0] - g.n[0] * 26 * k, p[1] - g.n[1] * 26 * k] as Pt;
  });
  o.board = poly([...front, ...[...inner].reverse()]);
  o.ribs = make();
  for (let f = 0.08; f < 1; f += 0.12) {
    const a = g.boardAt(f);
    const b = g.backAt(f);
    o.ribs.moveTo(a[0] - g.n[0] * 30 * k, a[1] - g.n[1] * 30 * k);
    o.ribs.lineTo(b[0] + g.n[0] * 10 * k, b[1] + g.n[1] * 10 * k);
  }
  o.holes = make();
  for (const h of g.holes) o.holes.addRRect(Skia.RRectXY(Skia.XYWHRect(h.c[0] - 14 * k, h.c[1] - h.l / 2, 28 * k, h.l), 12 * k, 12 * k));
  // Strings and the centre strip where they meet the board.
  o.strings = make();
  for (const s of g.strings) {
    o.strings.moveTo(s.x, s.y0);
    o.strings.lineTo(s.x, s.y1);
  }
  o.eyelets = make();
  for (const s of g.strings) o.eyelets.addCircle(s.x, s.y0, 4.5 * k);
  // Neck: a thick curved band from the crown back to the soundbox top.
  const lower = g.neck;
  const upper = lower.map(([x, y], i) => [x, y - (i === 0 ? 70 : 64) * k] as Pt);
  o.neckPoly = poly([...lower, ...[...upper].reverse()]);
  o.pins = make();
  for (const s of g.strings) o.pins.addCircle(s.x, s.y1 - 22 * k, 5 * k);
  o.levers = make();
  if (!g.pedals) for (const s of g.strings) o.levers.addRRect(Skia.RRectXY(Skia.XYWHRect(s.x - 4 * k, s.y1 - 2, 18 * k, 10 * k), 3, 3));
  // Pillar (a fluted column) and crown.
  const pa = g.pillar.a;
  const pb = g.pillar.b;
  const r = g.pillar.r;
  o.pillar = poly([
    [pa[0] - r, pa[1]],
    [pa[0] + r, pa[1]],
    [pb[0] + r * 0.8, pb[1]],
    [pb[0] - r * 0.8, pb[1]],
  ]);
  o.flutes = make();
  for (const d of [-0.4, 0, 0.4]) {
    o.flutes.moveTo(pa[0] + d * r, pa[1] - 40 * k);
    o.flutes.lineTo(pb[0] + d * r * 0.8, pb[1] + 40 * k);
  }
  o.crown = make();
  o.crown.addRRect(Skia.RRectXY(Skia.XYWHRect(g.crown.c[0] - g.crown.r, g.crown.top, g.crown.r * 2, -g.crown.top + g.crown.c[1] + 40 * k), 24 * k, 24 * k));
  o.crownBand = make();
  for (const y of [g.crown.top + 30 * k, g.crown.c[1]]) {
    o.crownBand.moveTo(g.crown.c[0] - g.crown.r, y);
    o.crownBand.lineTo(g.crown.c[0] + g.crown.r, y);
  }
  sideCache.set(key, o);
  return o;
}

/** The harpist's chair from the side (ILLUSTRATIVE, muted). */
function harpistSide(lever = false): SidePaths {
  const key = lever ? 'harpistL' : 'harpist';
  const hit = sideCache.get(key);
  if (hit) return hit;
  const h = harpistAt(lever);
  const o: SidePaths = {};
  const s = h.seat;
  o.seat = make();
  o.seat.addRRect(Skia.RRectXY(Skia.XYWHRect(s.x0, s.y - 50, s.x1 - s.x0, 50), 14, 14));
  o.legs = make();
  for (const x of [s.x0 + 30, s.x1 - 60]) o.legs.addRect(Skia.XYWHRect(x, s.y, 30, -s.y));
  o.back = make();
  o.back.addRRect(Skia.RRectXY(Skia.XYWHRect(s.x0 - 10, s.y - 450, 34, 450), 10, 10));
  // The harpist is the shared figure (harpistPose). The old blocky body and
  // its oval head + hair were dead code — removed in the head fix 2026-10-08.
  sideCache.set(key, o);
  return o;
}

/**
 * The harpist for the shared player (players/PlayerFigure), from ONE seated
 * body in 3-D (harpistPose.ts): the side view from the player's right
 * (u = x, v = y, +z toward the viewer), the top view from above. The hands
 * are the shared hand model posed bone by bone with their pads on real
 * strings (PlayerFigure.drawHand3) — the right hand on the near side of the
 * strings, the left on the far side, seen through them. ILLUSTRATIVE.
 */
const SIDE_HANDS: HandView = (p) => ({ u: p.x, v: p.y, d: p.z });
const harpistPoses = new Map<string, PlayerPose>();
export function harpistPose(view: 'side' | 'top', lever = false): PlayerPose {
  const key = `${view}:${lever ? 'l' : 'p'}`;
  const hit = harpistPoses.get(key);
  if (hit) return hit;
  const B = harpistBody(lever);
  const H = harpHands(lever);
  let pose: PlayerPose;
  if (view === 'side') {
    const P = (q: V3) => pt(q.x, q.y);
    const hand = (h: HarpHand) => {
      const w = h.sk.frame.o;
      const x = h.sk.frame.x;
      return { wrist: P(w), dir: Math.atan2(x.y, x.x), kind: 'rest' as const, posed: { sk: h.sk, view: SIDE_HANDS } };
    };
    pose = {
      view: 'side',
      posture: 'seated',
      facing: 1,
      head: { c: P(B.head.c), r: B.head.r },
      neck: P(B.neck),
      shoulderR: P(B.shoulderR),
      shoulderL: P(B.shoulderL),
      elbowR: P(H.R.elbow),
      elbowL: P(H.L.elbow),
      handR: hand(H.R),
      handL: hand(H.L),
      hipR: P(B.hipR),
      hipL: P(B.hipL),
      kneeR: P(B.kneeR),
      kneeL: P(B.kneeL),
      footR: P(B.footR),
      footL: P(B.footL),
      floor: 0,
    };
  } else {
    // From above the figure is authored chest toward +v round the neck and
    // turned to face +x (`facing` 0): world (x, z) is authored
    // (n.x − (z − n.z), n.z + (x − n.x)).
    const n = B.neck;
    const A = (q: V3) => pt(n.x - (q.z - n.z), n.z + (q.x - n.x));
    const TOP_HANDS: HandView = (q) => ({ ...A(q), d: -q.y });
    const hand = (h: HarpHand) => {
      const w = A(h.sk.frame.o);
      const tip = A(h3.add(h.sk.frame.o, h.sk.frame.x));
      return { wrist: w, dir: Math.atan2(tip.v - w.v, tip.u - w.u), kind: 'above' as const, posed: { sk: h.sk, view: TOP_HANDS } };
    };
    pose = {
      view: 'above',
      posture: 'seated',
      facing: 0,
      head: { c: A(B.head.c), r: B.head.r },
      neck: A(n),
      shoulderR: A(B.shoulderR),
      shoulderL: A(B.shoulderL),
      elbowR: A(H.R.elbow),
      elbowL: A(H.L.elbow),
      handR: hand(H.R),
      handL: hand(H.L),
      hipR: A(B.hipR),
      hipL: A(B.hipL),
      kneeR: A(B.kneeR),
      kneeL: A(B.kneeL),
      footR: A(B.footR),
      footL: A(B.footL),
      floor: null,
    };
  }
  harpistPoses.set(key, pose);
  return pose;
}

/**
 * The side pose with the RIGHT hand moved by `d` (mm, frame H) — its pads,
 * thumb and wrist together, the elbow re-solved from the shoulder (the
 * pluck sequence: the finger pulling its string aside, the hand off it).
 */
const movedPoses = new Map<string, PlayerPose>();
export function harpistSideMoved(lever: boolean, d: V3): PlayerPose {
  const key = `${lever ? 'l' : 'p'}:${d.x}:${d.y}:${d.z}`;
  const hit = movedPoses.get(key);
  if (hit) return hit;
  const base = harpistPose('side', lever);
  const { P, targets, pads } = harpHandPlan(lever, 'R');
  const mv = (q: V3) => h3.add(q, d);
  const frame = { ...P.frame, o: mv(P.frame.o) };
  const goals = pads.map((g) => ((g as V3).z !== undefined ? mv(g as V3) : g));
  const sk = handOn(frame, goals, mv(targets.thumb));
  const elbow = harpElbow(harpistBody(lever).shoulderR, sk.frame.o, P.pole);
  const pose: PlayerPose = {
    ...base,
    elbowR: pt(elbow.x, elbow.y),
    handR: { wrist: pt(sk.frame.o.x, sk.frame.o.y), dir: Math.atan2(sk.frame.x.y, sk.frame.x.x), kind: 'rest', posed: { sk, view: SIDE_HANDS } },
  };
  movedPoses.set(key, pose);
  return pose;
}

/** The chair from the side (behind the harpist). */
function ChairSide({ lever }: { lever: boolean }) {
  const o = harpistSide(lever);
  const h = harpistAt(lever);
  return (
    <Group>
      <Path path={o.back} color="#2a2b31" />
      <Path path={o.legs} color="#1a1b1f" />
      <Path path={o.seat}>
        <LinearGradient start={vec(h.seat.x0, h.seat.y - 50)} end={vec(h.seat.x1, h.seat.y)} colors={['#4a4c55', '#141418']} />
      </Path>
    </Group>
  );
}

/**
 * The near sleeve where it lies over the harp, as plain opaque cloth under
 * the figure's own sleeve: that sleeve grows out of the shirt through a
 * mask (PlayerFigure `emerge`) which, on the harp, let the soundbox's ribs
 * and holes show through the arm (art fix 2026-10-16) — the cloth under it
 * keeps the arm solid where it crosses the harp.
 */
const underCache = new WeakMap<PlayerPose, { path: SkPath; box: { x: number; y: number; width: number; height: number } } | null>();
const mixHex = (c: string, to: readonly number[], k: number) => {
  const n = parseInt(c.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((x, i) => Math.round(x * k + to[i] * 255 * (1 - k)));
  return `rgb(${ch[0]}, ${ch[1]}, ${ch[2]})`;
};
/** PlayerFigure's receding blend (its colours toward the stage's dark). */
const RECEDE_TO = [0.075, 0.078, 0.094] as const;
function NearSleeveUnder({ pose, dim = 1 }: { pose: PlayerPose; dim?: number }) {
  let u = underCache.get(pose);
  if (u === undefined) {
    const parts = figureParts(pose);
    const arm = parts.front.find((m) => m.tone === 'shirt');
    const shirt = parts.behind.find((m) => m.tone === 'shirt' && !m.far);
    const path = arm && shirt ? Skia.Path.MakeFromOp(arm.path, shirt.path, PathOp.Difference) : null;
    u = path && arm ? { path, box: arm.box ?? path.getBounds() } : null;
    underCache.set(pose, u);
  }
  if (!u) return null;
  const b = u.box;
  return (
    <Path path={u.path}>
      <LinearGradient start={vec(b.x, b.y)} end={vec(b.x + b.width, b.y + b.height)} colors={dim >= 1 ? [...FIGURE_TONES.shirt.ramp] : FIGURE_TONES.shirt.ramp.map((c) => mixHex(c, RECEDE_TO, Math.max(0, dim)))} positions={[0, 0.38, 0.72, 1]} />
    </Path>
  );
}

/** Where the harpist's NEAR leg and foot lie in front of the harp (the
 *  right knee beside the soundbox's foot, the right foot on its pedals):
 *  that leg is painted again there, over the harp. */
const nearLegClips = new Map<string, SkPath | null>();
function nearLegClip(lever: boolean): SkPath | null {
  const key = lever ? 'lever' : 'pedal';
  if (nearLegClips.has(key)) return nearLegClips.get(key) ?? null;
  const g = harpGeom(lever);
  const o = sidePaths(g, key);
  const parts = figureParts(harpistPose('side', lever));
  const leg = make();
  for (const m of parts.behind) if (m.tone === 'trousers' && !m.far) leg.addPath(m.path);
  for (const m of parts.shoes) if (!m.far) leg.addPath(m.path);
  // The harp's whole painted area there: the soundbox and its holes (they
  // sit across its back edge), the base, its feet and pedals, and their
  // outlines' width.
  let harp: SkPath = make();
  for (const q of [o.box, o.holes, o.base, o.pedals, o.feet]) harp = Skia.Path.MakeFromOp(harp, q, PathOp.Union) ?? harp;
  const edge = harp.copy().stroke({ width: 10 });
  if (edge) harp = Skia.Path.MakeFromOp(harp, edge, PathOp.Union) ?? harp;
  const clip = Skia.Path.MakeFromOp(leg, harp, PathOp.Intersect);
  nearLegClips.set(key, clip);
  return clip;
}

export function HarpSide({ variant, dim = 1, highlightString }: { variant: VariantId; dim?: number; highlightString?: number }) {
  const lever = isLever(variant);
  const g = harpGeom(lever);
  const o = sidePaths(g, lever ? 'lever' : 'pedal');
  const s = highlightString != null ? g.strings[highlightString] : null;
  return (
    <Group opacity={dim}>
      <Path path={o.shadow} color="#000" opacity={0.55}>
        <BlurMask blur={24} style="normal" />
      </Path>
      <Path path={o.box}>
        <LinearGradient start={vec(g.b1[0], g.b1[1])} end={vec(g.b0[0] + 200, g.b0[1])} colors={MAPLE} />
      </Path>
      <Path path={o.ribs} style="stroke" strokeWidth={5} color="#6a4a22" opacity={0.6} />
      <Path path={o.holes} color="#1a120a" />
      <Path path={o.holes} style="stroke" strokeWidth={3} color="#e3c48a" opacity={0.7} />
      <Path path={o.board}>
        <LinearGradient start={vec(g.b1[0], g.b1[1])} end={vec(g.b0[0], g.b0[1])} colors={SPRUCE} />
      </Path>
      <Path path={o.box} style="stroke" strokeWidth={4} color="#3a260f" opacity={0.8} />
      <Path path={o.base}>
        <LinearGradient start={vec(g.base.x0, g.base.y0)} end={vec(g.base.x1, 0)} colors={MAPLE} />
      </Path>
      <Path path={o.feet} color="#4a3016" />
      {g.pedals ? <Path path={o.pedals}><LinearGradient start={vec(0, -60)} end={vec(0, -30)} colors={GILT} /></Path> : null}
      <Path path={o.strings} style="stroke" strokeWidth={3} color="#e8e2d0" />
      <Path path={o.strings} style="stroke" strokeWidth={1.2} color="#ffffff" opacity={0.5} />
      {s ? <Path path={seg(s.x, s.y0, s.x, s.y1)} style="stroke" strokeWidth={8} color="#6fa8ff" /> : null}
      <Path path={o.eyelets} color="#5a3a14" />
      <Path path={o.neckPoly}>
        <LinearGradient start={vec(g.b1[0], g.crown.top)} end={vec(g.crown.c[0], g.b1[1])} colors={GILT} />
      </Path>
      <Path path={o.neckPoly} style="stroke" strokeWidth={3} color="#5c4313" opacity={0.7} />
      <Path path={o.pins} color="#2a2c32" />
      {!g.pedals ? <Path path={o.levers} color="#c8ccd4" /> : null}
      <Path path={o.pillar}>
        <LinearGradient start={vec(g.pillar.a[0] - g.pillar.r, 0)} end={vec(g.pillar.a[0] + g.pillar.r, 0)} colors={GILT} />
      </Path>
      <Path path={o.flutes} style="stroke" strokeWidth={3} color="#7c5a18" opacity={0.6} />
      <Path path={o.crown}>
        <LinearGradient start={vec(g.crown.c[0] - g.crown.r, g.crown.top)} end={vec(g.crown.c[0] + g.crown.r, g.crown.c[1])} colors={GILT} />
      </Path>
      <Path path={o.crownBand} style="stroke" strokeWidth={5} color="#7c5a18" opacity={0.7} />
    </Group>
  );
}

const segCache = new Map<string, SkPath>();
function seg(a: number, b: number, c: number, d: number): SkPath {
  const k = `${a}:${b}:${c}:${d}`;
  let p = segCache.get(k);
  if (!p) {
    p = make();
    p.moveTo(a, b);
    p.lineTo(c, d);
    segCache.set(k, p);
  }
  return p;
}

const topCache = new Map<string, SidePaths>();
function topPaths(g: HarpGeom, key: string): SidePaths {
  const hit = topCache.get(key);
  if (hit) return hit;
  const o: SidePaths = {};
  const k = g.scale;
  o.base = make();
  o.base.addRRect(Skia.RRectXY(Skia.XYWHRect(g.base.x0, -g.base.hw, g.base.x1 - g.base.x0, g.base.hw * 2), 40 * k, 40 * k));
  o.pedals = make();
  if (g.pedals) {
    for (let i = 0; i < 7; i++) {
      const side = i < 3 ? -1 : 1;
      const j = i < 3 ? i : i - 3;
      const z = side * (g.base.hw - 20 * k - j * 40 * k);
      o.pedals.addRRect(Skia.RRectXY(Skia.XYWHRect(g.base.x0 - 110 * k, z - 9, 130 * k, 18), 6, 6));
    }
  }
  // The soundbox from above: tapering from its foot to its top.
  const F = [0, 0.25, 0.5, 0.75, 1];
  // From above the soundbox covers, at every height, the span from its back
  // to its board face across its width: the union is this outline.
  const w0 = g.widthAt(0) / 2;
  const w1 = g.widthAt(1) / 2;
  o.box = poly([
    [g.boardAt(0)[0], -w0],
    [g.boardAt(0)[0], w0],
    [g.backAt(0)[0], w0],
    [g.backAt(1)[0], w1],
    [g.backAt(1)[0], -w1],
    [g.backAt(0)[0], -w0],
  ]);
  void F;
  o.strip = make();
  o.strip.addRRect(Skia.RRectXY(Skia.XYWHRect(g.b1[0], -16 * k, g.b0[0] - g.b1[0], 32 * k), 10 * k, 10 * k));
  o.strings = make();
  o.strings.moveTo(g.strings[g.strings.length - 1].x, 0);
  o.strings.lineTo(g.strings[0].x, 0);
  o.neck = make();
  o.neck.addRRect(Skia.RRectXY(Skia.XYWHRect(g.b1[0] - 30 * k, -34 * k, g.crown.c[0] - g.b1[0] + 30 * k, 68 * k), 30 * k, 30 * k));
  o.pins = make();
  for (const s of g.strings) o.pins.addCircle(s.x, -22 * k, 5 * k);
  o.crown = make();
  o.crown.addCircle(g.crown.c[0], 0, g.crown.r);
  o.pillar = make();
  o.pillar.addCircle(g.pillar.a[0], 0, g.pillar.r);
  topCache.set(key, o);
  return o;
}

export function HarpistPlan({ dim = 1, lever = false, part = 'all' }: { dim?: number; lever?: boolean; part?: 'all' | 'behind' | 'front' }) {
  const h = harpistAt(lever);
  const key = lever ? 'harpistTopL' : 'harpistTop';
  let o = topCache.get(key);
  if (!o) {
    o = {};
    o.seat = make();
    o.seat.addRRect(Skia.RRectXY(Skia.XYWHRect(h.seat.x0, -h.seat.hw, h.seat.x1 - h.seat.x0, h.seat.hw * 2), 30, 30));
    topCache.set(key, o);
  }
  const pose = harpistPose('top', lever);
  return (
    <Group>
      {part !== 'front' ? (
        <Path path={o.seat}>
          <LinearGradient start={vec(h.seat.x0, -h.seat.hw)} end={vec(h.seat.x1, h.seat.hw)} colors={['#4a4c55', '#141418']} />
        </Path>
      ) : null}
      {part !== 'front' ? <PlayerBehind pose={pose} dim={dim} /> : null}
      {part !== 'behind' ? <PlayerInFront pose={pose} dim={dim} /> : null}
    </Group>
  );
}

/** The harp and its harpist from above, far to near: the harpist's body and
 *  far arm; the base, pedals and soundbox; the near arm and both hands over
 *  the soundbox; the neck, strings, pillar and crown above them all. */
export function HarpWithHarpistPlan({ variant, dim = 1 }: { variant: VariantId; dim?: number }) {
  const lever = isLever(variant);
  return (
    <Group>
      <HarpistPlan lever={lever} dim={dim} part="behind" />
      <HarpPlan variant={variant} part="lower" />
      <HarpistPlan lever={lever} dim={dim} part="front" />
      <HarpPlan variant={variant} part="upper" />
    </Group>
  );
}

export function HarpPlan({ variant, dim = 1, part = 'all' }: { variant: VariantId; dim?: number; part?: 'all' | 'lower' | 'upper' }) {
  const lever = isLever(variant);
  const g = harpGeom(lever);
  const o = topPaths(g, lever ? 'lever' : 'pedal');
  // `part`: from above the harpist's hands work ABOVE the soundbox and BELOW
  // the neck — 'lower' is the base, pedals and soundbox; 'upper' the neck,
  // strings, pillar and crown.
  const lower = part !== 'upper';
  const upper = part !== 'lower';
  return (
    <Group opacity={dim}>
      {lower ? (
        <>
      <Path path={o.base}>
        <LinearGradient start={vec(g.base.x0, -g.base.hw)} end={vec(g.base.x1, g.base.hw)} colors={MAPLE} />
      </Path>
      {g.pedals ? <Path path={o.pedals}><LinearGradient start={vec(g.base.x0 - 110, 0)} end={vec(g.base.x0, 0)} colors={GILT} /></Path> : null}
      <Path path={o.box}>
        <LinearGradient start={vec(g.backAt(1)[0], -200)} end={vec(g.b0[0], 200)} colors={['#d9b678', '#9c6e34', '#5a3a14']} />
      </Path>
      <Path path={o.box} style="stroke" strokeWidth={4} color="#3a260f" opacity={0.8} />
      <Path path={o.strip}>
        <LinearGradient start={vec(g.b1[0], -16)} end={vec(g.b0[0], 16)} colors={SPRUCE} />
      </Path>
        </>
      ) : null}
      {upper ? (
        <>
      <Path path={o.neck}>
        <LinearGradient start={vec(g.b1[0], -34)} end={vec(g.crown.c[0], 34)} colors={GILT} />
      </Path>
      <Path path={o.strings} style="stroke" strokeWidth={6} color="#e8e2d0" />
      <Path path={o.pins} color="#2a2c32" />
      <Path path={o.pillar}>
        <RadialGradient c={vec(g.pillar.a[0] - 15, -15)} r={g.pillar.r * 1.4} colors={GILT} />
      </Path>
      <Path path={o.crown}>
        <RadialGradient c={vec(g.crown.c[0] - 20, -20)} r={g.crown.r * 1.4} colors={GILT} />
      </Path>
      <Path path={o.crown} style="stroke" strokeWidth={4} color="#7c5a18" opacity={0.7} />
        </>
      ) : null}
    </Group>
  );
}

/**
 * The harp and its harpist from the side, far to near: the chair; the
 * harpist behind the harp (the far arm and hand, the torso, the head, the
 * legs); the harp; the near leg where it lies in front of the soundbox and
 * the pedals; the near arm and hand over the strings. Opaque (owner: no
 * see-through figures). `fronts`: other near arms (the pluck sequence's
 * moving hand), each shown at its own opacity; `dim` blends the figure toward
 * the stage's dark (it recedes, still opaque).
 */
export function HarpWithHarpistSide({ variant, dim = 1, harpDim = 1, fronts }: { variant: VariantId; dim?: number; harpDim?: number; fronts?: { pose: PlayerPose; opacity: number | SharedValue<number> }[] }) {
  const lever = isLever(variant);
  const pose = harpistPose('side', lever);
  const clip = nearLegClip(lever);
  const near = fronts ?? [{ pose, opacity: 1 }];
  return (
    <Group>
      <ChairSide lever={lever} />
      <PlayerBehind pose={pose} dim={dim} />
      <HarpSide variant={variant} dim={harpDim} />
      {clip ? (
        <Group clip={clip}>
          <PlayerBehind pose={pose} part="legs" dim={dim} />
        </Group>
      ) : null}
      {near.map((f, i) => (
        <Group key={i} opacity={f.opacity}>
          <NearSleeveUnder pose={f.pose} dim={dim} />
          <PlayerInFront pose={f.pose} dim={dim} />
        </Group>
      ))}
    </Group>
  );
}

export function HarpArt({ view, variant }: { view: ViewId; variant: VariantId }) {
  if (view === 'side') return <HarpWithHarpistSide variant={variant} />;
  return <HarpWithHarpistPlan variant={variant} />;
}

export function harpLabels(view: ViewId, variant: VariantId): ArtLabel[] {
  const g = harpGeom(isLever(variant));
  const h = harpistAt(isLever(variant));
  const hb = harpistBody(isLever(variant));
  const k = g.scale;
  if (view === 'side') {
    const mid = g.boardAt(0.55);
    const hole = g.holes[1];
    return [
      { id: 'pillar', text: 'PILLAR', u: g.pillar.a[0] + 70 * k, v: (g.pillar.a[1] + g.pillar.b[1]) / 2, align: 'left' },
      { id: 'neck', text: 'NECK', u: (g.crown.c[0] + g.b1[0]) / 2, v: g.crown.top - 40, align: 'center' },
      // CLASH SWEEP 2026-10-10 (owner at 3×): these three places lie on the
      // strings or the harpist, so the words fell to free space with leaders
      // back to those places — SOUNDBOARD's leader ran through PILLAR's
      // words. Each now names its part (`at`) and has places in the clear
      // column right of the pillar, stacked so the leaders never cross:
      // STRINGS highest, SOUNDBOARD, PILLAR (its own place), SOUND HOLES.
      { id: 'board', text: 'SOUNDBOARD', short: 'BOARD', u: mid[0] + 60 * k, v: mid[1] + 10, align: 'left', at: { u: mid[0], v: mid[1] }, alts: [{ u: g.pillar.a[0] + 70 * k, v: mid[1] - 260 * k, align: 'left' }, { u: g.pillar.a[0] + 70 * k, v: mid[1] - 330 * k, align: 'left' }] },
      { id: 'strings', text: 'STRINGS', u: g.strings[Math.floor(g.strings.length * 0.3)].x + 20, v: g.boardAt(0.5)[1] - 520 * k, align: 'left', tone: 'muted', at: { u: g.strings[Math.floor(g.strings.length * 0.3)].x, v: g.boardAt(0.5)[1] - 520 * k }, alts: [{ u: g.pillar.a[0] + 70 * k, v: g.boardAt(0.5)[1] - 560 * k, align: 'left' }] },
      { id: 'holes', text: 'SOUND HOLES (ON THE BACK)', short: 'HOLES', u: hole.c[0] - 40 * k, v: hole.c[1] + 120 * k, align: 'right', tone: 'muted', at: { u: hole.c[0], v: hole.c[1] }, alts: [{ u: g.pillar.a[0] + 70 * k, v: hole.c[1] - 40 * k, align: 'left' }, { u: g.pillar.a[0] + 70 * k, v: hole.c[1] + 60 * k, align: 'left' }] },
      ...(g.pedals ? [{ id: 'pedals', text: 'PEDALS', u: g.base.x0 - 40, v: -150, align: 'center' as const, tone: 'muted' as const }] : [{ id: 'levers', text: 'LEVERS ON THE NECK', short: 'LEVERS', u: g.crown.c[0] + 90 * k, v: g.crown.top + 30, align: 'left' as const, tone: 'muted' as const }]),
      { id: 'harpist', text: 'HARPIST', u: hb.head.c.x - 40, v: hb.head.c.y - 190, align: 'center', tone: 'illustrative' },
    ];
  }
  return [
    { id: 'box', text: 'SOUNDBOX', u: g.boardAt(0.6)[0], v: g.widthAt(0.6) / 2 + 90, align: 'center' },
    { id: 'pillar', text: 'PILLAR', u: g.pillar.a[0] + 80, v: 0, align: 'left' },
    { id: 'strings', text: 'STRINGS (EDGE-ON)', short: 'STRINGS', u: (g.strings[0].x + g.b1[0]) / 2, v: -70, align: 'center', tone: 'muted' },
    { id: 'harpist', text: 'HARPIST', u: h.head.x, v: h.head.z - 300, align: 'center', tone: 'illustrative' },
  ];
}

export function harpHitTest(view: ViewId, variant: VariantId, u: number, v: number, tol: number): string | null {
  const lever = isLever(variant);
  const g = harpGeom(lever);
  const pre = lever ? 'lv' : 'hp';
  const h = harpistAt(lever);
  const near = (a: Pt, b: Pt, r: number) => {
    const vx = b[0] - a[0];
    const vy = b[1] - a[1];
    const l2 = vx * vx + vy * vy || 1;
    const t = Math.max(0, Math.min(1, ((u - a[0]) * vx + (v - a[1]) * vy) / l2));
    return Math.hypot(u - (a[0] + vx * t), v - (a[1] + vy * t)) <= r + tol;
  };
  if (view === 'side') {
    if (near(g.pillar.a, g.pillar.b, g.pillar.r)) return `${pre}.pillar`;
    if (Math.abs(u - g.crown.c[0]) <= g.crown.r + tol && v <= g.crown.c[1] + 40 && v >= g.crown.top - tol) return `${pre}.crown`;
    if (g.neck.some((p, i) => i > 0 && near(g.neck[i - 1], p, 40 * g.scale))) return `${pre}.neck`;
    for (const hole of g.holes) if (Math.hypot(u - hole.c[0], v - hole.c[1]) <= hole.l / 2 + tol) return `${pre}.holes`;
    if (near(g.b0, g.b1, 20)) return `${pre}.board`;
    for (let f = 0; f <= 1; f += 0.1) if (Math.hypot(u - (g.boardAt(f)[0] + g.backAt(f)[0]) / 2, v - (g.boardAt(f)[1] + g.backAt(f)[1]) / 2) <= g.depthAt(f) / 2 + tol) return `${pre}.box`;
    if (g.strings.some((s) => Math.abs(u - s.x) <= 6 + tol && v <= s.y0 && v >= s.y1)) return `${pre}.strings`;
    if (g.pedals && u >= g.base.x0 - 120 && u <= g.base.x0 + 40 && v >= -80) return `${pre}.pedals`;
    if (u >= g.base.x0 && u <= g.base.x1 && v >= g.base.y0) return `${pre}.base`;
    if (u <= h.seat.x1 + 120 && v >= h.head.y - 140) return 'chair';
    return null;
  }
  if (Math.hypot(u - g.crown.c[0], v) <= g.crown.r + tol) return `${pre}.crown`;
  if (Math.hypot(u - g.pillar.a[0], v) <= g.pillar.r + tol) return `${pre}.pillar`;
  if (Math.abs(v) <= 20 + tol && u >= g.b1[0] && u <= g.b0[0]) return `${pre}.strings`;
  if (u >= g.backAt(1)[0] && u <= g.b0[0] + 40 && Math.abs(v) <= g.widthAt(0) / 2 + tol) return `${pre}.box`;
  if (u >= g.base.x0 - 120 && u <= g.base.x1 && Math.abs(v) <= g.base.hw + tol) return g.pedals && u < g.base.x0 ? `${pre}.pedals` : `${pre}.base`;
  if (u <= h.seat.x1 + 100) return 'chair';
  return null;
}

export const HARP_BASE_ART: Pick<LessonArt, 'Instrument' | 'labels' | 'hitTest' | 'figureAt' | 'labelsYieldToMic'> = {
  Instrument: HarpArt,
  labels: harpLabels,
  hitTest: harpHitTest,
  // The drawn harpist, so the part labels keep off the figure too.
  figureAt: (view, variant, u, v, tol) => figureCovers(harpistPose(view, isLever(variant)), u, v, tol),
  // The column right of the pillar is where the mic works: a label the mic
  // sits under steps back (clash sweep 2026-10-10: SOUNDBOARD on the boom).
  labelsYieldToMic: true,
};

