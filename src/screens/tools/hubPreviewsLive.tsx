/**
 * hubPreviewsLive — the five LIVE microphone-driven tile previews on the
 * Tools & Analysis hub (owner order 2026-08-19): SPL Reference Meter, Pro
 * Audio MultiMeter, Waveform Viewer, Spectrum Analyzer / RTA, Spectrogram.
 *
 * Every mini is a faithful redraw of its approved tool-strip artwork
 * (assets/tool-strips, viewBox 0 0 2048 1024): the CHROME (bezels, panels,
 * grids, ticks, unlit segments) is ported verbatim from the strip SVGs and
 * frozen as module-level elements (same reference every render → React skips
 * them), while the DATA layers (needle, LEDs, bars, envelopes, heat cells)
 * redraw from the shared engine store at ~12.5 Hz. All react-native-svg —
 * ToolsHubScreen stays Skia-free (dense-screen render rule 2026-08-15; also
 * keeps the hub alive on web + pre-Skia dev clients).
 *
 * Node budget (MultiMeter precedent ≤~700): steady state ≈ 200 dynamic SVG
 * nodes across all five minis (SPL ~40, RTA ~95, waveform 2, spectrogram ≤12
 * batched heat paths, MultiMeter ~75) + frozen chrome. Needles are RN
 * Animated overlays on the native driver (the HzCounterDemo idiom) so needle
 * motion costs zero JS per frame between ticks.
 *
 * Data honesty: these components mount ONLY while the hub engine reports
 * running frames — absent/spike/denied rests on the static artwork
 * (no-fake-meters §1.7). Level → color goes through the strips' own ramps,
 * pinned userSpaceOnUse to absolute level (fixed-reference rule 2026-08-14);
 * heat cells use the app-wide heatColor ramp with the fixed 0 dBFS anchor.
 */
import { memo, useEffect, useMemo, useRef, useSyncExternalStore, type FC, type ReactNode } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, Polygon, Rect, Stop } from 'react-native-svg';
import { heatColor } from '../../features/tools/levelColor';
import type { WaveBucket } from '../../../modules/ape-dsp';
import {
  getHubPreview,
  subscribeHubPreview,
  HUB_TICK_MS,
  SPECTRO_COLS,
  SPECTRO_ROWS,
  type HubPreviewData,
  type HubSpectroCol,
} from './hubPreviewEngine';
import { AmbGrad, LvlGrad, MirGrad, NATIVE_DRIVER, rampStops, useMeasuredWidth, Vignette } from './hubPreviewShared';
import type { ToolKey } from './toolsData';

const VB = '0 0 2048 1024';
const TICK_SEC = HUB_TICK_MS / 1000;

function useHubData(): HubPreviewData {
  return useSyncExternalStore(subscribeHubPreview, getHubPreview);
}

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);
/** Guard native dB values: NaN/−Infinity (pre-signal silence) → −120. */
const dbOr = (v: number | undefined | null, rest = -120) =>
  v != null && Number.isFinite(v) ? v : rest;

/** Fade-in wrapper — the display "powers up" when live frames start flowing. */
function LiveShell({ children }: { children: ReactNode }) {
  const op = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(op, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.quad),
      useNativeDriver: NATIVE_DRIVER,
    }).start();
  }, [op]);
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: op }]}>
      {children}
    </Animated.View>
  );
}

/** 12-bucket quantized heat palette (app-wide amplitude ramp, navy → red). */
const HEAT_12 = Array.from({ length: 12 }, (_, i) => heatColor((i + 0.5) / 12));

/** Batch spectrogram cells into ≤12 color-bucket paths (the art's own
 *  structure — per-color <g> groups — and the fast path: 12 nodes total). */
function heatPaths(
  cols: HubSpectroCol[],
  geom: {
    xRight: number;
    colW: number;
    cellW: number;
    yBottom: number;
    rowH: number;
    cellH: number;
    rows: number;
    rowOf: (r: number) => number;
  },
): string[] {
  const parts: string[] = new Array(HEAT_12.length).fill('');
  const n = cols.length;
  for (let i = 0; i < n; i++) {
    const x = Math.round(geom.xRight - (n - i) * geom.colW);
    const col = cols[i];
    for (let r = 0; r < geom.rows; r++) {
      const t = col[geom.rowOf(r)];
      if (t === undefined || t < 0.03) continue;
      const b = Math.min(HEAT_12.length - 1, Math.floor(t * HEAT_12.length));
      const y = Math.round(geom.yBottom - (r + 1) * geom.rowH);
      parts[b] += `M${x} ${y}h${geom.cellW}v${geom.cellH}h${-geom.cellW}Z`;
    }
  }
  return parts;
}

