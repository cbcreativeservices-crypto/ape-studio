import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Night pass 1 (lead, 2026-10-01): chapters call `void player.renderAndPlay(...)`,
// so a failed clip load must be caught inside it, not escape as an unhandled
// rejection.
test('tuning renderAndPlay catches a failed play', () => {
  const s = readFileSync('src/features/tuning/tuningAudio.ts', 'utf8');
  const body = s.slice(s.indexOf('async renderAndPlay('), s.indexOf('async renderAndPlay(') + 900);
  assert.match(body, /await this\.play\(make\(\), label\);\s*\} catch \{/);
});
