/**
 * STAGE 7 — Wall & Surface Installations (spec §31).
 *
 * Four short scenarios on ONE room elevation (rack, wall device, baseboard
 * raceway, doorway, an unfinished opening):
 *   S1 pick the raceway route to the wall device,
 *   S2 three wall penetrations in sequence — the UNKNOWN wall is the critical
 *      one: VERIFY BEFORE PENETRATING, never drill-first,
 *   S3 the active doorway in both time-frames (temporary event vs permanent),
 *   S4 the raw-edge fix at the unfinished opening.
 * An X-RAY toggle reveals the in-wall portions of routes (dashed→solid) — and
 * demonstrates that geometry alone can never reveal a fire rating.
 *
 * MOTION (owner 2026-08-24 — the scene used to be a slide deck):
 *   • the CHOSEN route installs itself along its path; rejected routes fade
 *     back to candidate ghosts,
 *   • X-RAY is a CROSS-DISSOLVE — the cavity washes in, studs arrive on a
 *     stagger, and every concealed run DRAWS through the wall solid while its
 *     dashed ghost fades out (the wall becomes transparent; nothing swaps),
 *   • wall markers ①②③ breathe on their OWN phases until answered, then
 *     spring home; the rated assembly's hatch breathes faintly while it is the
 *     live question (danger, quietly),
 *   • the threshold protector DROPS IN with mass and the pinched cable RELAXES
 *     out of its kink on a spring — the relief IS the lesson,
 *   • the bushing straightens the folded exit with a spring and the green ring
 *     settles in: before/after in one motion.
 * All primitive-prop animation (see motion.tsx's hard-won react-native-svg
 * rule) — nothing here animates a transform on an SVG node.
 *
 * Completion: all four scenarios answered correctly (wrong picks can be
 * corrected; they cost score) → onComplete({ safety, protection, routing }),
 * fired once. Accessibility: labeled ≥44dp buttons only (no drag, no
 * color-only state), verdicts announced, replay via `completed`; reduced
 * motion collapses every duration to 0 with identical end states. The SVG is a
 * training visualization: honest geometry, terminated runs, gentle bends on
 * everything correct.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
/** Type-only: the motion kit re-exports the hooks, not the SharedValue type. */
import type { SharedValue } from 'react-native-reanimated';
import { colors, fonts } from '../../../../theme/tokens';
import { OptionChip, lessonStyles } from '../../cable/lessons/bits';
import { CiSection, RuleFeedback, announceComplete } from '../bits';
import { CI_WALL_TYPES } from '../data/scenarios';
import { clamp100 } from '../engine/score';
import {
  ACircle,
  AG,
  ALine,
  APath,
  ARect,
  Appear,
  CI_EASE,
  CI_MOTION,
  CI_SPRING,
  CI_SPRING_UI,
  Stagger,
  cancelAnimation,
  mapRange,
  useAnimatedProps,
  useCiMotion,
  useDrawIn,
  useSettle,
  useSharedValue,
  useTween,
  withDelay,
  withRepeat,
  withTiming,
} from '../motion';
import type { CiModuleProps } from '../registry';

/* ── scenario option data (rules referenced by id; specs stay in data) ──── */
type RouteId = 'a' | 'b' | 'c';

const S1_ROUTES: { id: RouteId; label: string; good: boolean; ruleId: string; short: string }[] = [
  {
    id: 'a',
    label: 'A — Baseboard raceway with fittings to the device',
    good: true,
    ruleId: 'wall-raceway-fill-transitions',
    short: 'Raceway with capacity, a fitting at every transition, and a clean riser to the plate — protected and serviceable.',
  },
  {
    id: 'b',
    label: 'B — Diagonal straight across the open wall',
    good: false,
    ruleId: 'wall-raceway-fill-transitions',
    short: 'An exposed diagonal across a finished wall: no pathway, no protection, and workmanship that invites damage.',
  },
  {
    id: 'c',
    label: 'C — Along the floor and through the doorway',
    good: false,
    ruleId: 'wall-doorway',
    short: 'Through the door gap — that door will pinch this cable on every one of its thousands of cycles.',
  },
];

/** Correct-pick one-liners for the three wall types (wrong picks fall back to
 *  the rule's studentText). */
const WALL_GOOD_SHORT: Record<string, string> = {
  'w-ordinary': 'Verified non-rated from the drawings — sleeve and bushing the opening, then route through.',
  'w-rated': 'The listed penetration/firestop system matched to THIS assembly — never generic caulk, never "later."',
  'w-unknown': 'Stop and VERIFY. Drilling is the one step you can never take back — unknown assembly means no drill.',
};

