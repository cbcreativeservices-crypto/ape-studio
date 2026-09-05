/**
 * ToolsHubScreen — Measurement & Analysis tools dashboard (Booth 2026-07-09v).
 * Reached from the Home carousel's Measurement & Analysis card (left of the
 * Glossary card). Root-stack screen (bottom nav hidden). Lists the five
 * measurement tools with per-tool colored glass keys; each opens its
 * educational info screen (the live engine is Spike 0 — see toolsData notes).
 */
import { memo, useCallback, useEffect, useMemo, useRef, useState, type FC } from 'react';
import { markToolNavigate, markToolTap } from '../../features/tools/devTiming';
import { Animated, Dimensions, Easing, InteractionManager, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { hapticsEnabled } from '../../features/settings/store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  Line,
  LinearGradient as SvgLinearGradient,
  RadialGradient as SvgRadialGradient,
  Rect,
  Stop,
  type SvgProps,
} from 'react-native-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
// Measurement-tool card strips (Booth 2026-08-17): full-width 2:1 SVG previews
// of each tool's display (replaced the old inline icon glyphs). Imported as
// components via react-native-svg-transformer (metro.config.js). The SVGs are
// the design deliverable — do not restyle/re-export them.
import ToolStripSpl from '../../../assets/tool-strips/tool_01_spl_reference_meter_strip.svg';
import ToolStripRta from '../../../assets/tool-strips/tool_02_spectrum_analyzer_rta_strip.svg';
import ToolStripWaveform from '../../../assets/tool-strips/tool_03_waveform_viewer_strip.svg';
import ToolStripSpectrogram from '../../../assets/tool-strips/tool_04_spectrogram_strip.svg';
import ToolStripRt60 from '../../../assets/tool-strips/tool_05_rt60_reverb_decay_strip.svg';
import ToolStripSignalgen from '../../../assets/tool-strips/tool_06_tone_noise_generator_strip.svg';
import ToolStripHzcounter from '../../../assets/tool-strips/tool_07_frequency_counter_tuner_strip.svg';
import ToolStripMultimeter from '../../../assets/tool-strips/tool_08_pro_audio_multimeter_strip.svg';
import { BrandLogo } from '../../components/BrandLogo';
import { GlassButton } from '../../components/GlassButton';
import { NavIcon, type NavIconName } from '../../components/nav/NavIcon';
import { useEntitlement } from '../../features/commercial/EntitlementProvider';
import { CONCEPT_MODULES } from '../../features/tools/learn';
import { colors, fonts } from '../../theme/tokens';
import { AccuracyNote } from '../../components/AccuracyNote';
import { toolByKey, type ToolKey } from './toolsData';
// HUB_LIGHT — the hub's ONE light (overhead softbox key + low ambient) and its
// intensity ladder; every lit surface on this screen reads its rungs from it.
// The model itself is written up at the top of TileChassis.tsx.
import { HUB_LIGHT, STRIP_ASPECT, TILE_STRIP_PAD, TILE_TITLE_H, tileLayout } from './TileChassis';
// Live tile previews (owner order 2026-08-19): the hub owns ONE shared mic/DSP
// session + tick (hubPreviewEngine); five tiles redraw their strip artwork from
// live frames, three run labeled scripted demos. All react-native-svg — the
// hub stays Skia-free and web-previewable.
import { useHubPreviewEngine } from './hubPreviewEngine';
import { HUB_LIVE_MINIS, HUB_SKIN_MINIS } from './hubPreviewsLive';
import { animationsAllowed } from '../../features/settings/a11y';
import { HUB_SIM_MINIS } from './hubPreviewsSim';
import {
  fmtDuration,
  getExposureSnapshot,
  subscribeExposure,
  type ExposureSnapshot,
} from '../../features/audio/exposureMonitor';
import type { RootStackParamList } from '../../navigation/types';

const { width: SCREEN_W } = Dimensions.get('window');
// 2-across INSIDE the gray panel: subtract the scroll padding (14×2), the
// panel's border (1×2) + padding (12×2), and the 12px gap between the two tiles.
const TILE_W = Math.floor((SCREEN_W - 14 * 2 - (1 + 12) * 2 - 12) / 2);
const NAV_TABS: NavIconName[] = ['Home', 'Study', 'Achievements', 'Profile'];

/** A card/chip/row RIM under the hub's overhead key (HUB_LIGHT, TileChassis):
 *  the up-facing top edge catches (rung 3), the sides sit in ambient, the
 *  down-facing bottom edge falls into shadow (rung 5). All four sides are set
 *  explicitly so a later `borderColor` override can never leave a stale lit
 *  edge behind — a state that recolours a rim passes all three through here. */
const litRim = (top: string, side: string, bottom: string) => ({
  borderTopColor: top,
  borderLeftColor: side,
  borderRightColor: side,
  borderBottomColor: bottom,
});
/** The dark #121214 cards (hero, training rows) under that key. */
const CARD_RIM = litRim('#3b3c43', '#26262c', '#1b1b1f');

type Props = NativeStackScreenProps<RootStackParamList, 'ToolsHub'>;

/** Live dosimeter readout + the ONE entry into the Listening Exposure Monitor
 *  popup (owner 2026-08-12): the monitor runs silently in the background —
 *  this chip and the 15-minute check-ins are its only surfaces. */
function DosimeterChip({ onOpen }: { onOpen: () => void }) {
  const [snap, setSnap] = useState<ExposureSnapshot>(getExposureSnapshot());
  useEffect(() => subscribeExposure(() => setSnap(getExposureSnapshot())), []);
  const pct = Math.round(snap.todayDose * 100);
  // One rendered time for BOTH the screen-reader label and the visible chip
  // (B-186): fmtDuration(0) is "0 s" but the chip showed "0 min" — unify.
  const shownTime = snap.todayActiveSec > 0 ? fmtDuration(snap.todayActiveSec) : '0 min';
  return (
    <Pressable
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={`Listening exposure: dose ${pct} percent, ${shownTime} today. Open the monitor.`}
      // Warning states recolour the whole rim (a status signal, uniform on
      // purpose) — routed through litRim so the lit top edge never lingers.
      style={[
        styles.dosiChip,
        pct >= 100 && litRim('rgba(255,42,42,.8)', 'rgba(255,42,42,.8)', 'rgba(255,42,42,.8)'),
        pct >= 80 && pct < 100 && litRim('rgba(255,180,0,.7)', 'rgba(255,180,0,.7)', 'rgba(255,180,0,.7)'),
      ]}
    >
      <Text style={styles.dosiLabel}>DOSIMETER</Text>
      <Text style={[styles.dosiValue, pct >= 100 && { color: '#ff6a5e' }]}>
        {`${pct}% · ${shownTime}`}
      </Text>
      <Text style={styles.dosiOpen}>OPEN ›</Text>
    </Pressable>
  );
}

/** Tile display order (owner 2026-08-17): 2-across, top→down / left→right —
 *  SPL · MultiMeter / Waveform · RTA / Spectrogram · Noise Gen / RT60 · Freq. */
/* Tile Forge (owner 2026-08-23): chassis geometry shared with TileChassis;
   per-tile wear seeds are stable so each tile's grit/scratch never shift. */
const TILE_L = tileLayout(TILE_W);
const CHASSIS_SEED: Partial<Record<ToolKey, number>> = {
  spl: 11, multimeter: 23, waveform: 37, rta: 51, spectrogram: 61, signalgen: 71, rt60: 83, hzcounter: 97,
};

