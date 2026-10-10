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
 *   the PLAYER   the shared illustrated player (lessons/shared/players),
 *                posed from the model's envelopes (guitarPlayer.ts), drawn in
 *                two layers round the instrument: body behind, the near arm
 *                and the hands in front (art pass 2026-10-05).
 *
 * ART PASS 2026-10-05 also: the top's form (edge shade, a lacquer sheen, a
 * lit binding), string and board shadows, fret crowns, real tuner buttons,
 * collision-aware labels with leaders, and the zones as label obstacles.
 *
 * Nothing moves (D8). Paths are built once per scene and cached. No brand
 * mark, inlay logo or likeness of a maker's design.
 */
import { BlurMask, Circle, DashPathEffect, Group, Line, LinearGradient, Path, PathOp, RadialGradient, Skia, vec } from '@shopify/react-native-skia';
import type { DocumentedZone, VariantId, ViewId } from '../../../engine/model/types.ts';
import { viewsOf } from '../../../engine/model/types.ts';
import type { ArtLabel, LessonArt } from '../../../engine/scene/sceneTypes.ts';
import { fretX, outlinePoly, type GuitarGeom } from './guitarSpec.ts';
import { partIdOf, type BuiltGuitarModel, type GuitarScene } from './guitarModel.ts';
import { guitarPlayerPose } from './guitarPlayer.ts';
import type { PlayerPose } from '../players/playerPose.ts';
import { figureCovers, PlayerBehind, PlayerInFront } from '../players/PlayerFigure';

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

/** The headstock's half-width (drawing default, as buildFace draws it). */
function headWOf(sp: GuitarScene['g']['spec']): number {
  return sp.neck.head === 'slotted' || sp.neck.head === 'banjo' ? 39 : sp.neck.head === 'paddle' ? 30 : sp.strings.perCourse === 2 && sp.strings.courses === 6 ? 48 : sp.strings.courses <= 4 ? 40 : 43;
}
/** …and its edge at `dx` mm past the nut (the tuners' shafts leave there). */
function headHalfAt(sp: GuitarScene['g']['spec'], dx: number): number {
  const hw = headWOf(sp);
  const hl = sp.neck.headLen.mm;
  const t = Math.max(0, Math.min(1, (dx / hl - 0.12) / (0.96 - 0.12)));
  if (sp.neck.head === 'banjo') return hw * (dx / hl < 0.55 ? 0.95 : 1.05);
  return hw * (1 + t * ((sp.neck.head === 'paddle' ? 0.95 : 1.06) - 1));
}

/* ═══════════════════════════════ FACE ═══════════════════════════════ */

/** Tailpiece lengths along the top (mm, drawing defaults): a mandolin's
 *  stamped cover, a resonator's plate tailpiece. */
const MANDO_TAIL_L = 85;
const RESO_TAIL_L = 70;

/** One carved f-hole, face-on, centred at (cx, cy), `len` long along the
 *  strings; `s` = −1 bass side, +1 treble side (art pass 2026-10-10). */
function fHolePath(cx: number, cy: number, len: number, s: number): SkPath {
  const spread = 0.13 * len;
  const up = { x: cx + 0.44 * len, y: cy - s * spread };
  const lo = { x: cx - 0.44 * len, y: cy + s * spread };
  const c1 = { x: up.x - 0.45 * len, y: up.y };
  const c2 = { x: lo.x + 0.45 * len, y: lo.y };
  const at = (t: number) => ({
    x: (1 - t) ** 3 * up.x + 3 * (1 - t) ** 2 * t * c1.x + 3 * (1 - t) * t * t * c2.x + t ** 3 * lo.x,
    y: (1 - t) ** 3 * up.y + 3 * (1 - t) ** 2 * t * c1.y + 3 * (1 - t) * t * t * c2.y + t ** 3 * lo.y,
  });
  const left: [number, number][] = [];
  const right: [number, number][] = [];
  for (let i = 0; i <= 24; i++) {
    const t = 0.04 + (0.92 * i) / 24;
    const p = at(t);
    const q = at(Math.min(1, t + 0.01));
    const r = at(Math.max(0, t - 0.01));
    const tl = Math.hypot(q.x - r.x, q.y - r.y) || 1;
    const nx = -(q.y - r.y) / tl;
    const ny = (q.x - r.x) / tl;
    const wing = Math.exp(-(((t - 0.16) / 0.09) ** 2)) * 0.8 + Math.exp(-(((t - 0.84) / 0.09) ** 2));
    const w = len * (0.035 + 0.045 * wing);
    left.push([p.x + (nx * w) / 2, p.y + (ny * w) / 2]);
    right.push([p.x - (nx * w) / 2, p.y - (ny * w) / 2]);
  }
  const f = polyPath([...left, ...right.reverse()]);
  f.addCircle(up.x, up.y, 0.055 * len);
  f.addCircle(lo.x, lo.y, 0.075 * len);
  return f;
}

/** An F-style mandolin's ornaments (G frame, mm; drawing defaults sized to
 *  its 254 mm body): the SCROLL on the bass side (−y) of the upper body — a
 *  volute ~50 mm across rising off the rim and curling back toward the
 *  neck heel, with its carved spiral and the open eye under it — and three
 *  POINTS, one on the treble side of the upper body aimed at the neck, one
 *  on each side of the lower body. */
