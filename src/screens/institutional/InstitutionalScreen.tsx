/**
 * Institutional Mode — PARKED container (user request 2026-07-17). The
 * academic/institutional/site-license version is postponed until after the
 * commercial launch (target: work resumes Fall 2026); it will match whatever
 * ships commercially, so everything here is a labeled placeholder, reachable
 * from the Profile screen's (disabled) Institutional Mode row. No feature on
 * this screen is wired to anything.
 */
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, fonts } from '../../theme/tokens';

/** The parked institutional modules (user list, 2026-07-17). */
const PARKED_MODULES: { title: string; blurb: string }[] = [
  { title: 'STUDENT BADGE', blurb: 'Verified student ID badge for campus programs.' },
  { title: 'CHECKOUT', blurb: 'Equipment / gear-room checkout and returns.' },
  { title: 'QR CODING', blurb: 'QR-based check-in and verification codes.' },
  { title: 'TRACKING', blurb: 'Attendance and lab-hours tracking.' },
  { title: 'ANALYTICS', blurb: 'Cohort progress analytics for instructors.' },
  { title: 'SEQUENCING', blurb: 'Curriculum sequencing and topic ordering controls.' },
];

export function InstitutionalScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>INSTITUTIONAL MODE</Text>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <Text style={styles.close}>✕</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.parkedBanner}>
          <Text style={styles.parkedTag}>PARKED</Text>
          <Text style={styles.parkedText}>
            The academic / institutional (site-license) version is postponed until after the
            commercial launch. It will be built to match the final commercial app, so these modules
            are parked here until then.
          </Text>
        </View>

        {PARKED_MODULES.map((m) => (
          <View key={m.title} style={styles.moduleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.moduleTitle}>{m.title}</Text>
              <Text style={styles.moduleBlurb}>{m.blurb}</Text>
            </View>
            <Text style={styles.moduleTag}>TBD</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg, paddingHorizontal: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, letterSpacing: 2, color: colors.textPrimary },
  close: { fontFamily: fonts.oswaldSemiBold, fontSize: 22, color: '#c8c8c8' },
  scroll: { paddingBottom: 32, gap: 10 },

  parkedBanner: {
    backgroundColor: '#1d1607',
    borderWidth: 1,
    borderColor: 'rgba(255,180,0,.45)',
    borderRadius: 10,
    padding: 14,
    gap: 6,
    marginBottom: 4,
  },
  parkedTag: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 2.2, color: colors.amber },
  parkedText: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSecondary },

  moduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#181818',
    borderWidth: 1,
    borderColor: colors.hairlineAlt,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    opacity: 0.75, // parked = visibly inert
  },
  moduleTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.6, color: colors.textSecondary },
  moduleBlurb: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textMuted, marginTop: 2 },
  moduleTag: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 10,
    letterSpacing: 1.6,
    color: colors.textMuted,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    borderRadius: 5,
    paddingVertical: 3,
    paddingHorizontal: 7,
  },
});
