/**
 * ELECTRIC GUITAR and ELECTRIC BASS, drawn face-on — Lab 4's amplified-chain
 * lessons, ORIENT. The view is the PLAYER'S view of the front (looking down
 * at the guitar): headstock to the left, so the LOW string lies along the
 * BOTTOM edge of the neck (nearest the player) and the high string along the
 * top — a RIGHT-HANDED instrument. That puts, as on the real thing:
 *   • the tuners' buttons along the headstock's bass (lower) edge, posts on
 *     the face;
 *   • the longer horn on the bass side (lower), the shorter on the treble side;
 *   • the volume/tone knobs, the selector and the output jack on the treble
 *     side behind the bridge (upper right).
 * (Art pass 2026-10-10: the old drawing was a mirror image — a left-handed
 * guitar — with the tuners floating off the headstock.)
 *
 * Drawn only from electricSpec.ts (local mm: u along the strings, 0 at the
 * nut, L at the bridge saddle; v across, + toward the bass side), so the
 * parts, the hit areas and the string display agree. A GENERIC offset
 * double-cutaway solid body — no maker's shape or logo.
 *
 * REAL DIMENSIONS (mm) the class is drawn to (code comment only, never shown):
 *   guitar  scale 648 (25.5 in); body ≈ 455 long (horn tip to tail) × 320
 *           wide; overall ≈ 990; neck 42 at the nut → 56 at the body; 6
 *           strings, E–E spread ≈ 35 at the nut, ≈ 52 at the bridge;
 *           6-in-line headstock ≈ 175 × 85, posts ≈ 25 apart; three
 *           single-coil pickups 84 × 18 (bridge one slanted ≈ 9°); a
 *           vibrato bridge plate ≈ 56 × 42 with 6 saddles; knobs Ø 24;
 *           5-way selector; a face-mounted output jack cup ≈ 30 × 22.
 *   bass    scale 864 (34 in); body ≈ 460 × 350, the bass-side horn reaching
 *           ≈ the 12th fret; neck 38–42 at the nut → 64 at the body; 4
 *           strings; 4-in-line headstock with large tuners ≈ 40 apart; two
 *           single-coil pickups 95 × 20 with 2 poles per string; a bridge
 *           plate ≈ 72 × 75 with 4 saddles; three knobs on a chrome plate.
 *
 * Light from the upper left, gradients for form, rim highlights; the house
 * stroke hierarchy. `px` (mm per screen pixel) keeps hairlines visible when
 * the same drawing is used small (the signal-chain icon). Static (D8): paths
 * are built once per instrument.
 */
import { BlurMask, Circle, Group, LinearGradient, Path, RadialGradient, Skia, vec } from '@shopify/react-native-skia';
import { fretU, type ElectricSpec } from './electricSpec.ts';

type SkPath = ReturnType<typeof Skia.Path.Make>;
const make = () => Skia.Path.Make();
const AMBER = '#ffc64d';

export const EL = {
  body: ['#a0281f', '#5e120e', '#2a0806'],
  bodyBass: ['#35507a', '#1a2a4a', '#0a101e'],
  rim: '#f2c9a0',
  guard: ['#f6f2e8', '#ddd6c6', '#b6ae9c'],
  guardEdge: '#1a1a1c',
  guardBass: ['#6a3a22', '#40200f', '#1e0d06'],
  maple: ['#ecd09a', '#cfa264', '#9a6c34'],
  rose: ['#4a2b1b', '#2e1a10', '#1a0e08'],
  fret: '#d6d9df',
  chrome: ['#f2f4f8', '#9aa0ab', '#3a3d45'],
  pickup: ['#2a2b30', '#121316', '#060607'],
  string: '#c9ccd3',
  wound: '#b9a98a',
  inlay: '#efe9dc',
  ink: '#08080a',
} as const;

/*
 * THE BODY, designed once in a body frame (x from the bass-side horn tip, 0,
 * to the tail, 457; y across, + toward the bass side; half-width 162) and
 * mapped onto each instrument: a generic offset double cutaway, the bass-side
 * horn longer, the treble cutaway deeper (upper-fret access), a waist, a
 * round lower bout. Points are smoothed into one curve (Catmull-Rom).
 */
