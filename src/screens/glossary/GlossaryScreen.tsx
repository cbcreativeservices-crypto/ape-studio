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
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType, type ReactNode } from 'react';
import { Alert, FlatList, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type StyleProp, type TextStyle } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MethodIcon } from '../../components/MethodIcon';
import { DeckIcon } from '../../components/DeckIcon';
import { CoachMark } from '../../components/CoachMark';
import { ShareIcon } from '../../components/ShareIcon';
import { ShareTermSheet, type ShareTermPayload } from '../../components/ShareTermSheet';
import { LowLightDim } from '../../features/settings/LowLightLayer';
import { BookmarkIcon, HoldHintPressable, TermSelectIcons } from '../../features/flags/TermSelectIcons';
import { SpeakButton, stopAllSpeech } from '../../components/SpeakButton';
import { useEntitlement } from '../../features/commercial/EntitlementProvider';
import { getBookmarks, listBookmarkContexts, toggleBookmark, toggleTermList, useBookmarks, useTermList } from '../../features/flags/flaggedStore';
import { ScreenIntroOverlay } from '../../features/intro/ScreenIntroOverlay';
import { PrePaywallPrompt } from '../../components/PrePaywallPrompt';
import { COPY } from '../../lib/copy';
import { useCoachMark } from '../../lib/coachMark';
import { sendFeedback } from '../../lib/feedback';
import { isHazardTerm } from '../../lib/hazard';
import { CautionBadge } from '../../components/CautionBadge';
import { supabase } from '../../lib/supabase';
import { SUPABASE_URL } from '../../lib/env';
import { colors, fonts } from '../../theme/tokens';
import {
  getLearningProfile,
  ACTION_LABELS,
  type GlossaryAction,
} from '../../features/glossary/learningProfiles';
import { getLabLesson } from '../../features/lab/guidedLessons';
import type { StudyStackParamList } from '../../navigation/types';

// Search-field dictation button. Loaded via a GUARDED require so a dev client
// that predates the expo-speech-recognition native module shows no mic instead
// of crashing (that module throws at import when the native side is absent —
// see GlossaryDictation.tsx). Resolves to the real button once a build bundles it.
let GlossaryDictation: ComponentType<{ onText: (t: string) => void }> | null = null;
try {
  GlossaryDictation = require('./GlossaryDictation').GlossaryDictation;
} catch {
  GlossaryDictation = null;
}

/** Small framed-image glyph — marks a term that has a media element. */
function MediaGlyph({ color = '#7fbfff', size = 17 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20">
      <Rect x={2.5} y={3.5} width={15} height={13} rx={2} fill="none" stroke={color} strokeWidth={1.6} />
      <Circle cx={7} cy={8} r={1.6} fill={color} />
      <Path d="M4 15 L8.5 10.5 L11.5 13.5 L14 11 L17 14" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Load the first image per term across the whole glossary_media table (paged).
 *  Sparse today (art not fully uploaded), so this is cheap; empty → no icons. */
async function loadAllGlossaryMedia(): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  try {
    const PAGE = 1000;
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await supabase
        .from('glossary_media')
        .select('glossary_id, media_type, url, sort_order')
        .order('glossary_id')
        .order('sort_order')
        .range(from, from + PAGE - 1);
      if (error || !data || data.length === 0) break;
      for (const m of data as { glossary_id: string; media_type: string | null; url: string | null }[]) {
        if (!m.url || (m.media_type && m.media_type !== 'image')) continue;
        if (!out[m.glossary_id]) out[m.glossary_id] = `${SUPABASE_URL}/storage/v1/object/public/${m.url}`;
      }
      if (data.length < PAGE) break;
    }
  } catch {
    /* non-fatal — terms simply render without a media icon */
  }
  return out;
}

/** Formula map for the "Equations & Formulas" filter: id → the term's symbolic
 *  formula (+ plain-language words). A term counts as an equation/formula when
 *  its `formula_symbolic` is non-empty. Loaded in ONE isolated, NON-FATAL paged
 *  pass, deliberately kept OUT of the main corpus select (loadEntries below):
 *  as of 2026-07-26 NO client role (anon/authenticated/service_role) holds a
 *  SELECT grant on `formula_symbolic`/`formula_words`, so a direct select 403s
 *  today for every user. Isolating it means that 403 yields an empty map (the
 *  filter shows no terms) WITHOUT breaking the glossary corpus load. Once the
 *  backend grants the columns and populates them, the filter lights up with no
 *  client change. (Verified 2026-07-26: 0 of 14,246 rows currently carry one.) */
async function loadAllGlossaryFormulas(): Promise<Record<string, { symbolic: string; words: string | null }>> {
  const out: Record<string, { symbolic: string; words: string | null }> = {};
  try {
    const PAGE_F = 1000;
    for (let from = 0; ; from += PAGE_F) {
      const { data, error } = await supabase
        .from('glossary')
        .select('id, formula_symbolic, formula_words')
        .order('id')
        .range(from, from + PAGE_F - 1);
      if (error || !data || data.length === 0) break;
      for (const r of data as { id: string; formula_symbolic: string | null; formula_words: string | null }[]) {
        if (r.formula_symbolic && r.formula_symbolic.trim() !== '') {
          out[r.id] = { symbolic: r.formula_symbolic, words: r.formula_words ?? null };
        }
      }
      if (data.length < PAGE_F) break;
    }
  } catch {
    /* non-fatal — the Equations & Formulas filter simply shows no terms */
  }
  return out;
}

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

/** Mid-word substring matching kicks in only at this query length (owner
 *  2026-08-01). Short queries — acronyms like "SSL" — match at word boundaries
 *  ONLY, so they don't drag in unrelated terms whose NAME merely contains the
 *  letters (e.g. "lo·ssl·ess" → Apple Lossless / ATRAC Advanced Lossless). At 5+
 *  chars, mid-word substrings are almost always intentional, so "polar" finds
 *  "bipolar", "linear" finds "nonlinearity", etc. */
const SUBSTRING_MIN_LEN = 5;

/**
 * Search relevance rank for a term against a lowercased query (lower = better;
 * 99 = no match, excluded). Tiers:
 *   0 exact · 1 term starts with query · 2 a WORD in the term starts with query
 *   · 3 substring anywhere (ONLY for queries ≥ SUBSTRING_MIN_LEN chars).
 * Callers break ties alphabetically within a tier.
 */
function searchRank(termLower: string, q: string): number {
  if (termLower === q) return 0;
  if (termLower.startsWith(q)) return 1;
  // Word-boundary prefix: any token (split on non-alphanumerics) starting with q.
  const words = termLower.split(/[^a-z0-9]+/);
  for (const w of words) if (w.startsWith(q)) return 2;
  // Mid-word substring only for longer queries (short acronyms stay clean).
  if (q.length >= SUBSTRING_MIN_LEN && termLower.includes(q)) return 3;
  return 99;
}

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
/**
 * Search-hit highlighter (owner 2026-08-01): wrap every case-insensitive
 * occurrence of `q` inside `text` in a GREEN span so the searched word/letters
 * pop in each result — the reader spots it instantly instead of hunting for it.
 * Returns the plain string when there's no query or no match (no array overhead).
 */
