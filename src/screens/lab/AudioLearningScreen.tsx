/**
 * AudioLearningScreen — the two-way fork that separates AUDIO FUNDAMENTALS from
 * the members-only TRAINING LABS BEFORE the combined lab list (owner 2026-08-02).
 * Reached from the HOME "Audio Fundamentals & Training Lab" card; each destination
 * card routes into EarLab with the matching `section`, so the existing data-driven
 * lab list is reused (never duplicated).
 *
 * Audio Fundamentals is free to START: the core intro labs are free, while the
 * deeper Fundamentals labs carry `member: true` and the whole Training Lab is
 * members-only (owner 2026-08-23). Free users may still open any locked lab in
 * PREVIEW (EarLab enforces the per-lab lock + shared UpgradeSheet); this screen
 * only chooses the path.
 */
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, fonts } from '../../theme/tokens';
import { AccuracyNote } from '../../components/AccuracyNote';
import type { RootStackParamList } from '../../navigation/types';
import { useEntitlement } from '../../features/commercial/EntitlementProvider';

// Card background art (owner 2026-08-22). Bundled PNGs; each ImageBackground
// carries a LinearGradient scrim so the frame's text and CTA stay legible over
// the art (same treatment as the CourseSelection lab card). A null source just
// renders the card's solid background (graceful until the file is dropped in).
const BG_TRAINING = require('../../../assets/lab-backgrounds/training-labs.png');
const BG_FUNDAMENTALS: number | null = require('../../../assets/lab-backgrounds/audio-fundamentals.png');

type Props = NativeStackScreenProps<RootStackParamList, 'AudioLearning'>;

const INTRO =
  'Build your foundational knowledge or strengthen your understanding through ' +
  'interactive practice. Start free with the core Audio Fundamentals; the deeper ' +
  'Fundamentals labs and the Advanced Training Labs come with Academy membership.';

const FUND_DESC =
  'The bedrock of professional audio: how sound behaves, how we hear it, and how ' +
  'signal moves through a system. Core labs are free — the deeper Fundamentals ' +
  'unlock with membership.';
const FUND_CERT = 'Required for every Academy certificate';
const TRAIN_DESC =
  'Go further: interactive demonstrations, visualizations, hands-on controls, ' +
  'listening exercises, and guided experiments across every audio discipline.';

