/**
 * GUARDS — community / careers / awards, evening toddler hunt PASS 1 (2026-10-02).
 *
 *  E1  Conversation sheet (RequestsView ThreadSheet): the message list was
 *      `style={{ flex: 1 }}` inside a sheet that has only a maxHeight — the
 *      exact TestFlight-32 PreviewSheet trap (flex-basis 0 → laid out zero
 *      tall). The conversation itself was invisible between the header and the
 *      reply box. Now flexShrink, like PreviewSheet / SpecialtyPicker.
 *  E2  My Profile: an error from an earlier refused publish / switch stayed on
 *      screen above the switch after a later attempt SUCCEEDED. refresh() runs
 *      only after a successful write, and now clears it first.
 *  E3  Trophy Case data: a dropped users-row read (lenient myUserId → null)
 *      took the GUEST branch — every topic locked, "0 / 166", an empty gallery —
 *      as fact, and a failed curriculum read (lenient → []) drew "0 / 0". Both
 *      now throw, so the screens' keep-what-is-shown + error/Retry paths run.
 *  E4  Career family → "Open the curriculum" pushed a SECOND Awards pager over
 *      Awards → CareerFinder → CareerFamily (RN7 navigate never returns to a
 *      route lower in the stack). Now popTo, like goToFinder beside it.
 *  E5  Trophy Case → Topics: the failed-load state told the reader to "retry"
 *      and had nothing to tap (leave and come back was the only way). It now
 *      has the same Retry as Gallery / CredentialWall / the hub.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');
const blank = (s: string) => s.replace(/[^\n]/g, ' ');
const code = (p: string) =>
  read(p)
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/(^|[^:])\/\/[^\n]*/g, (m, pre) => pre + ' '.repeat(m.length - pre.length));
const between = (s: string, from: string, to: string) => {
  const a = s.indexOf(from);
  assert.ok(a >= 0, `missing ${from}`);
  const b = s.indexOf(to, a + from.length);
  assert.ok(b > a, `missing ${to} after ${from}`);
  return s.slice(a, b);
};

describe('evening pass 1 — community / careers / awards', () => {
  test('E1 the conversation list is shrink-only, never flex: 1, inside the maxHeight sheet', () => {
    const sheet = between(code('src/screens/directory/RequestsView.tsx'), 'function ThreadSheet(', 'const st = StyleSheet.create');
    const list = between(sheet, '<FlatList', 'renderItem=');
    assert.doesNotMatch(list, /style=\{\{\s*flex:\s*1\s*\}\}/, 'flex: 1 lays the list out zero tall in a content-sized sheet');
    assert.match(list, /style=\{\{\s*flexShrink:\s*1\s*\}\}/);
    // The sheet really is content-sized (only a maxHeight), which is why it matters.
    assert.match(sheet, /st\.sheet, \{ maxHeight: '88%'/);
  });

  test('E2 refresh() clears a stale error before it waits on the save chain', () => {
    const v = code('src/screens/directory/MyProfileView.tsx');
    const fn = between(v, 'const refresh = useCallback(async () => {', '}, []);');
    const clear = fn.indexOf('setErr(null);');
    const wait = fn.indexOf('await saveChain.current;');
    assert.ok(clear >= 0, 'refresh no longer clears the old error');
    assert.ok(clear < wait, 'clear BEFORE the wait, so a save failing meanwhile keeps its message');
    // refresh is only reached from a successful write.
    for (const m of v.matchAll(/refresh\(\)/g)) {
      const at = m.index ?? 0;
      assert.match(v.slice(Math.max(0, at - 30), at), /r\.ok \? $/, 'refresh() called from something other than a successful write');
    }
  });

  test('E3 the Trophy Case reads cannot pass a failure off as "earned nothing"', () => {
    const api = code('src/features/achievements/api.ts');
    const uid = between(api, 'async function internalUserId()', '\n}\n');
    assert.match(uid, /myUserRowOrThrow<\{ id: string \}>\('id'\)/, 'a failed users-row read must throw, not read as a guest');
    assert.doesNotMatch(uid, /catch/, 'the throw must reach the screens');
    assert.doesNotMatch(api, /\bmyUserId\b/, 'the lenient myUserId (null on a dropped read) is back');
    const topics = between(api, 'export async function fetchTopicAchievements', '\n}\n');
    assert.match(topics, /fetchV3CurriculumStrict\(\)/, 'the curriculum read must be the strict one');
    assert.doesNotMatch(topics, /fetchV3Curriculum\(\)/, 'the lenient curriculum read resolves [] on failure');
  });

  test('E5 Topics: the error state that says "retry" has a Retry that reruns the load', () => {
    const t = code('src/screens/achievements/TopicsScreen.tsx');
    assert.match(t, /const load = useCallback\(\(\) => \{\s*const my = \+\+loadSeq\.current;/);
    assert.match(t, /useFocusEffect\(useCallback\(\(\) => load\(\), \[load\]\)\)/);
    assert.match(t, /loadError \? \(\s*<View[^>]*>\s*<StudioButton label="Retry"[^>]*onPress=\{load\}/);
  });

  test('E4 the career family returns to the existing Awards pager instead of pushing another', () => {
    const fam = code('src/screens/careerfinder/CareerFamilyScreen.tsx');
    assert.doesNotMatch(fam, /navigate\('Awards'/);
    assert.match(fam, /popTo\('Awards', \{ category: 'curriculum' \}\)/);
    assert.equal((fam.match(/onPress=\{openCurriculum\}/g) ?? []).length, 2, 'both curriculum links use the popTo');
  });
});
