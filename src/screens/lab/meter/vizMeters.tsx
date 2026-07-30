/**
 * Visual Audio Analysis Lab — meter renderers (launch build 2026-07-29).
 * Every export below is the CONTRACT the module files are written against IN
 * PARALLEL — names + props preserved from the stub; only optional additive
 * props were added. ONLY this file (and vizSpectral) imports Skia, via
 * meter/skiaGate.
 *
 * OWNER DIRECTIVE (docs/APE_VISUAL_STANDARDS_2026_07_29.md): hero renderings
 * of professional metering hardware/software, not diagrams. Every "live"
 * behavior is the phase clock scanning a DETERMINISTIC buffer from
 * meterEngine.renderSignal() as a loop — per-signal arrays and their
 * peak/RMS/loudness series are precomputed in useMemo; the per-frame worklets
 * only index them (fixed node counts, no per-frame allocations beyond the
 * house Skia.Path idiom used by micspeaker/viz).
 */
import { useMemo } from 'react';
import { PixelRatio, Text as RNText, View } from 'react-native';
import {
  BlurMask,
  Canvas,
  Circle,
  DashPathEffect,
  Group,
  Line as SkLine,
  LinearGradient,
  Path,
  RadialGradient,
  Skia,
  SweepGradient,
  vec,
} from '@shopify/react-native-skia';
import { useDerivedValue, useSharedValue, type SharedValue } from 'react-native-reanimated';
import {
  correlationOf,
  crestDb,
  db,
  dcOf,
  peakOf,
  renderSignal,
  rmsOf,
  simulateLoudness,
  stereoPair,
  type SignalKey,
} from './meterEngine';
import { fonts } from '../../../theme/tokens';
export { usePhaseClock, useVizClock } from '../foundations/viz';

// House lab palette (visual standards §3).
const BG = '#0c0c0f';
const GRID = '#2c2c33';
const GHOST = '#232329';
const AMBER = '#ffc64d';
const BLUE = '#6fa8ff';
const GREEN = '#5bff85';
const RED = '#ff6b5e';
const TEXT_DIM = '#767a85';

const DEG = Math.PI / 180;
/** Waveform column density — device pixels (capped for very dense screens). */
const DPR = Math.max(1, Math.min(3.5, PixelRatio.get()));
/** Scan resolution of every precomputed per-loop series. */
const RES = 240;

type SkPathT = ReturnType<typeof Skia.Path.Make>;

