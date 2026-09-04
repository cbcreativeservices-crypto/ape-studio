/**
 * Curriculum — overview stats + the full LIVE v3 curriculum tree, organized
 * FIELD → SUBJECT → TOPIC (owner 2026-08-06; the v2 course/topic matrix is
 * retired). Fetched at runtime from Supabase (fetchV3Curriculum).
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
import { fetchV3Curriculum, fetchV3Programs, fetchV3Certs, type V3Field } from '../../data/v3Curriculum';
import { subjectMeta } from '../../data/subjectMeta';
import { useCurriculumStats } from '../../features/curriculum/curriculumStats';
import { toggleTopic, useEnrollment } from '../../features/enrollment/enrollmentStore';
import { useNavigation } from '@react-navigation/native';
import { CAREER_COUNT, familyFieldOf } from '../../features/careerfinder/careerIndex';
import { QUESTIONS, QUESTION_COUNT } from '../../features/careerfinder/questions';
import { computeResult } from '../../features/careerfinder/scoring';
import { useCareerFinder } from '../../features/careerfinder/store';

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

// One-time count-up (owner 2026-08-10): the GLOSSARY TERMS figure counts up
// ONCE — slowly, ease-out — to its real value, then holds forever. No looping
// (the old placeholder wrapped every ~1.8 s, so it appeared to count up twice).
// A module-level guard makes it animate at most once per app session, so
// swiping back to this page (it's page 1 of the Awards pager) shows the final
// number immediately instead of re-running the gimmick.
const countedOnce = new Set<string>();

function CountUp({ id, target, color }: { id: string; target: number | null; color: string }) {
  const done = countedOnce.has(id);
  const [n, setN] = useState<number | null>(done ? target : null);
  useEffect(() => {
    if (target == null) return; // still loading — show the placeholder dash
    if (done) {
      setN(target);
      return;
    }
    countedOnce.add(id);
    const DURATION = 2000; // ms — slow, single pass
    const start = Date.now();
    let raf = 0;
    const step = () => {
      const t = Math.min(1, (Date.now() - start) / DURATION);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic — fast then settles
      setN(Math.round(eased * target));
      if (t < 1) raf = requestAnimationFrame(step);
      else setN(target);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [id, target, done]);
  return (
    <Text style={[styles.statValue, { color }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
      {n == null ? '—' : fmt(n)}
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
  const navigation = useNavigation();
  const [open, setOpen] = useState<number | null>(null);
  // The Career Finder entry is collapsed by default (owner 2026-09-04): the
  // reader taps to reveal the green container.
  const [finderOpen, setFinderOpen] = useState(false);
  // The Career Finder card speaks to where THIS person is: a first pitch, a
  // "you're at question n", or their own top family (the cheapest re-entry
  // into family → topic → membership).
  const finderRec = useCareerFinder();
  const finder = useMemo(() => {
    const answered = QUESTIONS.filter((q) => q.id in finderRec.responses).length;
    if (finderRec.completed && answered > 0) {
      const top = computeResult(finderRec.responses, familyFieldOf).top[0]?.family.name;
      return top
        ? { blurb: `Your top match: ${top} — and four more.`, pill: 'RESULTS ›', a11y: `Audio Career Finder, Beta. Your top match: ${top}. Opens your results.` }
        : { blurb: 'Your results are ready.', pill: 'RESULTS ›', a11y: 'Audio Career Finder, Beta. Opens your results.' };
    }
    if (answered > 0) {
      return { blurb: `You’re at question ${Math.min(QUESTION_COUNT, finderRec.index + 1)} of ${QUESTION_COUNT}. Your answers are saved.`, pill: 'CONTINUE ›', a11y: `Audio Career Finder, Beta. Continue at question ${finderRec.index + 1} of ${QUESTION_COUNT}.` };
    }
    return { blurb: `Which kinds of audio work would you enjoy? ${QUESTION_COUNT} questions, 42 career families, ${fmt(CAREER_COUNT)} ways to work in audio. About five minutes.`, pill: 'START ›', a11y: `Audio Career Finder, Beta. ${QUESTION_COUNT} questions, forty-two career families, ${fmt(CAREER_COUNT)} ways to work in audio. Free, about five minutes.` };
  }, [finderRec]);
  // Enrollment list (user request): tapping a topic here adds/removes it, exactly
  // like the Enrollments "Browse & Add" list. Ungated — free users build a list
  // too. `toggleTopic` persists + syncs (signed-in) via the shared store.
  const enrolled = useEnrollment();
  const enrolledGs = useMemo(() => new Set(enrolled.map((e) => e.gs)), [enrolled]);

  // LIVE v3 curriculum (owner 2026-08-06) — replaces the retired v2 matrix.
  const [v3Subjects, setV3Subjects] = useState<{ order: number; name: string; field: string; topics: { gs: number; name: string }[] }[]>([]);
  const [credCounts, setCredCounts] = useState<{ programs: number; certs: number }>({ programs: 0, certs: 0 });
  useEffect(() => {
    let alive = true;
    void fetchV3Curriculum().then((fields: V3Field[]) => {
      if (!alive) return;
      let order = 0;
      const flat = fields.flatMap((f) =>
        f.subjects.map((s) => ({ order: order++, name: s.subject, field: f.field, topics: s.topics.map((t) => ({ gs: t.gs, name: t.name })) })),
      );
      setV3Subjects(flat);
    });
    void Promise.all([fetchV3Programs(), fetchV3Certs()]).then(([p, c]) => {
      if (alive) setCredCounts({ programs: p.length, certs: c.length });
    });
    return () => {
      alive = false;
    };
  }, []);

  const allGs = useMemo(() => v3Subjects.flatMap((s) => s.topics.map((t) => t.gs)), [v3Subjects]);
  const stats = useCurriculumStats(allGs);
  const subjectsAZ = v3Subjects; // already Field → Subject order

  // Dev Visual Index: auto-expand the first subject for preview (TEMPORARY).
  useEffect(() => {
    if (consumeDevPreview('curriculum:zoom')) setOpen(v3Subjects[0]?.order ?? null);
  }, [v3Subjects]);

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
            { v: stats.totalTerms != null ? fmt(stats.totalTerms) : '—', label: 'GLOSSARY TERMS', color: '#37e05f', countUp: stats.totalTerms },
            { v: allGs.length || '—', label: 'STUDY TOPICS', color: colors.textPrimary },
            { v: subjectsAZ.length || '—', label: 'SUBJECT CATEGORIES', color: '#ffc64d' },
            { v: credCounts.certs || '—', label: 'CERTIFICATES AVAILABLE', color: '#5bb0ff', nav: 'specialization' },
            { v: credCounts.programs || '—', label: 'PROGRAMS AVAILABLE', color: '#c4a2ff', nav: 'program' },
          ] as { v: string | number; label: string; color: string; nav?: 'specialization' | 'program'; countUp?: number | null }[]
        ).map((s) => {
          const inner = (
            <>
              {s.countUp !== undefined ? (
                <CountUp id="glossaryTerms" target={s.countUp} color={s.color} />
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

      {/* Audio Career Finder entry (owner brief 2026-09-03: "where I circled" —
          between the intro and SUBJECTS). Collapsed by default (owner
          2026-09-04): a neutral header the reader taps to reveal the green
          container; the green treatment + blurb + open button appear only when
          expanded. Free for everyone; the button opens the Career Discovery Lab. */}
      <View style={[styles.finderCard, finderOpen && styles.finderCardOpen]}>
        <Pressable
          style={styles.finderHeader}
          onPress={() => setFinderOpen((o) => !o)}
          accessibilityRole="button"
          accessibilityState={{ expanded: finderOpen }}
          accessibilityLabel={finderOpen ? 'Collapse the Audio Career Finder' : `Audio Career Finder, Beta. Tap to expand. ${finder.a11y}`}
        >
          <View style={styles.finderText}>
            <View style={styles.finderEyebrowRow}>
              <Text style={styles.finderEyebrow}>CAREER DISCOVERY LAB · FREE</Text>
              <View style={styles.finderBeta}><Text style={styles.finderBetaText}>BETA</Text></View>
            </View>
            <Text style={styles.finderTitle}>Audio Career Finder</Text>
          </View>
          <Text style={[styles.finderChevron, finderOpen && { color: colors.green }]}>{finderOpen ? '▾' : '▸'}</Text>
        </Pressable>
        {finderOpen ? (
          <View style={styles.finderBody}>
            <Text style={styles.finderBlurb}>{finder.blurb}</Text>
            <Pressable
              style={styles.finderPill}
              onPress={() => (navigation as { navigate: (name: 'CareerFinder') => void }).navigate('CareerFinder')}
              accessibilityRole="button"
              accessibilityLabel={finder.a11y}
            >
              <Text style={styles.finderPillText}>{finder.pill}</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      {/* Amber "Subjects" subtitle above the list (user request 2026-07-22). */}
      <Text style={styles.subjectsHead}>SUBJECTS</Text>

      {/* Curriculum tree — each subject expands inline. */}
      <View style={styles.tree}>
        {subjectsAZ.map((s, i) => {
          const isOpen = open === s.order;
          const meta = subjectMeta(s.name);
          const terms = termsForSubject(s.topics);
          const showField = i === 0 || subjectsAZ[i - 1].field !== s.field;
          return (
            <View key={s.order} style={styles.subjectCard}>
              {showField ? <Text style={styles.fieldHead}>{s.field.toUpperCase()}</Text> : null}
              <Pressable
                style={styles.subjectRow}
                onPress={() => setOpen((prev) => (prev === s.order ? null : s.order))}
                accessibilityRole="button"
                accessibilityState={{ expanded: isOpen }}
                accessibilityLabel={`${s.name}, ${s.topics.length} ${s.topics.length === 1 ? 'topic' : 'topics'}`}
              >
                <Text style={styles.subjectChevron}>{isOpen ? '▾' : '▸'}</Text>
                <Text style={styles.subjectName} numberOfLines={2}>
                  {s.name}
                </Text>
                <Text style={styles.subjectCount}>{`${s.topics.length} Topic${s.topics.length === 1 ? '' : 's'}`}</Text>
              </Pressable>

              {isOpen ? (
                <View style={styles.expanded}>
                  {meta.description ? <Text style={styles.desc}>{meta.description}</Text> : null}
                  <Text style={styles.metaLine}>
                    {`${s.topics.length} topic${s.topics.length === 1 ? '' : 's'}`} · {terms != null ? `${fmt(terms)} terms` : '— terms'}
                  </Text>

                  <Text style={styles.subLabel}>TOPICS</Text>
                  <Text style={styles.topicHint}>Tap a topic to add it to your enrollments.</Text>
                  {s.topics.map((t) => {
                    const on = enrolledGs.has(t.gs);
                    return (
                      <Pressable
                        key={t.gs}
                        style={styles.topicRow}
                        onPress={() => toggleTopic(t.gs)}
                        accessibilityRole="button"
                        accessibilityState={{ selected: on }}
                        accessibilityLabel={on ? `Remove ${t.name} from enrollments` : `Add ${t.name} to enrollments`}
                      >
                        <Text style={[styles.topicCheck, on && styles.topicCheckOn]}>{on ? '✓' : '+'}</Text>
                        <Text style={[styles.topicText, on && styles.topicTextOn]}>{t.name}</Text>
                      </Pressable>
                    );
                  })}

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
        <Text accessibilityRole="header" style={styles.sectionEyebrow}>ACADEMIC GOALS</Text>
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

  // Audio Career Finder entry card (owner brief 2026-09-03). Same card grammar
  // as the subject cards below, with the amber accent on the left edge so it
  // reads as a destination rather than another expandable subject.
  // The one non-browsing action on Explore. Collapsed it reads like the
  // subject cards below (neutral, a chevron); expanded it becomes the green
  // container the app reserves for a primary action.
  finderCard: { backgroundColor: '#161616', borderWidth: 1, borderColor: '#232323', borderRadius: 10, overflow: 'hidden' },
  finderCardOpen: { backgroundColor: '#17171b', borderColor: colors.green },
  finderHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingLeft: 14, paddingRight: 14 },
  finderText: { flex: 1, gap: 3 },
  finderEyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  finderEyebrow: { fontFamily: fonts.oswaldMedium, fontSize: 10, letterSpacing: 1.6, color: colors.amberLabel },
  finderBeta: { borderWidth: 1, borderColor: colors.amberLabel, borderRadius: 3, paddingHorizontal: 5, paddingVertical: 1 },
  finderBetaText: { fontFamily: fonts.oswaldSemiBold, fontSize: 9, letterSpacing: 1.4, color: colors.amber },
  finderTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 21, color: colors.textPrimary, letterSpacing: 0.3 },
  finderChevron: { fontFamily: fonts.oswaldSemiBold, fontSize: 16, color: colors.textSub, width: 16, textAlign: 'center' },
  finderBody: { paddingHorizontal: 14, paddingBottom: 14, paddingTop: 2, gap: 12 },
  finderBlurb: { fontFamily: fonts.barlowMedium, fontSize: 14, lineHeight: 20, color: colors.textSub },
  finderPill: { alignSelf: 'flex-start', minHeight: 44, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: colors.green, backgroundColor: '#173021', justifyContent: 'center' },
  finderPillText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.green },

  // Tree.
  // Amber "SUBJECTS" subtitle above the subject list (user request 2026-07-22);
  // the negative bottom margin tucks it against the tree (scroll gap is 20).
  subjectsHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 2.2, color: colors.amber, marginBottom: -10 },
  // Field group header in the v3 curriculum tree (owner 2026-08-06).
  fieldHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.6, color: colors.textSub, marginTop: 10, marginBottom: 4 },
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
  topicRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', paddingVertical: 3 },
  topicBullet: { fontFamily: fonts.barlowRegular, fontSize: 15, lineHeight: 22, color: colors.textSub, width: 12 },
  // Tap-to-enroll affordance (mirrors the Enrollments Browse & Add list): '+'
  // when available (white topic), green '✓' once enrolled.
  topicHint: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub, marginBottom: 2 },
  topicCheck: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, lineHeight: 22, color: colors.textSub, width: 14, textAlign: 'center' },
  topicCheckOn: { color: '#37e05f' },
  topicText: { flex: 1, fontFamily: fonts.barlowMedium, fontSize: 14.5, lineHeight: 22, color: colors.textPrimary },
  topicTextOn: { color: '#7dffa1' },
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
