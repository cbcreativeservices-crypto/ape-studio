/**
 * Labs A — hunt 8 (2026-10-03). Receipts.
 *
 * UNREADABLE IS NOT "NOT STARTED" (owner 2026-10-03, "do 2"; house rule D51).
 * 215d7f25 gave every lab hub and what's-left screen the shared
 * ProgressUnreadableNote. Two end-of-lab faces in this area were missed and
 * still drew the empty stand-in as the learner's record:
 *
 *  1. Cable & Connector Fundamentals, lesson 12 (the lab's what's-left step):
 *     the shell hides its "N/M UNITS" and shows the note above every step,
 *     but lesson 12 itself said "LAB PROGRESS · 0 OF N UNITS CLEARED" and
 *     listed every step "not yet solved" right under that note.
 *  2. Amplifier Principles, Module 8's COMPLETION SUMMARY: every module ○,
 *     "CONCEPTS MASTERED · 0" and "Nothing flagged — every module check you
 *     answered was right on the first pick" — false on a read that failed.
 *     The submit path copies the state ({ ...s }), so the WeakSet mark is
 *     lost on the copy; the screen keeps the flag itself.
 *
 * R2: run against the HEAD lesson12.tsx / mod8Apply.tsx and failed.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');

describe('Cable lab lesson 12: no "0 OF N UNITS CLEARED" on an unreadable read', () => {
  const src = read('src/screens/lab/cable/lessons/lesson12.tsx');
  it('reads the shared unreadable flag', () => {
    assert.match(src, /useLabCompletionUnreadable\(\)/, 'lesson 12 never asks whether the units could be read');
  });
  it('the progress count and the what\'s-left list are not drawn when unreadable', () => {
    const at = src.indexOf('LAB PROGRESS ·');
    assert.ok(at > 0);
    const before = src.slice(Math.max(0, at - 200), at);
    assert.match(before, /unreadable \? null :/, 'the count and every step "not yet solved" still render under the note');
  });
});

describe('Amp Module 8 completion summary: no empty record on an unreadable read', () => {
  const src = read('src/screens/lab/amp/modules/mod8Apply.tsx');
  it('tracks the unreadable flag from the load AND from the submit (whose copy loses the mark)', () => {
    assert.match(src, /import \{[^}]*isAmpProgressUnreadable[^}]*\} from '..\/..\/..\/..\/features\/amp\/ampProgress'/);
    const marks = src.match(/setUnreadable\(isAmpProgressUnreadable\(s\)\)/g) ?? [];
    assert.equal(marks.length, 2, 'both the mount load and the final submit must carry the flag');
  });
  it('the summary shows the shared note and makes no mastered / review / ✓ claim', () => {
    const at = src.indexOf('6 · COMPLETION SUMMARY');
    assert.ok(at > 0);
    const card = src.slice(at, src.indexOf('</Card>', at));
    assert.match(card, /unreadable \? <ProgressUnreadableNote \/> : null/);
    assert.match(card, /unreadable \? '·' : m\.done \? '✓' : '○'/, 'every module still drawn ○ (not done)');
    const nothingFlagged = card.indexOf('Nothing flagged');
    const guard = card.lastIndexOf('{unreadable ? null : (', nothingFlagged);
    assert.ok(guard > 0 && guard < nothingFlagged, '"Nothing flagged … right on the first pick" still claimed on an unread record');
  });
});
