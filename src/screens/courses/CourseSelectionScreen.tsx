/**
 * S3* — Course Selection (LOCKED, MASTER; visuals from
 * 12-s3-course-selection.dc.html) + Booth change order 2026-07-07:
 *  - Card 1 = GLOSSARY (quick term lookup is a primary app use) → S17.
 *  - Card 2 = SAFETY, the prerequisite course card (its topic + quiz unlock
 *    everything to the right).
 *  - Cards 3+ = the 8 courses by sequence.
 *  - Carousel position persists across app restarts (AsyncStorage): fresh
 *    install opens on the Glossary card; otherwise you land where you left.
 * Enrolled = bright amber card + [Continue] → Dashboard at last topic;
 * locked = greyed "NOT ENROLLED", untappable. Snap-to-center, side peek,
 * dot indicator. Tab bar visible (Home tab — now the app's opening tab).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewToken,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { BrandLogo } from '../../components/BrandLogo';
import { GlassButton } from '../../components/GlassButton';
import { StudioButton } from '../../components/StudioButton';
import { SwitchButton } from '../../components/SwitchButton';
import { supabase } from '../../lib/supabase';
import { SUPABASE_URL } from '../../lib/env';
import { colors, fonts } from '../../theme/tokens';
import { setLastCourse } from '../../features/dashboard/api';
import { useEntitlement } from '../../features/commercial/EntitlementProvider';
import { UpgradeSheet } from '../../features/commercial/UpgradeSheet';
import { ScreenIntroSequence } from '../../features/intro/ScreenIntroOverlay';
import { setLastPublicCourse } from '../../features/commercial/commercialDashboard';
import { getPublicCatalog, freeTopicsFrom, courseHasFreeTopic } from '../../data/publicCourses';
import { MATRIX_TOPIC_COUNT } from '../../data/courseTopicMatrix';
import { AWARD_ORDER } from '../awards/awardsData';

type Card =
  | { kind: 'tools'; id: 'tools' }
  | { kind: 'glossary'; id: 'glossary' }
  /** Free-topic taster card (Booth 2026-07-11) — gs0 / gs36, after Glossary. */
  | { kind: 'freeTopic'; id: string; gs: number; name: string; courseOrder: number }
  /** CM2/CM3: a public catalog course (commercialMode). */
  | { kind: 'public'; id: string; order: number; name: string; topicCount: number; hasFreeTopic: boolean }
  /** Placeholder standalone topic — catalog stub, content pending (Booth 2026-07-11). */
  | { kind: 'comingTopic'; id: string; name: string }
  /** Far-right tally card — how many more curriculum topics exist beyond what
   *  the deck shows (user request 2026-07-18). Tapping opens the Curriculum. */
  | { kind: 'more'; id: 'more'; count: number }
  | {
      kind: 'course';
      id: string;
      code: string;
      name: string;
      achievement_count: number;
      enrolled: boolean;
      currentTopic: number;
      isPrereq: boolean;
      completed: boolean;
    };

const { width: SCREEN_W } = Dimensions.get('window');
// Cards shrunk 7% (Booth 2026-07-15) to give the carousel vertical room — the
// Awards row had squeezed the eyebrow captions + card bottoms off-screen.
const CARD_W = Math.round(SCREEN_W * 0.7 * 0.93);
const CARD_H = 409; // was 440 (−7%)
const CARD_GAP = 14;
const SIDE_PAD = Math.round((SCREEN_W - CARD_W) / 2);
/** Lit switch width on the cards — narrower than the card (Booth 2026-07-09q). */
const CARD_BTN_W = Math.round(CARD_W * 0.62);
const POSITION_KEY = 'ape:courseCarouselIdx';
/** Carousel index of the Glossary card ([Tools][Glossary]...) — HOME always
 *  lands here (Booth 2026-07-11). */
const GLOSSARY_IDX = 1;

/** Standalone topic cards awaiting content (Booth 2026-07-11) — rendered as
 *  locked "COMING SOON" topic cards on the right of the catalog. */
const COMING_TOPICS = [
  'Assisted Listening Systems',
  'Commercial 70/100V Systems',
  'Corporate AV',
  'DJ',
  'Architectural Audio',
  'Vehicle Audio',
  'HiFi Consumer Audio',
  'Audio Technician',
  'Theatrical Sound',
  'Audio Electronics',
  'Road Crew',
  // Complete the 25-card standardized carousel (backend card map 2026-07-16).
  'Live Sound',
  'Worship Sound',
] as const;

/** Course-card art in the public `course-cards` bucket — STANDARDIZED WebP set
 *  (backend handoff 2026-07-16): filename = card_id with ':' -> '_' + '.webp',
 *  941x1672 portrait. Full map: ape_course_card_map_FINAL_STANDARDIZED_2026_07_16.json.
 *  Keys below are the CLIENT's card keys (course codes, pub<order>, free<gs>,
 *  coming-topic names); values are the standardized filenames. Missing → plain
 *  fallback card. */
