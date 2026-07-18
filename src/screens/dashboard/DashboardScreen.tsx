/**
 * S4* — Dashboard (RE-LOCKED v3.5, MASTER; visuals from design-reference
 * 05-s4-dashboard.dc.html).
 *
 * - Loads straight to the last-used topic (no Resume modal).
 * - Swipe L/R on the topic title block moves freely between ALL topics in the
 *   course (user request 2026-07-17). The old per-topic frontier gate (hard
 *   stop + screen-shake/haptic past the one-ahead boundary) is removed; a
 *   per-course gate will replace it later.
 * - Provisional (clamped) topic = predecessor status passed_incomplete:
 *   distinct border + persistent reminder (copy locked; styling is a
 *   [TBD-DESIGN] proposal).
 * - Method blocks 1–5 + quiz block 6 with glow-pulse while locked and a
 *   which-gate-remains readout mirrored DISPLAY-ONLY from server rows.
 * - Topic "overall progress" = mean of the applicable methods' server
 *   completion_pct (display aggregation of server truth — flagged in review).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { StudyStackParamList } from '../../navigation/types';
import Svg, { Circle, Rect } from 'react-native-svg';
import { AppHeader } from '../../components/AppHeader';
import { ElevatedFrame } from '../../components/ElevatedFrame';
import { GlassButton } from '../../components/GlassButton';
import { LedMeter, segmentsForPct } from '../../components/LedMeter';
import { MethodIcon, METHOD_COLORS, type MethodKey } from '../../components/MethodIcon';
import { StudioButton } from '../../components/StudioButton';
import { SwitchButton } from '../../components/SwitchButton';
import { TrophyImage } from '../../components/TrophyImage';
import { TrophyModal } from '../../components/TrophyModal';
import { colors, fonts, spacing } from '../../theme/tokens';
import {
  fetchDashboard,
  getLastTopicIndex,
  setLastTopicIndex,
  type DashboardData,
} from '../../features/dashboard/api';
import { gateReadout, pctColor } from '../../features/dashboard/gates';
import { fetchGlossaryItemsByIds, fetchTopicItems, studyDisplayPct } from '../../features/study/api';
import {
  FLAGGED_TOPIC_ID,
  FLAGGED_TOPIC_NAME,
  useFlagged,
} from '../../features/flags/flaggedStore';
import { TermSelectIcons } from '../../features/flags/TermSelectIcons';
import { devBypass } from '../../config/devMode';
import { ScreenIntroOverlay } from '../../features/intro/ScreenIntroOverlay';
import { LearningIntroSheet } from '../../features/intro/LearningIntroSheet';
import { getCourseIntro, getTopicIntro } from '../../features/intro/learningIntros';
import { replayQuizSubmissions } from '../../features/quiz/api';
import { onStudyProgress } from '../../features/study/sync';
import { loadAllLocalMethodStates, mergeItemStates } from '../../features/study/localProgress';
import { useEntitlement } from '../../features/commercial/EntitlementProvider';
import { fetchCommercialDashboard, getLastPublicCourse } from '../../features/commercial/commercialDashboard';

const METHOD_ORDER: { key: MethodKey; label: string }[] = [
  { key: 'flashcards', label: 'FLASHCARDS' },
  { key: 'fill_in_blank', label: 'FILL-IN-BLANK' },
  { key: 'matching', label: 'MATCHING' },
  { key: 'ear_training', label: 'EAR TRAINING' },
  { key: 'scenarios', label: 'SCENARIOS' },
];

/** Panel mounting screw (Booth 2026-07-10) — BLACK phillips head. `angle`
 *  rotates the slots: mostly cardinal, a few a hair off-true like a real rack
 *  (#4). */
function PanelScrew({ angle = 0 }: { angle?: number }) {
  return (
    <Svg width={15} height={15} viewBox="0 0 14 14" style={{ transform: [{ rotate: `${angle}deg` }] }}>
      <Circle cx={7} cy={7} r={6.4} fill="#131416" stroke="#000000" strokeWidth={0.9} />
      <Circle cx={7} cy={7} r={5} fill="#1e1f22" />
      <Circle cx={5.2} cy={5} r={1.8} fill="rgba(255,255,255,0.10)" />
      {/* Phillips cross — black recess + a hair of light on the lower/right
          edge so the engraved slot (the "teeth") is barely noticeable, and the
          head reads a touch larger (Booth 2026-07-11 #4). */}
      <Rect x={2.8} y={6.2} width={8.4} height={1.6} rx={0.8} fill="#000000" />
      <Rect x={6.2} y={2.8} width={1.6} height={8.4} rx={0.8} fill="#000000" />
      <Rect x={2.8} y={7.7} width={8.4} height={0.5} rx={0.25} fill="rgba(255,255,255,0.08)" />
      <Rect x={7.7} y={2.8} width={0.5} height={8.4} rx={0.25} fill="rgba(255,255,255,0.08)" />
    </Svg>
  );
}

/** ALL-CAPS legends read badly in a connected script — present them Title Case
 *  (e.g. "FILL-IN-BLANK" → "Fill-in-Blank") for the engraved nameplate. */
