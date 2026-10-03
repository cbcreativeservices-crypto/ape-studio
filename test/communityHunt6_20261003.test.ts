/**
 * GUARDS — community / careers / awards, HUNT 6 (2026-10-03).
 *
 *  H1  Pattern P2 (newest load wins) in Directory → REQUESTS. `load()` had no
 *      ticket, and its reloads overlap: a double-tapped RETRY, or the reload
 *      after an ACCEPT still out when a BLOCK / REPORT on another request
 *      starts its own. An older list landing last put a just-blocked or
 *      just-answered request back as it was (ACCEPT / DECLINE live again), and
 *      an older FAILURE landing last hung "… Showing the last list that
 *      loaded." over a list that had just loaded. Only the newest load may now
 *      set state.
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

describe('hunt 6 — community / careers / awards', () => {
  test('H1 RequestsView: only the newest requests load may land', () => {
    const v = code('src/screens/directory/RequestsView.tsx');
    const start = v.indexOf('export function RequestsView');
    assert.ok(start >= 0, 'RequestsView found');
    const body = v.slice(start);
    const ls = body.indexOf('const load = useCallback');
    const le = body.indexOf('}, []);', ls);
    assert.ok(ls >= 0 && le > ls, 'load found');
    const load = body.slice(ls, le);
    const t = load.match(/const (\w+) = \+\+(\w+)\.current;/);
    assert.ok(t, 'each load takes a ticket');
    const [, ticket, ref] = t!;
    assert.match(body.slice(0, ls), new RegExp(`const ${ref} = useRef\\(0\\);`), 'the ticket counter is a ref');
    const fetchAt = load.indexOf('await fetchContactThreads()');
    assert.ok(fetchAt > load.indexOf(t![0]), 'the ticket is taken before the read');
    const guard = load.search(new RegExp(`if \\(${ticket} !== ${ref}\\.current\\) return;`));
    assert.ok(guard > fetchAt, 'a superseded load returns as soon as its answer lands');
    const firstSet = load.search(/set(LoadErr|Threads)\(/);
    assert.ok(firstSet > guard, 'no state is set before the newest-load check');
  });
});
