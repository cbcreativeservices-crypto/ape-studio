/**
 * THE SHARED PIANO FAMILY — the look (charter §2 layer 3). Every piano the
 * Miking Labs draw comes from pianoSpec.ts at the Kick's illustration
 * standard: gradients for form, light from the upper left, rim highlights,
 * soft contact shadows, a stroke hierarchy. Millimetres of the view's (u, v):
 * side u = x, v = y; plan u = x, v = z (lesson frame K).
 *
 *   GrandPlan     from above: the black case and rim, the spruce soundboard,
 *                 the gold iron frame with its struts and round holes, the
 *                 bridges, the overstrung strings (copper bass over steel),
 *                 the tuning pins, the damper row, the music desk, the
 *                 keyboard and its cheeks; the lid (full / short stick:
 *                 translucent, foreshortened on its hinge; closed; off).
 *   GrandSide     from the curved side with that wall CUT AWAY: the far wall,
 *                 the soundboard and its ribs, the frame, both string planes,
 *                 the pin block and pins, a key and its hammer at the hammer
 *                 line, a damper over the strings, the fallboard, the music
 *                 desk, the lid seen edge-on from the side (the "sail") and
 *                 its stick, the legs and the pedal lyre.
 *   UprightSide   cut open at the keyboard's middle: the back posts, the
 *                 soundboard and ribs, the bridge, the strings, the hammer
 *                 and damper, the key and keybed, the upper and lower front
 *                 panels (the upper one can be off), the open top lid, the
 *                 pedals; the wall behind.
 *   UprightPlan   from above, the top open: strings, hammers, dampers,
 *                 soundboard, back posts, the keys; the wall behind.
 *   PianistSide / PianistPlan and the bench: ILLUSTRATIVE (proposal §5).
 *
 * Rules kept (the kick's): nothing moves (D8); paths are built ONCE per
 * model / lid / view and cached at module scope; no brand mark (none is
 * sourced); drawing defaults stay where the spec puts them. Thin parts
 * (strings, felts) are drawn a few millimetres thick so they read at phone
 * size — a line weight, not a dimension.
 */
import { BlurMask, DashPathEffect, FillType, Group, LinearGradient, Path, RadialGradient, Skia, vec } from '@shopify/react-native-skia';
import type { Pt } from './pianoSpec.ts';
import { PlayerBehind, PlayerInFront } from '../players/PlayerFigure';
import { BODY, pt, type PlayerPose } from '../players/playerPose.ts';
import { blackKeys, FLOOR_Y, grandGeom, KEY_DIMS, KEY_TOP_Y, KEYBOARD, KEYS_Z0, keyZ, LID_DEG, lidPoint, lidUnderY, pianistAt, stickOf, uprightGeom, WHITE, type GrandGeom, type GrandId, type LidState, type Pianist } from './pianoSpec.ts';

type SkPath = ReturnType<typeof Skia.Path.Make>;

/* ── palette (house tokens + material ramps) ── */
export const PIANO_PALETTE = {
  INK: '#08080a',
  LACQUER: ['#4a4c55', '#1d1e23', '#0b0b0e', '#16171b'],
  LACQUER_POS: [0, 0.25, 0.7, 1],
  SPRUCE: ['#ead2a0', '#d6b679', '#b99556'],
  GOLD: ['#f3d98d', '#cfa64b', '#8f6a22', '#5c4313'],
  STEEL: '#d9dde5',
  COPPER: '#c98545',
  MAPLE: ['#e8cf9c', '#c7a466', '#9a7638'],
  FELT: '#e9e1cd',
  FELT_DARK: '#3a3434',
  IVORY: ['#fbf9f3', '#ece7da', '#d5cfbf'],
  EBONY: ['#3b3c42', '#16161a', '#060608'],
  CHROME: ['#3a3d45', '#eef1f6', '#9aa0ab', '#4a4e57', '#c8ccd4'],
  CLOTH: ['#4b5366', '#353b49', '#232733'],
  SKIN: ['#9a8572', '#7b6858', '#5d4e42'],
  HAIR: '#2a2522',
  WALL: '#4a4d55',
} as const;
const P = PIANO_PALETTE;

/* ── path helpers (build-time only) ── */
const make = () => Skia.Path.Make();
function poly(pts: readonly Pt[], close = true): SkPath {
  const p = make();
  pts.forEach(([x, y], i) => (i === 0 ? p.moveTo(x, y) : p.lineTo(x, y)));
  if (close) p.close();
  return p;
}
function rect(p: SkPath, x0: number, y0: number, x1: number, y1: number): SkPath {
  p.addRect(Skia.XYWHRect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0)));
  return p;
}
function rrect(p: SkPath, x0: number, y0: number, x1: number, y1: number, r: number): SkPath {
  p.addRRect(Skia.RRectXY(Skia.XYWHRect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0)), r, r));
  return p;
}
function seg(p: SkPath, a: number, b: number, c: number, d: number): SkPath {
  p.moveTo(a, b);
  p.lineTo(c, d);
  return p;
}
function oval(p: SkPath, cx: number, cy: number, rx: number, ry: number): SkPath {
  p.addOval(Skia.XYWHRect(cx - rx, cy - ry, rx * 2, ry * 2));
  return p;
}
/** A polygon offset toward its inside by `d` (vertex normals; build-time). */
function inset(pts: readonly Pt[], d: number): Pt[] {
  const n = pts.length;
  // Orientation: positive area → counter-clockwise in (x, z).
  let area = 0;
  for (let i = 0; i < n; i++) {
    const [x0, z0] = pts[i];
    const [x1, z1] = pts[(i + 1) % n];
    area += x0 * z1 - x1 * z0;
  }
  const s = area > 0 ? 1 : -1;
  return pts.map((p, i) => {
    const a = pts[(i - 1 + n) % n];
    const b = pts[(i + 1) % n];
    const tx = b[0] - a[0];
    const tz = b[1] - a[1];
    const l = Math.hypot(tx, tz) || 1;
    // Left normal (−tz, tx) points inside for a counter-clockwise polygon.
    return [p[0] + (s * -tz * d) / l, p[1] + (s * tx * d) / l] as Pt;
  });
}

/* ═════════════════════════════════ the keyboard ═════════════════════════════════ */

type KeyPaths = { whites: SkPath; whiteEdges: SkPath; blacks: SkPath; blackShine: SkPath; slip: SkPath };
const keyCache = new Map<number, KeyPaths>();
/** The 88 keys from above, their fronts at x = xKey (plan u = x, v = z). */
function keyPaths(xKey: number): KeyPaths {
  const hit = keyCache.get(xKey);
  if (hit) return hit;
  const wl = KEY_DIMS.whiteLen.mm;
  const bl = KEY_DIMS.blackLen.mm;
  const whites = make();
  const whiteEdges = make();
  for (let i = 0; i < KEYBOARD.white; i++) {
    const z0 = KEYS_Z0 + i * WHITE;
    rrect(whites, xKey, z0 + 0.6, xKey + wl, z0 + WHITE - 0.6, 1.5);
    seg(whiteEdges, xKey, z0, xKey + wl, z0);
  }
  const blacks = make();
  const blackShine = make();
  const xb1 = xKey + wl;
  for (const b of blackKeys()) {
    rrect(blacks, xb1 - bl, b.z0, xb1, b.z1, 1.6);
    seg(blackShine, xb1 - bl + 6, b.z0 + 3, xb1 - 8, b.z0 + 3);
  }
  const slip = rect(make(), xKey - 14, KEYS_Z0 - 2, xKey, -KEYS_Z0 + 2);
  const out = { whites, whiteEdges, blacks, blackShine, slip };
  keyCache.set(xKey, out);
  return out;
}

export function KeyboardPlan({ xKey }: { xKey: number }) {
  const k = keyPaths(xKey);
  const wl = KEY_DIMS.whiteLen.mm;
  return (
    <Group>
      <Path path={k.whites}>
        <LinearGradient start={vec(xKey, KEYS_Z0)} end={vec(xKey + wl, -KEYS_Z0)} colors={[...P.IVORY]} />
      </Path>
      <Path path={k.whiteEdges} style="stroke" strokeWidth={1.4} color="#7d7768" opacity={0.8} />
      <Path path={k.blacks}>
        <LinearGradient start={vec(xKey + wl - 95, 0)} end={vec(xKey + wl, 0)} colors={[...P.EBONY]} />
      </Path>
      <Path path={k.blackShine} style="stroke" strokeWidth={1.6} color="#8a8c95" opacity={0.7} />
      <Path path={k.slip} color="#0e0e11" />
    </Group>
  );
}

