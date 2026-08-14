/**
 * NavIcon — per-tab icon (bundled PNG) + label, lit (active: full color + iOS
 * glow) / unlit (dimmed).
 *   Home = amber house · Study = blue headphones · Progress = white faders
 *   · Profile = green person. (The "Achievements" tab is LABELED "PROGRESS".)
 * Art replaced hand-drawn SVG/View glyphs with bundled transparent PNGs
 * (assets/icons/nav/*, owner 2026-08-13). The PROGRESS glyph is purely static —
 * it no longer tracks/shows/mutates any user progress (album/record progression
 * retired for commercial).
 */
import { Image, Platform, StyleSheet, Text, View } from 'react-native';
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

  return (
    <View style={[styles.wrap, { opacity: lit ? 1 : 0.4 }]}>
      <Image source={NAV_SOURCE[icon]} style={[styles.icon, glow]} resizeMode="contain" />

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
});
