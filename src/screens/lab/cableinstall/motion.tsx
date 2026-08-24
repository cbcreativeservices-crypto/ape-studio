/**
 * Cable Dressing & Installation Lab — MOTION KIT (owner 2026-08-24: "it is
 * 2026", the lab shipped essentially static).
 *
 * The motion language, in one place, so all 13 scenes move like one product:
 *   DRAW    cable installs itself along its route (strokeDashoffset reveal)
 *   FLOW    a live run breathes signal (marching dash)
 *   SETTLE  physical things arrive with spring overshoot, never a snap
 *   PULSE   attention markers breathe until found
 *   STAGGER lists/cards enter in sequence, never all at once
 *   COUNT   numbers tick to their value
 *
 * ── THE HARD-WON RULE (cost three rebuilds on the Harmonograph, 2026-08-23) ──
 * react-native-svg TRANSFORM props (x/y, translateX/translateY, rotation, and
 * the `transform` prop on <G>) are extracted at JS render time and DO NOT
 * apply through Reanimated's native prop path — an animated <G> silently
 * stays put. So:
 *   • ANIMATE PRIMITIVE PROPS ONLY: cx/cy, x1/y1/x2/y2, r, rx/ry, width,
 *     height, opacity, strokeWidth, strokeDashoffset, strokeDasharray, d.
 *   • To move a GROUP as a unit, wrap it in a plain RN Animated.View with
 *     useAnimatedStyle({transform}) — that path is bulletproof.
 *   • Every animated element also carries its REST POSE as static props, so
 *     the first paint is complete before the UI-thread mapper runs.
 * Gradient/clip ids must be unique per <Svg> root (duplicate ids break fills —
 * the documented ToolsHub tile-06 failure).
 *
 * REDUCED MOTION is honored everywhere: `useCiMotion()` returns durations of 0
 * and skips loops when the OS asks for less motion — the END STATE is always
 * identical, so nothing is ever hidden behind an animation.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, type StyleProp, type ViewStyle } from 'react-native';
import { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  runOnJS,
  useAnimatedProps,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

/* ── animated SVG primitives (primitive props only — see the rule above) ─── */
export const APath = Animated.createAnimatedComponent(Path);
export const ACircle = Animated.createAnimatedComponent(Circle);
export const ALine = Animated.createAnimatedComponent(Line);
export const ARect = Animated.createAnimatedComponent(Rect);
export const AEllipse = Animated.createAnimatedComponent(Ellipse);
/** OPACITY on a <G> is a plain prop (not a transform) so it animates natively.
 *  NEVER animate transform/x/y on this — see the rule above. */
export const AG = Animated.createAnimatedComponent(G);

type EasingFn = (t: number) => number;

/* ── the timing language ──────────────────────────────────────────────────── */
export const CI_MOTION = {
  /** UI acknowledgement — a chip lights, a card opens. */
  quick: 160,
  /** Standard state change — a verdict appears, a view flips. */
  base: 280,
  /** Something physical settles — a cable lands, a bundle re-forms. */
  settle: 420,
  /** A cable installs itself along a route (scaled by path length). */
  draw: 900,
  /** Deliberate reveal — scorecards, the capstone. */
  reveal: 620,
  /** Stagger step between list items. */
  stepDelay: 55,
} as const;

/** The lab's easing set. `out` for arrivals, `inOut` for transitions,
 *  `physical` for anything with mass. */
export const CI_EASE = {
  out: Easing.out(Easing.cubic),
  inOut: Easing.inOut(Easing.cubic),
  physical: Easing.out(Easing.back(1.2)),
  linear: Easing.linear,
} as const;

/** Any spring config (CI_SPRING, CI_SPRING_UI, or a scene's own). */
export type CiSpringConfig = { damping: number; stiffness: number; mass: number };

/** Spring for things with mass (cable settling, bundles re-forming). */
export const CI_SPRING = { damping: 15, stiffness: 140, mass: 0.9 } as const;
/** Snappier spring for UI furniture (markers, chips). */
export const CI_SPRING_UI = { damping: 18, stiffness: 220, mass: 0.6 } as const;

/** Reduced-motion-aware motion context. Durations collapse to 0 and loops are
 *  skipped; end states are unchanged. */
export function useCiMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let alive = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (alive) setReduce(v);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);
  return useMemo(
    () => ({
      reduce,
      /** Duration, collapsed to 0 under reduced motion. */
      d: (ms: number) => (reduce ? 0 : ms),
      /** Stagger delay for index i. */
      stagger: (i: number, step = CI_MOTION.stepDelay) => (reduce ? 0 : i * step),
      /** Should ambient loops (flow, pulse, breathing) run at all? */
      loops: !reduce,
    }),
    [reduce],
  );
}

