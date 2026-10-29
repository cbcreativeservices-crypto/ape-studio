/**
 * Owner 2026-10-23: the spectrogram's level colour scale stood vertically
 * beside the raster and read as a second axis for the frequency rows. It is
 * now a horizontal "COLOR = LEVEL" strip under the time axis (quiet left,
 * loud right) in full-screen, matching the portrait strip.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const src = readFileSync(join(import.meta.dirname, '..', 'src', 'screens', 'tools', 'SpectrogramScreen.tsx'), 'utf8').replace(/\r\n/g, '\n');
const fs = src.slice(src.indexOf('const renderFsSpectro'), src.indexOf('return (\n    <View style={[styles.root'));

describe('spectrogram level scale is a horizontal strip', () => {
  it('full-screen has no vertical legend column beside the raster', () => {
    assert.doesNotMatch(fs, /legendW/);
    assert.doesNotMatch(fs, /heatColor\(\(31 - i/);
  });
  it('full-screen shows COLOR = LEVEL with quiet on the left and 0 dB on the right', () => {
    assert.match(fs, /COLOR = LEVEL/);
    assert.match(fs, /\$\{Math\.round\(anchor - dynRange\)\} dB/);
    assert.match(fs, /heatColor\(\(i \+ 0\.5\) \/ 32\)/);
  });
  it('the portrait strip carries the same label', () => {
    assert.match(src, /<View style=\{styles\.legendRow\}>\n\s*<Text style=\{styles\.legendText\}>COLOR = LEVEL<\/Text>/);
  });
});
