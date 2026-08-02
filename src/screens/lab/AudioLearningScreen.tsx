/**
 * AudioLearningScreen — the two-way fork that separates the free AUDIO
 * FUNDAMENTALS from the members-only TRAINING LABS BEFORE the combined lab list
 * (owner 2026-08-02). Reached from the HOME "Audio Fundamentals & Training Lab"
 * card; each destination card routes into EarLab with the matching `section`, so
 * the existing data-driven lab list is reused (never duplicated).
 *
 * Fundamentals are free for everyone. Training Labs require Academy membership,
 * but free users may still open the Training catalog in PREVIEW (EarLab enforces
 * the per-lab lock + shared UpgradeSheet); this screen only chooses the path.
 */
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, fonts } from '../../theme/tokens';
import type { RootStackParamList } from '../../navigation/types';
import { useEntitlement } from '../../features/commercial/EntitlementProvider';

type Props = NativeStackScreenProps<RootStackParamList, 'AudioLearning'>;

const INTRO =
  'Build your foundational knowledge or strengthen your understanding through ' +
  'interactive practice. Audio Fundamentals are included free for everyone, ' +
  'while Training Labs are available to Academy members.';

const FUND_DESC =
  'Build a strong foundation in sound, hearing, signal flow, gain structure, and ' +
  'the essential principles used throughout every audio field.';
const TRAIN_DESC =
  'Develop practical understanding through interactive demonstrations, ' +
  'visualizations, controls, listening exercises, and guided technical experiments.';

export function AudioLearningScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { entitlement } = useEntitlement();
  const isMember = entitlement === 'academy';

  const goFundamentals = () => navigation.navigate('EarLab', { section: 'fundamentals' });
  const goTraining = () => navigation.navigate('EarLab', { section: 'training' });

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={{ flexShrink: 1 }}>
          <Text style={styles.title}>AUDIO LEARNING</Text>
          <Text style={styles.subtitle}>Choose your path</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.intro}>{INTRO}</Text>

        {/* ── Audio Fundamentals — free for everyone ───────────────────── */}
        <Pressable
          onPress={goFundamentals}
          accessibilityRole="button"
          accessibilityLabel="Audio Fundamentals. Included free. Explore fundamentals."
          style={({ pressed }) => [styles.card, styles.cardFree, pressed && styles.cardPressed]}
        >
          <View style={styles.cardHead}>
            <View style={[styles.iconBadge, styles.iconBadgeFree]}>
              <Text style={styles.iconGlyph}>📘</Text>
            </View>
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={styles.cardTitle}>Audio Fundamentals</Text>
              <View style={[styles.badge, styles.badgeFree]}>
                <Text style={styles.badgeFreeText}>INCLUDED FREE</Text>
              </View>
            </View>
          </View>
          <Text style={styles.cardDesc}>{FUND_DESC}</Text>
          <View style={[styles.cta, styles.ctaFree]}>
            <Text style={[styles.ctaText, styles.ctaTextFree]}>EXPLORE FUNDAMENTALS</Text>
            <Text style={[styles.ctaChevron, styles.ctaTextFree]}>›</Text>
          </View>
        </Pressable>

        {/* ── Training Labs — members; free users preview ──────────────── */}
        <Pressable
          onPress={goTraining}
          accessibilityRole="button"
          accessibilityLabel={
            isMember
              ? 'Training Labs. Academy membership. Open training labs.'
              : 'Training Labs. Requires Academy membership. Preview training labs.'
          }
          style={({ pressed }) => [styles.card, styles.cardMember, pressed && styles.cardPressed]}
        >
          <View style={styles.cardHead}>
            <View style={[styles.iconBadge, styles.iconBadgeMember]}>
              <Text style={styles.iconGlyph}>🧪</Text>
            </View>
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={styles.cardTitle}>Training Labs</Text>
              <View style={[styles.badge, styles.badgeMember]}>
                <Text style={styles.badgeMemberText}>
                  {isMember ? 'ACADEMY MEMBERSHIP' : '🔒 ACADEMY MEMBERSHIP'}
                </Text>
              </View>
            </View>
          </View>
          <Text style={styles.cardDesc}>{TRAIN_DESC}</Text>
          <View style={[styles.cta, styles.ctaMember]}>
            <Text style={[styles.ctaText, styles.ctaTextMember]}>
              {isMember ? 'OPEN TRAINING LABS' : 'PREVIEW TRAINING LABS'}
            </Text>
            <Text style={[styles.ctaChevron, styles.ctaTextMember]}>›</Text>
          </View>
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
    padding: 16,
    gap: 12,
  },
  cardFree: { borderColor: 'rgba(55,224,95,.5)', backgroundColor: '#0f1712' },
  cardMember: { borderColor: 'rgba(255,198,77,.5)', backgroundColor: '#17140c' },
  cardPressed: { opacity: 0.85 },

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
  iconBadgeMember: { borderColor: 'rgba(255,198,77,.45)', backgroundColor: 'rgba(255,198,77,.08)' },
  iconGlyph: { fontSize: 22 },

  cardTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 19, letterSpacing: 0.6, color: colors.textPrimary },

  badge: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
  badgeFree: { borderColor: 'rgba(55,224,95,.5)', backgroundColor: 'rgba(55,224,95,.12)' },
  badgeFreeText: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 1.2, color: '#5bff85' },
  badgeMember: { borderColor: 'rgba(255,198,77,.5)', backgroundColor: 'rgba(255,198,77,.12)' },
  badgeMemberText: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 1.2, color: colors.amber },

  cardDesc: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSecondary },

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
  ctaMember: { borderColor: 'rgba(255,198,77,.5)', backgroundColor: 'rgba(255,198,77,.10)' },
  ctaText: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 1 },
  ctaTextFree: { color: '#5bff85' },
  ctaTextMember: { color: colors.amber },
  ctaChevron: { fontFamily: fonts.oswaldSemiBold, fontSize: 20 },
});
