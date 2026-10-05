/**
 * THE OUD (C13) — the look, at the Kick's illustration standard: gradients
 * for form, light from the upper left, rim highlights, soft contact shadows.
 *
 *   OudFront  the face as the audience sees it: the pear-shaped spruce face
 *             with its marquetry border, the three carved rosettes (one large
 *             under the neck, two small low on the face), the tie-bridge low
 *             on the face, the fretless ebony fingerboard running onto the
 *             face, eleven strings in six courses, the bone nut, and the
 *             pegbox bent back from the neck with its pegs.
 *   OudAbove  the oud from above: the face edge-on, the deep bowl built of
 *             alternating staves, the neck and heel, the strings over the
 *             face, the pegbox sweeping back toward the player.
 * Every point comes from luteSpec.ts (all drawing defaults but the three
 * rosettes and the fretless neck). No maker's design, no likeness.
 */
import { BlurMask, Circle, DashPathEffect, Group, Line, LinearGradient, Path, RadialGradient, vec } from '@shopify/react-native-skia';
import { OUD } from './luteSpec.ts';
import type { LuteScene } from './luteModel.ts';
import { DEG, hull, make, oval, PAL, poly, rr, smooth, type HitArea, type Pt, type SkPath } from './luteDraw';

const A = (c: readonly string[]) => c as unknown as string[];

type OudPaths = ReturnType<typeof buildOud>;
const cache = new Map<string, OudPaths>();

function facePts(sc: LuteScene, inset = 0, n = 60): Pt[] {
  const g = sc.oud!;
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const x = g.tail + inset + ((g.joint - g.tail - inset * 1.2) * i) / n;
    pts.push([x, -Math.max(0, g.half(x) - inset)]);
  }
  for (let i = n; i >= 0; i--) {
    const x = g.tail + inset + ((g.joint - g.tail - inset * 1.2) * i) / n;
    pts.push([x, Math.max(0, g.half(x) - inset)]);
  }
  return pts;
}

/** The roses' carved lattice, face-on: an eight-point star in a ring, spokes, a boss. */
function roseLattice(cx: number, cy: number, r: number): { ring: SkPath; star: SkPath; inner: SkPath; spokes: SkPath; petals: SkPath } {
  const ring = make();
  ring.addCircle(cx, cy, r * 0.93);
  const star = make();
  for (const off of [0, Math.PI / 4]) {
    for (let k = 0; k <= 4; k++) {
      const a = off + (k * Math.PI) / 2;
      const x = cx + r * 0.84 * Math.cos(a);
      const y = cy + r * 0.84 * Math.sin(a);
      if (k === 0) star.moveTo(x, y);
      else star.lineTo(x, y);
    }
  }
  const inner = make();
  inner.addCircle(cx, cy, r * 0.42);
  const spokes = make();
  for (let k = 0; k < 8; k++) {
    const a = Math.PI / 8 + (k * Math.PI) / 4;
    spokes.moveTo(cx + r * 0.42 * Math.cos(a), cy + r * 0.42 * Math.sin(a));
    spokes.lineTo(cx + r * 0.93 * Math.cos(a), cy + r * 0.93 * Math.sin(a));
  }
  const petals = make();
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 4;
    const px = cx + r * 0.62 * Math.cos(a);
    const py = cy + r * 0.62 * Math.sin(a);
    petals.addCircle(px, py, r * 0.1);
  }
  return { ring, star, inner, spokes, petals };
}

