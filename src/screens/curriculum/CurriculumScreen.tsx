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
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../theme/tokens';
import { BrandLogo } from '../../components/BrandLogo';
import { Modal } from '../../components/DimModal';
import { consumeDevPreview } from '../../features/dev/devPreview';
import { fetchV3Curriculum, fetchV3Programs, fetchV3Certs, type V3Field } from '../../data/v3Curriculum';
import { subjectMeta } from '../../data/subjectMeta';
import { useCurriculumStats } from '../../features/curriculum/curriculumStats';
import { AboutHomeSheet } from '../about/AboutHomeSheet';
import { markAboutOpened, useAboutOpened } from '../../features/onboarding/attractStore';
import { AttractRing } from '../../features/onboarding/AttractCue';
import { WORKSPACES } from '../lab/calc/registry';
import { totalLabCount } from '../lab/labCatalog';
import { TrophyImage } from '../../components/TrophyImage';
import { topicImagePath } from '../../data/topicImages';
import { TopicDetailModal, type TopicDetail } from './TopicDetailModal';
import { useNavigation } from '@react-navigation/native';
import { CAREER_COUNT, familyFieldOf } from '../../features/careerfinder/careerIndex';
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

/** Thousands separator without relying on Intl (limited under Hermes). */
const fmt = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

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
  // The Career Finder entry is a button beside SUBJECTS (owner 2026-09-04):
  // tapping it opens the green container as a popup.
  const [showFinder, setShowFinder] = useState(false);
  // Curriculum view split (owner 2026-09-15): TOPICS (flat list of every topic)
  // vs SUBJECTS (the expandable subject → topics tree).
  const [curTab, setCurTab] = useState<'topics' | 'subjects'>('subjects');
  // Topic-art viewer (owner 2026-09-15): tapping a row thumbnail opens the
  // standard expanded image popup (TrophyModal).
  const [viewTopic, setViewTopic] = useState<{ gs: number; name: string } | null>(null);
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
  const stats = useCurriculumStats(allGs);
  const subjectsAZ = v3Subjects; // already Field → Subject order
  // Expanded-view detail for the tapped topic (owner 2026-09-15): term coverage
  // + the subject/field it sits in + where those skills apply (subject careers).
  const activeTopic = useMemo<TopicDetail | null>(() => {
    if (!viewTopic) return null;
    const subj = v3Subjects.find((s) => s.topics.some((t) => t.gs === viewTopic.gs));
    const meta = subj ? subjectMeta(subj.name) : null;
    return {
      gs: viewTopic.gs,
      name: viewTopic.name,
      subjectName: subj?.name ?? null,
      field: subj?.field ?? null,
      careers: meta?.careers ?? null,
      description: meta?.description ?? null,
      terms: stats.termsByGs.get(viewTopic.gs) ?? null,
    };
  }, [viewTopic, v3Subjects, stats]);

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

  return (
    <>
    <ScrollView style={{ flex: 1 }} contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}>
      {/* White intro line above the counters (user request 2026-07-22). */}
      <View style={styles.discoverRow}>
        <Text style={styles.discoverHead}>Discover What’s Inside</Text>
        <Pressable
          onPress={() => {
            markAboutOpened();
            setAboutSheet(true);
          }}
          hitSlop={8}
          style={styles.aboutCta}
          accessibilityRole="button"
          accessibilityLabel="About the Academy"
        >
          {/* Button STAYS permanently (owner 2026-09-15); only the first-run cue
              retires once About is viewed by either path. While un-viewed it
              wears the exact Home Explore-chip cue — breathing amber ring/glow +
              amber label; after viewed it's a plain static chip. */}
          <AttractRing active={!aboutOpened} />
          <Text style={styles.aboutCtaText}>About the Academy</Text>
        </Pressable>
      </View>

      {/* Plain-language overview of the academy (owner 2026-09-15): two
          left-to-right sentences, each number coloured to match its readout
          (glossary green · topics white · subjects amber · certs blue ·
          programs purple · calculators amber · labs green). */}
      <View style={styles.overviewBlock}>
        <Text style={styles.overviewSentence}>
          <Text style={styles.ovTerms}>{stats.totalTerms != null ? fmt(stats.totalTerms) : '—'}</Text>
          {' glossary terms organized into '}
          <Text style={styles.ovTopics}>{allGs.length || '—'}</Text>
          {' study topics and '}
          <Text style={styles.ovSubjects}>{subjectsAZ.length || '—'}</Text>
          {' subject categories.'}
        </Text>
        <Text style={styles.overviewSentence}>
          <Text style={styles.ovCerts}>{credCounts.certs || '—'}</Text>
          {' specialist certificates, '}
          <Text style={styles.ovPrograms}>{credCounts.programs || '—'}</Text>
          {' full programs, '}
          <Text style={styles.ovCalc}>{fmt(CALC_COUNT)}</Text>
          {' calculators, and '}
          <Text style={styles.ovLabs}>{LAB_COUNT || '—'}</Text>
          {' labs to practice, study, and learn about audio.'}
        </Text>
      </View>

      {/* Audio Career Finder — full-width container (owner 2026-09-15), moved out
          of the SUBJECTS row and given prominence above the curriculum block.
          Opens the Career Discovery Lab popup. */}
      <Pressable
        style={styles.finderContainer}
        onPress={() => setShowFinder(true)}
        accessibilityRole="button"
        accessibilityLabel={finder.a11y}
      >
        <Text style={styles.finderContainerText}>AUDIO CAREER FINDER</Text>
        <Text style={styles.finderChevron}>▸</Text>
      </Pressable>

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

      {/* Amber "Subjects" subtitle above the list (user request 2026-07-22).
          The Audio Career Finder moved up to its own full-width container
          (owner 2026-09-15), so this row is now just the SUBJECTS heading. */}
      {/* Curriculum split tabs (owner 2026-09-15): TOPICS (flat list) |
          SUBJECTS (expandable tree). */}
      <View style={styles.curTabs}>
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
            <TopicRow key={t.gs} gs={t.gs} name={t.name} onView={() => setViewTopic({ gs: t.gs, name: t.name })} />
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
                    <TopicRow key={t.gs} gs={t.gs} name={t.name} onView={() => setViewTopic({ gs: t.gs, name: t.name })} />
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
    <TopicDetailModal topic={activeTopic} onClose={() => setViewTopic(null)} />
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
  introBlock: { gap: 8 },
  introTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 21, letterSpacing: 0.4, color: colors.textPrimary },
  curriculumIntro: { fontFamily: fonts.barlowMedium, fontSize: 16, lineHeight: 24, color: colors.textSecondary },

  // "Discover What's Inside" white heading above the counters (user request 2026-07-22).
  // Row so the temporary "About the Academy" link sits to the RIGHT of the title.
  discoverRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  discoverHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 20, letterSpacing: 0.4, color: colors.textPrimary, textAlign: 'left', flexShrink: 1 },
  // Temporary first-run "About the Academy" link (owner 2026-09-15). Same chip
  // grammar as the Home Explore chip (awardBtn): dark face + gray base border,
  // radius 8 so the overlaid AttractRing hugs it; the breathing amber ring/glow
  // + amber label ARE the Explore-chip cue. Retires once About is viewed.
  aboutCta: {
    borderRadius: 8,
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#2c2c2c',
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  // Label stays amber permanently (owner 2026-09-15); only the breathing ring
  // cue retires once About is viewed.
  aboutCtaText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 0.5, color: '#ffc64d' },
  // Overview stat tiles — 5 today (terms · topics · subjects · certificates ·
  // programs); the array that renders them is the count that matters.
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
  // SUBJECTS label + the Audio Career Finder button on one row (owner
  // 2026-09-04). The negative bottom margin that tucked SUBJECTS against the
  // tree now lives on the row.
  subjectsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: -10 },
  // The green-outlined entry button — the one non-browsing action on Explore,
  // so it takes the green the app reserves for a primary action.
  // Overview sentence beneath the 5 readouts (owner 2026-09-15): numbers
  // coloured to match their tiles (glossary green · topics white · subjects
  // amber); the connective words stay in the secondary text colour.
  overviewBlock: { gap: 8 },
  overviewSentence: { fontFamily: fonts.barlowMedium, fontSize: 15, lineHeight: 22, color: colors.textSecondary },
  ovTerms: { fontFamily: fonts.oswaldSemiBold, color: '#37e05f' },
  ovTopics: { fontFamily: fonts.oswaldSemiBold, color: colors.textPrimary },
  ovSubjects: { fontFamily: fonts.oswaldSemiBold, color: '#ffc64d' },
  ovCerts: { fontFamily: fonts.oswaldSemiBold, color: '#5bb0ff' },
  ovPrograms: { fontFamily: fonts.oswaldSemiBold, color: '#c4a2ff' },
  ovCalc: { fontFamily: fonts.oswaldSemiBold, color: '#ffc64d' },
  ovLabs: { fontFamily: fonts.oswaldSemiBold, color: '#37e05f' },
  // Audio Career Finder full-width container (owner 2026-09-15): green chip
  // grammar (matches the old button's colours) at full width above the
  // curriculum, label left + BETA, arrow right.
  finderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    minHeight: 42,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.green,
    backgroundColor: '#173021',
  },
  finderContainerText: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 1, color: colors.green, flexShrink: 1 },
  finderChevron: { fontFamily: fonts.oswaldBold, fontSize: 18, color: colors.green },
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
  fieldHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.6, color: colors.textSub, marginTop: 10, marginBottom: 4 },
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

  // Academic goals.
  section: { gap: 10 },
  // "Academic Goals" heading — green (user request 2026-07-22).
  sectionEyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 2.2, color: '#37e05f' },
  sectionIntro: { fontFamily: fonts.barlowMedium, fontSize: 15.5, lineHeight: 23, color: colors.textSub, marginBottom: 2 },
  goalRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  goalBullet: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, color: colors.amber, lineHeight: 24 },
  goalText: { flex: 1, fontFamily: fonts.barlowMedium, fontSize: 16, lineHeight: 24, color: colors.textSecondary },
});
