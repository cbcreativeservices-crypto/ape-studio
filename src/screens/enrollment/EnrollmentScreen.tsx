/**
 * Enrollment — the user's enrollment MANAGEMENT screen. 5th page of the Awards
 * swipe pager.
 *
 * 2026-07-22 pass (user feedback): slim "Continue Learning" banner (no top
 * Last-Study/Return row), all containers compacted vertically, ☰ drag handle to
 * reorder (PanResponder — no lib), filter chips (A–Z · Favorites · Completed ·
 * Not started), shrunk LED meters. Colour = free/on: GREEN when a topic is
 * accessible (free OR member) and active — the ACTIVE pill + Study button follow
 * that state (gray otherwise). Free = the two free enrollment topics; among the
 * core courses only Professional Audio Safety is free.
 *
 * Non-paid users browse/search freely; any WRITE opens PrePaywallPrompt.
 * FOLLOW-UPS: "Continue"/"Study" open the study Dashboard (not the exact topic);
 * drag uses an estimated row height (no gesture lib).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { officialTopicName } from '../../data/officialTopicNames';
import { Alert, Animated, PanResponder, Platform, Pressable, ScrollView, StyleSheet, Text, View, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native';
import { Modal } from '../../components/DimModal';
import { HoldToActivate } from '../../components/HoldToActivate';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, fonts } from '../../theme/tokens';
import { PrePaywallPrompt } from '../../components/PrePaywallPrompt';
import { HomeSetupSheet } from './HomeSetupSheet';
import { DeckIcon } from '../../components/DeckIcon';
import { HomeIcon } from '../../components/HomeIcon';
import { NavIcon } from '../../components/nav/NavIcon';
import { LedMeter, segmentsForPct } from '../../components/LedMeter';
import { fetchV3Curriculum, fetchV3Programs, fetchV3Certs, type V3Field, type V3Credential } from '../../data/v3Curriculum';
import {
  COREQ_TOPIC_GS,
} from '../awards/awardsData';
import { useEntitlement } from '../../features/commercial/EntitlementProvider';
import { useEnrollmentProgress } from '../../features/enrollment/enrollmentProgress';
import {
  addTopics,
  isFreeEnrollGs,
  moveTopic,
  pruneInvalidGs,
  removeTopic,
  resetEnrollment,
  setActiveMany,
  toggleActive,
  toggleTopic,
  useEnrollment,
} from '../../features/enrollment/enrollmentStore';
import {
  addBundle,
  bundleKey,
  moveBundle,
  removeBundle,
  setBundleLoaded,
  useBundles,
  type BundleKind,
  type EnrolledBundle,
} from '../../features/enrollment/enrolledBundlesStore';
import {
  HOME_MAX,
  ensureHome,
  removeHome,
  removeHomeBundle,
  toggleHome,
  toggleHomeBundle,
  useHomeBundles,
  useHomeGs,
} from '../../features/home/homeCardsStore';
import { FLAGGED_TOPIC_ID, setCustomOnDashboard, useCustomOnDashboard, useTermList } from '../../features/flags/flaggedStore';
import { TermSelectIcons } from '../../features/flags/TermSelectIcons';
import { fetchGlossaryItemsByIds } from '../../features/study/api';
import { useLastStudyLocation } from '../../features/study/lastStudyLocation';

const GREEN = '#37e05f';
const BLUE = '#7fbfff';
const GRAY = '#6b6b6b';
const PURPLE = '#c4a2ff';
const DRAG_ROW_H = 84; // drag distance per reorder step (tuned for collapsed + expanded cards)

type FilterKey = 'az' | 'home' | 'done' | 'new';

/** A subject in the matrix shape the browse renders, built from the LIVE v3
 *  curriculum (owner 2026-08-06). `order` is a stable synthetic index across
 *  fields; `field` is carried for the field/subject grouping label. */
type FlatSubject = { order: number; name: string; field: string; topics: { gs: number; name: string }[] };

function flatSubjectsFromV3(fields: V3Field[]): FlatSubject[] {
  let order = 0;
  const out: FlatSubject[] = [];
  for (const f of fields) {
    for (const s of f.subjects) {
      out.push({
        order: order++,
        name: s.subject,
        field: f.field,
        topics: s.topics.map((t) => ({ gs: t.gs, name: t.name })),
      });
    }
  }
  return out;
}

/**
 * Hold-to-remove button that FILLS left→right while held, showing the elapsed
 * time until the removal fires (when the fill reaches the right edge) — user
 * request 2026-07-23. Releasing early rewinds the fill and cancels.
 */