const CARD_IMAGE: Record<string, string> = {
  tools: 'free_tools.webp',
  glossary: 'free_glossary.webp',
  // Institutional courses → their commercial-card equivalents.
  SAFE: 'free_safety.webp',
  MUSI190: 'course_intro-to-audio.webp',
  AUDI201: 'course_sound-reinforcement-systems.webp',
  AUDI204: 'course_audio-system-design-and-maintenance.webp',
  MUSI108: 'course_career-and-business.webp',
  MUSI201: 'course_recording-arts.webp',
  MUSI202: 'course_music-production.webp',
  MUSI205A: 'topic_podcast.webp',
  MUSI205B: 'topic_film.webp',
  // CM2 — public catalog, keyed pub<order> (seed order 1-9).
  pub1: 'free_safety.webp',
  pub2: 'course_intro-to-audio.webp',
  pub3: 'course_sound-reinforcement-systems.webp',
  pub4: 'course_audio-system-design-and-maintenance.webp',
  pub5: 'course_recording-arts.webp',
  pub6: 'course_music-production.webp',
  pub7: 'topic_podcast.webp',
  pub8: 'topic_film.webp',
  pub9: 'course_career-and-business.webp',
  // Free-topic taster cards (gs0 Safety · gs36 DAW Skills).
  free0: 'free_safety.webp',
  free36: 'free_daw.webp',
  // Coming-soon topic stubs, keyed by DISPLAY NAME (unique).
  'Assisted Listening Systems': 'topic_assist.webp',
  'Commercial 70/100V Systems': 'topic_commercial.webp',
  'Corporate AV': 'topic_corporate.webp',
  DJ: 'topic_dj.webp',
  'Architectural Audio': 'topic_architectural.webp',
  'Vehicle Audio': 'topic_vehicle.webp',
  'HiFi Consumer Audio': 'topic_hifi.webp',
  'Audio Technician': 'topic_audio-tech.webp',
  'Theatrical Sound': 'topic_theatrical.webp',
  'Audio Electronics': 'topic_audio-elect.webp',
  'Road Crew': 'topic_road-crew.webp',
  'Live Sound': 'topic_live-sound.webp',
  'Worship Sound': 'topic_worship.webp',
};
/** Scroll-dot color by card TYPE (Booth 2026-07-15): free = green, course =
 *  purple, topic = amber — so the dot row reads as a color-coded map of the
 *  carousel. */
/** Cards a student can mark into their personal deck (user request 2026-07-18). */
const MARKABLE_KINDS: Card['kind'][] = ['course', 'public', 'freeTopic'];
const isMarkable = (c: Card): boolean => MARKABLE_KINDS.includes(c.kind);
/** Topics a card represents (for the "+ XX other" tally). */
const cardTopicCount = (c: Card): number =>
  c.kind === 'course' ? c.achievement_count || 0 : c.kind === 'public' ? c.topicCount : 1;

function dotColorFor(card: Card): string {
  switch (card.kind) {
    case 'tools':
    case 'glossary':
    case 'freeTopic':
      return colors.green; // free / included
    case 'comingTopic':
      return colors.amber; // standalone topic
    case 'public':
      return card.topicCount > 1 ? colors.purple : colors.amber; // course vs single topic
    case 'course':
      return colors.purple; // full course
    case 'more':
      return colors.textSubAlt; // the tally card
    default:
      return colors.textMuted;
  }
}

function cardImageUrl(key: string): string | null {
  const f = CARD_IMAGE[key];
  return f ? `${SUPABASE_URL}/storage/v1/object/public/course-cards/${encodeURIComponent(f)}` : null;
}

// Warm the image cache once, up front, so cards paint fast on the carousel
// instead of streaming in as you swipe (Booth 2026-07-11). Distinct filenames
// only (many keys reuse the same art).
let cardArtWarmed = false;
function warmCardArt() {
  if (cardArtWarmed) return;
  cardArtWarmed = true;
  const urls = new Set<string>();
  for (const k of Object.keys(CARD_IMAGE)) {
    const u = cardImageUrl(k);
    if (u) urls.add(u);
  }
  urls.forEach((u) => {
    Image.prefetch(u).catch(() => {});
  });
}