function buildOud(sc: LuteScene) {
  const g = sc.oud!;
  const face = facePts(sc);
  const facePath = smooth(face);
  const border = smooth(facePts(sc, 10));
  const border2 = smooth(facePts(sc, 15));
  const grain = make();
  for (let y = -g.halfMax; y <= g.halfMax; y += 9) {
    grain.moveTo(g.tail, y);
    grain.lineTo(g.joint, y + Math.sin(y * 0.07) * 3);
  }
  // The fingerboard: from its rounded end over the face to the nut.
  const be = OUD.boardEnd.mm;
  const board: Pt[] = [];
  for (let i = 0; i <= 16; i++) {
    const a = Math.PI / 2 + (i / 16) * Math.PI;
    board.push([be + g.boardHalf(be) * 0.9 * Math.cos(a), g.boardHalf(be) * Math.sin(a)]);
  }
  board.push([g.nut, -g.boardHalf(g.nut)]);
  board.push([g.nut, g.boardHalf(g.nut)]);
  const boardPath = poly(board.map(([x, y]) => [x, y] as Pt));
  // The tie-bridge: a bar with flared ends (a "moustache").
  const bw = OUD.bridgeW.mm / 2;
  const bl = OUD.bridgeL.mm / 2;
  const bridge = smooth([
    [-bl, -bw - 8],
    [bl * 0.4, -bw - 2],
    [bl, -bw * 0.6],
    [bl, bw * 0.6],
    [bl * 0.4, bw + 2],
    [-bl, bw + 8],
    [-bl * 1.3, bw * 0.4],
    [-bl * 1.3, -bw * 0.4],
  ]);
  // Strings: six courses (the lowest single), bridge → nut, then into the pegbox.
  const c0 = g.courseYs(0);
  const cN = g.courseYs(g.nut);
  const strings: { path: SkPath; wound: boolean }[] = [];
  const pegs = pegsFront(sc);
  let peg = 0;
  c0.forEach((c, k) => {
    for (const off of c.pair ? [-1.2, 1.2] : [0]) {
      const p = make();
      p.moveTo(0, c.y + off);
      p.lineTo(g.nut, cN[k].y + off * 0.8);
      const pg = pegs[Math.min(peg++, pegs.length - 1)];
      p.lineTo(pg.wx, pg.wy);
      strings.push({ path: p, wound: k <= 2 });
    }
  });
  // The pegbox seen from the front: foreshortened (bent back 60°).
  const pe = g.pegboxEnd;
  const pegbox = poly([
    [g.nut, -24],
    [pe.x, -17],
    [pe.x + 6, 0],
    [pe.x, 17],
    [g.nut, 24],
  ]);
  const slot = poly([
    [g.nut + 8, -12],
    [pe.x - 6, -9],
    [pe.x - 6, 9],
    [g.nut + 8, 12],
  ]);
  const roses = [
    { cx: OUD.roseMainX.mm, cy: 0, r: OUD.roseMainD.mm / 2 },
    { cx: OUD.roseSmallX.mm, cy: -OUD.roseSmallY.mm, r: OUD.roseSmallD.mm / 2 },
    { cx: OUD.roseSmallX.mm, cy: OUD.roseSmallY.mm, r: OUD.roseSmallD.mm / 2 },
  ].map((q) => ({ ...q, lattice: roseLattice(q.cx, q.cy, q.r) }));

  /* ── from above (x, z): the bowl of staves, the face edge, the neck, the pegbox ── */
  const N = 64;
  const xs = Array.from({ length: N + 1 }, (_, i) => g.tail + ((g.joint - g.tail) * i) / N);
  const RIBS = 11;
  const ribZ = (k: number, x: number) => -g.depth(x) * Math.cos((Math.PI / 2) * (k / RIBS));
  const staves: { path: SkPath; light: boolean }[] = [];
  for (let k = 0; k < RIBS; k++) {
    const top = xs.map((x) => [x, ribZ(k, x)] as Pt);
    const bot = [...xs].reverse().map((x) => [x, ribZ(k + 1, x)] as Pt);
    staves.push({ path: poly([...top, ...bot]), light: k % 2 === 0 });
  }
  const ribLines = make();
  for (let k = 0; k <= RIBS; k++) xs.forEach((x, i) => (i === 0 ? ribLines.moveTo(x, ribZ(k, x)) : ribLines.lineTo(x, ribZ(k, x))));
  const bowl = poly([...xs.map((x) => [x, -g.depth(x)] as Pt), [g.joint, 0], [g.tail, 0]]);
  const neckAbove = smooth([
    [g.joint - 30, -g.depth(g.joint - 30) * 0.9],
    [g.joint + 40, -40],
    [g.nut, -34],
    [g.nut + 6, 0],
    [g.joint, 0],
  ]);
  const d = { x: Math.cos(OUD.pegboxDeg.mm * DEG), z: -Math.sin(OUD.pegboxDeg.mm * DEG) };
  const nrm = { x: -d.z, z: d.x };
  const b0: Pt = [g.nut + 2, OUD.stringH.mm - 4];
  const e0: Pt = [b0[0] + OUD.pegboxLen.mm * d.x, b0[1] + OUD.pegboxLen.mm * d.z];
  const T = 30;
  const pegboxAbove = poly([b0, e0, [e0[0] - nrm.x * T, e0[1] - nrm.z * T], [b0[0] - nrm.x * T - 14, b0[1] - nrm.z * T]]);
  const pegHeadsAbove: Pt[] = Array.from({ length: 6 }, (_, i) => {
    const t = 0.2 + 0.13 * i;
    return [b0[0] + OUD.pegboxLen.mm * d.x * t - nrm.x * T * 0.5, b0[1] + OUD.pegboxLen.mm * d.z * t - nrm.z * T * 0.5];
  });

  const hitsFront: HitArea[] = [
    { id: 'oud.pegbox', pts: [[g.nut, -80], [pe.x + 70, -80], [pe.x + 70, 80], [g.nut, 80]] },
    ...roses.slice(0, 1).map((q) => ({ id: 'oud.roseMain', pts: circlePts(q.cx, q.cy, q.r + 4) })),
    ...roses.slice(1).map((q) => ({ id: 'oud.roseSmall', pts: circlePts(q.cx, q.cy, q.r + 4) })),
    { id: 'oud.bridge', pts: [[-12, -bw - 10], [12, -bw - 10], [12, bw + 10], [-12, bw + 10]] },
    { id: 'oud.strings', pts: [[0, c0[0].y], [g.nut, cN[0].y], [g.nut, cN[cN.length - 1].y], [0, c0[c0.length - 1].y]], tol: -2 },
    { id: 'oud.board', pts: board },
    { id: 'oud.face', pts: face },
  ];
  const hitsAbove: HitArea[] = [
    { id: 'oud.pegbox', pts: [b0, e0, [e0[0] - nrm.x * T, e0[1] - nrm.z * T], [b0[0] - nrm.x * T - 14, b0[1] - nrm.z * T]] },
    { id: 'oud.strings', pts: [[4, OUD.stringH.mm - 4], [g.nut, OUD.stringH.mm - 4], [g.nut, OUD.stringH.mm + 4], [4, OUD.stringH.mm + 4]] },
    { id: 'oud.bridge', pts: [[-10, 0], [10, 0], [10, OUD.bridgeH.mm + 2], [-10, OUD.bridgeH.mm + 2]] },
    { id: 'oud.neck', pts: [[g.joint, -50], [g.nut, -40], [g.nut, 10], [g.joint, 10]] },
    { id: 'oud.face', pts: [[g.tail, -6], [g.joint, -6], [g.joint, 4], [g.tail, 4]] },
    { id: 'oud.bowl', pts: [...xs.map((x) => [x, -g.depth(x)] as Pt), [g.joint, 0], [g.tail, 0]] },
  ];
  return { face, facePath, border, border2, grain, boardPath, bridge, strings, pegbox, slot, pegs, roses, staves, ribLines, bowl, neckAbove, pegboxAbove, pegHeadsAbove, hitsFront, hitsAbove, bw, bl };
}

