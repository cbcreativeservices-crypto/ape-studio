/**
 * ChannelBadge initials: combining marks stay with their letter, and a letter
 * outside the BMP is never cut in half. Before the fix a mark inside a word
 * became a space, so decomposed "Zöe" gave ZE, and a single-word astral name
 * showed half a surrogate pair. The '·' empty result stays.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import ts from 'typescript';

const SRC = readFileSync('src/screens/directory/ChannelBadge.tsx', 'utf8').replace(/\r\n/g, '\n');
const a = SRC.indexOf('export function initialsOf(');
const b = SRC.indexOf('export function ChannelBadge(');
assert.ok(a >= 0 && b > a, 'initialsOf not found');
const js = ts.transpileModule(SRC.slice(a, b).replace('export ', ''), {
  compilerOptions: { target: ts.ScriptTarget.ES2022 },
}).outputText;
const initialsOf = new Function(`${js}; return initialsOf;`)() as (name: string) => string;

const hasLoneSurrogate = (s: string) => /[\uD800-\uDFFF]/u.test(s);

describe('initialsOf', () => {
  it('keeps the plain behaviour', () => {
    assert.equal(initialsOf('Harbor Sound Co.'), 'HS');
    assert.equal(initialsOf('zoe'), 'ZO');
    assert.equal(initialsOf('Q'), 'Q');
  });

  it('reads a decomposed name the same as a composed one', () => {
    assert.equal(initialsOf('Zoë'), 'ZO');
    assert.equal(initialsOf('Zoë'), 'ZO');
    assert.equal(initialsOf('Zoë Müller'), 'ZM');
    assert.equal(initialsOf('Zöe').normalize('NFC'), initialsOf('Zöe'));
    assert.equal(initialsOf('Zöe').normalize('NFC'), 'ZÖ');
  });

  it('keeps a mark on its own letter in Devanagari, Thai and Arabic', () => {
    assert.equal(initialsOf('कृष्ण'), 'कृष्');
    assert.equal(initialsOf('กิตติ'), 'กิต');
    assert.equal(initialsOf('مُحمد'), 'مُح');
  });

  it('keeps at most three marks on a letter, so a piled-up name stays in the tile', () => {
    assert.equal(initialsOf('Z' + '̈'.repeat(40)), 'Z' + '̈'.repeat(3));
    assert.equal(initialsOf('Z' + '̈'.repeat(40) + 'o'), 'Z' + '̈'.repeat(3) + 'O');
  });

  it('never splits a letter outside the BMP', () => {
    const deseret = '\u{10400}\u{10401}';
    const out = initialsOf(deseret);
    assert.equal(hasLoneSurrogate(out), false);
    assert.equal(out, deseret);
    assert.equal(initialsOf('\u{20BB7}a'), '\u{20BB7}A');
    assert.equal(initialsOf('\u{20BB7} Bo'), '\u{20BB7}B');
  });

  it('keeps the dot when nothing usable is left, and never shows a lone mark', () => {
    assert.equal(initialsOf(''), '·');
    assert.equal(initialsOf('   '), '·');
    assert.equal(initialsOf('--!!'), '·');
    assert.equal(initialsOf('̈'), '·');
    assert.equal(initialsOf('̈ Bo'), 'BO');
  });
});