function HoldToRemove({
  onComplete,
  label = 'Hold to Remove',
  accessibilityLabel,
  duration = 1100,
}: {
  onComplete: () => void;
  label?: string;
  accessibilityLabel?: string;
  duration?: number;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  const holding = useRef(false);
  const fired = useRef(false);
  const begin = () => {
    holding.current = true;
    fired.current = false;
    anim.setValue(0);
    Animated.timing(anim, { toValue: 1, duration, useNativeDriver: false }).start(({ finished }) => {
      if (finished && holding.current && !fired.current) {
        fired.current = true;
        onComplete();
      }
    });
  };
  const end = () => {
    holding.current = false;
    anim.stopAnimation();
    Animated.timing(anim, { toValue: 0, duration: 140, useNativeDriver: false }).start();
  };
  const fillWidth = anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  return (
    <Pressable
      onPressIn={begin}
      onPressOut={end}
      style={styles.removeHoldBtn}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint="Press and hold to remove"
    >
      <Animated.View pointerEvents="none" style={[styles.holdFill, { width: fillWidth }]} />
      <Text style={styles.removeText}>{label}</Text>
    </Pressable>
  );
}

// Module-level UI-state cache (owner 2026-07-30): the enrollment screen's
// collapsed/expanded state persists across RETURNS to the screen — it survives
// component remounts (navigate away + back) and resets only on app restart — so
// the user comes back to exactly the collapse/expand layout they left.
const enrollUi = {
  collapsed: [] as string[],
  recordOpen: false,
  browseOpen: false,
  browseTab: 'cert' as 'cert' | 'program' | 'subject' | 'field' | 'topic',
  openItem: null as string | null,
  openSubject: null as number | null,
  openField: null as number | null,
};

export function EnrollmentView({ showBrand = true }: { showBrand?: boolean }) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { isMember: paid } = useEntitlement();

  const enrolled = useEnrollment();
  // LIVE v3 curriculum (owner 2026-08-06) — replaces the retired bundled v2 matrix.
  const [v3Subjects, setV3Subjects] = useState<FlatSubject[]>([]);
  useEffect(() => {
    let alive = true;
    void fetchV3Curriculum().then((fields) => {
      if (alive) setV3Subjects(flatSubjectsFromV3(fields));
    });
    return () => {
      alive = false;
    };
  }, []);
  const topicIndex = useMemo(() => {
    const m = new Map<number, { name: string; subject: string }>();
    for (const s of v3Subjects) for (const t of s.topics) m.set(t.gs, { name: t.name, subject: s.name });
    return m;
  }, [v3Subjects]);
  // Self-heal (owner 2026-08-10): once the LIVE v3 curriculum has loaded, drop
  // any enrolled topic whose gs isn't an active v3 topic — stale pre-v3 rows
  // that would otherwise render as "Topic gsN". Guarded on a loaded index so we
  // never prune mid-fetch (empty index = still loading, not "all invalid").
  useEffect(() => {
    if (topicIndex.size === 0) return;
    pruneInvalidGs(new Set(topicIndex.keys()));
  }, [topicIndex]);
  // LIVE v3 programs + certs (owner 2026-08-06) — replace the retired v2 award
  // data; aliased to the field names the browse already uses.
  const [v3Programs, setV3Programs] = useState<V3Credential[]>([]);
  const [v3Certs, setV3Certs] = useState<V3Credential[]>([]);
  useEffect(() => {
    let alive = true;
    void fetchV3Programs().then((p) => alive && setV3Programs(p));
    void fetchV3Certs().then((c) => alive && setV3Certs(c));
    return () => {
      alive = false;
    };
  }, []);
  const PROGRAM_PATHS = useMemo(
    () => v3Programs.map((p) => ({ name: p.name, requiredTopics: p.topicsGs })),
    [v3Programs],
  );
  const SPECIALIZED_CERTIFICATES = useMemo(
    () => v3Certs.map((c) => ({ name: c.name, specializationTopics: c.topicsGs })),
    [v3Certs],
  );
  const [openSubject, setOpenSubject] = useState<number | null>(enrollUi.openSubject);
  // Second browse list — Fields (owner 2026-08-18). Which field card is expanded
  // (by order index), mirroring openSubject.
  const [openField, setOpenField] = useState<number | null>(enrollUi.openField);
  const [payPrompt, setPayPrompt] = useState(false);
  const [homeSetupOpen, setHomeSetupOpen] = useState(false);
  const [homeFull, setHomeFull] = useState(false);
  // Clear-list confirm popup (owner 2026-08-01): the bottom red ✕ is now a fixed
  // SQUARE button that opens this popup; the destructive hold-to-confirm lives
  // INSIDE the popup, so the ✕ never grows/reflows the bottom action row.
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [filters, setFilters] = useState<Set<FilterKey>>(new Set());
  const dragAccum = useRef(0);
  // Reorder step = the REAL measured height of each container (owner 2026-08-05
  // "reorder not working"): the old fixed DRAG_ROW_H=84 mismatched the true card
  // heights (collapsed cards are thin, expanded ones are much taller), so a
  // one-card drag fired the wrong number of ±1 swaps. Each container reports its
  // height via onLayout; we step by the lifted card's own height, falling back
  // to DRAG_ROW_H until measured.
  const rowHeights = useRef<Map<string, number>>(new Map());
  const rowLayoutProps = (id: string) => ({
    onLayout: (ev: LayoutChangeEvent) => rowHeights.current.set(id, ev.nativeEvent.layout.height),
  });
  // Press-hold-to-lift reorder (owner 2026-07-31): hold a topic still for 2 s and
  // it POPS out (springs up + shadow) to become a draggable object; then drag
  // up/down to reorder and release to drop it. A 2 s timer (started on touch,
  // cancelled if the finger moves = a scroll, or lifts early) fires the pop even
  // before any movement; liftedIdRef marks the lifted row for the drag responder.
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // The lifted container is keyed by the SAME id used for collapse (`t:<gs>` for
  // topics, the bundle key for awards) so ONE mechanism reorders both, whether the
  // card is collapsed or expanded.
  const liftedIdRef = useRef<string | null>(null);
  const touchStartRef = useRef({ x: 0, y: 0 });
  const liftAnim = useRef(new Animated.Value(0)).current;
  const [liftedId, setLiftedId] = useState<string | null>(null);
  const beginLift = (id: string) => {
    liftedIdRef.current = id;
    setLiftedId(id);
    Animated.spring(liftAnim, { toValue: 1, useNativeDriver: true, friction: 5, tension: 90 }).start();
  };
  const endLift = () => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
    if (liftedIdRef.current == null) return;
    liftedIdRef.current = null;
    Animated.timing(liftAnim, { toValue: 0, duration: 160, useNativeDriver: true }).start(() => setLiftedId(null));
  };
  // Clear a pending hold timer on unmount.
  useEffect(() => () => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
  }, []);
  const scrollRef = useRef<ScrollView>(null);
  const browseY = useRef(0);
  // Pinned BROWSE & ADD tab bar — shown as an absolute overlay (outside the
  // ScrollView, so its taps aren't eaten like a sticky header) once the browse
  // section scrolls to the top (user request 2026-07-22).
  const [pinned, setPinned] = useState(false);
  // Per-container collapse (thin title + % only) — keyed by `t:<gs>` for topics
  // and by bundle key for awards (user request 2026-07-22).
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set(enrollUi.collapsed));
  // MY RECORD folder — the completion archive at the bottom (user request
  // 2026-07-23). Collapsed by default.
  const [recordOpen, setRecordOpen] = useState(enrollUi.recordOpen);
  // BROWSE & ADD list collapse (user request 2026-07-23) — the title + tabs stay,
  // the list below hides. Open by default.
  const [browseOpen, setBrowseOpen] = useState(enrollUi.browseOpen); // collapsed on open (user request 2026-07-24)
  const toggleCollapse = (id: string) =>
    setCollapsed((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  // Unified per-container gesture (owner 2026-07-31). ONE PanResponder handles
  // both: a QUICK horizontal flick toggles collapse (left = collapse an expanded
  // card, right = expand a collapsed one); a 2 s STILL-HOLD lifts the container
  // (pop) and a vertical drag then reorders the list — works collapsed OR
  // expanded, for topics AND awards. `move` reorders by ±1 (moveTopic/moveBundle);
  // pass null for the read-only "you qualify" derived cards (swipe only, no sort).
  // The pager is locked on this page, so nothing competes for the horizontal drag.
  const containerPan = (id: string, move: ((dir: -1 | 1) => void) | null) =>
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => {
        if (liftedIdRef.current === id) return true; // lifted → drag to reorder
        return Math.abs(g.dx) > 16 && Math.abs(g.dx) > Math.abs(g.dy) * 1.6; // horizontal flick
      },
      // CAPTURE horizontal flicks (and the lifted drag) so the container's own
      // swipe ALWAYS wins over the parent screen-pager — the pager can never steal
      // a container swipe on this page (owner 2026-08-01).
      onMoveShouldSetPanResponderCapture: (_e, g) =>
        liftedIdRef.current === id || (Math.abs(g.dx) > 16 && Math.abs(g.dx) > Math.abs(g.dy) * 1.6),
      onPanResponderTerminationRequest: () => liftedIdRef.current !== id,
      onPanResponderGrant: () => {
        dragAccum.current = 0;
      },
      onPanResponderMove: (_e, g) => {
        if (liftedIdRef.current !== id || !move) return; // only while lifted
        const rowH = rowHeights.current.get(id) || DRAG_ROW_H; // real measured height
        const step = Math.trunc((g.dy - dragAccum.current) / rowH);
        if (step !== 0) {
          const dir: -1 | 1 = step > 0 ? 1 : -1;
          for (let k = 0; k < Math.abs(step); k++) move(dir);
          dragAccum.current += step * rowH;
        }
      },
      onPanResponderRelease: (_e, g) => {
        if (liftedIdRef.current === id) {
          endLift();
          return;
        }
        if (Math.abs(g.dx) < 44) return;
        const isColl = collapsed.has(id);
        if (isColl && g.dx > 0) toggleCollapse(id); // swipe right → expand
        else if (!isColl && g.dx < 0) toggleCollapse(id); // swipe left → collapse
      },
      onPanResponderTerminate: () => {
        if (liftedIdRef.current === id) endLift();
      },
    });
  // The 2 s hold-to-lift timer, attached as touch props to reorderable containers
  // only when the list is in its raw custom order (no filters).
  const reorderTouchProps = (id: string) => ({
    onTouchStart: (ev: GestureResponderEvent) => {
      touchStartRef.current = { x: ev.nativeEvent.pageX, y: ev.nativeEvent.pageY };
      if (holdTimer.current) clearTimeout(holdTimer.current);
      holdTimer.current = setTimeout(() => beginLift(id), 2000);
    },
    onTouchMove: (ev: GestureResponderEvent) => {
      if (liftedIdRef.current === id) return; // already dragging
      const dx = ev.nativeEvent.pageX - touchStartRef.current.x;
      const dy = ev.nativeEvent.pageY - touchStartRef.current.y;
      if (Math.hypot(dx, dy) > 12 && holdTimer.current) {
        clearTimeout(holdTimer.current); // moved before the hold fired → a scroll
        holdTimer.current = null;
      }
    },
    onTouchEnd: () => {
      if (holdTimer.current) {
        clearTimeout(holdTimer.current);
        holdTimer.current = null;
      }
      if (liftedIdRef.current === id) endLift();
    },
    onTouchCancel: () => {
      if (holdTimer.current) {
        clearTimeout(holdTimer.current);
        holdTimer.current = null;
      }
      if (liftedIdRef.current === id) endLift();
    },
  });
  // The lift pop transform, shared by every liftable container.
  const liftStyle = (id: string) =>
    liftedId === id
      ? [
          styles.cardLifted,
          {
            transform: [
              { scale: liftAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] }) },
              { translateY: liftAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) },
            ],
          },
        ]
      : null;
  // Mirror the collapse/expand UI state into the module cache so RETURNING to the
  // screen restores it exactly as the user left it (owner 2026-07-30).
  useEffect(() => {
    enrollUi.collapsed = [...collapsed];
  }, [collapsed]);
  useEffect(() => {
    enrollUi.recordOpen = recordOpen;
  }, [recordOpen]);
  useEffect(() => {
    enrollUi.browseOpen = browseOpen;
  }, [browseOpen]);
  useEffect(() => {
    enrollUi.openSubject = openSubject;
  }, [openSubject]);
  useEffect(() => {
    enrollUi.openField = openField;
  }, [openField]);

  const homeGs = useHomeGs();
  const homeSet = useMemo(() => new Set(homeGs), [homeGs]);
  const bundles = useBundles();
  const bundleKeySet = useMemo(() => new Set(bundles.map((b) => b.key)), [bundles]);
  const homeBundleKeys = useHomeBundles();
  const homeBundleSet = useMemo(() => new Set(homeBundleKeys), [homeBundleKeys]);
  // Default to Certificates (far-left tab) on first load (user request 2026-07-22).
  const [browseTab, setBrowseTab] = useState<'cert' | 'program' | 'subject' | 'field' | 'topic'>(enrollUi.browseTab);
  const [openItem, setOpenItem] = useState<string | null>(enrollUi.openItem);
  useEffect(() => {
    enrollUi.browseTab = browseTab;
  }, [browseTab]);
  useEffect(() => {
    enrollUi.openItem = openItem;
  }, [openItem]);
  // Per-card book toggle: place/remove the topic on the Home screen (paid only;
  // enforces the 20-card cap). user request 2026-07-22.
  const toggleOnHome = (gs: number) =>
    guard(() => {
      if (toggleHome(gs) === 'full') setHomeFull(true);
    });

  // Fields — the top-level Field→Subject→Topic grouping (owner 2026-08-18),
  // derived from the same v3 curriculum as Subjects. Each field aggregates the
  // topics of every subject in it. Field order = first-seen (alphabetical data).
  const v3Fields = useMemo(() => {
    const out: { order: number; name: string; topics: { gs: number; name: string }[] }[] = [];
    const idx = new Map<string, number>();
    for (const s of v3Subjects) {
      let i = idx.get(s.field);
      if (i === undefined) { i = out.length; idx.set(s.field, i); out.push({ order: i, name: s.field, topics: [] }); }
      out[i].topics.push(...s.topics);
    }
    return out;
  }, [v3Subjects]);

  // Topics of the currently EXPANDED browse item (cert / program / subject) — so
  // browse rows can show "(in progress)" from real study progress even for
  // topics that aren't (or are no longer) enrolled (user request 2026-07-22).
  const expandedBrowseGs = useMemo<number[]>(() => {
    if (browseTab === 'subject') {
      const s = v3Subjects.find((x) => x.order === openSubject);
      return s ? s.topics.map((t) => t.gs) : [];
    }
    if (browseTab === 'field') {
      const f = v3Fields.find((x) => x.order === openField);
      return f ? f.topics.map((t) => t.gs) : [];
    }
    if (!openItem) return [];
    if (browseTab === 'cert') {
      const c = SPECIALIZED_CERTIFICATES.find((x) => `cert:${x.name}` === openItem);
      return c ? c.specializationTopics : [];
    }
    if (browseTab === 'program') {
      const p = PROGRAM_PATHS.find((x) => `program:${x.name}` === openItem);
      return p ? p.requiredTopics : [];
    }
    return [];
  }, [browseTab, openItem, openSubject, openField, v3Subjects, v3Fields, PROGRAM_PATHS, SPECIALIZED_CERTIFICATES]);

  const allGs = useMemo(
    () => Array.from(new Set([...COREQ_TOPIC_GS, ...enrolled.map((e) => e.gs), ...expandedBrowseGs])),
    [enrolled, expandedBrowseGs],
  );
  const prog = useEnrollmentProgress(allGs);
  const pctFor = (gs: number) => prog.get(gs)?.pct ?? 0;

  const enrolledGs = useMemo(() => new Set(enrolled.map((e) => e.gs)), [enrolled]);
  // Topics currently ACTIVE (= loaded into the Dashboard study deck). Drives the
  // per-topic open-book state and the award "STUDY ALL / REMOVE ALL" toggle
  // (user request 2026-07-23).
  const activeGs = useMemo(() => new Set(enrolled.filter((e) => e.active).map((e) => e.gs)), [enrolled]);
  const activeCount = enrolled.filter((e) => e.active).length;

  // Every incomplete required core course is force-loaded into the Dashboard deck
  // and stays active until completed (user request 2026-07-24) — a student must
  // finish them, so they can't be deactivated or removed while incomplete.
  useEffect(() => {
    const toActivate = COREQ_TOPIC_GS.filter(
      (gs) => enrolledGs.has(gs) && (prog.get(gs)?.pct ?? 0) < 100 && !activeGs.has(gs),
    );
    if (toActivate.length) setActiveMany(toActivate, true);
  }, [enrolledGs, prog, activeGs]);

  // Required core courses auto-RESERVE a Home slot while incomplete, and auto-
  // free it once completed (user request 2026-07-22) — so 3 of the 20 Home
  // slots stay reserved for cores. Their cards carry no manual Home toggle.
  // Owner 2026-07-30: the requisite cores appear in the menu ONLY WHILE the user
  // holds a certificate/program — added when the first credential is enrolled,
  // gone when they complete it OR when the LAST certificate is removed from the
  // "my enrollments" list. (Pro Audio Safety's free taster card is separate and
  // always present regardless.)
  const hasCredential = bundles.some((b) => b.kind === 'cert' || b.kind === 'program');
  useEffect(() => {
    for (const gs of COREQ_TOPIC_GS) {
      const done = (prog.get(gs)?.pct ?? 0) >= 100;
      if (hasCredential && !done) ensureHome(gs);
      else removeHome(gs);
    }
  }, [hasCredential, prog]);
  const nameFor = (gs: number) => officialTopicName(gs, topicIndex.get(gs)?.name);
  const subjectFor = (gs: number) => topicIndex.get(gs)?.subject ?? '';

  const guard = (action: () => void) => {
    if (paid) action();
    else setPayPrompt(true);
  };

  // Bundles (cert/program) — user request 2026-07-22. Adding a bundle records it
  // AND enrolls its topics individually. LOAD/UNLOAD bulk-toggle those topics'
  // active state (= on the Dashboard study swipe). Home toggle places the single
  // bundle CARD on Home. All ungated to ADD (free users build a list); LOAD/
  // UNLOAD + Home are gated.
  // Adding the first cert/program also brings in the other required cores
  // (Grounding & Electrical + Workplace Skills join Safety) — user request
  // 2026-07-22. addTopics is idempotent, so repeat adds are harmless.
  const ensureCores = () => addTopics([...COREQ_TOPIC_GS]);
  const addWholeCert = (name: string, topics: number[]) => {
    addBundle('cert', name, topics);
    addTopics(topics);
    setActiveMany(topics, false); // not loaded onto the Dashboard until LOAD
    ensureCores();
  };
  const addWholeProgram = (name: string, topics: number[]) => {
    addBundle('program', name, topics);
    addTopics(topics);
    setActiveMany(topics, false);
    ensureCores();
  };
  // Whole SUBJECT — all its topics as one amber subject bundle (user request
  // 2026-07-22), mirroring cert/program add-all.
  const addWholeSubject = (name: string, topics: number[]) => {
    addBundle('subject', name, topics);
    addTopics(topics);
    setActiveMany(topics, false);
  };
  // Whole FIELD — enroll its topics (owner 2026-08-18). Fields do NOT create a
  // bundle card (unlike subjects); toggle state derives from enrollment.
  const addWholeField = (topics: number[]) => { addTopics(topics); setActiveMany(topics, false); };
  const removeWholeField = (topics: number[]) => { topics.forEach((gs) => { if (!isFreeEnrollGs(gs)) removeTopic(gs); }); };
  // REMOVE ALL — drop a cert/program/subject bundle AND its topics from the
  // enrollment list (user request 2026-07-22). The two mandatory free topics are
  // kept (they can never be un-enrolled).
  const removeWhole = (kind: BundleKind, name: string, topics: number[]) => {
    const key = bundleKey(kind, name);
    removeBundle(key);
    removeHomeBundle(key);
    topics.forEach((gs) => {
      if (!isFreeEnrollGs(gs)) removeTopic(gs);
    });
  };
  const removeBundleEntry = (key: string) => {
    removeBundle(key);
    removeHomeBundle(key);
  };
  // Whole-container remove with a confirm (user request 2026-07-26): the ✕ on a
  // cert/program/subject header drops the WHOLE award AND its topics at once —
  // a bulk destructive action (unlike a single topic's instant ✕), so it asks
  // first. Mirrors the topic ✕ affordance but available even while collapsed.
  const confirmRemoveWhole = (b: { kind: BundleKind; name: string; topics: number[] }) => {
    const word = b.kind === 'cert' ? 'certificate' : b.kind === 'program' ? 'program' : 'subject';
    const title = `Remove ${b.name}?`;
    const body = `This removes the ${word} and all ${b.topics.length} of its topics from your enrollment list.`;
    // RN-web ships Alert as a literal no-op, so the X was a dead button on the
    // web preview (QA night 2026-08-31) -- same shim MyProfileView uses.
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined' || window.confirm(`${title}\n\n${body}`)) {
        removeWhole(b.kind, b.name, b.topics);
      }
      return;
    }
    Alert.alert(title, body, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeWhole(b.kind, b.name, b.topics) },
    ]);
  };
  // Loading topics into the study deck is UNGATED (user request 2026-07-23): a
  // free user with an account can set up everything; it persists so nothing
  // breaks when they later pay. The Dashboard still only SHOWS accessible topics.
  const setBundleLoad = (b: EnrolledBundle, loaded: boolean) => {
    setActiveMany(b.topics, loaded);
    setBundleLoaded(b.key, loaded);
  };
  const toggleBundleHome = (key: string) =>
    guard(() => {
      if (toggleHomeBundle(key) === 'full') setHomeFull(true);
    });
  const toggleFilter = (k: FilterKey) =>
    setFilters((prev) => {
      const n = new Set(prev);
      if (n.has(k)) {
        n.delete(k);
      } else {
        n.add(k);
        // Completed and Not-started are mutually exclusive (user request 2026-07-22).
        if (k === 'done') n.delete('new');
        if (k === 'new') n.delete('done');
      }
      return n;
    });

  // Open the Dashboard; with a focus target (topic gs, or FLAGGED_TOPIC_ID for
  // the custom list) the Dashboard fronts that topic immediately (user 2026-07-24).
  // popTo, not navigate: under React Navigation 7 navigate('Main') PUSHES a
  // second tab shell on top of the Awards pager; popTo returns to the existing one.
  const goStudy = (focusGs?: number | string) =>
    navigation.popTo('Main', {
      screen: 'Study',
      params: { screen: 'Dashboard', params: focusGs != null ? { focusGs } : undefined },
    });

  // CONTINUE LEARNING banner: resume the EXACT last spot. If the learner last
  // sat inside a study METHOD screen, jump straight there with its topic;
  // otherwise (last on the Dashboard, or nothing recorded) fall back to the
  // Dashboard resume behavior.
  const lastLoc = useLastStudyLocation();
  const resumeLastOrDashboard = () => {
    // Deep-resuming straight into a method screen BYPASSES the Dashboard's
    // membership gate (owner launch-triage): a lapsed/free user could re-enter
    // paid study that way. Only academy members jump directly into a method;
    // everyone else routes through the Dashboard, which applies the free-topic /
    // paywall gate for the resumed topic (free topics still open one tap away).
    if (lastLoc?.kind === 'method' && paid) {
      // `initial: false` (same root fix as CourseSelectionScreen → Glossary,
      // regression #5): when the Study tab has never been mounted this launch
      // the stack would otherwise initialise as [<method>] alone, so RETURN /
      // back has no Dashboard beneath it. With it the stack mounts its own
      // initialRouteName (Dashboard) as routes[0] BENEATH the method (B-054).
      navigation.popTo('Main', {
        screen: 'Study',
        params: {
          screen: lastLoc.route,
          params: { achievementId: lastLoc.achievementId, topicName: lastLoc.topicName },
          initial: false,
        },
      });
    } else {
      goStudy(resume?.gs);
    }
  };

  // Whether the user's "My Custom List" rides the Dashboard as a current topic.
  const customOnDash = useCustomOnDashboard();
  const starred = useTermList('starred');

  // SEE & EDIT → a term-list popup of the custom list (like a flashcards filter's
  // held list); the TermSelectIcons row lets the user edit membership inline.
  const [customListOpen, setCustomListOpen] = useState(false);
  const [customListRows, setCustomListRows] = useState<{ id: string; term: string }[] | null>(null);
  const openCustomList = async () => {
    setCustomListOpen(true);
    setCustomListRows(null);
    try {
      const items = await fetchGlossaryItemsByIds([...starred]);
      setCustomListRows(items.map((i) => ({ id: i.id, term: i.term })));
    } catch {
      setCustomListRows([]);
    }
  };

  // Continue Learning: best active topic to resume.
  const resume = useMemo(() => {
    const actives = enrolled.filter((e) => e.active);
    if (actives.length === 0) return null;
    let best: { gs: number; pct: number } | null = null;
    for (const e of actives) {
      const pct = prog.get(e.gs)?.pct ?? 0;
      if (pct > 0 && pct < 100 && (!best || pct > best.pct)) best = { gs: e.gs, pct };
    }
    if (best) return best;
    const first = actives.find((e) => (prog.get(e.gs)?.pct ?? 0) < 100) ?? actives[0];
    return { gs: first.gs, pct: prog.get(first.gs)?.pct ?? 0 };
  }, [enrolled, prog]);

  // Filtered / sorted display list. Drag only when showing the raw custom order.
  const customOrder = filters.size === 0;
  const displayed = useMemo(() => {
    // Completed topics move to the MY RECORD folder (user request 2026-07-23), so
    // the main list never shows them.
    let list = enrolled.filter((e) => (prog.get(e.gs)?.pct ?? 0) < 100);
    if (filters.has('home')) list = list.filter((e) => homeSet.has(e.gs));
    if (filters.has('new')) list = list.filter((e) => (prog.get(e.gs)?.pct ?? 0) === 0);
    if (filters.has('az')) list = [...list].sort((a, b) => nameFor(a.gs).localeCompare(nameFor(b.gs)));
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enrolled, filters, prog, homeSet]);

  // Bundles filtered by the same chips (user request 2026-07-22) — Completed
  // shows only bundles whose topics are all complete, etc.
  const displayedBundles = useMemo(() => {
    let bs = bundles;
    if (filters.has('home')) bs = bs.filter((b) => homeBundleSet.has(b.key));
    if (filters.has('done')) bs = bs.filter((b) => b.topics.length > 0 && b.topics.every((gs) => (prog.get(gs)?.pct ?? 0) >= 100));
    if (filters.has('new')) bs = bs.filter((b) => b.topics.every((gs) => (prog.get(gs)?.pct ?? 0) === 0));
    if (filters.has('az')) bs = [...bs].sort((a, b) => a.name.localeCompare(b.name));
    return bs;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bundles, filters, prog, homeBundleSet]);

  // Certs/programs the user QUALIFIES for by accumulated topics but hasn't
  // explicitly added yet (user request 2026-07-22) — surfaced read-only at the
  // very bottom. Excludes any already stored as a bundle.
  const derivedBundles = useMemo(() => {
    const out: { key: string; kind: 'cert' | 'program'; name: string; topics: number[] }[] = [];
    const covered = (topics: number[]) => topics.length > 0 && topics.every((gs) => enrolledGs.has(gs));
    for (const c of SPECIALIZED_CERTIFICATES) {
      const key = `cert:${c.name}`;
      if (!bundleKeySet.has(key) && covered(c.specializationTopics)) {
        out.push({ key, kind: 'cert', name: c.name, topics: c.specializationTopics });
      }
    }
    for (const p of PROGRAM_PATHS) {
      const key = `program:${p.name}`;
      if (!bundleKeySet.has(key) && covered(p.requiredTopics)) {
        out.push({ key, kind: 'program', name: p.name, topics: p.requiredTopics });
      }
    }
    return out;
  }, [enrolledGs, bundleKeySet, PROGRAM_PATHS, SPECIALIZED_CERTIFICATES]);

  // Derived containers respect the filter chips too (bug fix 2026-07-23): they
  // used to ignore them, so incomplete awards leaked into Completed and On Home.
  // Derived awards are never on Home (they aren't added), so 'home' hides them.
  const displayedDerived = useMemo(() => {
    let ds = derivedBundles;
    if (filters.has('home')) ds = [];
    if (filters.has('done')) ds = ds.filter((d) => d.topics.length > 0 && d.topics.every((gs) => (prog.get(gs)?.pct ?? 0) >= 100));
    if (filters.has('new')) ds = ds.filter((d) => d.topics.every((gs) => (prog.get(gs)?.pct ?? 0) === 0));
    if (filters.has('az')) ds = [...ds].sort((a, b) => a.name.localeCompare(b.name));
    return ds;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [derivedBundles, filters, prog]);

  // MY RECORD — every fully-completed topic/award/subject, moved out of the main
  // list into the completion folder at the bottom (user request 2026-07-23).
  // Unfiltered (the record persists regardless of the active chips).
  const recordItems = useMemo(() => {
    const isDone = (topics: number[]) => topics.length > 0 && topics.every((gs) => (prog.get(gs)?.pct ?? 0) >= 100);
    const items: { id: string; kind: 'topic' | 'cert' | 'program' | 'subject'; name: string }[] = [];
    for (const e of enrolled) {
      if ((prog.get(e.gs)?.pct ?? 0) >= 100) items.push({ id: `t:${e.gs}`, kind: 'topic', name: nameFor(e.gs) });
    }
    for (const b of bundles) {
      if (isDone(b.topics)) items.push({ id: b.key, kind: b.kind, name: b.name });
    }
    for (const d of derivedBundles) {
      if (isDone(d.topics)) items.push({ id: d.key, kind: d.kind, name: d.name });
    }
    return items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enrolled, bundles, derivedBundles, prog]);

  // Award containers (cert/program/subject) OPEN COLLAPSED by default (user
  // request 2026-07-23) — topics stay expanded. Collapse each bundle key the
  // first time we see it this session; user-expands afterward stick.
  const knownBundleKeys = useRef<Set<string>>(new Set());
  useEffect(() => {
    const fresh = bundles.map((b) => b.key).filter((k) => !knownBundleKeys.current.has(k));
    if (fresh.length === 0) return;
    fresh.forEach((k) => knownBundleKeys.current.add(k));
    setCollapsed((prev) => {
      const n = new Set(prev);
      fresh.forEach((k) => n.add(k));
      return n;
    });
  }, [bundles]);

  // All topics A–Z for the "Topics" browse tab.
  const allTopicsAZ = useMemo(
    () => v3Subjects.flatMap((s) => s.topics.map((t) => ({ gs: t.gs, name: t.name }))).sort((a, b) => a.name.localeCompare(b.name)),
    [v3Subjects],
  );
  // One add/remove topic row (shared by every browse tab). Ungated — free users
  // build their list too (user request 2026-07-22).
  const topicAddRow = (gs: number, label?: string) => {
    const on = enrolledGs.has(gs);
    // Any study progress → "(in progress)" so the user still sees it here after
    // removing it from their enrollment list (user request 2026-07-22).
    const started = (prog.get(gs)?.pct ?? 0) > 0;
    // Required cores can't be removed UNTIL completed; then the ✕ can hide them
    // from the list above (user request 2026-07-22).
    const coreLocked = COREQ_TOPIC_GS.includes(gs) && (prog.get(gs)?.pct ?? 0) < 100;
    return (
      <View key={gs} style={styles.topicRow}>
        <Pressable
          style={styles.topicRowMain}
          onPress={() => toggleTopic(gs)}
          accessibilityRole="button"
          accessibilityState={{ selected: on }}
          accessibilityLabel={on ? `Remove ${label ?? nameFor(gs)}` : `Add ${label ?? nameFor(gs)}`}
        >
          <Text style={[styles.topicCheck, on && styles.topicCheckOn]}>{on ? '✓' : '+'}</Text>
          <Text style={[styles.topicName, on && styles.topicNameOn]} numberOfLines={1}>
            {label ?? nameFor(gs)}
          </Text>
          {started ? <Text style={styles.inProgress}>(in progress)</Text> : null}
        </Pressable>
        {/* Explicit remove-from-enrollment icon — hidden for required cores until
            they are completed (user request 2026-07-22). */}
        {on && !coreLocked ? (
          <Pressable
            style={styles.topicRemove}
            onPress={() => removeTopic(gs)}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${label ?? nameFor(gs)} from enrollment`}
          >
            <Text style={styles.topicRemoveText}>✕</Text>
          </Pressable>
        ) : null}
      </View>
    );
  };

  // "Completed" chip removed (user request 2026-07-23) — completed items now live
  // in the MY RECORD folder at the bottom.
  const FILTER_CHIPS: { key: FilterKey; label: string }[] = [
    { key: 'az', label: 'A–Z' },
    { key: 'home', label: '⌂ On Home' },
    { key: 'new', label: 'Not started' },
  ];

  // An award is "done" when every one of its topics is at 100% (user request
  // 2026-07-22) — drives top (incomplete) vs. bottom (completed) placement.
  const isBundleDone = (topics: number[]) =>
    topics.length > 0 && topics.every((gs) => (prog.get(gs)?.pct ?? 0) >= 100);

  // A stored cert/program/subject container.
  const renderBundle = (b: EnrolledBundle) => {
    const onHome = homeBundleSet.has(b.key);
    const tint = b.kind === 'cert' ? BLUE : b.kind === 'program' ? PURPLE : colors.amber;
    const kindLabel = b.kind === 'cert' ? 'CERTIFICATE' : b.kind === 'program' ? 'PROGRAM' : 'SUBJECT';
    const kindCard = b.kind === 'cert' ? styles.bundleCert : b.kind === 'program' ? styles.bundleProgram : styles.bundleSubject;
    const bundlePct = b.topics.length
      ? Math.round(b.topics.reduce((sum, gs) => sum + (prog.get(gs)?.pct ?? 0), 0) / b.topics.length)
      : 0;
    const done = isBundleDone(b.topics);
    // Whether every topic of this award is already in the study deck (active).
    const allLoaded = b.topics.length > 0 && b.topics.every((gs) => activeGs.has(gs));
    if (collapsed.has(b.key)) {
      return (
        <Animated.View
          key={b.key}
          {...containerPan(b.key, (dir) => moveBundle(b.key, dir)).panHandlers}
          {...(customOrder ? reorderTouchProps(b.key) : {})}
          {...rowLayoutProps(b.key)}
          style={liftStyle(b.key)}
        >
        {/* No role on the wrapper (QA night 2026-08-31): it nested the ✕
            remove button — invalid button-in-button on web and the outer
            label swallowed the ✕ for screen readers. Expand semantics live on
            the title; its tap bubbles to this wrapper's onPress. */}
        <Pressable style={[styles.bundleCard, kindCard, done && styles.bundleDone, styles.collapsedCard]} onPress={() => toggleCollapse(b.key)} accessible={false}>
          <Text style={styles.collapseTri}>▸</Text>
          <Text style={[styles.bundleTag, { color: tint, borderColor: tint }]}>{kindLabel}</Text>
          <Text style={styles.collapsedTitle} numberOfLines={1} accessibilityRole="button" accessibilityLabel={`Expand ${b.name}`}>
            {b.name}
          </Text>
          <Text style={styles.cardPct}>{bundlePct}%</Text>
          {/* Whole-award remove (✕) available even while collapsed. */}
          <Pressable style={styles.topicRemove} onPress={() => confirmRemoveWhole(b)} hitSlop={6} accessibilityRole="button" accessibilityLabel={`Remove ${b.name} and its topics`}>
            <Text style={styles.topicRemoveText}>✕</Text>
          </Pressable>
        </Pressable>
        </Animated.View>
      );
    }
    return (
      <Animated.View
        key={b.key}
        style={[styles.bundleCard, kindCard, done && styles.bundleDone, liftStyle(b.key)]}
        {...containerPan(b.key, (dir) => moveBundle(b.key, dir)).panHandlers}
        {...(customOrder ? reorderTouchProps(b.key) : {})}
        {...rowLayoutProps(b.key)}
      >
        <View style={styles.cardTop}>
          <Pressable style={styles.collapseBtn} onPress={() => toggleCollapse(b.key)} hitSlop={6} accessibilityRole="button" accessibilityLabel={`Collapse ${b.name}`}>
            <Text style={styles.collapseTri}>▾</Text>
          </Pressable>
          <Text style={[styles.bundleTag, { color: tint, borderColor: tint }]}>{kindLabel}</Text>
          <Text style={styles.cardName} numberOfLines={1}>
            {b.name}
          </Text>
          {/* Subjects are organizational — no awards/exam and NOT placeable on
              Home, so they get no Home icon (user request 2026-07-23). */}
          {b.kind !== 'subject' ? (
            <Pressable style={styles.homeToggle} onPress={() => toggleBundleHome(b.key)} accessibilityRole="button" accessibilityState={{ selected: onHome }} accessibilityLabel={onHome ? 'Remove bundle from Home' : 'Add bundle to Home'}>
              <HomeIcon color={onHome ? colors.amber : GRAY} filled={onHome} size={20} />
            </Pressable>
          ) : null}
          {/* Clear whole-award ✕ remove in the header — like the topics' ✕ —
              drops the award + all its topics (confirms first). */}
          <Pressable style={styles.topicRemove} onPress={() => confirmRemoveWhole(b)} hitSlop={6} accessibilityRole="button" accessibilityLabel={`Remove ${b.name} and its topics`}>
            <Text style={styles.topicRemoveText}>✕</Text>
          </Pressable>
        </View>
        <Text style={styles.bundleMeta}>
          {b.topics.length} topics · {b.loaded ? 'Loaded on Dashboard' : 'Not loaded'}
        </Text>
        {/* Final exam — placeholder for the award's exam quiz; gray + inactive
            for now (user request 2026-07-23). Certs/programs only. */}
        {b.kind !== 'subject' ? (
          <Pressable
            style={styles.finalExamBtn}
            disabled
            accessibilityRole="button"
            accessibilityState={{ disabled: true }}
            accessibilityLabel="Take Final Exam — available when all topics are complete"
          >
            <Text style={styles.finalExamText}>TAKE FINAL EXAM</Text>
          </Pressable>
        ) : null}
        {/* The SAME 3-card deck icon loads/unloads ALL topics (the per-topic
            deck icons below reflect it); the linked study icon opens the Dashboard
            when loaded. Gray REMOVE TOPICS below drops the award (user request
            2026-07-23). */}
        <View style={styles.cardActionRow}>
          {done ? <Text style={styles.doneBadge}>COMPLETED ✓</Text> : null}
          <View style={{ flex: 1 }} />
          <Pressable hitSlop={6}
            style={styles.bookToggle}
            onPress={() => setBundleLoad(b, !allLoaded)}
            accessibilityRole="button"
            accessibilityState={{ selected: allLoaded }}
            accessibilityLabel={allLoaded ? 'Remove all topics from the study deck' : 'Load all topics into the study deck'}
          >
            <DeckIcon color={allLoaded ? colors.blue : GRAY} fill={allLoaded ? BLUE : '#8a8a8a'} size={33} />
          </Pressable>
          <Pressable hitSlop={6}
            style={styles.studyNavBtn}
            onPress={allLoaded ? () => goStudy(b.topics[0]) : undefined}
            disabled={!allLoaded}
            accessibilityRole="button"
            accessibilityState={{ disabled: !allLoaded }}
            accessibilityLabel={allLoaded ? `Study ${b.name}` : 'Load topics to study'}
          >
            <NavIcon icon="Study" lit={allLoaded} />
          </Pressable>
        </View>
        <View style={styles.cardMeterRow}>
          <LedMeter filled={segmentsForPct(bundlePct)} segWidth={5} />
          <Text style={styles.cardPct}>{bundlePct}%</Text>
          <View style={{ flex: 1 }} />
          <Pressable
            style={styles.removeTopicsBtn}
            onPress={() => confirmRemoveWhole(b)}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${b.name} and its topics from the list`}
          >
            <Text style={styles.removeTopicsText}>REMOVE AWARD</Text>
          </Pressable>
        </View>
      </Animated.View>
    );
  };

  // A read-only "you qualify" cert/program container (accumulated but not added).
  const renderDerived = (d: { key: string; kind: 'cert' | 'program'; name: string; topics: number[] }) => {
    const tint = d.kind === 'cert' ? BLUE : PURPLE;
    const kindLabel = d.kind === 'cert' ? 'CERTIFICATE' : 'PROGRAM';
    const kindCard = d.kind === 'cert' ? styles.bundleCert : styles.bundleProgram;
    const dpct = d.topics.length
      ? Math.round(d.topics.reduce((sum, gs) => sum + (prog.get(gs)?.pct ?? 0), 0) / d.topics.length)
      : 0;
    const done = isBundleDone(d.topics);
    const allLoaded = d.topics.length > 0 && d.topics.every((gs) => activeGs.has(gs));
    if (collapsed.has(d.key)) {
      return (
        <View key={d.key} {...containerPan(d.key, null).panHandlers}>
        <Pressable style={[styles.bundleCard, kindCard, done && styles.bundleDone, styles.collapsedCard]} onPress={() => toggleCollapse(d.key)} accessibilityRole="button" accessibilityLabel={`Expand ${d.name}`}>
          <Text style={styles.collapseTri}>▸</Text>
          <Text style={[styles.bundleTag, { color: tint, borderColor: tint }]}>{kindLabel}</Text>
          <Text style={styles.collapsedTitle} numberOfLines={1}>
            {d.name}
          </Text>
          <Text style={styles.cardPct}>{dpct}%</Text>
        </Pressable>
        </View>
      );
    }
    return (
      <View key={d.key} style={[styles.bundleCard, kindCard, done && styles.bundleDone]} {...containerPan(d.key, null).panHandlers}>
        <View style={styles.cardTop}>
          <Pressable style={styles.collapseBtn} onPress={() => toggleCollapse(d.key)} hitSlop={6} accessibilityRole="button" accessibilityLabel={`Collapse ${d.name}`}>
            <Text style={styles.collapseTri}>▾</Text>
          </Pressable>
          <Text style={[styles.bundleTag, { color: tint, borderColor: tint }]}>{kindLabel}</Text>
          <Text style={styles.cardName} numberOfLines={1}>
            {d.name}
          </Text>
        </View>
        <Text style={styles.bundleMeta}>
          {done ? 'You’ve completed all topics for this award' : 'You already have all topics for this award'}
        </Text>
        {/* Final exam placeholder — gray + inactive for now (user request 2026-07-23). */}
        <Pressable style={styles.finalExamBtn} disabled accessibilityRole="button" accessibilityState={{ disabled: true }} accessibilityLabel="Take Final Exam — available when all topics are complete">
          <Text style={styles.finalExamText}>TAKE FINAL EXAM</Text>
        </Pressable>
        {/* STUDY ALL (blue) loads the award's topics into the deck; ADD TOPICS
            (gray) formalizes the award in the list (→ becomes REMOVE TOPICS) —
            user request 2026-07-23. Each button on its own row so nothing
            overflows on narrow phones. */}
        <View style={styles.cardActionRow}>
          {done ? <Text style={styles.doneBadge}>COMPLETED ✓</Text> : null}
          <View style={{ flex: 1 }} />
          <Pressable hitSlop={6}
            style={styles.bookToggle}
            onPress={() => setActiveMany(d.topics, !allLoaded)}
            accessibilityRole="button"
            accessibilityState={{ selected: allLoaded }}
            accessibilityLabel={allLoaded ? 'Remove all topics from the study deck' : 'Load all topics into the study deck'}
          >
            <DeckIcon color={allLoaded ? colors.blue : GRAY} fill={allLoaded ? BLUE : '#8a8a8a'} size={33} />
          </Pressable>
          <Pressable hitSlop={6}
            style={styles.studyNavBtn}
            onPress={allLoaded ? () => goStudy(d.topics[0]) : undefined}
            disabled={!allLoaded}
            accessibilityRole="button"
            accessibilityState={{ disabled: !allLoaded }}
            accessibilityLabel={allLoaded ? `Study ${d.name}` : 'Load topics to study'}
          >
            <NavIcon icon="Study" lit={allLoaded} />
          </Pressable>
        </View>
        <View style={styles.cardMeterRow}>
          <LedMeter filled={segmentsForPct(dpct)} segWidth={5} />
          <Text style={styles.cardPct}>{dpct}%</Text>
          <View style={{ flex: 1 }} />
          <Pressable
            style={styles.addTopicsBtn}
            onPress={() => (d.kind === 'cert' ? addWholeCert(d.name, d.topics) : addWholeProgram(d.name, d.topics))}
            accessibilityRole="button"
            accessibilityLabel={`Add ${d.name} to the list`}
          >
            <Text style={styles.addTopicsText}>ADD TOPICS ›</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  // Shared BROWSE & ADD tab row — used both in-flow and in the pinned overlay.
  const renderBrowseTabs = () => (
    <View style={styles.browseTabs}>
      {([['cert', 'Certificates', BLUE], ['program', 'Programs', PURPLE], ['subject', 'Subjects', colors.amber], ['field', 'Fields', colors.green], ['topic', 'Topics', colors.textPrimary]] as const).map(([k, label, tint]) => {
        const on = browseTab === k;
        return (
          <Pressable
            key={k}
            style={[styles.browseTab, on && { borderColor: tint, backgroundColor: 'rgba(255,255,255,.05)' }]}
            onPress={() => {
              setBrowseTab(k);
              setOpenSubject(null);
              setOpenField(null);
              setOpenItem(null);
              setBrowseOpen(true); // clicking a filter auto-reveals the list (user request 2026-07-24)
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
          >
            {/* Type-coloured tabs: cert blue, program purple, subject amber, topic white. */}
            <Text style={[styles.browseTabText, { color: tint, opacity: on ? 1 : 0.7 }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        onScroll={(e) => {
          const y = e.nativeEvent.contentOffset.y;
          const shouldPin = browseY.current > 0 && y >= browseY.current;
          setPinned((prev) => (prev === shouldPin ? prev : shouldPin));
        }}
      >
        {/* NOTE: the BROWSE & ADD header was previously a ScrollView sticky
            header, but sticky-header touch handling was intercepting taps on the
            tab buttons (user report 2026-07-22) — so it now scrolls normally. */}
        <View style={styles.topBlock}>
        {/* "My Custom List" — the user's ★ starred terms as a study deck. The
            large deck icon + name IS the Custom List; the small deck icon toggles
            whether it appears on the Dashboard as a current topic; the blue Study
            icon opens the Dashboard with it present. Placed ABOVE Continue
            Learning (owner 2026-08-05). */}
        {/* OFF state: gray border, dimmed background, gray toggle + study icons
            (study not pressable). The large deck icon, title, and SEE & EDIT stay
            NORMAL in both states (user request 2026-07-24). */}
        <View style={[styles.customBar, !customOnDash && styles.customBarOff]}>
          <View style={styles.customIcon}>
            <DeckIcon color={colors.blue} size={34} fill={BLUE} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.customName} numberOfLines={1}>
              My Custom List
            </Text>
          </View>
          {/* SEE & EDIT → the custom-list terms popup (edit membership inline). */}
          <Pressable
            onPress={openCustomList}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="See and edit my custom list"
          >
            <Text style={styles.customSeeEdit}>SEE &amp; EDIT</Text>
          </Pressable>
          {/* Small deck toggle: show/hide the Custom List on the Dashboard. */}
          <Pressable hitSlop={6}
            style={styles.bookToggle}
            onPress={() => setCustomOnDashboard(!customOnDash)}
            accessibilityRole="button"
            accessibilityState={{ selected: customOnDash }}
            accessibilityLabel={customOnDash ? 'Remove my custom list from the dashboard' : 'Show my custom list on the dashboard'}
          >
            <DeckIcon color={customOnDash ? colors.blue : GRAY} fill={customOnDash ? BLUE : '#8a8a8a'} size={33} />
          </Pressable>
          {/* Study → only when ON (grayed + unpressable when OFF). */}
          <Pressable hitSlop={6}
            style={styles.studyNavBtn}
            onPress={customOnDash ? () => goStudy(FLAGGED_TOPIC_ID) : undefined}
            disabled={!customOnDash}
            accessibilityRole="button"
            accessibilityState={{ disabled: !customOnDash }}
            accessibilityLabel="Study my custom list"
          >
            <NavIcon icon="Study" lit={customOnDash} />
          </Pressable>
        </View>

        {/* Slim "Continue Learning" banner — notification height. */}
        {resume ? (
          <Pressable style={styles.continueBar} onPress={resumeLastOrDashboard} accessibilityRole="button" accessibilityLabel={`Continue ${nameFor(resume.gs)}`}>
            <View style={{ flex: 1 }}>
              <Text style={styles.continueEyebrow}>CONTINUE LEARNING · {resume.pct}%</Text>
              <Text style={styles.continueName} numberOfLines={1}>
                Resume {nameFor(resume.gs)}
              </Text>
            </View>
            {/* Blue bottom-nav STUDY icon — in the shared studyNavBtn slot so it
                aligns with the other rows' study icons (user request 2026-07-24). */}
            <View style={styles.studyNavBtn}>
              <NavIcon icon="Study" lit />
            </View>
          </Pressable>
        ) : null}

        {/* The standalone "REQUIRED CORE COURSES" section was removed (user
            request 2026-07-22) — the cores now live in the My Enrollment list
            below as green "Required" cards. */}

        {/* My enrollment + filters. The right-side master button opens the Home
            screen customizer (user request 2026-07-22). The whole My Enrollment
            area (title → last container) is framed in a green border (user
            request 2026-07-22). */}
        <View style={styles.myEnrollArea}>
        <View style={styles.listHead}>
          <View>
            <Text style={styles.sectionHead}>MY ENROLLMENT</Text>
            <Text style={styles.listCount}>
              {activeCount} of {enrolled.length} Enrolled
            </Text>
          </View>
          <View style={{ flex: 1 }} />
          {/* Jump down to the browse/add list (user request 2026-07-22). */}
          <Pressable
            style={styles.jumpBtn}
            onPress={() => scrollRef.current?.scrollTo({ y: Math.max(0, browseY.current - 8), animated: true })}
            accessibilityRole="button"
            accessibilityLabel="Jump to browse and add topics"
          >
            <Text style={styles.jumpText}>BROWSE & ADD ▾</Text>
          </Pressable>
          <Pressable
            style={styles.homeSetupBtn}
            onPress={() => setHomeSetupOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Customize your Home screen"
          >
            <Text style={styles.homeSetupText}>⌂ HOME SETUP ›</Text>
          </Pressable>
        </View>
        <View style={styles.filterRow}>
          {FILTER_CHIPS.map((c) => {
            const on = filters.has(c.key);
            return (
              <Pressable
                key={c.key}
                style={[styles.chip, on && styles.chipOn]}
                onPress={() => toggleFilter(c.key)}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                accessibilityLabel={c.label}
              >
                <Text style={[styles.chipText, on && styles.chipTextOn]}>{c.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* INCOMPLETE cert/program/subject awards show at the TOP by default
            (user request 2026-07-22); completed ones sink below the topics. */}
        {displayedBundles.filter((b) => !isBundleDone(b.topics)).map(renderBundle)}
        {displayedDerived.filter((d) => !isBundleDone(d.topics)).map(renderDerived)}

        {displayed.length === 0 && displayedBundles.length === 0 ? (
          <Text style={styles.empty}>
            {enrolled.length === 0 && bundles.length === 0 ? 'No topics yet.' : 'Nothing matches those filters.'}
          </Text>
        ) : (
          displayed.map((e) => {
            const free = isFreeEnrollGs(e.gs);
            const acc = paid || free;
            // Required core courses (Safety, Grounding, Workplace Skills) are
            // LOCKED into the Dashboard deck and can't be deactivated OR removed
            // until completed — then they unlock (user request 2026-07-24). All
            // other topics can always be removed.
            const pct = pctFor(e.gs);
            const isCore = COREQ_TOPIC_GS.includes(e.gs);
            const coreLocked = isCore && pct < 100;
            const showActive = coreLocked || e.active;
            const activeGreen = acc && showActive;
            // Reorder (custom order only): hold 2 s to lift, drag to sort. The
            // gesture lives on the container wrapper via containerPan/reorderTouch.
            const tid = `t:${e.gs}`;
            const moveThis = (dir: -1 | 1) => moveTopic(e.gs, dir);
            if (collapsed.has(tid)) {
              return (
                <Animated.View
                  key={e.gs}
                  {...containerPan(tid, moveThis).panHandlers}
                  {...(customOrder ? reorderTouchProps(tid) : {})}
                  {...rowLayoutProps(tid)}
                  style={liftStyle(tid)}
                >
                <Pressable style={[styles.card, !e.active && styles.cardInactive, isCore && styles.cardCore, styles.collapsedCard]} onPress={() => toggleCollapse(tid)} accessibilityRole="button" accessibilityLabel={`Expand ${nameFor(e.gs)}`}>
                  <Text style={styles.collapseTri}>▸</Text>
                  <Text style={styles.collapsedTitle} numberOfLines={1}>
                    {nameFor(e.gs)}
                  </Text>
                  <Text style={styles.cardPct}>{pct}%</Text>
                  {/* Deck toggle right in the collapsed row (user request 2026-07-24):
                      add/remove from the study deck without expanding. Core-locked
                      topics stay on and can't be toggled. */}
                  <Pressable
                    onPress={coreLocked ? undefined : () => toggleActive(e.gs)}
                    disabled={coreLocked}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: coreLocked, selected: showActive }}
                    accessibilityLabel={coreLocked ? 'Locked in your study deck' : showActive ? 'Remove from study deck' : 'Add to study deck'}
                  >
                    <DeckIcon color={showActive ? colors.blue : GRAY} fill={showActive ? BLUE : '#8a8a8a'} size={22} />
                  </Pressable>
                  {/* Study icon alongside the 3-card icon (owner 2026-08-01): lit +
                      opens the Dashboard when the topic is in the deck. */}
                  <Pressable
                    onPress={showActive ? () => goStudy(e.gs) : undefined}
                    disabled={!showActive}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: !showActive }}
                    accessibilityLabel={showActive ? `Study ${nameFor(e.gs)}` : 'Load into the deck to study'}
                  >
                    <NavIcon icon="Study" lit={showActive} showLabel={false} />
                  </Pressable>
                </Pressable>
                </Animated.View>
              );
            }
            return (
              <Animated.View
                key={e.gs}
                {...containerPan(tid, moveThis).panHandlers}
                {...(customOrder ? reorderTouchProps(tid) : {})}
                {...rowLayoutProps(tid)}
                style={liftStyle(tid)}
              >
              <View
                style={[
                  styles.card,
                  !e.active && styles.cardInactive,
                  isCore && styles.cardCore,
                ]}
              >
                {/* Row 1 — collapse triangle · white title. Press-HOLD the card
                    ~1s to lift it, then drag up/down to reorder (user request
                    2026-07-23; the ☰ handle was removed). */}
                <View style={styles.cardTop}>
                  <Pressable style={styles.collapseBtn} onPress={() => toggleCollapse(tid)} hitSlop={6} accessibilityRole="button" accessibilityLabel={`Collapse ${nameFor(e.gs)}`}>
                    <Text style={styles.collapseTri}>▾</Text>
                  </Pressable>
                  <Text style={[styles.cardName, !e.active && styles.dim]} numberOfLines={2}>
                    {nameFor(e.gs)}
                    {/* Completed (100%) → amber SPECIALIST after the name (user
                        request 2026-07-25). */}
                    {pct >= 100 ? <Text style={styles.specialistTag}>  SPECIALIST</Text> : null}
                  </Text>
                </View>
                {/* Row 2 — subject on the left; ACTIVE + Study dropped BELOW the
                    title on the right (user request 2026-07-22). */}
                <View style={styles.cardActionRow}>
                  <Text style={[styles.cardSubject, !e.active && styles.dim]} numberOfLines={1}>
                    {subjectFor(e.gs)}
                    {free && !isCore ? '  ·  Free' : ''}
                  </Text>
                  {/* Required core courses labelled in green (user request
                      2026-07-22). */}
                  {isCore ? <Text style={styles.requiredTag}>Required</Text> : null}
                  <View style={{ flex: 1 }} />
                  {/* Core required courses are LOCKED into the deck until completed
                      (user request 2026-07-24): a "🔒 until completed" caption sits
                      beside the 3-card icon, and the toggle can't turn them off. */}
                  {coreLocked ? (
                    <Text style={styles.lockCaption} numberOfLines={1}>
                      🔒 until completed
                    </Text>
                  ) : null}
                  {/* Deck-of-cards = loaded into the Dashboard deck. Green when in
                      the deck, gray when not; tap toggles (user request 2026-07-23). */}
                  <Pressable hitSlop={6}
                    style={styles.bookToggle}
                    onPress={coreLocked ? undefined : () => toggleActive(e.gs)}
                    disabled={coreLocked}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: coreLocked, selected: showActive }}
                    accessibilityLabel={
                      coreLocked ? 'Locked in your study deck until completed' : showActive ? 'Remove from study deck' : 'Add to study deck'
                    }
                  >
                    <DeckIcon color={showActive ? colors.blue : GRAY} fill={showActive ? BLUE : '#8a8a8a'} size={33} />
                  </Pressable>
                  {/* Study icon LINKED to the deck toggle (user request 2026-07-23):
                      blue when the topic is loaded into the deck, gray when not;
                      blue = tap to open the Dashboard with it loaded. */}
                  <Pressable hitSlop={6}
                    style={styles.studyNavBtn}
                    onPress={showActive ? () => goStudy(e.gs) : undefined}
                    disabled={!showActive}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: !showActive }}
                    accessibilityLabel={showActive ? `Study ${nameFor(e.gs)}` : 'Load into the deck to study'}
                  >
                    <NavIcon icon="Study" lit={showActive} />
                  </Pressable>
                </View>
                {/* Row 3 — progress meter, Home toggle, and the LOWERED, press-
                    HOLD-to-confirm Remove (safe from accidental taps near Study,
                    user request 2026-07-22). */}
                <View style={styles.cardMeterRow}>
                  <LedMeter filled={segmentsForPct(pct)} segWidth={5} />
                  <Text style={styles.cardPct}>{pct}%</Text>
                  <View style={{ flex: 1 }} />
                  {/* Cores carry NO manual Home toggle — their slots are auto-
                      reserved/freed (user request 2026-07-22). */}
                  {!isCore ? (
                    <Pressable
                      style={styles.homeToggle}
                      onPress={() => toggleOnHome(e.gs)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: homeSet.has(e.gs) }}
                      accessibilityLabel={homeSet.has(e.gs) ? 'Remove from Home screen' : 'Add to Home screen'}
                    >
                      <HomeIcon color={homeSet.has(e.gs) ? colors.amber : GRAY} filled={homeSet.has(e.gs)} size={20} />
                    </Pressable>
                  ) : null}
                  {!coreLocked ? (
                    <HoldToRemove onComplete={() => removeTopic(e.gs)} accessibilityLabel="Remove from enrollment" />
                  ) : null}
                </View>
              </View>
              </Animated.View>
            );
          })
        )}

        {/* MY RECORD — the completion folder, pinned to the bottom of the My
            Enrollment area. Appears once the first item is completed (user
            request 2026-07-23). Completed items are color-coded by kind. */}
        {recordItems.length > 0 ? (
          <View style={styles.recordFolder}>
            <Pressable
              style={styles.recordHead}
              onPress={() => setRecordOpen((v) => !v)}
              accessibilityRole="button"
              accessibilityState={{ expanded: recordOpen }}
              accessibilityLabel={`My Record — ${recordItems.length} completed`}
            >
              <Text style={styles.recordTri}>{recordOpen ? '▾' : '▸'}</Text>
              <Text style={styles.recordFolderIcon}>🗂</Text>
              <Text style={styles.recordTitle}>MY RECORD</Text>
              <View style={{ flex: 1 }} />
              <Text style={styles.recordCount}>{recordItems.length}</Text>
            </Pressable>
            {recordOpen ? (
              <View style={styles.recordBody}>
                {recordItems.map((it) => {
                  const c =
                    it.kind === 'cert' ? BLUE : it.kind === 'program' ? PURPLE : it.kind === 'subject' ? colors.amber : '#ffffff';
                  const label =
                    it.kind === 'cert' ? 'CERT' : it.kind === 'program' ? 'PROGRAM' : it.kind === 'subject' ? 'SUBJECT' : 'TOPIC';
                  return (
                    <View key={it.id} style={styles.recordRow}>
                      <Text style={[styles.recordKind, { color: c, borderColor: c }]}>{label}</Text>
                      <Text style={styles.recordRowText} numberOfLines={1}>
                        {it.name}
                      </Text>
                      <Text style={styles.recordCheck}>✓</Text>
                    </View>
                  );
                })}
              </View>
            ) : null}
          </View>
        ) : null}

        </View>
        </View>

        {/* BROWSE & ADD header + tabs. Certificates/Programs can be added whole
            (ADD ALL → a bundle) or expanded to add topics. */}
        <View style={styles.browseHeader} onLayout={(e) => (browseY.current = e.nativeEvent.layout.y)}>
          {/* White collapse triangle — hides the LIST while keeping the title +
              filter tabs (user request 2026-07-23). */}
          <Pressable
            style={styles.browseTitleRow}
            onPress={() => setBrowseOpen((v) => !v)}
            accessibilityRole="button"
            accessibilityState={{ expanded: browseOpen }}
            accessibilityLabel="Collapse or expand the browse list"
          >
            <Text style={styles.browseTri}>{browseOpen ? '▾' : '▸'}</Text>
            <Text style={styles.sectionHead}>BROWSE & ADD</Text>
          </Pressable>
          {renderBrowseTabs()}
        </View>

        {/* Browse list — hidden when collapsed. */}
        {browseOpen ? (
        <View>
          {browseTab === 'cert'
            ? SPECIALIZED_CERTIFICATES.map((c) => {
                const key = `cert:${c.name}`;
                // Marked (REMOVE ALL) when the whole award is in the list — either
                // a stored bundle OR every topic already enrolled — so the entire
                // award can be deleted from here (user request 2026-07-23).
                const added =
                  bundleKeySet.has(key) ||
                  (c.specializationTopics.length > 0 && c.specializationTopics.every((gs) => enrolledGs.has(gs)));
                const open = openItem === key;
                return (
                  <View key={c.name} style={styles.subjectCard}>
                    <View style={styles.browseItemHead}>
                      <Pressable style={styles.browseItemName} onPress={() => setOpenItem(open ? null : key)} accessibilityRole="button" accessibilityLabel={c.name}>
                        <Text style={styles.subjectChevron}>{open ? '▾' : '▸'}</Text>
                        <Text style={[styles.subjectName, { color: BLUE }]} numberOfLines={1}>
                          {c.name}
                        </Text>
                      </Pressable>
                      <Pressable style={[styles.addAllBtn, added && styles.removeAllBtn]} onPress={() => (added ? removeWhole('cert', c.name, c.specializationTopics) : addWholeCert(c.name, c.specializationTopics))} accessibilityRole="button" accessibilityLabel={added ? `Remove all ${c.name}` : `Add whole ${c.name}`}>
                        <Text style={[styles.addAllText, added && styles.removeAllText]}>{added ? 'REMOVE ALL' : 'ADD ALL'}</Text>
                      </Pressable>
                    </View>
                    {open ? c.specializationTopics.map((gs) => topicAddRow(gs)) : null}
                  </View>
                );
              })
            : browseTab === 'program'
              ? PROGRAM_PATHS.map((p) => {
                  const key = `program:${p.name}`;
                  const added =
                    bundleKeySet.has(key) ||
                    (p.requiredTopics.length > 0 && p.requiredTopics.every((gs) => enrolledGs.has(gs)));
                  const open = openItem === key;
                  return (
                    <View key={p.name} style={styles.subjectCard}>
                      <View style={styles.browseItemHead}>
                        <Pressable style={styles.browseItemName} onPress={() => setOpenItem(open ? null : key)} accessibilityRole="button" accessibilityLabel={p.name}>
                          <Text style={styles.subjectChevron}>{open ? '▾' : '▸'}</Text>
                          <Text style={[styles.subjectName, { color: PURPLE }]} numberOfLines={1}>
                            {p.name}
                          </Text>
                        </Pressable>
                        <Pressable style={[styles.addAllBtn, added && styles.removeAllBtn]} onPress={() => (added ? removeWhole('program', p.name, p.requiredTopics) : addWholeProgram(p.name, p.requiredTopics))} accessibilityRole="button" accessibilityLabel={added ? `Remove all ${p.name}` : `Add whole ${p.name}`}>
                          <Text style={[styles.addAllText, added && styles.removeAllText]}>{added ? 'REMOVE ALL' : 'ADD ALL'}</Text>
                        </Pressable>
                      </View>
                      {open ? p.requiredTopics.map((gs) => topicAddRow(gs)) : null}
                    </View>
                  );
                })
              : browseTab === 'topic'
                ? <View style={styles.subjectCard}>{allTopicsAZ.map((t) => topicAddRow(t.gs, t.name))}</View>
                : browseTab === 'field'
                ? v3Fields.map((f) => {
                    const open = openField === f.order;
                    const fieldGs = f.topics.map((t) => t.gs);
                    const addable = fieldGs.filter((gs) => !isFreeEnrollGs(gs));
                    const added = addable.length > 0 && addable.every((gs) => enrolledGs.has(gs));
                    return (
                      <View key={f.order} style={styles.subjectCard}>
                        <View style={styles.browseItemHead}>
                          <Pressable style={styles.browseItemName} onPress={() => setOpenField((prev) => (prev === f.order ? null : f.order))} accessibilityRole="button" accessibilityState={{ expanded: open }} accessibilityLabel={f.name}>
                            <Text style={styles.subjectChevron}>{open ? '▾' : '▸'}</Text>
                            <Text style={[styles.subjectName, { color: colors.green }]} numberOfLines={2}>{f.name}</Text>
                          </Pressable>
                          <Pressable style={[styles.addAllBtn, added && styles.removeAllBtn]} onPress={() => (added ? removeWholeField(fieldGs) : addWholeField(fieldGs))} accessibilityRole="button" accessibilityLabel={added ? `Remove all topics in ${f.name}` : `Add all topics in ${f.name}`}>
                            <Text style={[styles.addAllText, added && styles.removeAllText]}>{added ? 'REMOVE ALL' : 'ADD ALL'}</Text>
                          </Pressable>
                        </View>
                        {open ? f.topics.map((t) => topicAddRow(t.gs, t.name)) : null}
                      </View>
                    );
                  })
                : v3Subjects.map((s, i) => {
                    const open = openSubject === s.order;
                    // Whole-subject add (user request 2026-07-22) — amber ADD ALL
                    // mirroring certs/programs; creates one subject bundle.
                    const key = `subject:${s.name}`;
                    const added = bundleKeySet.has(key);
                    const subjectGs = s.topics.map((t) => t.gs);
                    // Field header shown once per field group (owner 2026-08-06:
                    // browse is organized FIELD → SUBJECT → TOPIC).
                    const showField = i === 0 || v3Subjects[i - 1].field !== s.field;
                    return (
                      <View key={s.order} style={styles.subjectCard}>
                        {showField ? (
                          <Text style={[styles.subjectName, { color: colors.textSub, fontSize: 12, letterSpacing: 1, marginBottom: 4 }]} numberOfLines={1}>
                            {s.field.toUpperCase()}
                          </Text>
                        ) : null}
                        <View style={styles.browseItemHead}>
                          <Pressable style={styles.browseItemName} onPress={() => setOpenSubject((prev) => (prev === s.order ? null : s.order))} accessibilityRole="button" accessibilityState={{ expanded: open }} accessibilityLabel={s.name}>
                            <Text style={styles.subjectChevron}>{open ? '▾' : '▸'}</Text>
                            <Text style={[styles.subjectName, { color: colors.amber }]} numberOfLines={1}>
                              {s.name}
                            </Text>
                          </Pressable>
                          <Pressable style={[styles.addAllBtn, added && styles.removeAllBtn]} onPress={() => (added ? removeWhole('subject', s.name, subjectGs) : addWholeSubject(s.name, subjectGs))} accessibilityRole="button" accessibilityLabel={added ? `Remove all ${s.name}` : `Add all topics in ${s.name}`}>
                            <Text style={[styles.addAllText, added && styles.removeAllText]}>{added ? 'REMOVE ALL' : 'ADD ALL'}</Text>
                          </Pressable>
                        </View>
                        {open ? s.topics.map((t) => topicAddRow(t.gs, t.name)) : null}
                      </View>
                    );
                  })}
        </View>
        ) : null}

        {/* Bottom actions: return to top + global expand/collapse of every
            enrollment-list container (user request 2026-07-24). */}
        <View style={styles.bottomActions}>
          {/* Bottom-left: a fixed SQUARE red ✕. Tapping it opens the clear-list
              confirm popup (with a press-hold to confirm) — it never grows or
              reflows the row (owner 2026-08-01). */}
          <Pressable hitSlop={6}
            style={styles.clearSquareBtn}
            onPress={() => setClearConfirmOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Clear enrollment list"
          >
            <Text style={styles.clearSquareText}>✕</Text>
          </Pressable>
          <Pressable
            style={styles.bottomBtn}
            onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}
            accessibilityRole="button"
            accessibilityLabel="Return to top"
          >
            <Text style={styles.returnTopText}>↑ TOP</Text>
          </Pressable>
          <Pressable
            style={styles.bottomBtn}
            onPress={() => setCollapsed(new Set())}
            accessibilityRole="button"
            accessibilityLabel="Expand all containers"
          >
            <Text style={styles.returnTopText}>▾ EXPAND ALL</Text>
          </Pressable>
          <Pressable
            style={styles.bottomBtn}
            onPress={() =>
              setCollapsed(new Set([...enrolled.map((e) => `t:${e.gs}`), ...bundles.map((b) => b.key)]))
            }
            accessibilityRole="button"
            accessibilityLabel="Collapse all containers"
          >
            <Text style={styles.returnTopText}>▸ COLLAPSE ALL</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Pinned BROWSE & ADD tab bar — an absolute overlay OUTSIDE the ScrollView
          (so its buttons stay tappable, unlike a sticky header). Appears once the
          browse section scrolls to the top (user request 2026-07-22). */}
      {pinned ? (
        <View style={styles.pinnedBar}>
          <Text style={styles.pinnedLabel}>BROWSE & ADD</Text>
          {renderBrowseTabs()}
        </View>
      ) : null}

      <PrePaywallPrompt
        visible={payPrompt}
        onClose={() => setPayPrompt(false)}
        title="Create Your Learning Path"
        lines={[
          'Custom enrollment lets you organize exactly what you want to study and track your progress across the academy.',
          'This feature is included with an active membership.',
        ]}
        primaryLabel="EXPLORE MEMBERSHIP?"
        onPrimary={() => {
          setPayPrompt(false);
          navigation.navigate('Paywall');
        }}
        dismissLabel="RETURN"
      />

      {/* Home screen full (20-card cap) — brief warning. */}
      <PrePaywallPrompt
        visible={homeFull}
        onClose={() => setHomeFull(false)}
        title="Home screen is full"
        lines={[`You can place up to ${HOME_MAX} topics on your Home screen.`, 'Remove one first to add another.']}
      />

      {/* Clear-list confirm popup — press-and-HOLD the red bar to confirm the
          reset; the ✕ square opens it (owner 2026-08-01). */}
      <Modal accessibilityViewIsModal
        visible={clearConfirmOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setClearConfirmOpen(false)}
      >
        <View style={styles.clearBackdrop}>
          <Pressable accessibilityRole="button" style={StyleSheet.absoluteFill} onPress={() => setClearConfirmOpen(false)} accessibilityLabel="Dismiss" />
          <View style={styles.clearCard}>
            <Text style={styles.clearTitle}>Clear enrollment list?</Text>
            <Text style={styles.clearBody}>
              This resets your enrollment list to the new-user default. Your progress is kept — add any
              topic back from the Browse &amp; Add lists below.
            </Text>
            <HoldToActivate
              label="HOLD TO CLEAR LIST"
              holdingLabel="CLEARING"
              tint="#e0342f"
              onComplete={() => {
                setClearConfirmOpen(false);
                resetEnrollment();
              }}
            />
            <Pressable style={styles.clearCancel} onPress={() => setClearConfirmOpen(false)} accessibilityRole="button" accessibilityLabel="Cancel">
              <Text style={styles.clearCancelText}>CANCEL</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Home screen customizer (paid). */}
      <HomeSetupSheet visible={homeSetupOpen} onClose={() => setHomeSetupOpen(false)} paid={paid} />

      {/* Custom-list terms popup — SEE & EDIT (user request 2026-07-24). Mirrors
          the flashcards held-filter list; TermSelectIcons edit membership inline. */}
      <Modal accessibilityViewIsModal visible={customListOpen} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setCustomListOpen(false)}>
        <View style={styles.clBackdrop}>
          <Pressable
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            onPress={() => setCustomListOpen(false)}
            accessibilityRole="button"
            accessibilityLabel="Dismiss"
          />
          <View style={styles.clCard}>
            <Text style={styles.clTitle}>MY CUSTOM LIST · {customListRows?.length ?? 0}</Text>
            <ScrollView style={{ flexGrow: 0 }} showsVerticalScrollIndicator>
              {customListRows == null ? (
                <Text style={styles.clEmpty}>Loading…</Text>
              ) : customListRows.length > 0 ? (
                customListRows.map((r) => (
                  <View key={r.id} style={styles.clRow}>
                    <Text style={styles.clItem} numberOfLines={1}>
                      {r.term}
                    </Text>
                    {/* Enrollments can't bookmark terms — show ONLY the custom-list
                        icon (no bookmark, no ✓/✗) (user request 2026-07-25). */}
                    <TermSelectIcons id={r.id} bookmarkCtx="glossary" hideBookmark hideKnown />
                  </View>
                ))
              ) : (
                <Text style={styles.clEmpty}>No terms yet — star terms in the Glossary to build this list.</Text>
              )}
            </ScrollView>
            <Pressable style={styles.clClose} onPress={() => setCustomListOpen(false)} accessibilityRole="button" accessibilityLabel="Close">
              <Text style={styles.clCloseText}>CLOSE</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 16, paddingTop: 10, gap: 8 },
  // Top block above the sticky BROWSE & ADD header — keeps the inter-card rhythm
  // the ScrollView's own gap used to provide (user request 2026-07-22).
  topBlock: { gap: 8 },
  // Green frame around the whole My Enrollment area — title → last container
  // (user request 2026-07-22).
  myEnrollArea: { gap: 8, borderWidth: 1.5, borderColor: 'rgba(55,224,95,.55)', borderRadius: 12, padding: 10 },
  // MY RECORD folder — white nested container of completed items (user request 2026-07-23).
  recordFolder: { borderWidth: 1.5, borderColor: 'rgba(255,255,255,.5)', borderRadius: 10, backgroundColor: '#131313', overflow: 'hidden', marginTop: 2 },
  recordHead: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 12 },
  recordTri: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, color: colors.textSecondary },
  recordFolderIcon: { fontSize: 15 },
  recordTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.4, color: colors.textPrimary },
  recordCount: { fontFamily: fonts.mono, fontSize: 12.5, color: colors.textSub },
  recordBody: { borderTopWidth: 1, borderTopColor: '#242424' },
  recordRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingHorizontal: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#1e1e1e' },
  recordKind: { fontFamily: fonts.oswaldSemiBold, fontSize: 8.5, letterSpacing: 0.6, borderWidth: 1, borderRadius: 4, paddingVertical: 1.5, paddingHorizontal: 5, overflow: 'hidden' },
  recordRowText: { flex: 1, fontFamily: fonts.barlowMedium, fontSize: 14, color: colors.textSecondary },
  recordCheck: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, color: '#37e05f' },
  // BROWSE & ADD header (scrolls normally — no longer a sticky header, whose
  // touch handling was eating tab taps; user report 2026-07-22).
  browseHeader: { paddingTop: 4, paddingBottom: 6 },
  // BROWSE & ADD collapse row — white triangle + title (user request 2026-07-23).
  browseTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  browseTri: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, color: '#ffffff' },
  // Pinned tab bar — absolute overlay at the very top, above the ScrollView.
  pinnedBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.screenBg,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#242424',
    zIndex: 50,
    elevation: 12,
  },
  pinnedLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.6, color: GREEN, marginBottom: 4 },
  // Bottom action row: return-to-top + expand/collapse all.
  bottomActions: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  bottomBtn: {
    borderWidth: 1,
    borderColor: '#3a3a3a',
    backgroundColor: '#161616',
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  // Fixed SQUARE red ✕ that opens the clear-list confirm popup (owner 2026-08-01)
  // — a constant size, so it never grows or wraps the bottom action row.
  clearSquareBtn: {
    width: 38,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0342f',
    backgroundColor: '#1a0f0e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearSquareText: { fontFamily: fonts.oswaldSemiBold, fontSize: 17, lineHeight: 20, color: '#e0342f' },
  clearBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  clearCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#3a2020',
    backgroundColor: '#151517',
    padding: 18,
    gap: 12,
  },
  clearTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 17, letterSpacing: 0.4, color: colors.textPrimary },
  clearBody: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  clearCancel: { alignSelf: 'center', paddingVertical: 8, paddingHorizontal: 16 },
  clearCancelText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1, color: colors.textSub },
  returnTopBtn: {
    alignSelf: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    backgroundColor: '#161616',
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 18,
  },
  returnTopText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 0.6, color: colors.textSecondary },

  // Slim Continue banner (notification height).
  continueBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    // WHITE container border (owner 2026-07-31); the eyebrow stays amber, the
    // name white, and the Study icon blue — only the border colour changes.
    borderColor: 'rgba(255,255,255,.85)',
    backgroundColor: '#1c1708',
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  continueEyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 1.4, color: colors.amber },
  continueName: { fontFamily: fonts.oswaldMedium, fontSize: 16, color: colors.textPrimary, marginTop: 1 },
  continueCta: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 0.6, color: colors.amber },

  // "My Custom List" bar — blue-framed sibling of the continue banner.
  customBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(127,191,255,.55)',
    backgroundColor: '#0d1626',
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  customIcon: { width: 40, alignItems: 'center', justifyContent: 'center' },
  customEyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 1.4, color: BLUE },
  customName: { fontFamily: fonts.oswaldMedium, fontSize: 16, color: colors.textPrimary, marginTop: 1 },
  customSeeEdit: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 0.6, color: BLUE },
  // OFF state: gray border + dimmed (de-blued) background.
  customBarOff: { borderColor: 'rgba(255,255,255,.18)', backgroundColor: '#141619' },
  // SEE & EDIT term-list popup.
  clBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  clCard: { width: '100%', maxWidth: 460, maxHeight: '80%', backgroundColor: '#141414', borderRadius: 12, borderWidth: 1, borderColor: '#2a2a2a', padding: 14, gap: 8 },
  clTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.2, color: BLUE, marginBottom: 2 },
  clRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#1e1e1e' },
  clItem: { flex: 1, fontFamily: fonts.barlowRegular, fontSize: 15, color: '#2f9bff' },
  clEmpty: { fontFamily: fonts.barlowRegular, fontStyle: 'italic', fontSize: 14, color: colors.textSub, paddingVertical: 10 },
  clClose: { marginTop: 8, alignItems: 'center', paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#3a3a3a' },
  clCloseText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.4, color: colors.textSubAlt },

  sectionHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.6, color: GREEN, marginTop: 4 },

  listHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  listCount: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 0.6, color: colors.textSecondary, marginTop: 1 },
  // HOME SETUP — amber (user request 2026-07-23).
  homeSetupBtn: { borderWidth: 1, borderColor: 'rgba(255,198,77,.6)', backgroundColor: 'rgba(255,198,77,.1)', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10 },
  homeSetupText: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 0.6, color: colors.amber },
  // BROWSE & ADD jump button — green (user request 2026-07-22).
  jumpBtn: { borderWidth: 1, borderColor: 'rgba(55,224,95,.6)', backgroundColor: 'rgba(55,224,95,.1)', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10 },
  jumpText: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 0.6, color: GREEN },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderWidth: 1, borderColor: '#333', borderRadius: 14, paddingVertical: 4, paddingHorizontal: 11, backgroundColor: '#161616' },
  chipOn: { borderColor: colors.amber, backgroundColor: 'rgba(255,198,77,.12)' },
  chipText: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 0.6, color: colors.textSub },
  chipTextOn: { color: colors.amber },
  empty: { fontFamily: fonts.barlowRegular, fontStyle: 'italic', fontSize: 13.5, color: colors.textSub },

  // Collapse control + collapsed (thin title + %) row (user request 2026-07-22).
  collapseBtn: { paddingRight: 2, paddingVertical: 2 },
  collapseTri: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, color: colors.textSub },
  collapsedCard: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  collapsedTitle: { flex: 1, fontFamily: fonts.oswaldMedium, fontSize: 14.5, color: colors.textPrimary },
  // Enrollment TOPIC cards — WHITE border (border key: cert=blue · program=purple
  // · topic=white · subject=amber) — user request 2026-07-23.
  card: { borderWidth: 1, borderColor: 'rgba(255,255,255,.5)', borderRadius: 11, backgroundColor: '#161616', paddingVertical: 9, paddingHorizontal: 11, gap: 4 },
  cardInactive: { backgroundColor: '#111', borderColor: 'rgba(255,255,255,.18)' },
  // Required core courses — green FILL, but WHITE border like other topics (user
  // request 2026-07-23; border color comes from `card`).
  cardCore: { backgroundColor: '#0f1f14' },
  // The 4th requisite Foundations LAB container (owner 2026-07-30): green like a
  // core, a hair brighter border to read as a link, no 3-card deck icon.
  // Lifted (held) card during reorder — pops out with a shadow (user request 2026-07-23).
  cardLifted: {
    borderColor: 'rgba(255,255,255,.95)',
    backgroundColor: '#20201c',
    zIndex: 30,
    elevation: 16,
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  // "Required" label inside a core card — green.
  requiredTag: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 0.6, color: GREEN },
  lockCaption: { fontFamily: fonts.oswaldSemiBold, fontSize: 9, letterSpacing: 0.2, color: GREEN, marginRight: 3, textAlign: 'right' },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardName: { flex: 1, fontFamily: fonts.oswaldMedium, fontSize: 16, letterSpacing: 0.2, color: colors.textPrimary },
  // "SPECIALIST" badge appended to a completed topic's name — amber.
  specialistTag: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.amberDeep },
  handle: { paddingHorizontal: 4, paddingVertical: 2 },
  handleIcon: { fontFamily: fonts.oswaldSemiBold, fontSize: 17, color: colors.textSub },
  // flexShrink so a long subject truncates instead of pushing the deck/study
  // icons off the right edge on narrow screens (user report 2026-07-25, Pixel).
  cardSubject: { flexShrink: 1, fontFamily: fonts.barlowRegular, fontSize: 12, color: colors.textSub },
  dim: { opacity: 0.5 },
  cardSubRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  // Subject + ACTIVE/Study buttons row, dropped below the full-width title.
  cardActionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  cardMeterRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  cardPct: { fontFamily: fonts.mono, fontSize: 12.5, color: colors.textSecondary },
  pill: { borderWidth: 1, borderRadius: 6, paddingVertical: 4, paddingHorizontal: 9 },
  activeOn: { borderColor: 'rgba(55,224,95,.55)', backgroundColor: 'rgba(55,224,95,.1)' },
  activeOff: { borderColor: '#333', backgroundColor: '#121212' },
  pillText: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 0.8 },
  studyBtn: { borderRadius: 6, paddingVertical: 4, paddingHorizontal: 10, borderWidth: 1 },
  // Study control that mirrors the bottom-nav STUDY icon (user request 2026-07-23).
  // Fixed-width slots so every row's study icon + deck toggle line up in
  // vertical columns on the right (user request 2026-07-24).
  studyNavBtn: { width: 42, paddingVertical: 2, alignItems: 'center', justifyContent: 'center' },
  // Open-book toggle = topic loaded into the study deck (user request 2026-07-23).
  bookToggle: { width: 42, paddingVertical: 3, alignItems: 'center', justifyContent: 'center' },
  // Award "STUDY ALL" (blue) — loads every topic into the deck.
  studyAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: 'rgba(127,191,255,.6)', backgroundColor: 'rgba(127,191,255,.12)', borderRadius: 7, paddingVertical: 5, paddingHorizontal: 10 },
  studyAllText: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 0.6, color: BLUE },
  // Award "ADD TOPICS" / "REMOVE TOPICS" (light gray) — list membership.
  addTopicsBtn: { borderWidth: 1, borderColor: '#3a3a3a', backgroundColor: '#1c1c1c', borderRadius: 7, paddingVertical: 6, paddingHorizontal: 10 },
  addTopicsText: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 0.6, color: colors.textSecondary },
  removeTopicsBtn: { borderWidth: 1, borderColor: '#3a3a3a', backgroundColor: '#1c1c1c', borderRadius: 7, paddingVertical: 6, paddingHorizontal: 10 },
  removeTopicsText: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 0.6, color: colors.textSecondary },
  // Gray, inactive "Take Final Exam" placeholder in award containers.
  finalExamBtn: { alignSelf: 'stretch', alignItems: 'center', borderWidth: 1, borderColor: '#3a3a3a', backgroundColor: '#1a1a1a', borderRadius: 7, paddingVertical: 8, marginTop: 2, opacity: 0.7 },
  finalExamText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1, color: colors.textMuted },
  studyOn: { backgroundColor: 'rgba(127,191,255,.14)', borderColor: 'rgba(127,191,255,.6)' },
  studyOff: { backgroundColor: '#121212', borderColor: '#333' },
  studyText: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 0.6 },
  homeToggle: { paddingVertical: 3, paddingHorizontal: 4 },
  removeBtn: { paddingVertical: 4, paddingHorizontal: 5 },
  // Press-HOLD remove — bordered so it reads as a deliberate action, lowered
  // onto the meter row away from Study (user request 2026-07-22). overflow clips
  // the animated fill to the rounded corners.
  removeHoldBtn: { borderWidth: 1, borderColor: '#3a2a2a', borderRadius: 6, paddingVertical: 4, paddingHorizontal: 8, overflow: 'hidden' },
  // The left→right fill that grows while the button is held (user request 2026-07-23).
  holdFill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: 'rgba(255,107,107,0.32)' },
  removeText: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 0.6, color: colors.textSub },

  cardControls: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  // Bundle (cert/program) registry containers.
  bundleCard: { borderWidth: 1.5, borderRadius: 12, paddingVertical: 9, paddingHorizontal: 11, gap: 5 },
  bundleCert: { borderColor: 'rgba(127,191,255,.6)', backgroundColor: '#0e1a26' },
  bundleProgram: { borderColor: 'rgba(196,162,255,.6)', backgroundColor: '#161225' },
  bundleSubject: { borderColor: 'rgba(255,198,77,.6)', backgroundColor: '#1c1708' },
  // Completed award — green FILL, type border kept (user request 2026-07-22).
  // Muted (not neon) green so the blue/purple border + light text stay legible.
  bundleDone: { backgroundColor: '#123322' },
  doneBadge: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 0.8, color: '#8fe6a8' },
  bundleTag: { fontFamily: fonts.oswaldSemiBold, fontSize: 9.5, letterSpacing: 0.8, borderWidth: 1, borderRadius: 5, paddingVertical: 2, paddingHorizontal: 6, overflow: 'hidden' },
  bundleMeta: { fontFamily: fonts.barlowRegular, fontSize: 12, color: colors.textSub },

  // Browse tabs + cert/program add-all rows.
  browseTabs: { flexDirection: 'row', gap: 6, marginTop: 8, marginBottom: 4 },
  browseTab: { flex: 1, borderWidth: 1, borderColor: '#333', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 3, alignItems: 'center', backgroundColor: '#161616' },
  browseTabOn: { borderColor: colors.amber, backgroundColor: 'rgba(255,198,77,.12)' },
  browseTabText: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 0.4, color: colors.textSub },
  browseTabTextOn: { color: colors.amber },
  browseItemHead: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 9, paddingHorizontal: 12 },
  browseItemName: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  addAllBtn: { borderWidth: 1, borderColor: 'rgba(55,224,95,.6)', backgroundColor: 'rgba(55,224,95,.1)', borderRadius: 6, paddingVertical: 5, paddingHorizontal: 9 },
  addedBtn: { borderColor: '#333', backgroundColor: '#121212' },
  addAllText: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 0.6, color: GREEN },
  addedText: { color: colors.textSub },
  // REMOVE ALL state — red (user request 2026-07-22).
  removeAllBtn: { borderColor: 'rgba(255,107,107,.6)', backgroundColor: 'rgba(255,107,107,.1)' },
  removeAllText: { color: '#ff6b6b' },

  // Browse menu.
  subjectCard: { borderWidth: 1, borderColor: '#232323', borderRadius: 9, backgroundColor: '#141414', overflow: 'hidden' },
  subjectHead: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 12 },
  subjectChevron: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, color: colors.textSub, width: 14 },
  subjectName: { flex: 1, fontFamily: fonts.oswaldMedium, fontSize: 15, color: colors.amber },
  subjectCount: { fontFamily: fonts.mono, fontSize: 12.5, color: colors.textSub },
  topicRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 9, paddingHorizontal: 14, borderTopWidth: 1, borderTopColor: '#1e1e1e' },
  topicRowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  topicCheck: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, color: colors.textMuted, width: 16, textAlign: 'center' },
  topicCheckOn: { color: GREEN },
  topicName: { flex: 1, fontFamily: fonts.barlowMedium, fontSize: 14.5, color: colors.textSecondary },
  topicNameOn: { color: colors.textPrimary },
  // "(in progress)" marker — amber italic (user request 2026-07-22).
  inProgress: { fontFamily: fonts.barlowMedium, fontStyle: 'italic', fontSize: 11.5, color: colors.amber },
  // Explicit remove-from-enrollment ✕ on browse rows.
  topicRemove: { paddingHorizontal: 6, paddingVertical: 2 },
  topicRemoveText: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, color: '#ff6b6b' },
});
