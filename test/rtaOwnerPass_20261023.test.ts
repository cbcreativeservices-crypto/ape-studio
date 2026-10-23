/**
 * Owner pass on the RTA tool, 2026-10-23 (approved to commit).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const rd = (p: string) => readFileSync(join(import.meta.dirname, '..', ...p.split('/')), 'utf8').replace(/\r\n/g, '\n');
const src = rd('src/screens/tools/RtaScreen.tsx');
const bezel = rd('src/screens/lab/rack/BezelReadouts.tsx');

describe('RTA owner pass 2026-10-23', () => {
  it('tap/drag on the display places a band-reading cursor; the glass no longer toggles capture', () => {
    assert.match(src, /onStartShouldSetResponder=\{\(\) => bands != null && !!onCursorFrac\}/);
    assert.match(src, /tap\/drag to read Hz \+ dB/);
    assert.match(src, /accessibilityLabel="Clear cursor"/);
    assert.doesNotMatch(src, /accessibilityLabel=\{state === 'running' \? 'Tap to stop capture'/);
  });
  it('capture is the CAPTURE key (not MIC) in dock, bezel and full screen', () => {
    assert.match(src, /kind: 'toggle', id: 'mic', label: 'CAPTURE'/);
    assert.match(src, /k: 'CAPTURE'/);
    assert.match(src, /<FsKey key="mic" label="CAPTURE"/);
  });
  it('colour wheel in the display corner', () => {
    assert.match(src, /corner=\{\n\s*<ColorWheelButton/);
  });
  it('LEVEL / PK HOLD frames and the peak ticks share the readout colour', () => {
    assert.match(src, /tint: pkHoldColor,\n\s*frame: pkHoldColor,/);
    assert.match(src, /peakTickColor=\{pkHoldColor\}/);
    assert.match(src, /fill=\{peakTickColor \?\? PEAK_TICK\}/);
    assert.match(bezel, /it\.frame \? \[styles\.cellFramed/);
  });
});
