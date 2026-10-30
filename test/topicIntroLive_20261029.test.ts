/**
 * Owner 2026-10-29: the Explore topic card shows the LIVE topic intro from
 * `achievements.description` (Comp A's knowledge-not-skills rewrite), with the
 * app's own one-liner (topicCopy.ts) as the fallback when the read fails.
 * The intro is fetched for the open topic only, never on the shared catalog load.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p: string) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
const MODAL = read('src/screens/curriculum/TopicDetailModal.tsx');

test('the card reads achievements.description for the open topic, one row', () => {
  assert.match(MODAL, /\.from\('achievements'\)\s*\.select\('description'\)/);
  assert.match(MODAL, /\.eq\('global_sequence', gs\)/);
  assert.match(MODAL, /\.maybeSingle\(\)/);
  assert.match(MODAL, /const intro = useTopicIntro\(topic\?\.gs \?\? null\);/);
});

test('a failed read is not cached and the one-liner stays as the fallback', () => {
  assert.match(MODAL, /if \(error\) return;/);
  assert.match(MODAL, /\) : t\.description \? \(\n\s+<Text style=\{styles\.desc\}>\{t\.description\}<\/Text>/);
});

test('the shared catalog load does not fetch descriptions', () => {
  const cur = read('src/data/v3Curriculum.ts');
  assert.doesNotMatch(cur, /select\([^)]*description/);
});

test('headline and paragraph split on the blank line', async () => {
  const { splitTopicIntro } = await import('../src/screens/curriculum/TopicDetailModal.tsx').catch(() => ({ splitTopicIntro: null as never }));
  // The modal imports React Native, which node cannot load; check the splitter's source instead.
  if (!splitTopicIntro) {
    assert.match(MODAL, /text\.split\(\/\\n\\s\*\\n\/\)/);
    assert.match(MODAL, /return \{ head: parts\[0\], body: parts\.slice\(1\)\.join\('\\n\\n'\) \};/);
    return;
  }
  assert.deepEqual(splitTopicIntro('Head\r\n\r\nBody text.'), { head: 'Head', body: 'Body text.' });
});