/**
 * POWER-ON personas (owner 2026-09-01; spec + hardware research at
 * docs/APE_HUB_POWERON_SPEC_2026_09_01.md). Each display powers on like the
 * hardware its tool implies — a VU lamp warms, a CRT blooms with overshoot, an
 * LED ladder strikes, a VFD runs its segment-test blink, a CCFL stutters then
 * ramps. Two pure-opacity layers on the native driver: `lit` (the content
 * block over the dark cap = the backlight) and `bloom` (a tinted flash
 * overlay). HONESTY (§1.7): only glass/backlight opacity animates — live
 * minis still gate on real frames, sims keep their DEMO tags, needles rest.
 * Stagger: 180 ms per tile in reading order ± a deterministic ±45 ms jitter
 * from CHASSIS_SEED, so the rack sequences up the same way every open.
 * REAL-TIME pass (owner 2026-09-01 v2: the first cut settled in ~1 s and
 * read as nothing) — durations now sit at hardware scale: lamps warm over
 * ~2 s, the CCFL brightens over ~2.3 s, the whole rack takes ~3.5 s to reach
 * full readiness. Tiles are interactive the entire time.
 */
type PowerStep = { to: number; ms: number; ease?: (v: number) => number };
type Persona = { lit: PowerStep[]; bloom?: { color: string; steps: PowerStep[] } };
const POWER_PERSONA: Record<string, Persona> = {
  // VU lamp warm-up: strikes first, glows to full LAST — analog warms while
  // digital snaps on.
  spl: {
    lit: [{ to: 1, ms: 2000, ease: Easing.inOut(Easing.quad) }],
    bloom: { color: 'rgba(255,190,120,1)', steps: [{ to: 0.1, ms: 900 }, { to: 0, ms: 1000 }] },
  },
  // DSP LCD boot: fast ramp, one-frame dip as the driver locks.
  multimeter: {
    lit: [{ to: 0.85, ms: 400, ease: Easing.out(Easing.quad) }, { to: 0.7, ms: 120 }, { to: 1, ms: 350, ease: Easing.out(Easing.quad) }],
    bloom: { color: 'rgba(200,225,255,1)', steps: [{ to: 0.3, ms: 100 }, { to: 0, ms: 160 }] },
  },
  // CRT bloom: brightness overshoot that settles — the classic scope power-on.
  waveform: {
    lit: [{ to: 1, ms: 900, ease: Easing.out(Easing.cubic) }],
    bloom: { color: 'rgba(210,235,255,1)', steps: [{ to: 0.45, ms: 500, ease: Easing.out(Easing.cubic) }, { to: 0, ms: 1100, ease: Easing.in(Easing.quad) }] },
  },
  // LED ladder strike: snappiest of the rack.
  rta: { lit: [{ to: 1, ms: 150 }, { to: 0.55, ms: 100 }, { to: 1, ms: 200 }] },
  // Modern TFT: one clean luminance ramp, no drama.
  spectrogram: { lit: [{ to: 1, ms: 1200, ease: Easing.inOut(Easing.sin) }] },
  // VFD segment test: rapid all-segments blinks before data.
  signalgen: {
    lit: [{ to: 1, ms: 130 }, { to: 0.25, ms: 180 }, { to: 1, ms: 130 }, { to: 0.35, ms: 150 }, { to: 1, ms: 280 }],
    bloom: { color: 'rgba(140,255,230,1)', steps: [{ to: 0.08, ms: 60 }, { to: 0, ms: 90 }] },
  },
  // CCFL strike + ramp: stutter, then the tube brightens.
  rt60: { lit: [{ to: 0.6, ms: 500 }, { to: 0.5, ms: 220 }, { to: 0.75, ms: 250 }, { to: 1, ms: 1300, ease: Easing.out(Easing.quad) }] },
  // Tuner display blink.
  hzcounter: {
    lit: [{ to: 1, ms: 180 }, { to: 0.6, ms: 130 }, { to: 1, ms: 230 }],
    bloom: { color: 'rgba(140,255,230,1)', steps: [{ to: 0.06, ms: 40 }, { to: 0, ms: 60 }] },
  },
};
// Global tempo for the whole power-up (owner 2026-09-01: +13% slower after
// the real-time pass). One dial: durations AND stagger both scale by it.
const POWER_TIME_SCALE = 1.13;
const powerSeq = (v: Animated.Value, steps: PowerStep[]) =>
  Animated.sequence(steps.map((st) => Animated.timing(v, { toValue: st.to, duration: Math.round(st.ms * POWER_TIME_SCALE), easing: st.ease ?? Easing.linear, useNativeDriver: true })));

const TILE_ORDER: ToolKey[] = [
  'spl',
  'multimeter',
  'waveform',
  'rta',
  'spectrogram',
  'signalgen',
  'rt60',
  'hzcounter',
];

/** Tool → card-strip component (2:1 SVG preview of the tool's display). */
const TOOL_STRIP: Record<ToolKey, FC<SvgProps>> = {
  spl: ToolStripSpl,
  rta: ToolStripRta,
  waveform: ToolStripWaveform,
  spectrogram: ToolStripSpectrogram,
  rt60: ToolStripRt60,
  signalgen: ToolStripSignalgen,
  hzcounter: ToolStripHzcounter,
  multimeter: ToolStripMultimeter,
};

/** Screen-reader description per strip (strips carry zero glyphs — Booth §6). */
const STRIP_LABEL: Record<ToolKey, string> = {
  spl: 'SPL reference meter: analogue VU meter with needle beside a segmented LED level ladder',
  rta: 'Spectrum analyser: thirty-one frequency bands as vertical bars with peak-hold markers',
  waveform: 'Waveform viewer: oscilloscope waveform around a centre zero line',
  spectrogram: 'Spectrogram: frequency content over time as a colour heat map',
  rt60: 'RT60 reverb decay: decay curve falling to a noise floor with a fitted decay line',
  signalgen: 'Tone and noise generator: a sine wave giving way to broadband noise',
  hzcounter: 'Frequency counter and tuner: tuning meter with a needle reading off centre',
  multimeter: 'Pro audio multimeter: combined level bar, spectrum, spectrogram and oscilloscope',
};

/** Full-width 2:1 strip that replaces the old icon well above each tile title.
 *  Now the tile's DISPLAY (owner 2026-08-19): the three demo tools render their
 *  scripted animated preview; the five mic tools render the static artwork as
 *  the resting state with the live mini fading in over it while frames flow —
 *  absent/spike/denied engines simply rest on the art (no fake meters, §1.7). */
