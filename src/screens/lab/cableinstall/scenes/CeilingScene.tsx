/**
 * STAGE 8 — Ceiling & Overhead Installations (spec §32).
 *
 * One suspended-ceiling CUTAWAY (structural deck + joists, hanger wires, grid
 * + tiles, ductwork, sprinkler main with heads, conduit, a light fixture, a
 * cable tray section, J-hooks) with the owner-spec visibility toggle:
 * FINISHED VIEW (the room from below — clean ceiling, nothing visible) vs
 * ABOVE CEILING (the cutaway with everything). Default ABOVE for the
 * exercises; flipping shows exactly why X-ray understanding matters.
 *
 * EXERCISE 1 — FIND THE PROBLEMS: the 8 CI_CEILING_DEFECTS drawn at their
 * data positions as visibly-wrong details; tappable ≥44dp markers plus the
 * accessible SUSPECT LIST alternative. 6 of 8 required to continue.
 * EXERCISE 2 — INSTALL THE ROUTE: the SpecCard ritual (the SYSTEM's criteria
 * are supplied — never folklore), then pathway choice → J-hook placement on a
 * 12-unit span to the supplied spec → confirm.
 *
 * MOTION (owner 2026-08-24 — this scene used to be two static slides):
 *   • the FINISHED ↔ ABOVE toggle is a REVEAL, not a swap: the tiles lift away
 *     on a left-to-right stagger while the cutaway fades up in DEPTH ORDER
 *     (deck → services → existing cable → the install). It reverses cleanly.
 *   • unfound defects breathe on INDIVIDUAL phases; a found one stops, springs
 *     into its found state, and the counter ticks up.
 *   • the money moment: every hook placed or pulled RE-SETTLES the run's sag on
 *     a spring, span by span. Sag grows with the SQUARE of the unsupported
 *     span (the actual physics, and the actual lesson), the over-long span
 *     glows and breathes, and when the spacing meets the supplied spec the run
 *     settles into a clean catenary chain.
 *   • confirming installs the bundle along itself — tray lead-in, then the
 *     supported run, ending at the bushed sleeve.
 * Primitive-prop animation only (see motion.tsx's hard-won react-native-svg
 * rule): the sag morphs by animating the path's `d`, groups fade via <G
 * opacity>, and the only transform in the file is on a plain RN Animated.View.
 *
 * Completion: both exercises → onComplete({ safety, routing, protection,
 * serviceability }), fired once. A11y: labeled buttons, announced verdicts,
 * replay via `completed`; reduced motion collapses every duration to 0 with
 * identical end states. Training visualization — honest geometry only.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
/** Type-only: the motion kit re-exports the hooks, not the SharedValue type. */
import type { SharedValue } from 'react-native-reanimated';
import { colors, fonts } from '../../../../theme/tokens';
import { OptionChip, lessonStyles } from '../../cable/lessons/bits';
import { CiSection, FindProgress, RuleFeedback, SpecCard, announceComplete } from '../bits';
import { mistakeById } from '../data/mistakes';
import { CI_CEILING_DEFECTS, CI_CEILING_INSTALL_STEPS, CI_SUPPORT_SPACING_SPEC } from '../data/scenarios';
import { clamp100 } from '../engine/score';
import {
  ACircle,
  AG,
  ALine,
  APath,
  ARect,
  Animated,
  Appear,
  CI_EASE,
  CI_MOTION,
  CI_SPRING,
  CI_SPRING_UI,
  Stagger,
  cancelAnimation,
  useAnimatedProps,
  useAnimatedStyle,
  useCiMotion,
  useCountUp,
  useDrawIn,
  useSettle,
  useSharedValue,
  useTween,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
} from '../motion';
import type { CiModuleProps } from '../registry';

const VB_W = 360;
const VB_H = 220;
const FIND_REQUIRED = 6;

/* Exercise 2 span: tray end → far-wall sleeve = 12 grid units. */
const SPAN_X0 = 178;
const SPAN_UNITS = 12;
const UNIT_PX = 13;
const SPEC_MAX_GAP = 4; // from CI_SUPPORT_SPACING_SPEC — "supports every 4 units"
const HOOK_SLOTS = Array.from({ length: SPAN_UNITS - 1 }, (_, i) => i + 1); // U1..U11

/* ── the sag model ──────────────────────────────────────────────────────── */
/** Height of the supported run (level, as a real ceiling run is). */
const RUN_Y = 124;
/** Sag is sampled at fixed x positions so the path morphs with a CONSTANT
 *  command count — the only way a spring can carry it. */
const SAMPLES = 21;
const RUN_XS = Array.from({ length: SAMPLES }, (_, i) => SPAN_X0 + (i / (SAMPLES - 1)) * SPAN_UNITS * UNIT_PX);
/** Dip grows with the SQUARE of the span (real cable physics): a 4-unit span
 *  barely dips, a 12-unit unsupported span bottoms out at the cap. */
const SAG_K = 0.15;
const SAG_MAX = 20;
/** Where the run enters the far wall through the bushed sleeve. */
const SLEEVE_X = 342;
const SLEEVE_Y = 122;
/** Over-estimated path length for the install draw (over-estimate is safe). */
const RUN_LEN = 230;
const LEAD_LEN = 200;

const PATH_OPTS: { id: string; label: string; good: boolean; short: string }[] = [
  {
    id: 'tray',
    label: 'Tray across its span, then J-hooks on to the wall sleeve',
    good: true,
    short: 'Tray where it exists, purpose-built hooks beyond — every foot supported from structure.',
  },
  {
    id: 'tiles',
    label: 'Lay the bundle across the ceiling tiles',
    good: false,
    short: 'Tiles are a finish system, not a support — where the electrical code is adopted this is a violation, and defect #1 out there shows how it ends.',
  },
  {
    id: 'duct',
    label: 'Tie it along the supply duct — it heads the right way',
    good: false,
    short: 'The duct is another trade\'s system, never a cable support — and every duct service call now starts by cutting your bundle free.',
  },
];

/** Sampled sag profile for a support set — honest catenary per span, never a
 *  magic straight line. Supports are the tray end (U0), the wall (U12) and
 *  every placed hook. */