/* ══════════════════════════════════ GRAND · PLAN ═════════════════════════════════ */

type GrandPlanPaths = {
  outline: SkPath;
  inner: SkPath;
  grain: SkPath;
  plate: SkPath;
  plateEdge: SkPath;
  struts: SkPath;
  holes: SkPath;
  holeRims: SkPath;
  longBridge: SkPath;
  bassBridge: SkPath;
  bridgePins: SkPath;
  steel: SkPath;
  copper: SkPath;
  capo: SkPath;
  pins: SkPath;
  dampers: SkPath;
  damperTops: SkPath;
  desk: SkPath;
  fallboard: SkPath;
  cheeks: SkPath;
  shadow: SkPath;
  hammerLine: SkPath;
};
const planCache = new Map<GrandId, GrandPlanPaths>();

function grandPlanPaths(id: GrandId): GrandPlanPaths {
  const hit = planCache.get(id);
  if (hit) return hit;
  const g = grandGeom(id);
  const outline = poly(g.outline);
  const inner = poly(g.inner);
  // Spruce grain, diagonal across the board (a look, not a measurement).
  const grain = make();
  for (let d = -2400; d < 2400; d += 34) seg(grain, d - 900, -900, d + 900, 900 * 0.6 + 900);
  // The iron frame: the open interior inset, with windows where the
  // soundboard shows: the treble belly beyond the long bridge, and a long
  // tenor window between two struts. Even-odd: the windows cut through.
  const plateOuter = inset(g.inner, 10);
  const plate = poly(plateOuter);
  const belly: Pt[] = [];
  const lb = g.longBridge;
  for (let i = 0; i < lb.length; i += 3) belly.push([lb[i][0] + 26, lb[i][1] + 40]);
  const innerTreble = inset(g.inner, 36).filter(([x, z]) => z > lb[lb.length - 1][1] + 220 && x > lb[0][0] + 60 && z > -100);
  innerTreble.sort((a, b) => a[0] - b[0]);
  const bellyPoly: Pt[] = [...belly.filter(([, z]) => z > -60), ...innerTreble.reverse()];
  if (bellyPoly.length > 3) plate.addPath(poly(bellyPoly));
  const tw = (x: number, z: number): Pt => [x, z];
  const tenorWin: Pt[] = [tw(140, -200), tw(0.62 * g.xTail, -0.42 * g.hw - 40), tw(0.74 * g.xTail, -0.55 * g.hw), tw(220, -0.44 * g.hw)];
  plate.addPath(poly(tenorWin));
  plate.setFillType(FillType.EvenOdd);
  const plateEdge = poly(plateOuter);
  const struts = make();
  seg(struts, -60, -0.3 * g.hw, 0.86 * g.xTail, -0.66 * g.hw);
  seg(struts, -60, 0.05 * g.hw, 0.6 * g.xTail, -0.2 * g.hw);
  seg(struts, -80, 0.45 * g.hw, 0.42 * g.xTail, 0.28 * g.hw);
  const holes = make();
  const holeRims = make();
  for (const h of g.holes) {
    oval(holes, h.c.x, h.c.z, h.r, h.r);
    oval(holeRims, h.c.x, h.c.z, h.r + 9, h.r + 9);
  }
  const longBridge = poly(g.longBridge, false);
  const bassBridge = poly(g.bassBridge, false);
  const bridgePins = make();
  for (const s of g.strings) oval(bridgePins, s.b[0] - 6, s.b[1], 2.6, 2.6);
  const steel = make();
  const copper = make();
  for (const s of g.strings) seg(s.bass ? copper : steel, s.a[0], s.a[1], s.b[0], s.b[1]);
  // The capo / agraffe line along the strings' front ends.
  const capo = make();
  const fronts = g.strings.filter((s) => !s.bass).map((s) => s.a);
  capo.moveTo(fronts[0][0] - 10, fronts[0][1]);
  for (const f of fronts) capo.lineTo(f[0] - 10, f[1]);
  const pins = make();
  for (let k = 1; k <= KEYBOARD.keys; k++) {
    const z = keyZ(k);
    const row = k % 2 === 0 ? -265 : -225;
    oval(pins, row, z, 4.2, 4.2);
  }
  const dampers = make();
  const damperTops = make();
  for (let k = 1; k <= 70; k++) {
    const z = keyZ(k);
    rrect(dampers, 15, z - 6.2, 95, z + 6.2, 2);
    seg(damperTops, 20, z - 4.4, 90, z - 4.4);
  }
  const desk = make();
  rrect(desk, g.desk.x0, -g.desk.hw, g.desk.x1, g.desk.hw, 6);
  const fallboard = rect(make(), g.xKey + KEY_DIMS.whiteLen.mm, KEYS_Z0 - 4, g.xKey + KEY_DIMS.whiteLen.mm + 36, -KEYS_Z0 + 4);
  const cheeks = make();
  rect(cheeks, g.xKey, -g.hw, -140, KEYS_Z0 - 2);
  rect(cheeks, g.xKey, -KEYS_Z0 + 2, -140, g.hw);
  const shadow = poly(g.outline);
  const hammerLine = seg(make(), 0, KEYS_Z0, 0, -KEYS_Z0);
  const out = { outline, inner, grain, plate, plateEdge, struts, holes, holeRims, longBridge, bassBridge, bridgePins, steel, copper, capo, pins, dampers, damperTops, desk, fallboard, cheeks, shadow, hammerLine };
  planCache.set(id, out);
  return out;
}

type LidPaths = { top: SkPath; edge: SkPath; hinge: SkPath; knuckles: SkPath; stickPlan: SkPath; side: SkPath; sideEdge: SkPath; sideUnder: SkPath; stickSide: SkPath; stickSideHi: SkPath };
const lidCache = new Map<string, LidPaths>();
function lidPaths(id: GrandId, state: LidState): LidPaths {
  const key = `${id}:${state}`;
  const hit = lidCache.get(key);
  if (hit) return hit;
  const g = grandGeom(id);
  const topPts: Pt[] = g.lidPlan.map(([x, z]) => {
    const q = lidPoint(g, state, x, z, 'top');
    return [q.x, q.z];
  });
  const sidePts: Pt[] = g.lidPlan.map(([x, z]) => {
    const q = lidPoint(g, state, x, z, 'top');
    return [q.x, q.y];
  });
  const underPts: Pt[] = g.lidPlan.map(([x, z]) => {
    const q = lidPoint(g, state, x, z, 'under');
    return [q.x, q.y];
  });
  const top = poly(topPts);
  // The free edge (the lid's outline apart from the hinge side).
  const edge = poly(topPts);
  const xs = g.lidPlan.map((q) => q[0]);
  const x0 = Math.min(...xs);
  const x1 = Math.max(...xs);
  const hinge = seg(make(), x0 + 30, -g.hw + 2, x1 - 120, -g.hw + 2);
  const knuckles = make();
  for (const f of [0.15, 0.5, 0.85]) rrect(knuckles, x0 + 30 + (x1 - x0 - 150) * f - 22, -g.hw - 6, x0 + 30 + (x1 - x0 - 150) * f + 22, -g.hw + 10, 4);
  const st = stickOf(g, state);
  const stickPlan = make();
  if (st) oval(stickPlan, st.a.x, st.a.z, 14, 14);
  // Side view: the "sail" — top face, and the underside's front band.
  const side = poly([...sidePts, ...[...underPts].reverse()]);
  const sideEdge = poly(sidePts);
  const sideUnder = poly(underPts);
  const stickSide = make();
  const stickSideHi = make();
  if (st) {
    seg(stickSide, st.a.x, st.a.y, st.b.x, st.b.y);
    seg(stickSideHi, st.a.x - 3, st.a.y, st.b.x - 3, st.b.y);
  }
  const out = { top, edge, hinge, knuckles, stickPlan, side, sideEdge, sideUnder, stickSide, stickSideHi };
  lidCache.set(key, out);
  return out;
}