const S3_TEMP: { id: string; label: string; good: boolean; short: string }[] = [
  { id: 'protect', label: 'Protect the crossing with a proper threshold solution', good: true, short: 'Temporary changes the solutions, not the standard of care — a suitable threshold protector keeps the door and the cable working.' },
  { id: 'wedge', label: 'Wedge the door open for the event', good: false, short: 'Now the DOOR is defeated — possibly a fire door. The cable problem became a life-safety problem.' },
  { id: 'ride', label: 'Let the door close on it — it is only two days', good: false, short: 'A door cycles thousands of times. Two days of pinching is real damage, and workplace rules apply to temporary work too.' },
];

const S3_PERM: { id: string; label: string; good: boolean; short: string }[] = [
  { id: 'reroute', label: 'Reroute through a building pathway', good: true, short: 'Permanent runs live in pathways. The doorway stops being part of the route at all.' },
  { id: 'keep', label: 'Keep it through the doorway — it has been fine', good: false, short: '"Fine so far" is how intermittent faults are born. Permanent runs never fight doors.' },
  { id: 'cord', label: 'Staple flexible cord around the frame as the permanent feed', good: false, short: 'Flexible cord is not permanent building wiring — permanent runs use approved wiring in a pathway.' },
];

const S4_OPTS: { id: string; label: string; good: boolean; short: string }[] = [
  { id: 'bushing', label: 'Install a bushing / grommet on the opening', good: true, short: 'A finished edge before the cable — pennies now instead of a re-pull later.' },
  { id: 'tape', label: 'Wrap the edge in tape and move on', good: false, short: 'Tape creeps, dries and quits. The raw edge is still there, abrading with every micro-movement.' },
  { id: 'leave', label: 'Leave it — the jacket looks fine today', good: false, short: 'Edge damage is cumulative and invisible until failure. Today\'s "fine" is next year\'s intermittent.' },
];

/* ── the room elevation (training visualization) ────────────────────────── */
const VB_W = 360;
const VB_H = 200;

/* ── scene-local motion helpers ─────────────────────────────────────────── */

/**
 * Breathing driver with its OWN phase — markers must never pulse in unison
 * (owner 2026-08-24). Silent when `run` is false and under reduced motion.
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

/**
 * Every animated node carries a CONSTANT rest pose (its mount value). React
 * skips unchanged props, so a re-render mid-animation can never re-commit a
 * static value over the in-flight native one.
 */
function useRest<T>(v: T): T {
  return useRef(v).current;
}

/** motion.tsx types useSettle's `spring` option as CI_SPRING's literal shape,
 *  so the snappier furniture spring needs one cast to get through. */
const SPRING_UI = CI_SPRING_UI as unknown as typeof CI_SPRING;

/** Group opacity that eases to its target — route emphasis, x-ray layers.
 *  <G opacity> is a plain prop, so this animates through the native path. */
function FadeGroup({ to, duration = CI_MOTION.base, children }: { to: number; duration?: number; children: ReactNode }) {
  const t = useTween(to, duration);
  const rest = useRest(to);
  const p = useAnimatedProps(() => ({ opacity: t.value }));
  return (
    <AG opacity={rest} animatedProps={p}>
      {children}
    </AG>
  );
}

/** A run that installs itself along its path. Mounted the moment its route is
 *  chosen, so the draw starts on the tap. */
