/**
 * S17 — Glossary (visuals from 19-s17-glossary.dc.html) + Booth change order
 * 2026-07-07:
 *  - ALL = every term in the corpus (3,300+; fetched in 1000-row pages past
 *    the PostgREST cap), not just enrolled courses.
 *  - COURSE filter narrows in place via a course-chip picker (all 9).
 *  - TOPIC filter narrows in place via a topic-chip picker (all 51 topics,
 *    active or not), showing only that topic's terms.
 *  - Reachable with no context (Glossary card on Course Selection); Dashboard
 *    entry preselects its course/topic.
 * Search by term · empty: "No results for [filter]" · bottom nav visible.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MethodIcon } from '../../components/MethodIcon';
import { CoachMark } from '../../components/CoachMark';
import { ShareIcon } from '../../components/ShareIcon';
import { ShareTermSheet, type ShareTermPayload } from '../../components/ShareTermSheet';
import { HoldHintPressable } from '../../features/flags/TermSelectIcons';
import { SpeakButton, stopAllSpeech } from '../../components/SpeakButton';
import { useEntitlement } from '../../features/commercial/EntitlementProvider';
import { toggleFlagged, useFlagged } from '../../features/flags/flaggedStore';
import { ScreenIntroOverlay } from '../../features/intro/ScreenIntroOverlay';
import { COPY } from '../../lib/copy';
import { useCoachMark } from '../../lib/coachMark';
import { sendFeedback } from '../../lib/feedback';
import { isHazardTerm } from '../../lib/hazard';
import { CautionBadge } from '../../components/CautionBadge';
import { supabase } from '../../lib/supabase';
import { colors, fonts } from '../../theme/tokens';
import type { StudyStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<StudyStackParamList, 'Glossary'>;

type Entry = {
  id: string;
  term: string;
  definition: string;
  /** Spoken by the TTS speaker (Feature 2) — falls back to definition when unauthored. */
  plain_english: string | null;
  course_id: string;
  achievement_id: string | null;
};

/** Feature-2 utterance: the term, then a definition. DEFAULT = the first
 *  official definition (ADV); the header TTS switch selects the plain-English
 *  version instead (BEG) — Booth 2026-07-10. */
const speakTextFor = (e: Entry, beginner: boolean) =>
  `${e.term}. ${beginner ? e.plain_english || e.definition : e.definition}`;

const TTS_MODE_KEY = 'ape:ttsBeg';

// ---- FEATURE 1: term index + longest-match link segmentation (kickoff
// 2026-07-10). Precomputed ONCE per entries load (never per render); links go
// in the `definition` and `plain_english` fields only. ----

type TermIndex = {
  /** normalized full term (incl. parenthetical) → single id */
  exact: Map<string, string>;
  /** normalized base name (parenthetical stripped) → all sense ids */
  base: Map<string, string[]>;
  maxWords: number;
};

const normPhrase = (s: string) => s.toLowerCase().replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim();

function buildTermIndex(entries: Entry[]): TermIndex {
  const exact = new Map<string, string>();
  const base = new Map<string, string[]>();
  let maxWords = 1;
  for (const e of entries) {
    const full = normPhrase(e.term);
    exact.set(full, e.id);
    const baseName = normPhrase(e.term.replace(/\s*\([^)]*\)\s*$/, ''));
    if (baseName) {
      const list = base.get(baseName);
      if (list) list.push(e.id);
      else base.set(baseName, [e.id]);
      maxWords = Math.max(maxWords, baseName.split(' ').length, full.split(' ').length);
    }
  }
  return { exact, base, maxWords: Math.min(maxWords, 6) };
}

type LinkSeg = { text: string; ids?: string[] };

/** Split text into plain/linked segments: case-insensitive, whole-word,
 *  LONGEST match wins, no self-link, FIRST occurrence per field only
 *  (kickoff default — noted as the chosen open-question answer). */
