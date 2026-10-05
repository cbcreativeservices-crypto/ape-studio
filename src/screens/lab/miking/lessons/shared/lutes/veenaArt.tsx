/**
 * THE SARASWATI VEENA (C15) — the look. Drawn in the veena's own frame
 * (origin at the main bridge on the top plate, +x along the neck toward the
 * yali, +y across toward the audience side, +z out of the plate) and
 * projected through the posture: the face tilted up and a little toward the
 * player, the neck rising slightly toward the left thigh.
 *
 *   VeenaFront  as the audience sees it: the carved resonator bowl with its
 *               turned bands, the long neck's decorated side, the black wax
 *               ridges with the brass frets standing on them, the four melody
 *               strings, the three tala strings and their side pegs, the main
 *               pegs, the neck-end gourd (a support), and the carved, gilded
 *               yali head at the neck's end.
 *   VeenaAbove  from above: the top plate with its inlaid border and the
 *               broad flat bridge, the frets across their wax beds, the
 *               strings, the tala strings along the audience side, the yali.
 * Sizes: the overall length and the resonator's width are the Met veena's
 * (sourced); the rest are drawing defaults (luteSpec.ts). The yali is drawn
 * with care as a carved and gilded head — no particular maker's carving.
 */
import { BlurMask, Circle, DashPathEffect, Group, Line, LinearGradient, Path, RadialGradient, vec } from '@shopify/react-native-skia';
import { VEENA } from './luteSpec.ts';
import type { LuteScene } from './luteModel.ts';
import { bodySilhouette, bounds, curve, oval, PAL, poly, rr, smooth, vp, type HitArea, type Pt, type SkPath } from './luteDraw';
import type { ViewId } from '../../../engine/model/types.ts';

const A = (c: readonly string[]) => c as unknown as string[];
const cache = new Map<string, ReturnType<typeof build>>();

/** The yali in profile (the veena's x, z): a carved head at the neck's end,
 *  crested, its snout turned up, its jaw open, a scrolled beard below. */
const YALI: Pt[] = [
  [866, 6],
  [878, 28],
  [892, 46],
  [903, 36],
  [915, 44],
  [928, 31],
  [946, 25],
  [964, 21],
  [979, 15],
  [982, 5],
  [974, -2],
  [957, -4],
  [937, -14],
  [956, -21],
  [971, -29],
  [963, -39],
  [944, -43],
  [929, -52],
  [916, -68],
  [904, -86],
  [901, -106],
  [908, -124],
  [924, -134],
  [939, -126],
  [936, -110],
  [920, -106],
  [902, -94],
  [884, -86],
  [870, -70],
];
/** The open mouth (profile). */
const YALI_MOUTH: Pt[] = [
  [937, -14],
  [957, -5],
  [973, -3],
  [969, -27],
  [954, -21],
];
/** The yali from above (the veena's x, y). */
const YALI_TOP: Pt[] = [
  [864, -38],
  [884, -46],
  [912, -42],
  [940, -30],
  [964, -17],
  [982, 0],
  [964, 17],
  [940, 30],
  [912, 42],
  [884, 46],
  [864, 38],
];
const GILT = ['#f7de8e', '#dcae4c', '#a8741f', '#5e3d0c'];
const YRED = '#b0361f';

