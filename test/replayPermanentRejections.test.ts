/**
 * The offline replay paths must never delete a graded attempt over the
 * cold-start auth race.
 *
 * ── WHY THIS TEST EXISTS ─────────────────────────────────────────────────────
 *
 * `submit_quiz` and `submit_final_exam` both open with
 *
 *   select id into v_user from users where auth_id = auth.uid();
 *   if v_user is null then raise exception 'user_not_found';
 *
 * so `user_not_found` is exactly what the server says when a request arrives
 * with NO JWT. The session is read from the keychain asynchronously, so the
 * first calls after a relaunch go out as `anon` — and `DashboardScreen.load()`
 * fires both replays as one of its first acts on relaunch. That is the window.
 *
 * Both files listed `user_not_found` as a PERMANENT rejection, so the queued
 * row was deleted: a graded paper the server had never seen, destroyed by the
 * app's own documented race. Both files carry a long comment explaining that a
 * row must be dropped only on a positive permanent rejection — the rule was
 * right and the list contradicted it.
 *
 * The study queue's equivalent (`isPermanentRejection` in study/sync.ts) never
 * listed it, which is what made these two the outliers rather than the norm.
 *
 * This is a SOURCE-TEXT guard, deliberately: the regexes are local constants
 * inside a network function that cannot be imported without a Supabase client,
 * and the thing worth pinning is the list itself.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const FILES = [
  ['src/features/quiz/api.ts', 'the topic quiz'],
  ['src/features/finalExam/api.ts', 'the final exam'],
] as const;

/** The `const permanent = /…/` line from a replay drain. */
function permanentPattern(src: string): string {
  const m = src.match(/const permanent = \/([^/]+)\//);
  assert.ok(m, 'no `const permanent = /…/` found — did the drain get restructured?');
  return m[1];
}

describe('replay drains: what may be dropped', () => {
  for (const [file, label] of FILES) {
    const src = readFileSync(file, 'utf8');

    it(`${label} never treats an auth failure as permanent`, () => {
      const pattern = permanentPattern(src);
      for (const forbidden of ['user_not_found', 'not_authenticated']) {
        assert.ok(
          !pattern.includes(forbidden),
          `${file} lists ${forbidden} as a permanent rejection. That is the cold-start auth race, ` +
            `not a verdict on the attempt — dropping the row destroys a graded paper the server never saw.`,
        );
      }
    });

    it(`${label} still drops the rejections that ARE final`, () => {
      // The guard must not be satisfied by emptying the list: a row the server
      // has positively refused should not be retried forever.
      const pattern = permanentPattern(src);
      for (const expected of ['attempt_not_found', 'already_finalized', 'invalid_attempt']) {
        assert.ok(pattern.includes(expected), `${file} should still drop ${expected}`);
      }
    });

    it(`${label} keeps an unrecognised error rather than deleting it`, () => {
      // The rule the comment states: transient → stop, permanent → drop,
      // anything else → KEEP. Pin the else-branch, since that is what makes an
      // unknown future server error safe.
      assert.ok(
        /if \(!permanent\)|else if \(permanent\)/.test(src),
        `${file} must branch on \`permanent\` explicitly, so an unrecognised error falls through to KEEP`,
      );
    });
  }

  it('the study queue is the reference, and still does not list auth failures', () => {
    const src = readFileSync('src/features/study/sync.ts', 'utf8');
    const m = src.match(/function isPermanentRejection[\s\S]{0,400}?\/([^/]+)\//);
    assert.ok(m, 'isPermanentRejection no longer matches on a regex literal');
    assert.ok(!m[1].includes('user_not_found'), 'the study queue must stay the safe reference');
  });
});
