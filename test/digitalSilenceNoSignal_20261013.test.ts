/**
 * Emulator pass 2026-10-13: a mic delivering pure digital silence must not
 * read as a quiet room — it raises the NO SOUND FROM THE MICROPHONE card.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DIGITAL_SILENCE_DB, NO_SIGNAL_MS, isDigitalSilence, silentInputVerdict } from '../src/features/tools/engine/clipBaseline.ts';

test('the −120 dBFS floor is silence; any real mic self-noise is not', () => {
  assert.equal(isDigitalSilence(-120), true);
  assert.equal(isDigitalSilence(-Infinity), true);
  assert.equal(isDigitalSilence(NaN), true);
  assert.equal(isDigitalSilence(-100), false, 'a very quiet room on a real mic');
  assert.equal(isDigitalSilence(-70), false);
  assert.ok(DIGITAL_SILENCE_DB < -110 && DIGITAL_SILENCE_DB > -120);
});

test('silence must last NO_SIGNAL_MS before the card shows', () => {
  assert.equal(silentInputVerdict(1000, 1000 + NO_SIGNAL_MS - 1), false);
  assert.equal(silentInputVerdict(1000, 1000 + NO_SIGNAL_MS), true);
  assert.equal(silentInputVerdict(0, 999999), false, 'not running');
});

test('useDspEngine keeps watching after the first live frame and clears on sound', () => {
  const src = readFileSync(new URL('../src/features/tools/engine/useDspEngine.ts', import.meta.url), 'utf8');
  assert.match(src, /if \(!isDigitalSilence\(m\.peakDb\)\) \{\s*lastSound = now;\s*setNoSignal\(false\);/);
  assert.match(src, /silentInputVerdict\(lastSound \|\| since, now\)\) \{\s*setNoSignal\(true\);/);
  assert.doesNotMatch(src, /setNoSignal\(false\);\s*clearInterval\(id\);/, 'no longer stops polling at the first live frame');
});
