/**
 * AppHeader — shared logo + wordmark tile header (design-reference dashboard
 * header), enlarged 30% per Booth 2026-07-08 (logo 36→47, wordmark 15→20,
 * eyebrow 8→10). Used on the Dashboard and Course Selection; `right` slot
 * carries per-screen controls (e.g. the Glossary chip). Progress and Profile
 * use it too, with their tab's icon in a `TabIconTile` (owner 2026-10-29:
 * "match titles … all three screens are very different in the size").
 */
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BrandLogo } from './BrandLogo';
import { NavIcon, type NavIconName } from './nav/NavIcon';
import { colors, fonts } from '../theme/tokens';

export function AppHeader({
  right,
  onLogoPress,
  logo,
  title,
}: {
  right?: ReactNode;
  /** The screen's own title in place of the app wordmark + slogan (owner
   *  2026-10-27: the Study Dashboard said the app's name, not what it is).
   *  `[plain, accent]` renders like "Study **Dashboard**". */
  title?: readonly [string, string];
  /** Dashboard passes this to open About/Credits (Booth 2026-07-08). */
  onLogoPress?: () => void;
  /** Override the brand logo glyph (Dashboard uses the blue Study icon, owner
   *  2026-08-01). Defaults to the company BrandLogo. */
  logo?: ReactNode;
}) {
  const glyph = logo ?? <BrandLogo size={47} />;
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        {onLogoPress ? (
          <Pressable onPress={onLogoPress} hitSlop={6} accessibilityRole="button" accessibilityLabel="About this app">
            {glyph}
          </Pressable>
        ) : (
          glyph
        )}
        {title ? (
          <View style={{ flexShrink: 1 }}>
            <Text style={styles.screenTitle} accessibilityRole="header" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
              {title[0]} <Text style={styles.wordmarkAccent}>{title[1]}</Text>
            </Text>
          </View>
        ) : (
          <View style={{ flexShrink: 1 }}>
            <Text style={styles.wordmark}>
              Pro Audio <Text style={styles.wordmarkAccent}>Training Academy</Text>
            </Text>
            <Text style={styles.eyebrow}>THE WHOLE CRAFT OF AUDIO IN YOUR POCKET</Text>
          </View>
        )}
      </View>
      {right}
    </View>
  );
}

/** A tab's own bottom-bar icon in a small tinted tile — the Dashboard's Study
 *  tile (40 pt, icon ×1.52), for the other tab screens' titles. */
export function TabIconTile({ icon, tint }: { icon: NavIconName; tint: string }) {
  return (
    <View style={[styles.tabTile, { borderColor: `${tint}8c`, backgroundColor: `${tint}14` }]}>
      <View style={{ transform: [{ scale: 1.52 }] }}>
        <NavIcon icon={icon} lit showLabel={false} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabTile: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    borderWidth: 1,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  left: { flexDirection: 'row', alignItems: 'center', gap: 11, flexShrink: 1 },
  wordmark: { fontFamily: fonts.oswaldBold, fontSize: 20, letterSpacing: 0.4, color: colors.textPrimary },
  // Sized to the space the wordmark + slogan used, so it never truncates at
  // phone width (adjustsFontSizeToFit does nothing on web).
  screenTitle: { fontFamily: fonts.oswaldBold, fontSize: 22, letterSpacing: 0.3, color: colors.textPrimary },
  wordmarkAccent: {
    fontFamily: fonts.oswaldMedium,
    color: colors.amber,
    textShadowColor: 'rgba(255,180,0,.4)',
    textShadowRadius: 8,
    textShadowOffset: { width: 0, height: 0 },
  },
  eyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 2.3, color: '#7a7a7a', marginTop: 3 },
});