/* ================================================================== */
/* 01 — SPL REFERENCE METER (analogue VU + LED ladder)                 */
/* ================================================================== */

/** 0 VU anchor: −18 dBFS (VuMeterView's live0Db default). */
const SPL_LIVE0 = -18;
const VU_MAX = Math.pow(10, 3 / 20); // +3 dB rel 0 VU (integrator ceiling)
const VU_HUB_X = 761;
const VU_HUB_Y = 744;
const VU_NEEDLE_LEN = 444; // hub → tip (art: (761,744)→(520.1,371))
/** Art arc spans ±62° about vertical; the art's red arc starts at 78% of the
 *  sweep — anchor 0 VU exactly there so a calibrated tone parks the needle on
 *  the red boundary and +3 dB pegs the arc end, like a real VU face. */
const VU_ARC_DEG = 62;
const VU_ZERO_FRAC = 0.78;

/** Verbatim tick coordinates from tool_01 (design deliverable). */
const VU_MINOR_TICKS: ReadonlyArray<readonly [number, number, number, number]> = [
  [354.2, 508.5, 378.5, 522.6], [363, 494, 386.7, 508.9], [372.3, 479.8, 395.4, 495.6],
  [382.1, 466, 404.6, 482.5], [403.1, 439.4, 424.4, 457.5], [414.3, 426.7, 434.9, 445.6],
  [426, 414.4, 445.9, 434], [438.1, 402.5, 457.3, 422.9], [463.5, 380.1, 481.2, 401.8],
  [476.8, 369.6, 493.8, 391.9], [490.5, 359.6, 506.6, 382.5], [504.6, 350.1, 519.8, 373.6],
  [533.6, 332.7, 547.2, 357.2], [548.6, 324.7, 561.3, 349.7], [563.9, 317.3, 575.6, 342.8],
  [579.4, 310.5, 590.2, 336.3], [611.1, 298.5, 620, 325.1], [627.3, 293.4, 635.2, 320.3],
  [643.6, 288.9, 650.6, 316], [660.1, 285, 666.1, 312.3], [693.4, 278.9, 697.4, 306.6],
  [710.2, 276.7, 713.3, 304.6], [727.1, 275.2, 729.1, 303.1], [744.1, 274.3, 745.1, 302.3],
  [777.9, 274.3, 776.9, 302.3], [794.9, 275.2, 792.9, 303.1], [811.8, 276.7, 808.7, 304.6],
  [828.6, 278.9, 824.6, 306.6], [861.9, 285, 855.9, 312.3], [878.4, 288.9, 871.4, 316],
  [894.7, 293.4, 886.8, 320.3], [910.9, 298.5, 902, 325.1], [942.6, 310.5, 931.8, 336.3],
  [958.1, 317.3, 946.4, 342.8], [973.4, 324.7, 960.7, 349.7], [988.4, 332.7, 974.8, 357.2],
  [1017.4, 350.1, 1002.2, 373.6],
];
const VU_MAJOR_TICKS: ReadonlyArray<readonly [number, number, number, number]> = [
  [346, 523.3, 391.9, 547.8], [392.3, 452.5, 433.1, 484.7], [450.6, 391.1, 484.9, 430.1],
  [518.9, 341.1, 545.7, 385.7], [595.1, 304.2, 613.5, 352.9], [676.7, 281.6, 686, 332.8],
  [761, 274, 761, 326], [845.3, 281.6, 836, 332.8], [926.9, 304.2, 908.5, 352.9],
  [1003.1, 341.1, 976.3, 385.7],
];
const VU_RED_TICKS: ReadonlyArray<readonly [number, number, number, number]> = [
  [1071.4, 391.1, 1037.1, 430.1], [1129.7, 452.5, 1088.9, 484.7], [1176, 523.3, 1130.1, 547.8],
];

