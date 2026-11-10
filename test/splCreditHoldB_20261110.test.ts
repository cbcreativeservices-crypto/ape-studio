// HOLD B (owner 2026-11-10, "Yes, fix HOLD B"): 85 dB is the SMPTE/THX large-room
// reference; 79 and 82 dB are common small-room practice, never credited to THX.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p: string) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n').replace(/\s+/g, ' ');
const SCREEN = read('src/screens/tools/SplMeterScreen.tsx');
const HELP = read('src/features/lab/guidedLessons/toolHelp.tsx');
const LINE = '85 is the SMPTE / THX reference for large rooms; 79 and 82 are common small-room practice.';

describe('SPL credit (HOLD B)', () => {
  it('the screen legend credits only 85 dB to SMPTE / THX', () => {
    assert.ok(SCREEN.includes(LINE));
    assert.ok(!SCREEN.includes('Holman / SMPTE-THX'));
  });
  it('the help says the same', () => {
    assert.ok(HELP.includes(LINE));
    assert.ok(!HELP.includes('Holman / SMPTE references'));
  });
});
