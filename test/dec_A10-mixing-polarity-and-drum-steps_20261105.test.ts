/**
 * Function audit decisions 6 A and 7 A (owner, 2026-11-05).
 *
 * 6. The Mixing polarity button changed nothing a learner could see: the mix
 *    map never read `polarity`. A flipped track now carries a mark on the map,
 *    and the console says in one line why so little changes in this session.
 * 7. Drum Tuning, Prepare, "Start from a known condition": the drawing stood
 *    still through all 8 steps. It now shows the rods turned and the current
 *    rod, walking the star in the order the page's words give.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import ts from 'typescript';

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
/** Source with comments stripped: a name in a comment proves nothing. */
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

const BEG_ART = code('src/screens/lab/mixing/begArt.tsx');
const KIT = code('src/screens/lab/mixing/kit.tsx');
const GUIDES = code('src/screens/lab/mixing/beginningMixingScreenGuides.ts');
const PREP = code('src/screens/lab/drumtuning/modules/ch2Prepare.tsx');
const STAGE = code('src/screens/lab/drumtuning/stagesDrum.tsx');

/** The engine's own table, read from source (the engine needs a resolver hook to import). */
const STAR_ORDER = { 8: JSON.parse(code('src/screens/lab/drumtuning/drumEngine.ts').match(/\b8: (\[[0-9, ]+\])/)![1]) };

const mapArt = BEG_ART.slice(BEG_ART.indexOf('export function MixMapArt'), BEG_ART.indexOf('export function PrepArt'));

describe('decision 6: the polarity button shows on the mix map', () => {
  it('the map reads polarity from the settings it already carries', () => {
    assert.match(mapArt, /s\.polarity/);
  });
  it('a flipped track gets a mark on the stage, a legend mark and a key', () => {
    assert.match(mapArt, /flipped/);
    assert.ok((mapArt.match(/Ø/g) ?? []).length >= 3, 'mark, legend and key each print Ø');
    assert.match(mapArt, /POLARITY FLIPPED/);
  });
  it('the map says so to a screen reader too', () => {
    assert.match(mapArt, /polarity flipped/);
  });
  it('the console adds one line, only while a track is flipped, on a console that has Ø', () => {
    assert.match(KIT, /show\.pol && tracks\.some\(\(id\) => value\[id\]\?\.polarity\)/);
    assert.match(KIT, /separate parts, not two mics on one source, so no pair really cancels/);
  });
  it('the line reports what the render does, and claims no listening', () => {
    const line = KIT.match(/POLARITY_NOTE = '([^']+)'/)?.[1] ?? '';
    assert.ok(line.length > 0);
    assert.doesNotMatch(line, /\b(hear|heard|listen|sounds)\b/i);
  });
  it('adds no new audio', () => {
    assert.doesNotMatch(mapArt, /renderMix|usePlayback/);
  });
  it('the screen guide tells the same story', () => {
    assert.match(GUIDES, /Ø = polarity flipped/);
  });
});

describe('decision 7: the known-condition drawing shows the rods', () => {
  const src = PREP.slice(PREP.indexOf('function randomRun'), PREP.indexOf('export function knownSequence'));
  const js = ts.transpileModule(src.replace('export function', 'function'), { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText;
  const knownMoves = (src
    ? new Function('STAR_ORDER', `${js}; return knownMoves;`)(STAR_ORDER)
    : () => {
        throw new Error('knownMoves is missing');
      }) as (a: 'even' | 'random', step: number, lugs: 6 | 8 | 10) => { lug: number; turn: number }[];

  it('finger-tight: no rod has moved', () => {
    assert.deepEqual(knownMoves('even', 0, 8), []);
    assert.deepEqual(knownMoves('random', 0, 8), []);
  });
  it('EVEN: a round turns every rod a quarter turn, in the order the words give', () => {
    const words = '1 → 5 → 3 → 7 → 2 → 6 → 4 → 8'.split(' → ').map(Number);
    for (const step of [1, 4, 8]) {
      const moves = knownMoves('even', step, 8);
      assert.deepEqual(moves.map((m) => m.lug + 1), words);
      assert.ok(moves.every((m) => m.turn === 0.25));
    }
  });
  it('the page prints that same order', () => {
    assert.match(PREP, /Rod 1, 5, 3, 7, 2, 6, 4, 8/);
  });
  it('RANDOM: one big turn per step, on rods that differ', () => {
    const eight = knownMoves('random', 8, 8);
    assert.equal(eight.length, 8);
    assert.deepEqual(knownMoves('random', 3, 8), eight.slice(0, 3));
    assert.ok(eight.every((m) => m.turn >= 0.5 - 1e-9 && m.turn < 1.5 + 1e-9));
    assert.ok(new Set(eight.map((m) => m.lug)).size > 1);
  });
  it('the head the sound uses is built from those same moves', () => {
    const seq = PREP.slice(PREP.indexOf('export function knownSequence'), PREP.indexOf('const WALK_MS'));
    assert.match(seq, /randomRun\(step, lugs\)\.turns/);
    assert.doesNotMatch(seq, /rnd\(\)/);
  });
  it('the stage draws the moves, the key on the current rod, and how far each rod has turned', () => {
    const stage = PREP.slice(PREP.indexOf('function KnownStage'), PREP.indexOf('type InspectPoint'));
    assert.match(stage, /order=\{shown\.map/);
    assert.match(stage, /selected=\{current\}/);
    assert.match(stage, /rodTurns=\{rodTurns\}/);
    assert.match(PREP, /<KnownStage /);
    assert.match(STAGE, /rodTurns\?\.map/);
  });
  it('the walk is a lesson display the learner started, so it reads no motion gate', () => {
    assert.doesNotMatch(PREP, /useDecorativeMotion/);
  });
  it('adds no N-of-total progress text', () => {
    const stage = PREP.slice(PREP.indexOf('function KnownStage'), PREP.indexOf('type InspectPoint'));
    assert.ok(stage.length > 0);
    assert.doesNotMatch(stage, /\/ 8|of 8/);
  });
});
