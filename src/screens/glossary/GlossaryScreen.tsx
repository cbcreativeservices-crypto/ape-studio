/**
 * S17 — Glossary (visuals from 19-s17-glossary.dc.html) + Booth change order
 * 2026-07-07:
 *  - ALL = every term in the corpus (fetched in 1000-row pages past the
 *    PostgREST cap), not just enrolled courses.
 *  - TOPIC filter narrows in place via a topic-chip picker, showing only that
 *    topic's terms. The list is the LIVE v3 curriculum only (owner
 *    2026-08-06) — not a fixed topic count.
 *  - The chip row is ALL · Topic · Bookmarks · Custom · Recent (see `Filter`).
 *    There is NO course filter: the course chip was removed in July 2026 and
 *    its backing `courses` fetch (the archived v1 college catalog) went with
 *    it on 2026-09-03 — see the note at the load effect.
 *  - Reachable with no context (Glossary card on Course Selection); Dashboard
 *    entry preselects its course/topic.
 * Search by term · empty: "No results for [filter]" · bottom nav visible.
 */
import { memo, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState, type ComponentType, type ReactNode } from 'react';
import { Alert, AppState, FlatList, Image, ImageBackground, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type StyleProp, type TextStyle } from 'react-native';
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
import { LinkIcon } from '../../components/LinkIcon';
import { useGlossaryLinksPref } from '../../features/glossary/linksPref';
import { ShareTermSheet, type NamedTerm, type ShareTermPayload } from '../../components/ShareTermSheet';
import type { GlossaryShareTerm } from '../../features/glossary/glossaryShare';
import { LowLightDim } from '../../features/settings/LowLightLayer';
import { BookmarkIcon, HoldHintPressable, TermSelectIcons } from '../../features/flags/TermSelectIcons';
import { SpeakButton, stopAllSpeech } from '../../components/SpeakButton';
import { StudioButton } from '../../components/StudioButton';
import { useEntitlement } from '../../features/commercial/EntitlementProvider';
import { HelpDot, useScreenHelp } from '../../features/help/ScreenHelpSheet';
import { getBookmarks, listBookmarkContexts, toggleBookmark, toggleTermList, useBookmarks, useTermList } from '../../features/flags/flaggedStore';
import { ScreenIntroOverlay } from '../../features/intro/ScreenIntroOverlay';
import { PrePaywallPrompt } from '../../components/PrePaywallPrompt';
import { COPY } from '../../lib/copy';
import { useCoachMark } from '../../lib/coachMark';
import { sendFeedback } from '../../lib/feedback';
import { confirmDialog, notify } from '../../lib/confirm';
import { fetchCorpusTerms, fetchDefinitionsFor, yieldToUi } from '../../features/glossary/corpusFetch';
import {
  OFFLINE_AVAILABLE,
  corpusStats,
  idsMissingDefinitions,
  loadDefinitions as loadStoredDefinitions,
  loadTerms as loadStoredTerms,
  saveDefinitions as saveStoredDefinitions,
  saveTerms as saveStoredTerms,
} from '../../features/glossary/offlineCorpus';
import {
  GLOSSARY_WARN_AT_USED,
  GLOSSARY_WEEK_MS,
  consumeGlossary,
  getGlossaryStatus,
  type CapMode,
} from '../../features/glossary/glossaryCap';
import { collapsedDefinitionLines } from '../../features/glossary/collapsedLines';
import { GlossaryLockView } from '../../features/glossary/GlossaryLockView';
import { GlossaryDeviceKeyView } from '../../features/glossary/GlossaryDeviceKeyView';
import {
  deviceKeyState,
  mintDeviceKey,
  readConsent,
  writeConsent,
  type ConsentRecord,
} from '../../features/glossary/deviceKey';
import {
  corpusTable,
  fetchDefinitionViaGateway,
  probeGateway,
  resetGatewayProbe,
  type GatewayProbe,
} from '../../features/glossary/glossaryGateway';
import { isHazardTerm } from '../../lib/hazard';
import { CautionBadge } from '../../components/CautionBadge';
import { supabase } from '../../lib/supabase';
import { safeSession } from '../../lib/getSessionSafe';
import { V3_CURRICULUM_VERSION_ID } from '../../data/v3Curriculum';
import { isCalcBackedTerm, calcLinkForTerm } from '../lab/calc/calcGlossaryLinks';
import { SUPABASE_URL } from '../../lib/env';
import { colors, fonts } from '../../theme/tokens';
import {
  getLearningProfile,
  ACTION_LABELS,
  type GlossaryAction,
} from '../../features/glossary/learningProfiles';
import { getLabLesson } from '../../features/lab/guidedLessons';
import type { StudyStackParamList } from '../../navigation/types';

const BG_GLOSSARY = require('../../../assets/lab-backgrounds/glossary.webp');

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

// ── Session cache (owner 2026-08-10, glossary speed #1) ──────────────────────
// The heavy glossary reads — the ~22.7k-row corpus and the media/formula maps —
// downloaded on EVERY Glossary focus. They now download ONCE per app session:
// each loader memoizes its in-flight/settled Promise at module scope, so a
// second visit (or a concurrent caller) reuses the same result instead of
// re-paging Supabase. The cache lives for the app process only — a relaunch
// re-fetches, and the fuller persistent-cache/delta-sync work is deferred to
// launch prep (#2/#3). A failed load is NOT cached, so it can retry next focus.
let ENTRIES_CACHE: Promise<Entry[]> | null = null;
// WHICH relation the cached corpus came from. Minting a device key can change
// the answer mid-session (the browse view is granted to `authenticated` only),
// and serving a member 120-character teasers out of a stale cache would look
// like the definitions had been truncated. See loadAllEntries.
let ENTRIES_TABLE: 'glossary' | 'glossary_browse_v' | null = null;

/** How long a key may stay undecided before the screen admits it is stuck. */
const KEY_WAIT_MS = 9000;

/**
 * True when the device key has sat undecided long enough that the screen
 * should stop showing a spinner. See the note at the call site.
 *
 * 'ask' and 'declined' are NOT stuck — they are answers, and each has its own
 * view. Only the states that show nothing can strand the user.
 */
function useKeyTimeout(keyState: string): boolean {
  const [stuck, setStuck] = useState(false);
  useEffect(() => {
    if (keyState === 'ready' || keyState === 'ask' || keyState === 'declined') {
      setStuck(false);
      return;
    }
    const t = setTimeout(() => setStuck(true), KEY_WAIT_MS);
    return () => clearTimeout(t);
  }, [keyState]);
  return stuck;
}
let MEDIA_CACHE: Promise<Record<string, string>> | null = null;
let FORMULA_CACHE: Promise<Record<string, { symbolic: string; words: string | null }>> | null = null;

/**
 * MEMORY RELEASE VALVE (2026-09-05). The three caches above hold the whole
 * 26,847-row corpus plus its derived indexes for the entire process once the
 * Glossary has been opened even briefly, and nothing ever dropped them. That is
 * multi-MB of resident JS heap on a screen the user may have left an hour ago,
 * which is exactly what gets an app OOM-killed on a 2–3 GB device — and a kill
 * counts against the user-perceived crash rate that Play uses for visibility.
 *
 * Freeing on a SUSTAINED background only: a quick app switch (checking a
 * message, answering a call) must not cost the user a corpus reload, so the
 * timer has to elapse first. Coming back to the foreground cancels it. The
 * loaders already handle a cold start with their own progress UI, and a failed
 * load is not cached, so re-entry after a release is the normal cold path.
 *
 * ⛔ 60 SECONDS BROKE THE EXACT CASE THE PARAGRAPH ABOVE PROMISES (owner
 * 2026-09-22: "my iphone froze the app when i received and viewed a sms
 * message - when i returned the app was frozen").
 *
 * Reading and replying to a text takes longer than a minute, so the window
 * named as safe — "checking a message" — was the window that dropped the
 * corpus. Coming back re-paged 26,975 rows over 27 sequential requests while
 * the glossary sat on screen fully drawn and unresponsive, which is what a
 * frozen app looks like from the outside. Sentry APE-STUDIO-F recorded it as
 * "App hanging for at least 2000 ms" with the paging calls as the last
 * breadcrumbs.
 *
 * Five minutes covers reading a message or taking a call and still frees the
 * corpus for someone who has genuinely moved on. It barely weakens the OOM
 * protection this valve exists for: an app idle in the background for five
 * minutes is one iOS is usually about to reclaim anyway, and the release only
 * ever mattered for a much longer absence.
 *
 * The window is not the whole fix. A reload must not freeze the app EITHER —
 * see `yieldToUi` in the loaders and the `setLoading(true)` on re-entry.
 */
const CACHE_RELEASE_MS = 300000;

/**
 * Has the corpus been dropped (or never loaded)?
 *
 * The focus effect asks this so that a reload SHOWS ITSELF. Without it the
 * screen kept the previous list on screen and simply stopped responding —
 * indistinguishable from a crash, and the reason the report above says
 * "frozen" rather than "slow".
 */
function corpusNeedsLoad(table: 'glossary' | 'glossary_browse_v'): boolean {
  // `table` matters: loadAllEntries drops the cache itself when the table
  // changes (a guest signing in swaps teasers for full definitions), and that
  // re-page is just as long as the one after a release.
  return ENTRIES_CACHE === null || ENTRIES_TABLE !== table;
}

let releaseTimer: ReturnType<typeof setTimeout> | null = null;
AppState.addEventListener('change', (st) => {
  if (releaseTimer) {
    clearTimeout(releaseTimer);
    releaseTimer = null;
  }
  if (st !== 'background') return;
  releaseTimer = setTimeout(() => {
    releaseTimer = null;
    ENTRIES_CACHE = null;
    MEDIA_CACHE = null;
    FORMULA_CACHE = null;
  }, CACHE_RELEASE_MS);
});

/** The allowance heads-up (Option A, owner 2026-09-10): at 7 used → 7 left, and
 *  a closing note on the last one. Module scope because BOTH meters — the
 *  device-local one and the server gateway — have to say the same thing. */
function warnUsage(used: number, limit: number): void {
  if (used === GLOSSARY_WARN_AT_USED && used < limit) {
    notify(
      'Heads up — weekly glossary limit',
      `That’s ${used} of ${limit} free lookups this week — ${limit - used} left for the rest of your week. Academy membership makes the glossary unlimited.`,
    );
  } else if (used >= limit) {
    notify(
      'Weekly glossary limit',
      `That was your last free glossary lookup this week (${limit} of ${limit}). It resets one week after your first one. Academy membership makes the glossary unlimited.`,
    );
  }
}

/** Memoize a loader's Promise for the session; drop the cache if it rejects. */
function sessionCache<T>(slot: () => Promise<T> | null, set: (p: Promise<T> | null) => void, run: () => Promise<T>): Promise<T> {
  const existing = slot();
  if (existing) return existing;
  const p = run().catch((e) => {
    set(null); // don't cache a failure — allow a retry on the next focus
    throw e;
  });
  set(p);
  return p;
}

/** Session-cached corpus load (all tiers), paged past the 1000-row PostgREST cap.
 *
 *  `table` is `glossary_browse_v` once the server gateway is deployed — the same
 *  columns, with the definition masked to a teaser for anyone who is not a
 *  member — and plain `glossary` until then. Changing table invalidates the
 *  cache: a member who just signed in must not keep reading a guest's teasers. */
function loadAllEntries(table: 'glossary' | 'glossary_browse_v'): Promise<Entry[]> {
  if (ENTRIES_TABLE !== table) {
    ENTRIES_CACHE = null;
    ENTRIES_TABLE = table;
  }
  return sessionCache(
    () => ENTRIES_CACHE,
    (p) => (ENTRIES_CACHE = p),
    async () => {
      /**
       * ⛔ TERMS ONLY. DEFINITIONS ARE FETCHED FOR WHAT IS ON SCREEN.
       *
       * Owner 2026-09-22, after Discovery B/C took the corpus from 26,975 to
       * 31,858 terms: "opening the glossary seems to brick the app" — the list
       * drew and then nothing responded.
       *
       * Measured against production: of the ~5.4 MB this select used to pull,
       * `definition` is 3.8 MB of it, and `plain_english` is NULL for all
       * 31,858 rows — it was being requested for every one and never held a
       * value. Building 31,858 objects carrying all of that is what blocked the
       * JS thread; yielding between pages (below) let the UI breathe DURING the
       * load but could not make the load smaller.
       *
       * id + term + achievement_id is ~1.5 MB. Search only ever reads `term`
       * (see searchRank), so nothing about finding a term depends on this, and
       * definitions arrive through `ensureDefinitions` for the rows actually
       * displayed — reusing the same in-place merge + `defRev` repaint that
       * `openViaGateway` already uses for the metered read.
       *
       * ⛔ Do NOT add `definition` back to this select to "simplify" it. The
       * corpus will keep growing; this is the fix that survives that.
       */
      /**
       * ⛔ THE DEVICE COPY COMES FIRST (owner 2026-09-22: "the glossary needs to
       * work offline after being loaded. a user lets say who works on a cruise
       * will not be able to load it every time").
       *
       * Before this there was no persistence of ANY kind — the corpus lived in
       * a module variable, so every cold start re-downloaded all 31,858 terms
       * and a reader with no signal had no glossary at all.
       */
      const stored = await loadStoredTerms(table).catch(() => [] as typeof EMPTY_TERMS);
      if (stored.length) {
        // Revalidate WITHOUT blocking the reader. A changed corpus is written
        // to the device and picked up on the next cold open; swapping 31,858
        // rows under someone mid-scroll would be worse than a day-late term.
        void revalidateCorpus(table, stored.length);
        return stored.map((r) => ({
          id: r.id,
          term: r.term,
          definition: '',
          plain_english: null,
          achievement_id: r.achievement_id,
        }));
      }

      const terms = await fetchCorpusTerms(table);
      // Best-effort: a failed write costs a re-download next launch, nothing more.
      void saveStoredTerms(table, terms).catch(() => {});
      return terms.map((r) => ({
        id: r.id,
        term: r.term,
        definition: '',
        plain_english: null,
        achievement_id: r.achievement_id,
      }));
    },
  );
}

