/**
 * Curriculum — the Academy's academic goals plus the full COURSE / TOPIC MATRIX
 * (v2 working SSoT): 26 subjects · 203 topics.
 *
 * 2026-07-22 (user request): a glossary/curriculum OVERVIEW at the top (total
 * terms · topics · subjects) and an expandable curriculum TREE — each subject
 * expands inline to reveal a one-sentence description, topic count + total
 * terms, all topics, and career applications. View-only reference.
 *
 * Rendered ONLY as page 1 of the Awards swipe pager.
 */
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../theme/tokens';
import { BrandLogo } from '../../components/BrandLogo';
import { consumeDevPreview } from '../../features/dev/devPreview';
import { MATRIX_SUBJECTS, MATRIX_SUBJECT_COUNT, MATRIX_TOPIC_COUNT } from '../../data/courseTopicMatrix';
import { PROGRAM_PATHS, SPECIALIZED_CERTIFICATES } from '../awards/awardsData';
import { subjectMeta } from '../../data/subjectMeta';
import { useCurriculumStats } from '../../features/curriculum/curriculumStats';

/** Placeholder academic-goal lines — replace with the Academy's official copy. */
const ACADEMIC_GOALS: string[] = [
  'Build job-ready, professional audio skills grounded in real industry practice.',
  'Master every topic through study and proven assessment, not passive watching.',
  'Progress from single-topic specializations to full professional programs.',
  'Earn stackable, verifiable credentials that map to career pathways.',
  'Prepare graduates for certification, employment, and continued growth.',
];

const CURRICULUM_INTRO_TITLE = 'Explore the Academy Curriculum';
const CURRICULUM_INTRO =
  'Progress is built one topic at a time. Every subject below expands to show its topics, term coverage, and where those skills apply in a professional audio career.';

/** Thousands separator without relying on Intl (limited under Hermes). */
const fmt = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/** Spinning number placeholder shown in the GLOSSARY TERMS tile while the count
 *  loads (owner 2026-08-05, item 3): the digits roll in the same green until the
 *  official count arrives and replaces it. Deterministic (no Math.random). */
