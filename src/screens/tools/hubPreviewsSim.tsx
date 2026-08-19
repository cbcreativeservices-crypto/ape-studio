/**
 * hubPreviewsSim — the three SIMULATED tile previews on the Tools & Analysis
 * hub (owner order 2026-08-19): Tone / Noise Generator, RT60 Reverb Decay,
 * Frequency Counter & Tuner. Scripted looping demonstrations — never the mic,
 * never the engine, never audible — each carrying the tiny DEMO tag
 * (measurement-tools §1.7 / ToolDemo badge precedent: simulated visuals must
 * never read as live measurements).
 *
 * Idiom is the tooldemos contract (SignalGenDemo / Rt60Demo / HzCounterDemo):
 * static react-native-svg geometry + RN Animated overlays on the native
 * driver for continuous motion; deterministic seeded math for every visual
 * shape (no Math.random in the drawn data). Schedule VARIANCE — the owner
 * asked that loops never repeat clock-like and start at randomized offsets —
 * comes from one LCG seeded per mount; given the seed, everything is
 * reproducible. Chrome is a verbatim port of the approved strip artwork
 * (assets/tool-strips 05/06/07), gradient ids re-namespaced `hp*`.
 *
 * Lifecycle: every timer/loop keys off the `active` prop (hub focused + app
 * foregrounded) — leaving the screen stops all of it; returning restarts with
 * fresh offsets.
 */
import { memo, useEffect, useRef, useState, type FC } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, Polygon, Rect, Stop } from 'react-native-svg';
import { AmbGrad, DemoTag, LvlGrad, MirGrad, NATIVE_DRIVER, useMeasuredWidth, Vignette } from './hubPreviewShared';
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
/* 06 — TONE / NOISE GENERATOR (waveform-type tour)                    */
/* ================================================================== */

type GenShape = 'sine' | 'square' | 'triangle' | 'saw' | 'noise';
const GEN_SHAPES: GenShape[] = ['sine', 'square', 'triangle', 'saw', 'noise'];

/** Art geometry: amplitude ±163.2 about y 512, period 260.7 canvas units. */
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

/** Seeded noise paths (fixed seeds — deterministic, per the demo contract). */
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
 *  (the SignalGenDemo trick — seamless); noise renders trace A here while the
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
  // One Svg per slot at a time — the slot letter alone keeps ids unique.
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

  // Waveform tour: 6–14 s per shape with restrained LCG variation + a
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
        <Defs>
          <AmbGrad id="hpAmbGen" />
        </Defs>
        <Rect width={2048} height={1024} fill="#060608" />
        <Rect width={2048} height={1024} fill="url(#hpAmbGen)" />
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
/* 05 — RT60 REVERB DECAY (repeating plotted measurement)              */
/* ================================================================== */

/** Precomputed decay curve (deterministic; echoes the art's exact shape:
 *  rise (124,875)→(204.5,107), exponential decay to a jittered ~875 floor). */
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

const RT60_STEPS = 36; // plotter draw resolution (~2.9 s at the 80 ms step)

