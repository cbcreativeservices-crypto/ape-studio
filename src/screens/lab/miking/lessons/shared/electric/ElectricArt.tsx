/**
 * ELECTRIC GUITAR and ELECTRIC BASS, drawn face-on (the player's view of the
 * front, headstock to the left) — Lab 4's amplified-chain lessons, ORIENT.
 * Drawn only from electricSpec.ts (local mm: u along the strings, 0 at the
 * nut, L at the bridge saddle; v across), so the parts, the hit areas and the
 * string display agree. A generic solid body — no maker's shape or logo.
 *
 * Light from the upper left, gradients for form, rim highlights; the house
 * stroke hierarchy. Static (D8): paths are built once per instrument.
 */
import { BlurMask, Circle, Group, LinearGradient, Path, RadialGradient, Skia, vec } from '@shopify/react-native-skia';
import { fretU, type ElectricSpec } from './electricSpec.ts';

type SkPath = ReturnType<typeof Skia.Path.Make>;
const make = () => Skia.Path.Make();
const AMBER = '#ffc64d';

export const EL = {
  body: ['#7a1f1a', '#4a0f0c', '#260706'],
  bodyBass: ['#2c3d5c', '#16213a', '#0a101e'],
  rim: '#f2c9a0',
  guard: ['#f4efe4', '#d9d2c3', '#b2aa98'],
  maple: ['#e8c88e', '#c99a5a', '#9a6c34'],
  rose: ['#4a2b1b', '#2e1a10', '#1a0e08'],
  fret: '#d6d9df',
  chrome: ['#f2f4f8', '#9aa0ab', '#3a3d45'],
  pickup: ['#2a2b30', '#121316', '#060607'],
  string: '#c9ccd3',
  wound: '#b9a98a',
  inlay: '#efe9dc',
  ink: '#08080a',
} as const;

/** The body outline (a generic double cutaway), u0 = where the neck enters. */
function bodyPath(s: ElectricSpec): SkPath {
  const a = s.bodyU0;
  const b = s.bodyU0 + s.bodyLen;
  const W = s.bodyHalfW;
  const hn = s.neckHalfW[1];
  const p = make();
  p.moveTo(a + 46, -hn - 4);
  p.cubicTo(a + 20, -hn - 10, a - 34, -W * 0.7, a + 6, -W * 0.86);
  p.cubicTo(a + 44, -W * 1.0, a + 104, -W * 0.82, a + 150, -W * 0.7);
  p.cubicTo(a + 198, -W * 0.6, a + 228, -W * 1.0, b - 120, -W * 1.0);
  p.cubicTo(b - 28, -W * 1.0, b, -W * 0.56, b, 0);
  p.cubicTo(b, W * 0.56, b - 28, W * 1.0, b - 120, W * 1.0);
  p.cubicTo(a + 230, W * 1.0, a + 202, W * 0.66, a + 152, W * 0.74);
  p.cubicTo(a + 112, W * 0.82, a + 76, W * 0.98, a + 40, W * 0.9);
  p.cubicTo(a + 6, W * 0.82, a + 16, hn + 10, a + 46, hn + 4);
  p.close();
  return p;
}

function guardPath(s: ElectricSpec): SkPath {
  const a = s.bodyU0;
  const L = s.scale.mm;
  const W = s.bodyHalfW;
  const p = make();
  p.moveTo(a + 40, -s.neckHalfW[1] - 2);
  p.cubicTo(a + 30, -W * 0.5, a + 90, -W * 0.62, a + 150, -W * 0.56);
  p.cubicTo(a + 200, -W * 0.5, L - 70, -W * 0.5, L - 30, -W * 0.38);
  p.lineTo(L - 30, -s.neckHalfW[1] - 6);
  p.lineTo(L - 70, -s.neckHalfW[1] - 6);
  p.lineTo(L - 70, W * 0.3);
  p.cubicTo(L - 40, W * 0.5, L + 10, W * 0.86, L - 60, W * 0.86);
  p.cubicTo(a + 210, W * 0.9, a + 140, W * 0.7, a + 70, W * 0.72);
  p.cubicTo(a + 30, W * 0.7, a + 30, W * 0.3, a + 40, s.neckHalfW[1] + 2);
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
  tuners: { u: number; v: number }[];
  nut: SkPath;
  pickups: { id: string; path: SkPath; poles: { u: number; v: number }[] }[];
  bridge: SkPath;
  saddles: SkPath;
  strings: { path: SkPath; wound: boolean }[];
  knobs: { u: number; v: number; r: number }[];
  jack: { u: number; v: number };
  stringV: (i: number, u: number) => number;
};

const cache = new Map<string, ElectricBuilt>();