function ToolStrip({ tool, live, active, ready, index }: { tool: ToolKey; live: boolean; active: boolean; ready: boolean; index: number }) {
  const Strip = TOOL_STRIP[tool];
  const Sim = HUB_SIM_MINIS[tool];
  const Live = HUB_LIVE_MINIS[tool];
  // Always-on skinned display (SPL): its own photoreal face replaces the static
  // artwork in every state (needle rests when there's no live signal).
  const Skin = HUB_SKIN_MINIS[tool];
  // POWER-ON (owner 2026-09-01): the deferred-ready mount becomes the rack
  // sequencing up — see POWER_PERSONA above. `lit` is the backlight; `bloom`
  // the strike/overshoot flash. One-shot (ran guard survives HMR re-renders);
  // reduced motion falls back to exactly the old 260 ms fade, no stagger.
  const lit = useRef(new Animated.Value(0)).current;
  const bloom = useRef(new Animated.Value(0)).current;
  const ran = useRef(false);
  useEffect(() => {
    if (!ready || ran.current) return;
    ran.current = true;
    if (!animationsAllowed()) {
      Animated.timing(lit, { toValue: 1, duration: 260, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
      return;
    }
    const persona = POWER_PERSONA[tool] ?? { lit: [{ to: 1, ms: 260, ease: Easing.out(Easing.quad) }] };
    const seed = CHASSIS_SEED[tool] ?? 1;
    const start = Math.round(Math.max(0, index * 180 + ((seed % 91) - 45)) * POWER_TIME_SCALE);
    const parts = [powerSeq(lit, persona.lit)];
    if (persona.bloom) parts.push(powerSeq(bloom, persona.bloom.steps));
    Animated.sequence([Animated.delay(start), Animated.parallel(parts)]).start();
  }, [ready, tool, index, lit, bloom]);
  // Fast back-nav mid-sequence: stop cleanly on unmount only.
  useEffect(() => () => { lit.stopAnimation(); bloom.stopAnimation(); }, [lit, bloom]);
  return (
    <View style={styles.tileStrip} pointerEvents="none">
      {/* Inner keeps the strip's true 2:1 so it's never distorted; the outer
          2.5:1 crop (overflow hidden) trims only the safe top/bottom margin. */}
      <View style={styles.tileStripInner}>
        {/* Displays are DEFERRED until after the open transition (owner 2026-08-19
            perf): the heavy SVG art / skin PNG / minis would otherwise render
            synchronously during navigation and stall the screen from opening.
            Until ready the tile shows its dark screen (reads as "powering on"). */}
        {ready && (
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: lit }]}>
            {Skin ? (
              <View style={StyleSheet.absoluteFill} accessibilityRole="image" accessibilityLabel={STRIP_LABEL[tool]}>
                <Skin />
              </View>
            ) : Sim ? (
              <View
                style={StyleSheet.absoluteFill}
                accessibilityRole="image"
                accessibilityLabel={`${STRIP_LABEL[tool]} (animated demonstration)`}
              >
                <Sim active={active} />
              </View>
            ) : (
              <>
                <Strip
                  width="100%"
                  height="100%"
                  accessibilityRole="image"
                  accessibilityLabel={STRIP_LABEL[tool]}
                />
                {live && Live ? <Live /> : null}
              </>
            )}
          </Animated.View>
        )}
      </View>
      {/* Power-on strike/overshoot flash — pure opacity, rests at 0 forever
          after the sequence; glass sheen above stays on top (physically the
          flash is IN the display, under the glass). */}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: (POWER_PERSONA[tool]?.bloom?.color ?? 'transparent'), opacity: bloom }]}
      />
    </View>
  );
}

// Bead-blast GRIT — the same deterministic random particulate the dashboard's
// study-method panels use (BlackFaceBg): a one-time xorshift point cloud stored
// as panel fractions, multiplied into pixel space so each speck stays a round
// dot at any size (no tiling, no streaks). Copied to match exactly.
const GRIT_SPECKS = (() => {
  let s = 0x2545f491 >>> 0;
  const rnd = () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 1_000_000) / 1_000_000;
  };
  const out: { fx: number; fy: number; r: number; light: boolean; a: number }[] = [];
  for (let i = 0; i < 130; i++) {
    out.push({ fx: rnd(), fy: rnd(), r: 0.45 + rnd() * 0.7, light: rnd() > 0.5, a: 0.05 + rnd() * 0.09 });
  }
  return out;
})();

/* ───────────────────────── PANEL PATINA (owner 2026-09-05) ─────────────────
 * "Tarnish and add patina to the surround gray panel … like the user has it in
 * front of them." The blank is the dashboard's gray (same coat, same 130-speck
 * grit) but it has LIVED IN A RACK: uneven anodising, chalky oxidation haze up
 * top, darker handling near the displays and across the lower half, a few
 * scuffs, three hairline scratches, finer bead-blast in the exposed metal — and
 * every raised glass casts its soft shadow DOWN onto the panel under the hub's
 * one overhead key (TileChassis HUB_LIGHT). Everything is generated ONCE per
 * panel size from a fixed xorshift seed, so the wear never shifts between
 * launches, and it is painted only into the metal that actually shows (the
 * outer margin and the gutters between tiles) so the node count stays low.
 * Device-scale rules: nothing under 1px, no mark under ~0.08 alpha; soft
 * gradients may fade to 0 (they are tone, not marks). */
const PANEL_PAD = 12; // styles.panel padding
const GRID_GAP = 12; // styles.grid gap
const TILE_RADIUS = 10; // styles.tileFrame borderRadius
const TILE_DROP_H = 6; // px the glass's shadow falls onto the panel below it

type PRect = { x: number; y: number; w: number; h: number };
type Blotch = { cx: number; cy: number; rx: number; ry: number; rot: number; kind: 'dark' | 'light' | 'warm' };
type Mark = { x1: number; y1: number; x2: number; y2: number; a: number; light: boolean };
type Speck = { cx: number; cy: number; r: number; a: number; light: boolean };
type Patina = { tiles: PRect[]; blotches: Blotch[]; scuffs: Mark[]; scratches: Mark[]; specks: Speck[] };

/** Same xorshift the grit uses, on its own seed — the wear is its own cloud. */
function seededRnd(seed: number) {
  let s = seed >>> 0;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 1_000_000) / 1_000_000;
  };
}

