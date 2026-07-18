/**
 * ToolsHubScreen — Measurement & Analysis tools dashboard (Booth 2026-07-09v).
 * Reached from the Home carousel's Measurement & Analysis card (left of the
 * Glossary card). Root-stack screen (bottom nav hidden). Lists the five
 * measurement tools with per-tool colored glass keys; each opens its
 * educational info screen (the live engine is Spike 0 — see toolsData notes).
 */
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BrandLogo } from '../../components/BrandLogo';
import { GlassButton } from '../../components/GlassButton';
import { NavIcon, type NavIconName } from '../../components/nav/NavIcon';
import { useEntitlement } from '../../features/commercial/EntitlementProvider';
import { useAlbumTier } from '../../features/profile/api';
import { colors, fonts } from '../../theme/tokens';
import { TOOLS, type ToolKey } from './toolsData';
import type { RootStackParamList } from '../../navigation/types';

const { width: SCREEN_W } = Dimensions.get('window');
const TILE_W = Math.floor((SCREEN_W - 14 * 2 - 12) / 2); // 2-across, 14 pad, 12 gap
const NAV_TABS: NavIconName[] = ['Home', 'Study', 'Achievements', 'Profile'];

type Props = NativeStackScreenProps<RootStackParamList, 'ToolsHub'>;

/** Per-tool icon accent (matches the glass-key tints). */
const ICON_COLOR: Record<ToolKey, string> = {
  spl: '#ffa64d',
  rta: '#7fbfff',
  waveform: '#5fd9c4',
  spectrogram: '#b78aff',
  rt60: '#5bff85',
  signalgen: '#ffd24d',
  tuner: '#d7e0ea',
  hzcounter: '#4dd0e1',
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
    case 'tuner':
      // center-detent scale + needle just off-center — tuning toward pitch
      return (
        <Svg width={40} height={30} viewBox="0 0 40 30">
          {[6, 13, 20, 27, 34].map((x) => (
            <Line key={x} x1={x} y1={4} x2={x} y2={x === 20 ? 12 : 9} stroke={c} strokeWidth={x === 20 ? 2.2 : 1.4} strokeLinecap="round" opacity={x === 20 ? 1 : 0.55} />
          ))}
          <Line x1={20} y1={26} x2={16.5} y2={7} stroke={c} strokeWidth={2.4} strokeLinecap="round" />
          <Circle cx={20} cy={26} r={2.4} fill={c} />
        </Svg>
      );
    case 'hzcounter':
      // square wave — a repeating rate
      return (
        <Svg width={40} height={30} viewBox="0 0 40 30">
          <Path
            d="M3 22 H9 V8 H17 V22 H25 V8 H33 V22 H37"
            stroke={c}
            strokeWidth={2.2}
            fill="none"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </Svg>
      );
  }
}

export function ToolsHubScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { commercialMode, caps } = useEntitlement();
  const album = useAlbumTier();
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
            <Text style={styles.heroEyebrow}>AUDIO MEASUREMENT TOOLS</Text>
            <Text style={styles.heroTitle}>Measurement{'\n'}& Analysis</Text>
            <View style={styles.heroRule} />
            <Text style={styles.heroCount}>
              {TOOLS.filter((t) => !t.planned).length} tools available ·{' '}
              {TOOLS.filter((t) => t.planned).length} in development
            </Text>
          </View>

          {/* Spike-0 dev entry — dev builds only, invisible in release. */}
          {__DEV__ && (
            <Pressable
              style={styles.devRow}
              onPress={() => navigation.navigate('DspDebug')}
              accessibilityRole="button"
              accessibilityLabel="DSP debug"
            >
              <Text style={styles.devRowText}>DSP DEBUG (DEV) — SPIKE 0</Text>
            </Pressable>
          )}

          {/* Tools as SQUARE tiles, 2 across (Booth 2026-07-11). Always unlocked. */}
          <View style={styles.grid}>
            {TOOLS.map((t) => (
              <Pressable
                key={t.key}
                style={[styles.tile, { borderColor: ICON_COLOR[t.key] + '66' }]}
                onPress={() =>
                  // The Frequency Counter has its own modes+results screen; the
                  // rest open their educational info screen (Booth 2026-07-18).
                  t.key === 'hzcounter'
                    ? navigation.navigate('FrequencyCounter')
                    : navigation.navigate('ToolInfo', { toolKey: t.key })
                }
                accessibilityRole="button"
                accessibilityLabel={t.name}
              >
                <View style={styles.tileIconWell}>
                  <ToolIcon tool={t.key} />
                </View>
                {/* One title only (Booth 2026-07-11) — the subtitle lives on the
                    tool's info screen, not the tile. */}
                <Text style={styles.tileName} numberOfLines={2}>
                  {t.name}
                </Text>
                {/* Placeholder tools (Booth 2026-07-18): honest COMING chip, no fake engine. */}
                {t.planned && (
                  <View style={styles.comingChip}>
                    <Text style={styles.comingChipText}>COMING</Text>
                  </View>
                )}
              </Pressable>
            ))}
          </View>
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
              <NavIcon icon={name} lit={false} album={album} />
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

  // Compact hero so all 3 tile rows fit without scrolling (Booth 2026-07-11).
  hero: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#121214',
    padding: 14,
    gap: 5,
  },
  heroEyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 2.2, color: colors.amber },
  heroTitle: { fontFamily: fonts.oswaldMedium, fontSize: 22, lineHeight: 26, color: colors.textPrimary },
  heroRule: { width: 40, height: 2, backgroundColor: colors.amber, borderRadius: 1, marginTop: 2 },
  heroCount: { fontFamily: fonts.barlowRegular, fontSize: 13, color: colors.textSub },

  // 2-across tile grid — short enough that all 3 rows fit above the nav without
  // scrolling (not perfect squares, Booth 2026-07-11).
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: {
    width: TILE_W,
    height: 104,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: '#131316',
    padding: 12,
    justifyContent: 'space-between',
  },
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
  tileName: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, letterSpacing: 0.5, color: colors.textPrimary },
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
  devRow: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#4a3a10',
    backgroundColor: '#171204',
    paddingVertical: 8,
    alignItems: 'center',
  },
  devRowText: { fontFamily: fonts.mono, fontSize: 11, letterSpacing: 1, color: '#b98a20' },
});