export function AudioLearningScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { isMember } = useEntitlement();

  const goFundamentals = () => navigation.navigate('EarLab', { section: 'fundamentals' });
  const goTraining = () => navigation.navigate('EarLab', { section: 'training' });

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={{ flexShrink: 1, flexGrow: 1 }}>
          <Text style={styles.title}>AUDIO LEARNING</Text>
          <Text style={styles.subtitle}>Choose your path</Text>
        </View>
        <AccuracyNote compact />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.intro}>{INTRO}</Text>

        {/* ── Audio Fundamentals — free to start (core labs free) ──────── */}
        <Pressable
          onPress={goFundamentals}
          accessibilityRole="button"
          accessibilityLabel="Audio Fundamentals. Free to start. Required for every Academy certificate. Explore fundamentals."
          style={({ pressed }) => [styles.card, styles.cardFree, pressed && styles.cardPressed]}
        >
          <ImageBackground
            source={BG_FUNDAMENTALS ?? undefined}
            style={styles.cardBg}
            imageStyle={styles.cardImg}
          >
            {BG_FUNDAMENTALS != null ? (
              <LinearGradient
                colors={['rgba(10,17,13,0.78)', 'rgba(10,17,13,0.42)', 'rgba(10,17,13,0.88)']}
                locations={[0, 0.5, 1]}
                style={StyleSheet.absoluteFill}
              />
            ) : null}
            <View style={styles.cardHead}>
              <View style={[styles.iconBadge, styles.iconBadgeFree]}>
                <Text style={styles.iconGlyph}>📘</Text>
              </View>
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={styles.cardTitle}>Audio Fundamentals</Text>
                <View style={[styles.badge, styles.badgeFree]}>
                  <Text style={styles.badgeFreeText}>FREE TO START</Text>
                </View>
              </View>
            </View>
            <Text style={styles.cardDesc}>{FUND_DESC}</Text>
            <View style={styles.certNote}>
              <Text style={styles.certGlyph}>🎓</Text>
              <Text style={styles.certText}>{FUND_CERT}</Text>
            </View>
            <View style={[styles.cta, styles.ctaFree]}>
              <Text style={[styles.ctaText, styles.ctaTextFree]}>EXPLORE FUNDAMENTALS</Text>
              <Text style={[styles.ctaChevron, styles.ctaTextFree]}>›</Text>
            </View>
          </ImageBackground>
        </Pressable>

        {/* ── Advanced Training Labs — members; free users preview ─────── */}
        <Pressable
          onPress={goTraining}
          accessibilityRole="button"
          accessibilityLabel={
            isMember
              ? 'Advanced Training Labs. Academy membership. Explore the advanced training labs.'
              : 'Advanced Training Labs. Requires Academy membership. Preview advanced training labs.'
          }
          style={({ pressed }) => [styles.card, styles.cardMember, pressed && styles.cardPressed]}
        >
          <ImageBackground
            source={BG_TRAINING ?? undefined}
            style={styles.cardBg}
            imageStyle={styles.cardImg}
          >
            {BG_TRAINING != null ? (
              <LinearGradient
                colors={['rgba(20,15,26,0.78)', 'rgba(20,15,26,0.42)', 'rgba(20,15,26,0.88)']}
                locations={[0, 0.5, 1]}
                style={StyleSheet.absoluteFill}
              />
            ) : null}
            <View style={styles.cardHead}>
              <View style={[styles.iconBadge, styles.iconBadgeMember]}>
                <Text style={styles.iconGlyph}>🧪</Text>
              </View>
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={styles.cardTitle}>Advanced Training Labs</Text>
                <View style={[styles.badge, styles.badgeMember]}>
                  <Text style={styles.badgeMemberText}>
                    {isMember ? 'ACADEMY MEMBERSHIP' : '🔒 ACADEMY MEMBERSHIP'}
                  </Text>
                </View>
              </View>
            </View>
            <Text style={styles.cardDesc}>{TRAIN_DESC}</Text>
            {/* Free users PREVIEW → green (they can look); Academy members OPEN → purple (matches the card). */}
            <View style={[styles.cta, isMember ? styles.ctaMember : styles.ctaFree]}>
              <Text style={[styles.ctaText, isMember ? styles.ctaTextMember : styles.ctaTextFree]}>
                {isMember ? 'EXPLORE ADVANCED LABS' : 'PREVIEW ADVANCED LABS'}
              </Text>
              <Text style={[styles.ctaChevron, isMember ? styles.ctaTextMember : styles.ctaTextFree]}>›</Text>
            </View>
          </ImageBackground>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingBottom: 10 },
  back: { fontFamily: fonts.oswaldSemiBold, fontSize: 30, color: colors.textSub, marginTop: -4, paddingRight: 2 },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 16, letterSpacing: 1.2, color: colors.textPrimary },
  subtitle: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.textSub, marginTop: 1 },
  scroll: { padding: 16, paddingBottom: 32, gap: 16 },
  intro: { fontFamily: fonts.barlowRegular, fontSize: 14.5, lineHeight: 21, color: colors.textSecondary },

  card: {
    borderRadius: 14,
    borderWidth: 1,
    // Art is full-bleed inside the frame; padding + spacing live on cardBg so
    // the image reaches the rounded border. overflow:hidden clips it.
    overflow: 'hidden',
  },
  cardFree: { borderColor: 'rgba(55,224,95,.5)', backgroundColor: '#0f1712' },
  cardMember: { borderColor: 'rgba(180,91,255,.5)', backgroundColor: '#140f1a' },
  cardPressed: { opacity: 0.85 },
  cardBg: { padding: 16, gap: 12 },
  cardImg: { borderRadius: 14 },

  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBadge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBadgeFree: { borderColor: 'rgba(55,224,95,.45)', backgroundColor: 'rgba(55,224,95,.08)' },
  iconBadgeMember: { borderColor: 'rgba(180,91,255,.45)', backgroundColor: 'rgba(180,91,255,.08)' },
  iconGlyph: { fontSize: 22 },

  cardTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 19, letterSpacing: 0.6, color: colors.textPrimary },

  badge: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
  badgeFree: { borderColor: 'rgba(55,224,95,.5)', backgroundColor: 'rgba(55,224,95,.12)' },
  badgeFreeText: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 1.2, color: '#5bff85' },
  badgeMember: { borderColor: 'rgba(180,91,255,.5)', backgroundColor: 'rgba(180,91,255,.12)' },
  badgeMemberText: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 1.2, color: '#c98bff' },

  cardDesc: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSecondary },

  // Certificate requirement — amber (academy/credential gold), set apart from the
  // free/paid green so it reads as "this matters for your certificate."
  certNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,198,77,.5)',
    backgroundColor: 'rgba(255,198,77,.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  certGlyph: { fontSize: 13 },
  certText: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 0.8, color: '#ffdd94' },

  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  ctaFree: { borderColor: 'rgba(55,224,95,.5)', backgroundColor: 'rgba(55,224,95,.10)' },
  ctaMember: { borderColor: 'rgba(180,91,255,.5)', backgroundColor: 'rgba(180,91,255,.10)' },
  ctaText: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 1 },
  ctaTextFree: { color: '#5bff85' },
  ctaTextMember: { color: '#c98bff' },
  ctaChevron: { fontFamily: fonts.oswaldSemiBold, fontSize: 20 },
});