function mandoFOrnaments(g: GuitarGeom): { solids: SkPath[]; spiral: SkPath; eye: SkPath } {
  const hb = (x: number) => g.halfW(x, 'bass');
  const ht = (x: number) => g.halfW(x, 'treble');
  const solids: SkPath[] = [];
  // The scroll: from the rim ~125 mm short of the heel, out round a volute
  // (radius 25) beside the upper body, and back onto the body at the heel.
  const vc = { x: g.edge - 42, y: -hb(g.edge - 70) - 22 };
  const R = 25;
  const sc = make();
  sc.moveTo(g.edge - 125, -hb(g.edge - 125) + 2);
  sc.cubicTo(g.edge - 100, -hb(g.edge - 100) - 18, vc.x - R * 1.2, vc.y - R * 1.05, vc.x, vc.y - R);
  sc.cubicTo(vc.x + R * 0.6, vc.y - R, vc.x + R, vc.y - R * 0.55, vc.x + R, vc.y);
  sc.cubicTo(vc.x + R, vc.y + R * 0.5, vc.x + R * 0.6, vc.y + R * 0.9, vc.x + R * 0.1, vc.y + R * 0.95);
  sc.lineTo(g.edge - 6, -hb(g.edge - 6) + 1);
  sc.lineTo(g.edge - 140, -hb(g.edge - 140) + 14);
  sc.close();
  solids.push(sc);
  const spiral = make();
  for (let i = 0; i <= 40; i++) {
    const a = -Math.PI / 2 + (i / 40) * Math.PI * 2.6;
    const r = R * (0.82 - (0.62 * i) / 40);
    const x = vc.x + r * Math.cos(a);
    const y = vc.y + r * Math.sin(a);
    if (i === 0) spiral.moveTo(x, y);
    else spiral.lineTo(x, y);
  }
  // The open eye between the volute's inner turn and the rim.
  const eye = oval(vc.x - R * 0.35, vc.y + R * 0.78, R * 0.42, R * 0.22);
  // A point: a spike off the rim at x, its tip `dx` along and `out` beyond the rim.
  // Each point swells off the rim and sweeps to its tip (a carved horn, not a thorn).
  const spike = (x: number, side: -1 | 1, dx: number, out: number) => {
    const h = side < 0 ? hb : ht;
    const p = make();
    const tip = { x: x + dx, y: side * (h(x) + out) };
    p.moveTo(x - 34, side * (h(x - 34) - 4));
    p.cubicTo(x - 14, side * (h(x - 14) + out * 0.55), tip.x - dx * 0.35, tip.y - side * out * 0.05, tip.x, tip.y);
    p.cubicTo(tip.x - dx * 0.25, tip.y - side * out * 0.55, x + 8, side * (h(x + 8) + 2), x + 18, side * (h(x + 18) - 4));
    p.close();
    return p;
  };
  solids.push(spike(g.edge - 72, 1, 40, 16));
  solids.push(spike(g.tail + 92, -1, 26, 15));
  solids.push(spike(g.tail + 92, 1, 26, 15));
  return { solids, spiral, eye };
}