function withAlpha(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

/** Loop-fraction of the phase clock (worklet-safe). */
function frac01(phase: number): number {
  'worklet';
  const f = phase / (Math.PI * 2);
  return f - Math.floor(f);
}

/** Glow + crisp double-stroke for a styled curve (house idiom). */
function GlowStroke({
  path,
  color,
  width = 2.4,
  opacity = 1,
}: {
  path: SkPathT | SharedValue<SkPathT>;
  color: string;
  width?: number;
  opacity?: number;
}) {
  return (
    <>
      <Path path={path} color={color} style="stroke" strokeWidth={width * 2.6} opacity={0.22 * opacity}>
        <BlurMask blur={width * 2.2} style="normal" />
      </Path>
      <Path path={path} color={color} style="stroke" strokeWidth={width} opacity={opacity} />
    </>
  );
}

/** Absolutely-positioned label over a canvas (vizChain/proximity precedent). */
function Lbl(props: {
  x: number;
  y: number;
  w?: number;
  size?: number;
  color?: string;
  align?: 'left' | 'center' | 'right';
  font?: string;
  ls?: number;
  children: string;
}) {
  return (
    <RNText
      style={{
        position: 'absolute',
        left: props.x,
        top: props.y,
        width: props.w ?? 40,
        textAlign: props.align ?? 'center',
        fontFamily: props.font ?? fonts.mono,
        fontSize: props.size ?? 8,
        color: props.color ?? TEXT_DIM,
        letterSpacing: props.ls,
        includeFontPadding: false,
      }}
    >
      {props.children}
    </RNText>
  );
}

/** Slotted machine screw — bezel/panel hardware (lit upper-left). */
function Screw({ x, y, r, slotDeg }: { x: number; y: number; r: number; slotDeg: number }) {
  const a = slotDeg * DEG;
  const dx = Math.cos(a) * r * 0.62;
  const dy = Math.sin(a) * r * 0.62;
  return (
    <Group>
      <Circle cx={x} cy={y} r={r}>
        <RadialGradient c={vec(x - r * 0.4, y - r * 0.4)} r={r * 2.1} colors={['#c9ced8', '#6a6e78', '#26272d']} />
      </Circle>
      <SkLine
        p1={{ x: x - dx, y: y - dy }}
        p2={{ x: x + dx, y: y + dy }}
        color="#15161a"
        strokeWidth={Math.max(1, r * 0.28)}
      />
      <Circle cx={x - r * 0.34} cy={y - r * 0.38} r={r * 0.2} color="#ffffff" opacity={0.5} />
    </Group>
  );
}

/** Brushed-aluminium panel backing (M2's rack-gear housing). */
function BrushedPanel({ w, h, r = 12 }: { w: number; h: number; r?: number }) {
  const paths = useMemo(() => {
    const base = Skia.Path.Make();
    base.addRRect(Skia.RRectXY(Skia.XYWHRect(0, 0, w, h), r, r));
    const streaks = Skia.Path.Make();
    for (let y = 3; y < h; y += 3) {
      streaks.moveTo(2, y);
      streaks.lineTo(w - 2, y);
    }
    return { base, streaks };
  }, [w, h, r]);
  return (
    <>
      <Path path={paths.base}>
        <LinearGradient start={vec(0, 0)} end={vec(0, h)} colors={['#2a2c33', '#1b1c22', '#141519']} positions={[0, 0.55, 1]} />
      </Path>
      <Path path={paths.streaks} color="#ffffff" style="stroke" strokeWidth={1} opacity={0.03} />
      <Path path={paths.base} color="#000000" style="stroke" strokeWidth={1.4} opacity={0.6} />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// M1 — Waveform

/** M1 — waveform strip with optional overlays. */
export function WaveformView(p: {
  width: number;
  height?: number;
  signal: SignalKey;
  /** Post-gain (linear) applied before drawing/clip analysis. */
  gain?: number;
  dcOffset?: number;
  invertPolarity?: boolean;
  /** Draw the 0 dBFS rails + red flat-top highlights where |x| ≥ 1. */
  showClip?: boolean;
  phase: SharedValue<number>;
}) {
  const w = p.width;
  const h = p.height ?? 170;
  const gain = p.gain ?? 1;
  const dc = p.dcOffset ?? 0;
  const inv = p.invertPolarity ?? false;
  const showClip = p.showClip ?? false;

  const AMAX = 1.28;
  const half = h / 2 - 8;
  const yOf = (a: number) => h / 2 - (a / AMAX) * half;

  const S = useMemo(() => {
    const n = 2048;
    const raw = renderSignal(p.signal, n);
    const sgn = inv ? -1 : 1;
    const x = raw.map((v) => sgn * v * gain + dc);
    const stats = { pkDb: db(peakOf(x)), rmsDb: db(rmsOf(x)), crest: crestDb(x), dc: dcOf(x) };
    // Per-column min/max at DEVICE-PIXEL density (owner: hero resolution).
    const cols = Math.max(96, Math.min(Math.round(w * DPR), n));
    const colW = w / cols;
    const lim = showClip ? 1 : 1.2; // showClip shears the tops at the rails
    const topA = new Array<number>(cols);
    const botA = new Array<number>(cols);
    const clT = new Array<boolean>(cols);
    const clB = new Array<boolean>(cols);
    for (let c = 0; c < cols; c++) {
      const i0 = Math.floor((c * n) / cols);
      const i1 = Math.max(i0 + 1, Math.floor(((c + 1) * n) / cols));
      let mn = Infinity;
      let mx = -Infinity;
      for (let i = i0; i < i1; i++) {
        const v = x[i];
        if (v < mn) mn = v;
        if (v > mx) mx = v;
      }
      clT[c] = mx >= 1;
      clB[c] = mn <= -1;
      topA[c] = Math.min(lim, mx);
      botA[c] = Math.max(-lim, mn);
    }
    // Filled min/max body — ONE closed polygon (top envelope out, bottom back).
    // Silence columns collapse onto the center line (or the DC line when
    // dcOffset ≠ 0 — that IS the module's lesson); the envelope stroke below
    // keeps that flat line visible.
    const body = Skia.Path.Make();
    body.moveTo(0.5 * colW, yOf(topA[0]));
    for (let c = 1; c < cols; c++) body.lineTo((c + 0.5) * colW, yOf(topA[c]));
    for (let c = cols - 1; c >= 0; c--) body.lineTo((c + 0.5) * colW, yOf(botA[c]));
    body.close();
    // Red sheared flat-tops where |x| ≥ 1 post-gain (run-length merged).
    const caps = Skia.Path.Make();
    if (showClip) {
      const addRuns = (flags: boolean[], y: number) => {
        let s0 = -1;
        for (let c = 0; c <= cols; c++) {
          const on = c < cols && flags[c];
          if (on && s0 < 0) s0 = c;
          if (!on && s0 >= 0) {
            caps.addRect(Skia.XYWHRect(s0 * colW, y - 1.3, (c - s0) * colW, 2.6));
            s0 = -1;
          }
        }
      };
      addRuns(clT, yOf(1));
      addRuns(clB, yOf(-1));
    }
    // dB gridlines: linear-amplitude positions of −6 / −12 / −24 dBFS.
    const grid = Skia.Path.Make();
    for (const d of [-6, -12, -24]) {
      const a = Math.pow(10, d / 20);
      for (const s2 of [1, -1]) {
        grid.moveTo(0, yOf(a * s2));
        grid.lineTo(w, yOf(a * s2));
      }
    }
    const rails = Skia.Path.Make();
    rails.moveTo(0, yOf(1));
    rails.lineTo(w, yOf(1));
    rails.moveTo(0, yOf(-1));
    rails.lineTo(w, yOf(-1));
    return { body, caps, grid, rails, stats };
  }, [p.signal, gain, dc, inv, showClip, w, h]); // eslint-disable-line react-hooks/exhaustive-deps

  // Playhead sweeping the loop on the phase clock (the ONLY per-frame path).
  const playhead = useDerivedValue(() => {
    const f = frac01(p.phase.value);
    const x = 2 + f * (w - 4);
    const pth = Skia.Path.Make();
    pth.moveTo(x, 3);
    pth.lineTo(x, h - 3);
    pth.moveTo(x - 4.5, 3);
    pth.lineTo(x + 4.5, 3);
    pth.lineTo(x, 10);
    pth.close();
    return pth;
  }, [p.phase, w, h]);

  const st = S.stats;
  const statLine = `PK ${st.pkDb.toFixed(1)}  RMS ${st.rmsDb.toFixed(1)}  CF ${st.crest.toFixed(1)} dB`;
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ position: 'absolute', width: w, height: h, backgroundColor: BG }}>
        <Path path={S.grid} color={GHOST} style="stroke" strokeWidth={1} />
        <SkLine p1={{ x: 0, y: yOf(0) }} p2={{ x: w, y: yOf(0) }} color="#3a3b43" strokeWidth={1.2} />
        <Path path={S.rails} color={showClip ? RED : '#33343c'} style="stroke" strokeWidth={1.1} opacity={showClip ? 0.85 : 1} />
        <Path path={S.body}>
          <LinearGradient
            start={vec(0, yOf(1))}
            end={vec(0, yOf(-1))}
            colors={['#ffd47c', '#a86f18', '#5e3d0c', '#a86f18', '#ffd47c']}
            positions={[0, 0.28, 0.5, 0.72, 1]}
          />
        </Path>
        <Path path={S.body} color={AMBER} style="stroke" strokeWidth={1.1} opacity={0.85} />
        {showClip ? (
          <>
            <Path path={S.caps} color={RED} opacity={0.55}>
              <BlurMask blur={3} style="normal" />
            </Path>
            <Path path={S.caps} color={RED} />
          </>
        ) : null}
        <Path path={playhead} color="#ffffff" style="stroke" strokeWidth={2.6} opacity={0.18}>
          <BlurMask blur={2.5} style="normal" />
        </Path>
        <Path path={playhead} color="#e8ecf4" style="stroke" strokeWidth={1.1} opacity={0.9} />
      </Canvas>
      <Lbl x={3} y={yOf(1) - 4} w={30} align="left" size={7} color={showClip ? RED : TEXT_DIM}>
        0
      </Lbl>
      {[-6, -12, -24].map((d) => (
        <Lbl key={d} x={3} y={yOf(Math.pow(10, d / 20)) - 4} w={30} align="left" size={7}>
          {`${d}`}
        </Lbl>
      ))}
      <Lbl x={w - 170} y={4} w={166} align="right" size={7}>
        {statLine}
      </Lbl>
      {Math.abs(st.dc) > 0.004 ? (
        <Lbl x={w - 170} y={14} w={166} align="right" size={7} color={AMBER}>
          {`DC ${st.dc >= 0 ? '+' : ''}${st.dc.toFixed(2)}`}
        </Lbl>
      ) : null}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// M2 — Peak meter

/** M2 — segmented digital peak meter with peak-hold + OVER lamp. Driven by
 *  the phase clock scanning the chosen signal (live-feel, deterministic). */
export function PeakMeterView(p: {
  width: number;
  height?: number;
  signal: SignalKey;
  gain?: number;
  phase: SharedValue<number>;
}) {
  const w = p.width;
  const h = p.height ?? 190;
  const gain = p.gain ?? 1;

  // Rack-gear layout: brushed panel, inset bezel well, two LED columns with a
  // tick/label gutter between them.
  const wellW = Math.min(210, Math.max(150, w * 0.56));
  const wellX = (w - wellW) / 2;
  const wellY = 30;
  const wellH = h - wellY - 26;
  const gutter = 40;
  const padI = 9;
  const colWpx = (wellW - gutter - padI * 2) / 2;
  const colLx = wellX + padI;
  const colRx = wellX + padI + colWpx + gutter;
  const barTop = wellY + 7;
  const barBot = wellY + wellH - 7;
  const span = barBot - barTop;
  const SEG = 66; // fine LED segmentation (owner: ≥60, 1px gaps)
  const segH = span / SEG;
  const yDb = (d: number) => barBot - ((d + 60) / 60) * span;

  // Precomputed per-loop envelopes: fast-attack windowed peak + PPM-style
  // release, peak-hold ladder, and the latching OVER series (all meterEngine
  // math — db() over renderSignal buffers).
  const E = useMemo(() => {
    const n = 2048;
    const mk = (seed: number, gDb: number, shift: number) => {
      const buf = renderSignal(p.signal, n, seed);
      const g = gain * Math.pow(10, gDb / 20);
      const win = Math.max(8, Math.floor(n / 48));
      const pk = new Array<number>(RES);
      for (let i = 0; i < RES; i++) {
        const c0 = Math.floor((((i + shift) % RES) * n) / RES);
        let m = 0;
        for (let k = -(win >> 1); k <= win >> 1; k++) {
          const v = Math.abs(buf[(c0 + k + n) % n] * g);
          if (v > m) m = v;
        }
        pk[i] = db(m);
      }
      // Release ≈ 37 dB/s at the 4 s teaching loop (attack is instantaneous —
      // pk IS the attack); two circular passes settle the wrap seam.
      const rel = 0.62;
      const env = pk.slice();
      for (let pass = 0; pass < 2; pass++) {
        for (let i = 0; i < RES; i++) {
          const prev = env[(i - 1 + RES) % RES];
          env[i] = Math.max(pk[i], prev - rel);
        }
      }
      // Floating peak-hold: latches the loop max so far, holds ~1 s of scan,
      // then decays slowly — NON-circular, so it resets at the loop top.
      const hold = new Array<number>(RES);
      let hv = -80;
      let age = 0;
      for (let i = 0; i < RES; i++) {
        if (pk[i] >= hv) {
          hv = pk[i];
          age = 0;
        } else {
          age++;
          if (age > 60) hv -= 0.34;
        }
        hold[i] = hv;
      }
      return { env, hold, pk };
    };
    // Two channels of the SAME signal with a tiny deterministic offset
    // (seed + −1.4 dB + 6-window scan shift) — reads as a real stereo feed.
    const L = mk(1, 0, 0);
    const R = mk(2, -1.4, 6);
    // OVER latch — lights at ≥ 0 dBFS and STAYS lit; resets each loop.
    const over = new Array<number>(RES);
    let ov = 0;
    for (let i = 0; i < RES; i++) {
      if (L.pk[i] >= -0.05 || R.pk[i] >= -0.05) ov = 1;
      over[i] = ov;
    }
    const crest = crestDb(renderSignal(p.signal, n, 1).map((v) => v * gain));
    return { envL: L.env, envR: R.env, holdL: L.hold, holdR: R.hold, over, crest };
  }, [p.signal, gain]);

  // Static geometry: unlit LED stacks per zone, scale ticks, bezel well.
  const G = useMemo(() => {
    const unlit: [SkPathT, SkPathT, SkPathT] = [Skia.Path.Make(), Skia.Path.Make(), Skia.Path.Make()];
    for (let i = 0; i < SEG; i++) {
      const hi = -60 + ((i + 1) * 60) / SEG;
      const z = hi <= -18 ? 0 : hi <= -6 ? 1 : 2;
      const y = yDb(hi);
      unlit[z].addRect(Skia.XYWHRect(colLx, y, colWpx, segH - 1));
      unlit[z].addRect(Skia.XYWHRect(colRx, y, colWpx, segH - 1));
    }
    const ticks = Skia.Path.Make();
    for (const d of [0, -3, -6, -12, -20, -30, -40, -50, -60]) {
      const y = yDb(d);
      ticks.moveTo(colLx + colWpx + 3, y);
      ticks.lineTo(colLx + colWpx + 8, y);
      ticks.moveTo(colRx - 8, y);
      ticks.lineTo(colRx - 3, y);
    }
    const well = Skia.Path.Make();
    well.addRRect(Skia.RRectXY(Skia.XYWHRect(wellX - 8, wellY - 8, wellW + 16, wellH + 16), 8, 8));
    const lamp = Skia.Path.Make();
    lamp.addRRect(Skia.RRectXY(Skia.XYWHRect(w / 2 - 26, 8, 52, 15), 4, 4));
    return { unlit, ticks, well, lamp };
  }, [w, h]); // eslint-disable-line react-hooks/exhaustive-deps

  const envL = E.envL;
  const envR = E.envR;
  const holdL = E.holdL;
  const holdR = E.holdR;
  const overArr = E.over;

  // Per-frame: three zone paths (both channels each), the hold caps, and the
  // OVER lamp opacity — 5 fixed animated bindings, worklet-only.
  const litGreen = useDerivedValue(() => {
    const idx = Math.min(RES - 1, Math.floor(frac01(p.phase.value) * RES));
    const pth = Skia.Path.Make();
    const lv: [number, number] = [envL[idx], envR[idx]];
    const xs: [number, number] = [colLx, colRx];
    for (let ch = 0; ch < 2; ch++) {
      for (let i = 0; i < 66; i++) {
        const lo = -60 + (i * 60) / 66;
        const hi = lo + 60 / 66;
        if (hi > -18) break;
        if (lv[ch] <= lo) break;
        pth.addRect(Skia.XYWHRect(xs[ch], barBot - ((hi + 60) / 60) * span, colWpx, segH - 1));
      }
    }
    return pth;
  }, [p.phase, envL, envR]);

  const litAmber = useDerivedValue(() => {
    const idx = Math.min(RES - 1, Math.floor(frac01(p.phase.value) * RES));
    const pth = Skia.Path.Make();
    const lv: [number, number] = [envL[idx], envR[idx]];
    const xs: [number, number] = [colLx, colRx];
    for (let ch = 0; ch < 2; ch++) {
      for (let i = 0; i < 66; i++) {
        const lo = -60 + (i * 60) / 66;
        const hi = lo + 60 / 66;
        if (hi <= -18) continue;
        if (hi > -6) break;
        if (lv[ch] <= lo) break;
        pth.addRect(Skia.XYWHRect(xs[ch], barBot - ((hi + 60) / 60) * span, colWpx, segH - 1));
      }
    }
    return pth;
  }, [p.phase, envL, envR]);

  const litRed = useDerivedValue(() => {
    const idx = Math.min(RES - 1, Math.floor(frac01(p.phase.value) * RES));
    const pth = Skia.Path.Make();
    const lv: [number, number] = [envL[idx], envR[idx]];
    const xs: [number, number] = [colLx, colRx];
    for (let ch = 0; ch < 2; ch++) {
      for (let i = 0; i < 66; i++) {
        const lo = -60 + (i * 60) / 66;
        const hi = lo + 60 / 66;
        if (hi <= -6) continue;
        if (lv[ch] <= lo) break;
        pth.addRect(Skia.XYWHRect(xs[ch], barBot - ((hi + 60) / 60) * span, colWpx, segH - 1));
      }
    }
    return pth;
  }, [p.phase, envL, envR]);

  const caps = useDerivedValue(() => {
    const idx = Math.min(RES - 1, Math.floor(frac01(p.phase.value) * RES));
    const pth = Skia.Path.Make();
    const hL = Math.max(-59, Math.min(0.4, holdL[idx]));
    const hR = Math.max(-59, Math.min(0.4, holdR[idx]));
    pth.addRect(Skia.XYWHRect(colLx, barBot - ((hL + 60) / 60) * span - 1.2, colWpx, 2.4));
    pth.addRect(Skia.XYWHRect(colRx, barBot - ((hR + 60) / 60) * span - 1.2, colWpx, 2.4));
    return pth;
  }, [p.phase, holdL, holdR]);

  const overO = useDerivedValue(() => {
    return overArr[Math.min(RES - 1, Math.floor(frac01(p.phase.value) * RES))];
  }, [p.phase, overArr]);

  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ position: 'absolute', width: w, height: h, backgroundColor: BG }}>
        <BrushedPanel w={w} h={h} />
        <Screw x={12} y={12} r={3.6} slotDeg={25} />
        <Screw x={w - 12} y={12} r={3.6} slotDeg={80} />
        <Screw x={12} y={h - 12} r={3.6} slotDeg={130} />
        <Screw x={w - 12} y={h - 12} r={3.6} slotDeg={60} />
        {/* Inset bezel well. */}
        <Path path={G.well} color="#08090b" />
        <Path path={G.well} color="#000000" style="stroke" strokeWidth={1.6} opacity={0.8} />
        <Path path={G.well} color="#3d4049" style="stroke" strokeWidth={0.8} opacity={0.5} />
        {/* Unlit LED stacks — the meter face at rest. */}
        <Path path={G.unlit[0]} color="#122419" opacity={0.95} />
        <Path path={G.unlit[1]} color="#2a2312" opacity={0.95} />
        <Path path={G.unlit[2]} color="#2b1412" opacity={0.95} />
        {/* Lit stacks (per-frame). */}
        <Path path={litGreen} color="#43e97b" />
        <Path path={litAmber} color={AMBER} />
        <Path path={litRed} color="#ff5f4e" opacity={0.6}>
          <BlurMask blur={4} style="normal" />
        </Path>
        <Path path={litRed} color="#ff5f4e" />
        {/* Floating peak-hold caps. */}
        <Path path={caps} color="#f2f5fa" />
        <Path path={G.ticks} color="#565a64" style="stroke" strokeWidth={1} />
        {/* Latching OVER lamp. */}
        <Path path={G.lamp} color="#1c0f10" />
        <Path path={G.lamp} color="#000000" style="stroke" strokeWidth={1.2} opacity={0.8} />
        <Path path={G.lamp} color={withAlpha(RED, 0.6)} opacity={overO}>
          <BlurMask blur={6} style="normal" />
        </Path>
        <Path path={G.lamp} color={RED} opacity={overO} />
      </Canvas>
      <Lbl x={10} y={6} w={140} align="left" size={8} font={fonts.oswaldSemiBold} ls={1}>
        PEAK PROGRAM
      </Lbl>
      <Lbl x={w / 2 - 26} y={11} w={52} size={7.5} color="#f4d9d5" ls={1.5}>
        OVER
      </Lbl>
      {[0, -6, -12, -20, -30, -40, -50, -60].map((d) => (
        <Lbl key={d} x={w / 2 - 13} y={yDb(d) - 4} w={26} size={6.5}>
          {`${d}`}
        </Lbl>
      ))}
      <Lbl x={colLx + colWpx / 2 - 10} y={barBot + 6} w={20} size={8} color="#9aa0ac">
        L
      </Lbl>
      <Lbl x={colRx + colWpx / 2 - 10} y={barBot + 6} w={20} size={8} color="#9aa0ac">
        R
      </Lbl>
      <Lbl x={w / 2 - 16} y={barBot + 6} w={32} size={6.5}>
        dBFS
      </Lbl>
      <Lbl x={10} y={h - 13} w={120} align="left" size={7}>
        {`CREST ${E.crest.toFixed(1)} dB`}
      </Lbl>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// M3 ⭐ — the classic VU (the lab's flagship face)

/** M3 — THE flagship classic VU: high-res cream face, arc scale −20..+3, red
 *  zone, physically-ballistic needle (vuStep), glass + bezel. Rendered LARGE. */
export function VuMeterView(p: {
  width: number;
  height?: number;
  signal: SignalKey;
  gain?: number;
  phase: SharedValue<number>;
  /** Also draw a fast peak LED beside the face (the peak-vs-average lesson). */
  showPeakLed?: boolean;
  /** Wall-seconds one loop of the phase clock represents (ballistics scale). */
  loopSeconds?: number;
  /** Linear RMS that reads 0 VU (illustrative calibration). */
  rms0?: number;
}) {
  const w = p.width;
  const h = p.height ?? 230;
  const gain = p.gain ?? 1;
  const showLed = p.showPeakLed ?? false;
  const LOOP = p.loopSeconds ?? 4;
  const RMS0 = p.rms0 ?? 0.42;

  // Face geometry: pivot low-center, scale arc spanning ±48°. Deflection is
  // linear in VOLTAGE (10^(dB/20), full scale at +3) — which is exactly why 0
  // sits ~71% of the way across a real VU face.
  const A = 48;
  const bez = 10;
  const fx = bez + 3;
  const fy = bez + 3;
  const fw = w - (bez + 3) * 2;
  const fh = h - (bez + 3) * 2;
  const cx = w / 2;
  const py = h - 34;
  const R = Math.min(py - fy - 30, (w / 2 - bez - 30) / Math.sin(A * DEG));
  const angDb = (d: number) => (-A + 96 * (Math.pow(10, d / 20) / Math.pow(10, 3 / 20))) * DEG;

  // ── Printed face: arcs, ticks, red wedge, label anchors (static) ──────────
  const G = useMemo(() => {
    const pt = (ang: number, r: number) => ({ x: cx + Math.sin(ang) * r, y: py - Math.cos(ang) * r });
    const majors = [-20, -10, -7, -5, -3, -1, 0, 1, 2, 3];
    const minors = [-18, -15, -12, -9, -8, -6, -4, -2, -0.5, 0.5, 1.5, 2.5];
    const tickB = Skia.Path.Make();
    const tickR = Skia.Path.Make();
    for (const d of majors) {
      const a = angDb(d);
      const p0 = pt(a, R + 2);
      const p1 = pt(a, R + 13);
      const tp = d >= 0.5 ? tickR : tickB;
      tp.moveTo(p0.x, p0.y);
      tp.lineTo(p1.x, p1.y);
    }
    for (const d of minors) {
      const a = angDb(d);
      const p0 = pt(a, R + 2);
      const p1 = pt(a, R + 8);
      const tp = d >= 0.5 ? tickR : tickB;
      tp.moveTo(p0.x, p0.y);
      tp.lineTo(p1.x, p1.y);
    }
    // Printed arc along the tick base: black −20..0, then the RED zone wedge.
    const oval = Skia.XYWHRect(cx - (R + 2), py - (R + 2), 2 * (R + 2), 2 * (R + 2));
    const arcB = Skia.Path.Make();
    arcB.addArc(oval, angDb(-20) / DEG - 90, (angDb(0) - angDb(-20)) / DEG);
    const wedge = Skia.Path.Make();
    const rO = R + 11;
    const rI = R + 2;
    const oO = Skia.XYWHRect(cx - rO, py - rO, 2 * rO, 2 * rO);
    const oI = Skia.XYWHRect(cx - rI, py - rI, 2 * rI, 2 * rI);
    const a0 = angDb(0) / DEG - 90;
    const a1 = angDb(3) / DEG - 90;
    const st = pt(angDb(0), rO);
    wedge.moveTo(st.x, st.y);
    wedge.arcToOval(oO, a0, a1 - a0, false);
    const ie = pt(angDb(3), rI);
    wedge.lineTo(ie.x, ie.y);
    wedge.arcToOval(oI, a1, a0 - a1, false);
    wedge.close();
    // Bezel + face plates.
    const outer = Skia.Path.Make();
    outer.addRRect(Skia.RRectXY(Skia.XYWHRect(0, 0, w, h), 14, 14));
    const face = Skia.Path.Make();
    face.addRRect(Skia.RRectXY(Skia.XYWHRect(fx, fy, fw, fh), 8, 8));
    const topShade = Skia.Path.Make();
    topShade.addRect(Skia.XYWHRect(fx, fy, fw, 14));
    // Diagonal glass sheen band.
    const sheen = Skia.Path.Make();
    sheen.moveTo(fx + fw * 0.58, fy + 2);
    sheen.lineTo(fx + fw * 0.82, fy + 2);
    sheen.lineTo(fx + fw * 0.34, fy + fh - 2);
    sheen.lineTo(fx + fw * 0.12, fy + fh - 2);
    sheen.close();
    // Label anchors for the RNText numerals (printed scale typography).
    const labels = majors.map((d) => {
      const lp = pt(angDb(d), R + 21);
      return { d, x: lp.x, y: lp.y };
    });
    return { tickB, tickR, arcB, wedge, outer, face, topShade, sheen, labels };
  }, [w, h]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Precomputed loop series: windowed RMS (needle target) + peak LED ──────
  const B = useMemo(() => {
    const n = 2048;
    const buf = renderSignal(p.signal, n).map((v) => v * gain);
    const winR = Math.max(16, Math.floor(n / 16));
    const rms = new Array<number>(RES);
    for (let i = 0; i < RES; i++) {
      const c0 = Math.floor((i * n) / RES);
      let s = 0;
      for (let k = 0; k < winR; k++) {
        const v = buf[(c0 + k) % n];
        s += v * v;
      }
      rms[i] = Math.sqrt(s / winR);
    }
    // Fast peak LED series: short window, ~120 ms afterglow.
    const winP = Math.max(8, Math.floor(n / 64));
    const led = new Array<number>(RES).fill(0);
    for (let i = 0; i < RES; i++) {
      const c0 = Math.floor((i * n) / RES);
      let m = 0;
      for (let k = 0; k < winP; k++) m = Math.max(m, Math.abs(buf[(c0 + k) % n]));
      if (m >= 0.72) {
        for (let k = 0; k < 7; k++) led[(i + k) % RES] = Math.max(led[(i + k) % RES], 1 - k / 7);
      }
    }
    return { rms, led };
  }, [p.signal, gain]);

  const rmsArr = B.rms;
  const ledArr = B.led;

  // ── REAL ballistics, integrated per frame on the UI thread ────────────────
  // vuStep (meterEngine, inlined for the worklet): the 300 ms first-order
  // integrator chasing the scanned RMS series — the needle CANNOT catch
  // transients, which is the whole M3 lesson. A lightly under-damped
  // second-order follower rides on top for the gentle mechanical overshoot.
  const vuVal = useSharedValue(0);
  const nx = useSharedValue(0);
  const nv = useSharedValue(0);
  const lastPh = useSharedValue(-1);

  const needleRad = useDerivedValue(() => {
    const ph = p.phase.value;
    let dt = 0;
    if (lastPh.value >= 0) {
      let d = ph - lastPh.value;
      if (d < 0) d = 0;
      dt = (d / (Math.PI * 2)) * LOOP;
      if (dt > 0.08) dt = 0.08;
    }
    lastPh.value = ph;
    const f = frac01(ph);
    const target = rmsArr[Math.min(RES - 1, Math.floor(f * RES))];
    // meterEngine.vuStep math — tc = 0.3 s:
    const a = 1 - Math.exp(-dt / 0.3);
    vuVal.value = vuVal.value + (target - vuVal.value) * a;
    // Under-damped follower (ωn ≈ 18 rad/s, ζ ≈ 0.73) → gentle overshoot.
    const acc = (vuVal.value - nx.value) * 340 - nv.value * 27;
    nv.value = nv.value + acc * dt;
    nx.value = nx.value + nv.value * dt;
    let pct = nx.value / (RMS0 * 1.4125);
    if (pct < -0.015) pct = -0.015;
    if (pct > 1.06) pct = 1.06;
    return (-48 + 96 * pct) * (Math.PI / 180);
  }, [p.phase, rmsArr, LOOP, RMS0]);

  // Tapered needle + counterweight tail, rebuilt in WORLD coordinates per
  // frame (house rule: geometry in worklets, no animated CTM).
  const needlePath = useDerivedValue(() => {
    const th = needleRad.value;
    const s = Math.sin(th);
    const c = Math.cos(th);
    const tipR = R + 8;
    const tailR = -18;
    const wb = 3.0;
    const wt = 1.0;
    const bx = cx + s * tailR;
    const by = py - c * tailR;
    const tx = cx + s * tipR;
    const ty = py - c * tipR;
    const pth = Skia.Path.Make();
    pth.moveTo(bx + c * wb, by + s * wb);
    pth.lineTo(tx + c * wt, ty + s * wt);
    pth.lineTo(tx - c * wt, ty - s * wt);
    pth.lineTo(bx - c * wb, by - s * wb);
    pth.close();
    return pth;
  }, [needleRad]);

  const needleShadow = useDerivedValue(() => {
    const th = needleRad.value;
    const s = Math.sin(th);
    const c = Math.cos(th);
    const tipR = R + 8;
    const tailR = -18;
    const wb = 3.0;
    const wt = 1.0;
    const ox = 2.4;
    const oy = 3.4;
    const bx = cx + s * tailR + ox;
    const by = py - c * tailR + oy;
    const tx = cx + s * tipR + ox;
    const ty = py - c * tipR + oy;
    const pth = Skia.Path.Make();
    pth.moveTo(bx + c * wb, by + s * wb);
    pth.lineTo(tx + c * wt, ty + s * wt);
    pth.lineTo(tx - c * wt, ty - s * wt);
    pth.lineTo(bx - c * wb, by - s * wb);
    pth.close();
    return pth;
  }, [needleRad]);

  const ledO = useDerivedValue(() => {
    return ledArr[Math.min(RES - 1, Math.floor(frac01(p.phase.value) * RES))];
  }, [p.phase, ledArr]);

  const ledX = fx + fw - 22;
  const ledY = fy + 20;
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ position: 'absolute', width: w, height: h, backgroundColor: BG }}>
        {/* Housing: dark rounded bezel with corner screws. */}
        <Path path={G.outer}>
          <LinearGradient start={vec(0, 0)} end={vec(0, h)} colors={['#26272e', '#131418', '#0b0b0e']} positions={[0, 0.6, 1]} />
        </Path>
        <Path path={G.outer} color="#000000" style="stroke" strokeWidth={1.4} opacity={0.7} />
        <Screw x={12} y={12} r={4.2} slotDeg={20} />
        <Screw x={w - 12} y={12} r={4.2} slotDeg={75} />
        <Screw x={12} y={h - 12} r={4.2} slotDeg={130} />
        <Screw x={w - 12} y={h - 12} r={4.2} slotDeg={100} />
        {/* Warm cream face: radial light + edge vignette + bezel drop shade. */}
        <Path path={G.face}>
          <RadialGradient c={vec(cx, fy + fh * 0.3)} r={fw * 0.8} colors={['#f8eecf', '#f0e0b4', '#e2cd98']} />
        </Path>
        <Path path={G.face}>
          <RadialGradient
            c={vec(cx, py - R * 0.5)}
            r={fw * 0.78}
            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0)', 'rgba(84,52,18,0.30)']}
            positions={[0, 0.72, 1]}
          />
        </Path>
        <Path path={G.topShade}>
          <LinearGradient start={vec(0, fy)} end={vec(0, fy + 14)} colors={['rgba(0,0,0,0.26)', 'rgba(0,0,0,0)']} />
        </Path>
        {/* Printed scale: red zone wedge, arc, fine minors, majors. */}
        <Path path={G.wedge} color="#c9382e" opacity={0.92} />
        <Path path={G.arcB} color="#2b2317" style="stroke" strokeWidth={1.8} />
        <Path path={G.tickB} color="#2b2317" style="stroke" strokeWidth={1.4} />
        <Path path={G.tickR} color="#6e1710" style="stroke" strokeWidth={1.4} />
        {/* Fast PEAK LED beside the face (the contrast lesson in one glance). */}
        {showLed ? (
          <>
            <Circle cx={ledX} cy={ledY} r={5} color="#42150f" />
            <Circle cx={ledX} cy={ledY} r={9} color={withAlpha(RED, 0.6)} opacity={ledO}>
              <BlurMask blur={6} style="normal" />
            </Circle>
            <Circle cx={ledX} cy={ledY} r={4.4} color="#ff4d3c" opacity={ledO} />
            <Circle cx={ledX} cy={ledY} r={5} color="#1d0c09" style="stroke" strokeWidth={1} />
          </>
        ) : null}
        {/* Needle: soft drop shadow, tapered blade, pivot boss + screw. */}
        <Path path={needleShadow} color="#000000" opacity={0.18}>
          <BlurMask blur={3} style="normal" />
        </Path>
        <Path path={needlePath} color="#17130c" />
        <Circle cx={cx} cy={py} r={10}>
          <RadialGradient c={vec(cx - 3, py - 3)} r={16} colors={['#4a4c55', '#232429', '#101114']} />
        </Circle>
        <Circle cx={cx} cy={py} r={3.6} color="#0c0d10" />
        <SkLine p1={{ x: cx - 2.4, y: py - 1.4 }} p2={{ x: cx + 2.4, y: py + 1.4 }} color="#3f424b" strokeWidth={1.1} />
        {/* Glass: diagonal specular sheen band + inner lip. */}
        <Path path={G.sheen}>
          <LinearGradient
            start={vec(fx + fw * 0.7, fy)}
            end={vec(fx + fw * 0.2, fy + fh)}
            colors={['rgba(255,255,255,0.13)', 'rgba(255,255,255,0.02)']}
          />
        </Path>
        <Path path={G.face} color="#07080a" style="stroke" strokeWidth={3} opacity={0.9} />
        <Path path={G.face} color="#4b4e57" style="stroke" strokeWidth={0.8} opacity={0.5} />
      </Canvas>
      {/* Printed numerals (mono) — black ink below 0, red in the hot zone. */}
      {G.labels.map((l) => (
        <Lbl
          key={l.d}
          x={l.x - 12}
          y={l.y - 5}
          w={24}
          size={l.d === 0 ? 11 : 9.5}
          color={l.d >= 1 ? '#b3271e' : '#2e2618'}
        >
          {l.d > 0 ? `+${l.d}` : `${l.d}`}
        </Lbl>
      ))}
      <Lbl x={cx - 22} y={py - R * 0.34} w={44} size={21} font={fonts.oswaldSemiBold} color="#2b2417" ls={3}>
        VU
      </Lbl>
      {showLed ? (
        <Lbl x={ledX - 20} y={ledY + 9} w={40} size={6.5} color="#8c2f24" ls={1}>
          PEAK
        </Lbl>
      ) : null}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// M4 — Loudness (LUFS)

