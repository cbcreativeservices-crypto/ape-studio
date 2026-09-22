/**
 * GUARD — the Profile progress numerator must be scoped like its denominator.
 *
 * Bug (found 2026-09-22, owner: "check the logic and how the my progress -
 * progress bars show their readout"):
 *
 *   numerator   = student_achievement_progress where user_id = me AND status = complete
 *   denominator = achievements where curriculum_version_id = v3 AND is_active
 *
 * The numerator was UNSCOPED, so completions against retired v2 topics and
 * against since-deactivated v3 topics counted in the top and were absent from
 * the bottom. Measured on production: 410 / 166 = 246%, which the
 * `Math.min(100, …)` clamp turned into a confident 100% (true figure 98%), and
 * the unclamped "Topics completed" stat rendered 410 — more topics than the
 * whole live curriculum.
 *
 * Two lessons are pinned here, not one:
 *  1. The scoping itself.
 *  2. A clamp that is doing real work is a bug indicator, not a guard. This
 *     one hid a 246% for weeks precisely because it looked like defensive code.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const SRC = join(process.cwd(), 'src', 'features', 'profile', 'api.ts');
const src = readFileSync(SRC, 'utf8');

/** Comments describe the bug by name; matching them would pass on prose. */
function stripComments(s: string): string {
  return s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}
const code = stripComments(src);

/** The single `.from('student_achievement_progress')` chain, up to its close. */
function progressQuery(): string {
  const i = code.indexOf(".from('student_achievement_progress')");
  assert.notEqual(i, -1, "fetchProfile no longer reads student_achievement_progress — re-verify this guard against the new source of the numerator");
  // The chain ends at the next top-level `),` that closes the builder.
  const rest = code.slice(i);
  const end = rest.indexOf('\n      ),');
  return end === -1 ? rest.slice(0, 600) : rest.slice(0, end);
}

describe('Profile progress numerator is scoped to the live curriculum', () => {
  const q = progressQuery();

  test('the count joins achievements with an INNER embed', () => {
    assert.match(
      q,
      /achievements!inner/,
      'the numerator counts progress rows without joining achievements, so it counts completions the denominator does not know about (246% on production)',
    );
  });

  test('it filters on the SAME curriculum version as the denominator', () => {
    assert.match(
      q,
      /\.eq\('achievements\.curriculum_version_id', V3_CURRICULUM_VERSION_ID\)/,
      'the numerator is not restricted to the active v3 curriculum',
    );
  });

  test('it filters on is_active, like the denominator', () => {
    assert.match(
      q,
      /\.eq\('achievements\.is_active', true\)/,
      'the numerator counts completions against deactivated topics',
    );
  });

  test('the denominator still uses exactly those two filters', () => {
    // If the denominator ever changes shape, the numerator above stops matching
    // it and this file is the place that finds out.
    const d = code.slice(code.indexOf(".from('achievements')"));
    assert.match(d, /\.eq\('curriculum_version_id', V3_CURRICULUM_VERSION_ID\)/);
    assert.match(d, /\.eq\('is_active', true\)/);
  });

  test('the denominator is exposed so the readout can state both numbers', () => {
    // A bare "98% complete" says nothing about scale; "163 of 166 topics" does.
    assert.match(code, /topicTotal: number;/);
    assert.match(code, /topicTotal: total,/);
  });
});