function buildFace(sc: GuitarScene) {
  const g = sc.g;
  const sp = g.spec;
  const isMando = sp.id.startsWith('mando');
  // An F-style mandolin's carved outline: the teardrop, its SCROLL on the
  // bass side of the upper body, a point on the treble side of the upper
  // body and a point on each side of the lower body (art pass 2026-10-10).
  const fStyle = sp.id === 'mandoF' ? mandoFOrnaments(g) : null;
  let outline = polyPath(outlinePoly(g, 96));
  if (fStyle) for (const q of fStyle.solids) outline = Skia.Path.MakeFromOp(outline, q, PathOp.Union) ?? outline;
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
  const headW = headWOf(sp);
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
  const startX = sp.bridge.kind === 'tieblock' ? sp.bridge.x.mm - sp.bridge.l.mm / 2 + 4 : sp.bridge.kind === 'banjo' || sp.bridge.kind === 'floating' ? (sp.body.pot ? sp.body.pot.cx.mm - sp.body.pot.d.mm / 2 + 56 : isMando ? g.tail + MANDO_TAIL_L - 6 : g.tail + 22) : sp.bridge.kind === 'spider' || sp.bridge.kind === 'biscuit' ? g.tail + RESO_TAIL_L - 8 : sp.bridge.x.mm - 6;
  const strings: { path: SkPath; w: number; color: string }[] = [];
  const nStr = ys0.length;
  for (let k = 0; k < nStr; k++) {
    const p = make();
    const course = sp.strings.perCourse === 2 ? Math.floor(k / 2) : k;
    // A five-string banjo's short fifth string (course 0) runs to its own
    // peg on the neck (drawn below), not to the peghead.
    if (sp.fifth && course === 0) continue;
    const wound = course - (sp.fifth ? 1 : 0) < sp.strings.wound;
    p.moveTo(startX, ys0[k] * (sp.bridge.kind === 'banjo' || sp.bridge.kind === 'floating' || sp.bridge.kind === 'spider' ? 0.6 : 1));
    p.lineTo(sp.bridge.x.mm, ys0[k]);
    p.lineTo(g.L, ysN[k]);
    // On to a post on its side of the headstock (bass strings to −y): on
    // each side the OUTER string takes the post nearest the nut and the
    // inner ones the posts beyond, so no string crosses another (the
    // treble side counted from its outer edge; art pass 2026-10-10).
    const c0 = sp.fifth ? 1 : 0; // the banjo's peghead carries courses 1 … 4
    const nHead = sp.strings.courses - c0;
    const ch = course - c0;
    const bassSide = ch < nHead / 2;
    const idx = bassSide ? ch % perSide : (nHead - 1 - ch) % perSide;
    const post = posts.filter((q) => q.side === (bassSide ? -1 : 1))[Math.min(perSide - 1, idx)] ?? posts[0];
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
  // The fifth string's geared peg, out of the neck's bass side at its fret.
  const fifthPeg = sp.fifth ? { x: sp.fifth.mm + 6, y: -g.boardHalf(sp.fifth.mm) - 16 } : null;
  // Pickguard: a teardrop on the treble side, between the hole and the waist.
  let guard: SkPath | null = null;
  if (sp.pickguard && isMando) {
    // A mandolin's ELEVATED FINGER REST: a long comma of tortoiseshell on
    // the treble side, held off the top on a bracket at the fingerboard's
    // end, following the rim ~9 mm in and tapering to a point by the bridge.
    const x0 = sp.bridge.x.mm + 22;
    const x1 = g.boardEnd + 6;
    const outer: [number, number][] = [];
    const inner: [number, number][] = [];
    for (let i = 0; i <= 24; i++) {
      const x = x0 + ((x1 - x0) * i) / 24;
      const yo = g.halfW(x, 'treble') - 9;
      const wdt = Math.min(36, 6 + 34 * Math.sin((Math.PI / 2) * Math.min(1, i / 9)));
      const yi = Math.max(g.boardHalf(x) + 4, yo - wdt);
      outer.push([x, yo]);
      inner.push([x, yi]);
    }
    guard = polyPath([...outer, ...inner.reverse()]);
  } else if (sp.pickguard && (op.kind === 'round' || op.kind === 'oval')) {
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
    // Two carved f-holes, mirrored about the centre line (drawing default
    // place), cut as the violin family's are: an S stem flaring into wings,
    // the small eye toward the neck and nearer the centre, the larger eye
    // toward the tail and farther out.
    const f = make();
    const cx = op.x.mm;
    const len = op.d.mm;
    const off = op.d2 ? op.d2.mm : 60;
    for (const s of [-1, 1]) f.addPath(fHolePath(cx, s * off, len, s));
    fholes = f;
  }
  // A resonator: the coverplate (a perforated disc), its palm plate, ports.
  let cover: { disc: SkPath; holes: SkPath; palm: SkPath; ports: SkPath; mesh: SkPath } | null = null;
  if (op.kind === 'coverplate') {
    const cx = op.x.mm;
    const r = op.d.mm / 2;
    // The coverplate's sound wells: nine groups round the plate, each a fan
    // of small holes (the classic "sieve"), between a plain rim and the palm
    // plate over the bridge (art pass 2026-10-10).
    const holes = make();
    for (let k = 0; k < 9; k++) {
      const a0 = (k / 9) * Math.PI * 2 + Math.PI / 9;
      for (const [rr0, n, dd] of [[0.84, 3, 3.6], [0.73, 3, 3.6], [0.62, 2, 3.4]] as const) {
        for (let j = 0; j < n; j++) {
          const a = a0 + (j - (n - 1) / 2) * (0.085 / rr0);
          holes.addCircle(cx + r * rr0 * Math.cos(a), r * rr0 * Math.sin(a), dd);
        }
      }
    }
    const palm = rr(cx - 30, -r * 0.5, cx + 30, r * 0.5, 22);
    const ports = make();
    const mesh = make();
    if (op.ports) {
      for (const s of [-1, 1]) {
        const px = op.ports.x.mm;
        const pr = op.ports.d.mm / 2;
        // Each screened port sits wholly on the upper bout, ~14 mm in from its rim.
        const py = s * Math.min(op.ports.y.mm, g.halfW(px, s < 0 ? 'bass' : 'treble') - pr - 14);
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
    // The tailpiece: ~60 mm from the tail-side rim over the head, ending
    // ~35 mm short of the bridge.
    const tail = polyPath([
      [tp - 6, -14],
      [tp + 52, -10],
      [tp + 60, 0],
      [tp + 52, 10],
      [tp - 6, 14],
    ]);
    const arm = make();
    arm.addArc(Skia.XYWHRect(cx - r - 10, -r - 10, (r + 10) * 2, (r + 10) * 2), 200, 60);
    banjo = { head: oval(cx, 0, r - 6, r - 6), hoop: oval(cx, 0, r, r), hooks, flange: fl > r ? oval(cx, 0, fl, fl) : null, tail, arm };
  }
  // A mandolin's tailpiece (its strings anchor at the tail): a stamped
  // cover ~85 mm long, 26 mm wide at the end pin flaring to 46 mm at its
  // rounded bridge end; a resonator's: a plate tailpiece ~70 mm long.
  const mandoTail = isMando
    ? polyPath([
        [g.tail - 5, -13],
        [g.tail + MANDO_TAIL_L * 0.55, -19],
        [g.tail + MANDO_TAIL_L - 6, -23],
        [g.tail + MANDO_TAIL_L, -14],
        [g.tail + MANDO_TAIL_L + 2, 0],
        [g.tail + MANDO_TAIL_L, 14],
        [g.tail + MANDO_TAIL_L - 6, 23],
        [g.tail + MANDO_TAIL_L * 0.55, 19],
        [g.tail - 5, 13],
      ])
    : sp.bridge.kind === 'spider' || sp.bridge.kind === 'biscuit'
      ? polyPath([
          [g.tail - 4, -16],
          [g.tail + RESO_TAIL_L - 10, -26],
          [g.tail + RESO_TAIL_L, -22],
          [g.tail + RESO_TAIL_L, 22],
          [g.tail + RESO_TAIL_L - 10, 26],
          [g.tail - 4, 16],
        ])
      : null;
  // F-style points and scroll (drawing default ornaments on the bass side).
  // The scroll's carved spiral and its eye (F-style).
  const scroll: SkPath | null = fStyle ? fStyle.spiral : null;
  const scrollEye: SkPath | null = fStyle ? fStyle.eye : null;
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
  } else if (b.kind === 'floating') {
    // An adjustable mandolin bridge seen from the front: the foot (base)
    // fitted to the top, ~70 × 12 mm, the saddle across the strings, and a
    // thumbwheel on its post at each end.
    const w = b.w.mm / 2;
    bridge = polyPath([
      [b.x.mm - 6, -w],
      [b.x.mm + 6, -w],
      [b.x.mm + 5, -w * 0.55],
      [b.x.mm + 5, w * 0.55],
      [b.x.mm + 6, w],
      [b.x.mm - 6, w],
      [b.x.mm - 5, w * 0.55],
      [b.x.mm - 5, -w * 0.55],
    ]);
    const sy = g.stringYs(0);
    saddle = rr(b.x.mm - 1.4, sy[0] - 5, b.x.mm + 1.4, sy[sy.length - 1] + 5, 1);
    for (const y of [sy[0] - 8, sy[sy.length - 1] + 8]) pins.push({ x: b.x.mm, y });
  } else if (b.kind === 'banjo') {
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
  return { outline, board, boardEndArc, frets, marks, headPath, slots, posts, strings, guard, ros, hole, fholes, cover, banjo, mandoTail, scroll, scrollEye, bridge, saddle, pins, grain, fifthPeg };
}

export function GuitarFace({ sc, dim = 1 }: { sc: GuitarScene; dim?: number }) {
  const key = `${sc.variant.spec.id}|${sc.variant.id}|${sc.variant.posture}`;
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
          {/* form: the arched top darkens toward its edge, and catches the
              light on the upper-left of the lower bout (a lacquer sheen) */}
          <Group clip={P.outline}>
            <Path path={P.outline} style="stroke" strokeWidth={30} color="#2a1608" opacity={0.28}>
              <BlurMask blur={12} style="normal" />
            </Path>
          </Group>
          <Path path={P.outline}>
            <RadialGradient c={vec(sp.body.xLower.mm - g.lowerH * 0.25, -g.lowerH * 0.45)} r={g.lowerH * 1.15} colors={['rgba(255,248,228,0.30)', 'rgba(255,248,228,0)']} />
          </Path>
          {/* binding: a cream line inside a dark edge, lit on the upper left */}
          <Path path={P.outline} style="stroke" strokeWidth={4.5} color="#2a1a0e" />
          <Path path={P.outline} style="stroke" strokeWidth={2} color={BINDING} />
          <Path path={P.outline} style="stroke" strokeWidth={2.4} opacity={0.8}>
            <LinearGradient start={tl} end={vec((g.tail + g.edge) / 2, 0)} colors={['#ffffff', 'rgba(255,255,255,0)']} />
          </Path>
        </>
      )}
      {P.ros ? <Path path={P.ros} style="stroke" strokeWidth={2.2} color="#3a2414" opacity={0.85} /> : null}
      {P.hole ? (
        <>
          <Path path={P.hole}>
            <RadialGradient c={vec(g.hole.x - g.hole.r * 0.3, -g.hole.r * 0.3)} r={g.hole.r * 1.2} colors={HOLE} />
          </Path>
          {/* the top's thickness, lit on the far (lower-right) edge of the hole */}
          <Path path={P.hole} style="stroke" strokeWidth={2.2} opacity={0.75}>
            <LinearGradient start={vec(g.hole.x - g.hole.r * 0.5, -g.hole.r * 0.5)} end={vec(g.hole.x + g.hole.r * 0.7, g.hole.r * 0.7)} colors={['rgba(0,0,0,0)', '#d9b67a']} />
          </Path>
        </>
      ) : null}
      {P.fholes ? <Path path={P.fholes} color="#0d0805" /> : null}
      {P.scrollEye ? <Path path={P.scrollEye} color="#0d0805" /> : null}
      {P.scroll ? <Path path={P.scroll} style="stroke" strokeWidth={2.2} strokeCap="round" color="#3a2414" opacity={0.85} /> : null}
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
        // held inside the top's outline (a cutaway body's scoop trims it)
        <Group clip={P.outline}>
          <Path path={P.guard}>
            <LinearGradient start={vec(g.hole.x - 80, 20)} end={vec(g.hole.x + 40, 140)} colors={TORTOISE} />
          </Path>
          <Path path={P.guard} style="stroke" strokeWidth={0.8} color="#1a0b05" opacity={0.6} />
        </Group>
      ) : null}
      {P.mandoTail ? (
        <Group>
          <Path path={P.mandoTail} color="#000" opacity={0.4} transform={[{ translateX: 1.5 }, { translateY: 3 }]}>
            <BlurMask blur={3} style="normal" />
          </Path>
          <Path path={P.mandoTail}>
            <LinearGradient start={vec(g.tail, -24)} end={vec(g.tail + 60, 24)} colors={CHROME} />
          </Path>
          <Path path={P.mandoTail} style="stroke" strokeWidth={1.2} color="#5d626d" />
        </Group>
      ) : null}
      {/* the bridge */}
      <Path path={P.bridge}>
        <LinearGradient start={vec(sp.bridge.x.mm - 20, -sp.bridge.w.mm / 2)} end={vec(sp.bridge.x.mm + 20, sp.bridge.w.mm / 2)} colors={sp.bridge.kind === 'banjo' ? ['#e7c48a', '#c99a5a', '#8f6532'] : ROSEWOOD} />
      </Path>
      {P.saddle ? <Path path={P.saddle} color={BONE} /> : null}
      {P.pins.map((q, i) =>
        sp.bridge.kind === 'floating' ? (
          // the adjustable bridge's thumbwheels, knurled nickel
          <Group key={`pin${i}`}>
            <Circle cx={q.x} cy={q.y} r={5.2}>
              <RadialGradient c={vec(q.x - 1.6, q.y - 1.6)} r={6} colors={['#ffffff', NICKEL, '#6b707b']} />
            </Circle>
            <Circle cx={q.x} cy={q.y} r={5.2} style="stroke" strokeWidth={0.8} color="#3a3d45" />
          </Group>
        ) : (
          <Circle key={`pin${i}`} cx={q.x} cy={q.y} r={sp.strings.perCourse === 2 ? 1.6 : 2.6} color={sp.strings.nylon ? BONE : '#f1ead8'} />
        ),
      )}
      {/* the neck: fingerboard, frets, marks, nut, headstock */}
      {/* the board's own shadow on the top, then the board */}
      <Path path={P.board} color="#000" opacity={0.35} transform={[{ translateX: 2 }, { translateY: 4 }]}>
        <BlurMask blur={4} style="normal" />
      </Path>
      <Path path={P.board}>
        <LinearGradient start={vec(g.boardEnd, -30)} end={vec(g.boardEnd + 60, 30)} colors={ROSEWOOD} />
      </Path>
      <Line p1={vec(g.boardEnd, -g.boardHalf(g.boardEnd) + 0.8)} p2={vec(g.L, -g.boardHalf(g.L) + 0.8)} color="#7a5638" strokeWidth={1.2} opacity={0.9} />
      {/* frets: a dark seat under a bright crown */}
      <Path path={P.frets} style="stroke" strokeWidth={2} color="#2a2c32" transform={[{ translateX: -0.8 }]} />
      <Path path={P.frets} style="stroke" strokeWidth={1.3} color="#dfe3ea" />
      {P.marks.map((m, i) => (
        <Circle key={`mk${i}`} cx={m.x} cy={m.y} r={3.2} color="#ece4d2" />
      ))}
      <Line p1={vec(g.L, -g.boardHalf(g.L))} p2={vec(g.L, g.boardHalf(g.L))} color={BONE} strokeWidth={4} />
      <Path path={P.headPath}>
        <LinearGradient start={vec(g.L, -40)} end={vec(g.L + sp.neck.headLen.mm, 40)} colors={sp.neck.head === 'banjo' ? ['#3a2014', '#2a170f', '#1c0f08'] : MAHOGANY} />
      </Path>
      <Path path={P.headPath}>
        <LinearGradient start={vec(g.L, -40)} end={vec(g.L + sp.neck.headLen.mm * 0.5, 10)} colors={['rgba(255,220,180,0.22)', 'rgba(255,220,180,0)']} />
      </Path>
      <Path path={P.slots} color="#0d0906" />
      <Path path={P.headPath} style="stroke" strokeWidth={1.2} color="#120b06" />
      {P.posts.map((q, i) => {
        // The tuner: a shaft out of the headstock's edge to a button, and
        // the post through the face in its bushing.
        const hw = headHalfAt(sp, q.x - g.L);
        // A ukulele's friction-peg buttons are smaller (~13 × 18 mm).
        const bw = sp.id === 'uke' ? 6.5 : 8;
        const bh = sp.id === 'uke' ? 9 : 11;
        const by = q.side * (hw + 2 + bh);
        const metal = sp.strings.nylon ? ['#fbf6ea', '#e6dcc4', '#bfb193'] : CHROME;
        return (
          <Group key={`post${i}`}>
            <Path path={rr(q.x - 2.2, q.side * (hw - 2), q.x + 2.2, q.side * (hw + 6), 1)} color="#9aa0ab" />
            <Path path={oval(q.x, by, bw, bh)}>
              <LinearGradient start={vec(q.x - bw, by - bh)} end={vec(q.x + bw, by + bh)} colors={metal} />
            </Path>
            <Path path={oval(q.x, by, bw, bh)} style="stroke" strokeWidth={0.9} color="#4a4e57" />
            <Circle cx={q.x} cy={q.y * 0.72} r={5.4} color="#6b707b" />
            <Circle cx={q.x} cy={q.y * 0.72} r={3.4}>
              <RadialGradient c={vec(q.x - 1.4, q.y * 0.72 - 1.4)} r={4} colors={['#ffffff', NICKEL, '#8a909b']} />
            </Circle>
          </Group>
        );
      })}
      {P.fifthPeg ? (
        <Group>
          <Path path={rr(P.fifthPeg.x - 2, P.fifthPeg.y + 2, P.fifthPeg.x + 2, P.fifthPeg.y + 12, 1)} color="#9aa0ab" />
          <Path path={oval(P.fifthPeg.x, P.fifthPeg.y - 4, 5, 7)}>
            <LinearGradient start={vec(P.fifthPeg.x - 5, P.fifthPeg.y - 11)} end={vec(P.fifthPeg.x + 5, P.fifthPeg.y + 3)} colors={CHROME} />
          </Path>
          <Path path={oval(P.fifthPeg.x, P.fifthPeg.y - 4, 5, 7)} style="stroke" strokeWidth={0.8} color="#4a4e57" />
        </Group>
      ) : null}
      {/* string shadows on the top and the board (light from the upper left) */}
      <Group transform={[{ translateX: 1.4 }, { translateY: 2.6 }]} opacity={0.32}>
        {P.strings.map((s, i) => (
          <Path key={`ss${i}`} path={s.path} style="stroke" strokeWidth={s.w * 1.4} color="#000" />
        ))}
      </Group>
      {P.strings.map((s, i) => (
        <Path key={`s${i}`} path={s.path} style="stroke" strokeWidth={s.w} color={s.color} />
      ))}
    </Group>
  );
}