/** M4 — loudness meter: M/S bars, integrated readout, LRA band, TP lamp,
 *  scrolling history strip (from meterEngine.simulateLoudness). */
export function LoudnessView(p: {
  width: number;
  height?: number;
  signal: SignalKey;
  phase: SharedValue<number>;
}) {
  const w = p.width;
  const h = p.height ?? 220;
  const sim = useMemo(() => simulateLoudness(p.signal), [p.signal]);
  const N = sim.momentary.length;

  // Layout: M/S bars left · integrated + LRA center · history strip right.
  const mX = 38;
  const barW = 22;
  const sX = mX + barW + 12;
  const barTop = 36;
  const barBot = h - 38;
  const yL = (v: number) => barBot - ((Math.max(-36, Math.min(0, v)) + 36) / 36) * (barBot - barTop);
  const histW = Math.max(90, w * 0.32);
  const histX = w - 14 - histW;
  const histTop = 48;
  const histBot = h - 64;
  const yH = (v: number) => histBot - ((Math.max(-36, Math.min(0, v)) + 36) / 36) * (histBot - histTop);
  const hx = (i: number) => histX + (i / (N - 1)) * histW;
  const cX0 = sX + barW + 20;
  const cX1 = histX - 16;
  const cMid = (cX0 + cX1) / 2;
  const xLufs = (v: number) => cX0 + ((Math.max(-36, Math.min(0, v)) + 36) / 36) * (cX1 - cX0);
  const over = sim.truePeakDbtp > -1;

  const G = useMemo(() => {
    const panel = Skia.Path.Make();
    panel.addRRect(Skia.RRectXY(Skia.XYWHRect(0, 0, w, h), 12, 12));
    const wells = Skia.Path.Make();
    wells.addRRect(Skia.RRectXY(Skia.XYWHRect(mX - 2, barTop - 2, barW + 4, barBot - barTop + 4), 3, 3));
    wells.addRRect(Skia.RRectXY(Skia.XYWHRect(sX - 2, barTop - 2, barW + 4, barBot - barTop + 4), 3, 3));
    const ticks = Skia.Path.Make();
    for (const v of [0, -9, -18, -27, -36]) {
      ticks.moveTo(mX - 8, yL(v));
      ticks.lineTo(mX - 3, yL(v));
    }
    const target = Skia.Path.Make();
    target.moveTo(mX - 6, yL(-14));
    target.lineTo(sX + barW + 6, yL(-14));
    // History frame + grid + the precomputed short-term polyline.
    const hFrame = Skia.Path.Make();
    hFrame.addRect(Skia.XYWHRect(histX, histTop, histW, histBot - histTop));
    const hGrid = Skia.Path.Make();
    for (const v of [-9, -18, -27]) {
      hGrid.moveTo(histX, yH(v));
      hGrid.lineTo(histX + histW, yH(v));
    }
    const hTarget = Skia.Path.Make();
    hTarget.moveTo(histX, yH(-14));
    hTarget.lineTo(histX + histW, yH(-14));
    const poly = Skia.Path.Make();
    const fill = Skia.Path.Make();
    poly.moveTo(hx(0), yH(sim.short[0]));
    fill.moveTo(hx(0), histBot);
    fill.lineTo(hx(0), yH(sim.short[0]));
    for (let i = 1; i < N; i++) {
      poly.lineTo(hx(i), yH(sim.short[i]));
      fill.lineTo(hx(i), yH(sim.short[i]));
    }
    fill.lineTo(hx(N - 1), histBot);
    fill.close();
    // LRA bracket bar around the integrated value.
    const lraY = 148;
    const lo = sim.integratedLufs - sim.lraLu / 2;
    const hi = sim.integratedLufs + sim.lraLu / 2;
    const lraTrack = Skia.Path.Make();
    lraTrack.moveTo(cX0, lraY);
    lraTrack.lineTo(cX1, lraY);
    const lraBar = Skia.Path.Make();
    lraBar.addRect(Skia.XYWHRect(xLufs(lo), lraY - 3, Math.max(4, xLufs(hi) - xLufs(lo)), 6));
    lraBar.moveTo(xLufs(lo), lraY - 7);
    lraBar.lineTo(xLufs(lo), lraY + 7);
    lraBar.moveTo(xLufs(hi), lraY - 7);
    lraBar.lineTo(xLufs(hi), lraY + 7);
    const iTick = Skia.Path.Make();
    iTick.moveTo(xLufs(sim.integratedLufs), lraY - 8);
    iTick.lineTo(xLufs(sim.integratedLufs), lraY + 8);
    return { panel, wells, ticks, target, hFrame, hGrid, hTarget, poly, fill, lraTrack, lraBar, iTick, lraY };
  }, [w, h, sim]); // eslint-disable-line react-hooks/exhaustive-deps

  const mom = sim.momentary;
  const sho = sim.short;

  // Per-frame: M bar, S bar, bright tips, history cursor, TP lamp pulse.
  const mBar = useDerivedValue(() => {
    const idx = Math.min(N - 1, Math.floor(frac01(p.phase.value) * N));
    const v = Math.max(-36, Math.min(0, mom[idx]));
    const y = barBot - ((v + 36) / 36) * (barBot - barTop);
    const pth = Skia.Path.Make();
    pth.addRect(Skia.XYWHRect(mX, y, barW, barBot - y));
    return pth;
  }, [p.phase, mom]);

  const sBar = useDerivedValue(() => {
    const idx = Math.min(N - 1, Math.floor(frac01(p.phase.value) * N));
    const v = Math.max(-36, Math.min(0, sho[idx]));
    const y = barBot - ((v + 36) / 36) * (barBot - barTop);
    const pth = Skia.Path.Make();
    pth.addRect(Skia.XYWHRect(sX, y, barW, barBot - y));
    return pth;
  }, [p.phase, sho]);

  const barTips = useDerivedValue(() => {
    const idx = Math.min(N - 1, Math.floor(frac01(p.phase.value) * N));
    const vm = Math.max(-36, Math.min(0, mom[idx]));
    const vs = Math.max(-36, Math.min(0, sho[idx]));
    const pth = Skia.Path.Make();
    pth.addRect(Skia.XYWHRect(mX, barBot - ((vm + 36) / 36) * (barBot - barTop) - 1, barW, 2));
    pth.addRect(Skia.XYWHRect(sX, barBot - ((vs + 36) / 36) * (barBot - barTop) - 1, barW, 2));
    return pth;
  }, [p.phase, mom, sho]);

  const cursor = useDerivedValue(() => {
    const f = frac01(p.phase.value);
    const idx = Math.min(N - 1, Math.floor(f * N));
    const x = histX + (idx / (N - 1)) * histW;
    const v = Math.max(-36, Math.min(0, sho[idx]));
    const y = histBot - ((v + 36) / 36) * (histBot - histTop);
    const pth = Skia.Path.Make();
    pth.moveTo(x, histTop);
    pth.lineTo(x, histBot);
    pth.addCircle(x, y, 2.4);
    return pth;
  }, [p.phase, sho]);

  const tpO = useDerivedValue(() => {
    return over ? 0.72 + 0.28 * Math.sin(p.phase.value * 2) : 0;
  }, [p.phase, over]);

  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ position: 'absolute', width: w, height: h, backgroundColor: BG }}>
        {/* Dark-glass instrument panel. */}
        <Path path={G.panel}>
          <LinearGradient start={vec(0, 0)} end={vec(0, h)} colors={['#171b22', '#0c0e12']} />
        </Path>
        <Path path={G.panel} color={GRID} style="stroke" strokeWidth={1.2} />
        <SkLine p1={{ x: 10, y: 2 }} p2={{ x: w - 10, y: 2 }} color="#39404d" strokeWidth={1} opacity={0.6} />
        {/* M / S bars on the −36..0 LUFS scale, −14 target line. */}
        <Path path={G.wells} color="#0a0c0f" />
        <Path path={G.wells} color={GHOST} style="stroke" strokeWidth={1} />
        <Path path={mBar}>
          <LinearGradient start={vec(0, barTop)} end={vec(0, barBot)} colors={['#a9ccff', '#4a7fd6']} />
        </Path>
        <Path path={sBar}>
          <LinearGradient start={vec(0, barTop)} end={vec(0, barBot)} colors={['#8fe9d2', '#2fa08b']} />
        </Path>
        <Path path={barTips} color="#eef4ff" />
        <Path path={G.ticks} color="#565a64" style="stroke" strokeWidth={1} />
        <Path path={G.target} color={AMBER} style="stroke" strokeWidth={1.3} opacity={0.9} />
        {/* Short-term history strip with sweeping cursor. */}
        <Path path={G.hFrame} color="#0a0c0f" />
        <Path path={G.hGrid} color={GHOST} style="stroke" strokeWidth={1} />
        <Path path={G.hTarget} color={AMBER} style="stroke" strokeWidth={1} opacity={0.55}>
          <DashPathEffect intervals={[4, 4]} />
        </Path>
        <Path path={G.fill}>
          <LinearGradient
            start={vec(0, histTop)}
            end={vec(0, histBot)}
            colors={[withAlpha(BLUE, 0.3), withAlpha(BLUE, 0.02)]}
          />
        </Path>
        <GlowStroke path={G.poly} color={BLUE} width={1.6} />
        <Path path={G.hFrame} color={GRID} style="stroke" strokeWidth={1.1} />
        <Path path={cursor} color="#e8ecf4" style="stroke" strokeWidth={1} opacity={0.85} />
        {/* LRA bracket around the integrated value. */}
        <Path path={G.lraTrack} color={GHOST} style="stroke" strokeWidth={2} />
        <Path path={G.lraBar} color={BLUE} style="stroke" strokeWidth={1.6} opacity={0.9} />
        <Path path={G.iTick} color={AMBER} style="stroke" strokeWidth={1.6} />
        {/* TP lamp — lights above −1 dBTP. */}
        <Circle cx={w - 26} cy={20} r={5} color="#1c0f10" />
        <Circle cx={w - 26} cy={20} r={9} color={withAlpha(RED, 0.6)} opacity={tpO}>
          <BlurMask blur={6} style="normal" />
        </Circle>
        <Circle cx={w - 26} cy={20} r={4.4} color={RED} opacity={tpO} />
        <Circle cx={w - 26} cy={20} r={5} color="#000000" style="stroke" strokeWidth={1} opacity={0.7} />
      </Canvas>
      <Lbl x={10} y={6} w={160} align="left" size={8} font={fonts.oswaldSemiBold} ls={1}>
        LOUDNESS · LUFS
      </Lbl>
      {[0, -9, -18, -27, -36].map((v) => (
        <Lbl key={v} x={2} y={yL(v) - 4} w={26} align="right" size={6.5}>
          {`${v}`}
        </Lbl>
      ))}
      <Lbl x={mX + barW / 2 - 10} y={barBot + 8} w={20} size={8} color="#9aa0ac">
        M
      </Lbl>
      <Lbl x={sX + barW / 2 - 10} y={barBot + 8} w={20} size={8} color="#9aa0ac">
        S
      </Lbl>
      <Lbl x={mX - 6} y={yL(-14) - 11} w={80} align="left" size={6.5} color={AMBER}>
        TARGET −14
      </Lbl>
      <Lbl x={cMid - 60} y={56} w={120} size={30} color={AMBER}>
        {sim.integratedLufs.toFixed(1)}
      </Lbl>
      <Lbl x={cMid - 60} y={92} w={120} size={7} ls={1}>
        LUFS INTEGRATED
      </Lbl>
      <Lbl x={cMid - 60} y={G.lraY + 12} w={120} size={8} color="#9db4d6">
        {`LRA ${sim.lraLu.toFixed(1)} LU`}
      </Lbl>
      <Lbl x={histX} y={histBot + 6} w={histW} size={6.5}>
        SHORT-TERM · LOOP ≈ 24 s
      </Lbl>
      <Lbl x={w - 96} y={32} w={84} align="right" size={8} color={over ? RED : TEXT_DIM}>
        {`TP ${sim.truePeakDbtp.toFixed(1)} dBTP`}
      </Lbl>
      <Lbl x={w - 60} y={14} w={20} align="right" size={7} color={over ? '#f4d9d5' : TEXT_DIM}>
        TP
      </Lbl>
      <Lbl x={10} y={h - 14} w={220} align="left" size={6.5}>
        M · MOMENTARY   S · SHORT-TERM
      </Lbl>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// M8 — Phase / correlation + goniometer

