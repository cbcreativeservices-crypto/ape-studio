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
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { StudyStackParamList } from '../../navigation/types';
import Svg, { Circle, Rect, Defs, LinearGradient as SvgLinearGradient, Stop, Line } from 'react-native-svg';
import { AppHeader } from '../../components/AppHeader';
import { NavIcon } from '../../components/nav/NavIcon';
import { TopicDeckSheet } from './TopicDeckSheet';
import {
  orderDeckIds,
  removeFromDeck,
  restoreToDeck,
  setDeckMode,
  setDeckOrder,
  useDeckPrefs,
  type DeckPrefs,
} from '../../features/dashboard/deckOrderStore';
import { DeckIcon } from '../../components/DeckIcon';
import { ElevatedFrame } from '../../components/ElevatedFrame';
import { GlassButton } from '../../components/GlassButton';
import { LedMeter, segmentsForPct } from '../../components/LedMeter';
import { MethodIcon, METHOD_COLORS, type MethodKey } from '../../components/MethodIcon';
import { StudioButton } from '../../components/StudioButton';
import { SwitchButton } from '../../components/SwitchButton';
import { TrophyImage } from '../../components/TrophyImage';
import { JogDial, JogOverlay } from '../../components/JogWheel';
import { TrophyModal } from '../../components/TrophyModal';
import { colors, fonts, spacing } from '../../theme/tokens';
import {
  fetchDashboard,
  fetchEnrollmentDashboard,
  getLastTopicIndex,
  setLastTopicIndex,
  type DashboardData,
  type Topic,
} from '../../features/dashboard/api';
import { FREE_ENROLL_GS, isFreeEnrollGs, useEnrollment } from '../../features/enrollment/enrollmentStore';
import { supabase } from '../../lib/supabase';
import { gateReadout, pctColor } from '../../features/dashboard/gates';
import { fetchGlossaryItemsByIds, fetchTopicItems, studyDisplayPct } from '../../features/study/api';
import { setLastStudyLocation } from '../../features/study/lastStudyLocation';
import {
  FLAGGED_TOPIC_ID,
  FLAGGED_TOPIC_NAME,
  useCustomOnDashboard,
  useTermList,
} from '../../features/flags/flaggedStore';
import { TermSelectIcons } from '../../features/flags/TermSelectIcons';
import { LowLightDim } from '../../features/settings/LowLightLayer';
import { consumeDevPreview } from '../../features/dev/devPreview';
import { devBypass } from '../../config/devMode';
import { ScreenIntroOverlay } from '../../features/intro/ScreenIntroOverlay';
import { LearningIntroSheet } from '../../features/intro/LearningIntroSheet';
import { getCourseIntro, getTopicIntro, isIntroEmpty } from '../../features/intro/learningIntros';
import { replayQuizSubmissions } from '../../features/quiz/api';
import { onStudyProgress } from '../../features/study/sync';
import { loadAllLocalMethodStates, mergeItemStates } from '../../features/study/localProgress';
import { useEntitlement } from '../../features/commercial/EntitlementProvider';
import { fetchCommercialDashboard, getLastPublicCourse } from '../../features/commercial/commercialDashboard';

const METHOD_ORDER: { key: MethodKey; label: string }[] = [
  { key: 'flashcards', label: 'FLASHCARDS' },
  { key: 'fill_in_blank', label: 'FILL-IN-BLANK' },
  { key: 'matching', label: 'MATCHING' },
  { key: 'scenarios', label: 'SCENARIOS' },
];

// LA-2A-inspired panel textures (owner request 2026-07-25). Pure react-native-svg
// gradients + fine vertical striations — NO image assets. Both fill their
// container absolutely BEHIND the content; the parent ElevatedFrame already
// clips to its rounded corners (own overflow:hidden wrapper as a second clip).
// viewBox 0..100 with preserveAspectRatio="none" stretches to any panel size.

/** BLACK FACE — the LA-2A near-black matte control panel with a subtle vertical
 *  brushed grain (for the study-method panels; existing light-on-black content
 *  stays legible). */
// Bead-blast GRIT — randomly-scattered particulate specks (owner 2026-08-01).
// The old version tiled a fixed 5×5 speck motif and stretched it with the panel,
// which turned the dots into regular horizontal streaks (the "wavy" look). This
// is a one-time RANDOM point cloud (deterministic xorshift, so it's stable),
// stored as fractions of the panel and multiplied into PIXEL space at render so
// every speck stays a round particulate at any panel size — no tiling, no grain
// direction.
const GRIT_SPECKS = (() => {
  let s = 0x2545f491 >>> 0;
  const rnd = () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 1_000_000) / 1_000_000;
  };
  const out: { fx: number; fy: number; r: number; light: boolean; a: number }[] = [];
  for (let i = 0; i < 130; i++) {
    out.push({
      fx: rnd(),
      fy: rnd(),
      r: 0.45 + rnd() * 0.7, // px radius — tiny round particulate
      light: rnd() > 0.5,
      a: 0.05 + rnd() * 0.09,
    });
  }
  return out;
})();

