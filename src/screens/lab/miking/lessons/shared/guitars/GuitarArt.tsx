/**
 * THE SHARED GUITAR BODY FAMILY — the look (charter §2 layer 3), at the
 * Kick's illustration standard: gradients for form, light from the upper
 * left, rim highlights, soft contact shadows, a stroke hierarchy. Every
 * instrument is drawn from its GuitarSpec (guitarSpec.ts) and its scene
 * (guitarModel.ts), so the drawing, the hit areas and the zones agree.
 *
 *   GuitarFace   the instrument from the FRONT (frame G x, y): the top with
 *                its binding, the opening (round or oval hole and rosette,
 *                f-holes, a resonator's coverplate and ports, a banjo's
 *                head on its hooks), the pickguard, the bridge (pin, tie-
 *                block, floating, banjo), the fingerboard with its frets and
 *                position marks, the headstock and tuners, the strings.
 *   GuitarEdge   the instrument seen EDGE-ON (frame G x, z): the sides and
 *                back, the bridge and strings over the top, the neck, the
 *                headstock tilted back.
 *   PlayerFront / PlayerAbove / PlayerLapSide   the player as a muted
 *                figure behind and round the instrument (neighbours recede,
 *                charter §6): a minimal line-art bald head, the torso, the
 *                arms and hands, the legs — where the lesson keeps clear.
 *
 * Nothing moves (D8). Paths are built once per scene and cached. No brand
 * mark, inlay logo or likeness of a maker's design.
 */
import { BlurMask, Circle, DashPathEffect, Group, Line, LinearGradient, Path, RadialGradient, Skia, vec } from '@shopify/react-native-skia';
import type { VariantId, ViewId } from '../../../engine/model/types.ts';
import type { ArtLabel, LessonArt } from '../../../engine/scene/sceneTypes.ts';
import { fretX, outlinePoly, type GuitarGeom } from './guitarSpec.ts';
import { partIdOf, type BuiltGuitarModel, type GuitarScene } from './guitarModel.ts';

type SkPath = ReturnType<typeof Skia.Path.Make>;
const make = () => Skia.Path.Make();
const DEG = Math.PI / 180;

/* ── palette (house tokens + material ramps, lit from the upper left) ── */
const SPRUCE = ['#f3d9a4', '#e6c27f', '#d3a865', '#b88a4b'];
const CEDAR = ['#d79a63', '#c07f49', '#a5663a', '#7f4b29'];
const MAHOGANY = ['#7a3f1e', '#5d2e15', '#45210f', '#2c1509'];
const ROSEWOOD = ['#3d2216', '#2a170f', '#1d100a'];
const BINDING = '#efe6cf';
const BONE = '#f4efe2';
const CHROME = ['#f2f4f8', '#b9bec8', '#6b707b', '#c8ccd4'];
const NICKEL = '#d9dce3';
const BRONZE_STR = '#d7b06a';
const STEEL_STR = '#e4e8ef';
const NYLON_STR = '#f2efe6';
const HOLE = ['#1a120c', '#0b0806', '#050403'];
const TORTOISE = ['#5a2a14', '#2e140a', '#6d3518'];
const FIG = ['#2b2f38', '#20232a', '#16181d'];
const FIG_EDGE = '#4a505c';
const SKIN = ['#3a3e48', '#2c3038', '#22252c'];
const INK = '#08080a';

type Paths = ReturnType<typeof buildFace>;
const faceCache = new Map<string, Paths>();
const edgeCache = new Map<string, ReturnType<typeof buildEdge>>();

function polyPath(pts: [number, number][], close = true): SkPath {
  const p = make();
  pts.forEach(([x, y], i) => (i === 0 ? p.moveTo(x, y) : p.lineTo(x, y)));
  if (close) p.close();
  return p;
}
function rr(x0: number, y0: number, x1: number, y1: number, r: number): SkPath {
  const p = make();
  p.addRRect(Skia.RRectXY(Skia.XYWHRect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0)), r, r));
  return p;
}
function oval(cx: number, cy: number, rx: number, ry: number): SkPath {
  const p = make();
  p.addOval(Skia.XYWHRect(cx - rx, cy - ry, rx * 2, ry * 2));
  return p;
}

/* ═══════════════════════════════ FACE ═══════════════════════════════ */