/** v of string i (0 = low) at u along the instrument. */
function stringVOf(s: ElectricSpec) {
  const spreadNut = s.neckHalfW[0] * 0.78;
  const spreadBridge = s.neckHalfW[1] * (s.id === 'bass' ? 1.05 : 0.98) + 4;
  return (i: number, u: number) => {
    const t = Math.max(0, Math.min(1, u / s.scale.mm));
    const half = spreadNut + (spreadBridge - spreadNut) * t;
    const k = s.strings === 1 ? 0 : i / (s.strings - 1);
    // The low string nearest the player's chin: drawn at the top (v < 0).
    return -half + 2 * half * k;
  };
}

export function buildElectric(s: ElectricSpec, fretless = false): ElectricBuilt {
  const key = `${s.id}:${fretless ? 'fl' : 'fr'}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const L = s.scale.mm;
  const [h0, h1] = s.neckHalfW;
  const joint = s.bodyU0 + 60;
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
  board.lineTo(boardEnd, halfAt(boardEnd));
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
  // Headstock: an asymmetric paddle, tuners along one side (generic).
  const H = s.headLen;
  const head = make();
  head.moveTo(0, -h0 - 1);
  head.cubicTo(-30, -h0 - 6, -H * 0.4, -h0 - 30, -H * 0.82, -h0 - 34);
  head.cubicTo(-H * 1.02, -h0 - 36, -H * 1.04, -h0 - 8, -H * 0.94, h0 * 0.2);
  head.cubicTo(-H * 0.8, h0 + 18, -H * 0.4, h0 + 10, -10, h0 + 2);
  head.lineTo(0, h0 + 1);
  head.close();
  const nTun = s.strings;
  const tuners = Array.from({ length: nTun }, (_, i) => ({ u: -H * 0.18 - (i * H * 0.66) / Math.max(1, nTun - 1), v: -h0 - 18 + i * 0.5 }));
  const nut = make();
  nut.addRect(Skia.XYWHRect(-5, -h0 - 1, 5, 2 * h0 + 2));
  const pickups = s.pickups.map((pk) => {
    const u = L - pk.fromBridge;
    const w = s.id === 'bass' ? 26 : 18;
    const hw = (s.id === 'bass' ? h1 * 1.25 : h1 * 1.18) + 6;
    const path = make();
    path.addRRect(Skia.RRectXY(Skia.XYWHRect(u - w / 2, -hw, w, 2 * hw), w / 2, w / 2));
    const poles = Array.from({ length: s.strings }, (_, i) => ({ u, v: stringVOf(s)(i, u) }));
    return { id: pk.id, path, poles };
  });
  const bridge = make();
  const bw = s.id === 'bass' ? 46 : 34;
  const bh = (s.id === 'bass' ? h1 * 1.2 : h1 * 1.25) + 10;
  bridge.addRRect(Skia.RRectXY(Skia.XYWHRect(L - 8, -bh, bw, 2 * bh), 5, 5));
  const saddles = make();
  const sv = stringVOf(s);
  for (let i = 0; i < s.strings; i++) {
    const v = sv(i, L);
    saddles.addRRect(Skia.RRectXY(Skia.XYWHRect(L - 4 + (i % 2) * 3, v - 4, 14, 8), 2, 2));
  }
  const strings = Array.from({ length: s.strings }, (_, i) => {
    const p = make();
    p.moveTo(0, sv(i, 0));
    p.lineTo(L, sv(i, L));
    // Behind the nut, to the tuners.
    const t = tuners[i];
    p.moveTo(0, sv(i, 0));
    p.lineTo(t.u, t.v + 8);
    return { path: p, wound: s.id === 'bass' || i < 3 };
  });
  const W = s.bodyHalfW;
  const knobs =
    s.id === 'bass'
      ? [
          { u: L + 70, v: W * 0.5, r: 13 },
          { u: L + 110, v: W * 0.42, r: 13 },
          { u: L + 150, v: W * 0.34, r: 13 },
        ]
      : [
          { u: L + 20, v: W * 0.56, r: 12 },
          { u: L + 60, v: W * 0.66, r: 12 },
          { u: L + 100, v: W * 0.7, r: 12 },
        ];
  const jack = { u: s.bodyU0 + s.bodyLen - 60, v: W * 0.92 };
  const built: ElectricBuilt = { body: bodyPath(s), guard: s.id === 'guitar' ? guardPath(s) : null, neck, board, frets: fretless ? make() : frets, inlays, head, tuners, nut, pickups, bridge, saddles, strings, knobs, jack, stringV: sv };
  cache.set(key, built);
  return built;
}

/** The drawing's box (u, v) with room for labels. */
export function electricBox(s: ElectricSpec) {
  return { u0: -s.headLen - 40, u1: s.bodyU0 + s.bodyLen + 40, v0: -s.bodyHalfW - 60, v1: s.bodyHalfW + 60 };
}

/** The instrument face-on. `pickupLit` rings one pickup in amber. */
export function ElectricFront({ s, fretless = false, highlight, pickupLit }: { s: ElectricSpec; fretless?: boolean; highlight?: string | null; pickupLit?: string | null }) {
  const b = buildElectric(s, fretless);
  const L = s.scale.mm;
  const W = s.bodyHalfW;
  const bodyCols = s.id === 'bass' ? EL.bodyBass : EL.body;
  const hi = highlightPath(s, b, highlight ?? null);
  return (
    <Group>
      {/* Drop shadow, then the body: deep finish lit from the upper left, a rim highlight. */}
      <Group transform={[{ translateX: 10 }, { translateY: 14 }]}>
        <Path path={b.body} color="#000" opacity={0.55}>
          <BlurMask blur={16} style="normal" />
        </Path>
      </Group>
      <Path path={b.body}>
        <RadialGradient c={vec(s.bodyU0 + s.bodyLen * 0.35, -W * 0.6)} r={s.bodyLen * 0.9} colors={[...bodyCols]} />
      </Path>
      <Path path={b.body} style="stroke" strokeWidth={3.2} color={EL.rim} opacity={0.22} />
      <Path path={b.body} style="stroke" strokeWidth={1.2} color={EL.ink} />
      {b.guard ? (
        <>
          <Path path={b.guard}>
            <LinearGradient start={vec(s.bodyU0, -W)} end={vec(s.bodyU0 + s.bodyLen, W)} colors={[...EL.guard]} />
          </Path>
          <Path path={b.guard} style="stroke" strokeWidth={1} color="#6e675a" />
        </>
      ) : null}
      {/* Neck and headstock (maple), the fretboard (rosewood) with frets and inlays. */}
      <Path path={b.head}>
        <LinearGradient start={vec(-s.headLen, -s.neckHalfW[0] - 30)} end={vec(0, s.neckHalfW[0] + 10)} colors={[...EL.maple]} />
      </Path>
      <Path path={b.head} style="stroke" strokeWidth={1.2} color={EL.ink} />
      <Path path={b.neck}>
        <LinearGradient start={vec(0, -s.neckHalfW[1])} end={vec(0, s.neckHalfW[1])} colors={[...EL.maple]} />
      </Path>
      <Path path={b.board}>
        <LinearGradient start={vec(0, -s.neckHalfW[1])} end={vec(0, s.neckHalfW[1])} colors={[...EL.rose]} />
      </Path>
      <Path path={b.board} style="stroke" strokeWidth={1} color={EL.ink} />
      <Path path={b.frets} style="stroke" strokeWidth={2.2} color={EL.fret} />
      {fretless
        ? Array.from({ length: s.frets }, (_, i) => fretU(i + 1, L)).map((u, i) => <Circle key={`fl${i}`} cx={u} cy={-s.neckHalfW[1] - 1} r={1.6} color={EL.inlay} opacity={0.8} />)
        : b.inlays.map((d, i) => <Circle key={`in${i}`} cx={d.u} cy={d.v} r={4} color={EL.inlay} />)}
      <Path path={b.nut} color="#efe8d6" />
      {b.tuners.map((t, i) => (
        <Group key={`t${i}`}>
          <Circle cx={t.u} cy={t.v} r={s.id === 'bass' ? 9 : 6.5}>
            <RadialGradient c={vec(t.u - 2, t.v - 2)} r={10} colors={[...EL.chrome]} />
          </Circle>
          <Path path={rr(t.u - 6, t.v - 22, t.u + 6, t.v - 9, 3)}>
            <LinearGradient start={vec(t.u - 6, t.v - 22)} end={vec(t.u + 6, t.v - 9)} colors={[...EL.chrome]} />
          </Path>
        </Group>
      ))}
      {/* Pickups (pole pieces under each string), bridge and saddles. */}
      {b.pickups.map((pk) => (
        <Group key={pk.id}>
          <Path path={pk.path}>
            <LinearGradient start={vec(0, -s.neckHalfW[1] * 1.3)} end={vec(0, s.neckHalfW[1] * 1.3)} colors={[...EL.pickup]} />
          </Path>
          <Path path={pk.path} style="stroke" strokeWidth={1} color="#5d6068" />
          {pk.poles.map((q, i) => (
            <Circle key={i} cx={q.u} cy={q.v} r={2.6} color="#b8bcc6" />
          ))}
          {pickupLit === pk.id ? <Path path={pk.path} style="stroke" strokeWidth={4} color={AMBER} /> : null}
        </Group>
      ))}
      <Path path={b.bridge}>
        <LinearGradient start={vec(L - 8, -s.neckHalfW[1])} end={vec(L + 40, s.neckHalfW[1])} colors={[...EL.chrome]} />
      </Path>
      <Path path={b.bridge} style="stroke" strokeWidth={1} color={EL.ink} />
      <Path path={b.saddles} color="#d9dce3" />
      <Path path={b.saddles} style="stroke" strokeWidth={0.6} color={EL.ink} />
      {b.knobs.map((k, i) => (
        <Group key={`k${i}`}>
          <Circle cx={k.u + 2} cy={k.v + 3} r={k.r} color="#000" opacity={0.45} />
          <Circle cx={k.u} cy={k.v} r={k.r}>
            <RadialGradient c={vec(k.u - k.r * 0.4, k.v - k.r * 0.4)} r={k.r * 1.6} colors={s.id === 'bass' ? [...EL.chrome] : ['#fbf8f0', '#d8d0bf', '#8f8775']} />
          </Circle>
        </Group>
      ))}
      <Circle cx={b.jack.u} cy={b.jack.v} r={11}>
        <RadialGradient c={vec(b.jack.u - 4, b.jack.v - 4)} r={14} colors={[...EL.chrome]} />
      </Circle>
      <Circle cx={b.jack.u} cy={b.jack.v} r={4} color="#050506" />
      {/* Strings over everything (wound strings warmer). */}
      {b.strings.map((st, i) => (
        <Path key={`s${i}`} path={st.path} style="stroke" strokeWidth={st.wound ? (s.id === 'bass' ? 2.6 : 1.8) : 1.1} color={st.wound ? EL.wound : EL.string} />
      ))}
      {hi ? <Path path={hi} style="stroke" strokeWidth={4} color={AMBER} /> : null}
    </Group>
  );
}

function rr(u0: number, v0: number, u1: number, v1: number, r: number) {
  const p = make();
  p.addRRect(Skia.RRectXY(Skia.XYWHRect(Math.min(u0, u1), Math.min(v0, v1), Math.abs(u1 - u0), Math.abs(v1 - v0)), r, r));
  return p;
}

/** The parts a learner can tap, in order. */
export const ELECTRIC_PARTS = ['el.strings', 'el.pickups', 'el.controls', 'el.jack', 'el.bridge', 'el.neck', 'el.head', 'el.body'] as const;

/** The part under (u, v), tol in mm. */
export function electricHit(s: ElectricSpec, u: number, v: number, tol: number): string | null {
  const b = buildElectric(s);
  const L = s.scale.mm;
  for (const k of b.knobs) if (Math.hypot(u - k.u, v - k.v) <= k.r + tol) return 'el.controls';
  if (Math.hypot(u - b.jack.u, v - b.jack.v) <= 14 + tol) return 'el.jack';
  for (const pk of s.pickups) if (Math.abs(u - (L - pk.fromBridge)) <= 14 + tol * 0.5 && Math.abs(v) <= s.neckHalfW[1] * 1.3 + 8) return 'el.pickups';
  if (u >= L - 10 - tol && u <= L + 46 + tol && Math.abs(v) <= s.neckHalfW[1] * 1.3 + 10) return 'el.bridge';
  if (u < -4) return u >= -s.headLen - tol && Math.abs(v) <= s.neckHalfW[0] + 40 ? 'el.head' : null;
  if (u <= s.bodyU0 + 50 && Math.abs(v) <= s.neckHalfW[1] + tol * 0.4) return Math.abs(v) <= s.neckHalfW[1] * 0.85 && tol < 30 ? 'el.neck' : 'el.neck';
  if (u >= s.bodyU0 - 20 && u <= s.bodyU0 + s.bodyLen && Math.abs(v) <= s.bodyHalfW) return Math.abs(v) <= s.neckHalfW[1] && u <= L ? 'el.strings' : 'el.body';
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
      break;
    case 'el.jack':
      p.addCircle(b.jack.u, b.jack.v, 18);
      break;
    case 'el.bridge':
      box(L - 16, -s.neckHalfW[1] * 1.3 - 18, L + 48, s.neckHalfW[1] * 1.3 + 18);
      break;
    case 'el.neck':
      box(-4, -s.neckHalfW[1] - 8, s.bodyU0 + 60, s.neckHalfW[1] + 8);
      break;
    case 'el.head':
      p.addPath(b.head);
      break;
    case 'el.body':
      p.addPath(b.body);
      break;
    default:
      return null;
  }
  return p;
}