function highlightNodes(text: string, q: string): React.ReactNode {
  if (!q || !text) return text;
  const ql = q.toLowerCase();
  const lower = text.toLowerCase();
  const out: React.ReactNode[] = [];
  let i = 0;
  let idx = lower.indexOf(ql);
  let key = 0;
  if (idx === -1) return text;
  while (idx !== -1) {
    if (idx > i) out.push(text.slice(i, idx));
    out.push(
      <Text key={`h${key++}`} style={styles.hlMatch}>
        {text.slice(idx, idx + ql.length)}
      </Text>,
    );
    i = idx + ql.length;
    idx = lower.indexOf(ql, i);
  }
  if (i < text.length) out.push(text.slice(i));
  return out;
}

function LinkedText({
  text,
  style,
  selfId,
  index,
  onLink,
  highlight = '',
}: {
  text: string;
  style: StyleProp<TextStyle>;
  selfId: string;
  index: TermIndex | null;
  onLink: (ids: string[]) => void;
  /** Active search query — occurrences are highlighted green in plain segments. */
  highlight?: string;
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
          <Text key={i}>{highlightNodes(s.text, highlight)}</Text>
        ),
      )}
    </Text>
  );
}
type CourseRef = { id: string; code: string; sequence: number };
type TopicRef = { id: string; name: string; course_id: string; sequence_in_course: number };
type Filter = 'all' | 'course' | 'topic' | 'equations' | 'favorites' | 'custom' | 'recent';

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
  mistakesReadable = false,
  term,
  onLabAction,
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
  /** COMMON MISTAKES is ALWAYS shown (major selling point, owner 2026-07-29):
   *  the section renders for everyone; only a current paying member reads the
   *  text — everyone else sees the veiled tease + upgrade CTA. `true` iff the
   *  viewer is an academy member (gated on real entitlement, never caps). */
  mistakesReadable?: boolean;
  /** Audio-lab action handler. Present ⇒ the action row MAY render (only for
   *  terms with a READY Learning Profile — honest-metrics §1.7). Absent (e.g.
   *  no navigation context) ⇒ never rendered. */
  onLabAction?: (action: GlossaryAction) => void;
}) {
  const linkable = selfId != null && index != null && onLink != null;
  // Audio-lab action row — ONLY for terms whose lab link is functional today.
  const labProfile = onLabAction ? getLearningProfile(term) : null;
  // Lab-lesson Common Mistakes (roadmap 2026-07-26): for a term genuinely taught
  // by a live lab, surface that lab's authored Common-Mistakes list from the
  // guided-lesson registry. Client-authored + always available (NOT the
  // academy-gated DB `common_mistakes` below), so it's honest to show for free.
  const labLesson = labProfile ? getLabLesson(labProfile.lab) : null;
  const labMistakesText = labLesson?.commonMistakes?.length
    ? labLesson.commonMistakes.map((s) => `• ${s}`).join('\n')
    : null;
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
      {/* AUDIO LEARNING LAB action row — rendered ONLY for terms with a ready,
          functional lab link (getLearningProfile). Never shown for planned-but-
          unwired or unrelated terms (owner directive 2026-07-26). */}
      {labProfile && onLabAction ? (
        <View style={styles.labActionWrap}>
          <Text style={styles.detailEyebrow}>AUDIO FUNDAMENTALS & TRAINING LAB</Text>
          <View style={styles.labActionRow}>
            {labProfile.actions.map((action) => (
              <Pressable
                key={action.kind}
                style={styles.labActionBtn}
                onPress={() => onLabAction(action)}
                accessibilityRole="button"
                accessibilityLabel={ACTION_LABELS[action.kind].replace(/\s+/g, ' ').trim()}
              >
                <Text style={styles.labActionText}>{ACTION_LABELS[action.kind]}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}
      {/* LAB COMMON MISTAKES (roadmap 2026-07-26) — the linked lab's authored
          Common-Mistakes list, shown for lab-taught terms only. Distinct from the
          entitlement-gated DB mistakes section below (this is free, client
          content), so the eyebrow names its source lab. */}
      {labMistakesText && labLesson ? (
        <View style={styles.detailSection}>
          <Text style={styles.detailEyebrow}>COMMON MISTAKES · {labLesson.name.toUpperCase()} LAB</Text>
          <Text style={styles.detailBody}>{labMistakesText}</Text>
        </View>
      ) : null}
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
      {/* COMMON MISTAKES — ALWAYS shown (major selling point, owner 2026-07-29).
          Members read the real text; everyone else sees the VEILED tease + the
          upgrade CTA (restoring the garble that regressed). The server only
          sends common_mistakes for academy access, so the veil is enciphered
          from a PLACEHOLDER (never real content) — the tease drives conversion
          without leaking the wisdom behind the curtain. */}
      <View style={styles.detailSection}>
        <Text style={styles.detailEyebrow}>COMMON MISTAKES</Text>
        {mistakesReadable ? (
          <Text style={styles.detailBody}>{mistakesText ?? '—'}</Text>
        ) : (
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
        )}
      </View>
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

function Chip({
  label,
  active,
  onPress,
  onLongPress,
  accent = '#ffc64d',
  icon,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  /** Active tint for this chip (default academy amber). */
  accent?: string;
  /** Render an icon (receives the resolved foreground colour) instead of/around
   *  the text label — used by the Bookmark filter chip (user request 2026-07-22). */
  icon?: (color: string) => ReactNode;
}) {
  const activeBg: [string, string] =
    accent === '#ffc64d' ? ['#2a2008', '#1a1405'] : ['#232323', '#161616'];
  const fg = active ? accent : '#999999';
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={350}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
    >
      <LinearGradient
        colors={active ? activeBg : ['#222222', '#161616']}
        style={[styles.chip, { borderColor: active ? accent : '#3a3a3a' }]}
      >
        {icon ? icon(fg) : <Text style={[styles.chipText, { color: fg }]}>{label.toUpperCase()}</Text>}
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
  // Search-field colour (owner 2026-08-01): the typed query goes GREEN once the
  // search has SETTLED (results shown), and reverts to WHITE while the user is
  // editing (any keystroke/delete) or when the field is empty. A short debounce
  // detects "done typing"; each edit resets it back to white first.
  const [searchGreen, setSearchGreen] = useState(false);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onSearchChange = (text: string) => {
    setSearch(text);
    setSearchGreen(false); // editing → white immediately
    if (settleTimer.current) clearTimeout(settleTimer.current);
    if (text.trim().length > 0) {
      settleTimer.current = setTimeout(() => setSearchGreen(true), 400); // settled → green
    }
  };
  const clearSearch = () => {
    if (settleTimer.current) clearTimeout(settleTimer.current);
    setSearchGreen(false);
    setSearch('');
  };
  useEffect(() => () => {
    if (settleTimer.current) clearTimeout(settleTimer.current);
  }, []);

  const [filter, setFilter] = useState<Filter>('all');
  const [topicPickerOpen, setTopicPickerOpen] = useState(false);
  // Member gate for the topic filter (user request 2026-07-25): free/lapsed/
  // anonymous commercial users may VIEW the topic list but not activate a topic;
  // tapping a locked row raises this brief membership hint.
  const [topicGate, setTopicGate] = useState(false);
  const [cardView, setCardView] = useState(false); // list (default) ↔ card view
  // TTS reads the OFFICIAL definition by default (ADV); BEG = plain English.
  const [ttsBeg, setTtsBeg] = useState(false);
  // CM4: commercial rendering — Common Mistakes gating + no academic course
  // filter in public UI (§1 naming rule). Server owns entitlement; we render.
  const { commercialMode, entitlement } = useEntitlement();
  // Real membership (owner 2026-07-29): gate the mistakes veil + topic-filter
  // links on ENTITLEMENT, never on caps (dev-bypassed) or the commercialMode
  // compile flag — that regression hid both selling points. Only a current
  // paying member (academy) reads the mistakes and can activate a topic.
  const isMember = entitlement === 'academy';
  const listRef = useRef<FlatList<Entry>>(null);
  // Multiple simultaneous expansions in list view (user request 2026-07-18);
  // `focusedId` = the most-recently opened term (drives scroll + view-toggle).
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, EntryDetail>>({});
  // Term media (glossary_media): id → first image URL. Drives the media icon
  // next to a term and the in-definition image (user request 2026-07-18).
  const [mediaById, setMediaById] = useState<Record<string, string>>({});
  const [mediaPopup, setMediaPopup] = useState<string | null>(null); // URL shown in the tap-to-close viewer
  useEffect(() => {
    loadAllGlossaryMedia().then(setMediaById);
  }, []);
  // Equations & Formulas (user request 2026-07-26): id → symbolic/words for any
  // term that carries a formula. Loaded once, isolated + non-fatal (see
  // loadAllGlossaryFormulas) so a missing column-grant never breaks the corpus.
  const [formulaById, setFormulaById] = useState<Record<string, { symbolic: string; words: string | null }>>({});
  useEffect(() => {
    loadAllGlossaryFormulas().then(setFormulaById);
  }, []);
  // Flagged terms (Booth 2026-07-18): ONE list shared with Flashcards and the
  // custom "Flagged" dashboard topic — lives in features/flags/flaggedStore
  // (same ape:glossaryFavs key, so previously starred terms carry over).
  const bookmarks = useBookmarks('glossary');
  // ★ Custom list (starred) — its own per-term toggle (user request 2026-07-18).
  const starred = useTermList('starred');
  // Self-retiring hint: "click term to expand" — hides after 2 expands, for
  // the first 5 glossary opens app-wide (lib/coachMark.ts).
  const coach = useCoachMark('ape:coach:glossary', 2);
  const [recent, setRecent] = useState<string[]>([]);
  // Held filter chip → internal list of just that set's terms, like Flashcards
  // (user request 2026-07-22). kind picks which set the rows come from.
  const [termListModal, setTermListModal] = useState<{ title: string; kind: 'bookmark' | 'starred' | 'recent'; bookmarkCtx?: string } | null>(null);
  // Single bookmark popup (redesign, user request 2026-07-25): ONE modal that
  // shows the SELECTED context's bookmarked terms up top and an "other lists"
  // switcher below. Defaults to the glossary's own bookmark list; switching a
  // context swaps the terms shown. Replaces the old two-level bmPicker flow.
  const [bmOpen, setBmOpen] = useState(false);
  const [bmCtx, setBmCtx] = useState('glossary');
  const [bmContexts, setBmContexts] = useState<{ ctx: string; count: number }[]>([]);
  // Baseline membership of the CURRENTLY-selected list, captured when the popup
  // opens or the selected list changes — confirm-on-close compares against it to
  // count how many shown terms were removed (task 4).
  const bmBaseline = useRef<ReadonlySet<string>>(new Set());
  const bmBookmarks = useBookmarks(bmCtx);
  const pickedBookmarks = useBookmarks(termListModal?.bookmarkCtx ?? 'glossary');
  const topicsById = useMemo(() => new Map(topics.map((t) => [t.id, t.name])), [topics]);
  const ctxName = (ctx: string) =>
    ctx === 'glossary' ? 'Glossary' : ctx === 'flagged' ? 'My Custom List' : topicsById.get(ctx) ?? 'Topic';

  const toggleFav = useCallback((id: string) => {
    toggleBookmark('glossary', id);
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

  const expandedIdsRef = useRef(expandedIds);
  expandedIdsRef.current = expandedIds;
  const toggleExpand = useCallback(
    (id: string) => {
      const isOpen = expandedIdsRef.current.has(id);
      setExpandedIds((prev) => {
        const next = new Set(prev);
        if (isOpen) next.delete(id); // collapse this one; others stay open
        else next.add(id);
        return next;
      });
      if (!isOpen) {
        setFocusedId(id);
        recordRecent(id); // opening a term counts as "viewed"
        coach.registerAction(); // each expand advances the "expand ×2" hint
        void fetchDetails(id);
      } else if (focusedId === id) {
        setFocusedId(null);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [focusedId, recordRecent, fetchDetails],
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

  /** Open the audio lab for a glossary action. Only READY terms surface actions
   *  (getLearningProfile), and every current action opens its live lab screen;
   *  HarmonicLab is a RootStack route, reached from this nested Glossary by
   *  letting the navigate bubble to the root navigator. */
  const onLabAction = useCallback(
    (action: GlossaryAction) => {
      (navigation as unknown as { navigate: (name: string) => void }).navigate(action.route);
    },
    [navigation],
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
  // DATA ISSUE (confirmed 2026-07-18): the `achievements` table has DUPLICATE
  // rows — 28 topic names appear twice in the SAME course (2 different ids), and
  // several hold terms under BOTH ids. The backend is frozen, so we can't merge
  // them; instead the picker shows each name ONCE and selecting it filters by
  // the UNION of every id with that name, so no terms are hidden.
  const topicIdsByName = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const t of topics) m.set(t.name, [...(m.get(t.name) ?? []), t.id]);
    return m;
  }, [topics]);
  const topicsAZ = useMemo(() => {
    const withTerms = new Set(entries.map((e) => e.achievement_id));
    const byName = new Map<string, TopicRef>();
    for (const t of [...topics].sort((a, b) => a.name.localeCompare(b.name))) {
      const existing = byName.get(t.name);
      // Keep one representative per name, preferring an id that has terms.
      if (!existing || (!withTerms.has(existing.id) && withTerms.has(t.id))) byName.set(t.name, t);
    }
    return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [topics, entries]);
  // Free / lapsed / anonymous commercial users get the topic filter as VIEW-ONLY
  // (user request 2026-07-25): the A–Z list stays fully readable, but the rows
  // don't ACTIVATE the filter — each carries a MEMBERS lock and, on tap, a brief
  // membership hint. Only SELECTING a topic is gated; viewing is fine. Gating
  // applies in commercial mode only (flag OFF = today's institutional app, no
  // gate — and note the __DEV__ bypass in EntitlementProvider forces academy
  // caps, so this reads false on dev builds). Academy + institutional select normally.
  // Topic list is ALWAYS visible + readable to everyone (owner 2026-07-29);
  // only ACTIVATING a topic filter is member-gated. Gate on real entitlement
  // so free/lapsed/anonymous users see the readable A–Z list with 🔒 MEMBERS
  // per row (a membership sell point), independent of the commercialMode flag.
  const topicLinksLocked = !isMember;

  // "Equations & Formulas" pseudo-topic (user request 2026-07-26): the count of
  // corpus terms that carry a symbolic formula. DELIBERATELY NOT member-gated —
  // it's a cross-topic reference list of free-value content, so it stays
  // selectable for everyone even when the per-topic links are locked.
  const equationCount = useMemo(
    () => entries.reduce((n, e) => (formulaById[e.id] ? n + 1 : n), 0),
    [entries, formulaById],
  );
  const selectEquations = useCallback(() => {
    setFilter('equations');
    setSelTopicId(null); // a clean cross-topic view — no lingering topic selection
    setTopicPickerOpen(false);
  }, []);

  const filterLabel =
    filter === 'equations'
      ? 'Equations & Formulas'
      : filter === 'all'
      ? 'All'
      : filter === 'course'
        ? (selCourse?.code ?? 'Course')
        : filter === 'topic'
          ? (selTopic?.name ?? 'Topic')
          : filter === 'favorites'
            ? 'Bookmarks'
            : filter === 'custom'
              ? 'Custom'
              : 'Recent';

  // Feature 1: the cross-link index — computed ONCE per corpus load.
  const termIndex = useMemo(() => (entries.length ? buildTermIndex(entries) : null), [entries]);
  const entryById = useMemo(() => new Map(entries.map((e) => [e.id, e])), [entries]);
  const courseCodeById = useMemo(() => new Map(courses.map((c) => [c.id, c.code])), [courses]);

  const visible = useMemo(() => {
    let list = entries;
    if (filter === 'course' && selCourseId) list = list.filter((e) => e.course_id === selCourseId);
    if (filter === 'topic' && selTopicId) {
      // Union of all ids sharing the selected topic's name (dedup — see above).
      const name = topics.find((t) => t.id === selTopicId)?.name;
      const ids = new Set(name ? topicIdsByName.get(name) ?? [selTopicId] : [selTopicId]);
      list = list.filter((e) => e.achievement_id != null && ids.has(e.achievement_id));
    }
    if (filter === 'equations') {
      // ONLY terms that ARE equations/formulas (non-empty formula_symbolic),
      // as a flat cross-topic list sorted ALPHABETICALLY by term.
      list = list
        .filter((e) => formulaById[e.id] != null)
        .sort((a, b) => a.term.localeCompare(b.term));
    }
    if (filter === 'favorites') list = list.filter((e) => bookmarks.has(e.id));
    if (filter === 'custom') list = list.filter((e) => starred.has(e.id));
    if (filter === 'recent') {
      const order = new Map(recent.map((id, i) => [id, i]));
      list = list
        .filter((e) => order.has(e.id))
        .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)); // newest first
    }
    const q = search.trim().toLowerCase();
    if (q) {
      // Relevance ranking (not raw substring order): exact → prefix → word-prefix
      // → substring, ties A–Z. Keeps the L-word you typed at the top instead of
      // burying it under every term that merely contains the letters.
      list = list
        .map((e) => ({ e, r: searchRank(e.term.toLowerCase(), q) }))
        .filter((x) => x.r < 99)
        .sort((a, b) => a.r - b.r || a.e.term.localeCompare(b.e.term))
        .map((x) => x.e);
    }
    return list;
  }, [entries, filter, search, selCourseId, selTopicId, bookmarks, starred, recent, topics, topicIdsByName, formulaById]);

  // Rows for the held-chip term list overlay (user request 2026-07-22): the
  // members of one set (Bookmarks / Custom / Recent), independent of the main
  // list's active filter/search. Recent keeps newest-first order; the others
  // stay A–Z (entries are already term-sorted).
  const termListRows = useMemo(() => {
    if (!termListModal) return [] as Entry[];
    if (termListModal.kind === 'bookmark') return entries.filter((e) => pickedBookmarks.has(e.id));
    if (termListModal.kind === 'starred') return entries.filter((e) => starred.has(e.id));
    const order = new Map(recent.map((id, i) => [id, i]));
    return entries
      .filter((e) => order.has(e.id))
      .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  }, [termListModal, entries, pickedBookmarks, starred, recent]);

  // Members of the SELECTED bookmark context (single bookmark popup). Reacts to
  // both the ctx selection (bmBookmarks is useBookmarks(bmCtx)) and edits.
  const bmRows = useMemo(() => entries.filter((e) => bmBookmarks.has(e.id)), [entries, bmBookmarks]);

  // Every SELECTABLE bookmark list for the OTHER LISTS switcher (user request
  // 2026-07-25): the canonical set — the Glossary plus every topic (each topic
  // id is a bookmark context TermSelectIcons writes to) — UNIONed with any other
  // context that currently holds bookmarks. Empty lists show a 0 count so they
  // stay selectable; the previous build listed ONLY non-empty contexts, so an
  // empty list could never be switched to. Order: Glossary first, topics A–Z by
  // name, then any remaining non-empty contexts. The selected list is excluded
  // (it's shown up top).
  const bmSwitcherRows = useMemo(() => {
    const counts = new Map(bmContexts.map((b) => [b.ctx, b.count]));
    const ordered: string[] = [
      'glossary',
      ...[...topicsById.keys()].sort((a, b) => ctxName(a).localeCompare(ctxName(b))),
      ...bmContexts.map((b) => b.ctx),
    ];
    const seen = new Set<string>();
    const rows: { ctx: string; count: number }[] = [];
    for (const ctx of ordered) {
      if (ctx === bmCtx || seen.has(ctx)) continue;
      seen.add(ctx);
      rows.push({ ctx, count: counts.get(ctx) ?? 0 });
    }
    return rows;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bmContexts, topicsById, bmCtx]);

  // Tapping a term in the overlay opens it in the popup (the popup overlay
  // renders in both list and card mode) and closes the overlay.
  const openTermFromList = useCallback(
    (id: string) => {
      setTermListModal(null);
      openPopupRoot(id);
    },
    [openPopupRoot],
  );

  // Open a term straight from the bookmark popup.
  const openTermFromBm = useCallback(
    (id: string) => {
      setBmOpen(false);
      openPopupRoot(id);
    },
    [openPopupRoot],
  );

  // Open the single bookmark popup, defaulting to the glossary's own list.
  const openBookmarkPopup = useCallback(() => {
    setBmCtx('glossary');
    bmBaseline.current = new Set(getBookmarks('glossary'));
    setBmOpen(true);
    void listBookmarkContexts().then(setBmContexts);
  }, []);

  // Switch the popup to another context's bookmarks; re-baseline so removals are
  // counted per-list (task 4).
  const switchBmCtx = useCallback((ctx: string) => {
    bmBaseline.current = new Set(getBookmarks(ctx));
    setBmCtx(ctx);
  }, []);

  // Confirm-on-close (task 4): if ≥1 term was removed from the currently-shown
  // list since it was opened/selected, ask before closing. A fresh read via
  // getBookmarks avoids any stale hook snapshot.
  const requestCloseBookmarkPopup = useCallback(() => {
    const current = getBookmarks(bmCtx);
    let removed = 0;
    for (const id of bmBaseline.current) if (!current.has(id)) removed++;
    if (removed >= 1) {
      Alert.alert(
        'Removed from list',
        `You removed ${removed} term${removed === 1 ? '' : 's'} from ${ctxName(bmCtx)}.`,
        [
          { text: 'Keep open', style: 'cancel' },
          { text: 'Close', style: 'destructive', onPress: () => setBmOpen(false) },
        ],
      );
    } else {
      setBmOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bmCtx]);

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
        <Text style={styles.title} numberOfLines={1}>GLOSSARY</Text>
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
                setExpandedIds((prev) => new Set(prev).add(top));
                setFocusedId(top);
                void fetchDetails(top);
                scrollTermToTop(top);
              } else if (focusedId) {
                scrollTermToTop(focusedId);
              }
            } else if (focusedId && popupTrail.length === 0) {
              openPopupRoot(focusedId); // inline term follows into card view
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
          {/* BEG/ADV label now uses the standard amber header colour — the
              purple/blue tinting was removed (user request 2026-07-22). */}
          <Text style={styles.headerToggleText}>{ttsBeg ? 'BEG' : 'ADV'}</Text>
        </Pressable>
        {/* Σ — jump straight to the Audio Calculator Laboratory (owner
            2026-07-29). Opened from the glossary, so its own ‹ back (goBack)
            returns the user HERE, not to the lab menu. Purple to distinguish it
            from the amber view toggles. */}
        <Pressable
          style={styles.sigmaBtn}
          onPress={() => (navigation as any).navigate('CalcLab')}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Open the Audio Calculator Laboratory"
        >
          <Text style={styles.sigmaText}>Σ</Text>
        </Pressable>
        <View style={{ flex: 1 }} />
        {/* Current # of terms, WHITE — labeled "# of Terms" in the title font
            (user request 2026-07-24). */}
        <Text style={styles.count}>{loading ? '… Terms' : `${visible.length} Terms`}</Text>
      </View>

      <View style={styles.searchBox}>
        {/* Search glyph always on the left (Booth 2026-07-15). */}
        <Text style={styles.searchGlyph}>⌕</Text>
        <TextInput
          style={[styles.searchInput, searchGreen && styles.searchInputDone]}
          value={search}
          onChangeText={onSearchChange}
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
            onPress={clearSearch}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
          >
            <Text style={styles.searchClear}>✕</Text>
          </Pressable>
        ) : null}
        {/* Tap to dictate the search instead of typing (owner 2026-08-01).
            Absent until a build bundles the speech-recognition native module. */}
        {GlossaryDictation ? <GlossaryDictation onText={onSearchChange} /> : null}
      </View>

      {/* Filters never scroll — they wrap in place (Booth 2026-07-09b). In LIST
          mode they stay visible even while a definition is expanded (the term
          justifies up just below them); only a CARD popup hides them. */}
      {popupTrail.length === 0 && (
        <>
      <View style={styles.chipRow}>
        <Chip
          label="All"
          accent="#37e05f"
          active={filter === 'all'}
          onPress={() => {
            setFilter('all');
            setTopicPickerOpen(false);
          }}
        />
        {/* The "Course" filter was removed (user request 2026-07-23) — the app is
            commercial and has no academic course codes in the public glossary. */}
        <Chip
          // The Topic chip doubles as the entry point for the pinned
          // "Equations & Formulas" filter (reached from the same picker), so it
          // reflects that mode with the glossary's cyan accent when active.
          label={
            filter === 'equations'
              ? 'Equations ✓'
              : filter === 'topic' && selTopic
                ? 'Topic ✓'
                : 'Topic'
          }
          active={filter === 'topic' || filter === 'equations'}
          accent={filter === 'equations' ? colors.cyanBright : '#ffc64d'}
          onPress={() => {
            setFilter('topic');
            setTopicPickerOpen(true); // reopen the A–Z list to re-pick
          }}
        />
        {/* Bookmark filter — the bookmark glyph up top (user request 2026-07-22).
            Tap filters to bookmarked terms; HOLD opens the internal list. */}
        <Chip
          label="Bookmarks"
          accent="#b45bff"
          active={filter === 'favorites'}
          icon={(c) => (
            // Icon only — count removed; the total is shown in the top-right
            // "# Terms" readout (user request 2026-07-24).
            <View style={styles.chipIconWrap}>
              <BookmarkIcon color={c} filled={filter === 'favorites'} size={15} />
            </View>
          )}
          onPress={() => {
            setFilter('favorites');
            setTopicPickerOpen(false);
          }}
          onLongPress={openBookmarkPopup}
        />
        {/* Custom list (★ starred) filter — new (user request 2026-07-22). */}
        <Chip
          label="Custom"
          accent="#2f9bff"
          active={filter === 'custom'}
          icon={(c) => (
            // "CUSTOM" + the 3-card deck glyph; count removed (shown in the
            // top-right "# Terms" readout, user request 2026-07-24).
            <View style={styles.chipIconWrap}>
              <Text style={[styles.chipText, { color: c }]}>CUSTOM</Text>
              <DeckIcon color={c} size={16} fill={filter === 'custom' ? `${c}33` : 'none'} />
            </View>
          )}
          onPress={() => {
            setFilter('custom');
            setTopicPickerOpen(false);
          }}
          onLongPress={() => setTermListModal({ title: 'Custom list', kind: 'starred' })}
        />
        <Chip
          label="Recent"
          accent="#ffffff"
          active={filter === 'recent'}
          onLongPress={() => setTermListModal({ title: 'Recent', kind: 'recent' })}
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
          extraData={[expandedIds, focusedId, details, cardView, ttsBeg, termIndex, mediaById, filter, formulaById, search]}
          renderItem={({ item }) => {
            // List view expands INLINE; card view stays compact and opens the
            // popup overlay instead (below).
            const expanded = !cardView && expandedIds.has(item.id);
            const d = details[item.id];
            const mediaUrl = mediaById[item.id];
            // Active search query → highlight its occurrences GREEN in the term
            // and definition so the reader spots it (owner 2026-08-01).
            const hq = search.trim();
            return (
              <Pressable
                style={cardView ? styles.cardItem : [styles.entry, expanded && styles.entryExpanded]}
                onPress={() => {
                  if (cardView) {
                    openPopupRoot(item.id); // card tap = popup trail root
                    return;
                  }
                  const willExpand = !expandedIds.has(item.id);
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
                      {highlightNodes(item.term, hq)}
                    </Text>
                    {/* Danger flag sits right next to the term (Booth 2026-07-15). */}
                    {isHazardTerm(item.term) ? <CautionBadge iconOnly /> : null}
                    {/* Media icon (user request 2026-07-18) — a term with art
                        shows a framed-image glyph; tap → media popup. */}
                    {mediaUrl ? (
                      <Pressable
                        onPress={() => setMediaPopup(mediaUrl)}
                        hitSlop={10}
                        accessibilityRole="button"
                        accessibilityLabel={`View ${item.term} image`}
                      >
                        <MediaGlyph />
                      </Pressable>
                    ) : null}
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
                        bookmark shows what it does before you commit. */}
                    <HoldHintPressable
                      onPress={() => toggleFav(item.id)}
                      hint={bookmarks.has(item.id) ? 'Removes from Bookmarks' : 'Adds to Bookmarks'}
                      selected={bookmarks.has(item.id)}
                      accessibilityLabel={bookmarks.has(item.id) ? 'Remove bookmark' : 'Bookmark term'}
                    >
                      {/* Bookmark glyph sized down further vs the other row
                          icons (share 18 / speak 19 / star 19) — user request
                          2026-07-22. */}
                      <BookmarkIcon
                        color={bookmarks.has(item.id) ? colors.purple : colors.textMuted}
                        filled={bookmarks.has(item.id)}
                        size={15}
                      />
                    </HoldHintPressable>
                    {/* ★ Custom list toggle (user request 2026-07-18) — was
                        missing from the glossary row. */}
                    <HoldHintPressable
                      onPress={() => toggleTermList('starred', item.id)}
                      hint={starred.has(item.id) ? 'Removes from Custom list' : 'Adds to Custom list'}
                      selected={starred.has(item.id)}
                      accessibilityLabel={starred.has(item.id) ? 'Remove from custom list' : 'Add to custom list'}
                    >
                      <DeckIcon
                        color={starred.has(item.id) ? colors.blue : colors.textMuted}
                        size={19}
                        fill={starred.has(item.id) ? 'rgba(47,155,255,0.22)' : 'none'}
                      />
                    </HoldHintPressable>
                    {/* The +/- expand toggle was removed (user request
                        2026-07-23) — tapping the term row already shows/hides it. */}
                  </View>
                </View>
                {/* When expanded, the term's media image sits right after the
                    term for identification (user request 2026-07-18). */}
                {expanded && mediaUrl ? (
                  <Image source={{ uri: mediaUrl }} style={styles.inlineMedia} resizeMode="contain" />
                ) : null}
                {expanded ? (
                  // Feature 1: cross-links live in the EXPANDED definition
                  // (collapsed rows stay plain — the row tap owns them).
                  // BEG order (Booth 2026-07-11): plain-English on top.
                  <LinkedText
                    text={ttsBeg ? item.plain_english || item.definition : item.definition}
                    style={[styles.definition, ttsBeg && styles.definitionBeg]}
                    selfId={item.id}
                    index={termIndex}
                    onLink={onLinkPress}
                    highlight={hq}
                  />
                ) : (
                  <Text
                    style={[styles.definition, ttsBeg && styles.definitionBeg]}
                    numberOfLines={cardView ? 2 : undefined}
                  >
                    {highlightNodes(ttsBeg ? item.plain_english || item.definition : item.definition, hq)}
                  </Text>
                )}

                {/* In the Equations & Formulas view, surface the term's symbolic
                    formula (and its plain-language form) right on the row. */}
                {filter === 'equations' && formulaById[item.id] ? (
                  <View style={styles.formulaWrap}>
                    <Text style={styles.formulaSymbolic}>{formulaById[item.id].symbolic}</Text>
                    {formulaById[item.id].words ? (
                      <Text style={styles.formulaWords}>{formulaById[item.id].words}</Text>
                    ) : null}
                  </View>
                ) : null}

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
                      mistakesReadable={isMember}
                      onLabAction={onLabAction}
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
                        {mediaById[item.id] ? (
                          <Pressable
                            onPress={() => setMediaPopup(mediaById[item.id])}
                            hitSlop={10}
                            accessibilityRole="button"
                            accessibilityLabel={`View ${item.term} image`}
                          >
                            <MediaGlyph />
                          </Pressable>
                        ) : null}
                        <SpeakButton text={speakTextFor(item, ttsBeg)} size={24} />
                      </View>
                      {/* Media image right after the term (user request 2026-07-18). */}
                      {mediaById[item.id] ? (
                        <Image source={{ uri: mediaById[item.id] }} style={styles.inlineMedia} resizeMode="contain" />
                      ) : null}
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
                            mistakesReadable={isMember}
                            onLabAction={onLabAction}
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
          topicLinksLocked ? (
            // View-only for non-members (user request 2026-07-25): the topic list
            // stays FULLY readable, but the rows don't ACTIVATE the filter — each
            // shows a MEMBERS lock and, on tap, raises a brief membership hint
            // (viewing is fine; only selecting a topic is gated). A ✕ closes it,
            // since a row tap no longer selects/closes.
            <View style={styles.topicOverlay}>
              <View style={styles.topicLockedHeader}>
                <Text style={styles.topicOverlayTitle}>SELECT A TOPIC · A–Z</Text>
                <Pressable
                  onPress={() => setTopicPickerOpen(false)}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel="Close topic list"
                >
                  <Text style={styles.cardPopupCloseText}>✕</Text>
                </Pressable>
              </View>
              <Text style={styles.topicLockHint}>{COPY.upgradePhrase}</Text>
              <ScrollView keyboardShouldPersistTaps="handled" {...NO_TOUCH_DELAY}>
                {/* Equations & Formulas is a free cross-topic reference list, so
                    it stays SELECTABLE even here where per-topic links are
                    member-locked (user request 2026-07-26). */}
                <Pressable
                  style={styles.equationsRow}
                  onPress={selectEquations}
                  accessibilityRole="button"
                  accessibilityLabel={`Equations & Formulas, ${equationCount} term${equationCount === 1 ? '' : 's'}`}
                >
                  <Text style={styles.equationsRowText}>∑  Equations &amp; Formulas</Text>
                  <Text style={styles.equationsCount}>{equationCount}</Text>
                </Pressable>
                {topicsAZ.map((t) => (
                  <Pressable
                    key={t.id}
                    style={styles.topicRow}
                    onPress={() => setTopicGate(true)}
                    accessibilityRole="button"
                    accessibilityLabel={`${t.name} — active membership required to filter`}
                  >
                    <Text style={styles.topicRowText}>{t.name}</Text>
                    <Text style={styles.topicMembersTag}>🔒 MEMBERS</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ) : (
            <View style={styles.topicOverlay}>
              <Text style={styles.topicOverlayTitle}>SELECT A TOPIC · A–Z</Text>
              <ScrollView keyboardShouldPersistTaps="handled" {...NO_TOUCH_DELAY}>
                {/* Pinned cross-topic filter: only the terms that ARE
                    equations/formulas, alphabetical. Not member-gated. */}
                <Pressable
                  style={styles.equationsRow}
                  onPress={selectEquations}
                  accessibilityRole="button"
                  accessibilityLabel={`Equations & Formulas, ${equationCount} term${equationCount === 1 ? '' : 's'}`}
                >
                  <Text style={styles.equationsRowText}>∑  Equations &amp; Formulas</Text>
                  <Text style={styles.equationsCount}>{equationCount}</Text>
                </Pressable>
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

      {/* Media viewer (user request 2026-07-18) — tap anywhere to close. */}
      <Modal visible={!!mediaPopup} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setMediaPopup(null)}>
        <Pressable style={styles.mediaBackdrop} onPress={() => setMediaPopup(null)} accessibilityRole="button" accessibilityLabel="Close image">
          {mediaPopup ? <Image source={{ uri: mediaPopup }} style={styles.mediaFull} resizeMode="contain" /> : null}
          <Text style={styles.mediaHint}>TAP TO CLOSE</Text>
        </Pressable>
        <LowLightDim />
      </Modal>

      {/* Held-chip term list (user request 2026-07-22) — the members of one set
          (Bookmarks / Custom / Recent). Tap a term to open it; the select icons
          re-tag it into any list. Mirrors the Flashcards held-chip list. */}
      <Modal visible={!!termListModal} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setTermListModal(null)}>
        <View style={styles.tlBackdrop}>
          <Pressable
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            onPress={() => setTermListModal(null)}
            accessibilityRole="button"
            accessibilityLabel="Dismiss"
          />
          <View style={styles.tlCard}>
            <Text style={styles.tlTitle}>
              {(termListModal?.title ?? '').toUpperCase()} · {termListRows.length}
            </Text>
            <ScrollView style={{ flexGrow: 0 }} showsVerticalScrollIndicator {...NO_TOUCH_DELAY}>
              {termListRows.length > 0 ? (
                termListRows.map((r) => (
                  <View key={r.id} style={styles.tlRow}>
                    <Pressable
                      style={{ flex: 1 }}
                      onPress={() => openTermFromList(r.id)}
                      accessibilityRole="button"
                      accessibilityLabel={`Open ${r.term}`}
                    >
                      <Text
                        style={[
                          styles.tlItem,
                          termListModal?.kind === 'bookmark' && { color: '#b45bff' },
                          termListModal?.kind === 'starred' && { color: '#2f9bff' },
                        ]}
                        numberOfLines={1}
                      >
                        {r.term} ›
                      </Text>
                    </Pressable>
                    <TermSelectIcons id={r.id} bookmarkCtx={termListModal?.bookmarkCtx ?? 'glossary'} hideKnown />
                  </View>
                ))
              ) : (
                <Text style={styles.tlEmpty}>No terms in this set.</Text>
              )}
            </ScrollView>
            <Pressable style={styles.tlClose} onPress={() => setTermListModal(null)} accessibilityRole="button" accessibilityLabel="Close list">
              <Text style={styles.tlCloseText}>CLOSE</Text>
            </Pressable>
          </View>
        </View>
        <LowLightDim />
      </Modal>

      {/* Single bookmark popup (redesign, user request 2026-07-25) — the SELECTED
          context's bookmarked terms up top (each re-taggable via the select
          icons), then an OTHER LISTS switcher for every other context that holds
          bookmarks. Closing confirms if terms were removed from the shown list. */}
      <Modal visible={bmOpen} transparent animationType="fade" statusBarTranslucent onRequestClose={requestCloseBookmarkPopup}>
        <View style={styles.tlBackdrop}>
          <Pressable
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            onPress={requestCloseBookmarkPopup}
            accessibilityRole="button"
            accessibilityLabel="Dismiss"
          />
          <View style={styles.tlCard}>
            <Text style={styles.tlTitle}>{ctxName(bmCtx).toUpperCase()} · {bmRows.length}</Text>
            <ScrollView style={{ flexGrow: 0 }} showsVerticalScrollIndicator {...NO_TOUCH_DELAY}>
              {bmRows.length > 0 ? (
                bmRows.map((r) => (
                  <View key={r.id} style={styles.tlRow}>
                    <Pressable
                      style={{ flex: 1 }}
                      onPress={() => openTermFromBm(r.id)}
                      accessibilityRole="button"
                      accessibilityLabel={`Open ${r.term}`}
                    >
                      <Text style={[styles.tlItem, { color: '#b45bff' }]} numberOfLines={1}>
                        {r.term} ›
                      </Text>
                    </Pressable>
                    <TermSelectIcons id={r.id} bookmarkCtx={bmCtx} hideKnown />
                  </View>
                ))
              ) : (
                <Text style={styles.tlEmpty}>No bookmarks in this list yet.</Text>
              )}

              {/* OTHER LISTS — EVERY selectable list (Glossary + all topics),
                  even empty ones, plus any other non-empty context; tap to switch
                  the terms shown above. Empty lists read count 0 (user request
                  2026-07-25). */}
              {bmSwitcherRows.length > 0 ? (
                <View style={styles.bmOtherWrap}>
                  <Text style={styles.bmOtherLabel}>OTHER LISTS</Text>
                  {bmSwitcherRows.map((b) => (
                    <Pressable
                      key={b.ctx}
                      style={styles.tlRow}
                      onPress={() => switchBmCtx(b.ctx)}
                      accessibilityRole="button"
                      accessibilityLabel={`Switch to ${ctxName(b.ctx)}, ${b.count} bookmark${b.count === 1 ? '' : 's'}`}
                    >
                      <Text style={[styles.tlItem, { color: '#b45bff', flex: 1 }]} numberOfLines={1}>
                        {ctxName(b.ctx)} ›
                      </Text>
                      <Text style={styles.tlCount}>{b.count}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </ScrollView>
            <Pressable style={styles.tlClose} onPress={requestCloseBookmarkPopup} accessibilityRole="button" accessibilityLabel="Close list">
              <Text style={styles.tlCloseText}>CLOSE</Text>
            </Pressable>
          </View>
        </View>
        <LowLightDim />
      </Modal>

      {/* Topic-filter member gate (user request 2026-07-25) — a brief hint that
          selecting a topic needs active membership; the optional EXPLORE button
          routes to the paywall (user-initiated, never automatic). */}
      <PrePaywallPrompt
        visible={topicGate}
        onClose={() => setTopicGate(false)}
        title="Members only"
        lines={['Filtering the glossary by topic is an active-membership feature.', COPY.upgradePhrase]}
        primaryLabel="EXPLORE MEMBERSHIP?"
        onPrimary={() => {
          setTopicGate(false);
          (navigation as any).navigate('Paywall');
        }}
      />

      {/* Glossary intro placeholder (Booth 2026-07-18). */}
      <ScreenIntroOverlay introKey="glossary" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg, paddingHorizontal: 16, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingTop: 16 },
  // flexShrink so the GLOSSARY title yields FIRST when the row is tight — the
  // right-side "N Terms" count stays fully anchored on the right (owner 2026-08-01).
  title: { flexShrink: 1, fontFamily: fonts.oswaldSemiBold, fontSize: 17, letterSpacing: 1.4, color: colors.textPrimary },
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
  // Σ → Audio Calculator Laboratory (owner 2026-07-29), purple to set it apart
  // from the amber view toggles; sized to match the toggle buttons' height.
  sigmaBtn: {
    paddingHorizontal: 11,
    paddingVertical: 3,
    borderRadius: 4.5,
    borderWidth: 1,
    borderColor: colors.purple,
    backgroundColor: 'rgba(180,91,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sigmaText: { fontFamily: fonts.oswaldSemiBold, fontSize: 16, lineHeight: 20, color: colors.purple },
  // Nudged in from the right edge so the "ms" of "Terms" clears the phone's
  // Right-justified, NEVER shrinks (flexShrink 0) so it can't be pushed off the
  // right/beveled edge — it stays anchored right and grows inward/leftward as the
  // number gets larger (owner 2026-08-01).
  count: { flexShrink: 0, textAlign: 'right', fontFamily: fonts.oswaldSemiBold, fontSize: 12, color: colors.textPrimary, marginRight: 8 },
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
  // GREEN once a search has settled and its results are shown (owner 2026-08-01).
  searchInputDone: { color: '#37e05f' },
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
  // Pinned "Equations & Formulas" row at the top of the topic picker — its own
  // cyan accent so it reads as a special cross-topic filter, not a topic.
  equationsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 15,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(127,212,255,0.22)',
    backgroundColor: 'rgba(127,212,255,0.06)',
  },
  equationsRowText: {
    flexShrink: 1,
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 14,
    letterSpacing: 0.6,
    color: colors.cyanBright,
  },
  equationsCount: { fontFamily: fonts.mono, fontSize: 13, color: colors.cyanBright },
  // Formula shown on a row in the Equations & Formulas view.
  formulaWrap: { marginTop: 8, gap: 2 },
  formulaSymbolic: { fontFamily: fonts.mono, fontSize: 16, lineHeight: 24, color: colors.cyanBright },
  formulaWords: { fontFamily: fonts.barlowRegular, fontStyle: 'italic', fontSize: 14, lineHeight: 20, color: colors.textSub },
  topicRowText: { flexShrink: 1, fontFamily: fonts.barlowMedium, fontSize: 15, color: colors.textSecondary },
  // View-only topic overlay header: title + ✕ (rows no longer close it).
  topicLockedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.hairlineDim,
    paddingRight: 12,
  },
  // Small "MEMBERS" lock tag on each non-selectable topic row (view-only mode).
  topicMembersTag: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 10.5,
    letterSpacing: 1,
    color: colors.amberLabel,
  },
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
  // minHeight + centering so the icon-only Bookmarks chip is the SAME height
  // as the text chips beside it — top/bottom edges align (owner 2026-07-29).
  chip: {
    minHeight: 38,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 4.5,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  // Expanded rows get a BORDER around the whole term+definition (like the card
  // popup), persisting on scroll; several can be open at once (user request
  // 2026-07-18).
  entryExpanded: {
    backgroundColor: '#141210',
    marginHorizontal: -8,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,180,0,.45)',
    borderBottomColor: 'rgba(255,180,0,.45)',
    marginVertical: 4,
  },
  // In-definition media image, shown right after the term.
  inlineMedia: { width: '100%', height: 190, borderRadius: 10, marginTop: 8, marginBottom: 4, backgroundColor: '#0d0d0d' },
  // Full-screen media viewer.
  mediaBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,.92)', alignItems: 'center', justifyContent: 'center', padding: 16, gap: 16 },
  mediaFull: { width: '100%', height: '78%' },
  mediaHint: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 2, color: colors.textSub },
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
    // Very subtle gray lift so each card reads as its own surface (owner 2026-08-01).
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.28,
    shadowRadius: 3,
    elevation: 2,
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
  // Search-hit highlight (owner 2026-08-01): the matched letters print GREEN
  // (colour only, so they keep the surrounding font) so they stand out in the
  // term + definition and the reader spots the searched word instantly.
  hlMatch: { color: '#37e05f' },
  termLink: {
    // One shade darker blue (user request 2026-07-18).
    color: '#9fbede',
    textDecorationLine: 'underline',
    textDecorationColor: 'rgba(159,190,222,0.35)',
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
    fontFamily: fonts.barlowMedium,
    fontSize: 17,
    lineHeight: 26,
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
  // Custom-list star (starred) — amber when on, muted otherwise.
  customStar: { fontSize: 19, color: colors.textMuted },
  customStarOn: {
    color: colors.amber,
    textShadowColor: 'rgba(255,180,0,.5)',
    textShadowRadius: 7,
    textShadowOffset: { width: 0, height: 0 },
  },
  // Expand/collapse +/− — deliberately a touch smaller than the action icons.
  entryExpand: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 15,
    lineHeight: 18,
    color: colors.textSubAlt,
    width: 14,
    textAlign: 'center',
  },
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
  // read dimmer than the rest (Booth 2026-07-10). The purple (technical) / blue
  // (plain English) tinting was removed — both now use the standard body colour
  // (user request 2026-07-22).
  definition: { fontFamily: fonts.barlowMedium, fontSize: 16, lineHeight: 25, color: colors.textSecondary, marginTop: 4 },
  definitionBeg: {},
  detailBlock: { marginTop: 10, gap: 12 },
  detailSection: { gap: 4 },
  detailEyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.6, color: colors.amberLabel },
  // Audio Learning Lab action row (only on READY terms — learningProfiles.ts).
  labActionWrap: { gap: 7 },
  labActionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  labActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,198,77,.5)',
    backgroundColor: '#17140c',
    paddingVertical: 9,
    paddingHorizontal: 13,
  },
  labActionText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 0.5, color: colors.amber },
  detailBody: { fontFamily: fonts.barlowMedium, fontSize: 16, lineHeight: 25, color: colors.textSecondary },
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
  // Bookmark filter chip: glyph + optional count, laid out in a row.
  chipIconWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  // Held-chip term list overlay (user request 2026-07-22) — mirrors Flashcards.
  tlBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  tlCard: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '78%',
    backgroundColor: '#161719',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2c2d31',
    padding: 18,
  },
  tlTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.4, color: colors.amber, marginBottom: 10 },
  tlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#202022',
    paddingVertical: 2,
  },
  tlItem: { flex: 1, fontFamily: fonts.barlowRegular, fontSize: 15, lineHeight: 26, color: '#7fbfff' },
  tlCount: { fontFamily: fonts.mono, fontSize: 13, color: colors.textSecondary, marginLeft: 8 },
  tlEmpty: { fontFamily: fonts.barlowRegular, fontStyle: 'italic', fontSize: 14, color: colors.textMuted },
  // "OTHER LISTS" switcher inside the single bookmark popup (user request 2026-07-25).
  bmOtherWrap: { marginTop: 14, borderTopWidth: 1, borderTopColor: '#242427', paddingTop: 10 },
  bmOtherLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.4, color: colors.textMuted, marginBottom: 4 },
  tlClose: { marginTop: 12, alignItems: 'center', paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#3a3a3a' },
  tlCloseText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.4, color: colors.textSubAlt },
});
