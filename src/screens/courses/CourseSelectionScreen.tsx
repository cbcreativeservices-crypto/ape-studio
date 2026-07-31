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
import { ScreenIntroOverlay } from '../../features/intro/ScreenIntroOverlay';
import { setLastPublicCourse } from '../../features/commercial/commercialDashboard';
import { getPublicCatalog, freeTopicsFrom, courseHasFreeTopic } from '../../data/publicCourses';
import { MATRIX_SUBJECTS } from '../../data/courseTopicMatrix';
import { PROGRAM_PATHS, SPECIALIZED_CERTIFICATES } from '../awards/awardsData';
import { useDefaultHomeGs, useHomeBundles, useHomeGs } from '../../features/home/homeCardsStore';
import { setBundleLoaded, useBundles } from '../../features/enrollment/enrolledBundlesStore';
import { isFreeEnrollGs, setActiveMany } from '../../features/enrollment/enrollmentStore';
import { BookIcon } from '../../components/BookIcon';
import { PrePaywallPrompt } from '../../components/PrePaywallPrompt';

type Card =
  | { kind: 'tools'; id: 'tools' }
  | { kind: 'glossary'; id: 'glossary' }
  /** Ear Training & Audio Lab — pinned FAR LEFT, left of tools (owner request
   *  2026-07-26; was right of tools/glossary). Its own card/route → 'EarLab'
   *  (NOT a ToolsHub tile). */
  | { kind: 'lab'; id: 'lab' }
  /** Free-topic taster card (Booth 2026-07-11) — gs0 / gs36, after Glossary. */
  | { kind: 'freeTopic'; id: string; gs: number; name: string; courseOrder: number }
  /** CM2/CM3: a public catalog course (commercialMode). */
  | { kind: 'public'; id: string; order: number; name: string; topicCount: number; hasFreeTopic: boolean }
  /** Placeholder standalone topic — catalog stub, content pending (Booth 2026-07-11). */
  | { kind: 'comingTopic'; id: string; name: string }
  /** Far-right tally card — how many Specialization Certificates a student can
   *  earn (user request 2026-07-22). Tapping opens the Certificates screen. */
  | { kind: 'more'; id: 'more'; count: number }
  /** A user-placed HOME topic card (paid Home customizer, user request
   *  2026-07-22) — a curriculum topic by gs, opened to study. */
  | { kind: 'homeTopic'; id: string; gs: number; name: string; subject: string }
  /** A user-placed HOME cert/program BUNDLE card (user request 2026-07-22) —
   *  one card for the whole cert/program; opening it loads its topics + study. */
  | { kind: 'homeBundle'; id: string; bundleKey: string; bundleKind: 'cert' | 'program' | 'subject'; name: string; topics: number[] }
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

/** gs → { name, subject } for user-placed Home topic cards (user request
 *  2026-07-22). */
const HOME_TOPIC_INDEX: Map<number, { name: string; subject: string }> = (() => {
  const m = new Map<number, { name: string; subject: string }>();
  for (const s of MATRIX_SUBJECTS) for (const t of s.topics) m.set(t.gs, { name: t.name, subject: s.name });
  return m;
})();

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
// Session landing memory (owner 2026-07-30). These module-level vars survive
// component remounts but RESET when the app process restarts — which is exactly
// the "cold start vs in-session return" signal we need:
//  • Cold app start  → land on the DEFAULT card (Glossary for anyone without a
//    paid Home default; otherwise the paid user's chosen/last-added Home card).
//  • In-session return from a card → restore the card the user last had centered.
let sessionLanded = false;
let lastCenteredId: string | null = null;
// HOME always lands on the GLOSSARY card (Booth 2026-07-11). Found by kind at
// landing time (was a fixed index; the deck head is now [Lab][Tools][Glossary]
// after the 2026-07-26 far-left Lab move, so a hardcoded index would drift).

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
  lab: 'AudioLab.webp',
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
/** Far-right tally card count (user request 2026-07-22): the number of
 *  Specialization Certificates a student can earn — the card links to the
 *  Certificates screen. */
const OTHER_CERTS_COUNT = SPECIALIZED_CERTIFICATES.length;