/** Load the first image per term across the whole glossary_media table (paged).
 *  Sparse today (art not fully uploaded), so this is cheap; empty → no icons.
 *  Session-cached (owner 2026-08-10). */
function loadAllGlossaryMedia(): Promise<Record<string, string>> {
  return sessionCache(() => MEDIA_CACHE, (p) => (MEDIA_CACHE = p), fetchAllGlossaryMedia);
}
// Rejects on a failed page (network/permission error) — non-fatal for the
// caller, which just keeps rendering without icons — so sessionCache does NOT
// memoize an empty offline result for the whole session (B-176).
async function fetchAllGlossaryMedia(): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('glossary_media')
      .select('glossary_id, media_type, url, sort_order')
      .order('glossary_id')
      .order('sort_order')
      .range(from, from + PAGE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    for (const m of data as { glossary_id: string; media_type: string | null; url: string | null }[]) {
      if (!m.url || (m.media_type && m.media_type !== 'image')) continue;
      if (!out[m.glossary_id]) out[m.glossary_id] = `${SUPABASE_URL}/storage/v1/object/public/${m.url}`;
    }
    if (data.length < PAGE) break;
    await yieldToUi();
  }
  return out;
}

/** Formula map for the "Equations & Formulas" filter: id → the term's symbolic
 *  formula (+ plain-language words). A term counts as an equation/formula when
 *  its `formula_symbolic` is non-empty. Loaded in ONE isolated, NON-FATAL paged
 *  pass, deliberately kept OUT of the main corpus select (loadEntries below) so
 *  a failure here can never break the glossary corpus load.
 *  Session-cached (owner 2026-08-10).
 *
 *  ⛔ FILTER SERVER-SIDE — THIS CAUSED A PRODUCTION APP HANG (2026-09-21).
 *  This pass used to page the ENTIRE corpus unfiltered and throw away the rows
 *  with no formula on the device. Sentry APE-STUDIO-F caught the result on a
 *  tester's iPhone 16 Pro (iOS 27, build 28): 27 sequential 1000-row requests,
 *  ~230 ms apart, each parsed on the JS thread — the last breadcrumb before
 *  "App hanging for at least 2000 ms" is offset=22000, and the device had
 *  112 MiB free at the time.
 *
 *  The two comments this replaces claimed the columns were ungranted and that
 *  "0 of 14,246 rows carry one", so the whole scan looked free. Both went stale
 *  without anyone noticing: verified against production 2026-09-21, anon AND
 *  authenticated hold the SELECT grant on id/formula_symbolic/formula_words,
 *  and 1,911 of 26,975 rows carry a formula. The scan was never free — it just
 *  got slower every time the corpus grew, which is exactly why it surfaced now.
 *
 *  Filtering in the query fetches those 1,911 rows in 2 pages instead of 26,975
 *  in 27. Keep the filter here; do not "simplify" it back to a bare select. */
function loadAllGlossaryFormulas(
  table: 'glossary' | 'glossary_browse_v',
): Promise<Record<string, { symbolic: string; words: string | null }>> {
  return sessionCache(() => FORMULA_CACHE, (p) => (FORMULA_CACHE = p), () => fetchAllGlossaryFormulas(table));
}
// Rejects on a failed page (network error, or a column-grant 403) — the caller
// swallows it and the filter simply shows no terms — so sessionCache does NOT
// memoize an empty failed result for the whole session (B-176).
async function fetchAllGlossaryFormulas(
  table: 'glossary' | 'glossary_browse_v',
): Promise<Record<string, { symbolic: string; words: string | null }>> {
  const out: Record<string, { symbolic: string; words: string | null }> = {};
  const PAGE_F = 1000;
  for (let from = 0; ; from += PAGE_F) {
    const { data, error } = await supabase
      .from(table)
      .select('id, formula_symbolic, formula_words')
      // The filter that keeps this off the main thread — see the block comment.
      // Whitespace-only values still slip through `neq ''`, so the trim check
      // below stays as the authority on what counts as a formula.
      .not('formula_symbolic', 'is', null)
      .neq('formula_symbolic', '')
      .order('id')
      .range(from, from + PAGE_F - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    for (const r of data as { id: string; formula_symbolic: string | null; formula_words: string | null }[]) {
      if (r.formula_symbolic && r.formula_symbolic.trim() !== '') {
        out[r.id] = { symbolic: r.formula_symbolic, words: r.formula_words ?? null };
      }
    }
    if (data.length < PAGE_F) break;
    await yieldToUi();
  }
  return out;
}

const EMPTY_TERMS: { id: string; term: string; achievement_id: string | null }[] = [];

/**
 * Is the device copy still current? Cheap check, then a full refresh only when
 * it is not.
 *
 * The count comes from `get_glossary_term_count`, the nightly RPC the loading
 * header already uses. ⚠️ It only moves when the NUMBER of terms changes, so an
 * edited definition with no count change will not invalidate — a corpus
 * version or max(updated_at) would be the honest signal and needs a backend
 * column. Recorded rather than pretended: this catches additions and removals,
 * which is what Discovery-style batches actually are.
 */
async function revalidateCorpus(table: 'glossary' | 'glossary_browse_v', haveCount: number): Promise<void> {
  try {
    const { data, error } = await supabase.rpc('get_glossary_term_count');
    if (error || typeof data !== 'number' || data === haveCount) return;
    const fresh = await fetchCorpusTerms(table);
    await saveStoredTerms(table, fresh);
  } catch {
    // Offline, or the RPC is unavailable — keep what we have. That is the point.
  }
}

type Props = NativeStackScreenProps<StudyStackParamList, 'Glossary'>;

type Entry = {
  id: string;
  term: string;
  definition: string;
  /** Spoken by the TTS speaker (Feature 2) — falls back to definition when unauthored. */
  plain_english: string | null;
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
  /** normalized phrases whose TERM is a short all-caps acronym (AND, IT, OR…) —
   *  linked only when the prose itself is upper-case, never the English word
   *  (QA night 2026-08-31: "and"/"it"/"or" linked in nearly every definition). */
  caseExact: Set<string>;
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

/** Everyday English words that are ALSO single-word glossary entries with a
 *  technical sense (Source = a FET terminal, Current, Return, Form, Common…).
 *  In prose their everyday sense dominates, so they link only inside a longer
 *  phrase ("common-source stage"), never on their own (Bug+Hater night E2-02). */
const GENERIC_SINGLE_WORDS = new Set([
  'source', 'current', 'return', 'form', 'common', 'load', 'run', 'key', 'tap', 'feed',
  'path', 'lead', 'field', 'range', 'note', 'stage', 'line', 'ring', 'drop', 'head', 'tail', 'sink',
]);

function buildTermIndex(entries: Entry[]): TermIndex {
  const exact = new Map<string, string>();
  const base = new Map<string, string[]>();
  const caseExact = new Set<string>();
  let maxWords = 1;
  for (const e of entries) {
    const full = normPhrase(e.term);
    exact.set(full, e.id);
    if (/^[A-Z]{2,4}$/.test(e.term.trim())) caseExact.add(full);
    const baseName = normPhrase(e.term.replace(/\s*\([^)]*\)\s*$/, ''));
    if (baseName) {
      const list = base.get(baseName);
      if (list) list.push(e.id);
      else base.set(baseName, [e.id]);
      maxWords = Math.max(maxWords, baseName.split(' ').length, full.split(' ').length);
    }
  }
  return { exact, base, caseExact, maxWords: Math.min(maxWords, 6) };
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
      // "and" must never link to AND: acronym terms need caps in the prose.
      const raw = text.slice(start, end);
      if (index.caseExact.has(phrase) && raw !== raw.toUpperCase()) continue;
      // A generic everyday word links only as part of a longer phrase (E2-02).
      if (!phrase.includes(' ') && GENERIC_SINGLE_WORDS.has(phrase)) continue;
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
  onOpenCalc,
  highlight = '',
  linksOn = true,
}: {
  text: string;
  style: StyleProp<TextStyle>;
  selfId: string;
  index: TermIndex | null;
  onLink: (ids: string[]) => void;
  /** When provided, a calculator/equation word links DIRECTLY to its calculator
   *  workspace (purple), instead of the normal blue glossary cross-link. */
  onOpenCalc?: (workspaceId: string) => void;
  /** Active search query — occurrences are highlighted green in plain segments. */
  highlight?: string;
  /** SHOW/HIDE LINKS (owner 2026-08-07) — when false the definition renders as
   *  plain prose: no blue cross-links, no purple calculator words. Search
   *  highlighting still applies. */
  linksOn?: boolean;
}) {
  const segs = useMemo(
    () => (index && linksOn ? linkSegments(text, index, selfId) : [{ text } as LinkSeg]),
    [text, index, selfId, linksOn],
  );
  return (
    <Text style={style}>
      {segs.map((s, i) => {
        if (!s.ids) return <Text key={i}>{highlightNodes(s.text, highlight)}</Text>;
        // A word that is BOTH a glossary term AND calculator-backed is SPLIT
        // (owner 2026-08-10): the LEFT half of its letters is BLUE and opens the
        // glossary definition; the RIGHT half is PURPLE and opens the calculator
        // using it — one word, both doors, in the app's existing color code.
        // (Previously the purple calculator link replaced the blue one entirely,
        // losing the definition path.)
        const calc = onOpenCalc ? calcLinkForTerm(s.text) : null;
        if (calc) {
          // A word that is BOTH a glossary term AND calculator-backed (owner
          // 2026-09-14): the WHOLE word is the BLUE glossary-definition link, and
          // a small PURPLE Σ right after it opens the calculator. Replaces the old
          // mid-word blue/purple letter split — one word, two doors, and (unlike a
          // blue-word/purple-underline split) it reads the same on iOS and Android.
          return (
            <Text key={i}>
              <Text
                style={styles.termLink}
                suppressHighlighting
                accessibilityLabel={`${s.text} — open the glossary definition`}
                onPress={() => onLink(s.ids!)}
              >
                {s.text}
              </Text>
              {' '}
              {/* Squared Σ — an inline View matching the top Σ (calculator) button:
                  rounded square, purple border + faint purple fill; the Σ inside is
                  the calculator tap target. */}
              <View style={styles.calcSigmaBox}>
                <Text
                  style={styles.calcSigmaChar}
                  suppressHighlighting
                  accessibilityLabel={`${s.text} — open in the calculator`}
                  onPress={() => onOpenCalc!(calc.workspaceId)}
                >
                  Σ
                </Text>
              </View>
            </Text>
          );
        }
        return (
          <Text key={i} style={styles.termLink} suppressHighlighting onPress={() => onLink(s.ids!)}>
            {s.text}
          </Text>
        );
      })}
    </Text>
  );
}
type TopicRef = { id: string; name: string; course_id: string; sequence_in_course: number };
type Filter = 'all' | 'topic' | 'equations' | 'favorites' | 'custom' | 'recent';

// Flagged-terms key now lives in features/flags/flaggedStore (FLAGGED_KEY) —
// same 'ape:glossaryFavs' storage, shared app-wide (Booth 2026-07-18).
const RECENT_KEY = 'ape:glossaryRecent';
const RECENT_CAP = 30;
// Set when a locked user taps "Get membership" from the lock view; read once
// after they return as a member, to reopen the term they were last on, then
// cleared (owner 2026-09-10).
const RETURN_TERM_KEY = 'ape:glossaryReturnTerm';

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

/** The light blue of a cross-link inside a definition. Single source of truth
 *  (owner 2026-08-07): `styles.termLink` paints the words with it, and the
 *  SHOW/HIDE LINKS icon lights up in the same blue when links are on, so the
 *  control visibly names what it controls. */
const LINK_BLUE = '#9fbede';