function circlePts(cx: number, cy: number, r: number, n = 24): Pt[] {
  return Array.from({ length: n }, (_, i) => [cx + r * Math.cos((i / n) * Math.PI * 2), cy + r * Math.sin((i / n) * Math.PI * 2)] as Pt);
}

/** The eleven pegs, front view: shafts out of both sides of the pegbox. */
function pegsFront(sc: LuteScene) {
  const g = sc.oud!;
  const pe = g.pegboxEnd;
  const out: { x: number; side: 1 | -1; wx: number; wy: number }[] = [];
  const n = OUD.strings.mm;
  for (let i = 0; i < n; i++) {
    const side: 1 | -1 = i % 2 === 0 ? -1 : 1;
    const t = (Math.floor(i / 2) + (side > 0 ? 0.5 : 0) + 0.6) / 6.3;
    const x = g.nut + 8 + (pe.x - g.nut - 14) * t;
    out.push({ x, side, wx: x, wy: side * 6 });
  }
  return out;
}

function pathsOf(sc: LuteScene): OudPaths {
  const key = 'oud';
  let p = cache.get(key);
  if (!p) {
    p = buildOud(sc);
    cache.set(key, p);
  }
  return p;
}

function Rose({ cx, cy, r, lattice }: { cx: number; cy: number; r: number; lattice: ReturnType<typeof roseLattice> }) {
  const w = Math.max(1.6, r * 0.075);
  return (
    <Group>
      <Circle cx={cx} cy={cy} r={r + 6} style="stroke" strokeWidth={4} color="#3a2416" />
      <Circle cx={cx} cy={cy} r={r + 6} style="stroke" strokeWidth={1.6} color={PAL.inlay} opacity={0.85}>
        <DashPathEffect intervals={[3, 2.4]} />
      </Circle>
      <Circle cx={cx} cy={cy} r={r}>
        <RadialGradient c={vec(cx + r * 0.2, cy + r * 0.25)} r={r * 1.1} colors={A(PAL.hole)} />
      </Circle>
      {/* the carved lattice: a dark undercut, then the lit wood */}
      <Group transform={[{ translateX: w * 0.5 }, { translateY: w * 0.7 }]} opacity={0.75}>
        {[lattice.ring, lattice.star, lattice.inner, lattice.spokes].map((p, i) => (
          <Path key={`s${i}`} path={p} style="stroke" strokeWidth={w} color="#2a170c" />
        ))}
      </Group>
      {[lattice.ring, lattice.star, lattice.inner, lattice.spokes].map((p, i) => (
        <Path key={`w${i}`} path={p} style="stroke" strokeWidth={w} strokeJoin="round">
          <LinearGradient start={vec(cx - r, cy - r)} end={vec(cx + r, cy + r)} colors={['#f6e2b6', '#d9b77c', '#a97f45']} />
        </Path>
      ))}
      <Path path={lattice.petals}>
        <LinearGradient start={vec(cx - r, cy - r)} end={vec(cx + r, cy + r)} colors={['#f1d9a6', '#c79b5c']} />
      </Path>
      <Circle cx={cx} cy={cy} r={r * 0.16}>
        <RadialGradient c={vec(cx - r * 0.06, cy - r * 0.06)} r={r * 0.2} colors={['#f6e2b6', '#b98c50']} />
      </Circle>
    </Group>
  );
}