function sagProfile(units: number[]): number[] {
  const sup = [0, ...units.slice().sort((a, b) => a - b), SPAN_UNITS];
  const ys: number[] = [];
  for (let i = 0; i < SAMPLES; i++) {
    const u = (i / (SAMPLES - 1)) * SPAN_UNITS;
    let a = 0;
    let b = SPAN_UNITS;
    for (let j = 1; j < sup.length; j++) {
      if (u <= sup[j] + 1e-6) {
        a = sup[j - 1];
        b = sup[j];
        break;
      }
    }
    const span = Math.max(1e-6, b - a);
    const s = (u - a) / span;
    ys.push(RUN_Y + 4 * Math.min(SAG_MAX, SAG_K * span * span) * s * (1 - s));
  }
  return ys;
}

/** The widest unsupported span, in units, with its unit bounds. */
function widestSpan(units: number[]) {
  const sup = [0, ...units.slice().sort((a, b) => a - b), SPAN_UNITS];
  let gap = 0;
  let a = 0;
  let b = SPAN_UNITS;
  for (let i = 1; i < sup.length; i++) {
    if (sup[i] - sup[i - 1] > gap) {
      gap = sup[i] - sup[i - 1];
      a = sup[i - 1];
      b = sup[i];
    }
  }
  return { gap, a, b };
}

/** Path string for a profile — used for the constant rest pose. */
function profileD(ys: number[]): string {
  let d = '';
  for (let i = 0; i < ys.length; i++) d += `${i === 0 ? 'M' : 'L'}${RUN_XS[i].toFixed(1)} ${ys[i].toFixed(1)} `;
  return `${d}L${SLEEVE_X} ${SLEEVE_Y}`;
}

/* ── scene-local motion helpers ─────────────────────────────────────────── */

/** Constant rest pose: React skips unchanged props, so a re-render mid-flight
 *  can never re-commit a static value over the native animated one. */
function useRest<T>(v: T): T {
  return useRef(v).current;
}

/** motion.tsx types useSettle's `spring` option as CI_SPRING's literal shape,
 *  so the snappier furniture spring needs one cast to get through. */
const SPRING_UI = CI_SPRING_UI as unknown as typeof CI_SPRING;

/** 0..1 ramp inside a window — the depth-order and stagger workhorse. */
const ramp = (v: number, a: number, b: number) => {
  'worklet';
  return Math.max(0, Math.min(1, (v - a) / (b - a)));
};

/**
 * Breathing driver with its OWN phase — eight defect markers must never pulse
 * in unison (owner 2026-08-24). Silent when `run` is false / reduced motion.
 */