// GRAY textured rack-blank face (owner 2026-08-01) — modeled on the SPL 500-rack
// blank panels: a medium-gray vertical gradient (lighter upper-mid, darker top &
// bottom edges) with random bead-blasted particulate grit. The debossed titles
// were already tuned for a gray floor, so they read correctly here. Drawn in
// measured PIXEL space so the specks are round dots, not stretched streaks.
function BlackFaceBg() {
  const [size, setSize] = useState({ w: 0, h: 0 });
  return (
    <View
      pointerEvents="none"
      style={styles.textureFill}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setSize({ w: Math.round(width), h: Math.round(height) });
      }}
    >
      {size.w > 0 && size.h > 0 ? (
        <Svg width={size.w} height={size.h}>
          <Defs>
            {/* objectBoundingBox gradient (default units) — size-independent, so
                the shared id is safe across every panel instance. */}
            <SvgLinearGradient id="apeGrayFace" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#3a3a3e" />
              <Stop offset="0.42" stopColor="#46464b" />
              <Stop offset="1" stopColor="#2c2c30" />
            </SvgLinearGradient>
          </Defs>
          <Rect x={0} y={0} width={size.w} height={size.h} fill="url(#apeGrayFace)" />
          {/* Random particulate specks — round dots at pixel radius. */}
          {GRIT_SPECKS.map((g, i) => (
            <Circle
              key={i}
              cx={g.fx * size.w}
              cy={g.fy * size.h}
              r={g.r}
              fill={g.light ? `rgba(255,255,255,${g.a})` : `rgba(0,0,0,${g.a + 0.03})`}
            />
          ))}
          {/* Top lit lip + bottom shadow so each blank reads as its own mounted panel. */}
          <Line x1={0} y1={0.6} x2={size.w} y2={0.6} stroke="rgba(255,255,255,0.16)" strokeWidth={0.7} />
          <Line x1={0} y1={size.h - 0.6} x2={size.w} y2={size.h - 0.6} stroke="rgba(0,0,0,0.4)" strokeWidth={0.9} />
        </Svg>
      ) : null}
    </View>
  );
}

