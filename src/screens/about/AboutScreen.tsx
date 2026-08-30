/**
 * About / Credits / Contact — reached by tapping the app logo in the Dashboard
 * header (only there). Root-stack modal, ✕ to close. Final copy (user-provided
 * 2026-07-18): ABOUT · OUR PROMISE · CREDITS · CONTACT.
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
        <Text accessibilityRole="header" style={styles.headerTitle}>ABOUT</Text>
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
          <Text accessibilityRole="header" style={styles.sectionEyebrow}>ABOUT</Text>
          <Text style={styles.body}>
            Pro Audio Training Academy is a comprehensive learning platform designed to help students,
            musicians, technicians, and audio professionals build real-world knowledge of professional audio.
            {'\n\n'}
            Learn through flashcards, fill-in-the-blank exercises, matching activities, ear training,
            scenario-based learning, and quizzes while tracking your progress toward achievements, certificates,
            and professional credentials.
            {'\n\n'}
            Built around mastery—not memorization—the Academy emphasizes practical understanding, long-term
            retention, and skills that translate to real-world audio environments.
          </Text>
        </View>

        <View style={styles.section}>
          <Text accessibilityRole="header" style={styles.sectionEyebrow}>OUR PROMISE</Text>
          <Text style={styles.body}>
            Education always comes first.
            {'\n\n'}
            Our content is created and professionally reviewed with a commitment to technical accuracy,
            practical application, and continuous improvement. We do not sell definitions, accept sponsored
            educational content, or allow advertising to influence what is taught.
            {'\n\n'}
            Our goal is to provide an independent, trusted learning resource for the global audio community.
          </Text>
        </View>

        <View style={styles.section}>
          <Text accessibilityRole="header" style={styles.sectionEyebrow}>CREDITS</Text>
          <Text style={styles.body}>
            Developed by Pro Audio Training Academy under the direction of a college professor with over
            27 years of experience teaching audio engineering, music production, live sound, recording, and
            audio systems.
            {'\n\n'}
            Every definition, lesson, quiz, and learning activity is carefully reviewed to help ensure
            accuracy, consistency, and educational quality.
          </Text>
        </View>

        <View style={styles.section}>
          <Text accessibilityRole="header" style={styles.sectionEyebrow}>CONTACT</Text>
          <Text style={styles.body}>
            Questions, feedback, or suggestions?
            {'\n\n'}
            We’d love to hear from you.
            {'\n\n'}
            Visit ProAudioTrainingAcademy.com or contact us through the in-app Support section.
            {'\n\n'}
            Thank you for helping us continue to improve Pro Audio Training Academy.
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