function buildPatina(w: number, h: number): Patina {
  const rnd = seededRnd(0x9e3779b9);
  const tw = TILE_W;
  const th = TILE_L.totalH;
  // Where the tiles sit (mirrors styles.grid: flex-wrap, gap 12, inside pad 12).
  const cols = Math.max(1, Math.floor((w - 2 * PANEL_PAD + GRID_GAP) / (tw + GRID_GAP)));
  const rows = Math.ceil(TILE_ORDER.length / cols);
  const tiles: PRect[] = TILE_ORDER.map((_, i) => ({
    x: PANEL_PAD + (i % cols) * (tw + GRID_GAP),
    y: PANEL_PAD + Math.floor(i / cols) * (th + GRID_GAP),
    w: tw,
    h: th,
  }));
  const gridRight = PANEL_PAD + cols * tw + (cols - 1) * GRID_GAP;
  const gridBottom = PANEL_PAD + rows * th + (rows - 1) * GRID_GAP;
  // The metal that shows: the margin ring + the gutters between tiles.
  const exposed: PRect[] = [
    { x: 0, y: 0, w, h: PANEL_PAD },
    { x: 0, y: gridBottom, w, h: Math.max(1, h - gridBottom) },
    { x: 0, y: PANEL_PAD, w: PANEL_PAD, h: gridBottom - PANEL_PAD },
    { x: gridRight, y: PANEL_PAD, w: Math.max(1, w - gridRight), h: gridBottom - PANEL_PAD },
  ];
  for (let c = 1; c < cols; c++) exposed.push({ x: PANEL_PAD + c * (tw + GRID_GAP) - GRID_GAP, y: PANEL_PAD, w: GRID_GAP, h: gridBottom - PANEL_PAD });
  for (let r = 1; r < rows; r++) exposed.push({ x: PANEL_PAD, y: PANEL_PAD + r * (th + GRID_GAP) - GRID_GAP, w: gridRight - PANEL_PAD, h: GRID_GAP });
  const area = exposed.reduce((s, r) => s + r.w * r.h, 0);
  // A point in the exposed metal, weighted toward the lower half (hands).
  const pointInExposed = () => {
    let pt = { x: 0, y: 0 };
    for (let tries = 0; tries < 4; tries++) {
      let t = rnd() * area;
      let rect = exposed[exposed.length - 1];
      for (const r of exposed) {
        if (t < r.w * r.h) {
          rect = r;
          break;
        }
        t -= r.w * r.h;
      }
      pt = { x: rect.x + rnd() * rect.w, y: rect.y + rnd() * rect.h };
      if (rnd() < 0.4 + 0.6 * (pt.y / h)) break;
    }
    return pt;
  };
  const seg = (x: number, y: number, len: number, deg: number) => {
    const a = (deg * Math.PI) / 180;
    return { x1: x, y1: y, x2: x + Math.cos(a) * len, y2: y + Math.sin(a) * len };
  };

  // 1 · Oxidation / uneven anodising: big soft ellipses of tone. Chalky light
  //     haze favours the upper half, handling darkness the lower half, plus a
  //     few faintly WARM patches — real tarnish on gray anodising yellows.
  //     Owner 2026-09-05 (second pass, "add more patina"): 26 blotches (was 14),
  //     larger, so the tone varies everywhere the metal shows.
  const blotches: Blotch[] = [];
  for (let i = 0; i < 26; i++) {
    const kind: Blotch['kind'] = i < 5 ? 'warm' : i < 15 ? 'dark' : 'light';
    const upper = kind === 'light' ? rnd() < 0.7 : rnd() < 0.3;
    const cy = upper ? rnd() * h * 0.5 : h * 0.5 + rnd() * h * 0.5;
    const rx = Math.min(w * 0.34, 30 + rnd() * 90);
    blotches.push({ cx: rnd() * w, cy, rx, ry: rx * (0.45 + rnd() * 0.5), rot: rnd() * 180, kind });
  }

  // 2 · Scuffs: short strokes in the exposed metal, most of them near-horizontal
  //     (rack-rail and fingertip drag), heavier low and beside the displays.
  //     Mostly DARK (a light 1px stroke on mid-gray reads as debris at 2-3x),
  //     within ±15° of horizontal, few enough to stay wear rather than noise.
  //     Second pass (owner: "add more patina"): 34 scuffs (was 18), a touch
  //     longer and darker — still near-horizontal, still mostly dark.
  const scuffs: Mark[] = [];
  for (let i = 0; i < 34; i++) {
    const p = pointInExposed();
    const light = rnd() < 0.25;
    const deg = (rnd() - 0.5) * 30;
    scuffs.push({ ...seg(p.x, p.y, 5 + rnd() * 16, deg), a: light ? 0.09 + rnd() * 0.03 : 0.13 + rnd() * 0.07, light });
  }

  // 3 · Three hairline scratches (a rail rub along the bottom margin, a
  //     screwdriver slip down the centre gutter, a drag across a lower gutter).
  const scratches: Mark[] = [];
  scratches.push({ ...seg(w * (0.12 + rnd() * 0.2), h - 4 - rnd() * 5, w * (0.25 + rnd() * 0.25), (rnd() - 0.5) * 2.5), a: 0.14, light: true });
  if (cols > 1) {
    const gx = PANEL_PAD + tw + GRID_GAP / 2 + (rnd() - 0.5) * 6;
    scratches.push({ ...seg(gx, h * (0.3 + rnd() * 0.3), 40 + rnd() * 50, 90 + (rnd() - 0.5) * 8), a: 0.14, light: true });
  }
  if (rows > 1) {
    const gy = PANEL_PAD + (rows - 1) * (th + GRID_GAP) - GRID_GAP / 2 + (rnd() - 0.5) * 6;
    scratches.push({ ...seg(PANEL_PAD + rnd() * w * 0.45, gy, 50 + rnd() * 60, (rnd() - 0.5) * 6), a: 0.14, light: true });
  }
  // Second pass (owner: "add more patina"): two more — a rub along the top
  // margin where the blank meets the rail above it, and a short slip down the
  // right margin.
  scratches.push({ ...seg(w * (0.45 + rnd() * 0.25), 3 + rnd() * 5, w * (0.12 + rnd() * 0.18), (rnd() - 0.5) * 2), a: 0.14, light: true });
  scratches.push({ ...seg(w - PANEL_PAD / 2 + (rnd() - 0.5) * 4, h * (0.55 + rnd() * 0.25), 24 + rnd() * 36, 90 + (rnd() - 0.5) * 10), a: 0.14, light: true });

  // 4 · Finer bead-blast in the exposed metal (the 130 shared specks mostly
  //     land under the tiles).
  //     Second pass (owner: "add more patina"): 160 (was 80), a shade stronger.
  const specks: Speck[] = [];
  for (let i = 0; i < 160; i++) {
    const p = pointInExposed();
    specks.push({ cx: p.x, cy: p.y, r: 0.5 + rnd() * 0.5, a: 0.09 + rnd() * 0.06, light: rnd() > 0.5 });
  }
  return { tiles, blotches, scuffs, scratches, specks };
}

/** PanelFace — the GRAY textured rack-blank the tool cutouts are mounted in.
 *  The dashboard study-method panel face (BlackFaceBg, default method gray):
 *  a medium-gray vertical gradient + bead-blasted grit + a lit top lip and a
 *  shadowed bottom edge, drawn in measured PIXEL space so the specks are round
 *  dots — now AGED (owner 2026-09-05, see PANEL PATINA above) and carrying the
 *  soft shadow each raised glass throws onto it. Decorative; never blocks touches. */