/** BRUSHED METAL — the LA-2A brushed-aluminum chassis (for the quiz panel). A
 *  MID-tone metallic vertical gradient with a lighter top edge, a darker bottom,
 *  and fine vertical striations alternating light/dark. Mid-tone keeps the quiz's
 *  dark engraved title + dark LED boxes legible. */
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
function EngravedTitle({
  text,
  off = false,
  dark = false,
  fillColor,
}: {
  text: string;
  off?: boolean;
  /** Flashcards charcoal panel — use the darker debossed floor. */
  dark?: boolean;
  fillColor?: string;
}) {
  const display = toTitle(text);
  // DEBOSSED (user request 2026-07-18): the letter floor sits BELOW the surface —
  // its top-left edge in shadow, its bottom-right lip catching light. `fillColor`
  // overrides the floor color (the quiz uses BLACK on its cream face).
  const fillStyle = fillColor
    ? [styles.engLayer, styles.engFillBase, { color: fillColor }]
    : dark
      ? [styles.engLayer, off ? styles.engFillOffDark : styles.engFillDark]
      : [styles.engLayer, off ? styles.engFillOff : styles.engFill];
  return (
    <View style={styles.engWrap} accessible accessibilityRole="text" accessibilityLabel={text}>
      {/* top-left edge in shadow (deboss) */}
      <Text
        style={[styles.engLayer, styles.engDark]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
        importantForAccessibility="no-hide-descendants"
      >
        {display}
      </Text>
      {/* bottom-right lip catching light (deboss) */}
      <Text
        style={[styles.engLayer, styles.engLight]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
        importantForAccessibility="no-hide-descendants"
      >
        {display}
      </Text>
      <Text
        style={fillStyle}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
        importantForAccessibility="no-hide-descendants"
      >
        {display}
      </Text>
      {/* Near-white trace ON TOP of the floor (user request 2026-07-24) — a light
          line inside each debossed letter. Applied to ALL titles (on AND off);
          it is a style detail, NOT the on/off indicator. */}
      <Text
        style={[styles.engLayer, styles.engTrace]}
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
  Record<MethodKey, 'Flashcards' | 'FillInBlank' | 'Matching' | 'Scenarios'>
> = {
  flashcards: 'Flashcards',
  fill_in_blank: 'FillInBlank',
  matching: 'Matching',
  scenarios: 'Scenarios',
};

export function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<StudyStackParamList>>();
  const route = useRoute<RouteProp<StudyStackParamList, 'Dashboard'>>();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [topicIdx, setTopicIdx] = useState(0);
  // Jog dial (owner 2026-08-01): the small dial IS the live control — holding it
  // opens a big mirror wheel and the SAME gesture turns it instantly (no Modal,
  // no tap-then-grab). The wheel spins endlessly (the topic index WRAPS — no
  // end-stops). jogActiveRef tells the card's swipe to stand down while held.
  const jogSpin = useRef(new Animated.Value(0)).current;
  const jogActiveRef = useRef(false);
  const [jogActive, setJogActive] = useState(false);
  // CM6 (Booth 2026-07-11): commercialMode renders a PUBLIC course (seq order
  // from the seed) through this same screen; institutional path unchanged.
  const { commercialMode, caps } = useEntitlement();

  // Enrollment-driven Dashboard (user request 2026-07-22): a COURSE ⇄ MY
  // ENROLLMENT toggle. In enrollment mode the top swiper iterates the user's
  // enrolled topics (active + inactive; inactive dimmed) and the full study
  // machinery loads per topic. Available to ANY user with enrolled topics.
  const enrolled = useEnrollment();
  // The dashboard is now driven by the user's ENROLLMENT (they manage it via the
  // "My Enrollments" screen); the COURSE ⇄ ENROLLMENT toggle was removed (user
  // request 2026-07-23). Falls back to the course/commercial fetch only when no
  // topics are loaded (see load() guard).
  const [viewMode, setViewMode] = useState<'course' | 'enrollment'>('enrollment');
  const viewModeRef = useRef(viewMode);
  viewModeRef.current = viewMode;
  // The study swipe shows ACTIVE enrolled topics the user can ACCESS. Free/
  // non-paid users only get the free topics regardless of what they've added
  // (user request 2026-07-22); paid members get all their active topics.
  const enrolledGsRef = useRef<number[]>([]);
  enrolledGsRef.current = enrolled
    .filter((e) => e.active && (caps.allTopics || isFreeEnrollGs(e.gs)))
    .map((e) => e.gs);
  const inactiveGs = useRef(new Set<number>());
  inactiveGs.current = new Set(enrolled.filter((e) => !e.active).map((e) => e.gs));

  const pulse = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);
  // Tap the topic trophy → full-size popup (Booth 2026-07-11).
  const [trophyOpen, setTrophyOpen] = useState(false);
  // Tap the topic card → all terms in this topic as a list (Booth 2026-07-18).
  // Rows carry ids so each row's select icons (⚑ ♥ ★ ✓ ✗) can tag the term.
  const [termsOpen, setTermsOpen] = useState(false);
  const [termList, setTermList] = useState<{ id: string; term: string }[] | null>(null);
  // The same sheet also serves the user's Custom List card.
  const [termsSource, setTermsSource] = useState<'topic' | 'flagged'>('topic');
  // The user's ★ CUSTOM LIST (starred) — built via the ★ icon in the Glossary /
  // Flashcards term popups (user request 2026-07-18: the card is the star list,
  // not the ⚑ flagged list).
  const starred = useTermList('starred');

  // Whether the user's Custom List shows as a synthetic current-topic here
  // (toggled from the Enrollment screen). Device-local; default off.
  const customOnDashboard = useCustomOnDashboard();
  const customOnDashboardRef = useRef(customOnDashboard);
  customOnDashboardRef.current = customOnDashboard;
  // Topic-deck ordering (owner 2026-08-01): default alphabetical; the Topic-Deck
  // sheet (blue Study icon) lets the user engage a custom order, remove topics,
  // and jump to one.
  const deckPrefs = useDeckPrefs();
  const deckPrefsRef = useRef<DeckPrefs>(deckPrefs);
  deckPrefsRef.current = deckPrefs;
  const [deckOpen, setDeckOpen] = useState(false);

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

  // Record that the learner last sat on the Dashboard, so the Enrollments
  // "CONTINUE LEARNING" banner returns here (not into a method) when they left
  // from the dashboard.
  useFocusEffect(
    useCallback(() => {
      setLastStudyLocation({ kind: 'dashboard' });
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
      // A session-less GUEST studies the FREE topics on-device only. It must NEVER
      // touch the student-record path: fetchDashboard()/fetchCommercialDashboard()
      // query users/enrollment/progress, which throw 'user_not_found' for a guest
      // (that used to blank the whole Study tab). Instead load the free topics
      // through the guest-safe enrollment fetch (userId stays 'local' → no progress
      // queries; content — achievements/glossary — is anon-readable). Progress = the
      // device-local mirror merged below. Keyed on the real session, NOT entitlement,
      // since returning authed users also default to the mock 'anonymous' state.
      const { data: sessData } = await supabase.auth.getSession();
      const isGuest = !sessData.session;
      const guestFreeGs = enrolledGsRef.current.filter(isFreeEnrollGs);
      const d = isGuest
        ? await fetchEnrollmentDashboard(guestFreeGs.length > 0 ? guestFreeGs : [...FREE_ENROLL_GS])
        : viewModeRef.current === 'enrollment' && enrolledGsRef.current.length > 0
          ? await fetchEnrollmentDashboard(enrolledGsRef.current)
          : commercialMode
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
      // The carousel order is CUSTOM-first then alphabetical (owner 2026-08-01),
      // so map the frontier topic's ID to its index in THAT reordered list.
      let frontierId: string | null = null;
      d.topics.forEach((t) => {
        const st = d.progressByTopic.get(t.id)?.status ?? 'locked';
        if (st !== 'locked') frontierId = t.id;
      });
      const members = [
        ...(customOnDashboardRef.current ? [{ id: FLAGGED_TOPIC_ID, name: FLAGGED_TOPIC_NAME }] : []),
        ...d.topics.map((t) => ({ id: t.id, name: t.name })),
      ];
      const orderedIds = orderDeckIds(
        members,
        deckPrefsRef.current,
        customOnDashboardRef.current ? FLAGGED_TOPIC_ID : undefined,
      );
      const frontier = frontierId ? Math.max(0, orderedIds.indexOf(frontierId)) : 0;
      const stored = await getLastTopicIndex(d.currentCourse.id);
      setTopicIdx(stored != null ? Math.min(stored, orderedIds.length - 1) : frontier);
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

  // Toggle Course ⇄ My Enrollment (user request 2026-07-22) — reload at once.
  const switchMode = useCallback(
    (next: 'course' | 'enrollment') => {
      if (viewModeRef.current === next) return;
      setViewMode(next);
      viewModeRef.current = next;
      void load();
    },
    [load],
  );

  // Keep the enrollment view in sync as the list is edited: reload on any change
  // while viewing it, and fall back to the course view if it empties.
  const enrolledKey = enrolled.map((e) => `${e.gs}${e.active ? '' : '!'}`).join(',');
  useEffect(() => {
    if (viewModeRef.current !== 'enrollment') return;
    // Reload as the enrollment list is edited; an empty list simply falls back to
    // the course/commercial fetch inside load() (user request 2026-07-23).
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enrolledKey]);

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

  // Derived per-render (cheap; small arrays). When the user has opted in, a
  // synthetic "My Custom List" topic is appended LAST so it rides the same
  // current-topic carousel. It carries applicable_methods=[] so every derived
  // value (overallPct, quizState, rowsForTopic…) computes safely to 0/empty.
  const customTopic: Topic = {
    id: FLAGGED_TOPIC_ID,
    course_id: '',
    sequence_in_course: 9999,
    name: FLAGGED_TOPIC_NAME,
    applicable_methods: [],
    is_prerequisite: false,
    icon_url: null,
    global_sequence: null,
  };
  // Scroll order (owner 2026-08-01): resolved from the deck prefs — ALPHABETICAL
  // by default (★ Custom List pinned first), or the user's CUSTOM order; removed
  // topics are excluded. data.topics keeps its course order for the progress/
  // frontier logic; only this carousel is reordered.
  const deckMembers: Topic[] = data ? (customOnDashboard ? [customTopic, ...data.topics] : [...data.topics]) : [];
  const deckById = new Map(deckMembers.map((t) => [t.id, t] as const));
  const orderedIds = orderDeckIds(
    deckMembers.map((t) => ({ id: t.id, name: t.name })),
    deckPrefs,
    customOnDashboard ? FLAGGED_TOPIC_ID : undefined,
  );
  const topics = orderedIds.map((id) => deckById.get(id)).filter((t): t is Topic => t != null);
  const removedMembers = deckMembers
    .filter((t) => deckPrefs.removed.includes(t.id))
    .map((t) => ({ id: t.id, name: t.name }));
  const topic = topics[topicIdx];
  const isCustom = topic?.id === FLAGGED_TOPIC_ID;

  // Study-icon deep link (user request 2026-07-24): when navigated here with a
  // `focusGs` (a topic global_sequence, or FLAGGED_TOPIC_ID for the custom list),
  // front that topic immediately once its data is loaded, then clear the param.
  const focusGs = route.params?.focusGs;
  useEffect(() => {
    if (focusGs == null || topics.length === 0) return;
    const i = topics.findIndex((t) =>
      typeof focusGs === 'string' ? t.id === focusGs : t.global_sequence === focusGs,
    );
    if (i >= 0) setTopicIdx(i);
    navigation.setParams({ focusGs: undefined });
  }, [focusGs, topics, navigation]);
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

  // Deck can shrink (topic removed) or reorder — keep topicIdx in bounds.
  useEffect(() => {
    setTopicIdx((i) => Math.min(i, Math.max(0, topics.length - 1)));
  }, [topics.length]);

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
      // Stand down while the jog dial is held (owner 2026-08-01) — otherwise the
      // card's horizontal-swipe capture steals the dial's gesture and it freaks
      // out. jogActiveRef is set on the dial's touch-down (before this fires).
      onMoveShouldSetPanResponderCapture: (_e, g) =>
        !jogActiveRef.current && Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy) * 1.2,
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
  const topicIdForTerms = topic?.id;
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
      const items = await fetchGlossaryItemsByIds([...starred]);
      setTermList(items.map((i) => ({ id: i.id, term: i.term }))); // API pre-sorts by term
    } catch {
      setTermList([]);
    }
  }, [starred]);

  // Dev Visual Index: auto-open the Custom List terms popup for preview (TEMPORARY).
  useEffect(() => {
    if (consumeDevPreview('dashboard:terms')) void openFlaggedTerms();
  }, [openFlaggedTerms]);

  // Auto-open the not-yet-seen intro (user request 2026-07-18): the COURSE
  // intro first, then the CURRENT TOPIC's — so there is always an intro before
  // beginning. Each is shown once (persisted); re-openable from the card.
  useEffect(() => {
    if (!data || intro) return;
    // Only AUTO-open an intro that actually has authored content — otherwise an
    // empty placeholder modal would cover the dashboard and block all input
    // (bug fix 2026-07-18). The ⓘ buttons still open them on demand.
    const courseKey = `course:${data.currentCourse.id}`;
    if (!introSeen.has(courseKey) && !isIntroEmpty(getCourseIntro(data.currentCourse.name))) {
      setIntro({ kind: 'course', key: courseKey, name: data.currentCourse.name });
      return;
    }
    const t = topics[topicIdx];
    if (t) {
      const topicKey = `topic:${t.id}`;
      if (!introSeen.has(topicKey) && !isIntroEmpty(getTopicIntro(t.name))) {
        setIntro({ kind: 'topic', key: topicKey, name: t.name });
      }
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
        {viewMode === 'enrollment' && (
          <View style={{ width: 220 }}>
            <StudioButton label="View course instead" variant="secondary" small onPress={() => switchMode('course')} />
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

  // Enrollment view: this topic is INACTIVE (set aside) — shown but dimmed.
  const topicInactive =
    viewMode === 'enrollment' &&
    topic.global_sequence != null &&
    inactiveGs.current.has(topic.global_sequence);

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
          // The blue Study icon opens the Topic-Deck manager (owner 2026-08-01);
          // About moved to Settings.
          onLogoPress={() => setDeckOpen(true)}
          logo={
            <View style={styles.studyLogo}>
              <View style={{ transform: [{ scale: 2.1 }] }}>
                <NavIcon icon="Study" lit showLabel={false} />
              </View>
            </View>
          }
          right={
            // "My Enrollments" → the enrollment screen. Styled to MATCH the home
            // screen's green Enrollments nav button (dark box + green border/text)
            // rather than the lighter glass look (user request 2026-07-23).
            <Pressable
              style={styles.myEnrollBtn}
              onPress={() => (navigation as any).navigate('Awards', { category: 'enrollment' })}
              accessibilityRole="button"
              accessibilityLabel="Enrollments"
            >
              <Text style={styles.myEnrollBtnText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                ENROLLMENTS
              </Text>
            </Pressable>
          }
        />

        {/* The COURSE ⇄ MY ENROLLMENT toggle was removed (user request
            2026-07-23) — the dashboard follows the enrollment list, adjusted via
            the "My Enrollments" button above. */}

        {/* Topic title block (swipeable — free roam across all topics) */}
        <View
          {...pan.panHandlers}
          style={[styles.topicCard, provisional && styles.topicCardProvisional, topicInactive && styles.topicCardInactive]}
        >
          {/* Texture removed + darkened 2 more shades (Booth 2026-07-11) — the
              Current Topic display is now a plain dark panel. */}
          {/* pilot dot removed (Booth 2026-07-11 #6). */}
          {/* Current topic's trophy, top-right — ALWAYS full clarity here, even
              when unearned (the gray→lit earn state lives on the Achievements
              screen; the Dashboard shows the topic art at full illumination).
              Booth 2026-07-09d. Subtle placeholder when the topic has no art. */}
          {/* Header row (owner 2026-08-01): labels + % on the LEFT, the trophy
              over the enlarged jog wheel in the CENTER, and the overall-progress
              meter as a vertical VU column (filling up) on the FAR RIGHT. */}
          <View style={styles.topicHeadRow}>
            <View style={styles.topicTextCol}>
              {/* Tap the title area → full term list for this topic (Booth
                  2026-07-18). Swipe still owned by the card's PanResponder. */}
              <Pressable
                onPress={isCustom ? openFlaggedTerms : openTerms}
                accessibilityRole="button"
                accessibilityLabel={isCustom ? `List terms in ${topic.name}` : `List all terms in ${topic.name}`}
              >
                <Text style={styles.topicEyebrow}>{topicInactive ? 'CURRENT TOPIC · INACTIVE' : 'CURRENT TOPIC'}</Text>
                <Text style={[styles.topicName, topicInactive && styles.topicNameDim]}>{topic.name}</Text>
                <Text style={styles.topicMeta}>
                  {isCustom
                    ? `${starred.size} TERM${starred.size === 1 ? '' : 'S'}`
                    : `TOPIC ${topicIdx + 1} OF ${topics.length} · ${data.currentCourse.name.toUpperCase()}`}
                  {swipeHint ? `  ·  ${swipeHint}` : ''}
                </Text>
              </Pressable>
              {/* Overall progress — label left-justified, the amber % below it
                  (owner 2026-08-01); both keep their existing text sizes. */}
              <View style={styles.pctBlock}>
                <Text style={styles.pctLabel}>OVERALL TOPIC PROGRESS</Text>
                <Text style={styles.pctBig}>{overallPct}%</Text>
              </View>
            </View>

            <View style={styles.topicCenterCol}>
              {/* Tap the trophy → full-size popup (Booth 2026-07-11). */}
              <Pressable
                style={styles.topicTrophy}
                onPress={() => setTrophyOpen(true)}
                accessibilityRole="button"
                accessibilityLabel={`View ${topic.name} trophy`}
              >
                <TrophyImage
                  iconUrl={topic.icon_url}
                  size={100}
                  radius={12}
                  fallback={<View style={styles.topicTrophyEmpty} />}
                />
              </Pressable>
              {/* Jog dial — hold it and turn; the big mirror wheel opens
                  instantly and the same gesture scrolls the topics (owner
                  2026-08-01). Endless spin: the index wraps. */}
              <View style={styles.topicJog}>
                <JogDial
                  size={96}
                  disabled={topics.length <= 1}
                  spin={jogSpin}
                  onGrant={() => {
                    jogActiveRef.current = true;
                    setJogActive(true);
                  }}
                  // Apply LIVE (throttled in the dial) so the current-topic
                  // container behind changes as you turn; the index wraps.
                  onStep={(dir) => {
                    const n = topics.length;
                    if (n > 0) goTo((((idxRef.current + dir) % n) + n) % n);
                  }}
                  onRelease={() => {
                    jogActiveRef.current = false;
                    setJogActive(false);
                  }}
                />
              </View>
            </View>

            {/* Overall progress — vertical VU column, filling upward. */}
            <View style={styles.topicMeterCol}>
              <LedMeter filled={segmentsForPct(overallPct)} vertical />
            </View>
          </View>
          {/* Topic/course intro buttons removed (user request 2026-07-18) — the
              intros still auto-show once before beginning (when content exists). */}
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
        {isCustom ? (
          // Custom List body — no methods, no quiz: a single dark panel that
          // studies the user's ★ starred terms in local Flashcards mode.
          <ElevatedFrame depressed={false} contentStyle={styles.methodInner}>
            <View style={styles.customRow}>
              <View style={styles.customDeck}>
                <DeckIcon color={colors.blue} size={40} fill="rgba(47,155,255,0.22)" />
              </View>
              <View style={styles.methodLeft}>
                <Text style={styles.customCount}>
                  {`${starred.size} TERM${starred.size === 1 ? '' : 'S'} · MY CUSTOM LIST`}
                </Text>
              </View>
              <SwitchButton
                label="Study"
                variant="primary"
                width={96}
                height={58}
                disabled={starred.size === 0}
                onPress={() =>
                  navigation.navigate('Flashcards', {
                    achievementId: FLAGGED_TOPIC_ID,
                    topicName: FLAGGED_TOPIC_NAME,
                  })
                }
              />
            </View>
          </ElevatedFrame>
        ) : (
          <>
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
              {/* All method panels share the SAME gray coat again (user request
                  2026-07-23) — the Flashcards charcoal special-case was reverted. */}
              <ElevatedFrame depressed={complete} contentStyle={styles.methodInner}>
                {/* LA-2A BLACK-FACE panel texture behind the content (owner
                    request 2026-07-25): near-black matte face + faint vertical
                    brushed grain. Existing light-on-black content is unchanged. */}
                <BlackFaceBg />
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
                        size={43}
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
                      width={89}
                      height={54}
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
                      width={89}
                      height={54}
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
                    <SwitchButton label="" variant="clear" width={89} height={54} disabled />
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
        <ElevatedFrame depressed={false} chrome contentStyle={styles.methodInner}>
          {/* Gray textured rack-blank face, same as the method panels (owner
              2026-08-01) — the quiz now matches the rest of the rack. */}
          <BlackFaceBg />
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
                        // Frame lights ONCE PASSED (done cue) — matches the method
                        // icons; was inverted (lit until passed), owner 2026-08-01.
                        glowColor={quizState === 'passed' ? METHOD_COLORS.quiz : undefined}
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
          </>
        )}
        </View>

        {/* The bottom "My Custom List" card was removed (user request
            2026-07-24). The custom list is moving to a selection from the topic
            carousel at the top of the current-topic area. */}
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
                      <TermSelectIcons
                        id={item.id}
                        bookmarkCtx={termsSource === 'flagged' ? 'glossary' : (topicIdForTerms ?? 'glossary')}
                        // The custom-list ('flagged') popup shows ONLY the custom
                        // icon (no bookmark / ✓ / ✗); topic-term popups keep them.
                        hideBookmark={termsSource === 'flagged'}
                        hideKnown={termsSource === 'flagged'}
                      />
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
        <LowLightDim />
      </Modal>

      {/* Big-wheel jog popup (owner 2026-08-01) — turn to scroll topics, release
          to close. */}
      <JogOverlay active={jogActive} spin={jogSpin} />

      {/* Topic-deck manager (blue Study icon) — reorder / remove / jump / mode. */}
      <TopicDeckSheet
        visible={deckOpen}
        onClose={() => setDeckOpen(false)}
        mode={deckPrefs.mode}
        active={topics.map((t) => ({ id: t.id, name: t.name }))}
        removed={removedMembers}
        onSetMode={setDeckMode}
        onReorder={setDeckOrder}
        onRemove={removeFromDeck}
        onRestore={restoreToDeck}
        onSelect={(id) => {
          const i = topics.findIndex((t) => t.id === id);
          if (i >= 0) goTo(i);
          setDeckOpen(false);
        }}
      />

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
    // Tall enough for the center trophy+jog cluster and the far-right vertical
    // meter (owner 2026-08-01) — the card clips its overflow, so reserve room.
    minHeight: 232,
  },
  topicCardProvisional: {
    // [TBD-DESIGN] proposal #1: warm tint + orange border for clamped topics.
    borderColor: 'rgba(255,138,30,.65)',
    backgroundColor: '#1d1206',
  },
  // Enrollment view: inactive topic panel reads set-aside (user request 2026-07-22).
  topicCardInactive: { borderTopColor: '#3a3a3a', backgroundColor: '#151515', opacity: 0.82 },
  topicNameDim: { opacity: 0.55 },
  // COURSE ⇄ MY ENROLLMENT toggle (user request 2026-07-22).
  modeRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  modeBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: '#131313',
  },
  modeBtnOn: { borderColor: colors.amber, backgroundColor: 'rgba(255,198,77,.1)' },
  modeBtnOnGreen: { borderColor: 'rgba(55,224,95,.7)', backgroundColor: 'rgba(55,224,95,.1)' },
  modeBtnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1, color: colors.textSub },
  // MY ENROLLMENTS header button — matches the home screen's green Enrollments
  // nav button (user request 2026-07-23).
  myEnrollBtn: {
    width: 82,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 5,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(55,224,95,.7)',
    backgroundColor: 'rgba(55,224,95,.1)',
  },
  myEnrollBtnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 9.5, letterSpacing: 0.2, color: '#37e05f' },
  // Blue Study icon standing in for the company logo (owner 2026-08-01) — the
  // NavIcon Study glyph scaled up to the logo footprint.
  studyLogo: { width: 47, height: 47, alignItems: 'center', justifyContent: 'center' },
  modeBtnTextOn: { color: colors.amber },
  modeBtnTextOnGreen: { color: '#37e05f' },
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
  // Header row + its three columns (owner 2026-08-01).
  topicHeadRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  topicTextCol: { flex: 1, minWidth: 0 },
  topicCenterCol: { alignItems: 'center', justifyContent: 'flex-start', gap: 8 },
  topicMeterCol: { alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch' },
  topicTrophy: { width: 100, height: 100 },
  // Jog wheel under the trophy image, centered + enlarged (owner 2026-08-01).
  topicJog: { width: 96, height: 96, alignItems: 'center', justifyContent: 'center' },
  topicTrophyEmpty: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  // Keep title/meta clear of the trophy in the top-right.
  topicName: { fontFamily: fonts.oswaldMedium, fontSize: 18, letterSpacing: 0.4, color: colors.textPrimary, marginTop: 4 },
  topicMeta: {
    fontFamily: fonts.barlowCondensedMedium,
    fontSize: 12,
    letterSpacing: 0.7,
    color: colors.textSub,
    marginTop: 2,
  },
  pctBlock: { alignItems: 'flex-start', marginTop: 6, gap: 1 },
  pctBig: {
    fontFamily: fonts.oswaldBold,
    fontSize: 32,
    color: colors.amber,
    textShadowColor: 'rgba(255,180,0,.5)',
    textShadowRadius: 12,
    textShadowOffset: { width: 0, height: 0 },
  },
  pctLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 1.6, color: colors.textSubAlt },
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
  methodInner: { paddingVertical: 7, paddingHorizontal: 8, minHeight: 86, justifyContent: 'center' },
  // LA-2A texture layer (BlackFaceBg / BrushedMetalBg): absolutely fills the
  // panel behind its content. overflow:hidden + matching radius is a second clip
  // on top of the parent ElevatedFrame's own rounded-corner clip.
  textureFill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 2, overflow: 'hidden' },
  // Custom List panel — deck icon · count line · STUDY switch, aligned like a
  // method row so it seats flush in the rack.
  customRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 4 },
  customDeck: { width: 48, alignItems: 'center', justifyContent: 'center' },
  customCount: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 13,
    letterSpacing: 1,
    color: colors.blue,
  },
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
  methodLeft: { flex: 1, height: 54, justifyContent: 'space-between' },
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
    // Chakra Petch — squared retro-technical control-panel face (user request
    // 2026-07-18); tracked out for a labeled-gear look.
    fontFamily: fonts.panelSemiBold,
    fontSize: 18,
    lineHeight: 30,
    letterSpacing: 1.5,
  },
  // DEBOSSED (user request 2026-07-18): top-LEFT light source. The cut's
  // top-left edge falls in shadow (dark copy up-left); the bottom-right lip
  // catches light (bright copy down-right). The letter FLOOR sits darker than
  // the (lightened) panel so it reads as pressed IN, not raised.
  engDark: { color: 'rgba(0,0,0,0.95)', transform: [{ translateX: -0.9 }, { translateY: -1.3 }] },
  engLight: { color: 'rgba(255,255,255,0.6)', transform: [{ translateX: 1.0 }, { translateY: 1.5 }] },
  // Thin near-white inner trace (user request 2026-07-24; centered 2026-08-01) —
  // it MUST sit DEAD CENTER of the debossed letter, in the groove valley, with
  // NO offset: any nudge made it drift off the fill and read as a second shadow
  // crossing the outer edge. Zero-offset = aligned with the letter floor, so the
  // white line lives inside the incised channel and never crosses the deboss.
  // A hair SMALLER than the debossed letter (owner 2026-08-01) so the sides of
  // the incised groove show around the white trace — scaled from its centre so
  // it stays aligned in the channel.
  engTrace: { color: 'rgba(235,235,235,0.55)', transform: [{ scale: 0.96 }] },
  // Base floor style shared by all fills (color set per variant).
  // The letter FLOOR only — NO white text-shadow (owner 2026-08-01): the lit lip
  // is drawn once by engLight; a shadow here duplicated it and read as an extra
  // layer. Two effects now: the deboss (engDark + engLight + this floor) and the
  // fine engTrace line.
  engFillBase: {},
  // Active method floor on the DEFAULT gray panel — a couple shades under it.
  engFill: { color: '#2f3133' },
  // Inactive method — shallower, lower-contrast cut.
  engFillOff: { color: '#3f4143' },
  // Flashcards-only DARK-panel floors — sit under the charcoal coat so the cut
  // still reads pressed in (user request 2026-07-18).
  engFillDark: { color: '#0b0c0e' },
  engFillOffDark: { color: '#121315' },
  // Small SQUARE recessed LED box holding just the % (or quiz status).
  pctBox: {
    minWidth: 40,
    height: 32,
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
    fontSize: 12,
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
    width: 54,
    height: 54,
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
    width: 50,
    height: 50,
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
