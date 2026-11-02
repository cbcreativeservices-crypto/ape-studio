/**
 * The conversation's Modal is never conditionally unmounted (checker,
 * 2026-11-01 redesign).
 *
 * The thread's "···" → REPORT opens the report DimModal NESTED inside the
 * thread's DimModal. SEND REPORT with "also block" closes the inner one, the
 * block lands, and the thread closes. ThreadSheet used to `return null` when
 * its thread went null — unmounting the OUTER Modal while the inner one was
 * still animating away, which skips DimModal's nested-close hold
 * (<nestedClose> in DimModal.tsx): on iOS the outer controller stays
 * presented, empty, over the whole app — the build-36 frozen-screen pattern.
 *
 * So the Modal is always mounted, only `visible` follows the thread, and the
 * last thread shown keeps drawing through the closing frames.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

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

describe('RequestsView ThreadSheet: the Modal stays mounted', () => {
  const src = code('src/screens/directory/RequestsView.tsx');
  const sheet = between(src, 'function ThreadSheet(', 'const st = StyleSheet.create');

  it('has no early return — the one return is the Modal', () => {
    assert.doesNotMatch(sheet, /return null;/, 'an early `return null` unmounts the Modal mid-close');
    assert.doesNotMatch(sheet, /if \(!(thread|view)\) return (null|<|\()/, 'no conditional return of JSX on the thread');
    assert.equal((sheet.match(/<Modal\b/g) ?? []).length, 1, 'exactly one Modal element');
    assert.match(sheet, /return \(\s*<Modal accessibilityViewIsModal visible=\{thread != null\}/);
  });

  it('visible follows the thread; the content draws the last thread shown', () => {
    assert.match(sheet, /const lastThread = useRef<ContactThread \| null>\(thread\);/);
    assert.match(sheet, /if \(thread\) lastThread\.current = thread;/);
    assert.match(sheet, /const view = thread \?\? lastThread\.current;/);
    assert.match(sheet, /visible=\{thread != null\}[^>]*>\s*\{view \? \(/);
  });

  it('the host always mounts it (no `open &&` around it)', () => {
    const view = between(src, 'export function RequestsView(', 'function ThreadWho(');
    assert.match(view, /\n\s*<ThreadSheet\n\s*thread=\{open\}/);
    assert.doesNotMatch(view, /open \? \(?\s*<ThreadSheet|open && <ThreadSheet/);
  });

  it('the "···" row is reset on OPEN only, so a report Modal inside it can finish closing', () => {
    assert.match(sheet, /if \(threadId\) setMore\(false\);/);
    assert.doesNotMatch(sheet, /\n\s*setMore\(false\);\n\s*\}, \[threadId\]\);/);
  });

  it('SEND is dead while the thread slides out', () => {
    assert.match(sheet, /disabled=\{\s*!thread \|\|/);
    assert.match(sheet, /onPress=\{\(\) => \{\s*if \(!thread\) return;\s*const sentRaw = body;/);
  });
});
