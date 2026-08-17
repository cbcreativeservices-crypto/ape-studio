/**
 * S2 — Flashcards (r6 LOCKED; NO r8 difficulty banner) + Booth change orders
 * 2026-07-07/08:
 *  - Header shows the TOPIC under study as a subtitle.
 *  - Filter row: full-word difficulty chips (All / Beginning / Intermediate /
 *    Advanced) + order controls (A–Z / Shuffle; pressing Shuffle re-shuffles).
 *  - Level views (1–5) keep the term visible with a labeled subtitle.
 *  - LED + % readout creep via studyDisplayPct.
 *  - 🔒 NON-DESTRUCTIVE KNOWN MODEL (Booth #3, 2026-07-08): marking a card
 *    known sends known:true (earning progress credit) and hides the card
 *    LOCALLY (persisted per topic). "Unmark"/"Reset All Known" only clear the
 *    LOCAL hidden list so cards return to the deck — known:false is NEVER
 *    emitted, so server progress, the gate, and the LED can never regress.
 *  - Controls pinned to the bottom; card flexes to fill.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement, type ReactNode } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Modal, PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GlassButton } from '../../components/GlassButton';
import { LedMeterWell, segmentsForPct } from '../../components/LedMeter';
import { StudioButton } from '../../components/StudioButton';
import { DeckIcon } from '../../components/DeckIcon';
import { useCoachMark } from '../../lib/coachMark';
import { isHazardTerm } from '../../lib/hazard';
import { useShake } from '../../lib/useShake';
import { CautionBadge } from '../../components/CautionBadge';
import { colors, fonts } from '../../theme/tokens';
import {
  fetchGlossaryItemsByIds,
  fetchMethodState,
  fetchTopicItems,
  fetchTopicMedia,
  fetchTermTopicNames,
  studyDisplayPct,
  type GlossaryItem,
  type ItemStates,
} from '../../features/study/api';
import {
  FLAGGED_TOPIC_ID,
  getTermList,
  setInTermList,
  toggleBookmark,
  removeBookmarks,
  useBookmarks,
  useTermList,
} from '../../features/flags/flaggedStore';
import { BookmarkIcon, TermSelectIcons } from '../../features/flags/TermSelectIcons';
import { LowLightDim } from '../../features/settings/LowLightLayer';
import { consumeDevPreview } from '../../features/dev/devPreview';
import { devBypass } from '../../config/devMode';
import { IntroSheet, ScreenIntroOverlay } from '../../features/intro/ScreenIntroOverlay';
import { INTRO_STORAGE_PREFIX } from '../../features/intro/screenIntros';
import { StudySession } from '../../features/study/sync';
import { supabase } from '../../lib/supabase';
import {
  loadLocalMethodStates,
  mergeItemStates,
  saveLocalMethodStates,
} from '../../features/study/localProgress';
import { ResetIcon } from '../../components/ResetIcon';
import { LinkIcon } from '../../components/LinkIcon';
import { sendFeedback } from '../../lib/feedback';
import {
  useSessionTimer,
  SessionTimerButton,
  SessionTimerPill,
  SessionTimerModal,
  SessionTimerBanner,
} from '../../features/study/SessionTimer';
import { setLastStudyLocation } from '../../features/study/lastStudyLocation';
import { StudyHeader } from './StudyHeader';
import type { StudyStackParamList } from '../../navigation/types';

/**
 * The user's own "Flagged" pseudo-topic (Booth 2026-07-18): the Dashboard's
 * Flagged card studies the shared flagged list through this screen. It has no
 * server achievement row, so server method-state/progress sync is skipped —
 * study here is browse/review (local-only), by design for now.
 * (FLAGGED_TOPIC_ID lives in flaggedStore so the Dashboard doesn't import a
 * screen module; it is imported with the store functions above.)
 */

type Props = NativeStackScreenProps<StudyStackParamList, 'Flashcards'>;

// Six definition views (Booth 2026-07-08: Mistakes and Related Terms split).
const LEVEL_LABELS = [
  'DEFINITION',
  'PLAIN ENGLISH',
  'PURPOSE & APPLICATION',
  'SCENARIOS',
  'MISTAKES',
  'RELATED TERMS',
] as const;
/** Friendly checklist labels for the "show on reveal" FILTERS popup (Booth
 *  2026-07-09d). Index 0..5 → levels 1..6, aligned with LEVEL_LABELS. */
const SECTION_LABELS = [
  'Definition',
  'Plain English',
  'Purpose & Application',
  'Scenarios',
  'Mistakes',
  'Related Terms',
] as const;
const ALL_LEVELS = [1, 2, 3, 4, 5, 6];
/** Which sections show when a card is revealed — a device-global preference. */
const SECTIONS_KEY = 'ape:fcSections';
/** Show/hide term media (images) on the card — device-global (user request
 *  2026-07-17). Default ON. */
const SHOW_MEDIA_KEY = 'ape:fcShowMedia';
/** Show/hide the tappable in-definition glossary links — device-global, default
 *  ON (owner 2026-08-13). Toggling on any card applies to every definition. */
const SHOW_LINKS_KEY = 'ape:fcShowLinks';

type Difficulty = 'beginner' | 'intermediate' | 'advanced';

/** Long-press popup list selectors (Booth 2026-07-11 / 2026-07-18). */
type TermListSelKey =
  | 'all'
  | 'beginner'
  | 'intermediate'
  | 'advanced'
  | 'unseen'
  | 'known'
  | 'bookmark'
  | 'starred';

const hiddenKey = (achievementId: string) => `ape:fcHidden:${achievementId}`;
// The old per-topic bookmarked/flag list (`ape:fcHard:<id>`) is retired — flags now
// live on the ONE shared list in features/flags/flaggedStore (Booth 2026-07-18).


function seededShuffle<T>(arr: T[], seed: number): T[] {
  // Deterministic per seed so the deck doesn't reshuffle on every render.
  const a = [...arr];
  let s = seed || 1;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) % 2147483647;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function levelText(item: GlossaryItem, level: number): string {
  const join = (a?: string[] | null) => (a && a.length ? a.map((s) => `• ${s}`).join('\n') : null);
  switch (level) {
    case 1:
      return item.definition;
    case 2:
      return item.plain_english ?? item.definition;
    case 3:
      return [item.purpose_function, item.practical_application].filter(Boolean).join('\n\n') || item.definition;
    case 4:
      return join(item.scenario_contexts) ?? item.definition;
    case 5:
      return join(item.common_mistakes) ?? item.definition;
    case 6: {
      const parts = [
        item.related_terms?.length ? item.related_terms.map((s) => `• ${s}`).join('\n') : null,
        // difficulty (beg/int/adv) deliberately NOT shown (Booth 2026-07-08)
        item.category || null,
      ].filter(Boolean);
      return parts.join('\n\n') || item.definition;
    }
    default:
      return item.definition;
  }
}

type ChipTint = 'amber' | 'green' | 'orange' | 'blue' | 'purple';
const CHIP_TINTS: Record<ChipTint, { bg: [string, string]; border: string; fg: string }> = {
  amber: { bg: ['#2a2008', '#1a1405'], border: 'rgba(255,180,0,.65)', fg: '#ffc64d' },
  green: { bg: ['#0c2412', '#081a0c'], border: 'rgba(55,224,95,.65)', fg: '#5bff85' },
  orange: { bg: ['#2b1c0a', '#1c1206'], border: 'rgba(255,138,30,.7)', fg: '#ffa64d' },
  blue: { bg: ['#0e2033', '#081521'], border: 'rgba(47,155,255,.7)', fg: '#7fbfff' },
  purple: { bg: ['#1e1030', '#140a22'], border: 'rgba(180,91,255,.7)', fg: '#c48cff' },
};

function FilterChip({
  label,
  active,
  onPress,
  onLongPress,
  activeTint = 'amber',
  disabled = false,
  icon,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  /** Long-press = list the terms in this filter's set (Booth 2026-07-11). */
  onLongPress?: () => void;
  /** Active color family — KNOWN goes green, FLAGGED orange (Booth 2026-07-08). */
  activeTint?: ChipTint;
  /** Locked out (e.g. while the reveal SOLO is engaged — user request 2026-07-18). */
  disabled?: boolean;
  /** Render an icon instead of the text label (color passed per active state). */
  icon?: (color: string) => ReactNode;
}) {
  const t = CHIP_TINTS[activeTint];
  const fg = active ? t.fg : '#999999';
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={350}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active, disabled }}
      style={disabled ? { opacity: 0.4 } : undefined}
    >
      <LinearGradient
        colors={active ? t.bg : ['#222222', '#161616']}
        style={[chipStyles.chip, { borderColor: active ? t.border : '#3a3a3a' }]}
      >
        {icon ? icon(fg) : <Text style={[chipStyles.text, { color: fg }]}>{label}</Text>}
      </LinearGradient>
    </Pressable>
  );
}

/** Eye glyph (user request 2026-07-24) — a pointed almond outline with a
 *  concentric iris ring and a solid round pupil, for the SOLO study-view button. */
function EyeIcon({ color, pupil }: { color: string; pupil: string }) {
  return (
    <Svg width={24} height={29} viewBox="0 0 24 29">
      {/* Natural eye lids (arched upper, flatter lower, slight tilt) — even
          taller so the iris ring + pupil read clearly (user request 2026-07-24). */}
      <Path
        d="M2 15 Q12 2 22 13.5 Q12 25 2 15 Z"
        fill="none"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      {/* Iris ring. */}
      <Circle cx={12} cy={14.5} r={5} fill="none" stroke={color} strokeWidth={1.5} />
      {/* Center pupil (color/brightness set by caller). */}
      <Circle cx={12} cy={14.5} r={2.3} fill={pupil} />
    </Svg>
  );
}

/** Full-screen glyph — four corner brackets (an SVG, so it aligns tightly with
 *  the card's other SVG corner icons; user request 2026-07-24). */
