/**
 * hubPreviewsSim â€” the three SIMULATED tile previews on the Tools & Analysis
 * hub (owner order 2026-08-19): Tone / Noise Generator, RT60 Reverb Decay,
 * Frequency Counter & Tuner. Scripted looping demonstrations â€” never the mic,
 * never the engine, never audible â€” each carrying the tiny DEMO tag
 * (measurement-tools Â§1.7 / ToolDemo badge precedent: simulated visuals must
 * never read as live measurements).
 *
 * Idiom is the tooldemos contract (SignalGenDemo / Rt60Demo / HzCounterDemo):
 * static react-native-svg geometry + RN Animated overlays on the native
 * driver for continuous motion; deterministic seeded math for every visual
 * shape (no Math.random in the drawn data). Schedule VARIANCE â€” the owner
 * asked that loops never repeat clock-like and start at randomized offsets â€”
 * comes from one LCG seeded per mount; given the seed, everything is
 * reproducible. Chrome is a verbatim port of the approved strip artwork
 * (assets/tool-strips 05/06/07), gradient ids re-namespaced `hp*`.
 *
 * Lifecycle: every timer/loop keys off the `active` prop (hub focused + app
 * foregrounded) â€” leaving the screen stops all of it; returning restarts with
 * fresh offsets.
 */
import { memo, useEffect, useRef, useState, type FC } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { DemoTag, LvlGrad, MirGrad, NATIVE_DRIVER, useMeasuredWidth, Vignette } from './hubPreviewShared';
import type { ToolKey } from './toolsData';

const VB = '0 0 2048 1024';
/** Plot region shared by strips 05/06 (panel x 90..1958, plot x 124..1924, y 104..920). */
const PLOT = { x: 124 / 2048, y: 104 / 1024, w: 1800 / 2048, h: 816 / 1024 };

/** Deterministic LCG (the SignalGenDemo constants). Seeded once per mount so
 *  sibling cards drift apart naturally; visuals stay reproducible per seed. */
function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

/* ================================================================== */
/* 06 â€” TONE / NOISE GENERATOR (waveform-type tour)                    */
/* ================================================================== */

type GenShape = 'sine' | 'square' | 'triangle' | 'saw' | 'noise';
const GEN_SHAPES: GenShape[] = ['sine', 'square', 'triangle', 'saw', 'noise'];

/** Art geometry: amplitude Â±163.2 about y 512, period 260.7 canvas units. */
const GEN_AMP = 163.2;
const GEN_LAMBDA = 260.7;
const GEN_PLOT_W = 1800;
const GEN_PLOT_H = 816;
const GEN_MID = 512 - 104; // in plot-local coords

function shapeValue(kind: GenShape, t: number): number {
  const ph = t - Math.floor(t);
  switch (kind) {
    case 'sine':
      return Math.sin(2 * Math.PI * ph);
    case 'square':
      return ph < 0.5 ? 1 : -1;
    case 'triangle':
      return ph < 0.25 ? 4 * ph : ph < 0.75 ? 2 - 4 * ph : 4 * ph - 4;
    case 'saw':
      return 2 * ph - 1;
    default:
      return 0;
  }
}

/** Periodic wave path across the plot + one extra wavelength (seamless scroll). */
function genWavePath(kind: GenShape): string {
  const w = GEN_PLOT_W + GEN_LAMBDA;
  const parts: string[] = [];
  const step = 3;
  for (let x = 0; x <= w; x += step) {
    const v = shapeValue(kind, x / GEN_LAMBDA);
    const y = GEN_MID - v * GEN_AMP;
    parts.push(`${x === 0 ? 'M' : 'L'}${x} ${y.toFixed(1)}`);
  }
  return parts.join('');
}

/** Seeded noise paths (fixed seeds â€” deterministic, per the demo contract). */
function genNoisePath(seed: number): string {
  const rng = makeRng(seed);
  const parts: string[] = [];
  let acc = 0;
  for (let x = 0; x <= GEN_PLOT_W; x += 9) {
    // Lightly smoothed white noise so the trace reads as broadband, not spikes.
    acc = acc * 0.35 + (rng() * 2 - 1) * 0.85;
    const y = GEN_MID - Math.max(-1, Math.min(1, acc)) * GEN_AMP;
    parts.push(`${x === 0 ? 'M' : 'L'}${x} ${y.toFixed(1)}`);
  }
  return parts.join('');
}

const GEN_PATHS: Record<GenShape, string> = {
  sine: genWavePath('sine'),
  square: genWavePath('square'),
  triangle: genWavePath('triangle'),
  saw: genWavePath('saw'),
  noise: genNoisePath(0xc0ffee),
};
const GEN_NOISE_B = genNoisePath(0xbada55);