// Course-select card TITLE overrides (user request 2026-07-22). Keyed by the
// title as it renders today (commercial catalog name / course name). NOTE: the
// 'DAW Skills' → 'DAW Fundamentals & Session Management' entry overrides the
// earlier "gs36 card is always DAW Skills" ruling — but ONLY the marketing card
// label; the underlying gs36 topic name (curriculum/glossary/dashboard) is
// unchanged.
const CARD_TITLE_RENAMES: Record<string, string> = {
  'DAW Skills': 'DAW Fundamentals & Session Management',
  'Sound Reinforcement Systems': 'Live Sound Production',
  'Audio System Design and Maintenance': 'Audio Electronics, Service & Repair',
  'Recording Arts': 'Studio Recording',
};
// The "Career and Business" card is retitled to "+ N other programs", where N =
// Academy Program Certificates NOT represented by a card in the current deck
// (user request 2026-07-22).
const OTHER_PROGRAMS_CARD_TITLE = 'Career and Business';
const normProgram = (s: string) => s.toLowerCase().replace(/&/g, 'and').replace(/\s+/g, ' ').trim();
const PROGRAM_NAME_SET = new Set(PROGRAM_PATHS.map((p) => normProgram(p.name)));

/** The card's title BEFORE the 2026-07-22 overrides (null for the tally card). */
function rawCardTitle(item: Card): string | null {
  switch (item.kind) {
    case 'tools':
      return 'Measurement and Analysis Tools';
    case 'glossary':
      return 'Professional Audio Glossary';
    case 'lab':
      return 'Audio Fundamentals & Training Lab';
    case 'freeTopic':
    case 'public':
    case 'comingTopic':
    case 'course':
      return item.name;
    default:
      return null; // 'more'
  }
}

/** Display title after the 2026-07-22 renames (Career card → "+ N programs"). */
function displayCardTitle(item: Card, otherProgramsCount: number): string {
  const raw = rawCardTitle(item) ?? '';
  if ((item.kind === 'public' || item.kind === 'course') && raw === OTHER_PROGRAMS_CARD_TITLE) {
    return `+ ${otherProgramsCount} other programs`;
  }
  return CARD_TITLE_RENAMES[raw] ?? raw;
}

