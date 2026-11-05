/**
 * Flashcard definitions linked the plain words "and" / "or" because the deck
 * holds the logic-gate terms AND and OR and the link regex folds case. An
 * all-capitals or one/two-character name now links only as the card spells it.
 *
 * The screen cannot load in node, so the test runs the screen's own helper and
 * its own loop guard, lifted from the source.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import ts from 'typescript';

import { deckNameIndex } from '../src/features/glossary/alsoCalled.ts';

type Item = { id: string; term: string; also_called?: string[] };

const SRC = readFileSync(new URL('../src/screens/study/FlashcardsScreen.tsx', import.meta.url), 'utf8').replace(/\r\n/g, '\n');

const between = (from: string, to: string) => {
  const a = SRC.indexOf(from);
  assert.ok(a >= 0, `missing: ${from}`);
  const b = SRC.indexOf(to, a);
  assert.ok(b > a, `missing: ${to}`);
  return SRC.slice(a, b);
};

const helperJs = ts.transpileModule(between('function exactCaseNames(', '\ntype Difficulty'), {
  compilerOptions: { target: ts.ScriptTarget.ES2022 },
}).outputText;
const exactCaseNames = new Function(`${helperJs}; return exactCaseNames;`)() as (items: Item[]) => Map<string, Set<string>>;

// The regex and the guard exactly as the screen has them.
const regexBody = between('const names = [...termIndex.keys()]', '}, [termIndex]);');
const guard = between('const spellings = exactNames.get(', 'const hit = termIndex.get(');
const regexFor = new Function('termIndex', ts.transpileModule(regexBody, {}).outputText) as (i: Map<string, Item>) => RegExp;
const shouldSkip = new Function(
  'exactNames',
  'linkRegex',
  'm',
  `for (let once = true; once; once = false) { ${guard} return false; } return true;`,
) as (e: Map<string, Set<string>>, r: RegExp, m: RegExpExecArray) => boolean;

/** What the screen's renderLinked loop links in `text`: [matched text, card id]. */
function linked(items: Item[], text: string, currentId = ''): [string, string][] {
  const termIndex = deckNameIndex(items);
  const exactNames = exactCaseNames(items);
  const linkRegex = regexFor(termIndex);
  const out: [string, string][] = [];
  let m: RegExpExecArray | null;
  while ((m = linkRegex.exec(text))) {
    if (shouldSkip(exactNames, linkRegex, m)) continue;
    const hit = termIndex.get(m[1].toLowerCase());
    if (!hit || hit.id === currentId) continue;
    out.push([m[0], hit.id]);
  }
  return out;
}

const AND = { id: 'and', term: 'AND' };
const OR = { id: 'or', term: 'OR' };
const GATE = { id: 'gate', term: 'Logic gate' };
const BUS = { id: 'bus', term: 'Bus' };

describe('flashcard in-definition links and case', () => {
  it('everyday "and" / "or" do not link; the capitalised terms still do', () => {
    assert.deepEqual(linked([AND, OR, BUS], 'Left and right or both, And then Or more.'), []);
    assert.deepEqual(linked([AND, OR], 'An AND output feeds an OR input.'), [
      ['AND', 'and'],
      ['OR', 'or'],
    ]);
  });

  it('an ordinary term still links in any case', () => {
    assert.deepEqual(linked([BUS, AND], 'Send to the bus, the BUS and the Bus.'), [
      ['bus', 'bus'],
      ['BUS', 'bus'],
      ['Bus', 'bus'],
    ]);
  });

  it('a one/two-character name links only as spelled', () => {
    const hz = { id: 'hz', term: 'Hz' };
    const go = { id: 'go', term: 'Go' };
    assert.deepEqual(linked([hz, go], 'At 60 Hz, 60 hz or 60 HZ we go.'), [['Hz', 'hz']]);
  });

  it('an all-capitals other name follows the same rule', () => {
    const k = { id: 'k', term: 'Protocol', also_called: ['HOW'] };
    assert.deepEqual(linked([k], 'This is how, and HOW.'), [['HOW', 'k']]);
  });

  it('a name with an ordinary spelling too keeps linking in any case', () => {
    const k = { id: 'p', term: 'Pan', also_called: ['PAN'] };
    assert.deepEqual(linked([k], 'Pan it, pan it, PAN it.'), [
      ['Pan', 'p'],
      ['pan', 'p'],
      ['PAN', 'p'],
    ]);
  });

  it('longest name wins, and a refused long name leaves the shorter one', () => {
    const wide = { id: 'gate-caps', term: 'AND GATE' };
    const gate = { id: 'g', term: 'Gate' };
    assert.deepEqual(linked([AND, GATE], 'A Logic gate and an AND.'), [
      ['Logic gate', 'gate'],
      ['AND', 'and'],
    ]);
    assert.deepEqual(linked([wide, gate], 'The AND GATE, and gate.'), [
      ['AND GATE', 'gate-caps'],
      ['gate', 'g'],
    ]);
  });

  it('a term keeps its own card plain', () => {
    assert.deepEqual(linked([AND, OR], 'AND beside OR.', 'and'), [['OR', 'or']]);
  });

  it('the render loop uses the guard before the card lookup', () => {
    assert.match(SRC, /const exactNames = useMemo\(\(\) => exactCaseNames\(items \?\? \[\]\), \[items\]\);/);
    assert.match(SRC, /\[linkRegex, termIndex, exactNames, navigation, showLinks\],/);
  });
});