const GEN_CHROME = (
  <G>
    <Rect x={90} y={78} width={1868} height={874} rx={14} fill="#0b0f16" stroke="#1e2635" strokeWidth={4} />
    <Line x1={124} y1={512} x2={1924} y2={512} stroke="#1b2434" strokeWidth={4} />
  </G>
);

/** One wave slot: its own inner Svg (plot-local coords) inside a clipped,
 *  scroll-translated layer. Periodic shapes scroll by exactly one wavelength
 *  (the SignalGenDemo trick â€” seamless); noise renders trace A here while the
 *  parent cross-fades seeded trace B on top to suggest motion. */
function GenWaveSlot({
  shape,
  opacity,
  plotW,
  slot,
  active,
}: {
  shape: GenShape;
  opacity: Animated.AnimatedInterpolation<number> | Animated.Value;
  plotW: number;
  slot: 'A' | 'B';
  active: boolean;
}) {
  const scroll = useRef(new Animated.Value(0)).current;
  const lambdaPt = (GEN_LAMBDA / GEN_PLOT_W) * plotW;

  useEffect(() => {
    if (!active || shape === 'noise' || plotW <= 0) return undefined;
    scroll.setValue(0);
    const loop = Animated.loop(
      Animated.timing(scroll, { toValue: 1, duration: 1500, easing: Easing.linear, useNativeDriver: NATIVE_DRIVER }),
    );
    loop.start();
    return () => loop.stop();
  }, [active, shape, plotW, scroll]);

  if (plotW <= 0) return null;
  // One Svg per slot at a time â€” the slot letter alone keeps ids unique.
  const gradId = `hpMirGen${slot}`;
  const scrollX = scroll.interpolate({ inputRange: [0, 1], outputRange: [0, -lambdaPt] });
  const svgW = plotW * ((GEN_PLOT_W + GEN_LAMBDA) / GEN_PLOT_W);

  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity }]}>
      {shape === 'noise' ? (
        <Svg width="100%" height="100%" viewBox={`0 0 ${GEN_PLOT_W} ${GEN_PLOT_H}`} preserveAspectRatio="none">
          <Defs>
            <MirGrad id={gradId} y1={GEN_MID - GEN_AMP} y2={GEN_MID + GEN_AMP} />
          </Defs>
          <Path d={GEN_PATHS.noise} fill="none" stroke={`url(#${gradId})`} strokeWidth={34} opacity={0.22} />
          <Path d={GEN_PATHS.noise} fill="none" stroke={`url(#${gradId})`} strokeWidth={16} strokeLinecap="round" />
        </Svg>
      ) : (
        <Animated.View
          style={{ width: svgW, height: '100%', transform: [{ translateX: scrollX }] }}
        >
          <Svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${GEN_PLOT_W + GEN_LAMBDA} ${GEN_PLOT_H}`}
            preserveAspectRatio="none"
          >
            <Defs>
              <MirGrad id={gradId} y1={GEN_MID - GEN_AMP} y2={GEN_MID + GEN_AMP} />
            </Defs>
            <Path d={GEN_PATHS[shape]} fill="none" stroke={`url(#${gradId})`} strokeWidth={34} opacity={0.22} />
            <Path d={GEN_PATHS[shape]} fill="none" stroke={`url(#${gradId})`} strokeWidth={16} strokeLinecap="round" />
          </Svg>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const HubSignalGenSim: FC<{ active: boolean }> = memo(({ active }) => {
  const [w, onLayout] = useMeasuredWidth();
  const [pair, setPair] = useState<{ cur: GenShape; prev: GenShape }>({ cur: 'sine', prev: 'sine' });
  const fade = useRef(new Animated.Value(1)).current;
  const rngRef = useRef(makeRng((Date.now() ^ 0x51e77) >>> 0));
  const noiseFlick = useRef(new Animated.Value(0)).current;

  // Waveform tour: 6â€“14 s per shape with restrained LCG variation + a
  // randomized starting offset so sibling cards never move in sync. The next
  // shape derives from CURRENT state (not a closure index) so re-activation
  // after a blur continues the tour instead of jumping/blank-flashing; once a
  // cross-fade completes, prev collapses onto cur so the invisible slot (and
  // its scroll/flicker loops) unmounts instead of running at opacity 0.
  useEffect(() => {
    if (!active) return undefined;
    const rng = rngRef.current;
    let cancelled = false;
    let tm: ReturnType<typeof setTimeout>;
    const advance = () => {
      setPair((p) => {
        const next = GEN_SHAPES[(GEN_SHAPES.indexOf(p.cur) + 1) % GEN_SHAPES.length];
        return { cur: next, prev: p.cur };
      });
      fade.setValue(0);
      Animated.timing(fade, { toValue: 1, duration: 650, easing: Easing.inOut(Easing.quad), useNativeDriver: NATIVE_DRIVER }).start(
        ({ finished }) => {
          if (finished && !cancelled) setPair((p) => ({ cur: p.cur, prev: p.cur }));
        },
      );
      tm = setTimeout(advance, 6000 + rng() * 8000);
    };
    tm = setTimeout(advance, 2500 + rng() * 6000);
    return () => {
      cancelled = true;
      clearTimeout(tm);
    };
  }, [active, fade]);

  // Noise slots flicker between two seeded traces to suggest motion.
  useEffect(() => {
    if (!active || (pair.cur !== 'noise' && pair.prev !== 'noise')) return undefined;
    noiseFlick.setValue(0);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(noiseFlick, { toValue: 1, duration: 170, easing: Easing.linear, useNativeDriver: NATIVE_DRIVER }),
        Animated.timing(noiseFlick, { toValue: 0, duration: 170, easing: Easing.linear, useNativeDriver: NATIVE_DRIVER }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active, pair, noiseFlick]);

  const plotW = w * PLOT.w;
  const prevOp = fade.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });

  return (
    <View style={StyleSheet.absoluteFill} onLayout={onLayout} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox={VB}>
        <Rect width={2048} height={1024} fill="#060608" />
        {GEN_CHROME}
      </Svg>
      {/* Clipped plot window holding the two cross-fading wave slots. */}
      <View
        style={{
          position: 'absolute',
          left: `${PLOT.x * 100}%`,
          top: `${PLOT.y * 100}%`,
          width: `${PLOT.w * 100}%`,
          height: `${PLOT.h * 100}%`,
          overflow: 'hidden',
        }}
      >
        {pair.prev !== pair.cur && (
          <GenWaveSlot shape={pair.prev} opacity={prevOp} plotW={plotW} slot="A" active={active} />
        )}
        <GenWaveSlot shape={pair.cur} opacity={fade} plotW={plotW} slot="B" active={active} />
        {/* Second seeded noise trace cross-fades over the first. */}
        {(pair.cur === 'noise' || pair.prev === 'noise') && plotW > 0 && (
          <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: Animated.multiply(noiseFlick, pair.cur === 'noise' ? fade : prevOp) }]}>
            <Svg width="100%" height="100%" viewBox={`0 0 ${GEN_PLOT_W} ${GEN_PLOT_H}`} preserveAspectRatio="none">
              <Defs>
                <MirGrad id="hpMirGenN2" y1={GEN_MID - GEN_AMP} y2={GEN_MID + GEN_AMP} />
              </Defs>
              <Path d={GEN_NOISE_B} fill="none" stroke="url(#hpMirGenN2)" strokeWidth={16} strokeLinecap="round" />
            </Svg>
          </Animated.View>
        )}
      </View>
      <Vignette />
      <DemoTag />
    </View>
  );
});
HubSignalGenSim.displayName = 'HubSignalGenSim';