function useBreath({ run, period = 1500, delay = 0 }: { run: boolean; period?: number; delay?: number }) {
  const m = useCiMotion();
  const t = useSharedValue(0);
  useEffect(() => {
    cancelAnimation(t);
    if (!run || !m.loops) {
      t.value = 0;
      return;
    }
    t.value = 0;
    t.value = withDelay(delay, withRepeat(withTiming(1, { duration: period, easing: CI_EASE.inOut }), -1, true));
    return () => cancelAnimation(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, period, delay, m.loops]);
  return t;
}

/** One depth plane of the cutaway, fading up inside its own window of the
 *  reveal. Deck first, then services, then cable — the ceiling opening. */
function Layer({ t, from, to, above, children }: { t: SharedValue<number>; from: number; to: number; above: boolean; children: ReactNode }) {
  const rest = useRest(above ? 1 : 0);
  const p = useAnimatedProps(() => ({ opacity: ramp(t.value, from, to) }));
  return (
    <AG opacity={rest} animatedProps={p}>
      {children}
    </AG>
  );
}

/** A run that installs itself along its path (mounted when it's time). */
function InstalledRun({ d, len, color, width, delay = 0 }: { d: string; len: number; color: string; width: number; delay?: number }) {
  const { animatedProps, dashArray, restOffset } = useDrawIn(len, { run: true, delay });
  return (
    <APath
      d={d}
      stroke={color}
      strokeWidth={width}
      fill="none"
      strokeLinecap="round"
      strokeDasharray={dashArray}
      strokeDashoffset={restOffset}
      animatedProps={animatedProps}
    />
  );
}

/** A defect marker: breathes on its own phase until found, then springs into
 *  its found state and stops. */
function DefectMarker({ cx, cy, index, found, run }: { cx: number; cy: number; index: number; found: boolean; run: boolean }) {
  const breath = useBreath({ run: run && !found, period: 1320 + (index % 4) * 170, delay: index * 185 });
  const k = useSettle(found ? 1 : 0, { spring: SPRING_UI });
  const restRing = useRest(run && !found ? 0.5 : 0);
  const restTick = useRest(found ? 1 : 0);
  const ring = useAnimatedProps(() => ({ r: 11 + 8 * breath.value, opacity: 0.5 * (1 - breath.value) }));
  const core = useAnimatedProps(() => ({ r: 11 + 1.8 * k.value }));
  const tick = useAnimatedProps(() => ({ opacity: k.value }));
  return (
    <>
      <ACircle cx={cx} cy={cy} r={11} fill="none" stroke="#6f7378" strokeWidth={1.6} opacity={restRing} animatedProps={ring} />
      <ACircle
        cx={cx}
        cy={cy}
        r={11}
        fill={found ? 'rgba(55,224,95,.12)' : 'rgba(255,255,255,.02)'}
        stroke={found ? colors.green : '#6f7378'}
        strokeWidth={found ? 2 : 1.3}
        strokeDasharray={found ? undefined : '3 4'}
        animatedProps={core}
      />
      <AG opacity={restTick} animatedProps={tick}>
        <SvgText x={cx} y={cy + 3.5} fill={colors.green} fontSize={10} fontFamily={fonts.oswaldSemiBold} textAnchor="middle">
          ✓
        </SvgText>
      </AG>
    </>
  );
}

/** A unit tick on the span — arrives on a stagger, lengthens when its hook
 *  goes in. */
function Tick({ x, index, on }: { x: number; index: number; on: boolean }) {
  const m = useCiMotion();
  const t = useSharedValue(m.reduce ? 1 : 0);
  const k = useSettle(on ? 1 : 0, { spring: SPRING_UI });
  useEffect(() => {
    cancelAnimation(t);
    if (m.reduce) {
      t.value = 1;
      return;
    }
    t.value = 0;
    t.value = withDelay(index * 26, withTiming(1, { duration: CI_MOTION.quick, easing: CI_EASE.out }));
    return () => cancelAnimation(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, m.reduce]);
  const p = useAnimatedProps(() => ({ opacity: t.value, y2: 138 + 4 * k.value, strokeWidth: 1.2 + 0.9 * k.value }));
  return <ALine x1={x} y1={132} x2={x} y2={138} stroke={on ? colors.amber : '#34343c'} strokeWidth={1.2} opacity={0} animatedProps={p} />;
}

/** A placed J-hook — the rod stays hung from structure while the cradle drops
 *  the last few units and settles. */
function PlacedHook({ x }: { x: number }) {
  const m = useCiMotion();
  const k = useSharedValue(m.reduce ? 1 : 0);
  useEffect(() => {
    cancelAnimation(k);
    if (m.reduce) {
      k.value = 1;
      return;
    }
    k.value = withSpring(1, CI_SPRING_UI);
    return () => cancelAnimation(k);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [m.reduce]);
  const hookD = (dy: number) => {
    'worklet';
    return `M${x} 28 V${(110 - dy).toFixed(1)} M${x - 5} ${(110 - dy).toFixed(1)} V${(119 - dy).toFixed(1)} Q${x - 5} ${(126 - dy).toFixed(1)} ${x + 2} ${(126 - dy).toFixed(1)} H${x + 6}`;
  };
  const p = useAnimatedProps(() => ({ d: hookD((1 - k.value) * 9), opacity: Math.min(1, k.value * 1.8) }));
  return <APath d={hookD(0)} stroke="#b9bcc2" strokeWidth={1.8} fill="none" opacity={0} animatedProps={p} />;
}

/**
 * THE RUN. Its shape is the interpolation between the sag profile it had and
 * the sag profile the current supports demand, carried by a SPRING — so every
 * hook placed or pulled makes the cable re-settle with real overshoot.
 */
function SagRun({
  fromArr,
  toArr,
  k,
  restD,
  tint,
  width,
  fadeTo,
  draw,
  drawDelay,
}: {
  fromArr: SharedValue<number[]>;
  toArr: SharedValue<number[]>;
  k: SharedValue<number>;
  restD: string;
  tint: string;
  width: number;
  fadeTo: number;
  draw?: boolean;
  drawDelay?: number;
}) {
  const fade = useTween(fadeTo, CI_MOTION.base);
  const { progress } = useDrawIn(RUN_LEN, { run: !!draw, delay: drawDelay ?? 0 });
  const restFade = useRest(fadeTo);
  const p = useAnimatedProps(() => {
    const f = fromArr.value;
    const t = toArr.value;
    let d = '';
    for (let i = 0; i < t.length; i++) {
      d += `${i === 0 ? 'M' : 'L'}${RUN_XS[i].toFixed(1)} ${(f[i] + (t[i] - f[i]) * k.value).toFixed(1)} `;
    }
    return {
      d: `${d}L${SLEEVE_X} ${SLEEVE_Y}`,
      opacity: fade.value,
      strokeDashoffset: draw ? RUN_LEN * (1 - progress.value) : 0,
    };
  });
  return (
    <APath
      d={restD}
      stroke={tint}
      strokeWidth={width}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={draw ? RUN_LEN : undefined}
      strokeDashoffset={draw ? RUN_LEN : 0}
      opacity={restFade}
      animatedProps={p}
    />
  );
}

/** The over-long span glows and breathes under the strained stretch of cable —
 *  it rides the same interpolated profile, so it never lags the sag. */
function StrainMark({
  fromArr,
  toArr,
  k,
  i0,
  i1,
  run,
}: {
  fromArr: SharedValue<number[]>;
  toArr: SharedValue<number[]>;
  k: SharedValue<number>;
  i0: number;
  i1: number;
  run: boolean;
}) {
  const breath = useBreath({ run, period: 1150 });
  const fade = useTween(run ? 1 : 0, CI_MOTION.base);
  const p = useAnimatedProps(() => {
    const f = fromArr.value;
    const t = toArr.value;
    let d = '';
    for (let i = i0; i <= i1 && i < t.length; i++) {
      d += `${i === i0 ? 'M' : 'L'}${RUN_XS[i].toFixed(1)} ${(f[i] + (t[i] - f[i]) * k.value).toFixed(1)} `;
    }
    return { d, opacity: fade.value * (0.18 + 0.3 * breath.value) };
  });
  return <APath d="" stroke="#ff5a48" strokeWidth={7} fill="none" strokeLinecap="round" opacity={0} animatedProps={p} />;
}

/** The bushed sleeve: the ring settles green and one landing pulse expands
 *  away when the route is confirmed. */
function SleeveRing({ on }: { on: boolean }) {
  const m = useCiMotion();
  const k = useSettle(on ? 1 : 0, { spring: SPRING_UI });
  const land = useSharedValue(0);
  const restLand = useRest(0);
  useEffect(() => {
    cancelAnimation(land);
    if (!on || m.reduce) {
      land.value = 0;
      return;
    }
    land.value = 0;
    land.value = withDelay(CI_MOTION.draw, withTiming(1, { duration: CI_MOTION.reveal, easing: CI_EASE.out }));
    return () => cancelAnimation(land);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on, m.reduce]);
  const ring = useAnimatedProps(() => ({ r: 5 + 0.9 * k.value }));
  const pulse = useAnimatedProps(() => ({ r: 5 + 11 * land.value, opacity: 0.6 * (1 - land.value) }));
  return (
    <>
      <ACircle cx={331} cy={SLEEVE_Y} r={5} fill="none" stroke={on ? colors.green : '#6f7378'} strokeWidth={1.8} animatedProps={ring} />
      <ACircle cx={331} cy={SLEEVE_Y} r={5} fill="none" stroke={colors.green} strokeWidth={1.4} opacity={restLand} animatedProps={pulse} />
    </>
  );
}

/* ── the cutaway (ABOVE CEILING view) ───────────────────────────────────── */
function AboveSvg({
  w,
  above,
  rv,
  found,
  hooks,
  showTicks,
  confirmed,
  fromArr,
  toArr,
  settleK,
  restD,
  strain,
  pulseDefects,
  runTint,
}: {
  w: number;
  above: boolean;
  rv: SharedValue<number>;
  found: Set<string>;
  hooks: Set<number>;
  showTicks: boolean;
  confirmed: boolean;
  fromArr: SharedValue<number[]>;
  toArr: SharedValue<number[]>;
  settleK: SharedValue<number>;
  restD: string;
  strain: { on: boolean; i0: number; i1: number };
  pulseDefects: boolean;
  runTint: string;
}) {
  const h = Math.round((w * VB_H) / VB_W);
  const hookXs = [...hooks].sort((a, b) => a - b).map((u) => SPAN_X0 + u * UNIT_PX);
  return (
    <Svg
      width={w}
      height={h}
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      accessibilityLabel="Above-ceiling cutaway: structural deck and joists on top, hanger wires, duct, sprinkler main with heads, conduit, cable tray, J-hooks, light fixture, and the grid with tiles at the bottom. Eight suspect details are marked."
      /* both views stay mounted for the reveal — only the live one is readable */
      accessibilityElementsHidden={!above}
      importantForAccessibility={above ? 'auto' : 'no-hide-descendants'}
    >
      {/* the base plate never fades — the cross-dissolve always has a floor */}
      <Rect x={0} y={0} width={VB_W} height={VB_H} rx={10} fill="#131318" />

      {/* ── depth 1: structure ─────────────────────────────────────────── */}
      <Layer t={rv} from={0} to={0.4} above={above}>
        <Rect x={0} y={4} width={VB_W} height={10} fill="#1d1d24" />
        {[16, 44, 72, 100, 128, 156, 184, 212, 240, 268, 296, 324, 352].map((x) => (
          <Line key={x} x1={x} y1={13} x2={x + 7} y2={5} stroke="#2c2c33" strokeWidth={1} />
        ))}
        {[20, 80, 140, 200, 260, 320].map((x) => (
          <Rect key={x} x={x - 3} y={14} width={6} height={14} fill="#22222a" />
        ))}
        {/* far wall (the destination) */}
        <Rect x={336} y={14} width={18} height={150} fill="#1b1b22" stroke="#2c2c33" strokeWidth={1} />
        {/* hanger wires */}
        {[50, 110, 170, 230, 290].map((x) => (
          <Line key={x} x1={x} y1={28} x2={x} y2={162} stroke="#34343c" strokeWidth={0.8} />
        ))}
      </Layer>

      {/* ── depth 2: the other trades' systems ─────────────────────────── */}
      <Layer t={rv} from={0.18} to={0.62} above={above}>
        {/* ductwork (hung from structure) */}
        <Line x1={30} y1={28} x2={30} y2={78} stroke="#3a3c42" strokeWidth={1.4} />
        <Line x1={100} y1={28} x2={100} y2={78} stroke="#3a3c42" strokeWidth={1.4} />
        <Rect x={12} y={78} width={108} height={26} fill="#1a1a21" stroke="#3a3c42" strokeWidth={1.4} />
        <Line x1={12} y1={91} x2={120} y2={91} stroke="#26262c" strokeWidth={1} />

        {/* sprinkler main + heads (life-safety — red) */}
        <Line x1={200} y1={28} x2={200} y2={84} stroke="#3a3c42" strokeWidth={1.2} />
        <Line x1={310} y1={28} x2={310} y2={84} stroke="#3a3c42" strokeWidth={1.2} />
        <Line x1={126} y1={84} x2={336} y2={84} stroke="#ff5a48" strokeWidth={3.5} />
        {[204, 258, 316].map((x) => (
          <Path key={x} d={`M${x} 84 L${x} 164`} stroke="#ff5a48" strokeWidth={1.6} />
        ))}
        {[204, 258, 316].map((x) => (
          <Circle key={x} cx={x} cy={168.5} r={2.6} fill="#ff5a48" />
        ))}

        {/* conduit (someone else's system) */}
        {[180, 260, 330].map((x) => (
          <Line key={x} x1={x} y1={28} x2={x} y2={44} stroke="#3a3c42" strokeWidth={1.2} />
        ))}
        <Line x1={150} y1={44} x2={336} y2={44} stroke="#6f7378" strokeWidth={3.5} />
        <Line x1={150} y1={44} x2={336} y2={44} stroke="#101014" strokeWidth={1} />

        {/* cable tray section (trapeze-hung), legitimately carrying runs */}
        <Line x1={70} y1={28} x2={70} y2={116} stroke="#3a3c42" strokeWidth={1.4} />
        <Line x1={170} y1={28} x2={170} y2={116} stroke="#3a3c42" strokeWidth={1.4} />
        <Rect x={60} y={116} width={120} height={3} fill="#3a3c42" />
        <Rect x={60} y={130} width={120} height={3} fill="#3a3c42" />
        {[66, 78, 90, 102, 114, 126, 138, 150, 162, 174].map((x) => (
          <Line key={x} x1={x} y1={119} x2={x} y2={130} stroke="#2c2c33" strokeWidth={1} />
        ))}
        <Line x1={64} y1={124} x2={177} y2={124} stroke="#4fd0e0" strokeWidth={1.6} opacity={0.7} />
        <Line x1={64} y1={127} x2={177} y2={127} stroke="#37d97b" strokeWidth={1.6} opacity={0.7} />

        {/* light fixture recessed in the grid */}
        <Rect x={88} y={146} width={44} height={18} fill="#1c1c23" stroke="#3a3c42" strokeWidth={1.2} />
        <Rect x={90} y={164} width={40} height={4} fill="#fff3c2" opacity={0.75} />
      </Layer>

      {/* ── depth 3: the grid + tiles, seen edge-on ────────────────────── */}
      <Layer t={rv} from={0.06} to={0.46} above={above}>
        <Line x1={0} y1={164} x2={336} y2={164} stroke="#4a4a52" strokeWidth={2} />
        {[2, 60, 118, 176, 234, 292].map((x) => (
          <Rect key={x} x={x} y={166} width={x === 292 ? 42 : 54} height={8} fill="#1f1f26" stroke="#15151a" strokeWidth={1} />
        ))}
        <Rect x={0} y={176} width={VB_W} height={44} fill="#0d0d10" />
      </Layer>

      {/* ── depth 4: the previous contractor's wrongs (Exercise 1) ─────── */}
      <Layer t={rv} from={0.42} to={0.9} above={above}>
        {/* cd-6 overstuffed J-hook (high trapeze hook) */}
        <Line x1={194} y1={28} x2={194} y2={58} stroke="#3a3c42" strokeWidth={1.2} />
        <Path d="M189 58 V68 Q189 74 196 74 H200" stroke="#b9bcc2" strokeWidth={2} fill="none" />
        <Path d="M186 64 Q194 54 202 64 Q194 72 186 64" stroke="#4fd0e0" strokeWidth={2.2} fill="none" />
        <Path d="M187 68 Q194 58 201 68 Q194 76 187 68" stroke="#37d97b" strokeWidth={2.2} fill="none" />
        <Path d="M188 60 Q194 68 200 60" stroke="#c77dff" strokeWidth={2} fill="none" />

        {/* run leaving the crammed hook LEFT: drapes the sprinkler main (cd-2),
            lands on the light housing (cd-4), ends lying on the tiles (cd-1) */}
        <Path
          d="M190 70 Q172 72 162 80 Q158 82 154 88 Q146 100 138 112 Q122 134 112 146 Q98 148 84 152 Q70 156 62 161 Q48 168 36 163 Q30 160 28 161"
          stroke="#4fd0e0"
          strokeWidth={2.6}
          fill="none"
        />
        <Rect x={22} y={158} width={7} height={6} rx={1} fill="#26262c" stroke="#6f7378" strokeWidth={0.8} />

        {/* run leaving the hook RIGHT: hard 90° fold (cd-5) into an unmarked
            wall penetration (cd-7) */}
        <Path d="M198 72 Q224 84 248 94 Q264 98 274 97 L274 106 L334 106" stroke="#4fd0e0" strokeWidth={2.6} fill="none" />
        <Path d="M330 99 L344 97 L346 112 L332 114 Z" fill="#0b0b0e" stroke="#55555e" strokeWidth={1.2} />

        {/* cd-3: lone cable sagging deep between tray end and a far J-hook */}
        <Line x1={300} y1={28} x2={300} y2={110} stroke="#3a3c42" strokeWidth={1.2} />
        <Path d="M295 110 V118 Q295 124 302 124 H306" stroke="#b9bcc2" strokeWidth={2} fill="none" />
        <Path d="M180 120 Q240 148 297 120" stroke="#37d97b" strokeWidth={2.6} fill="none" />
        <Path d="M297 120 L300 116 L300 40" stroke="#37d97b" strokeWidth={2} fill="none" />
        <Rect x={294} y={32} width={12} height={8} rx={1.5} fill="#1c1c23" stroke="#3a3c42" strokeWidth={1} />

        {/* cd-8: service loop tied high above the rigid duct — unreachable */}
        <Path d="M2 42 Q20 48 34 58" stroke="#37d97b" strokeWidth={2.4} fill="none" />
        <Circle cx={43} cy={66} r={10} fill="none" stroke="#37d97b" strokeWidth={2.4} />
        <Circle cx={43} cy={66} r={6.5} fill="none" stroke="#37d97b" strokeWidth={2} />
        <Line x1={43} y1={54} x2={43} y2={58} stroke="#e8e8ea" strokeWidth={1.6} />
        <Path d="M52 72 Q60 92 60 116" stroke="#37d97b" strokeWidth={2.4} fill="none" />
      </Layer>

      {/* ── depth 5: the learner's install ─────────────────────────────── */}
      <Layer t={rv} from={0.55} to={1} above={above}>
        {/* far-wall sleeve (the intended, bushed entry) */}
        <Rect x={330} y={118} width={14} height={8} rx={2} fill="#101014" stroke="#6f7378" strokeWidth={1.2} />
        <SleeveRing on={confirmed} />

        {/* unit tick marks while placing supports */}
        {showTicks
          ? HOOK_SLOTS.map((u, i) => <Tick key={u} x={SPAN_X0 + u * UNIT_PX} index={i} on={hooks.has(u)} />)
          : null}

        {/* placed J-hooks — each drops in and settles */}
        {hookXs.map((x) => (
          <PlacedHook key={x} x={x} />
        ))}

        {/* the strained stretch, then the run itself */}
        <StrainMark fromArr={fromArr} toArr={toArr} k={settleK} i0={strain.i0} i1={strain.i1} run={strain.on} />
        {/* the run in progress: it exists the moment a pathway is chosen, and
            re-settles on every hook until the spec is met */}
        <SagRun
          fromArr={fromArr}
          toArr={toArr}
          k={settleK}
          restD={restD}
          tint={runTint}
          width={3}
          fadeTo={showTicks ? 1 : 0}
        />
        {/* confirmed: the bundle installs itself, tray lead-in first */}
        {confirmed ? (
          <>
            <InstalledRun d="M4 146 Q36 142 60 127 L178 124" len={LEAD_LEN} color="#c77dff" width={3} />
            <SagRun
              fromArr={fromArr}
              toArr={toArr}
              k={settleK}
              restD={restD}
              tint="#c77dff"
              width={3}
              fadeTo={1}
              draw
              drawDelay={CI_MOTION.base}
            />
          </>
        ) : null}
      </Layer>

      {/* ── Exercise 1 markers at the data positions ───────────────────── */}
      <Layer t={rv} from={0.6} to={1} above={above}>
        {CI_CEILING_DEFECTS.map((d, i) => (
          <DefectMarker
            key={d.id}
            cx={(d.x / 100) * VB_W}
            cy={(d.y / 100) * VB_H}
            index={i}
            found={found.has(d.id)}
            run={pulseDefects}
          />
        ))}
      </Layer>
    </Svg>
  );
}

/* ── the room from below (FINISHED VIEW) — deliberately boring ──────────── */
/** The shell: walls, floor, the one wall plate. Cross-fades out first. */
function FinishedShellSvg({ w }: { w: number }) {
  const h = Math.round((w * VB_H) / VB_W);
  return (
    <Svg
      width={w}
      height={h}
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      accessibilityLabel="Finished room view: a clean suspended ceiling with tiles, one light fixture and sprinkler heads. Nothing above it is visible."
    >
      <Rect x={0} y={0} width={VB_W} height={VB_H} rx={10} fill="#101014" />
      <Line x1={12} y1={46} x2={12} y2={196} stroke="#26262c" strokeWidth={2} />
      <Line x1={348} y1={46} x2={348} y2={196} stroke="#26262c" strokeWidth={2} />
      <Line x1={12} y1={196} x2={348} y2={196} stroke="#2c2c33" strokeWidth={2} />
      <Rect x={300} y={120} width={12} height={18} rx={1.5} fill="#17171c" stroke="#3a3c42" strokeWidth={1} />
    </Svg>
  );
}

/** One ceiling tile, lifting away on its own beat. */
function FinishedTile({ x, index, rv, above }: { x: number; index: number; rv: SharedValue<number>; above: boolean }) {
  const rest = useRest(above ? 0 : 1);
  const p = useAnimatedProps(() => ({ opacity: 1 - ramp(rv.value, index * 0.05, index * 0.05 + 0.34) }));
  return <ARect x={x} y={36} width={54} height={10} fill="#1c1c22" stroke="#26262c" strokeWidth={1} opacity={rest} animatedProps={p} />;
}

/** The ceiling plane itself — the layer that lifts away to open the room. */
function FinishedCeilingSvg({ w, rv, above }: { w: number; rv: SharedValue<number>; above: boolean }) {
  const h = Math.round((w * VB_H) / VB_W);
  const rest = useRest(above ? 0 : 1);
  const fittings = useAnimatedProps(() => ({ opacity: 1 - ramp(rv.value, 0.02, 0.32) }));
  return (
    <Svg width={w} height={h} viewBox={`0 0 ${VB_W} ${VB_H}`} pointerEvents="none">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <FinishedTile key={i} x={12 + i * 56} index={i} rv={rv} above={above} />
      ))}
      <AG opacity={rest} animatedProps={fittings}>
        <Rect x={96} y={38} width={44} height={7} fill="#fff3c2" opacity={0.85} />
        {[204, 316].map((x) => (
          <Circle key={x} cx={x} cy={49} r={2.6} fill="#9aa0a6" />
        ))}
      </AG>
    </Svg>
  );
}