/** LED ladder geometry (art): 26 segments, pitch 26, bottom seg top y = 834.9. */
const LED_X = 1522;
const LED_W = 280;
const LED_H = 16.1;
const LED_TOP_Y = 184.9;
const LED_BOT_Y = 834.9;
const ledY = (fromBottom: number) => LED_BOT_Y - 26 * fromBottom;

const SPL_CHROME = (
  <G>
    <Rect x={96} y={150} width={1330} height={724} rx={26} fill="url(#hpBezSpl)" stroke="#333c4d" strokeWidth={5} />
    <Rect x={130} y={184} width={1262} height={656} rx={14} fill="url(#hpFaceSpl)" />
    <Path d="M346,523.3A470,470 0 0 1 1176,523.3" fill="none" stroke="#141414" strokeWidth={7} />
    <Path d="M1028.7,357.7A470,470 0 0 1 1176,523.3" fill="none" stroke="#c0281e" strokeWidth={9} />
    <G stroke="#141414" strokeWidth={5} opacity={0.8}>
      {VU_MINOR_TICKS.map(([x1, y1, x2, y2], i) => (
        <Line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />
      ))}
    </G>
    <G stroke="#141414" strokeWidth={11}>
      {VU_MAJOR_TICKS.map(([x1, y1, x2, y2], i) => (
        <Line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />
      ))}
    </G>
    <G stroke="#c0281e" strokeWidth={11}>
      {VU_RED_TICKS.map(([x1, y1, x2, y2], i) => (
        <Line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />
      ))}
    </G>
    {/* LED module + the 9 permanently-unlit headroom segments (chrome). */}
    <Rect x={1492} y={156} width={340} height={748} rx={18} fill="#0d1117" stroke="#273040" strokeWidth={4} />
    <G fill="#152036">
      {Array.from({ length: 9 }, (_, i) => (
        <Rect key={i} x={LED_X} y={LED_TOP_Y + 26 * i} width={LED_W} height={LED_H} rx={3} />
      ))}
    </G>
  </G>
);

/** The art's ladder: bottom 17 segments are the live span, top 9 are
 *  permanently-unlit headroom chrome. Level maps −60..0 dBFS across the 17. */
const LED_LIVE_SEGS = 17;
const LED_SPAN_TOP_Y = LED_BOT_Y - 26 * (LED_LIVE_SEGS - 1); // top live seg y (418.9)
const LED_SPAN_BOT = LED_BOT_Y + LED_H; // bottom edge of the ladder (851)

