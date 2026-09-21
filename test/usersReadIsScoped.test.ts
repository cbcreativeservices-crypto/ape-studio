/**
 * Reading your own `public.users` row must name WHICH row.
 *
 * ── WHY THIS TEST EXISTS ─────────────────────────────────────────────────────
 *
 * Twelve call sites did `supabase.from('users').select(…).single()` with no
 * filter, trusting RLS to leave exactly one row. That holds for an ordinary
 * member and NOT for an admin: `public.users` carries an `admin_all_users`
 * policy (`ALL`, `is_admin()`), and two of the nine live accounts are admins.
 *
 * For them the read returned every row, `.single()` raised PGRST116, and
 * `profileRead.ts` maps PGRST116 to `'none'` — *"you have no account"*.
 * Profile, Dashboard progress, Awards, Achievements, credentials and
 * notification preferences failed at once, for the only two accounts that can
 * open the moderation and employer queues shipped for Apple 1.2.
 *
 * It was never one call site's bug — it was the IDIOM, which is why this is a
 * source-text guard rather than a unit test of any one function. Use
 * `myUserRow` / `myUserId`, or filter explicitly on `auth_id`.
 *
 * ⚠️ `.maybeSingle()` is NOT a fix. It also errors on more than one row; it
 * only tolerates zero. Both are caught here.
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

/** Every .ts/.tsx under a root, excluding the helper that legitimately does it. */
function sources(root: string): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const p = join(dir, entry);
      if (statSync(p).isDirectory()) {
        if (entry !== 'node_modules') walk(p);
      } else if (/\.tsx?$/.test(entry) && !p.endsWith(join('account', 'myUserRow.ts'))) {
        out.push(p);
      }
    }
  };
  walk(root);
  return out;
}

describe('reads of public.users are scoped to the caller', () => {
  const files = [...sources('src'), ...sources(join('web', 'lib'))];

  it('found the source tree', () => {
    assert.ok(files.length > 200, `only ${files.length} files walked — the glob is wrong`);
  });

  it('no unfiltered single()/maybeSingle() on users', () => {
    const offenders: string[] = [];
    for (const file of files) {
      const src = readFileSync(file, 'utf8');
      // Each `.from('users')` chain up to its terminator.
      for (const m of src.matchAll(/\.from\(\s*['"]users['"]\s*\)([\s\S]{0,400}?)(single\(\)|maybeSingle\(\)|;)/g)) {
        const chain = m[1];
        const terminator = m[2];
        if (terminator === ';') continue; // an update/insert/delete, not a row read
        // `.eq('auth_id'…)` or `.eq('id'…)` both name a row. Anything else does not.
        if (!/\.eq\(\s*['"](auth_id|id)['"]/.test(chain)) {
          offenders.push(`${file} → .from('users')…${terminator}`);
        }
      }
    }
    assert.deepEqual(
      offenders,
      [],
      `Unfiltered users read(s). An ADMIN matches every row, so single()/maybeSingle() raises ` +
        `PGRST116 and the app tells them they have no account. Use myUserRow()/myUserId() from ` +
        `features/account/myUserRow, or add .eq('auth_id', uid):\n  ${offenders.join('\n  ')}`,
    );
  });

  it('writes to users name a row too', () => {
    // A bare .update() on users under the admin policy would write EVERY row.
    const offenders: string[] = [];
    for (const file of files) {
      const src = readFileSync(file, 'utf8');
      for (const m of src.matchAll(/\.from\(\s*['"]users['"]\s*\)\s*\.(update|delete)\(([\s\S]{0,300}?);/g)) {
        if (!/\.eq\(\s*['"](auth_id|id)['"]/.test(m[2])) offenders.push(`${file} → .${m[1]}()`);
      }
    }
    assert.deepEqual(offenders, [], `Unscoped write(s) to users:\n  ${offenders.join('\n  ')}`);
  });
});