function build(sc: LuteScene) {
  const g = sc.veena!;
  const nh = g.neck.half;
  const F = (x: number, y: number, z: number): Pt => vp(sc, 'side', { x, y, z });
  const T = (x: number, y: number, z: number): Pt => vp(sc, 'top', { x, y, z });
  const D = sc.posture.D;
  /* ── front ── */
  const bowlF = bodySilhouette(sc, 'side', g.bowl.cx, g.bowl.a, g.bowl.c, g.bowl.zc, 0);
  // Turned bands round the bowl: the arcs that face the audience.
  const band = (z: number) => {
    const r = g.bowl.a * Math.sqrt(Math.max(0, 1 - ((z - g.bowl.zc) / g.bowl.c) ** 2));
    const pts: Pt[][] = [];
    let cur: Pt[] = [];
    for (let i = 0; i <= 72; i++) {
      const t = (i / 72) * Math.PI * 2;
      const n = D({ x: Math.cos(t) / g.bowl.a ** 2, y: Math.sin(t) / g.bowl.a ** 2, z: (z - g.bowl.zc) / g.bowl.c ** 2 });
      const vis = n.z > 0;
      if (vis) cur.push(F(g.bowl.cx + r * Math.cos(t), r * Math.sin(t), z));
      else if (cur.length) {
        pts.push(cur);
        cur = [];
      }
    }
    if (cur.length) pts.push(cur);
    return pts.filter((q) => q.length > 2).map((q) => curve(q));
  };
  const bands = [-45, -165].flatMap((z) => band(z));
  // The neck: its audience-side face and the sliver of its underside.
  const x0 = g.neck.x0;
  const x1 = g.neck.x1;
  const neckSide = poly([F(x0, nh, 0), F(x1, nh, 0), F(x1, nh, -g.neck.depth), F(x0, nh, -g.neck.depth)]);
  const neckUnder = poly([F(x0, nh, -g.neck.depth), F(x1, nh, -g.neck.depth), F(x1, -nh, -g.neck.depth), F(x0, -nh, -g.neck.depth)]);
  const neckInlay = [poly([F(x0 + 20, nh, -14), F(x1 - 10, nh, -14)], false), poly([F(x0 + 20, nh, -56), F(x1 - 10, nh, -56)], false)];
  const diamonds: SkPath[] = [];
  for (let x = x0 + 70; x < x1 - 40; x += 95) diamonds.push(poly([F(x - 16, nh, -35), F(x, nh, -24), F(x + 16, nh, -35), F(x, nh, -46)]));
  const fx0 = g.frets[g.frets.length - 1] - 18;
  const fx1 = g.frets[0] + 18;
  const waxF = poly([F(fx0, nh - 4, 0), F(fx1, nh - 4, 0), F(fx1, nh - 4, 12), F(fx0, nh - 4, 12)]);
  const fretTicks = g.frets.map((f) => poly([F(f, nh - 2, 13), F(f, -nh + 2, 13)], false));
  const tailX = g.tail + 14;
  const stringsF = g.melodyYs(0).map((y, i) => poly([F(tailX, y * 0.4, -4), F(0, y, VEENA.bridgeH.mm), F(g.nut, g.melodyYs(g.nut)[i], g.stringZ(g.nut)), F(g.nut + 30 + 12 * i, y * 0.6, 4)], false));
  const talaF = g.tala.map((t, i) => poly([F(tailX + 20, t.y - 20, -8), F(4, t.y, 13 - i), F(t.pegX, nh + 4, -18)], false));
  const talaPegF = g.tala.map((t) => ({ base: F(t.pegX, nh, -20), tip: F(t.pegX, nh + 62, -20) }));
  const mainPegs = [790, 836].map((x) => ({ base: F(x, nh, -30), tip: F(x, nh + 70, -30) }));
  const bridgeF = poly([F(-15, 28, 0), F(15, 28, 0), F(15, 28, VEENA.bridgeH.mm), F(-15, 28, VEENA.bridgeH.mm)]);
  const bridgeTopF = poly([F(-15, 28, VEENA.bridgeH.mm), F(15, 28, VEENA.bridgeH.mm), F(15, -28, VEENA.bridgeH.mm), F(-15, -28, VEENA.bridgeH.mm)]);
  const sideBridgeF = curve([F(-8, 30, 8), F(-2, 48, 14), F(6, 64, 10)]);
  const gourdC = F(g.gourd.x, 0, g.gourd.z);
  const collar = poly([F(g.gourd.x - 26, 0, -g.neck.depth), F(g.gourd.x + 26, 0, -g.neck.depth), F(g.gourd.x + 22, 0, g.gourd.z + g.gourd.r - 4), F(g.gourd.x - 22, 0, g.gourd.z + g.gourd.r - 4)]);
  const Y = (x: number, z: number) => F(x, nh * 0.2, z);
  const yaliF = smooth(YALI.map(([x, z]) => Y(x, z)));
  const yaliCollar = poly([Y(858, 8), Y(872, 8), Y(872, -74), Y(858, -74)]);
  const yaliEye = Y(931, 15);
  const yaliBrow = curve([Y(916, 24), Y(931, 30), Y(948, 23)]);
  const yaliMouth = poly(YALI_MOUTH.map(([x, z]) => Y(x, z)));
  const yaliTongue = curve([Y(940, -13), Y(952, -12), Y(961, -17), Y(966, -12)]);
  const teeth = [945, 953, 961].map((x) => poly([Y(x - 3, -4), Y(x + 3, -4), Y(x, -10)]));
  const teethLow = [950, 958].map((x) => poly([Y(x - 3, -22), Y(x + 3, -22), Y(x, -16)]));
  const yaliMane = [curve([Y(878, 24), Y(892, 4), Y(886, -30), Y(878, -58)]), curve([Y(896, 34), Y(908, 6), Y(902, -28), Y(894, -62)]), curve([Y(866, 0), Y(874, -30), Y(870, -60)])];
  const yaliScroll = curve([Y(912, -112), Y(916, -124), Y(926, -126), Y(930, -116), Y(922, -112)]);
  const yaliNostril = Y(973, 9);
  /* ── above ── */
  const bowlT = bodySilhouette(sc, 'top', g.bowl.cx, g.bowl.a, g.bowl.c, g.bowl.zc, 0);
  const ring = (r: number, z: number, view: ViewId) => {
    const out: Pt[] = [];
    for (let i = 0; i < 60; i++) {
      const t = (i / 60) * Math.PI * 2;
      out.push(vp(sc, view, { x: g.bowl.cx + r * Math.cos(t), y: r * Math.sin(t), z }));
    }
    return out;
  };
  const plateT = poly(ring(g.plateR, 0, 'top'));
  const plateInlay = poly(ring(g.plateR - 16, 1, 'top'));
  const plateInlay2 = poly(ring(g.plateR - 26, 1, 'top'));
  const neckTop = poly([T(x0 - 10, nh, 0), T(x1, nh, 0), T(x1, -nh, 0), T(x0 - 10, -nh, 0)]);
  const wax = [poly([T(fx0, 20, 0), T(fx1, 20, 0), T(fx1, 34, 0), T(fx0, 34, 0)]), poly([T(fx0, -34, 0), T(fx1, -34, 0), T(fx1, -20, 0), T(fx0, -20, 0)])];
  const fretsT = g.frets.map((f) => poly([T(f, -36, 13), T(f, 36, 13)], false));
  const stringsT = g.melodyYs(0).map((y, i) => poly([T(tailX, y * 0.4, -4), T(0, y, VEENA.bridgeH.mm), T(g.nut, g.melodyYs(g.nut)[i], g.stringZ(g.nut))], false));
  const talaT = g.tala.map((t) => poly([T(tailX + 20, t.y - 20, -8), T(4, t.y, 13), T(t.pegX, nh + 4, -18)], false));
  const talaPegT = g.tala.map((t) => ({ base: T(t.pegX, nh, -20), tip: T(t.pegX, nh + 62, -20) }));
  const mainPegT = [790, 836].flatMap((x) => [
    { base: T(x, nh, -30), tip: T(x, nh + 70, -30) },
    { base: T(x, -nh, -30), tip: T(x, -nh - 70, -30) },
  ]);
  const bridgeT = poly([T(-15, -28, VEENA.bridgeH.mm), T(15, -28, VEENA.bridgeH.mm), T(15, 28, VEENA.bridgeH.mm), T(-15, 28, VEENA.bridgeH.mm)]);
  const gourdTc = T(g.gourd.x, 0, g.gourd.z);
  const yaliT = smooth(YALI_TOP.map(([x, y]) => T(x, y, 20)));
  const yaliEyesT = [T(931, -24, 30), T(931, 24, 30)];
  /* ── hit areas ── */
  const hitsFront: HitArea[] = [
    { id: 'veena.yali', pts: YALI.map(([x, z]) => F(x, nh * 0.2, z)) },
    { id: 'veena.pegs', pts: [F(770, nh, -40), F(850, nh, -40), F(850, nh + 80, -40), F(770, nh + 80, -40), F(770, nh, 30)] },
    { id: 'veena.tala', pts: [...talaPegF.map((q) => q.tip), F(g.tala[2].pegX + 20, nh, -10), F(10, 64, 14), F(-10, 48, 14)] },
    { id: 'veena.bridge', pts: [F(-20, 30, -4), F(20, 30, -4), F(20, 30, 22), F(-20, 30, 22)] },
    { id: 'veena.frets', pts: [F(fx0, nh, 0), F(fx1, nh, 0), F(fx1, nh, 22), F(fx0, nh, 22)] },
    { id: 'veena.gourd', pts: Array.from({ length: 24 }, (_, i) => [gourdC[0] + g.gourd.r * Math.cos((i / 24) * Math.PI * 2), gourdC[1] + g.gourd.r * Math.sin((i / 24) * Math.PI * 2)] as Pt) },
    { id: 'veena.neck', pts: [F(x0, nh, 4), F(x1, nh, 4), F(x1, nh, -g.neck.depth), F(x0, nh, -g.neck.depth)] },
    { id: 'veena.plate', pts: ring(g.plateR, 0, 'side') },
    { id: 'veena.resonator', pts: bowlF },
  ];
  const hitsAbove: HitArea[] = [
    { id: 'veena.yali', pts: YALI_TOP.map(([x, y]) => T(x, y, 20)) },
    { id: 'veena.pegs', pts: [...mainPegT.map((q) => q.tip), T(780, 0, 0)] },
    { id: 'veena.tala', pts: [...talaPegT.map((q) => q.tip), T(g.tala[2].pegX + 20, nh, 0), T(0, 64, 13), T(0, 44, 13)] },
    { id: 'veena.bridge', pts: [T(-20, -32, 16), T(20, -32, 16), T(20, 32, 16), T(-20, 32, 16)] },
    { id: 'veena.frets', pts: [T(fx0, -nh, 13), T(fx1, -nh, 13), T(fx1, nh, 13), T(fx0, nh, 13)] },
    { id: 'veena.neck', pts: [T(x0, nh, 0), T(x1, nh, 0), T(x1, -nh, 0), T(x0, -nh, 0)] },
    { id: 'veena.plate', pts: ring(g.plateR, 0, 'top') },
    { id: 'veena.resonator', pts: bowlT },
    { id: 'veena.gourd', pts: Array.from({ length: 24 }, (_, i) => [gourdTc[0] + g.gourd.r * Math.cos((i / 24) * Math.PI * 2), gourdTc[1] + g.gourd.r * Math.sin((i / 24) * Math.PI * 2)] as Pt) },
  ];
  return {
    bowlF,
    bands,
    neckSide,
    neckUnder,
    neckInlay,
    diamonds,
    waxF,
    fretTicks,
    stringsF,
    talaF,
    talaPegF,
    mainPegs,
    bridgeF,
    bridgeTopF,
    sideBridgeF,
    gourdC,
    collar,
    yaliF,
    yaliCollar,
    yaliEye,
    yaliBrow,
    yaliMane,
    yaliMouth,
    yaliTongue,
    teeth,
    teethLow,
    yaliScroll,
    yaliNostril,
    bowlT,
    plateT,
    plateInlay,
    plateInlay2,
    neckTop,
    wax,
    fretsT,
    stringsT,
    talaT,
    talaPegT,
    mainPegT,
    bridgeT,
    gourdTc,
    yaliT,
    yaliEyesT,
    rimF: ring(g.plateR + 3, 0, 'side'),
    hitsFront,
    hitsAbove,
  };
}