const BODY_PTS: readonly (readonly [number, number])[] = [
  [113, -30], [111, -42], [104, -55], [92, -67], [76, -77], [58, -86], [42, -96], [32, -108], [32, -121], [42, -133], [60, -143], [86, -150], [118, -152],
  [150, -148], [182, -137], [210, -128], [238, -126], [266, -132], [298, -147], [335, -159], [372, -161], [404, -153], [430, -133], [447, -100], [455, -55], [457, 0],
  [455, 55], [447, 100], [430, 133], [404, 153], [372, 161], [335, 159], [298, 148], [266, 134], [238, 126], [208, 126], [178, 134], [148, 146], [116, 152],
  [84, 150], [54, 141], [28, 127], [10, 113], [1, 99], [3, 87], [14, 79], [31, 72], [48, 63], [61, 51], [69, 39], [73, 29],
];
/** The guitar's scratch plate: round the neck end, over the three pickups, a
 *  lobe holding the controls, a square cut-out round the bridge plate. */
const GUARD_PTS: readonly (readonly [number, number])[] = [
  [117, -33], [117, -46], [110, -60], [96, -73], [76, -86], [58, -99], [52, -112], [60, -124], [80, -133], [110, -137], [145, -132], [180, -121], [212, -112],
  [244, -112], [274, -120], [304, -132], [334, -140], [360, -136], [377, -122], [382, -104], [374, -84], [352, -66], [330, -52], [322, -40], [270, -37], [270, 37],
  [287, 40], [299, 54], [294, 80], [268, 102], [230, 110], [195, 114], [160, 124], [122, 132], [86, 130], [56, 122], [32, 108], [26, 95], [36, 86], [54, 78], [66, 64], [74, 48], [78, 33],
];
/** The bass's scratch plate: round the neck pickup only (the bridge pickup and
 *  the control plate sit on the bare body, as on the common four-string). */
const BASS_GUARD_PTS: readonly (readonly [number, number])[] = [
  [117, -33], [117, -46], [110, -60], [96, -73], [76, -86], [58, -100], [56, -113], [72, -125], [100, -131], [140, -126], [172, -114], [192, -96], [198, -70],
  [200, -44], [200, 44], [206, 62], [210, 90], [196, 110], [160, 124], [118, 132], [80, 130], [46, 120], [24, 104], [20, 92], [32, 84], [52, 77], [66, 64], [74, 48], [78, 33],
];
type BodyMap = { uJ: number; uTail: number; hornX: number };
/** Where the body frame lands on each instrument: the treble cutaway meets the
 *  neck at uJ; the tail at uTail; the bass's horn reaches further forward. */
function bodyMap(s: ElectricSpec): BodyMap {
  const uTail = s.bodyU0 + s.bodyLen;
  return s.id === 'bass' ? { uJ: s.bodyU0 + 36, uTail, hornX: 48 } : { uJ: s.bodyU0 + 66, uTail, hornX: 0 };
}
/** Body frame (x, y) → instrument (u, v). */
function toUV(s: ElectricSpec, x: number, y: number): { u: number; v: number } {
  const m = bodyMap(s);
  const k = (m.uTail - m.uJ) / (457 - 113);
  let u = m.uJ + (x - 113) * k;
  if (y > 0 && x < 130) u -= m.hornX * (1 - x / 130);
  return { u, v: (y * s.bodyHalfW) / 162 };
}
/** A closed smooth curve through the points (Catmull-Rom as cubics). */
function smoothClosed(s: ElectricSpec, pts: readonly (readonly [number, number])[]): SkPath {
  const P = pts.map(([x, y]) => toUV(s, x, y));
  const n = P.length;
  const p = make();
  p.moveTo(P[0].u, P[0].v);
  for (let i = 0; i < n; i++) {
    const p0 = P[(i - 1 + n) % n];
    const p1 = P[i];
    const p2 = P[(i + 1) % n];
    const p3 = P[(i + 2) % n];
    p.cubicTo(p1.u + (p2.u - p0.u) / 6, p1.v + (p2.v - p0.v) / 6, p2.u - (p3.u - p1.u) / 6, p2.v - (p3.v - p1.v) / 6, p2.u, p2.v);
  }
  p.close();
  return p;
}
const bodyPath = (s: ElectricSpec) => smoothClosed(s, BODY_PTS);
const guardPath = (s: ElectricSpec) => smoothClosed(s, s.id === 'bass' ? BASS_GUARD_PTS : GUARD_PTS);
/** The bass-side horn tip's u (the body's forward reach). */
const hornTipU = (s: ElectricSpec) => toUV(s, 1, 99).u;

