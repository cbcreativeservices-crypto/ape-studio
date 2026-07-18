/**
 * About / Credits / Contact (Booth 2026-07-08) — reached by tapping the app
 * logo in the Dashboard header (only there). Root-stack modal, ✕ to close.
 * ⚠️ All copy below is PLACEHOLDER pending Booth's official text.
 */
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BrandLogo } from '../../components/BrandLogo';
import { colors, fonts } from '../../theme/tokens';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'About'>;

export function AboutScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>ABOUT</Text>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close">
          <Text style={styles.close}>✕</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.brandBlock}>
          <BrandLogo size={120} />
          <Text style={styles.appName}>
            Pro Audio <Text style={styles.appNameAccent}>Training Academy</Text>
          </Text>
          <Text style={styles.tagline}>PROFESSIONAL AUDIO GLOSSARY</Text>
          <Text style={styles.version}>Version {Constants.expoConfig?.version ?? '0.0.0'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>ABOUT</Text>
          <Text style={styles.body}>
            A mastery-based study companion for the audio engineering program at Miramar College.
            Study every term through flashcards, fill-in-the-blank, and matching — then prove it
            in the topic quiz to earn trophies, badges, and certifications.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>CREDITS</Text>
          <Text style={styles.body}>
            Created by Prof. Channing Booth{'\n'}
            Miramar College · Pro Audio & Music Technology
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>CONTACT</Text>
          <Text style={styles.body}>
            Questions about the app, your account, or a registration code?{'\n'}
            Contact your instructor or visit the Pro Audio department office.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairlineDim,
    backgroundColor: '#121212',
  },
  headerTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 16, letterSpacing: 1.6, color: colors.textPrimary },
  close: { fontSize: 18, color: colors.textSubAlt },
  scroll: { padding: 20, gap: 24 },
  brandBlock: { alignItems: 'center', gap: 8, marginTop: 12 },
  appName: { fontFamily: fonts.oswaldBold, fontSize: 22, color: colors.textPrimary, marginTop: 8 },
  appNameAccent: {
    fontFamily: fonts.oswaldMedium,
    color: colors.amber,
    textShadowColor: 'rgba(255,180,0,.4)',
    textShadowRadius: 8,
    textShadowOffset: { width: 0, height: 0 },
  },
  tagline: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 2.3, color: '#7a7a7a' },
  version: { fontFamily: fonts.mono, fontSize: 12, color: colors.textSubAlt, marginTop: 4 },
  section: { gap: 8 },
  sectionEyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 2.2, color: colors.amberLabel },
  body: { fontFamily: fonts.barlowRegular, fontSize: 15, lineHeight: 24, color: colors.textSecondary },
});