function buildFace(sc: GuitarScene) {
  const g = sc.g;
  const sp = g.spec;
  const outline = polyPath(outlinePoly(g, 96));
  const op = sp.opening;
  // The fingerboard over the body and up the neck (a tapered strip).
  const bx0 = g.boardEnd;
  const board = polyPath([
    [bx0, -g.boardHalf(bx0)],
    [g.L, -g.boardHalf(g.L)],
    [g.L, g.boardHalf(g.L)],
    [bx0, g.boardHalf(bx0)],
  ]);
  // A round hole cuts the board's end into an arc.
  const boardEndArc = make();
  const frets = make();
  for (let n = 1; n <= sp.frets; n++) {
    const x = fretX(g.L, n);
    if (x < bx0 + 2) break;
    const hw = g.boardHalf(x);
    frets.moveTo(x, -hw + 0.8);
    frets.lineTo(x, hw - 0.8);
  }
  const marks: { x: number; y: number }[] = [];
  if (!sp.strings.nylon || sp.id === 'uke') {
    for (const n of [3, 5, 7, 9, 15, 17]) {
      const x0 = fretX(g.L, n - 1);
      const x1 = fretX(g.L, n);
      if (x1 < bx0) continue;
      marks.push({ x: (x0 + x1) / 2, y: 0 });
    }
    const x0 = fretX(g.L, 11);
    const x1 = fretX(g.L, 12);
    if (x1 > bx0) {
      marks.push({ x: (x0 + x1) / 2, y: -g.boardHalf(x1) * 0.42 });
      marks.push({ x: (x0 + x1) / 2, y: g.boardHalf(x1) * 0.42 });
    }
  }
  // The headstock: a solid plate, a slotted plate, a banjo peghead, a paddle.
  const hl = sp.neck.headLen.mm;
  const nutH = g.boardHalf(g.L);
  const headW = sp.neck.head === 'slotted' || sp.neck.head === 'banjo' ? 39 : sp.neck.head === 'paddle' ? 30 : sp.strings.perCourse === 2 && sp.strings.courses === 6 ? 48 : sp.strings.courses <= 4 ? 40 : 43;
  const H0 = g.L;
  const headPath =
    sp.neck.head === 'banjo'
      ? polyPath([
          [H0, -nutH],
          [H0 + hl * 0.2, -headW * 1.05],
          [H0 + hl * 0.55, -headW * 0.9],
          [H0 + hl * 0.8, -headW * 1.15],
          [H0 + hl, -headW * 0.55],
          [H0 + hl, headW * 0.55],
          [H0 + hl * 0.8, headW * 1.15],
          [H0 + hl * 0.55, headW * 0.9],
          [H0 + hl * 0.2, headW * 1.05],
          [H0, nutH],
        ])
      : polyPath([
          [H0, -nutH],
          [H0 + hl * 0.12, -headW],
          [H0 + hl * 0.96, -headW * (sp.neck.head === 'paddle' ? 0.95 : 1.06)],
          [H0 + hl, -headW * 0.4],
          [H0 + hl, headW * 0.4],
          [H0 + hl * 0.96, headW * (sp.neck.head === 'paddle' ? 0.95 : 1.06)],
          [H0 + hl * 0.12, headW],
          [H0, nutH],
        ]);
  const slots = make();
  if (sp.neck.head === 'slotted') {
    slots.addRRect(Skia.RRectXY(Skia.XYWHRect(H0 + hl * 0.16, -headW * 0.45, hl * 0.72, headW * 0.32), 10, 10));
    slots.addRRect(Skia.RRectXY(Skia.XYWHRect(H0 + hl * 0.16, headW * 0.13, hl * 0.72, headW * 0.32), 10, 10));
  }
  // Tuner posts and buttons (per side), spread along the headstock.
  const perSide = sp.neck.tuners;
  const posts: { x: number; y: number; side: -1 | 1 }[] = [];
  for (let k = 0; k < perSide; k++) {
    const x = H0 + hl * (0.22 + (0.66 * (k + 0.5)) / perSide);
    posts.push({ x, y: -headW * 0.55, side: -1 }, { x, y: headW * 0.55, side: 1 });
  }
  // Strings: saddle (or bridge) to nut, then on to the posts.
  const ys0 = g.stringYs(sp.bridge.x.mm);
  const ysN = g.stringYs(g.L);
  const startX = sp.bridge.kind === 'tieblock' ? sp.bridge.x.mm - sp.bridge.l.mm / 2 + 4 : sp.bridge.kind === 'banjo' || sp.bridge.kind === 'floating' ? (sp.body.pot ? sp.body.pot.cx.mm - sp.body.pot.d.mm / 2 + 30 : g.tail + 22) : sp.bridge.kind === 'spider' || sp.bridge.kind === 'biscuit' ? g.tail + 18 : sp.bridge.x.mm - 6;
  const strings: { path: SkPath; w: number; color: string }[] = [];
  const nStr = ys0.length;
  for (let k = 0; k < nStr; k++) {
    const p = make();
    const course = sp.strings.perCourse === 2 ? Math.floor(k / 2) : k;
    const wound = course < sp.strings.wound;
    p.moveTo(startX, ys0[k] * (sp.bridge.kind === 'banjo' || sp.bridge.kind === 'floating' || sp.bridge.kind === 'spider' ? 0.6 : 1));
    p.lineTo(sp.bridge.x.mm, ys0[k]);
    p.lineTo(g.L, ysN[k]);
    // On to a post on its side of the headstock (bass strings to −y).
    const post = posts.filter((q) => q.side === (course < sp.strings.courses / 2 ? -1 : 1))[Math.min(perSide - 1, course % perSide)] ?? posts[0];
    p.lineTo(post.x, post.y * 0.72);
    const w = sp.strings.nylon ? (wound ? 1.1 : 0.95) : wound ? 1.05 : 0.7;
    strings.push({ path: p, w: sp.id === 'bass' ? w * 1.8 : sp.strings.perCourse === 2 ? w * 0.8 : w, color: sp.strings.nylon ? (wound ? STEEL_STR : NYLON_STR) : wound ? BRONZE_STR : STEEL_STR });
  }
  // A banjo's short fifth string, from its peg.
  if (sp.fifth) {
    const p = make();
    const y = g.stringYs(0)[0];
    p.moveTo(startX, y * 0.6);
    p.lineTo(0, y);
    p.lineTo(sp.fifth.mm, -g.boardHalf(sp.fifth.mm) + 3);
    p.lineTo(sp.fifth.mm + 6, -g.boardHalf(sp.fifth.mm) - 12);
    strings.push({ path: p, w: 0.7, color: STEEL_STR });
  }
  // Pickguard: a teardrop on the treble side, between the hole and the waist.
  let guard: SkPath | null = null;
  if (sp.pickguard && (op.kind === 'round' || op.kind === 'oval')) {
    const r = g.hole.r;
    const cx = g.hole.x - r * 0.3;
    const cy = r + 30;
    const p = make();
    p.moveTo(cx + r * 0.9, r * 0.7);
    p.cubicTo(cx + r * 0.9, cy + r * 0.7, cx - r * 0.3, cy + r * 1.3, cx - r * 1.35, cy + r * 0.5);
    p.cubicTo(cx - r * 1.9, cy - r * 0.2, cx - r * 1.2, r * 0.55, cx - r * 0.55, r * 0.95);
    p.close();
    guard = p;
  }
  // Rosette rings and the opening.
  const ros = make();
  let hole: SkPath | null = null;
  let fholes: SkPath | null = null;
  if (op.kind === 'round') {
    hole = oval(g.hole.x, 0, g.hole.r, g.hole.r);
    for (const k of [1.12, 1.18, 1.3]) ros.addOval(Skia.XYWHRect(g.hole.x - g.hole.r * k, -g.hole.r * k, g.hole.r * 2 * k, g.hole.r * 2 * k));
  } else if (op.kind === 'oval') {
    hole = oval(g.hole.x, 0, g.hole.r, g.hole.r2);
    for (const k of [1.12, 1.24]) ros.addOval(Skia.XYWHRect(g.hole.x - g.hole.r * k, -g.hole.r2 * k, g.hole.r * 2 * k, g.hole.r2 * 2 * k));
  } else if (op.kind === 'fholes') {
    // Two f-shaped holes, mirrored about the centre line (drawing default).
    const f = make();
    const cx = op.x.mm;
    const len = op.d.mm;
    const off = op.d2 ? op.d2.mm : 60;
    for (const s of [-1, 1]) {
      const y = s * off;
      f.moveTo(cx - len / 2, y + s * 6);
      f.cubicTo(cx - len / 4, y + s * 14, cx + len / 4, y - s * 14, cx + len / 2, y - s * 6);
      f.addCircle(cx - len / 2, y + s * 6, 5.5);
      f.addCircle(cx + len / 2, y - s * 6, 5.5);
    }
    fholes = f;
  }
  // A resonator: the coverplate (a perforated disc), its palm plate, ports.
  let cover: { disc: SkPath; holes: SkPath; palm: SkPath; ports: SkPath; mesh: SkPath } | null = null;
  if (op.kind === 'coverplate') {
    const cx = op.x.mm;
    const r = op.d.mm / 2;
    const holes = make();
    for (const ring of [{ rr: r * 0.82, n: 20, d: 6 }, { rr: r * 0.66, n: 14, d: 5 }]) {
      for (let k = 0; k < ring.n; k++) {
        const a = (k / ring.n) * Math.PI * 2;
        holes.addCircle(cx + ring.rr * Math.cos(a), ring.rr * Math.sin(a), ring.d);
      }
    }
    const palm = rr(cx - 34, -r * 0.62, cx + 34, r * 0.62, 18);
    const ports = make();
    const mesh = make();
    if (op.ports) {
      for (const s of [-1, 1]) {
        const px = op.ports.x.mm;
        const py = s * op.ports.y.mm;
        const pr = op.ports.d.mm / 2;
        ports.addCircle(px, py, pr);
        for (let k = -3; k <= 3; k++) {
          mesh.moveTo(px + k * 7, py - Math.sqrt(Math.max(0, pr * pr - (k * 7) ** 2)));
          mesh.lineTo(px + k * 7, py + Math.sqrt(Math.max(0, pr * pr - (k * 7) ** 2)));
          mesh.moveTo(px - Math.sqrt(Math.max(0, pr * pr - (k * 7) ** 2)), py + k * 7);
          mesh.lineTo(px + Math.sqrt(Math.max(0, pr * pr - (k * 7) ** 2)), py + k * 7);
        }
      }
    }
    cover = { disc: oval(cx, 0, r, r), holes, palm, ports, mesh };
  }
  // A banjo: the head on its tension hoop, the hooks, the tailpiece, an armrest.
  let banjo: { head: SkPath; hoop: SkPath; hooks: SkPath; flange: SkPath | null; tail: SkPath; arm: SkPath } | null = null;
  if (sp.body.pot) {
    const cx = sp.body.pot.cx.mm;
    const r = sp.body.pot.d.mm / 2;
    const n = sp.hooks?.mm ?? 24;
    const hooks = make();
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2;
      hooks.addRRect(Skia.RRectXY(Skia.XYWHRect(cx + (r + 3) * Math.cos(a) - 4, (r + 3) * Math.sin(a) - 4, 8, 8), 2, 2));
    }
    const fl = sp.resonatorBack ? sp.resonatorBack.d.mm / 2 : 0;
    const tp = cx - r;
    const tail = polyPath([
      [tp - 6, -14],
      [tp + 70, -9],
      [tp + 78, 0],
      [tp + 70, 9],
      [tp - 6, 14],
    ]);
    const arm = make();
    arm.addArc(Skia.XYWHRect(cx - r - 10, -r - 10, (r + 10) * 2, (r + 10) * 2), 200, 60);
    banjo = { head: oval(cx, 0, r - 6, r - 6), hoop: oval(cx, 0, r, r), hooks, flange: fl > r ? oval(cx, 0, fl, fl) : null, tail, arm };
  }
  // A mandolin's tailpiece cover (its strings anchor at the tail).
  const mandoTail = sp.id.startsWith('mando') ? rr(g.tail - 4, -22, g.tail + 40, 22, 8) : null;
  // F-style points and scroll (drawing default ornaments on the bass side).
  let scroll: SkPath | null = null;
  if (sp.id === 'mandoF') {
    const p = make();
    const xu = sp.body.xUpper.mm;
    const yb = -g.halfW(xu, 'bass');
    p.moveTo(xu - 40, yb + 4);
    p.cubicTo(xu - 10, yb - 40, xu + 40, yb - 38, xu + 52, yb - 10);
    p.cubicTo(xu + 58, yb + 8, xu + 30, yb + 14, xu + 20, yb + 2);
    p.cubicTo(xu + 14, yb - 8, xu + 30, yb - 16, xu + 36, yb - 6);
    const xl = sp.body.xLower.mm;
    for (const s of [-1, 1]) {
      const yy = s * g.halfW(xl + 40, s < 0 ? 'bass' : 'treble');
      p.moveTo(xl + 20, yy);
      p.lineTo(xl + 50, yy + s * 22);
      p.lineTo(xl + 70, yy);
    }
    scroll = p;
  }
  // The bridge.
  const b = sp.bridge;
  let bridge: SkPath;
  let saddle: SkPath | null = null;
  const pins: { x: number; y: number }[] = [];
  if (b.kind === 'pin') {
    const p = make();
    const w = b.w.mm / 2;
    const l = b.l.mm / 2;
    const bxc = b.x.mm;
    p.moveTo(bxc - l, -w);
    p.cubicTo(bxc - l * 1.4, -w * 0.4, bxc - l * 1.4, w * 0.4, bxc - l, w);
    p.lineTo(bxc + l, w);
    p.cubicTo(bxc + l * 0.6, w * 0.5, bxc + l * 0.6, -w * 0.5, bxc + l, -w);
    p.close();
    bridge = p;
    const sy = g.stringYs(0);
    saddle = rr(-1.6, sy[0] - 6, 1.6, sy[sy.length - 1] + 6, 1);
    const pinX = bxc - l * 0.45;
    for (const y of sp.strings.perCourse === 2 ? sy : sy) pins.push({ x: pinX, y });
  } else if (b.kind === 'tieblock') {
    bridge = rr(b.x.mm - b.l.mm / 2, -b.w.mm / 2, b.x.mm + b.l.mm / 2, b.w.mm / 2, 4);
    const sy = g.stringYs(0);
    saddle = rr(b.x.mm + b.l.mm / 2 - 6, sy[0] - 5, b.x.mm + b.l.mm / 2 - 3, sy[sy.length - 1] + 5, 1);
  } else if (b.kind === 'banjo' || b.kind === 'floating') {
    const w = b.w.mm / 2;
    bridge = polyPath([
      [b.x.mm - 4, -w],
      [b.x.mm + 4, -w * 0.9],
      [b.x.mm + 4, w * 0.9],
      [b.x.mm - 4, w],
    ]);
  } else {
    bridge = rr(b.x.mm - b.l.mm / 2, -b.w.mm / 2, b.x.mm + b.l.mm / 2, b.w.mm / 2, 3);
  }
  // Grain on the top: faint lines along x.
  const grain = make();
  for (let y = -g.lowerH; y <= g.lowerH; y += 9) {
    grain.moveTo(g.tail, y);
    grain.lineTo(g.edge, y);
  }
  return { outline, board, boardEndArc, frets, marks, headPath, slots, posts, strings, guard, ros, hole, fholes, cover, banjo, mandoTail, scroll, bridge, saddle, pins, grain };
}

