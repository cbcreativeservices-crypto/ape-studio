/**
 * DJ Systems Lab: a redo is a fresh practice run (owner 2026-10-19: "on a
 * redo, start the goal chips empty as a fresh practice run, and never touch
 * earned credit"). A done screen opens with its goal chips EMPTY and each
 * ticks again as it is re-earned; the screen's done mark is never removed or
 * re-judged; the what's-left screen keeps it done and lists none of its
 * chips as "left".
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { clearGoalReports, latchGoals, leftLine, markOnMet, reportGoals, visitStart } from '../src/screens/lab/dj/booth/goalStore.ts';
import { whatsLeft, type LabEndUnit } from '../src/screens/lab/kit/labEnd.ts';

const ROOT = join(import.meta.dirname, '..');
const read = (f: string) => readFileSync(join(ROOT, f), 'utf8').replace(/\r\n/g, '\n');

describe('a DJ redo is a fresh practice run (owner 2026-10-19)', () => {
  it('every visit opens with its chips EMPTY — a done screen too', () => {
    assert.deepEqual(visitStart(4), [false, false, false, false]);
    assert.deepEqual(visitStart(0), []);
  });
  it('each chip ticks again only as it is re-earned in this visit', () => {
    let seen = visitStart(3);
    seen = latchGoals(seen, [false, false, false], true);
    assert.deepEqual(seen, [false, false, false], 'nothing is met yet: nothing ticks');
    seen = latchGoals(seen, [false, true, false], true);
    assert.deepEqual(seen, [false, true, false], 'the one re-earned ticks');
    seen = latchGoals(seen, [true, false, false], true);
    assert.deepEqual(seen, [true, true, false], 'a ticked chip stays ticked');
    seen = latchGoals(seen, [true, true, true], false);
    assert.deepEqual(seen, [true, true, false], 'nothing latches before the screen’s setup is applied');
  });
  it('meeting every goal marks a screen only when it is not done yet — a redo never re-judges it', () => {
    assert.equal(markOnMet(true, false), true, 'a first full run marks the screen done');
    assert.equal(markOnMet(true, true), false, 'a redo that meets them again changes nothing');
    assert.equal(markOnMet(false, true), false, 'empty chips on a redo never unmark it');
    assert.equal(markOnMet(false, false), false);
  });
  it('useVisitGoals: empty chips at the start, no seeding from isDone, and only ever MARKS', () => {
    const bits = read('src/screens/lab/dj/bits.tsx');
    const hook = bits.slice(bits.indexOf('export function useVisitGoals'), bits.indexOf('export function GoalChips'));
    assert.match(hook, /useRef<boolean\[\]>\(visitStart\(goals\.length\)\)/);
    assert.doesNotMatch(hook, /goals\.map\(\(\) => ctx\.isDone\)/, 'a done screen no longer opens with every chip ticked');
    assert.doesNotMatch(hook, /ctx\.isDone && !seen/, 'nor are its chips filled in when the done mark loads');
    assert.match(hook, /if \(markOnMet\(true, ctx\.isDone\)\) ctx\.markDone\(\);/);
    assert.doesNotMatch(hook, /completed|unmark|reset/i, 'the hook never touches the page marks');
  });
  it('Screen 4 starts unwired on a redo too (a kept booth re-ticked its three wiring chips on arrival)', () => {
    const s = read('src/screens/lab/dj/pages/p04Build.tsx');
    assert.match(s, /useScreenSetup\(\(b\) => \(\{ \.\.\.unbuilt\(b\), perspective: 'CROWD' \}\), false\)/);
  });
  it('the page marks only grow: markDone adds a page, nothing in PagedLab removes one but a practice START OVER', () => {
    const s = read('src/screens/lab/kit/PagedLab.tsx');
    const md = s.slice(s.indexOf('const markDone = useCallback'), s.indexOf('const doReset'));
    assert.match(md, /const completed = fresh \? \[\.\.\.base\.completed, page\]\.sort\(\(a, b\) => a - b\) : base\.completed;/);
    // no page mark is ever filtered or spliced out of the list
    assert.doesNotMatch(s, /completed\.(filter|splice)\(|completed\.length = /);
    // an empty list only for a guest's load and for START OVER (PRACTICE)
    assert.equal([...s.matchAll(/completed: \[\]/g)].length, 2);
    assert.match(s, /const fresh: PagedProgress = \{ completed: \[\], lastPage: 0, done: false \};/);
  });
});

describe('the what’s-left screen keeps a redone screen done and lists none of its chips', () => {
  it('PagedLab: a done (or banked) page carries no what’s-left line at all', () => {
    const s = read('src/screens/lab/kit/PagedLab.tsx');
    assert.match(s, /if \(pageDetail && endCleared\.has\(String\(i\)\)\) return \{ detail: undefined \};/);
    assert.ok(s.indexOf('const endCleared = new Set<string>()') < s.indexOf('const pageDetailOf'), 'cleared is known before the lines are built');
  });
  it('a redo that reports empty chips: the row is still CREDITED/DONE, with no "Left:" line', () => {
    clearGoalReports();
    const labels = ['Patch the decks', 'Power up safely', 'Pass the check'];
    // the redo visit: fresh chips, one re-earned so far
    reportGoals('BUILD', labels, [true, false, false]);
    assert.equal(leftLine('BUILD', labels), 'Left: Power up safely · Pass the check', 'the store still knows this visit');
    // what PagedLab builds for the rows: page 1 (BUILD) is done, page 0 is not
    const cleared = new Set(['1']);
    const detailOf = (i: number, line: string) => (cleared.has(String(i)) ? { detail: undefined } : { detail: line });
    const units: LabEndUnit[] = [
      { id: '0', label: 'Welcome', detail: 'hands-on', ...detailOf(0, 'Left: Start deck A') },
      { id: '1', label: 'Build', detail: 'hands-on', ...detailOf(1, leftLine('BUILD', labels)) },
    ];
    const w = whatsLeft(units, cleared);
    assert.deepEqual(w.left.map((r) => r.id), ['0']);
    assert.deepEqual(w.credited.map((r) => r.id), ['1'], 'the redone screen still counts as done');
    assert.equal(w.credited[0].credited, true);
    assert.equal(w.credited[0].detail, undefined, 'no unmet chip of a done screen is shown as left');
    assert.equal(w.left[0].detail, 'Left: Start deck A', 'a screen not done still names its goals');
    clearGoalReports();
  });
  it('the DJ shell still hands PagedLab its what’s-left lines', () => {
    const shell = read('src/screens/lab/dj/DJSystemsLabScreen.tsx');
    assert.match(shell, /pageDetail=\{leftDetail\}/);
  });
});
