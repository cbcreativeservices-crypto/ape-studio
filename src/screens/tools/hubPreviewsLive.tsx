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
import { memo, useEffect, useMemo, useRef, useState, useSyncExternalStore, type FC, type ReactNode } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, G, Image as SvgImage, Line, LinearGradient, Path, Polygon, Rect, Text as SvgText } from 'react-native-svg';
import { heatColor } from '../../features/tools/levelColor';
import { fonts } from '../../theme/tokens';
import type { PitchFrame, WaveBucket } from '../../../modules/ape-dsp';
import {
  getHubPreview,
  subscribeHubPreview,
  HUB_TICK_MS,
  SPECTRO_COLS,
  SPECTRO_ROWS,
  type HubPreviewData,
  type HubSpectroCol,
} from './hubPreviewEngine';
import { LvlGrad, MirGrad, NATIVE_DRIVER, rampStops, useMeasuredWidth, Vignette } from './hubPreviewShared';
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
/* 01 — SPL REFERENCE METER (SKINNED analogue VU) — owner 2026-08-19    */
/* ================================================================== */
// The tile shows vu_skin_spl.png (a photoreal VU meter face) as the background;
// ONLY the needle, pivot cap, and the gauge scale (arc + ticks + numbers) are
// drawn on top. Everything is react-native-svg in the skin's native 1586×992
// space (preserveAspectRatio slice), so the overlay lines up with the printed
// face at any tile size. Always on — the needle rests when there's no signal.

const VU_SKIN = require('../../../assets/tool-strips/vu_skin_spl.png');
const SKIN_VB = '0 0 1586 992';
/** 0 VU anchor in dBFS — the real SPL meter's default (RANGE 60 − offset 100). */
const SPL_LIVE0 = -40;
const VU_MAX = Math.pow(10, 3 / 20); // +3 dB rel 0 VU (integrator ceiling)

// Skin geometry (measured from vu_skin_spl.png): the needle pivots at the
// bottom-centre dome; the scale arc sweeps the glowing face above it.
const SKIN_PIVOT = { x: 795, y: 802 };
const SKIN_R_ARC = 585;
const SKIN_R_MAJ_IN = 544;
const SKIN_R_MIN_IN = 564;
const SKIN_R_NUM = 630;
const SKIN_NEEDLE_L = 560;
/** 0 VU sits at ~71% of the sweep — the standard VU face proportion. */
const VU_ZERO_FRAC = 0.71;

const vuValAngle = (vuVal: number) => -62 + 124 * clamp(VU_ZERO_FRAC * vuVal, 0, 1.02);
const vuDbAngle = (dbv: number) => vuValAngle(Math.pow(10, dbv / 20));
const skinPt = (deg: number, r: number) => {
  const a = (deg * Math.PI) / 180;
  return { x: SKIN_PIVOT.x + r * Math.sin(a), y: SKIN_PIVOT.y - r * Math.cos(a) };
};

const SPL_TICKS: ReadonlyArray<{ db: number; major: boolean }> = [
  { db: -20, major: true }, { db: -10, major: true }, { db: -7, major: false },
  { db: -5, major: true }, { db: -3, major: true }, { db: -2, major: false },
  { db: -1, major: false }, { db: 0, major: true }, { db: 1, major: false },
  { db: 2, major: false }, { db: 3, major: true },
];
const SPL_INK = '#2a1a08'; // dark scale ink on the cream face
const SPL_INK_RED = '#b3231a';

