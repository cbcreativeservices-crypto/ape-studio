/**
 * PERFORMANCE HUNT 2026-10-03 — AREA 3 (GLOSSARY). Receipts.
 *
 * Each block pins the faster structure, and each fails on HEAD 4201f49f:
 *  1. Search per keystroke: term lower-cased once at load; word-prefix rank by
 *     indexOf instead of a regex split + word array per term per keystroke.
 *     The new rank is proven equal to the old one over a generated corpus.
 *  2. Rows stop re-rendering on every parent render: renderItem is memoized,
 *     the list runs in strictMode, and the search highlight / extraData follow
 *     `deferredSearch` (so a keystroke repaints the field, not every row).
 *  3. The cross-link index no longer runs inside the list's first paint.
 *  4. Cold open: the corpus (a local read on a warm phone) starts before the
 *     lock check and the topic-list round trip, and paints without waiting on
 *     the topic chip — still after the lock is decided.
 *  5. Term popup (labs / calculators): a re-open of a term already read this
 *     session paints at once; the gateway probe is warmed while the host
 *     screen is open and once per session at the app root.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import ts from 'typescript';

const SCREEN = readFileSync(new URL('../src/screens/glossary/GlossaryScreen.tsx', import.meta.url), 'utf8');
const POPUP = readFileSync(new URL('../src/features/glossary/GlossaryTermPopup.tsx', import.meta.url), 'utf8');
const ROOT = readFileSync(new URL('../src/features/glossary/GlossaryPrefetchRoot.tsx', import.meta.url), 'utf8');

const between = (src: string, a: string, b: string) => {
  const i = src.indexOf(a);
  assert.ok(i >= 0, `marker not found: ${a}`);
  const j = src.indexOf(b, i + a.length);
  assert.ok(j >= 0, `end marker not found: ${b}`);
  return src.slice(i, j);
};

describe('1. search ranks without a per-term regex split', () => {
  it('the term is lower-cased once, when the corpus loads', () => {
    const load = between(SCREEN, 'function loadAllEntries(', 'type ShareDefinitionUnreadable');
    assert.equal((load.match(/termLower: r\.term\.toLowerCase\(\),/g) ?? []).length, 2);
    assert.match(SCREEN, /searchRank\(e\.termLower \?\? e\.term\.toLowerCase\(\), q\)/);
  });

  it('searchRank no longer splits every term into words', () => {
    const fn = between(SCREEN, 'function searchRank(', '\n}\n');
    assert.ok(!/\.split\(/.test(fn), 'searchRank splits the term again — one regex split + array per term per keystroke');
    assert.match(fn, /queryIsWordy\(q\)/);
  });

  it('…and answers exactly what the split version answered', () => {
    const code = between(SCREEN, 'const SUBSTRING_MIN_LEN', '/** Everyday English words');
    const js = ts.transpileModule(code, { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText;
    const searchRank = new Function(`${js}; return searchRank;`)() as (t: string, q: string) => number;
    const oldRank = (termLower: string, q: string): number => {
      if (termLower === q) return 0;
      if (termLower.startsWith(q)) return 1;
      for (const w of termLower.split(/[^a-z0-9]+/)) if (w.startsWith(q)) return 2;
      if (q.length >= 5 && termLower.includes(q)) return 3;
      return 99;
    };
    const parts = ['audio', 'bi', 'polar', 'ssl', 'lossless', 'dB', 'q', '-', ' ', '(', ')', '/', 'é', '2', 'x', 'a-b', "'"];
    let seed = 7;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const terms: string[] = [];
    for (let i = 0; i < 3000; i++) {
      let t = '';
      const n = 1 + Math.floor(rnd() * 6);
      for (let k = 0; k < n; k++) t += parts[Math.floor(rnd() * parts.length)];
      terms.push(t.toLowerCase());
    }
    const queries = ['a', 'au', 'audio', 'polar', 'bipolar', 'ssl', 'q', 'x', '2', 'd', '-', 'a-b', ' ', 'é', "'", 'lossless', 'b', 'ar'];
    for (const q of queries) for (const t of terms) assert.equal(searchRank(t, q), oldRank(t, q), `${JSON.stringify(t)} / ${JSON.stringify(q)}`);
  });
});

describe('2. a keystroke does not re-render every mounted row', () => {
  it('the row renderer is a memoized callback, and the list is in strictMode', () => {
    assert.match(SCREEN, /const renderEntryRow = useCallback\(/);
    assert.match(SCREEN, /renderItem=\{renderEntryRow\}/);
    const list = between(SCREEN, 'renderItem={renderEntryRow}', '/>');
    assert.match(list, /\{\.\.\.STRICT_ROWS\}/);
    assert.match(SCREEN, /const STRICT_ROWS = \{ strictMode: true \} as Record<string, unknown>;/);
    assert.ok(!/renderItem=\{\(\{ item \}\) => \{\s*\n\s*\/\/ Ask for this row/.test(SCREEN), 'the inline row renderer is back');
  });

  it('rows read the DEFERRED query, not the live one', () => {
    const row = between(SCREEN, 'const renderEntryRow = useCallback(', '// Help for this screen');
    assert.match(row, /const hq = deferredSearch\.trim\(\);/);
    assert.ok(!/\bsearch\.trim\(\)/.test(row));
    // Every value a row reads is a dependency (the inline arrow covered them by accident).
    const deps = row.slice(row.lastIndexOf('['));
    for (const v of ['deferredSearch', 'expandedIds', 'details', 'detailErrs', 'bookmarks', 'starred', 'termIndex', 'linksOn', 'capped', 'isMember', 'shortRead', 'defRev', 'mistakesLockLine', 'ttsBeg', 'cardView', 'filter', 'formulaById', 'mediaById']) {
      assert.ok(new RegExp(`\\b${v}\\b`).test(deps), `renderEntryRow deps miss ${v}`);
    }
    assert.ok(!/\bsearch\b/.test(deps.replace(/deferredSearch/g, '')), 'the live query is a row dependency again');
  });

  it('extraData and the jump-to-top follow the deferred query too', () => {
    const extra = between(SCREEN, 'const rowExtraData = useMemo(', ');');
    assert.ok(!/[,\s]search,/.test(extra), 'extraData carries the live query — strictMode would re-render every row per keystroke');
    assert.match(extra, /deferredSearch/);
    assert.match(SCREEN, /\}, \[filter, selTopicId, deferredSearch\]\);/);
  });
});

describe('3. the cross-link index is out of the first paint', () => {
  it('built from a deferred copy of the corpus', () => {
    assert.match(SCREEN, /const indexEntries = useDeferredValue\(entries\);/);
    assert.match(SCREEN, /indexEntries\.length \? buildTermIndex\(indexEntries\) : null/);
    assert.ok(!/buildTermIndex\(entries\)/.test(SCREEN));
  });
});

describe('4. cold open: the corpus is not queued behind two round trips', () => {
  const effect = between(SCREEN, 'if (!keyReady) {', 'stopAllSpeech(); // leaving the glossary');
  it('the corpus load starts before the lock check and the topic list', () => {
    const load = effect.indexOf('loadAllEntries(table)');
    assert.ok(load >= 0);
    assert.ok(load < effect.indexOf('getGlossaryStatus(capMode)'), 'the corpus waits on the lock check again');
    assert.ok(load < effect.indexOf(".from('achievements')"), 'the corpus waits on the topic list again');
  });
  it('it paints when it lands — after the lock decision, not after the topic chip', () => {
    assert.match(effect, /Promise\.all\(\[loadAllEntries\(table\), lockKnown\]\)\.then\(\(\[all\]\) => \{\s*if \(!alive\) return;\s*setEntries\(all\);/);
    const decided = effect.indexOf('lockDecided();');
    assert.ok(decided > effect.indexOf('setLocked(false); // member / dev / pre-resolve'));
    assert.ok(decided < effect.indexOf(".from('achievements')"));
    // A failed corpus still reaches the error card.
    assert.match(effect, /await corpus;\s*\} catch \(e\) \{/);
    assert.match(effect, /if \(alive && corpusNeedsLoad\(table\)\) setLoading\(true\);/);
  });
});

describe('6. term illustrations are cached, not re-downloaded', () => {
  it('every term image is expo-image with the memory+disk cache', () => {
    assert.match(SCREEN, /import \{ Image as ExpoImage \} from 'expo-image';/);
    const rn = SCREEN.match(/import\s*\{([^}]*)\}\s*from 'react-native';/)?.[1] ?? '';
    assert.doesNotMatch(rn, /\bImage\b,/, 'react-native Image is back for a remote picture');
    const imgs = SCREEN.match(/<ExpoImage accessible[\s\S]*?\/>/g) ?? [];
    assert.equal(imgs.length, 3);
    for (const i of imgs) {
      assert.match(i, /cachePolicy="memory-disk"/);
      assert.match(i, /contentFit="contain"/);
    }
  });
});

describe('5. the term popup from labs and calculators', () => {
  it('a re-open of a term read this session paints without the by-name lookup', () => {
    assert.match(POPUP, /const NAME_HITS = new Map</);
    const fast = between(POPUP, 'const known = NAME_HITS.get(termName);', 'setLoading(true);');
    assert.match(fast, /sessionDefinition\(known\.id\)/);
    assert.match(fast, /setLoading\(false\);\s*return;/);
    assert.match(POPUP, /setRow\(hit\);\s*NAME_HITS\.set\(termName, \{ id: hit\.id, term: hit\.term, plainNull: !hit\.plain_english\?\.trim\(\) \}\);/);
    // No definition TEXT is cached by name — only public ids/names.
    assert.ok(!/NAME_HITS\.set\([^)]*definition/.test(POPUP));
  });
  it('the probe is warmed while the host screen is open', () => {
    assert.match(POPUP, /useEffect\(\(\) => \{\s*void probeGateway\(\);\s*\}, \[\]\);/);
  });
  it('…and once per session at the app root, out of the launch path', () => {
    assert.match(ROOT, /import \{ probeGateway \} from '\.\/glossaryGateway';/);
    assert.match(ROOT, /setTimeout\(\(\) => void probeGateway\(\), PROBE_WARM_MS\)/);
    assert.match(ROOT, /if \(!resolved\) return;/);
  });
});