/* ── the scene ──────────────────────────────────────────────────────────── */
export function CeilingScene({ width, completed, onComplete, openSources }: CiModuleProps) {
  const allIds = CI_CEILING_DEFECTS.map((d) => d.id);
  const [view, setView] = useState<'above' | 'finished'>('above');
  const [found, setFound] = useState<Set<string>>(() => new Set(completed ? allIds : []));
  const [lastFind, setLastFind] = useState<string | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const [ex1Done, setEx1Done] = useState(completed);
  const [pathPick, setPathPick] = useState<string | null>(completed ? 'tray' : null);
  const [hooks, setHooks] = useState<Set<number>>(() => new Set(completed ? [4, 8] : []));
  const [spacing, setSpacing] = useState<{ ok: boolean; maxGap: number; extra: boolean } | null>(
    completed ? { ok: true, maxGap: SPEC_MAX_GAP, extra: false } : null,
  );
  const [confirmed, setConfirmed] = useState(completed);
  const [fired, setFired] = useState(completed);
  const wrongs = useRef({ path: 0, spacing: 0 });

  const m = useCiMotion();
  const say = (t: string) => AccessibilityInfo.announceForAccessibility(t);

  const pathSolved = pathPick === 'tray';
  const pathOpt = PATH_OPTS.find((o) => o.id === pathPick);
  const allDone = ex1Done && pathSolved && spacing?.ok === true && confirmed;

  /* ── the reveal driver: 0 = finished room, 1 = above the ceiling ─────── */
  const above = view === 'above';
  const rv = useTween(above ? 1 : 0, 720);
  const shellStyle = useAnimatedStyle(() => ({ opacity: 1 - ramp(rv.value, 0, 0.5) }));
  const ceilingStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -14 * ramp(rv.value, 0, 0.7) }] }));

  /* ── the sag: a spring carries the run from the profile it had to the
       profile the current supports demand (the money moment) ───────────── */
  const hookUnits = [...hooks].sort((a, b) => a - b);
  const hookKey = hookUnits.join(',');
  const initialProfile = useRef(sagProfile(hookUnits)).current;
  const fromArr = useSharedValue<number[]>(initialProfile);
  const toArr = useSharedValue<number[]>(initialProfile);
  const settleK = useSharedValue(1);
  const restD = useRef(profileD(initialProfile)).current;

  useEffect(() => {
    const units = hookKey.length ? hookKey.split(',').map(Number) : [];
    const next = sagProfile(units);
    const f = fromArr.value;
    const t = toArr.value;
    const kk = settleK.value;
    // start from wherever the cable actually IS, so fast taps stay continuous
    fromArr.value = t.map((v, i) => f[i] + (v - f[i]) * kk);
    toArr.value = next;
    if (m.reduce) {
      settleK.value = 1;
      return;
    }
    settleK.value = 0;
    settleK.value = withSpring(1, CI_SPRING);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hookKey, m.reduce]);

  const widest = widestSpan(hookUnits);
  const strain = {
    on: pathSolved && !confirmed && widest.gap > SPEC_MAX_GAP,
    i0: Math.round((widest.a / SPAN_UNITS) * (SAMPLES - 1)),
    i1: Math.round((widest.b / SPAN_UNITS) * (SAMPLES - 1)),
  };

  useEffect(() => {
    if (fired || !allDone) return;
    setFired(true);
    announceComplete('Stage 8 complete.');
    onComplete({
      safety: clamp100(60 + found.size * 5),
      routing: clamp100(100 - 12 * wrongs.current.path - 8 * wrongs.current.spacing),
      protection: clamp100(100 - 6 * wrongs.current.path - 8 * wrongs.current.spacing),
      serviceability: clamp100(70 + (found.has('cd-8') ? 15 : 0) + 15),
    });
  }, [allDone, fired, found, onComplete]);

  /* Exercise 1 */
  const find = (id: string) => {
    if (found.has(id)) return;
    const defect = CI_CEILING_DEFECTS.find((d) => d.id === id);
    const mis = defect ? mistakeById(defect.mistakeId) : undefined;
    setFound((s) => new Set(s).add(id));
    setLastFind(id);
    if (mis) say(`Found. ${mis.shortFeedback}`);
  };
  const lastDefect = lastFind ? CI_CEILING_DEFECTS.find((d) => d.id === lastFind) : undefined;
  const lastMistake = lastDefect ? mistakeById(lastDefect.mistakeId) : undefined;
  const foundShown = useCountUp(found.size, CI_MOTION.base);

  /* Exercise 2 */
  const pickPath = (o: (typeof PATH_OPTS)[number]) => {
    if (pathSolved) return;
    setPathPick(o.id);
    if (!o.good) wrongs.current.path += 1;
    say(`${o.good ? 'Correct pathway.' : 'Not a pathway.'} ${o.short}`);
  };
  const toggleHook = (u: number) => {
    if (confirmed) return;
    setSpacing(null);
    setHooks((s) => {
      const n = new Set(s);
      if (n.has(u)) n.delete(u);
      else n.add(u);
      return n;
    });
  };
  const checkSpacing = () => {
    const maxGap = widestSpan([...hooks]).gap;
    const ok = maxGap <= SPEC_MAX_GAP;
    const extra = ok && hooks.size > Math.ceil(SPAN_UNITS / SPEC_MAX_GAP) - 1;
    setSpacing({ ok, maxGap, extra });
    if (!ok) wrongs.current.spacing += 1;
    say(ok ? 'Spacing meets the supplied specification.' : `Widest span is ${maxGap} units — the supplied spec says every ${SPEC_MAX_GAP}.`);
  };
  const confirmRoute = () => {
    if (confirmed || spacing?.ok !== true) return;
    setConfirmed(true);
    say('Route confirmed. The bundle runs through tray and hooks with honest sag, clear of the utilities, into the bushed sleeve.');
  };

  const steps = CI_CEILING_INSTALL_STEPS;
  const stepDone = [pathSolved, spacing?.ok === true, confirmed, confirmed, confirmed];
  const currentStep = stepDone.findIndex((d) => !d);

  const artW = Math.max(160, width);
  const artH = Math.round((artW * VB_H) / VB_W);

  return (
    <View style={{ gap: 14 }}>
      {/* view toggle — the owner-spec visibility feature */}
      <View style={lessonStyles.chipWrap}>
        <OptionChip
          label="ABOVE CEILING"
          active={above}
          onPress={() => {
            setView('above');
            say('Above ceiling view.');
          }}
        />
        <OptionChip
          label="FINISHED VIEW"
          active={!above}
          onPress={() => {
            setView('finished');
            say('Finished view. From the room, none of the overhead work is visible.');
          }}
        />
      </View>

      <View style={{ width: artW, height: artH }}>
        {/* the cutaway is always mounted — the toggle is a reveal, not a swap */}
        <AboveSvg
          w={artW}
          above={above}
          rv={rv}
          found={found}
          hooks={hooks}
          showTicks={pathSolved && !confirmed}
          confirmed={confirmed}
          fromArr={fromArr}
          toArr={toArr}
          settleK={settleK}
          restD={restD}
          strain={strain}
          pulseDefects={above && !fired}
          runTint={spacing?.ok ? '#c77dff' : '#9a6fd6'}
        />
        <Animated.View
          style={[StyleSheet.absoluteFill, shellStyle]}
          pointerEvents="none"
          accessibilityElementsHidden={above}
          importantForAccessibility={above ? 'no-hide-descendants' : 'auto'}
        >
          <FinishedShellSvg w={artW} />
        </Animated.View>
        <Animated.View
          style={[StyleSheet.absoluteFill, ceilingStyle]}
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <FinishedCeilingSvg w={artW} rv={rv} above={above} />
        </Animated.View>
        {/* ≥44dp tap overlays for the defect markers */}
        {above
          ? CI_CEILING_DEFECTS.map((d, i) => {
              const isFound = found.has(d.id);
              return (
                <Pressable
                  key={d.id}
                  onPress={() => find(d.id)}
                  disabled={isFound}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: isFound }}
                  accessibilityLabel={isFound ? `Found: ${d.label}` : `Suspect detail ${i + 1} of ${CI_CEILING_DEFECTS.length}`}
                  style={{
                    position: 'absolute',
                    left: (d.x / 100) * artW - 22,
                    top: (d.y / 100) * artH - 22,
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                  }}
                />
              );
            })
          : null}
      </View>
      <Text style={styles.legend}>
        {above
          ? 'Deck + joists · hanger wires · duct · sprinkler main (with heads) · conduit · tray · J-hooks · light · grid + tiles.'
          : 'Clean. Silent. And carrying every one of those violations — which is exactly why above-ceiling work gets skipped, and why inspectors lift tiles.'}
      </Text>

      {/* EXERCISE 1 — FIND THE PROBLEMS */}
      <CiSection title="EXERCISE 1 · FIND THE PROBLEMS">
        <Text style={styles.lead}>
          A previous contractor was up here. Eight details are wrong — tap the marked areas (or use the suspect list).
        </Text>
        <FindProgress found={foundShown} required={FIND_REQUIRED} total={CI_CEILING_DEFECTS.length} />
        {lastDefect && lastMistake ? (
          <Appear key={lastDefect.id}>
            <View style={{ gap: 6 }}>
              <Text style={styles.foundLine}>FOUND — {lastDefect.label}</Text>
              <RuleFeedback ruleId={lastMistake.ruleId} verdict="bad" short={lastMistake.shortFeedback} openSources={openSources} />
            </View>
          </Appear>
        ) : null}
        <OptionChip
          label={listOpen ? '▾ SUSPECT LIST (ACCESSIBLE ALTERNATIVE)' : '▸ SUSPECT LIST (ACCESSIBLE ALTERNATIVE)'}
          active={listOpen}
          onPress={() => setListOpen((o) => !o)}
        />
        {listOpen ? (
          <View style={{ gap: 6 }}>
            {CI_CEILING_DEFECTS.map((d, i) => {
              const isFound = found.has(d.id);
              return (
                <Stagger key={d.id} index={i}>
                  <Pressable
                    onPress={() => find(d.id)}
                    disabled={isFound}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: isFound }}
                    accessibilityLabel={`${d.label}${isFound ? ', found' : ''}`}
                    style={[styles.suspectRow, isFound && styles.suspectRowFound]}
                  >
                    <Text style={[styles.suspectText, isFound && { color: colors.green }]}>
                      {isFound ? '✓ ' : '□ '}
                      {d.label}
                    </Text>
                  </Pressable>
                </Stagger>
              );
            })}
          </View>
        ) : null}
        {!ex1Done ? (
          <OptionChip
            label={found.size >= FIND_REQUIRED ? 'CONTINUE TO THE INSTALL ›' : `FIND ${FIND_REQUIRED - found.size} MORE TO CONTINUE`}
            action
            disabled={found.size < FIND_REQUIRED}
            onPress={() => {
              setEx1Done(true);
              say('Exercise two: install the route.');
            }}
          />
        ) : null}
      </CiSection>

      {/* EXERCISE 2 — INSTALL THE ROUTE */}
      {ex1Done ? (
        <Appear>
          <CiSection title="EXERCISE 2 · INSTALL THE ROUTE">
            <Text style={styles.lead}>
              Now do it right: a new bundle from the equipment room to the far wall. First, the ritual — the SYSTEM’s
              criteria are supplied, never folklore:
            </Text>
            <SpecCard text={CI_SUPPORT_SPACING_SPEC} />
            <View style={{ gap: 4 }}>
              {steps.map((s, i) => (
                <Stagger key={s} index={i}>
                  <Text style={[styles.stepLine, stepDone[i] && { color: colors.green }, i === currentStep && { color: colors.amber }]}>
                    {stepDone[i] ? '✓' : i === currentStep ? '▸' : '·'} {s}
                  </Text>
                </Stagger>
              ))}
            </View>

            {/* step 1 — pathway */}
            <Text style={styles.qLabel}>1 · PICK THE PATHWAY / SUPPORT:</Text>
            <View style={{ gap: 7 }}>
              {PATH_OPTS.map((o, i) => (
                <Stagger key={o.id} index={i}>
                  <OptionChip label={o.label} active={pathPick === o.id} disabled={pathSolved && pathPick !== o.id} onPress={() => pickPath(o)} />
                </Stagger>
              ))}
            </View>
            {pathOpt ? (
              <Appear key={pathOpt.id}>
                <RuleFeedback ruleId="ceil-independent-support" verdict={pathOpt.good ? 'good' : 'bad'} short={pathOpt.short} openSources={openSources} />
              </Appear>
            ) : null}

            {/* step 2 — supports to the supplied spec */}
            {pathSolved ? (
              <Appear>
                <View style={{ gap: 8 }}>
                  <Text style={styles.qLabel}>2 · PLACE J-HOOKS ON THE 12-UNIT SPAN:</Text>
                  <Text style={styles.hint}>
                    Tap unit positions to place hooks — watch the run re-settle. The tray end (U0) and the wall sleeve
                    (U12) already count as supports.
                  </Text>
                  <View style={lessonStyles.chipWrap}>
                    {HOOK_SLOTS.map((u) => (
                      <OptionChip key={u} label={`U${u}`} active={hooks.has(u)} disabled={confirmed} onPress={() => toggleHook(u)} />
                    ))}
                  </View>
                  {!confirmed ? <OptionChip label={`CHECK SPACING (${hooks.size} placed)`} action onPress={checkSpacing} /> : null}
                  {spacing ? (
                    <Appear key={spacing.ok ? 'ok' : `no-${spacing.maxGap}`}>
                      <RuleFeedback
                        ruleId="ceil-span-sag"
                        verdict={spacing.ok ? 'good' : 'bad'}
                        short={
                          spacing.ok
                            ? `Every span is ${SPEC_MAX_GAP} units or less — the run meets the supplied system spec.`
                            : `Widest span is ${spacing.maxGap} units — the supplied spec says a support every ${SPEC_MAX_GAP}. Real cable would sag past the limit there.`
                        }
                        openSources={openSources}
                      />
                    </Appear>
                  ) : null}
                  {spacing?.extra ? (
                    <Text style={styles.hint}>More hardware than the spec needs — compliant, but every extra hook is cost and congestion.</Text>
                  ) : null}
                </View>
              </Appear>
            ) : null}

            {/* step 3 — confirm: the bundle installs itself */}
            {spacing?.ok && !confirmed ? (
              <Appear delay={CI_MOTION.quick}>
                <OptionChip label="CONFIRM THE ROUTE ✓" action onPress={confirmRoute} />
              </Appear>
            ) : null}
            {confirmed ? (
              <Appear delay={CI_MOTION.settle}>
                <RuleFeedback
                  ruleId="ceil-maintain-access"
                  verdict="good"
                  short="Honest sag inside the given spec, gentle bends, clear of the sprinkler, the duct and the light — and it enters the wall through a bushed sleeve. Every tile still lifts; the next technician can reach all of it."
                  openSources={openSources}
                />
              </Appear>
            ) : null}
          </CiSection>
        </Appear>
      ) : null}

      {fired ? (
        <Appear delay={CI_MOTION.quick}>
          <View style={styles.doneCard}>
            <Text style={styles.doneHead}>✓ STAGE 8 COMPLETE</Text>
            <Text style={styles.doneBody}>
              You found {found.size} of {CI_CEILING_DEFECTS.length} violations, then installed the route the professional
              way: independent supports from structure, spaced to the supplied system’s criteria — flip to FINISHED VIEW
              and remember that all of this rides above every clean ceiling.
            </Text>
          </View>
        </Appear>
      ) : null}

      <Text style={styles.tintNote}>
        Training visualization — colors identify systems and classes here (sprinkler red, existing runs cyan/green, your
        bundle violet); actual field colors vary.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  lead: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSecondary },
  legend: { fontFamily: fonts.barlowRegular, fontSize: 11.5, lineHeight: 15.5, color: colors.textSub },
  foundLine: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 0.8, color: colors.textPrimary },
  suspectRow: {
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  suspectRowFound: { borderColor: 'rgba(55,224,95,.4)' },
  suspectText: { fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 18, color: colors.textSecondary },
  qLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 1, color: colors.amberLabel, marginTop: 2 },
  hint: { fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16.5, color: colors.textSub, fontStyle: 'italic' },
  stepLine: { fontFamily: fonts.barlowMedium, fontSize: 12.5, lineHeight: 18, color: colors.textSub },
  doneCard: { gap: 6, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(55,224,95,.5)', backgroundColor: '#0c1a10', padding: 12 },
  doneHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.4, color: colors.green },
  doneBody: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18.5, color: colors.textSecondary },
  tintNote: { fontFamily: fonts.barlowRegular, fontSize: 11.5, lineHeight: 16, color: colors.textSub, fontStyle: 'italic' },
});