/** The printed gauge scale (arc + ticks + numbers) — constant, built once. */
const SPL_SCALE = (() => {
  const els: ReactNode[] = [];
  const pL = skinPt(vuDbAngle(-20), SKIN_R_ARC);
  const p0 = skinPt(vuDbAngle(0), SKIN_R_ARC);
  const pR = skinPt(vuDbAngle(3), SKIN_R_ARC);
  els.push(
    <Path key="arc" d={`M${pL.x.toFixed(1)} ${pL.y.toFixed(1)}A${SKIN_R_ARC} ${SKIN_R_ARC} 0 0 1 ${pR.x.toFixed(1)} ${pR.y.toFixed(1)}`} fill="none" stroke={SPL_INK} strokeWidth={5} />,
  );
  els.push(
    <Path key="arcRed" d={`M${p0.x.toFixed(1)} ${p0.y.toFixed(1)}A${SKIN_R_ARC} ${SKIN_R_ARC} 0 0 1 ${pR.x.toFixed(1)} ${pR.y.toFixed(1)}`} fill="none" stroke={SPL_INK_RED} strokeWidth={11} />,
  );
  SPL_TICKS.forEach((t) => {
    const a = vuDbAngle(t.db);
    const pi = skinPt(a, t.major ? SKIN_R_MAJ_IN : SKIN_R_MIN_IN);
    const po = skinPt(a, SKIN_R_ARC);
    const col = t.db >= 0 ? SPL_INK_RED : SPL_INK;
    els.push(<Line key={`t${t.db}`} x1={pi.x} y1={pi.y} x2={po.x} y2={po.y} stroke={col} strokeWidth={t.major ? 7 : 4} />);
    if (t.major) {
      const pn = skinPt(a, SKIN_R_NUM);
      els.push(
        <SvgText key={`n${t.db}`} x={pn.x} y={pn.y + 18} fill={col} fontFamily={fonts.oswaldSemiBold} fontSize={52} textAnchor="middle">
          {t.db > 0 ? `+${t.db}` : `${t.db}`}
        </SvgText>,
      );
    }
  });
  return <G>{els}</G>;
})();

/** SPL Reference Meter tile — the skinned VU. Always mounted; the needle rests
 *  at the bottom of the scale when no live signal is flowing. */