/* ── DRAW: a cable installs itself along its path ─────────────────────────── */
/**
 * Reveals a path by walking strokeDashoffset from full length to 0. `len` is
 * the path's approximate length in viewBox units (over-estimate is safe — the
 * dash simply starts further out). Returns animatedProps for an <APath> plus
 * the shared progress (0..1) so callers can chain (e.g. drop a connector in
 * when the draw lands).
 */
export function useDrawIn(
  len: number,
  {
    run = true,
    duration,
    delay = 0,
    onDone,
  }: { run?: boolean; duration?: number; delay?: number; onDone?: () => void } = {},
) {
  const m = useCiMotion();
  // 0 = armed/hidden, 1 = fully drawn. run=false means NOT INSTALLED YET.
  const progress = useSharedValue(0);
  const doneRef = useRef(false);

  useEffect(() => {
    cancelAnimation(progress);
    if (!run) {
      progress.value = 0;
      doneRef.current = false;
      return;
    }
    const dur = m.d(duration ?? Math.min(CI_MOTION.draw, 260 + len * 2.2));
    progress.value = 0;
    const finish = () => {
      if (doneRef.current) return;
      doneRef.current = true;
      onDone?.();
    };
    progress.value = withDelay(
      m.d(delay),
      withTiming(1, { duration: dur, easing: CI_EASE.out }, (fin) => {
        if (fin && onDone) runOnJS(finish)();
      }),
    );
    return () => cancelAnimation(progress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, len, duration, delay, m.reduce]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: len * (1 - progress.value),
  }));

  return {
    progress,
    /** Spread onto <APath> together with `strokeDasharray={len}`. */
    animatedProps,
    dashArray: len,
    /** Static rest prop: the first paint is the UNDRAWN cable, so the draw
     *  never flashes a finished run before installing it. */
    restOffset: len,
  };
}

/* ── FLOW: a marching dash showing a run is live ──────────────────────────── */
export function useFlow({ run = true, speed = 1400, dash = 6, gap = 10 }: { run?: boolean; speed?: number; dash?: number; gap?: number } = {}) {
  const m = useCiMotion();
  const off = useSharedValue(0);
  const period = dash + gap;
  useEffect(() => {
    cancelAnimation(off);
    if (!run || !m.loops) {
      off.value = 0;
      return;
    }
    off.value = 0;
    off.value = withRepeat(withTiming(-period, { duration: speed, easing: CI_EASE.linear }), -1, false);
    return () => cancelAnimation(off);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, speed, period, m.loops]);
  const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: off.value }));
  return { animatedProps, dashArray: `${dash} ${gap}` };
}

