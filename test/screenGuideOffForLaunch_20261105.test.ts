/**
 * Owner 2026-11-05: the lab help buttons and hint stay off for launch (D52).
 * When the guides meet the student-voice standard, set SCREEN_GUIDES_ON to true
 * and delete this test.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { SCREEN_GUIDES_ON } from '../src/features/lab/screenGuide/types.ts';

const src = readFileSync(new URL('../src/features/lab/screenGuide/ScreenGuide.tsx', import.meta.url), 'utf8').replace(/\r\n/g, '\n');

describe('lab help is off for launch', () => {
  it('the switch is off', () => {
    assert.equal(SCREEN_GUIDES_ON, false);
  });

  it('the button draws nothing while off', () => {
    assert.match(src, /return SCREEN_GUIDES_ON \? <LiveScreenGuideKey title=\{title\} guide=\{guide\} \/> : null;/);
  });

  it('the one-time hint stays hidden while off', () => {
    assert.match(src, /useScreenGuideHintVisible\(\) && !off && SCREEN_GUIDES_ON/);
  });
});