const HubSplSkin: FC = memo(() => {
  const d = useHubData();
  const vuRef = useRef(0);
  const lastTickRef = useRef(-2);

  const db = dbOr(d.meter?.aFastDb);
  // Advance the VU ballistics once per store tick — rise tc 0.15 s, fall 0.45 s.
  if (lastTickRef.current !== d.tick) {
    lastTickRef.current = d.tick;
    const target = db <= -119 ? 0 : Math.min(VU_MAX * 1.06, Math.pow(10, (db - SPL_LIVE0) / 20));
    const prev = vuRef.current;
    const tc = target > prev ? 0.15 : 0.45;
    vuRef.current = prev + (target - prev) * (1 - Math.exp(-TICK_SEC / tc));
  }
  const tip = skinPt(vuValAngle(vuRef.current), SKIN_NEEDLE_L);

  return (
    <View style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" viewBox={SKIN_VB} preserveAspectRatio="xMidYMid slice">
        <SvgImage href={VU_SKIN} x={0} y={0} width={1586} height={992} preserveAspectRatio="xMidYMid slice" />
        {SPL_SCALE}
        {/* Needle — a soft cast shadow under the dark blade. */}
        <Line x1={SKIN_PIVOT.x} y1={SKIN_PIVOT.y} x2={tip.x + 5} y2={tip.y + 5} stroke="rgba(28,14,2,0.32)" strokeWidth={9} strokeLinecap="round" />
        <Line x1={SKIN_PIVOT.x} y1={SKIN_PIVOT.y} x2={tip.x} y2={tip.y} stroke="#171004" strokeWidth={7} strokeLinecap="round" />
        {/* Pivot post / cap over the dome. */}
        <Circle cx={SKIN_PIVOT.x} cy={SKIN_PIVOT.y} r={30} fill="#120c03" />
        <Circle cx={SKIN_PIVOT.x} cy={SKIN_PIVOT.y} r={12} fill="#4a3618" />
      </Svg>
    </View>
  );
});
HubSplSkin.displayName = 'HubSplSkin';

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
          <LvlGrad id="hpLvlRta" y1={104} y2={920} />
        </Defs>
        <Rect width={2048} height={1024} fill="#060608" />
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
const WAVE_FS_PX = 408; // ±full scale in canvas units = the plot's half height
const WAVE_ZOOM = 2; // default ×2 (WaveformScreen's DEFAULT_ZOOM) — owner 2026-08-19

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
  zoom = 1,
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
  // Zoom multiplies on top of the autoscale (WaveformScreen contract): the
  // loudest sample pegs the plot edge and everything quieter is `zoom`× taller.
  // Excursions clamp to ±fsPx so a loud transient clips at the panel, not over it.
  const top: string[] = [];
  const bot: string[] = [];
  for (let i = 0; i < n; i++) {
    const x = (x0 + i * step).toFixed(1);
    const bk = i < pad ? null : slice[i - pad];
    const vMax = bk && Number.isFinite(bk.max) ? bk.max : 0;
    const vMin = bk && Number.isFinite(bk.min) ? bk.min : 0;
    const eT = clamp((vMax / scale) * zoom, -1, 1) * fsPx;
    const eB = clamp((vMin / scale) * zoom, -1, 1) * fsPx;
    let yT = mid - eT;
    let yB = mid - eB;
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
  const pts = buildEnvelope(d.wave, scaleRef, 124, 1924, WAVE_MID, WAVE_FS_PX, WAVE_WINDOW_BUCKETS, 3, WAVE_ZOOM);

  return (
    <LiveShell>
      <Svg width="100%" height="100%" viewBox={VB}>
        <Defs>
          <MirGrad id="hpMirWave" y1={104} y2={920} />
        </Defs>
        <Rect width={2048} height={1024} fill="#060608" />
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
        <Rect width={2048} height={1024} fill="#060608" />
        {SPECTRO_CHROME}
        {paths.map((p, i) => (p ? <Path key={i} d={p} fill={HEAT_12[i]} /> : null))}
      </Svg>
      <Vignette />
    </LiveShell>
  );
});
HubSpectroMini.displayName = 'HubSpectroMini';

/* ================================================================== */
/* 08 — PRO AUDIO MULTIMETER (level bar · RTA LEFT · spectrogram RIGHT) */
/* ================================================================== */
// Owner 2026-08-19: the mini must NOT read like the standalone RTA tile below
// it, so the "all-in-one" reads as three DIFFERENT instruments side by side —
// a slim level bar across the top, a spectrum analyser on the LEFT, and a
// spectrogram on the RIGHT. (The static tool_08 strip is the resting art; this
// opaque live layer replaces it wholesale while frames flow.)

// Top level bar track — deliberately thick so the level reads clearly at tile
// size (owner 2026-08-19).
const MM_BAR_TRACK_X = 104;
const MM_BAR_TRACK_W = 1840;
const MM_BAR_Y = 104;
const MM_BAR_H = 52;
const MM_BAR_RX = 26;
const MM_LEVEL_FLOOR = -62; // lively preview window (matches the SPL ladder)
const MM_LEVEL_SPAN = 50;

// LEFT panel — RTA. 30 native bands grouped to 15 chunky bars for readability
// at half-tile width.
const MM_RTA_PANEL = { x: 90, y: 172, w: 918, h: 744 };
const MM_RTA_BARS = 15;
const MM_RTA_X0 = 128;
const MM_RTA_PITCH = 57;
const MM_RTA_W = 44;
const MM_RTA_TOP_Y = 210; // 0 dBFS
const MM_RTA_BOT_Y = 892; // −90 dBFS
const mmRtaY = (db: number) => clamp(MM_RTA_TOP_Y + (db / -90) * (MM_RTA_BOT_Y - MM_RTA_TOP_Y), MM_RTA_TOP_Y, MM_RTA_BOT_Y);