function FullscreenIcon({ color }: { color: string }) {
  return (
    <Svg width={23} height={23} viewBox="0 0 24 24">
      {/* Corner-bracket frame — larger within the same button (user 2026-07-24). */}
      <Path
        d="M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Thin double-sided diagonal arrow (bottom-left ↔︎ top-right), gapped from
          the brackets (user request 2026-07-24). */}
      <Path
        d="M8.5 15.5 L15.5 8.5 M15.5 8.5 L12 8.5 M15.5 8.5 L15.5 12 M8.5 15.5 L12 15.5 M8.5 15.5 L8.5 12"
        fill="none"
        stroke={color}
        strokeWidth={1.3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Shuffle glyph — two crossing arrows (replaces the SHUFFLE text). */
function ShuffleIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={16} viewBox="0 0 21 16">
      <Path
        d="M2 4 H6 L15 12 H19"
        stroke={color}
        strokeWidth={1.7}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M16 9.5 L19 12 L16 14.5" stroke={color} strokeWidth={1.7} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Path
        d="M2 12 H6 L15 4 H19"
        stroke={color}
        strokeWidth={1.7}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M16 1.5 L19 4 L16 6.5" stroke={color} strokeWidth={1.7} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

const chipStyles = StyleSheet.create({
  chip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 4.5, borderWidth: 1 },
  text: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 0.9 },
});