export function GrandPlan({ id, lid, dim = 1 }: { id: GrandId; lid: LidState; dim?: number }) {
  const g = grandGeom(id);
  const p = grandPlanPaths(id);
  const L = lidPaths(id, lid);
  const raised = lid === 'full' || lid === 'short';
  return (
    <Group opacity={dim}>
      {/* contact shadow under the case */}
      <Group transform={[{ translateX: 30 }, { translateY: 40 }]}>
        <Path path={p.shadow} color="#000" opacity={0.6}>
          <BlurMask blur={40} style="normal" />
        </Path>
      </Group>
      {/* the case: black lacquer, lit from the upper left */}
      <Path path={p.outline}>
        <LinearGradient start={vec(g.xKey, -g.hw)} end={vec(g.xTail, g.hw)} colors={[...P.LACQUER]} positions={[...P.LACQUER_POS]} />
      </Path>
      {/* the soundboard, the frame over it, the windows and holes */}
      <Path path={p.inner}>
        <LinearGradient start={vec(-140, -g.hw)} end={vec(g.xTail, g.hw)} colors={[...P.SPRUCE]} />
      </Path>
      <Group clip={p.inner}>
        <Path path={p.grain} style="stroke" strokeWidth={2} color="#9c7a44" opacity={0.28} />
      </Group>
      <Path path={p.plate}>
        <LinearGradient start={vec(-140, -g.hw)} end={vec(g.xTail, g.hw)} colors={[...P.GOLD]} positions={[0, 0.35, 0.75, 1]} />
      </Path>
      <Path path={p.plate} style="stroke" strokeWidth={4} color="#5c4313" opacity={0.7} />
      <Path path={p.struts} style="stroke" strokeWidth={30} strokeCap="round" color="#a37a2a" />
      <Path path={p.struts} style="stroke" strokeWidth={8} strokeCap="round" color="#f6dd95" opacity={0.6} />
      <Path path={p.holeRims} color="#b88d36" />
      <Path path={p.holes}>
        <RadialGradient c={vec(0, 0)} r={2000} colors={['#1d150a', '#2b1f10']} />
      </Path>
      <Path path={p.holes} style="stroke" strokeWidth={3} color="#f3d98d" opacity={0.8} />
      {/* bridges, then the strings: steel, then the copper bass over them */}
      <Path path={p.longBridge} style="stroke" strokeWidth={24} strokeCap="round" strokeJoin="round" color="#a4834a" />
      <Path path={p.longBridge} style="stroke" strokeWidth={12} strokeCap="round" strokeJoin="round" color="#e2c690" />
      <Path path={p.bassBridge} style="stroke" strokeWidth={26} strokeCap="round" color="#a4834a" />
      <Path path={p.bassBridge} style="stroke" strokeWidth={13} strokeCap="round" color="#e2c690" />
      <Path path={p.bridgePins} color="#4b4f58" />
      <Path path={p.steel} style="stroke" strokeWidth={3.2} color="#6f747e" />
      <Path path={p.steel} style="stroke" strokeWidth={1.8} color={P.STEEL} />
      <Path path={p.copper} style="stroke" strokeWidth={5.5} color="#6b3f17" />
      <Path path={p.copper} style="stroke" strokeWidth={3.4} color={P.COPPER} />
      <Path path={p.capo} style="stroke" strokeWidth={10} strokeJoin="round" color="#b88d36" />
      <Path path={p.pins} color="#8e939d" />
      <Path path={p.pins} style="stroke" strokeWidth={1.4} color="#2a2c32" />
      {/* the damper row behind the hammer line (the top notes have none) */}
      <Path path={p.dampers}>
        <LinearGradient start={vec(15, 0)} end={vec(95, 0)} colors={['#5a4a3a', '#2e2620', '#1a1612']} />
      </Path>
      <Path path={p.damperTops} style="stroke" strokeWidth={1.6} color="#8a7560" opacity={0.7} />
      {/* rim highlight */}
      <Path path={p.outline} style="stroke" strokeWidth={6} color="#9aa0ab" opacity={0.55} />
      <Path path={p.inner} style="stroke" strokeWidth={3} color="#000" opacity={0.6} />
      {/* keyboard end: cheeks, fallboard, music desk, keys */}
      <Path path={p.cheeks}>
        <LinearGradient start={vec(g.xKey, -g.hw)} end={vec(-140, g.hw)} colors={[...P.LACQUER]} positions={[...P.LACQUER_POS]} />
      </Path>
      <Path path={p.fallboard} color="#141418" />
      <Path path={p.desk}>
        <LinearGradient start={vec(g.desk.x0, -g.desk.hw)} end={vec(g.desk.x1, g.desk.hw)} colors={['#3e4048', '#141417', '#0a0a0c']} />
      </Path>
      <Path path={p.desk} style="stroke" strokeWidth={3} color="#7c818c" opacity={0.6} />
      <KeyboardPlan xKey={g.xKey} />
      {/* the lid: raised (translucent, foreshortened on its hinge) or closed */}
      {lid === 'off' ? null : (
        <Group>
          <Path path={L.top} opacity={raised ? 0.62 : 0.94}>
            <LinearGradient start={vec(g.xKey, -g.hw)} end={vec(g.xTail, g.hw)} colors={['#6a6e78', '#2a2c32', '#121216', '#34363d']} positions={[0, 0.3, 0.75, 1]} />
          </Path>
          <Path path={L.edge} style="stroke" strokeWidth={9} color="#e8eaee" opacity={0.75} />
          <Path path={L.hinge} style="stroke" strokeWidth={8} color="#9aa0ab" />
          <Path path={L.knuckles} color="#c8ccd4" />
          {raised ? <Path path={L.stickPlan} color="#2a2b31" /> : null}
          {raised ? <Path path={L.stickPlan} style="stroke" strokeWidth={4} color="#8a8f99" /> : null}
        </Group>
      )}
    </Group>
  );
}

/* ══════════════════════════════════ GRAND · SIDE ═════════════════════════════════ */

type GrandSidePaths = {
  floorShadow: SkPath;
  farWall: SkPath;
  ghost: SkPath;
  bottom: SkPath;
  board: SkPath;
  ribs: SkPath;
  plate: SkPath;
  capoBar: SkPath;
  bridge: SkPath;
  steel: SkPath;
  copper: SkPath;
  pinBlock: SkPath;
  pins: SkPath;
  key: SkPath;
  keyTop: SkPath;
  keybed: SkPath;
  slip: SkPath;
  actionFrame: SkPath;
  shank: SkPath;
  hammer: SkPath;
  damperBlock: SkPath;
  damperFelt: SkPath;
  damperWire: SkPath;
  fallboard: SkPath;
  desk: SkPath;
  deskLedge: SkPath;
  legs: SkPath;
  casters: SkPath;
  lyre: SkPath;
  pedals: SkPath;
  rimTopLine: SkPath;
};
const sideCache = new Map<GrandId, GrandSidePaths>();