/* ================================================================== */
/* 05 â€” RT60 REVERB DECAY (repeating plotted measurement)              */
/* ================================================================== */

/** Precomputed decay curve (deterministic; echoes the art's exact shape:
 *  rise (124,875)â†’(204.5,107), exponential decay to a jittered ~875 floor). */
const RT60_POINTS: ReadonlyArray<readonly [number, number]> = (() => {
  const rng = makeRng(0x5eed05);
  const pts: [number, number][] = [];
  const X0 = 124;
  const X_PEAK = 204.5;
  const Y_FLOOR = 875.1;
  const Y_PEAK = 106.8;
  for (let i = 0; i <= 8; i++) {
    const x = X0 + ((X_PEAK - X0) * i) / 8;
    // Fast attack, slightly convex.
    const t = i / 8;
    pts.push([x, Y_FLOOR - (Y_FLOOR - Y_PEAK) * Math.pow(t, 0.72)]);
  }
  for (let x = X_PEAK + 9; x <= 1924; x += 9) {
    const decayed = Y_FLOOR - (Y_FLOOR - Y_PEAK) * Math.exp(-(x - X_PEAK) / 240);
    const jitter = x > 1000 ? (rng() * 2 - 1) * 9 : (rng() * 2 - 1) * 2.5;
    pts.push([x, Math.min(Y_FLOOR + 9.5, decayed + jitter)]);
  }
  return pts;
})();

function rt60Path(upTo: number, close: boolean): string {
  const n = Math.max(2, Math.min(RT60_POINTS.length, upTo));
  const parts: string[] = [];
  for (let i = 0; i < n; i++) {
    const [x, y] = RT60_POINTS[i];
    parts.push(`${i === 0 ? 'M' : 'L'}${x} ${y.toFixed(1)}`);
  }
  if (close) {
    const lastX = RT60_POINTS[n - 1][0];
    parts.push(`L${lastX} 920L124 920Z`);
  }
  return parts.join('');
}

