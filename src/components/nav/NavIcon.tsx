/**
 * NavIcon — per-tab neon glyph, lit (active: colored + glow) / unlit (dim).
 *   Home = amber house · Study = blue headphones · Progress = AlbumDisc at tier
 *   · Profile = green person. (The "Achievements" tab is LABELED "PROGRESS".)
 */
import { Platform, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, fonts, albumTiers, type AlbumTierName } from '../../theme/tokens';

export type NavIconName = 'Home' | 'Study' | 'Achievements' | 'Profile';

/** Display label for each tab (the Achievements tab reads "PROGRESS"). */
const NAV_LABEL: Record<NavIconName, string> = {
  Home: 'HOME',
  Study: 'STUDY',
  Achievements: 'PROGRESS',
  Profile: 'PROFILE',
};

type Def = { color: string; glowRgba: string; font: number; spacing: number };

const albumAccent: Record<AlbumTierName, string> = {
  Black: '#bdbdbd',
  Silver: '#d8d8d8',
  Gold: '#ffc233',
  Platinum: '#c77dff',
  Diamond: '#7fb8ff',
};

function defFor(icon: NavIconName, album: AlbumTierName): Def {
  switch (icon) {
    case 'Home':
      return { color: colors.orange, glowRgba: 'rgba(255,138,30,.7)', font: 10, spacing: 1 };
    case 'Study':
      return { color: colors.blue, glowRgba: 'rgba(47,155,255,.7)', font: 10, spacing: 1 };
    case 'Achievements':
      return { color: albumAccent[album], glowRgba: 'rgba(255,194,51,.7)', font: 9.5, spacing: 0.9 };
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
  album = 'Silver',
  showLabel = true,
}: {
  icon: NavIconName;
  lit: boolean;
  album?: AlbumTierName;
  showLabel?: boolean;
}) {
  const d = defFor(icon, album);
  const glow = glowStyle(lit, d.glowRgba);

  return (
    <View style={[styles.wrap, { opacity: lit ? 1 : 0.4 }]}>
      {icon === 'Home' && (
        <View style={[styles.homeIcon, glow]}>
          <Svg width={18} height={18} viewBox="0 0 24 24">
            <Path
              d="M12 3 L21 10.5 L21 21 L14.5 21 L14.5 14.5 L9.5 14.5 L9.5 21 L3 21 L3 10.5 Z"
              fill={colors.orange}
            />
          </Svg>
        </View>
      )}

      {icon === 'Study' && (
        <View style={[styles.headband, glow]}>
          <View style={styles.earL} />
          <View style={styles.earR} />
        </View>
      )}

      {icon === 'Achievements' && <AlbumDiscMini album={album} />}

      {icon === 'Profile' && (
        <View style={styles.person}>
          <View style={[styles.head, glow]} />
          <View style={[styles.shoulders, glow]} />
        </View>
      )}

      {showLabel && (
        <Text style={[styles.label, { fontSize: d.font, letterSpacing: d.spacing, color: lit ? d.color : '#8a8a8a' }, glow]}>
          {NAV_LABEL[icon]}
        </Text>
      )}
    </View>
  );
}

function AlbumDiscMini({ album }: { album: AlbumTierName }) {
  const tier = albumTiers.find((t) => t.name === album) ?? albumTiers[0];
  return (
    <View style={[styles.disc, { backgroundColor: tier.color }]}>
      <View style={styles.discGroove} />
      <View style={styles.discCenter} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 },
  label: { fontFamily: fonts.oswaldSemiBold },

  homeIcon: { width: 18, height: 18, alignItems: 'center', justifyContent: 'center' },

  headband: {
    width: 17,
    height: 10,
    borderWidth: 2.5,
    borderColor: colors.blue,
    borderBottomWidth: 0,
    borderTopLeftRadius: 9,
    borderTopRightRadius: 9,
    marginTop: 3,
  },
  earL: { position: 'absolute', left: -4, bottom: -3, width: 4, height: 7, backgroundColor: colors.blue, borderRadius: 2 },
  earR: { position: 'absolute', right: -4, bottom: -3, width: 4, height: 7, backgroundColor: colors.blue, borderRadius: 2 },

  person: { alignItems: 'center' },
  head: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.green },
  shoulders: { width: 12, height: 5, borderTopLeftRadius: 6, borderTopRightRadius: 6, backgroundColor: colors.green, marginTop: 1 },

  disc: { width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  discGroove: { position: 'absolute', top: 2.5, left: 2.5, width: 11, height: 11, borderRadius: 5.5, borderWidth: 0.5, borderColor: 'rgba(0,0,0,.35)' },
  discCenter: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: colors.steelBorder },
});