// iOS ScrollViews delay touch delivery to child buttons by default, making
// taps feel slow/unresponsive. This turns it off. (Valid RN prop; RN 0.86's
// type defs omit it, so it's spread untyped.)
const NO_TOUCH_DELAY = { delaysContentTouches: false } as Record<string, unknown>;

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
  onOpenCalc,
  linksOn = true,
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
  /** Deep-link to the Calc Lab workspace that covers this term. Present ⇒ the
   *  "Open in Calculator" row MAY render (only for calculator-covered terms).
   *  Absent (no navigation context) ⇒ never rendered. */
  onOpenCalc?: (workspaceId: string) => void;
  /** SHOW/HIDE LINKS (owner 2026-08-07) — delinks the definition prose. The
   *  RELATED TERMS pills are a deliberate list, not inline links, so they stay. */
  linksOn?: boolean;
}) {
  const linkable = selfId != null && index != null && onLink != null;
  // Calculator deep-link — ONLY for terms an actual Calc Lab workspace covers
  // (owner 2026-08-07). The purple styling of the term title implies this link
  // exists, so the affordance must match that same calculator-backed set.
  const calcLink = term ? calcLinkForTerm(term) : null;
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
          <Text style={styles.detailEyebrow}>AUDIO FUNDAMENTALS & ADVANCED TRAINING LABS</Text>
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
      {/* OPEN IN CALCULATOR (owner 2026-08-07) — an equation/calculator term
          links straight to the Calc Lab workspace that computes it. Purple to
          match the equation title styling; shown only for covered terms. */}
      {calcLink && onOpenCalc ? (
        <Pressable
          style={styles.calcLinkBtn}
          onPress={() => onOpenCalc(calcLink.workspaceId)}
          accessibilityRole="button"
          accessibilityLabel={`Open ${calcLink.workspaceName} in the Audio Calculator Laboratory`}
        >
          <Text style={styles.calcLinkSigma}>Σ</Text>
          <Text style={styles.calcLinkText}>OPEN IN CALCULATOR · {calcLink.workspaceName.toUpperCase()}</Text>
        </Pressable>
      ) : null}
      {linkable && firstText ? (
        <View style={styles.detailSection}>
          <Text style={styles.detailEyebrow}>{firstLabel}</Text>
          <LinkedText
            text={firstText}
            style={styles.detailBody}
            selfId={selfId!}
            index={index!}
            onLink={onLink!}
            onOpenCalc={onOpenCalc}
            linksOn={linksOn}
          />
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
      {/* LAB COMMON MISTAKES (roadmap 2026-07-26) — the linked lab's authored
          Common-Mistakes list, shown for lab-taught terms only. Grouped WITH the
          term's own Common Mistakes above (owner 2026-08-06 — it used to sit
          above Plain English, which read as a misplaced duplicate). Free client
          content (NOT the entitlement-gated DB mistakes), so the eyebrow names
          its source lab. */}
      {labMistakesText && labLesson ? (
        <View style={styles.detailSection}>
          <Text style={styles.detailEyebrow}>COMMON MISTAKES · {labLesson.name.toUpperCase()} LAB</Text>
          <Text style={styles.detailBody}>{labMistakesText}</Text>
        </View>
      ) : null}
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
        onPress={() => sendFeedback('correction', term, { Screen: 'Glossary', Term: term, 'Term ID': selfId })}
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
      // A11Y (2026-09-06): 40 pt chips reach the 44 pt target, and the
      // long-press-only lists (Bookmarks / Custom / Recent) are now discoverable.
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={onLongPress ? 'Double tap and hold to open the list' : undefined}
      accessibilityState={{ selected: active }}
      aria-pressed={active}
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

/** Animated "…" — cycles 1→3 dots so a loading state never looks frozen. */
function useDots(intervalMs = 400): string {
  const [n, setN] = useState(1);
  useEffect(() => {
    const id = setInterval(() => setN((x) => (x % 3) + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return '.'.repeat(n);
}

/** Full-width "loading the corpus" panel (owner 2026-08-05) — shown in the term
 *  list area while the ~21k definitions page in, so it never just looks paused. */
function GlossaryLoading({ count, landed }: { count: number | null; landed: boolean }) {
  const dots = useDots();
  // Shows the cached daily total once we have it, otherwise "the full corpus"
  // (owner 2026-09-14: the header count-up that used to gate this was removed).
  const subject = landed && count != null ? `${count.toLocaleString()} terms` : 'the full corpus';
  return (
    <View style={styles.loadingBox}>
      <Text style={styles.loadingKicker}>PRO AUDIO GLOSSARY</Text>
      <Text style={styles.loadingTitle}>Loading{dots}</Text>
      <Text style={styles.loadingSub}>
        Fetching every term and definition — {subject}. The first open takes a little longer while
        the whole library streams in; terms appear the moment they arrive, and it opens instantly
        next time.
      </Text>
    </View>
  );
}

/**
 * One term row of the held-chip term list / single-bookmark popups.
 *
 * Virtualization (2026-09-11): both popups used to render EVERY row eagerly
 * inside a ScrollView, so a member with hundreds of bookmarks paid the whole
 * mount cost (each row carries a TermSelectIcons with four store subscriptions)
 * every time the popup opened. They are FlatLists now — this row lives at module
 * scope and is memoized so cell reuse isn't defeated by a fresh component
 * identity on each parent render. Markup is byte-for-byte what it was.
 */
const TermPopupRow = memo(function TermPopupRow({
  id,
  term,
  color,
  bookmarkCtx,
  onOpen,
}: {
  id: string;
  term: string;
  /** Optional tlItem colour override (bookmark purple / custom-list blue). */
  color?: string;
  bookmarkCtx: string;
  onOpen: (id: string) => void;
}) {
  return (
    <View style={styles.tlRow}>
      <Pressable
        style={{ flex: 1 }}
        onPress={() => onOpen(id)}
        accessibilityRole="button"
        accessibilityLabel={`Open ${term}`}
      >
        <Text style={[styles.tlItem, color ? { color } : null]} numberOfLines={1}>
          {term} ›
        </Text>
      </Pressable>
      <TermSelectIcons id={id} bookmarkCtx={bookmarkCtx} hideKnown />
    </View>
  );
});

/** One "OTHER LISTS" switcher row of the single-bookmark popup. */
const BmSwitchRow = memo(function BmSwitchRow({
  ctx,
  count,
  name,
  onSwitch,
}: {
  ctx: string;
  count: number;
  name: string;
  onSwitch: (ctx: string) => void;
}) {
  return (
    <Pressable
      style={styles.tlRow}
      onPress={() => onSwitch(ctx)}
      accessibilityRole="button"
      accessibilityLabel={`Switch to ${name}, ${count} bookmark${count === 1 ? '' : 's'}`}
    >
      <Text style={[styles.tlItem, { color: '#b45bff', flex: 1 }]} numberOfLines={1}>
        {name} ›
      </Text>
      <Text style={styles.tlCount}>{count}</Text>
    </Pressable>
  );
});

/** Flattened row model for the single-bookmark popup's one FlatList: the
 *  selected context's terms, then the OTHER LISTS section (its header carries
 *  the bmOtherWrap rule/spacing the wrapping View used to draw). */
type BmPopupRow =
  | { kind: 'term'; entry: Entry }
  | { kind: 'empty' }
  | { kind: 'otherHeader' }
  | { kind: 'switch'; ctx: string; count: number };

export function GlossaryScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { achievementId: presetTopicId, query: presetQuery } = route.params ?? {};

  const [entries, setEntries] = useState<Entry[]>([]);
  const [topics, setTopics] = useState<TopicRef[]>([]);
  const [loading, setLoading] = useState(true);
  // Distinguish a failed corpus fetch from an empty glossary: offline on the
  // first open of a session used to render as "No results" with a blank count,
  // indistinguishable from a 0-term glossary (launch audit 2026-09-09).
  const [loadError, setLoadError] = useState(false);
  // Cached total term count (owner 2026-08-02): the corpus load pages ~21k rows
  // before visible.length can show a number, so the "N Terms" header lagged. A
  // nightly DB job (get_glossary_term_count RPC, refreshed ~1:30 AM PT) gives an
  // instant total to display while the full corpus is still streaming in; once
  // loaded we fall through to the exact live visible.length below.
  const [cachedCount, setCachedCount] = useState<number | null>(null);
  // A deep-linked term (`/glossary/<slug>`) arrives as the initial search text.
  const [search, setSearch] = useState(presetQuery ?? '');
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
  // Fetch the precomputed daily total once on mount — a single cheap RPC that
  // returns instantly, unlike the full corpus paging below. Non-fatal: if it
  // fails, the header just waits for visible.length like before.
  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const { data, error } = await supabase.rpc('get_glossary_term_count');
        if (alive && !error && typeof data === 'number') setCachedCount(data);
      } catch {
        /* non-fatal: the header waits for the live visible.length instead */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => () => {
    if (settleTimer.current) clearTimeout(settleTimer.current);
  }, []);

  // M16 (2026-09-07): a preset topic (opened from a Dashboard topic) must
  // actually narrow the list — start on the 'topic' filter, not 'all', so the
  // full corpus isn't shown with the Topic chip unchecked. (Corpus size is
  // stated inconsistently elsewhere in this file — 22.7k vs 26,847; don't
  // re-assert a figure here.)
  const [filter, setFilter] = useState<Filter>(presetTopicId ? 'topic' : 'all');
  const [topicPickerOpen, setTopicPickerOpen] = useState(false);
  // Member gate for the topic filter (user request 2026-07-25): free/lapsed/
  // anonymous commercial users may VIEW the topic list but not activate a topic;
  // tapping a locked row raises this brief membership hint.
  const [topicGate, setTopicGate] = useState(false);
  const [cardView, setCardView] = useState(false); // list (default) ↔︎ card view
  // TTS reads the OFFICIAL definition by default (ADV); BEG = plain English.
  const [ttsBeg, setTtsBeg] = useState(false);
  // SHOW / HIDE LINKS (owner 2026-08-07): the cross-links inside definitions
  // can be switched off so a definition reads as clean prose. The control lives
  // in each term's icon row but the setting is GLOBAL — one flag for the whole
  // glossary — and is REMEMBERED across launches (defaults to showing links).
  const [linksOn, setLinksOn] = useGlossaryLinksPref();
  // CM4: commercial rendering — Common Mistakes gating + no academic course
  // filter in public UI (§1 naming rule). Server owns entitlement; we render.
  const { commercialMode, isMember, entitlement, resolved } = useEntitlement();
  // Real membership: gate the mistakes veil + topic-filter links on true
  // standing (provider isMember), never on caps (dev-bypassed) — that regression
  // hid both selling points. See the isMember doc in EntitlementProvider.

  // ---- TEMPORARY DEVICE KEY (owner 2026-09-13) ----
  // The glossary is the one screen that asks for it, because it is the one
  // screen the gateway protects. Everything here is inert until the server side
  // exists: `probeGateway()` answers 'absent' and `keyState` is 'ready'.
  const [gateway, setGateway] = useState<GatewayProbe | undefined>(undefined);
  const [consent, setConsent] = useState<ConsentRecord | undefined>(undefined);
  const [hasSession, setHasSession] = useState<boolean | undefined>(undefined);
  const [declinedThisVisit, setDeclinedThisVisit] = useState(false);
  // Set when minting failed. FAIL OPEN: a guest must never be locked out of the
  // glossary because anonymous sign-ins are switched off in the dashboard, or
  // because their train went into a tunnel mid-dialog.
  const [keyFailedOpen, setKeyFailedOpen] = useState(false);
  // One dialog per visit, however many times the state recomputes.
  const askingRef = useRef(false);
  const mintingRef = useRef(false);

  useEffect(() => {
    let alive = true;
    void probeGateway().then((g) => alive && setGateway(g));
    void readConsent().then((c) => alive && setConsent(c));
    void safeSession(supabase.auth.getSession(), 'Glossary')
      .then(({ data }) => alive && setHasSession(!!data.session))
      .catch(() => alive && setHasSession(false));
    // The key can appear (minted here) or vanish (purged after 7 days, or the
    // user signed in) while this screen is mounted.
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setHasSession(!!session);
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const keyState = deviceKeyState({
    gatewayDeployed: keyFailedOpen ? false : gateway === undefined ? undefined : gateway === 'deployed',
    isGuest: entitlement === 'anonymous',
    resolved,
    hasSession: hasSession === true,
    consent: hasSession === undefined ? undefined : consent,
    declinedThisVisit,
  });

  /** AGREE, or ALLOW from the NOT NOW card. Mints the key and, on failure,
   *  opens the glossary anyway rather than stranding the reader. */
  const grantDeviceKey = useCallback(async () => {
    // ⚠️ Claim the in-flight flag BEFORE anything that can re-render. Writing
    // the consent record below flips keyState to 'mint' (consent on file, no
    // session yet) and the effect would fire a second mint against the same
    // tap — which it did, on the first live run: two anonymous users 67
    // microseconds apart. mintDeviceKey() now dedupes as well; this keeps the
    // effect from even trying.
    mintingRef.current = true;
    setDeclinedThisVisit(false);
    await writeConsent();
    setConsent({ granted: true, at: Date.now() });
    const r = await mintDeviceKey();
    mintingRef.current = false;
    if (r.ok) {
      // The corpus source changes with the key (the browse view is granted to
      // `authenticated`), so the cached probe answer has to be re-taken.
      resetGatewayProbe();
      void probeGateway().then(setGateway);
      return;
    }
    console.warn('[glossary] device key mint failed:', r.reason, r.message);
    setKeyFailedOpen(true);
  }, []);

  // 'ask' → raise the dialog once; 'mint' → do it silently (consent on file).
  useEffect(() => {
    if (keyState === 'ask' && !askingRef.current) {
      askingRef.current = true;
      confirmDialog(
        COPY.glossaryDeviceKeyTitle,
        `${COPY.glossaryDeviceKeyBody}

${COPY.glossaryFreeAllowance}`,
        COPY.glossaryDeviceKeyAgree,
        () => {
          askingRef.current = false;
          void grantDeviceKey();
        },
        {
          cancelText: COPY.glossaryDeviceKeyNotNow,
          onCancel: () => {
            askingRef.current = false;
            // NOT NOW writes NOTHING — "nothing was stored" has to be true.
            setDeclinedThisVisit(true);
          },
        },
      );
    }
    if (keyState === 'mint' && !mintingRef.current) {
      mintingRef.current = true;
      void mintDeviceKey().then((r) => {
        mintingRef.current = false;
        if (r.ok) {
          resetGatewayProbe();
          void probeGateway().then(setGateway);
        } else {
          console.warn('[glossary] device key renewal failed:', r.reason, r.message);
          setKeyFailedOpen(true);
        }
      });
    }
  }, [keyState, grantDeviceKey]);

  /** True once it is safe to read the corpus: either the gateway is absent (the
   *  world as it was) or this device holds a key. */
  const keyReady = keyState === 'ready';

  /**
   * ⛔ A KEY THAT NEVER RESOLVES USED TO FREEZE THIS SCREEN (owner 2026-09-19:
   * "glossary is not loading in — stalled and froze").
   *
   * The corpus effect bails when the key is not ready, and its `finally`
   * cleared `loading` only `if (keyReady)` — so in the one case where the
   * screen has nothing to show, it also never stopped showing the spinner.
   * `unknown` is reachable and sticky: the gateway probe, the entitlement
   * read and the stored-consent read each hold it there, and a request that
   * hangs rather than fails holds it forever. The result is a dead screen
   * with no message and no retry.
   *
   * So: give it a deadline. If no decision arrives in KEY_WAIT_MS the screen
   * stops pretending to load and shows the error card it already has, which
   * carries a RETRY. 'ask' and 'declined' are excluded — those are decisions,
   * with their own UI, and are not stuck.
   */
  const keyStuck = useKeyTimeout(keyState);
  /** Which relation the corpus comes from, given what the probe found. */
  const table = corpusTable(keyFailedOpen ? 'absent' : (gateway ?? 'absent'));
  /** The SERVER counts the open when the gateway is live — the client must not
   *  also charge `glossary_consume()`, or a free week would be seven. */
  const serverMeters = !keyFailedOpen && gateway === 'deployed';
  /** Read inside callbacks that must not re-create when the meter changes. */
  const serverMetersRef = useRef(false);
  serverMetersRef.current = serverMeters;
  /**
   * Bumped when a metered read replaces a teaser with the real definition.
   *
   * ⚠️ WHY A COUNTER AND A MUTATION. Once `glossary_browse_v` is live, the
   * corpus carries a 120-character TEASER for anyone who is not a member, and
   * the full text arrives one term at a time through the gateway. Eight places
   * render `entry.definition` — the expanded row, the collapsed clamp, card
   * view, the popup, TermDetails, the share sheet, TTS — and threading a second
   * source through all eight is how one of them gets missed and quietly shows a
   * truncated definition as if it were the whole thing.
   *
   * So the entry object itself is patched, in place, and this counter (in
   * `rowExtraData`) tells the FlatList to repaint. Replacing the `entries` array
   * instead would rebuild the 26k-term link index on every definition opened.
   */
  const [defRev, setDefRev] = useState(0);
  /** Indirection to ensureDefinitions, which is declared further down but is
   *  needed by the popup handlers above it. Assigned during render; every
   *  caller runs from an event, long after that. */
  const ensureDefsRef = useRef<(ids: string[]) => void>(() => {});
  /** Forward handle to the metered read. The implementation needs the detail
   *  state, which is declared further down; the gate needs to CALL it from up
   *  here. A ref is the cheap way to cross that without reordering the screen. */
  const openViaGatewayRef = useRef<(id: string) => Promise<boolean>>(async () => true);

  // ---- GLOSSARY WEEKLY LOOKUP CAP (owner 2026-09-10) ----
  // Free / lapsed / guest get 14 definition OPENS per rolling week; academy is
  // unlimited. Gate on REAL standing (isMember), never caps — same rule as the
  // mistakes veil above. Signed-in free/lapsed count on the SERVER
  // (glossary_consume); anonymous guests count DEVICE-LOCAL. Waits for the first
  // entitlement read (`resolved`) so we never charge a member on first paint.
  const capped = commercialMode && resolved && !isMember;
  // …and once the gateway meters, even a guest is counted on the SERVER: they
  // hold a device key, so there is a uid to count against. 'local' is only for
  // the world before the gateway exists.
  const capMode: CapMode = entitlement === 'anonymous' && !serverMeters ? 'local' : 'server';
  // Terms already charged this SESSION — re-opening one is free (owner: a term
  // you already looked up this session doesn't cost again).
  const consumedRef = useRef<Set<string>>(new Set());
  // Blocks a same-tick double-consume (two taps racing the async RPC).
  const gateOpeningRef = useRef(false);
  // HARD LOCK (owner 2026-09-10): once a capped user is out of weekly lookups the
  // glossary locks — the body is replaced by GlossaryLockView (no scroll/search/
  // lists), the only ways out are exit or membership. `resetAt` drives the
  // countdown. `lastViewedTermRef` = the term to reopen after they upgrade.
  const [locked, setLocked] = useState(false);
  const [resetAt, setResetAt] = useState<number | null>(null);
  const lastViewedTermRef = useRef<string | null>(null);

  /** Charge one lookup before revealing a definition. Returns false when a
   *  capped user is out of lookups — the glossary LOCKS and the caller does NOT
   *  open the term. Members / dev / pre-resolve always pass free. */
  const gateDefinitionOpen = useCallback(
    async (id: string): Promise<boolean> => {
      // ⚠️ WHEN THE SERVER METERS, THE CLIENT MUST NOT. The gateway RPC counts
      // the open itself; charging glossary_consume() here as well would make a
      // free week seven definitions instead of fourteen. The metered read
      // happens HERE rather than after the row opens, so a refusal stops the
      // open instead of revealing an empty row and then locking.
      if (serverMeters) return openViaGatewayRef.current(id);
      if (!capped) return true;
      if (consumedRef.current.has(id)) return true; // already looked up this session
      if (gateOpeningRef.current) return false; // a consume is in flight — ignore the double-tap
      gateOpeningRef.current = true;
      // The reset must be unconditional (network audit 2026-09-11). consumeGlossary
      // fails open today, but if it ever threw, this flag stayed true and EVERY
      // later tap returned false — the glossary would silently stop opening terms
      // for the rest of the session with no error anywhere.
      let u: Awaited<ReturnType<typeof consumeGlossary>>;
      try {
        u = await consumeGlossary(capMode);
      } finally {
        gateOpeningRef.current = false;
      }
      if (u.unavailable) {
        // Server/store unreachable or SQL not yet deployed → fail open: allow,
        // and don't re-hit it for this term again this session.
        consumedRef.current.add(id);
        lastViewedTermRef.current = id;
        return true;
      }
      if (!u.allowed) {
        // Out of lookups → LOCK the glossary (owner 2026-09-10). Don't open.
        setResetAt(u.windowStart != null ? u.windowStart + GLOSSARY_WEEK_MS : null);
        setLocked(true);
        return false;
      }
      consumedRef.current.add(id);
      lastViewedTermRef.current = id; // where they were last located (for post-upgrade return)
      warnUsage(u.used, u.limit);
      return true;
    },
    [capped, capMode, serverMeters],
  );

  const listRef = useRef<FlatList<Entry>>(null);
  // Multiple simultaneous expansions in list view (user request 2026-07-18);
  // `focusedId` = the most-recently opened term (drives scroll + view-toggle).
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, EntryDetail>>({});
  // SYNCHRONOUS mirror of `details`. The metered gateway read fills a term's
  // detail and the caller then runs the legacy fetch in the SAME tick — reading
  // `details` there would still see the old object and re-fetch from `glossary`,
  // which after the revokes is a 42501 that would paint a retry button over a
  // row that already has its content. Merge, never replace: entries are only
  // ever added, so a render landing mid-write cannot drop one.
  const detailsRef = useRef<Record<string, EntryDetail>>({});
  detailsRef.current = { ...detailsRef.current, ...details };
  const putDetail = useCallback((id: string, d: EntryDetail) => {
    detailsRef.current = { ...detailsRef.current, [id]: d };
    setDetails((prev) => ({ ...prev, [id]: d }));
  }, []);
  // [72] (2026-09-07): ids whose detail fetch FAILED. Without this the expanded
  // row / popup sat on "Loading…" forever after a transient failure, with no
  // error and no retry the user could see.
  const [detailErrs, setDetailErrs] = useState<Record<string, true>>({});
  // Term media (glossary_media): id → first image URL. Drives the media icon
  // next to a term and the in-definition image (user request 2026-07-18).
  const [mediaById, setMediaById] = useState<Record<string, string>>({});
  const [mediaPopup, setMediaPopup] = useState<string | null>(null); // URL shown in the tap-to-close viewer
  useEffect(() => {
    // Non-fatal: a failed load leaves the map empty (no icons) and is NOT
    // session-cached, so the next Glossary open retries it (B-176).
    loadAllGlossaryMedia()
      .then(setMediaById)
      .catch(() => {
        /* terms simply render without a media icon */
      });
  }, []);
  // Equations & Formulas (user request 2026-07-26): id → symbolic/words for any
  // term that carries a formula. Loaded once, isolated + non-fatal (see
  // loadAllGlossaryFormulas) so a missing column-grant never breaks the corpus.
  const [formulaById, setFormulaById] = useState<Record<string, { symbolic: string; words: string | null }>>({});
  useEffect(() => {
    // Waits for the device key for the same reason the corpus does: without one
    // the read is a guaranteed 42501 once the revokes land.
    if (!keyReady) return;
    // Non-fatal: a failed load (incl. the column-grant 403) leaves the map
    // empty and is NOT session-cached, so the next Glossary open retries (B-176).
    loadAllGlossaryFormulas(table)
      .then(setFormulaById)
      .catch(() => {
        /* the Equations & Formulas filter simply shows no terms */
      });
  }, [keyReady, table]);
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

  // Share a term — opens the SHARE HUB (owner spec 2026-08-06): section toggles,
  // text/image/copy, and multi-term selection from lists/related. The actual
  // handler (shareTerm) lives further down, once entryById and termIndex are in scope.
  const [sharePayload, setSharePayload] = useState<ShareTermPayload | null>(null);

  const recordRecent = useCallback((id: string) => {
    setRecent((prev) => {
      const next = [id, ...prev.filter((r) => r !== id)].slice(0, RECENT_CAP);
      void AsyncStorage.setItem(RECENT_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  /**
   * The METERED read. One RPC returns the definition, every detail field the
   * two legacy queries used to fetch, and this week's count — the server
   * charges it, and refuses when the allowance is gone.
   *
   * Returns false ONLY for a refusal that must stop the term from opening.
   * Everything else FAILS OPEN and leaves the legacy path to fill the detail:
   * a reader must never lose the glossary because the gateway had a bad minute.
   */
  const openViaGateway = useCallback(
    async (id: string): Promise<boolean> => {
      if (detailsRef.current[id]) return true; // already read this session — free
      const r = await fetchDefinitionViaGateway(id);
      if (r.state === 'ok') {
        const { used, lim, window_start, ...detail } = r.row;
        putDetail(id, detail as unknown as EntryDetail);
        // The real definition replaces the teaser everywhere at once (see defRev).
        const entry = entryByIdRef.current.get(id);
        if (entry && r.row.definition && r.row.definition !== entry.definition) {
          entry.definition = r.row.definition;
          setDefRev((n) => n + 1);
        }
        setDetailErrs((prev) => {
          if (!prev[id]) return prev;
          const next = { ...prev };
          delete next[id];
          return next;
        });
        lastViewedTermRef.current = id;
        if (typeof used === 'number' && typeof lim === 'number') warnUsage(used, lim);
        return true;
      }
      if (r.fault === 'limit-reached') {
        // Same lock as the device-local meter, driven by the server's count.
        const st = await getGlossaryStatus('server');
        setResetAt(!st.unavailable && st.windowStart != null ? st.windowStart + GLOSSARY_WEEK_MS : null);
        setLocked(true);
        return false;
      }
      if (r.fault === 'sign-in-required') {
        // The key was purged (or never took). Drop back to the state machine,
        // which mints a new one under the consent already on file.
        setHasSession(false);
        return false;
      }
      // 'not-deployed' / 'denied' / 'error' → let the legacy detail fetch try.
      return true;
    },
    [putDetail],
  );
  openViaGatewayRef.current = openViaGateway;

  const fetchDetails = useCallback(
    async (id: string) => {
      if (detailsRef.current[id]) return;
      /**
       * ⛔ `glossary_study_v`, NOT `glossary` / `glossary_full_v`.
       *
       * VERIFIED ON THE LIVE PROJECT 2026-09-20: neither `public.glossary` nor
       * `public.glossary_full_v` grants SELECT to `anon` OR `authenticated` —
       * both return 42501. This is the only path that fills a term's detail
       * body, and `openLinked` calls it directly and deliberately, because
       * cross-links are FREE and must not spend a weekly lookup. The free
       * route WAS those two direct table reads, so when the grants went, every
       * cross-link hop became "Couldn't load details — tap to retry"
       * permanently, for members and free users alike, with a retry button
       * that re-ran the same denied query. Cross-links are on by default.
       *
       * `glossary_study_v` is granted to both roles, carries every field this
       * needs INCLUDING common_mistakes, and already applies the free/member
       * mask through `has_academy_access()` inside the view — so this is one
       * query where there used to be two, with the same visibility rules.
       *
       * ⚠️ It keys on `glossary_id`, not `id`, and joins the topic rows: 353
       * of 26,831 terms have more than one row. Hence limit(1).maybeSingle()
       * rather than single(), which would throw for those.
       */
      const { data } = await supabase
        .from('glossary_study_v')
        .select(
          'plain_english, purpose_function, practical_application, scenario_contexts, related_terms, category, common_mistakes',
        )
        .eq('glossary_id', id)
        .limit(1)
        .maybeSingle();
      // [72]: mark the failure so the row can offer a retry instead of "Loading…".
      if (!data) {
        setDetailErrs((prev) => ({ ...prev, [id]: true }));
        return;
      }
      setDetailErrs((prev) => {
        if (!prev[id]) return prev;
        const next = { ...prev };
        delete next[id];
        return next;
      });
      // common_mistakes now rides along in the same masked row — the separate
      // glossary_full_v query it used to need is gone with the grant.
      putDetail(id, data as unknown as EntryDetail);
    },
    [putDetail],
  );

  /** [72]: clear the failure marker and try the detail fetch again. Re-fetching
   *  costs nothing extra — the gate already charged this term when it opened. */
  const retryDetails = useCallback(
    (id: string) => {
      setDetailErrs((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      void fetchDetails(id);
    },
    [fetchDetails],
  );

  const expandedIdsRef = useRef(expandedIds);
  expandedIdsRef.current = expandedIds;
  const toggleExpand = useCallback(
    async (id: string) => {
      const isOpen = expandedIdsRef.current.has(id);
      if (isOpen) {
        // Collapsing is always free; others stay open.
        setExpandedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        if (focusedId === id) setFocusedId(null);
        return;
      }
      // Opening = a lookup. A capped user out of lookups is stopped here.
      if (!(await gateDefinitionOpen(id))) return;
      setExpandedIds((prev) => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });
      setFocusedId(id);
      recordRecent(id); // opening a term counts as "viewed"
      coach.registerAction(); // each expand advances the "expand ×2" hint
      void fetchDetails(id);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [focusedId, recordRecent, fetchDetails, gateDefinitionOpen],
  );

  // ---- FEATURE 1 (Booth kickoff 2026-07-10): in-definition cross-links ----
  // Link-opened terms show in the POPUP with a back trail; each trail entry
  // remembers its popup scroll offset, so unwinding returns the reader to
  // exactly where they were. The popup lives INSIDE this screen (no stack
  // pushes) — the list/scroll position beneath is untouched by design, and the
  // STUDY-tab nav rules stay unviolated.
  const [popupTrail, setPopupTrail] = useState<{ id: string; offset: number }[]>([]);

  /** Is a definition open right now — an expanded row in LIST view, or the
   *  card popup in CARDS view? Both are "expanded and viewed" to a reader.
   *  Declared here because popupTrail is, and the search field reads it. */
  const anyExpanded = expandedIds.size > 0 || popupTrail.length > 0;
  const [chooser, setChooser] = useState<string[] | null>(null); // ambiguous sense ids
  const popupScrollRef = useRef<ScrollView>(null);
  const popupScrollY = useRef(0);
  // Set true when a term LINK is tapped, so the body's tap-to-go-back handler
  // (which also fires) skips the back and lets the link navigate FORWARD instead
  // (Booth 2026-07-11). Auto-clears as a safety net.
  const suppressBack = useRef(false);

  /** Open a term in the popup as the trail ROOT (card tap / list-link first hop). */
  const openPopupRoot = useCallback(
    async (id: string) => {
      if (!(await gateDefinitionOpen(id))) return; // opening = a lookup
      recordRecent(id);
      coach.registerAction();
      void fetchDetails(id);
      ensureDefsRef.current([id]); // a cross-link hop may never have been on screen
      popupScrollY.current = 0;
      setPopupTrail([{ id, offset: 0 }]);
    },
    [recordRecent, coach, fetchDetails, gateDefinitionOpen],
  );

  /** Follow a cross-link: remember where we are, then hop to the new term.
   *  Cross-links are FREE — they don't spend a weekly lookup (owner 2026-09-10);
   *  they DO update "last viewed" so a post-upgrade return lands on this term. */
  const openLinked = useCallback(
    (id: string) => {
      lastViewedTermRef.current = id;
      ensureDefsRef.current([id]); // hopped-to term may never have been rendered
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

  /** Open the Calc Lab workspace that computes an equation term (owner
   *  2026-08-07). CalcWorkspace is a RootStack route taking { id }; letting the
   *  navigate bubble from this nested Glossary reaches the root navigator. */
  const onOpenCalc = useCallback(
    (workspaceId: string) => {
      (navigation as unknown as { navigate: (name: string, params?: object) => void }).navigate(
        'CalcWorkspace',
        { id: workspaceId },
      );
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
  const [selTopicId, setSelTopicId] = useState<string | null>(presetTopicId ?? null);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      // Recently-viewed (device-side; no backend table). Flagged terms hydrate
      // via flaggedStore (shared with Flashcards — Booth 2026-07-18).
      AsyncStorage.getItem(RECENT_KEY)
        .then((v) => {
          if (!alive || !v) return;
          try {
            const a = JSON.parse(v);
            if (Array.isArray(a)) setRecent(a as string[]);
          } catch {
            /* corrupt value — recently-viewed just stays empty */
          }
        })
        .catch(() => {});
      AsyncStorage.getItem(TTS_MODE_KEY)
        .then((v) => {
          if (alive && v != null) setTtsBeg(v === '1');
        })
        .catch(() => {
          /* TTS mode just stays at its default */
        });
      (async () => {
        try {
          if (alive) setLoadError(false);
          // ⚠️ NOTHING is read until this device is allowed to read it. Before
          // the consent is given (or while the probe is still out), every query
          // below would be a guaranteed 42501 once the revokes land — and the
          // guest would see "check your connection" over a perfectly good one.
          // The screen stays in its loading state behind the dialog.
          if (!keyReady) return;
          // GLOSSARY LOCK (owner 2026-09-10): detect whether a capped user is out
          // of weekly lookups → show the lock card. The corpus STILL loads so the
          // lock sits over a real, dimmed glossary ("full screen lock over a
          // dimmed glossary"). Re-entering from a menu while locked lands here too.
          if (capped) {
            const st = await getGlossaryStatus(capMode);
            if (!alive) return;
            if (!st.unavailable && !st.allowed) {
              setResetAt(st.windowStart != null ? st.windowStart + GLOSSARY_WEEK_MS : null);
              setLocked(true);
            } else {
              setLocked(false);
            }
          } else {
            setLocked(false); // member / dev / pre-resolve is never locked
          }
          // Owner 2026-09-03: the `courses` fetch is gone. It read the archived
          // v1 college catalog on every Glossary mount to feed a filter chip that
          // was removed in July, and a term-chooser label that was wrong for
          // 23,187 of the 26,847 entries.
          const [{ data: topicRows }] = await Promise.all([
            // TOPIC filter = the LIVE v3 curriculum only (owner 2026-08-06). The
            // old query pulled ALL achievements (v2 + v3 + draft), so the list was
            // a mix and many rows resolved to the wrong/empty curriculum.
            supabase
              .from('achievements')
              .select('id, name, global_sequence')
              .eq('curriculum_version_id', V3_CURRICULUM_VERSION_ID)
              .eq('is_active', true)
              .order('global_sequence'),
          ]);
          if (!alive) return;
          setTopics(
            ((topicRows ?? []) as { id: string; name: string; global_sequence: number }[])
              .map((t) => ({ id: t.id, name: t.name, course_id: '', sequence_in_course: t.global_sequence ?? 0 }))
              .sort((a, b) => a.name.localeCompare(b.name)),
          );

          // Full corpus — session-cached (owner 2026-08-10): downloads once per
          // app session, so re-focusing the Glossary is instant instead of
          // re-paging ~22.7k rows every visit.
          //
          // ⛔ SAY SO WHEN THE CACHE IS GONE (owner 2026-09-22 freeze report).
          // On a re-focus `loading` is already false, so a dropped cache re-paged
          // the whole corpus with the OLD list still on screen and nothing
          // responding — the app looked frozen rather than busy. This is a
          // no-op on the normal cache hit, which is the common path.
          if (alive && corpusNeedsLoad(table)) setLoading(true);
          const all = await loadAllEntries(table);
          if (alive) setEntries(all);
          if (alive) refreshOfflineStats();
        } catch (e) {
          console.warn('[glossary] load failed:', (e as Error).message);
          if (alive) setLoadError(true);
        } finally {
          // ⚠️ `|| keyStuck` — see the note on keyStuck. Without it the one
          // path that shows nothing is also the one that never stops loading.
          if (alive && (keyReady || keyStuck)) setLoading(false);
        }
      })();
      return () => {
        alive = false;
        stopAllSpeech(); // leaving the glossary silences any TTS in progress
      };
    }, [capped, capMode, keyReady, keyStuck, table]),
  );

  // After a locked user upgrades and returns as a member, reopen the term they
  // were last on (owner 2026-09-10). The key is written only when they leave via
  // the lock view's membership button, and cleared here on the single reopen.
  useEffect(() => {
    if (capped) return;
    let alive = true;
    AsyncStorage.getItem(RETURN_TERM_KEY)
      .then((id) => {
        if (!alive || !id) return;
        void AsyncStorage.removeItem(RETURN_TERM_KEY).catch(() => {});
        void openPopupRoot(id);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [capped, openPopupRoot]);

  // Retry for the offline empty-state card. loadAllEntries() does NOT cache a
  // rejection, so re-running it after reconnecting genuinely re-fetches.
  const reloadCorpus = useCallback(async () => {
    setLoadError(false);
    setLoading(true);
    try {
      const all = await loadAllEntries(table);
      setEntries(all);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [table]);

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
  // `resolved` guard (entitlement gate roll-out 2026-09-11) — same rule as
  // `capped` above: the provider boots at 'anonymous', so without it a member
  // opening the topic picker in the pre-resolve window got the view-only list
  // with a 🔒 MEMBERS row lock and an upgrade hint for the membership they hold.
  const topicLinksLocked = resolved && !isMember;

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

  // --- Sharing (owner spec 2026-08-06) --------------------------------------
  // Refs keep the async share/resolve closures reading CURRENT data even though
  // resolve() can fire long after the sheet opened (e.g. list picker → share).
  const entryByIdRef = useRef(entryById);
  entryByIdRef.current = entryById;
  /**
   * Fill in definitions for rows the reader can actually see.
   *
   * The corpus load carries terms only (see loadAllEntries). This pulls the
   * definitions for a batch of ids and merges them IN PLACE, then bumps
   * `defRev` — the same repaint seam `openViaGateway` uses when the metered
   * read replaces a teaser. `visible` is derived from `entries`, and the row
   * renderer reads `item.definition`, so an in-place merge plus a defRev bump
   * is what makes the text appear without rebuilding a 31,858-entry array.
   *
   * `requestedRef` holds ids already asked for, so scrolling back over rows
   * does not refetch them. A FAILED batch is dropped from that set, so the
   * rows retry the next time they scroll into view rather than staying blank
   * forever.
   */
  /**
   * SAVE THE WHOLE GLOSSARY TO THE DEVICE (owner 2026-09-22, the cruise case).
   *
   * Definitions are otherwise only kept as they are read, so a reader who goes
   * offline has whatever they happened to scroll past — useless to someone who
   * knew in advance they would lose signal. This walks the ids with no stored
   * definition and fills them in, a page at a time.
   *
   * ⛔ Not automatic. It is ~4 MB, and deciding on someone's behalf to spend
   * their data is exactly the kind of thing that should be asked for.
   */
  const [offlineStats, setOfflineStats] = useState<{ terms: number; definitions: number } | null>(null);
  const [savingOffline, setSavingOffline] = useState(false);
  const cancelSaveRef = useRef(false);

  const refreshOfflineStats = useCallback(() => {
    if (!OFFLINE_AVAILABLE) return;
    void corpusStats(table).then(setOfflineStats, () => {});
  }, [table]);

  const saveWholeGlossary = useCallback(async () => {
    if (savingOffline) {
      cancelSaveRef.current = true;
      return;
    }
    // Belt and braces: the control is already member-only, but a saved-off
    // entitlement or a future caller must not be able to start a 4 MB download
    // the reader is not entitled to. The UI is not the enforcement.
    if (resolved && !isMember) return;
    cancelSaveRef.current = false;
    setSavingOffline(true);
    try {
      // Bounded rather than `while (true)`: a server that keeps returning the
      // same ids (a definition that is NULL upstream) would otherwise spin
      // forever. 80 passes x 400 covers 32,000 terms.
      for (let pass = 0; pass < 80; pass += 1) {
        if (cancelSaveRef.current) break;
        const ids = await idsMissingDefinitions(table, 400);
        if (!ids.length) break;
        const rows = await fetchDefinitionsFor(table, ids);
        await saveStoredDefinitions(table, rows);
        // Stop if a whole page came back with nothing storable — otherwise the
        // same ids return next pass and this never ends.
        if (!rows.some((r) => r.definition)) break;
        void corpusStats(table).then(setOfflineStats, () => {});
        await yieldToUi();
      }
      refreshOfflineStats();
    } catch {
      notify(
        'Couldn’t finish saving',
        'The glossary is partly saved and what was stored is kept. Try again when you have a steadier connection.',
      );
      refreshOfflineStats();
    } finally {
      setSavingOffline(false);
      cancelSaveRef.current = false;
    }
  }, [table, savingOffline, refreshOfflineStats, resolved, isMember]);

  const requestedDefsRef = useRef<Set<string>>(new Set());
  /**
   * ⛔ DRIVEN BY renderItem, NOT BY onViewableItemsChanged.
   *
   * The viewability callback was tried first and never fired a single request
   * (verified in the browser: no network call at all, on first paint or on
   * scroll). `renderItem` runs for exactly the rows RN decides to mount, which
   * is the signal we actually want and needs no config to agree with.
   *
   * Ids are coalesced on a timer so one screenful is ONE request rather than
   * ~15.
   */
  const pendingDefsRef = useRef<Set<string>>(new Set());
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queueDefinition = useCallback((id: string) => {
    if (requestedDefsRef.current.has(id) || pendingDefsRef.current.has(id)) return;
    pendingDefsRef.current.add(id);
    if (flushTimerRef.current) return;
    flushTimerRef.current = setTimeout(() => {
      flushTimerRef.current = null;
      const ids = [...pendingDefsRef.current];
      pendingDefsRef.current.clear();
      ensureDefsRef.current(ids);
    }, 60);
  }, []);
  const ensureDefinitions = useCallback(
    (ids: string[]) => {
      const want = ids.filter((id) => {
        if (requestedDefsRef.current.has(id)) return false;
        const e = entryByIdRef.current.get(id);
        return !!e && e.definition === '';
      });
      if (!want.length) return;
      for (const id of want) requestedDefsRef.current.add(id);

      const merge = (rows: { id: string; definition: string | null }[]): boolean => {
        let changed = false;
        for (const r of rows) {
          const e = entryByIdRef.current.get(r.id);
          if (e && r.definition && e.definition !== r.definition) {
            e.definition = r.definition;
            changed = true;
          }
        }
        return changed;
      };

      void (async () => {
        try {
          // 1. THE DEVICE FIRST. On a ship with no signal this is the only step
          //    that runs, and it is why the glossary still works there.
          const stored = await loadStoredDefinitions(table, want).catch(() => new Map<string, string>());
          const fromDisk = [...stored.entries()].map(([id, definition]) => ({ id, definition }));
          if (merge(fromDisk)) setDefRev((n) => n + 1);

          // 2. Only what the device did not have.
          const missing = want.filter((id) => !stored.has(id));
          if (!missing.length) return;
          const rows = await fetchDefinitionsFor(table, missing);
          if (merge(rows)) setDefRev((n) => n + 1);
          // 3. Keep them, so this reader never pays for them twice.
          void saveStoredDefinitions(table, rows).catch(() => {});
        } catch {
          // Network miss: let these ids be retried the next time the rows are
          // drawn. Anything already served from disk stays on screen.
          for (const id of want) requestedDefsRef.current.delete(id);
        }
      })();
    },
    [table],
  );

  ensureDefsRef.current = ensureDefinitions;

  // A new corpus (sign-in swaps the table) invalidates what we have asked for.
  useEffect(() => {
    requestedDefsRef.current = new Set();
  }, [table]);

  const termIndexRef = useRef(termIndex);
  termIndexRef.current = termIndex;
  const isMemberRef = useRef(isMember);
  isMemberRef.current = isMember;
  const bookmarksRef = useRef(bookmarks);
  bookmarksRef.current = bookmarks;
  const starredRef = useRef(starred);
  starredRef.current = starred;
  const recentRef = useRef(recent);
  recentRef.current = recent;

  /** Fetch (or reuse) a term's full detail and RETURN it (fetchDetails only
   *  caches). Same two-query shape: base fields from `glossary` (all tiers) +
   *  the academy-gated `common_mistakes` from `glossary_full_v` (non-fatal).
   *
   *  ⚠️ Called by the SHARE sheet, which can reach a term the reader never
   *  opened (from a bookmark list). Once the gateway is live those two queries
   *  are revoked, so the metered read is the only way to fill it — meaning
   *  sharing an unopened term now spends one of the free 14. There is no
   *  unmetered path left, and a share does reveal the definition, so this is
   *  the honest reading of the rule rather than a loophole. A term already read
   *  this session is free, as always. */
  const getDetail = useCallback(async (id: string): Promise<EntryDetail | null> => {
    const cached = detailsRef.current[id];
    if (cached) return cached;
    if (serverMetersRef.current) {
      await openViaGatewayRef.current(id);
      const filled = detailsRef.current[id];
      if (filled) return filled;
      // A refusal (out of lookups) or an outage — fall through, and let the
      // legacy read decide. After the revokes it returns nothing, which the
      // share sheet already handles as "no detail".
    }
    /**
     * ⛔ `glossary_study_v`, for the same reason as fetchDetails.
     *
     * The comment above says "after the revokes it returns nothing, which the
     * share sheet already handles as no detail" — and it did return nothing,
     * because `glossary` and `glossary_full_v` grant SELECT to neither `anon`
     * nor `authenticated` (probed live 2026-09-20). Handling that gracefully
     * is not the same as it being right: sharing a term you had not opened
     * lost every detail field, silently.
     *
     * `glossary_study_v` IS granted to both roles and applies the same
     * free/member mask internally, so this fallback works again without
     * spending a lookup and without widening what a free user can see.
     */
    const { data } = await supabase
      .from('glossary_study_v')
      .select(
        'plain_english, purpose_function, practical_application, scenario_contexts, related_terms, category, common_mistakes',
      )
      .eq('glossary_id', id)
      .limit(1)
      .maybeSingle();
    if (!data) return null;
    const detail = data as unknown as EntryDetail;
    putDetail(id, detail);
    return detail;
  }, [putDetail]);

  /** Resolve one term id → shareable content. Definitions are used verbatim;
   *  Common Mistakes are included ONLY for a permitted (academy) viewer. */
  const buildShareTerm = useCallback(
    async (id: string): Promise<GlossaryShareTerm | null> => {
      const e = entryByIdRef.current.get(id);
      if (!e) return null;
      const d = await getDetail(id);
      const purpose = [d?.purpose_function, d?.practical_application].filter(Boolean).join('\n\n') || null;
      return {
        term: e.term,
        definition: e.definition,
        plainEnglish: d?.plain_english ?? e.plain_english ?? null,
        purpose,
        relatedTerms: d?.related_terms ?? [],
        commonMistakes: isMemberRef.current && d?.common_mistakes?.length ? d.common_mistakes : [],
      };
    },
    [getDetail],
  );

  const resolveShareTerms = useCallback(
    async (ids: string[]): Promise<GlossaryShareTerm[]> => {
      const out: GlossaryShareTerm[] = [];
      for (const id of ids) {
        const t = await buildShareTerm(id);
        if (t) out.push(t);
      }
      return out;
    },
    [buildShareTerm],
  );

  const namedFrom = useCallback((ids: Iterable<string>): NamedTerm[] => {
    const out: NamedTerm[] = [];
    for (const id of ids) {
      const e = entryByIdRef.current.get(id);
      if (e) out.push({ id: e.id, term: e.term });
    }
    return out;
  }, []);

  /** Open the share hub for a SINGLE term, offering list/related sources so the
   *  user can expand it into a multi-term share. */
  const shareTerm = useCallback(
    async (e: Entry) => {
      const primary = await buildShareTerm(e.id);
      if (!primary) return;
      const index = termIndexRef.current;
      const related: NamedTerm[] = index
        ? primary.relatedTerms
            .map((name) => ({ name, ids: linkIdsFor(name, index, e.id) }))
            .filter((r) => r.ids.length > 0)
            .map((r) => ({ id: r.ids[0], term: r.name }))
        : [];
      setSharePayload({
        terms: [primary],
        mistakesAllowed: isMemberRef.current,
        lists: {
          bookmarks: namedFrom(bookmarksRef.current),
          custom: namedFrom(starredRef.current),
          recent: namedFrom(recentRef.current),
        },
        related,
        resolve: resolveShareTerms,
      });
    },
    [buildShareTerm, namedFrom, resolveShareTerms],
  );


  // PERF (2026-09-05): this memo filters and sorts all 26,847 entries, and it
  // ran synchronously on EVERY keystroke — the only debounce in this screen is
  // the cosmetic one that turns the field green. Deferring the search term lets
  // React keep the typed character responsive and re-run the scan when the JS
  // thread is free. `search` still drives the input; only the scan lags.
  const deferredSearch = useDeferredValue(search);
  const visible = useMemo(() => {
    let list = entries;
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
    const q = deferredSearch.trim().toLowerCase();
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
  }, [entries, filter, deferredSearch, selTopicId, bookmarks, starred, recent, topics, topicIdsByName, formulaById]);

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

  // ── Virtualized popup lists (2026-09-11) ────────────────────────────────
  // The held-chip term list and the single-bookmark popup are FlatLists now
  // (they were ScrollView + .map()). Keys/renderers are memoized so cells can
  // actually be reused; the row components themselves live at module scope.
  const termListColor =
    termListModal?.kind === 'bookmark'
      ? '#b45bff'
      : termListModal?.kind === 'starred'
        ? '#2f9bff'
        : undefined;
  const termListCtx = termListModal?.bookmarkCtx ?? 'glossary';
  const termListKey = useCallback((e: Entry) => e.id, []);
  const renderTermListRow = useCallback(
    ({ item }: { item: Entry }) => (
      <TermPopupRow
        id={item.id}
        term={item.term}
        color={termListColor}
        bookmarkCtx={termListCtx}
        onOpen={openTermFromList}
      />
    ),
    [termListColor, termListCtx, openTermFromList],
  );

  // One flat row list for the bookmark popup: the selected context's terms (or
  // the empty line), then the OTHER LISTS section. Both used to share a single
  // ScrollView, so folding them into one FlatList keeps the scroll behaviour
  // identical AND virtualizes the ~167-row switcher too.
  const bmPopupRows = useMemo<BmPopupRow[]>(() => {
    const rows: BmPopupRow[] =
      bmRows.length > 0 ? bmRows.map((e) => ({ kind: 'term' as const, entry: e })) : [{ kind: 'empty' }];
    if (bmSwitcherRows.length > 0) {
      rows.push({ kind: 'otherHeader' });
      for (const b of bmSwitcherRows) rows.push({ kind: 'switch', ctx: b.ctx, count: b.count });
    }
    return rows;
  }, [bmRows, bmSwitcherRows]);

  const bmPopupKey = useCallback(
    (r: BmPopupRow) =>
      r.kind === 'term' ? `t:${r.entry.id}` : r.kind === 'switch' ? `s:${r.ctx}` : r.kind,
    [],
  );
  const renderBmPopupRow = useCallback(
    ({ item }: { item: BmPopupRow }) => {
      if (item.kind === 'term') {
        return (
          <TermPopupRow
            id={item.entry.id}
            term={item.entry.term}
            color="#b45bff"
            bookmarkCtx={bmCtx}
            onOpen={openTermFromBm}
          />
        );
      }
      if (item.kind === 'empty') {
        return (
          <Text style={styles.tlEmpty}>
            {loadError
              ? 'Your terms couldn’t be loaded. Nothing has been removed from this list — check your connection and open it again.'
              : 'No bookmarks in this list yet — tap ⚑ on any term to add it.'}
          </Text>
        );
      }
      if (item.kind === 'otherHeader') {
        // OTHER LISTS — EVERY selectable list (Glossary + all topics), even empty
        // ones, plus any other non-empty context; tap to switch the terms shown
        // above. Empty lists read count 0 (user request 2026-07-25). This row
        // carries the rule + spacing the bmOtherWrap container drew.
        return (
          <View style={styles.bmOtherWrap}>
            <Text style={styles.bmOtherLabel}>OTHER LISTS</Text>
          </View>
        );
      }
      return <BmSwitchRow ctx={item.ctx} count={item.count} name={ctxName(item.ctx)} onSwitch={switchBmCtx} />;
    },
    // ctxName is a plain per-render closure over topicsById; it is covered by
    // bmSwitcherRows/topicsById upstream, so it is deliberately not a dep.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bmCtx, openTermFromBm, switchBmCtx, topicsById],
  );

  // Confirm-on-close (task 4): if ≥1 term was removed from the currently-shown
  // list since it was opened/selected, ask before closing. A fresh read via
  // getBookmarks avoids any stale hook snapshot.
  const requestCloseBookmarkPopup = useCallback(() => {
    const current = getBookmarks(bmCtx);
    let removed = 0;
    for (const id of bmBaseline.current) if (!current.has(id)) removed++;
    /**
     * ⛔ CLOSE FIRST, THEN TELL THEM. THIS WAS AN ANDROID TRAP.
     *
     * `setBmOpen(false)` used to live ONLY inside a confirmDialog raised while
     * this popup was still open — and all three exits (backdrop, CLOSE, and
     * the hardware BACK) routed through it. On Android every RN <Modal> is its
     * own Dialog window, and AppDialogHost is mounted as a SIBLING in the
     * navigator's screenLayout, so it attaches to the activity window BELOW
     * this open Dialog. PrePaywallPrompt:9-14 records that behaviour as
     * device-verified on 2026-09-19.
     *
     * So the dialog holding the only way out was drawn underneath the sheet
     * it was asked about: remove one term from a bookmark list, tap CLOSE, and
     * nothing happens. Backdrop, nothing. BACK, nothing. Force-quit.
     *
     * Closing first and reporting afterwards costs the "Keep open" option,
     * which is worth a great deal less than an exit — and nothing is destroyed
     * here anyway; the removals already happened as they were tapped.
     */
    setBmOpen(false);
    if (removed >= 1) {
      notify(
        'Removed from list',
        `You removed ${removed} term${removed === 1 ? '' : 's'} from ${ctxName(bmCtx)}.`,
      );
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
        // Guard on THIS stack's own depth (QA night 2026-08-31): canGoBack()
        // answers for the whole navigator chain, so an already-at-root stack
        // still fired POP_TO_TOP and logged the unhandled-action warning.
        const st = nav.getState?.();
        if (st && typeof st.index === 'number' && st.index > 0) nav.popToTop?.();
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
  }, [filter, selTopicId, search]);

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

  // Help for this screen (internal-help pass, owner 2026-09-08).
  const glossaryHelp = useScreenHelp({
    title: 'Using the Glossary',
    intro:
      'Every professional-audio term in one place — search it, follow the links between related terms, switch how definitions read, and save the ones you want to keep.',
    sections: [
      { heading: 'SEARCH', body: 'Type any term in the search box. Results rank by the closest match, and the letters you typed are highlighted.' },
      { heading: 'BEG / ADV', body: 'Tap BEG or ADV in the header to switch a definition between plain English (BEG) and the official, technical wording (ADV).' },
      { heading: 'LIST / CARDS', body: 'CARDS focuses one term at a time; LIST shows the full scrollable list. Tap a term to expand its definition and learning levels.' },
      { heading: 'GLOSSARY LINKS', body: 'Inside a definition, words that have their own entry show in blue — tap one to jump straight to that term. Use the “Glossary Links” button above the list to turn those links on or off everywhere; it glows blue when they’re on.' },
      { heading: 'CALCULATOR (Σ)', body: 'A blue word followed by a small purple Σ can also be calculated: tap the word for its definition, or tap the Σ to open that term’s calculator in the Audio Calculator Laboratory.' },
      { heading: 'SAVE & FILTER', body: 'Bookmark a term or add it to a custom list, then use the ALL · Topic · Bookmarks · Custom · Recent chips to filter to just those.' },
    ],
    links: [{ label: 'Open the Audio Calculator Laboratory', onPress: () => (navigation as any).navigate('CalcLab') }],
  });

  // Stable FlatList extraData (launch audit 2026-09-09): this was a fresh array
  // literal every render, which FlatList compares by reference — so any parent
  // state change (popup trail, media viewer, coach marks, scroll) forced a
  // re-render of every mounted row. Memoizing restores the bail-out. IMPORTANT:
  // it must list EVERY reactive value the row reads — bookmarks, starred and
  // isMember included (they drive the star/bookmark glyphs and the Common-
  // Mistakes body), which the old always-new array silently covered.
  // `capped` is listed as well as `isMember` and it is NOT redundant: capped is
  // `commercialMode && resolved && !isMember`, so it flips when ENTITLEMENT
  // RESOLVES even though isMember never moved. It drives the collapsed row's
  // clamp — leave it out and a guest's rows keep rendering full definitions for
  // the rest of the session, which is the exact hole this clamp closes.
  const rowExtraData = useMemo(
    () => [expandedIds, focusedId, details, cardView, ttsBeg, termIndex, mediaById, filter, formulaById, search, linksOn, bookmarks, starred, isMember, capped, defRev],
    [expandedIds, focusedId, details, cardView, ttsBeg, termIndex, mediaById, filter, formulaById, search, linksOn, bookmarks, starred, isMember, capped, defRev],
  );

  // GLOSSARY LOCK (owner 2026-09-10): a full-screen lock card over the DIMMED
  // glossary. Rendered as a Modal (below, just before </ImageBackground>) so it
  // sits above everything and captures all touches — no scroll / search / lists
  // — while the glossary stays mounted and dimmed behind it. The reopen-after-
  // upgrade effect returns the user to their last term after they buy in.
  const lockOverlay = (
    <GlossaryLockView
      visible={locked}
      resetAt={resetAt}
      onExit={() => navigation.goBack()}
      onMembership={() => {
        if (lastViewedTermRef.current) {
          void AsyncStorage.setItem(RETURN_TERM_KEY, lastViewedTermRef.current).catch(() => {});
        }
        (navigation as unknown as { navigate: (r: string) => void }).navigate('Paywall');
      }}
      onExpired={() => {
        // Window elapsed while sitting on the lock → re-check; if the user now
        // has lookups, lift the lock AND ensure the corpus is loaded.
        void getGlossaryStatus(capMode).then((u) => {
          if (!u.unavailable && u.allowed) {
            setLocked(false);
            if (entries.length === 0) void reloadCorpus();
          }
        });
      }}
    />
  );

  // NOT NOW (owner 2026-09-13). A Modal for the same reason the lock is one:
  // it has to cover the glossary completely — there is nothing behind it the
  // reader is entitled to yet — while staying re-askable and escapable.
  const deviceKeyOverlay = (
    <GlossaryDeviceKeyView
      visible={keyState === 'declined'}
      onAllow={() => void grantDeviceKey()}
      onSignIn={() =>
        // The same route Settings' "Sign in / create account" takes. Splash now
        // reads an anonymous session as NO account, so this lands on Auth.
        (navigation as unknown as { reset: (s: object) => void }).reset({
          index: 0,
          routes: [{ name: 'Splash' }],
        })
      }
      onExit={() => navigation.goBack()}
    />
  );

  return (
    <ImageBackground
      source={loading ? BG_GLOSSARY : undefined}
      style={[styles.root, { paddingTop: insets.top }]}
      imageStyle={styles.bgImage}
    >
      {glossaryHelp.sheet}
      <View style={styles.header}>
        {/* Decorative glossary mark (owner 2026-08-05): no longer a link — just
            the icon, a touch larger. */}
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <MethodIcon method="glossary" size={42} />
        </View>
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
            void AsyncStorage.setItem(TTS_MODE_KEY, next ? '1' : '0').catch(() => {});
            // Swapping BEG/ADV changes the open definition's length, which used
            // to shove it off-screen (owner 2026-08-05). Re-anchor the focused
            // term to the top so the definition just swaps in place.
            if (!cardView && focusedId) scrollTermToTop(focusedId);
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
        {/* The term count lives ONLY above the list now (single source of truth).
            The duplicate header count was removed (owner 2026-09-14) — it could
            even disagree with the list count during paging. */}
        <HelpDot onPress={glossaryHelp.open} label="Help — using the glossary" />
      </View>

      <View style={styles.searchBox}>
        {/* Search glyph always on the left (Booth 2026-07-15). */}
        <Text style={styles.searchGlyph}>⌕</Text>
        <TextInput
          style={[
            styles.searchInput,
            searchGreen && styles.searchInputDone,
            // Bold while a definition is open; back to regular when it closes.
            anyExpanded && styles.searchInputExpanded,
          ]}
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
          // The topic LIST button (owner 2026-08-06): always reads "Topic" and
          // never morphs into "Equations ✓" — that relabel made the list button
          // look like it disappeared. The Equations & Formulas view is still
          // reachable inside this picker; while it's active the chip stays
          // "Topic ✓" (amber) so the list button is consistent and re-openable.
          label={(filter === 'topic' && selTopic) || filter === 'equations' ? 'Topic ✓' : 'Topic'}
          active={filter === 'topic' || filter === 'equations'}
          accent="#ffc64d"
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
              <BookmarkIcon color={c} filled={filter === 'favorites'} size={17} />
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
            // While the corpus pages in, keep the "please wait" banner visible as
            // the header even after the first rows arrive (owner 2026-08-06 — the
            // message used to vanish the instant any term showed, because it only
            // lived in the empty slot). Once loaded, show the result count.
            loading ? (
              <GlossaryLoading count={cachedCount} landed={cachedCount != null} />
            ) : visible.length === 0 ? null : (
              <View style={styles.resultHeaderRow}>
                <Text style={styles.resultCount}>
                  {filter === 'all' && !search.trim()
                    ? // Unfiltered: the whole corpus — "N terms" (no redundant "· All").
                      `${visible.length.toLocaleString()} term${visible.length === 1 ? '' : 's'}`
                    : // A filter or search is active — these are RESULTS, labeled by what narrowed them.
                      `${visible.length.toLocaleString()} result${visible.length === 1 ? '' : 's'} · ${filterLabel}`}
                </Text>
                {/* Global definition-links toggle (owner 2026-09-14): moved here as
                    ONE control for the whole glossary — replaces the per-term link
                    icon that used to sit in every term's title bar. Lit light-blue
                    when on (matching the linked words), dimmed grey when off. */}
                <Pressable
                  onPress={() => setLinksOn(!linksOn)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityState={{ selected: linksOn }}
                  accessibilityLabel={linksOn ? 'Turn glossary definition links off' : 'Turn glossary definition links on'}
                  style={styles.linksToggle}
                >
                  <LinkIcon size={15} color={linksOn ? LINK_BLUE : colors.textMuted} off={!linksOn} />
                  <Text style={[styles.linksToggleText, { color: linksOn ? LINK_BLUE : colors.textMuted }]}>
                    Glossary Links
                  </Text>
                </Pressable>
              </View>
            )
          }
          ListFooterComponent={
            /* OFFLINE READOUT + the save control. Below the list rather than in
               the header: it is a one-off action, not something to step over on
               every visit. Hidden entirely on web, where the store cannot
               outlive a reload and the offer would be a lie. */
            !OFFLINE_AVAILABLE || loading || !offlineStats?.terms ? null : (
              <View style={styles.offlineRow}>
                <Text style={styles.offlineLabel}>USE THE GLOSSARY WITH NO SIGNAL</Text>
                {/* ⛔ OFFERED TO EVERYONE, DONE BY MEMBERS (owner 2026-09-22:
                    "only member can save all to phone - yes offer the option -
                    let user decide"). Hiding it from non-members would leave
                    them never knowing the app can do this; the decision is
                    theirs to make, which needs them to know it exists.
                    `!resolved ||` keeps the member view during the entitlement
                    round-trip — the house rule, since flashing a lock at
                    somebody who has paid is the worse error. */}
                {!resolved || isMember ? (
                  <>
                    <Text style={styles.offlineStat}>
                      {offlineStats.definitions >= offlineStats.terms
                        ? `Saved on this phone — all ${offlineStats.terms.toLocaleString()} terms work with no connection.`
                        : `${offlineStats.definitions.toLocaleString()} of ${offlineStats.terms.toLocaleString()} definitions saved on this phone.`}
                    </Text>
                    {offlineStats.definitions >= offlineStats.terms ? null : (
                      <Pressable
                        onPress={() => void saveWholeGlossary()}
                        accessibilityRole="button"
                        accessibilityLabel={
                          savingOffline
                            ? 'Stop saving the glossary to this phone'
                            : 'Save the whole glossary to this phone for use with no signal'
                        }
                        style={({ pressed }) => [styles.offlineBtn, pressed && { opacity: 0.7 }]}
                      >
                        <Text style={styles.offlineBtnText}>
                          {savingOffline ? 'SAVING — TAP TO STOP' : 'SAVE ALL FOR OFFLINE'}
                        </Text>
                      </Pressable>
                    )}
                    <Text style={styles.offlineHint}>
                      {savingOffline
                        ? 'Keep this screen open. You can carry on reading while it saves.'
                        : 'Working a ship, on a flight, or out on a tour with no wi-fi? Save the whole glossary now and every term stays readable with no signal at all. About 4 MB. Terms you read are kept automatically either way.'}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.offlineStat}>
                      Academy members can save all {offlineStats.terms.toLocaleString()} terms to this
                      phone and read them with no connection.
                    </Text>
                    <Text style={styles.offlineHint}>
                      Working a ship, on a flight, or out on a tour with no wi-fi — the glossary keeps
                      working when nothing else does. Terms you have already read stay on this phone
                      either way.
                    </Text>
                    <Pressable
                      onPress={() => {
                        if (lastViewedTermRef.current) {
                          void AsyncStorage.setItem(RETURN_TERM_KEY, lastViewedTermRef.current).catch(() => {});
                        }
                        (navigation as unknown as { navigate: (r: string) => void }).navigate('Paywall');
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="See Academy membership, which lets you save the whole glossary to this phone"
                      style={({ pressed }) => [styles.offlineBtn, pressed && { opacity: 0.7 }]}
                    >
                      <Text style={styles.offlineBtnText}>SEE MEMBERSHIP</Text>
                    </Pressable>
                  </>
                )}
              </View>
            )
          }
          ListEmptyComponent={
            loading ? null : loadError && entries.length === 0 ? (
              <View style={styles.offlineCard}>
                <Text style={styles.offlineText}>
                  Couldn’t load the glossary right now. Nothing you’ve saved is affected — check
                  your connection and retry, and email info@proaudiotrainingacademy.com if it
                  keeps failing.
                </Text>
                <View style={{ width: 180 }}>
                  <StudioButton label="Retry" variant="secondary" small onPress={reloadCorpus} />
                </View>
              </View>
            ) : (
              // Empty state as help (Pillar C): say what to do next, and turn a
              // genuinely missing term into a suggestion instead of a dead end.
              <View style={{ paddingTop: 12, gap: 10 }}>
                <Text style={[styles.empty, { paddingTop: 0 }]}>
                  No results for {search.trim() || filterLabel}. Try a shorter word or a different spelling.
                </Text>
                {search.trim() ? (
                  <Pressable
                    onPress={() => sendFeedback('term', search.trim(), { screen: 'Glossary' })}
                    accessibilityRole="button"
                    accessibilityLabel={`Suggest ${search.trim()} as a new term`}
                    style={{ alignSelf: 'flex-start' }}
                  >
                    <Text style={{ fontFamily: fonts.mono, fontSize: 11, letterSpacing: 1.2, color: colors.amber }}>
                      SUGGEST “{search.trim().toUpperCase()}” AS A NEW TERM ›
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            )
          }
          extraData={rowExtraData}
          renderItem={({ item }) => {
            // Ask for this row's definition the first time it is drawn.
            if (!item.definition) queueDefinition(item.id);
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
                // Demoted from a button (QA night 2026-09-01): this row wraps
                // real buttons — the links toggle, bookmark/star holds, speak,
                // share, media and (expanded) suggest-a-correction. As a button
                // it was invalid nesting on web and its label swallowed those
                // controls for screen readers. Semantics live on the term text;
                // its tap bubbles here (the ratified accordion pattern).
                accessible={false}
              >
                <View style={styles.entryHeader}>
                  <View style={styles.entryTermWrap}>
                    <Text
                      accessibilityRole="button"
                      accessibilityState={{ expanded }}
                      aria-expanded={expanded}
                      style={[
                        styles.term,
                        { flexShrink: 1 },
                        cardView && styles.cardTerm,
                        expanded && styles.termExpanded,
                        // An equation/calculator term IS purple (owner 2026-08-07):
                        // every glossary term a Calc Lab workspace covers — so
                        // purple always implies a real calculator link.
                        isCalcBackedTerm(item.term) ? styles.termEquation : null,
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
                        hitSlop={14}
                        accessibilityRole="button"
                        accessibilityLabel={`View ${item.term} image`}
                      >
                        <MediaGlyph />
                      </Pressable>
                    ) : null}
                  </View>
                  <View style={styles.entryActions}>
                    {/* The links toggle moved to the ONE "Glossary Links" button in
                        the count row (owner 2026-09-14) — no longer per-term. */}
                    <SpeakButton text={speakTextFor(item, ttsBeg)} size={19} />
                    {/* Share this term + definition (Booth 2026-07-18) — the
                        familiar box-with-up-arrow share glyph. */}
                    <Pressable
                      onPress={() => void shareTerm(item)}
                      hitSlop={14}
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
                  <Image accessible
                    source={{ uri: mediaUrl }}
                    style={styles.inlineMedia}
                    resizeMode="contain"
                    accessibilityRole="image"
                    accessibilityLabel="Illustration for this term"
                  />
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
                    onOpenCalc={onOpenCalc}
                    highlight={hq}
                    linksOn={linksOn}
                  />
                ) : (
                  /**
                   * COLLAPSED ROW — clamped for a CAPPED reader (bug hunt
                   * 2026-09-13, owner ruling the same night).
                   *
                   * This row used to print the COMPLETE definition with
                   * `numberOfLines={cardView ? 2 : undefined}` — unclamped in
                   * LIST view, which is the default. A guest could scroll all
                   * 26,855 definitions in full and spend NONE of their weekly
                   * fourteen, because the allowance is charged in toggleExpand
                   * and nothing here opened anything. The 14/week was therefore
                   * metering the EXPANDED breakdown only, while About, the
                   * paywall, the upgrade sheet and the Auth guest line all said
                   * "Free use includes 14 definitions a week".
                   *
                   * The owner's call was to make the app match the copy rather
                   * than the copy match the accident: a preview identifies the
                   * term, and reading it spends a lookup. The coach toast
                   * ("Tap a term to expand … the complete definition") is true
                   * for the first time.
                   *
                   * Gated on `capped`, NOT on cardView: that is
                   * `commercialMode && resolved && !isMember`, the same
                   * predicate gateDefinitionOpen charges against — so members
                   * and dev keep full collapsed definitions, and nothing clamps
                   * before entitlement resolves.
                   */
                  <Text
                    style={[styles.definition, ttsBeg && styles.definitionBeg]}
                    numberOfLines={collapsedDefinitionLines(cardView, capped)}
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
                      onOpenCalc={onOpenCalc}
                      linksOn={linksOn}
                    />
                  ) : detailErrs[item.id] ? (
                    // [72]: a failed detail fetch — say so and give a retry, not
                    // a "Loading…" that never resolves.
                    <Pressable
                      onPress={() => retryDetails(item.id)}
                      accessibilityRole="button"
                      accessibilityLabel={`Couldn't load details for ${item.term}. Tap to retry.`}
                      style={styles.detailRetryHit}
                    >
                      <Text style={styles.detailError}>Couldn’t load details — tap to retry</Text>
                    </Pressable>
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
                          hitSlop={14}
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
                            hitSlop={14}
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
                        <Image accessible
                    source={{ uri: mediaById[item.id] }}
                    style={styles.inlineMedia}
                    resizeMode="contain"
                    accessibilityRole="image"
                    accessibilityLabel={`Illustration for ${item.term}`}
                  />
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
                          // Honor the links toggle here too (user bug 2026-08-12:
                          // the card popup's main definition ignored it).
                          linksOn={linksOn}
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
                            onOpenCalc={onOpenCalc}
                            linksOn={linksOn}
                          />
                        ) : detailErrs[item.id] ? (
                          // [72]: retry instead of a permanent "Loading…".
                          // suppressBack so this tap doesn't also pop the trail
                          // (same trick the in-definition term links use).
                          <Pressable
                            onPress={() => {
                              suppressBack.current = true;
                              retryDetails(item.id);
                            }}
                            accessibilityRole="button"
                            accessibilityLabel={`Couldn't load details for ${item.term}. Tap to retry.`}
                            style={styles.detailRetryHit}
                          >
                            <Text style={styles.detailError}>Couldn’t load details — tap to retry</Text>
                          </Pressable>
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
            <Pressable accessibilityRole="button" style={{ flex: 1 }} onPress={() => setChooser(null)} accessibilityLabel="Dismiss" />
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
                      aria-pressed={active}
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
        <CoachMark text="Tap a term to expand or collapse the complete definition" bottom={18} />
      )}

      {/* Share preview pop-up (user request 2026-07-17). */}
      <ShareTermSheet payload={sharePayload} onClose={() => setSharePayload(null)} />

      {/* Media viewer (user request 2026-07-18) — tap anywhere to close. */}
      <Modal accessibilityViewIsModal visible={!!mediaPopup} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setMediaPopup(null)}>
        <Pressable style={styles.mediaBackdrop} onPress={() => setMediaPopup(null)} accessibilityRole="button" accessibilityLabel="Close image">
          {mediaPopup ? (
            <Image accessible
              source={{ uri: mediaPopup }}
              style={styles.mediaFull}
              resizeMode="contain"
              accessibilityRole="image"
              accessibilityLabel="Enlarged term illustration"
            />
          ) : null}
          <Text style={styles.mediaHint}>TAP TO CLOSE</Text>
        </Pressable>
        <LowLightDim />
      </Modal>

      {/* Held-chip term list (user request 2026-07-22) — the members of one set
          (Bookmarks / Custom / Recent). Tap a term to open it; the select icons
          re-tag it into any list. Mirrors the Flashcards held-chip list. */}
      <Modal accessibilityViewIsModal visible={!!termListModal} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setTermListModal(null)}>
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
            {/* Virtualized 2026-09-11: this set can hold hundreds of terms (the
                corpus is ~21k), and every row was mounted on open. Nothing
                nests it — the popup card is a plain View inside the Modal — so
                the FlatList simply replaces the ScrollView; same style,
                scrollbar, touch-delay and empty copy. */}
            <FlatList
              data={termListRows}
              keyExtractor={termListKey}
              renderItem={renderTermListRow}
              extraData={termListModal}
              style={{ flexGrow: 0 }}
              showsVerticalScrollIndicator
              // The card is height-capped (tlCard maxHeight 78%) and the list is
              // flexGrow:0, so its viewport is content-driven: render enough on
              // the first pass to overflow that cap, or the card would size to a
              // short first batch and then visibly grow. ~24 rows ≈ 740pt.
              initialNumToRender={24}
              maxToRenderPerBatch={12}
              windowSize={7}
              ListEmptyComponent={
                // Empty state as help (Pillar C): each list says how it fills.
                <Text style={styles.tlEmpty}>
                  {loadError
                    ? 'Your terms couldn’t be loaded. Nothing has been removed from this list — check your connection and open it again.'
                    : termListModal?.kind === 'starred'
                      ? 'No terms yet — tap ★ on any term to build your custom list.'
                      : termListModal?.kind === 'recent'
                        ? 'Nothing yet — terms you open will appear here.'
                        : 'No terms in this set.'}
                </Text>
              }
              {...NO_TOUCH_DELAY}
            />
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
      <Modal accessibilityViewIsModal visible={bmOpen} transparent animationType="fade" statusBarTranslucent onRequestClose={requestCloseBookmarkPopup}>
        <View style={styles.tlBackdrop}>
          <Pressable
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            onPress={requestCloseBookmarkPopup}
            accessibilityRole="button"
            accessibilityLabel="Dismiss"
          />
          <View style={styles.tlCard}>
            <Text style={styles.tlTitle}>{ctxName(bmCtx).toUpperCase()} · {bmRows.length}</Text>
            {/* Virtualized 2026-09-11. The OTHER LISTS switcher scrolls in the
                SAME scroller as the bookmarks (it always did), and it alone is
                ~167 rows — Glossary + every topic — so it is folded into the one
                FlatList as flattened rows rather than left as a non-virtualized
                footer. The 'otherHeader' row draws the rule/spacing the wrapping
                bmOtherWrap View used to draw, so the layout is unchanged. */}
            <FlatList
              data={bmPopupRows}
              keyExtractor={bmPopupKey}
              renderItem={renderBmPopupRow}
              extraData={bmCtx}
              style={{ flexGrow: 0 }}
              showsVerticalScrollIndicator
              // See the held-chip list above: enough on the first pass to fill
              // the height-capped card, so it never sizes short and then grows.
              initialNumToRender={24}
              maxToRenderPerBatch={12}
              windowSize={7}
              {...NO_TOUCH_DELAY}
            />
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

      {/* Glossary intro placeholder (Booth 2026-07-18).
          ⛔ HELD until the reader can actually use the glossary (owner
          2026-09-22). On a fresh install this drew at the same instant as the
          device-key consent dialog — two overlays through each other, AGREE and
          NOT NOW lost inside a paragraph of welcome copy. It is held for the
          whole key decision ('unknown' while probing, 'ask' while the dialog is
          up, 'mint' mid-mint, 'declined' behind the NOT NOW card) and for the
          weekly lock, because an intro about using the glossary makes no sense
          on top of something saying you cannot. Holding only defers it — the
          seen flag is written on dismiss, so it still appears, once, after. */}
      <ScreenIntroOverlay introKey="glossary" hold={keyState !== 'ready' || locked} />
      {/* Weekly-lookup HARD LOCK over the dimmed glossary (owner 2026-09-10). */}
      {lockOverlay}
      {deviceKeyOverlay}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg, paddingHorizontal: 16, gap: 12 },
  bgImage: { resizeMode: 'cover' },
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
  /**
   * The settled search text turns the same green as the highlight it produced.
   * Measured in the browser: the colour was ALREADY identical in both places —
   * rgb(55,224,95) — so only the WEIGHT ever differed.
   */
  searchInputDone: { color: '#37e05f' },
  /**
   * BOLD ONLY WHILE A DEFINITION IS OPEN (owner 2026-09-22: "expanded def =
   * bold. compacted definitions = regular").
   *
   * The weight tracks the reading state, not the search state: it thickens
   * while a definition is expanded and drops back the moment it closes, so the
   * field echoes what the reader is actually looking at. An earlier pass tied
   * it to the search having settled, which left it permanently bold and said
   * nothing.
   */
  searchInputExpanded: { fontFamily: fonts.barlowSemiBold },
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
  // Pinned "Equations & Formulas" row at the top of the topic picker — PURPLE
  // accent (owner 2026-08-07: equations/calculator = purple), so it reads as a
  // special cross-topic filter, not a topic.
  equationsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 15,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(168,130,255,0.28)',
    backgroundColor: 'rgba(168,130,255,0.07)',
  },
  equationsRowText: {
    flexShrink: 1,
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 14,
    letterSpacing: 0.6,
    color: colors.purple,
  },
  equationsCount: { fontFamily: fonts.mono, fontSize: 13, color: colors.purple },
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
    // Fixed height (owner 2026-08-05): a minHeight let the text chips grow a
    // touch taller than the icon-only Bookmarks chip, so it looked short. A fixed
    // height gives every filter button identical top/bottom edges.
    height: 40,
    paddingVertical: 0,
    paddingHorizontal: 14,
    borderRadius: 4.5,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1 },
  list: { paddingBottom: 16 },
  empty: { fontFamily: fonts.barlowRegular, fontSize: 14, color: colors.textSub, paddingTop: 12 },
  offlineRow: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 28, gap: 8 },
  offlineLabel: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 10,
    letterSpacing: 1.8,
    color: colors.textMutedDeep,
    marginBottom: 2,
  },
  offlineStat: { fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 18, color: colors.textSub },
  offlineBtn: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.amber,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center',
  },
  offlineBtnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.amber },
  offlineHint: { fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16, color: colors.textMuted },
  offlineCard: { alignItems: 'center', gap: 14, paddingTop: 28, paddingHorizontal: 16 },
  offlineText: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 21, color: colors.textSub, textAlign: 'center' },
  // Loading panel (owner 2026-08-05) — shown while the corpus pages in.
  loadingBox: {
    marginTop: 64,
    alignSelf: 'center',
    maxWidth: 380,
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    // Translucent glass so the new background reads through the panel.
    backgroundColor: 'rgba(12,12,15,0.62)',
    gap: 10,
  },
  loadingKicker: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 2.4, color: colors.amber },
  loadingTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 24, letterSpacing: 0.6, color: colors.textPrimary },
  loadingSub: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 21, color: colors.textSecondary, textAlign: 'center' },
  // Result count above the list (user request 2026-07-17).
  resultCount: {
    // Barlow, not condensed Oswald (owner 2026-09-14): Oswald is the app's
    // UPPERCASE-label face and read cramped/odd for a number + lowercase word
    // ("26,855 terms"). Barlow is the readable body face used across the screen,
    // so the count now sits naturally with the rest of the content.
    fontFamily: fonts.barlowMedium,
    fontSize: 12.5,
    letterSpacing: 0.2,
    // Green (owner 2026-09-14).
    color: colors.green,
    paddingBottom: 8,
    paddingLeft: 2,
  },
  resultHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  // "Glossary Links" text button (owner 2026-09-14) — the single global toggle for
  // definition cross-links, sitting where SELECT used to. Icon + label share the
  // light-blue link colour when lit, grey when dimmed (colour set inline).
  linksToggle: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingBottom: 8, paddingRight: 2 },
  linksToggleText: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 1.2 },
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
    color: LINK_BLUE,
    textDecorationLine: 'underline',
    textDecorationColor: 'rgba(159,190,222,0.35)',
  },
  // Squared purple Σ that trails a calculator-backed link word (owner 2026-09-14),
  // matching the top Σ (calculator) button — an inline View (true square) with the
  // same rounded corners, purple border, and faint purple fill. Tapping opens the
  // word's calculator.
  calcSigmaBox: {
    width: 16,
    height: 16,
    borderRadius: 4.5,
    borderWidth: 1,
    borderColor: colors.purple,
    backgroundColor: 'rgba(180,91,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    // Oswald caps sit low in their line box; paddingBottom shrinks the centering
    // area at the bottom so the flex-centered Σ lifts to sit optically centered
    // (deterministic, unlike transform/margin on a flex child). Tuned on device.
    paddingBottom: 2,
    // Inline views sit on the baseline; nudge down slightly so the box centers on
    // the x-height of the surrounding definition text.
    transform: [{ translateY: 3 }],
  },
  calcSigmaChar: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 12,
    lineHeight: 12,
    color: colors.purple,
    textAlign: 'center',
    includeFontPadding: false,
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
  // Equation title = purple (owner 2026-08-07). Placed AFTER termExpanded in the
  // style array so it wins over the amber expanded color and swaps the glow to
  // match — an equation reads purple whether collapsed or expanded.
  termEquation: {
    color: colors.purple,
    textShadowColor: 'rgba(168,130,255,.38)',
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
  // "Open in Calculator" deep-link (owner 2026-08-07) — purple to match the
  // equation title styling; the Σ echoes the glossary's global calculator button.
  calcLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(168,130,255,.5)',
    backgroundColor: '#15111f',
    paddingVertical: 9,
    paddingHorizontal: 13,
    marginBottom: 4,
  },
  calcLinkSigma: { fontFamily: fonts.oswaldSemiBold, fontSize: 16, lineHeight: 18, color: colors.purple },
  calcLinkText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 0.5, color: colors.purple },
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
  // [72]: failed detail fetch — amber (never colour alone: it also says "retry")
  // on a 44pt-tall hit area.
  detailError: { fontFamily: fonts.mono, fontSize: 12, color: colors.amberLabel },
  detailRetryHit: { marginTop: 10, minHeight: 44, justifyContent: 'center' },
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
