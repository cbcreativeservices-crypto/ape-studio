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
import { useEffect, useMemo } from 'react';
import { PixelRatio, Text as RNText, TextInput, View } from 'react-native';
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
import Animated, {
  useAnimatedProps,
  useDerivedValue,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
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
import { LOUDNESS_STOPS, WAVE_LEVEL_STOPS } from '../../../features/tools/levelColor';
export { usePhaseClock, useVizClock } from '../foundations/viz';

// House lab palette (visual standards §3).
const BG = '#0c0c0f';
const GRID = '#3a3b46';
const GHOST = '#2e2f38';
const AMBER = '#ffc64d';
const BLUE = '#6fa8ff';
const GREEN = '#5bff85';
const RED = '#ff6b5e';
const TEXT_DIM = '#9a9ca8';

const DEG = Math.PI / 180;
/** Waveform column density — device pixels (capped for very dense screens). */
const DPR = Math.max(1, Math.min(3.5, PixelRatio.get()));
/** Scan resolution of every precomputed per-loop series. */
const RES = 240;

type SkPathT = ReturnType<typeof Skia.Path.Make>;

/** A TextInput whose `text` can be driven by a reanimated worklet — used for the
 *  live SPL numeral riding the LED meter's AVERAGE line (updates on the UI thread
 *  without a React re-render, the standard reanimated live-number idiom). */
const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

/** OPTIONAL live drive for the meter faces (SPL popup, 2026-07-29): when
 *  present the meter follows these SharedValues instead of a teaching buffer —
 *  the teaching-signal path is untouched when absent. Values are dBFS (peak
 *  may exceed 0 dBFS — finding F1; −Infinity/NaN in silence are safe). Drive
 *  `phase` at 1/loopSeconds Hz so the ballistics integrate wall-clock time. */
export type LiveMeterDrive = {
  rmsDb: SharedValue<number>;
  peakDb: SharedValue<number>;
};

/** Peak-hold linger setting for the live LED meter (SPL popup, 2026-07-30):
 *  how long a peak cap sits before it decays. 'off' hides the cap entirely;
 *  'inf' latches the loudest peak until the input rises past it. */
export type PeakHoldMode =
  | 'off' | '1s' | '2s' | '3s' | '5s' | '10s' | '20s' | '30s'
  | '1m' | '5m' | '10m' | '30m' | '1h' | 'inf';

/** Peak-hold linger in seconds for a mode ('inf' latches at ~1e9; 'off' = 0).
 *  Owner 2026-08-18: extended from off/1s/3s/inf to a full 1 s … 1 h range for
 *  the VU meter's peak-hold duration popup. The hold is a JS/Skia computation
 *  (no native change), so any duration works. */
export function holdModeSeconds(m: PeakHoldMode): number {
  switch (m) {
    case 'off': return 0;
    case '1s': return 1;
    case '2s': return 2;
    case '3s': return 3;
    case '5s': return 5;
    case '10s': return 10;
    case '20s': return 20;
    case '30s': return 30;
    case '1m': return 60;
    case '5m': return 300;
    case '10m': return 600;
    case '30m': return 1800;
    case '1h': return 3600;
    case 'inf': return 1e9;
  }
}

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
  /** Optional soft text shadow/glow (SPL dial CRITICAL BALANCE sweet-spot title). */
  shadowColor?: string;
  shadowRadius?: number;
  /** Optional shadow offset — with a dark colour this reads as a real DROP shadow
   *  (default {0,0} = a centred glow, so existing callers are unchanged). */
  shadowOffset?: { width: number; height: number };
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
        ...(props.shadowColor
          ? {
              textShadowColor: props.shadowColor,
              textShadowRadius: props.shadowRadius ?? 6,
              textShadowOffset: props.shadowOffset ?? { width: 0, height: 0 },
            }
          : null),
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
    // Is the signal actually clipping right now? (owner 2026-08-05: whole
    // waveform goes red while clipping, back to the MIDI ramp when under.)
    const clipping = clT.some(Boolean) || clB.some(Boolean);
    return { body, caps, grid, rails, stats, clipping };
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
        {/* Amplitude painted by the MIDI loudness ramp (blue at the zero line →
            red at ±full scale); the WHOLE body flips solid red while clipping,
            back to the ramp when brought under (owner 2026-08-05). */}
        {S.clipping ? (
          <Path path={S.body} color="#ff4d3d" opacity={0.92} />
        ) : (
          <Path path={S.body}>
            <LinearGradient
              start={vec(0, yOf(1))}
              end={vec(0, yOf(-1))}
              colors={WAVE_LEVEL_STOPS.map((s) => s.color)}
              positions={WAVE_LEVEL_STOPS.map((s) => s.offset)}
            />
          </Path>
        )}
        <Path path={S.body} color={S.clipping ? RED : '#dfe4ee'} style="stroke" strokeWidth={1.1} opacity={S.clipping ? 0.95 : 0.55} />
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
  /** Teaching signal — required when `live` is absent; ignored when present. */
  signal?: SignalKey;
  gain?: number;
  phase: SharedValue<number>;
  /** Live drive (additive 2026-07-29): both columns follow live peakDb (the
   *  phone mic is mono — columns read M/M, not L/R). */
  live?: LiveMeterDrive;
  /** Wall-seconds one phase-clock loop represents (live ballistics scale). */
  loopSeconds?: number;
}) {
  const w = p.width;
  const h = p.height ?? 190;
  const gain = p.gain ?? 1;
  const sig: SignalKey = p.signal ?? 'sine';
  const livePeak = p.live ? p.live.peakDb : undefined;
  const LOOP = p.loopSeconds ?? 4;

  // Rack-gear layout: brushed panel, inset bezel well, two LED columns with a
  // tick/label gutter between them.
  const wellW = Math.min(210, Math.max(150, w * 0.56));
  const wellX = (w - wellW) / 2;
  const wellY = 30;
  const wellH = h - wellY - 26;
  const gutter = 40;
  const padI = 9;
  // Thinner bars, centered in the well (owner 2026-08-05).
  const colWpx = Math.min(16, (wellW - gutter - padI * 2) / 2);
  const contentW = colWpx * 2 + gutter;
  const colLx = wellX + (wellW - contentW) / 2;
  const colRx = colLx + colWpx + gutter;
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
      const buf = renderSignal(sig, n, seed);
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
    const crest = crestDb(renderSignal(sig, n, 1).map((v) => v * gain));
    return { envL: L.env, envR: R.env, holdL: L.hold, holdR: R.hold, over, crest };
  }, [sig, gain]);

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

  // ── Live ballistics (only when `live` is present): instantaneous attack,
  // ~37 dB/s release (matching the teaching envelope), floating 1 s hold with
  // slow decay, and an OVER latch lit for 1.5 s past the last ≥0 dBFS peak.
  // dt comes from the phase-clock delta, exactly like the VU worklet below.
  const lEnv = useSharedValue(-120);
  const lHold = useSharedValue(-120);
  const lHoldAge = useSharedValue(0);
  const lOverPh = useSharedValue(-1e9);
  const lLastPh = useSharedValue(-1);
  const liveEnv = useDerivedValue(() => {
    if (!livePeak) return -120;
    const ph = p.phase.value;
    let dt = 0;
    if (lLastPh.value >= 0) {
      let d = ph - lLastPh.value;
      if (d < 0) d = 0;
      dt = (d / (Math.PI * 2)) * LOOP;
      if (dt > 0.08) dt = 0.08;
    }
    lLastPh.value = ph;
    const raw = livePeak.value;
    // −Infinity/NaN (silence before any signal) settle honestly to the floor.
    const pk = raw === raw && raw > -120 ? Math.min(6, raw) : -120;
    const e = Math.max(pk, lEnv.value - 37 * dt);
    lEnv.value = e;
    if (pk >= lHold.value) {
      lHold.value = pk;
      lHoldAge.value = 0;
    } else {
      lHoldAge.value += dt;
      if (lHoldAge.value > 1) lHold.value = Math.max(-120, lHold.value - 12 * dt);
    }
    if (pk >= -0.05) lOverPh.value = ph;
    return e;
  }, [p.phase, livePeak, LOOP]);

  // Per-frame: three zone paths (both channels each), the hold caps, and the
  // OVER lamp opacity — 5 fixed animated bindings, worklet-only.
  const litGreen = useDerivedValue(() => {
    const idx = Math.min(RES - 1, Math.floor(frac01(p.phase.value) * RES));
    const pth = Skia.Path.Make();
    const lv: [number, number] = livePeak ? [liveEnv.value, liveEnv.value] : [envL[idx], envR[idx]];
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
  }, [p.phase, envL, envR, livePeak, liveEnv]);

  const litAmber = useDerivedValue(() => {
    const idx = Math.min(RES - 1, Math.floor(frac01(p.phase.value) * RES));
    const pth = Skia.Path.Make();
    const lv: [number, number] = livePeak ? [liveEnv.value, liveEnv.value] : [envL[idx], envR[idx]];
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
  }, [p.phase, envL, envR, livePeak, liveEnv]);

  const litRed = useDerivedValue(() => {
    const idx = Math.min(RES - 1, Math.floor(frac01(p.phase.value) * RES));
    const pth = Skia.Path.Make();
    const lv: [number, number] = livePeak ? [liveEnv.value, liveEnv.value] : [envL[idx], envR[idx]];
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
  }, [p.phase, envL, envR, livePeak, liveEnv]);

  const caps = useDerivedValue(() => {
    const idx = Math.min(RES - 1, Math.floor(frac01(p.phase.value) * RES));
    const pth = Skia.Path.Make();
    const hL = Math.max(-59, Math.min(0.4, livePeak ? lHold.value : holdL[idx]));
    const hR = Math.max(-59, Math.min(0.4, livePeak ? lHold.value : holdR[idx]));
    pth.addRect(Skia.XYWHRect(colLx, barBot - ((hL + 60) / 60) * span - 1.2, colWpx, 2.4));
    pth.addRect(Skia.XYWHRect(colRx, barBot - ((hR + 60) / 60) * span - 1.2, colWpx, 2.4));
    return pth;
  }, [p.phase, holdL, holdR, livePeak]);

  const overO = useDerivedValue(() => {
    if (livePeak) {
      const secs = ((p.phase.value - lOverPh.value) / (Math.PI * 2)) * LOOP;
      return secs >= 0 && secs < 1.5 ? 1 : 0;
    }
    return overArr[Math.min(RES - 1, Math.floor(frac01(p.phase.value) * RES))];
  }, [p.phase, overArr, livePeak, LOOP]);

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
        {/* Whole meter washes RED while it clips (owner 2026-08-05 — like the
            SPL/VU LED display). Latches with the OVER series; clears when the
            gain is pulled back under 0 dBFS. */}
        <Path path={G.well} color={withAlpha(RED, 0.22)} opacity={overO} />
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
        {/* Red frame over the whole well while clipping. */}
        <Path path={G.well} color={RED} style="stroke" strokeWidth={2.4} opacity={overO} />
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
        {p.live ? 'M' : 'L'}
      </Lbl>
      <Lbl x={colRx + colWpx / 2 - 10} y={barBot + 6} w={20} size={8} color="#9aa0ac">
        {p.live ? 'M' : 'R'}
      </Lbl>
      <Lbl x={w / 2 - 16} y={barBot + 6} w={32} size={6.5}>
        dBFS
      </Lbl>
      <Lbl x={10} y={h - 13} w={140} align="left" size={7}>
        {p.live ? 'LIVE INPUT · MONO' : `CREST ${E.crest.toFixed(1)} dB`}
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
  /** Teaching signal — required when `live` is absent; ignored when present. */
  signal?: SignalKey;
  gain?: number;
  phase: SharedValue<number>;
  /** Also draw a fast peak LED beside the face (the peak-vs-average lesson). */
  showPeakLed?: boolean;
  /** Peak-hold marker on the VU arc (SPL popup, 2026-07-30): a thin white tick on
   *  the scale arc marking the HIGHEST needle position reached. 'off' / absent ⇒
   *  no marker (meter-lab callers unaffected); '1s'/'3s' ⇒ the tick lingers at the
   *  peak then follows the needle back down after that many seconds; 'inf' ⇒ it
   *  latches at the max until the needle rises past it again. */
  peakHold?: PeakHoldMode;
  /** Wall-seconds one loop of the phase clock represents (ballistics scale). */
  loopSeconds?: number;
  /** Linear RMS that reads 0 VU (illustrative calibration). */
  rms0?: number;
  /** Live drive (additive 2026-07-29): the SAME 300 ms vuStep ballistics chase
   *  live rmsDb; the peak LED follows live peakDb (lights ≥ −3 dBFS). */
  live?: LiveMeterDrive;
  /** dBFS that reads 0 VU in live mode (default −18 — a stated convention,
   *  NOT a calibrated 0 VU = +4 dBu reference). In the SPL popup this is driven
   *  to (RANGE − splOffset) so the measured SPL == RANGE parks the needle at 0. */
  live0Db?: number;
  /** Optional digital readouts printed INSIDE the glass at the bottom corners
   *  (SPL popup, 2026-07-30): bottom-LEFT "MAX", bottom-RIGHT the current level +
   *  "dB". The CALLER formats both strings (its shown()/fmtDb math is the single
   *  source of truth). Absent ⇒ nothing drawn — meter-lab call sites unaffected.
   *  `rangeText` (SPL popup, 2026-07-30) prints TOP-LEFT — e.g. "RANGE 100" or
   *  "AUTO · 85" — the VU's 0-VU reference; MAX stays bottom-left, level bottom-right. */
  cornerReadouts?: { maxText?: string; levelText?: string; rangeText?: string };
  /** SPL-span brackets printed on the INNER (concave) side of the arc (SPL popup,
   *  2026-07-30): `lowText` near the −20 mark, `highText` near the 0 mark — the SPL
   *  range the VU deflection maps onto (low SPL at −20, high SPL at 0). Small blue
   *  ink, opposite the outer −20..+3 numerals. Two OPTIONAL middle numbers may be
   *  added (2026-07-30): `mid10Text` at the −10 mark and `mid5Text` at the −5 mark,
   *  filling in the span between low and high. Absent ⇒ nothing drawn. */
  scaleBrackets?: { lowText: string; highText: string; mid10Text?: string; mid5Text?: string };
}) {
  const w = p.width;
  const h = p.height ?? 230;
  const gain = p.gain ?? 1;
  const showLed = p.showPeakLed ?? false;
  const LOOP = p.loopSeconds ?? 4;
  const RMS0 = p.rms0 ?? 0.42;
  const sig: SignalKey = p.signal ?? 'sine';
  const liveRms = p.live ? p.live.rmsDb : undefined;
  const livePeak = p.live ? p.live.peakDb : undefined;
  const LIVE0 = p.live0Db ?? -18;

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
  // C2 (owner 2026-07-30): pivot dropped LOWER and R reduced so the printed
  // scale/arc sits lower on the face — matching a real Studio-Six VU where the
  // scale hugs the lower third and the needle blade is short.
  const py = h - 26;
  const R = Math.min(py - fy - 40, (w / 2 - bez - 30) / Math.sin(A * DEG));
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
    // Red is the over-0 zone: start the FILL a touch above 0 (angDb(0.3)) so the
    // 0 tick is the clean boundary and the "0" numeral — now CENTERED on its own
    // 0 tick (below) — keeps clear daylight from the red.
    const a0 = angDb(0.3) / DEG - 90;
    const a1 = angDb(3) / DEG - 90;
    const st = pt(angDb(0.3), rO);
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
    // Label anchors for the RNText numerals (printed scale typography). The "0"
    // numeral is CENTERED on its own 0 tick (angDb(0)) — reading as the label at
    // the END of the 0 line, with clear spacing from −1 — and seated a hair
    // further out radially so it clears the red over-0 wedge in clean dark ink.
    const labels = majors.map((d) => {
      const rOff = d === 0 ? R + 24 : R + 21;
      const lp = pt(angDb(d), rOff);
      return { d, x: lp.x, y: lp.y };
    });
    // SPL-span bracket anchors on the INNER (concave) side of the arc — near the
    // −20, −10, −5 and 0 marks, opposite the outer numerals (drawn only when
    // scaleBrackets). All share the R−15 concave radius; their tick angles are
    // well-separated (−41°/−26°/−10°/+20°) so the four never collide, and the
    // inner radius keeps them clear of the outer ticks and (at rest) the needle.
    const brLow = pt(angDb(-20), R - 15);
    const brMid10 = pt(angDb(-10), R - 15);
    const brMid5 = pt(angDb(-5), R - 15);
    const brHigh = pt(angDb(0), R - 15);
    return { tickB, tickR, arcB, wedge, outer, face, topShade, sheen, labels, brLow, brMid10, brMid5, brHigh };
  }, [w, h]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Precomputed loop series: windowed RMS (needle target) + peak LED ──────
  const B = useMemo(() => {
    const n = 2048;
    const buf = renderSignal(sig, n).map((v) => v * gain);
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
  }, [sig, gain]);

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
  const litPh = useSharedValue(-1e9);

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
    // Live mode: the SAME integrator chases the live RMS SharedValue — dBFS
    // mapped so LIVE0 dBFS reads 0 VU (−Infinity/NaN silence → needle rest).
    let target: number;
    if (liveRms) {
      const d = liveRms.value;
      target = d === d && d > -120 ? RMS0 * Math.pow(10, (Math.min(12, d) - LIVE0) / 20) : 0;
    } else {
      target = rmsArr[Math.min(RES - 1, Math.floor(f * RES))];
    }
    // Integrator — tc = 0.20 s (owner 2026-07-30: slowed back HALF of the earlier
    // 0.30→0.10 speed-up, a middle ground):
    const a = 1 - Math.exp(-dt / 0.2);
    vuVal.value = vuVal.value + (target - vuVal.value) * a;
    // Under-damped ballistic follower — SUB-STEPPED (owner 2026-08-05 bug fix).
    // The explicit-Euler spring (k = 520) is numerically unstable when dt is
    // large: at the 0.08 s cap the effective step 520·0.08 ≈ 42 ≫ 2, so on a
    // loud step it overshot violently — the needle pegged full, then the huge
    // restoring velocity snapped it past rest and it "disappeared" off the
    // scale. Integrating in small fixed sub-steps keeps the spring stable while
    // preserving the natural ballistic overshoot.
    let rem = dt;
    while (rem > 1e-6) {
      const h = rem > 0.002 ? 0.002 : rem;
      const acc = (vuVal.value - nx.value) * 520 - nv.value * 33;
      nv.value = nv.value + acc * h;
      nx.value = nx.value + nv.value * h;
      rem -= h;
    }
    let pct = nx.value / (RMS0 * 1.4125);
    if (pct < -0.015) pct = -0.015;
    if (pct > 1.06) pct = 1.06;
    return (-48 + 96 * pct) * (Math.PI / 180);
  }, [p.phase, rmsArr, LOOP, RMS0, liveRms, LIVE0]);

  // Tapered needle + counterweight tail, rebuilt in WORLD coordinates per
  // frame (house rule: geometry in worklets, no animated CTM).
  const needlePath = useDerivedValue(() => {
    const th = needleRad.value;
    const s = Math.sin(th);
    const c = Math.cos(th);
    // Studio Six proportions (owner 2026-07-30, revised): the blade reaches JUST
    // INSIDE the scale ticks (~0.92·R) like a real VU — close to the arc but never
    // past it — over a stubby counterweight tail.
    const tipR = R * 0.92;
    const tailR = -12;
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
    const tipR = R * 0.92;
    const tailR = -12;
    const wb = 3.0;
    const wt = 1.0;
    const ox = 3.4;
    const oy = 3.7;
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
    // Over-range PEG (owner 2026-07-30): when the needle is parked at/over the +3
    // end of the scale (pct ≥ 1 ⇒ nx ≥ RMS0·1.4125), force the PEAK dot fully lit —
    // so a pegged needle always reads as "pegged + peak". This rides ON TOP of the
    // normal peak-LED behaviour below.
    const pegged = nx.value >= RMS0 * 1.4125;
    if (livePeak) {
      // Fast LED follows live peakDb: lights at ≥ −3 dBFS, ~350 ms afterglow.
      const ph = p.phase.value;
      const pk = livePeak.value;
      if (pk === pk && pk >= -3) litPh.value = ph;
      const secs = ((ph - litPh.value) / (Math.PI * 2)) * LOOP;
      const led = secs >= 0 && secs < 0.35 ? 1 - secs / 0.35 : 0;
      return pegged ? 1 : led;
    }
    const led = ledArr[Math.min(RES - 1, Math.floor(frac01(p.phase.value) * RES))];
    return pegged ? 1 : led;
  }, [p.phase, ledArr, livePeak, LOOP, nx, RMS0]);

  // ── PEAK-HOLD MARKER (owner 2026-07-30): a thin white tick riding the scale arc
  // at the HIGHEST needle position reached, honouring `peakHold`. The needle angle
  // rises monotonically with level, so the peak IS the max needleRad. dt comes from
  // the phase-clock delta (the same idiom as the ballistics above). When the prop is
  // absent/'off' the tick is disabled and nothing is drawn (meter-lab unaffected).
  const pkEnabled = p.peakHold != null && p.peakHold !== 'off';
  const pkHoldSecs = p.peakHold && p.peakHold !== 'off' ? holdModeSeconds(p.peakHold) : 1e9; // 'inf' latches
  const pkAng = useSharedValue(-1e9);
  const pkAge = useSharedValue(0);
  const pkLastPh = useSharedValue(-1);
  const peakTick = useDerivedValue(() => {
    if (!pkEnabled) return Skia.Path.Make();
    const cur = needleRad.value;
    const ph = p.phase.value;
    let dt = 0;
    if (pkLastPh.value >= 0) {
      let d = ph - pkLastPh.value;
      if (d < 0) d = 0;
      dt = (d / (Math.PI * 2)) * LOOP;
      if (dt > 0.08) dt = 0.08;
    }
    pkLastPh.value = ph;
    if (cur >= pkAng.value) {
      pkAng.value = cur;
      pkAge.value = 0;
    } else {
      pkAge.value += dt;
      // Once the hold expires the marker glides back DOWN to follow the needle
      // (~1.6 rad/s ≈ full scale in ~1 s); 'inf' never expires, so it latches.
      if (pkAge.value > pkHoldSecs) pkAng.value = Math.max(cur, pkAng.value - 1.6 * dt);
    }
    const th = pkAng.value;
    const s = Math.sin(th);
    const c = Math.cos(th);
    const r0 = R + 1;
    const r1 = R + 12;
    const pth = Skia.Path.Make();
    pth.moveTo(cx + s * r0, py - c * r0);
    pth.lineTo(cx + s * r1, py - c * r1);
    return pth;
  }, [p.phase, needleRad, pkEnabled, pkHoldSecs, LOOP]);

  // RESET the white peak-hold marker when the 0-VU reference moves (owner
  // 2026-07-30): the parent recomputes `live0Db` (→ LIVE0) on every RANGE change
  // or AUTO toggle, which re-maps where a given level parks the needle — so the
  // previously accumulated peak angle is now STALE against the new scale. Watch
  // LIVE0 and drop the tracked max back to the CURRENT needle level (and clear the
  // hold age) so the tick re-accumulates from the new reference. No new prop: we
  // simply react to the existing live0Db changing.
  useEffect(() => {
    pkAng.value = needleRad.value;
    pkAge.value = 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [LIVE0]);

  const ledX = fx + fw - 22;
  const ledY = fy + 20;
  // VU wordmark seat (owner 2026-07-30, RAISED to the midpoint): the wordmark was
  // riding too LOW, down near the pivot hub. Seat its CENTRE at the MIDPOINT between
  // the blue in-arc bracket numbers (radius ≈ R−15 from the pivot) and the needle
  // base / pivot hub (radius ~0) — i.e. at radius (R−15)/2 straight up the vertical
  // centreline. That keeps it clear of BOTH the blue numbers above and the pivot/
  // needle below.
  const wmSize = Math.min(18, Math.max(12, Math.round(0.06 * R + 6)));
  const wmCenterY = py - (R - 15) / 2;
  const wmTopY = wmCenterY - wmSize / 2;
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ position: 'absolute', width: w, height: h, backgroundColor: BG }}>
        {/* Housing: dark rounded bezel (corner screws removed, owner 2026-07-30). */}
        <Path path={G.outer}>
          <LinearGradient start={vec(0, 0)} end={vec(0, h)} colors={['#26272e', '#131418', '#0b0b0e']} positions={[0, 0.6, 1]} />
        </Path>
        <Path path={G.outer} color="#000000" style="stroke" strokeWidth={1.4} opacity={0.7} />
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
        {/* Peak-hold marker: subtle white tick on the arc at the highest needle
            angle reached (peakHold prop). Absent/'off' ⇒ nothing drawn. */}
        {pkEnabled ? <Path path={peakTick} color="#ffffff" style="stroke" strokeWidth={1} opacity={0.7} /> : null}
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
        {/* Needle: soft ANIMATED drop shadow (offset down-right, blurred) that
            tracks the blade every frame via needleShadow ← needleRad; drawn UNDER
            the needle so the blade reads as floating above the face. */}
        <Path path={needleShadow} color="#050505" opacity={0.58}>
          <BlurMask blur={3.5} style="normal" />
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
      {/* C1 (owner 2026-07-30): scale numerals larger + bold. */}
      {G.labels.map((l) => (
        <Lbl
          key={l.d}
          x={l.x - 14}
          y={l.y - 6}
          w={28}
          size={l.d === 0 ? 14 : 12}
          font={fonts.oswaldSemiBold}
          color={l.d >= 1 ? '#b3271e' : '#2e2618'}
        >
          {l.d > 0 ? `+${l.d}` : `${l.d}`}
        </Lbl>
      ))}
      {/* SPL-span brackets on the INNER side of the arc (SPL popup): lowText at the
          −20 mark, highText at the 0 mark — the SPL range mapped onto the VU. Drawn
          in BLUE (owner 2026-07-30) to match the blue RANGE buttons that set them. */}
      {p.scaleBrackets != null ? (
        <>
          <Lbl x={G.brLow.x - 24} y={G.brLow.y - 5} w={48} size={9.5} font={fonts.oswaldSemiBold} ls={0.3} color="#1f5fd0">
            {p.scaleBrackets.lowText}
          </Lbl>
          {p.scaleBrackets.mid10Text != null ? (
            <Lbl x={G.brMid10.x - 24} y={G.brMid10.y - 5} w={48} size={9.5} font={fonts.oswaldSemiBold} ls={0.3} color="#1f5fd0">
              {p.scaleBrackets.mid10Text}
            </Lbl>
          ) : null}
          {p.scaleBrackets.mid5Text != null ? (
            <Lbl x={G.brMid5.x - 24} y={G.brMid5.y - 5} w={48} size={9.5} font={fonts.oswaldSemiBold} ls={0.3} color="#1f5fd0">
              {p.scaleBrackets.mid5Text}
            </Lbl>
          ) : null}
          <Lbl x={G.brHigh.x - 24} y={G.brHigh.y - 5} w={48} size={9.5} font={fonts.oswaldSemiBold} ls={0.3} color="#1f5fd0">
            {p.scaleBrackets.highText}
          </Lbl>
        </>
      ) : null}
      {/* VU wordmark: centred at the MIDPOINT between the blue in-arc numbers
          (radius ≈ R−15) and the pivot hub (owner 2026-07-30) — raised up out of
          the pivot zone. Center column is clear of the needle blade at rest. */}
      <Lbl x={cx - 26} y={wmTopY} w={52} size={wmSize} font={fonts.oswaldSemiBold} color="#2b2417" ls={3}>
        VU
      </Lbl>
      {showLed ? (
        <Lbl x={ledX - 20} y={ledY + 9} w={40} size={6.5} color="#8c2f24" ls={1}>
          PEAK
        </Lbl>
      ) : null}
      {/* Digital readouts printed on the glass (SPL popup): MAX (bottom-left) +
          the live level with a "dB" unit (bottom-right). Formatted by caller. */}
      {/* C1/C4: RANGE reference stays TOP-LEFT, larger + bold. */}
      {p.cornerReadouts?.rangeText != null ? (
        <Lbl x={fx + 12} y={fy + 8} w={fw - 24} align="left" size={11} font={fonts.oswaldSemiBold} ls={1.2} color="#6e5a34">
          {p.cornerReadouts.rangeText}
        </Lbl>
      ) : null}
      {/* C4: MAX reference stays BOTTOM-LEFT, larger. Colored RED (the peak-hold-
          in-SPL reading) — both the caption and the value. */}
      {p.cornerReadouts?.maxText != null ? (
        <>
          <Lbl x={fx + 18} y={py - 34} w={70} align="left" size={9} font={fonts.oswaldSemiBold} ls={1} color="#b3271e">
            MAX
          </Lbl>
          <Lbl x={fx + 18} y={py - 23} w={110} align="left" size={18} font={fonts.oswaldSemiBold} color="#b3271e">
            {p.cornerReadouts.maxText}
          </Lbl>
        </>
      ) : null}
      {/* C3: the live level in the BOTTOM-RIGHT — EXTRA large, "dB" unit beside
          it. Raised above the pivot boss so it never collides with the needle. */}
      {p.cornerReadouts?.levelText != null ? (
        <>
          <Lbl x={fx + fw - 132} y={py - 34} w={92} align="right" size={27} font={fonts.oswaldSemiBold} color="#2b2417">
            {p.cornerReadouts.levelText}
          </Lbl>
          <Lbl x={fx + fw - 36} y={py - 19} w={22} align="left" size={11} font={fonts.oswaldSemiBold} ls={0.6} color="#8a6a3a">
            dB
          </Lbl>
        </>
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
  // Taller face + bigger fonts (owner 2026-08-05: the display was too small to
  // read). The integrated LUFS numeral is the headline, enlarged up top.
  const h = p.height ?? 300;
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
        <SkLine p1={{ x: 10, y: 2 }} p2={{ x: w - 10, y: 2 }} color="#5a6376" strokeWidth={1} opacity={0.6} />
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
      <Lbl x={10} y={6} w={200} align="left" size={11} font={fonts.oswaldSemiBold} ls={1}>
        LOUDNESS · LUFS
      </Lbl>
      {[0, -9, -18, -27, -36].map((v) => (
        <Lbl key={v} x={0} y={yL(v) - 5} w={28} align="right" size={9}>
          {`${v}`}
        </Lbl>
      ))}
      <Lbl x={mX + barW / 2 - 12} y={barBot + 8} w={24} size={11} color="#9aa0ac">
        M
      </Lbl>
      <Lbl x={sX + barW / 2 - 12} y={barBot + 8} w={24} size={11} color="#9aa0ac">
        S
      </Lbl>
      <Lbl x={mX - 6} y={yL(-14) - 13} w={90} align="left" size={9} color={AMBER}>
        TARGET −14
      </Lbl>
      {/* Integrated LUFS — the headline number, enlarged up top. */}
      <Lbl x={cMid - 95} y={24} w={190} size={48} color={AMBER}>
        {sim.integratedLufs.toFixed(1)}
      </Lbl>
      <Lbl x={cMid - 95} y={80} w={190} size={11} ls={1}>
        LUFS INTEGRATED
      </Lbl>
      <Lbl x={cMid - 95} y={G.lraY + 12} w={190} size={11} color="#9db4d6">
        {`LRA ${sim.lraLu.toFixed(1)} LU`}
      </Lbl>
      <Lbl x={histX} y={histBot + 7} w={histW} size={9}>
        SHORT-TERM · LOOP ≈ 24 s
      </Lbl>
      <Lbl x={w - 110} y={32} w={98} align="right" size={10} color={over ? RED : TEXT_DIM}>
        {`TP ${sim.truePeakDbtp.toFixed(1)} dBTP`}
      </Lbl>
      <Lbl x={w - 62} y={12} w={22} align="right" size={9} color={over ? '#f4d9d5' : TEXT_DIM}>
        TP
      </Lbl>
      <Lbl x={10} y={h - 16} w={260} align="left" size={9}>
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

// ─────────────────────────────────────────────────────────────────────────────
// SplDial ⭐ — the SPL screen's circular needle meter (owner 2026-07-30)

/** The "Noise'o'Meter" round dB-SPL gauge for the SPL-meter VU popup (restyled
 *  2026-07-30 — now SEPARATE from the VU: the VU is the relative hero, this is
 *  the absolute SPL dial). A beveled steel bezel with corner screws, a COLORED
 *  loudness arc sweeping GREEN (low) → YELLOW → ORANGE → RED (high) with ticks +
 *  numerals, a physically-ballistic needle, and an inner CONTROL-ROOM MIXING
 *  SWEET-SPOT band (79/82/85 dB(C)) with room-size ticks + hearing-risk (above)
 *  and bass-accuracy (below) annotations.
 *
 *  HONESTY (§1.7): the SPL scale is field-calibrated-approximate at best. Drive
 *  `calibrated=false` and the whole dial is badged ESTIMATED; `splOffset` is the
 *  dB added to the live dBFS to display dB SPL (the screen's calibration offset,
 *  or a nominal 100 dB estimate) — so the needle position ALWAYS matches the
 *  numbers the rest of the screen prints.
 *
 *  The digital readouts now live on the VU face; the level and peak props are
 *  kept OPTIONAL only for prop-compatibility and are no longer drawn here. */
/** Per-mode, per-callout EXACT label positions the owner tuned in the layout
 *  designer (fractions of the dial box w×h — device-independent, so they map to
 *  any screen). When a callout's dB has an entry here, its label goes EXACTLY at
 *  (fx·w, fy·h) with its leader from there to the true dB anchor — bypassing the
 *  auto column/stack placement. Modes/callouts absent here keep the auto layout.
 *  (Owner 2026-07-31: studio tuned; spl/optimal to follow.) */
const CALLOUT_POS: Record<string, Record<number, { fx: number; fy: number }>> = {
  studio: {
    72: { fx: 0.4302, fy: 0.4209 }, // GENERAL EDITING
    62: { fx: 0.3477, fy: 0.5395 }, // BACKGROUND · DETAIL
    79: { fx: 0.5713, fy: 0.433 },  // CRITICAL BALANCING
    90: { fx: 0.6915, fy: 0.5609 }, // IMPACT CHECK
  },
};

export function SplDialView(p: {
  width: number;
  height?: number;
  phase: SharedValue<number>;
  /** Live drive — the needle chases rmsDb (the selected weighting level). */
  live: LiveMeterDrive;
  /** dB added to a live dBFS value to display dB SPL (offset, or 100 nominal). */
  splOffset: number;
  /** True ⇒ field-calibrated (approximate); false ⇒ badge the dial ESTIMATED. */
  calibrated: boolean;
  /** Which annotations the ring conveys (owner 2026-07-30). 'studio' = the
   *  control-room 79–85 dB(C) sweet-spot band + monitoring guidance; 'spl' =
   *  common reference sounds at their dB along the arc + the 100+ exposure zone;
   *  'optimal' = optimal reference-listening zones (AMBIENT…LIMIT) at each range
   *  midpoint, coloured by zone. The colored 20–130 arc, ticks, numerals and the
   *  node point are identical in all three — only the labels + top title swap.
   *  Default 'studio'. */
  labelMode?: 'studio' | 'spl' | 'optimal';
  loopSeconds?: number;
  /** Legacy corner-readout props — the readouts moved to the VU; kept optional
   *  for prop-compat, not rendered by the gauge. */
  levelLabel?: string;
  levelValue?: string;
  levelUnit?: string;
  peakValue?: string;
  peakHoldValue?: string;
  peakHot?: boolean;
  peakHoldHot?: boolean;
  /** Live digital SPL number shown LARGE in the CENTRE of the dial (owner
   *  2026-07-30), with a small "dB SPL" sub-label under it. The caller formats it
   *  each frame. Absent ⇒ nothing drawn in the centre. */
  centerText?: string;
  /** Dynamic colour for the big centre dB SPL readout (owner 2026-07-30): the
   *  parent passes the LIVE zone colour so the number turns green/amber/orange/red
   *  as the level moves through the arc's colour zones. Absent ⇒ dark ink. The
   *  small "dB SPL" sub-label stays neutral dark ink regardless. */
  centerColor?: string;
  /** SWEET-SPOT gold frame (owner 2026-07-30): when true, the plate border becomes
   *  a GLOWING GOLD frame (gold stroke + soft BlurMask glow around the plate
   *  rounded-rect) instead of the normal grey border. The parent passes true ONLY
   *  in studio mode when the live level sits in the 78–82 dB sweet spot, so this
   *  renders the glow purely off the prop — no mode gating here. Absent/false ⇒
   *  the normal plate border. */
  sweetSpot?: boolean;
}) {
  const w = p.width;
  const h = p.height ?? Math.round(w * 1.02);
  const LOOP = p.loopSeconds ?? 4;
  const liveRms = p.live.rmsDb;
  const mode = p.labelMode ?? 'studio';

  // Scale: 50..100 dB SPL across a ±A° sweep (owner 2026-07-31: bottom-left starts
  // at 50 dB, top peaks at 100 dB), pivot low-of-centre so the bottom wedge is free
  // for the sweet-spot band / reference labels.
  const SPL_MIN = 50;
  const SPL_MAX = 100;
  const SPAN = SPL_MAX - SPL_MIN;
  const A = 122; // half-sweep, degrees (244° total, gap at the bottom)
  const cx = w / 2;
  // A1 (owner 2026-07-30): the round metal housing is GONE — a dark rounded-rect
  // plate fills the whole component (see G.plate). LAYOUT FLIPPED (owner
  // 2026-07-30 v2): the parent draws STUDIO/SPL buttons absolute in the reserved
  // TOP-LEFT (~110×30); the descriptive caption stack now sits at the TOP, centred,
  // starting just below that button row. The dial (face + arc + node) is pushed
  // DOWN into the LOWER portion so its top opens up — the callout labels live in
  // the UPPER side margins and their leaders run DOWN-and-in onto the arc.
  const plateR = 14; // plate corner radius
  const bottomPad = 8;
  // Reserved TOP caption band (wordmark + mode caption + ESTIMATED badge), below
  // the STUDIO/SPL buttons. Its height sets how much room the dial gets below it.
  // Trimmed (owner 2026-07-30): the title block now starts LOWER (y≈46, clearing
  // the STUDIO/SPL buttons with breathing room) but the reserved band is smaller
  // so the dial rides UP to meet it — more space buttons→title, less title→dial.
  const topTextH = Math.max(104, Math.round(h * 0.3));
  // B2 (owner 2026-07-30): dial ~72% of the fit radius, opening horizontal room in
  // the side margins for the callout labels.
  const dialRegionH = h - topTextH - bottomPad;
  const Rface = 0.72 * Math.max(40, Math.min(w / 2 - 6, dialRegionH / 2 - 3));
  // Pivot pushed DOWN: seat the face near the bottom so the dial fills the lower
  // portion and the whole top (above the arc) is free for high labels + captions.
  const cy = h - bottomPad - Rface;
  const Rs = Rface / 1.28; // scale (tick) radius
  const wArc = Math.max(6, Rface * 0.09); // colored loudness-arc thickness
  const splPct = (spl: number) => (spl - SPL_MIN) / SPAN;
  const angOf = (spl: number) => (-A + 2 * A * splPct(spl)) * DEG; // radians from top

  // ── Printed face: arcs, ticks, sweet-spot band, zone arcs (all static) ─────
  const G = useMemo(() => {
    const pt = (ang: number, r: number) => ({ x: cx + Math.sin(ang) * r, y: cy - Math.cos(ang) * r });
    // Stroked arc (open) along a single radius between two SPL angles.
    const arcStroke = (spl0: number, spl1: number, r: number) => {
      const path = Skia.Path.Make();
      const a0 = angOf(spl0);
      const a1 = angOf(spl1);
      path.addArc(Skia.XYWHRect(cx - r, cy - r, 2 * r, 2 * r), a0 / DEG - 90, (a1 - a0) / DEG);
      return path;
    };

    // A1: dark rounded-rect PLATE (fills the component) + upper cream face plate.
    const plate = Skia.Path.Make();
    plate.addRRect(Skia.RRectXY(Skia.XYWHRect(0, 0, w, h), plateR, plateR));
    const face = Skia.Path.Make();
    face.addCircle(cx, cy, Rface);
    // Diagonal glass sheen band across the upper face.
    const sheen = Skia.Path.Make();
    sheen.moveTo(cx - Rface * 0.5, cy - Rface * 0.92);
    sheen.lineTo(cx + Rface * 0.1, cy - Rface * 0.92);
    sheen.lineTo(cx - Rface * 0.55, cy + Rface * 0.2);
    sheen.lineTo(cx - Rface * 0.95, cy + Rface * 0.1);
    sheen.close();

    // A3 — UNIFIED zone bands (owner 2026-07-30): GRAY below the green start,
    // GREEN up to 84, YELLOW 85–94, ORANGE 95–99, RED 100+. The yellow/orange/red
    // bands are IDENTICAL in every mode; only the green START differs (STUDIO 60,
    // SPL/OPTIMAL 40), so the gray run before it changes length by mode.
    const arcYellow = arcStroke(85, 95, Rs + 2);
    const arcOrange = arcStroke(95, 100, Rs + 2);
    const arcRed = arcStroke(100, SPL_MAX, Rs + 2);
    // STUDIO: gray 30–60, green 60–85.
    const arcStudioGray = arcStroke(SPL_MIN, 60, Rs + 2);
    const arcStudioGreen = arcStroke(60, 85, Rs + 2);
    // STUDIO golden SWEET-SPOT band (owner 2026-07-30, item 5): a GOLD arc segment
    // 79→85 dB drawn over the green zone — the monitoring sweet spot the parent also
    // lights the gold FRAME for. Distinct gold region, not green.
    const arcStudioGold = arcStroke(79, 85, Rs + 2);
    // SPL / OPTIMAL: green runs from the new 50 dB floor up to 85 (no gray run
    // below it now that the scale starts at 50 — owner 2026-07-31).
    const arcSplGray = arcStroke(SPL_MIN, SPL_MIN, Rs + 2); // empty
    const arcSplGreen = arcStroke(SPL_MIN, 85, Rs + 2);
    // SPL-specific bands (owner 2026-07-30, item 7): yellow 85–90, ORANGE concert
    // emphasis 90–96, RED from 96 (red begins right after the concert band). The 100
    // boundary tick + "100" numeral + 100+ callout still sit at 100 (drawn elsewhere).
    const arcSplYellow = arcStroke(85, 90, Rs + 2);
    const arcSplOrange = arcStroke(90, 96, Rs + 2);
    const arcSplRed = arcStroke(96, SPL_MAX, Rs + 2);
    // Major/minor ticks (20..130 dB) drawn in dark ink over the colored arc.
    const majors = Skia.Path.Make();
    const minors = Skia.Path.Make();
    for (let s = SPL_MIN; s <= SPL_MAX; s += 5) {
      const a = angOf(s);
      const isMaj = s % 10 === 0;
      const p0 = pt(a, Rs + 2);
      const p1 = pt(a, Rs + (isMaj ? 11 : 6));
      (isMaj ? majors : minors).moveTo(p0.x, p0.y);
      (isMaj ? majors : minors).lineTo(p1.x, p1.y);
    }
    // STUDIO room-size ticks at 79/82/85, pointing OUTWARD just above the arc
    // (A4: the SM/MD/LG band ticks stay around the arc, no inner ring).
    const sizeTicks = Skia.Path.Make();
    for (const s of [79, 82, 85]) {
      const a = angOf(s);
      const q0 = pt(a, Rs + 2 + wArc * 0.5);
      const q1 = pt(a, Rs + 2 + wArc * 0.5 + 6);
      sizeTicks.moveTo(q0.x, q0.y);
      sizeTicks.lineTo(q1.x, q1.y);
    }

    // THE 100 BOUNDARY (owner 2026-07-30): 100 dB is where RED begins — the red arc
    // band already starts exactly at 100 (arcRed = arcStroke(100, …)). Mark it with a
    // heavier, LONGER tick straddling the arc so the red-zone start reads clearly, and
    // print a "100" numeral on the scale (below).
    const boundaryTick = Skia.Path.Make();
    {
      const a = angOf(100);
      const b0 = pt(a, Rs - 3);
      const b1 = pt(a, Rs + 14);
      boundaryTick.moveTo(b0.x, b0.y);
      boundaryTick.lineTo(b1.x, b1.y);
    }

    // Numeric dB scale sits INSIDE the arc line (kept clean, nothing overlaps). 100 is
    // included as the labelled red-zone boundary (rendered in red ink below).
    const numAt = (s: number, r: number) => {
      const lp = pt(angOf(s), r);
      return { x: lp.x, y: lp.y };
    };
    const numLabels = [50, 60, 70, 80, 90, 100].map((s) => ({ s, ...numAt(s, Rs - 13) }));

    return {
      plate, face, sheen, arcYellow, arcOrange, arcRed,
      arcStudioGray, arcStudioGreen, arcStudioGold, arcSplGray, arcSplGreen,
      arcSplYellow, arcSplOrange, arcSplRed, majors, minors, sizeTicks,
      boundaryTick, numLabels,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w, h]);

  // ── REAL ballistics — 300 ms first-order integrator chasing live SPL, with a
  // lightly under-damped follower for the mechanical needle overshoot (the
  // vuStep idiom, matching VuMeterView). Integrates true wall-time via the
  // phase-clock delta. −Infinity/NaN silence parks the needle at SPL_MIN.
  const val = useSharedValue(0);
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
    const raw = liveRms.value;
    const spl = raw === raw && raw > -120 ? raw + p.splOffset : SPL_MIN;
    let target = (spl - SPL_MIN) / SPAN;
    if (target < 0) target = 0;
    if (target > 1.04) target = 1.04;
    // Faster follower (owner 2026-08-05: the meter felt sluggish) — tc 0.1→0.07.
    const a = 1 - Math.exp(-dt / 0.07);
    val.value = val.value + (target - val.value) * a;
    // Under-damped needle spring, SUB-STEPPED (owner 2026-08-05). k=700 at the
    // 0.08 s dt cap is 700·0.08 ≈ 56 ≫ 2 = numerically unstable — it overshot
    // and snapped, which read as lag/jitter. Small fixed sub-steps keep it
    // stable and snappy (same fix as the VU needle).
    let rem = dt;
    while (rem > 1e-6) {
      const h = rem > 0.002 ? 0.002 : rem;
      const acc = (val.value - nx.value) * 700 - nv.value * 38;
      nv.value = nv.value + acc * h;
      nx.value = nx.value + nv.value * h;
      rem -= h;
    }
    let pct = nx.value;
    if (pct < -0.02) pct = -0.02;
    if (pct > 1.05) pct = 1.05;
    return (-A + 2 * A * pct) * DEG;
  }, [p.phase, liveRms, p.splOffset, LOOP]);

  // ── NODE POINT (owner 2026-07-30): NO centre needle — a glowing filled dot
  // rides the colored arc LINE at the current level's angle, gliding via the
  // same integrator above. Core + soft halo are rebuilt per frame in world
  // coords (house rule: geometry in worklets, no animated CTM).
  const nodeCoreR = Math.max(4, Rface * 0.05);
  const nodeHaloR = nodeCoreR * 2.3;
  const nodeArcR = Rs + 2; // sits ON the colored loudness-arc line
  const nodeCore = useDerivedValue(() => {
    const th = needleRad.value;
    const x = cx + Math.sin(th) * nodeArcR;
    const y = cy - Math.cos(th) * nodeArcR;
    const pth = Skia.Path.Make();
    pth.addCircle(x, y, nodeCoreR);
    return pth;
  }, [needleRad]);
  const nodeHalo = useDerivedValue(() => {
    const th = needleRad.value;
    const x = cx + Math.sin(th) * nodeArcR;
    const y = cy - Math.cos(th) * nodeArcR;
    const pth = Skia.Path.Make();
    pth.addCircle(x, y, nodeHaloR);
    return pth;
  }, [needleRad]);

  const ink = '#1c1c1c';
  // B1 (owner 2026-07-30): light-gray theme — the old mid-gray inkDim (#6a6250)
  // washed out on gray, so it goes DARKER for clear contrast.
  const inkDim = '#3f3a30';
  const RED_INK = '#b3271e';
  // Sweet-spot GOLD (owner 2026-07-30): a readable gold on the gray plate, used for
  // the studio CRITICAL BALANCE callout + leader to mark the sweet spot on the chart.
  const GOLD_INK = '#d4a017';
  // Brighter gold for the studio SWEET-SPOT arc band (79–85) so it reads as its own
  // zone over the green (owner 2026-07-30, item 5). Pushed BRIGHTER/more saturated
  // (final polish) so the 79–85 sweet-spot band pops clearly off the darker green.
  const GOLD_BAND = '#f5c024';
  // Zone palette — darkened to read on the LIGHT-GRAY face (owner 2026-07-30).
  // Used for BOTH the arc strokes and the zone-matched callout labels + leaders.
  const Z_GREEN = '#1f7a34';
  const Z_AMBER = '#b8860b';
  // Darker amber for TEXT only (owner 2026-07-30 v2): the arc keeps Z_AMBER, but
  // amber label text washed out on the darker medium-gray plate, so it goes deeper.
  const Z_AMBER_TXT = '#8a6508';
  const Z_ORANGE = '#c9631a';
  const Z_RED = '#b3271e';
  // Dim/grey studio zone — darkened so the below-sweet-spot arc still reads on gray.
  const Z_GREY = '#6b7078';

  // ── LIVE CONTAINER TINT (owner 2026-07-30; mode-matched 2026-08-01): a soft
  // colour wash over the WHOLE plate (the container) that reflects the CURRENT
  // level's zone. The thresholds now MATCH EACH MODE'S OWN ARC BANDS exactly, so
  // the container always lights up the same colour as the section the needle is in
  // for that view — STUDIO (grey→green→GOLD sweet spot→yellow→orange), SPL
  // (green→yellow→orange→red at 96), OPTIMAL (green→yellow→orange→red at 100).
  // Driven live off the same rmsDb+splOffset the centre readout uses.
  const tintGrey = withAlpha(Z_GREY, 0.14); // subtle
  const tintGreen = withAlpha('#1faa3f', 0.3);
  const tintGold = withAlpha('#e8b53a', 0.3); // studio sweet-spot gold band
  const tintYellow = withAlpha('#e6b220', 0.3);
  const tintOrange = withAlpha('#e8701c', 0.32);
  const tintRed = withAlpha('#dd352a', 0.34);
  const tintColor = useDerivedValue(() => {
    const raw = liveRms.value;
    const spl = raw === raw && raw > -120 ? raw + p.splOffset : SPL_MIN;
    if (mode === 'studio') {
      // grey 50–60 · green 60–79 · GOLD sweet spot 79–85 · yellow 85–95 · orange 95+
      if (spl < 60) return tintGrey;
      if (spl < 79) return tintGreen;
      if (spl < 85) return tintGold;
      if (spl < 95) return tintYellow;
      return tintOrange;
    }
    if (mode === 'spl') {
      // green 50–85 · yellow 85–90 · orange 90–96 · red 96+
      if (spl < 85) return tintGreen;
      if (spl < 90) return tintYellow;
      if (spl < 96) return tintOrange;
      return tintRed;
    }
    // optimal — green 50–85 · yellow 85–95 · orange 95–100 · red 100+
    if (spl < 85) return tintGreen;
    if (spl < 95) return tintYellow;
    if (spl < 100) return tintOrange;
    return tintRed;
  }, [liveRms, p.splOffset, mode]);

  // ── SWEET-SPOT GOLD GLOW (owner 2026-07-30 v3 — STATIC, no animation): the
  // shimmer/pulse is GONE. Both the CRITICAL BALANCING callout glow (studio mode)
  // and the `sweetSpot` plate frame now use fixed, static gold glow values — no
  // `phase`-driven breathe. The CRITICAL BALANCING callout glow is dialled WAY
  // back (~13% of the old full glow) and leans instead on a strong STATIC drop
  // shadow on the gold title text (below); the plate frame keeps a subtle static
  // gold glow. All values are plain constants so nothing rides the clock.
  const GOLD_GLOW_OPACITY = 0.13; // CRITICAL BALANCING callout glow — ~13% of full
  const GOLD_GLOW_BLUR = 5;
  const FRAME_GLOW_OPACITY = 0.26; // sweet-spot plate frame — subtle static glow
  const FRAME_GLOW_BLUR = 13.5; // 3× thicker gold frame (owner 2026-07-30): glow blur scaled to match (4.5→13.5)

  // ── CALLOUT LABELS (owner 2026-07-30 redesign v2 — distribute around the WHOLE
  // circle): every descriptive/reference label is placed RADIALLY OUTSIDE its
  // exact-dB anchor, so the labels ring the arc — lower-left (low dB) sweeping up
  // and over to lower-right (high dB) — instead of parking only in the side
  // margins. Each label is connected to its EXACT dB point on the arc line by a
  // thin LEADER hairline ending in a small dot ON the arc. A per-side vertical
  // de-collision keeps stacked neighbours apart while the leader still lands on
  // the TRUE anchor. Rebuilt only when the size or the label mode changes.
  const CO = useMemo(() => {
    const arcR = Rs + 2;
    // The leader endpoint is EXACTLY angOf(spl) on the arc line — the dB printed in
    // each label IS this anchor's spl, so the hairline lands right on its numeral.
    const anchor = (spl: number) => {
      const a = angOf(spl);
      return { x: cx + Math.sin(a) * arcR, y: cy - Math.cos(a) * arcR };
    };
    const lineH = 14; // line-to-line breathing room within a callout block
    const goldLineH = 21; // taller step for the ENLARGED CRITICAL BALANCE title
    type CoLine = { t: string; size: number; color: string; ls?: number };
    type Col = 'L' | 'C' | 'R';
    // `color` = the zone colour that tints this callout's leader + anchor dot.
    // `gold` marks the sweet-spot CRITICAL BALANCE callout (studio mode) — it gets
    // the enlarged title + the animated shiny-gold shimmer glow.
    // Placement overrides (owner 2026-07-30) used to hand-balance SPL/OPTIMAL:
    //   forceCol — pin to a column, bypassing the sign/fan-out auto-placement;
    //   rScale   — scale the vertical label ray (>1 lifts the box toward the top,
    //              <1 drops it toward the arc);
    //   nearer   — pull the box toward the dial by N px (side cols) or nudge a
    //              centre box right by N px.
    type CoDef = {
      spl: number; color: string; lines: CoLine[]; gold?: boolean;
      forceCol?: Col; rScale?: number; nearer?: number;
    };
    const defs: CoDef[] =
      mode === 'spl'
        ? [
            // Common reference sounds at their dB along the arc. (QUIET ROOM removed
            // — owner 2026-07-31; it sat below the new 50 dB floor anyway.)
            { spl: 60, color: Z_GREEN, lines: [ { t: 'CONVERSATION', size: 12.5, color: Z_GREEN, ls: 0.3 }, { t: '~60 dBA', size: 10, color: inkDim } ] },
            // Colour COHERENCE (owner final polish): 79 dBC sits squarely in the
            // GREEN reference band, so the marker is GREEN (was amber, which read as a
            // zone mismatch pointing into green). Reads as the reference-level marker.
            { spl: 79, color: Z_GREEN, lines: [ { t: 'STUDIO LISTENING', size: 11, color: Z_GREEN, ls: 0.2 }, { t: '~79 dBC', size: 10, color: inkDim } ] },
            // CONCERT = the 90–96 dB ORANGE emphasis band; leader lands mid-band (93).
            { spl: 93, color: Z_ORANGE, lines: [ { t: 'CONCERT', size: 12.5, color: Z_ORANGE, ls: 0.3 }, { t: '90dB–96dB', size: 10, color: inkDim } ] },
            // 100+ exposure zone — leader stays EXACTLY on the 100 red-zone boundary
            // (item 7: the 100 tick/label + this 100+ callout remain anchored at 100
            //  even though the SPL red arc now begins at 96).
            { spl: 100, color: Z_RED, lines: [ { t: '100+ dB', size: 12.5, color: Z_RED, ls: 0.3 }, { t: 'UNSAFE >15 MIN/DAY', size: 9, color: Z_RED } ] },
          ]
        : mode === 'optimal'
        ? [
            // Optimal reference-listening zones — leader anchored at each RANGE
            // MIDPOINT, coloured by zone (item 9).
            // Redistributed around the circle (owner 2026-07-30, item 8): AMBIENT
            // stays lower-left; PROGRAM moves to the RIGHT and a little closer;
            // REFERENCE moves ABOVE the dial, just right of centre; SHOW/HIGH/LIMIT
            // and 100+ ring the RIGHT side top→bottom, lifted up and evenly spread.
            // LEFT column (right-aligned), top→bottom: PROGRAM (69), AMBIENT (50).
            { spl: 50, color: Z_GREEN, lines: [ { t: 'AMBIENT', size: 12.5, color: Z_GREEN, ls: 0.3 }, { t: '40–59 dBA', size: 10, color: inkDim } ] },
            // PROGRAM · 60–78 dBA = GREEN, not amber (owner 2026-07-30). Falls naturally
            // into the LEFT column now (owner 2026-07-30 v3 — no forced/radial layout).
            { spl: 69, color: Z_GREEN, lines: [ { t: 'PROGRAM', size: 12.5, color: Z_GREEN, ls: 0.3 }, { t: '60–78 dBA', size: 10, color: inkDim } ] },
            // TOP CENTRE — REFERENCE, just above the dial, a touch right of centre.
            { spl: 81, color: Z_GREEN, forceCol: 'C', nearer: 16, lines: [ { t: 'REFERENCE', size: 12.5, color: Z_GREEN, ls: 0.3 }, { t: '79–84 dBA', size: 10, color: inkDim } ] },
            // RIGHT column (left-aligned), top→bottom EVENLY spaced: SHOW, HIGH, LIMIT, 100+.
            // Colour COHERENCE (owner final polish): SHOW's anchor (89) lands in the
            // YELLOW band, so it is AMBER (was orange → zone mismatch). HIGH (95) sits
            // at the yellow→orange boundary and stays orange; LIMIT/100+ stay red.
            { spl: 89, color: Z_AMBER, lines: [ { t: 'SHOW', size: 12.5, color: Z_AMBER_TXT, ls: 0.3 }, { t: '85–93 dBA', size: 10, color: inkDim } ] },
            { spl: 95, color: Z_ORANGE, lines: [ { t: 'HIGH', size: 12.5, color: Z_ORANGE, ls: 0.3 }, { t: '94–96 dBA', size: 10, color: inkDim } ] },
            { spl: 98, color: Z_RED, lines: [ { t: 'LIMIT', size: 12.5, color: Z_RED, ls: 0.3 }, { t: '97–99 dBA', size: 10, color: inkDim } ] },
            // 100+ exposure zone — anchored at the 100 dB top of the scale (owner
            // 2026-07-31: the scale now peaks at 100), seated at the BOTTOM of the
            // right column by the even-spacing stack.
            { spl: 100, color: Z_RED, lines: [ { t: '100+ dB LAeq', size: 12, color: Z_RED, ls: 0.2 }, { t: 'WHO 15-MIN LIMIT', size: 9, color: Z_RED } ] },
          ]
        : [
            // Studio: four long-term mixing bands. First three green, the brief
            // IMPACT CHECK orange.
            { spl: 62, color: Z_GREEN, lines: [ { t: 'BACKGROUND · DETAIL', size: 10.5, color: Z_GREEN, ls: 0.1 }, { t: '60–65 dB SPL', size: 10, color: inkDim } ] },
            { spl: 72, color: Z_GREEN, lines: [ { t: 'GENERAL EDITING', size: 12, color: Z_GREEN, ls: 0.2 }, { t: '70–75 dB SPL', size: 10, color: inkDim } ] },
            // CRITICAL BALANCE = the sweet spot — the KEY marker: ENLARGED gold title
            // (bigger than the other callouts) with the animated shiny-gold shimmer
            // glow + leader (owner 2026-07-30).
            { spl: 79, color: GOLD_INK, gold: true, lines: [ { t: 'CRITICAL BALANCING', size: 15.5, color: GOLD_INK, ls: 0.3 }, { t: '76dB–84dB', size: 10, color: inkDim } ] },
            // Colour COHERENCE (owner final polish): the 85–95 IMPACT CHECK band is the
            // YELLOW zone (anchor 90 sits on it), so the callout is AMBER, not orange.
            { spl: 90, color: Z_AMBER, lines: [ { t: 'IMPACT CHECK', size: 12.5, color: Z_AMBER_TXT, ls: 0.3 }, { t: '85–95 dB SPL · brief', size: 9.5, color: inkDim } ] },
          ];

    // THREE horizontally-DISJOINT columns (owner 2026-07-30 v3): a LEFT margin
    // column, a CENTER band that lives strictly BETWEEN the columns (over the top
    // of the arc), and a RIGHT margin column. Because the three x-ranges never
    // overlap, a callout box can only ever collide with another box in its OWN
    // column — so a single per-column vertical stack fully de-collides everything,
    // and no box can touch the arc ring or the dial numerals (which all sit inside
    // the center band, well below where the center callouts are seated).
    //
    // Vertical position follows the anchor's ray (labels ring the arc top→bottom);
    // horizontal position is pinned to the column so text always clears the arc.
    const arcOuter = arcR + wArc / 2;      // outer edge of the coloured arc stroke
    const edgePad = 4;
    // Callout spread (owner 2026-07-30): SPL & OPTIMAL callouts were sitting too CLOSE
    // to the arc. Push their columns FARTHER out (bigger colPad) and give them a LONGER
    // leader / larger label ray radius so they ring the circle like STUDIO's do. STUDIO
    // keeps its existing (already well-spread) values.
    const wide = mode !== 'studio';
    const colPad = wide ? 16 : 8;               // clearance from the arc to a side column
    const leftInner = cx - arcOuter - colPad;   // right edge of the LEFT column
    const rightInner = cx + arcOuter + colPad;  // left edge of the RIGHT column
    const centerHalf = Math.min((rightInner - leftInner) / 2, 74);
    const labelR = arcOuter + Math.max(wide ? 42 : 26, Rface * (wide ? 0.6 : 0.42)); // ray radius for vertical
    const CENTER_SIN = 0.2;                 // |sin| below this ⇒ a top-centre anchor
    // Keep every callout below the top caption/title block and above the bottom.
    // Floor at 134 so the title stack (now start y≈56, two-line title + ESTIMATED
    // badge, bottoming out around y≈112) is always cleared with margin even when the
    // trimmed topTextH would otherwise seat callouts higher.
    const topLimit = Math.max(topTextH + 12, 134);
    const botLimit = h - 6;
    const minGap = 7;

    type Item = {
      def: CoDef; sn: number; cs: number; col: Col; th: number; lh: number; ly: number;
      ty: number; bx: number; bw: number; align: 'left' | 'center' | 'right';
      innerX: number; ax: number; ay: number;
    };
    const items: Item[] = defs.map((d) => {
      const a = angOf(d.spl);
      const sn = Math.sin(a);
      const cs = Math.cos(a);
      const an = anchor(d.spl);
      const col: Col = d.forceCol ?? (Math.abs(sn) < CENTER_SIN ? 'C' : sn < 0 ? 'L' : 'R');
      const lh = d.gold ? goldLineH : lineH;
      return {
        def: d, sn, cs, col, th: d.lines.length * lh, lh, ly: cy - cs * labelR * (d.rScale ?? 1),
        ty: 0, bx: 0, bw: 0, align: 'center', innerX: 0, ax: an.x, ay: an.y,
      };
    });

    // A crowded top-centre (≥ 2 near-vertical anchors, e.g. STUDIO's 72 & 79) can
    // neither stack cleanly (too little room above the arc) nor sit side-by-side
    // (labels too wide) — so fan the pair back out to the side columns by sign.
    // EXCEPTION (owner 2026-07-30): the sweet-spot `gold` CRITICAL BALANCE callout
    // and any explicitly `forceCol`-pinned callout keep their centre seat so the key
    // marker rides HIGH and CLOSE over the top of the dial.
    const centred = items.filter((i) => i.col === 'C');
    if (centred.length >= 2)
      for (const i of centred) {
        if (i.def.gold || i.def.forceCol) continue;
        i.col = i.sn < 0 ? 'L' : 'R';
      }

    // Horizontal box per column — FIXED DISJOINT COLUMNS in every mode (owner
    // 2026-07-30 v3): the old radial/ray-based innerX (which parked SPL/OPTIMAL
    // side boxes at UNEVEN distances from the arc) is GONE. Every LEFT box is
    // right-aligned to the same `leftInner`, every RIGHT box is left-aligned from
    // the same `rightInner`, and the CENTER box is centred over the arc top —
    // so left and right columns sit an EQUAL, consistent distance from the arc.
    // The leader always starts at the box edge nearest the dial (innerX).
    for (const i of items) {
      const near = i.def.nearer ?? 0;
      if (i.col === 'C') {
        // Centre block, optionally nudged right of centre by `nearer`.
        i.align = 'center'; i.bw = centerHalf * 2; i.bx = cx - centerHalf + near; i.innerX = cx + near;
      } else if (i.col === 'L') {
        const innerX = leftInner + near;
        i.align = 'right'; i.bx = edgePad; i.bw = innerX - edgePad; i.innerX = innerX;
      } else {
        const innerX = rightInner - near;
        i.align = 'left'; i.bx = innerX; i.bw = w - edgePad - innerX; i.innerX = innerX;
      }
    }

    // Per-column vertical stack. ANY LEFT/RIGHT column holding 2+ callouts gets EVEN
    // vertical spacing (owner final polish — unifies all three modes): the group
    // (sorted top→bottom by its anchor height) is laid out with a constant inter-box
    // gap and centred in the dial's vertical band, so neighbours are evenly
    // distributed with matching breathing room and never bunch/converge — this also
    // de-crowds STUDIO's left stack (GENERAL EDITING + BACKGROUND·DETAIL), which used
    // to sit tight near their close anchors. A LONE side callout (e.g. STUDIO's IMPACT
    // CHECK) and every CENTER item keep the anchor-ray seat + downward de-collision so
    // the key marker rides over its true dB. Either way the leader still lands on the
    // TRUE dB anchor (ax,ay), independent of the box y.
    for (const c of ['L', 'C', 'R'] as const) {
      const grp = items.filter((i) => i.col === c).sort((a, b) => a.ly - b.ly);
      if (grp.length === 0) continue;
      if ((c === 'L' || c === 'R') && grp.length >= 2) {
        const evenGap = 15; // comfortable, constant inter-box gap
        const totalH = grp.reduce((s, i) => s + i.th, 0) + evenGap * (grp.length - 1);
        let top = (topLimit + botLimit) / 2 - totalH / 2; // centre the stack in the band
        if (top < topLimit) top = topLimit;
        if (top + totalH > botLimit) top = Math.max(topLimit, botLimit - totalH);
        let cur = top;
        for (const i of grp) {
          i.ty = cur;
          cur += i.th + evenGap;
        }
      } else {
        let prevBot = topLimit;
        for (const i of grp) {
          let ty = i.ly - i.th / 2;
          if (ty < prevBot) ty = prevBot;
          i.ty = ty;
          prevBot = ty + i.th + minGap;
        }
        const last = grp[grp.length - 1];
        if (last) {
          const over = last.ty + last.th - botLimit;
          if (over > 0) {
            let shift = over;
            if (grp[0].ty - shift < topLimit) shift = grp[0].ty - topLimit;
            if (shift > 0) for (const i of grp) i.ty -= shift;
          }
        }
      }
    }

    // Lift the studio sweet-spot (gold) CRITICAL BALANCING callout a little HIGHER
    // (owner 2026-07-30) so there is more padding between it and the top of the
    // arc. It is alone in the centre column, so raising it collides with nothing;
    // floored so it never rides up into the title/ESTIMATED band.
    const goldItem = items.find((i) => i.def.gold);
    if (goldItem) goldItem.ty = Math.max(topLimit - 16, goldItem.ty - 12);

    const laid = items.map((i) => {
      let align = i.align, bx = i.bx, bw = i.bw, ty = i.ty;
      let fromX = i.innerX;
      let fromY = i.col === 'C' ? i.ty + i.th : i.ty + i.th / 2;
      // EXACT owner-tuned position (fractions of w×h) — overrides the auto layout.
      const ov = CALLOUT_POS[mode]?.[i.def.spl];
      if (ov) {
        const lx = ov.fx * w, ly = ov.fy * h;
        const titleSize = i.def.lines[0]?.size ?? 12;
        const isC = Math.abs(ov.fx - 0.5) * w < 24 && ly < cy - Rface * 0.4;
        align = isC ? 'center' : ov.fx < 0.5 ? 'right' : 'left';
        if (align === 'right') { bx = 0; bw = lx; }
        else if (align === 'left') { bx = lx; bw = w - lx; }
        else { bx = lx - 70; bw = 140; }
        ty = Math.round(ly - 0.78 * titleSize); // designer y is the title baseline; Lbl y is the top
        fromX = lx; fromY = ly + 2;
      }
      const leaderPath = Skia.Path.Make();
      leaderPath.moveTo(fromX, fromY);
      leaderPath.lineTo(i.ax, i.ay);
      const dotPath = Skia.Path.Make();
      dotPath.addCircle(i.ax, i.ay, 2.6);
      // NOTE (owner final polish): the old faint gold rounded-RECTANGLE glow BOX
      // behind CRITICAL BALANCING is GONE — it read as an ugly boxy plate. The gold
      // title now stands on its own crisp gold text + strong drop shadow (below), with
      // at most a whisper of glow carried by its leader only (see the Canvas group).
      return {
        spl: i.def.spl, color: i.def.color, lines: i.def.lines, gold: !!i.def.gold,
        align, bx, bw, ty, lineH: i.lh, leaderPath, dotPath,
      };
    });
    return { items: laid };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w, h, mode]);

  // The CRITICAL BALANCE callout (studio mode only) — its LEADER carries a whisper of
  // static gold glow (no box, no shimmer); legibility comes from the gold title's
  // drop shadow drawn in RN over the Canvas.
  const goldCO = CO.items.find((it) => it.gold) ?? null;

  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ position: 'absolute', width: w, height: h, backgroundColor: BG }}>
        {/* A1/B1 — LIGHT-GRAY rounded-rect PLATE (owner 2026-07-30: was white).
            Flat and clean; the slightly-lighter gray face sits in the upper part. */}
        <Path path={G.plate} color="#b2b2b8" />
        {/* Normal grey plate border — replaced by the gold sweet-spot frame (drawn
            last, below) when `sweetSpot` is true. */}
        {!p.sweetSpot ? (
          <Path path={G.plate} color="#9a9aa1" style="stroke" strokeWidth={1} opacity={0.9} />
        ) : null}
        {/* Medium-gray face (LOWER portion), a touch lighter than the plate. */}
        <Path path={G.face} color="#bebec4" />
        {/* LIVE zone tint (owner 2026-07-30): a soft colour wash over the whole
            plate that follows the current level's zone — gray→green→yellow→orange→
            red. Drawn UNDER the arc/ticks/node so those stay crisp; the callout +
            title text lives outside the Canvas, so it is never washed out. */}
        <Path path={G.plate} color={tintColor} />
        {/* A3 — MAIN arc conveys each MODE's ranges (zone palette darkened to read
            on white). STUDIO: dim below the sweet spot, GREEN 79–85 dB(C), RED
            above. SPL: green→amber→orange→red loudness with 100+ emphasised red. */}
        {mode === 'studio' ? (
          <>
            <Path path={G.arcStudioGray} color={Z_GREY} style="stroke" strokeWidth={wArc} strokeCap="butt" opacity={0.9} />
            <Path path={G.arcStudioGreen} color={Z_GREEN} style="stroke" strokeWidth={wArc} strokeCap="butt" />
            {/* GOLDEN SWEET-SPOT band 79→85 (item 5): a soft gold under-glow beneath a
                crisp gold arc, drawn OVER the green so 79–85 reads as its own gold zone. */}
            <Path path={G.arcStudioGold} color={withAlpha(GOLD_BAND, 0.62)} style="stroke" strokeWidth={wArc + 8} strokeCap="butt">
              <BlurMask blur={4} style="normal" />
            </Path>
            <Path path={G.arcStudioGold} color={GOLD_BAND} style="stroke" strokeWidth={wArc} strokeCap="butt" />
            <Path path={G.arcYellow} color={Z_AMBER} style="stroke" strokeWidth={wArc} strokeCap="butt" />
            <Path path={G.arcOrange} color={Z_ORANGE} style="stroke" strokeWidth={wArc} strokeCap="butt" />
            <Path path={G.arcRed} color={Z_RED} style="stroke" strokeWidth={wArc} strokeCap="butt" />
          </>
        ) : mode === 'spl' ? (
          <>
            <Path path={G.arcSplGray} color={Z_GREY} style="stroke" strokeWidth={wArc} strokeCap="butt" opacity={0.9} />
            <Path path={G.arcSplGreen} color={Z_GREEN} style="stroke" strokeWidth={wArc} strokeCap="butt" />
            {/* SPL bands (item 7): yellow 85–90, ORANGE concert 90–96, RED from 96. */}
            <Path path={G.arcSplYellow} color={Z_AMBER} style="stroke" strokeWidth={wArc} strokeCap="butt" />
            <Path path={G.arcSplOrange} color={Z_ORANGE} style="stroke" strokeWidth={wArc} strokeCap="butt" />
            <Path path={G.arcSplRed} color={Z_RED} style="stroke" strokeWidth={wArc} strokeCap="butt" />
          </>
        ) : (
          <>
            <Path path={G.arcSplGray} color={Z_GREY} style="stroke" strokeWidth={wArc} strokeCap="butt" opacity={0.9} />
            <Path path={G.arcSplGreen} color={Z_GREEN} style="stroke" strokeWidth={wArc} strokeCap="butt" />
            <Path path={G.arcYellow} color={Z_AMBER} style="stroke" strokeWidth={wArc} strokeCap="butt" />
            <Path path={G.arcOrange} color={Z_ORANGE} style="stroke" strokeWidth={wArc} strokeCap="butt" />
            <Path path={G.arcRed} color={Z_RED} style="stroke" strokeWidth={wArc} strokeCap="butt" />
          </>
        )}
        <Path path={G.minors} color="#4a4436" style="stroke" strokeWidth={1.1} opacity={0.85} />
        <Path path={G.majors} color={ink} style="stroke" strokeWidth={1.6} />
        {/* 100 = RED-zone boundary: a heavier, longer RED tick marking exactly where
            red begins (owner 2026-07-30). Soft glow under a crisp core. */}
        <Path path={G.boundaryTick} color={withAlpha(RED_INK, 0.5)} style="stroke" strokeWidth={5}>
          <BlurMask blur={3} style="normal" />
        </Path>
        <Path path={G.boundaryTick} color={RED_INK} style="stroke" strokeWidth={2.8} />
        {mode === 'studio' ? (
          <Path path={G.sizeTicks} color={Z_GREEN} style="stroke" strokeWidth={1.8} />
        ) : null}
        {/* SWEET-SPOT GOLD GLOW — CRITICAL BALANCING callout (studio mode). The ugly
            gold rounded-RECTANGLE box is REMOVED (owner final polish); all that remains
            is a single faint, static gold under-glow on the LEADER, so the marker still
            reads as special without any boxy plate. Legibility of the title comes from
            its strong STATIC drop shadow (drawn in RN over the Canvas). */}
        {goldCO ? (
          <Path path={goldCO.leaderPath} color={GOLD_INK} style="stroke" strokeWidth={3} opacity={GOLD_GLOW_OPACITY}>
            <BlurMask blur={GOLD_GLOW_BLUR} style="normal" />
          </Path>
        ) : null}
        {/* LEADER LINES: each callout's uniform thin hairline + a small clean anchor
            dot ON the arc, tinted its ZONE colour (owner final polish). A light cream
            rim rings every dot so it stays a crisp point even when its zone colour
            matches the arc band beneath it (e.g. a green dot on the green band). Drawn
            UNDER the node so the live node point is never obscured. */}
        {CO.items.map((it, idx) => (
          <Group key={`ld${idx}`}>
            <Path path={it.leaderPath} color={it.color} style="stroke" strokeWidth={1.1} opacity={0.92} />
            <Path path={it.dotPath} color={it.color} />
            <Path path={it.dotPath} color="#f4efdf" style="stroke" strokeWidth={1} opacity={0.9} />
          </Group>
        ))}
        {/* NODE POINT riding the arc: soft amber halo + dark core with a light rim
            so it stays visible on every zone colour and on the white face. */}
        <Path path={nodeHalo} color={withAlpha(AMBER, 0.5)}>
          <BlurMask blur={7} style="normal" />
        </Path>
        <Path path={nodeCore} color="#2e2618" />
        <Path path={nodeCore} color="#fff5d8" style="stroke" strokeWidth={1.4} opacity={0.95} />
        {/* Face edge: subtle ring, a shade darker than the gray face for definition. */}
        <Path path={G.face} color="#949499" style="stroke" strokeWidth={1.4} opacity={0.9} />
        {/* SWEET-SPOT GOLD FRAME (owner 2026-07-30): when `sweetSpot`, draw a glowing
            gold frame around the whole plate — a soft BlurMask glow under a crisp gold
            stroke. Drawn LAST so it reads bright over the live tint. The parent passes
            true only in the studio 78–82 dB sweet spot, so no mode gating here. */}
        {p.sweetSpot ? (
          <>
            {/* Subtle STATIC gold frame glow (owner 2026-07-30 v3 — no shimmer/pulse).
                3× THICKER (owner 2026-07-30): glow stroke scaled with the crisp border
                (5→15) so the halo grows to match the fatter gold frame. */}
            <Path path={G.plate} color="#ffcf40" style="stroke" strokeWidth={15} opacity={FRAME_GLOW_OPACITY}>
              <BlurMask blur={FRAME_GLOW_BLUR} style="normal" />
            </Path>
            {/* Crisp gold frame on top — constant, no animation. 3× THICKER
                (owner 2026-07-30): crisp gold border stroke 2.4→7.2. */}
            <Path path={G.plate} color="#ffcf40" style="stroke" strokeWidth={7.2} opacity={0.95} />
          </>
        ) : null}
      </Canvas>

      {/* A2 — Printed numerals (larger + bold, red at 100+). */}
      {G.numLabels.map((l) => (
        <Lbl key={`n${l.s}`} x={l.x - 14} y={l.y - 6} w={28} size={11} font={fonts.oswaldSemiBold} color={l.s >= 100 ? RED_INK : ink}>
          {`${l.s}`}
        </Lbl>
      ))}

      {/* EXTERNAL CALLOUT LABELS (owner 2026-07-30 redesign): each reference /
          guidance label sits cleanly in a side margin, right-aligned on the left,
          left-aligned on the right, connected inward to its exact dB on the arc by
          the leader hairlines drawn in the Canvas above. */}
      {/* Each callout is a block anchored to its margin side — title on top, the dB
          subtitle directly beneath it, both aligned to the block's side (item 7). */}
      {CO.items.map((it, idx) => (
        <View key={`co${idx}`}>
          {it.lines.map((ln, i) => (
            <Lbl
              key={i}
              x={it.bx}
              y={Math.round(it.ty + i * it.lineH)}
              w={it.bw}
              align={it.align}
              size={ln.size}
              font={fonts.oswaldSemiBold}
              ls={ln.ls}
              color={ln.color}
              shadowColor={it.gold && i === 0 ? 'rgba(28,18,0,0.92)' : undefined}
              shadowRadius={it.gold && i === 0 ? 4 : undefined}
              shadowOffset={it.gold && i === 0 ? { width: 0, height: 2 } : undefined}
            >
              {ln.t}
            </Lbl>
          ))}
        </View>
      ))}

      {/* CENTER digital SPL readout (owner 2026-07-30): the live number LARGE in
          the concave middle of the dial, with a small "dB SPL" sub-label. The arc
          + node ride the OUTER ring (Rs+2), so the centre stays clear. Absent ⇒
          nothing drawn. */}
      {p.centerText != null ? (
        <>
          {/* The big centre number is the AVERAGE (RMS) level — BLACK, +1 pt (owner
              2026-07-31); the citation below notes AVG so it never reads as a peak. */}
          <Lbl x={0} y={cy - 24} w={w} size={31} font={fonts.oswaldSemiBold} color="#0a0a0a">
            {p.centerText}
          </Lbl>
          <Lbl x={0} y={cy + 17} w={w} size={10} font={fonts.oswaldSemiBold} ls={1.5} color={inkDim}>
            dB SPL · AVG
          </Lbl>
        </>
      ) : null}

      {/* A4 (owner 2026-07-30 v2) — TOP text band: the dB SPL wordmark + the mode
          caption + the ESTIMATED badge, centred and stacked at the TOP of the
          container, starting just below the reserved STUDIO/SPL button row
          (y≈34) so nothing sits at the bottom anymore. */}
      {mode === 'studio' ? (
        <>
          {/* Item 1 (owner 2026-07-30): a SINGLE centred title, sized to fit the
              width (RNText wraps to a 2nd line if it must). Replaces the old
              "STUDIO MONITORING" / "dB SPL(C) · MIXING LEVELS" two-liner. */}
          <Lbl x={6} y={58} w={w - 12} size={14} font={fonts.oswaldSemiBold} ls={1} color={ink}>
            STUDIO REFERENCE MONITORING LEVELS
          </Lbl>
          {/* ESTIMATED badge (uncalibrated) — never a certified reading (§1.7). */}
          {!p.calibrated ? (
            <Lbl x={0} y={101} w={w} size={9} font={fonts.oswaldSemiBold} ls={0.6} color={RED_INK}>
              ESTIMATED · UNCALIBRATED
            </Lbl>
          ) : null}
        </>
      ) : mode === 'spl' ? (
        <>
          {/* Item 8: two-line SPL title (the old "dB SPL" wordmark removed). Pushed
              DOWN further (owner 2026-07-30, start y≈56, +10px) for more gap below
              the mode button strip. */}
          <Lbl x={0} y={56} w={w} size={15} font={fonts.oswaldSemiBold} ls={2} color={ink}>
            SPL REFERENCE SOUNDS
          </Lbl>
          <Lbl x={0} y={80} w={w} size={12} font={fonts.oswaldSemiBold} ls={0.6} color={inkDim}>
            dBA / dBC AS NOTED
          </Lbl>
          {!p.calibrated ? (
            <Lbl x={0} y={102} w={w} size={9} font={fonts.oswaldSemiBold} ls={0.6} color={RED_INK}>
              ESTIMATED · UNCALIBRATED
            </Lbl>
          ) : null}
        </>
      ) : (
        <>
          {/* Item 9: optimal reference-listening title. Pushed DOWN further (owner
              2026-07-30, start y≈56, +10px) for more gap below the mode buttons. */}
          <Lbl x={0} y={56} w={w} size={13} font={fonts.oswaldSemiBold} ls={1} color={ink}>
            OPTIMAL REFERENCE LISTENING
          </Lbl>
          <Lbl x={0} y={79} w={w} size={12} font={fonts.oswaldSemiBold} ls={0.6} color={inkDim}>
            dBA · LAeq WHERE NOTED
          </Lbl>
          {!p.calibrated ? (
            <Lbl x={0} y={101} w={w} size={9} font={fonts.oswaldSemiBold} ls={0.6} color={RED_INK}>
              ESTIMATED · UNCALIBRATED
            </Lbl>
          ) : null}
        </>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PeakAvg — thin live LED meter: PEAK + AVERAGE columns + user peak-hold

/** M2-family LED meter for the SPL popup (owner 2026-07-30): ONE wide combined
 *  bar. The instantaneous PEAK fills the bar in loudness colors (green low →
 *  yellow → orange → red near/over the top) with a floating user PEAK-HOLD cap
 *  (`holdMode`); the AVERAGE/RMS reads as a PURPLE fill from the bottom up to the
 *  average level (always ≤ peak by nature), so purple(avg) sits below the
 *  loudness-colored peak in a single bar. Live-only (phone mic is mono): follows
 *  the live SharedValues. The printed SCALE is dB SPL — SPL = dBFS + `splOffset`
 *  (dBFS alone is not meaningful to the user); the fill still maps the real dBFS
 *  level, only the numerals are relabeled. */
export function PeakAvgMeterView(p: {
  width: number;
  height?: number;
  phase: SharedValue<number>;
  live: LiveMeterDrive;
  loopSeconds?: number;
  /** Peak-hold cap linger (default '1s'). 'off' hides the cap; 'inf' latches. */
  holdMode?: PeakHoldMode;
  /** dB to ADD to a dBFS value to get estimated SPL (default 100). The bar's fill
   *  still maps the actual dBFS level; only the printed SCALE is relabeled to SPL
   *  via SPL = dBFS + splOffset. */
  splOffset?: number;
  /** The user's weighting curve label — e.g. "A"/"C"/"Z" (default ""). Shown in
   *  the header caption as "dB SPL · <weightingLabel>"; empty ⇒ "LEVEL · dB SPL". */
  weightingLabel?: string;
  /** MEMBER LED colour override (owner 2026-08-20, [[customization-member-rule]]).
   *  Recolours ONLY the loudness PEAK fill; the purple avg + white cap are
   *  untouched. `{flat}` = one solid colour; `{stops}` = a custom gradient
   *  (pos 0 = top/loud … pos 1 = bottom). Omitted/null ⇒ the default loudness ramp. */
  ledFill?: { flat: string } | { stops: readonly { pos: number; color: string }[] } | null;
}) {
  const w = p.width;
  const h = p.height ?? 260;
  const LOOP = p.loopSeconds ?? 4;
  const holdMode = p.holdMode ?? '1s';
  const splOffset = p.splOffset ?? 100;
  const weightingLabel = p.weightingLabel ?? '';
  // Resolve the peak-fill paint: a member flat colour, a member gradient, or the
  // default app-wide loudness ramp.
  const ledFill = p.ledFill ?? null;
  const ledFlat = ledFill && 'flat' in ledFill ? ledFill.flat : null;
  const ledStops = ledFill && 'stops' in ledFill ? ledFill.stops : LOUDNESS_STOPS;
  const livePeak = p.live.peakDb;
  const liveRms = p.live.rmsDb;
  const holdSecs = holdModeSeconds(holdMode);
  const showCap = holdMode !== 'off';

  // Average marker color (owner 2026-07-30) — a distinct purple, drawn from the
  // bottom up to the average level, below the loudness-colored peak fill.
  const AVG_PURPLE = '#b45bff';

  // LEFT readout column (owner 2026-07-30): the parent now hands this view a WIDER
  // width (~104) so two prominent stacked numeric readouts (purple AVG, white
  // PK-hold max) sit to the LEFT of the LED bar. `readoutW` reserves that column
  // and shrinks gracefully for any narrower legacy caller (backward compatible).
  const readoutW = Math.min(42, Math.max(0, w - 58));
  const wellX = 7 + readoutW;
  const wellY = 28;
  const wellW = w - 14 - readoutW;
  const wellH = h - wellY - 30;
  const padI = 5;
  // ONE wide bar occupying the old two-column footprint, with a right-side gutter
  // for the SPL tick numerals (they used to sit BETWEEN the two columns).
  const labelGutter = 16;
  const barX = wellX + padI;
  const barW = wellW - padI * 2 - labelGutter;
  const barTop = wellY + 7;
  const barBot = wellY + wellH - 7;
  const span = barBot - barTop;
  // SCALE (owner 2026-07-31): the bar + printed scale run 40 dB SPL at the BOTTOM
  // to 100 dB SPL at the TOP (reverted from the brief 110 experiment). The fill
  // maps the real dBFS level via SPL = dBFS + splOffset, so top dBFS = 100 −
  // splOffset and bottom dBFS = 40 − splOffset. Everything (peak fill, avg line,
  // hold cap, ticks) uses this SPL→pixel remap; SPL→pixel itself is offset-
  // independent (nice for static geometry). `ySpl` maps a dB-SPL value to its px y.
  const SPL_BOT = 40;
  const SPL_TOP = 100;
  const SPL_SPAN = SPL_TOP - SPL_BOT; // 60 dB tall
  const SEG = SPL_SPAN;               // one LED segment per dB SPL
  const segH = span / SEG;
  const ySpl = (s: number) => barBot - ((s - SPL_BOT) / SPL_SPAN) * span;
  // Left readout-column metrics.
  const roX = 2;
  const roW = wellX - 6;
  const roMid = wellY + wellH / 2;

  // Static geometry: brushed panel, bezel well, one unlit LED stack, ticks.
  const G = useMemo(() => {
    const unlit = Skia.Path.Make();
    for (let i = 0; i < SEG; i++) {
      const hiS = SPL_BOT + i + 1; // top SPL of this 1-dB LED
      const y = barBot - ((hiS - SPL_BOT) / SPL_SPAN) * span;
      unlit.addRect(Skia.XYWHRect(barX, y, barW, segH - 1));
    }
    const well = Skia.Path.Make();
    well.addRRect(Skia.RRectXY(Skia.XYWHRect(wellX - 4, wellY - 4, wellW + 8, wellH + 8), 7, 7));
    const ticks = Skia.Path.Make();
    for (const s of [40, 50, 60, 70, 80, 90, 100]) {
      const y = barBot - ((s - SPL_BOT) / SPL_SPAN) * span;
      ticks.moveTo(barX + barW + 1, y);
      ticks.lineTo(barX + barW + 4, y);
    }
    return { unlit, well, ticks };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w, h]);

  // ── Live ballistics: instant-attack / 62 dB-s release PEAK, ~150 ms AVERAGE,
  // floating hold governed by holdMode. dt from the phase-clock delta (the VU
  // idiom). lPk is the returned engine value; lAvg/lHold are side-effect
  // SharedValues read by the average column and the cap (one-frame lag is
  // invisible — same pattern as PeakMeterView above).
  const lPk = useSharedValue(-120);
  const lAvg = useSharedValue(-120);
  const lHold = useSharedValue(-120);
  const lHoldAge = useSharedValue(0);
  const lLastPh = useSharedValue(-1);
  // Wall-clock accumulator (phase-delta integrated) + the last time the PEAK SPL
  // crossed above 100 dB SPL — drives the over-100 red FRAME flash (owner
  // 2026-07-30). Latched on any single-sample overshoot; the frame then stays red
  // for ≥0.333 s after each crossing (see frameFill / frameStroke below).
  const clock = useSharedValue(0);
  const lastOver100 = useSharedValue(-1e9);
  const engine = useDerivedValue(() => {
    const ph = p.phase.value;
    let dt = 0;
    if (lLastPh.value >= 0) {
      let d = ph - lLastPh.value;
      if (d < 0) d = 0;
      dt = (d / (Math.PI * 2)) * LOOP;
      if (dt > 0.08) dt = 0.08;
    }
    lLastPh.value = ph;
    const rp = livePeak.value;
    const ra = liveRms.value;
    const pk = rp === rp && rp > -120 ? Math.min(6, rp) : -120;
    const av = ra === ra && ra > -120 ? Math.min(6, ra) : -120;
    // PEAK: TRUE instant attack — Math.max latches the new level the SAME frame it
    // arrives (zero attack smoothing, so the LED can never lag a rise), with a
    // quick 62 dB/s fall on the way down (owner 2026-07-30).
    lPk.value = Math.max(pk, lPk.value - 62 * dt);
    // Advance the wall clock and LATCH the whole-meter red only when the
    // SUSTAINED (RMS/average) SPL passes 100 — NOT a single peak transient
    // (owner 2026-08-05: a lone AGC'd peak in a quiet room was flashing the
    // meter red = false clipping). `av` is the weighted RMS level, already
    // ballistic-smoothed, so brief spikes no longer trip it.
    clock.value += dt;
    if (av > -120 && av + splOffset > 100) lastOver100.value = clock.value;
    // AVERAGE: lively, ASYMMETRIC (owner 2026-07-30) — a very short 0.05 s attack
    // so it rises almost immediately with the peak, and a slower 0.2 s musical
    // release; in silence it decays at 34 dB/s.
    if (av > -120) {
      const tcA = av > lAvg.value ? 0.05 : 0.2;
      const a = 1 - Math.exp(-dt / tcA);
      lAvg.value = lAvg.value + (av - lAvg.value) * a;
    } else {
      lAvg.value = Math.max(-120, lAvg.value - 34 * dt);
    }
    // PEAK-HOLD latch — ALWAYS maintained so the white readout AND the bar cap read
    // the SAME `lHold` and can never disagree (owner 2026-07-30). Honours holdMode:
    //   'off'   ⇒ lHold simply follows the current peak (no hold),
    //   '1s'/'3s' ⇒ hold at the max, then decay after holdSecs,
    //   'inf'   ⇒ latch at the max until reset (holdSecs = 1e9).
    if (!showCap) {
      // 'off': track the live peak exactly — no linger.
      lHold.value = lPk.value;
      lHoldAge.value = 0;
    } else if (pk >= lHold.value) {
      lHold.value = pk;
      lHoldAge.value = 0;
    } else {
      lHoldAge.value += dt;
      if (holdSecs < 1e8 && lHoldAge.value > holdSecs) lHold.value = Math.max(-120, lHold.value - 14 * dt);
    }
    return lPk.value;
  }, [p.phase, livePeak, liveRms, holdSecs, showCap, LOOP, splOffset]);

  // PEAK loudness fill — segments ABOVE the average level up to the peak. The
  // region below the average is left for the purple avg fill (litAvg), so the two
  // never overlap: purple at the bottom, loudness-colored peak above it.
  const litPeak = useDerivedValue(() => {
    const pk = engine.value;
    const av = Math.min(lAvg.value, pk); // avg can never exceed peak
    const pkS = pk + splOffset;          // level in dB SPL
    const avS = av + splOffset;
    const pth = Skia.Path.Make();
    for (let i = 0; i < SEG; i++) {
      const loS = SPL_BOT + i;
      const hiS = loS + 1;
      if (pkS <= loS) break;
      if (loS < avS) continue; // below the avg level ⇒ drawn purple, not loudness
      pth.addRect(Skia.XYWHRect(barX, barBot - ((hiS - SPL_BOT) / SPL_SPAN) * span, barW, segH - 1));
    }
    return pth;
  }, [engine, lAvg, splOffset]);

  // AVERAGE purple fill — bottom up to the average level (capped to the peak so
  // it can never rise above it).
  const litAvg = useDerivedValue(() => {
    const pk = engine.value;
    const av = Math.min(lAvg.value, pk);
    const avS = av + splOffset;
    const pth = Skia.Path.Make();
    for (let i = 0; i < SEG; i++) {
      const loS = SPL_BOT + i;
      const hiS = loS + 1;
      if (avS <= loS) break;
      pth.addRect(Skia.XYWHRect(barX, barBot - ((hiS - SPL_BOT) / SPL_SPAN) * span, barW, segH - 1));
    }
    return pth;
  }, [lAvg, engine, splOffset]);

  // Bright purple marker line at the very top of the avg fill (reads the exact
  // average level where purple meets the loudness peak).
  // Bright PRIMARY average level LINE — a crisp, slightly-over-wide bar sitting
  // exactly at the average's dBFS→pixel position (owner 2026-07-30): this is the
  // reading, so it is drawn boldly and extends a few px past both bar edges.
  const avgCap = useDerivedValue(() => {
    const pk = engine.value;
    const av = Math.min(lAvg.value, pk);
    const avS = av + splOffset;
    const pth = Skia.Path.Make();
    if (avS > SPL_BOT + 1) {
      const s = Math.min(SPL_TOP, avS);
      pth.addRect(Skia.XYWHRect(barX - 3, barBot - ((s - SPL_BOT) / SPL_SPAN) * span - 1.4, barW + 6, 2.8));
    }
    return pth;
  }, [lAvg, engine, splOffset]);

  const cap = useDerivedValue(() => {
    // Always drawn, reading the SAME unified `lHold` as the white readout above: in
    // 'off' mode lHold follows the current peak (cap rides the top of the fill), and
    // in '1s'/'3s'/'inf' it holds/decays/latches — so cap and readout never disagree.
    const pth = Skia.Path.Make();
    const hs = Math.max(SPL_BOT + 1, Math.min(SPL_TOP + 0.4, lHold.value + splOffset));
    pth.addRect(Skia.XYWHRect(barX, barBot - ((hs - SPL_BOT) / SPL_SPAN) * span - 1.2, barW, 2.4));
    return pth;
  }, [lHold, engine, splOffset]);

  // ── LEFT-COLUMN LIVE READOUTS (owner 2026-07-30): two prominent stacked numbers
  // to the LEFT of the bar, driven off the shared values on the UI thread (no React
  // re-render — the AnimatedTextInput idiom used across this file). PURPLE = the
  // AVERAGE dB SPL = round(rmsDb + splOffset), the SAME number the VU/dial CENTRE
  // shows. WHITE = the PEAK-HOLD MAX dB SPL: it follows the peak UP and STAYS at the
  // highest reached, honouring holdMode (inf latches; 1s/3s linger then decay; off
  // just follows the current peak) via the `lHold` engine value (or the live peak
  // when hold is off). Both floor at SPL_BOT (40) in silence.
  const avgReadoutProps = useAnimatedProps(() => {
    const r = liveRms.value;
    const s = r === r && r > -119 ? Math.max(SPL_BOT, Math.round(r + splOffset)) : SPL_BOT;
    const t = `${s}`;
    return { text: t, defaultValue: t } as any;
  }, [liveRms, splOffset]);
  const pkMaxReadoutProps = useAnimatedProps(() => {
    // Reads the SAME `lHold` the bar cap draws — the engine maintains it every
    // frame per holdMode ('off' ⇒ follows the current peak; '1s'/'3s' ⇒ hold then
    // decay; 'inf' ⇒ latch), so the readout and the cap ALWAYS agree. lHold mutates
    // each frame, which keeps this worklet ticking.
    const hv = lHold.value;
    const s = hv === hv && hv > -119 ? Math.max(SPL_BOT, Math.round(hv + splOffset)) : SPL_BOT;
    const t = `${s}`;
    return { text: t, defaultValue: t } as any;
  }, [lHold, splOffset]);

  // ── OVER-100 RED FRAME flash colours (owner 2026-07-30): the whole well/frame
  // goes red while the peak is CURRENTLY over 100 dB SPL OR within 0.34 s of the
  // last crossing (so even a single-sample spike yields a ≥0.333 s red flash). Uses
  // the phase-clock wall time latched in `lastOver100`. A no-op transparent colour
  // when clear, so the frame is untouched at normal levels.
  const FLASH_S = 0.34;
  const redFillOn = withAlpha('#c62518', 0.55);
  const redStrokeOn = withAlpha('#ff3b2f', 0.95);
  const redOff = withAlpha('#c62518', 0);
  const frameFill = useDerivedValue(
    () => (clock.value - lastOver100.value < FLASH_S ? redFillOn : redOff),
    [],
  );
  const frameStroke = useDerivedValue(
    () => (clock.value - lastOver100.value < FLASH_S ? redStrokeOn : redOff),
    [],
  );

  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ position: 'absolute', width: w, height: h, backgroundColor: BG }}>
        <BrushedPanel w={w} h={h} />
        {/* Corner screws removed (owner 2026-07-30: no screws anywhere). */}
        {/* Inset bezel well. */}
        <Path path={G.well} color="#08090b" />
        <Path path={G.well} color="#000000" style="stroke" strokeWidth={1.6} opacity={0.8} />
        <Path path={G.well} color="#3d4049" style="stroke" strokeWidth={0.8} opacity={0.5} />
        {/* OVER-100 red wash over the well/frame BACKGROUND — transparent unless the
            peak is over (or just crossed) 100 dB SPL. Drawn UNDER the bar so it shows
            in the frame/gutter margins around the LEDs. */}
        <Path path={G.well} color={frameFill} />
        {/* Unlit LED stack (single combined bar). */}
        <Path path={G.unlit} color="#12151b" opacity={0.95} />
        {/* AVERAGE — purple fill from the bottom up to the avg level (≤ peak). */}
        <Path path={litAvg} color={AVG_PURPLE} />
        {/* PRIMARY reading: the bright average level LINE (equals the VU/dial SPL). */}
        <Path path={avgCap} color="#efdcff" />
        {/* PEAK — loudness zones above the avg level. One vertical gradient keyed to
            ABSOLUTE y (barTop=100 dB SPL … barBot=40) using the app-wide MIDI
            velocity ramp: MIDI-0 blue at the BOTTOM climbing through green/yellow/
            orange to red at the TOP (owner 2026-07-31). */}
        {ledFlat ? (
          // MEMBER flat colour — one solid fill for the whole peak region.
          <Path path={litPeak} color={ledFlat} />
        ) : (
          // Default ramp OR a member SCHEME gradient (same top→bottom orientation).
          <Path path={litPeak}>
            <LinearGradient
              start={vec(0, barTop)}
              end={vec(0, barBot)}
              colors={ledStops.map((s) => s.color)}
              positions={ledStops.map((s) => s.pos)}
            />
          </Path>
        )}
        {/* Floating user peak-hold cap. */}
        <Path path={cap} color="#f2f5fa" />
        <Path path={G.ticks} color="#565a64" style="stroke" strokeWidth={1} />
        {/* OVER-100 red BORDER on the well frame — drawn last so it reads as a clear
            red outline during the flash; transparent otherwise. */}
        <Path path={G.well} color={frameStroke} style="stroke" strokeWidth={2.5} />
      </Canvas>
      {/* Item 12: the meter's gray reference text is lightened to #b6bac4 so it
          reads clearly on the dark meter background (was the dim #767a85 default). */}
      <Lbl x={10} y={7} w={w - 20} align="left" size={8} font={fonts.oswaldSemiBold} ls={1} color="#b6bac4">
        {weightingLabel ? `dB SPL · ${weightingLabel}` : 'LEVEL · dB SPL'}
      </Lbl>
      {/* SPL scale numerals in the right-side gutter — 40 … 100 dB SPL, +1 pt
          larger (owner 2026-07-31). */}
      {[40, 50, 60, 70, 80, 90, 100].map((s) => (
        <Lbl key={s} x={barX + barW + 6} y={ySpl(s) - 5.5} w={labelGutter} align="left" size={9.5} color="#b6bac4">
          {`${s}`}
        </Lbl>
      ))}
      {/* LEFT-COLUMN live readouts (owner 2026-07-30). Top = purple AVERAGE dB SPL
          (equals the VU/dial centre = round(rmsDb + splOffset)); bottom = white
          PEAK-HOLD MAX dB SPL. Labels are static; the numerals ride the shared
          values via animatedProps. */}
      {/* Order (owner 2026-07-30): WHITE PK/MAX on TOP, PURPLE AVG below it. */}
      <Lbl x={roX} y={roMid - 54} w={roW} align="center" size={8.5} font={fonts.oswaldSemiBold} ls={1} color="#e8eaee">
        PK
      </Lbl>
      <AnimatedTextInput
        editable={false}
        pointerEvents="none"
        underlineColorAndroid="transparent"
        animatedProps={pkMaxReadoutProps}
        style={{
          position: 'absolute',
          left: roX,
          top: roMid - 42,
          width: roW,
          padding: 0,
          textAlign: 'center',
          fontFamily: fonts.oswaldSemiBold,
          fontSize: 18,
          letterSpacing: 0.3,
          color: '#ffffff',
          includeFontPadding: false,
          textShadowColor: 'rgba(0,0,0,0.9)',
          textShadowRadius: 3,
          textShadowOffset: { width: 0, height: 1 },
        }}
      />
      <Lbl x={roX} y={roMid + 2} w={roW} align="center" size={8.5} font={fonts.oswaldSemiBold} ls={1} color={AVG_PURPLE}>
        AVG
      </Lbl>
      <AnimatedTextInput
        editable={false}
        pointerEvents="none"
        underlineColorAndroid="transparent"
        animatedProps={avgReadoutProps}
        style={{
          position: 'absolute',
          left: roX,
          top: roMid + 14,
          width: roW,
          padding: 0,
          textAlign: 'center',
          fontFamily: fonts.oswaldSemiBold,
          fontSize: 18,
          letterSpacing: 0.3,
          color: '#d69bff',
          includeFontPadding: false,
          textShadowColor: 'rgba(0,0,0,0.9)',
          textShadowRadius: 3,
          textShadowOffset: { width: 0, height: 1 },
        }}
      />
      {/* Bottom legend — combined "PK / AVG" on one line, colour-coded: WHITE PK
          (matches the white peak readout, owner 2026-07-30), purple AVG, neutral "/". */}
      <Lbl x={wellX} y={barBot + 5} w={wellW * 0.42} align="right" size={9.5} font={fonts.oswaldSemiBold} color="#ffffff" ls={0.6}>
        PK
      </Lbl>
      <Lbl x={wellX + wellW * 0.42} y={barBot + 5} w={wellW * 0.16} align="center" size={9.5} color="#b6bac4">
        /
      </Lbl>
      <Lbl x={wellX + wellW * 0.58} y={barBot + 5} w={wellW * 0.42} align="left" size={9.5} font={fonts.oswaldSemiBold} color={AVG_PURPLE} ls={0.6}>
        AVG
      </Lbl>
      <Lbl x={10} y={h - 14} w={w - 20} align="left" size={8.5} color="#b6bac4">
        {`HOLD ${holdMode.toUpperCase()} · MONO`}
      </Lbl>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VuGlyph — tiny static VU face for buttons/affordances

/** Miniature VU-meter glyph (~40 px): cream face, arc, red zone, needle —
 *  reads as a tiny VU at a glance. Static (no clock); the SPL screen uses it
 *  as its full-screen-VU popup opener (2026-07-29). */
export function VuGlyph({ size = 40 }: { size?: number }) {
  const w = size;
  const h = Math.round(size * 0.78);
  const G = useMemo(() => {
    const cx = w / 2;
    const py = h - 4;
    const R = h * 0.62;
    const bezel = Skia.Path.Make();
    bezel.addRRect(Skia.RRectXY(Skia.XYWHRect(0, 0, w, h), 5, 5));
    const face = Skia.Path.Make();
    face.addRRect(Skia.RRectXY(Skia.XYWHRect(2, 2, w - 4, h - 4), 3.5, 3.5));
    const arcOf = (a0: number, a1: number) => {
      const pth = Skia.Path.Make();
      pth.addArc(Skia.XYWHRect(cx - R, py - R, 2 * R, 2 * R), a0 - 90, a1 - a0);
      return pth;
    };
    const arcB = arcOf(-48, 20);
    const arcR = arcOf(20, 48);
    // Scale ticks across the sweep (more detail — reads as a real VU face).
    const pt = (deg: number, r: number) => ({
      x: cx + Math.sin(deg * DEG) * r,
      y: py - Math.cos(deg * DEG) * r,
    });
    const ticks = Skia.Path.Make();
    for (const d of [-48, -36, -24, -12, 0, 12, 24, 36, 48]) {
      const a = pt(d, R + 0.5);
      const b = pt(d, R + (d % 24 === 0 ? 3.2 : 2));
      ticks.moveTo(a.x, a.y);
      ticks.lineTo(b.x, b.y);
    }
    // Diagonal glass sheen across the upper face.
    const sheen = Skia.Path.Make();
    sheen.moveTo(w * 0.5, 2);
    sheen.lineTo(w * 0.74, 2);
    sheen.lineTo(w * 0.34, h - 3);
    sheen.lineTo(w * 0.16, h - 3);
    sheen.close();
    // Tapered needle + short counterweight tail.
    const nA = 14 * DEG;
    const s = Math.sin(nA);
    const c = Math.cos(nA);
    const tipR = R + 1;
    const tailR = -h * 0.12;
    const needle = Skia.Path.Make();
    needle.moveTo(cx + s * tailR + c * 1.2, py - c * tailR + s * 1.2);
    needle.lineTo(cx + s * tipR, py - c * tipR);
    needle.lineTo(cx + s * tailR - c * 1.2, py - c * tailR - s * 1.2);
    needle.close();
    return { bezel, face, arcB, arcR, ticks, sheen, needle, cx, py };
  }, [w, h]);
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }}>
        <Path path={G.bezel} color="#1b1c22" />
        <Path path={G.bezel} color="#000000" style="stroke" strokeWidth={1} opacity={0.7} />
        <Path path={G.face}>
          <LinearGradient start={vec(0, 0)} end={vec(0, h)} colors={['#f6e8c0', '#e6d09a']} />
        </Path>
        <Path path={G.arcB} color="#2b2317" style="stroke" strokeWidth={1.4} />
        <Path path={G.arcR} color="#c9382e" style="stroke" strokeWidth={2.6} />
        <Path path={G.ticks} color="#2b2317" style="stroke" strokeWidth={1} />
        <Path path={G.sheen} color="#ffffff" opacity={0.12} />
        <Path path={G.needle} color="#17130c" />
        <Circle cx={G.cx} cy={G.py} r={size * 0.055} color="#17130c" />
        <Circle cx={G.cx} cy={G.py} r={size * 0.055} color="#3a3226" style="stroke" strokeWidth={0.6} />
      </Canvas>
      <RNText
        style={{
          position: 'absolute',
          top: h * 0.5,
          width: w,
          textAlign: 'center',
          fontFamily: fonts.oswaldSemiBold,
          fontSize: Math.max(6, size * 0.14),
          letterSpacing: 1,
          color: '#2b2417',
        }}
      >
        VU
      </RNText>
    </View>
  );
}