const HubSplMini: FC = memo(() => {
  const d = useHubData();
  const [w, onLayout] = useMeasuredWidth();
  const needleAng = useRef(new Animated.Value(-VU_ARC_DEG)).current;
  const lastAngRef = useRef(-VU_ARC_DEG);
  const vuRef = useRef(0); // ballistic VU value, linear volts rel 0 VU
  const holdRef = useRef({ v: 0, until: 0 });
  const lampRef = useRef(0); // last time peak crossed −3 dBFS
  const lastTickRef = useRef(-1);

  const db = dbOr(d.meter?.aFastDb);
  const peakDb = dbOr(d.meter?.peakDb);

  // Ballistics per tick: 1st-order integrator in the voltage domain — rises
  // faster (tc 0.15 s) than it falls (tc 0.45 s), settling naturally in quiet.
  useEffect(() => {
    const target = db <= -119 ? 0 : Math.min(VU_MAX * 1.06, Math.pow(10, (db - SPL_LIVE0) / 20));
    const prev = vuRef.current;
    const tc = target > prev ? 0.15 : 0.45;
    vuRef.current = prev + (target - prev) * (1 - Math.exp(-TICK_SEC / tc));
    const ang = -VU_ARC_DEG + 2 * VU_ARC_DEG * clamp(VU_ZERO_FRAC * vuRef.current, 0, 1.02);
    // Skip sub-visible moves — no per-tick animation churn in a quiet room.
    if (Math.abs(ang - lastAngRef.current) < 0.15) return;
    lastAngRef.current = ang;
    Animated.timing(needleAng, {
      toValue: ang,
      duration: HUB_TICK_MS + 10,
      easing: Easing.linear,
      useNativeDriver: NATIVE_DRIVER,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d.tick]);

  // LED ladder + hold + peak lamp. Advanced exactly once per STORE TICK (the
  // guard keeps StrictMode double-renders / layout re-renders from double-
  // stepping the hold release), then read as plain values below.
  if (lastTickRef.current !== d.tick) {
    lastTickRef.current = d.tick;
    const now = Date.now();
    const pf = clamp((peakDb + 60) / 60, 0, 1);
    const h = holdRef.current;
    if (pf >= h.v) {
      h.v = pf;
      h.until = now + 1500;
    } else if (now > h.until) {
      h.v = Math.max(pf, h.v - (26 / 60) * TICK_SEC); // release ≈26 dB/s
    }
    if (peakDb >= -3) lampRef.current = now;
  }
  const frac = clamp((db + 60) / 60, 0, 1);
  const lit = Math.min(LED_LIVE_SEGS, Math.round(frac * LED_LIVE_SEGS));
  const holdV = holdRef.current.v;
  const lampLit = Date.now() - lampRef.current < 350;

  const litSegs = Array.from({ length: lit }, (_, b) => (
    <Rect key={b} x={LED_X} y={ledY(b)} width={LED_W} height={LED_H} rx={3} />
  ));
  const holdBarY = LED_SPAN_BOT - holdV * (LED_SPAN_BOT - LED_SPAN_TOP_Y) - 4.5;

  const s = w / 2048;

  return (
    <LiveShell>
      <View style={StyleSheet.absoluteFill} onLayout={onLayout}>
        <Svg width="100%" height="100%" viewBox={VB}>
          <Defs>
            <AmbGrad id="hpAmbSpl" />
            <LvlGrad id="hpLvlSpl" y1={180} y2={856} />
            <SvgVGrad id="hpFaceSpl" stops={[['0', '#f7eed2'], ['0.45', '#f0e4bf'], ['1', '#dccfa2']]} />
            <SvgVGrad id="hpBezSpl" stops={[['0', '#20242c'], ['1', '#0b0e14']]} />
          </Defs>
          <Rect width={2048} height={1024} fill="#060608" />
          <Rect width={2048} height={1024} fill="url(#hpAmbSpl)" />
          {SPL_CHROME}
          {/* DATA — lit LED segments (dim bloom pass + full pass, per the art). */}
          <G fill="url(#hpLvlSpl)" opacity={0.3}>{litSegs}</G>
          <G fill="url(#hpLvlSpl)">{litSegs}</G>
          {holdV > 0.01 && (
            <Rect x={1510} y={holdBarY} width={304} height={9} fill="#ffffff" opacity={0.9} />
          )}
          {/* Peak lamp — dark red chrome until the peak crosses −3 dBFS. */}
          {lampLit && <Circle cx={1308} cy={262} r={40} fill="#ff5347" opacity={0.28} />}
          <Circle cx={1308} cy={262} r={26} fill={lampLit ? '#ff5347' : '#4a1410'} />
        </Svg>
        {/* Needle — RN Animated rotation about the hub (native driver). */}
        {s > 0 && (
          <>
            <Animated.View
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: VU_HUB_X * s - Math.max(1.2, 6 * s),
                top: VU_HUB_Y * s - VU_NEEDLE_LEN * s,
                width: Math.max(2.4, 12 * s),
                height: VU_NEEDLE_LEN * s * 2,
                transform: [
                  {
                    rotate: needleAng.interpolate({
                      inputRange: [-VU_ARC_DEG, VU_ARC_DEG],
                      outputRange: [`-${VU_ARC_DEG}deg`, `${VU_ARC_DEG}deg`],
                    }),
                  },
                ],
              }}
            >
              <View
                style={{
                  width: '100%',
                  height: VU_NEEDLE_LEN * s,
                  borderRadius: 6 * s,
                  backgroundColor: '#101010',
                }}
              />
            </Animated.View>
            {/* Hub cap above the needle (art z-order). */}
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: (VU_HUB_X - 40) * s,
                top: (VU_HUB_Y - 40) * s,
                width: 80 * s,
                height: 80 * s,
                borderRadius: 40 * s,
                backgroundColor: '#141414',
              }}
            />
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: (VU_HUB_X - 15) * s,
                top: (VU_HUB_Y - 15) * s,
                width: 30 * s,
                height: 30 * s,
                borderRadius: 15 * s,
                backgroundColor: '#d8c9a0',
              }}
            />
          </>
        )}
        <Vignette />
      </View>
    </LiveShell>
  );
});
HubSplMini.displayName = 'HubSplMini';

