/**
 * ToolsHubScreen — Measurement & Analysis tools dashboard (Booth 2026-07-09v).
 * Reached from the Home carousel's Measurement & Analysis card (left of the
 * Glossary card). Root-stack screen (bottom nav hidden). Lists the five
 * measurement tools with per-tool colored glass keys; each opens its
 * educational info screen (the live engine is Spike 0 — see toolsData notes).
 */
import { useEffect, useRef, useState, type FC } from 'react';
import { Animated, Dimensions, Easing, InteractionManager, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { hapticsEnabled } from '../../features/settings/store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, {
  Circle,
  Defs,
  Line,
  LinearGradient as SvgLinearGradient,
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
import { TileChassis, chassisLayout, PLATE_Y, PLATE_H } from './TileChassis';
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

type Props = NativeStackScreenProps<RootStackParamList, 'ToolsHub'>;

/** Live dosimeter readout + the ONE entry into the Listening Exposure Monitor
 *  popup (owner 2026-08-12): the monitor runs silently in the background —
 *  this chip and the 15-minute check-ins are its only surfaces. */
function DosimeterChip({ onOpen }: { onOpen: () => void }) {
  const [snap, setSnap] = useState<ExposureSnapshot>(getExposureSnapshot());
  useEffect(() => subscribeExposure(() => setSnap(getExposureSnapshot())), []);
  const pct = Math.round(snap.todayDose * 100);
  return (
    <Pressable
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={`Listening exposure: dose ${pct} percent, ${fmtDuration(snap.todayActiveSec)} today. Open the monitor.`}
      style={[styles.dosiChip, pct >= 100 && { borderColor: 'rgba(255,42,42,.8)' }, pct >= 80 && pct < 100 && { borderColor: 'rgba(255,180,0,.7)' }]}
    >
      <Text style={styles.dosiLabel}>DOSIMETER</Text>
      <Text style={[styles.dosiValue, pct >= 100 && { color: '#ff6a5e' }]}>
        {`${pct}% · ${snap.todayActiveSec > 0 ? fmtDuration(snap.todayActiveSec) : '0 min'}`}
      </Text>
      <Text style={styles.dosiOpen}>OPEN ›</Text>
    </Pressable>
  );
}

/** Tile display order (owner 2026-08-17): 2-across, top→down / left→right —
 *  SPL · MultiMeter / Waveform · RTA / Spectrogram · Noise Gen / RT60 · Freq. */
/* Tile Forge (owner 2026-08-23): chassis geometry shared with TileChassis;
   per-tile wear seeds are stable so each tile's grit/scratch never shift. */
const CHASSIS_L = chassisLayout(TILE_W);
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
 * Stagger: 70 ms per tile in reading order ± a deterministic ±23 ms jitter
 * from CHASSIS_SEED, so the rack sequences up the same way every open —
 * research says <50 ms fuses into one gesture, >120 ms reads as lag.
 */
type PowerStep = { to: number; ms: number; ease?: (v: number) => number };
type Persona = { lit: PowerStep[]; bloom?: { color: string; steps: PowerStep[] } };
const POWER_PERSONA: Record<string, Persona> = {
  // VU lamp warm-up: strikes first, glows to full LAST — analog warms while
  // digital snaps on.
  spl: {
    lit: [{ to: 1, ms: 620, ease: Easing.inOut(Easing.quad) }],
    bloom: { color: 'rgba(255,190,120,1)', steps: [{ to: 0.1, ms: 300 }, { to: 0, ms: 320 }] },
  },
  // DSP LCD boot: fast ramp, one-frame dip as the driver locks.
  multimeter: {
    lit: [{ to: 0.85, ms: 140, ease: Easing.out(Easing.quad) }, { to: 0.7, ms: 50 }, { to: 1, ms: 120, ease: Easing.out(Easing.quad) }],
    bloom: { color: 'rgba(200,225,255,1)', steps: [{ to: 0.3, ms: 40 }, { to: 0, ms: 70 }] },
  },
  // CRT bloom: brightness overshoot that settles — the classic scope power-on.
  waveform: {
    lit: [{ to: 1, ms: 320, ease: Easing.out(Easing.cubic) }],
    bloom: { color: 'rgba(210,235,255,1)', steps: [{ to: 0.45, ms: 180, ease: Easing.out(Easing.cubic) }, { to: 0, ms: 380, ease: Easing.in(Easing.quad) }] },
  },
  // LED ladder strike: snappiest of the rack.
  rta: { lit: [{ to: 1, ms: 60 }, { to: 0.55, ms: 40 }, { to: 1, ms: 80 }] },
  // Modern TFT: one clean luminance ramp, no drama.
  spectrogram: { lit: [{ to: 1, ms: 420, ease: Easing.inOut(Easing.sin) }] },
  // VFD segment test: rapid all-segments blinks before data.
  signalgen: {
    lit: [{ to: 1, ms: 50 }, { to: 0.25, ms: 70 }, { to: 1, ms: 50 }, { to: 0.35, ms: 60 }, { to: 1, ms: 110 }],
    bloom: { color: 'rgba(140,255,230,1)', steps: [{ to: 0.08, ms: 25 }, { to: 0, ms: 35 }] },
  },
  // CCFL strike + ramp: stutter, then the tube brightens.
  rt60: { lit: [{ to: 0.6, ms: 180 }, { to: 0.5, ms: 80 }, { to: 0.75, ms: 90 }, { to: 1, ms: 280, ease: Easing.out(Easing.quad) }] },
  // Tuner display blink.
  hzcounter: {
    lit: [{ to: 1, ms: 70 }, { to: 0.6, ms: 50 }, { to: 1, ms: 90 }],
    bloom: { color: 'rgba(140,255,230,1)', steps: [{ to: 0.06, ms: 15 }, { to: 0, ms: 25 }] },
  },
};
const powerSeq = (v: Animated.Value, steps: PowerStep[]) =>
  Animated.sequence(steps.map((st) => Animated.timing(v, { toValue: st.to, duration: st.ms, easing: st.ease ?? Easing.linear, useNativeDriver: true })));

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
    const start = Math.max(0, index * 70 + ((seed % 47) - 23));
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

/** PanelFace — the GRAY textured rack-blank the tool cutouts are mounted in.
 *  A faithful copy of the dashboard study-method panel face (BlackFaceBg,
 *  default method gray): a medium-gray vertical gradient + bead-blasted grit +
 *  a lit top lip and a shadowed bottom edge, drawn in measured PIXEL space so
 *  the specks are round dots. Decorative; never blocks touches. */
function PanelFace() {
  const [size, setSize] = useState({ w: 0, h: 0 });
  // The dashboard study-method panel coat, exactly (owner 2026-08-23 —
  // supersedes the 2026-08-17 darkening): BlackFaceBg's default method gray.
  const gradStops = [
    { o: 0, c: '#3a3a3e' },
    { o: 0.42, c: '#46464b' },
    { o: 1, c: '#2c2c30' },
  ];
  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setSize((p) => (p.w === Math.round(width) && p.h === Math.round(height) ? p : { w: Math.round(width), h: Math.round(height) }));
      }}
    >
      {size.w > 0 && size.h > 0 ? (
        <Svg width={size.w} height={size.h}>
          <Defs>
            <SvgLinearGradient id="apeToolsPanelFace" x1="0" y1="0" x2="0" y2="1">
              {gradStops.map((st) => (
                <Stop key={st.o} offset={String(st.o)} stopColor={st.c} />
              ))}
            </SvgLinearGradient>
          </Defs>
          <Rect x={0} y={0} width={size.w} height={size.h} fill="url(#apeToolsPanelFace)" />
          {/* Random particulate specks — round dots at pixel radius. */}
          {GRIT_SPECKS.map((g, i) => (
            <Circle
              key={i}
              cx={g.fx * size.w}
              cy={g.fy * size.h}
              r={g.r}
              fill={g.light ? `rgba(255,255,255,${g.a})` : `rgba(0,0,0,${g.a + 0.03})`}
            />
          ))}
          {/* Top lit lip + bottom shadow so the panel reads as its own mounted blank. */}
          <Line x1={0} y1={0.6} x2={size.w} y2={0.6} stroke="rgba(255,255,255,0.16)" strokeWidth={0.7} />
          <Line x1={0} y1={size.h - 0.6} x2={size.w} y2={size.h - 0.6} stroke="rgba(0,0,0,0.4)" strokeWidth={0.9} />
        </Svg>
      ) : null}
    </View>
  );
}