export function GuitarFace({ sc, dim = 1 }: { sc: GuitarScene; dim?: number }) {
  const key = sc.variant.id;
  let P = faceCache.get(key);
  if (!P) {
    P = buildFace(sc);
    faceCache.set(key, P);
  }
  const g = sc.g;
  const sp = g.spec;
  const woodTop = sp.strings.nylon && sp.id !== 'uke' ? CEDAR : sp.id === 'uke' ? ['#c98c55', '#b0743f', '#8f5a2d', '#6c421f'] : SPRUCE;
  const tl = vec(g.tail, -g.lowerH);
  const br = vec(g.edge, g.lowerH);
  const banjo = P.banjo;
  return (
    <Group opacity={dim}>
      {/* contact shadow */}
      <Path path={P.outline} color="#000" opacity={0.45} transform={[{ translateX: 6 }, { translateY: 8 }]}>
        <BlurMask blur={10} style="normal" />
      </Path>
      {banjo && banjo.flange ? (
        <Path path={banjo.flange}>
          <RadialGradient c={vec(sp.body.pot!.cx.mm - 40, -50)} r={sp.resonatorBack!.d.mm / 2 + 30} colors={['#8a5229', '#6a3c1c', '#3e210f']} />
        </Path>
      ) : null}
      {banjo ? (
        <>
          <Path path={banjo.hoop}>
            <LinearGradient start={vec(sp.body.pot!.cx.mm - 150, -150)} end={vec(sp.body.pot!.cx.mm + 150, 150)} colors={CHROME} />
          </Path>
          <Path path={banjo.hooks} color={NICKEL} />
          <Path path={banjo.hooks} style="stroke" strokeWidth={0.8} color="#5d626d" />
          <Path path={banjo.head}>
            <RadialGradient c={vec(sp.body.pot!.cx.mm - 40, -40)} r={sp.body.pot!.d.mm / 2} colors={['#fbf8f0', '#efe8d8', '#d8cfba']} />
          </Path>
          <Path path={banjo.tail}>
            <LinearGradient start={vec(g.tail, -14)} end={vec(g.tail + 70, 14)} colors={CHROME} />
          </Path>
          <Path path={banjo.arm} style="stroke" strokeWidth={9} strokeCap="round" color="#6a3c1c" />
        </>
      ) : (
        <>
          <Path path={P.outline}>
            <LinearGradient start={tl} end={br} colors={woodTop} />
          </Path>
          <Path path={P.grain} style="stroke" strokeWidth={0.5} color="#8a6a3a" opacity={0.18} clip={P.outline} />
          {/* binding: a cream line inside a dark edge */}
          <Path path={P.outline} style="stroke" strokeWidth={4.5} color="#2a1a0e" />
          <Path path={P.outline} style="stroke" strokeWidth={2} color={BINDING} />
        </>
      )}
      {P.ros ? <Path path={P.ros} style="stroke" strokeWidth={2.2} color="#3a2414" opacity={0.85} /> : null}
      {P.hole ? (
        <Path path={P.hole}>
          <RadialGradient c={vec(g.hole.x - g.hole.r * 0.3, -g.hole.r * 0.3)} r={g.hole.r * 1.2} colors={HOLE} />
        </Path>
      ) : null}
      {P.fholes ? <Path path={P.fholes} style="stroke" strokeWidth={6} strokeCap="round" color="#120b06" /> : null}
      {P.scroll ? <Path path={P.scroll} style="stroke" strokeWidth={3} color="#3a2414" opacity={0.9} /> : null}
      {P.cover ? (
        <>
          <Path path={P.cover.ports} color="#0c0a08" />
          <Path path={P.cover.mesh} style="stroke" strokeWidth={0.8} color="#9aa0ab" opacity={0.8} clip={P.cover.ports} />
          <Path path={P.cover.ports} style="stroke" strokeWidth={2} color="#c8ccd4" />
          <Path path={P.cover.disc}>
            <RadialGradient c={vec(sp.opening.x.mm - 50, -50)} r={sp.opening.d.mm * 0.62} colors={['#f6f8fb', '#c9ced8', '#8a909b', '#5a5f69']} />
          </Path>
          <Path path={P.cover.holes} color="#0c0a08" />
          <Path path={P.cover.disc} style="stroke" strokeWidth={2.5} color="#e9ecf1" />
          <Path path={P.cover.palm}>
            <LinearGradient start={vec(sp.opening.x.mm - 34, -80)} end={vec(sp.opening.x.mm + 34, 80)} colors={CHROME} />
          </Path>
        </>
      ) : null}
      {P.guard ? (
        <Path path={P.guard}>
          <LinearGradient start={vec(g.hole.x - 80, 20)} end={vec(g.hole.x + 40, 140)} colors={TORTOISE} />
        </Path>
      ) : null}
      {P.mandoTail ? (
        <Path path={P.mandoTail}>
          <LinearGradient start={vec(g.tail, -22)} end={vec(g.tail + 40, 22)} colors={CHROME} />
        </Path>
      ) : null}
      {/* the bridge */}
      <Path path={P.bridge}>
        <LinearGradient start={vec(sp.bridge.x.mm - 20, -sp.bridge.w.mm / 2)} end={vec(sp.bridge.x.mm + 20, sp.bridge.w.mm / 2)} colors={sp.bridge.kind === 'banjo' || sp.bridge.kind === 'floating' ? ['#e7c48a', '#c99a5a', '#8f6532'] : ROSEWOOD} />
      </Path>
      {P.saddle ? <Path path={P.saddle} color={BONE} /> : null}
      {P.pins.map((q, i) => (
        <Circle key={`pin${i}`} cx={q.x} cy={q.y} r={sp.strings.perCourse === 2 ? 1.6 : 2.6} color={sp.strings.nylon ? BONE : '#f1ead8'} />
      ))}
      {/* the neck: fingerboard, frets, marks, nut, headstock */}
      <Path path={P.board}>
        <LinearGradient start={vec(g.boardEnd, -30)} end={vec(g.boardEnd + 60, 30)} colors={ROSEWOOD} />
      </Path>
      <Path path={P.frets} style="stroke" strokeWidth={1.4} color="#c9ced8" />
      {P.marks.map((m, i) => (
        <Circle key={`mk${i}`} cx={m.x} cy={m.y} r={3.2} color="#ece4d2" />
      ))}
      <Line p1={vec(g.L, -g.boardHalf(g.L))} p2={vec(g.L, g.boardHalf(g.L))} color={BONE} strokeWidth={4} />
      <Path path={P.headPath}>
        <LinearGradient start={vec(g.L, -40)} end={vec(g.L + sp.neck.headLen.mm, 40)} colors={sp.neck.head === 'banjo' ? ['#3a2014', '#2a170f', '#1c0f08'] : MAHOGANY} />
      </Path>
      <Path path={P.slots} color="#0d0906" />
      <Path path={P.headPath} style="stroke" strokeWidth={1.2} color="#120b06" />
      {P.posts.map((q, i) => (
        <Group key={`post${i}`}>
          {/* the tuner button out to the side, the post on the face */}
          <Path path={rr(q.x - 6, q.side * 4 + q.y * 1.0 + q.side * 10, q.x + 6, q.y * 1.0 + q.side * 30, 3)} color={sp.strings.nylon ? '#efe6cf' : NICKEL} />
          <Circle cx={q.x} cy={q.y * 0.72} r={3.4} color={NICKEL} />
        </Group>
      ))}
      {P.strings.map((s, i) => (
        <Path key={`s${i}`} path={s.path} style="stroke" strokeWidth={s.w} color={s.color} />
      ))}
    </Group>
  );
}

