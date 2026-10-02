/**
 * Full-app bug run 1 (2026-10-01) — area 1, HOME + SHELL. Source guards, each
 * pinned to its scenario; each failed against the pre-fix file (R2).
 */
import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { it } from 'node:test';

const read = (p: string) => readFileSync(p, 'utf8');

it('Dashboard sign-out leaves Auth as the ROOT, never pushed over the old Main (RETURN / BACK re-entered it)', () => {
  const src = read('src/screens/dashboard/DashboardScreen.tsx');
  // No sign-out path navigates (pushes) to Auth from the nested Study stack.
  assert.doesNotMatch(src, /signOutOrSay\(\s*\(\)\s*=>\s*\(navigation as any\)\.navigate\('Auth'\)/);
  // Both sign-out buttons (error state + stranded-session banner) reset the root.
  assert.equal((src.match(/void signOutOrSay\(resetToLogin\);/g) ?? []).length, 2);
  assert.match(src, /function resetToLogin\(\): void \{\s*if \(navigationRef\.isReady\(\)\) navigationRef\.reset\(\{ index: 0, routes: \[\{ name: 'Auth' as never \}\] \}\);/);
  assert.match(src, /import \{ navigationRef \} from '\.\.\/\.\.\/navigation\/navigationRef';/);
});

it('Dashboard item counts: a failed read THROWS — never a zero or partial denominator (0% cached / false 100%)', () => {
  const src = read('src/features/dashboard/api.ts');
  const fn = src.slice(src.indexOf('async function resolveItemCounts'), src.indexOf('export async function fetchEnrollmentDashboard'));
  // Direct-count fallback, sibling-name read, sibling page loop: all three throw.
  assert.equal((fn.match(/throw new Error\('item_counts_unavailable'\)/g) ?? []).length, 3);
  assert.doesNotMatch(fn, /if \(error\) break;/);
  assert.doesNotMatch(fn, /counts\.clear\(\);\s*break;\s*\}\s*const rows = \(direct/);
  assert.match(fn, /const \{ data: sibs, error: sibErr \} = await supabase\.from\('achievements'\)/);
  assert.match(fn, /if \(sibErr\) throw new Error\('item_counts_unavailable'\);/);
});

it('Start Here: the first read after a guest signs in merges the HELD pages (hand-off not yet written)', () => {
  const src = read('src/screens/startHere/StartHereScreen.tsx');
  const load = src.slice(src.indexOf('void loadPagedProgress(START_HERE_ID)'), src.indexOf('const persist = useCallback'));
  assert.match(load, /const held = heldPaged\(START_HERE_ID\)\?\.completed \?\? \[\];/);
  assert.match(load, /const extra = first \? \[\.\.\.progressRef\.current\.completed, \.\.\.held\] : held;/);
  // still AFTER the guest early-return: a guest's screen is never restored.
  assert.ok(load.indexOf('if (noAccountRef.current)') < load.indexOf('const held = heldPaged'));
});
