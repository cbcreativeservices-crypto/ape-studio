/**
 * MY CUSTOM LIST — always on the study dashboard, every method open, honest
 * empty popups, and the 30-term quiz (owner 2026-10-19).
 *
 * "The MY CUSTOM LIST is always loaded and available in the study dashboard -
 * in fact it is the only topic that can never be removed from the study
 * dashboard. … already have all study methods, scenarios, and the quiz just
 * populate with what ever terms they have in their custom list. … On the custom
 * list quiz allow the quiz to go from a minimum of 30 terms up to their total
 * list of terms (randomly selected)."
 *
 * Scenarios and the quiz are server-backed. They were HELD (studyGate.ts
 * CUSTOM_LIST_SERVER_READY = false) until Comp A's RPCs existed (brief:
 * Downloads/2026-10-19_COMP_A_CUSTOM_LIST_QUIZ.md); D12 (2026-10-27) wired
 * them — test/customListQuizScenarios_20261027 pins the RPC routing.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const store = new Map<string, string>();
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@react-native-async-storage/async-storage') {
      return { url: new URL('./_fake-async-storage.mjs', import.meta.url).href, shortCircuit: true };
    }
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});
(globalThis as Record<string, unknown>).__FAKE_ASYNC_STORAGE__ = store;

const rules = await import('../src/features/commercial/studyGate.ts');
const deck = await import('../src/features/dashboard/deckOrderStore.ts');
const flagged = await import('../src/features/flags/flaggedStore.ts');

const settle = async () => {
  for (let i = 0; i < 5; i++) await new Promise<void>((r) => setImmediate(r));
};
const read = (rel: string) => readFileSync(new URL(`../${rel}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const DASH = 'src/screens/dashboard/DashboardScreen.tsx';

/* ── 1. Always present, never removed ─────────────────────────────────────── */

test('1a. the custom list id is the flagged pseudo-topic, and it can never be removed', () => {
  assert.equal(rules.CUSTOM_LIST_ID, 'flagged');
  assert.equal(flagged.FLAGGED_TOPIC_ID, rules.CUSTOM_LIST_ID);
  assert.equal(rules.canRemoveFromDeck('flagged'), false);
  assert.equal(rules.canRemoveFromDeck('some-topic-uuid'), true);
  assert.deepEqual(rules.effectiveRemoved(['a', 'flagged', 'b']), ['a', 'b']);
});

test('1b. "show on dashboard" is always true; OFF is refused', () => {
  assert.equal(flagged.getCustomOnDashboard(), true);
  flagged.setCustomOnDashboard(false);
  assert.equal(flagged.getCustomOnDashboard(), true);
  assert.equal(flagged.useCustomOnDashboard(), true);
});

test('1c. the deck store refuses to remove the custom list, and ignores an old stored removal', async () => {
  store.clear();
  store.set('ape:deckOrder', JSON.stringify({ mode: 'alpha', order: [], removed: [] }));
  deck.resetLocal();
  void deck.getDeckPrefs();
  await settle();
  deck.removeFromDeck('flagged', ['flagged', 'a', 'b']);
  await settle();
  assert.deepEqual(deck.getDeckPrefs().removed, [], 'the ✕ guard let the custom list go');
  // A device that removed it before 2026-10-19: it comes back, pinned first.
  const prefs = { mode: 'alpha' as const, order: [], removed: ['flagged', 'b'] };
  const ids = deck.orderDeckIds(
    [
      { id: 'flagged', name: 'My Custom List' },
      { id: 'a', name: 'Acoustics' },
      { id: 'b', name: 'Bass' },
    ],
    prefs,
    'flagged',
  );
  assert.deepEqual(ids, ['flagged', 'a']);
  // Custom order too.
  const custom = deck.orderDeckIds([{ id: 'flagged', name: 'My Custom List' }, { id: 'a', name: 'A' }], { mode: 'custom', order: ['a'], removed: ['flagged'] });
  assert.ok(custom.includes('flagged'));
});

