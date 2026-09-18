/**
 * Production Lab — the two parsers whose output reaches a client.
 *
 * Both of these feed the readiness verdict and the line items that go into the
 * exported packet, so a misread value is not a bad hint on a screen — it is a
 * wrong number in a document a professional hands to somebody who is paying
 * them.
 *
 * ── cellNum ──────────────────────────────────────────────────────────────────
 *
 * Scalar currency fields are rendered by NumberField, which strips non-numeric
 * characters as you type, so `12,000` is safe there. TABLE cells fall through to
 * a bare TextInput that keeps the raw string, with `keyboardType="numeric"` —
 * which on iOS is NumbersAndPunctuation, so the comma is right on the keypad.
 *
 * `Number("12,000")` is NaN, and every consumer spells `?? 0`. So one comma did
 * two contradictory things at once: the over-budget advisory summed that line as
 * ZERO and never fired, while "no contingency" was announced to someone who had
 * just typed one.
 *
 * ── when() / readDate ────────────────────────────────────────────────────────
 *
 * Anything that was not a bare `YYYY-MM-DD` fell through to `Date.parse`, whose
 * behaviour on non-ISO input is implementation-defined. The SAME keystrokes gave
 * two different bugs:
 *
 *   V8 (the ape-web preview)   "01/04/2026" -> 4 January
 *   Hermes (the device build)  "01/04/2026" -> null
 *
 * A UK user meaning 1 April got a silently wrong date in the preview and a
 * silently absent one on the phone — and every date rule short-circuits on null,
 * so a plan whose delivery precedes its production date passed clean. That
 * engine split is also why it could not be reproduced reliably.
 *
 * These tests pin the refusals as hard as the successes. Refusing to read
 * `01/04/2026` is the POINT, not a limitation.
 */
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

// rules.ts imports its siblings without a file extension; Node's native runner
// needs them resolved. Same shim as productionAnswered.test.ts.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
      const index = new URL(specifier + '/index.ts', context.parentURL);
      if (existsSync(fileURLToPath(index))) return { url: index.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const { cellNum, cellUnreadable, readDate, dateUnreadable, when } = await import(
  '../src/features/production/rules.ts'
);

const row = (v: unknown): Record<string, unknown> => ({ bl_amount: v });

describe('cellNum reads money the way people actually type it', () => {
  it('reads grouped thousands — the case that broke the budget', () => {
    assert.equal(cellNum(row('12,000'), 'bl_amount'), 12000);
    assert.equal(cellNum(row('1,234,567.89'), 'bl_amount'), 1234567.89);
  });

  it('still reads plain numbers', () => {
    assert.equal(cellNum(row('4500'), 'bl_amount'), 4500);
    assert.equal(cellNum(row('4500.50'), 'bl_amount'), 4500.5);
    assert.equal(cellNum(row(4500), 'bl_amount'), 4500);
    assert.equal(cellNum(row('-250'), 'bl_amount'), -250);
  });

  it('empty is null, and is NOT "unreadable"', () => {
    // A line nobody filled in is a different thing from a line we could not
    // add up, and only the second one should stop a gate.
    assert.equal(cellNum(row(''), 'bl_amount'), null);
    assert.equal(cellNum(row(undefined), 'bl_amount'), null);
    assert.equal(cellUnreadable(row(''), 'bl_amount'), false);
    assert.equal(cellUnreadable(row(undefined), 'bl_amount'), false);
  });

  it('⛔ refuses what it cannot read with certainty, and says so', () => {
    // `10,5` is a decimal comma in half the world and a typo in the other half.
    // Inventing a number for a client's budget is worse than admitting we could
    // not read it.
    for (const bad of ['10,5', 'about 5k', '12abc', '5 000 or so', '--3']) {
      assert.equal(cellNum(row(bad), 'bl_amount'), null, `${bad} should not parse`);
      assert.equal(cellUnreadable(row(bad), 'bl_amount'), true, `${bad} should be flagged`);
    }
  });
});

describe('readDate never guesses, and never depends on the JS engine', () => {
  const ymd = (t: number | null) => {
    assert.ok(t !== null, 'expected a date');
    const d = new Date(t);
    return [d.getFullYear(), d.getMonth() + 1, d.getDate()].join('-');
  };

  it('year-first is unambiguous', () => {
    assert.equal(ymd(readDate('2026-04-01')), '2026-4-1');
    assert.equal(ymd(readDate('2026/04/01')), '2026-4-1');
  });

  it('accepts a stored ISO timestamp and keeps the calendar day', () => {
    // Projects saved before this change may hold a full timestamp. Refusing it
    // would silently lose a date the user had already entered.
    assert.equal(ymd(readDate('2026-04-01T10:30:00Z')), '2026-4-1');
    assert.equal(ymd(readDate('2026-04-01 10:30')), '2026-4-1');
  });

  it('builds a LOCAL date, not UTC midnight', () => {
    // Date.parse reads a date-only string as UTC, so west of Greenwich a
    // deadline of "today" lands before the user's own start of day and reads as
    // already past. A production date means a calendar day where the user is
    // standing.
    const d = new Date(readDate('2026-04-01')!);
    assert.equal(d.getHours(), 0);
    assert.equal(d.getDate(), 1);
  });

  it('resolves D/M/Y when one component cannot be a month', () => {
    assert.equal(ymd(readDate('15/03/2026')), '2026-3-15');
    assert.equal(ymd(readDate('03/15/2026')), '2026-3-15');
    assert.equal(ymd(readDate('15-03-2026')), '2026-3-15');
  });

  it('a named month settles the order wherever it sits', () => {
    assert.equal(ymd(readDate('1 April 2026')), '2026-4-1');
    assert.equal(ymd(readDate('Apr 1, 2026')), '2026-4-1');
    assert.equal(ymd(readDate('1 Apr 2026')), '2026-4-1');
  });

  it('⛔ REFUSES the ambiguous one. This is the whole point.', () => {
    // 1 April or 4 January? V8 said January, Hermes said nothing. Reading a
    // production date three months early is worse than reading nothing.
    assert.equal(readDate('01/04/2026'), null);
    assert.equal(readDate('04/01/2026'), null);
    assert.equal(readDate('1/4/2026'), null);
    assert.equal(dateUnreadable('01/04/2026'), true);
  });

  it('refuses days that do not exist', () => {
    assert.equal(readDate('2026-02-31'), null, 'February has no 31st');
    assert.equal(readDate('31/02/2026'), null);
    assert.equal(readDate('2026-13-01'), null, 'there is no month 13');
  });

  it('refuses free text rather than letting an engine improvise', () => {
    for (const bad of ['next Tuesday', 'TBC', 'April', '2026', 'soon', '']) {
      assert.equal(readDate(bad), null, `${bad} should not parse`);
    }
  });

  it('empty is not "unreadable" — nothing was typed', () => {
    assert.equal(dateUnreadable(''), false);
    assert.equal(dateUnreadable(undefined), false);
  });

  it('when() agrees with readDate', () => {
    assert.equal(when('2026-04-01'), readDate('2026-04-01'));
    assert.equal(when('01/04/2026'), null);
    assert.equal(when(''), null);
  });
});