// memo (perf 2026-09-05): the face is ~400 static SVG nodes; it must never
// re-render with the screen (entitlement / engine-state / displaysReady
// changes) — it has no props, so React.memo makes it paint exactly once per
// panel size.
const PanelFace = memo(function PanelFace() {
  const [size, setSize] = useState({ w: 0, h: 0 });
  // The dashboard study-method panel coat, exactly (owner 2026-08-23 —
  // supersedes the 2026-08-17 darkening): BlackFaceBg's default method gray.
  const gradStops = [
    { o: 0, c: '#3a3a3e' },
    { o: 0.42, c: '#46464b' },
    { o: 1, c: '#2c2c30' },
  ];
  const patina = useMemo(() => (size.w > 0 && size.h > 0 ? buildPatina(size.w, size.h) : null), [size.w, size.h]);
  // The glass's shadow on the panel: a rounded rect the tile's own size, shifted
  // down TILE_DROP_H, whose only visible part is the strip below the tile —
  // dark where it meets the cut edge, gone TILE_DROP_H later. Bounding-box
  // gradient, so one def serves every tile.
  // The shadow ramps in from TILE_RADIUS above the tile's bottom edge (hidden
  // under the tile everywhere but the rounded corners, where it wraps the arc
  // instead of leaving a pale wedge), peaks at the edge, and is gone
  // TILE_DROP_H below it.
  const dropRamp = String(Math.max(0, (TILE_L.totalH - TILE_DROP_H - TILE_RADIUS) / TILE_L.totalH));
  const dropKnee = String(Math.max(0, (TILE_L.totalH - TILE_DROP_H) / TILE_L.totalH));
  const blotchFill: Record<Blotch['kind'], string> = {
    dark: 'url(#apeToolsPatDark)',
    light: 'url(#apeToolsPatLight)',
    warm: 'url(#apeToolsPatWarm)',
  };
  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setSize((p) => (p.w === Math.round(width) && p.h === Math.round(height) ? p : { w: Math.round(width), h: Math.round(height) }));
      }}
    >
      {size.w > 0 && size.h > 0 && patina ? (
        <Svg width={size.w} height={size.h}>
          <Defs>
            <SvgLinearGradient id="apeToolsPanelFace" x1="0" y1="0" x2="0" y2="1">
              {gradStops.map((st) => (
                <Stop key={st.o} offset={String(st.o)} stopColor={st.c} />
              ))}
            </SvgLinearGradient>
            {/* The softbox blooming in satin metal — one wide, soft lift high on the face. */}
            <SvgRadialGradient id="apeToolsSheen" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor="#fff" stopOpacity={0.08} />
              <Stop offset="1" stopColor="#fff" stopOpacity={0} />
            </SvgRadialGradient>
            <SvgRadialGradient id="apeToolsPatDark" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor="#000" stopOpacity={0.2} />
              <Stop offset="0.55" stopColor="#000" stopOpacity={0.08} />
              <Stop offset="1" stopColor="#000" stopOpacity={0} />
            </SvgRadialGradient>
            <SvgRadialGradient id="apeToolsPatLight" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor="#fff" stopOpacity={0.16} />
              <Stop offset="0.55" stopColor="#fff" stopOpacity={0.07} />
              <Stop offset="1" stopColor="#fff" stopOpacity={0} />
            </SvgRadialGradient>
            <SvgRadialGradient id="apeToolsPatWarm" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor="#9a7d52" stopOpacity={0.18} />
              <Stop offset="1" stopColor="#9a7d52" stopOpacity={0} />
            </SvgRadialGradient>
            <SvgLinearGradient id="apeToolsTileDrop" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#000" stopOpacity={0} />
              <Stop offset={dropRamp} stopColor="#000" stopOpacity={0} />
              <Stop offset={dropKnee} stopColor="#000" stopOpacity={0.3} />
              <Stop offset="1" stopColor="#000" stopOpacity={0} />
            </SvgLinearGradient>
          </Defs>
          <Rect x={0} y={0} width={size.w} height={size.h} fill="url(#apeToolsPanelFace)" />
          <Ellipse cx={size.w / 2} cy={size.h * 0.18} rx={size.w * 0.6} ry={size.h * 0.45} fill="url(#apeToolsSheen)" />
          {/* Oxidation / uneven anodising — tone only. */}
          {patina.blotches.map((b, i) => (
            <Ellipse
              key={`b${i}`}
              cx={b.cx}
              cy={b.cy}
              rx={b.rx}
              ry={b.ry}
              transform={`rotate(${b.rot.toFixed(1)} ${b.cx.toFixed(1)} ${b.cy.toFixed(1)})`}
              fill={blotchFill[b.kind]}
            />
          ))}
          {/* Random particulate specks — round dots at pixel radius (dashboard's cloud). */}
          {GRIT_SPECKS.map((g, i) => (
            <Circle
              key={i}
              cx={g.fx * size.w}
              cy={g.fy * size.h}
              r={g.r}
              fill={g.light ? `rgba(255,255,255,${g.a})` : `rgba(0,0,0,${g.a + 0.03})`}
            />
          ))}
          {/* Finer bead-blast in the exposed metal. */}
          {patina.specks.map((g, i) => (
            <Circle key={`s${i}`} cx={g.cx} cy={g.cy} r={g.r} fill={g.light ? `rgba(255,255,255,${g.a.toFixed(3)})` : `rgba(0,0,0,${g.a.toFixed(3)})`} />
          ))}
          {/* Scuffs. */}
          {patina.scuffs.map((m, i) => (
            <Line
              key={`m${i}`}
              x1={m.x1}
              y1={m.y1}
              x2={m.x2}
              y2={m.y2}
              stroke={m.light ? `rgba(255,255,255,${m.a.toFixed(3)})` : `rgba(0,0,0,${m.a.toFixed(3)})`}
              strokeWidth={1}
              strokeLinecap="round"
            />
          ))}
          {/* Hairline scratches under the overhead key: the groove's up-facing
              lower wall catches (bright line), its upper wall shadows (dark
              line 1px above) — the same physics as every lip on this screen. */}
          {patina.scratches.map((m, i) => (
            <Line key={`sc${i}`} x1={m.x1} y1={m.y1 - 1} x2={m.x2} y2={m.y2 - 1} stroke="rgba(0,0,0,0.16)" strokeWidth={1} strokeLinecap="round" />
          ))}
          {patina.scratches.map((m, i) => (
            <Line key={`sl${i}`} x1={m.x1} y1={m.y1} x2={m.x2} y2={m.y2} stroke={`rgba(255,255,255,${m.a})`} strokeWidth={1} strokeLinecap="round" />
          ))}
          {/* Each raised glass sits proud of the panel: a soft shadow falls onto
              the metal below it (the key is above and slightly in front), and a
              1px contact occlusion hugs the whole cut (ambient, all round). */}
          {patina.tiles.map((t, i) => (
            <Rect key={`d${i}`} x={t.x} y={t.y + TILE_DROP_H} width={t.w} height={t.h} rx={TILE_RADIUS} fill="url(#apeToolsTileDrop)" />
          ))}
          {patina.tiles.map((t, i) => (
            <Rect key={`o${i}`} x={t.x} y={t.y} width={t.w} height={t.h} rx={TILE_RADIUS} fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth={2} />
          ))}
          {/* The blank's up-facing top lip catches the overhead key (rung 3);
              its down-facing bottom edge falls into shadow (rung 5). Full 1px
              strokes on half-pixel centres so they stay crisp on the phone. */}
          <Line x1={0} y1={0.5} x2={size.w} y2={0.5} stroke={HUB_LIGHT.lip} strokeWidth={1} />
          <Line x1={0} y1={size.h - 0.5} x2={size.w} y2={size.h - 0.5} stroke={HUB_LIGHT.lipShadow} strokeWidth={1} />
        </Svg>
      ) : null}
    </View>
  );
});

/** Smoked-glass display overlay over each tool tile (owner 2026-08-17).
 *  Re-lit 2026-09-05 under the hub's ONE overhead key (HUB_LIGHT, TileChassis):
 *  the softbox reflects in the glass as a soft horizontal band across its top
 *  — the same band, in the same place, on every tile — with one 1px edge
 *  specular where the glass meets the lip. The old diagonal top-left sweep
 *  (the dashboard GlassScreen's corner light) was the one surface on the hub
 *  lit from somewhere else; it is gone. Decorative; never blocks touches.
 *  Bottom dim held at 0.12 (owner 2026-08-17: the dim was too heavy). */
function TileGlass() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={styles.glassTint} />
      {/* The ONE reflection: the softbox as a band across the top of the slab —
          near-flat while the softbox's face fills the glass, then its diffused
          lower edge rolls off between ~28% and 48% — and below it the smoked
          glass falls into its own dim toward the bottom (polish pass
          2026-09-05: brighter core, a real shoulder instead of a straight ramp). */}
      <LinearGradient
        colors={[
          'rgba(255,255,255,0.18)',
          'rgba(255,255,255,0.155)',
          'rgba(255,255,255,0.09)',
          'rgba(255,255,255,0.025)',
          'rgba(255,255,255,0)',
          'rgba(0,0,0,0.04)',
          'rgba(0,0,0,0.13)',
        ]}
        locations={[0, 0.1, 0.28, 0.42, 0.5, 0.74, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* The bevel's second step: a real ground facet is not one line — just
          inside the specular top edge the glass's thickness catches the key
          again, fainter (rung 1 recessed); at the bottom its thickness reads
          as a hair of shadow inside the edge. Both live in the bevel, not the
          display. */}
      <View style={styles.glassFacetTop} />
      <View style={styles.glassFacetBottom} />
    </View>
  );
}

const TILE_SINK = 1; // px the display sinks when pressed (a subtle recess, owner 2026-08-17)

/** One tool tile as a pressable panel display — sinks into its recess with a
 *  haptic click, lights up (powers on) on press, then exits after a beat, the
 *  same hardware feel as the dashboard SwitchButtons (owner 2026-08-17). */
