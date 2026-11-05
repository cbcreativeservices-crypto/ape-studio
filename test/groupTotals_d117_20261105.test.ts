/**
 * Report item 8 (owner accepted 2026-11-05): progress shows what is DONE,
 * never a total (D117).
 *
 *   8a  Progress > Topics header and subject rows: earned count only.
 *   8b  Start Here page-list button: spoken done count only.
 *   8c  Lab Check: "n still to get right".
 *   8f  Mic Locker: SLOTS keeps its real limit; jobs read "n jobs covered".
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');

describe('8a Topics: earned count, no total', () => {
  const src = read('src/screens/achievements/TopicsScreen.tsx');
  it('the header counts earned topics and an unread count stays a dash', () => {
    assert.ok(src.includes("`${earnedTotal} EARNED` : '—'"));
    assert.doesNotMatch(src, /\$\{earnedTotal\} \/ /);
  });
  it('each subject row, seen and spoken, has no total', () => {
    assert.ok(src.includes('{s.earnedCount} earned'));
    assert.ok(src.includes('`${s.subject}, ${s.earnedCount} earned`'));
    assert.doesNotMatch(src, /s\.earnedCount\}? (\/|of) /);
  });
});

describe('8b Start Here: spoken done count, no total', () => {
  it('reads "n done"', () => {
    const src = read('src/screens/startHere/StartHereScreen.tsx');
    assert.ok(src.includes('`All pages. ${progress.completed.length} done. '));
    assert.doesNotMatch(src, /completed\.length\} of /);
  });
});

describe('8c Lab Check: remaining count, no total', () => {
  it('reads "n still to get right"', () => {
    const src = read('src/components/LabUnderstandingCheck.tsx');
    assert.ok(src.includes('{remaining} still to get right'));
    assert.doesNotMatch(src, /of \{questions\.length\} still/);
  });
});

describe('8f Mic Locker: slots keep the limit, jobs drop the total', () => {
  const src = read('src/screens/lab/micselect/MicSelectLabScreen.tsx');
  const guide = read('src/screens/lab/micselect/micSelectScreenGuides.ts');
  it('SLOTS USED stays n/6, a real limit', () => {
    assert.ok(src.includes('`SLOTS USED: ${chosen.size}/${LOCKER_SLOTS}`'));
  });
  it('the jobs counter reads "6 JOBS COVERED" and "1 JOB COVERED"', () => {
    assert.ok(src.includes("`${covered.size} ${covered.size === 1 ? 'JOB COVERED' : 'JOBS COVERED'}`"));
    assert.doesNotMatch(src, /covered\.size\}\/\$\{LOCKER_JOBS/);
  });
  it('the Screen Guide names the new label', () => {
    assert.ok(guide.includes('JOBS COVERED'));
    assert.doesNotMatch(src + guide, /APPLICATIONS COVERED/);
  });
});
