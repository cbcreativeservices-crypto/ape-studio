/**
 * Saved / preloaded lab clips (owner 2026-09-29: "Yes save each clip … load
 * in audio clip starts … if it isn't too heavy on memory"). Pure tests for
 * the byte-bounded LRU and the Tuning lab's memoised renderers, plus source
 * guards for the players that use them.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ByteLru } from '../src/features/audio/clipLru.ts';
import {
  __clearRenderCacheForTests,
  clipKeyOf,
  concatWithGap,
  renderCacheStats,
  renderNotes,
  renderPartials,
  renderSequence,
  RENDER_CACHE_BYTES,
  RENDER_CACHE_MAX,
  wavBytes,
} from '../src/features/tuning/tuningClipCache.ts';
import { renderNotes as rawNotes, concatWithGap as rawConcat } from '../src/features/tuning/tuningRender.ts';

// ── ByteLru ──────────────────────────────────────────────────────────────────

test('ByteLru evicts least-recently USED first, by count', () => {
  const out: string[] = [];
  const c = new ByteLru<number>(1e9, 2, (k) => out.push(k));
  c.set('a', 1, 1);
  c.set('b', 2, 1);
  c.get('a'); // a is now most recent
  c.set('c', 3, 1);
  assert.deepEqual(out, ['b']);
  assert.deepEqual(c.keys(), ['a', 'c']);
});

test('ByteLru evicts by bytes, and tracks the total', () => {
  const out: string[] = [];
  const c = new ByteLru<number>(100, 99, (k) => out.push(k));
  c.set('a', 1, 60);
  c.set('b', 2, 30);
  assert.equal(c.bytes, 90);
  c.set('c', 3, 50); // 140 > 100 → drop a
  assert.deepEqual(out, ['a']);
  assert.equal(c.bytes, 80);
});

test('ByteLru never evicts a pinned entry (the clip that is playing)', () => {
  const out: string[] = [];
  const c = new ByteLru<string>(1e9, 1, (k) => out.push(k), (k) => k === 'playing');
  c.set('playing', 'p', 1);
  c.set('next', 'n', 1);
  assert.deepEqual(out, []); // over budget until unpinned — never the one sounding
  assert.equal(c.size, 2);
  c.set('third', 't', 1);
  assert.deepEqual(out, ['next']);
});

test('ByteLru replacing a key releases the old value; clear releases all', () => {
  const out: string[] = [];
  const c = new ByteLru<string>(1e9, 9, (_k, v) => out.push(v));
  c.set('a', 'v1', 5);
  c.set('a', 'v2', 7);
  assert.deepEqual(out, ['v1']);
  assert.equal(c.bytes, 7);
  c.set('a', 'v2', 7); // same object: not released
  assert.deepEqual(out, ['v1']);
  c.set('b', 'v3', 1);
  c.clear();
  assert.deepEqual(out.sort(), ['v1', 'v2', 'v3']);
  assert.equal(c.size, 0);
  assert.equal(c.bytes, 0);
});

test('ByteLru delete releases and adjusts bytes', () => {
  const out: string[] = [];
  const c = new ByteLru<string>(1e9, 9, (k) => out.push(k));
  c.set('a', 'x', 4);
  c.delete('a');
  c.delete('missing');
  assert.deepEqual(out, ['a']);
  assert.equal(c.bytes, 0);
});

// ── Tuning: every clip rendered once ─────────────────────────────────────────

test('a repeat render returns the SAME clip (no second DSP burst), byte-identical to the raw renderer', () => {
  __clearRenderCacheForTests();
  const a = renderNotes([261.63, 392.44], 1.4, 'rich');
  const b = renderNotes([261.63, 392.44], 1.4, 'rich');
  assert.equal(a, b);
  assert.deepEqual(Array.from(a), Array.from(rawNotes([261.63, 392.44], 1.4, 'rich')));
  assert.ok(clipKeyOf(a));
  assert.notEqual(renderNotes([261.63, 392.44], 1.4, 'sine'), a); // timbre is part of the key
  assert.notEqual(renderNotes([261.63, 392.45], 1.4, 'rich'), a); // so is every frequency
});

test('partials, sequences and A→B concats are cached by their arguments too', () => {
  __clearRenderCacheForTests();
  assert.equal(renderPartials([1308, 1308.1], 2), renderPartials([1308, 1308.1], 2));
  assert.equal(renderSequence([261.63, 293.66], 0.3, 'rich'), renderSequence([261.63, 293.66], 0.3, 'rich'));
  const a = renderNotes([261.63], 1, 'rich');
  const b = renderNotes([327.03], 1, 'rich');
  const ab = concatWithGap(a, b);
  assert.equal(concatWithGap(a, b), ab);
  assert.deepEqual(Array.from(ab), Array.from(rawConcat(a, b)));
  // A concat of an uncached buffer is not cached (nothing names it).
  const loose = new Float32Array(10);
  assert.equal(clipKeyOf(concatWithGap(loose, b)), undefined);
});

test('the render cache stays inside its documented budget', () => {
  __clearRenderCacheForTests();
  for (let i = 0; i < RENDER_CACHE_MAX + 10; i++) renderNotes([200 + i], 0.05, 'sine');
  assert.ok(renderCacheStats().count <= RENDER_CACHE_MAX);
  __clearRenderCacheForTests();
  for (let i = 0; i < 12; i++) renderNotes([200 + i], 2.2, 'sine'); // 422 KB each
  assert.ok(renderCacheStats().bytes <= RENDER_CACHE_BYTES);
  assert.equal(wavBytes(new Float32Array(48000)), 44 + 96000);
});

// ── Source guards ────────────────────────────────────────────────────────────

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

test('Tuning: chapters get the memoised renderers; saved clips play from a pooled player; the gate is re-checked', () => {
  const s = read('src/features/tuning/tuningAudio.ts');
  assert.match(s, /export \{ renderNotes, renderPartials, renderSequence, concatWithGap \} from '\.\/tuningClipCache';/);
  const play = s.slice(s.indexOf('async play(buf: Mono'), s.indexOf('async renderAndPlay('));
  assert.ok(play.indexOf('if (!isAudioOutputEnabled()) return;') > play.indexOf('await this.loadClip(key, buf)'));
  assert.ok(play.indexOf('if (!isAudioOutputEnabled()) return;') < play.indexOf('voice.play(0);'));
  // Preload never plays, and only creates files/players once output is on.
  const pre = s.slice(s.indexOf('preload(makes'), s.indexOf('  stop(): void {'));
  assert.doesNotMatch(pre, /\.play\(/);
  assert.match(pre, /isAudioOutputEnabled\(\) && !this\.pool\.has\(key\)/);
  // Close releases every saved clip.
  assert.match(s.slice(s.indexOf('  dispose(): void {')), /this\.pool\.clear\(\);/);
});