export function OudFront({ sc, dim = 1 }: { sc: LuteScene; dim?: number }) {
  const P = pathsOf(sc);
  const g = sc.oud!;
  const pe = g.pegboxEnd;
  return (
    <Group opacity={dim}>
      {/* contact shadow and the bowl's dark rim round the face */}
      <Path path={P.facePath} color="#000" opacity={0.55} transform={[{ translateX: 10 }, { translateY: 16 }]}>
        <BlurMask blur={18} style="normal" />
      </Path>
      <Path path={P.facePath} style="stroke" strokeWidth={9} color="#2a170c" />
      <Path path={P.facePath}>
        <LinearGradient start={vec(g.tail, -g.halfMax)} end={vec(g.joint, g.halfMax)} colors={A(PAL.spruce)} />
      </Path>
      <Group clip={P.facePath}>
        <Path path={P.grain} style="stroke" strokeWidth={1.1} color="#8a6234" opacity={0.16} />
        <Circle cx={g.widest - 60} cy={-g.halfMax * 0.35} r={g.halfMax * 0.9}>
          <RadialGradient c={vec(g.widest - 60, -g.halfMax * 0.35)} r={g.halfMax * 0.9} colors={['rgba(255,248,226,0.28)', 'rgba(255,248,226,0)']} />
        </Circle>
      </Group>
      {/* the marquetry border inside the edge */}
      <Path path={P.border} style="stroke" strokeWidth={5} color="#3b2414" opacity={0.9} />
      <Path path={P.border} style="stroke" strokeWidth={3} color={PAL.inlay}>
        <DashPathEffect intervals={[5, 3.5]} />
      </Path>
      <Path path={P.border2} style="stroke" strokeWidth={1.2} color="#5a3a20" opacity={0.7} />
      <Path path={P.facePath} style="stroke" strokeWidth={2.5} color="#f9ecd0" opacity={0.6} />
      {/* the three rosettes */}
      {P.roses.map((q, i) => (
        <Rose key={`rose${i}`} cx={q.cx} cy={q.cy} r={q.r} lattice={q.lattice} />
      ))}
      {/* the pegbox and its pegs (behind the strings) */}
      {P.pegs.map((pg, i) => (
        <Group key={`peg${i}`}>
          <Path path={rr(pg.x - 3.5, pg.side * 14, pg.x + 3.5, pg.side * 58, 3)}>
            <LinearGradient start={vec(pg.x - 4, 0)} end={vec(pg.x + 4, 0)} colors={A(PAL.ebony)} />
          </Path>
          <Path path={oval(pg.x, pg.side * 66, 7.5, 12)}>
            <RadialGradient c={vec(pg.x - 3, pg.side * 66 - 4)} r={14} colors={['#5a4a3e', '#231b15', '#0e0b09']} />
          </Path>
          <Circle cx={pg.x} cy={pg.side * 76} r={3.4} color={PAL.bone[1]} />
        </Group>
      ))}
      <Path path={P.pegbox}>
        <LinearGradient start={vec(g.nut, -24)} end={vec(pe.x, 24)} colors={A(PAL.walnut)} />
      </Path>
      <Path path={P.slot} color="#120a05" />
      <Path path={P.pegbox} style="stroke" strokeWidth={1.8} color="#8a5a34" opacity={0.8} />
      {/* the fretless fingerboard */}
      <Path path={P.boardPath} color="#000" opacity={0.45} transform={[{ translateX: 3 }, { translateY: 5 }]}>
        <BlurMask blur={5} style="normal" />
      </Path>
      <Path path={P.boardPath}>
        <LinearGradient start={vec(OUD.boardEnd.mm, -g.boardHalf(OUD.boardEnd.mm))} end={vec(OUD.boardEnd.mm + 40, g.boardHalf(OUD.boardEnd.mm))} colors={A(PAL.ebony)} />
      </Path>
      <Path path={P.boardPath} style="stroke" strokeWidth={1.4} color="#6b5e52" opacity={0.7} />
      {/* the bone nut */}
      <Path path={rr(g.nut - 4, -g.boardHalf(g.nut) - 1, g.nut + 4, g.boardHalf(g.nut) + 1, 2)}>
        <LinearGradient start={vec(g.nut - 4, -20)} end={vec(g.nut + 4, 20)} colors={A(PAL.bone)} />
      </Path>
      {/* the tie-bridge */}
      <Path path={P.bridge} color="#000" opacity={0.5} transform={[{ translateX: 3 }, { translateY: 5 }]}>
        <BlurMask blur={4} style="normal" />
      </Path>
      <Path path={P.bridge}>
        <LinearGradient start={vec(-P.bl, -P.bw)} end={vec(P.bl, P.bw)} colors={A(PAL.rosewood)} />
      </Path>
      <Line p1={vec(-P.bl * 0.6, -P.bw)} p2={vec(-P.bl * 0.6, P.bw)} color="#7a4a30" strokeWidth={1.4} opacity={0.8} />
      {/* the strings, ties at the bridge */}
      {P.strings.map((s, i) => (
        <Path key={`st${i}`} path={s.path} style="stroke" strokeWidth={s.wound ? 1.5 : 1.1} color={s.wound ? PAL.bronze : PAL.nylon} opacity={0.95} />
      ))}
      {g.courseYs(0).map((c, i) => (
        <Circle key={`tie${i}`} cx={-3} cy={c.y} r={2.4} color={PAL.nylon} opacity={0.9} />
      ))}
    </Group>
  );
}