/* ═══════════════════════════════ EDGE ═══════════════════════════════ */

/** The body seen edge-on from the bass side (x along the strings, z out of
 *  the top; the top at z = 0, the back at −depth): the tapered rim with a
 *  domed back, or a carved body's arched top and back. */
function rimPath(tail: number, edge: number, D: number, carved: boolean): SkPath {
  const p = make();
  const L = edge - tail;
  const r = 9;
  if (carved) {
    const rim = D * 0.55;
    const arch = (D - rim) / 2;
    p.moveTo(tail, -arch);
    p.cubicTo(tail + L * 0.18, arch * 0.6, tail + L * 0.62, arch * 0.9, edge, -arch * 0.4);
    p.lineTo(edge, -arch - rim + arch * 0.4);
    p.cubicTo(tail + L * 0.62, -D - arch * 0.2, tail + L * 0.18, -D - arch * 0.1, tail, -arch - rim);
    p.close();
    return p;
  }
  const Dn = D * 0.82;
  p.moveTo(tail + r, 0);
  p.lineTo(edge - r, 0);
  p.quadTo(edge, 0, edge, -r);
  p.lineTo(edge, -Dn + r);
  p.quadTo(edge, -Dn, edge - r, -Dn - 0.4);
  // The back: a shallow dome (≈ 0.035 of the depth proud at its middle).
  p.cubicTo(edge - L * 0.35, -Dn - D * 0.05 - (D - Dn) * 0.35, tail + L * 0.3, -D - D * 0.035, tail + r, -D);
  p.quadTo(tail, -D, tail, -D + r);
  p.lineTo(tail, -r);
  p.quadTo(tail, 0, tail + r, 0);
  p.close();
  return p;
}