function grandSidePaths(id: GrandId): GrandSidePaths {
  const hit = sideCache.get(id);
  if (hit) return hit;
  const g = grandGeom(id);
  const top = g.rimTop;
  const bot = g.caseBottom;
  const floorShadow = oval(make(), (g.xKey + g.xTail) / 2, FLOOR_Y, (g.xTail - g.xKey) / 2 + 60, 26);
  // The far (bass) wall's inner face, the tail round closing toward us.
  const farWall = make();
  farWall.moveTo(-140, top);
  farWall.lineTo(g.tail.cx, top);
  farWall.quadTo(g.xTail + 6, top, g.xTail, (top + bot) / 2);
  farWall.quadTo(g.xTail + 6, bot, g.tail.cx, bot);
  farWall.lineTo(-140, bot);
  farWall.close();
  // The near (curved) wall, cut away: its outline only.
  const ghost = make();
  ghost.moveTo(g.xKey, top + 90);
  ghost.lineTo(g.xKey, bot);
  ghost.lineTo(g.tail.cx, bot);
  ghost.quadTo(g.xTail + 6, bot, g.xTail, (top + bot) / 2);
  ghost.quadTo(g.xTail + 6, top, g.tail.cx, top);
  ghost.lineTo(-140, top);
  const bottom = rect(make(), -140, g.caseBottom - 46, g.tail.cx + 40, g.caseBottom);
  const sb = 90;
  const board = rect(make(), -120, sb, g.tail.cx + 60, sb + 9);
  const ribs = make();
  for (let x = -60; x < g.tail.cx; x += 115) rrect(ribs, x, sb + 9, x + 26, sb + 34, 6);
  const longEnd = Math.max(...g.longBridge.map((q) => q[0]));
  const bassEnd = Math.max(...g.bassBridge.map((q) => q[0]));
  const plate = make();
  rrect(plate, -200, -6, Math.max(longEnd, bassEnd) + 40, 26, 8);
  const capoBar = rrect(make(), -200, -34, -40, 22, 10);
  const bridge = make();
  rrect(bridge, Math.min(...g.longBridge.map((q) => q[0])) - 8, 2, longEnd + 8, sb, 4);
  const steel = make();
  for (const d of [-1.5, 1.5]) seg(steel, -130, d, longEnd, d);
  const copper = make();
  for (const d of [-20, -16]) seg(copper, -190, d, bassEnd, d);
  const pinBlock = rrect(make(), -300, 2, -150, 120, 6);
  const pins = make();
  for (let x = -290; x <= -185; x += 21) rrect(pins, x, -40, x + 8, 4, 2);
  // One key and its action at the hammer line (rest position).
  const key = rrect(make(), g.xKey, KEY_TOP_Y, -120, KEY_TOP_Y + 24, 3);
  const keyTop = rect(make(), g.xKey, KEY_TOP_Y, g.xKey + KEY_DIMS.whiteLen.mm, KEY_TOP_Y + 6);
  const keybed = rect(make(), g.xKey + 20, 150, -60, 178);
  const slip = rrect(make(), g.xKey - 16, KEY_TOP_Y - 4, g.xKey, 178, 3);
  const actionFrame = make();
  rrect(actionFrame, -300, 92, -40, 108, 4);
  rrect(actionFrame, -280, 108, -262, 148, 3);
  rrect(actionFrame, -70, 108, -52, 148, 3);
  const shank = seg(make(), -150, 78, -8, 58);
  const hammer = make();
  hammer.moveTo(-26, 78);
  hammer.quadTo(-28, 36, 0, 30);
  hammer.quadTo(26, 36, 24, 78);
  hammer.close();
  const damperBlock = rrect(make(), 15, -95, 95, -40, 5);
  const damperFelt = rrect(make(), 22, -40, 88, -4, 4);
  const damperWire = seg(make(), 55, -40, 55, 92);
  const fallboard = rrect(make(), -330, -96, -296, KEY_TOP_Y, 6);
  const desk = make();
  desk.moveTo(g.desk.x0, g.desk.y1);
  desk.lineTo(g.desk.x0 + 20, g.desk.y1);
  desk.lineTo(g.desk.x1 + 4, g.desk.y0);
  desk.lineTo(g.desk.x1 - 16, g.desk.y0);
  desk.close();
  const deskLedge = rrect(make(), g.desk.x0 - 30, g.desk.y1 - 6, g.desk.x0 + 34, g.desk.y1 + 10, 4);
  const legs = make();
  const casters = make();
  const legXs = [g.legs[0].x, g.legs[2].x];
  for (const lx of legXs) {
    legs.moveTo(lx - 62, bot);
    legs.lineTo(lx + 62, bot);
    legs.lineTo(lx + 38, FLOOR_Y - 64);
    legs.lineTo(lx - 38, FLOOR_Y - 64);
    legs.close();
    oval(casters, lx, FLOOR_Y - 32, 30, 30);
  }
  const lyre = make();
  rrect(lyre, g.lyre.x - 60, bot, g.lyre.x - 42, FLOOR_Y - 70, 6);
  rrect(lyre, g.lyre.x + 42, bot, g.lyre.x + 60, FLOOR_Y - 70, 6);
  rrect(lyre, g.lyre.x - 80, FLOOR_Y - 92, g.lyre.x + 80, FLOOR_Y - 48, 10);
  const pedals = make();
  pedals.moveTo(g.lyre.x - 70, FLOOR_Y - 70);
  pedals.lineTo(g.lyre.x - 170, FLOOR_Y - 62);
  pedals.lineTo(g.lyre.x - 172, FLOOR_Y - 50);
  pedals.lineTo(g.lyre.x - 70, FLOOR_Y - 56);
  pedals.close();
  const rimTopLine = seg(make(), -140, top, g.tail.cx, top);
  const out = { floorShadow, farWall, ghost, bottom, board, ribs, plate, capoBar, bridge, steel, copper, pinBlock, pins, key, keyTop, keybed, slip, actionFrame, shank, hammer, damperBlock, damperFelt, damperWire, fallboard, desk, deskLedge, legs, casters, lyre, pedals, rimTopLine };
  sideCache.set(id, out);
  return out;
}