const HubRt60Sim: FC<{ active: boolean }> = memo(({ active }) => {
  const [reveal, setReveal] = useState(0); // 0..RT60_STEPS
  const dataOp = useRef(new Animated.Value(1)).current;
  const fitOp = useRef(new Animated.Value(0)).current;
  const rngRef = useRef(makeRng((Date.now() ^ 0x77e60) >>> 0));

  useEffect(() => {
    if (!active) return undefined;
    const rng = rngRef.current;
    let cancelled = false;
    let tm: ReturnType<typeof setTimeout>;
    let iv: ReturnType<typeof setInterval> | null = null;

    // Re-activation starts from an EMPTY graph — never a stale mid-plot frame
    // frozen from before the blur.
    setReveal(0);
    fitOp.setValue(0);
    dataOp.setValue(0);

    const cycle = () => {
      if (cancelled) return;
      // 1) empty graph
      setReveal(0);
      fitOp.setValue(0);
      dataOp.setValue(1);
      tm = setTimeout(() => {
        if (cancelled) return;
        // 2–3) excitation + progressive plotted decay
        let step = 0;
        iv = setInterval(() => {
          step++;
          setReveal(step);
          if (step >= RT60_STEPS && iv) {
            clearInterval(iv);
            iv = null;
            // 4) fitted line + noise floor appear once the plot completes
            Animated.timing(fitOp, { toValue: 1, duration: 350, easing: Easing.out(Easing.quad), useNativeDriver: NATIVE_DRIVER }).start();
            // 5) hold, 6) fade, 7) pause, repeat — LCG-varied, never clock-like.
            // The next cycle is scheduled in PARALLEL with the fade (house demo
            // idiom): progress must never gate on an animation completing.
            tm = setTimeout(() => {
              if (cancelled) return;
              Animated.timing(dataOp, { toValue: 0, duration: 480, easing: Easing.inOut(Easing.quad), useNativeDriver: NATIVE_DRIVER }).start();
              tm = setTimeout(cycle, 480 + 1400 + rng() * 2200);
            }, 2400 + rng() * 2200);
          }
        }, 80);
      }, 900 + rng() * 900);
    };

    // Randomized start offset so the three demo cards never begin together.
    tm = setTimeout(cycle, rng() * 2600);
    return () => {
      cancelled = true;
      clearTimeout(tm);
      if (iv) clearInterval(iv);
    };
  }, [active, dataOp, fitOp]);

  const upTo = Math.ceil((RT60_POINTS.length * reveal) / RT60_STEPS);
  const drawing = reveal > 0 && reveal < RT60_STEPS;
  const tip = drawing && upTo >= 2 ? RT60_POINTS[Math.min(upTo, RT60_POINTS.length) - 1] : null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox={VB}>
        <Defs>
          <AmbGrad id="hpAmbRt" />
        </Defs>
        <Rect width={2048} height={1024} fill="#060608" />
        <Rect width={2048} height={1024} fill="url(#hpAmbRt)" />
        {RT60_CHROME}
      </Svg>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: dataOp }]} pointerEvents="none">
        {reveal > 0 && (
          <Svg width="100%" height="100%" viewBox={VB}>
            <Defs>
              <LvlGrad id="hpLvlRt" y1={104} y2={920} />
              <LinearGradient id="hpFillRt" gradientUnits="userSpaceOnUse" x1="0" y1={104} x2="0" y2={920}>
                <Stop offset="0" stopColor="#f0a23c" stopOpacity={0.28} />
                <Stop offset="0.6" stopColor="#34b96e" stopOpacity={0.12} />
                <Stop offset="1" stopColor="#2166c4" stopOpacity={0} />
              </LinearGradient>
            </Defs>
            <Path d={rt60Path(upTo, true)} fill="url(#hpFillRt)" />
            <Path d={rt60Path(upTo, false)} fill="none" stroke="url(#hpLvlRt)" strokeWidth={36} opacity={0.2} strokeLinejoin="round" />
            <Path d={rt60Path(upTo, false)} fill="none" stroke="url(#hpLvlRt)" strokeWidth={16} strokeLinejoin="round" />
            {tip && <Circle cx={tip[0]} cy={tip[1]} r={11} fill="#7ce8a6" opacity={0.9} />}
          </Svg>
        )}
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: fitOp }]} pointerEvents="none">
          <Svg width="100%" height="100%" viewBox={VB}>
            <Line x1={124} y1={875.1} x2={1924} y2={875.1} stroke="#ff6f22" strokeWidth={14} strokeDasharray="30 24" opacity={0.7} />
            <Line x1={259} y1={267.2} x2={1204} y2={813.9} stroke="#f5b942" strokeWidth={15} strokeDasharray="34 26" opacity={0.95} />
          </Svg>
        </Animated.View>
      </Animated.View>
      <Vignette />
      <DemoTag />
    </View>
  );
});
HubRt60Sim.displayName = 'HubRt60Sim';

/* ================================================================== */
/* 07 — FREQUENCY COUNTER & TUNER (simulated string-tuning events)     */
/* ================================================================== */

/** Art dial: pivot (1024,706), ±50¢ → ±56°; cents bar: 13.04 units/cent. */
const TUNER_CX = 1024;
const TUNER_CY = 706;
const TUNER_DEG_PER_CENT = 56 / 50;
const TUNER_PX_PER_CENT = 13.04;
const TUNER_TIP_LEN = 320; // pivot → tip (art (941.1,396.9))
const TUNER_TAIL_LEN = 58; // pivot → tail (art (1039,762))