/* ═══════════════════════════════ EDGE ═══════════════════════════════ */

function buildEdge(sc: GuitarScene) {
  const g = sc.g;
  const sp = g.spec;
  const D = g.depth;
  // The sides, seen from above the bass edge: a band from the tail to the
  // neck end, its ends rounded.
  const sides = sp.body.pot ? rr(g.tail, -D, g.edge, 0, 8) : rr(g.tail, -D, g.edge, 0, 22);
  const back = sp.resonatorBack ? rr(sp.body.pot!.cx.mm - sp.resonatorBack.d.mm / 2, -D - sp.resonatorBack.depth.mm, sp.body.pot!.cx.mm + sp.resonatorBack.d.mm / 2, -D + 4, 26) : null;
  const neck = make();
  // Fingerboard on top of the neck shaft, the heel at the body.
  const hE = g.h(g.edge);
  neck.moveTo(g.edge, hE - 2);
  neck.lineTo(g.L, hE - 2);
  neck.lineTo(g.L, -20);
  neck.cubicTo(g.L - 120, -26, g.edge + 120, -26, g.edge + 30, -30);
  neck.cubicTo(g.edge + 6, -32, g.edge, -D * 0.55, g.edge - 2, -D * 0.6);
  neck.close();
  const board = rr(g.boardEnd, hE - 8, g.L, hE - 2, 1.5);
  // The headstock, tilted back from the nut (drawing default 14°; a banjo's
  // and a slotted head's less).
  const tilt = (sp.neck.head === 'banjo' ? 6 : sp.neck.head === 'slotted' ? 12 : 14) * DEG;
  const hl = sp.neck.headLen.mm;
  const hx = g.L + hl * Math.cos(tilt);
  const hz = hE - 4 - hl * Math.sin(tilt);
  const head = polyPath([
    [g.L, hE - 1],
    [hx, hz + 2],
    [hx, hz - 14],
    [g.L, hE - 20],
  ]);
  const strings = make();
  const bz = sp.opening.kind === 'coverplate' ? 18 : 11;
  strings.moveTo(sp.bridge.x.mm, bz);
  strings.lineTo(g.L, hE + 1);
  strings.lineTo(g.L + hl * 0.5 * Math.cos(tilt), hE - 2 - hl * 0.5 * Math.sin(tilt));
  const bridge = rr(sp.bridge.x.mm - sp.bridge.l.mm / 2, 0, sp.bridge.x.mm + sp.bridge.l.mm / 2, bz - 2, 2);
  const cover = sp.opening.kind === 'coverplate' ? rr(sp.opening.x.mm - sp.opening.d.mm / 2, 0, sp.opening.x.mm + sp.opening.d.mm / 2, 7, 3) : null;
  const tuners = make();
  for (let k = 0; k < sp.neck.tuners; k++) {
    const x = g.L + hl * (0.22 + (0.66 * (k + 0.5)) / sp.neck.tuners) * Math.cos(tilt);
    const z = hE - 8 - (x - g.L) * Math.tan(tilt);
    tuners.addRRect(Skia.RRectXY(Skia.XYWHRect(x - 5, z - 26, 10, 14), 3, 3));
  }
  return { sides, back, neck, board, head, strings, bridge, cover, tuners, hE };
}

