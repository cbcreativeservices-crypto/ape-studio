/**
 * MY CUSTOM LIST — the empty face of the study screens names the list, not a
 * topic. Matching, Fill-in-the-Blank and Flashcards all load the ★ list through
 * the same path, so an empty list reaches each one's "no items" branch.
 * A failed read is separate (it rejects into setError) and is not touched here.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (name: string) =>
  readFileSync(new URL(`../src/screens/study/${name}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

for (const [file, flag, listCopy, topicCopy] of [
  ['MatchingScreen.tsx', 'customMode', 'None of the terms in My Custom List have matching items yet.', 'This topic has no matching items yet.'],
  ['FillInBlankScreen.tsx', 'customMode', 'None of the terms in My Custom List have fill-in-the-blank items yet.', 'This topic has no fill-in-the-blank items yet.'],
  ['FlashcardsScreen.tsx', 'flaggedMode', 'My Custom List has no terms yet.', 'This topic has no flashcards yet.'],
] as const) {
  test(`${file}: the empty face branches on the custom list`, () => {
    const src = read(file);
    const list = src.indexOf(listCopy);
    const topic = src.indexOf(`'${topicCopy}'`);
    assert.ok(list > 0, 'the list wording is present');
    assert.ok(topic > list, 'the topic wording is the else arm, as a string');
    const before = src.slice(src.lastIndexOf('<Text', list), list);
    assert.match(before, new RegExp(`\\{${flag}\\s*\\?`), 'the list wording is chosen by the mode flag');
    assert.ok(!src.includes(`>${topicCopy}<`), 'no unconditional topic wording');
  });
}
