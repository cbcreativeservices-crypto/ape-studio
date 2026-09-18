/**
 * localDay — the date on a document a client reads.
 *
 * ── WHY THIS EXISTS (2026-09-18) ─────────────────────────────────────────────
 *
 * `new Date(x).toISOString().slice(0, 10)` is the obvious way to stamp a
 * document and it is wrong: `toISOString` converts to UTC first, so any evening
 * west of Greenwich prints TOMORROW'S DATE.
 *
 * At 7pm in Los Angeles it is already the next day in UTC. The Production
 * Packet's revision-control block — on a document a professional hands to a
 * paying client — was stamped with a date that had not happened yet, so the
 * revision history read out of order against the client's own records. The
 * Cymatics export sheets had the same stamp.
 *
 * ── WHY THE SOURCE SCAN ──────────────────────────────────────────────────────
 *
 * The contract tests below are honest but NOT decisive on their own: a CI box
 * running in UTC cannot tell `localDay` from `toISOString`, because in UTC they
 * agree. The bug only appears in the timezones real users are in.
 *
 * So the last block reads the two call sites and asserts they do not reach for
 * `toISOString` again. That check works in every timezone, including the one
 * this suite happens to run in.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const { localDay } = await import('../src/lib/localDate.ts');

describe('localDay reports the day the user is standing in', () => {
  it('uses LOCAL calendar components, whatever the offset', () => {
    // The definitional property: whatever the device's timezone, the answer is
    // built from the same getters the user's own calendar would use.
    for (const iso of [
      '2026-01-01T00:30:00Z',
      '2026-06-15T12:00:00Z',
      '2026-09-18T23:59:00Z',
      '2026-12-31T23:30:00Z',
    ]) {
      const d = new Date(iso);
      const expected = [
        d.getFullYear(),
        String(d.getMonth() + 1).padStart(2, '0'),
        String(d.getDate()).padStart(2, '0'),
      ].join('-');
      assert.equal(localDay(d), expected, iso);
    }
  });

  it('pads to YYYY-MM-DD', () => {
    // A single-digit month or day must not produce "2026-1-5" — the packet
    // sorts revisions as text.
    const d = new Date(2026, 0, 5, 12, 0, 0);
    assert.equal(localDay(d), '2026-01-05');
    assert.match(localDay(d), /^\d{4}-\d{2}-\d{2}$/);
  });

  it('accepts a Date, a timestamp or an ISO string', () => {
    const d = new Date(2026, 8, 18, 19, 0, 0);
    assert.equal(localDay(d), '2026-09-18');
    assert.equal(localDay(d.getTime()), '2026-09-18');
    assert.equal(localDay(d.toISOString()), '2026-09-18');
  });

  it('an unreadable date produces nothing, not "NaN-NaN-NaN"', () => {
    // These strings are printed straight onto a document.
    assert.equal(localDay('not a date'), '');
    assert.equal(localDay(Number.NaN), '');
  });

  it('defaults to now', () => {
    assert.match(localDay(), /^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('the two client-facing stamps do not use toISOString', () => {
  // Decisive in every timezone, unlike the contract tests above.
  const cases: [string, string][] = [
    ['Production Packet revision block', '../src/features/production/packet.ts'],
    ['Cymatics export sheet', '../src/screens/lab/cymatics/ExportPanel.tsx'],
  ];

  for (const [what, rel] of cases) {
    it(`${what} stamps a LOCAL day`, () => {
      const src = readFileSync(new URL(rel, import.meta.url), 'utf8');
      assert.ok(src.includes('localDay'), `${what} should use localDay`);
      assert.ok(
        !/toISOString\(\)\.slice\(0,\s*10\)/.test(src),
        `${what} must not stamp a UTC day — an evening in the Americas prints tomorrow`,
      );
    });
  }
});