export function GuitarEdge({ sc, dim = 1 }: { sc: GuitarScene; dim?: number }) {
  const key = sc.variant.id;
  let P = edgeCache.get(key);
  if (!P) {
    P = buildEdge(sc);
    edgeCache.set(key, P);
  }
  const g = sc.g;
  const sp = g.spec;
  const D = g.depth;
  const sideWood = sp.body.pot ? ['#7a4a26', '#5b3519', '#3a210f'] : sp.id === 'reso' ? ['#9aa0ab', '#6b707b', '#3f434b'] : MAHOGANY;
  return (
    <Group opacity={dim}>
      <Path path={P.sides} color="#000" opacity={0.4} transform={[{ translateX: 5 }, { translateY: 6 }]}>
        <BlurMask blur={8} style="normal" />
      </Path>
      {P.back ? (
        <Path path={P.back}>
          <LinearGradient start={vec(g.tail, -D - 40)} end={vec(g.tail, -D)} colors={['#8a5229', '#5a3216', '#3a1f0d']} />
        </Path>
      ) : null}
      <Path path={P.sides}>
        <LinearGradient start={vec(g.tail, -D)} end={vec(g.tail, 0)} colors={sideWood} />
      </Path>
      {/* the top and back edges, bound */}
      <Line p1={vec(g.tail + 10, -1.5)} p2={vec(g.edge - 6, -1.5)} color={sp.body.pot ? '#d8dbe2' : BINDING} strokeWidth={3} />
      <Line p1={vec(g.tail + 10, -D + 1.5)} p2={vec(g.edge - 6, -D + 1.5)} color={sp.body.pot ? '#d8dbe2' : BINDING} strokeWidth={2.4} />
      {P.cover ? (
        <Path path={P.cover}>
          <LinearGradient start={vec(0, 0)} end={vec(0, 7)} colors={CHROME} />
        </Path>
      ) : null}
      <Path path={P.neck}>
        <LinearGradient start={vec(g.edge, -30)} end={vec(g.edge, 20)} colors={MAHOGANY} />
      </Path>
      <Path path={P.board}>
        <LinearGradient start={vec(0, P.hE - 8)} end={vec(0, P.hE)} colors={ROSEWOOD} />
      </Path>
      <Path path={P.head}>
        <LinearGradient start={vec(g.L, 0)} end={vec(g.L + 80, -30)} colors={MAHOGANY} />
      </Path>
      <Path path={P.tuners} color={sp.strings.nylon ? '#efe6cf' : NICKEL} />
      <Path path={P.bridge}>
        <LinearGradient start={vec(0, 0)} end={vec(0, 12)} colors={sp.bridge.kind === 'banjo' || sp.bridge.kind === 'floating' ? ['#e7c48a', '#a87a40'] : ROSEWOOD} />
      </Path>
      <Path path={P.strings} style="stroke" strokeWidth={1.4} color={sp.strings.nylon ? NYLON_STR : STEEL_STR} />
      {/* end pin / strap button at the tail */}
      <Circle cx={g.tail - 4} cy={-D / 2} r={5} color={NICKEL} />
    </Group>
  );
}

/* ═══════════════════════════════ PLAYER ═══════════════════════════════ */

/** A minimal line-art bald head (the house head spec), seen front or above. */
function Head({ cx, cy, r, above = false }: { cx: number; cy: number; r: number; above?: boolean }) {
  return (
    <Group>
      <Circle cx={cx} cy={cy} r={r * 0.92}>
        <RadialGradient c={vec(cx - r * 0.35, cy - r * 0.4)} r={r * 1.3} colors={SKIN} />
      </Circle>
      <Circle cx={cx} cy={cy} r={r * 0.92} style="stroke" strokeWidth={3} color={FIG_EDGE} />
      {above ? (
        // From above: the nose's line toward the audience (+z, down the screen).
        <Line p1={vec(cx, cy + r * 0.88)} p2={vec(cx, cy + r * 1.12)} color={FIG_EDGE} strokeWidth={3} />
      ) : (
        <>
          <Path path={oval(cx - r * 0.95, cy + r * 0.05, r * 0.12, r * 0.22)} style="stroke" strokeWidth={2.4} color={FIG_EDGE} />
          <Path path={oval(cx + r * 0.95, cy + r * 0.05, r * 0.12, r * 0.22)} style="stroke" strokeWidth={2.4} color={FIG_EDGE} />
        </>
      )}
    </Group>
  );
}

function figPath(pts: [number, number][]): SkPath {
  // A smooth closed figure through the points (quadratic midpoints).
  const p = make();
  const n = pts.length;
  const mid = (i: number) => [(pts[i][0] + pts[(i + 1) % n][0]) / 2, (pts[i][1] + pts[(i + 1) % n][1]) / 2];
  const m0 = mid(n - 1);
  p.moveTo(m0[0], m0[1]);
  for (let i = 0; i < n; i++) {
    const m = mid(i);
    p.quadTo(pts[i][0], pts[i][1], m[0], m[1]);
  }
  p.close();
  return p;
}

function Fig({ path, from, to }: { path: SkPath; from: [number, number]; to: [number, number] }) {
  return (
    <>
      <Path path={path}>
        <LinearGradient start={vec(from[0], from[1])} end={vec(to[0], to[1])} colors={FIG} />
      </Path>
      <Path path={path} style="stroke" strokeWidth={2.5} color={FIG_EDGE} opacity={0.9} />
    </>
  );
}

/** An arm or leg: a rounded tube along a smooth polyline (a stroke with a
 *  darker rim), light from the upper left. */