const TUNER_MINOR_TICKS: ReadonlyArray<readonly [number, number, number, number]> = [
  [754.3, 482.9, 777.4, 502], [777.4, 457.7, 798.5, 478.9], [802.8, 434.8, 821.8, 458],
  [830.3, 414.5, 846.9, 439.5], [890.6, 382.4, 902.1, 410.1], [922.8, 370.9, 931.5, 399.7],
  [956, 362.7, 961.8, 392.1], [989.8, 357.7, 992.8, 387.5], [1058.2, 357.7, 1055.2, 387.5],
  [1092, 362.7, 1086.2, 392.1], [1125.2, 370.9, 1116.5, 399.7], [1157.4, 382.4, 1145.9, 410.1],
  [1217.7, 414.5, 1201.1, 439.5], [1245.2, 434.8, 1226.2, 458], [1270.6, 457.7, 1249.5, 478.9],
  [1293.7, 482.9, 1270.6, 502],
];
const TUNER_MAJOR_TICKS: ReadonlyArray<readonly [number, number, number, number]> = [
  [733.8, 510.3, 786.9, 546.1], [859.7, 397, 889.7, 453.5], [1024, 356, 1024, 420],
  [1188.3, 397, 1158.3, 453.5], [1314.2, 510.3, 1261.1, 546.1],
];
const TUNER_RULER_MAJOR_X = [372, 698, 1024, 1350, 1676];
const TUNER_RULER_MINOR_X = [453.5, 535, 616.5, 779.5, 861, 942.5, 1105.5, 1187, 1268.5, 1431.5, 1513, 1594.5];

const TUNER_CHROME = (
  <G>
    <Rect x={90} y={78} width={1868} height={874} rx={18} fill="#0c1016" stroke="#243046" strokeWidth={5} />
    <Path d="M715.6,498A372,372 0 0 1 1332.4,498" fill="none" stroke="#28303d" strokeWidth={46} strokeLinecap="round" />
    <Path d="M715.6,498A372,372 0 0 1 1332.4,498" fill="none" stroke="#7d8798" strokeWidth={9} />
    <Path d="M984.1,336.1A372,372 0 0 1 1063.9,336.1" fill="none" stroke="#34b96e" strokeWidth={46} />
    <Path d="M984.1,336.1A372,372 0 0 1 1063.9,336.1" fill="none" stroke="#7ce8a6" strokeWidth={9} />
    <G stroke="#aeb9cb" strokeWidth={6} opacity={0.75}>
      {TUNER_MINOR_TICKS.map(([x1, y1, x2, y2], i) => (
        <Line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />
      ))}
    </G>
    <G stroke="#eef3fa" strokeWidth={12}>
      {TUNER_MAJOR_TICKS.map(([x1, y1, x2, y2], i) => (
        <Line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />
      ))}
    </G>
    <Line x1={1024} y1={304} x2={1024} y2={260} stroke="#f5b942" strokeWidth={16} strokeLinecap="round" />
    {/* Cents ruler housing + green in-tune window. */}
    <Rect x={372} y={852} width={1304} height={124} rx={18} fill="#0a0e15" stroke="#2e3a50" strokeWidth={5} />
    <Rect x={928} y={862} width={192} height={104} rx={12} fill="#34b96e" opacity={0.16} />
    <Rect x={928} y={862} width={192} height={104} rx={12} fill="#0f2b1b" stroke="#34b96e" strokeWidth={7} />
    <Line x1={1024} y1={874} x2={1024} y2={954} stroke="#7ce8a6" strokeWidth={7} />
    {TUNER_RULER_MAJOR_X.map((x) => (
      <Line key={x} x1={x} y1={962} x2={x} y2={932} stroke="#6b7688" strokeWidth={7} opacity={0.85} />
    ))}
    {TUNER_RULER_MINOR_X.map((x) => (
      <Line key={x} x1={x} y1={962} x2={x} y2={944} stroke="#6b7688" strokeWidth={5} opacity={0.5} />
    ))}
  </G>
);