/** Dark-gray-glass 3D display overlay — the dashboard GlassScreen look
 *  (smoked tint · vertical sheen→dim · top-left specular · edge glares) applied
 *  over each tool tile (owner 2026-08-17). Decorative; never blocks touches.
 *  Gradient lightened per owner 2026-08-17 — the dim was too heavy. */
function TileGlass() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={styles.glassTint} />
      {/* Vertical sheen → dim: catches light up top, darkens gently toward the bottom. */}
      <LinearGradient
        colors={['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.03)', 'rgba(0,0,0,0.05)', 'rgba(0,0,0,0.12)']}
        locations={[0, 0.5, 0.8, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Ambient specular highlight sweeping from the top-left corner. */}
      <LinearGradient
        colors={['rgba(255,255,255,0.16)', 'rgba(255,255,255,0.04)', 'rgba(255,255,255,0)']}
        locations={[0, 0.35, 0.7]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.75, y: 0.9 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.glassTopGlare} />
      <View style={styles.glassBottomHighlight} />
    </View>
  );
}

const TILE_SINK = 1; // px the display sinks when pressed (a subtle recess, owner 2026-08-17)

/** One tool tile as a pressable panel display — sinks into its recess with a
 *  haptic click, lights up (powers on) on press, then exits after a beat, the
 *  same hardware feel as the dashboard SwitchButtons (owner 2026-08-17). */