export function FlashcardsScreen({ navigation, route }: Props) {
  const { achievementId, topicName } = route.params;
  const insets = useSafeAreaInsets();
  const flaggedMode = achievementId === FLAGGED_TOPIC_ID;

  // Remember this exact method+topic so the Enrollments "CONTINUE LEARNING"
  // banner can resume here (re-records on every focus = true last-visited).
  useFocusEffect(
    useCallback(() => {
      setLastStudyLocation({ kind: 'method', route: 'Flashcards', achievementId, topicName });
    }, [achievementId, topicName]),
  );

  const [items, setItems] = useState<GlossaryItem[] | null>(null);
  const [states, setStates] = useState<ItemStates>({});
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  // Flag list (Booth 2026-07-18): the ONE shared flagged set (glossary star ↔︎
  // flashcards flag ↔︎ Flagged dashboard topic) via features/flags/flaggedStore.
  // Replaces the old per-topic `ape:fcHard:<id>` list.
  const bookmarked = useBookmarks(achievementId);
  // ★ starred = the user's notifications list (Booth 2026-07-18) — its own
  // view chip + popup list alongside flagged.
  const starred = useTermList('starred');
  // Global self-assessed ✓ known list (select icons) — the KNOWN chip/popup
  // shows it UNIONED with the per-topic known-hidden cards, so ✓-marks made in
  // any term list show up here too (Booth 2026-07-18 fix).
  const knownList = useTermList('known');
  const [error, setError] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [level, setLevel] = useState(0);
  const [showKnown, setShowKnown] = useState(false);
  // Multi-select difficulty (Booth 2026-07-08): empty set = ALL.
  const [diffSel, setDiffSel] = useState<Set<Difficulty>>(new Set());
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);
  const [starredOnly, setStarredOnly] = useState(false);
  const [orderMode, setOrderMode] = useState<'az' | 'shuffle'>('az');
  const [shuffleNonce, setShuffleNonce] = useState(1);
  // Tracks which cards were revealed this visit. View credit now comes from the
  // term being SHOWN (see viewedThisSession effect), so this is only kept for
  // its incidental resets elsewhere; nothing reads it for completion.
  const [, setRevealedThisVisit] = useState<Set<string>>(new Set());
  // FILTERS popup: which definition sections show when a card is revealed
  // (levels 1..6). Never empty. Device-global preference (Booth 2026-07-09d).
  const [filtersOpen, setFiltersOpen] = useState(false);
  // Full-screen distraction-free mode (Booth 2026-07-11): long-press the card
  // or tap the ⛶ button. A short instruction guide shows the first TWO times
  // the user actually reviews terms in it (2 term-changes); open+close without
  // reviewing does NOT count.
  const [fullscreen, setFullscreen] = useState(false);
  // Reveal SOLO (user request 2026-07-18): the red "eye" button opens an inline
  // study view — term + primary definition shown together. Like a mixer solo:
  // it overrides the reveal filters and locks the FILTERS button until cleared.
  const [soloReveal, setSoloReveal] = useState(false);
  // Study Sheet review mode (user request 2026-07-18): a full-screen view that
  // shows the term AND the chosen definition sections together on one screen
  // (no tap-to-flip). Entered from the FILTERS popup.
  const [reviewMode, setReviewMode] = useState(false);
  const [showFsGuide, setShowFsGuide] = useState(false);
  const fsGuideCount = useRef(0);
  const fsReviewed = useRef(0);
  // Long-press a filter chip → list all its terms (Booth 2026-07-11). Only the
  // list KEY is stored — rows are computed LIVE at render (2026-07-18 fix:
  // snapshot rows went stale the moment a select icon changed a list).
  const [termList, setTermList] = useState<{ title: string; key: TermListSelKey } | null>(null);
  // Names for the GLOBAL lists (known/flagged/custom): those lists span every
  // topic, so their members aren't all in THIS deck's `items`. When such a
  // popup opens we fetch the missing term names by id so the full list shows
  // (Booth 2026-07-18 fix — the popup used to intersect with the current deck,
  // hiding terms tagged in other topics). id → term.
  const [listMembers, setListMembers] = useState<Record<string, string>>({});
  // Tap a highlighted glossary term inside a definition → its own full-screen
  // definition; closing returns to the exact card position (Booth 2026-07-18).
  const [linkedTerm, setLinkedTerm] = useState<GlossaryItem | null>(null);
  // Term images (Booth 2026-07-16): glossary_media url per item; ids whose
  // image failed to load (e.g. art not uploaded yet) fall back to text-only.
  const [mediaByItem, setMediaByItem] = useState<Record<string, string>>({});
  const [badImages, setBadImages] = useState<Set<string>>(new Set());
  const [sections, setSections] = useState<Set<number>>(new Set(ALL_LEVELS));
  // Show/hide term images on the card (user request 2026-07-17) — a FILTERS
  // popup toggle, device-global, default ON.
  const [showMedia, setShowMedia] = useState(true);
  // Show/hide in-definition glossary links (owner 2026-08-13) — device-global,
  // default ON. One toggle governs every card's definition text.
  const [showLinks, setShowLinks] = useState(true);
  // Optional silent session-length countdown (owner 2026-08-13) — flashcards-only.
  const sessionTimer = useSessionTimer();
  // Self-retiring "tap/swipe" hint: hides after 5 reveal round-trips, for the
  // first 5 flashcard opens app-wide (lib/coachMark.ts).
  const coach = useCoachMark('ape:coach:flashcards', 5);

  const session = useRef<StudySession | null>(null);

  const persistHidden = useCallback(
    (next: Set<string>) => {
      void AsyncStorage.setItem(hiddenKey(achievementId), JSON.stringify([...next]));
    },
    [achievementId],
  );

  const resetToStart = useCallback(() => {
    setIdx(0);
    setLevel(0);
    setRevealedThisVisit(new Set());
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        // Custom List pseudo-topic (user request 2026-07-18): items = the ★
        // starred list; no server method row exists, so method-state is skipped.
        const [fetched, methodState, localStates, storedHidden, storedSections, storedShowMedia, storedShowLinks] = await Promise.all([
          flaggedMode ? fetchGlossaryItemsByIds([...getTermList('starred')]) : fetchTopicItems(achievementId),
          flaggedMode ? Promise.resolve(null) : fetchMethodState(achievementId, 'flashcards'),
          // Device-mirror for the resume merge — SIGNED-IN only (owner ruling
          // 2026-08-17): an account keeps its progress; a no-account guest is
          // factory-reset each session, so guests must NOT resume from the mirror.
          flaggedMode
            ? Promise.resolve(null)
            : supabase.auth
                .getSession()
                .then(({ data }) => (data.session ? loadLocalMethodStates(achievementId, 'flashcards') : null))
                .catch(() => null),
          AsyncStorage.getItem(hiddenKey(achievementId)),
          AsyncStorage.getItem(SECTIONS_KEY),
          AsyncStorage.getItem(SHOW_MEDIA_KEY),
          AsyncStorage.getItem(SHOW_LINKS_KEY),
        ]);
        if (!alive) return;
        if (storedShowMedia != null) setShowMedia(storedShowMedia !== '0');
        if (storedShowLinks != null) setShowLinks(storedShowLinks !== '0');
        fetched.sort((a, b) => a.term.localeCompare(b.term));
        setItems(fetched);
        // Term images — non-fatal, ungated (all roles read glossary_media);
        // empty map = text-only cards.
        // PREFETCH every image up front (Booth 2026-07-16) so fast swiping
        // shows art instantly from cache instead of streaming per card.
        void fetchTopicMedia(fetched.map((it) => it.id)).then((m) => {
          if (!alive) return;
          setMediaByItem(m);
          for (const uri of new Set(Object.values(m))) {
            Image.prefetch(uri).catch(() => {});
          }
        });
        // MERGE the device mirror over the server row (same rule the Dashboard
        // uses for display): resume must survive a server write that is slow,
        // offline-queued, or rejected — otherwise a returning user restarts at
        // card 0 despite having just studied (owner bug 2026-08-17). The merge
        // never regresses a view/known; server truth still governs the gates.
        const st = mergeItemStates(methodState?.itemStates, localStates);
        setStates(st);
        if (storedSections != null) {
          const arr = (JSON.parse(storedSections) as number[]).filter((n) => ALL_LEVELS.includes(n));
          if (arr.length) setSections(new Set(arr));
        }
        // Hidden list: persisted local choice wins; first visit seeds it from
        // the server's known flags.
        if (storedHidden != null) {
          setHidden(new Set(JSON.parse(storedHidden) as string[]));
        } else {
          setHidden(new Set(Object.keys(st).filter((k) => !k.startsWith('_') && st[k]?.known)));
        }
      } catch {
        if (alive) setError('Could not load this topic. Check your connection.');
      }
    })();

    // No server study session for the Flagged pseudo-topic (no achievement row
    // to write against) — review there is local-only by design (Booth 2026-07-18).
    if (flaggedMode) {
      return () => {
        alive = false;
      };
    }
    const s = new StudySession(achievementId, 'flashcards', () => {});
    s.start();
    session.current = s;
    return () => {
      alive = false;
      void s.stop();
      session.current = null;
    };
  }, [achievementId, flaggedMode]);

  // Mirror progress to the device so the Dashboard reflects it immediately,
  // even before the server write lands (Booth 2026-07-15).
  useEffect(() => {
    if (flaggedMode) return; // pseudo-topic: nothing to mirror
    if (Object.keys(states).length) void saveLocalMethodStates(achievementId, 'flashcards', states);
  }, [states, achievementId, flaggedMode]);

  // Deck = local study ORDER/visibility only; the progress denominator is
  // always all topic items (integrity invariant).
  const deck = useMemo(() => {
    if (!items) return [];
    const filtered = items.filter((it) => {
      // View chips are a UNION (Booth 2026-07-08 fix): KNOWN+FLAGGED lit
      // together = cards that are known OR flagged. Neither lit = the normal
      // deck (known-hidden cards excluded). UNSEEN further narrows to cards
      // never viewed (the ones still needed to reach 100%).
      const inView =
        showKnown || bookmarkedOnly || starredOnly
          ? (showKnown && (hidden.has(it.id) || knownList.has(it.id))) ||
            (bookmarkedOnly && bookmarked.has(it.id)) ||
            (starredOnly && starred.has(it.id))
          : !hidden.has(it.id);
      return (
        inView &&
        (diffSel.size === 0 || diffSel.has(it.difficulty as Difficulty))
      );
    });
    return orderMode === 'shuffle' ? seededShuffle(filtered, shuffleNonce) : filtered; // items pre-sorted A–Z
  }, [items, hidden, bookmarked, starred, knownList, showKnown, diffSel, bookmarkedOnly, starredOnly, orderMode, shuffleNonce]);

  const card = deck[Math.min(idx, Math.max(0, deck.length - 1))];

  // Anti-quick-scroll guard (Booth 2026-07-16): a term must be ON SCREEN for
  // 1.5s before it can be marked known or flagged — rapid swipe-tagging no-ops.
  const cardShownAt = useRef(Date.now());
  useEffect(() => {
    cardShownAt.current = Date.now();
  }, [card?.id]);
  const dwellOk = () => Date.now() - cardShownAt.current >= 1500;

  // Long-press a filter chip → the full term list for that filter's set.
  const openTermList = useCallback((title: string, key: TermListSelKey) => {
    setTermList({ title, key });
  }, []);

  // Dev Visual Index: auto-open a popup for preview (TEMPORARY).
  useEffect(() => {
    if (consumeDevPreview('flashcards:filters')) setFiltersOpen(true);
    else if (consumeDevPreview('flashcards:termlist')) openTermList('Bookmarks', 'bookmark');
  }, [openTermList]);

  // ---- Flashcard tutorials T2 (Customize) + T3 (Power Features), user request
  // 2026-07-18. T1 (Flashcards) is the on-entry ScreenIntroOverlay below. Each
  // shows once (persisted), or every time under the dev "alwaysShowIntros" flag.
  const [tutorial, setTutorial] = useState<
    null | { key: 'flashcardsCustomize' | 'flashcardsPower'; onDone?: () => void }
  >(null);
  const t2Done = useRef(false);
  const t3Done = useRef(false);
  const swipeCount = useRef(0);
  // Offer the "Customize Your Deck" tutorial at most ONCE per screen visit — the
  // swipe trigger was re-firing it every swipe past 5 (and every time under the
  // dev always-show-intros bypass), so it kept popping back up (user report
  // 2026-07-23).
  const t2Offered = useRef(false);

  useEffect(() => {
    void AsyncStorage.multiGet([
      INTRO_STORAGE_PREFIX + 'flashcardsCustomize',
      INTRO_STORAGE_PREFIX + 'flashcardsPower',
    ]).then((pairs) => {
      for (const [k, v] of pairs) {
        if (v == null) continue;
        if (k.endsWith('flashcardsPower')) t3Done.current = true;
        else t2Done.current = true;
      }
    });
  }, []);

  const showTutorial = useCallback(
    (key: 'flashcardsCustomize' | 'flashcardsPower', onDone?: () => void) => {
      setTutorial((cur) => (cur ? cur : { key, onDone }));
      if (key === 'flashcardsPower') t3Done.current = true;
      else t2Done.current = true;
      if (!devBypass('alwaysShowIntros')) void AsyncStorage.setItem(INTRO_STORAGE_PREFIX + key, '1');
    },
    [],
  );
  const showTutorialRef = useRef(showTutorial);
  showTutorialRef.current = showTutorial;

  const dismissTutorial = useCallback(() => {
    setTutorial((cur) => {
      cur?.onDone?.();
      return null;
    });
  }, []);

  // T3 opened via a category long-press: show the tutorial first, then continue
  // to the list the user was reaching for. Otherwise open the list directly.
  const handleChipLongPress = useCallback(
    (title: string, key: TermListSelKey) => {
      if (devBypass('alwaysShowIntros') || !t3Done.current) {
        showTutorial('flashcardsPower', () => openTermList(title, key));
      } else {
        openTermList(title, key);
      }
    },
    [showTutorial, openTermList],
  );

  // T3 timed fallback (~45s) if long-press hasn't been discovered.
  useEffect(() => {
    const t = setTimeout(() => {
      if (devBypass('alwaysShowIntros') || !t3Done.current) showTutorialRef.current('flashcardsPower');
    }, 45000);
    return () => clearTimeout(t);
  }, []);

  // Term name lookup for the loaded deck.
  const itemsById = useMemo(
    () => new Map((items ?? []).map((it) => [it.id, it.term] as const)),
    [items],
  );

  // The union of ids a GLOBAL-list popup should show. known = per-topic
  // known-hidden cards ∪ the global ✓ list; flagged / custom are their own
  // global sets. Deck-scoped filters return null (handled below).
  const globalListIds = useMemo<Set<string> | null>(() => {
    if (!termList) return null;
    if (termList.key === 'known') return new Set<string>([...hidden, ...knownList]);
    if (termList.key === 'bookmark') return new Set<string>(bookmarked);
    if (termList.key === 'starred') return new Set<string>(starred);
    return null;
  }, [termList, hidden, knownList, bookmarked, starred]);

  // When a global-list popup opens, fetch names for members that aren't in the
  // current deck so the FULL cross-topic list renders.
  useEffect(() => {
    if (!globalListIds || globalListIds.size === 0) return;
    const missing = [...globalListIds].filter((id) => !itemsById.has(id) && !listMembers[id]);
    if (missing.length === 0) return;
    let cancelled = false;
    fetchGlossaryItemsByIds(missing)
      .then((rows) => {
        if (cancelled || rows.length === 0) return;
        setListMembers((prev) => {
          const next = { ...prev };
          for (const r of rows) next[r.id] = r.term;
          return next;
        });
      })
      .catch(() => {
        /* offline / fetch error → those rows just stay hidden */
      });
    return () => {
      cancelled = true;
    };
    // Fetch keyed on which list is open; membership changes while open only add
    // terms from THIS deck (names already local), so no refetch needed.
  }, [globalListIds, itemsById]); // eslint-disable-line react-hooks/exhaustive-deps

  // LIVE rows for the open popup — recomputed on every list change, so tagging
  // a term with the select icons shows up immediately (Booth 2026-07-18 fix).
  const termListRows = useMemo(() => {
    if (!termList) return [];
    const key = termList.key;

    // GLOBAL lists (known / flagged / custom) span every topic — build rows
    // from the full id-set, naming each via the deck or the fetched members.
    if (globalListIds) {
      const rows: { id: string; term: string }[] = [];
      globalListIds.forEach((id) => {
        const term = itemsById.get(id) ?? listMembers[id];
        if (term) rows.push({ id, term });
      });
      return rows.sort((a, b) => a.term.localeCompare(b.term));
    }

    // Deck-scoped filters (difficulty / unseen) stay within the loaded deck.
    if (!items) return [];
    const isUnseen = (id: string) => {
      const s = states[id];
      return !s || ((s.views ?? 0) === 0 && !s.known);
    };
    let sel = items;
    if (key === 'beginner' || key === 'intermediate' || key === 'advanced')
      sel = items.filter((it) => it.difficulty === key);
    else if (key === 'unseen') sel = items.filter((it) => isUnseen(it.id));
    return [...sel]
      .map((it) => ({ id: it.id, term: it.term }))
      .sort((a, b) => a.term.localeCompare(b.term));
  }, [termList, globalListIds, itemsById, listMembers, items, states]);

  // ---- In-definition glossary term links (Booth 2026-07-18) ----
  // Terms of THIS topic appearing inside a definition are highlighted and
  // tappable → that term's full-screen definition (linkedTerm overlay).
  // Matching is scoped to the loaded deck universe (this topic / the flagged
  // list) — a whole-glossary index (14k+ terms) is deliberately not fetched.
  const termIndex = useMemo(() => {
    const m = new Map<string, GlossaryItem>();
    for (const it of items ?? []) m.set(it.term.toLowerCase(), it);
    return m;
  }, [items]);
  const linkRegex = useMemo(() => {
    if (!items || items.length === 0) return null;
    const names = items
      .map((it) => it.term)
      .sort((a, b) => b.length - a.length) // longest-first so multiword terms win
      .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    return new RegExp(`\\b(${names.join('|')})\\b`, 'gi');
  }, [items]);

  /** Definition text with in-glossary terms as tappable highlighted links. */
  const renderLinked = useCallback(
    (text: string, currentId: string) => {
      if (!linkRegex || !showLinks) return text;
      const parts: (string | ReactElement)[] = [];
      let last = 0;
      let k = 0;
      linkRegex.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = linkRegex.exec(text))) {
        const hit = termIndex.get(m[1].toLowerCase());
        if (!hit || hit.id === currentId) continue; // own term stays plain
        if (m.index > last) parts.push(text.slice(last, m.index));
        const item = hit;
        // A linked glossary term is ONE blue definition link — no blue/purple
        // calculator split outside the glossary (owner 2026-08-17: the dual-role
        // split belongs to the glossary screen alone).
        parts.push(
          <Text key={`lnk-${k++}`} style={styles.termLink} onPress={() => setLinkedTerm(item)}>
            {m[0]}
          </Text>,
        );
        last = m.index + m[0].length;
      }
      if (parts.length === 0) return text;
      parts.push(text.slice(last));
      return parts;
    },
    [linkRegex, termIndex, navigation, showLinks],
  );

  // Ordered subset of levels the user chose to see on reveal (never empty).
  const enabledLevels = useMemo(() => {
    const sel = ALL_LEVELS.filter((l) => sections.has(l));
    return sel.length ? sel : [1];
  }, [sections]);

  /** Single writer for the section selection: persists + keeps the visible
   *  level valid (if the shown section was just turned off, jump to the first
   *  enabled one). Empty selection is coerced back to ALL. */
  const updateSections = useCallback((next: Set<number>) => {
    const safe = next.size ? new Set(next) : new Set(ALL_LEVELS);
    setSections(safe);
    void AsyncStorage.setItem(SECTIONS_KEY, JSON.stringify([...safe]));
    setLevel((cur) => (cur !== 0 && !safe.has(cur) ? ALL_LEVELS.filter((l) => safe.has(l))[0] : cur));
  }, []);

  const toggleSection = useCallback(
    (lvl: number) => {
      const next = new Set(sections);
      if (next.has(lvl)) next.delete(lvl);
      else next.add(lvl);
      updateSections(next); // empty → coerced back to ALL (can't hide everything)
    },
    [sections, updateSections],
  );

  /** Show/hide term images (user request 2026-07-17) — persisted device-global. */
  const toggleShowMedia = useCallback(() => {
    setShowMedia((cur) => {
      const next = !cur;
      void AsyncStorage.setItem(SHOW_MEDIA_KEY, next ? '1' : '0');
      return next;
    });
  }, []);

  /** Show/hide the in-definition glossary links — persisted device-global, so
   *  toggling on one card applies to every definition (owner 2026-08-13). */
  const toggleLinks = useCallback(() => {
    setShowLinks((cur) => {
      const next = !cur;
      void AsyncStorage.setItem(SHOW_LINKS_KEY, next ? '1' : '0');
      return next;
    });
  }, []);

  /** Per-card "Report Error" affordance (owner 2026-08-13): behaves like every
   *  other feedback point — opens the mail composer pre-filled, carrying enough
   *  locating data (term + id, topic + id, method, which section) to hunt the
   *  content down. The user reviews and sends. */
  const reportError = useCallback(
    (termId: string, term: string, section: string) => {
      sendFeedback('correction', term, {
        Method: 'Flashcards',
        Topic: topicName,
        'Topic ID': achievementId,
        'Term ID': termId,
        Section: section,
      });
    },
    [achievementId, topicName],
  );

  /** Toggle the current card on the SHARED bookmark list (user request
   *  2026-07-18) — same list as the Glossary bookmark. */
  const toggleBookmarkTerm = useCallback(() => {
    if (!card) return;
    if (!dwellOk()) return; // 1.5s dwell before tagging (Booth 2026-07-16)
    toggleBookmark(achievementId, card.id);
  }, [card]);

  /** Toggle the current card on the ★ CUSTOM LIST (starred) — so each term can
   *  be assigned to either list from the card (user request 2026-07-23). */
  const toggleStarTerm = useCallback(() => {
    if (!card) return;
    if (!dwellOk()) return;
    setInTermList('starred', card.id, !starred.has(card.id));
  }, [card, starred]);

  // A full round trip = reveal this card's definition, THEN move to another
  // card (term→definition→next term). Counted in goCard, not on reveal alone.
  const revealedCurrent = useRef(false);

  // VIEW CREDIT = the TERM being SHOWN once (owner 2026-08-11): a user who
  // already knows a term does NOT have to flip to its definition — seeing the
  // term face is enough. Fires once per card per session; the Dashboard
  // flashcards LED completes when every term has been shown at least once.
  // (Homework + quiz still gate on their own completion — this only changes
  // what counts as "seen" for flashcards.)
  const viewedThisSession = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!card || viewedThisSession.current.has(card.id)) return;
    viewedThisSession.current.add(card.id);
    session.current?.addEvent({ item: card.id, kind: 'view' });
    setStates((prev) => ({
      ...prev,
      [card.id]: { ...prev[card.id], views: (prev[card.id]?.views ?? 0) + 1 },
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card?.id]);

  // pos: swipe UP reveals the FIRST enabled section, swipe DOWN the LAST
  // (Booth 2026-07-15). The section filters shape enabledLevels, so both ends
  // respect the user's selection.
  const reveal = useCallback((pos: 'first' | 'last' = 'first') => {
    if (!card) return;
    setLevel(pos === 'first' ? enabledLevels[0] : enabledLevels[enabledLevels.length - 1]);
    revealedCurrent.current = true;
    // View credit is earned when the TERM is shown (see the effect above), so a
    // reveal only registers activity — it no longer gates completion.
    session.current?.touch();
  }, [card, enabledLevels]);

  const goCard = useCallback(
    (dir: 1 | -1) => {
      if (deck.length === 0) return;
      session.current?.touch();
      // Completed round trip: definition was revealed, now returning to a term.
      if (revealedCurrent.current) {
        coach.registerAction();
        revealedCurrent.current = false;
      }
      setIdx((i) => (i + dir + deck.length) % deck.length);
      setLevel(0);
      // T2 trigger: after ~5 swipes, offer the "Customize Your Deck" tutorial.
      swipeCount.current += 1;
      if (
        swipeCount.current >= 5 &&
        !t2Offered.current &&
        (devBypass('alwaysShowIntros') || !t2Done.current)
      ) {
        t2Offered.current = true;
        showTutorialRef.current('flashcardsCustomize');
      }
    },
    [deck.length, coach],
  );

  const onTap = useCallback(() => {
    if (!card) return;
    session.current?.touch();
    if (level === 0) reveal();
    else {
      // Advance through ONLY the enabled sections; after the LAST one, a tap
      // returns to the term (level 0) instead of looping the definition — else
      // a single-section filter feels "stuck" (Booth 2026-07-09e).
      const pos = enabledLevels.indexOf(level);
      if (pos === -1) setLevel(enabledLevels[0]);
      else if (pos >= enabledLevels.length - 1) setLevel(0);
      else setLevel(enabledLevels[pos + 1]);
    }
  }, [card, level, reveal, enabledLevels]);

  // CAROUSEL step through [term, ...definitions] with WRAP-AROUND (user request
  // 2026-07-18): full-screen swipe ↑/↓ never gets stuck at the ends — after the
  // last definition it loops back to the term and on around.
  const stepLevel = useCallback(
    (dir: 1 | -1) => {
      if (!card) return;
      const seq = [0, ...enabledLevels];
      const cur = Math.max(0, seq.indexOf(level));
      const next = seq[(cur + dir + seq.length) % seq.length];
      setLevel(next);
      if (next === 0) {
        session.current?.touch();
        return;
      }
      // Landing on a definition is activity, not the completion trigger — view
      // credit was already earned when the term was shown (effect above).
      revealedCurrent.current = true;
      session.current?.touch();
    },
    [card, level, enabledLevels],
  );

  // Full screen shows the STUDY SHEET when EITHER the sheet was opened directly
  // (reviewMode) OR the red "open study view" solo is engaged (user request
  // 2026-07-18) — both view types lock to the open-study mode.
  // Tap a term in a list popup → open its full definition right there (user
  // request 2026-07-18). Uses the loaded deck when possible, else fetches it.
  const openTermFromList = useCallback(
    async (id: string) => {
      setTermList(null);
      const local = (items ?? []).find((it) => it.id === id);
      if (local) {
        setLinkedTerm(local);
        return;
      }
      try {
        const [it] = await fetchGlossaryItemsByIds([id]);
        if (it) setLinkedTerm(it);
      } catch {
        /* offline / fetch error → no-op */
      }
    },
    [items],
  );

  const studyMode = reviewMode || soloReveal;
  const stateRef = useRef({ reveal, goCard, stepLevel, level, linkedOpen: false, reviewMode: false });
  stateRef.current = { reveal, goCard, stepLevel, level, linkedOpen: !!linkedTerm, reviewMode: studyMode };

  const pan = useRef(
    PanResponder.create({
      // Vertical gestures are claimed ONLY on the term side (swipe ↑ = reveal).
      // On definition views the vertical axis belongs to the text ScrollView —
      // claiming it there froze long-definition scrolling (bug 2026-07-08).
      onMoveShouldSetPanResponder: (_e, g) => {
        // Linked-term viewer open: the deck must NOT move underneath it —
        // closing has to return to the exact card (Booth 2026-07-18).
        if (stateRef.current.linkedOpen) return false;
        const horizontal = Math.abs(g.dx) > 16 && Math.abs(g.dx) > Math.abs(g.dy) * 1.2;
        const vertical = Math.abs(g.dy) > 16 && stateRef.current.level === 0;
        return horizontal || vertical;
      },
      onPanResponderRelease: (_e, g) => {
        const { reveal, goCard, level } = stateRef.current;
        if (Math.abs(g.dy) > Math.abs(g.dx) && level === 0) {
          // Swipe ↑ = first enabled section; swipe ↓ = LAST enabled section
          // (Booth 2026-07-15) — both honour the section filters.
          if (g.dy <= -40) reveal('first');
          else if (g.dy >= 40) reveal('last');
        } else if (g.dx <= -50) goCard(1);
        else if (g.dx >= 50) goCard(-1);
      },
    }),
  ).current;

  // Full-screen pan — LOOSER than the in-card pan (user feedback 2026-07-17:
  // full-screen swipes felt unresponsive): claims earlier, and a short drag OR
  // a quick flick is enough to change terms. Same reveal behaviour otherwise.
  const fsPan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => {
        if (stateRef.current.linkedOpen) return false;
        const horizontal = Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy);
        // In Study Sheet mode the vertical axis belongs to the sheet's own
        // ScrollView. Otherwise vertical swipes CAROUSEL through the definitions
        // at ANY level (user request 2026-07-18), so claim them regardless of
        // the current level.
        const vertical =
          !stateRef.current.reviewMode && Math.abs(g.dy) > 12 && Math.abs(g.dy) >= Math.abs(g.dx);
        return horizontal || vertical;
      },
      onPanResponderRelease: (_e, g) => {
        const { stepLevel, goCard, reviewMode } = stateRef.current;
        if (!reviewMode && Math.abs(g.dy) > Math.abs(g.dx)) {
          if (g.dy <= -24) stepLevel(1); // ↑ next definition (wraps)
          else if (g.dy >= 24) stepLevel(-1); // ↓ previous definition (wraps)
        } else if (g.dx <= -30 || (g.dx < -12 && g.vx <= -0.3)) goCard(1);
        else if (g.dx >= 30 || (g.dx > 12 && g.vx >= 0.3)) goCard(-1);
      },
    }),
  ).current;

  // Open the Study Sheet (review) full-screen, and close/exit helpers.
  const openStudySheet = useCallback(() => {
    setFiltersOpen(false);
    setReviewMode(true);
    setFullscreen(true);
  }, []);
  const closeFullscreen = useCallback(() => {
    setFullscreen(false);
    setReviewMode(false);
  }, []);

  /** Mark known = server credit (known:true) + local hide + global ✓ tag.
   *  Mark unknown = local un-hide + clear the ✓ tag ONLY — never emits
   *  known:false, so server progress cannot regress (locked model). The
   *  global ✓ list (select icons) is kept in sync both ways (Booth 2026-07-18:
   *  the button below a known card flips to MARK UNKNOWN). */
  const toggleKnown = useCallback(() => {
    if (!card) return;
    if (!dwellOk()) return; // 1.5s dwell before tagging (Booth 2026-07-16)
    const isKnown = hidden.has(card.id) || knownList.has(card.id);
    const next = new Set(hidden);
    if (isKnown) {
      next.delete(card.id); // back into the deck; server credit stays
      setInTermList('known', card.id, false);
    } else {
      next.add(card.id);
      setInTermList('known', card.id, true);
      if (!states[card.id]?.known) {
        session.current?.addEvent({ item: card.id, kind: 'known', value: true });
        setStates((prev) => ({ ...prev, [card.id]: { ...prev[card.id], known: true } }));
      }
      if (!showKnown) {
        setLevel(0);
        setRevealedThisVisit(new Set());
        setIdx((i) => Math.max(0, Math.min(i, deck.length - 2)));
      }
    }
    setHidden(next);
    persistHidden(next);
  }, [card, hidden, knownList, states, showKnown, deck.length, persistHidden]);

  // Reconcile "known" marked in ANY popup list (TermSelectIcons → the global
  // knownList) into THIS method's progress (user request 2026-08-13): a ✓ Known in
  // the ALL / Bookmarks / Custom lists must credit the % and hit the server exactly
  // like marking known on the card. Once per term — the `!known` guard matches
  // toggleKnown, so there's no double credit.
  useEffect(() => {
    if (!items) return;
    const newly = items.filter((it) => knownList.has(it.id) && !states[it.id]?.known);
    if (newly.length === 0) return;
    for (const it of newly) session.current?.addEvent({ item: it.id, kind: 'known', value: true });
    setStates((prev) => {
      const nx = { ...prev };
      for (const it of newly) nx[it.id] = { ...nx[it.id], known: true };
      return nx;
    });
    const nextHidden = new Set(hidden);
    for (const it of newly) nextHidden.add(it.id);
    setHidden(nextHidden);
    persistHidden(nextHidden);
  }, [knownList, items, states, hidden, persistHidden]);

  // Resume where they left off (user request 2026-08-13): on FIRST load, start the
  // deck at the first still-UNSEEN card so a returning user doesn't re-cycle cards
  // they already finished — their earned % is untouched. Once; a brand-new topic
  // (all unseen) just starts at 0.
  const resumedRef = useRef(false);
  useEffect(() => {
    if (resumedRef.current || deck.length === 0) return;
    resumedRef.current = true;
    const firstUnseen = deck.findIndex((c) => {
      const s = states[c.id];
      return !s || ((s.views ?? 0) === 0 && !s.known);
    });
    if (firstUnseen > 0) setIdx(firstUnseen);
  }, [deck, states]);

  /** Reset Deck = clear the local known-hidden list AND unflag THIS DECK's
   *  terms. The flag list is now shared app-wide (Booth 2026-07-18), so reset
   *  only removes flags belonging to this topic's items — flags set elsewhere
   *  (other topics / the glossary) are untouched. Earned progress is untouched
   *  — known:false is never emitted. */
  const resetDeck = useCallback(() => {
    const deckFlagIds = (items ?? []).map((it) => it.id).filter((id) => bookmarked.has(id));
    // Nothing hidden/flagged to clear → still restart the deck at card 1 so the
    // button always does something visible (was silently no-op before).
    if (hidden.size === 0 && deckFlagIds.length === 0) {
      resetToStart();
      return;
    }
    Alert.alert(
      'Reset deck?',
      `Returns ${hidden.size} known card${hidden.size === 1 ? '' : 's'} and clears ${deckFlagIds.length} flag${deckFlagIds.length === 1 ? '' : 's'} from this topic. Progress already earned is kept.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            const empty = new Set<string>();
            setHidden(empty);
            persistHidden(empty);
            removeBookmarks(achievementId, deckFlagIds);
            resetToStart();
          },
        },
      ],
    );
  }, [hidden, bookmarked, items, persistHidden, resetToStart]);

  // ---- Full-screen guide + shake-to-known (Booth 2026-07-11) ----
  useEffect(() => {
    AsyncStorage.getItem('ape:fcFsGuide').then((v) => {
      if (v) fsGuideCount.current = Number(v) || 0;
    });
  }, []);
  useEffect(() => {
    if (fullscreen) fsReviewed.current = 0;
  }, [fullscreen]);
  useEffect(() => {
    if (!fullscreen) return;
    fsReviewed.current += 1;
    // DEV BYPASS (Booth 2026-07-18): guide shows every time, counter untouched.
    const alwaysIntro = devBypass('alwaysShowIntros');
    // The guide's "tap to flip" copy doesn't apply to the Study Sheet — skip it there.
    if (!studyMode && fsReviewed.current === 2 && (alwaysIntro || fsGuideCount.current < 2)) {
      setShowFsGuide(true);
      if (!alwaysIntro) {
        fsGuideCount.current += 1;
        void AsyncStorage.setItem('ape:fcFsGuide', String(fsGuideCount.current));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);
  // Shake to mark the current card KNOWN, in full screen only. No-ops until a
  // build includes expo-sensors (flagged).
  useShake(() => {
    if (card) toggleKnown();
  }, fullscreen);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <View style={{ width: 180 }}>
          <StudioButton label="Back" variant="secondary" small onPress={() => navigation.goBack()} />
        </View>
      </View>
    );
  }
  if (!items) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.amber} />
      </View>
    );
  }

  const displayPct = Math.round(studyDisplayPct(states, items.length, 'flashcards'));

  return (
    <View style={[styles.root, { paddingTop: insets.top }]} {...pan.panHandlers}>
      <View style={styles.body}>
        {/* No pace timer on Flashcards (owner 2026-08-13) — the pace timer is a
            HOMEWORK-method aid (Fill-in-Blank / Matching / Scenarios). */}
        <StudyHeader
          method="flashcards"
          title="FLASHCARDS"
          subtitle={`Topic · ${topicName}`}
        />

        <View style={styles.ledRow}>
          <View style={{ flex: 1 }}>
            <LedMeterWell filled={segmentsForPct(displayPct)} />
          </View>
          <Text style={styles.ledPct}>{displayPct}%</Text>
          <Text style={styles.counter}>
            {deck.length === 0 ? 0 : Math.min(idx, deck.length - 1) + 1} / {deck.length}
          </Text>
          {/* Session-timer countdown, when running and set to show (owner 2026-08-13). */}
          <SessionTimerPill timer={sessionTimer} />
        </View>

        {/* Filter rows (Booth 2026-07-08):
            row 1 — ALL · A–Z · SHUFFLE · RESET DECK
            row 2 — BEG · INT · ADV · KNOWN · FLAGGED
            BEG/INT/ADV multi-select (empty = ALL); A–Z/SHUFFLE order the
            visible set; RESET DECK returns known cards + clears flags. */}
        <View style={styles.filterRow}>
          <FilterChip
            label="ALL"
            active={diffSel.size === 0}
            onPress={() => { setDiffSel(new Set()); resetToStart(); }}
            onLongPress={() => handleChipLongPress('All terms', 'all')}
          />
          <FilterChip label="A–Z" active={orderMode === 'az'} onPress={() => { setOrderMode('az'); resetToStart(); }} />
          <FilterChip
            label="Shuffle"
            active={orderMode === 'shuffle'}
            icon={(c) => <ShuffleIcon color={c} />}
            onPress={() => {
              setOrderMode('shuffle');
              setShuffleNonce((n) => n + 1); // re-press = fresh shuffle
              resetToStart();
            }}
          />
          <FilterChip
            label="Reset deck"
            icon={(c) => <ResetIcon color={c} />}
            active={false}
            onPress={resetDeck}
          />
          {/* Reveal SOLO (user request 2026-07-18): red eye button — shows the
              term + primary definition together (open study view). While ON it
              overrides the reveal filters, so the FILTERS chip is locked out
              until this is cleared, like a mixer solo. */}
          <Pressable
            style={[styles.soloBtn, soloReveal && styles.soloBtnOn]}
            onPress={() => setSoloReveal((v) => !v)}
            accessibilityRole="button"
            accessibilityState={{ selected: soloReveal }}
            accessibilityLabel={soloReveal ? 'Close study view' : 'Open study view (show definition)'}
          >
            {/* Lit red only when active; neutral grey when off (user request 2026-07-18). */}
            {/* Selected → whole eye red + full-brightness pupil; unselected →
                gray eye with a 50%-brightness red pupil (user request 2026-07-24). */}
            <EyeIcon color={soloReveal ? '#ff5b52' : '#8a8c90'} pupil={soloReveal ? '#ff5b52' : '#7f2d29'} />
          </Pressable>
          <FilterChip
            label="FILTER"
            active={sections.size < ALL_LEVELS.length || !showMedia}
            activeTint="blue"
            disabled={soloReveal}
            onPress={() => setFiltersOpen(true)}
          />
          {/* Full-screen mode — green icon button, right of FILTER (user request
              2026-07-24, moved back here from the card corner). */}
          <Pressable
            style={styles.fsBtn}
            onPress={() => setFullscreen(true)}
            accessibilityRole="button"
            accessibilityLabel="Full screen"
          >
            <FullscreenIcon color={colors.green} />
          </Pressable>
        </View>
        <View style={styles.filterRow}>
          {(['beginner', 'intermediate', 'advanced'] as Difficulty[]).map((d) => (
            <FilterChip
              key={d}
              label={d === 'beginner' ? 'BEG' : d === 'intermediate' ? 'INT' : 'ADV'}
              active={diffSel.has(d)}
              onPress={() => {
                setDiffSel((prev) => {
                  const next = new Set(prev);
                  if (next.has(d)) next.delete(d);
                  else next.add(d);
                  return next;
                });
                resetToStart();
              }}
              onLongPress={() => handleChipLongPress(d === 'beginner' ? 'Beginner' : d === 'intermediate' ? 'Intermediate' : 'Advanced', d)}
            />
          ))}
          <FilterChip
            label="KNOWN"
            active={showKnown}
            activeTint="green"
            onPress={() => { setShowKnown((v) => !v); resetToStart(); }}
            onLongPress={() => handleChipLongPress('Known terms', 'known')}
          />
          {/* Icon-only BOOKMARK chip (user request 2026-07-18 — replaces the ⚑
              flag). Filters the deck to bookmarked terms; hold shows the list. */}
          <FilterChip
            label="Bookmarks"
            icon={(c) => <BookmarkIcon color={c} filled={bookmarkedOnly} />}
            active={bookmarkedOnly}
            activeTint="purple"
            onPress={() => { setBookmarkedOnly((v) => !v); resetToStart(); }}
            onLongPress={() => handleChipLongPress('Bookmarks', 'bookmark')}
          />
          {/* The 3-card deck = the user's CUSTOM LIST (user request 2026-07-24,
              replacing the old ★ symbol). */}
          <FilterChip
            label="Custom list"
            icon={(c) => <DeckIcon color={c} size={17} fill={starredOnly ? `${c}33` : 'none'} />}
            active={starredOnly}
            activeTint="blue"
            onPress={() => { setStarredOnly((v) => !v); resetToStart(); }}
            onLongPress={() => handleChipLongPress('Custom list', 'starred')}
          />
          {/* Session timer (blue clock) — right of Custom list; opens the length
              picker (owner 2026-08-13). */}
          <SessionTimerButton active={sessionTimer.running} onPress={sessionTimer.openConfig} />
        </View>

        <View style={styles.cardZone}>
          {card ? (
            // 850ms hold to open full screen (user request 2026-07-17: +0.5s
            // over the previous 350ms) so a normal read-hold doesn't trigger it.
            <Pressable
              onPress={soloReveal ? undefined : onTap}
              onLongPress={() => setFullscreen(true)}
              delayLongPress={850}
              style={{ flex: 1 }}
            >
              <View style={[styles.card, soloReveal && styles.cardSolo]}>
                {/* Bookmark toggle on the card (user request 2026-07-18) —
                    same shared list as the Glossary bookmark. */}
                <Pressable
                  style={styles.cardFlag}
                  onPress={toggleBookmarkTerm}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel={bookmarked.has(card.id) ? 'Remove bookmark' : 'Bookmark term'}
                >
                  <BookmarkIcon
                    color={bookmarked.has(card.id) ? colors.purple : colors.textMuted}
                    filled={bookmarked.has(card.id)}
                    size={20}
                  />
                </Pressable>
                {/* ★ custom-list toggle next to the bookmark, so a term can go on
                    either list (user request 2026-07-23). */}
                <Pressable
                  style={styles.cardStar}
                  onPress={toggleStarTerm}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel={starred.has(card.id) ? 'Remove from custom list' : 'Add to custom list'}
                >
                  <DeckIcon
                    color={starred.has(card.id) ? colors.blue : colors.textMuted}
                    size={21}
                    fill={starred.has(card.id) ? 'rgba(47,155,255,0.22)' : 'none'}
                  />
                </Pressable>
                {/* Glossary-link show/hide toggle, LEFT of the custom-list icon
                    (owner 2026-08-13). Global across every definition; default ON. */}
                <Pressable
                  style={styles.cardLink}
                  onPress={toggleLinks}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel={showLinks ? 'Hide glossary links' : 'Show glossary links'}
                >
                  <LinkIcon size={20} color={showLinks ? colors.blue : colors.textMuted} off={!showLinks} />
                </Pressable>
                {isHazardTerm(card.term) ? (
                  <View style={{ marginBottom: 10 }}>
                    <CautionBadge compact />
                  </View>
                ) : null}
                {soloReveal ? (
                  // Open study view: term + primary DEFINITION together.
                  <>
                    <Text style={styles.levelTerm}>{card.term}</Text>
                    <Text style={styles.levelEyebrow}>{LEVEL_LABELS[0]}</Text>
                    <ScrollView
                      style={{ flex: 1 }}
                      contentContainerStyle={{ paddingBottom: 4 }}
                      showsVerticalScrollIndicator
                      nestedScrollEnabled
                    >
                      <Text style={styles.levelBody}>{renderLinked(levelText(card, 1), card.id)}</Text>
                    </ScrollView>
                  </>
                ) : level === 0 ? (
                  <>
                    {/* Term image (when the term has one) with the title below
                        it — one group, centered both ways (Booth 2026-07-16). */}
                    <View style={styles.termWrap}>
                      {showMedia && mediaByItem[card.id] && !badImages.has(card.id) ? (
                        <Image
                          source={{ uri: mediaByItem[card.id] }}
                          style={styles.termImage}
                          resizeMode="contain"
                          accessibilityLabel={`${card.term} image`}
                          onError={() =>
                            setBadImages((prev) => new Set(prev).add(card.id))
                          }
                        />
                      ) : null}
                      <Text style={styles.term}>{card.term}</Text>
                    </View>
                    {coach.visible && (
                      <Text style={styles.hint} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
                        Tap to see definitions  ·  Swipe to change terms
                      </Text>
                    )}
                  </>
                ) : (
                  <>
                    {/* Term name intentionally omitted here (user request
                        2026-07-24) — in regular flip mode only the definition
                        shows; the term + definition appear together only in the
                        eyeball SOLO view. */}
                    <Text style={styles.levelEyebrow}>{LEVEL_LABELS[level - 1]}</Text>
                    {/* Long definitions scroll INSIDE the card instead of
                        running under the footer buttons (Booth 2026-07-08). */}
                    <ScrollView
                      style={{ flex: 1 }}
                      contentContainerStyle={{ paddingBottom: 4 }}
                      showsVerticalScrollIndicator
                      nestedScrollEnabled
                    >
                      {/* In-deck glossary terms inside the text are tappable
                          links to their full-screen definition (2026-07-18). */}
                      <Text style={styles.levelBody}>{renderLinked(levelText(card, level), card.id)}</Text>
                    </ScrollView>
                    {coach.visible && (
                      <Text style={styles.hint} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
                        Tap to see definitions  ·  Swipe to change terms
                      </Text>
                    )}
                  </>
                )}
                {/* Subtle error-report affordance, bottom-right of the card
                    (owner 2026-08-13). Small, low-contrast text. */}
                <Pressable
                  style={styles.cardReport}
                  onPress={() =>
                    reportError(
                      card.id,
                      card.term,
                      soloReveal ? LEVEL_LABELS[0] : level === 0 ? 'TERM' : LEVEL_LABELS[level - 1],
                    )
                  }
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={`Suggest a correction for ${card.term}`}
                >
                  <Text style={styles.cardReportText}>Suggest a correction</Text>
                </Pressable>
              </View>
            </Pressable>
          ) : (
            <View style={[styles.card, { justifyContent: 'center' }]}>
              <Text style={styles.term}>No cards match</Text>
              <Text style={styles.hint}>Adjust the filter buttons above to see cards</Text>
            </View>
          )}
        </View>

        {/* Pinned controls — scribble-glass caps, tall 56px thumb targets
            (Booth 2026-07-08). Reset moved up into the filter rows. */}
        <View style={styles.footer}>
          <View style={styles.buttonRow}>
            <View style={{ flex: 1 }}>
              <GlassButton
                // Flips on a known card (Booth 2026-07-18) — was RETURN TO DECK.
                label={
                  card && (hidden.has(card.id) || knownList.has(card.id))
                    ? 'MARK UNKNOWN'
                    : 'MARK KNOWN'
                }
                tint="green"
                onPress={toggleKnown}
                disabled={!card}
              />
            </View>
            <View style={{ flex: 1 }}>
              <GlassButton
                label={card && bookmarked.has(card.id) ? 'REMOVE BOOKMARK' : 'BOOKMARK TERM'}
                tint="orange"
                onPress={toggleBookmarkTerm}
                disabled={!card}
              />
            </View>
          </View>
        </View>
      </View>

      {/* FILTERS popup — choose which definition sections appear on reveal
          (Booth 2026-07-09d). Overlays the whole screen. */}
      {filtersOpen ? (
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>SHOW ON REVEAL</Text>
            <Text style={styles.modalSub}>Pick which sections appear when you reveal a card.</Text>

            <Pressable style={styles.optRow} onPress={() => updateSections(new Set(ALL_LEVELS))}>
              <View style={[styles.checkbox, sections.size === ALL_LEVELS.length && styles.checkboxOn]}>
                {sections.size === ALL_LEVELS.length ? <Text style={styles.checkMark}>✓</Text> : null}
              </View>
              <Text style={[styles.optLabel, styles.optLabelStrong]}>All sections</Text>
            </Pressable>
            <View style={styles.optDivider} />

            {SECTION_LABELS.map((lbl, i) => {
              const lvl = i + 1;
              const on = sections.has(lvl);
              return (
                <Pressable key={lbl} style={styles.optRow} onPress={() => toggleSection(lvl)}>
                  <View style={[styles.checkbox, on && styles.checkboxOn]}>
                    {on ? <Text style={styles.checkMark}>✓</Text> : null}
                  </View>
                  <Text style={styles.optLabel}>{lbl}</Text>
                </Pressable>
              );
            })}

            {/* Show/hide term images (user request 2026-07-17) — separate from
                the reveal sections; media rides on the TERM side. */}
            <View style={styles.optDivider} />
            <Pressable style={styles.optRow} onPress={toggleShowMedia}>
              <View style={[styles.checkbox, showMedia && styles.checkboxOn]}>
                {showMedia ? <Text style={styles.checkMark}>✓</Text> : null}
              </View>
              <Text style={styles.optLabel}>Show media (images)</Text>
            </Pressable>

            {/* Study Sheet review mode (user request 2026-07-18): open a
                full-screen view showing the term AND the chosen sections above,
                together, for reading them side by side (no tap-to-flip). */}
            <View style={styles.optDivider} />
            <Pressable style={styles.sheetBtn} onPress={openStudySheet} accessibilityRole="button" accessibilityLabel="Open Study View">
              <Text style={styles.sheetBtnText}>OPEN STUDY VIEW</Text>
              <Text style={styles.sheetBtnSub}>See the term and your chosen sections together, full screen</Text>
            </Pressable>

            <View style={styles.modalActions}>
              <View style={{ flex: 1 }}>
                <StudioButton label="Reset" variant="secondary" small onPress={() => updateSections(new Set(ALL_LEVELS))} />
              </View>
              <View style={{ flex: 1 }}>
                <StudioButton label="Done" variant="primary" small onPress={() => setFiltersOpen(false)} />
              </View>
            </View>
          </View>
        </View>
      ) : null}

      {/* FULL-SCREEN distraction-free mode (Booth 2026-07-11): long-press opens
          it. Only the term / definition — no nav, no prev/next, no progress bar.
          Tap flips, swipe changes term, scroll for long text, X closes. The same
          filtered deck (card/level) is shown. */}
      <Modal visible={fullscreen} animationType="fade" onRequestClose={closeFullscreen}>
        {/* fsPan (not pan): full screen uses the looser swipe thresholds. */}
        <View style={[styles.fsRoot, { paddingTop: insets.top }]} {...fsPan.panHandlers}>
          <Pressable
            onPress={closeFullscreen}
            hitSlop={16}
            style={[styles.fsClose, { top: insets.top + 6 }]}
            accessibilityRole="button"
            accessibilityLabel="Close full screen"
          >
            <Text style={styles.fsCloseText}>✕</Text>
          </Pressable>
          {/* In Study Sheet mode tapping must NOT flip (term + sections are all
              shown at once); swipe still changes card. */}
          <Pressable onPress={studyMode ? undefined : onTap} style={styles.fsBody}>
            {card ? (
              studyMode ? (
                // STUDY SHEET: term + every chosen section together, scrollable.
                <ScrollView style={styles.fsScrollView} contentContainerStyle={styles.fsSheetScroll} showsVerticalScrollIndicator>
                  {isHazardTerm(card.term) ? (
                    <View style={{ marginBottom: 12, alignSelf: 'stretch' }}>
                      <CautionBadge />
                    </View>
                  ) : null}
                  {showMedia && mediaByItem[card.id] && !badImages.has(card.id) ? (
                    <Image
                      source={{ uri: mediaByItem[card.id] }}
                      style={styles.fsSheetImage}
                      resizeMode="contain"
                      accessibilityLabel={`${card.term} image`}
                      onError={() => setBadImages((prev) => new Set(prev).add(card.id))}
                    />
                  ) : null}
                  <Text style={styles.fsTermSmall}>{card.term}</Text>
                  {enabledLevels.map((lvl) => (
                    <View key={lvl} style={styles.fsSheetSection}>
                      <Text style={styles.linkedEyebrow}>{LEVEL_LABELS[lvl - 1]}</Text>
                      <Text style={styles.fsDef}>{renderLinked(levelText(card, lvl), card.id)}</Text>
                    </View>
                  ))}
                </ScrollView>
              ) : level === 0 ? (
                <View style={{ alignItems: 'center' }}>
                  {isHazardTerm(card.term) ? (
                    <View style={{ marginBottom: 18, alignSelf: 'stretch' }}>
                      <CautionBadge />
                    </View>
                  ) : null}
                  <Text style={styles.fsTerm}>{card.term}</Text>
                </View>
              ) : (
                <ScrollView style={styles.fsScrollView} contentContainerStyle={styles.fsScroll} showsVerticalScrollIndicator={false}>
                  {isHazardTerm(card.term) ? (
                    <View style={{ marginBottom: 16, alignSelf: 'stretch' }}>
                      <CautionBadge />
                    </View>
                  ) : null}
                  <Text style={styles.fsTermSmall}>{card.term}</Text>
                  {/* Term image in the full-screen reveal too (user request
                      2026-07-18) — it only rendered in the study sheet before. */}
                  {showMedia && mediaByItem[card.id] && !badImages.has(card.id) ? (
                    <Image
                      source={{ uri: mediaByItem[card.id] }}
                      style={styles.fsSheetImage}
                      resizeMode="contain"
                      accessibilityLabel={`${card.term} image`}
                      onError={() => setBadImages((prev) => new Set(prev).add(card.id))}
                    />
                  ) : null}
                  <Text style={styles.fsDef}>{renderLinked(levelText(card, level), card.id)}</Text>
                </ScrollView>
              )
            ) : (
              <Text style={styles.fsTerm}>No cards match</Text>
            )}
          </Pressable>

          {/* Linked-term viewer must render INSIDE this modal while it is up
              (a sibling overlay would sit beneath the native modal). */}
          {linkedTerm ? (
            <LinkedTermOverlay
              item={linkedTerm}
              topInset={insets.top}
              onClose={() => setLinkedTerm(null)}
            />
          ) : null}

          {showFsGuide && !studyMode ? (
            <View style={styles.fsGuideBackdrop}>
              <View style={styles.fsGuideCard}>
                <Text style={styles.fsGuideTitle}>FULL SCREEN</Text>
                <Text style={styles.fsGuideLine}>Tap to flip the card</Text>
                <Text style={styles.fsGuideLine}>Swipe left / right to change term</Text>
                <Text style={styles.fsGuideLine}>Shake to mark it Known</Text>
                <Text style={styles.fsGuideLine}>Tap ✕ (top-right) to exit</Text>
                <Pressable style={styles.fsGuideBtn} onPress={() => setShowFsGuide(false)}>
                  <Text style={styles.fsGuideBtnText}>GOT IT</Text>
                </Pressable>
              </View>
            </View>
          ) : null}
        </View>
        <LowLightDim />
      </Modal>

      {/* Term list — long-press a filter chip to see everything in that set. */}
      {/* animationType="none" + a virtualized FlatList so the popup appears
          INSTANTLY on tap — the old fade + render-every-row ScrollView made long
          lists (ALL, etc.) feel like nothing happened (user request 2026-08-13). */}
      <Modal visible={!!termList} transparent animationType="none" onRequestClose={() => setTermList(null)}>
        <View style={styles.tlBackdrop}>
          <Pressable
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            onPress={() => setTermList(null)}
            accessibilityRole="button"
            accessibilityLabel="Dismiss"
          />
          <View style={styles.tlCard}>
            <Text style={styles.tlTitle}>
              {termList?.title} · {termListRows.length}
            </Text>
            {termListRows.length > 0 ? (
              <FlatList
                style={{ flexGrow: 0 }}
                data={termListRows}
                keyExtractor={(r) => r.id}
                showsVerticalScrollIndicator
                initialNumToRender={14}
                windowSize={7}
                removeClippedSubviews
                renderItem={({ item: r }) => (
                  <View style={styles.tlRow}>
                    {/* Tap the term → open its definition (user request 2026-07-18). */}
                    <Pressable
                      style={{ flex: 1 }}
                      onPress={() => openTermFromList(r.id)}
                      accessibilityRole="button"
                      accessibilityLabel={`Open ${r.term}`}
                    >
                      <Text
                        style={[
                          styles.tlItem,
                          styles.tlItemLink,
                          termList?.key === 'bookmark' && { color: '#b45bff' },
                          termList?.key === 'starred' && { color: '#2f9bff' },
                        ]}
                        numberOfLines={1}
                      >
                        {r.term} ›
                      </Text>
                    </Pressable>
                    {/* Select icons (Booth 2026-07-18): tag this term into the
                        user's flagged/heart/notify/known lists. */}
                    <TermSelectIcons id={r.id} bookmarkCtx={achievementId} />
                  </View>
                )}
              />
            ) : (
              <Text style={styles.tlEmpty}>No terms in this set.</Text>
            )}
            <Pressable style={styles.tlClose} onPress={() => setTermList(null)}>
              <Text style={styles.tlCloseText}>CLOSE</Text>
            </Pressable>
          </View>
        </View>
        <LowLightDim />
      </Modal>

      {/* Linked-term viewer for the normal (non-fullscreen) card view. */}
      {linkedTerm && !fullscreen ? (
        <LinkedTermOverlay
          item={linkedTerm}
          topInset={insets.top}
          onClose={() => setLinkedTerm(null)}
        />
      ) : null}

      {/* T1 on entry; T2/T3 fire on the triggers above. */}
      <ScreenIntroOverlay introKey="flashcards" />
      {tutorial ? <IntroSheet introKey={tutorial.key} onDismiss={dismissTutorial} /> : null}

      {/* Session timer: length picker + expiry banner (owner 2026-08-13). */}
      <SessionTimerModal timer={sessionTimer} />
      <SessionTimerBanner timer={sessionTimer} />

    </View>
  );
}

/**
 * Full-screen definition for a term tapped INSIDE another definition (Booth
 * 2026-07-18). A plain absolute overlay (not a Modal) so it can also sit on
 * top of the full-screen study modal. Closing changes no deck state, so the
 * user lands back on the exact card/level they were on.
 */
function LinkedTermOverlay({
  item,
  topInset,
  onClose,
}: {
  item: GlossaryItem;
  topInset: number;
  onClose: () => void;
}) {
  // Resolve the TOPIC(s) this external term belongs to (owner 2026-08-06).
  const [topics, setTopics] = useState<string[]>([]);
  useEffect(() => {
    let alive = true;
    setTopics([]);
    void fetchTermTopicNames(item.id).then((names) => {
      if (alive) setTopics(names);
    });
    return () => {
      alive = false;
    };
  }, [item.id]);
  return (
    <View style={[styles.linkedRoot, { paddingTop: topInset }]}>
      <Pressable
        onPress={onClose}
        hitSlop={16}
        style={[styles.fsClose, { top: topInset + 6 }]}
        accessibilityRole="button"
        accessibilityLabel="Close term definition"
      >
        <Text style={styles.fsCloseText}>✕</Text>
      </Pressable>
      <ScrollView contentContainerStyle={styles.fsScroll} showsVerticalScrollIndicator={false}>
        {isHazardTerm(item.term) ? (
          <View style={{ marginBottom: 16, alignSelf: 'stretch' }}>
            <CautionBadge />
          </View>
        ) : null}
        <Text style={styles.fsTermSmall}>{item.term}</Text>
        {topics.length ? (
          <>
            <Text style={styles.linkedEyebrow}>{topics.length > 1 ? 'TOPICS' : 'TOPIC'}</Text>
            <Text style={styles.fsDef}>{topics.join(' · ')}</Text>
          </>
        ) : null}
        <Text style={styles.linkedEyebrow}>DEFINITION</Text>
        <Text style={styles.fsDef}>{item.definition}</Text>
        {item.plain_english ? (
          <>
            <Text style={styles.linkedEyebrow}>PLAIN ENGLISH</Text>
            <Text style={styles.fsDef}>{item.plain_english}</Text>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  // Full-screen distraction-free mode.
  fsRoot: { flex: 1, backgroundColor: '#0a0a0b' },
  fsClose: { position: 'absolute', right: 16, zIndex: 2, padding: 8 },
  fsCloseText: { fontFamily: fonts.oswaldSemiBold, fontSize: 24, color: '#c8c8c8' },
  fsBody: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  // A ScrollView needs a BOUNDED height to scroll — stretch it to fill fsBody
  // (fix 2026-07-18: long study-view content ran off-screen with no scroll).
  fsScrollView: { flex: 1, alignSelf: 'stretch', width: '100%' },
  fsScroll: { flexGrow: 1, justifyContent: 'center', paddingVertical: 48, alignItems: 'center' },
  // Study Sheet (review mode): term + every chosen section, top-aligned scroll.
  fsSheetScroll: { paddingVertical: 44, paddingBottom: 72, alignItems: 'center', gap: 18 },
  fsSheetImage: { width: '86%', height: 180, borderRadius: 12, marginBottom: 2 },
  fsSheetSection: { alignSelf: 'stretch', gap: 6 },
  // Full-screen icon button in the filter row.
  fsBtn: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    backgroundColor: '#141414',
  },
  fsBtnIcon: { fontSize: 18, color: '#7fbfff' },
  // Reveal SOLO eye button (user request 2026-07-18) — neutral when OFF, lit
  // red only when engaged, like an audio solo lighting up.
  soloBtn: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    backgroundColor: '#161616',
  },
  soloBtnOn: { borderColor: '#ff6a5e', backgroundColor: '#2a1210' },
  // The card wears a red frame while the reveal solo is engaged.
  cardSolo: { borderColor: 'rgba(255,106,94,.75)' },
  // First-run guide overlay.
  fsGuideBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.72)', alignItems: 'center', justifyContent: 'center', padding: 28 },
  fsGuideCard: { backgroundColor: '#16171a', borderRadius: 14, borderWidth: 1, borderColor: '#2c2d31', padding: 22, gap: 8, width: '100%', maxWidth: 340 },
  fsGuideTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 2, color: colors.amber, marginBottom: 4 },
  fsGuideLine: { fontFamily: fonts.barlowRegular, fontSize: 15, lineHeight: 22, color: colors.textSecondary },
  fsGuideBtn: { marginTop: 12, backgroundColor: '#1d1607', borderWidth: 1, borderColor: 'rgba(255,180,0,.5)', borderRadius: 8, paddingVertical: 11, alignItems: 'center' },
  fsGuideBtnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.4, color: colors.amber },
  // Term-list overlay (long-press a filter chip).
  tlBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  // maxHeight keeps long lists on-screen; the ScrollView inside owns the drag.
  tlCard: { width: '100%', maxWidth: 400, maxHeight: '78%', backgroundColor: '#161719', borderRadius: 14, borderWidth: 1, borderColor: '#2c2d31', padding: 18 },
  tlTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.4, color: colors.amber, marginBottom: 10 },
  tlItem: { fontFamily: fonts.barlowRegular, fontSize: 15, lineHeight: 26, color: colors.textSecondary },
  // Tappable term in a list popup (user request 2026-07-18).
  tlItemLink: { color: '#7fbfff' },
  // Term-list row: name + the ⚑ ♥ ★ ✓ ✗ select icons (Booth 2026-07-18).
  tlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#202022',
    paddingVertical: 2,
  },
  tlEmpty: { fontFamily: fonts.barlowRegular, fontStyle: 'italic', fontSize: 14, color: colors.textMuted },
  tlClose: { marginTop: 12, alignItems: 'center', paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#3a3a3a' },
  tlCloseText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.4, color: colors.textSubAlt },
  fsTerm: { fontFamily: fonts.oswaldMedium, fontSize: 36, letterSpacing: 0.5, color: colors.textPrimary, textAlign: 'center' },
  fsTermSmall: { fontFamily: fonts.oswaldMedium, fontSize: 25, color: colors.amber, textAlign: 'center', marginBottom: 16 },
  fsDef: { fontFamily: fonts.barlowMedium, fontSize: 22, lineHeight: 34, color: colors.textSecondary, textAlign: 'center' },
  center: { flex: 1, backgroundColor: colors.screenBg, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  errorText: { fontFamily: fonts.barlowRegular, fontSize: 14, color: colors.textSub, textAlign: 'center' },
  body: { flex: 1, padding: 16, gap: 12 },

  ledRow: { flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'stretch' },
  ledPct: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, color: colors.amber, minWidth: 44, textAlign: 'right' },

  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

  cardZone: { flex: 1 },
  card: {
    flex: 1,
    backgroundColor: '#1b1b1b',
    borderWidth: 1,
    borderColor: colors.deepBorder,
    borderRadius: 10,
    // A bit more inset so the term title/text clear all four corner icons, with
    // extra headroom up top before the term title (user request 2026-07-24).
    padding: 24,
    paddingTop: 32,
    gap: 12,
  },
  // Card flag star (Booth 2026-07-18) — mirrors the Glossary's star.
  cardFlag: { position: 'absolute', top: 8, right: 10, zIndex: 2 },
  // Top-left corner, tops aligned with the bookmark/custom icons on the right
  // (user request 2026-07-24) — pulled up and out so it clears the term title.
  cardFsBtn: { position: 'absolute', top: 6, left: 8, zIndex: 3 },
  // ★ custom-list toggle, sitting just left of the bookmark (user request 2026-07-23).
  cardStar: { position: 'absolute', top: 6, right: 40, zIndex: 2 },
  cardStarText: { fontSize: 21, lineHeight: 23, color: colors.textMuted },
  // Glossary-links toggle, one slot left of the custom-list icon (owner 2026-08-13).
  cardLink: { position: 'absolute', top: 7, right: 70, zIndex: 2 },
  // Subtle bottom-right "Report Error" text button (owner 2026-08-13).
  cardReport: { position: 'absolute', bottom: 6, right: 10, zIndex: 2, paddingVertical: 2, paddingHorizontal: 2 },
  cardReportText: {
    fontFamily: fonts.oswaldMedium,
    fontSize: 10,
    letterSpacing: 0.3,
    color: 'rgba(255,255,255,0.28)',
  },
  cardStarOn: { color: colors.amber },
  cardFlagStar: { fontSize: 20, color: colors.textMuted },
  cardFlagStarOn: {
    color: colors.amber,
    textShadowColor: 'rgba(255,180,0,.5)',
    textShadowRadius: 7,
    textShadowOffset: { width: 0, height: 0 },
  },
  pilotDot: {
    position: 'absolute',
    top: 7,
    left: 7,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#4a4a4a',
    borderWidth: 1,
    borderColor: '#222222',
  },
  // Image + title render as one centered group (Booth 2026-07-16).
  termWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  termImage: { width: '88%', height: 190, borderRadius: 12 },
  // Larger body copy for the available card real estate (Booth 2026-07-08).
  // Sizes chosen so typical single audio terms still fit one line (no
  // mid-word breaks); multi-word terms wrap at spaces.
  term: { textAlign: 'center', fontFamily: fonts.oswaldMedium, fontSize: 29, letterSpacing: 0.7, color: colors.textPrimary },
  levelTerm: {
    fontFamily: fonts.oswaldMedium,
    fontSize: 21,
    letterSpacing: 0.6,
    color: colors.amber,
    textShadowColor: 'rgba(255,180,0,.35)',
    textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 0 },
  },
  levelEyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.8, color: colors.amberLabel },
  levelBody: { fontFamily: fonts.barlowRegular, fontSize: 21, lineHeight: 33, color: colors.textSecondary },
  // In-definition glossary term link (Booth 2026-07-18) — glossary blue,
  // underlined, tappable → LinkedTermOverlay.
  termLink: { color: '#7fbfff', textDecorationLine: 'underline' },
  // Right half of a split dual-role word (owner 2026-08-10) — calculator purple.
  // Linked-term full-screen viewer (absolute overlay, not a Modal, so it can
  // cover the full-screen study modal too).
  linkedRoot: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
    backgroundColor: '#0a0a0b',
    paddingHorizontal: 28,
  },
  linkedEyebrow: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 12,
    letterSpacing: 1.8,
    color: colors.amberLabel,
    textAlign: 'center',
    marginTop: 18,
    marginBottom: 8,
  },
  hint: { textAlign: 'center', fontFamily: fonts.barlowCondensedRegular, fontSize: 14, color: '#8a8a8a' },

  footer: { gap: 10 },
  counter: { fontFamily: fonts.mono, fontSize: 12, color: colors.textSubAlt, minWidth: 56, textAlign: 'right' },
  buttonRow: { flexDirection: 'row', gap: 10 },

  // FILTERS popup (Booth 2026-07-09d).
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.74)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#151515',
    borderWidth: 1,
    borderColor: colors.deepBorder,
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, letterSpacing: 1.6, color: '#7fbfff' },
  modalSub: { fontFamily: fonts.barlowRegular, fontSize: 13, color: colors.textSub, marginTop: 4, marginBottom: 6 },
  optRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#4a4a4a',
    backgroundColor: '#0e0e0e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { borderColor: 'rgba(47,155,255,.9)', backgroundColor: 'rgba(47,155,255,.18)' },
  checkMark: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, color: '#7fbfff' },
  optLabel: { fontFamily: fonts.barlowRegular, fontSize: 16, color: colors.textSecondary },
  optLabelStrong: { fontFamily: fonts.oswaldSemiBold, letterSpacing: 0.5, color: colors.textPrimary },
  optDivider: { height: 1, backgroundColor: '#2a2a2a', marginVertical: 4 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  // "Open Study Sheet" button in the FILTERS popup (user request 2026-07-18).
  sheetBtn: {
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(47,155,255,.6)',
    backgroundColor: '#0e2033',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 3,
    marginTop: 4,
  },
  sheetBtnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 1, color: '#7fbfff' },
  sheetBtnSub: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
});
