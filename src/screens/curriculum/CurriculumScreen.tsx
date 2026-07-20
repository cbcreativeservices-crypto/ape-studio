/**
 * Curriculum — the Academy's academic goals plus the full COURSE / TOPIC MATRIX
 * (v2 working SSoT, approved & locked 2026-07-18): 26 subjects · 203 topics.
 *
 * LIST ONLY, VIEW ONLY (user request 2026-07-18): subjects collapse into an
 * accordion by default; tap a subject to expand its topics; the 🔍 zooms it
 * large. No selection/certificate-building here — this is a reference view.
 *
 * Root-stack modal, ✕ to close, reached from Course Selection.
 */
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, fonts } from '../../theme/tokens';
import { BrandLogo } from '../../components/BrandLogo';
import { LowLightDim } from '../../features/settings/LowLightLayer';
import { consumeDevPreview } from '../../features/dev/devPreview';
import {
  MATRIX_SUBJECTS,
  MATRIX_SUBJECT_COUNT,
  MATRIX_TOPIC_COUNT,
  MATRIX_VERSION,
  type MatrixSubject,
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

// Intro title + body shown above the matrix. The title matches the imperative,
// Academy-themed headings on the Specialization / Program pages (user request
// 2026-07-18) — courses → certificates → programs.
const CURRICULUM_INTRO_TITLE = 'Explore the Academy Curriculum';
const CURRICULUM_INTRO =
  'Progress is built one topic at a time. Learn, practice, review, and return whenever you’re ready. Every completed topic brings you closer to mastering professional audio.';

const ACCENT = '#ffc64d'; // gold — matrix scheme

/**
 * CurriculumView — the scrollable curriculum body (intro + matrix accordion +
 * goals) plus its zoom modal, WITHOUT a screen header. Embedded as the first
 * page of the Awards pager (user request 2026-07-18) and by the standalone
 * CurriculumScreen. `showBrand` draws the logo/intro block (off in the pager,
 * which already shows the logo up top).
 */
export function CurriculumView({ showBrand = true }: { showBrand?: boolean }) {
  const insets = useSafeAreaInsets();

  // Tapping a subject opens its topics in a centered popup (user request
  // 2026-07-18) — the inline accordion + 🔍 zoom glyph are removed.
  const [zoom, setZoom] = useState<MatrixSubject | null>(null);

  // Dev Visual Index: auto-open a subject popup for preview (TEMPORARY).
  useEffect(() => {
    if (consumeDevPreview('curriculum:zoom')) setZoom(MATRIX_SUBJECTS[0] ?? null);
  }, []);

  return (
    <>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}>
        {showBrand ? (
          // Company logo + intro grouped tightly so the intro reads as the
          // header block, not a floating paragraph (user request 2026-07-18).
          <View style={styles.introBlock}>
            <View style={styles.brandRow}>
              <BrandLogo size={34} />
              <Text style={styles.brandWordmark}>
                PRO AUDIO <Text style={styles.brandAccent}>TRAINING ACADEMY</Text>
              </Text>
            </View>
            <Text style={styles.introTitle}>{CURRICULUM_INTRO_TITLE}</Text>
            <Text style={styles.curriculumIntro}>{CURRICULUM_INTRO}</Text>
          </View>
        ) : (
          <View style={styles.introBlock}>
            <Text style={styles.introTitle}>{CURRICULUM_INTRO_TITLE}</Text>
            <Text style={styles.curriculumIntro}>{CURRICULUM_INTRO}</Text>
          </View>
        )}

        {/* Course / Topic Matrix — LIST accordion (view only). Tap a subject to
            expand its topics; 🔍 zooms it large. */}
        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>SUBJECT / TOPIC MATRIX</Text>
          <Text style={styles.sectionIntro}>
            {MATRIX_SUBJECT_COUNT} subjects · {MATRIX_TOPIC_COUNT} topics ({MATRIX_VERSION}). Tap a subject to
            view its topics.
          </Text>

          {MATRIX_SUBJECTS.map((s) => (
            <Pressable
              key={s.order}
              style={styles.subjectCard}
              onPress={() => setZoom(s)}
              accessibilityRole="button"
              accessibilityLabel={`${s.name}, ${s.topics.length} topics`}
            >
              <View style={styles.subjectRow}>
                <Text style={[styles.subjectNum, { color: ACCENT }]}>{s.order}</Text>
                <Text style={styles.subjectName} numberOfLines={2}>
                  {s.name}
                </Text>
                <Text style={styles.subjectCount}>{s.topics.length} Topics</Text>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Academic goals for students — moved to the BOTTOM (user request
            2026-07-18). */}
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
      </ScrollView>

      {/* Zoom — one subject, large on screen. */}
      <Modal visible={!!zoom} animationType="fade" transparent statusBarTranslucent onRequestClose={() => setZoom(null)}>
        {zoom ? (
          // Centered popup card (user request 2026-07-18) — tap the backdrop or
          // ✕ to close.
          <View style={styles.zoomBackdrop}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => setZoom(null)}
              accessibilityRole="button"
              accessibilityLabel="Dismiss"
            />
            <View style={styles.zoomCard}>
              {/* The whole title header is the close/return action (user request
                  2026-07-18); the ✕ stays as an affordance. */}
              <Pressable
                style={styles.zoomHead}
                onPress={() => setZoom(null)}
                accessibilityRole="button"
                accessibilityLabel="Close and return"
              >
                <Text style={[styles.zoomNum, { color: ACCENT, borderColor: ACCENT }]}>{zoom.order}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.zoomEyebrow}>
                    SUBJECT {zoom.order} · {zoom.topics.length} TOPICS
                  </Text>
                  <Text style={styles.zoomTitle}>{zoom.name}</Text>
                </View>
                <Text style={styles.zoomClose}>✕</Text>
              </Pressable>
              <ScrollView contentContainerStyle={styles.zoomScroll}>
                {zoom.topics.map((t) => (
                  <View key={t.gs} style={styles.zoomTopicRow}>
                    <Text style={[styles.zoomTopicNum, { color: ACCENT }]}>
                      {zoom.order}.{t.order}
                    </Text>
                    <Text style={styles.zoomTopicText}>{t.name}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        ) : null}
        <LowLightDim />
      </Modal>
    </>
  );
}

/** Standalone screen wrapper (kept for the direct route) — header + body. */
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
      <CurriculumView showBrand />
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
  // More vertical breathing room between the logo, intro, and each container
  // (user request 2026-07-18).
  scroll: { padding: 20, gap: 34 },

  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandWordmark: { fontFamily: fonts.oswaldBold, fontSize: 14, letterSpacing: 0.6, color: colors.textPrimary },
  brandAccent: { fontFamily: fonts.oswaldMedium, color: colors.amber },
  // Logo + intro grouped; small internal gap keeps the intro tight to the logo.
  introBlock: { gap: 10 },
  // White heading above the intro — matches the Specialization / Program pages
  // (user request 2026-07-18).
  introTitle: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 21,
    letterSpacing: 0.4,
    color: colors.textPrimary,
  },
  curriculumIntro: { fontFamily: fonts.barlowMedium, fontSize: 17.5, lineHeight: 26, color: colors.textSecondary },

  // Everything below the intro is enlarged (user request 2026-07-18).
  section: { gap: 12 },
  sectionEyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 2.2, color: colors.amberLabel },
  sectionIntro: { fontFamily: fonts.barlowMedium, fontSize: 16.5, lineHeight: 24, color: colors.textSub, marginBottom: 2 },

  goalRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  goalBullet: { fontFamily: fonts.oswaldSemiBold, fontSize: 16, color: colors.amber, lineHeight: 26 },
  goalText: { flex: 1, fontFamily: fonts.barlowMedium, fontSize: 17.5, lineHeight: 26, color: colors.textSecondary },

  // Subject rows — tap to open the centered popup.
  subjectCard: {
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#232323',
    borderRadius: 9,
    marginTop: 6,
    overflow: 'hidden',
  },
  subjectRow: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 13, paddingHorizontal: 13 },
  // Number is amber, subject title white (user request 2026-07-18); both larger.
  subjectNum: { fontFamily: fonts.oswaldBold, fontSize: 18, minWidth: 26, textAlign: 'center', color: colors.amber },
  subjectName: { flex: 1, fontFamily: fonts.oswaldMedium, fontSize: 18, color: colors.textPrimary },
  subjectCount: { fontFamily: fonts.barlowRegular, fontSize: 14.5, color: colors.textSub, textAlign: 'right' },

  // Centered subject popup (user request 2026-07-18).
  zoomBackdrop: {
    flex: 1,
    // Backdrop dimmed to ~10% brightness so the popup stands out (user request
    // 2026-07-18).
    backgroundColor: 'rgba(0,0,0,0.90)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  zoomCard: {
    width: '100%',
    maxWidth: 460,
    maxHeight: '80%',
    backgroundColor: '#0c0b09',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2a2820',
    overflow: 'hidden',
  },
  zoomHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#26241d',
  },
  zoomNum: {
    fontFamily: fonts.oswaldBold,
    fontSize: 22,
    minWidth: 42,
    textAlign: 'center',
    borderWidth: 1.5,
    borderRadius: 8,
    paddingVertical: 5,
    overflow: 'hidden',
  },
  // More gap between the "SUBJECT # · # TOPICS" line and the title below it
  // (user request 2026-07-18).
  zoomEyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.4, color: colors.textSub, marginBottom: 8 },
  zoomTitle: { fontFamily: fonts.oswaldMedium, fontSize: 26, lineHeight: 30, color: colors.textPrimary },
  zoomClose: { fontFamily: fonts.oswaldSemiBold, fontSize: 24, color: colors.textSubAlt },
  zoomScroll: { paddingHorizontal: 16, paddingVertical: 16, gap: 12 },
  zoomTopicRow: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  zoomTopicNum: { fontFamily: fonts.mono, fontSize: 17, lineHeight: 27, minWidth: 54 },
  zoomTopicText: { flex: 1, fontFamily: fonts.barlowMedium, fontSize: 19, lineHeight: 28, color: colors.textSecondary },
});