function Limb({ pts, w }: { pts: [number, number][]; w: number }) {
  const p = make();
  p.moveTo(pts[0][0], pts[0][1]);
  if (pts.length === 2) p.lineTo(pts[1][0], pts[1][1]);
  for (let i = 1; i < pts.length - 1; i++) {
    const m = i === pts.length - 2 ? pts[i + 1] : [(pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2];
    p.quadTo(pts[i][0], pts[i][1], m[0], m[1]);
  }
  const a = pts[0];
  const b = pts[pts.length - 1];
  return (
    <>
      <Path path={p} style="stroke" strokeWidth={w + 6} strokeCap="round" strokeJoin="round" color={FIG_EDGE} />
      <Path path={p} style="stroke" strokeWidth={w} strokeCap="round" strokeJoin="round">
        <LinearGradient start={vec(a[0] - w, a[1] - w)} end={vec(b[0] + w, b[1] + w)} colors={FIG} />
      </Path>
    </>
  );
}

/** A hand: a rounded mitt with a thumb, skin-toned (a muted figure). */
function Hand({ x, y, r, rot = 0 }: { x: number; y: number; r: number; rot?: number }) {
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { rotate: rot * DEG }]}>
      <Path path={oval(0, 0, r * 1.15, r * 0.8)}>
        <RadialGradient c={vec(-r * 0.4, -r * 0.4)} r={r * 1.6} colors={SKIN} />
      </Path>
      <Path path={oval(-r * 0.7, -r * 0.55, r * 0.38, r * 0.24)} color={SKIN[1]} />
      <Path path={oval(0, 0, r * 1.15, r * 0.8)} style="stroke" strokeWidth={2.5} color={FIG_EDGE} />
    </Group>
  );
}

/** The player from the front (upright postures): behind the instrument,
 *  legs below it — drawn BEFORE the instrument; the strumming forearm after. */
export function PlayerFrontBack({ sc }: { sc: GuitarScene }) {
  const f = sc.fit;
  const g = sc.g;
  const hx = f.head.c.x;
  const hy = f.head.c.y;
  const sy = hy + 150; // shoulders
  const torso = figPath([
    [hx - 230, sy + 30],
    [hx - 200, sy - 10],
    [hx - 60, sy - 30],
    [hx + 60, sy - 30],
    [hx + 200, sy - 10],
    [hx + 230, sy + 30],
    [hx + 190, g.lowerH + 60],
    [hx - 190, g.lowerH + 60],
  ]);
  const floor = sc.floorY;
  const seated = sc.variant.posture === 'seated';
  const legs = seated
    ? [
        figPath([[hx - 170, g.lowerH + 40], [hx - 60, g.lowerH + 40], [hx - 70, floor - 30], [hx - 160, floor - 30]]),
        figPath([[hx + 40, g.lowerH + 40], [hx + 150, g.lowerH + 40], [hx + 150, floor - 30], [hx + 60, floor - 30]]),
      ]
    : [
        figPath([[hx - 150, g.lowerH + 30], [hx - 40, g.lowerH + 30], [hx - 50, floor - 30], [hx - 140, floor - 30]]),
        figPath([[hx + 10, g.lowerH + 30], [hx + 120, g.lowerH + 30], [hx + 110, floor - 30], [hx + 20, floor - 30]]),
      ];
  const shoes = seated
    ? [rr(hx - 185, floor - 40, hx - 50, floor, 18), rr(hx + 35, floor - 40, hx + 170, floor, 18)]
    : [rr(hx - 160, floor - 40, hx - 30, floor, 18), rr(hx, floor - 40, hx + 130, floor, 18)];
  // The fretting arm (the player's left = +x): down from the shoulder to an
  // elbow hanging below the neck, the forearm up to the hand on the neck.
  const fx = fretX(g.L, 4);
  const elbowL: [number, number] = [Math.max(hx + 260, g.edge + 90), Math.min(g.lowerH + 20, 190)];
  // The strumming arm's upper half, behind the body: shoulder to the elbow
  // resting on the bass edge of the lower bout.
  const e = sc.fit.arm.a;
  return (
    <Group>
      <Fig path={torso} from={[hx - 200, sy]} to={[hx + 200, g.lowerH]} />
      {legs.map((p, i) => (
        <Fig key={`leg${i}`} path={p} from={[hx - 150, g.lowerH]} to={[hx + 150, floor]} />
      ))}
      {shoes.map((p, i) => (
        <Path key={`shoe${i}`} path={p} color="#121317" />
      ))}
      <Limb pts={[[hx - 205, sy + 25], [e.x - 30, e.y - 40]]} w={92} />
      <Limb pts={[[hx + 205, sy + 25], [elbowL[0] - 10, sy + 160], elbowL]} w={92} />
      <Limb pts={[elbowL, [fx - 20, g.boardHalf(fx) + 30]]} w={78} />
      <Head cx={hx} cy={hy} r={f.head.r} />
      {/* the neck of the player, under the head */}
      <Path path={rr(hx - 34, hy + f.head.r * 0.8, hx + 34, sy - 20, 10)} color={SKIN[1]} />
    </Group>
  );
}

/** The hands over the instrument (drawn AFTER it): the strumming forearm and
 *  hand, and the fretting fingers round the neck. */
export function PlayerFrontHands({ sc }: { sc: GuitarScene }) {
  const f = sc.fit;
  const g = sc.g;
  const a = f.arm.a;
  const b = f.arm.b;
  const fx = fretX(g.L, 4);
  const fingers = make();
  for (let k = 0; k < 3; k++) fingers.addRRect(Skia.RRectXY(Skia.XYWHRect(fx - 12 - k * 22, -g.boardHalf(fx) - 6, 15, g.boardHalf(fx) * 1.4), 7, 7));
  return (
    <Group opacity={0.94}>
      {/* the strumming forearm over the lower bout, the hand over the strings */}
      <Limb pts={[[a.x - 30, a.y - 40], [b.x - 30, b.y - 6]]} w={f.arm.r * 1.9} />
      <Hand x={b.x + 8} y={b.y + 6} r={f.arm.r * 1.05} rot={30} />
      {/* the fretting hand: the palm under the neck, the fingers over it */}
      <Hand x={fx - 26} y={g.boardHalf(fx) + 26} r={f.arm.r * 0.95} rot={-10} />
      <Path path={fingers}>
        <LinearGradient start={vec(fx - 60, -30)} end={vec(fx, 30)} colors={SKIN} />
      </Path>
      <Path path={fingers} style="stroke" strokeWidth={2} color={FIG_EDGE} />
    </Group>
  );
}

/** The player from above (upright postures), behind the instrument. */
export function PlayerAbove({ sc }: { sc: GuitarScene }) {
  const f = sc.fit;
  const g = sc.g;
  const hx = f.head.c.x;
  const hz = f.head.c.z;
  const z0 = f.torso.min.z;
  const z1 = f.torso.max.z;
  const shoulders = figPath([
    [hx - 250, (z0 + z1) / 2 + 20],
    [hx - 210, z0 + 30],
    [hx + 210, z0 + 30],
    [hx + 250, (z0 + z1) / 2 + 20],
    [hx + 200, z1 + 4],
    [hx - 200, z1 + 4],
  ]);
  const seated = sc.variant.posture === 'seated';
  const thighs = seated
    ? [figPath([[hx - 190, z1 - 10], [hx - 70, z1 - 10], [hx - 80, f.legs.max.z], [hx - 180, f.legs.max.z]]), figPath([[hx + 20, z1 - 10], [hx + 140, z1 - 10], [hx + 130, f.legs.max.z], [hx + 30, f.legs.max.z]])]
    : [];
  const feet = f.feet ? [rr(hx - 200, f.feet.max.z - 230, hx - 90, f.feet.max.z, 30), rr(hx + 10, f.feet.max.z - 230, hx + 120, f.feet.max.z, 30)] : [];
  const fx = fretX(g.L, 4);
  return (
    <Group>
      {thighs.map((p, i) => (
        <Fig key={`th${i}`} path={p} from={[hx, z1]} to={[hx, f.legs.max.z]} />
      ))}
      {feet.map((p, i) => (
        <Path key={`ft${i}`} path={p} color="#121317" />
      ))}
      <Fig path={shoulders} from={[hx - 200, z0]} to={[hx + 200, z1]} />
      <Limb pts={[[hx + 210, z0 + 70], [Math.max(hx + 280, g.edge + 80), (z0 + z1) / 2 + 60], [fx - 20, -30]]} w={84} />
      <Head cx={hx} cy={hz} r={f.head.r * 0.95} above />
    </Group>
  );
}

