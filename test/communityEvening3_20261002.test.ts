/**
 * GUARDS — community / careers / awards, evening toddler hunt PASS 3 (2026-10-02).
 *
 *  G1  Requests → REPORT with "Also block them" on (the default). When the
 *      report went through but the block was REFUSED, the error banner was set
 *      and then the "Report received" notice still said "You will not hear
 *      from this member again" — a block claimed that never happened. The
 *      notice now follows what the server did with the block.
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

describe('evening pass 3 — community / careers / awards', () => {
  test('G1 the report notice claims a block only when the block succeeded', () => {
    const v = code('src/screens/directory/RequestsView.tsx');
    const start = v.indexOf('runReport(() => reportMember({');
    assert.ok(start >= 0, 'report send path not found');
    const flow = v.slice(start, v.indexOf("'Report received'", start) + 400);
    assert.match(flow, /const b2 = await blockThread\(thread\.id, true\);/);
    assert.match(flow, /blocked = b2\.ok;/, 'the block result is recorded');
    const notice = flow.slice(flow.indexOf("'Report received'"));
    assert.match(notice, /^'Report received',\s*blocked\s*\?/, 'the wording is chosen on the block RESULT, not on the chip');
    assert.doesNotMatch(notice.slice(0, 80), /alsoBlock\s*\?/, 'chip state chose the "you will not hear from them" wording');
  });
});
