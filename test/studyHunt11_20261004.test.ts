/**
 * Hunt 11 (2026-10-04) — Study area receipts. Each fails on HEAD 784bb36f.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const read = (...p: string[]) =>
  readFileSync(fileURLToPath(new URL(`../src/${p.join('/')}`, import.meta.url)), 'utf8');

test('Study Area EXPLORE: a half-dead catalog is never listed as the whole area', () => {
  const src = read('screens', 'courses', 'StudyAreaExplore.tsx');
  // The picker list is built from the catalog only when BOTH halves read; a
  // failed half (lenient []) yields no list, so the route effect falls back to
  // the curriculum browser (its own unreadable / retry faces) instead of a
  // partial picker or a lone survivor opened as if it were the only option.
  const memo = src.slice(src.indexOf('const list = useMemo<CredentialDetail[]>'));
  const body = memo.slice(0, memo.indexOf('}, [area, catalog]);'));
  assert.match(body, /if \(isDeadCatalog\(catalog\)\) return \[\];/);
  assert.ok(
    body.indexOf('isDeadCatalog(catalog)') < body.indexOf('const bySlug'),
    'the dead-catalog check runs before any credential is listed',
  );
});

test('Academy at a Glance: a late cache read never paints over the fresh server row', () => {
  const src = read('features', 'curriculum', 'academyStats.ts');
  // The instant-paint cache read and the server RPC race; the cache landing
  // second used to replace today's figures with the stored older ones.
  assert.match(src, /if \(!alive \|\| !raw \|\| freshLanded\) return;/);
  const rpc = src.slice(src.indexOf("supabase.rpc('get_academy_stats')"));
  assert.ok(
    rpc.indexOf('freshLanded = true;') >= 0 && rpc.indexOf('freshLanded = true;') < rpc.indexOf('setStats(fresh)'),
    'the server answer marks itself landed before it paints',
  );
});