export function GrandSide({ id, lid, dim = 1 }: { id: GrandId; lid: LidState; dim?: number }) {
  const g = grandGeom(id);
  const p = grandSidePaths(id);
  const L = lidPaths(id, lid);
  const st = stickOf(g, lid);
  const raised = lid === 'full' || lid === 'short';
  return (
    <Group opacity={dim}>
      <Path path={p.floorShadow} color="#000" opacity={0.55}>
        <BlurMask blur={24} style="normal" />
      </Path>
      {/* legs and the pedal lyre */}
      <Path path={p.legs}>
        <LinearGradient start={vec(g.legs[0].x - 60, 0)} end={vec(g.legs[0].x + 60, 0)} colors={['#3a3c44', '#141418', '#08080a']} />
      </Path>
      <Path path={p.legs} style="stroke" strokeWidth={3} color="#6a6f7a" opacity={0.6} />
      <Path path={p.casters}>
        <LinearGradient start={vec(0, FLOOR_Y - 62)} end={vec(0, FLOOR_Y)} colors={['#c9a85a', '#7a5a20']} />
      </Path>
      <Path path={p.lyre}>
        <LinearGradient start={vec(g.lyre.x - 80, 0)} end={vec(g.lyre.x + 80, 0)} colors={['#3a3c44', '#141418', '#08080a']} />
      </Path>
      <Path path={p.pedals}>
        <LinearGradient start={vec(0, FLOOR_Y - 70)} end={vec(0, FLOOR_Y - 48)} colors={['#f3d98d', '#a37a2a']} />
      </Path>
      {/* the lid, seen from the curved side: the "sail", translucent */}
      {lid !== 'off' ? (
        <Group>
          <Path path={L.side} opacity={raised ? 0.86 : 0.95}>
            <LinearGradient start={vec(g.xKey, -1000)} end={vec(g.xTail, g.rimTop)} colors={['#62656f', '#383a42', '#1c1d22']} />
          </Path>
          {/* the underside's satin sheen, lit from the upper left */}
          <Path path={L.side} opacity={raised ? 0.35 : 0.2}>
            <LinearGradient start={vec(g.xKey, -900)} end={vec(g.xKey + 900, -200)} colors={['rgba(255,255,255,0.28)', 'rgba(255,255,255,0)']} />
          </Path>
          <Path path={L.sideEdge} style="stroke" strokeWidth={6} color="#c8ccd4" opacity={0.6} />
        </Group>
      ) : null}
      {/* the far wall's inner face and the case floor */}
      <Path path={p.farWall}>
        <LinearGradient start={vec(-140, g.rimTop)} end={vec(-140, g.caseBottom)} colors={['#26272d', '#121216', '#0a0a0c']} />
      </Path>
      <Path path={p.bottom} color="#101013" />
      {/* soundboard and ribs, the bridge, the frame, the strings */}
      <Path path={p.ribs} color="#8a6a3a" />
      <Path path={p.board}>
        <LinearGradient start={vec(0, 90)} end={vec(0, 99)} colors={[...P.SPRUCE]} />
      </Path>
      <Path path={p.bridge} opacity={0.75}>
        <LinearGradient start={vec(0, 0)} end={vec(0, 90)} colors={[...P.MAPLE]} />
      </Path>
      <Path path={p.plate}>
        <LinearGradient start={vec(0, -6)} end={vec(0, 26)} colors={[...P.GOLD]} positions={[0, 0.35, 0.75, 1]} />
      </Path>
      <Path path={p.pinBlock}>
        <LinearGradient start={vec(-300, 0)} end={vec(-150, 120)} colors={['#a77e48', '#6d4a22']} />
      </Path>
      <Path path={p.capoBar}>
        <LinearGradient start={vec(0, -34)} end={vec(0, 22)} colors={[...P.GOLD]} positions={[0, 0.35, 0.75, 1]} />
      </Path>
      <Path path={p.pins}>
        <LinearGradient start={vec(-290, 0)} end={vec(-180, 0)} colors={['#eef1f6', '#7a7f8a']} />
      </Path>
      <Path path={p.steel} style="stroke" strokeWidth={2.6} color={P.STEEL} />
      <Path path={p.copper} style="stroke" strokeWidth={3.6} color={P.COPPER} />
      {/* the action at the hammer line: key, frame, shank, hammer; the damper */}
      <Path path={p.keybed} color="#3a2a18" />
      <Path path={p.actionFrame} color="#52565f" />
      <Path path={p.key}>
        <LinearGradient start={vec(0, KEY_TOP_Y)} end={vec(0, KEY_TOP_Y + 24)} colors={['#d8c79f', '#9c855a']} />
      </Path>
      <Path path={p.keyTop} color={P.IVORY[0]} />
      <Path path={p.shank} style="stroke" strokeWidth={8} strokeCap="round" color="#b89260" />
      <Path path={p.hammer}>
        <LinearGradient start={vec(-26, 30)} end={vec(24, 78)} colors={['#fbf6e8', P.FELT, '#b9ad92']} />
      </Path>
      <Path path={p.hammer} style="stroke" strokeWidth={2} color="#5a5040" opacity={0.7} />
      <Path path={p.damperWire} style="stroke" strokeWidth={3} color="#9aa0ab" />
      <Path path={p.damperBlock}>
        <LinearGradient start={vec(15, -95)} end={vec(95, -40)} colors={['#6a5844', '#3a2f24']} />
      </Path>
      <Path path={p.damperFelt} color={P.FELT_DARK} />
      <Path path={p.slip} color="#0e0e11" />
      {/* the fallboard and the music desk */}
      <Path path={p.fallboard}>
        <LinearGradient start={vec(-330, -96)} end={vec(-296, KEY_TOP_Y)} colors={['#4a4c55', '#141418']} />
      </Path>
      <Path path={p.desk}>
        <LinearGradient start={vec(g.desk.x0, g.desk.y1)} end={vec(g.desk.x1, g.desk.y0)} colors={['#141418', '#3e4048', '#141418']} />
      </Path>
      <Path path={p.deskLedge} color="#1b1c20" />
      {/* the near wall, cut away: its outline only; the rim's top edge */}
      <Path path={p.ghost} style="stroke" strokeWidth={4} color="#9aa0ab" opacity={0.55}>
        <DashPathEffect intervals={[22, 14]} />
      </Path>
      <Path path={p.rimTopLine} style="stroke" strokeWidth={6} color="#9aa0ab" opacity={0.7} />
      {/* the stick, on the near (treble) rim */}
      {st ? (
        <Group>
          <Path path={L.stickSide} style="stroke" strokeWidth={16} strokeCap="round" color="#0f0f12" />
          <Path path={L.stickSideHi} style="stroke" strokeWidth={4} strokeCap="round" color="#8a8f99" opacity={0.7} />
        </Group>
      ) : null}
    </Group>
  );
}

/* ═════════════════════════════════ UPRIGHT · SIDE ═══════════════════════════════ */

type UprightSidePaths = Record<string, SkPath>;
const upSideCache = new Map<string, UprightSidePaths>();

function uprightSidePaths(panelOn: boolean, wallX: number, topClosed: boolean): UprightSidePaths {
  const key = `${panelOn ? 'on' : 'off'}:${wallX}:${topClosed ? 1 : 0}`;
  const hit = upSideCache.get(key);
  if (hit) return hit;
  const u = uprightGeom();
  const out: UprightSidePaths = {};
  out.floorShadow = oval(make(), (u.xKey + u.xBack) / 2, FLOOR_Y, (u.xBack - u.xKey) / 2 + 60, 24);
  // The far (bass) end cheek, inside face: the upper case and the keybed end.
  const cheek = make();
  cheek.moveTo(u.panel.x - 18, u.yTop);
  cheek.lineTo(u.xBack, u.yTop);
  cheek.lineTo(u.xBack, FLOOR_Y - 10);
  cheek.lineTo(u.lower.x, FLOOR_Y - 10);
  cheek.lineTo(u.lower.x, u.keybedY + 30);
  cheek.lineTo(u.xKey + 40, u.keybedY + 30);
  cheek.lineTo(u.xKey + 40, u.keyTopY - 40);
  cheek.lineTo(u.panel.x - 18, u.keyTopY - 40);
  cheek.close();
  out.cheek = cheek;
  out.backPosts = rect(make(), 60, u.yTop + 10, u.xBack, FLOOR_Y - 20);
  out.board = rect(make(), u.soundboard.x0, u.soundboard.y0, u.soundboard.x1, u.soundboard.y1);
  const ribs = make();
  for (let y = u.soundboard.y0 + 40; y < u.soundboard.y1; y += 120) rrect(ribs, u.soundboard.x1, y, u.soundboard.x1 + 20, y + 26, 5);
  out.ribs = ribs;
  out.bridge = rrect(make(), 6, u.strings.y0 + 60, u.soundboard.x0, u.strings.y1 - 40, 4);
  out.plateTop = rrect(make(), -14, u.strings.y0 - 30, u.soundboard.x0, u.strings.y0 + 30, 8);
  out.plateBottom = rrect(make(), -14, u.strings.y1 - 30, u.soundboard.x0, u.strings.y1 + 30, 8);
  out.pinBlock = rrect(make(), -10, u.yTop + 40, 30, u.strings.y0 + 10, 4);
  const pins = make();
  for (let y = u.strings.y0 - 50; y >= u.yTop + 60; y -= 26) rrect(pins, -30, y, 0, y + 8, 2);
  out.pins = pins;
  out.strings = seg(make(), 0, u.strings.y0, 0, u.strings.y1);
  // The action: hammer at rest in front of the strings at the hammer line,
  // its shank down to the butt; the damper above it; brackets.
  const hy = u.hammerY;
  const hammer = make();
  hammer.moveTo(-70, hy - 26);
  hammer.quadTo(-12, hy - 30, -6, hy);
  hammer.quadTo(-12, hy + 30, -70, hy + 26);
  hammer.close();
  out.hammer = hammer;
  out.shank = seg(make(), -66, hy, -150, hy + 150);
  out.butt = rrect(make(), -186, hy + 140, -120, hy + 196, 10);
  out.damper = rrect(make(), -36, hy - 150, -4, hy - 80, 5);
  out.damperLever = seg(make(), -24, hy - 80, -150, hy + 40);
  const brackets = make();
  rrect(brackets, u.actionFront, hy + 196, u.actionFront + 26, u.keyTopY - 6, 4);
  rrect(brackets, u.actionFront, hy - 210, u.actionFront + 22, hy - 160, 4);
  out.brackets = brackets;
  out.wippen = rrect(make(), -200, u.keyTopY - 40, -110, u.keyTopY - 8, 6);
  out.key = rrect(make(), u.xKey, u.keyTopY, u.lower.x - 10, u.keyTopY + 24, 3);
  out.keyTop = rect(make(), u.xKey, u.keyTopY, u.xKey + KEY_DIMS.whiteLen.mm, u.keyTopY + 6);
  out.keybed = rect(make(), u.xKey + 30, u.keybedY, u.lower.x + 10, u.keybedY + 30);
  out.slip = rrect(make(), u.xKey - 14, u.keyTopY - 6, u.xKey, u.keybedY + 30, 3);
  out.toe = rrect(make(), u.xKey + 30, u.keybedY + 30, u.xKey + 110, FLOOR_Y - 46, 10);
  out.caster = oval(make(), u.xKey + 70, FLOOR_Y - 24, 24, 24);
  out.fallboard = rrect(make(), u.panel.x - 70, u.keyTopY - 70, u.panel.x - 6, u.keyTopY - 6, 8);
  out.panel = rrect(make(), u.panel.x - u.panel.t, u.panel.y0, u.panel.x, u.panel.y1, 4);
  out.panelGhost = rrect(make(), u.panel.x - u.panel.t, u.panel.y0, u.panel.x, u.panel.y1, 4);
  out.lower = rrect(make(), u.lower.x - 18, u.lower.y0, u.lower.x, u.lower.y1, 4);
  out.topBoard = rect(make(), u.panel.x - 18, u.yTop, u.top.x0, u.yTop + 22);
  out.lid = make();
  if (topClosed) {
    rect(out.lid, u.panel.x - 18, u.yTop - 22, u.xBack + 6, u.yTop);
  } else {
    const h = u.lid.hinge;
    const t = u.lid.tip;
    const nx = (t.y - h.y) / Math.hypot(t.x - h.x, t.y - h.y);
    const ny = -(t.x - h.x) / Math.hypot(t.x - h.x, t.y - h.y);
    out.lid.moveTo(h.x, h.y);
    out.lid.lineTo(t.x, t.y);
    out.lid.lineTo(t.x + nx * -20, t.y + ny * -20);
    out.lid.lineTo(h.x + nx * -20, h.y + ny * -20);
    out.lid.close();
  }
  const pedals = make();
  pedals.moveTo(-480, FLOOR_Y - 52);
  pedals.lineTo(-640, FLOOR_Y - 46);
  pedals.lineTo(-642, FLOOR_Y - 34);
  pedals.lineTo(-480, FLOOR_Y - 38);
  pedals.close();
  out.pedals = pedals;
  out.wall = rect(make(), wallX, -950, wallX + 60, FLOOR_Y);
  const wallHatch = make();
  for (let y = -950; y < FLOOR_Y + 60; y += 40) seg(wallHatch, wallX + 60, y, wallX + 120, y - 60);
  out.wallHatch = wallHatch;
  out.wallFace = seg(make(), wallX, -950, wallX, FLOOR_Y);
  out.floor = seg(make(), u.xKey - 700, FLOOR_Y, wallX + 60, FLOOR_Y);
  upSideCache.set(key, out);
  return out;
}