/* ── PULSE: an unfound marker breathes until it's found ───────────────────── */
export function usePulse({ run = true, min = 1, max = 1.35, period = 1500 }: { run?: boolean; min?: number; max?: number; period?: number } = {}) {
  const m = useCiMotion();
  const t = useSharedValue(0);
  useEffect(() => {
    cancelAnimation(t);
    if (!run || !m.loops) {
      t.value = 0;
      return;
    }
    t.value = withRepeat(withTiming(1, { duration: period, easing: CI_EASE.inOut }), -1, true);
    return () => cancelAnimation(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, period, m.loops]);
  /** Scale factor 0..1 → min..max, as a derived value for radius math. */
  const k = useDerivedValue(() => min + (max - min) * t.value);
  return { t, k };
}

/** Ready-made breathing ring for a defect/attention marker. Animates `r` and
 *  `opacity` — both primitive props, so this is native-safe. */
export function PulseRing({
  cx,
  cy,
  r,
  color,
  run = true,
  strokeWidth = 1.6,
}: {
  cx: number;
  cy: number;
  r: number;
  color: string;
  run?: boolean;
  strokeWidth?: number;
}) {
  const { t } = usePulse({ run });
  const animatedProps = useAnimatedProps(() => ({
    r: r * (1 + 0.45 * t.value),
    opacity: 0.55 * (1 - t.value),
  }));
  return <ACircle cx={cx} cy={cy} r={r} opacity={run ? 0.55 : 0} fill="none" stroke={color} strokeWidth={strokeWidth} animatedProps={animatedProps} />;
}

/* ── SETTLE: a value arrives with mass (springs), for primitive props ─────── */
export function useSettle(target: number, { spring = CI_SPRING, immediate = false }: { spring?: CiSpringConfig; immediate?: boolean } = {}) {
  const m = useCiMotion();
  const v = useSharedValue(target);
  useEffect(() => {
    if (m.reduce || immediate) {
      v.value = target;
      return;
    }
    v.value = withSpring(target, spring);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, m.reduce, immediate]);
  return v;
}

/** Eased (non-spring) tween of a scalar — for meters, fills, sweeps. */
export function useTween(target: number, duration: number = CI_MOTION.base, easing: EasingFn = CI_EASE.out) {
  const m = useCiMotion();
  const v = useSharedValue(target);
  useEffect(() => {
    cancelAnimation(v);
    v.value = withTiming(target, { duration: m.d(duration), easing });
    return () => cancelAnimation(v);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration, m.reduce]);
  return v;
}

/* ── STAGGER: cards/rows enter in sequence ────────────────────────────────── */
export function Stagger({
  index,
  children,
  style,
  from = 10,
  run = true,
}: {
  index: number;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** px to rise from. */
  from?: number;
  run?: boolean;
}) {
  const m = useCiMotion();
  const t = useSharedValue(run && !m.reduce ? 0 : 1);
  useEffect(() => {
    if (!run) return;
    if (m.reduce) {
      t.value = 1;
      return;
    }
    t.value = withDelay(m.stagger(index), withTiming(1, { duration: CI_MOTION.base, easing: CI_EASE.out }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, run, m.reduce]);
  const s = useAnimatedStyle(() => ({
    opacity: t.value,
    transform: [{ translateY: (1 - t.value) * from }],
  }));
  return <Animated.View style={[style, s]}>{children}</Animated.View>;
}

/** Entrance for a whole panel/verdict — fade + rise + slight scale. */
export function Appear({ children, style, delay = 0, run = true }: { children: ReactNode; style?: StyleProp<ViewStyle>; delay?: number; run?: boolean }) {
  const m = useCiMotion();
  const t = useSharedValue(run && !m.reduce ? 0 : 1);
  useEffect(() => {
    if (!run) return;
    if (m.reduce) {
      t.value = 1;
      return;
    }
    t.value = 0;
    t.value = withDelay(m.d(delay), withTiming(1, { duration: CI_MOTION.base, easing: CI_EASE.out }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, delay, m.reduce]);
  const s = useAnimatedStyle(() => ({
    opacity: t.value,
    transform: [{ translateY: (1 - t.value) * 12 }, { scale: 0.985 + 0.015 * t.value }],
  }));
  return <Animated.View style={[style, s]}>{children}</Animated.View>;
}

/** Group translation the ONLY way that works in react-native-svg: a plain RN
 *  view carrying the transform, holding its own <Svg>. */
export function MovingLayer({
  x,
  y,
  style,
  children,
}: {
  x: SharedValue<number>;
  y: SharedValue<number>;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  const s = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }, { translateY: y.value }] }));
  return <Animated.View style={[style, s]}>{children}</Animated.View>;
}

/* ── COUNT: a number ticks to its value ───────────────────────────────────── */
export function useCountUp(target: number, duration: number = CI_MOTION.reveal) {
  const m = useCiMotion();
  const [shown, setShown] = useState(m.reduce ? target : 0);
  const raf = useRef<number | null>(null);
  const startRef = useRef(0);
  const fromRef = useRef(0);

  useEffect(() => {
    if (m.reduce) {
      setShown(target);
      return;
    }
    fromRef.current = shown;
    startRef.current = 0;
    const step = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const p = Math.min(1, (ts - startRef.current) / duration);
      // easeOutCubic
      const e = 1 - Math.pow(1 - p, 3);
      setShown(Math.round(fromRef.current + (target - fromRef.current) * e));
      if (p < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => {
      if (raf.current != null) cancelAnimationFrame(raf.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration, m.reduce]);

  return shown;
}

/* ── SWEEP: the trace-mode veil + highlight (rack/label scenes) ───────────── */
/** Fades a dimming veil in/out and returns props for the veil rect. */
export function useVeil(active: boolean, opacity = 0.72) {
  const t = useTween(active ? 1 : 0, CI_MOTION.base);
  const animatedProps = useAnimatedProps(() => ({ opacity: t.value * opacity }));
  return { animatedProps, t };
}

/** Interpolate helper for worklets that need a mapped value. */
export function mapRange(v: number, inMin: number, inMax: number, outMin: number, outMax: number) {
  'worklet';
  return interpolate(v, [inMin, inMax], [outMin, outMax], 'clamp');
}

/** Re-exported so scenes import ONE module for motion. */
export { withDelay, withRepeat, withSequence, withSpring, withTiming, useSharedValue, useAnimatedProps, useAnimatedStyle, useDerivedValue, cancelAnimation, Animated };

/** A callback that fires once when a shared value crosses a threshold — used
 *  to sync a haptic/announcement to the visual beat. */
export function useOnCross(v: SharedValue<number>, threshold: number, cb: () => void) {
  const fired = useRef(false);
  const stable = useCallback(cb, [cb]);
  useDerivedValue(() => {
    if (v.value >= threshold && !fired.current) {
      fired.current = true;
      runOnJS(stable)();
    }
  });
  return () => {
    fired.current = false;
  };
}
