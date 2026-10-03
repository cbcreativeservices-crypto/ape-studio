/**
 * GUARDS — community / careers / awards, HUNT 5 (2026-10-03).
 *
 *  H1  Awards → DIRECTORY page, a signed-in learner whose membership read
 *      GAVE UP (tierReadFailed) with no remembered tier. The tier sweep
 *      (1e9f0f9d) stopped calling them a guest (`hasAccount` on `tierKnown`),
 *      but `accountConfirmed` stayed `resolved && entitlement !== 'anonymous'`
 *      — false for them — so the QR / credentials reads never fired and the
 *      tile said "Your verification QR appears here once your account
 *      finishes setting up" for good. `tierReadFailed` is only ever set for a
 *      signed-in identity, so it now confirms the account for these reads.
 *
 *  H2  Pattern P2 (newest load wins), flagged by hunt 4 and CONFIRMED here:
 *      CredentialWall, the Trophy Gallery and the Trophy Case hub reload on
 *      every focus (and on Retry) with no ticket. An older load's late
 *      rejection landed after a newer success and drew the "Couldn't load"
 *      card over a wall/gallery that had just loaded empty; an older answer
 *      could replace a newer one. Each load now takes a ticket and only the
 *      newest may set state.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');
const blank = (s: string) => s.replace(/[^\n]/g, ' ');
const code = (p: string) =>
  read(p)
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/(^|[^:])\/\/[^\n]*/g, (m, pre) => pre + ' '.repeat(m.length - pre.length));

describe('hunt 5 — community / careers / awards', () => {
  test('H1 a failed membership read still asks for the Registry QR (no "finishes setting up" forever)', () => {
    const v = code('src/screens/directory/DirectoryScreen.tsx');
    assert.match(v, /const \{ entitlement, resolved, tierKnown, tierReadFailed \} = useEntitlement\(\);/);
    assert.match(
      v,
      /const accountConfirmed = \(resolved && entitlement !== 'anonymous'\) \|\| tierReadFailed;/,
      'an account whose tier read gave up is still an account for the QR / credentials reads',
    );
    // The guest CTA rule from the tier sweep is unchanged.
    assert.match(v, /const hasAccount = !tierKnown \|\| entitlement !== 'anonymous';/);
    // And the reads still key off accountConfirmed.
    assert.match(v, /if \(accountConfirmed\) \{[\s\S]*?fetchMyQrToken\(\)/);
    assert.match(v, /\}, \[accountConfirmed\]\);/);
  });

  for (const [file, fetcher] of [
    ['src/screens/achievements/CredentialWall.tsx', 'fetchEarnedCredentialsByType'],
    ['src/screens/achievements/GalleryScreen.tsx', 'fetchGalleryV3'],
    ['src/screens/achievements/AchievementsHomeScreen.tsx', 'fetchAchievementsHub'],
  ] as const) {
    test(`H2 ${file.split('/').pop()}: only the newest load may land`, () => {
      const v = code(file);
      const start = v.indexOf('const load = useCallback');
      const end = v.indexOf('useFocusEffect(', start);
      assert.ok(start >= 0 && end > start, 'load found');
      const load = v.slice(start, end);
      assert.ok(load.includes(fetcher), `${fetcher} is in load`);
      const t = load.match(/const ticket = \+\+(\w+)\.current;/);
      assert.ok(t, 'each load takes a ticket');
      assert.match(v, new RegExp(`const ${t![1]} = useRef\\(0\\);`), 'the ticket is a ref');
      assert.doesNotMatch(load, /\.then\(set\w+\)/, 'no bare .then(setState) — it would land whatever its age');
      // Every arm that sets state checks the ticket first.
      const arms = load.split(/\.(?:then|catch)\(/).slice(1);
      assert.ok(arms.length >= 2, 'then + catch arms');
      for (const arm of arms) {
        const body = arm.slice(0, arm.search(/\n\s*\}\)/) + 1 || undefined);
        if (!/set\w+\(/.test(body)) continue;
        assert.match(body, /ticket (?:===|!==) \w+\.current|current\(\)/, `an arm sets state without the ticket check:\n${body}`);
      }
    });
  }
});