function paths(sc: LuteScene) {
  let p = cache.get('veena');
  if (!p) {
    p = build(sc);
    cache.set('veena', p);
  }
  return p;
}

function Peg({ base, tip, r }: { base: Pt; tip: Pt; r: number }) {
  return (
    <Group>
      <Line p1={vec(base[0], base[1])} p2={vec(tip[0], tip[1])} color={PAL.jack[3]} strokeWidth={r * 0.7} strokeCap="round" />
      <Circle cx={tip[0]} cy={tip[1]} r={r}>
        <RadialGradient c={vec(tip[0] - r * 0.35, tip[1] - r * 0.4)} r={r * 1.3} colors={A(PAL.gold)} />
      </Circle>
      <Circle cx={tip[0]} cy={tip[1]} r={r * 0.45} color={PAL.red[1]} />
    </Group>
  );
}

export function VeenaFront({ sc, dim = 1 }: { sc: LuteScene; dim?: number }) {
  const g = sc.veena!;
  const B = paths(sc);
  const bb = bounds(B.bowlF);
  const bowl = poly(B.bowlF);
  const rim = poly(B.rimF);
  return (
    <Group opacity={dim}>
      {/* the neck-end gourd (a support) and its collar, behind the neck */}
      <Path path={B.collar}>
        <LinearGradient start={vec(B.gourdC[0] - 26, 0)} end={vec(B.gourdC[0] + 26, 0)} colors={A(PAL.gold)} />
      </Path>
      <Circle cx={B.gourdC[0]} cy={B.gourdC[1]} r={g.gourd.r}>
        <RadialGradient c={vec(B.gourdC[0] - 32, B.gourdC[1] - 36)} r={g.gourd.r * 1.35} colors={A(PAL.jack)} />
      </Circle>
      <Path path={oval(B.gourdC[0], B.gourdC[1] - g.gourd.r * 0.55, g.gourd.r * 0.82, g.gourd.r * 0.18)} style="stroke" strokeWidth={5} color={PAL.gold[2]} opacity={0.85} />
      <Path path={oval(B.gourdC[0], B.gourdC[1] - g.gourd.r * 0.55, g.gourd.r * 0.82, g.gourd.r * 0.18)} style="stroke" strokeWidth={1.4} color={PAL.red[0]} opacity={0.9}>
        <DashPathEffect intervals={[5, 4]} />
      </Path>
      {/* the resonator bowl, carved and turned */}
      <Path path={bowl} color="#000" opacity={0.5} transform={[{ translateX: 12 }, { translateY: 14 }]}>
        <BlurMask blur={18} style="normal" />
      </Path>
      <Path path={bowl}>
        <LinearGradient start={vec(bb.x0, bb.y0)} end={vec(bb.x1, bb.y1)} colors={A(PAL.jack)} />
      </Path>
      <Path path={bowl}>
        <RadialGradient c={vec(bb.x0 + (bb.x1 - bb.x0) * 0.32, bb.y0 + (bb.y1 - bb.y0) * 0.3)} r={(bb.x1 - bb.x0) * 0.6} colors={['rgba(255,214,170,0.32)', 'rgba(255,214,170,0)']} />
      </Path>
      {B.bands.map((p, i) => (
        <Group key={`bd${i}`}>
          <Path path={p} style="stroke" strokeWidth={7} color="#3a1a0a" opacity={0.55} />
          <Path path={p} style="stroke" strokeWidth={1.6} color={PAL.gold[1]} opacity={0.75} transform={[{ translateY: -2.5 }]} />
        </Group>
      ))}
      <Path path={rim} style="stroke" strokeWidth={7} color="#2e1407" />
      <Path path={rim} style="stroke" strokeWidth={2.4} color={PAL.gold[1]} opacity={0.9} />
      {/* the neck: its underside, its decorated side */}
      <Path path={B.neckUnder} color="#24100a" />
      <Path path={B.neckSide}>
        <LinearGradient start={vec(g.neck.x0, -60)} end={vec(g.neck.x0 + 120, 40)} colors={A(PAL.jack)} />
      </Path>
      {B.neckInlay.map((p, i) => (
        <Path key={`ni${i}`} path={p} style="stroke" strokeWidth={2} color={PAL.inlay} opacity={0.85} />
      ))}
      {B.diamonds.map((p, i) => (
        <Group key={`dm${i}`}>
          <Path path={p} color={PAL.gold[2]} opacity={0.85} />
          <Path path={p} style="stroke" strokeWidth={1.2} color={PAL.inlay} opacity={0.8} />
        </Group>
      ))}
      {/* tala pegs and main pegs, out toward the audience */}
      {B.talaPegF.map((q, i) => (
        <Peg key={`tp${i}`} base={q.base} tip={q.tip} r={10} />
      ))}
      {B.mainPegs.map((q, i) => (
        <Peg key={`mp${i}`} base={q.base} tip={q.tip} r={14} />
      ))}
      {/* the black wax ridge and the brass frets standing on it */}
      <Path path={B.waxF} color={PAL.wax[1]} />
      {B.fretTicks.map((p, i) => (
        <Path key={`ft${i}`} path={p} style="stroke" strokeWidth={2.6} color={PAL.brass[1]} />
      ))}
      {/* the bridge, its brass top, the tala side bridge */}
      <Path path={B.bridgeTopF} color={PAL.brass[2]} />
      <Path path={B.bridgeF}>
        <LinearGradient start={vec(-15, -20)} end={vec(15, 10)} colors={A(PAL.jackLight)} />
      </Path>
      <Path path={B.sideBridgeF} style="stroke" strokeWidth={4} color={PAL.brass[1]} />
      {/* strings: four melody strings, three tala strings */}
      {B.stringsF.map((p, i) => (
        <Path key={`sf${i}`} path={p} style="stroke" strokeWidth={i < 2 ? 1.4 : 1.1} color={i < 2 ? PAL.steel : PAL.bronze} />
      ))}
      {B.talaF.map((p, i) => (
        <Path key={`tf${i}`} path={p} style="stroke" strokeWidth={1.1} color={PAL.steel} opacity={0.9} />
      ))}
      {/* the yali, carved and gilded */}
      <Path path={B.yaliF} color="#000" opacity={0.45} transform={[{ translateX: 5 }, { translateY: 8 }]}>
        <BlurMask blur={6} style="normal" />
      </Path>
      <Path path={B.yaliF}>
        <LinearGradient start={vec(B.yaliEye[0] - 70, B.yaliEye[1] - 50)} end={vec(B.yaliEye[0] + 30, B.yaliEye[1] + 150)} colors={GILT} />
      </Path>
      <Path path={B.yaliF}>
        <RadialGradient c={vec(B.yaliEye[0] - 20, B.yaliEye[1] - 10)} r={70} colors={['rgba(255,247,214,0.55)', 'rgba(255,247,214,0)']} />
      </Path>
      {B.yaliMane.map((p, i) => (
        <Group key={`ym${i}`}>
          <Path path={p} style="stroke" strokeWidth={5} strokeCap="round" color="#5e3d0c" opacity={0.55} />
          <Path path={p} style="stroke" strokeWidth={2.4} strokeCap="round" color={YRED} opacity={0.9} />
        </Group>
      ))}
      <Path path={B.yaliScroll} style="stroke" strokeWidth={3} strokeCap="round" color="#5e3d0c" />
      <Path path={B.yaliMouth} color="#5a120a" />
      <Path path={B.yaliTongue} style="stroke" strokeWidth={4.5} strokeCap="round" color={YRED} />
      {[...B.teeth, ...B.teethLow].map((p, i) => (
        <Path key={`yt${i}`} path={p} color="#fbf3dc" />
      ))}
      <Path path={B.yaliF} style="stroke" strokeWidth={2.4} color="#3d2606" />
      <Path path={B.yaliCollar}>
        <LinearGradient start={vec(B.yaliEye[0] - 80, 0)} end={vec(B.yaliEye[0] - 60, 0)} colors={A(PAL.brass)} />
      </Path>
      <Path path={B.yaliBrow} style="stroke" strokeWidth={3.5} strokeCap="round" color="#5e3d0c" />
      <Circle cx={B.yaliEye[0]} cy={B.yaliEye[1]} r={7.5} color="#fbf3dc" />
      <Circle cx={B.yaliEye[0] + 2} cy={B.yaliEye[1]} r={3.8} color={PAL.ink} />
      <Circle cx={B.yaliEye[0]} cy={B.yaliEye[1]} r={9} style="stroke" strokeWidth={1.8} color="#5e3d0c" />
      <Circle cx={B.yaliNostril[0]} cy={B.yaliNostril[1]} r={2.6} color="#3d2606" />
    </Group>
  );
}