/** Small helper: plain vertical two/three-stop gradient (bezel + cream face). */
function SvgVGrad({ id, stops }: { id: string; stops: ReadonlyArray<readonly [string, string]> }) {
  return (
    <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      {stops.map(([o, c], i) => (
        <Stop key={i} offset={o} stopColor={c} />
      ))}
    </LinearGradient>
  );
}

/* ================================================================== */
/* 02 — SPECTRUM ANALYZER / RTA (31 third-octave bars)                 */
/* ================================================================== */

// The native engine emits exactly 30 third-octave bands (OctaveBands golden
// test) — draw them at the 30-bar geometry the tool_08 mid-RTA art uses (pitch
// 60, width 44.4), which fills the same plot span as tool_02's 31 drawn slots.
const RTA_BANDS = 30;
const RTA_X0 = 131.8;
const RTA_PITCH = 60;
const RTA_BAR_W = 44.4;
const RTA_FLOOR_DB = -90; // matches the live RTA screen's fixed window
// yForDb: 0 dBFS → 104 (plot top), −90 dBFS → 920 (plot floor)
const rtaYForDb = (db: number) => clamp(104 + (db / RTA_FLOOR_DB) * (920 - 104), 104, 920);

const RTA_CHROME_UNDER = (
  <G>
    <Rect x={90} y={78} width={1868} height={874} rx={14} fill="#0b0f16" stroke="#1e2635" strokeWidth={4} />
    {[756.8, 593.6, 430.4, 267.2].map((y, i) => (
      <Line key={i} x1={124} y1={y} x2={1924} y2={y} stroke="#1b2434" strokeWidth={3} />
    ))}
    <Line x1={124} y1={104} x2={1924} y2={104} stroke="#2f3d55" strokeWidth={4} />
  </G>
);
/** Bottom rail draws OVER the bars in the art. */
const RTA_CHROME_OVER = <Line x1={124} y1={923} x2={1924} y2={923} stroke="#2f3d55" strokeWidth={5} />;

const HubRtaMini: FC = memo(() => {
  const d = useHubData();
  const b = d.bands;
  const n = b ? Math.min(RTA_BANDS, b.levelsDb.length) : 0;

  const glow: ReactNode[] = [];
  const core: ReactNode[] = [];
  const caps: ReactNode[] = [];
  const slots: ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const x = RTA_X0 + RTA_PITCH * i;
    if (b!.resolvable[i] === false) {
      slots.push(
        <Rect key={i} x={x} y={104} width={RTA_BAR_W} height={816} fill="#55555f" opacity={0.14} />,
      );
      continue;
    }
    const db = dbOr(b!.levelsDb[i], RTA_FLOOR_DB);
    const yTop = rtaYForDb(db);
    const h = 920 - yTop;
    if (h >= 2) {
      glow.push(
        <Rect key={i} x={x - 4} y={yTop - 4} width={RTA_BAR_W + 8} height={h + 8} rx={4} />,
      );
      core.push(<Rect key={i} x={x} y={yTop} width={RTA_BAR_W} height={h} rx={3} />);
    }
    const pk = dbOr(b!.peakHoldDb[i], RTA_FLOOR_DB);
    if (pk > RTA_FLOOR_DB + 2) {
      caps.push(
        <Rect key={i} x={x - 2} y={rtaYForDb(pk) - 5} width={RTA_BAR_W + 4} height={10} rx={3} fill="#e6d5a0" opacity={0.9} />,
      );
    }
  }

  return (
    <LiveShell>
      <Svg width="100%" height="100%" viewBox={VB}>
        <Defs>
          <AmbGrad id="hpAmbRta" />
          <LvlGrad id="hpLvlRta" y1={104} y2={920} />
        </Defs>
        <Rect width={2048} height={1024} fill="#060608" />
        <Rect width={2048} height={1024} fill="url(#hpAmbRta)" />
        {RTA_CHROME_UNDER}
        {slots}
        <G fill="url(#hpLvlRta)" opacity={0.22}>{glow}</G>
        <G fill="url(#hpLvlRta)">{core}</G>
        {caps}
        {RTA_CHROME_OVER}
      </Svg>
      <Vignette />
    </LiveShell>
  );
});
HubRtaMini.displayName = 'HubRtaMini';