const RT60_CHROME = (
  <G>
    <Rect x={90} y={78} width={1868} height={874} rx={14} fill="#0b0f16" stroke="#1e2635" strokeWidth={4} />
    {[756.8, 593.6, 430.4, 267.2].map((y, i) => (
      <Line key={i} x1={124} y1={y} x2={1924} y2={y} stroke="#1b2434" strokeWidth={3} />
    ))}
    {[424, 724, 1024, 1324, 1624].map((x, i) => (
      <Line key={i} x1={x} y1={104} x2={x} y2={920} stroke="#1b2434" strokeWidth={3} />
    ))}
  </G>
);

/** A bright windowed segment of the curve (indices [from, to)) â€” the moving
 *  "measurement head" that sweeps down the persistent curve. */
function rt60Segment(from: number, to: number): string | null {
  const a = Math.max(0, from);
  const b = Math.min(RT60_POINTS.length, to);
  if (b - a < 2) return null;
  const parts: string[] = [];
  for (let i = a; i < b; i++) {
    const [x, y] = RT60_POINTS[i];
    parts.push(`${i === a ? 'M' : 'L'}${x} ${y.toFixed(1)}`);
  }
  return parts.join('');
}

const RT60_HEAD_MS = 70; // head advance tick
const RT60_HEAD_STEP = 5; // points per tick â†’ full sweep â‰ˆ 4 s
const RT60_TRAIL = 16; // bright comet-tail length in points

const HubRt60Sim: FC<{ active: boolean }> = memo(({ active }) => {
  // The curve, fitted line, and noise floor are ALWAYS drawn (owner 2026-08-19:
  // no clearing/pausing between measurements). The only motion is a glowing
  // "measurement head" that sweeps down the curve and wraps seamlessly â€” the
  // base curve never blanks, so there is no flash on wrap.
  const [head, setHead] = useState(0);

  useEffect(() => {
    if (!active) return undefined;
    let cancelled = false;
    let h = 0;
    const N = RT60_POINTS.length;
    const iv = setInterval(() => {
      if (cancelled) return;
      h += RT60_HEAD_STEP;
      if (h > N + RT60_TRAIL) h = 0; // brief travel past the floor, then restart
      setHead(h);
    }, RT60_HEAD_MS);
    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, [active]);

  const headSeg = rt60Segment(head - RT60_TRAIL, head);
  const headPt = head >= 2 && head <= RT60_POINTS.length ? RT60_POINTS[Math.min(head, RT60_POINTS.length) - 1] : null;
  const fullCurve = rt60Path(RT60_POINTS.length, false);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox={VB}>
        <Defs>
          <LvlGrad id="hpLvlRt" y1={104} y2={920} />
          <LinearGradient id="hpFillRt" gradientUnits="userSpaceOnUse" x1="0" y1={104} x2="0" y2={920}>
            <Stop offset="0" stopColor="#f0a23c" stopOpacity={0.28} />
            <Stop offset="0.6" stopColor="#34b96e" stopOpacity={0.12} />
            <Stop offset="1" stopColor="#2166c4" stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Rect width={2048} height={1024} fill="#060608" />
        {RT60_CHROME}
        {/* Persistent measurement: fill + decay curve + noise floor + fit line. */}
        <Path d={rt60Path(RT60_POINTS.length, true)} fill="url(#hpFillRt)" />
        <Path d={fullCurve} fill="none" stroke="url(#hpLvlRt)" strokeWidth={36} opacity={0.2} strokeLinejoin="round" />
        <Path d={fullCurve} fill="none" stroke="url(#hpLvlRt)" strokeWidth={16} strokeLinejoin="round" />
        <Line x1={124} y1={875.1} x2={1924} y2={875.1} stroke="#ff6f22" strokeWidth={14} strokeDasharray="30 24" opacity={0.7} />
        <Line x1={259} y1={267.2} x2={1204} y2={813.9} stroke="#f5b942" strokeWidth={15} strokeDasharray="34 26" opacity={0.95} />
        {/* Moving measurement head â€” the sweeping comet. */}
        {headSeg && <Path d={headSeg} fill="none" stroke="#7ce8a6" strokeWidth={20} strokeLinecap="round" strokeLinejoin="round" opacity={0.9} />}
        {headPt && <Circle cx={headPt[0]} cy={headPt[1]} r={13} fill="#eafff2" />}
      </Svg>
      <Vignette />
      <DemoTag />
    </View>
  );
});
HubRt60Sim.displayName = 'HubRt60Sim';

/* ================================================================== */

export const HUB_SIM_MINIS: Partial<Record<ToolKey, FC<{ active: boolean }>>> = {
  signalgen: HubSignalGenSim,
  rt60: HubRt60Sim,
  // hzcounter is now a REAL-TIME live mic preview (HUB_LIVE_MINIS) — owner 2026-08-19.
};
