/**
 * GUARDS — community / careers fixes from the 2026-10-01 night bug pass 1.
 *
 *  D1  Member sheet: a SEND REQUEST / SEND REPORT / BLOCK that answered after
 *      the sheet was closed set `sent` / `reported` / `err` again — the NEXT
 *      member opened showed "Request sent" (with their contact button hidden),
 *      a report banner or the first member's error; a late BLOCK closed the
 *      second member's sheet.
 *  D2  Career Finder store: resetLocal (account switch) left every MOUNTED
 *      hook at hydrated=false for good, because hooks hydrate only on
 *      subscribe — the hub drew no START / CONTINUE button until remounted.
 *
 * Source-text checks (the screens import React Native, which will not load
 * under node), in the same style as communityCareersBugHunt20260930.
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

describe('community directory member sheet', () => {
  const src = code('src/screens/directory/AudioCommunityDirectoryScreen.tsx');
  const sheet = between(src, 'function MemberSheet(', 'function ContactSheet(');

  test('D1: the open member is tracked in a ref', () => {
    assert.match(sheet, /const liveToken = useRef\(token\);\s*liveToken\.current = token;/);
  });

  for (const call of ['blockMember(token, true).then(', 'sendContactRequest(token, purpose, message).then(', 'reportMember({ token, reason, detail }).then(']) {
    test(`D1: ${call.split('(')[0]} answers are fenced to the member still open`, () => {
      const at = sheet.indexOf(call);
      assert.ok(at >= 0, `missing ${call}`);
      const body = sheet.slice(at, at + 260);
      const fence = body.indexOf('liveToken.current !== token');
      assert.ok(fence > 0, 'no fence');
      // The fence comes before any state write in the answer.
      for (const w of ['setErr(', 'setSent(', 'setReported(', 'setContactOpen(', 'setReportOpen(', 'setConfirmBlock(', 'onClose()']) {
        const i = body.indexOf(w);
        if (i >= 0) assert.ok(fence < i, `${w} runs before the fence`);
      }
    });
  }
});

describe('career finder store', () => {
  const store = code('src/features/careerfinder/store.ts');

  test('D2: resetLocal re-hydrates for hooks that are already mounted', () => {
    // On the house store since 2026-10-04 (guestCareer): resetLocal IS the
    // safe store's reset, which carries the same three guarantees.
    const reset = between(store, 'export function resetLocal(): void {', '\n}');
    assert.match(reset, /\): void \{\s*store\.reset\(\);\s*$/);
    assert.match(store, /const store = createLocalStore<FinderRecord>\(\{ key: KEY,/);
    const safe = between(code('src/features/storage/localStore.ts'), 'function reset(): void {', '\n  }');
    assert.match(safe, /generation\+\+/);
    assert.match(safe, /if \(listeners\.size > 0\) void hydrate\(\);/);
    // …and only after the in-memory reset, so the fence sees the new generation.
    assert.ok(safe.indexOf('hydrating = null') < safe.indexOf('void hydrate()'));
  });
});