/* ================================================================== */
/* 03 — WAVEFORM VIEWER (mirrored min/max envelope, 3 s window)        */
/* ================================================================== */

const WAVE_WINDOW_BUCKETS = 60; // 3 s of 50 ms buckets
const WAVE_MID = 512;
const WAVE_FS_PX = 408; // ±full scale in canvas units (art max ±~314 of this)

const WAVE_CHROME_UNDER = (
  <G>
    <Rect x={90} y={78} width={1868} height={874} rx={14} fill="#0b0f16" stroke="#1e2635" strokeWidth={4} />
    {[250.9, 381.4, 512, 642.6, 773.1].map((y, i) => (
      <Line key={i} x1={124} y1={y} x2={1924} y2={y} stroke="#1b2434" strokeWidth={3} strokeDasharray="8 14" />
    ))}
    {[574, 1024, 1474].map((x, i) => (
      <Line key={i} x1={x} y1={104} x2={x} y2={920} stroke="#1b2434" strokeWidth={3} strokeDasharray="8 14" />
    ))}
  </G>
);
/** Center line draws OVER the waveform in the art. */
const WAVE_CHROME_OVER = <Line x1={124} y1={512} x2={1924} y2={512} stroke="#2b7fd4" strokeWidth={9} />;

/** Build the mirrored envelope points string from newest-first buckets.
 *  Autoscale follows the WaveformScreen contract: scale = max(1.05, observed),
 *  released slowly so the trace never jumps (samples may exceed ±1 — F1). */
function buildEnvelope(
  waveNewestFirst: WaveBucket[],
  scaleRef: { current: number },
  x0: number,
  x1: number,
  mid: number,
  fsPx: number,
  windowBuckets: number,
  minBandPx: number,
): string | null {
  if (waveNewestFirst.length === 0) return null;
  const slice = waveNewestFirst.slice(0, windowBuckets).reverse();
  // Left-pad silence while the ring fills so history flows in from the right.
  const pad = windowBuckets - slice.length;
  let obs = 1.05;
  for (const bk of slice) {
    const m = Math.max(Math.abs(bk.min), Math.abs(bk.max));
    if (Number.isFinite(m) && m > obs) obs = m;
  }
  scaleRef.current = Math.max(1.05, obs, scaleRef.current * 0.985);
  const scale = scaleRef.current;
  const n = windowBuckets;
  const step = (x1 - x0) / (n - 1);
  const top: string[] = [];
  const bot: string[] = [];
  for (let i = 0; i < n; i++) {
    const x = (x0 + i * step).toFixed(1);
    const bk = i < pad ? null : slice[i - pad];
    const vMax = bk && Number.isFinite(bk.max) ? bk.max : 0;
    const vMin = bk && Number.isFinite(bk.min) ? bk.min : 0;
    let yT = mid - (vMax / scale) * fsPx;
    let yB = mid - (vMin / scale) * fsPx;
    if (yB - yT < minBandPx * 2) {
      const c = (yT + yB) / 2;
      yT = c - minBandPx;
      yB = c + minBandPx;
    }
    top.push(`${x},${yT.toFixed(1)}`);
    bot.push(`${x},${yB.toFixed(1)}`);
  }
  bot.reverse();
  return `${top.join(' ')} ${bot.join(' ')}`;
}

const HubWaveMini: FC = memo(() => {
  const d = useHubData();
  const scaleRef = useRef(1.05);
  const pts = buildEnvelope(d.wave, scaleRef, 124, 1924, WAVE_MID, WAVE_FS_PX, WAVE_WINDOW_BUCKETS, 3);

  return (
    <LiveShell>
      <Svg width="100%" height="100%" viewBox={VB}>
        <Defs>
          <AmbGrad id="hpAmbWave" />
          <MirGrad id="hpMirWave" y1={104} y2={920} />
        </Defs>
        <Rect width={2048} height={1024} fill="#060608" />
        <Rect width={2048} height={1024} fill="url(#hpAmbWave)" />
        {WAVE_CHROME_UNDER}
        {pts && (
          <>
            <Polygon points={pts} fill="none" stroke="url(#hpMirWave)" strokeWidth={14} opacity={0.25} />
            <Polygon points={pts} fill="url(#hpMirWave)" opacity={0.95} />
          </>
        )}
        {WAVE_CHROME_OVER}
      </Svg>
      <Vignette />
    </LiveShell>
  );
});
HubWaveMini.displayName = 'HubWaveMini';