/** M8 — correlation meter (−1..+1) + goniometer/vectorscope dot cloud. */
export function PhaseMeterView(p: {
  width: number;
  height?: number;
  width01: number;
  phaseDeg: number;
  phase: SharedValue<number>;
}) {
  const w = p.width;
  const h = p.height ?? 220;
  const bx0 = 42;
  const bx1 = w - 42;
  const by = 20;
  const bh = 13;
  const cxg = w / 2;
  const cyg = (54 + (h - 8)) / 2;
  const Rg = Math.min((h - 70) / 2 - 4, w * 0.3);

  // stereoPair + correlationOf are the engine's truth: mono → ρ +1 and a
  // vertical gonio line; 180° → ρ −1 and the horizontal — by construction.
  const S = useMemo(() => {
    const pair = stereoPair(p.width01, p.phaseDeg, 512);
    const corr = correlationOf(pair.l, pair.r);
    // Goniometer cloud: x = (L−R)/√2, y = (L+R)/√2 (the 45° rotation).
    const kk = Rg * 0.52;
    const px = new Array<number>(RES);
    const py2 = new Array<number>(RES);
    const dots = Skia.Path.Make();
    for (let i = 0; i < RES; i++) {
      const j = Math.floor((i * 512) / RES);
      let gx = ((pair.l[j] - pair.r[j]) / Math.SQRT2) * kk;
      let gy = ((pair.l[j] + pair.r[j]) / Math.SQRT2) * kk;
      const rr = Math.hypot(gx, gy);
      if (rr > Rg * 0.96) {
        gx *= (Rg * 0.96) / rr;
        gy *= (Rg * 0.96) / rr;
      }
      px[i] = cxg + gx;
      py2[i] = cyg - gy;
      dots.addCircle(px[i], py2[i], 1.35);
    }
    // Graticule: rings, the 45° L/R axes, the M/S crosshair.
    const rings = Skia.Path.Make();
    rings.addCircle(cxg, cyg, Rg);
    rings.addCircle(cxg, cyg, Rg * 0.5);
    const diag = Skia.Path.Make();
    const dd = Rg * 0.707;
    diag.moveTo(cxg - dd, cyg - dd);
    diag.lineTo(cxg + dd, cyg + dd);
    diag.moveTo(cxg + dd, cyg - dd);
    diag.lineTo(cxg - dd, cyg + dd);
    const cross = Skia.Path.Make();
    cross.moveTo(cxg, cyg - Rg);
    cross.lineTo(cxg, cyg + Rg);
    cross.moveTo(cxg - Rg, cyg);
    cross.lineTo(cxg + Rg, cyg);
    // Correlation bar zones + ticks.
    const zones: [SkPathT, SkPathT, SkPathT] = [Skia.Path.Make(), Skia.Path.Make(), Skia.Path.Make()];
    const xOfC = (c: number) => bx0 + ((c + 1) / 2) * (bx1 - bx0);
    zones[0].addRect(Skia.XYWHRect(xOfC(-1), by, xOfC(0) - xOfC(-1) - 1, bh));
    zones[1].addRect(Skia.XYWHRect(xOfC(0), by, xOfC(0.5) - xOfC(0) - 1, bh));
    zones[2].addRect(Skia.XYWHRect(xOfC(0.5), by, xOfC(1) - xOfC(0.5), bh));
    const track = Skia.Path.Make();
    track.addRRect(Skia.RRectXY(Skia.XYWHRect(bx0 - 2, by - 2, bx1 - bx0 + 4, bh + 4), 3, 3));
    const bticks = Skia.Path.Make();
    for (const c of [-1, -0.5, 0, 0.5, 1]) {
      bticks.moveTo(xOfC(c), by + bh + 2);
      bticks.lineTo(xOfC(c), by + bh + 6);
    }
    return { corr, px, py: py2, dots, rings, diag, cross, zones, track, bticks };
  }, [p.width01, p.phaseDeg, w, h]); // eslint-disable-line react-hooks/exhaustive-deps

  const corr = S.corr;
  const ptsX = S.px;
  const ptsY = S.py;

  // Needle with a gentle live jitter riding the clock (smaller near ±1).
  const needle = useDerivedValue(() => {
    const ph = p.phase.value;
    const j = (Math.sin(3.1 * ph) + 0.6 * Math.sin(7.3 * ph + 1.2)) * 0.045 * (1 - Math.abs(corr) * 0.7);
    let c = corr + j;
    if (c < -1) c = -1;
    if (c > 1) c = 1;
    const x = bx0 + ((c + 1) / 2) * (bx1 - bx0);
    const pth = Skia.Path.Make();
    pth.moveTo(x, by - 4);
    pth.lineTo(x, by + bh + 4);
    pth.moveTo(x - 4, by - 6);
    pth.lineTo(x + 4, by - 6);
    pth.lineTo(x, by - 1);
    pth.close();
    return pth;
  }, [p.phase, corr]);

  // Phosphor beam: a bright refresh window sweeping the dot cloud.
  const beam = useDerivedValue(() => {
    const j0 = Math.floor(frac01(p.phase.value) * RES);
    const pth = Skia.Path.Make();
    for (let k = 0; k < 26; k++) {
      const i = (j0 + k) % RES;
      pth.addCircle(ptsX[i], ptsY[i], 1.7);
    }
    return pth;
  }, [p.phase, ptsX, ptsY]);

  const zoneColor = corr >= 0.5 ? GREEN : corr >= 0 ? AMBER : RED;
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ position: 'absolute', width: w, height: h, backgroundColor: BG }}>
        {/* Correlation bar: red / amber / green zones + jittering needle. */}
        <Path path={S.zones[0]} color={RED} opacity={0.26} />
        <Path path={S.zones[1]} color={AMBER} opacity={0.26} />
        <Path path={S.zones[2]} color={GREEN} opacity={0.26} />
        <Path path={S.track} color={GRID} style="stroke" strokeWidth={1.1} />
        <Path path={S.bticks} color="#565a64" style="stroke" strokeWidth={1} />
        <Path path={needle} color="#ffffff" style="stroke" strokeWidth={3} opacity={0.2}>
          <BlurMask blur={2.5} style="normal" />
        </Path>
        <Path path={needle} color="#e8ecf4" style="stroke" strokeWidth={1.4} />
        {/* Goniometer graticule. */}
        <Path path={S.rings} color={GRID} style="stroke" strokeWidth={1.1} />
        <Path path={S.diag} color="#3a444f" style="stroke" strokeWidth={1} />
        <Path path={S.cross} color="#333c46" style="stroke" strokeWidth={1} opacity={0.8}>
          <DashPathEffect intervals={[4, 4]} />
        </Path>
        {/* Phosphor cloud: glow pass + core pass + sweeping refresh beam. */}
        <Path path={S.dots} color={GREEN} opacity={0.4}>
          <BlurMask blur={4} style="normal" />
        </Path>
        <Path path={S.dots} color="#c9ffda" opacity={0.85} />
        <Path path={beam} color={withAlpha(GREEN, 0.8)} opacity={0.7}>
          <BlurMask blur={3} style="normal" />
        </Path>
        <Path path={beam} color="#f2fff5" opacity={0.95} />
      </Canvas>
      <Lbl x={10} y={4} w={120} align="left" size={7} ls={1}>
        CORRELATION
      </Lbl>
      <Lbl x={w - 90} y={4} w={80} align="right" size={9} color={zoneColor}>
        {`ρ ${corr >= 0 ? '+' : ''}${corr.toFixed(2)}`}
      </Lbl>
      <Lbl x={bx0 - 30} y={by + 2} w={24} align="right" size={8}>
        −1
      </Lbl>
      <Lbl x={bx1 + 6} y={by + 2} w={24} align="left" size={8}>
        +1
      </Lbl>
      <Lbl x={(bx0 + bx1) / 2 - 10} y={by + bh + 8} w={20} size={7}>
        0
      </Lbl>
      <Lbl x={cxg - Rg * 0.707 - 24} y={cyg - Rg * 0.707 - 12} w={20} size={8} color="#9aa0ac">
        L
      </Lbl>
      <Lbl x={cxg + Rg * 0.707 + 4} y={cyg - Rg * 0.707 - 12} w={20} size={8} color="#9aa0ac">
        R
      </Lbl>
      <Lbl x={cxg - 10} y={cyg - Rg - 12} w={20} size={7}>
        M
      </Lbl>
      <Lbl x={cxg + Rg + 4} y={cyg - 4} w={20} align="left" size={7}>
        S
      </Lbl>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// M9 — Stereo image