/** One carousel card — full-bleed art (when available) + gradient + overlay. */
function CourseCardView({
  item,
  onOpenCourse,
  onOpenGlossary,
  onOpenTools,
  onOpenPublic,
  onLockedPress,
  onOpenMore,
  academy,
  marked,
  onToggleMark,
}: {
  item: Card;
  onOpenCourse: (c: Extract<Card, { kind: 'course' }>) => void;
  onOpenGlossary: () => void;
  onOpenTools: () => void;
  /** CM6: open a public course → its commercial dashboard. */
  onOpenPublic: (order: number) => void;
  /** CM2/CM3: academy-locked tap → the upgrade surface. */
  onLockedPress: () => void;
  /** The "+ XX other" tally card → open the full Curriculum. */
  onOpenMore: () => void;
  /** Academy mode: show the "my courses" mark control (user request 2026-07-18). */
  academy: boolean;
  marked: boolean;
  onToggleMark: () => void;
}) {
  // CM3: the card RENDERS entitlement capabilities (server-owned once live) —
  // it never decides them. Flag OFF ⇒ everything unlocked-looking as today.
  const { commercialMode, caps } = useEntitlement();

  // "+ XX other" tally card — its own compact look, far right of the deck.
  // (After the hook above so hook order stays stable.)
  if (item.kind === 'more') {
    return (
      <View style={styles.cardOuter}>
        <View style={styles.cardAbove}>
          <Text style={[styles.cardAboveText, { color: colors.textSubAlt }]}>FULL CURRICULUM</Text>
          <View style={[styles.cardAboveRule, { backgroundColor: colors.textSubAlt }]} />
        </View>
        <Pressable
          style={[styles.card, styles.moreCard]}
          onPress={onOpenMore}
          accessibilityRole="button"
          accessibilityLabel={`Plus ${item.count} other topics — open curriculum`}
        >
          <Text style={styles.moreCount}>+{item.count}</Text>
          <Text style={styles.moreLabel}>OTHER TOPICS</Text>
          <Text style={styles.moreSub}>in the full curriculum</Text>
          <View style={{ height: 14 }} />
          <Text style={styles.moreCta}>VIEW CURRICULUM ›</Text>
        </Pressable>
      </View>
    );
  }
  const isTools = item.kind === 'tools';
  const isGlossary = item.kind === 'glossary';
  const free = item.kind === 'freeTopic' ? item : null;
  const pub = item.kind === 'public' ? item : null;
  const coming = item.kind === 'comingTopic' ? item : null;
  const course = item.kind === 'course' ? item : null;
  const key = isTools
    ? 'tools'
    : isGlossary
      ? 'glossary'
      : free
        ? `free${free.gs}`
        : pub
          ? `pub${pub.order}`
          : coming
            ? coming.name
            : course!.code;
  const url = cardImageUrl(key);
  // Free-tier nuance (§3): a course containing a free topic (gs0/gs36) is
  // OPENABLE for free/lapsed users — the server clamps the rest inside (CM6).
  const pubOpenable = !!pub && (caps.allTopics || (caps.freeTopics && pub.hasFreeTopic));
  // Free-topic tasters are ALWAYS unlocked + full-color (Booth 2026-07-11).
  // Coming-soon topic stubs are locked (content pending).
  const locked = (!!course && !course.enrolled) || (!!pub && !pubOpenable) || !!coming;
  const completed = !!course && course.enrolled && course.completed;

  // A locked TOPIC is GOLD; a locked COURSE stays PURPLE (Booth 2026-07-11).
  // Topic = a single-topic public card, or a coming-soon stub.
  const isTopicCard = !!coming || (!!pub && pub.topicCount === 1);
  const lockedAccent = isTopicCard ? 'rgba(255,180,0,.6)' : 'rgba(150,90,220,.6)';
  const lockedEyebrow = isTopicCard ? '#ffc64d' : '#c4a2ff';

  const accent = isGlossary
    ? 'rgba(91,176,255,.65)'
    : // Measurement tools now share the free topics' GREEN (Booth 2026-07-11 #5).
      free || isTools
      ? 'rgba(55,224,95,.6)'
      : locked
        ? lockedAccent
        : 'rgba(255,180,0,.6)';
  const eyebrowColor = isGlossary
    ? '#7fd4ff'
    : free || isTools
      ? '#5bff85'
      : locked
        ? lockedEyebrow
        : '#ffc64d';
  // Cards the student can mark into their own deck (academy mode).
  const markable = !!course || !!pub || !!free;
  const eyebrow = isTools
    ? 'FREE INCLUDED'
    : isGlossary
      ? 'FREE INCLUDED'
      : free
        ? // In academy mode the "FREE TOPIC" label is dropped — everything is
          // included; that space becomes the "my courses" mark (user request
          // 2026-07-18).
          academy
          ? ''
          : 'FREE TOPIC'
        : pub
          ? // Category labels — SINGULAR per card (user request 2026-07-18):
            // multi-topic = 'Professional Certificate Program'; single-topic =
            // 'Academy Specialization Certificate'.
            pub.topicCount > 1
            ? 'Professional Certificate Program'
            : 'Academy Specialization Certificate'
          : coming
            ? 'Academy Specialization Certificate'
            : course!.isPrereq
              ? 'SAFETY'
              : course!.code;
  const title = isTools
    ? 'Measurement and Analysis Tools'
    : isGlossary
      ? 'Professional Audio Glossary'
      : free
        ? free.name
        : pub
          ? pub.name
          : coming
            ? coming.name
            : course!.name;
  const inner = (
    <>
      {/* Legibility gradient — light top, dark bottom (for the status/button). */}
      <LinearGradient
        colors={['rgba(8,8,10,0.55)', 'rgba(8,8,10,0)', 'rgba(8,8,10,0.45)', 'rgba(8,8,10,0.95)']}
        locations={[0, 0.3, 0.58, 1]}
        style={StyleSheet.absoluteFill}
      />
      {/* Locked: a faint neutral-gray wash (10%) over the art to read as
          grayed-out — no color cast, purple stays on the frame only. Sits above
          the image + its 15% dim, below the text/button (Booth 2026-07-09c). */}
      {locked && <View style={styles.lockTint} />}
      {/* Academy "my courses" mark (user request 2026-07-18) — tap to add/remove
          this card from the personal deck; the deck opens on the first marked. */}
      {academy && markable ? (
        <Pressable
          style={[styles.markBtn, marked && styles.markBtnOn]}
          onPress={onToggleMark}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityState={{ selected: marked }}
          accessibilityLabel={marked ? 'Remove from my courses' : 'Add to my courses'}
        >
          <Text style={[styles.markStar, marked && styles.markStarOn]}>{marked ? '★' : '☆'}</Text>
          <Text style={[styles.markLabel, marked && styles.markLabelOn]}>
            {marked ? 'MY COURSE' : 'ADD'}
          </Text>
        </Pressable>
      ) : null}
      <View>
        <Text style={styles.cardTitle}>{title}</Text>
        {/* Tools tutorial line lives INSIDE the card, below the title (Booth
            2026-07-15) — blue, over the art. */}
        {isTools ? (
          <Text style={styles.cardToolsSub}>Learn how to use them with tutorials in Academy Mode</Text>
        ) : null}
        {/* COURSE cards show their topic count below the title, in blue
            (Booth 2026-07-15). */}
        {(() => {
          const n = course ? course.achievement_count : pub && pub.topicCount > 1 ? pub.topicCount : null;
          return n ? <Text style={styles.cardTopicCount}>{n} TOPICS</Text> : null;
        })()}
      </View>
      <View>
        {/* Status subtitle removed (Booth 2026-07-09r). Card actions use the
            scribble-strip GLASS KEY aesthetic (Booth 2026-07-09u — same as the
            Fill-in-Blank Prev/Next caps), each in its ORIGINAL state color:
            amber continue · green review · blue glossary. */}
        <View style={{ alignItems: 'center' }}>
          {free ? (
            // Always unlocked, full color, INCLUDED FREE (Booth 2026-07-11).
            <View style={{ width: CARD_BTN_W }}>
              <GlassButton label="INCLUDED FREE" tint="green" height={50} onPress={() => onOpenPublic(free.courseOrder)} />
            </View>
          ) : isTools ? (
            // Audio Tools is ALWAYS FREE to open (Booth 2026-07-11 #4); the
            // per-tutorial locks live INSIDE the hub, not on this card.
            <View style={{ width: CARD_BTN_W }}>
              <GlassButton label="OPEN TOOLS" tint="green" height={50} onPress={onOpenTools} />
            </View>
          ) : isGlossary ? (
            <View style={{ width: CARD_BTN_W }}>
              <GlassButton label="OPEN GLOSSARY" tint="blue" height={50} onPress={onOpenGlossary} />
            </View>
          ) : coming ? (
            // Placeholder topic — same academy-locked key as the other locked
            // topics (Booth 2026-07-11); content pending.
            <View style={{ width: CARD_BTN_W }}>
              <GlassButton label="🔒 ACADEMY MODE" tint="steel" height={50} fontSize={13} onPress={onLockedPress} />
            </View>
          ) : pub ? (
            <View style={{ width: CARD_BTN_W }}>
              {pubOpenable ? (
                <GlassButton label="OPEN" tint="gold" height={50} onPress={() => onOpenPublic(pub.order)} />
              ) : (
                <GlassButton label="🔒 ACADEMY MODE" tint="steel" height={50} fontSize={13} onPress={onLockedPress} />
              )}
            </View>
          ) : locked ? (
            // Sized to match the glass keys (Booth 2026-07-09r).
            <SwitchButton label="🔒 Locked" variant="locked" width={CARD_BTN_W} height={50} disabled />
          ) : (
            <View style={{ width: CARD_BTN_W }}>
              <GlassButton
                label={completed ? 'REVIEW' : 'CONTINUE'}
                tint={completed ? 'green' : 'gold'}
                height={50}
                onPress={() => onOpenCourse(course!)}
              />
            </View>
          )}
        </View>
      </View>
    </>
  );

  const cardBody = url ? (
    <ImageBackground
      source={{ uri: url }}
      style={[styles.card, { borderColor: accent }]}
      // Locked: no color wash — show the art but clearly grayed-out: image dimmed
      // 30% + a neutral gray overlay (below). Purple stays on the frame only
      // (Booth 2026-07-09c → deepened 07-09d, cards read too "active").
      imageStyle={[styles.cardImg, locked && { opacity: 0.7 }]}
    >
      {inner}
    </ImageBackground>
  ) : (
    <View style={[styles.card, styles.cardNoImg, { borderColor: accent }, locked && { opacity: 0.55 }]}>
      {inner}
    </View>
  );

  // COURSE / TOPIC (and FREE…) label sits ABOVE the card as a small caption with
  // a thin rule, keeping the per-type font colour (Booth 2026-07-11).
  return (
    <View style={styles.cardOuter}>
      {eyebrow ? (
        <View style={styles.cardAbove}>
          <Text style={[styles.cardAboveText, { color: eyebrowColor }]}>{eyebrow}</Text>
          <View style={[styles.cardAboveRule, { backgroundColor: eyebrowColor }]} />
        </View>
      ) : null}
      {cardBody}
    </View>
  );
}