export function UprightSide({ panelOn = true, dim = 1, wallX, topClosed = false }: { panelOn?: boolean; dim?: number; wallX?: number; topClosed?: boolean }) {
  const u = uprightGeom();
  const p = uprightSidePaths(panelOn, wallX ?? u.wallX, topClosed);
  return (
    <Group opacity={dim}>
      <Path path={p.floorShadow} color="#000" opacity={0.55}>
        <BlurMask blur={22} style="normal" />
      </Path>
      {/* the wall behind */}
      <Path path={p.wall} color={P.WALL} opacity={0.55} />
      <Path path={p.wallHatch} style="stroke" strokeWidth={4} color={P.WALL} opacity={0.5} />
      <Path path={p.wallFace} style="stroke" strokeWidth={5} color="#7b808c" />
      {/* the far cheek's inside face, the back posts */}
      <Path path={p.cheek}>
        <LinearGradient start={vec(u.xKey, u.yTop)} end={vec(u.xBack, FLOOR_Y)} colors={['#3a3c44', '#1d1e23', '#101013']} />
      </Path>
      <Path path={p.cheek} style="stroke" strokeWidth={12} color="#aab0bc" opacity={0.75} />
      <Path path={p.backPosts}>
        <LinearGradient start={vec(60, 0)} end={vec(u.xBack, 0)} colors={['#8a6a3a', '#5a4020']} />
      </Path>
      <Path path={p.ribs} color="#8a6a3a" />
      <Path path={p.board}>
        <LinearGradient start={vec(u.soundboard.x0, 0)} end={vec(u.soundboard.x1, 0)} colors={[...P.SPRUCE]} />
      </Path>
      <Path path={p.bridge}>
        <LinearGradient start={vec(6, 0)} end={vec(28, 0)} colors={[...P.MAPLE]} />
      </Path>
      <Path path={p.pinBlock} color="#8a6430" />
      <Path path={p.plateTop}>
        <LinearGradient start={vec(-14, 0)} end={vec(28, 0)} colors={[...P.GOLD]} positions={[0, 0.35, 0.75, 1]} />
      </Path>
      <Path path={p.plateBottom}>
        <LinearGradient start={vec(-14, 0)} end={vec(28, 0)} colors={[...P.GOLD]} positions={[0, 0.35, 0.75, 1]} />
      </Path>
      <Path path={p.pins}>
        <LinearGradient start={vec(-30, 0)} end={vec(0, 0)} colors={['#eef1f6', '#7a7f8a']} />
      </Path>
      <Path path={p.strings} style="stroke" strokeWidth={4} color={P.STEEL} />
      {/* the action */}
      <Path path={p.brackets} color="#52565f" />
      <Path path={p.damperLever} style="stroke" strokeWidth={6} strokeCap="round" color="#b89260" />
      <Path path={p.damper}>
        <LinearGradient start={vec(-36, 0)} end={vec(-4, 0)} colors={['#6a5844', '#3a2f24']} />
      </Path>
      <Path path={p.shank} style="stroke" strokeWidth={8} strokeCap="round" color="#b89260" />
      <Path path={p.butt} color="#7a5a34" />
      <Path path={p.hammer}>
        <LinearGradient start={vec(-70, u.hammerY - 30)} end={vec(-6, u.hammerY + 30)} colors={['#fbf6e8', P.FELT, '#b9ad92']} />
      </Path>
      <Path path={p.hammer} style="stroke" strokeWidth={2} color="#5a5040" opacity={0.7} />
      <Path path={p.wippen} color="#7a5a34" />
      {/* keys, keybed, toe block and caster, pedals, panels, top, lid */}
      <Path path={p.keybed} color="#3a2a18" />
      <Path path={p.toe}>
        <LinearGradient start={vec(u.xKey + 30, 0)} end={vec(u.xKey + 110, 0)} colors={[...P.LACQUER]} positions={[...P.LACQUER_POS]} />
      </Path>
      <Path path={p.caster}>
        <LinearGradient start={vec(0, FLOOR_Y - 48)} end={vec(0, FLOOR_Y)} colors={['#c9a85a', '#7a5a20']} />
      </Path>
      <Path path={p.key}>
        <LinearGradient start={vec(0, u.keyTopY)} end={vec(0, u.keyTopY + 24)} colors={['#d8c79f', '#9c855a']} />
      </Path>
      <Path path={p.keyTop} color={P.IVORY[0]} />
      <Path path={p.slip} color="#0e0e11" />
      <Path path={p.pedals}>
        <LinearGradient start={vec(0, FLOOR_Y - 52)} end={vec(0, FLOOR_Y - 34)} colors={['#f3d98d', '#a37a2a']} />
      </Path>
      <Path path={p.lower}>
        <LinearGradient start={vec(u.lower.x - 18, 0)} end={vec(u.lower.x, 0)} colors={['#3e4048', '#0c0c0f']} />
      </Path>
      <Path path={p.fallboard}>
        <LinearGradient start={vec(u.panel.x - 70, 0)} end={vec(u.panel.x, 0)} colors={['#4a4c55', '#141418']} />
      </Path>
      {panelOn ? (
        <Path path={p.panel}>
          <LinearGradient start={vec(u.panel.x - u.panel.t, u.panel.y0)} end={vec(u.panel.x, u.panel.y1)} colors={['#4a4c55', '#141418', '#0a0a0c']} />
        </Path>
      ) : (
        <Path path={p.panelGhost} style="stroke" strokeWidth={4} color="#9aa0ab" opacity={0.6}>
          <DashPathEffect intervals={[18, 12]} />
        </Path>
      )}
      <Path path={p.topBoard} color="#141418" />
      <Path path={p.lid}>
        <LinearGradient start={vec(u.lid.hinge.x, u.lid.tip.y)} end={vec(u.lid.tip.x + 20, u.lid.hinge.y)} colors={['#5a5d66', '#1f2025', '#0c0c0f']} />
      </Path>
      <Path path={p.lid} style="stroke" strokeWidth={3} color="#9aa0ab" opacity={0.55} />
      <Path path={p.floor} style="stroke" strokeWidth={3} color="#3a3d45" />
    </Group>
  );
}