function InstalledRun({
  d,
  len,
  color,
  width,
  delay = 0,
}: {
  d: string;
  len: number;
  color: string;
  width: number;
  delay?: number;
}) {
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

/**
 * The concealed (in-wall) portion of a run. Off x-ray it is a dashed ghost;
 * as the x-ray comes up the ghost fades while a SOLID copy draws itself
 * through the wall — one continuous cross-dissolve, reversible, and instant
 * under reduced motion (the tween duration collapses to 0).
 */
function ConcealedRun({ d, len, color, width, xr }: { d: string; len: number; color: string; width: number; xr: SharedValue<number> }) {
  const ghost = useAnimatedProps(() => ({ opacity: 0.75 * (1 - xr.value) }));
  const solid = useAnimatedProps(() => ({
    strokeDashoffset: len * (1 - mapRange(xr.value, 0.1, 0.95, 0, 1)),
    opacity: mapRange(xr.value, 0, 0.25, 0, 1),
  }));
  return (
    <>
      <APath d={d} stroke={color} strokeWidth={width} fill="none" strokeDasharray="3 4" opacity={0.75} animatedProps={ghost} />
      <APath
        d={d}
        stroke={color}
        strokeWidth={width + 1}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={len}
        strokeDashoffset={len}
        opacity={0}
        animatedProps={solid}
      />
    </>
  );
}

/** One x-ray stud, arriving on its own beat off the shared x-ray driver. */
function Stud({ x, index, xr }: { x: number; index: number; xr: SharedValue<number> }) {
  const p = useAnimatedProps(() => ({ opacity: mapRange(xr.value, index * 0.045, index * 0.045 + 0.5, 0, 1) }));
  return <ALine x1={x} y1={16} x2={x} y2={160} stroke="#2e2e36" strokeWidth={2} strokeDasharray="5 5" opacity={0} animatedProps={p} />;
}

/** Wall marker ①②③ — breathes while unanswered, springs home when answered. */
function WallMarker({ x, y, index, pending, answered, tint }: { x: number; y: number; index: number; pending: boolean; answered: boolean; tint: string }) {
  const breath = useBreath({ run: pending, period: 1420 + (index % 3) * 200, delay: index * 260 });
  const k = useSettle(answered ? 1 : 0, { spring: SPRING_UI });
  const restRing = useRest(pending ? 0.5 : 0);
  const ring = useAnimatedProps(() => ({ r: 9 + 7 * breath.value, opacity: 0.5 * (1 - breath.value) }));
  const core = useAnimatedProps(() => ({ r: 9 + 1.4 * k.value }));
  return (
    <>
      <ACircle cx={x} cy={y} r={9} fill="none" stroke={tint} strokeWidth={1.4} opacity={restRing} animatedProps={ring} />
      <ACircle cx={x} cy={y} r={9} fill="#101014" stroke={tint} strokeWidth={1.6} animatedProps={core} />
      <SvgText x={x} y={y + 3.5} fill={tint} fontSize={10} fontFamily={fonts.oswaldSemiBold} textAnchor="middle">
        {String(index + 1)}
      </SvgText>
    </>
  );
}

/** The rated assembly breathes faintly while it is the live question. */
function RatedZone({ active }: { active: boolean }) {
  const breath = useBreath({ run: active, period: 2000 });
  const p = useAnimatedProps(() => ({ opacity: active ? 0.06 + 0.16 * breath.value : 0 }));
  return (
    <>
      <Rect x={232} y={54} width={30} height={104} fill="rgba(255,90,72,.05)" stroke="rgba(255,90,72,.35)" strokeWidth={1} strokeDasharray="4 4" />
      <ARect x={232} y={54} width={30} height={104} fill="#ff5a48" opacity={0} animatedProps={p} />
    </>
  );
}

/** The threshold protector, dropped in with mass (CI_EASE.physical overshoots,
 *  so it presses into the floor a hair before settling). */
const protectorD = (dy: number) => {
  'worklet';
  return `M280 ${(167 - dy).toFixed(2)} L288 ${(160 - dy).toFixed(2)} L304 ${(160 - dy).toFixed(2)} L312 ${(167 - dy).toFixed(2)} Z`;
};

function Protector({ on }: { on: boolean }) {
  const m = useCiMotion();
  const t = useSharedValue(on ? 1 : 0);
  useEffect(() => {
    cancelAnimation(t);
    if (m.reduce) {
      t.value = on ? 1 : 0;
      return;
    }
    t.value = withTiming(on ? 1 : 0, { duration: CI_MOTION.settle, easing: CI_EASE.physical });
    return () => cancelAnimation(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on, m.reduce]);
  const rest = useRest(on ? 0.9 : 0);
  const p = useAnimatedProps(() => ({
    d: protectorD((1 - t.value) * 26),
    opacity: Math.min(0.9, t.value * 2.2),
  }));
  return <APath d={protectorD(0)} fill={colors.amber} opacity={rest} animatedProps={p} />;
}

/**
 * The doorway crossing. Pinched (k=1) it is a hard, thin kink jammed at the
 * door edge; relieved (k=0) it is a broad gentle radius riding the protector
 * channel. One spring carries every control point AND the jacket thickness —
 * the cable visibly recovers.
 */
const DOOR_PINCH = [266, 280, 167, 285, 167, 290, 161.6, 294, 159.4, 297, 167, 314] as const;
const DOOR_RELIEF = [262, 272, 166.4, 278, 163.9, 290, 163.4, 302, 163.9, 308, 166.4, 316] as const;

const doorD = (k: number) => {
  'worklet';
  const v = (i: number) => (DOOR_RELIEF[i] + (DOOR_PINCH[i] - DOOR_RELIEF[i]) * k).toFixed(1);
  return `M${v(0)} 167 C${v(1)} ${v(2)} ${v(3)} ${v(4)} ${v(5)} ${v(6)} C${v(7)} ${v(8)} ${v(9)} ${v(10)} ${v(11)} 167`;
};

function DoorCrossing({ relieved, active }: { relieved: boolean; active: boolean }) {
  const k = useSettle(relieved ? 0 : 1, { spring: CI_SPRING });
  const breath = useBreath({ run: active && !relieved, period: 1250 });
  const rest = useRest(relieved ? 0 : 1);
  const run = useAnimatedProps(() => ({ d: doorD(k.value), strokeWidth: 3.1 - k.value }));
  const stress = useAnimatedProps(() => ({ opacity: k.value * (0.55 + 0.45 * breath.value) }));
  return (
    <>
      <APath d={doorD(rest)} stroke="#37d97b" strokeWidth={3.1 - rest} fill="none" strokeLinecap="round" animatedProps={run} />
      <APath d="M285 157.6 L290 153.6 L295 157.6" stroke="#ff5a48" strokeWidth={1.6} fill="none" opacity={rest} animatedProps={stress} />
    </>
  );
}

/**
 * The unfinished opening's exit. Kinked (k=1) the run folds hard over the raw
 * edge; bushed (k=0) it straightens into a gentle radius on a spring while the
 * green bushing ring settles in — the whole before/after in one motion.
 */
const EDGE_KINK = [150.3, 77.2, 151, 78, 151, 79.6] as const;
const EDGE_BUSH = [152.6, 77.6, 154, 80.5, 154, 86] as const;

const edgeD = (k: number) => {
  'worklet';
  const v = (i: number) => (EDGE_BUSH[i] + (EDGE_KINK[i] - EDGE_BUSH[i]) * k).toFixed(1);
  return `M150 76 C${v(0)} ${v(1)} ${v(2)} ${v(3)} ${v(4)} ${v(5)} L${v(4)} 150`;
};

function EdgeExit({ bushed, active }: { bushed: boolean; active: boolean }) {
  const k = useSettle(bushed ? 0 : 1, { spring: CI_SPRING });
  const ring = useSettle(bushed ? 1 : 0, { spring: SPRING_UI });
  const breath = useBreath({ run: active && !bushed, period: 1350, delay: 120 });
  const rest = useRest(bushed ? 0 : 1);
  const run = useAnimatedProps(() => ({ d: edgeD(k.value) }));
  const stress = useAnimatedProps(() => ({ opacity: k.value * (0.6 + 0.4 * breath.value) }));
  const bush = useAnimatedProps(() => ({ r: 5.5 * ring.value, opacity: Math.min(1, ring.value * 1.6) }));
  return (
    <>
      <APath d={edgeD(rest)} stroke="#4fd0e0" strokeWidth={3} fill="none" strokeLinecap="round" animatedProps={run} />
      <APath d="M146 71 L151 77 L157 73" stroke="#ff5a48" strokeWidth={1.6} fill="none" opacity={rest} animatedProps={stress} />
      <ACircle cx={151} cy={77} r={5.5 * (1 - rest)} fill="none" stroke={colors.green} strokeWidth={2} opacity={1 - rest} animatedProps={bush} />
    </>
  );
}

/* ── the room elevation ─────────────────────────────────────────────────── */
function RoomSvg({
  w,
  xray,
  routePick,
  wallIdx,
  wallsActive,
  protectorOn,
  bushed,
  doorActive,
  edgeActive,
}: {
  w: number;
  xray: boolean;
  routePick: RouteId | null;
  wallIdx: number;
  wallsActive: boolean;
  protectorOn: boolean;
  bushed: boolean;
  doorActive: boolean;
  edgeActive: boolean;
}) {
  const h = Math.round((w * VB_H) / VB_W);
  /** ONE driver for the whole x-ray cross-dissolve. */
  const xr = useTween(xray ? 1 : 0, CI_MOTION.reveal);
  const cavity = useAnimatedProps(() => ({ opacity: mapRange(xr.value, 0, 0.6, 0, 1) }));
  /** Rejected routes fade back to candidate ghosts — EXCEPT route C once the
   *  doorway scenario takes the stage: the pinch and its relief happen on that
   *  crossing, so it comes back up to be watched. */
  const emph = (id: RouteId) => {
    if (id === 'c' && (doorActive || protectorOn)) return 0.95;
    return routePick == null ? 0.8 : routePick === id ? 1 : 0.26;
  };
  const markerTint = (i: number) => (i < wallIdx ? colors.green : wallsActive && i === wallIdx ? colors.amber : '#55555e');
  return (
    <Svg
      width={w}
      height={h}
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      accessibilityLabel={`Room elevation: equipment rack at left, wall device mid-wall, unfinished opening above it, doorway at right. Three candidate routes A, B, C and three numbered wall zones. X-ray ${xray ? 'on' : 'off'}.`}
    >
      <Rect x={2} y={6} width={356} height={186} rx={10} fill="#15151a" stroke="#26262c" strokeWidth={1.5} />

      {/* X-RAY: the wall becomes transparent — cavity wash, then studs on a
          stagger. Always mounted so this is a dissolve, never a slide swap. */}
      <ARect x={4} y={14} width={352} height={150} fill="rgba(79,208,224,.045)" opacity={0} animatedProps={cavity} />
      {[84, 104, 128, 152, 176, 200, 232, 256, 340].map((x, i) => (
        <Stud key={x} x={x} index={i} xr={xr} />
      ))}

      {/* floor + baseboard */}
      <Rect x={2} y={162} width={356} height={8} fill="#1b1b21" />
      <Line x1={2} y1={170} x2={358} y2={170} stroke="#2c2c33" strokeWidth={2} />
      <Rect x={2} y={170} width={356} height={22} fill="#0e0e11" />

      {/* rack (left) */}
      <Rect x={16} y={58} width={54} height={112} fill="#101014" stroke="#3a3c42" strokeWidth={1.4} />
      <Line x1={24} y1={62} x2={24} y2={166} stroke="#26262c" strokeWidth={1.5} />
      <Line x1={62} y1={62} x2={62} y2={166} stroke="#26262c" strokeWidth={1.5} />
      {[74, 90, 106, 122, 138, 154].map((y) => (
        <Line key={y} x1={24} y1={y} x2={62} y2={y} stroke="#26262c" strokeWidth={1} />
      ))}
      <Rect x={26} y={76} width={32} height={10} rx={1.5} fill="#17171c" stroke="#33333c" strokeWidth={0.8} />
      <Rect x={26} y={124} width={32} height={10} rx={1.5} fill="#17171c" stroke="#33333c" strokeWidth={0.8} />
      <Circle cx={55} cy={81} r={1.6} fill={colors.amber} />

      {/* wall device (destination plate) */}
      <Rect x={206} y={108} width={18} height={26} rx={2} fill="#17171c" stroke="#6f7378" strokeWidth={1.2} />
      <Circle cx={215} cy={117} r={3} fill="none" stroke="#4fd0e0" strokeWidth={1.4} />
      <Circle cx={215} cy={128} r={1.2} fill="#55555e" />

      {/* rated-wall zone (scenario 2, wall 2) + unknown zone (wall 3) */}
      <RatedZone active={wallsActive && wallIdx === 1} />
      <Rect x={328} y={54} width={26} height={104} fill="rgba(255,255,255,.02)" stroke="#3a3a44" strokeWidth={1} strokeDasharray="4 4" />
      <SvgText x={341} y={120} fill="#6f7378" fontSize={15} fontFamily={fonts.oswaldSemiBold} textAnchor="middle">
        ?
      </SvgText>

      {/* doorway (right): jambs, header, ajar slab with a gap beneath */}
      <Rect x={268} y={42} width={56} height={10} fill="#26262c" />
      <Rect x={268} y={50} width={6} height={120} fill="#26262c" />
      <Rect x={318} y={50} width={6} height={120} fill="#26262c" />
      <Path d="M276 50 L312 56 L312 160 L276 166 Z" fill="#191920" stroke="#33333c" strokeWidth={1.2} />
      <Circle cx={306} cy={110} r={2} fill="#6f7378" />

      {/* unfinished opening + its exiting cable (scenario 4) */}
      <Path d="M132 62 L149 58 L156 66 L153 78 L138 82 L130 72 Z" fill="#0b0b0e" stroke="#55555e" strokeWidth={1.3} />
      <ConcealedRun d="M138 70 L150 76" len={14} color="#4fd0e0" width={2.5} xr={xr} />
      <EdgeExit bushed={bushed} active={edgeActive} />

      {/* ROUTE A — baseboard raceway + fittings + in-wall riser to the plate */}
      <FadeGroup to={emph('a')}>
        <Rect x={70} y={152} width={144} height={10} rx={2} fill="#101014" stroke="#4fd0e0" strokeWidth={1.4} />
        <Rect x={66} y={150} width={8} height={14} rx={1.5} fill="#17171c" stroke="#4fd0e0" strokeWidth={1.2} />
        <Rect x={208} y={148} width={12} height={16} rx={2} fill="#17171c" stroke="#4fd0e0" strokeWidth={1.2} />
        {/* candidate ghost, then the install draws over it on the tap */}
        <Line x1={76} y1={157} x2={206} y2={157} stroke="#4fd0e0" strokeWidth={1.4} opacity={0.5} />
        {routePick === 'a' ? <InstalledRun d="M76 157 H206" len={130} color="#4fd0e0" width={2.4} /> : null}
        {/* the riser is IN the wall — concealed until the x-ray comes up */}
        <ConcealedRun d="M215 150 L215 134" len={16} color="#4fd0e0" width={2} xr={xr} />
        <Circle cx={140} cy={157} r={8} fill="#101014" stroke="#4fd0e0" strokeWidth={1.4} />
        <SvgText x={140} y={160.5} fill="#4fd0e0" fontSize={9} fontFamily={fonts.oswaldSemiBold} textAnchor="middle">
          A
        </SvgText>
      </FadeGroup>

      {/* ROUTE B — diagonal surface run across the open wall */}
      <FadeGroup to={emph('b')}>
        <Path d="M70 64 Q140 88 206 112" stroke="#ffd35e" strokeWidth={1.6} fill="none" strokeLinecap="round" opacity={0.5} />
        {routePick === 'b' ? <InstalledRun d="M70 64 Q140 88 206 112" len={152} color="#ffd35e" width={4} /> : null}
        <Circle cx={128} cy={84} r={8} fill="#101014" stroke="#ffd35e" strokeWidth={1.4} />
        <SvgText x={128} y={87.5} fill="#ffd35e" fontSize={9} fontFamily={fonts.oswaldSemiBold} textAnchor="middle">
          B
        </SvgText>
      </FadeGroup>

      {/* ROUTE C — floor run through the doorway gap (continues off-room) */}
      <FadeGroup to={emph('c')}>
        <Path d="M70 167 H266" stroke="#37d97b" strokeWidth={1.6} fill="none" strokeLinecap="round" opacity={0.5} />
        {routePick === 'c' ? <InstalledRun d="M70 167 H266" len={196} color="#37d97b" width={3.4} /> : null}
        <DoorCrossing relieved={protectorOn} active={doorActive} />
        <Path d="M316 167 L344 167" stroke="#37d97b" strokeWidth={2.5} fill="none" strokeDasharray="4 4" />
        <Path d="M344 163 L352 167 L344 171 Z" fill="#37d97b" />
        <Circle cx={250} cy={167} r={8} fill="#101014" stroke="#37d97b" strokeWidth={1.4} />
        <SvgText x={250} y={170.5} fill="#37d97b" fontSize={9} fontFamily={fonts.oswaldSemiBold} textAnchor="middle">
          C
        </SvgText>
      </FadeGroup>

      {/* scenario 3: the protector drops in over the crossing */}
      <Protector on={protectorOn} />

      {/* scenario 2 wall markers ① ② ③ */}
      {[110, 247, 341].map((x, i) => (
        <WallMarker
          key={x}
          x={x}
          y={96}
          index={i}
          pending={wallsActive && i >= wallIdx}
          answered={i < wallIdx}
          tint={markerTint(i)}
        />
      ))}
    </Svg>
  );
}

/* ── the scene ──────────────────────────────────────────────────────────── */
export function WallsScene({ width, completed, onComplete, openSources }: CiModuleProps) {
  const [xray, setXray] = useState(false);
  const [routePick, setRoutePick] = useState<RouteId | null>(completed ? 'a' : null);
  const [s1Solved, setS1Solved] = useState(completed);
  const [wallIdx, setWallIdx] = useState(completed ? CI_WALL_TYPES.length : 0);
  const [wallPick, setWallPick] = useState<string | null>(null);
  const [tempPick, setTempPick] = useState<string | null>(completed ? 'protect' : null);
  const [permPick, setPermPick] = useState<string | null>(completed ? 'reroute' : null);
  const [edgePick, setEdgePick] = useState<string | null>(completed ? 'bushing' : null);
  const [fired, setFired] = useState(completed);
  const wrongs = useRef({ s1: 0, s2: 0, s3: 0, s4: 0 });

  const say = (t: string) => AccessibilityInfo.announceForAccessibility(t);

  const s2Done = wallIdx >= CI_WALL_TYPES.length;
  const tempOk = tempPick === 'protect';
  const permOk = permPick === 'reroute';
  const s3Done = tempOk && permOk;
  const s4Done = edgePick === 'bushing';
  const allDone = s1Solved && s2Done && s3Done && s4Done;

  useEffect(() => {
    if (fired || !allDone) return;
    setFired(true);
    announceComplete('Stage 7 complete.');
    onComplete({
      safety: clamp100(100 - 12 * (wrongs.current.s2 + wrongs.current.s3)),
      protection: clamp100(100 - 12 * (wrongs.current.s1 + wrongs.current.s4)),
      routing: clamp100(100 - 10 * (wrongs.current.s1 + wrongs.current.s2)),
    });
  }, [allDone, fired, onComplete]);

  /* S1 */
  const pickedRoute = routePick ? S1_ROUTES.find((r) => r.id === routePick) : undefined;
  const pickRoute = (r: (typeof S1_ROUTES)[number]) => {
    if (s1Solved) return;
    setRoutePick(r.id);
    if (r.good) setS1Solved(true);
    else wrongs.current.s1 += 1;
    say(`${r.good ? 'Correct.' : 'Not the professional route.'} ${r.short}`);
  };

  /* S2 */
  const wall = CI_WALL_TYPES[wallIdx];
  const wallRight = wall != null && wallPick === wall.correctAction;
  const pickWallAction = (action: string) => {
    if (!wall || wallRight) return;
    setWallPick(action);
    const right = action === wall.correctAction;
    if (!right) wrongs.current.s2 += 1;
    say(right ? `Correct. ${WALL_GOOD_SHORT[wall.id] ?? ''}` : 'Not the professional action for this wall.');
  };
  const nextWall = () => {
    setWallIdx((i) => i + 1);
    setWallPick(null);
  };

  /* S3 / S4 — shared pick handler over an option list */
  const pickFrom = (
    opts: { id: string; label: string; good: boolean; short: string }[],
    current: string | null,
    set: (id: string) => void,
    wrongKey: 's3' | 's4',
  ) => (id: string) => {
    const solved = opts.find((o) => o.id === current)?.good === true;
    if (solved) return;
    const o = opts.find((x) => x.id === id);
    if (!o) return;
    set(id);
    if (!o.good) wrongs.current[wrongKey] += 1;
    say(`${o.good ? 'Correct.' : 'Not quite.'} ${o.short}`);
  };
  const pickTemp = pickFrom(S3_TEMP, tempPick, setTempPick, 's3');
  const pickPerm = pickFrom(S3_PERM, permPick, setPermPick, 's3');
  const pickEdge = pickFrom(S4_OPTS, edgePick, setEdgePick, 's4');

  const tempOpt = S3_TEMP.find((o) => o.id === tempPick);
  const permOpt = S3_PERM.find((o) => o.id === permPick);
  const edgeOpt = S4_OPTS.find((o) => o.id === edgePick);

  const artW = Math.max(160, width);

  return (
    <View style={{ gap: 14 }}>
      {/* the one room, shared by all four scenarios */}
      <View style={{ gap: 8 }}>
        <View style={lessonStyles.chipWrap}>
          <OptionChip
            label={xray ? 'X-RAY WALL VIEW: ON' : 'X-RAY WALL VIEW: OFF'}
            active={xray}
            onPress={() => {
              setXray((v) => {
                say(v ? 'X-ray off.' : 'X-ray on. Studs and in-wall runs are visible — a fire rating still is not.');
                return !v;
              });
            }}
          />
        </View>
        <RoomSvg
          w={artW}
          xray={xray}
          routePick={routePick}
          wallIdx={wallIdx}
          wallsActive={s1Solved && !s2Done}
          protectorOn={tempOk}
          bushed={s4Done}
          doorActive={s2Done && !s3Done}
          edgeActive={s3Done && !s4Done}
        />
        <Text style={styles.legend}>
          Rack · route A (raceway) · route B (diagonal) · route C (doorway) · rough opening · wall zones ① ② ③
        </Text>
        {xray ? (
          <Appear>
            <Text style={styles.xrayNote}>
              X-ray shows geometry — studs and hidden runs. It cannot show a fire rating; only the drawings can. Remember
              that for scenario 2.
            </Text>
          </Appear>
        ) : null}
      </View>

      {/* S1 — SURFACE RACEWAY */}
      <CiSection title="1 · SURFACE RACEWAY — PICK THE ROUTE">
        <Text style={styles.lead}>
          A permanent line must get from the rack to the wall device. Three candidates are drawn — judge the whole life of
          the cable.
        </Text>
        <View style={{ gap: 7 }}>
          {S1_ROUTES.map((r, i) => (
            <Stagger key={r.id} index={i}>
              <OptionChip
                label={r.label}
                active={routePick === r.id}
                disabled={s1Solved && routePick !== r.id}
                onPress={() => pickRoute(r)}
              />
            </Stagger>
          ))}
        </View>
        {pickedRoute ? (
          <Appear key={pickedRoute.id}>
            <RuleFeedback
              ruleId={pickedRoute.ruleId}
              verdict={pickedRoute.good ? 'good' : 'bad'}
              short={pickedRoute.short}
              openSources={openSources}
            />
          </Appear>
        ) : null}
      </CiSection>

      {/* S2 — WALL PENETRATION (sequential wall types) */}
      {s1Solved ? (
        <Appear>
          <CiSection title="2 · WALL PENETRATION — WHAT KIND OF WALL IS THIS?">
            <Text style={styles.lead}>
              The route must pass through three walls (markers ① ② ③). The action follows the ASSEMBLY — one wall at a
              time.
            </Text>
            {CI_WALL_TYPES.slice(0, wallIdx).map((wSolved) => (
              <Text key={wSolved.id} style={styles.solvedLine}>
                ✓ {wSolved.label} — {wSolved.correctAction}
              </Text>
            ))}
            {wall ? (
              <View style={{ gap: 8 }}>
                <Text style={styles.wallLabel}>
                  WALL {wallIdx + 1} OF {CI_WALL_TYPES.length}: {wall.label}
                </Text>
                <View style={{ gap: 7 }}>
                  {wall.actions.map((a, i) => (
                    <Stagger key={a} index={i}>
                      <OptionChip
                        label={a}
                        active={wallPick === a}
                        disabled={wallRight && wallPick !== a}
                        onPress={() => pickWallAction(a)}
                      />
                    </Stagger>
                  ))}
                </View>
                {wallPick != null ? (
                  <Appear key={wallPick}>
                    <RuleFeedback
                      ruleId={wall.ruleId}
                      verdict={wallRight ? 'good' : 'bad'}
                      short={wallRight ? WALL_GOOD_SHORT[wall.id] : undefined}
                      openSources={openSources}
                    />
                  </Appear>
                ) : null}
                {wallRight ? (
                  <Appear delay={CI_MOTION.quick}>
                    <OptionChip
                      label={wallIdx + 1 < CI_WALL_TYPES.length ? 'NEXT WALL ›' : 'ALL WALLS ANSWERED ✓'}
                      action
                      onPress={nextWall}
                    />
                  </Appear>
                ) : null}
              </View>
            ) : (
              <Text style={styles.doneLine}>
                ✓ All three answered. The unknown wall is the one that matters most: verify BEFORE penetrating — never
                drill-first.
              </Text>
            )}
          </CiSection>
        </Appear>
      ) : null}

      {/* S3 — DOORWAY, both time-frames */}
      {s2Done ? (
        <Appear>
          <CiSection title="3 · THE DOORWAY — TWO TIME-FRAMES">
            <Text style={styles.lead}>
              A cable must get past the active doorway (route C showed the failure). The correct answer depends on how
              long it stays.
            </Text>
            <Text style={styles.qLabel}>TEMPORARY — a two-day event:</Text>
            <View style={{ gap: 7 }}>
              {S3_TEMP.map((o, i) => (
                <Stagger key={o.id} index={i}>
                  <OptionChip label={o.label} active={tempPick === o.id} disabled={tempOk && tempPick !== o.id} onPress={() => pickTemp(o.id)} />
                </Stagger>
              ))}
            </View>
            {tempOpt ? (
              <Appear key={tempOpt.id}>
                <RuleFeedback ruleId="wall-doorway" verdict={tempOpt.good ? 'good' : 'bad'} short={tempOpt.short} openSources={openSources} />
              </Appear>
            ) : null}
            <Text style={styles.qLabel}>PERMANENT — a system that stays:</Text>
            <View style={{ gap: 7 }}>
              {S3_PERM.map((o, i) => (
                <Stagger key={o.id} index={i}>
                  <OptionChip label={o.label} active={permPick === o.id} disabled={permOk && permPick !== o.id} onPress={() => pickPerm(o.id)} />
                </Stagger>
              ))}
            </View>
            {permOpt ? (
              <Appear key={permOpt.id}>
                <RuleFeedback ruleId="wall-doorway" verdict={permOpt.good ? 'good' : 'bad'} short={permOpt.short} openSources={openSources} />
              </Appear>
            ) : null}
          </CiSection>
        </Appear>
      ) : null}

      {/* S4 — SHARP EDGE at the unfinished opening */}
      {s3Done ? (
        <Appear>
          <CiSection title="4 · SHARP EDGE — THE UNFINISHED OPENING">
            <Text style={styles.lead}>
              A cable exits the rough opening above the device, folded hard over a raw edge. Pick the fix — the drawing
              corrects when you do.
            </Text>
            <View style={{ gap: 7 }}>
              {S4_OPTS.map((o, i) => (
                <Stagger key={o.id} index={i}>
                  <OptionChip label={o.label} active={edgePick === o.id} disabled={s4Done && edgePick !== o.id} onPress={() => pickEdge(o.id)} />
                </Stagger>
              ))}
            </View>
            {edgeOpt ? (
              <Appear key={edgeOpt.id}>
                <RuleFeedback ruleId="wall-bushings" verdict={edgeOpt.good ? 'good' : 'bad'} short={edgeOpt.short} openSources={openSources} />
              </Appear>
            ) : null}
          </CiSection>
        </Appear>
      ) : null}

      {fired ? (
        <Appear delay={CI_MOTION.quick}>
          <View style={styles.doneCard}>
            <Text style={styles.doneHead}>✓ STAGE 7 COMPLETE</Text>
            <Text style={styles.doneBody}>
              Route in a pathway, action matched to the assembly, doors never pinch, edges always finished — and the
              unknown wall answered the only professional way: verify before penetrating.
            </Text>
          </View>
        </Appear>
      ) : null}

      <Text style={styles.tintNote}>Training visualization — colors identify routes and classes here; actual field cable and hardware colors vary.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  lead: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSecondary },
  legend: { fontFamily: fonts.barlowRegular, fontSize: 11.5, lineHeight: 15.5, color: colors.textSub },
  xrayNote: { fontFamily: fonts.barlowMedium, fontSize: 12.5, lineHeight: 17, color: '#7fd4e0' },
  wallLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 0.8, color: colors.textPrimary, lineHeight: 18 },
  qLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 1, color: colors.amberLabel, marginTop: 2 },
  solvedLine: { fontFamily: fonts.barlowMedium, fontSize: 12.5, lineHeight: 17, color: colors.green },
  doneLine: { fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 18.5, color: colors.green },
  doneCard: { gap: 6, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(55,224,95,.5)', backgroundColor: '#0c1a10', padding: 12 },
  doneHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.4, color: colors.green },
  doneBody: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18.5, color: colors.textSecondary },
  tintNote: { fontFamily: fonts.barlowRegular, fontSize: 11.5, lineHeight: 16, color: colors.textSub, fontStyle: 'italic' },
});