// memo (perf 2026-09-05): eight tiles, each with a Pressable, two Animated
// values, a gradient overlay and a live/sim display — a hub re-render must not
// re-render them. `onActivate` is a stable callback (useCallback in the hub)
// so the memo actually holds.
const ToolTile = memo(function ToolTile({
  tool,
  name,
  planned,
  live,
  active,
  ready,
  index,
  onActivate,
}: {
  tool: ToolKey;
  name: string;
  planned?: boolean;
  live: boolean;
  active: boolean;
  ready: boolean;
  /** Reading-order position — drives the power-on stagger. */
  index: number;
  onActivate: (tool: ToolKey) => void;
}) {
  const sink = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const busy = useRef(false);

  const animateIn = () =>
    Animated.parallel([
      Animated.timing(sink, { toValue: 1, duration: 90, useNativeDriver: true }),
      Animated.timing(glow, { toValue: 1, duration: 170, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
  const animateOut = () =>
    Animated.parallel([
      Animated.timing(sink, { toValue: 0, duration: 140, useNativeDriver: true }),
      Animated.timing(glow, { toValue: 0, duration: 240, easing: Easing.in(Easing.quad), useNativeDriver: true }),
    ]).start();

  const onIn = () => {
    if (busy.current) return;
    // (The touch-down "Rigid" impact used here since 2026-08-17 was not felt
    // on the owner's iPhone — 2026-09-05: "it should have the haptic tick like
    // the others… I did not feel it." The tick now fires on the confirmed
    // press in activate(), the way the tool keys do; touch-down only sinks.)
    animateIn();
  };
  // On a real tap onPress sets busy + navigates; a cancelled press just reverts.
  const onOut = () => {
    setTimeout(() => {
      if (!busy.current) animateOut();
    }, 60);
  };
  const activate = () => {
    if (busy.current) return;
    busy.current = true;
    markToolTap(tool);
    // The haptic TICK every tool key gives on selection (owner 2026-09-05) —
    // on the confirmed press, so it lands even when a touch-down impact would
    // not (iOS). Same call as the rack dock keys and the Section headers.
    if (hapticsEnabled()) Haptics.selectionAsync().catch(() => {});
    // Hold the sunk + illuminated state a beat so the "power on" reads, then exit.
    // Perf (rev 22): trimmed 190→90 ms — still reads as a power-on tap but halves
    // the fixed latency before navigation starts.
    setTimeout(() => {
      markToolNavigate(tool);
      onActivate(tool);
      sink.setValue(0);
      glow.setValue(0);
      busy.current = false;
    }, 90);
  };

  const translateY = sink.interpolate({ inputRange: [0, 1], outputRange: [0, TILE_SINK] });

  return (
    <Pressable
      onPress={activate}
      onPressIn={onIn}
      onPressOut={onOut}
      accessibilityRole="button"
      accessibilityLabel={name}
      style={styles.tileFrame}
    >
      {/* THE TILE IS THE SCREEN (owner 2026-09-05, see TileChassis.tsx): the
          Pressable is the true-black RECESS cut into the panel (its 1px rim is
          the panel's lip — bottom edge lit, top edge in shadow, under the
          overhead key). Inside it, ONE raised, bevelled GLASS holds the title
          band and the animated display behind the same surface; it is the
          only part that sinks on press. */}
      {/* The cut has thickness. Under the overhead key the hole's top wall
          faces down — the crevice the lip casts into the recess (rung 6),
          seen down the top gap and a hair more as the glass sinks — while its
          bottom wall faces UP and catches the key down the bottom gap (rung 3,
          graded: brightest at the lip, gone by the glass). Both sit UNDER the
          glass so the slab's own bevel is never darkened. */}
      <LinearGradient pointerEvents="none" colors={[HUB_LIGHT.crevice, 'rgba(0,0,0,0)']} style={styles.tileCavityTop} />
      <LinearGradient pointerEvents="none" colors={['rgba(255,255,255,0)', HUB_LIGHT.wall]} style={styles.tileCavityBottom} />
      <Animated.View style={[styles.glass, { transform: [{ translateY }] }]}>
        {/* Title band — part of the display, behind the glass, above the art. */}
        <View style={styles.glassTitleBand}>
          <Text style={styles.glassTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.62}>
            {name.toUpperCase()}
          </Text>
        </View>
        <View style={styles.stripWrap}>
          <ToolStrip tool={tool} live={live} active={active} ready={ready} index={index} />
        </View>
        <TileGlass />
        {/* Illumination — the screen powers on (glow ramps up) when pressed. */}
        <Animated.View pointerEvents="none" style={[styles.tileGlowLight, { opacity: glow }]} />
        {planned && (
          <View style={styles.comingChip}>
            <Text style={styles.comingChipText}>COMING</Text>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
});

export function ToolsHubScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { isMember } = useEntitlement();
  // ONE shared mic/DSP session + tick for the live tile previews (owner
  // 2026-08-19). Auto-starts on entry (OS permission prompt on first visit),
  // force-stops on blur/background, resumes on return; 'denied' rests the live
  // tiles on their static artwork without re-prompting.
  const hubPreview = useHubPreviewEngine();
  // ONE stable open handler for all eight tiles (so the memoised tiles never
  // re-render on a hub re-render). The Frequency Counter and the MultiMeter
  // have their own full live screens (each owns its useToolUsage telemetry);
  // the rest open their educational info screen (Booth 2026-07-18; MultiMeter
  // owner spec 2026-07-29). The hub's preview mic is released BEFORE
  // navigating so the tool's own engine session never races the hub teardown
  // (single native session, no refcount — hubPreviewEngine header).
  const { stopForNavigation } = hubPreview;
  const openTool = useCallback(
    (key: ToolKey) => {
      stopForNavigation();
      if (key === 'hzcounter') navigation.navigate('FrequencyCounter');
      else if (key === 'multimeter') navigation.navigate('MultiMeter');
      else navigation.navigate('ToolInfo', { toolKey: key });
    },
    [stopForNavigation, navigation],
  );
  // Defer the tile displays until the open transition finishes so the heavy SVG
  // art / skin PNG / minis never render synchronously during navigation (owner
  // 2026-08-19: the screen was slow to open). The frame + titles paint instantly;
  // the displays fill a beat later.
  const [displaysReady, setDisplaysReady] = useState(false);
  useEffect(() => {
    let done = false;
    const finish = () => {
      if (!done) {
        done = true;
        setDisplaysReady(true);
      }
    };
    // Prefer "after the open transition"; a timeout GUARANTEES the displays
    // still appear even if no interaction handle ever resolves.
    const handle = InteractionManager.runAfterInteractions(finish);
    const t = setTimeout(finish, 350);
    return () => {
      handle.cancel();
      clearTimeout(t);
    };
  }, []);
  // Saved Measurements + Measurement Training are Academy-only (owner
  // 2026-08-05) — free accounts see them grayed + locked → Paywall. Gate on
  // entitlement, not caps (matches the AudioLearning training gate) — now via
  // the shared provider isMember (real standing; see EntitlementProvider).
  return (
    <View style={styles.root}>
      <View style={{ paddingTop: insets.top + 10, flex: 1 }}>
        {/* Header — back + brand, TOOLS module tag right. */}
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
            <Text style={styles.back}>‹</Text>
          </Pressable>
          {/* Tapping the logo returns to Course Select (Booth 2026-07-11).
              popTo, not navigate: under React Navigation 7 navigate('Main')
              PUSHES a second tab shell on top of the hub (leaving this hub and
              its mic-preview engine mounted); popTo returns to the existing Main. */}
          <Pressable
            onPress={() => navigation.popTo('Main', { screen: 'Home' } as never)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Back to course selection"
          >
            <BrandLogo size={40} />
          </Pressable>
          <View style={{ flexShrink: 1 }}>
            <Text style={styles.wordmark}>
              Pro Audio <Text style={styles.wordmarkAccent}>Training Academy</Text>
            </Text>
            <Text style={styles.eyebrow}>PROFESSIONAL AUDIO TOOLS</Text>
          </View>
          <View style={{ flex: 1 }} />
          {/* GLOSSARY key, like the other screens (Booth 2026-07-11). */}
          <View style={{ width: 96 }}>
            <GlassButton
              label="GLOSSARY"
              tint="blue"
              height={38}
              fontSize={13}
              onPress={() =>
                navigation.popTo('Main', { screen: 'Study', params: { screen: 'Glossary' } } as never)
              }
            />
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Hero — the module masthead (art can layer in later). */}
          <View style={styles.hero}>
            {/* The hero's diffuse face under the overhead key (rung 4): a hair
                lighter at the top, falling toward the bottom — the same
                falloff the tile faces and the panel show. */}
            <LinearGradient
              pointerEvents="none"
              colors={['#17171a', '#111113']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            {/* Accuracy ⓘ — top-right corner of the hero, above the dosimeter
                (owner 2026-08-17; moved out of the screen header). */}
            <AccuracyNote compact style={styles.heroAccuracy} />
            <Text style={styles.heroEyebrow}>AUDIO MEASUREMENT TOOLS</Text>
            {/* Title row: title LEFT, dosimeter readout + open control RIGHT
                (owner 2026-08-12) — the ONE place the user interacts with the
                Listening Exposure Monitor's readings and settings. */}
            <View style={styles.heroTitleRow}>
              <Text style={styles.heroTitle}>Measurement{'\n'}& Analysis</Text>
              <DosimeterChip onOpen={() => navigation.navigate('ExposureMonitor')} />
            </View>
            <View style={styles.heroRule} />
          </View>

          {/* The 8 tools sit as recessed cutouts in ONE gray panel (owner
              2026-08-17): the panel's gray metal shows in the gaps between tiles
              and around the grid, and each tile's black cut-edge + glass makes it
              read as a display poking through from behind. */}
          <View style={styles.panelShadow}>
            <View style={styles.panel}>
              <PanelFace />
              <View style={styles.grid}>
              {TILE_ORDER.map(toolByKey).map((t, i) => (
                <ToolTile
                  key={t.key}
                  index={i}
                  tool={t.key}
                  name={t.name}
                  planned={t.planned}
                  live={hubPreview.engineLive}
                  active={hubPreview.active}
                  ready={displaysReady}
                  onActivate={openTool}
                />
              ))}
              </View>
            </View>
          </View>

          {/* Saved Measurement Library — Academy-only (owner 2026-08-05). Free
              accounts see it grayed + locked; a tap routes to the Paywall. */}
          <Pressable
            style={[styles.libraryRow, !isMember && styles.lockedRow]}
            onPress={() => (isMember ? navigation.navigate('ToolLibrary', undefined) : navigation.navigate('Paywall'))}
            accessibilityRole="button"
            accessibilityLabel={isMember ? 'Saved measurements' : 'Saved measurements — Academy membership required'}
          >
            <Text style={[styles.libraryRowText, !isMember && styles.lockedText]}>
              {!isMember ? '🔒 ' : ''}SAVED MEASUREMENTS
            </Text>
            <Text style={[styles.trainingChevron, !isMember && styles.lockedText]}>›</Text>
          </Pressable>
          {!isMember && <Text style={styles.lockedNote}>🔒 Academy membership required.</Text>}

          {/* Measurement-training concept modules — Academy-only (owner
              2026-08-05). Free accounts see the section + every link grayed +
              locked; taps route to the Paywall. */}
          {CONCEPT_MODULES.length > 0 && (
            <>
              <Text style={styles.trainingHead}>MEASUREMENT TRAINING</Text>
              <View style={styles.trainingList}>
                {CONCEPT_MODULES.map((m) => (
                  <Pressable
                    key={m.key}
                    style={[styles.trainingRow, !isMember && styles.lockedRow]}
                    onPress={() =>
                      isMember
                        ? navigation.navigate('ConceptModule', { conceptKey: m.key })
                        : navigation.navigate('Paywall')
                    }
                    accessibilityRole="button"
                    accessibilityLabel={isMember ? m.title : `${m.title} — Academy membership required`}
                  >
                    <Text style={[styles.trainingNum, !isMember && styles.lockedText]}>
                      {!isMember ? '🔒' : String(m.num).padStart(2, '0')}
                    </Text>
                    <Text style={[styles.trainingTitle, !isMember && styles.lockedText]} numberOfLines={1}>
                      {m.title}
                    </Text>
                    <Text style={[styles.trainingChevron, !isMember && styles.lockedText]}>›</Text>
                  </Pressable>
                ))}
              </View>
              {!isMember && <Text style={styles.lockedNote}>🔒 Academy membership required.</Text>}
            </>
          )}
        </ScrollView>
      </View>

      {/* Bottom nav — this screen lives outside MainTabs, so we render our own
          bar routing back into the tabs (Booth 2026-07-11). */}
      <LinearGradient
        colors={['#1b1b1b', '#0d0d0d']}
        style={[styles.navBar, { paddingBottom: insets.bottom }]}
      >
        <View style={styles.navRow}>
          {NAV_TABS.map((name) => (
            <Pressable
              key={name}
              style={styles.navItem}
              accessibilityRole="tab"
              accessibilityState={{ selected: false }}
              // SR label matches the VISIBLE text -- the tab draws "PROGRESS"
              // while the route is named Achievements (mirror TabBar.tsx).
              accessibilityLabel={name === 'Achievements' ? 'Progress' : name}
              onPress={() => navigation.popTo('Main', { screen: name } as never)}
            >
              <NavIcon icon={name} lit={false} />
            </Pressable>
          ))}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingBottom: 10 },
  back: { fontFamily: fonts.oswaldSemiBold, fontSize: 30, color: colors.textSub, marginTop: -4, paddingRight: 2 },
  wordmark: { fontFamily: fonts.oswaldBold, fontSize: 17, letterSpacing: 0.4, color: colors.textPrimary },
  wordmarkAccent: {
    fontFamily: fonts.oswaldMedium,
    color: colors.amber,
    textShadowColor: 'rgba(255,180,0,.4)',
    textShadowRadius: 8,
    textShadowOffset: { width: 0, height: 0 },
  },
  eyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 9, letterSpacing: 2.2, color: '#7a7a7a', marginTop: 2 },
  moduleTag: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 12,
    letterSpacing: 1.6,
    color: '#5bb0ff',
    borderWidth: 1,
    borderColor: 'rgba(91,176,255,.5)',
    borderRadius: 4.5,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  scroll: { padding: 14, paddingBottom: 24, gap: 10 },

  // Compact hero (Booth 2026-07-11); tightened after the tool count was removed
  // (owner 2026-08-17).
  // Lit 2026-09-05 under the hub's overhead key: lit top rim, shadowed bottom
  // rim (CARD_RIM), a top→bottom diffuse face (the LinearGradient child —
  // hence overflow hidden; the ⓘ opens a Modal, so nothing here is clipped).
  hero: {
    borderRadius: 12,
    borderWidth: 1,
    ...CARD_RIM,
    backgroundColor: '#121214',
    overflow: 'hidden',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 11,
    gap: 4,
  },
  heroAccuracy: { position: 'absolute', top: 10, right: 14, zIndex: 2 },
  heroEyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 2.2, color: colors.amber },
  heroTitle: { fontFamily: fonts.oswaldMedium, fontSize: 22, lineHeight: 26, color: colors.textPrimary },
  heroTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  // Dosimeter readout chip (owner 2026-08-12) — right of the hero title.
  // Same overhead key as the hero it sits in: lit top rim, shadowed bottom.
  dosiChip: {
    borderRadius: 9,
    borderWidth: 1,
    ...litRim('#41424a', '#2c2c33', '#1e1e23'),
    backgroundColor: '#131316',
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: 'flex-end',
    gap: 1,
  },
  dosiLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 8.5, letterSpacing: 1.4, color: colors.textSub },
  dosiValue: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 0.5, color: colors.textPrimary },
  dosiOpen: { fontFamily: fonts.oswaldSemiBold, fontSize: 9, letterSpacing: 1.2, color: colors.green },
  heroRule: { width: 40, height: 2, backgroundColor: colors.amber, borderRadius: 1, marginTop: 2 },

  // 2-across tile grid — short enough that all 3 rows fit above the nav without
  // scrolling (not perfect squares, Booth 2026-07-11).
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  // Tile height is now content-driven: a full-width 2:1 strip + the title
  // (Booth 2026-08-17, ruling D-1). This grows each tile ~40% vs the old fixed
  // 104 — approved; the grid now scrolls.
  // THE TILE IS THE SCREEN (owner 2026-09-05). The Pressable is the true-black
  // RECESS the glass sits in — the gap the old tiles showed at the bottom, now
  // all the way round (TILE_GAP). Its 1px rim is the panel's cut lip under the
  // overhead key: the up-facing bottom edge catches (rung 3), the sides sit in
  // ambient, the down-facing top edge is the shadow the panel casts (rung 5) —
  // the light touch that shows the darkness is a hole, not a border.
  tileFrame: {
    width: TILE_W,
    height: TILE_L.totalH,
    borderRadius: TILE_RADIUS,
    borderWidth: 1,
    // Sides at the alpha floor (0.05 downsampled to nothing on the phone).
    ...litRim('rgba(0,0,0,0.55)', 'rgba(255,255,255,0.08)', HUB_LIGHT.lip),
    backgroundColor: '#000',
    padding: TILE_L.gap - 1,
    overflow: 'hidden',
  },
  // The raised, bevelled GLASS — title band + display behind one surface; the
  // only part that sinks on press. Bevel under the overhead key: top edge is
  // the rung-1 specular, sides mid, bottom edge lit only by the bounce off the
  // recess's lit cut-edge beneath it (rung 5-bounce — a shadowed edge that
  // still reads as an edge against the black gap, instead of vanishing into it).
  glass: {
    flex: 1,
    borderRadius: 6,
    borderWidth: 1.5,
    ...litRim(HUB_LIGHT.specular, HUB_LIGHT.lip, HUB_LIGHT.bounce),
    backgroundColor: '#0b0c0e',
    overflow: 'hidden',
  },
  // The bevel's inner facet steps (see TileGlass) — 1px each, in the bevel.
  glassFacetTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: HUB_LIGHT.glassEdge },
  glassFacetBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(0,0,0,0.30)' },
  // Title band — the top of the display, behind the glass (not a plate on a frame).
  glassTitleBand: {
    height: TILE_TITLE_H,
    justifyContent: 'center',
    paddingHorizontal: 10,
    backgroundColor: '#0e1014',
  },
  glassTitle: {
    textAlign: 'center',
    fontFamily: fonts.oswaldMedium,
    fontSize: 12,
    lineHeight: 14,
    letterSpacing: 1.1,
    color: '#d5d9e0',
  },
  // The display art fills the glass edge to edge below the title band — no
  // margin, no "screen within the tile" (owner 2026-09-05: "black borders
  // bookshelving the display… need to be removed").
  stripWrap: { paddingHorizontal: 0, paddingBottom: 0 },
  // The recess's two walls, painted UNDER the glass (no zIndex — the old
  // zIndex 1 laid the crevice over the glass's top bevel and killed its
  // specular): the shadowed top wall, seen down the top gap and revealed a
  // hair more as the glass sinks; the lit bottom wall, filling the bottom gap.
  tileCavityTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 8 },
  tileCavityBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: TILE_L.gap - 1 },
  // Power-on illumination that ramps up on press (lightens/glows the screen).
  // Peak brightness reduced 39% (0.24 → 0.146) per owner 2026-08-17.
  tileGlowLight: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(165,200,255,0.146)' },
  // The gray rack panel the cutouts are mounted in.
  // The outer surrounding panel stays SQUARE-cornered (owner 2026-08-17); only
  // the 8 tiles inside are rounded.
  panel: {
    borderRadius: 0,
    borderWidth: 1,
    borderColor: '#000',
    padding: 12,
    overflow: 'hidden',
  },
  // Wrapper carries the panel's drop shadow (a rounded overflow:hidden view
  // can't cast its own shadow on iOS). Square corners, matching the panel.
  panelShadow: {
    borderRadius: 0,
    backgroundColor: '#0a0a0c',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
      android: { elevation: 8 },
      default: {},
    }),
  },
  // Smoked-glass display overlay parts (re-lit 2026-09-05 — see TileGlass).
  glassTint: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.05)' },
  // (The 1px top glare is gone — the glass's own bevel is the top specular now.)
  // The display is the strip art's PLOT WINDOW (STRIP_VIEWBOX — inside the
  // art's own bezel, below its lit top line), shown edge to edge at its true
  // aspect. No crop any more: the 2.5:1 crop of the old 2:1 canvas was what
  // exposed the bezel's side walls as "black borders" and the plot-top line as
  // a highlight (owner 2026-09-05).
  tileStrip: {
    width: '100%',
    aspectRatio: STRIP_ASPECT,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileStripInner: { width: '100%', aspectRatio: STRIP_ASPECT },
  // Same typeface as the hero "Measurement & Analysis" title (Oswald Medium),
  // just smaller so tiles can be shorter (owner 2026-08-17). Two lines reserved
  // so two-up rows stay aligned regardless of title wrap.
  comingChip: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(215,224,234,.5)',
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  comingChipText: { fontFamily: fonts.oswaldSemiBold, fontSize: 9, letterSpacing: 1.4, color: '#d7e0ea' },
  // Saved-measurement library row (Phase 2).
  // Its cyan rim sits under the same overhead key: the top edge catches a
  // lighter cyan, the bottom edge falls off (2026-09-05).
  libraryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 10,
    borderWidth: 1,
    ...litRim('rgba(128,230,242,.68)', 'rgba(77,208,225,.45)', 'rgba(77,208,225,.28)'),
    backgroundColor: '#0d1517',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  libraryRowText: { flex: 1, fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.6, color: '#4dd0e1' },
  // Measurement-training (concept modules) section below the tile grid.
  trainingHead: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 12,
    letterSpacing: 2,
    color: colors.amberLabel,
    marginTop: 6,
  },
  trainingList: { gap: 8 },
  trainingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 10,
    borderWidth: 1,
    ...CARD_RIM,
    backgroundColor: '#131316',
    paddingVertical: 11,
    paddingHorizontal: 12,
  },
  trainingNum: { fontFamily: fonts.mono, fontSize: 12, color: colors.textSub },
  trainingTitle: { flex: 1, fontFamily: fonts.oswaldMedium, fontSize: 14, color: colors.textPrimary },
  trainingChevron: { fontFamily: fonts.oswaldSemiBold, fontSize: 20, color: colors.textSub },
  // Bottom nav bar (routes back into MainTabs).
  navBar: { borderTopWidth: 1, borderTopColor: colors.black },
  navRow: { flexDirection: 'row', height: 60 },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  // Academy-locked container/row treatment — grayed steel, muted text.
  // (rim through litRim so the locked steel is still lit from above)
  lockedRow: { ...litRim('#474747', '#3a3a3a', '#2d2d2d'), backgroundColor: '#141414', opacity: 0.6 },
  lockedText: { color: colors.textSub },
  lockedNote: {
    fontFamily: fonts.barlowRegular,
    fontSize: 12.5,
    lineHeight: 17,
    color: colors.textMuted,
    marginTop: -4,
  },
});