/* ═════════════════════════════════ UPRIGHT · PLAN ═══════════════════════════════ */

const upPlanCache: { p: Record<string, SkPath> | null } = { p: null };
function uprightPlanPaths(): Record<string, SkPath> {
  if (upPlanCache.p) return upPlanCache.p;
  const u = uprightGeom();
  const hw = u.hw;
  const o: Record<string, SkPath> = {};
  o.shadow = rect(make(), u.xKey, -hw, u.xBack, hw);
  o.caseTop = rect(make(), u.panel.x - 18, -hw, u.xBack, hw);
  o.opening = rect(make(), u.top.x0, -hw + 40, u.top.x1, hw - 40);
  o.board = rect(make(), u.soundboard.x0, -hw + 50, u.soundboard.x1, hw - 50);
  o.posts = make();
  for (const z of [-hw + 60, -hw / 3, hw / 3, hw - 60]) rect(o.posts, 60, z - 30, u.xBack, z + 30);
  o.strings = make();
  for (let k = 1; k <= KEYBOARD.keys; k += 1) {
    const z = keyZ(k) * 1.02;
    seg(o.strings, -6, z, 6, z);
  }
  o.stringLine = seg(make(), 0, -hw + 70, 0, hw - 70);
  o.hammers = make();
  for (let k = 1; k <= KEYBOARD.keys; k++) rrect(o.hammers, -70, keyZ(k) - 5.5, -8, keyZ(k) + 5.5, 3);
  o.dampers = make();
  for (let k = 1; k <= 70; k++) rrect(o.dampers, -36, keyZ(k) - 5, -4, keyZ(k) + 5, 2);
  o.cheeks = make();
  rect(o.cheeks, u.xKey, -hw, u.panel.x, KEYS_Z0 - 2);
  rect(o.cheeks, u.xKey, -KEYS_Z0 + 2, u.panel.x, hw);
  o.keybedBack = rect(make(), u.xKey + KEY_DIMS.whiteLen.mm, KEYS_Z0, u.panel.x - 18, -KEYS_Z0);
  o.lidTop = rect(make(), u.xBack, -hw + 10, u.lid.tip.x, hw - 10);
  o.wall = rect(make(), u.wallX, -1100, u.wallX + 60, 1100);
  o.wallHatch = make();
  for (let z = -1100; z < 1160; z += 40) seg(o.wallHatch, u.wallX + 60, z, u.wallX + 120, z - 60);
  upPlanCache.p = o;
  return o;
}

export function UprightPlan({ dim = 1 }: { dim?: number }) {
  const u = uprightGeom();
  const p = uprightPlanPaths();
  return (
    <Group opacity={dim}>
      <Path path={p.wall} color={P.WALL} opacity={0.55} />
      <Path path={p.wallHatch} style="stroke" strokeWidth={4} color={P.WALL} opacity={0.5} />
      <Group transform={[{ translateX: 26 }, { translateY: 30 }]}>
        <Path path={p.shadow} color="#000" opacity={0.6}>
          <BlurMask blur={34} style="normal" />
        </Path>
      </Group>
      <Path path={p.caseTop}>
        <LinearGradient start={vec(u.panel.x, -u.hw)} end={vec(u.xBack, u.hw)} colors={[...P.LACQUER]} positions={[...P.LACQUER_POS]} />
      </Path>
      {/* through the open top: posts, soundboard, strings, dampers, hammers */}
      <Path path={p.opening} color="#0c0c0f" />
      <Group clip={p.opening}>
        <Path path={p.board}>
          <LinearGradient start={vec(u.soundboard.x0, 0)} end={vec(u.soundboard.x1, 0)} colors={[...P.SPRUCE]} />
        </Path>
        <Path path={p.stringLine} style="stroke" strokeWidth={8} color="#8a8f99" />
        <Path path={p.strings} style="stroke" strokeWidth={2.4} color={P.STEEL} />
        <Path path={p.dampers} color="#3a2f24" />
        <Path path={p.hammers}>
          <LinearGradient start={vec(-70, 0)} end={vec(-8, 0)} colors={['#b9ad92', '#fbf6e8']} />
        </Path>
      </Group>
      <Path path={p.posts} color="#6a4c26" opacity={0.0} />
      <Path path={p.opening} style="stroke" strokeWidth={4} color="#000" opacity={0.7} />
      <Path path={p.caseTop} style="stroke" strokeWidth={5} color="#9aa0ab" opacity={0.5} />
      {/* the open lid, leaning back: seen from above, a narrow board */}
      <Path path={p.lidTop}>
        <LinearGradient start={vec(u.xBack, 0)} end={vec(u.lid.tip.x, 0)} colors={['#5a5d66', '#202126']} />
      </Path>
      <Path path={p.cheeks}>
        <LinearGradient start={vec(u.xKey, -u.hw)} end={vec(u.panel.x, u.hw)} colors={[...P.LACQUER]} positions={[...P.LACQUER_POS]} />
      </Path>
      <Path path={p.keybedBack} color="#141418" />
      <KeyboardPlan xKey={u.xKey} />
    </Group>
  );
}

/* ═══════════════════════════ THE PIANIST (ILLUSTRATIVE) ══════════════════════════ */

