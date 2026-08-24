/**
 * HarmonographMachine — the Harmonograph lab's display: a RIGID-BODY simulation
 * of the three-pendulum rotary machine (Karl Sims build; spec:
 * docs/APE_HARMONOGRAPH_MECHANISM_2026_08_23.md, owner-verified 2026-08-23).
 *
 * The machine, honestly:
 *  - three VERTICAL pendulum shafts rock on knife-edge fulcrums at the table
 *    surface; the shaft TOP levers OPPOSITE the weight below (fixed lengths);
 *  - two fixed-length arms pin to the lateral shaft tops and meet at the pen —
 *    the pen IS the circle–circle junction of those rigid arms, nothing else;
 *  - ROTARY: the laterals run in unison so the pen sweeps a circle/ellipse
 *    while the PAPER platform (on the gimbaled third pendulum) counter-ORBITS
 *    at the ratio'd frequency — the platform translates, it never spins; the
 *    ink is the pen-minus-paper relative path. LATERAL: classic ratio'd
 *    Lissajous through the true linkage (which adds the real machine's warp).
 *
 * Rendering: everything moving is driven by ONE progress SharedValue on the UI
 * thread — machine positions are closed-form worklets (butter-smooth at any
 * speed), and the ink reveals along a precomputed path whose strokeDashoffset
 * follows the ARC LENGTH at the current time, so the ink head stays glued to
 * the pen nib. A wet-ink head (short bright dash window) rides the reveal.
 * Real-time rate: the full trace spans BASE_TURNS turns of the slower arm and
 * `drawMs` maps that to true seconds (owner 2026-08-23 real-time ruling).
 */
import { useEffect, useMemo } from 'react';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Line,
  LinearGradient,
  Path,
  Polygon,
  RadialGradient,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedProps,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { fonts } from '../../theme/tokens';

/** Turns of the slower arm in one full drawing (shared with the screen's
 *  real-time drawMs = BASE_TURNS / slowerHz). */
export const BASE_TURNS = 24;

/* ── the machine, in inches (Sims build, stylized to fit the stage) ───────── */
const T = 36; // 3'×3' table
const HR: readonly [number, number] = [9, 9]; // rotary (paper) corner
const HA: readonly [number, number] = [33, 9]; // lateral A — aims along −x at the pen
const HB: readonly [number, number] = [9, 33]; // lateral B — aims along −y
const TOP = 12,
  WGT = 24,
  BOT = 28,
  LEGZ = 30; // shaft above/weight/below-tip/floor (visual)
const LARM = Math.hypot(HA[0] - HR[0], HA[1] - HR[1]); // fixed 24" arms
const PLATZ = 9.4,
  PLATH = 5.5; // platform height + half-size (11"×11")
const AMP = 0.28 * TOP; // release swing at the shaft top ≈ ±3.4"
const ORB = 1.9; // rotary orbit radius

/* ── axonometric camera (fixed viewBox 0 0 360 240) ───────────────────────── */
const YAW = (33 * Math.PI) / 180,
  PITCH = (24 * Math.PI) / 180;
const CY = Math.cos(YAW),
  SY = Math.sin(YAW),
  SP = Math.sin(PITCH),
  CP = Math.cos(PITCH);
const SC = 4.0,
  MX = 86,
  MY = 133;
const VBW = 360,
  VBH = 240;
function pj(x: number, y: number, z: number): [number, number] {
  'worklet';
  return [MX + (x * CY - y * SY) * SC, MY - (x * SY + y * CY) * SP * SC - z * CP * SC];
}
/** Screen delta for a pure horizontal world offset (linear — used to translate
 *  the orbiting platform group and the pen group). */
function dpj(dx: number, dy: number): [number, number] {
  'worklet';
  return [(dx * CY - dy * SY) * SC, -(dx * SY + dy * CY) * SP * SC];
}

