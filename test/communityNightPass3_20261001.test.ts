/**
 * GUARDS — community / admin / onboarding fixes from the 2026-10-01 night bug pass 3.
 *
 *  F1  MemberSheet: one BLOCK lock across members — a block still out for A
 *      greyed and swallowed BLOCK for B. Now per member token.
 *  F2  Conversation sheet: one SEND lock across threads — a send still out in A
 *      left SEND dead in B. Now per thread id.
 *  F3  Employer review: no read fence — an older queue read could land last
 *      and show an already-decided applicant as still awaiting review.
 *  F4  useAboutOpened read the all-false default before the record loaded, so
 *      the About ring breathed for someone who had opened About long ago.
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

describe('night pass 3 — community / admin / onboarding', () => {
  test('F1/F2 useSendingPer locks per key', () => {
    const bits = code('src/screens/directory/directoryBits.tsx');
    const fn = between(bits, 'export function useSendingPer', '\n}\n');
    assert.match(fn, /inFlight\.current\.has\(key\)\) return/);
    assert.match(fn, /inFlight\.current\.delete\(key\)/);
  });

  test('F1 MemberSheet BLOCK is locked per member token', () => {
    const src = code('src/screens/directory/AudioCommunityDirectoryScreen.tsx');
    const sheet = between(src, 'function MemberSheet', 'function ContactSheet');
    assert.doesNotMatch(sheet, /useSending\(\)/);
    assert.match(sheet, /useSendingPer\(\)/);
    assert.match(sheet, /blockingFor\(token\)/);
    assert.match(sheet, /runBlockFor\(token,/);
  });

  test('F2 ThreadSheet SEND is locked per thread', () => {
    const src = code('src/screens/directory/RequestsView.tsx');
    const sheet = between(src, 'function ThreadSheet', 'const st = StyleSheet.create');
    assert.doesNotMatch(sheet, /useSending\(\)/);
    assert.match(sheet, /sendingIn\(threadId\)/);
    assert.match(sheet, /runSendIn\(thread\.id,/);
  });

  test('F3 EmployerAdmin load is fenced to the latest read', () => {
    const src = code('src/screens/admin/EmployerAdminScreen.tsx');
    const load = between(src, 'const load = useCallback', '}, []);');
    assert.match(load, /const id = \+\+loadReq\.current/);
    const awaitAt = load.indexOf('await Promise.all');
    const fenceAt = load.indexOf('if (id !== loadReq.current) return');
    assert.ok(awaitAt > 0 && fenceAt > awaitAt, 'fence must follow the read');
    assert.ok(fenceAt < load.indexOf('setPending('), 'fence must precede the writes');
  });

  test('F4 useAboutOpened is quiet (opened) until hydrated', () => {
    const src = code('src/features/onboarding/attractStore.ts');
    const fn = between(src, 'export function useAboutOpened', '\n}\n');
    assert.equal((fn.match(/!hydrated \|\| state\.aboutDone/g) ?? []).length, 2);
  });
});
