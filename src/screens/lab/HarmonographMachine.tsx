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
 * The drawing runs until the pen SETTLES (swing ≤ ~4%), so the trace length
 * derives from the damping chip — nothing is cut off mid-swing — then holds.
 *
 * ANIMATION ARCHITECTURE (hard-won, 2026-08-23):
 *  - react-native-svg TRANSFORM props (x/y, translateX/translateY, rotation on
 *    G) are extracted at JS render time and DO NOT apply through Reanimated's
 *    native prop path — groups silently stay put. Every moving part animates
 *    PRIMITIVE props only (cx/cy, x1..y2, strokeDashoffset), each element also
 *    carrying its REST-POSE as static initial props so the first paint is a
 *    complete machine even before the UI-thread mapper runs.
 *  - The one thing that must translate as a unit — the orbiting platform with
 *    its paper and ink — is a plain RN Animated.View (useAnimatedStyle
 *    transform: bulletproof) holding its own small Svg.
 *  - GRADIENT IDS ARE UNIQUE PER SVG ROOT (…B/…P/…T): duplicate ids across
 *    roots break fills in react-native-svg (the documented ToolsHub tile-06
 *    failure) — that's what vanished the platform in the previous build.
 *  - Ink reveals along a precomputed path whose strokeDashoffset follows the
 *    ARC LENGTH at the current time (head glued to the nib); a wet-ink head
 *    rides the reveal as a short bright dash window.
 */
