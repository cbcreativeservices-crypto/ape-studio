/**
 * Owner 2026-10-27 ("the constant misses"): a must-do row whose status STARTS
 * with DONE is treated as closed — the session-start report hides it
 * (~/.claude/hooks/mustdo_status.js). R4 and R6 read "DONE … Still ccode: …" /
 * "DONE server … owner smoke test still pending", so real open work vanished
 * from every report. A DONE status must not name open work, unless it points to
 * the OPEN row that now carries it ("follow-up in D2"). History after "Was:",
 * "Earlier:" or "Before:" is ignored, and so are hyphenated names
 * (release-pending-credentials) and `code`.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const md = readFileSync(new URL('../docs/APE_LAUNCH_MUST_DO.md', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const OPEN_WORDS = /(?<![-\w])(still|waiting|pending|to do|todo|not yet|not built|not done|owner'?s? (go|call|decision)|blocked)(?![-\w])/i;
const CLOSED = /^(DONE|CLOSED|VERIFIED DONE)\b/;

type Row = { id: string; status: string };
const rows: Row[] = [];
for (const line of md.split('\n')) {
  const m = line.match(/^\| *([A-Z]{1,2}\d{1,3}[a-z]?) *\|/);
  if (!m) continue;
  const cells = line.split('|').map((c) => c.trim()).filter(Boolean);
  rows.push({ id: m[1], status: (cells[cells.length - 1] || '').replace(/^[~*\s(]+/, '') });
}
const ids = new Set(rows.map((r) => r.id));
const openIds = new Set(rows.filter((r) => !CLOSED.test(r.status)).map((r) => r.id));

describe('must-do list: a DONE status never hides open work', () => {
  it('the list parses (a broken table would silently pass everything)', () => {
    assert.ok(rows.length > 40, `only ${rows.length} rows parsed`);
  });

  for (const r of rows.filter((x) => CLOSED.test(x.status))) {
    it(`${r.id} is honestly closed`, () => {
      const head = r.status.split(/\b(?:Was|Earlier|Before):/)[0].replace(/`[^`]*`/g, '');
      const hit = head.match(OPEN_WORDS);
      if (!hit) return;
      const pointer = head.match(/follow-up (?:in|tracked in|on) ([A-Z]{1,2}\d{1,3}[a-z]?)/i);
      assert.ok(
        pointer && ids.has(pointer[1]) && openIds.has(pointer[1]),
        `${r.id} starts "DONE" but says "${hit[0]}". Either it is not done (start the status with OPEN/BUILT/…), ` +
          `or name the open row that carries the rest: "follow-up in <ID>".`,
      );
    });
  }
});