export function OudAbove({ sc, dim = 1 }: { sc: LuteScene; dim?: number }) {
  const P = pathsOf(sc);
  const g = sc.oud!;
  const D = OUD.bowlDepth.mm;
  return (
    <Group opacity={dim}>
      <Path path={P.bowl} color="#000" opacity={0.5} transform={[{ translateX: 10 }, { translateY: 12 }]}>
        <BlurMask blur={16} style="normal" />
      </Path>
      {/* the bowl: alternating staves, lit from the upper left */}
      {P.staves.map((s, i) => (
        <Path key={`sv${i}`} path={s.path}>
          <LinearGradient start={vec(g.tail, -D)} end={vec(g.joint, 0)} colors={s.light ? A(PAL.maple) : A(PAL.walnut)} />
        </Path>
      ))}
      <Path path={P.ribLines} style="stroke" strokeWidth={1.2} color="#1c0f07" opacity={0.75} />
      <Path path={P.bowl}>
        <LinearGradient start={vec(g.tail, -D)} end={vec(g.joint, 0)} colors={['rgba(255,240,210,0.18)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.35)']} />
      </Path>
      <Path path={P.bowl} style="stroke" strokeWidth={3} color="#22130a" />
      {/* the neck and heel, the pegbox swept back */}
      <Path path={P.neckAbove}>
        <LinearGradient start={vec(g.joint, -50)} end={vec(g.nut, 0)} colors={A(PAL.walnut)} />
      </Path>
      <Path path={P.pegboxAbove}>
        <LinearGradient start={vec(g.nut, -150)} end={vec(g.nut + 100, 10)} colors={A(PAL.walnut)} />
      </Path>
      <Path path={P.pegboxAbove} style="stroke" strokeWidth={1.8} color="#8a5a34" opacity={0.8} />
      {P.pegHeadsAbove.map(([x, z], i) => (
        <Group key={`ph${i}`}>
          <Circle cx={x} cy={z} r={9}>
            <RadialGradient c={vec(x - 3, z - 3)} r={11} colors={['#5a4a3e', '#231b15', '#0e0b09']} />
          </Circle>
          <Circle cx={x} cy={z} r={2.6} color={PAL.bone[1]} />
        </Group>
      ))}
      {/* the face, edge-on, and the fingerboard on it */}
      <Path path={rr(g.tail, -1, g.joint, 4, 1.5)}>
        <LinearGradient start={vec(g.tail, 0)} end={vec(g.joint, 0)} colors={A(PAL.spruce)} />
      </Path>
      <Path path={rr(OUD.boardEnd.mm, 2, g.nut, 8, 2)} color={PAL.ebony[1]} />
      <Path path={rr(-OUD.bridgeL.mm / 2, 0, OUD.bridgeL.mm / 2, OUD.bridgeH.mm, 2)} color={PAL.rosewood[0]} />
      <Line p1={vec(2, OUD.stringH.mm - 1)} p2={vec(g.nut, OUD.stringH.mm - 1)} color={PAL.bronze} strokeWidth={1.4} />
      <Line p1={vec(2, OUD.stringH.mm + 1)} p2={vec(g.nut, OUD.stringH.mm + 1)} color={PAL.nylon} strokeWidth={1.1} />
      <Path path={rr(g.nut - 4, 2, g.nut + 4, OUD.stringH.mm + 3, 1.5)} color={PAL.bone[0]} />
    </Group>
  );
}

export function oudHits(sc: LuteScene, view: 'side' | 'top'): HitArea[] {
  const P = pathsOf(sc);
  return view === 'side' ? P.hitsFront : P.hitsAbove;
}

export { hull as _hull };
