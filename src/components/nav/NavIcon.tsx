/**
 * NavIcon — per-tab icon (bundled PNG) + label, lit (active: full color + iOS
 * glow) / unlit (dimmed).
 *   Home = amber house · Study = blue headphones · Progress = white faders
 *   · Profile = green person. (The "Achievements" tab is LABELED "PROGRESS".)
 * Art replaced hand-drawn SVG/View glyphs with bundled transparent PNGs
 * (assets/icons/nav/*, owner 2026-08-13). The PROGRESS glyph never tracks/shows/
 * mutates any user progress (album/record progression retired for commercial).
 *
 * PROGRESS animation (owner 2026-08-16): when the Progress tab is the ACTIVE
 * tab, the white faders come alive — the three fader BLOCKS drift slowly up and
 * down their slider paths (never fully to the top); the vertical track lines
 * stay perfectly still. Inactive tabs keep the static PNG exactly as before,
 * as does Reduce Motion. Decorative only — still shows no user data.
 */
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Image, Platform, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../theme/tokens';

export type NavIconName = 'Home' | 'Study' | 'Achievements' | 'Profile';

/** Display label for each tab (the Achievements tab reads "PROGRESS"). */
const NAV_LABEL: Record<NavIconName, string> = {
  Home: 'HOME',
  Study: 'STUDY',
  Achievements: 'PROGRESS',
  Profile: 'PROFILE',
};

/** Bundled icon art per tab (transparent PNGs). */
const NAV_SOURCE: Record<NavIconName, number> = {
  Home: require('../../../assets/icons/nav/nav-home.png'),
  Study: require('../../../assets/icons/nav/nav-study.png'),
  Achievements: require('../../../assets/icons/nav/nav-progress.png'),
  Profile: require('../../../assets/icons/nav/nav-profile.png'),
};

type Def = { color: string; glowRgba: string; font: number; spacing: number };

/** Label color + active-glow tint per tab (the art itself is already colored). */
function defFor(icon: NavIconName): Def {
  switch (icon) {
    case 'Home':
      // App amber (was orange) — user request 2026-07-23.
      return { color: colors.amber, glowRgba: 'rgba(255,198,77,.7)', font: 10, spacing: 1 };
    case 'Study':
      return { color: colors.blue, glowRgba: 'rgba(47,155,255,.7)', font: 10, spacing: 1 };
    case 'Achievements':
      // PROGRESS label stays silver-toned; glyph is the white faders PNG.
      return { color: '#d6d6d6', glowRgba: 'rgba(230,230,230,.6)', font: 9.5, spacing: 0.9 };
    case 'Profile':
      return { color: colors.green, glowRgba: 'rgba(55,224,95,.7)', font: 10, spacing: 1 };
  }
}

function glowStyle(lit: boolean, rgba: string) {
  if (!lit || Platform.OS === 'android') return null;
  return { shadowColor: rgba, shadowOpacity: 1, shadowRadius: 7, shadowOffset: { width: 0, height: 0 } };
}

// ── Animated PROGRESS faders (active tab only) ──────────────────────────────
// Code-drawn replica of nav-progress.png at icon size: three static vertical
// tracks, three grooved fader blocks. Only the BLOCKS move — slow independent
// drifts (different durations, so they never sync), clamped so no fader ever
// reaches fully up. Native-driver translateY.
const FADER_ICON = 22; // matches styles.icon
const FADER_COL_W = 6;
const FADER_TRACK_W = 3;
const FADER_BLOCK_H = 6.5;
const FADER_TOP_MIN = 2; // never fully all the way up
const FADER_BOTTOM_MAX = FADER_ICON - FADER_BLOCK_H; // 15.5 — may rest at the bottom
// Per-fader travel windows (echo the art's resting spread) + slow periods.
const FADER_RANGE: ReadonlyArray<[number, number]> = [
  [4, 14],
  [6, 15],
  [FADER_TOP_MIN, 11],
];
const FADER_MS = [4200, 5400, 6200]; // one direction; full cycle = ×2

function ProgressFadersLit() {
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    let live = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (live) setReduceMotion(v);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      live = false;
      sub.remove();
    };
  }, []);

  // 0 = top of each fader's window, 1 = bottom. Start mid-window, desynced.
  const phases = useRef([new Animated.Value(0.55), new Animated.Value(0.8), new Animated.Value(0.2)]).current;

  useEffect(() => {
    if (reduceMotion) return;
    const loops = phases.map((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(v, { toValue: 0, duration: FADER_MS[i], easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(v, { toValue: 1, duration: FADER_MS[i], easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
      ),
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [reduceMotion, phases]);

  return (
    <View style={styles.faderRow} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {FADER_RANGE.map(([top, bottom], i) => (
        <View key={i} style={styles.faderCol}>
          {/* Track — static, never animates. */}
          <View style={styles.faderTrack} />
          <Animated.View
            style={[
              styles.faderBlock,
              { transform: [{ translateY: phases[i].interpolate({ inputRange: [0, 1], outputRange: [top, bottom] }) }] },
            ]}
          >
            <View style={styles.faderGroove} />
          </Animated.View>
        </View>
      ))}
    </View>
  );
}

export function NavIcon({
  icon,
  lit,
  showLabel = true,
}: {
  icon: NavIconName;
  lit: boolean;
  showLabel?: boolean;
}) {
  const d = defFor(icon);
  const glow = glowStyle(lit, d.glowRgba);

  // ACTIVE Progress tab: swap the static PNG for the animated faders (the
  // ProgressFadersLit component itself falls back to still blocks under
  // Reduce Motion). Every other state keeps the PNG untouched.
  const animatedProgress = icon === 'Achievements' && lit;

  return (
    <View style={[styles.wrap, { opacity: lit ? 1 : 0.4 }]}>
      {animatedProgress ? (
        <View style={[styles.icon, glow]}>
          <ProgressFadersLit />
        </View>
      ) : (
        <Image source={NAV_SOURCE[icon]} style={[styles.icon, glow]} resizeMode="contain" />
      )}

      {showLabel && (
        <Text style={[styles.label, { fontSize: d.font, letterSpacing: d.spacing, color: lit ? d.color : '#8a8a8a' }, glow]}>
          {NAV_LABEL[icon]}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 },
  label: { fontFamily: fonts.oswaldSemiBold },
  icon: { width: 22, height: 22 },
  // Animated PROGRESS faders (drawn at icon size, white like the PNG art)
  faderRow: { flex: 1, flexDirection: 'row', justifyContent: 'space-between' },
  faderCol: { width: FADER_COL_W, height: FADER_ICON },
  faderTrack: {
    position: 'absolute',
    left: (FADER_COL_W - FADER_TRACK_W) / 2,
    top: 0,
    bottom: 0,
    width: FADER_TRACK_W,
    borderRadius: FADER_TRACK_W / 2,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  faderBlock: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: FADER_COL_W,
    height: FADER_BLOCK_H,
    borderRadius: 1.8,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
  },
  faderGroove: { height: 1, marginHorizontal: 1, backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 0.5 },
});