// RIGHT panel — spectrogram. Only the newest MM_SG_COLS history columns are
// drawn, so the heat map stays INSIDE the right panel (x 1060→1936) and never
// spills left over the RTA — the column pitch is sized for exactly this count.
const MM_SG_PANEL = { x: 1040, y: 172, w: 918, h: 744 };
const MM_SG_COLS = 22;
const MM_SG_GEOM = {
  xRight: 1936,
  colW: (1936 - 1060) / MM_SG_COLS,
  cellW: 42,
  yBottom: 892,
  rowH: (892 - 210) / 20,
  cellH: 36,
  rows: 20,
  rowOf: (r: number) => Math.min(SPECTRO_ROWS - 1, Math.floor((r * SPECTRO_ROWS) / 20)),
};

const MM_CHROME = (
  <G>
    {/* Top level-bar track (thick — easy to read at tile size). */}
    <Rect x={MM_BAR_TRACK_X} y={MM_BAR_Y} width={MM_BAR_TRACK_W} height={MM_BAR_H} rx={MM_BAR_RX} fill="#141821" />
    {/* LEFT — RTA panel + gridlines. */}
    <Rect x={MM_RTA_PANEL.x} y={MM_RTA_PANEL.y} width={MM_RTA_PANEL.w} height={MM_RTA_PANEL.h} rx={14} fill="#0b0f16" stroke="#1e2635" strokeWidth={4} />
    {[381, 553, 725].map((y, i) => (
      <Line key={i} x1={MM_RTA_PANEL.x + 30} y1={y} x2={MM_RTA_PANEL.x + MM_RTA_PANEL.w - 30} y2={y} stroke="#1b2434" strokeWidth={3} />
    ))}
    {/* RIGHT — spectrogram panel. */}
    <Rect x={MM_SG_PANEL.x} y={MM_SG_PANEL.y} width={MM_SG_PANEL.w} height={MM_SG_PANEL.h} rx={14} fill="#04070f" stroke="#1e2635" strokeWidth={4} />
  </G>
);

const HubMultiMini: FC = memo(() => {
  const d = useHubData();

  // Level bar (lively window; fixed-reference gradient maps absolute level).
  const db = dbOr(d.meter?.aFastDb);
  const lvlFrac = clamp((db - MM_LEVEL_FLOOR) / MM_LEVEL_SPAN, 0, 1);
  const barW = lvlFrac * MM_BAR_TRACK_W;

  // RTA — group the 30 native bands to 15 bars (max of each pair).
  const b = d.bands;
  const bars: ReactNode[] = [];
  const caps: ReactNode[] = [];
  if (b) {
    const src = b.levelsDb;
    const pk = b.peakHoldDb;
    const res = b.resolvable;
    for (let j = 0; j < MM_RTA_BARS; j++) {
      const a = 2 * j;
      const c = Math.min(a + 1, src.length - 1);
      if (res[a] === false && res[c] === false) continue;
      const lvl = Math.max(dbOr(src[a], -90), dbOr(src[c], -90));
      const x = MM_RTA_X0 + MM_RTA_PITCH * j;
      const yTop = mmRtaY(lvl);
      const h = MM_RTA_BOT_Y - yTop;
      if (h >= 2) bars.push(<Rect key={j} x={x} y={yTop} width={MM_RTA_W} height={h} rx={3} />);
      const pkDb = Math.max(dbOr(pk[a], -90), dbOr(pk[c], -90));
      if (pkDb > -88) {
        caps.push(
          <Rect key={j} x={x - 2} y={mmRtaY(pkDb) - 4.5} width={MM_RTA_W + 4} height={9} rx={3} fill="#e6d5a0" opacity={0.9} />,
        );
      }
    }
  }

  // Spectrogram — the newest MM_SG_COLS columns of the shared history, painted
  // into the RIGHT panel only (slicing keeps it from spilling over the RTA).
  const spectroCols = useSyncExternalStore(subscribeHubPreview, () => getHubPreview().spectroCols);
  const sgPaths = useMemo(() => heatPaths(spectroCols.slice(-MM_SG_COLS), MM_SG_GEOM), [spectroCols]);

  return (
    <LiveShell>
      <Svg width="100%" height="100%" viewBox={VB}>
        <Defs>
          <LvlGrad id="hpLvlMm" y1={MM_RTA_TOP_Y} y2={MM_RTA_BOT_Y} />
          <HGrad id="hpLvlhMm" />
        </Defs>
        <Rect width={2048} height={1024} fill="#060608" />
        {MM_CHROME}
        {/* Top level bar. */}
        {barW > 4 && (
          <Rect x={MM_BAR_TRACK_X} y={MM_BAR_Y} width={barW} height={MM_BAR_H} rx={Math.min(MM_BAR_RX, barW / 2)} fill="url(#hpLvlhMm)" />
        )}
        {/* LEFT — RTA bars + peak caps. */}
        <G fill="url(#hpLvlMm)">{bars}</G>
        {caps}
        {/* RIGHT — spectrogram cells. */}
        {sgPaths.map((p, i) => (p ? <Path key={i} d={p} fill={HEAT_12[i]} /> : null))}
      </Svg>
      <Vignette />
    </LiveShell>
  );
});
HubMultiMini.displayName = 'HubMultiMini';