test('1d. the Dashboard always decks the list; the sheet has no ✕ for it; Enrollments has no UNLOAD', () => {
  const d = read(DASH);
  assert.doesNotMatch(d, /useCustomOnDashboard/);
  assert.match(d, /const members: Topic\[\] = data \? \[customTopic, \.\.\.data\.topics\] : \[\];/);
  assert.match(d, /\{ id: FLAGGED_TOPIC_ID, name: FLAGGED_TOPIC_NAME \},\s*\.\.\.d\.topics\.map/);
  assert.match(d, /const removedIds = effectiveRemoved\(deckPrefs\.removed\);/);
  const sheet = read('src/screens/dashboard/TopicDeckSheet.tsx');
  assert.match(sheet, /\{canRemoveFromDeck\(t\.id\) \? \(\s*<RowBtn\s*label="✕"/);
  const sel = read('src/screens/enrollment/EnrollmentSelection.tsx');
  assert.match(sel, /\{isCustom \? \(\s*<View style=\{s\.loadActionBtn\}[^>]*>\s*<Text style=\{s\.loadText\}>ALWAYS IN STUDY<\/Text>/);
  assert.doesNotMatch(sel, /'UNLOAD' : 'LOAD'/);
  const en = read('src/screens/enrollment/EnrollmentScreen.tsx');
  assert.match(en, /if \(card\.kind === 'custom'\) return;/);
  assert.doesNotMatch(en, /setCustomOnDashboard/);
});

/* ── 2. Every method open, no power sequence ──────────────────────────────── */

test('2a. every custom-list method is powered; Scenarios joins when the server is ready', () => {
  assert.deepEqual(rules.customListMethods(false), ['flashcards', 'fill_in_blank', 'matching']);
  assert.deepEqual(rules.customListMethods(true), ['flashcards', 'fill_in_blank', 'matching', 'scenarios']);
  for (const m of rules.customListMethods(true)) assert.equal(rules.customListMethodPowered(m), true);
  assert.equal(rules.customListHasQuiz(false), false);
  assert.equal(rules.customListHasQuiz(true), true);
});

test('2b. SERVER READY (D12, 2026-10-27): Scenarios and the quiz are on, on the list’s own RPCs', () => {
  assert.equal(rules.CUSTOM_LIST_SERVER_READY, true);
  assert.deepEqual(rules.customListMethods(), ['flashcards', 'fill_in_blank', 'matching', 'scenarios']);
  assert.equal(rules.customListHasQuiz(), true);
  const d = read(DASH);
  // The quiz panel is drawn for the list, and exactly two routes reach the
  // Quiz screen: the topic BEGIN, and the list's BEGIN with its length.
  assert.match(d, /\{!isCustom \|\| customListHasQuiz\(\) \? \(/);
  assert.equal((d.match(/navigation\.navigate\('Quiz',/g) ?? []).length, 2);
  assert.match(d, /navigation\.navigate\('Quiz', \{ achievementId: FLAGGED_TOPIC_ID, topicName: FLAGGED_TOPIC_NAME, customCount: len \}\)/);
  // The topic BEGIN is reached only past the custom branch.
  const custom = d.search(/if \(dispIsCustom\) \{\s*customQuizPress\(\);\s*return;\s*\}/);
  const topicBegin = d.indexOf("'Before you begin',");
  assert.ok(custom > 0 && topicBegin > custom, 'the list must branch off before the topic quiz BEGIN');
});

test('2c. the Dashboard powers the list\'s methods from the start; real topics keep the chain', () => {
  const d = read(DASH);
  assert.match(d, /const powered = isCustom\s*\? true\s*: m\.key === 'flashcards' \? true : m\.key === 'scenarios' \? scenariosPowered : homeworkPowered;/);
  assert.match(d, /\(isCustom \? METHOD_ORDER\.filter\(\(m\) => customMethods\.includes\(m\.key\)\) : METHOD_ORDER\)\.map/);
  // The real-topic chain is untouched.
  assert.match(d, /const homeworkPowered = bypassLocks \|\| flashcardsSeenAll;/);
  assert.match(d, /const scenariosPowered = bypassLocks \|\| \(flashcardsSeenAll && coreHomeworkComplete\);/);
  // The membership gate still comes first on every switch.
  assert.match(d, /if \(actMembershipLocked\) \{\s*setUpgradeOpen\(true\);\s*return;\s*\}\s*const routeName = STUDY_ROUTES\[m\.key\];\s*\/\/[^\n]*\n\s*\/\/[^\n]*\n\s*if \(dispIsCustom && !customMethodOpens\(\)\) return;/);
});

test('2d. Fill in the Blank and Matching use the list\'s current terms, local-only', () => {
  for (const [f, method] of [
    ['src/screens/study/FillInBlankScreen.tsx', 'fill_in_blank'],
    ['src/screens/study/MatchingScreen.tsx', 'matching'],
  ] as const) {
    const src = read(f);
    assert.match(src, /const customMode = isCustomListId\(achievementId\);/, f);
    assert.match(src, /customMode\s*\? readTermList\('starred'\)\.then\(\(ids\) => fetchGlossaryItemsByIds\(\[\.\.\.ids\]\)\)\s*: fetchTopicItems\(achievementId, tierForTermsRef\.current\)/, f);
    assert.match(src, new RegExp(`customMode \\? Promise\\.resolve\\(null\\) : fetchMethodState\\(achievementId, '${method}'\\)`), f);
    // No server study session and no device mirror for the 'flagged' id.
    assert.match(src, /if \(customMode\) \{\s*return \(\) => \{\s*alive = false;\s*\};\s*\}\s*const s = new StudySession/, f);
    assert.match(src, /if \(customMode\) return; \/\/ the custom list: nothing to mirror/, f);
  }
  // Flashcards already had it (flaggedMode, 2026-07-18).
  assert.match(read('src/screens/study/FlashcardsScreen.tsx'), /flaggedMode \? readTermList\('starred'\)\.then\(\(ids\) => fetchGlossaryItemsByIds\(\[\.\.\.ids\]\)\)/);
});

/* ── 3. Empty, loading and unreadable taps ────────────────────────────────── */

test('3a. a method tap: empty → popup, not read yet → Checking…, unreadable → opens (its screen retries)', () => {
  assert.equal(rules.customMethodTap({ read: true, unreadable: false, count: 0 }), 'empty');
  assert.equal(rules.customMethodTap({ read: false, unreadable: false, count: 0 }), 'checking');
  assert.equal(rules.customMethodTap({ read: false, unreadable: true, count: 0 }), 'open');
  assert.equal(rules.customMethodTap({ read: true, unreadable: false, count: 3 }), 'open');
});

test('3b. the empty popup says how terms are actually added, in plain words', () => {
  assert.equal(rules.CUSTOM_EMPTY_TITLE, 'No terms in your list yet');
  assert.match(rules.CUSTOM_EMPTY_BODY, /^Add terms from the Glossary to study them here/);
  // Popup review 2 D13 (2026-10-27): the house name for the icon.
  assert.match(rules.CUSTOM_EMPTY_BODY, /the three-card icon beside any term/);
  assert.equal(rules.CUSTOM_CHECKING_TITLE, 'Checking…');
  // A failed read is never called empty.
  assert.doesNotMatch(rules.CUSTOM_UNREADABLE_BODY, /empty/i);
  assert.match(rules.CUSTOM_UNREADABLE_BODY, /Nothing has been removed/);
});

test('3c. the count line never says 0 TERMS for a list that has not been read', () => {
  assert.equal(rules.customListCountLine({ read: false, unreadable: false, count: 0 }), 'CHECKING…');
  assert.equal(rules.customListCountLine({ read: false, unreadable: true, count: 0 }), 'TERMS COULD NOT BE READ');
  assert.equal(rules.customListCountLine({ read: true, unreadable: false, count: 0 }), '0 TERMS');
  assert.equal(rules.customListCountLine({ read: true, unreadable: false, count: 1 }), '1 TERM');
  assert.equal(rules.customListCountLine({ read: true, unreadable: false, count: 42 }), '42 TERMS');
});

test('3d. the Dashboard answers taps with centred popups (notify), never a raw Alert', () => {
  const d = read(DASH);
  const at = d.indexOf('const customMethodOpens = (): boolean => {');
  const body = d.slice(at, d.indexOf('const beginCustomQuiz', at));
  assert.match(body, /if \(t === 'empty'\) notify\(CUSTOM_EMPTY_TITLE, CUSTOM_EMPTY_BODY\);/);
  assert.match(body, /notify\(CUSTOM_CHECKING_TITLE, CUSTOM_CHECKING_BODY\)/);
  assert.match(body, /notify\(CUSTOM_UNREADABLE_TITLE, CUSTOM_UNREADABLE_BODY\)/);
  assert.match(body, /notify\(CUSTOM_QUIZ_MIN_TITLE, customQuizMinBody\(starred\.size\)\)/);
  assert.doesNotMatch(body, /Alert\.alert/);
});

/* ── 4. The quiz: 30 minimum, 30 … all, random draw ───────────────────────── */

test('4a. the 30-term minimum, with the exact sentence', () => {
  const t = (count: number, read = true, unreadable = false) => rules.customQuizTap({ read, unreadable, count });
  assert.equal(t(0), 'empty');
  assert.equal(t(1), 'too_few');
  assert.equal(t(29), 'too_few');
  assert.equal(t(30), 'choose');
  assert.equal(t(500), 'choose');
  assert.equal(t(0, false), 'checking');
  assert.equal(t(0, false, true), 'unreadable');
  assert.equal(rules.CUSTOM_QUIZ_MIN, 30);
  assert.equal(rules.customQuizMinBody(12), 'The quiz needs at least 30 terms in your list. You have 12 — add 18 more to start.');
  assert.equal(rules.customQuizMinBody(29), 'The quiz needs at least 30 terms in your list. You have 29 — add 1 more to start.');
  assert.equal(rules.termsShort(40), 0);
});

test('4b. the length choices run 30 … the full count (30 / 50 / 100 / ALL, capped)', () => {
  const ns = (c: number) => rules.quizLengthOptions(c).map((o) => (o.all ? `ALL ${o.n}` : `${o.n}`));
  assert.deepEqual(ns(29), []);
  assert.deepEqual(ns(30), ['ALL 30']);
  assert.deepEqual(ns(45), ['30', 'ALL 45']);
  assert.deepEqual(ns(50), ['30', 'ALL 50']);
  assert.deepEqual(ns(51), ['30', '50', 'ALL 51']);
  assert.deepEqual(ns(100), ['30', '50', 'ALL 100']);
  assert.deepEqual(ns(250), ['30', '50', '100', 'ALL 250']);
  for (const c of [30, 31, 64, 99, 100, 101, 1000]) {
    const opts = rules.quizLengthOptions(c);
    assert.ok(opts.every((o) => o.n >= 30 && o.n <= c), `out of range for ${c}`);
    assert.equal(opts[opts.length - 1].n, c, 'ALL is always the full count');
  }
  assert.equal(rules.clampQuizLength(10, 80), 30);
  assert.equal(rules.clampQuizLength(500, 80), 80);
  assert.equal(rules.clampQuizLength(55, 80), 55);
  assert.equal(rules.clampQuizLength(30, 12), null);
});

test('4c. the draw: exactly n distinct terms, all from the list, uniformly random', () => {
  const ids = Array.from({ length: 120 }, (_, i) => `t${i}`);
  for (const n of [30, 50, 100, 120]) {
    const got = rules.drawRandomTerms(ids, n);
    assert.equal(got.length, n);
    assert.equal(new Set(got).size, n, 'a term was drawn twice');
    assert.ok(got.every((x) => ids.includes(x)));
  }
  // Never more than the list; duplicates in the input count once.
  assert.equal(rules.drawRandomTerms(['a', 'b', 'a'], 30).length, 2);
  // Deterministic with an injected rand, and a real shuffle (not the first n).
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const a = rules.drawRandomTerms(ids, 30, rand);
  assert.notDeepEqual(a, ids.slice(0, 30));
  // Uniform: over many draws every term is picked about n/len of the time.
  const hits = new Map<string, number>();
  const runs = 4000;
  for (let r = 0; r < runs; r++) for (const x of rules.drawRandomTerms(ids, 30)) hits.set(x, (hits.get(x) ?? 0) + 1);
  const expected = (runs * 30) / ids.length; // 1000
  for (const x of ids) {
    const h = hits.get(x) ?? 0;
    assert.ok(Math.abs(h - expected) < expected * 0.15, `${x} drawn ${h} times, expected ~${expected}`);
  }
});

test('4d. the length popup is a centred DimModal popup built on the same rules', () => {
  const src = read('src/screens/dashboard/TopicDeckSheet.tsx');
  assert.match(src, /import \{ Modal \} from '\.\.\/\.\.\/components\/DimModal';/);
  assert.match(src, /\.\.\.popupCard/);
  assert.match(src, /const options = quizLengthOptions\(count\);/);
  assert.match(src, /export function CustomQuizLengthSheet\(/);
  assert.match(src, /backdrop: \{ flex: 1, backgroundColor: 'rgba\(0,0,0,0\.6\)', justifyContent: 'center'/);
  const d = read(DASH);
  // D12: the server draws from the WHOLE list (it alone can substitute a term
  // with no question), so BEGIN hands QuizScreen the length, not a draw.
  assert.doesNotMatch(d, /drawRandomTerms\(/);
  assert.match(d, /const len = clampQuizLength\(n, starred\.size\);/);
  assert.match(d, /afterPopupCloses\(\(\) =>\s*navigation\.navigate\('Quiz', \{ achievementId: FLAGGED_TOPIC_ID, topicName: FLAGGED_TOPIC_NAME, customCount: len \}\),\s*\);/);
  assert.match(d, /popupOpenRef\.current = termsOpen \|\| trophyOpen \|\| deckOpen \|\| upgradeOpen \|\| customQuizOpen \|\| dashIntroUp;/);
});

/* ── 5. Every meter reads 100% from the start (owner 2026-10-19) ──────────── */

test('5. every custom-list meter is FULL and never moves; nothing is recorded', () => {
  // "On My Custom List - do not progress progress bars, show all always at 100%
  // already (also to show they are open and available to use)."
  assert.equal(rules.CUSTOM_LIST_METER_PCT, 100);
  const d = read(DASH);
  // Each method panel: a full meter, not a progress figure; EMPTY still in words.
  const at = d.indexOf('{isCustom ? (\n                      // Owner 2026-10-19: the meter reads FULL');
  assert.ok(at > 0, 'the custom method panel is missing');
  const panel = d.slice(at, d.indexOf('/>', at));
  assert.match(panel, /segments=\{segmentsForPct\(CUSTOM_LIST_METER_PCT\)\}/);
  // D4 (2026-10-27): a non-member's list reads LOCKED first (popupReview2 pins it).
  assert.match(panel, /\?\s*'LOCKED'\s*:\s*starred\.size > 0 \|\| !starredRead \|\| starredUnreadable\s*\?\s*'OPEN'\s*:\s*'EMPTY'/);
  assert.doesNotMatch(panel, /pct|rawPct|methodPct/);
  // The list quiz (when it appears) and the topic card read full too.
  assert.match(d, /<GlassScreen title="LIST QUIZ" value=\{qShort\} valueColor=\{qColor\} segments=\{segmentsForPct\(CUSTOM_LIST_METER_PCT\)\} \/>/);
  assert.match(d, /const dispOverallPct = dispIsCustom \? CUSTOM_LIST_METER_PCT : jogActive/);
  assert.match(d, /if \(t\.id === FLAGGED_TOPIC_ID\) return CUSTOM_LIST_METER_PCT;/);
  // Full is a display, never a completion: no ✓, no celebration, no credit.
  assert.match(d, /const complete = !isCustom && isApplicable && rawPct >= 100;/);
  // And no progress is written for the list by any method screen.
  for (const f of ['src/screens/study/FillInBlankScreen.tsx', 'src/screens/study/MatchingScreen.tsx']) {
    assert.match(read(f), /if \(customMode\) return; \/\/ the custom list: nothing to mirror/, f);
  }
  assert.match(read('src/screens/study/FlashcardsScreen.tsx'), /if \(flaggedMode\) return; \/\/ pseudo-topic: nothing to mirror/);
});
