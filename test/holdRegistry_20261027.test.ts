/**
 * HOLD REGISTRY (owner 2026-10-27: "how many times has this happened").
 * A feature parked in the code ("⏸", "on HOLD", a `…_READY = false` switch,
 * "until Comp A") must carry the must-do row that tracks it, as [MD:<id>], and
 * that row must be on docs/APE_LAUNCH_MUST_DO.md. A hold with no row can't be
 * committed (the full suite runs before every commit), so it can't be lost.
 *
 * A comment that only RECORDS an old, finished hold must not use the hold
 * words (write it in the past tense, e.g. "was parked until …").
 * Also: every handoff-log "needs:" line from 2026-10-27 on that asks for
 * something cites its row.
 */
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

const root = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const read = (p: string) => readFileSync(join(root, p), 'utf8').replace(/\r\n/g, '\n');
const mustDo = read('docs/APE_LAUNCH_MUST_DO.md');
const rowIds = new Set([...mustDo.matchAll(/^\|\s*([A-Za-z]{1,3}\d{0,3}[a-z]?)\s*\|/gm)].map((m) => m[1]));

// The PARKING MARKERS (house rule 2026-10-27): a parked feature is written as
// "⏸", "on HOLD", a `…_READY = false` switch or "until Comp A". A bare
// uppercase HOLD is not used for parking: the app has PEAK HOLD readouts,
// HOLD-TO-DELETE buttons, a noise-gate HOLD control, sample & hold, BOW HOLD…
// (146 such lines on 2026-10-27), so it can't tell a parked feature apart.
const HOLD = /⏸|\bon HOLD\b|_READY\s*=\s*false\b|until Comp A/;
const TAG = /\[MD:([A-Za-z0-9.]+)\]/g;

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(join(root, dir))) {
    const rel = join(dir, name);
    if (statSync(join(root, rel)).isDirectory()) walk(rel, out);
    else if (/\.(ts|tsx)$/.test(name)) out.push(rel);
  }
  return out;
}

test('every hold in src cites a must-do row that exists', () => {
  const bad: string[] = [];
  for (const f of walk('src')) {
    const lines = read(f).split('\n');
    lines.forEach((line, i) => {
      if (!HOLD.test(line)) return;
      // The tag may sit on the hold line or within the next 3 lines of the same comment.
      const window = lines.slice(i, i + 4).join('\n');
      const tags = [...window.matchAll(TAG)].map((m) => m[1]);
      if (tags.length === 0) bad.push(`${f}:${i + 1} no [MD:<row>]`);
      for (const t of tags) if (!rowIds.has(t)) bad.push(`${f}:${i + 1} cites ${t}, not on the must-do list`);
    });
  }
  assert.deepEqual(bad, [], `holds the must-do list doesn't track:\n${bad.join('\n')}`);
});

test('handoff-log "needs:" lines from 2026-10-27 on cite their must-do row', () => {
  const log = read('docs/CROSS_SESSION_HANDOFF.md');
  const bad: string[] = [];
  for (const entry of log.split(/\n(?=### )/)) {
    const date = entry.match(/^### (\d{4}-\d{2}-\d{2})/)?.[1];
    if (!date || date < '2026-10-27') continue;
    const needs = entry.match(/^needs: (.*)$/m)?.[1]?.trim() ?? '';
    if (!needs || /^nothing\b/i.test(needs) || /^<FILL/.test(needs)) continue;
    if (![...needs.matchAll(TAG)].some((m) => rowIds.has(m[1]))) bad.push(`${entry.split('\n')[0]} → "${needs.slice(0, 80)}"`);
  }
  assert.deepEqual(bad, [], `handoff requests with no must-do row:\n${bad.join('\n')}`);
});
