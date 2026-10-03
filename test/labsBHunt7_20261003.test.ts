/**
 * LABS B — hunt 7 (2026-10-03). Receipts.
 *
 * 1. Visual Audio Analysis Lab, Module 11 (Signal Detective): a solve made
 *    while the solved-question store could NOT BE READ was neither written
 *    (right: an unread copy is never written over) nor said — the bezel's
 *    SOLVED count went up and the solve was gone next launch. The hunt-6
 *    drum/mastering rule: a change dropped because the READ failed raises
 *    the shared failed-save notice.
 * 2. Cymatics modules 2 (Nodes) and Harmonics: useDriveTone's start error
 *    (AUDIO_UNAVAILABLE_MESSAGE) was never rendered, and the Harmonics card
 *    read "Playing 220 Hz — …" after a declined gate, a failed start or
 *    ■ STOP — over silence. "Playing" now shows only while the tone runs,
 *    and the error is said.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

function body(src: string, head: string): string {
  const at = src.indexOf(head);
  assert.ok(at >= 0, `found ${head}`);
  let depth = 0;
  const open = src.indexOf('{', at);
  for (let i = open; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}' && --depth === 0) return src.slice(open, i + 1);
  }
  throw new Error('unbalanced');
}

test('Signal Detective: a solve dropped on an unreadable store is SAID', () => {
  const s = read('src/screens/lab/meter/modules/modMeterC.tsx');
  const fn = body(s, 'function persistSolved(');
  // The wipe fence still lands nowhere, silently.
  assert.match(fn, /if \(gen !== solvedGen\) return;/);
  // The unreadable branch reports before it returns.
  assert.match(fn, /if \(!stored\) \{\s*reportUnhandledSaveFailure\(\);\s*return;\s*\}/);
  // …and is no longer folded into the silent wipe return.
  assert.doesNotMatch(fn, /if \(!stored \|\| gen !== solvedGen\) return;/);
});

test('Cymatics Harmonics: "Playing" only while the tone runs; a failed start is said', () => {
  const s = read('src/screens/lab/cymatics/modules/modHarmonics.tsx');
  assert.doesNotMatch(s, /`Playing \$\{formatHz\(hz\)\}/, 'no unconditional "Playing"');
  assert.match(s, /\$\{tone\.running \? 'Playing ' : ''\}\$\{formatHz\(hz\)\}/);
  assert.match(s, /\{tone\.error \? <Text style=\{styles\.err\}>\{tone\.error\}<\/Text> : null\}/);
});

test('Cymatics Nodes: a failed PLAY start is said', () => {
  const s = read('src/screens/lab/cymatics/modules/modNodes.tsx');
  assert.match(s, /\{tone\.error \? <Text[^>]*>\{tone\.error\}<\/Text> : null\}/);
});