/** Horizontal level ramp for the MultiMeter top level bar (blue left → red
 *  right), pinned to the track's full extent. Note #f0a13c here is NOT a typo
 *  for LVL's #f0a23c — the tool_08 artwork genuinely uses both hexes. */
const HGRAD_STOPS: ReadonlyArray<readonly [number, string]> = [
  [0, '#143a86'], [0.12, '#2166c4'], [0.28, '#2b9ad2'], [0.44, '#34b96e'],
  [0.6, '#8ed24c'], [0.74, '#e9dc4d'], [0.86, '#f0a13c'], [1, '#e8503a'],
];
function HGrad({ id }: { id: string }) {
  return (
    <LinearGradient id={id} gradientUnits="userSpaceOnUse" x1={MM_BAR_TRACK_X} y1="0" x2={MM_BAR_TRACK_X + MM_BAR_TRACK_W} y2="0">
      {rampStops(HGRAD_STOPS)}
    </LinearGradient>
  );
}

/* ================================================================== */
/* 07 — FREQUENCY COUNTER & TUNER (REAL-TIME live pitch)               */
/* ================================================================== */
// Owner 2026-08-19: real-time action, not a scripted demo. The needle + cents
// cursor track the live YIN pitch from the mic (whistle, sing, or tune a real
// instrument in front of the phone). Chrome ported verbatim from tool_07.

const TUNER_CX = 1024;
const TUNER_CY = 706;
const TUNER_DEG_PER_CENT = 56 / 50; // ±50¢ → ±56° of needle travel
const TUNER_PX_PER_CENT = 13.04; // cents cursor travel on the bottom ruler
const TUNER_TIP_LEN = 320;
const TUNER_TAIL_LEN = 58;

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

/** Cents off the nearest equal-tempered note (A4=440), clamped to the ±50¢
 *  dial. null when the frequency is out of a sane instrument range. */
function centsOf(freq: number): number | null {
  if (!(freq > 0)) return null;
  const midi = Math.round(12 * Math.log2(freq / 440) + 69);
  if (midi < 12 || midi > 120) return null; // ~C0…C9
  const fNote = 440 * Math.pow(2, (midi - 69) / 12);
  return clamp(1200 * Math.log2(freq / fNote), -50, 50);
}