/** The strumming forearm seen from above, over the top (after the instrument). */
export function PlayerAboveHands({ sc }: { sc: GuitarScene }) {
  const f = sc.fit;
  const a = f.arm.a;
  const b = f.arm.b;
  return (
    <Group opacity={0.94}>
      <Limb pts={[[a.x - 60, f.torso.max.z - 40], [a.x - 10, a.z + 10], [b.x - 20, b.z + 40]]} w={f.arm.r * 1.9} />
      <Hand x={b.x} y={b.z + 52} r={f.arm.r * 1.05} rot={10} />
    </Group>
  );
}

/** Lap style from the side (the engine's side view): seated behind, leaning
 *  over the instrument that lies face up across the thighs. In engine (x, y):
 *  y = −zG, so up is −y. */
export function PlayerLapSide({ sc }: { sc: GuitarScene }) {
  const f = sc.fit;
  const g = sc.g;
  const hx = f.head.c.x;
  const hy = -f.head.c.z; // engine y of the head
  const floor = sc.floorY;
  const D = g.depth;
  const torso = figPath([
    [hx - 230, hy + 140],
    [hx + 230, hy + 140],
    [hx + 210, D + 20],
    [hx - 210, D + 20],
  ]);
  const thigh = figPath([
    [hx - 260, D + 10],
    [hx + 330, D + 10],
    [hx + 330, D + 120],
    [hx - 260, D + 120],
  ]);
  const shin = [figPath([[hx + 230, D + 110], [hx + 320, D + 110], [hx + 300, floor - 30], [hx + 210, floor - 30]])];
  return (
    <Group>
      <Fig path={torso} from={[hx, hy]} to={[hx, D]} />
      <Fig path={thigh} from={[hx, D]} to={[hx, D + 120]} />
      {shin.map((p, i) => (
        <Fig key={`sh${i}`} path={p} from={[hx, D]} to={[hx, floor]} />
      ))}
      <Path path={rr(hx + 180, floor - 40, hx + 330, floor, 18)} color="#121317" />
      <Head cx={hx} cy={hy} r={f.head.r} />
    </Group>
  );
}

/** Lap style from above (the engine's top view, engine z = yG): the player
 *  sits on the bass side, toward −z. */
export function PlayerLapAbove({ sc }: { sc: GuitarScene }) {
  const f = sc.fit;
  const hx = f.head.c.x;
  const hz = f.head.c.y;
  const z0 = f.torso.min.y;
  const z1 = f.torso.max.y;
  const shoulders = figPath([
    [hx - 250, (z0 + z1) / 2],
    [hx - 200, z0 + 20],
    [hx + 200, z0 + 20],
    [hx + 250, (z0 + z1) / 2],
    [hx + 200, z1 + 10],
    [hx - 200, z1 + 10],
  ]);
  return (
    <Group>
      <Fig path={shoulders} from={[hx - 200, z0]} to={[hx + 200, z1]} />
      <Head cx={hx} cy={hz} r={f.head.r * 0.95} above />
    </Group>
  );
}

/* ═══════════════════════════ the lesson's art ═══════════════════════════ */

function Floor({ y, u0, u1 }: { y: number; u0: number; u1: number }) {
  return (
    <Group>
      <Path path={rr(u0, y, u1, y + 40, 0)}>
        <LinearGradient start={vec(0, y)} end={vec(0, y + 40)} colors={['#2b2c31', '#141519']} />
      </Path>
      <Line p1={vec(u0, y)} p2={vec(u1, y)} color="#4a4d56" strokeWidth={3} />
    </Group>
  );
}

/** Upright: the side view is the FRONT, the top view the instrument from
 *  above. Lap: the side view is the edge (flipped: the top faces up), the top
 *  view the face. */
export function GuitarSceneArt({ sc, view }: { sc: GuitarScene; view: ViewId }) {
  const lap = sc.o.lap;
  if (!lap && view === 'side') {
    return (
      <Group>
        <Floor y={sc.floorY} u0={sc.g.tail - 900} u1={sc.g.L + 1200} />
        <PlayerFrontBack sc={sc} />
        <GuitarFace sc={sc} />
        <PlayerFrontHands sc={sc} />
      </Group>
    );
  }
  if (!lap) {
    return (
      <Group>
        <PlayerAbove sc={sc} />
        <GuitarEdge sc={sc} />
        <PlayerAboveHands sc={sc} />
      </Group>
    );
  }
  if (view === 'side') {
    return (
      <Group>
        <Floor y={sc.floorY} u0={sc.g.tail - 900} u1={sc.g.L + 1200} />
        <PlayerLapSide sc={sc} />
        <Group transform={[{ scaleY: -1 }]}>
          <GuitarEdge sc={sc} />
        </Group>
      </Group>
    );
  }
  return (
    <Group>
      <PlayerLapAbove sc={sc} />
      <GuitarFace sc={sc} />
    </Group>
  );
}

