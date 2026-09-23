/**
 * GUARD — agent 3's family: a screen that shows the user a confident, specific,
 * WRONG number.
 *
 * Three distinct shapes, all found on 2026-09-23:
 *
 *   · a count read from a TRUNCATED fetch. The server caps a response at 1000
 *     rows and reports it as a short array, never an error. Live data averages
 *     195 mapping rows per topic, so an unpaged read of an enrolled member's
 *     topics truncates at roughly the sixth one.
 *   · an ERROR swallowed as an EMPTY result. supabase-js RESOLVES with
 *     `{ data: null, error }`, so dropping `error` turns a failure into an
 *     authoritative zero — and makes the caller's own error state unreachable.
 *   · a SERVER total rendered over a single page, with no way to reach page 2.
 *
 * A wrong number is worse than a missing one, because it is believed.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (...p: string[]) => readFileSync(join(process.cwd(), ...p), 'utf8');
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

describe('counts are not read from a truncated fetch', () => {
  // Both reads in resolveItemCounts feed a DENOMINATOR. Too small and
  // `studyDisplayPct`'s Math.min(100, …) shows a confident 100% on an
  // unfinished topic; zero and the whole method chain is a dead switch.
  test('resolveItemCounts pages BOTH of its row-download counts', () => {
    const code = strip(read('src', 'features', 'dashboard', 'api.ts'));
    const body = code.slice(code.indexOf('async function resolveItemCounts'));
    const fn = body.slice(0, body.indexOf('\n}\n') + 1);
    const selects = [...fn.matchAll(/\.from\('glossary_topics'\)/g)];
    assert.equal(selects.length, 2, 'the glossary_topics reads changed — re-verify this guard');
    assert.equal(
      (fn.match(/\.range\(/g) ?? []).length,
      2,
      'a glossary_topics count in resolveItemCounts is unpaged again — it truncates at 1000 rows, ~6 enrolled topics',
    );
    assert.ok(
      (fn.match(/\.order\(/g) ?? []).length >= 2,
      'a paged read lost its .order() — PostgREST pages can then repeat or skip rows',
    );
  });

  test('every .range() in src is preceded by an .order()', () => {
    // Ranging without ordering is not a stable pagination; it silently
    // double-counts and drops rows.
    for (const rel of [
      ['src', 'features', 'curriculum', 'curriculumStats.ts'],
      ['src', 'features', 'glossary', 'corpusFetch.ts'],
      ['src', 'features', 'dashboard', 'api.ts'],
    ]) {
      const code = strip(read(...rel));
      for (const m of code.matchAll(/\.range\(/g)) {
        const before = code.slice(Math.max(0, m.index! - 400), m.index!);
        assert.ok(
          before.includes('.order('),
          `${rel.join('/')} ranges without ordering first — pages can repeat or skip rows`,
        );
      }
    }
  });
});

describe('a failed read is not presented as an earned-nothing result', () => {
  test('fetchTopicAchievements surfaces its progress error', () => {
    const code = strip(read('src', 'features', 'achievements', 'api.ts'));
    const fn = code.slice(code.indexOf('export async function fetchTopicAchievements'));
    const body = fn.slice(0, fn.indexOf('\n}\n') + 1);
    assert.match(
      body,
      /const \{ data: prog, error \}/,
      'the progress read dropped its error again — every topic falls to locked and the Trophy Case says "0 / 166" to a member who has earned them',
    );
    assert.match(body, /if \(error\) throw error;/, 'the progress error is no longer thrown');
  });

  test('both Trophy Case consumers still have a reachable error state', () => {
    // The throw above is only worth anything because these catch it.
    const topics = strip(read('src', 'screens', 'achievements', 'TopicsScreen.tsx'));
    const home = strip(read('src', 'screens', 'achievements', 'AchievementsHomeScreen.tsx'));
    assert.match(topics, /\.catch\(/, 'TopicsScreen no longer catches a failed load');
    assert.match(home, /\.catch\(/, 'AchievementsHomeScreen no longer catches a failed load');
  });
});

describe('a server total is not shown over an unreachable page', () => {
  test('the directory can reach past page 1', () => {
    const view = strip(read('src', 'screens', 'directory', 'ExploreView.tsx'));
    // The header renders the SERVER's total_count; the page holds 30.
    assert.match(view, /searchDirectory\(f, next\)/, 'the directory lost its next-page fetch');
    assert.match(view, /hasMore/, 'the directory no longer knows it is truncated');
    assert.ok(
      view.includes('Show more members'),
      'the directory has no way to reach the members its own header counts',
    );
  });
});

describe('a tier decision waits for the tier', () => {
  test('TopicDetailModal holds the member-favouring copy until resolved', () => {
    // The provider boots at 'anonymous'. Gating on the tier alone told a paying
    // member their topic "needs Academy membership".
    const code = strip(read('src', 'screens', 'curriculum', 'TopicDetailModal.tsx'));
    assert.match(code, /const \{ entitlement, resolved \}/, 'TopicDetailModal no longer reads `resolved`');
    assert.match(
      code,
      /resolved && entitlement !== 'academy'/,
      'TopicDetailModal decides membership before the tier has resolved again',
    );
  });
});
