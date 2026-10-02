/**
 * Labs A — evening toddler hunt, pass 1 (2026-10-02). Receipts.
 *
 *  • Cable Install (CableInstallLabScreen): the resume read is a
 *    `AsyncStorage.multiGet`, which the G1 guard (it looks for getItem) never
 *    saw. A read that THREW restored nothing and the next tap wrote empty
 *    scores / myths / Repeat run over the stored ones; a tap before the read
 *    landed did the same, and the read then restored nothing. Now nothing is
 *    written until the read has landed, a failed read never writes, and a
 *    read that lands after the learner moved MERGES rather than dropping —
 *    except after a signed-out stretch (the guest offer's SIGN IN): that run
 *    was a preview, which carries nothing, so it never lands on the account
 *    (before, the next tap wrote the guest's scores over the member's).
 *  • Envelope lab check page: the copy said FINISH "unlocks" and "records
 *    it" — FINISH is never held (kit/PagedLab) and records nothing.
 * R2: every case was run against the pre-fix files and failed.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const read = (p: string) =>
  readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')
    .replace(/\r\n/g, '\n')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

describe('Cable Install: the resume read is never written over (P1/P2)', () => {
  const src = read('src/screens/lab/cableinstall/CableInstallLabScreen.tsx');
  const persist = src.slice(src.indexOf('const persist = useCallback('), src.indexOf('const goTo = useCallback('));

  it('persist writes nothing until the stored copy has been READ', () => {
    assert.match(persist, /if \(readRef\.current !== 'ok'\) return;/);
    // ...and the guard comes before the write
    assert.ok(persist.indexOf("readRef.current !== 'ok'") < persist.indexOf('AsyncStorage.multiSet'));
  });

  it('a read that throws is marked failed (never ok) and restores nothing', () => {
    assert.match(src, /await AsyncStorage\.multiGet\(\[STEP_KEY, STATE_KEY\]\);\s*\} catch \{\s*if \(alive\) readRef\.current = 'failed';\s*return;\s*\}/);
    assert.match(src, /if \(!alive\) return;\s*readRef\.current = 'ok';/);
  });

  it('a read that lands after the learner moved merges the stored scores and myths, and writes the merge', () => {
    const at = src.indexOf('if (!navigatedRef.current) {');
    assert.ok(at > 0);
    const nav = src.slice(at, src.indexOf('}, [resolved, noAccount]);', at));
    assert.doesNotMatch(src, /if \(!alive \|\| navigatedRef\.current\) return;/);
    assert.match(nav, /\{ \.\.\.\(stored\?\.dims \?\? \{\}\), \.\.\.\(carry \? cur\.dims : \{\}\) \}/);
    assert.match(nav, /new Set\(\[\.\.\.\(Array\.isArray\(stored\?\.myths\) \? stored\.myths : \[\]\), \.\.\.\(carry \? cur\.myths : \[\]\)\]\)/);
    assert.match(nav, /persist\(cur\.step, mergedDims, mergedMyths\);/);
  });

  it('after a signed-out stretch (the guest offer SIGN IN) the preview run is NOT merged into the account', () => {
    assert.match(src, /if \(resolved && noAccountRef\.current\) wasGuestRef\.current = true;/);
    assert.match(src, /const carry = !wasGuestRef\.current;/);
    assert.match(src, /\.\.\.\(carry \? cur\.dims : \{\}\)/);
    assert.match(src, /\.\.\.\(carry \? cur\.myths : \[\]\)/);
  });

  it('the read re-runs when the account state changes (a guest who signs in here)', () => {
    assert.match(src, /\}, \[resolved, noAccount\]\);/);
    assert.match(src, /readRef\.current = 'pending';\s*if \(resolved && noAccountRef\.current\) wasGuestRef\.current = true;\s*if \(!resolved \|\| noAccountRef\.current\) return;/);
    assert.match(src, /const noAccount = noAccountRef\.current;/);
  });
});

describe('Envelope lab: the check page copy matches the never-blocking FINISH (P18)', () => {
  // Raw source (comments kept out of the match by stripping only JSX comments).
  const raw = readFileSync(new URL('../src/screens/lab/envelope/EnvelopeLabScreen.tsx', import.meta.url), 'utf8').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
  const paged = read('src/screens/lab/kit/PagedLab.tsx');

  it('kit/PagedLab never holds FINISH and a manualDone page is only listed (the fact the copy must match)', () => {
    assert.match(paged, /if \(!pagesWithCheck\[from\]\?\.manualDone\) markDone\(\);/);
  });

  it('the page no longer says FINISH "unlocks" or "records it", nor calls the whole lab complete', () => {
    assert.doesNotMatch(raw, /FINISH unlocks/);
    assert.doesNotMatch(raw, /FINISH below records it/);
    assert.doesNotMatch(raw, /the lab is complete/);
    assert.match(raw, /'This page completes when all six are answered correctly\.'/);
  });
});
