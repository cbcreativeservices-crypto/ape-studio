/**
 * ToolsHubScreen — Measurement & Analysis tools dashboard (Booth 2026-07-09v).
 * Reached from the Home carousel's Measurement & Analysis card (left of the
 * Glossary card). Root-stack screen (bottom nav hidden). Lists the five
 * measurement tools with per-tool colored glass keys; each opens its
 * educational info screen (the live engine is Spike 0 — see toolsData notes).
 */
import { useEffect, useRef, useState, type FC } from 'react';
import { Animated, Dimensions, Easing, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { hapticsEnabled } from '../../features/settings/store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, {
  Circle,
  Defs,
  Line,
  LinearGradient as SvgLinearGradient,
  Path,
  Rect,
  Stop,
  type SvgProps,
} from 'react-native-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
// Measurement-tool card strips (Booth 2026-08-17): full-width 2:1 SVG previews
// of each tool's display, replacing the old inline ToolIcon glyph. Imported as
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

/** Per-tool icon accent (matches the glass-key tints). */
const ICON_COLOR: Record<ToolKey, string> = {
  spl: '#ffa64d',
  rta: '#7fbfff',
  waveform: '#5fd9c4',
  spectrogram: '#b78aff',
  rt60: '#5bff85',
  signalgen: '#ffd24d',
  hzcounter: '#4dd0e1',
  multimeter: '#c9d6e4', // steel — matches the tool's glass-key tint
};

/** Tiny static ICON per tool (iconography, not a meter — spec §1.7). */
function ToolIcon({ tool }: { tool: ToolKey }) {
  const c = ICON_COLOR[tool];
  switch (tool) {
    case 'spl':
      // gauge arc + needle
      return (
        <Svg width={40} height={30} viewBox="0 0 40 30">
          <Path d="M6 26 A 15 15 0 0 1 34 26" stroke={c} strokeWidth={2.5} fill="none" strokeLinecap="round" />
          <Line x1={20} y1={25} x2={28} y2={13} stroke={c} strokeWidth={2.5} strokeLinecap="round" />
          <Circle cx={20} cy={25} r={2.4} fill={c} />
        </Svg>
      );
    case 'rta':
      // analyzer bars
      return (
        <Svg width={40} height={30} viewBox="0 0 40 30">
          {[4, 11, 18, 25, 32].map((x, i) => {
            const h = [12, 20, 26, 16, 9][i];
            return <Rect key={x} x={x} y={28 - h} width={4.5} height={h} rx={1} fill={c} />;
          })}
        </Svg>
      );
    case 'waveform':
      return (
        <Svg width={40} height={30} viewBox="0 0 40 30">
          <Line x1={2} y1={15} x2={38} y2={15} stroke={c} strokeWidth={0.8} opacity={0.4} />
          <Path
            d="M2 15 Q 6 2, 10 15 T 18 15 Q 21 7, 24 15 T 30 15 Q 33 11, 36 15"
            stroke={c}
            strokeWidth={2.2}
            fill="none"
            strokeLinecap="round"
          />
        </Svg>
      );
    case 'spectrogram':
      return (
        <Svg width={40} height={30} viewBox="0 0 40 30">
          {[0, 1, 2, 3].map((col) =>
            [0, 1, 2].map((row) => (
              <Rect
                key={`${col}-${row}`}
                x={3 + col * 9}
                y={3 + row * 9}
                width={7}
                height={7}
                rx={1.5}
                fill={c}
                opacity={[0.9, 0.35, 0.6, 0.2, 0.5, 0.8, 0.3, 0.7, 0.45, 0.85, 0.25, 0.55][col * 3 + row]}
              />
            )),
          )}
        </Svg>
      );
    case 'rt60':
      return (
        <Svg width={40} height={30} viewBox="0 0 40 30">
          <Line x1={3} y1={27} x2={37} y2={27} stroke={c} strokeWidth={0.8} opacity={0.4} />
          <Path d="M4 3 Q 10 22, 22 25 T 37 27" stroke={c} strokeWidth={2.2} fill="none" strokeLinecap="round" />
        </Svg>
      );
    case 'signalgen':
      // a clean sine + a noise burst — a signal SOURCE
      return (
        <Svg width={40} height={30} viewBox="0 0 40 30">
          <Path
            d="M2 15 Q 7 4, 12 15 T 22 15"
            stroke={c}
            strokeWidth={2.2}
            fill="none"
            strokeLinecap="round"
          />
          {[24, 27, 30, 33, 36].map((x, i) => {
            const h = [8, 16, 6, 13, 9][i];
            return <Line key={x} x1={x} y1={15 - h / 2} x2={x} y2={15 + h / 2} stroke={c} strokeWidth={1.8} strokeLinecap="round" />;
          })}
        </Svg>
      );
    case 'hzcounter':
      // square wave + tuner needle — one engine, counter + tuner (merged 2026-07-23)
      return (
        <Svg width={40} height={30} viewBox="0 0 40 30">
          <Path
            d="M3 24 H8 V12 H14 V24 H20 V12 H24"
            stroke={c}
            strokeWidth={2}
            fill="none"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <Line x1={32} y1={26} x2={29} y2={8} stroke={c} strokeWidth={2.2} strokeLinecap="round" />
          <Circle cx={32} cy={26} r={2.2} fill={c} />
        </Svg>
      );
    case 'multimeter':
      // quad-panel glyph — bars · wave · raster · gauge (one meter, four views)
      return (
        <Svg width={40} height={30} viewBox="0 0 40 30">
          {[3, 8, 13].map((x, i) => {
            const h = [8, 12, 6][i];
            return <Rect key={x} x={x} y={13 - h} width={3.5} height={h} rx={1} fill={c} />;
          })}
          <Path d="M22 8 Q 25 2, 28 8 T 34 8" stroke={c} strokeWidth={1.8} fill="none" strokeLinecap="round" />
          {[3, 8, 13].map((x, i) => (
            <Rect key={`r${x}`} x={x} y={19} width={4} height={8} rx={1} fill={c} opacity={[0.85, 0.4, 0.6][i]} />
          ))}
          <Path d="M22 27 A 6.5 6.5 0 0 1 35 27" stroke={c} strokeWidth={1.8} fill="none" strokeLinecap="round" />
          <Line x1={28.5} y1={27} x2={32} y2={21} stroke={c} strokeWidth={1.8} strokeLinecap="round" />
        </Svg>
      );
  }
}