/** Labels for a view, from the scene's anchors (mm of the view's u, v). */
export function guitarLabels(sc: GuitarScene, view: ViewId, extra?: (sc: GuitarScene, view: ViewId) => ArtLabel[]): ArtLabel[] {
  const g = sc.g;
  const sp = g.spec;
  const lap = sc.o.lap;
  const face = (!lap && view === 'side') || (lap && view === 'top');
  const out: ArtLabel[] = [];
  const openWord = sp.opening.kind === 'fholes' ? 'F-HOLES' : sp.opening.kind === 'coverplate' ? 'COVERPLATE' : sp.opening.kind === 'head' ? 'HEAD' : 'SOUND HOLE';
  if (face) {
    const below = g.lowerH + 26;
    out.push({ id: 'opening', text: openWord, short: openWord === 'SOUND HOLE' ? 'HOLE' : undefined, u: sp.body.pot ? sp.body.pot.cx.mm : g.hole.x, v: sp.opening.kind === 'fholes' ? -g.lowerH * 0.15 : sp.body.pot ? -60 : -g.hole.r - 34, align: 'center' });
    out.push({ id: 'bridge', text: 'BRIDGE', u: sp.bridge.x.mm, v: sp.body.pot ? below : sp.bridge.w.mm / 2 + 24, align: 'center' });
    if (sp.jointFret && sp.jointFret.mm !== 12) out.push({ id: 'fret12', text: '12TH FRET', short: '12TH', u: g.fret12, v: -g.boardHalf(g.fret12) - 30, align: 'center' });
    out.push({ id: 'joint', text: sp.jointFret?.mm === 12 ? 'NECK JOINT · 12TH FRET' : 'NECK JOINT', short: 'JOINT', u: g.edge, v: g.boardHalf(g.edge) + 34, align: 'center' });
    out.push({ id: 'head', text: 'HEADSTOCK', short: 'HEAD', u: g.L + sp.neck.headLen.mm * 0.55, v: -sp.neck.headLen.mm * 0.35 - 30, align: 'center', tone: 'muted' });
    out.push({ id: 'player', text: 'PLAYER', u: sc.fit.head.c.x, v: lap ? sc.fit.head.c.y : sc.fit.head.c.y - sc.fit.head.r - 24, align: 'center', tone: 'muted' });
  } else {
    if (!lap) {
      out.push({ id: 'top', text: sp.opening.kind === 'head' ? 'HEAD' : 'TOP', u: g.tail + 40, v: 26, align: 'left' });
      out.push({ id: 'back', text: 'BACK', u: g.tail + 40, v: -g.depth - 22, align: 'left', tone: 'muted' });
      out.push({ id: 'strings', text: 'STRINGS', u: (g.edge + g.L) / 2, v: g.h(g.edge) + 26, align: 'center' });
      out.push({ id: 'player', text: 'PLAYER', u: sc.fit.head.c.x, v: sc.fit.torso.min.z + 30, align: 'center', tone: 'muted' });
      out.push({ id: 'audience', text: 'AUDIENCE ↓', u: g.L + 60, v: 560, align: 'center', tone: 'muted' });
    } else {
      out.push({ id: 'top', text: 'TOP (FACING UP)', short: 'TOP', u: g.tail + 40, v: -28, align: 'left' });
      out.push({ id: 'player', text: 'PLAYER', u: sc.fit.head.c.x, v: -sc.fit.head.c.z - sc.fit.head.r - 24, align: 'center', tone: 'muted' });
    }
  }
  return [...out, ...(extra ? extra(sc, view) : [])];
}

/** The part under a model point (u, v) in a view; `tol` in mm. */
export function guitarHit(sc: GuitarScene, view: ViewId, u: number, vv: number, tol: number): string | null {
  const g = sc.g;
  const sp = g.spec;
  const id = (p: string) => partIdOf(sc.variant.id, p);
  const lap = sc.o.lap;
  const face = (!lap && view === 'side') || (lap && view === 'top');
  if (face) {
    const x = u;
    const y = vv;
    // headstock, board, strings
    if (x > g.L && x < g.L + sp.neck.headLen.mm + tol && Math.abs(y) < 60 + tol) return id('head');
    if (sp.fifth && Math.abs(x - sp.fifth.mm) < 16 + tol && y < -g.boardHalf(x) + 4 && y > -g.boardHalf(x) - 40 - tol) return id('fifth');
    if (x > g.boardEnd && x <= g.L && Math.abs(y) <= g.boardHalf(x) + tol) {
      const ys = g.stringYs(x);
      if (ys.some((q) => Math.abs(q - y) < 1.5 + tol * 0.25)) return id('strings');
      return x > g.edge ? id('neck') : id('board');
    }
    if (Math.abs(x - sp.bridge.x.mm) <= sp.bridge.l.mm / 2 + 4 + tol && Math.abs(y) <= sp.bridge.w.mm / 2 + tol) return id('bridge');
    if (sp.opening.kind === 'coverplate') {
      if (Math.hypot(x - sp.opening.x.mm, y) <= sp.opening.d.mm / 2 + tol) return id('coverplate');
      if (sp.opening.ports && Math.hypot(x - sp.opening.ports.x.mm, Math.abs(y) - sp.opening.ports.y.mm) <= sp.opening.ports.d.mm / 2 + tol) return id('ports');
    }
    if ((sp.opening.kind === 'round' || sp.opening.kind === 'oval') && ((x - g.hole.x) / (g.hole.r + tol)) ** 2 + (y / (g.hole.r2 + tol)) ** 2 <= 1) return id('opening');
    if (sp.opening.kind === 'fholes' && Math.abs(x - sp.opening.x.mm) <= sp.opening.d.mm / 2 + tol && Math.abs(Math.abs(y) - (sp.opening.d2?.mm ?? 60)) < 18 + tol) return id('opening');
    if (sp.body.pot) {
      const r = Math.hypot(x - sp.body.pot.cx.mm, y);
      const R = sp.body.pot.d.mm / 2;
      if (x < sp.body.pot.cx.mm - R + 80 && Math.abs(y) < 24 + tol) return id('tailpiece');
      if (Math.abs(r - R) < 8 + tol) return id('hooks');
      if (r < R) return id('top');
      if (sp.resonatorBack && r < sp.resonatorBack.d.mm / 2 + tol) return id('resonator');
    }
    if (sp.pickguard && x > g.hole.x - g.hole.r * 2 && x < g.hole.x + g.hole.r && y > g.hole.r * 0.5 && y < g.hole.r * 2.2) return id('pickguard');
    const inBody = y < 0 ? -y <= g.halfW(x, 'bass') + tol : y <= g.halfW(x, 'treble') + tol;
    if (inBody && x >= g.tail - tol && x <= g.edge + tol) return id('top');
    return null;
  }
  // edge views: z = vv (upright), or −vv (lap side view)
  const x = u;
  const z = lap ? -vv : vv;
  if (x > g.L && x < g.L + sp.neck.headLen.mm + tol && z < 30 + tol && z > -60 - tol) return id('head');
  if (x >= g.edge && x <= g.L && z > -34 - tol && z < g.h(x) + 6 + tol) return Math.abs(z - g.h(x)) < 4 + tol ? id('strings') : id('neck');
  if (x >= g.tail - tol && x <= g.edge + tol) {
    if (z > 0 && z < g.h(x) + 6 + tol && Math.abs(x - sp.bridge.x.mm) < sp.bridge.l.mm / 2 + 6 + tol) return id('bridge');
    if (z >= 0 && z < g.h(x) + 6 + tol) return id('strings');
    if (z > -g.depth - tol && z < 0 + tol) return Math.abs(z) < 8 + tol ? id('top') : id('sides');
    if (sp.resonatorBack && z < -g.depth && z > -g.depth - sp.resonatorBack.depth.mm - tol) return id('resonator');
  }
  return null;
}

/** The lesson art for a built guitar model: one scene per variant. */
export function makeGuitarArt(built: BuiltGuitarModel, extras?: { labels?: (sc: GuitarScene, view: ViewId) => ArtLabel[] }): Pick<LessonArt, 'Instrument' | 'labels' | 'hitTest'> {
  const scOf = (v: VariantId) => built.scenes[v] ?? built.scenes[built.model.defaultVariant];
  return {
    Instrument: ({ view, variant }) => <GuitarSceneArt sc={scOf(variant)} view={view} />,
    labels: (view, variant) => guitarLabels(scOf(variant), view, extras?.labels),
    hitTest: (view, variant, u, v, tol) => guitarHit(scOf(variant), view, u, v, tol),
  };
}

/** A small, dashed keep-out sketch is drawn by the engine (envelopes); this
 *  marks nothing extra. Exported for the stage plan: the instrument from
 *  above at its plan position. */
export function GuitarFromAbove({ sc, dim = 1 }: { sc: GuitarScene; dim?: number }) {
  return sc.o.lap ? <GuitarFace sc={sc} dim={dim} /> : <GuitarEdge sc={sc} dim={dim} />;
}

export const GUITAR_INK = INK;
export { DashPathEffect as _Dash };
export type { GuitarGeom };