const benchCache = new Map<string, Record<string, SkPath>>();
function pianistPaths(pn: Pianist, xKey: number, pedalX: number, view: 'side' | 'top'): Record<string, SkPath> {
  const key = `${view}:${xKey}:${pedalX}`;
  const hit = benchCache.get(key);
  if (hit) return hit;
  const o: Record<string, SkPath> = {};
  const b = pn.bench;
  const h = pn.head;
  if (view === 'side') {
    o.benchTop = rrect(make(), b.x0, b.y - 60, b.x1, b.y, 14);
    o.benchLegs = make();
    rect(o.benchLegs, b.x0 + 20, b.y, b.x0 + 54, FLOOR_Y);
    rect(o.benchLegs, b.x1 - 54, b.y, b.x1 - 20, FLOOR_Y);
    // Seated, facing +x: thigh, shin and shoe to the pedals; torso; arm to the keys.
    const hipX = (b.x0 + b.x1) / 2 - 10;
    const hipY = b.y - 80;
    const knee = { x: b.x1 + 60, y: b.y - 90 };
    const ankle = { x: pedalX - 120, y: FLOOR_Y - 90 };
    o.thigh = make();
    o.thigh.moveTo(hipX - 70, hipY - 60);
    o.thigh.lineTo(knee.x + 30, knee.y - 55);
    o.thigh.quadTo(knee.x + 70, knee.y, knee.x + 20, knee.y + 60);
    o.thigh.lineTo(hipX - 80, hipY + 60);
    o.thigh.close();
    o.shin = make();
    o.shin.moveTo(knee.x - 25, knee.y + 20);
    o.shin.lineTo(knee.x + 55, knee.y + 20);
    o.shin.lineTo(ankle.x + 40, ankle.y);
    o.shin.lineTo(ankle.x - 30, ankle.y);
    o.shin.close();
    o.shoe = make();
    o.shoe.moveTo(ankle.x - 40, ankle.y - 10);
    o.shoe.lineTo(ankle.x + 40, ankle.y - 16);
    o.shoe.quadTo(pedalX + 40, FLOOR_Y - 70, pedalX + 30, FLOOR_Y - 40);
    o.shoe.lineTo(ankle.x - 40, FLOOR_Y - 40);
    o.shoe.close();
    const shoulder = { x: h.x + 30, y: h.y + 200 };
    o.torso = make();
    o.torso.moveTo(hipX - 110, hipY + 40);
    o.torso.quadTo(hipX - 150, (hipY + shoulder.y) / 2, shoulder.x - 120, shoulder.y);
    o.torso.quadTo(shoulder.x, shoulder.y - 50, shoulder.x + 80, shoulder.y + 10);
    o.torso.quadTo(hipX + 120, (hipY + shoulder.y) / 2, hipX + 90, hipY + 40);
    o.torso.close();
    o.neck = rrect(make(), h.x - 30, h.y + 70, h.x + 40, shoulder.y, 20);
    o.head = oval(make(), h.x, h.y, pn.headR * 0.92, pn.headR);
    o.hair = make();
    o.hair.addArc(Skia.XYWHRect(h.x - pn.headR * 0.95, h.y - pn.headR * 1.05, pn.headR * 1.9, pn.headR * 1.6), 160, 220);
    o.hair.close();
    const elbow = { x: shoulder.x + 90, y: shoulder.y + 230 };
    const hand = { x: xKey + 60, y: KEY_TOP_Y - 18 };
    o.upperArm = make();
    o.upperArm.moveTo(shoulder.x - 30, shoulder.y + 10);
    o.upperArm.lineTo(shoulder.x + 60, shoulder.y);
    o.upperArm.lineTo(elbow.x + 40, elbow.y);
    o.upperArm.lineTo(elbow.x - 40, elbow.y + 10);
    o.upperArm.close();
    o.forearm = make();
    o.forearm.moveTo(elbow.x - 30, elbow.y - 25);
    o.forearm.lineTo(hand.x - 30, hand.y - 30);
    o.forearm.lineTo(hand.x - 20, hand.y + 10);
    o.forearm.lineTo(elbow.x - 10, elbow.y + 35);
    o.forearm.close();
    o.hand = make();
    o.hand.moveTo(hand.x - 40, hand.y - 34);
    o.hand.quadTo(hand.x + 40, hand.y - 40, hand.x + 70, hand.y + 14);
    o.hand.lineTo(hand.x - 30, hand.y + 16);
    o.hand.close();
  } else {
    o.benchTop = rrect(make(), b.x0, -b.hw, b.x1, b.hw, 16);
    o.thighs = make();
    for (const s of [-1, 1]) {
      o.thighs.moveTo(b.x1 - 140, s * 40);
      o.thighs.lineTo(b.x1 + 120, s * 70);
      o.thighs.lineTo(b.x1 + 120, s * 190);
      o.thighs.lineTo(b.x1 - 140, s * 180);
      o.thighs.close();
    }
    o.torso = oval(make(), h.x + 20, 0, 150, 230);
    o.arms = make();
    for (const s of [-1, 1]) {
      o.arms.moveTo(h.x + 40, s * 170);
      o.arms.lineTo(xKey + 40, s * 260);
      o.arms.lineTo(xKey + 40, s * 320);
      o.arms.lineTo(h.x + 30, s * 250);
      o.arms.close();
    }
    o.hands = make();
    for (const s of [-1, 1]) oval(o.hands, xKey + 70, s * 290, 55, 48);
    o.head = oval(make(), h.x, 0, pn.headR * 0.9, pn.headR * 0.82);
    o.hair = oval(make(), h.x - 18, 0, pn.headR * 0.78, pn.headR * 0.74);
  }
  benchCache.set(key, o);
  return o;
}

/** The pianist's joints for the shared player (playerPose.ts), cached: the
 *  same anchors as before (the head, the bench, the key fronts, the pedals),
 *  in profile from the side and from above. */
const pianistPoseCache = new Map<string, PlayerPose>();
function pianistPose(pn: Pianist, xKey: number, pedalX: number, view: 'side' | 'top'): PlayerPose {
  const key = `${view}:${xKey}:${pedalX}`;
  const hit = pianistPoseCache.get(key);
  if (hit) return hit;
  const h = pn.head;
  const b = pn.bench;
  let pose: PlayerPose;
  if (view === 'side') {
    // Seated in profile, facing +x (the keys): thighs forward under the
    // keybed, the near foot on the pedal, the forearms level to the keys.
    const hip = pt(b.x0 + 170, b.y - 85);
    const knee = pt(hip.u + 440, b.y - 105);
    const keysV = KEY_TOP_Y - 45;
    pose = {
      view: 'side',
      posture: 'seated',
      facing: 1,
      head: { c: pt(h.x, h.y), r: pn.headR },
      neck: pt(h.x - 20, h.y + 160),
      shoulderR: pt(h.x - 20, h.y + 215),
      shoulderL: pt(h.x - 34, h.y + 205),
      elbowR: pt(h.x + 100, h.y + 480),
      elbowL: pt(h.x + 86, h.y + 468),
      handR: { wrist: pt(xKey - 20, keysV), dir: 0.12, kind: 'keys' },
      handL: { wrist: pt(xKey - 40, keysV - 6), dir: 0.12, kind: 'keys' },
      hipR: hip,
      hipL: pt(hip.u - 10, hip.v - 4),
      kneeR: knee,
      kneeL: pt(knee.u - 20, knee.v - 6),
      footR: pt(pedalX - 70, FLOOR_Y),
      footL: pt(pedalX - 170, FLOOR_Y),
      floor: FLOOR_Y,
    };
  } else {
    // From above, authored chest toward +v round the neck, then turned to
    // face +x (`facing` 0): local (a, b) lands at world (b, −a) from the neck.
    const n = pt(h.x - 10, 0);
    const L = (right: number, fwd: number) => pt(n.u - right, n.v + fwd);
    const handFwd = xKey + 60 - n.u - 150;
    pose = {
      view: 'above',
      posture: 'seated',
      facing: 0,
      head: { c: L(0, -18), r: pn.headR },
      neck: n,
      shoulderR: L(BODY.shoulderHalf, 4),
      shoulderL: L(-BODY.shoulderHalf, 4),
      elbowR: L(250, handFwd - 140),
      elbowL: L(-250, handFwd - 140),
      handR: { wrist: L(270, handFwd), dir: Math.PI / 2, kind: 'above' },
      handL: { wrist: L(-270, handFwd), dir: Math.PI / 2, kind: 'above' },
      hipR: L(106, -40),
      hipL: L(-106, -40),
      kneeR: L(130, 430),
      kneeL: L(-130, 430),
      footR: L(140, 500),
      footL: L(-140, 500),
      floor: null,
    };
  }
  pianistPoseCache.set(key, pose);
  return pose;
}

/** The pianist on the bench, ILLUSTRATIVE, muted so it never competes with
 *  the instrument (charter §6). `xKey`: the key fronts; `pedalX`: the pedals.
 *  The figure is the shared player (clarity pass 2026-10-05: the house
 *  figure standard and line-art head, in place of a circle head and blocks). */
export function Pianist({ view, xKey, pedalX, dim = 0.9 }: { view: 'side' | 'top'; xKey: number; pedalX: number; dim?: number }) {
  const pn = pianistAt(xKey, pedalX);
  const p = pianistPaths(pn, xKey, pedalX, view);
  const pose = pianistPose(pn, xKey, pedalX, view);
  if (view === 'side') {
    return (
      <Group opacity={dim}>
        <Path path={p.benchLegs} color="#141418" />
        <Path path={p.benchTop}>
          <LinearGradient start={vec(pn.bench.x0, pn.bench.y - 60)} end={vec(pn.bench.x1, pn.bench.y)} colors={['#4a4c55', '#141418']} />
        </Path>
        <PlayerBehind pose={pose} />
        <PlayerInFront pose={pose} />
      </Group>
    );
  }
  return (
    <Group opacity={dim}>
      <Path path={p.benchTop}>
        <LinearGradient start={vec(pn.bench.x0, -pn.bench.hw)} end={vec(pn.bench.x1, pn.bench.hw)} colors={['#4a4c55', '#141418']} />
      </Path>
      <PlayerBehind pose={pose} />
      <PlayerInFront pose={pose} />
    </Group>
  );
}

/** The hammer line, dashed amber (the line the readouts measure from). */
export function HammerLine({ view, y0 = -200, y1 = 120 }: { view: 'side' | 'top'; y0?: number; y1?: number }) {
  const path = view === 'top' ? seg(make(), 0, KEYS_Z0 - 40, 0, -KEYS_Z0 + 40) : seg(make(), 0, y0, 0, y1);
  return (
    <Path path={path} style="stroke" strokeWidth={5} color="#ffc64d" opacity={0.85}>
      <DashPathEffect intervals={[22, 14]} />
    </Path>
  );
}

export { LID_DEG, lidUnderY };
export type { GrandGeom };