function buildEdge(sc: GuitarScene) {
  const g = sc.g;
  const sp = g.spec;
  const D = g.depth;
  // The sides, seen from above the bass edge: a band from the tail to the
  // neck end, its ends rounded.
  // ART PASS 2026-10-10: the rim is deeper at the tail block than at the
  // neck block (a dreadnought ~124 → ~100 mm: the neck end at 0.82 of the
  // tail's depth), the back slightly domed, the end blocks' corners rounded
  // by the binding; a carved mandolin's top and back are arched (~12 mm
  // each over a ~25 mm rim).
  const carved = sp.id.startsWith('mando');
  const sides = sp.body.pot ? rr(g.tail, -D, g.edge, 0, 8) : rimPath(g.tail, g.edge, D, carved);
  const back = sp.resonatorBack ? rr(sp.body.pot!.cx.mm - sp.resonatorBack.d.mm / 2, -D - sp.resonatorBack.depth.mm, sp.body.pot!.cx.mm + sp.resonatorBack.d.mm / 2, -D + 4, 26) : null;
  const neck = make();
  // Fingerboard on top of the neck shaft, the heel at the body.
  const hE = g.h(g.edge);
  // The neck shaft under the fingerboard: ~21 mm deep at the nut, ~25 mm
  // by the body, then the heel sweeping down to the back of the neck block
  // (art pass 2026-10-10: was ~40 mm deep, a plank).
  const bTop = hE - 6;
  const nutBack = bTop - 6 - (sp.id.startsWith('mando') || sp.id === 'uke' ? 17 : sp.id === 'bass' ? 23 : 21);
  const heelBack = nutBack - 4;
  neck.moveTo(g.edge, bTop);
  neck.lineTo(g.L, bTop);
  neck.lineTo(g.L, nutBack);
  neck.cubicTo(g.L - 120, nutBack - 1, g.edge + 140, heelBack, g.edge + 60, heelBack);
  neck.cubicTo(g.edge + 22, heelBack - 1, g.edge + 4, -D * 0.45, g.edge - 1, -D * 0.72);
  neck.close();
  const board = rr(g.boardEnd, hE - 12, g.L, hE - 6, 1.5);
  // The headstock, tilted back from the nut (drawing default 14°; a banjo's
  // and a slotted head's less).
  const tilt = (sp.neck.head === 'banjo' ? 6 : sp.neck.head === 'slotted' ? 12 : 14) * DEG;
  const hl = sp.neck.headLen.mm;
  const hx = g.L + hl * Math.cos(tilt);
  const hz = bTop - hl * Math.sin(tilt);
  // The headstock plate (~15 mm thick), its face continuing the fingerboard's line.
  const head = polyPath([
    [g.L, bTop],
    [hx, hz],
    [hx, hz - 15],
    [g.L, bTop - 17],
  ]);
  const strings = make();
  const bz = sp.opening.kind === 'coverplate' ? 18 : 11;
  strings.moveTo(sp.bridge.x.mm, bz);
  strings.lineTo(g.L, bTop + 1.5);
  strings.lineTo(g.L + hl * 0.5 * Math.cos(tilt), bTop + 1 - hl * 0.5 * Math.sin(tilt));
  const bridge = rr(sp.bridge.x.mm - sp.bridge.l.mm / 2, 0, sp.bridge.x.mm + sp.bridge.l.mm / 2, bz - 2, 2);
  const cover = sp.opening.kind === 'coverplate' ? rr(sp.opening.x.mm - sp.opening.d.mm / 2, 0, sp.opening.x.mm + sp.opening.d.mm / 2, 7, 3) : null;
  const tuners = make();
  for (let k = 0; k < sp.neck.tuners; k++) {
    const x = g.L + hl * (0.22 + (0.66 * (k + 0.5)) / sp.neck.tuners) * Math.cos(tilt);
    // The gear housings on the back of the headstock.
    const z = bTop - (x - g.L) * Math.tan(tilt) - 15;
    tuners.addRRect(Skia.RRectXY(Skia.XYWHRect(x - 6, z - 12, 12, 12), 3, 3));
  }
  return { sides, back, neck, board, head, strings, bridge, cover, tuners, hE };
}

