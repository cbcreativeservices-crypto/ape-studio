/**
 * GUARDS — community / directory fixes from the 2026-09-30 DAY toddler-and-cat
 * pass, BUG PASS 2 of 3 (re-audit of pass 1 + a fresh sweep).
 *
 *  E1  Publish with an UNSENT edit: the switch / the guide's button take the
 *      tap without blurring the text box, so a typed display name had no save
 *      in the chain — the local gaps check passed and the server was asked to
 *      publish a profile without it. Publish now sends the unsent edit first.
 *  E2  Pass-1 regression: the guide/editor default was latched at load, so a
 *      member who published FROM the guide and then unpublished in the editor
 *      was swapped back into the guide mid-tap. Published ⇒ default is editor.
 *  E3  A SEND that landed cleared the reply box outright — text typed while
 *      the send was out was wiped (draft included). Only the sent text clears.
 *  E4  Explore searched TWICE on every visit: the debounce handed back a new
 *      filters object for an unchanged (empty) query 350 ms after mount, and
 *      the list flipped back to the spinner.
 *  E5  A failed "Show more members" went into the search error, which renders
 *      INSTEAD of the list — the results on screen vanished and RETRY restarted
 *      at page 1. It has its own error now, shown by the button.
 *
 * Source-text checks, same style as communityToddlerDay20260930.
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

describe('community profile editor', () => {
  const editor = code('src/screens/directory/MyProfileView.tsx');

  test('E1: publish sends an unsent edit before it asks the server to publish', () => {
    const pub = between(editor, 'const sendPublish = (', 'const onPublish');
    const flush = pub.indexOf('if (hydrated.current && pRef.current !== lastSent.current) void persist(pRef.current);');
    assert.ok(flush > 0, 'publish no longer flushes an unsent edit');
    assert.ok(flush < pub.indexOf('publishCommunityProfile('), 'the flush must be queued before the publish');
    // …and after the one-at-a-time guard, so a double tap cannot flush twice.
    assert.ok(pub.indexOf('publishing.current = true;') < flush);
  });

  test('E2: once published, the editor is the default for the rest of the visit', () => {
    const latch = editor.indexOf('if (guideDefault.current === null) guideDefault.current = setupUnfinished;');
    const pub = editor.indexOf('if (p.published) guideDefault.current = false;');
    const use = editor.indexOf('(useGuide ?? guideDefault.current) && !p.published');
    assert.ok(latch > 0 && pub > latch && use > pub, 'published must override the latched default before it is read');
  });
});

describe('conversation sheet', () => {
  test('E3: a SEND clears only the text it sent', () => {
    const sheet = between(code('src/screens/directory/RequestsView.tsx'), 'function ThreadSheet(', 'const st = StyleSheet.create');
    assert.match(sheet, /const sentRaw = body;[\s\S]*?runSend\(\(\) =>\s*sendThreadMessage\(thread\.id, sentRaw\.trim\(\)\)/);
    // Pass 3 (F1) widened "only the sent text" to a sent PREFIX as well.
    assert.match(sheet, /setBody\(unsent\);/);
    assert.doesNotMatch(sheet, /setBody\(''\);\s*await load\(\);/);
  });
});

describe('explore', () => {
  const view = code('src/screens/directory/ExploreView.tsx');

  test('E4: an unchanged query keeps the same filters object (no second search)', () => {
    assert.match(view, /setF\(\(prev\) => \(\(prev\.q \?\? ''\) === q \? prev : \{ \.\.\.prev, q \}\)\)/);
    assert.doesNotMatch(view, /setF\(\(prev\) => \(\{ \.\.\.prev, q \}\)\)/);
  });

  test('E5: a failed next page keeps the list and reports beside the button', () => {
    const more = between(view, 'const loadMore = useCallback(', '}, [f, page]);');
    assert.doesNotMatch(more, /setErr\(/, 'a next-page failure must not use the list-replacing error');
    assert.match(more, /setMoreErr\(out\.error\)/);
    const run = between(view, 'const run = useCallback(', 'const loadMore');
    assert.match(run, /setMoreErr\(null\)/, 'a new search must clear a stale next-page error');
    assert.match(view, /\{moreErr \? <Banner tone="warn">\{moreErr\}<\/Banner> : null\}/);
  });
});