export function CourseSelectionScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [cards, setCards] = useState<Card[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const listRef = useRef<FlatList<Card>>(null);
  // CM2 — commercial mode + entitlement (mock provider; server truth later).
  const { commercialMode, entitlement, caps, setCommercialMode, setEntitlement } = useEntitlement();
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  // Academy "my courses" marks (user request 2026-07-18). In academy mode the
  // student marks the cards/topics they want; those become their deck (the rest
  // collapse behind the "+ XX other" card), and the carousel opens on the first
  // marked card. `caps.allTopics` is the academy signal.
  const academy = caps.allTopics;
  const [marks, setMarks] = useState<Set<string>>(new Set());
  useEffect(() => {
    AsyncStorage.getItem('ape:myCourseMarks').then((v) => {
      if (v) setMarks(new Set(JSON.parse(v) as string[]));
    });
  }, []);
  const toggleMark = useCallback((id: string) => {
    setMarks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      void AsyncStorage.setItem('ape:myCourseMarks', JSON.stringify([...next]));
      return next;
    });
  }, []);

  const load = useCallback(async () => {
    setError(null);
    warmCardArt(); // prefetch card art up front
    // CM2 (commercialMode): the carousel seeds from the public catalog —
    // [Audio Tools] [Glossary] [9 courses by order]. No enrollment queries
    // (progress/dashboard wiring lands in CM6).
    if (commercialMode) {
      // v2.13: catalog from public_courses/public_course_topics (seed fallback).
      const catalog = await getPublicCatalog();
      // Skip Pro Audio Safety (order 1) — the green free card already covers it.
      const pubCards = catalog.filter((pc) => pc.order !== 1).map((pc) => ({
        kind: 'public' as const,
        id: `pub-${pc.order}`,
        order: pc.order,
        name: pc.name,
        topicCount: pc.topics.length,
        hasFreeTopic: courseHasFreeTopic(pc),
      }));
      // Multi-topic COURSES on the left (catalog order); ALL single-topic
      // TOPIC cards — live pubs + coming-soon stubs — form one A–Z group on
      // the right (Booth 2026-07-16: alphabetized; Worship Sound lands last).
      const multiPub = pubCards.filter((c) => c.topicCount > 1).sort((a, b) => a.order - b.order);
      const singlePub = pubCards.filter((c) => c.topicCount <= 1);
      const comingCards = COMING_TOPICS.map((name, i) => ({
        kind: 'comingTopic' as const,
        id: `coming-${i}`,
        name,
      }));
      const topicCards = [...singlePub, ...comingCards].sort((a, b) => a.name.localeCompare(b.name));
      // "+ XX other" tally (user request 2026-07-18): curriculum topics beyond
      // what the deck's launched courses surface. Universe = the locked Course/
      // Topic Matrix (203 topics); shown = unique gs across the public catalog.
      const shownGs = new Set(catalog.flatMap((c) => c.topics.map((t) => t.gs)));
      const otherCount = Math.max(0, MATRIX_TOPIC_COUNT - shownGs.size);
      setCards([
        { kind: 'tools', id: 'tools' },
        { kind: 'glossary', id: 'glossary' },
        // 2 free-topic taster cards, right after Glossary (Booth 2026-07-11).
        // gs0 displays as the shortened "Pro Audio Safety".
        ...freeTopicsFrom(catalog).map((ft) => ({
          kind: 'freeTopic' as const,
          id: `free-${ft.gs}`,
          gs: ft.gs,
          name: ft.gs === 0 ? 'Pro Audio Safety' : ft.name,
          courseOrder: ft.courseOrder,
        })),
        ...multiPub,
        // A–Z topic group (live single-topic pubs + coming-soon stubs).
        ...topicCards,
        // Far-right tally card (only when there's more to tease).
        ...(otherCount > 0 ? [{ kind: 'more' as const, id: 'more' as const, count: otherCount }] : []),
      ]);
      return;
    }
    try {
      const { data: user, error: uErr } = await supabase.from('users').select('id').single();
      if (uErr || !user) throw new Error('user_not_found');

      const [{ data: courses, error: cErr }, { data: enrollments, error: eErr }, { data: prog, error: pErr }] =
        await Promise.all([
          supabase
            .from('courses')
            .select('id, code, name, sequence, achievement_count')
            .order('sequence'), // includes SAFE (sequence 0) — the pre-req card
          supabase.from('enrollment').select('course_id').eq('user_id', user.id),
          supabase
            .from('student_achievement_progress')
            .select('status, achievements!inner(course_id, sequence_in_course)')
            .eq('user_id', user.id),
        ]);
      if (cErr) throw cErr;
      if (eErr) throw eErr;
      if (pErr) throw pErr;

      const enrolledIds = new Set((enrollments ?? []).map((e: any) => e.course_id));
      const frontier = new Map<string, number>();
      const completeByCourse = new Map<string, number>();
      for (const row of (prog ?? []) as any[]) {
        const cid = row.achievements.course_id;
        if (row.status !== 'locked') {
          frontier.set(cid, Math.max(frontier.get(cid) ?? 1, row.achievements.sequence_in_course));
        }
        if (row.status === 'complete') {
          completeByCourse.set(cid, (completeByCourse.get(cid) ?? 0) + 1);
        }
      }

      const courseCards: Card[] = (courses ?? []).map((c: any) => ({
        kind: 'course',
        id: c.id,
        code: c.code,
        name: c.name,
        achievement_count: c.achievement_count,
        enrolled: enrolledIds.has(c.id),
        currentTopic: frontier.get(c.id) ?? 1,
        isPrereq: c.sequence === 0,
        completed: c.achievement_count > 0 && (completeByCourse.get(c.id) ?? 0) >= c.achievement_count,
      }));

      // "+ XX other" tally (user request 2026-07-18): matrix topics beyond the
      // topics these courses surface (achievement counts), guarded > 0.
      const shownCount = courseCards.reduce(
        (n, c) => n + (c.kind === 'course' ? c.achievement_count || 0 : 0),
        0,
      );
      const otherCount = Math.max(0, MATRIX_TOPIC_COUNT - shownCount);
      // Tools card sits LEFT of the Glossary card (Booth 2026-07-09v); the
      // Glossary remains the standard landing card (index 1 default below).
      setCards([
        { kind: 'tools', id: 'tools' },
        { kind: 'glossary', id: 'glossary' },
        ...courseCards,
        ...(otherCount > 0 ? [{ kind: 'more' as const, id: 'more' as const, count: otherCount }] : []),
      ]);
    } catch (e: any) {
      setError(
        e?.message === 'user_not_found'
          ? 'This account is not linked to a student record. Complete registration first.'
          : 'Could not load courses. Check your connection.',
      );
    }
  }, [commercialMode]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  // The DISPLAYED deck. In academy mode, once the student has marked cards,
  // their marked cards become the deck (tools + glossary stay; everything else
  // collapses behind a recomputed "+ XX other" card). Otherwise the full deck
  // from load() is shown as-is (user request 2026-07-18).
  const displayDeck = useMemo<Card[] | null>(() => {
    if (!cards || !academy) return cards;
    const marked = cards.filter((c) => isMarkable(c) && marks.has(c.id));
    if (marked.length === 0) return cards;
    const fixed = cards.filter((c) => c.kind === 'tools' || c.kind === 'glossary');
    const shown = marked.reduce((n, c) => n + cardTopicCount(c), 0);
    const other = Math.max(0, MATRIX_TOPIC_COUNT - shown);
    return [
      ...fixed,
      ...marked,
      ...(other > 0 ? [{ kind: 'more' as const, id: 'more' as const, count: other }] : []),
    ];
  }, [cards, academy, marks]);

  // Entering HOME fronts the GLOSSARY card by default (Booth 2026-07-11) —
  // BUT when the academy student has marked courses, open on their FIRST marked
  // card instead ("open carousel there", user request 2026-07-18). Keyed on
  // `cards` so it fires on focus/reload, not on every mark toggle.
  useEffect(() => {
    if (!displayDeck || displayDeck.length <= GLOSSARY_IDX) return;
    let target = GLOSSARY_IDX;
    if (academy && marks.size) {
      const i = displayDeck.findIndex((c) => isMarkable(c) && marks.has(c.id));
      if (i >= 0) target = i;
    }
    target = Math.min(target, displayDeck.length - 1);
    setActiveIdx(target);
    const t = setTimeout(() => listRef.current?.scrollToIndex({ index: target, animated: false }), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards]);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const idx = viewableItems[0]?.index;
    if (idx != null) {
      setActiveIdx(idx);
      void AsyncStorage.setItem(POSITION_KEY, String(idx));
    }
  }).current;

  const openCourse = useCallback(
    async (course: Extract<Card, { kind: 'course' }>) => {
      await setLastCourse(course.id);
      (navigation as any).navigate('Study', { screen: 'Dashboard' });
    },
    [navigation],
  );

  const openGlossary = useCallback(() => {
    // STUDY-tab regression #5, root fix v2 (Booth 2026-07-18): `initial: false`
    // makes the stack mount its own initialRouteName (Dashboard) as routes[0]
    // BENEATH Glossary, atomically. The previous two-step navigate could batch
    // into a single mount in React Navigation v7, leaving Glossary as
    // routes[0] — which is exactly how STUDY kept landing on the Glossary
    // (popToTopOnBlur "popped" to a Glossary root).
    (navigation as any).navigate('Study', { screen: 'Glossary', params: {}, initial: false });
  }, [navigation]);

  const openTools = useCallback(() => {
    (navigation as any).navigate('ToolsHub');
  }, [navigation]);

  const openMore = useCallback(() => {
    (navigation as any).navigate('Curriculum');
  }, [navigation]);

  // CM6: open a public course → the commercial dashboard (Study tab), which
  // reads the persisted order and renders the seq-ordered topics.
  const openPublicCourse = useCallback(
    async (order: number) => {
      await setLastPublicCourse(order);
      (navigation as any).navigate('Study', { screen: 'Dashboard' });
    },
    [navigation],
  );

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <View style={{ width: 180 }}>
          <StudioButton label="Retry" variant="secondary" small onPress={load} />
        </View>
      </View>
    );
  }
  if (!cards) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.amber} />
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + 16 }]}>
      {/* Home-screen hero: large, centered logo + wordmark, dropped a little
          lower so this reads as the app's front door, not a small header
          (Booth 2026-07-09d). */}
      <View style={styles.hero}>
        {/* DEV-ONLY hidden toggles (no-ops in release — provider setters are
            __DEV__-guarded): long-press LOGO = commercialMode; long-press
            WORDMARK = cycle mock entitlement. */}
        <Pressable
          onLongPress={() => {
            if (!__DEV__) return;
            const next = !commercialMode;
            setCommercialMode(next);
            // Turning commercial ON from anonymous → land in FREE so the free
            // topics (gs0/gs36) are immediately accessible for testing.
            if (next && entitlement === 'anonymous') setEntitlement('free');
            Alert.alert('DEV', `commercialMode → ${next ? 'ON (free)' : 'OFF'}`);
          }}
          delayLongPress={600}
        >
          <BrandLogo size={54} />
        </Pressable>
        <Pressable
          onLongPress={() => {
            if (!__DEV__) return;
            const order = ['anonymous', 'free', 'academy', 'lapsed'] as const;
            const next = order[(order.indexOf(entitlement) + 1) % order.length];
            setEntitlement(next);
            Alert.alert('DEV', `entitlement → ${next}`);
          }}
          delayLongPress={600}
        >
          <Text style={styles.heroWordmark}>
            Pro Audio <Text style={styles.heroAccent}>Training Academy</Text>
          </Text>
        </Pressable>
        <Text style={styles.heroEyebrow}>PROFESSIONAL AUDIO GLOSSARY</Text>
      </View>

      {/* Two links above the course carousel (user request 2026-07-17): the
          per-category award buttons are replaced by CURRICULUM (academic goals
          + programs) and AWARDS (the awards pages, swipeable between all
          categories). */}
      <View style={styles.awards}>
        <View style={styles.awardsRow}>
          <Pressable
            style={styles.awardBtn}
            onPress={() => (navigation as any).navigate('Curriculum')}
            accessibilityRole="button"
            accessibilityLabel="Curriculum and academic goals"
          >
            <Text style={styles.awardBtnText}>CURRICULUM</Text>
          </Pressable>
          <Pressable
            style={styles.awardBtn}
            onPress={() => (navigation as any).navigate('Awards', { category: AWARD_ORDER[0] })}
            accessibilityRole="button"
            accessibilityLabel="Awards"
          >
            <Text style={styles.awardBtnText}>AWARDS</Text>
          </Pressable>
        </View>
      </View>

      <Text style={styles.title}>SELECT A COURSE</Text>

      <FlatList
        ref={listRef}
        data={displayDeck}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(c) => c.id}
        extraData={marks}
        snapToInterval={CARD_W + CARD_GAP}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: SIDE_PAD, gap: CARD_GAP, alignItems: 'center' }}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        getItemLayout={(_d, i) => ({ length: CARD_W + CARD_GAP, offset: (CARD_W + CARD_GAP) * i, index: i })}
        renderItem={({ item }) => (
          <CourseCardView
            item={item}
            onOpenCourse={openCourse}
            onOpenGlossary={openGlossary}
            onOpenTools={openTools}
            onOpenPublic={openPublicCourse}
            onLockedPress={() => setUpgradeOpen(true)}
            onOpenMore={openMore}
            academy={academy}
            marked={marks.has(item.id)}
            onToggleMark={() => toggleMark(item.id)}
          />
        )}
      />

      {/* Push the scroll dots down to sit just above the bottom nav bar. */}
      <View style={{ flex: 1 }} />

      <View style={styles.dots}>
        {(displayDeck ?? []).map((c, i) => {
          const color = dotColorFor(c);
          const active = i === activeIdx;
          return (
            <View
              key={c.id}
              style={[
                styles.dot,
                { backgroundColor: color, opacity: active ? 1 : 0.4 },
                active && {
                  width: 18,
                  shadowColor: color,
                  shadowOpacity: 1,
                  shadowRadius: 6,
                  shadowOffset: { width: 0, height: 0 },
                },
              ]}
            />
          );
        })}
      </View>

      {/* CM2: academy-locked tap → upgrade surface (verbatim §2 copy). Auth
          affordances omitted here — this surface shows post-sign-in too; the
          paywall route lands in CM7. */}
      <UpgradeSheet
        visible={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        onSeePlans={() => {
          setUpgradeOpen(false);
          (navigation as any).navigate('Paywall');
        }}
      />

      {/* Intro placeholders (Booth 2026-07-18): app welcome after load-in, then
          the first-user welcome tutorial. Always shown in dev bypass. */}
      <ScreenIntroSequence first="appWelcome" second="firstUserWelcome" />
    </View>
  );
}