/** M9 — stereo image: L/R energy fan + mid/side bars for named presets. */
export function StereoImageView(p: {
  width: number;
  height?: number;
  preset: 'mono' | 'narrow' | 'wide' | 'hardlr' | 'midside';
  phase: SharedValue<number>;
}) {
  const w = p.width;
  const h = p.height ?? 190;
  const cx = w / 2;
  const oy = h - 64;
  const r0 = 16;
  const maxLen = Math.min(oy - 24, w / 2 - 42) - r0;
  const BINS = 41;
  const msX0 = 52;
  const msX1 = w - 18;
  const rowM = h - 44;
  const rowS = h - 26;

  const S = useMemo(() => {
    // Authored pan-energy distributions — how each preset READS across the
    // L..C..R arc (illustrative; the M/S bars below come from stereoPair).
    const eOf = (pan: number): number => {
      switch (p.preset) {
        case 'mono':
          return Math.exp(-Math.pow(pan / 0.07, 2));
        case 'narrow':
          return Math.exp(-Math.pow(pan / 0.26, 2));
        case 'wide':
          return 0.42 * Math.exp(-Math.pow(pan / 0.55, 2)) + 0.85 * Math.exp(-Math.pow((Math.abs(pan) - 0.68) / 0.3, 2));
        case 'hardlr':
          return Math.exp(-Math.pow((Math.abs(pan) - 1) / 0.09, 2)) + 0.05 * Math.exp(-Math.pow(pan / 0.4, 2));
        case 'midside':
          return 0.95 * Math.exp(-Math.pow(pan / 0.09, 2)) + 0.6 * Math.exp(-Math.pow((Math.abs(pan) - 0.82) / 0.26, 2));
      }
    };
    const energies = new Array<number>(BINS);
    let mx = 0;
    for (let i = 0; i < BINS; i++) {
      const pan = -1 + (2 * i) / (BINS - 1);
      energies[i] = eOf(pan);
      if (energies[i] > mx) mx = energies[i];
    }
    for (let i = 0; i < BINS; i++) energies[i] /= mx;
    // Dim full-length base fan (static under the animated bright pass).
    const base = Skia.Path.Make();
    for (let i = 0; i < BINS; i++) {
      const a = (-1 + (2 * i) / (BINS - 1)) * 72 * DEG;
      base.moveTo(cx + Math.sin(a) * r0, oy - Math.cos(a) * r0);
      base.lineTo(cx + Math.sin(a) * (r0 + maxLen * energies[i]), oy - Math.cos(a) * (r0 + maxLen * energies[i]));
    }
    // Arc frame.
    const arcs = Skia.Path.Make();
    const rA = r0 + maxLen + 6;
    arcs.addArc(Skia.XYWHRect(cx - rA, oy - rA, 2 * rA, 2 * rA), -162, 144);
    arcs.addArc(Skia.XYWHRect(cx - (r0 - 5), oy - (r0 - 5), 2 * (r0 - 5), 2 * (r0 - 5)), -162, 144);
    // MID / SIDE levels from the engine's stereo model.
    const W01: Record<typeof p.preset, number> = { mono: 0, narrow: 0.25, wide: 0.8, hardlr: 1, midside: 0.95 };
    const pair = stereoPair(W01[p.preset], 0, 512);
    const m = pair.l.map((v, i) => (v + pair.r[i]) / 2);
    const sd = pair.l.map((v, i) => (v - pair.r[i]) / 2);
    const midN = Math.min(1, rmsOf(m) / 0.45);
    const sideN = Math.min(1, rmsOf(sd) / 0.45);
    const wells = Skia.Path.Make();
    wells.addRRect(Skia.RRectXY(Skia.XYWHRect(msX0, rowM, msX1 - msX0, 10), 2, 2));
    wells.addRRect(Skia.RRectXY(Skia.XYWHRect(msX0, rowS, msX1 - msX0, 10), 2, 2));
    const midW = Math.max(3, (msX1 - msX0) * midN);
    const sideW = Math.max(3, (msX1 - msX0) * sideN);
    const midFill = Skia.Path.Make();
    midFill.addRRect(Skia.RRectXY(Skia.XYWHRect(msX0, rowM, midW, 10), 2, 2));
    const sideFill = Skia.Path.Make();
    sideFill.addRRect(Skia.RRectXY(Skia.XYWHRect(msX0, rowS, sideW, 10), 2, 2));
    const capsMs = Skia.Path.Make();
    capsMs.addRect(Skia.XYWHRect(msX0 + midW - 2, rowM, 2.4, 10));
    capsMs.addRect(Skia.XYWHRect(msX0 + sideW - 2, rowS, 2.4, 10));
    return { energies, base, arcs, wells, midFill, sideFill, capsMs };
  }, [p.preset, w, h]); // eslint-disable-line react-hooks/exhaustive-deps

  const energies = S.energies;

  // Animated fan: per-bin shimmer riding the clock (fixed 41 bars, one node).
  const fan = useDerivedValue(() => {
    const ph = p.phase.value;
    const pth = Skia.Path.Make();
    for (let i = 0; i < 41; i++) {
      const a = (-1 + (2 * i) / 40) * 72 * (Math.PI / 180);
      const e = energies[i] * (0.9 + 0.1 * Math.sin(ph * 2 + i * 0.75));
      pth.moveTo(cx + Math.sin(a) * r0, oy - Math.cos(a) * r0);
      pth.lineTo(cx + Math.sin(a) * (r0 + maxLen * e), oy - Math.cos(a) * (r0 + maxLen * e));
    }
    return pth;
  }, [p.phase, energies, cx, oy, r0, maxLen]);

  const capsO = useDerivedValue(() => {
    return 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(p.phase.value * 2.4));
  }, [p.phase]);

  const rL = r0 + maxLen + 16;
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ position: 'absolute', width: w, height: h, backgroundColor: BG }}>
        <Path path={S.arcs} color={GHOST} style="stroke" strokeWidth={1.1} />
        <Path path={S.base} color="#2e3540" style="stroke" strokeWidth={4.5} strokeCap="round" opacity={0.55} />
        {/* Energy fan: blue at the sides → amber at center (SweepGradient). */}
        <Path path={fan} style="stroke" strokeWidth={4.5} strokeCap="round" opacity={0.28}>
          <SweepGradient c={vec(cx, oy)} colors={[BLUE, BLUE, AMBER, BLUE, BLUE]} positions={[0, 0.54, 0.75, 0.96, 1]} />
          <BlurMask blur={5} style="normal" />
        </Path>
        <Path path={fan} style="stroke" strokeWidth={4.5} strokeCap="round">
          <SweepGradient c={vec(cx, oy)} colors={[BLUE, BLUE, AMBER, BLUE, BLUE]} positions={[0, 0.54, 0.75, 0.96, 1]} />
        </Path>
        {/* MID / SIDE bars (stereoPair → rmsOf). */}
        <Path path={S.wells} color="#0a0c0f" />
        <Path path={S.wells} color={GHOST} style="stroke" strokeWidth={1} />
        <Path path={S.midFill}>
          <LinearGradient start={vec(msX0, 0)} end={vec(msX1, 0)} colors={['#8a6a1e', AMBER]} />
        </Path>
        <Path path={S.sideFill}>
          <LinearGradient start={vec(msX0, 0)} end={vec(msX1, 0)} colors={['#2c4a7a', BLUE]} />
        </Path>
        <Path path={S.capsMs} color="#f2f5fa" opacity={capsO} />
      </Canvas>
      <Lbl x={cx + Math.sin(-72 * DEG) * rL - 10} y={oy - Math.cos(72 * DEG) * rL - 5} w={20} size={9} color="#9aa0ac">
        L
      </Lbl>
      <Lbl x={cx - 10} y={oy - rL - 8} w={20} size={9} color="#9aa0ac">
        C
      </Lbl>
      <Lbl x={cx + Math.sin(72 * DEG) * rL - 10} y={oy - Math.cos(72 * DEG) * rL - 5} w={20} size={9} color="#9aa0ac">
        R
      </Lbl>
      <Lbl x={12} y={rowM + 1} w={36} align="left" size={7}>
        MID
      </Lbl>
      <Lbl x={12} y={rowS + 1} w={36} align="left" size={7}>
        SIDE
      </Lbl>
      <Lbl x={w - 90} y={6} w={80} align="right" size={7} color={AMBER} ls={1}>
        {p.preset.toUpperCase()}
      </Lbl>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// M10 — Oscilloscope