function dotColorFor(card: Card): string {
  switch (card.kind) {
    case 'tools':
    case 'glossary':
    case 'lab':
    case 'freeTopic':
      return colors.green; // free / included
    case 'comingTopic':
      return colors.amber; // standalone topic
    case 'public':
      return card.topicCount > 1 ? colors.purple : colors.amber; // course vs single topic
    case 'course':
      return colors.purple; // full course
    case 'homeTopic':
      return colors.purple; // user-placed Home topic
    case 'homeBundle':
      return card.bundleKind === 'cert' ? colors.blue : card.bundleKind === 'subject' ? colors.amber : colors.purple; // Home bundle
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
  onOpenLab,
  onOpenPublic,
  onLockedPress,
  onOpenMore,
  onOpenPrograms,
  onOpenTopic,
  onOpenBundle,
  academy,
  otherProgramsCount,
}: {
  item: Card;
  onOpenCourse: (c: Extract<Card, { kind: 'course' }>) => void;
  onOpenGlossary: () => void;
  onOpenTools: () => void;
  /** Open the Ear Training & Critical Listening Lab (Phase 1 SHELL). */
  onOpenLab: () => void;
  /** CM6: open a public course → its commercial dashboard. `isFreeTopic` marks
   *  the free-topic taster cards, which a guest may open (paid cards are gated). */
  onOpenPublic: (order: number, isFreeTopic?: boolean) => void;
  /** CM2/CM3: academy-locked tap → the upgrade surface. */
  onLockedPress: () => void;
  /** The "+ XX other" tally card → open the full Curriculum. */
  onOpenMore: () => void;
  /** The "+ N other programs" card → open the Programs page (user request
   *  2026-07-22). */
  onOpenPrograms: () => void;
  /** A user-placed Home topic card → open study for that topic gs (2026-07-22). */
  onOpenTopic: (gs: number) => void;
  /** A user-placed Home bundle card → load its topics + study (2026-07-22). */
  onOpenBundle: (key: string, topics: number[]) => void;
  /** Academy mode signal — drives the Home-Setup deck + locked-tap behavior. */
  academy: boolean;
  /** Count for the "Career and Business" → "+ N other programs" retitle
   *  (user request 2026-07-22). */
  otherProgramsCount: number;
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
          <Text style={[styles.cardAboveText, { color: '#5bb0ff' }]}>SPECIALIZATION CERTIFICATES</Text>
          <View style={[styles.cardAboveRule, { backgroundColor: '#5bb0ff' }]} />
        </View>
        <Pressable
          style={[styles.card, styles.moreCard]}
          onPress={onOpenMore}
          accessibilityRole="button"
          accessibilityLabel={`Plus ${item.count} other certificates — view certificates`}
        >
          <Text style={styles.moreCount}>+{item.count}</Text>
          <Text style={styles.moreLabel}>OTHER CERTIFICATES</Text>
          <Text style={styles.moreSub}>specialization certificates to earn</Text>
          <View style={{ height: 14 }} />
          <Text style={styles.moreCta}>VIEW CERTIFICATES ›</Text>
        </Pressable>
      </View>
    );
  }

  // "+ N other programs" card (the retitled Career and Business card, user
  // request 2026-07-22): no image — a simple filled tally card styled like the
  // far-right FULL CURRICULUM card. Tapping opens the Programs page.
  if ((item.kind === 'public' || item.kind === 'course') && rawCardTitle(item) === OTHER_PROGRAMS_CARD_TITLE) {
    return (
      <View style={styles.cardOuter}>
        <View style={styles.cardAbove}>
          <Text style={[styles.cardAboveText, { color: colors.textSubAlt }]}>CERTIFICATE PROGRAMS</Text>
          <View style={[styles.cardAboveRule, { backgroundColor: colors.textSubAlt }]} />
        </View>
        <Pressable
          style={[styles.card, styles.moreCard]}
          onPress={onOpenPrograms}
          accessibilityRole="button"
          accessibilityLabel={`Plus ${otherProgramsCount} other programs — view programs`}
        >
          <Text style={styles.moreCount}>+{otherProgramsCount}</Text>
          <Text style={styles.moreLabel}>OTHER PROGRAMS</Text>
          <Text style={styles.moreSub}>professional certificate programs</Text>
          <View style={{ height: 14 }} />
          <Text style={styles.moreCta}>VIEW PROGRAMS ›</Text>
        </Pressable>
      </View>
    );
  }

  // User-placed HOME topic card (paid Home customizer, user request 2026-07-22)
  // — a simple filled card with the book icon; tap opens study for that topic.
  if (item.kind === 'homeTopic') {
    return (
      <View style={styles.cardOuter}>
        <View style={styles.cardAbove}>
          <Text style={[styles.cardAboveText, { color: '#c4a2ff' }]}>MY TOPIC</Text>
          <View style={[styles.cardAboveRule, { backgroundColor: '#c4a2ff' }]} />
        </View>
        <Pressable
          style={[styles.card, styles.homeTopicCard]}
          onPress={() => onOpenTopic(item.gs)}
          accessibilityRole="button"
          accessibilityLabel={`Study ${item.name}`}
        >
          <BookIcon color="#c4a2ff" filled size={54} />
          <Text style={styles.homeTopicName}>{item.name}</Text>
          {item.subject ? <Text style={styles.homeTopicSubject}>{item.subject}</Text> : null}
          <View style={{ height: 12 }} />
          <Text style={styles.homeTopicCta}>STUDY ›</Text>
        </Pressable>
      </View>
    );
  }

  // User-placed HOME cert/program BUNDLE card (user request 2026-07-22) — one
  // card for the whole cert/program; tapping loads its topics + opens study.
  if (item.kind === 'homeBundle') {
    const cert = item.bundleKind === 'cert';
    const subject = item.bundleKind === 'subject';
    const tint = cert ? '#5bb0ff' : subject ? '#ffc64d' : '#c4a2ff';
    const label = cert ? 'CERTIFICATE' : subject ? 'SUBJECT' : 'PROGRAM';
    const bg = cert ? '#0e1a26' : subject ? '#1c1708' : '#161225';
    return (
      <View style={styles.cardOuter}>
        <View style={styles.cardAbove}>
          <Text style={[styles.cardAboveText, { color: tint }]}>{label}</Text>
          <View style={[styles.cardAboveRule, { backgroundColor: tint }]} />
        </View>
        <Pressable
          style={[styles.card, styles.homeTopicCard, { borderColor: tint, backgroundColor: bg }]}
          onPress={() => onOpenBundle(item.bundleKey, item.topics)}
          accessibilityRole="button"
          accessibilityLabel={`Open ${item.name}`}
        >
          <BookIcon color={tint} filled size={54} />
          <Text style={styles.homeTopicName}>{item.name}</Text>
          <Text style={styles.homeTopicSubject}>{item.topics.length} topics</Text>
          <View style={{ height: 12 }} />
          <Text style={[styles.homeTopicCta, { color: tint }]}>LOAD & STUDY ›</Text>
        </Pressable>
      </View>
    );
  }
  // Ear Training & Critical Listening Lab (Phase 1 SHELL) — pinned card with a
  // simple themed treatment (no external art; ear-training GREEN + a headphones
  // motif); tap opens the Lab route. Rendered like the other self-contained
  // pinned cards (more / homeTopic) rather than the image-backed tools/glossary.
  if (item.kind === 'lab') {
    // Image-backed card (AudioLab.webp in course-cards) matching tools/glossary:
    // art + legibility scrim + title + green OPEN LAB key (user request 2026-07-26).
    const labUrl = cardImageUrl('lab');
    return (
      <View style={styles.cardOuter}>
        <View style={styles.cardAbove}>
          <Text style={[styles.cardAboveText, { color: '#5bff85' }]}>INCLUDED FOR EVERYONE</Text>
          <View style={[styles.cardAboveRule, { backgroundColor: '#5bff85' }]} />
        </View>
        <ImageBackground
          source={labUrl ? { uri: labUrl } : undefined}
          style={[styles.card, { borderColor: 'rgba(55,224,95,.6)' }]}
          imageStyle={styles.cardImg}
        >
          <LinearGradient
            colors={['rgba(8,8,10,0.55)', 'rgba(8,8,10,0)', 'rgba(8,8,10,0.45)', 'rgba(8,8,10,0.95)']}
            locations={[0, 0.3, 0.58, 1]}
            style={StyleSheet.absoluteFill}
          />
          <View>
            <Text style={styles.cardTitle}>Audio Fundamentals & Training Lab</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <View style={{ width: CARD_BTN_W }}>
              <GlassButton label="OPEN LAB" tint="green" height={50} onPress={onOpenLab} />
            </View>
          </View>
        </ImageBackground>
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

  // Certificate cards match the Awards colours (user request 2026-07-18):
  // Professional Certificate (multi-topic) = PURPLE; Specialization Certificate
  // (single-topic / coming-soon) = BLUE — border + eyebrow, locked or not.
  const isProfCert = !!pub && pub.topicCount > 1;
  const isSpecCert = (!!pub && pub.topicCount === 1) || !!coming;

  const accent = isGlossary
    ? 'rgba(91,176,255,.65)'
    : // Measurement tools now share the free topics' GREEN (Booth 2026-07-11 #5).
      free || isTools
      ? 'rgba(55,224,95,.6)'
      : isProfCert
        ? 'rgba(196,162,255,.65)'
        : isSpecCert
          ? 'rgba(91,176,255,.65)'
          : locked
            ? lockedAccent
            : 'rgba(255,180,0,.6)';
  const eyebrowColor = isGlossary
    ? '#7fd4ff'
    : free || isTools
      ? '#5bff85'
      : isProfCert
        ? '#c4a2ff'
        : isSpecCert
          ? '#5bb0ff'
          : locked
            ? lockedEyebrow
            : '#ffc64d';
  // Cards the student can mark into their own deck (academy mode).
  const eyebrow = isTools
    ? 'INCLUDED FOR EVERYONE'
    : isGlossary
      ? 'INCLUDED FOR EVERYONE'
      : free
        ? 'FREE TOPIC' // keep the free-topic subtitle in every mode (2026-07-18 fix)
        : pub
          ? // Category labels — SINGULAR per card (user request 2026-07-18):
            // multi-topic = 'Professional Certificate'; single-topic =
            // 'Specialization Certificate'.
            pub.topicCount > 1
            ? 'Professional Certificate'
            : 'Specialization Certificate'
          : coming
            ? 'Specialization Certificate'
            : course!.isPrereq
              ? 'SAFETY'
              : course!.code;
  // Title with the 2026-07-22 card renames applied (Career → "+ N programs").
  const title = displayCardTitle(item, otherProgramsCount);
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
              <GlassButton label="INCLUDED FREE" tint="green" height={50} onPress={() => onOpenPublic(free.courseOrder, true)} />
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
      {/* Glossary card wears a subtle blue outer glow (user request 2026-07-18)
          — on a wrapper because the card itself clips its own shadow. */}
      {isGlossary ? <View style={styles.glossaryGlow}>{cardBody}</View> : cardBody}
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
  // A session-less GUEST may study the FREE topics only; opening any paid topic
  // shows a friendly sign-up prompt (set in load(), keyed on the real session).
  const [isGuest, setIsGuest] = useState(false);
  const [guestGateOpen, setGuestGateOpen] = useState(false);
  // A LAPSED (cancelled) member keeps their Home cards as they set them up (the
  // store persists), but can no longer open them — a "Membership Expired" warning
  // fires instead (user request 2026-07-23).
  const lapsed = entitlement === 'lapsed';

  // Academy signal (`caps.allTopics`) — drives the Home-Setup deck below. The
  // legacy per-card "my courses" star was removed (user request 2026-07-24);
  // course selection + default position now live in the Home Setup screen.
  const academy = caps.allTopics;

  const load = useCallback(async () => {
    setError(null);
    warmCardArt(); // prefetch card art up front
    // A GUEST (no auth session) OR commercialMode seeds the carousel from the
    // PUBLIC catalog — [Audio Tools] [Glossary] [Lab] + free topics + courses —
    // with NO user/enrollment/progress queries. Those would throw 'user_not_found'
    // for a guest, which used to blank the whole Home with a "complete registration"
    // error (fix 2026-07-26: Guest Mode landed on the academy path). Keyed on the
    // real session, NOT entitlement, since returning authed users also default to
    // the mock 'anonymous' entitlement.
    const { data: sessData } = await supabase.auth.getSession();
    const isGuest = !sessData.session;
    setIsGuest(isGuest);
    if (commercialMode || isGuest) {
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
      // Far-right tally card = Specialization Certificates to earn (user request
      // 2026-07-22), linking to the Certificates screen.
      const otherCount = OTHER_CERTS_COUNT;
      setCards([
        // Ear Training & Audio Lab — pinned FAR LEFT, left of tools (owner
        // request 2026-07-26).
        { kind: 'lab', id: 'lab' },
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

      // Far-right tally card = Specialization Certificates to earn (user request
      // 2026-07-22), linking to the Certificates screen.
      const otherCount = OTHER_CERTS_COUNT;
      // Tools card sits LEFT of the Glossary card (Booth 2026-07-09v); the
      // Glossary remains the standard landing card (index 1 default below).
      setCards([
        // Ear Training & Audio Lab — pinned FAR LEFT, left of tools (owner
        // request 2026-07-26).
        { kind: 'lab', id: 'lab' },
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
  // Paid Home customizer (user request 2026-07-22): when the user has placed
  // topics and/or cert/program bundles, the Home deck becomes Tools + Glossary
  // (locked) + those topic cards + bundle cards.
  const homeGs = useHomeGs();
  const homeBundleKeys = useHomeBundles();
  const defaultHomeGs = useDefaultHomeGs();
  const bundles = useBundles();
  const displayDeck = useMemo<Card[] | null>(() => {
    if (!cards) return cards;
    // HOME is LOCKED to the DEFAULT deck (all cards) for everyone EXCEPT an
    // ACTIVE PAID academy member (user request 2026-07-26). Only entitlement
    // 'academy' unlocks the custom Home deck; free / guest / anonymous / LAPSED
    // all fall through to the default. Gate on the REAL entitlement, never the
    // __DEV__-bypassed `caps` (which forces academy on in dev). When a
    // subscription expires (lapsed) Home reverts to the default automatically.
    if (entitlement === 'academy' && (homeGs.length > 0 || homeBundleKeys.length > 0)) {
      // Pinned head cards survive the custom deck: Lab (far left, owner request
      // 2026-07-26) + Tools + Glossary, in deck order.
      const fixed = cards.filter((c) => c.kind === 'lab' || c.kind === 'tools' || c.kind === 'glossary');
      const topicCards: Card[] = homeGs.map((gs) => ({
        kind: 'homeTopic',
        id: `home-${gs}`,
        gs,
        name: HOME_TOPIC_INDEX.get(gs)?.name ?? `Topic gs${gs}`,
        subject: HOME_TOPIC_INDEX.get(gs)?.subject ?? '',
      }));
      const byKey = new Map(bundles.map((b) => [b.key, b] as const));
      const bundleCards: Card[] = homeBundleKeys
        .map((key) => byKey.get(key))
        .filter((b): b is NonNullable<typeof b> => !!b)
        .map((b) => ({
          kind: 'homeBundle',
          id: `homeb-${b.key}`,
          bundleKey: b.key,
          bundleKind: b.kind,
          name: b.name,
          topics: b.topics,
        }));
      return [...fixed, ...bundleCards, ...topicCards];
    }
    // No Home-Setup cards placed → the default deck from load(). The legacy
    // per-card "my courses" star deck was removed (user request 2026-07-24);
    // Home Setup now owns course selection + default position.
    return cards;
  }, [cards, entitlement, homeGs, homeBundleKeys, bundles]);

  // "+ N other programs" count for the retitled Career and Business card (user
  // request 2026-07-22): Academy Program Certificates not represented by a
  // program-named card currently in the deck.
  const otherProgramsCount = useMemo(() => {
    const deck = displayDeck ?? [];
    let shown = 0;
    for (const c of deck) {
      const raw = rawCardTitle(c);
      if (!raw || raw === OTHER_PROGRAMS_CARD_TITLE) continue;
      const disp = CARD_TITLE_RENAMES[raw] ?? raw;
      if (PROGRAM_NAME_SET.has(normProgram(disp))) shown++;
    }
    return Math.max(0, PROGRAM_PATHS.length - shown);
  }, [displayDeck]);

  // Latest deck for the (stable) onViewableItemsChanged callback to read.
  const deckRef = useRef(displayDeck);
  deckRef.current = displayDeck;

  // Landing card (owner 2026-07-30). `load()` re-runs on every focus and rebuilds
  // `cards`, so this effect fires on focus/reload. We branch on `sessionLanded`:
  //  • First landing this SESSION (cold app start) → the DEFAULT card: the paid
  //    user's chosen Home default, else their last-added Home card, else Glossary
  //    (which is where free users always land). Free users have no Home cards, so
  //    they fall straight through to Glossary on every cold start, as required.
  //  • Any later landing (returning from a card, tab switch) → restore the card
  //    the user last had centered, so going back returns you where you were.
  useEffect(() => {
    const deck = displayDeck;
    if (!deck || deck.length === 0) return;
    const findId = (id: string) => deck.findIndex((c) => c.id === id);
    const glossaryIdx = Math.max(0, deck.findIndex((c) => c.kind === 'glossary'));
    let target: number;
    if (!sessionLanded) {
      target = glossaryIdx;
      if (defaultHomeGs != null) {
        const i = findId(`home-${defaultHomeGs}`);
        if (i >= 0) target = i;
      } else if (homeGs.length > 0) {
        // Paid user with no explicit default → their LATEST-added Home card
        // (homeGs appends, so the last entry is the newest). Stays until they
        // move another there (a new add) or pick one in Home Setup.
        const i = findId(`home-${homeGs[homeGs.length - 1]}`);
        if (i >= 0) target = i;
      }
      sessionLanded = true;
    } else {
      const i = lastCenteredId ? findId(lastCenteredId) : -1;
      target = i >= 0 ? i : glossaryIdx;
    }
    target = Math.min(Math.max(0, target), deck.length - 1);
    setActiveIdx(target);
    const t = setTimeout(() => listRef.current?.scrollToIndex({ index: target, animated: false }), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards, defaultHomeGs]);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const idx = viewableItems[0]?.index;
    if (idx != null) {
      setActiveIdx(idx);
      // Remember the centered card (by id) so an in-session return re-centers it.
      const id = deckRef.current?.[idx]?.id;
      if (id) lastCenteredId = id;
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

  const openLab = useCallback(() => {
    (navigation as any).navigate('EarLab');
  }, [navigation]);

  const openMore = useCallback(() => {
    // The far-right tally card links to the Certificates screen (user request
    // 2026-07-22).
    (navigation as any).navigate('Awards', { category: 'specialization' });
  }, [navigation]);

  // "+ N other programs" card → the Program page of the Awards pager (user
  // request 2026-07-22).
  const openPrograms = useCallback(() => {
    (navigation as any).navigate('Awards', { category: 'program' });
  }, [navigation]);

  // A lapsed member's saved Home cards stay put but can't be opened (user request
  // 2026-07-23).
  const membershipExpired = useCallback(() => {
    Alert.alert(
      'Membership Expired',
      'Your membership has expired. Renew to open your saved Home cards and continue studying.',
      [
        { text: 'Not now', style: 'cancel' },
        { text: 'Renew', onPress: () => (navigation as any).navigate('Paywall') },
      ],
    );
  }, [navigation]);

  // A user-placed Home topic card → the study area (best-effort; per-topic
  // deep-link is a follow-up). user request 2026-07-22.
  const openTopic = useCallback(
    (gs: number) => {
      // Expired members KEEP the free content — Pro Audio Safety + DAW (and Tools/
      // Glossary elsewhere); everything else is locked (user ruling 2026-07-23).
      if (lapsed && !isFreeEnrollGs(gs)) return membershipExpired();
      (navigation as any).navigate('Study', { screen: 'Dashboard' });
    },
    [navigation, lapsed, membershipExpired],
  );

  // Opening a Home bundle card LOADS its topics onto the Dashboard, then goes to
  // study (user request 2026-07-22).
  const openBundle = useCallback(
    (key: string, topics: number[]) => {
      if (lapsed) return membershipExpired();
      setActiveMany(topics, true);
      setBundleLoaded(key, true);
      (navigation as any).navigate('Study', { screen: 'Dashboard' });
    },
    [navigation, lapsed, membershipExpired],
  );

  // CM6: open a public course → the commercial dashboard (Study tab), which
  // reads the persisted order and renders the seq-ordered topics.
  const openPublicCourse = useCallback(
    async (order: number, isFreeTopic = false) => {
      // A session-less GUEST may study the FREE topics only. Opening any non-free
      // (paid) topic shows a friendly sign-up prompt instead of dropping them into
      // a topic with no on-device study path (owner decision 2026-07-26).
      if (isGuest && !isFreeTopic) {
        setGuestGateOpen(true);
        return;
      }
      await setLastPublicCourse(order);
      (navigation as any).navigate('Study', { screen: 'Dashboard' });
    },
    [navigation, isGuest],
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
        {/* Top nav buttons (user request 2026-07-22): Explore · Certificates ·
            Programs · Pro Registry · Enrollments — each opens the shared swipe
            pager on its page. */}
        <View style={styles.awardsRow}>
          <Pressable
            style={styles.awardBtn}
            onPress={() => (navigation as any).navigate('Awards', { category: 'curriculum' })}
            accessibilityRole="button"
            accessibilityLabel="Explore the Academy"
          >
            <Text style={styles.awardBtnText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
              Explore
            </Text>
          </Pressable>
          <Pressable
            style={styles.awardBtn}
            onPress={() => (navigation as any).navigate('Awards', { category: 'specialization' })}
            accessibilityRole="button"
            accessibilityLabel="Specialization certificates"
          >
            <Text style={styles.awardBtnText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
              Certificates
            </Text>
          </Pressable>
          <Pressable
            style={styles.awardBtn}
            onPress={() => (navigation as any).navigate('Awards', { category: 'program' })}
            accessibilityRole="button"
            accessibilityLabel="Certificate programs"
          >
            <Text style={styles.awardBtnText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
              Programs
            </Text>
          </Pressable>
          <Pressable
            style={styles.awardBtn}
            onPress={() => (navigation as any).navigate('Awards', { category: 'directory' })}
            accessibilityRole="button"
            accessibilityLabel="Pro Registry — get discovered"
          >
            <Text style={styles.awardBtnText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
              Pro Registry
            </Text>
          </Pressable>
          {/* Enrollments — GREEN when the user has paid (academy) standing. */}
          <Pressable
            style={[styles.awardBtn, entitlement === 'academy' && styles.enrollBtnOn]}
            onPress={() => (navigation as any).navigate('Awards', { category: 'enrollment' })}
            accessibilityRole="button"
            accessibilityLabel="Enrollments"
          >
            <Text
              style={[styles.awardBtnText, entitlement === 'academy' && styles.enrollBtnTextOn]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.6}
            >
              Enrollments
            </Text>
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
        extraData={otherProgramsCount}
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
            onOpenLab={openLab}
            onOpenPublic={openPublicCourse}
            onLockedPress={() => setUpgradeOpen(true)}
            onOpenMore={openMore}
            onOpenPrograms={openPrograms}
            onOpenTopic={openTopic}
            onOpenBundle={openBundle}
            academy={academy}
            otherProgramsCount={otherProgramsCount}
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

      {/* Guest sign-up gate (owner decision 2026-07-26): a session-less guest
          tapping a non-free topic is invited to create a free account rather than
          dropped into a paid topic. Free topics open normally into Study. */}
      <PrePaywallPrompt
        visible={guestGateOpen}
        onClose={() => setGuestGateOpen(false)}
        title="Create a free account"
        lines={[
          'Sign up to study this topic. Your free topics — Professional Audio Safety and DAW Fundamentals — are open to explore right now.',
        ]}
        primaryLabel="CREATE FREE ACCOUNT"
        onPrimary={() => {
          setGuestGateOpen(false);
          (navigation as any).navigate('Auth');
        }}
        dismissLabel="NOT NOW"
      />

      {/* The app WELCOME now greets first-run users BEFORE the login screen
          (user request 2026-07-23, AppWelcomeOverlay on AuthScreen). Home keeps
          only the "Our Commitment to You" popup. */}
      <ScreenIntroOverlay introKey="commitment" delayMs={8000} />
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
  // 5 buttons now (user request 2026-07-22) — tighter gap/padding to fit.
  awardsRow: { flexDirection: 'row', gap: 5, alignSelf: 'stretch' },
  awardBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 3,
    borderRadius: 8,
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#2c2c2c',
  },
  awardBtnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 0.3, color: colors.textSecondary },
  // Enrollment button green when the user is paid (academy); gray otherwise.
  enrollBtnOn: { borderColor: 'rgba(55,224,95,.7)', backgroundColor: 'rgba(55,224,95,.1)' },
  enrollBtnTextOn: { color: '#37e05f' },
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
  // Subtle warm-blue outer glow around the Glossary card's blue frame (user
  // request 2026-07-18) — small radius, low opacity so it only whispers.
  glossaryGlow: {
    borderRadius: 16,
    shadowColor: '#6bb8ff',
    shadowOpacity: 0.45,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
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
  // User-placed Home topic card (paid Home customizer, user request 2026-07-22).
  homeTopicCard: {
    backgroundColor: '#161225',
    borderColor: 'rgba(196,162,255,.5)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  homeTopicName: {
    fontFamily: fonts.oswaldMedium,
    fontSize: 22,
    lineHeight: 26,
    letterSpacing: 0.3,
    color: '#ffffff',
    textAlign: 'center',
    paddingHorizontal: 8,
    marginTop: 6,
  },
  homeTopicSubject: { fontFamily: fonts.barlowRegular, fontSize: 13, color: '#b7a7e0', textAlign: 'center' },
  homeTopicCta: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.2, color: '#c4a2ff' },
  // Ear Training & Critical Listening Lab card (Phase 1 SHELL) — ear-training
  // green, self-contained (no external art).
  labCard: {
    backgroundColor: '#0e1a12',
    borderColor: 'rgba(55,224,95,.5)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  labIcon: { fontSize: 52, marginBottom: 4 },
  labTitle: {
    fontFamily: fonts.oswaldMedium,
    fontSize: 22,
    lineHeight: 26,
    letterSpacing: 0.3,
    color: '#ffffff',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  labSub: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18, color: '#9fe6b5', textAlign: 'center', paddingHorizontal: 10 },
  labCta: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.2, color: '#5bff85' },
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