/** Tile display order (owner 2026-08-17): 2-across, top→down / left→right —
 *  SPL · MultiMeter / Waveform · RTA / Spectrogram · Noise Gen / RT60 · Freq. */
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

/** Full-width 2:1 strip that replaces the old icon well above each tile title. */
function ToolStrip({ tool }: { tool: ToolKey }) {
  const Strip = TOOL_STRIP[tool];
  return (
    <View style={styles.tileStrip}>
      {/* Inner keeps the strip's true 2:1 so it's never distorted; the outer
          2.5:1 crop (overflow hidden) trims only the safe top/bottom margin. */}
      <View style={styles.tileStripInner}>
        <Strip
          width="100%"
          height="100%"
          accessibilityRole="image"
          accessibilityLabel={STRIP_LABEL[tool]}
        />
      </View>
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
  // Darkened well below the dashboard method-panel gray (owner 2026-08-17).
  const gradStops = [
    { o: 0, c: '#16161a' },
    { o: 0.42, c: '#222227' },
    { o: 1, c: '#08080c' },
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
  onActivate,
}: {
  tool: ToolKey;
  name: string;
  planned?: boolean;
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
    setTimeout(() => {
      onActivate();
      sink.setValue(0);
      glow.setValue(0);
      busy.current = false;
    }, 190);
  };

  const translateY = sink.interpolate({ inputRange: [0, 1], outputRange: [0, TILE_SINK] });

  return (
    <Pressable
      onPress={activate}
      onPressIn={onIn}
      onPressOut={onOut}
      accessibilityRole="button"
      accessibilityLabel={name}
      style={styles.tileCutout}
    >
      {/* Static cavity shadow the panel lip casts — revealed as the display sinks. */}
      <LinearGradient pointerEvents="none" colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0)']} style={styles.tileCavityTop} />
      {/* The DISPLAY 'cap' — the only mover: sinks into the recess on press. */}
      <Animated.View style={[styles.tileCap, { transform: [{ translateY }] }]}>
        <ToolStrip tool={tool} />
        <Text style={styles.tileName} numberOfLines={2}>
          {name.replace(' / ', '\n')}
        </Text>
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
}

export function ToolsHubScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { commercialMode, caps, entitlement } = useEntitlement();
  // Saved Measurements + Measurement Training are Academy-only (owner
  // 2026-08-05) — free accounts see them grayed + locked → Paywall. Gate on
  // entitlement, not caps (matches the AudioLearning training gate).
  const isMember = entitlement === 'academy';
  // The TOOLS themselves are always usable (Booth 2026-07-11) — the academy
  // upsell is for the TUTORIALS on how to use them, shown as the bottom banner
  // until the user is an academy member (returns if their subscription lapses).
  const showAcademyBanner = commercialMode && !caps.audioTools;
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
              {TILE_ORDER.map(toolByKey).map((t) => (
                <ToolTile
                  key={t.key}
                  tool={t.key}
                  name={t.name}
                  planned={t.planned}
                  // The Frequency Counter and the MultiMeter have their own full
                  // live screens (each owns its useToolUsage telemetry); the rest
                  // open their educational info screen (Booth 2026-07-18;
                  // MultiMeter owner spec 2026-07-29).
                  onActivate={() =>
                    t.key === 'hzcounter'
                      ? navigation.navigate('FrequencyCounter')
                      : t.key === 'multimeter'
                        ? navigation.navigate('MultiMeter')
                        : navigation.navigate('ToolInfo', { toolKey: t.key })
                  }
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
          bar routing back into the tabs (Booth 2026-07-11). When the upsell
          banner shows, the safe-area inset moves to the banner (bottommost). */}
      <LinearGradient
        colors={['#1b1b1b', '#0d0d0d']}
        style={[styles.navBar, { paddingBottom: showAcademyBanner ? 0 : insets.bottom }]}
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

      {/* Permanent academy-upsell notice BELOW the nav (Booth 2026-07-11) — 100%
          of the time for non-academy users; hidden for academy, returns if lapsed. */}
      {showAcademyBanner && (
        <Pressable
          style={[styles.banner, { paddingBottom: 11 + insets.bottom }]}
          onPress={() => navigation.navigate('Paywall')}
          accessibilityRole="button"
          accessibilityLabel="Upgrade to Academy Mode"
        >
          <Text style={styles.bannerText} numberOfLines={2}>
            Upgrade to Academy Mode to learn how to use these tools ›
          </Text>
        </Pressable>
      )}
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
  tileCutout: {
    width: TILE_W,
    // Frame corner just barely sharper than the inner glass (10 vs 11) — the two
    // radii sit only 1pt apart (owner 2026-08-17).
    borderRadius: 10,
    borderTopWidth: 2.5,
    borderLeftWidth: 1.5,
    borderRightWidth: 2.5,
    borderBottomWidth: 1,
    borderTopColor: '#000',
    borderLeftColor: '#000',
    borderRightColor: '#000',
    borderBottomColor: '#000',
    backgroundColor: '#040405', // dark cavity revealed as the cap sinks
    overflow: 'hidden',
  },
  // The DISPLAY 'cap' — the tool's screen; the only part that travels on press.
  // Its corner is ROUNDER (11) than the frame's sharper cut (9) — a two-radius
  // nested look, with the dark cavity peeking at the corner gap (owner 2026-08-17).
  tileCap: { backgroundColor: '#0b0c0e', borderRadius: 11, overflow: 'hidden', padding: 9, gap: 8 },
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
  tileName: {
    fontFamily: fonts.oswaldMedium,
    fontSize: 15,
    lineHeight: 18,
    minHeight: 36,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  // Old icon well — retained (orphaned) until Booth's cleanup pass. See ToolIcon.
  tileIconWell: {
    width: 56,
    height: 40,
    borderRadius: 6,
    backgroundColor: '#0b0b0d',
    borderWidth: 1,
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  // Permanent academy-upsell notice (below the nav) — BLUE theme (Booth 2026-07-11).
  banner: {
    backgroundColor: '#0b1420',
    borderTopWidth: 1,
    borderTopColor: 'rgba(91,176,255,.45)',
    paddingTop: 11,
    paddingHorizontal: 16,
  },
  bannerText: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 13,
    letterSpacing: 0.6,
    color: '#7fd4ff',
    textAlign: 'center',
  },
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
