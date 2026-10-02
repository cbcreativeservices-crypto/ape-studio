/**
 * The paged hosts on the SHARED LAB NAVIGATION (WP2 of the lab navigation
 * migration, 2026-09-30): kit/PagedLab (Envelope, Speech, De-Esser, Connector
 * Select, Patchbay, Beginning Mixing, Advanced Mixing) and
 * soundsystems/SsPagedLab (the five Sound Systems modes).
 *
 * THE CREDIT BUG THIS GUARDS. The old CONTINUE had no double-tap guard: the
 * second tap of a double tap on the second-to-last page landed after the
 * re-render, where the button was already FINISH, so it marked an UNSEEN last
 * page done — and Patchbay / Connector Select banked its `p<n>` credit through
 * onPageDone. Marking now happens only inside `beforeAdvance`, which useLabNav
 * runs under its one 400 ms tap lock (createTapLock) and never on a CONTENTS
 * jump. The first test replays that double tap against the lock with a fake
 * clock, following the hook's documented order exactly
 * (useLabNav.ts: lock → beforeAdvance → finish | go).
 */
import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { createTapLock } from '../src/screens/lab/kit/labNav.ts';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const strip = (code: string) =>
  code
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

const PAGED = strip(read('src/screens/lab/kit/PagedLab.tsx'));
const SS = strip(read('src/screens/lab/soundsystems/SsPagedLab.tsx'));
const RACK_LAYOUT = strip(read('src/screens/lab/soundsystems/rackLayout.tsx'));

/** A paged host as useLabNav drives it: `next` in the hook's order. */
function pagedHost(count: number, now: () => number) {
  const locked = createTapLock(400, now);
  const state = { page: 0, ending: false, marked: new Set<number>(), credited: [] as string[] };
  const markDone = () => {
    if (state.marked.has(state.page)) return;
    state.marked.add(state.page);
    state.credited.push(`p${state.page + 1}`); // onPageDone → markLabUnit(lab, 'p<n>')
  };
  const go = (i: number) => {
    state.ending = false;
    state.page = Math.max(0, Math.min(count - 1, i));
  };
  const next = () => {
    if (locked()) return;
    if (state.ending) return;
    markDone(); // beforeAdvance(from) for a page that is not manualDone
    if (state.page >= count - 1) state.ending = true;
    else go(state.page + 1);
  };
  const jump = (i: number) => {
    if (locked()) return;
    go(i); // beforeAdvance is NOT run on a CONTENTS jump
  };
  return { state, next, jump };
}

describe('PagedLab credit: a double tap on NEXT never marks an unseen page', () => {
  it('second tap within 400 ms on the second-to-last page is ignored — the last page stays unmarked and uncredited', () => {
    let t = 0;
    const h = pagedHost(5, () => t);
    for (let i = 0; i < 3; i++) {
      h.next();
      t += 1000;
    }
    assert.equal(h.state.page, 3, 'on the second-to-last page');
    h.next(); // tap 1
    t += 120;
    h.next(); // tap 2 — the old CONTINUE let this land as FINISH
    assert.equal(h.state.page, 4, 'on the last page');
    assert.equal(h.state.ending, false, 'the end screen did not open');
    assert.deepEqual([...h.state.marked].sort(), [0, 1, 2, 3], 'the last page is not marked');
    assert.deepEqual(h.state.credited, ['p1', 'p2', 'p3', 'p4'], 'no p5 credit was banked');
  });
  it('a deliberate second tap after the lock marks the last page and opens the end screen', () => {
    let t = 0;
    const h = pagedHost(2, () => t);
    h.next();
    t += 401;
    h.next();
    assert.equal(h.state.ending, true);
    assert.deepEqual(h.state.credited, ['p1', 'p2']);
  });
  it('a CONTENTS jump marks nothing', () => {
    let t = 0;
    const h = pagedHost(5, () => t);
    h.jump(4);
    assert.equal(h.state.page, 4);
    assert.equal(h.state.marked.size, 0);
    assert.deepEqual(h.state.credited, []);
  });
});