export function VeenaAbove({ sc, dim = 1 }: { sc: LuteScene; dim?: number }) {
  const g = sc.veena!;
  const B = paths(sc);
  const bt = bounds(B.bowlT);
  const bowl = poly(B.bowlT);
  return (
    <Group opacity={dim}>
      <Circle cx={B.gourdTc[0]} cy={B.gourdTc[1]} r={g.gourd.r}>
        <RadialGradient c={vec(B.gourdTc[0] - 30, B.gourdTc[1] - 30)} r={g.gourd.r * 1.35} colors={A(PAL.jack)} />
      </Circle>
      <Path path={bowl} color="#000" opacity={0.45} transform={[{ translateX: 10 }, { translateY: 12 }]}>
        <BlurMask blur={16} style="normal" />
      </Path>
      <Path path={bowl}>
        <LinearGradient start={vec(bt.x0, bt.y0)} end={vec(bt.x1, bt.y1)} colors={A(PAL.jack)} />
      </Path>
      {/* the top plate, its inlaid border */}
      <Path path={B.plateT}>
        <LinearGradient start={vec(bt.x0, bt.y0)} end={vec(bt.x1, bt.y1)} colors={A(PAL.jackLight)} />
      </Path>
      <Path path={B.plateT} style="stroke" strokeWidth={4} color="#3a1a0a" />
      <Path path={B.plateInlay} style="stroke" strokeWidth={3} color={PAL.inlay} opacity={0.85}>
        <DashPathEffect intervals={[6, 4]} />
      </Path>
      <Path path={B.plateInlay2} style="stroke" strokeWidth={1.4} color={PAL.gold[2]} opacity={0.8} />
      {/* main pegs both sides, tala pegs on the audience side */}
      {B.mainPegT.map((q, i) => (
        <Peg key={`mp${i}`} base={q.base} tip={q.tip} r={14} />
      ))}
      {B.talaPegT.map((q, i) => (
        <Peg key={`tp${i}`} base={q.base} tip={q.tip} r={10} />
      ))}
      {/* the neck's top: the wax beds, the frets across them */}
      <Path path={B.neckTop}>
        <LinearGradient start={vec(g.neck.x0, -40)} end={vec(g.neck.x0, 40)} colors={A(PAL.jack)} />
      </Path>
      {B.wax.map((p, i) => (
        <Path key={`wx${i}`} path={p}>
          <LinearGradient start={vec(0, -30)} end={vec(0, 30)} colors={A(PAL.wax)} />
        </Path>
      ))}
      {B.fretsT.map((p, i) => (
        <Path key={`fr${i}`} path={p} style="stroke" strokeWidth={3.2} strokeCap="round" color={PAL.brass[1]} />
      ))}
      {/* the bridge */}
      <Path path={B.bridgeT} color="#000" opacity={0.45} transform={[{ translateX: 3 }, { translateY: 4 }]}>
        <BlurMask blur={4} style="normal" />
      </Path>
      <Path path={B.bridgeT}>
        <LinearGradient start={vec(-15, -30)} end={vec(15, 30)} colors={A(PAL.brass)} />
      </Path>
      {/* strings */}
      {B.stringsT.map((p, i) => (
        <Path key={`st${i}`} path={p} style="stroke" strokeWidth={i < 2 ? 1.5 : 1.2} color={i < 2 ? PAL.steel : PAL.bronze} />
      ))}
      {B.talaT.map((p, i) => (
        <Path key={`tt${i}`} path={p} style="stroke" strokeWidth={1.1} color={PAL.steel} opacity={0.9} />
      ))}
      {/* the yali from above */}
      <Path path={B.yaliT}>
        <LinearGradient start={vec(850, -40)} end={vec(970, 40)} colors={GILT} />
      </Path>
      <Path path={B.yaliT} style="stroke" strokeWidth={2} color="#6b4a10" />
      {B.yaliEyesT.map(([x, y], i) => (
        <Group key={`ye${i}`}>
          <Circle cx={x} cy={y} r={6} color={PAL.inlay} />
          <Circle cx={x + 1} cy={y} r={3} color={PAL.ink} />
        </Group>
      ))}
      <Line p1={vec(B.yaliEyesT[0][0] - 50, (B.yaliEyesT[0][1] + B.yaliEyesT[1][1]) / 2)} p2={vec(B.yaliEyesT[0][0] + 45, (B.yaliEyesT[0][1] + B.yaliEyesT[1][1]) / 2)} color={PAL.red[1]} strokeWidth={4} strokeCap="round" />
    </Group>
  );
}

export function veenaHits(sc: LuteScene, view: 'side' | 'top'): HitArea[] {
  const p = paths(sc);
  return view === 'side' ? p.hitsFront : p.hitsAbove;
}

export const VEENA_YALI = YALI;
export const _rr = rr;
