/**
 * Sound Systems Lab — motion that behaves like the equipment.
 *
 * The owner's standard (2026-09-26): animations must look like what a
 * technician sees in the field — meters that bounce with programme and hold
 * their peaks, sound leaving a loudspeaker as wavefronts, indicators that
 * light in order — not decoration. Built on the Cable Install motion kit's
 * rules: Reanimated shared values, primitive SVG props only, and every
 * animation honours reduced motion by collapsing to its end state.
 */
import { useEffect } from 'react';
import { Path } from 'react-native-svg';
import Animated, { cancelAnimation, useAnimatedProps, useDerivedValue, useFrameCallback, useSharedValue, withRepeat, withTiming, Easing, type SharedValue } from 'react-native-reanimated';
import { useCiMotion } from '../../cableinstall/motion';
import { useOverlaysSuppressed } from '../../../../features/dev/popupSuppressStore';

/** Loops run only when the OS and the app allow motion AND Low-Light
 *  Production Mode is off — in that mode nothing on screen may move. */
export function useLabLoops(): boolean {
  const m = useCiMotion();
  const suppressed = useOverlaysSuppressed();
  return m.loops && !suppressed;
}

const APathM = Animated.createAnimatedComponent(Path);

/* ── programme: a musical envelope every meter in the lab shares ─────────── */

/**
 * A 0..1 "programme" level that moves like a band: a beat with a fast attack
 * and a decaying tail, riding on a slow swell, with the occasional bigger
 * hit. 1 = the loudest peak the programme reaches. Under reduced motion it
 * sits at a steady 0.85 so a meter still reads a level, just a still one.
 */
export function useProgrammeLevel(running: boolean): SharedValue<number> {
  const loops = useLabLoops();
  const t = useSharedValue(0);
  const level = useSharedValue(0.85);
  const cb = useFrameCallback((info) => {
    if (info.timeSincePreviousFrame == null) return;
    t.value += Math.min(info.timeSincePreviousFrame, 64) / 1000;
    const x = t.value;
    // 118 bpm beat: sharp attack, exponential decay.
    const beat = 60 / 118;
    const ph = (x % beat) / beat;
    const kick = Math.exp(-ph * 5.5);
    // snare on 2 and 4, a little quieter.
    const bar = (x % (beat * 4)) / (beat * 4);
    const snarePh = ((bar * 4 + 1) % 2) / 2;
    const snare = 0.6 * Math.exp(-snarePh * 7);
    // a slow swell and a slower breath so it never loops visibly.
    const swell = 0.12 * Math.sin(x * 0.7) + 0.08 * Math.sin(x * 0.23 + 1.3);
    const v = 0.55 + 0.32 * Math.max(kick, snare) + swell;
    level.value = Math.max(0.05, Math.min(1, v));
  }, false);
  useEffect(() => {
    if (!running || !loops) {
      cb.setActive(false);
      level.value = 0.85;
      return;
    }
    cb.setActive(true);
    return () => cb.setActive(false);
  }, [running, loops, cb, level]);
  return level;
}

/**
 * A peak-hold follower: rises instantly with `input`, then falls back at
 * `fallPerSec` (in the same 0..1 units) after `holdMs`. The classic meter
 * peak indicator.
 */
export function usePeakHold(input: SharedValue<number>, holdMs = 900, fallPerSec = 0.35): SharedValue<number> {
  const peak = useSharedValue(0);
  const since = useSharedValue(0);
  const cb = useFrameCallback((info) => {
    if (info.timeSincePreviousFrame == null) return;
    const dt = Math.min(info.timeSincePreviousFrame, 64);
    if (input.value >= peak.value) {
      peak.value = input.value;
      since.value = 0;
    } else {
      since.value += dt;
      if (since.value > holdMs) peak.value = Math.max(input.value, peak.value - (fallPerSec * dt) / 1000);
    }
  }, true);
  useEffect(() => {
    cb.setActive(true);
    return () => cb.setActive(false);
  }, [cb]);
  return peak;
}

/* ── wavefronts: sound leaving a loudspeaker ─────────────────────────────── */

/** Arc path from a centre, radius r, covering ±half around `aimDeg` (0 = down the plot). */
function arcPath(cx: number, cy: number, r: number, aimDeg: number, halfDeg: number): string {
  'worklet';
  const a0 = ((aimDeg - halfDeg) * Math.PI) / 180;
  const a1 = ((aimDeg + halfDeg) * Math.PI) / 180;
  const x0 = cx + Math.sin(a0) * r;
  const y0 = cy + Math.cos(a0) * r;
  const x1 = cx + Math.sin(a1) * r;
  const y1 = cy + Math.cos(a1) * r;
  const large = halfDeg * 2 > 180 ? 1 : 0;
  return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 0 ${x1} ${y1}`;
}

/**
 * Three arcs that leave a source, travel outward and fade — the visible
 * version of "this loudspeaker is playing". Omni (`coverDeg` ≥ 360) draws
 * full rings. `run=false` (or reduced motion) draws one faint static arc so
 * the end state still says "live".
 */
export function Wavefronts({ cx, cy, aimDeg, coverDeg, color, run = true, reach = 110, period = 2400 }: { cx: number; cy: number; aimDeg: number; coverDeg: number; color: string; run?: boolean; reach?: number; period?: number }) {
  const loops = useLabLoops();
  const phase = useSharedValue(0);
  useEffect(() => {
    cancelAnimation(phase);
    if (!run || !loops) {
      phase.value = 0.35;
      return;
    }
    phase.value = 0;
    phase.value = withRepeat(withTiming(1, { duration: period, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(phase);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, period, loops]);
  const half = coverDeg >= 360 ? 180 : Math.min(88, coverDeg / 2 + 6);
  const animate = run && loops;
  const arcs = [0, 1 / 3, 2 / 3];
  return (
    <>
      {arcs.map((offset, i) => (
        <WaveArc key={i} cx={cx} cy={cy} aimDeg={aimDeg} half={half} color={color} phase={phase} offset={offset} reach={reach} animate={animate} />
      ))}
    </>
  );
}

function WaveArc({ cx, cy, aimDeg, half, color, phase, offset, reach, animate }: { cx: number; cy: number; aimDeg: number; half: number; color: string; phase: SharedValue<number>; offset: number; reach: number; animate: boolean }) {
  const p = useDerivedValue(() => (phase.value + offset) % 1);
  const animatedProps = useAnimatedProps(() => {
    const k = p.value;
    return {
      d: arcPath(cx, cy, 10 + k * reach, aimDeg, half),
      opacity: animate ? 0.55 * (1 - k) : offset === 0 ? 0.3 : 0,
      strokeWidth: 1.2 + (1 - k) * 1.4,
    };
  });
  return <APathM d={arcPath(cx, cy, 10 + offset * reach, aimDeg, half)} fill="none" stroke={color} strokeWidth={1.6} opacity={0.3} strokeLinecap="round" animatedProps={animatedProps} />;
}

/* ── an ordered indicator chase (power-up / power-down) ──────────────────── */

/**
 * A 0..1 value that steps to `target` with the lab's settle timing — used to
 * light a row of devices one after another as steps are taken.
 */
export function useSettleTo(target: number, duration = 420): SharedValue<number> {
  const m = useCiMotion();
  const v = useSharedValue(target);
  useEffect(() => {
    cancelAnimation(v);
    v.value = withTiming(target, { duration: m.d(duration), easing: Easing.out(Easing.cubic) });
    return () => cancelAnimation(v);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, m.reduce]);
  return v;
}
