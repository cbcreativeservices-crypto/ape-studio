/**
 * GUARDS — community / moderation / help fixes from the 2026-09-30 DAY
 * toddler-and-cat pass (bug pass 1 of 3).
 *
 *  D1  The guide ↔ editor choice was re-derived every render: the first
 *      letter typed into the guide's name step swapped the guide for the
 *      editor mid-word (and clearing the name in the editor did the reverse).
 *  D2  refresh() after publish / a visibility switch replaced the screen with
 *      the server's older profile while an edit was unsent or still saving —
 *      the text vanished and the next save erased it on the server.
 *  D3  Publish and Delete raced saves still in the chain.
 *  D4  Featured-credential writes were unordered RPCs; an older list could
 *      land last and win.
 *  D5  The conversation sheet lost the typed reply on close, and a SEND that
 *      finished after switching conversations wrote its error / cleared the
 *      draft of the NEXT conversation.
 *  D6  The report queue queued BAN and WARN for one member when tapped fast;
 *      answering both left them only warned.
 *  D7  Help's jumps pushed a second Settings over Help (React Navigation 7
 *      navigate never returns down the stack).
 *
 * Source-text checks, same style as communityCareersBugHunt20260930.
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

  test('D1: the guide/editor default is latched, not re-derived per render', () => {
    assert.match(editor, /if \(guideDefault\.current === null\) guideDefault\.current = setupUnfinished;/);
    assert.match(editor, /\(useGuide \?\? guideDefault\.current\) && !p\.published/);
    assert.doesNotMatch(editor, /useGuide \?\? setupUnfinished/);
  });

  test('D2: refresh waits for saves and never reads over an unsent edit', () => {
    const refresh = between(editor, 'const refresh = useCallback(async () => {', '}, []);');
    assert.match(refresh, /await saveChain\.current;[\s\S]*const seq = saveSeq\.current;[\s\S]*fetchMyCommunityProfile\(\)/);
    assert.match(refresh, /seq !== saveSeq\.current \|\| pRef\.current !== lastSent\.current/);
    // The merge branch keeps the local profile and takes only the switches.
    assert.match(refresh, /\.\.\.pRef\.current,\s*published: s\.published/);
  });

  test('D3: publish and delete run behind the save chain', () => {
    const pub = between(editor, 'const sendPublish = (', 'const onPublish');
    assert.match(pub, /saveChain\.current\s*\.then\(\(\) => publishCommunityProfile\(on, adult\)\)/);
    assert.match(editor, /saveChain\.current\.then\(\(\) => deleteCommunityProfile\(\)\)/);
  });

  test('D4: featured-credential writes are chained and roll back to the last accepted list', () => {
    const pick = between(editor, 'const seq = ++featuredSeq.current;', 'featuredChain.current = run.catch');
    assert.match(pick, /featuredChain\.current\s*\.then\(\(\) => setFeaturedCredentials\(ids\)\)/);
    assert.match(pick, /if \(r\.ok\) featuredOk\.current = ids;/);
    assert.match(pick, /const back = featuredOk\.current \?\? prevIds;/);
  });
});

describe('conversation sheet', () => {
  const requests = code('src/screens/directory/RequestsView.tsx');
  const sheet = between(requests, 'function ThreadSheet(', 'const st = StyleSheet.create');

  test('D5a: a closed conversation keeps its unsent reply', () => {
    assert.match(sheet, /setBody\(threadId \? \(drafts\.current\.get\(threadId\) \?\? ''\) : ''\)/);
    assert.match(sheet, /onChangeText=\{editBody\}/);
    assert.doesNotMatch(sheet, /setBody\(''\);\s*setAllow\(null\);/);
  });

  test('D5b: a SEND only touches the conversation it was sent from', () => {
    // Pass 2 renamed the sent text `sentRaw` (see the pass-2 guards).
    const send = between(sheet, 'sendThreadMessage(thread.id, sentRaw.trim())', 'await load();');
    assert.match(send, /if \(r\.ok && drafts\.current\.get\(thread\.id\) === sentRaw\) drafts\.current\.delete\(thread\.id\);/);
    const guard = send.indexOf('if (openId.current !== thread.id) return;');
    assert.ok(guard > 0 && guard < send.indexOf('setErr('), 'the open-thread check must come before any state write');
  });
});

describe('moderation queue', () => {
  test('D6: one standing decision at a time, released on cancel and on settle', () => {
    const src = code('src/screens/admin/ReportsAdminScreen.tsx');
    for (const fn of ['const act = (', 'const dismiss = (']) {
      const body = between(src, fn, '\n  };');
      assert.match(body, /if \(inFlight\.current\) return;\s*inFlight\.current = true;/, fn);
      assert.match(body, /finally \{\s*release\(\);/, fn);
      assert.match(body, /onCancel: release/, fn);
    }
  });
});

describe('help', () => {
  test('D7: a Help jump returns to a route already below instead of stacking another', () => {
    const src = code('src/screens/help/HelpScreen.tsx');
    assert.match(src, /onJump=\{\(route, params\) => navigation\.navigate\(route, params, \{ pop: true \}\)\}/);
  });
});