export function GuitarEdge({ sc, dim = 1 }: { sc: GuitarScene; dim?: number }) {
  const key = `${sc.variant.spec.id}|${sc.variant.id}|${sc.variant.posture}`;
  let P = edgeCache.get(key);
  if (!P) {
    P = buildEdge(sc);
    edgeCache.set(key, P);
  }
  const g = sc.g;
  const sp = g.spec;
  const D = g.depth;
  // Wood sides for every body here (the resonator's face is drawn as a wood
  // top, so its rim is wood too: a wood-bodied resonator).
  const sideWood = sp.body.pot ? ['#7a4a26', '#5b3519', '#3a210f'] : sp.id.startsWith('mando') ? ['#b9763c', '#8a5025', '#5a3014'] : MAHOGANY;
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
      {sp.id.startsWith('mando') ? null : <Line p1={vec(g.tail + 10, -1.5)} p2={vec(g.edge - 6, -1.5)} color={sp.body.pot ? '#d8dbe2' : BINDING} strokeWidth={3} />}
      {sp.id.startsWith('mando') ? null : <Line p1={vec(g.tail + 10, -D + 1.5)} p2={vec(g.edge - 8, -D * 0.82 + 1.5)} color={sp.body.pot ? '#d8dbe2' : BINDING} strokeWidth={2.4} />}
      {P.cover ? (
        <Path path={P.cover}>
          <LinearGradient start={vec(0, 0)} end={vec(0, 7)} colors={CHROME} />
        </Path>
      ) : null}
      <Path path={P.neck}>
        <LinearGradient start={vec(g.edge, -30)} end={vec(g.edge, 20)} colors={MAHOGANY} />
      </Path>
      <Path path={P.board}>
        <LinearGradient start={vec(0, P.hE - 12)} end={vec(0, P.hE - 6)} colors={ROSEWOOD} />
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

/** The shared player's pose for a scene and view (cached per scene): every
 *  joint from the model's envelopes (guitarPlayer.ts). */
const poseCache = new Map<string, PlayerPose>();
export function playerPoseOf(sc: GuitarScene, view: ViewId): PlayerPose {
  const key = `${sc.variant.spec.id}|${sc.variant.id}|${sc.variant.posture}|${view}`;
  let p = poseCache.get(key);
  if (!p) {
    p = guitarPlayerPose(sc, view === 'side' ? 'side' : 'top');
    poseCache.set(key, p);
  }
  return p;
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
  const pose = playerPoseOf(sc, view);
  // The player in two layers round the instrument (shared/players).
  if (!lap && view === 'side') {
    return (
      <Group>
        <Floor y={sc.floorY} u0={sc.g.tail - 900} u1={sc.g.L + 1200} />
        <PlayerBehind pose={pose} />
        <GuitarFace sc={sc} />
        <PlayerInFront pose={pose} />
      </Group>
    );
  }
  if (!lap) {
    return (
      <Group>
        <PlayerBehind pose={pose} />
        <GuitarEdge sc={sc} />
        <PlayerInFront pose={pose} />
      </Group>
    );
  }
  if (view === 'side') {
    return (
      <Group>
        <Floor y={sc.floorY} u0={sc.g.tail - 900} u1={sc.g.L + 1200} />
        <PlayerBehind pose={pose} />
        <Group transform={[{ scaleY: -1 }]}>
          <GuitarEdge sc={sc} />
        </Group>
        <PlayerInFront pose={pose} />
      </Group>
    );
  }
  return (
    <Group>
      <PlayerBehind pose={pose} />
      <GuitarFace sc={sc} />
      <PlayerInFront pose={pose} />
    </Group>
  );
}

type Place = { u: number; v: number; align: 'left' | 'center' | 'right' };
/** A part's label with its leader point and its fall-back places: beside
 *  the part first, then a little farther off (with a leader back to it). */
function partLabel(id: string, text: string, short: string | undefined, at: { u: number; v: number }, places: Place[], tone?: 'muted'): ArtLabel {
  const [first, ...alts] = places;
  return { id, text, ...(short ? { short } : {}), ...first, alts, at, ...(tone ? { tone } : {}) };
}

/**
 * Labels for a view, from the scene's anchors (mm of the view's u, v).
 * ART PASS 2026-10-05: every label names its part's point (`at`) and offers
 * places OUTSIDE the instrument's outline — above it, below it, then farther
 * out with a leader — so the scene's layout (labelLayout.fitLabels) can keep
 * the words off the mic, the suggested starting points and each other.
 * `box` is the view's frame, so no label is placed off the glass.
 */
export function guitarLabels(sc: GuitarScene, view: ViewId, extra?: (sc: GuitarScene, view: ViewId) => ArtLabel[], box?: { u0: number; u1: number; v0: number; v1: number }): ArtLabel[] {
  const g = sc.g;
  const sp = g.spec;
  const lap = sc.o.lap;
  const face = (!lap && view === 'side') || (lap && view === 'top');
  const out: ArtLabel[] = [];
  const openWord = sp.opening.kind === 'fholes' ? 'F-HOLES' : sp.opening.kind === 'coverplate' ? 'COVERPLATE' : sp.opening.kind === 'head' ? 'HEAD' : 'SOUND HOLE';
  const openShort = openWord === 'SOUND HOLE' ? 'HOLE' : openWord === 'COVERPLATE' ? 'COVER' : undefined;
  const vIn = (v: number) => (box ? Math.max(box.v0 + 16, Math.min(box.v1 - 14, v)) : v);
  // The outline's upper (bass, −y) and lower (treble, +y) edge at x, the
  // neck's edges beyond the body.
  const upper = (x: number) => (x > g.edge ? -g.boardHalf(x) : -Math.max(g.halfW(x, 'bass'), g.boardHalf(x)));
  const lower = (x: number) => (x > g.edge ? g.boardHalf(x) : Math.max(g.halfW(x, 'treble'), g.boardHalf(x)));
  // In the face view the treble edge is toward +v (down the glass) when
  // upright; lap style shows the face from above with the treble side toward
  // the audience (+z, down the glass) too.
  const around = (x: number, gap = 24): Place[] => [
    { u: x, v: vIn(lower(x) + gap), align: 'center' },
    { u: x, v: vIn(upper(x) - gap), align: 'center' },
    { u: x, v: vIn(lower(x) + gap + 70), align: 'center' },
    { u: x, v: vIn(upper(x) - gap - 70), align: 'center' },
    { u: x, v: vIn(lower(x) + gap + 140), align: 'center' },
    // Beside the obvious places (a zone straight below or above the part).
    { u: x + 110, v: vIn(lower(x) + gap + 40), align: 'left' },
    { u: x - 110, v: vIn(lower(x) + gap + 40), align: 'right' },
    { u: x + 110, v: vIn(upper(x) - gap - 40), align: 'left' },
  ];
  const aboveFirst = (x: number, gap = 24): Place[] => {
    const p = around(x, gap);
    return [p[1], p[0], p[3], p[2], ...p.slice(4)];
  };
  if (face) {
    const holeX = sp.body.pot ? sp.body.pot.cx.mm : sp.opening.kind === 'coverplate' ? sp.opening.x.mm : g.hole.x;
    out.push(partLabel('opening', openWord, openShort, { u: holeX, v: 0 }, sp.body.pot ? [{ u: holeX, v: vIn(upper(holeX) - 24), align: 'center' }, ...around(holeX).slice(2)] : aboveFirst(holeX)));
    out.push(partLabel('bridge', 'BRIDGE', undefined, { u: sp.bridge.x.mm, v: 0 }, around(sp.bridge.x.mm)));
    if (sp.jointFret && sp.jointFret.mm !== 12) out.push(partLabel('fret12', '12TH FRET', '12TH', { u: g.fret12, v: 0 }, aboveFirst(g.fret12, 20)));
    out.push(partLabel('joint', sp.jointFret?.mm === 12 ? 'NECK JOINT · 12TH FRET' : 'NECK JOINT', 'JOINT', { u: g.edge, v: 0 }, around(g.edge, 22)));
    const hx = g.L + sp.neck.headLen.mm * 0.55;
    // Beyond the tuner buttons (the head's half-width + a button), above first.
    const hReach = headWOf(sp) + 38;
    out.push(partLabel('head', 'HEADSTOCK', 'HEAD', { u: hx, v: 0 }, [{ u: hx, v: vIn(-hReach), align: 'center' }, { u: hx, v: vIn(hReach + 6), align: 'center' }, { u: g.L + sp.neck.headLen.mm, v: vIn(-hReach + 8), align: 'right' }], 'muted'));
    if (!lap) {
      // On the player's chest (the head may be cropped by the frame).
      const f = sc.fit;
      const chest = f.head.c.y + f.head.r * 0.92 + 70;
      // A label never sits ON the player (artLabels), so the words go off the
      // body beside a shoulder with a leader to the chest — before, both
      // places were on the chest, the label always fell to free space and
      // its leader could run through another label (C05C, clash sweep
      // 2026-10-10).
      const pz = playerPoseOf(sc, 'side');
      out.push({
        id: 'player',
        text: 'PLAYER',
        // Beside the head, then beside a shoulder: words right next to the
        // figure need no leader, so none is drawn (a leader from the chest
        // ran through the NECK JOINT words on the ukulele).
        u: f.head.c.x + f.head.r + 40,
        v: vIn(f.head.c.y + f.head.r * 0.3),
        align: 'left',
        tone: 'muted',
        alts: [
          { u: pz.shoulderL.u + 70, v: vIn(pz.neck.v + 30), align: 'left' },
          { u: pz.shoulderR.u - 70, v: vIn(pz.neck.v + 30), align: 'right' },
          // At the frame's right edge, level with the collar (a small body —
          // the ukulele — fills the shoulder places with part names).
          ...(box ? [{ u: box.u1 - 8, v: vIn(pz.neck.v + 30), align: 'right' as const }] : []),
          { u: f.head.c.x + 70, v: vIn(chest), align: 'center' },
          { u: f.head.c.x - 150, v: vIn(chest), align: 'center' },
        ],
      });
    } else {
      out.push({ id: 'player', text: 'PLAYER', u: sc.fit.head.c.x, v: vIn(sc.fit.head.c.y + 40), align: 'center', tone: 'muted' });
    }
  } else {
    const D = g.depth;
    if (!lap) {
      const tz = sp.opening.kind === 'head' ? 'HEAD' : 'TOP';
      // TOP and BACK beside the tail, one row apart: on a shallow body (a
      // mandolin, a ukulele) the two rows collide, so each steps OUTWARD
      // (TOP down, BACK up) before going anywhere else — the BACK leader ran
      // across the TOP leader, or the whole neck and the fretting hand
      // (clash sweep 2026-10-10).
      // From above the player's keep-outs (lap, torso, feet) reach past the
      // tail and labels keep off them (artLabels.occupancy), so the second
      // places stand just beyond the nearest of them, the two rows a line
      // apart.
      const f = sc.fit;
      const lx = Math.min(g.tail - 14, f.legs.min.x - 16, f.torso.min.x - 16, f.feet ? f.feet.min.x - 16 : Infinity);
      out.push(partLabel('top', tz, undefined, { u: g.tail + 30, v: 0 }, [{ u: g.tail - 14, v: 0, align: 'right' }, { u: lx, v: vIn(12), align: 'right' }, { u: lx, v: vIn(44), align: 'right' }, { u: g.tail + 40, v: vIn(26), align: 'left' }, { u: g.tail + 40, v: vIn(80), align: 'left' }]));
      // BACK names the back a little farther along than TOP names the top:
      // when the layout has to set BACK below the instrument, its leader then
      // passes clear of the end of TOP's leader instead of through it.
      out.push(partLabel('back', 'BACK', undefined, { u: g.tail + 80, v: -D }, [{ u: g.tail - 14, v: -D, align: 'right' }, { u: lx, v: vIn(-D - 40), align: 'right' }, { u: lx, v: vIn(-D - 70), align: 'right' }, { u: g.tail + 40, v: vIn(-D - 22), align: 'left' }], 'muted'));
      const sx = (g.edge + g.L) / 2;
      out.push(partLabel('strings', 'STRINGS', undefined, { u: sx, v: g.h(sx) }, [{ u: sx, v: vIn(g.h(g.edge) + 26), align: 'center' }, { u: sx, v: vIn(-50), align: 'center' }, { u: sx, v: vIn(g.h(g.edge) + 96), align: 'center' }]));
      out.push({ id: 'player', text: 'PLAYER', u: f.head.c.x - f.head.r - 14, v: vIn(f.head.c.z), align: 'right', tone: 'muted', alts: [{ u: f.head.c.x + f.head.r + 14, v: vIn(f.head.c.z), align: 'left' }] });
      out.push({ id: 'audience', text: 'AUDIENCE ↓', short: '↓ AUDIENCE', u: box ? box.u1 - 20 : g.L + 60, v: box ? box.v1 - 22 : 560, align: 'right', tone: 'muted' });
    } else {
      out.push(partLabel('top', 'TOP (FACING UP)', 'TOP', { u: g.tail + 30, v: 0 }, [{ u: g.tail - 14, v: -D / 2, align: 'right' }, { u: g.tail + 40, v: vIn(-28), align: 'left' }]));
      out.push({ id: 'player', text: 'PLAYER', u: sc.fit.head.c.x + sc.fit.head.r + 16, v: vIn(-sc.fit.head.c.z), align: 'left', tone: 'muted' });
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
export function makeGuitarArt(
  built: BuiltGuitarModel,
  extras?: { labels?: (sc: GuitarScene, view: ViewId) => ArtLabel[]; zones?: readonly DocumentedZone[] },
): Pick<LessonArt, 'Instrument' | 'labels' | 'hitTest' | 'labelObstacles' | 'labelsYieldToMic' | 'figureAt'> {
  const scOf = (v: VariantId) => built.scenes[v] ?? built.scenes[built.model.defaultVariant];
  const vid = (v: VariantId) => (built.scenes[v] ? v : built.model.defaultVariant);
  const zones = extras?.zones ?? [];
  return {
    Instrument: ({ view, variant }) => <GuitarSceneArt sc={scOf(variant)} view={view} />,
    labels: (view, variant) => guitarLabels(scOf(variant), view, extras?.labels, viewsOf(built.model, vid(variant))[view]),
    hitTest: (view, variant, u, v, tol) => guitarHit(scOf(variant), view, u, v, tol),
    // The drawn player, so the part labels keep off the figure too.
    figureAt: (view, variant, u, v, tol) => figureCovers(playerPoseOf(scOf(variant), view), u, v, tol),
    // The words keep off the suggested starting points and step back from
    // the mic (art pass 2026-10-05: labels were drawn over both).
    labelObstacles: (view, variant, shown) =>
      zones
        .filter((z) => z.requires?.variant === vid(variant) && shown.includes(z.id))
        .map((z) => z.drawn?.[view])
        .filter((d): d is { u0: number; u1: number; v0: number; v1: number } => !!d && 'u0' in d)
        .map((d) => ({ u0: d.u0 - 10, u1: d.u1 + 10, v0: d.v0 - 10, v1: d.v1 + 10 })),
    labelsYieldToMic: true,
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