const styles = StyleSheet.create({
  // Tighter vertical rhythm (Booth 2026-07-15) so the shrunk cards + their
  // eyebrow captions all fit without clipping.
  root: { flex: 1, backgroundColor: colors.screenBg, gap: 14, paddingBottom: 16 },
  center: {
    flex: 1,
    backgroundColor: colors.screenBg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
  },
  errorText: { fontFamily: fonts.barlowRegular, fontSize: 14, color: colors.textSub, textAlign: 'center' },
  hero: { alignItems: 'center', gap: 8, marginTop: 6, paddingHorizontal: 24 },
  // Curriculum + Awards links row above the carousel (user request 2026-07-17).
  awards: { marginTop: 8, paddingHorizontal: 20, gap: 6, alignItems: 'center' },
  awardsRow: { flexDirection: 'row', gap: 8, alignSelf: 'stretch' },
  awardBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#2c2c2c',
  },
  awardBtnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 0.5, color: colors.textSecondary },
  heroWordmark: {
    fontFamily: fonts.oswaldBold,
    fontSize: 24,
    letterSpacing: 0.5,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  heroAccent: {
    fontFamily: fonts.oswaldMedium,
    color: colors.amber,
    textShadowColor: 'rgba(255,180,0,.4)',
    textShadowRadius: 8,
    textShadowOffset: { width: 0, height: 0 },
  },
  heroEyebrow: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 12,
    letterSpacing: 2.6,
    // Glossary blue — matches the glossary card's border frame (Booth 2026-07-09d).
    color: '#5bb0ff',
    textAlign: 'center',
    marginTop: -4,
  },
  // Sized to match the AWARDS label and dropped lower / closer to the cards
  // below it (Booth 2026-07-15).
  title: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 11,
    letterSpacing: 2.4,
    color: colors.textSub,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: -6,
  },
  // Full-bleed image card (Booth 2026-07-09 redesign).
  cardOuter: { width: CARD_W },
  // Small type caption + thin rule ABOVE each card (Booth 2026-07-11).
  cardAbove: { marginBottom: 9, paddingHorizontal: 3 },
  cardAboveText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 2.2, marginBottom: 5 },
  cardAboveRule: { height: 1, borderRadius: 1, opacity: 0.55 },
  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 20,
    justifyContent: 'space-between',
  },
  cardImg: { borderRadius: 16 },
  cardNoImg: { backgroundColor: '#141414' }, // fallback when a course has no art
  // "+ XX other" tally card (user request 2026-07-18).
  moreCard: {
    backgroundColor: '#141416',
    borderColor: '#33343a',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  moreCount: { fontFamily: fonts.oswaldBold, fontSize: 56, color: colors.textPrimary, letterSpacing: 0.5 },
  moreLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, letterSpacing: 2, color: colors.textSecondary },
  moreSub: { fontFamily: fonts.barlowRegular, fontSize: 13, color: colors.textSub },
  moreCta: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: '#5bb0ff' },
  // Academy "my courses" mark control (user request 2026-07-18).
  markBtn: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,.28)',
    backgroundColor: 'rgba(8,8,10,.7)',
  },
  markBtnOn: { borderColor: 'rgba(255,180,0,.75)', backgroundColor: 'rgba(40,28,4,.82)' },
  markStar: { fontSize: 15, color: '#d0d0d0' },
  markStarOn: {
    color: colors.amber,
    textShadowColor: 'rgba(255,180,0,.5)',
    textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 0 },
  },
  markLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 1, color: '#d0d0d0' },
  markLabelOn: { color: colors.amber },
  lockTint: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(120,120,120,0.24)',
  },
  cardEyebrow: {
    fontFamily: fonts.mono,
    fontSize: 13,
    letterSpacing: 1.3,
    textShadowColor: 'rgba(0,0,0,.8)',
    textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 1 },
  },
  cardTitle: {
    fontFamily: fonts.oswaldMedium,
    fontSize: 26,
    lineHeight: 30,
    letterSpacing: 0.4,
    color: '#ffffff',
    marginTop: 8,
    textShadowColor: 'rgba(0,0,0,.85)',
    textShadowRadius: 8,
    textShadowOffset: { width: 0, height: 1 },
  },
  // Tools-card subtitle under the title (Booth 2026-07-11).
  cardSubtitle: {
    fontFamily: fonts.barlowRegular,
    fontSize: 13.5,
    lineHeight: 18,
    color: '#e6e6e6',
    marginTop: 5,
    textShadowColor: 'rgba(0,0,0,.85)',
    textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 1 },
  },
  // Topic count under a COURSE card's title — glossary blue over the art.
  cardTopicCount: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 13,
    letterSpacing: 1.6,
    color: '#5bb0ff',
    marginTop: 6,
    textShadowColor: 'rgba(0,0,0,.85)',
    textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 1 },
  },
  // Tools tutorial line, inside the card below the title — deeper glossary blue
  // with a shadow so it stays legible over the card art (Booth 2026-07-15).
  cardToolsSub: {
    fontFamily: fonts.barlowRegular,
    fontSize: 13.5,
    lineHeight: 18,
    color: '#5bb0ff',
    marginTop: 6,
    textShadowColor: 'rgba(0,0,0,.85)',
    textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 1 },
  },
  dots: { flexDirection: 'row', gap: 6, justifyContent: 'center', flexWrap: 'wrap' },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#2e2e2e' },
});