describe('the paged hosts mark only inside beforeAdvance, under the shared strip', () => {
  for (const [name, code] of [
    ['PagedLab', PAGED],
    ['SsPagedLab', SS],
  ] as const) {
    it(`${name}: imports the kit and renders LabHeader + LabNavBar under LabNavProvider`, () => {
      assert.match(code, /kit\/LabNavBar'|'\.\/LabNavBar'/);
      assert.match(code, /<LabNavProvider value=\{nav\}>/);
      assert.match(code, /<LabHeader /);
      assert.match(code, /<LabNavBar nav=\{nav\} \/>/);
    });
    it(`${name}: markDone() is called in beforeAdvance only, guarded by manualDone`, () => {
      // (ctx.markDone() inside the check page is the page marking itself.)
      const calls = code.match(/(?<![.\w])markDone\(\)/g) ?? [];
      assert.equal(calls.length, 1, 'exactly one host markDone() call site (beforeAdvance)');
      assert.match(code, /const beforeAdvance = useCallback\(\s*\(from: number\) => \{\s*if \(!pagesWithCheck\[from\]\?\.manualDone\) markDone\(\);\s*\},/);
      assert.match(code, /useLabNav\(\{[\s\S]*?beforeAdvance,[\s\S]*?\}\)/);
    });
    it(`${name}: nothing pinned at the bottom, none of the retired words, no local tap lock`, () => {
      for (const word of ['‹ BACK', 'CONTINUE ›', 'COMPLETE ✓', 'DONE ✓', 'SKIP AHEAD', 'styles.footer', 'styles.navBtn', 'lastNavAtRef', 'leavingRef', 'finishBlocked']) {
        assert.equal(code.includes(word), false, `${name} still carries "${word}"`);
      }
      assert.doesNotMatch(code, /disabled=\{/);
    });
    it(`${name}: FINISH opens LabEndScreen in place; DONE goes back; PRACTISE AGAIN clears nothing; a practice reset rides CONTENTS`, () => {
      assert.match(code, /const finish = useCallback\(\(\) => setEnding\(true\), \[\]\);/);
      assert.match(code, /const unEnd = useCallback\(\(\) => setEnding\(false\), \[\]\);/);
      assert.match(code, /<LabEndScreen[\s\S]*?onPracticeAgain=\{\(\) => goTo\(0\)\}[\s\S]*?onDone=\{\(\) => safeGoBack\(navigation\)\}/);
      assert.match(code, /reset: \{ label: 'START OVER \(PRACTICE\)', run: confirmReset \}/);
    });
    it(`${name}: go() leaves the end screen and records the navigation`, () => {
      assert.match(code, /navigatedRef\.current = true;\s*setEnding\(false\);\s*setPage\(idx\);/);
    });
  }

  it('PagedLab: the in-flow NEXT sits at the end of the reading; the guest / preload rules are untouched', () => {
    assert.match(PAGED, /<Page ctx=\{ctx\} \/>\s*<LabNextButton nav=\{nav\} \/>/);
    assert.match(PAGED, /loadedAsGuestRef\.current = guestRef\.current;/);
    assert.match(PAGED, /if \(!resolved\) return;/);
    assert.match(PAGED, /preloadRef\.current\.done\.add\(page\);/);
  });

  it('SsPagedLab: a document page draws the in-flow NEXT; a rack page gets it from the provider; the hub DONE label', () => {
    assert.match(SS, /<\/PageMemoryKey\.Provider>\s*<LabNextButton nav=\{nav\} \/>\s*<\/ScrollLockProvider>/);
    assert.match(SS, /doneLabel="DONE · BACK TO SOUND SYSTEMS"/);
    assert.match(SS, /loadedNoSaveRef\.current = noSaveRef\.current;/);
    assert.match(SS, /if \(!noSaveRef\.current && !loadedNoSaveRef\.current\) void savePagedProgress\(labId, next\);/);
  });

  it('Sound Systems rack pages take the safe-area default: nothing sits under the dock any more', () => {
    assert.doesNotMatch(RACK_LAYOUT, /bottomInset=\{0\}/);
    assert.doesNotMatch(RACK_LAYOUT, /bottomInset=/);
  });
});