function SpinningCount({ color }: { color: string }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 90);
    return () => clearInterval(id);
  }, []);
  const rolling = 10000 + ((tick * 7349) % 89999); // rolling 5-digit value
  return (
    <Text style={[styles.statValue, { color }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
      {fmt(rolling)}
    </Text>
  );
}

/**
 * CurriculumView — overview + expandable curriculum tree + academic goals,
 * WITHOUT a screen header. Rendered as page 1 of the Awards pager. `showBrand`
 * draws the logo/intro block (off in the pager, which shows the logo up top).
 */
export function CurriculumView({
  showBrand = true,
  onOpenCategory,
}: {
  showBrand?: boolean;
  /** Tapping the Certificates / Programs stat tiles jumps the Awards pager to
   *  that page (user request 2026-07-22). */
  onOpenCategory?: (key: 'specialization' | 'program') => void;
}) {
  const insets = useSafeAreaInsets();
  const stats = useCurriculumStats();
  const [open, setOpen] = useState<number | null>(null);

  const subjectsAZ = useMemo(() => [...MATRIX_SUBJECTS].sort((a, b) => a.name.localeCompare(b.name)), []);

  // Dev Visual Index: auto-expand the first subject for preview (TEMPORARY).
  useEffect(() => {
    if (consumeDevPreview('curriculum:zoom')) setOpen(MATRIX_SUBJECTS[0]?.order ?? null);
  }, []);

  const termsForSubject = (topics: { gs: number }[]): number | null => {
    let sum = 0;
    let any = false;
    for (const t of topics) {
      const c = stats.termsByGs.get(t.gs);
      if (c != null) {
        sum += c;
        any = true;
      }
    }
    return any ? sum : null;
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}>
      {/* White intro line above the counters (user request 2026-07-22). */}
      <Text style={styles.discoverHead}>Discover What’s Inside</Text>

      {/* Overview stats ABOVE the intro (user request 2026-07-22): glossary terms
          (green) · study topics (white) · subject categories (yellow) ·
          certificates available (blue) · programs available (purple). */}
      <View style={styles.statsRow}>
        {(
          [
            { v: stats.totalTerms != null ? fmt(stats.totalTerms) : '—', label: 'GLOSSARY TERMS', color: '#37e05f', spin: stats.totalTerms == null },
            { v: MATRIX_TOPIC_COUNT, label: 'STUDY TOPICS', color: colors.textPrimary },
            { v: MATRIX_SUBJECT_COUNT, label: 'SUBJECT CATEGORIES', color: '#ffc64d' },
            { v: SPECIALIZED_CERTIFICATES.length, label: 'CERTIFICATES AVAILABLE', color: '#5bb0ff', nav: 'specialization' },
            { v: PROGRAM_PATHS.length, label: 'PROGRAMS AVAILABLE', color: '#c4a2ff', nav: 'program' },
          ] as { v: string | number; label: string; color: string; nav?: 'specialization' | 'program'; spin?: boolean }[]
        ).map((s) => {
          const inner = (
            <>
              {s.spin ? (
                <SpinningCount color={s.color} />
              ) : (
                <Text style={[styles.statValue, { color: s.color }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
                  {s.v}
                </Text>
              )}
              {/* Second word stacked below the first (user request 2026-07-22). */}
              <Text style={styles.statLabel} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.7}>
                {s.label.replace(' ', '\n')}
              </Text>
            </>
          );
          // Certificates / Programs tiles jump the Awards pager to that page
          // (user request 2026-07-22); the other tiles are read-only.
          return s.nav && onOpenCategory ? (
            <Pressable
              key={s.label}
              style={styles.statTile}
              onPress={() => onOpenCategory(s.nav!)}
              accessibilityRole="button"
              accessibilityLabel={s.label}
            >
              {inner}
            </Pressable>
          ) : (
            <View key={s.label} style={styles.statTile}>
              {inner}
            </View>
          );
        })}
      </View>

      {showBrand ? (
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

      {/* Amber "Subjects" subtitle above the list (user request 2026-07-22). */}
      <Text style={styles.subjectsHead}>SUBJECTS</Text>

      {/* Curriculum tree — each subject expands inline. */}
      <View style={styles.tree}>
        {subjectsAZ.map((s) => {
          const isOpen = open === s.order;
          const meta = subjectMeta(s.name);
          const terms = termsForSubject(s.topics);
          return (
            <View key={s.order} style={styles.subjectCard}>
              <Pressable
                style={styles.subjectRow}
                onPress={() => setOpen((prev) => (prev === s.order ? null : s.order))}
                accessibilityRole="button"
                accessibilityState={{ expanded: isOpen }}
                accessibilityLabel={`${s.name}, ${s.topics.length} topics`}
              >
                <Text style={styles.subjectChevron}>{isOpen ? '▾' : '▸'}</Text>
                <Text style={styles.subjectName} numberOfLines={2}>
                  {s.name}
                </Text>
                <Text style={styles.subjectCount}>{s.topics.length} Topics</Text>
              </Pressable>

              {isOpen ? (
                <View style={styles.expanded}>
                  {meta.description ? <Text style={styles.desc}>{meta.description}</Text> : null}
                  <Text style={styles.metaLine}>
                    {s.topics.length} topics · {terms != null ? `${fmt(terms)} terms` : '— terms'}
                  </Text>

                  <Text style={styles.subLabel}>TOPICS</Text>
                  {s.topics.map((t) => (
                    <View key={t.gs} style={styles.topicRow}>
                      <Text style={styles.topicBullet}>•</Text>
                      <Text style={styles.topicText}>{t.name}</Text>
                    </View>
                  ))}

                  {meta.careers ? (
                    <>
                      <Text style={styles.subLabel}>CAREER APPLICATIONS</Text>
                      <Text style={styles.careers}>{meta.careers}</Text>
                    </>
                  ) : null}
                </View>
              ) : null}
            </View>
          );
        })}
      </View>

      {/* Academic goals — at the bottom. */}
      <View style={styles.section}>
        <Text style={styles.sectionEyebrow}>ACADEMIC GOALS</Text>
        <Text style={styles.sectionIntro}>What the Pro Audio Training Academy sets out to do for every student.</Text>
        {ACADEMIC_GOALS.map((goal) => (
          <View key={goal} style={styles.goalRow}>
            <Text style={styles.goalBullet}>▸</Text>
            <Text style={styles.goalText}>{goal}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, gap: 20 },

  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandWordmark: { fontFamily: fonts.oswaldBold, fontSize: 14, letterSpacing: 0.6, color: colors.textPrimary },
  brandAccent: { fontFamily: fonts.oswaldMedium, color: colors.amber },
  introBlock: { gap: 8 },
  introTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 21, letterSpacing: 0.4, color: colors.textPrimary },
  curriculumIntro: { fontFamily: fonts.barlowMedium, fontSize: 16, lineHeight: 24, color: colors.textSecondary },

  // "Discover What's Inside" white heading above the counters (user request 2026-07-22).
  discoverHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 20, letterSpacing: 0.4, color: colors.textPrimary, textAlign: 'left' },
  // Overview stat tiles (4 now — user request 2026-07-22).
  statsRow: { flexDirection: 'row', gap: 6 },
  statTile: {
    flex: 1,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#262626',
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 3,
    alignItems: 'center',
    gap: 2,
  },
  statValue: { fontFamily: fonts.oswaldBold, fontSize: 20, color: colors.amber, letterSpacing: 0.2 },
  statLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 9, lineHeight: 11, letterSpacing: 0.4, color: colors.textSub, textAlign: 'center' },

  // Tree.
  // Amber "SUBJECTS" subtitle above the subject list (user request 2026-07-22);
  // the negative bottom margin tucks it against the tree (scroll gap is 20).
  subjectsHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 2.2, color: colors.amber, marginBottom: -10 },
  tree: { gap: 8 },
  subjectCard: { backgroundColor: '#161616', borderWidth: 1, borderColor: '#232323', borderRadius: 9, overflow: 'hidden' },
  subjectRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 13 },
  subjectChevron: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, color: colors.textSub, width: 14 },
  // Subject names amber; topics stay white (user request 2026-07-22).
  subjectName: { flex: 1, fontFamily: fonts.oswaldMedium, fontSize: 17, color: colors.amber },
  subjectCount: { fontFamily: fonts.barlowRegular, fontSize: 13.5, color: colors.textSub, textAlign: 'right' },

  expanded: { paddingHorizontal: 14, paddingBottom: 14, paddingTop: 2, gap: 8, borderTopWidth: 1, borderTopColor: '#1e1e1e' },
  desc: { fontFamily: fonts.barlowMedium, fontSize: 15, lineHeight: 22, color: colors.textSecondary, marginTop: 8 },
  metaLine: { fontFamily: fonts.mono, fontSize: 12.5, color: colors.textSub },
  subLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.6, color: colors.amberLabel, marginTop: 4 },
  topicRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  topicBullet: { fontFamily: fonts.barlowRegular, fontSize: 15, lineHeight: 22, color: colors.textSub, width: 12 },
  topicText: { flex: 1, fontFamily: fonts.barlowMedium, fontSize: 14.5, lineHeight: 22, color: colors.textPrimary },
  careers: { fontFamily: fonts.barlowMedium, fontSize: 14.5, lineHeight: 22, color: colors.textSecondary },

  // Academic goals.
  section: { gap: 10 },
  // "Academic Goals" heading — green (user request 2026-07-22).
  sectionEyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 2.2, color: '#37e05f' },
  sectionIntro: { fontFamily: fonts.barlowMedium, fontSize: 15.5, lineHeight: 23, color: colors.textSub, marginBottom: 2 },
  goalRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  goalBullet: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, color: colors.amber, lineHeight: 24 },
  goalText: { flex: 1, fontFamily: fonts.barlowMedium, fontSize: 16, lineHeight: 24, color: colors.textSecondary },
});
