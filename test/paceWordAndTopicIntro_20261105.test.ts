/**
 * Overnight fixes 2026-11-05.
 * (a) The pace status word was clipped to "ON …" at 375 wide: it was the only
 *     thing in the header row allowed to shrink, against a fixed control row.
 * (b) The topic card held its database intro in state, so the first render after
 *     stepping paired the new topic's name and image with the old headline.
 * React Native does not load under node, so these read the source.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p: string) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
const PACE = read('src/features/study/PaceReadout.tsx');
const MODAL = read('src/screens/curriculum/TopicDetailModal.tsx');

const styleOf = (name: string) => {
  const start = PACE.indexOf(`
  ${name}: {`);
  assert.ok(start >= 0, `style ${name} not found`);
  return PACE.slice(start, PACE.indexOf('}', start));
};

test('the pace status word never shrinks; the control row gives way instead', () => {
  const word = styleOf('statusWord');
  assert.match(word, /flexShrink: 0/);
  assert.doesNotMatch(word, /\bflex: 1\b/);
  assert.match(styleOf('controls'), /flexShrink: 1/);
  assert.match(styleOf('iconBtn'), /flexShrink: 1/);
  assert.match(styleOf('iconBtn'), /minWidth: \d+/);
});

test('the topic intro is derived for the current gs during render, never held across a step', () => {
  const hook = MODAL.match(/function useTopicIntro[\s\S]*?\n}\n/)?.[0] ?? '';
  assert.ok(hook, 'useTopicIntro not found');
  assert.match(hook, /return gs != null \? introCache\.get\(gs\) \?\? null : null;\n}/);
  assert.doesNotMatch(hook, /useState<TopicIntro/);
  assert.doesNotMatch(hook, /setIntro/);
});

test('offline stays as it was: a failed read caches nothing, so the next open retries', () => {
  const hook = MODAL.match(/function useTopicIntro[\s\S]*?\n}\n/)?.[0] ?? '';
  assert.match(hook, /if \(gs == null \|\| introCache\.has\(gs\)\) return;/);
  assert.match(hook, /if \(error\) return;/);
  assert.equal(hook.match(/introCache\.set\(/g)?.length, 1);
  assert.match(hook, /catch \{/);
});