const HubTunerLive: FC = memo(() => {
  const d = useHubData();
  const [w, onLayout] = useMeasuredWidth();
  const [inTune, setInTune] = useState(false);
  const cents = useRef(new Animated.Value(0)).current;
  const lastTickRef = useRef(-1);

  // Chase the live cents each tick (honesty gate matches the Frequency Counter
  // tool: voiced + confident + above the noise floor). When silent the needle
  // eases back to centre so the dial rests instead of freezing on a stale note.
  if (lastTickRef.current !== d.tick) {
    lastTickRef.current = d.tick;
    const p = d.pitch;
    const voiced = !!p && p.voiced && p.confidence >= 0.5 && p.levelDb >= -60;
    const c = voiced ? centsOf(p!.freq) : null;
    const target = c == null ? 0 : c;
    const nowInTune = c != null && Math.abs(c) < 5;
    if (nowInTune !== inTune) setInTune(nowInTune);
    Animated.timing(cents, {
      toValue: target,
      duration: HUB_TICK_MS + 50,
      easing: Easing.out(Easing.quad),
      useNativeDriver: NATIVE_DRIVER,
    }).start();
  }

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
    <LiveShell>
      <View style={StyleSheet.absoluteFill} onLayout={onLayout}>
        <Svg width="100%" height="100%" viewBox={VB}>
          <Rect width={2048} height={1024} fill="#060608" />
          {TUNER_CHROME}
        </Svg>
        {s > 0 && (
          <>
            <Animated.View
              pointerEvents="none"
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
                  position: 'absolute', top: 0, left: 0,
                  width: 42 * s, height: (TUNER_TIP_LEN + TUNER_TAIL_LEN) * s,
                  borderRadius: 21 * s, backgroundColor: needleColor, opacity: 0.16,
                }}
              />
              <View
                style={{
                  position: 'absolute', top: 0, left: 12.5 * s,
                  width: 17 * s, height: (TUNER_TIP_LEN + TUNER_TAIL_LEN) * s,
                  borderRadius: 8.5 * s, backgroundColor: needleColor,
                }}
              />
            </Animated.View>
            <View
              pointerEvents="none"
              style={{
                position: 'absolute', left: (TUNER_CX - 46) * s, top: (TUNER_CY - 46) * s,
                width: 92 * s, height: 92 * s, borderRadius: 46 * s,
                backgroundColor: '#151a22', borderWidth: Math.max(1, 6 * s), borderColor: '#3a4354',
              }}
            />
            <View
              pointerEvents="none"
              style={{
                position: 'absolute', left: (TUNER_CX - 18) * s, top: (TUNER_CY - 18) * s,
                width: 36 * s, height: 36 * s, borderRadius: 18 * s, backgroundColor: '#f5b942',
              }}
            />
            <Animated.View
              pointerEvents="none"
              style={{
                position: 'absolute', left: (TUNER_CX - 40) * s, top: 806 * s,
                width: 80 * s, height: 164 * s, transform: [{ translateX: cursorX }],
              }}
            >
              <Svg width={80 * s} height={42 * s} viewBox="0 0 80 42">
                <Polygon points="0,0 80,0 40,42" fill={needleColor} />
              </Svg>
              <View
                style={{
                  position: 'absolute', left: 26.5 * s, top: 52 * s,
                  width: 27 * s, height: 112 * s, borderRadius: 13 * s, backgroundColor: needleColor,
                }}
              />
            </Animated.View>
          </>
        )}
        <Vignette />
      </View>
    </LiveShell>
  );
});
HubTunerLive.displayName = 'HubTunerLive';

/* ================================================================== */

export const HUB_LIVE_MINIS: Partial<Record<ToolKey, FC>> = {
  rta: HubRtaMini,
  waveform: HubWaveMini,
  spectrogram: HubSpectroMini,
  multimeter: HubMultiMini,
  hzcounter: HubTunerLive,
};

/** Always-on minis (render regardless of live state; rest when no signal).
 *  SPL uses the skinned VU face as its display in BOTH states. */
export const HUB_SKIN_MINIS: Partial<Record<ToolKey, FC>> = {
  spl: HubSplSkin,
};
