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
import Svg, { Circle, ClipPath, Defs, G, Image as SvgImage, Line, LinearGradient, Path, Polygon, Rect, Text as SvgText } from 'react-native-svg';
import { heatColor } from '../../features/tools/levelColor';
import {
  SKIN_LAMP,
  SKIN_VB,
  SPL_SCALE,
  VU_CTR,
  VU_FACE,
  VU_MAX,
  VU_NEEDLE_TIP,
  VU_SKIN,
  skinPt,
  vuAngle,
} from './SkinnedVu';
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
import { STRIP_VIEWBOX, STRIP_WINDOW } from './TileChassis';
import type { ToolKey } from './toolsData';

// The tile shows the art's PLOT WINDOW, not the full 2048×1024 canvas (owner
// 2026-09-05 — no bezel, no plot-top highlight); the minis draw in the same
// canvas coordinates and share that window so they land on the art exactly.
const VB = STRIP_VIEWBOX;
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
// The tile shows vu_skin_spl.png as the background; the gauge scale, PEAK lamp,
// needle, and pivot are drawn on top. Geometry + scale are shared with the SPL
// Meter screen's VU (SkinnedVu) so the tile and the tool match EXACTLY.

/** 0 VU anchor in dBFS — the real SPL meter's default (RANGE 60 − offset 100). */
const SPL_LIVE0 = -40;

/** SPL Reference Meter tile — the skinned VU. Always mounted; the needle rests
 *  at the bottom of the scale when no live signal is flowing. */