/* ================================================================== */
/* 04 — SPECTROGRAM (live frequency history, heat-bucket batched)      */
/* ================================================================== */

const SPECTRO_GEOM = {
  xRight: 1913,
  colW: (1913 - 124) / SPECTRO_COLS,
  cellW: 40,
  yBottom: 912,
  rowH: (912 - 104) / SPECTRO_ROWS,
  cellH: 35,
  rows: SPECTRO_ROWS,
  rowOf: (r: number) => r,
};

const SPECTRO_CHROME = (
  <G>
    <Rect x={90} y={78} width={1868} height={874} rx={14} fill="#04070f" stroke="#1e2635" strokeWidth={4} />
    {[308, 512, 716].map((y, i) => (
      <Line key={i} x1={124} y1={y} x2={1924} y2={y} stroke="#2a3550" strokeWidth={3} strokeDasharray="7 15" opacity={0.7} />
    ))}
    {[574, 1024, 1474].map((x, i) => (
      <Line key={i} x1={x} y1={104} x2={x} y2={920} stroke="#2a3550" strokeWidth={3} strokeDasharray="7 15" opacity={0.7} />
    ))}
  </G>
);

const HubSpectroMini: FC = memo(() => {
  // Slice subscription: the store keeps spectroCols reference-stable between
  // column pushes, so this mini re-renders at ~6 Hz, not every 12.5 Hz tick.
  const spectroCols = useSyncExternalStore(subscribeHubPreview, () => getHubPreview().spectroCols);
  const paths = useMemo(() => heatPaths(spectroCols, SPECTRO_GEOM), [spectroCols]);

  return (
    <LiveShell>
      <Svg width="100%" height="100%" viewBox={VB}>
        <Defs>
          <AmbGrad id="hpAmbSg" peak={0.2} />
        </Defs>
        <Rect width={2048} height={1024} fill="#060608" />
        <Rect width={2048} height={1024} fill="url(#hpAmbSg)" />
        {SPECTRO_CHROME}
        {paths.map((p, i) => (p ? <Path key={i} d={p} fill={HEAT_12[i]} /> : null))}
      </Svg>
      <Vignette />
    </LiveShell>
  );
});
HubSpectroMini.displayName = 'HubSpectroMini';

/* ================================================================== */
/* 08 — PRO AUDIO MULTIMETER (H-bar · 30-bar RTA · spectrogram · scope)*/
/* ================================================================== */

const MM_BAR_X0 = 131.8;
const MM_BAR_PITCH = 60;
const MM_BAR_W = 44.4;
const mmYForDb = (db: number) => clamp(214 + (db / -90) * (612 - 214), 214, 612);

const MM_SG_GEOM = {
  xRight: 974,
  colW: (974 - 132) / 22,
  cellW: 40,
  yBottom: 888,
  rowH: (888 - 690) / 20,
  cellH: 11,
  rows: 20,
  rowOf: (r: number) => Math.min(SPECTRO_ROWS - 1, Math.floor((r * SPECTRO_ROWS) / 20)),
};

const MM_CHROME = (
  <G>
    {/* Top H-bar track. */}
    <Rect x={124} y={132} width={1800} height={34} rx={17} fill="#141821" />
    {/* Mid RTA panel + gridlines. */}
    <Rect x={104} y={174} width={1840} height={478} rx={14} fill="#0b0f16" stroke="#1e2635" strokeWidth={4} />
    {[512.5, 413, 313.5].map((y, i) => (
      <Line key={i} x1={124} y1={y} x2={1924} y2={y} stroke="#1b2434" strokeWidth={3} />
    ))}
    {/* Bottom-left mini spectrogram panel. */}
    <Rect x={124} y={668} width={878} height={228} rx={12} fill="#04070f" stroke="#1e2635" strokeWidth={4} />
    {/* Bottom-right mini scope panel + centerline (UNDER the polygon here). */}
    <Rect x={1046} y={668} width={878} height={228} rx={12} fill="#080b12" stroke="#1e2635" strokeWidth={4} />
    <Line x1={1054} y1={782} x2={1916} y2={782} stroke="#2b7fd4" strokeWidth={6} />
  </G>
);