/** The headstock: an in-line paddle, the tuners' buttons out past its BASS (lower) edge. */
function headPath(s: ElectricSpec): SkPath {
  const H = s.headLen;
  const h0 = s.neckHalfW[0];
  const bass = s.id === 'bass';
  const tw = bass ? 34 : 24; // the treble lobe's extra width at the tip
  const bw = bass ? 18 : 15; // the bass edge's offset from the nut's corner
  const p = make();
  p.moveTo(0, -h0);
  p.cubicTo(-0.28 * H, -h0, -0.55 * H, -h0 - 2, -0.7 * H, -h0 - 8);
  p.cubicTo(-0.8 * H, -h0 - 13, -0.84 * H, -h0 - tw, -0.92 * H, -h0 - tw);
  p.cubicTo(-0.98 * H, -h0 - tw, -H, -h0 - tw * 0.6, -H, -h0 * 0.2);
  p.cubicTo(-H, h0 * 0.7, -0.98 * H, h0 + bw, -0.92 * H, h0 + bw);
  p.lineTo(-0.2 * H, h0 + bw);
  p.cubicTo(-0.1 * H, h0 + bw, -0.07 * H, h0, 0, h0);
  p.close();
  return p;
}

export type ElectricBuilt = {
  body: SkPath;
  guard: SkPath | null;
  neck: SkPath;
  board: SkPath;
  frets: SkPath;
  inlays: { u: number; v: number }[];
  head: SkPath;
  /** Tuner posts on the face (u, v) and their buttons past the bass edge. */
  tuners: { u: number; v: number }[];
  buttons: SkPath;
  shafts: SkPath;
  tree: { u: number; v: number } | null;
  nut: SkPath;
  pickups: { id: string; path: SkPath; poles: { u: number; v: number }[] }[];
  bridge: SkPath;
  saddles: SkPath;
  bridgeScrews: { u: number; v: number }[];
  strings: { path: SkPath; wound: boolean }[];
  knobs: { u: number; v: number; r: number }[];
  /** The bass's chrome control plate (null on the guitar). */
  plate: SkPath | null;
  selector: { u: number; v: number; ang: number } | null;
  jack: { u: number; v: number };
  guardScrews: { u: number; v: number }[];
  stringV: (i: number, u: number) => number;
};

const cache = new Map<string, ElectricBuilt>();

/** v of string i (0 = low) at u along the instrument: the low string on the BASS side (+v). */
function stringVOf(s: ElectricSpec) {
  const spreadNut = s.neckHalfW[0] * (s.id === 'bass' ? 0.74 : 0.83);
  const spreadBridge = s.id === 'bass' ? 28 : 26;
  return (i: number, u: number) => {
    const t = Math.max(0, Math.min(1, u / s.scale.mm));
    const half = spreadNut + (spreadBridge - spreadNut) * t;
    const k = s.strings === 1 ? 0 : i / (s.strings - 1);
    return half - 2 * half * k;
  };
}

function rot(p: SkPath, cu: number, cv: number, ang: number): SkPath {
  p.transform(Skia.Matrix().translate(cu, cv).rotate(ang).translate(-cu, -cv));
  return p;
}

