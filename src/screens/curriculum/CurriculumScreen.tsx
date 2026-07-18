/**
 * Curriculum — the Academy's academic goals plus the full COURSE / TOPIC MATRIX
 * (v2 working SSoT, approved & locked 2026-07-18): 26 subjects · 203 topics.
 * Every subject shows under its number, with its topics numbered subject.topic
 * (1.1, 1.2, …) so the whole structure is easy to scan (user request
 * 2026-07-18). Root-stack modal, ✕ to close, reached from Course Selection.
 *
 * ⚠️ Academic Goals copy is placeholder structure to fill in. The matrix below
 * is the locked SSoT (src/data/course_topic_matrix_v2.json).
 */
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, fonts } from '../../theme/tokens';
import {
  MATRIX_SUBJECTS,
  MATRIX_SUBJECT_COUNT,
  MATRIX_TOPIC_COUNT,
  MATRIX_VERSION,
} from '../../data/courseTopicMatrix';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Curriculum'>;

/** Placeholder academic-goal lines — replace with Booth's official copy. */
const ACADEMIC_GOALS: string[] = [
  'Build job-ready, professional audio skills grounded in real industry practice.',
  'Master every topic through study and proven assessment, not passive watching.',
  'Progress from single-topic specializations to full professional programs.',
  'Earn stackable, verifiable credentials that map to career pathways.',
  'Prepare graduates for certification, employment, and continued growth.',
];

const ACCENT = '#ffc64d'; // gold — matrix scheme

export function CurriculumScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>CURRICULUM</Text>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close">
          <Text style={styles.close}>✕</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}>
        {/* Draft banner — the matrix is locked; academic goals still in progress. */}
        <View style={styles.draftBanner}>
          <Text style={styles.draftTag}>WORKING DRAFT</Text>
          <Text style={styles.draftText}>
            Structure follows the Course / Topic Matrix ({MATRIX_VERSION}, 2026-07-18):{' '}
            {MATRIX_SUBJECT_COUNT} subjects · {MATRIX_TOPIC_COUNT} topics. Academic goals are being
            finalized.
          </Text>
        </View>

        {/* Academic goals for students. */}
        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>ACADEMIC GOALS</Text>
          <Text style={styles.sectionIntro}>
            What the Pro Audio Training Academy sets out to do for every student.
          </Text>
          {ACADEMIC_GOALS.map((goal) => (
            <View key={goal} style={styles.goalRow}>
              <Text style={styles.goalBullet}>▸</Text>
              <Text style={styles.goalText}>{goal}</Text>
            </View>
          ))}
        </View>

        {/* Course / Topic Matrix — every subject numbered, topics numbered
            subject.topic beneath their subject (category) title. */}
        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>COURSE / TOPIC MATRIX</Text>
          <Text style={styles.sectionIntro}>
            Every subject and its topics, in curriculum order.
          </Text>

          {MATRIX_SUBJECTS.map((s) => (
            <View key={s.order} style={[styles.courseCard, { borderColor: ACCENT }]}>
              <View style={styles.courseHead}>
                <Text style={[styles.courseNum, { color: ACCENT, borderColor: ACCENT }]}>{s.order}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.courseEyebrow}>SUBJECT {s.order}</Text>
                  <Text style={styles.courseName}>{s.name}</Text>
                </View>
                <Text style={styles.courseCount}>{s.topics.length} TOPICS</Text>
              </View>
              {s.topics.map((t) => (
                <View key={t.gs} style={styles.topicRow}>
                  <Text style={[styles.topicNum, { color: ACCENT }]}>
                    {s.order}.{t.order}
                  </Text>
                  <Text style={styles.topicText}>{t.name}</Text>
                </View>
              ))}
            </View>
          ))}
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
  headerTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 16, letterSpacing: 1.4, color: colors.textPrimary },
  close: { fontSize: 18, color: colors.textSubAlt },
  scroll: { padding: 20, gap: 22 },

  draftBanner: {
    backgroundColor: '#1d1607',
    borderWidth: 1,
    borderColor: 'rgba(255,180,0,.45)',
    borderRadius: 10,
    padding: 14,
    gap: 6,
  },
  draftTag: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 2.2, color: colors.amber },
  draftText: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSecondary },

  section: { gap: 10 },
  sectionEyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 2.2, color: colors.amberLabel },
  sectionIntro: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSub, marginBottom: 2 },

  goalRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  goalBullet: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, color: colors.amber, lineHeight: 22 },
  goalText: { flex: 1, fontFamily: fonts.barlowRegular, fontSize: 15, lineHeight: 22, color: colors.textSecondary },

  // A subject card with its numbered topic list.
  courseCard: {
    backgroundColor: '#161616',
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    gap: 4,
    marginTop: 4,
  },
  courseHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  courseNum: {
    fontFamily: fonts.oswaldBold,
    fontSize: 15,
    minWidth: 30,
    textAlign: 'center',
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 3,
    overflow: 'hidden',
  },
  courseEyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 1.6, color: colors.textSub },
  courseName: { fontFamily: fonts.oswaldMedium, fontSize: 17, letterSpacing: 0.3, color: colors.textPrimary },
  courseCount: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 1.2, color: '#5bb0ff' },
  topicRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  // Monospace numbers so the N.M scheme lines up in a column.
  topicNum: { fontFamily: fonts.mono, fontSize: 13, lineHeight: 22, minWidth: 40 },
  topicText: { flex: 1, fontFamily: fonts.barlowRegular, fontSize: 14.5, lineHeight: 22, color: colors.textSecondary },
});