import { memo, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
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
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { fonts } from '../../theme/tokens';

/** Damping reference: the chips mean "amplitude left after TURNS_REF turns";
 *  the drawing then CONTINUES until the pen settles. */
export const TURNS_REF = 24;
const STOP_ENV = 0.04;
/** Total slower-arm turns for a full drawing at this damping (screen uses it
 *  for the real-time drawMs = turns / slowerHz). */
export function drawTurns(endAmp: number): number {
  return (TURNS_REF * Math.log(STOP_ENV)) / Math.log(Math.min(0.9, Math.max(0.01, endAmp)));
}

/* ── the machine, in inches ───────────────────────────────────────────────── */
const T = 36;
const HR: readonly [number, number] = [9, 9];
const HA: readonly [number, number] = [33, 9];
const HB: readonly [number, number] = [9, 33];
const TOP = 12,
  WGT = 24,
  BOT = 28,
  LEGZ = 30;
const LARM = Math.hypot(HA[0] - HR[0], HA[1] - HR[1]);
const PLATZ = 9.4,
  PLATH = 5.5;
const AMP = 0.28 * TOP;
const ORB = 1.9;

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
function dpj(dx: number, dy: number): [number, number] {
  'worklet';
  return [(dx * CY - dy * SY) * SC, -(dx * SY + dy * CY) * SP * SC];
}

/* ── motion (single source of truth: JS for the ink precompute, worklet for
      the live machine) ──────────────────────────────────────────────────── */
type Mode = { axr: number; ayr: number; ph: number; k: number; rotary: boolean; det: number };
function motion(phi: number, m: Mode) {
  'worklet';
  const env = Math.exp(-m.k * phi);
  let sA: number, sB: number, ox: number, oy: number;
  if (m.rotary) {
    const u = m.axr * phi;
    sA = AMP * Math.sin(u + Math.PI / 2 - m.ph) * env;
    sB = AMP * Math.sin(u + Math.PI / 2) * env;
    const g = m.ayr * phi * (1 + m.det);
    ox = -ORB * Math.sin(g) * env;
    oy = ORB * Math.cos(g) * env;
  } else {
    sA = AMP * Math.sin(m.axr * phi + Math.PI / 2 - m.ph) * env;
    sB = AMP * Math.sin(m.ayr * phi * (1 + m.det) + Math.PI / 2) * env;
    ox = 0;
    oy = 0;
  }
  const tAx = HA[0] - sA,
    tAy = HA[1];
  const tBx = HB[0],
    tBy = HB[1] - sB;
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

/* ── static scenery + REST POSE (module-load constants) ───────────────────── */
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
const PLATC = [
  pj(HR[0] - PLATH, HR[1] - PLATH, PLATZ),
  pj(HR[0] + PLATH, HR[1] - PLATH, PLATZ),
  pj(HR[0] + PLATH, HR[1] + PLATH, PLATZ),
  pj(HR[0] - PLATH, HR[1] + PLATH, PLATZ),
];
const PLATE = [pj(HR[0] - PLATH, HR[1] + PLATH, PLATZ - 0.7), pj(HR[0] + PLATH, HR[1] + PLATH, PLATZ - 0.7)];
const PB = (() => {
  const xs = [...PLATC, ...PLATE].map((p) => p[0]);
  const ys = [...PLATC, ...PLATE].map((p) => p[1]);
  const mArg = Math.abs(ORB * SC * (CY + SY)) + 6;
  return {
    x: Math.min(...xs) - mArg,
    y: Math.min(...ys) - mArg,
    w: Math.max(...xs) - Math.min(...xs) + 2 * mArg,
    h: Math.max(...ys) - Math.min(...ys) + 2 * mArg,
  };
})();
const PEN_Z = PLATZ + 0.9;
// rest pose (s = 0, no orbit): every animated element's initial static props
const R_shaftA_below = [pj(HA[0], HA[1], -BOT), pj(HA[0], HA[1], 0)];
const R_shaftB_below = [pj(HB[0], HB[1], -BOT), pj(HB[0], HB[1], 0)];
const R_shaftA_above = [pj(HA[0], HA[1], 0), pj(HA[0], HA[1], TOP)];
const R_shaftB_above = [pj(HB[0], HB[1], 0), pj(HB[0], HB[1], TOP)];
const R_shaftR = [pj(HR[0], HR[1], -WGT + 3), pj(HR[0], HR[1], PLATZ - 0.8)];
const R_discA = [-1, 0, 1].map((i) => pj(HA[0], HA[1], -WGT + i * 1.15));
const R_discB = [-1, 0, 1].map((i) => pj(HB[0], HB[1], -WGT + i * 1.15));
const R_discR = [-1, 0, 1].map((i) => pj(HR[0], HR[1], -WGT + 3 + i * 1.15));
const R_shadA = pj(HA[0], HA[1], -LEGZ + 0.5);
const R_shadB = pj(HB[0], HB[1], -LEGZ + 0.5);
const R_shadR = pj(HR[0], HR[1], -LEGZ + 0.5);
const R_armA = [pj(HA[0], HA[1], TOP), pj(HR[0], HR[1], PEN_Z)];
const R_armB = [pj(HB[0], HB[1], TOP), pj(HR[0], HR[1], PEN_Z)];
const R_pen = pj(HR[0], HR[1], PEN_Z);
const R_penTop = pj(HR[0], HR[1], PLATZ + 3.4);
// inset
const IX = 252,
  IY = 26,
  IW = 96,
  IK = 7.8,
  ICX = IX + IW / 2,
  ICY = IY + IW / 2;

const APath = Animated.createAnimatedComponent(Path);
const ALine = Animated.createAnimatedComponent(Line);
const AEllipse = Animated.createAnimatedComponent(Ellipse);
const ACircle = Animated.createAnimatedComponent(Circle);

const COL_A = '#4fd0e0';
const COL_B = '#b48bff';
const DISC_RX = 2.5 * SC * 0.62,
  DISC_RY = 2.5 * SC * 0.3;

export const HarmonographMachine = memo(function HarmonographMachine({
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
  const turns = drawTurns(endAmp);
  const thetaMax = 2 * Math.PI * turns;
  const mode: Mode = useMemo(
    () => ({
      axr: n1 / mn,
      ayr: n2 / mn,
      ph: (phaseDeg * Math.PI) / 180,
      k: -Math.log(endAmp) / (2 * Math.PI * TURNS_REF),
      rotary,
      det: detune,
    }),
    [n1, n2, mn, phaseDeg, endAmp, rotary, detune],
  );

  /* ink precompute — DEFERRED so lane drags stay responsive */
  const dMode = useDeferredValue(mode);
  const dThetaMax = useDeferredValue(thetaMax);
  const dDrawMs = useDeferredValue(drawMs);
  const ink = useMemo(() => {
    const N = Math.min(3200, Math.max(1200, Math.round((dThetaMax / (2 * Math.PI)) * 40)));
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
      const m = motion((i / N) * dThetaMax, dMode);
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
  }, [dMode, dThetaMax]);

  /* the one clock */
  const progress = useSharedValue(0);
  useEffect(() => {
    cancelAnimation(progress);
    progress.value = 0;
    progress.value = withTiming(1, { duration: dDrawMs, easing: Easing.linear });
    return () => cancelAnimation(progress);
  }, [ink, dDrawMs, progress]);

  const M = useDerivedValue(() => motion(progress.value * thetaMax, mode));

  /* layout scale (viewBox units → px) for the platform layer */
  const [box, setBox] = useState({ w: 0, h: 0 });
  const sc = box.w > 0 ? Math.min(box.w / VBW, box.h / VBH) : 0;
  const offX = (box.w - VBW * sc) / 2,
    offY = (box.h - VBH * sc) / 2;

  /* ── animated props — primitives only, explicit and unrolled ─────────── */
  const shaftABelow = useAnimatedProps(() => {
    const s = M.value.sA;
    const off = (s * BOT) / TOP;
    const wu = (s * WGT) / TOP;
    const zz = -Math.sqrt(Math.max(0, WGT * WGT - wu * wu)) * (BOT / WGT);
    const a = pj(HA[0] + off, HA[1], zz);
    return { x1: a[0], y1: a[1] };
  });
  const shaftBBelow = useAnimatedProps(() => {
    const s = M.value.sB;
    const off = (s * BOT) / TOP;
    const wu = (s * WGT) / TOP;
    const zz = -Math.sqrt(Math.max(0, WGT * WGT - wu * wu)) * (BOT / WGT);
    const a = pj(HB[0], HB[1] + off, zz);
    return { x1: a[0], y1: a[1] };
  });
  const shaftAAbove = useAnimatedProps(() => {
    const m = M.value;
    const b = pj(m.tAx, m.tAy, Math.sqrt(Math.max(0, TOP * TOP - m.sA * m.sA)));
    return { x2: b[0], y2: b[1] };
  });
  const shaftBAbove = useAnimatedProps(() => {
    const m = M.value;
    const b = pj(m.tBx, m.tBy, Math.sqrt(Math.max(0, TOP * TOP - m.sB * m.sB)));
    return { x2: b[0], y2: b[1] };
  });
  const shaftR = useAnimatedProps(() => {
    const m = M.value;
    const a = pj(HR[0] - (m.ox * WGT) / TOP, HR[1] - (m.oy * WGT) / TOP, -WGT + 3);
    const b = pj(HR[0] + m.ox, HR[1] + m.oy, PLATZ - 0.8);
    return { x1: a[0], y1: a[1], x2: b[0], y2: b[1] };
  });
  // weights: one hook per disc/shadow (cx/cy) — no group transforms, ever
  const discA0 = useAnimatedProps(() => {
    const d = dpj((M.value.sA * WGT) / TOP, 0);
    return { cx: R_discA[0][0] + d[0], cy: R_discA[0][1] + d[1] };
  });
  const discA1 = useAnimatedProps(() => {
    const d = dpj((M.value.sA * WGT) / TOP, 0);
    return { cx: R_discA[1][0] + d[0], cy: R_discA[1][1] + d[1] };
  });
  const discA2 = useAnimatedProps(() => {
    const d = dpj((M.value.sA * WGT) / TOP, 0);
    return { cx: R_discA[2][0] + d[0], cy: R_discA[2][1] + d[1] };
  });
  const shadA = useAnimatedProps(() => {
    const d = dpj((M.value.sA * WGT) / TOP, 0);
    return { cx: R_shadA[0] + d[0], cy: R_shadA[1] + d[1] };
  });
  const discB0 = useAnimatedProps(() => {
    const d = dpj(0, (M.value.sB * WGT) / TOP);
    return { cx: R_discB[0][0] + d[0], cy: R_discB[0][1] + d[1] };
  });
  const discB1 = useAnimatedProps(() => {
    const d = dpj(0, (M.value.sB * WGT) / TOP);
    return { cx: R_discB[1][0] + d[0], cy: R_discB[1][1] + d[1] };
  });
  const discB2 = useAnimatedProps(() => {
    const d = dpj(0, (M.value.sB * WGT) / TOP);
    return { cx: R_discB[2][0] + d[0], cy: R_discB[2][1] + d[1] };
  });
  const shadB = useAnimatedProps(() => {
    const d = dpj(0, (M.value.sB * WGT) / TOP);
    return { cx: R_shadB[0] + d[0], cy: R_shadB[1] + d[1] };
  });
  const discR0 = useAnimatedProps(() => {
    const d = dpj((-M.value.ox * WGT) / TOP, (-M.value.oy * WGT) / TOP);
    return { cx: R_discR[0][0] + d[0], cy: R_discR[0][1] + d[1] };
  });
  const discR1 = useAnimatedProps(() => {
    const d = dpj((-M.value.ox * WGT) / TOP, (-M.value.oy * WGT) / TOP);
    return { cx: R_discR[1][0] + d[0], cy: R_discR[1][1] + d[1] };
  });
  const discR2 = useAnimatedProps(() => {
    const d = dpj((-M.value.ox * WGT) / TOP, (-M.value.oy * WGT) / TOP);
    return { cx: R_discR[2][0] + d[0], cy: R_discR[2][1] + d[1] };
  });
  const shadR = useAnimatedProps(() => {
    const d = dpj((-M.value.ox * WGT) / TOP, (-M.value.oy * WGT) / TOP);
    return { cx: R_shadR[0] + d[0], cy: R_shadR[1] + d[1] };
  });
  /* platform layer translation (RN view transform) */
  const platStyle = useAnimatedStyle(() => {
    const d = dpj(M.value.ox, M.value.oy);
    return { transform: [{ translateX: d[0] * sc }, { translateY: d[1] * sc }] };
  }, [sc]);
  /* arms + pen */
  const armA = useAnimatedProps(() => {
    const m = M.value;
    const a = pj(m.tAx, m.tAy, Math.sqrt(Math.max(0, TOP * TOP - m.sA * m.sA)));
    const b = pj(m.px, m.py, PEN_Z);
    return { x1: a[0], y1: a[1], x2: b[0], y2: b[1] };
  });
  const armB = useAnimatedProps(() => {
    const m = M.value;
    const a = pj(m.tBx, m.tBy, Math.sqrt(Math.max(0, TOP * TOP - m.sB * m.sB)));
    const b = pj(m.px, m.py, PEN_Z);
    return { x1: a[0], y1: a[1], x2: b[0], y2: b[1] };
  });
  const penShadow = useAnimatedProps(() => {
    const p = pj(M.value.px, M.value.py, PEN_Z);
    return { cx: p[0] + 2, cy: p[1] + 3 };
  });
  const penBand = useAnimatedProps(() => {
    const p = pj(M.value.px, M.value.py, PEN_Z);
    return { cx: p[0], cy: p[1] - 1 };
  });
  const penBody = useAnimatedProps(() => {
    const m = M.value;
    const a = pj(m.px, m.py, PEN_Z);
    const b = pj(m.px, m.py, PLATZ + 3.4);
    return { x1: a[0], y1: a[1], x2: b[0], y2: b[1] };
  });
  const penNib = useAnimatedProps(() => {
    const p = pj(M.value.px, M.value.py, PLATZ + 3.4);
    return { cx: p[0], cy: p[1] };
  });
  const penCollar = useAnimatedProps(() => {
    const p = pj(M.value.px, M.value.py, PEN_Z);
    return { cx: p[0], cy: p[1] - 1 };
  });
  /* ink reveal */
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

  return (
    <View
      style={{ width: '100%', height }}
      onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
    >
      {/* ── layer 1: base machine (gradient ids suffixed B) ──────────────── */}
      <Svg width="100%" height={height} viewBox={`0 0 ${VBW} ${VBH}`} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="hmWoodB" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#8a6a3e" />
            <Stop offset="0.5" stopColor="#6e5230" />
            <Stop offset="1" stopColor="#4c3820" />
          </LinearGradient>
          <LinearGradient id="hmWoodEB" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#3c2c17" />
            <Stop offset="1" stopColor="#241a0d" />
          </LinearGradient>
          <LinearGradient id="hmSteelB" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#63666e" />
            <Stop offset="0.45" stopColor="#2e3036" />
            <Stop offset="1" stopColor="#1c1d21" />
          </LinearGradient>
          <RadialGradient id="hmFloorB" cx="0.5" cy="0.5" r="0.5">
            <Stop offset="0" stopColor="#141419" />
            <Stop offset="1" stopColor="#0a0a0d" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width={VBW} height={VBH} fill="#0b0b0e" />
        <Ellipse cx={MX + 20} cy={MY + LEGZ * CP * SC - 14} rx={150} ry={36} fill="url(#hmFloorB)" />
        {LEGS.map((L, i) => (
          <G key={i}>
            <Line x1={L[0][0]} y1={L[0][1]} x2={L[1][0]} y2={L[1][1]} stroke="#3a2c18" strokeWidth={4.2} strokeLinecap="round" />
            <Line x1={L[0][0]} y1={L[0][1]} x2={L[1][0]} y2={L[1][1]} stroke="#59452a" strokeWidth={1.8} strokeLinecap="round" />
          </G>
        ))}
        <AEllipse animatedProps={shadR} cx={R_shadR[0]} cy={R_shadR[1]} rx={13} ry={4} fill="#000" opacity={0.32} />
        <AEllipse animatedProps={shadA} cx={R_shadA[0]} cy={R_shadA[1]} rx={13} ry={4} fill="#000" opacity={0.32} />
        <AEllipse animatedProps={shadB} cx={R_shadB[0]} cy={R_shadB[1]} rx={13} ry={4} fill="#000" opacity={0.32} />
        <ALine
          animatedProps={shaftR}
          x1={R_shaftR[0][0]}
          y1={R_shaftR[0][1]}
          x2={R_shaftR[1][0]}
          y2={R_shaftR[1][1]}
          stroke="#5d4527"
          strokeWidth={3.2}
          strokeLinecap="round"
        />
        <AEllipse animatedProps={discR0} cx={R_discR[0][0]} cy={R_discR[0][1]} rx={DISC_RX} ry={DISC_RY} fill="url(#hmSteelB)" stroke="#0e0f12" strokeWidth={0.8} />
        <AEllipse animatedProps={discR1} cx={R_discR[1][0]} cy={R_discR[1][1]} rx={DISC_RX} ry={DISC_RY} fill="url(#hmSteelB)" stroke="#0e0f12" strokeWidth={0.8} />
        <AEllipse animatedProps={discR2} cx={R_discR[2][0]} cy={R_discR[2][1]} rx={DISC_RX} ry={DISC_RY} fill="url(#hmSteelB)" stroke="#0e0f12" strokeWidth={0.8} />
        <ALine
          animatedProps={shaftABelow}
          x1={R_shaftA_below[0][0]}
          y1={R_shaftA_below[0][1]}
          x2={R_shaftA_below[1][0]}
          y2={R_shaftA_below[1][1]}
          stroke="#5d4527"
          strokeWidth={3.2}
          strokeLinecap="round"
        />
        <AEllipse animatedProps={discA0} cx={R_discA[0][0]} cy={R_discA[0][1]} rx={DISC_RX} ry={DISC_RY} fill="url(#hmSteelB)" stroke="#0e0f12" strokeWidth={0.8} />
        <AEllipse animatedProps={discA1} cx={R_discA[1][0]} cy={R_discA[1][1]} rx={DISC_RX} ry={DISC_RY} fill="url(#hmSteelB)" stroke="#0e0f12" strokeWidth={0.8} />
        <AEllipse animatedProps={discA2} cx={R_discA[2][0]} cy={R_discA[2][1]} rx={DISC_RX} ry={DISC_RY} fill="url(#hmSteelB)" stroke="#0e0f12" strokeWidth={0.8} />
        <ALine
          animatedProps={shaftBBelow}
          x1={R_shaftB_below[0][0]}
          y1={R_shaftB_below[0][1]}
          x2={R_shaftB_below[1][0]}
          y2={R_shaftB_below[1][1]}
          stroke="#5d4527"
          strokeWidth={3.2}
          strokeLinecap="round"
        />
        <AEllipse animatedProps={discB0} cx={R_discB[0][0]} cy={R_discB[0][1]} rx={DISC_RX} ry={DISC_RY} fill="url(#hmSteelB)" stroke="#0e0f12" strokeWidth={0.8} />
        <AEllipse animatedProps={discB1} cx={R_discB[1][0]} cy={R_discB[1][1]} rx={DISC_RX} ry={DISC_RY} fill="url(#hmSteelB)" stroke="#0e0f12" strokeWidth={0.8} />
        <AEllipse animatedProps={discB2} cx={R_discB[2][0]} cy={R_discB[2][1]} rx={DISC_RX} ry={DISC_RY} fill="url(#hmSteelB)" stroke="#0e0f12" strokeWidth={0.8} />
        <Polygon points={`${P2(slabTop[0])} ${P2(slabTop[1])} ${P2(slabE1[1])} ${P2(slabE1[0])}`} fill="url(#hmWoodEB)" />
        <Polygon points={`${P2(slabTop[1])} ${P2(slabTop[2])} ${P2(slabE2[0])} ${P2(slabE1[1])}`} fill="#1c130a" />
        <Polygon points={slabTop.map(P2).join(' ')} fill="url(#hmWoodB)" stroke="#2a1f10" strokeWidth={1} />
        {GRAIN.map((d, i) => (
          <Path key={i} d={d} stroke="#00000022" strokeWidth={0.8} fill="none" />
        ))}
        {HOLES.map((h, i) => (
          <G key={i}>
            <Ellipse cx={h[0]} cy={h[1]} rx={1.6 * SC} ry={1.6 * SC * SP} fill="#0c0906" />
            <Ellipse cx={h[0]} cy={h[1]} rx={2.4 * SC} ry={2.4 * SC * SP} fill="none" stroke="#a89468" strokeWidth={1} strokeOpacity={0.5} />
          </G>
        ))}
        <ALine
          animatedProps={shaftAAbove}
          x1={R_shaftA_above[0][0]}
          y1={R_shaftA_above[0][1]}
          x2={R_shaftA_above[1][0]}
          y2={R_shaftA_above[1][1]}
          stroke={COL_A}
          strokeWidth={3}
          strokeLinecap="round"
        />
        <ALine
          animatedProps={shaftBAbove}
          x1={R_shaftB_above[0][0]}
          y1={R_shaftB_above[0][1]}
          x2={R_shaftB_above[1][0]}
          y2={R_shaftB_above[1][1]}
          stroke={COL_B}
          strokeWidth={3}
          strokeLinecap="round"
        />
      </Svg>

      {/* ── layer 2: orbiting platform + paper + ink (gradient id P) ─────── */}
      {sc > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              left: offX + PB.x * sc,
              top: offY + PB.y * sc,
              width: PB.w * sc,
              height: PB.h * sc,
            },
            platStyle,
          ]}
        >
          <Svg width="100%" height="100%" viewBox={`${PB.x} ${PB.y} ${PB.w} ${PB.h}`}>
            <Defs>
              <LinearGradient id="hmPaperP" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="#efe9d6" />
                <Stop offset="1" stopColor="#d9d2bc" />
              </LinearGradient>
            </Defs>
            <Polygon points={`${P2(PLATC[3])} ${P2(PLATC[2])} ${P2(PLATE[1])} ${P2(PLATE[0])}`} fill="#241a0d" />
            <Polygon points={PLATC.map(P2).join(' ')} fill="url(#hmPaperP)" stroke="#b8ad8d" strokeWidth={0.8} />
            <APath
              d={ink.dP}
              animatedProps={inkP}
              stroke="#8e1f32"
              strokeWidth={1.05}
              strokeOpacity={0.62}
              fill="none"
              strokeLinejoin="round"
              strokeDasharray={`${ink.totP.toFixed(1)} ${ink.totP.toFixed(1)}`}
              strokeDashoffset={ink.totP}
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
              strokeDashoffset={HEAD}
            />
          </Svg>
        </Animated.View>
      ) : null}

      {/* ── layer 3: arms, pen, inset (gradient id T) ─────────────────────── */}
      <Svg width="100%" height={height} viewBox={`0 0 ${VBW} ${VBH}`} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="hmPaperT" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#efe9d6" />
            <Stop offset="1" stopColor="#d9d2bc" />
          </LinearGradient>
        </Defs>
        <AEllipse animatedProps={penShadow} cx={R_pen[0] + 2} cy={R_pen[1] + 3} rx={4.4} ry={1.8} fill="#000" opacity={0.2} />
        <ALine
          animatedProps={armA}
          x1={R_armA[0][0]}
          y1={R_armA[0][1]}
          x2={R_armA[1][0]}
          y2={R_armA[1][1]}
          stroke="#b9a276"
          strokeWidth={2.4}
          strokeLinecap="round"
        />
        <ALine
          animatedProps={armB}
          x1={R_armB[0][0]}
          y1={R_armB[0][1]}
          x2={R_armB[1][0]}
          y2={R_armB[1][1]}
          stroke="#b9a276"
          strokeWidth={2.4}
          strokeLinecap="round"
        />
        <ACircle animatedProps={penBand} cx={R_pen[0]} cy={R_pen[1] - 1} r={2.4} fill="none" stroke="#7d2a35" strokeWidth={1} />
        <ALine
          animatedProps={penBody}
          x1={R_pen[0]}
          y1={R_pen[1]}
          x2={R_penTop[0]}
          y2={R_penTop[1]}
          stroke="#20242c"
          strokeWidth={2.8}
          strokeLinecap="round"
        />
        <ACircle animatedProps={penNib} cx={R_penTop[0]} cy={R_penTop[1]} r={1.7} fill="#e0435a" />
        <ACircle animatedProps={penCollar} cx={R_pen[0]} cy={R_pen[1] - 1} r={1.2} fill="#c9a25e" />
        <Rect x={IX} y={IY} width={IW} height={IW} rx={8} fill="url(#hmPaperT)" stroke="#26262c" strokeWidth={1.3} />
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
          strokeDashoffset={ink.totI}
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
          strokeDashoffset={HEAD}
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
    </View>
  );
});
