/**
 * Reading a user-scoped PROGRESS row must name WHOSE row.
 *
 * ── WHY THIS TEST EXISTS ─────────────────────────────────────────────────────
 *
 * The sibling guard `usersReadIsScoped` was written after twelve unfiltered
 * reads of `public.users` broke both admin accounts. The same idiom had
 * escaped into the progress tables and nobody looked: `fetchMethodState` in
 * `features/study/api.ts` selected from `student_method_progress` on
 * `achievement_id` + `method_key` alone and leaned on RLS to leave one row.
 *
 * That holds for an ordinary learner. It does not hold for anyone the table's
 * `admin_all` policy covers — the read returns every learner's row for that
 * topic and method, and `.maybeSingle()` hands back SOMEONE ELSE'S
 * `item_states` and `completion_pct`, which the study screen then seeds itself
 * with as the admin's own progress. Where two learners have studied the same
 * method it errors on multiple rows instead and falls into the guest branch,
 * silently discarding real progress.
 *
 * `features/dashboard/api.ts` read the same table correctly the whole time
 * (`.eq('user_id', userId)`), which is what makes this an idiom bug rather
 * than one mistake: the right shape was already in the repo.
 *
 * ⚠️ `.maybeSingle()` is NOT a fix — it errors on more than one row too, and
 * only tolerates zero.
 *
 * `user_id` on these tables is a `public.users.id`, NOT `auth.uid()`. Use
 * `myUserId()` to resolve it; an auth uid matches nothing.
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

/** Tables whose rows belong to one user and which carry an admin-all policy. */
const USER_SCOPED = [
  'student_method_progress',
  'student_achievement_progress',
  'student_method_sessions',
];

/** How a read may legitimately name its owner. */
const SCOPED = /\.eq\(\s*['"](user_id|auth_id)['"]/;

function sources(root: string): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) {
        if (name !== 'node_modules') walk(full);
      } else if (/\.tsx?$/.test(name)) {
        out.push(full);
      }
    }
  };
  walk(root);
  return out;
}

/**
 * Slice each `.from('<table>')` call down to the end of its chain, so a filter
 * belonging to a DIFFERENT query in the same file cannot make this pass.
 */
function chainsFor(src: string, table: string): string[] {
  const chains: string[] = [];
  const marker = `.from('${table}')`;
  let i = src.indexOf(marker);
  while (i !== -1) {
    // A supabase chain ends at the first semicolon after it starts.
    const end = src.indexOf(';', i);
    chains.push(src.slice(i, end === -1 ? src.length : end));
    i = src.indexOf(marker, i + marker.length);
  }
  return chains;
}

describe('user-scoped progress reads name their owner', () => {
  for (const table of USER_SCOPED) {
    it(`every ${table} query filters on the caller`, () => {
      const offenders: string[] = [];
      for (const file of sources('src')) {
        const src = readFileSync(file, 'utf8');
        if (!src.includes(`.from('${table}')`)) continue;
        for (const chain of chainsFor(src, table)) {
          // An insert/upsert carries its owner in the payload, not a filter.
          if (/\.(insert|upsert|rpc)\(/.test(chain)) continue;
          if (!SCOPED.test(chain)) {
            offenders.push(`${file}\n      ${chain.replace(/\s+/g, ' ').slice(0, 160)}`);
          }
        }
      }
      assert.deepEqual(
        offenders,
        [],
        `Unscoped ${table} query — RLS is not the only reader of this table, and an\n` +
          `admin gets every learner's row. Add .eq('user_id', await myUserId()).\n\n  ` +
          offenders.join('\n\n  '),
      );
    });
  }
});