function linkSegments(text: string, index: TermIndex, selfId: string): LinkSeg[] {
  const tokens = [...text.matchAll(/[A-Za-z0-9][A-Za-z0-9'’\-/&+]*/g)];
  const segs: LinkSeg[] = [];
  const linkedOnce = new Set<string>();
  let cursor = 0;
  let i = 0;
  while (i < tokens.length) {
    let hit: { ids: string[]; endTok: number; key: string } | null = null;
    const jMax = Math.min(i + index.maxWords - 1, tokens.length - 1);
    for (let j = jMax; j >= i; j--) {
      const start = tokens[i].index!;
      const end = tokens[j].index! + tokens[j][0].length;
      const phrase = normPhrase(text.slice(start, end));
      const idsRaw = index.exact.has(phrase) ? [index.exact.get(phrase)!] : index.base.get(phrase);
      const ids = idsRaw?.filter((id) => id !== selfId);
      if (ids && ids.length > 0) {
        if (!linkedOnce.has(phrase)) hit = { ids, endTok: j, key: phrase };
        break; // longest hit decides — already-linked phrases stay plain
      }
    }
    if (hit) {
      const start = tokens[i].index!;
      const end = tokens[hit.endTok].index! + tokens[hit.endTok][0].length;
      if (start > cursor) segs.push({ text: text.slice(cursor, start) });
      segs.push({ text: text.slice(start, end), ids: hit.ids });
      linkedOnce.add(hit.key);
      cursor = end;
      i = hit.endTok + 1;
    } else {
      i++;
    }
  }
  if (cursor < text.length) segs.push({ text: text.slice(cursor) });
  return segs;
}

/** Resolve a RELATED TERMS entry to its glossary id(s) (exact term, else base
 *  name → all senses), excluding self (Booth 2026-07-11). */
function linkIdsFor(term: string, index: TermIndex, selfId: string): string[] {
  const norm = normPhrase(term);
  const ids = index.exact.has(norm) ? [index.exact.get(norm)!] : index.base.get(norm);
  return (ids ?? []).filter((id) => id !== selfId);
}

/** Definition/plain-English text with tappable in-line term links. */
function LinkedText({
  text,
  style,
  selfId,
  index,
  onLink,
}: {
  text: string;
  style: object | object[];
  selfId: string;
  index: TermIndex | null;
  onLink: (ids: string[]) => void;
}) {
  const segs = useMemo(
    () => (index ? linkSegments(text, index, selfId) : [{ text } as LinkSeg]),
    [text, index, selfId],
  );
  return (
    <Text style={style}>
      {segs.map((s, i) =>
        s.ids ? (
          <Text key={i} style={styles.termLink} suppressHighlighting onPress={() => onLink(s.ids!)}>
            {s.text}
          </Text>
        ) : (
          <Text key={i}>{s.text}</Text>
        ),
      )}
    </Text>
  );
}
type CourseRef = { id: string; code: string; sequence: number };
type TopicRef = { id: string; name: string; course_id: string; sequence_in_course: number };
type Filter = 'all' | 'course' | 'topic' | 'favorites' | 'recent';

// Flagged-terms key now lives in features/flags/flaggedStore (FLAGGED_KEY) —
// same 'ape:glossaryFavs' storage, shared app-wide (Booth 2026-07-18).
const RECENT_KEY = 'ape:glossaryRecent';
const RECENT_CAP = 30;

/** Full record behind an expanded term (lazy-fetched on first tap). */
type EntryDetail = {
  plain_english: string | null;
  purpose_function: string | null;
  practical_application: string | null;
  scenario_contexts: string[] | null;
  common_mistakes: string[] | null;
  related_terms: string[] | null;
  category: string | null;
  difficulty: string | null;
};

const PAGE = 1000;

// iOS ScrollViews delay touch delivery to child buttons by default, making
// taps feel slow/unresponsive. This turns it off. (Valid RN prop; RN 0.86's
// type defs omit it, so it's spread untyped.)
const NO_TOUCH_DELAY = { delaysContentTouches: false } as Record<string, unknown>;

/** Booth 2026-07-07: the prerequisite course reads "SAFETY", not "SAFE". */
function courseLabel(code: string): string {
  return code === 'SAFE' ? 'SAFETY' : code;
}

/** One labeled category inside an expanded term (mirrors flashcard levels). */
function DetailSection({ label, text }: { label: string; text: string | null }) {
  if (!text) return null;
  return (
    <View style={styles.detailSection}>
      <Text style={styles.detailEyebrow}>{label}</Text>
      <Text style={styles.detailBody}>{text}</Text>
    </View>
  );
}

/** The 5 definition-category sections for an expanded term (shared by the
 *  list inline expand and the card-view popup). PLAIN ENGLISH gets cross-links
 *  when link props are provided (Feature 1 — linked fields are definition +
 *  plain_english ONLY, per the kickoff ruling). */
// "Behind the curtain" veil for locked content (Booth 2026-07-11): every letter
// / digit is replaced with a literal 'x' — NOT scrambled (Booth 2026-07-11 rule
// change). Bullets, spaces, newlines and punctuation are preserved so the reader
// sees the veiled *shape* of the wisdom they're missing, but none of the words.
function veilText(text: string): string {
  return text.replace(/[A-Za-z0-9]/g, 'x');
}
// Shown veiled when a term has no stored mistakes, so the section still teases.
const VEIL_PLACEHOLDER =
  '• The mistake that trips up almost everyone the first time.\n' +
  '• A subtle habit the manuals never warn you about.\n' +
  '• Get this right and you will sound like a seasoned pro.';

function TermDetails({
  d,
  selfId,
  index,
  onLink,
  definition,
  begFirst = false,
  commercial = false,
  commonMistakesLocked = false,
  term,
}: {
  d: EntryDetail;
  /** The term name — auto-tagged into a "suggest a correction" report. */
  term?: string;
  selfId?: string;
  index?: TermIndex | null;
  onLink?: (ids: string[]) => void;
  /** The official definition — used as the FIRST detail section in BEG mode,
   *  where plain-English is promoted to the top (Booth 2026-07-11). */
  definition?: string;
  /** BEG order: plain-English is at the top block, so the first detail section
   *  is the technical DEFINITION (adv order = the reverse). */
  begFirst?: boolean;
  /** CM4 (Booth 2026-07-11): commercial rendering — the Common Mistakes
   *  HEADING always shows; the body is entitlement-gated. */
  commercial?: boolean;
  commonMistakesLocked?: boolean;
}) {
  const linkable = selfId != null && index != null && onLink != null;
  const mistakesText = d.common_mistakes?.length
    ? d.common_mistakes.map((s) => `• ${s}`).join('\n')
    : null;
  // First section swaps with the mode: ADV shows PLAIN ENGLISH here (the
  // official definition sits at the top block); BEG shows the DEFINITION here
  // (plain-English sits at the top block).
  const firstLabel = begFirst ? 'DEFINITION' : 'PLAIN ENGLISH';
  const firstText = begFirst ? definition ?? null : d.plain_english;
  return (
    <View style={styles.detailBlock}>
      {isHazardTerm(term) ? <CautionBadge /> : null}
      {linkable && firstText ? (
        <View style={styles.detailSection}>
          <Text style={styles.detailEyebrow}>{firstLabel}</Text>
          <LinkedText text={firstText} style={styles.detailBody} selfId={selfId!} index={index!} onLink={onLink!} />
        </View>
      ) : (
        <DetailSection label={firstLabel} text={firstText} />
      )}
      <DetailSection
        label="PURPOSE & APPLICATION"
        text={[d.purpose_function, d.practical_application].filter(Boolean).join('\n\n') || null}
      />
      <DetailSection
        label="SCENARIOS"
        text={d.scenario_contexts?.length ? d.scenario_contexts.map((s) => `• ${s}`).join('\n') : null}
      />
      {commercial ? (
        // CM4: heading ALWAYS visible in commercial mode; body per
        // entitlement — locked = the verbatim §2 lock message.
        <View style={styles.detailSection}>
          <Text style={styles.detailEyebrow}>COMMON MISTAKES</Text>
          {commonMistakesLocked ? (
            // Locked: the server sends common_mistakes = NULL (never the real
            // text), so the veil is enciphered from a PLACEHOLDER only — we no
            // longer garble real content client-side. The teasing "wisdom behind
            // the curtain" drives conversion; the caption is the verbatim locked
            // copy (Booth 2026-07-11).
            <View style={styles.veilWrap}>
              <Text style={styles.veilText} selectable={false} accessibilityElementsHidden>
                {veilText(VEIL_PLACEHOLDER)}
              </Text>
              <LinearGradient
                pointerEvents="none"
                colors={['rgba(15,15,17,0)', 'rgba(15,15,17,0.85)']}
                style={styles.veilFade}
              />
              <Text style={styles.veilLock}>🔒 {COPY.lockCommonMistakes}</Text>
            </View>
          ) : (
            <Text style={styles.detailBody}>{mistakesText ?? '—'}</Text>
          )}
        </View>
      ) : (
        <DetailSection label="MISTAKES" text={mistakesText} />
      )}
      {d.related_terms?.length && linkable ? (
        // RELATED TERMS are TAPPABLE — each opens that term in the glossary
        // (Booth 2026-07-11). Terms with no glossary match render as plain pills.
        <View style={styles.detailSection}>
          <Text style={styles.detailEyebrow}>RELATED TERMS</Text>
          <View style={styles.relatedWrap}>
            {d.related_terms.map((t, i) => {
              const ids = linkIdsFor(t, index!, selfId!);
              return ids.length > 0 ? (
                <Text key={i} style={styles.relatedLink} suppressHighlighting onPress={() => onLink!(ids)}>
                  {t}
                </Text>
              ) : (
                <Text key={i} style={styles.relatedPlain}>
                  {t}
                </Text>
              );
            })}
          </View>
          {d.category ? <Text style={[styles.detailBody, { marginTop: 8 }]}>{d.category}</Text> : null}
        </View>
      ) : (
        <DetailSection
          label="RELATED TERMS"
          text={
            [
              d.related_terms?.length ? d.related_terms.map((s) => `• ${s}`).join('\n') : null,
              d.category || null, // difficulty (beg/int/adv) deliberately NOT shown
            ]
              .filter(Boolean)
              .join('\n\n') || null
          }
        />
      )}
      {/* Suggest a correction — auto-tags the term so it's clear which one
          (Booth 2026-07-11). Opens the mail composer pre-filled. */}
      <Pressable
        onPress={() => sendFeedback('correction', term)}
        accessibilityRole="button"
        accessibilityLabel="Suggest a correction"
        style={styles.suggestRow}
      >
        <Text style={styles.suggestIcon}>✎</Text>
        <Text style={styles.suggestText}>Suggest a correction</Text>
      </Pressable>
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: active }}>
      <LinearGradient
        colors={active ? ['#2a2008', '#1a1405'] : ['#222222', '#161616']}
        style={[styles.chip, { borderColor: active ? 'rgba(255,180,0,.65)' : '#3a3a3a' }]}
      >
        <Text style={[styles.chipText, { color: active ? '#ffc64d' : '#999999' }]}>{label.toUpperCase()}</Text>
      </LinearGradient>
    </Pressable>
  );
}

export function GlossaryScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { courseId: presetCourseId, achievementId: presetTopicId } = route.params ?? {};

  const [entries, setEntries] = useState<Entry[]>([]);
  const [courses, setCourses] = useState<CourseRef[]>([]);
  const [topics, setTopics] = useState<TopicRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const searchRef = useRef<TextInput>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [topicPickerOpen, setTopicPickerOpen] = useState(false);
  const [cardView, setCardView] = useState(false); // list (default) ↔ card view
  // TTS reads the OFFICIAL definition by default (ADV); BEG = plain English.
  const [ttsBeg, setTtsBeg] = useState(false);
  // CM4: commercial rendering — Common Mistakes gating + no academic course
  // filter in public UI (§1 naming rule). Server owns entitlement; we render.
  const { commercialMode, caps } = useEntitlement();
  const listRef = useRef<FlatList<Entry>>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, EntryDetail>>({});
  // Flagged terms (Booth 2026-07-18): ONE list shared with Flashcards and the
  // custom "Flagged" dashboard topic — lives in features/flags/flaggedStore
  // (same ape:glossaryFavs key, so previously starred terms carry over).
  const favs = useFlagged();
  // Self-retiring hint: "click term to expand" — hides after 2 expands, for
  // the first 5 glossary opens app-wide (lib/coachMark.ts).
  const coach = useCoachMark('ape:coach:glossary', 2);
  const [recent, setRecent] = useState<string[]>([]);

  const toggleFav = useCallback((id: string) => {
    toggleFlagged(id);
  }, []);

  // Share a term + its definition — now opens the PREVIEW pop-up first (user
  // request 2026-07-17); the native share sheet fires from its SHARE button.
  const [sharePayload, setSharePayload] = useState<ShareTermPayload | null>(null);
  const shareTerm = useCallback((e: Entry) => {
    setSharePayload({ term: e.term, definition: e.plain_english || e.definition });
  }, []);

  const recordRecent = useCallback((id: string) => {
    setRecent((prev) => {
      const next = [id, ...prev.filter((r) => r !== id)].slice(0, RECENT_CAP);
      void AsyncStorage.setItem(RECENT_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const fetchDetails = useCallback(
    async (id: string) => {
      if (details[id]) return;
      // Base detail fields (NOT common_mistakes) from base glossary — works for
      // everyone. common_mistakes comes from the academy-gated view in a SEPARATE
      // NON-FATAL query: the view's mask calls has_academy_access(), which
      // anon/free roles can't EXECUTE yet, so selecting it errors for them. If it
      // fails we simply show no mistakes — never block the whole detail (which
      // previously left the term stuck on "Loading…"). Booth 2026-07-11.
      const { data } = await supabase
        .from('glossary')
        .select(
          'plain_english, purpose_function, practical_application, scenario_contexts, related_terms, category, difficulty',
        )
        .eq('id', id)
        .single();
      if (!data) return;
      let common_mistakes: string[] | null = null;
      const { data: mv } = await supabase
        .from('glossary_full_v')
        .select('common_mistakes')
        .eq('id', id)
        .maybeSingle();
      common_mistakes = ((mv?.common_mistakes as string[] | null) ?? null) as string[] | null;
      setDetails((prev) => ({ ...prev, [id]: { ...(data as object), common_mistakes } as EntryDetail }));
    },
    [details],
  );

  const toggleExpand = useCallback(
    (id: string) => {
      if (expandedId === id) {
        setExpandedId(null);
        return;
      }
      setExpandedId(id);
      recordRecent(id); // opening a term counts as "viewed"
      coach.registerAction(); // each expand advances the "expand ×2" hint
      void fetchDetails(id);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [expandedId, recordRecent, fetchDetails],
  );

  // ---- FEATURE 1 (Booth kickoff 2026-07-10): in-definition cross-links ----
  // Link-opened terms show in the POPUP with a back trail; each trail entry
  // remembers its popup scroll offset, so unwinding returns the reader to
  // exactly where they were. The popup lives INSIDE this screen (no stack
  // pushes) — the list/scroll position beneath is untouched by design, and the
  // STUDY-tab nav rules stay unviolated.
  const [popupTrail, setPopupTrail] = useState<{ id: string; offset: number }[]>([]);
  const [chooser, setChooser] = useState<string[] | null>(null); // ambiguous sense ids
  const popupScrollRef = useRef<ScrollView>(null);
  const popupScrollY = useRef(0);
  // Set true when a term LINK is tapped, so the body's tap-to-go-back handler
  // (which also fires) skips the back and lets the link navigate FORWARD instead
  // (Booth 2026-07-11). Auto-clears as a safety net.
  const suppressBack = useRef(false);

  /** Open a term in the popup as the trail ROOT (card tap / list-link first hop). */
  const openPopupRoot = useCallback(
    (id: string) => {
      recordRecent(id);
      coach.registerAction();
      void fetchDetails(id);
      popupScrollY.current = 0;
      setPopupTrail([{ id, offset: 0 }]);
    },
    [recordRecent, coach, fetchDetails],
  );

  /** Follow a cross-link: remember where we are, then hop to the new term. */
  const openLinked = useCallback(
    (id: string) => {
      setChooser(null);
      recordRecent(id);
      void fetchDetails(id);
      setPopupTrail((t) => {
        if (t.length === 0) return [{ id, offset: 0 }];
        const held = { ...t[t.length - 1], offset: popupScrollY.current };
        return [...t.slice(0, -1), held, { id, offset: 0 }];
      });
      popupScrollY.current = 0;
    },
    [recordRecent, fetchDetails],
  );

  /** One link tap: single sense → open; multiple senses → chooser. Marks the
   *  body-back handler to skip this tap (link goes forward, not back). */
  const onLinkPress = useCallback(
    (ids: string[]) => {
      suppressBack.current = true;
      setTimeout(() => {
        suppressBack.current = false;
      }, 350);
      if (ids.length === 1) openLinked(ids[0]);
      else setChooser(ids);
    },
    [openLinked],
  );

  /** Unwind one hop (back pill / tap on popup body); closes at the root. A tap
   *  that hit a term link is suppressed so the link navigates forward instead. */
  const popupBack = useCallback(() => {
    if (suppressBack.current) {
      suppressBack.current = false;
      return;
    }
    setChooser(null);
    setPopupTrail((t) => t.slice(0, -1));
  }, []);

  const popupTop = popupTrail.length > 0 ? popupTrail[popupTrail.length - 1] : null;

  // Restore the remembered scroll offset when unwinding to a previous term.
  useEffect(() => {
    if (!popupTop) return;
    const y = popupTop.offset;
    requestAnimationFrame(() => popupScrollRef.current?.scrollTo({ y, animated: false }));
  }, [popupTop?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const [selCourseId, setSelCourseId] = useState<string | null>(presetCourseId ?? null);
  const [selTopicId, setSelTopicId] = useState<string | null>(presetTopicId ?? null);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      // Recently-viewed (device-side; no backend table). Flagged terms hydrate
      // via flaggedStore (shared with Flashcards — Booth 2026-07-18).
      AsyncStorage.getItem(RECENT_KEY).then((v) => {
        if (alive && v) setRecent(JSON.parse(v) as string[]);
      });
      AsyncStorage.getItem(TTS_MODE_KEY).then((v) => {
        if (alive && v != null) setTtsBeg(v === '1');
      });
      (async () => {
        try {
          const [{ data: courseRows }, { data: topicRows }] = await Promise.all([
            supabase.from('courses').select('id, code, sequence').order('sequence'),
            // ALL 51 topics — deliberately no is_active filter (Booth ruling).
            supabase
              .from('achievements')
              .select('id, name, course_id, sequence_in_course')
              .order('sequence_in_course'),
          ]);
          if (!alive) return;
          setCourses((courseRows ?? []) as CourseRef[]);
          const courseSeq = new Map((courseRows ?? []).map((c: any) => [c.id, c.sequence]));
          setTopics(
            ((topicRows ?? []) as TopicRef[]).sort(
              (a, b) =>
                (courseSeq.get(a.course_id) ?? 99) - (courseSeq.get(b.course_id) ?? 99) ||
                a.sequence_in_course - b.sequence_in_course,
            ),
          );

          // Full corpus, paged past the 1000-row PostgREST cap.
          const all: Entry[] = [];
          for (let from = 0; ; from += PAGE) {
            const { data, error } = await supabase
              .from('glossary')
              .select('id, term, definition, plain_english, course_id, achievement_id')
              .order('term')
              .range(from, from + PAGE - 1);
            if (error) throw error;
            all.push(...((data ?? []) as Entry[]));
            if (!data || data.length < PAGE) break;
          }
          if (alive) setEntries(all);
        } catch (e) {
          console.warn('[glossary] load failed:', (e as Error).message);
        } finally {
          if (alive) setLoading(false);
        }
      })();
      return () => {
        alive = false;
        stopAllSpeech(); // leaving the glossary silences any TTS in progress
      };
    }, []),
  );

  const selCourse = courses.find((c) => c.id === selCourseId) ?? null;
  const selTopic = topics.find((t) => t.id === selTopicId) ?? null;
  const topicsAZ = useMemo(() => [...topics].sort((a, b) => a.name.localeCompare(b.name)), [topics]);
  // Free (non-academy) commercial users see the topic filter list VEILED: the
  // names are enciphered and the rows don't select — they see the curtain, not
  // the contents (Booth 2026-07-11). Academy + institutional users use it normally.
  const topicsLocked = commercialMode && !caps.allTopics;

  const filterLabel =
    filter === 'all'
      ? 'All'
      : filter === 'course'
        ? (selCourse?.code ?? 'Course')
        : filter === 'topic'
          ? (selTopic?.name ?? 'Topic')
          : filter === 'favorites'
            ? 'Favorites'
            : 'Recent';

  // Feature 1: the cross-link index — computed ONCE per corpus load.
  const termIndex = useMemo(() => (entries.length ? buildTermIndex(entries) : null), [entries]);
  const entryById = useMemo(() => new Map(entries.map((e) => [e.id, e])), [entries]);
  const courseCodeById = useMemo(() => new Map(courses.map((c) => [c.id, c.code])), [courses]);

  const visible = useMemo(() => {
    let list = entries;
    if (filter === 'course' && selCourseId) list = list.filter((e) => e.course_id === selCourseId);
    if (filter === 'topic' && selTopicId) list = list.filter((e) => e.achievement_id === selTopicId);
    if (filter === 'favorites') list = list.filter((e) => favs.has(e.id));
    if (filter === 'recent') {
      const order = new Map(recent.map((id, i) => [id, i]));
      list = list
        .filter((e) => order.has(e.id))
        .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)); // newest first
    }
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((e) => e.term.toLowerCase().includes(q));
    return list;
  }, [entries, filter, search, selCourseId, selTopicId, favs, recent]);

  // Booth ruling: the STUDY nav button must NEVER land on the Glossary. The
  // tab-level navigate can't reliably move a stack that's already focused
  // here, so the screen itself listens for the parent tabPress and navigates
  // to the Dashboard from WITHIN its own live stack (documented RN pattern —
  // no stale keys, no unhandled actions). Booth 2026-07-09r.
  // useFocusEffect (not useEffect): getParent() is reliably ready AFTER focus,
  // so the listener always attaches — the earlier mount-time useEffect could
  // race getParent() and miss, letting STUDY land on Glossary "once in a while"
  // (Booth 2026-07-11 hardening).
  useFocusEffect(
    useCallback(() => {
      const nav = navigation as any;
      const parent = nav.getParent?.();
      if (!parent) return;
      const go = () => {
        // Pop the Study stack back to its Dashboard root on ANY tab press.
        if (nav.canGoBack?.()) nav.popToTop?.();
        nav.navigate('Dashboard');
      };
      const subs = [parent.addListener('tabPress', go)];
      // Also cover a grandparent tab navigator if the stack is nested deeper.
      const grand = parent.getParent?.();
      if (grand) subs.push(grand.addListener('tabPress', go));
      return () => subs.forEach((u) => u && u());
    }, [navigation]),
  );

  // Jump back to the top whenever the visible set changes filter/search, so the
  // result of tapping a filter is immediately obvious (Booth 2026-07-09).
  // Staggered retries (Booth 2026-07-16): a single scrollToOffset could land
  // BEFORE the FlatList re-measured the new (shorter) result set, leaving the
  // list parked a few rows down — the same fix pattern as scrollTermToTop.
  useEffect(() => {
    const go = () => listRef.current?.scrollToOffset({ offset: 0, animated: false });
    go();
    requestAnimationFrame(go);
    const t = setTimeout(go, 150);
    return () => clearTimeout(t);
    // NOTE: cardView is intentionally NOT a dep — toggling views preserves the
    // focused term's position instead of resetting to the top (Booth 2026-07-09c).
  }, [filter, selCourseId, selTopicId, search]);

  // Justify a list-mode term to the very top (just below the filters). Fires a
  // few staggered attempts so it survives a card→list layout switch, where the
  // FlatList needs a beat to re-measure rows before scrollToIndex can land
  // (Booth 2026-07-09c). onScrollToIndexFailed backstops early attempts.
  const scrollTermToTop = (id: string) => {
    const idx = visible.findIndex((e) => e.id === id);
    if (idx < 0) return;
    const go = () => listRef.current?.scrollToIndex({ index: idx, viewPosition: 0, animated: false });
    requestAnimationFrame(go);
    setTimeout(go, 120);
    setTimeout(go, 320);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        {/* Booth 2026-07-08: the mode icon always returns to the Dashboard. */}
        <Pressable
          onPress={() => (navigation as any).navigate('Dashboard')}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Back to Dashboard"
        >
          <MethodIcon method="glossary" size={34} />
        </Pressable>
        <Text style={styles.title}>GLOSSARY</Text>
        {/* Cards/List toggle lives here now — always visible, both modes, so it
            stays reachable even while a term/popup is expanded (Booth 2026-07-09b). */}
        <Pressable
          style={styles.headerToggle}
          onPress={() => {
            // Toggle the view ONLY — keep the focused term (Booth 2026-07-09c).
            // Popup trail ⇄ inline list expansion carry the focused term.
            const goingToList = cardView;
            setCardView((v) => !v);
            if (goingToList) {
              const top = popupTrail.length ? popupTrail[popupTrail.length - 1].id : null;
              if (top) {
                setPopupTrail([]);
                setExpandedId(top);
                void fetchDetails(top);
                scrollTermToTop(top);
              } else if (expandedId) {
                scrollTermToTop(expandedId);
              }
            } else if (expandedId && popupTrail.length === 0) {
              openPopupRoot(expandedId); // inline term follows into card view
            }
          }}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={cardView ? 'Switch to list view' : 'Switch to cards view'}
        >
          <Text style={styles.headerToggleText}>{cardView ? 'LIST' : 'CARDS'}</Text>
        </Pressable>
        {/* Which definition the speakers read (Booth 2026-07-10):
            ADV = official definition (default) · BEG = plain English. */}
        <Pressable
          style={styles.headerToggle}
          onPress={() => {
            const next = !ttsBeg;
            setTtsBeg(next);
            void AsyncStorage.setItem(TTS_MODE_KEY, next ? '1' : '0');
          }}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={
            ttsBeg
              ? 'Beginner mode: plain-English shown first and read aloud. Switch to advanced.'
              : 'Advanced mode: the official definition shown first and read aloud. Switch to beginner.'
          }
        >
          <Text style={styles.headerToggleText}>{ttsBeg ? 'BEG' : 'ADV'}</Text>
        </Pressable>
        <View style={{ flex: 1 }} />
        <Text style={styles.count}>{loading ? '…' : `${visible.length} / ${entries.length}`}</Text>
      </View>

      <View style={styles.searchBox}>
        {/* Search glyph always on the left (Booth 2026-07-15). */}
        <Text style={styles.searchGlyph}>⌕</Text>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search by term"
          placeholderTextColor={colors.textMuted}
          autoCorrect={false}
          returnKeyType="done"
          ref={searchRef}
          accessibilityLabel="Search by term"
        />
        {/* Clear ✕ moved to the RIGHT; the keyboard's own Return/Done key (and
            drag-to-dismiss) replaces the old DONE button (Booth 2026-07-15). */}
        {search.length > 0 ? (
          <Pressable
            onPress={() => setSearch('')}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
          >
            <Text style={styles.searchClear}>✕</Text>
          </Pressable>
        ) : null}
      </View>

      {/* Filters never scroll — they wrap in place (Booth 2026-07-09b). In LIST
          mode they stay visible even while a definition is expanded (the term
          justifies up just below them); only a CARD popup hides them. */}
      {popupTrail.length === 0 && (
        <>
      <View style={styles.chipRow}>
        <Chip
          label="All"
          active={filter === 'all'}
          onPress={() => {
            setFilter('all');
            setTopicPickerOpen(false);
          }}
        />
        {/* CM4: no academic course codes in public UI — the Course filter is
            institutional-only. Topic filter (named topics) remains. */}
        {!commercialMode && (
        <Chip
          label={filter === 'course' && selCourse ? courseLabel(selCourse.code) : 'Course'}
          active={filter === 'course'}
          onPress={() => {
            setFilter('course');
            setTopicPickerOpen(false);
          }}
        />
        )}
        <Chip
          label={filter === 'topic' && selTopic ? 'Topic ✓' : 'Topic'}
          active={filter === 'topic'}
          onPress={() => {
            setFilter('topic');
            setTopicPickerOpen(true); // reopen the A–Z list to re-pick
          }}
        />
        <Chip
          label={`★${favs.size > 0 ? ` ${favs.size}` : ''}`}
          active={filter === 'favorites'}
          onPress={() => {
            setFilter('favorites');
            setTopicPickerOpen(false);
          }}
        />
        <Chip
          label="Recent"
          active={filter === 'recent'}
          onPress={() => {
            setFilter('recent');
            setTopicPickerOpen(false);
          }}
        />
      </View>

      {/* Course picker: 9 full-size chips, wrapping grid. */}
      {!commercialMode && filter === 'course' && (
        <View style={styles.pickerWrap}>
          {courses.map((c) => (
            <Chip
              key={c.id}
              label={courseLabel(c.code)}
              active={selCourseId === c.id}
              onPress={() => setSelCourseId(c.id)}
            />
          ))}
        </View>
      )}
        </>
      )}

      {/* Results region — the topic picker OVERLAYS it at full height so the
          A–Z list is never cut off (Booth 2026-07-07). */}
      <View style={styles.resultsRegion}>
        <FlatList
          ref={listRef}
          data={visible}
          keyExtractor={(e) => e.id}
          contentContainerStyle={cardView ? styles.cardList : styles.list}
          initialNumToRender={20}
          maxToRenderPerBatch={30}
          windowSize={7}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          onScrollToIndexFailed={(info) => {
            // Variable row heights → the target may be unmeasured. Nudge toward
            // it, then retry once layout settles (Booth 2026-07-09b).
            listRef.current?.scrollToOffset({
              offset: info.averageItemLength * info.index,
              animated: false,
            });
            setTimeout(
              () => listRef.current?.scrollToIndex({ index: info.index, viewPosition: 0, animated: true }),
              80,
            );
          }}
          {...NO_TOUCH_DELAY}
          // Cite the number of returns above the generated list (user request
          // 2026-07-17). Hidden while loading or when the list is empty (the
          // empty component covers that case).
          ListHeaderComponent={
            loading || visible.length === 0 ? null : (
              <Text style={styles.resultCount}>
                {visible.length} result{visible.length === 1 ? '' : 's'} · {filterLabel}
              </Text>
            )
          }
          ListEmptyComponent={
            loading ? null : <Text style={styles.empty}>No results for {search.trim() || filterLabel}</Text>
          }
          extraData={[expandedId, details, cardView, ttsBeg, termIndex]}
          renderItem={({ item }) => {
            // List view expands INLINE; card view stays compact and opens the
            // popup overlay instead (below).
            const expanded = !cardView && expandedId === item.id;
            const d = details[item.id];
            return (
              <Pressable
                style={cardView ? styles.cardItem : [styles.entry, expanded && styles.entryExpanded]}
                onPress={() => {
                  if (cardView) {
                    openPopupRoot(item.id); // card tap = popup trail root
                    return;
                  }
                  const willExpand = expandedId !== item.id;
                  toggleExpand(item.id);
                  // List mode: justify the just-opened term to the top, right
                  // below the filters, moving earlier terms out of the way
                  // (Booth 2026-07-09b). Scrolling afterward is unaffected.
                  if (willExpand) scrollTermToTop(item.id);
                }}
                accessibilityRole="button"
                accessibilityState={{ expanded }}
              >
                <View style={styles.entryHeader}>
                  <View style={styles.entryTermWrap}>
                    <Text
                      style={[
                        styles.term,
                        { flexShrink: 1 },
                        cardView && styles.cardTerm,
                        expanded && styles.termExpanded,
                      ]}
                    >
                      {item.term}
                    </Text>
                    {/* Danger flag sits right next to the term (Booth 2026-07-15). */}
                    {isHazardTerm(item.term) ? <CautionBadge iconOnly /> : null}
                  </View>
                  <View style={styles.entryActions}>
                    <SpeakButton text={speakTextFor(item, ttsBeg)} size={19} />
                    {/* Share this term + definition (Booth 2026-07-18) — the
                        familiar box-with-up-arrow share glyph. */}
                    <Pressable
                      onPress={() => shareTerm(item)}
                      hitSlop={10}
                      accessibilityRole="button"
                      accessibilityLabel={`Share ${item.term}`}
                    >
                      <ShareIcon size={18} color={colors.textMuted} />
                    </Pressable>
                    {/* Hold-to-confirm (user request 2026-07-17): holding the
                        star shows what it does before you commit. */}
                    <HoldHintPressable
                      onPress={() => toggleFav(item.id)}
                      hint={favs.has(item.id) ? '★ Removes from Flagged' : '★ Adds to Flagged'}
                      selected={favs.has(item.id)}
                      accessibilityLabel={favs.has(item.id) ? 'Remove flag' : 'Flag term'}
                    >
                      <Text style={[styles.favStar, favs.has(item.id) && styles.favStarOn]}>
                        {favs.has(item.id) ? '★' : '☆'}
                      </Text>
                    </HoldHintPressable>
                    {!cardView && <Text style={styles.entryChevron}>{expanded ? '▾' : '▸'}</Text>}
                  </View>
                </View>
                {expanded ? (
                  // Feature 1: cross-links live in the EXPANDED definition
                  // (collapsed rows stay plain — the row tap owns them).
                  // BEG order (Booth 2026-07-11): plain-English on top.
                  <LinkedText
                    text={ttsBeg ? item.plain_english || item.definition : item.definition}
                    style={styles.definition}
                    selfId={item.id}
                    index={termIndex}
                    onLink={onLinkPress}
                  />
                ) : (
                  <Text style={styles.definition} numberOfLines={cardView ? 2 : undefined}>
                    {ttsBeg ? item.plain_english || item.definition : item.definition}
                  </Text>
                )}

                {expanded &&
                  (d ? (
                    <TermDetails
                      d={d}
                      term={item.term}
                      selfId={item.id}
                      index={termIndex}
                      onLink={onLinkPress}
                      definition={item.definition}
                      begFirst={ttsBeg}
                      commercial={commercialMode}
                      commonMistakesLocked={!caps.commonMistakes}
                    />
                  ) : (
                    <Text style={styles.detailLoading}>Loading…</Text>
                  ))}
              </Pressable>
            );
          }}
        />

        {/* Term popup — card taps AND cross-link hops land here (Feature 1).
            The trail unwinds one hop per back (pill or tap on the body),
            restoring each term's scroll position; ✕ closes the whole trail.
            The list beneath is untouched, so closing returns the reader to
            exactly where they were. */}
        {popupTop
          ? (() => {
              const item = entryById.get(popupTop.id);
              if (!item) return null;
              const d = details[popupTop.id];
              const prev =
                popupTrail.length > 1 ? entryById.get(popupTrail[popupTrail.length - 2].id) : null;
              return (
                <View style={styles.cardPopupBackdrop}>
                  <View style={styles.cardPopup}>
                    <View style={styles.cardPopupBar}>
                      {prev ? (
                        <Pressable
                          onPress={popupBack}
                          hitSlop={10}
                          accessibilityRole="button"
                          accessibilityLabel={`Back to ${prev.term}`}
                          style={styles.popupBackPill}
                        >
                          <Text style={styles.popupBackText} numberOfLines={1}>
                            ‹ {prev.term}
                          </Text>
                        </Pressable>
                      ) : (
                        <View />
                      )}
                      <Pressable
                        onPress={() => setPopupTrail([])}
                        hitSlop={{ top: 22, bottom: 22, left: 22, right: 22 }}
                        accessibilityRole="button"
                        accessibilityLabel="Close"
                        style={styles.cardPopupClose}
                      >
                        <Text style={styles.cardPopupCloseText}>✕</Text>
                      </Pressable>
                    </View>
                    <ScrollView
                      ref={popupScrollRef}
                      style={{ flex: 1 }}
                      contentContainerStyle={styles.cardPopupContent}
                      showsVerticalScrollIndicator
                      keyboardShouldPersistTaps="handled"
                      onScroll={(e) => {
                        popupScrollY.current = e.nativeEvent.contentOffset.y;
                      }}
                      scrollEventThrottle={32}
                    >
                      {/* Term row sits OUTSIDE the back handler: tapping the
                          term NAME re-roots to that term's definition (stays,
                          drops the back trail); the speaker just speaks (Booth
                          2026-07-11). */}
                      <View style={styles.cardPopupTermRow}>
                        <Pressable
                          onPress={() => openPopupRoot(item.id)}
                          style={{ flexShrink: 1 }}
                          accessibilityRole="button"
                          accessibilityLabel={`${item.term} definition`}
                        >
                          <Text style={styles.cardPopupTerm}>{item.term}</Text>
                        </Pressable>
                        {/* Danger flag next to the term (Booth 2026-07-15). */}
                        {isHazardTerm(item.term) ? <CautionBadge iconOnly /> : null}
                        <SpeakButton text={speakTextFor(item, ttsBeg)} size={24} />
                      </View>
                      {/* Tap anywhere on the definition/details → go BACK one hop;
                          tapping a term LINK navigates forward instead
                          (onLinkPress sets suppressBack, popupBack skips). */}
                      <Pressable onPress={popupBack} accessibilityRole="button" accessibilityLabel="Back">
                        <LinkedText
                          text={ttsBeg ? item.plain_english || item.definition : item.definition}
                          style={styles.cardPopupDef}
                          selfId={item.id}
                          index={termIndex}
                          onLink={onLinkPress}
                        />
                        {d ? (
                          <TermDetails
                            d={d}
                            term={item.term}
                            selfId={item.id}
                            index={termIndex}
                            onLink={onLinkPress}
                            definition={item.definition}
                            begFirst={ttsBeg}
                            commercial={commercialMode}
                            commonMistakesLocked={!caps.commonMistakes}
                          />
                        ) : (
                          <Text style={styles.detailLoading}>Loading…</Text>
                        )}
                      </Pressable>
                    </ScrollView>
                  </View>
                </View>
              );
            })()
          : null}

        {/* Feature 1 — disambiguation chooser: a matched word with multiple
            senses opens this small sheet; picking a sense opens it. */}
        {chooser ? (
          <View style={styles.chooserBackdrop}>
            <Pressable style={{ flex: 1 }} onPress={() => setChooser(null)} accessibilityLabel="Dismiss" />
            <View style={styles.chooserSheet}>
              <Text style={styles.chooserTitle}>WHICH SENSE?</Text>
              {chooser.map((id) => {
                const e = entryById.get(id);
                if (!e) return null;
                return (
                  <Pressable
                    key={id}
                    style={styles.chooserRow}
                    onPress={() => openLinked(id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Open ${e.term}`}
                  >
                    <Text style={styles.chooserTerm} numberOfLines={1}>
                      {e.term}
                    </Text>
                    <Text style={styles.chooserCode}>{courseCodeById.get(e.course_id) ?? ''}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        {filter === 'topic' && topicPickerOpen && (
          topicsLocked ? (
            // Locked (free) list: a tap ANYWHERE closes it immediately; the list
            // only moves when swiped (Booth 2026-07-11). Rows are inert Views so
            // taps bubble to the closing Pressable; swipes go to the ScrollView.
            <Pressable style={styles.topicOverlay} onPress={() => setTopicPickerOpen(false)}>
              <Text style={styles.topicOverlayTitle}>🔒 TOPIC FILTER · ACADEMY MODE</Text>
              <Text style={styles.topicLockHint}>{COPY.upgradePhrase}</Text>
              <ScrollView keyboardShouldPersistTaps="handled" {...NO_TOUCH_DELAY}>
                {topicsAZ.map((t) => (
                  <View key={t.id} style={styles.topicRow}>
                    <Text style={[styles.topicRowText, styles.topicRowVeiled]}>{veilText(t.name)}</Text>
                  </View>
                ))}
              </ScrollView>
            </Pressable>
          ) : (
            <View style={styles.topicOverlay}>
              <Text style={styles.topicOverlayTitle}>SELECT A TOPIC · A–Z</Text>
              <ScrollView keyboardShouldPersistTaps="handled" {...NO_TOUCH_DELAY}>
                {topicsAZ.map((t) => {
                  const active = selTopicId === t.id;
                  return (
                    <Pressable
                      key={t.id}
                      style={[styles.topicRow, active && styles.topicRowActive]}
                      onPress={() => {
                        setSelTopicId(t.id);
                        setTopicPickerOpen(false);
                      }}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                    >
                      <Text style={[styles.topicRowText, active && { color: colors.amber }]}>{t.name}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )
        )}
      </View>

      {coach.visible && (
        <CoachMark text="Tap a term to expand or collapse all definitions & details" bottom={18} />
      )}

      {/* Share preview pop-up (user request 2026-07-17). */}
      <ShareTermSheet payload={sharePayload} onClose={() => setSharePayload(null)} />

      {/* Glossary intro placeholder (Booth 2026-07-18). */}
      <ScreenIntroOverlay introKey="glossary" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg, paddingHorizontal: 16, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 16 },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 17, letterSpacing: 1.4, color: colors.textPrimary },
  headerToggle: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4.5,
    borderWidth: 1,
    borderColor: colors.amber,
    backgroundColor: 'rgba(216,160,74,0.12)',
  },
  headerToggleText: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 12,
    letterSpacing: 1,
    color: colors.amber,
  },
  count: { textAlign: 'right', fontFamily: fonts.mono, fontSize: 12, color: colors.textSubAlt },
  searchBox: {
    height: 44,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    backgroundColor: '#101010',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 10,
  },
  searchGlyph: { fontSize: 16, color: colors.textMuted },
  searchClear: { fontSize: 15, color: colors.textSub, paddingHorizontal: 1 },
  searchInput: { flex: 1, fontFamily: fonts.barlowRegular, fontSize: 15, color: colors.textPrimary, paddingVertical: 0 },
  // Constrain the horizontal filter scroller so it can't grow to fill the
  // column and shove the list down (Booth 2026-07-09 black-gap fix).
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  pickerWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingVertical: 2 },
  resultsRegion: { flex: 1 },
  topicOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.screenBg,
    borderWidth: 1,
    borderColor: 'rgba(255,180,0,.35)',
    borderRadius: 8,
  },
  topicOverlayTitle: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 12,
    letterSpacing: 1.8,
    color: colors.amberLabel,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairlineDim,
  },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 15, // generous target — easy, imprecise tapping
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  topicRowActive: { backgroundColor: '#1d1607' },
  topicRowText: { flexShrink: 1, fontFamily: fonts.barlowMedium, fontSize: 15, color: colors.textSecondary },
  // Veiled topic row for free users — enciphered + blurred, unreadable.
  topicRowVeiled: {
    fontFamily: fonts.mono,
    color: 'rgba(232,206,140,0.4)',
    textShadowColor: 'rgba(232,206,140,0.5)',
    textShadowRadius: 5,
    textShadowOffset: { width: 0, height: 0 },
    letterSpacing: 1,
  },
  topicLockHint: {
    fontFamily: fonts.barlowRegular,
    fontStyle: 'italic',
    fontSize: 12.5,
    lineHeight: 17,
    color: '#7fd4ff',
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  chip: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 4.5, borderWidth: 1 },
  chipText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1 },
  list: { paddingBottom: 16 },
  empty: { fontFamily: fonts.barlowRegular, fontSize: 14, color: colors.textSub, paddingTop: 12 },
  // Result count above the list (user request 2026-07-17).
  resultCount: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 11.5,
    letterSpacing: 1,
    color: colors.textMuted,
    paddingBottom: 8,
    paddingLeft: 2,
  },
  entry: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  entryExpanded: { backgroundColor: '#141210', marginHorizontal: -8, paddingHorizontal: 8, borderRadius: 8 },
  // Card view
  viewToggleRow: { flexDirection: 'row', justifyContent: 'flex-end' },
  viewToggle: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  viewToggleText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1, color: '#b9b9b9' },
  cardList: { paddingBottom: 16, gap: 12 },
  cardItem: {
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: colors.hairlineAlt,
    borderRadius: 12,
    padding: 16,
  },
  cardItemExpanded: { backgroundColor: '#1a160e', borderColor: 'rgba(255,180,0,.35)', paddingVertical: 20 },
  cardTerm: { fontSize: 18 },
  cardPopupBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.screenBg, // opaque — hides the card list behind
  },
  cardPopup: {
    flex: 1,
    marginHorizontal: 4,
    marginTop: 4,
    marginBottom: 8,
    backgroundColor: '#1a160e',
    borderWidth: 1,
    borderColor: 'rgba(255,180,0,.4)',
    borderRadius: 14,
    overflow: 'hidden',
  },
  cardPopupContent: { padding: 20, paddingTop: 8, paddingBottom: 32 },
  // Popup header bar: back pill (trail) left · ✕ right (Feature 1).
  cardPopupBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 4,
    gap: 10,
  },
  popupBackPill: {
    flexShrink: 1,
    borderRadius: 4.5,
    borderWidth: 1,
    borderColor: 'rgba(91,176,255,.5)',
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  popupBackText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 0.6, color: '#7fbfff' },
  // In-definition cross-links (Feature 1) — distinct but not heavy. Color is
  // the halfway point between link blue #7fbfff and body text #e6e6e6 so
  // dense text still reads smoothly (Booth 2026-07-10).
  termLink: {
    color: '#b3d2f2',
    textDecorationLine: 'underline',
    textDecorationColor: 'rgba(179,210,242,0.35)',
  },
  // Disambiguation chooser sheet.
  chooserBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  chooserSheet: {
    backgroundColor: '#161616',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    borderWidth: 1,
    borderColor: '#2c2c2c',
    padding: 16,
    paddingBottom: 24,
    gap: 4,
  },
  chooserTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.8, color: colors.amberLabel, marginBottom: 6 },
  chooserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#2a2a2a',
  },
  chooserTerm: { flexShrink: 1, fontFamily: fonts.oswaldMedium, fontSize: 16, color: colors.textPrimary },
  chooserCode: { fontFamily: fonts.mono, fontSize: 12, color: colors.textMuted },
  cardPopupCloseLegacy: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Bigger, looser close-button target (Booth 2026-07-11).
  cardPopupClose: { paddingVertical: 6, paddingHorizontal: 10, marginRight: -4 },
  cardPopupCloseText: { fontFamily: fonts.oswaldSemiBold, fontSize: 19, color: colors.amber },
  cardPopupTermRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardPopupTerm: {
    fontFamily: fonts.oswaldMedium,
    fontSize: 26,
    letterSpacing: 0.4,
    color: colors.amber,
    textShadowColor: 'rgba(255,180,0,.35)',
    textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 0 },
  },
  cardPopupDef: {
    fontFamily: fonts.barlowRegular,
    fontSize: 17,
    lineHeight: 25,
    color: colors.textSecondary,
    marginTop: 8,
  },
  cardPopupHint: {
    fontFamily: fonts.barlowCondensedMedium,
    fontSize: 12,
    letterSpacing: 0.8,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 20,
  },
  entryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  entryTermWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  entryActions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  entryChevron: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, color: colors.textSubAlt },
  favStar: { fontSize: 18, color: colors.textMuted },
  favStarOn: {
    color: colors.amber,
    textShadowColor: 'rgba(255,180,0,.5)',
    textShadowRadius: 7,
    textShadowOffset: { width: 0, height: 0 },
  },
  // Glossary text +1pt (Booth 2026-07-08): term 15→16, definition 13→14,
  // detail body 14→15 for readability.
  term: { fontFamily: fonts.oswaldMedium, fontSize: 17, letterSpacing: 0.4, color: colors.textPrimary },
  termExpanded: {
    fontSize: 21,
    color: colors.amber,
    textShadowColor: 'rgba(255,180,0,.35)',
    textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 0 },
  },
  // Same text style as the detail sections — the primary definition must not
  // read dimmer than the rest (Booth 2026-07-10).
  definition: { fontFamily: fonts.barlowRegular, fontSize: 16, lineHeight: 24, color: colors.textSecondary, marginTop: 4 },
  detailBlock: { marginTop: 10, gap: 12 },
  detailSection: { gap: 4 },
  detailEyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.6, color: colors.amberLabel },
  detailBody: { fontFamily: fonts.barlowRegular, fontSize: 16, lineHeight: 24, color: colors.textSecondary },
  // "Suggest a correction" affordance at the foot of each detail reveal.
  suggestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 12,
    paddingVertical: 4,
  },
  suggestIcon: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, color: '#7fd4ff' },
  suggestText: { fontFamily: fonts.barlowMedium, fontSize: 13.5, color: '#7fd4ff' },
  // RELATED TERMS as tappable pills (Booth 2026-07-11).
  relatedWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 },
  relatedLink: {
    fontFamily: fonts.barlowMedium,
    fontSize: 14,
    color: '#5bb0ff',
    borderWidth: 1,
    borderColor: 'rgba(91,176,255,.4)',
    borderRadius: 6,
    paddingVertical: 5,
    paddingHorizontal: 10,
    overflow: 'hidden',
  },
  relatedPlain: {
    fontFamily: fonts.barlowMedium,
    fontSize: 14,
    color: colors.textSub,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 6,
    paddingVertical: 5,
    paddingHorizontal: 10,
    overflow: 'hidden',
  },
  // CM4: entitlement-locked section body (verbatim §2 copy).
  lockedBody: {
    fontFamily: fonts.barlowRegular,
    fontStyle: 'italic',
    fontSize: 14.5,
    lineHeight: 21,
    color: colors.textSub,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(255,180,0,.45)',
    paddingLeft: 8,
  },
  // Veiled (locked) Common Mistakes — the enciphered real lines, smeared blurry
  // and faint-gold, with a bottom fade + upgrade CTA (Booth 2026-07-11).
  veilWrap: {
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(255,180,0,.45)',
    paddingLeft: 8,
    paddingBottom: 4,
    overflow: 'hidden',
  },
  veilText: {
    fontFamily: fonts.mono,
    fontSize: 14,
    lineHeight: 22,
    letterSpacing: 1,
    color: 'rgba(232,206,140,0.42)',
    // Heavy shadow smears the enciphered glyphs into an unreadable blur.
    textShadowColor: 'rgba(232,206,140,0.55)',
    textShadowRadius: 5,
    textShadowOffset: { width: 0, height: 0 },
  },
  veilFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 22,
    height: 34,
  },
  veilLock: {
    fontFamily: fonts.barlowRegular,
    fontStyle: 'italic',
    fontSize: 13.5,
    lineHeight: 19,
    color: colors.amber,
    marginTop: 6,
  },
  detailLoading: { fontFamily: fonts.mono, fontSize: 12, color: colors.textMuted, marginTop: 10 },
});