export function buildElectric(s: ElectricSpec, fretless = false): ElectricBuilt {
  const key = `${s.id}:${fretless ? 'fl' : 'fr'}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const bass = s.id === 'bass';
  const L = s.scale.mm;
  const [h0, h1] = s.neckHalfW;
  // The neck ends where the fretboard does (its heel sits in the body's pocket, under the board's end).
  const joint = fretU(s.frets, L) + 12;
  const halfAt = (u: number) => h0 + ((h1 - h0) * Math.max(0, Math.min(u, joint))) / joint;
  const neck = make();
  neck.moveTo(-6, -h0 - 1);
  neck.lineTo(joint, -halfAt(joint) - 1);
  neck.lineTo(joint, halfAt(joint) + 1);
  neck.lineTo(-6, h0 + 1);
  neck.close();
  const boardEnd = fretU(s.frets, L) + 10;
  const board = make();
  board.moveTo(0, -h0);
  board.lineTo(boardEnd, -halfAt(boardEnd));
  board.cubicTo(boardEnd + 4, -halfAt(boardEnd) * 0.4, boardEnd + 4, halfAt(boardEnd) * 0.4, boardEnd, halfAt(boardEnd));
  board.lineTo(0, h0);
  board.close();
  const frets = make();
  const inlays: { u: number; v: number }[] = [];
  for (let n = 1; n <= s.frets; n++) {
    const u = fretU(n, L);
    const hw = halfAt(u);
    frets.moveTo(u, -hw);
    frets.lineTo(u, hw);
    const mid = (fretU(n - 1, L) + u) / 2;
    if ([3, 5, 7, 9, 15, 17, 19, 21].includes(n)) inlays.push({ u: mid, v: 0 });
    if (n === 12) inlays.push({ u: mid, v: -hw * 0.5 }, { u: mid, v: hw * 0.5 });
  }
  // Headstock: in-line tuners, low string's post nearest the nut; posts on
  // the face toward the bass edge, buttons out past that edge.
  const H = s.headLen;
  const head = headPath(s);
  const nTun = s.strings;
  const first = bass ? 0.22 * H : 0.21 * H;
  const pitch = bass ? 0.2 * H : 0.142 * H;
  const postV = bass ? h0 + 2 : h0 - 2;
  const tuners = Array.from({ length: nTun }, (_, i) => ({ u: -first - i * pitch, v: postV }));
  const edgeV = h0 + (bass ? 18 : 15);
  const buttons = make();
  const shafts = make();
  for (const t of tuners) {
    const bw = bass ? 26 : 12;
    const bl = bass ? 26 : 18;
    shafts.addRect(Skia.XYWHRect(t.u - (bass ? 4 : 2.5), edgeV - 2, bass ? 8 : 5, bass ? 10 : 7));
    if (bass) {
      // A bass tuner's large "clover" key.
      buttons.addRRect(Skia.RRectXY(Skia.XYWHRect(t.u - bw / 2, edgeV + 7, bw, bl), 9, 11));
    } else buttons.addRRect(Skia.RRectXY(Skia.XYWHRect(t.u - bw / 2, edgeV + 4, bw, bl), 5, 5));
  }
  const tree = bass ? null : { u: -(first + 3.5 * pitch), v: -4 };
  const nut = make();
  nut.addRect(Skia.XYWHRect(-5, -h0 - 1, 5, 2 * h0 + 2));
  const sv = stringVOf(s);
  // Pickups: single coils with a pole under each string (two per string on the bass).
  const pickups = s.pickups.map((pk, n) => {
    const u = L - pk.fromBridge;
    const w = bass ? 20 : 18;
    const hw = bass ? 47 : 42;
    const path = make();
    path.addRRect(Skia.RRectXY(Skia.XYWHRect(u - w / 2, -hw, w, 2 * hw), w / 2, w / 2));
    // The guitar's bridge pickup is slanted: its treble end nearer the bridge.
    const slant = !bass && n === s.pickups.length - 1 ? (-9 * Math.PI) / 180 : 0;
    if (slant) rot(path, u, 0, slant);
    const poles: { u: number; v: number }[] = [];
    for (let i = 0; i < s.strings; i++) {
      const v0 = sv(i, u);
      const offs = bass ? [-5, 5] : [0];
      for (const d of offs) {
        const vv = v0 + d;
        poles.push({ u: u + vv * Math.tan(-slant), v: vv });
      }
    }
    return { id: pk.id, path, poles };
  });
  // Bridge plate and saddles.
  const bridge = make();
  const bw = bass ? 70 : 42;
  const bh = bass ? 37 : 29;
  bridge.addRRect(Skia.RRectXY(Skia.XYWHRect(L - 10, -bh, bw, 2 * bh), bass ? 4 : 3, bass ? 4 : 3));
  const saddles = make();
  const sw = bass ? 22 : 15;
  const sh = bass ? 13 : 8.4;
  for (let i = 0; i < s.strings; i++) {
    const v = sv(i, L);
    // Intonated saddles: the low (wound) strings set a little farther back.
    const back = bass ? 4 + (s.strings - 1 - i) * 1.4 : [5, 3.5, 2, 3.2, 1.6, 0][i] ?? 0;
    saddles.addRRect(Skia.RRectXY(Skia.XYWHRect(L - 3 + back, v - sh / 2, sw, sh), 2, 2));
  }
  const bridgeScrews = bass ? [] : Array.from({ length: 6 }, (_, i) => ({ u: L - 6, v: -bh + 6 + (i * (2 * bh - 12)) / 5 }));
  const tunerTop = (t: { u: number; v: number }) => ({ u: t.u, v: t.v });
  const strings = Array.from({ length: s.strings }, (_, i) => {
    const p = make();
    p.moveTo(0, sv(i, 0));
    p.lineTo(L + 2, sv(i, L));
    // Behind the nut, to its tuner post (under the tree for the top two).
    const t = tunerTop(tuners[i]);
    p.moveTo(0, sv(i, 0));
    if (tree && i >= s.strings - 2) {
      p.lineTo(tree.u, tree.v + (i - (s.strings - 2)) * 1.6 - 1);
      p.lineTo(t.u, t.v - 3);
    } else p.lineTo(t.u, t.v - (bass ? 6 : 3));
    return { path: p, wound: bass || i < 3 };
  });
  // Controls on the treble side behind the bridge (body frame → u, v).
  const at = (x: number, y: number) => toUV(s, x, y);
  const knobs = (bass ? [at(330, -70), at(360, -86), at(390, -102)] : [at(310, -58), at(336, -82), at(360, -104)]).map((q) => ({ ...q, r: bass ? 13 : 12 }));
  let plate: SkPath | null = null;
  if (bass) {
    // The chrome control plate: three knobs in a line and the jack at its end.
    const c0 = at(330, -70);
    const c1 = at(420, -118);
    const len = Math.hypot(c1.u - c0.u, c1.v - c0.v);
    plate = make();
    plate.addRRect(Skia.RRectXY(Skia.XYWHRect(c0.u - 22, c0.v - 19, len + 44, 38), 19, 19));
    rot(plate, c0.u, c0.v, Math.atan2(c1.v - c0.v, c1.u - c0.u));
  }
  const sel = at(268, -66);
  const selector = bass ? null : { u: sel.u, v: sel.v, ang: (-38 * Math.PI) / 180 };
  // The output jack: at the end of the bass's control plate; on the guitar a cup on the face near the treble edge.
  const jack = bass ? at(420, -118) : at(408, -118);
  // The scratch plate's screws, set in from its edge.
  const guardScrews = (bass
    ? [at(100, -122), at(186, -92), at(196, 0), at(196, 84), at(120, 122), at(40, 100), at(70, -88)]
    : [at(100, -126), at(205, -104), at(300, -124), at(366, -116), at(320, -48), at(282, 52), at(230, 100), at(120, 122), at(42, 98), at(72, -88)]
  );
  const built: ElectricBuilt = { body: bodyPath(s), guard: guardPath(s), neck, board, frets: fretless ? make() : frets, inlays, head, tuners, buttons, shafts, tree, nut, pickups, bridge, saddles, bridgeScrews, strings, knobs, plate, selector, jack, guardScrews, stringV: sv };
  cache.set(key, built);
  return built;
}

/** The drawing's box (u, v) with room for labels. */
export function electricBox(s: ElectricSpec) {
  return { u0: -s.headLen - 40, u1: s.bodyU0 + s.bodyLen + 40, v0: -s.bodyHalfW - 60, v1: s.bodyHalfW + 60 };
}

/** The instrument's own extent (no label room): for icons. */
export function electricExtent(s: ElectricSpec) {
  return { u0: -s.headLen, u1: s.bodyU0 + s.bodyLen, v0: -s.bodyHalfW, v1: s.bodyHalfW };
}

/** The instrument face-on. `pickupLit` rings one pickup in amber. `px`: mm per
 *  screen pixel (hairlines stay at least ~0.3 px when drawn small). */
export function ElectricFront({ s, fretless = false, highlight, pickupLit, px = 0 }: { s: ElectricSpec; fretless?: boolean; highlight?: string | null; pickupLit?: string | null; px?: number }) {
  const b = buildElectric(s, fretless);
  const bass = s.id === 'bass';
  const L = s.scale.mm;
  const W = s.bodyHalfW;
  const lw = (mm: number, minPx: number) => Math.max(mm, minPx * px);
  const bodyCols = bass ? EL.bodyBass : EL.body;
  const hi = highlightPath(s, b, highlight ?? null);
  return (
    <Group>
      {/* Drop shadow, then the body: a deep finish lit from the upper left, a rim highlight. */}
      <Group transform={[{ translateX: 10 }, { translateY: 14 }]}>
        <Path path={b.body} color="#000" opacity={0.55}>
          <BlurMask blur={16} style="normal" />
        </Path>
      </Group>
      <Path path={b.body}>
        <RadialGradient c={vec(s.bodyU0 + s.bodyLen * 0.38, -W * 0.45)} r={s.bodyLen * 0.85} colors={[...bodyCols]} />
      </Path>
      {/* The edge's round-over catches the light on the upper (treble) edge. */}
      <Group clip={b.body}>
        <Group transform={[{ translateX: 5 }, { translateY: 7 }]}>
          <Path path={b.body} style="stroke" strokeWidth={lw(16, 1)} color="#000" opacity={0.35} />
        </Group>
      </Group>
      <Path path={b.body} style="stroke" strokeWidth={lw(3.2, 0.4)} color={EL.rim} opacity={0.25} />
      <Path path={b.body} style="stroke" strokeWidth={lw(1.2, 0.35)} color={EL.ink} />
      {b.guard ? (
        <>
          <Path path={b.guard}>
            <LinearGradient start={vec(s.bodyU0, -W)} end={vec(s.bodyU0 + s.bodyLen, W)} colors={bass ? [...EL.guardBass] : [...EL.guard]} />
          </Path>
          {/* Three-ply edge: a dark bevel line inside the white. */}
          <Path path={b.guard} style="stroke" strokeWidth={lw(2.4, 0.3)} color="#8f8878" />
          <Path path={b.guard} style="stroke" strokeWidth={lw(0.8, 0.25)} color={EL.guardEdge} />
          {b.guardScrews.map((q, i) => (
            <Circle key={`gs${i}`} cx={q.u} cy={q.v} r={lw(2.6, 0.25)} color="#9aa0ab" />
          ))}
        </>
      ) : null}
      {b.plate ? (
        <>
          <Path path={b.plate}>
            <LinearGradient start={vec(L + 50, -W)} end={vec(L + 175, -W * 0.2)} colors={[...EL.chrome]} />
          </Path>
          <Path path={b.plate} style="stroke" strokeWidth={lw(1, 0.3)} color={EL.ink} />
        </>
      ) : null}
      {/* Neck and headstock (maple), the fretboard (rosewood) with frets and inlays. */}
      <Path path={b.head}>
        <LinearGradient start={vec(-s.headLen, -s.neckHalfW[0] - 30)} end={vec(0, s.neckHalfW[0] + 10)} colors={[...EL.maple]} />
      </Path>
      <Path path={b.head} style="stroke" strokeWidth={lw(1.2, 0.35)} color={EL.ink} />
      <Path path={b.neck}>
        <LinearGradient start={vec(0, -s.neckHalfW[1])} end={vec(0, s.neckHalfW[1])} colors={[...EL.maple]} />
      </Path>
      <Path path={b.board}>
        <LinearGradient start={vec(0, -s.neckHalfW[1])} end={vec(0, s.neckHalfW[1])} colors={[...EL.rose]} />
      </Path>
      <Path path={b.board} style="stroke" strokeWidth={lw(1, 0.25)} color={EL.ink} />
      <Path path={b.frets} style="stroke" strokeWidth={lw(2.2, 0.25)} color={EL.fret} />
      {fretless
        ? Array.from({ length: s.frets }, (_, i) => fretU(i + 1, L)).map((u, i) => <Circle key={`fl${i}`} cx={u} cy={s.neckHalfW[1] + 1} r={1.6} color={EL.inlay} opacity={0.8} />)
        : b.inlays.map((d, i) => <Circle key={`in${i}`} cx={d.u} cy={d.v} r={bass ? 4.5 : 4} color={EL.inlay} />)}
      <Path path={b.nut} color="#efe8d6" />
      {/* Tuners: the keys' shafts and buttons past the bass edge, posts with bushings on the face. */}
      <Path path={b.shafts}>
        <LinearGradient start={vec(0, s.neckHalfW[0])} end={vec(0, s.neckHalfW[0] + 30)} colors={[...EL.chrome]} />
      </Path>
      <Path path={b.buttons}>
        <LinearGradient start={vec(-s.headLen, s.neckHalfW[0] + 10)} end={vec(-s.headLen * 0.4, s.neckHalfW[0] + 60)} colors={[...EL.chrome]} />
      </Path>
      <Path path={b.buttons} style="stroke" strokeWidth={lw(0.8, 0.25)} color={EL.ink} />
      {b.tuners.map((t, i) => (
        <Group key={`t${i}`}>
          <Circle cx={t.u} cy={t.v} r={bass ? 9 : 6}>
            <RadialGradient c={vec(t.u - 2, t.v - 2)} r={10} colors={[...EL.chrome]} />
          </Circle>
          <Circle cx={t.u} cy={t.v} r={bass ? 9 : 6} style="stroke" strokeWidth={lw(0.6, 0.2)} color={EL.ink} />
          <Circle cx={t.u} cy={t.v} r={bass ? 4.5 : 3} color="#2a2c32" />
        </Group>
      ))}
      {b.tree ? <Circle cx={b.tree.u} cy={b.tree.v} r={4} color="#c8ccd4" /> : null}
      {/* Pickups (pole pieces under each string), bridge plate and saddles. */}
      {b.pickups.map((pk) => (
        <Group key={pk.id}>
          <Path path={pk.path}>
            <LinearGradient start={vec(0, -s.neckHalfW[1] * 1.3)} end={vec(0, s.neckHalfW[1] * 1.3)} colors={bass ? [...EL.pickup] : ['#f7f3ea', '#d9d2c3', '#a8a090']} />
          </Path>
          <Path path={pk.path} style="stroke" strokeWidth={lw(1, 0.3)} color={bass ? '#5d6068' : '#6e675a'} />
          {pk.poles.map((q, i) => (
            <Circle key={i} cx={q.u} cy={q.v} r={bass ? 2.4 : 2.6} color={bass ? '#b8bcc6' : '#8e939d'} />
          ))}
          {pickupLit === pk.id ? <Path path={pk.path} style="stroke" strokeWidth={4} color={AMBER} /> : null}
        </Group>
      ))}
      <Path path={b.bridge}>
        <LinearGradient start={vec(L - 8, -s.neckHalfW[1])} end={vec(L + 40, s.neckHalfW[1])} colors={[...EL.chrome]} />
      </Path>
      <Path path={b.bridge} style="stroke" strokeWidth={lw(1, 0.3)} color={EL.ink} />
      {b.bridgeScrews.map((q, i) => (
        <Circle key={`bs${i}`} cx={q.u} cy={q.v} r={1.8} color="#5a5e68" />
      ))}
      <Path path={b.saddles}>
        <LinearGradient start={vec(L, -s.neckHalfW[1])} end={vec(L + 20, s.neckHalfW[1])} colors={['#f4f6fa', '#c3c8d0', '#7d828c']} />
      </Path>
      <Path path={b.saddles} style="stroke" strokeWidth={lw(0.6, 0.2)} color={EL.ink} />
      {b.selector ? <Selector at={b.selector} lw={lw} /> : null}
      {b.knobs.map((k, i) => (
        <Group key={`k${i}`}>
          <Circle cx={k.u + 2} cy={k.v + 3} r={k.r} color="#000" opacity={0.45} />
          <Circle cx={k.u} cy={k.v} r={k.r}>
            <RadialGradient c={vec(k.u - k.r * 0.4, k.v - k.r * 0.4)} r={k.r * 1.6} colors={bass ? ['#3a3c42', '#18191c', '#060607'] : ['#fbf8f0', '#d8d0bf', '#8f8775']} />
          </Circle>
          <Circle cx={k.u} cy={k.v} r={k.r * 0.55} style="stroke" strokeWidth={lw(0.8, 0.2)} color={bass ? '#55585f' : '#b8af9c'} />
        </Group>
      ))}
      {/* The output jack: a socket in a recessed cup (guitar) or on the control plate (bass). */}
      {!bass ? (
        <Path path={jackCup(b.jack.u, b.jack.v)}>
          <LinearGradient start={vec(b.jack.u - 16, b.jack.v - 12)} end={vec(b.jack.u + 16, b.jack.v + 12)} colors={[...EL.chrome]} />
        </Path>
      ) : null}
      <Circle cx={b.jack.u} cy={b.jack.v} r={bass ? 9 : 8} color="#1a1b1f" />
      <Circle cx={b.jack.u} cy={b.jack.v} r={bass ? 9 : 8} style="stroke" strokeWidth={lw(1.6, 0.25)} color="#c8ccd4" />
      <Circle cx={b.jack.u} cy={b.jack.v} r={3.6} color="#020203" />
      {/* Strings over everything (wound strings warmer). */}
      {b.strings.map((st, i) => (
        <Path key={`s${i}`} path={st.path} style="stroke" strokeWidth={st.wound ? (bass ? lw(2.6 - i * 0.3, 0.32) : lw(1.8 - i * 0.2, 0.26)) : lw(1.1, 0.22)} color={st.wound ? EL.wound : EL.string} />
      ))}
      {hi ? <Path path={hi} style="stroke" strokeWidth={4} color={AMBER} /> : null}
    </Group>
  );
}

/** The guitar's five-way selector: a slot in the plate, the lever with its tip. */
function Selector({ at, lw }: { at: { u: number; v: number; ang: number }; lw: (mm: number, minPx: number) => number }) {
  const slot = make();
  slot.addRRect(Skia.RRectXY(Skia.XYWHRect(at.u - 16, at.v - 2.5, 32, 5), 2.5, 2.5));
  rot(slot, at.u, at.v, at.ang);
  const tip = make();
  tip.addRRect(Skia.RRectXY(Skia.XYWHRect(at.u - 6, at.v - 5, 12, 10), 4, 4));
  rot(tip, at.u, at.v, at.ang);
  return (
    <Group>
      <Path path={slot} color="#1a1a1c" />
      <Path path={tip}>
        <LinearGradient start={vec(at.u - 6, at.v - 5)} end={vec(at.u + 6, at.v + 5)} colors={['#fbf8f0', '#d8d0bf', '#8f8775']} />
      </Path>
      <Path path={tip} style="stroke" strokeWidth={lw(0.6, 0.2)} color={EL.ink} />
    </Group>
  );
}

/** The guitar's recessed jack cup: an oval plate on the face. */
function jackCup(u: number, v: number): SkPath {
  const p = make();
  p.addOval(Skia.XYWHRect(u - 16, v - 12, 32, 24));
  return rot(p, u, v, (-30 * Math.PI) / 180);
}

/** The parts a learner can tap, in order. */
export const ELECTRIC_PARTS = ['el.strings', 'el.pickups', 'el.controls', 'el.jack', 'el.bridge', 'el.neck', 'el.head', 'el.body'] as const;

/** The part under (u, v), tol in mm. */
export function electricHit(s: ElectricSpec, u: number, v: number, tol: number): string | null {
  const b = buildElectric(s);
  const L = s.scale.mm;
  for (const k of b.knobs) if (Math.hypot(u - k.u, v - k.v) <= k.r + tol) return 'el.controls';
  if (b.selector && Math.hypot(u - b.selector.u, v - b.selector.v) <= 14 + tol) return 'el.controls';
  if (Math.hypot(u - b.jack.u, v - b.jack.v) <= 14 + tol) return 'el.jack';
  for (const pk of s.pickups) if (Math.abs(u - (L - pk.fromBridge)) <= 14 + tol * 0.5 && Math.abs(v) <= s.neckHalfW[1] * 1.3 + 12) return 'el.pickups';
  if (u >= L - 12 - tol && u <= L + (s.id === 'bass' ? 62 : 34) + tol && Math.abs(v) <= s.neckHalfW[1] * 1.3 + 10) return 'el.bridge';
  if (u < -4) return u >= -s.headLen - tol && Math.abs(v) <= s.neckHalfW[0] + 45 ? 'el.head' : null;
  if (u <= s.bodyU0 + 50 && Math.abs(v) <= s.neckHalfW[1] + tol * 0.4) return 'el.neck';
  if (u >= hornTipU(s) - 10 && u <= s.bodyU0 + s.bodyLen && Math.abs(v) <= s.bodyHalfW) return Math.abs(v) <= s.neckHalfW[1] && u <= L ? 'el.strings' : 'el.body';
  return null;
}

/** An amber outline round a tapped part. */
function highlightPath(s: ElectricSpec, b: ElectricBuilt, id: string | null): SkPath | null {
  if (!id) return null;
  const L = s.scale.mm;
  const p = make();
  const box = (u0: number, v0: number, u1: number, v1: number) => p.addRRect(Skia.RRectXY(Skia.XYWHRect(u0, v0, u1 - u0, v1 - v0), 10, 10));
  switch (id) {
    case 'el.strings':
      box(-8, -s.neckHalfW[1] - 10, L + 20, s.neckHalfW[1] + 10);
      break;
    case 'el.pickups':
      for (const pk of b.pickups) p.addPath(pk.path);
      break;
    case 'el.controls':
      for (const k of b.knobs) p.addCircle(k.u, k.v, k.r + 6);
      if (b.selector) p.addCircle(b.selector.u, b.selector.v, 18);
      break;
    case 'el.jack':
      p.addCircle(b.jack.u, b.jack.v, 20);
      break;
    case 'el.bridge':
      box(L - 18, -s.neckHalfW[1] * 1.3 - 14, L + (s.id === 'bass' ? 66 : 38), s.neckHalfW[1] * 1.3 + 14);
      break;
    case 'el.neck':
      box(-4, -s.neckHalfW[1] - 8, s.bodyU0 + 60, s.neckHalfW[1] + 8);
      break;
    case 'el.head':
      p.addPath(b.head);
      for (const t of b.tuners) p.addCircle(t.u, s.neckHalfW[0] + 30, s.id === 'bass' ? 18 : 12);
      break;
    case 'el.body':
      p.addPath(b.body);
      break;
    default:
      return null;
  }
  return p;
}
