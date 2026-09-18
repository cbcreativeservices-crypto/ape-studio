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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../theme/tokens';
import { BrandLogo } from '../../components/BrandLogo';
import { Modal } from '../../components/DimModal';
import { consumeDevPreview } from '../../features/dev/devPreview';
import { fetchV3Curriculum, fetchV3Programs, fetchV3Certs, type V3Field } from '../../data/v3Curriculum';
import { subjectMeta } from '../../data/subjectMeta';
import { topicCopy } from '../../data/topicCopy';
import { useCurriculumStats } from '../../features/curriculum/curriculumStats';
import { useAcademyStats } from '../../features/curriculum/academyStats';
import { addTopic, removeTopic, useEnrollment } from '../../features/enrollment/enrollmentStore';
import { AboutHomeSheet } from '../about/AboutHomeSheet';
import { markAboutOpened, useAboutOpened } from '../../features/onboarding/attractStore';
import { AttractRing } from '../../features/onboarding/AttractCue';
import { WORKSPACES } from '../lab/calc/registry';
import { totalLabCount } from '../lab/labCatalog';
import { TOOLS } from '../tools/toolsData';
import { TrophyImage } from '../../components/TrophyImage';
import { topicImagePath } from '../../data/topicImages';
import { TopicDetailModal, type TopicDetail } from './TopicDetailModal';
import { InsideStats, fmt, lighten, SILVER, type InsideStat } from './InsideStats';
// (fmt is still used by the Career Finder blurb and the subject term totals.)
import { useNavigation } from '@react-navigation/native';
import { CAREER_COUNT, familyFieldOf } from '../../features/careerfinder/careerIndex';
import { namesGatedRole } from '../../data/gatedRoles';
import { QUESTIONS, QUESTION_COUNT } from '../../features/careerfinder/questions';
import { FAMILY_COUNT } from '../../features/careerfinder/families';
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

/** Overview-sentence counts (owner 2026-09-15). CALC_COUNT = individual
 *  calculators (workspace functions), matching the calc-lab row's own count;
 *  LAB_COUNT = every other lab (totalLabCount includes the calculators hub, so
 *  subtract them to avoid double-counting the two in the same sentence). */
const CALC_COUNT = WORKSPACES.reduce((a, w) => a + w.functions.length, 0);
const LAB_COUNT = Math.max(0, totalLabCount() - CALC_COUNT);
/** Overview count (owner 2026-09-15), from a real registry: TOOL_COUNT = the
 *  Measurement & Analysis tools catalog (the 8 hub tiles; `planned` rows would
 *  be excluded — none today). */
const TOOL_COUNT = TOOLS.filter((t) => !t.planned).length;

/** One topic row (owner 2026-09-15): a topic-art thumbnail + title. Tapping the
 *  row (image or title) opens the standard expanded viewer (TrophyModal).
 *  Explore is browse-only — no enrollment happens here. Shared by the TOPICS tab
 *  and the SUBJECTS expansion so the two lists stay identical. */
function TopicRow({ gs, name, onView }: { gs: number; name: string; onView: () => void }) {
  return (
    <Pressable
      style={styles.topicRow}
      onPress={onView}
      accessibilityRole="button"
      accessibilityLabel={`View ${name} image`}
    >
      <TrophyImage iconUrl={topicImagePath(gs)} size={34} radius={6} fallback={<View style={styles.topicThumbFallback} />} />
      <Text style={styles.topicText}>{name}</Text>
    </Pressable>
  );
}

