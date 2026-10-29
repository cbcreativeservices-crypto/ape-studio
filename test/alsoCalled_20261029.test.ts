/**
 * "Also called" (owner decision 2026-10-29; Comp A spec
 * COMP_A_TO_CCODE_ALSO_CALLED_SPEC_2026-10-29). Pins, against the spec's
 * fixture — 'Band-reject filter' with also_called = ['Band-stop filter',
 * 'Band-reject equalizer']:
 *  1. the display line, and its absence when there are no other names;
 *  2. search finds the card by term OR other name, the term winning a tie,
 *     with "matches: <name>" only when the other name made the hit;
 *  3. cross-link resolution by term OR other name, case-insensitive, "(tag)"
 *     stripped, a term match always beating an other-name match;
 *  4. the offline cache carries the names and reads an old cache as [].
 * Receipt: fails on HEAD (no alsoCalled module, no also_called anywhere).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import ts from 'typescript';
import {
  NO_NAMES,
  aliasLookupVariants,
  aliasMatchLabel,
  alsoCalledList,
  arrayLiteralItem,
  deckNameIndex,
  formatAlsoCalled,
  indexAliases,
  lookupPhrase,
  lowerNames,
  matchTermOrAlias,
  normPhrase,
  pickAliasRow,
  resolveLinkName,
  stripTag,
  type NameIndex,
} from '../src/features/glossary/alsoCalled.ts';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const SCREEN = read('src/screens/glossary/GlossaryScreen.tsx');
const CARDS = read('src/screens/study/FlashcardsScreen.tsx');
const POPUP = read('src/features/glossary/GlossaryTermPopup.tsx');
const FETCH = read('src/features/glossary/corpusFetch.ts');
const NATIVE = read('src/features/glossary/offlineCorpus.native.ts');
const WEB = read('src/features/glossary/offlineCorpus.ts');
const STUDY = read('src/features/study/api.ts');

const between = (src: string, a: string, b: string) => {
  const i = src.indexOf(a);
  assert.ok(i >= 0, `marker not found: ${a}`);
  const j = src.indexOf(b, i + a.length);
  assert.ok(j >= 0, `end marker not found: ${b}`);
  return src.slice(i, j);
};
const js = (code: string) => ts.transpileModule(code, { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText;

const K = { id: 'k', term: 'Band-reject filter', also_called: ['Band-stop filter', 'Band-reject equalizer'] };
const OTHER = { id: 'eq', term: 'Equalizer (EQ)', also_called: [] as string[] };

/** The Glossary's real searchRank, lifted from the screen (as perfGlossary does). */
const searchRank = new Function(`${js(between(SCREEN, 'const SUBSTRING_MIN_LEN', '/** Everyday English words'))}; return searchRank;`)() as (
  t: string,
  q: string,
) => number;

/** The Glossary's real buildTermIndex, with the helpers it imports. */
const buildTermIndex = new Function(
  'normPhrase',
  'stripTag',
  'indexAliases',
  `${js(between(SCREEN, 'function buildTermIndex(', '\ntype LinkSeg'))}; return buildTermIndex;`,
)(normPhrase, stripTag, indexAliases) as (entries: { id: string; term: string; also_called?: readonly string[] }[]) => NameIndex & {
  caseExact: Set<string>;
  maxWords: number;
};