/* ── shared motion math (JS + worklet twins must stay identical) ──────────── */
type Mode = { axr: number; ayr: number; ph: number; k: number; rotary: boolean; det: number };
function motion(phi: number, m: Mode) {
  'worklet';
  const env = Math.exp(-m.k * phi);
  let sA: number, sB: number, ox: number, oy: number;
  if (m.rotary) {
    // pen circle from unison laterals (phase chip shapes it: 90°=circle, 0°=line)
    const u = m.axr * phi;
    sA = AMP * Math.sin(u + Math.PI / 2 - m.ph) * env;
    sB = AMP * Math.sin(u + Math.PI / 2) * env;
    const g = m.ayr * phi * (1 + m.det); // counter-orbiting paper at the ratio
    ox = -ORB * Math.sin(g) * env;
    oy = ORB * Math.cos(g) * env;
  } else {
    sA = AMP * Math.sin(m.axr * phi + Math.PI / 2 - m.ph) * env;
    sB = AMP * Math.sin(m.ayr * phi * (1 + m.det) + Math.PI / 2) * env;
    ox = 0;
    oy = 0;
  }
  // shaft tops (lateral aims: A along −x, B along −y; top moves OPPOSITE the bob)
  const tAx = HA[0] - sA,
    tAy = HA[1];
  const tBx = HB[0],
    tBy = HB[1] - sB;
  // the pen: junction of the two rigid arms (circle–circle, paper-side root)
  const dx = tBx - tAx,
    dy = tBy - tAy;
  const dd = Math.sqrt(dx * dx + dy * dy);
  let px = HR[0],
    py = HR[1];
  if (dd > 1e-6 && dd < 2 * LARM) {
    const a = dd / 2;
    const h = Math.sqrt(Math.max(0, LARM * LARM - a * a));
    const mx = tAx + dx / 2,
      my = tAy + dy / 2;
    const s1x = mx - (dy / dd) * h,
      s1y = my + (dx / dd) * h;
    const s2x = mx + (dy / dd) * h,
      s2y = my - (dx / dd) * h;
    const q1 = (s1x - HR[0]) * (s1x - HR[0]) + (s1y - HR[1]) * (s1y - HR[1]);
    const q2 = (s2x - HR[0]) * (s2x - HR[0]) + (s2y - HR[1]) * (s2y - HR[1]);
    if (q1 < q2) {
      px = s1x;
      py = s1y;
    } else {
      px = s2x;
      py = s2y;
    }
  }
  return { sA, sB, ox, oy, tAx, tAy, tBx, tBy, px, py, env };
}