function ToolTile({
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
  onActivate: () => void;
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
    // Tactile "click" on touch-down — the exact call the dashboard switches use.
    if (hapticsEnabled()) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid).catch(() => {});
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
    // Hold the sunk + illuminated state a beat so the "power on" reads, then exit.
    // Perf (rev 22): trimmed 190→90 ms — still reads as a power-on tap but halves
    // the fixed latency before navigation starts.
    setTimeout(() => {
      onActivate();
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
      {/* GRAPHITE INSTRUMENT CHASSIS (owner-approved 2026-08-23, Tile Forge):
          machined chamfers, brushed face with per-tile wear, engraved
          nameplate, recess crevice, per-tool hardware rail, corner screws.
          The chassis never moves — only the display cap sinks on press. */}
      <TileChassis tool={tool} w={TILE_W} seed={CHASSIS_SEED[tool] ?? 1} />
      {/* Engraved title — paint-filled into the nameplate (light matte fill,
          dark top shadow); still auto-shrinks to one line. */}
      <Text style={styles.plateTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.62}>
        {name.toUpperCase()}
      </Text>
      {/* The display opening — the RN glass sits exactly on the chassis's
          cut rect; the cap sinks into the SVG-drawn crevice on press. */}
      <View style={styles.displayWell}>
        {/* Static cavity shadow the panel lip casts — revealed as the display sinks. */}
        <LinearGradient pointerEvents="none" colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0)']} style={styles.tileCavityTop} />
        <Animated.View style={[styles.tileCap, { transform: [{ translateY }] }]}>
          <ToolStrip tool={tool} live={live} active={active} ready={ready} index={index} />
          <TileGlass />
          {/* Illumination — the screen powers on (glow ramps up) when pressed. */}
          <Animated.View pointerEvents="none" style={[styles.tileGlowLight, { opacity: glow }]} />
          {planned && (
            <View style={styles.comingChip}>
              <Text style={styles.comingChipText}>COMING</Text>
            </View>
          )}
        </Animated.View>
      </View>
    </Pressable>
  );
}