/** M10 — oscilloscope: phosphor-style trace; xy=true → Lissajous mode fed by
 *  stereoPair(width01, phaseDeg). */
export function ScopeView(p: {
  width: number;
  height?: number;
  signal: SignalKey;
  xy?: boolean;
  width01?: number;
  phaseDeg?: number;
  phase: SharedValue<number>;
}) {
  const w = p.width;
  const h = p.height ?? 210;
  const xy = p.xy ?? false;
  const sx = 12;
  const sy = 12;
  const sw = w - 24;
  const sh = h - 24;
  const cxs = sx + sw / 2;
  const cys = sy + sh / 2;

  const S = useMemo(() => {
    // CRT graticule: 10×8 divisions, brighter center axes with 1/5 ticks.
    const grat = Skia.Path.Make();
    for (let i = 0; i <= 10; i++) {
      const x = sx + (i * sw) / 10;
      grat.moveTo(x, sy);
      grat.lineTo(x, sy + sh);
    }
    for (let j = 0; j <= 8; j++) {
      const y = sy + (j * sh) / 8;
      grat.moveTo(sx, y);
      grat.lineTo(sx + sw, y);
    }
    const axes = Skia.Path.Make();
    axes.moveTo(sx, cys);
    axes.lineTo(sx + sw, cys);
    axes.moveTo(cxs, sy);
    axes.lineTo(cxs, sy + sh);
    const ticksA = Skia.Path.Make();
    for (let i = 0; i <= 50; i++) {
      const x = sx + (i * sw) / 50;
      ticksA.moveTo(x, cys - 2.6);
      ticksA.lineTo(x, cys + 2.6);
    }
    for (let j = 0; j <= 40; j++) {
      const y = sy + (j * sh) / 40;
      ticksA.moveTo(cxs - 2.6, y);
      ticksA.lineTo(cxs + 2.6, y);
    }
    // Trace: Y-t sweep, or the X-Y Lissajous figure (X = left, Y = right).
    const trace = Skia.Path.Make();
    const ptsX = new Array<number>(RES);
    const ptsY = new Array<number>(RES);
    if (!xy) {
      const buf = renderSignal(p.signal, 1024);
      for (let i = 0; i < 1024; i++) {
        const x = sx + (i / 1023) * sw;
        const y = cys - Math.max(-1.15, Math.min(1.15, buf[i])) * sh * 0.4;
        if (i === 0) trace.moveTo(x, y);
        else trace.lineTo(x, y);
      }
      for (let i = 0; i < RES; i++) {
        const j = Math.floor((i * 1024) / RES);
        ptsX[i] = sx + (j / 1023) * sw;
        ptsY[i] = cys - Math.max(-1.15, Math.min(1.15, buf[j])) * sh * 0.4;
      }
    } else {
      const pair = stereoPair(p.width01 ?? 0, p.phaseDeg ?? 0, 512);
      const k = Math.min(sw, sh) * 0.38;
      for (let i = 0; i < 512; i++) {
        const x = cxs + Math.max(-1.2, Math.min(1.2, pair.l[i])) * k;
        const y = cys - Math.max(-1.2, Math.min(1.2, pair.r[i])) * k;
        if (i === 0) trace.moveTo(x, y);
        else trace.lineTo(x, y);
      }
      trace.close();
      for (let i = 0; i < RES; i++) {
        const j = Math.floor((i * 512) / RES);
        ptsX[i] = cxs + Math.max(-1.2, Math.min(1.2, pair.l[j])) * k;
        ptsY[i] = cys - Math.max(-1.2, Math.min(1.2, pair.r[j])) * k;
      }
    }
    // Screen + bezel plates, trigger marker (normal mode).
    const bezel = Skia.Path.Make();
    bezel.addRRect(Skia.RRectXY(Skia.XYWHRect(0, 0, w, h), 16, 16));
    const screen = Skia.Path.Make();
    screen.addRRect(Skia.RRectXY(Skia.XYWHRect(sx - 2, sy - 2, sw + 4, sh + 4), 10, 10));
    const trig = Skia.Path.Make();
    trig.moveTo(sx + sw - 1, cys - 4);
    trig.lineTo(sx + sw - 7, cys);
    trig.lineTo(sx + sw - 1, cys + 4);
    trig.close();
    return { grat, axes, ticksA, trace, ptsX, ptsY, bezel, screen, trig };
  }, [p.signal, xy, p.width01, p.phaseDeg, w, h]); // eslint-disable-line react-hooks/exhaustive-deps

  const bpx = S.ptsX;
  const bpy = S.ptsY;

  // Scanning trigger cursor (normal mode) + the beam dot riding the trace.
  const cursor = useDerivedValue(() => {
    const f = frac01(p.phase.value);
    const x = sx + f * sw;
    const pth = Skia.Path.Make();
    pth.moveTo(x, sy);
    pth.lineTo(x, sy + sh);
    return pth;
  }, [p.phase, sx, sy, sw, sh]);

  const beam = useDerivedValue(() => {
    const i = Math.min(RES - 1, Math.floor(frac01(p.phase.value) * RES));
    const pth = Skia.Path.Make();
    pth.addCircle(bpx[i], bpy[i], 2.2);
    return pth;
  }, [p.phase, bpx, bpy]);

  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ position: 'absolute', width: w, height: h, backgroundColor: BG }}>
        {/* CRT bezel + green-on-black screen. */}
        <Path path={S.bezel}>
          <LinearGradient start={vec(0, 0)} end={vec(0, h)} colors={['#26272e', '#131418']} />
        </Path>
        <Path path={S.bezel} color="#000000" style="stroke" strokeWidth={1.4} opacity={0.7} />
        <Path path={S.screen}>
          <RadialGradient c={vec(cxs, cys)} r={Math.max(sw, sh) * 0.62} colors={['#0c130c', '#060906']} />
        </Path>
        <Path path={S.grat} color="#16281b" style="stroke" strokeWidth={1} opacity={0.9} />
        <Path path={S.axes} color="#24402b" style="stroke" strokeWidth={1.2} />
        <Path path={S.ticksA} color="#24402b" style="stroke" strokeWidth={0.8} opacity={0.9} />
        {/* Phosphor persistence: a dimmer echo one frame back. */}
        <Group transform={xy ? [{ translateX: 1.5 }, { translateY: 1.5 }] : [{ translateX: -3 }]}>
          <Path path={S.trace} color={GREEN} style="stroke" strokeWidth={2} opacity={0.16}>
            <BlurMask blur={3.5} style="normal" />
          </Path>
        </Group>
        {/* Live trace: glow pass + crisp core. */}
        <Path path={S.trace} color={GREEN} style="stroke" strokeWidth={5} opacity={0.3}>
          <BlurMask blur={6} style="normal" />
        </Path>
        <Path path={S.trace} color="#b6ffc9" style="stroke" strokeWidth={1.6} />
        {!xy ? <Path path={cursor} color="#69a877" style="stroke" strokeWidth={1} opacity={0.35} /> : null}
        <Path path={beam} color={withAlpha(GREEN, 0.8)} opacity={0.8}>
          <BlurMask blur={4} style="normal" />
        </Path>
        <Path path={beam} color="#eaffef" />
        {!xy ? <Path path={S.trig} color="#69a877" opacity={0.8} /> : null}
        <Path path={S.screen} color="#000000" style="stroke" strokeWidth={2.4} opacity={0.85} />
      </Canvas>
      <Lbl x={sx + 6} y={sy + sh - 12} w={140} align="left" size={7} color="#5f8a68">
        {xy ? 'X = L · Y = R' : 'CH 1 · SWEEP LOCK'}
      </Lbl>
      {!xy ? (
        <Lbl x={sx + sw - 46} y={sy + 4} w={40} align="right" size={7} color="#5f8a68">
          TRIG
        </Lbl>
      ) : null}
    </View>
  );
}