describe('1. the display line', () => {
  it('reads "Also called: A, B" in the stored order', () => {
    assert.equal(formatAlsoCalled(K.also_called), 'Also called: Band-stop filter, Band-reject equalizer');
  });

  it('is absent (null → nothing drawn) when there are no other names', () => {
    for (const none of [[], null, undefined, ['', '  ']]) assert.equal(formatAlsoCalled(none as never), null);
  });

  it('every display site draws it only through formatAlsoCalled', () => {
    // Glossary: expanded row + card popup. Flashcards: solo view, card back,
    // study sheet, full-screen section, linked-term viewer. Term popup: one.
    const sites = (src: string) => (src.match(/>\{formatAlsoCalled\(/g) ?? []).length;
    assert.equal(sites(SCREEN), 2);
    // Flashcards: only the linked-term viewer draws it openly; cards go
    // through AlsoCalledReveal (pinned below).
    assert.equal(sites(CARDS), 1);
    assert.equal(sites(POPUP), 1);
    assert.match(SCREEN, /\{expanded && formatAlsoCalled\(item\.also_called\) \? \(/);
    const back = between(CARDS, '<Text style={styles.levelEyebrow}>{LEVEL_LABELS[level - 1]}</Text>', '<DefinitionScroll');
    assert.match(back, /<AlsoCalledReveal key=\{`ac-\$\{card\.id\}`\} names=\{card\.also_called\}/);
  });

  it('a card being studied hides its other names behind a tap (owner 2026-10-29)', () => {
    // Shown openly they hint at the answer; the glossary keeps them visible.
    assert.equal((CARDS.match(/<AlsoCalledReveal key=\{`ac-\$\{card\.id\}`\}/g) ?? []).length, 4);
    assert.doesNotMatch(CARDS, /\{formatAlsoCalled\(card\.also_called\) \?/);
    const comp = between(CARDS, 'function AlsoCalledReveal(', '\n}\n');
    assert.match(comp, /useState\(false\)/);
    assert.match(comp, /ALSO CALLED · TAP TO SHOW/);
  });

  it('is never smaller than 14 pt', () => {
    for (const [src, name] of [[SCREEN, 'alsoCalled'], [CARDS, 'alsoCalled'], [CARDS, 'fsAlsoCalled'], [POPUP, 'alsoCalled']] as const) {
      const style = between(src, `\n  ${name}: {`, '}');
      assert.ok(Number(/fontSize: (\d+)/.exec(style)![1]) >= 14, `${name} below 14 pt`);
    }
  });
});

describe('2. search: term OR other name', () => {
  const find = (q: string, card = K) =>
    matchTermOrAlias(searchRank(card.term.toLowerCase(), q), card.also_called, lowerNames(card.also_called), q, searchRank);

  it('a query only an other name matches finds the card, with "matches: <name>"', () => {
    assert.deepEqual(find('band-stop'), { rank: 1, alias: 'Band-stop filter' });
    assert.deepEqual(find('band-stop filter'), { rank: 0, alias: 'Band-stop filter' });
    assert.deepEqual(find('equalizer'), { rank: 2, alias: 'Band-reject equalizer' });
    assert.equal(aliasMatchLabel('Band-stop filter'), 'matches: Band-stop filter');
  });

  it('the real term wins a tie — no subtitle', () => {
    // "band-reject" starts the term AND "Band-reject equalizer": the term is the hit.
    assert.deepEqual(find('band-reject'), { rank: 1, alias: null });
    assert.deepEqual(find('band-reject filter'), { rank: 0, alias: null });
  });

  it('no match stays no match; a card with no other names is the old rank', () => {
    assert.deepEqual(find('notch'), { rank: 99, alias: null });
    assert.deepEqual(matchTermOrAlias(searchRank('equalizer (eq)', 'eq'), undefined, undefined, 'eq', searchRank), {
      rank: 1,
      alias: null,
    });
  });

  it('the screen ranks and labels with it, from the names lowered once at load', () => {
    assert.match(
      SCREEN,
      /r: matchTermOrAlias\(searchRank\(e\.termLower \?\? e\.term\.toLowerCase\(\), q\), e\.also_called, e\.aliasesLower, q, searchRank\)\.rank/,
    );
    assert.match(SCREEN, /aliasHitById\.has\(item\.id\) \? \(\s*<Text style=\{styles\.alsoCalled\}>\{highlightNodes\(aliasMatchLabel\(aliasHitById\.get\(item\.id\)!\), hq\)\}/);
    const load = between(SCREEN, 'function loadAllEntries(', 'type ShareDefinitionUnreadable');
    assert.equal((load.match(/aliasesLower: lowerNames\(r\.also_called\),/g) ?? []).length, 2);
  });
});

describe('3. cross-links: term OR other name', () => {
  const index = buildTermIndex([K, OTHER]);

  it('a related term naming an other name opens the card, any case, "(tag)" stripped', () => {
    for (const name of ['Band-stop filter', 'band-stop filter', 'BAND-REJECT EQUALIZER', 'Band-stop filter (EQ)', 'Band-reject equalizer (audio)']) {
      assert.deepEqual(resolveLinkName(name, index), ['k'], name);
    }
    assert.deepEqual(resolveLinkName('Band-reject filter', index), ['k']);
    assert.deepEqual(resolveLinkName('Equalizer', index), ['eq']); // base name of "Equalizer (EQ)"
    assert.deepEqual(resolveLinkName('Notch filter', index), []);
  });

  it('in prose, a phrase that is an other name links to the card', () => {
    assert.deepEqual(lookupPhrase('band-stop filter', index), ['k']);
    assert.equal(index.maxWords >= 2, true);
  });

  it('a TERM match always beats an other-name match', () => {
    const rival = { id: 'r', term: 'Band-stop filter', also_called: [] as string[] };
    const both = buildTermIndex([K, rival]);
    assert.deepEqual(resolveLinkName('band-stop filter', both), ['r']);
    assert.deepEqual(lookupPhrase('band-stop filter', both), ['r']);
    // …even when only the tag-stripped name is a term.
    assert.deepEqual(resolveLinkName('Band-stop filter (EQ)', both), ['r']);
  });

  it('the Glossary resolves related terms and in-definition links through it', () => {
    assert.match(between(SCREEN, 'function linkIdsFor(', '\n}\n'), /resolveLinkName\(term, index\)\.filter\(\(id\) => id !== selfId\)/);
    assert.match(between(SCREEN, 'function linkSegments(', '\n}\n'), /const idsRaw = lookupPhrase\(phrase, index\);/);
  });

  it('Flashcards in-deck links: other names link, a term keeps its own card', () => {
    const rival = { id: 'r', term: 'Band-stop filter', also_called: [] as string[] };
    assert.equal(deckNameIndex([K]).get('band-stop filter'), K);
    assert.equal(deckNameIndex([K]).get('band-reject equalizer'), K);
    assert.equal(deckNameIndex([K, rival]).get('band-stop filter'), rival);
    assert.equal(deckNameIndex([rival, K]).get('band-stop filter'), rival);
    assert.match(CARDS, /const termIndex = useMemo\(\(\) => deckNameIndex\(items \?\? \[\]\), \[items\]\);/);
  });

  it('the by-name popup falls back to the other names only when no term matched', () => {
    assert.ok(aliasLookupVariants('band-stop filter').includes('Band-stop filter'));
    assert.ok(aliasLookupVariants('BAND-STOP FILTER (eq)').includes('Band-stop filter'));
    assert.equal(arrayLiteralItem('a "b", c'), '"a \\"b\\", c"');
    const rows = [{ id: 'x', also_called: ['Other'] }, { id: 'k', also_called: K.also_called }];
    assert.equal(pickAliasRow(rows, 'BAND-STOP FILTER')?.id, 'k');
    assert.equal(pickAliasRow(rows, 'band-stop filter (tag)')?.id, 'k');
    assert.equal(pickAliasRow(rows, 'notch'), undefined);
    const lookup = between(POPUP, ".ilike('term', termName)", "'glossary term lookup timeout'");
    assert.match(lookup, /if \(r\.error \|\| \(r\.data && r\.data\.length\)\) return[^\n]*\n[^\n]*\n\s*return lookupByOtherName\(corpusTable\(probe\), termName\);/);
    const helper = between(POPUP, 'async function lookupByOtherName(', '\n}\n');
    assert.match(helper, /\.overlaps\('also_called', aliasLookupVariants\(termName\)\.map\(arrayLiteralItem\)\)/);
    assert.match(helper, /const hit = pickAliasRow\(/);
  });
});

describe('4. the offline cache carries the names; an old cache reads as none', () => {
  it('missing, NULL, non-array or broken JSON → []', () => {
    for (const old of [undefined, null, 42, {}, 'not json', '{"a":1}']) assert.equal(alsoCalledList(old), NO_NAMES);
    assert.deepEqual(alsoCalledList(JSON.stringify(K.also_called)), K.also_called);
    assert.deepEqual(alsoCalledList(['  Band-stop filter ', 3, '', null]), ['Band-stop filter']);
  });

  it('the corpus read selects it and every store keeps it', () => {
    assert.match(FETCH, /\.select\('id, term, achievement_id, also_called'\)/);
    assert.match(FETCH, /also_called: alsoCalledList\(r\.also_called\)/);
    // Native: an existing install gains the column; rows from before read [].
    assert.match(NATIVE, /PRAGMA table_info\(glossary_corpus\)/);
    assert.match(NATIVE, /if \(!cols\.some\(\(c\) => c\.name === 'also_called'\)\) h\.execSync\('ALTER TABLE glossary_corpus ADD COLUMN also_called TEXT;'\);/);
    assert.match(NATIVE, /SELECT id, term, achievement_id, also_called FROM glossary_corpus/);
    assert.match(NATIVE, /also_called: alsoCalledList\(r\.also_called\)/);
    assert.match(NATIVE, /also_called = excluded\.also_called,/);
    // Five values a row must stay under SQLite's 999-variable ceiling.
    const rows = Number(/const ROWS_PER_INSERT = (\d+);/.exec(NATIVE)![1]);
    assert.equal((/batch\.map\(\(\) => '(\([^']*\))'\)/.exec(NATIVE)![1].match(/\?/g) ?? []).length, 5);
    assert.ok(rows * 5 <= 999);
    assert.match(WEB, /also_called: Array\.isArray\(also_called\) \? also_called : \[\]/);
  });

  it('the study reads (flashcards, linked terms) select it on all three paths', () => {
    assert.equal((STUDY.match(/common_mistakes, also_called'/g) ?? []).length, 3);
    assert.equal((STUDY.match(/also_called: alsoCalledList\(g\.also_called\),/g) ?? []).length, 3);
  });
});