const HubSplSkin: FC = memo(() => {
  const d = useHubData();
  const vuRef = useRef(0);
  const vuVelRef = useRef(0);
  const lampRef = useRef(0);
  const lastTickRef = useRef(-2);

  const db = dbOr(d.meter?.aFastDb);
  const peakDb = dbOr(d.meter?.peakDb);
  // Same TRUE VU ballistic as the tool's SkinnedVu (symmetric 2nd-order, ANSI
  // C16.5 / IEC 60268-17) so the tile needle behaves EXACTLY like the meter.
  if (d.tick === 0) {
    // NOTHING IS MEASURING. `tick` starts at 1 for real frames, so 0 is the
    // engine's unambiguous empty sentinel — emitted once on teardown and then
    // never again. The ballistic only advances when the tick CHANGES, so a
    // needle at 0.90 integrated a single step toward rest (to ~0.40) and then
    // froze there indefinitely: 40% of scale, in silence, on the one tile that
    // is always mounted. This tile's own docstring says the needle "rests at
    // the bottom of the scale when no live signal is flowing" — now it does.
    lastTickRef.current = d.tick;
    vuRef.current = 0;
    vuVelRef.current = 0;
    lampRef.current = 0;
  } else if (lastTickRef.current !== d.tick) {
    lastTickRef.current = d.tick;
    const target = db <= -119 ? 0 : Math.min(VU_MAX * 1.04, Math.pow(10, (db - SPL_LIVE0) / 20));
    const W = 16;
    const Z = 0.72;
    // Sub-step the 80 ms tick (dt·W would be ~1.3) so the 2nd-order stays accurate.
    const SUB = 4;
    const h = TICK_SEC / SUB;
    for (let i = 0; i < SUB; i++) {
      const acc = W * W * (target - vuRef.current) - 2 * Z * W * vuVelRef.current;
      vuVelRef.current += acc * h;
      vuRef.current = Math.max(0, vuRef.current + vuVelRef.current * h);
    }
    // PEAK lamp: ramp toward lit/unlit so the brightness CHANGES smoothly on a
    // clip (owner rev 19) — same treatment as the tool's SkinnedVu.
    lampRef.current += ((peakDb >= -3 ? 1 : 0) - lampRef.current) * 0.5;
  }
  const ang = vuAngle(vuRef.current);
  const tip = skinPt(ang, VU_NEEDLE_TIP);
  const lampGlow = lampRef.current; // 0 = dark-red base only, 1 = fully lit

  return (
    <View style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" viewBox={SKIN_VB} preserveAspectRatio="xMidYMid slice">
        <Defs>
          <ClipPath id="hpVuFace">
            <Rect x={VU_FACE.x} y={VU_FACE.y} width={VU_FACE.w} height={VU_FACE.h} rx={VU_FACE.rx} />
          </ClipPath>
        </Defs>
        <SvgImage href={VU_SKIN} x={0} y={0} width={1586} height={992} preserveAspectRatio="xMidYMid slice" />
        {SPL_SCALE}
        {/* PEAK lamp — the dark-red base is in SPL_SCALE (always red); this
            illuminated layer (halo + bright core + hot centre) fades in with the
            clip so the lamp CHANGES brightness, matching the tool VU (rev 19). */}
        {lampGlow > 0.01 && (
          <>
            {/* No glow OUTSIDE the lens (owner 2026-09-01) — matches SkinnedVu:
                a real panel lamp lights its own lens, it does not wash the
                faceplate around it. */}
            <Circle cx={SKIN_LAMP.x} cy={SKIN_LAMP.y} r={SKIN_LAMP.r} fill="#ff5a34" opacity={lampGlow} />
            <Circle cx={SKIN_LAMP.x - 6} cy={SKIN_LAMP.y - 6} r={SKIN_LAMP.r * 0.5} fill="#ffe6ac" opacity={lampGlow} />
          </>
        )}
        {/* Needle — pivots at the DOME (fixed axle), clipped to the face window
            so it never paints over the bezel. */}
        <G clipPath="url(#hpVuFace)">
          <Line x1={VU_CTR.x + 4} y1={VU_CTR.y + 5} x2={tip.x + 4} y2={tip.y + 5} stroke="rgba(28,14,2,0.3)" strokeWidth={10} strokeLinecap="round" />
          <Line x1={VU_CTR.x} y1={VU_CTR.y} x2={tip.x} y2={tip.y} stroke="#1a1206" strokeWidth={8} strokeLinecap="round" />
        </G>
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

// ── Mini edgewise VU face (matches the redesigned tool, owner 2026-09-11):
// amber drum face, curved baseline bar with the green ±5¢ zone, signed
// −30/+30 ends, and a VERTICAL blade translating on the arc. SVG chrome +
// RN-view blade, same recipe as before — no image decode in the hub.
const TUNER_MAX_C = 30; // ±30¢, matching the tool's scale
const TVU_CX = 1024;
const TVU_HALF = 600; // px at ±30¢ → 20 px/cent
const TVU_BAR = 560; // baseline bar y at center
const TVU_RISE = 34; // ends rise (drum curve), parabola approx
const TVU_FACE = { x: 190, y: 170, w: 1668, h: 688, r: 34 } as const;
const TVU_INK = '#33200e';
/** Corner readout size, in viewBox units. The tile scales the 2048-unit artwork
 *  down to roughly 155 pt, so a unit is about a twelfth of a pixel: 58 units
 *  rendered 5 px and could not be read at all. 124 lands near 11 px, matching
 *  the tile's own title band, and still clears the blade (which stays within
 *  +/-600 of centre) because these sit hard against the face's left and right
 *  edges. Raised to weight 700 and a 0.5 resting opacity so the honest
 *  em-dash - what shows when no pitch is detected - is legible AS an em-dash
 *  rather than invisible; it stays clearly dimmer than a real reading. */
const TVU_READOUT_PT = 124;
const TVU_INK_SOFT = 'rgba(51,32,14,0.65)';
const tvuX = (c: number) => TVU_CX + (c / TUNER_MAX_C) * TVU_HALF;
const tvuRise = (c: number) => -TVU_RISE * Math.pow(c / TUNER_MAX_C, 2);

function tvuBarPath(from: number, to: number): string {
  const pts: string[] = [];
  for (let c = from; c <= to; c += 2.5) pts.push(`${pts.length ? 'L' : 'M'}${tvuX(c).toFixed(1)},${(TVU_BAR + tvuRise(c)).toFixed(1)}`);
  return pts.join(' ');
}

const TVU_TICKS = (() => {
  const out: { x: number; y0: number; y1: number; w: number; soft: boolean }[] = [];
  for (let c = -TUNER_MAX_C; c <= TUNER_MAX_C; c += 5) {
    const major = c % 10 === 0;
    const h = c === 0 ? 92 : major ? 64 : 42;
    const y = TVU_BAR + tvuRise(c);
    out.push({ x: tvuX(c), y0: y - 4, y1: y - h, w: c === 0 ? 10 : major ? 8 : 6, soft: !major });
  }
  return out;
})();

const TUNER_CHROME = (
  <G>
    <Defs>
      <LinearGradient id="tvuFace" x1="0" y1="0" x2="0" y2="1">
        {rampStops([
          [0, '#f1e4cd'], [0.4, '#eccfa0'], [0.62, '#e9b269'], [0.82, '#f0942c'], [1, '#d1720e'],
        ])}
      </LinearGradient>
      <LinearGradient id="tvuGlow" x1="0" y1="1" x2="0" y2="0">
        {rampStops([
          [0, '#ffb63f'], [0.5, 'rgba(255,182,63,0.35)'], [1, 'rgba(255,182,63,0)'],
        ])}
      </LinearGradient>
    </Defs>
    {/* bezel + glass face + bottom lamp glow */}
    <Rect x={140} y={125} width={1768} height={778} rx={26} fill="#16110c" stroke="#3a2c1c" strokeWidth={6} />
    <Rect x={TVU_FACE.x} y={TVU_FACE.y} width={TVU_FACE.w} height={TVU_FACE.h} rx={TVU_FACE.r} fill="url(#tvuFace)" />
    <Rect x={TVU_FACE.x} y={620} width={TVU_FACE.w} height={238} rx={TVU_FACE.r} fill="url(#tvuGlow)" opacity={0.75} />
    {/* printed scale: curved bar, green zone, ticks */}
    <Path d={tvuBarPath(-TUNER_MAX_C, TUNER_MAX_C)} stroke={TVU_INK} strokeWidth={12} fill="none" strokeLinecap="round" />
    <Path d={tvuBarPath(-5, 5)} stroke="#2fbf5a" strokeWidth={12} fill="none" />
    {TVU_TICKS.map((t) => (
      <Line key={t.x} x1={t.x} y1={t.y0} x2={t.x} y2={t.y1} stroke={t.soft ? TVU_INK_SOFT : TVU_INK} strokeWidth={t.w} />
    ))}
    {/* legend + signed ends + accidentals, the tool's printed voice */}
    <SvgText x={TVU_CX} y={296} fill={TVU_INK_SOFT} fontSize={46} fontWeight="600" letterSpacing={10} textAnchor="middle" fontFamily="sans-serif">CENTS</SvgText>
    <SvgText x={tvuX(-30)} y={TVU_BAR + tvuRise(-30) - 130} fill={TVU_INK} fontSize={64} fontWeight="600" textAnchor="middle" fontFamily="sans-serif">−30</SvgText>
    <SvgText x={TVU_CX} y={TVU_BAR - 158} fill={TVU_INK} fontSize={64} fontWeight="600" textAnchor="middle" fontFamily="sans-serif">0</SvgText>
    <SvgText x={tvuX(30)} y={TVU_BAR + tvuRise(30) - 130} fill={TVU_INK} fontSize={64} fontWeight="600" textAnchor="middle" fontFamily="sans-serif">+30</SvgText>
    <SvgText x={286} y={TVU_BAR + tvuRise(-30) + 8} fill={TVU_INK} fontSize={84} textAnchor="middle" fontFamily="serif">♭</SvgText>
    <SvgText x={1762} y={TVU_BAR + tvuRise(30) + 8} fill={TVU_INK} fontSize={84} textAnchor="middle" fontFamily="serif">♯</SvgText>
  </G>
);

/** Cents off the nearest equal-tempered note (A4=440), clamped to the ±30¢
 *  face — the tool's scale. null when out of a sane instrument range. */
function centsOf(freq: number): number | null {
  if (!(freq > 0)) return null;
  const midi = Math.round(12 * Math.log2(freq / 440) + 69);
  if (midi < 12 || midi > 120) return null; // ~C0…C9
  const fNote = 440 * Math.pow(2, (midi - 69) / 12);
  return clamp(1200 * Math.log2(freq / fNote), -TUNER_MAX_C, TUNER_MAX_C);
}

/** Nearest note name for the corner readout (same range gate as centsOf). */
const TVU_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
function tvuNoteName(freq: number): string | null {
  if (!(freq > 0)) return null;
  const midi = Math.round(12 * Math.log2(freq / 440) + 69);
  if (midi < 12 || midi > 120) return null;
  return `${TVU_NAMES[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`;
}

const HubTunerLive: FC = memo(() => {
  const d = useHubData();
  const [w, onLayout] = useMeasuredWidth();
  const [inTune, setInTune] = useState(false);
  const cents = useRef(new Animated.Value(0)).current;
  const alive = useRef(new Animated.Value(0)).current;
  const lastTickRef = useRef(-1);

  // Chase the live cents each tick (honesty gate matches the Frequency
  // Counter tool: voiced + confident + above the noise floor). No stable
  // pitch → the blade FADES OUT (owner ruling 2026-09-10: hidden, never a
  // parked ghost that could read as in-tune).
  if (lastTickRef.current !== d.tick) {
    lastTickRef.current = d.tick;
    const p = d.pitch;
    const voiced = !!p && p.voiced && p.confidence >= 0.5 && p.levelDb >= -60;
    const c = voiced ? centsOf(p!.freq) : null;
    const nowInTune = c != null && Math.abs(c) < 5;
    if (nowInTune !== inTune) setInTune(nowInTune);
    if (c != null) {
      Animated.timing(cents, {
        toValue: c,
        duration: HUB_TICK_MS + 50,
        easing: Easing.out(Easing.quad),
        useNativeDriver: NATIVE_DRIVER,
      }).start();
    }
    Animated.timing(alive, {
      toValue: c != null ? 1 : 0,
      duration: 200,
      easing: Easing.out(Easing.quad),
      useNativeDriver: NATIVE_DRIVER,
    }).start();
  }

  // RN overlays are placed in CANVAS units mapped into the display window
  // (STRIP_WINDOW): scale by the window width, offset by its origin.
  const s = w / STRIP_WINDOW.w;
  const ox = STRIP_WINDOW.x;
  const oy = STRIP_WINDOW.y;
  const bladeX = cents.interpolate({
    inputRange: [-TUNER_MAX_C, TUNER_MAX_C],
    outputRange: [-TVU_HALF * s, TVU_HALF * s],
  });
  // The blade's climb samples the SAME parabola as the printed scale (owner
  // 2026-09-11: a coarse 3-point ramp visibly left the printed curve mid-scale).
  const bladeY = cents.interpolate({
    inputRange: [-30, -20, -10, 0, 10, 20, 30],
    outputRange: [tvuRise(-30) * s, tvuRise(-20) * s, tvuRise(-10) * s, 0, tvuRise(10) * s, tvuRise(20) * s, tvuRise(30) * s],
  });
  const needleColor = inTune ? '#2fbf5a' : '#1d1208';
  // Corner readouts (owner 2026-09-11): pitch lower-left, Hz lower-right.
  // Same honesty gate as the blade — silence shows a dimmed em-dash.
  //
  // SIZE (owner 2026-09-13, asking for readouts that were already here). They
  // were drawn at 58 units, which on a 162 pt tile renders FIVE PIXELS tall, at
  // 0.4 opacity when nothing is detected — smaller than the CENTS label beside
  // them and effectively invisible, which is why they read as missing. The tile
  // is ~1/11th the size of the viewBox, so anything meant to be READ here has
  // to be sized for that, not for the artwork's own scale.
  const p = d.pitch;
  const cornerVoiced = !!p && p.voiced && p.confidence >= 0.5 && p.levelDb >= -60;
  const cornerNote = cornerVoiced ? tvuNoteName(p!.freq) : null;
  const cornerHz = cornerVoiced && cornerNote != null ? `${p!.freq < 100 ? p!.freq.toFixed(1) : Math.round(p!.freq)} Hz` : null;

  return (
    <LiveShell>
      <View style={StyleSheet.absoluteFill} onLayout={onLayout}>
        <Svg width="100%" height="100%" viewBox={VB}>
          <Rect width={2048} height={1024} fill="#060608" />
          {TUNER_CHROME}
          <SvgText x={252} y={812} fill={TVU_INK} fontSize={TVU_READOUT_PT} fontWeight="700" textAnchor="start" fontFamily="sans-serif" opacity={cornerNote ? 0.92 : 0.5}>
            {cornerNote ?? '—'}
          </SvgText>
          <SvgText x={1796} y={812} fill={TVU_INK} fontSize={TVU_READOUT_PT} fontWeight="700" textAnchor="end" fontFamily="sans-serif" opacity={cornerHz ? 0.92 : 0.5}>
            {cornerHz ?? '— Hz'}
          </SvgText>
        </Svg>
        {s > 0 && (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: (TVU_FACE.x - ox) * s,
              top: (TVU_FACE.y - oy) * s,
              width: TVU_FACE.w * s,
              height: TVU_FACE.h * s,
              borderRadius: TVU_FACE.r * s,
              overflow: 'hidden',
            }}
          >
            <Animated.View
              style={{
                position: 'absolute',
                left: (TVU_CX - TVU_FACE.x) * s - 11 * s,
                top: (392 - TVU_FACE.y) * s,
                width: 22 * s,
                height: (TVU_FACE.y + TVU_FACE.h - 392 + 40) * s,
                borderRadius: 11 * s,
                backgroundColor: needleColor,
                opacity: alive,
                transform: [{ translateX: bladeX }, { translateY: bladeY }],
              }}
            />
          </View>
        )}
        <Vignette />
      </View>
    </LiveShell>
  );
});
HubTunerLive.displayName = 'HubTunerLive';

/* ================================================================== */

/** Minis that render only while frames flow, OVER the tool's static strip art -
 *  the strip is their resting state. That only works where the strip and the
 *  mini are the same instrument: these four are (the art and the live layer
 *  were drawn together). */
export const HUB_LIVE_MINIS: Partial<Record<ToolKey, FC>> = {
  rta: HubRtaMini,
  waveform: HubWaveMini,
  spectrogram: HubSpectroMini,
  multimeter: HubMultiMini,
};

/** Always-on minis (render regardless of live state; rest when no signal).
 *  SPL uses the skinned VU face as its display in BOTH states.
 *
 *  hzcounter JOINED THEM 2026-09-13 (owner report: the tuner tile "flickers
 *  occasionally with the old car gauge style tuner"). It was a live-only mini,
 *  so `tool_07_frequency_counter_tuner_strip.svg` sat permanently underneath it
 *  and became visible on every dropout - and that strip is the RETIRED round
 *  car-gauge tuner, not the edgewise blade this tile draws now. The dropouts are
 *  real: the dead-capture watchdog in hubPreviewEngine cycles stop -> auto-start
 *  after ~1 s of stalled capture, and LiveShell then fades the mini back in over
 *  420 ms, so each cycle showed the obsolete artwork for about half a second.
 *
 *  Always-on is honest here for the same reason it is for SPL: HubTunerLive
 *  paints its own complete chrome and RESTS with no signal - the blade fades
 *  out entirely and both corner readouts show an em-dash - so a stopped, denied
 *  or absent engine shows a tuner reading nothing, never a parked ghost that
 *  could be mistaken for a reading (the owner's 2026-09-10 blade ruling, and
 *  the no-fake-meters rule). */
export const HUB_SKIN_MINIS: Partial<Record<ToolKey, FC>> = {
  spl: HubSplSkin,
  hzcounter: HubTunerLive,
};
