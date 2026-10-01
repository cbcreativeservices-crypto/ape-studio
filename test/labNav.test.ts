/**
 * Shared lab navigation — the pure half (owner 2026-09-30: "make the
 * navigation through labs very recognizable and shared between labs — next,
 * previous, exit back to a menu").
 *
 * navView decides what the strip shows; createTapLock is the one double-tap
 * guard. Every edge: one unit, the last unit, the end screen, the intro,
 * sub-steps and their roll-overs.
 */
import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { NAV, createTapLock, navView, nextButtonLabel } from '../src/screens/lab/kit/labNav.ts';

describe('navView — a plain lab of 8 modules', () => {
  it('module 1: ⏮ and PREV dimmed, NEXT live, readout MODULE 1 / 8', () => {
    const v = navView(0, 8, false);
    assert.equal(v.startOn, false);
    assert.equal(v.prevOn, false);
    assert.equal(v.nextLabel, NAV.next);
    assert.equal(v.noun, 'MODULE');
    assert.equal(v.pos, '1 / 8');
    assert.equal(v.a11y.next, 'Next module');
    assert.equal(v.a11y.prev, 'Previous module');
    assert.equal(v.a11y.start, 'Back to the first module');
    assert.match(v.a11y.pos, /Module 1 of 8/);
  });
  it('a middle module: everything live', () => {
    const v = navView(2, 8, false);
    assert.equal(v.startOn, true);
    assert.equal(v.prevOn, true);
    assert.equal(v.nextLabel, NAV.next);
    assert.equal(v.pos, '3 / 8');
  });
  it('the last module: NEXT becomes FINISH — never null, never disabled', () => {
    const v = navView(7, 8, false);
    assert.equal(v.nextLabel, NAV.finish);
    assert.equal(v.a11y.next, "Finish the lab and see what's left");
    assert.equal(v.pos, '8 / 8');
  });
  it('past the end is clamped to the last module', () => {
    assert.equal(navView(12, 8, false).nextLabel, NAV.finish);
  });
});

describe("navView — the end screen (WHAT'S LEFT)", () => {
  it('reads WHAT’S LEFT, NEXT’s slot is empty, PREV returns to the last module', () => {
    const v = navView(7, 8, true);
    assert.equal(v.pos, NAV.whatsLeft);
    assert.equal(v.noun, '');
    assert.equal(v.nextLabel, null);
    assert.equal(v.prevOn, true);
    assert.equal(v.startOn, true);
    assert.equal(v.a11y.prev, 'Back to the last module');
  });
});

describe('navView — one-unit labs and empty labs', () => {
  it('a single unit is both first and last: PREV dimmed, FINISH', () => {
    const v = navView(0, 1, false);
    assert.equal(v.prevOn, false);
    assert.equal(v.startOn, false);
    assert.equal(v.nextLabel, NAV.finish);
    assert.equal(v.pos, '1 / 1');
  });
  it('no units at all still offers FINISH (labs never dead-end)', () => {
    assert.equal(navView(0, 0, false).nextLabel, NAV.finish);
    assert.equal(navView(0, 0, true).startOn, false);
  });
});

describe('navView — INTRO before unit 1', () => {
  it('index -1 reads INTRO, nothing behind it, NEXT ahead', () => {
    const v = navView(-1, 8, false, undefined, true);
    assert.equal(v.pos, NAV.intro);
    assert.equal(v.noun, 'MODULE');
    assert.equal(v.startOn, false);
    assert.equal(v.prevOn, false);
    assert.equal(v.nextLabel, NAV.next);
    assert.match(v.a11y.pos, /before module 1 of 8/);
  });
  it('with an intro, PREV on module 1 is live (it returns to the intro); without, dimmed', () => {
    assert.equal(navView(0, 8, false, undefined, true).prevOn, true);
    assert.equal(navView(0, 8, false, undefined, true).a11y.prev, 'Back to the introduction');
    assert.equal(navView(0, 8, false).prevOn, false);
  });
});

describe('navView — sub-step mode (MODULE 3 · STEP 2 / 4)', () => {
  it('reads the module in the noun and the step in the position', () => {
    const v = navView(2, 8, false, { i: 1, count: 4 });
    assert.equal(v.noun, 'MODULE 3 · STEP');
    assert.equal(v.pos, '2 / 4');
    assert.equal(v.a11y.next, 'Next step');
    assert.equal(v.a11y.prev, 'Previous step');
    assert.match(v.a11y.pos, /Module 3 of 8, step 2 of 4/);
  });
  it('module 1 step 1: PREV dimmed; module 1 step 2: PREV live (a step back)', () => {
    assert.equal(navView(0, 8, false, { i: 0, count: 4 }).prevOn, false);
    assert.equal(navView(0, 8, false, { i: 1, count: 4 }).prevOn, true);
    assert.equal(navView(0, 8, false, { i: 1, count: 4 }).startOn, false);
  });
  it('the last step of a middle module: NEXT (rolls to the next module), not FINISH', () => {
    const v = navView(2, 8, false, { i: 3, count: 4 });
    assert.equal(v.nextLabel, NAV.next);
    assert.equal(v.a11y.next, 'Next module');
  });
  it('the first step of a middle module: PREV rolls to the previous module', () => {
    const v = navView(2, 8, false, { i: 0, count: 4 });
    assert.equal(v.prevOn, true);
    assert.equal(v.a11y.prev, 'Previous module');
  });
  it('the last step of the last module is FINISH; an earlier step of it is NEXT', () => {
    assert.equal(navView(7, 8, false, { i: 3, count: 4 }).nextLabel, NAV.finish);
    assert.equal(navView(7, 8, false, { i: 2, count: 4 }).nextLabel, NAV.next);
  });
});

describe('createTapLock', () => {
  it('ignores a second tap inside the window and accepts one after it', () => {
    let t = 1000;
    const locked = createTapLock(400, () => t);
    assert.equal(locked(), false, 'first tap goes through');
    t += 150;
    assert.equal(locked(), true, 'the double tap is ignored');
    t += 300; // 450 ms after the ACCEPTED tap (ignored taps do not restart the window)
    assert.equal(locked(), false, 'a deliberate later tap goes through');
  });
  it('defaults to 400 ms', () => {
    let t = 0;
    const locked = createTapLock(undefined, () => t);
    locked();
    t = 399;
    assert.equal(locked(), true);
    t = 400;
    assert.equal(locked(), false);
  });
});

describe('nextButtonLabel — the in-flow button', () => {
  it('names what NEXT opens, upper-cased, and FINISH on the last unit', () => {
    assert.equal(nextButtonLabel('Sampling'), 'NEXT: SAMPLING ›');
    assert.equal(nextButtonLabel(null), 'FINISH · SEE WHAT’S LEFT ›');
  });
});