export function ToolsHubScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { isMember } = useEntitlement();
  // ONE shared mic/DSP session + tick for the live tile previews (owner
  // 2026-08-19). Auto-starts on entry (OS permission prompt on first visit),
  // force-stops on blur/background, resumes on return; 'denied' rests the live
  // tiles on their static artwork without re-prompting.
  const hubPreview = useHubPreviewEngine();
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
          {/* Tapping the logo returns to Course Select (Booth 2026-07-11). */}
          <Pressable
            onPress={() => navigation.navigate('Main', { screen: 'Home' } as never)}
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
                navigation.navigate('Main', { screen: 'Study', params: { screen: 'Glossary' } } as never)
              }
            />
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Hero — the module masthead (art can layer in later). */}
          <View style={styles.hero}>
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
                  // The Frequency Counter and the MultiMeter have their own full
                  // live screens (each owns its useToolUsage telemetry); the rest
                  // open their educational info screen (Booth 2026-07-18;
                  // MultiMeter owner spec 2026-07-29). The hub's preview mic is
                  // released BEFORE navigating so the tool's own engine session
                  // never races the hub teardown (single native session, no
                  // refcount — hubPreviewEngine header).
                  onActivate={() => {
                    hubPreview.stopForNavigation();
                    if (t.key === 'hzcounter') navigation.navigate('FrequencyCounter');
                    else if (t.key === 'multimeter') navigation.navigate('MultiMeter');
                    else navigation.navigate('ToolInfo', { toolKey: t.key });
                  }}
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
              accessibilityRole="button"
              accessibilityLabel={name}
              onPress={() => navigation.navigate('Main', { screen: name } as never)}
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
  hero: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#121214',
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
  dosiChip: {
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#2c2c33',
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
  // Each tile is a CUTOUT in the gray panel (owner 2026-08-17): black cut-edges
  // (thicker top/left shadow, thin bottom line) give the opening real depth. The
  // dark cavity (#040405) shows at the top as the display 'cap' sinks on press.
  // Mirrors the dashboard cutoutMount + SwitchButton cutout.
  // Outer FRAME (owner 2026-08-19, reference image): a 1px black keyline that
  // separates each module from the rack panel, wrapping the metallic bezel.
  // Tile Forge chassis (owner 2026-08-23): the Pressable is a fixed frame the
  // chassis SVG fills; title + display are absolutely placed on its geometry.
  tileFrame: {
    width: TILE_W,
    height: CHASSIS_L.totalH,
  },
  // Engraved nameplate title — paint-filled engraving (light matte fill, dark
  // top shadow) over the chassis plate. Auto-shrinks to one line.
  plateTitle: {
    position: 'absolute',
    top: PLATE_Y + (PLATE_H - 14) / 2,
    left: 16,
    right: 16,
    textAlign: 'center',
    fontFamily: fonts.oswaldMedium,
    fontSize: 12,
    lineHeight: 14,
    letterSpacing: 1.1,
    color: '#c9ccd2',
    textShadowColor: 'rgba(0,0,0,0.85)',
    textShadowOffset: { width: 0, height: -1 },
    textShadowRadius: 0.5,
  },
  // The display opening — positioned exactly on the chassis's cut rect; its
  // dark cavity shows as the cap sinks.
  displayWell: {
    position: 'absolute',
    left: CHASSIS_L.dispX,
    top: CHASSIS_L.dispY,
    width: CHASSIS_L.dispW,
    height: CHASSIS_L.dispH,
    borderRadius: 5,
    backgroundColor: '#040405',
    overflow: 'hidden',
  },
  // The DISPLAY 'cap' — the tool's screen; the only part that travels on press.
  tileCap: { flex: 1, backgroundColor: '#0b0c0e', borderRadius: 5, overflow: 'hidden', padding: 4 },
  // Shadow the panel lip casts into the cavity top, seen when the cap sinks.
  tileCavityTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 8 },
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
  // Dark-gray-glass 3D display overlay parts (mirrors the dashboard GlassScreen).
  glassTint: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.05)' },
  glassTopGlare: { position: 'absolute', top: 0, left: 0, right: 0, height: 1.5, backgroundColor: 'rgba(255,255,255,0.30)' },
  glassBottomHighlight: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 1.5, backgroundColor: 'rgba(255,255,255,0.20)' },
  // Strips are 2:1, but the tiles read too tall at full height, so we crop to
  // 2.5:1 — which trims only the strips' safe top/bottom margin (all plot
  // content sits inside y 104–920 of 1024), losing nothing (owner 2026-08-17).
  tileStrip: {
    width: '100%',
    aspectRatio: 2.5,
    borderRadius: 6,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileStripInner: { width: '100%', aspectRatio: 2 },
  // Same typeface as the hero "Measurement & Analysis" title (Oswald Medium),
  // just smaller so tiles can be shorter (owner 2026-08-17). Two lines reserved
  // so two-up rows stay aligned regardless of title wrap.
  comingChip: {
    position: 'absolute',
    top: 8,
    right: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(215,224,234,.5)',
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  comingChipText: { fontFamily: fonts.oswaldSemiBold, fontSize: 9, letterSpacing: 1.4, color: '#d7e0ea' },
  // Saved-measurement library row (Phase 2).
  libraryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(77,208,225,.45)',
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
    borderColor: '#26262c',
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
  lockedRow: { borderColor: '#3a3a3a', backgroundColor: '#141414', opacity: 0.6 },
  lockedText: { color: colors.textSub },
  lockedNote: {
    fontFamily: fonts.barlowRegular,
    fontSize: 12.5,
    lineHeight: 17,
    color: colors.textMuted,
    marginTop: -4,
  },
});
