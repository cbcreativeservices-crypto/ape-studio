/**
 * Owner rulings 2026-10-14 for the Miking labs:
 *   #19 the quick check's FIRST try is the one that counts — a retake after
 *       seeing the answers is PRACTICE (labelled so, never recorded); going
 *       back a page resumes the same attempt; the "first try" hint is right
 *       even when the learner left a page mid-check; on the two-mic page a
 *       SOURCE change alone is not "moved a mic".
 *   #22 lesson copy says "suggest", never "recommend" (D71) — research quotes
 *       (prov / fact) and code comments excepted.
 * The store side of #19 (quickPicks, kept through START OVER) is in
 * test/mikingJourney.test.ts.
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const memo = await import('../src/screens/lab/miking/engine/progress/firstTryMemo.ts');
const { movedFromBaseline, MOVED_DT_MS } = await import('../src/screens/lab/miking/engine/physics/twoMic.ts');

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');

describe('#19 first-try misses survive a page change', () => {
  it('a miss is remembered until a fresh practice run', () => {
    memo.forgetFirstMisses();
    assert.equal(memo.firstTryMissed('k.snd.1'), false);
    memo.noteFirstMiss('k.snd.1');
    memo.noteFirstMiss('k.snd.1');
    assert.equal(memo.firstTryMissed('k.snd.1'), true, 'a remount reads the miss');
    assert.equal(memo.firstTryMissed('k.snd.2'), false);
    memo.forgetFirstMisses();
    assert.equal(memo.firstTryMissed('k.snd.1'), false);
  });
  it('every graded card seeds its first-try state from the memo and records misses', () => {
    const kit = read('src/screens/lab/miking/engine/kit.tsx');
    assert.match(kit, /const firstWrong = useRef\(firstTryMissed\(s\.id\)\);/);
    assert.match(kit, /firstWrong\.current = true;\s*noteFirstMiss\(s\.id\);/);
    assert.match(kit, /const early = useRef\(firstTryMissed\(t\.id\)\);/);
    assert.match(kit, /early\.current = true;\s*noteFirstMiss\(t\.id\);/);
    assert.match(kit, /const tries = useRef\(firstTryMissed\(t\.id\) \? 1 : 0\);/);
    assert.match(kit, /if \(setupId && !g\.pass\) noteFirstMiss\(t\.id\);/);
  });
  it('START OVER forgets the misses with the answers, and keeps the first try', () => {
    const host = read('src/screens/lab/miking/MikingLessonScreen.tsx');
    const reset = host.slice(host.indexOf('const doReset = () => {'), host.indexOf('const confirmReset = () => {'));
    assert.match(reset, /forgetFirstMisses\(\);/);
    assert.doesNotMatch(reset, /setLocalQuick\(null\)/);
    assert.match(host, /quickPicks: lp\.quickPicks,/);
    assert.match(host, /void recordQuickPick\(lesson\.id, itemId, pick\);/);
  });
});

describe('#19 the quick check: first try counts, retakes are practice', () => {
  const jk = read('src/screens/lab/miking/engine/journeyKit.tsx');
  const card = jk.slice(jk.indexOf('export function QuickCheckCard'), jk.indexOf('function QuickResult('));
  it('stored picks resume the attempt and the first pick per item stands', () => {
    assert.match(card, /const picks: Record<string, string> = \{ \.\.\.localPicks, \.\.\.journey\.quickPicks \};/);
    assert.match(card, /if \(it\.id in picks\) return; \/\/ the first pick stands/);
    assert.match(card, /journey\.recordQuickPick\?\.\(it\.id, o\);/);
    assert.match(card, /if \(!res && /, 'a graded first try is never re-recorded');
  });
  it('a retake is labelled PRACTICE and records nothing', () => {
    const practice = card.slice(card.indexOf('if (practice) {'), card.indexOf('// The first try: stored picks first'));
    assert.match(practice, /QUICK CHECK · PRACTICE · not recorded/);
    assert.match(practice, /PRACTICE · \$\{gradedP\.right\} OF \$\{gradedP\.total\}/);
    assert.doesNotMatch(practice, /recordQuick|recordQuickPick/);
    assert.match(card, /PRACTICE THE QUICK CHECK · NOT RECORDED/);
  });
  it('no copy promises another counted try after START OVER', () => {
    assert.doesNotMatch(jk, /allows another try at the check/);
    assert.doesNotMatch(jk, /one try per practice run/);
    assert.match(jk, /QUICK CHECK, FIRST TRY · /);
  });
});

describe('#19 two-mic pages: a SOURCE change is not a moved mic', () => {
  it('movedFromBaseline compares against the baseline Δt', () => {
    assert.equal(movedFromBaseline(0.3, 0.3), false);
    assert.equal(movedFromBaseline(0.3 + MOVED_DT_MS / 2, 0.3), false);
    assert.equal(movedFromBaseline(0.3 + MOVED_DT_MS * 2, 0.3), true);
    assert.equal(movedFromBaseline(-0.2, 0.3), true);
  });
  it('useMicMoved re-takes the baseline on a source change and latches a real move', () => {
    const kit = read('src/screens/lab/miking/engine/kit.tsx');
    const hook = kit.slice(kit.indexOf('export function useMicMoved'));
    assert.match(hook, /if \(base\.current\.sourceKey !== sourceKey\) base\.current = \{ sourceKey, dtMs \};/);
    assert.match(hook, /return movedNow \|\| latched;/);
  });
  for (const f of ['src/screens/lab/miking/pages/PTwoMic.tsx', 'src/screens/lab/miking/lessons/shared/hand/handPages.tsx', 'src/screens/lab/miking/lessons/shared/handdrums/pages/HTwoMic.tsx']) {
    it(`${f.split('/').pop()}: a page with a SOURCE picker uses useMicMoved(dt, srcId)`, () => {
      const src = read(f);
      assert.match(src, /const moved = useMicMoved\(dt, srcId\);/);
      assert.doesNotMatch(src, /Math\.abs\(dt - dt0\.current\)/);
    });
  }
});

describe('#22 Miking lesson copy says "suggest", not "recommend" (D71)', () => {
  const files: string[] = [];
  const walk = (d: string) => {
    for (const n of readdirSync(d)) {
      const p = join(d, n);
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.(ts|tsx)$/.test(n)) files.push(p);
    }
  };
  walk(join(ROOT, 'src/screens/lab/miking'));
  it('no learner-facing line uses recommend*', () => {
    const hits: string[] = [];
    for (const f of files) {
      readFileSync(f, 'utf8')
        .split(/\r?\n/)
        .forEach((line, i) => {
          if (!/recommend/i.test(line)) return;
          if (/^\s*(\*|\/\/|\/\*)/.test(line)) return; // a code comment
          if (/\bprov:|\bfact:/.test(line)) return; // a research source quote, verbatim
          hits.push(`${f.slice(ROOT.length + 1)}:${i + 1}`);
        });
    }
    assert.deepEqual(hits, []);
  });
});
