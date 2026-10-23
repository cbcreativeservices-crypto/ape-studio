/**
 * Owner pass on the Advanced Tuner (CenterLock), 2026-10-23 (approved).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const src = readFileSync(join(import.meta.dirname, '..', 'src', 'screens', 'tools', 'CenterLockTuner.tsx'), 'utf8').replace(/\r\n/g, '\n');

describe('Advanced Tuner owner pass 2026-10-23', () => {
  it('portrait: the close key shares the instrument row only; rows have air', () => {
    assert.match(src, /<View style=\{styles\.barRow1\}>[\s\S]{0,400}\{closeKey\}/);
    assert.match(src, /barRows: \{ gap: 14 \}/);
    // The tuning row is a ROW (a flex: 1 ChipRow in a heightless column collapsed to 0 on a phone).
    assert.match(src, /<View style=\{\[styles\.barRow2, \{ opacity/);
    assert.match(src, /barRow2: \{ flexDirection: 'row' \}/);
    assert.match(src, /barChips: \{ flex: 1, flexDirection: 'row' \}/);
    assert.match(src, /\(landscape \? 6 : 14\)/);
  });
  it('piano only: a HOW TO TUNE chip opens the owner text verbatim', () => {
    assert.match(src, /\{inst\.piano \? \(\n\s*<Chip label="HOW TO TUNE"/);
    assert.ok(src.includes('Most piano notes have three strings that should sound as one. You’ll need piano tuning mutes and a properly fitted tuning lever.'));
    assert.ok(src.includes('Stretch is already included in the app’s targets.'));
    for (const lead of ['Isolate the center string.', 'Tune the center.', 'Match one outer string.', 'Match the remaining string.', 'Check the complete note.']) {
      assert.ok(src.includes(`'${lead}'`), lead);
    }
  });
});