const HubMultiMini: FC = memo(() => {
  const d = useHubData();
  const scaleRef = useRef(1.05);

  const db = dbOr(d.meter?.aFastDb);
  const frac = clamp((db + 60) / 60, 0, 1);
  const barW = frac * 1296;

  const b = d.bands;
  const n = b ? Math.min(30, b.levelsDb.length) : 0;
  const bars: ReactNode[] = [];
  const caps: ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    if (b!.resolvable[i] === false) continue;
    const x = MM_BAR_X0 + MM_BAR_PITCH * i;
    const yTop = mmYForDb(dbOr(b!.levelsDb[i], -90));
    const h = 612 - yTop;
    if (h >= 2) bars.push(<Rect key={i} x={x} y={yTop} width={MM_BAR_W} height={h} rx={3} />);
    const pk = dbOr(b!.peakHoldDb[i], -90);
    if (pk > -88) {
      caps.push(
        <Rect key={i} x={x - 2} y={mmYForDb(pk) - 4.5} width={MM_BAR_W + 4} height={9} rx={3} fill="#e6d5a0" opacity={0.9} />,
      );
    }
  }

  const sgPaths = useMemo(
    () => heatPaths(d.spectroCols.slice(-22), MM_SG_GEOM),
    [d.spectroCols],
  );

  const scopePts = buildEnvelope(d.wave, scaleRef, 1054, 1916, 782, 92, 40, 2);

  return (
    <LiveShell>
      <Svg width="100%" height="100%" viewBox={VB}>
        <Defs>
          <AmbGrad id="hpAmbMm" peak={0.2} />
          <LvlGrad id="hpLvlMm" y1={214} y2={612} />
          <MirGrad id="hpMirMm" y1={690} y2={874} />
          <HGrad id="hpLvlhMm" />
        </Defs>
        <Rect width={2048} height={1024} fill="#060608" />
        <Rect width={2048} height={1024} fill="url(#hpAmbMm)" />
        {MM_CHROME}
        {/* DATA — level bar (fixed-reference gradient: color maps absolute level). */}
        {barW > 4 && (
          <Rect x={124} y={132} width={barW} height={34} rx={Math.min(17, barW / 2)} fill="url(#hpLvlhMm)" />
        )}
        <G fill="url(#hpLvlMm)">{bars}</G>
        {caps}
        {sgPaths.map((p, i) => (p ? <Path key={i} d={p} fill={HEAT_12[i]} /> : null))}
        {scopePts && <Polygon points={scopePts} fill="url(#hpMirMm)" opacity={0.95} />}
      </Svg>
      <Vignette />
    </LiveShell>
  );
});
HubMultiMini.displayName = 'HubMultiMini';

/** Horizontal level ramp for the MultiMeter H-bar (art: blue left → red right,
 *  pinned x 124→1420 = the bar's full-scale extent). Note #f0a13c here is NOT
 *  a typo for LVL's #f0a23c — the tool_08 artwork genuinely uses both hexes. */
const HGRAD_STOPS: ReadonlyArray<readonly [number, string]> = [
  [0, '#143a86'], [0.12, '#2166c4'], [0.28, '#2b9ad2'], [0.44, '#34b96e'],
  [0.6, '#8ed24c'], [0.74, '#e9dc4d'], [0.86, '#f0a13c'], [1, '#e8503a'],
];
function HGrad({ id }: { id: string }) {
  return (
    <LinearGradient id={id} gradientUnits="userSpaceOnUse" x1={124} y1="0" x2={1420} y2="0">
      {rampStops(HGRAD_STOPS)}
    </LinearGradient>
  );
}

/* ================================================================== */

export const HUB_LIVE_MINIS: Partial<Record<ToolKey, FC>> = {
  spl: HubSplMini,
  rta: HubRtaMini,
  waveform: HubWaveMini,
  spectrogram: HubSpectroMini,
  multimeter: HubMultiMini,
};