const HubTunerSim: FC<{ active: boolean }> = memo(({ active }) => {
  const [w, onLayout] = useMeasuredWidth();
  const [inTune, setInTune] = useState(false);
  const cents = useRef(new Animated.Value(-34)).current;
  const rngRef = useRef(makeRng((Date.now() ^ 0x70e37) >>> 0));

  // A tuning event: land flat/sharp, approach with decaying overshoot, settle
  // in the green, hold, drift slightly, wait — then the next "string".
  useEffect(() => {
    if (!active) return undefined;
    const rng = rngRef.current;
    let cancelled = false;
    let tm: ReturnType<typeof setTimeout>;
    let sign = rng() > 0.5 ? 1 : -1;

    // Steps schedule with PARALLEL setTimeouts (HzCounterDemo idiom) — never
    // gated on an Animated completion, so a suspended animation frame can
    // never deadlock the tour.
    const moveTo = (value: number, duration: number) => {
      Animated.timing(cents, { toValue: value, duration, easing: Easing.out(Easing.cubic), useNativeDriver: NATIVE_DRIVER }).start();
    };

    const runEvent = () => {
      if (cancelled) return;
      setInTune(false);
      sign = -sign;
      const start = sign * (25 + rng() * 17);
      const steps = [-start * (0.24 + rng() * 0.14), start * (0.1 + rng() * 0.06), (rng() * 2 - 1) * 1.2];
      let i = 0;
      const next = () => {
        if (cancelled) return;
        if (i >= steps.length) {
          setInTune(true);
          // Hold in tune, relax a hair, then wait for the next string.
          tm = setTimeout(() => {
            if (cancelled) return;
            moveTo((rng() * 2 - 1) * 3, 700);
            setInTune(false);
            tm = setTimeout(runEvent, 2600 + rng() * 4800);
          }, 1700 + rng() * 900);
          return;
        }
        const dur = 460 + rng() * 320;
        moveTo(steps[i++], dur);
        tm = setTimeout(next, dur + 220 + rng() * 420);
      };
      // The "string" starts: snap roughly to its out-of-tune offset first.
      moveTo(start, 260);
      tm = setTimeout(next, 260 + 350 + rng() * 350);
    };

    tm = setTimeout(runEvent, 600 + rng() * 3200);
    return () => {
      cancelled = true;
      clearTimeout(tm);
    };
  }, [active, cents]);

  const s = w / 2048;
  const rotate = cents.interpolate({
    inputRange: [-50, 50],
    outputRange: [`-${50 * TUNER_DEG_PER_CENT}deg`, `${50 * TUNER_DEG_PER_CENT}deg`],
  });
  const cursorX = cents.interpolate({
    inputRange: [-50, 50],
    outputRange: [-50 * TUNER_PX_PER_CENT * s, 50 * TUNER_PX_PER_CENT * s],
  });
  const needleColor = inTune ? '#7ce8a6' : '#ffcf6a';

  return (
    <View style={StyleSheet.absoluteFill} onLayout={onLayout} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox={VB}>
        <Defs>
          <AmbGrad id="hpAmbTun" peak={0.24} />
        </Defs>
        <Rect width={2048} height={1024} fill="#060608" />
        <Rect width={2048} height={1024} fill="url(#hpAmbTun)" />
        {TUNER_CHROME}
      </Svg>
      {s > 0 && (
        <>
          {/* Needle — native-driver rotation about the pivot (double-length box). */}
          <Animated.View
            style={{
              position: 'absolute',
              left: TUNER_CX * s - 21 * s,
              top: (TUNER_CY - TUNER_TIP_LEN) * s,
              width: 42 * s,
              height: TUNER_TIP_LEN * 2 * s,
              transform: [{ rotate }],
            }}
          >
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: 42 * s,
                height: (TUNER_TIP_LEN + TUNER_TAIL_LEN) * s,
                borderRadius: 21 * s,
                backgroundColor: needleColor,
                opacity: 0.16,
              }}
            />
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 12.5 * s,
                width: 17 * s,
                height: (TUNER_TIP_LEN + TUNER_TAIL_LEN) * s,
                borderRadius: 8.5 * s,
                backgroundColor: needleColor,
              }}
            />
          </Animated.View>
          {/* Hub above the needle (art z-order). */}
          <View
            style={{
              position: 'absolute',
              left: (TUNER_CX - 46) * s,
              top: (TUNER_CY - 46) * s,
              width: 92 * s,
              height: 92 * s,
              borderRadius: 46 * s,
              backgroundColor: '#151a22',
              borderWidth: Math.max(1, 6 * s),
              borderColor: '#3a4354',
            }}
          />
          <View
            style={{
              position: 'absolute',
              left: (TUNER_CX - 18) * s,
              top: (TUNER_CY - 18) * s,
              width: 36 * s,
              height: 36 * s,
              borderRadius: 18 * s,
              backgroundColor: '#f5b942',
            }}
          />
          {/* Cents cursor (pointer triangle + pill) riding the ruler. */}
          <Animated.View
            style={{
              position: 'absolute',
              left: (TUNER_CX - 40) * s,
              top: 806 * s,
              width: 80 * s,
              height: 164 * s,
              transform: [{ translateX: cursorX }],
            }}
          >
            <Svg width={80 * s} height={42 * s} viewBox="0 0 80 42">
              <Polygon points="0,0 80,0 40,42" fill={needleColor} />
            </Svg>
            <View
              style={{
                position: 'absolute',
                left: 26.5 * s,
                top: 52 * s,
                width: 27 * s,
                height: 112 * s,
                borderRadius: 13 * s,
                backgroundColor: needleColor,
              }}
            />
          </Animated.View>
        </>
      )}
      <Vignette />
      <DemoTag />
    </View>
  );
});
HubTunerSim.displayName = 'HubTunerSim';

/* ================================================================== */

export const HUB_SIM_MINIS: Partial<Record<ToolKey, FC<{ active: boolean }>>> = {
  signalgen: HubSignalGenSim,
  rt60: HubRt60Sim,
  hzcounter: HubTunerSim,
};