/* ── static scenery (fixed camera → computed once at module load) ─────────── */
const P2 = (p: [number, number]) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`;
const slabTop = [pj(0, 0, 0), pj(T, 0, 0), pj(T, T, 0), pj(0, T, 0)];
const slabE1 = [pj(0, 0, -0.8), pj(T, 0, -0.8)];
const slabE2 = [pj(T, T, -0.8)];
const LEGS: [number, number][][] = [
  [pj(3, 33, -0.4), pj(0, 36, -LEGZ)],
  [pj(33, 33, -0.4), pj(36, 36, -LEGZ)],
  [pj(3, 3, -0.4), pj(0, 0, -LEGZ)],
  [pj(33, 3, -0.4), pj(36, 0, -LEGZ)],
];
const HOLES = [HR, HA, HB].map((H) => pj(H[0], H[1], 0));
const GRAIN = [1, 2, 3, 4, 5, 6].map((i) => {
  const a = pj(1.5, i * 5, 0),
    b = pj(18, i * 5 - 1, 0),
    c = pj(34.5, i * 5 + 1.2, 0);
  return `M${a[0].toFixed(1)} ${a[1].toFixed(1)} Q ${b[0].toFixed(1)} ${b[1].toFixed(1)} ${c[0].toFixed(1)} ${c[1].toFixed(1)}`;
});
// platform + paper rest corners (inside the animated platform group)
const PLATC = [
  pj(HR[0] - PLATH, HR[1] - PLATH, PLATZ),
  pj(HR[0] + PLATH, HR[1] - PLATH, PLATZ),
  pj(HR[0] + PLATH, HR[1] + PLATH, PLATZ),
  pj(HR[0] - PLATH, HR[1] + PLATH, PLATZ),
];
const PLATE = [pj(HR[0] - PLATH, HR[1] + PLATH, PLATZ - 0.7), pj(HR[0] + PLATH, HR[1] + PLATH, PLATZ - 0.7)];
const PEN_REST = pj(HR[0], HR[1], 0); // pen group's rest anchor (translate origin)
// inset ("the drawing", straight-on)
const IX = 252,
  IY = 26,
  IW = 96,
  IK = 7.8,
  ICX = IX + IW / 2,
  ICY = IY + IW / 2;

const APath = Animated.createAnimatedComponent(Path);
const ALine = Animated.createAnimatedComponent(Line);
const AG = Animated.createAnimatedComponent(G);

/* OSC identity colors — match the lab's bezel/lane tints (ARM_X / ARM_Y). */
const COL_A = '#4fd0e0';
const COL_B = '#b48bff';

export function HarmonographMachine({
  n1,
  n2,
  phaseDeg,
  endAmp,
  rotary,
  detune,
  height,
  drawMs,
}: {
  n1: number;
  n2: number;
  phaseDeg: number;
  endAmp: number;
  rotary: boolean;
  detune: number;
  height: number;
  drawMs: number;
}) {
  const mn = Math.max(1e-9, Math.min(n1, n2));
  const thetaMax = 2 * Math.PI * BASE_TURNS;
  const mode: Mode = useMemo(
    () => ({
      axr: n1 / mn,
      ayr: n2 / mn,
      ph: (phaseDeg * Math.PI) / 180,
      k: -Math.log(endAmp) / thetaMax,
      rotary,
      det: detune,
    }),
    [n1, n2, mn, phaseDeg, endAmp, rotary, detune, thetaMax],
  );

  /* ink: precomputed relative path (pen − platform, in inches), projected once
     at the REST platform position; the platform group translates it live.
     Cumulative arc lengths let the reveal follow TIME, not path-fraction, so
     the ink head stays under the nib. */
  const ink = useMemo(() => {
    const N = 2200;
    let dP = '',
      dI = '';
    const sP = new Array<number>(N + 1);
    const sI = new Array<number>(N + 1);
    let accP = 0,
      accI = 0,
      lx = 0,
      ly = 0,
      lix = 0,
      liy = 0;
    for (let i = 0; i <= N; i++) {
      const m = motion((i / N) * thetaMax, mode);
      const rx = m.px - (HR[0] + m.ox),
        ry = m.py - (HR[1] + m.oy);
      const p = pj(HR[0] + rx, HR[1] + ry, PLATZ + 0.05);
      const q: [number, number] = [ICX + rx * IK, ICY + ry * IK];
      if (i === 0) {
        dP = `M${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
        dI = `M${q[0].toFixed(1)} ${q[1].toFixed(1)}`;
      } else {
        dP += `L${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
        dI += `L${q[0].toFixed(1)} ${q[1].toFixed(1)}`;
        accP += Math.hypot(p[0] - lx, p[1] - ly);
        accI += Math.hypot(q[0] - lix, q[1] - liy);
      }
      sP[i] = accP;
      sI[i] = accI;
      lx = p[0];
      ly = p[1];
      lix = q[0];
      liy = q[1];
    }
    return { dP, dI, sP, sI, totP: Math.max(1, accP), totI: Math.max(1, accI), N };
  }, [mode, thetaMax]);

  /* one clock: 0 → 1 over drawMs (real time), restart on any change */
  const progress = useSharedValue(0);
  useEffect(() => {
    cancelAnimation(progress);
    progress.value = 0;
    progress.value = withTiming(1, { duration: drawMs, easing: Easing.linear });
    return () => cancelAnimation(progress);
  }, [ink, drawMs, progress]);

  /* machine state, computed ONCE per frame on the UI thread */
  const M = useDerivedValue(() => motion(progress.value * thetaMax, mode));

  /* ── animated props ──────────────────────────────────────────────────── */
  const arcW = (s: number) => {
    'worklet';
    return Math.sqrt(Math.max(0, WGT * WGT - s * s));
  };
  const shaftABelow = useAnimatedProps(() => {
    const m = M.value;
    const a = pj(HA[0] + (m.sA * BOT) / TOP, HA[1], -arcW((m.sA * BOT) / TOP) * (BOT / WGT));
    const b = pj(HA[0], HA[1], 0);
    return { x1: a[0], y1: a[1], x2: b[0], y2: b[1] };
  });
  const shaftAAbove = useAnimatedProps(() => {
    const m = M.value;
    const a = pj(HA[0], HA[1], 0);
    const b = pj(m.tAx, m.tAy, Math.sqrt(Math.max(0, TOP * TOP - m.sA * m.sA)));
    return { x1: a[0], y1: a[1], x2: b[0], y2: b[1] };
  });
  const wgtA = useAnimatedProps(() => {
    const m = M.value;
    const d = dpj((m.sA * WGT) / TOP, 0);
    return { x: d[0], y: d[1] };
  });
  const shaftBBelow = useAnimatedProps(() => {
    const m = M.value;
    const a = pj(HB[0], HB[1] + (m.sB * BOT) / TOP, -arcW((m.sB * BOT) / TOP) * (BOT / WGT));
    const b = pj(HB[0], HB[1], 0);
    return { x1: a[0], y1: a[1], x2: b[0], y2: b[1] };
  });
  const shaftBAbove = useAnimatedProps(() => {
    const m = M.value;
    const a = pj(HB[0], HB[1], 0);
    const b = pj(m.tBx, m.tBy, Math.sqrt(Math.max(0, TOP * TOP - m.sB * m.sB)));
    return { x1: a[0], y1: a[1], x2: b[0], y2: b[1] };
  });
  const wgtB = useAnimatedProps(() => {
    const m = M.value;
    const d = dpj(0, (m.sB * WGT) / TOP);
    return { x: d[0], y: d[1] };
  });
  // rotary pendulum: platform rides the top; weight levers opposite
  const shaftR = useAnimatedProps(() => {
    const m = M.value;
    const a = pj(HR[0] - (m.ox * WGT) / TOP, HR[1] - (m.oy * WGT) / TOP, -WGT + 3);
    const b = pj(HR[0] + m.ox, HR[1] + m.oy, PLATZ - 0.8);
    return { x1: a[0], y1: a[1], x2: b[0], y2: b[1] };
  });
  const wgtR = useAnimatedProps(() => {
    const m = M.value;
    const d = dpj((-m.ox * WGT) / TOP, (-m.oy * WGT) / TOP);
    return { x: d[0], y: d[1] };
  });
  const platG = useAnimatedProps(() => {
    const m = M.value;
    const d = dpj(m.ox, m.oy);
    return { x: d[0], y: d[1] };
  });
  const armA = useAnimatedProps(() => {
    const m = M.value;
    const a = pj(m.tAx, m.tAy, Math.sqrt(Math.max(0, TOP * TOP - m.sA * m.sA)));
    const b = pj(m.px, m.py, PLATZ + 0.9);
    return { x1: a[0], y1: a[1], x2: b[0], y2: b[1] };
  });
  const armB = useAnimatedProps(() => {
    const m = M.value;
    const a = pj(m.tBx, m.tBy, Math.sqrt(Math.max(0, TOP * TOP - m.sB * m.sB)));
    const b = pj(m.px, m.py, PLATZ + 0.9);
    return { x1: a[0], y1: a[1], x2: b[0], y2: b[1] };
  });
  const penG = useAnimatedProps(() => {
    const m = M.value;
    const p = pj(m.px, m.py, 0);
    return { x: p[0] - PEN_REST[0], y: p[1] - PEN_REST[1] };
  });
  // ink reveal — dashoffset follows the ARC LENGTH at the current time
  const HEAD = 26;
  const inkP = useAnimatedProps(() => {
    const f = Math.min(ink.N - 0.001, Math.max(0, progress.value * ink.N));
    const i = Math.floor(f);
    const s = ink.sP[i] + (ink.sP[i + 1] - ink.sP[i]) * (f - i);
    return { strokeDashoffset: ink.totP - s };
  });
  const headP = useAnimatedProps(() => {
    const f = Math.min(ink.N - 0.001, Math.max(0, progress.value * ink.N));
    const i = Math.floor(f);
    const s = ink.sP[i] + (ink.sP[i + 1] - ink.sP[i]) * (f - i);
    return { strokeDashoffset: HEAD - s };
  });
  const inkI = useAnimatedProps(() => {
    const f = Math.min(ink.N - 0.001, Math.max(0, progress.value * ink.N));
    const i = Math.floor(f);
    const s = ink.sI[i] + (ink.sI[i + 1] - ink.sI[i]) * (f - i);
    return { strokeDashoffset: ink.totI - s };
  });
  const headI = useAnimatedProps(() => {
    const f = Math.min(ink.N - 0.001, Math.max(0, progress.value * ink.N));
    const i = Math.floor(f);
    const s = ink.sI[i] + (ink.sI[i + 1] - ink.sI[i]) * (f - i);
    return { strokeDashoffset: HEAD - s };
  });

  const discRy = 2.5 * SC * 0.3,
    discRx = 2.5 * SC * 0.62;
  const weightDiscs = (H: readonly [number, number], z: number) =>
    [-1, 0, 1].map((i) => {
      const c = pj(H[0], H[1], z + i * 1.15);
      return (
        <Ellipse key={i} cx={c[0]} cy={c[1]} rx={discRx} ry={discRy} fill="url(#hmSteel)" stroke="#0e0f12" strokeWidth={0.8} />
      );
    });

  return (
    <Svg width="100%" height={height} viewBox={`0 0 ${VBW} ${VBH}`}>
      <Defs>
        <LinearGradient id="hmWood" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#8a6a3e" />
          <Stop offset="0.5" stopColor="#6e5230" />
          <Stop offset="1" stopColor="#4c3820" />
        </LinearGradient>
        <LinearGradient id="hmWoodE" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#3c2c17" />
          <Stop offset="1" stopColor="#241a0d" />
        </LinearGradient>
        <LinearGradient id="hmPaper" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#efe9d6" />
          <Stop offset="1" stopColor="#d9d2bc" />
        </LinearGradient>
        <LinearGradient id="hmSteel" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#63666e" />
          <Stop offset="0.45" stopColor="#2e3036" />
          <Stop offset="1" stopColor="#1c1d21" />
        </LinearGradient>
        <RadialGradient id="hmFloor" cx="0.5" cy="0.5" r="0.5">
          <Stop offset="0" stopColor="#141419" />
          <Stop offset="1" stopColor="#0a0a0d" stopOpacity={0} />
        </RadialGradient>
      </Defs>

      <Rect x={0} y={0} width={VBW} height={VBH} fill="#0b0b0e" />
      <Ellipse cx={MX + 20} cy={MY + LEGZ * CP * SC - 14} rx={150} ry={36} fill="url(#hmFloor)" />

      {/* legs */}
      {LEGS.map((L, i) => (
        <G key={i}>
          <Line x1={L[0][0]} y1={L[0][1]} x2={L[1][0]} y2={L[1][1]} stroke="#3a2c18" strokeWidth={4.2} strokeLinecap="round" />
          <Line x1={L[0][0]} y1={L[0][1]} x2={L[1][0]} y2={L[1][1]} stroke="#59452a" strokeWidth={1.8} strokeLinecap="round" />
        </G>
      ))}

      {/* below-table pendulums (far → near) with weights + moving floor shadows */}
      <ALine animatedProps={shaftR} stroke="#5d4527" strokeWidth={3.2} strokeLinecap="round" />
      <AG animatedProps={wgtR}>
        <Ellipse cx={pj(HR[0], HR[1], -LEGZ + 0.5)[0]} cy={pj(HR[0], HR[1], -LEGZ + 0.5)[1]} rx={13} ry={4} fill="#000" opacity={0.32} />
        {weightDiscs(HR, -WGT + 3)}
      </AG>
      <ALine animatedProps={shaftABelow} stroke="#5d4527" strokeWidth={3.2} strokeLinecap="round" />
      <AG animatedProps={wgtA}>
        <Ellipse cx={pj(HA[0], HA[1], -LEGZ + 0.5)[0]} cy={pj(HA[0], HA[1], -LEGZ + 0.5)[1]} rx={13} ry={4} fill="#000" opacity={0.32} />
        {weightDiscs(HA, -WGT)}
      </AG>
      <ALine animatedProps={shaftBBelow} stroke="#5d4527" strokeWidth={3.2} strokeLinecap="round" />
      <AG animatedProps={wgtB}>
        <Ellipse cx={pj(HB[0], HB[1], -LEGZ + 0.5)[0]} cy={pj(HB[0], HB[1], -LEGZ + 0.5)[1]} rx={13} ry={4} fill="#000" opacity={0.32} />
        {weightDiscs(HB, -WGT)}
      </AG>

      {/* table slab */}
      <Polygon points={`${P2(slabTop[0])} ${P2(slabTop[1])} ${P2(slabE1[1])} ${P2(slabE1[0])}`} fill="url(#hmWoodE)" />
      <Polygon points={`${P2(slabTop[1])} ${P2(slabTop[2])} ${P2(slabE2[0])} ${P2(slabE1[1])}`} fill="#1c130a" />
      <Polygon points={slabTop.map(P2).join(' ')} fill="url(#hmWood)" stroke="#2a1f10" strokeWidth={1} />
      {GRAIN.map((d, i) => (
        <Path key={i} d={d} stroke="#00000022" strokeWidth={0.8} fill="none" />
      ))}
      {HOLES.map((h, i) => (
        <G key={i}>
          <Ellipse cx={h[0]} cy={h[1]} rx={1.6 * SC} ry={1.6 * SC * SP} fill="#0c0906" />
          <Ellipse cx={h[0]} cy={h[1]} rx={2.4 * SC} ry={2.4 * SC * SP} fill="none" stroke="#a89468" strokeWidth={1} strokeOpacity={0.5} />
        </G>
      ))}

      {/* platform + paper + INK — one group that ORBITS (translates, no spin) */}
      <AG animatedProps={platG}>
        <Polygon points={`${P2(PLATC[3])} ${P2(PLATC[2])} ${P2(PLATE[1])} ${P2(PLATE[0])}`} fill="#241a0d" />
        <Polygon points={PLATC.map(P2).join(' ')} fill="url(#hmPaper)" stroke="#b8ad8d" strokeWidth={0.8} />
        <APath
          d={ink.dP}
          animatedProps={inkP}
          stroke="#8e1f32"
          strokeWidth={1.05}
          strokeOpacity={0.62}
          fill="none"
          strokeLinejoin="round"
          strokeDasharray={`${ink.totP.toFixed(1)} ${ink.totP.toFixed(1)}`}
        />
        <APath
          d={ink.dP}
          animatedProps={headP}
          stroke="#e0435a"
          strokeWidth={1.5}
          strokeOpacity={0.95}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${HEAD} ${ink.totP.toFixed(1)}`}
        />
      </AG>

      {/* above-table shafts (OSC identity colors), arms, pen */}
      <ALine animatedProps={shaftAAbove} stroke={COL_A} strokeWidth={3} strokeLinecap="round" />
      <ALine animatedProps={shaftBAbove} stroke={COL_B} strokeWidth={3} strokeLinecap="round" />
      <ALine animatedProps={armA} stroke="#b9a276" strokeWidth={2.4} strokeLinecap="round" />
      <ALine animatedProps={armB} stroke="#b9a276" strokeWidth={2.4} strokeLinecap="round" />
      <AG animatedProps={penG}>
        {/* pen at the junction: shadow, band wrap, body, nib */}
        <Ellipse cx={PEN_REST[0] + 2 - (PLATZ + 0.9) * 0} cy={pj(HR[0], HR[1], PLATZ + 0.9)[1] + 3} rx={4.4} ry={1.8} fill="#000" opacity={0.2} />
        <Circle cx={PEN_REST[0]} cy={pj(HR[0], HR[1], PLATZ + 0.9)[1]} r={2.4} fill="none" stroke="#7d2a35" strokeWidth={1} />
        <Line
          x1={PEN_REST[0]}
          y1={pj(HR[0], HR[1], PLATZ + 0.9)[1]}
          x2={PEN_REST[0]}
          y2={pj(HR[0], HR[1], PLATZ + 3.4)[1]}
          stroke="#20242c"
          strokeWidth={2.8}
          strokeLinecap="round"
        />
        <Circle cx={PEN_REST[0]} cy={pj(HR[0], HR[1], PLATZ + 3.4)[1]} r={1.7} fill="#e0435a" />
        <Circle cx={PEN_REST[0]} cy={pj(HR[0], HR[1], PLATZ + 0.9)[1]} r={1.2} fill="#c9a25e" />
      </AG>

      {/* ── inset: THE DRAWING, straight-on ─────────────────────────────── */}
      <Rect x={IX} y={IY} width={IW} height={IW} rx={8} fill="url(#hmPaper)" stroke="#26262c" strokeWidth={1.3} />
      <Rect x={IX + 2} y={IY + 2} width={IW - 4} height={IW - 4} rx={6} fill="none" stroke="#b8ad8d" strokeWidth={0.6} strokeOpacity={0.6} />
      <APath
        d={ink.dI}
        animatedProps={inkI}
        stroke="#8e1f32"
        strokeWidth={0.95}
        strokeOpacity={0.6}
        fill="none"
        strokeLinejoin="round"
        strokeDasharray={`${ink.totI.toFixed(1)} ${ink.totI.toFixed(1)}`}
      />
      <APath
        d={ink.dI}
        animatedProps={headI}
        stroke="#e0435a"
        strokeWidth={1.3}
        strokeOpacity={0.95}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${HEAD} ${ink.totI.toFixed(1)}`}
      />
      <SvgText
        x={IX + IW / 2}
        y={IY + IW + 14}
        textAnchor="middle"
        fontFamily={fonts.oswaldSemiBold}
        fontSize={12}
        letterSpacing={1.6}
        fill="#6d6f75"
      >
        THE DRAWING
      </SvgText>
    </Svg>
  );
}