function toTitle(s: string): string {
  return s
    .toLowerCase()
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * Engraved method/quiz title (Booth 2026-07-15): a virtually-engraved metal
 * nameplate legend, set in Great Vibes — a flowing calligraphic SCRIPT (the
 * elegant "Vladimir" feel the client wanted, but legible). The engraving is
 * code-drawn by stacking three copies: a DARK copy nudged up (the top edge of
 * the incised channel in shadow), a LIGHT copy nudged down (the lower lip
 * catching light), and the frosted paint-fill letter on top — machined into the
 * powder coat, not printed.
 *
 * ADA: decorative layered text, so the wrapper carries the label and the copies
 * are hidden from the screen reader (Booth 2026-07-15).
 */
function EngravedTitle({ text, off = false }: { text: string; off?: boolean }) {
  const display = toTitle(text);
  return (
    <View style={styles.engWrap} accessible accessibilityRole="text" accessibilityLabel={text}>
      <Text
        style={[styles.engLayer, styles.engDark]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
        importantForAccessibility="no-hide-descendants"
      >
        {display}
      </Text>
      <Text
        style={[styles.engLayer, styles.engLight]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
        importantForAccessibility="no-hide-descendants"
      >
        {display}
      </Text>
      {/* Uneven-depth grain: a warm dark copy a hair off-register roughens the
          cut edges like real tooling (ref photo, Booth 2026-07-15). */}
      <Text
        style={[styles.engLayer, styles.engGrain]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
        importantForAccessibility="no-hide-descendants"
      >
        {display}
      </Text>
      <Text
        style={[styles.engLayer, off ? styles.engFillOff : styles.engFill]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
        importantForAccessibility="no-hide-descendants"
      >
        {display}
      </Text>
    </View>
  );
}

/** Per-panel screw rotations: mostly true, screws 3L and 4R sit slightly off. */
const SCREW_ROT: [number, number][] = [
  [0, 90],
  [90, 0],
  [8, 90],
  [0, -7],
  [90, 0],
];

const STUDY_ROUTES: Partial<
  Record<MethodKey, 'Flashcards' | 'FillInBlank' | 'Matching' | 'EarTraining' | 'Scenarios'>
> = {
  flashcards: 'Flashcards',
  fill_in_blank: 'FillInBlank',
  matching: 'Matching',
  ear_training: 'EarTraining',
  scenarios: 'Scenarios',
};

export function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<StudyStackParamList>>();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [topicIdx, setTopicIdx] = useState(0);
  // CM6 (Booth 2026-07-11): commercialMode renders a PUBLIC course (seq order
  // from the seed) through this same screen; institutional path unchanged.
  const { commercialMode, caps } = useEntitlement();

  const pulse = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);
  // Tap the topic trophy → full-size popup (Booth 2026-07-11).
  const [trophyOpen, setTrophyOpen] = useState(false);
  // Tap the topic card → all terms in this topic as a list (Booth 2026-07-18).
  // Rows carry ids so each row's select icons (⚑ ♥ ★ ✓ ✗) can tag the term.
  const [termsOpen, setTermsOpen] = useState(false);
  const [termList, setTermList] = useState<{ id: string; term: string }[] | null>(null);
  // The same sheet also serves the user's custom Flagged topic card.
  const [termsSource, setTermsSource] = useState<'topic' | 'flagged'>('topic');
  // The user's own flagged list (shared with Glossary + Flashcards stars).
  const flagged = useFlagged();

  // Learning intros (user request 2026-07-18): a COURSE intro before beginning
  // a course and a TOPIC intro before beginning each topic. Auto-shown once
  // each (persisted in one set), and re-openable from the topic card. `intro`
  // holds whichever sheet is currently up.
  const [intro, setIntro] = useState<{ kind: 'course' | 'topic'; key: string; name: string } | null>(null);
  const [introSeen, setIntroSeen] = useState<Set<string>>(new Set());
  useEffect(() => {
    AsyncStorage.getItem('ape:learnIntrosSeen').then((v) => {
      if (v) setIntroSeen(new Set(JSON.parse(v) as string[]));
    });
  }, []);

  // The Dashboard must always open at the TOP (Booth 2026-07-11): a stale scroll
  // offset was leaving it scrolled down on focus. Reset to y=0 whenever focused.
  useFocusEffect(
    useCallback(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }, []),
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Reconnect path (Code brief §6): flush any offline quiz submissions
      // first so the fetched progress reflects the finalized attempt.
      const replayed = await replayQuizSubmissions().catch(() => []);
      for (const { result } of replayed) {
        Alert.alert(
          'Offline quiz submitted',
          `Score ${result.score}/25 — ${result.outcome.replace(/_/g, ' ')}. (Full results screen builds in M6.)`,
        );
      }
      const d = commercialMode
        ? await fetchCommercialDashboard((await getLastPublicCourse()) ?? 1, caps)
        : await fetchDashboard();

      // Merge the device-local progress mirror OVER the server rows for DISPLAY
      // (LED + START→CONTINUE), so the dashboard reacts to work the user just
      // did even before the server write lands (Booth 2026-07-15). Gates below
      // still read server truth.
      const localRows = await loadAllLocalMethodStates();
      if (localRows.length) {
        const rows = [...d.methodRows];
        for (const lr of localRows) {
          const existing = rows.find(
            (r) => r.achievement_id === lr.achievement_id && r.method_key === lr.method_key,
          );
          if (existing) {
            existing.item_states = mergeItemStates(existing.item_states, lr.item_states);
          } else {
            rows.push({
              achievement_id: lr.achievement_id,
              method_key: lr.method_key,
              completion_pct: 0,
              engagement_seconds: 0,
              answered_count: 0,
              correct_count: 0,
              item_states: lr.item_states,
            });
          }
        }
        d.methodRows = rows;
      }

      // First open lands on the furthest topic with progress (the "frontier");
      // after that the stored index wins. Movement itself is free — the old
      // per-topic gate is gone (user request 2026-07-17), so the stored index
      // is clamped only to the real array bounds, not the frontier.
      let frontier = 0;
      d.topics.forEach((t, i) => {
        const st = d.progressByTopic.get(t.id)?.status ?? 'locked';
        if (st !== 'locked') frontier = i;
      });
      const stored = await getLastTopicIndex(d.currentCourse.id);
      setTopicIdx(stored != null ? Math.min(stored, d.topics.length - 1) : frontier);
      setData(d);
    } catch (e: any) {
      setErrorCode(e?.message ?? 'unknown');
      setError(
        e?.message === 'not_enrolled'
          ? 'No enrolled courses found for this account.'
          : e?.message === 'user_not_found'
            ? 'This account is not linked to a student record. Complete registration first.'
            : 'Could not load the dashboard. Check your connection and pull to retry.',
      );
    } finally {
      setLoading(false);
    }
  }, [commercialMode, caps]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  // A study write commits asynchronously (flush on leaving a method + the 30s
  // loop). The focus-reload above can race ahead of that write and read stale
  // rows — leaving START/empty-LED even after real progress. Re-fetch whenever a
  // write actually lands, so the meters + START→CONTINUE catch up (Booth
  // 2026-07-15). The Dashboard stays mounted under the pushed study screen, so
  // this fires while the flush completes and again on return.
  useEffect(() => onStudyProgress(() => void load()), [load]);

  // Quiz-block glow pulse (quizPulse 2.4s ease-in-out infinite).
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  // Derived per-render (cheap; small arrays).
  const topics = data?.topics ?? [];
  const topic = topics[topicIdx];
  const status = topic ? (data!.progressByTopic.get(topic.id)?.status ?? 'locked') : 'locked';
  const lastTopicIdx = Math.max(0, topics.length - 1);

  const goTo = useCallback(
    (next: number) => {
      if (!data) return;
      // Free roam across all topics (user request 2026-07-17); clamp only to
      // the real array bounds. A per-course gate will replace the old
      // per-topic frontier stop later.
      if (next < 0 || next > topics.length - 1) return;
      setTopicIdx(next);
      setLastTopicIndex(data.currentCourse.id, next);
    },
    [data, topics.length],
  );

  const goToRef = useRef(goTo);
  goToRef.current = goTo;
  const idxRef = useRef(topicIdx);
  idxRef.current = topicIdx;

  const pan = useRef(
    PanResponder.create({
      // A tap must still reach the trophy / title Pressables inside the card,
      // so DON'T claim on start. But a horizontal drag has to win over those
      // child Pressables — claim it in the CAPTURE phase so the parent
      // intercepts the swipe before the children (fix 2026-07-17: swipes that
      // began on the title/trophy were being eaten by the child Pressables and
      // never moved the topic). Vertical drags fall through to the ScrollView.
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponderCapture: (_e, g) =>
        Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy) * 1.2,
      // Once we own the swipe, don't let the ScrollView steal it back.
      onPanResponderTerminationRequest: () => false,
      onPanResponderRelease: (_e, g) => {
        if (g.dx <= -40) goToRef.current(idxRef.current + 1); // next topic
        else if (g.dx >= 40) goToRef.current(idxRef.current - 1); // prior topic
      },
    }),
  ).current;

  // Topic card tap → all terms in the topic (Booth 2026-07-18). Lazy-fetched
  // per open; list is display-only with a jump-off into the Glossary.
  const topicIdForTerms = data?.topics[topicIdx]?.id;
  const openTerms = useCallback(async () => {
    if (!topicIdForTerms) return;
    setTermsSource('topic');
    setTermsOpen(true);
    setTermList(null);
    try {
      const items = await fetchTopicItems(topicIdForTerms);
      setTermList(
        items
          .map((i) => ({ id: i.id, term: i.term }))
          .sort((a, b) => a.term.localeCompare(b.term)),
      );
    } catch {
      setTermList([]);
    }
  }, [topicIdForTerms]);

  // Flagged topic card tap → the user's own flagged terms in the same sheet.
  const openFlaggedTerms = useCallback(async () => {
    setTermsSource('flagged');
    setTermsOpen(true);
    setTermList(null);
    try {
      const items = await fetchGlossaryItemsByIds([...flagged]);
      setTermList(items.map((i) => ({ id: i.id, term: i.term }))); // API pre-sorts by term
    } catch {
      setTermList([]);
    }
  }, [flagged]);

  // Auto-open the not-yet-seen intro (user request 2026-07-18): the COURSE
  // intro first, then the CURRENT TOPIC's — so there is always an intro before
  // beginning. Each is shown once (persisted); re-openable from the card.
  useEffect(() => {
    if (!data || intro) return;
    const courseKey = `course:${data.currentCourse.id}`;
    if (!introSeen.has(courseKey)) {
      setIntro({ kind: 'course', key: courseKey, name: data.currentCourse.name });
      return;
    }
    const t = topics[topicIdx];
    if (t) {
      const topicKey = `topic:${t.id}`;
      if (!introSeen.has(topicKey)) setIntro({ kind: 'topic', key: topicKey, name: t.name });
    }
  }, [data, topics, topicIdx, introSeen, intro]);

  const dismissIntro = useCallback(() => {
    setIntro((cur) => {
      if (cur) {
        setIntroSeen((prev) => {
          const next = new Set(prev).add(cur.key);
          void AsyncStorage.setItem('ape:learnIntrosSeen', JSON.stringify([...next]));
          return next;
        });
      }
      return null;
    });
  }, []);

  const openCourseIntro = useCallback(() => {
    if (data) setIntro({ kind: 'course', key: `course:${data.currentCourse.id}`, name: data.currentCourse.name });
  }, [data]);
  const openTopicIntro = useCallback(() => {
    const t = topics[topicIdx];
    if (t) setIntro({ kind: 'topic', key: `topic:${t.id}`, name: t.name });
  }, [topics, topicIdx]);

  if (loading && !data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.amber} />
      </View>
    );
  }

  if (error || !data || !topic) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error ?? 'Nothing to show yet.'}</Text>
        {errorCode === 'user_not_found' && (
          <View style={{ width: 220 }}>
            <StudioButton
              label="Complete Registration"
              variant="primary"
              small
              // Auth lives on the ROOT stack; unknown route names bubble up
              // from the nested Study stack, so the loose cast is safe here.
              onPress={() => (navigation as any).navigate('Auth')}
            />
          </View>
        )}
        <View style={{ width: 180 }}>
          <StudioButton label="Retry" variant="secondary" small onPress={load} />
        </View>
      </View>
    );
  }

  const prevStatus =
    topicIdx > 0 ? (data.progressByTopic.get(topics[topicIdx - 1].id)?.status ?? 'locked') : null;
  const provisional = prevStatus === 'passed_incomplete';

  const applicable = new Set(topic.applicable_methods ?? []);
  const rowsForTopic = data.methodRows.filter((r) => r.achievement_id === topic.id);
  const rowFor = (key: string) => rowsForTopic.find((r) => r.method_key === key);

  // Gate mirror over the applicable methods (display-only).
  const readouts = data.methodConfigs
    .filter((c) => applicable.has(c.key))
    .map((c) => gateReadout(c, rowFor(c.key)));
  const allGatesPass = readouts.every((r) => r.gatePass);

  // Topic "overall progress" = mean of the applicable methods' smooth display
  // progress (creeps with every pass, consistent with the per-method meters).
  const topicItemCount = data.itemCountByTopic.get(topic.id) ?? 0;
  const applicableKeys = data.methodConfigs.filter((c) => applicable.has(c.key));
  const overallPct =
    applicableKeys.length > 0
      ? Math.floor(
          applicableKeys.reduce(
            (s, c) =>
              s +
              studyDisplayPct(
                (rowFor(c.key)?.item_states ?? {}) as Parameters<typeof studyDisplayPct>[0],
                topicItemCount,
                c.key,
                c.required_passes,
              ),
            0,
          ) / applicableKeys.length,
        )
      : 0;

  const topicProg = data.progressByTopic.get(topic.id);
  const rawQuizState =
    status === 'complete'
      ? 'passed'
      : status === 'passed_incomplete'
        ? 'partial'
        : allGatesPass
          ? 'ready'
          : 'locked';
  // DEV BYPASS (Booth 2026-07-18): quiz always startable for screen testing.
  // The server (`start_quiz_attempt`) still re-checks gates and may refuse —
  // that error surfacing is expected. Restore = devMode.ts → bypassQuizLocks:false.
  const quizState =
    rawQuizState === 'locked' && devBypass('bypassQuizLocks') ? 'ready' : rawQuizState;

  const swipeHint = [
    topicIdx > 0 ? '‹ swipe' : null,
    topicIdx < lastTopicIdx ? 'swipe ›' : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.25, 1] });

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll}>
        {/* Header (shared, 30%-enlarged tile — Booth 2026-07-08).
            Logo tap → About/Credits (Dashboard only). */}
        <AppHeader
          onLogoPress={() => (navigation as any).navigate('About')}
          right={
            // Scribble-strip glass key (Booth 2026-07-09u) — same aesthetic as
            // the Fill-in-Blank Prev/Next caps, in the glossary blue.
            <View style={{ width: 104 }}>
              <GlassButton
                label="GLOSSARY"
                tint="blue"
                height={40}
                onPress={() =>
                  navigation.navigate('Glossary', {
                    courseId: data.currentCourse.id,
                    courseCode: data.currentCourse.code,
                    achievementId: topic.id,
                    topicName: topic.name,
                  })
                }
              />
            </View>
          }
        />

        {/* Topic title block (swipeable — free roam across all topics) */}
        <View
          {...pan.panHandlers}
          style={[styles.topicCard, provisional && styles.topicCardProvisional]}
        >
          {/* Texture removed + darkened 2 more shades (Booth 2026-07-11) — the
              Current Topic display is now a plain dark panel. */}
          {/* pilot dot removed (Booth 2026-07-11 #6). */}
          {/* Current topic's trophy, top-right — ALWAYS full clarity here, even
              when unearned (the gray→lit earn state lives on the Achievements
              screen; the Dashboard shows the topic art at full illumination).
              Booth 2026-07-09d. Subtle placeholder when the topic has no art. */}
          {/* Tap the trophy → full-size popup (Booth 2026-07-11). */}
          <Pressable
            style={styles.topicTrophy}
            onPress={() => setTrophyOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={`View ${topic.name} trophy`}
          >
            <TrophyImage
              iconUrl={topic.icon_url}
              size={104}
              radius={12}
              fallback={<View style={styles.topicTrophyEmpty} />}
            />
          </Pressable>
          {/* Tap the title area → full term list for this topic (Booth
              2026-07-18). Swipe still owned by the card's PanResponder. */}
          <Pressable
            onPress={openTerms}
            accessibilityRole="button"
            accessibilityLabel={`List all terms in ${topic.name}`}
          >
            <Text style={styles.topicEyebrow}>CURRENT TOPIC</Text>
            <Text style={[styles.topicName, styles.topicNameInset]}>{topic.name}</Text>
            <Text style={[styles.topicMeta, styles.topicNameInset]}>
              {`TOPIC ${topicIdx + 1} OF ${topics.length} · ${data.currentCourse.name.toUpperCase()}`}
              {swipeHint ? `  ·  ${swipeHint}` : ''}
            </Text>
          </Pressable>
          <View style={styles.pctRow}>
            <Text style={styles.pctBig}>{overallPct}%</Text>
            <Text style={styles.pctLabel}>OVERALL TOPIC PROGRESS</Text>
          </View>
          {/* Same study-method segment styling, but SHORTER + left-justified in
              the topic display (Booth 2026-07-11) — compact mode self-sizes and
              aligns left. */}
          <View style={{ marginTop: 8 }}>
            <LedMeter filled={segmentsForPct(overallPct)} segWidth={8} />
          </View>
          {/* Intro affordances (user request 2026-07-18) — re-open the topic /
              course intro any time; they also auto-show once before beginning. */}
          <View style={styles.introRow}>
            <Pressable
              style={styles.introBtn}
              onPress={openTopicIntro}
              accessibilityRole="button"
              accessibilityLabel="Topic intro"
            >
              <Text style={styles.introBtnText}>ⓘ TOPIC INTRO</Text>
            </Pressable>
            <Pressable
              style={styles.introBtn}
              onPress={openCourseIntro}
              accessibilityRole="button"
              accessibilityLabel="Course intro"
            >
              <Text style={styles.introBtnText}>ⓘ COURSE INTRO</Text>
            </Pressable>
          </View>
          {provisional && (
            <Text style={styles.provisionalNote}>
              Provisional access — score 24+ on the previous topic to earn its trophy and continue
              further.
            </Text>
          )}
        </View>

        {/* Method blocks 1–5 — each frame carries its OWN LED meter (Booth
            2026-07-07: 6 meters total on this screen incl. the topic card).
            Rack group: tight inter-panel gap like a real 500 lunchbox (#6). */}
        <View style={styles.rackGroup}>
        {METHOD_ORDER.map((m, i) => {
          const isApplicable = applicable.has(m.key);
          const cfgRow = rowFor(m.key);
          // Smooth display progress (Booth: creep, never leap) — partial
          // credit per pass from the server-stored item_states. Gate lines
          // below still read the server completion/time/accuracy fields.
          const methodCfg = data.methodConfigs.find((c) => c.key === m.key);
          const pct = Math.round(
            studyDisplayPct(
              (cfgRow?.item_states ?? {}) as Parameters<typeof studyDisplayPct>[0],
              data.itemCountByTopic.get(topic.id) ?? 0,
              m.key,
              methodCfg?.required_passes ?? 2,
            ),
          );
          const complete = isApplicable && pct >= 100;
          return (
            // 3D console-key frame (Booth 2026-07-09): raised while incomplete,
            // DEPRESSED (indented) once at 100%. Unavailable methods (ear
            // training / scenarios) render already-indented + grayed.
            // Unavailable methods are NOT recessed or dimmed — every slot reads
            // as one mounted 500-series surface (Booth 2026-07-10 #9).
            <View key={m.key}>
              <ElevatedFrame depressed={complete} contentStyle={styles.methodInner}>
                {/* Layout (Booth 2026-07-09e): a flex LEFT column (title row +
                    a PARTIAL-width LED meter) with a SQUARE action button on the
                    right. The LED no longer spans the full container width. */}
                <View style={styles.methodRow}>
                  {/* left mounting screw — a touch of breathing room */}
                  <View style={{ marginRight: 3 }}>
                    <PanelScrew angle={SCREW_ROT[i][0]} />
                  </View>
                  {/* Icon in its recessed well. The glyph is always lit; the
                      ICON TILE's own thin line stays OFF (default faint line)
                      while the method still needs work, and LIGHTS (70% glow)
                      in the method color once the method is complete — a "done"
                      cue, inverted from the old needs-action glow (user request
                      2026-07-17). */}
                  <View style={styles.iconWell}>
                    <View style={styles.iconSticker}>
                      <MethodIcon
                        method={m.key}
                        size={46}
                        mono={!isApplicable}
                        glowColor={isApplicable && complete ? METHOD_COLORS[m.key] : undefined}
                      />
                    </View>
                  </View>
                  <View style={styles.methodLeft}>
                    {/* Method title is ENGRAVED into the powder coat (Booth
                        2026-07-11); only the % survives as a small SQUARE LED
                        box on the right, whose right edge aligns with the LED
                        meter below it. */}
                    <View style={styles.methodTopRow}>
                      <EngravedTitle text={m.label} off={!isApplicable} />
                      <View style={[styles.cutoutMount, styles.pctBox]}>
                        <Text
                          style={[
                            styles.pctDigits,
                            isApplicable ? { color: pctColor(pct) } : styles.titleDigitsOff,
                          ]}
                        >
                          {isApplicable ? `${pct}%` : '--'}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.cutoutMount, styles.ledWell]}>
                      <LedMeter filled={segmentsForPct(pct)} fullWidth />
                    </View>
                  </View>

                  {isApplicable ? (
                    <SwitchButton
                      // Start (blue) → Continue (amber) → Review (green), by progress.
                      label={pct >= 100 ? 'Review' : pct <= 0 ? 'Start' : 'Continue'}
                      variant={pct >= 100 ? 'success' : pct <= 0 ? 'outline' : 'primary'}
                      width={96}
                      height={58}
                      onPress={() => {
                        const routeName = STUDY_ROUTES[m.key];
                        if (routeName) {
                          navigation.navigate(routeName, { achievementId: topic.id, topicName: topic.name });
                        }
                      }}
                    />
                  ) : devBypass('bypassMethodLocks') ? (
                    // DEV BYPASS (Booth 2026-07-18): dead switches come alive so
                    // every method screen is reachable (may be empty of content).
                    // Restore = devMode.ts → bypassMethodLocks:false.
                    <SwitchButton
                      label="Open"
                      variant="outline"
                      width={96}
                      height={58}
                      onPress={() => {
                        const routeName = STUDY_ROUTES[m.key];
                        if (routeName) {
                          navigation.navigate(routeName, { achievementId: topic.id, topicName: topic.name });
                        }
                      }}
                    />
                  ) : (
                    // Inactive slots carry the SAME action button as a CLEAR,
                    // UNLIT cap (not grey) — a DEAD switch: it travels + clicks
                    // on touch but opens nothing (Booth 2026-07-11).
                    <SwitchButton label="" variant="clear" width={96} height={58} disabled />
                  )}
                  {/* right mounting screw — buttons nudged left for padding */}
                  <View style={{ marginLeft: 3 }}>
                    <PanelScrew angle={SCREW_ROT[i][1]} />
                  </View>
                </View>
              </ElevatedFrame>
            </View>
          );
        })}

        {/* Quiz — the 6th slot in the SAME rack (same tight gap, Booth
            2026-07-10 #4). Kept RAISED at all times (Booth 2026-07-11 #4): when
            passed it was seating while the inactive method panels beside it stay
            proud, which read as the quiz being recessed below its neighbours.
            No static amber accent — the animated quizPulseBorder is the only
            amber cue, so the scenarios→quiz seam matches every method frame. */}
        <ElevatedFrame depressed={false} contentStyle={styles.methodInner}>
          {quizState === 'locked' && (
            <Animated.View pointerEvents="none" style={[styles.quizPulseBorder, { opacity: pulseOpacity }]} />
          )}
          {/* Same anatomy as the method rows so every object aligns (#4):
              screw · icon square · title+status LED column · switch · screw. */}
          {(() => {
            const score = topicProg?.best_genuine_score ?? '';
            const qColor =
              quizState === 'ready' || quizState === 'passed'
                ? '#5bff85'
                : quizState === 'partial'
                  ? '#ffc04a'
                  : '#ff6a5e';
            const qShort =
              quizState === 'passed' || quizState === 'partial'
                ? `${score}/25`
                : quizState === 'ready'
                  ? 'READY'
                  : 'LOCKED';
            const qSummary =
              quizState === 'locked'
                ? 'GATES UNMET'
                : quizState === 'ready'
                  ? 'ALL GATES MET'
                  : quizState === 'passed'
                    ? `PASSED ${score}/25`
                    : 'RETRY FOR 24+';
            return (
              <>
                <View style={styles.methodRow}>
                  <View style={{ marginRight: 3 }}>
                    <PanelScrew angle={0} />
                  </View>
                  <View style={styles.iconWell}>
                    <View style={styles.iconSticker}>
                      <MethodIcon
                        method="quiz"
                        size={46}
                        glowColor={quizState !== 'passed' ? METHOD_COLORS.quiz : undefined}
                      />
                    </View>
                  </View>
                  <View style={styles.methodLeft}>
                    {/* Engraved title + square status LED box, same as the
                        method panels (Booth 2026-07-11). */}
                    <View style={styles.methodTopRow}>
                      <EngravedTitle text="TOPIC QUIZ" />
                      <View style={[styles.cutoutMount, styles.pctBox]}>
                        <Text style={[styles.pctDigits, { color: qColor }]} numberOfLines={1}>
                          {qShort}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.cutoutMount, styles.gateLed]}>
                      <Text style={[styles.gateLine, { color: qColor }]} numberOfLines={1}>
                        {qSummary}
                      </Text>
                    </View>
                  </View>
                  <SwitchButton
                    label={
                      quizState === 'locked'
                        ? 'Locked'
                        : quizState === 'passed'
                          ? 'Practice'
                          : quizState === 'partial'
                            ? 'Retry'
                            : 'Start'
                    }
                    variant={quizState === 'passed' ? 'success' : 'primary'}
                    width={96}
                    height={58}
                    disabled={quizState === 'locked'}
                    onPress={() =>
                      navigation.navigate('Quiz', { achievementId: topic.id, topicName: topic.name })
                    }
                  />
                  <View style={{ marginLeft: 3 }}>
                    <PanelScrew angle={90} />
                  </View>
                </View>

                {/* Detailed gate lines below the aligned row when locked. */}
                {quizState === 'locked' && (
                  <View style={[styles.cutoutMount, styles.gateDisplay]}>
                    {readouts
                      .flatMap((r) => r.lines)
                      .map((l, i) => (
                        <Text key={i} style={[styles.gateLine, { color: l.color }]}>
                          {l.text}
                        </Text>
                      ))}
                  </View>
                )}
              </>
            );
          })()}
        </ElevatedFrame>
        </View>

        {/* The user's custom "Flagged" topic (Booth 2026-07-18): a personal
            topic card over the ONE shared flagged list (Glossary + Flashcards
            stars). Tap = full term list; STUDY = flashcards over the list.
            Local-only study — no server achievement row, so no quiz/progress
            (documented limitation until a backend topic exists). */}
        <View style={styles.flagCard}>
          <Text style={styles.flagStar}>★</Text>
          <Pressable
            style={{ flex: 1 }}
            onPress={openFlaggedTerms}
            accessibilityRole="button"
            accessibilityLabel="List all flagged terms"
          >
            <Text style={styles.topicEyebrow}>MY CUSTOM LIST</Text>
            <Text style={styles.topicName}>{FLAGGED_TOPIC_NAME}</Text>
            <Text style={styles.topicMeta}>
              {flagged.size === 0
                ? 'STAR TERMS IN THE GLOSSARY OR ON FLASHCARDS TO BUILD THIS LIST'
                : `${flagged.size} TERM${flagged.size === 1 ? '' : 'S'}  ·  TAP FOR LIST`}
            </Text>
          </Pressable>
          <SwitchButton
            label="Study"
            variant={flagged.size === 0 ? 'outline' : 'primary'}
            width={96}
            height={58}
            disabled={flagged.size === 0}
            onPress={() =>
              navigation.navigate('Flashcards', {
                achievementId: FLAGGED_TOPIC_ID,
                topicName: FLAGGED_TOPIC_NAME,
              })
            }
          />
        </View>
      </ScrollView>

      <TrophyModal
        visible={trophyOpen}
        iconUrl={topic.icon_url}
        name={topic.name}
        onClose={() => setTrophyOpen(false)}
      />

      {/* Topic term list (Booth 2026-07-18): every term in the current topic. */}
      <Modal
        visible={termsOpen}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setTermsOpen(false)}
      >
        <View style={styles.termsBackdrop}>
          <View style={[styles.termsSheet, { paddingBottom: insets.bottom + 12 }]}>
            <View style={styles.termsHead}>
              <View style={{ flex: 1 }}>
                <Text style={styles.termsEyebrow}>
                  {termsSource === 'flagged' ? 'MY CUSTOM LIST' : 'ALL TERMS IN TOPIC'}
                </Text>
                <Text style={styles.termsTitle} numberOfLines={1}>
                  {termsSource === 'flagged' ? FLAGGED_TOPIC_NAME : topic.name}
                </Text>
              </View>
              <Pressable
                onPress={() => setTermsOpen(false)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Close term list"
              >
                <Text style={styles.termsClose}>✕</Text>
              </Pressable>
            </View>
            {termList == null ? (
              <View style={{ paddingVertical: 32 }}>
                <ActivityIndicator color={colors.amber} />
              </View>
            ) : (
              <>
                <Text style={styles.termsCount}>
                  {termList.length} term{termList.length === 1 ? '' : 's'}
                </Text>
                <FlatList
                  data={termList}
                  keyExtractor={(t) => t.id}
                  style={{ flexGrow: 0 }}
                  renderItem={({ item }) => (
                    <View style={styles.termsRow}>
                      <Text style={styles.termsRowText} numberOfLines={1}>
                        {item.term}
                      </Text>
                      {/* Select icons (Booth 2026-07-18): tag this term into
                          the user's flagged/heart/notify/known lists. */}
                      <TermSelectIcons id={item.id} />
                    </View>
                  )}
                />
              </>
            )}
            <View style={{ marginTop: 10 }}>
              {termsSource === 'flagged' ? (
                <GlassButton
                  label="STUDY FLASHCARDS"
                  tint="orange"
                  height={42}
                  onPress={() => {
                    setTermsOpen(false);
                    navigation.navigate('Flashcards', {
                      achievementId: FLAGGED_TOPIC_ID,
                      topicName: FLAGGED_TOPIC_NAME,
                    });
                  }}
                />
              ) : (
                <GlassButton
                  label="OPEN IN GLOSSARY"
                  tint="blue"
                  height={42}
                  onPress={() => {
                    setTermsOpen(false);
                    navigation.navigate('Glossary', {
                      courseId: data.currentCourse.id,
                      courseCode: data.currentCourse.code,
                      achievementId: topic.id,
                      topicName: topic.name,
                    });
                  }}
                />
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Method-cards intro placeholder (Booth 2026-07-18). */}
      <ScreenIntroOverlay introKey="dashboard" />

      {/* Topic / course learning intro (user request 2026-07-18) — shown before
          the student begins; content fills in as topics/courses are developed. */}
      {intro ? (
        <LearningIntroSheet
          visible
          kind={intro.kind}
          title={intro.name}
          intro={intro.kind === 'course' ? getCourseIntro(intro.name) : getTopicIntro(intro.name)}
          onBegin={dismissIntro}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  center: {
    flex: 1,
    backgroundColor: colors.screenBg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    padding: spacing.xxl,
  },
  errorText: {
    fontFamily: fonts.barlowRegular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSub,
    textAlign: 'center',
  },
  scroll: { padding: 14, paddingBottom: 16, gap: 10 },

  // Topic term-list sheet (Booth 2026-07-18).
  termsBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,.7)', justifyContent: 'flex-end' },
  termsSheet: {
    maxHeight: '78%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderColor: '#2a2b2e',
    backgroundColor: '#141517',
    padding: 16,
  },
  termsHead: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 6 },
  termsEyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 2, color: colors.amber },
  termsTitle: { fontFamily: fonts.oswaldMedium, fontSize: 20, color: colors.textPrimary, marginTop: 2 },
  termsClose: { fontFamily: fonts.oswaldSemiBold, fontSize: 20, color: colors.textSub, padding: 4 },
  termsCount: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.textSub, marginBottom: 8 },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#212226',
    paddingVertical: 9,
  },
  termsRowText: { flex: 1, fontFamily: fonts.barlowRegular, fontSize: 15, color: colors.textSecondary },

  // The user's custom "Flagged" topic card (Booth 2026-07-18) — same chassis
  // metal as the topic display, standalone below the rack.
  flagCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1f2021',
    borderWidth: 2.5,
    borderTopColor: '#4d4e52',
    borderLeftColor: '#34353a',
    borderRightColor: '#34353a',
    borderBottomColor: '#070708',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 2,
  },
  flagStar: {
    fontSize: 30,
    color: colors.amber,
    textShadowColor: 'rgba(255,180,0,.5)',
    textShadowRadius: 10,
    textShadowOffset: { width: 0, height: 0 },
  },


  topicCard: {
    // Powder-coat panel base (fallback behind the PanelFace texture), 3 shades
    // darker than the panels below (Booth 2026-07-11). overflow clips the coat
    // to the rounded top corners.
    backgroundColor: '#1f2021',
    overflow: 'hidden',
    // Metallic 500-series CHASSIS frame (Booth 2026-07-11 #3): light top edge,
    // dark bottom — as if this display is mounted in the same rack chassis the
    // method panels sit in. Darkened 1 more step all around (Booth 2026-07-11).
    borderWidth: 2.5,
    borderTopColor: '#4d4e52',
    borderLeftColor: '#34353a',
    borderRightColor: '#34353a',
    borderBottomColor: '#070708',
    // Square bottom corners so the side rails flow straight into the rack
    // chassis below (Booth 2026-07-11 #5).
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  topicCardProvisional: {
    // [TBD-DESIGN] proposal #1: warm tint + orange border for clamped topics.
    borderColor: 'rgba(255,138,30,.65)',
    backgroundColor: '#1d1206',
  },
  pilotDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#4a4a4a',
    borderWidth: 1,
    borderColor: '#222222',
  },
  topicEyebrow: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 11,
    letterSpacing: 2,
    color: colors.amber,
    textShadowColor: 'rgba(255,180,0,.4)',
    textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 0 },
  },
  topicTrophy: { position: 'absolute', top: 12, right: 12, width: 104, height: 104 },
  topicTrophyEmpty: {
    width: 104,
    height: 104,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  // Keep title/meta clear of the trophy in the top-right.
  topicNameInset: { maxWidth: '68%' },
  topicName: { fontFamily: fonts.oswaldMedium, fontSize: 18, letterSpacing: 0.4, color: colors.textPrimary, marginTop: 4 },
  topicMeta: {
    fontFamily: fonts.barlowCondensedMedium,
    fontSize: 12,
    letterSpacing: 0.7,
    color: colors.textSub,
    marginTop: 2,
  },
  pctRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 10 },
  pctBig: {
    fontFamily: fonts.oswaldBold,
    fontSize: 32,
    color: colors.amber,
    textShadowColor: 'rgba(255,180,0,.5)',
    textShadowRadius: 12,
    textShadowOffset: { width: 0, height: 0 },
  },
  pctLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 1.6, color: colors.textSubAlt },
  // Intro buttons on the topic card (user request 2026-07-18).
  introRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  introBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(255,180,0,.35)',
    backgroundColor: '#1a1409',
  },
  introBtnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1, color: colors.amberLabel },
  provisionalNote: {
    fontFamily: fonts.barlowCondensedMedium,
    fontSize: 13,
    letterSpacing: 0.5,
    color: colors.orange,
    marginTop: 10,
  },

  methodFrame: {
    backgroundColor: '#181818',
    borderWidth: 1,
    borderColor: colors.hairlineAlt,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    gap: 8,
  },
  // Real 500-series blank-panel proportion (~3.5:1 on its side) restored via
  // minHeight; the 58px content row centers, so icon/title/LED/button still
  // share top+bottom edges (Booth 2026-07-11 #4/#5).
  methodInner: { paddingVertical: 8, paddingHorizontal: 8, minHeight: 92, justifyContent: 'center' },
  // Rack group — panels nearly touching, like real 500-series slots.
  // Rack CHASSIS (Booth 2026-07-11 #5): the topic card's metallic side rails
  // continue DOWN behind the method panels + quiz to the bottom of the rack —
  // one continuous 500-series chassis. marginTop cancels the scroll gap so the
  // rails butt flush under the topic card; the panels inset 4px so the dark
  // rails read behind them.
  rackGroup: {
    gap: 4,
    marginTop: -10,
    paddingHorizontal: 4,
    paddingTop: 4,
    paddingBottom: 4,
    backgroundColor: '#0a0a0b',
    borderLeftWidth: 2.5,
    borderRightWidth: 2.5,
    borderBottomWidth: 2.5,
    // Rails darkened 1 step to match the topic card above (Booth 2026-07-11) so
    // the continuous chassis stays one shade.
    borderLeftColor: '#34353a',
    borderRightColor: '#34353a',
    // Visible metallic bottom rail — matches the side rails so the chassis reads
    // as a COMPLETE enclosure around the whole rack, not an open-bottomed frame.
    borderBottomColor: '#34353a',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  methodRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  // Column spans the button height; title at top, LED at bottom → their edges
  // align with the button's top/bottom.
  methodLeft: { flex: 1, height: 58, justifyContent: 'space-between' },
  // Top row: engraved title (left, on the coat) + square % LED box (right).
  methodTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  // Virtually-engraved Cinzel nameplate (Booth 2026-07-15). The wrapper bounds
  // the stacked copies; a fixed lineHeight keeps all three vertically aligned
  // even as adjustsFontSizeToFit shrinks a long legend uniformly.
  engWrap: { flex: 1, height: 30, justifyContent: 'center' },
  engLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    fontFamily: fonts.script,
    fontSize: 21,
    lineHeight: 30,
    // Widened +1.0 (two 0.5 tracking units) per Booth 2026-07-15.
    letterSpacing: 1,
  },
  // Deeper 3D engraving (Booth 2026-07-15): a top-LEFT light source — the cut's
  // top-left edge falls in shadow (dark copy offset up-left), the bottom-right
  // wall catches light (bright copy offset down-right). Larger offsets + more
  // contrast read as physically incised, not a flat shadow.
  engDark: { color: 'rgba(0,0,0,0.98)', transform: [{ translateX: -0.9 }, { translateY: -1.4 }] },
  engLight: { color: 'rgba(255,255,255,0.45)', transform: [{ translateX: 1.1 }, { translateY: 1.7 }] },
  // Warm dark under-copy a hair off-register — uneven tooling depth (ref photo).
  engGrain: {
    color: 'rgba(38,28,16,0.55)',
    transform: [{ translateX: 0.5 }, { translateY: 0.4 }],
  },
  // Letter floor: bare warm metal, brightened for contrast against the gray
  // coat (Booth 2026-07-15 rev 2) — still bronzed, never paint-white. The
  // heavier dark shadow deepens the cut so the engraving reads at a glance.
  engFill: {
    color: '#d8cfba',
    textShadowColor: 'rgba(0,0,0,0.95)',
    textShadowOffset: { width: 0.8, height: 1.4 },
    textShadowRadius: 2.4,
  },
  // Inactive method — dimmer, shallower cut.
  engFillOff: {
    color: '#8a867c',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0.8, height: 1.4 },
    textShadowRadius: 2.4,
  },
  // Small SQUARE recessed LED box holding just the % (or quiz status).
  pctBox: {
    minWidth: 40,
    height: 34,
    paddingHorizontal: 7,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0c0d0c',
  },
  methodRowDim: { opacity: 0.45, borderColor: '#232323' },
  // Shared "mounted from below through a panel cutout" edge treatment.
  // THICKER panel metal (Booth 2026-07-10 #2): a deeper dark shadow on the
  // top/left cut edges; a small bright bevel catching light on the bottom/
  // right lip (#8) gives the cutaway visible depth.
  cutoutMount: {
    borderTopWidth: 2.5,
    borderLeftWidth: 1.5,
    borderBottomWidth: 1.5,
    borderRightWidth: 1,
    borderTopColor: '#000000',
    borderLeftColor: '#000000',
    borderRightColor: 'rgba(255,255,255,0.2)',
    borderBottomColor: 'rgba(255,255,255,0.38)',
    borderRadius: 2.5,
  },
  // ONE readout: method # + name left, % right (Booth 2026-07-10). Modern
  // display type (Barlow Condensed), not generic LED-mono.
  titleDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    backgroundColor: '#0c0d0c',
    paddingVertical: 5,
    paddingHorizontal: 9,
  },
  titleDigits: {
    flexShrink: 1,
    fontFamily: fonts.barlowCondensedSemiBold,
    fontSize: 15,
    letterSpacing: 1,
    color: '#ffc04a',
    textShadowColor: 'rgba(255,180,0,0.55)',
    textShadowRadius: 3,
    textShadowOffset: { width: 0, height: 0 },
  },
  pctDigits: {
    fontFamily: fonts.barlowCondensedSemiBold,
    fontSize: 13,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(255,255,255,0.25)',
    textShadowRadius: 3,
    textShadowOffset: { width: 0, height: 0 },
  },
  // Unlit LED digits — inactive methods' displays (Booth 2026-07-10 #5).
  titleDigitsOff: {
    color: '#6f7072',
    textShadowColor: 'rgba(255,255,255,0.08)',
    textShadowRadius: 1,
  },
  // Quiz status/gate text LED screen (#4).
  gateDisplay: {
    backgroundColor: '#0c0d0c',
    paddingVertical: 7,
    paddingHorizontal: 10,
    gap: 4,
  },
  // Quiz's one-line status in the LED-meter position (aligns with methods).
  gateLed: {
    alignSelf: 'stretch',
    backgroundColor: '#0c0d0c',
    paddingVertical: 3,
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  // Recessed cutout WELL — 58×58 so its top/bottom align with the button +
  // title/LED column (#5). Neutral dark recess (NOT lit).
  iconWell: {
    width: 58,
    height: 58,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0b0c0d',
    borderWidth: 1,
    borderTopColor: '#000000',
    borderLeftColor: '#000000',
    borderRightColor: 'rgba(255,255,255,0.12)',
    borderBottomColor: 'rgba(255,255,255,0.22)',
  },
  // Plain black square surround (no border — the LIT line is the MethodIcon
  // TILE's own border, Booth 2026-07-11 #1). Sized so the enlarged 46px tile
  // (#7) sits with a small black margin inside the 58 well.
  iconSticker: {
    width: 54,
    height: 54,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0b0c0d',
  },
  ledWell: {
    alignSelf: 'stretch',
    backgroundColor: '#0b0b0d',
    padding: 2.5,
  },

  quizCard: {
    borderWidth: 1,
    borderColor: 'rgba(255,180,0,.5)',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#1a1409',
  },
  // Inset 0 so it stays inside ElevatedFrame's clipped rounded rect.
  quizPulseBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1.5,
    borderColor: 'rgba(255,180,0,.85)',
    borderRadius: 11,
  },
  quizHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  quizTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginRight: 10 },
  // Gate/status lines on the quiz's LED screen — same modern display type.
  gateLine: {
    fontFamily: fonts.barlowCondensedSemiBold,
    fontSize: 13,
    letterSpacing: 0.6,
    textShadowColor: 'rgba(255,255,255,0.2)',
    textShadowRadius: 2,
    textShadowOffset: { width: 0, height: 0 },
  },
});
