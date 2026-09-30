/**
 * GUARDS — community / moderation / Career Finder fixes from the 2026-09-30 DAY
 * toddler-and-cat pass, BUG PASS 3 of 3 (re-audit of passes 1–2 + a sweep).
 *
 *  F1  Pass-2 correction: a SEND that landed while more had been typed kept
 *      the WHOLE box — the delivered message plus the new words — so the next
 *      SEND delivered the first message twice (and the saved draft carried the
 *      sent text too). Only the sent prefix is dropped now.
 *  F2  The report queue's READ THE CONVERSATION: a failed read showed
 *      "Loading the conversation…" for good, with the link gone and no retry.
 *  F3  The Career Finder store had no generation fence: a hydrate read still
 *      out at an account switch landed after resetLocal() and restored the
 *      departing user's answers, results and saved families.
 *
 * Source-text checks, same style as communityToddlerDay20260930Pass2.
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

describe('conversation sheet', () => {
  test('F1: a SEND drops only the sent prefix from the box and the draft', () => {
    const sheet = between(code('src/screens/directory/RequestsView.tsx'), 'function ThreadSheet(', 'const st = StyleSheet.create');
    const send = between(sheet, 'const sentRaw = body;', 'await load();');
    assert.match(send, /cur\.startsWith\(sentRaw\) \? cur\.slice\(sentRaw\.length\)/);
    assert.match(send, /setBody\(unsent\);/);
    assert.match(send, /const rest = unsent\(draft\);\s*if \(rest\) drafts\.current\.set\(thread\.id, rest\);\s*else drafts\.current\.delete\(thread\.id\);/);
    assert.doesNotMatch(send, /cur === sentRaw \? '' : cur/, 'the pass-2 whole-box rule re-sends the delivered text');
  });

  test('F1: the prefix rule itself', () => {
    const sentRaw = 'Thanks, see you Friday';
    const unsent = (cur: string) =>
      cur.startsWith(sentRaw) ? cur.slice(sentRaw.length).replace(/^\s+/, '') : cur;
    assert.equal(unsent(sentRaw), '');
    assert.equal(unsent(`${sentRaw} — at 7?`), '— at 7?');
    assert.equal(unsent('something else entirely'), 'something else entirely');
  });
});

describe('moderation queue', () => {
  test('F2: a failed conversation read offers a retry instead of loading forever', () => {
    const src = code('src/screens/admin/ReportsAdminScreen.tsx');
    assert.match(src, /setThread\(\{ id: r\.id, msgs, failed: msgs === null \}\)/);
    const view = between(src, '{thread?.id === r.id ? (', 'READ THE CONVERSATION');
    const failed = view.indexOf('thread.failed ?');
    const loading = view.indexOf('Loading the conversation');
    assert.ok(failed > 0 && failed < loading, 'the failure must be checked before the loading state');
    assert.match(view, /onPress=\{\(\) => openThread\(r\)\}/);
  });
});

describe('career finder store', () => {
  test('F3: a hydrate that outlives resetLocal() cannot restore the old record', () => {
    const src = code('src/features/careerfinder/store.ts');
    const hyd = between(src, 'export function hydrateCareerFinder', 'export const getCareerFinder');
    assert.match(hyd, /const g = generation;/);
    assert.match(hyd, /if \(g === generation && !wrote && raw\) state = clean/);
    assert.match(hyd, /if \(g !== generation\) return;\s*hydrated = true;/);
    const reset = between(src, 'export function resetLocal', '\n}');
    assert.match(reset, /generation \+= 1;/);
  });
});