// The one-time count-up (owner 2026-08-10 ruling: ONCE, slowly, ease-out, never
// looping) now lives in ./InsideStats with the hero module that uses it.

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
  // The Career Finder entry is a button beside SUBJECTS (owner 2026-09-04):
  // tapping it opens the green container as a popup.
  const [showFinder, setShowFinder] = useState(false);
  // Curriculum view split (owner 2026-09-15): TOPICS (flat list of every topic)
  // vs SUBJECTS (the expandable subject → topics tree).
  const [curTab, setCurTab] = useState<'topics' | 'subjects'>('subjects');
  // Tapping the study-topics / subject-categories readouts jumps down to the
  // curriculum list with that tab open (owner 2026-09-15).
  const scrollRef = useRef<ScrollView>(null);
  const tabsY = useRef(0);
  const jumpToTab = useCallback((tab: 'topics' | 'subjects') => {
    setCurTab(tab);
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: Math.max(0, tabsY.current - 10), animated: true }));
  }, []);
  // Topic-art viewer (owner 2026-09-15): tapping a row thumbnail opens the
  // standard expanded image popup (TrophyModal). `list` remembers WHICH list
  // the topic was opened from so the popup's left/right swipe steps through
  // that same order: 'az' = the flat A–Z TOPICS tab, 'tree' = the SUBJECTS
  // tab's topics flattened in display sequence.
  const [viewTopic, setViewTopic] = useState<{ gs: number; name: string; list: 'az' | 'tree' } | null>(null);
  // The Career Finder card speaks to where THIS person is: a first pitch, a
  // "you're at question n", or their own top family (the cheapest re-entry
  // into family → topic → membership).
  const finderRec = useCareerFinder();
  const finder = useMemo((): { blurb: string; pill: string; a11y: string; route: 'CareerFinder' | 'CareerFinderResults' | 'CareerFinderQuiz' } => {
    const answered = QUESTIONS.filter((q) => q.id in finderRec.responses).length;
    if (finderRec.completed && answered > 0) {
      // Returning user: the RESULTS pill lands on their results directly (back
      // from there returns here to Explore), not on the intro pitch.
      const top = computeResult(finderRec.responses, familyFieldOf).top[0]?.family.name;
      return top
        ? { blurb: `Your top match: ${top} — and four more.`, pill: 'RESULTS ›', a11y: `Audio Career Finder, Beta. Your top match: ${top}. Opens your results.`, route: 'CareerFinderResults' }
        : { blurb: 'Your results are ready.', pill: 'RESULTS ›', a11y: 'Audio Career Finder, Beta. Opens your results.', route: 'CareerFinderResults' };
    }
    if (answered > 0) {
      return { blurb: `You’re at question ${Math.min(QUESTION_COUNT, finderRec.index + 1)} of ${QUESTION_COUNT}. Your answers are saved.`, pill: 'CONTINUE ›', a11y: `Audio Career Finder, Beta. Continue at question ${finderRec.index + 1} of ${QUESTION_COUNT}.`, route: 'CareerFinderQuiz' };
    }
    return { blurb: `Which kinds of audio work would you enjoy? ${QUESTION_COUNT} questions, ${FAMILY_COUNT} career families, ${fmt(CAREER_COUNT)} ways to work in audio. About five minutes.`, pill: 'START ›', a11y: `Audio Career Finder, Beta. ${QUESTION_COUNT} questions, ${FAMILY_COUNT} career families, ${fmt(CAREER_COUNT)} ways to work in audio. Free, about five minutes.`, route: 'CareerFinder' };
  }, [finderRec]);

  // LIVE v3 curriculum (owner 2026-08-06) — replaces the retired v2 matrix.
  const [v3Subjects, setV3Subjects] = useState<{ order: number; name: string; field: string; topics: { gs: number; name: string }[] }[]>([]);
  const [credCounts, setCredCounts] = useState<{ programs: number; certs: number }>({ programs: 0, certs: 0 });
  // M15 (2026-09-07): distinguish a failed load from a real empty. fetchV3Curriculum
  // swallows errors and returns [], and a real v3 curriculum is NEVER empty (171
  // topics), so an empty result reliably means offline/failed — surface a Retry
  // instead of a blank subject tree that reads as "nothing here".
  const [curriculumState, setCurriculumState] = useState<'loading' | 'ready' | 'error'>('loading');
  const loadCurriculum = useCallback(async () => {
    setCurriculumState('loading');
    try {
      const fields: V3Field[] = await fetchV3Curriculum();
      let order = 0;
      const flat = fields.flatMap((f) =>
        f.subjects.map((s) => ({ order: order++, name: s.subject, field: f.field, topics: s.topics.map((t) => ({ gs: t.gs, name: t.name })) })),
      );
      setV3Subjects(flat);
      setCurriculumState(flat.length > 0 ? 'ready' : 'error');
    } catch {
      setCurriculumState('error');
    }
  }, []);
  useEffect(() => {
    let alive = true;
    void loadCurriculum();
    void Promise.all([fetchV3Programs(), fetchV3Certs()]).then(([p, c]) => {
      if (alive) setCredCounts({ programs: p.length, certs: c.length });
    });
    return () => {
      alive = false;
    };
  }, [loadCurriculum]);

  const allGs = useMemo(() => v3Subjects.flatMap((s) => s.topics.map((t) => t.gs)), [v3Subjects]);
  // Every topic, flattened + A–Z, for the TOPICS tab.
  const allTopics = useMemo(
    () => v3Subjects.flatMap((s) => s.topics).sort((a, b) => a.name.localeCompare(b.name)),
    [v3Subjects],
  );
  // Every topic in SUBJECTS-tab display sequence (Field → Subject → Topic) —
  // the swipe order for a topic opened from that tab.
  const treeTopics = useMemo(() => v3Subjects.flatMap((s) => s.topics), [v3Subjects]);
  const stats = useCurriculumStats(allGs);
  // Nightly-precomputed counts → INSTANT hero (cached, zero spinner). Live
  // curriculum/credential fetches below are the first-run fallback only.
  const academy = useAcademyStats();
  // Reactive enrolled-topic set, so the topic modal's Enroll button reflects
  // enrolment live (owner 2026-09-15).
  const enrolledList = useEnrollment();
  const enrolledGs = useMemo(() => new Set(enrolledList.map((e) => e.gs)), [enrolledList]);
  const subjectsAZ = v3Subjects; // already Field → Subject order
  // Build a TopicDetail (subject/field + term coverage + Computer C per-topic
  // copy, keyed by gs in src/data/topicCopy.ts) for a topic. Used for the open
  // topic and for its swipe neighbours.
  const buildTopicDetail = useCallback(
    (t: { gs: number; name: string }): TopicDetail => {
      const subj = v3Subjects.find((s) => s.topics.some((x) => x.gs === t.gs));
      const copy = topicCopy(t.gs);
      return {
        gs: t.gs,
        name: t.name,
        subjectName: subj?.name ?? null,
        field: subj?.field ?? null,
        description: copy?.description ?? null,
        roles: copy?.roles ?? [],
        terms: stats.termsByGs.get(t.gs) ?? null,
      };
    },
    [v3Subjects, stats],
  );
  // The open topic + its neighbours in the browsed list, for the swipe pager
  // (owner 2026-09-15). Neighbours are null at a list end (no wrap).
  const topicView = useMemo(() => {
    if (!viewTopic) return { current: null as TopicDetail | null, prev: null as TopicDetail | null, next: null as TopicDetail | null };
    const list = viewTopic.list === 'az' ? allTopics : treeTopics;
    const i = list.findIndex((t) => t.gs === viewTopic.gs);
    const current = buildTopicDetail(viewTopic);
    return {
      current,
      prev: i > 0 ? buildTopicDetail(list[i - 1]) : null,
      next: i >= 0 && i < list.length - 1 ? buildTopicDetail(list[i + 1]) : null,
    };
  }, [viewTopic, allTopics, treeTopics, buildTopicDetail]);
  const onTopicStep = useCallback(
    (dir: 1 | -1) => {
      if (!viewTopic) return;
      const list = viewTopic.list === 'az' ? allTopics : treeTopics;
      const i = list.findIndex((t) => t.gs === viewTopic.gs);
      const to = i + dir;
      if (i < 0 || to < 0 || to >= list.length) return;
      setViewTopic({ gs: list[to].gs, name: list[to].name, list: viewTopic.list });
    },
    [viewTopic, allTopics, treeTopics],
  );

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

  // TEMPORARY (owner 2026-09-15): a first-run "About the Academy" link to the
  // right of the Discover heading. Shows until the About sheet has been viewed
  // by EITHER path — this link or the Home "About" button — since both call
  // markAboutOpened(); once viewed it retires permanently (device-local).
  const aboutOpened = useAboutOpened();
  const [aboutSheet, setAboutSheet] = useState(false);

  // The 3×3 spec grid under the headline glossary figure (reading order). A
  // count that is still loading (or has no confirmed source) is null → dash.
  // Certificates / Programs jump the Awards pager to their page (the original
  // stat-tile behaviour, user request 2026-07-22) when the pager provides it.
  // Owner revision 2026-09-15: the former overview SENTENCES are folded into
  // these labels — each figure is paired with its descriptor so number and
  // meaning read as one line; nothing is restated below the grid.
  // Hub-and-spoke order (owner concept 2026-09-15) = the diagram's bands:
  // top 4 (curriculum) · sides 2 (calculators · labs) · bottom 3 (practice).
  // Monochrome (owner refinement the same day): no per-metric colours or icons.
  // Eight ring metrics in the owner's clock order (2026-09-15): 12 topics ·
  // 1:30 certificates · 3 programs · 4:30 labs · 6 questions · 7:30 tools ·
  // 9 calculators · 10:30 subjects. Study methods was dropped per owner. Tones:
  // topics white · certificates full-app blue · programs purple · subjects
  // amber · the rest silver; the glossary core (green) lives in InsideStats.
  const insideGrid = useMemo((): InsideStat[] => [
    { id: 'topics', value: academy.topics ?? (allGs.length || null), label: 'study topics', labelParts: [{ text: 'study', color: colors.blue }, { text: ' topics' }], tone: colors.textPrimary, labelTone: colors.textSecondary, onPress: () => jumpToTab('topics'), a11yLabel: `${academy.topics ?? (allGs.length || 'Loading')} study topics. Jumps to the topics list.` },
    {
      id: 'certs',
      value: academy.certificates ?? (credCounts.certs || null),
      label: 'specialist certificates',
      labelParts: [{ text: 'specialist ' }, { text: 'certificates', color: colors.blue }],
      tone: colors.textPrimary,
      labelTone: colors.textSecondary,
      onPress: onOpenCategory ? () => onOpenCategory('specialization') : undefined,
      a11yLabel: onOpenCategory ? `${academy.certificates ?? (credCounts.certs || 'Loading')} specialist certificates. Opens the Certificates page.` : undefined,
    },
    {
      id: 'programs',
      value: academy.programs ?? (credCounts.programs || null),
      label: 'full programs',
      labelParts: [{ text: 'full ' }, { text: 'programs', color: colors.purple }],
      tone: colors.textPrimary,
      labelTone: colors.textSecondary,
      onPress: onOpenCategory ? () => onOpenCategory('program') : undefined,
      a11yLabel: onOpenCategory ? `${academy.programs ?? (credCounts.programs || 'Loading')} full programs. Opens the Programs page.` : undefined,
    },
    { id: 'labs', value: LAB_COUNT || null, label: 'Audio Learning\nLabs', labelParts: [{ text: 'Audio Learning\n' }, { text: 'Labs', color: colors.green }], tone: colors.textPrimary, a11yLabel: `${LAB_COUNT} audio learning labs` },
    { id: 'questions', value: academy.questions ?? stats.totalQuestions, label: 'practice questions', tone: SILVER },
    { id: 'tools', value: TOOL_COUNT, label: 'pro measurement\ntools', labelParts: [{ text: 'pro measurement\n' }, { text: 'tools', color: colors.green }], tone: colors.textPrimary, a11yLabel: `${TOOL_COUNT} pro measurement tools` },
    { id: 'calcs', value: CALC_COUNT, label: 'pro audio\ncalculators', labelParts: [{ text: 'pro audio\n' }, { text: 'calculators', color: colors.purple }], tone: colors.textPrimary, a11yLabel: `${CALC_COUNT} pro audio calculators` },
    { id: 'subjects', value: academy.subjects ?? (subjectsAZ.length || null), label: 'subject categories', labelParts: [{ text: 'subject', color: colors.amber }, { text: ' categories' }], tone: colors.textPrimary, labelTone: colors.textSecondary, onPress: () => jumpToTab('subjects'), a11yLabel: `${academy.subjects ?? (subjectsAZ.length || 'Loading')} subject categories. Jumps to the subjects list.` },
  ], [academy, allGs.length, subjectsAZ.length, credCounts.certs, credCounts.programs, stats.totalQuestions, onOpenCategory, jumpToTab]);

  return (
    <>
    <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}>
      {/* White intro line above the counters (user request 2026-07-22). */}
      <View style={styles.discoverRow}>
        <Text style={styles.discoverHead}>Discover What’s Inside</Text>
      </View>

      {/* About the Academy + Membership — a thin shared row just below the title
          and above the hero (owner 2026-09-15). */}
      <View style={styles.aboutRow}>
        <Pressable
          onPress={() => {
            markAboutOpened();
            setAboutSheet(true);
          }}
          hitSlop={8}
          style={[styles.aboutCta, styles.halfFlex]}
          accessibilityRole="button"
          accessibilityLabel="About the Academy"
        >
          <AttractRing active={!aboutOpened} />
          <Text style={styles.aboutCtaText} numberOfLines={1}>About the Academy</Text>
        </Pressable>
        <Pressable
          style={[styles.membershipCta, styles.halfFlex]}
          onPress={() => (navigation as { navigate: (name: 'Paywall') => void }).navigate('Paywall')}
          accessibilityRole="button"
          accessibilityLabel="Membership"
        >
          <Text style={styles.membershipText} numberOfLines={1}>Membership</Text>
        </Pressable>
      </View>

      {/* "Academy at a Glance" hero (owner concept 2026-09-15): a HUB-AND-SPOKE
          diagram — the glossary is the centre of the academy and every other
          figure connects to it by a spoke in its own colour (see ./InsideStats
          for the phone-width band layout). Every figure comes from a real
          source (state, registries, or a definer RPC); a figure with no source
          renders a placeholder dash, never an invented number. Palette is
          monochrome (owner refinement 2026-09-15): white figures, muted labels,
          hairline spokes; the hub ring is the single amber accent. */}
      <InsideStats
        hero={{ id: 'terms', value: academy.terms ?? stats.totalTerms }}
        satellites={insideGrid}
      />

      {/* Audio Career Finder — its own thin full-width row below the hero
          (owner 2026-09-15). */}
      <Pressable
        style={styles.finderContainer}
        onPress={() => setShowFinder(true)}
        accessibilityRole="button"
        accessibilityLabel={finder.a11y}
      >
        <Text style={styles.finderContainerText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{`Career Finder - ${fmt(CAREER_COUNT)} possible Careers in audio - click here`}</Text>
      </Pressable>

      {/* Curriculum section head — an amber eyebrow with a rule sets the
          section off from the hero module above (redesign 2026-09-15). */}
      <View style={styles.introBlock}>
        {showBrand ? (
          <View style={styles.brandRow}>
            <BrandLogo size={34} />
            <Text style={styles.brandWordmark}>
              PRO AUDIO <Text style={styles.brandAccent}>TRAINING ACADEMY</Text>
            </Text>
          </View>
        ) : null}
        <View style={styles.sectionHeadRow}>
          <Text style={styles.sectionHeadEyebrow}>CURRICULUM</Text>
          <View style={styles.sectionHeadLine} />
        </View>
        <Text accessibilityRole="header" style={styles.introTitle}>{CURRICULUM_INTRO_TITLE}</Text>
        <Text style={styles.curriculumIntro}>{CURRICULUM_INTRO}</Text>
      </View>

      {/* Amber "Subjects" subtitle above the list (user request 2026-07-22).
          The Audio Career Finder moved up to its own full-width container
          (owner 2026-09-15), so this row is now just the SUBJECTS heading. */}
      {/* Curriculum split tabs (owner 2026-09-15): TOPICS (flat list) |
          SUBJECTS (expandable tree). */}
      <View style={styles.curTabs} onLayout={(e) => { tabsY.current = e.nativeEvent.layout.y; }}>
        <Pressable
          style={[styles.curTab, curTab === 'topics' && styles.curTabActive]}
          onPress={() => setCurTab('topics')}
          accessibilityRole="tab"
          accessibilityState={{ selected: curTab === 'topics' }}
          accessibilityLabel="Topics"
        >
          <Text style={[styles.curTabText, curTab === 'topics' && styles.curTabTextActive]}>
            {`TOPICS${allTopics.length ? ` · ${allTopics.length}` : ''}`}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.curTab, curTab === 'subjects' && styles.curTabActive]}
          onPress={() => setCurTab('subjects')}
          accessibilityRole="tab"
          accessibilityState={{ selected: curTab === 'subjects' }}
          accessibilityLabel="Subjects"
        >
          <Text style={[styles.curTabText, curTab === 'subjects' && styles.curTabTextActive]}>
            {`SUBJECTS${subjectsAZ.length ? ` · ${subjectsAZ.length}` : ''}`}
          </Text>
        </Pressable>
      </View>

      {/* M15 (2026-09-07): loading / error states, distinct from a real (never-
          occurring) empty, so a failed load offers Retry instead of a blank tree. */}
      {curriculumState === 'loading' && subjectsAZ.length === 0 ? (
        <View style={styles.treeStatus}>
          <ActivityIndicator color={colors.amber} />
          <Text style={styles.treeStatusText}>Loading the curriculum…</Text>
        </View>
      ) : curriculumState === 'error' ? (
        <View style={styles.treeStatus}>
          <Text style={styles.treeStatusText}>
            Couldn’t load the curriculum — check your connection.
          </Text>
          <Pressable
            style={styles.treeRetry}
            onPress={() => void loadCurriculum()}
            accessibilityRole="button"
            accessibilityLabel="Retry loading the curriculum"
          >
            <Text style={styles.treeRetryText}>RETRY</Text>
          </Pressable>
        </View>
      ) : null}

      {/* TOPICS tab — flat A–Z list of every topic; tap to enroll. */}
      {curTab === 'topics' ? (
        <View style={styles.tree}>
          {allTopics.map((t) => (
            <TopicRow key={t.gs} gs={t.gs} name={t.name} onView={() => setViewTopic({ gs: t.gs, name: t.name, list: 'az' })} />
          ))}
        </View>
      ) : (
      /* SUBJECTS tab — each subject expands inline. */
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
                // RN-web drops accessibilityState; aria-expanded reaches the DOM (C1-05).
                aria-expanded={isOpen}
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
                  {s.topics.map((t) => (
                    <TopicRow key={t.gs} gs={t.gs} name={t.name} onView={() => setViewTopic({ gs: t.gs, name: t.name, list: 'tree' })} />
                  ))}

                  {meta.careers ? (
                    <>
                      <Text style={styles.subLabel}>CAREER APPLICATIONS</Text>
                      <Text style={styles.careers}>{meta.careers}</Text>
                      {/* REQUIRED-EDUCATION DISCLOSURE (hard rule; added here
                          2026-09-17, pass 5). This list is plain prose — it has
                          no `requires` codes and no per-role labels — and six
                          of the fifty name roles the app's OWN COPY classifies
                          as gated: acoustician, research acoustician,
                          bioacoustics researcher, archivist and rigger. The rule
                          is that required education is stated ALWAYS and EVERY
                          time, so the line goes on the whole list rather than
                          leaving five roles bare. */}
                      {namesGatedRole(meta.careers) ? (
                        <Text style={styles.careersNote}>
                          ⚠ Some of these are licensed, certified or degree-entry occupations. Academy
                          study supports them but does not lead to that credential — check what is
                          required where you live.
                        </Text>
                      ) : null}
                    </>
                  ) : null}
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
      )}

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

    {/* Audio Career Finder popup (owner 2026-09-04): the green container, shown
        from the SUBJECTS-row button. The button navigates to the Lab at the
        screen the pill names (start / continue / results). */}
    <Modal accessibilityViewIsModal visible={showFinder} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setShowFinder(false)}>
      <View style={styles.finderBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowFinder(false)} accessibilityRole="button" accessibilityLabel="Dismiss" />
        <View style={styles.finderModal}>
          <View style={styles.finderEyebrowRow}>
            <Text style={styles.finderEyebrow}>CAREER DISCOVERY LAB · FREE</Text>
            <View style={styles.finderBeta}><Text style={styles.finderBetaText}>BETA</Text></View>
          </View>
          <Text style={styles.finderTitle}>Audio Career Finder</Text>
          <Text style={styles.finderBlurb}>{finder.blurb}</Text>
          <Pressable
            style={styles.finderStart}
            onPress={() => { setShowFinder(false); (navigation as { navigate: (name: typeof finder.route) => void }).navigate(finder.route); }}
            accessibilityRole="button"
            accessibilityLabel={finder.a11y}
          >
            <Text style={styles.finderStartText}>{finder.pill}</Text>
          </Pressable>
          <Pressable style={styles.finderClose} onPress={() => setShowFinder(false)} accessibilityRole="button" accessibilityLabel="Not now">
            <Text style={styles.finderCloseText}>NOT NOW</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
    {/* Topic expanded view (owner 2026-09-15): image + term coverage + subject/
        field + where the skills apply. View-only, no links. */}
    <TopicDetailModal
      topic={topicView.current}
      prev={topicView.prev}
      next={topicView.next}
      onStep={onTopicStep}
      onClose={() => setViewTopic(null)}
      onEnrollTopic={(gs) => (enrolledGs.has(gs) ? removeTopic(gs) : addTopic(gs))}
      isTopicEnrolled={(gs) => enrolledGs.has(gs)}
    />
    {/* About sheet opened by the temporary "About the Academy" link above. Same
        sheet the Home "About" button shows. */}
    <AboutHomeSheet visible={aboutSheet} onClose={() => setAboutSheet(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, gap: 20 },

  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandWordmark: { fontFamily: fonts.oswaldBold, fontSize: 14, letterSpacing: 0.6, color: colors.textPrimary },
  brandAccent: { fontFamily: fonts.oswaldMedium, color: colors.amber },
  introBlock: { gap: 8, marginTop: 4 },
  sectionHeadRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionHeadEyebrow: { fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 2.2, color: colors.amberLabel },
  sectionHeadLine: { flex: 1, height: 1, backgroundColor: colors.hairlineDim },
  introTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 22, letterSpacing: 0.4, color: colors.textPrimary },
  curriculumIntro: { fontFamily: fonts.barlowMedium, fontSize: 16, lineHeight: 24, color: colors.textSecondary },

  // "Discover What's Inside" white heading above the hero module (user request
  // 2026-07-22; page title weight 2026-09-15). Row so the "About the Academy"
  // chip sits to the RIGHT of the title.
  discoverRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  discoverHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 24, letterSpacing: 0.4, color: colors.textPrimary, textAlign: 'left', flexShrink: 1 },
  // Temporary first-run "About the Academy" link (owner 2026-09-15). Same chip
  // grammar as the Home Explore chip (awardBtn): dark face + gray base border,
  // radius 8 so the overlaid AttractRing hugs it; the breathing amber ring/glow
  // + amber label ARE the Explore-chip cue. Retires once About is viewed.
  aboutCta: {
    borderRadius: 8,
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: colors.hairline,
    minHeight: 34,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // About + Membership: a thin two-up row above the hero (owner 2026-09-15).
  aboutRow: { flexDirection: 'row', alignItems: 'stretch', justifyContent: 'space-between' },
  halfFlex: { width: '48.5%' },
  // Membership → the academy upgrade paywall. Purple.
  membershipCta: {
    minHeight: 34,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: '#161616',
    alignItems: 'center',
    justifyContent: 'center',
  },
  membershipText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 0.6, color: colors.purple, textAlign: 'center' },
  // Label stays amber permanently (owner 2026-09-15); only the breathing ring
  // cue retires once About is viewed.
  aboutCtaText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 0.5, color: colors.amber, textAlign: 'center' },

  // Audio Career Finder entry card (owner brief 2026-09-03). Same card grammar
  // as the subject cards below, with the amber accent on the left edge so it
  // reads as a destination rather than another expandable subject.
  // SUBJECTS label + the Audio Career Finder button on one row (owner
  // 2026-09-04). The negative bottom margin that tucked SUBJECTS against the
  // tree now lives on the row.
  subjectsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: -10 },
  // The green-outlined entry button — the one non-browsing action on Explore,
  // so it takes the green the app reserves for a primary action.
  // The overview sentences (owner 2026-09-15) were consolidated INTO the hero
  // grid's labels on the owner's same-day revision — see ./InsideStats.
  // Audio Career Finder full-width container (owner 2026-09-15): green chip
  // grammar (matches the old button's colours) at full width above the
  // curriculum, label left + BETA, arrow right.
  finderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 34,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.green,
    backgroundColor: '#173021',
  },
  finderContainerText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 0.4, color: colors.green, textAlign: 'center' },
  // Curriculum split tabs (owner 2026-09-15): TOPICS | SUBJECTS segmented row.
  curTabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#2c2c2c' },
  curTab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  curTabActive: { borderBottomColor: colors.amber },
  curTabText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 2, color: colors.textSub },
  curTabTextActive: { color: colors.amber },
  finderBtnBeta: { borderWidth: 1, borderColor: 'rgba(55,224,95,.6)', borderRadius: 3, paddingHorizontal: 4, paddingVertical: 1 },
  finderBtnBetaText: { fontFamily: fonts.oswaldSemiBold, fontSize: 8, letterSpacing: 1, color: colors.greenBright },
  // Career Finder popup — the green container, shown from the button.
  finderBackdrop: { flex: 1, backgroundColor: 'rgba(8,8,10,0.72)', alignItems: 'center', justifyContent: 'center', padding: 26 },
  finderModal: { width: '100%', maxWidth: 360, backgroundColor: '#17171b', borderRadius: 14, borderWidth: 1, borderColor: colors.green, padding: 18, gap: 10 },
  finderEyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  finderEyebrow: { fontFamily: fonts.oswaldMedium, fontSize: 10, letterSpacing: 1.6, color: colors.amberLabel },
  finderBeta: { borderWidth: 1, borderColor: colors.amberLabel, borderRadius: 3, paddingHorizontal: 5, paddingVertical: 1 },
  finderBetaText: { fontFamily: fonts.oswaldSemiBold, fontSize: 9, letterSpacing: 1.4, color: colors.amber },
  finderTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 22, color: colors.textPrimary, letterSpacing: 0.3 },
  finderBlurb: { fontFamily: fonts.barlowMedium, fontSize: 14.5, lineHeight: 21, color: colors.textSecondary },
  finderStart: { marginTop: 4, minHeight: 50, borderRadius: 10, borderWidth: 1, borderColor: colors.green, backgroundColor: '#173021', alignItems: 'center', justifyContent: 'center' },
  finderStartText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.2, color: colors.green },
  finderClose: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  finderCloseText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1, color: colors.textSub },

  // Tree.
  // Amber "SUBJECTS" subtitle above the subject list (user request 2026-07-22);
  // the negative bottom margin tucks it against the tree (scroll gap is 20).
  subjectsHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 2.2, color: colors.amber, marginBottom: -10 },
  // Field group header in the v3 curriculum tree (owner 2026-08-06).
  fieldHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.8, color: colors.textSub, marginTop: 12, marginBottom: 6, paddingBottom: 5, borderBottomWidth: 1, borderBottomColor: colors.hairlineDim },
  tree: { gap: 8 },
  treeStatus: { alignItems: 'center', gap: 12, paddingVertical: 28, paddingHorizontal: 16 },
  treeStatusText: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 21, color: colors.textSub, textAlign: 'center' },
  treeRetry: { borderWidth: 1, borderColor: colors.steelBorder, borderRadius: 9, paddingVertical: 10, paddingHorizontal: 28, backgroundColor: '#141414' },
  treeRetryText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1, color: colors.textSecondary },
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
  topicRow: { flexDirection: 'row', gap: 10, alignItems: 'center', paddingVertical: 4 },
  // Small topic-art thumbnail placeholder while the image is absent/loading.
  topicThumbFallback: { width: 34, height: 34, borderRadius: 6, backgroundColor: '#20232b' },
  topicBullet: { fontFamily: fonts.barlowRegular, fontSize: 15, lineHeight: 22, color: colors.textSub, width: 12 },
  // Tap-to-enroll affordance (mirrors the Enrollments Browse & Add list): '+'
  // when available (white topic), green '✓' once enrolled.
  topicHint: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub, marginBottom: 2 },
  topicCheck: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, lineHeight: 22, color: colors.textSub, width: 14, textAlign: 'center' },
  topicCheckOn: { color: '#37e05f' },
  topicText: { flex: 1, fontFamily: fonts.barlowMedium, fontSize: 14.5, lineHeight: 22, color: colors.textPrimary },
  topicTextOn: { color: '#7dffa1' },
  careers: { fontFamily: fonts.barlowMedium, fontSize: 14.5, lineHeight: 22, color: colors.textSecondary },
  careersNote: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 18, color: '#ffb060', marginTop: 6 },

  // Academic goals.
  section: { gap: 10 },
  // "Academic Goals" heading — green (user request 2026-07-22).
  sectionEyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 2.2, color: '#37e05f' },
  sectionIntro: { fontFamily: fonts.barlowMedium, fontSize: 15.5, lineHeight: 23, color: colors.textSub, marginBottom: 2 },
  goalRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  goalBullet: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, color: colors.amber, lineHeight: 24 },
  goalText: { flex: 1, fontFamily: fonts.barlowMedium, fontSize: 16, lineHeight: 24, color: colors.textSecondary },
});
